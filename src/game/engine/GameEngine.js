import { CROPS, ANIMALS, BUILDINGS, TOOLS, FARM_SUPPLIES, ANIMAL_PRODUCTS } from '../data/GameCatalog';

export const BASE_FARM_PLOTS = 25;
export const FARM_EXPANSION_BATCH = 1;
export const MAX_FARM_PLOTS = 45;
export const BASE_ANIMAL_CAPACITY = 6;
export const ANIMAL_CAPACITY_STEP = 1;
export const MAX_ANIMAL_CAPACITY = 24;

export const getFarmExpansionCost = (currentPlotCount) => {
  if (currentPlotCount >= MAX_FARM_PLOTS) {
    return null;
  }
  const expansionsPurchased = Math.max(0, currentPlotCount - BASE_FARM_PLOTS);
  return 1000 + (expansionsPurchased * 250);
};

export const getAnimalHousingExpansionCost = (currentCapacity) => {
  if (currentCapacity >= MAX_ANIMAL_CAPACITY) {
    return null;
  }
  return 2500;
};

export const BUILDING_UPGRADES = {
  sprinkler: [
    { level: 1, cost: 650, coverage: 12, manualWaterCost: 3, plantingDiscount: 3, description: '覆蓋 12 格農地，自動補水並減少播種體力。' },
    { level: 2, cost: 900, coverage: 24, manualWaterCost: 2, plantingDiscount: 4, description: '覆蓋範圍擴大至 24 格，澆水幾乎不費力。' },
    { level: 3, cost: 1400, coverage: 36, manualWaterCost: 1, plantingDiscount: 5, description: '灌溉到 36 格農地並極大幅度節省體力。' },
    { level: 4, cost: 2200, coverage: MAX_FARM_PLOTS, manualWaterCost: 1, plantingDiscount: 6, description: '全區自動灌溉，維持土壤最佳濕度。' },
  ],
  silo: [
    { level: 1, cost: 800, sellBonus: 0.05, description: '作物售價 +5%，減少腐壞。' },
    { level: 2, cost: 1200, sellBonus: 0.1, description: '作物售價 +10%，可長期保存。' },
    { level: 3, cost: 1800, sellBonus: 0.18, description: '作物售價 +18%，高效率倉儲。' },
  ],
  barn: [
    { level: 1, cost: 1000, boost: 1.2, description: '提供牛羊穩定環境，提升產量。' },
    { level: 2, cost: 1500, boost: 1.35, description: '擴增飼槽與溫控，提高品質。' },
    { level: 3, cost: 2200, boost: 1.5, description: '頂級穀倉，讓牛羊更快樂。' },
  ],
  chickenCoop: [
    { level: 1, cost: 500, boost: 1.3, description: '舒適雞舍，提升產蛋率。' },
    { level: 2, cost: 850, boost: 1.45, description: '自動餵食設備維持穩定產量。' },
    { level: 3, cost: 1200, boost: 1.6, description: '氣候調節雞舍，全年高產。' },
  ],
  pigPen: [
    { level: 1, cost: 400, boost: 1.2, description: '泥土樂園讓豬豬更放鬆。' },
    { level: 2, cost: 700, boost: 1.35, description: '增設噴霧與運動空間，提升肉質。' },
  ],
  pond: [
    { level: 1, cost: 600, boost: 1.3, description: '自然池塘讓水鳥安心棲息。' },
    { level: 2, cost: 950, boost: 1.45, description: '擴建浮台與遮蔭範圍。' },
  ],
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

  emitQuestEvent(event) {
    if (typeof this.setters.recordQuestEvent === 'function') {
      this.setters.recordQuestEvent(event);
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

  getBuildingLevel(buildings = this.state.buildings, key) {
    if (!buildings) {
      return 0;
    }

    const value = buildings[key];
    if (typeof value === 'number') {
      return Math.max(0, Math.floor(value));
    }

    return value ? 1 : 0;
  }

  getBuildingUpgradeInfo(key, level) {
    const upgrades = BUILDING_UPGRADES[key];
    if (!upgrades) {
      return null;
    }

    return upgrades.find(entry => entry.level === level) || null;
  }

  getNextBuildingUpgrade(key, currentLevel) {
    const upgrades = BUILDING_UPGRADES[key];
    if (!upgrades) {
      return null;
    }

    return upgrades.find(entry => entry.level === currentLevel + 1) || null;
  }

  getSprinklerLevel(buildings = this.state.buildings) {
    return this.getBuildingLevel(buildings, 'sprinkler');
  }

  getSprinklerCoverage(buildings = this.state.buildings) {
    const level = this.getSprinklerLevel(buildings);
    if (level <= 0) {
      return 0;
    }

    const info = this.getBuildingUpgradeInfo('sprinkler', level);
    return info?.coverage ?? 0;
  }

  getSprinklerManualWaterCost() {
    const level = this.getSprinklerLevel();
    if (level <= 0) {
      return 5;
    }

    const info = this.getBuildingUpgradeInfo('sprinkler', level);
    if (info && typeof info.manualWaterCost === 'number') {
      return Math.max(1, info.manualWaterCost);
    }

    return 2;
  }

  getSprinklerPlantingDiscount() {
    const level = this.getSprinklerLevel();
    if (level <= 0) {
      return 0;
    }

    const info = this.getBuildingUpgradeInfo('sprinkler', level);
    if (info && typeof info.plantingDiscount === 'number') {
      return Math.max(0, info.plantingDiscount);
    }

    return 3;
  }

  getSiloBonus(buildings = this.state.buildings) {
    const level = this.getBuildingLevel(buildings, 'silo');
    if (level <= 0) {
      return 0;
    }

    const info = this.getBuildingUpgradeInfo('silo', level);
    return info?.sellBonus ?? 0;
  }

  getShelterBoost(buildings = this.state.buildings, shelterKey) {
    if (!shelterKey) {
      return 1;
    }

    const level = this.getBuildingLevel(buildings, shelterKey);
    if (level <= 0) {
      return 1;
    }

    const info = this.getBuildingUpgradeInfo(shelterKey, level);
    if (info && typeof info.boost === 'number') {
      return info.boost;
    }

    const building = BUILDINGS[shelterKey];
    return building?.boost ?? 1;
  }

  getToolUpgradeLevel(toolKey = this.state.tools) {
    const { toolLevels } = this.state;
    if (!toolKey) {
      return 0;
    }

    if (!toolLevels || typeof toolLevels !== 'object') {
      return 0;
    }

    const raw = toolLevels[toolKey];
    if (typeof raw !== 'number') {
      return 0;
    }

    return Math.max(0, Math.floor(raw));
  }

  getEffectiveToolStats(toolKey = this.state.tools) {
    const baseTool = TOOLS[toolKey] || TOOLS.basic;
    const level = this.getToolUpgradeLevel(toolKey);
    const speedBonus = baseTool.speedUpgrade || 0;
    const energyBonus = baseTool.energyUpgrade || 0;

    const speedBoost = (baseTool.speedBoost || 1) + (level * speedBonus);
    const energyReduction = (baseTool.energyReduction || 0) + (level * energyBonus);

    return {
      ...baseTool,
      level,
      speedBoost,
      energyReduction,
    };
  }

  getSeedKey(seedType) {
    return `seed_${seedType}`;
  }

  prepareSeed(seedType) {
    const crop = CROPS[seedType];
    if (!crop) {
      this.notify('找不到這種種子。', { type: 'error' });
      return;
    }

    const { money, marketPrices, inventory } = this.state;
    const price = (marketPrices && marketPrices[seedType]) || crop.price;
    const seedKey = this.getSeedKey(seedType);
    const storedSeeds = inventory?.[seedKey] || 0;

    if (storedSeeds <= 0 && money < price) {
      this.notify('金錢不足，無法準備種植。', { type: 'error' });
      return;
    }

    this.setters.setSelectedSupply(null);
    this.setters.setSelectedSeed(seedType);
    this.notify(`已準備 ${crop.emoji} ${crop.name} 種子，點擊空地即可種植。`, { type: 'success' });
  }

  purchaseSeeds(seedType, quantity = 1) {
    const crop = CROPS[seedType];
    if (!crop) {
      this.notify('找不到這種種子。', { type: 'error' });
      return;
    }

    const amount = Math.max(1, Math.floor(quantity));
    const { money, marketPrices } = this.state;
    const price = (marketPrices && marketPrices[seedType]) || crop.price;
    const totalCost = price * amount;

    if (money < totalCost) {
      this.notify('金錢不足，無法購買種子。', { type: 'error' });
      return;
    }

    const seedKey = this.getSeedKey(seedType);
    this.setters.setMoney(prev => prev - totalCost);
    this.setters.setInventory(prev => ({
      ...prev,
      [seedKey]: (prev?.[seedKey] || 0) + amount,
    }));
    if (typeof this.setters.setFarmSupplies === 'function') {
      this.setters.setFarmSupplies(prev => {
        const previous = prev || {};
        const current = previous[seedKey] || 0;
        return { ...previous, [seedKey]: current + amount };
      });
    }
    this.setters.setSelectedSupply(null);
    this.setters.setSelectedSeed(seedType);
    this.notify(`購買了 ${amount} 包${crop.name}種子，已存入農務用品區，可隨時備用。`, { type: 'success' });
  }

  buySeed(seedType, options) {
    if (options && typeof options.quantity === 'number') {
      this.purchaseSeeds(seedType, options.quantity);
    } else {
      this.prepareSeed(seedType);
    }
  }

  buySupply(supplyType, options = {}) {
    const supply = FARM_SUPPLIES[supplyType];
    if (!supply) return;

    const quantity = Math.max(1, Math.floor(options.quantity ?? 1));
    const totalCost = supply.price * quantity;
    const { money } = this.state;
    if (money < totalCost) {
      this.notify('金錢不足，無法購買！', { type: 'error' });
      return;
    }

    this.setters.setMoney(prev => prev - totalCost);
    this.setters.setFarmSupplies(prev => {
      const previous = prev || {};
      return { ...previous, [supplyType]: (previous[supplyType] || 0) + quantity };
    });
    this.notify(`購買了 ${quantity} 份${supply.name}！`, { type: 'success' });
  }

  expandFarm() {
    const { money, farm } = this.state;
    if (!Array.isArray(farm)) return;

    if (farm.length >= MAX_FARM_PLOTS) {
      this.notify('農地已經擴建到極限了！', { type: 'info' });
      return;
    }

    const price = getFarmExpansionCost(farm.length);
    if (price == null) {
      this.notify('農地目前無法擴建。', { type: 'info' });
      return;
    }
    if (money < price) {
      this.notify('金錢不足，暫時無法擴建農地。', { type: 'error' });
      return;
    }

    const plotsToAdd = Math.min(FARM_EXPANSION_BATCH, MAX_FARM_PLOTS - farm.length);
    let resultingSize = farm.length;
    const sprinklerLevel = this.getSprinklerLevel();
    const coverage = this.getSprinklerCoverage();
    const wasCovered = farm.length <= coverage;
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

      resultingSize = next.length;
      return next;
    });

    this.notify(`農地擴建完成，新增 ${plotsToAdd} 格土地！`, { type: 'success' });

    if (sprinklerLevel > 0 && coverage > 0 && wasCovered && resultingSize > coverage) {
      this.notify(`🚿 自動灑水器目前僅能覆蓋 ${coverage} 格，記得升級避免作物缺水。`, { type: 'warning' });
    }
  }

  expandAnimalHousing() {
    const { money, animalCapacity } = this.state;
    const currentCapacity = Math.max(animalCapacity || BASE_ANIMAL_CAPACITY, BASE_ANIMAL_CAPACITY);

    if (currentCapacity >= MAX_ANIMAL_CAPACITY) {
      this.notify('動物欄位已達上限，無法再擴充。', { type: 'info' });
      return;
    }

    const price = getAnimalHousingExpansionCost(currentCapacity);
    if (price == null) {
      this.notify('暫時無法擴建動物欄。', { type: 'info' });
      return;
    }
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
      this.emitQuestEvent({ type: 'pestClear', amount: 1 });
      return true;
    }

    return false;
  }

  plantSeed(plotId) {
    const { selectedSeed, tools, energy, money, marketPrices, inventory, season, farm } = this.state;
    if (!selectedSeed) return;

    const price = (marketPrices && marketPrices[selectedSeed]) || CROPS[selectedSeed].price;
    const seedKey = this.getSeedKey(selectedSeed);
    const storedSeeds = inventory?.[seedKey] || 0;
    const usingStoredSeed = storedSeeds > 0;
    const existingPlot = Array.isArray(farm) ? farm.find(plot => plot.id === plotId) : null;
    const isGreenhousePlot = existingPlot?.greenhouse;

    if (!usingStoredSeed && money < price) {
      this.notify('金錢不足，無法種植！', { type: 'error' });
      return;
    }

    const irrigationDiscount = this.getSprinklerPlantingDiscount();
    const toolStats = this.getEffectiveToolStats(tools);
    const energyCost = Math.max(1, 10 - toolStats.energyReduction - irrigationDiscount);
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

    let remainingSeeds = storedSeeds;
    let remainingMoney = money;
    if (usingStoredSeed) {
      let nextSeedCount = Math.max(0, storedSeeds - 1);
      this.setters.setInventory(prev => {
        const previous = prev?.[seedKey] || 0;
        const updated = Math.max(0, previous - 1);
        nextSeedCount = updated;
        return { ...prev, [seedKey]: updated };
      });

      const currentInventory = { ...(this.stateRef.current.inventory || {}) };
      currentInventory[seedKey] = nextSeedCount;
      this.stateRef.current.inventory = currentInventory;
      remainingSeeds = nextSeedCount;

      if (typeof this.setters.setFarmSupplies === 'function') {
        let nextSupplyCount = null;
        this.setters.setFarmSupplies(prev => {
          const previous = prev || {};
          const current = previous[seedKey] || 0;
          const updated = Math.max(0, current - 1);
          nextSupplyCount = updated;
          return { ...previous, [seedKey]: updated };
        });

        if (nextSupplyCount !== null) {
          const currentSupplies = { ...(this.stateRef.current.farmSupplies || {}) };
          currentSupplies[seedKey] = nextSupplyCount;
          this.stateRef.current.farmSupplies = currentSupplies;
        }
      }
    } else {
      let nextMoney = Math.max(0, money - price);
      this.setters.setMoney(prev => {
        const updated = Math.max(0, prev - price);
        nextMoney = updated;
        return updated;
      });
      remainingMoney = nextMoney;
      this.stateRef.current.money = nextMoney;
    }

    let nextEnergy = Math.max(0, energy - energyCost);
    this.setters.setEnergy(prev => {
      const updated = Math.max(0, prev - energyCost);
      nextEnergy = updated;
      return updated;
    });
    this.stateRef.current.energy = nextEnergy;
    this.setters.setExperience(prev => prev + 5);

    const canContinuePlanting = usingStoredSeed
      ? remainingSeeds > 0
      : remainingMoney >= price;

    if (!canContinuePlanting) {
      this.setters.setSelectedSeed(null);
    }

    this.setters.setSelectedSupply(null);
    const crop = CROPS[selectedSeed];
    if (crop?.seasonBonus) {
      const seasonBoost = isGreenhousePlot ? 1 : (crop.seasonBonus[season] ?? 1);
      if (seasonBoost > 1.05) {
        this.notify(`種植了 ${crop.name}！這個季節特別適合，成長速度更快！`, { type: 'success' });
      } else if (seasonBoost < 0.9) {
        this.notify(`種植了 ${crop.name}，但這個季節氣候不利，成長會較慢。`, { type: 'warning' });
      } else {
        this.notify(`種植了 ${crop.name}！`, { type: 'success' });
      }
    } else {
      this.notify(`種植了 ${crop?.name || selectedSeed}！`, { type: 'success' });
    }
  }

  harvestCrop(plotId) {
    const { farm, marketPrices, buildings, season } = this.state;
    const plot = farm.find(p => p.id === plotId);
    if (!plot || !plot.ready) return;

    const crop = plot.crop;
    const basePrice = (marketPrices && marketPrices[crop]) || CROPS[crop].sellPrice;

    let bonus = 1;
    if (plot.watered) bonus *= 1.2;
    if (plot.greenhouse) bonus *= 1.5;
    if (buildings?.silo) bonus *= 1.1;
    const cropInfo = CROPS[crop];
    if (cropInfo?.seasonBonus) {
      const seasonBoost = cropInfo.seasonBonus[season] ?? 1;
      bonus *= seasonBoost;
    }

    const sellPrice = Math.floor(basePrice * bonus);

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

    this.notify(`收成了 ${CROPS[crop].emoji}！已存入倉庫（估值 $${sellPrice}）。`, { type: 'success' });
    this.emitQuestEvent({ type: 'harvest', crop, amount: 1 });
  }

  waterPlot(plotId) {
    const { energy } = this.state;
    const energyCost = this.getSprinklerManualWaterCost();
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

  buyAnimal(animalType, options = {}) {
    const { money, animals = [], animalCapacity } = this.state;
    const animal = ANIMALS[animalType];
    const requiredShelter = animal.shelter;

    if (requiredShelter && this.getBuildingLevel(this.state.buildings, requiredShelter) <= 0) {
      const shelterName = BUILDINGS[requiredShelter].name;
      this.notify(`需要先建造 ${shelterName} 才能飼養 ${animal.name}！`, { type: 'warning' });
      return;
    }

    const capacityLimit = Math.max(animalCapacity || BASE_ANIMAL_CAPACITY, BASE_ANIMAL_CAPACITY);
    const existingCount = animals?.length || 0;
    const availableSlots = Math.max(0, capacityLimit - existingCount);
    if (availableSlots <= 0) {
      this.notify('動物欄位已滿，請先擴建或整理空間。', { type: 'warning' });
      return;
    }

    const requestedQuantity = Math.max(1, Math.floor(options.quantity ?? 1));
    const affordable = Math.floor(money / animal.price);
    const purchasable = Math.min(requestedQuantity, availableSlots, affordable);

    if (purchasable <= 0) {
      this.notify('金錢不足，無法購買！', { type: 'error' });
      return;
    }

    this.setters.setMoney(prev => prev - (animal.price * purchasable));
    this.setters.setAnimals(prev => {
      const prevList = Array.isArray(prev) ? prev : [];
      const baseIndex = prevList.filter(a => a.type === animalType).length;
      const timestamp = Date.now();
      const additions = Array.from({ length: purchasable }, (_, index) => ({
        id: timestamp + index,
        type: animalType,
        happiness: animal.happiness,
        hunger: 70,
        lastFed: Date.now(),
        sick: false,
        sicknessDays: 0,
        name: `${animal.name}${baseIndex + index + 1}`,
        productReady: 0,
      }));
      return [...prevList, ...additions];
    });

    const label = purchasable > 1 ? `${purchasable} 隻${animal.name}` : `${animal.name}`;
    this.notify(`購買了 ${animal.emoji} ${label}！`, { type: 'success' });
  }

  slaughterAnimal(animalId) {
    const { animals } = this.state;
    if (!Array.isArray(animals) || animals.length === 0) {
      this.notify('目前沒有可處理的動物。', { type: 'info' });
      return;
    }

    const animal = animals.find(a => a.id === animalId);
    if (!animal) {
      this.notify('找不到這隻動物。', { type: 'error' });
      return;
    }

    const animalData = ANIMALS[animal.type];
    const butcher = animalData?.butcher;
    if (!butcher || !butcher.product) {
      this.notify('這類動物無法進行屠宰。', { type: 'warning' });
      return;
    }

    if (animalData.product) {
      const readyAmount = Math.max(0, Math.floor(animal.productReady || 0));
      if (readyAmount > 0) {
        const readyProduct = ANIMAL_PRODUCTS[animalData.product];
        this.setters.setInventory(prev => ({
          ...prev,
          [animalData.product]: (prev?.[animalData.product] || 0) + readyAmount,
        }));
        const readyLabel = readyProduct ? readyProduct.name : '產物';
        this.notify(`在處理 ${animal.name} 前，先收集了 ${readyLabel} x${readyAmount}。`, { type: 'info' });
      }
    }

    const product = ANIMAL_PRODUCTS[butcher.product];
    const amount = Math.max(1, Math.floor(butcher.amount || 1));

    this.setters.setAnimals(prev => prev.filter(a => a.id !== animalId));
    if (product) {
      this.setters.setInventory(prev => ({
        ...prev,
        [product.key]: (prev?.[product.key] || 0) + amount,
      }));
      this.notify(`已將 ${animal.name} 屠宰並獲得 ${product.name} x${amount}。`, { type: 'warning' });
    } else {
      this.notify(`已將 ${animal.name} 屠宰。`, { type: 'warning' });
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

    const currentLevel = this.getBuildingLevel(buildings, buildingType);
    const upgradeInfo = this.getNextBuildingUpgrade(buildingType, currentLevel);
    if (upgradeInfo) {
      if (money < upgradeInfo.cost) {
        this.notify('金錢不足，暫時無法升級建築。', { type: 'error' });
        return;
      }

      this.setters.setMoney(prev => prev - upgradeInfo.cost);
      this.setters.setBuildings(prev => ({
        ...prev,
        [buildingType]: upgradeInfo.level,
      }));

      this.setters.setShowBuildingShop(false);
      const action = currentLevel > 0 ? '升級' : '建造';
      this.notify(`${action}了 ${building.emoji} ${building.name}（Lv${upgradeInfo.level}）！`, { type: 'success' });

      const detail = buildingType === 'sprinkler'
        ? `自動灑水範圍提升至 ${upgradeInfo.coverage} 格。`
        : upgradeInfo.description;
      if (detail) {
        this.notify(detail, { type: 'info' });
      }
      return;
    }

    if (currentLevel > 0) {
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

  buyTool(toolType, options = {}) {
    const { money, tools, ownedTools } = this.state;
    const tool = TOOLS[toolType];
    if (!tool) {
      this.notify('找不到這項工具。', { type: 'error' });
      return;
    }

    const ownedSet = new Set(Array.isArray(ownedTools) ? ownedTools : []);
    const wantsUpgrade = Boolean(options.upgrade);

    if (ownedSet.has(toolType)) {
      if (wantsUpgrade) {
        if (!tool.upgradeCost) {
          this.notify('這項工具無法再升級。', { type: 'info' });
          return;
        }

        const currentLevel = this.getToolUpgradeLevel(toolType);
        const nextLevel = currentLevel + 1;
        const cost = tool.upgradeCost;
        if (money < cost) {
          this.notify('金錢不足，暫時無法升級工具。', { type: 'error' });
          return;
        }

        const nextSpeed = (tool.speedBoost || 1) + (tool.speedUpgrade || 0) * nextLevel;
        const nextEnergy = (tool.energyReduction || 0) + (tool.energyUpgrade || 0) * nextLevel;

        this.setters.setMoney(prev => prev - cost);
        if (typeof this.setters.setToolLevels === 'function') {
          this.setters.setToolLevels(prev => {
            const previous = prev && typeof prev === 'object' ? prev : {};
            const current = previous[toolType] || 0;
            return { ...previous, [toolType]: current + 1 };
          });
        }
        this.setters.setTools(toolType);
        this.notify(`升級 ${tool.name} 至 Lv.${nextLevel + 1}！速度提升至 ${Math.round(nextSpeed * 100)}%，體力節省 ${Math.round(nextEnergy)}。`, { type: 'success' });
        return;
      }

      if (tools === toolType) {
        this.notify('已經裝備這項工具囉！', { type: 'info' });
      } else {
        this.setters.setTools(toolType);
        this.notify(`切換為 ${tool.name}。`, { type: 'success' });
      }
      this.setters.setShowToolShop(false);
      return;
    }

    if (wantsUpgrade) {
      this.notify('需要先購買這項工具，才能升級。', { type: 'warning' });
      return;
    }

    if (money < tool.price) {
      this.notify('金錢不足！', { type: 'error' });
      return;
    }

    this.setters.setMoney(prev => prev - tool.price);
    this.setters.setTools(toolType);
    if (typeof this.setters.setOwnedTools === 'function') {
      this.setters.setOwnedTools(prev => {
        const prevList = Array.isArray(prev) ? prev : [];
        if (prevList.includes(toolType)) {
          return prevList;
        }
        return [...prevList, toolType];
      });
    }
    if (typeof this.setters.setToolLevels === 'function') {
      this.setters.setToolLevels(prev => {
        const previous = prev && typeof prev === 'object' ? prev : {};
        if (toolType in previous) {
          return previous;
        }
        return { ...previous, [toolType]: 0 };
      });
    }
    this.setters.setShowToolShop(false);
    this.notify(`購買並裝備 ${tool.name}！`, { type: 'success' });
  }

  getInventorySaleValue(itemKey, quantity) {
    const count = quantity ?? (this.state.inventory?.[itemKey] || 0);
    if (!count || count <= 0) {
      return 0;
    }

    if (itemKey.startsWith('seed_')) {
      const cropKey = itemKey.replace('seed_', '');
      const crop = CROPS[cropKey];
      if (!crop) {
        return 0;
      }
      const price = (this.state.marketPrices && this.state.marketPrices[cropKey]) || crop.price;
      return Math.max(0, Math.floor(price * count));
    }

    if (CROPS[itemKey]) {
      const { marketPrices } = this.state;
      const basePrice = (marketPrices && marketPrices[itemKey]) || CROPS[itemKey].sellPrice;
      const siloBonus = this.getSiloBonus();
      const adjustedPrice = basePrice * count * (1 + siloBonus);
      return Math.max(0, Math.floor(adjustedPrice));
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
      multiplier *= this.getShelterBoost(buildings, shelterKey);

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

    if (itemKey.startsWith('seed_') && typeof this.setters.setFarmSupplies === 'function') {
      this.setters.setFarmSupplies(prev => {
        const previous = prev || {};
        const current = previous[itemKey] || 0;
        return { ...previous, [itemKey]: Math.max(0, current - amountToSell) };
      });
    }

    this.setters.setMoney(prev => prev + saleValue);

    if (itemKey.startsWith('seed_')) {
      const cropKey = itemKey.replace('seed_', '');
      const crop = CROPS[cropKey];
      const label = crop ? crop.name : cropKey;
      this.notify(`出售了 ${amountToSell} 包${label}種子，獲得 $${saleValue}！`, { type: 'success' });
      return;
    }

    const product = ANIMAL_PRODUCTS[itemKey];
    if (product) {
      this.notify(`出售了 ${amountToSell} 份${product.name}，獲得 $${saleValue}！`, { type: 'success' });
    } else if (CROPS[itemKey]) {
      this.notify(`出售了 ${amountToSell} 份${CROPS[itemKey].name}，獲得 $${saleValue}！`, { type: 'success' });
    } else {
      this.notify(`出售物品獲得 $${saleValue}！`, { type: 'success' });
    }

    if (CROPS[itemKey]) {
      this.emitQuestEvent({ type: 'sell', crop: itemKey, amount: amountToSell });
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
            sicknessDays: 0,
          }
        : a
    ));

    this.consumeSupply('medicine', { keepSelection: medicineCount > 1 });
    this.notify(`已替 ${animal.name} 使用營養劑，狀況好多了！`, { type: 'success' });
  }

  collectAnimalProduct(animalId) {
    const { animals = [] } = this.state;
    if (!Array.isArray(animals) || animals.length === 0) {
      this.notify('目前沒有動物可以收集產物。', { type: 'info' });
      return;
    }

    const animal = animals.find(entry => entry.id === animalId);
    if (!animal) {
      this.notify('找不到這隻動物。', { type: 'error' });
      return;
    }

    const animalData = ANIMALS[animal.type];
    if (!animalData || !animalData.product) {
      this.notify('這隻動物不會產出可收集的物品。', { type: 'info' });
      return;
    }

    const readyAmount = Math.max(0, Math.floor(animal.productReady || 0));
    if (readyAmount <= 0) {
      this.notify('目前沒有可以收集的產物。', { type: 'info' });
      return;
    }

    const product = ANIMAL_PRODUCTS[animalData.product];
    this.setters.setAnimals(prev => prev.map(entry => (
      entry.id === animalId
        ? { ...entry, productReady: 0, lastCollected: Date.now() }
        : entry
    )));

    this.setters.setInventory(prev => ({
      ...prev,
      [animalData.product]: (prev?.[animalData.product] || 0) + readyAmount,
    }));

    const label = product ? `${product.emoji} ${product.name}` : '產物';
    this.notify(`收集了 ${label} x${readyAmount}，已送入倉庫。`, { type: 'success' });
  }
}

