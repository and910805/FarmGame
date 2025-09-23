import { CROPS, ANIMALS, BUILDINGS, TOOLS, FARM_SUPPLIES, ANIMAL_PRODUCTS } from '../data/GameCatalog';

export const BASE_FARM_PLOTS = 25;
export const FARM_EXPANSION_BATCH = 5;
export const MAX_FARM_PLOTS = 45;
export const BASE_ANIMAL_CAPACITY = 6;
export const ANIMAL_CAPACITY_STEP = 3;
export const MAX_ANIMAL_CAPACITY = 24;

export const getFarmExpansionCost = (currentPlotCount) => {
  const purchasedBatches = Math.max(0, Math.floor((currentPlotCount - BASE_FARM_PLOTS) / FARM_EXPANSION_BATCH));
  return 500 + purchasedBatches * 200;
};

export const getAnimalHousingExpansionCost = (currentCapacity) => {
  const purchasedSteps = Math.max(0, Math.floor((currentCapacity - BASE_ANIMAL_CAPACITY) / ANIMAL_CAPACITY_STEP));
  return 650 + purchasedSteps * 250;
};

export class GameEngine {
  constructor({ stateRef, setters, notifier }) {
    this.stateRef = stateRef;
    this.setters = setters;
    this.notifier = notifier;
  }

  get state() {
    return this.stateRef.current;
  }

  notify(message, options) {
    if (this.notifier) {
      this.notifier(message, options);
    }
  }

  consumeSupply(supplyType, { keepSelection = false } = {}) {
    this.setters.setFarmSupplies(prev => {
      const previous = prev || {};
      const current = previous[supplyType] || 0;
      return { ...previous, [supplyType]: Math.max(0, current - 1) };
    });

    if (!keepSelection) {
      this.setters.setSelectedSupply(null);
    }
  }

  getGreenhouseCount(buildings = this.state.buildings) {
    if (!buildings) {
      return 0;
    }

    const rawValue = buildings.greenhouse;
    if (typeof rawValue === 'number') {
      return Math.max(0, Math.floor(rawValue));
    }

    if (rawValue) {
      const { farm } = this.state;
      if (Array.isArray(farm)) {
        return farm.reduce((count, plot) => count + (plot.greenhouse ? 1 : 0), 0);
      }
    }

    return 0;
  }

  buySeed(seedType) {
    const { money, marketPrices } = this.state;
    const price = (marketPrices && marketPrices[seedType]) || CROPS[seedType].price;

    if (money >= price) {
      this.setters.setSelectedSupply(null);
      this.setters.setSelectedSeed(seedType);
      this.setters.setShowShop(false);
      this.notify(`準備種植 ${CROPS[seedType].name}，記得找到空地！`, { type: 'success' });
    } else {
      this.notify('金錢不足！', { type: 'error' });
    }
  }

  buySupply(supplyType) {
    const supply = FARM_SUPPLIES[supplyType];
    if (!supply) return;

    const { money } = this.state;
    if (money < supply.price) {
      this.notify('金錢不足，無法購買！', { type: 'error' });
      return;
    }

    this.setters.setMoney(prev => prev - supply.price);
    this.setters.setFarmSupplies(prev => {
      const previous = prev || {};
      return { ...previous, [supplyType]: (previous[supplyType] || 0) + 1 };
    });
    this.setters.setShowSupplyShop(false);
    this.notify(`購買了 ${supply.emoji} ${supply.name}！`, { type: 'success' });
  }

  expandFarm() {
    const { money, farm } = this.state;
    if (!Array.isArray(farm)) return;

    if (farm.length >= MAX_FARM_PLOTS) {
      this.notify('農地已經擴建到極限了！', { type: 'info' });
      return;
    }

    const price = getFarmExpansionCost(farm.length);
    if (money < price) {
      this.notify('金錢不足，暫時無法擴建農地。', { type: 'error' });
      return;
    }

    const plotsToAdd = Math.min(FARM_EXPANSION_BATCH, MAX_FARM_PLOTS - farm.length);
    this.setters.setMoney(prev => prev - price);
    this.setters.setFarm(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const next = [...safePrev];
      const startId = safePrev.reduce((max, plot) => Math.max(max, plot.id ?? -1), -1) + 1;

      for (let i = 0; i < plotsToAdd; i += 1) {
        next.push({
          id: startId + i,
          crop: null,
          plantTime: null,
          watered: false,
          fertilized: false,
          greenhouse: false,
          pest: false,
          pestDays: 0,
          ready: false,
        });
      }

      return next;
    });

    this.notify(`農地擴建完成，新增 ${plotsToAdd} 格土地！`, { type: 'success' });
  }

  expandAnimalHousing() {
    const { money, animalCapacity } = this.state;
    const currentCapacity = Math.max(animalCapacity || BASE_ANIMAL_CAPACITY, BASE_ANIMAL_CAPACITY);

    if (currentCapacity >= MAX_ANIMAL_CAPACITY) {
      this.notify('動物欄位已達上限，無法再擴充。', { type: 'info' });
      return;
    }

    const price = getAnimalHousingExpansionCost(currentCapacity);
    if (money < price) {
      this.notify('金錢不足，暫時無法擴建動物欄。', { type: 'error' });
      return;
    }

    const addedCapacity = Math.min(ANIMAL_CAPACITY_STEP, MAX_ANIMAL_CAPACITY - currentCapacity);

    this.setters.setMoney(prev => prev - price);
    if (typeof this.setters.setAnimalCapacity === 'function') {
      this.setters.setAnimalCapacity(prev => {
        const base = Math.max(prev || BASE_ANIMAL_CAPACITY, BASE_ANIMAL_CAPACITY);
        return Math.min(base + addedCapacity, MAX_ANIMAL_CAPACITY);
      });
    }

    this.notify(`新增 ${addedCapacity} 個動物欄位，快去迎接新伙伴吧！`, { type: 'success' });
  }

  selectSupply(supplyType) {
    if (!FARM_SUPPLIES[supplyType]) {
      this.setters.setSelectedSupply(null);
      return;
    }

    const { selectedSupply } = this.state;
    if (selectedSupply === supplyType) {
      this.setters.setSelectedSupply(null);
      return;
    }

    this.setters.setSelectedSeed(null);
    this.setters.setSelectedSupply(supplyType);
    this.notify(`已選擇 ${FARM_SUPPLIES[supplyType].name}，點擊目標即可使用。`, { type: 'info' });
  }

  applySupply(plotId) {
    const { selectedSupply, farm, farmSupplies } = this.state;
    if (!selectedSupply) return false;

    const supply = FARM_SUPPLIES[selectedSupply];
    if (!supply) {
      this.setters.setSelectedSupply(null);
      return false;
    }

    if (selectedSupply === 'medicine') {
      this.notify('營養劑需要在動物卡片上使用喔！', { type: 'info' });
      this.setters.setSelectedSupply(null);
      return false;
    }

    const plot = farm.find(p => p.id === plotId);
    if (!plot) return false;

    const available = farmSupplies?.[selectedSupply] || 0;
    if (available <= 0) {
      this.notify('用品不足，先去補貨吧！', { type: 'warning' });
      this.setters.setSelectedSupply(null);
      return true;
    }

    if (selectedSupply === 'fertilizer') {
      if (plot.fertilized) {
        this.notify('這塊土地的土壤已經肥沃了！', { type: 'info' });
        return true;
      }

      if (plot.crop && plot.ready) {
        this.notify('作物已成熟，無需再施肥！', { type: 'info' });
        return true;
      }

      this.setters.setFarm(prev => prev.map(p => (
        p.id === plotId
          ? { ...p, fertilized: true }
          : p
      )));
      this.consumeSupply('fertilizer', { keepSelection: available > 1 });
      this.notify('施用了有機肥料，作物成長速度提升！', { type: 'success' });
      return true;
    }

    if (selectedSupply === 'pesticide') {
      if (!plot.pest) {
        this.notify('這塊土地沒有害蟲。', { type: 'info' });
        return true;
      }

      this.setters.setFarm(prev => prev.map(p => (
        p.id === plotId
          ? { ...p, pest: false, pestDays: 0 }
          : p
      )));
      this.consumeSupply('pesticide', { keepSelection: available > 1 });
      this.notify('成功清除害蟲，作物恢復生長！', { type: 'success' });
      return true;
    }

    return false;
  }

  plantSeed(plotId) {
    const { selectedSeed, tools, buildings, energy, money, marketPrices } = this.state;
    if (!selectedSeed) return;

    const price = (marketPrices && marketPrices[selectedSeed]) || CROPS[selectedSeed].price;
    if (money < price) {
      this.notify('金錢不足，無法種植！', { type: 'error' });
      return;
    }

    const energyCost = Math.max(1, 10 - TOOLS[tools].energyReduction - (buildings?.sprinkler ? 5 : 0));
    if (energy < energyCost) {
      this.notify('體力不足！', { type: 'warning' });
      return;
    }

    let planted = false;
    this.setters.setFarm(prev => prev.map(plot => {
      if (plot.id === plotId && !plot.crop) {
        planted = true;
        return { ...plot, crop: selectedSeed, plantTime: Date.now(), watered: false, ready: false, pest: false, pestDays: 0 };
      }
      return plot;
    }));

    if (!planted) {
      this.notify('這塊土地已經有作物了！', { type: 'info' });
      return;
    }

    this.setters.setMoney(prev => prev - price);
    this.setters.setEnergy(prev => Math.max(0, prev - energyCost));
    this.setters.setExperience(prev => prev + 5);
    this.setters.setSelectedSeed(null);
    this.setters.setSelectedSupply(null);
    this.notify(`種植了 ${CROPS[selectedSeed].name}！`, { type: 'success' });
  }

  harvestCrop(plotId) {
    const { farm, marketPrices, buildings } = this.state;
    const plot = farm.find(p => p.id === plotId);
    if (!plot || !plot.ready) return;

    const crop = plot.crop;
    const basePrice = (marketPrices && marketPrices[crop]) || CROPS[crop].sellPrice;

    let bonus = 1;
    if (plot.watered) bonus *= 1.2;
    if (plot.greenhouse) bonus *= 1.5;
    if (buildings?.silo) bonus *= 1.1;

    const sellPrice = Math.floor(basePrice * bonus);

    this.setters.setMoney(prev => prev + sellPrice);
    this.setters.setInventory(prev => ({
      ...prev,
      [crop]: ((prev && prev[crop]) || 0) + 1,
    }));
    this.setters.setExperience(prev => prev + 10);
    this.setters.setFarm(prev => prev.map(p => (
      p.id === plotId
        ? {
            ...p,
            crop: null,
            plantTime: null,
            watered: false,
            ready: false,
            pest: false,
            pestDays: 0,
            fertilized: false,
          }
        : p
    )));

    this.notify(`收成了 ${CROPS[crop].emoji}！獲得 $${sellPrice}`, { type: 'success' });
  }

  waterPlot(plotId) {
    const { energy, buildings } = this.state;
    const energyCost = buildings?.sprinkler ? 1 : 5;
    if (energy < energyCost) {
      this.notify('體力不足，無法澆水！', { type: 'warning' });
      return;
    }

    this.setters.setFarm(prev => prev.map(plot =>
      plot.id === plotId && plot.crop && !plot.watered
        ? { ...plot, watered: true }
        : plot
    ));

    this.setters.setEnergy(prev => Math.max(0, prev - energyCost));
    this.notify('澆水完成！', { type: 'success' });
  }

  buyAnimal(animalType) {
    const { money, animals = [], animalCapacity } = this.state;
    const animal = ANIMALS[animalType];
    const requiredShelter = animal.shelter;

    if (requiredShelter && !this.state.buildings?.[requiredShelter]) {
      const shelterName = BUILDINGS[requiredShelter].name;
      this.notify(`需要先建造 ${shelterName} 才能飼養 ${animal.name}！`, { type: 'warning' });
      return;
    }

    const capacityLimit = Math.max(animalCapacity || BASE_ANIMAL_CAPACITY, BASE_ANIMAL_CAPACITY);
    if ((animals?.length || 0) >= capacityLimit) {
      this.notify('動物欄位已滿，請先擴建或整理空間。', { type: 'warning' });
      return;
    }

    if (money >= animal.price) {
      this.setters.setMoney(prev => prev - animal.price);
      this.setters.setAnimals(prev => [...prev, {
        id: Date.now(),
        type: animalType,
        happiness: animal.happiness,
        hunger: 70,
        lastFed: Date.now(),
        sick: false,
        name: `${animal.name}${prev.filter(a => a.type === animalType).length + 1}`,
      }]);
      this.setters.setShowAnimalShop(false);
      this.notify(`購買了 ${animal.emoji} ${animal.name}！`, { type: 'success' });
    } else {
      this.notify('金錢不足！', { type: 'error' });
    }
  }

  buyBuilding(buildingType) {
    const { money, buildings, farm, pendingGreenhousePlacement } = this.state;
    const building = BUILDINGS[buildingType];

    if (!building) {
      return;
    }

    if (buildingType === 'greenhouse') {
      if (pendingGreenhousePlacement) {
        this.notify('已經購買溫室模組，請先在農地上選擇位置。', { type: 'info' });
        return;
      }

      const availablePlots = Array.isArray(farm)
        ? farm.filter(plot => !plot.greenhouse)
        : [];

      if (availablePlots.length === 0) {
        this.notify('所有農地都已升級為溫室囉！', { type: 'info' });
        return;
      }

      if (money < building.price) {
        this.notify('金錢不足，暫時無法購買溫室模組。', { type: 'error' });
        return;
      }

      this.setters.setMoney(prev => prev - building.price);
      if (typeof this.setters.setPendingGreenhousePlacement === 'function') {
        this.setters.setPendingGreenhousePlacement(true);
      }
      this.setters.setShowBuildingShop(false);
      this.notify('溫室模組準備就緒，請點選一格農地完成建造。', { type: 'success' });
      return;
    }

    if (buildings?.[buildingType]) {
      this.notify('已經擁有此建築！', { type: 'info' });
      return;
    }

    if (money >= building.price) {
      this.setters.setMoney(prev => prev - building.price);
      this.setters.setBuildings(prev => ({ ...prev, [buildingType]: true }));

      this.setters.setShowBuildingShop(false);
      this.notify(`建造了 ${building.emoji} ${building.name}！`, { type: 'success' });
    } else {
      this.notify('金錢不足！', { type: 'error' });
    }
  }

  placeGreenhouse(plotId) {
    const { pendingGreenhousePlacement, farm } = this.state;
    if (!pendingGreenhousePlacement) {
      return false;
    }

    if (!Array.isArray(farm) || farm.length === 0) {
      this.notify('目前沒有可用的農地資料，稍後再試試看。', { type: 'warning' });
      return true;
    }

    const targetPlot = farm.find(plot => plot.id === plotId);
    if (!targetPlot) {
      this.notify('無法在這裡建造溫室。', { type: 'error' });
      return true;
    }

    if (targetPlot.greenhouse) {
      this.notify('這塊土地已經是溫室囉！', { type: 'info' });
      return true;
    }

    let built = false;
    this.setters.setFarm(prev => prev.map(plot => {
      if (plot.id === plotId && !plot.greenhouse) {
        built = true;
        return { ...plot, greenhouse: true };
      }
      return plot;
    }));

    if (!built) {
      this.notify('暫時無法建造，請確認土地是否空閒。', { type: 'warning' });
      return true;
    }

    if (typeof this.setters.setPendingGreenhousePlacement === 'function') {
      this.setters.setPendingGreenhousePlacement(false);
    }

    if (typeof this.setters.setBuildings === 'function') {
      this.setters.setBuildings(prev => {
        const previous = prev || {};
        const count = this.getGreenhouseCount(previous);
        return { ...previous, greenhouse: count + 1 };
      });
    }

    this.notify('溫室建造完成，這格土地不再受天氣影響！', { type: 'success' });
    return true;
  }

  buyTool(toolType) {
    const { money, tools } = this.state;
    const tool = TOOLS[toolType];

    if (tools === toolType) return;

    if (money >= tool.price) {
      this.setters.setMoney(prev => prev - tool.price);
      this.setters.setTools(toolType);
      this.setters.setShowToolShop(false);
      this.notify(`升級工具：${tool.name}！`, { type: 'success' });
    } else {
      this.notify('金錢不足！', { type: 'error' });
    }
  }

  getInventorySaleValue(itemKey, quantity) {
    const count = quantity ?? (this.state.inventory?.[itemKey] || 0);
    if (!count || count <= 0) {
      return 0;
    }

    if (CROPS[itemKey]) {
      const { marketPrices } = this.state;
      const basePrice = (marketPrices && marketPrices[itemKey]) || CROPS[itemKey].sellPrice;
      return Math.max(0, Math.floor(basePrice * count));
    }

    const product = ANIMAL_PRODUCTS[itemKey];
    if (!product) {
      return 0;
    }

    const { buildings, animals } = this.state;
    const animalType = product.animal;
    let multiplier = 1;

    if (animalType && ANIMALS[animalType]) {
      const animalData = ANIMALS[animalType];
      const shelterKey = animalData.shelter;
      if (shelterKey && buildings?.[shelterKey]) {
        multiplier *= BUILDINGS[shelterKey].boost || 1;
      }

      const ownedAnimals = (animals || []).filter(a => a.type === animalType);
      if (ownedAnimals.length > 0) {
        const totalHappiness = ownedAnimals.reduce((sum, current) => sum + (current.happiness ?? animalData.happiness ?? 50), 0);
        const averageHappiness = totalHappiness / ownedAnimals.length;
        const happinessFactor = 0.6 + (averageHappiness / 150);
        multiplier *= Math.max(0.6, Math.min(1.6, happinessFactor));
      } else {
        multiplier *= 0.6;
      }
    }

    return Math.max(0, Math.floor(product.basePrice * multiplier * count));
  }

  sellInventoryItem(itemKey, { quantity } = {}) {
    const inventory = this.state.inventory || {};
    const available = inventory[itemKey] || 0;
    if (!available || available <= 0) {
      this.notify('庫存不足，無法出售。', { type: 'warning' });
      return;
    }

    const amountToSell = Math.min(quantity ?? available, available);
    const saleValue = this.getInventorySaleValue(itemKey, amountToSell);
    if (saleValue <= 0) {
      this.notify('這些物品目前沒有買家。', { type: 'info' });
      return;
    }

    this.setters.setInventory(prev => ({
      ...prev,
      [itemKey]: Math.max(0, (prev?.[itemKey] || 0) - amountToSell),
    }));

    this.setters.setMoney(prev => prev + saleValue);

    const product = ANIMAL_PRODUCTS[itemKey];
    if (product) {
      this.notify(`出售了 ${amountToSell} 份${product.name}，獲得 $${saleValue}！`, { type: 'success' });
    } else if (CROPS[itemKey]) {
      this.notify(`出售了 ${amountToSell} 份${CROPS[itemKey].name}，獲得 $${saleValue}！`, { type: 'success' });
    } else {
      this.notify(`出售物品獲得 $${saleValue}！`, { type: 'success' });
    }
  }

  feedAnimal(animalId) {
    const { animals, money } = this.state;
    const animal = animals.find(a => a.id === animalId);
    if (!animal) return;

    const cost = ANIMALS[animal.type].foodCost;
    if (money < cost) {
      this.notify('金錢不足，無法購買飼料！', { type: 'error' });
      return;
    }

    const currentHunger = animal.hunger ?? 50;
    if (currentHunger >= 95) {
      this.notify(`${animal.name} 已經吃得很飽囉！`, { type: 'info' });
      return;
    }

    this.setters.setMoney(prev => prev - cost);
    this.setters.setAnimals(prev => prev.map(a =>
      a.id === animalId
        ? {
            ...a,
            happiness: Math.min(100, (a.happiness ?? ANIMALS[a.type].happiness) + 20),
            hunger: Math.min(100, currentHunger + 40),
            lastFed: Date.now(),
          }
        : a
    ));
    this.notify(`餵食了 ${animal.name}！`, { type: 'success' });
  }

  treatAnimal(animalId) {
    const { animals, farmSupplies } = this.state;
    const animal = animals.find(a => a.id === animalId);
    if (!animal) return;

    const medicineCount = farmSupplies?.medicine || 0;
    if (medicineCount <= 0) {
      this.notify('沒有營養劑可用，記得先去補貨！', { type: 'warning' });
      this.setters.setSelectedSupply(null);
      return;
    }

    if (!animal.sick) {
      this.notify(`${animal.name} 狀態良好，暫時不需要治療。`, { type: 'info' });
      return;
    }

    this.setters.setAnimals(prev => prev.map(a =>
      a.id === animalId
        ? {
            ...a,
            sick: false,
            happiness: Math.min(100, (a.happiness ?? ANIMALS[a.type].happiness) + 25),
          }
        : a
    ));

    this.consumeSupply('medicine', { keepSelection: medicineCount > 1 });
    this.notify(`已替 ${animal.name} 使用營養劑，狀況好多了！`, { type: 'success' });
  }
}

