import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Sprout, Coins, ShoppingCart, Heart, Home, Sun, Moon, Zap, Droplets, Hammer,
  Building, Star, Leaf, Seedling, Plus, Minus, ChevronRight, Wind, Factory, ScrollText
} from 'lucide-react'

/** ---------- 基礎資料 ---------- */
const CROPS = {
  carrot: { name: '胡蘿蔔', price: 10,  growTime: 5,  sellPrice: 25, emoji: '🥕', weatherBonus: { sunny: 1.2, rainy: 1.0, snow: 0.8 } },
  corn:   { name: '玉米',   price: 20,  growTime: 8,  sellPrice: 50, emoji: '🌽', weatherBonus: { sunny: 1.3, rainy: 1.1, snow: 0.6 } },
  tomato: { name: '番茄',   price: 15,  growTime: 6,  sellPrice: 35, emoji: '🍅', weatherBonus: { sunny: 1.4, rainy: 0.9, snow: 0.5 } },
  wheat:  { name: '小麥',   price: 8,   growTime: 4,  sellPrice: 20, emoji: '🌾', weatherBonus: { sunny: 1.1, rainy: 1.2, snow: 0.9 } },
  potato: { name: '馬鈴薯', price: 12,  growTime: 7,  sellPrice: 30, emoji: '🥔', weatherBonus: { sunny: 1.0, rainy: 1.3, snow: 1.1 } },
  strawberry: { name: '草莓', price: 25, growTime: 10, sellPrice: 60, emoji: '🍓', weatherBonus: { sunny: 1.2, rainy: 0.8, snow: 0.4 } },
}

const ANIMALS = {
  dog:     { name: '狗狗', price: 200, happiness: 50, emoji: '🐕', foodCost: 5,  income: 8,  shelter: 'dogHouse' },
  cat:     { name: '貓咪', price: 150, happiness: 60, emoji: '🐱', foodCost: 3,  income: 5,  shelter: 'catHouse' },
  chicken: { name: '雞',   price: 100, happiness: 40, emoji: '🐔', foodCost: 2,  income: 12, shelter: 'chickenCoop' },
  cow:     { name: '牛',   price: 500, happiness: 30, emoji: '🐄', foodCost: 10, income: 25, shelter: 'barn' },
  pig:     { name: '豬',   price: 300, happiness: 45, emoji: '🐷', foodCost: 8,  income: 18, shelter: 'pigPen' },
  sheep:   { name: '羊',   price: 250, happiness: 40, emoji: '🐑', foodCost: 6,  income: 15, shelter: 'barn' },
  duck:    { name: '鴨子', price: 120, happiness: 55, emoji: '🦆', foodCost: 3,  income: 10, shelter: 'pond' },
  rabbit:  { name: '兔子', price: 80,  happiness: 70, emoji: '🐰', foodCost: 2,  income: 6,  shelter: 'rabbitHutch' },
}

const BUILDINGS = {
  barn: {
    name: '穀倉',
    emoji: '🏚️',
    description: '容納牛羊，提升產量',
    levels: [
      { cost: 1000, boost: 1.2, description: '基本穀倉，讓大型牲畜心情更穩定。' },
      { cost: 1600, boost: 1.35, description: '擴建料槽與保溫設備，提升產量。' },
      { cost: 2300, boost: 1.5, description: '自動飼料管理，讓牛羊保持高產。' },
    ],
    modules: [
      {
        id: 'autoGroomer',
        name: '自動梳理機',
        cost: 1800,
        requirementLevel: 2,
        description: '每天早晨為畜舍動物加值幸福度。',
        effect: 'autoGroom',
      },
    ],
  },
  chickenCoop: {
    name: '雞舍',
    emoji: '🏠',
    description: '專門養雞，提升產蛋率',
    levels: [
      { cost: 500, boost: 1.3, description: '簡易雞舍，改善產量。' },
      { cost: 900, boost: 1.45, description: '加裝溫燈與自動餵食。' },
    ],
    modules: [],
  },
  dogHouse: {
    name: '狗屋',
    emoji: '🏘️',
    description: '狗狗的溫馨小窩',
    levels: [
      { cost: 300, boost: 1.1, description: '遮風避雨的小屋。' },
      { cost: 520, boost: 1.25, description: '加裝玩具與暖墊。' },
    ],
    modules: [],
  },
  catHouse: {
    name: '貓屋',
    emoji: '🏡',
    description: '貓咪的舒適居所',
    levels: [
      { cost: 250, boost: 1.1, description: '柔軟的貓窩。' },
      { cost: 480, boost: 1.22, description: '加裝貓跳台與暖燈。' },
    ],
    modules: [],
  },
  pigPen: {
    name: '豬圈',
    emoji: '🏗️',
    description: '豬豬的泥土樂園',
    levels: [
      { cost: 400, boost: 1.2, description: '穩固圍欄與泥地。' },
      { cost: 720, boost: 1.32, description: '自動清潔泥池，減少異味。' },
    ],
    modules: [],
  },
  pond: {
    name: '池塘',
    emoji: '🌊',
    description: '水鳥的天堂',
    levels: [
      { cost: 600, boost: 1.3, description: '自然池塘，吸引水鳥。' },
      { cost: 980, boost: 1.45, description: '擴建棲木與遮蔭。' },
    ],
    modules: [],
  },
  rabbitHutch: {
    name: '兔籠',
    emoji: '📦',
    description: '兔子的安全小屋',
    levels: [
      { cost: 200, boost: 1.2, description: '堅固木籠保護兔子。' },
      { cost: 420, boost: 1.32, description: '增設運動空間與食槽。' },
    ],
    modules: [],
  },
  greenhouse: {
    name: '溫室',
    emoji: '🏢',
    description: '不受天氣影響的種植空間',
    levels: [
      { cost: 2000, description: '所有地塊獲得溫室保護，避免天氣損害。', greenhouseCoverage: true },
      { cost: 3200, description: '氣候控制升級，減緩病蟲害與土壤衰退。', greenhouseCoverage: true, soilDecayReduction: 0.25 },
    ],
    modules: [
      {
        id: 'mistSystem',
        name: '自動噴霧系統',
        cost: 1400,
        requirementLevel: 2,
        description: '每天清晨自動澆灌溫室地塊，並帶來微量濕潤加成。',
        effect: 'autoGreenhouseWater',
      },
    ],
  },
  silo: {
    name: '筒倉',
    emoji: '🗼',
    description: '儲存更多作物',
    levels: [
      { cost: 800, storageBonus: 0.05, description: '擴充倉儲，增加出售加成。' },
      { cost: 1300, storageBonus: 0.08, description: '裝設冷藏系統，讓作物保持新鮮。' },
    ],
    modules: [],
  },
  windmill: {
    name: '風車',
    emoji: '🌪️',
    description: '產生額外收入',
    levels: [
      { cost: 1500, income: 50, description: '基礎風車，每日產出 50 金幣。' },
      { cost: 2200, income: 90, description: '強化風葉，每日產出 90 金幣。' },
      { cost: 3000, income: 140, description: '全自動風車系統，提供 140 金幣。' },
    ],
    modules: [
      {
        id: 'powerGrid',
        name: '電力連結模組',
        cost: 1800,
        requirementLevel: 2,
        description: '啟動加工廠，讓所有作物售價額外 +5%。',
        effect: 'marketBoost',
      },
    ],
  },
  sprinkler: {
    name: '自動灑水器',
    emoji: '🚿',
    description: '每天自動澆灌作物，並降低澆水體力消耗',
    levels: [
      { cost: 650, waterEnergyCost: 2, plantEnergyCost: 5, description: '減少澆水與種植的體力消耗。' },
      { cost: 1400, waterEnergyCost: 0, plantEnergyCost: 3, autoMorningWater: true, description: '黎明自動灌溉並再降低體力需求。' },
      { cost: 2200, waterEnergyCost: 0, plantEnergyCost: 1, autoMorningWater: true, description: '感測土壤狀態，自動調整澆灌效率。' },
    ],
    modules: [
      {
        id: 'fertInjector',
        name: '施肥注入器',
        cost: 1600,
        requirementLevel: 2,
        description: '澆水時自動施肥（消耗 1 份肥料）。',
        effect: 'autoFertilize',
      },
    ],
  },
}

const WEATHER_TYPES = ['sunny', 'rainy', 'cloudy', 'storm', 'snow']
const SEASONS = ['spring','summer','autumn','winter']

const STORY_QUESTS = [
  {
    id: 'welcome',
    title: '新的開始',
    description: '收成 3 次作物並建造第一棟設施，熟悉農場節奏。',
    requirements: [
      { type: 'harvest', target: 3, description: '收成 3 次作物' },
      { type: 'buildingTotal', target: 1, description: '建造任一棟建築' },
    ],
    rewards: { money: 200, fertilizer: 3 },
  },
  {
    id: 'automation',
    title: '自動化藍圖',
    description: '透過升級灑水器和模組化插件，打造半自動農場。',
    requirements: [
      { type: 'buildingLevel', building: 'sprinkler', level: 2, description: '灑水器升級至等級 2' },
      { type: 'module', building: 'sprinkler', module: 'fertInjector', description: '安裝施肥注入器模組' },
    ],
    rewards: { money: 400, fertilizer: 5 },
  },
  {
    id: 'windFactory',
    title: '風之工坊',
    description: '讓風車帶動加工廠，同時維持健康土壤與作物品質。',
    requirements: [
      { type: 'buildingLevel', building: 'windmill', level: 2, description: '風車升級至等級 2' },
      { type: 'module', building: 'windmill', module: 'powerGrid', description: '安裝電力連結模組' },
      { type: 'soilQuality', target: 75, description: '平均土壤肥力達到 75 以上' },
    ],
    rewards: { money: 600, fertilizer: 8 },
  },
]

const DEFAULT_STORY_STATE = {
  activeId: STORY_QUESTS[0].id,
  completed: [],
}

/** ---------- 小工具 ---------- */
const clamp = (v, min, max) => Math.max(min, Math.min(max, v))
const rand = (min, max) => Math.random() * (max - min) + min
const int = (v) => Math.floor(v)

/** ---------- Component ---------- */
const FarmGame = () => {
  /** 狀態 */
  const [money, setMoney] = useState(500)
  const [energy, setEnergy] = useState(100)
  const [level, setLevel] = useState(1)
  const [experience, setExperience] = useState(0)
  const [time, setTime] = useState(6)
  const [day, setDay] = useState(1)
  const [season, setSeason] = useState('spring')
  const [weather, setWeather] = useState('sunny')
  const [weatherDuration, setWeatherDuration] = useState(0)

  // 作物庫存（成品）
  const [inventory, setInventory] = useState(
    Object.keys(CROPS).reduce((a,k)=>({ ...a, [k]:0 }),{})
  )
  // 種子庫存（新增）
  const [seedBag, setSeedBag] = useState(
    Object.keys(CROPS).reduce((a,k)=>({ ...a, [k]:0 }),{})
  )
  // 肥料（新增）
  const [fertilizer, setFertilizer] = useState(0)

  // 農地
  const [farm, setFarm] = useState(
    Array(25).fill().map((_, i) => ({
      id: i,
      crop: null,
      plantTime: null,
      watered: false,
      fertilized: false,
      greenhouse: false,
      ready: false,
      soilQuality: 70,
      disease: 0,
      restingDays: 0,
      lastCrop: null,
    }))
  )

  // 市場價格係數（新增：每日變動）
  const [market, setMarket] = useState(
    Object.keys(CROPS).reduce((a,k)=>({ ...a, [k]:1 }),{})
  )

  const [animals, setAnimals] = useState([])
  const [buildings, setBuildings] = useState({})
  const [selectedSeed, setSelectedSeed] = useState(null)
  const [showShop, setShowShop] = useState(false)
  const [showAnimalShop, setShowAnimalShop] = useState(false)
  const [showBuildingShop, setShowBuildingShop] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [speed, setSpeed] = useState(1) // 1x/2x/4x
  const [showQuestModal, setShowQuestModal] = useState(false)
  const [storyState, setStoryState] = useState(DEFAULT_STORY_STATE)
  const [storyMetrics, setStoryMetrics] = useState({ harvests: 0 })

  const normalizePlot = (plot, idx) => ({
    id: plot?.id ?? idx,
    crop: plot?.crop ?? null,
    plantTime: plot?.plantTime ?? null,
    watered: Boolean(plot?.watered),
    fertilized: Boolean(plot?.fertilized),
    greenhouse: Boolean(plot?.greenhouse),
    ready: Boolean(plot?.ready),
    soilQuality: clamp(typeof plot?.soilQuality === 'number' ? plot.soilQuality : 70, 0, 100),
    disease: clamp(typeof plot?.disease === 'number' ? plot.disease : 0, 0, 100),
    restingDays: Math.max(0, plot?.restingDays ?? 0),
    lastCrop: plot?.lastCrop ?? null,
  })

  const normalizeBuildings = (raw = {}) => {
    const formatted = {}
    Object.entries(raw || {}).forEach(([key, value]) => {
      const def = BUILDINGS[key]
      if (!def) return

      if (typeof value === 'boolean') {
        if (value) {
          formatted[key] = { level: 1, modules: [] }
        }
        return
      }

      const level = clamp(typeof value?.level === 'number' ? value.level : (value ? 1 : 0), 0, def.levels.length)
      const modules = Array.isArray(value?.modules)
        ? value.modules.filter(id => def.modules.some(m => m.id === id))
        : []

      if (level > 0 || modules.length > 0) {
        formatted[key] = { level, modules }
      }
    })
    return formatted
  }

  const getBuildingLevel = useCallback((type) => buildings[type]?.level || 0, [buildings])
  const hasModule = useCallback((type, moduleId) => !!buildings[type]?.modules?.includes(moduleId), [buildings])

  const getWaterEnergyCost = useCallback(() => {
    const level = getBuildingLevel('sprinkler')
    if (!level) return 5
    return BUILDINGS.sprinkler.levels[level - 1]?.waterEnergyCost ?? 5
  }, [getBuildingLevel])

  const getPlantEnergyCost = useCallback(() => {
    const level = getBuildingLevel('sprinkler')
    if (!level) return 10
    return BUILDINGS.sprinkler.levels[level - 1]?.plantEnergyCost ?? 10
  }, [getBuildingLevel])

  const getSiloMultiplier = useCallback(() => {
    const level = getBuildingLevel('silo')
    if (!level) return 1
    return 1 + (BUILDINGS.silo.levels[level - 1]?.storageBonus || 0)
  }, [getBuildingLevel])

  const averageSoilQuality = useMemo(() => {
    if (!farm.length) return 0
    const total = farm.reduce((acc, plot) => acc + (plot.soilQuality || 0), 0)
    return Math.round(total / farm.length)
  }, [farm])

  const isRequirementMet = useCallback((req) => {
    switch (req.type) {
      case 'harvest':
        return (storyMetrics.harvests || 0) >= (req.target || 0)
      case 'buildingTotal':
        return Object.values(buildings).filter(b => (b?.level || 0) > 0).length >= (req.target || 0)
      case 'buildingLevel':
        return getBuildingLevel(req.building) >= (req.level || 0)
      case 'module':
        return hasModule(req.building, req.module)
      case 'soilQuality':
        return averageSoilQuality >= (req.target || 0)
      default:
        return false
    }
  }, [averageSoilQuality, buildings, getBuildingLevel, hasModule, storyMetrics])

  const evaluateStoryProgress = useCallback(() => {
    setStoryState(prev => {
      if (!prev.activeId) return prev
      const questIndex = STORY_QUESTS.findIndex(q => q.id === prev.activeId)
      const quest = STORY_QUESTS[questIndex]
      if (!quest) return prev
      if (prev.completed.includes(quest.id)) return prev

      const satisfied = quest.requirements.every(isRequirementMet)

      if (!satisfied) return prev

      if (quest.rewards?.money) setMoney(m => m + quest.rewards.money)
      if (quest.rewards?.fertilizer) setFertilizer(f => f + quest.rewards.fertilizer)
      addNotification(`劇情任務完成：${quest.title}！`)

      const nextQuest = STORY_QUESTS[questIndex + 1]
      if (nextQuest) {
        addNotification(`新任務解鎖：${nextQuest.title}`)
      }
      return {
        activeId: nextQuest?.id || null,
        completed: [...prev.completed, quest.id],
      }
    })
  }, [addNotification, isRequirementMet, setFertilizer, setMoney])

  useEffect(() => {
    evaluateStoryProgress()
  }, [evaluateStoryProgress])

  const activeQuest = useMemo(
    () => STORY_QUESTS.find(q => q.id === storyState.activeId),
    [storyState.activeId]
  )

  /** -------- 通知 ------- */
  const addNotification = useCallback((message) => {
    const id = Date.now() + Math.random()
    setNotifications(prev => [...prev, { id, message }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 3500)
  }, [])

  /** -------- 載入 / 存檔 -------- */
  useEffect(() => {
    const raw = localStorage.getItem('farm-save-v2')
    if (!raw) return
    try {
      const s = JSON.parse(raw)
      setMoney(s.money ?? 500)
      setEnergy(s.energy ?? 100)
      setLevel(s.level ?? 1)
      setExperience(s.experience ?? 0)
      setTime(s.time ?? 6)
      setDay(s.day ?? 1)
      setSeason(s.season ?? 'spring')
      setWeather(s.weather ?? 'sunny')
      setWeatherDuration(s.weatherDuration ?? 0)
      setInventory(s.inventory ?? inventory)
      setSeedBag(s.seedBag ?? seedBag)
      setFertilizer(s.fertilizer ?? 0)

      const loadedFarm = Array.isArray(s.farm) ? s.farm : farm
      const normalizedFarm = loadedFarm.map((p, idx) => normalizePlot(p, idx))
      const normalizedBuildings = normalizeBuildings(s.buildings ?? {})
      const greenhouseLevel = normalizedBuildings.greenhouse?.level || 0
      const farmWithGreenhouse = greenhouseLevel
        ? normalizedFarm.map(plot => ({ ...plot, greenhouse: true }))
        : normalizedFarm

      setFarm(farmWithGreenhouse)
      setAnimals((s.animals ?? []).map(animal => ({
        ...animal,
        happiness: clamp(typeof animal?.happiness === 'number' ? animal.happiness : 50, 0, 100),
      })))
      setBuildings(normalizedBuildings)
      setMarket(s.market ?? market)
      setSpeed(s.speed ?? 1)
      setStoryState(s.storyState ? {
        activeId: s.storyState.activeId && STORY_QUESTS.some(q => q.id === s.storyState.activeId)
          ? s.storyState.activeId
          : DEFAULT_STORY_STATE.activeId,
        completed: Array.isArray(s.storyState.completed) ? s.storyState.completed : [],
      } : DEFAULT_STORY_STATE)
      setStoryMetrics({
        harvests: s.storyMetrics?.harvests ?? 0,
      })
      addNotification('讀取存檔完成')
    } catch(e) {
      console.error(e)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 簡單去抖保存
  useEffect(() => {
    const id = setTimeout(() => {
      const s = {
        money, energy, level, experience, time, day, season, weather, weatherDuration,
        inventory, seedBag, fertilizer, farm, animals, buildings, market, speed, storyState, storyMetrics
      }
      localStorage.setItem('farm-save-v2', JSON.stringify(s))
    }, 400)
    return () => clearTimeout(id)
  }, [money, energy, level, experience, time, day, season, weather, weatherDuration, inventory, seedBag, fertilizer, farm, animals, buildings, market, speed, storyState, storyMetrics])

  /** -------- 天氣系統 -------- */
  useEffect(() => {
    const weatherTimer = setInterval(() => {
      setWeatherDuration(prev => {
        if (prev <= 0) {
          const newWeather = WEATHER_TYPES[Math.floor(Math.random() * WEATHER_TYPES.length)]
          setWeather(newWeather)
          addNotification(`天氣變為 ${getWeatherName(newWeather)} ${getWeatherIcon(newWeather)}`)

          // 暴風雨損害
          if (newWeather === 'storm') {
            setFarm(prev => prev.map(plot => {
              if (plot.crop && !plot.greenhouse && Math.random() < 0.3) {
                addNotification(`${CROPS[plot.crop].emoji} 在暴風雨中受損！`)
                return { ...plot, crop: null, plantTime: null, watered: false, fertilized: false, ready: false }
              }
              return plot
            }))
          }
          return int(rand(3,10)) // 3-10 小時
        }
        return prev - 1
      })
    }, 30000 / speed) // 隨速度縮放

    return () => clearInterval(weatherTimer)
  }, [addNotification, speed])

  /** -------- 時間系統（20s=1h，受 speed 影響） -------- */
  useEffect(() => {
    const msPerHour = 20000 / speed
    const timer = setInterval(() => {
      setTime(prev => {
        const newTime = prev + 1
        if (newTime >= 24) {
          // 新的一天
          setDay(prevDay => {
            const newDay = prevDay + 1

            // 每 30 天換季
            if (newDay % 30 === 0) {
              const idx = SEASONS.indexOf(season)
              const next = SEASONS[(idx + 1) % SEASONS.length]
              setSeason(next)
              addNotification(`季節變為 ${getSeasonName(next)}！`)
            }

            // 每天刷新市場價格
            setMarket(prev => {
              const next = {}
              for (const k of Object.keys(CROPS)) {
                let base = rand(0.85, 1.25)
                // 季節微調
                if (season === 'spring' && (k==='strawberry' || k==='wheat')) base += 0.05
                if (season === 'winter' && (k==='tomato' || k==='corn')) base -= 0.05
                next[k] = clamp(base, 0.75, 1.35)
              }
              return next
            })

            return newDay
          })

          // 重置體力
          setEnergy(100)

          // 動物每日收入 & 情緒變化
          setAnimals(prev => prev.map(animal => {
            const shelter = ANIMALS[animal.type].shelter
            const shelterLevel = getBuildingLevel(shelter)
            const levelConfig = shelterLevel ? BUILDINGS[shelter].levels[shelterLevel - 1] : null
            const boost = levelConfig?.boost ?? 1
            const income = int(ANIMALS[animal.type].income * boost * (animal.happiness / 100))
            if (animal.happiness > 20 && income > 0) {
              setMoney(m => m + income)
              addNotification(`${animal.name} 產生了 $${income}！`)
            }
            let nextHappiness = Math.max(0, animal.happiness - 12)
            if (shelter === 'barn' && hasModule('barn', 'autoGroomer') && shelterLevel) {
              nextHappiness = clamp(nextHappiness + 8, 0, 100)
            }
            return { ...animal, happiness: nextHappiness }
          }))

          // 每日風車收入
          const windmillLevel = getBuildingLevel('windmill')
          if (windmillLevel) {
            const income = BUILDINGS.windmill.levels[windmillLevel - 1]?.income || 0
            if (income > 0) {
              setMoney(m => m + income)
              addNotification(`🌪️ 風車產生了 $${income}！`)
            }
          }

          // 自動澆灌與土壤調整
          const sprinklerLevel = getBuildingLevel('sprinkler')
          const sprinklerConfig = sprinklerLevel ? BUILDINGS.sprinkler.levels[sprinklerLevel - 1] : null
          const greenhouseLevelNow = getBuildingLevel('greenhouse')
          const greenhouseConfig = greenhouseLevelNow ? BUILDINGS.greenhouse.levels[greenhouseLevelNow - 1] : null

          setFarm(prev => prev.map(plot => {
            const resting = plot.crop ? 0 : plot.restingDays + 1
            const repeated = plot.lastCrop && plot.lastCrop === plot.crop && plot.crop
            const baseDecay = plot.crop ? 4 + (repeated ? 4 : 0) : -3
            const adjustedDecay = baseDecay * (1 - (greenhouseConfig?.soilDecayReduction || 0))
            const soilQuality = clamp(plot.soilQuality - adjustedDecay, 0, 100)
            const diseaseDelta = plot.crop
              ? (repeated ? 10 : 4)
              : -8
            const disease = clamp(plot.disease + diseaseDelta, 0, 100)

            let watered = plot.watered
            if (plot.crop && sprinklerConfig?.autoMorningWater) {
              watered = true
            }
            if (plot.crop && plot.greenhouse && hasModule('greenhouse', 'mistSystem')) {
              watered = true
            }

            return {
              ...plot,
              watered,
              soilQuality,
              disease,
              restingDays: resting,
            }
          }))

          return 6 // 早上 6 點
        }
        return newTime
      })
    }, msPerHour)

    return () => clearInterval(timer)
  }, [addNotification, buildings, getBuildingLevel, hasModule, season, speed])

  /** -------- 作物成長（每 5s 檢查一次，受 weather / 溫室 / 施肥） -------- */
  useEffect(() => {
    const growTimer = setInterval(() => {
      setFarm(prev => prev.map(plot => {
        if (plot.crop && plot.plantTime) {
          const now = Date.now()
          const crop = CROPS[plot.crop]

          // 天氣與溫室
          let mult = 1
          if (plot.greenhouse) {
            mult *= 1.2
          } else {
            mult *= (crop.weatherBonus[weather] || 1)
            // 雨天自動澆水（不可直接 mutate）
            if (weather === 'rainy' && !plot.watered) {
              return { ...plot, watered: true }
            }
          }
          // 施肥（加速）
          if (plot.fertilized) mult *= 1.25

          const soilBonus = clamp((plot.soilQuality - 70) / 150, -0.4, 0.6)
          mult *= 1 + soilBonus
          const diseasePenalty = clamp(1 - (plot.disease || 0) / 160, 0.4, 1)
          mult *= diseasePenalty
          if (plot.greenhouse && hasModule('greenhouse', 'mistSystem')) {
            mult *= 1.05
          }

          const needMs = (crop.growTime * 60000) / mult
          if (!plot.ready && now - plot.plantTime >= needMs) {
            addNotification(`${crop.emoji} ${crop.name} 成熟了！`)
            return { ...plot, ready: true }
          }
        }
        return plot
      }))
    }, 5000 / speed)

    return () => clearInterval(growTimer)
  }, [addNotification, hasModule, speed, weather])

  /** -------- 升級 -------- */
  useEffect(() => {
    const need = level * 100
    if (experience >= need) {
      setLevel(l => l + 1)
      setExperience(e => e - need)
      addNotification(`🎉 升級到等級 ${level + 1}！`)
    }
  }, [experience, level, addNotification])

  /** -------- 名稱/圖示 -------- */
  const getWeatherName = (t) => ({ sunny:'晴天', rainy:'雨天', cloudy:'陰天', storm:'暴風雨', snow:'雪天' }[t] || '晴天')
  const getSeasonName  = (s) => ({ spring:'春天', summer:'夏天', autumn:'秋天', winter:'冬天' }[s] || '春天')
  const getWeatherIcon = (t=weather) => (t==='rainy'?'🌧️':t==='cloudy'?'☁️':t==='storm'?'⛈️':t==='snow'?'❄️':'☀️')
  const getTimeIcon = () => (time>=6 && time<18 ? <Sun className="w-5 h-5 text-yellow-400"/> : <Moon className="w-5 h-5 text-blue-300"/>)
  const getSeasonColor = () => (
    season==='spring' ? 'from-green-300 via-yellow-200 to-green-400' :
    season==='summer' ? 'from-blue-300 via-yellow-300 to-green-500' :
    season==='autumn' ? 'from-orange-300 via-red-300 to-yellow-400' :
                        'from-blue-100 via-white to-blue-300'
  )
  const isNight = time < 6 || time >= 18

  /** -------- 操作：商店/農事/動物/建築 -------- */
  const buySeed = (seedType) => {
    const price = CROPS[seedType].price
    if (money < price) return addNotification('金錢不足！')
    setMoney(m => m - price)
    setSeedBag(b => ({ ...b, [seedType]: (b[seedType]||0) + 1 }))
    setSelectedSeed(seedType)
    setShowShop(false)
    addNotification(`購買了 ${CROPS[seedType].name} 種子！`)
  }

  const plantSeed = (plotId) => {
    if (!selectedSeed) return
    if (seedBag[selectedSeed] <= 0) return addNotification('該種子庫存不足！')
    const plot = farm.find(p => p.id === plotId)
    if (!plot || plot.crop) return
    const energyCost = getPlantEnergyCost()
    if (energy < energyCost) return addNotification('體力不足！')

    if (plot.lastCrop === selectedSeed && plot.restingDays < 2) {
      addNotification('這塊土地剛種過相同作物，肥力下降較快！')
    }
    if (plot.soilQuality < 40) {
      addNotification('土地肥力偏低，作物可能生長較慢。')
    }
    if (plot.disease > 60) {
      addNotification('此地塊病蟲害嚴重，建議先休耕或輪作。')
    }

    setFarm(prev => prev.map(p =>
      p.id === plotId && !p.crop
        ? { ...p, crop: selectedSeed, plantTime: Date.now(), watered: false, fertilized: false, ready:false, restingDays: 0 }
        : p
    ))
    setSeedBag(b => ({ ...b, [selectedSeed]: b[selectedSeed]-1 }))
    setEnergy(e => clamp(e - energyCost, 0, 100))
    setExperience(e => e + 5)
    addNotification(`種植了 ${CROPS[selectedSeed].name}！`)
  }

  const fertilizePlot = (plotId) => {
    if (fertilizer <= 0) return addNotification('沒有肥料！')
    if (energy < 5) return addNotification('體力不足！')
    setFarm(prev => prev.map(p =>
      p.id === plotId && p.crop && !p.fertilized
        ? {
            ...p,
            fertilized: true,
            soilQuality: clamp(p.soilQuality + 6, 0, 100),
            disease: clamp(p.disease - 4, 0, 100),
          }
        : p
    ))
    setFertilizer(f => f - 1)
    setEnergy(e => clamp(e - 5, 0, 100))
    addNotification('施肥完成（加速成長、提高賣價）！')
  }

  const harvestCrop = (plotId) => {
    const plot = farm.find(p => p.id === plotId)
    if (!plot || !plot.ready) return
    const crop = plot.crop
    const data = CROPS[crop]

    let bonus = 1
    if (plot.watered) bonus *= 1.2
    if (plot.fertilized) bonus *= 1.3
    const greenhouseLevel = getBuildingLevel('greenhouse')
    if (plot.greenhouse) {
      const greenhouseBonus = greenhouseLevel ? 1.1 + greenhouseLevel * 0.05 : 1.15
      bonus *= greenhouseBonus
    }
    bonus *= getSiloMultiplier()
    if (!plot.greenhouse) bonus *= (data.weatherBonus[weather] || 1)
    if (hasModule('windmill', 'powerGrid')) bonus *= 1.05
    const soilYield = clamp(1 + (plot.soilQuality - 70) / 180, 0.7, 1.45)
    bonus *= soilYield
    const diseasePenalty = clamp(1 - (plot.disease || 0) / 140, 0.5, 1)
    bonus *= diseasePenalty
    bonus *= (market[crop] || 1) // 市場價格

    const sellPrice = int(data.sellPrice * bonus)

    setMoney(m => m + sellPrice)
    setInventory(inv => ({ ...inv, [crop]: inv[crop] + 1 }))
    setExperience(e => e + 10)
    const greenhouseConfig = greenhouseLevel
      ? BUILDINGS.greenhouse.levels[greenhouseLevel - 1]
      : null
    setFarm(prev => prev.map(p => {
      if (p.id !== plotId) return p
      const rotationPenalty = p.lastCrop === crop ? 8 : 5
      const relief = p.fertilized ? 4 : 0
      const soilDecay = (rotationPenalty - relief) * (1 - (greenhouseConfig?.soilDecayReduction || 0))
      const newSoil = clamp(p.soilQuality - soilDecay, 0, 100)
      const disease = clamp(p.disease + (p.lastCrop === crop ? 14 : 6) - (p.fertilized ? 4 : 0), 0, 100)
      return {
        ...p,
        crop: null,
        plantTime: null,
        watered: false,
        fertilized: false,
        ready: false,
        soilQuality: newSoil,
        disease,
        lastCrop: crop,
        restingDays: 0,
      }
    }))
    setStoryMetrics(prev => ({ ...prev, harvests: (prev.harvests || 0) + 1 }))
    addNotification(`收成 ${data.emoji}，收入 $${sellPrice}`)
  }

  const waterPlot = (plotId) => {
    const energyCost = getWaterEnergyCost()
    if (energy < energyCost) return addNotification('體力不足！')
    let autoFertilized = false
    let canAutoFertilize = hasModule('sprinkler', 'fertInjector') && fertilizer > 0
    setFarm(prev => prev.map(p =>
      p.id === plotId && p.crop && !p.watered
        ? {
            ...p,
            watered: true,
            fertilized: p.fertilized || (canAutoFertilize ? (autoFertilized = true) : false),
          }
        : p
    ))
    if (autoFertilized) {
      setFertilizer(f => Math.max(0, f - 1))
      addNotification('灑水器自動施肥完成！')
    }
    setEnergy(e => clamp(e - energyCost, 0, 100))
    addNotification('澆水完成！')
  }

  const buyAnimal = (animalType) => {
    const price = ANIMALS[animalType].price
    if (money < price) return addNotification('金錢不足！')
    setMoney(m => m - price)
    setAnimals(prev => [...prev, {
      id: Date.now()+Math.random(), type: animalType,
      happiness: ANIMALS[animalType].happiness,
      name: ANIMALS[animalType].name + (prev.filter(a => a.type === animalType).length + 1)
    }])
    setShowAnimalShop(false)
    addNotification(`購買了 ${ANIMALS[animalType].emoji} ${ANIMALS[animalType].name}！`)
  }

  const upgradeBuilding = (buildingType) => {
    const info = BUILDINGS[buildingType]
    if (!info) return
    const currentLevel = getBuildingLevel(buildingType)
    if (currentLevel >= info.levels.length) return addNotification('已達最高等級！')
    const nextLevel = info.levels[currentLevel]
    if (!nextLevel) return
    if (money < nextLevel.cost) return addNotification('金錢不足！')

    setMoney(m => m - nextLevel.cost)
    setBuildings(prev => {
      const prevData = prev[buildingType] || { level: 0, modules: [] }
      const updated = {
        ...prev,
        [buildingType]: {
          level: currentLevel + 1,
          modules: prevData.modules || [],
        },
      }
      return updated
    })

    if (buildingType === 'greenhouse') {
      setFarm(prev => prev.map(p => ({ ...p, greenhouse: true })))
    }

    setShowBuildingShop(false)
    addNotification(`${currentLevel ? '升級' : '建造'} ${info.emoji} ${info.name}（Lv.${currentLevel + 1}）！`)
  }

  const purchaseModule = (buildingType, moduleId) => {
    const info = BUILDINGS[buildingType]
    if (!info) return
    const moduleInfo = info.modules.find(m => m.id === moduleId)
    if (!moduleInfo) return
    const level = getBuildingLevel(buildingType)
    if (!level) return addNotification('請先建造並升級此建築！')
    if (level < (moduleInfo.requirementLevel || 1)) {
      return addNotification('需要更高等級才能安裝此模組！')
    }
    if (hasModule(buildingType, moduleId)) {
      return addNotification('已安裝此模組！')
    }
    if (money < moduleInfo.cost) return addNotification('金錢不足！')

    setMoney(m => m - moduleInfo.cost)
    setBuildings(prev => {
      const prevData = prev[buildingType] || { level: level, modules: [] }
      const modules = [...new Set([...(prevData.modules || []), moduleId])]
      return {
        ...prev,
        [buildingType]: {
          level: prevData.level || level,
          modules,
        },
      }
    })
    addNotification(`安裝了 ${moduleInfo.name}！`)
  }

  const feedAnimal = (animalId) => {
    setAnimals(prev => prev.map(a => {
      if (a.id !== animalId) return a
      const cost = ANIMALS[a.type].foodCost
      if (money < cost) return a
      setMoney(m => m - cost)
      addNotification(`餵食了 ${a.name}！快樂度 +25`)
      return { ...a, happiness: clamp(a.happiness + 25, 0, 100) }
    }))
  }

  // 肥料商店（每包 $40）
  const buyFertilizer = (qty=1) => {
    const cost = 40 * qty
    if (money < cost) return addNotification('金錢不足！')
    setMoney(m => m - cost)
    setFertilizer(f => f + qty)
    addNotification(`購買肥料 x${qty}`)
  }

  // 農地擴建（一次 +5 格，價格逐次增加）
  const expansionCost = useMemo(() => 300 + int((farm.length - 25) / 5) * 150, [farm.length])
  const expandFarm = () => {
    if (money < expansionCost) return addNotification('金錢不足！')
    setMoney(m => m - expansionCost)
    setFarm(prev => [
      ...prev,
      ...Array(5).fill().map((_, i) => ({
        id: prev.length + i,
        crop:null,
        plantTime:null,
        watered:false,
        fertilized:false,
        greenhouse: getBuildingLevel('greenhouse') > 0,
        ready:false,
        soilQuality: 70,
        disease: 0,
        restingDays: 0,
        lastCrop: null,
      }))
    ])
    addNotification('擴建農地 +5 格！')
  }

  /** --------- UI 輔助 --------- */
  const xpPercent = clamp((experience % (level*100)) / (level*100) * 100, 0, 100)

  /** --------- Render --------- */
  return (
    <div className={`min-h-screen transition-all duration-1000 ${
      isNight ? 'bg-gradient-to-b from-indigo-900 via-purple-900 to-black' : `bg-gradient-to-b ${getSeasonColor()}`
    }`}>

      {/* 天氣效果（雨/雪） */}
      {weather === 'rainy' && (
        <div className="fixed inset-0 pointer-events-none z-10">
          {Array.from({length: 80}).map((_, i) => (
            <div key={i} className="absolute animate-pulse"
              style={{ left:`${Math.random()*100}%`, top:`${Math.random()*100}%`, animationDelay:`${Math.random()*2}s` }}>
              💧
            </div>
          ))}
        </div>
      )}
      {weather === 'snow' && (
        <div className="fixed inset-0 pointer-events-none z-10">
          {Array.from({length: 50}).map((_, i) => (
            <div key={i} className="absolute animate-bounce"
              style={{ left:`${Math.random()*100}%`, top:`${Math.random()*100}%`, animationDelay:`${Math.random()*3}s` }}>
              ❄️
            </div>
          ))}
        </div>
      )}

      {/* 通知 */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(n => (
          <div key={n.id} className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg max-w-xs">
            {n.message}
          </div>
        ))}
      </div>

      {/* 狀態列 */}
      <div className="flex flex-wrap gap-3 justify-between items-center p-4 bg-black bg-opacity-30 text-white relative z-20">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1">
            <Coins className="w-5 h-5 text-yellow-400"/><span className="font-bold">${money}</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-5 h-5 text-blue-400"/><span>{energy}/100</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400"/><span>等級 {level}</span>
            <div className="bg-gray-600 rounded-full h-2 w-28">
              <div className="bg-yellow-400 h-2 rounded-full transition-all" style={{ width: `${xpPercent}%` }}/>
            </div>
          </div>
          {/* 時間倍率 */}
          <div className="flex items-center gap-2 ml-2">
            <span className="text-sm opacity-80">速度</span>
            {[1,2,4].map(s => (
              <button key={s}
                onClick={()=>setSpeed(s)}
                className={`px-2 py-1 text-sm rounded ${speed===s?'bg-amber-400 text-black':'bg-gray-700'}`}>
                x{s}
              </button>
            ))}
          </div>
          <button
            onClick={()=>setShowQuestModal(true)}
            className="ml-3 flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-black px-3 py-1 rounded text-sm"
          >
            <ScrollText className="w-4 h-4"/>
            <span>{activeQuest ? activeQuest.title : '劇情任務'}</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">{getTimeIcon()}<span>{time}:00</span></div>
          <div className="flex items-center gap-1"><span>{getWeatherIcon()}</span><span className="text-sm">{getWeatherName(weather)}</span></div>
          <span className="capitalize text-sm">{getSeasonName(season)}</span>
          <span className="text-sm">第{day}天</span>
          <div className="flex items-center gap-1 text-sm text-green-100">
            <Seedling className="w-4 h-4 text-green-200"/>
            <span>平均肥力 {averageSoilQuality}</span>
          </div>
        </div>
      </div>

      {/* 主區域 */}
      <div className="p-4 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* 農場 */}
          <div className="lg:col-span-3 bg-white/90 rounded-lg p-4 shadow-lg">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Home className="mr-2"/>我的農場 - {getSeasonName(season)} {getWeatherName(weather)}
            </h2>

            {/* 價格面板 */}
            <div className="mb-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {Object.keys(CROPS).map(k => (
                <div key={k} className="bg-amber-50 border border-amber-200 rounded p-2 text-xs flex items-center justify-between">
                  <div>{CROPS[k].emoji} {CROPS[k].name}</div>
                  <div className={`font-semibold ${market[k]>1?'text-green-600':'text-red-600'}`}>
                    x{market[k].toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* 地塊 */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {farm.map(plot => (
                <div key={plot.id}
                  className={`aspect-square border-2 rounded-lg cursor-pointer transition-all duration-300 hover:scale-105 relative ${
                    plot.greenhouse ? 'border-green-600 bg-green-50' :
                    plot.crop ? (plot.ready ? 'bg-green-200 border-green-400 animate-pulse'
                                            : 'bg-yellow-100 border-yellow-400')
                              : 'bg-gray-100 border-gray-300 hover:bg-green-50'
                  } ${plot.soilQuality < 35 ? 'border-red-400' : plot.soilQuality > 85 ? 'border-emerald-500' : ''}`}
                  onClick={()=>{
                    if (plot.crop && plot.ready) harvestCrop(plot.id)
                    else if (!plot.crop && selectedSeed) plantSeed(plot.id)
                    else if (plot.crop && !plot.watered) waterPlot(plot.id)
                  }}
                  onContextMenu={(e)=>{
                    e.preventDefault()
                    if (plot.crop && !plot.fertilized) fertilizePlot(plot.id)
                  }}
                >
                  <div className="h-full flex flex-col items-center justify-center text-2xl">
                    <div className="absolute top-1 left-1 text-[10px] font-semibold bg-white/70 text-amber-700 px-1 rounded">
                      肥 {Math.round(plot.soilQuality)}
                    </div>
                    <div className="absolute top-1 right-1 flex flex-col items-end gap-1 text-[10px]">
                      {plot.greenhouse && <span className="bg-green-200 text-green-700 px-1 rounded">🏢</span>}
                      {plot.disease > 5 && (
                        <span className={`px-1 rounded ${plot.disease > 70 ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700'}`}>
                          病 {Math.round(plot.disease)}
                        </span>
                      )}
                    </div>
                    {plot.crop ? (
                      <>
                        <div className={`transform transition-transform duration-500 ${plot.ready ? 'scale-125 animate-bounce':'scale-100'}`}>
                          {CROPS[plot.crop].emoji}
                        </div>
                        <div className="flex absolute bottom-1 left-0 right-0 justify-center gap-1 text-xs">
                          {plot.watered && <Droplets className="w-3 h-3 text-blue-400" />}
                          {plot.fertilized && <Leaf className="w-3 h-3 text-green-600" />}
                        </div>
                      </>
                    ) : (
                      selectedSeed && <div className="text-gray-400">+</div>
                    )}
                    {!plot.crop && plot.restingDays > 0 && (
                      <div className="absolute bottom-1 left-1 text-[10px] text-gray-600 bg-white/70 px-1 rounded">
                        休耕 {plot.restingDays}天
                      </div>
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
                  {Object.keys(buildings).map(t => (
                    <div key={t} className="bg-blue-100 rounded-lg p-2 flex items-center gap-2">
                      <span className="text-2xl">{BUILDINGS[t].emoji}</span>
                      <span className="text-sm font-semibold">{BUILDINGS[t].name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 動物區域 */}
            {animals.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-bold mb-3">我的動物們</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {animals.map(a=>{
                    const shelter = ANIMALS[a.type].shelter
                    const shelterLevel = getBuildingLevel(shelter)
                    const levelInfo = shelterLevel ? BUILDINGS[shelter].levels[shelterLevel - 1] : null
                    const hasShelter = shelterLevel > 0
                    const daily = int(ANIMALS[a.type].income * (levelInfo?.boost ?? 1))
                    return (
                      <div key={a.id}
                        className={`rounded-lg p-3 cursor-pointer transition-colors relative ${
                          hasShelter?'bg-green-100 hover:bg-green-200':'bg-blue-100 hover:bg-blue-200'
                        }`}
                        onClick={()=>feedAnimal(a.id)}
                      >
                        {hasShelter && (
                          <div className="absolute top-1 right-1 text-xs">
                            {BUILDINGS[shelter].emoji} Lv.{shelterLevel}
                          </div>
                        )}
                        <div className="text-center">
                          <div className="text-3xl mb-2 animate-bounce">{ANIMALS[a.type].emoji}</div>
                          <div className="text-sm font-semibold">{a.name}</div>
                          <div className="flex items-center justify-center mt-1">
                            <Heart className="w-3 h-3 text-red-400 mr-1"/><span className="text-xs">{a.happiness}/100</span>
                          </div>
                          <div className="bg-gray-200 rounded-full h-1 mt-1">
                            <div className="bg-red-400 h-1 rounded-full transition-all" style={{width:`${a.happiness}%`}}/>
                          </div>
                          <div className="text-xs text-green-700 mt-1">日收入: ${daily}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 側邊欄 */}
          <div className="space-y-4">
            {/* 商店與操作 */}
            <div className="bg-white/90 rounded-lg p-4 shadow-lg">
              <h3 className="text-lg font-bold mb-3">商店 / 操作</h3>
              <div className="space-y-2">
                <button onClick={()=>setShowShop(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded flex items-center justify-center">
                  <Sprout className="mr-2 w-4 h-4"/> 種子商店
                </button>
                <button onClick={()=>setShowAnimalShop(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded">🐾 動物商店</button>
                <button onClick={()=>setShowBuildingShop(true)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded flex items-center justify-center">
                  <Building className="mr-2 w-4 h-4"/> 建築商店
                </button>

                <div className="h-px bg-gray-200 my-2"/>

                <div className="flex items-center justify-between">
                  <div className="text-sm">肥料：{fertilizer} 包</div>
                  <div className="flex gap-2">
                    <button onClick={()=>buyFertilizer(1)} className="px-2 py-1 text-sm bg-amber-500 text-white rounded flex items-center gap-1">
                      <Leaf className="w-4 h-4"/>+1
                    </button>
                    <button onClick={()=>buyFertilizer(5)} className="px-2 py-1 text-sm bg-amber-600 text-white rounded">+5</button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">擴建農地 (+5)：${expansionCost}</div>
                  <button onClick={expandFarm} className="px-3 py-1 text-sm bg-teal-600 text-white rounded flex items-center gap-1">
                    <Factory className="w-4 h-4"/><ChevronRight className="w-4 h-4"/>
                  </button>
                </div>
              </div>
            </div>

            {/* 種子庫存 + 選擇 */}
            <div className="bg-white/90 rounded-lg p-4 shadow-lg">
              <h3 className="text-lg font-bold mb-3">種子庫存</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(CROPS).map(k=>(
                  <button key={k}
                    onClick={()=> seedBag[k]>0 ? setSelectedSeed(k) : addNotification('該種子庫存為 0')}
                    className={`border rounded p-2 text-sm flex items-center justify-between
                      ${selectedSeed===k ? 'bg-green-100 border-green-400' : 'hover:bg-gray-50'}`}>
                    <span className="flex items-center gap-2"><span className="text-lg">{CROPS[k].emoji}</span>{CROPS[k].name}</span>
                    <span className="font-semibold">x{seedBag[k]||0}</span>
                  </button>
                ))}
              </div>
              {selectedSeed && (
                <div className="mt-3 text-sm text-yellow-800 bg-yellow-100 border border-yellow-300 rounded p-2">
                  已選擇：{CROPS[selectedSeed].name}（庫存 {seedBag[selectedSeed]}）
                </div>
              )}
            </div>

            {/* 成品庫存 */}
            <div className="bg-white/90 rounded-lg p-4 shadow-lg">
              <h3 className="text-lg font-bold mb-3">成品庫存</h3>
              {Object.entries(inventory).some(([_,c])=>c>0) ? (
                Object.entries(inventory).map(([k,c]) => c>0 && (
                  <div key={k} className="flex justify-between items-center py-1">
                    <span>{CROPS[k].emoji} {CROPS[k].name}</span>
                    <span className="font-semibold">{c}</span>
                  </div>
                ))
              ) : <p className="text-gray-500 text-sm">庫存為空</p>}
            </div>

            {/* 天氣資訊 */}
            <div className="bg-white/90 rounded-lg p-4 shadow-lg">
              <h3 className="text-lg font-bold mb-3">天氣資訊</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>當前天氣:</span>
                  <span>{getWeatherIcon()} {getWeatherName(weather)}</span>
                </div>
                <div className="text-gray-600">
                  {weather==='rainy' && '🌱 作物自動澆水'}
                  {weather==='sunny' && '☀️ 大部分作物成長加速'}
                  {weather==='storm' && '⚠️ 作物可能受損'}
                  {weather==='snow' && '❄️ 作物成長緩慢'}
                  {weather==='cloudy' && '☁️ 普通天氣'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === 種子商店 === */}
      {showShop && (
        <Modal title="種子商店" onClose={()=>setShowShop(false)}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(CROPS).map(([key, crop]) => (
              <div key={key} className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                   onClick={()=>buySeed(key)}>
                <div className="text-center">
                  <div className="text-3xl mb-2">{crop.emoji}</div>
                  <div className="font-semibold">{crop.name}</div>
                  <div className="text-green-600 font-bold">${crop.price}</div>
                  <div className="text-xs text-gray-500">成長: {crop.growTime} 分</div>
                  <div className="text-xs text-blue-600">售價: ${crop.sellPrice}</div>
                  <div className="text-xs text-purple-600 mt-1">
                    今日價格係數: x{(market[key]||1).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* === 動物商店 === */}
      {showAnimalShop && (
        <Modal title="動物商店" onClose={()=>setShowAnimalShop(false)}>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(ANIMALS).map(([key, a]) => (
              <div key={key} className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                   onClick={()=>buyAnimal(key)}>
                <div className="text-center">
                  <div className="text-3xl mb-2">{a.emoji}</div>
                  <div className="font-semibold">{a.name}</div>
                  <div className="text-green-600 font-bold">${a.price}</div>
                  <div className="text-xs text-gray-500">餵食費用: ${a.foodCost}/天</div>
                  <div className="text-xs text-blue-600">日收入: ${a.income}</div>
                  <div className="text-xs text-purple-600">需要: {BUILDINGS[a.shelter]?.name || '無'}</div>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* === 建築商店 === */}
      {showBuildingShop && (
        <Modal title="建築商店" onClose={()=>setShowBuildingShop(false)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
            {Object.entries(BUILDINGS).map(([key, b]) => {
              const owned = buildings[key]
              const currentLevel = owned?.level || 0
              const currentConfig = currentLevel ? b.levels[currentLevel - 1] : null
              const nextConfig = b.levels[currentLevel] || null
              const modulesOwned = owned?.modules || []
              return (
                <div key={key}
                     className={`border rounded-lg p-4 transition-colors ${currentLevel ? 'bg-green-50 border-green-400' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl">{b.emoji}</div>
                      <div className="font-semibold mt-1">{b.name}</div>
                    </div>
                    <div className="text-right text-xs">
                      <div>等級 {currentLevel}/{b.levels.length}</div>
                      {modulesOwned.length > 0 && (
                        <div className="text-green-600">模組: {modulesOwned.length}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mt-2">{currentConfig?.description || b.description}</div>
                  {nextConfig && (
                    <div className="text-xs text-purple-700 mt-1">下一階段：{nextConfig.description}</div>
                  )}
                  <button
                    className={`mt-3 w-full px-3 py-2 rounded text-sm font-semibold ${nextConfig ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
                    onClick={()=> nextConfig && upgradeBuilding(key)}
                    disabled={!nextConfig}
                  >
                    {nextConfig ? `${currentLevel ? '升級' : '建造'} - $${nextConfig.cost}` : '已達最高等級'}
                  </button>
                  {b.modules.length > 0 && (
                    <div className="mt-3 pt-3 border-t text-left space-y-2">
                      <div className="text-xs font-semibold text-gray-700">模組化插件</div>
                      {b.modules.map(mod => {
                        const installed = modulesOwned.includes(mod.id)
                        const requirementMet = currentLevel >= (mod.requirementLevel || 1)
                        return (
                          <div key={mod.id} className="bg-white/70 rounded p-2 text-xs flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">{mod.name}</span>
                              <button
                                className={`px-2 py-1 rounded ${installed ? 'bg-green-200 text-green-700 cursor-not-allowed' : requirementMet ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                                onClick={()=> !installed && requirementMet && purchaseModule(key, mod.id)}
                                disabled={installed || !requirementMet}
                              >
                                {installed ? '已安裝' : `$${mod.cost}`}
                              </button>
                            </div>
                            <div className="text-[11px] text-gray-600">{mod.description}</div>
                            {!requirementMet && !installed && (
                              <div className="text-[11px] text-red-500">需要等級 {mod.requirementLevel}</div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Modal>
      )}

      {showQuestModal && (
        <Modal title="農場故事任務" onClose={()=>setShowQuestModal(false)}>
          <div className="space-y-4">
            {activeQuest ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-amber-700 flex items-center gap-2">
                  <ScrollText className="w-5 h-5"/> {activeQuest.title}
                </h3>
                <p className="text-sm text-amber-900 mt-1">{activeQuest.description}</p>
                <div className="mt-3 space-y-2">
                  {activeQuest.requirements.map((req, idx) => {
                    const met = isRequirementMet(req)
                    let progress = ''
                    if (req.type === 'harvest') progress = `${Math.min(storyMetrics.harvests, req.target)}/${req.target}`
                    if (req.type === 'buildingTotal') {
                      const count = Object.values(buildings).filter(b => (b?.level || 0) > 0).length
                      progress = `${Math.min(count, req.target)}/${req.target}`
                    }
                    if (req.type === 'buildingLevel') progress = `Lv.${getBuildingLevel(req.building)}/${req.level}`
                    if (req.type === 'module') progress = hasModule(req.building, req.module) ? '已安裝' : '未安裝'
                    if (req.type === 'soilQuality') progress = `${averageSoilQuality}/${req.target}`
                    return (
                      <div key={idx} className={`flex items-center justify-between rounded px-3 py-2 text-sm ${met ? 'bg-green-100 text-green-700' : 'bg-white'}`}>
                        <span>{req.description}</span>
                        <span className="text-xs text-gray-600">{progress}</span>
                      </div>
                    )
                  })}
                </div>
                {activeQuest.rewards && (
                  <div className="mt-3 text-xs text-amber-800">
                    獎勵：
                    {activeQuest.rewards.money ? `金錢 +${activeQuest.rewards.money} ` : ''}
                    {activeQuest.rewards.fertilizer ? `肥料 +${activeQuest.rewards.fertilizer}` : ''}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
                所有故事任務皆已完成！保持農場的蓬勃發展吧。
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold text-gray-600 mb-2">已完成任務</h4>
              {storyState.completed.length > 0 ? (
                <ul className="space-y-1 text-sm text-gray-700">
                  {storyState.completed.map(id => {
                    const quest = STORY_QUESTS.find(q => q.id === id)
                    return <li key={id}>✅ {quest?.title || id}</li>
                  })}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">尚未完成任何劇情任務。</p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

/** Modal 小元件 */
function Modal({title, children, onClose}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[90vw] max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="px-3 py-1 bg-gray-600 text-white rounded">關閉</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default FarmGame
