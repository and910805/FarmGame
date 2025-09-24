import { CROPS, ANIMAL_PRODUCTS, FARM_SUPPLIES, NPCS } from '../data/GameCatalog';

const DYNAMIC_QUEST_SLOTS = 3;

const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pickOne = (list) => list[Math.floor(Math.random() * list.length)];

export class QuestManager {
  constructor({ stateRef, setQuestLog, setDynamicQuests, setInventory, setMoney, notifier }) {
    this.stateRef = stateRef;
    this.setQuestLog = setQuestLog;
    this.setDynamicQuests = setDynamicQuests;
    this.setInventory = setInventory;
    this.setMoney = setMoney;
    this.notifier = notifier;
  }

  buildQuestDefinitions(dynamicQuests = {}) {
    const map = {};

    NPCS.forEach(npc => {
      (npc.quests || []).forEach(quest => {
        if (quest?.id) {
          map[quest.id] = { ...quest, npcName: npc.name };
        }
      });
    });

    Object.entries(dynamicQuests || {}).forEach(([questId, quest]) => {
      if (questId && quest) {
        map[questId] = quest;
      }
    });

    return map;
  }

  getQuestTargetLabel(quest) {
    if (!quest?.target) {
      return '目標';
    }

    if (CROPS[quest.target]) {
      const crop = CROPS[quest.target];
      return `${crop.emoji} ${crop.name}`;
    }

    if (ANIMAL_PRODUCTS[quest.target]) {
      const product = ANIMAL_PRODUCTS[quest.target];
      return `${product.emoji} ${product.name}`;
    }

    if (FARM_SUPPLIES[quest.target]) {
      const supply = FARM_SUPPLIES[quest.target];
      return `${supply.emoji} ${supply.name}`;
    }

    return quest.target;
  }

  refreshDaily(currentDay) {
    const existingDynamic = this.stateRef.current.dynamicQuests || {};
    const existingLog = this.stateRef.current.questLog || {};

    const preserved = {};
    Object.entries(existingDynamic).forEach(([id, quest]) => {
      const status = existingLog?.[id]?.status;
      if (status === 'accepted' || status === 'ready') {
        preserved[id] = quest;
      }
    });

    const questGivers = ['商會佈告欄', '旅行商人', '鄰村里長', '合作社代表', '冒險者公會'];
    const deliverTargets = [...Object.keys(CROPS), ...Object.keys(ANIMAL_PRODUCTS)];
    const harvestTargets = Object.keys(CROPS);
    const sellTargets = Object.keys(CROPS);

    const usedIds = new Set(Object.keys(preserved));
    const createQuestId = (slot) => {
      let attempt = 0;
      let id;
      do {
        id = `daily_${currentDay}_${slot}_${Math.random().toString(36).slice(2, 6)}`;
        attempt += 1;
      } while (usedIds.has(id) && attempt < 5);
      usedIds.add(id);
      return id;
    };

    const buildQuest = (slot) => {
      const giver = pickOne(questGivers);
      const questTypes = ['deliver', 'harvest', 'sell', 'pestClear'];
      const type = pickOne(questTypes);
      const questId = createQuestId(slot);

      if (type === 'deliver' && deliverTargets.length > 0) {
        const target = pickOne(deliverTargets);
        const product = ANIMAL_PRODUCTS[target];
        const crop = CROPS[target];
        const isProduct = Boolean(product);
        const label = isProduct
          ? `${product.emoji} ${product.name}`
          : `${crop.emoji} ${crop.name}`;
        const basePrice = isProduct ? product.basePrice : crop.sellPrice;
        const count = isProduct ? randomBetween(4, 12) : randomBetween(18, 45);
        const reward = Math.max(150, Math.floor(basePrice * count * (isProduct ? 1.9 : 1.5)));
        return {
          id: questId,
          type: 'deliver',
          target,
          count,
          reward,
          description: `${giver} 需要 ${count} 份${label}，協助供貨即可獲得酬勞。`,
          npcName: giver,
        };
      }

      if (type === 'harvest' && harvestTargets.length > 0) {
        const target = pickOne(harvestTargets);
        const crop = CROPS[target];
        const count = randomBetween(10, 28);
        const reward = Math.max(160, Math.floor(crop.sellPrice * count * (1.4 + Math.random() * 0.5)));
        return {
          id: questId,
          type: 'harvest',
          target,
          count,
          reward,
          description: `${giver} 正準備市集，收成 ${count} 份${crop.emoji} ${crop.name} 就能領取獎金。`,
          npcName: giver,
        };
      }

      if (type === 'sell' && sellTargets.length > 0) {
        const target = pickOne(sellTargets);
        const crop = CROPS[target];
        const count = randomBetween(15, 35);
        const reward = Math.max(200, Math.floor(crop.sellPrice * count * (1.55 + Math.random() * 0.45)));
        return {
          id: questId,
          type: 'sell',
          target,
          count,
          reward,
          description: `${giver} 想炒熱 ${crop.emoji} ${crop.name} 的行情，賣出 ${count} 份即可分紅。`,
          npcName: giver,
        };
      }

      const pestCount = randomBetween(3, 6);
      const reward = randomBetween(180, 320);
      return {
        id: questId,
        type: 'pestClear',
        count: pestCount,
        reward,
        description: `${giver} 報告蟲害，協助處理 ${pestCount} 塊農地的害蟲。`,
        npcName: giver,
      };
    };

    const combined = { ...preserved };
    let slotIndex = 0;
    while (Object.keys(combined).length < DYNAMIC_QUEST_SLOTS) {
      const quest = buildQuest(slotIndex);
      combined[quest.id] = quest;
      slotIndex += 1;
    }

    this.setDynamicQuests(combined);
    this.setQuestLog(prev => {
      if (!prev) {
        return prev;
      }
      const next = { ...prev };
      Object.keys(prev).forEach(id => {
        if (id.startsWith('daily_') && !combined[id]) {
          delete next[id];
        }
      });
      return next;
    });
  }

  recordEvent(event, questDefinitions) {
    if (!event?.type) {
      return;
    }

    this.setQuestLog(prev => {
      if (!prev || Object.keys(prev).length === 0) {
        return prev;
      }

      let mutated = false;
      const next = { ...prev };

      Object.entries(prev).forEach(([questId, entry]) => {
        if (!entry || (entry.status !== 'accepted' && entry.status !== 'ready')) {
          return;
        }

        const quest = questDefinitions[questId];
        if (!quest) {
          return;
        }

        const required = quest.count ?? 0;
        const currentProgress = entry.progress ?? 0;
        let updatedEntry = entry;

        switch (quest.type) {
          case 'harvest':
            if (event.type === 'harvest' && event.crop === quest.target) {
              const newProgress = Math.min(required, currentProgress + (event.amount ?? 1));
              if (newProgress !== currentProgress || entry.status !== 'ready') {
                updatedEntry = { ...entry, progress: newProgress };
                if (required > 0 && newProgress >= required) {
                  updatedEntry.status = 'ready';
                }
              }
            }
            break;
          case 'sell':
            if (event.type === 'sell' && event.crop === quest.target) {
              const newProgress = Math.min(required, currentProgress + (event.amount ?? 1));
              if (newProgress !== currentProgress || entry.status !== 'ready') {
                updatedEntry = { ...entry, progress: newProgress };
                if (required > 0 && newProgress >= required) {
                  updatedEntry.status = 'ready';
                }
              }
            }
            break;
          case 'pestClear':
            if (event.type === 'pestClear') {
              const newProgress = Math.min(required, currentProgress + (event.amount ?? 1));
              if (newProgress !== currentProgress || entry.status !== 'ready') {
                updatedEntry = { ...entry, progress: newProgress };
                if (required > 0 && newProgress >= required) {
                  updatedEntry.status = 'ready';
                }
              }
            }
            break;
          default:
            break;
        }

        if (updatedEntry !== entry) {
          next[questId] = updatedEntry;
          mutated = true;
        }
      });

      return mutated ? next : prev;
    });
  }

  acceptQuest(questId, questDefinitions, questLog, day) {
    const quest = questDefinitions[questId];
    if (!quest) {
      return;
    }

    const existing = questLog[questId];
    if (existing?.status === 'accepted' || existing?.status === 'ready') {
      this.notifier('任務已在進行中！', { type: 'info' });
      return;
    }
    if (existing?.status === 'completed') {
      this.notifier('這項任務已經完成過囉！', { type: 'info' });
      return;
    }

    this.setQuestLog(prev => ({
      ...prev,
      [questId]: {
        status: 'accepted',
        progress: 0,
        acceptedDay: day,
      },
    }));
    this.notifier(`📜 接下任務：「${quest.description}」`, { type: 'info' });
  }

  deliverQuest(questId, questDefinitions, questLog, inventory, day) {
    const quest = questDefinitions[questId];
    if (!quest || quest.type !== 'deliver') {
      return;
    }

    const entry = questLog[questId];
    if (!entry || entry.status !== 'accepted') {
      if (entry?.status === 'completed') {
        this.notifier('任務已經交付完成。', { type: 'info' });
      } else {
        this.notifier('請先接受任務再進行交付。', { type: 'warning' });
      }
      return;
    }

    const needCount = quest.count ?? 0;
    const available = inventory?.[quest.target] ?? 0;
    if (available < needCount) {
      this.notifier('庫存不足，無法完成交付。', { type: 'warning' });
      return;
    }

    this.setInventory(prev => ({
      ...prev,
      [quest.target]: Math.max(0, (prev?.[quest.target] || 0) - needCount),
    }));
    this.setMoney(prev => prev + (quest.reward ?? 0));
    this.setQuestLog(prev => ({
      ...prev,
      [questId]: {
        ...prev[questId],
        status: 'completed',
        progress: needCount,
        completedDay: day,
      },
    }));

    const targetLabel = this.getQuestTargetLabel(quest);
    this.notifier(`🎁 已交付 ${needCount} 份${targetLabel}，獲得 $${quest.reward}！`, { type: 'success' });
  }

  claimQuestReward(questId, questDefinitions, questLog, day) {
    const quest = questDefinitions[questId];
    if (!quest) {
      return;
    }

    const entry = questLog[questId];
    if (!entry) {
      this.notifier('請先接受任務！', { type: 'info' });
      return;
    }

    if (entry.status !== 'ready') {
      if (entry.status === 'completed') {
        this.notifier('任務獎勵已經領取過了。', { type: 'info' });
      } else {
        this.notifier('仍未達成任務要求，持續加油！', { type: 'warning' });
      }
      return;
    }

    this.setMoney(prev => prev + (quest.reward ?? 0));
    this.setQuestLog(prev => ({
      ...prev,
      [questId]: {
        ...prev[questId],
        status: 'completed',
        progress: quest.count ?? prev[questId]?.progress ?? 0,
        completedDay: day,
      },
    }));
    this.notifier(`💰 領取任務獎勵 $${quest.reward}！`, { type: 'success' });
  }

  getActiveQuests(questDefinitions, questLog, inventory) {
    if (!questLog) {
      return [];
    }

    return Object.entries(questLog)
      .map(([questId, entry]) => {
        const quest = questDefinitions[questId];
        if (!quest || entry.status === 'completed') {
          return null;
        }

        const required = quest.count ?? 0;
        const inventoryCount = quest.type === 'deliver' ? (inventory?.[quest.target] ?? 0) : null;
        const progress = quest.type === 'deliver'
          ? Math.min(required, inventoryCount ?? 0)
          : Math.min(required, entry.progress ?? 0);
        const ready = entry.status === 'ready'
          || (quest.type === 'deliver' && entry.status === 'accepted' && inventoryCount != null && inventoryCount >= required);

        return {
          id: questId,
          quest,
          entry,
          required,
          progress,
          ready,
          inventoryCount,
        };
      })
      .filter(Boolean);
  }
}
