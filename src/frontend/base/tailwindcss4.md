# Tailwind CSS 4

## 使用 Tailwind CSS 构建基础界面

### 个人信息卡片

```vue
<template>
  <div class="justify-center items-center flex h-screen bg-sky-100">
    <div>
      <div class="bg-gray-100 rounded-lg shadow-lg p-8">
        <img
          src="https://i.pravatar.cc/100"
          class="w-24 h-24 rounded-full mx-auto mb-4"
          alt="头像"
        />
        <h2 class="text-center text-xl font-bold">张三</h2>
        <p class="mb-2 text-center text-gray-400">前端开发工程师</p>
        <div class="flex justify-center gap-2 mb-4">
          <span class="bg-blue-100 text-blue-600 text-xs px-3 py-1 rounded-full"
            >React</span
          >
          <span
            class="bg-green-100 text-green-600 text-xs px-3 py-1 rounded-full"
            >Tailwind</span
          >
          <span
            class="bg-purple-100 text-purple-600 text-xs px-3 py-1 rounded-full"
            >Node.js</span
          >
        </div>
        <button
          type="button"
          class="bg-blue-500 text-white px-4 py-2 hover:bg-blue-600 rounded-lg w-full"
        >
          Follow
        </button>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup></script>
<style scoped></style>
```

### 登录表单

```vue
<template>
  <div class="flex justify-center items-center bg-gray-100 min-h-screen">
    <form
      @submit.prevent
      class="w-full max-w-md flex bg-gray-100 rounded-2xl shadow-lg p-10 flex-col"
    >
      <div>
        <h2 class="text-2xl font-bold text-gray-800 mb-2">欢迎回来</h2>
        <p class="text-gray-400 text-sm mb-8">请登录您的账户</p>
      </div>
      <div>
        <div>
          <div class="mb-4">
            <label
              class="block mr-2 text-sm font-medium text-gray-700 mb-1"
              for="email"
              >邮箱</label
            >
            <input
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="email"
              id="email"
              placeholder="your@email.com"
            />
          </div>
          <div class="mb-6">
            <label
              class="block mr-2 text-sm font-medium text-gray-700 mb-1"
              for="password"
              >密码</label
            >
            <input
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="password"
              id="password"
              placeholder="******"
            />
          </div>
          <button
            type="submit"
            class="bg-blue-500 text-white px-4 py-2 hover:bg-blue-600 rounded-lg w-full"
          >
            登录
          </button>
          <p class="text-center text-sm text-gray-400 mt-6">
            没有账号？
            <a href="#" class="text-blue-500 hover:underline">立即注册</a>
          </p>
        </div>
      </div>
    </form>
  </div>
</template>
<script lang="ts" setup></script>
<style scoped></style>
```

### 响应式导航页面

```vue
<template>
  <div class="flex justify-between items-center px-6 py-3 bg-gray-50 shadow-md">
    <div class="text-xl font-bold text-blue-600">MyBrand</div>
    <ul class="gap-8 text-gray-700 hidden md:flex text-sm">
      <li class="hover:text-blue-500"><a href="#">首页</a></li>
      <li class="hover:text-blue-500"><a href="#">关于</a></li>
      <li class="hover:text-blue-500"><a href="#">服务</a></li>
      <li class="hover:text-blue-500"><a href="#">联系</a></li>
    </ul>
    <div>
      <button
        type="button"
        class="text-white bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg transition hidden md:block"
      >
        开始使用
      </button>
      <!-- 移动端菜单图标 -->
      <button
        type="button"
        class="md:hidden text-gray-600 text-2xl"
        aria-label="打开导航菜单"
      >
        ☰
      </button>
    </div>
  </div>
  <div class="flex justify-center items-center h-screen text-gray-400">
    页面内容区域
  </div>
</template>
<script lang="ts" setup></script>
<style scoped></style>
```

## Tailwind CSS 的响应式系统

### 核心概念：移动优先

Tailwind 采用 **Mobile First（移动优先）** 策略：

- **不加前缀**：在所有视口宽度下生效，通常作为基础样式
- **加断点前缀**：从该最小宽度开始生效，并持续影响更宽的视口，除非后续规则再次覆盖

```html
<!-- 所有宽度先使用小字号，达到 md 断点后改用大字号 -->
<p class="text-sm md:text-xl">你好</p>
```

---

### 断点对照表

| 前缀   | 默认最小宽度        | 含义                       |
| ------ | ------------------- | -------------------------- |
| 无前缀 | 无最小宽度          | 基础样式，适用于所有宽度   |
| `sm:`  | `40rem`（约 640px） | 从 `sm` 断点开始           |
| `md:`  | `48rem`（约 768px） | 从 `md` 断点开始           |
| `lg:`  | `64rem`（约 1024px）| 从 `lg` 断点开始           |
| `xl:`  | `80rem`（约 1280px）| 从 `xl` 断点开始           |
| `2xl:` | `96rem`（约 1536px）| 从 `2xl` 断点开始          |

这里的像素值按根元素字号为 `16px` 换算。断点表示视口宽度阈值，不等同于手机、平板或电脑等具体设备；同一设备的窗口宽度、缩放和方向都可能变化。Tailwind CSS 4 还可以通过 `@theme` 中的 `--breakpoint-*` 主题变量自定义断点。

---

### 常见响应式用法

1. 文字大小

```html
<h1 class="text-base sm:text-lg md:text-2xl lg:text-4xl font-bold">
  响应式标题
</h1>
```

2. 显示 / 隐藏

```html
<!-- 低于 md 隐藏，达到 md 后显示 -->
<div class="hidden md:block">电脑端才显示</div>

<!-- 低于 md 显示，达到 md 后隐藏 -->
<div class="block md:hidden">手机端才显示</div>
```

3. 列数变化（最常用）

```html
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <div class="bg-blue-200 p-4 rounded">卡片 1</div>
  <div class="bg-blue-200 p-4 rounded">卡片 2</div>
  <div class="bg-blue-200 p-4 rounded">卡片 3</div>
  <div class="bg-blue-200 p-4 rounded">卡片 4</div>
</div>
```

```
基础样式：1 列
sm 及以上：2 列
lg 及以上：4 列
```

4. 排列方向变化

```html
<!-- 基础样式竖排，达到 md 后横排 -->
<div class="flex flex-col md:flex-row gap-4">
  <div class="bg-red-200 p-4 flex-1">左边</div>
  <div class="bg-blue-200 p-4 flex-1">右边</div>
</div>
```

5. 间距响应式

```html
<div class="p-4 md:p-8 lg:p-16">内容区域</div>
```

---

### 完整实战案例：响应式卡片页面

```html
<!DOCTYPE html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!-- Play CDN 只适合学习和开发演示，不用于生产部署 -->
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  </head>
  <body class="bg-gray-100 p-4 md:p-8">
    <!-- 标题 -->
    <h1 class="text-xl md:text-3xl font-bold text-center text-gray-800 mb-6">
      我的作品集
    </h1>

    <!-- 卡片网格：基础 1 列 → md 以上 2 列 → lg 以上 3 列 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- 卡片 -->
      <div class="bg-white rounded-xl shadow p-6">
        <div class="bg-blue-100 h-36 rounded-lg mb-4"></div>
        <h2 class="text-lg font-semibold text-gray-800">项目一</h2>
        <p class="text-sm text-gray-500 mt-1">
          这是项目描述，简单介绍一下内容。
        </p>
        <button
          class="mt-4 bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-lg w-full transition"
        >
          查看详情
        </button>
      </div>

      <div class="bg-white rounded-xl shadow p-6">
        <div class="bg-green-100 h-36 rounded-lg mb-4"></div>
        <h2 class="text-lg font-semibold text-gray-800">项目二</h2>
        <p class="text-sm text-gray-500 mt-1">
          这是项目描述，简单介绍一下内容。
        </p>
        <button
          class="mt-4 bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg w-full transition"
        >
          查看详情
        </button>
      </div>

      <div class="bg-white rounded-xl shadow p-6">
        <div class="bg-purple-100 h-36 rounded-lg mb-4"></div>
        <h2 class="text-lg font-semibold text-gray-800">项目三</h2>
        <p class="text-sm text-gray-500 mt-1">
          这是项目描述，简单介绍一下内容。
        </p>
        <button
          class="mt-4 bg-purple-500 hover:bg-purple-600 text-white text-sm px-4 py-2 rounded-lg w-full transition"
        >
          查看详情
        </button>
      </div>
    </div>
  </body>
</html>
```

### 记忆要点

```
无前缀 → 所有宽度的基础样式
sm:    → 40rem 及以上
md:    → 48rem 及以上
lg:    → 64rem 及以上
xl:    → 80rem 及以上
2xl:   → 96rem 及以上
```

> Tailwind 的断点体系采用移动优先思路。通常先写适合窄视口的基础样式，再按内容和布局需要逐步覆盖更宽视口；断点应依据界面何时需要调整来选择，而不是按设备名称机械套用。

## 参考资料

- [Tailwind CSS：响应式设计](https://tailwindcss.com/docs/responsive-design)
- [Tailwind CSS：Play CDN](https://tailwindcss.com/docs/installation/play-cdn)

---

## 状态变体、主题与样式复用

### Hover / Focus / Active

```html
<button
  type="button"
  class="
  bg-blue-500 
  hover:bg-blue-700 
  focus:ring-4 
  active:scale-95 
  transition duration-200
"
>
  点击我
</button>
```

---

### 表单状态

```html
<input
  type="email"
  required
  class="
  border border-gray-300
  focus:border-blue-500
  focus:ring-2
  disabled:bg-gray-100
  disabled:cursor-not-allowed
  invalid:border-red-500
"
/>
```

---

### Group Hover（父元素悬停影响子元素）

```html
<div class="group bg-white hover:bg-blue-500 p-6 rounded-xl cursor-pointer">
  <h2 class="text-gray-800 group-hover:text-white font-bold">标题</h2>
  <p class="text-gray-400 group-hover:text-blue-100 text-sm">描述文字</p>
</div>
```

---

### 暗黑模式（Dark Mode）

Tailwind CSS 4 默认根据 `prefers-color-scheme` 应用 `dark:*` 变体。如果希望通过 `.dark` 类手动切换，需要在主样式表中覆盖 `dark` 变体：

```css
/* app.css */
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
```

```html
<div class="bg-white dark:bg-gray-900 text-gray-800 dark:text-white p-6">
  <h1 class="text-xl font-bold">自动适配暗黑模式</h1>
  <p class="text-gray-500 dark:text-gray-400">描述内容</p>
</div>
```

完成上面的 `@custom-variant` 配置后，在祖先元素（通常是 `<html>`）上添加 `class="dark"` 才会启用手动暗色模式。类名由应用代码、用户设置或系统主题决定；只写 `dark:*` 工具类不会自动实现主题切换按钮。

---

### 过渡动画

```html
<button
  class="bg-blue-500 hover:bg-blue-700 hover:scale-105 transition duration-300 ease-in-out"
>
  平滑过渡
</button>
```

---

### 内置动画

```html
<!-- 旋转加载 -->
<div
  class="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
></div>

<!-- 闪烁骨架屏 -->
<div class="animate-pulse bg-gray-200 h-6 w-48 rounded"></div>

<!-- 弹跳 -->
<div class="animate-bounce text-2xl">👇</div>

<!-- 向外扩散并淡出的提示点 -->
<div class="animate-ping w-4 h-4 bg-red-500 rounded-full"></div>
```

| 动画类           | 效果               |
| ---------------- | ------------------ |
| `animate-spin`   | 旋转（加载圈）     |
| `animate-pulse`  | 脉冲（骨架屏）     |
| `animate-bounce` | 弹跳               |
| `animate-ping`   | 扩散（消息提示点） |

---

### 使用 CSS-first 配置自定义主题

Tailwind CSS 4 推荐在 CSS 中使用 `@theme` 定义设计令牌，而不是默认沿用 Tailwind CSS 3 的 `tailwind.config.js` 写法：

```css
/* app.css */
@import "tailwindcss";

@theme {
  --color-brand: #ff6b35;
  --color-dark: #1a1a2e;
  --font-sans: "PingFang SC", "Microsoft YaHei", sans-serif;
  --spacing-section: 32rem;
  --breakpoint-xs: 30rem;
}
```

```html
<div class="bg-brand text-white font-sans xs:p-8 w-section">
  使用自定义颜色、字体、断点和尺寸
</div>
```

主题变量的命名空间决定会生成哪些工具类或变体，例如 `--color-brand` 对应 `bg-brand`、`text-brand` 等颜色工具，`--breakpoint-xs` 对应 `xs:*` 响应式变体。Tailwind CSS 4 仍可通过 `@config` 加载旧版 JavaScript 配置以便迁移，但 CSS-first 是当前推荐方式，且部分旧选项不再受支持。

---

### 任意值（Arbitrary Values）

当默认值不够用时，可以直接写任意值：

```html
<!-- 任意颜色 -->
<div class="bg-[#ff6b35] text-[#1a1a2e]">自定义颜色</div>

<!-- 任意尺寸 -->
<div class="w-[350px] h-[200px] mt-[30px]">自定义尺寸</div>

<!-- 任意网格 -->
<div class="grid grid-cols-[1fr_2fr_1fr]">不均等三列</div>

<!-- 任意字体大小 -->
<p class="text-[13px] leading-[1.8]">精确控制</p>
```

> 方括号 `[]` 用于提供一次性的任意值，但值仍须符合对应 CSS 属性的语法。需要空格时通常用下划线表示，例如 `grid-cols-[1fr_2fr_1fr]`。

---

### 使用@apply复用样式

在 CSS 文件中复用 Tailwind 类，避免重复：

```css
/* styles.css */
.btn-primary {
  @apply bg-blue-500 text-white font-bold py-2 px-4 rounded transition;
}

.btn-primary:hover {
  @apply bg-blue-700;
}

.card {
  @apply bg-white rounded-xl shadow-lg p-6;
}

.input-base {
  @apply w-full border border-gray-300 rounded-lg px-4 py-2;
}

.input-base:focus {
  @apply ring-2 outline-none;
}
```

```html
<!-- HTML 中直接用 -->
<button class="btn-primary">提交</button>
<div class="card">卡片内容</div>
```

在全局样式表中可以直接使用上面的写法。如果在 Vue/Svelte 的组件 `<style>` 或 CSS Modules 中使用 `@apply` 或 `@variant`，Tailwind CSS 4 通常还需要用 `@reference` 引入主样式表或 `tailwindcss`，让该样式上下文能够访问主题和工具类，而不会重复输出 CSS。

---

### Flexbox与Grid工具

Tailwind 为常用 Flexbox 和 Grid 声明提供了工具类；这些工具类最终仍然生成普通 CSS，复杂布局也可以与自定义 CSS 配合使用：

```html
<!-- 水平垂直居中 -->
<div class="flex items-center justify-center h-screen">
  <p>完美居中</p>
</div>

<!-- 自动换行卡片布局 -->
<div class="flex flex-wrap gap-4">
  <div class="flex-1 min-w-[200px] bg-blue-100 p-4 rounded">卡片</div>
  <div class="flex-1 min-w-[200px] bg-green-100 p-4 rounded">卡片</div>
  <div class="flex-1 min-w-[200px] bg-red-100 p-4 rounded">卡片</div>
</div>

<!-- 复杂 Grid 布局 -->
<div class="grid grid-cols-12 gap-4">
  <div class="col-span-8 bg-blue-100 p-4">主内容</div>
  <div class="col-span-4 bg-gray-100 p-4">侧边栏</div>
</div>
```

---

### 按需生成工具类

Tailwind CSS 4 会扫描项目源文件中的类名候选项，并为实际检测到的工具类生成 CSS。它不再需要把这项能力理解成一个可以开关的旧版“JIT 模式”。

```html
<!-- 完整、静态的类名可以被检测 -->
<div class="bg-blue-500 hover:bg-blue-700 w-[350px]"></div>
```

Tailwind 按纯文本扫描源文件，不会执行 JavaScript，也无法可靠理解字符串拼接。不要写 `bg-${color}-500` 之类动态拼接的类名，应把条件映射到完整类名：

```javascript
const colorClasses = {
  blue: "bg-blue-500 hover:bg-blue-700",
  red: "bg-red-500 hover:bg-red-700",
};
```

最终 CSS 大小取决于实际使用的工具类、插件和自定义样式，不能保证固定为某个 KB 数量级。

## 参考资料

- [Tailwind CSS：暗色模式](https://tailwindcss.com/docs/dark-mode)
- [Tailwind CSS：主题变量](https://tailwindcss.com/docs/theme)
- [Tailwind CSS：函数和指令](https://tailwindcss.com/docs/functions-and-directives)
- [Tailwind CSS：检测源文件中的类](https://tailwindcss.com/docs/detecting-classes-in-source-files)

## 1. 修改表单控件的强调色

`accent-*` 工具类对应 CSS 的 `accent-color`，可用于支持该属性的复选框、单选框、范围滑块和进度条：

```html
<label class="flex items-center gap-2">
  <input type="checkbox" class="size-4 accent-pink-500" />
  接收更新通知
</label>
```

它不会替换控件的全部原生样式，只会设置浏览器允许自定义的强调色。

## 2. 使用 `clamp()` 创建流式字号

断点字号适合离散变化；如果希望字号在一段视口范围内连续缩放，可以使用任意值：

```html
<h1 class="text-[clamp(2rem,8vw,4.375rem)] leading-tight font-bold">
  流式标题
</h1>
```

`clamp(最小值, 首选值, 最大值)` 会把计算结果限制在最小值和最大值之间。流式字号仍需结合版式、可读性和用户缩放测试，不能只按视口宽度决定所有文字尺寸。

## 3. 美化文件选择按钮

`file:*` 变体用于设置 `<input type="file">` 的文件选择按钮：

```html
<input
  type="file"
  class="block w-full text-sm text-gray-600
    file:mr-4 file:rounded-full file:border-0
    file:bg-violet-50 file:px-4 file:py-2
    file:text-sm file:font-semibold file:text-violet-700
    hover:file:bg-violet-100"
/>
```

`file:*` 只影响文件选择按钮伪元素，输入框其余区域仍由不带该变体的工具类控制。

## 4. 自定义文本选中样式

`selection:*` 变体用于设置用户选中文本时的前景色和背景色。把它放在祖先元素上，可以让后代文本继承相同的选中样式：

```html
<article class="selection:bg-pink-200 selection:text-pink-900">
  <h2 class="text-2xl font-bold">选择这段文字试试看</h2>
  <p>正文也会使用相同的选中颜色。</p>
</article>
```

## 5. 用状态变体减少简单交互脚本

Tailwind 的 `peer-*`、`group-*` 和 `has-*` 变体可以表达一部分由 CSS 能力覆盖的状态关系。例如，可以根据输入框的原生校验状态显示提示：

```html
<label for="email" class="block text-sm font-medium">邮箱</label>
<input
  id="email"
  type="email"
  required
  placeholder="name@example.com"
  class="peer mt-1 w-full rounded border p-2 invalid:border-red-500"
/>
<p class="invisible mt-1 text-sm text-red-600 peer-invalid:visible">
  请输入有效的邮箱地址。
</p>
```

也可以根据后代控件状态设置父元素：

```html
<label class="flex cursor-pointer items-center gap-3 rounded border p-4 has-checked:border-indigo-600 has-checked:bg-indigo-50">
  <input type="radio" name="plan" class="accent-indigo-600" />
  专业版
</label>
```

这些变体适合悬停、焦点、校验和选择等样式状态，但不会取代表单提交、数据请求、复杂状态机或完整的无障碍交互逻辑。

## 参考资料

- [Tailwind CSS：accent-color](https://tailwindcss.com/docs/accent-color)
- [Tailwind CSS：Hover、Focus 与其他状态](https://tailwindcss.com/docs/hover-focus-and-other-states)
- [Tailwind CSS：添加自定义样式](https://tailwindcss.com/docs/adding-custom-styles)
