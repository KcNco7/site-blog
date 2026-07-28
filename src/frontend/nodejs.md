# 随便写

## 先把“页面形态”和“渲染方式”分开

SPA、MPA 描述的是页面导航与应用组织方式，CSR、SSR、SSG 描述的是 HTML 在什么时间、什么位置生成。它们不是同一组互斥概念。

| 维度 | 术语 | 含义 |
|------|------|------|
| 导航形态 | SPA | 首次加载应用后，后续路由通常由客户端 JavaScript 切换，不必每次整页刷新 |
| 导航形态 | MPA | 不同 URL 通常由服务器返回不同 HTML 文档，导航时会加载新文档 |
| 渲染方式 | CSR | 浏览器执行 JavaScript，根据数据创建或更新 DOM |
| 渲染方式 | SSR | 服务器在请求期间生成当前页面的 HTML 响应 |
| 渲染方式 | SSG | 构建时预先生成 HTML，部署后通常由静态服务器或 CDN 直接返回 |

因此，一个应用可以首次访问时使用 SSR，随后完成 hydration，再以 SPA 方式进行客户端导航。SPA 并不意味着所有页面都只能使用 CSR，MPA 也不意味着后端必须承担全部业务渲染。

## 三种常见的首次访问流程

### CSR

1. 服务器先返回基础 HTML 和静态资源地址。
2. 浏览器下载、解析并执行 JavaScript。
3. JavaScript 创建页面结构，必要时再请求业务数据。
4. 数据返回后更新界面。

如果主要内容必须等待较大的 JavaScript 包和接口请求，首次内容展示可能较晚；但后续客户端导航可以非常流畅。

### SSR

1. 浏览器请求一个 URL。
2. 服务器读取必要数据并生成该次请求对应的 HTML。
3. 浏览器收到 HTML 后可以先展示内容。
4. 客户端 JavaScript 下载并执行，为已有 HTML 绑定状态和事件。

服务器返回的通常是 HTML 内容以及 CSS、JavaScript 等资源引用，并不表示所有 CSS 和 JavaScript 都已经在服务器“执行完成”。

### SSG

1. 构建阶段为已知 URL 生成 HTML。
2. 部署后由静态服务器或 CDN 返回文件。
3. 页面可以是纯静态的，也可以在浏览器中继续加载 JavaScript 获得交互能力。

SSG 把渲染成本移到构建阶段，适合文档、博客、营销页等内容更新频率相对可控的页面。

## hydration 是什么

SSR 或预渲染页面通常已经包含可见 HTML，但复杂交互仍需要客户端 JavaScript。hydration 是客户端框架在现有 HTML 上恢复应用状态、绑定事件处理器并接管后续更新的过程。

“已经看见页面”不一定等于“页面已经可以交互”。如果 JavaScript 体积过大或主线程长时间忙碌，页面可能先显示内容，稍后才能响应点击。

服务器生成的内容与客户端首次渲染结果不一致时，还可能出现 hydration mismatch。时间、随机数、浏览器专属 API、用户本地状态等数据应在正确的执行环境和生命周期中读取。

## 不要只用“首屏快慢”判断方案

渲染策略的实际表现取决于缓存、网络、设备性能、服务器延迟、JavaScript 体积、数据依赖和实现质量。常见观察指标包括：

- `TTFB`：从发起导航到收到首字节的时间。
- `FCP`：首次出现文本、图片等内容的时间。
- `LCP`：最大内容元素完成展示的时间。
- `INP`：页面响应用户交互的表现。
- 客户端 JavaScript 体积、执行时间与 hydration 成本。

SSR 可能改善首次内容展示和可抓取内容，但每次请求的数据读取与渲染会增加服务端工作；缓存、流式响应、边缘部署和静态化可以改变这一成本。CSR 可以减少服务器生成 HTML 的工作，却会把更多下载、解析、执行和渲染成本转移到用户设备。两者都不能脱离具体指标直接判断“谁一定更快”。

## 选型参考

| 方案 | 常见优势 | 主要代价 | 常见场景 |
|------|----------|----------|----------|
| CSR | 客户端交互模型直接，后续导航灵活 | 首次内容可能依赖 JavaScript 和接口，弱设备压力更大 | 登录后的管理后台、强交互工具 |
| SSR | 首次响应可包含实际内容，可按请求个性化 | 服务器渲染、缓存、数据失败和 hydration 更复杂 | 动态详情页、个性化且需要首屏内容的页面 |
| SSG | 易于 CDN 缓存，运行时渲染成本低 | 大量页面会增加构建成本，内容更新需要重新生成或增量机制 | 文档、博客、产品介绍 |
| 混合渲染 | 可以按路由或组件选择最合适策略 | 架构和缓存规则更复杂 | 同时包含公开内容与后台功能的完整产品 |

现代框架通常允许同一项目按页面甚至按组件组合多种策略，不必为整个站点只选一种。

## SPA 路由与服务器回退

使用 History API 路由的 SPA，用户直接访问 `/users/42` 或刷新该地址时，服务器必须知道如何处理这个 URL。常见做法是：

1. 静态资源和 API 路径按原规则处理。
2. 其他前端路由返回应用入口 HTML。
3. 客户端路由器读取当前 URL 并显示对应页面。

如果服务器没有配置回退，站内跳转可能正常，刷新深层链接却会返回 404。Hash 路由把路由信息放在 `#` 后面，服务器无需识别这部分，但 URL、服务端状态码和搜索引擎处理能力通常不如 History 路由自然。

## Node.js 在这些方案中的位置

Node.js 是 JavaScript 运行时，不等同于 SSR。它可以承担多种角色：

- 运行 SSR 或混合渲染框架的服务器代码。
- 提供 API、BFF、认证和数据聚合服务。
- 在构建阶段执行 SSG。
- 仅作为前端工程工具使用，而生产页面部署为静态文件。

是否使用 Node.js 与是否采用 SPA、CSR 或 SSR 是相关但独立的架构选择。

## SEO 不只取决于 SSR

搜索引擎能否理解页面，还取决于可访问的正文、正确标题与描述、语义化 HTML、规范链接、站点地图、内部链接、HTTP 状态码和加载性能。SSR 或 SSG 往往更容易让首次 HTML 直接包含内容，但它们不能自动保证 SEO；CSR 页面也需要结合目标搜索引擎的抓取能力和实际业务要求评估。

## pnpm

### 依赖安装

| npm                            | pnpm                             |
| ------------------------------ | -------------------------------- |
| `npm install`                  | `pnpm install`                   |
| `npm install pkg`              | `pnpm add pkg`                   |
| `npm install -D pkg`           | `pnpm add -D pkg`                |
| `npm install -g pkg`           | `pnpm add -g pkg`                |
| `npm install --save-exact pkg` | `pnpm add --save-exact pkg`      |
| `npm install pkg@1.0.0`        | `pnpm add pkg@1.0.0`             |
| `npm ci`                       | `pnpm ci`                         |

---

`pnpm ci` 是 pnpm 11 提供的清洁安装命令：它会先移除现有模块目录，再按冻结锁文件安装。较早版本常用的 `pnpm install --frozen-lockfile` 只保证不修改锁文件，不等同于先清理安装结果的 clean install。

### 依赖卸载

| npm                    | pnpm                 |
| ---------------------- | -------------------- |
| `npm uninstall pkg`    | `pnpm remove pkg`    |
| `npm uninstall -g pkg` | `pnpm remove -g pkg` |

---

### 依赖更新

| npm                 | pnpm                 |
| ------------------- | -------------------- |
| `npm update`        | `pnpm update`        |
| `npm update pkg`    | `pnpm update pkg`    |
| `npm update -g pkg` | `pnpm update -g pkg` |
| `npm outdated`      | `pnpm outdated`      |

---

### 脚本执行

| npm             | pnpm                             |
| --------------- | -------------------------------- |
| `npm run dev`   | `pnpm dev` 或 `pnpm run dev`     |
| `npm run build` | `pnpm build` 或 `pnpm run build` |
| `npm run test`  | `pnpm test` 或 `pnpm run test`   |
| `npm start`     | `pnpm start`                     |

> pnpm 可以省略 `run`，直接写脚本名

---

### 远程执行

| npm              | pnpm              |
| ---------------- | ----------------- |
| `npx pkg`        | `pnpm dlx pkg`    |
| `npm create xxx` | `pnpm create xxx` |
| `npx create-xxx` | `pnpm create xxx` |

---

### 项目初始化

| npm           | pnpm                      |
| ------------- | ------------------------- |
| `npm init`    | `pnpm init`               |
| `npm init -y` | `pnpm init` （默认即yes） |

---

### 查看信息

| npm                  | pnpm                  |
| -------------------- | --------------------- |
| `npm list`           | `pnpm list`           |
| `npm list --depth=0` | `pnpm list --depth=0` |
| `npm list -g`        | `pnpm list -g`        |
| `npm info pkg`       | `pnpm info pkg`       |
| `npm view pkg`       | `pnpm view pkg`       |

---

### 缓存与 Store 管理

这些命令的用途不同，不能按行视为等价替换：

| 工具 | 命令 | 作用 |
|------|------|------|
| npm | `npm cache clean --force` | 强制删除 npm 缓存中的内容 |
| npm | `npm cache verify` | 校验 npm 缓存索引和数据完整性，并回收无用数据 |
| pnpm | `pnpm store prune` | 删除 pnpm store 中当前未被项目引用的包 |
| pnpm | `pnpm store status` | 检查 store 中的包是否在解包后被修改 |
| pnpm | `pnpm store path` | 查看当前 store 路径 |

---

### 版本管理

| npm                 | pnpm                 |
| ------------------- | -------------------- |
| `npm version patch` | `pnpm version patch` |
| `npm version minor` | `pnpm version minor` |
| `npm version major` | `pnpm version major` |
| `npm -v`            | `pnpm -v`            |

---

### 发布相关

| npm           | pnpm           |
| ------------- | -------------- |
| `npm publish` | `pnpm publish` |
| `npm login`   | `pnpm login`   |
| `npm logout`  | `pnpm logout`  |
| `npm whoami`  | `pnpm whoami`  |

---

### Monorepo / Workspace

| npm                           | pnpm                                  |
| ----------------------------- | ------------------------------------- |
| `npm install pkg -w packages/foo` | `pnpm --filter foo add pkg`           |
| `npm run dev -w packages/foo` | `pnpm --filter foo dev`               |
| ——                            | `pnpm -r run build`                    |

> pnpm 提供过滤器、Workspace Protocol 和递归执行等能力；是否采用它应结合现有工具链、部署环境和团队需求判断。

`pnpm -r run build` 默认在工作区子项目中运行已有的 `build` 脚本，不包含工作区根项目，也会跳过没有该脚本的子项目。需要把根项目也纳入递归运行时，可启用 `includeWorkspaceRoot`。

---

### 总结

> 许多基础命令名称相近，但安装依赖、临时执行、缓存与 Store、工作区等操作的语义需要分别确认。常见差异包括：
>
> - `npm install pkg` → `pnpm add pkg`
> - `npx` → `pnpm dlx`
> - npm cache 命令与 pnpm store 命令不能简单一一替换

## pnpm 为什么能节省磁盘空间

pnpm 会把下载的包内容保存在内容寻址存储中，再通过链接组织每个项目的 `node_modules`。不同项目使用相同版本的包时，可以复用存储中的内容，而不必在每个项目里完整复制一份。

项目中的 `node_modules/.pnpm` 是虚拟存储目录，pnpm 再通过符号链接构造 Node.js 能解析的依赖结构。不要手工修改这些目录；依赖变化应通过 `package.json`、锁文件和 pnpm 命令管理。

这种布局还会减少“幽灵依赖”：项目通常只能直接访问自己明确声明的依赖。代码中直接导入某个传递依赖，即使在其他包管理器的扁平目录中偶然可用，也可能在 pnpm 下暴露为缺失依赖。正确做法是把实际使用的包写入当前项目的依赖声明。

## 固定包管理器版本

不同 pnpm 大版本支持的 Node.js 范围和默认行为可能不同。团队项目应固定版本，而不是依赖每台机器上的任意全局版本。

使用 Corepack 时，可以执行：

```shell
corepack use pnpm@latest-11
```

Node.js 25 起不再随 Node.js 一同分发 Corepack；如果系统中没有 `corepack` 命令，需要先按 Corepack 或 pnpm 官方说明单独安装，或者改用 pnpm 提供的其他安装方式。

pnpm 11 的官方兼容范围是 Node.js 22、24 和 26，不支持 Node.js 18、20。使用较旧的 Node.js 时，应按官方兼容表选择对应的 pnpm 大版本。

`corepack use pnpm@latest-11` 会解析并获取匹配的 pnpm 版本，在 `package.json` 中写入带具体版本的 `packageManager` 字段，并执行一次安装。运行前应保持工作区干净，运行后检查锁文件和 `node_modules` 的变化。实际项目应选择团队验证过的精确版本，并让本地开发与 CI 使用相同版本；升级大版本前需要阅读迁移说明。

## 锁文件与可重复安装

`pnpm-lock.yaml` 记录解析后的依赖版本、完整性信息和依赖关系，应用项目通常应把它提交到版本库。

```shell
# 日常安装，必要时更新锁文件
pnpm install

# 不允许创建或修改锁文件；不一致时直接失败
pnpm install --frozen-lockfile

# 仅更新清单和锁文件，不写入 node_modules
pnpm install --lockfile-only
```

在检测到 CI 环境且锁文件存在时，pnpm 默认会采用冻结锁文件的行为。显式写出 `--frozen-lockfile` 仍能清楚表达流水线意图。

不要混用 `package-lock.json`、`yarn.lock` 和 `pnpm-lock.yaml` 来描述同一个项目的安装结果。迁移前先确认团队统一使用 pnpm，再生成并审核新的锁文件。

## 依赖应该放在哪一类

```shell
# 运行应用时需要
pnpm add axios

# 只在开发、构建或测试时需要
pnpm add -D typescript

# 固定精确版本
pnpm add --save-exact axios

# 工作区根项目的开发依赖
pnpm add -Dw typescript
```

不要仅因为某个包“看起来像工具”就放进 `devDependencies`。判断标准是生产环境安装和运行该包时是否仍需要它。

直接写 `pnpm dev` 是 `pnpm run dev` 的便捷形式，但脚本名与 pnpm 自身命令冲突时会优先执行内置命令。团队文档和自动化脚本中写完整的 `pnpm run <script>` 更明确。

## `pnpm dlx` 的边界

`pnpm dlx` 会临时获取一个包并执行它提供的命令，适合脚手架等一次性任务：

```shell
pnpm dlx create-vite@latest
```

它执行的是第三方代码，不应把“无需永久安装”理解成“没有安全风险”。应核对包名、发布者和版本，避免执行来源不明或名称相似的包。

从 pnpm 10 开始，依赖包的构建脚本不再默认全部自动执行。只有确实需要并经过审查的依赖，才应通过项目的构建脚本许可配置放行；不要为了消除提示而全局允许所有依赖执行安装脚本。

## Store 命令的准确含义

```shell
# 查看当前 store 路径
pnpm store path

# 检查 store 中的包是否从解包后被修改
pnpm store status

# 删除当前没有项目引用的包
pnpm store prune
```

`pnpm store prune` 是清理未引用内容，不等同于无条件清空下载缓存。它通常不会破坏已有项目，但之后切换到旧分支时，可能需要重新下载刚被清理的版本，因此无需频繁执行。

## 创建 pnpm Workspace

工作区根目录必须包含 `pnpm-workspace.yaml`。一个常见结构是：

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

根目录的 `package.json` 通常设置为私有包，避免误发布：

```json
{
  "name": "my-workspace",
  "private": true
}
```

假设工作区包含 `@repo/web` 和 `@repo/ui`，可以明确要求使用本地工作区包：

```shell
pnpm --filter @repo/web add "@repo/ui@workspace:*"
```

对应依赖会使用 `workspace:` 协议。若本地不存在满足条件的工作区包，安装会失败，而不会悄悄改从公共注册表下载同名包。

## 用 `--filter` 精确选择项目

```shell
# 只运行一个包的 dev 脚本
pnpm --filter @repo/web run dev

# 选择该包及其所有依赖
pnpm --filter "@repo/web..." run build

# 选择 @repo/ui 及所有依赖它的包
pnpm --filter "...@repo/ui" run test

# 选择指定目录中的项目
pnpm --filter "./packages/**" run test
```

过滤器中的 `...`、`*` 等字符可能被 Shell 解释，复杂选择器应加引号。包名相似时优先写完整作用域名称，避免选中错误项目。

需要对全部工作区包执行已有脚本时，可以使用：

```shell
pnpm --recursive --if-present run build
```

递归执行会考虑工作区依赖关系，但循环依赖会破坏可靠的拓扑顺序。发现循环依赖警告时，应先调整包之间的职责和依赖方向。

## 从 npm 项目迁移

pnpm 可以根据其他包管理器的锁文件生成 `pnpm-lock.yaml`：

```shell
pnpm import
pnpm install
```

迁移后应运行类型检查、测试和生产构建，重点检查幽灵依赖、依赖脚本、peer dependency、原生模块和部署环境。确认迁移成功后，仓库中只保留团队实际使用的锁文件，避免不同包管理器产生互相矛盾的安装结果。

## Express

## Express 解决什么问题

Node.js 自带的 `http` 模块已经能够创建服务器。Express 在其上提供路由、中间件、请求解析和响应辅助方法，让应用更容易按功能拆分。

一次请求会按注册顺序经过匹配的中间件和路由处理器：

1. 服务器收到 HTTP 请求。
2. Express 依次执行符合条件的中间件。
3. 某个处理器发送响应，或调用 `next()` 继续向后传递。
4. 如果发生错误，流程进入错误处理中间件。

中间件的顺序会直接影响行为。解析请求体、日志、认证等中间件通常放在业务路由之前，404 和错误处理放在所有业务路由之后。

## 初始化项目

当前 Express 5 的官方安装指南要求使用受支持的 Node.js 版本。创建项目前应先检查本机版本与 Express 当前兼容范围。

```shell
node --version
pnpm init
pnpm add express
```

使用 ECMAScript 模块时，可以在 `package.json` 中配置：

```json
{
  "type": "module",
  "scripts": {
    "dev": "node --watch src/server.js",
    "start": "node src/server.js"
  }
}
```

## 创建最小服务器

```javascript
// src/server.js
import express from "express";

const app = express();
const rawPort = process.env.PORT ?? "3000";
const port = Number(rawPort);

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new RangeError(`PORT 必须是 1 到 65535 之间的整数，当前值为：${rawPort}`);
}

app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

const server = app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`端口 ${port} 已被占用`);
  } else {
    console.error("HTTP server error", error);
  }

  process.exitCode = 1;
});

let shuttingDown = false;

async function closeResources() {
  // 在这里关闭数据库连接、消息队列消费者等外部资源。
}

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}, starting graceful shutdown`);

  const forceExitTimer = setTimeout(() => {
    console.error("Graceful shutdown timed out");
    process.exit(1);
  }, 10_000);
  forceExitTimer.unref();

  server.close(async (error) => {
    try {
      if (error) {
        console.error("Failed to close HTTP server", error);
        process.exitCode = 1;
      }

      await closeResources();
      console.log("HTTP server and external resources closed");
    } catch (closeError) {
      console.error("Failed to close external resources", closeError);
      process.exitCode = 1;
    } finally {
      clearTimeout(forceExitTimer);
    }
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
```

运行开发服务器：

```shell
pnpm run dev
```

`app.listen()` 返回 Node.js 的 HTTP Server。生产环境收到终止信号时，应停止接收新连接并完成必要的清理，而不是直接中断正在处理的请求。

## 路由与请求数据

Express 路由由 HTTP 方法和路径共同决定：

```javascript
app.get("/api/users/:id", (req, res) => {
  const { id } = req.params;
  const includePostsValue = req.query.includePosts;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return res.status(400).json({
      error: "INVALID_USER_ID",
      message: "用户 id 必须是有效的 UUID",
    });
  }

  if (
    includePostsValue !== undefined &&
    includePostsValue !== "true" &&
    includePostsValue !== "false"
  ) {
    return res.status(400).json({
      error: "INVALID_QUERY",
      message: "includePosts 只能是 true 或 false",
    });
  }

  const includePosts = includePostsValue === "true";

  return res.json({
    id,
    includePosts,
  });
});
```

常用数据来源如下：

| 位置 | Express 属性 | 示例 |
|------|--------------|------|
| 路径参数 | `req.params` | `/users/:id` 中的 `id` |
| 查询参数 | `req.query` | `/users?page=2` 中的 `page` |
| JSON 请求体 | `req.body` | POST、PUT、PATCH 提交的数据 |
| 请求头 | `req.get()` 或 `req.headers` | `Authorization`、`Content-Type` |

路径参数、查询参数、请求体和请求头都来自客户端，不能因为类型“看起来正确”就直接信任。需要检查必填项、类型、长度、范围和允许值。

```javascript
import { randomUUID } from "node:crypto";

app.post("/api/users", (req, res) => {
  const { name, email } = req.body ?? {};

  if (
    typeof name !== "string" ||
    name.trim().length === 0 ||
    typeof email !== "string" ||
    !email.includes("@")
  ) {
    return res.status(400).json({
      error: "INVALID_INPUT",
      message: "name 和 email 格式不正确",
    });
  }

  const user = {
    id: randomUUID(),
    name: name.trim(),
    email,
  };

  return res
    .status(201)
    .location(`/api/users/${user.id}`)
    .json(user);
});
```

示例中的检查只用于说明流程。真实项目应使用经过验证的校验方案，并根据业务规则处理邮箱规范化、唯一性和数据库错误。

## 中间件必须结束请求或继续传递

普通中间件接收 `req`、`res`、`next`：

```javascript
app.use((req, res, next) => {
  const startedAt = performance.now();

  res.on("finish", () => {
    const duration = performance.now() - startedAt;
    console.log(req.method, req.originalUrl, res.statusCode, duration);
  });

  next();
});
```

中间件必须选择一种结果：

- 调用 `res.send()`、`res.json()`、`res.end()` 等方法结束响应。
- 调用 `next()` 把控制权交给下一个处理器。
- 调用 `next(error)` 进入错误处理流程。
- 在 Express 5 中，从同步处理器抛出异常，或者从返回给 Express 的 Promise 中抛出异常、返回拒绝，也会进入错误处理流程。

既没有发送响应也没有调用 `next()`，请求会一直处于未完成状态。发送响应后又继续修改响应，则可能出现“响应头已经发送”的错误。

## 使用 Router 拆分模块

`express.Router()` 可以把一组相关路由组织成独立模块：

```javascript
// src/routes/users.js
import { Router } from "express";

export const usersRouter = Router();

usersRouter.get("/", (req, res) => {
  res.json([]);
});

usersRouter.get("/:id", (req, res) => {
  const { id } = req.params;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return res.status(400).json({
      error: "INVALID_USER_ID",
      message: "用户 id 必须是有效的 UUID",
    });
  }

  return res.json({ id });
});
```

```javascript
// src/server.js
import { usersRouter } from "./routes/users.js";

app.use("/api/users", usersRouter);
```

挂载之后，`usersRouter.get("/:id")` 对应的完整地址是 `/api/users/:id`。模块路径中的相对导入要与当前 Node.js ESM 规则一致，通常需要写出 `.js` 扩展名。

## 404 与错误处理

404 表示没有路由匹配，它不是自动抛出的运行时错误。注册顺序应当是“业务路由 → 404 中间件 → 错误处理中间件”。错误处理中间件必须保留四个参数，并放在最后：

```javascript
class HttpError extends Error {
  constructor(status, message, code = "REQUEST_FAILED") {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
}

app.get("/api/reports/:id", async (req, res) => {
  const { id } = req.params;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new HttpError(400, "报表 id 必须是有效的 UUID", "INVALID_REPORT_ID");
  }

  const report = await findReport(id);

  if (!report) {
    throw new HttpError(404, "报表不存在", "REPORT_NOT_FOUND");
  }

  return res.json(report);
});

app.use((req, res) => {
  return res.status(404).json({
    error: "NOT_FOUND",
    message: "请求的资源不存在",
  });
});

function isRecord(value) {
  return typeof value === "object" && value !== null;
}

function readErrorStatus(error) {
  if (!isRecord(error)) return 500;

  const candidate = [error.status, error.statusCode].find(
    (value) => Number.isInteger(value) && value >= 400 && value < 600,
  );
  return candidate ?? 500;
}

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const status = readErrorStatus(error);
  const code =
    error instanceof HttpError
      ? error.code
      : status === 400
        ? "INVALID_REQUEST"
        : status === 413
          ? "PAYLOAD_TOO_LARGE"
          : status >= 400 && status < 500
            ? "REQUEST_REJECTED"
            : "INTERNAL_ERROR";
  const message =
    error instanceof HttpError
      ? error.message
      : status === 400
        ? "请求体或参数格式不正确"
        : status === 413
          ? "请求体过大"
          : status >= 400 && status < 500
            ? "请求无法处理"
            : "服务器内部错误";

  console.error(error);

  return res.status(status).json({
    error: code,
    message,
  });
});
```

`express.json()` 使用的请求体解析器会为无效 JSON、请求体过大等错误提供 `status` 或 `statusCode`。上面的处理器只接受 `400`—`599` 范围内的整数，并为常见的 `400`、`413` 返回安全文案，不把解析器、数据库或内部路径等错误详情直接暴露给客户端。

在 Express 5 中，返回 Promise 的路由或中间件发生拒绝、或者 `async` 函数抛出异常时，会自动进入错误处理流程。没有返回给 Express 的后台 Promise 仍需自行处理。

`findReport()` 在示例中代表数据访问函数，需要由项目实际实现。

## 正确使用 HTTP 状态码

常见 API 状态码可以这样理解：

| 状态码 | 含义 |
|--------|------|
| `200 OK` | 请求成功并返回内容 |
| `201 Created` | 成功创建资源 |
| `204 No Content` | 请求成功但不返回响应体 |
| `400 Bad Request` | 请求格式或参数不符合要求 |
| `401 Unauthorized` | 缺少有效认证信息 |
| `403 Forbidden` | 已识别身份但无权执行操作 |
| `404 Not Found` | 资源或路由不存在 |
| `409 Conflict` | 当前资源状态与请求冲突 |
| `500 Internal Server Error` | 未预期的服务端错误 |

HTTP 状态码表达协议层结果，响应体中的业务 `code` 可以提供更细的项目错误分类，但不应把所有失败都伪装成 HTTP 200。

## CORS 不是身份认证

CORS 是浏览器对跨源前端脚本读取响应的限制。它不会阻止其他服务器、命令行工具或攻击者直接向公开接口发送请求，因此不能代替认证和授权。

确实需要跨源访问时，应只允许可信来源，并明确处理方法、请求头和凭据。带 Cookie 的跨源请求不能把允许来源简单设置为 `*`。同源部署或通过反向代理统一域名时，通常不需要额外开放 CORS。

## 上线前的安全与运行检查

- 使用受维护的 Node.js 与 Express 版本，并持续检查依赖漏洞。
- 在反向代理或负载均衡器上启用 TLS，生产接口使用 HTTPS。
- 校验所有用户输入，限制 JSON、表单和文件上传体积。
- 使用 Helmet 等中间件设置合适的安全响应头，但仍要理解每项策略。
- 对登录、验证码、密码重置等敏感接口设置合理的速率限制。
- 密码、数据库连接串和私钥通过安全的环境配置注入，不写入源码或日志。
- 生产响应不返回堆栈、数据库错误和内部路径。
- 只有在明确代理拓扑后才配置 `trust proxy`，否则客户端地址和安全协议判断可能被伪造。
- 日志应包含请求标识、状态码和耗时，同时避免记录密码、令牌等敏感字段。

Express 提供的是 Web 应用基础能力，不会自动完成数据校验、认证、授权、限流、数据库事务、监控和安全配置。这些仍需要应用根据实际威胁模型明确实现。

## 用 curl 验证接口

```shell
curl http://localhost:3000/health

curl \
  --request POST \
  --header "Content-Type: application/json" \
  --data '{"name":"Ada","email":"ada@example.com"}' \
  http://localhost:3000/api/users
```

至少应验证成功、参数错误、资源不存在和服务器错误四类路径。正式项目还应使用自动化测试，并在启动监听端口与创建 Express 应用之间做好分离，便于测试直接调用应用实例。
