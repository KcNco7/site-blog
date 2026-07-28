# CSS

::: tip MDN文档地址
https://developer.mozilla.org/zh-CN/docs/Web/HTML https://developer.mozilla.org/zh-CN/docs/Web/CSS
:::

导入样式的三种方式：

1. 内联样式：在HTML标签中使用`style`
2. 内部样式: 在HTML文件中的`<head>`标签中使用`<style>`
3. 外部样式表：在CSS文件中定义样式，并使用`<link>`引入HTML文件中

## CSS核心

### 基本选择器

- 标签选择器 直接写标签名
- 类选择器 `.` 可同时属于几个类
- ID选择器 `#` 页面中唯一
- 通配符选择器 `*`
- 交集选择器 `element.class`
- 并集选择器 `,`

### 高级选择器

- 后代选择器 `element element` 只要是后代都生效
- 子选择器 `element > element` 只有直接子元素才生效
- 相邻兄弟选择器 `element + element` 只有紧邻的下一个兄弟元素才生效
- 通用兄弟选择器 `element ~ element`
- 属性选择器 `[attribute]`
  - 可以精确匹配 `a[href="baidu.com"]`
  - 可以规则匹配 `a[href*="baidu.com"]` 含有baidu.com即可
  - 可以忽略大小写 `a[href*="baidu.com" i]` 忽略大小写

### 选择器的优先级

- CSS 层叠会依次考虑声明的来源与重要性、层叠层、选择器 specificity、作用域接近度和源码顺序，不能只用“哪个选择器更精确”概括。
- 在来源、重要性和层叠层相同的前提下，specificity 通常按内联样式、ID、类/属性/伪类、类型/伪元素依次比较；通配符选择器不增加权重。
- `!important` 会改变声明的重要性顺序，但不会跳过来源和层叠层规则，应谨慎使用。

### 样式的继承

- 样式可以继承父元素的样式，但某些属性如 `font-size`、`color` 等可以被继承，而 `display`、`position` 等属性则不能被继承。
- `initial`：将属性设置为 CSS 规范定义的初始值；该值不一定等于浏览器默认样式表呈现的结果。
- `inherit` 设为继承父元素的样式（盒子模型）
- `unset`：对于可继承属性等同于 `inherit`，对于不可继承属性等同于 `initial`。
- `revert`：撤销当前样式来源对该属性的影响，回退到较低优先级来源产生的结果；它不等同于 `initial`。
- `@layer`：用于声明层叠层并控制同一来源内的层叠顺序。对于普通声明，后声明的层优先于先声明的层，未分层样式优先于已分层样式；对于 `!important` 声明，层的优先顺序会反转。

## 字体样式 <Badge type="tip" text="自动继承" />

### 文本字体

- `font-family`：通常依次列出首选字体和后备字体族。

```css
font-family: Arial, sans-serif, monospace;
```

- 自定义字体 手动添加字体

```css
@font-face {
  font-family: "BengHuai";
  src: url("../font/BengHuai.ttf");
}
```

### 字体大小

- `font-size` 的初始值是 `medium`；实际像素大小由用户代理和用户设置决定，不能保证为 `16px`。
- `1.5em` 1.5倍
- `rem` 相对根元素大小

### 字体粗细

- `font-weight` 取值：100-900 默认400
- 100 400 700

### 字体样式

- `font-style` 取值：normal 正常 italic 斜体

### 字体颜色

- `color`字体颜色
- 支持RGB输入，16进制输入 `rgb(255,0,0)`
- 透明度 `rgba(255,0,0,0.5)`

## 文本样式

### 首行缩进

- `text-indent` 一般为2em

### 水平对齐

- `text-align` 取值：left center right justify
- `text-align: justify;` 非最后一行的文本两端对齐
- 影响**块级元素内部**行内元素的水平对齐

### 文本修饰

- `text-decoration` 取值：none underline line-through overline
- `text-decoration: underline red dashed 3px;` 可以控制文本下划线的颜色 样式 宽度

### 文本大小写

- `text-transform` 取值：capitalize 首字母大写 uppercase 大写 lowercase 小写

### 行高控制

- `line-height` 取值：normal 1.5~1.8em

### 文本间距

- `letter-spacing` 取值：normal 数字
- `word-spacing` 取值：normal 数字
- `letter-spacing` 用于中文

### 文本换行

- `word-break` 取值： normal 正常 break-all 强制换行 **用于单词是否砍断**
- `overflow-wrap` 取值：normal 正常 break-word 强制换行 对`word-break`的补充
- `text-wrap` 取值：wrap 正常 nowrap 强制不换行 balance 平衡换行 pretty 美化换行 **控制是否换行**

### 文本空白处理

- `white-space` 取值：nowrap 与`text-wrap:nowrap`效果相同 pre 保留全部空格，并且支持换行 pre-wrap 同`pre` 文字超出宽度会换行 pre-line 同`pre` 不保留空格

### 选择器进阶

#### 伪类选择器

不是选取元素本身，而是选取特定状态的元素。

- `:focus` 获取焦点
- `:link` 未访问的链接
- `:visited` 已访问的链接
- `:hover` 鼠标悬停
- `:active` 激活
  **注意**：多个伪类生效时，需要遵循**LVHA**顺序

下面的一些为结构类伪类：

- `:first-child`: 其父元素下第一个子元素
- `:last-child`: 其父元素下最后一个子元素
- `:nth-child(n)`: 其父元素下第n个子元素 n为数字(可以为even odd)
- `:first-of-type`：匹配同一组兄弟元素中该元素类型的第一个元素。
- `:only-child`：匹配没有兄弟元素的元素。
- `:where(<selector-list>)`：匹配选择器列表中任一选择器描述的元素；`:where()` 及其参数对选择器权重（specificity）的贡献始终为 0。
- `:is(<selector-list>)`：匹配选择器列表中任一选择器描述的元素；`:is()` 的选择器权重由参数列表中权重最高的选择器决定。
- `:has`: 判断元素是否存在

#### 伪元素选择器

虚拟元素，直接看例子：

```html
<label>
  <input placeholder="请输入内容" />
</label>
```

```css
input {
  border: 1px solid #a200d8;
  border-radius: 20px;
  line-height: 2;
  padding: 0 12px;
  width: 200px;
}
input::placeholder {
  color: #bc8cd3;
}
```

- `::before`: 在元素内容之前插入内容
- `::after`: 在元素内容之后插入内容
- `::selection`: 选择元素
- `::first-line`: 第一行
- `::first-letter`: 第一个字符

#### 嵌套选择器

一直在使用的语法

**注意**：对于伪元素或是伪类选择器，使用`&`代表父选择器本身

# 盒子模型和布局

## 盒子模型 <Badge type="warning" text="基本都不会继承" />

### 主要属性

盒子模型由内容区域、内边距、边框和外边距组成。如下图所示：
![盒子模型](/assert/css-image/盒子模型.png)

设置盒子的一些属性：<Badge type="danger" text="仅限内块元素和行内块元素 行内元素无效" />

### `width`: 宽度

可以使用长度、百分比、`auto` 等值；`width` 的初始值是 `auto`。普通流中的块级元素可能占满可用宽度，但这不等同于设置 `width: 100%`。

- `width: fit-content`: 宽度自适应内容宽度
- `width: min-content`: 宽度自适应内容最小宽度
- `width: max-content`: 宽度自适应内容最大宽度

### `height`: 高度

可以使用长度、百分比、`auto` 等值；`height` 的初始值也是 `auto`。百分比高度的计算依赖包含块的高度，不能简单视为与 `width` 完全相同。

### `padding`: 内边距 会使盒子宽度和高度变大 <Badge type="info" text="上右下左" />

- `padding-top`: 上内边距
- `padding-right`: 右内边距
- 给行内元素设置`padding`属性 左右生效 上下无效(实际是有效的但是不体现在上下边距)

### `margin`: 外边距

用来控制元素外部与其他元素之间的距离 和内边距一样

- 边距展示 边距从内侧内容区域开始计算
  ![图片](/assert/css-image/边距.png)
- `margin: auto`: **只影响横向效果** 自动计算盒子两边距离父盒子边框的宽度，实现自动居中
  :::danger margin折叠

1. **相邻的兄弟元素**: 相邻的块级兄弟元素，上面元素的 `margin-bottom` 和下面元素的 `margin-top` 会发生折叠。
2. **父元素和第一个子元素**: 如果父元素没有上边框、上内边距，并且没有内容将它和它的第一个子元素分开，那么父元素的 `margin-top` 和第一个子元素的 `margin-top` 会发生折叠。不过，针对这种情况来说，只要父盒子满足以下要求，就可以阻止折叠行为：
   - 父元素有 padding-top（哪怕是 1px）
   - 父元素有 border-top（哪怕是透明边框）
   - 父元素形成新的块格式化上下文（BFC，后续会介绍，比如设置overflow属性）
3. **空的块级元素**: 如果一个块级元素没有内容、`padding`、`border`，并且 `height` 为 `auto`，那么它自己的 m`argin-top` 和 `margin-bottom` 会发生折叠。
   :::

### `border`: 边框 盒子边框会使盒子宽度和高度变大

- `border-width`：各边的初始值为 `medium`
- `border-style`：各边的初始值为 `none`，因此默认不会显示边框
- `border-color`：各边的初始值为 `currentColor`
- `border-radius`：各圆角半径的初始值为 `0`

:::warning box-size
`box-sizing`: 盒子模型

- 默认 `box-sizing: content-box`
- `box-sizing: border-box`：`width` 和 `height` 指定的是边框盒尺寸，内边距和边框包含在该尺寸内（不含外边距）；内容盒尺寸由指定尺寸减去内边距和边框得到。
  :::
  可以合并，效果如下：

```css
.box {
  border: 1px solid blue;
}
```

### 背景 Background

- `background-color`: 背景颜色
  - 默认: `background-color: transparent`
- `background-image: url(地址)`: 背景图片
- `background-size`: 背景图片大小
  - `background-size: auto`：默认
  - `background-size: cover`：窄边优先
  - `background-size: contain`：宽边优先
- `background-repeat`: 背景图片重复
  - `background-repeat: repeat-x`:水平重复
  - `background-repeat: repeat-y`:垂直重复
- `background-position`: 背景图片位置
  - `background-position: center`: 居中
  - `background-position: left top`: 左上
  - `background-position: left bottom`: 左下

可以合并，效果如下：

```css
.box {
  background: red url(img/bg.png) no-repeat top left / 100px 100px;
}
```

### 用户代理样式

类似于默认样式 浏览器会为元素添加一些样式 不同浏览器的用户代理样式不一样，可能会导致网页的某些元素以不一样的尺寸或边距进行展示，从而出现不同用户看到的页面样式不同的情况。因此，一般需要消除浏览器的默认样式：在 https://www.jsdelivr.com 通过以下代码引入:

```css
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/normalize.css@8.0.1/normalize.min.css">
```

### 滚动区域

使用 `overflow` 属性设置滚动区域 滚动条会占用盒子的一部分空间

- `overflow: visible`：初始值，溢出内容通常不会被裁剪
- `overflow: auto`：由浏览器在需要时提供滚动机制
- `overflow: scroll`: 始终生成滚动条
- `overflow: hidden`: 隐藏超出的内容(可用JS强制滚动)
- `overflow: clip`: 剪切超出的内容(不能用JS强制滚动)
  ::: info
  访问 https://caniuse.com 查询哪些CSS特性受支持
  :::
  针对x轴和y轴单独设置滚动条：
- `overflow-x: hidden`: 设置隐藏x轴滚动条
- `overflow-y: scroll`: 设置y轴滚动条

## 布局 <Badge type="danger" text="重要" />

### 定位布局

使用`position`设置盒子的布局 默认是static类型，也就是静态布局

#### 相对定位

使用`position: relative`设置相对布局

使用定位布局后，我们需要手动指定盒子上下左右的位置，使用left、right、top、bottom 虽然可以使用相对定位来移动盒子的位置，但是盒子所占据的大小和位置还是停留在本来的位置，只是视觉效果上发生了位移。

```css
.box {
  position: relative;
  left: 10px; /* 相对于自身原本位置 距离左边10px */
}
```

#### 绝对定位

使用`position: absolute`设置绝对布局

绝对定位元素会脱离常规文档流，不再为自身保留布局空间。它的包含块由最近的、能够建立绝对定位包含块的祖先形成；除了 `position` 不为 `static` 的祖先，`transform`、`filter`、`perspective`、`contain`、`will-change` 等属性的特定取值也可能建立包含块。若不存在这样的祖先，则使用初始包含块。

当**html/body**存在滚动条时，绝对定位的盒子会一起随着滚动条滚动

:::info 脱离文档流
脱离文档流就是从页面常规的流中脱离，**不再占用页面的位置**，页面会重新计算空间。
:::

#### 固定定位

使用`position: fixed`设置固定定位

固定定位元素会脱离常规文档流，不再为自身保留布局空间。它相对于固定定位包含块进行定位；如果没有祖先建立该包含块，连续媒体中通常以布局视口为参照，因此页面滚动时位置不变。`transform`、`filter`、`perspective`、`contain`、`will-change` 等属性的特定取值可能使祖先建立固定定位包含块，此时元素不一定固定在浏览器窗口上。

#### 粘性定位

使用`position: sticky`设置粘性定位

自己尝试粘性定位的效果 粘性定位在文档中的位置会始终保留。

#### 包含块

参照物 参考系

- `static`、`relative` 和 `sticky`：包含块通常由最近的块容器或建立格式化上下文的祖先形成
- `absolute`：由最近的、能够建立绝对定位包含块的祖先形成；没有时使用初始包含块
- `fixed`：由最近的、能够建立固定定位包含块的祖先形成；没有时在连续媒体中使用布局视口

#### Z轴顺序

Z轴决定谁盖在谁上面

`z-index` 的初始值是 `auto`。它用于设置定位元素以及 Flex、Grid 项的层叠级别；整数值只在相关层叠上下文中比较，并不是数值更大的元素一定能覆盖所有其他元素。

#### 层级上下文

层级上下文：一个独立的空间(分层空间) `z-index`只在同一个层级上下文中有效

什么时候会创建新的层级上下文？

- 盒子存在非`static`定位，且使用了`z-index`属性（即使是`z-index: 0`）此时盒子会创建一个新的层级上下文
- 盒子使用了`fixed`定位（即使没有`z-index`），会直接创建一个新的层级上下文
- 盒子使用 `sticky` 定位时会创建新的层叠上下文，无论它当前是否已进入粘滞状态

### 网格布局

#### 基础布局设置

网格布局是一个二维布局系统，针对行列进行单独处理。

`display`属性可以改变显示模式：

- `display:inline`: 创建行内布局

- `display: block`: 创建块级布局

- `display: grid`：创建网格容器，其直接子元素成为网格项；网格项的尺寸由网格轨道和对齐方式共同决定
  - `grid-template-columns:100px 100px 100px`: 定义列的数量：3列，每一列的宽度都是100px
- `grid-template-rows: 100px 100px 100px`：定义3行，每一行的高度都是 `100px`
  - `fr`: 1份
  - `grid-template-columns:1fr 1fr 1fr`==`grid-template-columns:repeat(3, 1fr)`: 3列，每一列占1份
  - `gap: 10px`: 设置列间距和行间距为10px

实现自动扩列效果：

```css
.grid-box {
  display: grid;
  gap: 1px;
  /* 实现网格自动扩列效果 */
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}
```

这里用到的东西有：

- minmax(200px, 1fr): 定义了每一列宽度的范围
  - **最小值 200px**: 每一列最窄不会小于 200 像素
  - **最大值 1fr**: fr 是“分数单位”（fraction unit）。1fr 表示如果还有剩余空间，该列会占满剩余空间
  - **含义**: 列宽至少是 200px；如果空间够大，它们会拉伸填满行宽。
- auto-fill: 这是一个智能关键字，不同于直接设置固定列数
  - 它告诉浏览器：**在不换行的情况下，尽可能多地往一行里塞入列**
  - 如果容器很宽，浏览器会计算：容器宽度 / 200px 能放下多少列，就生成多少列

#### 显式网格和隐式网格

- **显式网格 (Explicit Grid)**： 由我们通过 `grid-template-columns` 和 `grid-template-rows` 手动定义好的格子区域（比如前 2 行）
- **隐式网格（Implicit Grid）**：当网格项被放置到显式网格边界之外，或自动放置算法需要额外轨道时，浏览器会创建隐式行或隐式列。
  - `grid-auto-columns`: 定义了隐式网格的列宽
  - `grid-auto-rows`: 定义了隐式网格的行高

实现效果：

```css
.grid-box {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 100px);
  grid-auto-rows: 80px; /* 表示超出显式网格范围后，隐式网格高度按80px展示 */
}
```

- `grid-auto-flow: column`：让自动放置算法按列依次填充，并在需要时创建新的隐式列；默认值是 `row`，即按行依次填充并在需要时创建新的隐式行。

#### 元素的定位与合并

通俗来说，类似于Excel的合并单元格

简写属性：

- `grid-column: 1 / 3`: 列从1开始，到3结束
- `grid-row: 1 / 3`: 行从1开始，到3结束
- `grid-row: span 2`: 横跨2行

#### 网格对齐

这里主要研究格子的对齐方式

- `justify-items`：设置所有网格项在行内轴上的默认对齐方式
- `align-items`：设置所有网格项在块轴上的默认对齐方式
- `justify-items: start | center | end | stretch`：设置所有网格项在各自网格区域中的行内轴对齐
- `align-items: start | center | end | stretch`：设置所有网格项在各自网格区域中的块轴对齐
- `justify-self: end`：单独设置一个网格项在行内轴上的对齐
- `align-self: end`：单独设置一个网格项在块轴上的对齐
- `justify-content: center | space-between | space-around`：当网格整体在行内轴上有剩余空间时，设置网格轨道整体的分布方式
- `align-content: center | space-between | space-around`：当网格整体在块轴上有剩余空间时，设置网格轨道整体的分布方式

这里总结一下上面用到的几种对齐类型：

- `*-content`: 控制 **整个网格** 在容器内的对齐。在你定义的网格轨道（所有行和列）总尺寸小于容器尺寸时生效。
- `*-items`: 控制所有 **网格项（Item）** 在其所在的 **单元格（Cell）** 内的对齐。
- `*-self`: 控制某一个 **网格项（Item）** 在其所在的 **单元格（Cell）** 内的对齐。

对齐一般用于网格内元素小于单元格大小，以及网格整体排列等情况，在大部分情况下很少会用到。

#### 网格区域

`grid-template-areas` 使用字符串定义命名网格区域，并以可视化方式描述网格结构；网格项再通过 `grid-area` 放入对应区域。是否选择 Grid 或 Flexbox 应根据二维或一维布局需求决定，不能笼统地说 Flexbox 更推荐。

具体代码示例如下：

```html
<!doctype html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0"
    />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <link rel="stylesheet" href="./CSS-1.css" />
    <title>Document</title>
  </head>
  <body>
    <div class="grid-box">
      <div class="grid-item header">1</div>
      <div class="grid-item nav">2</div>
      <div class="grid-item content">3</div>
      <div class="grid-item footer">4</div>
    </div>
  </body>
</html>
```

```css
.grid-box {
  display: grid;
  gap: 1px;
  grid-template-columns: 200px 250px 250px;
  grid-template-rows: 50px 200px 50px;

  grid-template-areas:
    "header header header"
    "aside main main"
    "aside footer footer";
}

.grid-item {
  background-color: grey;
}

.header {
  grid-area: header;
}

.nav {
  grid-area: aside;
}

.content {
  grid-area: main;
}

.footer {
  grid-area: footer;
}
```

实现效果如下:
![网格区域](/assert/css-image/网格区域.png)

### 弹性布局 <Badge type="danger" text="重要"/> <Badge type="danger" text="90%可用"/>

弹性布局的实现原理是：浏览器会根据弹性布局的属性来计算元素尺寸，并自动调整元素尺寸，使其适应浏览器窗口大小。弹性布局的盒子会线性排列，无论是块级元素还是行级元素。弹性布局允许元素在浏览器窗口大小改变时自动调整大小，**在空间不足的时候可让盒子自动收缩**。

- `display: flex`: 创建弹性布局
- `flex-direction: row/column`: 定义布局方向
- `flex-wrap: nowrap | wrap | wrap-reverse`：`nowrap`（默认）不换行；`wrap` 允许换行；`wrap-reverse` 允许换行并交换交叉轴的起点与终点，因此各行的堆叠方向反转，但每行内项目的顺序不变。

#### 对齐方式 <Badge type="info" text="多数属性与网格布局类似"/>

- **主轴**：默认从左往右
- **交叉轴**：与主轴垂直
- `flex-direction: row`: (默认)主轴方向(从左往右)
- `flex-direction: row-reverse`: 改变主轴方向(从右往左)
- `flex-direction: column`: 改变主轴方向(从上到下)
- `flex-direction: column-reverse`: 改变主轴方向(从下到上)
- CSS 中没有 `justify-item` 这一属性；`justify-self` 不适用于 Flex 项，因此在 Flex 容器上设置 `justify-items` 也不能像 Grid 那样逐项控制主轴对齐。主轴上的单项位置通常可通过自动外边距等方式调整。
- `justify-content: flex-start/flex-end/center/space-between/space-around`: 主轴对齐方式
- `align-items: flex-start/flex-end/center/baseline/stretch`: 交叉轴对齐方式

#### 空间分配

- **在每个盒子元素中设置**，而非弹性布局中设置
- `flex-grow: 0`：初始值为 `0`。主轴存在正的剩余空间时，Flex 项按照各自的 `flex-grow` 因子分配剩余空间；实际最终尺寸还会受到 `flex-basis`、最小/最大尺寸和冻结步骤等因素影响，并不等同于简单的“等比例放大”。
- `flex-shrink: 1`：初始值为 `1`。主轴空间不足时，负的剩余空间按照“`flex-shrink` 因子 × Flex 基准尺寸”得到的缩小比例分配，并受最小/最大尺寸等限制；它不是只按 `flex-shrink` 数值简单等比例缩小。
- `flex-basis: auto`: 盒子的初始大小（默认 **auto**） 一般为auto
  简写属性：
- `flex: 0 1 auto`(默认值)等价于`flex-grow: 0` `flex-shrink: 1` `flex-basis: auto` 不放大，会缩小，大小由内容决定。
- `flex: 1`是 `flex: 1 1 0%`;的简写。意思是：会放大，会缩小，基础大小为0。这常用于让项目等分容器。
- `flex: auto`是 `flex: 1 1 auto`的简写。
- `flex: none`是 `flex: 0 0 auto`的简写。不放大也不缩小。

实现网格布局的效果：

```html
<!doctype html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0"
    />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <link rel="stylesheet" href="./CSS-1.css" />
    <title>Document</title>
  </head>
  <body>
    <div class="flex-box">
      <div class="header">header</div>
      <div class="nav">
        <div class="aside">aside</div>
        <div class="content">
          <div class="main">main</div>
          <div class="footer">footer</div>
        </div>
      </div>
    </div>
  </body>
</html>
```

```css
.flex-box {
  display: flex;
  flex-direction: column;
  width: 800px;
  height: 600px;
  .header {
    background-color: blue;
    width: 100%;
    height: 10%;
  }

  .nav {
    flex: 1;
    background-color: yellow;
    flex-direction: row;
    display: flex;
    .aside {
      background-color: darkgoldenrod;
      width: 30%;
      height: 100%;
    }
    .content {
      flex: 1;
      display: flex;
      background-color: rosybrown;
      flex-direction: column;
      .main {
        width: 100%;
        height: 90%;
        background-color: rebeccapurple;
      }
      .footer {
        flex: 1;
        background-color: salmon;
      }
    }
  }
}
```

### 浮动布局 <Badge type="warning" text="已过时"/>

- 浮动布局让一个元素脱离文档流，并移动到父容器左侧或右侧，直到遇到父容器的边缘和另一个浮动元素为止。
- 使用`float: left/right`设置浮动布局 类似效果：**图文环绕**
- 浮动布局会导致**父容器高度塌陷**，解决方法：
  1. 在末尾添加 `<div style="clear: both;"></div>`
  2. 创建一个新的BFC
  3. ::after

  ### 表格布局 <Badge type="warning" text="已过时"/>

  -`display: table`: 创建表格布局
  - `display: table-row`: 创建行布局
  - `display: table-cell`: 创建单元格

::: warning 缺点很多

1. 结构冗余
2. 响应式差
3. 渲染性能
   :::

### 布局行内展示

`display: flex` 和 `display: grid` 会生成块级外部盒；`display: inline-flex` 和 `display: inline-grid` 则生成行内级外部盒，使容器本身可以与相邻行内内容排列。它们不用于控制容器内部项目是否换行；Flex 项换行由 `flex-wrap` 控制，Grid 项由网格轨道和自动放置规则决定。

### 块级格式化上下文(BFC)

BFC有以下特性：

- **独立的块级格式化环境**：BFC 规定其内部块级盒和浮动的布局方式，并限制外边距折叠、浮动交互等效果跨越其边界；它并不能保证内部布局绝不影响外部，也不会普遍阻止元素重叠。
- **垂直外边距合并**：在同一个BFC中，相邻的块级盒子的垂直外边距会发生合并 (margin collapse)。
- **包含浮动元素**：BFC可以包含其内部的浮动元素，从而解决因浮动元素导致父元素高度塌陷的问题。
- **不与浮动元素重叠**：BFC的区域不会与浮动元素的区域重叠，这使得我们可以利用BFC来实现两栏或多栏布局。

如何创建BFC元素？满足以下条件之一即可：

1. 根元素`<html>`
2. 浮动元素`float`属性不为`none`
3. 绝对定位元素的`position`属性为`absolute`或者`fixed`
4. `display`属性为`inline-block/table-cell/table-caption/flex/grid/inline-flex/inline-grid`的元素
5. 块级盒的 `overflow` 值既不是 `visible` 也不是 `clip`（例如 `hidden`、`scroll`、`auto`）；如需在使用 `overflow: clip` 时建立新的格式化上下文，可同时使用 `display: flow-root`。

# CSS3 变换和过渡

## 盒子模型进阶

### 最大宽度和最小宽度

最大宽度和最小宽度属性允许您限制一个元素的最大和最小宽度。

- `max-width`: 设置元素的最大宽度。
- `min-width`: 设置元素最小宽度。

### 盒子轮廓

轮廓是画在边框之外的一条线，与边框有些许区别：

1. 不占据空间：轮廓不会改变元素的大小。
2. 在边框外进行绘制：不会占用盒子内部区域
3. `outline: 1px solid red;`

### 盒子阴影

- `box-shadow: [inset] offset-x offset-y [blur-radius] [spread-radius] [color];`
- `offset-x`：阴影的水平偏移量。
- `offset-y`：阴影的垂直偏移量。
- `blur-radius`：模糊半径，不能为负值；值越大，阴影边缘越模糊。
- `spread-radius`：扩散距离；正值使阴影轮廓扩张，负值使其收缩。
- `color`：阴影颜色；省略时使用 `currentColor`。
- `box-shadow: 5px 5px 5px red;`
- `box-shadow: 5px 5px 5px red, 10px 10px 10px blue;`
- `box-shadow: 5px 5px 5px red inset ;` 内阴影
- 部分组件库将阴影当做边框使用，避免边框宽度被系统缩放影响
- `text-shadow: 1px 1px 1px red;` 文本阴影

### 行内纵向对齐

![对齐方式](/assert/css-image/对齐方式.png)

- 顶线：行高顶部（不是文字顶部）
- 中线：文字中点
- 底线：行高底部（不是文字底部）
- 基线：英文小写字母 x 的下边缘

- `vertical-align: top;` 顶对齐
- `vertical-align: middle;` 中对齐

### 精灵图

**优点**：通过将多个图片合并成一张，减少了HTTP请求的数量，从而加快了页面加载速度。

```css
.vip-icon {
  display: inline-block;
  width: 40px;
  height: 40px;
  background-position: -57px 0;
  background-image: url("/img/sprites.png");
}
```

### 颜色渐变

直接看例子：

```css
.container {
  width: 300px;
  height: 50px;
  background-image: linear-gradient(to right, red, yellow);
}
```

渐变边框：

```css
.container {
  width: 300px;
  height: 50px;
  border-radius: 10px;
  background:
    linear-gradient(to right, white, white) padding-box,
    /* pading+内容区域采用白色 */ linear-gradient(to right, red, blue)
      border-box; /* border+pading+内容区域采用渐变 */
  border: 2px solid transparent; /* 注意边框的颜色会覆盖背景，这里弄个透明的 */
}
```

### 滤镜效果

- `filter: blur(5px);`: Guass模糊
- `filter: brightness(0.5);`: 亮度
- `filter: contrast(0.5);`: 对比度
- `filter: grayscale(100%);`: 灰度
- `filter: hue-rotate(90deg);`: 色调 <!-- 实现多种主题切换 -->
- `filter: invert(100%);`: 反色
- `filter: drop-shadow(5px 5px 5px red);`：依据元素渲染结果的 Alpha 轮廓生成投影，透明区域不会像矩形盒阴影那样参与投影；该函数不支持 `spread-radius` 或 `inset`。

### 背景过滤器

- `backdrop-filter: blur(5px);`: 背景模糊

## 二维变换和三维变换

### 二维变换

- `transform: translate(x, y);`: 平移
- `transform: scale(x, y);`: 缩放(横纵缩放比例)
- `transform: rotate(angle);`: 旋转
- `transform: skew(x, y);`: 倾斜

`position: relative` 使用 inset 属性相对元素的正常位置进行偏移；`transform: translate()` 则在布局完成后变换元素的渲染坐标系。两者都会保留元素在常规流中的原始空间，因此不能简单区分为“盒子本体移动”和“仅视觉移动”。不同 DOM API 测量的坐标空间也不同，例如 `getBoundingClientRect()` 会反映 transform 后的可视位置，而 `offsetTop`、`offsetLeft` 等布局指标不包含 transform。

### 原点变换

- `transform-origin: x y;`: 设置变换的原点
- `transform-origin: left top;`: 左上角

### 组合变换

如果我们需要同时对元素进行平移、旋转和缩放，可以将这些函数写在同一个 `transform` 属性中，用空格隔开。

```css
.box {
  /* 变换矩阵按书写顺序从左到右相乘；对元素局部坐标中的点，效果相当于先缩放，再旋转，最后平移 */
  transform: translate(100px) rotate(45deg) scale(1.2);
}
```

`注意`：变换的顺序很重要！先旋转再平移，和先平移再旋转，最终的位置可能完全不同，因为旋转会改变坐标轴的方向。

### 三维变换

在二维的基础上引入**Z轴**，实现物体**近大远小**的效果。在父盒子创建景深效果`perspective: 500px`，即可体现。

### 透明效果

- `opacity: 0.5;`: 透明度（半透明）

### 过渡效果

- `transition-property: property;`: 设置过渡的属性
- `transition-duration: duration;`: 设置过渡的持续时间
- `transition-timing-function: ease;`: 设置过渡的缓动函数（有很多种）
- `transition: property duration timing-function delay;`: 过渡效果

# UI设计系列课程

## 卡片元素

1. 背景和边框 **卡片颜色一定要有对比度**
2. 卡片边距
3. 卡片的圆角

## 色彩搭配

> 本节待补充。

## 视差滚动

简单来说就是：前景和背景的滚动速度不一致。一般需要使用JS来实现，但是CSS也可以实现轻量版的。

- `background-attachment: fixed;` :背景图固定
- `background-attachment: scroll;` :

### 导航栏

> 本节待补充。
