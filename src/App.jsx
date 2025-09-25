import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Sprout, Coins, ShoppingCart, Heart, Home, Sun, Moon, Zap, Droplets, Hammer, Building, Star, Save, Trophy, Settings, MessageCircle, Target, UtensilsCrossed, TrendingUp, TrendingDown, Clock3, Boxes, Sparkles } from 'lucide-react';
import { CROPS, ANIMALS, BUILDINGS, TOOLS, ACHIEVEMENTS, NPCS, WEATHER_TYPES, SEASONS, FARM_SUPPLIES, ANIMAL_PRODUCTS } from './game/data/GameCatalog';
import { GameFormatter } from './game/utils/GameFormatter';
import { GameEngine } from './game/engine/GameEngine';
import {
  getFarmExpansionCost,
  getAnimalHousingExpansionCost,
  BASE_FARM_PLOTS,
  MAX_FARM_PLOTS,
  BASE_ANIMAL_CAPACITY,
  MAX_ANIMAL_CAPACITY,
  FARM_EXPANSION_BATCH,
  ANIMAL_CAPACITY_STEP,
  BUILDING_UPGRADES,
  ANIMAL_CARE_ACTIONS,
} from './game/engine/constants';
import { SaveManager } from './game/engine/SaveManager';
import { NotificationCenter } from './game/engine/NotificationCenter';
import { createInitialInventory, INVENTORY_METADATA, INVENTORY_ORDER } from './game/state/InventoryState';
import { QuestManager } from './game/quests/QuestManager';

const ANIMAL_ECOLOGY_CONFIG = {
  dailyHungerLoss: 28,
  hungerWarningThreshold: 35,
  severeHungerThreshold: 12,
  happinessDecay: 8,
  severeHungerPenalty: 25,
  moderateHungerPenalty: 10,
  sicknessPenalty: 15,
  sicknessTriggerThreshold: 25,
  illnessDeathDays: 3,
  illnessDeathChance: 0.35,
  overcrowdThreshold: 0.85,
  overcrowdPenalty: 12,
  breeding: {
    wellFedThreshold: 70,
    happyThreshold: 70,
    baseChance: 0.1,
    happinessWeight: 0.003,
    hungerWeight: 0.0025,
    maxPairsPerType: 3,
    bondThreshold: 55,
    bondWeight: 0.0015,
  },
};

const ANIMAL_INTERACTION_CONFIG = {
  dailyNeedChance: 0.5,
  skipHappinessPenalty: 8,
  escalatedPenalty: 14,
  neglectBondPenalty: 4,
  neglectSicknessChance: 0.2,
  bondDecay: 1,
  cleanlinessDecay: 7,
  cleanlinessThreshold: 48,
  severeCleanlinessThreshold: 28,
  cleanlinessHappinessPenalty: 6,
  severeCleanlinessPenalty: 12,
  cleanlinessSicknessChance: 0.22,
};

const SEASONAL_FESTIVAL_DEFINITIONS = [
  {
    id: 'spring_blossom',
    season: 'spring',
    days: [6, 18],
    duration: 3,
    name: '春芽花卉節',
    description: '村莊舉辦花卉節，需要香甜莓果點綴攤位。',
    requirements: [
      { type: 'crop', key: 'strawberry', amount: 14 },
      { type: 'crop', key: 'blueberry', amount: 10 },
    ],
    rewards: {
      money: 420,
      seeds: [{ crop: 'pumpkin', amount: 3 }],
    },
    cooldown: 24,
  },
  {
    id: 'summer_solstice',
    season: 'summer',
    days: [9, 21],
    duration: 3,
    name: '夏至市集',
    description: '旅行商人想要用新鮮蔬果打造夏季拼盤。',
    requirements: [
      { type: 'crop', key: 'corn', amount: 18 },
      { type: 'crop', key: 'tomato', amount: 16 },
    ],
    rewards: {
      money: 520,
      seeds: [{ crop: 'rice', amount: 4 }],
    },
    cooldown: 24,
  },
  {
    id: 'autumn_harvest_gala',
    season: 'autumn',
    days: [12],
    duration: 4,
    name: '秋收盛宴',
    description: '鎮上的大宴會需要溫暖濃郁的秋季作物。',
    requirements: [
      { type: 'crop', key: 'pumpkin', amount: 10 },
      { type: 'crop', key: 'soybean', amount: 18 },
    ],
    rewards: {
      money: 600,
      seeds: [{ crop: 'tea', amount: 3 }],
    },
    cooldown: 24,
  },
  {
    id: 'winter_lantern_fest',
    season: 'winter',
    days: [8, 24],
    duration: 3,
    name: '冬燈祭',
    description: '里長準備暖心晚會，需要主食填滿暖鍋。',
    requirements: [
      { type: 'crop', key: 'wheat', amount: 20 },
      { type: 'crop', key: 'potato', amount: 18 },
    ],
    rewards: {
      money: 480,
      supplies: [{ key: 'fertilizer', amount: 2 }],
      seeds: [{ crop: 'strawberry', amount: 4 }],
    },
    cooldown: 24,
  },
];

const WEATHER_MISSION_DEFINITIONS = [
  {
    id: 'storm_repair_drive',
    weather: 'storm',
    seasons: ['spring', 'summer', 'autumn'],
    name: '暴風修復支援',
    description: '暴風雨後鄰村急需乾草與飼料修繕畜舍。',
    duration: 2,
    requirements: [
      { type: 'crop', key: 'wheat', amount: 18 },
      { type: 'crop', key: 'corn', amount: 14 },
    ],
    rewards: {
      money: 420,
      supplies: [{ key: 'pesticide', amount: 2 }],
      seeds: [{ crop: 'pumpkin', amount: 2 }],
    },
    cooldown: 6,
  },
  {
    id: 'rainy_storage_aid',
    weather: 'rainy',
    seasons: ['spring', 'summer'],
    name: '雨季防潮任務',
    description: '合作社募集黃豆與茶葉調製防潮粉末。',
    duration: 2,
    requirements: [
      { type: 'crop', key: 'soybean', amount: 16 },
      { type: 'crop', key: 'tea', amount: 10 },
    ],
    rewards: {
      money: 380,
      supplies: [{ key: 'fertilizer', amount: 2 }],
    },
    cooldown: 5,
  },
  {
    id: 'snow_relief_program',
    weather: 'snow',
    seasons: ['winter'],
    name: '雪季保暖補給',
    description: '鎮公所徵集暖胃食材供應救助站。',
    duration: 3,
    requirements: [
      { type: 'crop', key: 'potato', amount: 16 },
      { type: 'crop', key: 'rice', amount: 18 },
    ],
    rewards: {
      money: 450,
      seeds: [{ crop: 'blueberry', amount: 3 }],
    },
    cooldown: 7,
  },
];

const MARKET_COMMISSION_TEMPLATES = [
  {
    id: 'city_bistro_combo',
    client: '都會餐酒館',
    seasons: ['spring', 'summer'],
    description: '客席主廚想用番茄與藍莓打造風味套餐。',
    duration: 3,
    requirements: [
      { type: 'crop', key: 'tomato', amount: 16 },
      { type: 'crop', key: 'blueberry', amount: 12 },
    ],
    rewards: {
      money: 520,
      boosts: [{ crop: 'tomato', percent: 0.05 }],
    },
  },
  {
    id: 'harvest_fair_bundle',
    client: '農會特採部',
    seasons: ['autumn'],
    description: '農會募集秋季作物禮盒，需供應南瓜與黃豆。',
    duration: 3,
    requirements: [
      { type: 'crop', key: 'pumpkin', amount: 12 },
      { type: 'crop', key: 'soybean', amount: 18 },
    ],
    rewards: {
      money: 640,
      boosts: [{ crop: 'pumpkin', percent: 0.06 }],
    },
  },
  {
    id: 'artisan_tea_set',
    client: '職人工坊',
    seasons: ['summer', 'autumn'],
    description: '工坊設計高級茶點組合，需要茶葉與草莓。',
    duration: 4,
    requirements: [
      { type: 'crop', key: 'tea', amount: 12 },
      { type: 'crop', key: 'strawberry', amount: 14 },
    ],
    rewards: {
      money: 580,
      boosts: [
        { crop: 'tea', percent: 0.05 },
        { crop: 'strawberry', percent: 0.03 },
      ],
    },
  },
  {
    id: 'winter_stockpile',
    client: '北境補給隊',
    seasons: ['winter'],
    description: '補給隊準備冬季糧食，徵集馬鈴薯與小麥。',
    duration: 4,
    requirements: [
      { type: 'crop', key: 'potato', amount: 18 },
      { type: 'crop', key: 'wheat', amount: 22 },
    ],
    rewards: {
      money: 560,
      boosts: [{ crop: 'wheat', percent: 0.04 }],
    },
  },
];

const MAX_ACTIVE_COMMISSIONS = 3;

const resolveRequirementLabel = (requirement) => {
  if (!requirement) return '';
  const { type, key, amount } = requirement;
  if (type === 'crop' && CROPS[key]) {
    const crop = CROPS[key];
    return `${crop.emoji} ${crop.name} x${amount}`;
  }
  if (type === 'seed' && CROPS[key]) {
    const crop = CROPS[key];
    return `🌱 ${crop.name}種子 x${amount}`;
  }
  if (type === 'product' && ANIMAL_PRODUCTS[key]) {
    const product = ANIMAL_PRODUCTS[key];
    return `${product.emoji} ${product.name} x${amount}`;
  }
  if (type === 'supply' && FARM_SUPPLIES[key]) {
    const supply = FARM_SUPPLIES[key];
    return `${supply.emoji || '📦'} ${supply.name} x${amount}`;
  }
  return `${key} x${amount}`;
};

const getRequirementInventoryKey = (requirement) => {
  if (!requirement) return null;
  const { type, key } = requirement;
  switch (type) {
    case 'crop':
    case 'product':
      return key;
    case 'seed':
      return `seed_${key}`;
    default:
      return null;
  }
};

const getRequirementCurrentAmount = (requirement, inventory, farmSupplies) => {
  if (!requirement) return 0;
  const { type, key } = requirement;
  if (type === 'supply') {
    return farmSupplies?.[key] || 0;
  }
  const inventoryKey = getRequirementInventoryKey(requirement);
  if (!inventoryKey) {
    return 0;
  }
  return inventory?.[inventoryKey] || 0;
};

const canFulfillRequirements = (requirements, inventory, farmSupplies) => {
  if (!Array.isArray(requirements) || requirements.length === 0) {
    return true;
  }
  return requirements.every(req => getRequirementCurrentAmount(req, inventory, farmSupplies) >= (req.amount || 0));
};

const applyRequirementSpending = (requirements, setInventory, setFarmSupplies) => {
  if (!Array.isArray(requirements) || requirements.length === 0) {
    return;
  }

  const supplyRequirements = requirements.filter(req => req.type === 'supply');
  const inventoryRequirements = requirements.filter(req => req.type !== 'supply');

  if (inventoryRequirements.length > 0) {
    setInventory(prev => {
      const next = { ...(prev || {}) };
      inventoryRequirements.forEach(req => {
        const key = getRequirementInventoryKey(req);
        if (!key) return;
        const current = next[key] || 0;
        next[key] = Math.max(0, current - (req.amount || 0));
      });
      return next;
    });
  }

  if (supplyRequirements.length > 0) {
    setFarmSupplies(prev => {
      const base = prev || {};
      const next = { ...base };
      supplyRequirements.forEach(req => {
        const current = next[req.key] || 0;
        next[req.key] = Math.max(0, current - (req.amount || 0));
      });
      return next;
    });
  }
};

const applyRewardGrant = ({ rewards }, { setMoney, setInventory, setFarmSupplies, setMarketBoosts }) => {
  if (!rewards) {
    return;
  }

  if (rewards.money) {
    setMoney(prev => prev + rewards.money);
  }

  if (Array.isArray(rewards.seeds) && rewards.seeds.length > 0) {
    setInventory(prev => {
      const next = { ...(prev || {}) };
      rewards.seeds.forEach(seed => {
        if (!seed?.crop || !seed.amount) return;
        const key = `seed_${seed.crop}`;
        next[key] = (next[key] || 0) + seed.amount;
      });
      return next;
    });
  }

  if (Array.isArray(rewards.supplies) && rewards.supplies.length > 0) {
    setFarmSupplies(prev => {
      const base = prev || {};
      const next = { ...base };
      rewards.supplies.forEach(supply => {
        if (!supply?.key || !supply.amount) return;
        next[supply.key] = (next[supply.key] || 0) + supply.amount;
      });
      return next;
    });
  }

  if (Array.isArray(rewards.boosts) && rewards.boosts.length > 0) {
    setMarketBoosts(prev => {
      const base = prev || {};
      const next = { ...base };
      rewards.boosts.forEach(boost => {
        if (!boost?.crop || !boost.percent) return;
        next[boost.crop] = (next[boost.crop] || 0) + boost.percent;
      });
      return next;
    });
  }
};

const describeRewards = (rewards) => {
  if (!rewards) {
    return '';
  }

  const parts = [];
  if (rewards.money) {
    parts.push(`金額 $${rewards.money}`);
  }
  if (Array.isArray(rewards.seeds) && rewards.seeds.length > 0) {
    const seedText = rewards.seeds
      .map(seed => {
        const crop = CROPS[seed.crop];
        const label = crop ? `${crop.emoji} ${crop.name}種子` : `${seed.crop}種子`;
        return `${label} x${seed.amount}`;
      })
      .join('、');
    parts.push(seedText);
  }
  if (Array.isArray(rewards.supplies) && rewards.supplies.length > 0) {
    const supplyText = rewards.supplies
      .map(supply => {
        const meta = FARM_SUPPLIES[supply.key];
        const label = meta ? `${meta.emoji || '📦'} ${meta.name}` : supply.key;
        return `${label} x${supply.amount}`;
      })
      .join('、');
    parts.push(supplyText);
  }
  if (Array.isArray(rewards.boosts) && rewards.boosts.length > 0) {
    const boostText = rewards.boosts
      .map(boost => {
        const crop = CROPS[boost.crop];
        const percent = Math.round((boost.percent || 0) * 100);
        const label = crop ? `${crop.emoji} ${crop.name}` : boost.crop;
        return `${label} 價格永久 +${percent}%`;
      })
      .join('、');
    parts.push(boostText);
  }

  return parts.join('、');
};

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
  const [inventory, setInventory] = useState(() => createInitialInventory());
  
  const [farm, setFarm] = useState(
    Array(BASE_FARM_PLOTS).fill().map((_, i) => ({
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

  const [questLog, setQuestLog] = useState({});
  const [dynamicQuests, setDynamicQuests] = useState({});

  const [animals, setAnimals] = useState([]);
  const [animalCapacity, setAnimalCapacity] = useState(BASE_ANIMAL_CAPACITY);
  const [buildings, setBuildings] = useState({});
  const [tools, setTools] = useState('basic');
  const [ownedTools, setOwnedTools] = useState(() => ['basic']);
  const [toolLevels, setToolLevels] = useState({});

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
  const [pendingGreenhousePlacement, setPendingGreenhousePlacement] = useState(false);
  const [marketView, setMarketView] = useState('summary');
  const [marketListSort, setMarketListSort] = useState('price');
  const [inventorySortMode, setInventorySortMode] = useState('value');

  const stateRef = useRef({});

  const notificationCenter = useMemo(() => new NotificationCenter(setNotifications), []);
  const addNotification = useCallback((message, options) => {
    notificationCenter.push(message, options);
  }, [notificationCenter]);
  const dismissNotification = useCallback((id) => {
    notificationCenter.dismiss(id);
  }, [notificationCenter]);

  const questManager = useMemo(() => new QuestManager({
    stateRef,
    setQuestLog,
    setDynamicQuests,
    setInventory,
    setMoney,
    notifier: addNotification,
  }), [stateRef, setQuestLog, setDynamicQuests, setInventory, setMoney, addNotification]);

  const questDefinitions = useMemo(
    () => questManager.buildQuestDefinitions(dynamicQuests),
    [questManager, dynamicQuests],
  );

  // 新功能狀態
  const [completedAchievements, setCompletedAchievements] = useState(new Set());
  const [aiAdvice, setAiAdvice] = useState('');
  const [marketPrices, setMarketPrices] = useState({});
  const [previousMarketPrices, setPreviousMarketPrices] = useState({});
  const [marketUpdateTime, setMarketUpdateTime] = useState(null);
  const [dailyStats, setDailyStats] = useState([]);
  const [lifetimeStats, setLifetimeStats] = useState({ cropsPlanted: 0 });
  const [automation, setAutomation] = useState({ autoWater: false, autoHarvest: false });
  const [seasonalEvents, setSeasonalEvents] = useState([]);
  const [seasonalEventHistory, setSeasonalEventHistory] = useState({});
  const [weatherMissions, setWeatherMissions] = useState([]);
  const [weatherMissionHistory, setWeatherMissionHistory] = useState({});
  const [marketCommissions, setMarketCommissions] = useState([]);
  const [commissionHistory, setCommissionHistory] = useState({});
  const [marketBoosts, setMarketBoosts] = useState({});

  const handleDailyEvents = useCallback((newDay, effectiveSeason, currentWeather) => {
    const dayInSeason = ((newDay - 1) % 30) + 1;

    const existingSeasonal = Array.isArray(stateRef.current.seasonalEvents)
      ? stateRef.current.seasonalEvents
      : [];
    const seasonalHistoryState = stateRef.current.seasonalEventHistory || {};
    const activeSeasonal = [];
    existingSeasonal.forEach(event => {
      if ((event.expiresOn ?? 0) < newDay) {
        if (!event.completed) {
          addNotification(`⏳ ${event.name} 已結束，未來再參與吧！`, { type: 'warning' });
        }
      } else {
        activeSeasonal.push(event);
      }
    });

    let seasonalList = [...activeSeasonal];
    const seasonalHistoryUpdates = {};

    SEASONAL_FESTIVAL_DEFINITIONS.forEach(definition => {
      if (definition.season !== effectiveSeason) {
        return;
      }
      const scheduledDays = Array.isArray(definition.days) ? definition.days : [definition.days];
      if (!scheduledDays.includes(dayInSeason)) {
        return;
      }
      const cooldown = definition.cooldown ?? 0;
      const lastTrigger = seasonalHistoryState[definition.id] || 0;
      if (lastTrigger && newDay - lastTrigger < cooldown) {
        return;
      }
      if (seasonalList.some(event => event.templateId === definition.id)) {
        return;
      }
      const instance = {
        ...definition,
        templateId: definition.id,
        instanceId: `${definition.id}_${newDay}`,
        startedOn: newDay,
        expiresOn: newDay + Math.max(1, (definition.duration ?? 2)) - 1,
      };
      seasonalList.push(instance);
      seasonalHistoryUpdates[definition.id] = newDay;
      const requirementLabel = (definition.requirements || []).map(resolveRequirementLabel).join('、');
      addNotification(`🎊 ${definition.name} 開跑！${definition.description}${requirementLabel ? `（需求：${requirementLabel}）` : ''}`,
        { type: 'info' });
    });

    setSeasonalEvents(seasonalList);
    if (Object.keys(seasonalHistoryUpdates).length > 0) {
      setSeasonalEventHistory(prev => ({ ...(prev || {}), ...seasonalHistoryUpdates }));
    }

    const existingWeatherMissions = Array.isArray(stateRef.current.weatherMissions)
      ? stateRef.current.weatherMissions
      : [];
    const weatherHistoryState = stateRef.current.weatherMissionHistory || {};
    const activeWeather = [];
    existingWeatherMissions.forEach(mission => {
      if ((mission.expiresOn ?? 0) < newDay) {
        addNotification(`⏳ ${mission.name} 已截止。`, { type: 'warning' });
      } else {
        activeWeather.push(mission);
      }
    });

    let weatherList = [...activeWeather];
    const weatherHistoryUpdates = {};

    WEATHER_MISSION_DEFINITIONS.forEach(definition => {
      if (definition.weather !== currentWeather) {
        return;
      }
      if (Array.isArray(definition.seasons) && !definition.seasons.includes(effectiveSeason)) {
        return;
      }
      const cooldown = definition.cooldown ?? 0;
      const lastTrigger = weatherHistoryState[definition.id] || 0;
      if (lastTrigger && newDay - lastTrigger < cooldown) {
        return;
      }
      if (weatherList.some(mission => mission.templateId === definition.id)) {
        return;
      }
      const instance = {
        ...definition,
        templateId: definition.id,
        instanceId: `${definition.id}_${newDay}`,
        startedOn: newDay,
        expiresOn: newDay + Math.max(1, (definition.duration ?? 2)) - 1,
      };
      weatherList.push(instance);
      weatherHistoryUpdates[definition.id] = newDay;
      const requirementLabel = (definition.requirements || []).map(resolveRequirementLabel).join('、');
      addNotification(`🌦️ ${definition.name} 啟動：${definition.description}${requirementLabel ? `（需求：${requirementLabel}）` : ''}`,
        { type: 'info' });
    });

    setWeatherMissions(weatherList);
    if (Object.keys(weatherHistoryUpdates).length > 0) {
      setWeatherMissionHistory(prev => ({ ...(prev || {}), ...weatherHistoryUpdates }));
    }

    const existingCommissions = Array.isArray(stateRef.current.marketCommissions)
      ? stateRef.current.marketCommissions
      : [];
    const commissionHistoryState = stateRef.current.commissionHistory || {};
    const activeCommissions = [];
    existingCommissions.forEach(order => {
      if ((order.expiresOn ?? 0) < newDay) {
        addNotification(`📦 ${order.client} 的委託已過期。`, { type: 'warning' });
      } else {
        activeCommissions.push(order);
      }
    });

    let commissionList = [...activeCommissions];
    const commissionHistoryUpdates = {};

    if (commissionList.length < MAX_ACTIVE_COMMISSIONS) {
      const eligible = MARKET_COMMISSION_TEMPLATES.filter(template => {
        if (Array.isArray(template.seasons) && !template.seasons.includes(effectiveSeason)) {
          return false;
        }
        const lastTrigger = commissionHistoryState[template.id] || 0;
        if (lastTrigger && newDay - lastTrigger < 5) {
          return false;
        }
        if (commissionList.some(order => order.templateId === template.id)) {
          return false;
        }
        return true;
      });

      const shuffled = [...eligible].sort(() => Math.random() - 0.5);
      while (commissionList.length < MAX_ACTIVE_COMMISSIONS && shuffled.length > 0) {
        const template = shuffled.shift();
        if (!template) {
          break;
        }
        const instance = {
          ...template,
          templateId: template.id,
          instanceId: `${template.id}_${newDay}_${commissionList.length}`,
          startedOn: newDay,
          expiresOn: newDay + Math.max(1, (template.duration ?? 3)) - 1,
        };
        commissionList.push(instance);
        commissionHistoryUpdates[template.id] = newDay;
        const requirementLabel = (template.requirements || []).map(resolveRequirementLabel).join('、');
        addNotification(`📝 ${template.client} 發布委託：${template.description}${requirementLabel ? `（需求：${requirementLabel}）` : ''}`,
          { type: 'info' });
      }
    }

    setMarketCommissions(commissionList);
    if (Object.keys(commissionHistoryUpdates).length > 0) {
      setCommissionHistory(prev => ({ ...(prev || {}), ...commissionHistoryUpdates }));
    }
  }, [addNotification, setSeasonalEvents, setSeasonalEventHistory, setWeatherMissions, setWeatherMissionHistory, setMarketCommissions, setCommissionHistory, stateRef]);

  useEffect(() => {
    questManager.refreshDaily(day);
  }, [questManager, day]);

  const recordQuestEvent = useCallback((event) => {
    questManager.recordEvent(event, questDefinitions);
  }, [questManager, questDefinitions]);

  const farmSize = Array.isArray(farm) ? farm.length : 0;
  const nextFarmExpansionCost = useMemo(() => (
    farmSize < MAX_FARM_PLOTS
      ? getFarmExpansionCost(farmSize)
      : null
  ), [farmSize]);

  const nextAnimalExpansionCost = useMemo(() => (
    animalCapacity < MAX_ANIMAL_CAPACITY
      ? getAnimalHousingExpansionCost(animalCapacity)
      : null
  ), [animalCapacity]);

  const effectiveToolStats = useMemo(() => {
    const baseTool = TOOLS[tools] || TOOLS.basic;
    const level = toolLevels?.[tools] ?? 0;
    const speedBoost = (baseTool.speedBoost || 1) + (baseTool.speedUpgrade || 0) * level;
    const energyReduction = (baseTool.energyReduction || 0) + (baseTool.energyUpgrade || 0) * level;

    return {
      base: baseTool,
      level,
      displayLevel: level + 1,
      speedBoost,
      energyReduction,
    };
  }, [tools, toolLevels]);
  
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
    questLog,
    animals,
    animalCapacity,
    buildings,
    tools,
    ownedTools,
    toolLevels,
    completedAchievements,
    dailyStats,
    lifetimeStats,
    automation,
    marketPrices,
    previousMarketPrices,
    marketUpdateTime,
    saveSlots,
    seasonalEvents,
    seasonalEventHistory,
    weatherMissions,
    weatherMissionHistory,
    marketCommissions,
    commissionHistory,
    marketBoosts,
    selectedSeed,
    selectedSupply,
    loadData,
    pendingGreenhousePlacement,
    marketView,
    marketListSort,
    inventorySortMode,
    dynamicQuests,
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
      setAnimalCapacity,
      setBuildings,
      setTools,
      setOwnedTools,
      setToolLevels,
      setFarmSupplies,
      setQuestLog,
      setCompletedAchievements,
      setDailyStats,
      setLifetimeStats,
      setAutomation,
      setMarketPrices,
      setPreviousMarketPrices,
      setMarketUpdateTime,
      setSaveSlots,
      setSeasonalEvents,
      setSeasonalEventHistory,
      setWeatherMissions,
      setWeatherMissionHistory,
      setMarketCommissions,
      setCommissionHistory,
      setMarketBoosts,
      setShowSaveMenu,
      setShowLoadMenu,
      setLoadData,
      setSaveData,
      setSelectedSeed,
      setSelectedSupply,
      setShowSupplyShop,
      setPendingGreenhousePlacement,
      setDynamicQuests,
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
      setLifetimeStats,
      setInventory,
      setFarmSupplies,
      setAnimals,
      setAnimalCapacity,
      setShowAnimalShop,
      setBuildings,
      setShowBuildingShop,
      setTools,
      setShowToolShop,
      setOwnedTools,
      setToolLevels,
      setPendingGreenhousePlacement,
      recordQuestEvent,
    },
    notifier: addNotification,
  }), [stateRef, addNotification, recordQuestEvent]);

  const sprinklerLevel = useMemo(
    () => gameEngine.getBuildingLevel(buildings, 'sprinkler'),
    [gameEngine, buildings],
  );
  const sprinklerCoverage = useMemo(
    () => gameEngine.getSprinklerCoverage(buildings),
    [gameEngine, buildings],
  );
  const nextSprinklerUpgrade = useMemo(() => {
    const upgrades = BUILDING_UPGRADES.sprinkler || [];
    return upgrades.find(entry => entry.level === sprinklerLevel + 1) || null;
  }, [sprinklerLevel]);

  const acceptQuest = useCallback((questId) => {
    questManager.acceptQuest(questId, questDefinitions, questLog, day);
  }, [questManager, questDefinitions, questLog, day]);

  const deliverQuest = useCallback((questId) => {
    questManager.deliverQuest(questId, questDefinitions, questLog, inventory, day);
  }, [questManager, questDefinitions, questLog, inventory, day]);

  const claimQuestReward = useCallback((questId) => {
    questManager.claimQuestReward(questId, questDefinitions, questLog, day);
  }, [questManager, questDefinitions, questLog, day]);

  const activeQuests = useMemo(() => {
    const list = questManager.getActiveQuests(questDefinitions, questLog, inventory);
    return list.sort((a, b) => {
      if (a.ready === b.ready) {
        return 0;
      }
      return a.ready ? -1 : 1;
    });
  }, [questManager, questDefinitions, questLog, inventory]);

  const availableDynamicQuests = useMemo(() => {
    if (!dynamicQuests) {
      return [];
    }

    return Object.entries(dynamicQuests)
      .map(([id, quest]) => {
        const entry = questLog?.[id];
        if (entry && (entry.status === 'accepted' || entry.status === 'ready')) {
          return null;
        }
        return { id, quest };
      })
      .filter(Boolean);
  }, [dynamicQuests, questLog]);

  const marketInsights = useMemo(() => {
    const entries = Object.entries(CROPS).map(([key, crop]) => {
      const price = marketPrices?.[key] ?? crop.sellPrice;
      const basePrice = crop.sellPrice;
      const previousPrice = previousMarketPrices?.[key];
      const changeFromBase = price - basePrice;
      const percentFromBase = basePrice ? (changeFromBase / basePrice) * 100 : 0;
      const changeFromPrevious = typeof previousPrice === 'number' ? price - previousPrice : null;
      const percentFromPrevious =
        typeof previousPrice === 'number' && previousPrice !== 0
          ? (changeFromPrevious / previousPrice) * 100
          : null;

      return {
        key,
        name: crop.name,
        emoji: crop.emoji,
        price,
        basePrice,
        changeFromBase,
        percentFromBase,
        previousPrice,
        changeFromPrevious,
        percentFromPrevious,
      };
    });

    const sortedByPremium = [...entries].sort((a, b) => b.percentFromBase - a.percentFromBase);
    const risers = entries
      .filter(entry => (entry.changeFromPrevious ?? 0) > 0)
      .sort((a, b) => (b.changeFromPrevious ?? 0) - (a.changeFromPrevious ?? 0))
      .slice(0, 3);
    const fallers = entries
      .filter(entry => (entry.changeFromPrevious ?? 0) < 0)
      .sort((a, b) => (a.changeFromPrevious ?? 0) - (b.changeFromPrevious ?? 0))
      .slice(0, 3);
    const averageIndex = entries.length > 0
      ? entries.reduce((sum, entry) => sum + (entry.basePrice ? (entry.price / entry.basePrice) : 1), 0) / entries.length
      : 1;
    const highestPrice = entries.reduce((max, entry) => Math.max(max, entry.price), 0);

    return {
      entries,
      sortedByPremium,
      risers,
      fallers,
      averageIndex,
      highestPrice,
    };
  }, [marketPrices, previousMarketPrices]);

  const inventoryInsights = useMemo(() => {
    const sourceInventory = inventory || {};
    const items = [];
    let totalCount = 0;
    let totalValue = 0;

    Object.entries(sourceInventory).forEach(([key, count]) => {
      if (!count) return;
      const metadata = INVENTORY_METADATA[key];
      if (!metadata) return;

      const totalItemValue = gameEngine.getInventorySaleValue(key, count);
      const unitValue = count > 0 ? Math.max(0, Math.round(totalItemValue / count)) : 0;

      totalCount += count;
      totalValue += totalItemValue;

      items.push({
        key,
        ...metadata,
        count,
        unitValue,
        totalValue: totalItemValue,
        canSell: totalItemValue > 0,
      });
    });

    const sortedItems = [...items];
    sortedItems.sort((a, b) => {
      if (inventorySortMode === 'count') {
        if (b.count === a.count) {
          return b.totalValue - a.totalValue;
        }
        return b.count - a.count;
      }

      if (b.totalValue === a.totalValue) {
        return b.count - a.count;
      }
      return b.totalValue - a.totalValue;
    });

    const safeTotalValue = totalValue;
    const safeTotalCount = totalCount;
    sortedItems.forEach(item => {
      if (safeTotalValue > 0) {
        item.share = Math.round((item.totalValue / safeTotalValue) * 100);
      } else if (safeTotalCount > 0) {
        item.share = Math.round((item.count / safeTotalCount) * 100);
      } else {
        item.share = 0;
      }
    });

    return {
      items: sortedItems,
      totalCount: safeTotalCount,
      totalValue: Math.round(safeTotalValue),
    };
  }, [inventory, gameEngine, animals, buildings, marketPrices, inventorySortMode]);

  const seedStorage = useMemo(() => {
    const sourceInventory = inventory || {};
    if (!sourceInventory) {
      return [];
    }

    return Object.entries(sourceInventory)
      .map(([key, count]) => {
        if (!key.startsWith('seed_')) {
          return null;
        }
        const supplyCount = farmSupplies?.[key] || 0;
        const totalCount = Math.max(count || 0, supplyCount || 0);
        if (totalCount <= 0) {
          return null;
        }
        const cropKey = key.replace('seed_', '');
        const crop = CROPS[cropKey];
        return {
          key,
          cropKey,
          count: totalCount,
          name: crop?.name || cropKey,
          emoji: crop?.emoji || '🌱',
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (b.count === a.count) {
          return a.name.localeCompare(b.name, 'zh-TW');
        }
        return b.count - a.count;
      });
  }, [inventory, farmSupplies]);

  const hasAnyBaseSupply = useMemo(
    () => Object.keys(FARM_SUPPLIES).some(key => (farmSupplies?.[key] || 0) > 0),
    [farmSupplies],
  );

  const buildingEntries = useMemo(() => {
    if (!buildings) {
      return [];
    }

    return Object.entries(buildings)
      .filter(([key, value]) => {
        if (!BUILDINGS[key]) {
          return false;
        }

        if (typeof value === 'number') {
          return value > 0;
        }

        return Boolean(value);
      })
      .map(([key, value]) => ({
        key,
        value,
        meta: BUILDINGS[key],
        count: typeof value === 'number' ? value : null,
      }));
  }, [buildings]);

  const sortedMarketEntries = useMemo(() => {
    const baseEntries = marketInsights.entries ? [...marketInsights.entries] : [];

    switch (marketListSort) {
      case 'premium':
        baseEntries.sort((a, b) => (b.percentFromBase ?? 0) - (a.percentFromBase ?? 0));
        break;
      case 'change':
        baseEntries.sort((a, b) => (b.changeFromPrevious ?? 0) - (a.changeFromPrevious ?? 0));
        break;
      default:
        baseEntries.sort((a, b) => b.price - a.price);
        break;
    }

    return baseEntries;
  }, [marketInsights.entries, marketListSort]);

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
        Object.keys(ANIMAL_PRODUCTS).some(key => (safeInventory[key] || 0) > 0) ? '🥚 動物產物已入庫，記得賣出換現金！' : '',
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
      const previousSnapshot = stateRef.current.marketPrices || {};
      const newPrices = {};
      const boosts = stateRef.current.marketBoosts || {};
      Object.keys(CROPS).forEach(crop => {
        const basePrice = CROPS[crop].sellPrice;
        const fluctuation = 0.8 + Math.random() * 0.4;
        const boostMultiplier = 1 + (boosts[crop] || 0);
        newPrices[crop] = Math.floor(basePrice * fluctuation * boostMultiplier);
      });
      setPreviousMarketPrices(previousSnapshot);
      setMarketPrices(newPrices);
      setMarketUpdateTime(Date.now());
    };

    updatePrices();
    const timer = setInterval(updatePrices, 120000);
    return () => clearInterval(timer);
  }, [stateRef, marketBoosts]);

  // 成就系統
  useEffect(() => {
    ACHIEVEMENTS.forEach(achievement => {
      if (!completedAchievements.has(achievement.id)) {
        let unlocked = false;

        switch (achievement.id) {
          case 'firstPlant':
            unlocked = farm.some(plot => plot.crop);
            break;
          case 'planter100':
            unlocked = (lifetimeStats?.cropsPlanted || 0) >= 100;
            break;
          case 'planter500':
            unlocked = (lifetimeStats?.cropsPlanted || 0) >= 500;
            break;
          case 'planter1000':
            unlocked = (lifetimeStats?.cropsPlanted || 0) >= 1000;
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
  }, [money, animals, buildings, level, farm, completedAchievements, addNotification, lifetimeStats]);

  // 時間系統
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(prev => {
        const newTime = prev + 1;
        if (newTime >= 24) {
          const currentDay = stateRef.current.day || day;
          const currentSeason = stateRef.current.season || season;
          const currentWeather = stateRef.current.weather || weather;
          const upcomingDay = currentDay + 1;
          const willChangeSeason = upcomingDay % 30 === 0;
          const currentSeasonIndex = SEASONS.indexOf(currentSeason);
          const nextSeasonValue = willChangeSeason
            ? SEASONS[(currentSeasonIndex + 1) % SEASONS.length]
            : currentSeason;

          setDay(upcomingDay);
          if (willChangeSeason) {
            setSeason(nextSeasonValue);
            addNotification(`🌸 季節變為 ${GameFormatter.seasonName(nextSeasonValue)}！`, { type: 'info' });
          }

          handleDailyEvents(upcomingDay, nextSeasonValue, currentWeather);
          setEnergy(100);

          // 動物每日狀態與收入結算
          const producedGoods = {};
          setAnimals(prevAnimals => {
            if (!Array.isArray(prevAnimals) || prevAnimals.length === 0) {
              return prevAnimals;
            }

            let totalIncome = 0;
            const hungryNames = [];
            const starvationLosses = [];
            const illnessLosses = [];
            const newlySick = [];
            const sickAnimals = [];
            const outbreakVictims = [];
            const overcrowdAlerts = [];
            const newbornAnimals = [];
            const careReminders = [];
            const careWarnings = [];
            const dirtyPens = [];
            const filthyPens = [];
            const breedingPools = {};
            const capacityLimit = Math.max(animalCapacity || BASE_ANIMAL_CAPACITY, BASE_ANIMAL_CAPACITY);

            const typeCounts = prevAnimals.reduce((counts, current) => {
              const type = current.type;
              counts[type] = (counts[type] || 0) + 1;
              return counts;
            }, {});

            const updatedAnimals = prevAnimals.reduce((list, animal) => {
              const animalData = ANIMALS[animal.type];
              const shelterKey = animalData.shelter;
              const boost = gameEngine.getShelterBoost(buildings, shelterKey);

              const previousHunger = animal.hunger ?? 60;
              const hunger = Math.max(0, previousHunger - ANIMAL_ECOLOGY_CONFIG.dailyHungerLoss);

              if (hunger <= 0) {
                starvationLosses.push(animal.name);
                return list;
              }

              const baseHappiness = animal.happiness ?? animalData.happiness;
              let happiness = Math.max(0, baseHappiness - ANIMAL_ECOLOGY_CONFIG.happinessDecay);
              let sick = Boolean(animal.sick);
              const wasSick = Boolean(animal.sick);
              let sicknessDays = animal.sicknessDays ?? (wasSick ? 1 : 0);

              let bond = Math.max(0, animal.bond ?? 0);
              bond = Math.max(0, Math.min(100, bond - ANIMAL_INTERACTION_CONFIG.bondDecay));
              let cleanliness = Math.max(0, animal.cleanliness ?? 80);
              cleanliness = Math.max(0, Math.min(100, cleanliness - ANIMAL_INTERACTION_CONFIG.cleanlinessDecay));

              let careNeed = animal.careNeed && ANIMAL_CARE_ACTIONS[animal.careNeed] ? animal.careNeed : null;
              let careDays = Math.max(0, animal.careDays ?? 0);
              const careKeys = Object.keys(ANIMAL_CARE_ACTIONS);
              const prioritizeCleaning = cleanliness < ANIMAL_INTERACTION_CONFIG.cleanlinessThreshold && ANIMAL_CARE_ACTIONS.cleanPen;

              if (!careNeed && careKeys.length > 0) {
                if (prioritizeCleaning) {
                  careNeed = 'cleanPen';
                  careDays = 1;
                } else if (Math.random() < ANIMAL_INTERACTION_CONFIG.dailyNeedChance) {
                  const randomKey = careKeys[Math.floor(Math.random() * careKeys.length)];
                  careNeed = randomKey;
                  careDays = 1;
                } else {
                  careDays = 0;
                }

                if (careNeed) {
                  const meta = ANIMAL_CARE_ACTIONS[careNeed];
                  if (meta) {
                    careReminders.push(`${animal.name} 想要${meta.shortLabel}`);
                  }
                }
              } else if (careNeed) {
                const meta = ANIMAL_CARE_ACTIONS[careNeed];
                careDays = Math.max(1, careDays + 1);
                if (meta) {
                  careReminders.push(`${animal.name} 需要${meta.shortLabel}`);
                  if (careDays >= 2) {
                    const penalty = careDays >= 3
                      ? ANIMAL_INTERACTION_CONFIG.escalatedPenalty
                      : ANIMAL_INTERACTION_CONFIG.skipHappinessPenalty;
                    happiness = Math.max(0, happiness - penalty);
                    bond = Math.max(0, bond - ANIMAL_INTERACTION_CONFIG.neglectBondPenalty);
                    if (careDays >= 3) {
                      careWarnings.push(`${animal.name}（${meta.shortLabel}）`);
                    }
                    const sicknessChance = ANIMAL_INTERACTION_CONFIG.neglectSicknessChance * Math.max(1, careDays - 1);
                    if (!sick && Math.random() < sicknessChance) {
                      sick = true;
                      newlySick.push(animal.name);
                    }
                  }
                }
              } else {
                careDays = 0;
              }

              let canProduce = happiness > 25 && hunger > ANIMAL_ECOLOGY_CONFIG.hungerWarningThreshold;

              if (hunger <= ANIMAL_ECOLOGY_CONFIG.severeHungerThreshold) {
                hungryNames.push(`${animal.name}（急需餵食）`);
                happiness = Math.max(0, happiness - ANIMAL_ECOLOGY_CONFIG.severeHungerPenalty);
                canProduce = false;
              } else if (hunger <= ANIMAL_ECOLOGY_CONFIG.hungerWarningThreshold) {
                hungryNames.push(animal.name);
                happiness = Math.max(0, happiness - ANIMAL_ECOLOGY_CONFIG.moderateHungerPenalty);
                canProduce = happiness > 30;
              }

              if (!sick && (hunger <= ANIMAL_ECOLOGY_CONFIG.sicknessTriggerThreshold || happiness <= ANIMAL_ECOLOGY_CONFIG.sicknessTriggerThreshold)) {
                sick = true;
                newlySick.push(animal.name);
              }

              if (cleanliness < ANIMAL_INTERACTION_CONFIG.cleanlinessThreshold) {
                dirtyPens.push(animal.name);
                happiness = Math.max(0, happiness - ANIMAL_INTERACTION_CONFIG.cleanlinessHappinessPenalty);
              }
              if (cleanliness < ANIMAL_INTERACTION_CONFIG.severeCleanlinessThreshold) {
                filthyPens.push(animal.name);
                happiness = Math.max(0, happiness - ANIMAL_INTERACTION_CONFIG.severeCleanlinessPenalty);
                bond = Math.max(0, bond - 1);
                if (!sick && Math.random() < ANIMAL_INTERACTION_CONFIG.cleanlinessSicknessChance) {
                  sick = true;
                  newlySick.push(animal.name);
                }
              }

              if (sick) {
                sicknessDays += 1;
                happiness = Math.max(0, happiness - ANIMAL_ECOLOGY_CONFIG.sicknessPenalty);
                canProduce = false;
                sickAnimals.push(animal.name);
              } else {
                sicknessDays = 0;
              }

              if (sick && sicknessDays >= ANIMAL_ECOLOGY_CONFIG.illnessDeathDays && Math.random() < ANIMAL_ECOLOGY_CONFIG.illnessDeathChance) {
                illnessLosses.push(animal.name);
                return list;
              }

              let income = 0;
              let productReady = Math.max(0, Math.floor(animal.productReady || 0));
              if (canProduce) {
                if (animalData.product && ANIMAL_PRODUCTS[animalData.product]) {
                  const productKey = animalData.product;
                  const baseUnits = 1;
                  const units = Math.max(1, Math.round(baseUnits * boost * (happiness / 100)));
                  productReady += units;
                  producedGoods[productKey] = (producedGoods[productKey] || 0) + units;
                } else {
                  income = Math.floor((animalData.income || 0) * boost * (happiness / 100));
                }
              }
              totalIncome += income;

              if (!animalData.product) {
                productReady = 0;
              }

              const canBreed = !sick
                && hunger >= ANIMAL_ECOLOGY_CONFIG.breeding.wellFedThreshold
                && happiness >= ANIMAL_ECOLOGY_CONFIG.breeding.happyThreshold;
              if (canBreed) {
                if (!breedingPools[animal.type]) {
                  breedingPools[animal.type] = [];
                }
                breedingPools[animal.type].push({ happiness, hunger, bond });
              }

              list.push({
                ...animal,
                happiness,
                hunger,
                sick,
                sicknessDays,
                productReady,
                bond: Math.max(0, Math.min(100, bond)),
                cleanliness: Math.max(0, Math.min(100, cleanliness)),
                careNeed: careNeed || null,
                careDays: careNeed ? careDays : 0,
              });
              return list;
            }, []);

            let processedAnimals = updatedAnimals;

            if (processedAnimals.length > 0 && Math.random() < 0.08) {
              const healthyCandidates = processedAnimals.filter(candidate => !candidate.sick);
              if (healthyCandidates.length > 0) {
                const victimCount = Math.max(1, Math.ceil(healthyCandidates.length * 0.3));
                const selectedIds = new Set();
                while (selectedIds.size < Math.min(victimCount, healthyCandidates.length)) {
                  const target = healthyCandidates[Math.floor(Math.random() * healthyCandidates.length)];
                  selectedIds.add(target.id);
                }

                processedAnimals = processedAnimals.map(state => {
                  if (selectedIds.has(state.id)) {
                    const animalData = ANIMALS[state.type];
                    const baseHappiness = state.happiness ?? animalData.happiness ?? 40;
                    const baseHunger = state.hunger ?? 60;
                    const adjusted = {
                      ...state,
                      sick: true,
                      sicknessDays: (state.sicknessDays ?? 0) + 1,
                      happiness: Math.max(0, baseHappiness - 20),
                      hunger: Math.max(0, baseHunger - 25),
                    };
                    outbreakVictims.push(adjusted.name);
                    newlySick.push(adjusted.name);
                    sickAnimals.push(adjusted.name);
                    return adjusted;
                  }
                  return state;
                });
              }
            }

            const occupancyRatio = capacityLimit > 0 ? processedAnimals.length / capacityLimit : 1;
            if (occupancyRatio > ANIMAL_ECOLOGY_CONFIG.overcrowdThreshold) {
              const overflow = Math.max(0, occupancyRatio - ANIMAL_ECOLOGY_CONFIG.overcrowdThreshold);
              const penalty = Math.max(2, Math.ceil(ANIMAL_ECOLOGY_CONFIG.overcrowdPenalty * overflow / (1 - ANIMAL_ECOLOGY_CONFIG.overcrowdThreshold)));
              processedAnimals = processedAnimals.map(state => {
                const animalData = ANIMALS[state.type];
                const baseHappiness = state.happiness ?? animalData.happiness ?? 40;
                const reduced = Math.max(0, baseHappiness - penalty);
                let nextState = { ...state, happiness: reduced };
                if (!nextState.sick && reduced <= ANIMAL_ECOLOGY_CONFIG.sicknessTriggerThreshold) {
                  nextState = { ...nextState, sick: true, sicknessDays: (nextState.sicknessDays ?? 0) + 1 };
                  newlySick.push(nextState.name);
                  sickAnimals.push(nextState.name);
                }
                return nextState;
              });
              overcrowdAlerts.push('overcrowded');
            }

            let availableSlots = Math.max(0, capacityLimit - processedAnimals.length);
            Object.entries(breedingPools).forEach(([type, candidates]) => {
              if (availableSlots <= 0) {
                return;
              }
              if (candidates.length < 2) {
                return;
              }

              const averageHappiness = candidates.reduce((sum, entry) => sum + entry.happiness, 0) / candidates.length;
              const averageHunger = candidates.reduce((sum, entry) => sum + entry.hunger, 0) / candidates.length;
              const averageBond = candidates.reduce((sum, entry) => sum + (entry.bond ?? 0), 0) / candidates.length;
              const pairCount = Math.min(Math.floor(candidates.length / 2), ANIMAL_ECOLOGY_CONFIG.breeding.maxPairsPerType);
              const chance = ANIMAL_ECOLOGY_CONFIG.breeding.baseChance
                + Math.max(0, (averageHappiness - ANIMAL_ECOLOGY_CONFIG.breeding.happyThreshold) * ANIMAL_ECOLOGY_CONFIG.breeding.happinessWeight)
                + Math.max(0, (averageHunger - ANIMAL_ECOLOGY_CONFIG.breeding.wellFedThreshold) * ANIMAL_ECOLOGY_CONFIG.breeding.hungerWeight)
                + Math.max(0, (averageBond - ANIMAL_ECOLOGY_CONFIG.breeding.bondThreshold) * ANIMAL_ECOLOGY_CONFIG.breeding.bondWeight);

              for (let attempt = 0; attempt < pairCount && availableSlots > 0; attempt += 1) {
                if (Math.random() < chance) {
                  const data = ANIMALS[type];
                  typeCounts[type] = (typeCounts[type] || 0) + 1;
                  const babyIndex = typeCounts[type];
                  const babyName = `${data.name}寶寶${babyIndex}`;
                  newbornAnimals.push({
                    id: Date.now() + newbornAnimals.length + Math.floor(Math.random() * 1000),
                    type,
                    happiness: data.happiness,
                    hunger: 68,
                    lastFed: Date.now(),
                    sick: false,
                    sicknessDays: 0,
                    name: babyName,
                    productReady: 0,
                    bond: 35,
                    cleanliness: 82,
                    careNeed: null,
                    careDays: 0,
                    lastCareTime: null,
                  });
                  availableSlots -= 1;
                }
              }
            });

            if (totalIncome > 0) {
              setMoney(prevMoney => prevMoney + totalIncome);
              addNotification(`🐾 動物們帶來了 $${totalIncome} 的收入！`, { type: 'success' });
            }

            if (hungryNames.length > 0) {
              const names = Array.from(new Set(hungryNames)).join('、');
              addNotification(`🍽️ ${names} 肚子餓了，記得餵食！`, { type: 'warning' });
            }

            if (starvationLosses.length > 0) {
              const names = Array.from(new Set(starvationLosses)).join('、');
              addNotification(`💀 ${names} 因為長期挨餓離開了農場……`, { type: 'error' });
            }

            if (illnessLosses.length > 0) {
              const names = Array.from(new Set(illnessLosses)).join('、');
              addNotification(`☠️ ${names} 因病過世，務必照顧好其他動物的健康！`, { type: 'error' });
            }

            if (newlySick.length > 0) {
              const names = Array.from(new Set(newlySick)).join('、');
              addNotification(`🤒 ${names} 身體不適，需要營養劑治療！`, { type: 'error' });
            }

            if (outbreakVictims.length > 0) {
              const names = Array.from(new Set(outbreakVictims)).join('、');
              addNotification(`☠️ 農場爆發傳染病！${names} 情況危急，務必立即治療！`, { type: 'error' });
            }

            const ongoingSick = Array.from(new Set(sickAnimals.filter(name => !newlySick.includes(name))));
            if (ongoingSick.length > 0) {
              addNotification(`💊 ${ongoingSick.join('、')} 仍在療養中，記得使用營養劑。`, { type: 'warning' });
            }

            if (overcrowdAlerts.length > 0) {
              addNotification('🐏 動物棲位過於擁擠，建議擴建欄舍或調整飼養量！', { type: 'warning' });
            }

            if (careReminders.length > 0) {
              const reminders = Array.from(new Set(careReminders));
              addNotification(`🐾 ${reminders.join('、')}，多陪陪牠們吧！`, { type: 'info' });
            }

            if (careWarnings.length > 0) {
              const warnings = Array.from(new Set(careWarnings));
              addNotification(`⚠️ ${warnings.join('、')} 渴望照護，再忽略可能會生病！`, { type: 'warning' });
            }

            const urgentDirty = Array.from(new Set(filthyPens));
            if (urgentDirty.length > 0) {
              addNotification(`🧼 ${urgentDirty.join('、')} 的欄舍太髒亂了，立即清理以避免疾病！`, { type: 'error' });
            }

            const regularDirty = Array.from(new Set(dirtyPens.filter(name => !filthyPens.includes(name))));
            if (regularDirty.length > 0) {
              addNotification(`🧹 ${regularDirty.join('、')} 的欄舍需要整理，保持清潔讓牠們更安心。`, { type: 'warning' });
            }

            if (newbornAnimals.length > 0) {
              const names = newbornAnimals.map(animal => animal.name).join('、');
              addNotification(`🐣 ${names} 出生了，農場又更熱鬧了！`, { type: 'success' });
            }

            const nextAnimals = [...processedAnimals, ...newbornAnimals];
            stateRef.current.animals = nextAnimals;
            return nextAnimals;
          });

          if (Object.keys(producedGoods).length > 0) {
            const produceSummary = Object.entries(producedGoods).map(([productKey, amount]) => {
              const product = ANIMAL_PRODUCTS[productKey];
              const label = product ? `${product.emoji} ${product.name}` : productKey;
              return `${label} x${amount}`;
            });

            addNotification(`${produceSummary.join('、')} 已可收集，記得到動物欄點擊「收集」！`, { type: 'info' });
          }

          const infestedCrops = [];
          const destroyedCrops = [];
          const stormDamaged = [];
          const blightInfected = [];
          const autoWatered = new Set();
          const uncoveredByCoverage = new Set();
          const sprinklerLevel = gameEngine.getBuildingLevel(buildings, 'sprinkler');
          const sprinklerCoverage = gameEngine.getSprinklerCoverage(buildings);
          let autoWaterCapacityUsed = 0;
          setFarm(prevFarm => {
            let changed = false;
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

                const cropInfo = updatedPlot.crop ? CROPS[updatedPlot.crop] : null;

                if (sprinklerLevel > 0 && sprinklerCoverage > 0 && updatedPlot.crop && !updatedPlot.ready && !updatedPlot.watered) {
                  if (autoWaterCapacityUsed < sprinklerCoverage) {
                    autoWaterCapacityUsed += 1;
                    updatedPlot = { ...updatedPlot, watered: true };
                    if (cropInfo) {
                      autoWatered.add(cropInfo.name);
                    }
                  } else if (cropInfo) {
                    uncoveredByCoverage.add(cropInfo.name);
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

            let processedFarm = nextFarm;

            const vulnerableForStorm = processedFarm.filter(plot => plot.crop && !plot.greenhouse);
            if (vulnerableForStorm.length > 0 && Math.random() < 0.12) {
              const hits = Math.max(1, Math.ceil(vulnerableForStorm.length * 0.25));
              const selectedIds = new Set();
              while (selectedIds.size < Math.min(hits, vulnerableForStorm.length)) {
                const target = vulnerableForStorm[Math.floor(Math.random() * vulnerableForStorm.length)];
                selectedIds.add(target.id);
              }

              processedFarm = processedFarm.map(plot => {
                if (selectedIds.has(plot.id)) {
                  const cropInfo = plot.crop ? CROPS[plot.crop] : null;
                  if (cropInfo) {
                    stormDamaged.push(cropInfo.name);
                  }
                  changed = true;
                  return {
                    ...plot,
                    crop: null,
                    plantTime: null,
                    watered: false,
                    fertilized: false,
                    pest: false,
                    pestDays: 0,
                    ready: false,
                  };
                }
                return plot;
              });
            }

            const vulnerableForBlight = processedFarm.filter(plot => plot.crop && !plot.greenhouse && !plot.ready && !plot.pest);
            if (vulnerableForBlight.length > 0 && Math.random() < 0.09) {
              const hits = Math.max(1, Math.ceil(vulnerableForBlight.length * 0.3));
              const selectedIds = new Set();
              while (selectedIds.size < Math.min(hits, vulnerableForBlight.length)) {
                const target = vulnerableForBlight[Math.floor(Math.random() * vulnerableForBlight.length)];
                selectedIds.add(target.id);
              }

              processedFarm = processedFarm.map(plot => {
                if (selectedIds.has(plot.id)) {
                  const cropInfo = plot.crop ? CROPS[plot.crop] : null;
                  if (cropInfo) {
                    blightInfected.push(cropInfo.name);
                  }
                  changed = true;
                  return {
                    ...plot,
                    pest: true,
                    pestDays: Math.max(2, (plot.pestDays ?? 0) + 2),
                    watered: false,
                    fertilized: false,
                  };
                }
                return plot;
              });
            }

            const resultFarm = changed ? processedFarm : prevFarm;
            stateRef.current.farm = resultFarm;
            return resultFarm;
          });

          if (infestedCrops.length > 0) {
            const names = Array.from(new Set(infestedCrops)).join('、');
            addNotification(`🐛 害蟲入侵！${names} 需要使用驅蟲劑。`, { type: 'warning' });
          }

          if (destroyedCrops.length > 0) {
            const names = Array.from(new Set(destroyedCrops)).join('、');
            addNotification(`🥀 ${names} 因害蟲侵蝕而枯萎了……記得提早使用除蟲劑。`, { type: 'error' });
          }

          if (stormDamaged.length > 0) {
            const names = Array.from(new Set(stormDamaged)).join('、');
            addNotification(`⛈️ 暴風雨摧毀了 ${names}，未設溫室的作物損失慘重！`, { type: 'error' });
          }

          if (blightInfected.length > 0) {
            const names = Array.from(new Set(blightInfected)).join('、');
            addNotification(`🦠 ${names} 感染了作物病害，快使用除蟲劑或移入溫室！`, { type: 'warning' });
          }

          if (autoWatered.size > 0) {
            const names = Array.from(autoWatered).join('、');
            addNotification(`🚿 自動灑水器已為 ${names} 補足水分。`, { type: 'info' });
          }

          if (uncoveredByCoverage.size > 0) {
            const names = Array.from(uncoveredByCoverage).join('、');
            addNotification(`🚿 ${names} 超出了現有自動灑水範圍，請考慮升級灌溉設備。`, { type: 'warning' });
          }

          return 6;
        }
        return newTime;
      });
    }, 15000);

    return () => clearInterval(timer);
  }, [season, buildings, animals, addNotification, gameEngine, animalCapacity, handleDailyEvents, day, weather]);

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
      setFarm(prev => {
        const updatedFarm = prev.map(plot => {
          if (plot.crop && plot.plantTime && !plot.pest) {
            const now = Date.now();
            const cropData = CROPS[plot.crop];

            let weatherMultiplier = plot.greenhouse ? 1.2 : (cropData.weatherBonus[weather] || 1);
            const seasonMultiplier = plot.greenhouse ? 1 : (cropData.seasonBonus?.[season] ?? 1);
            const toolMultiplier = effectiveToolStats.speedBoost;
            const fertilizerBoost = plot.fertilized ? 1.25 : 1;

            const adjustedGrowTime = (cropData.growTime * 60000)
              / (weatherMultiplier * toolMultiplier * fertilizerBoost * seasonMultiplier);

            if (now - plot.plantTime >= adjustedGrowTime && !plot.ready) {
              addNotification(`${cropData.emoji} ${cropData.name} 成熟了！`, { type: 'success' });
              return { ...plot, ready: true };
            }
          }
          return plot;
        });
        stateRef.current.farm = updatedFarm;
        return updatedFarm;
      });
    }, 5000);

    return () => clearInterval(growTimer);
  }, [weather, season, addNotification, effectiveToolStats]);

  // 升級系統
  useEffect(() => {
    if (experience >= level * 100) {
      setLevel(prev => prev + 1);
      setExperience(prev => prev - (level * 100));
      addNotification(`🎉 升級到等級 ${level + 1}！`, { type: 'success' });
    }
  }, [experience, level, addNotification]);

  const prepareSeed = useCallback((seedType) => {
    gameEngine.prepareSeed(seedType);
  }, [gameEngine]);

  const purchaseSeeds = useCallback((seedType, quantity) => {
    gameEngine.purchaseSeeds(seedType, quantity);
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

  const expandFarmPlots = useCallback(() => {
    gameEngine.expandFarm();
  }, [gameEngine]);

  const expandAnimalPens = useCallback(() => {
    gameEngine.expandAnimalHousing();
  }, [gameEngine]);

  const sellInventoryItem = useCallback((itemKey, quantity) => {
    if (typeof quantity === 'number' && quantity <= 0) {
      return;
    }

    if (typeof quantity === 'number') {
      gameEngine.sellInventoryItem(itemKey, { quantity });
    } else {
      gameEngine.sellInventoryItem(itemKey);
    }
  }, [gameEngine]);

  const buyAnimal = useCallback((animalType, quantity = 1) => {
    gameEngine.buyAnimal(animalType, { quantity });
  }, [gameEngine]);

  const buyBuilding = useCallback((buildingType) => {
    gameEngine.buyBuilding(buildingType);
  }, [gameEngine]);

  const buyTool = useCallback((toolType, options = {}) => {
    gameEngine.buyTool(toolType, options);
  }, [gameEngine]);

  const slaughterAnimal = useCallback((animalId) => {
    gameEngine.slaughterAnimal(animalId);
  }, [gameEngine]);

  const feedAnimal = useCallback((animalId) => {
    gameEngine.feedAnimal(animalId);
  }, [gameEngine]);

  const collectAnimalProduct = useCallback((animalId) => {
    gameEngine.collectAnimalProduct(animalId);
  }, [gameEngine]);

  const buySupply = useCallback((supplyType, quantity = 1) => {
    gameEngine.buySupply(supplyType, { quantity });
  }, [gameEngine]);

  const selectSupply = useCallback((supplyType) => {
    gameEngine.selectSupply(supplyType);
  }, [gameEngine]);

  const applySupply = useCallback((plotId) => gameEngine.applySupply(plotId), [gameEngine]);

  const placeGreenhouse = useCallback((plotId) => gameEngine.placeGreenhouse(plotId), [gameEngine]);

  const treatAnimal = useCallback((animalId) => {
    gameEngine.treatAnimal(animalId);
  }, [gameEngine]);

  const careForAnimal = useCallback((animalId, actionKey) => {
    gameEngine.careForAnimal(animalId, actionKey);
  }, [gameEngine]);

  const completeSeasonalEvent = useCallback((instanceId) => {
    const currentEvents = Array.isArray(stateRef.current.seasonalEvents)
      ? stateRef.current.seasonalEvents
      : [];
    const target = currentEvents.find(event => event.instanceId === instanceId);
    if (!target) {
      return;
    }

    const currentInventory = stateRef.current.inventory || inventory;
    const currentSupplies = stateRef.current.farmSupplies || farmSupplies;
    if (!canFulfillRequirements(target.requirements, currentInventory, currentSupplies)) {
      addNotification('庫存不足，暫時無法支援這項活動。', { type: 'warning' });
      return;
    }

    applyRequirementSpending(target.requirements, setInventory, setFarmSupplies);
    applyRewardGrant(target, { setMoney, setInventory, setFarmSupplies, setMarketBoosts });
    setSeasonalEvents(prev => prev.filter(event => event.instanceId !== instanceId));
    const rewardSummary = describeRewards(target.rewards);
    addNotification(`🎉 已支援 ${target.name}！${rewardSummary ? `獲得 ${rewardSummary}` : '村民們十分感謝你的協助！'}`,
      { type: 'success' });
  }, [stateRef, inventory, farmSupplies, addNotification, setInventory, setFarmSupplies, setSeasonalEvents, setMoney, setMarketBoosts]);

  const completeWeatherMission = useCallback((instanceId) => {
    const currentMissions = Array.isArray(stateRef.current.weatherMissions)
      ? stateRef.current.weatherMissions
      : [];
    const target = currentMissions.find(mission => mission.instanceId === instanceId);
    if (!target) {
      return;
    }

    const currentInventory = stateRef.current.inventory || inventory;
    const currentSupplies = stateRef.current.farmSupplies || farmSupplies;
    if (!canFulfillRequirements(target.requirements, currentInventory, currentSupplies)) {
      addNotification('準備的物資不足，無法完成這項天氣任務。', { type: 'warning' });
      return;
    }

    applyRequirementSpending(target.requirements, setInventory, setFarmSupplies);
    applyRewardGrant(target, { setMoney, setInventory, setFarmSupplies, setMarketBoosts });
    setWeatherMissions(prev => prev.filter(mission => mission.instanceId !== instanceId));
    const rewardSummary = describeRewards(target.rewards);
    addNotification(`✅ 已完成「${target.name}」，${rewardSummary ? `獎勵：${rewardSummary}` : '村務局派人表達謝意！'}`,
      { type: 'success' });
  }, [stateRef, inventory, farmSupplies, addNotification, setInventory, setFarmSupplies, setWeatherMissions, setMoney, setMarketBoosts]);

  const fulfillMarketCommission = useCallback((instanceId) => {
    const currentOrders = Array.isArray(stateRef.current.marketCommissions)
      ? stateRef.current.marketCommissions
      : [];
    const target = currentOrders.find(order => order.instanceId === instanceId);
    if (!target) {
      return;
    }

    const currentInventory = stateRef.current.inventory || inventory;
    const currentSupplies = stateRef.current.farmSupplies || farmSupplies;
    if (!canFulfillRequirements(target.requirements, currentInventory, currentSupplies)) {
      addNotification('倉庫存量不足，無法交付這筆委託。', { type: 'warning' });
      return;
    }

    applyRequirementSpending(target.requirements, setInventory, setFarmSupplies);
    applyRewardGrant(target, { setMoney, setInventory, setFarmSupplies, setMarketBoosts });
    setMarketCommissions(prev => prev.filter(order => order.instanceId !== instanceId));
    const rewardSummary = describeRewards(target.rewards);
    addNotification(`📦 已完成 ${target.client} 的委託！${rewardSummary ? `獲得 ${rewardSummary}` : ''}`, { type: 'success' });
  }, [stateRef, inventory, farmSupplies, addNotification, setInventory, setFarmSupplies, setMarketCommissions, setMoney, setMarketBoosts]);

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
            <span className="text-sm">{effectiveToolStats.base.name} Lv.{effectiveToolStats.displayLevel}</span>
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
            {pendingGreenhousePlacement && (
              <div className="mb-3 rounded-lg border border-teal-300 bg-teal-50 px-3 py-2 text-sm text-teal-700 flex items-center gap-2">
                <Building className="w-4 h-4" />
                已購買溫室模組，請點選一格尚未設置溫室的農地完成建造。
              </div>
            )}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {farm.map((plot) => {
                const isReady = Boolean(plot.crop && plot.ready);
                const isGreenhouse = Boolean(plot.greenhouse);
                const isEmpty = !plot.crop;
                const highlightForPlacement = pendingGreenhousePlacement && !isGreenhouse;

                let tileStyle = '';
                if (isReady) {
                  tileStyle = 'bg-amber-200 border-amber-500 animate-pulse';
                } else if (isGreenhouse) {
                  tileStyle = isEmpty
                    ? 'bg-teal-50 border-teal-400'
                    : 'bg-teal-100 border-teal-400';
                } else if (plot.crop) {
                  tileStyle = 'bg-lime-100 border-lime-400';
                } else {
                  tileStyle = 'bg-gray-100 border-gray-300 hover:bg-green-50';
                }

                const placementRing = highlightForPlacement
                  ? 'ring-2 ring-teal-400 ring-offset-2'
                  : '';

                return (
                  <div key={plot.id}
                       className={`aspect-square border-2 rounded-lg cursor-pointer transition-all duration-300 hover:scale-105 relative ${tileStyle} ${placementRing}`}
                       onClick={() => {
                         if (pendingGreenhousePlacement) {
                           const handled = placeGreenhouse(plot.id);
                           if (handled) {
                             return;
                           }
                         }

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
                );
              })}
            </div>
            {sprinklerLevel > 0 && (
              <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 flex items-center gap-2">
                <Droplets className="w-3 h-3" />
                <span>
                  自動灑水器 Lv{sprinklerLevel} 覆蓋 {Math.min(sprinklerCoverage, farmSize)}/{farmSize} 格農地，
                  {sprinklerCoverage < farmSize
                    ? nextSprinklerUpgrade
                      ? `升級可擴充至 ${nextSprinklerUpgrade.coverage} 格。`
                      : '已達覆蓋上限，記得安排人工澆水。'
                    : '所有作物都會在清晨自動補水。'}
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6 text-sm text-gray-700">
              <div>
                農地格數：{farmSize}/{MAX_FARM_PLOTS}
              </div>
              {nextFarmExpansionCost !== null ? (
                <button
                  onClick={expandFarmPlots}
                  className="self-start sm:self-auto bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded transition-colors"
                >
                  擴建農地（{'$'}{nextFarmExpansionCost} / +{FARM_EXPANSION_BATCH}格）
                </button>
              ) : (
                <span className="text-xs text-gray-500">農地已達最大規模</span>
              )}
            </div>

            {/* 建築展示 */}
            {buildingEntries.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-bold mb-2">建築設施</h3>
                <div className="flex flex-wrap gap-2">
                  {buildingEntries.map(entry => (
                    <div key={entry.key}
                         className="bg-blue-100 rounded-lg p-2 flex items-center space-x-2">
                      <span className="text-2xl">{entry.meta.emoji}</span>
                      <span className="text-sm font-semibold">
                        {entry.meta.name}
                        {entry.key === 'greenhouse'
                          ? entry.count ? ` x${entry.count}` : ''
                          : typeof entry.value === 'number'
                            ? ` Lv${entry.value}`
                            : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 動物區域 */}
            <div className="mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <h3 className="text-lg font-bold">我的動物們（{animals.length}/{animalCapacity}）</h3>
                {nextAnimalExpansionCost !== null ? (
                  <button
                    onClick={expandAnimalPens}
                    className="self-start sm:self-auto bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors"
                  >
                    擴建動物欄（{'$'}{nextAnimalExpansionCost} / +{ANIMAL_CAPACITY_STEP}格）
                  </button>
                ) : (
                  <span className="text-xs text-gray-500">動物欄位已達上限</span>
                )}
              </div>
              {animals.length > 0 ? (
                <div className="grid grid-cols-4 gap-4">
                  {animals.map((animal) => {
                    const animalData = ANIMALS[animal.type];
                    const shelterLevel = gameEngine.getBuildingLevel(buildings, animalData.shelter);
                    const hasBuilding = shelterLevel > 0;
                    const hunger = animal.hunger ?? 50;
                    const isHungry = hunger <= 30;
                    const isSick = Boolean(animal.sick);
                    const medicineCount = farmSupplies.medicine || 0;
                    const productInfo = animalData.product ? ANIMAL_PRODUCTS[animalData.product] : null;
                    const readyCount = Math.max(0, Math.floor(animal.productReady || 0));
                    const canCollectProduct = Boolean(productInfo) && readyCount > 0;
                    const bondValue = Math.max(0, Math.round(animal.bond ?? 0));
                    const cleanlinessValue = Math.max(0, Math.round(animal.cleanliness ?? 0));
                    const careNeed = animal.careNeed;
                    const careMeta = careNeed ? ANIMAL_CARE_ACTIONS[careNeed] : null;
                    const careDays = Math.max(0, animal.careDays ?? 0);
                    const careUrgent = careDays >= 3;
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
                            {shelterLevel > 1 && (
                              <span className="ml-1 text-[10px] font-semibold text-green-700">Lv{shelterLevel}</span>
                            )}
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
                            <div className="flex items-center justify-center gap-1 mt-2">
                              <Sparkles className="w-3 h-3 text-purple-400" />
                              <span>羈絆 {bondValue}/100</span>
                            </div>
                            <div className="bg-gray-200 rounded-full h-1">
                              <div className="bg-purple-400 h-1 rounded-full transition-all duration-300"
                                   style={{ width: `${Math.min(100, bondValue)}%` }}></div>
                            </div>
                            <div className="flex items-center justify-center gap-1 mt-2">
                              <Droplets className={`w-3 h-3 ${cleanlinessValue < 30 ? 'text-red-500' : cleanlinessValue < 60 ? 'text-yellow-500' : 'text-teal-500'}`} />
                              <span>整潔 {cleanlinessValue}%</span>
                            </div>
                            <div className="bg-gray-200 rounded-full h-1">
                              <div className={`h-1 rounded-full transition-all duration-300 ${cleanlinessValue < 30 ? 'bg-red-400' : cleanlinessValue < 60 ? 'bg-yellow-400' : 'bg-teal-400'}`}
                                   style={{ width: `${Math.min(100, cleanlinessValue)}%` }}></div>
                            </div>
                          </div>
                          <div className={`text-xs mt-2 ${careNeed ? (careUrgent ? 'text-red-600 font-semibold' : 'text-purple-700') : 'text-emerald-600'}`}>
                            {careNeed
                              ? `需要：${careMeta?.shortLabel || careMeta?.label || '照護'}${careDays > 1 ? `（等待第 ${careDays} 天）` : ''}`
                              : '狀態穩定，感謝你的照顧！'}
                          </div>
                          <div className="grid grid-cols-3 gap-1 mt-2">
                            {Object.values(ANIMAL_CARE_ACTIONS).map(action => {
                              const isRequested = careNeed === action.key;
                              const insufficientEnergy = energy < action.energyCost;
                              return (
                                <button
                                  key={action.key}
                                  type="button"
                                  onClick={() => careForAnimal(animal.id, action.key)}
                                  disabled={insufficientEnergy}
                                  title={action.description}
                                  className={`text-[10px] font-semibold py-1 rounded transition-colors ${insufficientEnergy
                                    ? 'bg-purple-50 text-purple-300 cursor-not-allowed opacity-60'
                                    : isRequested
                                      ? 'bg-purple-400 hover:bg-purple-500 text-purple-900'
                                      : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                                  }`}
                                >
                                  {action.shortLabel || action.label}
                                  <span className="block text-[9px] font-normal">體力 -{action.energyCost}</span>
                                </button>
                              );
                            })}
                          </div>
                          {productInfo ? (
                            <div className="text-xs text-amber-600">
                              產物：{productInfo.emoji} {productInfo.name}
                              {canCollectProduct && (
                                <span className="ml-1 font-semibold text-amber-700">可收集 {readyCount}</span>
                              )}
                              <span className="ml-1 text-[10px] text-amber-500">（收集後可出售）</span>
                            </div>
                          ) : (
                            <div className="text-xs text-green-600">
                              日收入: ${Math.floor(animalData.income * (hasBuilding ? BUILDINGS[animalData.shelter].boost : 1))}
                            </div>
                          )}
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
                          {canCollectProduct && (
                            <button
                              onClick={() => collectAnimalProduct(animal.id)}
                              className="w-full text-xs font-semibold py-1 rounded transition-colors bg-amber-400 hover:bg-amber-500 text-amber-900 mt-2"
                            >
                              收集 {productInfo?.name || '產物'} (+{readyCount})
                            </button>
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
                          {animalData.butcher && (
                            <button
                              onClick={() => slaughterAnimal(animal.id)}
                              className="w-full text-xs font-semibold py-1 rounded transition-colors bg-red-200 hover:bg-red-300 text-red-700 mt-2"
                            >
                              屠宰換取 {ANIMAL_PRODUCTS[animalData.butcher.product]?.name || '肉品'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">還沒有動物，快到動物商店迎接新成員吧！</p>
              )}
            </div>
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

            {/* 任務告示板 */}
            <div className="bg-white bg-opacity-90 rounded-lg p-4 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Target className="w-4 h-4 text-rose-600" />
                  任務告示板
                </h3>
                <span className="text-xs text-gray-500">進行中 {activeQuests.length}</span>
              </div>
              {activeQuests.length > 0 ? (
                <div className="space-y-2">
                  {activeQuests.map(({ id, quest, entry, progress, required, ready, inventoryCount }) => {
                    const badgeText = ready ? '可完成' : entry.status === 'accepted' ? '進行中' : '等待交付';
                    const badgeClass = ready ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600';
                    const targetLabel = questManager.getQuestTargetLabel(quest);
                    const needsText = required > 0 ? `需求：${targetLabel} x${required}` : '';
                    const progressText = required > 0
                      ? quest.type === 'deliver'
                        ? `庫存 ${inventoryCount ?? 0}/${required}`
                        : `進度 ${progress}/${required}`
                      : '';

                    return (
                      <div key={id} className="border border-rose-100 rounded-lg p-3 bg-rose-50/70">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-rose-700 leading-snug">{quest.description}</p>
                            <p className="text-xs text-gray-600 mt-1">獎勵 ${quest.reward}</p>
                            {needsText && (
                              <p className="text-xs text-gray-500 mt-1">{needsText}</p>
                            )}
                            {progressText && (
                              <p className="text-xs text-gray-500">{progressText}</p>
                            )}
                          </div>
                          <span className={`text-[11px] px-2 py-1 rounded-full ${badgeClass}`}>{badgeText}</span>
                        </div>
                        <div className="mt-2 flex justify-end">
                          {quest.type === 'deliver' ? (
                            <button
                              onClick={() => deliverQuest(id)}
                              disabled={!ready}
                              className={`text-xs font-semibold px-3 py-1 rounded transition-colors ${ready
                                ? 'bg-rose-500 text-white hover:bg-rose-600'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              交付
                            </button>
                          ) : (
                            <button
                              onClick={() => claimQuestReward(id)}
                              disabled={!ready}
                              className={`text-xs font-semibold px-3 py-1 rounded transition-colors ${ready
                                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              領取獎勵
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  目前沒有進行中的任務，去和鄰居聊聊看看是否需要幫忙吧！
                </p>
              )}

              <div className="mt-4 pt-3 border-t border-rose-100">
                <h4 className="text-sm font-semibold text-rose-600 mb-2">今日佈告欄任務</h4>
                {availableDynamicQuests.length > 0 ? (
                  <div className="space-y-2">
                    {availableDynamicQuests.map(({ id, quest }) => {
                      const required = quest.count ?? 0;
                      const targetLabel = questManager.getQuestTargetLabel(quest);
                      return (
                        <div key={id} className="border border-rose-100 rounded-lg p-3 bg-white/70">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-rose-700 leading-snug">{quest.description}</p>
                              <p className="text-xs text-gray-600 mt-1">獎勵 ${quest.reward}</p>
                              {required > 0 && targetLabel !== '目標' && (
                                <p className="text-xs text-gray-500 mt-1">需求：{targetLabel} x{required}</p>
                              )}
                            </div>
                            <span className="text-[11px] px-2 py-1 rounded-full bg-rose-100 text-rose-600">{quest.npcName}</span>
                          </div>
                          <div className="mt-2 flex justify-end">
                            <button
                              onClick={() => acceptQuest(id)}
                              className="text-xs font-semibold px-3 py-1 rounded bg-rose-500 text-white hover:bg-rose-600 transition-colors"
                            >
                              接受任務
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">今日暫無新的佈告欄委託，明天再來看看吧！</p>
                )}
              </div>
            </div>

            {/* 季節活動中心 */}
            <div className="bg-white bg-opacity-90 rounded-lg p-4 shadow-lg">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-500" />
                季節活動中心
              </h3>
              {seasonalEvents.length === 0 && weatherMissions.length === 0 ? (
                <p className="text-sm text-gray-500">
                  目前沒有特別活動，專心耕作並等待下一波慶典與任務吧！
                </p>
              ) : (
                <div className="space-y-4">
                  {seasonalEvents.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-amber-600 mb-2">季節慶典</h4>
                      <div className="space-y-2">
                        {seasonalEvents.map(event => {
                          const requirements = event.requirements || [];
                          const canComplete = canFulfillRequirements(requirements, inventory, farmSupplies);
                          const daysLeft = Math.max(0, (event.expiresOn ?? day) - day + 1);
                          const rewardSummary = describeRewards(event.rewards);
                          return (
                            <div key={event.instanceId}
                                 className="border border-amber-200 bg-amber-50/70 rounded-lg p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold text-amber-700 leading-snug">{event.name}</p>
                                  <p className="text-xs text-gray-600 mt-1">{event.description}</p>
                                </div>
                                <span className={`text-[11px] px-2 py-1 rounded-full ${daysLeft <= 1 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                                  剩餘 {daysLeft} 天
                                </span>
                              </div>
                              {requirements.length > 0 && (
                                <ul className="mt-2 space-y-1">
                                  {requirements.map((requirement, index) => {
                                    const owned = getRequirementCurrentAmount(requirement, inventory, farmSupplies);
                                    const goal = requirement.amount || 0;
                                    const label = resolveRequirementLabel(requirement);
                                    const met = owned >= goal;
                                    return (
                                      <li key={`${event.instanceId}-req-${index}`}
                                          className="flex items-center justify-between text-xs text-gray-600">
                                        <span>{label}</span>
                                        <span className={met ? 'text-green-600 font-semibold' : 'text-gray-500'}>
                                          {owned}/{goal}
                                        </span>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                              {rewardSummary && (
                                <p className="mt-2 text-xs text-amber-700">獎勵：{rewardSummary}</p>
                              )}
                              <div className="mt-3 flex justify-end">
                                <button
                                  onClick={() => completeSeasonalEvent(event.instanceId)}
                                  disabled={!canComplete}
                                  className={`text-xs font-semibold px-3 py-1 rounded transition-colors ${canComplete
                                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                >
                                  提供支援
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {weatherMissions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-sky-600 mb-2">天氣任務</h4>
                      <div className="space-y-2">
                        {weatherMissions.map(mission => {
                          const requirements = mission.requirements || [];
                          const canComplete = canFulfillRequirements(requirements, inventory, farmSupplies);
                          const daysLeft = Math.max(0, (mission.expiresOn ?? day) - day + 1);
                          const rewardSummary = describeRewards(mission.rewards);
                          return (
                            <div key={mission.instanceId}
                                 className="border border-sky-200 bg-sky-50/70 rounded-lg p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold text-sky-700 leading-snug">{mission.name}</p>
                                  <p className="text-xs text-gray-600 mt-1">{mission.description}</p>
                                </div>
                                <span className={`text-[11px] px-2 py-1 rounded-full ${daysLeft <= 1 ? 'bg-red-100 text-red-600' : 'bg-sky-100 text-sky-700'}`}>
                                  剩餘 {daysLeft} 天
                                </span>
                              </div>
                              {requirements.length > 0 && (
                                <ul className="mt-2 space-y-1">
                                  {requirements.map((requirement, index) => {
                                    const owned = getRequirementCurrentAmount(requirement, inventory, farmSupplies);
                                    const goal = requirement.amount || 0;
                                    const label = resolveRequirementLabel(requirement);
                                    const met = owned >= goal;
                                    return (
                                      <li key={`${mission.instanceId}-req-${index}`}
                                          className="flex items-center justify-between text-xs text-gray-600">
                                        <span>{label}</span>
                                        <span className={met ? 'text-green-600 font-semibold' : 'text-gray-500'}>
                                          {owned}/{goal}
                                        </span>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                              {rewardSummary && (
                                <p className="mt-2 text-xs text-sky-700">獎勵：{rewardSummary}</p>
                              )}
                              <div className="mt-3 flex justify-end">
                                <button
                                  onClick={() => completeWeatherMission(mission.instanceId)}
                                  disabled={!canComplete}
                                  className={`text-xs font-semibold px-3 py-1 rounded transition-colors ${canComplete
                                    ? 'bg-sky-500 text-white hover:bg-sky-600'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                >
                                  完成任務
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 市場價格 */}
            <div className="bg-white bg-opacity-90 rounded-lg p-4 shadow-lg">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  市場價格
                </h3>
                <div className="flex flex-col items-end gap-2 text-xs">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Clock3 className="w-3 h-3" />
                    <span>{marketUpdateTime ? new Date(marketUpdateTime).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) : '更新中…'}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
                    <button
                      onClick={() => setMarketView('summary')}
                      className={`px-2 py-1 rounded-full transition-colors ${marketView === 'summary' ? 'bg-green-500 text-white' : 'text-gray-600 hover:text-green-600'}`}
                    >
                      日常總覽
                    </button>
                    <button
                      onClick={() => setMarketView('list')}
                      className={`px-2 py-1 rounded-full transition-colors ${marketView === 'list' ? 'bg-green-500 text-white' : 'text-gray-600 hover:text-green-600'}`}
                    >
                      完整列表
                    </button>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 mb-3">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>平均行情指數</span>
                  <span className={`font-semibold ${marketInsights.averageIndex >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                    {(marketInsights.averageIndex * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="bg-slate-200 h-1 rounded-full overflow-hidden mt-2">
                  <div
                    className={`${marketInsights.averageIndex >= 1 ? 'bg-green-400' : 'bg-red-400'} h-full transition-all`}
                    style={{ width: `${Math.min(100, Math.max(6, marketInsights.averageIndex * 100))}%` }}
                  ></div>
                </div>
              </div>
              <div className="mb-3 border border-emerald-200 bg-emerald-50/70 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                    <Boxes className="w-3 h-3" />
                    市場委託
                  </div>
                  <span className="text-[11px] text-emerald-700">活躍 {marketCommissions.length}/{MAX_ACTIVE_COMMISSIONS}</span>
                </div>
                {marketCommissions.length > 0 ? (
                  <div className="space-y-2">
                    {marketCommissions.map(order => {
                      const requirements = order.requirements || [];
                      const canComplete = canFulfillRequirements(requirements, inventory, farmSupplies);
                      const daysLeft = Math.max(0, (order.expiresOn ?? day) - day + 1);
                      const rewardSummary = describeRewards(order.rewards);
                      return (
                        <div key={order.instanceId} className="border border-emerald-200 bg-white/80 rounded-lg p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-emerald-700">{order.client}</p>
                              <p className="text-xs text-gray-600 mt-1 leading-snug">{order.description}</p>
                            </div>
                            <span className={`text-[11px] px-2 py-1 rounded-full ${daysLeft <= 1 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
                              剩餘 {daysLeft} 天
                            </span>
                          </div>
                          {requirements.length > 0 && (
                            <ul className="mt-2 space-y-1">
                              {requirements.map((requirement, index) => {
                                const owned = getRequirementCurrentAmount(requirement, inventory, farmSupplies);
                                const goal = requirement.amount || 0;
                                const label = resolveRequirementLabel(requirement);
                                const met = owned >= goal;
                                return (
                                  <li key={`${order.instanceId}-req-${index}`}
                                      className="flex items-center justify-between text-xs text-gray-600">
                                    <span>{label}</span>
                                    <span className={met ? 'text-green-600 font-semibold' : 'text-gray-500'}>
                                      {owned}/{goal}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                          {rewardSummary && (
                            <p className="mt-2 text-xs text-emerald-700">獎勵：{rewardSummary}</p>
                          )}
                          <div className="mt-3 flex justify-end">
                            <button
                              onClick={() => fulfillMarketCommission(order.instanceId)}
                              disabled={!canComplete}
                              className={`text-xs font-semibold px-3 py-1 rounded transition-colors ${canComplete
                                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                            >
                              交付委託
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">今日暫無委託訂單，靜候新的需求。</p>
                )}
              </div>
              {marketView === 'summary' ? (
                <>
                  {marketInsights.risers.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center gap-1 text-xs font-semibold text-green-600 uppercase tracking-wide">
                        <TrendingUp className="w-3 h-3" />
                        漲勢領先
                      </div>
                      <div className="mt-1 space-y-1">
                        {marketInsights.risers.map(entry => {
                          const percentText = entry.percentFromPrevious != null ? entry.percentFromPrevious.toFixed(1) : '—';
                          const percentDisplay = percentText === '—' ? '—' : `${percentText}%`;
                          return (
                            <div key={`rise-${entry.key}`} className="flex items-center justify-between text-xs bg-green-50 border border-green-100 rounded px-2 py-1 text-green-700">
                              <span>{entry.emoji} {entry.name}</span>
                              <span>
                                +${entry.changeFromPrevious} ({percentDisplay})
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {marketInsights.fallers.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center gap-1 text-xs font-semibold text-red-600 uppercase tracking-wide">
                        <TrendingDown className="w-3 h-3" />
                        價格回落
                      </div>
                      <div className="mt-1 space-y-1">
                        {marketInsights.fallers.map(entry => {
                          const percentText = entry.percentFromPrevious != null ? Math.abs(entry.percentFromPrevious).toFixed(1) : '—';
                          const percentDisplay = percentText === '—' ? '—' : `${percentText}%`;
                          return (
                            <div key={`fall-${entry.key}`} className="flex items-center justify-between text-xs bg-red-50 border border-red-100 rounded px-2 py-1 text-red-700">
                              <span>{entry.emoji} {entry.name}</span>
                              <span>
                                -${Math.abs(entry.changeFromPrevious)} ({percentDisplay})
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className="space-y-2 border-t border-slate-200 pt-2">
                    {marketInsights.sortedByPremium.slice(0, 5).map(entry => {
                      const trend = entry.changeFromPrevious ?? 0;
                      const trendClass = trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500';
                      const premiumClass = entry.changeFromBase > 0 ? 'text-green-600' : entry.changeFromBase < 0 ? 'text-red-600' : 'text-gray-600';
                      const percentFromPrevious = entry.percentFromPrevious != null ? entry.percentFromPrevious.toFixed(1) : '—';
                      const premiumPercent = `${entry.percentFromBase >= 0 ? '+' : ''}${entry.percentFromBase.toFixed(1)}%`;
                      const priceShare = marketInsights.highestPrice > 0 ? Math.min(100, Math.max(6, (entry.price / marketInsights.highestPrice) * 100)) : 0;

                      return (
                        <div key={entry.key} className="rounded-lg border border-slate-200 p-2">
                          <div className="flex justify-between items-center text-sm font-semibold text-slate-800">
                            <span>{entry.emoji} {entry.name}</span>
                            <span>${entry.price}</span>
                          </div>
                          <div className="flex justify-between text-xs mt-1 text-slate-500">
                            <span>基準 ${entry.basePrice}</span>
                            <span className={premiumClass}>
                              {entry.changeFromBase >= 0 ? '+' : ''}{entry.changeFromBase} ({premiumPercent})
                            </span>
                          </div>
                          <div className="flex justify-between text-xs mt-1">
                            <span className={trendClass}>
                              {trend > 0 ? `▲ +${trend}` : trend < 0 ? `▼ ${trend}` : '→ 持平'}
                            </span>
                            <span className={trendClass}>
                              {percentFromPrevious !== '—' ? `${trend > 0 ? '+' : ''}${percentFromPrevious}%` : '—'}
                            </span>
                          </div>
                          <div className="bg-slate-100 h-1 rounded-full overflow-hidden mt-2">
                            <div
                              className="bg-slate-400 h-full transition-all"
                              style={{ width: `${priceShare}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-end mb-2">
                    <div className="flex items-center gap-1 text-[11px] text-gray-600 bg-gray-100 rounded-full px-2 py-1">
                      排序：
                      <button
                        onClick={() => setMarketListSort('price')}
                        className={`px-2 py-[2px] rounded-full transition-colors ${marketListSort === 'price' ? 'bg-green-500 text-white' : 'text-gray-600 hover:text-green-600'}`}
                      >
                        價格
                      </button>
                      <button
                        onClick={() => setMarketListSort('premium')}
                        className={`px-2 py-[2px] rounded-full transition-colors ${marketListSort === 'premium' ? 'bg-green-500 text-white' : 'text-gray-600 hover:text-green-600'}`}
                      >
                        較基準
                      </button>
                      <button
                        onClick={() => setMarketListSort('change')}
                        className={`px-2 py-[2px] rounded-full transition-colors ${marketListSort === 'change' ? 'bg-green-500 text-white' : 'text-gray-600 hover:text-green-600'}`}
                      >
                        較昨日
                      </button>
                    </div>
                  </div>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="grid grid-cols-4 gap-2 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100">
                      <span>作物</span>
                      <span className="text-right">現價</span>
                      <span className="text-right">對基準</span>
                      <span className="text-right">對昨日</span>
                    </div>
                    {sortedMarketEntries.length > 0 ? (
                      sortedMarketEntries.map(entry => {
                        const baseChange = entry.changeFromBase ?? 0;
                        const basePercent = entry.percentFromBase ?? 0;
                        const baseClass = baseChange > 0 ? 'text-green-600' : baseChange < 0 ? 'text-red-600' : 'text-slate-500';
                        const change = entry.changeFromPrevious ?? 0;
                        const changePercent = entry.percentFromPrevious ?? 0;
                        const changeClass = change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-slate-500';
                        const changeDisplay = entry.changeFromPrevious == null ? '—' : `${change > 0 ? '+' : ''}${change} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%)`;
                        const baseDisplay = `${baseChange >= 0 ? '+' : ''}${baseChange} (${basePercent >= 0 ? '+' : ''}${basePercent.toFixed(1)}%)`;

                        return (
                          <div key={`list-${entry.key}`} className="grid grid-cols-4 gap-2 px-3 py-2 text-xs border-t border-slate-100">
                            <span className="flex items-center gap-2 font-medium text-slate-700">
                              <span>{entry.emoji}</span>
                              {entry.name}
                            </span>
                            <span className="text-right font-semibold text-slate-800">${entry.price}</span>
                            <span className={`text-right ${baseClass}`}>{baseDisplay}</span>
                            <span className={`text-right ${changeClass}`}>{changeDisplay}</span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-3 py-4 text-xs text-center text-slate-500 border-t border-slate-100">
                        暫無市場資料。
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* 庫存 */}
            <div className="bg-white bg-opacity-90 rounded-lg p-4 shadow-lg">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-amber-600" />
                    庫存
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">作物、畜產品與囤積的種子都會統一列在這裡。</p>
                </div>
                <div className="text-right text-xs">
                  <div className="text-gray-500">共 {inventoryInsights.totalCount} 件</div>
                  <div className="text-amber-600 font-semibold">估值 ${inventoryInsights.totalValue}</div>
                </div>
              </div>
              {inventoryInsights.items.length > 0 && (
                <div className="flex justify-end mb-2">
                  <div className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-100 rounded-full px-2 py-1">
                    排序：
                    <button
                      onClick={() => setInventorySortMode('value')}
                      className={`px-2 py-[2px] rounded-full transition-colors ${inventorySortMode === 'value' ? 'bg-amber-500 text-white' : 'text-amber-700 hover:text-amber-900'}`}
                    >
                      總價值
                    </button>
                    <button
                      onClick={() => setInventorySortMode('count')}
                      className={`px-2 py-[2px] rounded-full transition-colors ${inventorySortMode === 'count' ? 'bg-amber-500 text-white' : 'text-amber-700 hover:text-amber-900'}`}
                    >
                      數量
                    </button>
                  </div>
                </div>
              )}
              {inventoryInsights.items.length > 0 ? (
                <div className="space-y-2">
                  {inventoryInsights.items.map(item => {
                    const halfQuantity = Math.floor(item.count / 2);
                    const shareWidth = item.share > 0 ? Math.min(100, Math.max(6, item.share)) : 0;
                    const typeLabel = item.type === 'seed'
                      ? '種子'
                      : item.type === 'product'
                        ? '畜產品'
                        : '作物';
                    const valueLabel = item.type === 'seed' ? '估值' : '單價';

                    return (
                      <div key={item.key} className="rounded-lg border border-amber-200 bg-amber-50/80 p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{item.emoji}</div>
                            <div>
                              <div className="font-semibold text-sm text-amber-900">{item.name}</div>
                              <div className="text-xs text-amber-700">
                                {typeLabel} · {valueLabel} ${item.unitValue}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-sm text-amber-900">x{item.count}</div>
                            <div className="text-xs text-amber-700">總值 ${item.totalValue}</div>
                          </div>
                        </div>
                        <div className="bg-amber-100 h-1 rounded-full overflow-hidden mt-2">
                          <div
                            className="bg-amber-400 h-full transition-all"
                            style={{ width: `${shareWidth}%` }}
                          ></div>
                        </div>
                        {item.canSell && (
                          <div className="flex justify-end gap-2 mt-2">
                            {halfQuantity > 0 && halfQuantity < item.count && (
                              <button
                                onClick={() => sellInventoryItem(item.key, halfQuantity)}
                                className="text-xs bg-white border border-amber-300 hover:border-amber-400 text-amber-700 px-2 py-1 rounded transition-colors"
                              >
                                出售 {halfQuantity} 個
                              </button>
                            )}
                            <button
                              onClick={() => sellInventoryItem(item.key)}
                              className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded transition-colors"
                            >
                              全部出售（${item.totalValue}）
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">庫存為空，快去田裡收成或向動物們索取產品吧！</p>
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
              {seedStorage.length > 0 && (
                <div className="mt-4 border-t border-teal-200 pt-3">
                  <h4 className="text-sm font-semibold text-teal-700 mb-2">種子倉庫</h4>
                  <div className="space-y-2">
                    {seedStorage.map(seed => {
                      const isSelected = selectedSeed === seed.cropKey;
                      return (
                        <button
                          key={seed.key}
                          onClick={() => prepareSeed(seed.cropKey)}
                          className={`w-full flex items-center justify-between text-sm border rounded-lg px-3 py-2 transition-colors ${
                            isSelected ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-amber-200 hover:border-amber-400'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>{seed.emoji}</span>
                            <span className="font-semibold">{seed.name} 種子</span>
                          </span>
                          <span className="text-xs text-gray-600">庫存 {seed.count} 包</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-amber-600 mt-2">
                    點擊即可帶著種子外出種植；庫存不足時系統會改為現金購買。
                  </p>
                </div>
              )}
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
              {!hasAnyBaseSupply && (
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
                    <div className="text-sm text-gray-600">
                      倉庫種子: {inventory[`seed_${selectedSeed}`] || 0} 包
                    </div>
                    <div className="text-xs text-gray-500">
                      無庫存時植入需花費 ${CROPS[selectedSeed].price}
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
                  <li>工具共有多階段升級，每提升一級作物成長加快 15%，魔法工具更能無限強化。</li>
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
              {Object.entries(CROPS).map(([key, crop]) => {
                const seedCost = crop.price;
                const marketValue = marketPrices[key] || crop.sellPrice;
                const seedKey = `seed_${key}`;
                const storedSeeds = inventory[seedKey] || 0;
                const seasonEntries = Object.entries(crop.seasonBonus || {});
                const favorableSeasons = seasonEntries
                  .filter(([, value]) => value > 1.05)
                  .map(([seasonKey]) => GameFormatter.seasonName(seasonKey));
                const riskySeasons = seasonEntries
                  .filter(([, value]) => value < 0.9)
                  .map(([seasonKey]) => GameFormatter.seasonName(seasonKey));

                return (
                  <div key={key}
                       className="border rounded-lg p-4 bg-white/90 shadow-sm flex flex-col gap-3">
                    <div className="text-center space-y-1">
                      <div className="text-3xl">{crop.emoji}</div>
                      <div className="font-semibold">{crop.name}</div>
                      <div className="text-green-600 font-bold">種子 ${seedCost}</div>
                      <div className="text-xs text-gray-500">成長: {crop.growTime}分鐘</div>
                      <div className="text-xs text-blue-600">基礎售價: ${crop.sellPrice}</div>
                      <div className="text-xs text-emerald-600">今日市價: ${marketValue}</div>
                      <div className="text-xs text-amber-600">種子庫存: {storedSeeds} 包</div>
                      {favorableSeasons.length > 0 && (
                        <div className="text-[11px] text-emerald-600">適合季節：{favorableSeasons.join('、')}</div>
                      )}
                      {riskySeasons.length > 0 && (
                        <div className="text-[11px] text-rose-500">避免季節：{riskySeasons.join('、')}</div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          prepareSeed(key);
                          setShowShop(false);
                        }}
                        className="w-full text-sm bg-green-500 hover:bg-green-600 text-white py-1.5 rounded transition-colors"
                      >
                        準備種植
                      </button>
                      <div className="text-[11px] text-gray-500 text-center">大量進貨可趁特價</div>
                      <div className="flex gap-2">
                        {[1, 5, 10].map(amount => (
                          <button
                            key={amount}
                            onClick={() => purchaseSeeds(key, amount)}
                            className="flex-1 text-xs border border-green-200 hover:border-green-400 text-green-700 rounded py-1 transition-colors"
                          >
                            買 {amount}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
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
                <div key={key} className="border rounded-lg p-4 bg-white/90 shadow-sm">
                  <div className="text-center space-y-1">
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
                  <div className="flex gap-2 mt-3">
                    {[1, 3].map(amount => (
                      <button
                        key={amount}
                        onClick={() => buyAnimal(key, amount)}
                        className="flex-1 text-xs bg-blue-500/10 text-blue-700 border border-blue-200 hover:border-blue-400 rounded py-1 transition-colors"
                      >
                        購買 {amount}
                      </button>
                    ))}
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
                {Object.entries(BUILDINGS).map(([key, building]) => {
                  const rawValue = buildings?.[key];
                  const isGreenhouse = key === 'greenhouse';
                  const greenhouseCount = isGreenhouse
                    ? (typeof rawValue === 'number'
                      ? rawValue
                      : (rawValue && Array.isArray(farm) ? farm.filter(plot => plot.greenhouse).length : 0))
                    : 0;
                  const currentLevel = isGreenhouse ? greenhouseCount : gameEngine.getBuildingLevel(buildings, key);
                  const upgrades = BUILDING_UPGRADES[key] || [];
                  const hasLevels = upgrades.length > 0;
                  const nextUpgrade = hasLevels
                    ? upgrades.find(entry => entry.level === currentLevel + 1)
                    : null;
                  const currentInfo = hasLevels
                    ? upgrades.find(entry => entry.level === (currentLevel > 0 ? currentLevel : upgrades[0].level))
                    : null;
                  const isOwned = isGreenhouse ? greenhouseCount > 0 : currentLevel > 0;
                  const canPurchase = isGreenhouse
                    ? true
                    : hasLevels
                      ? Boolean(nextUpgrade)
                      : !isOwned;
                  const cardHighlight = isGreenhouse && greenhouseCount > 0
                    ? 'bg-teal-50 border-teal-300'
                    : isOwned
                      ? (hasLevels && !nextUpgrade ? 'bg-amber-50 border-amber-300' : 'bg-green-100 border-green-400')
                      : 'hover:bg-gray-50';
                  const priceLabel = isGreenhouse
                    ? `$${building.price}`
                    : hasLevels
                      ? nextUpgrade
                        ? `$${nextUpgrade.cost}`
                        : '已滿級'
                      : isOwned
                        ? '已擁有'
                        : `$${building.price}`;
                  const actionLabel = isGreenhouse
                    ? (greenhouseCount > 0 ? '再購一格' : '建造')
                    : hasLevels
                      ? nextUpgrade
                        ? (currentLevel > 0 ? `升級至 Lv${nextUpgrade.level}` : '建造')
                        : `Lv${currentLevel}`
                      : (isOwned ? '已建造' : '建造');

                  return (
                    <div key={key}
                         className={`border rounded-lg p-4 transition-colors ${cardHighlight} ${canPurchase ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'}`}
                         onClick={() => canPurchase && buyBuilding(key)}>
                      <div className="text-center space-y-2">
                        <div className="text-3xl mb-2">{building.emoji}</div>
                        <div className="font-semibold">
                          {building.name}
                          {hasLevels && currentLevel > 0 && key !== 'greenhouse' && (
                            <span className="ml-1 text-sm text-green-600">Lv{currentLevel}</span>
                          )}
                        </div>
                        <div className={`font-bold ${canPurchase ? 'text-green-600' : 'text-gray-500'}`}>{priceLabel}</div>
                        <div className="text-xs text-gray-500">{actionLabel}</div>
                        <div className="text-xs text-gray-600 mt-2 space-y-1">
                          <p>{building.description}</p>
                          {isGreenhouse && (
                            <p className="text-teal-600">
                              {greenhouseCount > 0
                                ? `目前共有 ${greenhouseCount} 格溫室土地，可再購買擴充。`
                                : '每次購買可讓一格農地升級為溫室。'}
                            </p>
                          )}
                          {hasLevels && currentInfo && (
                            <p className={currentLevel > 0 ? 'text-green-600' : 'text-blue-600'}>
                              {currentLevel > 0 ? `目前 Lv${currentLevel}：` : '等級預覽：'}{currentInfo.description}
                            </p>
                          )}
                          {hasLevels && nextUpgrade && (
                            <p className="text-blue-600">下一級：{nextUpgrade.description}</p>
                          )}
                        </div>
                        {!hasLevels && building.boost !== 1.0 && (
                          <div className="text-xs text-blue-600">
                            效果加成: {Math.round(building.boost * 100)}%
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
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
              {Object.entries(TOOLS).map(([key, tool]) => {
                const isActive = tools === key;
                const isOwned = ownedTools.includes(key);
                const currentLevel = toolLevels?.[key] ?? 0;
                const ownedLevel = isOwned ? currentLevel : 0;
                const displayLevel = ownedLevel + 1;
                const displaySpeed = (tool.speedBoost || 1) + (tool.speedUpgrade || 0) * ownedLevel;
                const displayEnergy = (tool.energyReduction || 0) + (tool.energyUpgrade || 0) * ownedLevel;
                const nextUpgradeCost = gameEngine.getToolUpgradeCost(key, ownedLevel);
                const canUpgrade = isOwned && nextUpgradeCost !== null;
                const cardClass = isActive
                  ? 'bg-green-100 border-green-400'
                  : isOwned
                    ? 'border-blue-300 bg-blue-50/60 hover:bg-blue-100'
                    : 'hover:bg-gray-50';
                const priceLabel = isActive
                  ? '已裝備'
                  : isOwned
                    ? '已購買'
                    : tool.price === 0
                      ? '免費'
                      : `$${tool.price}`;

                return (
                  <div
                    key={key}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${cardClass}`}
                    onClick={() => buyTool(key)}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <div className="font-semibold">{tool.name} {isOwned && <span className="text-xs text-gray-500">Lv.{displayLevel}</span>}</div>
                        <div className="text-sm text-gray-600">
                          節省體力: {Math.round(displayEnergy)}
                        </div>
                        <div className="text-sm text-gray-600">
                          速度加成: {Math.round(displaySpeed * 100)}%
                        </div>
                        {canUpgrade && (
                          <div className="mt-2 text-xs text-amber-600">
                            下一級可達 {Math.round(((tool.speedBoost || 1) + (tool.speedUpgrade || 0) * (ownedLevel + 1)) * 100)}%／節省 {Math.round((tool.energyReduction || 0) + (tool.energyUpgrade || 0) * (ownedLevel + 1))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${isActive ? 'text-green-600' : 'text-blue-600'}`}>
                          {priceLabel}
                        </div>
                        {isOwned && !isActive && (
                          <div className="text-[11px] text-blue-500">點擊切換</div>
                        )}
                      </div>
                    </div>
                    {canUpgrade && (
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-xs text-gray-500">目前等級 Lv.{displayLevel}</span>
                        <button
                          className="text-xs bg-purple-100 text-purple-700 border border-purple-300 rounded px-2 py-1 hover:bg-purple-200 transition-colors"
                          onClick={(event) => {
                            event.stopPropagation();
                            buyTool(key, { upgrade: true });
                          }}
                        >
                          {`升級 $${nextUpgradeCost}`}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
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
                <div key={key} className="border rounded-lg p-4 bg-white/95 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-2xl">{supply.emoji}</div>
                      <div className="font-semibold mt-1">{supply.name}</div>
                      <div className="text-sm text-gray-600 mt-1 leading-snug">{supply.description}</div>
                    </div>
                    <div className="text-green-600 font-bold">${supply.price}</div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {[1, 3, 5].map(amount => (
                      <button
                        key={amount}
                        onClick={() => buySupply(key, amount)}
                        className="flex-1 text-xs bg-teal-500/10 text-teal-700 border border-teal-200 hover:border-teal-400 rounded py-1 transition-colors"
                      >
                        購買 {amount}
                      </button>
                    ))}
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
            {currentNPC.quests && currentNPC.quests.length > 0 && (
              <div className="mb-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">可進行的任務</h3>
                {currentNPC.quests.map(quest => {
                  const log = questLog[quest.id] || null;
                  const status = log?.status ?? 'available';
                  const required = quest.count ?? 0;
                  const inventoryCount = quest.type === 'deliver' ? (inventory?.[quest.target] ?? 0) : 0;
                  const progress = quest.type === 'deliver'
                    ? Math.min(required, inventoryCount)
                    : Math.min(required, log?.progress ?? 0);
                  const canDeliver = quest.type === 'deliver' && status === 'accepted' && inventoryCount >= required;
                  const canClaim = status === 'ready';

                  let badgeClass = 'bg-yellow-100 text-yellow-700';
                  let statusLabel = '可接取';
                  if (status === 'accepted') {
                    if (canDeliver) {
                      badgeClass = 'bg-green-100 text-green-700';
                      statusLabel = '可交付';
                    } else {
                      badgeClass = 'bg-blue-100 text-blue-600';
                      statusLabel = '進行中';
                    }
                  } else if (status === 'ready') {
                    badgeClass = 'bg-green-100 text-green-700';
                    statusLabel = '可領取';
                  } else if (status === 'completed') {
                    badgeClass = 'bg-gray-200 text-gray-600';
                    statusLabel = '已完成';
                  }

                  const targetLabel = questManager.getQuestTargetLabel(quest);

                  return (
                    <div key={quest.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-800 leading-snug">{quest.description}</p>
                          <p className="text-xs text-gray-600 mt-1">獎勵 ${quest.reward}</p>
                          {required > 0 && (
                            <p className="text-xs text-gray-500">需求：{targetLabel} x{required}</p>
                          )}
                          {required > 0 && (
                            <p className="text-xs text-gray-500">
                              {quest.type === 'deliver'
                                ? `庫存 ${inventoryCount}/${required}`
                                : `進度 ${progress}/${required}`}
                            </p>
                          )}
                        </div>
                        <span className={`text-[11px] px-2 py-1 rounded-full ${badgeClass}`}>{statusLabel}</span>
                      </div>
                      <div className="mt-2 flex justify-end gap-2">
                        {status === 'available' && (
                          <button
                            onClick={() => acceptQuest(quest.id)}
                            className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
                          >
                            接受任務
                          </button>
                        )}
                        {quest.type === 'deliver' && status === 'accepted' && (
                          <button
                            onClick={() => deliverQuest(quest.id)}
                            disabled={!canDeliver}
                            className={`text-xs px-3 py-1 rounded transition-colors ${canDeliver
                              ? 'bg-rose-500 text-white hover:bg-rose-600'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            立即交付
                          </button>
                        )}
                        {quest.type === 'deliver' && status === 'completed' && (
                          <span className="text-xs text-gray-500">感謝你的幫忙！</span>
                        )}
                        {quest.type !== 'deliver' && canClaim && (
                          <button
                            onClick={() => claimQuestReward(quest.id)}
                            className="text-xs bg-emerald-500 text-white px-3 py-1 rounded hover:bg-emerald-600 transition-colors"
                          >
                            領取獎勵
                          </button>
                        )}
                        {quest.type !== 'deliver' && status === 'accepted' && !canClaim && (
                          <span className="text-xs text-gray-500">努力完成目標中…</span>
                        )}
                        {quest.type !== 'deliver' && status === 'completed' && (
                          <span className="text-xs text-gray-500">任務已完成！</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
                <span className="font-bold">{effectiveToolStats.base.name} Lv.{effectiveToolStats.displayLevel}</span>
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
