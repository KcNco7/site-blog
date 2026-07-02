# LangChain 完整知识（LangChain.js v1 · TypeScript）

> 所有代码基于 `langchain@1.4.4`。读完这一份，你能建立 LangChain 的核心心智、写出 LCEL 管道，并分清 LangChain / LangGraph / Deep Agents 三者定位。

---

## 0. 环境准备

### 版本基线（LangChain.js v1）

| 包                         | 版本   | 作用                                                    |
| -------------------------- | ------ | ------------------------------------------------------- |
| `langchain`                | 1.4.4  | 主包，`createAgent`、`tool`、`initChatModel` 都在这里   |
| `@langchain/core`          | 1.1.48 | 核心抽象：消息 / 文档 / Runnable / Prompt               |
| `@langchain/openai`        | 1.4.7  | OpenAI 聊天模型 + Embeddings                            |
| `@langchain/anthropic`     | 1.4.0  | Claude 聊天模型                                         |
| `@langchain/langgraph`     | 1.3.7  | Agent 运行时 + 记忆（checkpointer）                     |
| `@langchain/textsplitters` | 1.0.1  | 文档切分                                                |
| `@langchain/classic`       | 1.0.34 | v1 里被移出主包的 legacy 组件（如 `MemoryVectorStore`） |
| `zod`                      | 4.x    | 定义工具入参 schema（v1 已支持 zod v4）                 |

运行环境：Node v24.x、npm 11.x。需要 Node ≥ 20。

### v1 三个最关键的「新旧写法」变化

网上大量旧教程仍在用废弃写法，务必认清：

1. **Agent**：用主包的 `createAgent` ✅ —— 不要用 `initializeAgentExecutorWithOptions` / `AgentExecutor` ❌
2. **链（Chain）**：用 LCEL 管道 `.pipe()` ✅ —— 不要用 `LLMChain` / `RetrievalQAChain` / `ConversationChain` ❌
3. **记忆（Memory）**：用 LangGraph 的 `checkpointer` ✅ —— 不要用 `BufferMemory` / `ConversationBufferMemory` ❌

还有一个易踩的坑：

- `MemoryVectorStore` 等 legacy 向量库**已从 `langchain` 主包移到 `@langchain/classic`**。旧代码里的 `import { MemoryVectorStore } from "langchain/vectorstores/memory"` 在 v1 会直接报 `ERR_PACKAGE_PATH_NOT_EXPORTED`。

### 项目初始化

```bash
# 1. 初始化（ESM 项目）
npm init -y
npm pkg set type=module

# 2. 安装
npm i langchain@1.4.4 \
      @langchain/core@1.1.48 \
      @langchain/openai@1.4.7 \
      @langchain/anthropic@1.4.0 \
      @langchain/langgraph@1.3.7 \
      @langchain/textsplitters@1.0.1 \
      @langchain/classic@1.0.34 \
      zod@4

# 3. TypeScript 工具链
npm i -D typescript tsx @types/node
```

`tsconfig.json` 最小配置：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src/**/*.ts"]
}
```

直接跑 TS（无需先编译）：

```bash
npx tsx src/01-hello.ts
```

### API Key + 第三方接口（OpenAI 兼容）

统一用 **OpenAI 格式调用第三方接口**（DeepSeek、Kimi、本地 vLLM/Ollama、各种中转站等）。
做法：照常用 `@langchain/openai`，只是额外指定 `baseURL` 指向第三方服务。

```bash
# PowerShell（当前会话）
$env:OPENAI_API_KEY="你的第三方key"
$env:OPENAI_BASE_URL="https://你的第三方地址/v1"   # 注意：大多数服务要带 /v1 后缀
```

> `OPENAI_API_KEY` 会被模型类自动读取；但 **`baseURL` 不会自动从环境变量生效**，
> 必须在代码里显式传 `configuration: { baseURL: ... }`（见下面统一写法）。所以这里把它存进
> `OPENAI_BASE_URL` 只是为了代码里好引用，变量名你随意。

推荐用 `.env` + `process.loadEnvFile()`（Node 20.6+ 内置）或 `dotenv`。

#### 统一写法

聊天模型和 Embedding 都通过 `configuration.baseURL` 指向第三方（官方推荐写法）：

```ts
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";

// 聊天模型
const model = new ChatOpenAI({
  model: "deepseek-chat", // 改成你的第三方支持的模型名
  temperature: 0,
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL, // 关键：指向第三方
  },
});

// Embedding（RAG 用）
const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small", // 改成你的第三方支持的 embedding 模型名
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});
```

> ⚠️ 两个常见坑：
>
> 1. **不是所有第三方都提供 embedding 接口**。如果你的服务只有 chat、没有 embedding，
>    RAG 的向量化要换一个支持 embedding 的服务（可以和 chat 用不同的 baseURL/key）。
> 2. **模型名必须是第三方实际支持的**，`gpt-4o`、`text-embedding-3-small` 只是 OpenAI 官方名，
>    第三方可能叫别的（如 `deepseek-chat`、`bge-m3`）。报 404/model not found 多半是这里。
>
> 另：`createAgent` 若用字符串简写（`"openai:gpt-4o"`）**无法指定 baseURL**，
> 因此 Agent 一律传 new 出来的 **模型实例**。

---

## 1. 核心心智：一切皆 Runnable

LangChain 不是「一个能聊天的库」，它的本质是：

> **把 LLM 应用拆成可组合的小积木（Runnable），再用管道 `.pipe()` 把它们串起来。**

这套组合语法叫 **LCEL**（LangChain Expression Language）。理解了「一切皆 Runnable、用管道串联」，就掌握了 LangChain 应用开发的核心心智。

所有 Runnable 都共享统一入口：

- `.invoke()`：输入进、输出出（单次）
- `.stream()`：流式输出
- `.batch()`：批量并发

---

## 2. LangChain / LangGraph / Deep Agents 的关系

```text
LangChain   = LLM 应用开发框架
LangGraph   = Agent / 工作流编排运行时
Deep Agents = 高层复杂 Agent 套件
```

三者的分层关系：

```text
Deep Agents
  基于 LangChain 的模型、工具、Agent 抽象
  使用 LangGraph 的状态、流程、持久化等运行时能力

LangChain
  提供模型调用、Prompt、Tool、Agent、RAG 等常用组件
  适合快速构建大模型应用

LangGraph
  提供图结构、状态管理、流程控制、持久化、恢复、人类审批等能力
  适合构建复杂、可控、生产级 Agent
```

### 三者核心区别

| 对比项     | LangChain                      | LangGraph                        | Deep Agents                  |
| ---------- | ------------------------------ | -------------------------------- | ---------------------------- |
| 定位       | LLM 应用框架                   | Agent 编排运行时                 | 高层复杂 Agent 套件          |
| 抽象层级   | 中高层                         | 底层                             | 最高层                       |
| 主要价值   | 快速连接模型、工具、RAG、Agent | 精细控制流程、状态、恢复、审批   | 开箱即用的复杂 Agent 能力    |
| 适合入门吗 | 适合                           | 不建议一开始学                   | 不建议一开始学               |
| 控制能力   | 中等                           | 最强                             | 中等，偏预设                 |
| 常见场景   | RAG、工具调用、简单 Agent      | 复杂流程、多 Agent、生产级 Agent | 深度研究、编程助手、长期任务 |

一句话选择：

- **快速做 AI 应用（调模型 / 写 Prompt / 定义工具 / RAG / 普通 Agent）** → LangChain
- **精确控制每一步、多 Agent 协作、可暂停/恢复、人工审批的生产级 Agent** → LangGraph
- **让 Agent 自己规划任务、读写文件、用子 Agent（深度研究、编程助手）** → Deep Agents

如果 LangChain 更像「组件库」，LangGraph 就更像「流程引擎」，Deep Agents 则是「已经搭好很多能力的高级模板」。

在 TypeScript 中常见的入口：

```ts
import { createAgent, tool } from "langchain"; // LangChain
import { createDeepAgent } from "deepagents"; // Deep Agents
```

---

## 3. 调用模型（Hello World）

### 方式 A：`initChatModel`（v1 推荐，模型无关）

`initChatModel` 用一个字符串 `"provider:model"` 就能切换底层模型，代码不用改。

```ts
// src/01-hello.ts
import { initChatModel } from "langchain";

const model = await initChatModel("openai:gpt-4o-mini", {
  temperature: 0,
});

const res = await model.invoke("用一句话解释什么是向量数据库");
console.log(res.content);
```

用 OpenAI 格式调第三方接口时，`initChatModel` 也能透传 `configuration` 指定 `baseURL`（provider 前缀仍写 `openai`，因为走的是 OpenAI 兼容协议）：

```ts
import { initChatModel } from "langchain";

const model = await initChatModel("openai:deepseek-chat", {
  temperature: 0,
  configuration: { baseURL: process.env.OPENAI_BASE_URL },
});
```

### 方式 B：直接 new 模型类（本教程默认用这个）

统一用 OpenAI 格式调第三方接口时，直接 `new ChatOpenAI` 并指定 `baseURL` 最直观：

```ts
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
  model: "deepseek-chat", // 第三方支持的模型名
  temperature: 0,
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL, // 指向第三方
  },
});
```

> 后面所有章节出现的 `model`，都假设你已用上面这种带 `baseURL` 的方式创建好了。
> 记忆点：`.invoke()` 是所有 Runnable 的统一入口。输入进、输出出。

---

## 4. 消息（Messages）

聊天模型的输入不是裸字符串，而是一组消息。三种最常用角色：

```ts
import {
  SystemMessage,
  HumanMessage,
  AIMessage,
} from "@langchain/core/messages";

const res = await model.invoke([
  new SystemMessage("你是一个简洁的技术助手，只用中文回答。"),
  new HumanMessage("TypeScript 和 JavaScript 的关系？"),
]);

console.log(res.content);
```

也可以用简写对象数组（v1 支持）：

```ts
const res = await model.invoke([
  { role: "system", content: "你是一个简洁的技术助手。" },
  { role: "user", content: "什么是 LCEL？" },
]);
```

返回的 `res` 是一条 `AIMessage`：`res.content` 是文本，`res.usage_metadata` 有 token 用量。

---

## 5. Prompt 模板（ChatPromptTemplate）

把可变部分抽成占位符，复用提示词。

```ts
import { ChatPromptTemplate } from "@langchain/core/prompts";

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "你是一个{role}，用{language}回答。"],
  ["human", "{question}"],
]);

// 填值 → 得到消息数组
const messages = await prompt.invoke({
  role: "数据库专家",
  language: "中文",
  question: "B+ 树为什么适合做索引？",
});

const res = await model.invoke(messages);
console.log(res.content);
```

---

## 6. LCEL 管道：把积木串起来（本文重点）

这是 v1 的核心写法。`prompt`、`model`、`parser` 都是 Runnable，用 `.pipe()` 连成一条链：

```ts
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { initChatModel } from "langchain";

const model = await initChatModel("openai:deepseek-chat", {
  temperature: 0,
  configuration: { baseURL: process.env.OPENAI_BASE_URL },
});

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "你是一个{role}。"],
  ["human", "{question}"],
]);

// prompt → model → 把 AIMessage 解析成纯字符串
const chain = prompt.pipe(model).pipe(new StringOutputParser());

const text = await chain.invoke({
  role: "算法老师",
  question: "快速排序的平均时间复杂度？",
});

console.log(text); // 直接是 string，不再是 AIMessage 对象
```

> 对比旧写法：以前要写 `new LLMChain({ llm, prompt })`。**v1 不要再用 `LLMChain`**，一律用 `.pipe()`。

### 数据流向

```
输入对象 {role, question}
   │  ChatPromptTemplate：填充模板 → 消息数组
   ▼
   │  Model：调用 LLM → AIMessage
   ▼
   │  StringOutputParser：取出 .content → string
   ▼
输出 string
```

---

## 7. 流式输出（Streaming）

把 `.invoke()` 换成 `.stream()`，拿到一个异步迭代器，逐块打印：

```ts
const stream = await chain.stream({
  role: "诗人",
  question: "写两句关于秋天的诗",
});

for await (const chunk of stream) {
  process.stdout.write(chunk); // 逐字输出，体验类似 ChatGPT 打字机
}
```

---

## 8. 结构化输出（Structured Output）

让模型直接返回**类型安全的 JSON 对象**，而不是一段需要你手动解析的文本。用 zod 定义形状，`withStructuredOutput` 绑定。

```ts
import { z } from "zod";
import { initChatModel } from "langchain";

const Recipe = z.object({
  name: z.string().describe("菜名"),
  steps: z.array(z.string()).describe("步骤列表"),
  minutes: z.number().describe("预计耗时（分钟）"),
});

const model = await initChatModel("openai:deepseek-chat", {
  temperature: 0,
  configuration: { baseURL: process.env.OPENAI_BASE_URL },
});
const structured = model.withStructuredOutput(Recipe);

const result = await structured.invoke("给我一个番茄炒蛋的简易菜谱");

console.log(result.name); // string
console.log(result.steps); // string[]
console.log(result.minutes); // number
// result 完全符合 Recipe 类型，TS 有完整提示
```

> 这是从文本里提取实体、把回答格式化成固定结构时的常用手段。

---

## 9. 批处理（Batch）

一次并发跑多个输入：

```ts
const answers = await chain.batch([
  { role: "老师", question: "什么是栈？" },
  { role: "老师", question: "什么是队列？" },
]);
console.log(answers); // [string, string]
```

---

## 10. 完整可运行示例

```ts
// src/01-full.ts
import { initChatModel } from "langchain";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

async function main() {
  const model = await initChatModel("openai:deepseek-chat", {
    temperature: 0,
    configuration: { baseURL: process.env.OPENAI_BASE_URL },
  });

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "你是一个{role}，回答务必简洁。"],
    ["human", "{question}"],
  ]);

  const chain = prompt.pipe(model).pipe(new StringOutputParser());

  // 普通调用
  const ans = await chain.invoke({
    role: "前端工程师",
    question: "什么是虚拟 DOM？",
  });
  console.log("【普通】", ans);

  // 流式
  console.log("【流式】");
  const stream = await chain.stream({
    role: "前端工程师",
    question: "什么是事件循环？",
  });
  for await (const chunk of stream) process.stdout.write(chunk);
  console.log();
}

main();
```

运行：

```bash
npx tsx src/01-full.ts
```

---

## 11. 最小实践路线（按小项目学，而不是只看概念）

### 项目 1：模型调用

```text
输入一句话 → 调用模型 → 输出回答
```

你会学到：安装依赖、配置 API Key、调用模型、处理异步返回。

### 项目 2：工具调用

```text
用户问天气 / 时间 / 计算问题 → 模型决定是否调用工具 → 输出答案
```

你会学到：tool 的定义、zod 参数校验、模型如何选择工具。

### 项目 3：RAG 文档问答

```text
读取本地 docs 文件夹 → 切分文档 → 生成 embedding → 存入向量库
  → 根据问题检索相关片段 → 模型基于片段回答
```

你会学到：loader、splitter、embedding、vector store、retriever、引用来源。

### 项目 4：LangGraph 工作流

```text
用户提问 → 判断是否需要检索 → 需要则检索 → 不需要则直接回答 → 输出最终答案
```

你会学到：StateGraph、node、edge、conditional edge、state。

### 项目 5：Deep Agents

```text
给 Agent 一个复杂研究任务 → 自动拆分 todo → 调用工具 → 整理资料 → 输出报告
```

你会学到：createDeepAgent、planning、subagents、filesystem、memory。

---

## 本章小结 & 检查清单

- [ ] 一切皆 Runnable，统一用 `.invoke()` / `.stream()` / `.batch()`
- [ ] 用 `.pipe()`（LCEL）组合链，**不用** `LLMChain`
- [ ] `initChatModel("provider:model")` 实现模型无关
- [ ] Prompt 用 `ChatPromptTemplate.fromMessages`
- [ ] 要 JSON 用 `withStructuredOutput(zodSchema)`
- [ ] 分清三层：LangChain（组件库）/ LangGraph（流程引擎）/ Deep Agents（高级模板）
