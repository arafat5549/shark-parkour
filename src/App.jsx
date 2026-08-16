import { useCallback, useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/GameEngine.js';
import ShopPanel from './components/ShopPanel.jsx';
import TuningPanel from './components/TuningPanel.jsx';
import { GAME_TUNING } from './game/config.js';
import {
  LIFE_PILL_MAX_BOOST,
  addWallet,
  lifeBoostFor,
  loadShopState,
  ownsItem,
  saveShopState,
  spendWallet,
} from './game/shop.js';
import {
  MAX_STAT_VALUES,
  SHARKS,
  STAT_LABELS,
  loadBest,
  loadSelectedShark,
  saveBest,
  saveSelectedShark,
} from './game/sharks.js';

const STAT_KEYS = ['speed', 'coin', 'agility'];
const STORAGE_MUTE = 'shark-parkour.muted';

function loadMuted() {
  try {
    return localStorage.getItem(STORAGE_MUTE) === '1';
  } catch {
    return false;
  }
}

function saveMuted(muted) {
  try {
    localStorage.setItem(STORAGE_MUTE, muted ? '1' : '0');
  } catch {
    // 忽略
  }
}

function isPhoneDevice() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const mobileUA = /Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
  const touch = (navigator.maxTouchPoints || 0) > 0 || 'ontouchstart' in window;
  return mobileUA && touch;
}

function isLandscapeViewport() {
  return window.innerWidth >= window.innerHeight;
}

function preferredOrientation() {
  if (GAME_TUNING.orientation === 'auto') return isPhoneDevice() ? 'landscape' : 'any';
  return GAME_TUNING.orientation;
}

async function requestLandscape() {
  if (isLandscapeViewport()) return true;
  const orientation = typeof screen !== 'undefined' ? screen.orientation : null;
  if (!orientation || !orientation.lock) return false;
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
    }
    await orientation.lock('landscape');
    return true;
  } catch {
    return false;
  }
}

export default function App() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const screenRef = useRef('menu');
  const [screen, setScreenState] = useState('menu');
  const [selected, setSelected] = useState(() => loadSelectedShark());
  const [best, setBest] = useState(() => loadBest(loadSelectedShark().id));
  const [muted, setMutedState] = useState(() => loadMuted());
  const [result, setResult] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsOpenRef = useRef(false);
  const resumeAfterSettingsRef = useRef(false);
  const [rotateHint, setRotateHint] = useState(false);
  const rotateHintRef = useRef(false);
  const rotatePausedRef = useRef(false);
  const [shop, setShop] = useState(() => loadShopState());
  const [shopOpen, setShopOpen] = useState(false);
  const shopRef = useRef(shop);
  const shopOpenRef = useRef(false);
  const touchStartRef = useRef(null);

  const setScreen = useCallback((next) => {
    screenRef.current = next;
    setScreenState(next);
  }, []);

  useEffect(() => {
    shopRef.current = shop;
  }, [shop]);

  const handleGameOver = useCallback((stats) => {
    const previous = loadBest(stats.sharkId);
    saveBest(stats.sharkId, stats.score);
    const nextShop = addWallet(shopRef.current, stats.pearls);
    saveShopState(nextShop);
    shopRef.current = nextShop;
    setShop(nextShop);
    engineRef.current?.setShopState(nextShop);
    setResult({
      ...stats,
      distanceM: Math.floor(stats.distance / 40),
      best: Math.max(previous, stats.score),
      newBest: stats.score > previous,
      walletGain: stats.pearls,
    });
    setScreen('gameover');
  }, [setScreen]);

  useEffect(() => {
    const engine = new GameEngine(canvasRef.current, { onGameOver: handleGameOver });
    engine.setMuted(loadMuted());
    engine.setPreviewShark(loadSelectedShark());
    engine.setShopState(shopRef.current);
    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [handleGameOver]);

  useEffect(() => {
    const onKey = (e) => {
      if (settingsOpenRef.current || rotateHintRef.current || shopOpenRef.current) return;
      if (e.code !== 'Escape' && e.code !== 'KeyP') return;
      const current = screenRef.current;
      if (current === 'playing') {
        engineRef.current?.pause();
        setScreen('paused');
      } else if (current === 'paused') {
        engineRef.current?.resume();
        setScreen('playing');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setScreen]);

  const resumeAfterRotateHint = useCallback(() => {
    rotateHintRef.current = false;
    setRotateHint(false);
    if (rotatePausedRef.current) {
      rotatePausedRef.current = false;
      engineRef.current?.resume();
      if (screenRef.current === 'paused') setScreen('playing');
    }
  }, [setScreen]);

  const applyPreferredOrientation = useCallback(async () => {
    const mode = preferredOrientation();
    if (mode === 'landscape') {
      await requestLandscape();
      // 部分浏览器 lock() 会成功但系统旋转有延迟，稍等后再确认。
      await new Promise((resolve) => setTimeout(resolve, 280));
      if (!isLandscapeViewport()) {
        rotatePausedRef.current = screenRef.current === 'playing';
        engineRef.current?.pause();
        if (screenRef.current === 'playing') setScreen('paused');
        rotateHintRef.current = true;
        setRotateHint(true);
      }
    } else if (mode === 'portrait') {
      try {
        screen.orientation?.unlock?.();
      } catch {
        // 忽略不支持的情况
      }
    }
  }, [setScreen]);

  useEffect(() => {
    const refresh = () => {
      if (rotateHintRef.current && isLandscapeViewport()) resumeAfterRotateHint();
    };
    const mql = window.matchMedia('(orientation: landscape)');
    mql.addEventListener?.('change', refresh);
    window.addEventListener('resize', refresh);
    return () => {
      mql.removeEventListener?.('change', refresh);
      window.removeEventListener('resize', refresh);
    };
  }, [resumeAfterRotateHint]);

  const chooseShark = (shark) => {
    setSelected(shark);
    saveSelectedShark(shark.id);
    setBest(loadBest(shark.id));
    engineRef.current?.setPreviewShark(shark);
    engineRef.current?.unlockAudio();
  };

  const startGame = (shark = selected) => {
    setSelected(shark);
    saveSelectedShark(shark.id);
    engineRef.current?.unlockAudio();
    engineRef.current?.startGame(shark);
    setScreen('playing');
    void applyPreferredOrientation();
  };

  const pauseGame = () => {
    engineRef.current?.pause();
    setScreen('paused');
  };

  const resumeGame = () => {
    engineRef.current?.resume();
    setScreen('playing');
  };

  const restartGame = () => {
    engineRef.current?.startGame(selected);
    setScreen('playing');
  };

  const backToMenu = () => {
    engineRef.current?.backToMenu();
    setBest(loadBest(selected.id));
    setScreen('menu');
  };

  const openShop = () => {
    shopOpenRef.current = true;
    setShopOpen(true);
  };

  const closeShop = () => {
    shopOpenRef.current = false;
    setShopOpen(false);
  };

  const buyShopItem = (item) => {
    const current = shopRef.current;
    if (item.category === 'decor' && item.id !== 'life-pill') {
      if (ownsItem(current, item.id)) return;
      const next = spendWallet(current, item.price);
      if (!next) return;
      next.owned = [...current.owned, item.id];
      commitShop(next);
      return;
    }

    if (item.id === 'life-pill') {
      const boost = lifeBoostFor(current, selected.id);
      if (boost >= LIFE_PILL_MAX_BOOST) return;
      const next = spendWallet(current, item.price);
      if (!next) return;
      next.lifeBoosts[selected.id] = boost + 1;
      commitShop(next);
      return;
    }

    if (item.category === 'weapon') {
      if (item.id === 'gun') {
        if (ownsItem(current, item.id)) return;
        const next = spendWallet(current, item.price);
        if (!next) return;
        next.owned = [...current.owned, item.id];
        commitShop(next);
        return;
      }
      // 盾牌：未拥有则购买并自动装备；已拥有则只切换装备。
      if (!ownsItem(current, item.id)) {
        const next = spendWallet(current, item.price);
        if (!next) return;
        next.owned = [...current.owned, item.id];
        next.equippedShield = item.id;
        commitShop(next);
      } else {
        const next = { ...current, lifeBoosts: { ...current.lifeBoosts } };
        next.equippedShield = item.id;
        commitShop(next);
      }
    }
  };

  const equipShield = (item) => {
    const current = shopRef.current;
    if (!ownsItem(current, item.id)) return;
    const next = { ...current, lifeBoosts: { ...current.lifeBoosts } };
    next.equippedShield = item.id;
    commitShop(next);
  };

  const commitShop = (next) => {
    saveShopState(next);
    shopRef.current = next;
    setShop(next);
    engineRef.current?.setShopState(next);
  };

  const toggleMute = () => {
    setMutedState((old) => {
      const next = !old;
      saveMuted(next);
      engineRef.current?.setMuted(next);
      return next;
    });
  };

  const openSettings = (fromGame = false) => {
    if (fromGame && screenRef.current === 'playing') {
      engineRef.current?.pause();
      setScreen('paused');
      resumeAfterSettingsRef.current = true;
    } else {
      resumeAfterSettingsRef.current = false;
    }
    settingsOpenRef.current = true;
    setSettingsOpen(true);
  };

  const closeSettings = () => {
    settingsOpenRef.current = false;
    setSettingsOpen(false);
    if (resumeAfterSettingsRef.current) {
      resumeAfterSettingsRef.current = false;
      engineRef.current?.resume();
      setScreen('playing');
    }
    void applyPreferredOrientation();
  };

  const handleMenuTouchStart = (e) => {
    const touch = e.touches && e.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, target: e.target };
  };

  const handleMenuTouchEnd = (e) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const touch = e.changedTouches && e.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const inScrollArea = start.target && typeof start.target.closest === 'function'
      && start.target.closest('.shark-picker, .ability-panel, .menu-actions, button, a, input');
    if (dx > 72 && Math.abs(dx) > Math.abs(dy) * 1.35 && !inScrollArea) openShop();
  };

  const inGame = screen === 'playing' || screen === 'paused' || screen === 'gameover';

  return (
    <div className="app">
      <canvas ref={canvasRef} className="game-canvas" aria-label="海底鲨鱼跑酷游戏画面" />

      {inGame && (
        <div className="game-topbar">
          <button type="button" className="icon-button" onClick={() => openSettings(true)} aria-label="游戏参数调节">
            ⚙️
          </button>
          <button
            type="button"
            className={`icon-button ${muted ? 'is-off' : ''}`}
            onClick={toggleMute}
            aria-label={muted ? '开启声音' : '关闭声音'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
          {screen !== 'gameover' && (
            <button type="button" className="icon-button" onClick={screen === 'playing' ? pauseGame : resumeGame} aria-label="暂停或继续">
              {screen === 'playing' ? '⏸️' : '▶️'}
            </button>
          )}
        </div>
      )}

      {screen === 'menu' && (
        <div
          className="screen menu-screen"
          onTouchStart={handleMenuTouchStart}
          onTouchEnd={handleMenuTouchEnd}
        >
          <div className="menu-scroll">
            <header className="menu-header">
              <div className="logo-mark" aria-hidden="true">🦈</div>
              <h1>海底鲨鱼跑酷</h1>
              <p>选择鲨鱼 / 热带鱼 · 能力自动分配</p>
            </header>

            <div className="shark-picker" role="listbox" aria-label="选择鲨鱼或热带鱼">
              {SHARKS.map((shark) => {
                const active = selected.id === shark.id;
                return (
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    key={shark.id}
                    className={`shark-card ${active ? 'selected' : ''}`}
                    style={{ '--glow': shark.colors.glow, '--accent': shark.colors.accent }}
                    onClick={() => chooseShark(shark)}
                  >
                    <span className="shark-card-emoji" aria-hidden="true">{shark.emoji}</span>
                    <strong>{shark.name}</strong>
                    <small>{shark.ability.icon} {shark.ability.short}</small>
                    <span className="auto-badge">能力自动分配</span>
                  </button>
                );
              })}
            </div>

            <section className="ability-panel" aria-live="polite">
              <div className="ability-head">
                <span className="ability-icon" style={{ background: `${selected.colors.glow}26`, color: selected.colors.glow }}>
                  {selected.ability.icon}
                </span>
                <div>
                  <p className="eyebrow">专属能力 · 选择后自动绑定</p>
                  <h2>{selected.ability.name}</h2>
                </div>
              </div>
              <p className="ability-desc">{selected.ability.desc}</p>
              <div className="ability-meta">
                <span>冷却 {selected.ability.cooldown.toFixed(1)} 秒</span>
                <span>持续 {selected.ability.duration.toFixed(1)} 秒</span>
              </div>

              <div className="stat-grid">
                {STAT_KEYS.map((key) => (
                  <div className="stat-row" key={key}>
                    <span>{STAT_LABELS[key]}</span>
                    <div className="stat-track">
                      <div
                        className="stat-fill"
                        style={{
                          width: `${Math.min(100, (selected.stats[key] / MAX_STAT_VALUES[key]) * 100)}%`,
                          background: selected.colors.glow,
                        }}
                      />
                    </div>
                    <b>{selected.stats[key]}</b>
                  </div>
                ))}
                <div className="stat-row">
                  <span>生命</span>
                  <div className="hearts-mini">
                    {Array.from({ length: selected.stats.hearts }).map((_, i) => (
                      <span key={i}>❤️</span>
                    ))}
                  </div>
                  <b>{selected.stats.hearts}</b>
                </div>
                {selected.stats.armor > 0 && (
                  <div className="stat-row">
                    <span>{STAT_LABELS.armor}</span>
                    <div className="stat-track">
                      <div
                        className="stat-fill armor"
                        style={{
                          width: `${(selected.stats.armor / MAX_STAT_VALUES.armor) * 100}%`,
                        }}
                      />
                    </div>
                    <b>{selected.stats.armor}%</b>
                  </div>
                )}
              </div>

              <ul className="passive-list">
                {selected.passives.map((passive) => (
                  <li key={passive}>✦ {passive}</li>
                ))}
              </ul>

              <div className="best-line">
                🏆 最佳成绩 <b>{best.toLocaleString()}</b>
              </div>
            </section>

            <div className="menu-actions">
              <div className="shop-entry-row">
                <button type="button" className="shop-open-button" onClick={openShop}>
                  🛍️ 商店
                </button>
                <span className="wallet-chip">🦪 {shop.wallet.toLocaleString()}</span>
              </div>
              <button type="button" className="start-button" onClick={() => startGame(selected)}>
                <span>{selected.emoji}</span>
                出发！{selected.name}
              </button>
              <p className="control-hint">
                📱 按住屏幕：上浮 · 松开：下潜
                <br />
                点击右下角按钮释放专属能力
              </p>
            </div>
          </div>
          <button type="button" className="floating-settings" onClick={() => openSettings(false)} aria-label="游戏参数调节">
            ⚙️ 参数
          </button>
          <button type="button" className={`floating-mute ${muted ? 'is-off' : ''}`} onClick={toggleMute} aria-label="声音开关">
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
      )}

      {screen === 'paused' && (
        <div className="overlay">
          <div className="panel">
            <div className="panel-emoji">⏸️</div>
            <h2>暂停巡游</h2>
            <p>深海不会等你太久，准备好就继续吧。</p>
            <button type="button" className="primary-button" onClick={resumeGame}>继续游戏</button>
            <button type="button" className="ghost-button" onClick={restartGame}>重新开始</button>
            <button type="button" className="ghost-button" onClick={backToMenu}>更换鲨鱼</button>
          </div>
        </div>
      )}

      {screen === 'gameover' && result && (
        <div className="overlay">
          <div className="panel gameover-panel">
            <div className="panel-emoji">🌊</div>
            <h2>沉入深海…</h2>
            {result.newBest ? <div className="new-record">🎉 新纪录！</div> : null}
            <div className="score-hero">{result.score.toLocaleString()}</div>
            <p className="score-label">本次得分</p>
            <div className="result-grid">
              <div><b>{result.pearls}</b><span>珍珠</span></div>
              <div><b>{result.distanceM} m</b><span>距离</span></div>
              <div><b>{result.best.toLocaleString()}</b><span>最佳</span></div>
            </div>
            {result.walletGain > 0 && (
              <p className="wallet-gain">🦪 本局珍珠 +{result.walletGain} 已存入商店钱包</p>
            )}
            <button type="button" className="primary-button" onClick={restartGame}>🦈 再游一次</button>
            <button type="button" className="ghost-button" onClick={backToMenu}>更换鲨鱼</button>
          </div>
        </div>
      )}

      {rotateHint && (
        <div className="overlay rotate-overlay">
          <div className="panel rotate-panel">
            <div className="rotate-phone" aria-hidden="true">📱↻</div>
            <h2>请旋转为横屏</h2>
            <p>检测到手机并已开启横屏模式。<br />把手机横过来，游戏视野更宽。</p>
            <button type="button" className="primary-button" onClick={resumeAfterRotateHint}>我已横屏，开始</button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                rotatePausedRef.current = false;
                engineRef.current?.resume();
                if (screenRef.current === 'paused') setScreen('playing');
                resumeAfterRotateHint();
              }}
            >
              暂不横屏，继续竖屏
            </button>
          </div>
        </div>
      )}

      {shopOpen && (
        <ShopPanel
          shop={shop}
          selected={selected}
          onClose={closeShop}
          onBuy={buyShopItem}
          onEquip={equipShield}
        />
      )}

      {settingsOpen && <TuningPanel onClose={closeSettings} />}
    </div>
  );
}
