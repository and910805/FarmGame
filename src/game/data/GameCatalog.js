class BaseEntity {
  static nextId = 1;

  constructor(key) {
    this.id = BaseEntity.nextId++;
    this.key = key;
  }
}

class Crop extends BaseEntity {
  constructor(key, { name, price, growTime, sellPrice, emoji, weatherBonus, seasonBonus }) {
    super(key);
    this.name = name;
    this.price = price;
    this.growTime = growTime;
    this.sellPrice = sellPrice;
    this.emoji = emoji;
    this.weatherBonus = weatherBonus;
    this.seasonBonus = seasonBonus || {};
  }
}

class Animal extends BaseEntity {
  constructor(key, { name, price, happiness, emoji, foodCost, income, shelter, product, butcher }) {
    super(key);
    this.name = name;
    this.price = price;
    this.happiness = happiness;
    this.emoji = emoji;
    this.foodCost = foodCost;
    this.income = income;
    this.shelter = shelter;
    this.product = product;
    this.butcher = butcher;
  }
}

class Building extends BaseEntity {
  constructor(key, { name, price, emoji, description, boost }) {
    super(key);
    this.name = name;
    this.price = price;
    this.emoji = emoji;
    this.description = description;
    this.boost = boost;
  }
}

class Tool extends BaseEntity {
  constructor(key, { name, energyReduction, speedBoost, price }) {
    super(key);
    this.name = name;
    this.energyReduction = energyReduction;
    this.speedBoost = speedBoost;
    this.price = price;
  }
}

class Achievement {
  constructor({ id, name, description, reward, icon }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.reward = reward;
    this.icon = icon;
  }
}

class NPC {
  constructor({ name, emoji, dialogue, quests }) {
    this.name = name;
    this.emoji = emoji;
    this.dialogue = dialogue;
    this.quests = quests;
  }
}

class Supply extends BaseEntity {
  constructor(key, { name, price, emoji, description }) {
    super(key);
    this.name = name;
    this.price = price;
    this.emoji = emoji;
    this.description = description;
  }
}

class GameCatalog {
  constructor() {
    this.crops = {
      carrot: new Crop('carrot', {
        name: '胡蘿蔔',
        price: 10,
        growTime: 5,
        sellPrice: 25,
        emoji: '🥕',
        weatherBonus: { sunny: 1.2, rainy: 1.0, snow: 0.8 },
        seasonBonus: { spring: 1.15, summer: 0.9, autumn: 1.2, winter: 0.7 },
      }),
      corn: new Crop('corn', {
        name: '玉米',
        price: 20,
        growTime: 8,
        sellPrice: 50,
        emoji: '🌽',
        weatherBonus: { sunny: 1.3, rainy: 1.1, snow: 0.6 },
        seasonBonus: { spring: 0.85, summer: 1.25, autumn: 1.05, winter: 0.55 },
      }),
      tomato: new Crop('tomato', {
        name: '番茄',
        price: 15,
        growTime: 6,
        sellPrice: 35,
        emoji: '🍅',
        weatherBonus: { sunny: 1.4, rainy: 0.9, snow: 0.5 },
        seasonBonus: { spring: 1.0, summer: 1.3, autumn: 0.85, winter: 0.5 },
      }),
      wheat: new Crop('wheat', {
        name: '小麥',
        price: 8,
        growTime: 4,
        sellPrice: 20,
        emoji: '🌾',
        weatherBonus: { sunny: 1.1, rainy: 1.2, snow: 0.9 },
        seasonBonus: { spring: 1.05, summer: 1.1, autumn: 1.25, winter: 0.85 },
      }),
      potato: new Crop('potato', {
        name: '馬鈴薯',
        price: 12,
        growTime: 7,
        sellPrice: 30,
        emoji: '🥔',
        weatherBonus: { sunny: 1.0, rainy: 1.3, snow: 1.1 },
        seasonBonus: { spring: 0.95, summer: 1.1, autumn: 1.35, winter: 0.95 },
      }),
      strawberry: new Crop('strawberry', {
        name: '草莓',
        price: 25,
        growTime: 10,
        sellPrice: 60,
        emoji: '🍓',
        weatherBonus: { sunny: 1.2, rainy: 0.8, snow: 0.4 },
        seasonBonus: { spring: 1.35, summer: 1.1, autumn: 0.75, winter: 0.4 },
      }),
      blueberry: new Crop('blueberry', {
        name: '藍莓',
        price: 28,
        growTime: 9,
        sellPrice: 70,
        emoji: '🫐',
        weatherBonus: { sunny: 1.1, rainy: 1.2, snow: 0.5 },
        seasonBonus: { spring: 1.2, summer: 1.35, autumn: 0.8, winter: 0.45 },
      }),
      pumpkin: new Crop('pumpkin', {
        name: '南瓜',
        price: 32,
        growTime: 12,
        sellPrice: 95,
        emoji: '🎃',
        weatherBonus: { sunny: 1.25, rainy: 0.95, snow: 0.4 },
        seasonBonus: { spring: 0.85, summer: 1.05, autumn: 1.4, winter: 0.4 },
      }),
      soybean: new Crop('soybean', {
        name: '黃豆',
        price: 18,
        growTime: 7,
        sellPrice: 45,
        emoji: '🫘',
        weatherBonus: { sunny: 1.15, rainy: 1.25, snow: 0.7 },
        seasonBonus: { spring: 1.05, summer: 1.25, autumn: 1.1, winter: 0.65 },
      }),
      rice: new Crop('rice', {
        name: '水稻',
        price: 22,
        growTime: 11,
        sellPrice: 65,
        emoji: '🍚',
        weatherBonus: { sunny: 0.9, rainy: 1.4, snow: 0.5 },
        seasonBonus: { spring: 1.0, summer: 1.35, autumn: 1.1, winter: 0.5 },
      }),
      tea: new Crop('tea', {
        name: '茶葉',
        price: 30,
        growTime: 13,
        sellPrice: 105,
        emoji: '🍃',
        weatherBonus: { sunny: 1.3, rainy: 1.0, snow: 0.6 },
        seasonBonus: { spring: 1.4, summer: 1.1, autumn: 0.95, winter: 0.55 },
      }),
    };

    this.animals = {
      dog: new Animal('dog', { name: '狗狗', price: 200, happiness: 50, emoji: '🐕', foodCost: 5, income: 10, shelter: 'dogHouse' }),
      cat: new Animal('cat', { name: '貓咪', price: 150, happiness: 60, emoji: '🐱', foodCost: 3, income: 7, shelter: 'catHouse' }),
      chicken: new Animal('chicken', {
        name: '雞',
        price: 100,
        happiness: 40,
        emoji: '🐔',
        foodCost: 2,
        income: 18,
        shelter: 'chickenCoop',
        product: 'egg',
        butcher: { product: 'chickenMeat', amount: 1 },
      }),
      cow: new Animal('cow', {
        name: '牛',
        price: 500,
        happiness: 30,
        emoji: '🐄',
        foodCost: 10,
        income: 40,
        shelter: 'barn',
        product: 'milk',
        butcher: { product: 'beef', amount: 1 },
      }),
      pig: new Animal('pig', {
        name: '豬',
        price: 300,
        happiness: 45,
        emoji: '🐷',
        foodCost: 8,
        income: 30,
        shelter: 'pigPen',
        butcher: { product: 'pork', amount: 1 },
      }),
      sheep: new Animal('sheep', {
        name: '羊',
        price: 250,
        happiness: 40,
        emoji: '🐑',
        foodCost: 6,
        income: 18,
        shelter: 'barn',
        product: 'wool',
        butcher: { product: 'mutton', amount: 1 },
      }),
      duck: new Animal('duck', {
        name: '鴨子',
        price: 120,
        happiness: 55,
        emoji: '🦆',
        foodCost: 3,
        income: 14,
        shelter: 'pond',
        product: 'duckEgg',
        butcher: { product: 'duckMeat', amount: 1 },
      }),
      rabbit: new Animal('rabbit', { name: '兔子', price: 80, happiness: 70, emoji: '🐰', foodCost: 2, income: 8, shelter: 'rabbitHutch' }),
    };

    this.buildings = {
      barn: new Building('barn', { name: '穀倉', price: 1000, emoji: '🏚️', description: '容納牛羊，提升產量（可升級）', boost: 1.2 }),
      chickenCoop: new Building('chickenCoop', { name: '雞舍', price: 500, emoji: '🏠', description: '專門養雞，提升產蛋率（可升級）', boost: 1.3 }),
      dogHouse: new Building('dogHouse', { name: '狗屋', price: 300, emoji: '🏘️', description: '狗狗的溫馨小窩', boost: 1.1 }),
      catHouse: new Building('catHouse', { name: '貓屋', price: 250, emoji: '🏡', description: '貓咪的舒適居所', boost: 1.1 }),
      pigPen: new Building('pigPen', { name: '豬圈', price: 400, emoji: '🏗️', description: '豬豬的泥土樂園（可升級）', boost: 1.2 }),
      pond: new Building('pond', { name: '池塘', price: 600, emoji: '🌊', description: '水鳥的天堂（可升級）', boost: 1.3 }),
      rabbitHutch: new Building('rabbitHutch', { name: '兔籠', price: 200, emoji: '📦', description: '兔子的安全小屋', boost: 1.2 }),
      greenhouse: new Building('greenhouse', { name: '溫室', price: 2000, emoji: '🏢', description: '不受天氣影響的種植空間', boost: 1.5 }),
      silo: new Building('silo', { name: '筒倉', price: 800, emoji: '🗼', description: '提升作物保存品質（可升級）', boost: 1.0 }),
      windmill: new Building('windmill', { name: '風車', price: 1500, emoji: '🌪️', description: '產生額外收入', boost: 1.0 }),
      sprinkler: new Building('sprinkler', { name: '自動灑水器', price: 650, emoji: '🚿', description: '每天早晨自動灌溉部分農地，升級可覆蓋整個農場', boost: 1.0 }),
    };

    this.supplies = {
      fertilizer: new Supply('fertilizer', {
        name: '有機肥料',
        price: 45,
        emoji: '🌿',
        description: '提升土壤品質，縮短作物成熟時間。',
      }),
      pesticide: new Supply('pesticide', {
        name: '天然驅蟲劑',
        price: 30,
        emoji: '🪲',
        description: '清除害蟲，讓作物恢復生長。',
      }),
      medicine: new Supply('medicine', {
        name: '動物營養劑',
        price: 55,
        emoji: '💊',
        description: '治療生病的動物並恢復部分快樂度。',
      }),
    };

    this.tools = {
      basic: new Tool('basic', { name: '基本工具', energyReduction: 0, speedBoost: 1, price: 0 }),
      iron: new Tool('iron', { name: '鐵製工具', energyReduction: 2, speedBoost: 1.2, price: 500 }),
      steel: new Tool('steel', { name: '鋼製工具', energyReduction: 4, speedBoost: 1.5, price: 1200 }),
      magic: new Tool('magic', { name: '魔法工具', energyReduction: 6, speedBoost: 2, price: 3000 }),
    };

    this.animalProducts = {
      egg: { key: 'egg', name: '雞蛋', emoji: '🥚', basePrice: 14, animal: 'chicken' },
      milk: { key: 'milk', name: '鮮奶', emoji: '🥛', basePrice: 35, animal: 'cow' },
      duckEgg: { key: 'duckEgg', name: '鴨蛋', emoji: '🥚', basePrice: 18, animal: 'duck' },
      wool: { key: 'wool', name: '羊毛', emoji: '🧶', basePrice: 48, animal: 'sheep' },
      chickenMeat: { key: 'chickenMeat', name: '雞肉', emoji: '🍗', basePrice: 95, animal: 'chicken' },
      beef: { key: 'beef', name: '牛肉', emoji: '🥩', basePrice: 220, animal: 'cow' },
      pork: { key: 'pork', name: '豬肉', emoji: '🍖', basePrice: 160, animal: 'pig' },
      duckMeat: { key: 'duckMeat', name: '鴨肉', emoji: '🦆', basePrice: 130, animal: 'duck' },
      mutton: { key: 'mutton', name: '羊肉', emoji: '🍖', basePrice: 150, animal: 'sheep' },
    };

    this.achievements = [
      new Achievement({ id: 'firstPlant', name: '初次種植', description: '種下第一株作物', reward: 100, icon: '🌱' }),
      new Achievement({ id: 'richFarmer', name: '富豪農夫', description: '擁有10000金幣', reward: 500, icon: '💰' }),
      new Achievement({ id: 'animalLover', name: '動物愛好者', description: '擁有10隻動物', reward: 300, icon: '🐾' }),
      new Achievement({ id: 'builder', name: '建築大師', description: '建造5個建築', reward: 800, icon: '🏗️' }),
      new Achievement({ id: 'levelUp', name: '經驗老手', description: '達到等級10', reward: 1000, icon: '⭐' }),
      new Achievement({ id: 'weatherMaster', name: '天氣專家', description: '在所有天氣下收成作物', reward: 600, icon: '🌦️' }),
    ];

    this.npcs = [
      new NPC({
        name: '農夫老張',
        emoji: '👨‍🌾',
        dialogue: ['今天天氣真好呢！', '記得給作物澆水哦！', '我這裡有些好種子...'],
        quests: [
          {
            id: 'farmer_wheat_bundle',
            type: 'deliver',
            target: 'wheat',
            count: 30,
            reward: 480,
            description: '收穫祭要到了，老張需要 30 束小麥來布置穀倉。',
          },
          {
            id: 'farmer_pest_control',
            type: 'pestClear',
            count: 3,
            reward: 260,
            description: '最近害蟲肆虐，幫忙處理 3 塊農地的蟲害吧。',
          },
        ],
      }),
      new NPC({
        name: '商人小李',
        emoji: '👨‍💼',
        dialogue: ['生意興隆！', '需要什麼嗎？', '我有特價商品！'],
        quests: [
          {
            id: 'merchant_carrot_bulk',
            type: 'deliver',
            target: 'carrot',
            count: 50,
            reward: 1500,
            description: '小李接到外地大單，需要 50 根胡蘿蔔立即出貨。',
          },
          {
            id: 'merchant_sweet_wave',
            type: 'sell',
            target: 'strawberry',
            count: 25,
            reward: 620,
            description: '市場草莓熱潮來了！賣出 25 盒草莓即可分紅。',
          },
        ],
      }),
    ];
  }

  getCrop(key) {
    return this.crops[key];
  }

  getAnimal(key) {
    return this.animals[key];
  }

  getBuilding(key) {
    return this.buildings[key];
  }

  getTool(key) {
    return this.tools[key];
  }

  getSupply(key) {
    return this.supplies[key];
  }

  getAnimalProduct(key) {
    return this.animalProducts[key];
  }
}

export const WEATHER_TYPES = ['sunny', 'rainy', 'cloudy', 'storm', 'snow'];
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'];

export const catalog = new GameCatalog();
export const CROPS = catalog.crops;
export const ANIMALS = catalog.animals;
export const ANIMAL_PRODUCTS = catalog.animalProducts;
export const BUILDINGS = catalog.buildings;
export const TOOLS = catalog.tools;
export const FARM_SUPPLIES = catalog.supplies;
export const ACHIEVEMENTS = catalog.achievements;
export const NPCS = catalog.npcs;

