export class SaveManager {
  constructor({ stateRef, setters, notifier }) {
    this.stateRef = stateRef;
    this.setters = setters;
    this.notifier = notifier;
  }

  get state() {
    return this.stateRef.current;
  }

  notify(message) {
    if (this.notifier) {
      this.notifier(message);
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
      animals,
      buildings,
      tools,
      completedAchievements,
      dailyStats,
      automation,
      marketPrices,
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
      animals,
      buildings,
      tools,
      completedAchievements: Array.from(completedAchievements || []),
      dailyStats,
      automation,
      marketPrices,
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

    this.notify(`遊戲已保存到存檔槽 ${slotName.slice(-1)}！`);
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
      this.notify(`存檔槽 ${slotName.slice(-1)} 載入成功！`);
      this.setters.setShowLoadMenu(false);
    } catch (error) {
      this.notify('載入存檔失敗！存檔可能已損壞。');
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
    this.setters.setInventory(gameState.inventory);
    this.setters.setFarm(gameState.farm);
    this.setters.setAnimals(gameState.animals);
    this.setters.setBuildings(gameState.buildings);
    this.setters.setTools(gameState.tools);
    this.setters.setCompletedAchievements(new Set(gameState.completedAchievements || []));
    this.setters.setDailyStats(gameState.dailyStats || []);
    this.setters.setAutomation(gameState.automation || { autoWater: false, autoHarvest: false });
    this.setters.setMarketPrices(gameState.marketPrices || {});
  }

  exportSave() {
    const snapshot = this.createSnapshot();
    const saveString = JSON.stringify(snapshot, null, 2);
    this.setters.setSaveData(saveString);
    this.notify('存檔數據已生成！請複製保存。');
  }

  importSave() {
    const { loadData } = this.state;
    if (!loadData || !loadData.trim()) {
      this.notify('請先輸入存檔數據！');
      return;
    }

    try {
      const parsed = JSON.parse(loadData);
      if (!parsed.version || parsed.money === undefined) {
        throw new Error('invalid format');
      }

      this.applyState(parsed);
      this.notify('存檔載入成功！');
      this.setters.setLoadData('');
      this.setters.setShowLoadMenu(false);
    } catch (error) {
      this.notify('載入失敗！請檢查存檔數據格式。');
    }
  }

  deleteSaveSlot(slotName) {
    this.setters.setSaveSlots(prev => ({
      ...prev,
      [slotName]: null,
    }));
    this.notify(`存檔槽 ${slotName.slice(-1)} 已刪除！`);
  }

  quickSave() {
    this.saveToSlot('slot1');
  }

  quickLoad() {
    const { saveSlots } = this.state;
    if (saveSlots?.slot1) {
      this.loadFromSlot('slot1');
    } else {
      this.notify('快速存檔槽為空！');
    }
  }
}

