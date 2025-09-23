import React, { useState, useEffect, useCallback } from 'react';
import { Sprout, Coins, ShoppingCart, Heart, Home, Sun, Moon, Zap, Droplets, Hammer, Building, Star, Save, Trophy, Settings, MessageCircle, Target } from 'lucide-react';

const CROPS = {
  carrot: { name: '胡蘿蔔', price: 10, growTime: 5, sellPrice: 25, emoji: '🥕', weatherBonus: { sunny: 1.2, rainy: 1.0, snow: 0.8 } },
  corn: { name: '玉米', price: 20, growTime: 8, sellPrice: 50, emoji: '🌽', weatherBonus: { sunny: 1.3, rainy: 1.1, snow: 0.6 } },
  tomato: { name: '番茄', price: 15, growTime: 6, sellPrice: 35, emoji: '🍅', weatherBonus: { sunny: 1.4, rainy: 0.9, snow: 0.5 } },
  wheat: { name: '小麥', price: 8, growTime: 4, sellPrice: 20, emoji: '🌾', weatherBonus: { sunny: 1.1, rainy: 1.2, snow: 0.9 } },
  potato: { name: '馬鈴薯', price: 12, growTime: 7, sellPrice: 30, emoji: '🥔', weatherBonus: { sunny: 1.0, rainy: 1.3, snow: 1.1 } },
  strawberry: { name: '草莓', price: 25, growTime: 10, sellPrice: 60, emoji: '🍓', weatherBonus: { sunny: 1.2, rainy: 0.8, snow: 0.4 } }
};

const ANIMALS = {
  dog: { name: '狗狗', price: 200, happiness: 50, emoji: '🐕', foodCost: 5, income: 8, shelter: 'dogHouse' },
  cat: { name: '貓咪', price: 150, happiness: 60, emoji: '🐱', foodCost: 3, income: 5, shelter: 'catHouse' },
  chicken: { name: '雞', price: 100, happiness: 40, emoji: '🐔', foodCost: 2, income: 12, shelter: 'chickenCoop' },
  cow: { name: '牛', price: 500, happiness: 30, emoji: '🐄', foodCost: 10, income: 25, shelter: 'barn' },
  pig: { name: '豬', price: 300, happiness: 45, emoji: '🐷', foodCost: 8, income: 18, shelter: 'pigPen' },
  sheep: { name: '羊', price: 250, happiness: 40, emoji: '🐑', foodCost: 6, income: 15, shelter: 'barn' },
  duck: { name: '鴨子', price: 120, happiness: 55, emoji: '🦆', foodCost: 3, income: 10, shelter: 'pond' },
  rabbit: { name: '兔子', price: 80, happiness: 70, emoji: '🐰', foodCost: 2, income: 6, shelter: 'rabbitHutch' }
};

const BUILDINGS = {
  barn: { name: '穀倉', price: 1000, emoji: '🏚️', description: '容納牛羊，提升產量', boost: 1.2 },
  chickenCoop: { name: '雞舍', price: 500, emoji: '🏠', description: '專門養雞，提升產蛋率', boost: 1.3 },
  dogHouse: { name: '狗屋', price: 300, emoji: '🏘️', description: '狗狗的溫馨小窩', boost: 1.1 },
  catHouse: { name: '貓屋', price: 250, emoji: '🏡', description: '貓咪的舒適居所', boost: 1.1 },
  pigPen: { name: '豬圈', price: 400, emoji: '🏗️', description: '豬豬的泥土樂園', boost: 1.2 },
  pond: { name: '池塘', price: 600, emoji: '🌊', description: '水鳥的天堂', boost: 1.3 },
  rabbitHutch: { name: '兔籠', price: 200, emoji: '📦', description: '兔子的安全小屋', boost: 1.2 },
  greenhouse: { name: '溫室', price: 2000, emoji: '🏢', description: '不受天氣影響的種植空間', boost: 1.5 },
  silo: { name: '筒倉', price: 800, emoji: '🗼', description: '儲存更多作物', boost: 1.0 },
  windmill: { name: '風車', price: 1500, emoji: '🌪️', description: '產生額外收入', boost: 1.0 },
  well: { name: '水井', price: 400, emoji: '🕳️', description: '無限澆水，節省體力', boost: 1.0 }
};

const TOOLS = {
  basic: { name: '基本工具', energyReduction: 0, speedBoost: 1, price: 0 },
  iron: { name: '鐵製工具', energyReduction: 2, speedBoost: 1.2, price: 500 },
  steel: { name: '鋼製工具', energyReduction: 4, speedBoost: 1.5, price: 1200 },
  magic: { name: '魔法工具', energyReduction: 6, speedBoost: 2, price: 3000 }
};

const ACHIEVEMENTS = [
  { id: 'firstPlant', name: '初次種植', description: '種下第一株作物', reward: 100, icon: '🌱' },
  { id: 'richFarmer', name: '富豪農夫', description: '擁有10000金幣', reward: 500, icon: '💰' },
  { id: 'animalLover', name: '動物愛好者', description: '擁有10隻動物', reward: 300, icon: '🐾' },
  { id: 'builder', name: '建築大師', description: '建造5個建築', reward: 800, icon: '🏗️' },
  { id: 'levelUp', name: '經驗老手', description: '達到等級10', reward: 1000, icon: '⭐' },
  { id: 'weatherMaster', name: '天氣專家', description: '在所有天氣下收成作物', reward: 600, icon: '🌦️' }
];

const NPCS = [
  { 
    name: '農夫老張', 
    emoji: '👨‍🌾', 
    dialogue: ['今天天氣真好呢！', '記得給作物澆水哦！', '我這裡有些好種子...'],
    quests: [{ type: 'plant', target: 'carrot', count: 5, reward: 200 }]
  },
  {
    name: '商人小李',
    emoji: '👨‍💼',
    dialogue: ['生意興隆！', '需要什麼嗎？', '我有特價商品！'],
    quests: [{ type: 'sell', target: 'tomato', count: 10, reward: 300 }]
  }
];

const WEATHER_TYPES = ['sunny', 'rainy', 'cloudy', 'storm', 'snow'];

const FarmGame = () => {
  // 基本狀態
  const [money, setMoney] = useState(500);
  const [energy, setEnergy] = useState(100);
  const [level, setLevel] = useState(1);
  const [experience, setExperience] = useState(0);
  const [time, setTime] = useState(6);
  const [day, setDay] = useState(1);
  const [season, setSeason] = useState('spring');
  const [weather, setWeather] = useState('sunny');
  const [weatherDuration, setWeatherDuration] = useState(5);
  
  // 遊戲數據
  const [inventory, setInventory] = useState({
    carrot: 0, corn: 0, tomato: 0, wheat: 0, potato: 0, strawberry: 0
  });
  
  const [farm, setFarm] = useState(
  Array(25).fill().map((_, i) => ({
    id: i,
    crop: null,
    plantTime: null,
    watered: false,
    fertilized: false,
    greenhouse: false,
    pest: false,
    ready: false,
    notified: false   // 👈 新增
  }))
);

  
  const [animals, setAnimals] = useState([]);
  const [buildings, setBuildings] = useState({});
  const [tools, setTools] = useState('basic');
  
  // UI狀態
  const [selectedSeed, setSelectedSeed] = useState(null);
  const [showShop, setShowShop] = useState(false);
  const [showAnimalShop, setShowAnimalShop] = useState(false);
  const [showBuildingShop, setShowBuildingShop] = useState(false);
  const [showToolShop, setShowToolShop] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showNPCDialog, setShowNPCDialog] = useState(false);
  const [currentNPC, setCurrentNPC] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [showLoadMenu, setShowLoadMenu] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  // 新功能狀態
  const [completedAchievements, setCompletedAchievements] = useState(new Set());
  const [aiAdvice, setAiAdvice] = useState('');
  const [marketPrices, setMarketPrices] = useState({});
  const [dailyStats, setDailyStats] = useState([]);
  const [automation, setAutomation] = useState({ autoWater: false, autoHarvest: false });
  
  // 存檔狀態
  const [saveSlots, setSaveSlots] = useState({
    slot1: null,
    slot2: null,
    slot3: null,
    slot4: null,
    slot5: null
  });
  const [saveData, setSaveData] = useState('');
  const [loadData, setLoadData] = useState('');

  const addNotification = useCallback((message) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  // 存檔相關函數
  const saveToSlot = useCallback((slotName) => {
    const gameState = {
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
      completedAchievements: Array.from(completedAchievements),
      dailyStats,
      automation,
      marketPrices,
      saveTime: new Date().toISOString(),
      version: '1.0'
    };
    
    setSaveSlots(prev => ({
      ...prev,
      [slotName]: gameState
    }));
    
    addNotification(`遊戲已保存到存檔槽 ${slotName.slice(-1)}！`);
    setShowSaveMenu(false);
  }, [money, energy, level, experience, time, day, season, weather, weatherDuration, inventory, farm, animals, buildings, tools, completedAchievements, dailyStats, automation, marketPrices, addNotification]);

  const loadFromSlot = useCallback((slotName) => {
    const gameState = saveSlots[slotName];
    if (!gameState) {
      addNotification('存檔槽為空！');
      return;
    }

    try {
      setMoney(gameState.money);
      setEnergy(gameState.energy);
      setLevel(gameState.level);
      setExperience(gameState.experience);
      setTime(gameState.time);
      setDay(gameState.day);
      setSeason(gameState.season);
      setWeather(gameState.weather);
      setWeatherDuration(gameState.weatherDuration);
      setInventory(gameState.inventory);
      setFarm(gameState.farm);
      setAnimals(gameState.animals);
      setBuildings(gameState.buildings);
      setTools(gameState.tools);
      setCompletedAchievements(new Set(gameState.completedAchievements || []));
      setDailyStats(gameState.dailyStats || []);
      setAutomation(gameState.automation || { autoWater: false, autoHarvest: false });
      setMarketPrices(gameState.marketPrices || {});

      addNotification(`存檔槽 ${slotName.slice(-1)} 載入成功！`);
      setShowLoadMenu(false);
    } catch (error) {
      addNotification('載入存檔失敗！存檔可能已損壞。');
    }
  }, [saveSlots, addNotification]);

  const exportSave = useCallback(() => {
    const gameState = {
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
      completedAchievements: Array.from(completedAchievements),
      dailyStats,
      automation,
      marketPrices,
      saveTime: new Date().toISOString(),
      version: '1.0'
    };
    
    const saveString = JSON.stringify(gameState, null, 2);
    setSaveData(saveString);
    addNotification('存檔數據已生成！請複製保存。');
  }, [money, energy, level, experience, time, day, season, weather, weatherDuration, inventory, farm, animals, buildings, tools, completedAchievements, dailyStats, automation, marketPrices, addNotification]);

  const importSave = useCallback(() => {
    if (!loadData.trim()) {
      addNotification('請先輸入存檔數據！');
      return;
    }

    try {
      const gameState = JSON.parse(loadData);
      
      // 驗證存檔格式
      if (!gameState.version || gameState.money === undefined) {
        throw new Error('無效的存檔格式');
      }

      setMoney(gameState.money);
      setEnergy(gameState.energy);
      setLevel(gameState.level);
      setExperience(gameState.experience);
      setTime(gameState.time);
      setDay(gameState.day);
      setSeason(gameState.season);
      setWeather(gameState.weather);
      setWeatherDuration(gameState.weatherDuration || 5);
      setInventory(gameState.inventory);
      setFarm(gameState.farm);
      setAnimals(gameState.animals);
      setBuildings(gameState.buildings);
      setTools(gameState.tools);
      setCompletedAchievements(new Set(gameState.completedAchievements || []));
      setDailyStats(gameState.dailyStats || []);
      setAutomation(gameState.automation || { autoWater: false, autoHarvest: false });
      setMarketPrices(gameState.marketPrices || {});

      addNotification('存檔載入成功！');
      setLoadData('');
      setShowLoadMenu(false);
    } catch (error) {
      addNotification('載入失敗！請檢查存檔數據格式。');
    }
  }, [loadData, addNotification]);

  const deleteSaveSlot = useCallback((slotName) => {
    setSaveSlots(prev => ({
      ...prev,
      [slotName]: null
    }));
    addNotification(`存檔槽 ${slotName.slice(-1)} 已刪除！`);
  }, [addNotification]);

  const quickSave = useCallback(() => {
    saveToSlot('slot1');
  }, [saveToSlot]);

  const quickLoad = useCallback(() => {
    if (saveSlots.slot1) {
      loadFromSlot('slot1');
    } else {
      addNotification('快速存檔槽為空！');
    }
  }, [loadFromSlot, saveSlots.slot1, addNotification]);

  // AI顧問系統
  useEffect(() => {
    const generateAdvice = () => {
      const advices = [
        weather === 'sunny' ? '☀️ 晴天適合種植番茄和草莓！' : '',
        weather === 'rainy' ? '🌧️ 雨天作物會自動澆水，適合種植小麥！' : '',
        energy < 30 ? '⚡ 體力不足，建議休息或升級工具！' : '',
        money > 2000 ? '💰 資金充足，考慮建造新建築！' : '',
        animals.some(a => a.happiness < 30) ? '🐾 有動物不開心，記得餵食！' : '',
        Object.values(inventory).some(count => count > 10) ? '📦 庫存充足，可以考慮出售！' : ''
      ].filter(advice => advice);
      
      if (advices.length > 0) {
        setAiAdvice(advices[Math.floor(Math.random() * advices.length)]);
      }
    };
    
    const timer = setInterval(generateAdvice, 60000);
    generateAdvice();
    return () => clearInterval(timer);
  }, [weather, energy, money, animals, inventory]);

  // 動態市場價格
  useEffect(() => {
    const updatePrices = () => {
      const newPrices = {};
      Object.keys(CROPS).forEach(crop => {
        const basePrice = CROPS[crop].sellPrice;
        const fluctuation = 0.8 + Math.random() * 0.4;
        newPrices[crop] = Math.floor(basePrice * fluctuation);
      });
      setMarketPrices(newPrices);
    };
    
    updatePrices();
    const timer = setInterval(updatePrices, 120000);
    return () => clearInterval(timer);
  }, []);

  // 成就系統
  useEffect(() => {
    ACHIEVEMENTS.forEach(achievement => {
      if (!completedAchievements.has(achievement.id)) {
        let unlocked = false;
        
        switch (achievement.id) {
          case 'firstPlant':
            unlocked = farm.some(plot => plot.crop);
            break;
          case 'richFarmer':
            unlocked = money >= 10000;
            break;
          case 'animalLover':
            unlocked = animals.length >= 10;
            break;
          case 'builder':
            unlocked = Object.keys(buildings).length >= 5;
            break;
          case 'levelUp':
            unlocked = level >= 10;
            break;
          case 'weatherMaster':
            unlocked = level >= 5;
            break;
        }
        
        if (unlocked) {
          setCompletedAchievements(prev => new Set([...prev, achievement.id]));
          setMoney(prev => prev + achievement.reward);
          addNotification(`🏆 達成成就：${achievement.name}！獲得 $${achievement.reward}`);
        }
      }
    });
  }, [money, animals, buildings, level, farm, completedAchievements, addNotification]);

  // 時間系統
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(prev => {
        const newTime = prev + 1;
        if (newTime >= 24) {
          setDay(prevDay => {
            const newDay = prevDay + 1;
            if (newDay % 30 === 0) {
              const seasons = ['spring', 'summer', 'autumn', 'winter'];
              const currentSeasonIndex = seasons.indexOf(season);
              const nextSeason = seasons[(currentSeasonIndex + 1) % 4];
              setSeason(nextSeason);
              addNotification(`🌸 季節變為 ${getSeasonName(nextSeason)}！`);
            }
            return newDay;
          });
          
          setEnergy(100);
          
          // 動物每日收入
          setAnimals(prev => prev.map(animal => {
            const building = buildings[ANIMALS[animal.type].shelter];
            const boost = building ? BUILDINGS[ANIMALS[animal.type].shelter].boost : 1;
            const income = Math.floor(ANIMALS[animal.type].income * boost * (animal.happiness / 100));
            
            if (animal.happiness > 20) {
              setMoney(prevMoney => prevMoney + income);
            }
            
            return {
              ...animal,
              happiness: Math.max(0, animal.happiness - 15)
            };
          }));
          
          return 6;
        }
        return newTime;
      });
    }, 15000);

    return () => clearInterval(timer);
  }, [season, buildings, animals, addNotification]);

  // 天氣系統
  useEffect(() => {
    const weatherTimer = setInterval(() => {
      setWeatherDuration(prev => {
        if (prev <= 0) {
          const newWeather = WEATHER_TYPES[Math.floor(Math.random() * WEATHER_TYPES.length)];
          setWeather(newWeather);
          addNotification(`天氣變為 ${getWeatherName(newWeather)} ${getWeatherIcon(newWeather)}`);
          return Math.floor(Math.random() * 8) + 3;
        }
        return prev - 1;
      });
    }, 30000);

    return () => clearInterval(weatherTimer);
  }, [addNotification]);

  // 作物成長系統
  useEffect(() => {
    const growTimer = setInterval(() => {
      setFarm(prev => prev.map(plot => {
        if (plot.crop && plot.plantTime && !plot.pest) {
          const now = Date.now();
          const cropData = CROPS[plot.crop];
          
          let weatherMultiplier = plot.greenhouse ? 1.2 : (cropData.weatherBonus[weather] || 1);
          const toolMultiplier = TOOLS[tools].speedBoost;
          
          const adjustedGrowTime = (cropData.growTime * 60000) / (weatherMultiplier * toolMultiplier);
          
          if (now - plot.plantTime >= adjustedGrowTime && !plot.ready) {
            return { ...plot, ready: true, notified: false };
          }

          if (plot.ready && !plot.notified) {
            addNotification(`${CROPS[plot.crop].emoji} ${CROPS[plot.crop].name} 成熟了！`);
            return { ...plot, notified: true };
          }

        }
        return plot;
      }));
    }, 5000);

    return () => clearInterval(growTimer);
  }, [weather, tools, addNotification]);

  // 升級系統
  useEffect(() => {
    if (experience >= level * 100) {
      setLevel(prev => prev + 1);
      setExperience(prev => prev - (level * 100));
      addNotification(`🎉 升級到等級 ${level + 1}！`);
    }
  }, [experience, level, addNotification]);

  const getWeatherName = (weatherType) => {
    const names = {
      sunny: '晴天', rainy: '雨天', cloudy: '陰天', 
      storm: '暴風雨', snow: '雪天'
    };
    return names[weatherType];
  };

  const getSeasonName = (seasonType) => {
    const names = {
      spring: '春天', summer: '夏天', autumn: '秋天', winter: '冬天'
    };
    return names[seasonType];
  };

  const buySeed = (seedType) => {
    const price = marketPrices[seedType] || CROPS[seedType].price;
    if (money >= price) {
      setMoney(prev => prev - price);
      setSelectedSeed(seedType);
      setShowShop(false);
      addNotification(`購買了 ${CROPS[seedType].name} 種子！`);
    } else {
      addNotification('金錢不足！');
    }
  };

  const plantSeed = (plotId) => {
    if (!selectedSeed) return;
    
    const energyCost = Math.max(1, 10 - TOOLS[tools].energyReduction - (buildings.well ? 5 : 0));
    if (energy < energyCost) {
      addNotification('體力不足！');
      return;
    }
    
    setFarm(prev => prev.map(plot => 
      plot.id === plotId && !plot.crop
        ? { ...plot, crop: selectedSeed, plantTime: Date.now(), watered: false, ready: false, pest: false }
        : plot
    ));
    
    setEnergy(prev => Math.max(0, prev - energyCost));
    setExperience(prev => prev + 5);
    setSelectedSeed(null);
    addNotification(`種植了 ${CROPS[selectedSeed].name}！`);
  };

  const harvestCrop = (plotId) => {
    const plot = farm.find(p => p.id === plotId);
    if (!plot || !plot.ready) return;

    const crop = plot.crop;
    const basePrice = marketPrices[crop] || CROPS[crop].sellPrice;
    
    let bonus = 1;
    if (plot.watered) bonus *= 1.2;
    if (plot.greenhouse) bonus *= 1.5;
    if (buildings.silo) bonus *= 1.1;
    
    const sellPrice = Math.floor(basePrice * bonus);
    
    setMoney(prev => prev + sellPrice);
    setInventory(prev => ({ ...prev, [crop]: prev[crop] + 1 }));
    setExperience(prev => prev + 10);
    
    setFarm(prev => prev.map(plot => 
      plot.id === plotId 
        ? { ...plot, crop: null, plantTime: null, watered: false, ready: false, pest: false }
        : plot
    ));

    addNotification(`收成了 ${CROPS[crop].emoji}！獲得 $${sellPrice}`);
  };

  const waterPlot = (plotId) => {
    const energyCost = buildings.well ? 2 : 5;
    if (energy < energyCost) return;
    
    setFarm(prev => prev.map(plot => 
      plot.id === plotId && plot.crop && !plot.watered
        ? { ...plot, watered: true }
        : plot
    ));
    
    setEnergy(prev => Math.max(0, prev - energyCost));
    addNotification('澆水完成！');
  };

  const buyAnimal = (animalType) => {
    if (money >= ANIMALS[animalType].price) {
      setMoney(prev => prev - ANIMALS[animalType].price);
      setAnimals(prev => [...prev, {
        id: Date.now(),
        type: animalType,
        happiness: ANIMALS[animalType].happiness,
        name: ANIMALS[animalType].name + (prev.filter(a => a.type === animalType).length + 1)
      }]);
      setShowAnimalShop(false);
      addNotification(`購買了 ${ANIMALS[animalType].emoji} ${ANIMALS[animalType].name}！`);
    } else {
      addNotification('金錢不足！');
    }
  };

  const buyBuilding = (buildingType) => {
    if (money >= BUILDINGS[buildingType].price && !buildings[buildingType]) {
      setMoney(prev => prev - BUILDINGS[buildingType].price);
      setBuildings(prev => ({ ...prev, [buildingType]: true }));
      
      if (buildingType === 'greenhouse') {
        setFarm(prev => prev.map((plot, index) => 
          index < 5 ? { ...plot, greenhouse: true } : plot
        ));
      }
      
      setShowBuildingShop(false);
      addNotification(`建造了 ${BUILDINGS[buildingType].emoji} ${BUILDINGS[buildingType].name}！`);
    } else if (buildings[buildingType]) {
      addNotification('已經擁有此建築！');
    } else {
      addNotification('金錢不足！');
    }
  };

  const buyTool = (toolType) => {
    if (money >= TOOLS[toolType].price && tools !== toolType) {
      setMoney(prev => prev - TOOLS[toolType].price);
      setTools(toolType);
      setShowToolShop(false);
      addNotification(`升級工具：${TOOLS[toolType].name}！`);
    }
  };

  const feedAnimal = (animalId) => {
    const animal = animals.find(a => a.id === animalId);
    if (!animal || money < ANIMALS[animal.type].foodCost) return;

    setMoney(prev => prev - ANIMALS[animal.type].foodCost);
    setAnimals(prev => prev.map(a => 
      a.id === animalId 
        ? { ...a, happiness: Math.min(100, a.happiness + 25) }
        : a
    ));
    addNotification(`餵食了 ${animal.name}！快樂度 +25`);
  };

  const interactNPC = (npc) => {
    setCurrentNPC(npc);
    setShowNPCDialog(true);
  };

  const getTimeIcon = () => {
    if (time >= 6 && time < 18) return <Sun className="w-5 h-5 text-yellow-400" />;
    return <Moon className="w-5 h-5 text-blue-300" />;
  };

  const getWeatherIcon = (weatherType = weather) => {
    switch (weatherType) {
      case 'rainy': return '🌧️';
      case 'cloudy': return '☁️';
      case 'storm': return '⛈️';
      case 'snow': return '❄️';
      default: return '☀️';
    }
  };

  const isNight = time < 6 || time >= 18;

  return (
    <div className={`min-h-screen transition-all duration-1000 ${
      isNight 
        ? 'bg-gradient-to-b from-indigo-900 via-purple-900 to-black' 
        : 'bg-gradient-to-b from-blue-300 via-green-200 to-green-400'
    }`}>
      {/* 通知系統 */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-xs">
        {notifications.map(notification => (
          <div key={notification.id} 
               className="bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg animate-bounce text-sm">
            {notification.message}
          </div>
        ))}
      </div>

      {/* 頂部狀態欄 */}
      <div className="flex justify-between items-center p-4 bg-black bg-opacity-30 text-white relative z-20">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Coins className="w-5 h-5 text-yellow-400" />
            <span className="font-bold">${money}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Zap className="w-5 h-5 text-blue-400" />
            <span>{energy}/100</span>
          </div>
          <div className="flex items-center space-x-1">
            <Star className="w-5 h-5 text-yellow-400" />
            <span>等級 {level}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Hammer className="w-4 h-4 text-gray-400" />
            <span className="text-sm">{TOOLS[tools].name}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-sm">
          <button onClick={() => setShowStats(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs transition-colors">
            📊 統計
          </button>
          <button onClick={() => setShowAchievements(true)}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded text-xs transition-colors">
            🏆 成就
          </button>
          <button onClick={() => setShowSaveMenu(true)}
                  className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs transition-colors">
            💾 存檔
          </button>
          <button onClick={() => setShowLoadMenu(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded text-xs transition-colors">
            📁 載入
          </button>
          <button onClick={quickSave}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs transition-colors">
            ⚡ 快存
          </button>
          <button onClick={() => setShowHelp(true)}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded text-xs transition-colors">
            📖 說明
          </button>
          <div className="flex items-center space-x-1 ml-4">
            {getTimeIcon()}
            <span>{time}:00</span>
          </div>
          <span>{getWeatherIcon()}</span>
          <span>第{day}天</span>
        </div>
      </div>

      {/* 主遊戲區域 */}
      <div className="p-4 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* 農場區域 */}
          <div className="lg:col-span-3 bg-white bg-opacity-90 rounded-lg p-4 shadow-lg">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Home className="mr-2" />
              我的農場 - {getSeasonName(season)} {getWeatherName(weather)}
            </h2>
            
            {/* NPC區域 */}
            <div className="flex space-x-4 mb-4">
              {NPCS.map((npc, index) => (
                <div key={index}
                     className="cursor-pointer bg-yellow-100 rounded-lg p-2 hover:bg-yellow-200 transition-colors"
                     onClick={() => interactNPC(npc)}>
                  <div className="text-center">
                    <div className="text-2xl">{npc.emoji}</div>
                    <div className="text-xs font-semibold">{npc.name}</div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 農場格子 */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {farm.map((plot) => (
                <div key={plot.id} 
                     className={`aspect-square border-2 rounded-lg cursor-pointer transition-all duration-300 hover:scale-105 relative ${
                       plot.greenhouse ? 'border-green-600 bg-green-50' :
                       plot.crop 
                         ? plot.ready 
                           ? 'bg-green-200 border-green-400 animate-pulse' 
                           : 'bg-yellow-100 border-yellow-400'
                         : 'bg-gray-100 border-gray-300 hover:bg-green-50'
                     }`}
                     onClick={() => {
                       if (plot.crop && plot.ready) {
                         harvestCrop(plot.id);
                       } else if (!plot.crop && selectedSeed) {
                         plantSeed(plot.id);
                       } else if (plot.crop && !plot.watered) {
                         waterPlot(plot.id);
                       }
                     }}>
                  <div className="h-full flex flex-col items-center justify-center text-2xl">
                    {plot.greenhouse && (
                      <div className="absolute top-0 right-0 text-xs">🏢</div>
                    )}
                    {plot.pest && (
                      <div className="absolute top-0 left-0 text-xs animate-bounce">🐛</div>
                    )}
                    {plot.crop ? (
                      <>
                        <div className={`transform transition-transform duration-500 ${
                          plot.ready ? 'scale-125 animate-bounce' : 'scale-100'
                        }`}>
                          {CROPS[plot.crop].emoji}
                        </div>
                        <div className="flex absolute bottom-0 left-0 right-0 justify-center">
                          {plot.watered && <Droplets className="w-3 h-3 text-blue-400" />}
                        </div>
                      </>
                    ) : (
                      selectedSeed && <div className="text-gray-400">+</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 建築展示 */}
            {Object.keys(buildings).length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-bold mb-2">建築設施</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(buildings).map(buildingType => (
                    <div key={buildingType} 
                         className="bg-blue-100 rounded-lg p-2 flex items-center space-x-2">
                      <span className="text-2xl">{BUILDINGS[buildingType].emoji}</span>
                      <span className="text-sm font-semibold">{BUILDINGS[buildingType].name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 動物區域 */}
            {animals.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-bold mb-3">我的動物們</h3>
                <div className="grid grid-cols-4 gap-4">
                  {animals.map((animal) => {
                    const hasBuilding = buildings[ANIMALS[animal.type].shelter];
                    return (
                      <div key={animal.id} 
                           className={`rounded-lg p-3 cursor-pointer transition-colors relative ${
                             hasBuilding ? 'bg-green-100 hover:bg-green-200' : 'bg-blue-100 hover:bg-blue-200'
                           }`}
                           onClick={() => feedAnimal(animal.id)}>
                        {hasBuilding && (
                          <div className="absolute top-1 right-1 text-xs">
                            {BUILDINGS[ANIMALS[animal.type].shelter].emoji}
                          </div>
                        )}
                        <div className="text-center">
                          <div className="text-3xl mb-2 animate-bounce">
                            {ANIMALS[animal.type].emoji}
                          </div>
                          <div className="text-sm font-semibold">{animal.name}</div>
                          <div className="flex items-center justify-center mt-1">
                            <Heart className="w-3 h-3 text-red-400 mr-1" />
                            <span className="text-xs">{animal.happiness}/100</span>
                          </div>
                          <div className="bg-gray-200 rounded-full h-1 mt-1">
                            <div className="bg-red-400 h-1 rounded-full transition-all duration-300"
                                 style={{width: `${animal.happiness}%`}}></div>
                          </div>
                          <div className="text-xs text-green-600 mt-1">
                            日收入: ${Math.floor(ANIMALS[animal.type].income * (hasBuilding ? BUILDINGS[ANIMALS[animal.type].shelter].boost : 1))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 側邊欄 */}
          <div className="space-y-4">
            {/* AI顧問 */}
            {aiAdvice && (
              <div className="bg-purple-100 border border-purple-400 rounded-lg p-3">
                <h4 className="font-bold text-purple-800 flex items-center">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  AI顧問
                </h4>
                <p className="text-sm text-purple-700 mt-1">{aiAdvice}</p>
              </div>
            )}

            {/* 行動按鈕 */}
            <div className="bg-white bg-opacity-90 rounded-lg p-4 shadow-lg">
              <h3 className="text-lg font-bold mb-3">商店</h3>
              <div className="space-y-2">
                <button onClick={() => setShowShop(true)}
                        className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded transition-colors flex items-center justify-center text-sm">
                  <Sprout className="mr-2 w-4 h-4" />
                  種子商店
                </button>
                <button onClick={() => setShowAnimalShop(true)}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors text-sm">
                  🐾 動物商店
                </button>
                <button onClick={() => setShowBuildingShop(true)}
                        className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded transition-colors flex items-center justify-center text-sm">
                  <Building className="mr-2 w-4 h-4" />
                  建築商店
                </button>
                <button onClick={() => setShowToolShop(true)}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded transition-colors flex items-center justify-center text-sm">
                  <Hammer className="mr-2 w-4 h-4" />
                  工具商店
                </button>
              </div>
            </div>

            {/* 市場價格 */}
            <div className="bg-white bg-opacity-90 rounded-lg p-4 shadow-lg">
              <h3 className="text-lg font-bold mb-3">市場價格</h3>
              <div className="space-y-1">
                {Object.entries(marketPrices).slice(0, 3).map(([crop, price]) => (
                  <div key={crop} className="flex justify-between items-center text-sm">
                    <span>{CROPS[crop].emoji} {CROPS[crop].name}</span>
                    <span className={`font-semibold ${
                      price > CROPS[crop].sellPrice ? 'text-green-600' : 
                      price < CROPS[crop].sellPrice ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      ${price}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 庫存 */}
            <div className="bg-white bg-opacity-90 rounded-lg p-4 shadow-lg">
              <h3 className="text-lg font-bold mb-3">庫存</h3>
              {Object.entries(inventory).map(([crop, count]) => (
                count > 0 && (
                  <div key={crop} className="flex justify-between items-center py-1">
                    <span>{CROPS[crop].emoji} {CROPS[crop].name}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                )
              ))}
              {Object.values(inventory).every(count => count === 0) && (
                <p className="text-gray-500 text-sm">庫存為空</p>
              )}
            </div>

            {/* 選中的種子 */}
            {selectedSeed && (
              <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-4">
                <h4 className="font-bold text-yellow-800">已選擇種子:</h4>
                <div className="flex items-center mt-2">
                  <span className="text-2xl mr-2">{CROPS[selectedSeed].emoji}</span>
                  <div>
                    <div>{CROPS[selectedSeed].name}</div>
                    <div className="text-sm text-gray-600">
                      成長時間: {CROPS[selectedSeed].growTime}分鐘
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedSeed(null)}
                        className="mt-2 text-sm text-yellow-700 hover:text-yellow-900">
                  取消選擇
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 說明書模態框 */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center text-green-700">
                <span className="text-2xl mr-2">📖</span>
                玩家說明書
              </h2>
              <button onClick={() => setShowHelp(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
              <section>
                <h3 className="font-semibold text-lg text-green-600">🎯 遊戲目標</h3>
                <p className="mt-2">賺取金幣、升級等級，打造屬於自己的夢幻農場。每天記得照顧作物和動物，累積資源就能解鎖更多功能。</p>
              </section>
              <section>
                <h3 className="font-semibold text-lg text-yellow-600">💰 金錢怎麼賺、怎麼花</h3>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>初始資金：500 金幣。</li>
                  <li>收入來源：收成作物、動物每日產出、完成任務或成就。</li>
                  <li>支出項目：購買種子、動物、建築、工具，以及每天的飼料費。</li>
                  <li>市場價格會波動，記得低買高賣，賺得更快。</li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold text-lg text-emerald-600">🌱 作物入門</h3>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>到「種子商店」買種子，在農田空格種下會消耗體力。</li>
                  <li>不同作物有不同成長時間，天氣與工具等級會改變速度。</li>
                  <li>澆水、在溫室種植或擁有筒倉，都能提高售價。</li>
                  <li>例子：玉米基準價 $50，若有澆水（+20%）又在溫室（+50%），收成價約可達 $90。</li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold text-lg text-orange-500">🐾 照顧動物</h3>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>在「動物商店」購買，部分動物需要先蓋對應建築。</li>
                  <li>每天餵食會扣飼料費，但能維持快樂度（最高 100）。</li>
                  <li>快樂度越高，產出的金幣越多；建築會提供額外加成。</li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold text-lg text-blue-600">🏠 建築與工具</h3>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>建築能提升產量或帶來特殊效果，例如溫室免受天氣影響、筒倉賣價 +10%。</li>
                  <li>工具分四個等級，等級越高越省體力、作物長得越快。</li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold text-lg text-sky-600">⚡ 體力、天氣與季節</h3>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>每日體力上限 100，種植、澆水等行動會消耗體力。</li>
                  <li>雨天會自動澆水，晴天適合日照作物，雪天則要小心成長變慢。</li>
                  <li>每 30 天進入新季節（春→夏→秋→冬），部分作物或動物在特定季節表現更好。</li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold text-lg text-purple-600">🏆 成就、任務與顧問</h3>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>完成成就可拿到獎勵金幣，例如第一次種植、養滿 10 隻動物等。</li>
                  <li>和 NPC（農夫老張、商人小李）對話，可接到簡單任務換獎勵。</li>
                  <li>AI 顧問會依照天氣、金錢或體力提醒下一步策略。</li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold text-lg text-rose-600">💾 存檔小幫手</h3>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>共有五個存檔槽位，可手動保存，也能使用⚡快存快速備份。</li>
                  <li>支援導出與導入存檔，想備份或分享農場都沒問題。</li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold text-lg text-gray-700">✨ 新手暖心提醒</h3>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>先從便宜的作物與動物開始，穩定現金流後再投資大型建築。</li>
                  <li>體力不足就先休息或升級工具，避免行動被卡住。</li>
                  <li>時常查看市場價格與天氣，掌握好時機更容易發大財！</li>
                </ul>
              </section>
            </div>
            <button onClick={() => setShowHelp(false)}
                    className="mt-6 w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded transition-colors">
              了解了！
            </button>
          </div>
        </div>
      )}

      {/* 種子商店模態框 */}
      {showShop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">種子商店</h2>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(CROPS).map(([key, crop]) => (
                <div key={key} 
                     className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                     onClick={() => buySeed(key)}>
                  <div className="text-center">
                    <div className="text-3xl mb-2">{crop.emoji}</div>
                    <div className="font-semibold">{crop.name}</div>
                    <div className="text-green-600 font-bold">
                      ${marketPrices[key] || crop.price}
                    </div>
                    <div className="text-xs text-gray-500">
                      成長: {crop.growTime}分鐘
                    </div>
                    <div className="text-xs text-blue-600">
                      基礎售價: ${crop.sellPrice}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowShop(false)}
                    className="mt-4 w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors">
              關閉
            </button>
          </div>
        </div>
      )}

      {/* 動物商店模態框 */}
      {showAnimalShop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">動物商店</h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(ANIMALS).map(([key, animal]) => (
                <div key={key} 
                     className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                     onClick={() => buyAnimal(key)}>
                  <div className="text-center">
                    <div className="text-3xl mb-2">{animal.emoji}</div>
                    <div className="font-semibold">{animal.name}</div>
                    <div className="text-green-600 font-bold">${animal.price}</div>
                    <div className="text-xs text-gray-500">
                      餵食費用: ${animal.foodCost}/天
                    </div>
                    <div className="text-xs text-blue-600">
                      日收入: ${animal.income}
                    </div>
                    <div className="text-xs text-purple-600">
                      需要: {BUILDINGS[animal.shelter]?.name || '無'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowAnimalShop(false)}
                    className="mt-4 w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors">
              關閉
            </button>
          </div>
        </div>
      )}

      {/* 建築商店模態框 */}
      {showBuildingShop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-96 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">建築商店</h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(BUILDINGS).map(([key, building]) => (
                <div key={key} 
                     className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                       buildings[key] 
                         ? 'bg-green-100 border-green-400' 
                         : 'hover:bg-gray-50'
                     }`}
                     onClick={() => buyBuilding(key)}>
                  <div className="text-center">
                    <div className="text-3xl mb-2">{building.emoji}</div>
                    <div className="font-semibold">{building.name}</div>
                    <div className={`font-bold ${buildings[key] ? 'text-green-600' : 'text-green-600'}`}>
                      {buildings[key] ? '已擁有' : `${building.price}`}
                    </div>
                    <div className="text-xs text-gray-600 mt-2">
                      {building.description}
                    </div>
                    {building.boost !== 1.0 && (
                      <div className="text-xs text-blue-600">
                        效果加成: {Math.round(building.boost * 100)}%
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowBuildingShop(false)}
                    className="mt-4 w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors">
              關閉
            </button>
          </div>
        </div>
      )}

      {/* 工具商店模態框 */}
      {showToolShop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">工具商店</h2>
            <div className="space-y-4">
              {Object.entries(TOOLS).map(([key, tool]) => (
                <div key={key} 
                     className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                       tools === key 
                         ? 'bg-green-100 border-green-400' 
                         : 'hover:bg-gray-50'
                     }`}
                     onClick={() => buyTool(key)}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{tool.name}</div>
                      <div className="text-sm text-gray-600">
                        節省體力: {tool.energyReduction}
                      </div>
                      <div className="text-sm text-gray-600">
                        速度加成: {Math.round(tool.speedBoost * 100)}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${tools === key ? 'text-green-600' : 'text-blue-600'}`}>
                        {tools === key ? '已擁有' : tool.price === 0 ? '免費' : `${tool.price}`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowToolShop(false)}
                    className="mt-4 w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors">
              關閉
            </button>
          </div>
        </div>
      )}

      {/* 成就模態框 */}
      {showAchievements && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">🏆 成就系統</h2>
            <div className="space-y-3">
              {ACHIEVEMENTS.map(achievement => (
                <div key={achievement.id} 
                     className={`border rounded-lg p-3 ${
                       completedAchievements.has(achievement.id) 
                         ? 'bg-green-100 border-green-400' 
                         : 'bg-gray-50 border-gray-300'
                     }`}>
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{achievement.icon}</span>
                    <div className="flex-1">
                      <div className="font-semibold">{achievement.name}</div>
                      <div className="text-sm text-gray-600">{achievement.description}</div>
                      <div className="text-xs text-green-600">獎勵: ${achievement.reward}</div>
                    </div>
                    {completedAchievements.has(achievement.id) && (
                      <span className="text-green-600 font-bold">✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowAchievements(false)}
                    className="mt-4 w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors">
              關閉
            </button>
          </div>
        </div>
      )}

      {/* NPC對話模態框 */}
      {showNPCDialog && currentNPC && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <span className="text-3xl mr-2">{currentNPC.emoji}</span>
              {currentNPC.name}
            </h2>
            <div className="mb-4">
              <p className="text-gray-700">
                {currentNPC.dialogue[Math.floor(Math.random() * currentNPC.dialogue.length)]}
              </p>
            </div>
            <button onClick={() => setShowNPCDialog(false)}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors">
              結束對話
            </button>
          </div>
        </div>
      )}

      {/* 統計模態框 */}
      {showStats && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">📊 農場統計</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>總金錢:</span>
                <span className="font-bold">${money}</span>
              </div>
              <div className="flex justify-between">
                <span>當前等級:</span>
                <span className="font-bold">{level}</span>
              </div>
              <div className="flex justify-between">
                <span>動物數量:</span>
                <span className="font-bold">{animals.length}</span>
              </div>
              <div className="flex justify-between">
                <span>建築數量:</span>
                <span className="font-bold">{Object.keys(buildings).length}</span>
              </div>
              <div className="flex justify-between">
                <span>已完成成就:</span>
                <span className="font-bold">{completedAchievements.size}/{ACHIEVEMENTS.length}</span>
              </div>
              <div className="flex justify-between">
                <span>遊戲天數:</span>
                <span className="font-bold">{day}</span>
              </div>
              <div className="flex justify-between">
                <span>當前工具:</span>
                <span className="font-bold">{TOOLS[tools].name}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <button onClick={exportSave}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors mb-2">
                🔗 導出存檔
              </button>
            </div>
            <button onClick={() => setShowStats(false)}
                    className="mt-2 w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors">
              關閉
            </button>
          </div>
        </div>
      )}

      {/* 存檔模態框 */}
      {showSaveMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">💾 保存遊戲</h2>
            <div className="space-y-3">
              {Object.entries(saveSlots).map(([slotName, saveState]) => (
                <div key={slotName} 
                     className="border rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <div className="font-semibold">
                      存檔槽 {slotName.slice(-1)} {slotName === 'slot5' && '(自動)'}
                    </div>
                    {saveState ? (
                      <div className="text-sm text-gray-600">
                        第{saveState.day}天 - 等級{saveState.level} - ${saveState.money}
                        <div className="text-xs">
                          {new Date(saveState.saveTime).toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400">空存檔槽</div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => saveToSlot(slotName)}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">
                      保存
                    </button>
                    {saveState && (
                      <button onClick={() => deleteSaveSlot(slotName)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                        刪除
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <button onClick={exportSave}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors mb-2">
                🔗 導出存檔數據
              </button>
            </div>
            <button onClick={() => setShowSaveMenu(false)}
                    className="mt-2 w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors">
              關閉
            </button>
          </div>
        </div>
      )}

      {/* 載入模態框 */}
      {showLoadMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">📁 載入遊戲</h2>
            <div className="space-y-3 mb-4">
              {Object.entries(saveSlots).map(([slotName, saveState]) => (
                <div key={slotName} 
                     className={`border rounded-lg p-3 flex justify-between items-center ${
                       saveState ? 'hover:bg-gray-50 cursor-pointer' : 'opacity-50'
                     }`}>
                  <div>
                    <div className="font-semibold">
                      存檔槽 {slotName.slice(-1)} {slotName === 'slot5' && '(自動)'}
                    </div>
                    {saveState ? (
                      <div className="text-sm text-gray-600">
                        第{saveState.day}天 - 等級{saveState.level} - ${saveState.money}
                        <div className="text-xs">
                          {new Date(saveState.saveTime).toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400">空存檔槽</div>
                    )}
                  </div>
                  {saveState && (
                    <button onClick={() => loadFromSlot(slotName)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
                      載入
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">📥 導入存檔數據</h3>
              <textarea
                value={loadData}
                onChange={(e) => setLoadData(e.target.value)}
                placeholder="貼上存檔數據..."
                className="w-full h-24 border rounded-lg p-2 text-sm font-mono resize-none"
              />
              <button onClick={importSave}
                      className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded transition-colors mt-2">
                載入存檔
              </button>
            </div>
            
            <button onClick={() => setShowLoadMenu(false)}
                    className="mt-4 w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors">
              關閉
            </button>
          </div>
        </div>
      )}

      {/* 導出存檔模態框 */}
      {saveData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h2 className="text-xl font-bold mb-4">🔗 導出存檔數據</h2>
            <p className="text-sm text-gray-600 mb-3">
              複製下面的存檔數據，保存到安全的地方。以後可以使用這些數據恢復遊戲進度。
            </p>
            <textarea
              value={saveData}
              readOnly
              className="w-full h-64 border rounded-lg p-3 text-xs font-mono resize-none"
              onClick={(e) => e.target.select()}
            />
            <div className="flex space-x-2 mt-4">
              <button onClick={() => {
                navigator.clipboard?.writeText(saveData);
                addNotification('存檔數據已複製到剪貼板！');
              }}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors">
                📋 複製到剪貼板
              </button>
              <button onClick={() => setSaveData('')}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors">
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmGame;