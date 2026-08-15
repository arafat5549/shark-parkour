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
