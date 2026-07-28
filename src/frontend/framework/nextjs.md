# Next.js 16

## 创建项目

```bash
pnpm create next-app@latest my-app --yes
cd my-app
pnpm dev
```

## Turbopack

Turbopack 是用 Rust 编写、面向 JavaScript 和 TypeScript 的增量打包器，并已在 Next.js 16 中成为 `next dev` 与 `next build` 的默认打包器。Webpack 仍可通过 `--webpack` 选用。不同项目、缓存状态和硬件下的性能差异很大，因此不能把“比 Vite 快 10 倍、比 webpack 快 700 倍”当作通用结论。

选择Turbopack的原因

- 采用统一依赖图的关系搞定多环境, 避免拆分和拼接
- 惰性打包
- `增量计算`

## React Compiler

React Compiler 可以自动记忆化符合规则的组件和 Hook，减少一部分手写 `useMemo`、`useCallback` 和 `memo` 的需要，但不会保证所有组件都自动获得性能提升，也不能替代正确的状态设计。

在 Next.js 中使用它，需要安装编译插件并显式开启配置；也可以在创建项目时使用 `--react-compiler`：

```bash
pnpm add -D babel-plugin-react-compiler
```

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
};

export default nextConfig;
```

## App Router 介绍

Next.js 有两套路由系统，一个是旧的`Pages Router`路由系统，一个是新的`App Router`路由系统。

推荐使用`App Router`路由系统。

App Router 基于文件约定定义路由，并支持 Server Components、Route Handlers、Server Functions 等能力。Server Component 可以直接执行异步数据读取，但具体使用 `fetch`、数据库客户端还是其他数据层，应根据数据来源和缓存需求决定。

## 路由

### App Router 配置

在 Next.js 中，`app` 下的普通文件夹可定义路由段并参与 URL 路径，但只有某个段中存在 `page.tsx` 或 `route.ts` 时，相应地址才会公开。普通协作文件可以安全地与路由共置；`(group)` 路由组不会出现在 URL 中，`_folder` 私有目录会退出路由系统。

### page

`page.tsx` 定义某个路由可访问的页面 UI。与它匹配的页面或更深层 layout 会作为父级 `layout.tsx` 的 `children` 渲染。

### layout 与 template

`layout` 用于多个页面共享 UI，例如导航栏、侧边栏和页脚。客户端在同一布局边界内导航时会复用该布局并保留状态；跨越不同根布局等情况仍可能触发完整页面加载，不能概括为整个应用生命周期只挂载一次。

`template` 同样包裹子内容，但会按所属路由段获得新的 key，并在该段变化时重新挂载，使其内部 Client Component 的状态重置、DOM 重建、Effect 重新同步。更深层导航和仅搜索参数变化不一定使上层 template 重挂载。

嵌套顺序: `layout` --> `template` --> `page`

### loading(加载)

在某个路由段中创建 `loading.tsx`，Next.js 会为该段的 `page` 及其子级自动建立 Suspense 边界，并在内容流式加载或导航等待时显示 loading UI。文件应放在需要该边界的具体段内，不一定只放在 `app` 根目录。

### error(错误)

在路由段中创建 `error.tsx` 可以为该段及其子级建立错误边界。`error.tsx` 必须是 Client Component，并可接收 `error` 与 `reset` props；根布局错误需要使用 `global-error.tsx`。

```tsx
"use client"; // 错误组件必须是客户端组件
export default function Error() {
  return (
    <div>
      <h1>Error</h1>
    </div>
  );
}
```

### not-found(404)

Next.js 默认会生成一个404页面，但我们可能自定义404页面，只需要在`app`目录下创建一个`not-found.tsx`文件即可

```tsx
export default function NotFound() {
  return (
    <div>
      <h1>404 Page</h1>
    </div>
  );
}
```

## 路由导航

路由导航是指我们在Next.js中跳转页面的方式，例如原始的`<a>`标签等。

在Next.js中，共有四种方式提供跳转:

- `Link` 组件
- `useRouter Hook` (客户端组件)
- `redirect` 函数 (服务端组件)
- `History API` (浏览器API 本文略过用的不多 了解即可)

### Link 组件

`<Link>` 是基于 `<a>` 扩展的客户端导航组件，支持路由预获取、history 替换和滚动行为控制。查询参数可以写入 `href`，Client Component 使用 `useSearchParams` 读取，Server Component Page 则优先使用 `searchParams` prop。

```tsx
import Link from "next/link"; // 引入Link组件

export default function About() {
  return (
    <>
      <div>About</div>
      <Link
        className="text-blue-500"
        href={{ pathname: "/about/price", query: { id: 1 } }}
      >
        PRICE
      </Link>
      <br />
      <Link
        className="text-blue-500"
        href={{ pathname: "/about/user", query: { id: 2 } }}
      >
        USER
      </Link>
    </>
  );
}
```

```tsx
// 接收
"use client";
import { useSearchParams } from "next/navigation";
export default function Price() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  return (
    <>
      <h1 className="bg-red-400 text-2xl">Price</h1>
      <p>{id}</p>
    </>
  );
}
```

一些参数:

- `prefetch`：预获取只在生产环境启用。默认 `"auto"`/`null` 时，静态路由会预取完整路由，动态路由通常只预取到最近的 `loading.tsx` 边界；`true` 强制预取完整路由，`false` 禁用视口和悬停预取。
- `scroll`：默认 `true`，Next.js 会在导航后寻找可见的页面元素并按需滚动；设为 `false` 可关闭这次自动滚动处理。
- `replace`：为 `true` 时替换当前 history 条目，而不是新增条目。

::: tip 注意
`useSearchParams` 不会笼统地导致“加载 JS 白屏”。当页面采用静态生产渲染时，调用该 Hook 的 Client Component 必须位于 Suspense 边界内，否则生产构建会报 `Missing Suspense boundary with useSearchParams`；动态渲染路由没有这一特定要求。Server Component Page 也可以直接读取 `searchParams` prop。
:::

### useRouter Hook (客户端组件)

`useRouter` 可以在代码中根据逻辑跳转页面，例如根据用户权限跳转不同的页面。

使用该hook需要在客户端组件中。需要在顶层编写 `'use client'` 声明这是客户端组件。

> 这个hook里面没有`query`, 需要什么参数直接在路径上拼接

```tsx
"use client";
import { useRouter } from "next/navigation";
export default function Page() {
  const router = useRouter();
  return (
    <>
      <button onClick={() => router.push("/page")}>跳转page页面</button>
      <button onClick={() => router.replace("/page")}>替换当前页面</button>
      <button onClick={() => router.back()}>返回上一页</button>
      <button onClick={() => router.forward()}>跳转下一页</button>
      {/* refresh 重新请求并合并当前路由的服务端数据，不等同于浏览器整页刷新 */}
      <button onClick={() => router.refresh()}>刷新路由数据</button>
      {/* prefetch效果和Link组件一样 */}
      <button onClick={() => router.prefetch("/about")}>预获取about页面</button>
    </>
  );
}
```

### redirect 函数 (服务端组件)

```tsx
import { redirect } from "next/navigation";
export default async function Page() {
  const isLoggedIn = await checkLogin();
  //如果用户未登录，则跳转到登录页面
  if (!isLoggedIn) {
    redirect("/login");
  }
  return (
    <div>
      <h1>Page</h1>
    </div>
  );
}
```

`redirect()` 会终止当前路由段的执行，通常返回临时重定向（在 Server Action 中使用 303）；若资源地址永久迁移，应在相应分支改用 `permanentRedirect()`，通常返回 308。两者不能像原示例那样连续调用，因为第一处重定向后的代码不可达。

## 动态路由

动态路由是指在路由中使用方括号`[]`来定义路由参数，例如`/blog/[id]`，其中`[id]`就是动态路由参数，因为在某些需求下，我们需要根据不同的id来显示不同的页面内容，例如商品详情页，文章详情页等。

### 基本用法

使用动态路由只需要在文件夹名加上方括号`[]`即可，例如`[id]`, `[params]`等，名字可以自定义。

```tsx
"use client";
import { useParams } from "next/navigation";
export default function DetailId() {
  const params = useParams();
  const id = params.id;
  return <div>111111111111{id}</div>;
}
```

如果需要捕获多个路由参数，例如`/shop/123/456`，我们可以使用路由片段来捕获多个路由参数，他的用法就是`[...slug]`，其中slug就是路由片段，这个名字可以自定义，后面的片段有多少就捕获多少。

如果路由参数可能有也可能没有, 我们可以使用可选路由来捕获这个路由参数，他的用法就是`[[...slug]]`

:::info 总结

- [id] 捕获一个参数
- [...id] 捕获多个参数
- [[...id]] 捕获多个参数，参数可能没有

:::

## 平行路由与插槽

平行路由指的是在同一布局`layout.tsx`中，可以同时渲染多个页面，例如team，analytics等，这个东西跟vue的 `router-view` 类似。很适合做`layout`布局.

![alt text](/assert/nextjs_image/eg.png)

### 基本用法

平行路由的使用方法就是通过`@ + 文件夹名来定义`，例如`@team`，`@analytics`等，名字可以自定义。

> 平行路由不会影响`URL`路径。

定义完成之后，我们就可以在`layout.tsx`中使用`team`和`analytics`来渲染对应的页面，他会自动注入layout的`props`里面。

```tsx
export default function RootLayout({
  children,
  team,
  analytics,
}: {
  children: React.ReactNode;
  team: React.ReactNode;
  analytics: React.ReactNode;
}) {
  return (
    <html>
      <body>
        {team}
        {children}
        {analytics}
      </body>
    </html>
  );
}
```

每个平行路由 slot 可以拥有独立的 `error.tsx`、`loading.tsx`、`layout.tsx` 等约定文件。文件名区分大小写并应使用小写；`Nav.tsx` 只是普通组件文件，不是 Next.js 的特殊路由约定。

> 注意: 子导航使用`Link`组件跳转setting页面时，是没有问题的，但是我们在跳转之后刷新页面，就出现404了

- `软导航` `Link` 组件跳转子页面的时候，这时候@analytics 和 children依然保持活跃，所以他只会替代@team里面的内容。
- 使用硬导航或刷新时，Next.js 无法从客户端状态恢复其他未匹配 slot 的活跃子页面，因此会渲染各 slot 的 `default.tsx`；缺少对应 fallback 时才会出现 404。

解决方案：为可能无法匹配的命名 slot 创建 `default.tsx`，并且不要遗漏隐式的 `children` slot 所需的 fallback。

## 路由组

路由组也是一种基于文件夹的`约定范式`，可以让我们开发者，按类别或者团队组织路由模块，并且不影响 `URL` 路径。

用法：只需要通过`(groupName)`包裹住文件夹名即可，例如(shop)，(user)等，名字可以自定义。

### 定义多个根布局

这种一般是大型项目使用的，例如我们需要把，`后台管理系统`和`前台的门户网站`，放到一个项目就可以使用这种方法实现。

使用方法：

1. 先把`app`目录下的`layout.tsx` 文件删除
2. 在每组的目录下创建`layout.tsx`文件，并且定义html, body标签(必须含有)。

在多个根布局之间导航会触发完整页面加载，而不是复用同一个根布局下的客户端导航状态。

## Route Handlers（路由处理程序）

路由处理程序，可以让我们在Next.js中编写API接口，并且支持与客户端组件的交互。

### 文件结构

页面使用 `page.tsx`，Route Handler 使用 `route.ts`。两者都必须位于 `app` 路由树的某个路由段内（也可以使用 `src/app`），并由所在目录决定 URL；项目中任意位置名为 `route.ts` 的文件不会自动成为接口。

> 注意：同一个路由段不能同时用 `page.tsx` 和 `route.ts` 响应同一路径。常见做法是在 `app/api/user/route.ts` 等独立段中组织接口，但这不代表必须把整个前后端代码拆成两个项目。

我们可以定义一个`api`文件夹，然后在这个文件夹下创建一对应的模块例如`user` `login` `register`等。

### 定义请求

Route Handler 通过导出大写的 HTTP 方法函数来处理请求。它可以用来设计 REST 风格 API，但 Next.js 不会自动保证接口符合 REST 约束。

```ts
export async function GET(request) {}

export async function HEAD(request) {}

export async function POST(request) {}

export async function PUT(request) {}

export async function DELETE(request) {}

export async function PATCH(request) {}

//如果没有定义OPTIONS方法，则Next.js会自动实现OPTIONS方法
export async function OPTIONS(request) {}
```

> 注意: 我们在定义这些请求方法的时候不能修改方法名称而且必须是`大写`，否则无效。

### 定义GET请求

```ts {8}
/**
 * NextRequest 接收前端发过来的参数
 * NextResponse 返回给前端的数据
 */
import { NextRequest, NextResponse } from "next/server";
export async function GET(request: NextRequest) {
  // http://localhost:3000/api/user?id=123
  const query = request.nextUrl.searchParams; //接受url中的参数 返回一个对象
  console.log(query.get("id")); // 终端输出 123
  return NextResponse.json({ message: "Get request successful" }); //返回json数据
}
```

### 定义POST请求

```ts {3-7}
import { NextRequest, NextResponse } from "next/server";
export async function POST(request: NextRequest) {
  //const body = await request.formData(); //接受formData数据
  //const body = await request.text(); //接受text数据
  //const body = await request.arrayBuffer(); //接受arrayBuffer数据
  //const body = await request.blob(); //接受blob数据
  const body = await request.json(); //接受json数据
  console.log(body); //打印请求体中的数据
  return NextResponse.json(
    { message: "Post request successful", body },
    { status: 201 },
  );
  //返回json数据
}
```

### 动态参数

我们可以在路由中使用方括号`[]`来定义动态参数，例如`/api/user/[id]`，其中`[id]`就是动态参数，这个参数可以在请求中传递，这个跟前端路由的动态路由类似。

接受动态参参数，需要在第二个参数解构`{ params }`,需注意这个参数是`异步`的，所以需要使用`await`来等待参数解析完成。

```ts {4}
import { NextRequest, NextResponse } from "next/server";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  console.log(id);
  return NextResponse.json({ message: `Hello, ${id}!` });
}
```

### cookie

Next.js也内置了`cookie`的操作可以方便让我们读写，接下来我们用一个登录的例子来演示如何使用`cookie`。

:::tip 推荐前端组件库

- 官网: [Shadcn](https://ui.shadcn.com/)
- 安装:

```sh
npx shadcn@latest init
pnpm dlx shadcn@latest init
```

:::

```ts {1,7,13-16,24}
import { cookies } from "next/headers"; //引入cookies
import { NextRequest, NextResponse } from "next/server"; //引入NextRequest, NextResponse
//模拟登录成功后设置cookie
export async function POST(request: NextRequest) {
  const body = await request.json();
  if (body.username === "admin" && body.password === "123456") {
    const cookieStore = await cookies(); //获取cookie
    /**
     * key token
     * value 123456
     * options 配置项
     */
    cookieStore.set("token", "123456", {
      httpOnly: true, // 禁止客户端 JavaScript 通过 document.cookie 读取
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, //30天
    });
    return NextResponse.json({ code: 1 }, { status: 200 });
  } else {
    return NextResponse.json({ code: 0 }, { status: 401 });
  }
}
//检查登录状态
export async function GET(request: NextRequest) {
  const cookieStore = await cookies(); // 读取cookie
  const token = cookieStore.get("token"); // token
  if (token && token.value === "123456") {
    // 有token且token等于123456
    // 有登录态
    return NextResponse.json({ code: 1 }, { status: 200 });
  } else {
    // 无登录态
    return NextResponse.json({ code: 0 }, { status: 401 });
  }
}
```

`httpOnly` Cookie 仍会在满足域、路径、SameSite 等规则时由浏览器自动随请求发送；它只是不暴露给客户端 JavaScript。示例中的明文密码和固定 token 只适合演示 API，生产环境应校验密码哈希、生成不可预测且可撤销的会话，并同时配置 `secure`、`sameSite`、过期与 CSRF 防护策略。

## AI SDK

### 安装

```sh
pnpm add ai@^6 @ai-sdk/deepseek@^3 @ai-sdk/react@^3
```

下面示例按 AI SDK 6 与对应的 v3 provider/UI 包编写。AI SDK 主版本之间存在破坏性变更；如果安装更新的主版本，应先按官方迁移指南调整 API。

### 编写API接口

```ts
// 目录必须是这样
// src/app/api/chat/route.ts
import { NextRequest } from "next/server";
// streamText 流式输出
import { streamText, convertToModelMessages } from "ai";
import { deepseek } from "@ai-sdk/deepseek";

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  //这里为什么接受messages 因为我们使用前端的useChat 他会自动注入这个参数，所有可以直接读取
  const result = streamText({
    model: deepseek("deepseek-chat"),
    messages: await convertToModelMessages(messages),
    //前端传过来的额messages不符合sdk格式所以需要convertToModelMessages转换一下
    //转换之后的格式：(只需要角色和内容)
    //[
    //{ role: 'user', content: [ [Object] ] },
    //{ role: 'assistant', content: [ [Object] ] },
    //]
    system: "你是一个高级程序员，请根据用户的问题给出回答", // 系统提示词
  });

  return result.toUIMessageStreamResponse(); // 返回流式响应
}
```

`@ai-sdk/deepseek` 默认从服务端环境变量 `DEEPSEEK_API_KEY` 读取密钥。不要把密钥写入源码文件、提交到仓库或暴露为 `NEXT_PUBLIC_*`。生产接口还应校验消息结构和长度，并增加身份验证、速率限制、错误处理与用量控制。

前端: 我们在前端使用`useChat`组件来实现AI对话，这个组件内部封装了流式响应，默认会向`/api/chat`发送请求。

- `messages`: 消息列表，包含用户和AI的对话内容
- `sendMessage`: 发送消息的函数，参数为消息内容
- `onFinish`: 消息发送完成后回调函数，可以在这里进行一些操作，例如清空输入框

messages数据结构解析:

```jsonc
[
  {
    "parts": [
      {
        "type": "text", //文本类型
        "text": "你知道 api router 吗"
      }
    ],
    "id": "FPHwY1udRrkEoYgR", //消息ID
    "role": "user" //用户角色
  },
  {
    "id": "qno6vcWcwFM4Yc8J", //消息ID
    "role": "assistant", //AI角色
    "parts": [
      {
        "type": "step-start" //步骤开始
      },
      {
        "type": "text", //文本类型
        "text": "是的，我知道 **API Router**。", //文本内容
        "state": "done" //步骤完成
      }
    ]
  }
]
```

前端编写（AI SDK 6）：

```tsx
"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useChat } from "@ai-sdk/react";

export default function HomePage() {
  const [input, setInput] = useState(""); //输入框的值
  const messagesEndRef = useRef<HTMLDivElement>(null); //获取消息结束的ref
  //useChat 内部封装了流式响应 默认会向/api/chat 发送请求
  /**
   * messages: 消息列表 接收后台发过来的数据
   * sendMessage: 给后台发送数据
   */
  const { messages, sendMessage, status } = useChat({
    onFinish: () => {
      setInput("");
    },
  });

  // 自动滚动到底部
  useEffect(() => {
    // messages 改变时自动滚动到底部
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  //回车发送消息
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && status === "ready") {
        sendMessage({ text: input });
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-linear-to-br from-blue-50 via-white to-purple-50">
      {/* 头部标题 */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI 智能助手
          </h1>
          <p className="text-sm text-gray-500 mt-1">随时为您解答问题</p>
        </div>
      </div>

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="bg-linear-to-br from-blue-100 to-purple-100 rounded-full p-6 mb-4">
                <svg
                  className="w-12 h-12 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                开始对话
              </h2>
              <p className="text-gray-500">输入您的问题，我会尽力帮助您</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-4 duration-500`}
              >
                <div
                  className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* 头像 */}
                  <div
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
                      message.role === "user"
                        ? "bg-linear-to-br from-blue-500 to-blue-600"
                        : "bg-linear-to-br from-purple-500 to-purple-600"
                    }`}
                  >
                    {message.role === "user" ? "你" : "AI"}
                  </div>

                  {/* 消息内容 */}
                  <div
                    className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-3 shadow-sm ${
                        message.role === "user"
                          ? "bg-linear-to-br from-blue-500 to-blue-600 text-white"
                          : "bg-white border border-gray-200 text-gray-800"
                      }`}
                    >
                      {message.parts.map((part, index) => {
                        switch (part.type) {
                          case "text":
                            return (
                              <div
                                key={message.id + index}
                                className="whitespace-pre-wrap wrap-break-word"
                              >
                                {part.text}
                              </div>
                            );
                        }
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          {/* 让它一直在可视区域 就一直滚动 在最底部 */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 输入区域 */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="请输入你的问题... (按 Enter 发送，Shift + Enter 换行)"
                className="min-h-15 max-h-50 resize-none rounded-xl border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
              />
            </div>
            <Button
              onClick={() => {
                if (input.trim() && status === "ready") {
                  sendMessage({ text: input });
                }
              }}
              disabled={!input.trim() || status !== "ready"}
              className="h-15 px-6 rounded-xl bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Proxy代理

### 基本使用

- 处理`跨域`请求
- `接口转发` 例如`/api/user` -> (可能是其他服务器`java/go/python`等) -> `/api/user`
- 限流例如配合第三方服务做`限流`
- `鉴权`/判断是否登录

Next.js 16 的 `proxy.ts` 在路由渲染前运行，可用于重写或重定向 URL、修改请求/响应头和 Cookie，或者直接返回一个 `Response`。它不适合按普通流式中间件的方式任意读取并改写后续路由的请求体或响应体；需要转换正文时，应在 Route Handler、Server Function 或实际上游代理服务中完成。

```ts
// src/proxy.ts
// 定义proxy函数 导出即可
import { NextRequest, NextResponse } from "next/server";
export async function proxy(request: NextRequest) {
  console.log(request.url, "url");
  return NextResponse.next();
}
// 自定义匹配器 配置匹配路径
export const config = {
  matcher: "/api/:path*", // 匹配/api以及下面的子路径
  //matcher: ['/api/:path*','/api/user/:path*'], 支持单个以及多个路径匹配(数组)
  //matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'], 同样支持正则表达式匹配
};
```

也可以配合cookie使用:

```ts
import { NextRequest, NextResponse } from "next/server";
export async function proxy(request: NextRequest) {
  const cookie = request.cookies.get("token"); // 获取cookie
  if (request.nextUrl.pathname.startsWith("/home") && !cookie) {
    console.log("redirect to login");
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (cookie && cookie.value) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL("/", request.url));
}

export const config = {
  matcher: ["/api/:path*", "/home/:path*"],
};
```

### 复杂匹配 (高级写法)

- `source`: 表示匹配路径
- `has`: 表示匹配路径中必须(包含)某些条件
- `missing`: 表示匹配路径中(必须不包含)某些条件
- `type` 只能匹配: `header`(请求头), `query`(地址栏参数), `cookie`

```ts
import { NextRequest, NextResponse } from "next/server";
import { ProxyConfig } from "next/server";
export async function proxy(request: NextRequest) {
  console.log("start proxy");
  return NextResponse.next();
}

export const config: ProxyConfig = {
  matcher: [
    {
      source: "/home/:path*",
      //表示匹配路径中必须(包含)Authorization头和userId查询参数
      has: [
        { type: "header", key: "Authorization", value: "Bearer 123456" },
        { type: "query", key: "userId", value: "123" },
      ],
      //表示匹配路径中(必须不包含)cookie和userId查询参数
      missing: [
        { type: "cookie", key: "token", value: "123456" },
        { type: "query", key: "userId", value: "456" },
      ],
    },
  ],
};
```

### 处理跨域

```ts
// 仅允许白名单来源跨域访问 /api
import { NextRequest, NextResponse } from "next/server";
import { ProxyConfig } from "next/server";

const allowedOrigins = ["https://example.com", "https://admin.example.com"];
const corsHeaders = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function proxy(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const isAllowed = allowedOrigins.includes(origin);

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        ...(isAllowed ? { "Access-Control-Allow-Origin": origin } : {}),
        ...corsHeaders,
      },
    });
  }

  const response = NextResponse.next();
  if (isAllowed) response.headers.set("Access-Control-Allow-Origin", origin);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export const config: ProxyConfig = {
  matcher: "/api/:path*",
};
```

## CSR、SSR 与 SSG

### CSR 客户端渲染

CSR 是 Client-Side Rendering，即主要在浏览器中执行 JavaScript 并生成页面 UI。Vue、React、Angular 都能实现 CSR，但这些库或框架并不只能使用 CSR；配合 Nuxt、Next.js、Angular SSR 等工具也可以采用 SSR 或预渲染。

![alt text](/assert/nextjs_image/CSR.png)

优点:

- 交互流畅，可直接响应
- 前后端分离，前端注重UI，后端注重数据

缺点:

- `首屏加载慢`，因为需要下载JS/CSS等文件
- `SEO不友好`，因为JS动态渲染

适用场景:

- 后台管理系统开发(后台系统不需要SEO，也不需要首屏加载速度)
- 单页面应用开发(SPA)

### SSR 服务器端渲染

SSR 是 Server-Side Rendering，即在请求期间由服务器生成 HTML。Next.js、Nuxt 等支持 SSR，同时也支持静态生成、客户端渲染和混合策略，不能把整个框架等同于 SSR。

![alt text](/assert/nextjs_image/SSR.png)

优点：

- 首屏加载快，因为服务器已经渲染了HTML页面
- SEO友好，搜索引擎能爬取到完整内容

缺点：

- 开发成本高，需要懂服务端知识，全栈开发。
- 服务器承担渲染工作，如果用户访问量大，对服务器配置要求高，增大成本

适合场景：

- 电商网站开发
- 博客网站开发
- 官网/首页等

### SSG 静态生成

SSG 是 Static Site Generation，即在构建或预生成阶段生成 HTML。VitePress 主要采用静态生成；Astro、Next.js 等可以按路由混合静态生成、服务端渲染和客户端交互。

![alt text](/assert/nextjs_image/SSG.png)

优点：

- 首屏加载极快（CDN 分发静态文件，无需服务器实时渲染）
- 服务器压力通常较小（静态文件可以由 CDN 直接承载；页面仍可能在浏览器执行客户端 JavaScript）
- 便于搜索引擎读取首屏 HTML，但最终 SEO 仍取决于内容、元数据、可访问性和站点质量

缺点：

- 纯构建时 SSG 不适合必须按请求实时变化的数据；可通过客户端请求、按需重新验证、ISR 或改用 SSR 组合解决
- 详情页面如果过多(构建时间会长)

适合场景：

- 技术文档
- 静态营销页
- 静态新闻站

## Hydration 水合

Hydration 是 React 在浏览器中用客户端组件的 JavaScript 与服务端生成的 HTML 建立对应关系，并附加 React 事件处理与状态能力的过程。水合前并非“HTML 没有任何交互”：链接、原生表单控件、`details` 等浏览器原生行为仍可工作；依赖 React 事件处理器和客户端状态的交互则要等相应 Client Component 完成水合。

## RSC

React Server Components（RSC）是在服务器环境执行、并把序列化后的组件树结果发送给客户端的一套架构。它并不是到 React 19 才首次出现：Next.js App Router 在 React 19 之前已经采用；React 19 对相关能力作了稳定化，但框架与打包器集成 API 仍由具体工具链负责。

SSR 描述“把组件输出预渲染为 HTML”的过程，RSC 描述组件模块在哪个环境执行以及如何传输组件树，两者不是互斥的同一维度。Next.js 首次加载时会用 RSC Payload 协调组件树，并使用 Server Components 与 Client Components 预渲染 HTML；只有 Client Components 需要在浏览器水合。

> 在 App Router 中，未进入 `'use client'` 模块依赖图的组件默认是 Server Component。`'use client'` 声明的是服务端/客户端模块图边界，并不是把已经执行过的 Server Component 在运行时“转换”为 Client Component。

优点:

- 减少bundle体积
- 减少需要水合的客户端组件范围
- 流式加载

## Server Components（服务端组件）

```tsx
// src/app/server/page.tsx
import fs from "node:fs"; //引入fs模块
import mysql, { RowDataPacket } from "mysql2/promise"; //操作数据库 (演示)
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: process.env.DATABASE_PASSWORD,
  database: "catering",
});

export default async function ServerPage() {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM goods");
  const data = fs.readFileSync("data.json", "utf-8");
  const json = JSON.parse(data);
  return (
    <div>
      <h1>Server Page</h1>
      {json.age}///{json.name}///{json.city}
      <h3>mysql</h3>
      {rows.map((item: any) => (
        <div key={item.id}>
          {item.name}-{item.goodsPrice}
        </div>
      ))}
    </div>
  );
}
```

Server Component 中的日志首先在服务器运行环境输出。开发工具可能为了调试转发或展示额外信息，但生产环境日志最终出现在哪里取决于部署平台和日志配置，不应依赖浏览器控制台判断代码的执行环境。

### 服务端组件的优点

- 安全性: 我们在服务端组件中访问一些API秘钥，令牌等其他机密，不会暴露给客户端。
- 体积: 因为服务端组件在服务器渲染，所以不会被打包到客户端，所以体积更小。
- 全栈：可以在服务端组件访问数据库，文件系统等其他API，实现全栈开发。
- FCP（首次内容绘制）：Server Components 可减少客户端 JavaScript，并能与 Suspense 和流式渲染配合逐步返回内容；是否改善 FCP 仍取决于数据读取、缓存和边界设计。

### 服务端组件的缺点

- 交互性：Server Component 自身不能使用浏览器事件处理器或本地 state，但可以组合 Client Components，也可以通过表单调用 Server Function，因此整个页面仍可交互。
- hooks: `useEffect` `useState` 等hooks在服务端组件中无法使用。

ECMAScript 定义 JavaScript 语言本身；DOM、Fetch、Web Storage 等是宿主环境提供的 Web API，“BOM”只是对部分浏览器 API 的非正式统称，并不是 JavaScript 语言的组成部分。Server Component 可以使用服务器运行时提供的 ECMAScript 与 Node.js/Web API，但不能使用只存在于浏览器页面环境的 `document`、`window`、`localStorage` 等对象。

对象、数组、Promise 等 ECMAScript 能力通常可在客户端和服务端使用，但具体语法与内置对象仍取决于各运行时支持版本。

> 如果要使用以下有交互性的功能，我们需要使用客户端组件。

## Client Components（客户端组件）

声明客户端组件需要在文件的顶部编写 `'use client'` 声明这是客户端组件，但是注意客户端组件会在服务端进行一次`预渲染`，所有访问`document` `window` 等API需要在`useEffect`中访问。

```tsx
"use client";
import { useEffect, useState } from "react";
console.log("client");
export default function ClientPage() {
  const [count, setCount] = useState(0);
  console.log("client X");
  useEffect(() => {
    console.log(document, window);
  }, []);
  return (
    <div>
      <h1>Client Page</h1>
      <button onClick={() => setCount(count + 1)}>点击</button>
      <p>{count}</p>
    </div>
  );
}
```

### 组件嵌套

Server Component 可以导入并渲染 Client Component。Client Component 不能直接导入需要留在服务器模块图中的 Server Component；但父级 Server Component 可以先创建 Server Component 元素，再通过 `children` 或其他可序列化的 React 节点 prop 传给 Client Component 作为插槽。

一旦文件标记 `'use client'`，它静态导入的模块会进入客户端依赖图，因此不能再从中导入数据库、文件系统或密钥等 server-only 模块。插槽模式之所以可行，是因为 Server Component 由服务器父组件负责创建，而不是由 Client Component 导入和执行。

### server-only

客户端与服务器运行时共享 `fetch` 等部分 Web API，仅凭所调用的全局名称不一定能看出模块是否包含密钥或服务器逻辑，因此应显式标注环境边界。

在 server-only 模块顶部导入 `server-only`，如果它被 Client Component 依赖图引用，Next.js 会给出构建错误。Next.js 能内部识别该标记；单独安装包是可选的，主要用于满足依赖检查工具。

```sh
npm install server-only

pnpm add server-only
```

```tsx
import "server-only";

export async function getPrivateData() {
  const response = await fetch("https://api.example.com/private", {
    headers: { Authorization: `Bearer ${process.env.API_TOKEN}` },
  });
  if (!response.ok) throw new Error("读取私有数据失败");
  return response.json();
}
```

## Cache Components(缓存组件)

Cache Components 是 Next.js 16 的可选功能，用于在同一路由中组合静态、显式缓存和请求时动态内容。它通过部分预渲染生成静态外壳，并把无法在预渲染阶段完成的子树延迟到请求时流式返回；这能改善静态与动态内容的组合方式，但不会消除数据新鲜度、缓存成本和请求延迟之间的权衡。

- 静态内容: 构建(`npm run build`)时进行预渲染，例如 `「本地文件」「模块导入」「纯计算」（无网络请求、无用户相关数据）`, 会被直接编译成HTML瞬间加载、立即响应。

- 动态内容：需要请求时数据或未缓存异步数据的内容，例如 Cookie、请求头、参数以及实时数据源。它会在请求时执行；是否缓存数据取决于是否显式使用缓存边界。

- 缓存内容：使用 `'use cache'` 后，函数或组件的结果会按参数等信息建立缓存键，并可纳入静态外壳。静态外壳中 Suspense 的 fallback 会先返回，真正未缓存的动态内容随后在请求时流式填充。

### 启用 Cache Components

Cache Components 为可选功能，需在 Next 配置文件中显式启用：

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true, // 启用缓存组件
};

export default nextConfig;
```

1. 静态内容
   适用场景：仅依赖同步 I/O（如 fs.readFileSync）、模块导入、纯计算的组件

```tsx
import fs from "node:fs";
import path from "node:path";

export default async function Home() {
  const data = fs.readFileSync(path.join(process.cwd(), "data.json"), "utf-8");
  const json = JSON.parse(data);
  const { default: impData } = await import("../../../data.json");
  const names = impData.list.map((item) => item.name).join(","); // 纯计算
  console.log(json);
  console.log(impData);
  console.log(names);
  return (
    <div>
      <h1>Home</h1>
      <ul>
        {json.list.map((item: any) => (
          <li key={item.id}>
            {item.name} - {item.age}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

2. 动态内容
   适用场景：未缓存的网络/数据库请求，以及 cookies、headers 等请求时数据

> 动态内容必须配合Suspense使用。

```tsx
import { Suspense } from "react"; // 引入Suspense
import { cookies } from "next/headers";

const DynamicContent = async () => {
  const data = await fetch("https://www.mocklib.com/mock/random/name"); // 随机生成一个名称 (免费接口)
  const json = await data.json();
  console.log(json);
  const cookieStore = await cookies(); //获取cookie
  console.log(cookieStore);
  return (
    <div>
      <h2>动态内容</h2>
      <main>
        <ul>
          <li>名称：{json.name}</li>
        </ul>
      </main>
    </div>
  );
};

export default async function Home() {
  return (
    <div>
      <h1>Home</h1>
      <Suspense fallback={<div>动态内容Loading...</div>}>
        <DynamicContent />
      </Suspense>
    </div>
  );
}
```

### 实现原理

启用 Cache Components 后，部分预渲染（PPR）会尽可能在构建时提取静态 HTML 与 RSC 外壳。对未缓存的异步或请求时内容，开发和构建阶段要求显式选择：用 `<Suspense>` 延迟到请求时，或在不依赖请求上下文时用 `'use cache'` 缓存。否则会出现 `Uncached data was accessed outside of <Suspense>` 错误。

### 非确定操作

`Math.random()`、`Date.now()`、`crypto.randomUUID()` 等操作在预渲染时执行会把当时结果写入静态外壳。若期望每个请求生成新值，需要先读取请求时数据，或调用 `await connection()` 明确推迟到请求阶段，并把该子树置于 Suspense 边界内。

> 解决方法: `await connection();`

```tsx
import { Suspense } from "react";
import { connection } from "next/server";

const DynamicContent = async () => {
  await connection(); // 使用connection表示不要预渲染这部分
  const random = Math.random();
  const now = Date.now();
  console.log(random, now);
  return (
    <div>
      <h2>动态内容</h2>
      <main>
        <ul>
          <li>名称：{random}</li>
          <li>时间：{now}</li>
        </ul>
      </main>
    </div>
  );
};

export default async function Home() {
  return (
    <div>
      <h1>Home</h1>
      <Suspense fallback={<div>动态内容Loading...</div>}>
        <DynamicContent />
      </Suspense>
    </div>
  );
}
```

### 缓存内容

可以用 `'use cache'` 把路由、异步组件或函数的返回结果标记为可缓存，并用 `cacheLife` 指定生命周期。缓存作用域不能直接读取普通 `cookies()`/`headers()` 等请求上下文；推荐先在作用域外读取并把所需值作为参数传入，或按需求评估 `'use cache: private'`。

cacheLife参数：

- `stale`：客户端在此时间内直接使用缓存，不向服务器发请求 `(单位:秒)`
- `revalidate`：超过此时间后，服务器收到请求时会在后台重新生成内容 `(单位:秒)`
- `expire`：超过此时间无访问，缓存完全失效，下次请求需要等待重新计算 `(单位:秒)`

| **Profile** | **适用场景**               | **stale** | **revalidate** | **expire** |
| ----------- | -------------------------- | --------- | -------------- | ---------- |
| seconds     | 实时数据（股票、比分）     | 30秒      | 1秒            | 1分钟      |
| minutes     | 频繁更新（社交动态）       | 5分钟     | 1分钟          | 1小时      |
| hours       | 每日多次更新（库存、天气） | 5分钟     | 1小时          | 1天        |
| days        | 每日更新（博客文章）       | 5分钟     | 1天            | 1周        |
| weeks       | 每周更新（播客）           | 5分钟     | 1周            | 30天       |
| max         | 很少变化（法律页面）       | 5分钟     | 30天           | 1年        |

```tsx
import { cacheLife } from "next/cache";

const CachedContent = async () => {
  "use cache";
  cacheLife("hours"); //使用预设参数
  // cacheLife({ stale: 30, revalidate: 1, expire: 60 });
  const data = await fetch("https://www.mocklib.com/mock/random/name");
  const json = await data.json();
  console.log(json);
  return (
    <div>
      <h2>动态内容</h2>
      <main>
        <ul>
          <li>名称：{json.name}</li>
        </ul>
      </main>
    </div>
  );
};

export default async function Home() {
  return (
    <div>
      <h1>Home</h1>
      <CachedContent />
    </div>
  );
}
```

## 缓存策略

### 未启用缓存组件

首先要确保 `cacheComponents` 配置为 `false` 或者不配置。

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: false, // 缓存组件(关闭或者不配置)
};

export default nextConfig;
```

示例:

```tsx
// src/app/home/page.tsx
export default async function Home() {
  const data = await fetch("https://www.loliapi.com/acg/pc?type=json"); // 这个接口随机返回一个图片
  const buffer = await data.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  console.log(data);
  return (
    <div>
      <h1>Home</h1>
      <img
        className="w-full h-full"
        src={`data:image/png;base64,${base64}`}
        alt="random image"
      />
    </div>
  );
}
```

即使 `fetch` 响应本身没有进入持久 Data Cache，只要该路由能在构建时完成预渲染，构建时取得的随机图片也可能成为固定的静态输出。Next.js 15 起服务端 `fetch` 默认不再等同于“永久缓存”，应区分“请求响应缓存”和“整条路由被静态预渲染”两个层次。

### 如何退出缓存机制

1. 使用 `revalidate` 属性，可以设置缓存时间，单位为秒。

```tsx
export const revalidate = 5; // 5秒后重新更新
//export const revalidate = 0 // 设置为0表示不缓存
export default async function Home() {
  const randomImage = await fetch("https://www.loliapi.com/acg/pc?type=json");
  const data = await randomImage.json();
  return (
    <div>
      <h1>Home</h1>
      <img width={500} height={500} src={data.url} alt="random image" />
    </div>
  );
}
```

2. 使用 `dynamic` 属性

```tsx
export const dynamic = "force-dynamic"; // cacheComponents 关闭时，强制按请求动态渲染
export default async function Home() {
  const randomImage = await fetch("https://www.loliapi.com/acg/pc?type=json");
  const data = await randomImage.json();
  return (
    <div>
      <h1>Home</h1>
      <img width={500} height={500} src={data.url} alt="random image" />
    </div>
  );
}
```

3. 禁用缓存

使用`cache`属性，并且设置为`no-store`，表示将禁用缓存，每次请求都会重新获取数据。

```tsx
export default async function Home() {
  const randomImage = await fetch("https://www.loliapi.com/acg/pc?type=json", {
    cache: "no-store", // 禁用缓存
  });
  const data = await randomImage.json();
  return (
    <div>
      <h1>Home</h1>
      <img width={500} height={500} src={data.url} alt="random image" />
    </div>
  );
}
```

4. 任意动态内容API

当 Cache Components 未启用时，以下请求时 API 或显式选项会让相关路由选择动态渲染，或让对应请求跳过缓存：

- `cookies`
- `headers`
- `connection`
- `searchParams`
- `fetch(..., { cache: "no-store" })`

### 启用 Cache Components 后的策略

确保`cacheComponents`配置为`true`。

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true, // 开启缓存组件
};

export default nextConfig;
```

> 启用 Cache Components 后，并不是“所有组件默认动态”。可在构建时完成的同步内容会自动进入静态外壳；未缓存的异步或请求时内容必须放入 Suspense 边界，适合缓存的内容可以使用 `'use cache'`。此模式用 `'use cache'`、`cacheLife` 和 Suspense 取代 `dynamic`、`revalidate`、`fetchCache` 等旧的路由段缓存配置。

## Image 组件

该组件是Next.js内置的图片组件，是基于原生 `img` 标签进行扩展，并不代表原生 `img` 标签不能使用。

- 尺寸优化：根据 `src`、`width`、`sizes` 和配置生成适合不同视口的候选尺寸，并可输出 WebP 或 AVIF。APNG 是动画 PNG 格式，不是 Next.js 图像优化器的现代输出格式选项。
- 视觉稳定性：防止图片加载时发生布局偏移，具体参考 [CLS](https://web.dev/articles/cls?hl=zh-cn)
- 懒加载：在图片进入视口才会加载，使用浏览器原生懒加载，并可选择添加模糊显示占位符。(默认就是懒加载)
- 灵活性：可按需调整图像大小，即使是存储在远程服务器上的图像也可以调整。

### 图片引入

#### 1. src本地图片引入

Next.js建议我们把图片放在根目录下的`public`文件夹中，然后使用`/`开头访问。

```tsx
import Image from "next/image"; // 引入图片组件
export default function Home() {
  return (
    <div>
      <h1>Home</h1>
      {/* loading="eager" 表示图片立即加载 不需要懒加载 首屏图片 */}
      {/* 确保图片的尺寸正确 */}
      {/* 如果使用src 属性，宽高都是必填的(nextjs为了防止布局偏移，需要填写宽高) */}
      <Image src="/1.png" loading="eager" width={192} height={108} alt="1" />
    </div>
  );
}
```

#### 2. import 静态引入

使用`import`引入图片，是不需要填写宽度和高度，Next.js会自动确定图片的尺寸。

```jsonc
// tsconfig.json 配置路径别名
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/public/*": ["./public/*"] // 新增这一行代码，配置图片路径。
    }
  }
}
```

```tsx
// 静态引入
import Image from "next/image";
import img from "@/public/1.png";
export default function Home() {
  return (
    <div>
      <h1>Home</h1>
      {/* 使用静态import 引入的时候就可以确定宽高 因此可以不写宽高 */}
      <Image src={img} alt="xxxx" />
    </div>
  );
}

```

图片导入路径必须能被构建器静态分析，不能用 `await import()` 或 `require()` 在运行时动态拼接图片模块。动态来源应传入 URL 字符串，并为远程地址配置 `remotePatterns`，同时提供 `width`/`height` 或使用 `fill`。

#### 3. 远程图片引入 (在线图片)

```tsx
import Image from "next/image";
export default async function Home() {
  const len = 20;
  return (
    <div>
      <h1>Home</h1>
      {Array.from({ length: len }).map((_, index) => (
        <Image
          key={index}
          src={`https://eo-img.521799.xyz/i/pc/img${index + 1}.webp`}
          alt="1"
          width={192}
          height={108}
        />
      ))}
    </div>
  );
}
```

当我们直接使用远程图片引入的时候Next.js会报错，因为Next.js默认只允许加载`本地图片`，如果需要加载远程图片，需要配置`next.config.js`文件。

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "eo-img.521799.xyz",
        pathname: "/i/pc/**",
        port: "",
      },
    ],
  },
};

export default nextConfig;
```

#### 4. LCP警告

对于确定的 LCP/首屏主图，应让浏览器尽早发现资源。可根据场景使用 `loading="eager"` 或 `fetchPriority="high"`；只有在单一、明确的关键图片需要从 `<head>` 提前发现时才使用 `preload`。不要同时叠加这些互斥的加载提示。

- lazy: 懒加载，默认值，在图片进入视口才会加载。
- eager: 不考虑图片是否进入视口，立即开始加载。

`preload` 会在 `<head>` 中插入预加载链接。多数场景优先使用 `loading="eager"` 或 `fetchPriority="high"`；如果不同视口可能有不同 LCP 图片，盲目 preload 还可能下载多余资源。

#### 5. 图片格式优化

Next.js 会通过请求`Accept`头自动检测浏览器支持的图像格式，以确定最佳输出格式

`Accept:image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8`

可以同时启用 AVIF 和 WebP，Next.js 会按 `formats` 顺序及浏览器 `Accept` 头选择输出格式。AVIF 通常压缩率更高，但首次编码更慢、会增加单独的格式缓存；官方仍建议多数场景优先评估 WebP，因此不存在“AVIF 对所有图片都最优”的通用结论。

> 后端会准备几种不同的格式，并返回最合适的格式(浏览器支持什么格式就返回什么格式 有一个从高到低的优先级)。

```ts
const nextConfig: NextConfig = {
  images: {
    // 调整策略
    formats: ["image/avif", "image/webp"], //默认是 ['image/webp']
  },
};
```

#### 6. 设备适配

`deviceSizes` 与 `imageSizes` 用于控制图像优化器生成 `srcset` 时可选择的宽度集合，并不是浏览器或设备兼容名单。只有在默认宽度不符合站点布局时才需要修改。

```ts
const nextConfig: NextConfig = {
  /* config options here */
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840], // 设备尺寸
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // 图片尺寸
  },
};
```

### 图片的一些 Props

#### 必需属性

| 属性  | 类型   | 示例                          | 说明                               |
| ----- | ------ | ----------------------------- | ---------------------------------- |
| `src` | String/StaticImport | `src="/profile.png"`   | 本地路径、已配置的远程 URL 或静态导入 |
| `alt` | String | `alt="Picture of the author"` | 图片替代文本，用于无障碍访问和 SEO |

#### 尺寸相关

| 属性     | 类型         | 示例                               | 说明                             |
| -------- | ------------ | ---------------------------------- | -------------------------------- |
| `width`  | Integer (px) | `width={500}`                      | 图片宽度，静态导入时可选         |
| `height` | Integer (px) | `height={500}`                     | 图片高度，静态导入时可选         |
| `fill`   | Boolean      | `fill={true}`                      | 填充父容器，替代 width 和 height |
| `sizes`  | String       | `sizes="(max-width: 768px) 100vw"` | 响应式图片尺寸                   |

#### 优化相关

| 属性          | 类型            | 示例                   | 说明                    |
| ------------- | --------------- | ---------------------- | ----------------------- |
| `quality`     | Integer (1-100) | `quality={80}`         | 图片压缩质量，默认为 75 |
| `loader`      | Function        | `loader={imageLoader}` | 自定义图片加载器函数    |
| `unoptimized` | Boolean         | `unoptimized={true}`   | 禁用图片优化，使用原图  |

#### 加载相关

| 属性          | 类型    | 示例                               | 说明                          |
| ------------- | ------- | ---------------------------------- | ----------------------------- |
| `loading`     | String  | `loading="lazy"`                   | 加载策略，"lazy" 或 "eager"   |
| `preload`     | Boolean | `preload={true}`                   | 是否预加载，用于 LCP 元素     |
| `placeholder` | String  | `placeholder="blur"`               | 占位符类型，"blur" 或 "empty" |
| `blurDataURL` | String  | `blurDataURL="data:image/jpeg..."` | 模糊占位符的 Data URL         |

#### 事件回调

| 属性      | 类型     | 示例                    | 说明                 |
| --------- | -------- | ----------------------- | -------------------- |
| `onLoad`  | Function | `onLoad={e => done()}`  | 图片加载完成时的回调 |
| `onError` | Function | `onError={e => fail()}` | 图片加载失败时的回调 |

#### 其他属性

| 属性          | 类型   | 示例                               | 说明                            |
| ------------- | ------ | ---------------------------------- | ------------------------------- |
| `style`       | Object | `style={ {objectFit: "contain"} }` | 内联样式对象                    |
| `overrideSrc` | String | `overrideSrc="/seo.png"`           | 覆盖 src，用于 SEO 优化         |
| `decoding`    | String | `decoding="async"`                 | 解码方式，"async"/"sync"/"auto" |

## Font 字体

`next/font`模块，内置了字体优化功能，其目的是防止`CLS`布局偏移。font模块主要分为两部分，一部分是内置的`Google Fonts`字体，另一部分是`本地字体`。

### 基本用法

1. 内置Google Fonts字体
2. 中文字符集支持 --> 寻找支持中文的字体
3. 可变字体把字重、字宽、倾斜度等一个或多个变化轴打包在同一字体文件中；它不会自动根据屏幕大小改变字体。加载可变 Google Font 时通常无需指定 `weight`，也可以用范围字符串（如 `"100 900"`）；`weight` 数组主要用于选择非可变字体的多个离散字重。
4. 本地字体加载

在使用google字体的时候，Google字体和css文件会在构建的时候下载到本地，可以与静态资源一起托管到服务器，所以不会向Google发送请求。

```tsx
// 可以点击进去看声明文件 判断有哪些字体
// 字体与可用子集可在 https://fonts.google.com/ 查询
import { Inter } from "next/font/google";

// 引入字体库 返回一个类名
const inter = Inter({
  display: "swap",
  subsets: ["latin"],
});
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        abcd 你好
      </body>
    </html>
  );
}
```

引入本地字体:

```tsx
// 本地字体
import localFont from "next/font/local"; // 引入本地字体库
const myFont = localFont({
  src: "./fonts/bbh-sans-hegarty.woff2",
  display: "swap",
});

export function LocalFontExample() {
  return <p className={myFont.className}>Local font</p>;
}
```

对于`display`的值，常用的有如下几种：

- `auto`：浏览器默认（通常为 block）
- `block`：空白 3s → 备用字体 → 自定义字体
- `swap`：备用字体 → 自定义字体 (常用)
- `fallback`：空白 100ms → 备用字体，3s 内加载完成则切换
- `optional`：空白 100ms，100ms 内加载完成则使用，否则用备用字体

### API 参考

| 属性                 | Google | 本地 | 类型           | 必填 | 说明                  |
| -------------------- | ------ | ---- | -------------- | ---- | --------------------- |
| `src`                | ✗      | ✓    | String/Array   | 是   | 字体文件路径          |
| `weight`             | ✓      | ✓    | String/Array   | 可选 | 字体粗细，如 '400'    |
| `style`              | ✓      | ✓    | String/Array   | -    | 字体样式，如 'normal' |
| `subsets`            | ✓      | ✗    | Array          | -    | 字符子集              |
| `axes`               | ✓      | ✗    | Array          | -    | 可变字体轴            |
| `display`            | ✓      | ✓    | String         | -    | 显示策略              |
| `preload`            | ✓      | ✓    | Boolean        | -    | 是否预加载            |
| `fallback`           | ✓      | ✓    | Array          | -    | 备用字体              |
| `adjustFontFallback` | ✓      | ✓    | Boolean/String | -    | 调整备用字体          |
| `variable`           | ✓      | ✓    | String         | -    | CSS 变量              |
| `declarations`       | ✗      | ✓    | Array          | -    | 自定义声明            |

## Script 组件

Next.js允许我们使用Script组件去加载js脚本(外部/本地脚本)，并且他还对Script组件进行优化。

### 基本使用

#### 局部使用

```tsx
// src/app/home/page.tsx
import Script from 'next/script' // 引入Script组件
export default function HomePage() {
    return (
        <div>
            <Script src="https://unpkg.com/vue@3/dist/vue.global.js" />
        </div>
    )
}
```

在 home 路由中使用默认的 `afterInteractive` 策略时，脚本会在该页面打开后于客户端加载。Next.js 会对同一脚本进行去重，浏览器也会按 HTTP 缓存策略复用资源。

`Script` 最终会管理原生 `<script>`，但注入时机和位置取决于 `strategy`：`beforeInteractive` 总会进入初始 HTML 的 `<head>`，其他策略由客户端按相应时机注入，不能概括为全部插入 `<head>`。

#### 全局引入

全局引入直接在app/layout.tsx中引入，他会自动在所有页面中引入，并且只会加载一次，然后纳入缓存。

```tsx
// src/app/layout.tsx
import Script from 'next/script' // 引入Script组件
export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html>
            <head>
                <Script src="https://unpkg.com/vue@3/dist/vue.global.js" />
            </head>
            <body>
                {children}
            </body>
        </html>
    )
}
```

#### 加载策略

Next.js允许我们通过`strategy`属性来控制Script组件的加载策略。

- `beforeInteractive`: 在 Next.js 自身模块和页面水合前下载并按顺序执行，只能放在根 layout；它会被预加载，但官方明确说明不会阻塞页面水合。仅用于全站关键脚本。
- `afterInteractive`(默认值): 在页面发生部分或全部水合后尽早加载。
- `lazyOnload`: 在浏览器空闲时稍后加载脚本。
- `worker`(实验性特性): 尝试在 Web Worker 中加载第三方脚本，支持范围受版本与路由模式限制，应先验证目标脚本兼容性。

外部脚本通过 `src` 标识，不要求额外设置 `id`；内联脚本没有 `src`，必须提供稳定且唯一的 `id`，以便 Next.js 跟踪和去重。

```tsx
import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
        <Script
          strategy="beforeInteractive"
          src="https://example.com/critical.js"
        />
        <Script
          strategy="afterInteractive"
          src="https://example.com/analytics.js"
        />
        <Script
          strategy="lazyOnload"
          src="https://example.com/chat-widget.js"
        />
      </body>
    </html>
  );
}
```

#### 内联脚本

即使不从外部文件载入脚本，Next.js也支持我们通过`{}`直接在Script组件编写代码。

```tsx {10-14,19-31}
import Script from "next/script";
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          id="VGUBHJMK5"
          strategy="beforeInteractive"
          src="https://unpkg.com/vue@3/dist/vue.global.js"
        ></Script>
      </head>
      <body>
        {children}
        <div id="app"></div>
        <Script id="VGUBHJMK6" strategy="afterInteractive">
          {`
            const {createApp} = Vue
            createApp({
              template: '<h1>{{ message }}</h1>',
              setup() {
                return {
                  message: 'Next.js + Vue.js'
                }
              }
            }).mount('#app')
          `}
        </Script>
      </body>
    </html>
  );
}
```

第二种写法使用 `dangerouslySetInnerHTML` 属性来设置内联脚本。

```tsx
<Script
  id="VGUBHJMK7"
  dangerouslySetInnerHTML={{
    __html: `
    const {createApp} = Vue
    createApp({
        template: '<h1>{{ message }}</h1>',
        setup() {
        return {
            message: 'Next.js + Vue.js'
        }
        }
    }).mount('#app')
    `,
  }}
  strategy="afterInteractive"
></Script>
```

#### 事件监听 (生命周期)

- `onLoad`: 脚本加载完成时触发。
- `onReady`: 脚本加载完成后，且组件每次挂载的时候都会触发。
- `onError`: 脚本加载失败时触发。

> `Script` 本身可以在 App Router 的 Server Component Page 或 Layout 中使用，并不一律要求 `'use client'`。如果要使用 `onLoad`、`onReady` 或 `onError` 回调，所在组件必须是 Client Component；`onError` 不能与 `beforeInteractive` 一起使用。

## 静态导出与 SSG

Next.js 支持静态站点生成（SSG，Static Site Generation）。启用静态导出后，Next.js 会在构建时为可静态生成的路由输出 HTML、CSS 和 JavaScript 文件，适合官网、博客、文档等不依赖运行时服务器能力的站点。它通常有利于加载性能、部署成本和 SEO，但实际效果仍取决于页面内容、资源体积、缓存和部署方式。

### 注意事项

以下限制针对 `output: "export"` 的纯静态导出，并不代表所有 SSG 场景都不支持这些能力：

- `Dynamic Routes with dynamicParams: true`
- 动态路由没有使用 `generateStaticParams()`
- 路由处理器依赖于 `Request`
- `Cookies`
- `Rewrites` 重写
- `Redirects` 重定向
- `Headers` 头
- `Proxy` 代理
- `Incremental Static Regeneration` 增量静态再生
- `Image Optimization with the default loader` 默认加载器的图像优化
- `Draft Mode` 草稿模式
- `Server Actions` 服务器操作
- `Intercepting Routes` 拦截路由

### 配置静态导出

需要在 `next.config.ts` 中把 `output` 配置为 `"export"`。执行 `next build` 后，默认输出目录是 `out`；也可以使用 `distDir` 修改该目录。

```ts
// next.config.ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  /* config options here */
  output: "export", // 导出静态站点
  distDir: "dist", // 导出目录
};

export default nextConfig;
```

默认情况下，静态导出可能生成 `about.html`。`/about` 能否正常访问取决于静态托管服务是否会把无扩展名路径重写到对应 HTML 文件；这不是 `<a>` 标签本身的问题。

### 图片优化

纯静态导出没有运行中的 Next.js 图片优化服务，因此 `next/image` 的默认 loader 不受支持；这个限制主要会在静态导出构建或部署时体现，而不是笼统地说“开发模式会报错”。

可能的解决方案：

- 移除 `{ output: 'export' }` 并运行 `next start` 以启用包含图片优化 API 的服务器模式。
- 在 `next.config.js` 中配置 `{ images: { unoptimized: true } }` 来禁用图片优化 API。
- 使用原生的`img`标签
- 使用自定义loader实现

```tsx
import Image from "next/image";
import test from "@/public/1.png";
export default function About() {
  return (
    <div>
      <h1>About</h1>
      <Image
        loading="eager"
        src={test}
        alt="logo"
        width={250 * 3}
        height={131 * 3}
      />
    </div>
  );
}
```

使用自定义`loader`来实现图片优化, 要求我们通过一个图床托管图片。

```ts {8-11}
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // 导出静态站点
  distDir: "dist", // 导出目录
  trailingSlash: true, // 添加尾部斜杠，生成 /about/index.html 而不是 /about.html
  images: {
    loader: "custom", // 自定义loader
    loaderFile: "./image-loader.ts", // 自定义loader文件
  },
};

export default nextConfig;
```

```ts
// /image-loader.ts
export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  const url = new URL(src, "https://images.example.com");
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", String(quality ?? 75));
  return url.toString();
}
```

```tsx
// src/app/about/page.tsx
import Image from "next/image";

export default function About() {
  return (
    <div>
      <h1>About</h1>
      <Image
        src="/pZYbW7t.jpg"
        alt="示例图片"
        width={750}
        height={393}
      />
    </div>
  );
}
```

### 动态路由处理

新建目录: `src/app/posts/[id]/page.tsx`

如果要使用动态路由，则需要使用`generateStaticParams`函数来生成有多少个动态路由，这个函数需要返回一个数组，数组中包含所有动态路由的参数，例如`{ id: '1' }`表示对应`id`为`1`的详情页。

```tsx
export async function generateStaticParams() {
  // 也可以在构建期间请求接口，取得需要预生成的 id 列表。
  return [
    { id: "1" }, //返回对应的详情id
    { id: "2" },
  ];
}

export default async function Post({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div>
      <h1>Post {id}</h1>
    </div>
  );
}
```

### 修改配置项

> 若静态托管服务不会自动把 `/about` 映射到 `about.html`，可以配置托管层重写；也可以启用 `trailingSlash`，改为输出 `/about/index.html`。应根据部署平台选择其中一种方式。

需要在`next.config.js`文件中配置`trailingSlash`为`true`，表示添加尾部斜杠，生成`/about/index.html`而不是`/about.html`。

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "export", // 导出静态站点
  distDir: "dist", // 导出目录
  trailingSlash: true, // 添加尾部斜杠，生成 /about/index.html 而不是 /about.html
};

export default nextConfig;
```

启用后，请确认托管服务支持以目录索引文件响应 `/about/`。`trailingSlash` 解决的是输出路径与托管规则的匹配问题，并不能保证所有静态服务器都无需配置。

## MDX

`MDX` 是 Markdown 的超集，可以在 Markdown 中编写 JSX，并组合 React 组件，适合技术文档和博客。MDX 可以配合静态生成使用，也可以在服务器渲染等场景中使用，并不依赖 SSG。

- 安装依赖

```bash
pnpm add @next/mdx @mdx-js/loader @mdx-js/react @types/mdx
```

### 启用MDX功能

```ts {4-6,9}
// next.config.ts
import type { NextConfig } from "next";
import createMDX from "@next/mdx";
const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
});
const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
};
export default withMDX(nextConfig);
```

使用 App Router 与 `@next/mdx` 时，还必须在项目根目录（使用 `src` 目录时也可放在 `src` 内）创建 `mdx-components.tsx` 文件：

```tsx
// mdx-components.tsx
import type { MDXComponents } from "mdx/types";

const components: MDXComponents = {};

export function useMDXComponents(): MDXComponents {
  return components;
}
```

### 代码高亮

代码高亮并不是 `@next/mdx` 默认自带的完整能力。可以按所选方案配置兼容的 remark/rehype 插件，并同时加载相应样式；使用 Turbopack 时还应确认插件能够被序列化，通常以字符串形式配置插件名称。

### 基础使用

可以支持(`Markdown`语法 + `React`组件 + `HTML`标签)

### 引入自定义组件

在 MDX 中导入并使用自定义组件时，应遵循 ESM 与 Markdown 的块级语法。通常在 `import` 语句和后续 Markdown 内容之间保留空行更清晰，也能避免内容被解析成同一块；但“任何组件与 Markdown 之间不空行都会报错”并不是通用规则。

### 全局样式

如果你希望在这个项目中修改所有的MDX文件的样式，你可以使用`mdx-components.tsx`文件来修改。

```tsx
//mdx-components.tsx
import type { MDXComponents } from "mdx/types";

const components: MDXComponents = {
  h1: ({ children }) => (
    <h1 className="text-2xl text-red-400 font-bold">{children}</h1>
  ), //# 代表h1 你可以自定义修改样式
  li: ({ children }) => (
    <li className="list-disc text-blue-500 list-inside">{children}</li>
  ), //- 代表li 你可以自定义修改样式
  //...你可以自定义修改更多的样式
};

export function useMDXComponents(): MDXComponents {
  return components;
}
```

### 远程加载mdx/md文件

如果你的MDX文件存储在远程服务器上，你可以使用`远程mdx`来加载文件。

安装依赖:

```bash
npm install next-mdx-remote-client
pnpm add next-mdx-remote-client
```

```tsx
//src/app/home/page.tsx
import { MDXRemote } from "next-mdx-remote-client/rsc";
export default async function Home() {
  const res = await fetch("https://xxx.com");
  if (!res.ok) {
    throw new Error(`加载远程 MDX 失败：${res.status}`);
  }
  const source = await res.text();
  return <MDXRemote source={source} />;
}
```

远程 MDX 会被编译并执行，其中可以包含 JavaScript 表达式。只能加载完全可信、经过发布流程控制的内容；普通 HTML 清洗不能消除所有 MDX 代码执行风险，不要直接渲染用户提交或来源不明的 MDX。

## Server Functions 与 Server Actions

Server Function 是使用 `"use server"` 标记、在服务器上执行的异步函数；在表单提交或数据变更等 Action 场景中使用时，通常称为 Server Action。它可以从服务端组件或客户端组件触发，常用于处理表单、校验数据和更新持久化数据，无需再为同一操作手写 Route Handler。

Server Action 本质上仍是可从客户端发起的网络入口。必须在函数内部重新进行身份认证、权限校验和输入校验，不能因为代码运行在服务器上就信任客户端参数。

### 核心原理

React 扩展了原生 `<form>`，允许通过 `action` 属性绑定函数。绑定 Server Action 时，提交会通过 `POST` 请求调用服务器函数，函数默认接收原生 `FormData`。在服务端组件中，这种表单还支持渐进式增强：即使客户端 JavaScript 尚未加载或被禁用，也可以提交。

### 基本用法

传统的表单提交方式:

![alt text](/assert/nextjs_image/traditional.png)

服务器函数的用法:

![alt text](/assert/nextjs_image/server-Funciton.png)

示例:

```tsx {3,14}
export default function Login() {
  async function handleLogin(formData: FormData) {
    "use server"; // 内联函数
    const username = formData.get("username"); // 接受单个参数
    const password = formData.get("password"); // 接受单个数据
    const form = Object.fromEntries(formData); // 转成普通对象后再进行校验
    // 可以直接操作数据库，这样就无需编写API接口
  }
  return (
    <div>
      <h1>登录页面</h1>
      <div className="flex flex-col gap-2 w-[300px] mx-auto mt-30">
        <form action={handleLogin} className="flex flex-col gap-2">
          <input
            className="border border-gray-300 rounded-md p-2"
            type="text"
            name="username"
            placeholder="用户名"
          />
          <input
            className="border border-gray-300 rounded-md p-2"
            type="password"
            name="password"
            placeholder="密码"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded-md"
          >
            登录
          </button>
        </form>
      </div>
    </div>
  );
}
```

`FormData` 的值可能是字符串或 `File`，不能直接假定全部为字符串。框架还可能在表单数据中加入以 `$ACTION_` 开头的内部字段，因此批量转换后应只提取并校验业务需要的字段。

### 额外参数

表单可以通过任意具名控件提交字段。如果还需要传入不适合作为可编辑表单字段的上下文参数，例如当前记录 ID，可以使用 `bind` 创建一个带预绑定参数的 Server Action。

> 那么我想携带`ID`或者其他自定义参数怎么做？

使用 `bind` 后，预绑定参数位于 `FormData` 之前。客户端仍能构造请求，因此 ID 只能作为待校验的输入，不能作为授权依据。

```tsx {3,10,16}
export default function Login() {
  //接受id参数
  async function handleLogin(id: number, formData: FormData) {
    "use server";
    const username = formData.get("username");
    const password = formData.get("password");
    const form = Object.fromEntries(formData);
    console.log(username, password, form, id);
  }
  const userFunction = handleLogin.bind(null, 10); // 绑定id参数
  return (
    <div>
      <h1>登录页面</h1>
      <div className="flex flex-col gap-2 w-[300px] mx-auto mt-30">
        {/*使用新的函数绑定id参数 userFunction*/}
        <form action={userFunction} className="flex flex-col gap-2">
          <input
            className="border border-gray-300 rounded-md p-2"
            type="text"
            name="username"
            placeholder="用户名"
          />
          <input
            className="border border-gray-300 rounded-md p-2"
            type="password"
            name="password"
            placeholder="密码"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded-md"
          >
            登录
          </button>
        </form>
      </div>
    </div>
  );
}
```

### 参数校验(zod) + 读取状态

Zod 是一个数据验证库，可以在服务器端把不可信输入解析为明确的业务数据。校验能拒绝格式不符合要求的输入，但仍需单独完成身份认证、授权、限流和数据库约束。

安装:

```bash
npm i zod
```

在`src/app/login/page.tsx` , 中如果要读取状态需要使用React19的`useActionState` hook，这个hook必须在客户端组件中使用。所以需要增加`'use client'`声明这是一个客户端组件。

`useActionState` hook接受三个参数:

- `fn`: 表单提交时触发的函数，接收上一次的 state（首次为 initialState）作为第一个参数，其余参数为表单参数
- `initialState`：状态初始值；与 Server Function 配合时必须可序列化
- `permalink`（可选）：在 JavaScript 尚未加载时提交表单所导航到的稳定 URL；目标页面必须渲染相同的表单、Action 与 permalink，React 才能继续传递状态

返回值:

- `state`: 当前状态，初始值为 initialState，之后为 action 的返回值
- `formAction`: 新的 action 函数，用于传递给 form 或 button 组件
- `isPending`：布尔值，表示该 Action 是否仍在进行

```tsx
// src/app/login/page.tsx
"use client";
import { useActionState } from "react";
import { handleLogin } from "../lib/login/actions";
const initialState = { message: "" };
export default function Login() {
  const [state, formAction, isPending] = useActionState(
    handleLogin,
    initialState,
  );

  return (
    <div>
      <h1>登录页面</h1>
      {isPending && <div>Loading...</div>}
      <p aria-live="polite">{state.message}</p>
      <div className="flex flex-col gap-2 w-[300px] mx-auto mt-30">
        <form action={formAction} className="flex flex-col gap-2">
          <input
            className="border border-gray-300 rounded-md p-2"
            type="text"
            name="username"
            placeholder="用户名"
          />
          <input
            className="border border-gray-300 rounded-md p-2"
            type="password"
            name="password"
            placeholder="密码"
          />
          <button
            type="submit"
            disabled={isPending}
            className="bg-blue-500 text-white p-2 rounded-md"
          >
            登录
          </button>
        </form>
      </div>
    </div>
  );
}
```

```ts
// src/app/lib/login/actions.ts
"use server";
import { z } from "zod";
const loginSchema = z.object({
  username: z.string().min(6, "用户名不能少于6位"), // zod基本用法表示这是一个字符串，并且不能少于6位
  password: z.string().min(6, "密码不能少于6位"), // zod基本用法表示这是一个字符串，并且不能少于6位
});

type LoginState = { message: string };

export async function handleLogin(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const result = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!result.success) {
    const { fieldErrors, formErrors } = z.flattenError(result.error);
    const messages = [...formErrors, ...Object.values(fieldErrors).flat()];
    return { message: messages.join("；") };
  }

  // 此处仍需完成限流、认证服务调用或数据库查询等真实登录逻辑。
  return { message: "输入格式校验通过" };
}
```

## 环境变量

环境变量是从进程外部传入的键值配置，常用于数据库连接字符串、API 密钥和端口号等。操作系统、容器平台和部署服务都可以提供环境变量，Next.js 还会按约定加载项目根目录中的 `.env*` 文件。

### 最佳实践

当变量较多时，可以使用 `.env` 文件保存本地配置。`.env*` 通常包含密钥，不应提交到版本库；使用 `src` 目录时，这些文件仍应放在项目根目录，而不是 `src` 内。

Next.js 环境变量查找规则(官方规定)，如果在其中一个链路中找到了环境变量，那么就不会继续往下找了。

1. `process.env`
2. `.env.$(NODE_ENV).local`
3. `.env.local`（`NODE_ENV=test` 时不加载）
4. `.env.$(NODE_ENV)`
5. `.env`

> 提示：Next.js 会根据执行命令设置 `NODE_ENV`：`next dev` 使用 `development`，其他 Next.js 命令通常使用 `production`，测试工具可使用 `test`。不应自行定义其他 `NODE_ENV` 值。

可以分别创建 `.env.development.local` 和 `.env.production.local`，存放仅用于本机开发或本机生产构建的覆盖值。

未以 `NEXT_PUBLIC_` 开头的变量只应在服务器代码中读取。`NEXT_PUBLIC_` 变量会在构建时内联进浏览器包，构建完成后再修改部署环境中的同名变量不会改变已经生成的客户端代码。任何发送到客户端的变量都不能包含秘密。

## i18n (国际化)

国际化（Internationalization，i18n）是让应用适配不同语言和地区的设计过程。App Router 提供动态路由、Proxy 等基础能力，但翻译内容、语言协商和切换策略仍需应用自行实现或交给国际化库；Next.js 不会自动翻译接口数据。

一般我们把语言和地区组合起来，称为`locale`，例如`en-US`表示英语(美国)，`zh-CN`表示中文(中国)。

### 实现原理

Next.js建议我们使用http报文头来判断用户使用的语言`Accept-Language`，例如`Accept-Language: zh-CN,zh;q=0.9,en;q=0.8`表示用户使用中文(中国)，如果用户没有设置，则使用默认语言。

#### Accept-Language规则

`zh-CN,zh;q=0.9,en;q=0.8` 表示 `zh-CN` 的质量值为 1（省略了 `q=1`）、通用中文 `zh` 为 0.9、通用英语 `en` 为 0.8。它没有声明 `en-US`。

#### 安装第三方库

```bash
pnpm add negotiator @formatjs/intl-localematcher
pnpm add -D @types/negotiator
```

#### 测试用例

1. 新建 `dictionaries` 文件夹，存放多语言文件，例如 `zh.json`、`en.json`。
2. 创建一个文件`i18n.ts`，用于处理多语言。

```ts
import "server-only";

export const locales = ["en", "zh"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export type Dictionary = {
  title: string;
  description: string;
  keywords: string;
};

const dictionaries: Record<Locale, () => Promise<{ default: Dictionary }>> = {
  en: () => import("./dictionaries/en.json"),
  zh: () => import("./dictionaries/zh.json"),
};

export const hasLocale = (value: string): value is Locale =>
  Object.hasOwn(dictionaries, value);

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return (await dictionaries[locale]()).default;
}
```

3. 创建一个动态页面 `/src/app/[lang]/page.tsx`

```tsx
// src/app/[lang]/page.tsx
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "@/app/i18n";

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const dictionary = await getDictionary(lang);
  return <h1>{dictionary.title}</h1>;
}
```

4. 创建 Proxy 文件 `/src/proxy.ts`。它应与 `app` 目录同级，不能放在 `src/app` 内。

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { locales, defaultLocale } from "@/app/i18n";
import Negotiator from "negotiator"; // 用于解析Accept-Language
import { match } from "@formatjs/intl-localematcher";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathnameHasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  const language = new Negotiator({
    headers: {
      "accept-language": request.headers.get("accept-language") ?? "",
    },
  }).languages();
  const locale = match(language, [...locales], defaultLocale);
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher:
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
};
```

5. 封装语言切换组件

```tsx
// src/app/[lang]/home/SwitchI18n.tsx
// 这个组件是语言切换组件，他会根据当前语言切换到对应语言的页面，
// 例如当前语言为zh，则切换到/zh/home页面，当前语言为en，则切换到/en/home页面等
"use client";
import { locales, type Locale } from "@/app/i18n";
import { usePathname, useRouter } from "next/navigation";
export default function SwitchI18n({ lang }: { lang: Locale }) {
  const pathname = usePathname(); // 获取当前路径
  const router = useRouter(); // 获取路由实例
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as Locale;
    const segments = pathname.split("/");
    segments[1] = newLang;
    const newPath = segments.join("/");
    router.replace(newPath); // 跳转新路径
  };
  return (
    <div>
      <select aria-label="切换语言" value={lang} onChange={handleChange}>
        {locales.map((locale) => (
          <option key={locale} value={locale}>
            {locale}
          </option>
        ))}
      </select>
    </div>
  );
}
```

6. 使用语言切换组件

```tsx
// src/app/[lang]/home/page.tsx
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "@/app/i18n";
import SwitchI18n from "./SwitchI18n";
export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dictionary = await getDictionary(lang);
  return (
    <div>
      <SwitchI18n lang={lang} /> {/* 语言切换组件并且传入当前语言 */}
      <h1>{dictionary.title}</h1>
      <p>{dictionary.description}</p>
      <p>{dictionary.keywords}</p>
    </div>
  );
}
```

## next.config.js 配置

下面整理一些常见配置项。是否需要使用取决于部署方式和应用需求，不存在适用于所有项目的固定清单。

### 根据不同环境进行配置

例如我想在开发环境配置 AAA，或者生产环境配置 BBB，那么我们可以使用`next/constants`来判断当前环境。

```ts
//Next.js next/constants内置的常量 (经常使用的常量)
export declare const PHASE_EXPORT = "phase-export"; // 导出静态站点
export declare const PHASE_PRODUCTION_BUILD = "phase-production-build"; // 生产环境构建
export declare const PHASE_PRODUCTION_SERVER = "phase-production-server"; // 生产环境服务器
export declare const PHASE_DEVELOPMENT_SERVER = "phase-development-server"; // 开发环境服务器
export declare const PHASE_TEST = "phase-test"; // 测试环境
export declare const PHASE_INFO = "phase-info"; // 信息
```

根据不同环境配置，需要返回一个函数，而不是直接返回一个对象，在函数中会接受一个参数`phase`，这个参数是Next.js的环境，我们可以根据这个参数来判断当前环境。

```ts
//next.config.ts
import {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
} from "next/constants"; // 不需要安装 直接引入即可
import type { NextConfig } from "next";

export default (phase: string): NextConfig => {
  const nextConfig: NextConfig = {
    reactCompiler: false,
  };

  if (phase === PHASE_DEVELOPMENT_SERVER) {
    // 开发环境使用reactCompiler
    nextConfig.reactCompiler = true;
  }
  //
  if (phase === PHASE_PRODUCTION_BUILD) {
    // 生产环境关闭reactCompiler
    nextConfig.reactCompiler = false;
  }

  return nextConfig;
};
```

### Next.js配置端口号

直接在`package.json`文件中配置`scripts` (配置文件中没有配置端口选项)

```jsonc
// package.json
{
  "scripts": {
    "dev": "next dev -p 1111", // 开发环境端口号
    "build": "next build",
    "start": "next start -p 3333" // 生产环境端口号
  }
}
```

### Next.js导出静态站点 (SSG章节总结过)

需要在`next.config.js`文件中配置`output`为`export`，表示导出静态站点。`distDir`表示导出目录，默认为`out`。

```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  /* config options here */
  output: "export", // 导出静态站点
  distDir: "dist", // 导出目录
  trailingSlash: true, // 添加尾部斜杠，生成 /about/index.html 而不是 /about.html
};

export default nextConfig;
```

### Next.js配置图片优化 (图片章节总结过)

Next.js 的 `Image` 组件可以加载本地图片；加载远程 URL 时，需要通过 `remotePatterns` 明确允许协议、主机名和路径，以限制可被图片优化服务请求的来源。

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https", // 协议
        hostname: "xxxx.com", // 主机名
        pathname: "/i/pc/**", // 路径
        port: "", // 端口
      },
    ],
    formats: ["image/avif", "image/webp"], //默认是 ['image/webp']
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840], // 设备尺寸
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // 图片尺寸
  },
};
```

### 自定义响应标头

`headers` 可以给匹配的响应添加自定义 HTTP 头。下面以不携带凭据的宽松 CORS 头为例；生产环境通常应使用明确的来源白名单。

```ts
const nextConfig: NextConfig = {
  headers: () => {
    return [
      {
        source: "/:path*", // 匹配路径 所有路径 也支持精准匹配 例如/api/user 包括支持动态路由等 /api/user/:id
        headers: [
          {
            key: "Access-Control-Allow-Origin", // 允许跨域
            value: "*", // 允许所有域名访问
          },
          {
            key: "Access-Control-Allow-Methods", // 允许的请求方法
            value: "GET, POST, PUT, DELETE, OPTIONS", // 允许的请求方法
          },
          {
            key: "Access-Control-Allow-Headers", // 允许的请求头
            value: "Content-Type, Authorization", // 允许的请求头
          },
        ],
      },
      {
        source: "/home", // 精准匹配 /home 路径 (只有匹配上的路径才会加上自定义响应头)
        headers: [
          {
            key: "X-Custom-Header", //自定义响应头
            value: "123456", // 值
          },
        ],
      },
    ];
  },
};
```

仅添加这些头不一定构成完整的 CORS 实现：路由还必须正确响应预检 `OPTIONS` 请求；若要携带 Cookie，则不能把 `Access-Control-Allow-Origin` 设置为 `*`，还需按请求来源返回允许值并配置凭据相关响应头。

[HTTP响应头](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers)

### assetPrefix 配置静态资源前缀

`assetPrefix`配置用于配置静态资源前缀，例如：部署到CDN后，静态资源路径会发生变化，需要配置这个配置项。

```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  /* config options here */
  assetPrefix: "https://cdn.example.com", // 静态资源前缀
};

// 配置前 /_next/static/chunks/4b9b41aaa062cbbfeff4add70f256968c51ece5d.4d708494b3aed70c04f0.js
// 配置后 https://cdn.example.com/_next/static/chunks/4b9b41aaa062cbbfeff4add70f256968c51ece5d.4d708494b3aed70c04f0.js

export default nextConfig;
```

### basePath 配置应用前缀

`basePath` 用于把应用部署在域名的子路径下。例如设置为 `/docs` 后，应用中的 `/home` 实际位于 `/docs/home`。该值会在构建时写入客户端包，修改后必须重新构建。

```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  basePath: "/docs", // 基础路径
};

export default nextConfig;
```

`basePath` 本身不会要求域名根路径 `/` 自动跳到 `/docs`。通常应在反向代理或托管平台配置这个站外入口重定向。Next.js 的 redirects 中，`basePath: false` 只用于不加 basePath 的外部重定向，不能用它把 `/` 内部重定向到 `/docs`。

如果使用`link`跳转的话，无需增加`basePath`前缀，因为`Link`组件会自动增加`basePath`前缀。 当他跳转`/home`时，会自动跳转到`/docs/home`。

```tsx
import Link from "next/link";
export default function Page() {
  return (
    <div>
      <h1>11111</h1>
      <Link href="/home">Home</Link>
    </div>
  );
}
```

### compress

`compress` 控制 Next.js 服务器在没有自定义压缩方案时是否对响应启用 gzip，默认开启。它不是用来控制构建工具是否压缩 JavaScript/CSS，也不影响纯静态导出文件在外部静态服务器上的传输压缩。

```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  compress: true, // 压缩
};

export default nextConfig;
```

### 日志配置

`logging` 用于开发环境日志。当前 `fetches` 配置只影响通过 `fetch` 发起的数据请求日志，例如是否显示完整 URL。

```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  logging: {
    fetches: {
      fullUrl: true, // 显示完整的URL
    },
  },
};

export default nextConfig;
```

### 页面扩展 (参考MDX)

默认页面扩展名为 `.tsx`、`.ts`、`.jsx` 和 `.js`。可以通过 `pageExtensions` 增加 `.md`、`.mdx` 等扩展名。修改该配置会影响 Next.js 识别的所有特殊文件和页面文件，因此自定义诸如 `.page.tsx` 的后缀时也要相应重命名这些文件。

### devIndicators

关闭调试指示器，默认情况下是开启的，如果需要关闭，可以配置为`false`。

```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  devIndicators: false, // 关闭开发指示器
  // devIndicators:{
  //   position:'bottom-right', //也支持放入其他位置 bottom-right bottom-left top-right top-left
  // },
};

export default nextConfig;
```

### generateEtags

Next.js 默认会为页面响应生成 `ETag`，客户端或中间缓存可以用它进行条件请求。`generateEtags: false` 可关闭该行为；它不是为 `public` 目录中的每个静态文件统一生成 ETag 的开关。

浏览器会根据`ETag`来判断文件是否发生变化，如果发生变化，则重新下载文件。

```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  generateEtags: false, // 关闭生成ETag 默认开启
};

export default nextConfig;
```

### turbopack

Next.js已内置`turbopack`进行打包编译等操作，所以允许透传配置项给turbopack。

多数项目无需修改 Turbopack 配置；只有需要自定义解析别名、文件扩展名或 loader 等行为时再配置。具体支持范围应以当前 Next.js 文档为准，不能把所有打包优化都概括为由这个配置项自动完成。

具体用法请查看: [turbopack](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack)

## Next.js CSS方案

- Tailwind CSS
- CSS Modules（通过文件级局部类名避免全局冲突）
- Sass（安装 `sass` 后使用 `.scss` 或 `.sass`）
- 全局 CSS
- 内联 `style`
- CSS-in-JS

CSS-in-JS 并非一概“不推荐”，但运行时 CSS-in-JS 库通常需要客户端状态和样式注册表，不能直接在 Server Components 中使用。选型时应确认目标库对 App Router、流式渲染和 Server Components 的支持方式。

## SEO

### SEO介绍

SEO(Search Engine Optimization)，即`搜索引擎优化`，是一种通过优化网站结构和内容，提高网站在搜索引擎中的排名，从而吸引更多流量和用户的策略。

::: tip
SEO 通常需要持续建设内容、可抓取性、性能和站点信誉。收录与排名生效时间没有统一的“1—3 个月”保证，应结合搜索平台报告、访问日志和真实流量长期观察。
:::

#### 黑帽SEO

黑帽SEO是指通过不正当的手段，如关键词堆砌、隐藏文本、欺诈性链接等，来提高网站在搜索引擎中的排名。这种做法虽然可以在短期内获得较好的效果，但长期来看会对网站造成严重的负面影响，甚至可能导致网站被搜索引擎惩罚。

#### 白帽SEO

白帽SEO就是通过正当技术手段，例如优化`TDK`，优化网站结构，优化`robots.txt`，优化`sitemap.xml`，优化`JSON-LD`，优化`Open Graph`，优化`Web Vitals`等，来提高网站在搜索引擎中的排名。

### Google搜索引擎

Google 搜索是一款`全自动搜索引擎`，会使用名为“网页抓取工具”的软件定期探索网络，找出可添加到 Google 索引中的网页。实际上，Google 搜索结果中收录的大多数网页都不是手动提交的，而是网页抓取工具在探索网络时找到并自动添加的。

#### Google搜索引擎原理

Google 搜索的工作流程分为 3 个阶段:

1. `抓取`：Google 会使用名为“抓取工具”的自动程序从互联网上发现各类网页，并下载其中的文本、图片和视频。
2. `索引编制`：Google 会分析网页上的文本、图片和视频文件，并将信息存储在大型数据库 Google 索引中。
3. `呈现搜索结果`：当用户在 Google 中搜索时，Google 会返回与用户查询相关的信息。

抓取 --> 索引编制 --> 呈现搜索结果

### 常见影响因素

- 内容与搜索意图的相关性和质量
- 站点与内容的可信度、权威性
- 页面体验、移动端可用性与可访问性

搜索引擎的排序系统包含大量信号且会持续变化，上述只是概括，不能当作完整或固定的排名公式。

### robots.txt

`robots.txt` 是放在站点根路径的爬虫访问约定，用来声明哪些路径允许或不允许特定爬虫抓取。它不是访问控制或保密机制，恶意爬虫可以忽略它；而且禁止抓取也不等同于保证不被索引。敏感内容必须通过认证和授权保护，需要阻止索引时应使用适当的 `noindex` 机制并允许爬虫读取该指令。

#### 参数说明

User-agent:
user-agent是搜索引擎爬虫的名称，例如`Googlebot`，`Baiduspider`，`Bingbot`，`YandexBot`，`Sogou spider`，`Yahoo! Slurp`，`BingPreview`等，也可以直接使用`*`表示所有搜索引擎爬虫都可以访问。

Disallow:
disallow是搜索引擎爬虫`不能访问`的页面，例如/admin/，/api/，/login/，/logout/等。

Allow:
allow是搜索引擎爬虫`可以访问`的页面，例如/，/about/，/contact/等。

Crawl-delay:
crawl-delay是搜索引擎爬虫访问网站的`间隔时间`，例如10，表示搜索引擎爬虫访问网站的间隔时间为10秒。

> 注意: Google机器人不支持该参数，其他部分爬虫机器人支持该参数

Sitemap:
sitemap是网站地图的URL

Host:
`Host` 是部分爬虫支持的非标准扩展，并不属于通用 robots.txt 标准，Google 也不使用它。不要把它当作跨搜索引擎通用的主域名声明。

### Next.js中实现robots.txt

Next.js中实现robots.txt非常简单，我们是`AppRouter`，所以直接在`app`目录下创建一个`robots.ts`文件即可。

```ts
import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return {
    // 如果是通用规则，可以这样写，就直接是一个对象类似于掘金
    // rules: {
    //    userAgent: '*',
    //    allow: '/',
    //    disallow: '/private/',
    //  },
    //自定义爬虫机器人规则可以用数组形式，就是一个数组类似于哔哩哔哩
    rules: [
      {
        userAgent: "Googlebot", //搜索引擎爬虫的名称
        allow: "/", //允许访问的页面
        disallow: "/api/", //不允许访问的页面
        crawlDelay: 10, //访问间隔时间(Google机器人不支持该参数，其他部分爬虫机器人支持该参数)
      },
      {
        userAgent: "Baiduspider",
        allow: "/",
        disallow: "/api/",
        crawlDelay: 10,
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: "/api/",
        crawlDelay: 10,
      },
      {
        userAgent: "YandexBot",
        allow: "/",
        disallow: "/api/",
        crawlDelay: 10,
      },
      {
        userAgent: "Sogou spider",
        allow: "/",
        disallow: "/api/",
        crawlDelay: 10,
      },
    ],
    sitemap: "https://example.com/sitemap.xml", // 网站地图必须使用完整URL
    //如果有多个可以写成一个数组
    // sitemap: ['https://example.com/sitemap.xml', 'https://example.com/sitemap-2.xml'],
  };
}
```

### sitemap.xml

sitemap.xml 是网站地图，用来向搜索引擎提供一批`希望被发现的页面 URL`（以及可选的更新时间、更新频率、优先级等提示信息），帮助爬虫更系统地遍历站点。哪些路径`不允许抓取`或`不希望被索引`，通常由 `robots.txt`、`noindex` 等机制单独声明，而不是靠 sitemap 来“禁止”。

#### 主要作用

1. 帮助搜索引擎发现页面 如果你是新网站，并且有大量的路由是深层级的，爬虫很难发现你的页面，这时候你可以使用sitemap.xml来告诉搜索引擎你的页面有哪些，方便搜索引擎抓取。
2. 利于被发现与纳入索引的考虑：例如掘金这类内容量很大的站点，会通过 sitemap（常按类型或分页拆成多个 XML）把文章 URL 结构化地提供给搜索引擎，**提高被抓取、被纳入索引的机会**

#### 常用字段与扩展

下面按 [Sitemaps.org 协议](https://www.sitemaps.org/protocol.html) 与常见的 Google 扩展（图片 / 视频）来说明。除 `loc` 外均为可选；扩展需在根节点声明对应` xmlns` 。

**`loc`**（必填）
页面 **绝对地址**（`http` / `https`），需与站点实际可访问 URL 一致，并对 `&`、`<` 等做 XML 转义（例如 `&` 写成 `&amp;`）。

示例：`https://www.example.com/page`、`https://www.example.com/page/1`

`lastmod`（可选）
**最后修改时间**，建议使用 W3C Datetime（与 [协议说明](https://www.sitemaps.org/protocol.html#xmlTagDefinitions) 一致）：

- 仅日期：`2026-04-20`
- 日期 + 时间（可带时区）：`2026-04-20T12:00:00+08:00`

尽量与页面真实变更时间一致；乱写可能被搜索引擎忽略。

`changefreq`（可选）
**相对**本站该 URL 的“预期更新频率”，协议允许取值如下（英文为写入 XML 的值）：

| 取值    | 含义               |
| ------- | ------------------ |
| always  | 每次访问都可能不同 |
| hourly  | 约每小时           |
| daily   | 约每天             |
| weekly  | 约每周             |
| monthly | 约每月             |
| yearly  | 约每年             |
| never   | 归档、基本不变     |

**注意**：这是协议里的提示字段。以 Google 为例，官方文档说明 **不会用 changefreq（以及下面的 priority）来决定抓取频率或排序**；其他爬虫是否参考也不统一。可填作兼容或自研爬虫的提示，但不要指望靠它“控制抓取周期”。

`priority`（可选）
**仅相对同一站点内**其他 URL 的重要程度，浮点数 `0.0–1.0`，协议默认值为 `0.5`。它不是“全互联网排名优先级”，搜索引擎也不一定采用；Google 明确忽略 `priority` 和 `changefreq`。

图片扩展（可选）
在 **某个` <url>` 条目内** 使用 Google 图片扩展：`<image:image>`，命名空间一般为 `http://www.google.com/schemas/sitemap-image/1.1`。常见子标签：

| 标签          | 说明                 |
| ------------- | -------------------- |
| image:loc     | 图片 URL（核心字段） |
| image:caption | 图片说明（可选）     |
| image:title   | 图片标题（可选）     |

同一页面多张图可写多个 `<image:image>`

视频扩展（可选）
在 **某个 `<url>` 条目内** 使用 `<video:video>`，命名空间一般为 `http://www.google.com/schemas/sitemap-video/1.1`。面向 **Google 视频索引** 时，除标题、描述、封面外，通常还需要在 `video:content_loc`（媒体直链）与 `video:player_loc`（播放器页）**至少填写其一**（以 [Google 视频站点地图说明](https://developers.google.com/search/docs/crawling-indexing/sitemaps/video-sitemaps) 为准）。

**常用子标签一览**（是否必填随搜索引擎与场景略有差异，下表按常见用法归纳）：

| 标签                        | 常见要求                      | 含义                                       |
| --------------------------- | ----------------------------- | ------------------------------------------ |
| video:title                 | 必填                          | 视频标题                                   |
| video:thumbnail_loc         | 必填                          | 封面图 URL                                 |
| video:description           | 必填                          | 视频文字描述                               |
| video:content_loc           | 常与 player_loc 二选一或并存  | 视频文件地址                               |
| video:player_loc            | 常与 content_loc 二选一或并存 | 可嵌入播放器的页面 URL                     |
| video:duration              | 可选                          | 时长（秒）                                 |
| video:expiration_date       | 可选                          | 过期时间（W3C Datetime）                   |
| video:rating                | 可选                          | 评分                                       |
| video:view_count            | 可选                          | 播放次数                                   |
| video:publication_date      | 可选                          | 首次发布时间                               |
| video:family_friendly       | 可选                          | yes / no                                   |
| video:restriction           | 可选                          | 允许 / 禁止的国家或地区代码                |
| video:platform              | 可选                          | 允许 / 禁止的平台（如 web / mobile）       |
| video:requires_subscription | 可选                          | yes / no                                   |
| video:uploader              | 可选                          | 上传者信息（可用属性 info 等，见官方文档） |
| video:live                  | 可选                          | 是否直播：yes / no                         |
| video:tag                   | 可选                          | 标签                                       |

生成的基本结构如下:

在我们编写完`sitemap.ts`文件之后，Next.js会自动生成一个`sitemap.xml`文件。

```xml
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
  xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"
>
  <url>
    <loc>https://example.com</loc>
    <image:image>
      <image:loc>https://example.com/images/cover.jpg</image:loc>
    </image:image>
    <lastmod>2026-04-19T20:21:06.903Z</lastmod>
    <changefreq>yearly</changefreq>
    <priority>1</priority>
  </url>
  <url>
    <loc>https://example.com/about</loc>
    <video:video>
      <video:title>视频标题</video:title>
      <video:thumbnail_loc>https://example.com/images/video-cover.jpg</video:thumbnail_loc>
      <video:description>视频描述</video:description>
      <video:content_loc>https://example.com/videos/demo.mp4</video:content_loc>
      <video:duration>100</video:duration>
      <video:publication_date>2026-04-20T04:21:06+08:00</video:publication_date>
    </video:video>
    <lastmod>2026-04-19T20:21:06.903Z</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://example.com/blog</loc>
    <lastmod>2026-04-19T20:21:06.903Z</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>
```

#### Next.js中实现sitemap.xml

我们使用的是`AppRouter`，所以直接在app目录下创建一个`sitemap.ts`文件即可。

```ts
import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://example.com",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 1,
      images: ["https://example.com/images/cover.jpg"],
    },
    {
      url: "https://example.com/about",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
      videos: [
        {
          thumbnail_loc: "https://example.com/images/video-cover.jpg",
          title: "视频标题",
          description: "视频描述",
          content_loc: "https://example.com/videos/demo.mp4",
          duration: 100,
          publication_date: new Date(),
        },
      ],
    },
    {
      url: "https://example.com/blog",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];
}
```

#### 进阶用法：拆成多个 sitemap（`generateSitemaps`）

单文件 `app/sitemap.ts` 适合 URL 数量较少的情况。页面很多时（例如文章、商品各自成千上万条），更常见的做法是 **拆成多个 sitemap 文件**：既符合 [Sitemap 协议](https://www.sitemaps.org/protocol.html) 的实践，也便于控制单次生成的体积（例如 Google 建议 **每个 sitemap 最多约 5 万条 URL**）。

在 App Router 里可以这样做（摘自 [Next.js 文档：Generating multiple sitemaps](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap#generating-multiple-sitemaps)）：

1. 仍在 `app` 目录下使用 `sitemap.ts` / `sitemap.js`（或与 `sitemap.xml` 二选一，按项目约定）。
2. 额外导出 `generateSitemaps`：返回一组带 `id` 的对象，每个 `id` 对应一份子 sitemap。
3. 默认导出的 `sitemap` **函数**会带上当前这份子图的 `id`，你根据 `id` 去查库或拼不同前缀的路径即可。

**如何访问**

1. 子站点地图地址形如：`/sitemap/{id}.xml`，其中 `{id}` 与 `generateSitemaps()` 里返回的 `id` 一致（例如 `id: 1` → 浏览器打开 `http://localhost:3000/sitemap/1.xml`）。Next.js 16 中，默认导出的 `sitemap` 函数接收的 `id` 是一个解析为字符串的 Promise。
2. 若文件放在嵌套路由下（例如 `app/products/sitemap.ts`），则前缀会带上段路径，形如 `/products/sitemap/{id}.xml`（见 [generateSitemaps](https://nextjs.org/docs/app/api-reference/functions/generate-sitemaps) 文档中的 URL 说明）。
3. `generateSitemaps` 会生成各个子 sitemap 路径，但不应假定框架一定额外生成 `/sitemap.xml` 索引。若搜索平台需要统一入口，应自行提供 sitemap index，或分别提交生成的子 sitemap URL。

### TDK

TDK 是` Title`、`Description`、`Keywords` 的缩写，是 SEO（搜索引擎优化）里的**核心元**信息，也常统称为页面的元数据。

在原生 HTML 里，它们大致对应 `<head>` 中的 `<title>`、`<meta name="description">`、`<meta name="keywords">` 等。使用 **App Router** 时，Next.js 通过 `export const metadata` 或 `generateMetadata` 生成上述标签，由框架写入文档头部，无需手写整段 `<head>`。

#### TDK 的作用

`title`：页面标题通常会出现在浏览器标签页，也可能作为搜索结果标题。它会影响用户是否点击，但搜索引擎可能根据查询和页面内容改写展示标题。建议简洁、准确，并体现当前页与站点或栏目的关系。

`description`: description 是页面摘要，常被用作 SERP 中的描述文案（搜索引擎也可能根据内容自行改写）。应用一两句话概括页面价值，**避免堆砌关键词**。

`keywords`: keywords 用于概括页面主题。主流搜索引擎对 `<meta name="keywords">` 的排序权重已很低，但**规范填写**仍有利于内部归类、CMS 或后续扩展；不要为 SEO 而重复、堆砌无意义词组。

#### 书写上的小建议（实践向）

- **title**：不同页面应有区分度；全站共用的后缀可通过根布局的 `title.template` 统一拼接。
- **description**：长度适中即可（常见建议约 150 字以内作参考），重点写清「这一页解决什么问题」。
- **keywords**：用数组表达多个词即可，与页面内容一致即可。

#### Next.js 中如何配置 TDK

我们使用 **App Router**，一般在 `app` **目录下的根布局** `layout.tsx` 中导出 `metadata`，作为全站默认 TDK；子路由下的 `layout.tsx` / `page.tsx` 若再次导出 `metadata`，会对父级进行**覆盖或按字段合并**（例如子页面的 `title` 会覆盖继承来的默认标题，具体以 [Metadata文档](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)为准）。

`metadata` 为**静态对象**，适合不依赖请求参数、不依赖异步接口数据的场景。

```tsx
// app/layout.tsx
import type { Metadata } from "next"; // 引入 Metadata 类型

// 导出的名字 必须为 metadata
export const metadata: Metadata = {
  title: "这里是标题",
  description: "这里是详细描述",
  keywords: ["关键词1", "关键词2"],
};
```

如果需要为子路由自定义元数据，可以在对应的 `layout.tsx` 或 `page.tsx` 中再次导出。元数据按路由段从根到叶进行浅合并：未设置的顶层字段会继承；一旦子级设置 `openGraph`、`robots` 等嵌套对象，该对象会整体替换父级同名对象，而不是逐个子字段深度合并。

根布局里还可以用 `title.default` + `title.template`，让子页面只写短标题、全站自动带上后缀(模版 后缀)

```tsx
// app/layout.tsx
export const metadata: Metadata = {
  title: {
    default: "默认标题",
    template: "%s | 默认标题",
  },
  description: "默认标题描述",
  keywords: ["关键词1", "关键词2"],
};
```

子页面写 `title: '首页'` 时，在支持模板合并的情况下，浏览器标题可呈现为 `首页 | 默认标题`。

```tsx
// app/home/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "首页",
  description: "首页描述",
  keywords: ["关键词1", "关键词2"],
};

export default function Page() {
  return <div>首页</div>;
}
```

#### 动态编写

当标题、描述等需要依赖 **动态路由参数**、**查询参数** 或 **接口** / **数据库** 时，在对应 `page.tsx`（或 `layout.tsx`）中导出异步函数 `generateMetadata`，返回 `Metadata` 对象即可。它在服务端执行，可与页面数据使用同一套请求逻辑（注意缓存与性能，必要时配合 `fetch` 的缓存选项或数据层）。

1. 必须导出一个函数
2. 服务器组件可以使用, 客户端组件不可以使用

参数说明:

第一个参数 props:

- `params`：动态路由段，例如 `app/posts/[id]/page.tsx` 中的 `id`。
- `searchParams`：当前 URL 的查询参数，例如 `?id=123`。

第二个参数 parent: 类型为 ResolvingMetadata，表示父级布局已解析的 metadata。await parent 后可用于拼接标题、继承 openGraph 图片等。

```tsx
// app/posts/[id]/page.tsx
import type { Metadata, ResolvingMetadata } from "next";

type Props = {
  params: Promise<{ id: string }>; // 动态路由参数 [id]
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>; // ?a=1&b=2
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { id } = await params;
  const resolvedParent = await parent;

  const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`);
  if (!res.ok) {
    return { title: "文章未找到" };
  }
  const data = await res.json();

  return {
    title: data.title,
    description: data.body.slice(0, 150),
    openGraph: {
      images: resolvedParent.openGraph?.images ?? [],
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  return <div>文章 id：{id}</div>;
}
```

### JSON-LD

JSON-LD（`JSON for Linked Data`）是一种用于表达结构化数据的 JSON 格式。它能**帮助搜索引擎**和 **AI** 更准确理解页面内容（例如商品、文章、组织、人物、活动等实体），从而提升页面在检索系统中的可理解性。

在 Next.js（App Router）里，推荐在 `layout.tsx` 或 `page.tsx` 中，直接输出一个原生 `<script type="application/ld+json">` 标签来注入 JSON-LD。

#### JSON-LD 的基础结构

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://example.com/people/zhangsan",
  "name": "张三",
  "age": 25
}
```

字段说明：

- `@context`：通常使用 `https://schema.org`
- `@type`：实体类型（如 `Product`、`Article`、`Organization`）更多类型请[查看文档](https://schema.org/docs/full.html)
- `@id`：唯一标识符，通常是实体的URL
- 其他字段：请根据文档填写例如Person `https://schema.org/Person` 网站是什么`type`你就把链接后面的值换成你对应的`type`即可

#### 在 Next.js 中添加 JSON-LD

```tsx
// app/products/[id]/page.tsx
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.image,
    description: product.description,
  };

  return (
    <section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <h1>{product.name}</h1>
    </section>
  );
}
```

#### 为什么要做 `.replace(/</g, '\\u003c')`

`JSON.stringify` 本身不会自动处理所有潜在注入风险。当结构化数据里包含不可信字符串时，建议至少将 `<` 替换为 `\u003c`，降低 XSS 注入风险。

```tsx
JSON.stringify(jsonLd).replace(/</g, "\\u003c");
```

如果团队有统一的安全 JSON 序列化方案，也可以使用经过审计的工具；无论采用哪种方式，都应保证输出仍是合法 JSON，并避免把用户可控内容拼接成脚本文本。

#### TypeScript 类型约束（推荐）

为避免字段名拼错、类型不匹配，建议使用 `schema-dts` 做类型提示：

```tsx
import type { Product, WithContext } from "schema-dts";

const jsonLd: WithContext<Product> = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Next.js Sticker",
  image: "https://nextjs.org/imgs/sticker.png",
  description: "Dynamic at the speed of static.",
};
```

#### 常见问题

1. 用 next/script 还是原生 `<script>`？
   - JSON-LD 不是要执行的脚本代码，而是结构化数据声明。
   - 在这个场景里，官方建议使用原生 `<script type="application/ld+json">`。

2. 放在 `layout.tsx` 还是 `page.tsx`？
   - 放在 `layout.tsx`：适合站点级、栏目级的通用结构化数据
   - 放在 `page.tsx`：适合文章、商品详情这类强依赖当前页面数据的实体

3. 如何验证配置是否有效？可使用以下工具进行校验：
   - Google Rich Results Test：检查可用于 Google 富结果的结构化数据
   - Schema Markup Validator：通用 Schema.org 结构校验

#### 实践建议

- 使用与页面真实内容一致的字段，避免“标注内容”和“页面内容”不一致
- 动态页面优先在服务端生成 JSON-LD，保证首屏 HTML 可被爬虫读取
- 关键实体（文章、商品、组织）优先完善，再逐步扩展更多 schema 类型

### Open Graph (OG)

**Open Graph** 是 Facebook（现 Meta）提出的一套页面元数据协议，通过 `<meta property="og:*">` 描述标题、描述、封面图、类型等。许多社交平台和通信工具会读取这些标签生成链接卡片；是否支持、如何缓存及展示由各平台决定。OG 主要改善分享呈现，不应直接等同于搜索排名因素。

在 App Router 中，Next.js 通过导出 `metadata` 或 `generateMetadata` 中的 `openGraph` 字段，自动生成对应的 OG 标签，无需手写整段 `<head>`。官方说明见 [Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) 与 [Optimizing Metadata](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)。

#### openGraph 能配置什么

在 `Metadata` 对象里的 `openGraph` 还支持视频、音频、多图、文章发布时间等。常用字段归纳如下：

| **配置项**              | **典型用途**                                          |
| ----------------------- | ----------------------------------------------------- |
| `title` / `description` | 卡片标题与摘要（可与页面 TDK 一致或单独优化分享文案） |
| `url`                   | 规范链接，建议与当前页可访问 URL 一致                 |
| `siteName`              | 站点名称                                              |
| `images`                | 预览图（可多图）；常配宽高与 alt                      |
| `videos` / `audio`      | 富媒体预览（需绝对 URL）                              |
| `locale`                | 语言区域，如 en_US                                    |
| `type`                  | 资源类型，如 website；文章常用 article                |

```tsx
// app/layout.tsx 或任意 page.tsx / layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  openGraph: {
    title: "Next.js",
    description: "The React Framework for the Web",
    url: "https://nextjs.org",
    siteName: "Next.js",
    images: [
      {
        url: "https://nextjs.org/og.png",
        width: 800,
        height: 600,
      },
      {
        url: "https://nextjs.org/og-alt.png",
        width: 1800,
        height: 1600,
        alt: "My custom alt",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};
```

如何用代码实现:

```tsx
import type { Metadata } from "next";

// 名字必须是metadata
export const metadata: Metadata = {
  metadataBase: new URL("https://acme.com"),
  openGraph: {
    title: "Acme",
    description: "Acme is a company that makes things.",
    type: "website",
    url: "https://xxx.com",
    images: "/og-image.png",
  },
};
```

> Open Graph 官网与 type 去哪查

如果你想确认协议原文或查 `og:type` 的语义，优先看 `Open Graph` 官方站点：

- 协议首页：[`ogp.me`](https://ogp.me/)
- type 说明与扩展类型入口：[`ogp.me/#types`](https://ogp.me/#types)
- 已定义的对象类型列表（如 `website`、`article`、`video.movie` 等）：[ogp.me/#structured](https://ogp.me/#structured)

在 Next.js 项目里，`openGraph.type` 还受 Next 的 TypeScript 类型约束。你可以通过两种方式确认当前版本支持的值：

- 查看 Next.js 文档中的 openGraph 字段示例与说明：[generateMetadata#opengraph](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#opengraph)
- 在编辑器里把鼠标悬停到 `Metadata['openGraph']['type']`（或跳转到 `next` 包类型定义）查看联合类型，以项目安装的 Next 版本为准。

#### 动态路由：`generateMetadata` 与父级 `images`

详情页等需要按参数拉数据时，使用 `generateMetadata`。第二个参数 `parent` 可拿到父布局已解析的 `metadata`，便于在子页面**追加** OG 图而不是整段覆盖，例如把当前商品图插到继承来的图片列表前面：

```tsx
import type { Metadata, ResolvingMetadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { id } = await params;
  const product = await fetch(`https://api.example.com/products/${id}`).then(
    (r) => r.json(),
  );
  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: product.title,
    openGraph: {
      images: ["/some-specific-page-image.jpg", ...previousImages],
    },
  };
}
```

对相同参数发起的 `fetch` 请求会在 `generateMetadata`、`generateStaticParams`、布局、页面和 Server Components 之间自动记忆化，从而避免同一次渲染链路中的重复请求；使用其他数据客户端时不能自动套用这个结论，可用 React `cache` 等方式显式复用。

#### 基于文件的 OG 图

单独维护「导出里的图片 URL」和「仓库里的真实文件」容易不同步。对 OG 图而言，更省事的做法是使用 **基于文件的 Metadata**，例如在路由段放置 `opengraph-image.png` 或 `opengraph-image.tsx` 动态生成图，由框架生成正确 meta。详见 [opengraph-image](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image)。

#### Open Graph 元数据的继承与覆盖

子路由若导出自己的 `openGraph` 对象，会整体覆盖父级的 `openGraph` 对象；若子段完全不设置 `openGraph`，则继承祖先布局的配置。需要保留父级图片时，应像前面的 `generateMetadata` 示例那样显式合并。具体行为以 [Metadata 字段与继承](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#metadata-fields) 为准。

#### 实践建议

- **一图多用**：分享图尺寸需符合各平台建议（常见如 1200×630 等），并保持主体在安全区内，避免裁切后信息丢失。品牌站也可用苹果这种`方形 Logo 图`，在部分客户端里会以缩略图形式出现。
- **与 TDK 协调**：`openGraph.title` / `openGraph.description` 可与 `metadata.title`、`metadata.description` 相同，也可为分享单独写更「点击率友好」的短文案。
- **验证**：改完后用各平台提供的调试/预览工具（如部分平台提供的 URL 调试器）拉取一次，确认缓存更新后再对外发链接。

### Web Vitals

Web Vitals 是 Google 推出的一套以用户为中心的网页体验指标。核心网页指标（Core Web Vitals）包括 LCP、INP 和 CLS，并会作为 Google 页面体验信号的一部分；高分不能替代内容相关性，也不能保证排名。

#### LCP (Largest Contentful Paint，最大内容绘制时间)

LCP 衡量的是视口内最大内容元素（通常是大图、视频封面或大段文本）完成渲染所需的时间，反映“主要内容何时可见”。

- Good：`≤ 2.5s`
- Needs Improvement：`2.5s ~ 4.0s`
- Poor：> `4.0s`

#### INP（Interaction to Next Paint，交互到下一次绘制）

INP 衡量用户交互（点击、输入、键盘操作）到页面下一次可见更新之间的延迟，反映整体交互流畅度。

- Good：`≤ 200ms`
- Needs Improvement：`200ms ~ 500ms`
- Poor：> `500ms`

#### CLS（Cumulative Layout Shift，累积布局偏移）

CLS 衡量页面在生命周期内发生的意外布局位移总量，反映视觉稳定性。比如图片未预留尺寸、异步内容插入导致页面“跳动”。

- Good：`≤ 0.1`
- Needs Improvement：`0.1 ~ 0.25`
- Poor：> `0.25`

#### 如何测评

可以使用 Chrome DevTools 的 Lighthouse 面板快速进行本地评估：

1. 打开 DevTools，进入 Lighthouse 面板。
2. 选择设备（移动端/桌面端）与检测类别（建议勾选 Performance 和 SEO）。
3. 点击“分析网页加载情况”生成报告。
4. 在报告中查看 LCP、CLS 等核心指标分数与诊断建议。

这些阈值通常按真实用户访问数据的第 75 百分位评估，并同时关注移动端与桌面端。Lighthouse 是单次实验室测试，不能直接测得真实用户的 INP；生产评估还应结合 Chrome UX Report、PageSpeed Insights 或自己的 RUM 数据。

#### 代码示例

安装: `npm install web-vitals`

下面示例展示在 Next.js 客户端中订阅 Web Vitals 指标并输出到控制台（可替换为埋点上报逻辑）：

```tsx
"use client";

import { useEffect } from "react";
import { onCLS, onFCP, onINP, onLCP, type Metric } from "web-vitals";

function reportWebVital(metric: Metric) {
  // 生产环境中建议上报到日志系统或分析平台
  console.log("[WebVitals]", metric.name, metric.value, metric.rating);
}

export default function HomePage() {
  useEffect(() => {
    onCLS(reportWebVital);
    onFCP(reportWebVital);
    onINP(reportWebVital);
    onLCP(reportWebVital);
  }, []);

  return (
    <section>
      <button type="button">点击交互</button>
      <div>你已经进入 Home 页面</div>
    </section>
  );
}
```

## ORM (Prisma 7.8.x)

ORM（Object-Relational Mapping，对象关系映射）在应用对象与关系数据库表之间建立映射，让开发者通过类型化 API 完成常见查询和 CRUD。ORM 通常会生成并执行 SQL，但不会消除理解表结构、索引、事务、约束和查询性能的必要性，也不等同于所有操作都采用传统“面向对象”写法。

### 安装

1. 安装 Prisma CLI：`pnpm add -D prisma dotenv @types/pg`
2. 安装 Prisma Client、PostgreSQL 驱动适配器和驱动：`pnpm add @prisma/client @prisma/adapter-pg pg argon2 zod`
3. 初始化 Prisma：`pnpm dlx prisma init`。Prisma 7 项目使用 `prisma/schema.prisma` 描述数据模型，并通过根目录的 `prisma.config.ts` 配置数据库连接和迁移路径。
4. 打开`prisma/schema.prisma`文件，添加以下内容：

```prisma
generator client {
  provider = "prisma-client" //使用什么客户端
  output   = "../src/generated/prisma" //生成客户端代码的目录
}

datasource db {
  provider = "postgresql" //连接什么数据库
}

model User {
  id        String   @id @default(cuid()) //主键
  name      String //用户名
  email     String   @unique //邮箱
  passwordHash String //密码哈希，不保存明文密码
  createdAt DateTime @default(now()) //创建时间
  updatedAt DateTime @updatedAt //更新时间
  posts     Post[] //关联文章
}

model Post {
  id        String   @id @default(cuid()) //主键
  title     String //标题
  content   String //内容
  createdAt DateTime @default(now()) //创建时间
  updatedAt DateTime @updatedAt //更新时间
  authorId  String //作者ID
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade, onUpdate: Cascade) //一对多关联
}
```

- `@id`: 主键对应sql语句的`PRIMARY KEY`
- `@default(cuid())`：由 Prisma 生成字符串 ID。它与数据库自增整数都可用于自动生成主键，但格式、排序特性和生成位置并不相同
- `@unique`: 唯一约束对应sql语句的`UNIQUE`
- `@relation`: 一对多关联对应sql语句的`FOREIGN KEY`
- `@relation(fields: [authorId], references: [id],onDelete: Cascade,onUpdate: Cascade)`: 一对多关联对应sql语句的`FOREIGN KEY`
- `@default(now())`: 默认生成当前时间 类似于sql语句的`CURRENT_TIMESTAMP`
- `@updatedAt`：通过 Prisma ORM 自动写入记录更新时间；它不一定对应数据库原生的 `ON UPDATE CURRENT_TIMESTAMP`
- `onDelete: Cascade`: 级联删除(表示删除主表的时候，从表也删除)
- `onUpdate: Cascade`: 级联更新(表示更新主表的时候，从表也更新)

5. 在项目根目录的 `.env` 中设置连接字符串：`DATABASE_URL="postgresql://username:password@localhost:5432/mydb?schema=public"`。不要提交包含真实凭据的 `.env`。

- `postgresql`: 数据库类型
- `username`: 用户名
- `password`: 密码
- `localhost`: 主机名
- `5432`: 端口号
- `mydb`: 数据库名
- `schema=public`: 模式

同时在 `prisma.config.ts` 中让 Prisma CLI 读取该连接字符串：

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

6. 在开发环境创建并执行数据库迁移：

```sh
pnpm dlx prisma migrate dev --name init
```

该命令会在 `prisma/migrations` 下生成迁移目录和 SQL，并应用到开发数据库。生产环境应审查并提交迁移文件，再使用 `prisma migrate deploy`，不要在生产数据库上运行 `migrate dev`。

7. 执行生成客户端代码命令：

```sh
# 生成路径由 schema.prisma 中 generator.output 决定
pnpm dlx prisma generate
```

### 编写CRUD

```ts
// src/lib/prisma.ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("缺少 DATABASE_URL 环境变量");
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
```

开发模式热更新可能重复执行模块。把客户端缓存在 `globalThis` 上，可以避免每次热更新都创建新的连接池；生产进程仍只创建当前模块实例。

```ts
// src/app/api/users/route.ts
import argon2 from "argon2";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const createUserSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email(),
  password: z.string().min(12).max(128),
});

const updateUserSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().trim().min(1).max(100).optional(),
    email: z.email().optional(),
    password: z.string().min(12).max(128).optional(),
  })
  .refine(
    ({ name, email, password }) =>
      name !== undefined || email !== undefined || password !== undefined,
    { message: "至少提供一个需要更新的字段" },
  );

const deleteUserSchema = z.object({ id: z.string().min(1) });

async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function handleDatabaseError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json({ message: "邮箱已存在" }, { status: 409 });
    }
    if (error.code === "P2025") {
      return NextResponse.json({ message: "用户不存在" }, { status: 404 });
    }
  }

  console.error(error);
  return NextResponse.json({ message: "服务器内部错误" }, { status: 500 });
}

export async function GET() {
  const users = await prisma.user.findMany({ select: publicUserSelect });
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const parsed = createUserSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "请求数据不合法", errors: z.flattenError(parsed.error) },
      { status: 400 },
    );
  }

  try {
    const { password, ...profile } = parsed.data;
    const user = await prisma.user.create({
      data: {
        ...profile,
        passwordHash: await argon2.hash(password),
      },
      select: publicUserSelect,
    });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return handleDatabaseError(error);
  }
}

export async function PATCH(request: NextRequest) {
  const parsed = updateUserSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "请求数据不合法", errors: z.flattenError(parsed.error) },
      { status: 400 },
    );
  }

  const { id, name, email, password } = parsed.data;
  const data: Prisma.UserUpdateInput = {};
  if (name !== undefined) data.name = name;
  if (email !== undefined) data.email = email;
  if (password !== undefined) data.passwordHash = await argon2.hash(password);

  try {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: publicUserSelect,
    });
    return NextResponse.json(user);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const parsed = deleteUserSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ message: "请求数据不合法" }, { status: 400 });
  }

  try {
    const user = await prisma.user.delete({
      where: { id: parsed.data.id },
      select: publicUserSelect,
    });
    return NextResponse.json(user);
  } catch (error) {
    return handleDatabaseError(error);
  }
}
```

该示例只演示数据校验、密码哈希和 Prisma CRUD。真实接口还必须根据业务加入认证、对象级授权、限流、审计日志，以及使用 Cookie 身份认证时的 CSRF 防护。不要向客户端返回密码或密码哈希。

创建`index.http`文件, 使用`REST Client`测试接口

```http
### 创建用户
POST http://localhost:8888/api/users
Content-Type: application/json

{
    "name": "test",
    "email": "1test@test.com",
    "password": "a-strong-passphrase"
}

### 查询所有用户
GET http://localhost:8888/api/users


### 更新用户
PATCH http://localhost:8888/api/users
Content-Type: application/json

{
    "id": "cmkyoxflr00004ck82ywc6joi",
    "name": "xiaoman",
    "email": "xiaoman@example.com",
    "password": "another-strong-passphrase"
}

### 删除用户
DELETE http://localhost:8888/api/users
Content-Type: application/json

{
    "id": "cmkyoxflr00004ck82ywc6joi"
}
```
