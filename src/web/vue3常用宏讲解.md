# Vue 3 编译宏：defineProps、defineEmits 与 defineExpose

在 `<script setup>` 中，`defineProps` 与 `defineEmits` 都是编译宏，不需要导入；编译器会根据声明生成相应的组件选项。`defineProps`、`defineEmits` 与 `defineExpose` 分别覆盖父传子、子通知父和显式公开组件实例能力三类协作方式。

| 宏             | 方向              | 作用                                                 |
| -------------- | ----------------- | ---------------------------------------------------- |
| `defineProps`  | 父 → 子           | 子组件声明自己接收哪些属性                           |
| `defineEmits`  | 子 → 父           | 子组件声明自己会触发哪些事件                         |
| `defineExpose` | 父组件调用子组件公开能力 | 子组件显式暴露可由模板 ref 访问的方法或状态 |

---

## 一、defineProps —— 接收父组件传来的数据

### 1. 作用

声明当前子组件能接收哪些属性,并获得带类型的只读对象。

### 2. 基本用法(纯类型声明,推荐)

```vue
<script setup lang="ts">
import type { SpuData } from "@/api/product/spu/type";

// 编译器会尽可能从静态类型生成等价的运行时 props 选项
const props = defineProps<{
  spuData: SpuData | null; // 可空
  title: string; // 必填
  disabled?: boolean; // 可选
}>();

console.log(props.title);
</script>
```

### 3. 带默认值:`withDefaults`

需要保留完整 `props` 对象并设置默认值时，可以用 `withDefaults` 包裹类型声明：

```ts
const props = withDefaults(
  defineProps<{
    title?: string;
    size?: "small" | "medium" | "large";
    list?: string[];
  }>(),
  {
    title: "默认标题",
    size: "medium",
    list: () => [], // 引用类型必须用函数返回
  },
);
```

> Vue 3.5+ 也支持**响应式 Props 解构**,可以直接用 ES 默认值语法:
>
> ```ts
> const { title = "默认标题", size = "medium" } = defineProps<{
>   title?: string;
>   size?: "small" | "medium" | "large";
> }>();
> ```
>
> Vue 3.5 的编译器会为同一 `<script setup>` 块内对这些解构变量的访问补写为 `props.xxx`，因此它们保持响应式。把变量传出当前编译上下文时，仍应按普通值与 getter/ref 的语义处理。

### 4. 注意点

- `props` 是**只读**的,不要在子组件里直接改 `props.xxx`;要改就拷贝到本地 `ref`。
- 模板里直接写 `{{ title }}` 即可,不用写 `props.title`。
- 在单文件组件模板中可使用 camelCase 或 kebab-case，通常推荐 `<Child :spu-data="row" />` 这种 kebab-case；直接写在 DOM 中的模板会被浏览器转为小写，更应使用 kebab-case。

类型声明到运行时校验的转换基于 AST，无法执行完整的 TypeScript 类型系统。导入类型和复杂条件类型在运行时可能只得到较宽泛的校验（例如 `null`），因此外部输入仍需显式运行时验证。

---

## 二、defineEmits —— 向父组件派发事件

### 1. 作用

声明当前子组件会触发哪些事件,并返回一个类型安全的 `emit` 函数。

### 2. 基本用法(元组语法,Vue 3.3+ 推荐)

```vue
<script setup lang="ts">
import type { SpuData } from "@/api/product/spu/type";

const emit = defineEmits<{
  changeScene: [num: number]; // 参数:一个 number
  submit: [data: SpuData, silent?: boolean]; // 多参数,可选
  cancel: []; // 无参数
}>();

const handleCancel = () => {
  emit("cancel");
};

const handleSubmit = (spu: SpuData) => {
  emit("submit", spu, false);
};
</script>
```

### 3. 父组件监听

```html
<SpuForm @change-scene="changeScene" @submit="onSubmit" @cancel="onCancel" />
```

### 4. 注意点

- 事件名推荐用 **kebab-case** 在模板里绑定(`@change-scene`),但在 `defineEmits` 里用 **camelCase**(`changeScene`)—— Vue 会自动匹配。
- 元组形式 `[num: number]` 的好处是 IDE 在父组件写 `@changeScene="(num) => ..."` 时也能推断 `num` 是 number。
- 旧的对象形式 `defineEmits<{ (e: 'xxx', v: number): void }>()` 依然可用,但元组语法更简洁。

---

## 三、defineExpose —— 把子组件的方法暴露给父组件

### 1. 作用

默认情况下,`<script setup>` 中定义的变量和方法**对外完全封闭**,父组件通过 `ref` 拿到子组件实例也访问不到。`defineExpose` 就是用来显式开放一部分 API 的。

### 2. 基本用法

子组件:

```vue
<script setup lang="ts">
import { ref } from "vue";
import type { SpuData } from "@/api/product/spu/type";

const formData = ref<SpuData | null>(null);

const initHasSpuData = (row: SpuData) => {
  formData.value = { ...row }; // 拷贝一份作为本地编辑副本
};

const resetForm = () => {
  formData.value = null;
};

// 只暴露这两个方法,其他内部状态依然私有
defineExpose({ initHasSpuData, resetForm });
</script>
```

父组件:

```vue
<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import type { SpuData } from "@/api/product/spu/type";
import SpuForm from "./spuForm.vue";

const scene = ref(0);
// Vue 3.5+：字符串必须与模板中的 ref 值一致
const spu = useTemplateRef<InstanceType<typeof SpuForm>>("spu");

const handleEditSpu = (row: SpuData) => {
  scene.value = 1;
  spu.value?.initHasSpuData(row); // 调用子组件方法
};
</script>

<template>
  <SpuForm ref="spu" />
</template>
```

Vue 3.4 及更早版本可以改用 `const spu = ref<InstanceType<typeof SpuForm> | null>(null)`；两种写法都必须让变量与模板 ref 对应，不能声明一个 ref 却通过另一个变量调用。

### 3. 什么时候该用

- **表单组件**:父组件点"编辑"时,把某行数据注入子表单(当前项目中的 `initHasSpuData` 就是这个场景)。
- **子组件校验**:父组件在提交前调用子组件的 `validate()`。
- **聚焦、滚动到顶、重置等命令式操作**。

### 4. 什么时候不该用

如果数据是持续响应的(比如弹窗的 `visible` 状态),用 `props + v-model` 更符合 Vue 的数据流理念,不要滥用 `defineExpose`。

---

## 四、三者协同：本项目的实际案例

以当前目录下的 `spuForm.vue` 和 `SpuIndex.vue` 为例:

**子组件 `spuForm.vue`**

```vue
<script setup lang="ts">
import type { SpuData } from "@/api/product/spu/type";

// ① 告诉父组件我会派发什么事件
const emit = defineEmits<{
  changeScene: [num: number];
}>();

// ② 取消按钮,派发事件让父组件切回列表场景
const handleCancel = () => {
  emit("changeScene", 0);
};

// ③ 供父组件调用的初始化方法
const initHasSpuData = (row: SpuData) => {
  console.log(row);
  // 通常会把 row 拷贝进本地的表单 state
};

// ④ 暴露给父组件
defineExpose({ initHasSpuData });
</script>
```

**父组件 `SpuIndex.vue`**

```vue
<script setup lang="ts">
import { ref } from "vue";
import type { SpuData } from "@/api/product/spu/type";
import SpuForm from "./spuForm.vue";

const scene = ref(0);
const spu = ref<InstanceType<typeof SpuForm> | null>(null);

// 监听子组件派发的事件
const changeScene = (num: number) => {
  scene.value = num;
};

// 点击"修改"按钮
const handleEditSpu = (row: SpuData) => {
  scene.value = 1;
  spu.value?.initHasSpuData(row); // 通过 expose 调用
};
</script>

<template>
  <SpuForm ref="spu" v-show="scene === 1" @change-scene="changeScene" />
</template>
```

这里同时用到了两种通信方向:

- **子 → 父**:`changeScene` 事件(`defineEmits`)
- **父 → 子**:通过 `ref` 调用 `initHasSpuData`(`defineExpose`)
- 如果要在表单初始化之外还持续同步某些属性(比如分类 id),就再加 `defineProps`。

---

## 五、速查对照

| 需求                                 | 使用哪个宏                                               |
| ------------------------------------ | -------------------------------------------------------- |
| 父组件要持续传数据给子组件           | `defineProps`                                            |
| 子组件要通知父组件做某事             | `defineEmits`                                            |
| 父组件要在某个时机主动调用子组件方法 | `defineExpose`                                           |
| 父组件要双向绑定子组件的某个值       | `defineProps` + `defineEmits`(或 `defineModel`,Vue 3.4+) |

> 小贴士：`defineModel` 在 Vue 3.4 起稳定，用来简化组件 `v-model` 的 props + emits 样板；Vue 3.5 默认启用了响应式 Props 解构，并新增了 `useTemplateRef`。
