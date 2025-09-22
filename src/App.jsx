import React, { useState, useEffect, useCallback } from 'react';
import { Sprout, Coins, ShoppingCart, Heart, Home, Sun, Moon, Zap, Droplets, Hammer, Building, Star } from 'lucide-react';

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

const WEATHER_TYPES = ['sunny', 'rainy', 'cloudy', 'storm', 'snow'];

const FarmGame = () => {
  const [money, setMoney] = useState(500);
  const [energy, setEnergy] = useState(100);
  const [level, setLevel] = useState(1);
  const [experience, setExperience] = useState(0);
  const [time, setTime] = useState(6);
  const [day, setDay] = useState(1);
  const [season, setSeason] = useState('spring');
  const [weather, setWeather] = useState('sunny');
  const [weatherDuration, setWeatherDuration] = useState(0);
  
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
      greenhouse: false
    }))
  );
  
  const [animals, setAnimals] = useState([]);
  const [buildings, setBuildings] = useState({});
  const [selectedSeed, setSelectedSeed] = useState(null);
  const [showShop, setShowShop] = useState(false);
  const [showAnimalShop, setShowAnimalShop] = useState(false);
  const [showBuildingShop, setShowBuildingShop] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // 天氣系統
  useEffect(() => {
    const weatherTimer = setInterval(() => {
      setWeatherDuration(prev => {
        if (prev <= 0) {
          const newWeather = WEATHER_TYPES[Math.floor(Math.random() * WEATHER_TYPES.length)];
          setWeather(newWeather);
          addNotification(`天氣變為 ${getWeatherName(newWeather)} ${getWeatherIcon(newWeather)}`);
          
          // 暴風雨會損害未受保護的作物
          if (newWeather === 'storm') {
            setFarm(prev => prev.map(plot => {
              if (plot.crop && !plot.greenhouse && Math.random() < 0.3) {
                addNotification(`${CROPS[plot.crop].emoji} 在暴風雨中受損！`);
                return { ...plot, crop: null, plantTime: null, watered: false };
              }
              return plot;
            }));
          }
          
          return Math.floor(Math.random() * 8) + 3; // 3-10 小時
        }
        return prev - 1;
      });
    }, 30000); // 每30秒檢查一次

    return () => clearInterval(weatherTimer);
  }, []);

  // 時間系統
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(prev => {
        const newTime = prev + 1;
        if (newTime >= 24) {
          // 新的一天
          setDay(prevDay => {
            const newDay = prevDay + 1;
            // 每30天換季節
            if (newDay % 30 === 0) {
              const seasons = ['spring', 'summer', 'autumn', 'winter'];
              const currentSeasonIndex = seasons.indexOf(season);
              const nextSeason = seasons[(currentSeasonIndex + 1) % 4];
              setSeason(nextSeason);
              addNotification(`季節變為 ${getSeasonName(nextSeason)}！`);
            }
            return newDay;
          });
          
          setEnergy(100);
          
          // 動物每日收入和快樂度變化
          setAnimals(prev => prev.map(animal => {
            const building = buildings[ANIMALS[animal.type].shelter];
            const boost = building ? BUILDINGS[ANIMALS[animal.type].shelter].boost : 1;
            const income = Math.floor(ANIMALS[animal.type].income * boost * (animal.happiness / 100));
            
            if (animal.happiness > 20) {
              setMoney(prevMoney => prevMoney + income);
              if (income > 0) {
                addNotification(`${animal.name} 產生了 $${income}！`);
              }
            }
            
            return {
              ...animal,
              happiness: Math.max(0, animal.happiness - 15)
            };
          }));

          // 風車每日收入
          if (buildings.windmill) {
            const windmillIncome = 50;
            setMoney(prev => prev + windmillIncome);
            addNotification(`🌪️ 風車產生了 $${windmillIncome}！`);
          }
          
          return 6; // 早上6點開始
        }
        return newTime;
      });
    }, 20000); // 20秒 = 1小時

    return () => clearInterval(timer);
  }, [season, buildings, animals]);

  // 作物成長系統
  useEffect(() => {
    const growTimer = setInterval(() => {
      setFarm(prev => prev.map(plot => {
        if (plot.crop && plot.plantTime) {
          const now = Date.now();
          const cropData = CROPS[plot.crop];
          
          // 天氣影響成長速度
          let weatherMultiplier = 1;
          if (!plot.greenhouse) {
            weatherMultiplier = cropData.weatherBonus[weather] || 1;
            // 雨天自動澆水
            if (weather === 'rainy' && !plot.watered) {
              plot.watered = true;
            }
          } else {
            weatherMultiplier = 1.2; // 溫室加成
          }
          
          const adjustedGrowTime = cropData.growTime * 60000 / weatherMultiplier;
          
          if (now - plot.plantTime >= adjustedGrowTime && !plot.ready) {
            addNotification(`${cropData.emoji} ${cropData.name} 成熟了！`);
            return { ...plot, ready: true };
          }
        }
        return plot;
      }));
    }, 5000);

    return () => clearInterval(growTimer);
  }, [weather]);

  // 升級系統
  useEffect(() => {
    if (experience >= level * 100) {
      setLevel(prev => prev + 1);
      setExperience(prev => prev - (level * 100));
      addNotification(`🎉 升級到等級 ${level + 1}！`);
    }
  }, [experience, level]);

  const addNotification = useCallback((message) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

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
    if (money >= CROPS[seedType].price) {
      setMoney(prev => prev - CROPS[seedType].price);
      setSelectedSeed(seedType);
      setShowShop(false);
      addNotification(`購買了 ${CROPS[seedType].name} 種子！`);
    } else {
      addNotification('金錢不足！');
    }
  };

  const plantSeed = (plotId) => {
    if (!selectedSeed) return;
    
    const energyCost = buildings.well ? 5 : 10; // 水井減少體力消耗
    if (energy < energyCost) {
      addNotification('體力不足！');
      return;
    }
    
    setFarm(prev => prev.map(plot => 
      plot.id === plotId && !plot.crop
        ? { ...plot, crop: selectedSeed, plantTime: Date.now(), watered: false, ready: false }
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
    const cropData = CROPS[crop];
    
    // 計算加成
    let bonus = 1;
    if (plot.watered) bonus *= 1.2;
    if (plot.fertilized) bonus *= 1.3;
    if (plot.greenhouse) bonus *= 1.5;
    if (buildings.silo) bonus *= 1.1;
    
    // 天氣加成
    if (!plot.greenhouse) {
      bonus *= cropData.weatherBonus[weather] || 1;
    }
    
    const sellPrice = Math.floor(cropData.sellPrice * bonus);
    
    setMoney(prev => prev + sellPrice);
    setInventory(prev => ({ ...prev, [crop]: prev[crop] + 1 }));
    setExperience(prev => prev + 10);
    
    setFarm(prev => prev.map(plot => 
      plot.id === plotId 
        ? { ...plot, crop: null, plantTime: null, watered: false, fertilized: false, ready: false }
        : plot
    ));

    addNotification(`收成了 ${cropData.emoji}！獲得 $${sellPrice}`);
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
      
      // 溫室建造後隨機選擇一些地塊變成溫室地塊
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

  const getSeasonColor = () => {
    switch (season) {
      case 'spring': return 'from-green-300 via-yellow-200 to-green-400';
      case 'summer': return 'from-blue-300 via-yellow-300 to-green-500';
      case 'autumn': return 'from-orange-300 via-red-300 to-yellow-400';
      case 'winter': return 'from-blue-100 via-white to-blue-300';
      default: return 'from-blue-300 via-green-200 to-green-400';
    }
  };

  const isNight = time < 6 || time >= 18;

  return (
    <div className={`min-h-screen transition-all duration-1000 ${
      isNight 
        ? 'bg-gradient-to-b from-indigo-900 via-purple-900 to-black' 
        : `bg-gradient-to-b ${getSeasonColor()}`
    }`}>
      {/* 天氣效果 */}
      {weather === 'rainy' && (
        <div className="fixed inset-0 pointer-events-none z-10">
          {Array.from({length: 100}).map((_, i) => (
            <div key={i} 
                 className="absolute animate-pulse"
                 style={{
                   left: `${Math.random() * 100}%`,
                   top: `${Math.random() * 100}%`,
                   animationDelay: `${Math.random() * 2}s`
                 }}>
              💧
            </div>
          ))}
        </div>
      )}

      {weather === 'snow' && (
        <div className="fixed inset-0 pointer-events-none z-10">
          {Array.from({length: 50}).map((_, i) => (
            <div key={i} 
                 className="absolute animate-bounce"
                 style={{
                   left: `${Math.random() * 100}%`,
                   top: `${Math.random() * 100}%`,
                   animationDelay: `${Math.random() * 3}s`
                 }}>
              ❄️
            </div>
          ))}
        </div>
      )}

      {/* 通知系統 */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <div key={notification.id} 
               className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-bounce max-w-xs">
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
            <div className="bg-gray-600 rounded-full h-2 w-20">
              <div className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                   style={{width: `${(experience % 100)}%`}}></div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            {getTimeIcon()}
            <span>{time}:00</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>{getWeatherIcon()}</span>
            <span className="text-sm">{getWeatherName(weather)}</span>
          </div>
          <span className="capitalize text-sm">{getSeasonName(season)}</span>
          <span className="text-sm">第{day}天</span>
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
                    {plot.crop ? (
                      <>
                        <div className={`transform transition-transform duration-500 ${
                          plot.ready ? 'scale-125 animate-bounce' : 'scale-100'
                        }`}>
                          {CROPS[plot.crop].emoji}
                        </div>
                        <div className="flex absolute bottom-0 left-0 right-0 justify-center">
                          {plot.watered && <Droplets className="w-3 h-3 text-blue-400" />}
                          {plot.fertilized && <span className="text-xs">💰</span>}
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
            {/* 行動按鈕 */}
            <div className="bg-white bg-opacity-90 rounded-lg p-4 shadow-lg">
              <h3 className="text-lg font-bold mb-3">商店</h3>
              <div className="space-y-2">
                <button onClick={() => setShowShop(true)}
                        className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded transition-colors flex items-center justify-center">
                  <Sprout className="mr-2 w-4 h-4" />
                  種子商店
                </button>
                <button onClick={() => setShowAnimalShop(true)}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors">
                  🐾 動物商店
                </button>
                <button onClick={() => setShowBuildingShop(true)}
                        className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded transition-colors flex items-center justify-center">
                  <Building className="mr-2 w-4 h-4" />
                  建築商店
                </button>
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

            {/* 天氣預報 */}
            <div className="bg-white bg-opacity-90 rounded-lg p-4 shadow-lg">
              <h3 className="text-lg font-bold mb-3">天氣資訊</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>當前天氣:</span>
                  <span>{getWeatherIcon()} {getWeatherName(weather)}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {weather === 'rainy' && '🌱 作物自動澆水'}
                  {weather === 'sunny' && '☀️ 大部分作物成長加速'}
                  {weather === 'storm' && '⚠️ 作物可能受損'}
                  {weather === 'snow' && '❄️ 作物成長緩慢'}
                  {weather === 'cloudy' && '☁️ 普通天氣'}
                </div>
              </div>
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
                    <div className="text-green-600 font-bold">${crop.price}</div>
                    <div className="text-xs text-gray-500">
                      成長: {crop.growTime}分鐘
                    </div>
                    <div className="text-xs text-blue-600">
                      售價: ${crop.sellPrice}
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      {weather !== 'cloudy' && `${weather}: ${Math.round((crop.weatherBonus[weather] || 1) * 100)}%`}
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
    </div>
  );
};

export default FarmGame;