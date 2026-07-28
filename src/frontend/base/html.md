# HTML

这里只记录一些常用的HTML标签和属性。具体用法请参考MDN文档。

::: tip MDN文档地址
https://developer.mozilla.org/zh-CN/docs/Web/HTML
:::

## 常用标签

HTML5 语义化标签：HTML5 引入了语义化的标签，如 `<header>`、`<footer>`、`<nav>`、`<article>`、`<section>` 等，这些标签可以更好的描述网页的内容和结构，让网页更易读、更易维护。

### 核心区别总结

| 特性                  | 块级元素               | 行内元素                       |
| --------------------- | ---------------------- | ------------------------------ |
| 是否独占一行          | 是                     | 否，与其他元素共行             |
| 默认宽度              | 撑满父容器 100%        | 由内容决定                     |
| 可设置 width/height   | 是                     | 否（替换元素除外）             |
| 可设置 margin/padding | 上下左右均可           | 只有左右生效（上下不影响布局） |
| 可包含的内容          | 不能仅凭块级表现判断，需遵循具体元素的 HTML 内容模型 | 不能仅凭行内表现判断，需遵循具体元素的 HTML 内容模型 |
| 典型代表              | `<div>`, `<p>`, `<h1>` | `<span>`, `<a>`, `<img>`       |

---

### 块级元素 (Block-level Elements)

| 标签            | 描述                    |
| --------------- | ----------------------- |
| `<div>`         | 通用块级容器            |
| `<p>`           | 段落                    |
| `<h1>` ~ `<h6>` | 标题（1-6级）           |
| `<ul>`          | 无序列表                |
| `<ol>`          | 有序列表                |
| `<li>`          | 列表项                  |
| `<table>`       | 表格                    |
| `<thead>`       | 表格头部                |
| `<tbody>`       | 表格主体                |
| `<tfoot>`       | 表格尾部                |
| `<tr>`          | 表格行                  |
| `<form>`        | 表单                    |
| `<fieldset>`    | 表单字段集合            |
| `<header>`      | 页眉（HTML5）           |
| `<footer>`      | 页脚（HTML5）           |
| `<main>`        | 主内容区（HTML5）       |
| `<section>`     | 区块（HTML5）           |
| `<article>`     | 文章（HTML5）           |
| `<aside>`       | 侧边栏（HTML5）         |
| `<nav>`         | 导航（HTML5）           |
| `<figure>`      | 图文块（HTML5）         |
| `<figcaption>`  | 图文说明（HTML5）       |
| `<blockquote>`  | 块级引用                |
| `<pre>`         | 预格式化文本            |
| `<hr>`          | 水平分隔线              |
| `<address>`     | 联系地址信息            |
| `<details>`     | 可折叠详情块（HTML5）   |
| `<summary>`     | details 的摘要（HTML5） |
| `<dialog>`      | 对话框（HTML5）         |

---

### 行内元素 (Inline Elements)

| 标签         | 描述                 |
| ------------ | -------------------- |
| `<span>`     | 通用行内容器         |
| `<a>`        | 超链接               |
| `<strong>`   | 加粗（语义：重要）   |
| `<b>`        | 加粗（无语义）       |
| `<em>`       | 斜体（语义：强调）   |
| `<i>`        | 斜体（无语义）       |
| `<u>`        | 下划线               |
| `<s>`        | 删除线（过时内容）   |
| `<del>`      | 删除文本（语义）     |
| `<ins>`      | 插入文本（语义）     |
| `<code>`     | 行内代码             |
| `<kbd>`      | 键盘输入             |
| `<samp>`     | 程序输出示例         |
| `<var>`      | 变量                 |
| `<abbr>`     | 缩写                 |
| `<cite>`     | 引用来源             |
| `<q>`        | 行内引用             |
| `<mark>`     | 高亮标记（HTML5）    |
| `<small>`    | 小号文字             |
| `<sub>`      | 下标                 |
| `<sup>`      | 上标                 |
| `<time>`     | 时间（HTML5）        |
| `<label>`    | 表单标签             |
| `<input>`    | 输入框               |
| `<button>`   | 按钮                 |
| `<select>`   | 下拉选择框           |
| `<textarea>` | 多行文本框           |
| `<img>`      | 图片（行内替换元素） |
| `<br>`       | 换行                 |
| `<map>`      | 图像映射             |
| `<script>`   | 脚本（行内/外部）    |

---

### 特殊说明

- **行内块元素 (`inline-block`)**：如 `<img>`、`<input>`、`<button>`，表现为行内但可设置宽高。
- 可通过 CSS `display` 属性随时切换：`display: block` / `display: inline` / `display: inline-block`。
- HTML5 重新定义了内容模型（Content Model），用"流式内容"、"短语内容"等概念替代了传统的块/行内划分，但实际开发中块/行内的概念仍广泛使用。

### 1. 图片 <Badge type="tip" text="单标签 行内块元素" />

图片的属性：

```html
<img src="" alt="" title="" loading="lazy" width="200" height="200" />
```

**懒加载**: loading属性可以实现图片的延迟加载，即当页面滚动到图片所在位置时才加载图片。

::: details 补充知识（相对路径和绝对路径）

- **相对 URL**：如 `./images/a.png`、`../images/a.png`，浏览器会相对于当前文档的基准 URL 解析。
- **根相对 URL**：如 `/images/a.png`，浏览器会从当前网站的源站根路径开始解析，并不是从项目根目录开始。
- **绝对 URL**：如 `https://example.com/images/a.png`，包含完整的协议、域名和路径。
  :::

### 2. 链接 <Badge type="tip" text="行内元素" />

文本超链接和图片超链接

```html
<a
  href="https://www.jetbrains.com/webstorm/"
  target="_blank"
  rel="noopener noreferrer"
  >WebStorm</a
>

<a href="https://www.jetbrains.com/webstorm/">
  <img src="/assert/html-image/网页修复.svg" alt="这是一个图片链接" />
</a>
```

1. target="\_blank"
   这个属性的作用是让点击这个链接后，在新的浏览器标签页（或窗口）中打开链接内容。也就是说，用户点击后不会离开当前页面，而是在新标签页打开目标网页。

2. rel="noopener noreferrer" 这是两个安全相关的属性，合在一起用以增强安全性和隐私保护

   noopener：防止新打开的页面通过 JavaScript 获取到原页面的控制权，避免潜在的安全风险，比如恶意网站控制你的页面。

   noreferrer：不让新页面知道是从哪个页面跳转过来的（不传递“引用”信息），这能保护用户隐私。

这是一个超链接 <a href="https://www.jetbrains.com/webstorm/" target="_blank" rel="noopener noreferrer">WebStorm</a> 结束

这是一个图片超链接<a href="https://www.jetbrains.com/webstorm/" style="display: inline-block;">
<img src="/assert/html-image/网页修复.svg" alt="这是一个图片链接" width="100px" height="100px"/>
</a>
点击图片即可跳转

::: info 注意
可以设置href属性为#，这样可以实现页面的滚动。
:::

### 3. 视频和音频

```html
<video width="320" height="240" controls>
  <source src="movie.mp4" type="video/mp4" />
  <track
    src="subtitles-zh.vtt"
    kind="subtitles"
    srclang="zh"
    label="中文"
    default
  />
</video>

<video src="movie.mp4" controls width="320" height="240">
  <p>Your browser does not support the video element.</p>
</video>

<audio controls>
  <source src="audio.mp3" type="audio/mpeg" />
</audio>
```

- controls：这是一个布尔属性，表示在视频播放器上显示播放控件（如播放、暂停、音量等）。
- autoplay：布尔属性，表示视频自动播放。
- loop：布尔属性，表示视频循环播放。
- muted：布尔属性，表示视频静音播放。
- poster：视频封面的 URL。
- `<track>`：不是 `<video>` 的属性，而是 `<video>` 或 `<audio>` 的子元素；`src` 属性用于指定 WebVTT 字幕文件，`kind`、`srclang`、`label` 和 `default` 用于描述字幕轨道。

### 4. 列表 <Badge type="danger" text="使用频率低" />

```html
<ol type="a">
  <li>第一项</li>
  <li>第二项</li>
</ol>

<ul>
  <li>第1项</li>
  <li>第2项</li>
</ul>

<dl>
  <dt>Java</dt>
  <dd>
    Java
    是一门面向对象编程语言，是静态编译型语言，具有平台独立性，支持多线程、动态绑定、反射、注解、异常处理、数据库访问、JMX
    等特性。
  </dd>
  <dt>Go</dt>
  <dd>Go 语言是 Google 开发的一种静态强类型、编译型、并发型的编程语言。</dd>
  <dt>Python</dt>
  <dd>Python 简洁、易学、功能强大，适合数据分析、Web 开发、机器学习等领域。</dd>
  <dd>Python 还有很多优秀的第三方库，可以帮助你快速开发应用。</dd>
</dl>
```

**实现效果：**

<ol type="a">
  <li>第一项</li>
  <li>第二项</li>
</ol>

<ul>
  <li>第1项</li>
  <li>第2项</li>
</ul>

<dl>
  <dt>Java</dt>
  <dd>Java 是一门面向对象编程语言，是静态编译型语言，具有平台独立性，支持多线程、动态绑定、反射、注解、异常处理、数据库访问、JMX 等特性。</dd>
  <dt>Go</dt>
  <dd>Go 语言是 Google 开发的一种静态强类型、编译型、并发型的编程语言。</dd>
  <dt>Python</dt>
  <dd>Python 简洁、易学、功能强大，适合数据分析、Web 开发、机器学习等领域。</dd>
  <dd>Python 还有很多优秀的第三方库，可以帮助你快速开发应用。</dd>
</dl>

- 有序列表（ol）：type属性可以设置列表的类型，如1、A、a等。
- 无序列表（ul）：无序列表的标记是无序列表符号（如圆点、加号、减号等）。
- 定义列表（dl）：dl 元素用于描述一个术语的定义。

### 5. 表格 <Badge type="danger" text="使用频率低" />

**table属性用CSS写**

```html
<table>
  <thead>
    <tr>
      <th>姓名</th>
      <th>年龄</th>
      <th>性别</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>张三</td>
      <td>20</td>
      <td>男</td>
    </tr>
    <tr>
      <td>李四</td>
      <td>25</td>
      <td>女</td>
    </tr>
  </tbody>
</table>

<table>
  <caption>
    2025年装机清单
  </caption>
  <tr>
    <th>配件名称</th>
    <th>型号</th>
  </tr>
  <tr>
    <td>CPU</td>
    <td>Ultra9 285K</td>
  </tr>
  <tr>
    <td>显卡</td>
    <td>RTX4090</td>
  </tr>
</table>
```

**实现效果：**

<table>
  <thead>
    <tr>
      <th>姓名</th>
      <th>年龄</th>
      <th>性别</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>张三</td>
      <td>20</td>
      <td>男</td>
    </tr>
    <tr>
      <td>李四</td>
      <td>25</td>
      <td>女</td>
    </tr>
  </tbody>
</table>

<hr>

<table>
  <caption>2021年装机清单</caption>
<tbody>
  <tr>
    <th>名称</th>
    <th>型号</th>
  </tr>
  <tr>
    <td>CPU</td>
    <td>Ultra7 265K</td>
  </tr>
  <tr>
    <td>显卡</td>
    <td>RTX5090</td>
  </tr></tbody>
</table>

- 表格（table）：用于呈现数据。
- 表头行组（thead）：用于组织表格的表头行，通常包含由 `<th>` 单元格组成的 `<tr>`。
- 表格行（tr）：包含表格的行。
- 表头单元格（th）：包含表头的单元格。
- 数据单元格（td）：包含数据单元格。
- 表格标题（caption）：用于为整个 `<table>` 提供标题或简短说明，通常放在表格内容的最前面。
- colgroup：用于对表格的列进行分组。
- 表格行组（thead、tbody、tfoot）：分别用于组织表头、表体和表尾中的行；HTML 中不存在 `<rowgroup>` 元素，`rowgroup` 是对应的 ARIA 角色名称。

### 6. 框架和嵌入代码

```html
<div>我是内容</div>
<iframe src="https://www.bilibili.com" width="300" height="300"></iframe>
```

**实现效果：**

<div>我是内容</div>
<iframe
  width="1000"
  height="500"
  src="//player.bilibili.com/player.html?isOutside=true&aid=115841794442308&bvid=BV1z2i4BYEPL&cid=35206138484&p=1"
  style="border: 0"
  allowfullscreen
></iframe>

- 内嵌框架（iframe）：用于在当前页面中嵌入另一个页面。
- `style="border: 0"`：使用 CSS 隐藏 iframe 边框。
- `allowfullscreen`：布尔属性，表示允许 iframe 进入全屏模式。
- `scrolling`、`frameborder`、`border` 和 `framespacing` 均为已废弃的表现属性，不应在现代 HTML 中继续使用。

::: info
可以设引入自己的页面
:::

### 其他标签

- header：用于定义文档的**头部**区域。
- nav：用于定义**导航链接**。
- article：用于定义文档的独立内容块。
- main：用于定义文档的**主体**区域。
- section：用于定义文档中的节（section）。
- aside：用于定义页面的侧边栏。
- footer：用于定义文档的尾部区域。

## 表单

```html
<form>
  <label for="name">Name:</label>
  <input type="text" id="name" name="name" required />
  <label for="email">Email:</label>
  <input type="email" id="email" name="email" required />
  <label for="message">Message:</label>
  <textarea id="message" name="message" required></textarea>
  <input type="submit" value="Submit" />
</form>

<form action="/login" method="post">
  <label>电子邮件：<input name="username" type="email" required /></label>
  <label>密码：<input name="password" type="password" required /></label>
  <button type="submit">提交</button>
  <button type="reset">重置</button>
</form>
```

- form：用于创建表单。
- input：用于创建输入框。
  - value：用于设置输入框的默认值。
  - maxlength：用于设置输入框的最大长度。
  - **placeholder**：用于设置输入框的提示文字。
  - disabled：用于禁用输入框。
  - required：用于设置输入框为必填项。
  - **type**：用于设置输入框的类型。

### 1.日期选择 <Badge type="tip" text="了解即可" />

```html
<form>
  <input type="date" />
</form>
```

### 2.数字 <Badge type="tip" text="了解即可" />

```html
<form>
  <input type="number" min="1" max="10" step="2" />
</form>
```

### 3.单选框和多选框

```html
<form>
  <div>选择性别：</div>
  <input type="radio" name="gender" value="male" checked /> 男
  <input type="radio" name="gender" value="female" /> 女
  <input type="submit" />
</form>

<form>
  <div>选择兴趣：</div>
  <input type="checkbox" name="interest" value="reading" /> 阅读
  <input type="checkbox" name="interest" value="swimming" /> 游泳
  <input type="checkbox" name="interest" value="hiking" /> 滑雪
  <input type="submit" />
</form>
```

- name 用于设置单选框或多选框的名称和分组
- checked：布尔属性，用于设置单选框或复选框的初始选中状态；表单提交的值仍由 value 决定。
- value 用于设置值

### 4.下拉列表

```html
<form>
  <label for="cars">选择汽车：</label>
  <select id="cars" name="cars">
    <option value="volvo">Volvo</option>
    <option value="saab">Saab</option>
    <option value="mercedes">Mercedes</option>
    <option value="audi">Audi</option>
  </select>
  <input type="submit" />
</form>
```

- select：用于创建下拉列表。
- option：用于创建下拉列表的选项。
- selected：`<option>` 的布尔属性，用于标记页面初始加载时选中的选项。
- multiple：用于设置多选。
- size：用于设置下拉列表展示几个内容

### 5.文本域

```html
<form>
  <label for="comment">评论：</label>
  <textarea id="comment" name="comment" rows="5" cols="30"></textarea>
  <input type="submit" />
</form>
```

- textarea：用于创建多行文本输入框。
- rows：用于设置文本域的行数。
- cols：用于设置文本域的列数。
- textarea 支持 placeholder、minlength、maxlength、required、disabled、readonly 等属性，但不支持 min 和 max；min、max 主要用于适用的 input 类型。

## HTML矢量图

### 1.SVG

```html
<svg width="100" height="100">
  <rect width="30" height="30" fill="red" stroke="black" stroke-width="2" />
</svg>
```

效果如下：

<svg width="150" height="150">
  <rect width="30" height="30" fill="red" stroke="black" stroke-width="2" rx="5" ry="5" />
  <circle cx="50" cy="50" r="20" fill="blue" stroke="black" stroke-width="2" />
  <ellipse cx="50" cy="50" rx="20" ry="10" fill="green" stroke="black" stroke-width="2" />
  <line x1="10" y1="10" x2="90" y2="90" stroke="black" stroke-width="2" />
  <polyline points="10 10 90 10 90 90" stroke="yellow" stroke-width="2" />
  <polygon points="50 10 70 10 70 90 50 90" fill="purple" stroke="black" stroke-width="2" opacity="0.5" />
</svg>

- svg：用于创建SVG图形。
- rect：用于创建矩形。
- fill：用于设置矩形的填充色。
- stroke：用于设置矩形的边框颜色。
- stroke-width：用于设置矩形的边框宽度。
- x y：用于设置矩形的左上角坐标。
- rx ry：用于设置矩形的圆角半径。
- circle：用于创建圆形。
- cx cy：用于设置圆心坐标。
- r：用于设置圆的半径。
- opacity：用于设置图形的透明度。

### 2.map

```html
<img src="map.png" usemap="#map" alt="Map of the world" />

<map name="map">
  <area shape="rect" coords="10,10,50,50" href="https://www.google.com" />
  <area shape="circle" coords="100,100,50" href="https://www.bing.com" />
</map>
```

- img：用于显示图片。
- usemap：用于引用map。
- map：用于创建地图。
- area：用于创建地图区域。
- shape：用于设置区域的形状。
- coords：用于设置区域的坐标。
- href：用于设置区域的链接。

### 3.无障碍 WAI-ARIA

优先使用具有原生语义的 HTML 元素；只有在原生语义无法表达所需信息时，才补充适当的 ARIA 角色和 `aria-*` 属性，避免重复或冲突的无障碍语义。

```html
<button type="button" aria-label="关闭">X</button>
```

- role：用于提供元素的角色。
- aria-label：用于提供按钮的文字描述。
- aria-haspopup：表示该元素可以触发弹出内容；可使用 `true`、`menu`、`listbox`、`tree`、`grid` 或 `dialog` 等值描述弹出内容的类型。
- aria-expanded：用于提供下拉菜单或弹出窗口的展开状态。
