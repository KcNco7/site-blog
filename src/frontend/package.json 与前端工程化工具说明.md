# package.json 与前端工程化工具说明

这篇文章以原资料中的 Vue + TypeScript 示例项目为背景，说明下面几件事：

1. `package.json` 里的关键字段和脚本是做什么的
2. `scripts` 如何组织开发、构建、检查和格式化命令
3. 不同依赖字段应该如何区分

该示例项目并不是当前知识库仓库。ESLint、Prettier、Oxlint、`vue-tsc` 的分工以及新项目的接入流程，将在后续章节中介绍。

## 1. 先看原资料示例项目的配置结构

原资料中的示例项目包含以下与代码质量、格式化直接相关的文件：

- `package.json`：定义项目元信息、依赖、脚本命令
- `eslint.config.ts`：ESLint 规则配置
- `.oxlintrc.json`：Oxlint 规则配置
- `prettier.config.mjs`：Prettier 格式化配置
- `.prettierignore`：Prettier 忽略哪些文件
- `.editorconfig`：编辑器基础格式约束
- `tsconfig.json`、`tsconfig.app.json`、`tsconfig.node.json`：TypeScript 编译和类型检查配置

你可以把它们理解成一条流水线：

1. 编辑器根据 `.editorconfig` 提供最基础的缩进、换行、编码规则
2. Prettier 负责把代码排版成统一风格
3. Oxlint 先快速扫描一批常见问题
4. ESLint 再做更细的 Vue、TypeScript、项目规则检查
5. `vue-tsc` 最后做 TypeScript 类型层面的校验

## 2. package.json 里每个关键字段的作用

原资料示例项目的 `package.json` 可以分成几部分看。

### 2.1 项目基础信息

- `name`
  项目名称。发包时会用到；在这个私有示例项目中，它主要用于标识项目。

- `version`
  版本号。示例项目使用 `0.0.0`；这是一个合法的 SemVer 版本，但不能单凭该值判断项目是否准备发布。还应结合 `private` 字段和实际发布流程判断。

- `private`
  示例项目设置了 `true`，用于阻止 npm 发布该包，避免私有应用被误发。当前知识库仓库没有这个字段，不能把示例项目的设置视为知识库的真实配置。

- `type`
  示例项目设置为 `module`，因此在最近的 `package.json` 包边界内，Node.js 会把 `.js` 文件按 ES Module 解释；`.mjs` 文件无论是否设置该字段，始终按 ES Module 解释。示例中的 `prettier.config.mjs` 不应简单归因于 `type` 字段。

- `engines`
  约束 Node 版本。原资料示例项目要求 `^20.19.0 || >=22.12.0`，主要是为了避免团队成员使用过旧的 Node 导致工具链行为不一致；当前知识库仓库没有声明 `engines`。

### 2.2 scripts 的作用

`scripts` 是整个工程化流程的入口。平时你运行的 `pnpm lint`、`pnpm format` 本质上都是这里定义的命令别名。

原资料示例项目当时的脚本快照如下：

```json
{
  "dev": "vite --open",
  "build": "run-p type-check \"build-only {@}\" --",
  "build:test": "vue-tsc && vite build --mode test",
  "build:pro": "vue-tsc && vite build --mode production",
  "preview": "vite preview",
  "build-only": "vite build",
  "type-check": "vue-tsc --build",
  "lint": "oxlint . && eslint . --cache && vue-tsc --build",
  "lint:fix": "oxlint . --fix && eslint . --fix --cache",
  "lint:oxlint": "oxlint .",
  "lint:oxlint:fix": "oxlint . --fix",
  "lint:eslint": "eslint . --cache",
  "lint:eslint:fix": "eslint . --fix --cache",
  "format": "prettier --write . --ignore-unknown",
  "format:check": "prettier --check . --ignore-unknown"
}
```

这些脚本可以按用途分组理解。

#### 开发和构建相关

- `dev`
  启动 Vite 开发服务器，并自动打开浏览器。

- `build-only`
  只做 Vite 构建，不做额外类型校验。

- `build`
  通过 `run-p` 并行执行 `type-check` 和 `build-only`。也就是一边做类型检查，一边打包构建。

- `build:test`
  先运行 `vue-tsc`，再按 `test` 模式打包。

- `build:pro`
  先运行 `vue-tsc`，再按 `production` 模式打包。

- `preview`
  预览构建产物。

#### 类型检查相关

- `type-check`
  执行 `vue-tsc --build`。它会按 TypeScript/Vue 的配置检查类型是否正确，但不负责代码风格。

#### lint 相关

- `lint`
  该示例项目的综合质量检查命令，执行顺序是：
  `oxlint .` -> `eslint . --cache` -> `vue-tsc --build`

- `lint:fix`
  让 `oxlint` 和 `eslint` 尝试自动修复一部分问题。
  注意它没有把 `vue-tsc` 放进去，因为类型错误通常不能靠“自动修复”安全解决。

- `lint:oxlint`
  只跑 Oxlint。

- `lint:oxlint:fix`
  只跑 Oxlint 的自动修复。

- `lint:eslint`
  只跑 ESLint，并开启缓存。

- `lint:eslint:fix`
  只跑 ESLint 自动修复，并开启缓存。

#### 格式化相关

- `format`
  用 Prettier 重写全部可识别文件的格式。

- `format:check`
  检查格式是否符合 Prettier 规则，但不改文件。这个命令很适合放到 CI。

### 2.3 dependencies 和 devDependencies 的区别

- `dependencies`
  包或应用正常工作时直接需要，并且需要随交付物一起提供或在运行环境中可用的依赖；具体安装方式取决于项目的交付模式。

- `devDependencies`
  用于开发、测试、文档、构建和检查，但不需要交付给包的使用者或生产运行环境的工具。静态应用是否在生产环境安装这些依赖，还要结合构建与部署方式判断。

原资料示例项目中和本文最相关的开发依赖有：

- `eslint`：主 lint 工具
- `eslint-plugin-vue`：让 ESLint 理解 Vue 单文件组件
- `@vue/eslint-config-typescript`：Vue + TS 的官方 ESLint 规则组合
- `eslint-config-prettier`：关闭和 Prettier 冲突的 ESLint 格式规则
- `oxlint`：高性能 lint 工具
- `eslint-plugin-oxlint`：关闭已由 Oxlint 覆盖的 ESLint 规则，减少重复诊断
- `prettier`：代码格式化工具
- `typescript`：TypeScript 编译器
- `vue-tsc`：Vue 项目的类型检查工具

## 阅读配置说明前先核对真实仓库

文中的脚本清单描述的是原资料对应的 Vue + TypeScript 工程。把这类说明用于另一个仓库前，应先打开目标仓库自己的 `package.json` 和配置文件，确认字段、依赖和脚本确实存在。

先查看目标仓库的 `packageManager` 字段和锁文件，确认实际使用的包管理器。npm 项目可以检查：

```shell
node --version
node -p "require('./package.json').packageManager"
npm --version
npm pkg get name version private type packageManager engines scripts
```

如果仓库使用 `pnpm-lock.yaml` 或明确声明 pnpm，再使用：

```shell
pnpm --version
pnpm pkg get name version private type packageManager engines scripts
```

文档前半部分描述的是原资料中的示例项目，不能自动代表任何复制、拆分或迁移后的知识库仓库。

## `package.json` 是严格 JSON

`package.json` 使用 JSON 格式，不能直接写 JavaScript 注释、尾随逗号、函数或 `undefined`。字段可以被不同工具读取，但每个工具只解释自己认识的部分。

```json
{
  "name": "example-app",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@11.3.0",
  "engines": {
    "node": ">=22"
  }
}
```

这个版本号只用于展示字段格式。实际项目应填写团队验证过的精确包管理器版本和符合工具链要求的 Node.js 范围。

## 几个容易混淆的字段

| 字段 | 准确作用 |
|------|----------|
| `version` | 描述当前包版本；是否发布不能只由版本号判断 |
| `private` | 设为 `true` 时阻止包管理器发布该包，适合应用和工作区根项目 |
| `type` | 告诉 Node.js 如何解释最近包边界内的 `.js` 文件 |
| `engines` | 声明期望的 Node.js、包管理器等版本范围 |
| `packageManager` | 记录项目期望使用的包管理器及精确版本 |
| `main` | 没有 `exports` 时，Node.js 包的传统主入口 |
| `exports` | 声明包对外开放的入口，并封装未公开的内部路径 |
| `types` | 发布 TypeScript 类型声明时指定声明入口 |

`engines` 是否仅产生警告或直接阻止安装，取决于使用的包管理器和严格模式配置。因此它既不能替代 CI 版本检查，也不能保证每个人自动切换到正确 Node.js 版本。

## `type` 只控制模块解释方式

在最近的父级 `package.json` 中设置 `"type": "module"` 后，Node.js 会把该包边界内的 `.js` 文件按 ES Module 解释。`.mjs` 始终按 ES Module 处理，`.cjs` 始终按 CommonJS 处理。

`type` 字段不会完成这些工作：

- 不会把 TypeScript 自动编译成 JavaScript。
- 不会改变浏览器中普通 `<script>` 的类型。
- 不会自动给相对 ESM 导入补文件扩展名。
- 不会保证所有第三方工具都采用同一种模块加载规则。

配置文件使用 `.mjs` 可以显式表明它是 ES Module，即使上层没有 `"type": "module"` 也成立；因此不能简单把 `.mjs` 的使用归因于该字段。

## SemVer 范围与锁定结果

语义化版本通常写成 `主版本.次版本.修订版本`：

- 修订版本用于兼容的错误修复。
- 次版本用于向后兼容的新功能。
- 主版本用于可能不兼容的变化。

常见依赖范围：

| 写法 | 含义 |
|------|------|
| `1.2.3` | 只接受这个精确版本 |
| `~1.2.3` | 通常允许同一主、次版本下的修订更新 |
| `^1.2.3` | 通常允许不改变最左侧非零版本号的兼容更新 |
| `>=1.2.3 <2` | 使用显式比较范围 |

范围表达“重新解析时允许选择什么”，锁文件记录“本次安装最终选中了什么”。发布者是否真正遵守 SemVer 仍需要项目通过测试验证。

### `workspace:` 协议不是 SemVer 范围

`workspace:*` 不是 SemVer 运算符，而是 pnpm、Yarn 等包管理器支持的工作区协议。它要求依赖从当前工作区解析，具体写回和发布行为取决于包管理器及其配置；只有采用支持该协议的工作区时才能使用。

## 依赖分类取决于交付方式

| 字段 | 适合放置 |
|------|----------|
| `dependencies` | 包或应用正常工作所直接需要的依赖 |
| `devDependencies` | 开发、测试、检查、文档和构建工具 |
| `peerDependencies` | 要求使用方提供并共享的宿主依赖，常见于插件和组件库 |
| `optionalDependencies` | 安装失败时允许继续、代码能够降级处理的可选能力 |

对于静态前端应用，生产服务器可能只部署构建产物，不安装任何 Node 依赖，但源码构建仍需要 `vue` 等正常依赖。对于发布到注册表的库，错误地把运行依赖放入 `devDependencies`，会导致使用者安装后缺包；把应共享的框架放入普通依赖，又可能造成重复实例。

依赖分类应根据“谁消费这个包、在什么阶段安装、最终交付什么”来判断，而不是只看本机开发时是否使用。

## 清单文件与锁文件各自负责什么

- `package.json` 描述项目直接依赖及允许范围，是开发者维护的意图。
- `pnpm-lock.yaml`、`package-lock.json` 等锁文件记录解析后的完整依赖图和完整性信息。
- `node_modules` 是安装结果，可以重新生成，通常不提交到应用仓库。

同一项目应统一包管理器并提交对应锁文件。CI 使用冻结锁文件安装，可以在清单与锁文件不一致时尽早失败，避免开发机与流水线解析出不同依赖。

## scripts 的执行环境

包管理器运行脚本时，会把项目依赖提供的可执行文件加入临时 `PATH`，所以脚本中可以直接写 `vite`、`eslint`、`vue-tsc`，不必写 `node_modules/.bin/...`。

```json
{
  "scripts": {
    "type-check": "vue-tsc --build",
    "lint": "oxlint . && eslint . --cache",
    "check": "pnpm run type-check && pnpm run lint",
    "test": "vitest run"
  }
}
```

脚本设计应注意：

- `&&` 表示前一条成功后才执行下一条，适合有依赖关系的串行检查。
- 并行工具能缩短时间，但不能假定彼此有先后顺序；多个任务同时写同一目录可能互相干扰。
- `run-p` 不是 Node.js 内置命令，只有项目安装了提供它的依赖后才能使用。
- 脚本应以非零退出码表示失败，CI 才能正确阻止后续步骤。
- Shell 语法在 Windows、Linux、macOS 之间存在差异，复杂逻辑更适合写成跨平台 Node.js 脚本。
- `pre<script>`、`post<script>` 等生命周期脚本可能被隐式执行，新增依赖或发布包时要考虑脚本安全。

格式化并行构建不是越多越好。类型检查和打包可以并行，是因为它们通常只读源码并写入不同位置；若两者共享增量缓存或输出目录，则应先确认工具支持并发。

## 应用项目与发布库关注的字段不同

私有前端应用主要关注脚本、依赖、Node.js 版本、包管理器版本和构建配置。准备发布的库还需要认真设计：

- `name`、`version`、`license`、`files`
- `exports`、`main`、`types`
- ESM 与 CommonJS 的兼容策略
- `peerDependencies`
- 发布产物是否包含源码映射、类型声明和必要资源

不要把一个应用项目的 `package.json` 原样复制成库配置，也不要仅为了“字段齐全”添加没有实际消费者的入口。

## 3. ESLint、Prettier、Oxlint、vue-tsc 各自负责什么

这几个工具解决的不是同一类问题。

| 工具     | 核心职责           | 适合处理什么                                    |
| -------- | ------------------ | ----------------------------------------------- |
| ESLint   | 代码质量和规则约束 | 未使用变量、Vue 组件结构、命名方式、潜在错误    |
| Oxlint   | 更快的通用静态检查 | 常见错误、可疑写法、基础最佳实践                |
| Prettier | 代码格式化         | 分号、引号、缩进、换行、尾随逗号                |
| vue-tsc  | 类型检查           | 类型不匹配、接口错误、组件 props/返回值类型问题 |

### 3.1 ESLint 是什么

ESLint 是最灵活的 lint 工具。它的特点是：

- 支持 JavaScript、TypeScript、Vue
- 可以接很多插件
- 可以做项目定制规则
- 可以设置 `off`、`warn`、`error` 三种严重级别

原资料示例项目的 ESLint 配置文件是 `eslint.config.ts`，使用的是 Flat Config 写法。

该示例项目里，ESLint 主要做了这些事：

1. 指定要检查哪些文件
2. 忽略构建产物目录
3. 启用 Vue 官方基础规则
4. 启用 Vue + TypeScript 推荐规则
5. 增加项目自己的自定义规则
6. 关闭和 Prettier 冲突的格式化类规则

`.oxlintrc.json` 由 Oxlint 读取。ESLint 只读取自己的 Flat Config，以及该配置显式导入的插件和共享配置。

该示例项目里比较典型的 ESLint 规则有：

- `@typescript-eslint/no-unused-vars`
- `vue/block-order`
- `vue/component-name-in-template-casing`
- `vue/no-empty-component-block`

这些规则比较适合放在 ESLint，因为它们更偏“代码质量”和“框架约束”。

### 3.2 Oxlint 是什么

Oxlint 是 OXC 工具链里的 lint 工具，特点是快。它适合做第一层高速扫描。

原资料示例项目的 Oxlint 配置文件是 `.oxlintrc.json`。它主要配置了：

- `plugins`
  决定启用哪些规则来源，比如 `eslint`、`typescript`、`vue`

- `ignorePatterns`
  决定哪些目录不扫描

- `categories`
  可以对一类问题统一设置级别，比如把 `correctness` 统一设成 `error`

- `rules`
  配置具体规则，比如 `eqeqeq`、`no-console`、`no-debugger`

- `options`
  配置一些全局行为，比如未使用的 `eslint-disable` 注释是否报错

该示例项目更适合交给 Oxlint 的规则有：

- `eqeqeq`
- `no-console`
- `no-debugger`
- `prefer-const`

这类规则通常通用、简单、适合高性能扫描。

Oxlint 对 `.vue`、`.svelte`、`.astro` 文件的支持只覆盖 `<script>` 代码块，不负责检查 Vue 模板。模板规则仍需要 `eslint-plugin-vue` 等兼容工具。

### 3.3 Prettier 是什么

Prettier 不负责判断业务逻辑对不对，它只负责一件事：统一代码排版。

原资料示例项目的 Prettier 配置文件是 `prettier.config.mjs`，主要选项有：

- `semi: false`
  不加分号

- `singleQuote: true`
  优先使用单引号

- `printWidth: 100`
  表示 Prettier 期望采用的大致换行宽度，不是严格的单行长度上限；格式化结果可能短于或长于这个值

- `bracketSpacing: true`
  对象字面量花括号内保留空格

- `htmlWhitespaceSensitivity: 'ignore'`
  把标签周围的空白视为不重要；当内容语义或布局依赖这些空白时，这个设置可能不合适

- `endOfLine: 'lf'`
  统一用 LF 换行

- `trailingComma: 'all'`
  多行时尽可能保留尾随逗号

- `tabWidth: 2`
  一个缩进层级按 2 个空格处理

`.prettierignore` 用来声明哪些文件不做格式化，比如构建产物、缓存文件、锁文件等。

### 3.4 vue-tsc 是什么

`vue-tsc` 是给 Vue 单文件组件做类型检查的工具。它在很多 Vue + TypeScript 项目里都非常重要，因为普通的 ESLint 不能完整替代类型系统。

它更擅长发现这类问题：

- 传参类型不对
- 返回值类型不对
- 组件 props 类型不匹配
- 接口字段缺失
- `ref`、`computed`、函数返回值类型错误

所以在该示例项目里，`lint` 脚本不是只跑 ESLint，而是把 `vue-tsc` 也接进来了。

## 4. 它们是怎么工作的

### 4.1 示例项目的执行顺序

日常检查时，该示例项目推荐执行：

```bash
pnpm lint
pnpm format
```

其中 `pnpm lint` 的真实顺序是：

1. `oxlint .`
2. `eslint . --cache`
3. `vue-tsc --build`

你可以这样理解这个顺序：

1. 先用 Oxlint 做高速扫描，把一批通用问题尽快拦下来
2. 再用 ESLint 做更细的 Vue/TS/项目规则检查
3. 最后用 `vue-tsc` 做类型系统层面的严格校验

然后再执行：

```bash
pnpm format
```

让 Prettier 统一格式。

### 4.2 为什么 Prettier 不直接塞进 lint

因为 Prettier 和 ESLint 解决的问题不同。

- ESLint 关心“代码写得合不合理”
- Prettier 关心“代码排版是否统一”

如果把格式化和质量检查混成一件事，定位问题会更乱。该示例项目把它们拆开，是更清晰的做法：

- `lint` 负责质量和类型
- `format` 负责排版

### 4.3 ESLint 和 Prettier 如何减少冲突

原因在 `eslint.config.ts` 最后接入了：

```ts
import skipFormatting from 'eslint-config-prettier/flat'
```

它会关闭已知会和 Prettier 冲突的 ESLint 格式规则，让两者的职责更清楚：

- 格式问题交给 Prettier
- 非格式问题交给 ESLint

这不能保证所有配置永远没有冲突。项目自定义规则或其他插件新增的格式规则仍需核对；`eslint-config-prettier` 也不会替代 Prettier 执行格式化。

这一步很关键。如果没有它，常见情况是：

- ESLint 要求一种格式
- Prettier 又改成另一种格式
- 两边反复打架

### 4.4 为什么项目里同时有 Oxlint 和 ESLint

因为它们不是完全替代关系。

- Oxlint 更快，适合做第一层通用扫描
- ESLint 更灵活，生态更完整，适合做深度规则和框架规则

该示例项目的设计思路是：

1. 用 Oxlint 先拦一批高性价比问题
2. 再用 ESLint 补上 Vue、TypeScript 和项目级规则

这是一种很实用的组合，不是为了“堆工具”，而是为了兼顾速度和可定制性。

同时运行 Oxlint 与 ESLint 时，可以安装 `eslint-plugin-oxlint`，并按照所用版本的说明在 Flat Config 中接入其推荐配置，关闭已由 Oxlint 覆盖的 ESLint 规则，减少重复诊断。它用于处理规则重叠，不会让 ESLint 读取 `.oxlintrc.json`。

## 5. 这些配置文件分别由谁读取

这件事最好单独搞清楚，不然很容易写了配置却不知道谁在生效。

| 文件                  | 主要被谁读取               | 作用                               |
| --------------------- | -------------------------- | ---------------------------------- |
| `package.json`        | pnpm / npm / Node / 工具链 | 依赖声明、脚本入口、项目元信息     |
| `eslint.config.ts`    | ESLint                     | 规则、文件范围、忽略目录、插件组合 |
| `.oxlintrc.json`      | Oxlint                     | Oxlint 的规则、分类、忽略目录      |
| `prettier.config.mjs` | Prettier                   | 格式化选项                         |
| `.prettierignore`     | Prettier                   | 忽略格式化的文件                   |
| `.editorconfig`       | 编辑器、部分格式化工具     | 缩进、换行、编码、行尾空格         |
| `tsconfig*.json`      | TypeScript、vue-tsc        | 编译和类型检查配置                 |

## 6. 新建一个项目时，应该如何使用这套工具

下面给你一套比较务实的接入顺序，适合新建 Vue + TypeScript 项目。

### 第一步：先有基础项目

你至少要先有这些基础能力：

- 包管理器，比如 `pnpm`
- 构建工具，比如 `Vite`
- 框架，比如 `Vue`
- TypeScript

如果是 Vue 项目，通常可以先通过 Vite 初始化一个 Vue + TS 项目。

### 第二步：安装工具

最小可用的一组开发依赖通常是：

```bash
pnpm add -D eslint prettier oxlint typescript vue-tsc eslint-config-prettier eslint-plugin-oxlint
```

如果是 Vue + TypeScript 项目，还要再补上：

```bash
pnpm add -D eslint-plugin-vue @vue/eslint-config-typescript
```

### 第三步：创建配置文件

至少建议准备这些文件：

1. `eslint.config.mjs`
2. `.oxlintrc.json`
3. `prettier.config.mjs`
4. `.prettierignore`
5. `.editorconfig`
6. `tsconfig.json`

一个最小化示例可以是下面这样。

#### `eslint.config.mjs`

```js
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import oxlint from 'eslint-plugin-oxlint'
import skipFormatting from 'eslint-config-prettier/flat'

export default defineConfigWithVueTs(
  {
    ignores: ['dist/**', 'coverage/**'],
  },
  {
    files: ['**/*.{vue,ts,tsx,js,jsx}'],
  },
  ...pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  {
    rules: {
      'vue/no-empty-component-block': 'error',
    },
  },
  ...oxlint.configs['flat/recommended'],
  skipFormatting,
)
```

`eslint-plugin-oxlint` 的推荐配置应放在其他规则配置之后，用来关闭已由 Oxlint 覆盖的 ESLint 规则；这里再让 `eslint-config-prettier` 最后关闭格式冲突规则。

#### `.oxlintrc.json`

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["eslint", "typescript", "unicorn", "oxc", "vue"],
  "ignorePatterns": ["dist", "node_modules"],
  "rules": {
    "eqeqeq": "error",
    "no-debugger": "error",
    "prefer-const": "error"
  }
}
```

设置 `plugins` 会覆盖 Oxlint 的默认插件集合，因此示例在启用 `vue` 的同时显式保留默认的 `eslint`、`typescript`、`unicorn` 和 `oxc`。

#### `prettier.config.mjs`

```js
export default {
  semi: false,
  singleQuote: true,
  printWidth: 100,
  trailingComma: 'all',
  tabWidth: 2,
  endOfLine: 'lf',
}
```

#### `.prettierignore`

```text
dist/
coverage/
node_modules/
```

#### `.editorconfig`

```ini
root = true

[*]
charset = utf-8
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true
end_of_line = lf
```

Prettier 会读取它支持的部分 EditorConfig 选项；如果 Prettier 配置文件显式设置了同一项，则以 Prettier 配置为准。两处的缩进和换行设置应保持一致，避免编辑器与命令行结果不同。

### 第四步：在 package.json 里定义脚本

推荐先有这几个：

```json
{
  "scripts": {
    "lint": "oxlint . && eslint . && vue-tsc --noEmit",
    "lint:fix": "oxlint . --fix && eslint . --fix",
    "format": "prettier --write . --ignore-unknown",
    "format:check": "prettier --check . --ignore-unknown"
  }
}
```

如果项目规模还小，这套已经够用了。

### 第五步：给编辑器接上自动格式化

推荐做法是：

1. 安装 EditorConfig、ESLint、Prettier 对应的编辑器插件
2. 保存时自动执行 Prettier
3. 平时开发用 `lint:fix` 修一轮
4. 提交前或 CI 里跑 `lint` 和 `format:check`

### 第六步：理解“规则应该写到哪里”

这是新项目里最容易混乱的地方。你可以按下面判断：

- 想统一代码排版
  改 `Prettier`

- 想约束代码质量或 Vue 写法
  改 `ESLint`

- 想先加一层高速通用扫描
  改 `Oxlint`

- 想统一缩进、换行、编码
  改 `.editorconfig`

- 想检查类型
  改 `tsconfig` 或通过 `vue-tsc` 执行

## 7. 一套推荐的日常使用方式

如果你在一个新项目里接入了这套工具，推荐这样使用：

### 本地开发时

```bash
pnpm lint:fix
pnpm format
```

这两个命令适合在你改完一批代码后跑一次。

### 提交前检查时

```bash
pnpm lint
pnpm format:check
```

这适合在提交前或者 CI 里执行。

### 遇到问题时怎么定位

- `format` 报错
  `format` 使用 `--write`，普通格式差异会被直接改写；如果命令失败，应检查语法解析、配置文件或文件访问问题

- `format:check` 报错
  它只报告不符合 Prettier 格式的文件，不会修改文件

- `eslint` 报错
  看是不是规则约束、Vue 结构、未使用变量

- `oxlint` 报错
  看是不是一些通用的语法或最佳实践问题

- `vue-tsc` 报错
  看是不是类型定义、函数参数、接口结构不匹配

## 8. 示例工具链的协同方式总结

本文示例工具链本质上是在做职责拆分：

- `package.json`
  负责把所有工具通过脚本串起来

- `Oxlint`
  负责第一层高性能扫描

- `ESLint`
  负责 Vue、TypeScript 和项目规则

- `Prettier`
  负责统一格式

- `vue-tsc`
  负责类型正确性

- `.editorconfig`
  负责编辑器层面的基础风格约束

如果只记一句话，可以记这个版本：

`package.json` 负责调度，`Oxlint` 先快扫，`ESLint` 做深查，`Prettier` 统一排版，`vue-tsc` 兜底类型安全。
