# RAG 完整知识与代码示例

本文档是自包含归档版，完整汇总 RAG 概念、分步笔记、复习内容、Python/TypeScript 手写 Demo、LangChain TypeScript 骨架、示例知识库和配置文件。上传知识库后，不需要依赖原始文件夹。

---

## RAG 完全指南：从零到能跑通

---
title: RAG 完全指南（从零到能跑通）
outline: deep
---

# RAG 完全指南：从零到能跑通

> 一句话定位：读完这一篇，你能讲清楚 RAG 是什么、每个部件在干嘛，并且能亲手跑通一个最小 RAG demo，看懂它为什么这样工作。
>
> 阅读方式：第 1~8 章建立概念，第 9 章动手跑代码，第 10 章往真实框架（LangChain）迁移，第 11 章之后是评估、优化、排错和速记卡。

## 0. 这篇能带你到哪

学完你应该能做到这四件事：

1. 用一分钟向别人解释清楚 RAG 是什么、解决什么问题
2. 画出从「原始文档」到「最终回答」的完整数据流
3. 在本地亲手跑通一个最小 RAG demo，并看到它检索了哪些内容
4. 知道回答错了应该先查哪里（检索 or 生成）

如果你连 Python 都不熟，先补这几样最基础的就够了：变量、函数、列表/字典、读写文件、安装依赖、调用一个 API。不用先学复杂工程。

---

## 1. 什么是 RAG

RAG 是 `Retrieval-Augmented Generation`（检索增强生成）的缩写。它做三件事：

1. 先从知识库里**找**相关内容
2. 把这些内容**喂**给大模型
3. 让大模型**基于这些内容**回答问题

最形象的理解：

> **RAG = 让大模型进行一次临时开卷考试。**

### 为什么需要 RAG

普通大模型有三个天生的限制：

- 它不知道你的私有资料（公司制度、内部文档）
- 缺少事实依据时，它可能会胡乱猜测
- 它自带的知识可能已经过时

RAG 就是在每次提问时，**临时**给模型补充外部知识，让回答有依据。

### 一个直观例子

公司手册里写着：

> 「员工年假原则上应在当年使用完毕，特殊情况经审批后可顺延至次年第一季度。」

用户问：「年假可以跨年吗？」

- **没有 RAG**：模型只能凭印象猜。
- **有 RAG**：系统先检索到这段原文，模型基于它回答「原则上当年用完，审批后可顺延到次年第一季度」。

### 记住这几点

- RAG 是让模型**使用外部知识**，不是训练模型
- 主要用于「基于资料回答问题」
- **检索质量直接决定回答质量**——检索错了，再强的模型也救不回来

---

## 2. RAG 不等于微调（最重要的辨析）

这是初学者最容易混的一组概念。

| | RAG | 微调（Fine-tuning） |
|---|---|---|
| 本质 | 回答前临时查资料 | 用你的数据继续训练模型 |
| 改不改模型参数 | **不改** | **会改** |
| 适合做什么 | 知识库问答、需要引用原文 | 改回答风格 / 格式 / 任务能力 |
| 知识更新 | 重建知识库即可，灵活 | 要重新训练，重 |
| 成本 | 低，易落地 | 高（要数据、算力、训练、评估） |

一句话记忆：

> **RAG = 临时给资料；微调 = 直接改模型。**

判断方法：

- 想让模型**基于某批文档回答问题** → 先想 RAG
- 想让模型**长期固定某种风格 / 格式 / 任务模式** → 才考虑微调

常见判断题：「想让模型稳定输出某种 JSON 格式，该用 RAG 还是微调？」
答案：**都不是先想到的**。优先级是「先 prompt 明确格式 → 再用结构化输出 / schema 约束 → 长期还不稳定才考虑微调」。因为 JSON 格式是「输出怎么控制」的问题，不是「知识从哪来」的问题。

---

## 3. RAG 的核心组成

大多数 RAG 系统都由这 7 个部件构成：

| 部件 | 职责 | 一句话 |
|---|---|---|
| 1. 文档 | 原始知识来源（PDF / 网页 / Markdown / Word / 数据库） | 所有处理的起点 |
| 2. Chunk 切分 | 把大文档切成小文本块 | 让检索更精确 |
| 3. Embedding | 把文本转成语义向量 | 让系统按「意思」搜，而不只是关键词 |
| 4. 向量数据库 | 存 chunk、向量、元数据，支持相似度搜索 | 存和查语义向量的地方 |
| 5. 检索器 | 根据问题找出最相关的 chunk | 决定给模型什么证据 |
| 6. Prompt | 把上下文 + 问题 + 规则组织成模型输入 | 组织证据 |
| 7. 大模型 | 基于 Prompt 生成最终答案 | 输出答案 |

注意分工：**大模型不负责去数据库里搜**，它只负责基于已经给它的上下文组织回答。

---

## 4. RAG 数据流：离线 + 在线两个阶段

这是 RAG 最该刻进脑子的一张图。RAG 分两个阶段：

### 离线阶段（准备知识库，用户提问之前）

```
文档  →  清洗  →  Chunk 切分  →  生成 Embedding  →  存入向量数据库
```

- **收集文档**：产品手册、公司制度、FAQ、研究笔记
- **清洗**：去乱码、去重、修复格式，**保留标题/来源/章节等元数据**（元数据在过滤检索和追溯原文时非常有用，别丢）
- **切分 / 向量化 / 入库**：见下文

### 在线阶段（回答用户问题）

```
问题  →  问题向量化  →  检索相似 chunk  →  构造 Prompt  →  模型生成答案
```

### 关键认知

> **离线准备决定基础，在线回答决定体验。**

很多 RAG 的质量问题，在「生成」之前就已经产生了（文档脏、chunk 切坏、检索没命中）。所以排查问题要往前看，不要只盯着最后那句回答。

---

## 5. 主链路逐个拆解

### 5.1 Chunk 切分

**Chunk** 就是从文档切出来的一小段文本。为什么不直接拿整篇去检索？

- 整篇太长、噪声多
- 用户问题通常只对应文档的一小部分
- 检索在小单位上更准

**chunk 大小的取舍**：

- 太大 → 噪声多、相似度匹配变钝、prompt 塞进废话
- 太小 → 上下文不完整、关键句被拆散、回答片面

**三种常见切法**：

| 切法 | 优点 | 缺点 |
|---|---|---|
| 固定长度（每 N 字符/token） | 简单 | 可能把句子切断 |
| 按段落 | 语义更完整 | 段落长度不稳定 |
| 按句子/标题结构 | 最贴合文档逻辑 | 实现更复杂 |

**Overlap（重叠）**：相邻 chunk 共享一部分内容（比如每段 500 字、overlap 100 字），目的是避免关键信息刚好被切在边界上。

初学起手策略：**先按段落切 → 段落太长再按固定长度切 → 加少量 overlap。**

### 5.2 Embedding 向量化

**Embedding** = 把一段文本映射成一串表示其语义的数字向量，比如 `[0.12, -0.48, 1.03, ...]`（示意，不代表真实长度）。

这串数字不是给人看的，是给计算机做**相似度计算**用的：

> 语义接近的文本，会被映射到位置接近的向量。

**为什么需要它（关键词检索不够用）**：

- 问题写「离职流程」
- 文档写「员工解除劳动关系手续」
- 词不同但意思接近 —— embedding 更有机会把它找出来

**在 RAG 里怎么用**：

- 离线：每个 chunk 转成一个向量
- 在线：用户问题也转成向量，拿它去找最相似的 chunk 向量

**Embedding 不是万能的**，它在这些场景容易翻车：专业术语理解不准、短文本歧义、数字/代码/编号类匹配不稳定。所以真实系统常把向量检索 + 关键词检索结合（见 5.4）。

### 5.3 向量数据库

存三样东西：chunk 文本、对应向量、元数据。支持「拿一个问题向量去找最相近的几个 chunk 向量」。

> **向量数据库 = 存和查语义向量的地方。**

### 5.4 检索机制（决定系统上限的一步）

检索器要回答三个问题：**去哪里找 / 怎么找 / 返回几条**。

**三种检索方式**：

- **向量检索**：按 embedding 语义相似度找，对语义问题友好，不依赖完全相同的关键词
- **关键词检索**（如 BM25）：按词项出现情况找，对专有名词、编号、精确术语更稳
- **混合检索**：向量 + 关键词结合，实际系统里很常见

**Top-k**：最终返回前 k 个最相关的 chunk。

- k 太小 → 可能漏掉关键信息
- k 太大 → 噪声多、token 成本高、模型更容易分心

**两个必须分清的词**：

- **召回**：该找回来的内容有没有找回来
- **精度**：找回来的内容是不是大多真的相关

> RAG 最怕「没召回到正确内容」——因为模型再强也编不出可靠依据。

**为什么说检索决定上限**：

> **生成层决定表达质量，检索层决定事实基础。** 检索错了或不全，模型只能答错、答含糊，或被噪声误导。

### 5.5 生成回答

生成阶段的输入通常有三部分：**系统指令（回答规则） + 检索到的上下文 + 用户问题**。

**Prompt 在这里的核心作用**不只是「让模型回答」，而是：

> **规定模型应该根据什么回答、怎么回答、什么时候拒绝乱答。**

一条最核心的生成原则：

> **有依据再回答，没依据就承认不知道。**

**为什么检索对了，生成还可能错**：

- 模型没老实依据上下文
- 模型自己补了原文没有的内容
- prompt 约束不清
- 上下文太长，模型抓错重点
- 多个 chunk 之间有冲突，模型整合失败

所以要学会区分问题出在哪：

- 知识库原文就错 → **数据问题**
- 没检索到关键 chunk → **检索问题**
- 检索到了正确内容但答偏了 → 才更像**生成问题**

---

## 6. 最小 RAG 系统：到底需要什么

一个「最小可用」的 RAG 只需要 5 样东西：

1. 一小批文档
2. 一种 chunk 切分方法
3. 一个 embedding 方式
4. 一个向量数据库 / 检索存储层
5. 一个负责回答的大模型

**第一版要证明的唯一一件事**：

> 系统能够根据我的文档回答问题，而不是让模型瞎猜。

**第一版不需要**：多智能体、高级 reranker、混合检索、查询改写、微调、分布式基础设施。

**跑通的标志**：能为简单问题找到相关 chunk；答案能对应到检索文本；你能看到系统用了哪个 chunk；答错时你能追查是检索问题还是切分问题。

> **可观察性比复杂度更重要。**

---

## 7. 动手实战：跑通一个最小 RAG（零依赖手写版）

下面是一个**零依赖**的最小 RAG demo，Python 和 TypeScript 两个版本逻辑完全一致，挑你顺手的语言即可。它用「词频向量 + 余弦相似度」代替真实 embedding——这不是生产方案，只是为了让你在不装任何库、不花一分钱的情况下，先把整条链路跑通、看清楚。

### 7.1 准备知识库 `data/knowledge.txt`（两个版本共用）

```text
公司请假制度

员工年假原则上应当在当年使用完毕。特殊情况经主管审批后，可以顺延至次年第一季度。

病假需要提供医院开具的相关证明材料。病假期间的薪资按照公司制度和当地劳动规定执行。

事假一般需要提前提交申请，并说明事由。未经审批擅自缺勤，可能按旷工处理。

账号与密码管理

员工忘记系统密码时，应先进入公司统一身份认证页面，点击"忘记密码"入口。

密码重置通常需要验证工号、绑定手机或企业邮箱。验证通过后，系统会允许用户设置新密码。
```

### 7.2 Python 版 `app.py`

```python
from __future__ import annotations
import math, re, sys
from collections import Counter
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
KNOWLEDGE_FILE = BASE_DIR / "data" / "knowledge.txt"
TOP_K = 2

def load_knowledge(path: Path) -> str:
    return path.read_text(encoding="utf-8")

# 按空行把整篇文本切成多个 chunk（最简单的「按段落切」）
def split_into_chunks(text: str) -> list[str]:
    return [c.strip() for c in re.split(r"\n\s*\n", text) if c.strip()]

# 简化版切词：英文按词，中文额外做双字切片，让中文检索更容易命中
def tokenize(text: str) -> list[str]:
    lowered = text.lower()
    tokens = re.findall(r"[a-z0-9_]+", lowered)
    for part in re.findall(r"[一-鿿]+", lowered):
        if len(part) >= 2:
            tokens.append(part)
            tokens.extend(part[i:i+2] for i in range(len(part) - 1))
        else:
            tokens.append(part)
    return tokens

# 把文本变成词频向量（真实 RAG 这一步是 embedding 模型干的）
def vectorize(text: str) -> Counter[str]:
    return Counter(tokenize(text))

def cosine_similarity(a: Counter[str], b: Counter[str]) -> float:
    common = set(a) & set(b)
    dot = sum(a[w] * b[w] for w in common)
    norm_a = math.sqrt(sum(v * v for v in a.values()))
    norm_b = math.sqrt(sum(v * v for v in b.values()))
    return 0.0 if norm_a == 0 or norm_b == 0 else dot / (norm_a * norm_b)

# 检索：对问题和每个 chunk 算相似度，取 top-k
def retrieve(question: str, chunks: list[str], top_k: int = TOP_K):
    qv = vectorize(question)
    scored = [(cosine_similarity(qv, vectorize(c)), c) for c in chunks]
    scored.sort(key=lambda x: x[0], reverse=True)
    return scored[:top_k]

# 生成：本 demo 用规则拼接代替真实模型；没命中就老实说不知道
def generate_answer(question: str, retrieved) -> str:
    best = retrieved[0][0] if retrieved else 0.0
    if best == 0.0:
        return "我没有在知识库中找到足够相关的内容，无法可靠回答。"
    context = "\n\n".join(c for _, c in retrieved)
    return f"你的问题：{question}\n\n检索到的相关内容：\n{context}\n\n请优先参考以上原文片段。"

def main() -> None:
    chunks = split_into_chunks(load_knowledge(KNOWLEDGE_FILE))
    print(f"[系统] 共切分出 {len(chunks)} 个 chunks")
    question = " ".join(sys.argv[1:]).strip() or "年假可以跨年吗？"
    results = retrieve(question, chunks)
    print("\n[系统] 检索结果：")
    for i, (score, chunk) in enumerate(results, 1):
        print(f"\nTop {i} | score={score:.4f}\n{chunk}")
    print("\n[系统] 最终回答：\n" + generate_answer(question, results))

if __name__ == "__main__":
    main()
```

### 7.3 运行 Python 版

```bash
python app.py "年假可以跨年吗？"
```

你会看到：切出了几个 chunk → 检索到哪两段、分数多少 → 基于这两段拼出的回答。**重点不是回答多漂亮，而是你能看到「它用了哪些证据」**，这就是 RAG 可观察性的起点。

### 7.4 同一套逻辑的 TypeScript 版 `app.ts`

逻辑和 Python 版完全一致，只是换成 TypeScript，适合前端 / Node 同学。同样零依赖，用 Node 内置的 `fs`/`path` 读文件即可。

```ts
import * as fs from "fs";
import * as path from "path";

type Vector = Map<string, number>;
type RetrievalResult = { score: number; chunk: string };

const baseDir = path.resolve(__dirname, "..");
const knowledgeFile = path.join(baseDir, "data", "knowledge.txt");
const topK = 2;

function loadKnowledge(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8");
}

// 按空行把整篇文本切成多个 chunk（最简单的「按段落切」）
function splitIntoChunks(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
}

// 简化版切词：英文按词，中文额外做双字切片，让中文检索更容易命中
function tokenize(text: string): string[] {
  const lowered = text.toLowerCase();
  const tokens: string[] = lowered.match(/[a-z0-9_]+/g) ?? [];
  const chineseParts: string[] = lowered.match(/[一-鿿]+/g) ?? [];
  for (const part of chineseParts) {
    if (part.length >= 2) {
      tokens.push(part);
      for (let i = 0; i < part.length - 1; i += 1) {
        tokens.push(part.slice(i, i + 2));
      }
    } else {
      tokens.push(part);
    }
  }
  return tokens;
}

// 把文本变成词频向量（真实 RAG 这一步是 embedding 模型干的）
function vectorize(text: string): Vector {
  const vector: Vector = new Map();
  for (const token of tokenize(text)) {
    vector.set(token, (vector.get(token) ?? 0) + 1);
  }
  return vector;
}

function cosineSimilarity(a: Vector, b: Vector): number {
  let dot = 0, normA = 0, normB = 0;
  for (const v of a.values()) normA += v * v;
  for (const v of b.values()) normB += v * v;
  for (const [token, valueA] of a.entries()) {
    const valueB = b.get(token);
    if (valueB !== undefined) dot += valueA * valueB;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// 检索：对问题和每个 chunk 算相似度，取 top-k
function retrieve(question: string, chunks: string[], limit = topK): RetrievalResult[] {
  const qv = vectorize(question);
  const scored = chunks.map((chunk) => ({ score: cosineSimilarity(qv, vectorize(chunk)), chunk }));
  scored.sort((l, r) => r.score - l.score);
  return scored.slice(0, limit);
}

// 生成：本 demo 用规则拼接代替真实模型；没命中就老实说不知道
function generateAnswer(question: string, retrieved: RetrievalResult[]): string {
  const best = retrieved[0]?.score ?? 0;
  if (best === 0) return "我没有在知识库中找到足够相关的内容，无法可靠回答。";
  const context = retrieved.map((r) => r.chunk).join("\n\n");
  return `你的问题：${question}\n\n检索到的相关内容：\n${context}\n\n请优先参考以上原文片段。`;
}

function main(): void {
  const chunks = splitIntoChunks(loadKnowledge(knowledgeFile));
  console.log(`[系统] 共切分出 ${chunks.length} 个 chunks`);
  const question = process.argv.slice(2).join(" ").trim() || "年假可以跨年吗？";
  const results = retrieve(question, chunks);
  console.log("\n[系统] 检索结果：");
  results.forEach((r, i) => {
    console.log(`\nTop ${i + 1} | score=${r.score.toFixed(4)}\n${r.chunk}`);
  });
  console.log("\n[系统] 最终回答：\n" + generateAnswer(question, results));
}

main();
```

运行（需要先装 Node.js 和 ts-node，或先用 `tsc` 编译成 js 再 `node` 运行）：

```bash
npx ts-node src/app.ts "年假可以跨年吗？"
```

两个版本输出一致：切出几个 chunk → 检索到哪两段、分数多少 → 基于这两段拼出的回答。挑你顺手的语言跑就行。

---

## 8. 往真实框架迁移：LangChain 版

手写版帮你理解原理，但它有两个「假」的地方：用词频向量代替真实 embedding，用规则拼接代替真实模型。真实 RAG 会把这些换成标准组件。**RAG 是方法，LangChain 是实现这个方法的框架——LangChain 没有发明 RAG，只是把零散步骤封装成可替换的组件。**

### 8.1 手写版 → LangChain 的一一对应

| 手写版 | LangChain 组件 | 它负责什么 |
|---|---|---|
| `loadKnowledge` | `TextLoader`（Document Loader） | 从 txt/pdf/网页等读取，统一成文档对象 |
| `splitIntoChunks` | `RecursiveCharacterTextSplitter` | 切分，控制 chunk size 和 overlap |
| `tokenize + vectorize` | `OpenAIEmbeddings`（Embedding 模型） | 把文本变成**真实**语义向量 |
| `retrieve` | `MemoryVectorStore + Retriever` | 向量库存和查，retriever 统一返回相关文档 |
| `generateAnswer` | `ChatPromptTemplate + ChatOpenAI` | 组织 prompt，交给真实模型生成自然语言答案 |

差距最大的是最后一步：手写版只是拼字符串，LangChain 版是真的让大模型生成回答。

### 8.2 TypeScript 版 `src/app.ts`

> 前置：`npm i @langchain/community @langchain/core @langchain/openai @langchain/textsplitters langchain`，并设置环境变量 `OPENAI_API_KEY`（这一步会**真实调用 OpenAI、产生费用**，需要你自己的 API key）。

```ts
import { TextLoader } from "@langchain/community/document_loaders/fs/text";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

const knowledgePath = new URL("../data/knowledge.txt", import.meta.url).pathname;
const question = process.argv.slice(2).join(" ").trim() || "年假可以跨年吗？";

async function main() {
  // 1. Loader：对应手写版 loadKnowledge
  const docs = await new TextLoader(knowledgePath).load();

  // 2. Splitter：对应 splitIntoChunks
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 120, chunkOverlap: 20 });
  const splitDocs = await splitter.splitDocuments(docs);

  // 3. Embeddings + Vector Store：对应 tokenize+vectorize+部分 retrieve
  const vectorStore = await MemoryVectorStore.fromDocuments(splitDocs, new OpenAIEmbeddings());

  // 4. Retriever：对应 retrieve
  const retriever = vectorStore.asRetriever(2);
  const retrievedDocs = await retriever.invoke(question);

  // 5. Prompt：对应 generateAnswer 里「组织输入」那部分
  const context = retrievedDocs.map((d) => d.pageContent).join("\n\n");
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "你只能根据提供的上下文回答。如果上下文不足，请明确说明。"],
    ["human", "上下文如下：\n{context}\n\n问题如下：\n{question}"],
  ]);
  const messages = await prompt.formatMessages({ context, question });

  // 6. Chat Model：对应 generateAnswer 里「最终回答」那部分
  const model = new ChatOpenAI({ model: "gpt-4o-mini" });
  const response = await model.invoke(messages);
  console.log("最终回答:\n", response.content);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
```

运行：`npx ts-node src/app.ts "年假可以跨年吗？"`

### 8.3 Python 版 `app.py`

逻辑和上面的 TS 版完全一一对应，挑你顺手的语言即可。

> 前置：`pip install langchain langchain-openai langchain-community`，并设置环境变量 `OPENAI_API_KEY`（同样会**真实调用 OpenAI、产生费用**）。

```python
import os
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import InMemoryVectorStore
from langchain_core.prompts import ChatPromptTemplate

KNOWLEDGE_PATH = os.path.join(os.path.dirname(__file__), "data", "knowledge.txt")
question = "年假可以跨年吗？"


def main() -> None:
    # 1. Loader：对应手写版 load_knowledge
    docs = TextLoader(KNOWLEDGE_PATH, encoding="utf-8").load()

    # 2. Splitter：对应 split_into_chunks
    splitter = RecursiveCharacterTextSplitter(chunk_size=120, chunk_overlap=20)
    split_docs = splitter.split_documents(docs)

    # 3. Embeddings + Vector Store：对应 tokenize + vectorize + 部分 retrieve
    vector_store = InMemoryVectorStore.from_documents(split_docs, OpenAIEmbeddings())

    # 4. Retriever：对应 retrieve
    retriever = vector_store.as_retriever(search_kwargs={"k": 2})
    retrieved_docs = retriever.invoke(question)

    # 5. Prompt：对应 generate_answer 里「组织输入」那部分
    context = "\n\n".join(d.page_content for d in retrieved_docs)
    prompt = ChatPromptTemplate.from_messages([
        ("system", "你只能根据提供的上下文回答。如果上下文不足，请明确说明。"),
        ("human", "上下文如下：\n{context}\n\n问题如下：\n{question}"),
    ])
    messages = prompt.format_messages(context=context, question=question)

    # 6. Chat Model：对应 generate_answer 里「最终回答」那部分
    model = ChatOpenAI(model="gpt-4o-mini")
    response = model.invoke(messages)
    print("最终回答:\n", response.content)


if __name__ == "__main__":
    main()
```

运行：`python app.py`

### 8.4 为什么要先学手写版再学 LangChain

如果一上来就学 LangChain，你只会背 loader / splitter / embeddings / vector store / retriever / chain 这些词，却不知道它们在解决什么问题，把框架当黑盒。先写手写版，你会知道**每一步为什么存在、出错会怎么坏**，以后看 LangChain 就不会发懵。

> **手写版学原理，LangChain 版学工程组件怎么拼起来。**

---

## 9. Vector Store 和 Retriever 为什么要拆开

在手写版里 `retrieve` 一个函数干了两件事，但 LangChain 把它拆成两层：

| | Vector Store | Retriever |
|---|---|---|
| 角色 | 底层数据层（像仓库） | 上层检索接口（像前台取货窗口） |
| 负责 | 存向量/文本/元数据、按相似度查 | 接收问题，调底层，统一返回相关文档 |
| 关心 | 数据怎么存、相似度怎么查 | 给上层统一调用方式，屏蔽底层差异 |

拆开的核心原因：**Retriever 不一定来自向量库**——它也可以来自关键词搜索、API、SQL、混合检索。上层的 prompt / chain / agent 只关心「给我一批相关文档」，不关心底层是 Pinecone 还是 Qdrant。拆层之后组件可替换、接入更灵活。

一句话记忆：

> **Vector Store = 存和查；Retriever = 问题进来，统一返回相关文档。**

---

## 10. RAG 评估：必须分层看

不要只看「回答顺不顺」。回答不好，可能坏在文档、chunk、embedding、检索、prompt、生成任何一环。不分层评估，你只知道「结果不好」，却不知道坏在哪。

**分三层看**：

1. **检索评估**：正确 chunk 有没有被召回？排名靠不靠前？噪声多不多？
2. **生成评估**：回答是否基于检索内容？有没有胡编？是否准确回应了问题？
3. **端到端评估**：从用户视角看，答案有没有用、可不可信、覆盖关键点了吗？

**初学者最容易犯的错**：只看回答顺不顺、不检查引用是否真支持答案、不保存检索中间结果。

> **RAG 评估必须分层。先看检索，再看生成，再看整体。**

---

## 11. RAG 优化方向

前提原则：

> **先跑通，再优化。** 基础链路没跑稳就做复杂优化，只会把问题藏起来。

五个常见方向：

1. **文档质量**：去重、清洗脏数据、保留标题/章节/来源元数据
2. **Chunk 策略**：调大小、调 overlap、按自然结构切
3. **检索**：调 top-k、用混合检索、加 rerank（重排序）
4. **Prompt**：强化「仅基于上下文回答」、规范格式、证据不足时要求拒答
5. **成本与速度**：限制上下文长度、减少无关 chunk、做缓存

两条现实经验：

- 真正有效的优化往往不是「更复杂」，而是**数据更干净、chunk 更合理、检索更准**
- **每次只改一个变量**，方便对比效果

> **大部分收益来自基础环节，不是花哨技巧。**

---

## 12. RAG 为什么会失败 + 排查顺序

常见失败原因：文档质量差、chunk 切分不合理、embedding 表示不好、检索错、检索噪声过多、prompt 约束不清、模型脱离上下文乱补。

排查顺序建议：

> **先看检索，再看生成。**

---

## 13. 学习路线（4 阶段）

1. **只做最小 demo**：读文档 → 切 chunk → 检索 → 回答，先跑通
2. **让系统可观察**：打印检索结果、显示来源、显示 top-k chunk
3. **开始评估**：准备一组测试问题，人工检查检索质量和回答是否有依据
4. **开始优化**：调 chunk 大小、top-k、prompt，再尝试混合检索

> **先跑通，再观察，再评估，再优化。** 可运行、可观察、可解释，比「高级」更重要。

---

## 14. 速记卡（背这些句子就够）

- `RAG = 先检索，再生成`
- `RAG 管的是「知识从哪里来」`
- `文档 → chunk → embedding → 向量库 → 检索 → 生成`
- `离线准备决定基础，在线回答决定体验`
- `检索决定上限：生成决定怎么说，检索决定有什么可说`
- `检索方式有三种：向量、关键词、混合`
- `检索最怕漏召回，其次怕精度差`
- `Chunk 设计很关键，切法影响语义完整度；不是越大越好也不是越小越好`
- `Embedding 是文本的语义向量，但对术语/短文本/编号不稳`
- `有依据再回答，没依据就承认不知道`
- `RAG ≠ 微调（临时给资料 vs 直接改模型）`
- `RAG ≠ LangChain（方法 vs 框架）`
- `Vector Store = 存和查；Retriever = 统一返回相关文档`
- `先看检索，再看生成`
- `先跑通，再优化，每次只改一个变量`

---

## 15. 术语表

| 术语 | 一句话解释 |
|---|---|
| RAG | 先检索资料、再让模型基于资料回答的方法 |
| Chunk | 从文档切出来的一小段文本 |
| Overlap | 相邻 chunk 之间保留的重叠内容，防止关键信息被切断 |
| Embedding | 文本的语义向量表示，用来做相似度计算 |
| 向量数据库 | 存 chunk/向量/元数据并支持相似度搜索的地方 |
| 检索器（Retriever） | 根据问题返回相关文档的接口层 |
| Vector Store | 底层存储与相似度搜索层 |
| Top-k | 检索最终返回的前 k 个最相关 chunk |
| 召回 | 该找回来的内容有没有找回来 |
| 精度 | 找回来的内容是不是大多真的相关 |
| Prompt | 把上下文+问题+规则组织成模型输入 |
| 微调 | 用自己的数据继续训练模型，会改参数 |
| 2-step RAG | 先检索、再生成的最基础 RAG 结构 |


---

## RAG 学习路径

# RAG 学习路径

这个文件夹用于系统学习 RAG，从零基础一直到能够自己做出可用的 RAG 项目。

## 推荐学习顺序

1. `00-先学什么.md`
2. `01-什么是RAG.md`
3. `01A-什么是微调.md`
4. `02-RAG核心组成.md`
5. `03-RAG数据流.md`
6. `04-最小RAG系统.md`
7. `05-Chunk切分.md`
8. `06-Embedding向量化.md`
9. `07-检索机制.md`
10. `08-生成回答.md`
11. `09-RAG评估.md`
12. `10-RAG优化.md`
13. `11-项目实战路线.md`
14. `12-LangChain和手写Demo的对应关系.md`
15. `13-为什么VectorStore和Retriever要拆开.md`
16. `14-LangChain版代码结构.md`
17. `15-Prompt和ChatModel怎么接在Retriever后面.md`

## 学习方式

- 按顺序一次只看一个文件。
- 每学完一步，都用自己的话回答“复习问题”。
- 不要跳过“动手目标”。
- 把自己仍然不理解的点记下来。

## 当前起点

先看 `00-先学什么.md`，然后再按顺序继续。


---

## 第 0 步：你现在应该先学什么

# 第 0 步：你现在应该先学什么

## 学习目标

搞清楚零基础学 RAG 时，哪些东西该先学，哪些东西先不要碰。

## 先给你结论

你现在不用先学这些：

- 微调
- 复杂 prompt 工程
- schema 约束
- 混合检索
- rerank
- agent

你现在最该先学的，只有两层：

### 第一层：大模型最基本的工作方式

你要先知道：

- 用户输入问题
- 模型接收提示词
- 模型生成回答

你至少要理解两个词：

- `Prompt`：你发给模型的指令和内容
- `Context`：提供给模型参考的上下文

这里先不用学很深，只要知道“模型是根据输入内容回答”的就够了。

### 第二层：RAG 主链路

你要先学懂：

1. 文档是什么
2. chunk 是什么
3. embedding 是什么
4. 向量数据库是干什么的
5. 检索器怎么找内容
6. 大模型怎么根据检索结果回答

这才是你眼下真正的重点。

## 为什么现在不要先学微调

因为微调是“改模型本身”。

而你现在连：

- 模型平时怎么回答
- RAG 怎么把资料送给模型
- 检索为什么会影响答案

这些基本链路都还没建立。

这时候去看微调，容易把很多概念混在一起。

## 为什么现在不要先学 schema

因为 schema 解决的是：

`输出格式怎么约束`

比如强制模型输出 JSON。

但你现在最关键的问题不是“格式怎么控制”，而是：

`RAG 到底怎么把资料找出来并交给模型`

没有这条主链路，先学 schema 收益很低。

## 零基础最合适的学习顺序

### 阶段 1：只学概念

目标：

- 搞懂 RAG 在做什么

只学这些词：

- RAG
- 文档
- chunk
- embedding
- 向量数据库
- 检索
- 生成

### 阶段 2：只做最小 demo

目标：

- 跑通一条最短链路

只要求：

- 有文档
- 能切分
- 能检索
- 能回答

### 阶段 3：再学回答控制

目标：

- 让模型更听话

这时候再看：

- prompt 约束
- 结构化输出
- schema

### 阶段 4：最后再看微调

目标：

- 理解什么时候真的需要训练模型

这时候再看微调，才不会和 RAG 混淆。

## 如果你还没有编程基础

如果你连 Python 也不熟，那就在学 RAG 的同时补下面这些最基础内容：

- 变量、函数、列表、字典
- 读写文件
- 安装依赖
- 调用一个 API

只补最基础的，不要先去学复杂工程。

## 你当前这一周最该学什么

你现在只需要专注这 4 个问题：

1. RAG 是什么
2. chunk 是什么
3. embedding 是什么
4. 向量数据库是干什么的

如果这 4 个没搞懂，后面的优化、schema、微调都会变成死记硬背。

## 这一课你必须记住

- 零基础先学主链路，不要先学高级技巧
- 先理解“怎么找资料再回答”
- prompt、schema、微调都应该放到后面
- 当前最重要的是 chunk、embedding、检索

## 复习问题

1. 为什么你现在不该先学微调？
2. 为什么 schema 不该排在最前面？
3. 你当前最该优先搞懂的 4 个概念是什么？

## 动手目标

请你自己写一句话回答：

“我现在最该先学的不是 ____，而是 ____。”


---

## 第 1 步：什么是 RAG

# 第 1 步：什么是 RAG

## 学习目标

理解 RAG 是什么、它解决什么问题、为什么现在很多 AI 应用都会用它。

## 核心定义

RAG 是 `Retrieval-Augmented Generation` 的缩写，中文一般叫“检索增强生成”。

它的意思很简单：

1. 先从知识库中找相关内容
2. 再把这些内容提供给大模型
3. 让大模型基于这些内容回答问题

你可以把 RAG 理解成：

`让大模型进行一次临时开卷考试`

## 为什么需要 RAG

普通大模型有三个常见限制：

- 它不知道你的私有资料
- 当缺少事实依据时，它可能会胡乱猜测
- 它自带的知识可能已经过时

RAG 的作用，就是在回答问题时，临时给模型补充外部知识。

## RAG 不等于微调

这是最关键的区别之一。

- 微调会修改模型参数
- RAG 不修改模型参数
- RAG 是在每次提问时，临时给模型提供参考材料

所以对大多数“基于文档问答”的场景，RAG 往往比微调更直接、更便宜、更容易落地。

## 一个简单例子

假设公司手册中有一段内容：

“员工年假原则上应在当年使用完毕，特殊情况经审批后可顺延至次年第一季度。”

用户提问：

“年假可以跨年吗？”

RAG 的流程是：

1. 系统先检索到这段手册内容
2. 模型读取这段内容
3. 模型回答：
   “原则上应在当年使用，但经过审批后可以顺延到次年第一季度。”

如果没有检索，模型可能只能猜。
如果有检索，回答就更容易和原文保持一致。

## 最简单的理解方式

RAG 其实只有两大部分：

- 检索：找到有用资料
- 生成：根据资料组织答案

如果检索错了，最终答案通常也会错。

所以 RAG 的上限，往往首先取决于检索质量。

## 这一课你必须记住

- RAG 是让大模型使用外部知识
- RAG 不是训练模型
- RAG 主要用于“基于资料回答问题”
- 检索质量会直接影响回答质量

## 复习问题

1. RAG 的全称是什么？
2. 为什么普通大模型经常需要 RAG？
3. RAG 和微调的区别是什么？
4. 为什么说检索通常比生成更关键？

## 动手目标

请你用自己的话，在 1 分钟内解释什么是 RAG。

你可以参考这个句式：

“RAG 是一种先找资料，再让模型基于资料回答问题的系统。”


---

## 补充：什么是微调

# 补充：什么是微调

## 学习目标

理解什么是微调，知道它和 RAG 的核心区别。

## 微调是什么

微调，英文叫 `Fine-tuning`。

它的本质是：

`拿一个已经训练好的大模型，用你自己的数据继续训练它。`

这样做之后，模型的参数会发生变化。

也就是说，微调不是“临时给模型看资料”，而是“真正改变模型本身”。

## 用最直观的话理解

你可以这样区分：

- RAG：考试时给模型一本参考书
- 微调：直接重新训练模型，让它形成新的习惯和能力

所以它们的差别非常大。

## 微调通常做什么

微调更常见的用途不是“塞知识”，而是下面这些：

- 让模型学会特定回答风格
- 让模型更适应某个任务格式
- 让模型学会某类固定输出方式
- 让模型更贴近某个领域的表达习惯

例如：

- 法律问答格式
- 客服回复风格
- SQL 生成格式
- 表单抽取任务

## 为什么很多知识库场景不先选微调

因为知识类问题经常有这些特点：

- 知识会更新
- 知识量很大
- 需要引用原文依据
- 用户希望答案能追溯到来源

这时候 RAG 通常更合适，因为：

- 不用改模型参数
- 资料更新后可以直接重建知识库
- 更容易基于原文回答

## 微调的代价

微调通常比 RAG 成本更高，也更重：

- 需要训练数据
- 需要训练流程
- 需要计算资源
- 需要评估微调后的效果
- 模型更新和维护更复杂

## RAG 和微调的核心区别

### RAG

- 不改模型参数
- 回答前先查资料
- 更适合知识库问答
- 更容易更新知识

### 微调

- 会改模型参数
- 本质上是继续训练
- 更适合改任务能力或输出风格
- 更新知识通常没 RAG 灵活

## 一个非常实用的判断方法

如果你的目标是：

`让模型回答基于某批文档的问题`

通常先做 RAG。

如果你的目标是：

`让模型长期学会一种固定格式、风格或任务模式`

才更可能考虑微调。

## 一个常见判断题

问题：

“如果我想让模型固定输出某种 JSON 格式，我该优先想到 RAG 还是微调？”

答案：

通常都不是先想到 RAG。

更准确地说，优先顺序一般是：

1. 先用 prompt 明确格式要求
2. 再用结构化输出能力或 schema 约束
3. 如果长期仍然不稳定，再考虑微调

原因是：

- RAG 解决的是“去哪里找知识”
- JSON 格式解决的是“答案怎么输出”

这不是一个“检索问题”，而是一个“行为与格式控制问题”。

所以：

- 想让模型根据文档回答问题，先想到 RAG
- 想让模型稳定按某种格式输出，先想到 prompt 或结构化输出
- 如果这种格式需求非常稳定、规模很大、对一致性要求极高，才可能进一步考虑微调

## 这一课你必须记住

- 微调是继续训练模型
- 微调会修改模型参数
- 微调和 RAG 不是一回事
- 知识问答场景通常优先考虑 RAG

## 复习问题

1. 微调的本质是什么？
2. 微调和 RAG 最大的区别是什么？
3. 为什么知识库问答常常优先用 RAG？
4. 微调更适合解决哪类问题？

## 动手目标

请你用自己的话分别解释：

- RAG 更像什么
- 微调更像什么


---

## 第 2 步：RAG 核心组成

# 第 2 步：RAG 核心组成

## 学习目标

认识一个 RAG 系统最基础的组成部分，知道每一部分负责什么。

## RAG 的主要组成

大多数 RAG 系统都包含这些部分：

- 文档
- Chunk 切分
- Embedding 向量化
- 向量数据库
- 检索器
- Prompt
- 大模型

## 1. 文档

文档就是你的原始知识来源，例如：

- PDF
- 网页
- Markdown 笔记
- Word 文档
- 数据库记录

这是所有后续处理的起点。

## 2. Chunk 切分

大文档通常不会整篇直接拿去检索，而是先切成很多较小的文本块，这些文本块就叫 `chunk`。

为什么要切：

- 整篇文档太大，不适合精确检索
- 小块文本更容易匹配具体问题
- 模型回答时通常只需要相关片段，不需要整份文档

例如：

一个 20 页的制度文档，可能会被切成几十个 chunk。

## 3. Embedding 向量化

Embedding 本质上是把一段文本转成一串数字向量。

这样做的目的是：

- 让系统可以按“语义相似度”来搜索

也就是说，不只是匹配关键词，而是匹配“意思接近”的内容。

## 4. 向量数据库

向量数据库用来存储：

- chunk 的文本内容
- chunk 对应的向量
- chunk 的元数据

当用户提问时：

1. 问题也会被转成向量
2. 系统拿这个问题向量去和已有 chunk 向量做相似度比较
3. 返回最相近的几个 chunk

## 5. 检索器

检索器负责根据问题找到相关 chunk。

它要决定：

- 去哪里查
- 返回几个 chunk
- 哪些 chunk 最相关

## 6. Prompt

Prompt 负责把“用户问题”和“检索到的上下文”组织成一份模型输入。

常见内容包括：

- 系统指令
- 检索到的文本片段
- 用户问题
- 约束条件，例如“只能根据提供内容回答”

## 7. 大模型

大模型的任务是根据 Prompt 生成最终答案。

它的职责不是去数据库里搜索，
它的职责是基于已经给出的上下文组织回答。

## 这些部分如何连接

整个流程可以概括成：

1. 读取文档
2. 切分文档
3. 把 chunk 转成向量
4. 存入向量数据库
5. 接收用户问题
6. 检索相关 chunk
7. 把 chunk 和问题一起发给大模型
8. 返回最终答案

## 这一课你必须记住

- 文档是原始知识源
- chunk 是切分后的文本片段
- embedding 让文本可以按语义搜索
- 向量数据库保存向量和文本
- 检索器负责找内容
- 大模型负责生成答案

## 复习问题

1. 为什么文档要切成 chunk？
2. Embedding 解决了什么问题？
3. 向量数据库保存的是什么？
4. 检索器和大模型的职责区别是什么？

## 动手目标

请你在纸上画出从“原始文档”到“最终回答”的完整流程图。


---

## 第 3 步：RAG 数据流

# 第 3 步：RAG 数据流

## 学习目标

理解一个 RAG 系统从原始资料到最终回答的完整数据流。

## 两个阶段

RAG 通常分成两个阶段：

- 离线阶段：准备知识库
- 在线阶段：回答用户问题

## 离线阶段

这是用户提问之前要做的准备工作。

### A. 收集文档

例如：

- 产品手册
- 公司制度
- FAQ 页面
- 研究笔记

### B. 清洗文档

常见工作包括：

- 去掉乱码
- 去掉重复内容
- 修复格式问题
- 保留标题、来源等元数据

### C. 切分成 Chunk

把每份文档拆成较小的文本段。

### D. 生成 Embedding

把每个 chunk 转成向量。

### E. 存入数据库

把 chunk、向量和元数据一起保存起来，供后续检索。

## 在线阶段

这是用户开始提问之后发生的流程。

### F. 接收问题

例如：

“如何重置账号密码？”

### G. 问题向量化

把用户问题也转成向量。

### H. 检索相似 Chunk

系统在向量数据库中查找最相关的文本片段。

### I. 构造 Prompt

把以下内容组装起来：

- 系统指令
- 检索结果
- 用户问题

### J. 生成答案

大模型基于这些内容给出最终回答。

## 简化后的流程

离线阶段：

文档 -> chunk -> 向量 -> 向量数据库

在线阶段：

问题 -> 检索 chunk -> 构造 prompt -> 模型回答

## 常见出错点

- 原始文档质量差
- chunk 切分不合理
- embedding 质量不够
- 检索参数设置不佳
- prompt 塞入了太多噪声内容

## 这一课你必须记住

- 准备知识库和在线回答是两个不同阶段
- 很多 RAG 质量问题在生成之前就已经产生
- 在线回答质量依赖离线准备质量

## 复习问题

1. 离线阶段和在线阶段分别做什么？
2. 为什么元数据有价值？
3. 在生成答案之前，哪些环节可能已经导致效果变差？

## 动手目标

请你不看文档，自己写出完整 RAG 流程，控制在 8 到 10 行内。


---

## 第 4 步：最小 RAG 系统

# 第 4 步：最小 RAG 系统

## 学习目标

知道一个“最小可运行”的 RAG 系统到底需要哪些东西。

## 最小可用配置

你只需要这五个部分：

1. 一小批文档
2. 一种 chunk 切分方法
3. 一个 embedding 模型
4. 一个向量数据库或检索存储层
5. 一个负责回答的大模型

这里要注意：

- 文档不一定非得是私有知识，也可以是公开资料
- 但如果是“知识库问答”场景，很多时候会用到私有文档

## 为什么这五个缺一不可

### 1. 文档

没有知识来源，就没有可检索内容。

### 2. Chunk 切分

不切分，大文档通常很难精确检索。

### 3. Embedding

没有向量化，系统就很难做语义相似度检索。

### 4. 向量数据库

需要一个地方保存 chunk 和向量，并支持相似度搜索。

### 5. 大模型

需要一个组件把检索结果组织成最终答案。

## 一个最小流程示例

假设你有 3 个 Markdown 文件。

系统可以这样工作：

1. 读取文件
2. 切分成 chunk
3. 为每个 chunk 生成向量
4. 把向量保存到本地向量库
5. 把用户问题也转成向量
6. 检索 top-k 个相关 chunk
7. 让模型基于这些 chunk 回答

这就已经是一个可用的 RAG 系统了。

## 刚开始不需要的东西

第一版不要搞复杂。

你暂时不需要：

- 多智能体流程
- 高级 reranker
- 混合检索
- 查询改写
- 微调
- 分布式基础设施

## 第一版真正要证明什么

你的第一个 RAG demo 只需要证明一件事：

`系统能够根据我的文档回答问题，而不是让模型瞎猜`

## 一个最小系统有效的标志

- 它能为简单问题找到相关 chunk
- 最终答案能对应到检索出的文本
- 你能看到系统到底用了哪个 chunk
- 如果答错，你能追查是检索问题还是切分问题

## 这一课你必须记住

- 第一版目标不是完美
- 第一版目标是跑通完整链路
- 可观察性比复杂度更重要

## 复习问题

1. 一个最小 RAG demo 需要哪些组件？
2. 为什么第一版要尽量简单？
3. 哪些现象说明你的 RAG 流程已经跑通？

## 动手目标

在写代码之前，请你自己先列出这五个最小组件。


---

## 第 5 步：Chunk 切分

# 第 5 步：Chunk 切分

## 学习目标

理解为什么要切分文档，以及 chunk 大小会如何影响 RAG 效果。

## 什么是 Chunk

Chunk 就是从原始文档中切出来的一小段文本。

RAG 很少直接拿整篇文档去检索，因为：

- 整篇文档太长，噪声太多
- 用户问题通常只对应文档中的一部分
- 检索系统更适合在较小单位上进行匹配

## 为什么 Chunk 很关键

切分策略会直接影响两个结果：

- 能不能检索到正确内容
- 检索到的内容是否足够完整

如果 chunk 太大：

- 无关信息太多
- 相似度匹配会变钝
- prompt 容易塞入噪声

如果 chunk 太小：

- 上下文可能不完整
- 关键句可能被拆散
- 模型看到的信息不够回答问题

## 常见切分方式

### 1. 固定长度切分

例如每 500 个字符切一段。

优点：

- 简单
- 容易实现

缺点：

- 可能在错误的位置把句子切断

### 2. 按段落切分

按照自然段切。

优点：

- 语义更完整

缺点：

- 段落长度可能不稳定

### 3. 按句子或标题结构切分

按章节、小节、标题、句子边界切分。

优点：

- 更符合文档逻辑结构

缺点：

- 实现比固定长度复杂

## Overlap 是什么

Overlap 指的是相邻 chunk 之间保留一部分重叠内容。

例如：

- 每个 chunk 长度 500
- overlap 设为 100

那就意味着后一段会和前一段共享 100 个字符或 token。

这样做的目的是：

- 避免关键信息刚好被切断
- 保留跨边界的上下文

## 一般怎么开始

初学时你可以先用一个简单策略：

- 按段落优先
- 如果段落太长，再按固定长度切
- 加少量 overlap

## 这一课你必须记住

- chunk 不是越大越好，也不是越小越好
- chunk 的目标是让检索既准确又保留足够上下文
- overlap 常常能减少边界切断问题

## 复习问题

1. 为什么不能直接用整篇文档检索？
2. chunk 太大和太小分别会带来什么问题？
3. overlap 的作用是什么？

## 动手目标

找一篇你自己的长文档，尝试手动把它切成 3 到 5 段，并思考每段为什么这样切。


---

## 第 6 步：Embedding 向量化

# 第 6 步：Embedding 向量化

## 学习目标

理解 embedding 是什么，为什么 RAG 检索几乎都离不开它。

## Embedding 是什么

Embedding 可以理解成：

`把一段文本映射成一个表示其语义的数字向量`

这个向量本身你看不懂，但计算机可以用它来比较文本之间是否“意思接近”。

## Embedding 本质上是什么

它本质上不是文字，也不是一句可读的话。

它本质上是：

`一串数字`

更准确一点说，是一个多维数值向量。

你可以把它粗略理解成：

- 一段文本输入模型后
- 模型输出一组数字
- 这组数字用来表示这段文本的语义特征

例如，概念上它可能长这样：

`[0.12, -0.48, 1.03, ...]`

这只是示意，不代表真实长度。

所以 embedding 不是给人看的文本，
而是给计算机拿来做“相似度计算”的数据表示。

## 为什么需要 Embedding

如果只做关键词匹配，会有很多限制。

例如：

- 问题写的是“离职流程”
- 文档写的是“员工解除劳动关系手续”

虽然词不同，但意思接近。
Embedding 检索更有机会把这种语义相关内容找出来。

## Embedding 在 RAG 中怎么用

离线阶段：

- 每个 chunk 转成一个向量

在线阶段：

- 用户问题也转成一个向量
- 用问题向量去找最相似的 chunk 向量

## 语义相似度

常见思路是：

- 两个向量越接近，说明语义越相似

系统会根据这种“接近程度”排序，返回最相关的内容。

## 为什么数字能表示语义

你现在不用深究数学原理，只要先接受这个工程事实：

- 语义接近的文本
- 往往会被映射到位置接近的向量

这样系统就能通过比较数字之间的距离，
近似判断两段文本在意思上是否接近。

## 你需要知道的现实问题

Embedding 不是万能的。

它可能会遇到：

- 专业术语理解不准
- 短文本歧义
- 数字、代码、编号类匹配不稳定

所以很多实际系统会把向量检索和关键词检索结合起来。

## 这一课你必须记住

- embedding 是文本的向量表示
- embedding 让 RAG 能做语义检索
- 问题和文档 chunk 都需要向量化
- 检索效果会受到 embedding 模型能力影响

## 复习问题

1. embedding 的核心作用是什么？
2. 为什么关键词检索不够？
3. 在 RAG 中，哪些内容需要做 embedding？

## 动手目标

请你用一句话解释：

“为什么 embedding 能帮助系统按语义而不是按字面搜索？”


---

## 第 7 步：检索机制

# 第 7 步：检索机制

## 学习目标

理解检索器在 RAG 中如何工作，以及为什么它决定系统上限。

## 检索器负责什么

检索器的任务是：

`从大量 chunk 中找出与当前问题最相关的少量内容`

它要回答三个问题：

- 去哪里找
- 怎么找
- 返回多少条

## 最常见的检索方式

### 1. 向量检索

根据 embedding 相似度找语义接近的 chunk。

特点：

- 对语义问题友好
- 不依赖完全相同的关键词

### 2. 关键词检索

根据词项出现情况检索，例如 BM25 一类方法。

特点：

- 对专有名词、编号、精确术语通常更稳

### 3. 混合检索

把向量检索和关键词检索结合。

这是很多实际系统里很常见的做法。

## Top-k 是什么

Top-k 指的是：

系统最终返回前 k 个最相关 chunk。

如果 k 太小：

- 可能漏掉关键信息

如果 k 太大：

- 会塞进太多噪声
- 增加 prompt 成本

## 召回和精度

你需要先认识两个词：

- 召回：该找回来的内容有没有找回来
- 精度：找回来的内容是不是大多真的相关

RAG 很怕“没召回到正确内容”。
因为一旦没找到，大模型再强也没法编出可靠依据。

## 为什么说检索决定上限

如果检索结果是错的或不完整：

- 模型可能答错
- 模型可能回答含糊
- 模型可能被噪声误导

所以：

`生成层决定表达质量，检索层决定事实基础。`

## 这一课你必须记住

- 检索器是 RAG 的核心部件之一
- 常见检索方式有向量检索、关键词检索、混合检索
- top-k 设置不合理会影响效果
- 检索错了，生成通常也很难救回来

## 复习问题

1. 检索器的职责是什么？
2. top-k 太小和太大分别有什么问题？
3. 为什么说检索决定 RAG 的上限？

## 动手目标

请你自己解释“召回”和“精度”的区别，不要求很学术，但要能说清楚。


---

## 第 8 步：生成回答

# 第 8 步：生成回答

## 学习目标

理解在检索完成后，大模型是如何基于上下文生成答案的。

## 生成阶段做什么

生成阶段的输入通常包括：

- 系统指令
- 检索出来的上下文
- 用户问题

大模型会基于这些内容组织最终回答。

## Prompt 的作用

Prompt 决定模型如何使用检索结果。

例如你可以要求模型：

- 只根据提供的上下文回答
- 如果上下文不足，就明确说不知道
- 用简洁方式总结答案
- 引用来源片段

## Prompt 在 RAG 里的核心作用

Prompt 不只是“让模型回答”，更重要的是：

- 限制模型回答边界
- 告诉模型应该优先依据哪些内容
- 规定回答格式和语气
- 在证据不足时约束模型不要乱补

所以更准确地说，Prompt 的作用不是单纯“限制内容”，而是：

`规定模型应该根据什么回答、怎么回答、什么时候拒绝乱答`

## 为什么生成阶段也会出问题

即使检索正确，生成也可能出问题：

- 模型没有严格遵守上下文
- prompt 约束不清晰
- 上下文太多，模型注意力分散
- 多个 chunk 之间存在冲突

## 一个常见区分

很多初学者会把“检索问题”和“生成问题”混在一起。

要这样区分：

- 如果知识库原文就错了，那首先是数据问题
- 如果没有检索到关键 chunk，那首先是检索问题
- 如果已经检索到正确内容，但模型最后还是答偏了，那才更像生成问题

所以当我们说：

`检索已经正确了，为什么最后还是可能回答错？`

更常见的原因是：

- 模型没有老老实实依据上下文回答
- 模型自己补充了原文里没有的内容
- prompt 没有把回答规则约束清楚
- 上下文太长，模型抓错了重点
- 多段上下文之间有细微冲突，模型整合失败

## 一个基本原则

在 RAG 中，模型最好做到：

`有依据再回答，没依据就承认不知道`

这比“答得像真的但其实没依据”更重要。

## 好的回答通常具备什么特征

- 能直接回应问题
- 内容能对应到检索文本
- 不额外编造事实
- 在信息不足时明确说明限制

## 这一课你必须记住

- 生成阶段不是自由发挥
- prompt 会影响模型如何使用检索内容
- 检索正确不代表生成一定正确
- “基于证据回答”是 RAG 的基本要求

## 复习问题

1. 生成阶段的主要输入有哪些？
2. prompt 在 RAG 中有什么作用？
3. 为什么即使检索正确，回答仍然可能有问题？

## 动手目标

请你自己写一句 RAG 场景中的系统指令，目标是限制模型只能依据上下文回答。


---

## 第 9 步：RAG 评估

# 第 9 步：RAG 评估

## 学习目标

理解为什么 RAG 不能只看“回答像不像对”，而必须分层评估。

## 为什么要评估

如果一个 RAG 系统回答不好，问题可能出在：

- 文档质量
- chunk 切分
- embedding
- 检索
- prompt
- 生成

如果不评估，你只会看到“结果不好”，却不知道坏在哪里。

## RAG 评估要分层看

### 1. 检索评估

要看：

- 正确 chunk 有没有被找回来
- 排名是否足够靠前
- 是否混入太多噪声

### 2. 生成评估

要看：

- 回答是否基于检索内容
- 有没有胡编
- 是否准确回应了问题

### 3. 端到端评估

从用户视角看：

- 最终答案有没有用
- 是否可信
- 是否覆盖关键点

## 一个实用原则

评估 RAG 时，不要只看最终答案。

你要同时看：

- 检索了什么
- 为什么检索这些
- 模型是如何使用这些内容的

## 初学者最容易犯的错

- 只看回答顺不顺
- 不检查引用内容是否真的支持答案
- 不保存检索中间结果

## 这一课你必须记住

- RAG 评估必须分层
- 先看检索，再看生成，再看整体
- 能定位问题，才有办法优化

## 复习问题

1. 为什么不能只看最终答案？
2. RAG 评估为什么要分层？
3. 如果回答错了，可能是哪些环节出的问题？

## 动手目标

请你假设一个回答错误案例，并分别猜测它可能是“检索错”还是“生成错”。


---

## 第 10 步：RAG 优化

# 第 10 步：RAG 优化

## 学习目标

了解在最小 RAG 系统跑通之后，通常会优化哪些方向。

## 优化不是一开始就做

请先记住：

`先跑通，再优化`

如果基础链路还没跑稳，就过早做复杂优化，通常只会把问题藏起来。

## 常见优化方向

### 1. 优化文档质量

- 去重
- 清洗脏数据
- 保留标题、章节、来源等元数据

### 2. 优化 Chunk 策略

- 调整 chunk 大小
- 调整 overlap
- 按自然结构切分

### 3. 优化检索

- 调整 top-k
- 使用混合检索
- 增加 rerank

### 4. 优化 Prompt

- 加强“仅基于上下文回答”的约束
- 规范回答格式
- 在证据不足时要求明确拒答

### 5. 优化生成成本和速度

- 限制上下文长度
- 减少无关 chunk
- 做缓存

## 一个现实原则

大多数 RAG 优化，真正有效的并不是“更复杂”，而是：

- 数据更干净
- chunk 更合理
- 检索更准确

## 这一课你必须记住

- 优化要建立在可观察和可评估的基础上
- 大部分收益来自基础环节，而不是花哨技巧
- 每次优化最好只改一个变量，方便比较效果

## 复习问题

1. 为什么不应该过早优化？
2. RAG 优化最常见的几个方向是什么？
3. 为什么每次最好只改一个变量？

## 动手目标

请你列出 3 个你认为最值得优先优化的点，并说明理由。


---

## 第 11 步：项目实战路线

# 第 11 步：项目实战路线

## 学习目标

把前面的概念整理成一条可执行的实战学习路线。

## 推荐实战顺序

### 第一阶段：只做最小 Demo

目标：

- 用少量文档做一个最简单问答系统

你要完成：

- 读取文档
- chunk 切分
- embedding
- 本地检索
- 调用模型回答

### 第二阶段：让系统可观察

目标：

- 知道每次回答到底用了什么内容

你要补上：

- 打印检索结果
- 显示来源文档
- 显示 top-k chunk

### 第三阶段：开始评估

目标：

- 判断系统为什么答得好或不好

你要做：

- 准备一组测试问题
- 人工检查检索质量
- 人工检查回答是否有依据

### 第四阶段：开始优化

目标：

- 针对问题做小步优化

你可以尝试：

- 调 chunk 大小
- 调 top-k
- 调 prompt
- 尝试混合检索

## 你接下来最适合怎么学

按这个节奏：

1. 先学懂概念
2. 再写一个最小 demo
3. 再观察中间结果
4. 再做评估
5. 最后才做优化

## 当前阶段建议

如果你现在是从零开始，那么接下来最适合做的是：

`先把前 4 步彻底理解，然后开始搭第一个最小 RAG 示例。`

## 这一课你必须记住

- 学 RAG 不要一开始就追求复杂架构
- 最重要的是从完整链路中建立直觉
- 可运行、可观察、可解释，比“高级”更重要

## 复习问题

1. 为什么第一阶段只建议做最小 demo？
2. 为什么第二阶段一定要增强可观察性？
3. 为什么优化应该排在评估后面？

## 动手目标

请你写出你自己的 4 周 RAG 学习计划，每周只设一个核心目标。


---

## 第 12 步：LangChain 和手写 Demo 的对应关系

# 第 12 步：LangChain 和手写 Demo 的对应关系

## 学习目标

搞清楚：

- RAG 是什么
- LangChain 是什么
- LangChain 版 RAG 和你手写版 demo 各个部分如何一一对应

## 先记住一句话

- `RAG` 是一种方法
- `LangChain` 是帮你实现这种方法的框架

所以：

- 你现在手写的 demo 是“自己把每个步骤写出来”
- LangChain 版是“用框架把这些步骤标准化、模块化”

## 你手写版 Demo 的主链路

你现在的 TS demo 主要是这条链路：

1. `loadKnowledge`
2. `splitIntoChunks`
3. `tokenize`
4. `vectorize`
5. `retrieve`
6. `generateAnswer`

## 对应到 LangChain 版 RAG

### 1. `loadKnowledge`

你手写版在做：

- 自己读取本地文本文件

LangChain 对应的是：

- `Document Loader`

它负责：

- 从 txt、pdf、网页、Notion、Google Drive 等来源读取数据
- 统一变成标准文档对象

## 2. `splitIntoChunks`

你手写版在做：

- 按空行把整篇文本切成多个 chunk

LangChain 对应的是：

- `Text Splitter`

它负责：

- 按字符、段落、token、标题结构等方式切分文档
- 控制 chunk size 和 overlap

## 3. `tokenize` + `vectorize`

你手写版在做：

- 把文本拆成小单位
- 统计词频
- 构造一个简化版向量表示

LangChain 对应的是：

- `Embedding Model`

它负责：

- 把文本转成真实语义向量

注意：

- 你手写版的词频向量只是教学替代品
- 真实 LangChain RAG 一般会接真实 embedding 模型

## 4. `retrieve`

你手写版在做：

- 对问题和每个 chunk 算相似度
- 选出 top-k

LangChain 对应的是两层：

- `Vector Store`
- `Retriever`

区别是：

- `Vector Store` 负责存向量和查相似度
- `Retriever` 负责根据问题返回相关文档

你手写版把这两层基本揉在一起了。

## 5. `generateAnswer`

你手写版在做：

- 把检索结果拼成一个规则化回答

LangChain 对应的是：

- `Prompt + Chat Model`

也就是：

- 把检索结果塞进 prompt
- 交给真实大模型生成自然语言答案

所以这里是你手写版和真实 RAG 差距最大的一步。

## 一张最重要的对应表

- `loadKnowledge` -> `Document Loader`
- `splitIntoChunks` -> `Text Splitter`
- `tokenize` + `vectorize` -> `Embedding Model`
- `retrieve` -> `Vector Store` + `Retriever`
- `generateAnswer` -> `Prompt` + `Chat Model`

## 为什么要先学手写版再学 LangChain

因为如果你一上来就学 LangChain，你可能只会背这些词：

- loader
- splitter
- embeddings
- vector store
- retriever
- chain

但你不知道它们到底在解决什么问题。

先学手写版的好处是：

- 你知道每一步为什么存在
- 你知道每一步出错会怎么坏
- 你以后看 LangChain，不会把它当黑盒

## 你现在应该怎么理解 LangChain

不要把 LangChain 想成“一个神奇的 RAG”。

更准确地说：

`LangChain 是把你手写 demo 里那些零散步骤，封装成标准组件。`

## 这一课你必须记住

- RAG 是方法，LangChain 是框架
- LangChain 没有发明 RAG，只是更方便地实现 RAG
- 你手写版 demo 和 LangChain 版的核心流程是一致的
- 最大差别在于：LangChain 用真实组件替代了你的简化实现

## 复习问题

1. 为什么说 LangChain 不是 RAG 本身？
2. `splitIntoChunks` 在 LangChain 里对应什么？
3. `tokenize + vectorize` 在 LangChain 里更像什么？
4. 为什么说 `retrieve` 在 LangChain 里通常拆成两层？

## 动手目标

请你自己写出下面这组映射：

- `loadKnowledge` -> ?
- `splitIntoChunks` -> ?
- `vectorize` -> ?
- `retrieve` -> ?
- `generateAnswer` -> ?


---

## 第 13 步：为什么 Vector Store 和 Retriever 要拆开

# 第 13 步：为什么 Vector Store 和 Retriever 要拆开

## 学习目标

理解在 LangChain 里：

- `Vector Store` 负责什么
- `Retriever` 负责什么
- 为什么它们不是一个东西

## 先记住一句话

- `Vector Store` 更像“存储和搜索引擎”
- `Retriever` 更像“统一的取回接口”

所以拆成两层，不是为了复杂，而是为了分工清楚。

## Vector Store 负责什么

它主要负责：

- 存储文档向量
- 存储原始文本和 metadata
- 按相似度查询
- 返回文档或文档加分数

你可以把它理解成：

`底层数据层`

它更关心的是：

- 数据怎么存
- 相似度怎么查
- 支持哪些检索方法

## Retriever 负责什么

Retriever 的职责更高一层。

它主要负责：

- 接收一个用户问题
- 调用底层搜索能力
- 按统一接口返回相关文档

你可以把它理解成：

`面向上层 RAG 流程的检索接口层`

它更关心的是：

- 给上层提供统一调用方式
- 屏蔽底层搜索实现差异
- 让检索步骤更容易接进 chain、agent、RAG pipeline

## 为什么不把它们合并成一个东西

### 原因 1：职责不同

Vector Store 更像数据库能力。

Retriever 更像业务调用接口。

如果把两者完全混在一起：

- 底层存储职责和上层调用职责会缠在一起
- 后面替换搜索来源会更麻烦

### 原因 2：Retriever 不一定来自 Vector Store

这是最关键的一点。

Retriever 不一定只能从向量数据库取数据，它也可以来自：

- 关键词搜索
- API
- SQL
- 文档系统
- 混合检索系统

所以 LangChain 需要一个更抽象的“取回文档接口”。

### 原因 3：上层 RAG 只关心“给我相关文档”

上层 prompt、chain、agent 并不一定关心：

- 底层是 Pinecone 还是 Qdrant
- 是相似度搜索还是 MMR
- 是向量检索还是别的来源

上层更关心的是：

`给我一批和这个问题相关的文档`

Retriever 正好承担这个角色。

### 原因 4：方便统一调用规范

LangChain 的 Retriever 可以更自然地接入：

- chain
- agent
- runnable 流程

这样上层代码不需要知道底层细节。

## 结合你的手写 Demo 来理解

你现在的手写 TS demo 里：

- `retrieve` 同时做了两件事
- 既像 Vector Store 的搜索
- 又像 Retriever 的对外接口

也就是说，你把两层揉在了一起。

这在教学 demo 里没问题，
但在真实框架里通常会拆开。

## 一个很直观的类比

### Vector Store

像仓库系统本身。

它负责：

- 东西放哪
- 怎么查库存
- 怎么按条件找东西

### Retriever

像前台取货窗口。

它负责：

- 接收需求
- 去底层查
- 把最相关的结果返回给上层

所以：

- 仓库不等于窗口
- 窗口也不必只能连一个仓库

## 你现在应该怎么记

最短记忆法：

- `Vector Store = 存和查`
- `Retriever = 问题进来后，统一返回相关文档`

## 这一课你必须记住

- Vector Store 是底层搜索存储层
- Retriever 是上层统一检索接口
- Retriever 不一定只能基于向量库
- LangChain 拆成两层，是为了抽象清晰、组件可替换

## 复习问题

1. 为什么说 Vector Store 更像底层数据层？
2. 为什么 Retriever 不一定只能来自向量库？
3. 你的手写 demo 里，哪一部分其实把这两层揉在一起了？
4. 为什么这种拆分更适合框架化设计？

## 动手目标

请你自己用一句话分别解释：

- `Vector Store 是什么`
- `Retriever 是什么`


---

## 第 14 步：你的 TS Demo 如果换成 LangChain，代码结构会怎样

# 第 14 步：你的 TS Demo 如果换成 LangChain，代码结构会怎样

## 学习目标

理解：

- 你的手写 TS demo 如果改成 LangChain 版
- 代码结构会怎么分层
- 哪些手写步骤会消失，哪些会变成框架组件

## 先说结论

你的当前 TS demo 是一个非常典型的：

`2-step RAG`

也就是：

1. 先检索
2. 再生成

如果换成 LangChain，主结构不会变，
变的是：

- 你不再手写很多底层步骤
- 而是把这些步骤交给 LangChain 组件

## 你现在的手写结构

当前大致是：

1. `loadKnowledge`
2. `splitIntoChunks`
3. `tokenize`
4. `vectorize`
5. `retrieve`
6. `generateAnswer`

## 换成 LangChain 后的结构

LangChain 版大致会变成这几层：

1. `Loader`
2. `Text Splitter`
3. `Embeddings`
4. `Vector Store`
5. `Retriever`
6. `Prompt`
7. `Chat Model`
8. `RAG Chain`

## 一一对应关系

### 1. `loadKnowledge` -> `Loader`

你现在自己读本地 txt。

LangChain 里会交给文档加载器。

作用：

- 读取 txt、pdf、网页等数据源
- 统一输出文档对象

### 2. `splitIntoChunks` -> `Text Splitter`

你现在手动按空行切分。

LangChain 里会交给切分器。

作用：

- 控制 chunk size
- 控制 overlap
- 生成更适合检索的 chunk

### 3. `tokenize + vectorize` -> `Embeddings`

你现在自己拆 token、统计词频。

LangChain 里通常不再自己写这一步，
而是直接把文本交给 embedding 模型。

作用：

- 把文本变成真实语义向量

### 4. `retrieve` -> `Vector Store + Retriever`

你现在自己：

- 把问题向量化
- 对每个 chunk 算相似度
- 排序取 top-k

LangChain 里通常拆成两层：

- `Vector Store`：负责存和查
- `Retriever`：负责统一返回相关文档

### 5. `generateAnswer` -> `Prompt + Chat Model`

你现在是规则拼接答案。

LangChain 里一般会变成：

- 先把问题和检索结果放进 prompt
- 再交给聊天模型生成自然语言回答

## LangChain 版最常见的代码分层

你可以把它想成下面这种结构：

### A. 构建知识库

- 加载文档
- 切分文档
- 生成向量
- 建立向量索引

### B. 构建检索器

- 从向量库得到 retriever

### C. 构建回答链

- 定义 prompt
- 接入聊天模型
- 把 retriever 和模型串起来

### D. 接收用户问题

- 调用 RAG chain
- 返回最终答案

## 伪代码结构

注意：

下面是结构示意，不是你现在必须记住的精确 API 写法。

```ts
// 1. 加载文档
const docs = await loader.load();

// 2. 切分 chunk
const splitDocs = await textSplitter.splitDocuments(docs);

// 3. 建立向量索引
const vectorStore = await VectorStore.fromDocuments(splitDocs, embeddings);

// 4. 得到 retriever
const retriever = vectorStore.asRetriever({ k: 2 });

// 5. 检索相关文档
const relevantDocs = await retriever.invoke(question);

// 6. 构造 prompt
const promptInput = {
  question,
  context: relevantDocs
};

// 7. 交给聊天模型回答
const answer = await chatModel.invoke(promptInput);
```

## 和你手写版最大的差别

最大的差别不是“流程变了”，而是：

`很多你手写的底层实现，变成了可替换的标准组件。`

例如：

- 你不再自己写 tokenize
- 你不再自己写词频向量
- 你不再自己写 cosine similarity
- 你不再自己手动管理 top-k 排序

这些事会交给 embedding 模型、vector store、retriever 来做。

## 你现在最该记住的图

### 手写版

读文件 -> 切 chunk -> 拆 token -> 词频向量 -> 算相似度 -> 取 top-k -> 拼回答

### LangChain 版

Loader -> Splitter -> Embeddings -> Vector Store -> Retriever -> Prompt -> Chat Model

## 这一课你必须记住

- LangChain 不会改变 RAG 的主逻辑
- 它只是把你手写的步骤组件化
- 你的 demo 属于 `2-step RAG`
- 真正消失的不是流程，而是你手写的底层实现细节

## 复习问题

1. 为什么说 LangChain 版不会改变你的主链路？
2. 在 LangChain 版里，`tokenize + vectorize` 更像被什么替代？
3. 为什么 `retrieve` 在 LangChain 里通常拆成两层？
4. `generateAnswer` 在 LangChain 里通常变成哪两部分？

## 动手目标

请你自己写出下面这组映射：

- `loadKnowledge` -> ?
- `splitIntoChunks` -> ?
- `vectorize` -> ?
- `retrieve` -> ?
- `generateAnswer` -> ?


---

## 第 15 步：Prompt 和 Chat Model 怎么接在 Retriever 后面

# 第 15 步：Prompt 和 Chat Model 怎么接在 Retriever 后面

## 学习目标

理解在 LangChain 的 `2-step RAG` 里：

- Retriever 先返回什么
- Prompt 接收什么
- Chat Model 最终为什么能基于检索内容回答

## 先记住整条链路

最简化的 LangChain RAG 可以理解成：

1. 用户提出问题
2. Retriever 先找相关文档
3. 把这些文档整理成上下文
4. 把“上下文 + 问题”塞进 Prompt
5. 把 Prompt 交给 Chat Model
6. Chat Model 输出最终答案

## Retriever 返回的是什么

Retriever 不是直接返回“答案”，
它返回的是：

`和问题相关的文档或文本片段`

所以 Retriever 解决的是：

- 先把资料找出来

它不负责最后组织自然语言答案。

## Prompt 在这里做什么

Prompt 的职责是把两类信息拼起来：

- 检索到的上下文
- 用户真正的问题

你可以把它想成一个“给模型的答题说明书”。

一个非常常见的结构是：

- System：你只能根据提供的上下文回答
- Context：这里是检索出来的文档片段
- User：这里是用户问题

## Chat Model 在这里做什么

Chat Model 不负责“自己去搜”。

在 `2-step RAG` 里，它拿到的是一个已经组好的 Prompt，
其中已经包含：

- 检索出的上下文
- 回答规则
- 用户问题

然后它的工作就是：

`根据这些输入生成最终答案`

## 为什么一定要经过 Prompt

因为 Retriever 返回的只是原始文档片段。

这些片段本身还不是“模型能稳定回答”的最终输入格式。

Prompt 需要负责：

- 规定模型如何使用这些片段
- 告诉模型不要脱离上下文乱答
- 组织最终输入结构

所以：

- Retriever 负责找资料
- Prompt 负责组织资料
- Chat Model 负责回答

## 对应到你手写版 Demo

你手写 TS demo 里：

- `retrieve` 找到了相关 chunk
- `generateAnswer` 直接把 chunk 拼成回答

如果换成 LangChain：

- `retrieve` 的结果不会直接变成最终回答
- 中间会多一个 `Prompt` 层
- 然后才交给 `Chat Model`

## 最简单的伪代码结构

```ts
const docs = await retriever.invoke(question);

const context = docs.map((doc) => doc.pageContent).join("\n\n");

const messages = [
  {
    role: "system",
    content: "你只能根据提供的上下文回答。如果上下文不足，就明确说明。"
  },
  {
    role: "user",
    content: `上下文:\n${context}\n\n问题:\n${question}`
  }
];

const answer = await chatModel.invoke(messages);
```

## 你必须抓住的关键区别

### 你的手写版

检索结果 -> 规则拼接 -> 直接输出

### LangChain 版

检索结果 -> Prompt 组织 -> Chat Model 生成 -> 输出

也就是说，LangChain 版多出来的关键桥梁就是：

`Prompt 把检索结果转换成模型可用的输入。`

## 一句话总结

Retriever 先把证据找出来，
Prompt 再把证据和问题组织成模型输入，
Chat Model 最后根据这个输入生成回答。

## 这一课你必须记住

- Retriever 返回的是相关文档，不是最终答案
- Prompt 负责把“上下文 + 问题”组织给模型
- Chat Model 负责基于 Prompt 输出答案
- 在 2-step RAG 里，检索和生成是明确分开的

## 复习问题

1. Retriever 返回的为什么不是最终答案？
2. Prompt 在 Retriever 和 Chat Model 中间起什么作用？
3. 为什么 Chat Model 在 2-step RAG 里不负责自己检索？
4. 你的手写 demo 和 LangChain 版在这一层最大的区别是什么？

## 动手目标

请你自己用一句话分别解释：

- `Retriever 之后为什么还需要 Prompt`
- `Prompt 之后为什么还需要 Chat Model`


---

## RAG 总复习

# RAG 总复习

这份文档只保留后期复习最重要的内容。

## 一、RAG 是什么

`RAG = Retrieval-Augmented Generation`

最简单理解：

- 先检索资料
- 再基于资料回答

一句话记忆：

`RAG 是让模型临时开卷考试。`

## 二、RAG 的本质

RAG 不是训练模型。

RAG 的本质是：

- 给模型补充外部知识
- 让回答尽量有依据

一句话记忆：

`RAG 管的是“知识从哪里来”。`

## 三、RAG 主链路

最核心流程：

1. 文档
2. chunk 切分
3. embedding 向量化
4. 存入向量数据库
5. 用户提问
6. 检索相关 chunk
7. 把 chunk 和问题交给模型
8. 模型生成回答

一句话记忆：

`文档 -> chunk -> embedding -> 向量库 -> 检索 -> 生成`

## 三-A、RAG 的两阶段模型

RAG 的数据流分为两个阶段：

**离线阶段（准备知识库）**
1. 收集文档（产品手册、公司制度、FAQ 等）
2. 清洗文档（去乱码、去重、修复格式，保留标题/来源/章节等元数据）
3. 切分成 chunk
4. 生成 embedding
5. 存入向量数据库

**在线阶段（回答用户问题）**
6. 接收问题
7. 问题向量化
8. 检索相似 chunk
9. 构造 prompt
10. 模型生成答案

一句话记忆：
离线准备决定基础，在线回答决定体验。

注意：元数据（标题、来源、章节）在检索过滤和追溯原文时非常有价值，不要丢弃。

## 四、RAG 最重要的几个核心词

### 1. Chunk

含义：

- 从原始文档切出来的小块文本

为什么要有：

- 方便精确检索
- 减少噪声
- 降低上下文成本

常见的三种切分方式：

- 固定长度切分：每 N 个字符/token 切一段，简单，但可能把句子切断
- 按段落切分：按自然段切，语义更完整，但段落长度不稳定
- 按句子/标题结构切分：按章节、小节、标题、句子边界切，最贴合文档逻辑，但实现更复杂

初学建议的起手策略：

- 先按段落切
- 段落太长再按固定长度切
- 再加少量 overlap

一句话记忆：

`切分方式决定 chunk 的语义完整度`

### 2. Embedding

含义：

- 文本的数字化语义表示

本质：

- 一串数字向量

作用：

- 让系统按“意思接近”找内容，而不是只按关键词

例子（为什么关键词不够）：

- 问题写“离职流程”
- 文档写“员工解除劳动关系手续”
- 词不同但意思接近，embedding 更有机会找出来

局限（embedding 不是万能的）：

- 专业术语理解不准
- 短文本容易歧义
- 数字、代码、编号类匹配不稳定

正因为有这些局限，实际系统常把向量检索和关键词检索结合起来（见下面的检索方式）。

### 3. 向量数据库

含义：

- 存 chunk、向量和元数据
- 支持相似度搜索

一句话记忆：

`向量数据库 = 存和查语义向量的地方`

### 4. 检索

含义：

- 根据问题找最相关的 chunk

检索器要回答三个问题：

- 去哪里找
- 怎么找
- 返回多少条（top-k）

三种常见检索方式：

- 向量检索：按 embedding 语义相似度找，对语义问题友好，不依赖完全相同的关键词
- 关键词检索：按词项出现情况找（如 BM25），对专有名词、编号、精确术语更稳
- 混合检索：向量 + 关键词结合，实际系统里很常见

必须分清的两个词：

- 召回：该找回来的内容有没有找回来
- 精度：找回来的内容是不是大多真的相关

RAG 最怕的情况：

- 没召回到正确内容，因为模型再强也编不出可靠依据

一句话记忆：

`检索决定给模型什么证据`

`检索最怕漏召回，其次怕精度差`

## 五、RAG 最重要的工程判断

### 1. 检索决定上限

因为：

- 没检索到，模型就没证据
- 检索错了，模型会被误导
- 检索噪声太多，模型会答得模糊

一句话记忆：

`生成决定怎么说，检索决定有什么可说。`

### 2. Chunk 设计非常关键

chunk 太大：

- 噪声多
- 检索不精确
- 成本高

chunk 太小：

- 信息碎
- 上下文不完整
- 回答片面

overlap 的作用：

- 避免关键信息刚好被切断

### 3. top-k 不是越大越好

太小：

- 可能漏掉关键信息

太大：

- 噪声增加
- token 成本上升
- 模型更容易分心

## 六、最容易混淆的地方

### 1. RAG 和微调

RAG：

- 不改模型参数
- 回答前先查资料
- 更适合知识库问答

微调：

- 会改模型参数
- 本质是继续训练模型
- 更适合改风格、格式、任务能力

一句话记忆：

- `RAG = 临时给资料`
- `微调 = 直接改模型`

### 2. RAG 和 LangChain

RAG：

- 是方法

LangChain：

- 是实现 RAG 的框架

一句话记忆：

- `RAG = 做什么`
- `LangChain = 怎么更方便地做`

### 3. Vector Store 和 Retriever

Vector Store：

- 底层存储和相似度搜索层

Retriever：

- 对上层统一返回相关文档的接口层

一句话记忆：

- `Vector Store = 存和查`
- `Retriever = 统一取回相关文档`

### 4. Prompt 和 Chat Model 在 RAG 里的关系

Retriever 先返回相关文档，
Prompt 再把：

- 上下文
- 用户问题
- 回答规则

组织成模型输入，
最后 Chat Model 负责生成答案。

一句话记忆：

- `Retriever 找证据`
- `Prompt 组织证据`
- `Chat Model 输出答案`

## 六-A、生成回答时模型该怎么做

检索只是把证据找出来，最后还得靠模型把答案说清楚。

生成阶段的输入通常有三部分：

- 系统指令（回答规则）
- 检索出来的上下文
- 用户问题

Prompt 在这里的作用不只是"让模型回答"，更重要的是：

`规定模型应该根据什么回答、怎么回答、什么时候拒绝乱答`

最核心的一条生成原则：

`有依据再回答，没依据就承认不知道。`

为什么检索对了，生成还可能错：

- 模型没老实依据上下文
- 模型自己补了原文没有的内容
- prompt 约束不清
- 上下文太长，模型抓错重点
- 多个 chunk 之间有冲突，模型整合失败

一句话记忆：

`检索决定有什么可说，生成决定怎么说，但不许乱说。`

## 七、RAG 为什么会失败

最常见原因：

- 文档质量差
- chunk 切分不合理
- embedding 表示不好
- 检索错
- 检索噪声过多
- prompt 约束不清
- 模型脱离上下文乱补

判断顺序建议：

`先看检索，再看生成。`

## 八、RAG 评估应该怎么看

不要只看最终回答。

要分三层看：

1. 检索对不对（正确 chunk 有没有召回、排名靠不靠前、噪声多不多）
2. 生成有没有基于检索内容（有没有胡编、是否准确回应问题）
3. 最终答案对用户有没有用（可信、覆盖关键点）

初学者最容易犯的错：

- 只看回答顺不顺
- 不检查引用内容是否真的支持答案
- 不保存检索中间结果

一句话记忆：

`RAG 评估必须分层。`

## 九、RAG 实战学习顺序

建议顺序：

1. 先懂主链路
2. 再做最小 demo
3. 再看中间结果
4. 再做评估
5. 最后再优化

一句话记忆：

`先跑通，再观察，再评估，再优化。`

## 九-A、RAG 常见优化方向

前提原则：

`先跑通，再优化。基础链路没跑稳就做复杂优化，只会把问题藏起来。`

五个常见方向：

1. 优化文档质量：去重、清洗脏数据、保留标题/章节/来源等元数据
2. 优化 chunk 策略：调大小、调 overlap、按自然结构切
3. 优化检索：调 top-k、用混合检索、加 rerank（重排序）
4. 优化 prompt：强化"仅基于上下文回答"、规范格式、证据不足时要求拒答
5. 优化成本和速度：限制上下文长度、减少无关 chunk、做缓存

现实经验：

- 真正有效的优化往往不是"更复杂"，而是数据更干净、chunk 更合理、检索更准
- 每次最好只改一个变量，方便对比效果

一句话记忆：

`大部分收益来自基础环节，不是花哨技巧。`

## 十、后期复习只记这些句子

- `RAG = 先检索，再生成`
- `RAG 管知识从哪里来`
- `检索决定上限`
- `检索方式有三种：向量、关键词、混合`
- `检索最怕漏召回，其次怕精度差`
- `Chunk 设计非常关键，切法影响语义完整度`
- `Embedding 是文本的语义向量，但对术语/短文本/编号不稳`
- `有依据再回答，没依据就承认不知道`
- `RAG 不等于微调`
- `RAG 不等于 LangChain`
- `先看检索，再看生成`
- `先跑通，再优化，每次只改一个变量`


---

## 最小 RAG Demo

# 最小 RAG Demo

这个目录用于放你的第一个最小 RAG 示例。

## 目标

这个 demo 不追求真实生产效果，目标只有两个：

1. 让你看懂 RAG 的完整链路
2. 让你亲手跑通一个最小可工作的版本

## 目录说明

- `app.py`：最小 RAG 主程序
- `data/knowledge.txt`：示例知识库
- `notes/01-demo目标.md`：这次 demo 的学习目标
- `notes/02-demo流程.md`：这个 demo 的完整流程
- `notes/03-demo代码讲解.md`：代码结构说明

## 如何运行

在当前目录执行：

```powershell
python app.py
```

也可以直接在命令后面带问题：

```powershell
python app.py "年假可以跨年吗？"
python app.py "怎么重置密码？"
```

## 这个 Demo 做了什么

它实现的是一个“极简版本”的 RAG：

1. 读取本地知识库文本
2. 按段落切成 chunk
3. 用一个简化的词频向量方法代替真实 embedding
4. 用余弦相似度做最基础检索
5. 选出最相关 chunk
6. 基于检索结果生成一个可解释答案

## 你要知道的限制

这个 demo 是为了学习原理，不是生产方案。

它没有：

- 真实 embedding 模型
- 真正的向量数据库
- 外部大模型 API
- 高级 prompt

但它非常适合零基础入门，因为你能直接看到：

`文档 -> chunk -> 向量化 -> 检索 -> 生成`


---

## 第 1 份笔记：这个 Demo 要学什么

# 第 1 份笔记：这个 Demo 要学什么

## 目标

这个 demo 不是为了做一个强大的知识库产品。

它的目标是：

- 让你第一次把 RAG 跑起来
- 让你看见每个环节到底在做什么
- 让你能把学过的概念和代码对应起来

## 你会在这个 Demo 里看到什么

你会亲手看到这条链路：

1. 读取文档
2. 切分成 chunk
3. 把 chunk 变成“可比较的数据表示”
4. 输入问题
5. 检索最相关 chunk
6. 输出回答

## 这不是生产实现

这里为了学习，做了两个简化：

- 用简单词频向量代替真实 embedding
- 用规则生成代替真实 LLM 回答

这样做的好处是：

- 你不需要先学 API
- 你不需要先装复杂依赖
- 你可以先看懂主链路

## 你这一轮真正要学会的

不是“把 demo 跑出来”这么简单，而是：

`看懂 RAG 每一步在代码里具体对应什么。`

## 这个 Demo 还会帮你看到什么

它还会让你第一次看到：

- 检索为什么会失效
- 中文文本处理为什么比英文麻烦
- 为什么真实 RAG 系统离不开更好的 embedding 和检索策略


---

## 第 2 份笔记：这个 Demo 的流程

# 第 2 份笔记：这个 Demo 的流程

## 整体流程

这个 demo 的流程是：

1. 读取 `knowledge.txt`
2. 按空行切分成多个 chunk
3. 对每个 chunk 建立一个简化向量
4. 用户输入问题
5. 对问题也建立同类向量
6. 计算问题和每个 chunk 的相似度
7. 取分数最高的前几个 chunk
8. 用这些 chunk 生成最终回答

## 每一步对应什么 RAG 概念

### 读取文本

对应：

- 文档加载

### 按段落切分

对应：

- chunk 切分

### 建立简化向量

对应：

- embedding 的简化版

### 计算相似度

对应：

- 检索

### 取 top-k

对应：

- 返回最相关的若干 chunk

### 生成最终答案

对应：

- 生成阶段

## 你需要注意的重点

虽然这个 demo 用的不是“真实 embedding”，
但它已经足够让你看到：

`为什么必须先把文本变成某种可计算表示，系统才能做相似度检索。`

## 一个重要现实问题

如果文本表示方式不好，检索就会失效。

比如中文如果切分得太粗糙，就可能出现：

- 用户问题和知识库明明在说同一件事
- 但系统因为没有正确拆词，算不出相似度

这也是为什么真实 RAG 系统非常依赖：

- 更合理的文本切分
- 更好的 embedding 模型


---

## 第 3 份笔记：代码讲解

# 第 3 份笔记：代码讲解

## 你会在代码里看到的几个主要函数

### `load_knowledge`

作用：

- 读取知识库文本

### `split_into_chunks`

作用：

- 把长文本按段落切成多个 chunk

### `tokenize`

作用：

- 做简化版文本切词

这里你要注意：

- 英文按单词切比较直接
- 中文如果不借助专门分词库，会更麻烦

所以这个 demo 会同时使用：

- 连续中文片段
- 简单中文双字切片

这样做不是标准生产方案，
只是为了让零依赖 demo 在中文检索下更容易跑通

### `vectorize`

作用：

- 把文本变成词频字典

### `cosine_similarity`

作用：

- 计算问题和 chunk 的相似度

### `retrieve`

作用：

- 选出最相关的 top-k chunk

### `generate_answer`

作用：

- 根据检索结果拼出一个可解释回答

## 这段代码最重要的学习价值

不是算法本身有多强，而是你能看到：

- 数据从哪里来
- 数据怎么被切分
- 为什么可以比较相似度
- 为什么最终回答依赖检索结果

## 你运行后应该重点观察什么

- 系统把文档切成了几个 chunk
- 每次问题检索到了哪些 chunk
- 检索分数高的 chunk 是否真的更相关
- 最终答案是不是基于检索内容生成的


---

## 最小 RAG Demo TypeScript 版

# 最小 RAG Demo TypeScript 版

这个目录是最小 RAG 示例的 TypeScript 版本。

## 目标

这个 demo 的目标不是做生产级系统，而是：

1. 让你用熟悉的 TypeScript 看懂 RAG 主链路
2. 让你能亲手跑通一个最小可工作的版本

## 目录说明

- `src/app.ts`：最小 RAG 主程序
- `data/knowledge.txt`：示例知识库
- `notes/01-demo目标.md`：学习目标
- `notes/02-demo流程.md`：RAG 流程说明
- `notes/03-demo代码讲解.md`：代码结构说明
- `notes/04-demo主链路总结.md`：主链路复述与代码对应

## 如何运行

先编译：

```powershell
npm run build
```

运行默认问题：

```powershell
npm start
```

运行指定问题：

```powershell
node dist/app.js "年假可以跨年吗？"
node dist/app.js "怎么重置密码？"
```

也可以直接这样一次编译并运行：

```powershell
npm run dev -- "年假可以跨年吗？"
```

## 这个 Demo 做了什么

它实现了一个极简版 RAG：

1. 读取本地知识库文本
2. 按段落切成 chunk
3. 用简化的词频向量代替真实 embedding
4. 用余弦相似度做最基础检索
5. 选出最相关 chunk
6. 基于检索结果生成一个可解释答案

## 你要知道的限制

它没有：

- 真实 embedding 模型
- 真正的向量数据库
- 外部大模型 API
- 高级 prompt

但它非常适合零基础入门，因为你能看到：

`文档 -> chunk -> 向量化 -> 检索 -> 生成`


---

## 第 1 份笔记：TS Demo 要学什么

# 第 1 份笔记：TS Demo 要学什么

## 目标

这个 demo 的目标是：

- 用 TypeScript 看懂 RAG 主链路
- 把学过的概念和代码对上
- 跑通你的第一个最小 RAG

## 你会看到什么

你会看到这条链路：

1. 读取文档
2. 切分 chunk
3. 把文本变成可比较的数据表示
4. 输入问题
5. 检索最相关 chunk
6. 输出回答

## 这里做了哪些简化

- 用简化词频向量代替真实 embedding
- 用规则生成代替真实 LLM

这样做是为了让你先看懂流程，而不是先陷进依赖和框架里。


---

## 第 2 份笔记：TS Demo 的流程

# 第 2 份笔记：TS Demo 的流程

## 整体流程

这个 demo 的流程是：

1. 读取 `knowledge.txt`
2. 按空行切成多个 chunk
3. 对每个 chunk 建立简化向量
4. 用户输入问题
5. 对问题建立同类向量
6. 计算问题和每个 chunk 的相似度
7. 取分数最高的前几个 chunk
8. 基于这些 chunk 生成最终回答

## 每一步对应什么 RAG 概念

- 读取文本：文档加载
- 按段落切分：chunk 切分
- 建立向量：embedding 的简化版
- 计算相似度：检索
- 取 top-k：返回最相关的若干 chunk
- 生成回答：生成阶段

## 重要现实问题

如果文本表示方式不好，检索就会失效。

这也是为什么真实 RAG 系统非常依赖：

- 更合理的文本切分
- 更好的 embedding 模型


---

## 第 3 份笔记：TS 代码讲解

# 第 3 份笔记：TS 代码讲解

## 主要函数

### `loadKnowledge`

作用：

- 读取知识库文本

### `splitIntoChunks`

作用：

- 按段落切分文档

### `tokenize`

作用：

- 做简化版文本切词

这里会同时使用：

- 连续中文片段
- 简单中文双字切片

这样做不是生产方案，只是为了让零依赖 demo 在中文检索下更容易跑通。

### `vectorize`

作用：

- 把文本变成词频映射

### `cosineSimilarity`

作用：

- 计算问题和 chunk 的相似度

### `retrieve`

作用：

- 选出最相关的 top-k chunk

### `generateAnswer`

作用：

- 根据检索结果生成一个可解释回答


---

## 第 4 份笔记：TS Demo 主链路总结

# 第 4 份笔记：TS Demo 主链路总结

## 这份 Demo 是怎么工作的

你可以按下面这个顺序理解：

1. 先读取知识库文本
2. 把整篇文本切成多个 chunk
3. 把问题和 chunk 都拆成更小的 token
4. 把 token 统计成词频向量
5. 计算问题和每个 chunk 的相似度
6. 取最相关的 top-k chunk
7. 基于检索结果生成最终回答

## 对应到代码

### `loadKnowledge`

作用：

- 读取知识库文本

### `splitIntoChunks`

作用：

- 把整篇文档切成多个 chunk

### `tokenize`

作用：

- 把问题或 chunk 拆成更小的可比较单位

### `vectorize`

作用：

- 统计每个 token 出现的次数
- 形成词频向量

### `cosineSimilarity`

作用：

- 计算两个向量有多接近

### `retrieve`

作用：

- 对每个 chunk 计算相似度
- 找出最相关的 chunk 和分数

### `generateAnswer`

作用：

- 基于检索结果生成最终回答

## 你必须注意的一个细节

`retrieve` 不是直接拿原始文字比较，
而是先依赖 `vectorize` 的结果。

也就是说：

- 先把文字变成可计算的数据
- 再比较相似度
- 最后才知道哪些 chunk 更相关

## 一句话总结

这个 demo 的本质是：

`把文档处理成可检索的 chunk，再根据问题找到最相关内容，最后基于这些内容生成回答。`


---

## LangChain TypeScript 版 RAG 骨架

# LangChain TypeScript 版 RAG 骨架

这个目录不是你手写版 demo 的替代品，而是一个对照骨架。

目标是让你看到：

- 手写版 RAG 的每一步
- 在 LangChain 里分别变成什么组件

## 当前状态

这里先提供：

- LangChain 风格的项目结构
- 一个最小 `2-step RAG` 骨架示例
- 中文对照笔记

注意：

这个目录目前重点是“看懂结构”，不保证在当前环境里已经安装完依赖。

如果后面要真正运行，你需要安装依赖，并配置：

- `OPENAI_API_KEY`

## 目录说明

- `src/app.ts`：LangChain 风格最小 RAG 骨架
- `src/manual-map.ts`：手写版和 LangChain 版对应关系
- `data/knowledge.txt`：示例知识库
- `notes/01-骨架目标.md`
- `notes/02-结构对照.md`
- `notes/03-执行流程.md`

## 手写版 vs LangChain 版

### 手写版

读文件 -> 切 chunk -> tokenize -> vectorize -> retrieve -> generateAnswer

### LangChain 版

Loader -> Splitter -> Embeddings -> Vector Store -> Retriever -> Prompt -> Chat Model

## 后续如果要运行

```powershell
npm install
npm run build
npm start
```


---

## 第 1 份笔记：这个 LangChain 骨架要干什么

# 第 1 份笔记：这个 LangChain 骨架要干什么

## 目标

这个目录的目标不是立刻替换你手写版 demo，
而是让你第一次看到：

- 同一个 RAG
- 用 LangChain 组织起来后
- 代码结构会怎么变化

## 你当前最该看什么

你应该重点看：

- `src/manual-map.ts`
- `src/app.ts`

因为这两个文件会直接告诉你：

- 你手写版的每一步
- 在 LangChain 里分别落到哪里

## 为什么先做骨架

因为如果一上来就装依赖、调 API、改配置，
你容易把重点从“理解结构”变成“修环境问题”。

现在先把结构看清楚，再运行，效率更高。


---

## 第 2 份笔记：结构对照

# 第 2 份笔记：结构对照

## 你的手写版 TS Demo

1. `loadKnowledge`
2. `splitIntoChunks`
3. `tokenize`
4. `vectorize`
5. `retrieve`
6. `generateAnswer`

## LangChain 版对应结构

1. `TextLoader`
2. `RecursiveCharacterTextSplitter`
3. `OpenAIEmbeddings`
4. `MemoryVectorStore`
5. `retriever`
6. `ChatPromptTemplate`
7. `ChatOpenAI`

## 核心区别

### 手写版

- 你自己控制底层细节

### LangChain 版

- 你主要负责组装标准组件

## 你现在最该理解的一点

LangChain 没有改变 RAG 的本质流程。

它改变的是：

- 你不再自己写底层算法
- 而是换成框架组件


---

## 第 3 份笔记：执行流程

# 第 3 份笔记：执行流程

## LangChain 版最小执行流程

### A. 加载文档

- 用 loader 读取知识库

### B. 切分 chunk

- 用 text splitter 切成更适合检索的片段

### C. 建立向量索引

- 用 embeddings 把文本转成向量
- 用 vector store 保存

### D. 拿到 retriever

- 让上层只关心“拿相关文档”

### E. 构造 prompt

- 把检索结果和用户问题拼成模型输入

### F. 交给 chat model

- 让大模型基于上下文生成最终答案

## 你要注意的重点

这里最重要的不是记 API 名字，
而是看到：

`检索层` 和 `生成层` 在 LangChain 里分得更清楚了。


---

## 第 4 份笔记：从手写版迁移到 LangChain 版

# 第 4 份笔记：从手写版迁移到 LangChain 版

## 迁移时最重要的认知

你不是在“学习另一套完全不同的 RAG”，
你是在：

`把手写版里自己实现的步骤，替换成 LangChain 标准组件。`

## 一步一步怎么替换

### 手写版：`loadKnowledge`

你自己读文件。

### LangChain 版：`TextLoader`

交给 Loader 读文件，并输出文档对象。

## 手写版：`splitIntoChunks`

你自己按空行切。

## LangChain 版：`RecursiveCharacterTextSplitter`

交给框架切分，并顺便控制：

- chunk size
- overlap

## 手写版：`tokenize + vectorize`

你自己拆词、统计词频。

## LangChain 版：`OpenAIEmbeddings`

交给真实 embedding 模型做语义向量化。

## 手写版：`retrieve`

你自己：

- 遍历 chunk
- 算相似度
- 排序
- 取 top-k

## LangChain 版：`MemoryVectorStore + retriever`

交给：

- 向量库负责存和查
- retriever 负责统一返回相关文档

## 手写版：`generateAnswer`

你自己把检索结果拼成回答。

## LangChain 版：`ChatPromptTemplate + ChatOpenAI`

先把上下文和问题组织成 prompt，
再交给真实聊天模型生成答案。

## 你应该从这个骨架看到什么

最重要的不是 API 名字，
而是：

- 哪些逻辑还在
- 哪些细节不再由你自己手写

## 一句话总结

手写版学原理，
LangChain 版学工程组件怎么拼起来。


---

## RAG Demo 代码与配置完整收录

本节把 RAG 相关项目中的代码、配置和示例知识库直接收录为代码块，方便删除原项目后仍可查看和复用。

---

## Python 手写 RAG 示例：app.py

```python
from __future__ import annotations

import math
import re
import sys
from collections import Counter
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
KNOWLEDGE_FILE = BASE_DIR / "data" / "knowledge.txt"
TOP_K = 2


def load_knowledge(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def split_into_chunks(text: str) -> list[str]:
    return [chunk.strip() for chunk in re.split(r"\n\s*\n", text) if chunk.strip()]


def tokenize(text: str) -> list[str]:
    lowered = text.lower()
    tokens = re.findall(r"[a-z0-9_]+", lowered)
    chinese_parts = re.findall(r"[\u4e00-\u9fff]+", lowered)

    for part in chinese_parts:
        if len(part) >= 2:
            tokens.append(part)
            tokens.extend(part[index : index + 2] for index in range(len(part) - 1))
        else:
            tokens.append(part)
    return tokens


def vectorize(text: str) -> Counter[str]:
    return Counter(tokenize(text))


def cosine_similarity(vec_a: Counter[str], vec_b: Counter[str]) -> float:
    common_words = set(vec_a) & set(vec_b)
    dot_product = sum(vec_a[word] * vec_b[word] for word in common_words)
    norm_a = math.sqrt(sum(value * value for value in vec_a.values()))
    norm_b = math.sqrt(sum(value * value for value in vec_b.values()))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot_product / (norm_a * norm_b)


def retrieve(question: str, chunks: list[str], top_k: int = TOP_K) -> list[tuple[float, str]]:
    question_vector = vectorize(question)
    scored_chunks: list[tuple[float, str]] = []
    for chunk in chunks:
        chunk_vector = vectorize(chunk)
        score = cosine_similarity(question_vector, chunk_vector)
        scored_chunks.append((score, chunk))
    scored_chunks.sort(key=lambda item: item[0], reverse=True)
    return scored_chunks[:top_k]


def generate_answer(question: str, retrieved_chunks: list[tuple[float, str]]) -> str:
    best_score = retrieved_chunks[0][0] if retrieved_chunks else 0.0
    if best_score == 0.0:
        return "我没有在知识库中找到足够相关的内容，当前无法可靠回答这个问题。"

    context = "\n\n".join(chunk for _, chunk in retrieved_chunks)
    return (
        "这是一个基于检索结果生成的示例回答。\n\n"
        f"你的问题：{question}\n\n"
        "系统检索到的相关内容如下：\n"
        f"{context}\n\n"
        "基于以上内容，你可以把答案理解为：\n"
        "请优先参考上面的原文片段，因为这个 demo 的回答是根据检索结果拼接生成的。"
    )


def print_chunks(chunks: list[str]) -> None:
    print("\n[系统] 已切分出的 chunks：")
    for index, chunk in enumerate(chunks, start=1):
        print(f"\nChunk {index}:")
        print(chunk)


def print_retrieved_chunks(results: list[tuple[float, str]]) -> None:
    print("\n[系统] 检索结果：")
    for index, (score, chunk) in enumerate(results, start=1):
        print(f"\nTop {index} | score={score:.4f}")
        print(chunk)


def main() -> None:
    knowledge_text = load_knowledge(KNOWLEDGE_FILE)
    chunks = split_into_chunks(knowledge_text)

    print("=== 最小 RAG Demo ===")
    print(f"[系统] 知识库路径: {KNOWLEDGE_FILE}")
    print(f"[系统] 共切分出 {len(chunks)} 个 chunks")
    print_chunks(chunks)

    cli_question = " ".join(sys.argv[1:]).strip()
    if cli_question:
        question = cli_question
        print(f"\n[系统] 使用命令行问题: {question}")
    else:
        print("\n请输入你的问题，直接回车可使用默认问题。")
        question = input("问题: ").strip()
        if not question:
            question = "年假可以跨年吗？"

    results = retrieve(question, chunks, top_k=TOP_K)
    print_retrieved_chunks(results)

    answer = generate_answer(question, results)
    print("\n[系统] 最终回答：")
    print(answer)


if __name__ == "__main__":
    main()
```


---

## Python 手写 RAG 示例知识库：knowledge.txt

```text
公司请假制度

员工年假原则上应当在当年使用完毕。特殊情况经主管审批后，可以顺延至次年第一季度。

病假需要提供医院开具的相关证明材料。病假期间的薪资按照公司制度和当地劳动规定执行。

事假一般需要提前提交申请，并说明事由。未经审批擅自缺勤，可能按旷工处理。

账号与密码管理

员工忘记系统密码时，应先进入公司统一身份认证页面，点击“忘记密码”入口。

密码重置通常需要验证工号、绑定手机或企业邮箱。验证通过后，系统会允许用户设置新密码。

如果绑定信息失效，员工需要联系 IT 服务台，由管理员进行人工核验后协助重置。

报销制度

日常差旅报销需要提交发票、行程单以及审批记录。票据不完整时，财务可能退回申请。

餐饮报销应符合公司标准，超出标准部分需要额外说明并走特殊审批流程。
```


---

## TypeScript 手写 RAG 示例：src/app.ts

```ts
declare const __dirname: string;
declare const process: { argv: string[] };
declare function require(moduleName: string): any;

const fs: {
  readFileSync(filePath: string, encoding: string): string;
} = require("fs");

const path: {
  resolve(...parts: string[]): string;
  join(...parts: string[]): string;
} = require("path");

type Vector = Map<string, number>;
type RetrievalResult = {
  score: number;
  chunk: string;
};

const baseDir = path.resolve(__dirname, "..");
const knowledgeFile = path.join(baseDir, "data", "knowledge.txt");
const topK = 2;

function loadKnowledge(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8");
}

function splitIntoChunks(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0);
}

function tokenize(text: string): string[] {
  const lowered = text.toLowerCase();
  const tokens: string[] = lowered.match(/[a-z0-9_]+/g) ?? [];
  const chineseParts: string[] = lowered.match(/[\u4e00-\u9fff]+/g) ?? [];

  for (const part of chineseParts) {
    if (part.length >= 2) {
      tokens.push(part);
      for (let index = 0; index < part.length - 1; index += 1) {
        tokens.push(part.slice(index, index + 2));
      }
    } else {
      tokens.push(part);
    }
  }

  return tokens;
}

function vectorize(text: string): Vector {
  const vector: Vector = new Map();
  for (const token of tokenize(text)) {
    vector.set(token, (vector.get(token) ?? 0) + 1);
  }
  return vector;
}

function cosineSimilarity(vectorA: Vector, vectorB: Vector): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const value of vectorA.values()) {
    normA += value * value;
  }

  for (const value of vectorB.values()) {
    normB += value * value;
  }

  for (const [token, valueA] of vectorA.entries()) {
    const valueB = vectorB.get(token);
    if (valueB !== undefined) {
      dotProduct += valueA * valueB;
    }
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function retrieve(question: string, chunks: string[], limit = topK): RetrievalResult[] {
  const questionVector = vectorize(question);
  const scoredChunks = chunks.map((chunk) => ({
    score: cosineSimilarity(questionVector, vectorize(chunk)),
    chunk
  }));

  scoredChunks.sort((left, right) => right.score - left.score);
  return scoredChunks.slice(0, limit);
}

function generateAnswer(question: string, retrievedChunks: RetrievalResult[]): string {
  const bestScore = retrievedChunks[0]?.score ?? 0;
  if (bestScore === 0) {
    return "我没有在知识库中找到足够相关的内容，当前无法可靠回答这个问题。";
  }

  const context = retrievedChunks.map((item) => item.chunk).join("\n\n");
  return [
    "这是一个基于检索结果生成的示例回答。",
    "",
    `你的问题：${question}`,
    "",
    "系统检索到的相关内容如下：",
    context,
    "",
    "基于以上内容，你可以把答案理解为：",
    "请优先参考上面的原文片段，因为这个 demo 的回答是根据检索结果拼接生成的。"
  ].join("\n");
}

function printChunks(chunks: string[]): void {
  console.log("\n[系统] 已切分出的 chunks：");
  chunks.forEach((chunk, index) => {
    console.log(`\nChunk ${index + 1}:`);
    console.log(chunk);
  });
}

function printRetrievedChunks(results: RetrievalResult[]): void {
  console.log("\n[系统] 检索结果：");
  results.forEach((result, index) => {
    console.log(`\nTop ${index + 1} | score=${result.score.toFixed(4)}`);
    console.log(result.chunk);
  });
}

function main(): void {
  const knowledgeText = loadKnowledge(knowledgeFile);
  const chunks = splitIntoChunks(knowledgeText);
  const cliQuestion = process.argv.slice(2).join(" ").trim();
  const question = cliQuestion || "年假可以跨年吗？";

  console.log("=== 最小 RAG Demo TypeScript 版 ===");
  console.log(`[系统] 知识库路径: ${knowledgeFile}`);
  console.log(`[系统] 共切分出 ${chunks.length} 个 chunks`);
  printChunks(chunks);
  console.log(`\n[系统] 当前问题: ${question}`);

  const results = retrieve(question, chunks, topK);
  printRetrievedChunks(results);

  const answer = generateAnswer(question, results);
  console.log("\n[系统] 最终回答：");
  console.log(answer);
}

main();
```


---

## TypeScript 手写 RAG package.json

```json
{
  "name": "rag-demo-ts",
  "version": "1.0.0",
  "private": true,
  "type": "commonjs",
  "scripts": {
    "build": "tsc",
    "start": "node dist/app.js",
    "dev": "npm run build && node dist/app.js"
  }
}
```


---

## TypeScript 手写 RAG tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts"]
}
```


---

## TypeScript 手写 RAG 示例知识库：knowledge.txt

```text
公司请假制度

员工年假原则上应当在当年使用完毕。特殊情况经主管审批后，可以顺延至次年第一季度。

病假需要提供医院开具的相关证明材料。病假期间的薪资按照公司制度和当地劳动规定执行。

事假一般需要提前提交申请，并说明事由。未经审批擅自缺勤，可能按旷工处理。

账号与密码管理

员工忘记系统密码时，应先进入公司统一身份认证页面，点击“忘记密码”入口。

密码重置通常需要验证工号、绑定手机或企业邮箱。验证通过后，系统会允许用户设置新密码。

如果绑定信息失效，员工需要联系 IT 服务台，由管理员进行人工核验后协助重置。

报销制度

日常差旅报销需要提交发票、行程单以及审批记录。票据不完整时，财务可能退回申请。

餐饮报销应符合公司标准，超出标准部分需要额外说明并走特殊审批流程。
```


---

## LangChain TypeScript RAG 骨架：src/app.ts

```ts
import { TextLoader } from "@langchain/community/document_loaders/fs/text";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

const knowledgePath = new URL("../data/knowledge.txt", import.meta.url).pathname;
const question = process.argv.slice(2).join(" ").trim() || "年假可以跨年吗？";

async function main(): Promise<void> {
  // 1. Loader: 对应手写版 loadKnowledge
  const loader = new TextLoader(knowledgePath);
  const docs = await loader.load();

  // 2. Splitter: 对应手写版 splitIntoChunks
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 120,
    chunkOverlap: 20
  });
  const splitDocs = await splitter.splitDocuments(docs);

  // 3. Embeddings + Vector Store: 对应手写版 tokenize + vectorize + 部分 retrieve
  const embeddings = new OpenAIEmbeddings();
  const vectorStore = await MemoryVectorStore.fromDocuments(splitDocs, embeddings);

  // 4. Retriever: 对应手写版 retrieve
  const retriever = vectorStore.asRetriever(2);
  const retrievedDocs = await retriever.invoke(question);

  // 5. Prompt: 对应手写版 generateAnswer 里的“组织输入”
  const context = retrievedDocs.map((doc) => doc.pageContent).join("\n\n");
  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "你只能根据提供的上下文回答。如果上下文不足，请明确说明。"
    ],
    [
      "human",
      "上下文如下：\n{context}\n\n问题如下：\n{question}"
    ]
  ]);

  const messages = await prompt.formatMessages({
    context,
    question
  });

  // 6. Chat Model: 对应手写版 generateAnswer 里的“最终回答”
  const model = new ChatOpenAI({
    model: "gpt-4o-mini"
  });

  const response = await model.invoke(messages);

  console.log("=== LangChain TypeScript RAG 骨架 ===");
  console.log(`问题: ${question}`);
  console.log("\n检索到的 chunks:");
  retrievedDocs.forEach((doc, index) => {
    console.log(`\nChunk ${index + 1}:`);
    console.log(doc.pageContent);
  });

  console.log("\n最终回答:");
  console.log(response.content);
}

main().catch((error) => {
  console.error("LangChain RAG 示例运行失败：");
  console.error(error);
  process.exitCode = 1;
});
```


---

## LangChain 映射表代码：src/manual-map.ts

```ts
export const manualToLangChainMap = [
  {
    manual: "loadKnowledge",
    langchain: "TextLoader",
    meaning: "读取本地文本并转成文档对象"
  },
  {
    manual: "splitIntoChunks",
    langchain: "RecursiveCharacterTextSplitter",
    meaning: "把文档切成更适合检索的 chunk"
  },
  {
    manual: "tokenize + vectorize",
    langchain: "OpenAIEmbeddings",
    meaning: "把文本变成真实语义向量"
  },
  {
    manual: "retrieve",
    langchain: "MemoryVectorStore + retriever",
    meaning: "存向量并按统一接口返回相关文档"
  },
  {
    manual: "generateAnswer",
    langchain: "ChatPromptTemplate + ChatOpenAI",
    meaning: "把上下文和问题组织给模型，再生成答案"
  }
] as const;
```


---

## LangChain TypeScript package.json

```json
{
  "name": "rag-langchain-ts",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "node dist/app.js"
  },
  "dependencies": {
    "@langchain/community": "^0.3.0",
    "@langchain/core": "^0.3.0",
    "@langchain/openai": "^0.4.0",
    "@langchain/textsplitters": "^0.1.0",
    "langchain": "^0.3.0"
  }
}
```


---

## LangChain TypeScript tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts"]
}
```


---

## LangChain TypeScript 示例知识库：knowledge.txt

```text
公司请假制度

员工年假原则上应当在当年使用完毕。特殊情况经主管审批后，可以顺延至次年第一季度。

病假需要提供医院开具的相关证明材料。病假期间的薪资按照公司制度和当地劳动规定执行。

事假一般需要提前提交申请，并说明事由。未经审批擅自缺勤，可能按旷工处理。

账号与密码管理

员工忘记系统密码时，应先进入公司统一身份认证页面，点击“忘记密码”入口。

密码重置通常需要验证工号、绑定手机或企业邮箱。验证通过后，系统会允许用户设置新密码。

如果绑定信息失效，员工需要联系 IT 服务台，由管理员进行人工核验后协助重置。
```
