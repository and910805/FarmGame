import { ANIMALS, CROPS } from '../data/GameCatalog';

const createDefaultInventory = () => {
  const inventory = {};
  Object.keys(CROPS).forEach(key => {
    inventory[key] = 0;
  });
  return inventory;
};

const createDefaultFarm = () =>
  Array.from({ length: 25 }, (_, index) => ({
    id: index,
    crop: null,
    plantTime: null,
    watered: false,
    fertilized: false,
    greenhouse: false,
    pest: false,
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
      inventory,
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
    } = this.state;

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
      inventory,
      farm,
      farmSupplies,
      animals,
      buildings,
      tools,
      completedAchievements: Array.from(completedAchievements || []),
      dailyStats,
      automation,
      marketPrices,
      selectedSupply: selectedSupply || null,
      saveTime: new Date().toISOString(),
      version: '1.0',
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
    this.setters.setInventory(gameState.inventory || createDefaultInventory());
    this.setters.setFarm(Array.isArray(gameState.farm) ? gameState.farm : createDefaultFarm());
    this.setters.setFarmSupplies(gameState.farmSupplies || createDefaultSupplies());
    const sanitizedAnimals = Array.isArray(gameState.animals)
      ? gameState.animals.map(animal => ({
          ...animal,
          happiness: animal.happiness ?? ANIMALS[animal.type]?.happiness ?? 50,
          hunger: animal.hunger ?? 60,
          sick: animal.sick ?? false,
        }))
      : [];
    this.setters.setAnimals(sanitizedAnimals);
    this.setters.setBuildings(gameState.buildings || {});
    this.setters.setTools(gameState.tools || 'basic');
    this.setters.setCompletedAchievements(new Set(gameState.completedAchievements || []));
    this.setters.setDailyStats(gameState.dailyStats || []);
    this.setters.setAutomation(gameState.automation || { autoWater: false, autoHarvest: false });
    this.setters.setMarketPrices(gameState.marketPrices || {});
    this.setters.setSelectedSupply(gameState.selectedSupply || null);
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

