// 鲨鱼图鉴：选择不同鲨鱼会自动绑定完全不同的专属能力与被动属性。
export const SHARKS = [
  {
    id: 'great-white',
    name: '大白鲨',
    en: 'Great White',
    emoji: '🦈',
    tagline: '冷静的猎手，咬碎前方一切',
    colors: {
      body: '#7f9db5',
      belly: '#eaf4f8',
      fin: '#5c86a6',
      glow: '#a8ddff',
      accent: '#0f6b9e',
    },
    variant: 'great-white',
    ability: {
      key: 'bite',
      icon: '🦷',
      name: '碎岩撕咬',
      short: '咬碎最近的前方障碍',
      desc: '自动锁定前方最近的障碍并一口咬碎，同时获得 0.6 秒护盾。',
      cooldown: 5.5,
      duration: 0.6,
    },
    passives: ['天生 4 颗生命之心', '咬碎的障碍会额外掉落珍珠'],
    stats: { speed: 100, hearts: 4, coin: 100, agility: 100, size: 105, armor: 0 },
  },
  {
    id: 'hammerhead',
    name: '锤头鲨',
    en: 'Hammerhead',
    emoji: '🔨',
    tagline: '声呐全开，危险统统变珍珠',
    colors: {
      body: '#82957f',
      belly: '#edf4e8',
      fin: '#5f7a5d',
      glow: '#c8f7a8',
      accent: '#5b8f3f',
    },
    variant: 'hammerhead',
    ability: {
      key: 'sonar',
      icon: '📡',
      name: '声呐脉冲',
      short: '把屏幕内障碍震成珍珠',
      desc: '释放一圈深海声呐，将当前屏幕内所有危险物震成可收集的珍珠。',
      cooldown: 8.0,
      duration: 0.4,
    },
    passives: ['珍珠自动吸附范围 +70%', '珍珠价值 +15%'],
    stats: { speed: 100, hearts: 3, coin: 115, agility: 104, size: 108, armor: 0 },
  },
  {
    id: 'mako',
    name: '灰鲭鲨',
    en: 'Shortfin Mako',
    emoji: '⚡',
    tagline: '海洋最快选手，冲刺即无敌',
    colors: {
      body: '#3f7fbf',
      belly: '#e3f3ff',
      fin: '#28639f',
      glow: '#7cd6ff',
      accent: '#1b6fd0',
    },
    variant: 'mako',
    ability: {
      key: 'dash',
      icon: '💨',
      name: '极速突进',
      short: '2 秒提速 80% 并无敌',
      desc: '爆发极速向前突进，持续 2 秒，期间提速 80% 且免疫所有伤害。',
      cooldown: 7.5,
      duration: 2.0,
    },
    passives: ['基础速度 +12%', '冲刺期间完全无敌'],
    stats: { speed: 112, hearts: 3, coin: 100, agility: 110, size: 96, armor: 0 },
  },
  {
    id: 'whale-shark',
    name: '鲸鲨',
    en: 'Whale Shark',
    emoji: '🐋',
    tagline: '温柔的巨兽，浮游虹吸专家',
    colors: {
      body: '#4d789e',
      belly: '#e9f5fc',
      fin: '#396184',
      glow: '#b7e6ff',
      accent: '#2f79a8',
    },
    variant: 'whale-shark',
    ability: {
      key: 'vacuum',
      icon: '🌀',
      name: '浮游虹吸',
      short: '3 秒内吸取全屏珍珠',
      desc: '张开巨口形成虹吸水流，3 秒内把全屏珍珠与奖励吸向自己。',
      cooldown: 6.5,
      duration: 3.0,
    },
    passives: ['珍珠价值 +25%', '珍珠吸附范围 +40%', '体型更大，碰撞判定更大'],
    stats: { speed: 95, hearts: 4, coin: 125, agility: 96, size: 132, armor: 0 },
  },
  {
    id: 'tiger-shark',
    name: '虎鲨',
    en: 'Tiger Shark',
    emoji: '🐅',
    tagline: '蛮力开路，还有概率格挡',
    colors: {
      body: '#7b8d80',
      belly: '#edf2e6',
      fin: '#586d5f',
      glow: '#ffd98a',
      accent: '#b8862c',
    },
    variant: 'tiger-shark',
    ability: {
      key: 'ram',
      icon: '💥',
      name: '蛮力冲撞',
      short: '冲开前方同一高度的障碍',
      desc: '向前猛冲，摧毁前方与自身同一高度带内的全部障碍，并短暂免疫伤害。',
      cooldown: 6.8,
      duration: 0.8,
    },
    passives: ['受到碰撞时 28% 概率格挡免伤', '撞碎的障碍会掉落珍珠'],
    stats: { speed: 100, hearts: 3, coin: 108, agility: 100, size: 110, armor: 28 },
  },
  {
    id: 'goblin-shark',
    name: '哥布林鲨',
    en: 'Goblin Shark',
    emoji: '👻',
    tagline: '深渊潜行者，幽灵穿墙',
    colors: {
      body: '#9a718c',
      belly: '#f3e4ef',
      fin: '#775270',
      glow: '#e2b7ff',
      accent: '#8d4f9c',
    },
    variant: 'goblin-shark',
    ability: {
      key: 'phase',
      icon: '👻',
      name: '深渊潜行',
      short: '2.8 秒幽灵化穿透障碍',
      desc: '潜入深渊相位，2.8 秒内变为幽灵状态，穿透一切障碍且不受伤。',
      cooldown: 7.2,
      duration: 2.8,
    },
    passives: ['转向与升降更灵敏 +18%', '受伤后的无敌时间延长至 2.4 秒'],
    stats: { speed: 102, hearts: 3, coin: 105, agility: 118, size: 100, armor: 0 },
  },
  {
    id: 'clownfish-player',
    name: '小丑鱼',
    en: 'Clownfish',
    emoji: '🐠',
    tagline: '小巧灵活，气泡护盾保护自己',
    isTropicalFish: true,
    speciesId: 'clownfish',
    colors: { body: '#ff8c42', belly: '#ffd9b0', fin: '#ff9d3f', glow: '#ffb37a', accent: '#ff6d2e' },
    variant: 'clownfish',
    ability: {
      key: 'bubble',
      icon: '🫧',
      name: '气泡护盾',
      short: '生成气泡护盾并免疫伤害',
      desc: '吐出大气泡包裹全身，3 秒内免疫伤害，适合在障碍密集时强行穿过。',
      cooldown: 7.5,
      duration: 3.0,
    },
    passives: ['体型最小，更不容易撞到障碍', '灵敏 +16%，升降更跟手'],
    stats: { speed: 108, hearts: 3, coin: 105, agility: 116, size: 82, armor: 0 },
  },
  {
    id: 'blue-tang-player',
    name: '蓝倒吊',
    en: 'Blue Tang',
    emoji: '🐟',
    tagline: '流线型身体，冲刺速度极快',
    isTropicalFish: true,
    speciesId: 'blue-tang',
    colors: { body: '#2f6fd0', belly: '#8fc1ff', fin: '#2b5fb8', glow: '#6fb4ff', accent: '#1d4fae' },
    variant: 'blue-tang',
    ability: {
      key: 'dash',
      icon: '💨',
      name: '蓝鳍冲刺',
      short: '1.8 秒提速并无敌',
      desc: '摆动蓝色尾鳍爆发冲刺，1.8 秒内提速 80% 并免疫伤害。',
      cooldown: 6.8,
      duration: 1.8,
    },
    passives: ['基础速度 +12%', '冲刺期间完全无敌'],
    stats: { speed: 112, hearts: 3, coin: 100, agility: 114, size: 88, armor: 0 },
  },
  {
    id: 'yellow-tang-player',
    name: '黄高鳍刺尾鱼',
    en: 'Yellow Tang',
    emoji: '🐡',
    tagline: '尾刺横扫，清空同一高度障碍',
    isTropicalFish: true,
    speciesId: 'yellow-tang',
    colors: { body: '#ffd43a', belly: '#fff0a3', fin: '#f3b800', glow: '#ffe77a', accent: '#d99e00' },
    variant: 'yellow-tang',
    ability: {
      key: 'ram',
      icon: '⚡',
      name: '尾刺横扫',
      short: '扫清前方同一高度障碍',
      desc: '用尾部骨刺横向扫过前方，摧毁与自身同一高度带内的全部障碍。',
      cooldown: 6.5,
      duration: 0.8,
    },
    passives: ['珍珠价值 +10%', '横扫障碍时会掉落额外珍珠'],
    stats: { speed: 102, hearts: 3, coin: 110, agility: 102, size: 92, armor: 0 },
  },
  {
    id: 'emperor-angelfish-player',
    name: '皇帝神仙鱼',
    en: 'Emperor Angelfish',
    emoji: '👑',
    tagline: '华丽鱼鳍吸引所有珍珠',
    isTropicalFish: true,
    speciesId: 'emperor-angelfish',
    colors: { body: '#2e6fca', belly: '#7bb8f5', fin: '#1f55a8', glow: '#8ec9ff', accent: '#16428f' },
    variant: 'emperor-angelfish',
    ability: {
      key: 'vacuum',
      icon: '🌀',
      name: '浮游虹吸',
      short: '2.8 秒吸取全屏珍珠',
      desc: '扇动华丽鱼鳍制造水流，2.8 秒内把全屏珍珠吸向自己。',
      cooldown: 6.4,
      duration: 2.8,
    },
    passives: ['珍珠价值 +22%', '珍珠吸附范围 +35%'],
    stats: { speed: 97, hearts: 3, coin: 122, agility: 100, size: 98, armor: 0 },
  },
  {
    id: 'butterflyfish-player',
    name: '蝴蝶鱼',
    en: 'Butterflyfish',
    emoji: '🦋',
    tagline: '鳞光波纹净化危险物',
    isTropicalFish: true,
    speciesId: 'butterflyfish',
    colors: { body: '#ffcf3f', belly: '#fff0a0', fin: '#f0a800', glow: '#ffe27a', accent: '#d99b00' },
    variant: 'butterflyfish',
    ability: {
      key: 'sonar',
      icon: '✨',
      name: '鳞光波纹',
      short: '把屏幕内障碍震成珍珠',
      desc: '抖动鳞片释放环形鳞光，把当前屏幕内的危险物全部震成珍珠。',
      cooldown: 7.8,
      duration: 0.4,
    },
    passives: ['珍珠自动吸附范围 +45%', '珍珠价值 +12%'],
    stats: { speed: 101, hearts: 3, coin: 112, agility: 118, size: 84, armor: 0 },
  },
  {
    id: 'mandarinfish-player',
    name: '七彩麒麟鱼',
    en: 'Mandarinfish',
    emoji: '🌈',
    tagline: '珊瑚迷彩，幽灵般穿过障碍',
    isTropicalFish: true,
    speciesId: 'mandarinfish',
    colors: { body: '#2a9d7a', belly: '#8ee6c3', fin: '#1d7a61', glow: '#7ef0c0', accent: '#147a5d' },
    variant: 'mandarinfish',
    ability: {
      key: 'phase',
      icon: '👻',
      name: '珊瑚迷彩',
      short: '2.6 秒幽灵化穿透障碍',
      desc: '切换珊瑚迷彩进入幽灵状态，2.6 秒内穿透一切障碍且不受伤。',
      cooldown: 7.0,
      duration: 2.6,
    },
    passives: ['受伤后无敌时间延长至 2.2 秒', '灵敏 +12%'],
    stats: { speed: 104, hearts: 3, coin: 112, agility: 112, size: 80, armor: 0 },
  },
];

export const MAX_STAT_VALUES = {
  speed: 120,
  hearts: 4,
  coin: 130,
  agility: 120,
  size: 135,
  armor: 35,
};

export const STAT_LABELS = {
  speed: '速度',
  hearts: '生命',
  coin: '珍珠',
  agility: '灵敏',
  size: '体型',
  armor: '格挡',
};

export function getShark(id) {
  return SHARKS.find((shark) => shark.id === id) || SHARKS[0];
}

export function loadSelectedShark() {
  try {
    const id = localStorage.getItem('shark-parkour.selected');
    return getShark(id);
  } catch {
    return SHARKS[0];
  }
}

export function saveSelectedShark(id) {
  try {
    localStorage.setItem('shark-parkour.selected', id);
  } catch {
    // 隐私模式下忽略存储失败
  }
}

export function loadBest(id) {
  try {
    return Number(localStorage.getItem(`shark-parkour.best.${id}`)) || 0;
  } catch {
    return 0;
  }
}

export function saveBest(id, score) {
  try {
    const previous = loadBest(id);
    if (score > previous) localStorage.setItem(`shark-parkour.best.${id}`, String(score));
  } catch {
    // 忽略
  }
}
