# React

## React 19 最常用的 Hook

### 基础 Hook

| Hook              | 用途                           | 使用频率   |
| ----------------- | ------------------------------ | ---------- |
| `useState`        | 状态管理                       | ⭐⭐⭐⭐⭐ |
| `useEffect`       | 副作用处理（数据获取、订阅等） | ⭐⭐⭐⭐⭐ |
| `useCallback`     | 在依赖不变时复用函数引用       | ⭐⭐⭐⭐   |
| `useMemo`         | 缓存计算结果，避免重复计算     | ⭐⭐⭐⭐   |
| `useRef`          | 引用 DOM / 存储不变的值        | ⭐⭐⭐⭐   |
| `useContext`      | 跨组件传递数据                 | ⭐⭐⭐⭐   |
| `useReducer`      | 复杂状态逻辑管理               | ⭐⭐⭐     |
| `useLayoutEffect` | 布局相关的同步副作用           | ⭐⭐⭐     |

### React 19 新增 Hook

| Hook             | 用途                                | 使用频率   |
| ---------------- | ----------------------------------- | ---------- |
| `useActionState` | 管理 Action 的状态和待处理状态      | ⭐⭐⭐⭐⭐ |
| `useFormStatus`  | 从 `react-dom` 获取父表单的提交状态 | ⭐⭐⭐⭐   |
| `useOptimistic`  | 乐观更新（立即更新 UI，后台同步）   | ⭐⭐⭐⭐   |

---

### 最常用的 5 个

```
1. useState → 状态管理
2. useEffect → 副作用
3. useCallback → 优化性能
4. useMemo → 优化性能
5. useRef → DOM 引用 / 持久化值
```

## React组件重新渲染时机

React 组件重新渲染的主要时机包括：

**状态变化**

- 组件自身的 state 发生变化（通过 `useState` 或 `this.setState`）
- React 会用 `Object.is` 比较新旧 state；设置为相同值通常会跳过提交这次更新。某些情况下 React 仍可能先调用组件再决定退出，因此不应依赖 setter 作为“强制渲染”手段。

**Props 变化**

- 父组件重新渲染时，子组件默认也会被调用；是否因为 props 跳过渲染取决于 `memo`、`PureComponent` 等优化及其比较结果。

**父组件重新渲染**

- 父组件重新渲染时，默认情况下所有子组件都会重新渲染
- 即使子组件的 props 没有变化

**Context 变化**

- 组件使用的 Context 值发生变化
- 当 Provider 的 `value` 按 `Object.is` 比较发生变化时，读取该 Context 的后代会收到更新；`memo` 不能阻止组件获得新的 Context 值。

**强制更新**

- 类组件调用 `forceUpdate()`
- 函数组件没有公开的 `forceUpdate()` API。通常应让界面由真实 state/props 驱动，而不是维护一个无业务意义的随机值来强制刷新。

`useReducer` 的 dispatch 只有在 reducer 返回的新 state 未被 `Object.is` 判定为相同时才需要提交更新；自定义 Hook 内部使用的 state、reducer、context 或外部 store 也遵循对应来源的更新规则。Effect 的依赖变化本身不会发起渲染，而是决定已经渲染后是否重新同步副作用。

**优化渲染的方式：**

- `React.memo` - 浅比较 props，避免不必要的函数组件渲染
- `useMemo` / `useCallback` - 缓存计算结果和函数引用
- `PureComponent` - 类组件的浅比较优化
- `shouldComponentUpdate` - 自定义渲染判断逻辑

需要注意的是，重新渲染不等于 DOM 更新。React 会通过虚拟 DOM diff 算法，只更新实际变化的部分。

## 基础知识

### 插值语句

```tsx
const id = "intro";
const cls = "active";
const items = [
  { id: "a", label: "A" },
  { id: "b", label: "B" },
];
const trustedHtml = "<strong>只放经过可信来源或消毒处理的 HTML</strong>";

export function Example() {
  const handleClick = (value: string) => console.log(value);

  return (
    <section id={id} className={`${cls} panel`} style={{ color: "red" }}>
      <button onClick={() => handleClick("aaaa")}>点击</button>
      <pre>{JSON.stringify({ id, cls }, null, 2)}</pre>
      <div dangerouslySetInnerHTML={{ __html: trustedHtml }} />
      {items.map((item) => (
        <div key={item.id}>{item.label}</div>
      ))}
    </section>
  );
}
```

JSX 中不能直接渲染普通对象，可选择字段或显式序列化。`dangerouslySetInnerHTML` 与 children 不能同时使用，且未经消毒的外部 HTML 会造成 XSS。列表 `key` 应使用稳定业务标识；只有列表确实不会重排、插入或删除时才适合用索引。

::: tip 一些要点

`onClick` 接收事件处理函数，而不是字符串或渲染期间立即执行的函数调用。没有额外参数时可写 `onClick={handleClick}`；需要传参时可写 `onClick={() => setHome(false)}`，这里是用箭头函数延迟调用，并不是“高阶函数”。

条件渲染 循环渲染:

直接在标签内部编写逻辑块, 渲染结果会根据数据变化而变化
:::

## babel

1. 解析并转换较新的 JavaScript 语法
2. 通过 preset/plugin 转换 JSX、TypeScript 语法等
3. 提供可组合的插件与 preset 体系

Babel 负责语法转换，但不会凭空提供运行时 API。需要兼容旧环境时，应根据目标环境配合 `core-js` 等 polyfill 方案；具体是否、如何注入取决于 preset 配置。

## SWC

1. JavaScript、JSX、TypeScript 与 TSX 的解析和转换
2. 按目标环境降级语法
3. 代码压缩
4. 可作为 webpack、Rspack、Next.js 等工具链中的编译器

SWC 核心是编译器，不应直接等同于完整模块打包器。它能移除 TypeScript 类型语法，但默认不执行 TypeScript 类型检查；类型检查仍需 `tsc --noEmit` 或其他工具。

### 原理

## Hooks

Hook 只能在 React 函数组件或自定义 Hook 的顶层调用，不能放在循环、条件分支或普通函数中。

### useState 状态

对于基本类型的使用:

```tsx
import { useState } from "react";

function App() {
  const [message, setMessage] = useState("test1");

  return (
    <>
      <h1>{message}</h1>
      <button onClick={() => setMessage("test2")}>更新文本</button>
    </>
  );
}

export default App;
```

对于复杂类型的使用:

- 添加元素 --> concat, [...arr]
- 删除元素 --> filter, slice
- 替换元素 --> map
- 排序 --> 先将数组复制一份

这些操作都应返回新数组，不要直接修改 state 中原有的数组：

```tsx
const [items, setItems] = useState([1, 2, 3]);

setItems((current) => [...current, 4]);
setItems((current) => current.filter((item) => item !== 1));
setItems((current) => current.map((item) => (item === 2 ? 666 : item)));
setItems((current) => [...current].sort((a, b) => a - b));
```

`useState` 的 setter 会为后续渲染排队更新；它不会立即改变当前事件处理函数已经读取到的 state 快照。`useReducer` 也遵循相同的渲染与批处理机制，适合把复杂的状态转换集中到 reducer 中，但不能用来获得“同步更新”。

::: warning 注意

调用 setter 后，当前函数中的状态变量仍然是本次渲染的快照；新值会在后续渲染中读取到。

This is because states behaves like a snapshot. Updating state requests another render with the new state value, but does not affect the count JavaScript variable in your already-running event handler.

如果当前逻辑还需要使用计算后的值，可以先把它保存到变量中，再传给 setter：

```ts
const nextCount = count + 1;
setCount(nextCount);

console.log(count); // 0
console.log(nextCount); // 1
```

如果下一状态依赖上一状态，尤其是在同一批处理中连续更新多次，应使用函数式更新：

```ts
setAge(age + 1); // 只基于当前渲染快照计算一次时可以使用
setAge((currentAge) => currentAge + 1); // 依赖上一状态时更稳妥
```

:::

### useReducer：集中管理复杂状态更新

`const [state, dispatch] = useReducer(reducer, initialArg, init?)`

- `reducer`: 纯函数；接收当前 state 和 action，并返回下一 state。初始化和后续渲染期间 React 都可能调用它，开发模式下还可能额外调用以帮助发现副作用
- `initialArg`: 默认值
- `init`: 可选的惰性初始化函数；React 使用 `init(initialArg)` 的返回值作为初始 state

![useReducer](/assert/react-image/useReducer.png)

示例:

```tsx
import { useReducer } from "react";

const initData = [
  { name: "小满(只)", price: 100, count: 1, id: 1, isEdit: false },
  { name: "中满(只)", price: 200, count: 1, id: 2, isEdit: false },
  { name: "大满(只)", price: 300, count: 1, id: 3, isEdit: false },
];

type Data = typeof initData;

type Action =
  | { type: "add" | "sub" | "del" | "edit" | "blur"; id: number }
  | { type: "update_name"; id: number; newName: string };

// 处理函数
const reducer = (state: Data, action: Action): Data => {
  switch (action.type) {
    case "add":
      return state.map((item) =>
        item.id === action.id ? { ...item, count: item.count + 1 } : item,
      );
    case "sub":
      return state.map((item) =>
        item.id === action.id
          ? { ...item, count: Math.max(0, item.count - 1) }
          : item,
      );
    case "del":
      return state.filter((item) => item.id !== action.id);
    case "edit":
      return state.map((item) =>
        item.id === action.id ? { ...item, isEdit: !item.isEdit } : item,
      );
    case "update_name":
      return state.map((item) =>
        item.id === action.id ? { ...item, name: action.newName } : item,
      );
    case "blur":
      return state.map((item) =>
        item.id === action.id ? { ...item, isEdit: false } : item,
      );
  }
};

function App() {
  const [data, dispatch] = useReducer(reducer, initData);
  return (
    <>
      <h1>购物车</h1>
      <table width={800} border={1} cellPadding={0} cellSpacing={0}>
        <thead>
          <tr>
            <th>名称</th>
            <th>单价</th>
            <th>数量</th>
            <th>总价</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            return (
              <tr key={item.id}>
                <td align="center">
                  {item.isEdit ? (
                    <input
                      onBlur={() => {
                        dispatch({
                          type: "blur",
                          id: item.id,
                        });
                      }}
                      onChange={(e) => {
                        dispatch({
                          type: "update_name",
                          id: item.id,
                          newName: e.target.value,
                        });
                      }}
                      type="text"
                      value={item.name}
                    />
                  ) : (
                    item.name
                  )}
                </td>
                <td align="center">{item.price}</td>
                <td align="center">
                  <button
                    onClick={() => dispatch({ type: "add", id: item.id })}
                  >
                    +
                  </button>
                  {item.count}
                  <button
                    onClick={() => dispatch({ type: "sub", id: item.id })}
                  >
                    -
                  </button>
                </td>
                <td align="center">{item.price * item.count}</td>
                <td align="center">
                  <button
                    onClick={() => dispatch({ type: "edit", id: item.id })}
                  >
                    修改
                  </button>
                  <button
                    onClick={() => dispatch({ type: "del", id: item.id })}
                  >
                    删除
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4}></td>
            <td align="right">
              总价:
              {data.reduce((a, b) => a + b.price * b.count, 0)}
            </td>
          </tr>
        </tfoot>
      </table>
    </>
  );
}

export default App;
```

### useImmer (第三方hook)

安装: `pnpm add immer use-immer`

```tsx
import { useImmer, useImmerReducer } from "use-immer";

type User = {
  profile: { preferences: { theme: "light" | "dark" } };
};

function ThemeButton() {
  const [user, setUser] = useImmer<User>({
    profile: { preferences: { theme: "light" } },
  });

  const updateTheme = () => {
    setUser((draft) => {
      draft.profile.preferences.theme = "dark";
    });
  };

  return (
    <button onClick={updateTheme}>{user.profile.preferences.theme}</button>
  );
}

type State = { count: number; isLoading: boolean; history: number[] };
type Action =
  | { type: "INCREMENT" | "DECREMENT" | "RESET" | "ADD_TO_HISTORY" }
  | { type: "SET_LOADING"; payload: boolean };

function counterReducer(draft: State, action: Action) {
  switch (action.type) {
    case "INCREMENT":
      draft.count += 1;
      break;
    case "DECREMENT":
      draft.count -= 1;
      break;
    case "RESET":
      draft.count = 0;
      break;
    case "SET_LOADING":
      draft.isLoading = action.payload;
      break;
    case "ADD_TO_HISTORY":
      draft.history.push(draft.count);
      break;
  }
}

function Counter() {
  const [state, dispatch] = useImmerReducer(counterReducer, {
    count: 0,
    isLoading: false,
    history: [],
  });

  return (
    <button onClick={() => dispatch({ type: "INCREMENT" })}>
      {state.count}
    </button>
  );
}
```

### useSyncExternalStore

useSyncExternalStore 用于从外部存储（例如状态管理库、浏览器 API 等）获取状态并在组件中同步显示。这对于需要跟踪外部状态的应用非常有用。

使用场景:

1. 订阅外部 store，例如 Redux、Zustand 等
2. 订阅浏览器API 例如(online,storage,location)等
3. 抽离逻辑，编写自定义hooks
4. 服务端渲染支持

用法:

```ts
const snapshot = useSyncExternalStore(
  subscribe,
  getSnapshot,
  getServerSnapshot,
);
```

- subscribe：用来订阅数据源的变化，接收一个回调函数，在数据源更新时调用该回调函数。
- getSnapshot：获取当前数据源的快照（当前状态）。在 store 没有变化时，它必须返回与上次 `Object.is` 相等的值；如果快照是可变对象，应缓存不可变快照。
- getServerSnapshot：可选。在服务端渲染以及 hydration 时提供初始快照；服务端输出与客户端首次读取的值应保持一致。

案例一:

```tsx
// App.tsx
import { useStorage } from "./hooks/useStorage";

const App = () => {
  const [count, setCount] = useStorage("key", 1);
  return (
    <>
      <h1>{count}</h1>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(count - 1)}>-</button>
    </>
  );
};

export default App;
```

```ts
// useStorage.ts
import { useCallback, useRef, useSyncExternalStore } from "react";

const localChangeEvent = "local-storage-change";

export const useStorage = <T>(key: string, initialValue: T) => {
  const cache = useRef<{ raw: string | null; value: T }>({
    raw: null,
    value: initialValue,
  });

  // 订阅者
  // 2. React 调用 subscribe(内部callback)，建立监听
  const subscribe = useCallback(
    (callback: () => void) => {
      const handleStorage = (event: StorageEvent) => {
        if (event.key === key) callback();
      };
      const handleLocalChange = (event: Event) => {
        const { detail } = event as CustomEvent<{ key: string }>;
        if (detail.key === key) callback();
      };

      // storage 事件负责其他文档的更新；自定义事件负责当前文档的更新
      window.addEventListener("storage", handleStorage);
      window.addEventListener(localChangeEvent, handleLocalChange);
      return () => {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener(localChangeEvent, handleLocalChange);
      };
    },
    [key],
  );

  // 快照
  // 1. React 调用 getSnapshot()，先拿当前值
  const getSnapshot = useCallback(() => {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      if (
        cache.current.raw !== null ||
        !Object.is(cache.current.value, initialValue)
      ) {
        cache.current = { raw: null, value: initialValue };
      }
      return cache.current.value;
    }
    if (raw === cache.current.raw) return cache.current.value;

    let value = initialValue;
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = initialValue;
    }
    cache.current = { raw, value };
    return value;
  }, [initialValue, key]);

  const value = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => initialValue,
  );

  const update = (nextValue: T) => {
    localStorage.setItem(key, JSON.stringify(nextValue));
    window.dispatchEvent(
      new CustomEvent(localChangeEvent, { detail: { key } }),
    );
  };

  return [value, update] as const;
};

// const [count, setCount] = useStorage("count", 1);
```

案例二:

```tsx
// App.tsx
import { useHistory } from "./hooks/useHistory";
const App = () => {
  const [url, push, replace] = useHistory();
  return (
    <>
      <h1>{url}</h1>
      <button onClick={() => push("/a")}>跳转</button>
      <button onClick={() => replace("/b")}>跳转</button>
    </>
  );
};

export default App;
```

```ts
// useHistory.ts
import { useSyncExternalStore } from "react";

const historyChangeEvent = "app-history-change";

export const useHistory = () => {
  const subscribe = (callback: () => void) => {
    // popstate 处理前进/后退；hashchange 处理 URL 片段变化；
    // 自定义事件处理本 Hook 主动执行的 pushState/replaceState。
    window.addEventListener("popstate", callback);
    window.addEventListener("hashchange", callback);
    window.addEventListener(historyChangeEvent, callback);
    return () => {
      window.removeEventListener("popstate", callback);
      window.removeEventListener("hashchange", callback);
      window.removeEventListener(historyChangeEvent, callback);
    };
  };

  const getSnapshot = () => {
    return window.location.href;
  };

  const url = useSyncExternalStore(subscribe, getSnapshot);

  const push = (url: string) => {
    window.history.pushState({}, "", url);
    window.dispatchEvent(new Event(historyChangeEvent));
  };

  const replace = (url: string) => {
    window.history.replaceState({}, "", url);
    window.dispatchEvent(new Event(historyChangeEvent));
  };

  return [url, push, replace] as const;
};

/**
 * url 当前页面路径
 */
// const [url, push, replace] = useHistory();
```

### useTransition：把非紧急更新标记为 Transition

```ts
const [isPending, startTransition] = useTransition();
```

- 参数: `useTransition` 不需要任何参数

- 返回值: `useTransition` 返回一个数组,包含两个元素

1. `isPending(boolean)`，告诉你是否存在待处理的 transition。
2. `startTransition(function)` 函数，你可以使用此方法将状态更新标记为 transition。

React 19 允许传给 `startTransition` 的 Action 是异步函数。不过在当前版本中，`await` 之后发生的状态更新不会自动继承 Transition 标记，需要再包一层 `startTransition`。输入框自身的受控更新也不能直接放进 Transition，应立即更新输入值，再延迟渲染代价较高的结果。

### useDeferredValue：延迟使用某个值

:::info `useTransition` 和 `useDeferredValue` 的区别

`useTransition` 和 `useDeferredValue` 都涉及延迟更新，但它们关注的重点和用途略有不同：

- `useTransition` 用于把自己能够控制的状态更新标记为非紧急更新，并通过 `isPending` 提供待处理状态。
- `useDeferredValue` 返回某个值的延迟版本，适合在无法控制该值的更新来源时，让依赖它的较慢 UI 在后台重新渲染。它不会延迟网络请求，也不会改变原值本身。
  :::

```ts
// value: 延迟更新的值(支持任意类型)
const deferredValue = useDeferredValue(value, initialValue);
```

第二个 `initialValue` 参数是可选的；提供时，组件首次渲染会使用它作为延迟值，并在后台用真实值重新渲染。

### useEffect

`useEffect` 用于让组件与 React 之外的系统同步，例如网络、浏览器 API、计时器或第三方组件。它的执行过程和类组件的部分生命周期阶段相似，但更准确的理解是“建立同步，并在必要时撤销同步”。

> 什么是副作用函数，什么是纯函数？

- 纯函数:
  1. 输入决定输出：相同的输入永远会得到相同的输出。这意味着函数的行为是`可预测的`。
  2. 无副作用：纯函数`不会修改外部状态`，也`不会依赖外部可变状态`。因此，纯函数内部的操作不会影响外部的变量、文件、数据库等。
- 副作用函数:
  1. 副作用函数指的是那些在执行时`会改变外部状态`或`依赖外部可变状态`的函数。
  2. 可预测性降低但是副作用不一定是坏事有时候副作用带来的效果才是我们所期待的
  3. `高耦合度`函数非常依赖外部的变量状态紧密

:::info 副作用函数的例子

- 操作引用类型
- 操作本地存储例如`localStorage`
- 调用外部API，例如`fetch` `ajax`
- 操作`DOM`
- 计时器
  :::

```ts
//------------副作用函数--------------
const mutableUser = { name: "小满" };
const mutateUser = (user: { name: string }) => {
  user.name = "大满";
  return user;
};
mutateUser(mutableUser); // 修改了传入对象

//------------修改成纯函数--------------
const immutableUser = { name: "Alice" };
const renameUser = (user: { name: string }) => {
  return { ...user, name: "Jack" };
};

const renamedUser = renameUser(immutableUser);
console.log(immutableUser, renamedUser);
```

#### 基本用法

```ts
useEffect(setup, dependencies);
```

参数:

- `setup`：Effect 处理函数，可以返回一个清理函数。组件提交到页面后执行 setup；依赖项变化时先使用旧值执行 cleanup，再使用新值执行 setup；卸载时再执行最后一次 cleanup。
- `dependencies`：setup中使用到的响应式值列表(props、state等)。必须以数组形式编写如[dep1, dep2]。不传则每次重渲染都执行Effect。

示例:

```tsx
import { useEffect, useRef } from "react";

function App() {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log(elementRef.current); // 已提交到 DOM 的 div
  }, []);

  return <div ref={elementRef}>zs</div>;
}
```

执行时机:

1. React 提交 DOM 更新后，Effect 的 setup 会按调度时机执行；它不是在渲染函数执行完后“立刻”运行。
2. 不传依赖数组时，每次提交后都会重新执行。
3. 传入依赖数组时，只有某个依赖与上次相比不满足 `Object.is` 相等才会重新执行；空数组表示不因响应式值变化而重跑。
4. 清理函数会在下一次相关 setup 之前以及组件卸载时执行。开发环境启用 Strict Mode 时，React 还会额外执行一次 setup → cleanup → setup，以检查清理逻辑是否完整。

::: warning useEffect的一些注意点

useEffect

1. setup 只能返回清理函数或不返回值，不能直接声明为 `async`，因为异步函数会返回 Promise。需要异步工作时，可在 setup 内定义并调用异步函数。
2. 依赖数组必须包含 setup 中读取的所有响应式值；空数组在生产环境通常只建立一次同步，但开发环境 Strict Mode 会进行额外检查。
3. 清理函数不仅在卸载时执行，也会在依赖变化后、下一次 setup 运行之前执行。
4. 不要用 Effect 处理可以在渲染期间直接计算的数据；Effect 主要用于与外部系统同步。

:::

### Clean up

React calls your setup and cleanup functions whenever it’s necessary, which may happen multiple times:

1. Your setup code runs when your component is added to the page (mounts).
2. After every commit of your component where the dependencies have changed:
   - First, your `cleanup code` runs with the old props and state.
   - Then, your `setup code` runs with the new props and state.
3. Your `cleanup code` runs one final time after your component is `removed` from the page (unmounts).

```tsx
import { useEffect, useState } from "react";

function Clock() {
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  return <time>{currentTime.toLocaleString()}</time>;
}
```

### SWR

SWR = Stale-While-Revalidate，用于数据获取的 React Hooks 库

> 实现一个功能: 当页面首次加载时, 自动发送一次请求, 当点击按钮时, 再次发送一次请求.

可以使用`useEffect` 来实现:

```jsx
import { useCallback, useEffect, useState } from "react";

const adviceURL = "https://api.adviceslip.com/advice";

function App() {
  const [advice, setAdvice] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const getAdvice = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetch(adviceURL);
      if (!result.ok) throw new Error(`HTTP ${result.status}`);
      const data = await result.json();
      setAdvice(data.slip.advice);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void getAdvice();
  }, [getAdvice]);

  return (
    <main>
      <h1>Advice App</h1>
      <p>{isLoading ? "Loading..." : advice}</p>
      <button disabled={isLoading} onClick={getAdvice}>
        Get Advice
      </button>
    </main>
  );
}
export default App;
```

使用 SWR 时仍然需要提供请求函数（fetcher），但缓存、重新验证和请求状态由 SWR 管理：

```jsx
import useSWR from "swr";
function App() {
  const adviceURL = "https://api.adviceslip.com/advice";

  const fetcher = (...args) => fetch(...args).then((res) => res.json());
  /**
   * SWR 会在 key 有效时请求数据，并可在重新聚焦、网络恢复等时机重新验证
   * data 是 API 返回的数据
   * isLoading 是一个布尔值，表示数据是否正在加载中
   * error 是 API 返回的错误信息
   * mutate 是一个函数，用于手动触发数据更新
   */
  const {
    data,
    error,
    isLoading,
    mutate: getAdvice,
  } = useSWR(adviceURL, fetcher);

  return (
    <main>
      <h1>Advice App</h1>
      <p>
        {error ? error.message : isLoading ? "Loading..." : data?.slip?.advice}
      </p>
      <button disabled={isLoading} onClick={() => getAdvice()}>
        Get Advice
      </button>
    </main>
  );
}
export default App;
```

SWR也可以不一上来获取数据, 而是在需要的时候获取. 可以使用`useSWRMutation`.

```ts
const { trigger, data, error, isMutating } = useSWRMutation(
  key,
  fetcher,
  options,
);
```

这里各部分含义：

1. API_URL

- 第一个参数 key（请求标识/基础 key）。
- 你这里通常是接口基础地址，比如 https://api.openweathermap.org/data/2.5。

2. fetcher

- 第二个参数，请求函数。(封装一个fetch, 用于请求数据)
- 传入请求函数
- 调用 `trigger(arg)` 时，SWR 会把 `arg` 作为第二个参数对象中的 `arg` 字段传给 fetcher，例如 `async (url, { arg }) => ...`；第一个参数仍是 key。

3. 解构出来的内容

- trigger：手动触发请求的函数（mutation 不会自动请求）。触发的就是传进去的fetcher。
- data：请求成功后的返回数据（即 fetcher 返回的 JSON）。
- isMutating：是否正在请求中（true/false）。
- error：请求失败时的错误对象。

### useLayoutEffect

`useLayoutEffect` 是 React 中的一个 Hook，用于在浏览器重新绘制屏幕之前触发。

用法:

```ts
useLayoutEffect(() => {
  // 副作用代码
  return () => {
    // 清理代码
  };
}, [dependencies]);
```

参数: 和 `useEffect` 类似

:::info useLayoutEffect和useEffect区别

| 区别         | useLayoutEffect                    | useEffect                                                    |
| ------------ | ---------------------------------- | ------------------------------------------------------------ |
| **执行时机** | DOM 已提交、浏览器绘制前执行       | 通常在浏览器绘制后执行；交互触发的 Effect 也可能在绘制前运行 |
| **调度特征** | setup 与其中的更新会阻塞浏览器绘制 | 不应依赖“必定异步”或“必定绘制后”的时序                       |
| **适用范围** | 绘制前测量布局或同步调整视觉结果   | 默认选择，用于大多数外部系统同步                             |

:::

应用场景:

- 需要同步读取或更改DOM：例如，你需要读取元素的大小或位置并在渲染前进行调整。
- 防止闪烁：在某些情况下，异步的`useEffect`可能会导致可见的布局跳动或闪烁。例如，动画的启动或某些可见的快速DOM更改。
- 第三方 DOM 库要求在浏览器绘制前完成测量和同步调整。除此之外应优先使用 `useEffect`，避免不必要地阻塞绘制。

### useRef

- 通过Ref操作DOM元素
- 数据存储

```tsx
import { useRef } from "react";

function TextInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input ref={inputRef} />
      <button onClick={() => inputRef.current?.focus()}>聚焦</button>
    </>
  );
}
```

#### 注意事项

1. 组件在重新渲染的时候，useRef的值不会被重新初始化。
2. 改变 ref.current 属性时，React 不会重新渲染组件。React 不知道它何时会发生改变，因为 ref 是一个普通的 JavaScript 对象。(不是响应式的)
3. `ref` 对象本身的引用通常是稳定的，可以出现在依赖数组中；但修改 `ref.current` 不会触发渲染，因此把 `ref.current` 放入依赖数组也不能让 Effect 自动响应其变化。
4. React 18 中，函数组件要接收父组件传入的 `ref`，通常需要 `forwardRef`。React 19 支持把 `ref` 作为函数组件的 prop 传入，新代码不再必须使用 `forwardRef`；类组件和 DOM 元素仍可直接接收 ref。

### useImperativeHandle 父组件使用子组件的实例 方法

```ts
/**
 * ref: 父组件传递的ref对象
   createHandle: 返回值，返回一个对象，对象的属性就是子组件暴露给父组件的方法或属性
   deps?:[可选] 依赖项，当依赖项发生变化时，会重新调用createHandle函数，类似于useEffect的依赖项
 */
useImperativeHandle(
  ref,
  () => {
    return {
      // 暴露给父组件的方法或属性
    };
  },
  dependencies,
);
```

#### 执行时机

1. 不传第三个参数时，每次组件重新渲染都会重新执行 `createHandle`。
2. 传入空数组时，在依赖不变的情况下复用同一个句柄。
3. 传入依赖项时，React 使用 `Object.is` 比较依赖；变化后会重新执行 `createHandle`。开发环境 Strict Mode 可能额外调用组件函数以检查纯度，因此不要在 `createHandle` 中放置副作用。

### useContext

`useContext` 提供了一个无需为每层组件手动添加 props，就能在组件树间进行数据传递的方法。设计的目的就是解决组件树间数据传递的问题。

:::info 面试题
使用 `useContext` 避免了层层传递props, 并且实现了跨组件之间的共享状态, 使组件之间的通讯变得更加简单. 换而言之, `useContext` 实现了祖孙级别的通讯.
:::

#### 基本用法

```tsx
import { createContext, useContext } from "react";

const MyThemeContext = createContext({ theme: "light" });

function App() {
  return (
    <MyThemeContext value={{ theme: "dark" }}>
      <MyComponent />
    </MyThemeContext>
  );
}

function MyComponent() {
  const themeContext = useContext(MyThemeContext);
  return <div>{themeContext.theme}</div>;
}
```

React 19 可以直接把 Context 对象作为 Provider 使用。React 18 应写成 `<MyThemeContext.Provider value={...}>`；React 19 仍兼容 `.Provider`，并不是删除了 Provider。

#### 注意事项

- Provider 接收的上下文值使用 `value` prop 传递
- 可以使用多个 `Context`
- 组件读取同一个 Context 时，会获得其上方距离最近的 Provider 所提供的值

### useMemo 性能优化

`useMemo` 是 React 提供的性能优化 Hook。它会在依赖不变时复用上一次的计算结果，可用于跳过代价较高的计算或稳定对象引用。它不提供语义保证，React 在特定情况下可能丢弃缓存，因此程序的正确性不能依赖 `useMemo`。

#### React.memo

`React.memo` 是一个 React API，用于在父组件重新渲染、且组件 props 与上次相比没有变化时跳过该组件的重新渲染。默认比较方式是逐项使用 `Object.is`；组件自身 state 或读取到的 Context 变化时仍会重新渲染。

#### 用法

使用 `React.memo` 包裹组件可以在 props 稳定时跳过一部分不必要的重新渲染，但它只是性能优化，不应无条件用于所有组件。

```tsx
// React.memo
import { memo, useMemo, useState } from "react";

const MyComponent = memo(({ total }: { total: number }) => {
  return <p>总计：{total}</p>;
});

const App = () => {
  const [prices, setPrices] = useState([10, 20, 30]);
  const total = useMemo(
    () => prices.reduce((sum, price) => sum + price, 0),
    [prices],
  );

  return (
    <>
      <MyComponent total={total} />
      <button onClick={() => setPrices((items) => [...items, 40])}>添加</button>
    </>
  );
};
```

::: warning React的渲染条件是什么?

1. 组件自身 state 更新。
2. 组件读取的 Context 值变化。
3. 父组件重新渲染时，默认也会继续渲染其子组件；`memo` 可以在 props 未变化时跳过这一过程。
4. 外部 store 的订阅快照发生变化等其他更新来源。
   :::

### useCallback 性能优化

`useCallback` 返回一个在依赖不变时保持引用相同的函数。它常与 `memo`、其他 Hook 的依赖数组或需要稳定回调引用的 API 配合使用。

组件每次渲染时仍会创建传给 `useCallback` 的函数表达式；React 只是决定返回上次缓存的函数引用还是本次的新函数。单独使用它不会阻止组件渲染，也不一定能提高性能。

#### 用法

```ts
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

:::info `useCallback` 和 `useMemo` 的区别

- `useMemo(() => value, deps)` 缓存计算结果。
- `useCallback(fn, deps)` 缓存函数引用，等价于 `useMemo(() => fn, deps)`。
  :::

### useDebugValue

`useDebugValue` 是一个专为开发者调试自定义 Hook 而设计的 React Hook。它允许你在 React 开发者工具中为自定义 Hook 添加自定义的调试值。

#### 用法

```ts
useDebugValue(value, formatValue);
```

`useDebugValue` 没有返回值，应在自定义 Hook 顶层调用。可选的格式化函数只在 React DevTools 读取调试值时执行，适合格式化成本较高的情况。

### useId

`useId` 是 React 18 新增的一个 Hook，用于生成稳定的唯一标识符，主要用于解决 SSR 场景下的 ID 不一致问题，或者需要为组件生成唯一 ID 的场景。

用法:

```ts
const id = useId();
```

返回值的具体格式属于 React 实现细节，不应解析或依赖；`useId` 主要用于关联 `label` 与表单控件、ARIA 属性等。它不应用来生成列表的 `key`，列表 key 应来自数据本身。

## 组件

### 组件通信

#### 父子组件通信

React 组件使用 `props` 来互相通信。每个父组件都可以提供 `props` 给它的子组件，从而将一些信息传递给它。`Props` 可能会让你想起 HTML 属性，但你可以通过它们传递任何 JavaScript 值，包括对象、数组和函数 以及 html 元素，这样可以使我们的组件更加灵活。 `props` 是一个 `对象`，对象中的属性是父组件传递给子组件的属性。

在React中，也允许将属性传递给自己编写的`组件`:

```tsx
// 其中title content被称为props
export default function App() {
  return <Card title="标题1" content="内容"></Card>;
}
```

1. props基本用法
2. TypeScript 类型:
   - 可以使用 `interface` 或 `type` 为 props 添加类型。
   - 可以直接标注函数参数，也可以使用 `React.FC`（Function Component）；`React.FC` 不是必需的。
3. 默认值:
   - 解构
   - 声明一个默认对象
4. props.children 特殊的prpos, 类似于vue中的slot
5. props支持所有的数据类型
6. 子传父(类似Vue中的 emit) 在父组件中把函数体传给子组件, 在子组件中调用这个函数, 同时把数据传递给这个函数

#### 兄弟组件通信

- 最常见的方式是把共享状态提升到最近的共同父组件，再通过 props 和回调分别传给两个子组件。
- 跨越较深组件层级时，可以把共享状态和更新函数放入 Context。
- 需要与 React 组件树之外的事件源通信时，也可以使用 `mitt` 等发布订阅工具，但兄弟组件通信本身并不等同于发布订阅模式。

### 受控组件 非受控组件

#### 受控组件

受控组件一般是指`表单`元素，表单的数据由React的 `State` 管理，更新数据时，需要手动调用 `setState()` 方法更新数据, 类似于Vue的`v-model`。 但是React没有实现`v-model`，需要我们自己实现。

```tsx
// 需要绑定onChange事件
import React, { useState } from "react";

const App: React.FC = () => {
  const [value, setValue] = useState("");
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };
  return (
    <>
      <input type="text" value={value} onChange={handleChange} />
      <div>{value}</div>
    </>
  );
};

export default App;
```

#### 非受控组件

非受控组件指的是该表单元素不受React的 `State` 管理，表单的数据由 `DOM` 管理。通过 `useRef()` 来获取表单元素的值。

```tsx
// 操作DOM的方式
import React, { useState, useRef } from "react";
const App: React.FC = () => {
  const value = "xxx";
  const inputRef = useRef<HTMLInputElement>(null);
  const handleChange = () => {
    console.log(inputRef.current?.value);
  };
  return (
    <>
      <input
        type="text"
        onChange={handleChange}
        defaultValue={value}
        ref={inputRef}
      />
    </>
  );
};

export default App;
```

::: tip
受控组件适用于所有表单元素，包括input、textarea、select等。但是除了input type="file" 外，其他表单元素都推荐使用受控组件。
:::

#### 特殊的非受控组件 表单File

```tsx
import React, { useRef } from "react";
const App: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleChange = () => {
    console.log(inputRef.current?.files);
  };
  return (
    <>
      <input type="file" ref={inputRef} onChange={handleChange} />
    </>
  );
};

export default App;
```

### 异步组件

`Suspense` 是 React 用来协调“渲染期间尚未就绪的内容”的边界。当子树发生挂起时，它会暂时显示 `fallback`，待所需代码或数据就绪后再展示内容。

#### 应用场景

- `异步组件加载`：通过代码分包实现组件的按需加载，有效减少首屏加载时的资源体积，提升应用性能。

- `异步数据加载`：读取 Suspense-enabled 框架提供的数据，或使用 `use` 读取已缓存、可复用的 Promise。普通 `useEffect` 中发起的 fetch 不会自动激活 Suspense。

- `样式、流式服务端渲染等资源协调`：具体能力取决于 React 版本和渲染环境。普通 `<img>` 加载并不会自动触发 Suspense；图片等待目前只在特定 View Transition/Canary 场景中提供。

#### 用法

```tsx
/**
 * fallback: 指定在组件加载或数据获取过程中展示的组件或元素
   children: 指定要异步加载的组件或数据
 */
<Suspense fallback={<div>Loading...</div>}>
  <AsyncComponent />
</Suspense>
```

#### 案例 骨架屏

`use` API 可以在组件中读取 Promise 或 Context。读取未完成的 Promise 时会挂起到最近的 Suspense 边界；这个 Promise 应由框架、服务端组件或组件外部的缓存创建并复用，不要在每次客户端渲染时临时创建新 Promise。

### HOC 高阶组件 (面试)

什么是高阶组件？

高阶组件（HOC）不是某个特殊组件，而是“接收组件并返回新组件的函数”。返回的包装组件可以复用横切逻辑、注入 props 或添加行为。Hooks 减少了部分 HOC 的使用场景，但权限、埋点和第三方库适配等场景仍可能使用它。

### Activity (19.2)

用法:

- 恢复隐藏组件的状态
- 恢复隐藏组件的 DOM
- 预渲染可能即将显示的内容
- 加快页面加载过程中的交互速度

它在视觉隐藏方面类似 Vue 的 `v-show`，但语义并不相同：隐藏时 React 会清理子树的 Effect，把隐藏内容的更新降为较低优先级，同时保留组件 state 和已有 DOM；再次显示时会重新建立 Effect。

When an Activity boundary is `hidden`, React will visually hide its children using the `display: "none"` CSS property. It will also destroy their Effects, cleaning up any active subscriptions.

```tsx
import { Activity } from "react";

<Activity mode={visibility}>
  <Sidebar />
</Activity>;
```

```tsx
<Activity mode={isShowingSidebar ? "visible" : "hidden"}>
  <Sidebar />
</Activity>
```

## createPortal API

作用：把一段 React 子节点渲染到指定的 DOM 节点，效果与 Vue 的 Teleport 类似。Portal 只改变 DOM 的物理位置；Context、状态归属以及事件冒泡仍遵循 React 组件树。

### 用法

```tsx
/**
 * 入参
  children：要渲染的组件
  domNode：要渲染到的DOM位置
  key?：可选，用于唯一标识要渲染的组件
返回值
  返回一个React元素(即jsx)，这个元素可以被React渲染到DOM的任意位置
 */
import { createPortal } from "react-dom";

const App = () => {
  return createPortal(<div>aaa</div>, document.body);
};

export default App;
```

### 案例

绝对定位元素会相对于其包含块定位，祖先元素的定位、变换、裁剪和层叠上下文都可能影响弹框。把 Modal 通过 `createPortal` 挂载到 `document.body`，通常能避开祖先的 `overflow` 和层叠上下文限制；`position: fixed` 也常用于视口级弹框，但某些带 `transform` 等属性的祖先仍可能改变其包含块。

```tsx
import "./index.css";
import { createPortal } from "react-dom";
export const Modal = () => {
  return createPortal(
    <div className="modal">
      <div className="modal-header">
        <div className="modal-title">标题</div>
      </div>
      <div className="modal-content">
        <h1>Modal</h1>
      </div>
      <div className="modal-footer">
        <button className="modal-close-button">关闭</button>
        <button className="modal-confirm-button">确定</button>
      </div>
    </div>,
    document.body,
  );
};
```

## CSS 方案

### CSS modules (Vite)

1. 安装

```sh
npm install less -D # 安装less 任选其一
npm install sass -D # 安装sass 任选其一
npm install stylus -D # 安装stylus 任选其一
```

::: tip
Vite 开箱支持 CSS Modules。把文件命名为 `xxx.module.css`，或使用已安装预处理器对应的扩展名（如 `xxx.module.scss`、`xxx.module.less`），即可按 CSS Module 导入。
:::

#### 修改css modules 规则

Vite基于`postcss-modules`实现的

```ts
// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
  css: {
    modules: {
      localsConvention: "dashes", // 控制导出类名时是否保留或转换横杠命名
      /**
       * 有四个属性
       * camelCase 会把非驼峰的命名转为驼峰，并保留之前的类名 (例如写横杠 同时支持横杠和驼峰命名)
       * camelCaseOnly 只会把非驼峰的命名转为驼峰，并删除之前的类名。
       * dashes 带横杠的转化为驼峰 会保留原始的类名
       * dashesOnly  带横杠的转化为驼峰 会删除原始的类名
       */
      generateScopedName: "[name]__[local]___[hash:base64:5]", // 修改css modules的类名规则 name--> 名称 local--> 类名 hash--> 随机数
    },
  },
});

// generateScopedName 也可以改为以下任一种格式：
// "[local]_[hash:base64:5]"
// "[hash:base64:8]"
// "[name]_[local]"
// "[local]--[hash:base64:4]"
```

#### 维持类名

意思是: 在样式文件中的某些样式，不希望被编译成css modules，可以设置为global，例如：

```css
/* .global包裹 */
.app {
  background: red;
  width: 200px;
  height: 200px;
  :global(.button) {
    background: blue;
    width: 100px;
    height: 100px;
  }
}
```

```tsx
//在使用的时候，就可以直接使用原始的类名 button
import styles from "./index.module.scss";
const App: React.FC = () => {
  return (
    <>
      <div className={styles.app}>
        <button className="button">按钮</button>
      </div>
    </>
  );
};
```

### css in js

#### 优缺点

**优点**：

- 可以让 CSS 拥有独立的作用域，阻止 CSS 泄露到组件外部，防止冲突。
- 可以动态的生成 CSS 样式，根据组件的状态来动态的生成 CSS 样式。
- CSS-in-JS 可以方便地实现主题切换功能，只需更改主题变量即可改变整个应用的样式。

**缺点**：

- 以 styled-components 为代表的运行时 CSS-in-JS 需要在运行时生成和注入样式，会带来一定运行时与包体积成本；编译时 CSS-in-JS 方案则有不同的成本模型。
- 动态生成的类名和样式可能增加调试、服务端渲染与缓存配置的复杂度，但主流工具通常提供 source map 和开发者工具支持。

#### 案例

```tsx
import React from "react";
import styled from "styled-components";
const Button = styled.button<{ primary?: boolean }>`
  ${(props) => (props.primary ? "background: #6160F2;" : "background: red;")}
  padding: 10px 20px;
  border-radius: 5px;
  color: white;
  cursor: pointer;
  margin: 10px;
  &:hover {
    color: black;
  }
`;
const App: React.FC = () => {
  return (
    <>
      <Button primary>按钮</Button>
    </>
  );
};

export default App;
```

#### 继承

我们可以实现一个基础的 Button 组件，然后通过继承来实现更多的按钮样式。

比如例子中的 ButtonBase 组件，然后基于基础样式实现了，BlueButton、FailButton、TextButton 组件，利于我们复用基础样式，以及快速封装组件。

```tsx
import React from "react";
import styled from "styled-components";
const ButtonBase = styled.button`
  padding: 10px 20px;
  border-radius: 5px;
  color: white;
  cursor: pointer;
  margin: 10px;
  &:hover {
    color: red;
  }
`;

//圆角蓝色按钮
const BlueButton = styled(ButtonBase)`
  background-color: blue;
  border-radius: 20px;
`;
//失败按钮
const FailButton = styled(ButtonBase)`
  background-color: red;
`;
//文字按钮
const TextButton = styled(ButtonBase)`
  background-color: transparent;
  color: blue;
`;
const App: React.FC = () => {
  return (
    <>
      <BlueButton>普通按钮</BlueButton>
      <FailButton>失败按钮</FailButton>
      <TextButton>文字按钮</TextButton>
    </>
  );
};

export default App;
```

#### 属性

我们可以通过 attrs 来给组件添加属性，比如 defaultValue，然后通过 props 来获取属性值。

```tsx
import React from "react";
import styled from "styled-components";
interface DivComponentProps {
  defaultValue: string;
}
const InputComponent = styled.input.attrs<DivComponentProps>((props) => ({
  type: "text",
  defaultValue: props.defaultValue,
}))`
  border: 1px solid blue;
  margin: 20px;
`;

const App: React.FC = () => {
  const defaultValue = "小满zs";
  return (
    <>
      <InputComponent defaultValue={defaultValue}></InputComponent>
    </>
  );
};

export default App;
```

#### 全局样式

全局样式一般是单独封装到一个文件里面，然后引入到组件里面使用。

```tsx
import React from "react";
import styled, { createGlobalStyle } from "styled-components";
const GlobalStyle = createGlobalStyle`
  body {
    background-color: #f0f0f0;
  }
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  ul,ol{
      list-style: none;
  }
`;
const App: React.FC = () => {
  return (
    <>
      <GlobalStyle />
    </>
  );
};

export default App;
```

#### 动画

我们可以通过 `keyframes` 来创建动画。

```tsx
import React from "react";
import styled, { keyframes } from "styled-components";

const move = keyframes`
  0%{
    transform: translateX(0);
  }
  100%{
    transform: translateX(100px);
  }
`;
const Box = styled.div`
  width: 100px;
  height: 100px;
  background-color: red;
  animation: ${move} 1s linear infinite;
`;
const App: React.FC = () => {
  return (
    <>
      <Box></Box>
    </>
  );
};

export default App;
```

#### 原理剖析

这个技术叫`标签模板`，是 ES6 新增的特性，它可以紧跟在函数后面，该函数将被用来调用这个字符串模板

调用完成之后, 这个函数的第一个参数是模板字符串的静态字符串, 从第二个参数开始, 是模板字符串中变量值, 也就是`${ }`里面的值

```tsx
/**
 * 第一个参数是静态字符串 是一个数组
 * 第二个参数开始是变量值 ${}
 */
const div = function (strArr: TemplateStringsArray, ...args: any[]) {
  // console.log(strArr, args);
  // strArr：['\n color:red;\n width:', 'px;\n height:', 'px;\n', raw: Array(3)]
  // args：[30, 50]
  return strArr.reduce((result, str, i) => {
    return result + str + (args[i] ?? "");
  }, "");
};

//div是一个函数 可以通过()调用 也可以通过call 还可以通过模版字符串调用 如下:
const a = div`
  color:red;
  width:${30}px;
  height:${50}px;
`;
console.log(a);
//  输出结果
//  color:red;
//  width:30px;
//  height:50px;
```

### TailwindCSS

### 组件实战

## React Router

React Router v7 提供三种逐级增强的使用模式：

- 声明模式：使用 `<BrowserRouter>`、`<Routes>` 等 API 完成基础匹配和导航。
- `数据`模式：在声明模式之上增加 loader、action、pending state、fetcher 等数据能力。(主要使用的模式)
- 框架模式：在数据模式之上结合 Vite 插件和路由模块，提供类型安全、智能分包以及 SPA、SSR、静态渲染等能力。

三种模式没有统一的“最佳”选择，应根据应用是否需要数据 API、服务端渲染以及对构建架构的控制程度决定。

### 安装

```sh
pnpm add react-router
```

v7 的主要 API 已合并到 `react-router`； 在 v7 版本中 `react-router-dom` 仍作为兼容性重导出包发布.

#### 基本使用

```ts
// /router/index.ts
import { createBrowserRouter } from "react-router"; // 其中的一种
import Home from "../pages/Home";
import About from "../pages/About";

const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/about",
    Component: About,
  },
]);

export default router;
```

这种写法叫做平行路由.

因为`<RouterProvider router={router} />`这个是写在`render`中因此他可以直接代替`<App />`直接写为:

```tsx
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
```

也可以保留App.tsx进行初始化.

> 如何初始化? (类似于去Vue3配置`use`)

在 App.tsx 中挂载 `RouterProvider`。它不仅提供路由上下文，也会渲染当前匹配到的路由树；**嵌套路由**的子级位置再由父路由中的 `<Outlet />` 指定。

```tsx
// App.tsx
import React from "react";
import { RouterProvider } from "react-router/dom";
import router from "./router"; // 引入路由
const App: React.FC = () => {
  return (
    <>
      {/* 使用RouterProvider初始化 */}
      <RouterProvider router={router} />
    </>
  );
};

export default App;
```

::: tip 总结

1. `outlet`: 嵌套路由中, 子路由在父路由中应该渲染的位置
2. 跳转路由:
   - `<Link to="/">Home</Link>` 或 `<NavLink to="/">Home</NavLink>` (组件)
   - 使用 `useNavigate` hook (函数式)
3. 获取路由信息: `useLocation` hook

:::

### 路由模式

#### createBrowserRouter (推荐)

**核心特点**：

- 使用 HTML History API（`pushState`、`replaceState` 和 `popstate` 事件）
- 浏览器URL比较纯净 (/search, /about, /user/123)
- 需要`服务器端支持`(nginx, apache,等)否则会刷新404

#### createHashRouter

**核心特点**：

- 使用URL的hash部分(`#/search`, `#/about`, `#/user`)
- hash 后的内容不会作为 HTTP 请求路径发送给服务器，因此深层路由刷新通常不需要服务器配置 SPA fallback
- 浏览器刷新后仍能从 URL hash 恢复当前路由

**使用场景**：

- 无法为任意路径配置 SPA fallback 的静态托管环境，例如未配置重写规则的 GitHub Pages
- 能接受 `#` 路由形式，并希望减少服务器重写配置的应用

#### createMemoryRouter

**核心特点**：

- 使用`内存`中的路由表
- 刷新页面会丢失状态
- 切换页面路由不显示URL

**使用场景**：

- 没有地址栏、又只需要内存导航历史的环境
- 单元测试或者组件测试（Jest、Vitest、Storybook 等）

#### createStaticRouter

**核心特点**：

- 专为数据路由器的服务端渲染设计
- 接收 `createStaticHandler().query(request)` 生成的路由上下文，并与 `StaticRouterProvider` 配合渲染
- 客户端通常再创建浏览器路由器并使用服务端生成的 hydration 数据完成接管

**使用场景**：

- 自行搭建 React Router 数据模式 SSR 的应用；Next.js 使用自己的路由系统，并不以 `createStaticRouter` 作为兼容方案
- 需要SEO优化的页面

#### 如何解决刷新404问题

1. 在使用`createBrowserRouter`创建路由
2. Nginx中修改`/conf/nginx.conf` , 在`location`中添加如下代码`try_files $uri $uri/ /index.html;`

### 导航

#### Link

`Link` 用于客户端路由导航，最终渲染为 `<a>` 元素。对于由当前路由器处理的地址，它会拦截普通点击并通过路由器更新页面；使用 `reloadDocument`、指向外部地址或浏览器无法接管的点击时，仍会进行文档级导航。

示例:

```tsx
import { Link } from "react-router";

export default function App() {
  return <Link to="/index/user">user</Link>;
}
```

参数:

- `to`：要导航到的路径
- `replace`：为 `true` 时替换当前 history 条目；默认会新增 history 条目
- `state`：要传递给目标页面的状态(携带参数) <span v-pre>`<Link to="/index/user" state={{id:1}}>`</span>
- `relative`：控制相对地址（尤其是 `..`）的解析方式。默认 `route` 按路由层级回退，`path` 按 URL 路径段回退；以 `/` 开头的地址仍是绝对路径
- `reloadDocument`：跳转页面时是否重新加载页面
- `preventScrollReset`：跳转后是否阻止滚动位置重置
- `viewTransition`：是否启用视图过渡

#### NavLink

`NavLink` 继承 `Link` 的导航能力，并增加 `end`、`caseSensitive` 以及基于 active/pending/transitioning 状态生成 `className`、`style` 或 children 的能力。

::: tip link和navlink的区别

Navlink 会经过以下三个状态的转换，而Link不会，所以Navlink就是一个link的增强版。

- `active`：激活状态(当前路由和to属性匹配)
- `pending`：等待状态(loader有数据需要加载)
- `transitioning`：过渡状态(通过viewTransition属性触发)
  :::

Navlink 会根据当前路由和to属性是否匹配，自动激活。react-router会为其自动添加样式:

```css
a.active {
  color: red;
}

a.pending {
  animation: pulse 1s infinite;
}

a.transitioning {
  /* css transition is running */
}
```

也可以直接用style属性来设置:

```tsx
<NavLink
  viewTransition
  style={({ isActive, isPending, isTransitioning }) => {
    return {
      marginRight: "10px",
      color: isActive ? "red" : "blue",
      backgroundColor: isPending ? "yellow" : "transparent",
    };
  }}
  to="/index/about"
>
  About
</NavLink>
```

::: warning 注意

1. `viewTransition` 依赖浏览器 View Transition API，应按目标浏览器范围检查兼容性，并为不支持的环境保留无动画的正常导航体验
2. `pending`只有数据模式，和框架模式才能使用，声明式路由不能使用
   :::

#### useNavigate 编程式导航

`useNavigate` 是一个 `React-router` 的钩子，用于编程式导航的路由跳转。

> eg: 例如倒计时结束后，自动返回跳转等, 因为这种操作属于逻辑性操作，这时候组件方式的跳转就不合适了，这时候就需要使用编程式跳转。

```tsx
import { useEffect } from "react";
import { useNavigate } from "react-router";

function AutoBackHome() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      navigate("/home", { replace: true });
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [navigate]);

  return <p>即将返回首页…</p>;
}
```

参数:

1. 第一个参数: `to` 跳转的路由 navigate(to)

```tsx
import { useNavigate } from "react-router";

function HomeButton() {
  const navigate = useNavigate();
  return <button onClick={() => navigate("/home")}>首页</button>;
}
```

2. 第二个参数: `options` 配置对象 navigate(to, options)
   - `replace`: 跳转页面的时候，是否替换当前路由
   - `state`: 传递数据，在跳转的页面中使用通过`useLocation`的state属性获取 `navigate('/home',{state:{name:'张三'}});`
   - `relative`: 当 `to` 是相对地址时，控制按路由层级（默认 `route`）还是 URL 路径段（`path`）解析；写成 `/home` 的绝对地址不受此选项影响
   - `preventScrollReset`: 跳转页面的时候，是否阻止滚动重置
   - `viewTransition`: 跳转页面的时候，是否使用过渡动画 `navigate('/home',{viewTransition:true});`

#### redirect

`redirect` 是用于重定向，通常用于`loader`中，当`loader`返回`redirect`的时候，会自动重定向到`redirect`指定的路由。

```tsx
import { redirect } from "react-router";

const homeRoute = {
  path: "/home",
  loader: async () => {
    const isLogin = await checkLogin();
    if (!isLogin) return redirect("/login");
    return { data: "home" };
  },
};
```

### 路由类型

#### 嵌套路由

嵌套路由就是父路由中嵌套子路由 `children` ，子路由可以继承父路由的布局，也可以有自己的布局。

**注意事项**:

- 如果父路由的 `path` 是 `/index`，相对子路由 `home` 会匹配 `/index/home`。这与 `index: true` 的索引路由是两个不同概念。
- 子路由不需要增加`/`了直接写子路由的`path`即可
- 子路由默认是不显示的，需要父路由通过 `Outlet` 组件来显示子路由 `Outlet` 就是类似于Vue的`<router-view>`展示子路由的一个容器
- 子路由的层级可以无限嵌套，但是要注意的是，一般实际工作中就是2-3层

#### Layout布局

布局中的菜单既可以直接使用 `Link`/`NavLink`，也可以在 Ant Design Menu 这类通过回调返回菜单 key 的组件中使用 `useNavigate`。是否使用编程式导航取决于菜单组件的 API，而不是 Layout 本身的限制。

```tsx
// 注意: 这个是写在菜单组件中的
import { Menu as AntdMenu } from "antd";
import { AppstoreOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useNavigate } from "react-router";
export default function Menu() {
  const navigate = useNavigate(); //编程式导航
  const handleClick: MenuProps["onClick"] = (info) => {
    navigate(info.key); // 点击菜单项时，导航到对应的页面
  };
  const menuItems = [
    {
      key: "/home",
      label: "Home",
      icon: <AppstoreOutlined />,
    },
    {
      key: "/about",
      label: "About",
      icon: <AppstoreOutlined />,
    },
  ];
  return (
    <AntdMenu
      onClick={handleClick}
      style={{ height: "100vh" }}
      items={menuItems}
    />
  );
}
```

> 如何将`Menu` `Header` `Content` 进行串联

#### 布局路由

布局路由是一种特殊的嵌套路由，父路由可以省略 `path`，这样不会向 URL 添加额外的路径段：

```tsx
const router = createBrowserRouter([
  {
    // path: '/index', //省略
    Component: Layout,
    children: [
      {
        path: "home",
        Component: Home,
      },
      {
        path: "about",
        Component: About,
      },
    ],
  },
]);
```

#### 索引路由

索引路由使用 `index: true` 来定义，作为父路由的默认子路由：

```ts
// { index: true, Component: Home }

const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      {
        index: true,
        // path: 'home',
        Component: Home,
      },
      {
        path: "about",
        Component: About,
      },
    ],
  },
]);
```

#### 前缀路由 (用的少)

前缀路由只设置 `path` 而不设置 `Component`，用于给一组路由添加统一的路径前缀：

```tsx
const router = createBrowserRouter([
  {
    path: "/project",
    //Component: Layout, //省略
    children: [
      {
        path: "home",
        Component: Home,
      },
      {
        path: "about",
        Component: About,
      },
    ],
  },
]);
```

#### 动态路由

动态路由通过 `:参数名` 语法来定义动态段：

访问规则如下 `http://localhost:3000/home/123`

```tsx
const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      {
        path: "home/:id", // 这里写什么 useParams 就获取什么
        Component: Home,
      },
      {
        path: "about",
        Component: About,
      },
    ],
  },
]);

// 在组件中使用 useParams 获取参数
import { useParams } from "react-router";

function Card() {
  const params = useParams<{ id: string }>(); // { id: '123' }
  return <p>当前 ID：{params.id}</p>;
}
```

### 路由传参

#### 1. Query参数

```text
# 多个参数用 & 连接
/about?name=xxx&age=18
```

传递后在地址栏就会有`name=xxx&age=18`, 如何接收?

```ts
import { useSearchParams } from "react-router"; // 获取路由参数
const [searchParams, setSearchParams] = useSearchParams(); // 获取路由参数 更改路由参数
```

跳转方式:

```tsx
import { Link, NavLink, useNavigate } from "react-router";

function QueryLinks() {
  const navigate = useNavigate();
  return (
    <>
      <NavLink to="/about?id=123">About</NavLink>
      <Link to="/about?id=123">About</Link>
      <button onClick={() => navigate("/about?id=123")}>About</button>
    </>
  );
}
```

获取参数:

```tsx
import { useSearchParams } from "react-router";

function About() {
  const [searchParams, setSearchParams] = useSearchParams();
  const id = searchParams.get("id");

  return <button onClick={() => setSearchParams({ id: "456" })}>{id}</button>;
}
```

如果只需要原始查询字符串，也可以通过 `useLocation().search` 获取，例如 `?id=123`。

#### 2. Params参数(动态参数)

```text
/user/:id
```

跳转方式:

```tsx
import { Link, NavLink, useNavigate } from "react-router";

function UserLinks() {
  const navigate = useNavigate();
  return (
    <>
      <NavLink to="/user/123">User</NavLink>
      <Link to="/user/123">User</Link>
      <button onClick={() => navigate("/user/123")}>User</button>
    </>
  );
}
```

获取参数:

```tsx
import { useParams } from "react-router";

function User() {
  const { id } = useParams<{ id: string }>();
  return <p>{id}</p>;
}
```

::: warning 注意
路径参数最终是 URL 字符串。对象需要先序列化并进行 URL 编码，但通常更适合只把稳定 ID 放在路径中，再依据 ID 读取完整数据。
:::

#### State参数

`state`在URL中`不显示`，但是可以传递参数:

```text
/user
```

跳转方式:

```tsx
import { Link, useNavigate } from "react-router";

function UserLinks() {
  const navigate = useNavigate();
  const state = { name: "xxx", age: 18 };
  return (
    <>
      <Link to="/user" state={state}>
        User
      </Link>
      <button onClick={() => navigate("/user", { state })}>User</button>
    </>
  );
}
```

获取参数:

```tsx
import { useLocation } from "react-router";

type UserState = { name: string; age: number };

function User() {
  const { state } = useLocation();
  const user = state as UserState | null;
  return <p>{user?.name ?? "没有导航状态"}</p>;
}
```

#### 总结

React Router 提供了三种参数传递方式，各有特点：

1. Params 方式 (/user/:id)
   - 适用于：传递必要的路径参数（如ID）
   - 特点：符合 RESTful 规范，刷新不丢失
   - 限制：只能传字符串，参数显示在URL中

2. Query 方式 (/user?name=xxx&age=18)
   - 适用于：传递可选的查询参数
   - 特点：灵活多变，支持多参数
   - 限制：URL可能较长，参数公开可见
3. State 方式
   - 适用于：同一次浏览器导航中的临时附加信息
   - 特点：参数不显示在 URL，底层受 History API 的可序列化数据限制，不能传函数、DOM 节点等任意值
   - 限制：复制 URL、新开标签页或服务端直接访问时无法获得该状态，不应把关键数据只放在 state 中

选择建议：必要参数用 Params(查详情)，筛选条件用 Query(搜索 分页)，临时数据用 State(复杂数据)。

### 边界处理

边界处理包含了`错误处理`，`ErrorBoundary`，`404页面` 等错误处理

#### 404页面处理

配置:

- 使用`*`作为通配符，当路由匹配不到时，显示404页面
- 使用`Component: NotFound`作为404页面组件

```ts {17-18}
const router = createBrowserRouter([
  {
    path: "/index",
    Component: Layout,
    children: [
      {
        path: "home",
        Component: Home,
      },
      {
        path: "about",
        Component: About,
      },
    ],
  },
  {
    path: "*", // 通配符，当路由匹配不到时，显示404页面
    Component: NotFound, // 404页面组件
  },
]);
```

```tsx
// src/pages/NotFound.tsx
import { Link } from "react-router";
export default function NotFound() {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f5f5",
      }}
    >
      <h1 style={{ fontSize: 96, color: "#1890ff", margin: 0 }}>404</h1>
      <p style={{ fontSize: 24, color: "#888", margin: "16px 0 0 0" }}>
        抱歉，您访问的页面不存在
      </p>
      <Link
        to="/"
        style={{
          marginTop: 32,
          color: "#1890ff",
          fontSize: 18,
          textDecoration: "underline",
        }}
      >
        返回首页
      </Link>
    </div>
  );
}
```

#### ErrorBoundary

路由 `ErrorBoundary` 可以处理路由组件渲染、loader、action 等阶段抛出的错误，并由距离出错路由最近的边界呈现错误 UI。

```ts
import NotFound from "../layout/404"; // 404页面组件
import Error from "../layout/error"; // 错误处理组件
const router = createBrowserRouter([
  {
    path: "/index",
    Component: Layout,
    children: [
      {
        path: "home",
        Component: Home,
        ErrorBoundary: Error, //如果组件抛出错误，会调用ErrorBoundary组件
      },
      {
        path: "about",
        Component: About, // 正常展示About
        loader: async () => {
          throw new Response("Not Found", {
            status: 404,
            statusText: "Not Found",
          });
        },
        ErrorBoundary: Error, // 如果loader或action抛出错误，会调用ErrorBoundary组件
      },
    ],
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
```

返回的错误信息可以通过一个hooks获取到:

```tsx
import { isRouteErrorResponse, useRouteError } from "react-router";

export default function Error() {
  const error = useRouteError();
  if (isRouteErrorResponse(error)) {
    return (
      <div>
        {error.status}：{String(error.data ?? error.statusText)}
      </div>
    );
  }
  if (error instanceof Error) return <div>{error.message}</div>;
  return <div>未知错误</div>;
}
```

### 路由懒加载

> 什么是懒加载?

懒加载是一种优化技术，用于延迟加载组件，直到需要时才加载。这样可以减少初始加载时间，提高页面性能。

```ts
// 通过在路由对象中使用 lazy 属性来实现懒加载。
import { createBrowserRouter } from "react-router";
import Layout from "../pages/Layout";

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const router = createBrowserRouter([
  {
    Component: Layout,
    children: [
      {
        path: "about",
        lazy: async () => {
          await sleep(2000);
          const module = await import("../pages/About");
          return { Component: module.default };
        },
      },
    ],
  },
]);
```

当切换到 `about` 路由时，才会进行加载

::: tip
路由模块的动态导入通常在首次访问后由模块加载器缓存。`loader` 是否重新执行由导航、提交后的重新验证、`shouldRevalidate` 等因素决定；`useNavigation().state` 会在等待 lazy 路由、loader 或 action 时反映相应的 pending 状态。
:::

#### 体验优化

例如 `about` 是一个懒加载的组件，在切换到 `about` 路由时，展示的还是上一个路由的组件，直到懒加载的组件加载完成，才会展示新的组件，这样用户会感觉页面`卡顿`，用户体验不好。 使用[`useNavigation`](https://message163.github.io/react-docs/react/router/hooks/useNavigation.html)进行状态优化

```tsx
// src/layout/Content/index.tsx
// 实现loading效果
import { Outlet, useNavigation } from "react-router";
import { Alert, Spin } from "antd";
export default function Content() {
  const navigation = useNavigation();
  console.log(navigation.state);
  const isLoading = navigation.state === "loading";
  return (
    <div>
      {isLoading ? (
        <Spin size="large" tip="loading...">
          <Alert description="xxxxxxxxxxxxxxxx" message="加载中" type="info" />
        </Spin>
      ) : (
        <Outlet />
      )}
    </div>
  );
}
```

### 路由数据 API

数据模式的重要能力包括：

- `loader`
- `action`

在平时工作中大部分都是在做`增刪查改(CRUD)`的操作，所以一个界面的接口过多之后就会使逻辑臃肿复杂，难以维护，所以需要使用路由的高级操作来`优化代码`。

#### loader

::: tip
loader 负责读取路由数据，会在匹配导航、GET 表单提交、显式重新验证等场景运行。它不是“收到任意 GET 请求就触发”，而是由 React Router 的数据路由流程调用。
:::

[useLoaderData](https://message163.github.io/react-docs/react/router/hooks/useLoaderData.html)

在没有loader之前是 `RenderComponent`(渲染组件) --> `Fetch`(获取数据)-> `RenderView`(渲染视图)

有了loader之后是 `loader`(通过fetch获取数据) -> `useLoaderData`(获取数据) -> `RenderComponent`(渲染组件)

示例:

```tsx
//router/index.tsx
import { createBrowserRouter } from "react-router";
const router = createBrowserRouter([
  {
    path: "/",
    Component: App,
    loader: async () => {
      const response = await fetch("/api/users");
      if (!response.ok)
        throw new Response("获取用户失败", { status: response.status });
      const data = await response.json();
      return { users: data.list, message: "success" };
    },
  },
]);
```

使用useLoaderData接收数据:

```tsx
//App.tsx
import { useLoaderData } from "react-router"; // 使用useLoaderData接收数据

type LoaderData = {
  users: Array<{ id: number; name: string }>;
  message: string;
};

const App = () => {
  const { users } = useLoaderData() as LoaderData;
  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
};
```

#### action

一般用于表单提交，删除，修改等操作。

[useSubmit](https://message163.github.io/react-docs/react/router/hooks/useSubmit.html)

[useActionData](https://message163.github.io/react-docs/react/router/hooks/useActionData.html)

::: tip
action 处理发送到路由的非 GET 数据提交，例如 POST、PUT、PATCH、DELETE；GET 表单提交会序列化到 URL 并运行 loader，而不是 action。
:::

示例:

```tsx
//App.tsx
import { useSubmit } from "react-router"; // 用这个hook 使onFinish提交给action
import { Card, Form, Input, Button } from "antd";
export default function About() {
  // onFinish --> action --> api
  const submit = useSubmit();
  return (
    <Card>
      <Form
        onFinish={(values) => {
          /**
            values 需要提交的值
            配置项(对象) 提交方式 编码格式 默认是formData 
           */
          submit(values, { method: "post" }); // 提交表单
        }}
      >
        <Form.Item name="name" label="姓名">
          <Input />
        </Form.Item>
        <Form.Item name="age" label="年龄">
          <Input />
        </Form.Item>
        <Button type="primary" htmlType="submit">
          提交
        </Button>
      </Form>
    </Card>
  );
}

// 接收参数
//router/index.tsx
import { createBrowserRouter } from "react-router";
const router = createBrowserRouter([
  {
    // path: '/index',
    Component: Layout,
    children: [
      {
        path: "about",
        Component: About,
        // 定义action 通过request
        action: async ({ request }) => {
          const formData = await request.formData();
          const createdUser = await createUser(formData);
          return { data: createdUser, success: true };
        },
      },
    ],
  },
]);
```

#### 状态变更

可以配合[`useNavigation`](https://message163.github.io/react-docs/react/router/hooks/useNavigation.html)来管理表单提交的状态

GET提交状态: `idle` --> `loading` --> `idle`

POST提交状态: `idle` --> `submitting` --> `loading` --> `idle`

可以根据这些状态来控制`disabled` `loading` 等行为

```tsx
import { useNavigation, useSubmit } from "react-router";

function SubmitButton() {
  const submit = useSubmit();
  const navigation = useNavigation();
  const isBusy = navigation.state !== "idle";

  return (
    <button
      disabled={isBusy}
      onClick={() => submit({ name: "Alice" }, { method: "post" })}
    >
      {navigation.state === "submitting" ? "提交中..." : "提交"}
    </button>
  );
}
```

## TanStack Router

[Tanstack](https://tanstack.com/)是一个工具集

安装 Tanstack Router :

```sh
pnpx @tanstack/cli create --router-only # 以 CLI 方式创建

# 使用手动配置
pnpm add @tanstack/react-router @tanstack/react-router-devtools
pnpm add -D @tanstack/router-plugin
```

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // Please make sure that '@tanstack/router-plugin' is passed before '@vitejs/plugin-react'
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    // ...,
  ],
});
```

- TanStack Router 同时支持文件式和代码式路由；文件式路由是官方推荐的大多数项目起点。
- Vite 插件默认读取 `src/routes` 并生成 `src/routeTree.gen.ts`，但 `routesDirectory` 和生成文件位置都可以配置。配置目录的根路由文件必须命名为 `__root.tsx`。
- `__root.tsx` 定义根布局，`src/main.tsx` 仍负责创建并挂载 RouterProvider，并不是把入口文件放进 routes 目录。

```tsx
// routes/__root.tsx
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

const RootLayout = () => (
  <>
    <div className="p-2 flex gap-2">
      <Link to="/" className="[&.active]:font-bold">
        Home
      </Link>{" "}
      <Link to="/about" className="[&.active]:font-bold">
        About
      </Link>
    </div>
    <hr />
    <Outlet />
    <TanStackRouterDevtools />
  </>
);

export const Route = createRootRoute({ component: RootLayout });
```

```tsx
// routes/index.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="p-2">
      <h3>Welcome Home!</h3>
    </div>
  );
}
```

```tsx
// routes/about.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: About,
});

function About() {
  return <div className="p-2">Hello from About!</div>;
}
```

```tsx
// src/main.tsx
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";

// Import the generated route tree
import { routeTree } from "./routeTree.gen"; // 这个文件是自动生成的

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}
```

## Zustand 状态管理

1. `轻量级` Zustand 的核心 API 和运行时开销较小；实际包体积取决于版本、导入入口、中间件和打包器的 tree-shaking 结果，不应固定表述为某个精确大小。
2. `简单易用` Zustand 不需要像Redux，去通过`Provider`包裹组件，Zustand提供了简洁的API，能够快速上手。
3. `易于集成` `zustand` 包主要面向 React，同时提供 `zustand/vanilla` 的框架无关 store。Vue 适配通常来自独立的社区项目，并不是 Zustand 核心包自带的 Vue API。
4. `扩展性` Zustand 提供中间件机制，可扩展持久化、Redux DevTools、Immer 更新和选择性订阅等能力；异步 action 本身不要求额外中间件。
5. `不可变更新` 默认应以不可变方式更新 state；深层结构可以选择 Immer 中间件减少手动复制代码，但 Zustand 并不会因此自动变成“无副作用”。

### 安装

```sh
pnpm add zustand
```

### 使用

1. 创建一个store目录, 一个store.ts文件
2. `create` 接收 state creator。state creator 通常接收 `set`、`get`、`store` 三个参数，并返回初始 state 与 actions。
3. `set` 可以接收部分 state 对象或 `(state) => partialState` 更新函数；默认只对根层级进行浅合并，第二个参数传 `true` 时才会整体替换 state。
4. `get()` 不接收 state 参数，调用后返回 store 当前状态。

```ts
import { create } from "zustand";
// 定义一个接口，用于描述状态管理器的状态和操作
interface PriceStore {
  price: number;
  incrementPrice: () => void;
  decrementPrice: () => void;
  resetPrice: () => void;
  getPrice: () => number;
}
// 创建一个状态管理器，使用 create 函数，传入一个函数，返回一个对象
/**
 *
 * @param set 用于更新状态 是函数
 * @param get 用于获取状态 是函数
 * @returns 返回一个对象，对象中的方法可以用于更新状态 注意!注意!注意!返回的是一个对象
 */
const usePriceStore = create<PriceStore>((set, get) => ({
  price: 0, // 初始状态
  incrementPrice: () => set((state) => ({ price: state.price + 1 })), // 更新状态
  decrementPrice: () => set((state) => ({ price: state.price - 1 })), // 更新状态
  resetPrice: () => set({ price: 0 }), // 重置状态
  getPrice: () => get().price, // 获取状态
}));

export default usePriceStore;
```

然后再页面中当成一个hook来使用

### 状态处理

#### 深层次状态处理

```ts
import { create } from "zustand";

interface User {
  gourd: {
    oneChild: string;
    twoChild: string;
    threeChild: string;
    fourChild: string;
    fiveChild: string;
    sixChild: string;
    sevenChild: string;
  };
  updateGourd: () => void;
}

// 创建 store
const useUserStore = create<User>((set) => ({
  // 初始化葫芦娃状态
  gourd: {
    oneChild: "大娃",
    twoChild: "二娃",
    threeChild: "三娃",
    fourChild: "四娃",
    fiveChild: "五娃",
    sixChild: "六娃",
    sevenChild: "七娃",
  },
  // 更新方法
  updateGourd: () =>
    set((state) => ({
      gourd: {
        ...state.gourd, // 嵌套对象需要手动合并
        oneChild: "大娃-超进化",
      },
    })),
}));

export default useUserStore;
```

::: warning
注意：Zustand 的 `set` 默认会浅合并根 state，所以未返回的根属性会保留；但被替换的嵌套对象不会自动深合并。更新 `gourd.oneChild` 时，需要复制 `state.gourd`，否则 `gourd` 中其他字段会丢失，而且上面的 TypeScript 类型也不会通过检查。
:::

#### 使用 immer 中间件

- 安装: `pnpm add immer`
- 基础用法:

```ts
import { produce } from "immer";

const data = {
  user: {
    name: "张三",
    age: 18,
  },
};

// 使用 produce 创建新状态
const newData = produce(data, (draft) => {
  draft.user.age = 20; // 直接修改 draft
});

console.log(newData, data);
// 输出:
// { user: { name: '张三', age: 20 } }
// { user: { name: '张三', age: 18 } }
```

在 Zustand 中使用:

```ts
import { create } from "zustand";
import { immer } from "zustand/middleware/immer"; // 引入 immer 中间件

// 注意：使用 immer 中间件时的特殊结构
// 闭包 接收create<User>()返回值
const useUserStore = create<User>()(
  immer((set) => ({
    gourd: {
      oneChild: "大娃",
      twoChild: "二娃",
      threeChild: "三娃",
      fourChild: "四娃",
      fiveChild: "五娃",
      sixChild: "六娃",
      sevenChild: "七娃",
    },
    updateGourd: () =>
      set((state) => {
        // 直接修改状态，无需手动合并
        state.gourd.oneChild = "大娃-超进化";
        state.gourd.twoChild = "二娃-谁来了";
        state.gourd.threeChild = "三娃-我来了";
      }),
  })),
);
```

#### immer 原理剖析

Immer 为 draft 建立 Proxy，在 recipe 中记录对 draft 的读写。当发生修改时，它会复制被修改节点及其祖先路径，并尽量与未修改分支共享引用，最后生成新的不可变结果；原始对象保持不变。Proxy 只是其主要实现机制之一，不能概括为代理 JavaScript 对象的“所有操作”。

`immer` 的核心原理基于以下两个概念：

1. `写时复制` (Copy-on-Write)
   - 无修改时：直接返回原对象
   - 有修改时：创建新对象

2. `惰性代理` (Lazy Proxy)
   - 按需创建代理
   - 通过 Proxy 拦截操作
   - 延迟代理创建

修改深层节点时，从根到该节点路径上的对象都会获得新引用，未修改的兄弟分支通常继续复用原引用：

```ts
import { produce } from "immer";

const state = {
  user: {
    name: "张三",
    age: 25,
  },
};

const newState = produce(state, (draft) => {
  draft.user.name = "李四";
  draft.user.age = 26;
});

console.log(state); // { user: { name: '张三', age: 25 } }
console.log(newState); // { user: { name: '李四', age: 26 } }
console.log(newState === state); // false
console.log(newState.user === state.user); // false
```

一个可用的 Immer 实现还需要为每个嵌套 draft 分别维护修改状态、处理数组与属性描述符、完成终结和结构共享等细节。用单个 `modified` 对象配合 `JSON.parse(JSON.stringify(...))` 无法正确模拟这些语义，还会破坏 `Date`、`Map`、`undefined` 等值，因此不把这种简化代码当作实现示例。

### 状态简化

不传选择器调用 `useUserStore()` 会订阅整个 store。即使组件只从返回对象中解构少数字段，store 中任意根状态变化都可能使该组件重新渲染。

#### 状态选择器

我们可以使用状态选择器来规避这个问题. 状态选择器可以让我们只选择我们需要的部分状态，这样就不会引发不必要的重渲染。

```ts
// 本来的写法
const { hobby, name } = useUserStore();
// 新写法
const selectedName = useUserStore((state) => state.name);
const age = useUserStore((state) => state.age);
const rap = useUserStore((state) => state.hobby.rap);
const basketball = useUserStore((state) => state.hobby.basketball);
```

但是这样会出现一个新的问题: 每用到一个属性, 都要重新定义一个变量, 过于麻烦.

#### useShallow

::: tip
`useShallow` 会记住选择器结果，并对新旧结果做浅比较：对象的顶层属性、数组元素等逐项使用 `Object.is` 比较。它不做深比较；如果某个顶层属性是对象，仍只比较该对象的引用。
:::

```ts
import { useShallow } from "zustand/react/shallow";
const { rap, name } = useUserStore(
  useShallow((state) => ({
    rap: state.hobby.rap,
    name: state.name,
  })),
);
```

### 中间件

zustand 的中间件是用于在状态管理过程中添加额外逻辑的工具。它们可以用于日志记录、性能监控、数据持久化、异步操作等。

#### 自定义编写中间件

我们实现一个简易的日志中间件，了解其中间件的实现原理, zustand的中间件是一个高阶函数

```ts
const logger = (config) => (set, get, api) =>
  config(
    (...args) => {
      console.log(api);
      console.log("before", get());
      set(...args);
      console.log("after", get());
    },
    get,
    api,
  );
```

参数解释：

1. config (外层函数参数)

- 类型：state creator，即 `(set, get, api) => State`
- 作用：原始的 store 配置函数；中间件包装它及其参数，最终仍返回初始 state。

2. set (内层函数参数)

- 类型：函数 (partialState) => void
- 作用：原始的状态更新函数，用于修改 store 的状态。

3. get (内层函数参数)

- 类型：函数 () => State
- 作用：获取当前 store 的状态值。

4. api (内层函数参数)

- 类型：对象 StoreApi
- 作用：包含 store API，例如 `setState`、`getState`、`getInitialState` 和 `subscribe`。

#### devtools

devtools 是 zustand 提供的一个用于调试的工具，它可以帮助我们更好地管理状态。

```ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface UserStore {
  name: string;
  age: number;
  hobby: { sing: string; dance: string; rap: string; basketball: string };
  setHobbyRap: (rap: string) => void;
  setHobbyBasketball: (basketball: string) => void;
}

const useUserStore = create<UserStore>()(
  devtools(
    immer((set) => ({
      name: "坤坤",
      age: 18,
      hobby: {
        sing: "坤式唱腔",
        dance: "坤式舞步",
        rap: "坤式rap",
        basketball: "坤式篮球",
      },
      setHobbyRap: (rap: string) =>
        set((state) => {
          state.hobby.rap = rap;
        }),
      setHobbyBasketball: (basketball: string) =>
        set((state) => {
          state.hobby.basketball = basketball;
        }),
    })),
    {
      enabled: true,
      name: "用户信息",
    },
  ),
);
```

#### persist

persist 是 zustand 提供的一个用于`持久化`状态的工具，它可以帮助我们更好地管理状态，默认是存储在 localStorage 中，可以指定存储方式

```ts
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface UserStore {
  name: string;
  age: number;
  hobby: { sing: string; dance: string; rap: string; basketball: string };
  setHobbyRap: (rap: string) => void;
  setHobbyBasketball: (basketball: string) => void;
}

const useUserStore = create<UserStore>()(
  persist(
    immer((set) => ({
      name: "坤坤",
      age: 18,
      hobby: {
        sing: "坤式唱腔",
        dance: "坤式舞步",
        rap: "坤式rap",
        basketball: "坤式篮球",
      },
      setHobbyRap: (rap: string) =>
        set((state) => {
          state.hobby.rap = rap;
        }),
      setHobbyBasketball: (basketball: string) =>
        set((state) => {
          state.hobby.basketball = basketball;
        }),
    })),
    {
      name: "user",
      // 可省略：默认就是 JSON + localStorage。sessionStorage 可直接替换；
      // IndexedDB 是异步 API，需要先实现符合 StateStorage 的适配器。
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        name: state.name,
        age: state.age,
        hobby: state.hobby,
      }),
    },
  ),
);
```

增加 persist 中间件后，可以通过 `useUserStore.persist.clearStorage()` 删除持久化存储。它只清除 storage 中的数据，不会自动把当前内存 state 重置为初始值；如需同时重置，应另行调用 store 的重置 action。

```tsx
import useUserStore from "../../store/user";
const App = () => {
  const clear = () => {
    useUserStore.persist.clearStorage();
  };
  return <div onClick={clear}>清空缓存</div>;
};
```

### 订阅

zustand 的 subscribe，可以订阅一个状态，当状态变化时，会触发回调函数。(类似Vue3的watch)

#### 订阅整个 store

只要store 的 `state` 发生变化，就会触发回调函数，另外就是这个订阅可以在`组件内部订阅`，也可以在`组件外部订阅`, 如果在组件内部订阅需要放到useEffect中, 防止重复订阅。

```tsx
import { useEffect } from "react";
import { create } from "zustand";

const useCountStore = create(() => ({
  count: 0,
}));
// 外部订阅
const unsubscribeOutside = useCountStore.subscribe((state) => {
  console.log(state.count);
});

// 组件内部订阅
function CountLogger() {
  useEffect(() => {
    return useCountStore.subscribe((state) => {
      console.log(state.count);
    });
  }, []);

  return null;
}

// 模块级订阅不再需要时也应调用：unsubscribeOutside();
```

#### 案例

假设 UI 只关心年龄是否达到某个业务阈值。如果直接选择 `age`，每次年龄变化都会重新渲染组件：

```tsx
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

const useAgeStore = create(() => ({
  age: 0,
}));

function Age() {
  const { age } = useAgeStore(useShallow((state) => ({ age: state.age })));
  return <p>{age}</p>;
}
```

如果 UI 只关心“是否达到阈值”，可以让选择器直接返回这个布尔结果。默认的 `Object.is` 比较会使组件只在结果从 `false` 变为 `true`（或反向）时重新渲染，而不是每次年龄变化都重新渲染：

```tsx
import { create } from "zustand";

const useStore = create(() => ({
  age: 0,
}));

function MarriageStatus() {
  const canMarry = useStore((state) => state.age >= 26);
  return <div>{canMarry ? "达到示例阈值" : "未达到示例阈值"}</div>;
}
```

持续优化，目前的订阅只要是store内部任意的state发生变化，都会触发回调函数，我们希望只订阅age的变化，可以使用中间件 `subscribeWithSelector` 订阅单个状态。

```tsx
import { useEffect } from "react";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
const useStore = create(
  subscribeWithSelector((set) => ({
    age: 0,
    name: "张三",
  })),
);
function AgeLogger() {
  useEffect(() => {
    return useStore.subscribe(
      (state) => state.age,
      (age, previousAge) => {
        console.log(`age: ${previousAge} -> ${age}`);
      },
    );
  }, []);

  return null;
}
```

#### 补充

1. `subscribe` 会返回一个取消订阅的函数，可以手动取消订阅。

```tsx
const unSubscribe = useStore.subscribe((state) => {
  console.log(state.age);
});
unSubscribe(); //取消订阅
```

2. 当你使用了`subscribeWithSelector`中间件的时候会多出来第三个参数`options`

- `equalityFn` 比较函数
- `fireImmediately` 是否立即触发

```tsx
const unSubscribe = useStore.subscribe(
  (state) => state.age,
  (age, prevAge) => {
    console.log(age, prevAge);
  },
  {
    equalityFn: Object.is, // 默认也是 Object.is；需要其他语义时可传自定义比较函数
    fireImmediately: true, // 默认是false，如果需要立即触发，可以传入true
  },
);
```
