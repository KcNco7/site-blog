# React 开发常用的 JavaScript 方法

写 React 时真正高频出现的其实是一小部分 JS 方法和语法。按重要程度分为三个梯队，每个都配 React 实际用法。

---

## 第一梯队：几乎每天都用

### 1. `map()` —— 渲染列表（最重要）

把数组显示成多个元素，全靠它：

```jsx
const users = ["小明", "小红", "小刚"];

return (
  <ul>
    {users.map((name, index) => (
      <li key={index}>{name}</li>
    ))}
  </ul>
);
```

> 注意：`key` 尽量用数据里稳定的唯一 id，而不是 index（列表顺序会变时 index 会出问题）。

### 2. 展开运算符 `...` —— 不可变更新 state

React 的 state 不能直接改，要"复制一份再改"：

```jsx
// 更新对象
setUser({ ...user, name: "新名字" });

// 往数组加元素
setList([...list, newItem]);
```

### 3. 解构 `{ }` / `[ ]` —— 取 props、接 useState

```jsx
// 数组解构：useState 返回的就是数组
const [count, setCount] = useState(0);

// 对象解构：接收 props
function Card({ title, content }) {
  return <div>{title}</div>;
}
```

### 4. 箭头函数 `=>` —— 事件处理、回调

```jsx
<button onClick={() => setCount(count + 1)}>加一</button>
```

### 5. 条件渲染：三元 `? :` 和 `&&`

```jsx
// 二选一
{isLogin ? <欢迎 /> : <登录按钮 />}

// 有就显示，没有就不显示
{error && <p>{error}</p>}
```

---

## 第二梯队：经常会碰到

### `filter()` —— 删除列表项时常用

```jsx
// 删掉 id 为 3 的项
setList(list.filter(item => item.id !== 3));
```

### `find()` —— 找出某一项

```jsx
const user = users.find(u => u.id === 5);
```

### 模板字符串 `` ` ` `` —— 拼接 className、文本

```jsx
<div className={`card ${isActive ? "active" : ""}`}>
```

### 可选链 `?.` —— 防止读到 undefined 报错

```jsx
// user 可能还没加载出来，用 ?. 就不会崩
<p>{user?.profile?.email}</p>
```

### `trim()` —— 处理用户输入

```jsx
const text = input.trim(); // 去掉字符串两端空白
if (text === "") {
  // 判断为"没有有效输入"
}
```

---

## 第三梯队：知道有这些，用到再查

| 方法 | 用途 |
| --- | --- |
| `reduce()` | 数组求和、聚合计算 |
| `some()` / `includes()` | 判断"存不存在" |
| `Object.keys()` / `Object.entries()` | 遍历对象 |
| 空值合并 `??` | `count ?? 0`（只在 null/undefined 时用默认值） |
| `JSON.stringify()` / `JSON.parse()` | 存 localStorage、深拷贝简单对象 |

---

## 学习建议

不用一次性全背下来。真正的核心就这 **5 样**，占日常 React 代码的 80%：

1. `map()` —— 渲染列表
2. `...` 展开运算符 —— 不可变更新
3. 解构 —— 取 props / 接 useState
4. 箭头函数 —— 事件处理
5. 条件渲染 `? :` 和 `&&`

其中要特别花心思理解 **`...` 展开运算符**，因为它背后连着 React 的关键思想：**state 不可变（immutable）**。这是很多初学者踩坑的地方。

剩下的等实际写代码遇到了再回头查，印象会更深。
