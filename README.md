# 毛毡排字助手

一个**完全在浏览器本地运行**的移动端排字工具，供手工作坊师傅在毛毡框、宠物肖像框等产品图片上预览宠物名字的字体排版效果。导入图片 → 输入名字 → 调整大小和位置 → 全屏预览 → 下载或分享高清图片。

- 纯前端网页应用（React + TypeScript + Vite），可部署到 GitHub Pages
- PWA，可添加到安卓手机桌面，核心页面支持离线使用
- 无需服务器、域名、注册、登录、后端 API
- 不上传任何图片、文字或字体，**所有数据只保存在当前手机浏览器中**
- 无广告、无统计追踪

## 主要功能

- 导入产品图片（JPG / PNG / WEBP，自动处理照片方向）
- 添加名字并实时预览（支持中文、英文、数字、空格、常见符号）
- 单指拖动文字位置，双指缩放文字大小，滑块微调
- 文字颜色、字间距调节
- 内置字体 **Playwrite NZ Guides**、**Intro**，首次打开即可使用
- 字体管理：导入 TTF / OTF、预览、改名、设为默认、删除（内置字体不可删除）
- 全屏预览（隐藏所有编辑控件）
- 导出**原图分辨率**的高清 PNG（基于原图用 Canvas 重绘，不是屏幕截图）
- 系统分享（微信 / QQ / 邮件等），不支持时自动降级为下载
- 自动保存草稿，可“继续上次编辑”
- PWA 安装、离线使用

## 技术栈

React 18 · TypeScript · Vite 5 · HTML Canvas · FontFace API · IndexedDB · Web Share API · vite-plugin-pwa（Service Worker + Manifest）· GitHub Actions + GitHub Pages。

## 本地开发

```bash
npm install
npm run dev
```

### 测试

```bash
npm run test
```

### 类型检查

```bash
npm run typecheck
```

### 生产构建

```bash
npm run build
```

构建产物在 `dist/` 目录，可直接静态部署。

### 本地预览构建结果

```bash
npm run preview
```

## 部署到 GitHub Pages

本项目已内置自动部署工作流 `.github/workflows/deploy-pages.yml`，会**自动根据仓库名设置子路径**（无需手动修改 `base`）。

1. 在 GitHub 上创建一个仓库（例如 `felt-font-tool`）。
2. 将本项目代码推送到该仓库的 `main` 分支：
   ```bash
   git init
   git add .
   git commit -m "init: 毛毡排字助手"
   git branch -M main
   git remote add origin https://github.com/USERNAME/REPOSITORY_NAME.git
   git push -u origin main
   ```
3. 打开仓库的 **Settings → Pages**。
4. 将 **Source** 设置为 **GitHub Actions**。
5. 等待 Actions 中的 “Deploy to GitHub Pages” 工作流构建完成。
6. 构建成功后即可访问：
   ```text
   https://USERNAME.github.io/REPOSITORY_NAME/
   ```

工作流会执行 `npm ci` → `npm run test` → `npm run build`，并使用官方 `configure-pages` / `upload-pages-artifact` / `deploy-pages` 完成发布。

> 子路径说明：工作流通过环境变量 `BASE_PATH=/<仓库名>/` 传给 Vite，因此字体、图标、Manifest、Service Worker 等静态资源都能在 `https://USERNAME.github.io/REPOSITORY_NAME/` 下正确加载；应用为单页结构、不依赖服务器重写规则，刷新页面不会出现 404。

### 部署到自定义路径 / 根域名

- 若使用用户主页仓库 `USERNAME.github.io`（根路径），可在构建时设置 `BASE_PATH=/`。
- 本地手动构建到某个子路径：
  ```bash
  BASE_PATH=/my-path/ npm run build
  ```

## APK？不需要

本项目是网页应用，不生成 APK。用户通过 Chrome 打开网址，使用“添加到主屏幕 / 安装应用”即可获得类似原生 App 的桌面图标与离线体验。

## 内置字体

内置字体文件位于：

```text
public/fonts/PlaywriteNZGuides-Regular.ttf   显示名称 Playwrite NZ Guides（默认/兜底字体）
public/fonts/Intro.ttf                       显示名称 Intro
```

内置字体通过 `FontFace` API 在应用启动时加载，用户首次打开即可使用，离线也可用，且不可在应用内删除。

字体许可说明见 `public/fonts/FONT_LICENSE.txt`。**请在正式公开发布前确认所有内置及导入字体的授权范围。**

### 增加新的内置字体

1. 将字体文件放入 `public/fonts/`。
2. 在 `src/utils/constants.ts` 的 `BUILTIN_FONTS` 数组中追加一项（id、family、显示名称、文件路径），并在 `vite.config.ts` 的 `includeAssets` 中加入该文件。
3. 重新构建并部署。

### 手机端导入字体（无需更新网站）

使用者可以直接在应用的 **“字体管理 → 导入字体”** 中选择手机里的 `.ttf` 或 `.otf` 文件。导入的字体保存在浏览器 IndexedDB 中，下次打开自动恢复，无需重新打包或更新网站。

## 项目结构

```text
felt-font-tool/
├─ public/
│  ├─ fonts/PlaywriteNZGuides-Regular.ttf   内置字体
│  ├─ fonts/Intro.ttf                        内置字体
│  ├─ icons/                                 PWA 图标（脚本生成）
│  ├─ favicon.svg
│  └─ apple-touch-icon.png
├─ scripts/gen-icons.mjs                     无依赖 PNG 图标生成脚本
├─ src/
│  ├─ components/    页面与 UI 组件
│  ├─ hooks/         PWA 安装 / 更新钩子
│  ├─ services/      字体、图片解码、导出、分享、IndexedDB、Canvas 绘制
│  ├─ utils/         纯逻辑：坐标换算、字体校验、文件名、哈希、草稿（含单元测试）
│  ├─ types/         类型定义
│  ├─ App.tsx        主状态与页面切换
│  ├─ main.tsx
│  └─ styles.css     全局样式与 CSS 变量
├─ .github/workflows/deploy-pages.yml        自动部署
├─ index.html
├─ vite.config.ts
└─ package.json
```

## 隐私

本工具完全在浏览器本地运行。你导入的图片、输入的文字和字体文件不会上传到任何服务器。草稿和自定义字体只保存在当前设备的当前浏览器中。清除浏览器网站数据后，本地草稿和自定义字体可能会丢失。应用不含 Google Analytics、百度统计、Sentry、广告或第三方追踪脚本。

## 常见问题

**为什么在微信里不能直接下载 / 分享？**
微信内置浏览器对下载和文件分享有较多限制。请点击微信右上角菜单，选择“在浏览器中打开”，用 Chrome 打开后再下载或分享。

**如何用 Chrome 打开？**
复制网址，在手机上打开 Chrome 浏览器，粘贴网址访问。

**如何添加到手机桌面？**
用 Chrome 打开网页后，点击右上角菜单，选择“添加到主屏幕”或“安装应用”，即可像普通软件一样打开。

**为什么清除浏览器数据后字体会消失？**
导入的字体和草稿保存在浏览器本地存储（IndexedDB）中。清除浏览器网站数据会一并清除它们。重新导入即可。

**为什么某些字体不支持中文？**
很多英文/手写字体本身不包含中文字形。遇到不支持的字符时，应用会回退到系统字体显示，不会崩溃；如需中文效果，请导入包含中文字形的字体。

**GitHub Pages 需要服务器或域名吗？**
不需要。GitHub Pages 免费提供静态托管和 `https://USERNAME.github.io/REPOSITORY_NAME/` 网址，无需自购服务器或域名。

## 开源许可

应用代码可按你的需要使用。内置及导入字体的授权请以各字体自身的许可证为准（见上文“内置字体”）。
