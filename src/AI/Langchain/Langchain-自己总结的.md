# Langchain

## LangChain介绍

::: danger 什么是Langchain?

> 提问: 公司年假制度是什么？

如果是普通对话框，大模型可能靠自己猜。如果是 LangChain 做的知识库：

1. LangChain 收到问题
2. 去公司 PDF 文档里检索“年假制度”
3. 找到相关段落
4. 把段落和问题一起发给大模型
5. 要求大模型只能基于资料回答
6. 返回答案和来源

LangChain 负责自动化流程，大模型负责理解和生成答案。你学LangChain，本质是在学: 如何用程序控制大模型完成真实任务。

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

## Agent工作机制

An AI agent is a system that uses an LLM to decide the control flow of an application. (Agent是一种使用大语言模型（LLM）来决定应用程序控制流的系统。)

| 特性     | 传统聊天机器人 / LLM   | AI Agent                       |
| -------- | ---------------------- | ------------------------------ |
| 交互模式 | 通常按输入生成响应 | 可在受控循环中决定后续步骤 |
| 执行力   | 可生成文本或结构化工具调用 | 在应用授权的工具范围内执行动作 |
| 自主性   | 由调用方编排流程 | 可在迭代、权限和审批边界内规划 |

传统LLM:
![LLM](/assert/image-langchain/LLM.png)
Agent模式:
![agent](/assert/image-langchain/agent.png)

具体流程如下：

1. 用户提问（Input）：杭州今天天气如何？
2. 模型分析（Reasoning）：用户询问杭州天气，我不知道，需要调用查询天气的工具get_weather
3. 调用工具（Action）：调用工具，get_weather，传入城市"杭州"
4. 分析结果（Observation）：工具返回结果，模型分析结果，判断是否足以回答用户问题
   - 是：整理生成响应结果
   - 否：重复前面步骤
5. 生成结果（Output）：根据工具的结果生成响应给用户

> 模型是如何知道工具的信息的呢？

在大模型提供的API接口中，有一个tools参数，描述了工具的详细信息. `LangChain`会帮助我们**把`tool`的信息封装为此`tool`参数，与`message`一起发送给大模型**，大模型就了解`tool`的详细信息，根据用户需求判断是否需要调用`tool`，需要调用哪个`tool`.

> 当大模型决定调用某个tool时，该如何调用呢？

模型服务不会直接执行本地函数，而是返回结构化的工具调用请求。现代 LangChain `AIMessage` 会把这些请求规范化到 `tool_calls` 等字段，而不是要求应用从普通 JSON 字符串中自行猜测。Agent 运行时校验参数、调用已注册工具，再把 `ToolMessage` 结果交回模型继续判断。

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

const baseUrl = process.env.DASHSCOPE_BASE_URL;
const apiKey = process.env.DASHSCOPE_API_KEY;

// 初始化模型
const model = new ChatOpenAI({
  model: "qwen-plus",
  apiKey: apiKey,
  configuration: {
    baseURL: baseUrl,
  },
  temperature: 0.7,
});

// 访问模型
async function main() {
  // 非流式调用：一次性返回完整结果
  const response = await model.invoke("你是谁?");
  console.log(response.content); // response 是一条 AIMessage

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

在langchain的社区，除了langchain官方提供的Model，还有些类是社区提供，更丰富多样。具体支持的模型，可以查看官网地址：https://docs.langchain.com/oss/python/integrations/chat

### 在Agent中使用模型

上述代码是直接调用模型，而不是通过智能体调用模型。要想在智能体中使用模型，需要使用 `createAgent`。

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
import { HumanMessage } from "@langchain/core/messages";

const baseUrl = process.env.DASHSCOPE_BASE_URL;
const apiKey = process.env.DASHSCOPE_API_KEY;

// 初始化模型
const model = new ChatOpenAI({
  model: "qwen-plus",
  apiKey: apiKey,
  configuration: {
    baseURL: baseUrl,
  },
});

async function main() {
  // 创建 Agent（不带工具的简单版本）
  const agent = createAgent({
    // 使用已经创建好的模型
    model: model,
    tools: [], // 可以在这里添加工具
  });

  // 调用 Agent
  // invoke 非流式调用：返回的是 Agent 状态，而不是单条 AIMessage
  const response = await agent.invoke({
    messages: [new HumanMessage("你是谁?")],
  });

  console.log(response);
  // 获取最终回答
  console.log(
    "\n最终回答:",
    response.messages[response.messages.length - 1].content,
  );
}

main();
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
    messages: [new HumanMessage("你是谁?")],
  },
  {
    streamMode: "messages",
  },
);

for await (const [token, metadata] of stream) {
  if (token.text) {
    process.stdout.write(token.text);
  }
}
```

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

在调用模型时，发送给LLM的消息、LLM返回的消息都包含以下几部分内容：

- `role`：消息所属角色，可以是system、user、assistant
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
import {
  SystemMessage,
  HumanMessage,
  AIMessage,
} from "@langchain/core/messages";
import { z } from "zod";

const baseUrl = process.env.DASHSCOPE_BASE_URL;
const apiKey = process.env.DASHSCOPE_API_KEY;

const getWeatherTool = tool(
  async ({ local }) => {
    return `Current weather in ${local} is sunny`;
  },
  {
    name: "get_weather",
    description: "Get weather data",
    schema: z.object({
      local: z.string().describe("city name"),
    }),
  },
);

const model = new ChatOpenAI({
  model: "qwen-plus",
  apiKey: apiKey,
  configuration: {
    baseURL: baseUrl,
  },
});

async function main() {
  const agent = createAgent({
    model: model,
    tools: [getWeatherTool],
  });

  const response = await agent.invoke({
    messages: [
      new SystemMessage("请使用工具获取天气"),
      new HumanMessage("你好我是小爱同学"),
      new AIMessage("你好,小爱同学!很高兴认识你"),
      new HumanMessage("今天广州天气如何?"),
    ],
  });

  console.log("\n=== 完整对话历史 ===\n");
  // Agent的返回结果中包含完整的消息列表（Messages）
  for (const message of response.messages) {
    console.log(`[${message._getType()}]`);
    console.log(message.content);
    console.log("---");
  }
}

main();
```

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

LangChain 支持向模型发送多模态消息，比如图片、音频、视频、文本等。但前提是必须是多模态模型才支持。

## 提示词（Prompts）

### 系统提示词

```ts
import { createAgent } from "langchain";
import { ChatDeepSeek } from "@langchain/deepseek";

const agent = createAgent({
  model: new ChatDeepSeek({
    model: "deepseek-v4-flash",
    temperature: 0,
  }),
  tools: [],
  systemPrompt: "像海盗一样说话。",
});

for await (const [token] of await agent.stream(
  {
    messages: [{ role: "user", content: "你是谁？" }],
  },
  {
    streamMode: "messages",
  },
)) {
  if (typeof token.content === "string") {
    process.stdout.write(token.content);
    continue;
  }

  for (const block of token.contentBlocks ?? []) {
    if (block.type === "text") {
      process.stdout.write(block.text);
    }
  }
}
```

python版本:

```python
from langchain.agents import create_agent
from langchain.messages import HumanMessage

# 创建智能体
agent = create_agent(
    model = "deepseek:deepseek-v4-flash",
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

  console.log(res.content);
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
  examples: examples, // (或简写为 examples) 示例数据
  prefix: "给出给定词的反义词，有如下示例:", // 示例之前的提示词
  suffix: "基于示例告诉我: {inputword}的反义词是?", // 示例之后的提示词
  inputVariables: ["inputword"], // 声明在前缀或者后缀中所需要注入的变量名
});

// 得到提示词
const promptText = await fewShotPromptTemplate.invoke({ inputword: "left" });
console.log(JSON.stringify(promptText.toString()));

// 访问模型
const model = new ChatOpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  configuration: {
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  },
  model: "qwen-plus",
});
const response = await model.invoke(promptText);
console.log(response.content);
// console.log(JSON.stringify(response.content));
```

### 模板类的`format`与`invoke`方法

`PromptTemplate`和`FewShotPromptTemplate`以及`ChatPromptTemplate`都拥有`format`和`invoke`方法.

|        | format                             | invoke                                                            |
| ------ | ---------------------------------- | ----------------------------------------------------------------- |
| 功能   | 纯字符串替换，解析占位符生成提示词 | Runnable接口标准方法，解析占位符生成提示词                        |
| 返回值 | `string`                           | `PromptValue` 对象                                                |
| 传参   | `.format({ k: v, k: v })`          | `.invoke({ k: v, k: v })`                                         |
| 解析   | 支持解析 `{variable}` 占位符       | 返回对应 PromptValue；`MessagesPlaceholder` 只在由 `ChatPromptTemplate` 声明并传入相应消息变量时生效 |

`FewShotPromptTemplate` --> `BaseStringPromptTemplate` --> `BasePromptTemplate` --> `Runnable`

```ts
import { FewShotPromptTemplate, PromptTemplate } from "@langchain/core/prompts";
const template = PromptTemplate.fromTemplate("我的邻居是{name},最喜欢{hobby}");
const res = await template.format({ name: "张大明", hobby: "看电影" });
console.log(res, typeof res); // 我的邻居是张大明,最喜欢看电影 string

const resInvoke = await template.invoke({ name: "李四", hobby: "吃饭" });
console.log(resInvoke, typeof resInvoke);
/**
 * StringPromptValue {
  lc_serializable: true,
  lc_kwargs: { value: '我的邻居是李四,最喜欢吃饭' },
  lc_namespace: [ 'langchain_core', 'prompt_values' ],
  value: '我的邻居是李四,最喜欢吃饭'
} object
 */
```

### ChatPromptTemplate

- `PromptTemplate`:通用提示词模板，支持动态注入信息。
- `FewShotPromptTemplate`:支持基于模板注入任意数量的示例信息。
- `ChatPromptTemplate`:支持注入任意数量的历史会话信息。

```ts
import { ChatOpenAI } from "@langchain/openai";
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
  new MessagesPlaceholder("history"), // 使用history占位
  ["human", "请写一首唐诗"],
]);

// 传入
const history: any[] = [
  // 可以是空数组或历史消息
  { role: "human", content: "你来写一首唐诗" },
  { role: "ai", content: "床前明月光, 疑是地上霜, 举头望明月, 低头思故乡" },
  { role: "human", content: "好诗, 再来一个" },
  { role: "ai", content: "锄禾日当午, 汗滴禾下土, 谁知盘中餐, 粒粒皆辛苦" },
];

// 调用（需要提供 history 变量）
const response = await chatPrompt.invoke({ history });

// console.log(response.toChatMessages());
// console.log("============================================================");
// // 输出一下组装的聊天消息
// console.log(response.toString());

// 上面都是组装提示词 这里才是调用模型
let res = await model.invoke(response);
console.log(res.content);
```

---

## LCEL链

### 链的基础用法

`将组件串联，上一个组件的输出作为下一个组件的输入`是LangChain 链 (尤其是 `|` 管道链) 的核心工作原理，这也是链式调用的核心价值: 实现数据的自动化流转与组件的协同工作.

在 TypeScript 中，LCEL 主要组合实现 Runnable 接口的对象；普通函数可以通过 `RunnableLambda` 适配，对象映射可以通过 `RunnableSequence` 等组合。`callable`、`Mapping` 和“子类对象”是 Python 语境的说法，不应直接套到 TypeScript 类型系统。

```ts
import { ChatOpenAI } from "@langchain/openai";
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
  new MessagesPlaceholder("history"), // 使用history占位
  ["human", "请写一首唐诗"],
]);

// 传入
const history: any[] = [
  // 可以是空数组或历史消息
  { role: "human", content: "你来写一首唐诗" },
  { role: "ai", content: "床前明月光, 疑是地上霜, 举头望明月, 低头思故乡" },
  { role: "human", content: "好诗, 再来一个" },
  { role: "ai", content: "锄禾日当午, 汗滴禾下土, 谁知盘中餐, 粒粒皆辛苦" },
];

// Python: chat_prompt_template | model
const chain = chatPrompt.pipe(model); // 组装后的链

console.log(chain.constructor.name);

// Python: res = chain.invoke({"history": history_data})
const res = await chain.invoke({
  history,
});

console.log(res.content);
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

`StringOutputParser` 的作用是：把模型返回的 `AIMessage` 转成普通 `string`。

```ts
import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
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
  new MessagesPlaceholder("history"), // 使用history占位
  ["human", "请写一首唐诗"],
]);

// 传入
const history: any[] = [
  // 可以是空数组或历史消息
  { role: "human", content: "你来写一首唐诗" },
  { role: "ai", content: "床前明月光, 疑是地上霜, 举头望明月, 低头思故乡" },
  { role: "human", content: "好诗, 再来一个" },
  { role: "ai", content: "锄禾日当午, 汗滴禾下土, 谁知盘中餐, 粒粒皆辛苦" },
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

### JsonOutputParser与多模型链

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

// JsonOutputParser 只能解析模型实际返回的合法 JSON；生产代码仍应处理解析失败。

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

```ts
import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import "dotenv/config";
import { RunnableLambda } from "@langchain/core/runnables";
import { AIMessage } from "@langchain/core/messages";

// 使用 LangChain 的 ChatOpenAI
const model = new ChatOpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  model: "qwen3.6-plus",
  configuration: {
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  },
});

// 自定义转换器：模型返回的是 JSON 字符串，需要先解析，再把 name 传给下一个 prompt。
const chatCustomTemplate = RunnableLambda.from((aiMsg: AIMessage) => {
  const parsed = JSON.parse(String(aiMsg.content)) as { name: string };
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

```ts
import { RunnablePassthrough } from "@langchain/core/runnables";
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

// 创建一个记忆
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

---

## 短期记忆

如果这部分是从 `LangChain` 主路径学习，当前更贴近官方文档的入口是：先用 `createAgent({ checkpointer })` 给 Agent 加短期记忆，再去理解底层的 `LangGraph`。

核心点：

- 短期记忆的核心是 `checkpointer`
- 同一个 `thread_id` 表示同一个会话
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
    thread_id: "user-1",
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

console.log(result.messages.at(-1)?.content);
```

::: warning 旧写法说明

`RunnableWithMessageHistory` 以前是给 LCEL 链“自动塞历史”的包装器。新项目如果是按当前 LangChain Agent 路线开发，优先用 `createAgent({ checkpointer })`。

- `RunnableWithMessageHistory` 在原有链的基础上创建带有历史记录功能的新链(新`Runnable`实例)
- `InMemoryChatMessageHistory` 为历史记录提供内存存储 (临时用)

:::

如果你需要：

- 自定义状态结构
- 设计多节点流程
- 精细控制消息如何进入 `prompt`

那就继续往下看更底层的 `LangGraph + StateGraph` 写法。

当前 LangGraph v1 文档推荐使用 `StateSchema + MessagesValue` 定义图状态。下面直接使用这套 API，避免混用旧的 `Annotation.Root` 路径。

### 更底层：LangGraph + StateGraph

```ts
import { ChatOpenAI } from "@langchain/openai";
import {
  JsonOutputParser,
  StringOutputParser,
} from "@langchain/core/output_parsers";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import {
  MemorySaver,
  MessagesValue,
  START,
  StateSchema,
  StateGraph,
} from "@langchain/langgraph";
import { z } from "zod/v4";
import "dotenv/config";

const model = new ChatOpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  model: "qwen3.6-plus",
  configuration: {
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  },
});

const chatPromptFirst = ChatPromptTemplate.fromMessages([
  ["system", "你是一个中文起名助手。可以参考历史对话，但必须严格返回JSON。"],
  new MessagesPlaceholder("history"), // 负责把历史消息真正塞进 prompt。没有这一步，记忆虽然保存了，但模型看不到。
  [
    "human",
    "我的邻居姓:{lastname},刚生了一个{gender}, 请起名, 并封装到JSON格式返回给我。要求key是name，value就是起的名字。只返回JSON。",
  ],
]);

const chatPromptNext = ChatPromptTemplate.fromTemplate(
  "姓名{name}，请帮我解析含义。不要返回md格式，请返回带有换行的文本。",
);

// 第一个chain
// nameChain 本身是一个链
// nameChain 的输出类型是 { name: string }，但 nameChain 本身不是 { name: string }
const nameChain = chatPromptFirst
  .pipe(model)
  .pipe(new JsonOutputParser<{ name: string }>()); //  把前面模型生成的内容，交给 JsonOutputParser 解析成 JSON 对象。;

// console.log("nameChain===>", nameChain);
// 第二个chain
const explainChain = chatPromptNext.pipe(model).pipe(new StringOutputParser());

// 给 LangGraph 定义“图的状态结构” 声明每次 graph 运行时，state 里有哪些字段
// State 让 LangGraph 知道 state 长什么样，并让 TypeScript 知道 state.lastname、state.gender 是字符串。
const State = new StateSchema({
  messages: MessagesValue,
  lastname: z.string(),
  gender: z.string(),
});

//  LangGraph 里的一个节点函数：callModel。它的作用是：根据当前状态里的姓氏、性别和历史消息，先让模型起名，再让模型解释名字含义，最后把这轮对话写回 messages 状态中

/**
 * 1. 从图的状态里取出当前输入
  2. 组装成 prompt 需要的参数
  3. 调用模型，让它根据“姓 + 性别 + 历史上下文”生成结果
 */
const callModel = async (state: typeof State.State) => {
  // 这一步是调用 nameChain 起名字
  const nameResult = await nameChain.invoke({
    history: state.messages,
    lastname: state.lastname,
    gender: state.gender,
  });
  // console.log("nameChain===>", nameChain);

  const answer = await explainChain.invoke({
    name: nameResult.name,
  });

  // 把本次对话结果返回给 LangGraph
  return {
    messages: [
      {
        role: "human",
        content: `姓:${state.lastname}，性别:${state.gender}，请起名并解析含义。`,
      },
      {
        role: "ai",
        content: answer,
      },
    ],
  };
};

//  负责保存状态
const graph = new StateGraph(State)
  .addNode("call_model", callModel)
  .addEdge(START, "call_model")
  .compile({
    checkpointer: new MemorySaver(),
  });

//  thread_id: "user-1" 表示同一个会话。换成 "user-2" 就是另一个独立记忆。
const config = {
  configurable: {
    thread_id: "user-1",
  },
};

const result = await graph.invoke(
  {
    messages: [],
    lastname: "张",
    gender: "女儿",
  },
  config,
);

console.log(result.messages.at(-1)?.content);

// 再次使用同一个 thread_id，checkpointer 会加载这个线程此前保存的短期状态。
const followUp = await graph.invoke(
  {
    messages: [{ role: "human", content: "请再给一个不同的名字。" }],
    lastname: "张",
    gender: "女儿",
  },
  config,
);

console.log(followUp.messages.at(-1)?.content);
```

## 长期记忆

短期记忆用 `checkpointer`，长期记忆用 `LangGraph store`。学习用 `InMemoryStore`，生产用 `PostgresStore / MongoDBStore`。

---

## RAG基础

:::warning 通用的基础大模型存在一些问题

1. LLM的知识不是实时的，模型训练好后不具备自动更新知识的能力，会导致部分信息滞后
2. LLM领域知识是缺乏的，大模型的知识来源于训练数据，这些数据主要来自公开的互联网和开源数据集，无法覆盖特定领域或高度专业化的内部知识
3. 幻觉问题，LLM有时会在回答中生成看似合理但实际上是错误的信息
4. 数据安全性
   :::

RAG (Retrieval Augmented Generation) `检索增强生成`，利用**检索外部文档**提升生成结果质量, 为大模型提供了从特定数据源检索到的信息，以此来修正和补充生成的答案。可以总结为一个公式: RAG = 检索技术 + LLM 提示

![工作流程](/assert/image-langchain/工作流程.png)

RAG的核心工作流程是:
![RAG的核心工作流程](/assert/image-langchain/RAG的核心工作流程.png)

::: tip
RAG 本质上是把“检索”和“生成”组合成一个流程：先检索相关上下文，再让LLM基于上下文生成答案，不只是提示词技巧。
:::

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

在 RAG 里，判断两段文本“语义相似”通常使用余弦相似度算法：向量方向越接近，语义越相似。

### 文档加载器（Document Loaders）

`Document Loaders` 是 LangChain 里用来读取外部资料，并转换成 LangChain 标准 `Document` 对象的工具。

```ts
import { TextLoader } from "@langchain/classic/document_loaders/fs/text";

const textLoader = new TextLoader("./data.txt");
const textDocs = await textLoader.load();
console.log(textDocs);

// PDF
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

const pdfLoader = new PDFLoader("./example.pdf");
const pdfDocs = await pdfLoader.load();
```

常见的文档加载器有：

- TextLoader：从文本文件中加载
- PDFLoader：从 PDF 文件中加载
- JSONLoader：从 JSON 文件中加载
- CSVLoader：从 CSV 文件中加载 [官方文档](https://docs.langchain.com/oss/javascript/integrations/document_loaders/file_loaders/csv/)

```ts
// CSVLoader
// 安装  npm install @langchain/community d3-dsv@2
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";

const csvLoader = new CSVLoader("./data/users.csv");
const csvDocs = await csvLoader.load();

console.log(csvDocs[0].pageContent);
console.log(csvDocs[0].metadata);

// name age city

// 如果你的 CSV 不是逗号分隔，而是 ; 或 |，可以指定分隔符：
const semicolonLoader = new CSVLoader("./data/users.csv", {
  separator: ";",
});
```

### RecursiveCharacterTextSplitter

`RecursiveCharacterTextSplitter` 是 LangChain 里最常用的文本切分器，主要用于 RAG: 把一大段文本切成多个较小的 chunk，方便后续做 embedding、存向量库、检索。它的核心思想是：尽量按自然边界切分文本。默认会按类似这样的优先级递归切: `["\n\n", "\n", " ", ""]`

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

const markdownSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500, // 表示每个 chunk 的最大长度。默认按字符长度计算，不是 token。
  chunkOverlap: 50, // 表示相邻 chunk 之间重叠多少字符。重叠的作用是保留上下文，避免重要信息刚好被切断。
});

// splitDocuments 会保留原来的 metadata，这对 RAG 很重要。比如后续检索到某个 chunk 时，你还能知道它来自哪个文件、哪一页、哪一行。
const splitDocs = await splitter.splitDocuments(docs);

console.log(splitDocs[0].pageContent);
console.log(splitDocs[0].metadata);

// 自定义切分符
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 50,
  // 这表示优先按 Markdown 二级标题切，再按段落、换行、空格切。
  separators: ["\n## ", "\n\n", "\n", " ", ""],
});
```

### 向量存储（Vector Store）

[官方 LangChain JS Vector Store](https://docs.langchain.com/oss/javascript/integrations/vectorstores)

安装: `npm install @langchain/classic`

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

::: warning 注意

- JavaScript 的 `MemoryVectorStore` 不支持 `delete`
- Python 的 `InMemoryVectorStore` 支持 `delete(ids=[...])`

如果在 JavaScript 里需要按 id 删除文档，应该改用 `Chroma`、`Qdrant`、`Pinecone` 这类支持持久化和删除能力的向量存储。

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

`Chroma` 是一个真正的向量数据库，常用于 RAG。它和 `MemoryVectorStore` 最大区别是：`MemoryVectorStore` 只存在`内存`里，程序停了就没；`Chroma` 是一个独立的向量数据库服务，可以持久化保存数据。

[LangChain JS Chroma 文档](https://docs.langchain.com/oss/javascript/integrations/vectorstores/chroma)

- 安装: `npm install @langchain/community chromadb` `npm install @langchain/openai @langchain/core `
- 启动 Chroma 服务: `npx chroma run` 默认会启动在: `http://localhost:8000`
- 基本用法:

::: tip 说明

截至 2026-06-02，LangChain 官方 JavaScript Chroma 文档仍使用 `@langchain/community/vectorstores/chroma` 作为导入路径。

也就是说，下面这段示例和当前官方文档是一致的。

:::

```ts
import "dotenv/config";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";

const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.DASHSCOPE_API_KEY,
  model: "text-embedding-v4",
  configuration: {
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  },
});

const vectorStore = new Chroma(embeddings, {
  collectionName: "my_docs", // 数据库里的“表名” 不同 collection 存不同的知识库
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
  console.log(score);
  console.log(doc.pageContent);
  console.log(doc.metadata);
}

// 按 metadata 过滤
const filteredResults = await vectorStore.similaritySearch("什么是 LangChain？", 2, {
  // 表示只在 metadata.type === "framework" 的文档里搜索
  type: "framework",
});

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
