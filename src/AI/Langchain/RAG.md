# RAG 完整知识（概念 + 手写 Demo + LangChain.js v1 实战）

> 本篇聚焦 RAG 的概念、边界和常见数据流。Python/TypeScript 演示、LangChain.js 实战与评估优化分别放在本系列后续文章。

---

## 第一部分 · 概念

### 1. 什么是 RAG

RAG 是 `Retrieval-Augmented Generation`（检索增强生成）的缩写。它做三件事：

1. 先从知识库里**找**相关内容
2. 把这些内容**喂**给大模型
3. 让大模型**基于这些内容**回答问题

最形象的理解：

> **RAG = 让大模型进行一次临时开卷考试。**

#### 为什么需要 RAG

普通大模型有三个天生的限制：

- 它不知道你的私有资料（公司制度、内部文档）
- 缺少事实依据时，它可能会胡乱猜测（幻觉）
- 它自带的知识可能已经过时

RAG 就是在每次提问时，**临时**给模型补充外部知识，让回答有依据。

#### 一个直观例子

公司手册里写着：

> 「员工年假原则上应在当年使用完毕，特殊情况经审批后可顺延至次年第一季度。」

用户问：「年假可以跨年吗？」

- **没有 RAG**：模型只能凭印象猜。
- **有 RAG**：系统先检索到这段原文，模型基于它回答「原则上当年用完，审批后可顺延到次年第一季度」。

#### 记住这几点

- RAG 是让模型**使用外部知识**，不是训练模型
- 主要用于「基于资料回答问题」
- 检索质量是回答质量的重要因素，但生成模型、提示词、上下文组织和数据本身同样会影响结果

---

### 2. RAG 不等于微调（最重要的辨析）

| | RAG | 微调（Fine-tuning） |
|---|---|---|
| 本质 | 回答前临时查资料 | 用你的数据继续训练模型 |
| 改不改模型参数 | **不改** | **会改** |
| 适合做什么 | 知识库问答、需要引用原文 | 改回答风格 / 格式 / 任务能力 |
| 知识更新 | 重建知识库即可，灵活 | 要重新训练，重 |
| 成本 | 低，易落地 | 高（要数据、算力、训练、评估） |

一句话记忆：

> **RAG = 临时给资料；微调 = 直接改模型。**

用最直观的话：**RAG 是考试时给模型一本参考书；微调是重新训练模型，让它形成新习惯。**

判断方法：

- 想让模型**基于某批文档回答问题** → 先想 RAG
- 想让模型**长期固定某种风格 / 格式 / 任务模式** → 才考虑微调

微调更常见的用途不是「塞知识」，而是：让模型学会特定回答风格、适应某个任务格式、贴近某个领域的表达习惯（如法律问答格式、客服回复风格、SQL 生成格式）。

**常见判断题**：「想让模型稳定输出某种 JSON 格式，该用 RAG 还是微调？」
答案：**都不是先想到的**。优先级是「先 prompt 明确格式 → 再用结构化输出 / schema 约束 → 长期还不稳定才考虑微调」。因为 JSON 格式是「输出怎么控制」的问题，不是「知识从哪来」的问题。

---

### 3. 常见 2-step RAG 的组成

| 部件 | 职责 | 一句话 |
|---|---|---|
| 1. 文档 | 原始知识来源（PDF / 网页 / Markdown / Word / 数据库） | 所有处理的起点 |
| 2. Chunk 切分 | 把大文档切成小文本块 | 让检索更精确 |
| 3. Embedding | 把文本转成语义向量 | 让系统按「意思」搜，而不只是关键词 |
| 4. 向量数据库 | 存 chunk、向量、元数据，支持相似度搜索 | 存和查语义向量的地方 |
| 5. 检索器 | 根据问题找出最相关的 chunk | 决定给模型什么证据 |
| 6. Prompt | 把上下文 + 问题 + 规则组织成模型输入 | 组织证据 |
| 7. 大模型 | 基于 Prompt 生成最终答案 | 输出答案 |

在这种 2-step 流程里，检索器先找资料，大模型再基于上下文回答。Agentic RAG 中，模型也可以参与查询改写、选择检索工具或决定是否继续检索；协议和架构并不要求模型永远只负责最后生成。

---

### 4. 常见向量检索 RAG：离线 + 在线两个阶段

这是 RAG 最该刻进脑子的一张图。

#### 离线阶段（准备知识库，用户提问之前）

```
文档  →  清洗  →  Chunk 切分  →  生成 Embedding  →  存入向量数据库
```

- **收集文档**：产品手册、公司制度、FAQ、研究笔记
- **清洗**：去乱码、去重、修复格式，**保留标题/来源/章节等元数据**（元数据在过滤检索和追溯原文时非常有用，别丢）
- **切分 / 向量化 / 入库**：见第 5 章

#### 在线阶段（回答用户问题）

```
问题  →  问题向量化  →  检索相似 chunk  →  构造 Prompt  →  模型生成答案
```

#### 关键认知

> **离线准备决定基础，在线回答决定体验。**

很多 RAG 的质量问题，在「生成」之前就已经产生了（文档脏、chunk 切坏、检索没命中）。所以排查问题要往前看，不要只盯着最后那句回答。

---

### 5. 主链路逐个拆解

#### 5.1 Chunk 切分

**Chunk** 就是从文档切出来的一小段文本。为什么不直接拿整篇去检索？整篇太长、噪声多；用户问题通常只对应文档的一小部分；检索在小单位上更准。

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

#### 5.2 Embedding 向量化

**Embedding** = 把一段文本映射成一串表示其语义的数字向量，比如 `[0.12, -0.48, 1.03, ...]`（示意，不代表真实长度）。

这串数字不是给人看的，是给计算机做**相似度计算**用的：

> 语义接近的文本，会被映射到位置接近的向量。

**为什么需要它（关键词检索不够用）**：

- 问题写「离职流程」
- 文档写「员工解除劳动关系手续」
- 词不同但意思接近 —— embedding 更有机会把它找出来

**在 RAG 里怎么用**：离线时每个 chunk 转成一个向量；在线时用户问题也转成向量，拿它去找最相似的 chunk 向量。

**Embedding 不是万能的**，它在这些场景容易翻车：专业术语理解不准、短文本歧义、数字/代码/编号类匹配不稳定。所以真实系统常把向量检索 + 关键词检索结合（见 5.4）。

#### 5.3 向量数据库

存三样东西：chunk 文本、对应向量、元数据。支持「拿一个问题向量去找最相近的几个 chunk 向量」。

> **向量数据库 = 存和查语义向量的地方。**

#### 5.4 检索机制（影响系统质量的关键步骤）

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

> 漏召回会使系统缺少必要证据；噪声、错误资料或错误排序同样可能严重误导生成结果，具体优先级取决于任务风险和评估指标。

检索提供事实基础，生成层负责理解、整合和表达。任何一层出错都可能导致失败，因此应分别评估检索与生成，而不是把质量上限只归因于单一环节。

#### 5.5 生成回答

生成阶段的输入通常有三部分：**系统指令（回答规则） + 检索到的上下文 + 用户问题**。

**Prompt 的核心作用**不只是「让模型回答」，而是：

> **规定模型应该根据什么回答、怎么回答、什么时候拒绝乱答。**

一条最核心的生成原则：

> **有依据再回答，没依据就承认不知道。**

**为什么检索对了，生成还可能错**：模型没老实依据上下文、模型自己补了原文没有的内容、prompt 约束不清、上下文太长模型抓错重点、多个 chunk 之间有冲突整合失败。

所以要学会区分问题出在哪：

- 知识库原文就错 → **数据问题**
- 没检索到关键 chunk → **检索问题**
- 检索到了正确内容但答偏了 → 才更像**生成问题**

---

### 6. 最小 RAG 系统：到底需要什么

一个常见的向量检索 RAG 原型可以包含 5 样东西：

1. 一小批文档
2. 一种 chunk 切分方法
3. 一种检索表示方式（可以是关键词索引，也可以是 embedding）
4. 一个可查询的检索层；小规模原型不一定需要独立向量数据库
5. 一个负责回答的大模型

**第一版要证明的唯一一件事**：

> 系统能够根据我的文档回答问题，而不是让模型瞎猜。

**第一版不需要**：多智能体、高级 reranker、混合检索、查询改写、微调、分布式基础设施。

**跑通的标志**：能为简单问题找到相关 chunk；答案能对应到检索文本；你能看到系统用了哪个 chunk；答错时你能追查是检索问题还是切分问题。

> **可观察性比复杂度更重要。**

---

---

## 第二部分 · 动手实战：跑通最小 RAG

### 7. 手写版（看清每一步）

下面是一个不依赖第三方检索库的教学 demo，Python 和 TypeScript 两个版本逻辑一致。它用「词频向量 + 余弦相似度」代替真实 embedding，并用规则拼接代替生成模型，因此严格说只是“检索 + 上下文展示”的玩具链路，不是完整的生成式 RAG。TypeScript 版本仍需要 Node.js 和 TypeScript 执行工具。

#### 7.1 准备知识库 `data/knowledge.txt`（两个版本共用）

```text
公司请假制度

员工年假原则上应当在当年使用完毕。特殊情况经主管审批后，可以顺延至次年第一季度。

病假需要提供医院开具的相关证明材料。病假期间的薪资按照公司制度和当地劳动规定执行。

事假一般需要提前提交申请，并说明事由。未经审批擅自缺勤，可能按旷工处理。

账号与密码管理

员工忘记系统密码时，应先进入公司统一身份认证页面，点击"忘记密码"入口。

密码重置通常需要验证工号、绑定手机或企业邮箱。验证通过后，系统会允许用户设置新密码。

如果绑定信息失效，员工需要联系 IT 服务台，由管理员进行人工核验后协助重置。

报销制度

日常差旅报销需要提交发票、行程单以及审批记录。票据不完整时，财务可能退回申请。

餐饮报销应符合公司标准，超出标准部分需要额外说明并走特殊审批流程。
```

#### 7.2 Python 版 `app.py`

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

运行：

```bash
python app.py "年假可以跨年吗？"
```

你会看到：切出了几个 chunk → 检索到哪两段、分数多少 → 基于这两段拼出的回答。**重点不是回答多漂亮，而是你能看到「它用了哪些证据」**，这就是 RAG 可观察性的起点。

#### 7.3 TypeScript 版 `app.ts`

逻辑和 Python 版完全一致，同样零依赖，用 Node 内置的 `fs`/`path` 读文件即可。

```ts
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

type Vector = Map<string, number>;
type RetrievalResult = { score: number; chunk: string };

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const baseDir = path.resolve(currentDir, "..");
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

运行环境：Node.js 20+，项目使用 ESM。先安装 TypeScript 执行工具：

```bash
npm i -D typescript tsx @types/node
npx tsx src/app.ts "年假可以跨年吗？"
```

> 关于中文：这个 demo 同时用「连续中文片段 + 双字切片」来提高中文检索命中率——不是标准生产方案，只是让零依赖 demo 在中文下更容易跑通。这也让你第一次看到：**如果文本切分太粗糙，明明在说同一件事也可能算不出相似度**，所以真实 RAG 非常依赖更好的切分和 embedding。

---

---

## 第三部分 · 迁移到真实框架（LangChain.js v1）

运行前提：Node.js 20+、ESM 项目，并安装 `langchain @langchain/core @langchain/openai @langchain/classic @langchain/textsplitters`。聊天模型与 Embedding 可能来自不同提供商，应分别配置 `CHAT_API_KEY` / `CHAT_BASE_URL` 与 `EMBEDDING_API_KEY` / `EMBEDDING_BASE_URL`。DeepSeek 官方 API 当前不提供 OpenAI Embedding 模型，不能把同一个 DeepSeek 地址直接用于下面的 `OpenAIEmbeddings`。

### 8. 手写版 → LangChain 组件的一一对应

手写版帮你理解原理，但它有两个「假」的地方：用词频向量代替真实 embedding，用规则拼接代替真实模型。真实 RAG 会把这些换成标准组件。**RAG 是方法，LangChain 是实现这个方法的框架——LangChain 没有发明 RAG，只是把零散步骤封装成可替换的组件。**

| 手写版 | LangChain 组件 | 它负责什么 |
|---|---|---|
| `loadKnowledge` | `TextLoader`（Document Loader） | 从 txt/pdf/网页等读取，统一成文档对象 |
| `splitIntoChunks` | `RecursiveCharacterTextSplitter` | 切分，控制 chunk size 和 overlap |
| `tokenize + vectorize` | `OpenAIEmbeddings`（Embedding 模型） | 把文本变成**真实**语义向量 |
| `retrieve` | `MemoryVectorStore + Retriever` | 向量库存和查，retriever 统一返回相关文档 |
| `generateAnswer` | `ChatPromptTemplate + ChatOpenAI` | 组织 prompt，交给真实模型生成自然语言答案 |

差距最大的是最后一步：手写版只是拼字符串，LangChain 版是真的让大模型生成回答。

> 先写手写版，你会知道**每一步为什么存在、出错会怎么坏**；再看 LangChain 就不会把它当黑盒。**手写版学原理，LangChain 版学工程组件怎么拼起来。**

### 9. 核心概念三件套

| 概念 | 作用 | 类比 |
|---|---|---|
| **Embedding（嵌入）** | 把文本转成向量，语义相近的向量也相近 | 给每段话一个「语义坐标」 |
| **Vector Store（向量库）** | 存向量 + 支持「找最相似的 K 个」 | 按语义检索的数据库 |
| **Retriever（检索器）** | 输入问题，吐出相关文档块 | 图书管理员 |

#### 为什么 Vector Store 和 Retriever 要拆开

在手写版里 `retrieve` 一个函数干了两件事，但 LangChain 把它拆成两层：

| | Vector Store | Retriever |
|---|---|---|
| 角色 | 底层数据层（像仓库） | 上层检索接口（像前台取货窗口） |
| 负责 | 存向量/文本/元数据、按相似度查 | 接收问题，调底层，统一返回相关文档 |
| 关心 | 数据怎么存、相似度怎么查 | 给上层统一调用方式，屏蔽底层差异 |

拆开的核心原因：**Retriever 不一定来自向量库**——它也可以来自关键词搜索、API、SQL、混合检索。上层的 prompt / chain / agent 只关心「给我一批相关文档」，不关心底层是 Pinecone 还是 Qdrant。拆层之后组件可替换、接入更灵活。

> **Vector Store = 存和查；Retriever = 问题进来，统一返回相关文档。**

### 10. v1 实战：切块与建库

#### 10.1 切块（Text Splitting）

v1 用 `@langchain/textsplitters`。

```ts
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 200,    // 每块最多约 200 字符
  chunkOverlap: 40,  // 相邻块重叠 40 字符，避免切断语义
});

const docs = await splitter.createDocuments([rawText]);
console.log(docs.length, "个块");
console.log(docs[0]); // Document { pageContent: "...", metadata: {} }
```

#### 10.2 Embedding + 向量库

用 `MemoryVectorStore`（内存向量库，最适合学习/原型）。

> ⚠️ **v1 重要变化**：`MemoryVectorStore` 已从 `langchain` 主包移到 **`@langchain/classic`**。
> 老教程写 `from "langchain/vectorstores/memory"` 在 v1 会报错，正确路径见下。

```ts
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",        // 第三方支持的 embedding 模型名
  apiKey: process.env.EMBEDDING_API_KEY,
  configuration: {
    baseURL: process.env.EMBEDDING_BASE_URL, // 指向支持 Embedding 的接口
  },
});

// 把上一步的 docs 向量化并存入
const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
```

> ⚠️ **用第三方接口时最容易踩的坑**：embedding 和 chat 是两个不同的端点，不少中转/第三方服务**只代理了 chat，没代理 embeddings**，或 embedding 的 `baseURL`、模型名和 chat 不一样。
> - 先确认服务商支持哪个 embedding 模型名（常见：`text-embedding-3-small`、`bge-m3`、`text-embedding-v3` 等）。
> - 如果 embedding 走的是另一个地址，单独给 `OpenAIEmbeddings` 传它自己的 `configuration.baseURL`。
> - 建库（写入）和查询（检索）**必须用同一个 embedding 模型**，否则向量不在同一空间，检索全乱。

#### 10.3 检索（Retriever）

```ts
const retriever = vectorStore.asRetriever({
  k: 2, // 返回最相似的 2 块
});

const found = await retriever.invoke("什么是 Agent？");
found.forEach((d) => console.log("→", d.pageContent.trim()));
```

### 11. 组装完整 RAG 链

#### 11.1 LCEL 写法（标准做法）

**用 `.pipe()` / `RunnableSequence` 手动拼链**，不要用已废弃的 `RetrievalQAChain`。

```ts
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import { initChatModel } from "langchain";
import type { Document } from "@langchain/core/documents";

const model = await initChatModel("openai:deepseek-v4-flash", {
  temperature: 0,
  apiKey: process.env.CHAT_API_KEY,
  configuration: { baseURL: process.env.CHAT_BASE_URL },
});

// 把检索到的文档块拼成一段上下文文本
const formatDocs = (docs: Document[]) =>
  docs.map((d) => d.pageContent).join("\n\n");

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "你是问答助手。只能依据下面的【上下文】回答问题。\n" +
      "如果上下文没有答案，就回答「资料中没有相关信息」，不要编造。\n\n" +
      "【上下文】\n{context}",
  ],
  ["human", "{question}"],
]);

// 关键：并行准备 context 和 question，再喂给 prompt → model → parser
const ragChain = RunnableSequence.from([
  {
    context: async (input: { question: string }) =>
      formatDocs(await retriever.invoke(input.question)),
    question: new RunnablePassthrough(),
  },
  (x: { context: string; question: { question: string } }) => ({
    context: x.context,
    question: x.question.question,
  }),
  prompt,
  model,
  new StringOutputParser(),
]);

const answer = await ragChain.invoke({ question: "什么是 RAG？" });
console.log(answer);
```

#### 11.2 更简洁的写法（推荐入门用这个）

`RunnableSequence` 展示了原理但啰嗦。实际可以用普通 async 函数包起来，更直观：

```ts
async function ask(question: string): Promise<string> {
  const docs = await retriever.invoke(question);
  const context = docs.map((d) => d.pageContent).join("\n\n");

  const messages = await prompt.invoke({ context, question });
  const res = await model.invoke(messages);
  return res.text;
}

console.log(await ask("Agent 是做什么的？"));
```

> 初学阶段，**先用这种朴素函数把流程跑通、看清每一步**，再回头理解 LCEL 写法。两者效果一样。
>
> 数据流：`Retriever 找证据 → Prompt 组织证据（上下文 + 问题 + 规则）→ Chat Model 输出答案`。在这种 2-step RAG 里，检索和生成是明确分开的——Chat Model 不负责自己去搜，它拿到的是已经组好的 Prompt。

#### 11.3 完整示例

```ts
// src/02-rag.ts
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const knowledge = `
LangChain 是构建大语言模型应用的 TypeScript/Python 框架。
它的核心组合语法叫 LCEL，通过 pipe 管道把 prompt、模型、解析器串联。
RAG（检索增强生成）先从向量库检索相关资料，再让模型基于资料回答，能减少幻觉。
Agent 是让模型自主决策的模式，模型自己选择调用哪个工具，循环执行直到完成任务。
向量数据库用来存储 Embedding 向量，并支持按语义相似度检索。
`;

async function main() {
  // 1. 切块
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 120,
    chunkOverlap: 20,
  });
  const docs = await splitter.createDocuments([knowledge]);

  // 2. 建库（embedding 走第三方接口）
  const embeddings = new OpenAIEmbeddings({
    model: process.env.EMBEDDING_MODEL ?? "text-embedding-3-small",
    apiKey: process.env.EMBEDDING_API_KEY,
    configuration: { baseURL: process.env.EMBEDDING_BASE_URL },
  });
  const store = await MemoryVectorStore.fromDocuments(docs, embeddings);
  const retriever = store.asRetriever({ k: 2 });

  // 3. 提示词 + 模型（聊天也走第三方接口）
  const model = new ChatOpenAI({
    model: process.env.CHAT_MODEL ?? "deepseek-v4-flash",
    temperature: 0,
    apiKey: process.env.CHAT_API_KEY,
    configuration: { baseURL: process.env.CHAT_BASE_URL },
  });
  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "只依据【上下文】回答，没有就说「资料中没有相关信息」。\n\n【上下文】\n{context}",
    ],
    ["human", "{question}"],
  ]);

  // 4. 问答
  async function ask(question: string) {
    const found = await retriever.invoke(question);
    const context = found.map((d) => d.pageContent).join("\n\n");
    const messages = await prompt.invoke({ context, question });
    const res = await model.invoke(messages);
    console.log(`\nQ: ${question}\nA: ${res.content}`);
  }

  await ask("RAG 能解决什么问题？");
  await ask("向量数据库是干什么的？");
  await ask("今天天气怎么样？"); // 知识库里没有 → 应回答「资料中没有相关信息」
}

main();
```

运行：`npx tsx src/02-rag.ts`

### 12. 从玩具到生产：换持久化向量库

学习用 `MemoryVectorStore`（进程一停数据就没了）。真实项目可换成持久化向量存储，但不同集成在连接、索引、过滤、批量写入和删除语义上存在差异，不能假定只改几行就能安全迁移：

| 场景 | 推荐向量库 | 包 |
|---|---|---|
| 本地/小项目 | Chroma | `@langchain/community` |
| 生产/云 | Pinecone、Qdrant | `@langchain/pinecone` 等 |
| 已有 Postgres | pgvector | `@langchain/community` |

Retriever 抽象有助于复用上层链，但上线前仍需完成数据迁移或重建索引、维度与距离度量核对、认证与 TLS、租户隔离、备份恢复、容量与费用评估，并防止不可信文档中的提示注入和越权检索。

---

---

## 第四部分 · 评估、优化、排错

### 13. RAG 评估：必须分层看

不要只看「回答顺不顺」。回答不好，可能坏在文档、chunk、embedding、检索、prompt、生成任何一环。

**分三层看**：

1. **检索评估**：正确 chunk 有没有被召回？排名靠不靠前？噪声多不多？
2. **生成评估**：回答是否基于检索内容？有没有胡编？是否准确回应了问题？
3. **端到端评估**：从用户视角看，答案有没有用、可不可信、覆盖关键点了吗？

**初学者最容易犯的错**：只看回答顺不顺、不检查引用是否真支持答案、不保存检索中间结果。

> **RAG 评估必须分层。先看检索，再看生成，再看整体。**

### 14. RAG 优化方向

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

### 15. RAG 为什么会失败 + 排查顺序

常见失败原因：文档质量差、chunk 切分不合理、embedding 表示不好、检索错、检索噪声过多、prompt 约束不清、模型脱离上下文乱补。

排查时通常先保存并检查检索结果，再检查上下文组装和生成；若问题明显来自错误原文、权限过滤或生成格式，也应直接从相应层入手，不必机械遵循固定顺序。

### 16. 学习路线（4 阶段）

1. **只做最小 demo**：读文档 → 切 chunk → 检索 → 回答，先跑通
2. **让系统可观察**：打印检索结果、显示来源、显示 top-k chunk
3. **开始评估**：准备一组测试问题，人工检查检索质量和回答是否有依据
4. **开始优化**：调 chunk 大小、top-k、prompt，再尝试混合检索

> **先跑通，再观察，再评估，再优化。** 可运行、可观察、可解释，比「高级」更重要。

---

### 速记卡（背这些句子就够）

- 常见 2-step RAG 是先检索再生成；Agentic RAG 可能包含多轮检索与决策
- `RAG 管的是「知识从哪里来」`
- 向量检索链常见为 `文档 → chunk → embedding → 向量存储 → 检索 → 生成`，但 RAG 也可以使用关键词、SQL、图或混合检索
- `离线准备决定基础，在线回答决定体验`
- 检索提供证据，生成负责理解与表达，两层都需要独立评估
- `检索方式有三种：向量、关键词、混合`
- 漏召回、噪声、错误排序和越权内容的严重性取决于任务与风险
- `Chunk 设计很关键，不是越大越好也不是越小越好`
- `Embedding 是文本的语义向量，但对术语/短文本/编号不稳`
- `有依据再回答，没依据就承认不知道`
- `RAG ≠ 微调（临时给资料 vs 直接改模型）`
- `RAG ≠ LangChain（方法 vs 框架）`
- `Vector Store = 存和查；Retriever = 统一返回相关文档`
- `先看检索，再看生成`
- `先跑通，再优化，每次只改一个变量`

### 术语表

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
