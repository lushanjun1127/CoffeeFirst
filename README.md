# CoffeeFirst

一个简洁的浏览器起始页，提供时钟、多搜索引擎切换和自定义书签。搜索引擎偏好与书签保存在浏览器本地。

在线访问：[CoffeeFirst](https://lushanjun1127.github.io/CoffeeFirst/)

## 技术栈

- **Vite**：本地开发服务器与生产构建。
- **TypeScript**：页面交互逻辑，入口为 `src/main.ts`。
- **Sass（SCSS）**：页面样式，入口为 `src/styles/main.scss`。
- **GitHub Actions + GitHub Pages**：自动构建与部署静态网站。

## 本地开发

使用 Node.js 20（与部署工作流一致）和 npm：

```bash
npm ci
npm run dev
```

打开终端显示的本地地址。生产构建与预览：

```bash
npm run build
npm run preview
```

`npm run build` 先执行 TypeScript 类型检查，再由 Vite 将静态文件输出到 `dist/`。

## 部署到 GitHub Pages

1. 在仓库 **Settings → Pages → Build and deployment** 中，将 **Source** 设置为 **GitHub Actions**。
2. 将修改提交并推送到 `main` 分支。
3. `.github/workflows/deploy.yml` 中的 **Deploy to GitHub Pages** 工作流会自动运行：使用 Node.js 20，执行 `npm ci` 和 `npm run build`，上传 `dist/` 并由 `deploy` 作业发布到 GitHub Pages。
4. 在仓库 [Actions](https://github.com/lushanjun1127/CoffeeFirst/actions) 页面确认工作流成功后，访问在线地址。

`vite.config.ts` 中的 `base` 为 `/CoffeeFirst/`，对应 GitHub Pages 的仓库路径；如果更改仓库名或部署路径，请同步修改此配置。

## 仓库管理

`.gitignore` 忽略 `node_modules`、`dist`、`.DS_Store` 和 `*.local`。依赖通过 `npm ci` 安装，部署产物由工作流构建；无需将依赖目录或构建产物提交到 Git。请保留并提交 `package-lock.json`，以确保安装结果一致。
