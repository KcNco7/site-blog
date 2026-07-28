# Vue 3 基础

官方文档：[Vue.js 中文文档](https://cn.vuejs.org/)

Vue 是用于构建用户界面的渐进式框架。它的数据驱动视图思路常用 MVVM（Model-View-ViewModel）帮助理解，但 Vue 并不强制整个应用采用某一种架构；Vue 3 同时支持选项式 API 和组合式 API（Composition API）。

## 1. Vue 3 概述

### 1.1 升级点

- `reactive()` 使用 `Proxy` 追踪对象属性访问和修改；`ref()` 则通过带 getter/setter 的包装对象追踪 `.value`。
- 编译器和虚拟 DOM 运行时加入静态提升、Patch Flag、树结构打平等优化，并通过 ESM 提供更好的 Tree Shaking 条件。
- API 和类型声明以 TypeScript 重写，对 TypeScript 与 IDE 类型推导的支持更完整。

### 1.2 npm run dev 全过程

`npm run dev` 会先读取当前包 `package.json` 中的 `scripts.dev`。执行脚本时，npm 会在原有 `PATH` 基础上加入本地的 `node_modules/.bin`，所以脚本中的 `vite` 通常指向项目本地安装的 Vite 可执行文件，再由平台默认 shell 执行。

它不会按照“本地找不到 → 自动查全局包 → 自动全局安装”的顺序处理。若没有 `dev` 脚本或依赖尚未安装，命令会报错；通常应先检查 `package.json` 并运行 `npm install`，而不是依赖全局安装的 Vite。

## 2. 创建 Vue 3 工程

### 2.1 使用官方 create-vue 创建

Vue 官方目前推荐使用基于 Vite 的 `create-vue`：

```shell
npm create vue@latest
```

这条命令会安装并执行官方脚手架 `create-vue`。`npm create vite@latest my-vue-app -- --template vue-ts` 也能通过 Vite 的通用脚手架创建 Vue TypeScript 模板，但它不是 `create-vue` 的交互式功能选择流程。旧的 Vue CLI 基于 webpack，已经进入维护模式；`npm create vue@latest` 不是 Vue CLI。

下面是交互提示的示意，具体选项可能随 `create-vue` 版本调整：

```text
# 配置项目名称
√ Project name: vue3_test
# 是否添加 TypeScript 支持
√ Add TypeScript?  Yes
# 是否添加 JSX 支持
√ Add JSX Support?  No
# 是否添加 Vue Router
√ Add Vue Router for Single Page Application development?  No
# 是否添加 Pinia
√ Add Pinia for state management?  No
# 是否添加单元测试
√ Add Vitest for Unit Testing?  No
# 是否添加端到端测试方案
√ Add an End-to-End Testing Solution? » No
# 是否添加 ESLint
√ Add ESLint for code quality?  Yes
# 是否添加 Prettier
√ Add Prettier for code formatting?  No
```

创建完成后安装依赖并启动开发服务器：

```shell
cd vue3_test
npm install
npm run dev
```

可以把 `App.vue` 改成一个最小组件：

```vue
<template>
  <div class="app">
    <h1>你好啊！</h1>
  </div>
</template>

<script lang="ts">
export default {
  name: "App", // 组件名
};
</script>

<style>
.app {
  background-color: #ddd;
  box-shadow: 0 0 10px;
  border-radius: 10px;
  padding: 20px;
}
</style>
```

::: danger 总结

- 在 create-vue 默认生成的 Vite 单页应用中，项目根目录的 `index.html` 是 HTML 入口。
- 加载 `index.html` 后，浏览器请求其中 `<script type="module" src="/src/main.ts">` 指向的 `main.ts`，Vite 在开发阶段负责转换和提供相关模块。
- Vue 3 通过 `createApp()` 创建应用实例，再使用 `mount()` 挂载根组件。
  :::

```typescript
import { createApp } from "vue"; // 创建应用

import App from "./App.vue"; // 根组件

createApp(App).mount("#app"); // 把根组件挂载在id为app的容器（容器在index.html）
```

### 2.2 一个简单的效果

Vue 单文件组件（SFC）通常由以下顶层块组成，其中 `<script>` 和 `<style>` 可以按需要省略，`<style>` 也可以出现多个：

- `<template>`：组件模板
- `<script>` 或 `<script setup>`：组件逻辑
- `<style>`：组件样式

## 参考资料

- [Vue：快速上手](https://cn.vuejs.org/guide/quick-start)
- [Vue：工具链](https://cn.vuejs.org/guide/scaling-up/tooling)
- [npm：npm run](https://docs.npmjs.com/cli/v11/commands/npm-run/)
## 3. Vue 3 核心语法：模板语法与指令

文本插值使用 `{{ }}`，Vue 内置指令通常以 `v-` 开头。

- `v-text`：更新元素的 `textContent`，会覆盖元素原有文本内容；文本插值更适合只替换局部内容。
- `v-html`：把值作为原始 HTML 写入元素，不会编译其中的 Vue 模板或组件。只能用于可信内容，切勿直接渲染用户输入，以免造成 XSS。
- `v-if`: 条件渲染，如果是true，则渲染元素。如果是false，则不渲染元素。（注释节点）
- `v-else`: 条件渲染，如果前一个条件为false，则渲染元素。
- `v-else-if`: 条件渲染，如果前一个条件为false，则渲染元素。
- `v-show`: 条件渲染，元素会被隐藏，但是元素依然存在。（`display: none;`）
- `v-on`：监听事件，简写为 `@`，支持动态参数；原生 DOM 事件是否冒泡由事件本身决定。
- `v-bind`：动态绑定属性或组件 prop，简写为 `:`。例如 `v-bind:class="aaa"` 可写成 `:class="aaa"`；Vue 3.4+ 在属性名与变量名相同时还可把 `:id="id"` 简写为 `:id`。
- `v-model`：在表单控件或组件上建立值与更新事件之间的双向绑定，目标必须是可赋值表达式，通常来自 `ref`、`reactive` 属性或可写计算属性。
- `v-for`：循环渲染列表，通常应提供稳定且唯一的 `:key`，例如 `<li v-for="item in list" :key="item.id">`。
- `v-once`: 只渲染一次，并跳过之后的更新
- `v-memo`: 缓存渲染结果，如果数据没有变化，则跳过更新(一般配合`v-for`使用)

### 3.1 OptionsAPI 与 CompositionAPI

- `Options`和`Composition`

<img src="/assert/assets-heima/1696662197101-55d2b251-f6e5-47f4-b3f1-d8531bbf9279.gif" alt="1.gif" style="zoom:70%;border-radius:20px" /><img src="/assert/assets-heima/1696662200734-1bad8249-d7a2-423e-a3c3-ab4c110628be.gif" alt="2.gif" style="zoom:70%;border-radius:20px" />

<img src="/assert/assets-heima/1696662249851-db6403a1-acb5-481a-88e0-e1e34d2ef53a.gif" alt="3.gif" style="height:300px;border-radius:10px"  /> <img src="/assert/assets-heima/1696662256560-7239b9f9-a770-43c1-9386-6cc12ef1e9c0.gif" alt="4.gif" style="height:300px;border-radius:10px"  />

> 说明：以上四张动图原创作者：大帅老猿

### 3.2 setup

#### setup 概述

- `setup`函数返回的对象中的内容，可直接在模板中使用。
- `setup`中访问`this`是`undefined`。
- `setup()` 在组件实例创建早期执行，早于同一组件 Options API 的 `beforeCreate` 和 `created` 钩子。

```vue
<template>
  <div class="person">
    <h2>姓名：{{ name }}</h2>
    <h2>年龄：{{ age }}</h2>
    <button @click="changeName">修改名字</button>
    <button @click="changeAge">年龄+1</button>
    <button @click="showTel">点我查看联系方式</button>
  </div>
</template>

<script lang="ts">
export default {
  name: "Person",
  setup() {
    // 数据，原来写在data中（注意：此时的name、age、tel数据都不是响应式数据）
    let name = "张三";
    let age = 18;
    let tel = "13888888888";

    // 方法，原来写在methods中
    function changeName() {
      name = "zhang-san"; //注意：此时这么修改name页面是不变化的
      console.log(name);
    }
    function changeAge() {
      age += 1; //注意：此时这么修改age页面是不变化的
      console.log(age);
    }
    function showTel() {
      alert(tel);
    }

    // 把数据交出去
    return { name, age, tel, changeName, changeAge, showTel };
  },
};
</script>
```

#### setup 的返回值

- 若返回一个**对象**：则对象中的：属性、方法等，在模板中均可以直接使用**（重点关注）。**
- 若返回一个**渲染函数**：该函数负责返回组件的渲染结果，例如：

```javascript
import { h } from "vue";

export default {
  setup() {
    return () => h("h1", "你好啊！");
  },
}
```

::: info setup 与 Options API 的关系

- 在同一个 Vue 3 组件中，`setup()` 显式返回的属性和方法会暴露到组件实例，因此 Options API 的方法等可以通过 `this` 访问这些绑定。
- `setup()` 执行时 Options API 的状态尚未初始化，且 `setup()` 内没有组件实例 `this`，因此不能反过来依赖 `this.dataProperty` 或 `this.methods`。
- 不建议让 `setup()` 返回值与 `data`、`methods`、`computed` 等选项使用相同名称；混用两套 API 时应保持命名清晰。
  :::

#### setup 语法糖

`setup`函数有一个语法糖，这个语法糖，可以让我们把`setup`独立出去，代码如下：

```vue
<template>
  <div class="person">
    <h2>姓名：{{ name }}</h2>
    <h2>年龄：{{ age }}</h2>
    <button @click="changName">修改名字</button>
    <button @click="changAge">年龄+1</button>
    <button @click="showTel">点我查看联系方式</button>
  </div>
</template>

<script lang="ts">
export default {
  name: "Person",
};
</script>

<!-- 下面的写法是setup语法糖 -->
<script setup lang="ts">
console.log(this); //undefined

// 数据（注意：此时的name、age、tel都不是响应式数据）
let name = "张三";
let age = 18;
let tel = "13888888888";

// 方法
function changName() {
  name = "李四"; //注意：此时这么修改name页面是不变化的
}
function changAge() {
  console.log(age);
  age += 1; //注意：此时这么修改age页面是不变化的
}
function showTel() {
  alert(tel);
}
</script>
```

> 这样写如何定义组件名？

Vue 3.3+ 可以在 `<script setup>` 中使用编译器宏 `defineOptions()` 设置组件名，无需导入：

```vue
<script setup lang="ts">
defineOptions({ name: "Person" });
</script>
```

### 3.3 ref 对比 reactive

::: info 宏观方面

> 1. `ref`用来定义：**基本类型数据**、**对象类型数据**（底层仍为`reactive`）；
> 2. `reactive`用来定义：**对象类型数据**。

:::

- 区别：

> 1. 在普通 JavaScript/TypeScript 中读写 `ref` 的值通常需要 `.value`；模板表达式会自动解包顶层 ref，因此模板中通常不写 `.value`。
>
>    <img src="/assert/assets-heima/自动补充value.png" alt="自动补充value" style="zoom:50%;border-radius:20px" />
>
> 2. `reactive`重新分配一个新对象，会**失去**响应式（可以使用`Object.assign`去整体替换）。

- 使用原则：
  > 1. 若需要一个基本类型的响应式数据，必须使用`ref`。
  > 2. 对象既可以放进 `ref`，也可以交给 `reactive`；两者默认都进行深层响应式转换。
  > 3. 是否选择 `ref` 或 `reactive` 主要取决于状态是否需要整体替换，以及团队希望采用 `.value` 还是稳定代理对象的使用方式，与对象层级深浅没有固定对应关系。

### 3.4 ref 和 reactive 响应式

::: info ref

- **语法：** `let xxx = ref(初始值)`。
- **返回值：** 一个带有响应式 `.value` 属性的 ref 对象；业务代码不应依赖 `RefImpl` 这类内部实现名称。
- **注意点：**
  - `JS`中操作数据需要：`xxx.value`，但模板中不需要`.value`，直接使用即可。
  - 对于 `const name = ref("张三")`，`name` 是 ref 对象；Vue 追踪对其 `.value` 属性的读取和写入。
- `ref`接收的数据可以是：**基本类型**、**对象类型**。
- 若`ref`接收的是对象类型，内部其实也是调用了`reactive`函数。

:::

```vue
<!-- ref的使用 -->
<template>
  <div class="person">
    <h2>姓名：{{ name }}</h2>
    <h2>年龄：{{ age }}</h2>
    <button @click="changeName">修改名字</button>
    <button @click="changeAge">年龄+1</button>
    <button @click="showTel">点我查看联系方式</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
// name和age是一个RefImpl的实例对象，简称ref对象，它们的value属性是响应式的。
let name = ref("张三");
let age = ref(18);
// tel就是一个普通的字符串，不是响应式的
let tel = "13888888888";

function changeName() {
  // JS中操作ref对象时候需要.value
  name.value = "李四";
  console.log(name.value);

  // 若变量使用 let，直接把 name 重新赋成另一个 ref 会让模板改为读取新 ref；
  // 更常见的做法是保留同一个 ref，并修改 name.value。
}
function changeAge() {
  // JS中操作ref对象时候需要.value
  age.value += 1;
  console.log(age.value);
}
function showTel() {
  alert(tel);
}
</script>
```

```vue
<!-- ref包裹对象 -->
<template>
  <div class="person">
    <h2>汽车信息：一台{{ car.brand }}汽车，价值{{ car.price }}万</h2>
    <h2>游戏列表：</h2>
    <ul>
      <li v-for="g in games" :key="g.id">{{ g.name }}</li>
    </ul>
    <h2>测试：{{ obj.a.b.c.d }}</h2>
    <button @click="changeCarPrice">修改汽车价格</button>
    <button @click="changeFirstGame">修改第一游戏</button>
    <button @click="test">测试</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

// 数据
let car = ref({ brand: "奔驰", price: 100 });
let games = ref([
  { id: "ahsgdyfa01", name: "英雄联盟" },
  { id: "ahsgdyfa02", name: "王者荣耀" },
  { id: "ahsgdyfa03", name: "原神" },
]);
let obj = ref({
  a: {
    b: {
      c: {
        d: 666,
      },
    },
  },
});

console.log(car);

function changeCarPrice() {
  car.value.price += 10;
}
function changeFirstGame() {
  games.value[0].name = "流星蝴蝶剑";
}
function test() {
  obj.value.a.b.c.d = 999;
}
</script>
```

::: info reactive

- **作用：** 定义一个**响应式对象**（基本类型不要用它，要用`ref`，否则报错）
- **语法：** `let 响应式对象= reactive(源对象)`。
- **返回值：** 一个`Proxy`的实例对象，简称：响应式对象。
- **注意点：** `reactive` 默认进行深层响应式转换；若只希望根层属性响应，可根据需要使用 `shallowReactive()`。

:::

```vue
<!-- reactive -->
<template>
  <div class="person">
    <h2>汽车信息：一台{{ car.brand }}汽车，价值{{ car.price }}万</h2>
    <h2>游戏列表：</h2>
    <ul>
      <li v-for="g in games" :key="g.id">{{ g.name }}</li>
    </ul>
    <h2>测试：{{ obj.a.b.c.d }}</h2>
    <button @click="changeCarPrice">修改汽车价格</button>
    <button @click="changeFirstGame">修改第一游戏</button>
    <button @click="test">测试</button>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue";

// 数据
let car = reactive({ brand: "奔驰", price: 100 });
let games = reactive([
  { id: "ahsgdyfa01", name: "英雄联盟" },
  { id: "ahsgdyfa02", name: "王者荣耀" },
  { id: "ahsgdyfa03", name: "原神" },
]);
let obj = reactive({
  a: {
    b: {
      c: {
        d: 666,
      },
    },
  },
});

function changeCarPrice() {
  car.price += 10;
}
function changeFirstGame() {
  games[0].name = "流星蝴蝶剑";
}
function test() {
  obj.a.b.c.d = 999;
}
</script>
```

### 3.5 toRefs 与 toRef

> 从响应式对象中直接解构出的基本类型值不会继续与原属性保持响应式连接，该怎么办？

```vue
<template>
  <div class="person">
    <h2>姓名：{{ person.name }}</h2>
    <h2>年龄：{{ person.age }}</h2>
    <button @click="changeName">修改名字</button>
    <button @click="changeAge">修改年龄</button>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue";

// 数据
let person = reactive({ name: "张三", age: 18, gender: "男" });

let { name, age } = person; // 此时 name、age 是普通值
/*
相当于
let name = person.name;
let age = person.age;
*/

// 方法
function changeName() {
  name += "~"; // 只修改局部变量，不会更新 person.name
}
function changeAge() {
  age += 1; // 只修改局部变量，不会更新 person.age
}
</script>
```

::: info toRef

- `toRef(object, key)` 为对象的某一个属性创建双向关联的 ref。
- `toRefs(object)` 把调用时对象上所有可枚举的自有属性分别转换为关联 ref，便于安全解构；之后才新增的属性不会自动出现在已经返回的结果中。

:::

作用示例：

```vue
<template>
  <div class="person">
    <h2>姓名：{{ person.name }}</h2>
    <h2>年龄：{{ person.age }}</h2>
    <h2>性别：{{ person.gender }}</h2>
    <button @click="changeName">修改名字</button>
    <button @click="changeAge">修改年龄</button>
    <button @click="changeGender">修改性别</button>
  </div>
</template>

<script setup lang="ts">
import { reactive, toRefs, toRef } from "vue";

// 数据
let person = reactive({ name: "张三", age: 18, gender: "男" });

// 通过toRefs将person对象中的n个属性批量取出，且依然保持响应式的能力
let { name, gender } = toRefs(person);

// 通过 toRef 将 person 对象中的 age 属性取出，且仍与原属性双向关联
let age = toRef(person, "age");

// 方法
function changeName() {
  name.value += "~";
}
function changeAge() {
  age.value += 1;
}
function changeGender() {
  gender.value = "女";
}
</script>
```
## 3.6 computed 计算属性

::: warning 补充知识

`v-bind` 用于把 JavaScript 表达式的结果单向绑定到元素属性或组件 prop；没有 `v-bind`（或 `:`）的普通属性值按静态字符串处理。`v-model` 则约定了值绑定与更新事件，用于表单控件或组件的双向绑定。

```vue
<template>
  <!-- a、c 是静态字符串；b、d 会计算表达式 -->
  <h2 a="1+1" :b="1 + 1" c="x" :d="x">测试</h2>

  <!-- plain-text 收到字符串；persons 收到数组 -->
  <Person plain-text="personList" :persons="personList" />
</template>

<script setup lang="ts">
import { ref } from "vue";
import Person from "./Person.vue";

interface PersonItem {
  id: string;
  name: string;
  age: number;
}

const x = 9;
const personList = ref<PersonItem[]>([
  { id: "123123", name: "zhangsan", age: 18 },
  { id: "123345", name: "lisi", age: 19 },
  { id: "123321", name: "wangwu", age: 20 },
]);
</script>
```

:::

> 需求：给出姓和名，输出全名并且姓和名首字母大写

计算属性作用：根据已有数据计算出新数据（和`Vue2`中的`computed`作用一致）。

<img src="/assert/assets-heima/computed.gif" style="zoom:20%;" />

```vue
<template>
  <div class="person">
    姓：<input type="text" v-model="firstName" /> <br />
    名：<input type="text" v-model="lastName" /> <br />
    <!-- 在此处两者不使用计算属性两者效果一致 -->
    <!-- 全名：<span>{{ firstName }}{{ lastName }}</span> <br /> -->
    全名：<span>{{ fullName }}</span> <br />
    <button @click="changeFullName">全名改为：li-si</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

const firstName = ref("zhang");
const lastName = ref("san");

function capitalize(value: string) {
  return value ? value[0].toUpperCase() + value.slice(1) : "";
}

// 计算属性——只读取，不修改
/* let fullName = computed(()=>{
    return firstName.value + '-' + lastName.value
  }) */

// 计算属性——既读取又修改
const fullName = computed({
  // 读取
  get() {
    return `${capitalize(firstName.value)}-${capitalize(lastName.value)}`;
  },
  // 修改
  set(val) {
    // 参数为修改的值
    console.log("有人修改了fullName", val);
    const [first = "", last = ""] = val.split("-", 2);
    firstName.value = first;
    lastName.value = last;
  },
});

function changeFullName() {
  fullName.value = "li-si";
}
</script>
```

- 计算属性会缓存结果，只有其响应式依赖变化后才会在下次读取时重新求值。
- 模板中直接调用方法会在每次组件重新渲染时再次执行，因此不具备相同的依赖缓存语义。
- `computed()` 返回计算 ref；业务代码不应依赖 `ComputedRefImpl` 这类内部实现名称。

## 3.7 watch 监视

> 需求：当年龄达到一个数值时发出提醒

- 作用：监视数据的变化（和`Vue2`中的`watch`作用一致）
- `watch()` 的数据源可以是 ref（包括计算 ref）、响应式对象、getter 函数，或由这些来源组成的数组。

::: info 四种数据

1. `ref`定义的数据。
2. `reactive`定义的数据。
3. 函数返回一个值（`getter`函数）。
4. 一个包含上述内容的数组。

:::

我们在`Vue3`中使用`watch`的时候，通常会遇到以下几种情况：

### 3.7.1 情况一

监视`ref`定义的**基本类型**数据：直接写数据名即可，监视的是其`value`值的改变。

```vue
<template>
  <div class="person">
    <h1>情况一：监视【ref】定义的【基本类型】数据</h1>
    <h2>当前求和为：{{ sum }}</h2>
    <button @click="changeSum">点我sum+1</button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
// 数据
let sum = ref(0);
// 方法
function changeSum() {
  sum.value += 1;
}
// 监视，情况一：监视【ref】定义的【基本类型】数据
const stopWatch = watch(sum, (newValue, oldValue) => {
  // 不需要.value
  // watch的返回值是一个箭头函数
  console.log("sum变化了", newValue, oldValue);
  if (newValue >= 10) {
    stopWatch();
  }
});
</script>
```

### 3.7.2 情况二

监视`ref`定义的【对象类型】数据：直接写数据名，监视的是对象的【地址值】，若想监视对象内部的数据，要手动开启深度监视。

> 注意：
>
> - 若修改的是`ref`定义的**对象中的属性**，`newValue` 和 `oldValue` 都是新值，因为它们是同一个对象。
> - 若修改**整个**`ref`定义的对象，`newValue` 是新值， `oldValue` 是旧值，因为不是同一个对象了。

其实就是看地址是否发生变化了，地址变化了就不是同一个值

```vue
<template>
  <div class="person">
    <h1>情况二：监视【ref】定义的【对象类型】数据</h1>
    <h2>姓名：{{ person.name }}</h2>
    <h2>年龄：{{ person.age }}</h2>
    <button @click="changeName">修改名字</button>
    <button @click="changeAge">修改年龄</button>
    <button @click="changePerson">修改整个人</button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
// 数据
let person = ref({
  name: "张三",
  age: 18,
});
// 方法
function changeName() {
  person.value.name += "~";
}
function changeAge() {
  person.value.age += 1;
}
function changePerson() {
  person.value = { name: "李四", age: 90 };
}
/* 
    监视，情况一：监视【ref】定义的【对象类型】数据，监视的是对象的地址值，若想监视对象内部属性的变化，需要手动开启深度监视
    watch的第一个参数是：被监视的数据
    watch的第二个参数是：监视的回调
    watch的第三个参数是：配置对象（deep、immediate等等.....） 
  */
watch(
  person,
  (newValue, oldValue) => {
    console.log("person变化了", newValue, oldValue);
  },
  { deep: true },
);
</script>
```

### 3.7.3 情况三

::: danger 注意

`watch()` 通常是浅层监听，`deep` 选项默认是 `false`；但把响应式对象直接作为数据源时会隐式启用深层监听。Vue 3.5+ 允许把 `deep` 设为数字，用它限制深层遍历的最大层级，而不是表示“默认就是 true”。深层监听需要遍历嵌套属性，大型数据结构应谨慎使用。

:::

监视`reactive`定义的【对象类型】数据，且**默认开启了深度监视**。

```vue
<template>
  <div class="person">
    <h1>情况三：监视【reactive】定义的【对象类型】数据</h1>
    <h2>姓名：{{ person.name }}</h2>
    <h2>年龄：{{ person.age }}</h2>
    <button @click="changeName">修改名字</button>
    <button @click="changeAge">修改年龄</button>
    <button @click="changePerson">修改整个人</button>
    <hr />
    <h2>测试：{{ obj.a.b.c }}</h2>
    <button @click="test">修改obj.a.b.c</button>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from "vue";
// 数据
let person = reactive({
  name: "张三",
  age: 18,
});
let obj = reactive({
  a: {
    b: {
      c: 666,
    },
  },
});
// 方法
function changeName() {
  person.name += "~";
}
function changeAge() {
  person.age += 1;
}
function changePerson() {
  Object.assign(person, { name: "李四", age: 80 });
}
function test() {
  obj.a.b.c = 888;
}

// 监视，情况三：监视【reactive】定义的【对象类型】数据，且默认是开启深度监视的
watch(person, (newValue, oldValue) => {
  // 嵌套属性变化时两者通常指向同一个代理对象
  console.log("person变化了", newValue, oldValue);
});
watch(obj, (newValue, oldValue) => {
  // 地址没变
  console.log("Obj变化了", newValue, oldValue);
});
</script>
```

### 3.7.4 情况四

监视`ref`或`reactive`定义的【对象类型】数据中的**某个属性**，注意点如下：

1. 若该属性值**不是**【对象类型】，需要写成函数形式。
2. 若该属性值仍是对象类型，建议使用 getter；默认只在 getter 返回了不同对象时触发，如需监听对象内部属性再显式设置 `deep`。

结论：监视的要是对象里的属性，那么最好写函数式，注意点：若是对象监视的是地址值，需要关注对象内部，需要手动开启深度监视。

```vue{45-47,51,55}
<template>
  <div class="person">
    <h1>情况四：监视【ref】或【reactive】定义的【对象类型】数据中的某个属性</h1>
    <h2>姓名：{{ person.name }}</h2>
    <h2>年龄：{{ person.age }}</h2>
    <h2>汽车：{{ person.car.c1 }}、{{ person.car.c2 }}</h2>
    <button @click="changeName">修改名字</button>
    <button @click="changeAge">修改年龄</button>
    <button @click="changeC1">修改第一台车</button>
    <button @click="changeC2">修改第二台车</button>
    <button @click="changeCar">修改整个车</button>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from "vue";

// 数据
let person = reactive({
  name: "张三",
  age: 18,
  car: {
    c1: "奔驰",
    c2: "宝马",
  },
});
// 方法
function changeName() {
  person.name += "~";
}
function changeAge() {
  person.age += 1;
}
function changeC1() {
  person.car.c1 = "奥迪";
}
function changeC2() {
  person.car.c2 = "大众";
}
function changeCar() {
  person.car = { c1: "雅迪", c2: "爱玛" };
}

// 监视，情况四：监视响应式对象中的某个属性，且该属性是基本类型的，要写成函数式
watch(() => person.name, (newValue, oldValue) => {
  console.log("person.name变化了", newValue, oldValue);
});

// 监视，情况四：监视响应式对象中的某个属性，且该属性是对象类型的，可以直接写，也能写函数，更推荐写函数
watch(
  () => person.car,
  (newValue, oldValue) => {
    console.log("person.car变化了", newValue, oldValue);
  },
  { deep: true },
);
</script>
```

### 3.7.5 情况五

监视上述的多个数据

```vue{46-51}
<template>
  <div class="person">
    <h1>情况五：监视上述的多个数据</h1>
    <h2>姓名：{{ person.name }}</h2>
    <h2>年龄：{{ person.age }}</h2>
    <h2>汽车：{{ person.car.c1 }}、{{ person.car.c2 }}</h2>
    <button @click="changeName">修改名字</button>
    <button @click="changeAge">修改年龄</button>
    <button @click="changeC1">修改第一台车</button>
    <button @click="changeC2">修改第二台车</button>
    <button @click="changeCar">修改整个车</button>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from "vue";

// 数据
let person = reactive({
  name: "张三",
  age: 18,
  car: {
    c1: "奔驰",
    c2: "宝马",
  },
});
// 方法
function changeName() {
  person.name += "~";
}
function changeAge() {
  person.age += 1;
}
function changeC1() {
  person.car.c1 = "奥迪";
}
function changeC2() {
  person.car.c2 = "大众";
}
function changeCar() {
  person.car = { c1: "雅迪", c2: "爱玛" };
}

// 监视，情况五：监视上述的多个数据
watch(
  [() => person.name, () => person.car],
  (newValue, oldValue) => {
    console.log("多个来源变化了", newValue, oldValue);
  },
  { deep: true },
);
</script>
```

## 3.8 watchEffect 监视

官网：立即运行一个函数，同时响应式地追踪其依赖，并在依赖更改时重新执行该函数。

:::warning `watch`对比`watchEffect`

1. 都能监听响应式数据的变化，不同的是监听数据变化的方式不同
2. `watch`：要**明确指出**监视的数据
3. `watchEffect`：立即执行回调，并自动追踪回调同步执行期间读取的响应式依赖。异步回调只会追踪第一个 `await` 之前读取的依赖。

:::

示例代码：

```vue{36-47}
<template>
  <div class="person">
    <h1>需求：水温达到50℃，或水位达到20cm，则联系服务器</h1>
    <h2 id="demo">水温：{{ temp }}</h2>
    <h2>水位：{{ height }}</h2>
    <button @click="increaseTemp">水温+10</button>
    <button @click="increaseHeight">水位+10</button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, watchEffect } from "vue";
// 数据
const temp = ref(0);
const height = ref(0);

// 方法
function increaseTemp() {
  temp.value += 10;
}
function increaseHeight() {
  height.value += 10;
}

// 用watch实现，需要明确的指出要监视：temp、height
watch([temp, height], ([newTemp, newHeight]) => {
  // 室温达到50℃，或水位达到20cm，立刻联系服务器
  if (newTemp >= 50 || newHeight >= 20) {
    console.log("联系服务器");
  }
});

// 用 watchEffect 实现时，不需要重复列出依赖
const stopWatchEffect = watchEffect(() => {
  // 室温达到50℃，或水位达到20cm，立刻联系服务器
  if (temp.value >= 50 || height.value >= 20) {
    console.log("联系服务器");
  }
  // 水温达到100，或水位达到50，取消监视
  if (temp.value >= 100 || height.value >= 50) {
    console.log("清理了");
    stopWatchEffect();
  }
});
</script>
```

上例为了对比同时写出了 `watch()` 和 `watchEffect()`，实际业务通常选择其中一种，否则同一条件可能执行两次副作用。同步创建于 `setup` 中的监听器会在组件卸载时自动停止；只有确实需要提前结束时才调用返回的停止句柄。

## 参考资料

- [Vue：计算属性](https://cn.vuejs.org/guide/essentials/computed)
- [Vue：侦听器](https://cn.vuejs.org/guide/essentials/watchers)
- [Vue：响应式 API（核心）](https://cn.vuejs.org/api/reactivity-core)
## 3.9 标签的 ref 属性

同一页面中的 `id` 应保持唯一；组件边界不会为重复 `id` 自动创建隔离作用域。模板 ref 则归属于当前组件实例，更适合在组件内安全地访问元素或子组件。

作用：用于注册模板引用。（给节点打标识）

- 用在普通`DOM`标签上，获取的是`DOM`节点。
- 用在组件标签上，获取的是子组件公开实例；使用 `<script setup>` 的子组件默认是私有的，只有通过 `defineExpose()` 暴露的成员才能从父组件 ref 访问。

用在普通`DOM`标签上：

```vue{3-5,14-16}
<template>
  <div class="person">
    <h1 ref="title1">尚硅谷</h1>
    <h2 ref="title2">前端</h2>
    <h3 ref="title3">Vue</h3>
    <input type="text" ref="inpt" /> <br /><br />
    <button @click="showLog">点我打印内容</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const title1 = ref<HTMLHeadingElement | null>(null);
const title2 = ref<HTMLHeadingElement | null>(null);
const title3 = ref<HTMLHeadingElement | null>(null);

function showLog() {
  console.log(title1.value?.innerText);
  console.log(title2.value?.innerText);
  console.log(title3.value?.innerText);
}
</script>
```

用在组件标签上：

```vue{3,11,23,24,27}
<!-- 父组件App.vue -->
<template>
  <Person ref="ren" />
  <button @click="test">测试</button>
</template>

<script setup lang="ts">
import Person from "./components/Person.vue";
import { ref } from "vue";

const ren = ref<InstanceType<typeof Person> | null>(null);

function test() {
  console.log(ren.value?.name);
  console.log(ren.value?.age);
}
</script>

<!-- 子组件Person.vue中要使用defineExpose暴露内容 -->
<script setup lang="ts">
import { ref } from "vue";
// 数据
const name = ref("张三");
const age = ref(18);

// 使用defineExpose将组件中的数据交给外部
defineExpose({ name, age });
</script>
```

:::info 局部样式

`scoped` 会为当前组件模板中的元素和样式选择器添加作用域标记，从而限制普通选择器的匹配范围。它不是浏览器原生 Shadow DOM：父组件的 scoped 样式仍可能影响子组件根元素，如需选择子组件内部内容应显式使用 `:deep()`。

```vue
<style scoped>
.title {
  color: royalblue;
}
</style>
```

:::

## 3.10 回顾 TypeScript

```typescript
// types.ts
export interface PersonInter {
  id: string;
  name: string;
  age: number;
}

export type Persons = PersonInter[];
export const a = 1;
```

```typescript
// Person.vue 的 <script setup lang="ts"> 中
import { a, type PersonInter, type Persons } from "@/types";

const person: PersonInter = { id: "1", name: "aaa", age: 18 };

// 以下三种数组类型写法等价，示例使用不同变量名以避免重复声明
const personsA: Array<PersonInter> = [person];
const personsB: PersonInter[] = [person];
const personsC: Persons = [person];

console.log(a, personsA, personsB, personsC);
```

## 3.11 props 组件通信

::: danger 再次回顾

没有 `v-bind` 的 prop 值按静态字符串传递，例如 `list="persons"` 传入字符串；写成 `:list="persons"` 才会求值当前组件中的 `persons` 表达式并传入数组。props 遵循单向数据流：父组件更新会向下传递，子组件不应直接修改收到的 prop。

:::

```ts
// index.ts
// 定义一个接口，限制每个Person对象的格式
export interface PersonInter {
  id:string,
  name:string,
  age:number
}

// 定义一个自定义类型Persons
export type Persons = Array<PersonInter>
```

在`App.vue`中代码：

```vue
<template>
  <!-- // 绑定persons到list 加`:`表示绑定 不加则视为`"persons"`字符串-->
  <Person :list="persons" />
</template>

<script setup lang="ts">
import Person from "./components/Person.vue";
import { ref } from "vue";
import type { Persons } from "./types";

const persons = ref<Persons>([
  { id: "e98219e12", name: "张三", age: 18 },
  { id: "e98219e13", name: "李四", age: 19 },
  { id: "e98219e14", name: "王五", age: 20 },
]);
</script>
```

`Person.vue`中代码：

```vue
<template>
  <div class="person">
    <ul>
      <li v-for="item in props.list" :key="item.id">
        {{ item.name }}--{{ item.age }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { Persons } from "@/types";

const props = withDefaults(defineProps<{ list?: Persons }>(), {
  // 对象或数组默认值使用工厂函数，避免实例之间共享可变值
  list: () => [{ id: "asdasg01", name: "小猪佩奇", age: 18 }],
});
</script>
```

`withDefaults()` 在 Vue 3.5 并未弃用，仍适合为类型声明的 props 提供默认值并调整可选类型。Vue 3.5+ 还支持具有响应性的 props 解构，可以改写为：

```typescript
import type { Persons } from "@/types";

const { list = [{ id: "asdasg01", name: "小猪佩奇", age: 18 }] } =
  defineProps<{ list?: Persons }>();
```

同一个 `<script setup>` 中只能调用一次 `defineProps()`，上面两种写法应二选一，不能把多个示例同时堆进一个组件。

:::warning v-for的使用

```html
<div class="person">
  <ul>
    <li v-for="item in list" :key="item.id">
      <!-- list是数据源（也可以是遍历次数） -->
      <!-- item为数据源中每一项（可随意写名称）， -->
      <!-- key唯一标识 -->
      <!-- 优先使用稳定且唯一的业务标识；只有列表完全静态且不会重排时才考虑索引 -->
      {{item.name}}--{{item.age}}
    </li>
  </ul>
</div>
```

:::

## 3.12 Vue 3 生命周期

:::info `v-if`和`v-show`的区别

- `v-if`不展示，则删除结构
- `v-show`不展示，隐藏结构`display: none`
  :::

- 概念：`Vue`组件实例在创建时要经历一系列的初始化步骤，在此过程中`Vue`会在合适的时机，调用特定的函数，从而让开发者有机会在特定阶段运行自己的代码，这些特定的函数统称为：**生命周期钩子函数**

- 核心流程可以概括为创建、挂载、更新和卸载，但 Vue 还提供错误捕获、缓存组件激活/停用、服务端渲染等其他钩子，不能概括成“每个阶段固定只有前后两个钩子”。

:::info `Vue2`的生命周期：
创建阶段：`beforeCreate`、`created`
挂载阶段：`beforeMount`、`mounted`
更新阶段：`beforeUpdate`、`updated`
销毁阶段：`beforeDestroy`、`destroyed`
:::

:::info Vue 3 组合式 API 的核心生命周期：
创建阶段的逻辑直接在 `setup()` 或 `<script setup>` 顶层执行；`setup` 本身不是一个 `onXxx` 生命周期钩子。Vue 3 的 Options API 仍保留 `beforeCreate`、`created` 等选项。
挂载阶段：`onBeforeMount`、`onMounted`
更新阶段：`onBeforeUpdate`、`onUpdated`
卸载阶段：`onBeforeUnmount`、`onUnmounted`
:::

- 常用的钩子：`onMounted`(挂载完毕)、`onUpdated`(更新完毕)、`onBeforeUnmount`(卸载之前)

- 示例代码：

```vue{30}
<template>
  <div class="person">
    <h2>当前求和为：{{ sum }}</h2>
    <button @click="changeSum">点我sum+1</button>
  </div>
</template>

<!-- vue3写法 -->
<script setup lang="ts">
import {
  ref,
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted,
} from "vue";

// 数据
const sum = ref(0);
// 方法
function changeSum() {
  sum.value += 1;
}
// setup
console.log("setup");
// 生命周期钩子
onBeforeMount(() => {
  console.log("挂载之前");
});
onMounted(() => {
  console.log("挂载完毕");
});
onBeforeUpdate(() => {
  console.log("更新之前");
});
onUpdated(() => {
  console.log("更新完毕");
});
onBeforeUnmount(() => {
  console.log("卸载之前");
});
onUnmounted(() => {
  console.log("卸载完毕");
});
</script>
```

## 3.13 自定义 Hooks

> 什么是`hook`？有什么用

自定义 Hook 在 Vue 社区通常称为组合式函数（composable）：它是利用组合式 API 封装和复用有状态逻辑的函数，名称通常以 `use` 开头。它与 mixin 的目标相似，但依赖和返回值是显式的，避免了 mixin 常见的来源不明和命名冲突。

- 自定义`hook`的优势：复用代码, 让`setup`中的逻辑更清楚易懂。

:::warning axios的基本使用

```typescript
import axios from "axios";

interface DogResponse {
  message: string;
  status: string;
}

const dogList: string[] = [];
const dogUrl = "https://dog.ceo/api/breed/pembroke/images/random";

// 方法一：async/await
async function getDogWithAwait() {
  try {
    const { data } = await axios.get<DogResponse>(dogUrl);
    dogList.push(data.message);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(error.message);
    } else {
      console.error("未知错误", error);
    }
  }
}

// 方法二：Promise 链
function getDogWithPromise() {
  return axios
    .get<DogResponse>(dogUrl)
    .then(({ data }) => {
      dogList.push(data.message);
    })
    .catch((error: unknown) => {
      if (axios.isAxiosError(error)) {
        console.error(error.message);
      } else {
        console.error("未知错误", error);
      }
    });
}
```

`axios.get()` 返回 Promise，不能在没有 `await` 的情况下直接写 `let { data } = axios.get(...)`；Promise 链应从 `.then()` 回调参数中读取响应值。

:::

示例代码：

`useSum.ts`中内容如下：

```typescript
import { ref, onMounted } from "vue";

export default function useSum() {
  const sum = ref(0);

  const increment = () => {
    sum.value += 1;
  };
  const decrement = () => {
    sum.value -= 1;
  };
  onMounted(() => {
    increment();
  });

  //向外部暴露数据
  return { sum, increment, decrement };
}
```

`useDog.ts`中内容如下：

```typescript
import { onMounted, ref } from "vue";
import axios from "axios";

interface DogResponse {
  message: string;
  status: string;
}

export default function useDog() {
  const dogList = ref<string[]>([]);
  const isLoading = ref(false);
  const errorMessage = ref("");

  async function getDog() {
    isLoading.value = true;
    errorMessage.value = "";

    try {
      const { data } = await axios.get<DogResponse>(
        "https://dog.ceo/api/breed/pembroke/images/random",
      );
      dogList.value.push(data.message);
    } catch (error) {
      errorMessage.value = axios.isAxiosError(error)
        ? error.message
        : "获取图片时发生未知错误";
    } finally {
      isLoading.value = false;
    }
  }

  onMounted(() => {
    void getDog();
  });

  return { dogList, isLoading, errorMessage, getDog };
}
```

组件中具体使用：

```vue
<template>
  <h2>当前求和为：{{ sum }}</h2>
  <button @click="increment">点我+1</button>
  <button @click="decrement">点我-1</button>
  <hr />
  <img
    v-for="(url, index) in dogList"
    :key="`${url}-${index}`"
    :src="url"
    alt="随机柯基犬"
  />
  <span v-if="isLoading">加载中……</span>
  <span v-else-if="errorMessage">{{ errorMessage }}</span>
  <br />
  <button :disabled="isLoading" @click="getDog">再来一只狗</button>
</template>

<script setup lang="ts">
import useSum from "./hooks/useSum";
import useDog from "./hooks/useDog";

defineOptions({ name: "App" });

const { sum, increment, decrement } = useSum();
const { dogList, isLoading, errorMessage, getDog } = useDog();
</script>
```

组合式函数如果要注册 `onMounted()` 等组件生命周期钩子，应在组件 `setup()` 或 `<script setup>` 的同步执行阶段调用。

## 参考资料

- [Vue：模板引用](https://cn.vuejs.org/guide/essentials/template-refs)
- [Vue：Props](https://cn.vuejs.org/guide/components/props)
- [Vue：生命周期钩子](https://cn.vuejs.org/guide/essentials/lifecycle)
- [Vue：组合式函数](https://cn.vuejs.org/guide/reusability/composables)
- [Axios：处理错误](https://axios-http.com/docs/handling_errors)
## 4. 路由

> 为什么需要路由？

实现SPA（single page web application 单页面应用）

官方文档：https://router.vuejs.org/zh/

### 4.1 安装 Vue Router

```powershell
npm i vue-router
```

### 4.2 路由基本切换效果

路由配置文件代码如下：

```ts{2,8,20}
// router/index.ts
import { createRouter, createWebHistory } from "vue-router";
import Home from "@/pages/Home.vue";
import News from "@/pages/News.vue";
import About from "@/pages/About.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/home",
      component: Home,
    },
    {
      path: "/about",
      component: About,
    },
    {
      path: "/news",
      component: News,
    },
  ],
});
export default router;
```

`main.ts`代码如下：

```js
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router/index";

const app = createApp(App);
app.use(router);
app.mount("#app");
```

`App.vue`代码如下：

```vue{6,12}
<template>
  <div class="app">
    <h2 class="title">Vue路由测试</h2>
    <!-- 导航区 -->
    <div class="navigate">
      <RouterLink to="/home" active-class="active">首页</RouterLink>
      <RouterLink to="/news" active-class="active">新闻</RouterLink>
      <RouterLink to="/about" active-class="active">关于</RouterLink>
    </div>
    <!-- 展示区 -->
    <div class="main-content">
      <RouterView></RouterView>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { RouterLink, RouterView } from "vue-router";
</script>
```

1. 路由组件通常存放在`pages` 或 `views`文件夹，一般组件通常存放在`components`文件夹。
2. 通过点击导航，视觉效果上“消失” 了的路由组件，默认是被**卸载**掉的，需要的时候再去**挂载**。

### 4.3 路由器工作模式

1. `history`模式

- 优点：`URL`更加美观，不带有`#`，更接近传统的网站`URL`。
- 缺点：后期项目上线，需要服务端配合处理路径问题，否则刷新会有`404`错误。

```js
const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
});
```

2. `hash`模式

- 优点：`#` 后的片段不会发送给服务器，静态服务器通常无需为前端路由配置回退规则。
- 缺点：URL 含 `#`，服务端无法直接看到片段中的路由。搜索引擎对 JavaScript 应用的处理能力不同，SEO 不能只由 history/hash 模式下结论。

```js
const router = createRouter({
  history: createWebHashHistory(), //hash模式
  /******/
});
```

### 4.4 to 的两种写法（重点）

```html
<!-- 第一种：to的字符串写法 -->
<router-link active-class="active" to="/home">主页</router-link>

<!-- 第二种：to的对象写法 -->
<router-link active-class="active" :to="{ path: '/home' }">Home</router-link>
```

### 4.5 命名路由

> 作用：可以简化路由跳转及传参。

给路由规则命名：

```js
routes: [
  {
    name: "zhuye",
    path: "/home",
    component: Home,
  },
  {
    name: "xinwen",
    path: "/news",
    component: News,
  },
  {
    name: "guanyu",
    path: "/about",
    component: About,
  },
];
```

```html
<!-- 对于to的写法 -->
<!-- 第一种：to的字符串写法（路径跳转） -->
<router-link active-class="active" to="/home">主页</router-link>

<!-- 第二种：to的对象写法（路径跳转） -->
<router-link active-class="active" :to="{ path: '/home' }">Home</router-link>

<!-- to的对象写法（名字跳转） -->
<router-link active-class="active" :to="{ name: 'zhuye' }">Home</router-link>
```

### 4.6 嵌套路由

1. 编写`News`的子路由：`Detail.vue`

2. 配置路由规则，使用`children`配置项：

```ts
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      name: "zhuye",
      path: "/home",
      component: Home,
    },
    {
      name: "xinwen",
      path: "/news",
      component: News,
      children: [
        {
          name: "xiang",
          path: "detail", // 不需要写'/'
          component: Detail,
        },
      ],
    },
    {
      name: "guanyu",
      path: "/about",
      component: About,
    },
  ],
});
export default router;
```

3. 跳转路由（记得要加完整路径）：

```html
<router-link to="/news/detail">xxxx</router-link>
<!-- 或 -->
<router-link :to="{ path: '/news/detail' }">xxxx</router-link>
```

4. 子路由会渲染到父路由组件的 `<RouterView>`，因此这里应在 `News.vue` 中预留出口，而不是放到无关的 `Home.vue`。

```vue
<template>
  <div class="news">
    <nav class="news-list">
      <RouterLink
        v-for="news in newsList"
        :key="news.id"
        :to="{ path: '/news/detail' }"
      >
        {{ news.name }}
      </RouterLink>
    </nav>
    <div class="news-detail">
      <RouterView />
    </div>
  </div>
</template>
```

## 4.7 路由传参：query 参数

:::warning 路由组件传参
这里讲的都是路由组件传参，一般组件可以直接在组件上面传
:::

1.  传递参数

```html
<!-- 字符串写法必须包含参数名并正确编码；URLSearchParams 可代为编码 -->
<RouterLink :to="buildDetailUrl(news)">
  {{ news.title }}
</RouterLink>

<!-- 跳转并携带query参数（to的对象写法） -->
<RouterLink
  :to="{
    path: '/news/detail',
    query: {
      id: news.id,
      title: news.title,
      content: news.content,
    },
  }"
>
  {{ news.title }}
</RouterLink>
```

```ts
function buildDetailUrl(news: { id: string; title: string; content: string }) {
  const query = new URLSearchParams({
    id: news.id,
    title: news.title,
    content: news.content,
  });
  return `/news/detail?${query.toString()}`;
}
```

2.  接收参数：

```js
import { useRoute } from "vue-router";
const route = useRoute();
// 打印query参数
console.log(route.query);
```

`route.query` 的值可能是 `string | null`，重复的同名参数还可能得到数组；使用前应按业务需要做类型收窄和运行时校验。对象写法会交给路由器编码，通常比手工拼接 URL 更安全。

## 4.8 路由传参：params 参数

:::danger 注意点

1. 需要在路由配置占位（占位用什么名字 拿值的时候就写什么名字）
2. 传递`params`参数时，若使用`to`的对象写法，必须使用`name`配置项，不能用`path`。
3. params 会被序列化进路径，只应传字符串、数字、`null`/`undefined`，或为可重复参数传这类值的数组；不能把任意业务对象当作隐藏数据传递。

:::

3. 传递参数

```html
<!-- 跳转并携带params参数（to的字符串写法） -->
<RouterLink :to="`/news/detail/001/新闻001/内容001`">{{news.title}}</RouterLink>

<!-- 跳转并携带params参数（to的对象写法） -->
<RouterLink
  :to="{
    name: 'xiang', //用name跳转
    params: {
      id: news.id,
      title: news.title,
      content: news.title,
    },
  }"
>
  {{ news.title }}
</RouterLink>
```

2. 接收参数：

```js
import { useRoute } from "vue-router";
const route = useRoute();
// 打印params参数
console.log(route.params);
```

## 4.9 路由规则的 props 配置

> 在路由规则(index.ts)当中配置

作用：让路由组件**更方便**的收到参数（可以将路由参数作为`props`传给组件）

```ts
import type { RouteRecordRaw } from "vue-router";
import Detail from "@/pages/Detail.vue";

// 三种模式是互斥选项，一个路由记录只能选择其中一种 props 值。
const booleanMode: RouteRecordRaw = {
  name: "detail-by-params",
  path: "/detail/:id",
  component: Detail,
  props: true, // 把 route.params 作为 props
};

const functionMode: RouteRecordRaw = {
  name: "detail-by-query",
  path: "/detail",
  component: Detail,
  props: (route) => ({ id: route.query.id }),
};

const objectMode: RouteRecordRaw = {
  name: "detail-static",
  path: "/detail/static",
  component: Detail,
  props: { mode: "preview" }, // 固定的静态 props
};
```

## 4.10 replace 属性

作用：控制路由跳转时操作浏览器历史记录的模式。

浏览器的历史记录有两种写入方式：分别为`push`和`replace`：

- `push`是追加历史记录（默认）。
- `replace`是替换当前记录。

开启`replace`模式：

```html
<RouterLink replace to="/news">News</RouterLink>
```

## 4.11 编程式导航

> 需求：看三秒钟首页，立刻跳转到新的页面

编程式导航用于在事件或业务逻辑中调用路由器跳转。Composition API 的 `useRoute()`、`useRouter()` 分别提供当前路由和路由器实例；Options API 中的 `$route`、`$router` 仍然可用。组件内组合式守卫也不会替代全局守卫或路由独享守卫。

```ts
import { useRouter } from "vue-router";

const router = useRouter();

function showNewsDetails(news: { id: string; title: string; content: string }) {
  router.push({
    name: "xiang",
    query: {
      id: news.id,
      title: news.title,
      content: news.content,
    },
  });
}
```

## 4.12 重定向

作用：将特定的路径，重新定向到已有路由。

```javascript
const rootRedirect = {
  path: "/",
  redirect: "/about",
};
```

## 5. Pinia

> 什么是pinia？

Pinia 是 Vue 的状态管理库，用于在组件之外集中保存共享状态和相关业务逻辑，并提供类型推断、开发工具和插件扩展能力。

实现这个效果：

<img src="/assert/assets-heima/pinia_example.gif" alt="pinia_example" style="zoom:30%;border:3px solid" />

### 5.1 搭建 Pinia 环境

1. 安装pinia：`npm install pinia`
2. 操作`src/main.ts`

```ts
import { createApp } from "vue";
import App from "./App.vue";

/* 引入createPinia，用于创建pinia */
import { createPinia } from "pinia";

/* 创建pinia */
const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.mount("#app");
```

### 5.2 存储 + 读取数据

> 要把哪些数据存储到pinia

1. `Store`是一个保存：**状态**、**业务逻辑** 的实体，每个组件都可以**读取**、**写入**它。
2. 它有三个概念：`state`、`getter`、`action`，相当于组件中的： `data`、 `computed` 和 `methods`。
3. 例如把 Store 写在 `src/stores/count.ts`。目录和文件名只是项目约定，不要求与组件同名；真正必须在同一个 Pinia 实例中保持唯一的是 `defineStore()` 的 id。

```ts
// 引入defineStore用于创建store
import { defineStore } from "pinia";

// 定义并暴露一个store
export const useCountStore = defineStore("count", {
  // 第一个参数是id值，第二个参数是配置对象

  // 动作
  actions: {},
  // 状态 真正存储数据的地方
  state() {
    return {
      sum: 6,
      school: "atguigu",
    };
  },
  // 计算
  getters: {},
});
```

你可以认为 state 是 store 的数据 (data)，getters 是 store 的计算属性 (computed)，而 actions 则是方法 (methods)。

也可以使用Setup Store的写法:

```ts
import { computed, ref } from "vue";
import { defineStore } from "pinia";

export const useCounterStore = defineStore("counter", () => {
  const count = ref(0);
  const name = ref("Eduardo");
  const doubleCount = computed(() => count.value * 2);
  function increment() {
    count.value++;
  }

  return { count, name, doubleCount, increment };
});
```

在 Setup Store 中：

- ref() 就是 state 属性
- computed() 就是 getters
- function() 就是 actions

Setup Store 中应返回需要由 Pinia 管理的全部状态；私藏未返回的状态会影响 SSR、开发工具和插件行为。

4. 具体编码：`src/store/talk.ts`

```js
// 引入defineStore用于创建store
import { defineStore } from "pinia";

// 定义并暴露一个store
export const useTalkStore = defineStore("talk", {
  // 动作
  actions: {},
  // 状态
  state() {
    return {
      talkList: [
        { id: "yuysada01", content: "你今天有点怪，哪里怪？怪好看的！" },
        { id: "yuysada02", content: "草莓、蓝莓、蔓越莓，你想我了没？" },
        { id: "yuysada03", content: "心里给你留了一块地，我的死心塌地" },
      ],
    };
  },
  // 计算
  getters: {},
});
```

:::warning 注意点
当 ref 作为普通响应式对象的属性被访问时，Vue 会自动解包，因此下面的 `obj.c` 得到数值。数组和原生集合中的 ref 不会按同样规则自动解包。

```javascript
import { reactive, ref } from "vue";

let obj = reactive({
  a: 1,
  b: 2,
  c: ref(3),
});

console.log(obj.a);
console.log(obj.b);
console.log(obj.c);
```

:::

5. 组件中使用`state`中的数据

```vue
<template>
  <h2>当前求和为：{{ sumStore.sum }}</h2>
</template>

<script setup lang="ts">
// 引入对应的useXxxxxStore
import { useCountStore } from "@/stores/count";

// 调用useXxxxxStore得到对应的store
const sumStore = useCountStore();
</script>
```

```vue
<template>
  <ul>
    <li v-for="talk in talkStore.talkList" :key="talk.id">
      {{ talk.content }}
    </li>
  </ul>
</template>

<script setup lang="ts">
import { useTalkStore } from "@/stores/talk";

const talkStore = useTalkStore();
</script>
```

### 5.3 修改数据(三种方式)

1. 第一种修改方式，直接修改（直接改）

```ts
countStore.sum = 666;
```

2. 第二种修改方式：批量修改

```ts
countStore.$patch({
  sum: 999,
  school: "atguigu",
});
```

3. 第三种修改方式：借助`action`修改（`action`中可以编写一些业务逻辑）

```ts
import { defineStore } from "pinia";

export const useCountStore = defineStore("count", {
  state: () => ({ sum: 6, school: "atguigu" }),
  actions: {
    increment(value: number) {
      if (this.sum < 10) {
        this.sum += value;
      }
    },
    decrement(value: number) {
      if (this.sum > 1) {
        this.sum -= value;
      }
    },
  },
});
```

4. 组件中调用`action`即可

```ts
import { ref } from "vue";
import { useCountStore } from "@/stores/count";

// 使用countStore
const countStore = useCountStore();
const n = ref(1);

// 调用对应action
countStore.increment(n.value);
```

## 5.4 storeToRefs

- `storeToRefs(store)` 为 Store 的响应式 state、getters 以及插件添加的响应式属性创建 ref，便于安全解构。
- 它会忽略 actions 和非响应式属性；直接对整个 Store 使用 Vue 的 `toRefs()` 会按可枚举属性逐项转换，可能把方法也包装成 ref，因此应优先使用 Pinia 的专用 API。

```vue
<template>
  <div class="count">
    <h2>当前求和为：{{ sum }}</h2>
  </div>
</template>

<script setup lang="ts">
import { useCountStore } from "@/store/count";
/* 引入storeToRefs */
import { storeToRefs } from "pinia";

/* 得到countStore */
const countStore = useCountStore();
/* 使用storeToRefs转换countStore，随后解构 */
const { sum } = storeToRefs(countStore);
</script>
```

## 5.5 Getters

1. 概念：当`state`中的数据，需要经过处理后再使用时，可以使用`getters`配置。
2. 追加`getters`配置。

```ts
// 引入defineStore用于创建store
import { defineStore } from "pinia";

// 定义并暴露一个store
export const useCountStore = defineStore("count", {
  // 动作
  actions:{
    /************/
  },
  // 状态
  state(){
    return {
      sum: 1,
      school: "atguigu",
    };
  },
  // 计算
  getters:{
    bigSum: (state): number => state.sum * 10,
    upperSchool(): string {
      return this.school.toUpperCase();
    },
  },
});
```

3. 组件中读取数据：

```js
const { increment, decrement } = countStore;
let { sum, school, bigSum, upperSchool } = storeToRefs(countStore);
```

:::info getters和actions的区别

在 Pinia 里可以这样理解：

- **getters**：算结果 “计算属性”（读数据）
- **actions**：做事情 “方法”（改数据 + 异步 + 业务逻辑）

1. getters

**作用**：根据 state 派生出新值，通常用于读取和展示。
**特点**：

- 有缓存（依赖不变就不重复算）
- 不应该做副作用（比如请求接口、改 state）
- 类似 Vue 的 `computed`

```ts
import { defineStore } from "pinia";

export const useCounterStore = defineStore("counter", {
  state: () => ({ count: 0 }),
  getters: {
    doubleCount: (state) => state.count * 2,
  },
});
```

2. actions

**作用**：执行业务逻辑、修改 state、发请求。
**特点**：

- 可以是同步或异步（`async/await`）
- 可以直接 `this.count++`
- 可以调用其他 action

```ts
import { defineStore } from "pinia";

export const useUserStore = defineStore("user", {
  state: () => ({ count: 0, user: null as unknown }),
  actions: {
    increment() {
      this.count++;
    },
    async fetchUser() {
      const response = await fetch("/api/user");
      if (!response.ok) throw new Error("用户数据加载失败");
      this.user = await response.json();
    },
  },
});
```

:::

## 5.6 $subscribe 订阅

通过 store 的 `$subscribe()` 方法侦听 `state` 及其变化。（类似于`watch`）

```ts
talkStore.$subscribe((mutation, state) => {
  console.log("LoveTalk", mutation, state);
  localStorage.setItem("talkList", JSON.stringify(state.talkList));
});
```

在组件的 `setup()` 中创建的订阅默认会随组件卸载而停止；如果订阅需要脱离组件生命周期持续存在，可传入 `{ detached: true }`，并自行管理清理时机。浏览器存储还应处理配额、隐私模式和 JSON 损坏等异常。

## 5.7 Store 组合式写法

```ts
import { defineStore } from "pinia";
import axios from "axios";
import { nanoid } from "nanoid";
import { ref } from "vue";

type Talk = { id: string; title: string };

function loadTalks(): Talk[] {
  try {
    const raw = localStorage.getItem("talkList");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const useTalkStore = defineStore("talk", () => {
  // talkList就是state
  const talkList = ref<Talk[]>(loadTalks());

  // getATalk函数相当于action
  async function getATalk() {
    // 发请求，下面这行的写法是：连续解构赋值+重命名
    const {
      data: { content: title },
    } = await axios.get("https://api.uomg.com/api/rand.qinghua?format=json");
    // 把请求回来的字符串，包装成一个对象
    const obj = { id: nanoid(), title };
    // 放到数组中
    talkList.value.unshift(obj);
  }
  return { talkList, getATalk };
});
```

## 6. 组件通信

**`Vue3`组件通信和`Vue2`的区别：**

- Vue 3 移除了组件实例上的 `$on`、`$off` 和 `$once` 事件总线 API；需要事件发射器时可以选用 `mitt`，但它不是 Vue 强制内置的替代品。

* Pinia 已成为 Vue 官方推荐的新项目状态管理库；Vuex 3/4 仍会维护，只是不太可能再增加新功能，已有 Vuex 项目不等于必须立即迁移。
* 把`.sync`优化到了`v-model`里面了。
* 把`$listeners`所有的东西，合并到`$attrs`中了。
* `$children`被砍掉了。

**常见搭配形式：**

<img src="/assert/assets-heima/image-20231119185900990.png" alt="image-20231119185900990" style="zoom:60%;" />

### 6.1 通信方式-props

概述：`props`是使用频率最高的一种通信方式，常用与 ：**父 ↔ 子**。

- 若 **父传子**：属性值是**非函数**。
- 若 **子传父**：属性值是**函数**。 (不建议使用，建议用`emit`)
- 尽量不要出现父传孙

父组件：

```vue{6,14,17-19}
<template>
  <div class="father">
    <h3>父组件，</h3>
    <h4>我的车：{{ car }}</h4>
    <h4>儿子给的玩具：{{ toy }}</h4>
    <Child :car="car" :getToy="getToy" />
  </div>
</template>

<script setup lang="ts">
import Child from "./Child.vue";
import { ref } from "vue";
// 数据
const car = ref("奔驰");
const toy = ref("");
// 方法
function getToy(value: string) {
  toy.value = value;
}
</script>
```

子组件

```vue{6,12,14}
<template>
  <div class="child">
    <h3>子组件</h3>
    <h4>我的玩具：{{ toy }}</h4>
    <h4>父给我的车：{{ car }}</h4>
    <button @click="getToy(toy)">玩具给父亲</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
const toy = ref("奥特曼");

defineProps(["car", "getToy"]);
</script>
```

### 6.2 通信方式-自定义事件 emit

:::info 补充
`$event`是是什么？

- 对于原生事件，`$event`就是原生事件对象，包含事件发生时的一些信息（DOM）,可以`.target`获取事件源。
- 对于自定义事件，`$event`就是触发事件时，所传递的数据，不可以`.target`。

:::

1. 概述：自定义事件常用于：**子 => 父**。
2. 注意区分好：原生事件、自定义事件。

- 原生事件：
  - 事件名由 DOM 规范定义，例如 `click`、`mouseenter` 等。
  - `$event` 是相应的原生事件对象，可以读取 `target`、`currentTarget`、指针坐标或 `key` 等与事件类型匹配的信息；`keyCode` 已废弃。
- 自定义事件：
  - 事件名是任意名称
  - <strong style="color:skyblue">事件对象`$event`: 是调用`emit`时所提供的数据，可以是任意类型！！！</strong >

3. 示例：

```vue
<!--在父组件中，给子组件绑定自定义事件：-->
<!-- 为子组件绑定的是send-toy -->
<!-- 当事件触发时，会调用saveToy方法 -->
<Child @send-toy="saveToy" />
...
<script setup lang="ts">
import { ref } from "vue";

const toy = ref("");
function saveToy(value:string) {
  console.log("saveToy", value);
  toy.value = value;
}
</script>
```

```vue
<!--子组件-->
<!-- 调用的是 emit('send-toy'),使用 emit('send-toy') 触发send-toy事件 -->
<!-- 这里会把toy作为参数传递绑定的事件 -->
<button @click="emit('send-toy', toy)">测试</button>
<!-- 子组件中，触发事件：  -->
<script setup lang="ts">
import { ref } from "vue";

const toy = ref("奥特曼");

// Vue 3.3+ 可使用具名元组声明事件及参数类型
const emit = defineEmits<{
  "send-toy": [value: string];
}>();
</script>
```

### 6.3 通信方式-mitt （用得少）

概述：与消息订阅与发布（`pubsub`）功能类似，可以实现任意组件间通信。

1. 安装`mitt`: `npm i mitt`

2. 新建文件：`src\utils\emitter.ts`

```typescript
// 引入mitt
import mitt from "mitt";

type Events = {
  "send-toy": string;
};

// 创建emitter
const emitter = mitt<Events>();

/*
  // 绑定事件 on
  emitter.on('abc',(value)=>{
    console.log('abc事件被触发',value)
  })
  emitter.on('xyz',(value)=>{
    console.log('xyz事件被触发',value)
  })

  setInterval(() => {
    // 触发事件 emit
    emitter.emit('abc',666)
    emitter.emit('xyz',777)
  }, 1000);

  // 解绑事件 off

  setTimeout(() => {
    // 清理全部事件
    emitter.all.clear()
  }, 3000);
*/

// 创建并暴露mitt
export default emitter;
```

接收数据的组件中：绑定事件、同时在销毁前解绑事件：

```typescript
import emitter from "@/utils/emitter";
import { onUnmounted } from "vue";

const handleSendToy = (value: string) => {
  console.log("send-toy事件被触发", value);
};

// 绑定事件
emitter.on("send-toy", handleSendToy);

onUnmounted(() => {
  // 在组件卸载时解绑事件
  emitter.off("send-toy", handleSendToy);
});
```

提供数据的组件，在合适的时候触发事件

```typescript
import emitter from "@/utils/emitter";
import { ref } from "vue";

const toy = ref("奥特曼");

function sendToy() {
  // 触发事件
  emitter.emit("send-toy", toy.value);
}
```

解绑时应传入与订阅时相同的处理函数引用。直接清空某一事件或整个 `emitter.all` 会影响其他组件的监听器，通常不应由单个组件随意执行。

### 6.4 通信方式-v-model （组件库大量使用）

1. 概述：实现 **父↔子** 之间相互通信。
2. 前序知识 —— `v-model`的本质

```vue
<!-- 使用v-model指令 -->
<!-- v-model用在html标签上是双向绑定 -->
<input type="text" v-model="userName" />

<!-- html标签上v-model的本质（底层实现） -->
<!-- <input type="text" :value="userName" @input="userName = ($event.currentTarget as HTMLInputElement).value" /> -->
```

3. 组件标签上的 `v-model` 默认对应 `modelValue` prop 与 `update:modelValue` 事件，也就是 props 与 emit 的组合。

```vue
<!-- 如何实现在组件标签上使用v-model指令 -->
<AtguiguInput v-model="userName" />

<!-- 组件标签上v-model的本质 -->
<!-- 相当于v-bind:modelValue="userName" 单向绑定 传递modelValue -->
<!-- @update:modelValue="userName = $event" 自定义事件 update:modelValue为事件名 -->
<AtguiguInput
  :model-value="userName"
  @update:model-value="userName = $event"
/>
```

`AtguiguInput.vue` 中可以手动实现这项约定：

```vue
<template>
  <div class="box">
    <input type="text" :value="props.modelValue" @input="onInput" />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

function onInput(event: Event) {
  const input = event.currentTarget as HTMLInputElement;
  emit("update:modelValue", input.value);
}
</script>
```

Vue 3.4+ 推荐使用稳定的 `defineModel()` 宏简化同一逻辑：

```vue
<script setup lang="ts">
const model = defineModel<string>({ required: true });
</script>

<template>
  <input v-model="model" />
</template>
```

4. 也可以更换`value`，例如改成`abc`

```vue
<!-- 也可以更换value，例如改成abc-->
<AtguiguInput v-model:abc="userName" />

<!-- 上面代码的本质如下 -->
<AtguiguInput :abc="userName" @update:abc="userName = $event" />
```

`AtguiguInput`组件中：

```vue
<template>
  <div class="box">
    <input type="text" :value="props.abc" @input="onInput" />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ abc: string }>();
const emit = defineEmits<{
  "update:abc": [value: string];
}>();

function onInput(event: Event) {
  const input = event.currentTarget as HTMLInputElement;
  emit("update:abc", input.value);
}
</script>
```

5. 如果`value`可以更换，那么就可以在组件标签上多次使用`v-model`

```vue
<AtguiguInput v-model:abc="userName" v-model:xyz="password" />
```

::: warning `$event`到底是什么？什么时候可以`.target`

- 对于原生事件，`$event`就是事件对象。可以`.target`
- 对于自定义事件，`$event` 是子组件传给 `emit()` 的载荷。它通常不是 DOM 事件；只有载荷本身确实包含 `target` 时才能读取该属性。

:::

## 参考资料

- [Vue 3 迁移指南：事件 API](https://v3-migration.vuejs.org/breaking-changes/events-api.html)
- [Vue：组件事件](https://cn.vuejs.org/guide/components/events)
- [Vue：组件 v-model](https://cn.vuejs.org/guide/components/v-model)
- [Vuex：Pinia 现为新的默认选择](https://vuex.vuejs.org/)
## 6.5 通信方式：使用 $attrs 向后代透传

父组件传入、但没有被当前组件声明为 props 或 emits 的 attribute 和事件监听器，会作为透传 attribute 出现在 `$attrs` 中；声明过的 props 和 emits 会被排除。

1. 概述：`$attrs`用于实现**当前组件的父组件**，向**当前组件的子组件**通信（**祖→孙**）,孙传祖也可。
2. 具体说明：`$attrs` 是透传 attribute 对象。在单根组件中它默认会继承到根元素；需要手动转发到其他元素或组件时，可以关闭自动继承并使用 `v-bind="$attrs"`。

::: warning 注意
`$attrs`会自动排除`props`中声明的属性(可以认为声明过的 `props` 被子组件自己“消费”了)
:::

父组件：

```vue
<template>
  <div class="father">
    <h3>父组件</h3>
    <Child
      :a="a"
      :b="b"
      :c="c"
      :d="d"
      v-bind="{ x: 100, y: 200 }"
      :updateA="updateA"
    />
  </div>
</template>

<script setup lang="ts">
import Child from "./Child.vue";
import { ref } from "vue";
const a = ref(1);
const b = ref(2);
const c = ref(3);
const d = ref(4);

function updateA(value: number) {
  a.value = value;
}
</script>
```

子组件：

```vue
<template>
  <div class="child">
    <h3>子组件</h3>
    <GrandChild v-bind="$attrs" />
  </div>
</template>

<script setup lang="ts">
import GrandChild from "./GrandChild.vue";

defineOptions({ inheritAttrs: false });
</script>
```

孙组件：

```vue
<template>
  <div class="grand-child">
    <h3>孙组件</h3>
    <h4>a：{{ a }}</h4>
    <h4>b：{{ b }}</h4>
    <h4>c：{{ c }}</h4>
    <h4>d：{{ d }}</h4>
    <h4>x：{{ x }}</h4>
    <h4>y：{{ y }}</h4>
    <button @click="updateA(666)">点我更新A</button>
  </div>
</template>

<script setup lang="ts">
defineProps(["a", "b", "c", "d", "x", "y", "updateA"]);
</script>
```

## 6.6 通信方式：$refs（父→子）与 $parent（子→父）

1. 概述：
   - `$refs`用于 ：**父→子。**
   - `$parent`用于：**子→父。**

2. 原理如下：

   | 属性      | 说明                                                     |
   | --------- | -------------------------------------------------------- |
   | `$refs`   | 值为对象，只包含当前组件模板中显式使用 `ref` 标识且当前可用的 DOM 元素或组件公开实例。 |
   | `$parent` | 值为对象，当前组件的父组件实例对象。                     |

- `$refs` 不会自动包含所有子组件，只包含显式模板 ref；在渲染前相应引用也可能还不可用。
- `$parent`包含当前组件的父组件实例对象
- `<script setup>` 子组件若要向组件 ref 或 `$parent` 的使用方公开成员，需要通过 `defineExpose()` 显式暴露。此类方式会造成紧耦合，常规数据流优先使用 props、emits 或 provide/inject。

## 6.7 通信方式：provide 与 inject

1. 概述：任意祖先组件都可以向其整个后代树提供依赖，中间组件无需逐层转发 props。
2. 具体使用：
   - 在任意祖先组件中通过 `provide()` 向后代提供数据
   - 在任意层级的后代组件中通过 `inject()` 接收距离自己最近的同键值

3. 具体编码：

```vue
<!-- 祖先组件中使用 provide 提供数据 -->
<template>
  <div class="father">
    <h3>父组件</h3>
    <h4>资产：{{ money }}</h4>
    <h4>汽车：{{ car }}</h4>
    <button @click="money += 1">资产+1</button>
    <button @click="car.price += 1">汽车价格+1</button>
    <Child />
  </div>
</template>

<script setup lang="ts">
import Child from "./Child.vue";
import { ref, reactive, provide } from "vue";
// 数据
const money = ref(100);
const car = reactive({
  brand: "奔驰",
  price: 100,
});
// 用于更新money的方法
function updateMoney(value: number) {
  money.value += value;
}
// 向后代提供数据（后代均可拿到）
provide("moneyContext", { money, updateMoney });
// 参数一：数据名称 参数二：数据值
provide("car", car);
</script>
```

> 注意：子组件中不用编写任何东西，是不受到任何打扰的

【第二步】孙组件中使用`inject`配置项接受数据。

```vue
<template>
  <div class="grand-child">
    <h3>我是孙组件</h3>
    <h4>资产：{{ money }}</h4>
    <h4>汽车：{{ car }}</h4>
    <button @click="updateMoney(6)">点我</button>
  </div>
</template>

<script setup lang="ts">
import { inject, type Ref } from "vue";

interface MoneyContext {
  money: Ref<number>;
  updateMoney: (value: number) => void;
}

interface Car {
  brand: string;
  price: number;
}

const moneyContext = inject<MoneyContext>("moneyContext");
const car = inject<Car>("car");

if (!moneyContext || !car) {
  throw new Error("缺少 moneyContext 或 car 提供者");
}

const { money, updateMoney } = moneyContext;
</script>
```

## 6.8 通信方式：Pinia

参考之前`pinia`笔记

## 6.9 Slot 插槽

### 6.9.1 默认插槽

> 单标签组件和双标签组件有什么区别？

双标签可以在中间写东西。

```vue{2-6，12}
<!-- 父组件中： -->
<Category title="今日热门游戏">
          <ul>
            <li v-for="g in games" :key="g.id">{{ g.name }}</li>
          </ul>
        </Category>
<!-- 子组件中： -->
<template>
  <div class="item">
    <h3>{{ title }}</h3>
    <!-- 默认插槽 -->
    <slot></slot>
  </div>
</template>
```

### 6.9.2 具名插槽

具有名字的插槽。

- `v-slot` 可以写在组件标签上表示默认插槽，也可以写在 `<template>` 上组织具名插槽；不存在 `s-slot` 指令。
- 默认插槽也有名字，默认为`default`。
- `v-slot` 的简写形式是 `#`。

```vue{3,8,16,17}
<!-- 父组件中： -->
<Category title="今日热门游戏">
          <template v-slot:s1>
            <ul>
              <li v-for="g in games" :key="g.id">{{ g.name }}</li>
            </ul>
          </template>
          <template #s2>
            <a href="">更多</a>
          </template>
        </Category>
<!-- 子组件中： -->
<template>
  <div class="item">
    <h3>{{ title }}</h3>
    <slot name="s1"></slot>
    <slot name="s2"></slot>
  </div>
</template>
```

### 6.9.3 作用域插槽

> 需求：我需要使用三个插槽呈现在同一个页面，但是一个用有序列表呈现，一个用无序列表呈现，一个用三级标题呈现。

1. 理解：<span style="color:skyblue">数据在组件的自身，但根据数据生成的结构需要组件的使用者来决定。</span>（新闻数据在`Games`组件中，但使用数据所遍历出来的结构由`Father`组件决定）说白了就是“根据数据生成的结构”在父组件，“需要使用的数据”在子组件，“作用域问题”导致无法实现。（压岁钱在孩子那，但根据压岁钱买的东西，却由父亲决定。）
2. 具体编码：

```vue{2,5-7,14}
<!-- 父组件中： -->
<Game v-slot="params">
<!-- params就是子组件传过来的数据（是一个对象） -->
         <!-- <Game v-slot:default="params"> -->
         <!-- <Game #default="params"> -->
           <ul>
             <li v-for="g in params.games" :key="g.id">{{ g.name }}</li>
           </ul>
         </Game>

<!-- 子组件中： -->
<template>
  <div class="category">
    <h2>今日游戏榜单</h2>
    <slot :games="games" a="哈哈"></slot>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue";
const games = reactive([
  { id: "asgdytsa01", name: "英雄联盟" },
  { id: "asgdytsa02", name: "王者荣耀" },
  { id: "asgdytsa03", name: "红色警戒" },
  { id: "asgdytsa04", name: "斗罗大陆" },
]);
</script>
```

:::info
作用域插槽也可以是具名插槽，例如 `<template #list="slotProps">`。
:::

## 参考资料

- [Vue：透传 Attributes](https://cn.vuejs.org/guide/components/attrs)
- [Vue：依赖注入](https://cn.vuejs.org/guide/components/provide-inject)
- [Vue：插槽](https://cn.vuejs.org/guide/components/slots)
- [Vue：模板引用](https://cn.vuejs.org/guide/essentials/template-refs)
## 7. 其它常用 API

### 7.1 shallowRef 与 shallowReactive 浅层次

#### `shallowRef`

1. 作用：创建一个 ref，但只有 `.value` 本身是响应式的；存入其中的对象不会被递归转换成响应式代理。

```javascript
import { shallowRef, triggerRef } from "vue";

const person = shallowRef({ name: "张三", age: 18 });

// 修改嵌套属性不会自动触发依赖 shallowRef 的视图更新
person.value.name = "李四";

// 整体替换 .value 会触发更新
person.value = { name: "王五", age: 20 };

// 如果确实在原对象上做了深层修改，也可以显式触发
person.value.age += 1;
triggerRef(person);
```

2. 用法：

```js
let myVar = shallowRef(initialValue);
```

3. 特点：只跟踪引用值（整体修改）的变化，不关心值内部的属性变化。

#### `shallowReactive`

1. 作用：创建一个浅层响应式对象，只会使对象的最顶层属性变成响应式的，对象内部的嵌套属性则不会变成响应式的
2. 用法：

```js
const myObj = shallowReactive({ count: 0, nested: { count: 0 } });
```

3. 特点：对象的顶层属性是响应式的，但嵌套对象的属性不是。

#### 总结

> [`shallowRef()`](https://cn.vuejs.org/api/reactivity-advanced.html#shallowref) 和 [`shallowReactive()`](https://cn.vuejs.org/api/reactivity-advanced.html#shallowreactive) 可用于大型不可变数据、外部状态系统等明确只需要根层更新的场景。它们不是普遍的性能开关；把浅层对象嵌进深层响应式树会造成行为不一致，应只在理解更新边界时使用。

### 7.2 readonly 与 shallowReadonly 只读和浅层只读

#### **`readonly`**

1. 作用：为对象或 ref 创建深层只读代理。它不是数据副本或快照；原对象后续变化仍会反映到只读代理中。
2. 用法：

```javascript
 const original = reactive({ count: 0, nested: { count: 0 } });
 const readOnlyView = readonly(original);
```

3. 特点：

- 对象的所有嵌套属性都将变为只读。
- 任何尝试修改这个对象的操作都会被阻止（在开发模式下，还会在控制台中发出警告）。

4. 应用场景：

- 向使用方暴露只读视图，同时由状态所有者继续更新原对象。
- 防止消费方意外通过该代理修改共享状态或配置。

#### **`shallowReadonly`**

1. 作用：与 `readonly` 类似，但只作用于对象的顶层属性（只有第一层只读）。
2. 用法：

```js
const original = reactive({ count: 0, nested: { count: 0 } });
const shallowReadOnlyCopy = shallowReadonly(original);
```

3. 特点：
   - 只将对象的顶层属性设置为只读，对象内部的嵌套属性仍然是可变的。
   - 适用于只需保护对象顶层属性的场景。

### 7.3 toRaw 与 markRaw：访问原始对象与跳过代理

#### `toRaw`

1. 作用：获取 Vue 代理背后的原始对象。`toRaw()` 不会把代理“转换”成另一份普通数据；返回值与代理指向同一份底层对象。通过原始对象写入会绕过代理拦截，通常不会触发相应更新，因此不应长期保存并用它修改状态。

> 官网描述：这是一个可以用于临时读取而不引起代理访问/跟踪开销，或是写入而不触发更改的特殊方法。不建议保存对原始对象的持久引用，请谨慎使用。

> 何时使用？在需要将响应式对象传递给非 `Vue` 的库或外部系统时，使用 `toRaw` 可以确保它们收到的是普通对象

2. 具体编码：

```js
import { reactive, toRaw, markRaw, isReactive } from "vue";

/* toRaw */
// 响应式对象
const person = reactive({ name: "tony", age: 18 });
// 原始对象
const rawPerson = toRaw(person);

/* markRaw */
const citys = markRaw([
  { id: "asdda01", name: "北京" },
  { id: "asdda02", name: "上海" },
  { id: "asdda03", name: "天津" },
  { id: "asdda04", name: "重庆" },
]);
// markRaw 标记的根对象再次传给 reactive() 时会按原样返回
const citys2 = reactive(citys);
console.log(isReactive(person)); // true
console.log(isReactive(rawPerson)); // false
console.log(isReactive(citys)); // false
console.log(isReactive(citys2)); // false
```

#### `markRaw`

1. 作用：标记一个对象，使这个根对象以后不会被转换成 Vue 代理。它只作用于被标记的对象本身；未被标记的嵌套对象如果单独进入响应式状态，仍可能被代理。

> 例如使用`mockjs`（模拟后端接口）时，为了防止误把`mockjs`变为响应式对象，可以使用 `markRaw` 去标记`mockjs`

2. 编码：

```js
/* markRaw */
const citys = markRaw([
  { id: "asdda01", name: "北京" },
  { id: "asdda02", name: "上海" },
  { id: "asdda03", name: "天津" },
  { id: "asdda04", name: "重庆" },
]);
// 不会创建代理，citys2 与 citys 是同一个对象
const citys2 = reactive(citys);
console.log(citys2 === citys); // true
```

### 7.4 customRef：自定义 ref

> 需求：双向绑定后，当数据发生变化，等一秒钟页面在发生变化。

作用：创建一个自定义的`ref`，并对其依赖项跟踪和更新触发进行逻辑控制。

实现防抖效果（`useDebouncedRef.ts`）：

```typescript
import { customRef } from "vue";

export default function useDebouncedRef(initValue: string, delay: number) {
  const msg = customRef<string>((track, trigger) => {
    // track 跟踪 trigger 触发
    let timer: ReturnType<typeof setTimeout> | undefined;
    return {
      get() {
        // msg被读取的时候调用
        track(); // 告诉Vue数据msg很重要，要对msg持续关注，一旦变化就更新
        return initValue;
      },
      set(value) {
        // msg被修改的时候调用
        if (timer !== undefined) clearTimeout(timer);
        timer = setTimeout(() => {
          initValue = value;
          trigger(); //通知Vue数据msg变化了
        }, delay);
      },
    };
  });
  return { msg };
}
```

## 8. Vue 3 新组件

### 8.1 Teleport 传送门

> 需求：某些情况下，我们需要使用css样式（`filter: saturate(0%);`）将页面变为黑白，但是此时`position: fixed;`会出现问题，如何解决？

- Teleport 会把一段模板内容渲染到当前组件 DOM 层级之外的目标容器中，常用于模态框、通知等覆盖层。它只改变实际 DOM 的放置位置，不改变逻辑组件父子关系，因此 props、事件和 provide/inject 仍按组件树工作。

```vue
<teleport to="body">
<!-- 传到body to可以填选择器 -->
  <div class="modal" v-show="isShow">
    <h2>我是一个弹窗</h2>
    <p>我是弹窗中的一些内容</p>
    <button @click="isShow = false">关闭弹窗</button>
  </div>
</teleport>
```

### 8.2 Suspense 异步组件

- `<Suspense>` 可以协调默认插槽中的异步依赖，并在等待时渲染 `fallback` 内容。它可处理异步 `setup()` / `<script setup>` 顶层 `await`，以及默认可挂起的异步组件。
- 截至当前 Vue 3 文档，`<Suspense>` 仍属于实验性功能，API 在稳定前可能变化；生产使用前应核对目标 Vue 版本。
- 使用步骤：
  - 异步引入组件
  - 使用`Suspense`包裹组件，并配置好`default` 与 `fallback`

```typescript
import { defineAsyncComponent } from "vue";

const Child = defineAsyncComponent(() => import("./Child.vue"));
```

```vue
<template>
  <div class="app">
    <h3>我是App组件</h3>
    <Suspense>
      <template v-slot:default>
        <Child />
      </template>
      <template v-slot:fallback>
        <h3>加载中.......</h3>
      </template>
    </Suspense>
  </div>
</template>
```

### 8.3 全局API转移到应用对象

- `app.component` 注册全局组件
- `app.config` 全局配置
- `app.directive` 注册全局指令
- `app.mount` 挂载
- `app.unmount` 卸载
- `app.use` 安装插件

### 8.4 其他

- 过渡类名 `v-enter` 修改为 `v-enter-from`、过渡类名 `v-leave` 修改为 `v-leave-from`。

- Vue 3 移除了数字 `keyCode` 形式的 `v-on` 修饰符，应使用按键名修饰符（如 `.enter`）或在处理函数中检查 `event.key`。

- 组件 `v-model` 已重新设计，并通过参数形式取代 Vue 2 的 `.sync` 用法。

- Vue 3 中同一元素上的 `v-if` 优先于 `v-for`，因此 `v-if` 表达式无法访问该轮 `v-for` 的作用域变量；应避免把两者放在同一元素上，可改用包装 `<template>` 或先用计算属性过滤列表。

- 移除了`$on`、`$off` 和 `$once` 实例方法。

- 移除了过滤器 `filter`。

- 移除了 `$children` 实例属性。

## 参考资料

- [Vue：响应式 API（进阶）](https://cn.vuejs.org/api/reactivity-advanced)
- [Vue：Teleport](https://cn.vuejs.org/guide/built-ins/teleport)
- [Vue：Suspense](https://cn.vuejs.org/guide/built-ins/suspense)
- [Vue 3 迁移指南：按键修饰符](https://v3-migration.vuejs.org/breaking-changes/keycode-modifiers.html)
