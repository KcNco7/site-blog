# Zod 学习指南

> 基于 **Zod 4**（2025 年起的主版本）编写。网上大量教程还是 Zod 3 语法，两者有不少差异——本文以 v4 为准，文末附 v3 → v4 差异对照表，方便你读旧资料时对号入座。
>
> 目标：覆盖日常开发 80% 的使用场景。建议通读一遍后当速查手册用，每节代码都可以直接粘到 `ts` 文件里跑。

---

## 目录

1. [Zod 是什么、为什么需要它](#1-zod-是什么为什么需要它)
2. [安装与最小示例](#2-安装与最小示例)
3. [基础类型](#3-基础类型)
4. [字符串与数字的校验规则](#4-字符串与数字的校验规则)
5. [对象 Schema](#5-对象-schema)
6. [数组、元组、Record、Map、Set](#6-数组元组recordmapset)
7. [联合、可辨识联合、交叉类型](#7-联合可辨识联合交叉类型)
8. [解析与错误处理](#8-解析与错误处理)
9. [类型推断：Zod 最大的价值](#9-类型推断zod-最大的价值)
10. [默认值、可选、可空](#10-默认值可选可空)
11. [转换与自定义校验：transform / refine / pipe](#11-转换与自定义校验transform--refine--pipe)
12. [递归类型](#12-递归类型)
13. [实战场景](#13-实战场景)
14. [Zod 3 → Zod 4 差异对照](#14-zod-3--zod-4-差异对照)
15. [速查表与学习建议](#15-速查表与学习建议)

---

## 1. Zod 是什么、为什么需要它

Zod 是一个 **TypeScript 优先的运行时校验库**。核心解决一个问题：

**TypeScript 的类型只存在于编译期，运行时全部被擦除。** 而程序里最容易出错的数据恰恰来自运行时边界之外——用户输入、HTTP 响应、localStorage、环境变量、LLM 的输出。TS 对这些数据无能为力：

```ts
// TS 认为 data 是 User，但运行时它可能是任何东西
const data = (await res.json()) as User; // 自欺欺人的断言
```

Zod 的做法是：**用代码定义一份 schema（数据长什么样），它既能在运行时校验数据，又能自动推导出 TS 类型**。一份定义，两种用途——这就是"Single Source of Truth"：

```ts
import { z } from "zod";

const UserSchema = z.object({
  name: z.string(),
  age: z.number(),
});

type User = z.infer<typeof UserSchema>; // { name: string; age: number } —— 类型自动生成

const data = UserSchema.parse(await res.json()); // 运行时真校验，不对就抛错
// 这里 data 的类型就是 User，且保证运行时也真的是这个形状
```

典型使用场景（也是本文的实战部分）：

- 表单校验（React Hook Form 等官方集成 Zod）
- API 请求/响应校验（前后端都能用）
- 环境变量校验（启动时把配置错误暴露出来）
- LLM 工具参数 / 结构化输出定义（LangChain、Anthropic/OpenAI SDK 都用 Zod 定义 schema）
- 解析 localStorage / 配置文件等不可信数据

---

## 2. 安装与最小示例

```bash
pnpm add zod        # 或 npm i zod
```

要求 `tsconfig.json` 开启 `"strict": true`（Zod 的类型推断依赖严格模式）。

```ts
import { z } from "zod";

// 1. 定义 schema
const schema = z.string();

// 2. 校验数据 —— 两种方式
schema.parse("hello");      // ✅ 返回 "hello"（类型是 string）
schema.parse(42);           // ❌ 抛出 ZodError

const result = schema.safeParse(42); // 不抛错的版本
if (!result.success) {
  console.log(result.error.issues); // 错误详情
} else {
  console.log(result.data);         // 校验通过的数据
}
```

> **经验法则**：处理外部数据（用户输入、网络响应）用 `safeParse` 走分支逻辑；程序内部"理论上不该出错"的地方用 `parse`，错了直接抛出暴露 bug。

---

## 3. 基础类型

```ts
// 原始类型
z.string();     // string
z.number();     // number（不含 NaN）
z.boolean();    // boolean
z.bigint();     // bigint
z.date();       // Date 实例（注意：不是日期字符串！）
z.symbol();

// 字面量：值必须精确等于
z.literal("hello");        // 只接受 "hello"
z.literal(42);
z.literal(["a", "b"]);     // v4 支持多值字面量，等价于 union

// 枚举
const Fruit = z.enum(["apple", "banana", "orange"]);
type Fruit = z.infer<typeof Fruit>; // "apple" | "banana" | "orange"
Fruit.enum.apple;                   // "apple"，可当常量对象用

// 空值类
z.undefined();
z.null();
z.void();       // 常用于函数返回值

// 万金油（尽量少用）
z.any();        // 任何值都过，类型为 any
z.unknown();    // 任何值都过，类型为 unknown（比 any 安全）
z.never();      // 任何值都不过
```

### 类型强制转换（coerce）

外部数据常是字符串形式（URL 参数、表单、环境变量），`z.coerce` 会先做类型转换再校验：

```ts
z.coerce.number().parse("42");      // 42（内部执行 Number("42")）
z.coerce.boolean().parse("false");  // ⚠️ true！非空字符串都是 truthy
z.coerce.date().parse("2026-01-01");// Date 对象

// 布尔值的字符串转换请用 stringbool（v4 新增），专为环境变量设计：
z.stringbool().parse("true");   // true
z.stringbool().parse("1");      // true
z.stringbool().parse("false");  // false
z.stringbool().parse("0");      // false
```

---

## 4. 字符串与数字的校验规则

### 字符串

```ts
z.string().min(1);            // 非空（最常用）
z.string().max(100);
z.string().length(6);
z.string().regex(/^\d+$/);
z.string().startsWith("https://");
z.string().endsWith(".md");
z.string().includes("@");
z.string().trim();            // 转换：去首尾空格
z.string().toLowerCase();     // 转换：转小写
```

### 字符串格式（v4 顶层 API）

v4 把常用格式提升为顶层函数（v3 的 `z.string().email()` 写法已废弃）：

```ts
z.email();          // 邮箱
z.url();            // URL
z.uuid();           // UUID
z.ipv4();
z.ipv6();
z.iso.datetime();   // ISO 8601 时间："2026-07-26T10:00:00Z"
z.iso.date();       // "2026-07-26"
z.iso.time();       // "10:30:00"

// 格式校验可以继续链其他规则
z.email().endsWith("@company.com");
```

### 数字

```ts
z.number().min(0);            // >= 0（别名 .gte）
z.number().max(100);          // <= 100（别名 .lte）
z.number().gt(0);             // > 0
z.number().lt(100);           // < 100
z.number().positive();        // > 0
z.number().nonnegative();     // >= 0
z.number().multipleOf(5);     // 5 的倍数

z.int();                      // 整数（v4 顶层 API，替代 z.number().int()）
z.int32();                    // 32 位整数范围
```

### 自定义错误消息

任何校验都能带上自定义消息（v4 统一用 `error` 参数）：

```ts
z.string().min(1, { error: "不能为空" });
z.email({ error: "邮箱格式不正确" });
z.number({ error: "必须是数字" }).min(0, { error: "不能为负数" });

// error 也可以是函数，根据具体错误动态生成
z.string({
  error: (issue) => (issue.input === undefined ? "该字段必填" : "必须是字符串"),
});
```

---

## 5. 对象 Schema

日常使用中 80% 的 schema 都是对象，这一节是重点。

```ts
const UserSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  email: z.email(),
  age: z.int().min(0).optional(),      // 可选字段
  bio: z.string().nullable(),          // 可以是 null
  role: z.enum(["admin", "user"]).default("user"), // 带默认值
});

type User = z.infer<typeof UserSchema>;
// {
//   id: string;
//   name: string;
//   email: string;
//   age?: number | undefined;
//   bio: string | null;
//   role: "admin" | "user";   ← 有默认值所以输出类型必有
// }
```

### 未知字段的三种处理策略

```ts
const schema = z.object({ name: z.string() });

// 1) 默认：剥离未知字段（多余字段被静默丢掉）
schema.parse({ name: "a", extra: 1 }); // { name: "a" }

// 2) 严格：未知字段报错
z.strictObject({ name: z.string() }).parse({ name: "a", extra: 1 }); // ❌ 抛错

// 3) 宽松：未知字段原样保留
z.looseObject({ name: z.string() }).parse({ name: "a", extra: 1 }); // { name: "a", extra: 1 }
```

> v3 的写法是 `.strict()` / `.passthrough()`，v4 改为独立的构造函数，语义更清晰。

### 从已有对象派生新对象（非常常用）

```ts
const UserSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  password: z.string().min(8),
});

// 挑选部分字段
const PublicUser = UserSchema.pick({ id: true, name: true });

// 排除部分字段
const SafeUser = UserSchema.omit({ password: true });

// 全部变可选（常用于 PATCH 更新接口）
const UserPatch = UserSchema.partial();

// 指定字段变可选
const Draft = UserSchema.partial({ email: true, password: true });

// 扩展字段
const Employee = UserSchema.extend({
  department: z.string(),
});

// 组合两个 schema（v4 推荐展开 shape，替代已废弃的 .merge()）
const Combined = z.object({
  ...UserSchema.shape,
  ...z.object({ score: z.number() }).shape,
});

// 取出单个字段的 schema 复用
const EmailOnly = UserSchema.shape.email;
```

---

## 6. 数组、元组、Record、Map、Set

```ts
// 数组
z.array(z.string());               // string[]
z.array(z.string()).min(1);        // 非空数组
z.array(z.string()).max(10);
z.string().array();                // 等价写法

// 对象数组（最常见）
const TodoListSchema = z.array(
  z.object({
    id: z.string(),
    text: z.string(),
    done: z.boolean(),
  }),
);

// 元组：固定长度、每个位置类型不同
z.tuple([z.string(), z.number()]);            // [string, number]
z.tuple([z.string()], z.number());            // [string, ...number[]]（带 rest）

// Record：键值映射对象。v4 必须显式传键类型
z.record(z.string(), z.number());             // Record<string, number>
z.record(z.enum(["a", "b"]), z.number());     // { a: number; b: number }

// Map 和 Set（真正的 Map/Set 实例）
z.map(z.string(), z.number());
z.set(z.string());
```

---

## 7. 联合、可辨识联合、交叉类型

```ts
// 普通联合：依次尝试每个成员
const StringOrNumber = z.union([z.string(), z.number()]);
// 类型：string | number

// 可辨识联合（重要！）：按标签字段直接分发，性能更好、报错更准
const EventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("click"), x: z.number(), y: z.number() }),
  z.object({ type: z.literal("keypress"), key: z.string() }),
  z.object({ type: z.literal("scroll"), delta: z.number() }),
]);

type AppEvent = z.infer<typeof EventSchema>;

// 解析后 TS 能正常窄化：
const ev = EventSchema.parse(data);
if (ev.type === "click") {
  ev.x; // ✅ TS 知道这里有 x
}

// 交叉类型：同时满足两个 schema（对象场景优先用 .extend，交叉留给 union 等场景）
const A = z.object({ a: z.string() });
const B = z.object({ b: z.number() });
const AB = z.intersection(A, B); // { a: string } & { b: number }
```

> **实践建议**：凡是"多种消息/事件/状态"的数据结构，都设计一个 `type` 字段并用 `discriminatedUnion`——错误信息会精确指向对应分支，而普通 `union` 只能告诉你"所有分支都失败了"。

---

## 8. 解析与错误处理

### 四个解析方法

```ts
schema.parse(data);           // 成功返回数据；失败抛 ZodError
schema.safeParse(data);       // 永不抛错，返回 { success, data } 或 { success, error }
await schema.parseAsync(data);     // schema 含异步 refine 时用
await schema.safeParseAsync(data);
```

### safeParse 的标准用法

```ts
const result = UserSchema.safeParse(input);

if (!result.success) {
  // result.error 是 ZodError，核心是 issues 数组
  for (const issue of result.error.issues) {
    console.log(issue.path);    // 出错位置，如 ["address", "city"]
    console.log(issue.code);    // 错误码，如 "invalid_type" / "too_small"
    console.log(issue.message); // 人类可读消息
  }
  return;
}

result.data; // 类型安全的数据
```

### 错误的三种格式化方式（v4 顶层函数）

```ts
const err = result.error;

// 1) 树形结构：适合嵌套表单逐字段展示
z.treeifyError(err);
// { errors: [...], properties: { email: { errors: ["邮箱格式不正确"] } } }

// 2) 扁平结构：适合简单表单
z.flattenError(err);
// { formErrors: [], fieldErrors: { email: ["邮箱格式不正确"], name: ["不能为空"] } }

// 3) 可读字符串：适合日志和 CLI
z.prettifyError(err);
// "✖ 邮箱格式不正确\n  → at email"
```

> v3 的 `error.format()` / `error.flatten()` 实例方法已废弃，v4 用上面的顶层函数。

---

## 9. 类型推断：Zod 最大的价值

```ts
const UserSchema = z.object({
  name: z.string(),
  tags: z.array(z.string()),
});

// 从 schema 提取 TS 类型 —— 类型永远和校验逻辑同步，不会漂移
type User = z.infer<typeof UserSchema>;
```

当 schema 含 **转换**（transform / default / coerce）时，输入和输出类型不同，可以分别提取：

```ts
const schema = z.object({
  age: z.coerce.number(),       // 输入 string 也行，输出一定是 number
  role: z.string().default("user"), // 输入可不传，输出一定有
});

type In = z.input<typeof schema>;  // { age: unknown; role?: string | undefined }
type Out = z.output<typeof schema>; // { age: number; role: string }
// z.infer 等价于 z.output
```

**实践模式**：项目里不再手写 interface，而是 schema 放一个文件、类型从 schema 导出：

```ts
// schemas/user.ts
export const UserSchema = z.object({ ... });
export type User = z.infer<typeof UserSchema>;
```

---

## 10. 默认值、可选、可空

这几个修饰符长得像，语义完全不同，值得单独理清：

```ts
z.string().optional();   // string | undefined —— 字段可以不传
z.string().nullable();   // string | null      —— 值可以是 null
z.string().nullish();    // string | null | undefined —— 两者皆可

z.string().default("hi");
// 输入是 undefined 时 → 直接用默认值 "hi"（v4：默认值不再经过校验管道）
// 输出类型必为 string

z.number().catch(0);
// 校验失败时兜底为 0，永不报错 —— 适合"坏数据可容忍"的场景（如可选配置项）
// ⚠️ 会吞掉错误，核心数据不要用
```

对比总结：

| 写法 | 允许 undefined | 允许 null | 校验失败时 |
|---|---|---|---|
| `.optional()` | ✅ | ❌ | 报错 |
| `.nullable()` | ❌ | ✅ | 报错 |
| `.default(v)` | ✅（变成 v） | ❌ | 报错 |
| `.catch(v)` | ✅（变成 v） | ✅（变成 v） | 变成 v，不报错 |

---

## 11. 转换与自定义校验：transform / refine / pipe

### transform：校验后转换数据

```ts
const schema = z.string().transform((s) => s.length);
schema.parse("hello"); // 5（输入 string，输出 number）

// 常见：字符串转数组
const TagsSchema = z.string().transform((s) => s.split(",").map((t) => t.trim()));
TagsSchema.parse("a, b, c"); // ["a", "b", "c"]
```

### refine：内置规则不够时的自定义校验

```ts
const PasswordSchema = z
  .string()
  .min(8)
  .refine((s) => /[A-Z]/.test(s), { error: "至少一个大写字母" })
  .refine((s) => /\d/.test(s), { error: "至少一个数字" });

// 跨字段校验：确认密码
const SignupSchema = z
  .object({
    password: z.string().min(8),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    error: "两次密码不一致",
    path: ["confirm"], // 把错误挂到 confirm 字段上（表单展示需要）
  });
```

### superRefine：一次校验中报多个错、更精细控制

```ts
const schema = z.array(z.string()).superRefine((items, ctx) => {
  if (new Set(items).size !== items.length) {
    ctx.addIssue({ code: "custom", message: "存在重复项" });
  }
  if (items.length > 10) {
    ctx.addIssue({ code: "custom", message: "最多 10 项" });
  }
});
```

### pipe：把两个 schema 串成流水线

```ts
// 先当字符串校验并转换，再当数字校验
const AgeSchema = z.string()
  .transform(Number)
  .pipe(z.int().min(0).max(150));

AgeSchema.parse("25");  // 25
AgeSchema.parse("abc"); // ❌ NaN 过不了 int 校验
```

### 异步校验

```ts
const UsernameSchema = z.string().refine(
  async (name) => !(await isUsernameTaken(name)),
  { error: "用户名已被占用" },
);

await UsernameSchema.parseAsync("alice"); // 含异步 refine 必须用 parseAsync
```

---

## 12. 递归类型

树形结构（评论树、目录树、菜单）用 getter 定义递归字段：

```ts
const CategorySchema = z.object({
  name: z.string(),
  get children() {
    return z.array(CategorySchema);
  },
});

type Category = z.infer<typeof CategorySchema>;
// { name: string; children: Category[] }

// 任意 JSON 值：v4 内置
const JsonSchema = z.json();
```

---

## 13. 实战场景

### 13.1 表单校验（原生 / React Hook Form）

```ts
const LoginSchema = z.object({
  email: z.email({ error: "请输入有效邮箱" }),
  password: z.string().min(8, { error: "密码至少 8 位" }),
  remember: z.boolean().default(false),
});

// 原生表单提交
function onSubmit(formData: FormData) {
  const result = LoginSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    const { fieldErrors } = z.flattenError(result.error);
    // { email: ["请输入有效邮箱"], password: [...] } → 逐字段渲染
    return showErrors(fieldErrors);
  }
  login(result.data);
}
```

React Hook Form 用官方 resolver，schema 同时提供校验和表单类型：

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const form = useForm<z.infer<typeof LoginSchema>>({
  resolver: zodResolver(LoginSchema),
});
```

### 13.2 环境变量校验（启动时挡住配置错误）

```ts
// env.ts —— 应用入口第一件事就是跑这个
const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.url(),
  ENABLE_CACHE: z.stringbool().default(false), // "true"/"1"/"yes" → boolean
  API_KEY: z.string().min(1, { error: "API_KEY 未配置" }),
});

const result = EnvSchema.safeParse(process.env);
if (!result.success) {
  console.error("❌ 环境变量配置错误：\n" + z.prettifyError(result.error));
  process.exit(1);
}
export const env = result.data; // 全项目 import { env }，全类型安全
```

### 13.3 API 响应校验（别再 `as` 断言了）

```ts
const WeatherSchema = z.object({
  city: z.string(),
  temp: z.coerce.number(),
  updatedAt: z.iso.datetime(),
});

async function fetchWeather(city: string) {
  const res = await fetch(`/api/weather?city=${city}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  // 第三方 API 改字段、返回残缺数据时，这里第一时间报出来
  return WeatherSchema.parse(await res.json());
}
```

服务端校验请求体（Express 为例）：

```ts
app.post("/todos", (req, res) => {
  const result = CreateTodoSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: z.treeifyError(result.error) });
  }
  // result.data 类型安全
});
```

### 13.4 localStorage / 配置文件解析

```ts
const FavoritesSchema = z.record(z.string(), z.object({
  title: z.string(),
  favoritedAt: z.number(),
  note: z.string().catch(""), // 旧版本数据可能没有 note，兜底空串
}));

function loadFavorites() {
  try {
    const raw = localStorage.getItem("favorites");
    return FavoritesSchema.parse(JSON.parse(raw ?? "{}"));
  } catch {
    return {}; // 数据损坏时优雅降级，而不是页面白屏
  }
}
```

### 13.5 LLM / Agent 开发：工具参数与结构化输出

这是你后面学 LangChain 会天天见的用法。工具参数用 Zod 定义，`.describe()` 的内容会进入发给模型的 JSON Schema，**写得越清楚模型调用越准**：

```ts
// LangChain 定义工具
import { tool } from "@langchain/core/tools";

const searchDocs = tool(
  async ({ query, limit }) => {
    return await doSearch(query, limit);
  },
  {
    name: "search_docs",
    description: "在知识库中搜索相关文档",
    schema: z.object({
      query: z.string().describe("搜索关键词，支持中文"),
      limit: z.int().min(1).max(20).default(5).describe("返回结果数量"),
    }),
  },
);
```

```ts
// Anthropic SDK 的 tool runner 同理
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";

const getWeather = betaZodTool({
  name: "get_weather",
  description: "查询指定城市的当前天气",
  inputSchema: z.object({
    city: z.string().describe("城市名，如 '北京'"),
  }),
  run: async ({ city }) => fetchWeather(city),
});
```

校验 LLM 的结构化输出（模型偶尔会不守规矩，Zod 是最后防线）：

```ts
const BriefingSchema = z.object({
  overview: z.string(),
  items: z.array(z.object({
    title: z.string(),
    summary: z.string(),
    sourceUrl: z.url(),
  })).max(10),
});

const parsed = BriefingSchema.safeParse(JSON.parse(llmOutput));
if (!parsed.success) {
  // 重试或降级，而不是把脏数据渲染给用户
}
```

顺带一提：v4 内置了 JSON Schema 导出，需要给不认 Zod 的系统（如 OpenAPI 文档、原始 API）提供 schema 时直接转：

```ts
z.toJSONSchema(BriefingSchema);
// → 标准 JSON Schema 对象
```

> 你晨启项目里 `src/main/index.ts` 的 `briefingSchema` 就是这个模式的真实用例，可以对照着看。

---

## 14. Zod 3 → Zod 4 差异对照

读旧教程 / 旧项目代码时的翻译表：

| 场景 | Zod 3（旧） | Zod 4（新） |
|---|---|---|
| 邮箱等格式 | `z.string().email()` | `z.email()` |
| URL | `z.string().url()` | `z.url()` |
| UUID | `z.string().uuid()` | `z.uuid()` |
| 整数 | `z.number().int()` | `z.int()` |
| 自定义错误 | `{ message: "..." }` / `required_error` / `invalid_type_error` | 统一 `{ error: "..." }`（可传函数） |
| 严格对象 | `z.object({...}).strict()` | `z.strictObject({...})` |
| 宽松对象 | `z.object({...}).passthrough()` | `z.looseObject({...})` |
| 合并对象 | `A.merge(B)` | `A.extend(B.shape)` 或展开 shape |
| Record | `z.record(z.number())` | `z.record(z.string(), z.number())`（键类型必填） |
| 错误格式化 | `error.format()` / `error.flatten()` | `z.treeifyError(err)` / `z.flattenError(err)` |
| 原生枚举 | `z.nativeEnum(MyEnum)` | `z.enum(MyEnum)` |
| 递归类型 | `z.lazy(() => schema)` | shape 里用 getter（`z.lazy` 仍可用） |
| JSON Schema 导出 | 需第三方库 `zod-to-json-schema` | 内置 `z.toJSONSchema()` |

> 兼容性提示：LangChain JS 新版本已支持 Zod 4；如果某个库报类型不兼容，检查它的 peerDependency 是否还锁在 zod 3。

---

## 15. 速查表与学习建议

### 高频 API 速查

```ts
// 定义
z.object({ ... })  z.array(T)  z.enum([...])  z.union([...])  z.discriminatedUnion("type", [...])

// 字符串
z.string().min(1).max(100)  z.email()  z.url()  z.uuid()  z.iso.datetime()

// 数字
z.number().min(0).max(100)  z.int()  z.coerce.number()

// 修饰
.optional()  .nullable()  .default(v)  .catch(v)  .describe("...")

// 对象操作
.pick({...})  .omit({...})  .partial()  .extend({...})  .shape.字段名

// 校验与转换
.refine(fn, { error })  .superRefine((v, ctx) => ...)  .transform(fn)  .pipe(schema)

// 解析
.parse(data)  .safeParse(data)  .parseAsync(data)

// 类型
z.infer<typeof S>  z.input<typeof S>  z.output<typeof S>

// 错误
z.flattenError(e)  z.treeifyError(e)  z.prettifyError(e)
```

### 建议的学习路径

1. **第 1 天**：第 2–5 节（基础类型 + 对象）。练习：把你现有项目里的一个 interface（比如晨启的 `AppSettings`）改写成 Zod schema，用 `z.infer` 导出类型。
2. **第 2 天**：第 8–10 节（解析、错误处理、类型推断）。练习：给 localStorage 读取加上 schema 校验。
3. **第 3 天**：第 11 节（refine / transform / pipe）+ 实战 13.1、13.2。练习：写一个环境变量校验模块。
4. **之后**：做 agent 时回来看 13.5，做表单时回来看 13.1。速查表贴手边。

### 三条实践原则

1. **schema 是唯一事实来源**：类型一律 `z.infer` 导出，不手写重复的 interface。
2. **在边界处校验**：数据进入系统的地方（网络、存储、用户输入、LLM 输出）校验一次，内部传递就不用再验。
3. **错误消息面向用户写**：`{ error: "..." }` 里写的是给人看的话，别让用户看到 "Invalid input: expected string"。
