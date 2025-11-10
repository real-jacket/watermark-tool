# 证件水印工具

一个可以本地离线运行的证件水印添加工具,使用最新的前端技术栈开发。

## 功能特点

- ✅ **本地离线运行** - 所有操作在浏览器本地完成,图片不会上传到服务器,保护隐私安全
- 🎨 **自定义水印** - 支持自定义水印文字、字体大小、颜色、透明度
- 🔄 **双模式支持** - 单个水印或平铺模式，满足不同场景需求
- 📍 **灵活定位** - 单个水印支持 5 个预设位置，平铺模式自动覆盖全图
- 🎯 **精确调整** - 支持水平/垂直偏移（-50% 到 +50%），旋转角度（-180° 到 180°）
- 📏 **间距控制** - 平铺模式支持水印间距调节（0-300%），自适应不同尺寸
- 👁️ **实时预览** - 调整参数后即时预览，支持原图/水印一键切换对比
- 💾 **多格式导出** - 支持 PNG/JPEG/WebP 三种格式，可调整质量（50-100%）
- 📱 **响应式设计** - 完美适配桌面端和移动端
- 🍎 **HEIC 支持** - 原生支持苹果设备的 HEIC/HEIF 格式，自动转换处理
- ⚡ **性能优化** - 300ms 防抖优化，拖拽流畅无卡顿

## 技术栈

- **Vite** - 新一代前端构建工具
- **React 18** - 流行的前端框架
- **TypeScript** - 类型安全的 JavaScript 超集
- **TailwindCSS** - 实用优先的 CSS 框架
- **heic2any** - HEIC/HEIF 格式转换库

## 支持的图片格式

- **JPG/JPEG** - 标准图片格式
- **PNG** - 支持透明背景的图片格式
- **HEIC/HEIF** - 苹果设备默认格式（自动转换为 JPEG）
- **WebP** - 现代浏览器支持的高效格式
- **其他** - 所有浏览器支持的图片格式

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:5173` 即可使用。

### 构建生产版本

```bash
npm run build
```

构建后的文件在 `dist` 目录下,可以直接部署到静态服务器或本地打开使用。

### 预览生产构建

```bash
npm run preview
```

## 使用说明

1. **上传图片** - 点击上传区域选择证件图片（支持 JPG、PNG、HEIC 等格式）
2. **选择模式** - 单个水印或平铺模式
3. **配置水印** - 调整水印文字、大小、颜色、透明度、位置、旋转角度、间距和偏移
4. **切换预览** - 使用开关在原图和水印之间切换对比
5. **选择格式** - 选择导出格式（PNG/JPEG/WebP）和质量
6. **下载图片** - 满意后点击下载按钮保存图片

## 部署到 GitHub Pages

本项目已配置 GitHub Actions 自动部署，只需简单几步即可部署到 GitHub Pages：

### 方法一：自动部署（推荐）

1. **Fork 或推送代码到 GitHub 仓库**

2. **启用 GitHub Pages**
   - 进入仓库的 `Settings` → `Pages`
   - 在 `Source` 下选择 `GitHub Actions`

3. **配置 base 路径**（如果使用项目页面）

   如果你的仓库名不是 `<username>.github.io`，需要设置 base 路径：

   方法 A - 在 GitHub 仓库设置环境变量：
   - 进入 `Settings` → `Secrets and variables` → `Actions`
   - 点击 `Variables` 标签
   - 添加变量 `BASE_PATH`，值为 `/your-repo-name/`

   方法 B - 修改 `vite.config.ts`：

   ```typescript
   base: command === 'build' ? '/your-repo-name/' : '/',
   ```

4. **推送到 main 分支**

   ```bash
   git add .
   git commit -m "feat: 配置 GitHub Pages 部署"
   git push origin main
   ```

5. **等待自动部署**
   - GitHub Actions 会自动构建并部署
   - 部署完成后访问 `https://<username>.github.io/<repo-name>/`

### 方法二：手动部署

如果需要手动部署到其他静态托管服务：

```bash
# 构建（项目页面）
BASE_PATH=/your-repo-name/ npm run build

# 构建（用户/组织页面）
npm run build

# dist 目录即为可部署的静态文件
```

支持的部署平台：

- **GitHub Pages** - 免费，自动 HTTPS
- **Vercel** - 零配置，自动部署
- **Netlify** - 拖拽部署，持续集成
- **Cloudflare Pages** - 全球 CDN，快速访问

## 隐私说明

本工具完全在浏览器本地运行,使用 Canvas API 进行图片处理,不会将您的图片上传到任何服务器,请放心使用。

## 浏览器兼容性

支持所有现代浏览器:

- Chrome/Edge (推荐)
- Firefox
- Safari
- 其他基于 Chromium 的浏览器

## License

MIT
