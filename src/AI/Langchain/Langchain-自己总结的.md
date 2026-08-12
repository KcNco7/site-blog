# LangChain

::: info 版本基线

本文主要使用 **TypeScript / JavaScript**，已按 **2026-08-12** 的公开版本和官方文档核对：

- `langchain@1.5.4`
- `@langchain/core@1.2.3`
- `@langchain/openai@1.5.5`
- `@langchain/langgraph@1.4.8`
- Node.js `20+`

LangChain 各包独立发布，具体最新版仍应以 npm 和当前官方文档为准。安装多个 LangChain 包时，要确保它们解析到兼容的同一份 `@langchain/core`。

本文主要示例至少会用到：

```bash
pnpm add langchain @langchain/core @langchain/openai @langchain/langgraph zod dotenv
```

RAG 小节还会按需安装 `@langchain/classic`、`@langchain/textsplitters`、Loader 或具体 Vector Store 的集成包。不要强行让所有 LangChain 包使用相同版本号；让包管理器检查 peer dependencies，并提交 lockfile。

本文使用以下 VitePress 标记：

- `danger`：当前 API/包已明确弃用、正在 sunset，或存在严重迁移风险；新代码不要使用。
- `warning`：目前还能使用，但已不是新项目的优先写法，或存在版本兼容风险。
- `tip`：面对当前版本时优先采用的写法。

- [LangChain npm](https://www.npmjs.com/package/langchain)
- [LangChain v1 迁移指南](https://docs.langchain.com/oss/javascript/migrate/langchain-v1)

:::

## LangChain介绍

::: tip 什么是 LangChain？

> 提问: 公司年假制度是什么？

如果只把问题交给模型，它可能缺少公司的私有资料。下面是一个用 LangChain 组件编排的 RAG（检索增强生成）例子：

1. LangChain 收到问题
2. 去公司 PDF 文档里检索“年假制度”
3. 找到相关段落
4. 把段落和问题一起发给大模型
5. 要求大模型只能基于资料回答
6. 返回答案和来源

LangChain 负责自动化流程，大模型负责理解和生成答案。你学LangChain，本质是在学: 如何用程序控制大模型完成真实任务。

> 这只是 LangChain 的一种用途。LangChain 不等于知识库，也不等于 RAG；它是模型、消息、工具、Agent、检索和 Middleware 等组件的应用框架。

:::

LangChain 生态包含多个职责不同的项目：

- `LangChain`：提供模型、消息、Prompt、工具、Agent 和检索等应用组件；支持多个提供商，但切换时仍需安装对应集成并适配模型能力与参数。
- `LangGraph`：LangChain Agent 底层使用的图运行时，也可直接用于状态、流程控制、持久化和人机协同。
- `Deep Agents`：基于 LangChain 与 LangGraph 的高层 Agent harness，加入规划、文件系统、子 Agent 等能力。
- `LangSmith`：独立的可观测、评估与部署平台，可用于 LangChain/LangGraph 应用，但不是 LangChain 运行时的一部分。

当前学习时更适合按以下核心能力理解 LangChain：

- Models / Messages：调用模型并表达消息
- Prompts：模板化构造提示词和消息
- Tools / Agents：声明工具并让 Agent 编排模型与工具调用
- Retrieval：文档、切分、Embedding、向量存储与检索器
- Runnables / LCEL：组合可执行组件
- Middleware / Memory：控制 Agent 上下文和短期、长期状态

::: tip 三种入口怎么选

- 步骤固定、结果可预测：普通 TypeScript 或 Runnable/LCEL。
- 让模型在工具之间动态选择：`createAgent`。
- 需要显式节点、分支、循环、暂停和恢复：直接使用 LangGraph。

:::

## Agent工作机制

An AI agent is a system that uses an LLM to decide the control flow of an application. (Agent是一种使用大语言模型（LLM）来决定应用程序控制流的系统。)

| 特性     | 传统聊天机器人 / LLM       | AI Agent                       |
| -------- | -------------------------- | ------------------------------ |
| 交互模式 | 通常按输入生成响应         | 可在受控循环中决定后续步骤     |
| 执行力   | 可生成文本或结构化工具调用 | 在应用授权的工具范围内执行动作 |
| 自主性   | 由调用方编排流程           | 可在迭代、权限和审批边界内规划 |

传统LLM:
![LLM](/assert/image-langchain/LLM.png)
Agent模式:
![agent](/assert/image-langchain/agent.png)

具体流程如下：

1. 用户提问（Input）：杭州今天天气如何？
2. 模型决策（Decision）：模型返回结构化 `tool_call`，例如工具名 `get_weather`、参数 `{ city: "杭州" }`
3. Agent 执行（Action）：运行时校验参数并执行已注册的 `get_weather`
4. 工具结果（Observation）：运行时把结果封装为 `ToolMessage` 交回模型；模型判断是否足以回答
   - 是：整理生成响应结果
   - 否：重复前面步骤
5. 生成结果（Output）：根据工具的结果生成响应给用户

::: warning 不要解析“思维链”控制程序

程序应依赖 `tool_calls`、消息、状态和事件流等结构化数据，而不是从模型自然语言中的“分析过程”猜测下一步动作。

:::

> 模型是如何知道工具的信息的呢？

在大模型提供的API接口中，有一个tools参数，描述了工具的详细信息. `LangChain`会帮助我们**把`tool`的信息封装为此`tool`参数，与`message`一起发送给大模型**，大模型就了解`tool`的详细信息，根据用户需求判断是否需要调用`tool`，需要调用哪个`tool`.

> 当大模型决定调用某个tool时，该如何调用呢？

模型服务不会直接执行本地函数，而是返回结构化的工具调用请求。现代 LangChain `AIMessage` 会把这些请求规范化到 `tool_calls` 等字段，而不是要求应用从普通 JSON 字符串中自行猜测。Agent 运行时校验参数、调用已注册工具，再把 `ToolMessage` 结果交回模型继续判断。

::: warning Tool schema 不是安全边界

Zod schema 负责输入形状校验；工具实现仍必须自己处理鉴权、权限控制、超时、限额、幂等和业务校验。

:::

![Langchain的主要的工作流程](/assert/image-langchain/Langchain的主要的工作流程.png)

Agent中最重要的两个部分，就是：

- Model：负责推理分析、思考，相当于Agent的大脑
- Tools：负责执行任务，相当于Agent与外界交互的手脚

## 模型

LangChain支持现在市面上大部分的大语言模型（LLM），并且提供了统一的模型调用接口。使您可以轻松访问许多不同的模型提供者，并且在模型之间进行试验和切换也变得很容易。

### OpenAI 兼容接口方式

这里的“OpenAI 兼容接口方式”指的是：使用 OpenAI 风格的 API 协议访问模型。

- 使用的是 `@langchain/openai` 或 `model_provider="openai"` 这一套调用方式
- 底层访问的模型不一定是 OpenAI 自家的模型，也可以是阿里云 DashScope、硅基流动等提供的 OpenAI 兼容接口

直接调用模型时：

- `invoke()` 返回的是单条模型消息
- `stream()` 返回的是模型消息分片

```ts
import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`缺少环境变量：${name}`);
  return value;
}

// 初始化模型
const model = new ChatOpenAI({
  model: "qwen-plus",
  apiKey: requireEnv("DASHSCOPE_API_KEY"),
  configuration: {
    baseURL: requireEnv("DASHSCOPE_BASE_URL"),
  },
  temperature: 0.7,
});

// 访问模型
async function main() {
  // 非流式调用：一次性返回完整结果
  const response = await model.invoke("你是谁?");
  console.log(response.text); // AIMessage.text 是统一的纯文本视图

  // 流式调用：逐步返回 AIMessageChunk
  const stream = await model.stream("你是谁?");
  for await (const chunk of stream) {
    // 推荐使用 text；content 有时可能是更复杂的内容结构
    process.stdout.write(chunk.text);
  }
}

main();
```

```python
import os
from dotenv import load_dotenv
load_dotenv() # 读取环境变量

from langchain.chat_models import init_chat_model

base_url = os.getenv('DASHSCOPE_BASE_URL')
api_key = os.getenv('DASHSCOPE_API_KEY')

# 初始化模型
model = init_chat_model(
    model='qwen3.5-flash',
    model_provider='openai', # 使用 OpenAI 兼容接口
    api_key=api_key,
    base_url=base_url,
)

# 非流式调用：一次性返回完整结果
response = model.invoke("你是谁?")
print(response.content)

# 流式调用
stream = model.stream("你是谁?")
for chunk in stream:
    print(chunk.content, end='',flush=True)
```

不同模型提供商通常通过独立集成包接入。JavaScript 支持的模型请查看：[LangChain JavaScript Chat Model 集成](https://docs.langchain.com/oss/javascript/integrations/chat)。

::: warning OpenAI 兼容不等于能力完全一致

第三方服务虽然采用 OpenAI 兼容协议，但不保证完整支持工具调用、结构化输出、多模态、流式事件和 usage metadata。接入后应分别验证项目真正需要的能力。

本文为突出 LangChain API，后续较短示例有时会直接写 `process.env.DASHSCOPE_API_KEY`。真实项目应统一使用前面 `requireEnv()` 这类启动时校验；不要把缺失配置留到第一次模型请求才发现。

:::

### 在Agent中使用模型

上述代码是直接调用模型，而不是通过智能体调用模型。当前高层 Agent 的推荐入口是 `createAgent`；如果需要完全自定义控制流，也可以手写工具循环或直接使用 LangGraph `StateGraph`。

LangChain 提供了一个 `createAgent` 用来快速创建智能体。当我们创建 Agent 的时候，可以直接传入已经初始化好的 `model`，也可以指定模型名，让 LangChain 自动初始化模型。

和直接调用模型相比，Agent 调用最重要的区别是：

- `model.invoke(...)` 返回的是单条 `AIMessage`
- `agent.invoke(...)` 返回的是一个包含 `messages` 的状态对象
- 最终回答通常在 `response.messages` 的最后一条
- 即使 `tools: []`，Agent 仍然走的是智能体执行流程，因此返回结构和直接调模型不同

如果两边使用的是同一个底层模型、相同参数、并且 Agent 没有工具，那么最终回答通常会比较接近，但不保证逐字一致。

```ts
import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { createAgent } from "langchain";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`缺少环境变量：${name}`);
  return value;
}

// 初始化模型
const model = new ChatOpenAI({
  model: "qwen-plus",
  apiKey: requireEnv("DASHSCOPE_API_KEY"),
  configuration: {
    baseURL: requireEnv("DASHSCOPE_BASE_URL"),
  },
});

async function main() {
  // 创建 Agent（不带工具的简单版本）
  const agent = createAgent({
    // 使用已经创建好的模型
    model,
    tools: [], // 可以在这里添加工具
  });

  // 调用 Agent
  // invoke 非流式调用：返回的是 Agent 状态，而不是单条 AIMessage
  const response = await agent.invoke({
    messages: [{ role: "user", content: "你是谁？" }],
  });

  console.log(response);
  // 获取最终回答
  const finalMessage = response.messages.at(-1);
  if (!finalMessage) {
    throw new Error("Agent 没有返回消息");
  }
  console.log("\n最终回答:", finalMessage.text);
}

main().catch(console.error);
```

```python
import os
from dotenv import load_dotenv
load_dotenv() # 读取环境变量

from langchain.chat_models import init_chat_model
from langchain.agents import create_agent
base_url = os.getenv('DASHSCOPE_BASE_URL')
api_key = os.getenv('DASHSCOPE_API_KEY')

model = init_chat_model(
    model='qwen3.5-flash',
    model_provider='openai',
    api_key=api_key,
    base_url=base_url,
)
agent = create_agent(model=model)

response = agent.invoke({
    "messages":[{"role":"user","content":"你是谁?"}]
})
print(response)
print(response["messages"][-1].content)
```

如果使用流式输出，需要注意：Agent 的流式接口和直接调用模型不同。

- 直接调用模型时，流里拿到的是消息分片
- 调用 Agent 时，`stream_mode="messages"` 返回的是 `(token, metadata)`

```ts
const stream = await agent.stream(
  {
    messages: [{ role: "user", content: "你是谁？" }],
  },
  {
    streamMode: "messages",
  },
);

for await (const [token] of stream) {
  if (token.text) {
    process.stdout.write(token.text);
  }
}
```

::: tip Agent 的流式接口怎么选

- `streamMode: "messages"`：显示模型 token；
- `streamMode: "updates"`：显示模型调用、工具执行等步骤更新；
- `streamMode: "custom"`：显示工具或节点主动发送的自定义进度；
- 构建复杂前端事件流时，可以进一步了解 `streamEvents(..., { version: "v3" })`；但 1.5.x Reference 仍将 v3 标为实验性，不能把事件形状当作稳定协议长期依赖。

[当前 Streaming 文档](https://docs.langchain.com/oss/javascript/langchain/streaming)

:::

```python
response = agent.stream({
    "messages":[{"role":"user","content":"你是谁?"}] ,
},stream_mode="messages")
for token,metadata in response:
    if token.content:
        print(token.content,end='',flush=True)
```

可以把两者简单理解为：

- 直接调模型：返回“模型给你的一条回答”
- 调用 Agent：返回“智能体这次执行过程的状态，最终回答只是其中的一部分”

---

## 消息（Messages）

在调用模型时，发送给 LLM 的消息和 LLM 返回的消息通常包含以下几部分内容：

- `role`：常见角色包括 `system`、`user`、`assistant` 和 `tool`，也可能存在提供商或应用自定义角色
- `content`：消息的内容
- 消息 ID、`response_metadata`、`usage_metadata` 等是不同字段；token 用量通常位于 `usage_metadata`，且是否存在取决于提供商返回的数据，不应统一笼统称为 `metadata`

### 消息类型

- SystemMessage: role是system，代表系统消息，用于设定模型角色和交互背景
- HumanMessage: role是user，代表用户输入的消息
- AIMessage: role是assistant，代表LLM生成的响应，包含：文本、工具调用、元数据
- ToolMessage: role是tool，代表工具调用时产生的结果

### 消息的使用

定义工具时，当前官方文档推荐使用 `tool(...)`：

```ts
import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { createAgent, tool } from "langchain";
import * as z from "zod";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`缺少环境变量：${name}`);
  }
  return value;
}

const getWeatherTool = tool(
  async ({ city }) => {
    // 教学示例使用假数据；真实项目在这里调用天气 API。
    return `${city} 当前天气晴朗`;
  },
  {
    name: "get_weather",
    description: "查询指定城市的当前天气",
    schema: z.object({
      city: z.string().trim().min(1).describe("城市名称，例如：广州"),
    }),
  },
);

const model = new ChatOpenAI({
  model: process.env.DASHSCOPE_MODEL ?? "qwen-plus",
  apiKey: requireEnv("DASHSCOPE_API_KEY"),
  configuration: {
    baseURL: requireEnv("DASHSCOPE_BASE_URL"),
  },
});

async function main() {
  const agent = createAgent({
    model,
    tools: [getWeatherTool],
    prompt: "需要实时天气时必须调用 get_weather，不要编造天气。",
  });

  const response = await agent.invoke({
    messages: [{ role: "user", content: "今天广州天气如何？" }],
  });

  console.log("\n=== 完整对话历史 ===\n");
  for (const message of response.messages) {
    console.log(`[${message.type}] ${message.text}`);
    if ("tool_calls" in message) {
      console.log("工具调用：", message.tool_calls);
    }
    console.log("---");
  }
}

main().catch(console.error);
```

::: danger 已弃用：`message._getType()`

`BaseMessage._getType()` 在当前 `@langchain/core` 中已经标记为 deprecated。新代码读取 `message.type`：

```ts
console.log(message.type);
```

[BaseMessage 当前 API](https://reference.langchain.com/javascript/langchain-core/messages/BaseMessage)

:::

```python
import os

from dotenv import load_dotenv
from langchain.tools import tool
from langchain_core.messages import SystemMessage,HumanMessage,AIMessage

load_dotenv() # 读取环境变量

from langchain.chat_models import init_chat_model
from langchain.agents import create_agent
base_url = os.getenv('DASHSCOPE_BASE_URL')
api_key = os.getenv('DASHSCOPE_API_KEY')

# 建立一个方法
@tool
def get_weather(local:str)-> str:
    """
    Get weather data
    :param local: city
    :return:
    """
    return f"Current weather in {local} is sunny"

model = init_chat_model(
    model='qwen3.5-plus',
    model_provider='openai',
    api_key=api_key,
    base_url=base_url,
)
agent = create_agent(model=model,tools=[get_weather])

response = agent.invoke({
    "messages":[
        SystemMessage("请使用工具获取天气"),
        HumanMessage("你好我是小爱同学"),
        AIMessage("你好,小爱同学!很高兴认识你"),
        HumanMessage("今天广州天气如何?"),
    ] ,
})
for message in response["messages"]:
    message.pretty_print()
```

## 多模态

LangChain 消息可以使用标准内容块表达文本、图片等多模态输入；最终支持哪些内容类型、文件格式和大小，仍由具体模型提供商决定。

```ts
import { HumanMessage } from "@langchain/core/messages";

const message = new HumanMessage({
  contentBlocks: [
    { type: "text", text: "请描述这张图片。" },
    { type: "image", url: "https://example.com/image.jpg" },
  ],
});

const response = await model.invoke([message]);
console.log(response.text);
```

::: warning “OpenAI 兼容”不代表多模态能力完全兼容

发送前仍要核对模型是否支持该内容块、URL 是否能被服务访问、MIME 类型和大小限制，以及外部图片的隐私风险。

:::

## 提示词（Prompts）

### 系统提示词

::: danger JavaScript 1.5.x：`systemPrompt` 已弃用

当前 JavaScript API Reference 已将 `CreateAgentParams.systemPrompt` 标为 deprecated。新代码使用 `prompt`。部分较早的 v1 指南页面还没有完全同步，仍可能看到 `systemPrompt`；Python 的 `system_prompt` 是另一套 API，不受这一项影响。

- [createAgent API Reference](https://reference.langchain.com/javascript/langchain/index/createAgent)
- [CreateAgentParams API Reference](https://reference.langchain.com/javascript/langchain/index/CreateAgentParams)

:::

```ts
import { createAgent } from "langchain";

const agent = createAgent({
  model,
  tools: [],
  prompt: "像海盗一样说话。",
});

for await (const [token] of await agent.stream(
  {
    messages: [{ role: "user", content: "你是谁？" }],
  },
  {
    streamMode: "messages",
  },
)) {
  process.stdout.write(token.text);
}
```

#### 动态系统提示词与运行时 Context

提示词依赖本次调用的用户级别、语言或租户信息时，可以声明 `contextSchema`，再让 `prompt` 根据只读 context 动态生成。Context 只属于本次 `invoke()`，不会被 checkpointer 持久化。

```ts
import { createAgent } from "langchain";
import * as z from "zod";

const TutorContext = z.object({
  level: z.enum(["beginner", "advanced"]),
});

const tutor = createAgent({
  model,
  tools: [],
  contextSchema: TutorContext,
  prompt: (_state, runtime) =>
    `你是中文编程老师。学生水平：${runtime.context.level}。`,
});

await tutor.invoke(
  {
    messages: [{ role: "user", content: "解释 Promise。" }],
  },
  {
    context: { level: "beginner" },
  },
);
```

[Runtime 与 Context](https://docs.langchain.com/oss/javascript/langchain/runtime)

python版本:

```python
from langchain.agents import create_agent
from langchain.messages import HumanMessage

# 创建智能体
agent = create_agent(
    model=model,
    system_prompt="像海盗一样说话."
)

for token, metadata in agent.stream(
    {"messages": [HumanMessage(content="你是谁？")]},
    stream_mode="messages"
):
    print(token.content, end="", flush=True)
```

### 通用提示词模板（PromptTemplate）

提示词设计在模型应用中非常重要。`PromptTemplate` 负责模板化和变量注入，使提示词可复用；它不会自动判断或“优化”提示词质量。

```ts
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import "dotenv/config";

// 创建模型
const llm = new ChatOpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  configuration: {
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  },
  model: "qwen-plus",
});

async function name() {
  // 提示词
  const promptTemplate = PromptTemplate.fromTemplate(
    "我的朋友姓{lastname}, 刚刚生了一个{gender}, 你帮我起一个名字,简单回答",
  );

  // 串联链 (可以串联多个)
  const chain = promptTemplate.pipe(llm);

  const res = await chain.invoke({
    lastname: "高",
    gender: "女儿",
  });

  console.log(res.text);
}

name();
```

### Few-shot提示词模板

`FewShotPromptTemplate` 的配置取决于示例来源和模板需求。下面示例使用 `examplePrompt`、`examples`、`prefix`、`suffix` 和 `inputVariables`，但这不是所有用法都固定必填的五项清单。

```ts
import { ChatOpenAI } from "@langchain/openai";
import { FewShotPromptTemplate, PromptTemplate } from "@langchain/core/prompts";
import "dotenv/config";

// 创建示例数据模板
const exampleTemplate = PromptTemplate.fromTemplate(
  "单词{word}, 反义词是{antonym}",
);

// 创建示例数据
const examples = [
  { word: "good", antonym: "bad" },
  { word: "big", antonym: "small" },
];

// 创建 few-shot 模板
const fewShotPromptTemplate = new FewShotPromptTemplate({
  examplePrompt: exampleTemplate, // 示例数据模板
  examples, // 示例数据
  prefix: "给出给定词的反义词，有如下示例:", // 示例之前的提示词
  suffix: "基于示例告诉我: {inputword}的反义词是?", // 示例之后的提示词
  inputVariables: ["inputword"], // 声明在前缀或者后缀中所需要注入的变量名
});

// 得到提示词
const promptText = await fewShotPromptTemplate.invoke({ inputword: "left" });
console.log(promptText.toString());

// 访问模型
const model = new ChatOpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  configuration: {
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  },
  model: "qwen-plus",
});
const response = await model.invoke(promptText);
console.log(response.text);
```

### 模板类的格式化方法与 Runnable 方法

| 调用                                                                   | 返回值                   | 适合用途                                  |
| ---------------------------------------------------------------------- | ------------------------ | ----------------------------------------- |
| `PromptTemplate.format(input)` / `FewShotPromptTemplate.format(input)` | `Promise<string>`        | 查看最终字符串                            |
| `ChatPromptTemplate.format(input)`                                     | `Promise<string>`        | 查看聊天 Prompt 的字符串表示              |
| `ChatPromptTemplate.formatMessages(input)`                             | `Promise<BaseMessage[]>` | 直接检查格式化后的角色消息                |
| 任意 Prompt 的 `.invoke(input)`                                        | `Promise<PromptValue>`   | 走统一 Runnable 接口，继续 `.pipe(model)` |

`PromptTemplate.invoke()` 返回 `StringPromptValue`；`ChatPromptTemplate.invoke()` 返回 `ChatPromptValue`。两者都可以直接作为模型输入。

::: tip 学习公开接口，不要依赖内部继承层级

Prompt 实现 Runnable，因此可以使用 `invoke`、`batch`、`stream`、`pipe`、`withConfig` 等组合能力。内部继承链和对象完整快照可能随版本调整，不应成为业务代码依赖。

:::

```ts
import { FewShotPromptTemplate, PromptTemplate } from "@langchain/core/prompts";
const template = PromptTemplate.fromTemplate("我的邻居是{name},最喜欢{hobby}");
const res = await template.format({ name: "张大明", hobby: "看电影" });
console.log(res, typeof res); // 我的邻居是张大明,最喜欢看电影 string

const resInvoke = await template.invoke({ name: "李四", hobby: "吃饭" });
console.log(resInvoke.toString());
```

### ChatPromptTemplate

- `PromptTemplate`:通用提示词模板，支持动态注入信息。
- `FewShotPromptTemplate`:支持基于模板注入任意数量的示例信息。
- `ChatPromptTemplate`：构造由多条消息组成的聊天提示词。
- `MessagesPlaceholder`：把一组消息注入模板；这组消息可以是历史对话，也可以是其他预先构造的消息。

::: warning `MessagesPlaceholder` 不是 Memory

它只负责插入**本次调用传进来的消息**，不会自己保存历史。跨请求记忆需要 Agent checkpointer；跨 thread 的长期资料使用 Store。

:::

```ts
import { ChatOpenAI } from "@langchain/openai";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import "dotenv/config";

// 使用 LangChain 的 ChatOpenAI
const model = new ChatOpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  model: "qwen-plus",
  configuration: {
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  },
});

// 创建模板并赋值
const chatPrompt = ChatPromptTemplate.fromMessages([
  ["system", "你是一个边塞诗人, 可以写唐诗"],
  new MessagesPlaceholder({ variableName: "history", optional: true }),
  ["human", "{question}"],
]);

const history = [
  new HumanMessage("请写一首唐诗。"),
  new AIMessage("床前明月光，疑是地上霜。举头望明月，低头思故乡。"),
];

const response = await chatPrompt.invoke({
  history,
  question: "再写一首。",
});

// console.log(response.toChatMessages());
// console.log("============================================================");
// // 输出一下组装的聊天消息
// console.log(response.toString());

// 上面都是组装提示词 这里才是调用模型
let res = await model.invoke(response);
console.log(res.text);
```

---

## LCEL链

### 链的基础用法

“将组件串联，让上一个组件的输出成为下一个组件的输入”是 LCEL 的核心。Python 常使用 `|` 运算符；TypeScript 使用 `.pipe()` 或 `RunnableSequence.from()`，不能直接照抄 Python 的 `|`。

在 TypeScript 中，LCEL 主要组合实现 Runnable 接口的对象；普通函数可以通过 `RunnableLambda` 适配，对象映射可以通过 `RunnableSequence` 等组合。`callable`、`Mapping` 和“子类对象”是 Python 语境的说法，不应直接套到 TypeScript 类型系统。

```ts
import { ChatOpenAI } from "@langchain/openai";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import "dotenv/config";

// 使用 LangChain 的 ChatOpenAI
const model = new ChatOpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  model: "qwen-plus",
  configuration: {
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  },
});

// 创建模板并赋值
const chatPrompt = ChatPromptTemplate.fromMessages([
  ["system", "你是一个边塞诗人, 可以写唐诗"],
  new MessagesPlaceholder("history"), // 使用history占位
  ["human", "请写一首唐诗"],
]);

// 传入
const history = [
  // 可以是空数组或历史消息
  new HumanMessage("你来写一首唐诗"),
  new AIMessage("床前明月光，疑是地上霜。举头望明月，低头思故乡。"),
  new HumanMessage("好诗，再来一个"),
  new AIMessage("锄禾日当午，汗滴禾下土。谁知盘中餐，粒粒皆辛苦。"),
];

// Python: chat_prompt_template | model
const chain = chatPrompt.pipe(model); // 组装后的链

console.log(chain.constructor.name);

// Python: res = chain.invoke({"history": history_data})
const res = await chain.invoke({
  history,
});

console.log(res.text);
console.log("==================");

// Python: for chunk in chain.stream(...)
const stream = await chain.stream({
  history,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.text);
  // process.stdout.write(...)把内容直接写到终端，不自动换行。
}
```

### StringOutputParser

`StringOutputParser` 的作用是把模型消息或流式消息分片转换为普通字符串，使链后面的代码不再处理 `AIMessage` 对象。

```ts
import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import "dotenv/config";

// 使用 LangChain 的 ChatOpenAI
const model = new ChatOpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  model: "qwen-plus",
  configuration: {
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  },
});

// 创建模板并赋值
const chatPrompt = ChatPromptTemplate.fromMessages([
  ["system", "你是一个边塞诗人, 可以写唐诗"],
  new MessagesPlaceholder("history"), // 使用history占位
  ["human", "请写一首唐诗"],
]);

// 传入
const history = [
  // 可以是空数组或历史消息
  new HumanMessage("你来写一首唐诗"),
  new AIMessage("床前明月光，疑是地上霜。举头望明月，低头思故乡。"),
  new HumanMessage("好诗，再来一个"),
  new AIMessage("锄禾日当午，汗滴禾下土。谁知盘中餐，粒粒皆辛苦。"),
];

// Python: chat_prompt_template | model
const chain = chatPrompt.pipe(model).pipe(new StringOutputParser()); // 组装后的链
console.log(chain.constructor.name);

// Python: res = chain.invoke({"history": history_data})
const res = await chain.invoke({
  history,
});

console.log(res); // 不再需要.content
console.log("==================");

// Python: for chunk in chain.stream(...)
const stream = await chain.stream({
  history,
});

for await (const chunk of stream) {
  process.stdout.write(String(chunk ?? "")); // 不再需要.content
  // process.stdout.write(...)把内容直接写到终端，不自动换行。
}
```

### 结构化输出与多模型链

::: warning `JsonOutputParser` 还能用，但不是当前首选

`JsonOutputParser` 只负责把合法 JSON 文本解析成 JavaScript 值；`JsonOutputParser<T>` 中的泛型只影响 TypeScript 静态类型，**不会在运行时验证**字段是否存在、类型是否正确。

当前推荐：

- 直接调用模型：`model.withStructuredOutput(zodSchema)`；
- Agent：`createAgent({ responseFormat: zodSchema })`，从 `result.structuredResponse` 读取；
- 只有模型不支持合适的结构化输出方式时，才退回“Prompt + JsonOutputParser + Zod.parse()”。

第三方 OpenAI 兼容模型是否支持 `jsonSchema`、`functionCalling` 或工具策略，要按具体模型实测。

- [Model structured output](https://docs.langchain.com/oss/javascript/langchain/models#structured-output)
- [Agent structured output](https://docs.langchain.com/oss/javascript/langchain/structured-output)

:::

#### 当前推荐：`withStructuredOutput`

```ts
import * as z from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

const NameResult = z.object({
  name: z.string().trim().min(1).describe("生成的中文姓名"),
});

const model = new ChatOpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  model: "qwen-plus",
  configuration: {
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  },
});

const structuredModel = model.withStructuredOutput(NameResult, {
  // OpenAI 兼容服务通常先尝试 functionCalling；仍需验证具体模型能力。
  method: "functionCalling",
});

const makeName = ChatPromptTemplate.fromTemplate(
  "姓氏：{lastname}；性别：{gender}。请生成一个中文姓名。",
).pipe(structuredModel);

const explainName = ChatPromptTemplate.fromTemplate(
  "姓名{name}，请解释它的含义。",
)
  .pipe(model)
  .pipe(new StringOutputParser());

// 第一步需要完整且通过运行时校验的 name，第二步才能开始。
const nameResult = await makeName.invoke({
  lastname: "张",
  gender: "女儿",
});

const answerStream = await explainName.stream({
  name: nameResult.name,
});

for await (const chunk of answerStream) {
  process.stdout.write(chunk);
}
```

#### Agent 的结构化输出

```ts
import * as z from "zod";
import { createAgent, toolStrategy } from "langchain";

const Answer = z.object({
  answer: z.string(),
  confidence: z.number().min(0).max(1),
});

const agent = createAgent({
  model,
  tools: [],
  // 第三方兼容服务的模型 profile 不可靠时，显式策略更可控。
  responseFormat: toolStrategy(Answer),
});

const result = await agent.invoke({
  messages: [{ role: "user", content: "请回答并给出置信度" }],
});

console.log(result.structuredResponse);
```

#### 兼容写法：`JsonOutputParser`

在前面我们完成了这样的需求去构建多模型链，不过这种做法并不标准，因为: 上一个模型的输出，`没有被处理`就输入下一个模型。

> 初始输入 --> 提示词模板 --> 模型 --> `数据处理` --> `提示词模板` --> 模型解析器 --> 结果

上一个模型的输出结果，应该作为提示词模版的输入，构建下一个提示词，用来二次调用模型。

```ts
import { ChatOpenAI } from "@langchain/openai";
import {
  StringOutputParser,
  JsonOutputParser,
} from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import "dotenv/config";

// 使用 LangChain 的 ChatOpenAI
const model = new ChatOpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  model: "qwen3.6-plus",
  configuration: {
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  },
});

// 创建模板并赋值
const chatPromptFirst = ChatPromptTemplate.fromTemplate(
  "我的邻居姓:{lastname},刚生了一个{gender}, 请起名, 并封装到JSON格式返回给我. 要求key是name，value就是起的名字。请严格遵守格式要求",
);

const chatPromptNext = ChatPromptTemplate.fromTemplate(
  "姓名{name}，请帮我解析含义。不要返回md格式，请返回纯文本。",
);

// Python: chat_prompt_template | model
const chain = chatPromptFirst
  .pipe(model)
  .pipe(new JsonOutputParser())
  .pipe(chatPromptNext)
  .pipe(model)
  .pipe(new StringOutputParser()); // 组装后的链

// JsonOutputParser 只能解析合法 JSON；还要用 Zod 执行真正的运行时校验。
// const parsedJson = await firstChain.invoke(input);
// const nameResult = NameResult.parse(parsedJson);

// console.log(chain);

const stream = await chain.stream({
  lastname: "张",
  gender: "女儿",
});

for await (const chunk of stream) {
  process.stdout.write(String(chunk ?? ""));
  // process.stdout.write(...)把内容直接写到终端，不自动换行。
}
```

### RunnableLambda

前文我们根据`JsonOutputParser`完成了多模型执行链条的构建。除了JsonOutputParser这类固定功能的解析器之外我们也可以自己编写`匿名函数`来完成自定义逻辑的数据转换，想怎么转换就怎么转换，更自由。想要完成这个功能，可以基于`RunnableLambda`类实现。

::: warning 类型断言不是运行时校验

下面的 `JSON.parse(...) as { name: string }` 只告诉 TypeScript“把它当成这个类型”，并不能阻止模型返回 `{}`、`{"name": 123}` 或其他结构。生产代码应使用 `NameResult.parse(JSON.parse(...))`，或者直接采用上面的 `withStructuredOutput(NameResult)`。

:::

```ts
import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import "dotenv/config";
import { RunnableLambda } from "@langchain/core/runnables";
import { AIMessage } from "@langchain/core/messages";
import * as z from "zod";

// 使用 LangChain 的 ChatOpenAI
const model = new ChatOpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  model: "qwen3.6-plus",
  configuration: {
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  },
});

const NameResult = z.object({
  name: z.string().trim().min(1),
});

// 自定义转换器：先解析 JSON，再用 Zod 做运行时校验。
const chatCustomTemplate = RunnableLambda.from((aiMsg: AIMessage) => {
  const parsed = NameResult.parse(JSON.parse(aiMsg.text));
  return { name: parsed.name };
});

// 创建模板并赋值
const chatPromptFirst = ChatPromptTemplate.fromTemplate(
  "我的邻居姓:{lastname},刚生了一个{gender}, 请起名, 并封装到JSON格式返回给我. 要求key是name，value就是起的名字。请严格遵守格式要求，只返回JSON。",
);

const chatPromptNext = ChatPromptTemplate.fromTemplate(
  "姓名{name}，请帮我解析含义。不要返回md格式，请返回带有换行的文本。",
);

// Python: chat_prompt_template | model
const chain = chatPromptFirst
  .pipe(model)
  .pipe(chatCustomTemplate)
  .pipe(chatPromptNext)
  .pipe(model)
  .pipe(new StringOutputParser()); // 组装后的链

// console.log(chain);

const stream = await chain.stream({
  lastname: "张",
  gender: "女儿",
});

for await (const chunk of stream) {
  process.stdout.write(String(chunk ?? ""));
  // process.stdout.write(...)把内容直接写到终端，不自动换行。
}
```

### RunnablePassthrough

RunnablePassthrough 是 LangChain LCEL 里的“原样传递器”。它的作用很简单：输入什么，就输出什么。大多数用于: 保留原输入，并往输入对象上追加新字段。

::: tip LCEL 当前仍然有效

LCEL 适合确定性的转换和 2-Step RAG。`RunnablePassthrough.assign(...)` 要求输入是对象；如果输入是字符串，先转换为对象，或使用下面 `RunnableSequence.from()` 的字段映射。涉及循环、分支、持久化或人工审批时，通常改用 Agent/LangGraph 更清晰。

:::

```ts
import { RunnablePassthrough } from "@langchain/core/runnables";

// 下面先演示 RunnablePassthrough 本身；RAG 小段默认沿用你已经初始化好的
// retriever 和 model，不是一个可独立复制运行的完整文件。
// 最基础例子
const passthrough = new RunnablePassthrough();

const passthroughResult = await passthrough.invoke("你好");
console.log(passthroughResult); // "你好"

// RAG 常见写法
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

const prompt = ChatPromptTemplate.fromTemplate(`
  请根据下面的资料回答问题:
  资料: {context}
  问题: {question}
  `);

// 保留原来的输入 然后新增一个字段
const ragChain = RunnablePassthrough.assign({
  context: async (input: { question: string }) => {
    const docs = await retriever.invoke(input.question);
    return docs.map((doc) => doc.pageContent).join("\n");
  },
})
  .pipe(prompt)
  .pipe(model)
  .pipe(new StringOutputParser());

const ragResult = await ragChain.invoke({
  question: "Chroma 是什么？",
});

// 另一个简单案例:
const addNameLength = RunnablePassthrough.assign({
  nameLength: async (input: { name: string }) => input.name.length,
});

const lengthResult = await addNameLength.invoke({
  name: "张三",
});

console.log(ragResult);
console.log(lengthResult); // { name: "张三", nameLength: 2 }
```

`RunnablePassthrough` 配合把向量检索接进 pipe 示例:

```ts
import { Document } from "@langchain/core/documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  RunnableLambda,
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";

const docs = [
  new Document({
    pageContent: "RunnablePassthrough passes the input through unchanged.",
  }),
  new Document({
    pageContent: "A retriever fetches relevant documents from a vector store.",
  }),
  new Document({
    pageContent:
      "LangChain Expression Language can compose retrieval and generation in one chain.",
  }),
];

// 模型
const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large",
});

// 创建进程内向量索引（用于 RAG，不是 Agent 对话记忆）
const vectorStore = new MemoryVectorStore(embeddings);
await vectorStore.addDocuments(docs);

// 向量检索
const retriever = vectorStore.asRetriever({ k: 2 });

const formatDocs = (documents: Document[]) =>
  documents.map((doc) => doc.pageContent).join("\n\n");

const prompt = ChatPromptTemplate.fromTemplate(`
    Answer the question only from the context below.
    Context: {context}
    Question: {question}
  `);

// 大语言模型
const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
});

const chain = RunnableSequence.from([
  {
    context: retriever.pipe(formatDocs), // 负责检索并整理上下文
    question: new RunnablePassthrough<string>(), // 负责把原始问题原样传下去
  },
  prompt,
  llm,
  new StringOutputParser(),
]);

const result = await chain.invoke(
  "What does RunnablePassthrough do in this chain?",
);

console.log(result);

// 如果你的输入不是字符串，而是对象，比如 { question, userId }，通常这样写：
const pickQuestion = RunnableLambda.from(
  (input: { question: string; userId: string }) => input.question,
);

const objectInputChain = RunnableSequence.from([
  // 保留原输入对象，并补一个 context 字段
  RunnablePassthrough.assign({
    // 真正做向量检索
    context: pickQuestion.pipe(retriever).pipe(formatDocs),
  }),
  prompt,
  llm,
  new StringOutputParser(),
]);

const result2 = await objectInputChain.invoke({
  question: "What does the retriever do here?",
  userId: "u_123",
});

console.log(result2);
```

::: warning 示例配置说明

上面的 `OpenAIEmbeddings` 和 `ChatOpenAI` 未传 `baseURL`，因此默认读取 OpenAI 配置。若你使用 DashScope，必须像前文一样同时配置模型和 Embedding 的 `apiKey`、`baseURL` 与对应模型名称。

:::

---

## Agent Middleware

Middleware 是当前 Agent 体系的主要扩展入口。日志、动态提示词、重试、模型降级、调用次数限制、长对话摘要、PII 处理和人工审批等横切能力，优先通过 Middleware 组合，而不是全部塞进工具函数。

```ts
import {
  createAgent,
  modelRetryMiddleware,
  summarizationMiddleware,
  toolCallLimitMiddleware,
} from "langchain";

const agent = createAgent({
  model,
  tools,
  middleware: [
    modelRetryMiddleware({
      maxRetries: 2,
      initialDelayMs: 1_000,
      backoffFactor: 2,
    }),
    toolCallLimitMiddleware({
      runLimit: 8,
    }),
    summarizationMiddleware({
      model,
      trigger: { tokens: 4_000 },
      keep: { messages: 20 },
    }),
  ],
});
```

::: warning Middleware 不是万能安全层

- 401、参数错误和业务校验失败通常不应盲目重试；
- 付款、发邮件、写数据库等有副作用的工具还要保证幂等，并根据风险加入人工审批；
- 调用次数限制用于控制失控循环与成本，但不能替代工具权限和业务校验。

:::

- [Middleware overview](https://docs.langchain.com/oss/javascript/langchain/middleware/overview)
- [Built-in middleware](https://docs.langchain.com/oss/javascript/langchain/middleware/built-in)

## Agent 单元测试：`fakeModel`

不要用真实模型承担所有测试。当前 LangChain 提供 `fakeModel()`，可以预设模型返回的文本、工具调用和错误，让 Agent 测试不消耗 API Key，并且结果稳定、可重复。

```ts
import { describe, expect, test } from "vitest";
import { AIMessage } from "@langchain/core/messages";
import { createAgent, fakeModel, tool } from "langchain";
import * as z from "zod";

const getWeather = tool(async ({ city }) => `${city}：晴朗`, {
  name: "get_weather",
  description: "查询城市天气",
  schema: z.object({ city: z.string().min(1) }),
});

describe("weather agent", () => {
  test("调用天气工具后生成最终回答", async () => {
    const model = fakeModel()
      .respondWithTools([
        {
          name: "get_weather",
          args: { city: "广州" },
          id: "call-1",
        },
      ])
      .respond(new AIMessage("广州当前天气晴朗。"));

    const agent = createAgent({
      model,
      tools: [getWeather],
    });

    const result = await agent.invoke({
      messages: [{ role: "user", content: "广州天气如何？" }],
    });

    expect(result.messages.at(-1)?.text).toBe("广州当前天气晴朗。");
    expect(model.callCount).toBe(2);
    expect(
      model.calls[1].messages.some((message) => message.type === "tool"),
    ).toBe(true);
  });
});
```

这个测试验证的是 Agent 的确定性控制逻辑。真实服务是否支持工具调用、流式输出和错误格式，还需要少量集成测试单独验证。

[LangChain Agent 单元测试](https://docs.langchain.com/oss/javascript/langchain/test/unit-testing)

## 短期记忆

如果这部分是从 `LangChain` 主路径学习，当前更贴近官方文档的入口是：先用 `createAgent({ checkpointer })` 给 Agent 加短期记忆，再去理解底层的 `LangGraph`。

核心点：

- 短期记忆是当前 thread 范围内的 Agent/Graph state；`checkpointer` 负责让该 state 能在多次 `invoke()` 之间恢复
- 同一个 `thread_id` 表示同一个会话线程，不等于用户 ID；一个用户可以有多个 thread
- 开发环境常用 `MemorySaver`
- 生产环境通常换成持久化 `checkpointer`

```ts
import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { createAgent } from "langchain";
import { MemorySaver } from "@langchain/langgraph";

const model = new ChatOpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  model: "qwen-plus",
  configuration: {
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  },
});

const checkpointer = new MemorySaver();

const agent = createAgent({
  model,
  tools: [],
  checkpointer,
});

const config = {
  configurable: {
    thread_id: "thread-1",
  },
};

await agent.invoke(
  {
    messages: [{ role: "user", content: "你好，我叫小李" }],
  },
  config,
);

const result = await agent.invoke(
  {
    messages: [{ role: "user", content: "我叫什么名字？" }],
  },
  config,
);

console.log(result.messages.at(-1)?.text);
```

::: danger 已弃用：`RunnableWithMessageHistory`

`RunnableWithMessageHistory` 在当前 `@langchain/core` API Reference 中已标记为 deprecated。它可能仍能运行，用于兼容已有 LCEL 代码；新 Agent 使用 `createAgent({ checkpointer })`。

- `RunnableWithMessageHistory` 在原有链的基础上创建带有历史记录功能的新链(新`Runnable`实例)
- `InMemoryChatMessageHistory` 为历史记录提供内存存储 (临时用)

[RunnableWithMessageHistory API Reference](https://reference.langchain.com/javascript/langchain-core/runnables/RunnableWithMessageHistory)

:::

如果你需要：

- 自定义状态结构
- 设计多节点流程
- 精细控制消息如何进入 `prompt`

那就继续往下看更底层的 `LangGraph + StateGraph` 写法。

当前 LangGraph v1 文档推荐使用 `StateSchema + MessagesValue` 定义图状态。下面直接使用这套 API，避免混用旧的 `Annotation.Root` 路径。

### 更底层：LangGraph + StateGraph

::: danger 原示例的数据流问题（已修正）

旧示例虽然保存了第二轮“请再给一个不同的名字”，节点却始终只使用固定的姓氏/性别模板，第二轮文本没有真正决定任务；节点还额外伪造了一条 human message，使历史重复、失真。下面改成：用户消息只从 `invoke()` 输入，节点只追加模型返回的 `AIMessage`。

:::

```ts
import { ChatOpenAI } from "@langchain/openai";
import {
  END,
  MemorySaver,
  MessagesValue,
  START,
  StateSchema,
  StateGraph,
} from "@langchain/langgraph";
import "dotenv/config";

const model = new ChatOpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  model: "qwen-plus",
  configuration: {
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  },
});

const State = new StateSchema({
  messages: MessagesValue,
});

const callModel: typeof State.Node = async (state) => {
  const response = await model.invoke([
    {
      role: "system",
      content: "你是中文起名助手。要理解完整历史，并避免重复之前给过的名字。",
    },
    ...state.messages,
  ]);

  // MessagesValue 会把新 AIMessage 追加到已有历史。
  return { messages: [response] };
};

const graph = new StateGraph(State)
  .addNode("call_model", callModel)
  .addEdge(START, "call_model")
  .addEdge("call_model", END)
  .compile({
    checkpointer: new MemorySaver(),
  });

const config = {
  configurable: {
    // 这是会话线程 ID，不是用户 ID。
    thread_id: "thread-1",
  },
};

const result = await graph.invoke(
  {
    messages: [
      {
        role: "user",
        content: "我的邻居姓张，刚生了一个女儿，请起名并解释含义。",
      },
    ],
  },
  config,
);

console.log(result.messages.at(-1)?.text);

const followUp = await graph.invoke(
  {
    messages: [{ role: "user", content: "请再给一个不同的名字。" }],
  },
  config,
);

console.log(followUp.messages.at(-1)?.text);
```

## 长期记忆

短期记忆使用 thread state + checkpointer；跨 thread 的长期记忆使用 LangGraph Store。两者和 RAG 的 `VectorStore` 不是同一个抽象。

| 概念              | 生命周期                                     | 是否可变        | 典型内容                               |
| ----------------- | -------------------------------------------- | --------------- | -------------------------------------- |
| `state`           | 一次 run；有 checkpointer 时可按 thread 恢复 | 可变            | messages、中间结果、计数器             |
| runtime `context` | 当前一次 `invoke()`                          | 只读            | userId、tenantId、数据库连接、运行配置 |
| `checkpointer`    | 同一个 `thread_id` 的多次调用                | 保存 state 快照 | 短期记忆、暂停恢复、time travel        |
| `store`           | 跨 thread                                    | 可读写          | 用户偏好、长期资料等 JSON 文档         |
| RAG `VectorStore` | 取决于向量存储实现                           | 可检索/可能可写 | chunk、embedding、metadata             |

::: warning `InMemoryStore` 不是物理持久化

`InMemoryStore` 在语义上可作为跨 thread 的长期 Store，但数据只在当前进程内，程序重启就会丢失。生产环境使用数据库后端，例如官方示例中的 `PostgresStore`，并按对应包要求执行 `setup()`/迁移。

:::

```ts
import { createAgent } from "langchain";
import { InMemoryStore } from "@langchain/langgraph";

const store = new InMemoryStore();

const agent = createAgent({
  model,
  tools,
  store,
});
```

工具和 Middleware 可以通过 `runtime.store` 读写 Store。namespace 和 key 必须包含可信的租户/用户边界；不要直接相信模型生成的 `userId`。

- [Long-term memory](https://docs.langchain.com/oss/javascript/langchain/long-term-memory)
- [Runtime context](https://docs.langchain.com/oss/javascript/langchain/runtime)

---

## RAG基础

::: info 版本与包迁移说明

本节按 2026-08-12 的 LangChain JavaScript 文档核对。核心 Agent API 位于 `langchain`，部分传统 Loader 和内存向量存储目前仍位于 `@langchain/classic`。少数集成页仍展示 `@langchain/community`；该 npm 包已经标记为 deprecated / being sunset，但仍可能收到社区维护更新，因此这里不把它误写成“完全停止维护”。新项目不应采用它，已有项目要锁定版本并进行实际加载/查询测试。

:::

::: warning 通用基础模型的局限

1. **知识具有时间边界**：模型不会因为现实世界发生变化而自动更新参数中的知识。
2. **缺少私域知识**：模型通常不了解企业内部文档、个人笔记和特定业务数据。
3. **可能产生幻觉**：即使提供了检索上下文，模型仍可能误解、遗漏或生成无依据内容。
4. **上下文窗口有限**：不能把任意规模的知识库一次性塞进模型。
5. **安全需要单独设计**：RAG 不会自动解决权限控制、租户隔离、敏感信息泄露和检索内容中的 Prompt Injection。

:::

RAG（Retrieval-Augmented Generation，检索增强生成）是在生成答案之前或生成过程中，从外部知识源检索相关内容，并把它们作为上下文交给模型。最小 2-Step RAG 可以助记为：

```text
RAG = 检索相关证据 + 构造上下文 + 基于证据生成
```

![工作流程](/assert/image-langchain/工作流程.png)

RAG的核心工作流程是:
![RAG的核心工作流程](/assert/image-langchain/RAG的核心工作流程.png)

### 常见 RAG 架构

| 架构        | 检索方式                                                            | 优点                       | 代价                   | 适用场景               |
| ----------- | ------------------------------------------------------------------- | -------------------------- | ---------------------- | ---------------------- |
| 2-Step RAG  | 每次固定先检索，再生成                                              | 可预测、易评测、延迟较稳定 | 灵活性较低             | FAQ、文档问答          |
| Agentic RAG | Agent 决定是否检索、检索几次及使用哪个知识工具                      | 灵活，适合多工具           | 延迟、成本和轨迹不稳定 | 研究助手、多知识源助手 |
| Hybrid RAG  | 融合固定检索与 Agentic 特征，可加入查询改写、重排、验证、迭代或回退 | 控制性与灵活性折中         | 实现和评测更复杂       | 高质量领域问答         |

[官方 Retrieval 与 RAG 架构](https://docs.langchain.com/oss/javascript/langchain/retrieval)

### 嵌入模型（Embedding 模型）

> 什么是嵌入模型呢？

- 输入：文本
- 输出：向量（一串数字，如 [0.23, -0.45, 0.67, ...]）
- 用途：将文本转换成数学表示，用于：
  - 语义搜索（找相似内容）
  - 文档检索（RAG 系统）
  - 聚类分类
  - 推荐系统

| 维度     | 嵌入模型       | 生成模型     |
| -------- | -------------- | ------------ |
| 输出     | 数字向量       | 自然语言文本 |
| 任务     | 理解语义相似度 | 生成新内容   |
| 典型场景 | 搜索引擎后台   | 聊天机器人   |

余弦相似度是 RAG 中常见的向量度量之一，但不是唯一选择。具体后端/index 也可能使用欧氏距离或点积；分数范围和方向由实现决定。

### 文档加载器（Document Loaders）

Document Loader 负责从文件、网页或外部系统读取数据，并转换成统一的 LangChain `Document`。`pageContent` 用于后续切块和 Embedding；`metadata` 保存来源、页码、标题、权限范围等信息。

::: danger 不要再使用 `loadAndSplit()`

LangChain v1 已删除 `BaseDocumentLoader.loadAndSplit()`。当前写法明确分成两步：

```ts
const docs = await loader.load();
const chunks = await splitter.splitDocuments(docs);
```

:::

::: danger `@langchain/community` 已弃用并正在 sunset

部分官方集成页仍展示 `@langchain/community`，但 npm 已将该包标记为 deprecated / being sunset；它仍可能收到社区维护更新，所以不能简单等同于“完全停止维护”。新项目不要新增该依赖，优先选择独立维护的 provider 包或当前教程采用的直接 parser。`@langchain/classic` 是 v0.x 兼容层，也不是新项目的通用首选；只有当前官方仍把某个具体 Loader/组件放在那里时，才按该集成页使用并建立测试。

:::

::: warning 本节 filesystem Loader 仅适用于 Node.js

下面的 Text/PDF/CSV 文件示例用于服务端、Route Handler 或离线 ingestion 脚本，不能直接放进 React/Next.js Client Component。浏览器上传的文件应交给服务端处理，或使用明确支持浏览器的解析方案。

:::

#### 加载纯文本

```ts
import { TextLoader } from "@langchain/classic/document_loaders/fs/text";

const textLoader = new TextLoader("./data.txt");
const textDocs = await textLoader.load();
```

[TextLoader 官方文档](https://docs.langchain.com/oss/javascript/integrations/document_loaders/file_loaders/text)

#### 加载 PDF

当前 LangChain Semantic Search 教程直接使用 `pdf-parse`，再构造 `Document`，从而避免已经弃用并进入 sunset 的 community PDFLoader：

::: warning 这段代码只能在 Node.js 服务端或离线索引脚本运行

`node:fs` 不能放进 React/Next.js Client Component。浏览器上传 PDF 时，应把文件交给 Route Handler/Server Action 处理，或在客户端使用专门的浏览器 PDF 解析方案。

:::

```ts
import { readFileSync } from "node:fs";
import { Document } from "@langchain/core/documents";
import { PDFParse } from "pdf-parse";

async function loadPdfPages(filePath: string): Promise<Document[]> {
  const parser = new PDFParse({
    data: new Uint8Array(readFileSync(filePath)),
  });

  try {
    const { pages } = await parser.getText();

    return pages.map(
      (page) =>
        new Document({
          pageContent: page.text,
          metadata: {
            source: filePath,
            // 项目中要统一使用 0-based 或 1-based 页码。
            page: page.num - 1,
          },
        }),
    );
  } finally {
    await parser.destroy();
  }
}

const pdfDocs = await loadPdfPages("./example.pdf");
```

```bash
pnpm add pdf-parse @langchain/core
```

[当前 Semantic Search 教程](https://docs.langchain.com/oss/javascript/langchain/knowledge-base)

#### 加载 CSV

官方页面正处于迁移期：CSV 单文件页还展示 community 路径，MultiFileLoader 示例则展示 classic 路径。文档之间并未完全统一。下面展示后者的 classic 写法，但必须以项目锁定版本的实际导出为准，并建立最小加载测试：

```ts
import { CSVLoader } from "@langchain/classic/document_loaders/fs/csv";

const csvLoader = new CSVLoader("./data/users.csv");
const csvDocs = await csvLoader.load();

console.log(csvDocs[0].pageContent);
console.log(csvDocs[0].metadata);

const semicolonLoader = new CSVLoader("./data/users.csv", {
  column: "content",
  separator: ";",
});
```

```bash
pnpm add @langchain/classic @langchain/core d3-dsv@2
```

如果你锁定的旧版本没有 classic CSV 导出，只能使用 community 路径时，要锁定相互兼容的版本并建立加载测试。

- [CSVLoader 页面](https://docs.langchain.com/oss/javascript/integrations/document_loaders/file_loaders/csv)
- [MultiFileLoader 当前示例](https://docs.langchain.com/oss/javascript/integrations/document_loaders/file_loaders/multi_file)

### RecursiveCharacterTextSplitter

`RecursiveCharacterTextSplitter` 是通用文本的推荐起点。它会依次尝试分隔符，直到 chunk 满足大小限制。默认分隔符是 `["\n\n", "\n", " ", ""]`。

1. 先尽量按段落切: `\n\n`
2. 段落太大，再按换行切: `\n`
3. 还太大，再按空格切: `" "`
4. 最后实在不行，按字符硬切：`""`

- [官方文档](https://docs.langchain.com/oss/javascript/integrations/splitters/recursive_text_splitter)

```ts
// 安装: npm install @langchain/textsplitters
// 基本用法
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";

const docs = [
  new Document({
    pageContent: "这里是一大段很长的文本内容...",
    metadata: {
      source: "demo.txt",
    },
  }),
];

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500, // 表示每个 chunk 的最大长度。默认按字符长度计算，不是 token。
  chunkOverlap: 50, // 目标重叠长度；不保证每一块都精确重叠相同字符数。
});

// 会复制原文档已有的 metadata，但不会凭空生成页码、行号或标题。
const splitDocs = await splitter.splitDocuments(docs);

console.log(splitDocs[0].pageContent);
console.log(splitDocs[0].metadata);

// 中文资料通常没有空格作为词边界，加入中文标点。
const chineseSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 50,
  separators: [
    "\n\n",
    "\n",
    " ",
    "。",
    "．",
    ".",
    "！",
    "？",
    "；",
    "，",
    ",",
    "、",
    "\u200b",
    "",
  ],
});
```

如果把 `"\n## "` 放入 `separators`，它只是在匹配字符串，并不理解 Markdown AST，也不会自动把标题层级写入 metadata。需要保留标题结构时，应先解析 Markdown 或显式补充标题 metadata。

::: tip 不存在通用最佳切块参数

`chunkSize: 500` 和 `chunkOverlap: 50` 只是起点。应使用固定问题集比较参数对检索命中率、答案正确率、延迟和成本的影响。

:::

### 向量存储（Vector Store）

[官方 LangChain JS Vector Store](https://docs.langchain.com/oss/javascript/integrations/vectorstores)

安装：`pnpm add @langchain/classic @langchain/core @langchain/openai`

Vector Store 通常译为“向量存储”，负责保存向量及其关联数据并提供相似度检索接口。它是抽象能力，不等同于独立运行、可持久化的“向量数据库”；例如 `MemoryVectorStore` 只是进程内实现。

> 为什么需要向量

Embedding 模型负责把文本转换成向量；向量存储根据距离或相似度执行检索；LLM 通常在检索之后基于上下文生成答案。语义相近的文本是否更接近，取决于所用 Embedding 模型及数据分布。

在 RAG 里，它的位置一般是： 原始文档 --> Document Loader 加载 --> Text Splitter 切块 --> Embedding Model 转成向量 --> Vector Store 保存向量 --> Retriever 检索相似内容 --> LLM 根据检索内容回答

> Vector Store 存什么

- `vector`：文本的向量
- `pageContent`：原始文本
- `metadata`：来源信息，比如文件名、页码、URL、分类等

```ts
import "dotenv/config";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";

// 创建一个文本嵌入模型
const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.DASHSCOPE_API_KEY,
  model: "text-embedding-v4",
  configuration: {
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  },
});

const vectorStore = new MemoryVectorStore(embeddings);

const docs = [
  new Document({
    pageContent: "LangChain 是一个用于构建大模型应用的框架。",
    metadata: { source: "note-1" },
  }),
  new Document({
    pageContent: "向量数据库可以用于语义检索和 RAG。",
    metadata: { source: "note-2" },
  }),
];

// 把文档添加到向量存储中
await vectorStore.addDocuments(docs);

// 检索相似内容
const results = await vectorStore.similaritySearch("什么是 RAG？", 2);

console.log(results);
```

::: warning 删除能力必须按具体实现与版本确认

`VectorStore` 抽象包含 `delete()`，但每个后端支持的参数不同，可能按 `ids`、metadata filter 或清空索引删除。当前总览甚至用 `MemoryVectorStore` 演示 filter 删除，而具体 Memory Reference 又存在文档缺口。因此不要在笔记里断言所有版本的 `MemoryVectorStore` 都“不支持 delete”；在锁定版本上用 TypeScript 类型和冒烟测试确认。

需要稳定的按 ID 删除和持久化时，应选择明确记录这些能力的实现，例如独立维护的 Qdrant、Pinecone 等 provider 包，并查看该集成自己的文档。Python 的 `InMemoryVectorStore` 当前明确支持 `delete(ids=[...])`。

:::

Python 对照示例需要先安装依赖，并提供 `DASHSCOPE_API_KEY`：

```bash
pip install -U langchain-core langchain-community dashscope
```

::: warning Python 的 `langchain_community` 与 JavaScript 包不是同一套发布状态

下面的 `DashScopeEmbeddings` 当前 Python Reference 仍可用，但它属于 Python community 集成。要单独锁定并测试 Python 依赖，不要把前面对 JavaScript `@langchain/community` 的判断机械套用过来，也不要因为类名相似就混用两种语言的导入路径。

:::

```python
from langchain_core.documents import Document
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_community.embeddings import DashScopeEmbeddings

embeddings = DashScopeEmbeddings(
    model="text-embedding-v4",
)

vector_store = InMemoryVectorStore(embedding=embeddings)

doc1 = Document(
    page_content="LangChain 是一个用于构建大模型应用的框架。",
    metadata={"source": "note-1"},
)
doc2 = Document(
    page_content="向量数据库可以用于语义检索和 RAG。",
    metadata={"source": "note-2"},
)

# 添加文档到向量存储，并指定 id
vector_store.add_documents(
    documents=[doc1, doc2],
    ids=["id1", "id2"],
)

# 通过 id 删除文档
vector_store.delete(ids=["id1"])

# 相似度搜索
results = vector_store.similarity_search("什么是 RAG？", k=2)
print(results)
```

### 使用Chroma持久化向量

Chroma 是向量数据库，但“使用 Chroma”不等于当前 JavaScript 进程会自动把数据永久保存。需要区分：

- **Chroma Server**：保存集合、向量、文本和 metadata；
- **JavaScript/TypeScript 客户端**：通过 HTTP 连接 Server；
- **LangChain Chroma 包装器**：把 Chroma 适配成 LangChain `VectorStore`。

TypeScript 本地持久化运行：

```bash
pnpm add chromadb
npx chroma run --path ./chroma-data
```

`--path` 决定服务端数据目录；默认端口是 `8000`。也可以使用 Docker 或 Chroma Cloud。

- [Chroma TypeScript Client/Server](https://docs.trychroma.com/docs/run-chroma/clients)
- [Chroma CLI run](https://docs.trychroma.com/docs/cli/run)

::: danger LangChain JavaScript Chroma 包装器位于已弃用包

截至 2026-08-12，LangChain JavaScript Vector Store 索引仍展示 `@langchain/community/vectorstores/chroma`，但 npm 已将 `@langchain/community` 标记为 deprecated / being sunset；不同官方页面对维护状态的措辞并不完全一致。因此它属于迁移期/兼容入口，而不是新生产项目的稳定依赖方向。

已有项目可以锁定兼容的 `@langchain/community` 与 `chromadb` 版本继续使用；新项目优先选择有独立维护包的 Vector Store，或直接使用 `chromadb` 客户端，并为连接、添加、查询、过滤和删除建立冒烟测试。

如果要运行下面的**旧项目兼容示例**，仅安装 `chromadb` 不够；还需要按已有项目锁文件安装兼容的包装器和 LangChain 包，例如：

```bash
pnpm add @langchain/community @langchain/core @langchain/openai chromadb
```

不要仅凭这条命令随意升级旧项目；应保留 lockfile，并实际测试连接、写入、过滤和删除。

[LangChain JavaScript Vector Store 索引](https://docs.langchain.com/oss/javascript/integrations/vectorstores/index)

:::

下面代码保留，是为了说明迁移期包装器的现有 API，而不是推荐新项目采用该依赖：

```ts
import "dotenv/config";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`缺少环境变量：${name}`);
  }
  return value;
}

const embeddings = new OpenAIEmbeddings({
  apiKey: requireEnv("DASHSCOPE_API_KEY"),
  model: "text-embedding-v4",
  configuration: {
    baseURL: requireEnv("DASHSCOPE_BASE_URL"),
  },
});

const vectorStore = new Chroma(embeddings, {
  collectionName: "my_docs",
  url: process.env.CHROMA_URL ?? "http://localhost:8000",
});

// 添加文档
const docs = [
  new Document({
    pageContent: "LangChain 是一个用于构建大模型应用的框架。",
    metadata: {
      source: "note-1",
      type: "framework",
    },
  }),
  new Document({
    pageContent: "Chroma 是一个开源向量数据库，可以用于语义检索。",
    metadata: {
      source: "note-2",
      type: "vector-db",
    },
  }),
];

await vectorStore.addDocuments(docs, {
  ids: ["doc-1", "doc-2"], // 自定义 id 可以用于删除文档
});

// 相似度搜索
const results = await vectorStore.similaritySearch("什么是向量数据库？", 2);

console.log(results); // 返回的是最相关的 Document[]

// 带分数搜索
const resultsWithScore = await vectorStore.similaritySearchWithScore(
  "Chroma 有什么作用？",
  2,
);

for (const [doc, score] of resultsWithScore) {
  console.log({ score, content: doc.pageContent, metadata: doc.metadata });
}

// 按 metadata 过滤
const filteredResults = await vectorStore.similaritySearch(
  "什么是 LangChain？",
  2,
  {
    // 表示只在 metadata.type === "framework" 的文档里搜索
    type: "framework",
  },
);

// 转成 Retriever
// RAG 里更常见的是把 Chroma 转成 retriever
const retriever = vectorStore.asRetriever({
  k: 2,
});

const retrievedDocs = await retriever.invoke("Chroma 是什么？");

console.log(filteredResults);
console.log(retrievedDocs);

// 删除文档
await vectorStore.delete({
  ids: ["doc-1"],
});
```

::: warning 不要统一解释 score

不同 Vector Store 的 score 可能是相似度，也可能是距离；数值范围以及“越大越相关/越小越相关”的方向并不统一。必须查看当前集成说明，并用已知相似与不相似文本验证一次。

:::

### RAG 评测：检索和生成分开检查

只看最终回答“读起来是否合理”无法判断问题发生在哪一层。至少分别检查：

| 维度                        | 比较对象             | 问题                           |
| --------------------------- | -------------------- | ------------------------------ |
| Retrieval relevance         | 检索文档 vs 用户问题 | 检索结果是否相关？             |
| Groundedness / Faithfulness | 回答 vs 检索文档     | 回答中的结论是否都有文档依据？ |
| Answer relevance            | 回答 vs 用户问题     | 是否真正解决问题？             |
| Answer correctness          | 回答 vs 参考答案     | 是否与已知正确答案一致？       |

建立至少 10～20 条固定测试数据，包含直接命中、同义改写、多 chunk、无答案拒答、metadata 权限过滤和文档 Prompt Injection。入库时给每个 chunk 保存稳定的 `chunkId`；只检查文件级 `source` 会把“命中了同一文件里的错误 chunk”误判为成功。

```ts
import type { Document } from "@langchain/core/documents";

type AnswerableCase = {
  question: string;
  expectedChunkIds: string[];
  expectedSources?: string[]; // 只作为更粗粒度的诊断信息
  referenceAnswer: string;
  shouldAnswer: true;
};

type UnanswerableCase = {
  question: string;
  expectedChunkIds: [];
  shouldAnswer: false;
};

type RagEvalCase = AnswerableCase | UnanswerableCase;

const evalCases: RagEvalCase[] = [
  {
    question: "Chroma 在系统中负责什么？",
    expectedChunkIds: ["note-2#chunk-0"],
    expectedSources: ["note-2"],
    referenceAnswer: "负责保存向量并执行相似度检索。",
    shouldAnswer: true,
  },
  {
    question: "资料中没有记载的问题",
    expectedChunkIds: [],
    shouldAnswer: false,
  },
];

function getChunkIds(documents: Document[]): string[] {
  return documents.map((document) => String(document.metadata.chunkId ?? ""));
}

function hitAtK(documents: Document[], expectedChunkIds: string[]): number {
  if (expectedChunkIds.length === 0) {
    throw new Error("无答案问题不使用 Hit@K，应单独评测拒答行为");
  }

  const expected = new Set(expectedChunkIds);
  return getChunkIds(documents).some((id) => expected.has(id)) ? 1 : 0;
}

function recallAtK(documents: Document[], expectedChunkIds: string[]): number {
  if (expectedChunkIds.length === 0) {
    throw new Error("Recall@K 需要至少一个期望 chunk");
  }

  const retrieved = new Set(getChunkIds(documents));
  const hits = new Set(expectedChunkIds.filter((id) => retrieved.has(id)));
  return hits.size / new Set(expectedChunkIds).size;
}

function reciprocalRank(
  documents: Document[],
  expectedChunkIds: string[],
): number {
  const expected = new Set(expectedChunkIds);
  const rank = getChunkIds(documents).findIndex((id) => expected.has(id));
  return rank === -1 ? 0 : 1 / (rank + 1);
}
```

- `Hit@K`：Top-K 中是否至少出现一个正确 chunk；
- `Recall@K`：期望证据 chunk 有多少比例被取回；
- `MRR`：第一个正确 chunk 排得越靠前越好，取各问题 reciprocal rank 的平均值；
- `shouldAnswer: false`：不要求 Retriever 返回空数组，而是单独检查最终回答是否明确说明证据不足，并统计拒答正确率和无依据断言；
- Groundedness：把回答中的结论与本次取回的证据逐项比较，不能由 Retrieval 指标代替。

::: tip 推荐 RAG 返回结构

RAG 函数不要只返回答案字符串，至少保留原始检索文档，方便展示引用、权限检查、日志和评测：

```ts
import type { Document } from "@langchain/core/documents";

type RagOutput = {
  answer: string;
  documents: Document[];
};
```

每轮实验只改变一个变量，例如 chunk 参数、Embedding、Top-K、MMR、filter、reranker 或 Prompt，并记录命中率、正确率、Groundedness、延迟和成本。

:::

[LangSmith RAG 评测教程](https://docs.langchain.com/langsmith/evaluate-rag-tutorial)
