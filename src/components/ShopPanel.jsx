import { useState } from 'react';
import { LIFE_PILL_MAX_BOOST, SHOP_ITEMS, getShieldDef, lifeBoostFor, ownsItem } from '../game/shop.js';

export default function ShopPanel({ shop, selected, onClose, onBuy, onEquip }) {
  const [tab, setTab] = useState('decor');
  const items = SHOP_ITEMS.filter((item) => item.category === tab);

  const canAfford = (item) => shop.wallet >= item.price;
  const boost = lifeBoostFor(shop, selected.id);
  const shieldDef = shop.equippedShield ? getShieldDef(shop.equippedShield) : null;

  const buttonFor = (item) => {
    if (item.id === 'life-pill') {
      if (boost >= LIFE_PILL_MAX_BOOST) return { text: '已达上限', disabled: true };
      return { text: `购买 ${item.price}`, disabled: !canAfford(item) };
    }
    if (ownsItem(shop, item.id)) {
      if (item.category === 'weapon' && item.id !== 'gun') {
        return shop.equippedShield === item.id
          ? { text: '已装备', disabled: true }
          : { text: '装备', disabled: false };
      }
      return { text: item.id === 'gun' ? '已装备' : '已拥有', disabled: true };
    }
    return { text: `购买 ${item.price}`, disabled: !canAfford(item) };
  };

  const handleClick = (item) => {
    if (item.id === 'life-pill') {
      if (boost < LIFE_PILL_MAX_BOOST) onBuy(item);
      return;
    }
    if (ownsItem(shop, item.id)) {
      if (item.category === 'weapon' && item.id !== 'gun') onEquip(item);
      return;
    }
    onBuy(item);
  };

  return (
    <div className="shop-overlay" role="dialog" aria-modal="true" aria-label="商店">
      <div className="shop-panel">
        <div className="shop-head">
          <div>
            <p className="eyebrow">右滑打开 · 珍珠购物</p>
            <h2>🛍️ 海底商店</h2>
          </div>
          <button type="button" className="tuning-close" onClick={onClose} aria-label="关闭商店">✕</button>
        </div>

        <div className="shop-wallet">
          <span>🦪 钱包</span>
          <b>{shop.wallet.toLocaleString()}</b>
          <small>珍珠</small>
        </div>

        <div className="shop-tabs">
          <button type="button" className={tab === 'decor' ? 'active' : ''} onClick={() => setTab('decor')}>
            🎀 装饰品商店
          </button>
          <button type="button" className={tab === 'weapon' ? 'active' : ''} onClick={() => setTab('weapon')}>
            ⚔️ 武器商店
          </button>
        </div>

        {tab === 'weapon' && (
          <div className="shop-shield-status">
            当前盾牌：{shieldDef ? `${shieldDef.name}（耐久 ${shieldDef.durability}）` : '未装备'}
          </div>
        )}

        <div className="shop-grid">
          {items.map((item) => {
            const btn = buttonFor(item);
            const owned = ownsItem(shop, item.id);
            const equipped = item.category === 'weapon' && item.id !== 'gun' && shop.equippedShield === item.id;
            return (
              <div className={`shop-card ${owned ? 'owned' : ''} ${equipped ? 'equipped' : ''}`} key={item.id}>
                <div className="shop-card-emoji">{item.emoji}</div>
                <strong>{item.name}</strong>
                <p>{item.desc}</p>
                {item.id === 'life-pill' ? (
                  <small className="life-status">当前角色：+{boost} / +{LIFE_PILL_MAX_BOOST} 命</small>
                ) : null}
                <div className="shop-price">🦪 {item.price}</div>
                <button
                  type="button"
                  className={`shop-buy ${owned ? 'owned' : ''}`}
                  disabled={btn.disabled}
                  onClick={() => handleClick(item)}
                >
                  {btn.text}
                </button>
              </div>
            );
          })}
        </div>

        <p className="shop-note">珍珠在每局游戏结束后自动存入钱包；购买内容永久保存。</p>
      </div>
    </div>
  );
}
