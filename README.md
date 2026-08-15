# 🦈 海底鲨鱼跑酷（Deep Sea Shark Parkour）

选择不同鲨鱼类型后，**专属能力会自动分配**。在深海躲避珊瑚、水雷与水母，收集珍珠，越游越远。

## 鲨鱼与能力

| 鲨鱼 | 专属能力 | 特点 |
| --- | --- | --- |
| 大白鲨 | 碎岩撕咬 | 咬碎前方最近障碍，4 颗生命 |
| 锤头鲨 | 声呐脉冲 | 把屏幕内危险物震成珍珠，吸附范围 +70% |
| 灰鲭鲨 | 极速突进 | 2 秒提速 80% 并无敌 |
| 鲸鲨 | 浮游虹吸 | 3 秒吸取全屏珍珠，珍珠价值 +25% |
| 虎鲨 | 蛮力冲撞 | 冲开同一高度全部障碍，28% 概率格挡 |
| 哥布林鲨 | 深渊潜行 | 2.8 秒幽灵化穿透一切障碍 |

## 操作

- 📱 手机：**按住屏幕 = 上浮，松开 = 下潜**；点右下角圆形按钮释放能力
- ⌨️ 电脑：`空格 / W / ↑` 上浮，`S / ↓` 下潜，`X / Shift / J` 释放能力
- `Esc / P` 暂停

## 开发

```bash
npm install
npm run dev       # Vite 开发服务器，端口 5174
npm run build     # 构建到 dist/
npm start         # Node + Express 托管 dist，端口 3002
```

## PWA / 离线

- 生产构建自动注册 Service Worker（`import.meta.env.PROD`）
- 提供 192 / 512 / maskable / apple-touch 图标
- 构建后可通过 `npm start` 或任意静态托管离线打开

## 推送到私有 Git 仓库（Private）

本仓库已初始化 Git，默认分支为 `main`，源码已提交，`node_modules/` 与 `dist/` 不纳入版本控制。

### GitHub（推荐）

1. 在 GitHub 新建仓库时把可见性选为 **Private**（私有）。
2. 将本地仓库推送到你的私有仓库：

```bash
git remote add origin https://github.com/<你的用户名>/shark-parkour.git
git branch -M main
git push -u origin main
```

3. 推送后 `.github/workflows/pages.yml` 会自动执行 `npm ci` + `npm run build`。
4. 若需要 GitHub Pages 公开访问：私有仓库的 Pages 需要 **GitHub Pro / Team / Enterprise**；普通免费私有仓库建议改用 Cloudflare Pages、Vercel 或自有服务器部署 `dist/`。
5. 不需要公开 Pages 时，直接使用 Actions 的构建产物（artifact）即可，仓库内容保持 Private。

### 不想公开部署（纯私有模式）

保持仓库 Private，不启用 Pages。离线 PWA 可本地构建后自托管：

```bash
npm run build
npm start
```

手机与电脑在同一局域网时，访问 `http://<服务器IP>:3002`；通过 HTTPS 访问时浏览器才会允许安装 PWA 与完整离线缓存。
