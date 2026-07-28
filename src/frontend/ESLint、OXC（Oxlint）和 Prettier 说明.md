# ESLint、OXC（Oxlint）和 Prettier 说明

这份文档基于当前项目的实际配置来解释三件事：

1. 它们分别是干什么的
2. 它们的规则一般写在哪里
3. 当前仓库是怎么把它们串起来的

## 先说结论

这三个工具解决的不是同一类问题：

| 工具         | 主要职责       | 处理内容                                            |
| ------------ | -------------- | --------------------------------------------------- |
| ESLint       | 可配置的静态分析 | JavaScript 规则，以及通过插件扩展的 TypeScript、Vue 等规则 |
| OXC / Oxlint | 高性能静态分析   | 常见错误、可疑写法、最佳实践及已启用插件提供的规则        |
| Prettier     | 代码格式化       | 分号、引号、换行、缩进、尾随逗号等                        |

可以把它们理解成：

- `ESLint` 按已启用规则进行静态分析，并可通过插件检查框架代码
- `Oxlint` 适合执行高性能静态扫描，也可以与 ESLint 互补或逐步替代其中一部分规则
- `Prettier` 负责统一排版，不判断业务逻辑和类型是否正确

静态分析只能报告规则能够识别的问题，不能证明代码一定正确；ESLint 和 Oxlint 也不能代替 `tsc` 或 `vue-tsc` 的完整类型检查。

## 当前项目的执行方式

下面是一组可放在项目 `package.json` 中的示例脚本：

```json
{
  "lint": "oxlint . && eslint . --cache && vue-tsc --build",
  "lint:fix": "oxlint . --fix && eslint . --fix --cache",
  "lint:oxlint": "oxlint .",
  "lint:eslint": "eslint . --cache",
  "format": "prettier --write . --ignore-unknown",
  "format:check": "prettier --check . --ignore-unknown"
}
```

运行这些脚本前，需要在项目中安装相应开发依赖，并准备 ESLint、Oxlint、Prettier 和 TypeScript/Vue 的配置文件。命令使用 `&&` 串联，会从左到右执行；任一命令返回非零退出码后，后续命令不会继续运行。

这些脚本的意思是：

1. 先跑 `oxlint`
2. 再跑 `eslint`
3. 最后跑 `vue-tsc` 做类型检查
4. `prettier` 单独负责格式化，不混在 `lint` 里

`lint:fix` 只运行两个 linter 的自动修复，不执行 `vue-tsc`。`--fix` 也只能处理规则提供了修复器的问题，不能保证消除全部诊断；不同工具存在重叠修复时，还需要检查最终结果。

`vue-tsc --build` 需要项目提供适合构建模式的 TypeScript 配置。把 Prettier 放在独立脚本中是当前项目的工作流选择，而不是工具强制要求。类似组合常见于 Vue + TypeScript 项目，但具体命令、顺序和规则覆盖范围应按项目调整。

## 1. ESLint 有什么用

`ESLint` 是具有成熟插件和共享配置生态的静态分析工具。它的核心能力是：

- 使用内置规则检查 JavaScript
- 通过解析器、插件和共享配置支持 TypeScript、Vue 等代码
- 可以自定义规则级别：`off` / `warn` / `error`
- 可以针对不同文件类型使用不同规则

在 Vue 项目里，ESLint 可以承担框架规则和项目自定义规则；也可以与 Oxlint 组合使用。需要类型信息的 typescript-eslint 规则还要启用对应的 type-checked 配置和 TypeScript 项目服务，这类规则通常比只分析语法的规则更慢。

### 当前项目的 ESLint 配置文件

当前仓库使用的是 Flat Config，新配置文件在：

- `eslint.config.ts`

ESLint 9 起默认使用 Flat Config，旧式 `.eslintrc.*` 已被弃用。Flat Config 支持 `eslint.config.js`、`.mjs`、`.cjs`、`.ts`、`.mts` 和 `.cts` 等文件名，其中 TypeScript 配置文件可能需要额外运行环境支持。

Flat Config 最终形成一个配置数组。ESLint 会根据 `files`、`ignores` 等条件选出适用于当前文件的配置对象，再按顺序合并；并不是数组中的每个对象都会无条件作用于所有文件。

### 当前项目 ESLint 配置做了什么

当前 `eslint.config.ts` 主要做了几件事：

1. 指定要检查的文件类型
2. 忽略 `dist`、`coverage` 等目录
3. 启用 Vue 官方推荐规则
4. 启用 Vue + TypeScript 推荐规则
5. 接入 `eslint-plugin-oxlint`，关闭已经交给 Oxlint 的重叠 ESLint 规则
6. 写了当前项目自己的自定义规则
7. 最后接入 `eslint-config-prettier`，关闭和 Prettier 冲突的格式类规则

核心结构大致是这样：

```typescript
import { globalIgnores } from "eslint/config";
import pluginVue from "eslint-plugin-vue";
import {
  defineConfigWithVueTs,
  vueTsConfigs,
} from "@vue/eslint-config-typescript";
import pluginOxlint from "eslint-plugin-oxlint";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default defineConfigWithVueTs(
  {
    files: ["**/*.{vue,js,mjs,cjs,ts,mts,cts,tsx}"],
  },
  globalIgnores(["**/dist/**", "**/dist-ssr/**", "**/coverage/**"]),
  ...pluginVue.configs["flat/essential"],
  vueTsConfigs.recommended,
  ...pluginOxlint.configs["flat/recommended"],
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "vue/block-order": "error",
    },
  },
  eslintConfigPrettier,
);
```

`.oxlintrc.json` 由 Oxlint 自己读取。`eslint-plugin-oxlint` 不会把这个文件转换成 ESLint 配置；它提供的兼容配置用于关闭已经由 Oxlint 覆盖的 ESLint 规则，因此应放在需要被它覆盖的共享规则配置之后。本例又在其后显式启用 `@typescript-eslint/no-unused-vars`，表示项目有意让 ESLint 继续报告这一项重叠规则。`eslint-config-prettier` 同样只关闭可能与 Prettier 冲突的规则，不会执行格式化。

### ESLint 规则怎么设置

ESLint 的规则一般写在 `rules` 字段里：

```typescript
const basicRulesConfig = {
  rules: {
    "no-console": "warn",
    "no-debugger": "error",
    "@typescript-eslint/no-unused-vars": "warn",
  },
};
```

规则值常见有三种写法：

```typescript
const severityExamples = {
  rules: {
    "no-console": "off",
    "no-alert": "warn",
    "no-debugger": "error",
  },
};
```

也可以分别写成数字 `0`、`1`、`2`。`warn` 默认不会仅因警告让 ESLint 返回失败状态，但 `--max-warnings` 可以设置允许的警告数量，超过阈值时仍会返回非零状态。

如果规则需要额外参数，就写成数组：

```typescript
const unusedVariablesConfig = {
  rules: {
    // 使用 TypeScript 扩展规则时关闭同名核心规则
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        args: "all",
        argsIgnorePattern: "^_",
        caughtErrors: "all",
        caughtErrorsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        ignoreRestSiblings: true,
      },
    ],
  },
};
```

当前项目里这个规则的意思是：

- 未使用变量只报 `warn`
- 普通变量、参数、捕获的异常和数组解构占位如果以下划线 `_` 开头，就视为“有意不使用”
- 对象剩余属性写法中的同级属性不重复报告未使用

`@typescript-eslint/no-unused-vars` 来自 typescript-eslint 插件。启用它时通常应关闭 ESLint 核心的同名规则，避免核心规则误报 TypeScript 语法或产生重复诊断。

### ESLint 适合管什么

更适合交给 ESLint 的通常是：

- Vue 组件结构规则
- TypeScript 语法规则，以及在启用类型信息后可执行的类型感知规则
- 未使用变量
- 组件命名方式
- 空 block、危险写法、框架约束

例如当前项目就配了：

- `vue/block-order`
- `vue/component-name-in-template-casing`
- `vue/no-empty-component-block`
- `@typescript-eslint/no-unused-vars`

## 2. Oxc 与 Oxlint 有什么用

`Oxc` 是以 Rust 实现的 JavaScript、TypeScript 编译器工具链项目，包含解析、转换、压缩和静态分析等能力。`Oxlint` 是构建在 Oxc 编译器基础设施之上的高性能 JavaScript、TypeScript linter，当前项目实际使用的是它的命令行工具 `oxlint`。

需要区分两种写法：

- `Oxlint`：工具或产品名称
- `oxlint`：软件包及命令行命令

### Oxlint 的特点

Oxlint 的突出特点是执行速度快，同时提供以正确性为重点的默认规则、许多常用 ESLint 插件规则的原生实现，以及可选的类型感知检查能力。它可以用来发现：

- 确定错误、不安全或无用的代码
- 可能错误或无用的可疑写法
- 按需启用的性能、风格和限制类问题
- 已启用插件及单项规则覆盖的其他问题

在同时使用 Oxlint 和 ESLint 的项目中，可以先运行 Oxlint，再让 ESLint 处理尚未被覆盖的规则或插件能力；这是一种可选工作流，并不是固定要求。如果项目仍依赖 Oxlint 尚未支持的 ESLint 插件行为，就需要继续保留 ESLint。

普通 Oxlint 检查也不能自动代替 `tsc` 或 `vue-tsc`。类型感知规则需要额外启用 `typeAware`，实验性的 TypeScript 编译诊断需要启用 `typeCheck`；是否采用这些能力应根据项目版本和工作流判断。

### 当前项目的 Oxlint 配置文件

当前仓库使用的配置文件是：

- `.oxlintrc.json`

Oxlint 还可以自动查找 `.oxlintrc.jsonc`、`oxlint.config.ts` 或 `oxlint.config.mts`。其中 `.oxlintrc.json` 支持注释，语法按 JSONC 解析；TypeScript 配置需要满足相应的软件包和 Node.js 运行条件。也可以通过 `--config` 显式指定配置，但这样会关闭嵌套配置的自动查找。

当前配置的核心结构如下。`$schema` 不是运行所必需的，但可以为编辑器提供字段提示和校验：

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["eslint", "typescript", "unicorn", "oxc", "vue"],
  "env": {
    "browser": true
  },
  "ignorePatterns": ["dist/**", "dist-ssr/**", "coverage/**", "node_modules/**"],
  "categories": {
    "correctness": "error",
    "suspicious": "warn"
  },
  "rules": {
    "eqeqeq": "error",
    "no-console": "warn",
    "no-debugger": "error",
    "prefer-const": "error"
  },
  "options": {
    "reportUnusedDisableDirectives": "error"
  }
}
```

`env.browser` 会提供浏览器环境中的预定义全局变量。它不会设置构建目标，也不会改变代码实际运行的环境。

### Oxlint 规则怎么设置

这份配置主要使用以下字段：

- `plugins`：选择内置规则集
- `categories`：按规则类别设置严重级别
- `rules`：配置或覆盖单项规则
- `ignorePatterns`：设置不参与检查的文件和目录模式
- `options`：设置 linter 级行为

Oxlint 还支持 `overrides`、`extends`、`globals`、`settings` 和 `jsPlugins` 等字段，可以处理按文件覆盖、共享配置和自定义插件等需求。

#### `plugins`

`plugins` 选择 Oxlint 内置的规则集，例如：

- `eslint`
- `typescript`
- `vue`
- `unicorn`
- `oxc`

这些插件由 Oxlint 原生实现，不等于动态加载对应的 JavaScript ESLint 插件包。启用插件会让相应规则可用，类别和单项规则配置再决定具体启用哪些规则以及采用什么严重级别。

显式设置 `plugins` 会覆盖默认插件集合，因此数组中应包含项目希望启用的全部插件。需要加载兼容 ESLint API 的 JavaScript 插件时，应使用仍处于 alpha 阶段的 `jsPlugins`，不要与内置 `plugins` 混淆。

`typescript` 插件提供 TypeScript 相关规则，但只写入这个插件名并不会自动启用需要类型信息的规则。类型感知检查还需要启用相应选项并安装它要求的附加包。

#### `categories`

`categories` 可以按意图成组启用、关闭规则或调整严重级别。Oxlint 默认启用 `correctness` 类别，完整类别包括：

| 类别          | 含义                                     |
| ------------- | ---------------------------------------- |
| `correctness` | 确定错误或无用的代码                     |
| `suspicious`  | 可能错误或无用的代码                     |
| `pedantic`    | 更严格、可能产生误报的规则               |
| `perf`        | 以改善运行时性能为目标的规则             |
| `style`       | 习惯用法和代码一致性规则                 |
| `restriction` | 禁止特定语法、模式或功能的规则           |
| `nursery`     | 仍在开发、未来行为可能变化的规则         |

例如：

```json
{
  "categories": {
    "correctness": "error",
    "suspicious": "warn",
    "pedantic": "off"
  }
}
```

这里表示把正确性问题设为错误、把可疑问题设为警告，并关闭严格规则组。`rules` 中的单项设置优先于类别设置，因此可以先按类别确定基准，再对少数规则单独覆盖。

#### `rules`

`rules` 用来配置具体规则：

```json
{
  "rules": {
    "eqeqeq": "error",
    "no-console": "warn",
    "no-debugger": "error",
    "prefer-const": ["error", { "destructuring": "any" }],
    "oxc/approx-constant": "warn"
  }
}
```

名称唯一的 ESLint 核心规则可以省略 `eslint/` 前缀，因此 `eqeqeq` 等价于 `eslint/eqeqeq`。其他来源的规则通常使用带命名空间的名称，例如 `oxc/approx-constant`。

规则严重级别可以使用以下等价写法：

| 作用 | 字符串                 | 数字 |
| ---- | ---------------------- | ---- |
| 关闭 | `off` 或 `allow`       | `0`  |
| 警告 | `warn`                 | `1`  |
| 错误 | `error` 或 `deny`      | `2`  |

需要传递规则选项时，使用 `[严重级别, 选项]` 数组。警告通常不会让命令返回失败状态；如需在 CI 中限制警告，可以配置 `options.denyWarnings` 或 `options.maxWarnings`。

#### `ignorePatterns`

`ignorePatterns` 使用类似 `.gitignore` 的模式，同时匹配文件和目录，并相对于配置文件所在目录解析：

```json
{
  "ignorePatterns": ["dist/**", "dist-ssr/**", "coverage/**", "node_modules/**"]
}
```

它不能匹配配置目录之外的文件，包含 `..` 的模式会被视为配置错误。Oxlint 默认忽略 `.git` 目录、名称符合压缩文件特征的文件以及项目 `.gitignore` 匹配的文件；隐藏文件不会仅仅因为名称以 `.` 开头就被自动忽略。

#### `options`

`options` 用于设置 linter 级行为，常见字段包括：

- `reportUnusedDisableDirectives`：报告没有实际抑制任何诊断的禁用指令
- `denyWarnings`：让警告导致非零退出码
- `maxWarnings`：设置允许的最大警告数
- `typeAware`：启用需要类型信息的规则
- `typeCheck`：启用实验性的 TypeScript 编译诊断

当前项目使用：

```json
{
  "options": {
    "reportUnusedDisableDirectives": "error"
  }
}
```

这会把未使用的 `oxlint-disable*` 指令报告为错误；默认尊重 ESLint 禁用指令时，也会检查相应的 `eslint-disable*` 指令。`reportUnusedDisableDirectives`、`typeAware` 和 `typeCheck` 只支持放在根配置中。配置与命令行参数同时出现时，以命令行参数为准。

### 自动修复的边界

并不是所有规则都提供自动修复。Oxlint 把修复分成不同等级：

```bash
oxlint --fix
oxlint --fix-suggestions
oxlint --fix-dangerously
```

- `--fix` 应用不会改变程序行为的安全修复
- `--fix-suggestions` 应用可能改变行为或不一定符合开发者意图的建议
- `--fix-dangerously` 应用可能破坏代码的激进修复

后两种模式应在检查差异并运行测试后使用。没有提供修复器的规则只能由开发者手动处理。

### Oxlint 更适合管什么

更适合优先交给 Oxlint 的通常是：

- 通用 JavaScript、TypeScript 错误和可疑写法
- 已由内置插件覆盖的规则
- 大型代码库和 CI 中的高性能静态扫描
- 项目明确启用的类型感知规则
- 提供安全修复器的重复性问题

当前项目把下面这些规则放在 Oxlint 配置中：

- `eqeqeq`
- `no-console`
- `no-debugger`
- `prefer-const`

这些都是可省略 `eslint/` 前缀的 ESLint 核心规则。是否同时在 ESLint 中保留同名规则，应根据两套配置的覆盖关系决定，避免没有必要的重复诊断和重复修复。

## 3. Prettier 有什么用

`Prettier` 是一个有少量配置选项的代码格式化器。它先根据文件类型解析代码，再按照稳定的打印规则重新输出，从而统一团队中的代码排版。

Prettier 主要处理：

- 语句末尾是否打印分号
- JavaScript 字符串优先使用哪种引号
- 换行算法参考的期望行宽
- 每级缩进的宽度和缩进字符
- 多行语法结构中的尾随逗号
- HTML、Vue 等模板的标签换行与空白处理

Prettier 不负责验证业务逻辑、类型正确性或大多数代码质量问题。代码无法通过相应解析器时，它可能拒绝格式化；能够成功格式化也不代表代码一定能够正确运行。尤其是在 HTML、Vue 等空白可能影响显示结果的场景中，还要谨慎选择空白敏感度选项。

因此，Prettier 更准确的定位是“代码格式化器”，而不是 linter 或类型检查器。

### 当前项目的 Prettier 配置文件

当前仓库使用：

- `.prettierrc.json`
- `.prettierignore`

Prettier 还支持 `package.json` 中的 `prettier` 字段，以及 JSON、YAML、JavaScript、TypeScript 和 TOML 等形式的配置文件。它会从待格式化文件所在位置开始向上查找最近的配置，并且故意不提供全局配置，以保证项目换到其他计算机后仍能得到一致结果。

如果项目同时存在 `.editorconfig`，Prettier 会读取其中能够映射的选项，但 `.prettierrc` 等 Prettier 配置具有更高优先级。需要针对特定扩展名或目录调整格式时，可以使用 `overrides`；Prettier 通常会根据文件扩展名自动选择解析器，不应在配置顶层强制所有文件使用同一个 `parser`。

当前配置如下：

```json
{
  "semi": false,
  "singleQuote": true,
  "printWidth": 100,
  "bracketSpacing": true,
  "htmlWhitespaceSensitivity": "ignore",
  "endOfLine": "lf",
  "trailingComma": "all",
  "tabWidth": 2
}
```

### Prettier 格式化选项怎么设置

Prettier 使用的是格式化选项，不是 lint 规则。当前项目选择在 `.prettierrc.json` 中直接配置，例如：

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2
}
```

#### `semi`

`semi: false` 表示不在每条语句末尾统一打印分号，但 Prettier 仍会在可能触发 JavaScript 自动分号插入问题的行首添加必要分号。因此，它不是“任何地方都不加分号”。

#### `singleQuote`

`singleQuote: true` 表示 JavaScript 字符串优先使用单引号。如果改用双引号可以减少转义，Prettier 仍可能选择双引号。这个选项不控制 JSX 属性；JSX 需要使用 `jsxSingleQuote`。JSON 语法要求字符串使用双引号，也不会因为这个选项而改成单引号。

#### `printWidth`

`printWidth: 100` 是换行算法参考的期望宽度，不是硬性的最大行长，也不等同于 ESLint 的 `max-len`。Prettier 会尽量围绕这个宽度排版，但无法安全拆分的字符串、导入路径等内容仍可能超过 100 个字符。

#### `trailingComma`

`trailingComma: "all"` 会在多行且语法允许的逗号分隔结构中打印尾随逗号，包括函数参数和调用参数。直接运行这些 JavaScript 代码时，目标环境需要支持相应的 ES2017 语法；使用编译工具降级也是一种处理方式。

#### `tabWidth`

`tabWidth: 2` 表示每级缩进对应两个空格的宽度。真正使用空格还是制表符由 `useTabs` 决定；`useTabs` 默认为 `false` 时，才会使用空格缩进。

#### `endOfLine`

`endOfLine: "lf"` 会让 Prettier 把所处理文件的换行符输出为 `LF`。Git 的检出设置仍可能转换换行符；如果仓库要求始终保存 LF，通常还应在 `.gitattributes` 中配置相应的 `eol=lf` 规则。

#### `bracketSpacing`

`bracketSpacing: true` 会在对象大括号内部打印空格，例如 `{ foo: bar }`；设置为 `false` 时会输出 `{foo: bar}`。

#### `htmlWhitespaceSensitivity`

`htmlWhitespaceSensitivity: "ignore"` 表示在 HTML、Vue、Angular 和 Handlebars 中把标签周围是否存在空白视为不重要。该设置会影响模板换行方式；如果页面依赖标签之间的文本空白，应确认格式化结果仍符合预期。

### `.prettierignore` 是做什么的

`.prettierignore` 使用 `.gitignore` 风格的语法，用于排除不应被格式化的文件和目录。它通常放在运行 Prettier 的项目根目录，使命令行和编辑器集成都能采用相同的忽略范围。

当前项目忽略了：

- `node_modules`
- `dist`
- `dist-ssr`
- `coverage`
- `.eslintcache`
- 各种 lock 文件

其中构建产物和缓存通常可以重新生成，lock 文件则通常应由相应的包管理器维护。Prettier 默认已经忽略 `node_modules` 以及 `.git`、`.svn`、`.hg` 等版本控制目录；使用 `--with-node-modules` 时才会处理 `node_modules`。它也会读取命令执行目录下的 `.gitignore`。

需要保留单个语法节点的原始格式时，可以使用语言对应的忽略注释，例如 JavaScript 中的 `// prettier-ignore` 或 HTML、Markdown 中的 `<!-- prettier-ignore -->`。局部忽略只影响紧随其后的相应节点，不等于忽略整个文件。

## 4. 它们之间怎么配合

当前项目选择先运行 Oxlint，再运行 ESLint，并单独执行 Prettier。这是项目工作流，不是工具强制规定的顺序。它们与类型检查器的职责可以概括为：

| 工具                | 主要职责                                             |
| ------------------- | ---------------------------------------------------- |
| `Oxlint`            | 高性能静态分析和已覆盖规则的检查                     |
| `ESLint`            | 项目仍需要的插件规则、框架规则和自定义静态分析规则   |
| `Prettier`          | 按统一选项重新格式化代码                             |
| `tsc` / `vue-tsc`   | TypeScript 及 Vue 项目的类型检查                     |

Oxlint 和 ESLint 的实际分工取决于当前启用的规则、Oxlint 的覆盖范围以及项目所需的 ESLint 插件，不能简单概括成“Oxlint 只检查通用错误，ESLint 只检查 Vue 和 TypeScript”。Prettier 也不能替代任何一种静态分析或类型检查。

### 为什么 ESLint 里还要加 `eslint-config-prettier`

当前 `eslint.config.ts` 最后接入了 `eslint-config-prettier`：

```typescript
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default defineConfigWithVueTs(
  // 其他 ESLint 配置
  eslintConfigPrettier,
);
```

它只负责关闭 ESLint 中不必要或可能与 Prettier 冲突的格式类规则，不会运行 Prettier，也不会判断文件是否已经格式化。它和把 Prettier 作为 ESLint 规则执行的 `eslint-plugin-prettier` 不是同一个工具。

在 Flat Config 中，应把 `eslint-config-prettier` 放在希望由它覆盖的配置之后。如果后续配置对象再次启用冲突规则，这些规则仍然会生效。可以使用它提供的辅助命令检查某个实际文件最终应用到的配置：

```bash
npx eslint-config-prettier path/to/file.js
```

这个配置只处理 ESLint 规则，不会关闭 Oxlint 中可能与 Prettier 重叠的风格规则；Oxlint 的规则也要单独检查和协调。

Prettier 仍应独立运行：

```bash
prettier --write .
prettier --check .
```

`--write` 会修改文件，`--check` 只检查格式并通过退出码报告结果。对整个仓库运行时，还可以按项目需要使用 `--ignore-unknown` 跳过无法识别的文件类型。

## 5. 什么时候该修改哪类配置

可以先判断需求属于纯格式化、静态分析，还是类型检查，再选择配置位置。

### 想控制纯格式

例如：

- JavaScript 字符串优先使用单引号还是双引号
- 语句末尾是否打印分号
- 换行算法参考的期望宽度
- 每级缩进宽度以及是否使用制表符

这些通常修改 `Prettier`。需要注意，`printWidth` 不是硬性最大行长，缩进字符也要结合 `useTabs` 判断。命名规范、禁用语法等会影响代码表达方式的约束仍应交给 linter，而不是 Prettier。

### 想控制代码质量或框架约束

例如：

- 报告未使用变量
- 约束 Vue 组件 block 顺序
- 约束模板中的组件命名方式
- 禁止空组件块
- 禁止 `debugger` 或要求优先使用 `const`

这类需求由 ESLint 或 Oxlint 处理。不要仅按“Vue、TypeScript 就属于 ESLint”或“通用规则就属于 Oxlint”划分，而应依次确认：

1. Oxlint 是否已经覆盖这条规则及所需选项
2. 规则是否依赖 ESLint 插件、自定义规则或特殊处理器
3. 规则是否需要类型信息
4. 两个 linter 是否会产生重复诊断或重复修复

确定规则归属后，尽量让一个工具成为主要执行者。Oxlint 适合承担已经覆盖的高性能检查；ESLint 继续处理项目需要的插件、框架规则和自定义规则。

### 想检查类型

无法赋值、参数类型不匹配和 Vue 模板类型等问题应交给 `tsc` 或 `vue-tsc`，并在相应的 TypeScript 配置中调整。ESLint 和 Oxlint 的普通语法规则不能替代完整类型检查；需要类型信息的 lint 规则也要另外启用对应能力。

## 6. 当前项目的规则配置速查表

下面记录的是当前项目的配置归属，不代表所有项目都必须采用相同分工：

| 需求                              | 应该改哪里                                           |
| --------------------------------- | ---------------------------------------------------- |
| ESLint 承担的 Vue / TS lint 规则  | `eslint.config.ts`                                   |
| Oxlint 承担的规则                 | `.oxlintrc.json`                                     |
| TypeScript 和 Vue 类型检查        | 相应的 `tsconfig` 与 `vue-tsc` 配置                  |
| 代码格式                          | `.prettierrc.json`                                   |
| 不想被格式化的文件或目录          | `.prettierignore`                                    |
| 不想被 Oxlint 扫描的文件或目录    | `.oxlintrc.json` 的 `ignorePatterns`                 |
| 不想被 ESLint 扫描的文件或目录    | `eslint.config.ts` 中的 `globalIgnores(...)`         |
| 只排除某个 ESLint 配置对象的文件  | 该配置对象中的 `ignores`                             |
| ESLint 与 Prettier 的规则冲突     | `eslint-config-prettier` 及相关 ESLint 规则配置      |

`globalIgnores(...)` 会把匹配项从 ESLint 的全局检查范围中排除，配置对象里的 `ignores` 只决定该对象是否作用于相应文件。三个工具也支持各自的局部禁用注释，但应只在有明确理由时使用，并尽量缩小范围。

`eslint-config-prettier` 只关闭 ESLint 中与 Prettier 冲突或不必要的规则，不会处理 Oxlint；Oxlint 中的重叠风格规则需要单独协调。

## 7. 实际修改示例

### 例 1：想禁止 `console`

如果决定由 Oxlint 负责，可以在 `.oxlintrc.json` 中写成完整配置对象：

```json
{
  "rules": {
    "no-console": "error"
  }
}
```

`no-console` 是 ESLint 核心来源的规则。它的名称在 Oxlint 中唯一，因此可以省略 `eslint/` 前缀。

如果决定由 ESLint 负责，可以在 Flat Config 中加入一个配置对象：

```typescript
const consoleRuleConfig = {
  rules: {
    "no-console": "error",
  },
};
```

项目接入 `eslint-plugin-oxlint` 的兼容配置后，已经由 Oxlint 覆盖的 ESLint 规则可能会被关闭。如果确实要让 ESLint 承担 `no-console`，应检查配置顺序并显式启用它；如果交给 Oxlint，就不要在 ESLint 中重复启用。

某些脚本、服务端入口或诊断场景可能合理使用 `console`。这时可以通过按文件覆盖或规则选项精确放行，不必为了少数场景关闭整个项目的规则。

### 例 2：想允许以下划线开头的未使用参数

如果决定使用 typescript-eslint，可以关闭核心规则并启用 TypeScript 扩展规则：

```typescript
const unusedParametersConfig = {
  rules: {
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        args: "all",
        argsIgnorePattern: "^_",
      },
    ],
  },
};
```

`@typescript-eslint/no-unused-vars` 是替代 ESLint 核心同名规则的扩展规则，因此通常要关闭核心规则。`args: "all"` 让所有参数都接受检查，`argsIgnorePattern: "^_"` 再忽略名称以下划线开头的参数。

这个示例只放行参数，没有设置 `varsIgnorePattern`，所以不会额外改变普通变量的处理方式。下划线只是一项 lint 命名约定，不会改变 JavaScript 或 TypeScript 的运行行为。

### 例 3：想统一成双引号和保留分号

这类需求修改 Prettier 配置：

```json
{
  "semi": true,
  "singleQuote": false
}
```

`semi: true` 会在语句末尾打印分号；`singleQuote: false` 表示 JavaScript 字符串优先使用双引号，但减少转义、JSON 语法和 JSX 独立选项仍会影响最终输出。

配置文件只决定格式化方式，不会自动重写已有文件。修改后需要运行项目的格式化命令，例如：

```bash
pnpm format
```

## 8. 一句话区分这些工具

可以这样记：

- `Oxlint` 负责已覆盖规则的高性能静态分析
- `ESLint` 负责项目仍需要的插件、框架和自定义静态分析规则
- `Prettier` 负责统一代码格式
- `tsc` / `vue-tsc` 负责类型检查

ESLint 与 Oxlint 的能力存在重叠，分工来自项目配置，而不是工具名称本身。Prettier 和类型检查器解决的是另外两类问题。

## 9. 当前项目的推荐使用方式

当前项目平时可以运行：

```bash
pnpm lint
pnpm format
```

其中 `pnpm lint` 按当前脚本执行 Oxlint、ESLint 和 `vue-tsc`，`pnpm format` 会直接修改不符合 Prettier 格式的文件。只想检查格式而不修改文件时，使用：

```bash
pnpm format:check
```

需要应用 linter 能够提供的安全修复时，可以运行：

```bash
pnpm lint:fix
pnpm format
```

`pnpm lint:fix` 不能修复所有诊断，并且按当前脚本不会执行 `vue-tsc`；格式化也不能证明静态分析和类型检查通过。自动修改后应检查代码差异，再重新运行完整的 lint、类型检查和项目测试。

先执行 lint 修复还是先格式化并没有适用于所有项目的唯一顺序。团队应选择一套稳定流程，并确保最终的检查命令全部通过，避免两个工具反复改写同一段代码。
