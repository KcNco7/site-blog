# EventLoop

## 题目

下面这段代码的输出顺序是什么？

```vue
<script setup lang="ts">
async function Prom() {
  console.log("Y");
  await Promise.resolve();
  console.log("X");
}
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
Prom();
console.log(0);
</script>
<style scoped></style>
```

## 运行结果

```text
Y 0 5 6 7 8 X 1 2 3 4
```

## 详细解析

```vue
<!-- <script setup> 中的代码会在组件 setup 执行时，作为当前任务中的同步代码运行。 -->
<script setup lang="ts">
// 声明函数但是不执行
async function Prom() {
  console.log("Y");
  await Promise.resolve();
  console.log("X");
}
// 注册两个定时器；回调当前不会执行，满足延迟条件后才会被排为任务
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

// .then 回调是 Promise reaction job，会进入微任务队列
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
Prom();
console.log(0);
// 输出结果 Y 0 5 6 7 8 X 1 2 3 4
</script>
<style scoped></style>
```

> **核心规则：当前任务结束且 JavaScript 调用栈清空后，事件循环会执行一次微任务检查点，把队列中的微任务持续执行到队列为空；之后浏览器才可能更新渲染并选择下一个可运行任务。**

“宏任务”是教程中的常用称呼，HTML 标准使用的是 **task（任务）**。浏览器还维护不同的任务源及相应任务队列，因此不应把整个事件循环理解成唯一一条“宏任务 FIFO 队列”。

---

### 逐步执行过程

#### 第一步：执行当前任务中的同步代码

```text
// setTimeout 注册两个定时器；0 表示最小延迟，不表示立即执行
setTimeout(...) // 定时器回调1
setTimeout(...) // 定时器回调2

// 四个 Promise.then 放入微任务队列
Promise.resolve().then(() => console.log(5)) // 微任务1
Promise.resolve().then(() => console.log(6)) // 微任务2
Promise.resolve().then(() => console.log(7)) // 微任务3
Promise.resolve().then(() => console.log(8)) // 微任务4

// 调用 Prom()
Prom()
// → 执行到 console.log("Y")  → 输出 Y
// → 遇到 await Promise.resolve()，暂停，
//   await 后面的 console.log("X") 被放入微任务队列  → 微任务5

// 继续同步代码
console.log(0) // 输出 0
```

**此时已输出：`Y` `0`**

---

#### 第二步：清空微任务队列

当前任务中的同步代码执行完、调用栈清空后，浏览器执行微任务检查点：

```
微任务1 → 输出 5
微任务2 → 输出 6
微任务3 → 输出 7
微任务4 → 输出 8
微任务5 → 输出 X  (Prom 中 await 后续代码)
```

**此时已输出：`Y` `0` `5` `6` `7` `8` `X`**

---

#### 第三步：执行第一个定时器任务

```js
console.log(1); // 输出 1
Promise.resolve().then(() => console.log(2)); // 新微任务入队
```

第一个定时器任务执行完毕，浏览器再次执行微任务检查点：

```
→ 输出 2
```

**此时已输出：`Y` `0` `5` `6` `7` `8` `X` `1` `2`**

---

#### 第四步：执行第二个定时器任务

```js
console.log(3); // 输出 3
Promise.resolve().then(() => console.log(4)); // 新微任务入队
```

第二个定时器任务执行完毕，浏览器再次执行微任务检查点：

```
→ 输出 4
```

---

### 最终输出

```
Y 0 5 6 7 8 X 1 2 3 4
```

---

### 关键点说明

**为什么 `Y` 在 `0` 前面？**
`Prom()` 被调用时，函数体同步执行直到第一个 `await`，所以 `console.log("Y")` 先于 `console.log(0)` 执行。

**为什么 `X` 在 `5678` 后面？**
执行到 `await Promise.resolve()` 时，异步函数暂停；因为等待的是已经兑现的 Promise，恢复异步函数的作业会排入微任务队列。此时输出 `5、6、7、8` 的 Promise reaction job 已经先入队，所以 `X` 在它们之后执行。把 `await` 直接说成某段 `.then()` 的语法糖有助于入门理解，但两者并非在所有细节上都完全等价。

**为什么 `2` 紧跟在 `1` 后面？**
第一个定时器回调执行时，输出 `2` 的 Promise reaction job 被加入微任务队列。该任务结束后的微任务检查点会先输出 `2`，之后事件循环才选择第二个定时器任务，所以 `2` 在 `3` 前面。

## 再看一个例子

```ts
Promise.resolve().then(() => {
  console.log(100);
});
Promise.resolve().then(() => {
  console.log(11);
});
Promise.resolve().then(() => {
  console.log(12);
});
Promise.resolve().then(() => {
  console.log(13);
});
Promise.resolve().then(() => {
  console.log(14);
});
// 注册第一个定时器任务
setTimeout(() => {
  console.log(2);

  // Promise reaction job 是微任务
  Promise.resolve().then(() => {
    console.log(3);
    // 在微任务中注册一个新的定时器任务
    setTimeout(() => {
      console.log(4);
    }, 0);
  });
}, 0);
// 注册第二个定时器任务；它早于上面嵌套的定时器完成注册
setTimeout(() => {
  console.log(5);
}, 0);
const a = new Promise((resolve) => {
  // Promise 构造器的 executor 会立即同步执行
  console.log(1651616516);
  resolve(1);
});
console.log(6);
```

在没有其他任务插入的前提下，这段代码输出：

```text
1651616516 6 100 11 12 13 14 2 3 5 4
```

Promise 构造器的 executor 同步执行，所以先输出 `1651616516`，随后同步输出 `6`。当前任务结束后的微任务检查点依次输出 `100、11、12、13、14`。第一个定时器任务输出 `2`，其产生的微任务紧接着输出 `3`，并在此时注册新的定时器；第二个定时器早已注册，因此先输出 `5`，最后才轮到嵌套定时器输出 `4`。

## 常见调度来源

- **任务（常被称为宏任务）**：定时器回调、浏览器派发的用户交互事件、部分网络与消息事件等会通过相应任务源排队。`setTimeout(fn, 0)` 只表示满足最小延迟后可以排队，不保证立即执行。
- **微任务**：Promise 的 `.then()`、`.catch()`、`.finally()` reaction job，`await` 后的异步函数恢复，`queueMicrotask()` 回调以及 `MutationObserver` 通知等。
- **同步执行**：Promise 构造器的 executor 是同步调用；`Promise.resolve()` 的调用也会同步返回 Promise，不能仅凭出现这个表达式就把它称为微任务。Promise 的 reaction job 才会在相应 Promise 兑现或拒绝后异步执行。
- **渲染回调**：`requestAnimationFrame()` 回调运行在浏览器“更新渲染”步骤中，通常发生在下一次绘制前，不应简单归为普通任务或微任务。
- **网络请求**：Ajax 或 `fetch()` 不是单一的“宏任务”。网络工作由浏览器处理；相关事件可能排为任务，而 Promise reaction job 仍属于微任务。

因此，更准确的简化流程是：

1. 执行一个选中的任务，直到调用栈清空。
2. 执行微任务检查点；执行微任务期间新加入的微任务也会在本轮继续执行。
3. 浏览器根据时机决定是否更新渲染。
4. 事件循环再从可运行的任务中选择下一个任务。

## 参考资料

- [HTML 标准：Event loops](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)
- [HTML 标准：Perform a microtask checkpoint](https://html.spec.whatwg.org/multipage/webappapis.html#perform-a-microtask-checkpoint)
- [MDN：Microtask guide](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide)
- [MDN：Window.requestAnimationFrame()](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)
