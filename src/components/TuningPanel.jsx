import { useState } from 'react';
import { DEFAULT_GAME_TUNING, GAME_TUNING, resetTuning, updateTuning } from '../game/config.js';

const ROWS = [
  {
    key: 'gravity',
    label: '下沉重力',
    hint: '越小下沉越慢',
    min: 0.8,
    max: 2.8,
    step: 0.05,
    unit: '',
  },
  {
    key: 'maxSinkSpeed',
    label: '最大下沉速度',
    hint: '松开屏幕后最多掉多快',
    min: 0.3,
    max: 1.0,
    step: 0.05,
    unit: '',
  },
  {
    key: 'lift',
    label: '上浮力度',
    hint: '越大向上游得越快',
    min: 3.0,
    max: 6.5,
    step: 0.1,
    unit: '',
  },
  {
    key: 'drag',
    label: '水阻/跟手度',
    hint: '越大越容易停住',
    min: 1.2,
    max: 3.2,
    step: 0.05,
    unit: '',
  },
  {
    key: 'baseSpeed',
    label: '前进基础速度',
    hint: '数值越大跑酷越快',
    min: 0.3,
    max: 0.6,
    step: 0.01,
    unit: '',
  },
];

const FISH_ROWS = [
  {
    key: 'density',
    label: '热带鱼数量',
    hint: '0 = 关闭；越大鱼越多',
    min: 0,
    max: 2.5,
    step: 0.1,
    unit: '',
  },
  {
    key: 'speedMax',
    label: '热带鱼游速',
    hint: '只影响装饰鱼',
    min: 0.07,
    max: 0.22,
    step: 0.01,
    unit: '',
  },
  {
    key: 'alphaMin',
    label: '热带鱼清晰度',
    hint: '越大越显眼',
    min: 0.35,
    max: 0.85,
    step: 0.05,
    unit: '',
  },
];

const ORIENTATIONS = [
  { key: 'auto', label: '自动', hint: '检测到手机建议横屏' },
  { key: 'portrait', label: '竖屏', hint: '始终保持竖屏' },
  { key: 'landscape', label: '横屏', hint: '进入游戏时引导横屏' },
];

export default function TuningPanel({ onClose }) {
  const [values, setValues] = useState(() => ({
    orientation: GAME_TUNING.orientation,
    gravity: GAME_TUNING.gravity,
    maxSinkSpeed: GAME_TUNING.maxSinkSpeed,
    lift: GAME_TUNING.lift,
    drag: GAME_TUNING.drag,
    baseSpeed: GAME_TUNING.baseSpeed,
    density: GAME_TUNING.tropicalFish.density,
    speedMax: GAME_TUNING.tropicalFish.speedMax,
    alphaMin: GAME_TUNING.tropicalFish.alphaMin,
  }));

  const setGameValue = (key, value) => {
    setValues((old) => ({ ...old, [key]: value }));
    updateTuning({ [key]: value });
  };

  const setFishValue = (key, value) => {
    setValues((old) => ({ ...old, [key]: value }));
    updateTuning({ tropicalFish: { [key]: value } });
  };

  const handleReset = () => {
    resetTuning();
    setValues({
      orientation: DEFAULT_GAME_TUNING.orientation,
      gravity: DEFAULT_GAME_TUNING.gravity,
      maxSinkSpeed: DEFAULT_GAME_TUNING.maxSinkSpeed,
      lift: DEFAULT_GAME_TUNING.lift,
      drag: DEFAULT_GAME_TUNING.drag,
      baseSpeed: DEFAULT_GAME_TUNING.baseSpeed,
      density: DEFAULT_GAME_TUNING.tropicalFish.density,
      speedMax: DEFAULT_GAME_TUNING.tropicalFish.speedMax,
      alphaMin: DEFAULT_GAME_TUNING.tropicalFish.alphaMin,
    });
  };

  return (
    <div className="tuning-overlay" role="dialog" aria-modal="true" aria-label="游戏参数调节">
      <div className="tuning-panel">
        <div className="tuning-head">
          <div>
            <p className="eyebrow">参数实时生效 · 自动保存在本机</p>
            <h2>⚙️ 游戏参数调节</h2>
          </div>
          <button type="button" className="tuning-close" onClick={onClose} aria-label="关闭参数面板">✕</button>
        </div>
        <p className="tuning-note">
          对应源码文件 <code>src/game/config.js</code>，这里修改后无需重新构建，立即生效。
        </p>

        <div className="tuning-section-title">📱 屏幕方向</div>
        <div className="orientation-picker">
          {ORIENTATIONS.map((item) => (
            <button
              type="button"
              key={item.key}
              className={`orientation-option ${values.orientation === item.key ? 'active' : ''}`}
              onClick={() => {
                setValues((old) => ({ ...old, orientation: item.key }));
                updateTuning({ orientation: item.key });
              }}
            >
              <b>{item.label}</b>
              <small>{item.hint}</small>
            </button>
          ))}
        </div>
        <p className="tuning-note orientation-note">
          选择“横屏”后，进入游戏时会自动请求横屏；如果系统锁定竖屏，游戏会显示旋转提示。
        </p>

        <div className="tuning-section-title">🦈 鲨鱼升降手感</div>
        {ROWS.map((row) => (
          <label className="tuning-row" key={row.key}>
            <span className="tuning-row-head">
              <b>{row.label}</b>
              <small>{row.hint}</small>
            </span>
            <input
              type="range"
              min={row.min}
              max={row.max}
              step={row.step}
              value={values[row.key]}
              onChange={(e) => setGameValue(row.key, Number(e.target.value))}
            />
            <output>{values[row.key].toFixed(row.step >= 1 ? 0 : row.step >= 0.1 ? 1 : 2)}</output>
          </label>
        ))}

        <div className="tuning-section-title">🐠 热带鱼装饰</div>
        {FISH_ROWS.map((row) => (
          <label className="tuning-row" key={row.key}>
            <span className="tuning-row-head">
              <b>{row.label}</b>
              <small>{row.hint}</small>
            </span>
            <input
              type="range"
              min={row.min}
              max={row.max}
              step={row.step}
              value={values[row.key]}
              onChange={(e) => setFishValue(row.key, Number(e.target.value))}
            />
            <output>{values[row.key].toFixed(row.step >= 0.1 ? 1 : 2)}</output>
          </label>
        ))}

        <div className="tuning-actions">
          <button type="button" className="ghost-button" onClick={handleReset}>恢复默认参数</button>
          <button type="button" className="primary-button" onClick={onClose}>完成</button>
        </div>
      </div>
    </div>
  );
}
