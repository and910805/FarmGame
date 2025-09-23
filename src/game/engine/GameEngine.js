import { CROPS, ANIMALS, BUILDINGS, TOOLS, FARM_SUPPLIES } from '../data/GameCatalog';

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
    this.setters.setInventory(prev => ({ ...prev, [crop]: prev[crop] + 1 }));
    this.setters.setExperience(prev => prev + 10);
    this.setters.setFarm(prev => prev.map(p =>
      p.id === plotId
        ? { ...p, crop: null, plantTime: null, watered: false, ready: false, pest: false, pestDays: 0, fertilized: false }
        : p
    ));

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
    const { money } = this.state;
    const animal = ANIMALS[animalType];
    const requiredShelter = animal.shelter;

    if (requiredShelter && !this.state.buildings?.[requiredShelter]) {
      const shelterName = BUILDINGS[requiredShelter].name;
      this.notify(`需要先建造 ${shelterName} 才能飼養 ${animal.name}！`, { type: 'warning' });
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
    const { money, buildings } = this.state;
    const building = BUILDINGS[buildingType];

    if (buildings?.[buildingType]) {
      this.notify('已經擁有此建築！', { type: 'info' });
      return;
    }

    if (money >= building.price) {
      this.setters.setMoney(prev => prev - building.price);
      this.setters.setBuildings(prev => ({ ...prev, [buildingType]: true }));

      if (buildingType === 'greenhouse') {
        this.setters.setFarm(prev => prev.map(plot => (
          plot.greenhouse ? plot : { ...plot, greenhouse: true }
        )));
      }

      this.setters.setShowBuildingShop(false);
      this.notify(`建造了 ${building.emoji} ${building.name}！`, { type: 'success' });
    } else {
      this.notify('金錢不足！', { type: 'error' });
    }
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

