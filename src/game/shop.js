// 商店数据、钱包与库存持久化。所有价格均为“珍珠”货币。
// 珍珠通过每局游戏收集，游戏结束后自动存入钱包。

const SHOP_STORAGE_KEY = 'shark-parkour.shop.v1';
export const LIFE_PILL_MAX_BOOST = 2;

export const SHOP_ITEMS = [
  // ---------- 装饰品 ----------
  { id: 'bow', category: 'decor', name: '蝴蝶结', emoji: '🎀', price: 80, desc: '戴在头顶的红色蝴蝶结' },
  { id: 'socks', category: 'decor', name: '鱼鳍小袜子', emoji: '🧦', price: 60, desc: '给鱼鳍穿上可爱小袜子' },
  { id: 'hat', category: 'decor', name: '小帽子', emoji: '👒', price: 120, desc: '遮阳又时髦的小圆帽' },
  { id: 'flower', category: 'decor', name: '小花花', emoji: '🌸', price: 90, desc: '别在身上的粉色小花' },
  { id: 'necklace', category: 'decor', name: '珍珠项链', emoji: '📿', price: 220, desc: '闪闪发光的珍珠项链' },
  { id: 'mini', category: 'decor', name: '迷你跟班', emoji: '🐟', price: 350, desc: '一条迷你小鱼永远跟着你' },
  { id: 'life-pill', category: 'decor', name: '续命丸', emoji: '💊', price: 500, desc: '当前角色永久 +1 最大生命（最多 +2）' },

  // ---------- 武器 ----------
  { id: 'shield', category: 'weapon', name: '盾牌', emoji: '🛡️', price: 150, desc: '抵挡 1 次撞击' },
  { id: 'gun', category: 'weapon', name: '泡泡枪', emoji: '🔫', price: 900, desc: '每 5.5 秒自动击碎前方一个障碍' },
  { id: 'super-shield', category: 'weapon', name: '超级盾牌', emoji: '⚡', price: 1200, desc: '抵挡 4 次撞击' },
  { id: 'gold-shield', category: 'weapon', name: '黄金盾牌', emoji: '🟡', price: 800, desc: '抵挡 3 次撞击' },
  { id: 'iron-shield', category: 'weapon', name: '铁盾牌', emoji: '🔩', price: 350, desc: '抵挡 2 次撞击' },
  { id: 'diamond-shield', category: 'weapon', name: '钻石盾牌', emoji: '💎', price: 2000, desc: '抵挡 5 次撞击' },
];

export const SHIELD_DEFS = {
  shield: { durability: 1, name: '盾牌', color: '#9fb4c8' },
  'iron-shield': { durability: 2, name: '铁盾牌', color: '#c8d2da' },
  'gold-shield': { durability: 3, name: '黄金盾牌', color: '#ffd65a' },
  'super-shield': { durability: 4, name: '超级盾牌', color: '#5af0ff' },
  'diamond-shield': { durability: 5, name: '钻石盾牌', color: '#7dfcff' },
};

export function getItem(id) {
  return SHOP_ITEMS.find((item) => item.id === id) || null;
}

export function getShieldDef(id) {
  return SHIELD_DEFS[id] || null;
}

function defaultShopState() {
  return {
    wallet: 0,
    owned: [],
    equippedShield: null,
    lifeBoosts: {},
  };
}

export function loadShopState() {
  const state = defaultShopState();
  try {
    const saved = localStorage.getItem(SHOP_STORAGE_KEY);
    if (!saved) return state;
    const parsed = JSON.parse(saved);
    if (typeof parsed.wallet === 'number' && Number.isFinite(parsed.wallet)) state.wallet = Math.max(0, parsed.wallet);
    if (Array.isArray(parsed.owned)) state.owned = parsed.owned.filter((id) => getItem(id));
    if (parsed.equippedShield && getShieldDef(parsed.equippedShield)) state.equippedShield = parsed.equippedShield;
    if (parsed.lifeBoosts && typeof parsed.lifeBoosts === 'object') {
      for (const [key, value] of Object.entries(parsed.lifeBoosts)) {
        state.lifeBoosts[key] = Math.max(0, Math.min(LIFE_PILL_MAX_BOOST, Number(value) || 0));
      }
    }
  } catch {
    // 数据损坏时使用默认状态
  }
  return state;
}

export function saveShopState(state) {
  try {
    localStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 忽略存储失败
  }
}

export function ownsItem(state, id) {
  return state.owned.includes(id);
}

export function addWallet(state, amount) {
  const next = { ...state, lifeBoosts: { ...state.lifeBoosts } };
  next.wallet = Math.max(0, Math.round(state.wallet + amount));
  return next;
}

export function spendWallet(state, amount) {
  if (state.wallet < amount) return null;
  return addWallet(state, -amount);
}

export function lifeBoostFor(state, characterId) {
  return state.lifeBoosts?.[characterId] || 0;
}
