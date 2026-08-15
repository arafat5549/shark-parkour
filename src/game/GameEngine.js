/* eslint-disable no-mixed-operators */
// 深海鲨鱼跑酷：Canvas 2D 引擎。所有图形均为程序化绘制，无外部素材，可离线运行。
import { GAME_TUNING, TROPICAL_FISH_SPECIES } from './config.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);

function hash01(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export class GameEngine {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.cb = callbacks;
    this.state = 'idle'; // idle | playing | paused | over
    this.shark = null;
    this.raf = 0;
    this.lastFrame = 0;
    this.time = 0;
    this.muted = false;
    this.audio = null;

    // 安全区（刘海屏 / 底部横条）
    this.safe = { top: 0, right: 0, bottom: 0, left: 0 };
    this.w = 1;
    this.h = 1;
    this.dpr = 1;

    this.bubbles = [];
    this.fish = [];
    this.rings = [];
    this.flashes = [];
    this.floatTexts = [];
    this.toasts = [];
    this.particles = [];

    this.pointers = new Map();
    this.input = { up: false, down: false };

    this.resize();
    this.bindEvents();
    this.initAmbient();

    this.raf = requestAnimationFrame(this.tick);
  }

  // ------------------------------------------------------------------ setup
  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    const css = getComputedStyle(document.documentElement);
    const num = (name) => {
      const value = parseFloat(css.getPropertyValue(name));
      return Number.isFinite(value) ? value : 0;
    };
    this.safe = {
      top: num('--sat'),
      right: num('--sar'),
      bottom: num('--sab'),
      left: num('--sal'),
    };
    this.w = rect.width;
    this.h = rect.height;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // 屏幕尺寸/方向变化后，按新尺寸重新布鱼。
    if (Array.isArray(this.fish) && this.fish.length) this.initTropicalFish();
  }

  bindEvents() {
    this.boundResize = () => this.resize();
    window.addEventListener('resize', this.boundResize);
    window.addEventListener('orientationchange', this.boundResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', this.boundResize);
    }
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(this.boundResize);
      this.resizeObserver.observe(this.canvas);
    }

    this.boundKeyDown = (e) => this.onKeyDown(e);
    this.boundKeyUp = (e) => this.onKeyUp(e);
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);

    this.boundPointerDown = (e) => this.onPointerDown(e);
    this.boundPointerMove = (e) => this.onPointerMove(e);
    this.boundPointerEnd = (e) => this.onPointerEnd(e);
    this.boundContext = (e) => e.preventDefault();
    this.canvas.addEventListener('pointerdown', this.boundPointerDown);
    this.canvas.addEventListener('pointermove', this.boundPointerMove);
    this.canvas.addEventListener('pointerup', this.boundPointerEnd);
    this.canvas.addEventListener('pointercancel', this.boundPointerEnd);
    this.canvas.addEventListener('contextmenu', this.boundContext);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.boundResize);
    window.removeEventListener('orientationchange', this.boundResize);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this.boundResize);
    }
    if (this.resizeObserver) this.resizeObserver.disconnect();
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    this.canvas.removeEventListener('pointerdown', this.boundPointerDown);
    this.canvas.removeEventListener('pointermove', this.boundPointerMove);
    this.canvas.removeEventListener('pointerup', this.boundPointerEnd);
    this.canvas.removeEventListener('pointercancel', this.boundPointerEnd);
    this.canvas.removeEventListener('contextmenu', this.boundContext);
  }

  setMuted(muted) {
    this.muted = muted;
  }

  unlockAudio() {
    if (!this.audio) {
      try {
        this.audio = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        this.audio = null;
      }
    }
    if (this.audio && this.audio.state === 'suspended') this.audio.resume();
  }

  // ------------------------------------------------------------------ game start
  startGame(shark) {
    this.shark = shark;
    this.state = 'playing';
    this.time = 0;
    this.distance = 0;
    this.pearls = 0;
    this.score = 0;
    this.hearts = shark.stats.hearts;
    this.maxHearts = shark.stats.hearts;
    this.pearlScore = 0;
    this.speed = 0;
    this.invuln = 0;
    this.hitFlash = 0;
    this.shake = 0;
    this.abilityCd = 0;
    this.abilityActive = null;
    this.abilityTimer = 0;
    this.dashTimer = 0;
    this.vacuumTimer = 0;
    this.phaseTimer = 0;
    this.spawnTimer = 2.0;
    this.patternCount = 0;
    this.coinRunCountdown = 5;
    this.playerY = this.h * 0.46;
    this.vy = 0;
    this.playerR = this.calcPlayerR();
    this.hazards = [];
    this.pickups = [];
    this.particles = [];
    this.rings = [];
    this.floatTexts = [];
    this.toasts = [];
    this.input = { up: false, down: false };
    this.pointers.clear();
    this.pushToast(`${shark.name} · ${shark.ability.name}已就绪`, shark.colors.glow);
  }

  calcPlayerR() {
    if (!this.shark) return 16;
    return clamp(this.h * 0.052, 13, 25) * (this.shark.stats.size / 100);
  }

  pause() {
    if (this.state === 'playing') this.state = 'paused';
  }

  resume() {
    if (this.state === 'paused') {
      this.state = 'playing';
      this.lastFrame = performance.now();
    }
  }

  backToMenu() {
    this.state = 'idle';
    this.hazards = [];
    this.pickups = [];
    this.particles = [];
    this.rings = [];
    this.floatTexts = [];
    this.toasts = [];
    this.pointers.clear();
    this.input = { up: false, down: false };
  }

  // ------------------------------------------------------------------ input
  pointFromEvent(e) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  abilityButton() {
    const r = this.abilityButtonR();
    return {
      x: this.w - r - 16 - this.safe.right,
      y: this.h - r - 18 - this.safe.bottom,
      r,
    };
  }

  abilityButtonR() {
    return clamp(Math.min(this.w, this.h) * 0.105, 40, 56);
  }

  isInAbilityButton(p) {
    const b = this.abilityButton();
    const dx = p.x - b.x;
    const dy = p.y - b.y;
    return Math.sqrt(dx * dx + dy * dy) <= b.r * 1.25;
  }

  onPointerDown(e) {
    this.unlockAudio();
    if (this.state !== 'playing') return;
    e.preventDefault();
    const p = this.pointFromEvent(e);
    const inButton = this.isInAbilityButton(p);
    if (inButton) {
      this.pointers.set(e.pointerId, { x: p.x, y: p.y, ability: true });
      this.triggerAbility();
    } else {
      this.pointers.set(e.pointerId, { x: p.x, y: p.y, ability: false });
    }
    this.refreshInput();
  }

  onPointerMove(e) {
    const p = this.pointFromEvent(e);
    const item = this.pointers.get(e.pointerId);
    if (item) {
      item.x = p.x;
      item.y = p.y;
    }
  }

  onPointerEnd(e) {
    this.pointers.delete(e.pointerId);
    this.refreshInput();
  }

  refreshInput() {
    let up = false;
    for (const item of this.pointers.values()) {
      if (!item.ability) up = true;
    }
    this.input.up = up;
  }

  onKeyDown(e) {
    if (this.state !== 'playing') return;
    if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
      e.preventDefault();
      this.input.up = true;
      this.unlockAudio();
    }
    if (['ArrowDown', 'KeyS'].includes(e.code)) {
      e.preventDefault();
      this.input.down = true;
    }
    if (['KeyX', 'ShiftLeft', 'ShiftRight', 'KeyJ'].includes(e.code)) {
      e.preventDefault();
      this.unlockAudio();
      this.triggerAbility();
    }
  }

  onKeyUp(e) {
    if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) this.input.up = false;
    if (['ArrowDown', 'KeyS'].includes(e.code)) this.input.down = false;
  }

  // ------------------------------------------------------------------ loop
  tick = (now) => {
    if (!this.lastFrame) this.lastFrame = now;
    let dt = Math.min((now - this.lastFrame) / 1000, 1 / 30);
    this.lastFrame = now;
    if (this.state === 'paused') dt = 0;
    if (this.state === 'playing') {
      this.time += dt;
      this.update(dt);
    } else if (this.state === 'idle') {
      this.time += dt;
      this.updateAmbient(dt);
    } else if (this.state === 'over') {
      this.updateParticles(dt);
      this.updateTropicalFish(dt);
    }
    this.draw();
    this.raf = requestAnimationFrame(this.tick);
  };

  updateAmbient(dt) {
    this.updateBubbles(dt);
    this.updateTropicalFish(dt);
    this.updateParticles(dt);
    this.updateRings(dt);
    for (let i = this.floatTexts.length - 1; i >= 0; i--) {
      this.floatTexts[i].t -= dt;
      if (this.floatTexts[i].t <= 0) this.floatTexts.splice(i, 1);
    }
  }

  // ------------------------------------------------------------------ update
  update(dt) {
    const shark = this.shark;
    const h = this.h;

    // 速度与难度（系数见 src/game/config.js）
    const tuning = GAME_TUNING;
    const base = h * tuning.baseSpeed;
    const ramp = Math.min(tuning.maxSpeedRamp, this.distance / (h * tuning.speedRampDistanceDivisor));
    const diff = clamp(this.distance / (h * 34), 0, 1);
    let speed = base * (1 + ramp) * (shark.stats.speed / 100);
    if (this.dashTimer > 0) speed *= 1.8;
    this.speed = speed;
    this.distance += speed * dt;
    this.score = Math.floor(this.distance / 10) + this.pearlScore;

    // 玩家物理：按住上浮，松开下潜；S/下方向可主动下潜。
    // gravity / lift / dive / drag / maxSinkSpeed 均为 config.js 中可调系数。
    const agility = shark.stats.agility / 100;
    const lift = h * tuning.lift * agility;
    const gravity = h * tuning.gravity;
    const dive = h * tuning.dive * agility;
    let acc = gravity;
    if (this.input.up) acc -= lift;
    if (this.input.down) acc += dive;
    this.vy += acc * dt;
    this.vy -= this.vy * tuning.drag * dt;
    const maxUp = h * tuning.maxRiseSpeed;
    const maxDown = h * tuning.maxSinkSpeed;
    this.vy = clamp(this.vy, -maxUp, maxDown);
    this.playerY += this.vy * dt;
    const topLimit = 26 + this.safe.top + this.playerR;
    const bottomLimit = this.floorY() - this.playerR - 8;
    this.playerY = clamp(this.playerY, topLimit, bottomLimit);

    // 能力计时
    if (this.abilityCd > 0) this.abilityCd = Math.max(0, this.abilityCd - dt);
    if (this.invuln > 0) this.invuln -= dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;
    if (this.shake > 0) this.shake -= dt;
    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      this.spawnBubbleTrail();
    }
    if (this.vacuumTimer > 0) this.vacuumTimer -= dt;
    if (this.phaseTimer > 0) this.phaseTimer -= dt;
    if (this.abilityTimer > 0) {
      this.abilityTimer -= dt;
      if (this.abilityTimer <= 0) this.abilityActive = null;
    }

    // 生成
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnPattern();
      this.patternCount += 1;
      const interval = rand(0.84, 1.28) * lerp(1.06, 0.88, diff);
      this.spawnTimer = Math.max(0.62, interval);
    }

    // 障碍与拾取物
    this.updateHazards(dt);
    this.updatePickups(dt);
    this.checkCollisions();

    // 粒子/特效
    this.updateBubbles(dt);
    this.updateTropicalFish(dt);
    this.updateParticles(dt);
    this.updateRings(dt);
    for (let i = this.floatTexts.length - 1; i >= 0; i--) {
      this.floatTexts[i].t -= dt;
      this.floatTexts[i].y -= h * 0.18 * dt;
      if (this.floatTexts[i].t <= 0) this.floatTexts.splice(i, 1);
    }
    for (let i = this.toasts.length - 1; i >= 0; i--) {
      this.toasts[i].t -= dt;
      if (this.toasts[i].t <= 0) this.toasts.splice(i, 1);
    }

    // 自动吸附（鲨鱼被动能力）
    if (this.shark) {
      const magnetR = this.magnetRadius();
      for (const p of this.pickups) {
        const dx = this.playerX() - p.x;
        const dy = this.playerY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < magnetR || this.vacuumTimer > 0) {
          const pull = (this.vacuumTimer > 0 ? 8.5 : 3.6) * dt;
          const step = Math.min(1, pull * (this.vacuumTimer > 0 ? 2.2 : 1));
          p.x += dx * step;
          p.y += dy * step;
        }
      }
    }
  }

  floorY() {
    return this.h - Math.max(42, this.h * 0.13);
  }

  playerX() {
    return clamp(this.w * 0.24, 64, 170);
  }

  magnetRadius() {
    const base = this.h * 0.15;
    if (!this.shark) return base;
    let mult = 1;
    if (this.shark.id === 'hammerhead') mult = 1.7;
    if (this.shark.id === 'whale-shark') mult = 1.4;
    return base * mult;
  }

  // ------------------------------------------------------------------ spawn
  minGap() {
    const diff = clamp(this.distance / (this.h * 34), 0, 1);
    return clamp(this.h * (0.34 - diff * 0.055), 138, this.h * 0.48);
  }

  spawnPattern() {
    const x0 = this.w + 80;
    const diff = clamp(this.distance / (this.h * 34), 0, 1);
    const options = ['rock', 'corridor', 'mines', 'jelly', 'rock'];
    if (this.coinRunCountdown <= 0) {
      this.spawnCoinRun(x0);
      this.coinRunCountdown = 5 + Math.floor(rand(3, 7));
      return;
    }
    this.coinRunCountdown -= 1;
    if (diff > 0.35) options.push('jelly', 'mines');
    if (diff > 0.62) options.push('corridor');
    const mode = options[Math.floor(Math.random() * options.length)];
    if (mode === 'rock') this.spawnRockPattern(x0);
    else if (mode === 'corridor') this.spawnCorridor(x0);
    else if (mode === 'mines') this.spawnMines(x0);
    else if (mode === 'jelly') this.spawnJelly(x0);
  }

  spawnRockPattern(x0) {
    const h = this.h;
    const side = Math.random() < 0.5 ? 'top' : 'bottom';
    const gap = this.minGap();
    const maxH = h - gap - Math.max(50, h * 0.12);
    const height = rand(h * 0.16, Math.max(h * 0.2, maxH));
    const width = rand(52, Math.min(120, this.w * 0.34));
    const rock = this.spawnRock(x0, side, height, width);
    this.spawnPearlLine(x0 + width + 12, side === 'top' ? height + gap * 0.5 : h - height - gap * 0.5, 4, 'arc');
    return rock;
  }

  spawnCorridor(x0) {
    const h = this.h;
    const gap = this.minGap();
    let topH = rand(h * 0.12, h * 0.30);
    let bottomH = rand(h * 0.12, h * 0.30);
    const remain = h - topH - bottomH;
    if (remain < gap) {
      const extra = (gap - remain) / 2 + 10;
      topH = Math.max(h * 0.09, topH - extra);
      bottomH = Math.max(h * 0.09, bottomH - extra);
    }
    const topH2 = Math.max(h * 0.09, topH);
    const bottomH2 = Math.max(h * 0.09, bottomH);
    const width = rand(58, Math.min(128, this.w * 0.36));
    const width2 = rand(58, Math.min(128, this.w * 0.36));
    this.spawnRock(x0, 'top', topH2, width);
    this.spawnRock(x0, 'bottom', bottomH2, width2);
    const pathY = topH2 + (h - topH2 - bottomH2) / 2;
    this.spawnPearlLine(x0 + Math.max(width, width2) * 0.5, pathY, 5, 'line');
  }

  spawnMines(x0) {
    const h = this.h;
    const count = 2 + (this.distance > this.h * 22 ? 1 : 0);
    const spacing = clamp(this.speed * 0.5, h * 0.42, this.w * 0.62);
    let lastY = rand(h * 0.24, h * 0.46);
    for (let i = 0; i < count; i++) {
      const x = x0 + i * spacing;
      let y = lastY + rand(h * 0.20, h * 0.34) * (Math.random() < 0.5 ? -1 : 1);
      y = clamp(y, h * 0.2, h * 0.78);
      lastY = y;
      const r = clamp(h * 0.028, 11, 20);
      this.hazards.push({
        kind: 'mine', x, y, r, baseY: y, phase: rand(0, TAU), bob: rand(6, 14), alive: true,
      });
    }
    this.spawnPearlLine(x0 + spacing * 0.5, clamp((this.playerY + h * 0.5) / 2, h * 0.22, h * 0.7), count + 2, 'wave');
  }

  spawnJelly(x0) {
    const h = this.h;
    const spacing = clamp(this.speed * 0.75, h * 0.6, this.w * 1.1);
    const count = Math.random() < 0.55 ? 1 : 2;
    for (let i = 0; i < count; i++) {
      const x = x0 + i * spacing;
      const y = rand(h * 0.26, h * 0.72);
      const r = clamp(h * 0.05, 20, 36);
      this.hazards.push({
        kind: 'jelly', x, y, r, baseY: y, phase: rand(0, TAU), amp: rand(h * 0.05, h * 0.11),
        speed: rand(1.1, 1.8), alive: true,
      });
    }
    this.spawnPearlLine(x0 + spacing * 0.5, h * 0.52, 5, 'arc');
  }

  spawnCoinRun(x0) {
    const h = this.h;
    const y = rand(h * 0.3, h * 0.68);
    this.spawnPearlLine(x0, y, 10, 'sine');
  }

  spawnRock(x, side, height, width) {
    const rock = {
      kind: 'rock',
      x,
      y: side === 'top' ? 0 : this.h - height,
      w: width,
      h: height,
      side,
      seed: Math.floor(Math.random() * 1000),
      coral: Math.random() < 0.32,
      alive: true,
    };
    this.hazards.push(rock);
    return rock;
  }

  spawnPearlLine(x, y, count, style) {
    const spacing = clamp(this.h * 0.12, 46, 90);
    for (let i = 0; i < count; i++) {
      let yy = y;
      if (style === 'arc') yy = y - Math.sin((i / (count - 1)) * Math.PI) * this.h * 0.09;
      if (style === 'wave') yy = y + Math.sin(i * 1.15) * this.h * 0.07;
      if (style === 'sine') yy = y + Math.sin(i * 0.8) * this.h * 0.08;
      this.pickups.push({
        kind: 'pearl', x: x + i * spacing, y: yy, r: clamp(this.h * 0.021, 8, 13),
        phase: rand(0, TAU), value: 1, pulled: false,
      });
    }
    // 低血量时低概率出现生命奖励
    if (this.hearts < this.maxHearts && Math.random() < 0.12) {
      this.pickups.push({
        kind: 'heart', x: x + count * spacing + 24, y: clamp(y, 40, this.h - 40), r: 13,
        phase: 0, value: 0,
      });
    }
  }

  spawnPearlsAt(x, y, count = 4) {
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const r = rand(6, 38);
      this.pickups.push({
        kind: 'pearl', x: x + Math.cos(a) * r, y: y + Math.sin(a) * r,
        r: clamp(this.h * 0.021, 8, 13), phase: rand(0, TAU), value: 1,
      });
    }
  }

  // ------------------------------------------------------------------ hazards/pickups
  updateHazards(dt) {
    const h = this.h;
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const o = this.hazards[i];
      o.x -= this.speed * dt;
      if (o.kind === 'mine') {
        o.y = o.baseY + Math.sin(this.time * o.bob + o.phase) * h * 0.018;
      } else if (o.kind === 'jelly') {
        o.y = o.baseY + Math.sin(this.time * o.speed + o.phase) * o.amp;
      }
      if (o.x + Math.max(o.w || 0, (o.r || 0) * 2) < -120) {
        this.hazards.splice(i, 1);
      }
    }
  }

  updatePickups(dt) {
    const h = this.h;
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.x -= this.speed * dt;
      p.phase += dt * 3;
      if (p.x < -60 || p.y < -80 || p.y > h + 80) {
        this.pickups.splice(i, 1);
      }
    }
  }

  checkCollisions() {
    const px = this.playerX();
    const py = this.playerY;
    const pr = this.playerR;

    // 拾取
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      const dx = px - p.x;
      const dy = py - p.y;
      if (Math.sqrt(dx * dx + dy * dy) < pr + p.r + 5) {
        this.collectPickup(p, i);
      }
    }

    if (this.invuln > 0 || this.phaseTimer > 0) return;

    // 障碍碰撞
    for (const o of this.hazards) {
      if (!o.alive) continue;
      if (o.kind === 'rock' || o.kind === 'coral') {
        if (this.circleRectHit(px, py, pr * 0.78, o.x + 7, o.y + 7, o.w - 14, o.h - 14)) {
          this.hitHazard(o);
          break;
        }
      } else {
        const dx = px - o.x;
        const dy = py - o.y;
        const rr = (o.r || 16) * 0.78 + pr * 0.78;
        if (Math.sqrt(dx * dx + dy * dy) < rr) {
          this.hitHazard(o);
          break;
        }
      }
    }
  }

  circleRectHit(cx, cy, r, rx, ry, rw, rh) {
    if (rw <= 0 || rh <= 0) return false;
    const nx = clamp(cx, rx, rx + rw);
    const ny = clamp(cy, ry, ry + rh);
    const dx = cx - nx;
    const dy = cy - ny;
    return dx * dx + dy * dy < r * r;
  }

  collectPickup(p, index) {
    this.pickups.splice(index, 1);
    if (p.kind === 'heart') {
      this.hearts = Math.min(this.maxHearts, this.hearts + 1);
      this.pushFloatText('+1 ❤️', '#ff8fa3', p.x, p.y);
      this.sound('heal');
      this.spawnParticles(p.x, p.y, '#ff8fa3', 8);
      return;
    }
    const coinMult = this.shark.stats.coin / 100;
    const value = Math.round(15 * coinMult);
    this.pearls += 1;
    this.pearlScore += value;
    this.score = Math.floor(this.distance / 10) + this.pearlScore;
    this.pushFloatText(`+${value}`, '#c9f2ff', p.x, p.y);
    this.spawnParticles(p.x, p.y, '#bff0ff', 5);
    this.sound('coin');
  }

  hitHazard(o) {
    const shark = this.shark;
    // 虎鲨被动：概率格挡
    if (shark.stats.armor > 0 && Math.random() * 100 < shark.stats.armor) {
      this.invuln = Math.max(this.invuln, 0.9);
      this.shake = 0.35;
      this.pushFloatText('格挡！', '#ffd98a', o.x, o.y);
      this.destroyHazard(o, '#ffd98a');
      this.sound('block');
      return;
    }

    this.hearts -= 1;
    this.hitFlash = 0.5;
    this.shake = 0.6;
    const baseInvuln = shark.id === 'goblin-shark' ? 2.4 : 1.8;
    this.invuln = baseInvuln;
    this.pushFloatText('受伤！', '#ff7b8a', o.x, o.y);
    this.destroyHazard(o, '#ff6b6b');
    this.sound('hurt');

    if (this.hearts <= 0) {
      this.hearts = 0;
      this.state = 'over';
      this.pushToast('被深海吞没了…', '#ff8fa3');
      this.sound('over');
      if (this.cb.onGameOver) {
        this.cb.onGameOver({
          sharkId: shark.id,
          score: this.score,
          pearls: this.pearls,
          distance: this.distance,
        });
      }
    }
  }

  destroyHazard(o, color) {
    if (!o.alive) return;
    o.alive = false;
    const x = o.kind === 'rock' ? o.x + o.w / 2 : o.x;
    const y = o.kind === 'rock' ? (o.side === 'top' ? o.h : this.h - o.h) : o.y;
    this.spawnParticles(x, y, color, o.kind === 'rock' ? 16 : 10);
    const drop = this.shark && (this.shark.id === 'great-white' || this.shark.id === 'tiger-shark' || this.shark.ability.key === 'sonar');
    if (drop) this.spawnPearlsAt(x, y, o.kind === 'rock' ? 5 : 3);
    const idx = this.hazards.indexOf(o);
    if (idx >= 0) this.hazards.splice(idx, 1);
  }

  // ------------------------------------------------------------------ ability
  triggerAbility() {
    if (this.state !== 'playing' || !this.shark) return;
    if (this.abilityCd > 0) {
      this.pushToast('能力冷却中…', '#9fd8ff');
      return;
    }
    const key = this.shark.ability.key;
    const ability = this.shark.ability;

    if (key === 'bite') {
      const target = this.nearestHazardAhead(0.62);
      if (!target) {
        this.pushToast('前方没有可咬碎的障碍', '#9fd8ff');
        return;
      }
      this.abilityCd = ability.cooldown;
      this.abilityActive = key;
      this.abilityTimer = 0.25;
      this.destroyHazard(target, '#ffe6a8');
      this.spawnPearlsAt(target.x + (target.w || 0) / 2, this.playerY, 5);
      this.invuln = Math.max(this.invuln, 0.6);
      this.rings.push({ x: target.x, y: target.y, r: 10, max: 80, t: 0.45, color: '#ffe6a8' });
      this.pushFloatText('咔嚓！', '#ffe6a8', target.x, target.y);
      this.sound('bite');
      return;
    }

    if (key === 'sonar') {
      const targets = this.hazards.filter((o) => o.x > -50 && o.x < this.w + 80);
      if (!targets.length) {
        this.pushToast('声呐范围内没有危险物', '#c8f7a8');
        return;
      }
      this.abilityCd = ability.cooldown;
      this.abilityActive = key;
      this.abilityTimer = 0.45;
      for (const o of targets) {
        const x = o.kind === 'rock' ? o.x + o.w / 2 : o.x;
        const y = o.kind === 'rock' ? (o.side === 'top' ? o.h : this.h - o.h) : o.y;
        this.spawnPearlsAt(x, y, 5);
        this.spawnParticles(x, y, '#c8f7a8', 6);
        const idx = this.hazards.indexOf(o);
        if (idx >= 0) this.hazards.splice(idx, 1);
      }
      this.rings.push({ x: this.playerX(), y: this.playerY, r: 20, max: Math.max(this.w, this.h) * 1.4, t: 0.7, color: '#c8f7a8' });
      this.pushFloatText('全屏净化！', '#c8f7a8', this.playerX(), this.playerY - 40);
      this.sound('sonar');
      return;
    }

    if (key === 'dash') {
      this.abilityCd = ability.cooldown;
      this.abilityActive = key;
      this.abilityTimer = ability.duration;
      this.dashTimer = ability.duration;
      this.invuln = Math.max(this.invuln, ability.duration + 0.25);
      this.shake = 0.25;
      this.pushFloatText('极速突进！', '#7cd6ff', this.playerX(), this.playerY - 44);
      this.sound('dash');
      return;
    }

    if (key === 'vacuum') {
      this.abilityCd = ability.cooldown;
      this.abilityActive = key;
      this.abilityTimer = ability.duration;
      this.vacuumTimer = ability.duration;
      this.rings.push({ x: this.playerX(), y: this.playerY, r: 20, max: this.h * 1.1, t: 0.7, color: '#b7e6ff' });
      this.pushFloatText('浮游虹吸！', '#b7e6ff', this.playerX(), this.playerY - 44);
      this.sound('vacuum');
      return;
    }

    if (key === 'ram') {
      const band = this.h * 0.17;
      const targets = this.hazards.filter((o) => {
        const y = o.kind === 'rock' ? (o.side === 'top' ? o.h : this.h - o.h) : o.y;
        return o.x + (o.w || 0) / 2 > this.playerX() - 30 && o.x < this.w + 120 && Math.abs(y - this.playerY) <= band;
      });
      if (!targets.length) {
        this.pushToast('当前高度前方没有障碍', '#ffd98a');
        return;
      }
      this.abilityCd = ability.cooldown;
      this.abilityActive = key;
      this.abilityTimer = 0.6;
      this.invuln = Math.max(this.invuln, 0.85);
      for (const o of targets) {
        this.destroyHazard(o, '#ffd98a');
        this.spawnPearlsAt(o.x + (o.w || 0) / 2, o.y || this.playerY, 3);
      }
      this.rings.push({ x: this.playerX(), y: this.playerY, r: 20, max: this.w * 0.9, t: 0.45, color: '#ffd98a' });
      this.shake = 0.4;
      this.pushFloatText('蛮力冲撞！', '#ffd98a', this.playerX(), this.playerY - 44);
      this.sound('ram');
      return;
    }

    if (key === 'phase') {
      this.abilityCd = ability.cooldown;
      this.abilityActive = key;
      this.abilityTimer = ability.duration;
      this.phaseTimer = ability.duration;
      this.rings.push({ x: this.playerX(), y: this.playerY, r: 20, max: this.h * 0.8, t: 0.6, color: '#e2b7ff' });
      this.pushFloatText('深渊潜行！', '#e2b7ff', this.playerX(), this.playerY - 44);
      this.sound('phase');
      return;
    }
  }

  nearestHazardAhead(maxRatio = 0.62) {
    const px = this.playerX();
    const maxDist = this.w * maxRatio;
    let best = null;
    let bestDist = Infinity;
    for (const o of this.hazards) {
      if (!o.alive) continue;
      const x = o.kind === 'rock' ? o.x + o.w / 2 : o.x;
      const d = x - px;
      if (d > -20 && d < maxDist) {
        if (d < bestDist) {
          bestDist = d;
          best = o;
        }
      }
    }
    return best;
  }

  // ------------------------------------------------------------------ particles/fx
  initAmbient() {
    this.bubbles = [];
    const count = Math.floor(clamp((this.w * this.h) / 22000, 18, 56));
    for (let i = 0; i < count; i++) {
      this.bubbles.push(this.makeBubble(true));
    }
    this.initTropicalFish();
  }

  initTropicalFish() {
    this.fish = [];
    const desired = this.desiredFishCount();
    for (let i = 0; i < desired; i++) {
      this.fish.push(this.makeTropicalFish(true));
    }
  }

  desiredFishCount() {
    const cfg = GAME_TUNING.tropicalFish;
    const count = Math.round(((this.w * this.h) / cfg.areaDivisor) * cfg.density);
    return Math.floor(clamp(count, cfg.minFish, cfg.maxFish));
  }

  makeTropicalFish(anywhere = false) {
    const cfg = GAME_TUNING.tropicalFish;
    const species = TROPICAL_FISH_SPECIES[Math.floor(Math.random() * TROPICAL_FISH_SPECIES.length)];
    const h = this.h;
    const layer = rand(0.12, 0.95);
    const length = rand(species.length[0], species.length[1]) * h;
    const dir = Math.random() < 0.5 ? -1 : 1;
    const speed = h * lerp(cfg.speedMin, cfg.speedMax, layer);
    const top = 30 + this.safe.top;
    const bottom = this.floorY() - length * 0.7;
    const y = rand(top + length * 0.5, Math.max(top + length * 0.6, bottom));
    return {
      species,
      x: anywhere ? rand(-length, this.w + length) : (dir > 0 ? -length * 1.6 : this.w + length * 1.6),
      baseY: y,
      y,
      dir,
      length,
      layer,
      speed,
      phase: rand(0, TAU),
      wobble: rand(0.7, 1.8),
      bobAmp: rand(3, 12) * (0.35 + layer * 0.65),
      alpha: lerp(cfg.alphaMin, cfg.alphaMax, layer),
    };
  }

  updateTropicalFish(dt) {
    const cfg = GAME_TUNING.tropicalFish;
    if (!cfg.enabled) {
      if (this.fish.length) this.fish = [];
      return;
    }
    const desired = this.desiredFishCount();
    while (this.fish.length < desired) this.fish.push(this.makeTropicalFish(false));
    while (this.fish.length > desired) this.fish.pop();

    for (let i = this.fish.length - 1; i >= 0; i--) {
      const f = this.fish[i];
      f.x += f.dir * f.speed * dt;
      f.phase += f.wobble * dt;
      f.y = f.baseY + Math.sin(f.phase) * f.bobAmp;
      const margin = f.length * 1.8;
      if (f.dir > 0 && f.x > this.w + margin) {
        f.x = -margin;
        f.baseY = this.randomFishY(f.length);
      } else if (f.dir < 0 && f.x < -margin) {
        f.x = this.w + margin;
        f.baseY = this.randomFishY(f.length);
      }
    }
  }

  randomFishY(length = 20) {
    const top = 30 + this.safe.top + length * 0.5;
    const bottom = this.floorY() - length * 0.7;
    return rand(top, Math.max(top + 2, bottom));
  }

  makeBubble(anywhere = false) {
    const h = this.h;
    return {
      x: rand(0, this.w),
      y: anywhere ? rand(0, h) : h + rand(10, 40),
      r: rand(1.5, 5.5),
      rise: rand(18, 52),
      drift: rand(-8, 8),
      phase: rand(0, TAU),
    };
  }

  updateBubbles(dt) {
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.y -= b.rise * dt;
      b.x += b.drift * dt + Math.sin(this.time * 1.4 + b.phase) * 8 * dt;
      if (b.y < -10) {
        this.bubbles[i] = this.makeBubble(false);
      }
    }
    while (this.bubbles.length < Math.floor(clamp((this.w * this.h) / 22000, 18, 56))) {
      this.bubbles.push(this.makeBubble(false));
    }
  }

  spawnBubbleTrail() {
    if (Math.random() < 0.65) {
      this.bubbles.push({
        x: this.playerX() - this.playerR,
        y: this.playerY + rand(-6, 6),
        r: rand(1.5, 3.5),
        rise: rand(20, 40),
        drift: rand(-2, 2),
        phase: rand(0, TAU),
      });
    }
  }

  spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const sp = rand(30, 150);
      this.particles.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        r: rand(1.5, 4),
        t: rand(0.25, 0.7),
        life: rand(0.25, 0.7),
        color,
      });
    }
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 140 * dt;
      p.t -= dt;
      if (p.t <= 0) this.particles.splice(i, 1);
    }
  }

  updateRings(dt) {
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const ring = this.rings[i];
      ring.t -= dt;
      ring.r += (ring.max - ring.r) * 7 * dt;
      if (ring.t <= 0) this.rings.splice(i, 1);
    }
  }

  pushFloatText(text, color, x, y) {
    this.floatTexts.push({ text, color, x, y, t: 0.9, life: 0.9 });
  }

  pushToast(text, color = '#9fd8ff') {
    this.toasts = this.toasts.filter((t) => t.text !== text);
    this.toasts.push({ text, color, t: 1.5 });
    if (this.toasts.length > 2) this.toasts.shift();
  }

  // ------------------------------------------------------------------ sound
  tone(freq, dur, type = 'sine', vol = 0.08, when = 0, slide = 0) {
    if (!this.audio || this.muted) return;
    const t0 = this.audio.currentTime + when;
    const osc = this.audio.createOscillator();
    const gain = this.audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slide), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.audio.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  sound(name) {
    if (!this.audio || this.muted) return;
    if (name === 'coin') {
      this.tone(720, 0.08, 'sine', 0.05);
      this.tone(1080, 0.1, 'sine', 0.035, 0.04);
    } else if (name === 'heal') {
      this.tone(520, 0.12, 'sine', 0.06);
      this.tone(780, 0.16, 'sine', 0.05, 0.08);
    } else if (name === 'hurt') {
      this.tone(180, 0.2, 'sawtooth', 0.06, 0, 80);
    } else if (name === 'block') {
      this.tone(360, 0.1, 'square', 0.04, 0, 520);
    } else if (name === 'bite') {
      this.tone(240, 0.12, 'square', 0.05, 0, 90);
    } else if (name === 'sonar') {
      this.tone(440, 0.55, 'sine', 0.05, 0, 1320);
    } else if (name === 'dash') {
      this.tone(320, 0.3, 'sawtooth', 0.04, 0, 980);
    } else if (name === 'vacuum') {
      this.tone(200, 0.5, 'sine', 0.05, 0, 640);
    } else if (name === 'ram') {
      this.tone(160, 0.22, 'square', 0.06, 0, 60);
    } else if (name === 'phase') {
      this.tone(620, 0.4, 'sine', 0.04, 0, 180);
    } else if (name === 'over') {
      this.tone(240, 0.5, 'sawtooth', 0.06, 0, 70);
      this.tone(160, 0.8, 'sine', 0.05, 0.15, 50);
    }
  }

  // ------------------------------------------------------------------ draw
  draw() {
    const { ctx, w, h } = this;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    if (this.shake > 0) {
      const amp = this.shake * 12;
      ctx.translate(rand(-amp, amp), rand(-amp, amp));
    }
    this.drawBackground();
    if (this.state !== 'idle') {
      this.drawTropicalFish('far');
      this.drawHazards();
      this.drawPickups();
      this.drawTropicalFish('near');
      this.drawShark();
    } else {
      this.drawTropicalFish('far');
      this.drawAmbientShark();
      this.drawTropicalFish('near');
    }
    this.drawParticles();
    this.drawRings();
    this.drawBubbles();
    if (this.state !== 'idle') this.drawHUD();
    this.drawFloatTexts();
    if (this.hitFlash > 0) {
      ctx.fillStyle = `rgba(255,60,70,${(this.hitFlash / 0.5) * 0.18})`;
      ctx.fillRect(-20, -20, w + 40, h + 40);
    }
    ctx.restore();
  }

  drawBackground() {
    const { ctx, w, h } = this;
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#02182a');
    gradient.addColorStop(0.42, '#04304f');
    gradient.addColorStop(0.78, '#023354');
    gradient.addColorStop(1, '#01253f');
    ctx.fillStyle = gradient;
    ctx.fillRect(-20, -20, w + 40, h + 40);

    // 顶部光晕
    const glow = ctx.createRadialGradient(w * 0.5, -h * 0.08, 10, w * 0.5, -h * 0.08, Math.max(w, h) * 0.8);
    glow.addColorStop(0, 'rgba(80,180,220,0.18)');
    glow.addColorStop(1, 'rgba(80,180,220,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-20, -20, w + 40, h + 40);

    // 光线
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
      const baseX = w * (0.06 + i * 0.23);
      const width = h * (0.035 + hash01(i + 3) * 0.04);
      const sway = Math.sin(this.time * 0.16 + i * 1.7) * w * 0.015;
      const grad = ctx.createLinearGradient(baseX, 0, baseX, h);
      grad.addColorStop(0, 'rgba(130,210,235,0.11)');
      grad.addColorStop(1, 'rgba(130,210,235,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(baseX + sway, -10);
      ctx.lineTo(baseX + width + sway, -10);
      ctx.lineTo(baseX + width * 1.8 + sway, h + 20);
      ctx.lineTo(baseX - width * 1.2 + sway, h + 20);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 远景剪影
    this.drawRidge(0.12, 'rgba(3,22,36,0.62)', h * 0.72, h * 0.16, 180);
    this.drawRidge(0.22, 'rgba(2,16,27,0.72)', h * 0.80, h * 0.13, 145);
    // 海底沙地
    this.drawSeaFloor();
    // 海藻
    this.drawKelp();
  }

  drawRidge(factor, color, baseY, amp, spacing) {
    const { ctx, w, h } = this;
    const scroll = (this.distance || 0) * factor;
    const phase = scroll % spacing;
    const start = Math.floor(-phase / spacing) - 1;
    const end = Math.ceil((w - phase) / spacing) + 2;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-20, h + 30);
    for (let k = start; k <= end; k++) {
      const x = k * spacing + phase;
      const idx = Math.floor(scroll / spacing) + k;
      const peak = baseY - hash01(idx) * amp - Math.sin(idx) * amp * 0.2;
      ctx.lineTo(x, peak);
      ctx.lineTo(x + spacing * 0.5, baseY + hash01(idx + 0.5) * amp * 0.3);
    }
    ctx.lineTo(w + 20, h + 30);
    ctx.closePath();
    ctx.fill();
  }

  drawSeaFloor() {
    const { ctx, w, h } = this;
    const base = this.floorY();
    ctx.fillStyle = '#073754';
    ctx.beginPath();
    ctx.moveTo(-20, h + 30);
    const scroll = (this.distance || 0) * 0.8;
    const spacing = 170;
    const phase = scroll % spacing;
    for (let k = Math.floor(-phase / spacing); k <= Math.ceil((w - phase) / spacing) + 1; k++) {
      const x = k * spacing + phase;
      const idx = Math.floor(scroll / spacing) + k;
      ctx.lineTo(x, base + Math.sin(idx * 1.7) * 6 - hash01(idx) * 8);
    }
    ctx.lineTo(w + 20, h + 30);
    ctx.closePath();
    ctx.fill();
    // 沙线
    ctx.strokeStyle = 'rgba(110,190,205,0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-20, base + 2);
    for (let x = -20; x <= w + 20; x += 24) {
      ctx.lineTo(x, base + 2 + Math.sin(x * 0.08 + this.time * 0.6) * 3);
    }
    ctx.stroke();
  }

  drawKelp() {
    const { ctx, w, h } = this;
    const floor = this.floorY();
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    const spacing = 110;
    const phase = ((this.distance || 0) * 0.7) % spacing;
    for (let k = Math.floor(-phase / spacing); k <= Math.ceil((w - phase) / spacing) + 1; k++) {
      const x = k * spacing + phase;
      const idx = Math.floor((this.distance || 0) * 0.7 / spacing) + k;
      const height = h * (0.08 + hash01(idx * 1.3) * 0.12);
      const lean = Math.sin(this.time * 0.8 + idx) * 8;
      const color = hash01(idx + 7) > 0.5 ? 'rgba(20,108,92,0.75)' : 'rgba(18,86,98,0.75)';
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, floor + 3);
      ctx.quadraticCurveTo(x + lean * 0.4, floor - height * 0.6, x + lean, floor - height);
      ctx.stroke();
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + lean * 0.4, floor - height * 0.45);
      ctx.quadraticCurveTo(x + lean * 0.9, floor - height * 0.8, x + lean * 1.4, floor - height * 0.92);
      ctx.stroke();
      ctx.lineWidth = 4;
    }
  }

  drawBubbles() {
    const { ctx } = this;
    ctx.save();
    for (const b of this.bubbles) {
      const alpha = clamp(0.14 + b.r * 0.04, 0.1, 0.35);
      ctx.strokeStyle = `rgba(190,235,250,${alpha})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = `rgba(220,248,255,${alpha * 0.5})`;
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.3, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  drawTropicalFish(layer = null) {
    if (!GAME_TUNING.tropicalFish.enabled || !this.fish.length) return;
    const { ctx } = this;
    ctx.save();
    for (const f of this.fish) {
      if (layer === 'far' && f.layer >= 0.55) continue;
      if (layer === 'near' && f.layer < 0.55) continue;
      this.drawTropicalFishShape(f);
    }
    ctx.restore();
  }

  drawTropicalFishShape(f) {
    const { ctx } = this;
    const s = f.species;
    const L = f.length;
    if (L <= 0) return;
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.scale(f.dir, 1);
    ctx.globalAlpha = f.alpha;
    ctx.lineJoin = 'round';

    // 尾鳍
    const tailWave = Math.sin(f.phase * 2.1) * L * 0.07;
    ctx.fillStyle = s.tail;
    ctx.beginPath();
    ctx.moveTo(-L * 0.24, -L * 0.04 + tailWave);
    ctx.lineTo(-L * 0.48, -L * 0.22 + tailWave);
    ctx.lineTo(-L * 0.42, 0);
    ctx.lineTo(-L * 0.48, L * 0.22 - tailWave);
    ctx.lineTo(-L * 0.24, L * 0.04 + tailWave);
    ctx.closePath();
    ctx.fill();

    // 身体
    ctx.fillStyle = s.body;
    ctx.strokeStyle = s.dark;
    ctx.lineWidth = Math.max(1, L * 0.03);
    ctx.beginPath();
    if (s.shape === 'disc') {
      ctx.ellipse(0, 0, L * 0.29, L * 0.4, 0, 0, TAU);
    } else if (s.shape === 'angelfish') {
      ctx.moveTo(L * 0.4, -L * 0.05);
      ctx.quadraticCurveTo(L * 0.1, -L * 0.48, -L * 0.18, -L * 0.34);
      ctx.quadraticCurveTo(-L * 0.34, -L * 0.18, -L * 0.32, 0);
      ctx.quadraticCurveTo(-L * 0.34, L * 0.18, -L * 0.18, L * 0.34);
      ctx.quadraticCurveTo(L * 0.1, L * 0.48, L * 0.4, L * 0.05);
    } else if (s.shape === 'goby') {
      ctx.ellipse(L * 0.04, 0, L * 0.31, L * 0.14, 0, 0, TAU);
    } else {
      ctx.ellipse(0, 0, L * 0.33, L * 0.2, 0, 0, TAU);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 背鳍/腹鳍
    ctx.fillStyle = s.fin;
    if (s.shape === 'disc') {
      ctx.beginPath();
      ctx.moveTo(-L * 0.2, -L * 0.36);
      ctx.quadraticCurveTo(0, -L * 0.62, L * 0.24, -L * 0.3);
      ctx.closePath();
      ctx.fill();
    } else if (s.shape === 'angelfish') {
      ctx.beginPath();
      ctx.moveTo(-L * 0.02, -L * 0.38);
      ctx.quadraticCurveTo(L * 0.08, -L * 0.54, L * 0.24, -L * 0.3);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(-L * 0.08, -L * 0.17);
      ctx.quadraticCurveTo(0, -L * 0.34, L * 0.16, -L * 0.14);
      ctx.closePath();
      ctx.fill();
    }

    // 花纹（先按身体轮廓裁剪，再绘制条纹/斑点）
    ctx.save();
    ctx.beginPath();
    if (s.shape === 'disc' || s.shape === 'angelfish') {
      ctx.ellipse(0, 0, L * 0.29, L * 0.4, 0, 0, TAU);
    } else if (s.shape === 'goby') {
      ctx.ellipse(L * 0.04, 0, L * 0.31, L * 0.14, 0, 0, TAU);
    } else {
      ctx.ellipse(0, 0, L * 0.33, L * 0.2, 0, 0, TAU);
    }
    ctx.clip();

    if (s.pattern === 'bands') {
      ctx.strokeStyle = s.stripe;
      ctx.lineWidth = Math.max(1.5, L * 0.06);
      for (let i = 0; i < s.bands; i++) {
        const x = L * 0.24 - i * L * 0.16;
        ctx.beginPath();
        ctx.moveTo(x, -L * 0.34);
        ctx.lineTo(x, L * 0.34);
        ctx.stroke();
      }
    } else if (s.pattern === 'stripes') {
      ctx.strokeStyle = s.stripe;
      ctx.lineWidth = Math.max(1.4, L * 0.045);
      for (let i = 0; i < s.bands; i++) {
        const x = L * 0.28 - i * L * 0.12;
        ctx.beginPath();
        ctx.moveTo(x, -L * 0.4);
        ctx.quadraticCurveTo(x + L * 0.03, 0, x, L * 0.4);
        ctx.stroke();
      }
    } else if (s.pattern === 'curve') {
      ctx.strokeStyle = s.stripe;
      ctx.lineWidth = Math.max(1.5, L * 0.055);
      ctx.beginPath();
      ctx.arc(L * 0.02, -L * 0.02, L * 0.18, Math.PI * 0.78, Math.PI * 1.55);
      ctx.stroke();
    } else if (s.pattern === 'wavy') {
      ctx.strokeStyle = s.stripe;
      ctx.lineWidth = Math.max(1.2, L * 0.04);
      for (let i = 0; i < s.bands; i++) {
        const x = L * 0.22 - i * L * 0.12;
        ctx.beginPath();
        for (let yy = -L * 0.22; yy <= L * 0.22; yy += L * 0.08) {
          const xx = x + Math.sin((yy / L) * 7 + i) * L * 0.035;
          if (yy === -L * 0.22) ctx.moveTo(xx, yy);
          else ctx.lineTo(xx, yy);
        }
        ctx.stroke();
      }
    } else if (s.pattern === 'eyespot') {
      ctx.fillStyle = s.dark;
      ctx.beginPath();
      ctx.arc(-L * 0.24, -L * 0.05, L * 0.07, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = s.stripe;
      ctx.lineWidth = Math.max(1, L * 0.025);
      ctx.beginPath();
      ctx.arc(-L * 0.24, -L * 0.05, L * 0.09, 0, TAU);
      ctx.stroke();
    }

    // 腹部提亮
    ctx.fillStyle = s.belly;
    ctx.globalAlpha = f.alpha * 0.5;
    ctx.beginPath();
    ctx.ellipse(L * 0.04, L * 0.11, L * 0.2, L * 0.07, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = f.alpha;

    // 眼睛
    ctx.fillStyle = s.spot;
    ctx.beginPath();
    ctx.arc(L * 0.21, -L * 0.06, Math.max(1.2, L * 0.032), 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(L * 0.22, -L * 0.075, Math.max(0.6, L * 0.012), 0, TAU);
    ctx.fill();

    ctx.restore();
  }

  drawParticles() {
    const { ctx } = this;
    ctx.save();
    for (const p of this.particles) {
      const a = clamp(p.t / p.life, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * a, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  drawRings() {
    const { ctx } = this;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const ring of this.rings) {
      const a = clamp(ring.t / 0.7, 0, 1);
      ctx.strokeStyle = ring.color;
      ctx.globalAlpha = a * 0.7;
      ctx.lineWidth = 4 * a + 1;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, Math.max(1, ring.r), 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = a * 0.25;
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, Math.max(1, ring.r * 0.82), 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawHazards() {
    for (const o of this.hazards) {
      if (!o.alive) continue;
      if (o.kind === 'rock' || o.kind === 'coral') this.drawRock(o);
      else if (o.kind === 'mine') this.drawMine(o);
      else if (o.kind === 'jelly') this.drawJelly(o);
    }
  }

  drawRock(o) {
    const { ctx } = this;
    const fromTop = o.side === 'top';
    const x = o.x;
    const y = o.y;
    const w = o.w;
    const h = o.h;
    const base = fromTop ? h : this.h - h;
    const tip = fromTop ? h : this.h - h;
    ctx.save();
    const grad = ctx.createLinearGradient(x, fromTop ? 0 : this.h - h, x + w, fromTop ? h : this.h);
    if (o.coral) {
      grad.addColorStop(0, '#8d4d62');
      grad.addColorStop(1, '#4c2f4e');
    } else {
      grad.addColorStop(0, '#5c514a');
      grad.addColorStop(1, '#2e2a30');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x, fromTop ? 0 : this.h);
    ctx.lineTo(x + w, fromTop ? 0 : this.h);
    // 锯齿端
    const spikes = 5;
    for (let i = 0; i <= spikes; i++) {
      const sx = x + (w * i) / spikes;
      const depth = hash01(o.seed + i) * Math.min(30, h * 0.28) + 8;
      const sy = fromTop ? base - depth : base + depth;
      ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(160,205,220,0.12)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 藤壶/珊瑚点
    for (let i = 0; i < 6; i++) {
      const bx = x + hash01(o.seed + i * 5) * w;
      const by = (fromTop ? 10 : this.h - 10) + (hash01(o.seed + i * 9) - 0.5) * Math.min(50, h * 0.5);
      ctx.fillStyle = o.coral ? 'rgba(255,190,210,0.55)' : 'rgba(150,205,220,0.22)';
      ctx.beginPath();
      ctx.arc(bx, by, 2.4 + hash01(o.seed + i) * 3.4, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  drawMine(o) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(o.x, o.y);
    const blink = Math.sin(this.time * 3 + o.phase) > -0.3;
    ctx.fillStyle = '#202e36';
    ctx.beginPath();
    ctx.arc(0, 0, o.r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#526a73';
    ctx.lineWidth = 3;
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + 0.4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * o.r * 0.8, Math.sin(a) * o.r * 0.8);
      ctx.lineTo(Math.cos(a) * o.r * 1.28, Math.sin(a) * o.r * 1.28);
      ctx.stroke();
    }
    ctx.fillStyle = blink ? '#ff4d55' : '#7a2229';
    ctx.shadowColor = blink ? '#ff2d3f' : '#5a1018';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 0, o.r * 0.3, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  drawJelly(o) {
    const { ctx } = this;
    const r = o.r;
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.globalAlpha = 0.82;
    const grad = ctx.createRadialGradient(0, -r * 0.3, r * 0.1, 0, 0, r);
    grad.addColorStop(0, 'rgba(245,160,220,0.9)');
    grad.addColorStop(1, 'rgba(150,80,190,0.45)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, Math.PI, TAU, true);
    ctx.quadraticCurveTo(r * 0.4, r * 0.7, 0, r * 0.35);
    ctx.quadraticCurveTo(-r * 0.4, r * 0.7, -r, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,205,240,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    // 触手
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      const bx = i * r * 0.28;
      ctx.beginPath();
      ctx.moveTo(bx, r * 0.28);
      const sway = Math.sin(this.time * 3 + o.phase + i) * 6;
      ctx.quadraticCurveTo(bx + sway, r * 0.75, bx + sway * 0.5, r * 1.45);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawPickups() {
    const { ctx } = this;
    for (const p of this.pickups) {
      const bob = Math.sin(p.phase) * 3;
      const y = p.y + bob;
      if (p.kind === 'heart') {
        this.drawHeart(p.x, y, p.r, '#ff6f8f');
        continue;
      }
      ctx.save();
      const glow = ctx.createRadialGradient(p.x, y, 1, p.x, y, p.r * 2.8);
      glow.addColorStop(0, 'rgba(210,248,255,0.85)');
      glow.addColorStop(1, 'rgba(120,220,255,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, y, p.r * 2.8, 0, TAU);
      ctx.fill();
      const grad = ctx.createRadialGradient(p.x - p.r * 0.35, y - p.r * 0.4, 0.5, p.x, y, p.r);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.35, '#d9f7ff');
      grad.addColorStop(1, '#77c8e8');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, y, p.r, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      ctx.arc(p.x - p.r * 0.3, y - p.r * 0.35, p.r * 0.28, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  drawHeart(x, y, r, color) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(r / 12, r / 12);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.bezierCurveTo(-2, -2, -11, -1, -11, 5);
    ctx.bezierCurveTo(-11, 11, -4, 14, 0, 17);
    ctx.bezierCurveTo(4, 14, 11, 11, 11, 5);
    ctx.bezierCurveTo(11, -1, 2, -2, 0, 4);
    ctx.fill();
    ctx.restore();
  }

  drawAmbientShark() {
    if (!this.shark) return;
    const t = this.time;
    const y = this.h * (0.42 + Math.sin(t * 0.55) * 0.08);
    const x = this.w * (0.5 + Math.sin(t * 0.31) * 0.16);
    this.drawSharkShape(x, y, Math.sin(t * 0.5) * 0.08, 1);
  }

  drawShark() {
    const angle = clamp(this.vy / (this.h * 1.3), -0.5, 0.55);
    const x = this.playerX();
    const y = this.playerY;
    let alpha = 1;
    if (this.phaseTimer > 0) alpha = 0.52;
    else if (this.invuln > 0) alpha = 0.45 + 0.3 * Math.sin(this.time * 26);
    this.drawSharkShape(x, y, angle, alpha);
  }

  drawSharkShape(x, y, angle, alpha) {
    const { ctx, h } = this;
    const shark = this.shark;
    if (!shark) return;
    const sizeScale = shark.stats.size / 100;
    const L = clamp(h * 0.17, 82, 148) * sizeScale;
    const bodyH = L * 0.38;
    const c = shark.colors;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalAlpha = alpha;

    // 冲刺/幽灵光效
    if (this.dashTimer > 0 || this.phaseTimer > 0) {
      ctx.shadowColor = c.glow;
      ctx.shadowBlur = this.phaseTimer > 0 ? 18 : 10;
    }

    const tailWave = Math.sin(this.time * 7) * 0.16;
    const tailY = bodyH * (0.55 + tailWave);

    // 尾鳍
    ctx.fillStyle = c.fin;
    ctx.beginPath();
    ctx.moveTo(-L * 0.48, -bodyH * 0.12);
    ctx.lineTo(-L * 0.72, -bodyH * 0.42 - tailWave * bodyH);
    ctx.lineTo(-L * 0.62, 0);
    ctx.lineTo(-L * 0.72, bodyH * 0.42 - tailWave * bodyH);
    ctx.lineTo(-L * 0.48, bodyH * 0.12);
    ctx.closePath();
    ctx.fill();

    // 身体
    const bodyGrad = ctx.createLinearGradient(0, -bodyH, 0, bodyH);
    bodyGrad.addColorStop(0, c.body);
    bodyGrad.addColorStop(0.62, c.body);
    bodyGrad.addColorStop(1, c.belly);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(L * 0.52, -bodyH * 0.04);
    ctx.bezierCurveTo(L * 0.3, -bodyH * 0.68, -L * 0.08, -bodyH * 0.82, -L * 0.46, -bodyH * 0.16);
    ctx.lineTo(-L * 0.46, bodyH * 0.18);
    ctx.bezierCurveTo(-L * 0.05, bodyH * 0.86, L * 0.3, bodyH * 0.72, L * 0.52, bodyH * 0.04);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(210,245,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 背鳍
    ctx.fillStyle = c.fin;
    ctx.beginPath();
    ctx.moveTo(-L * 0.06, -bodyH * 0.52);
    ctx.quadraticCurveTo(L * 0.04, -bodyH * 1.08, L * 0.18, -bodyH * 0.46);
    ctx.closePath();
    ctx.fill();

    // 胸鳍
    ctx.fillStyle = c.fin;
    ctx.beginPath();
    ctx.moveTo(L * 0.02, bodyH * 0.22);
    ctx.quadraticCurveTo(-L * 0.12, bodyH * 0.78, -L * 0.26, bodyH * 0.5);
    ctx.quadraticCurveTo(-L * 0.08, bodyH * 0.34, L * 0.02, bodyH * 0.22);
    ctx.closePath();
    ctx.fill();

    // 锤头鲨头翼
    if (shark.variant === 'hammerhead') {
      ctx.fillStyle = c.body;
      ctx.beginPath();
      ctx.moveTo(L * 0.4, -bodyH * 0.06);
      ctx.quadraticCurveTo(L * 0.64, -bodyH * 0.32, L * 0.54, -bodyH * 0.58);
      ctx.lineTo(L * 0.36, -bodyH * 0.46);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(L * 0.4, bodyH * 0.06);
      ctx.quadraticCurveTo(L * 0.64, bodyH * 0.32, L * 0.54, bodyH * 0.58);
      ctx.lineTo(L * 0.36, bodyH * 0.46);
      ctx.closePath();
      ctx.fill();
      // 锤头眼睛
      this.sharkEye(ctx, L * 0.55, -bodyH * 0.38, L * 0.035);
      this.sharkEye(ctx, L * 0.55, bodyH * 0.38, L * 0.035);
    } else {
      this.sharkEye(ctx, L * 0.36, -bodyH * 0.12, L * 0.04);
    }

    // 鳃裂
    ctx.strokeStyle = 'rgba(10,45,65,0.35)';
    ctx.lineWidth = Math.max(1.2, L * 0.012);
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const gx = L * 0.12 - i * L * 0.09;
      ctx.moveTo(gx, bodyH * 0.05);
      ctx.lineTo(gx - L * 0.025, bodyH * 0.3);
    }
    ctx.stroke();

    // 鲸鲨斑点 / 虎鲨条纹
    if (shark.variant === 'whale-shark') {
      ctx.fillStyle = 'rgba(235,250,255,0.75)';
      for (let i = 0; i < 9; i++) {
        const sx = -L * 0.25 + hash01(i * 13) * L * 0.55;
        const sy = -bodyH * 0.4 + hash01(i * 19) * bodyH * 0.72;
        ctx.beginPath();
        ctx.arc(sx, sy, L * 0.018 + hash01(i * 7) * L * 0.016, 0, TAU);
        ctx.fill();
      }
    } else if (shark.variant === 'tiger-shark') {
      ctx.strokeStyle = 'rgba(42,50,44,0.55)';
      ctx.lineWidth = Math.max(2, L * 0.028);
      for (let i = 0; i < 4; i++) {
        const sx = L * 0.22 - i * L * 0.2;
        ctx.beginPath();
        ctx.moveTo(sx, -bodyH * 0.5);
        ctx.quadraticCurveTo(sx + L * 0.05, 0, sx, bodyH * 0.45);
        ctx.stroke();
      }
    } else if (shark.variant === 'goblin-shark') {
      // 哥布林鲨突出的吻
      ctx.fillStyle = c.body;
      ctx.beginPath();
      ctx.moveTo(L * 0.52, -bodyH * 0.03);
      ctx.lineTo(L * 0.82, bodyH * 0.1);
      ctx.lineTo(L * 0.5, bodyH * 0.08);
      ctx.closePath();
      ctx.fill();
    }

    // 嘴
    ctx.strokeStyle = 'rgba(8,35,50,0.6)';
    ctx.lineWidth = Math.max(1.2, L * 0.016);
    ctx.beginPath();
    if (shark.variant === 'whale-shark') {
      ctx.arc(L * 0.4, bodyH * 0.12, L * 0.1, 0.25, Math.PI * 0.75);
    } else {
      ctx.arc(L * 0.44, bodyH * 0.16, L * 0.1, 0.35, Math.PI * 0.7);
    }
    ctx.stroke();

    ctx.restore();
  }

  sharkEye(ctx, x, y, r) {
    ctx.fillStyle = '#0a2437';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.arc(x + r * 0.25, y - r * 0.25, r * 0.38, 0, TAU);
    ctx.fill();
  }

  drawFloatTexts() {
    const { ctx } = this;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const t of this.floatTexts) {
      const a = clamp(t.t / t.life, 0, 1);
      ctx.globalAlpha = a;
      ctx.font = `800 ${Math.max(16, this.h * 0.03)}px "Arial Rounded MT Bold", "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillStyle = '#031c2c';
      ctx.fillText(t.text, t.x + 1.5, t.y + 1.5);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.restore();
  }

  drawHUD() {
    const { ctx, w, h } = this;
    const top = 18 + this.safe.top;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 分数
    const scoreSize = clamp(h * 0.046, 18, 30);
    ctx.font = `900 ${scoreSize}px "Arial Rounded MT Bold", "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = 'rgba(3,25,42,0.55)';
    ctx.fillText(String(this.score).padStart(5, '0'), w * 0.5 + 1.5, top + scoreSize * 0.55 + 1.5);
    ctx.fillStyle = '#eafaff';
    ctx.fillText(String(this.score).padStart(5, '0'), w * 0.5, top + scoreSize * 0.55);
    const meter = Math.floor(this.distance / 40);
    ctx.font = `700 ${Math.max(11, h * 0.021)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = 'rgba(190,235,250,0.72)';
    ctx.fillText(`${meter} m`, w * 0.5, top + scoreSize * 1.55);

    // 生命
    const heartSize = clamp(h * 0.036, 15, 24);
    const gapX = heartSize * 1.35;
    for (let i = 0; i < this.maxHearts; i++) {
      const hx = 24 + this.safe.left + i * gapX + heartSize * 0.4;
      const hy = top + heartSize * 0.55;
      this.drawHeart(hx, hy, heartSize * 0.55, i < this.hearts ? '#ff5f7a' : 'rgba(255,255,255,0.15)');
    }
    // 珍珠数
    ctx.font = `800 ${Math.max(13, h * 0.026)}px "Arial Rounded MT Bold", sans-serif`;
    ctx.fillStyle = '#cfefff';
    const pearlY = top + heartSize * 1.65;
    ctx.beginPath();
    ctx.arc(22 + this.safe.left, pearlY, 5.5, 0, TAU);
    ctx.fillStyle = '#dff7ff';
    ctx.fill();
    ctx.fillStyle = 'rgba(190,238,255,0.9)';
    ctx.textAlign = 'left';
    ctx.fillText(`× ${this.pearls}`, 32 + this.safe.left, pearlY);

    // 能力按钮
    this.drawAbilityButton();

    // 底部提示
    const hintAlpha = clamp(1.6 - this.time, 0, 1);
    if (hintAlpha > 0 && this.state === 'playing') {
      ctx.globalAlpha = hintAlpha * 0.85;
      ctx.font = `700 ${Math.max(13, h * 0.024)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillStyle = '#bfeaff';
      ctx.textAlign = 'center';
      ctx.fillText('按住屏幕：上浮 · 松开：下潜', w * 0.5, h - 24 - this.safe.bottom);
      ctx.globalAlpha = 1;
    }

    // 能力提示 toast
    let ty = top + h * 0.14;
    ctx.textAlign = 'center';
    for (const t of this.toasts) {
      const a = clamp(t.t / 0.5, 0, 1);
      ctx.globalAlpha = a;
      ctx.font = `800 ${Math.max(14, h * 0.026)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillStyle = 'rgba(3,25,42,0.5)';
      ctx.fillText(t.text, w * 0.5 + 1, ty + 1);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, w * 0.5, ty);
      ty += Math.max(22, h * 0.04);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  drawAbilityButton() {
    const { ctx } = this;
    const b = this.abilityButton();
    const shark = this.shark;
    if (!shark) return;
    const ready = this.abilityCd <= 0;
    const ratio = this.abilityCd > 0 ? this.abilityCd / shark.ability.cooldown : 0;
    ctx.save();
    ctx.translate(b.x, b.y);
    // 底盘
    ctx.fillStyle = 'rgba(3,24,40,0.55)';
    ctx.beginPath();
    ctx.arc(0, 0, b.r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = ready ? shark.colors.glow : 'rgba(150,200,220,0.35)';
    ctx.lineWidth = 3;
    ctx.stroke();
    if (ready) {
      ctx.shadowColor = shark.colors.glow;
      ctx.shadowBlur = 14;
      ctx.strokeStyle = shark.colors.glow;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 0, b.r - 2, 0, TAU);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    // 冷却扇形
    if (!ready) {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, b.r - 1, -Math.PI / 2, -Math.PI / 2 + TAU * ratio);
      ctx.closePath();
      ctx.fill();
    }
    // 图标与文字
    ctx.font = `${Math.round(b.r * 0.52)}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(shark.ability.icon, 0, -b.r * 0.12);
    ctx.font = `800 ${Math.max(10, b.r * 0.19)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = ready ? '#eafaff' : 'rgba(220,240,250,0.7)';
    ctx.fillText(ready ? '能力' : `${Math.ceil(this.abilityCd)}s`, 0, b.r * 0.42);
    ctx.restore();
  }
}
