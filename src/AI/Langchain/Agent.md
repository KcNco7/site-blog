# Agent 完整知识（概念 + LangChain.js v1 实战）

> 本文整合两份材料：Agent 完全指南（概念：Agent / RAG / Workflow / Tool / MCP 五概念辨析）、以及 LangChain.js v1 的 `createAgent` 代码实战。
> 读完你能：讲清 Agent 是什么、它和普通问答/Workflow/RAG/Tool/MCP 的区别，知道最小 Agent 由哪几部分组成、怎么运行、最容易在哪翻车，并能用 v1 API 亲手写出一个会调用工具、带记忆、能把 RAG 当工具的 Agent。

---

# 第一部分 · 概念

## 1. 什么是 Agent

一句话：

> **Agent = 不只是回答问题，而是会自己决定下一步做什么的系统**

对比一下：

|      | 普通 LLM     | Agent                                              |
| ---- | ------------ | -------------------------------------------------- |
| 输入 | 一个问题     | 一个目标                                           |
| 输出 | 一个回答     | 一连串动作 + 最终结果                              |
| 行为 | 问一句答一句 | 理解目标 → 决定要不要查/调工具 → 多步推进 → 给结果 |

Agent 常见会做的事：思考下一步、调用工具、读文件、搜索知识库、调 API、写代码、执行多步任务。它比普通问答复杂，是因为它通常**循环**做这些事：

```
看当前目标 → 决定下一步动作 → 调用工具 → 观察结果 → 再决定 → ... → 完成
```

### Agent 和 RAG 的关系

- **RAG** 是一种「先检索再回答」的**方法**
- **Agent** 是一种「会自己决定步骤并调用工具」的**系统**

两者不相等，但 **Agent 可以把 RAG 当成自己的一个工具**。一个直观对比：

- 纯 RAG：用户问「年假可以跨年吗？」→ 检索制度 → 根据文档回答。一步到位。
- Agent：用户说「帮我总结请假制度，比较年假/病假/事假的区别，列成表格」→ 判断要查知识库 → 调 RAG 检索 → 提取三类信息 → 整理成表格 → 输出。多步完成。

不是所有问答都需要 Agent。

---

## 2. 为什么 Agent 需要工具

一句话：

> **工具 = Agent 可以调用的外部能力。**

工具不是「模型脑子里的知识」，而是运行时可以使用的额外能力，比如：搜索引擎、RAG 检索系统、数据库查询、文件读取、浏览器操作、代码执行器、计算器、邮件/日历/工单 API。

**哪些算工具，哪些不算**：

- 算工具：读文件、搜网页、查数据库、执行代码、RAG 检索器
- 不单独算工具：模型自己的推理、整理上下文、总结内容（这些是模型**能力**，不是独立工具）

### 为什么不能只靠大模型

大模型最擅长的是「根据输入生成文本」，但真实任务还需要查、算、读、写、调系统、执行操作。具体来说：

1. **模型不能直接访问外部世界**：看不到你的本地文件、最新网页、数据库、当前系统状态——没有工具就只能靠已有知识猜
2. **模型不能天然执行动作**：你让它发邮件/查库/建工单/跑代码，它只会「描述怎么做」，不会真的做
3. **模型做精确计算和查询不稳定**：数学、精确过滤、数据库查找更适合交给专门工具
4. **Agent 需要「先做，再看结果，再继续」**：没有工具就没法真正行动并观察结果

可以把 Agent 拆成两半：

> **大模型负责思考（理解目标、决定下一步），工具负责行动（执行能力、返回真实结果）。**
>
> **没有工具的 Agent，往往只剩下「会说」，不一定真的「会做」。**

---

## 3. Workflow vs Agent

一句话：

> **Workflow = 预先设计好的固定流程。**

如果一个系统是「先检索 → 再总结 → 再输出表格」，而且这个顺序是你**提前写死**的，那它更像 Workflow。

|        | Workflow                    | Agent                      |
| ------ | --------------------------- | -------------------------- |
| 流程   | 人提前设计好，步骤/顺序固定 | 给目标，系统自己决定下一步 |
| 灵活性 | 系统自主空间小              | 可能中途改策略、动态选工具 |
| 记忆法 | **人定流程**                | **模型定下一步**           |

**关键认知**：自动化 ≠ Agent。很多系统看起来都「自动完成任务」，但如果它只是严格按预设步骤走，那就是 Workflow。很多号称 Agent 的产品，实际更像 Workflow。

---

## 4. 什么是 MCP

如果指的是 `Model Context Protocol`，那它**不是一个具体工具**，而是：

> **一种让模型或 Agent 连接外部能力的标准协议。**

它解决的问题是：不同工具、资源、数据源，怎么用**统一方式**接给模型或 Agent。

**最好的类比**：

> **工具像电器，MCP 像插座标准（接口标准）。** 电器是具体能力，插座标准不是电器本身，但它决定了怎么统一接入。

**为什么容易误以为 MCP 就是工具**：因为实际用时你常看到「一个 MCP server 提供很多工具，模型通过 MCP 调用它们」。更准确的说法是：MCP server 里可以包含工具，但 MCP 本身是协议和连接方式。

> **Tool = 具体能力；MCP = 接入这些能力的标准方式。**

---

## 5. 最小 Agent 系统由什么组成

一句话：

> **最小 Agent = 目标 + 模型 + 工具 + 决策循环 + 输出。**

| 部件        | 负责什么                                             |
| ----------- | ---------------------------------------------------- |
| 1. 目标     | Agent 要完成什么（没有目标就没有后续行动）           |
| 2. 大模型   | 思考核心：理解目标、判断下一步、决定要不要调工具     |
| 3. 工具     | 提供外部能力：读文件、搜网页、调库、调 RAG、执行代码 |
| 4. 决策循环 | 和普通一次性问答最大的区别（见第 6 章）              |
| 5. 输出     | 任务完成时把最终结果交付给用户                       |

画成结构：

```
用户目标 → 大模型判断 → 调工具 → 观察结果 → 继续判断 → 输出结果
```

**最小 Agent 不需要**：多个 Agent、复杂记忆系统、长期状态管理、规划器、MCP、工作流编排平台。这些都可以后面再加。

> Agent 最小并不复杂。它的核心不是「高级」，而是「会判断并调用工具」。

---

## 6. Agent 的最小运行流程

一句话：

> **接收目标 → 判断下一步 → 调用工具 → 观察结果 → 再判断 → 输出结果。**

用一个具体任务走一遍——「帮我找出项目里有哪些 TypeScript 文件，并简单说明作用」：

1. **接收目标**：明确要完成什么
2. **判断下一步**：该先做什么？要不要调工具？调哪个？→ 判断先用文件搜索工具找 `.ts`
3. **调用工具**：真的去执行查找（不是「说我要查」）
4. **观察结果**：工具返回若干 `.ts` 文件路径
5. **再判断**：这些够了吗？要不要读内容？→ 判断需要读文件才能总结
6. **继续调用工具**：调文件读取工具，拿到内容
7. **输出最终结果**：整理出有哪些文件、各自作用

**核心循环**：

> **判断 → 行动 → 观察 → 再判断。**

其中「观察工具结果」这一步特别关键——Agent 不是盲目继续，而是要根据真实结果再决定下一步。这条循环就是 Agent 和普通一次性问答的本质差异。这个「思考→行动→观察→再思考」的循环，就叫 **ReAct（Reasoning + Acting）** 模式。

---

## 7. Agent 的常见模式

> 不是所有 Agent 都复杂，很多只是「目标 + 工具 + 决策循环」的不同组合。

| 模式                               | 长什么样                                    | 例子                                                                           |
| ---------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------ |
| **1. 单工具 Agent**                | 只有一个主要工具，模型判断何时调            | 「看看目录里有哪些 TS 文件」→ 调文件搜索 → 返回列表                            |
| **2. 多工具 Agent**                | 多个工具可选，需判断用哪个、按序调用        | 「总结 TS 文件作用」→ 搜文件 → 读内容 → 总结                                   |
| **3. RAG 作为工具的 Agent**        | 需要查资料时调 RAG，拿结果再继续            | 「总结请假制度并对比年假/病假/事假」→ 调 RAG → 提取 → 对比                     |
| **4. Workflow 外壳 + Agent 核心**  | 外层流程固定，某环节内部交给 Agent 自主判断 | 固定「收问题→检查是否查库→输出」，其中「是否查、怎么查、是否继续查」交给 Agent |
| **5. 纯 Workflow（不是真 Agent）** | 表面自动，但每步提前写死，无动态决策        | 永远走「查库→总结→输出表格」，不管问题是什么                                   |

**怎么快速区分**：

- 只有固定步骤 → 更像 **Workflow**
- 会动态选工具和下一步 → 更像 **Agent**
- 固定流程里嵌一段动态决策 → **混合模式**

**初学建议的理解顺序**：单工具 → 多工具 → RAG 作为工具 → Workflow+Agent 混合。**不要一开始就想多 Agent 系统。** 实际系统大多是混合模式，因为它更可控、更稳。

---

## 8. Agent 最容易踩的坑

一句话：

> **Agent 最大的问题通常不是「不会回答」，而是「不会稳定地做事」。**

| 坑                                | 是什么                           | 为什么发生                           | 后果                   |
| --------------------------------- | -------------------------------- | ------------------------------------ | ---------------------- |
| **1. 选错工具**                   | 该读文件却去查库                 | 任务理解不清、工具描述不清、边界重叠 | 结果不准、浪费调用     |
| **2. 不会用工具结果**             | 拿到结果却没真正利用             | 缺少明确的下一步判断                 | 工具白调了             |
| **3. 循环停不下来**               | 一直再查、再试、再补             | 没有清晰的完成条件                   | 成本高、延迟大、体验差 |
| **4. 该用 Workflow 却硬上 Agent** | 固定流程够用却做成 Agent         | 觉得 Agent 更高级                    | 系统更复杂、更难调试   |
| **5. 工具太多决策乱**             | 工具太多模型选不对               | 工具描述太像、功能重复               | 切换混乱、错误率上升   |
| **6. 目标太模糊**                 | 不知道什么叫「完成」             | 任务定义太宽、没输出要求             | 循环过长、输出不稳     |
| **7. 过度相信模型会自己规划好**   | 以为给够工具就能稳定完成复杂任务 | 对能力预期过高、缺约束               | 随机性大、难复现       |

**初学避坑 5 条**：

1. 工具不要一开始给太多
2. 工具描述要清楚
3. 任务目标要具体
4. **完成条件要明确**（这是「循环停不下来」的解药）
5. 能用 Workflow 解决的，不要先上 Agent

最该刻进脑子的一句：

> **不要把「模型会思考」误解成「模型会稳定执行任务」。**
>
> 简单、可控、可观察，通常比「更智能」更重要。

---

## 9. 总对比：Agent / RAG / Workflow / Tool / MCP

最容易混的五个词，**关键认知是：它们不在同一层。**

| 概念         | 它是什么层 | 回答的问题               | 一句话                             |
| ------------ | ---------- | ------------------------ | ---------------------------------- |
| **RAG**      | 方法       | 知识从哪里来             | 先检索资料，再生成回答             |
| **Agent**    | 系统形态   | 任务怎么一步步完成       | 为完成目标，自己决定步骤并调用工具 |
| **Workflow** | 流程设计   | 流程怎么固定执行         | 预先设计好的固定流程               |
| **Tool**     | 能力组件   | 系统具体能做什么动作     | 可调用的具体外部能力               |
| **MCP**      | 接入协议   | 这些能力怎么标准化接进来 | 让能力标准化接入的协议层           |

**它们之间的关系**：

- **Agent 和 RAG**：不相等，但 Agent 可以把 RAG 当工具
- **Agent 和 Workflow**：一个动态决策、一个固定流程，实际系统常混合
- **Agent 和 Tool**：Tool 是 Agent 做事的手脚，没有它 Agent 只能「说」
- **Tool 和 MCP**：Tool 是具体能力，MCP 是接入这些能力的协议标准
- **RAG 和 Tool**：在 Agent 系统里，RAG 常被包装成一个 Tool

**判断速查**：

- 问「知识从哪里来？」→ 在谈 **RAG**
- 问「任务怎么自己一步步完成？」→ 在谈 **Agent**
- 问「步骤是不是提前写死？」→ 在谈 **Workflow**
- 问「系统能调什么能力？」→ 在谈 **Tool**
- 问「这些能力怎么统一接给模型？」→ 在谈 **MCP**

**四个常见误区**：

1. ❌「RAG 就是 Agent」——RAG 是方法，Agent 是系统形态
2. ❌「自动化流程就是 Agent」——固定步骤更可能只是 Workflow
3. ❌「MCP 就是工具」——MCP 更像工具接入协议
4. ❌「工具越多越是好 Agent」——工具太多反而让决策混乱

压缩记忆：

> **RAG 管知识，Agent 管决策，Workflow 管固定流程，Tool 管行动能力，MCP 管接入标准。**

---

# 第二部分 · LangChain.js v1 实战

## 10. v1 的核心 API：`createAgent`

> ⚠️ **最重要的新旧差异**：
>
> - ✅ v1 用 **`createAgent`**（从 `langchain` 主包导出）
> - ❌ **不要用** `initializeAgentExecutorWithOptions` / `AgentExecutor` —— 已废弃
>
> `createAgent` 内部基于 LangGraph 实现，自带 ReAct 循环、状态管理、记忆能力。

## 11. 定义工具（Tool）

工具 = 一个带「名字 + 说明 + 参数 schema + 执行函数」的函数。模型靠 **description** 和 **参数描述** 来判断何时调用、怎么传参，所以这两处要写清楚。

```ts
import { tool } from "langchain";
import { z } from "zod";

const getWeather = tool(
  // 执行函数：真正干活的地方
  async ({ city }) => {
    // 真实项目里这里会调天气 API，这里写死演示
    const data: Record<string, number> = { 北京: 32, 上海: 28, 广州: 35 };
    const temp = data[city];
    return temp !== undefined
      ? `${city}当前气温 ${temp}°C`
      : `查不到 ${city} 的天气`;
  },
  // 元信息：模型读这些来决定调不调用
  {
    name: "get_weather",
    description: "查询某个城市的当前气温。需要城市名时调用。",
    schema: z.object({
      city: z.string().describe("城市名，例如：北京"),
    }),
  },
);

const calculator = tool(
  async ({ a, b, op }) => {
    const r = op === "add" ? a + b : a - b;
    return `计算结果：${r}`;
  },
  {
    name: "calculator",
    description: "做加法或减法运算。",
    schema: z.object({
      a: z.number(),
      b: z.number(),
      op: z.enum(["add", "subtract"]).describe("add 加法，subtract 减法"),
    }),
  },
);
```

> `zod` 是 v1 的标准 schema 库（已是 v4）。`.describe()` 写的说明会传给模型，务必写清楚每个参数含义——这直接决定第 8 章「选错工具」的坑会不会踩。

## 12. 创建并运行 Agent

```ts
import { createAgent } from "langchain";
import { ChatOpenAI } from "@langchain/openai";

// 走第三方接口：llm 必须传「模型实例」，不能用 "openai:gpt-4o" 字符串
// （字符串形式没法指定 baseURL）
const llm = new ChatOpenAI({
  model: process.env.CHAT_MODEL ?? "deepseek-chat",
  temperature: 0,
  apiKey: process.env.OPENAI_API_KEY,
  configuration: { baseURL: process.env.OPENAI_BASE_URL },
});

const agent = createAgent({
  llm, // 传配置好的模型实例
  tools: [getWeather, calculator],
  // 可选：系统提示，定义 agent 的角色和行为准则
  prompt: "你是一个严谨的助手，需要数据时调用工具，不要凭空猜测数值。",
});

const result = await agent.invoke({
  messages: [{ role: "user", content: "北京今天比上海热多少度？" }],
});

// 最终答案是 messages 数组的最后一条
const messages = result.messages;
console.log(messages[messages.length - 1].content);
// → 模型会：调 get_weather(北京)=32 → 调 get_weather(上海)=28 → 调 calculator(32,28,subtract)=4 → "北京比上海热 4°C"
```

> 注意参数名是 **`llm`**（不是老版本的 `model`），另一个是 `tools`。这点实测自 v1 类型定义确认。

## 13. 看清 Agent 的思考过程

`result.messages` 完整记录了整个 ReAct 循环。打印出来能看到模型每一步在干嘛：

```ts
for (const m of result.messages) {
  const role = m.getType(); // "human" | "ai" | "tool"
  if (role === "ai" && m.tool_calls?.length) {
    // 模型决定调用工具
    m.tool_calls.forEach((tc) =>
      console.log(`🤖 决定调用 ${tc.name}(${JSON.stringify(tc.args)})`),
    );
  } else if (role === "tool") {
    console.log(`🔧 工具返回：${m.content}`);
  } else if (role === "ai") {
    console.log(`✅ 最终答案：${m.content}`);
  }
}
```

典型输出：

```
🤖 决定调用 get_weather({"city":"北京"})
🔧 工具返回：北京当前气温 32°C
🤖 决定调用 get_weather({"city":"上海"})
🔧 工具返回：上海当前气温 28°C
🤖 决定调用 calculator({"a":32,"b":28,"op":"subtract"})
🔧 工具返回：计算结果：4
✅ 最终答案：北京今天比上海热 4°C。
```

> 这就是第 8 章说的「可观察性」在代码里的落地——逐条打印，能直接看出是选错工具、还是没用好工具结果、还是循环停不下来。

## 14. 给 Agent 加记忆（多轮对话）

默认每次 `invoke` 互相独立。要让 Agent 记住上下文，用 LangGraph 的 **checkpointer**。

> ⚠️ **不要用**废弃的 `BufferMemory` / `ConversationChain`。v1 的记忆机制是 checkpointer + `thread_id`。

```ts
import { createAgent } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { MemorySaver } from "@langchain/langgraph";

const checkpointer = new MemorySaver(); // 内存版，学习用

const llm = new ChatOpenAI({
  model: process.env.CHAT_MODEL ?? "deepseek-chat",
  temperature: 0,
  apiKey: process.env.OPENAI_API_KEY,
  configuration: { baseURL: process.env.OPENAI_BASE_URL },
});

const agent = createAgent({
  llm,
  tools: [getWeather],
  checkpointer, // 挂上记忆
});

// 用同一个 thread_id 的对话会共享记忆
const config = { configurable: { thread_id: "user-123" } };

await agent.invoke(
  { messages: [{ role: "user", content: "北京天气怎么样？" }] },
  config,
);

const followUp = await agent.invoke(
  { messages: [{ role: "user", content: "那比广州呢？" }] }, // "那" 指代上文
  config,
);

const msgs = followUp.messages;
console.log(msgs[msgs.length - 1].content);
// Agent 记得上一句问的是北京，能正确对比
```

- `thread_id` 相同 → 同一会话，共享历史
- `thread_id` 不同 → 互不干扰的独立会话
- 生产环境把 `MemorySaver` 换成持久化版（如 `@langchain/langgraph-checkpoint-postgres`），代码结构不变

## 15. 把 RAG 变成 Agent 的工具（Agentic RAG）

这是概念第 1、7、9 章反复强调的落地点。把 RAG 检索包装成一个工具，Agent 就能**自己判断**「这个问题要不要查知识库」。

```ts
import { tool, createAgent } from "langchain";
import { z } from "zod";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

// 第三方接口：聊天模型 + embedding 都指向 baseURL
const llm = new ChatOpenAI({
  model: process.env.CHAT_MODEL ?? "deepseek-chat",
  temperature: 0,
  apiKey: process.env.OPENAI_API_KEY,
  configuration: { baseURL: process.env.OPENAI_BASE_URL },
});

// --- 先建好知识库（同 RAG.md）---
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 120,
  chunkOverlap: 20,
});
const docs = await splitter.createDocuments([
  "本公司年假政策：入职满一年享 10 天年假，满三年享 15 天。年假需提前 3 天申请。",
]);
const store = await MemoryVectorStore.fromDocuments(
  docs,
  new OpenAIEmbeddings({
    model: process.env.EMBEDDING_MODEL ?? "text-embedding-3-small",
    apiKey: process.env.OPENAI_API_KEY,
    configuration: { baseURL: process.env.OPENAI_BASE_URL },
  }),
);
const retriever = store.asRetriever({ k: 2 });

// --- 把检索包装成工具 ---
const searchHandbook = tool(
  async ({ query }) => {
    const found = await retriever.invoke(query);
    return found.map((d) => d.pageContent).join("\n\n") || "未找到相关内容";
  },
  {
    name: "search_employee_handbook",
    description: "查询公司员工手册，涉及年假、福利、规章制度等问题时调用。",
    schema: z.object({
      query: z.string().describe("要查询的问题"),
    }),
  },
);

// --- Agent 同时拥有 RAG 工具和天气工具，自主选择 ---
const agent = createAgent({
  llm,
  tools: [searchHandbook, getWeather], // getWeather 复用前面定义的
  prompt: "你是公司助手。涉及公司制度的问题，务必先查员工手册再回答。",
});

const r1 = await agent.invoke({
  messages: [{ role: "user", content: "入职两年有多少天年假？" }],
});
// → Agent 自己调用 search_employee_handbook，基于手册回答 "10 天"

const r2 = await agent.invoke({
  messages: [{ role: "user", content: "北京天气如何？" }],
});
// → Agent 判断这与手册无关，改调 get_weather
```

**这就是 RAG 和 Agent 的关系落地**：RAG 是 Agent 工具箱里的一件工具，Agent 是决策者。

## 16. 完整可运行示例

```ts
// src/03-agent.ts
import { createAgent, tool } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { MemorySaver } from "@langchain/langgraph";
import { z } from "zod";

const getWeather = tool(
  async ({ city }) => {
    const data: Record<string, number> = { 北京: 32, 上海: 28, 广州: 35 };
    const t = data[city];
    return t !== undefined ? `${city}当前气温 ${t}°C` : `查不到${city}`;
  },
  {
    name: "get_weather",
    description: "查询城市当前气温",
    schema: z.object({ city: z.string().describe("城市名") }),
  },
);

async function main() {
  const llm = new ChatOpenAI({
    model: process.env.CHAT_MODEL ?? "deepseek-chat",
    temperature: 0,
    apiKey: process.env.OPENAI_API_KEY,
    configuration: { baseURL: process.env.OPENAI_BASE_URL },
  });

  const agent = createAgent({
    llm,
    tools: [getWeather],
    prompt: "你是天气助手，需要气温数据时调用工具。",
    checkpointer: new MemorySaver(),
  });

  const config = { configurable: { thread_id: "demo-1" } };

  const r1 = await agent.invoke(
    { messages: [{ role: "user", content: "北京和广州哪个更热？" }] },
    config,
  );
  console.log("A1:", r1.messages.at(-1)?.content);

  const r2 = await agent.invoke(
    { messages: [{ role: "user", content: "那上海呢？和刚才说的城市比" }] },
    config,
  );
  console.log("A2:", r2.messages.at(-1)?.content);
}

main();
```

运行：`npx tsx src/03-agent.ts`

## 17. Agent vs 固定链：什么时候用哪个

|           | 固定链（LCEL/RAG） | Agent                    |
| --------- | ------------------ | ------------------------ |
| 流程      | 写死，可预测       | 模型动态决定             |
| 速度/成本 | 快、便宜           | 慢、贵（多次调模型）     |
| 适用      | 步骤明确的任务     | 需要多步推理、动态选工具 |
| 调试      | 容易               | 较难（路径不固定）       |

> **经验法则**：能用固定链解决的，别上 Agent。Agent 强大但更慢更贵更难调试。先问自己「步骤是否固定」——固定就用 RAG 那样的链，不固定才用 Agent。（这正是第 8 章「坑 4：该用 Workflow 却硬上 Agent」的工程版。）

---

## 速记卡（背这些句子就够）

- `Agent = 为完成目标，自己决定步骤并调用工具`
- `Agent 管决策`
- `普通模型偏单次回答，Agent 偏多步执行`
- `最小 Agent = 目标 + 模型 + 工具 + 循环 + 输出`
- `核心循环：判断 → 行动 → 观察 → 再判断（ReAct）`
- `工具负责行动，模型负责思考`
- `没有工具的 Agent 只能「说」，不能「做」`
- `Workflow = 人定流程；Agent = 模型定下一步`
- `自动化 ≠ Agent`
- `Tool = 具体能力；MCP = 接入标准（电器 vs 插座）`
- `RAG 可以是 Agent 的一个工具（Agentic RAG）`
- `Agent 最大问题是稳定执行，不只是回答`
- `不要把「会思考」误解成「会稳定执行」`
- `完成条件要明确，否则循环停不下来`
- `能用 Workflow / 固定链解决的，就不要先上 Agent`
- `v1 用 createAgent，参数是 llm + tools，不用 AgentExecutor`
- `记忆用 checkpointer + thread_id，不用 BufferMemory`

## 术语表

| 术语                  | 一句话解释                                                |
| --------------------- | --------------------------------------------------------- |
| Agent                 | 为完成目标、自己决定步骤并调用工具的系统                  |
| Tool（工具）          | Agent 可调用的具体外部能力（读文件、搜网页、调 RAG 等）   |
| 决策循环              | 判断→行动→观察→再判断的多步推进过程                       |
| ReAct                 | Reasoning + Acting，Agent 的思考→行动→观察→再思考循环     |
| Workflow              | 预先设计好的固定流程                                      |
| MCP                   | Model Context Protocol，让能力标准化接入模型/Agent 的协议 |
| 完成条件              | 判断任务何时算「做完」的标准，缺它循环会停不下来          |
| 单工具 / 多工具 Agent | 按可用工具数量区分的 Agent 形态                           |
| 混合模式              | 固定流程外壳里嵌入一段 Agent 动态决策                     |
| createAgent           | v1 创建 Agent 的核心 API，内部基于 LangGraph              |
| checkpointer          | v1 的记忆机制，配合 thread_id 实现多轮对话                |

---

## 进阶方向

掌握本文后可继续深入：LangGraph 自定义工作流、流式输出（streaming）、结构化输出（structured output）、生产级向量库与持久化记忆、多 Agent 协作。
