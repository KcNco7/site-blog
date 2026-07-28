# Vite 构建工具（Vite 7，附 Vite 8 差异）

> 本系列正文以 Vite 7 为基准。遇到 Vite 8 已经改变的底层实现或配置名称时，会单独标注“Vite 8 差异”，不会把两个版本混成同一套机制。

Vite 是面向现代 Web 项目的构建工具。它提供开发服务器、模块解析、按需源码转换、热更新和生产构建，并通过插件与 Vue、React 等框架衔接。类型检查、框架编译器、CSS 预处理器和 lint 工具是否参与流程，则取决于项目安装的依赖、插件与脚本，不能理解成 Vite 默认集成了所有工具。

> ES Modules（ESM）是 JavaScript 官方模块标准。CommonJS（CJS）是 Node.js 生态长期使用的模块系统；Node.js 如何解释一个文件还取决于文件扩展名、最近的 `package.json` 中的 `type` 字段等条件，不能简单说 CommonJS 永远是 Node.js 的默认格式。

::: details 构建工具负责什么
构建工具会读取入口和模块依赖关系，根据配置与插件转换源码、处理资源，并为开发或生产提供不同的输出。Vite 有实用的默认值，简单项目可以不写配置文件；涉及框架插件、路径别名、代理、环境变量目录或构建目标时，仍需要显式配置。

构建工具减少了重复的手工操作，但开发者仍要关心目标浏览器、部署路径、环境变量、运行时兼容性和最终产物。
:::

**Vite 的主要作用**：

1. 模块解析：识别源码中的相对导入、绝对 URL 和裸模块导入，并把依赖请求转换成浏览器可加载的 URL
2. 源码转换：按需处理 TypeScript、JSX、CSS 和框架文件；Vite 只转译 TypeScript，不执行类型检查
3. 开发体验：提供开发服务器、文件监听和 HMR
4. 生产构建：解析模块图，完成资源处理、代码分割、Tree Shaking、压缩和输出
5. 插件扩展：接入 Vue、React 等框架能力以及项目需要的额外转换

CSS 预处理器仍需安装相应实现，例如使用 Less 时需要安装 `less`。React Compiler、Babel、ESLint、`tsc` 等也不是 Vite 自动执行的固定组成部分。

### HMR 不是整页重新运行

HMR 是 Hot Module Replacement，即热模块替换。文件变化后，Vite 会更新受影响的模块，并沿模块图寻找最近的 HMR 边界。Vue 和 React 的官方集成可以在许多情况下保留组件状态；如果更新无法被 HMR 边界接收，才会回退到整页刷新。

开发服务器代理可以在开发阶段转发匹配的请求，使浏览器请求同源的开发服务器地址，再由服务器访问目标接口。它没有取消浏览器同源策略，也不能自动解决所有跨域场景。

### Vite 7 与 Vite 8 的核心差异

| 环节                   | Vite 7                         | Vite 8                    |
| ---------------------- | ------------------------------ | ------------------------- |
| 开发阶段源码转换       | 主要使用 esbuild               | 使用 Oxc Transformer      |
| 开发阶段依赖预构建     | 使用 esbuild                   | 使用 Rolldown             |
| 生产构建               | 使用 Rollup                    | 使用 Rolldown             |
| 客户端 JavaScript 压缩 | 默认使用 esbuild               | 默认使用 Oxc Minifier     |

因此，“开发阶段使用 esbuild、生产阶段使用 Rollup”是 Vite 7 的机制，不应删除；在 Vite 8 中，这套双工具链已经被 Rolldown 与 Oxc 组成的统一工具链取代。

### create-vite 和 Vite 的区别

- `create-vite`：项目脚手架，用于从基础模板生成文件和 `package.json`
- `vite`：开发服务器和生产构建命令

运行 `npm create vite@latest` 或 `yarn create vite` 时，包管理器会执行 create-vite，不会把它永久全局安装。create-vite 也不是“内置了一份正在运行的 Vite”；它生成的模板会声明 Vite、框架插件等项目依赖。

Webpack、Vite 属于构建工具，Vue CLI、create-vite 属于脚手架，不应直接用“毛坯房”和“精装房”划分。

## 1. Vite 开箱即用

“开箱即用”表示 Vite 为常见场景提供了合理默认值，不代表所有框架和工程需求都不需要配置。

### 使用脚手架创建项目

```bash
npm create vite@latest my-app
cd my-app
npm install
npm run dev
```

生产构建使用：

```bash
npm run build
```

`npm dev` 和 `npm build` 不会自动运行同名 scripts，必须使用 `npm run dev` 和 `npm run build`。当前执行 `npm create vite@latest` 会获取最新脚手架和当前 Vite 模板；如果要复现本系列的 Vite 7 环境，应固定 `vite@7` 以及兼容的框架插件版本。

Vite 7 和 Vite 8 都要求较新的 Node.js。Vite 7 官方要求 Node.js 20.19+ 或 22.12+；使用模板时还应留意模板给出的更高版本要求。

### 手动安装 Vite 7

`npm init -y` 和安装 Vite 只是手动初始化的开始，还要提供 `index.html`、源码入口和 scripts：

```bash
npm init -y
npm install -D vite@7
npx vite
```

在 Vite 项目中，`index.html` 默认位于项目根目录，并作为应用入口参与模块图处理。

### 浏览器为什么不能直接解析裸导入

浏览器原生 ESM 按 URL 解析模块。相对说明符、绝对 URL 可以直接定位资源；裸模块说明符需要 import map 或 Vite 这类工具提供映射：

```javascript
import { debounce } from "lodash-es";
```

浏览器本身不了解 Node.js 的 `node_modules` 目录结构和包解析规则。Vite 会解析这个裸导入、执行依赖预构建，并把浏览器收到的源码请求重写成可加载的内部 URL。开发者不应在业务源码里手写 `/node_modules/.vite/deps/...` 地址。

## 2. Vite 依赖预构建

第一次启动开发服务器且没有可用缓存时，Vite 会扫描源码中的裸模块导入，把发现的依赖作为预构建入口。依赖解析会考虑包入口、`exports`、别名、工作区和插件等因素，不只是简单地从当前文件夹逐级向上查找 `node_modules`。

依赖预构建主要解决两个问题：

1. **CommonJS 和 UMD 兼容**：开发服务器以原生 ESM 提供模块，需要先把这些格式的依赖转换成 ESM
2. **大量内部模块请求**：把包含许多内部 ESM 文件的依赖合并为更少的模块，减少浏览器侧的网络拥塞

裸导入到内部 URL 的重写是 Vite 为浏览器提供依赖的方式，不应单独当成依赖预构建的第三个性能目标。依赖预构建只发生在开发模式，生产环境会执行正式构建。

::: tip Vite 7 与 Vite 8 差异
- Vite 7 使用 esbuild 完成依赖预构建，生产构建使用 Rollup
- Vite 8 使用 Rolldown 完成依赖预构建和生产构建
- Vite 7 自定义预构建底层行为使用 `optimizeDeps.esbuildOptions`
- Vite 8 对应使用 `optimizeDeps.rolldownOptions`
:::

业务代码始终保持正常的包导入写法：

```javascript
import React, { useState } from "react";
import { debounce } from "lodash-es";

const reportCount = debounce((count) => console.log(count), 200);

export function Counter() {
  const [count, setCount] = useState(0);

  return React.createElement(
    "button",
    {
      onClick: () => {
        setCount(count + 1);
        reportCount(count + 1);
      },
    },
    String(count),
  );
}
```

Vite 会在内部把依赖请求转换为类似 `/node_modules/.vite/deps/lodash-es.js?v=...` 的 URL。这个地址包含缓存版本信息，只用于说明内部机制，不应复制到源码中。

### 依赖预构建缓存

预构建结果默认缓存在 `node_modules/.vite`。Vite 7 会根据包管理器 lock 文件、补丁目录修改时间、相关 Vite 配置和 `NODE_ENV` 等信息判断是否需要重新构建。需要强制刷新时，可以使用：

```bash
npm run dev -- --force
```

依赖请求还会使用强缓存响应头，并通过 URL 查询参数在依赖版本变化时失效。如果正在本地调试依赖，需要同时留意 Vite 文件缓存和浏览器缓存。

## 3. Vite 配置文件

本文以 Vite 7 为基准。与 Vite 8 不同的部分会单独标注；没有发生变化的配置和 Vue 单文件组件流程仍按 Vite 7 讲解。

Vite 默认在项目根目录查找 `vite.config.js`，也支持 `vite.config.ts` 以及其他 JavaScript、TypeScript 扩展名。需要使用其他文件时，可以通过 `vite --config my.config.js` 指定。

### 配置类型提示

Vite 自带 TypeScript 类型。VS Code、WebStorm 等编辑器通常都可以通过 `defineConfig`、JSDoc 或 TypeScript 获得配置提示，不需要针对 VS Code 做特殊转换。

使用 `defineConfig`：

```javascript
import { defineConfig } from "vite";

export default defineConfig({
  optimizeDeps: {
    exclude: [],
  },
});
```

`defineConfig` 主要用于帮助编辑器和 TypeScript 推导配置类型，它不是 TypeScript 编译器。

在 JavaScript 配置中使用 JSDoc：

```javascript
/** @type {import("vite").UserConfig} */
export default {
  optimizeDeps: {
    exclude: [],
  },
};
```

在 TypeScript 配置中也可以使用 `satisfies`：

```typescript
import type { UserConfig } from "vite";

export default {
  optimizeDeps: {
    exclude: [],
  },
} satisfies UserConfig;
```

### 按运行命令拆分配置

把配置拆成基础、开发和生产文件是一种项目组织方式，不是 Vite 的强制约定。例如：

- `vite.config.js`
- `vite.base.config.js`
- `vite.dev.config.js`
- `vite.prod.config.js`

嵌套配置不能只依赖对象展开或 `Object.assign()`：二者都是浅合并，可能整体覆盖 `server`、`build`、`resolve` 等嵌套对象。合并对象形式的 Vite 配置时，可以使用 `mergeConfig`。

```javascript
// vite.config.js
import { defineConfig, loadEnv, mergeConfig } from "vite";
import viteBaseConfig from "./vite.base.config.js";
import viteDevConfig from "./vite.dev.config.js";
import viteProdConfig from "./vite.prod.config.js";

export default defineConfig(({ command, mode }) => {
  // 第三个参数是变量名前缀。这里仅加载 APP_ 开头的变量。
  const env = loadEnv(mode, process.cwd(), "APP_");
  const environmentConfig =
    command === "build" ? viteProdConfig : viteDevConfig;
  const mergedConfig = mergeConfig(viteBaseConfig, environmentConfig);

  if (command === "serve" && env.APP_PORT) {
    return mergeConfig(mergedConfig, {
      server: {
        port: Number(env.APP_PORT),
      },
    });
  }

  return mergedConfig;
});
```

```javascript
// vite.base.config.js
import { defineConfig } from "vite";

export default defineConfig({
  optimizeDeps: {
    exclude: [],
  },
});
```

```javascript
// vite.dev.config.js
import { defineConfig } from "vite";

export default defineConfig({});
```

```javascript
// vite.prod.config.js
import { defineConfig } from "vite";

export default defineConfig({});
```

`command` 在开发服务器中是 `serve`，在生产构建中是 `build`。`mergeConfig` 用于合并对象形式的配置；如果某个配置本身是配置函数，应先执行该函数并取得配置对象，再进行合并。

### Vite 7 与 Vite 8：配置加载差异

Vite 即使在项目没有启用原生 Node.js ESM 时，也允许在配置文件中使用 ESM 语法。它不是简单地把所有 ESM 文本替换成 CommonJS。

- Vite 7 默认通过 esbuild 把配置打包到临时文件后加载。
- Vite 8 默认改用 Rolldown 完成配置打包和加载。
- 两个版本都可以根据需要选择 `runner` 或 `native` 配置加载方式，但这些方式具有不同的模块兼容性和配置依赖监听限制。

## 4. Vite 环境变量配置

环境变量是由运行或构建环境提供的键值配置。开发、测试、预发布、灰度和生产可以作为项目自行约定的 mode，但它们不是 Vite 强制规定的一组固定环境。

### 环境文件及优先级

Vite 使用 `dotenv` 读取环境文件，并使用 `dotenv-expand` 支持变量展开。默认从 `envDir` 指定的目录加载文件；`envDir` 默认是项目根目录，它表示目录而不是某个 `.env` 文件。

Vite 会按当前 mode 考虑以下文件：

```text
.env                 # 所有 mode 都会加载
.env.local           # 所有 mode 都会加载，通常不提交到 Git
.env.[mode]          # 仅指定 mode 加载
.env.[mode].local    # 仅指定 mode 加载，通常不提交到 Git
```

优先级规则如下：

1. Vite 启动前已经存在于进程环境中的变量优先级最高，不会被 `.env` 文件覆盖。
2. mode 专用文件中的同名变量优先于通用文件。
3. `.env.local` 和 `.env.[mode].local` 可能包含本地配置，应将 `*.local` 加入 `.gitignore`。
4. 环境文件在 Vite 启动时读取，修改后应重启开发服务器。

### mode 不等于 `NODE_ENV`

开发服务器默认使用 `development` mode，生产构建默认使用 `production` mode。这是 Vite 的默认行为，并不是 `npm run dev` 自动把命令改写成 `npm run dev --mode development`。

可以显式指定其他 mode：

```bash
vite build --mode staging
```

mode 决定加载哪些 `.env.[mode]` 文件；`NODE_ENV` 则影响开发或生产语义。两者相关但不是同一个概念，例如 `vite build --mode staging` 仍然执行构建命令。

### 在配置文件中读取环境变量

Vite 要先解析最终的 `root`、`envDir` 和 mode，才能确定应该加载哪些环境文件。因此，在 `vite.config.*` 正在求值时，`.env*` 中的变量不会自动出现在 `process.env` 中；只有启动 Vite 前已经存在的进程变量可以直接读取。

如果环境变量需要影响 Vite 配置，可以调用 `loadEnv(mode, envDir, prefixes)`：

```javascript
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "APP_");

  return {
    server: {
      port: env.APP_PORT ? Number(env.APP_PORT) : 5173,
    },
  };
});
```

第三个参数用于过滤变量名前缀，默认值是 `VITE_`，不是环境文件名。传入空字符串 `""` 可以让 `loadEnv` 返回所有已加载变量，但应避免把这些变量继续暴露给客户端。

### 在客户端代码中读取环境变量

默认情况下，只有名称以 `VITE_` 开头的自定义变量才会暴露给经过 Vite 处理的客户端代码。例如：

```dotenv
VITE_API_BASE_URL=https://api.example.com
VITE_FEATURE_ENABLED=true
DB_PASSWORD=do-not-expose-this
```

```javascript
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const featureEnabled = import.meta.env.VITE_FEATURE_ENABLED === "true";

console.log(apiBaseUrl, featureEnabled);
```

自定义环境变量会以字符串形式暴露，因此数字和布尔值需要显式转换。Vite 还提供以下内置常量：

- `import.meta.env.MODE`
- `import.meta.env.BASE_URL`
- `import.meta.env.DEV`
- `import.meta.env.PROD`
- `import.meta.env.SSR`

其中 `DEV`、`PROD` 和 `SSR` 是布尔值。

`VITE_*` 变量会进入客户端代码，并在构建时静态替换，因此不能存放密码、私钥或服务端密钥。部署完成后修改服务器环境变量，也不会自动改变已经生成的客户端产物。

可以使用 `envPrefix` 增加允许暴露的前缀：

```javascript
import { defineConfig } from "vite";

export default defineConfig({
  envPrefix: ["VITE_", "PUBLIC_"],
});
```

扩大暴露范围前必须确认变量不含敏感信息。不能把空字符串配置成 `envPrefix`，否则会导致所有变量都有机会进入客户端，Vite 会拒绝这种配置。

Vite 7 与 Vite 8 的环境文件命名、mode、`loadEnv` 和客户端前缀机制在这里没有根本变化。

## Vue 单文件组件如何被编译

创建当前最新版本的 Vue + Vite 项目可以使用：

```bash
npm create vite@latest my-vue-app -- --template vue
```

`npm create` 会调用 create-vite，不要求全局安装脚手架。截至 Vite 8 发布后，`@latest` 创建的是当前最新版项目；如果需要复现本文的 Vite 7 环境，应在 `package.json` 中锁定 Vite 7，并根据 `peerDependencies` 选择兼容的 `@vitejs/plugin-vue` 版本。

Vite 对 Vue 单文件组件的支持来自官方的 `@vitejs/plugin-vue`：

```javascript
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
});
```

浏览器不能原生执行 `.vue` 文件。开发期间，当浏览器请求由 `.vue` 文件导入的模块时，Vite 开发服务器会让 Vue 插件完成转换，再以浏览器可以执行的 ESM 和正确的 JavaScript MIME 类型返回结果。

### 单文件组件的主要处理过程

1. **解析 SFC**：`vue/compiler-sfc` 解析源文件，得到包含 `template`、`script`、`styles` 和自定义块等信息的 SFC descriptor。这不是通过字符串的 `.find("<template>")` 完成的。
2. **处理脚本**：普通 `<script>` 和 `<script setup>` 会按各自规则处理，`<script setup>` 中的编译宏也会在这一阶段转换。
3. **编译模板**：模板经过解析、转换和代码生成，得到 render 函数代码，而不是在编译阶段直接生成真实 DOM。
4. **处理样式**：每个 `<style>` 块会单独处理；预处理器、`scoped` 和 CSS Modules 等能力也在相应流程中完成。
5. **处理资源**：模板中的静态图片等资源 URL 可以被转换成 ESM 导入，由 Vite 的资源管线继续处理。
6. **组装组件模块**：脚本、render 函数、样式和其他元数据被组合为可导入的 JavaScript 模块。开发服务器内部可能通过带查询参数的模块请求分别处理不同 SFC 块。
7. **运行时渲染**：组件的 render 函数在浏览器运行时创建 VNode；Vue 渲染器再根据 VNode 挂载或更新真实 DOM。

开发期间，`@vitejs/plugin-vue` 还会为 Vue 组件提供 HMR。生产构建时仍会执行相应的 SFC 转换，但生成结果会进入生产打包流程，而不是由开发服务器按请求返回。

### Vite 7 与 Vite 8：Vue SFC 流程差异

| 环节 | Vite 7 | Vite 8 |
| --- | --- | --- |
| 默认配置文件打包加载 | esbuild | Rolldown |
| 普通 JavaScript、TypeScript、JSX 转换 | 主要使用 esbuild | 主要使用 Oxc Transformer |
| 生产打包 | Rollup | Rolldown |
| Vue SFC 核心处理 | `@vitejs/plugin-vue` + `vue/compiler-sfc` | 仍由 `@vitejs/plugin-vue` + `vue/compiler-sfc` 负责 |

因此，Vite 8 改变了部分底层工具，但不能把 Vue SFC 描述成由 Rolldown 或 Oxc 单独完成解析。Vue 模板和 SFC 块的核心语义仍由 Vue 官方编译器与插件处理。

## 参考资料

- [Vite 7：配置 Vite](https://v7.vite.dev/config/)
- [Vite 7：环境变量与模式](https://v7.vite.dev/guide/env-and-mode)
- [Vite 8：配置 Vite](https://vite.dev/config/)
- [Vite 8：环境变量与模式](https://vite.dev/guide/env-and-mode)
- [Vite：框架支持](https://vite.dev/guide/features#frameworks)
- [`@vitejs/plugin-vue`](https://github.com/vitejs/vite-plugin-vue/tree/main/packages/plugin-vue)

## 5. 在 Vite 中处理 CSS

本文以 Vite 7 为基准。Vite 8 中与 CSS 处理有关的差异会单独标注。

### 普通 CSS 的开发与构建行为

Vite 支持从 JavaScript、组件、HTML 以及其他样式文件中导入 CSS。下面只是最常见的 JavaScript 导入方式：

```javascript
import "./index.css";
```

开发期间，Vite 会把 CSS 纳入模块图，依次执行适用的 `@import`、资源 URL、预处理器和 PostCSS 等处理，并把处理后的样式注入页面。CSS 更新时可以通过 HMR 替换相关样式，而不必刷新整个页面。

这不等于 Vite 会修改项目中的 `index.html` 文件，也不应把内部实现固定描述为“用 `fs` 读取文件、复制到 `<style>`、再把源文件抹除”。对浏览器而言，CSS 导入会经过 Vite 的模块转换；相关 JavaScript 模块响应使用正确的 JavaScript MIME 类型，而不是不存在的 `Content-Type: js`。

生产构建时，CSS 会进入构建管线。Vite 通常把样式提取为 CSS 资源，并根据 `build.cssCodeSplit` 等配置决定如何拆分，而不是继续照搬开发期的样式注入方式。

如果只希望取得处理后的 CSS 字符串而不向页面注入样式，可以使用 `?inline`：

```javascript
import styles from "./theme.css?inline";

console.log(styles);
```

从 Vite 5 开始，普通 CSS 文件不再支持 `import styles from "./theme.css"` 这种默认导入；需要字符串时应使用 `?inline`。CSS Modules 的导出对象不受这条规则影响。

## 6. 配置 CSS Modules

协作开发时，不同组件可能都使用 `footer`、`wrapper` 等类名。普通 CSS 处于全局作用域，同名选择器可能互相覆盖。CSS Modules 通过局部作用域和导出映射降低这类冲突。

文件名使用 `*.module.css` 约定；结合预处理器时也可以使用 `*.module.scss`、`*.module.less` 等名称。

```css
/* component.module.css */
.footer {
  color: #646cff;
}

:global(.legacy-button) {
  font: inherit;
}
```

```javascript
import styles from "./component.module.css";

const footer = document.createElement("footer");
footer.className = styles.footer;
footer.textContent = "Footer";
document.body.append(footer);
```

默认情况下，`.footer` 会得到局部作用域名称，并通过 `styles.footer` 暴露给 JavaScript；具体生成名称取决于文件、类名、配置和处理器实现，不保证一定是 `_footer_i22st_1`。`:global()` 中的选择器保持全局语义。

### `css.modules` 配置

Vite 默认使用 PostCSS 处理 CSS 时，CSS Modules 选项位于 `css.modules` 下：

```javascript
import { defineConfig } from "vite";

export default defineConfig({
  css: {
    modules: {
      localsConvention: "camelCaseOnly",
      scopeBehaviour: "local",
      generateScopedName: "[name]__[local]___[hash:base64:5]",
      hashPrefix: "vite-7-notes",
      globalModulePaths: [/global\.module\.css$/],
    },
  },
});
```

- `localsConvention`：控制导出键采用 camelCase、dashes 等形式。正确名称是复数的 `localsConvention`。
- `scopeBehaviour`：控制默认作用域是 `local` 还是 `global`，默认值为 `local`。
- `generateScopedName`：自定义生成的局部类名，可以是字符串模板或函数。
- `hashPrefix`：向生成名称所用的确定性输入中加入自定义前缀，不代表存在随机字符。
- `globalModulePaths`：使用正则表达式把匹配路径按全局模块处理。普通的非 `*.module.*` CSS 本来就是全局样式，不需要依赖该选项排除。

CSS Modules 是否启用由文件命名和处理方式决定，不能通过“生成名称中有没有 hash”判断。

### Lightning CSS 下的配置位置

Vite 7 和 Vite 8 都可以选择 Lightning CSS：

```bash
npm install -D lightningcss
```

```javascript
import { defineConfig } from "vite";

export default defineConfig({
  css: {
    transformer: "lightningcss",
    lightningcss: {
      cssModules: {
        pattern: "[name]_[local]_[hash]",
      },
    },
  },
});
```

启用 `css.transformer: "lightningcss"` 后，`css.modules` 不再生效，应改用 `css.lightningcss.cssModules`。这属于 CSS 处理器的选择，并不是 Vite 8 的 Rolldown 或 Oxc 自动替换了 CSS Modules。

## 7. 配置 CSS 预处理器与 Source Map

Vite 支持 `.scss`、`.sass`、`.less`、`.styl` 和 `.stylus` 文件，不要求安装 Vite 专用插件，但必须安装实际使用的预处理器：

```bash
# Sass：优先选择 sass-embedded，也可以使用 sass
npm install -D sass-embedded

# Less
npm install -D less

# Stylus
npm install -D stylus
```

只需要安装项目实际使用的包。本地安装的命令行程序通常通过 npm scripts 或 `npm exec` 调用，例如 `npm exec lessc -- input.less output.css`，不能假定 `lessc` 已成为全局命令。

预处理器选项位于 `css.preprocessorOptions`，而开发期 CSS Source Map 位于同级的 `css.devSourcemap`：

```javascript
import { defineConfig } from "vite";

export default defineConfig({
  css: {
    preprocessorOptions: {
      less: {
        math: "parens-division",
      },
      scss: {
        additionalData: "$brand-color: #646cff;",
      },
    },
    devSourcemap: true,
  },
});
```

`additionalData` 会添加到每个匹配的样式文件前。如果注入的不是变量、mixin 等定义，而是真实 CSS 规则，这些规则可能在最终产物中重复出现。通过 `additionalData` 导入文件时，还应使用可稳定解析的绝对路径或别名，避免相对路径随当前文件目录变化。

### Source Map 是什么

Source Map 是一种 JSON 映射格式，用于建立转换后代码与原始源码位置之间的对应关系。开发者工具可以借助它把转换后的 CSS、JavaScript 定位回原始 SCSS、TypeScript 等源码。

映射可以通过 `sourceMappingURL` 注释、HTTP `SourceMap` 响应头等方式关联，也可能以内联形式存在。它不保证一定在文件末尾包含 Base64，更不是简单复制一份源代码；映射文件可能包含 `sourcesContent`，也可能只保存来源和位置映射。

`css.devSourcemap` 只控制开发期 CSS Source Map，默认值为 `false`，不应把它等同于所有生产构建阶段的 Source Map 设置。

## 8. 配置 PostCSS

PostCSS 是一个使用 JavaScript 插件分析和转换 CSS AST 的工具。PostCSS 核心不会自动完成前缀补全、嵌套、变量或未来语法降级；每项能力取决于实际安装并启用的插件。

在常见的 Vite 样式流程中，可以把处理顺序理解为：

```text
SCSS / Less 等源文件
  → 对应预处理器输出 CSS
  → PostCSS 按配置顺序执行插件
  → Vite 在开发服务器中提供样式，或交给生产构建管线
```

这是一条常见管线，不代表 PostCSS 的定义就是“后处理器”。插件的顺序会影响最终结果，PostCSS 也不能保证 CSS“万无一失”。

浏览器不会替源码自动添加缺少的厂商前缀。`-webkit-` 等前缀可以由 Autoprefixer 或 `postcss-preset-env` 中启用的相关能力，结合目标浏览器配置生成。正确前缀是单个开头连字符的 `-webkit-`，不是 `--webkit`。

PostCSS 插件可以实现部分与预处理器相似的语法，但不能因此认为 PostCSS 完整涵盖 Less 或 Sass。相似地，Babel 只有配置相应 preset 或插件后才能处理部分 TypeScript 语法，而且不会进行 TypeScript 类型检查。

### 在 Vite 中使用独立 PostCSS 配置

Vite 已集成 PostCSS 配置加载。通常不需要为 Vite 另装 `postcss-cli`；应安装实际要使用的 PostCSS 插件。例如：

```bash
npm install -D postcss postcss-preset-env
```

使用 ESM 配置文件：

```javascript
// postcss.config.mjs
import postcssPresetEnv from "postcss-preset-env";

export default {
  plugins: [
    postcssPresetEnv({
      stage: 3,
    }),
  ],
};
```

`plugins` 必须使用小写。CommonJS 项目也可以使用 `postcss.config.cjs` 和 `module.exports`，但不能在启用 `"type": "module"` 的项目中不加区分地混用 CommonJS 配置格式。

`postcss-preset-env` 会根据选项和目标浏览器启用一组现代 CSS 转换能力，但它不是 Less/Sass 编译器，也不能保证所有未来 CSS 都能无损降级。

### 在 `vite.config.*` 中内联 PostCSS 配置

也可以直接配置 `css.postcss`：

```javascript
import postcssPresetEnv from "postcss-preset-env";
import { defineConfig } from "vite";

export default defineConfig({
  css: {
    postcss: {
      plugins: [postcssPresetEnv({ stage: 3 })],
    },
  },
});
```

使用内联 `css.postcss` 后，Vite 不再搜索其他 PostCSS 配置源；内联配置中的 `plugins` 只接受数组形式。因此，这不是简单的“内联配置优先级更高”，而是切换到了内联配置源。

### 原生 CSS 自定义属性

CSS 自定义属性通过级联和继承在浏览器运行时工作：

```css
:root {
  --brand-color: #646cff;
}

.button {
  color: var(--brand-color);
}
```

PostCSS 插件可以对部分自定义属性用法生成兼容输出，但旧浏览器转换无法完整复制所有运行时级联和动态修改语义。是否需要转换，应根据目标浏览器和插件能力决定，不能用“新版本好像没有这个问题”作为结论。

## Vite 7 与 Vite 8：CSS 工具链差异

| 环节 | Vite 7 | Vite 8 |
| --- | --- | --- |
| 默认 CSS 转换器 | PostCSS | PostCSS |
| 可选 CSS 转换器 | Lightning CSS | Lightning CSS |
| CSS Modules | 默认由 PostCSS Modules 相关流程处理 | 默认仍由 PostCSS Modules 相关流程处理 |
| Sass、Less、Stylus | 需要安装相应预处理器 | 仍需要安装相应预处理器 |
| 生产打包器 | Rollup | Rolldown |

Vite 8 使用 Rolldown 进行生产打包，并使用 Oxc 处理普通 JavaScript、TypeScript 和 JSX，但这不等于它们替代了 PostCSS、Lightning CSS、Sass 或 Less。本文中的 CSS 配置在两个版本间没有根本变化；切换 CSS 处理器时仍应检查对应配置项。

## 参考资料

- [Vite 7：CSS 功能](https://v7.vite.dev/guide/features#css)
- [Vite 7：CSS 配置](https://v7.vite.dev/config/shared-options#css-modules)
- [Vite 8：CSS 功能](https://vite.dev/guide/features#css)
- [Vite 8：CSS 配置](https://vite.dev/config/shared-options#css-modules)
- [PostCSS](https://postcss.org/)
- [MDN：Source Map](https://developer.mozilla.org/en-US/docs/Glossary/Source_map)

## Node.js 中的文件路径处理

本文以 Vite 7 为基准。与 Vite 8 不同的构建选项会单独标注。

`node:fs` 用于读取、写入和检查文件系统，`node:path` 用于解析、规范化和组合路径字符串。调用 `path.resolve()` 本身不会读取文件；只有执行 `readFile()`、`readFileSync()` 等文件系统 API 时才会访问文件系统。

### CommonJS 中的路径

CommonJS 模块提供 `__filename` 和 `__dirname`。如果文件路径应相对于当前模块，而不是启动命令所在目录，可以这样读取：

```javascript
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const filePath = resolve(__dirname, "./variable.css");
const content = readFileSync(filePath, "utf8");

console.log({
  filePath,
  content,
  currentWorkingDirectory: process.cwd(),
  currentModuleDirectory: __dirname,
});
```

`readFileSync()` 默认返回 Buffer；传入 `"utf8"` 后会直接返回字符串。也可以对 Buffer 调用 `buffer.toString("utf8")`，方法名不是 `tostring()`。

传给文件系统 API 的相对路径通常相对 `process.cwd()` 解释。`process.cwd()` 是函数，返回当前 Node.js 进程的工作目录；它可能因启动命令的位置而变化。`__dirname` 则表示当前 CommonJS 模块所在目录。

`path.resolve()` 不是普通字符串拼接。它会从右向左处理路径片段，识别绝对路径，并规范化 `.`、`..` 和平台分隔符，最终返回绝对路径。

### ESM 中的路径

ESM 不应直接假定存在 CommonJS 的 `__dirname`。可以使用 `import.meta.url` 和 URL API；Node.js 文件系统 API 也可以直接接收 `file:` URL：

```javascript
import { readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = dirname(currentFilePath);
const fileUrl = new URL("./variable.css", import.meta.url);
const content = await readFile(fileUrl, "utf8");

console.log({ currentDirectory, content });
```

较新的 Node.js 还提供 `import.meta.dirname`，但 `fileURLToPath(import.meta.url)` 兼容更广。同步文件 API 会阻塞事件循环，可以在一次性的配置初始化中按需使用；高频或并发路径通常更适合 Promise API。

## 9. Vite 加载静态资源

静态资源通常指在构建或部署期间已有确定内容的文件，例如图片、SVG、字体、音频、视频和文本。Vite 不强制这些文件必须放在名为 `assets` 的目录。

Vite 中应区分两类资源：

| 类型 | 使用方式 | 构建行为 |
| --- | --- | --- |
| 源码中导入或引用的资源 | `import`、CSS `url()`、HTML/Vue 模板引用 | 进入构建图，可以被重命名、hash、内联或交给插件处理 |
| `public` 目录资源 | 通过根绝对路径引用，例如 `/icon.png` | 开发时从 `/` 提供，构建时原样复制到输出根目录，不自动 hash |

`public` 目录默认位于项目根目录下，可以通过 `publicDir` 修改或禁用。

### 导入资源 URL

常见图片、媒体和字体类型会被 Vite 自动识别。导入资源会返回解析后的公共 URL：

```javascript
import logoUrl from "./assets/logo.svg";

const image = document.createElement("img");
image.src = logoUrl;
image.alt = "Logo";
document.body.append(image);
```

这个返回值不能统一称为“绝对文件路径”。开发时它通常是浏览器可访问的 URL；生产构建时会受到 `base`、输出配置和资源内联规则影响。小资源还可能根据 `build.assetsInlineLimit` 转成 data URL。

对于未被内置列表或 `assetsInclude` 识别的文件，可以用 `?url` 显式指定 URL 语义：

```javascript
import workletUrl from "./paint-worklet.js?url";

CSS.paintWorklet.addModule(workletUrl);
```

SVG 本身属于常见资源，因此普通默认导入通常已经能获得 URL；`?url` 可以用于显式表达意图，但不是导入 SVG 的唯一方式。

### 把资源作为字符串导入

`?raw` 会返回文件原始文本：

```javascript
import svgMarkup from "./assets/icon.svg?raw";

const container = document.createElement("span");
container.className = "icon";
container.innerHTML = svgMarkup;
document.body.append(container);

const svg = container.querySelector("svg");
svg?.setAttribute("aria-hidden", "true");
```

只有可信的本地内容才适合直接交给 `innerHTML`；不可信 SVG 可能带来 XSS。使用独立容器也可以避免 `document.body.innerHTML = ...` 清空页面原有内容。

SVG 是矢量格式，普通矢量图形缩放时通常不会像位图那样像素化，但嵌入位图、复杂路径和滤镜仍会影响质量、渲染成本和文件体积。SVG 也不一定比对应位图更小。

如果希望通过 CSS 控制图标颜色，可以在 SVG 中使用 `fill="currentColor"`，再设置容器的 `color`。直接修改根 `<svg>` 的 `fill` 不保证覆盖拥有自身 `fill` 或内联样式的子元素。

### JSON 与 Tree Shaking

JSON 导入得到的是模块值，不是“JSON 字符串形式的资源 URL”：

```javascript
import config from "./config.json";

console.log(config);
```

Vite 还支持 JSON 命名导入。Tree shaking 是构建工具基于静态模块关系、实际使用情况和副作用信息删除不可达代码的优化，不保证删除所有看似未使用的变量或方法。

### 其他资源引用方式

- CSS 中的 `url()` 会进入相同的资源处理流程。
- 使用 Vue 插件时，Vue SFC 模板中的常见资源引用会被转换成导入。
- 可以使用 `assetsInclude` 扩展被视为静态资源的文件类型。
- `new URL("./asset.png", import.meta.url).href` 是原生 ESM URL 写法，适合静态、可分析的相对路径；SSR 中的 `import.meta.url` 语义不同，不能不加判断地照搬客户端结果。

## `resolve.alias` 的解析思路

别名的目标是让模块解析器在解析导入标识符时，把匹配项映射到另一个模块或文件系统位置。它不是对整段 JavaScript 源码执行 `String.replace()`：字符串替换无法可靠区分静态导入、动态导入、CSS 引用、普通字符串和包导出，也容易漏掉多次引用。

文件系统别名的 replacement 应使用绝对路径。ESM 配置可以这样写：

```javascript
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
```

```javascript
import { createApp } from "vue";
import App from "@/App.vue";

createApp(App).mount("#app");
```

Vite 会在模块解析阶段匹配 `@/App.vue`，再继续执行文件扩展名、插件和包解析等流程。它不会依赖查找字符串中的 `"/src"`，因此也不会受到 Windows 路径分隔符或源码中普通文本的干扰。

Vite 7 的别名能力与 Rollup 生态兼容；Vite 8 的底层打包器改为 Rolldown，但简单的对象或数组别名仍可使用。Vite 8 已弃用数组别名条目中的 `customResolver`；复杂解析逻辑应迁移到自定义插件的 `resolveId` hook。

## 10. Vite 在生产环境中处理静态资源

正常通过 Vite 导入或引用的资源会在构建时自动重写 URL。构建后找不到资源通常意味着引用绕过了构建图、`base` 与部署路径不一致，或者服务器没有正确提供输出目录，而不是 Vite 构建的必然结果。

### 使用 `base` 配置部署基础路径

Vite 使用 `base` 控制开发与生产中的公共基础路径：

```javascript
import { defineConfig } from "vite";

export default defineConfig({
  base: "/docs/",
});
```

`base` 可以是 `/docs/` 这样的绝对 URL 路径、完整 URL、空字符串或 `./`。webpack 核心中相近的概念通常是 `output.publicPath`；某些框架提供过自己的 `baseUrl` 或 `publicPath`，不能把 `baseUrl` 当作 webpack 的通用配置项。

### hash 与浏览器缓存

构建图中的资源通常使用内容相关的 hash 文件名。目的不是禁用缓存，而是实现精确的缓存失效：

- 内容没有变化时，URL 可以保持稳定并继续命中长期缓存。
- 内容变化时，hash 和 URL 随之变化，浏览器会请求新资源。
- HTML 通常应及时重新验证，因为它负责引用最新资源 URL。
- 带内容 hash 的静态资源适合使用长期、不可变缓存策略。

`public` 目录中的文件按原名复制，不会自动得到内容 hash；小型源码资源也可能根据 `assetsInlineLimit` 直接内联，而不生成独立文件。

### Vite 7 与 Vite 8 的构建配置差异

Vite 7 使用 Rollup，可以通过 `build.rollupOptions` 调整资源输出：

```javascript
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
```

Vite 8 改用 Rolldown，推荐使用 `build.rolldownOptions`：

```javascript
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
```

Vite 8 暂时把 `build.rollupOptions` 保留为 `build.rolldownOptions` 的兼容别名，但它已经弃用。以 Vite 7 为基准的配置不应直接删除；面向 Vite 8 的新配置应迁移到 `rolldownOptions`，并检查复杂 Rollup 插件或输出选项与 Rolldown 的兼容性。

## 参考资料

- [Node.js：File system](https://nodejs.org/api/fs.html)
- [Node.js：Path](https://nodejs.org/api/path.html)
- [Vite 7：静态资源处理](https://v7.vite.dev/guide/assets)
- [Vite 7：公共配置](https://v7.vite.dev/config/shared-options)
- [Vite 8：静态资源处理](https://vite.dev/guide/assets)
- [Vite 8：从 Vite 7 迁移](https://vite.dev/guide/migration.html)

## Vite 插件机制

可以把插件系统类比为一条具有多个处理节点的流水线，但需要注意：一个插件可以实现多个钩子，同一个钩子阶段也可以依次运行多个插件。插件并不等同于中间件；只有 `configureServer` 等服务端钩子中注册的请求处理函数才属于中间件。

Vite 7 的插件接口扩展自 Rollup 插件接口，并增加了 Vite 专用钩子。开发环境中，Vite 的插件容器会按需调用 `resolveId`、`load`、`transform` 等通用钩子；配置解析、开发服务器和 HTML 转换等工作则分别由 `config`、`configureServer`、`transformIndexHtml` 等专用钩子处理。

```javascript
export default function examplePlugin() {
  return {
    // name 是插件对象的必填字段，会显示在警告和错误信息中
    name: "example-plugin",

    // 只在开发服务中启用；也可以写成 "build"
    apply: "serve",

    transform(code, id) {
      if (!id.endsWith(".js")) return null;
      return { code, map: null };
    },
  };
}
```

- 插件级 `enforce: "pre" | "post"` 用于调整插件整体的执行顺序。
- `transformIndexHtml` 对象中的 `order: "pre" | "post"` 只调整该 HTML 钩子的执行顺序，不能写成 `enforce`。
- `apply: "serve" | "build"` 可以限制插件仅用于开发服务或构建。

## `vite-aliases` 插件

[`vite-aliases`](https://github.com/subwaytime/vite-aliases) 可以根据目录结构生成 `resolve.alias`。它默认从 `src` 目录生成别名，可以通过 `deep` 和 `depth` 控制搜索深度，README 建议主要处理第一层目录。遇到同名目录时，还需要考虑别名冲突。

::: warning 版本与模块格式
该插件的 README 标明它面向 Vite 6，并且只支持 ESM。下面保留它作为第三方插件示例；在 Vite 7 或 Vite 8 中使用前，应根据实际版本验证兼容性。项目还需要以 ESM 方式加载配置，例如在 `package.json` 中设置 `"type": "module"`，或者使用 `.mjs` / `.mts` 配置文件。
:::

```bash
npm i vite-aliases -D
```

```javascript
// vite.config.js
import { defineConfig } from "vite";
import { ViteAliases } from "vite-aliases";

export default defineConfig({
  plugins: [
    ViteAliases({
      dir: "src",
      prefix: "~",
      deep: true,
      depth: 1,
    }),
  ],
});
```

## 手写目录别名插件

Vite 加载配置文件并取得用户插件后，才会调用插件的 `config` 钩子。该钩子不会改写磁盘上的 `vite.config.*` 文件，而是参与生成本次运行使用的配置。

`config` 接收 CLI 选项与配置文件合并后的原始用户配置。它可以返回部分配置，Vite 会将其深度合并；如果需要读取最终解析完成的配置，应改用 `configResolved`。

下面的示例为 `src` 本身和它的第一层子目录生成别名：

```javascript
// plugins/directory-aliases.js
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { normalizePath } from "vite";

export default function directoryAliases({
  dir = "src",
  prefix = "@",
} = {}) {
  return {
    name: "directory-aliases",

    config(userConfig) {
      const root = path.resolve(process.cwd(), userConfig.root ?? ".");
      const sourceDirectory = path.resolve(root, dir);

      if (!existsSync(sourceDirectory)) {
        return;
      }

      const alias = [
        {
          find: prefix,
          replacement: normalizePath(sourceDirectory),
        },
      ];

      const directories = readdirSync(sourceDirectory, {
        withFileTypes: true,
      })
        .filter((entry) => entry.isDirectory())
        .sort((left, right) => left.name.localeCompare(right.name));

      for (const directory of directories) {
        alias.push({
          find: `${prefix}${directory.name}`,
          replacement: normalizePath(
            path.resolve(sourceDirectory, directory.name),
          ),
        });
      }

      return {
        resolve: { alias },
      };
    },
  };
}
```

```javascript
// vite.config.js
import { defineConfig } from "vite";
import directoryAliases from "./plugins/directory-aliases.js";

export default defineConfig({
  plugins: [directoryAliases()],
});
```

如果新增或删除了目录，需要重启 Vite，使 `config` 钩子重新生成别名。自动别名还应与 `tsconfig.json` 或 `jsconfig.json` 中的 `paths` 保持一致，否则编辑器可能无法识别这些路径。

## `vite-plugin-html` 插件

[`vite-plugin-html`](https://github.com/vbenjs/vite-plugin-html) 是基于 EJS 模板语法处理 HTML 的第三方插件。它在开发服务和构建阶段转换 HTML，而不是在浏览器运行时动态修改页面。

```bash
npm i vite-plugin-html -D
```

```javascript
// vite.config.js
import { defineConfig } from "vite";
import { createHtmlPlugin } from "vite-plugin-html";

export default defineConfig({
  plugins: [
    createHtmlPlugin({
      inject: {
        data: {
          title: "Vite Demo",
        },
      },
    }),
  ],
});
```

在 `index.html` 中使用对应的 EJS 占位符：

```html
<title><%= title %></title>
```

`<%=` 会对插值内容进行转义，`<%-` 则输出未转义内容。是否使用未转义输出，应取决于数据是否可信。

## 手写 HTML 转换插件

Vite 的 `transformIndexHtml` 专门用于转换 HTML 入口文件。它既可以直接写成函数，也可以写成 `{ order, handler }` 对象。

```javascript
const htmlEscapes = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) => htmlEscapes[character],
  );
}

export default function htmlTitlePlugin({ title = "Vite Demo" } = {}) {
  return {
    name: "html-title",

    transformIndexHtml: {
      order: "pre",
      handler(html) {
        return html.replaceAll("APP_TITLE_PLACEHOLDER", escapeHtml(title));
      },
    },
  };
}
```

```html
<title>APP_TITLE_PLACEHOLDER</title>
```

该钩子的第二个参数是转换上下文，包含 `path`、`filename`；开发环境中还可以包含 `server`，构建阶段可以包含 `bundle` 和 `chunk`。除字符串外，钩子还可以返回标签描述数组，或者返回 `{ html, tags }`。

## `vite-plugin-mock` 插件

[`vite-plugin-mock`](https://github.com/vbenjs/vite-plugin-mock) 使用 Connect 中间件在开发环境处理 Mock 请求，并可以配合 Mock.js 生成示例数据。Mock.js 和 Faker 的主要职责是生成测试数据；它们本身不能替代请求拦截和路由处理。

::: warning 版本与生产环境
该插件 README 声明的范围是 Vite 2 及以上，但这不等于已经验证所有 Vite 7、Vite 8 组合。使用前应核对具体包版本。生产 Mock 只适合测试环境，不应在正式生产环境开启，否则可能拦截真实请求。
:::

```bash
npm i vite-plugin-mock mockjs -D
```

```javascript
// vite.config.js
import { defineConfig } from "vite";
import { viteMockServe } from "vite-plugin-mock";

export default defineConfig(({ command }) => ({
  plugins: [
    viteMockServe({
      mockPath: "mock",
      enable: command === "serve",
      watchFiles: true,
    }),
  ],
}));
```

插件负责加载 Mock 路由文件并处理请求，随机数据仍由 Mock.js 等数据生成器产生：

```javascript
// mock/user.js
import Mock from "mockjs";

const { users } = Mock.mock({
  "users|100": [
    {
      "id|+1": 1,
      name: "@cname",
    },
  ],
});

export default [
  {
    method: "post",
    url: "/api/user",
    response: ({ body }) => {
      const page = Math.max(Number(body?.page) || 1, 1);
      const pageSize = Math.max(Number(body?.pageSize) || 10, 1);
      const start = (page - 1) * pageSize;

      return {
        code: 200,
        message: "success",
        data: users.slice(start, start + pageSize),
      };
    },
  },
];
```

## 手写 Mock 服务插件

`configureServer` 只在开发服务器中调用。下面实现一个最小示例：它加载 ESM 格式的 `mock/index.js`，同时匹配请求路径和方法，并解析 JSON 请求体。

```javascript
// plugins/local-mock-service.js
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let rawBody = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      rawBody += chunk;
    });
    request.on("end", () => {
      if (!rawBody) {
        resolve(undefined);
        return;
      }

      try {
        resolve(JSON.parse(rawBody));
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

export default function localMockService({
  mockFile = "mock/index.js",
} = {}) {
  return {
    name: "local-mock-service",
    apply: "serve",

    async configureServer(server) {
      const absoluteMockFile = path.resolve(process.cwd(), mockFile);

      if (!existsSync(absoluteMockFile)) {
        return;
      }

      const mockModule = await import(pathToFileURL(absoluteMockFile).href);
      const routes = Array.isArray(mockModule.default)
        ? mockModule.default
        : [];

      server.middlewares.use(async (request, response, next) => {
        try {
          const url = new URL(request.url ?? "/", "http://localhost");
          const requestMethod = (request.method ?? "GET").toLowerCase();
          const route = routes.find(
            (item) =>
              item.url === url.pathname &&
              (item.method ?? "get").toLowerCase() === requestMethod,
          );

          if (!route) {
            next();
            return;
          }

          const body = await readJsonBody(request);
          const payload =
            typeof route.response === "function"
              ? await route.response({
                  body,
                  query: Object.fromEntries(url.searchParams),
                  headers: request.headers,
                })
              : route.response;

          response.statusCode = route.statusCode ?? 200;
          response.setHeader(
            "Content-Type",
            "application/json; charset=utf-8",
          );
          response.end(JSON.stringify(payload));
        } catch (error) {
          next(error);
        }
      });
    },
  };
}
```

这个教学示例只在服务器启动时加载一次 Mock 文件；修改 Mock 路由后需要重启开发服务器。真实工具通常还会增加文件监听、请求体大小限制、延迟、代理规则和更完整的错误响应。

## Vite 插件钩子总结

| 钩子 | 主要职责 |
| --- | --- |
| `config` | 在配置解析完成前读取原始用户配置，并返回需要合并的部分配置 |
| `configResolved` | 读取最终解析完成的 Vite 配置 |
| `configureServer` | 配置开发服务器，常用于注册 Connect 中间件 |
| `configurePreviewServer` | 配置 `vite preview` 使用的预览服务器 |
| `transformIndexHtml` | 转换 HTML 入口，或向 HTML 中注入标签 |
| `resolveId` | 自定义模块标识符的解析方式 |
| `load` | 自定义模块内容的加载方式 |
| `transform` | 转换已经加载的模块内容 |

## Vite 8 差异

Vite 8 使用 Rolldown 作为统一打包器。大部分常规 Vite 插件钩子仍然保留，但依赖 Rollup 特定行为的第三方插件需要重新验证兼容性。

如果插件通过 `load` 或 `transform` 把其他类型的文件转换为 JavaScript，Rolldown 会先根据文件扩展名推断模块类型；这类插件在 Vite 8 中可能需要显式返回 `moduleType: "js"`：

```javascript
export default function textPlugin() {
  return {
    name: "text-to-javascript",
    load(id) {
      if (!id.endsWith(".txt")) return null;

      return {
        code: `export default ${JSON.stringify("text content")}`,
        moduleType: "js",
      };
    },
  };
}
```

本文的别名、HTML 和开发服务器中间件示例没有把其他模块类型转换为 JavaScript，因此不需要添加 `moduleType`。

## 参考资料

- [Vite 7：Plugin API](https://v7.vite.dev/guide/api-plugin)
- [Vite 8：Plugin API](https://vite.dev/guide/api-plugin)
- [Vite 8：Migration from v7](https://vite.dev/guide/migration)
- [`vite-aliases` README](https://github.com/subwaytime/vite-aliases)
- [`vite-plugin-html` README](https://github.com/vbenjs/vite-plugin-html)
- [`vite-plugin-mock` README](https://github.com/vbenjs/vite-plugin-mock)

## Vite 与 TypeScript 结合

TypeScript 是 JavaScript 的带类型超集，同时提供编译器和语言服务。它可以在运行代码前发现一部分静态类型问题，并为编辑器提供补全、跳转和重构能力，但不能保证发现所有运行时错误或业务逻辑错误。

Vite 原生支持导入 `.ts` 文件，不需要为了转换 TypeScript 而安装额外插件。不过，Vite 只负责把 TypeScript 转译为 JavaScript，不会在转换过程中执行完整类型检查。

转译可以逐文件完成，适合 Vite 的按需处理模型；完整类型检查通常需要理解整个模块图，因此更适合由编辑器、TypeScript 编译器或独立检查插件完成。

::: info Vite 7 与 Vite 8
Vite 7 主要使用 esbuild 转换普通 TypeScript；Vite 8 改用 Oxc Transformer。底层转换器发生了变化，但两个版本都不会因此自动执行完整的 TypeScript 类型检查。
:::

逐文件转换无法可靠判断一个导入是否只在类型位置使用，因此应明确使用类型导入和导出：

```typescript
import type { User } from "./types";
export type { User };
```

## 类型检查的几种方式

类型检查不一定要通过 Vite 插件完成，可以根据使用场景选择以下方式：

1. 依靠编辑器中的 TypeScript Language Service 提供实时诊断。
2. 开发时单独运行 `tsc --noEmit --watch`。
3. 构建前运行 `tsc --noEmit`，检查通过后再执行 `vite build`。
4. 使用 `vite-plugin-checker`，把检查结果输出到终端和浏览器错误面板。

例如，可以把类型检查与生产构建明确串联：

```json
{
  "scripts": {
    "dev": "vite",
    "typecheck": "tsc --noEmit",
    "build": "npm run typecheck && vite build"
  }
}
```

单独执行 `vite build` 默认不会因为普通 TypeScript 类型错误而失败。对于 Vue 单文件组件，如果还需要检查模板表达式，应使用 `vue-tsc --noEmit`，而不只是普通的 `tsc --noEmit`。

## 使用 `vite-plugin-checker`

[`vite-plugin-checker`](https://github.com/fi3ework/vite-plugin-checker) 是第三方检查插件，可以在工作线程中运行 TypeScript、`vue-tsc`、ESLint 等检查器。使用 TypeScript 检查器前，需要确保项目已经安装它的 peer dependency `typescript`。

```bash
npm i vite-plugin-checker typescript -D
```

```javascript
// vite.config.js
import { defineConfig } from "vite";
import checker from "vite-plugin-checker";

export default defineConfig({
  plugins: [
    checker({
      typescript: {
        tsconfigPath: "tsconfig.json",
      },
      terminal: true,
      overlay: true,
      enableBuild: true,
    }),
  ],
});
```

- `terminal` 控制是否向启动 Vite 的终端输出诊断。
- `overlay` 控制开发页面中的错误面板。
- `enableBuild` 控制是否在构建阶段运行检查，默认值为 `true`。
- TypeScript 检查器可以通过 `root` 和 `tsconfigPath` 指定配置文件位置。
- `buildMode: true` 会让检查器调用 `tsc --build`；该模式与普通 `noEmit` 检查的行为不同，不能把二者混为一谈。

对于需要检查 Vue 模板的项目，插件提供独立的 `vueTsc` 检查器：

```javascript
checker({
  vueTsc: true,
});
```

这个插件负责运行并展示检查结果，不会改变 Vite 转译 TypeScript 的方式。使用新 Vite 大版本时，还应核对所安装插件版本的兼容范围。

## 配置 `tsconfig.json`

`tsconfig.json` 不只包含类型检查规则，还会描述模块解析策略、目标运行环境、参与检查的文件以及是否生成输出等行为。

下面是一份适合由 Vite 负责输出、TypeScript 主要负责静态检查的基础示例：

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noEmit": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "types": ["vite/client"]
  },
  "include": ["src", "vite-env.d.ts"]
}
```

- `module: "ESNext"` 保留 ESM 语法，交给 Vite 继续处理。
- `moduleResolution: "Bundler"` 让 TypeScript 按打包器场景解析模块，并支持 `package.json` 的 `imports`、`exports` 等规则。
- `noEmit: true` 让 TypeScript 只检查而不另外生成 JavaScript，最终输出仍由 Vite 负责。
- `isolatedModules: true` 让 TypeScript 提醒哪些写法不适合逐文件转换。
- `strict: true` 启用严格类型检查。
- `types: ["vite/client"]` 引入静态资源导入、`import.meta.env` 和 HMR 等客户端类型。指定 `types` 后，只有列出的类型包会自动进入全局作用域，其他需要的全局类型也应显式加入。

### 正确认识 `skipLibCheck`

`skipLibCheck: true` 跳过的是声明文件，也就是 `.d.ts` 文件的完整类型检查，并不是简单地忽略整个 `node_modules` 目录。项目自己的声明文件同样可能受到影响，而依赖中的普通 `.ts` 文件也不会仅因为该选项而全部跳过。

启用它可以缩短检查时间并暂时绕过第三方声明冲突，但会牺牲一部分类型系统准确性。遇到重复的依赖类型或版本冲突时，应优先解决根因，而不是把 `skipLibCheck` 当作永久修复方案。

## 为环境变量补充类型

只有符合 `envPrefix` 的变量才会暴露给客户端；默认前缀是 `VITE_`。这些值在客户端均以字符串形式提供，而且会进入最终客户端代码，因此不能存放密码、令牌等秘密信息。

```dotenv
# .env
VITE_API_BASE_URL=https://api.example.com
```

可以在 `src/vite-env.d.ts` 或其他被 `tsconfig.json` 包含的声明文件中增强类型：

```typescript
/// <reference types="vite/client" />

interface ViteTypeOptions {
  strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

该声明文件中不要添加顶层 `import`，否则全局接口增强可能失效。`strictImportMetaEnv` 会让未知环境变量键产生类型错误；如果不需要严格键名检查，可以省略 `ViteTypeOptions`。

在客户端代码中通过 `import.meta.env` 读取变量：

```typescript
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error("缺少 VITE_API_BASE_URL 环境变量");
}
```

类型声明只提供静态检查和编辑器提示，不能保证运行时变量真实存在，所以关键配置仍应在运行时验证。修改 `.env` 文件后还需要重启 Vite，新的值才会被重新加载。

## 参考资料

- [Vite 7：TypeScript](https://v7.vite.dev/guide/features#typescript)
- [Vite 7：环境变量的 TypeScript 提示](https://v7.vite.dev/guide/env-and-mode#intellisense-for-typescript)
- [Vite 8：从 Vite 7 迁移](https://vite.dev/guide/migration)
- [TypeScript：`skipLibCheck`](https://www.typescriptlang.org/tsconfig/skipLibCheck.html)
- [TypeScript：`moduleResolution`](https://www.typescriptlang.org/tsconfig/moduleResolution.html)
- [`vite-plugin-checker`：TypeScript](https://vite-plugin-checker.netlify.app/checkers/typescript.html)

## Vite 项目的性能优化

前端性能优化需要先明确目标，再用数据验证结果。常见目标可以分为以下几类：

1. **开发体验**：冷启动、热启动、首次模块转换、HMR 更新时间和生产构建时间。
2. **加载性能**：服务器响应、资源发现、下载、解析和首屏渲染。
3. **交互性能**：输入响应、主线程长任务、动画流畅度。
4. **视觉稳定性**：页面加载和交互过程中是否出现意外布局偏移。
5. **构建产物**：资源体积、chunk 数量、缓存稳定性以及 JavaScript 解析和执行成本。

Vite 的按需转换通常能改善开发服务器启动速度，但不意味着开发性能无需关注。大型依赖、耗时插件、复杂转换、文件数量和网络文件系统仍可能拖慢启动与 HMR。webpack 早期项目常使用 `cache-loader` 等方案，而 webpack 5 已提供内置持久化缓存，不能把旧插件当作当前通用方案。

启动命令由 `package.json` 中的脚本决定。Vite 脚手架的默认开发脚本通常是：

```bash
npm run dev
```

## 页面性能指标

### FCP

FCP（First Contentful Paint，首次内容绘制）表示从页面开始导航到浏览器首次绘制文本、图片、非空 Canvas 或 SVG 等内容的时间。它不是“第一个 DOM 元素的渲染耗时”。

### LCP

LCP（Largest Contentful Paint，最大内容绘制）表示视口内最大合格图片、文本块或视频等内容的渲染时间。它是 Core Web Vitals 之一，良好目标通常是不超过 2.5 秒，并以移动端和桌面端各自第 75 百分位的访问数据评估。

当前 Core Web Vitals 主要包括：

- LCP：加载性能。
- INP（Interaction to Next Paint）：交互响应能力。
- CLS（Cumulative Layout Shift）：视觉稳定性。

FCP 仍然是有用的加载指标，但不属于当前 Core Web Vitals。

懒加载可以减少非首屏资源竞争，但不能机械地用于所有资源。首屏 LCP 图片通常应尽早发现并加载；把它设置为懒加载可能使 LCP 变差。页面性能还会受到服务器响应、网络、缓存策略、资源优先级和第三方服务影响，不能只归因于业务代码。

## HTTP 缓存

“强缓存”和“协商缓存”是常见教学分类，实际行为由 HTTP 缓存指令、响应的新鲜度和验证器共同决定。

### 直接复用仍然新鲜的响应

现代项目通常使用 `Cache-Control: max-age` 声明响应在多长时间内保持新鲜；`Expires` 是基于绝对时间的旧式方式。内容 hash 文件适合长期缓存，例如：

```http
Cache-Control: public, max-age=31536000, immutable
```

新鲜响应通常可以直接复用，但“无论怎样刷新都不会请求”并不成立。普通刷新、强制刷新、开发者工具设置以及不同导航方式都可能改变缓存行为。

### 重新验证已经过期的响应

缓存过期后，可以使用以下验证器向服务器确认内容是否变化：

- `ETag` 与请求头 `If-None-Match`。
- `Last-Modified` 与请求头 `If-Modified-Since`。

内容已变化时，服务器通常返回 `200 OK` 和新响应体；内容未变化时，可以返回不带响应体的 `304 Not Modified`，客户端继续复用已有响应。

`Cache-Control: no-cache` 表示响应可以存储，但使用前需要重新验证；`no-store` 才表示不应存储响应。

## JavaScript 副作用与调度

### 正确清理定时器

`setTimeout` 会注册定时任务，不会为每个定时器创建新的 JavaScript 线程。在 React effect 中，可以使用局部变量保存定时器 ID，并在清理函数中取消：

```javascript
useEffect(() => {
  const timerId = window.setTimeout(() => {
    // 延迟任务
  }, 1000);

  return () => window.clearTimeout(timerId);
}, []);
```

把定时器 ID 放入 state 会造成不必要的渲染，而且清理函数还可能捕获旧 state。依赖数组应按 effect 实际读取的响应式值填写，示例中的空数组只表示该 effect 不依赖组件内会变化的值。

### `requestAnimationFrame`

`requestAnimationFrame` 用于把动画更新安排到浏览器下一次绘制之前。60Hz 屏幕的理想帧预算约为 16.7ms，但 90Hz、120Hz 等设备不同，长任务和系统调度也可能造成丢帧，因此浏览器不保证固定每 16.7ms 绘制一次。

```javascript
const animationId = requestAnimationFrame((timestamp) => {
  // 根据 timestamp 更新动画状态
});

cancelAnimationFrame(animationId);
```

### `requestIdleCallback`

`requestIdleCallback` 会请求浏览器在主线程空闲时运行低优先级任务，不等于“当前帧剩余时间内一定执行”。必要任务应设置 `timeout`，并通过 `IdleDeadline.timeRemaining()` 判断剩余预算：

```javascript
const idleId = requestIdleCallback(
  (deadline) => {
    while (deadline.timeRemaining() > 0) {
      // 执行一小段可拆分的低优先级工作
      break;
    }
  },
  { timeout: 1000 },
);

cancelIdleCallback(idleId);
```

该 API 尚未覆盖所有主流浏览器，使用前应检查兼容性并准备回退方案。React 并发渲染是 React 自身的调度机制，也不能理解成浏览器可以中断任意一段已经执行的普通 JavaScript。

## JavaScript 和 CSS 优化原则

防抖、节流可以自行实现，也可以使用 Lodash 等库；选择库并不自动代表性能更好。`Array.prototype.forEach`、`for...of`、普通 `for` 和工具库遍历各有适用场景，应通过真实数据和性能分析选择，而不是固定地把原生 `forEach` 替换为 `lodash.forEach`。

```javascript
const values = [1, 2, 3];

for (let index = 0; index < values.length; index += 1) {
  console.log(values[index]);
}
```

`values.length` 是数组自身属性，并不是从 `window` 或父级作用域读取。手动缓存数组长度通常只是微优化，现代 JavaScript 引擎可能已经完成相应优化；只有基准测试证明它是瓶颈时才值得调整。

CSS 中合理使用继承、控制嵌套和特异性主要有助于维护。深层嵌套可能增加复杂度，但不能仅凭层数断定存在明显运行时性能问题，仍应结合选择器匹配和页面规模测量。

## 构建与分包策略

构建优化需要同时权衡：

- 构建耗时。
- 初始加载体积和请求数量。
- JavaScript 解析与执行成本。
- 动态加载边界。
- chunk 的长期缓存稳定性。

Vite 通常会为构建资源生成与内容相关的 hash。并不是每次构建的所有 hash 都必然变化；某个 chunk 的内容和依赖关系保持稳定时，它的文件名也可能保持稳定。浏览器是否请求或重新验证资源仍取决于 HTTP 缓存策略，不能只根据文件名判断。

分包既可以把更新频率不同的代码分开，也可以实现路由级按需加载、隔离大型依赖和控制首屏成本。构建发生在构建环境，浏览器只下载构建产物，二者不能描述成“浏览器每次重新请求整个文件并打包”。

如果只使用数组遍历，不应先假设引入完整 Lodash 一定更快。可以使用原生方法、按功能导入，或者在需要 ESM Tree Shaking 时评估 `lodash-es`：

```typescript
import { debounce } from "lodash-es";

const onSearch = debounce((keyword: string) => {
  console.log(keyword);
}, 200);
```

### Vite 7：使用 `manualChunks`

Vite 7 默认使用 Rollup 构建，可以通过 `build.rollupOptions.output.manualChunks` 控制特定依赖的 chunk。不要机械地把所有 `node_modules` 合并为一个巨大的 `vendor` 文件，否则任意依赖变化都可能使整个 vendor chunk 失效。

```javascript
// vite.config.js
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/lodash-es")) {
            return "lodash";
          }
        },
      },
    },
  },
});
```

生产构建默认应保留压缩。为了观察 chunk 内容而临时设置 `minify: false` 可以用于调试，但不能把关闭压缩本身称为性能优化。多页面入口、TypeScript 检查和分包也是不同问题，不应混进同一个最小示例。

### Vite 8：使用 `codeSplitting`

Vite 8 使用 Rolldown，`build.rollupOptions` 已重命名为 `build.rolldownOptions`，`manualChunks` 也已弃用。新的分包配置使用 `output.codeSplitting`：

```javascript
// vite.config.js
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "lodash",
              test: /node_modules\/lodash-es/,
            },
          ],
        },
      },
    },
  },
});
```

::: warning CommonJS 与 Tree Shaking
CommonJS 的导出和加载方式较为动态，会限制打包器的静态分析，因此通常不如原生 ESM 容易进行 Tree Shaking。但“CommonJS 完全无法优化”过于绝对：打包器仍可能转换 CommonJS，并删除部分能够安全识别的无用代码。需要稳定的 Tree Shaking 时，应优先选择提供原生 ESM 入口的依赖。
:::

## HTTP 内容压缩

Gzip 不是已经淘汰的旧方案，它仍是广泛支持的 HTTP 内容编码。现代部署还可以同时生成 Brotli 文件，由服务器根据客户端的 `Accept-Encoding` 选择合适版本。

压缩主要适合 JavaScript、CSS、HTML、JSON、SVG 等文本资源。PNG、JPEG、WebP、MP4、WOFF2 等通常已经采用压缩格式，再次压缩可能收益很小，甚至增大文件。

服务器可以在响应时动态压缩，也可以直接发送构建阶段生成的 `.gz`、`.br` 预压缩文件。生成预压缩文件并不等于部署完成，服务器或 CDN 还必须配置内容协商，并保留原始文件作为回退。

::: tip chunk
chunk 是打包器输出的一组模块代码。它可能来自入口、动态导入或多个入口共享的依赖，并不等同于“某个入口及其全部依赖”。chunk 通常输出为 JavaScript 文件，也可能关联 CSS 等其他资源。
:::

[`vite-plugin-compression2`](https://github.com/nonzzz/vite-plugin-compression) 可以在构建阶段生成预压缩资源：

```bash
npm i vite-plugin-compression2 -D
```

```javascript
import { defineConfig } from "vite";
import { compression } from "vite-plugin-compression2";

export default defineConfig({
  plugins: [
    compression({
      algorithms: ["gzip", "brotliCompress"],
      threshold: 1024,
      skipIfLargerOrEqual: true,
      deleteOriginalAssets: false,
    }),
  ],
});
```

请求和响应的关键关系如下：

```http
Accept-Encoding: br, gzip

Content-Encoding: br
Vary: Accept-Encoding
Content-Type: application/javascript
```

`Content-Encoding` 描述资源使用的编码，不会取代原始 `Content-Type`。浏览器会自动解码受支持的响应。是否值得压缩应根据原始大小、压缩后大小、构建或服务器成本、客户端 CPU 和网络条件衡量，不能简单规定“小文件一律不压缩”。

## 动态导入

webpack、Vite 7 的 Rollup 和 Vite 8 的 Rolldown 都支持静态导入、动态导入和代码分割。`import()` 是进入 ES2020 的动态导入语法，它返回一个 Promise，解析值是模块命名空间对象。

动态导入常用于路由，也可以延迟加载编辑器、图表、语言包等大型功能：

```javascript
async function loadImageTools() {
  try {
    const imageTools = await import("./src/imageLoader.js");
    imageTools.initialize?.();
  } catch (error) {
    console.error("图片工具加载失败", error);
  }
}
```

合适的动态导入通常会形成独立 chunk，这不是 webpack 独有的原理。部署新版本后，如果旧页面引用的 chunk 已被删除，加载可能失败；Vite 还会为预加载失败派发 `vite:preloadError` 事件，可结合刷新或版本提示处理。

## CDN 加速

CDN（Content Delivery Network，内容分发网络）通过分布式节点让用户从更合适的位置获取资源，但使用 CDN 不保证一定更快。额外的 DNS 查询和连接、缓存命中率、服务可用性、隐私和供应链安全都需要考虑。

不应机械地把所有第三方依赖都外置到 CDN。适合外置的依赖通常版本稳定、体积较大，并且具有可直接在浏览器加载的构建格式。使用第三方地址时应固定版本，并评估 SRI、CORS、故障回退和内容许可。

`vite-plugin-cdn-import` 可以在生产构建中把指定模块外置，并注入对应 CDN 标签。它依赖模块提供正确的浏览器全局变量；其 README 没有声明对每个 Vite 大版本的兼容范围，因此在 Vite 7 或 Vite 8 中使用前需要核对具体插件版本。

```bash
npm i vite-plugin-cdn-import -D
```

```javascript
// vite.config.js
import { defineConfig } from "vite";
import cdn from "vite-plugin-cdn-import";

export default defineConfig({
  plugins: [
    cdn({
      modules: [
        {
          name: "lodash",
          var: "_",
          path: "https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js",
        },
      ],
    }),
  ],
});
```

这里固定了 Lodash 版本，并通过全局变量 `_` 使用浏览器构建。实际采用前还应确认 CDN 地址、响应头、完整性策略和不可用时的回退方式。

## 参考资料

- [web.dev：Largest Contentful Paint](https://web.dev/articles/lcp)
- [MDN：HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching)
- [MDN：`requestIdleCallback`](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback)
- [MDN：`Content-Encoding`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Encoding)
- [Vite 8：从 Vite 7 迁移](https://vite.dev/guide/migration)
- [`vite-plugin-compression2` README](https://github.com/nonzzz/vite-plugin-compression)
- [`vite-plugin-cdn-import` README](https://github.com/MMF-FE/vite-plugin-cdn-import)

## 同源策略与开发服务器代理

源由协议、主机名和端口共同确定。浏览器的同源策略会限制来自一个源的脚本读取另一个源的受保护资源，但它不等于“HTTP 只能在同源终端之间通信”，也不意味着跨源请求一定没有发送。

CORS（Cross-Origin Resource Sharing）是服务器通过 HTTP 响应头声明允许哪些源读取响应的机制。非简单请求还可能先发送预检请求。`Access-Control-Allow-Origin` 只是 CORS 响应头之一，涉及凭据、方法或自定义请求头时还需要相应配置。

开发阶段可以让浏览器只请求同源的 Vite 开发服务器，再由 `server.proxy` 把匹配请求转发到目标服务。代理没有关闭同源策略，而是改变了浏览器直接访问的地址。生产环境通常由应用服务器、反向代理、API 网关或目标服务的 CORS 配置处理，不能依赖 Vite 的开发代理。

```javascript
// vite.config.js
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    // 开发服务器中的配置
    proxy: {
      // 配置跨域解决方案
      "/api": {
        // 路径以 /api 开头的请求会被转发到 target
        target: "https://api.example.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
```

请求路径是：浏览器 → Vite 开发服务器 → 目标服务器 → Vite 开发服务器 → 浏览器。服务器之间的请求不受浏览器同源策略限制，但仍可能受到认证、网络、防火墙和目标服务器策略限制。

## Vite 配置示例

```javascript
// vite.config.js
import { defineConfig, loadEnv, mergeConfig } from "vite";
import viteBaseConfig from "./vite.base.config";
import viteDevConfig from "./vite.dev.config";
import viteProdConfig from "./vite.prod.config";

const configByCommand = {
  build: viteProdConfig,
  serve: viteDevConfig,
};

export default defineConfig(({ command, mode }) => {
  // command 表示 serve 或 build；mode 是另一套独立概念
  const env = loadEnv(mode, process.cwd(), "APP_");
  console.log("当前 API 地址：", env.APP_API_URL);

  // mergeConfig 按 Vite 规则合并嵌套配置；对象展开只会浅合并
  return mergeConfig(viteBaseConfig, configByCommand[command]);
});
```

下面给出一份以 Vite 7 为基准的 ESM 配置。`envPrefix` 控制哪些环境变量可以通过 `import.meta.env` 暴露给客户端，它不是“校验前缀”；不要把密码、密钥等敏感信息放进这些变量。

```javascript
// vite.example.config.js（Vite 7）
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import postcssPresetEnv from "postcss-preset-env";

const configDir = path.dirname(fileURLToPath(import.meta.url));

const configObserver = {
  name: "config-observer",
  configResolved(config) {
    // config 是 Vite 合并并解析后的配置
    console.log(config.command);
  },
  configurePreviewServer(server) {
    // 仅在 vite preview 启动预览服务器时调用
    console.log(server.config.command);
  },
  buildStart() {
    // Rollup 兼容钩子；开发服务器和生产构建启动时都可能调用
  },
};

export default defineConfig({
  optimizeDeps: {
    // 只有确认某个依赖不应被预构建时才把它列在这里
    exclude: [],
  },
  envPrefix: ["VITE_", "APP_"],
  css: {
    modules: {
      localsConvention: "camelCaseOnly",
      scopeBehaviour: "local",
      generateScopedName: "[name]_[local]_[hash:base64:5]",
      hashPrefix: "project-name",
      // globalModulePaths 接收正则表达式数组，而不是普通路径字符串数组
      globalModulePaths: [/global\.module\.css$/],
    },
    preprocessorOptions: {
      less: {
        math: "always",
        additionalData: "@main-color: red;",
      },
    },
    devSourcemap: true,
    postcss: {
      plugins: [postcssPresetEnv()],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(configDir, "src"),
      "@assets": path.resolve(configDir, "src/assets"),
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    // 单位是字节；Vite 7 的默认值是 4096，即 4 KiB
    assetsInlineLimit: 4096,
    emptyOutDir: true,
    rollupOptions: {
      output: {
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
  plugins: [configObserver],
});
```

`assetsInlineLimit` 判断的是导入或引用的资源大小。小于阈值的资源通常会以内联 data URL 的形式进入产物；设为 `0` 可以关闭这一行为。Git LFS 占位文件不会被内联，库模式也有单独规则。

插件工厂的返回值应该作为 `plugins` 数组的元素，而不是写成同一个插件对象中的任意方法。假设下面三个工厂已经定义或导入，可以这样组合：

```javascript
export default defineConfig({
  plugins: [directoryAliases(), htmlTitlePlugin(), localMockService()],
});
```

其中每个工厂都必须返回带有唯一 `name` 的合法 Vite 插件对象。`configResolved`、`configurePreviewServer`、`buildStart` 等才是插件钩子；是否使用第三方插件由实际功能需求决定。

### Vite 8 的构建配置差异

Vite 7 的正式版本默认使用 Rollup 构建，因此使用 `build.rollupOptions`。Vite 8 改用 Rolldown，并把对应配置项改为 `build.rolldownOptions`；`build.rollupOptions` 在 Vite 8 中只是已弃用的兼容别名。迁移时可以这样写：

```javascript
// vite.config.js（Vite 8）
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
```

## 参考资料

- [MDN：同源策略](https://developer.mozilla.org/zh-CN/docs/Web/Security/Same-origin_policy)
- [MDN：跨源资源共享（CORS）](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Guides/CORS)
- [Vite 7：配置 Vite](https://v7.vite.dev/config/)
- [Vite 7：共享配置](https://v7.vite.dev/config/shared-options)
- [Vite 7：开发服务器配置](https://v7.vite.dev/config/server-options)
- [Vite 7：构建配置](https://v7.vite.dev/config/build-options)
- [Vite 8：从 Vite 7 迁移](https://vite.dev/guide/migration)
