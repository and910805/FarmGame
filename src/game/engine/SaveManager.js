import { ANIMALS, CROPS, ANIMAL_PRODUCTS } from '../data/GameCatalog';
import { BASE_ANIMAL_CAPACITY, MAX_ANIMAL_CAPACITY, BASE_FARM_PLOTS, MAX_FARM_PLOTS, BUILDING_UPGRADES } from './GameEngine';

const createDefaultInventory = () => {
  const inventory = {};
  Object.keys(CROPS).forEach(key => {
    inventory[key] = 0;
    inventory[`seed_${key}`] = 0;
  });
  Object.keys(ANIMAL_PRODUCTS).forEach(key => {
    if (!(key in inventory)) {
      inventory[key] = 0;
    }
  });
  return inventory;
};

const withInventoryDefaults = (inventory) => {
  const defaults = createDefaultInventory();
  if (!inventory) {
    return defaults;
  }

  const sanitized = { ...defaults };
  Object.entries(inventory).forEach(([key, value]) => {
    sanitized[key] = typeof value === 'number' ? value : defaults[key] || 0;
  });
  return sanitized;
};

const createDefaultFarm = (length = BASE_FARM_PLOTS) =>
  Array.from({ length }, (_, index) => ({
    id: index,
    crop: null,
    plantTime: null,
    watered: false,
    fertilized: false,
    greenhouse: false,
    pest: false,
    pestDays: 0,
    ready: false,
  }));

const createDefaultSupplies = () => ({
  fertilizer: 0,
  pesticide: 0,
  medicine: 0,
});

export class SaveManager {
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

  createSnapshot() {
    const {
      money,
      energy,
      level,
      experience,
      time,
      day,
      season,
      weather,
      weatherDuration,
      inventory: rawInventory,
      farm,
      farmSupplies,
      animals,
      buildings,
      tools,
      completedAchievements,
      dailyStats,
      automation,
      marketPrices,
      selectedSupply,
      animalCapacity,
      questLog,
      dynamicQuests,
      ownedTools,
      toolLevels,
    } = this.state;

    const safeFarm = Array.isArray(farm) ? farm : [];
    const greenhouseCount = safeFarm.reduce((count, plot) => count + (plot.greenhouse ? 1 : 0), 0);
    const buildingSnapshot = { ...(buildings || {}) };
    if (greenhouseCount > 0) {
      buildingSnapshot.greenhouse = greenhouseCount;
    } else if (buildingSnapshot.greenhouse) {
      delete buildingSnapshot.greenhouse;
    }

    return {
      money,
      energy,
      level,
      experience,
      time,
      day,
      season,
      weather,
      weatherDuration,
      inventory: withInventoryDefaults(rawInventory),
      farm,
      farmSupplies,
      animals,
      buildings: buildingSnapshot,
      tools,
      completedAchievements: Array.from(completedAchievements || []),
      dailyStats,
      automation,
      marketPrices,
      selectedSupply: selectedSupply || null,
      animalCapacity: Math.max(animalCapacity || BASE_ANIMAL_CAPACITY, BASE_ANIMAL_CAPACITY),
      questLog: questLog || {},
      dynamicQuests: dynamicQuests || {},
      ownedTools: Array.isArray(ownedTools) ? ownedTools : Array.from(ownedTools || []),
      toolLevels: toolLevels && typeof toolLevels === 'object' ? { ...toolLevels } : {},
      saveTime: new Date().toISOString(),
      version: '1.1',
    };
  }

  saveToSlot(slotName) {
    const snapshot = this.createSnapshot();
    this.setters.setSaveSlots(prev => ({
      ...prev,
      [slotName]: snapshot,
    }));

    this.notify(`遊戲已保存到存檔槽 ${slotName.slice(-1)}！`, { type: 'success' });
    this.setters.setShowSaveMenu(false);
  }

  loadFromSlot(slotName) {
    const { saveSlots } = this.state;
    const gameState = saveSlots?.[slotName];
    if (!gameState) {
      this.notify('存檔槽為空！');
      return;
    }

    try {
      this.applyState(gameState);
      this.notify(`存檔槽 ${slotName.slice(-1)} 載入成功！`, { type: 'success' });
      this.setters.setShowLoadMenu(false);
    } catch (error) {
      this.notify('載入存檔失敗！存檔可能已損壞。', { type: 'error' });
    }
  }

  applyState(gameState) {
    this.setters.setMoney(gameState.money);
    this.setters.setEnergy(gameState.energy);
    this.setters.setLevel(gameState.level);
    this.setters.setExperience(gameState.experience);
    this.setters.setTime(gameState.time);
    this.setters.setDay(gameState.day);
    this.setters.setSeason(gameState.season);
    this.setters.setWeather(gameState.weather);
    this.setters.setWeatherDuration(gameState.weatherDuration || 5);
    const normalizedInventory = withInventoryDefaults(gameState.inventory);
    this.setters.setInventory(normalizedInventory);
    this.setters.setQuestLog(gameState.questLog ? { ...gameState.questLog } : {});
    if (typeof this.setters.setDynamicQuests === 'function') {
      const dynamic = gameState.dynamicQuests && typeof gameState.dynamicQuests === 'object'
        ? { ...gameState.dynamicQuests }
        : {};
      this.setters.setDynamicQuests(dynamic);
    }
    if (typeof this.setters.setOwnedTools === 'function') {
      const owned = Array.isArray(gameState.ownedTools)
        ? gameState.ownedTools
        : (typeof gameState.tools === 'string' ? [gameState.tools] : []);
      const baseTool = gameState.tools || 'basic';
      const normalizedOwned = owned.length > 0 ? [...owned] : [baseTool];
      if (!normalizedOwned.includes(baseTool)) {
        normalizedOwned.push(baseTool);
      }
      if (!normalizedOwned.includes('basic')) {
        normalizedOwned.unshift('basic');
      }
      this.setters.setOwnedTools(normalizedOwned);
    }
    if (typeof this.setters.setToolLevels === 'function') {
      const levels = gameState.toolLevels && typeof gameState.toolLevels === 'object'
        ? Object.entries(gameState.toolLevels).reduce((acc, [key, value]) => {
            acc[key] = Math.max(0, Math.floor(value));
            return acc;
          }, {})
        : {};
      this.setters.setToolLevels(levels);
    }
    const sanitizedFarm = Array.isArray(gameState.farm)
      ? gameState.farm.map((plot, index) => ({
          id: plot.id ?? index,
          crop: plot.crop ?? null,
          plantTime: plot.plantTime ?? null,
          watered: plot.crop ? Boolean(plot.watered) : false,
          fertilized: Boolean(plot.fertilized),
          greenhouse: Boolean(plot.greenhouse),
          pest: Boolean(plot.pest),
          pestDays: plot.pest ? (plot.pestDays ?? 1) : 0,
          ready: plot.crop ? Boolean(plot.ready) : false,
        }))
      : createDefaultFarm();

    const minPlots = Math.max(BASE_FARM_PLOTS, sanitizedFarm.length);
    let normalizedFarm = sanitizedFarm;
    if (sanitizedFarm.length < minPlots) {
      const needed = minPlots - sanitizedFarm.length;
      const startId = sanitizedFarm.reduce((max, plot) => Math.max(max, plot.id ?? -1), -1) + 1;
      const additional = createDefaultFarm(needed).map((plot, idx) => ({
        ...plot,
        id: startId + idx,
      }));
      normalizedFarm = [...sanitizedFarm, ...additional];
    } else if (sanitizedFarm.length > MAX_FARM_PLOTS) {
      normalizedFarm = sanitizedFarm.slice(0, MAX_FARM_PLOTS);
    }

    let normalizedBuildings = { ...(gameState.buildings || {}) };
    if (normalizedBuildings.well) {
      normalizedBuildings.sprinkler = Math.max(normalizedBuildings.sprinkler || 0, 1);
      delete normalizedBuildings.well;
    }

    Object.entries(BUILDING_UPGRADES).forEach(([key, upgrades]) => {
      if (!Array.isArray(upgrades) || upgrades.length === 0) {
        return;
      }

      const raw = normalizedBuildings[key];
      if (raw === undefined || raw === null || raw === false) {
        delete normalizedBuildings[key];
        return;
      }

      const maxLevel = upgrades[upgrades.length - 1].level;
      if (typeof raw === 'number') {
        const level = Math.max(1, Math.floor(raw));
        normalizedBuildings[key] = Math.min(level, maxLevel);
      } else if (raw === true) {
        normalizedBuildings[key] = upgrades[0].level;
      }
    });

    const rawGreenhouse = normalizedBuildings.greenhouse;
    let desiredGreenhouseCount = 0;
    if (typeof rawGreenhouse === 'number') {
      desiredGreenhouseCount = Math.max(0, Math.floor(rawGreenhouse));
    } else if (rawGreenhouse) {
      desiredGreenhouseCount = normalizedFarm.length;
    }

    let actualGreenhouseCount = normalizedFarm.reduce((count, plot) => count + (plot.greenhouse ? 1 : 0), 0);
    if (desiredGreenhouseCount > actualGreenhouseCount) {
      let remaining = desiredGreenhouseCount - actualGreenhouseCount;
      normalizedFarm = normalizedFarm.map(plot => {
        if (!plot.greenhouse && remaining > 0) {
          remaining -= 1;
          return { ...plot, greenhouse: true };
        }
        return plot;
      });
      actualGreenhouseCount = normalizedFarm.reduce((count, plot) => count + (plot.greenhouse ? 1 : 0), 0);
      desiredGreenhouseCount = actualGreenhouseCount;
    } else if (desiredGreenhouseCount === 0 && actualGreenhouseCount > 0) {
      desiredGreenhouseCount = actualGreenhouseCount;
    }

    if (desiredGreenhouseCount > 0) {
      normalizedBuildings.greenhouse = desiredGreenhouseCount;
    } else {
      delete normalizedBuildings.greenhouse;
    }

    this.setters.setFarm(normalizedFarm);
    const baseSupplies = { ...createDefaultSupplies(), ...(gameState.farmSupplies || {}) };
    Object.entries(normalizedInventory).forEach(([key, value]) => {
      if (key.startsWith('seed_')) {
        baseSupplies[key] = value;
      }
    });
    this.setters.setFarmSupplies(baseSupplies);
    const sanitizedAnimals = Array.isArray(gameState.animals)
      ? gameState.animals.map(animal => ({
          ...animal,
          happiness: animal.happiness ?? ANIMALS[animal.type]?.happiness ?? 50,
          hunger: animal.hunger ?? 60,
          sick: animal.sick ?? false,
          productReady: Math.max(0, Math.floor(animal.productReady || 0)),
          sicknessDays: Math.max(0, Math.floor(animal.sicknessDays ?? (animal.sick ? 1 : 0))),
        }))
      : [];
    this.setters.setAnimals(sanitizedAnimals);
    const requiredCapacity = Math.max(sanitizedAnimals.length, BASE_ANIMAL_CAPACITY);
    if (typeof this.setters.setAnimalCapacity === 'function') {
      const desiredCapacity = Math.max(gameState.animalCapacity || BASE_ANIMAL_CAPACITY, requiredCapacity);
      this.setters.setAnimalCapacity(Math.min(desiredCapacity, MAX_ANIMAL_CAPACITY));
    }
    this.setters.setBuildings(normalizedBuildings);
    this.setters.setTools(gameState.tools || 'basic');
    this.setters.setCompletedAchievements(new Set(gameState.completedAchievements || []));
    this.setters.setDailyStats(gameState.dailyStats || []);
    this.setters.setAutomation(gameState.automation || { autoWater: false, autoHarvest: false });
    this.setters.setMarketPrices(gameState.marketPrices || {});
    if (typeof this.setters.setPreviousMarketPrices === 'function') {
      this.setters.setPreviousMarketPrices(gameState.marketPrices || {});
    }
    if (typeof this.setters.setMarketUpdateTime === 'function') {
      this.setters.setMarketUpdateTime(Date.now());
    }
    this.setters.setSelectedSupply(gameState.selectedSupply || null);
    if (typeof this.setters.setPendingGreenhousePlacement === 'function') {
      this.setters.setPendingGreenhousePlacement(false);
    }
  }

  exportSave() {
    const snapshot = this.createSnapshot();
    const saveString = JSON.stringify(snapshot, null, 2);
    this.setters.setSaveData(saveString);
    this.notify('存檔數據已生成！請複製保存。', { type: 'info' });
  }

  importSave() {
    const { loadData } = this.state;
    if (!loadData || !loadData.trim()) {
      this.notify('請先輸入存檔數據！', { type: 'warning' });
      return;
    }

    try {
      const parsed = JSON.parse(loadData);
      if (!parsed.version || parsed.money === undefined) {
        throw new Error('invalid format');
      }

      this.applyState(parsed);
      this.notify('存檔載入成功！', { type: 'success' });
      this.setters.setLoadData('');
      this.setters.setShowLoadMenu(false);
    } catch (error) {
      this.notify('載入失敗！請檢查存檔數據格式。', { type: 'error' });
    }
  }

  deleteSaveSlot(slotName) {
    this.setters.setSaveSlots(prev => ({
      ...prev,
      [slotName]: null,
    }));
    this.notify(`存檔槽 ${slotName.slice(-1)} 已刪除！`, { type: 'info' });
  }

  quickSave() {
    this.saveToSlot('slot1');
  }

  quickLoad() {
    const { saveSlots } = this.state;
    if (saveSlots?.slot1) {
      this.loadFromSlot('slot1');
    } else {
      this.notify('快速存檔槽為空！', { type: 'warning' });
    }
  }
}

