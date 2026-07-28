# JavaScript 常用方法参考手册

> 本手册整理了 **字符串 (String)**、**数组 (Array)**、**对象 (Object)** 三大类型的常用方法，供快速查阅。
>
> 标注说明：
>
> - ✅ **不修改原数据**（返回新值）
> - ⚠️ **修改原数据**（原地操作）

## 一、字符串 String

JavaScript 字符串是不可变值；字符串方法不会原地修改原字符串，而是根据具体方法返回字符串、数值、布尔值、数组、迭代器或 `null` 等结果。

### 1. 查找类

| 方法               | 作用                                    | 示例                                |
| ------------------ | --------------------------------------- | ----------------------------------- |
| `indexOf(str)`     | 查找子串首次出现的位置，找不到返回 `-1` | `'hello'.indexOf('l')` → `2`        |
| `lastIndexOf(str)` | 返回子串最后一次出现的索引，找不到返回 `-1` | `'hello'.lastIndexOf('l')` → `3` |
| `includes(str)`    | 是否包含某个子串，返回布尔值            | `'hello'.includes('ell')` → `true`  |
| `startsWith(str)`  | 是否以某子串开头                        | `'hello'.startsWith('he')` → `true` |
| `endsWith(str)`    | 是否以某子串结尾                        | `'hello'.endsWith('lo')` → `true`   |
| `search(regexp)`   | 使用正则表达式搜索，返回首次匹配的索引；无匹配返回 `-1` | `'hello'.search(/l/)` → `2` |
| `match(regexp)`    | 按正则表达式匹配；无匹配返回 `null`。无 `g` 标志时返回首个完整匹配及捕获组，有 `g` 标志时返回所有完整匹配 | `'a1b2'.match(/\d/g)` → `['1','2']` |
| `matchAll(regexp)` | 返回包含捕获组信息的所有匹配结果迭代器；传入 `RegExp` 时必须带 `g` 标志 | `[...'a1b2'.matchAll(/\d/g)]` |

### 2. 截取类

| 方法                    | 作用                                        | 示例                               |
| ----------------------- | ------------------------------------------- | ---------------------------------- |
| `slice(start, end)`     | 截取 [start, end) 的子串，支持负数          | `'hello'.slice(1, 3)` → `'el'`     |
| `substring(start, end)` | 截取 `[start, end)`；负数或 `NaN` 按 `0` 处理，`start > end` 时会交换两个参数 | `'hello'.substring(1, 3)` → `'el'` |
| `substr(start, length)` | 从 start 开始截取指定长度（已废弃，不推荐） | `'hello'.substr(1, 3)` → `'ell'`   |
| `charAt(i)`             | 返回指定索引处由单个 UTF-16 码元组成的字符串；越界返回空字符串 | `'hello'.charAt(1)` → `'e'` |
| `charCodeAt(i)`         | 返回指定索引处 UTF-16 码元的数值；越界返回 `NaN` | `'A'.charCodeAt(0)` → `65` |
| `at(i)`                 | 返回指定索引处由单个 UTF-16 码元组成的字符串，支持负索引；越界返回 `undefined` | `'hello'.at(-1)` → `'o'` |

### 3. 转换类

| 方法                         | 作用                 | 示例                             |
| ---------------------------- | -------------------- | -------------------------------- |
| `toUpperCase()`              | 转大写               | `'abc'.toUpperCase()` → `'ABC'`  |
| `toLowerCase()`              | 转小写               | `'ABC'.toLowerCase()` → `'abc'`  |
| `trim()`                     | 去除两端空白字符     | `' hi '.trim()` → `'hi'`         |
| `trimStart()` / `trimLeft()` | 去除开头的空白字符   | `' hi '.trimStart()` → `'hi '`   |
| `trimEnd()` / `trimRight()`  | 去除末尾的空白字符   | `' hi '.trimEnd()` → `' hi'`     |
| `padStart(length, str)`      | 左侧补字符到指定长度 | `'5'.padStart(3, '0')` → `'005'` |
| `padEnd(length, str)`        | 右侧补字符到指定长度 | `'5'.padEnd(3, '0')` → `'500'`   |
| `repeat(n)`                  | 重复字符串 n 次      | `'ab'.repeat(3)` → `'ababab'`    |

### 4. 替换与分割

| 方法                   | 作用                         | 示例                                   |
| ---------------------- | ---------------------------- | -------------------------------------- |
| `replace(pattern, replacement)`    | 按模式替换；字符串或非全局正则只替换首个匹配，全局正则会替换所有匹配 | `'aaa'.replace('a', 'b')` → `'baa'` |
| `replaceAll(pattern, replacement)` | 替换所有匹配；传入正则表达式时必须带 `g` 标志 | `'aaa'.replaceAll('a', 'b')` → `'bbb'` |
| `split(separator)`     | 按分隔符拆成数组             | `'a,b,c'.split(',')` → `['a','b','c']` |
| `concat(str)`          | 拼接字符串（一般直接用 `+`） | `'a'.concat('b')` → `'ab'`             |

### 5. 模板字符串（反引号）

```js
const name = "张三";
const age = 18;
const str = `我叫${name}，今年${age}岁`; // 支持变量插值和换行
```

---

## 二、数组 Array

### 1. 增删改（⚠️ 改变原数组）

| 方法                                   | 作用                     | 返回值             |
| -------------------------------------- | ------------------------ | ------------------ |
| `push(...items)`                       | 向末尾添加一个或多个元素 | 新长度             |
| `pop()`                                | 删除末尾元素             | 被删的元素         |
| `unshift(...items)`                    | 向开头添加一个或多个元素 | 新长度             |
| `shift()`                              | 删除开头元素             | 被删的元素         |
| `splice(start, deleteCount, ...items)` | 从指定位置删除/插入/替换 | 被删元素组成的数组 |
| `reverse()`                            | 反转数组                 | 反转后的原数组     |
| `sort(compareFn?)`                     | 原地排序；省略比较函数时，元素会被转换为字符串并按 UTF-16 码元顺序比较 | 排序后的原数组 |
| `fill(value, start, end)`              | 用固定值填充             | 填充后的原数组     |
| `copyWithin(target, start, end)`       | 内部复制                 | 修改后的原数组     |

**示例：**

```js
const arr = [1, 2, 3];

arr.push(4); // arr → [1, 2, 3, 4]
arr.pop(); // arr → [1, 2, 3]
arr.splice(1, 1); // arr → [1, 3]
arr.splice(1, 0, "x"); // arr → [1, "x", 3]

const numbers = [1, 30, 4, 21, 100000];

[...numbers].sort(); // [1, 100000, 21, 30, 4]
[...numbers].sort((a, b) => a - b); // [1, 4, 21, 30, 100000]
[...numbers].sort((a, b) => b - a); // [100000, 30, 21, 4, 1]
```

### 2. 查找类（✅ 不改变原数组）

| 方法                | 作用                           | 示例                                      |
| ------------------- | ------------------------------ | ----------------------------------------- |
| `indexOf(item)`     | 查找元素索引，找不到返回 `-1`  | `[1,2,3].indexOf(2)` → `1`                |
| `lastIndexOf(item)` | 从后向前搜索，返回元素最后一次出现的索引；找不到返回 `-1` | `[1,2,1].lastIndexOf(1)` → `2` |
| `includes(item)`    | 是否包含某元素                 | `[1,2,3].includes(2)` → `true`            |
| `find(fn)`          | 返回第一个满足条件的元素；找不到返回 `undefined` | `[1,2,3].find(x => x > 1)` → `2` |
| `findIndex(fn)`     | 返回第一个满足条件元素的索引；找不到返回 `-1` | `[1,2,3].findIndex(x => x > 1)` → `1` |
| `findLast(fn)`      | 返回最后一个满足条件的元素；找不到返回 `undefined` | `[1,2,3].findLast(x => x > 1)` → `3` |
| `findLastIndex(fn)` | 返回最后一个满足条件元素的索引；找不到返回 `-1` | `[1,2,3].findLastIndex(x => x > 1)` → `2` |
| `at(i)`             | 取指定索引元素，支持负数       | `[1,2,3].at(-1)` → `3`                    |

### 3. 遍历与转换（✅ 不改变原数组）

这些方法本身不会原地修改数组结构，但传入的回调函数仍然可以修改原数组或数组中的对象。因此，“不改变原数组”只描述方法自身的默认行为。

| 方法                    | 作用                               | 返回        |
| ----------------------- | ---------------------------------- | ----------- |
| `forEach(fn)`           | 遍历每一项（无返回值，不能 break） | `undefined` |
| `map(fn)`               | 遍历并返回**新数组**（一对一转换） | 新数组      |
| `filter(fn)`            | 过滤符合条件的元素                 | 新数组      |
| `reduce(fn, initialValue?)`      | 累加器，从左到右聚合         | 最终结果    |
| `reduceRight(fn, initialValue?)` | 累加器，从右到左聚合         | 最终结果    |
| `flat(depth)`           | 扁平化嵌套数组                     | 新数组      |
| `flatMap(fn)`           | map + flat(1) 的组合               | 新数组      |
| `every(fn)`             | 所有元素都满足条件才返回 `true`    | 布尔        |
| `some(fn)`              | 任一元素满足条件就返回 `true`      | 布尔        |

`initialValue` 可以省略；省略时会使用数组中的第一个或最后一个元素作为初始累计值。空数组在没有提供初始值时会抛出 `TypeError`，因此实际开发中通常建议明确提供初始值。

**重点示例（项目中常用）：**

```js
// map：一对一转换
const list = [{ imgName: "a.jpg", imgUrl: "/a" }];
const mapped = list.map((item) => ({
  name: item.imgName,
  url: item.imgUrl,
}));
// mapped → [{ name: "a.jpg", url: "/a" }]

// filter：过滤
const filtered = [1, 2, 3, 4].filter((n) => n > 2);
// filtered → [3, 4]

// reduce：累加
const total = [1, 2, 3].reduce((sum, n) => sum + n, 0);
// total → 6

// flat：扁平化
const nested = [1, [2, [3]]];
nested.flat(); // [1, 2, [3]]
nested.flat(2); // [1, 2, 3]
nested.flat(Infinity); // 扁平化所有嵌套层级

// every / some
[1, 2, 3].every((n) => n > 0); // true
[1, 2, 3].some((n) => n > 2); // true
```

### 4. 截取与合并（✅ 不改变原数组）

| 方法                | 作用                                | 示例                             |
| ------------------- | ----------------------------------- | -------------------------------- |
| `slice(start, end)` | 截取 [start, end) 的子数组          | `[1,2,3,4].slice(1,3)` → `[2,3]` |
| `concat(...values)` | 合并一个或多个数组或值并返回新数组，也可以根据场景使用展开语法 | `[1].concat([2,3])` → `[1,2,3]` |
| `join(separator)`   | 把数组元素用分隔符连成字符串        | `[1,2,3].join('-')` → `'1-2-3'`  |

### 5. 其他常用

| 方法                                | 作用                         | 示例                                  |
| ----------------------------------- | ---------------------------- | ------------------------------------- |
| `Array.isArray(v)`                  | 判断是否为数组               | `Array.isArray([1])` → `true`         |
| `Array.from(iterable)`              | 类数组/可迭代对象转数组      | `Array.from('abc')` → `['a','b','c']` |
| `Array.of(...items)`                | 创建数组                     | `Array.of(1,2,3)` → `[1,2,3]`         |
| `arr.length`                        | 数组长度（可写，能截断数组） | `arr.length = 0` 清空                 |
| `keys()` / `values()` / `entries()` | 返回对应的迭代器             | 常配合 `for...of` 使用                |

---

## 三、对象 Object

### 1. 遍历与转换（✅ 不改变原对象）

| 方法                      | 作用                       | 示例                                      |
| ------------------------- | -------------------------- | ----------------------------------------- |
| `Object.keys(obj)`             | 返回对象自身可枚举的字符串属性键组成的数组 | `Object.keys({a:1,b:2})` → `['a','b']`    |
| `Object.values(obj)`           | 返回对象自身可枚举字符串属性对应的值组成的数组 | `Object.values({a:1,b:2})` → `[1,2]`      |
| `Object.entries(obj)`          | 返回对象自身可枚举字符串属性的 `[key, value]` 数组 | `Object.entries({a:1})` → `[['a',1]]`     |
| `Object.fromEntries(iterable)` | 根据可迭代对象提供的 `[key, value]` 键值对创建新对象 | `Object.fromEntries([['a',1]])` → `{a:1}` |

```js
const obj = { name: "张三", age: 18 };

Object.keys(obj); // ['name', 'age']
Object.values(obj); // ['张三', 18]
Object.entries(obj); // [['name','张三'], ['age',18]]

// 遍历对象
for (const [key, value] of Object.entries(obj)) {
  console.log(key, value);
}

// 对象 → 数组 → 加工 → 再转回对象
Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v + "!"]));
```

### 2. 合并与复制

| 方法                                | 作用                                         | 示例 |
| ----------------------------------- | -------------------------------------------- | ---- |
| `Object.assign(target, ...sources)` | 将多个源对象合并到目标对象（⚠️ 改变 target） | 见下 |
| `{ ...obj }`                        | 使用对象展开语法浅拷贝或合并对象自身的可枚举属性 | 见下 |

```js
// Object.assign
const a = { x: 1 };
const b = { y: 2 };
Object.assign(a, b); // a → { x:1, y:2 }
const c = Object.assign({}, a, b); // 推荐：合并到新对象

// 对象展开语法
const merged = { ...a, ...b }; // { x:1, y:2 }
const copied = { ...a }; // 浅拷贝
const updated = { ...a, x: 100 }; // 覆盖某字段
```

> **注意**：以上都是**浅拷贝**。深层嵌套对象仍共享引用。
>
> `JSON.parse(JSON.stringify(value))` 只适用于可安全表示为 JSON 的数据：`undefined`、函数和 Symbol 可能被忽略或转换，`NaN` 和 `Infinity` 会变成 `null`，BigInt 与循环引用会导致错误，Date 等类型也不能保持原类型。
>
> `structuredClone(value)` 支持循环引用和多种内置类型，但函数、DOM 节点等值无法克隆，并可能抛出 `DataCloneError`。

### 3. 属性判断与控制

| 方法                      | 作用                           | 示例                      |
| ------------------------- | ------------------------------ | ------------------------- |
| `obj.hasOwnProperty(key)` | 是否有自身属性（不包括原型链） | `obj.hasOwnProperty('a')` |
| `Object.hasOwn(obj, key)` | 同上，更推荐的新写法           | `Object.hasOwn(obj, 'a')` |
| `'key' in obj`            | 是否有该属性（包括原型链）     | `'a' in obj`              |
| `Object.freeze(obj)`      | 浅冻结对象自身：不能添加或删除自身属性，已有数据属性不能重新赋值；嵌套对象不会自动冻结 | `Object.freeze(obj)` |
| `Object.isFrozen(obj)`    | 是否被冻结                     | `Object.isFrozen(obj)`    |
| `Object.seal(obj)`        | 浅密封对象：不能新增或删除自身属性；已有可写数据属性的值仍可修改 | |
| `delete obj.key` | 尝试删除对象自身属性并返回布尔值；不可配置属性无法删除，严格模式下会抛出 `TypeError` | `delete obj.a` |

### 4. 属性定义与获取

| 方法                                          | 作用                                         |
| --------------------------------------------- | -------------------------------------------- |
| `Object.defineProperty(obj, key, descriptor)` | 精确定义一个属性（可控制是否可写、可枚举等） |
| `Object.defineProperties(obj, descriptors)`   | 批量定义                                     |
| `Object.getOwnPropertyDescriptor(obj, key)`   | 获取属性描述符                               |
| `Object.getOwnPropertyNames(obj)`             | 获取所有自身字符串属性名，包括不可枚举属性，但不包括 Symbol 属性 |
| `Object.getOwnPropertySymbols(obj)`           | 获取所有自身 Symbol 属性键                   |
| `Object.getPrototypeOf(obj)`                  | 获取原型                                     |
| `Object.setPrototypeOf(obj, proto)`           | 设置原型                                     |
| `Object.create(proto)`                        | 以指定原型创建对象                           |

### 5. JSON 相关

| 方法                  | 作用               | 示例                                  |
| --------------------- | ------------------ | ------------------------------------- |
| `JSON.stringify(value)` | 将可序列化的 JavaScript 值转换为 JSON 文本；某些值会被忽略、转换或导致错误 | `JSON.stringify({a:1})` → `'{"a":1}'` |
| `JSON.parse(text)`      | 解析 JSON 文本并返回对应的 JavaScript 值，结果可以是对象、数组、字符串、数值、布尔值或 `null` | `JSON.parse('{"a":1}')` → `{a:1}` |

```js
// 格式化输出
JSON.stringify({ a: 1, b: 2 }, null, 2);
// 仅适用于 JSON 兼容数据的往返复制，不是通用深拷贝方案
const jsonCompatibleCopy = JSON.parse(JSON.stringify(obj));
```

---

## 附录：常用组合技巧

### 1. 数组去重

```js
// Set 法（最简洁）
[...new Set([1, 2, 2, 3])]; // [1, 2, 3]
```

`Set` 使用 SameValueZero 判断值是否重复：`NaN` 会被视为相同，`0` 与 `-0` 也视为相同；对象则按引用判断，内容相同但引用不同的对象不会被去重。

```js
// filter + indexOf：适用于不包含 NaN 的简单值数组
const values = [1, 2, 2, 3];
values.filter((value, index, array) => array.indexOf(value) === index);
// [1, 2, 3]
```

`indexOf()` 使用严格相等规则，无法找到 `NaN`，因此通用去重通常优先使用 `Set`。

### 2. 数组/对象转换

```js
// 对象数组 → 以 id 为属性键的普通对象
const list = [
  { id: 1, name: "a" },
  { id: 2, name: "b" },
];
const recordsById = Object.fromEntries(
  list.map((item) => [item.id, item]),
);
// {
//   "1": { id: 1, name: "a" },
//   "2": { id: 2, name: "b" },
// }
```

普通对象的属性键只能是字符串或 Symbol，因此数值 `id` 会被转换为字符串属性键。

如果数组中存在重复 `id`，后出现的键值对会覆盖先出现的同名属性；需要禁止重复时，应在转换前进行校验。

```js
// 对象 → 查询字符串
const params = { page: 1, size: 10 };
const query = new URLSearchParams(
  Object.entries(params).map(([key, value]) => [
    key,
    String(value),
  ]),
).toString();
// 'page=1&size=10'
```

### 3. 判断空值

```js
// 判断数组为空
arr.length === 0;

// 没有自身可枚举字符串属性
Object.keys(obj).length === 0;

// 没有任何自身属性，包括不可枚举属性和 Symbol 属性
Reflect.ownKeys(obj).length === 0;

// 严格判断空字符串
str.length === 0;

// 判断空字符串或只包含空白字符的字符串
str.trim().length === 0;
```

### 4. 链式调用示例

```js
const result = users
  .filter((u) => u.age >= 18) // 过滤成年人
  .map((u) => u.name) // 提取名字
  .sort() // 排序
  .join(", "); // 拼成字符串
```

---

> 📖 **查阅建议**：查阅方法时，应先确认它是否会原地修改数据，再确认返回值、参数规则和边界情况。
