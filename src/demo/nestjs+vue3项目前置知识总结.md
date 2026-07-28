# 项目基础知识汇总

## NestJS 基础

1. 如果不需要每次创建文件都附加单元测试文件

```json
{
  "generateOptions": {
    "spec": false
  }
}
```

2. 查看相关命令`nest g --help`
3. DTO 数据校验通常安装 `class-validator` 和 `class-transformer`；`ValidationPipe` 从 `@nestjs/common` 导入
4. 使用`REST Client`进行HTTP测试
5. 拦截器: 生成拦截器命令:`nest g itc 拦截器名称` 拦截器包含局部拦截器和全局拦截器两种

## 业务逻辑

不同的业务有不同的 code和message

1. `interceptor` 管成功结果，负责“包装响应”
   - 统一成功响应结构，包装成 `{ timestamp, data, path, message, code, success }`
   - 递归转换特殊类型，把 `bigint` 转成字符串、把 Date 转成时间戳，避免 JSON 序列化问题
2. `exception-filter` 管失败结果，负责“包装错误”

## Prisma ORM（7.8.x）

Prisma ORM 由 CLI、Prisma Schema、迁移工具和生成的 Prisma Client 等部分组成。Prisma 7 要求为 `prisma-client` generator 配置输出目录，并使用数据库驱动适配器创建客户端。

### 安装与初始化

以 PostgreSQL 为例：

```sh
pnpm add @prisma/client @prisma/adapter-pg pg argon2
pnpm add -D prisma dotenv @types/pg
pnpm dlx prisma init --datasource-provider postgresql
```

`prisma init` 会创建基础 Prisma 配置；`prisma dev` 只用于管理本地 Prisma Postgres 开发服务器，不是所有数据库项目都必须运行的通用应用服务器。

### Prisma 命令

| 命令 | 用途 |
| --- | --- |
| `prisma init` | 初始化 Prisma 项目；可用 `--datasource-provider` 选择数据库 |
| `prisma dev` | 管理本地 Prisma Postgres 开发服务器 |
| `prisma generate` | 根据 schema 生成 Prisma Client 等产物 |
| `prisma studio` | 打开数据库数据浏览与编辑界面 |
| `prisma migrate dev` | 在开发环境检测漂移、生成并应用迁移；Prisma 7 不再自动运行 generate 或 seed |
| `prisma migrate deploy` | 在测试或生产环境应用已经提交的迁移，不生成新迁移 |
| `prisma db pull` | 从已有数据库反向更新 Prisma Schema |
| `prisma db push` | 不生成迁移历史，直接同步 schema，适合原型；MongoDB 使用该命令而不是 Prisma Migrate |
| `prisma validate` | 校验 Prisma Schema |
| `prisma format` | 格式化 Prisma Schema |
| `prisma version` | 显示 CLI、Client 等版本 |
| `prisma debug` | 输出环境和引擎调试信息，不等同于启动调试器 |

### Schema 与连接配置

`prisma/schema.prisma`：

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  posts        Post[]
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String
  userId    String
  user      User     @relation(
    fields: [userId],
    references: [id],
    onDelete: Cascade,
    onUpdate: Cascade
  )
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}
```

常见属性：

- `@id`、`@unique`：主键与唯一约束。
- `@default(cuid())`：由 Prisma 生成字符串 ID，不等同于数据库自增整数。
- `@updatedAt`：由 Prisma ORM 自动维护更新时间，不一定是数据库原生的 ON UPDATE 语句。
- `@map` / `@@map`：映射字段名或表名。
- `@@index`：声明索引；索引会加快匹配的读查询，但也会占用空间并增加写入成本，应根据实际查询设计。

项目根目录的 `.env`：

```dotenv
DATABASE_URL="postgresql://postgres:change-me@localhost:5432/example?schema=public"
```

不要提交真实凭据。Prisma 7 在 `prisma.config.ts` 中配置 CLI 使用的连接 URL：

```ts
// prisma.config.ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: env("DATABASE_URL") },
});
```

### 迁移与生成客户端

```sh
pnpm dlx prisma migrate dev --name init
pnpm dlx prisma generate
```

`migrate dev` 只用于开发数据库。Prisma 7 不再自动触发 `prisma generate`，因此 schema 变化后要显式重新生成客户端。生产部署应在审查并提交迁移文件后运行 `prisma migrate deploy`。

### 完整 CRUD 示例

下面是一次性脚本示例。Web 服务应复用应用级 PrismaClient，并在应用关闭时统一释放，不要为每个请求创建和断开客户端。

```ts
// src/scripts/prisma-demo.ts
import argon2 from "argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  Prisma,
  PrismaClient,
} from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("缺少 DATABASE_URL 环境变量");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const createdUser = await prisma.user.create({
    data: {
      email: "test@example.com",
      passwordHash: await argon2.hash("a-strong-passphrase"),
      posts: {
        create: {
          title: "第一篇文章",
          content: "正文",
        },
      },
    },
    select: {
      id: true,
      email: true,
      createdAt: true,
      posts: true,
    },
  });

  const where: Prisma.UserWhereInput = {
    OR: [
      { email: { startsWith: "test" } },
      { email: { endsWith: "@example.com" } },
    ],
  };

  const [total, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: { posts: true },
      orderBy: [{ createdAt: "desc" }, { email: "asc" }],
      skip: 0,
      take: 10,
    }),
  ]);

  const updatedUser = await prisma.user.update({
    where: { id: createdUser.id },
    data: { email: "updated@example.com" },
    select: { id: true, email: true, updatedAt: true },
  });

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: "transaction@example.com",
        passwordHash: await argon2.hash("another-strong-passphrase"),
      },
    });
    await tx.post.create({
      data: {
        title: "事务中的文章",
        content: "只有整个事务成功时才提交",
        userId: user.id,
      },
    });
  });

  const deletedUser = await prisma.user.delete({
    where: { id: createdUser.id },
    select: { id: true, email: true },
  });

  console.log({ total, users, updatedUser, deletedUser });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

密码必须经过适合密码存储的哈希算法处理，并且查询和 API 响应不应返回 `passwordHash`。分页中的 `skip` / `take` 适合较浅页码；大数据集深分页通常应改用稳定排序字段和 cursor。事务只能保证同一数据库事务范围内的原子性，不能自动覆盖外部 HTTP 调用。

## Three.js

### 基础用法

安装：`pnpm add three @types/three`

```ts
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'; // 控制器

// 创建场景
const scene = new THREE.Scene();

// 创建几何体
// 几何体有很多种
const geometry = new THREE.BoxGeometry(100, 100, 100);

// 创建材质
// MeshStandardMaterial 会受到场景中光源的影响
const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

// 网格 包含 几何体 和 材质
// 可以有多个网格
const mesh = new THREE.Mesh(geometry, material);

// 添加到场景中
scene.add(mesh);

// 创建环境光
// 环境光 平行光 点光源 聚光灯
const light = new THREE.AmbientLight(0xffffff);
scene.add(light);

// 创建相机
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
// 设置相机位置
camera.position.set(0, 0, 400);
// 添加到场景中
scene.add(camera);

// 创建渲染器
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 渲染
renderer.render(scene, camera);

// 创建控制器
const controls = new OrbitControls(camera, renderer.domElement);

// 实时控制函数
const animate = () => {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
};
animate();
```

### 加载模型

```ts
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// 创建场景
const scene = new THREE.Scene();

// 添加环境光
const light = new THREE.AmbientLight(0xffffff);
scene.add(light);

// 创建相机、渲染器和控制器
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(0, 1, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

// 初始化加载器
const loader = new GLTFLoader();
loader.load(
  './models/scene.gltf',
  (gltf) => {
    scene.add(gltf.scene);
  },
  undefined,
  (error) => console.error('模型加载失败', error),
);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();
```

## SSE 实时通信

SSE 是服务器通过一个持久的 HTTP 响应向客户端持续推送事件的单向通信机制。浏览器原生 `EventSource` 会发起 GET 请求；如果需要通过 POST 提交请求体，可以使用 `fetch()` 读取响应流，但这不再是 `EventSource` API。

模拟SSE:

```ts
// 后端
import express from 'express';
import cors from 'cors';
const app = express();
app.use(cors());
app.use(express.json());

// 原生 EventSource 会以 GET 请求建立连接
app.get('/chat', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream'); // 返回SSE
  res.setHeader('Cache-Control', 'no-cache'); // 告诉浏览器不要缓存数据
  res.setHeader('Connection', 'keep-alive'); // 保持连接
  const timer = setInterval(() => {
    res.write(`data: ${new Date().toISOString()}\n\n`);
  }, 1000);

  req.on('close', () => {
    clearInterval(timer);
  });
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
```

```html
<!-- 前端 -->
<script>
  const sse = new EventSource('http://localhost:3000/chat');
  sse.onmessage = (event) => {
    console.log(event.data);
  };
</script>
```

上面是原生 `EventSource` 的用法。若业务必须通过 POST 发送请求体，后端可以在 POST 响应中返回 `text/event-stream`，前端再使用 `fetch()` 读取流。

下面只演示客户端的基础解析流程。生产环境还要处理 `event`、`id`、`retry`、重连、超时和取消请求，或者直接使用成熟的 SSE 客户端库。

```html
<!-- 前端 -->
<script>
  fetch('http://localhost:3000/chat', {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    method: 'POST',
    body: JSON.stringify({ message: 'hello' }),
  })
    .then(async (res) => {
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader(); // 获取流
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });

        const blocks = buffer.split(/\r?\n\r?\n/);
        buffer = blocks.pop() ?? '';

        for (const block of blocks) {
          const data = block
            .split(/\r?\n/)
            .filter((line) => line.startsWith('data:'))
            .map((line) => line.slice(5).trimStart())
            .join('\n');
          if (data) console.log(data);
        }

        if (done) break;
      }
    });
</script>
```

## LangChain

安装：`pnpm add langchain @langchain/core @langchain/deepseek express cors`。下面使用 DeepSeek 当前的 `deepseek-v4-flash` 模型演示，API Key 通过 `DEEPSEEK_API_KEY` 环境变量提供。

```ts
// 后端
import express from 'express';
import cors from 'cors';
import { ChatDeepSeek } from '@langchain/deepseek';
import { createAgent } from 'langchain';

const model = new ChatDeepSeek({
  model: 'deepseek-v4-flash',
  temperature: 0.7,
  maxTokens: 1024,
});

const app = express();
app.use(cors());
app.use(express.json());

app.post('/chat', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream'); // 返回SSE
  res.setHeader('Cache-Control', 'no-cache'); // 告诉浏览器不要缓存数据
  res.setHeader('Connection', 'keep-alive'); // 保持连接
  const agent = createAgent({
    model,
    tools: [],
    systemPrompt: 'You are a helpful assistant.', // 系统提示词
  });
  const result = await agent.stream(
    {
      messages: [
        {
          role: 'user',
          content: req.body.message,
        },
      ],
    },
    { streamMode: 'messages' },
  );
  // messages 模式返回 [AIMessageChunk, metadata] 元组
  for await (const [message] of result) {
    const content =
      typeof message.content === 'string'
        ? message.content
        : message.content
            .filter((block) => block.type === 'text')
            .map((block) => block.text)
            .join('');
    if (content) {
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
  }
  res.end();
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
```

## 支付宝 SDK

安装：`pnpm add alipay-sdk`

### 注册沙箱账号

1. 支付宝沙箱用于联调支付流程，不能当作真实交易环境。
2. 切换生产环境时，需要同时核对正式应用的 `appId`、密钥或证书、支付宝公钥、网关、授权范围和回调域名，不能只替换网关地址。

网址: https://openhome.alipay.com/develop/sandbox/app
秘钥工具下载: https://opendocs.alipay.com/common/02kipk

### 步骤

1. 下载支付宝秘钥工具
2. 进入沙盒控制台: https://openhome.alipay.com/develop/sandbox/app
3. 开发信息 --> 接口加密方式 --> 自定义密钥 --> 公钥模式 --> 使用支付宝秘钥工具生成密钥 --> 将生成的公钥填入 --> 私钥需要进行转换, 使用支付宝秘钥工具的转换工具进行转换(因为非JAVA环境 支付宝的私钥格式和Node.js的私钥格式不一致)
4. 编写代码

```ts
// 普通公钥模式
import { AlipaySdk } from 'alipay-sdk';
import express from 'express';

// 提供一个用于接收支付宝异步通知
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // 解析数据

const alipaySdk = new AlipaySdk({
  appId: '202100011764XXXX', // 沙箱账号 在控制台查看
  gateway: 'https://openapi.alipaydev.com/gateway.do', // 沙箱网关 在控制台查看
  privateKey: process.env.ALIPAY_PRIVATE_KEY!,
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY!,
});

// 生成订单号
const genGoodNo = () => {
  return Date.now() + Math.random().toString(36).slice(2, 15);
};

const bizContent = {
  out_trade_no: genGoodNo(), // 订单号
  product_code: 'FAST_INSTANT_TRADE_PAY', // 产品码
  subject: 'abc', // 订单标题
  body: '234', // 订单描述
  total_amount: '0.01', // 订单金额
};

// 支付页面接口，返回 HTML 代码片段，内容为 Form 表单
const html = alipaySdk.pageExecute('alipay.trade.page.pay', 'GET', {
  bizContent,
  returnUrl: 'https://example.com/payment/result', // 浏览器支付完成后的跳转地址
  // 支付宝服务器异步通知地址；本地联调可使用受控的 HTTPS 隧道
  notify_url: 'https://api.example.com/alipay/notify',
});

console.log(html);

app.post('/alipay/notify', async (req, res) => {
  if (!alipaySdk.checkNotifySignV2(req.body)) {
    return res.status(400).send('failure');
  }

  // 验签通过后，还必须根据 out_trade_no 查询本地订单，核对 app_id、
  // seller_id、total_amount 和 trade_status，并以幂等方式更新订单。
  // 只有全部业务校验成功后才向支付宝返回 success。
  res.send('success');
});
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
```

内网穿透:

1. 安装ngrok
2. 进入网址 --> 隧道管理 -->创建一个http隧道, 名称域名随便填, 端口填3000, 下面两个不填 --> 生成
3. 在ngrok文件夹cmd中运行刚刚生成的一个命令, 启动成功后会提供一个网址, 这个网址就是内网穿透后的网址

异步通知地址是支付宝服务器调用商户服务端的地址，与用户支付后的浏览器跳转地址用途不同。公网联调地址应使用 HTTPS、限制暴露范围，并且无论沙箱还是生产环境都必须执行通知验签和订单核验。
