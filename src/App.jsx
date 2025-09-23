import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Sprout, Coins, ShoppingCart, Heart, Home, Sun, Moon, Zap, Droplets, Hammer, Building, Star, Save, Trophy, Settings, MessageCircle, Target, UtensilsCrossed } from 'lucide-react';
import { CROPS, ANIMALS, BUILDINGS, TOOLS, ACHIEVEMENTS, NPCS, WEATHER_TYPES, SEASONS, FARM_SUPPLIES } from './game/data/GameCatalog';
import { GameFormatter } from './game/utils/GameFormatter';
import { GameEngine } from './game/engine/GameEngine';
import { SaveManager } from './game/engine/SaveManager';
import { NotificationCenter } from './game/engine/NotificationCenter';

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
      pestDays: 0,
      ready: false,
    }))
  );

  const [farmSupplies, setFarmSupplies] = useState({
    fertilizer: 0,
    pesticide: 0,
    medicine: 0,
  });

  const [animals, setAnimals] = useState([]);
  const [buildings, setBuildings] = useState({});
  const [tools, setTools] = useState('basic');

  // UI狀態
  const [selectedSeed, setSelectedSeed] = useState(null);
  const [selectedSupply, setSelectedSupply] = useState(null);
  const [showShop, setShowShop] = useState(false);
  const [showAnimalShop, setShowAnimalShop] = useState(false);
  const [showBuildingShop, setShowBuildingShop] = useState(false);
  const [showToolShop, setShowToolShop] = useState(false);
  const [showSupplyShop, setShowSupplyShop] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showNPCDialog, setShowNPCDialog] = useState(false);
  const [currentNPC, setCurrentNPC] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [showLoadMenu, setShowLoadMenu] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const notificationCenter = useMemo(() => new NotificationCenter(setNotifications), []);
  const addNotification = useCallback((message, options) => {
    notificationCenter.push(message, options);
  }, [notificationCenter]);
  const dismissNotification = useCallback((id) => {
    notificationCenter.dismiss(id);
  }, [notificationCenter]);
  
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

  const stateRef = useRef({});

  stateRef.current = {
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
    saveSlots,
    selectedSeed,
    selectedSupply,
    loadData,
  };

  const saveManager = useMemo(() => new SaveManager({
    stateRef,
    setters: {
      setMoney,
      setEnergy,
      setLevel,
      setExperience,
      setTime,
      setDay,
      setSeason,
      setWeather,
      setWeatherDuration,
      setInventory,
      setFarm,
      setAnimals,
      setBuildings,
      setTools,
      setFarmSupplies,
      setCompletedAchievements,
      setDailyStats,
      setAutomation,
      setMarketPrices,
      setSaveSlots,
      setShowSaveMenu,
      setShowLoadMenu,
      setLoadData,
      setSaveData,
      setSelectedSeed,
      setSelectedSupply,
      setShowSupplyShop,
    },
    notifier: addNotification,
  }), [addNotification]);

  const gameEngine = useMemo(() => new GameEngine({
    stateRef,
    setters: {
      setMoney,
      setSelectedSeed,
      setSelectedSupply,
      setShowShop,
      setShowSupplyShop,
      setFarm,
      setEnergy,
      setExperience,
      setInventory,
      setFarmSupplies,
      setAnimals,
      setShowAnimalShop,
      setBuildings,
      setShowBuildingShop,
      setTools,
      setShowToolShop,
    },
    notifier: addNotification,
  }), [addNotification]);

  const saveToSlot = useCallback((slotName) => {
    saveManager.saveToSlot(slotName);
  }, [saveManager]);

  const loadFromSlot = useCallback((slotName) => {
    saveManager.loadFromSlot(slotName);
  }, [saveManager]);

  const exportSave = useCallback(() => {
    saveManager.exportSave();
  }, [saveManager]);

  const importSave = useCallback(() => {
    saveManager.importSave();
  }, [saveManager]);

  const deleteSaveSlot = useCallback((slotName) => {
    saveManager.deleteSaveSlot(slotName);
  }, [saveManager]);

  const quickSave = useCallback(() => {
    saveManager.quickSave();
  }, [saveManager]);

  const quickLoad = useCallback(() => {
    saveManager.quickLoad();
  }, [saveManager]);

  // AI顧問系統
  useEffect(() => {
    const generateAdvice = () => {
      const safeAnimals = Array.isArray(animals) ? animals : [];
      const safeInventory = inventory || {};
      const safeFarm = Array.isArray(farm) ? farm : [];

      const advices = [
        weather === 'sunny' ? '☀️ 晴天適合種植番茄和草莓！' : '',
        weather === 'rainy' ? '🌧️ 雨天作物會自動澆水，適合種植小麥！' : '',
        energy < 30 ? '⚡ 體力不足，建議休息或升級工具！' : '',
        money > 2000 ? '💰 資金充足，考慮建造新建築！' : '',
        safeAnimals.some(a => (a.happiness ?? 50) < 40) ? '🐾 有動物心情低落，餵食或陪伴牠們吧！' : '',
        safeAnimals.some(a => (a.hunger ?? 60) < 35) ? '🍽️ 有動物快餓扁了，趕快餵牠們！' : '',
        safeAnimals.some(a => a.sick) ? '🤒 有動物生病了，使用營養劑能幫助牠們恢復。' : '',
        safeFarm.some(plot => plot.pest) ? '🐛 有作物遭害蟲啃食，記得噴灑驅蟲劑！' : '',
        Object.values(safeInventory).some(count => count > 10) ? '📦 庫存充足，可以考慮出售！' : '',
      ].filter(Boolean);

      if (advices.length > 0) {
        setAiAdvice(advices[Math.floor(Math.random() * advices.length)]);
      } else {
        setAiAdvice('🌱 保持平衡發展，慢慢擴張農場！');
      }
    };

    const timer = setInterval(generateAdvice, 60000);
    generateAdvice();
    return () => clearInterval(timer);
  }, [weather, energy, money, animals, inventory, farm]);

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
          addNotification(`🏆 達成成就：${achievement.name}！獲得 $${achievement.reward}`, { type: 'success' });
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
              const currentSeasonIndex = SEASONS.indexOf(season);
              const nextSeason = SEASONS[(currentSeasonIndex + 1) % SEASONS.length];
              setSeason(nextSeason);
              addNotification(`🌸 季節變為 ${GameFormatter.seasonName(nextSeason)}！`, { type: 'info' });
            }
            return newDay;
          });
          
          setEnergy(100);

          // 動物每日狀態與收入結算
          setAnimals(prevAnimals => {
            if (!Array.isArray(prevAnimals) || prevAnimals.length === 0) {
              return prevAnimals;
            }

            let totalIncome = 0;
            const hungryNames = [];
            const lostAnimals = [];
            const newlySick = [];
            const sickAnimals = [];
            const updatedAnimals = [];
            const newbornAnimals = [];
            const typeCounts = prevAnimals.reduce((counts, current) => {
              const type = current.type;
              counts[type] = (counts[type] || 0) + 1;
              return counts;
            }, {});

            prevAnimals.forEach(animal => {
              const animalData = ANIMALS[animal.type];
              const shelterKey = animalData.shelter;
              const hasShelter = buildings?.[shelterKey];
              const boost = hasShelter ? BUILDINGS[shelterKey].boost : 1;

              const previousHunger = animal.hunger ?? 60;
              const hunger = Math.max(0, previousHunger - 30);

              if (hunger <= 0) {
                lostAnimals.push(animal.name);
                return;
              }

              let happiness = Math.max(0, (animal.happiness ?? animalData.happiness) - 10);
              let canProduce = happiness > 20 && hunger > 30;
              let sick = Boolean(animal.sick);

              if (hunger <= 10) {
                hungryNames.push(`${animal.name}（急需餵食）`);
                happiness = Math.max(0, happiness - 25);
                canProduce = false;
              } else if (hunger <= 30) {
                hungryNames.push(animal.name);
                happiness = Math.max(0, happiness - 10);
                canProduce = happiness > 25;
              }

              if (!sick && (hunger <= 20 || happiness <= 20)) {
                sick = true;
                newlySick.push(animal.name);
              }

              if (sick) {
                happiness = Math.max(0, happiness - 15);
                canProduce = false;
                sickAnimals.push(animal.name);
              }

              const income = canProduce
                ? Math.floor(animalData.income * boost * (happiness / 100))
                : 0;
              totalIncome += income;

              if (!sick && hunger >= 75 && happiness >= 75 && newbornAnimals.length < 3) {
                const birthChance = 0.12
                  + (happiness > 90 ? 0.05 : 0)
                  + (hunger > 90 ? 0.05 : 0);
                if (Math.random() < birthChance) {
                  typeCounts[animal.type] = (typeCounts[animal.type] || 0) + 1;
                  const baseName = animalData.name;
                  const babyIndex = typeCounts[animal.type];
                  const babyName = `${baseName}寶寶${babyIndex}`;
                  newbornAnimals.push({
                    id: Date.now() + newbornAnimals.length + Math.floor(Math.random() * 1000),
                    type: animal.type,
                    happiness: animalData.happiness,
                    hunger: 65,
                    lastFed: Date.now(),
                    sick: false,
                    name: babyName,
                  });
                }
              }

              updatedAnimals.push({
                ...animal,
                happiness,
                hunger,
                sick,
              });
            });

            if (totalIncome > 0) {
              setMoney(prevMoney => prevMoney + totalIncome);
              addNotification(`🐾 動物們帶來了 $${totalIncome} 的收入！`, { type: 'success' });
            }

            if (hungryNames.length > 0) {
              const names = Array.from(new Set(hungryNames)).join('、');
              addNotification(`🍽️ ${names} 肚子餓了，記得餵食！`, { type: 'warning' });
            }

            if (lostAnimals.length > 0) {
              const names = Array.from(new Set(lostAnimals)).join('、');
              addNotification(`💀 ${names} 因為長期挨餓離開了農場……`, { type: 'error' });
            }

            if (newlySick.length > 0) {
              const names = Array.from(new Set(newlySick)).join('、');
              addNotification(`🤒 ${names} 身體不適，需要營養劑治療！`, { type: 'error' });
            }

            const ongoingSick = Array.from(new Set(sickAnimals.filter(name => !newlySick.includes(name))));
            if (ongoingSick.length > 0) {
              addNotification(`💊 ${ongoingSick.join('、')} 仍在療養中，記得使用營養劑。`, { type: 'warning' });
            }

            if (newbornAnimals.length > 0) {
              const names = newbornAnimals.map(animal => animal.name).join('、');
              addNotification(`🐣 ${names} 出生了，農場又更熱鬧了！`, { type: 'success' });
            }

            return [...updatedAnimals, ...newbornAnimals];
          });

          const infestedCrops = [];
          const destroyedCrops = [];
          const autoWatered = new Set();
          setFarm(prevFarm => {
            let changed = false;
            const hasSprinkler = buildings?.sprinkler;
            const nextFarm = prevFarm.map(plot => {
              let updatedPlot = plot;

              if (plot.crop) {
                const originalCrop = CROPS[plot.crop];
                if (!plot.ready && !plot.pest) {
                  const pestChance = plot.fertilized ? 0.05 : 0.12;
                  if (Math.random() < pestChance) {
                    if (originalCrop) {
                      infestedCrops.push(originalCrop.name);
                    }
                    updatedPlot = { ...plot, pest: true, pestDays: 1 };
                  }
                }

                if (updatedPlot.pest) {
                  const currentDays = updatedPlot.pestDays ?? 0;
                  const nextDays = currentDays + (plot.pest ? 1 : 0);
                  if (!updatedPlot.ready && nextDays >= 3) {
                    const damagedCrop = updatedPlot.crop ? CROPS[updatedPlot.crop] : null;
                    if (damagedCrop) {
                      destroyedCrops.push(damagedCrop.name);
                    }
                    updatedPlot = {
                      ...updatedPlot,
                      crop: null,
                      plantTime: null,
                      watered: false,
                      fertilized: false,
                      pest: false,
                      pestDays: 0,
                      ready: false,
                    };
                  } else if (nextDays !== currentDays) {
                    updatedPlot = { ...updatedPlot, pestDays: nextDays };
                  }
                } else if (updatedPlot.pestDays) {
                  updatedPlot = { ...updatedPlot, pestDays: 0 };
                }

                if (hasSprinkler && updatedPlot.crop && !updatedPlot.ready && !updatedPlot.watered) {
                  const cropInfo = CROPS[updatedPlot.crop];
                  updatedPlot = { ...updatedPlot, watered: true };
                  if (cropInfo) {
                    autoWatered.add(cropInfo.name);
                  }
                }
              } else {
                if (updatedPlot.fertilized || updatedPlot.pest || (updatedPlot.pestDays ?? 0) > 0 || updatedPlot.ready) {
                  updatedPlot = {
                    ...updatedPlot,
                    fertilized: false,
                    pest: false,
                    pestDays: 0,
                    ready: false,
                  };
                }
              }

              if (updatedPlot !== plot) {
                changed = true;
              }

              return updatedPlot;
            });

            return changed ? nextFarm : prevFarm;
          });

          if (infestedCrops.length > 0) {
            const names = Array.from(new Set(infestedCrops)).join('、');
            addNotification(`🐛 害蟲入侵！${names} 需要使用驅蟲劑。`, { type: 'warning' });
          }

          if (destroyedCrops.length > 0) {
            const names = Array.from(new Set(destroyedCrops)).join('、');
            addNotification(`🥀 ${names} 因害蟲侵蝕而枯萎了……記得提早使用除蟲劑。`, { type: 'error' });
          }

          if (autoWatered.size > 0) {
            const names = Array.from(autoWatered).join('、');
            addNotification(`🚿 自動灑水器已為 ${names} 補足水分。`, { type: 'info' });
          }

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
          addNotification(`天氣變為 ${GameFormatter.weatherName(newWeather)} ${GameFormatter.weatherIcon(newWeather)}`, { type: 'info' });
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
          const fertilizerBoost = plot.fertilized ? 1.25 : 1;

          const adjustedGrowTime = (cropData.growTime * 60000) / (weatherMultiplier * toolMultiplier * fertilizerBoost);

          if (now - plot.plantTime >= adjustedGrowTime && !plot.ready) {
            addNotification(`${cropData.emoji} ${cropData.name} 成熟了！`, { type: 'success' });
            return { ...plot, ready: true };
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
      addNotification(`🎉 升級到等級 ${level + 1}！`, { type: 'success' });
    }
  }, [experience, level, addNotification]);

  const buySeed = useCallback((seedType) => {
    gameEngine.buySeed(seedType);
  }, [gameEngine]);

  const plantSeed = useCallback((plotId) => {
    gameEngine.plantSeed(plotId);
  }, [gameEngine]);

  const harvestCrop = useCallback((plotId) => {
    gameEngine.harvestCrop(plotId);
  }, [gameEngine]);

  const waterPlot = useCallback((plotId) => {
    gameEngine.waterPlot(plotId);
  }, [gameEngine]);

  const buyAnimal = useCallback((animalType) => {
    gameEngine.buyAnimal(animalType);
  }, [gameEngine]);

  const buyBuilding = useCallback((buildingType) => {
    gameEngine.buyBuilding(buildingType);
  }, [gameEngine]);

  const buyTool = useCallback((toolType) => {
    gameEngine.buyTool(toolType);
  }, [gameEngine]);

  const feedAnimal = useCallback((animalId) => {
    gameEngine.feedAnimal(animalId);
  }, [gameEngine]);

  const buySupply = useCallback((supplyType) => {
    gameEngine.buySupply(supplyType);
  }, [gameEngine]);

  const selectSupply = useCallback((supplyType) => {
    gameEngine.selectSupply(supplyType);
  }, [gameEngine]);

  const applySupply = useCallback((plotId) => gameEngine.applySupply(plotId), [gameEngine]);

  const treatAnimal = useCallback((animalId) => {
    gameEngine.treatAnimal(animalId);
  }, [gameEngine]);

  const interactNPC = (npc) => {
    setCurrentNPC(npc);
    setShowNPCDialog(true);
  };

  const getTimeIcon = () => {
    if (time >= 6 && time < 18) return <Sun className="w-5 h-5 text-yellow-400" />;
    return <Moon className="w-5 h-5 text-blue-300" />;
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
        {notifications.map(notification => {
          const styleByType = {
            success: 'bg-green-500/95 border-green-300',
            info: 'bg-blue-500/95 border-blue-300',
            warning: 'bg-yellow-500/95 border-yellow-300',
            error: 'bg-red-500/95 border-red-300',
          };
          const tone = styleByType[notification.type] || styleByType.info;
          const textClass = notification.type === 'warning' ? 'text-gray-900' : 'text-white';
          const closeClass = notification.type === 'warning'
            ? 'text-gray-500 hover:text-gray-700'
            : 'text-white/80 hover:text-white';
          return (
            <div key={notification.id}
                 className={`px-4 py-3 rounded-lg shadow-lg border flex items-start justify-between gap-2 text-sm transition-all duration-500 backdrop-blur ${tone} ${textClass}`}>
              <span className="leading-snug">{notification.message}</span>
              <button
                onClick={() => dismissNotification(notification.id)}
                className={closeClass}
                aria-label="關閉通知"
              >
                ×
              </button>
            </div>
          );
        })}
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
          <span>{GameFormatter.weatherIcon(weather)}</span>
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
              我的農場 - {GameFormatter.seasonName(season)} {GameFormatter.weatherName(weather)}
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
                       if (selectedSupply) {
                         const handled = applySupply(plot.id);
                         if (handled) {
                           return;
                         }
                       }

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
                    {plot.fertilized && !plot.ready && (
                      <div className="absolute bottom-1 right-1 text-xs">🌿</div>
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
                    const animalData = ANIMALS[animal.type];
                    const hasBuilding = buildings[animalData.shelter];
                    const hunger = animal.hunger ?? 50;
                    const isHungry = hunger <= 30;
                    const isSick = Boolean(animal.sick);
                    const medicineCount = farmSupplies.medicine || 0;
                    return (
                      <div key={animal.id}
                           className={`rounded-lg p-3 transition-colors relative border ${
                             isSick
                               ? 'border-red-300 bg-red-100 hover:bg-red-200'
                               : hasBuilding
                                 ? 'border-green-200 bg-green-100 hover:bg-green-200'
                                 : 'border-blue-200 bg-blue-100 hover:bg-blue-200'
                           }`}>
                        {hasBuilding && (
                          <div className="absolute top-1 right-1 text-xs">
                            {BUILDINGS[animalData.shelter].emoji}
                          </div>
                        )}
                        {isSick && (
                          <div className="absolute top-1 left-1 text-xs animate-pulse">🤒</div>
                        )}
                        <div className="text-center space-y-2">
                          <div className="text-3xl animate-bounce">
                            {animalData.emoji}
                          </div>
                          <div className="text-sm font-semibold">{animal.name}</div>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center justify-center gap-1">
                              <Heart className="w-3 h-3 text-red-400" />
                              <span>{Math.round(animal.happiness ?? animalData.happiness)} / 100</span>
                            </div>
                            <div className="bg-gray-200 rounded-full h-1">
                              <div className="bg-red-400 h-1 rounded-full transition-all duration-300"
                                   style={{ width: `${Math.max(0, Math.min(100, animal.happiness ?? animalData.happiness))}%` }}></div>
                            </div>
                            <div className="flex items-center justify-center gap-1 mt-2">
                              <UtensilsCrossed className={`w-3 h-3 ${isHungry ? 'text-orange-500' : 'text-amber-400'}`} />
                              <span>{Math.round(hunger)}%</span>
                            </div>
                            <div className="bg-gray-200 rounded-full h-1">
                              <div className={`h-1 rounded-full transition-all duration-300 ${isHungry ? 'bg-orange-400' : 'bg-yellow-400'}`}
                                   style={{ width: `${Math.max(0, Math.min(100, hunger))}%` }}></div>
                            </div>
                          </div>
                          <div className="text-xs text-green-600">
                            日收入: ${Math.floor(animalData.income * (hasBuilding ? BUILDINGS[animalData.shelter].boost : 1))}
                          </div>
                          <button
                            onClick={() => feedAnimal(animal.id)}
                            className={`w-full text-xs font-semibold py-1 rounded transition-colors ${
                              isHungry ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-yellow-300 hover:bg-yellow-400 text-amber-800'
                            }`}
                          >
                            餵食 (-${animalData.foodCost})
                          </button>
                          {isHungry && (
                            <div className="text-xs text-orange-600">肚子餓扁了，快餵我！</div>
                          )}
                          {isSick && (
                            <div className="mt-2 space-y-1">
                              <button
                                onClick={() => treatAnimal(animal.id)}
                                disabled={medicineCount === 0}
                                className={`w-full text-xs font-semibold py-1 rounded transition-colors ${
                                  medicineCount > 0
                                    ? 'bg-teal-500 hover:bg-teal-600 text-white'
                                    : 'bg-teal-100 text-teal-700 cursor-not-allowed'
                                }`}
                              >
                                治療 {medicineCount > 0 ? `(剩餘 ${medicineCount})` : '(需要營養劑)'}
                              </button>
                              <div className="text-xs text-red-500">身體不適，產出暫停中。</div>
                            </div>
                          )}
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
                <button onClick={() => setShowSupplyShop(true)}
                        className="w-full bg-teal-500 hover:bg-teal-600 text-white py-2 px-4 rounded transition-colors flex items-center justify-center text-sm">
                  🌿 農務用品
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

            {/* 農務用品 */}
            <div className="bg-white bg-opacity-90 rounded-lg p-4 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold">農務用品</h3>
                <span className="text-xs text-gray-500">點擊選擇使用</span>
              </div>
              <div className="space-y-2">
                {Object.entries(FARM_SUPPLIES).map(([key, supply]) => {
                  const count = farmSupplies[key] || 0;
                  const isSelected = selectedSupply === key;
                  const isOut = count === 0;
                  const disabled = isOut && key !== 'medicine';
                  return (
                    <button
                      key={key}
                      onClick={() => selectSupply(key)}
                      disabled={disabled}
                      className={`w-full flex items-center justify-between text-sm border rounded-lg px-3 py-2 transition-colors ${
                        isSelected ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 hover:border-teal-300'
                      } ${isOut ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{supply.emoji}</span>
                        <span className="font-semibold">{supply.name}</span>
                      </span>
                      <span className="text-xs text-gray-600">庫存 {count}</span>
                    </button>
                  );
                })}
              </div>
              {selectedSupply && FARM_SUPPLIES[selectedSupply] && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-teal-700">目前選擇：{FARM_SUPPLIES[selectedSupply].name}</p>
                  <button
                    onClick={() => setSelectedSupply(null)}
                    className="text-[11px] text-teal-600 hover:text-teal-800"
                  >
                    取消選擇
                  </button>
                </div>
              )}
              {Object.values(farmSupplies).every(count => count === 0) && (
                <p className="text-xs text-gray-500 mt-2">沒有庫存？到農務用品購買吧！</p>
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
                  <li>農務用品提供肥料與驅蟲劑，肥料能縮短成熟時間，害蟲會讓作物暫停生長。</li>
                  <li>例子：玉米基準價 $50，若有澆水（+20%）又在溫室（+50%），收成價約可達 $90。</li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold text-lg text-orange-500">🐾 照顧動物</h3>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>在「動物商店」購買，部分動物需要先蓋對應建築。</li>
                  <li>每天餵食會扣飼料費，但能維持快樂度（最高 100）。</li>
                  <li>快樂度越高，產出的金幣越多；建築會提供額外加成。</li>
                  <li>動物長期飢餓或心情低落會生病，產出停擺，記得準備營養劑治療。</li>
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

      {/* 農務用品商店 */}
      {showSupplyShop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">農務用品商店</h2>
            <div className="space-y-4">
              {Object.entries(FARM_SUPPLIES).map(([key, supply]) => (
                <div key={key}
                     className="border rounded-lg p-4 cursor-pointer hover:bg-teal-50 transition-colors"
                     onClick={() => buySupply(key)}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-2xl">{supply.emoji}</div>
                      <div className="font-semibold mt-1">{supply.name}</div>
                      <div className="text-sm text-gray-600 mt-1 leading-snug">{supply.description}</div>
                    </div>
                    <div className="text-green-600 font-bold">${supply.price}</div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowSupplyShop(false)}
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
                addNotification('存檔數據已複製到剪貼板！', { type: 'info' });
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
