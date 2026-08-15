// =============================================================================
// 游戏可调参数（改这里即可，不需要动引擎逻辑）
// =============================================================================

export const GAME_TUNING = {
  // 基础前进速度（屏幕高度倍率/秒）
  baseSpeed: 0.42,

  // 速度随距离提升的上限
  maxSpeedRamp: 0.78,

  // 达到最大提速所需距离 = 屏幕高度 × 该系数
  speedRampDistanceDivisor: 13,

  // ---------------- 升降/下沉手感 ----------------
  // 下沉重力系数：越大下沉越快。手机建议 1.2 ~ 1.8，当前默认已调慢。
  gravity: 1.45,

  // 按住屏幕上浮的力度系数：越大上升越快。
  lift: 4.8,

  // 主动下潜（S / 方向键下）的额外力度系数。
  dive: 4.6,

  // 水阻系数：越大，升降停得越快、手感越“跟手”。
  drag: 2.2,

  // 最大上浮速度（屏幕高度倍率/秒）。
  maxRiseSpeed: 1.02,

  // 最大下沉速度（屏幕高度倍率/秒）。调小可让“松开后下沉更慢”。
  maxSinkSpeed: 0.62,

  // ---------------- 热带鱼装饰 ----------------
  tropicalFish: {
    enabled: true,
    // 鱼群密度：1 为默认，调到 1.6 ~ 2.2 鱼会更多、更明显。
    density: 1.6,
    minFish: 10,
    maxFish: 32,
    // 屏幕面积 ÷ 该值 = 基础鱼数量。
    areaDivisor: 30000,
    // 游动速度范围（屏幕高度倍率/秒）。
    speedMin: 0.05,
    speedMax: 0.13,
    // 透明度范围（数值越大越显眼）。
    alphaMin: 0.6,
    alphaMax: 0.95,
  },
};

// 热带鱼品种：每一条装饰鱼会从下面随机选择外观。
export const TROPICAL_FISH_SPECIES = [
  {
    id: 'clownfish',
    name: '小丑鱼',
    shape: 'oval',
    body: '#ff8c42',
    belly: '#ffd9b0',
    fin: '#ff9d3f',
    tail: '#ffb25c',
    stripe: '#fff6e8',
    dark: '#3a241c',
    pattern: 'bands',
    bands: 3,
    spot: '#33241d',
    length: [0.036, 0.056],
  },
  {
    id: 'blue-tang',
    name: '蓝倒吊',
    shape: 'oval',
    body: '#2f6fd0',
    belly: '#8fc1ff',
    fin: '#2b5fb8',
    tail: '#ffd23f',
    stripe: '#163a75',
    dark: '#102a55',
    pattern: 'curve',
    bands: 1,
    spot: '#0e1f3d',
    length: [0.038, 0.06],
  },
  {
    id: 'yellow-tang',
    name: '黄高鳍刺尾鱼',
    shape: 'disc',
    body: '#ffd43a',
    belly: '#fff0a3',
    fin: '#f3b800',
    tail: '#f5b800',
    stripe: '#e8a200',
    dark: '#5b4a10',
    pattern: 'plain',
    bands: 0,
    spot: '#26210d',
    length: [0.036, 0.058],
  },
  {
    id: 'emperor-angelfish',
    name: '皇帝神仙鱼',
    shape: 'angelfish',
    body: '#2e6fca',
    belly: '#7bb8f5',
    fin: '#1f55a8',
    tail: '#f4b41a',
    stripe: '#f9e27a',
    dark: '#132f66',
    pattern: 'stripes',
    bands: 5,
    spot: '#101d3d',
    length: [0.044, 0.07],
  },
  {
    id: 'butterflyfish',
    name: '蝴蝶鱼',
    shape: 'disc',
    body: '#ffcf3f',
    belly: '#fff0a0',
    fin: '#f0a800',
    tail: '#f2b000',
    stripe: '#f5f0df',
    dark: '#332a14',
    pattern: 'eyespot',
    bands: 1,
    spot: '#242112',
    length: [0.034, 0.056],
  },
  {
    id: 'mandarinfish',
    name: '七彩麒麟鱼',
    shape: 'goby',
    body: '#2a9d7a',
    belly: '#8ee6c3',
    fin: '#1d7a61',
    tail: '#e66b3c',
    stripe: '#f49b35',
    dark: '#173f3c',
    pattern: 'wavy',
    bands: 4,
    spot: '#0f2b2e',
    length: [0.03, 0.048],
  },
];

// -----------------------------------------------------------------------------
// 参数持久化与运行时调整（设置面板直接修改这里的值，立即生效）
// -----------------------------------------------------------------------------

const TUNING_STORAGE_KEY = 'shark-parkour.tuning.v1';

export const DEFAULT_GAME_TUNING = JSON.parse(JSON.stringify(GAME_TUNING));

function applyPatch(target, patch) {
  if (!patch || typeof patch !== 'object') return;
  for (const key of Object.keys(target)) {
    if (!(key in patch)) continue;
    const value = patch[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      applyPatch(target[key], value);
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      target[key] = value;
    }
  }
}

export function updateTuning(patch) {
  applyPatch(GAME_TUNING, patch);
  try {
    localStorage.setItem(TUNING_STORAGE_KEY, JSON.stringify(GAME_TUNING));
  } catch {
    // 隐私模式下忽略持久化失败，参数仍会在当前页面生效。
  }
}

export function resetTuning() {
  applyPatch(GAME_TUNING, DEFAULT_GAME_TUNING);
  try {
    localStorage.removeItem(TUNING_STORAGE_KEY);
  } catch {
    // 忽略
  }
}

export function loadTuning() {
  try {
    const saved = localStorage.getItem(TUNING_STORAGE_KEY);
    if (saved) applyPatch(GAME_TUNING, JSON.parse(saved));
  } catch {
    // 无 localStorage 或数据损坏时使用默认值
  }
}

// 模块加载时恢复本机保存的参数。
loadTuning();
