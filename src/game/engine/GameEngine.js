import { CROPS, ANIMALS, BUILDINGS, TOOLS } from '../data/GameCatalog';

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

  buySeed(seedType) {
    const { money, marketPrices } = this.state;
    const price = (marketPrices && marketPrices[seedType]) || CROPS[seedType].price;

    if (money >= price) {
      this.setters.setMoney(prev => prev - price);
      this.setters.setSelectedSeed(seedType);
      this.setters.setShowShop(false);
      this.notify(`購買了 ${CROPS[seedType].name} 種子！`, { type: 'success' });
    } else {
      this.notify('金錢不足！', { type: 'error' });
    }
  }

  plantSeed(plotId) {
    const { selectedSeed, tools, buildings, energy } = this.state;
    if (!selectedSeed) return;

    const energyCost = Math.max(1, 10 - TOOLS[tools].energyReduction - (buildings?.well ? 5 : 0));
    if (energy < energyCost) {
      this.notify('體力不足！', { type: 'warning' });
      return;
    }

    this.setters.setFarm(prev => prev.map(plot =>
      plot.id === plotId && !plot.crop
        ? { ...plot, crop: selectedSeed, plantTime: Date.now(), watered: false, ready: false, pest: false }
        : plot
    ));

    this.setters.setEnergy(prev => Math.max(0, prev - energyCost));
    this.setters.setExperience(prev => prev + 5);
    this.setters.setSelectedSeed(null);
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
        ? { ...p, crop: null, plantTime: null, watered: false, ready: false, pest: false }
        : p
    ));

    this.notify(`收成了 ${CROPS[crop].emoji}！獲得 $${sellPrice}`, { type: 'success' });
  }

  waterPlot(plotId) {
    const { energy, buildings } = this.state;
    const energyCost = buildings?.well ? 2 : 5;
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
        this.setters.setFarm(prev => prev.map((plot, index) =>
          index < 5 ? { ...plot, greenhouse: true } : plot
        ));
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
}

