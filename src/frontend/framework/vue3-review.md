# Vue3复习 <Badge type="warning" text="总结于小满zs的vue课程" />

## 1. Node.js 源码

Node.js 的源码并不能简单概括为三部分。其核心同时包含 JavaScript 与 C/C++ 实现，并集成了 V8、libuv、llhttp、OpenSSL 等依赖：V8 负责执行 JavaScript，libuv 提供事件循环、线程池和跨平台异步 I/O 等能力，其他库分别承担 HTTP 解析、加密、压缩等职责。

## 2. `npm run dev`流程

`npm run dev` 会先查找当前包 `package.json` 的 `scripts.dev`，并把依赖包提供的可执行文件目录临时加入 `PATH`，再交给系统 shell 执行脚本。脚本究竟启动 Vite、webpack 还是其他工具，取决于 `dev` 的具体配置；npm 不会自动推断开发服务器。

## 3. 模板语法与 Vue 指令

1. 模板插值支持 JavaScript 表达式（例如运算和三元表达式），但不能直接书写语句。
2. `v-text` 设置元素的文本内容；`v-html` 插入原始 HTML，不会把其中内容编译成 Vue 模板，并且只能用于可信内容以避免 XSS。
3. `v-if` 按条件创建或销毁分支；`v-show` 始终渲染元素，只切换 `display`。前者初始开销较低，后者更适合频繁切换，不能笼统地说哪一个始终性能更高。
4. `v-if`在组件上使用会有区别（后面讲）
5. `v-on:click="xxx"` 等价于 `@click="xxx"`，参数也可以动态指定；`.stop` 修饰符用于调用 `event.stopPropagation()`。
6. `v-bind:id="id"` 可简写为 `:id="id"`；不带参数的 `v-bind="attrs"` 用来一次绑定一个属性对象。它也能绑定 `class`、`style` 或表达式结果。
7. `v-model` 可用于表单控件，也可用于组件的双向绑定约定。
8. `v-for`遍历，支持嵌套循环
9. `v-once`仅渲染元素和组件一次，并跳过之后的更新。
10. `v-memo` 可缓存模板子树，依赖值未变化时跳过更新；它可以配合 `v-for` 优化大型列表，但并非只能这样使用。

## 4. 虚拟 DOM 与 Diff 算法

### 虚拟 DOM

虚拟 DOM 是用 JavaScript 对象描述 UI 结构的一棵 VNode 树。它与编译模板时产生的 AST 用途不同：AST 表示源代码语法结构，VNode 表示一次渲染所需的界面结构。

状态变化后，Vue 会生成新的 VNode，并结合编译器提供的静态标记与运行时 Diff，计算需要提交到真实 DOM 的更新。虚拟 DOM 的价值是提供声明式、跨平台的渲染模型并帮助缩小更新范围，并不意味着它在所有场景中都比直接操作 DOM 更快。

### Diff

- 无 `key` 的同类型子节点通常按位置就地更新；这可能复用错误的组件或表单状态，因此不能理解成简单的“全部重新渲染”。
- 有稳定且唯一的 `key` 时，Vue 可以按身份匹配节点。处理未知序列时会先同步首尾，再建立新节点索引并移除、挂载或移动节点；最长递增子序列用于减少必要的 DOM 移动。

## 5. Ref

1. `ref()` 返回带 `.value` 的响应式 Ref 对象；它是否由 class 实现属于内部细节。在 JavaScript/TypeScript 中读写其值使用 `.value`，模板中顶层 ref 通常会自动解包。

   ```ts
   import { ref, type Ref } from "vue";

   const first = ref<string>("aaa");
   const second: Ref<string> = ref("aaa");
   ```

2. `isRef`判断是否为Ref对象

3. `shallowRef` 只跟踪 `.value` 本身的替换，不会把内部对象递归转为响应式。`ref` 与 `shallowRef` 可以在同一组件中使用；若二者引用了同一个已被深层响应式代理的对象，观察结果会受共享对象和代理关系影响，但不是 API 之间“不能一起写”。

4. `triggerRef(shallow)` 可在深层修改 `shallowRef` 的内部值后，显式触发依赖它的副作用更新。

5. `customRef`自定义Ref 写防抖

   ```ts
   import { customRef } from "vue";

   function myRef<T>(value: T) {
     return customRef<T>((track, trigger) => ({
       get() {
         track();
         return value;
       },
       set(newValue) {
         value = newValue;
         trigger();
       },
     }));
   }
   ```

6. ref可以用于dom元素

## 6. Reactive

1. `ref` 可以持有任意值；`reactive` 只能接收对象类型，包括普通对象、数组以及 `Map`、`Set` 等集合。
2. `reactive` 返回代理对象，访问属性时不使用 `.value`。
3. `@click.prevent="xxx"` 会阻止该事件的默认行为；默认行为不一定是表单提交。
4. `@click.stop="xxx"` 阻止冒泡
5. `reactive` 返回 Proxy。若把保存该代理的变量直接替换为另一个普通对象，旧代理的依赖关系不会自动转移；可以修改代理的属性、使用 `Object.assign`，或改用 `ref` 保存需要整体替换的对象。
6. `readonly` 只读
7. `shallowReactive` 创建一个浅层proxy对象

## 7. toRef、toRefs 与 toRaw

1. `toRef(object, key)` 为对象属性创建双向关联的 ref；对响应式对象使用时，可在解构后保持该属性的响应式连接。较新的 Vue 版本也支持把 getter、现有 ref 或普通值规范化为 ref。
2. `toRefs` 把对象当前所有可枚举属性分别转换为关联 ref，常用于返回响应式对象时支持解构。
3. `toRaw(proxy)` 返回 Vue 代理背后的原始对象，适合临时读取或避免代理开销；不建议长期持有并直接修改它，因为这会绕过响应式追踪。

## 8. 响应式原理

下面用一个最小示例说明“读取时收集依赖、写入时触发依赖”的核心思路。它不是 Vue 源码，省略了嵌套 effect、依赖清理、代理缓存、集合类型与数组边界等生产级处理。

```ts
type EffectRunner = (() => unknown) & { scheduler?: () => void };

let activeEffect: EffectRunner | undefined;
const targetMap = new WeakMap<object, Map<PropertyKey, Set<EffectRunner>>>();

function effect(fn: () => unknown, scheduler?: () => void) {
  const runner: EffectRunner = () => {
    activeEffect = runner;
    try {
      return fn();
    } finally {
      activeEffect = undefined;
    }
  };
  runner.scheduler = scheduler;
  runner();
  return runner;
}

function track(target: object, key: PropertyKey) {
  if (!activeEffect) return;
  let depsMap = targetMap.get(target);
  if (!depsMap) targetMap.set(target, (depsMap = new Map()));
  let dep = depsMap.get(key);
  if (!dep) depsMap.set(key, (dep = new Set()));
  dep.add(activeEffect);
}

function trigger(target: object, key: PropertyKey) {
  const dep = targetMap.get(target)?.get(key);
  dep?.forEach((runner) => {
    if (runner.scheduler) runner.scheduler();
    else runner();
  });
}

function reactive<T extends object>(target: T): T {
  return new Proxy(target, {
    get(target, key, receiver) {
      track(target, key);
      return Reflect.get(target, key, receiver);
    },
    set(target, key, value, receiver) {
      const oldValue = Reflect.get(target, key, receiver);
      const changed = Reflect.set(target, key, value, receiver);
      if (changed && !Object.is(oldValue, value)) trigger(target, key);
      return changed;
    },
  });
}
```

## 9. computed 计算属性

- `computed`返回一个对象，对象有`value`属性，属性值就是计算后的结果

```ts
import { computed, ref } from "vue";

const firstName = ref("Ada");
const lastName = ref("Lovelace");

// 1. 选项式写法 支持一个对象传入get函数以及set函数自定义操作
const writableName = computed<string>({
  get() {
    return firstName.value + " " + lastName.value;
  },
  set(newValue) {
    [firstName.value, lastName.value] = newValue.split("_");
  },
});
// 2. 函数式写法 只能支持一个getter函数不允许修改值的
const readonlyName = computed(() => firstName.value + "_" + lastName.value);

// computed 会缓存 getter 的结果；依赖未变化时，多次读取 readonlyName.value 不会重复计算。
```

## 10. watch 侦听器

- watch: 监听响应式数据变化
- 直接把响应式对象传给 `watch` 时会隐式深度监听；若传入返回该对象的 getter，则默认只在返回值被替换时触发，需要时再配置 `deep`。

```ts
/**
 * source 监听源 多个数据源则是数组
 * cb 回调函数
 * options 配置项
 */
watch(
  source,
  (newValue, oldValue) => {
    console.log("监听到数据变化了");
  },
  {
    immediate: true, // 是否立即执行回调
    deep: true, // 是否深度监听
    flush: "pre", // 默认 组件更新之前调用 sync 同步执行  post 组件更新之后执行
  },
);

// 源码
```

## 11. watchEffect 侦听器

```ts
// 返回一个函数，调用这个函数就可以停止监听
const stop = watchEffect((onCleanup) => {
  console.log("监听到数据变化了", name.value);
  onCleanup(() => {
    console.log("before"); // 下次重新执行前或侦听器停止时清理副作用
  });
}, {
  flush: "pre", // 默认；还可使用 "sync" 或 "post"
  onTrigger(event) {
    console.debug(event); // 仅用于开发期调试
  },
});

stop(); // 需要提前结束时调用停止句柄
```

## 12. 组件生命周期

- `.vue`结尾的文件都可以是组件
- 组件可以复用 循环

```ts
// 组件生命周期
console.log("setup");
onBeforeMount(() => {
  // 此时组件自己的模板 DOM 尚未挂载，模板 ref 通常仍为 null
  console.log("beforeMount");
});
onMounted(() => {
  // 这里可以读到dom
  console.log("mounted");
});
onBeforeUpdate(() => {
  // 这里可以读到更新前的dom
  console.log("beforeUpdate");
});
onUpdated(() => {
  // 这里可以读到更新后的dom
  console.log("updated");
});
onBeforeUnmount(() => {
  console.log("beforeUnmount");
});
onUnmounted(() => {
  console.log("unmounted");
});

// 其他两个生命周期

// 用于调试
onRenderTracked((e) => {
  console.log("onRenderTracked", e);
});

onRenderTriggered((e) => {
  console.log("onRenderTriggered", e);
});

// 源码
```

## 13. BEM 架构与 Layout 布局

- BEM 的基本命名形式是 `block__element--modifier`。`el-` 是具体组件库可能使用的命名前缀，不属于 BEM 规范本身。
- Sass 可以通过嵌套和 `&` 辅助组织 BEM 选择器，但 BEM 并不依赖 Sass。

## 14. 父子组件传参

父组件通过 props 向下传值，子组件通过自定义事件向上通知。每个 `<script setup>` 中只能调用一次 `defineProps` 和一次 `defineEmits`，下面分别展示子组件与父组件。

```vue
<!-- Water.vue -->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title?: string;
    items?: number[];
  }>(),
  {
    title: "默认值",
    items: () => [1, 2, 3],
  },
);

const emit = defineEmits<{
  select: [name: string, source: string];
}>();

function send() {
  emit("select", props.title, "Water");
}

const open = () => console.log("打开");
defineExpose({ open });
</script>

<template>
  <button @click="send">{{ title }}</button>
</template>
```

```vue
<!-- Parent.vue -->
<script setup lang="ts">
import { ref } from "vue";
import Water from "./Water.vue";

const title = ref("瀑布");
const waterRef = ref<InstanceType<typeof Water> | null>(null);

function handleSelect(name: string, source: string) {
  console.log(name, source);
}
</script>

<template>
  <Water ref="waterRef" :title="title" @select="handleSelect" />
  <button @click="waterRef?.open()">打开子组件</button>
</template>
```

## 15. 全局组件、局部组件与递归组件

- 全局组件：向整个应用注册，适合确实需要广泛使用的基础组件；过度注册会使依赖关系不清晰。
- 局部组件：只在导入它的组件中使用，通常更利于依赖追踪和按需加载。
- 递归组件：组件在自己的模板中调用自身，常用于树形菜单等递归数据结构，并且必须有终止条件。

```ts
// main.ts：全局注册
import Catch from "./components/Catch.vue";

app.component("Catch", Catch);
```

在 `<script setup>` 中，单文件组件可以通过文件名隐式引用自身。需要自定义组件名时，Vue 3.3+ 可直接使用 `defineOptions({ name: "TreeNode" })`，无需为此安装第三方宏插件。

## 16. 动态组件

::: info 可选链操作符 `?.`
如果某个属性可能为 `null` 或 `undefined`，可使用可选链操作符 `?.` 继续访问；遇到空值时，整段表达式返回 `undefined`，而不是抛出“无法读取属性”的错误。`undefined` 在布尔上下文中是假值，但它并不等同于布尔值 `false`。

`a.children?.length ?? 0` 中，`??` 仅在左侧为 `null` 或 `undefined` 时返回右侧；左侧为 `0` 或 `false` 时仍保留原值，这一点与 `||` 不同。
:::

> 什么是动态组件?

让多个组件使用同一个挂载点，并动态切换，这就是动态组件。

应用场景：Tab标签页（`v-if` 动态组件 路由）

使用内置的 `<component :is="...">` 可以在同一位置切换组件：

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import UserPanel from "./UserPanel.vue";
import SettingsPanel from "./SettingsPanel.vue";

const current = shallowRef(UserPanel);
</script>

<template>
  <button @click="current = UserPanel">用户</button>
  <button @click="current = SettingsPanel">设置</button>
  <component :is="current" />
</template>
```

## 17. 插槽

插槽就是**子组件**中，**提供给父组件使用**的一个占位符，用`<slot></slot>`表示，父组件可以在这个占位符中填充任何模板代码，如HTML组件等，填充的内容会替换子组件的`<slot></slot>`标签。

默认插槽只有一段内容时，可以直接写在组件标签内，不强制使用 `<template>`。具名插槽、作用域插槽，或需要给整段插槽内容添加 `v-if`、`v-for` 时，通常使用带 `v-slot`（简写 `#`）的 `<template>`。

### 17.1 匿名插槽

```vue
<!-- Dialog.vue -->
<template>
  <div class="dialog">
    <slot />
  </div>
</template>
```

```vue
<!-- Parent.vue -->
<template>
  <Dialog>
    <div>默认插槽内容</div>
  </Dialog>
</template>
```

### 17.2 具名插槽

具名插槽就是给插槽取个名字。一个子组件可以放多个插槽，而且可以放在不同的地方，而父组件填充内容时，可以根据这个名字把内容填充到对应插槽中

```vue
<!-- Dialog.vue -->
<template>
  <div>
    <slot name="header" />
    <slot />
    <slot name="footer" />
  </div>
</template>
```

```vue
<!-- Parent.vue -->
<template>
  <Dialog>
    <template #header><div>头部</div></template>
    <div>默认内容</div>
    <template #footer><div>底部</div></template>
  </Dialog>
</template>
```

### 17.3 作用域插槽

子组件可以把数据作为 slot props 传给插槽内容；父组件通过 `v-slot` 解构并使用这些数据。这不是组件事件派发。

```vue
<!-- NumberList.vue -->
<template>
  <div v-for="item in 100" :key="item">
    <slot :data="item" />
  </div>
</template>
```

```vue
<!-- Parent.vue -->
<template>
  <NumberList>
    <template #default="{ data }">
      <div>第 {{ data }} 项</div>
    </template>
  </NumberList>
</template>
```

### 17.4 动态插槽

动态插槽名允许用表达式选择要填充的具名插槽；它不会自动“生成”子组件中不存在的插槽出口。

```vue
<script setup lang="ts">
import { ref } from "vue";

const name = ref<"header" | "footer">("header");
</script>

<template>
  <Dialog>
    <template #[name]>
      <div>动态选择的插槽内容</div>
    </template>
  </Dialog>
</template>
```

## 18. 异步组件、代码分包与 Suspense

在 Vue 3 里，异步组件就是把组件的加载变成“按需加载”，只有真正渲染到的时候才去请求对应的组件代码。常用于：

- 路由页面懒加载
- 大型业务组件延迟加载
- 配合 Suspense 做 loading 状态
- 优化首屏性能
- 为较慢的异步组件提供加载与错误状态

### 顶层 await

`<script setup>` 中可以使用顶层 `await`，编译后组件会采用 `async setup()`，并在 `await` 后恢复当前组件实例上下文。顶层 `await` 本身不等于代码分包；代码分包通常由动态 `import()` 触发。包含异步 `setup()` 的组件需要由 `<Suspense>` 等机制协调渲染，而 `<Suspense>` 目前仍属于实验性功能。

```vue
<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import LoadingComponent from "./LoadingComponent.vue";
import ErrorComponent from "./ErrorComponent.vue";

const post = await fetch("/api/post/1").then((response) => response.json());

// 动态 import() 会给构建工具提供代码分包边界
const Dialog = defineAsyncComponent(
  () => import("../../components/Dialog/index.vue"),
);

// 需要加载、错误和超时状态时使用对象形式
const AsyncComp = defineAsyncComponent({
  loader: () => import("./Foo.vue"),
  loadingComponent: LoadingComponent,
  delay: 200,
  errorComponent: ErrorComponent,
  timeout: 3000,
});
</script>
```

### Suspense

`<Suspense>` 协调组件树中的异步依赖，并提供 `default` 与 `fallback` 两个插槽；两个插槽都要求单个直接子节点。首次渲染时，若默认内容遇到异步依赖，就先显示后备内容，依赖全部完成后再显示默认内容。该组件目前仍是实验性功能，API 可能变化。

```html
<Suspense>
   <template #default>
         <Dialog>
            <template #default>
               <div>我在哪儿</div>
            </template>
         </Dialog>
   </template>

   <template #fallback>
         <div>loading...</div>
   </template>
</Suspense>
```

## 19. Teleport

Teleport 会把一段模板的实际 DOM 渲染到组件 DOM 层级之外的目标节点，但这段内容在 Vue 的逻辑组件树中仍属于原组件，因此 props、事件、provide/inject 等关系保持不变。

由于真实 DOM 位置发生变化，依赖原 DOM 祖先的 CSS 选择器、层叠与继承，以及祖先元素的 `display`、`overflow`、层叠上下文等效果可能改变；不能概括为“完全不受父级样式影响”。

使用方法：通过to 属性 插入指定元素位置 to="body" 便可以将Teleport 内容传送到指定位置

```html
<Teleport to="body">
    <Loading></Loading>
</Teleport>
```

动态控制`teleport`：使用`disabled`设置为`true`则 to属性不生效`false`则生效

```html
<Teleport :disabled="true" to="body">
   <A></A>
</Teleport>
```

源码：

```ts
// 源码解析
```

## 20. KeepAlive

当我们不希望组件被重新渲染影响使用体验，或者出于性能考虑，希望组件可以缓存下来，维持当前的状态，避免多次重复渲染降低性能。这时候就需要用到`keep-alive`组件。

- `<KeepAlive>` 会缓存切换离开的有状态组件实例，而不是缓存任意静态 DOM。
- 它在同一时刻应接收一个活动的直接组件子节点，最常见的是动态组件或 `<RouterView>` 产生的组件。

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import A from "./A.vue";
import B from "./B.vue";

const current = shallowRef(A);
</script>

<template>
  <!-- include/exclude 根据组件的 name 匹配；max 限制最多缓存的实例数 -->
  <KeepAlive :include="['A']" :max="2">
    <component :is="current" />
  </KeepAlive>
</template>
```

被缓存的组件及其后代可以使用 `onActivated` 和 `onDeactivated`：首次挂载和每次重新插入 DOM 时触发 activated，移出 DOM 进入缓存以及最终卸载时触发 deactivated。

## 21. Transition

`<Transition>` 用于给单个元素或组件的进入、离开过程添加 CSS 或 JavaScript 过渡。可以通过 `name` 生成对应的 CSS 类名，也可以直接提供自定义类名或 JavaScript 钩子；`name` 并非所有方案都必需。

- 过渡的类名
- 自定义过渡 class 类名
- JavaScript 过渡钩子
- appear

相关网站

- [animate.css](https://animate.style/)
- [GSAP](https://greensock.com/)

`appear` 用于让节点在初次渲染时也执行进入过渡，并不等同于等待整个页面加载完成。

## 22. TransitionGroup

`<TransitionGroup>` 用于列表中元素的插入、移除和位置变化过渡。列表项应提供稳定且唯一的 `key`。

- 过渡列表
- 列表的移动过渡
- 状态过渡

## 23. 依赖注入：Provide 与 Inject

当我们需要从父组件向子组件传递数据时，我们使用 props。想象一下这样的结构：有一些深度嵌套的组件，而深层的子组件只需要父组件的部分内容。在这种情况下，如果仍然将 prop 沿着组件链逐级传递下去，可能会很麻烦。

`provide`可以在祖先组件中指定我们想要提供给后代组件的数据或方法，而在任何后代组件中，我们都可以使用`inject`来接收 `provide`提供的数据或方法。

![Provide/Inject](/assert/vue3-review/image.png)

```vue
<!-- Ancestor.vue -->
<template>
  <A />
</template>

<script setup lang="ts">
import { provide, readonly, ref } from "vue";
import A from "./components/A.vue";

const flag = ref(1);
const setFlag = (value: number) => {
  flag.value = value;
};

provide("flag", { flag: readonly(flag), setFlag });
</script>
```

```vue
<!-- 任意后代组件 -->
<template>
  <button @click="state.setFlag(2)">修改 flag</button>
  <div>{{ state.flag }}</div>
</template>

<script setup lang="ts">
import { inject, type DeepReadonly, type Ref } from "vue";

type FlagContext = {
  flag: DeepReadonly<Ref<number>>;
  setFlag: (value: number) => void;
};

const state = inject<FlagContext>("flag");
if (!state) throw new Error("缺少 flag provider");
</script>
```

大型项目通常用 `InjectionKey<T>`（`Symbol`）代替字符串 key，以避免命名冲突并获得更完整的类型推断。把修改方法与状态一起由提供者暴露，也能让状态变更集中在提供者中。

## 24. 兄弟组件通信：Event Bus 与 Mitt

### 借助父组件传参

A组件派发事件，通过App.vue接受A组件派发的事件，然后在Props传给B组件。

### Event Bus

发布订阅模式

```ts
type Events = {
  select: [id: number, label: string];
};

class Bus<E extends { [K in keyof E]: unknown[] }> {
  private listeners = new Map<keyof E, Set<(...args: any[]) => void>>();

  on<K extends keyof E>(name: K, callback: (...args: E[K]) => void) {
    const callbacks = this.listeners.get(name) ?? new Set();
    callbacks.add(callback);
    this.listeners.set(name, callbacks);
    return () => callbacks.delete(callback);
  }

  emit<K extends keyof E>(name: K, ...args: E[K]) {
    this.listeners.get(name)?.forEach((callback) => callback(...args));
  }
}

export default new Bus<Events>();
```

### Mitt

Mitt 是一个小型事件发射器，可用于实现发布/订阅式通信。使用它时应保留处理函数引用并在组件卸载时取消订阅，避免重复监听和内存泄漏。

1. 安装: `npm i mitt -S`
2. 使用:

```ts
// bus.ts
import mitt from "mitt";

type Events = {
  select: { id: number; label: string };
};

export const emitter = mitt<Events>();
```

## 25. TSX

另一种风格

1. 安装插件: `npm i @vitejs/plugin-vue-jsx -D`
2. 配置文件:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import vueJsx from "@vitejs/plugin-vue-jsx";

export default defineConfig({
  plugins: [vueJsx()],
});
```

3. 使用:

```tsx
import { defineComponent, ref } from "vue";

export default defineComponent({
  name: "CounterButton",
  props: {
    title: { type: String, required: true },
  },
  emits: {
    select: (value: number) => Number.isFinite(value),
  },
  setup(props, { emit, slots }) {
    const visible = ref(true);
    const items = [1, 2, 3];

    return () => (
      <section>
        {visible.value ? <h2>{props.title}</h2> : null}
        <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
        <button onClick={() => emit("select", 1)}>点击</button>
        {slots.default?.()}
      </section>
    );
  },
});
```

模板会在表达式中自动解包顶层 ref；普通渲染函数和 TSX 表达式不会，因此上例使用 `visible.value`。TSX 可以使用 `v-show` 等由 Vue JSX 插件支持的指令，但条件和列表渲染通常直接使用三元表达式与 `map()`。

### Babel

1. 编译
2. 转换
3. 生成

## 26. 深入 v-model

- 数据绑定
- 监听更新
- 自动同步值

有两个地方会用到 `v-model`：

- 原生表单控件，例如 `<input>`（包括 checkbox、radio）、`<textarea>` 和 `<select>`
- 在组件上使用：父子组件双向通信的语法糖 **v-model 在组件上 = props 向下传值 + emit 向上通知**

| 用法                     | 适用场景                         |
| ------------------------ | -------------------------------- |
| `v-model="val"`          | 单值双向绑定，如输入框封装       |
| `v-model:xxx="val"`      | 多字段双向绑定，如复杂表单       |
| `v-model.modifier="val"` | 需要对值做统一处理时             |
| 多个 `v-model` 组合      | 弹窗、筛选器、表单组件等复杂场景 |

```vue
<template>
  <input v-model="message" />
  <p>{{ message }}</p>
</template>

<script setup>
import { ref } from "vue";

const message = ref("");
</script>
<!-- 等价于 -->
<input :value="message" @input="message = $event.target.value" />
```

- `:value="message"` 负责把数据传给输入框
- `@input="..."` 负责用户输入后更新数据

## 27. 自定义指令

### 生命周期

- `created`
- `beforeMount`
- `mounted`
- `beforeUpdate`
- `updated`
- `beforeUnmount`
- `unmounted`

### 指令简写

```vue
<!-- 按钮鉴权示例 -->
<template>
  <div class="btns">
    <button v-has-show="'shop:create'">创建</button>

    <button v-has-show="'shop:edit'">编辑</button>

    <button v-has-show="'shop:delete'">删除</button>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import type { Directive } from "vue";
//permission
localStorage.setItem("userId", "xiaoman-zs");

//mock后台返回的数据
const permission = [
  "xiaoman-zs:shop:edit",
  "xiaoman-zs:shop:create",
  "xiaoman-zs:shop:delete",
];
const userId = localStorage.getItem("userId") as string;
const vHasShow: Directive<HTMLElement, string> = (el, bingding) => {
  if (!permission.includes(userId + ":" + bingding.value)) {
    el.style.display = "none";
  }
};
</script>

<style scoped lang="less">
.btns {
  button {
    margin: 10px;
  }
}
</style>
```

```vue
<!-- 自定义拖拽指令 -->
<template>
  <div v-move class="box">
    <div class="header"></div>
    <div>内容</div>
  </div>
</template>

<script setup lang="ts">
import type { Directive } from "vue";
const vMove: Directive = {
  mounted(el: HTMLElement) {
    let moveEl = el.firstElementChild as HTMLElement;
    const mouseDown = (e: MouseEvent) => {
      //鼠标点击物体那一刻相对于物体左侧边框的距离=点击时的位置相对于浏览器最左边的距离-物体左边框相对于浏览器最左边的距离
      console.log(e.clientX, e.clientY, "-----起始", el.offsetLeft);
      let X = e.clientX - el.offsetLeft;
      let Y = e.clientY - el.offsetTop;
      const move = (e: MouseEvent) => {
        el.style.left = e.clientX - X + "px";
        el.style.top = e.clientY - Y + "px";
        console.log(e.clientX, e.clientY, "---改变");
      };
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", () => {
        document.removeEventListener("mousemove", move);
      });
    };
    moveEl.addEventListener("mousedown", mouseDown);
  },
};
</script>

<style lang="less">
.box {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
  border: 1px solid #ccc;
  .header {
    height: 20px;
    background: black;
    cursor: move;
  }
}
</style>
```

这种指令只能控制界面是否显示，不能作为安全边界。服务端仍必须在每个受保护接口上独立校验身份与权限。

### 图片懒加载

```vue
<template>
  <div>
    <div v-for="item in arr" :key="item">
      <img height="500" :data-index="item" v-lazy="item" width="360" alt="" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Directive } from "vue";
const images = import.meta.glob<string>("./assets/images/*.*", {
  eager: true,
  import: "default",
});
// 默认的 import.meta.glob() 返回懒加载函数；eager: true 会生成静态导入。

const arr = Object.values(images);

let vLazy: Directive<HTMLImageElement, string> = async (el, binding) => {
  let url = await import("./assets/vue.svg");
  el.src = url.default;

  // 监听图片是否进入可视区域
  let observer = new IntersectionObserver((entries) => {
    console.log(entries[0], el);
    if (entries[0].intersectionRatio > 0 && entries[0].isIntersecting) {
      setTimeout(() => {
        el.src = binding.value;
        observer.unobserve(el);
      }, 2000);
    }
  });
  observer.observe(el);
};
</script>

<style scoped lang="less"></style>
```

## 28. 自定义 Hooks

[Get Started | VueUse](https://vueuse.org/)

主要用来处理复用代码逻辑的一些封装

```ts
// 案例：图片转 Base64
import { onMounted } from "vue";

export function useImageBase64(selector: string): Promise<string> {
  return new Promise((resolve, reject) => {
    onMounted(() => {
      const image = document.querySelector<HTMLImageElement>(selector);
      if (!image) {
        reject(new Error(`未找到图片：${selector}`));
        return;
      }

      const convert = () => {
        try {
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          if (!context) throw new Error("当前环境不支持 Canvas 2D");
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          context.drawImage(image, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } catch (error) {
          reject(error);
        }
      };

      if (image.complete && image.naturalWidth > 0) convert();
      else {
        image.addEventListener("load", convert, { once: true });
        image.addEventListener("error", () => reject(new Error("图片加载失败")), {
          once: true,
        });
      }
    });
  });
}
```

跨源图片若没有正确的 CORS 响应头，会污染画布，使 `toDataURL()` 抛出安全异常。

```ts
// 案例：自定义指令 + composable，实现元素尺寸监听

// 主要会用到一个新的API resizeObserver 兼容性一般 可以做polyfill 但是他可以监听元素的变化 执行回调函数 返回 contentRect 里面有变化之后的宽高。

// 1. 实现这个功能
// 2.用vite打包成库
// 3. 发布npm

import type { App } from "vue";

function useResize(
  el: HTMLElement,
  callback: (cr: DOMRectReadOnly, resize: ResizeObserver) => void,
) {
  let resize: ResizeObserver;
  resize = new ResizeObserver((entries) => {
    for (let entry of entries) {
      const cr = entry.contentRect;
      callback(cr, resize);
    }
  });
  resize.observe(el);
  return resize;
}

const observers = new WeakMap<Element, ResizeObserver>();

const install = (app: App) => {
  app.directive("resize", {
    mounted(el, binding) {
      const observer = useResize(el, binding.value);
      observers.set(el, observer);
    },
    unmounted(el) {
      observers.get(el)?.disconnect();
      observers.delete(el);
    },
  });
};

export default Object.assign(useResize, { install });
```

```ts
// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "useResize",
      formats: ["es", "umd"],
    },
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: ["vue"],
      output: {
        // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
        globals: {
          vue: "Vue",
        },
      },
    },
  },
});
```

```ts
// index.d.ts
import type { App } from "vue";

declare const useResize: {
  (
    el: HTMLElement,
    callback: (rect: DOMRectReadOnly, observer: ResizeObserver) => void,
  ): ResizeObserver;
  install: (app: App) => void;
};

export default useResize;
```

## 29. 全局函数和全局变量

```ts
// main.ts
import { createApp } from "vue";
import App from "./App.vue";
export const app = createApp(App);
app.config.globalProperties.$env = "dev"; // 全局变量
// 全局函数
app.config.globalProperties.$filters = {
  format<T>(str: T) {
    return `${String(str)}格式化`;
  },
};
app.mount("#app");
```

如果要解决报错：

```ts
// main.ts
type Filters = {
  format<T>(str: T): string;
};

declare module "vue" {
  export interface ComponentCustomProperties {
    $filters: Filters;
    $env: string;
  }
}
```

## 30. 编写 Vue 3 插件

插件支持两种形式：

1. 函数插件
2. 对象插件

```vue
<!-- Loading.vue -->
<template>
    <div v-if="isShow" class="loading">
        <div class="loading-content">Loading...</div>
    </div>
</template>

<script setup lang='ts'>
import { ref } from 'vue';
const isShow = ref(false)//定位loading 的开关

const show = () => {
    isShow.value = true
}
const hide = () => {
    isShow.value = false
}
//对外暴露 当前组件的属性和方法
defineExpose({
    isShow,
    show,
    hide
})
</script>



<style scoped lang="less">
.loading {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    &-content {
        font-size: 30px;
        color: #fff;
    }
}
</style>
```

```ts
// Loading.ts
import { createVNode, render, type App, type VNode } from "vue";
import Loading from "./index.vue";

export default {
  // 规定 需要有个install 方法
  install(app: App) {
    const container = document.createElement("div");
    document.body.appendChild(container);

    // createVNode 创建 VNode；render 把它挂载到独立容器中
    const vnode: VNode = createVNode(Loading);
    vnode.appContext = app._context;
    render(vnode, container);
    app.config.globalProperties.$loading = {
      show: () => vnode.component?.exposed?.show(),
      hide: () => vnode.component?.exposed?.hide(),
    };
  },
};
```

```ts
// main.ts
import { createApp } from "vue";
import App from "./App.vue";
import Loading from "./components/loading";


type LoadingService = {
  show: () => void;
  hide: () => void;
};

declare module "vue" {
  interface ComponentCustomProperties {
    $loading: LoadingService;
  }
}

createApp(App).use(Loading).mount("#app");
```

## 31. 组件库

1. [Element Plus](https://element-plus.org/zh-CN/)：面向 Vue 3 的桌面端组件库
2. [Ant Design Vue](https://antdv.com/components/overview-cn)：Ant Design 的 Vue 实现
3. [View UI Plus](https://www.iviewui.com/)：面向 Vue 3 的组件库
4. [Vant](https://vant-ui.github.io/vant/#/zh-CN)：移动端组件库

这些组件库并不强制业务代码使用某一种 API 风格；应以各自当前版本的安装、按需引入和类型声明文档为准。

```json
{
  "compilerOptions": {
    "types": ["element-plus/global"]
  }
}
```

## 32. scoped 与样式穿透

`scoped` 用于限制单文件组件样式的匹配范围；当确实需要从父组件选中子组件内部节点（例如定制第三方组件库）时，可以使用深度选择器，但应尽量依赖组件库公开的主题变量和样式 API，避免绑定其内部 DOM 结构。

### scoped

1. 编译器会给当前组件模板中的元素添加形如 `data-v-xxxx` 的作用域属性。
2. 同一个 `<style scoped>` 中的选择器也会被改写，使其只匹配带对应属性的元素。
3. 子组件的根元素会同时受到父组件作用域样式与子组件自身作用域样式的影响，便于父组件控制布局；普通选择器不会继续匹配子组件更深层的内部节点。

### 样式穿透

`:deep(inner-selector)` 会让其中的选择器不再附加当前组件的作用域属性，从而匹配后代组件内部节点；外围选择器仍受当前组件作用域限制。

## 33. CSS 样式新特性（Vue 3.2）

### 插槽选择器

默认情况下，作用域样式不会影响到`<slot/>`渲染出来的内容，因为它们被认为是父组件所持有并传递进来的。

```html
<style scoped>
 :slotted(.a) {
    color:red
}
</style>
```

### 全局选择器

```html
<!-- 通常新建一个不带 scoped 的 style 标签 -->
<style>
 div{
     color:red
 }
</style>
```

```html
<!-- 也可以只让某个选择器成为全局选择器 -->
<style lang="less" scoped>
:global(div){
    color:red
}
</style>
```

### 动态 CSS

```vue
<template>
  <div class="div">aaa</div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
const red = ref<string>("red");
</script>

<style lang="less" scoped>
.div {
  color: v-bind(red);
}
</style>
```

```vue
<!-- 对象形式 -->
<template>
  <div class="div">aaa</div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
const red = ref({
  // 对象
  color: "pink",
});
</script>

<style lang="less" scoped>
.div {
  // 这里写法有区别
  color: v-bind("red.color");
}
</style>
```

### CSS Modules

```vue
<template>
  <div :class="$style.red">aaaa</div>
</template>

<style module>
.red {
  color: red;
  font-size: 20px;
}
</style>
```

## 34. Vue 3 集成 Tailwind CSS 4

使用方法：

1. 安装VSCode Tailwindcss插件：Tailwind CSS IntelliSense
2. 安装tailwindcss的vite插件: `npm install tailwindcss @tailwindcss/vite`
3. 配置 Vite 插件

```ts
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
});
```

4. 导入 Tailwind CSS：在你的 CSS 文件中添加一个`@import`导入 Tailwind CSS 的语句。`@import "tailwindcss";`

5. 如果要用 Prettier 自动排序 Tailwind 工具类，需要另外安装并配置 `prettier-plugin-tailwindcss`；Prettier 本身不会自动识别并排序这些类名。

## 35. nextTick 与 Event Loop

### EventLoop

在浏览器规范中通常称为“任务（task）”与“微任务（microtask）”；“宏任务”是常见教学用语，不是 HTML 标准中的正式队列名称。

1. 任务来源示例：初始脚本、定时器回调、用户交互回调、`postMessage` 回调，以及网络请求完成后排入的回调任务。
2. 微任务示例：Promise reaction（`then`/`catch`/`finally`）、`queueMicrotask()` 和 `MutationObserver` 回调。

Node.js 还提供 `process.nextTick()`。它使用 Node 自己的 next-tick 队列，不应直接等同于浏览器微任务；Node 会在事件循环的特定边界优先清空该队列，再处理 Promise 微任务。
   ![alt text](/assert/vue3-review/rule.png)

```vue
<!-- 输出结果是什么？ -->
<script setup lang="ts">
// 声明函数但是不执行
async function Prom() {
  console.log("Y");
  await Promise.resolve();
  console.log("X");
}
// 这几个是宏任务
setTimeout(() => {
  console.log(1);
  Promise.resolve().then(() => {
    console.log(2);
  });
}, 0);
setTimeout(() => {
  console.log(3);
  Promise.resolve().then(() => {
    console.log(4);
  });
}, 0);

// 这几个是微任务
Promise.resolve().then(() => {
  console.log(5);
});
Promise.resolve().then(() => {
  console.log(6);
});
Promise.resolve().then(() => {
  console.log(7);
});
Promise.resolve().then(() => {
  console.log(8);
});
Prom(); // 执行函数
console.log(0);
// 输出结果 Y 0 5 6 7 8 X 1 2 3 4
</script>
<style scoped></style>
```

### nextTick

响应式状态赋值会同步改变 JavaScript 中的数据，但 Vue 会把由此产生的组件 DOM 更新缓冲到之后的更新周期，并对同一轮中的多次修改去重。`nextTick()` 返回的 Promise 会在当前待处理的 Vue DOM 更新完成后兑现，适合在修改状态后读取更新后的组件 DOM。

当前实现通常借助 Promise 微任务调度刷新，但 `nextTick()` 的语义是“等待 Vue 当前刷新完成”，不应把它简单理解为任意代码套一层 Promise；内部调度策略也不是公共 API 保证。

```vue
<template>
  <div ref="xiaoman">
    {{ text }}
  </div>
  <button @click="change">change div</button>
</template>

<script setup lang="ts">
import { ref, nextTick } from "vue";

const text = ref("111111");
const xiaoman = ref<HTMLElement>();

const change = async () => {
  text.value = "222222";
  console.log(xiaoman.value?.innerText); // 111111
  await nextTick();
  console.log(xiaoman.value?.innerText); // 222222
};
</script>

<style scoped></style>
```

> 如何理解 tick？

这里的 tick 指一次异步调度边界，并不等同于显示器的一帧。浏览器会从任务队列取任务，任务结束后执行微任务检查点，并在合适的时机进行渲染；渲染机会中通常会运行 `requestAnimationFrame` 回调，再完成样式、布局、绘制与合成。定时器和用户事件并不保证每一帧都执行，`requestIdleCallback` 也只会在浏览器判断存在空闲时间时运行。

## 36. Vue 3 移动端开发

### Android 与 iOS

[ionic framework](https://ionicframework.com/)

### H5

1. 在开发移动端的时候需要适配各种机型，我们需要一套代码，在不同的分辨率适应各种机型。因此我们需要设置meta标签

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

2. 圣杯布局：在CSS中，圣杯布局是指两边盒子宽度固定，中间盒子自适应的三栏布局，其中，中间栏放到文档流前面，保证先行渲染；

- `vw` 与 `vh`：分别等于初始包含块宽度、高度的 1%。移动端还可根据地址栏伸缩行为选择 `svh`、`lvh`、`dvh` 等动态视口单位。
- 百分比：参照对象取决于具体 CSS 属性，并不总是父元素宽度。例如 `width` 百分比通常相对包含块宽度，而 `height` 百分比需要结合包含块高度规则判断。
- PostCSS：一个用 JavaScript 插件解析并转换 CSS 的工具平台。它可以完成前缀、语法转换、检查等任务，但具体行为由所启用的插件决定。

[Vite的PostCSS](https://cn.vitejs.dev/config/shared-options.html#css-postcss)

```ts
// 一个保守的 px 转 vw 教学示例
import type { Plugin } from "postcss";
import valueParser from "postcss-value-parser";

type Options = {
  viewportWidth?: number;
  minPixelValue?: number;
  mediaQuery?: boolean;
};

const defaultOptions: Required<Options> = {
  viewportWidth: 375,
  minPixelValue: 1,
  mediaQuery: false,
};

export const pxToViewport = (options: Options = {}): Plugin => {
  const config = { ...defaultOptions, ...options };
  return {
    postcssPlugin: "postcss-px-to-viewport",
    Declaration(declaration) {
      const parent = declaration.parent;
      if (
        !config.mediaQuery &&
        parent?.type === "atrule" &&
        parent.name.toLowerCase() === "media"
      ) return;

      const parsed = valueParser(declaration.value);
      parsed.walk((node) => {
        if (node.type !== "word") return;
        const match = /^(-?(?:\d+|\d*\.\d+))px$/i.exec(node.value);
        if (!match) return;

        const pixels = Number(match[1]);
        if (pixels === 0) node.value = "0";
        else if (Math.abs(pixels) > config.minPixelValue) {
          node.value = `${((pixels / config.viewportWidth) * 100).toFixed(4)}vw`;
        }
      });
      declaration.value = parsed.toString();
    },
  };
};
```

直接对整段声明使用 `parseFloat()` 会破坏 `margin: 8px 16px`、`calc()`、阴影等多值表达式，也可能误改不应转换的 1px 边框。生产项目应明确排除规则、设计稿宽度和媒体查询策略，并优先使用经过测试的现成插件。

## 37. UnoCSS 原子化

[unocss官网](https://unocss.dev/)

> UnoCSS 和 Tailwind CSS 的主要区别

两者都能按源码中出现的类名生成工具类 CSS。UnoCSS 更像可组合的即时原子化引擎，通过 presets、rules、shortcuts 和多种构建工具集成进行扩展；Tailwind CSS 提供更统一的设计系统约定、官方工具类和生态。Tailwind CSS 4 同时提供第一方 PostCSS 插件与 Vite 插件，因此不能再简单概括为“Tailwind 只是 PostCSS 插件”。选择时应比较团队约定、生态需求、构建集成和可定制程度。

> 什么是css原子化？

Atomic CSS is the approach to CSS architecture that favors small, single-purpose classes with names based on visual function.

原子化 CSS 是一种 CSS 的架构方式，它倾向于小巧且用途单一的 class，并且会以视觉效果进行命名。

> CSS原子化的优缺点

1. 减少了css体积，提高了css复用
2. 减少起名的复杂度
3. 增加了记忆成本

使用方法：

1. 安装unocss：`npm install -D unocss`
2. 安装插件：

```ts
// vite.config.ts
import UnoCSS from "unocss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [UnoCSS()],
});
```

3. 创建`uno.config.ts`文件：

```ts
import { defineConfig } from "unocss";

export default defineConfig({
  // ...UnoCSS options
});
```

4. 添加`virtual:uno.css`到您的主条目：

```ts
// main.ts
import "virtual:uno.css";
```

## 38. 函数式编程与 h 函数 <Badge type="danger" text="了解" />

vue的编程风格：

1. `template`模板
2. `JSX`编写风格
3. 函数式编程 h函数

`h()` 是创建 VNode 的运行时辅助函数，API 比直接调用底层 `createVNode()` 更适合手写渲染函数。手写渲染函数不需要模板编译，但构建工具通常会预编译 `.vue` 模板，因此普通生产构建也不会在浏览器中重复执行完整模板编译。渲染函数适合高度动态、用 JavaScript 表达更直接的结构，代价是可读性和模板优化信息可能不如模板直观。

## 39. 使用 Vue 3、Vite 与 Electron 开发桌面程序

- [Electron](https://www.electronjs.org/zh/)
- [electron-vite](https://cn.electron-vite.org/)

Electron 应用通常分为三个环境：主进程负责窗口与系统 API，渲染进程承载 Vue 页面，预加载脚本通过受控桥接暴露必要能力。Vite/electron-vite 负责开发服务和主进程、预加载、渲染进程的构建，但不会替代 Electron 的安全边界设计。

最小原则如下：

1. 保持 `contextIsolation: true`，普通渲染页面不要启用 `nodeIntegration`。
2. 在 preload 中用 `contextBridge.exposeInMainWorld()` 暴露小而明确的 API，不要直接暴露整个 `ipcRenderer`。
3. 主进程为每个 IPC 通道校验参数与调用来源；不要把网页内容当作可信输入。
4. 只加载可信的本地资源或受控 URL，并配置内容安全策略。打包、签名与自动更新还需要按目标操作系统单独配置。

```ts
// preload.ts
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("desktop", {
  getAppVersion: () => ipcRenderer.invoke("app:get-version") as Promise<string>,
});
```

## 40. Vue 编译宏

1. `defineProps`：声明组件接收的 props。运行时对象声明和类型声明二选一，同一组件中不要重复调用。

```vue
<!-- Child.vue -->
<script setup lang="ts">
defineProps<{
  name: string;
}>();
</script>

<template>
  <div>{{ name }}</div>
</template>
```

```vue
<!-- Parent.vue -->
<script setup lang="ts">
import Child from "./views/Child.vue";
</script>

<template>
  <Child name="xiaoman" />
</template>
```

Vue 3.3 起，`<script setup>` 的 `generic` 属性可以声明泛型组件：

```vue
<script setup lang="ts" generic="T">
defineProps<{ items: T[] }>();
</script>

<template>
  <div v-for="(item, index) in items" :key="index">{{ item }}</div>
</template>
```

2. `defineEmits`：声明组件可触发的事件并返回 `emit` 函数。Vue 3.3 起可使用更简洁的具名元组类型语法。

```vue
<!-- Child.vue -->
<script setup lang="ts">
const emit = defineEmits<{
  send: [name: string];
}>();
</script>

<template>
  <button @click="emit('send', '我是子组件的数据')">派发事件</button>
</template>
```

```vue
<!-- Parent.vue -->
<script setup lang="ts">
import Child from "./views/Child.vue";

const getName = (name: string) => console.log(name);
</script>

<template>
  <Child @send="getName" />
</template>
```

- `defineOptions` 用于在 `<script setup>` 中声明 `name`、`inheritAttrs` 等组件选项，Vue 3.3 起内置，无需再增加一个普通 `<script>` 块。

```ts
defineOptions({ name: "Child", inheritAttrs: false });
```

- `defineSlots` 用于声明并约束插槽名称及插槽 props 类型。它不接收运行时参数，也不会替你渲染插槽。

- `defineModel` 在 Vue 3.4 起稳定，用来声明组件的 `v-model` prop 与对应的 `update:` 事件，并返回可读写的 model ref。它简化了样板代码，但仍应明确默认模型名、自定义参数、修饰符与默认值的同步语义。

## 41. 环境变量

Vite 在 `import.meta.env` 上暴露内建常量和允许暴露给客户端的自定义环境变量。这些引用会在开发或构建过程中由 Vite 处理，因此业务代码应使用静态属性访问（例如 `import.meta.env.MODE`），不能依赖 `import.meta.env[key]` 被静态替换。

```ts
const env = {
  BASE_URL: import.meta.env.BASE_URL, // 部署基础路径
  MODE: import.meta.env.MODE,         // 当前模式名
  DEV: import.meta.env.DEV,           // 是否以开发模式运行
  PROD: import.meta.env.PROD,         // 是否以生产模式运行
  SSR: import.meta.env.SSR,           // 是否在服务端执行
};
```

> 如何自定义环境变量？

- 在项目根目录创建 `.env`、`.env.local`、`.env.[mode]` 或 `.env.[mode].local`。
- 只有以 `VITE_`（或 `envPrefix` 自定义前缀）开头的变量才会暴露给客户端源码，而且值均为字符串。任何暴露给客户端的值都会进入产物，不能存放密钥。
- 修改 `.env` 后需要重启开发服务器。模式专用文件优先级高于通用文件，进程启动时已经存在的环境变量优先级更高。

## 42. 使用 webpack 构建 Vue 3 项目

Vue 官方脚手架默认采用 Vite，但 Vue 3 也可以由 webpack 构建。核心配置通常包括 `vue-loader`、`VueLoaderPlugin`、TypeScript/CSS 处理规则、开发服务器与生产拆包。具体 loader/plugin 版本必须与 webpack 主版本兼容；除非维护既有 webpack 工程，新项目通常优先采用 Vue 官方的 `create-vue` 与 Vite。

## 43. Vue 3 性能优化

- `FCP (First Contentful Paint)`：首次内容绘制的时间，浏览器第一次绘制DOM相关的内容，也是用户第一次看到页面内容的时间。
- `Speed Index`: 页面各个可见部分的显示平均时间，当我们的页面上存在轮播图或者需要从后端获取内容加载时，这个数据会被影响到。
- `LCP (Largest Contentful Paint)`：视口内当前最大内容元素完成绘制的时间，是 Core Web Vitals 指标之一。
- `TTI (Time to Interactive)`：历史实验室指标，用来估计页面达到可靠交互状态的时间；它不是 Core Web Vitals，当前 Lighthouse 报告已不再把它作为主要指标。
- `TBT (Total Blocking Time)`：实验室指标，累计 FCP 之后各个长任务超过 50ms 的阻塞部分，用于反映主线程被长任务占用的程度。
- `CLS(Cumulative Layout Shift)`：计算布局偏移值得分，会比较两次渲染帧的内容偏移情况，可能导致用户想点击A按钮，但下一帧中，A按钮被挤到旁边，导致用户实际点击了B按钮。

### 代码分析

Vite 7 的生产构建默认基于 Rollup，可以使用 `rollup-plugin-visualizer` 分析产物；Vite 8 已切换到基于 Rolldown 的构建系统。常用 Rollup 插件多数仍可兼容，但迁移时应检查插件兼容性。

```ts
// vite.config.ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { visualizer } from "rollup-plugin-visualizer";

const analyze = process.env.VITE_ANALYZE === "1";

export default defineConfig({
  plugins: [vue(), vueJsx(), analyze && visualizer({ open: true })],
});
```

然后进行`npm run build`打包。

### Vite 配置优化

```ts
// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1000, // 只调整警告阈值，不会让产物自动变小
    cssCodeSplit: true,
    sourcemap: false,
    minify: true,
    assetsInlineLimit: 4096,
  },
});
```

`minify: false` 会关闭压缩，通常增大生产产物，不能当作性能优化。Vite 7 默认使用 esbuild 压缩客户端产物；Vite 8 使用 Oxc minifier。若需要更细的兼容或压缩控制，应按对应 Vite 大版本查阅 `build.minify` 配置，而不是依赖旧版工具结论。

### PWA离线存储技术

安装：`npm install vite-plugin-pwa -D`

```ts
// vite.config.ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [vue(), VitePWA()],
});
```

PWA 是一组渐进增强能力，可以让 Web 应用在满足条件的平台上获得安装、离线访问、后台能力等体验，但它仍受浏览器、操作系统、权限和 Web 安全模型限制，不能简单等同于原生应用。

1. 可以添加到主屏幕，利用manifest实现
2. 可以实现离线缓存，利用service worker实现
3. 在获得用户授权且平台支持时，可结合 Push API、Notifications API 与 service worker 接收并展示推送通知。

```ts
// 配置示例
VitePWA({
  workbox: {
    cacheId: "aaa", //缓存名称
    runtimeCaching: [
      {
        urlPattern: /\.js(?:\?.*)?$/, // 匹配 JavaScript 请求
        handler: "StaleWhileRevalidate", // 先用缓存，同时在后台更新
        options: {
          cacheName: "aaa-js", //缓存js，名称
          expiration: {
            maxEntries: 30, //缓存文件数量 LRU算法
            maxAgeSeconds: 30 * 24 * 60 * 60, //缓存有效期
          },
        },
      },
    ],
  },
});
```

### 其他性能优化

- 图片懒加载

```html
<img
  src="/avatars/user.webp"
  loading="lazy"
  width="320"
  height="320"
  alt="用户头像"
/>
```

浏览器原生 `loading="lazy"` 适合大多数非首屏图片。首屏 LCP 图片通常不应懒加载，并应预留宽高以减少布局偏移；需要占位图、错误重试或精细进入视口策略时，再使用 `IntersectionObserver` 或经过维护的 Vue 组件。

- 虚拟列表
- Web Worker 可用 `new Worker(new URL("./worker.ts", import.meta.url), { type: "module" })` 创建。Worker 不共享主线程 DOM；构造入口通常受同源与 CSP 约束，而其内部网络请求仍按 Fetch/CORS 规则处理。
- VueUse 提供 `useWebWorker`、`useWebWorkerFn` 等 composable，但底层限制仍与浏览器 Worker 一致。
- 防抖节流

## 44. Vue 3 与 Web Components

> 什么是 Web Components

Web Components 是 Custom Elements、Shadow DOM、HTML Templates 等浏览器能力的统称。Custom Elements 提供自定义标签及生命周期；Shadow DOM 可选地提供 DOM 与样式封装；`<template>` 用于声明惰性的可克隆结构。只有显式使用 Shadow DOM 时才具备相应隔离，而且继承属性、CSS 自定义属性和外部 API 仍可能跨越边界，不能笼统地说组件“完全互不影响”。

```js
class Btn extends HTMLElement {
  static observedAttributes = ["label"];

  constructor() {
    //调用super 来建立正确的原型链继承关系
    super();
    const p = this.h("p");
    p.innerText = "测试";
    p.setAttribute(
      "style",
      "height:200px;width:200px;border:1px solid #ccc;background:yellow",
    );
    //表示 shadow DOM 子树的根节点
    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(p);
  }

  h(el) {
    return document.createElement(el);
  }

  /**
   * 生命周期
   */
  //当自定义元素第一次被连接到文档 DOM 时被调用。
  connectedCallback() {
    console.log("111");
  }

  //当自定义元素与文档 DOM 断开连接时被调用。
  disconnectedCallback() {
    console.log("222");
  }

  //当自定义元素被移动到新文档时被调用
  adoptedCallback() {
    console.log("333");
  }
  //当自定义元素的一个属性被增加、移除或更改时被调用
  attributeChangedCallback(name, oldValue, newValue) {
    console.log(name, oldValue, newValue);
  }
}

window.customElements.define("x-demo-button", Btn);
```

自定义元素名称必须包含连字符。`attributeChangedCallback` 只会为 `observedAttributes` 声明的属性调用。

template 模式

```js
class Btn extends HTMLElement {
  static observedAttributes = ["label"];

  constructor() {
    //调用super 来建立正确的原型链继承关系
    super();
    const template = this.h("template");
    template.innerHTML = `
        <div>小满</div>
        <style>
            div{
                height:200px;
                width:200px;
                background:blue;
            }
        </style>
        `;
    //表示 shadow DOM 子树的根节点。
    const shaDow = this.attachShadow({ mode: "open" });

    shaDow.appendChild(template.content.cloneNode(true));
  }

  h(el) {
    return document.createElement(el);
  }

  /**
   * 生命周期
   */
  //当自定义元素第一次被连接到文档 DOM 时被调用。
  connectedCallback() {
    console.log("我已经插入了！！！嗷呜");
  }

  //当自定义元素与文档 DOM 断开连接时被调用。
  disconnectedCallback() {
    console.log("我已经断开了！！！嗷呜");
  }

  //当自定义元素被移动到新文档时被调用
  adoptedCallback() {
    console.log("我被移动了！！！嗷呜");
  }
  //当自定义元素的一个属性被增加、移除或更改时被调用
  attributeChangedCallback(name, oldValue, newValue) {
    console.log(name, oldValue, newValue);
  }
}

window.customElements.define("xiao-man", Btn);
```

使用方式

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>web Component</title>
    <script src="./btn.js"></script>
  </head>
  <body>
    <xiao-man></xiao-man>
  </body>
</html>
```

### 在 Vue 中使用

```ts
/*vite config ts 配置*/
vue({
  template: {
    compilerOptions: {
      isCustomElement: (tag) => tag.startsWith("xiao-"),
    },
  },
});
```

## 45. Proxy 跨域

> 如何解决跨域

1. JSONP 是历史方案：利用 `<script src>` 可以加载跨源脚本，让服务端返回对预先约定回调函数的调用。它只支持 GET，返回内容会作为脚本执行，必须信任服务端；现代应用通常优先使用正确配置的 CORS。

```js
function clickButton() {
  const callbackName = "handleProducts";
  const url = new URL("https://api.example.com/products");
  url.search = new URLSearchParams({ limit: "10", callback: callbackName }).toString();

  const s = document.createElement("script");
  s.src = url.toString();
  document.body.appendChild(s);
}

function handleProducts(data) {
  document.getElementById("demo").textContent = JSON.stringify(data);
}
```

2. CORS 由响应服务器通过 HTTP 响应头授权浏览器中的跨源读取。以下是响应头示意，不是 JSON 配置文件：

```http
Access-Control-Allow-Origin: https://web.example.com
Vary: Origin
```

公开且不携带凭据的资源可以返回 `Access-Control-Allow-Origin: *`；带 Cookie 或 HTTP 认证等凭据的请求不能与通配符来源组合使用，还需要正确配置 `Access-Control-Allow-Credentials`、允许的方法与请求头。

3. 开发服务器代理可让浏览器请求同源的本地开发地址，再由开发服务器转发到后端。Vite 的 `server.proxy` 只作用于开发服务器；生产环境需要由网关、反向代理或同源后端提供等价路由。

```ts
// vite.config.ts
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:9001/",
        changeOrigin: true, // 把转发请求的 Host 改为目标主机
        rewrite: (path) => path.replace(/^\/api/, ""), //重写路径,替换/api
      },
    },
  },
});
```

## Pinia 复习

### 46. Pinia安装

- 安装 pinia：`npm install pinia`
- 引入

```ts
// main.ts
import { createApp } from "vue";
import App from "./App.vue";
import { createPinia } from "pinia";

const store = createPinia();
let app = createApp(App);

app.use(store);

app.mount("#app");
```

### 47. 创建并使用 Store

1. 按项目约定创建 Store 目录（例如 `src/stores`）
2. 创建一个模块文件（例如 `test.ts`）
3. 定义仓库Store
4. 存储是使用定义的defineStore()，并且它需要一个唯一的名称，作为第一个参数传递

```ts
import { defineStore } from "pinia";
import { Names } from "./store-namespace";

export const useTestStore = defineStore(Names.Test, {
  state: () => {
    return {
      name: "test",
      current: 1,
      age: 30,
    };
  },
  // getters 类似 computed，用于派生状态
  getters: {},
  // actions 可以执行同步或异步业务逻辑
  actions: {},
});
```

`state: () => ({ ... })` 只是上面 `state() { return { ... } }` 的简写，不要在同一模块中用同一个变量名重复声明 Store。

### 48. State

State 是 Store 保存的响应式数据。Pinia 允许直接修改 state，也提供 `$patch()`、`$state` 和 actions 来组织不同形式的更新。

1. State 是允许直接修改值的 例如current++

```vue {14-16}
<template>
  <div>
    <button @click="Add">+</button>
    <div>
      {{ Test.current }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTestStore } from "./store";
const Test = useTestStore();
// 直接修改
const Add = () => {
  Test.current++;
};
</script>

<style></style>
```

2. 批量修改State的值

```vue {18-21}
<template>
  <div>
    <button @click="Add">+</button>
    <div>
      {{ Test.current }}
    </div>
    <div>
      {{ Test.age }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTestStore } from "./store";
const Test = useTestStore();
const Add = () => {
  // $patch
  Test.$patch({
    current: 200,
    age: 300,
  });
};
</script>

<style></style>
```

3. 批量修改函数形式

```vue {16-22}
<template>
  <div>
    <button @click="Add">+</button>
    <div>
      {{ Test.current }}
    </div>
    <div>
      {{ Test.age }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTestStore } from "./store";
const Test = useTestStore();
// 函数形式适合对集合执行多步变更，并把它们归并为一次 patch 记录
const Add = () => {
  // state是store中的数据
  Test.$patch((state) => {
    state.current++;
    state.age = 40;
  });
};
</script>

<style></style>
```

4. 给 `$state` 赋值

```vue
<template>
  <div>
    <button @click="Add">+</button>
    <div>
      {{ Test.current }}
    </div>
    <div>
      {{ Test.age }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTestStore } from "./store";
const Test = useTestStore();
const Add = () => {
  Test.$state = {
    current: 10,
    age: 30,
  };
};
</script>

<style></style>
```

Pinia 不会真正替换内部 state 对象；`store.$state = value` 在内部仍通过 `$patch()` 合并。TypeScript 通常要求传入完整 state 形状，日常更新更常用直接赋值或 `$patch()`。

5. 通过actions修改

```ts
// store.ts
import { defineStore } from "pinia";
import { Names } from "./store-namespace";
export const useTestStore = defineStore(Names.Test, {
  state: () => {
    return {
      current: 1,
      age: 30,
    };
  },

  // 逻辑处理
  actions: {
    setCurrent() {
      this.current++;
    },
  },
});
```

在state中返回的对象，会自动挂载到这个store实例身上，可以在getters和actions通过访问this来获取和改变状态。

```vue
<template>
  <div>
    <button @click="Add">+</button>
    <div>
      {{ Test.current }}
    </div>
    <div>
      {{ Test.age }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTestStore } from "./store";
const Test = useTestStore();
const Add = () => {
  Test.setCurrent();
};
</script>

<style></style>
```

### 49. 解构 Store

直接解构 Store 的 state 或 getters 会失去与 Store 的响应式连接；使用 `storeToRefs()` 解构它们。Actions 本身可以直接解构调用。

```ts
import { storeToRefs } from "pinia";

const testStore = useTestStore();
const { current, name } = storeToRefs(testStore);
const { setCurrent } = testStore;

console.log(current.value, name.value);
setCurrent();
```

### 50. Actions 与 Getters

- Actions 支持同步异步
- 同步 直接调用即可
- 异步 可以结合async await 修饰

```ts
import { defineStore } from "pinia";
import { Names } from "./store-namespace";

type User = {
  name: string;
  age: number;
};

const demoUser: User = {
  name: "张三",
  age: 18,
};

const Login = (): Promise<User> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        name: "张三",
        age: 18,
      });
    }, 300);
  });
};

export const useTestStore = defineStore(Names.Test, {
  state: () => {
    return {
      user: null as User | null,
      name: "test",
    };
  },
  //类似于computed 可以帮我们去修饰我们的值
  getters: {
    newName(): string {
      return this.name + `${this.getUserAge}`;
    },
    getUserAge(): number {
      return this.user?.age ?? 0;
    },
  },
  //可以操作异步 和 同步提交state
  actions: {
    // 同步
    setUserSync() {
      this.user = demoUser;
    },
    // 异步 演示
    async fetchUser() {
      const result = await Login();
      this.user = result;

      // 相互调用
      this.setName("aaaa");
    },

    setName(name: string) {
      this.name = name;
    },
  },
});
```

### 51. Pinia API

1. `$reset()` 把 Option Store 恢复为 `state()` 的初始值。Setup Store 没有内置 `$reset()`，需要自己编写 action 重置各个 ref。
2. `$subscribe()` 订阅 state 变更；回调会收到 mutation 信息和变更后的完整 state。它基于 Vue `watch()`，同一个 `$patch(fn)` 中的多次修改可归并为一次订阅通知。

```ts
Test.$subscribe((args, state) => {
  console.log(args, state);
});
```

3. `$onAction()` 订阅 action 调用，并可通过 `after()` 和 `onError()` 观察 action 完成或失败。两个订阅 API 都会返回取消订阅函数。

### 52. Pinia 插件

内存中的前端状态在整页刷新后会重新初始化；这不是 Pinia/Vuex 缺陷。确实需要跨刷新保留的非敏感状态，可以通过 Pinia 插件选择性持久化。认证令牌、个人信息等敏感数据不应无条件写入 `localStorage`。

```ts
import type { PiniaPluginContext, StateTree } from "pinia";

const defaultKey = "__PINIA__";

type Options = {
  key?: string;
};
// 定义入参类型

function readState(key: string): StateTree | undefined {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return;
  }
}

function writeState(key: string, value: StateTree) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("Pinia 状态持久化失败", error);
  }
}

// 利用函数柯里化接受用户入参
// 柯里化就是 将一个多参数的函数转化为单参数的函数
const piniaPlugin = (options: Options = {}) => {
  return ({ store }: PiniaPluginContext) => {
    const storageKey = `${options.key ?? defaultKey}-${store.$id}`;
    const saved = readState(storageKey);
    if (saved) store.$patch(saved);

    store.$subscribe(
      (_mutation, state) => writeState(storageKey, state),
      { detached: true },
    );
  };
};

// 初始化pinia
const pinia = createPinia();

// 注册pinia 插件
pinia.use(
  piniaPlugin({
    key: "pinia",
  }),
);
```

生产级持久化还应加入字段白名单、数据版本与迁移、运行时结构校验、跨标签页同步策略，以及 SSR 首屏状态与客户端存储之间的合并规则。插件必须在创建 Store 之前通过 `pinia.use()` 注册。

## Vue Router 复习

### 63. 入门

1. 安装vue-router：`npm install vue-router@4`

2. 在src目录下面新建router文件夹，然后在文件夹下面新建index.ts

```ts
//引入路由对象
import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
  createMemoryHistory,
  type RouteRecordRaw,
} from "vue-router";

//路由数组的类型 RouteRecordRaw
// 定义一些路由
// 每个路由都需要映射到一个组件。
const routes: Array<RouteRecordRaw> = [
  {
    path: "/", // 路径
    component: () => import("../components/a.vue"), // 组件
  },
  {
    path: "/register",
    component: () => import("../components/b.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes, // 路由
});

//导出router
export default router;
```

- `<RouterView>`：渲染当前地址匹配到的路由组件。
- `<RouterLink>`：根据目标位置生成链接，并由 Vue Router 拦截符合条件的点击以执行客户端导航；带修饰键、外部地址等情况仍按普通链接规则处理。

### 64. 路由模式

```ts
import {
  createRouter,
  createWebHistory, // 基于h5 history实现
  createWebHashHistory, // 显式选择 hash 模式，URL 带 #
  createMemoryHistory, // 不与浏览器 URL 交互，常用于 SSR 或测试
  type RouteRecordRaw,
} from "vue-router";
```

Vue Router 不会自动选择所谓“默认 hash 模式”；调用 `createRouter()` 时必须显式传入一个 history 实现。

### 65. 命名路由与编程式导航

#### 命名路由

除了path之外，你还可以为任何路由提供name。这有以下优点：

1. 没有硬编码的 URL
2. params 的自动编码/解码。
3. 防止你在 url 中出现打字错误。
4. 不依赖路径排名来表达目标路由。

```ts
// router/index.ts
const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "Login",
    component: () => import("../components/login.vue"),
  },
  {
    path: "/reg",
    name: "Reg",
    component: () => import("../components/reg.vue"),
  },
];
```

```html
<h1>1111</h1>
<div>
  <!-- router-link跳转方式需要改变 变为对象并且有对应name -->
  <router-link :to="{name:'Login'}">Login</router-link>
  <router-link style="margin-left:10px" :to="{name:'Reg'}">Reg</router-link>
</div>
<hr />
```

#### 编程式导航

本身也是跳转的一种方式，但是需要调用js方法。在组件中编写逻辑。

1. 字符串模式

```ts
import { useRouter } from "vue-router";
const router = useRouter();

const toPage = (url: string) => {
  router.push(url); // 传入url
};
```

2. 对象模式

```ts
import { useRouter } from "vue-router";
const router = useRouter();

const toPage = (url: string) => {
  router.push({
    path: url,
  });
};
```

3. 命名式路由模式

```ts
import { useRouter } from "vue-router";
const router = useRouter();

const toPage = (name: string) => {
  router.push({
    name: name,
  });
};
```

### 66. 历史记录

```html
<!-- 加上replace属性 可以实现跳转后不添加历史记录 -->
<router-link replace to="/">Login</router-link>
<router-link replace style="margin-left:10px" to="/reg">Reg</router-link>
```

若是编程式跳转，则使用`router.replace()`方法替代`router.push()`方法即可。

#### 横跨历史

```html
<button @click="next">前进</button>
<button @click="prev">后退</button>
```

```ts
const next = () => {
  //前进 数量不限于1
  router.go(1);
};

const prev = () => {
  //后退
  router.back();
};
```

### 67. 路由传参

#### Query 路由传参

编程式导航可以在目标位置对象中提供 `query`。其值必须能序列化为 URL 查询参数，不要直接传入包含嵌套对象的整个业务实体。

```vue
<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";

type Item = { id: number; name: string; price: number };

const router = useRouter();
const route = useRoute();

function toDetail(item: Item) {
  router.push({
    path: "/reg",
    query: {
      id: String(item.id),
      name: item.name,
      price: String(item.price),
    },
  });
}
</script>

<template>
  <div>品牌：{{ route.query.name }}</div>
  <div>价格：{{ route.query.price }}</div>
  <div>ID：{{ route.query.id }}</div>
</template>
```

查询参数会出现在 URL 中并在刷新后保留。`route.query` 的值可能是字符串、`null` 或数组，应在使用前验证和转换。

#### Params 路由传参

使用 params 导航时应通过路由 `name` 指定目标；若同时传 `path` 与 `params`，`params` 会被忽略。Vue Router 4 会丢弃路径模式中未声明的额外 params。

```ts
const toDetail = (item: Item) => {
  router.push({
    name: "Reg",
    params: { id: item.id },
  });
};
```

#### 动态路由传参

很多时候，我们需要将给定匹配模式的路由映射到同一个组件。例如，我们可能有一个User组件，它应该对所有用户进行渲染，但用户ID不同。在 VueRouter中，我们可以在路径中使用一个动态字段来实现，我们称之为路径参数

路径参数用冒号 `:` 表示。路由匹配成功后，可通过 `route.params` 读取；同一组件实例在参数变化时可能被复用，因此需要时应监听参数或使用 `onBeforeRouteUpdate()`。

```ts
// 传递
const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "Login",
    component: () => import("../components/login.vue"),
  },
  {
    path: "/reg/:id", // 动态路由参数
    name: "Reg",
    component: () => import("../components/reg.vue"),
  },
];

// 引入
const toDetail = (item: Item) => {
  router.push({
    name: "Reg",
    params: {
      id: item.id, // 接收
    },
  });
};
```

两种传参区别：

1. query 可与 `path` 或 `name` 一起使用；params 导航通常使用 `name`，并且参数必须在路径模式中声明。
2. query 位于 `?` 之后，path params 是 URL 路径的一部分；二者都会显示在地址栏并随刷新保留。
3. query 适合筛选、分页等可选参数；path params 适合标识资源层级或身份。
4. 两者最终都是外部输入，组件不能假定其类型或可信度。

### 68. 嵌套路由

```ts
const routes: Array<RouteRecordRaw> = [
  {
    path: "/user",
    component: () => import("../components/footer.vue"),
    children: [
      {
        path: "", // 默认子路由 没有/
        name: "Login",
        component: () => import("../components/login.vue"),
      },
      {
        path: "reg",
        name: "Reg",
        component: () => import("../components/reg.vue"),
      },
    ],
  },
];
```

父路由组件（本例的 `footer.vue`）必须包含 `<RouterView>` 才能显示子路由。相对子路径 `reg` 最终匹配 `/user/reg`，导航时要包含父路径，或使用命名路由。

### 69. 命名视图

命名视图可以在同一级（同一个组件）中展示更多的路由视图，而不是嵌套显示。 命名视图可以让一个组件中具有多个路由渲染出口，这对于一些特定的布局组件非常有用。 命名视图的概念非常类 似于“具名插槽”，并且视图的默认名称也是`default`。

```ts
import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    components: {
      default: () => import("../components/layout/menu.vue"),
      header: () => import("../components/layout/header.vue"),
      content: () => import("../components/layout/content.vue"),
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
```

```html
<div>
  <router-view></router-view>
  <router-view name="header"></router-view>
  <router-view name="content"></router-view>
</div>
```

### 70. 重定向与别名

#### 重定向 redirect

```ts
const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    component: () => import("../components/root.vue"),
    // redirect: "/user1", // 重定向 字符串形式
    // redirect: { path: "/user1" }, // 重定向 对象形式
    redirect: (to) => ({
      path: "/user1",
      query: to.query,
    }),
    children: [
      {
        path: "/user1",
        components: {
          default: () => import("../components/A.vue"),
        },
      },
      {
        path: "/user2",
        components: {
          bbb: () => import("../components/B.vue"),
          ccc: () => import("../components/C.vue"),
        },
      },
    ],
  },
];
```

#### 别名

```ts
const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    component: () => import("../components/root.vue"),
    // 访问这些 URL 时匹配同一个路由记录，但地址栏保持别名 URL
    alias: ["/root", "/root2", "/root3"],
    children: [
      {
        path: "user1",
        components: {
          default: () => import("../components/A.vue"),
        },
      },
      {
        path: "user2",
        components: {
          bbb: () => import("../components/B.vue"),
          ccc: () => import("../components/C.vue"),
        },
      },
    ],
  },
];
```

### 71. 导航守卫

Vue Router 提供三层常用守卫：全局守卫（如 `router.beforeEach`）、路由独享守卫 `beforeEnter`，以及组件内的 `onBeforeRouteUpdate`、`onBeforeRouteLeave`。返回 `false` 可取消导航，返回路由位置可重定向，抛出错误会取消导航并交给 `router.onError()`。

```ts
router.beforeEach((to) => {
  const loggedIn = Boolean(sessionStorage.getItem("user"));
  if (to.meta.requiresAuth && !loggedIn) {
    return { name: "Login", query: { redirect: to.fullPath } };
  }
});
```

前端守卫只改善导航体验，不是权限安全边界；服务端接口仍必须鉴权。

### 72. 路由元信息

`meta` 用来附加标题、权限标识等自定义信息。`route.meta` 是所有已匹配路由记录 meta 的非递归合并结果；嵌套对象不会深度合并。

```ts
declare module "vue-router" {
  interface RouteMeta {
    requiresAuth: boolean;
    title?: string;
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: "/admin",
    component: () => import("../pages/Admin.vue"),
    meta: { requiresAuth: true, title: "管理后台" },
  },
];
```

### 73. 路由过渡动效

使用 `<RouterView>` 的插槽取得当前组件，再用 `<Transition>` 包裹。若按路由路径设置 `key`，参数变化也会创建新组件实例；是否这样做应取决于是否希望复用组件。

```html
<RouterView v-slot="{ Component, route }">
  <Transition name="fade" mode="out-in">
    <component :is="Component" :key="route.path" />
  </Transition>
</RouterView>
```

### 74. 滚动行为

只有使用浏览器 history 的客户端路由器支持 `scrollBehavior`。返回坐标、元素定位或 `savedPosition`；浏览器前进/后退时优先恢复历史位置。

```ts
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.hash) return { el: to.hash, behavior: "smooth" };
    return { top: 0 };
  },
});
```

### 75. 动态路由

`addRoute()` 可在运行时注册路由，并返回移除函数；也可用 `removeRoute(name)` 删除命名路由。路由名应唯一。若新路由会匹配当前地址，添加后需要执行一次 `router.replace(router.currentRoute.value.fullPath)` 才会显示新匹配结果。

```ts
const removeAdmin = router.addRoute({
  path: "/admin",
  name: "Admin",
  component: () => import("../pages/Admin.vue"),
});

if (router.currentRoute.value.path === "/admin") {
  await router.replace(router.currentRoute.value.fullPath);
}

// 权限变化或模块卸载时清理
removeAdmin();
```

## PM2

PM2 is a Production Process Manager for Node.js applications with a built-in Load Balancer.

### 76. 安装PM2

- 安装命令：`npm i pm2 -g`

### 77. PM2基本命令

1.  使用`pm2 -v`查看安装是否成功
2.  使用`pm2 start index.js`启动`index.js`（Express）文件
3.  使用`pm2 logs`查看日志
4.  使用`pm2 list`查看表格
5.  使用`pm2 stop 0`停止编号为0的服务
6.  使用`pm2 restart 0`重启编号为0的服务
7.  使用`pm2 delete 0`删除编号为0的服务
8.  使用`pm2 start index.js --watch`启动`index.js`（Express）文件 可以实时监听文件变化
9.  使用`pm2 start index.js -i max --watch`以 cluster 模式启动多个工作进程并监听文件变化（`max` 也可替换为具体进程数）；PM2 管理的是进程，不是线程
10. 使用`pm2 start index.js --watch -n aaa`启动`index.js`（Express）文件 自定义名字

### 78. 服务器后台

尝试配置一个服务器

## Linux

### 79. Linux基本使用

### 80. Linux基本使用

### 81. Linux基本使用

### 82. Linux基本使用

### 83. Linux基本使用

## 网络安全

### 79. canvas
