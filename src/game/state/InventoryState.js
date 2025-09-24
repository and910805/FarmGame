import { CROPS, ANIMAL_PRODUCTS } from '../data/GameCatalog';

const CROP_METADATA = Object.fromEntries(
  Object.entries(CROPS).map(([key, crop]) => [
    key,
    { name: crop.name, emoji: crop.emoji, type: 'crop', cropKey: key },
  ]),
);

const SEED_METADATA = Object.fromEntries(
  Object.entries(CROPS).map(([key, crop]) => [
    `seed_${key}`,
    { name: `${crop.name}種子`, emoji: crop.emoji, type: 'seed', cropKey: key },
  ]),
);

const PRODUCT_METADATA = Object.fromEntries(
  Object.entries(ANIMAL_PRODUCTS).map(([key, product]) => [
    key,
    { name: product.name, emoji: product.emoji, type: 'product', animal: product.animal },
  ]),
);

export const INVENTORY_METADATA = {
  ...CROP_METADATA,
  ...PRODUCT_METADATA,
  ...SEED_METADATA,
};

export const INVENTORY_ORDER = Object.keys(INVENTORY_METADATA);

export const createInitialInventory = () => {
  const base = {};
  INVENTORY_ORDER.forEach(key => {
    base[key] = 0;
  });
  return base;
};

export const getInventoryMetadata = (key) => INVENTORY_METADATA[key] || null;
