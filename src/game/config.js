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
    // 鱼群密度：1 为默认，调到 1.4 ~ 1.8 鱼会明显更多。
    density: 1.0,
    minFish: 6,
    maxFish: 20,
    // 屏幕面积 ÷ 该值 = 基础鱼数量。
    areaDivisor: 42000,
    // 游动速度范围（屏幕高度倍率/秒）。
    speedMin: 0.055,
    speedMax: 0.16,
    // 透明度范围。
    alphaMin: 0.34,
    alphaMax: 0.85,
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
    length: [0.024, 0.038],
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
    length: [0.026, 0.04],
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
    length: [0.025, 0.04],
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
    length: [0.03, 0.045],
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
    length: [0.024, 0.038],
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
    length: [0.02, 0.032],
  },
];
