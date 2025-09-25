export const BASE_FARM_PLOTS = 25;
export const FARM_EXPANSION_BATCH = 1;
export const MAX_FARM_PLOTS = 45;
export const BASE_ANIMAL_CAPACITY = 6;
export const ANIMAL_CAPACITY_STEP = 1;
export const MAX_ANIMAL_CAPACITY = 24;
export const ANIMAL_MIN_BUTCHER_AGE_DAYS = 3;

export const getFarmExpansionCost = (currentPlotCount) => {
  if (currentPlotCount >= MAX_FARM_PLOTS) {
    return null;
  }
  const expansionsPurchased = Math.max(0, currentPlotCount - BASE_FARM_PLOTS);
  return 1000 + (expansionsPurchased * 250);
};

export const getAnimalHousingExpansionCost = (currentCapacity) => {
  if (currentCapacity >= MAX_ANIMAL_CAPACITY) {
    return null;
  }
  return 2500;
};

export const BUILDING_UPGRADES = {
  sprinkler: [
    { level: 1, cost: 650, coverage: 12, manualWaterCost: 3, plantingDiscount: 3, description: '覆蓋 12 格農地，自動補水並減少播種體力。' },
    { level: 2, cost: 900, coverage: 24, manualWaterCost: 2, plantingDiscount: 4, description: '覆蓋範圍擴大至 24 格，澆水幾乎不費力。' },
    { level: 3, cost: 1400, coverage: 36, manualWaterCost: 1, plantingDiscount: 5, description: '灌溉到 36 格農地並極大幅度節省體力。' },
    { level: 4, cost: 2200, coverage: MAX_FARM_PLOTS, manualWaterCost: 1, plantingDiscount: 6, description: '全區自動灌溉，維持土壤最佳濕度。' },
  ],
  silo: [
    { level: 1, cost: 800, sellBonus: 0.05, description: '作物售價 +5%，減少腐壞。' },
    { level: 2, cost: 1200, sellBonus: 0.1, description: '作物售價 +10%，可長期保存。' },
    { level: 3, cost: 1800, sellBonus: 0.18, description: '作物售價 +18%，高效率倉儲。' },
  ],
  barn: [
    { level: 1, cost: 1000, boost: 1.2, description: '提供牛羊穩定環境，提升產量。' },
    { level: 2, cost: 1500, boost: 1.35, description: '擴增飼槽與溫控，提高品質。' },
    { level: 3, cost: 2200, boost: 1.5, description: '頂級穀倉，讓牛羊更快樂。' },
  ],
  chickenCoop: [
    { level: 1, cost: 500, boost: 1.3, description: '舒適雞舍，提升產蛋率。' },
    { level: 2, cost: 850, boost: 1.45, description: '自動餵食設備維持穩定產量。' },
    { level: 3, cost: 1200, boost: 1.6, description: '氣候調節雞舍，全年高產。' },
  ],
  pigPen: [
    { level: 1, cost: 400, boost: 1.2, description: '泥土樂園讓豬豬更放鬆。' },
    { level: 2, cost: 700, boost: 1.35, description: '增設噴霧與運動空間，提升肉質。' },
  ],
  pond: [
    { level: 1, cost: 600, boost: 1.3, description: '自然池塘讓水鳥安心棲息。' },
    { level: 2, cost: 950, boost: 1.45, description: '擴建浮台與遮蔭範圍。' },
  ],
};

export const ANIMAL_CARE_ACTIONS = {
  playtime: {
    key: 'playtime',
    label: '陪牠玩耍',
    shortLabel: '陪玩',
    needLabel: '想玩耍',
    description: '與動物一起玩耍可以大幅提升幸福度與羈絆，但會稍微增加飢餓感。',
    energyCost: 6,
    happinessBoost: 18,
    bondBoost: 14,
    hungerImpact: 14,
  },
  grooming: {
    key: 'grooming',
    label: '梳洗打理',
    shortLabel: '梳洗',
    needLabel: '想梳洗',
    description: '細心梳洗讓動物保持乾淨舒適，降低生病風險並增加羈絆。',
    energyCost: 5,
    happinessBoost: 12,
    bondBoost: 10,
    cleanlinessBoost: 22,
    sootheSickness: true,
  },
  cleanPen: {
    key: 'cleanPen',
    label: '清理欄舍',
    shortLabel: '清理',
    needLabel: '需要清理',
    description: '整理環境讓欄舍更乾淨，恢復整潔度並讓動物更安心。',
    energyCost: 7,
    happinessBoost: 8,
    bondBoost: 8,
    cleanlinessBoost: 28,
  },
};

export const ANIMAL_TRAITS = [
  {
    key: 'steadfast',
    name: '穩健個性',
    description: '性格穩重，沒有額外效果，容易照顧。',
    weight: 2,
    modifiers: {},
  },
  {
    key: 'energetic',
    name: '活力充沛',
    description: '羈絆成長較快，但食量也比較大，容易感到飢餓。',
    weight: 1,
    modifiers: {
      hungerLoss: 1.25,
      bondDecay: 0.85,
      production: 1.1,
    },
  },
  {
    key: 'gentle',
    name: '溫馴體質',
    description: '抵抗力較高、飢餓下降慢一些，但產量稍微普通。',
    weight: 1,
    modifiers: {
      hungerLoss: 0.9,
      sicknessRisk: 0.7,
      production: 0.95,
    },
  },
  {
    key: 'diligent',
    name: '勤勞小幫手',
    description: '產量更高、欄舍保持得較乾淨，但幸福度下降稍快。',
    weight: 1,
    modifiers: {
      production: 1.2,
      cleanlinessDecay: 0.85,
      happinessDecay: 1.1,
    },
  },
  {
    key: 'gourmet',
    name: '挑嘴吃貨',
    description: '對食物要求高，餓肚子時情緒跌得更快，但餵飽後產量提升。',
    weight: 1,
    modifiers: {
      hungerLoss: 1.3,
      hungerMoodPenalty: 1.25,
      production: 1.15,
    },
  },
];

export const ANIMAL_TRAIT_MAP = ANIMAL_TRAITS.reduce((map, trait) => {
  map[trait.key] = trait;
  return map;
}, {});

export const pickAnimalTraitKey = (animalType) => {
  const pool = ANIMAL_TRAITS.filter(trait => !trait.types || trait.types.includes(animalType));
  const source = pool.length > 0 ? pool : ANIMAL_TRAITS;
  const expanded = source.flatMap(trait => Array(Math.max(1, Math.floor(trait.weight || 1))).fill(trait));
  const selection = expanded.length > 0 ? expanded : source;
  if (selection.length === 0) {
    return null;
  }
  const choice = selection[Math.floor(Math.random() * selection.length)];
  return choice?.key || null;
};
