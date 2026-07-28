# JavaScript

## 不熟悉的点

### JS模块导入导出

:::danger 对比表格
| 场景 | 导出写法（在 `a.js`） | 导入写法（在其他文件） | 备注 |
|---|---|---|---|
| 具名导出变量、函数 | `export const x = 1;` `export function add(a,b){}` | `import { x, add } from './a.js';` | 需用 `{}`，名称要对应 |
| 具名导入重命名 | `export const x = 1;` | `import { x as foo } from './a.js';` | 解决重名或语义优化 |
| 默认导出 | `export default function() {};` | `import anyName from './a.js';` | 不用 `{}`，名字可自定义 |
| 默认 + 具名同时导出 | `export default A; export const x = 1;` | `import A, { x } from './a.js';` | 默认导入写前面 |
| 命名空间整体导入 | `export const x=1; export const y=2;` | `import * as mod from './a.js';` | 用 `mod.x`、`mod.y` 访问 |
:::

## 快速入门

### 1. 引入

- 内部标签使用

```html
<script>
  .....
</script>
```

- 外部引入使用 **一定使用双标签，不要使用单标签（可能出问题）**

```html
<script src="https://cdn.bootcss.com/jquery/3.2.1/jquery.min.js"></script>
```

### 2. 变量与数据类型

JavaScript 与 Java 是两种不同的语言，虽然部分基础语法形式相似，但类型系统、对象模型和运行机制均不同，不能直接按 Java 语法编写。JavaScript 严格区分大小写。

- number JavaScript不区分小数和整数。 `123` `123.2` 浮点数会有精度损失。
- string `'abc'` `"abc"`
- boolean `true` `false`
- 与或非 `&&` `||` `!`
- `=` 用于赋值；`==` 是宽松相等，比较时可能进行类型转换；`===` 是严格相等，不进行类型转换。通常应优先使用 `===`。
- `NaN` 表示“非数值”的数值结果；可使用 `Number.isNaN(value)` 进行精确判断。全局 `isNaN()` 会先把参数转换为数值，判断语义不同。
- null `null` 空
- undefined `undefined` 未定义
- 数组 `[1, 2, 3, 'hello', true, null, undefined]` 索引从0开始, 索引越界会返回undefined
- 对象 `{name: 'hello', age: 18}`

```javascript
var person = {
  name: 'hello',
  age: 18,
  target: [1, 2, 3]
};
```

## 数据类型

1. 字符串

```javascript
// 模板字符串：
var name = 'hello';
var age = 18;
var info = `my name is ${name}, age is ${age}`;

// 字符串长度：
var name = 'hello';
var length = name.length;

// 大小写转换：
var name = 'hello';
var upperName = name.toUpperCase();
var lowerName = name.toLowerCase();

// 获取索引：
var name = 'hello';
var index = name.indexOf('l');

// 获取子串：
var name = 'hello';
var subName = name.substring(1, 3); // [1, 3)
```

2. 数组
   Array可以存放任意数据类型。

```javascript
// 示例：
var arr = [1, 2, 3, 'hello', true, null, undefined];

// 获取数组长度：
var arr = [1, 2, 3, 'hello', true, null, undefined];
var length = arr.length;

// 如果给 arr.length赋值，数组长度会改变。如果赋值过小，数组会丢失，如果赋值过大，数组会扩展。

// 获取数组元素：
var arr = [1, 2, 3, 'hello', true, null, undefined];
var element = arr[0];
var element = arr[arr.length - 1];

// 获取下标索引：
var arr = [1, 2, 3, 'hello', true, null, undefined];
var index = arr.indexOf(3);

// 添加元素：
var arr = [1, 2, 3, 'hello', true, null, undefined];
arr.push(4); // 添加元素到尾部
arr.pop(); // 删除末尾的一个元素
arr.unshift('a', 'b'); // 添加元素到头部
arr.shift(); // 删除头部一个元素

// 截取数组（返回一个新的数组 类似于String中的substring）：
var arr = [1, 2, 3, 'hello', true, null, undefined];
var newArr = arr.slice(1, 3);
var newArr = arr.slice(1);

// 数组排序：
var arr = ['A', 'B', 'C'];
arr.sort();

// 元素翻转：
var arr = ['A', 'B', 'C'];
arr.reverse();

// 删除数组元素：
var arr = [1, 2, 3, 'hello', true, null, undefined];
arr.splice(1, 2);
arr.splice(1, 0, 'a', 'b');

// 拼接数组（会返回一个新的数组 不改变原数组）：
var arr = [1, 2, 3];
var newArr = arr.concat([4, 5, 6]);

// 连接符（使用特定的字符串符接数组元素）：
var arr = [1, 2, 3];
var str = arr.join('-');

// 多维数组：
var arr = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
]

// 获取多维数组元素：
var element = arr[1][1]; // 5

// 遍历数组：
for (var i = 0; i < arr.length; i++) {
    console.log(arr[i]);
}

// 遍历多维数组：
for (var i = 0; i < arr.length; i++) {
    for (var j = 0; j < arr[i].length; j++) {
        console.log(arr[i][j]);
    }
}
```

3. 对象

**JavaScript 对象的属性键是字符串或 Symbol，属性值可以是任意类型。**

```javascript
// 示例：
var person = {name: 'hello',
              age: 18
              };

// 获取对象属性：
person.name // hello
person['name'] // hello
person.haha // undefined 使用键值访问属性时，如果键值不存在，会返回undefined

// 添加对象属性：
person.haha = 'haha';
person['haha'] = 'haha';

// 删除对象属性：
delete person.name;
delete person['name'];

// 遍历对象：
for (var key in person) {
    console.log(key, person[key]);
}

// 判断属性是否存在：
if ('name' in person) {
    console.log('存在');
}

// 判断这个属性是否是对象自身拥有的属性：
if (person.hasOwnProperty('name')) {
    console.log('是');
}
```

4. Map和Set

Map 和 Set 都是 ES6 新增的集合类型。对象的属性键只能是字符串或 Symbol，而 Map 的键可以是任意值；同一个 Map 中键不能重复，重复设置同一键会覆盖原值，但不同键对应的值可以重复。Set 中的值不能重复。

```javascript
// 1. Map // 键值对
var map = new Map();
map.set('name', 'hello');
map.set(1, 'world');
map.set(true, 'haha');
map.set(null, 'null');
map.set(undefined, 'undefined');

// 通过 key 获取 value：
map.get('name'); // hello

// 设置键值对：
map.set("name", "Tom");

// 2. Set // 按插入顺序迭代且值不重复的集合
var set = new Set(); // set可以去重

// 添加元素：
set.add('hello');
set.add(1);

// 删除元素：
set.delete('hello');
set.delete(1);

// 是否包含某个元素：
if (set.has('hello')) {
    console.log('包含');
}
```

## 流程控制

直接上例子：

```javascript
var age = 18;
if (age >= 18) {
    console.log('可以投票');
} else if (age < 30) {
    console.log('可以投2票');
} else {
    console.log('不可以投票');
}

while (age < 100) {
    age++;
    console.log(age); // while循环会先判断条件再执行代码
}

do {
    age++;
    console.log(age);
} while (age < 100); // do while循环至少会执行一次


for (var i = 0; i < 10; i++) {
    console.log(i);
}

// foreach循环：
var arr = [1, 2, 3, 4, 5];
arr.forEach(function (element, index) {
    /**
     * element 当前元素
     * index 当前索引
     */
    console.log(element, index);
})

// for-in循环：
var person = {
    name: 'hello',
    age: 18
        };
for (var key in person) {
  if (Object.hasOwn(person, key)) {
    // key 是可枚举的字符串属性键，person[key] 是对应的属性值
    console.log(key, person[key]);
  }
}


switch (age) {
    case 18:
        console.log('可以投票');
        break;
    case 30:
        console.log('可以投2票');
        break;
    default:
        console.log('不可以投票');
        break;
}
```

### Iterator和 Generator

```javascript
// 1. Iterator // 迭代器
var arr = [1, 2, 3];
var iterator = arr[Symbol.iterator]();
```

> Generator 部分待补充。

## 函数

调用函数时，实参数量可以多于或少于形参数量。非箭头函数可以通过自己的 `arguments` 对象访问本次调用传入的实参；箭头函数没有自己的 `arguments`，通常使用剩余参数（`...args`）接收实参。

```javascript
// 1. 定义函数
// 第一种方式（函数声明）：
sayHello(); // 可以在这里调用！因为函数声明会被"提升"到顶部。

function sayHello() {
    console.log("你好！");
}

// 最重要的特性是"提升"。可以在函数定义之前就调用它，因为它在代码运行前就被加载到内存中了。

// 第二种方式（函数表达式）：
// sayHi(); // 报错！因为这时候代码还没执行到赋值的那一行。

const sayHi = function() {
    console.log("嗨！");
};

// 函数表达式会在初始化表达式执行时创建函数值并赋给变量。变量绑定本身仍遵循其声明方式的规则：`const`、`let` 在声明前处于 TDZ，`var` 则会提前初始化为 `undefined`。函数声明和函数表达式各有适用场景，不能笼统地说函数表达式更现代。

// 2. 箭头函数 (ES6 现代写法)
// 这是 ES6 (2015年) 引入的革命性语法，也是你现在最应该掌握的写法。它让代码变得极其简洁。

// 基本写法:
const addWithBlock = (a, b) => {
  return a + b;
};

// 简写规则 (非常常用):
// 当函数体是单个表达式时，可以省略大括号和 return，表达式的值会被隐式返回；能否省略与代码占几行无关：
const addConcise = (a, b) => a + b; // 自动返回 a + b
// 如果只有一个形式参数且它是简单标识符，可以省略小括号：
const double = n => n * 2;
// 注意: 箭头函数不仅仅是语法糖，它在处理 this 指向问题时和普通函数完全不同（如果只是普通计算或处理数据，优先用箭头函数）
```

### 变量的作用域

JavaScript 采用词法作用域。`var` 具有函数作用域或全局作用域；`let`、`const` 和 `class` 具有块级作用域。内层作用域可以访问外层绑定，同名的内层声明只会在自己的作用域内遮蔽外层绑定。`const` 禁止重新赋值，但不表示对象或数组的内容不可修改。

- 全局作用域：在脚本的全局环境中声明的绑定。
- 模块作用域：ES 模块顶层声明只属于当前模块，不会自动成为全局变量。
- 函数作用域：函数内部由 `var` 或函数声明等创建的绑定。
- 块级作用域：由 `{}` 块以及 `let`、`const`、`class` 等声明形成的作用域。

```javascript
const globalVar = "我是全局的"; // 外部变量
function myFunction() {
  const localVar = "我是局部的"; // 内部变量
  console.log(globalVar); // 可以访问外部的
  console.log(localVar); // 可以访问内部的
}
myFunction();
console.log(localVar); // 报错！外面访问不到内部的变量
```

### 闭包

```javascript
function outerWithNamedInner() {
  let i = 1;
  function fn() {
    console.log(i);
  }
  return fn;
}
const namedClosure = outerWithNamedInner();
namedClosure(); // 1
// 内部函数访问并保留外层函数中的变量

// 简写形式：
function outerWithAnonymousInner() {
  let i = 1;
  return function () {
    console.log(i);
  };
}

const anonymousClosure = outerWithAnonymousInner();
anonymousClosure(); // 1
```

### 变量和函数提升

函数声明和 `var` 声明都会在执行作用域代码前被实例化，但两者的初始化行为不同。`var` 绑定会被初始化为 `undefined`；函数声明通常会直接初始化为对应的函数对象。

总结：

1. 访问无法解析的标识符通常会抛出 `ReferenceError`，不是语法错误
2. `var` 绑定在声明语句执行前已经存在并被初始化为 `undefined`
3. `let` 和 `const` 绑定也会在作用域实例化时创建，但在声明语句执行前处于暂时性死区（TDZ），访问会抛出 `ReferenceError`
4. 函数声明通常可以在同一作用域内先调用后声明；块和模块中的具体行为还受相应语义约束
5. 实际开发中仍建议先声明再访问，以减少歧义

> 注：关于变量提升的原理分析会涉及较为复杂的执行上下文和环境记录等知识。`let` 和 `const` 的绑定也会在作用域实例化时创建，但在声明语句执行前处于暂时性死区（TDZ），不能用“规避变量提升”来描述。有兴趣可查阅资料。

```javascript
// 调用函数
foo();
// 声明函数
function foo() {
  console.log("声明之前即被调用...");
}

// `var bar` 的声明会提前初始化为 undefined，但后面的函数赋值不会提前执行
bar(); // TypeError：此时 bar 不是函数
var bar = function () {
  console.log("函数表达式在赋值语句执行后才可调用");
};
```

总结：

1. 函数提升能够使函数的声明调用更灵活
2. 函数表达式的函数值不会随变量声明一起提前赋值；声明前访问的结果取决于变量使用 `var`、`let` 还是 `const`
3. 函数提升出现在相同作用域当中

### 可变参数

```javascript
// 求和函数，计算所有参数的和
function sum() {
  // console.log(arguments)
  let s = 0;
  for (let i = 0; i < arguments.length; i++) {
    s += arguments[i];
  }
  console.log(s);
}
// 调用求和函数
sum(5, 10); // 两个参数
sum(1, 2, 4); // 三个实参
```

得到一个伪数组

### 剩余参数

```javascript
function config(baseURL, ...other) {
  console.log(baseURL); // 得到 'http://baidu.com'
  console.log(other); // other  得到 ['get', 'json']
}
// 调用函数
config("http://baidu.com", "get", "json");
```

1. `...` 用于定义剩余参数；整个剩余参数必须位于形参列表的最后一个位置，并把尚未由前面形参匹配的实参收集为一个数组
2. 借助 `...` 获取的剩余实参，是个真数组

### Date

```javascript
var date = new Date();
date.getFullYear(); // 获取本地年份
date.getMonth(); // 获取本地月份，范围为 0～11
date.getDate(); // 获取本月中的日期，范围为 1～31
date.getDay(); // 获取星期，范围为 0～6，0 表示星期日
date.getHours(); // 获取本地小时
date.getTime(); // 获取自 Unix 纪元以来的毫秒数
```

### JSON

JavaScript 的值包括原始值和对象，并非一切都是对象。JSON 能表示对象、数组、字符串、有限数字、布尔值和 `null`；`undefined`、函数和 Symbol 不能直接表示，BigInt 默认也不能被 `JSON.stringify()` 序列化。`JSON.stringify()` 用于生成可序列化值的 JSON 文本，`JSON.parse()` 则把合法 JSON 文本解析为相应的 JavaScript 值，结果不一定是对象。

### 解构赋值

解构赋值是一种快速为变量赋值的简洁语法，本质上仍然是为变量赋值，分为数组解构、对象解构两大类型。

#### 数组解构

数组解构是将数组的单元值快速批量赋值给一系列变量的简洁语法，如下代码所示：

```javascript
// 普通的数组
let arr = [1, 2, 3];
// 批量声明变量 a b c
// 同时将数组单元值 1 2 3 依次赋值给变量 a b c
let [a, b, c] = arr;
console.log(a); // 1
console.log(b); // 2
console.log(c); // 3
```

总结：

1. `[]` 表示数组解构模式；与 `let`、`const` 或 `var` 一起使用时可声明并初始化多个变量，单独出现在赋值表达式左侧时则给已有变量赋值。
2. 变量的顺序对应数组单元值的位置依次进行赋值操作
3. 变量的数量大于单元值数量时，多余的变量将被赋值为 `undefined`
4. 变量的数量小于单元值数量时，可以通过 `...` 获取剩余单元值，但只能置于最末位
5. 允许初始化变量的默认值，且只有单元值为 `undefined` 时默认值才会生效

注：支持多维解构赋值，比较复杂后续有应用需求时再进一步分析

#### 对象解构

对象解构是将对象属性和方法快速批量赋值给一系列变量的简洁语法，如下代码所示：

```javascript
// 普通对象
const user = {
  name: "小明",
  age: 18,
};
// 批量声明变量 name age
// 按属性名从 user 中取得 name 和 age 属性值，并分别赋给同名变量
const { name, age } = user;

console.log(name); // 小明
console.log(age); // 18
```

例2：

```html
<body>
  <script>
    // 1. 这是后台传递过来的数据
    const msg = {
      code: 200,
      msg: "获取新闻列表成功",
      data: [
        {
          id: 1,
          title: "5G商用自己，三大运用商收入下降",
          count: 58,
        },
        {
          id: 2,
          title: "国际媒体头条速览",
          count: 56,
        },
        {
          id: 3,
          title: "乌克兰和俄罗斯持续冲突",
          count: 1669,
        },
      ],
    };

    // 需求1：从 msg 中解构出 data
    const { data } = msg;
    console.log(data);

    // 需求2：在函数参数中直接解构 data
    function render({ data }) {
      console.log(data);
    }
    render(msg);

    // 需求3：将解构出的 data 重命名为 myData
    function renderWithAlias({ data: myData }) {
      console.log(myData);
    }
    renderWithAlias(msg);
  </script>
</body>
```

总结：

1. `{}` 表示对象解构模式；与 `let`、`const` 或 `var` 一起使用时可声明并初始化多个变量，也可以在赋值表达式中给已有变量赋值。
2. 对象属性的值将被赋值给与属性名相同的变量
3. 对象中找不到与变量名一致的属性时变量值为 `undefined`
4. 允许为解构变量设置默认值；当对应属性不存在或属性值为 `undefined` 时，默认值才会生效

注：支持多维解构赋值

## 面向对象编程

- JavaScript 采用基于原型的对象模型。通过 `new Constructor()` 创建实例时，实例的内部 `[[Prototype]]` 通常会被设为 `Constructor.prototype`。
- `class` 是 ES2015 引入的语法，仍建立在原型与原型链机制之上，并不是独立于原型的另一套对象模型。

```javascript
// 类
class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  sayHello() {
    console.log("hello");
  }
}

var person = new Person("hello", 18);

// 继承
class Student extends Person {
  constructor(name, age, grade) {
    super(name, age);
    this.grade = grade;
  }
  study() {
    console.log("study");
  }
}
```

```javascript
// 示例：
const user = {
    // 属性
    name: "张三",
    age: 25,
    // 方法 (对象里的函数)
    sayHi: function() {
        console.log("大家好，我是" + this.name);
    },
    // ES6 简写方法 (推荐)
    introduce() {
        console.log(`我今年${this.age}岁`);
    }
};

console.log(user.name); // 访问属性：张三
user.sayHi();           // 调用方法：大家好，我是张三

// 对象的操作：
user.gender = "男"; // 新增或修改属性
delete user.age; // 删除属性
user.age; // 使用点号访问属性
user["age"]; // 使用方括号访问属性
```

> 原型链：对象通过内部 `[[Prototype]]` 链接关联到另一个对象。由 `new Constructor()` 创建的实例，其 `[[Prototype]]` 通常指向 `Constructor.prototype`；可使用 `Object.getPrototypeOf()` 读取。`__proto__` 是历史访问器，不是每个实例都会新建的自有属性。
> ![原型链](/assert/js-image/原型链.png)

### this

`this` 的值取决于函数类型和调用方式：普通函数会根据直接调用、方法调用、构造调用以及 `call`、`apply`、`bind` 等方式确定 `this`；箭头函数没有自己的 `this`，而是沿词法环境取得外层 `this`。因此不能统一概括为“谁调用就指向谁”。

1. 以对象方法形式调用（最常见）：
   当执行 `person.eat()` 时，`eat` 内部的 `this` 指向调用表达式中点号左侧的 `person`。函数是否存放在对象属性中并不能单独决定 `this`；若将它取出后直接调用，`this` 会按直接调用规则确定。

```javascript
const person = {
  name: "李四",
  eat: function () {
    console.log(this.name + " 在吃饭"); // 这里的 this 指向 person
  },
};
person.eat(); // 输出：李四 在吃饭
```

2. 在普通函数中：
   如果普通函数被直接调用，严格模式下 `this` 为 `undefined`；非严格模式下会使用当前运行环境的全局 `this` 值。浏览器经典脚本中通常是 `window`，但 ES 模块始终处于严格模式，其他运行环境也不一定存在 `window`。

```javascript
function test() {
  console.log(this);
}
test(); // 直接调用；this 的值取决于函数是否处于严格模式以及运行环境
```

3. 在箭头函数中 (关键区别)：
   箭头函数没有自己的 `this` 它会捕获外层作用域的 `this`。

```javascript
const obj = {
  name: "王五",
  regularFunc: function () {
    setTimeout(function () {
      console.log(this); // 不会继承 regularFunc 的 this；具体值由宿主环境的调用方式决定
    }, 100);
  },
  arrowFunc: function () {
    setTimeout(() => {
      console.log(this.name); // 当以 obj.arrowFunc() 调用时输出“王五”
    }, 100);
  },
};

obj.regularFunc();
obj.arrowFunc();
```

::: warning JavaScript 的 `this` 不能直接类比 Java
普通函数的 `this` 由调用方式决定；箭头函数不创建自己的 `this`，而是从外层词法环境读取。`call`、`apply` 和 `bind` 可以为普通函数显式提供 `this`。
:::
![this](/assert/js-image/this.png)

### 改变this指向

以上归纳了普通函数和箭头函数中关于 `this` 默认值的情形，不仅如此 JavaScript 中还允许指定函数中 `this` 的指向，有 3 个方法可以动态指定普通函数中 `this` 的指向：

#### call

使用 `call` 方法调用函数，同时指定函数中 `this` 的值，使用方法如下代码所示：

```html
<script>
  // 普通函数
  function sayHi() {
    console.log(this);
  }

  let user = {
    name: "小明",
    age: 18,
  };

  let student = {
    name: "小红",
    age: 16,
  };

  // 调用函数并指定 this 的值
  sayHi.call(user); // this 值为 user
  sayHi.call(student); // this 值为 student

  // 求和函数
  function counter(x, y) {
    return x + y;
  }

  // 调用 counter 函数，并传入参数
  let result = counter.call(null, 5, 10);
  console.log(result);
</script>
```

总结：

1. `call` 方法能够在调用函数的同时指定 `this` 的值
2. 使用 `call` 方法调用函数时，第1个参数为 `this` 指定的值
3. `call` 方法的其余参数会依次自动传入函数做为函数的参数

#### apply

使用 `apply` 方法调用函数，同时指定函数中 `this` 的值，使用方法如下代码所示：

```html
<script>
  // 普通函数
  function sayHi() {
    console.log(this);
  }

  let user = {
    name: "小明",
    age: 18,
  };

  let student = {
    name: "小红",
    age: 16,
  };

  // 调用函数并指定 this 的值
  sayHi.apply(user); // this 值为 user
  sayHi.apply(student); // this 值为 student

  // 求和函数
  function counter(x, y) {
    return x + y;
  }
  // 调用 counter 函数，并传入参数
  let result = counter.apply(null, [5, 10]);
  console.log(result);
</script>
```

总结：

1. `apply` 方法能够在调用函数的同时指定 `this` 的值
2. 使用 `apply` 方法调用函数时，第1个参数为 `this` 指定的值
3. `apply` 方法的第 2 个参数可以是数组或类数组对象，也可以是 `null` 或 `undefined`；其中的元素会按顺序作为函数实参传入

#### bind

`bind` 方法并**不会调用函数**，而是创建一个指定了 `this` 值的新函数，使用方法如下代码所示：

```html
<script>
  // 普通函数
  function sayHi() {
    console.log(this);
  }
  let user = {
    name: "小明",
    age: 18,
  };
  // 调用 bind 指定 this 的值
  let sayHello = sayHi.bind(user);
  // 调用使用 bind 创建的新函数
  sayHello();
</script>
```

注：`bind()` 会创建一个新的绑定函数，可以预先绑定 `this` 和部分参数；新函数的 `name`、`length` 等属性以及作为构造函数调用时的行为也可能与原函数不同，因此变化不只限于 `this`。

## 异步编程

浏览器主线程上的 JavaScript 代码通常按任务逐段执行，同一时刻只执行其中一段；但网络请求和 Worker 等可以在其他执行环境中并行工作，因此不能把整个浏览器概括为同一时间只能做一件事。

浏览器下载图片通常由网络层异步处理，不会因为下载本身阻塞 JavaScript 主线程；长时间运行的同步 JavaScript 才会占用主线程并导致页面暂时无法响应。

浏览器等宿主环境通过事件循环协调任务队列与微任务队列：当前任务执行结束后会进行微任务检查点，再由事件循环选择后续任务执行。异步 API 的等待工作通常由宿主环境处理，完成后再安排相应回调，不能简单把队列中的工作分成“同步任务”和“异步任务”两类。

#### 1. 定时器

最简单的异步体验。

```javascript
console.log("1. 开始");

setTimeout(() => {
  console.log("2. 这里是异步代码，至少约 2 秒后才有机会执行");
}, 2000);

console.log("3. 结束");

// 输出顺序：1 -> 3 -> 2
// 解释：setTimeout 会在延迟时间到达后安排回调任务；回调还必须等待当前任务及此前排队的任务完成，因此实际执行时间可能晚于 2 秒。
```

#### 2. Promise（重要）

以前为了处理异步，我们会把函数套在函数里（回调函数）。如果步骤一多，代码就会变成金字塔形状（回调地狱），难以维护。Promise 就是为了解决这个问题诞生的。

- **三种状态**：
  - `pending`（待定）
  - `fulfilled`（已兑现）
  - `rejected`（已拒绝）

- **基本用法**：
  Promise 是一个承诺：我可能会成功，也可能会失败，稍后告诉你结果。

  ```javascript
  const mockRequest = () => {
    return new Promise((resolve, reject) => {
      // 模拟网络请求...
      const isSuccess = true;

      setTimeout(() => {
        if (isSuccess) {
          resolve("请求成功！数据是..."); // 成功时调用 resolve
        } else {
          reject("请求失败！网络错误"); // 失败时调用 reject
        }
      }, 1000);
    });
  };

  // 使用 Promise
  mockRequest()
    .then((data) => {
      console.log(data); // 如果成功，执行这里
    })
    .catch((err) => {
      console.log(err); // 如果失败，执行这里
    });
  ```

- **链式调用**：
  这是 Promise 最强大的地方。如果你有两个任务，必须按顺序做完（比如：先拿到用户ID，再去拿用户详情），就需要链式调用。

**规则**：每次调用 `.then()` 都会返回一个新的 Promise。处理函数可以返回普通值、Promise 或 thenable；返回结果会被用于解析这个新 Promise，后续链式处理会等待它确定状态后再继续。

```javascript
// 模拟登录：
function step1() {
    return new Promise((resolve) => {
        setTimeout(() => resolve("用户ID: 888"), 1000);
    });
}

function step2(userId) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(`拿到 ${userId} 的详细资料`), 1000);
    });
}

// 开始链式调用
step1()
    .then((id) => {
        console.log("第一步结果：" + id);
        // 关键点：返回一个 Promise，把结果传给下一个 then
        return step2(id);
    })
    .then((details) => {
        console.log("第二步结果：" + details);
        // 只有 step2 完成了，这里才会运行
    })
    .catch((err) => {
        // 上面任何一步出错，都会直接跳到这里，中间的 .then 不会执行
        console.log("出错了：" + err);
    });
```

#### 3. Async / Await（ES7）

这是 Promise 的语法糖。它的出现让异步代码写得**像同步代码一样直观**。这是目前最主流的写法。

- **规则**：
  1.  `async` 写在函数定义前面，表示这是个异步函数。
  2.  `await` 可以在 `async` 函数内部使用，也可以在支持顶层 `await` 的 ES 模块顶层使用。它可以等待 Promise、thenable 或普通值；兑现时产生结果，拒绝时抛出异常。
  3.  等待期间，JS 引擎可以去处理别的事情（不阻塞）。

```javascript
async function handleData() {
  console.log("开始获取数据...");

  try {
    // await 会暂停当前 async 函数，直到操作数对应的 Promise 确定状态
    // 兑现时得到值，拒绝时抛出异常；等待期间不会阻塞主线程
    const data = await mockRequest();
    console.log("拿到了数据 -> " + data);

    // 可以继续 await 下一个请求
    const data2 = await mockRequest();
  } catch (error) {
    console.log("出错了：" + error);
  }
}

handleData();
```

## JavaScript DOM

### 1. 查找节点

获取页面元素是操作 DOM 的第一步。

#### 1.1 标准选择器 (推荐)

现代浏览器主要使用 `querySelector` 和 `querySelectorAll`，语法类似于 CSS 选择器。

- **`document.querySelector(selector)`**: 返回匹配到的**第一个**元素。如果没有匹配则返回 `null`。
- **`document.querySelectorAll(selector)`**: 返回所有匹配元素的 **NodeList**（类数组对象）。如果没有匹配则返回空的 `NodeList`。

```javascript
// 获取 ID 为 btn 的元素
const btn = document.querySelector("#btn");

// 获取所有 class 为 item 的元素
const items = document.querySelectorAll(".item");

// 获取第一个 p 标签
const firstP = document.querySelector("p");
```

#### 1.2 传统 getElement 系列（专用查询 API）

- **`document.getElementById(id)`**: 通过 ID 获取元素。
- **`document.getElementsByClassName(className)`**: 通过类名获取（返回 HTMLCollection，**实时更新**）。
- **`document.getElementsByTagName(tagName)`**: 通过标签名获取（返回 HTMLCollection，**实时更新**）。

> **注意：** `querySelectorAll` 返回的是静态 `NodeList`（获取后 DOM 变化不影响结果），而 `getElementsBy...` 返回的是动态 `HTMLCollection`（DOM 变化会自动反映在集合中）。

---

### 2. 修改内容与属性

获取元素后，可以对其进行修改。

#### 2.1 修改文本内容

- **`element.textContent`**: 设置或获取元素及其后代的**纯文本**内容（不解析 HTML 标签）。
- **`element.innerText`**: 表示元素实际渲染出来的文本，受 CSS 样式影响；读取它时可能为了得到最新渲染结果而触发布局计算。如果不需要考虑渲染样式，通常可使用 `textContent`。
- **`element.innerHTML`**: 设置或获取元素的 **HTML 内容**（解析标签）。**注意：存在 XSS 安全风险，不要插入不可信的用户输入。**

```javascript
const div = document.querySelector("div");

div.textContent = "<strong>Hello</strong>"; // 显示为纯文本：<strong>Hello</strong>
div.innerHTML = "<strong>Hello</strong>"; // 显示为粗体：Hello
```

#### 2.2 修改样式

- **`element.style.property`**: 修改**行内样式**（优先级高）。属性名使用驼峰命名法（如 `backgroundColor` 而不是 `background-color`）。
- **`element.className`**: 替换整个 class 字符串。
- **`element.classList`**: 专门用于操作类名的 API，非常强大。

```javascript
div.style.color = "red";
div.style.fontSize = "16px";

// classList 操作
div.classList.add("active"); // 添加类
div.classList.remove("hidden"); // 移除类
div.classList.toggle("open"); // 有则删，无则加
div.classList.contains("open"); // 检查是否存在
```

#### 2.3 修改属性

- **`element.getAttribute(attr)`**: 获取属性值。
- **`element.setAttribute(attr, value)`**: 设置属性值。
- **`element.removeAttribute(attr)`**: 移除属性。

```javascript
const link = document.querySelector("a");
link.setAttribute("href", "https://www.example.com");
link.setAttribute("target", "_blank");
link.getAttribute("target"); // 返回 "_blank"
```

---

### 3. 节点增删改 (DOM 结构操作)

动态改变页面结构是 DOM 操作最强大的地方。

#### 3.1 创建节点

- **`document.createElement(tagName)`**: 创建元素节点。
- **`document.createTextNode(text)`**: 创建文本节点（较少用）。
- **`document.createDocumentFragment()`**: 创建文档片段（用于性能优化，见下文）。

```javascript
const newLi = document.createElement("li");
newLi.textContent = "我是新列表项";
```

#### 3.2 插入节点

- **`parentNode.appendChild(child)`**: 将子节点添加到父节点的**末尾**。
- **`parentNode.insertBefore(newNode, referenceNode)`**: 将新节点插入到参考节点之前。
- **`element.prepend()`**: 插入到父节点的**开头**。
- **`element.after()` / `element.before()`**: 插入到元素的后面/前面。

```javascript
const ul = document.querySelector("ul");
ul.appendChild(newLi); // 添加到列表末尾

// 插入到第一个元素之前
const firstItem = ul.querySelector("li");
ul.insertBefore(newLi, firstItem);
```

#### 3.3 删除节点

- **`parentNode.removeChild(child)`**: 传统方法。
- **`element.remove()`**: 现代方法，直接删除自身。

```javascript
ul.removeChild(newLi);
// 或者
newLi.remove();
```

#### 3.4 替换与克隆

- **`parentNode.replaceChild(newChild, oldChild)`**: 替换节点。
- **`element.cloneNode(true)`**: 克隆节点。参数为 `true` 时深拷贝（克隆后代节点），`false` 时浅拷贝。

---

### 4. DOM 遍历 (节点关系)

通过相对位置查找节点。

- **`parentNode`**: 父节点。
- **`children`**: 所有子元素（不包括文本节点和注释）。
- **`firstElementChild` / `lastElementChild`**: 第一个/最后一个子元素。
- **`previousElementSibling` / `nextElementSibling`**: 上一个/下一个兄弟元素。
- **`closest(selector)`**: 从当前元素开始，沿 DOM 树向上查找匹配选择器的**最近祖先**（包括自身）。

> 注意：避免使用 `firstChild` 或 `nextSibling`，因为它们可能获取到空白文本节点。请使用带有 `Element` 关键字的属性。

```javascript
const item = document.querySelector(".item");
const parentUl = item.closest("ul"); // 找到最近的 ul 祖先
```

---

### 5. 事件处理

让页面对用户操作做出反应。

#### 5.1 添加事件监听

- **`addEventListener(event, handler, options)`**: 最推荐的方式。
  - **event**: 事件名（如 `'click'`, 不加 `on`）。
  - **handler**: 回调函数。
  - **options**: 可选配置，如 `{ once: true }` (只触发一次) 或 `{ passive: true }` (优化滚动性能)。

```javascript
btn.addEventListener("click", function (event) {
  console.log("按钮被点击了");
  // event.target 触发事件的元素
});
```

#### 5.2 事件冒泡与捕获

- **捕获阶段**：事件沿传播路径从外层祖先向目标元素传递，可通过 `{ capture: true }` 注册捕获阶段监听器。
- **冒泡阶段**：只有 `bubbles` 为 `true` 的事件才会从目标元素沿传播路径向祖先传递；并非所有事件都会冒泡或到达 `window`。

#### 5.3 事件委托

**非常重要**。利用事件冒泡机制，将事件监听器加在父元素上，而不是每个子元素上。事件委托可以减少监听器数量，并自动覆盖后来添加的后代元素；是否带来明显性能收益取决于具体场景。

```javascript
// 场景：给 ul 里的 10000 个 li 绑定点击事件
// ❌ 错误做法：循环给每个 li 绑定，性能极差
// li.forEach(item => item.addEventListener(...))

// ✅ 正确做法：只给 ul 绑定
ul.addEventListener("click", (e) => {
  const li = e.target.closest("li");
  if (li && ul.contains(li)) {
    console.log("你点击了:", li.textContent);
  }
});
```

---

### 6. 性能优化

DOM 读写可能触发样式重新计算、布局、绘制或合成，但并非每次 DOM 操作都会同时导致重排和重绘。应重点减少不必要的重复读写，并通过性能工具确认实际瓶颈。

1.  **减少 DOM 操作次数**: 尽量合并多次修改。
    - **批量修改样式**: 不要频繁修改 `style.color`，而是修改 `className` 或直接操作 `style.cssText`。
2.  **使用 DocumentFragment (文档片段)**:
    `DocumentFragment` 不属于当前活动文档树，可以先在其中组织节点，再一次性将其子节点移动到目标元素中。这种写法有助于组织批量插入代码，但性能收益和实际布局次数不能一概而论。
    ```javascript
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 1000; i++) {
      const li = document.createElement("li");
      li.textContent = `Item ${i}`;
      fragment.appendChild(li); // fragment 尚未连接到活动文档树
    }
    ul.appendChild(fragment); // 将 fragment 的子节点移动到 ul，fragment 随后变为空
    ```
3.  **避免 `layout thrashing` (布局抖动)**:
    不要交替读写 DOM。
    - _Bad_: 读 offsetHeight -> 写 style.height -> 读 offsetHeight...
    - _Good_: 读 offsetHeight -> 读 offsetWidth -> 写 style.height...

### 操作表单

```javascript
// 对于 checkbox 和 radio，value 表示提交值，checked 表示当前是否选中
const checkbox = document.querySelector('input[type="checkbox"]');
checkbox.value; // 获取提交值；未设置 value 时默认值通常为 "on"
checkbox.checked; // 获取当前选中状态，返回布尔值

// 2. 提交表单
```

> 表单提交与传输安全部分待补充。

## 模块化

**模块化** 简单来说，就是**把一个大型的 JavaScript 文件拆分成很多个小的、独立的文件，然后再把它们组合起来**。

这就好比搭乐高积木：

- **没有模块化**：你把所有积木熔化成一大坨塑料（所有代码写在一个几万行的 `main.js` 里），想找一个功能的代码都要翻半天，而且变量名极容易冲突。
- **有模块化**：你有车轮模块、底盘模块、引擎模块。它们各司其职，需要用到轮子的时候，直接“引入”轮子模块即可。

目前前端最常用的是 **ES6 Modules** 标准。

---

### 1. 核心概念：导出 与 导入

想象一下：

- 文件 A 是一家**面包店**，它负责生产面包（提供功能）。
- 文件 B 是**顾客**，它需要吃面包（使用功能）。

#### 场景一：我只想导出一个东西

如果一个文件只提供一个核心功能（比如一个工具函数，或者一个类），使用**默认导出**。

**文件：`utils.js` (面包店)**

```javascript
const calculateTax = (amount) => {
  return amount * 0.1;
};

// 默认导出：一个文件只能有一个 default
export default calculateTax;
```

**文件：`main.js` (顾客)**

```javascript
// 导入的时候，名字可以随便起，因为它知道你导入的是那个唯一的 default
import myTaxFunction from "./utils.js";

console.log(myTaxFunction(100)); // 10
```

#### 场景二：我想导出很多个东西

如果一个文件提供了很多工具函数，使用**命名导出**。

**文件：`mathUtils.js`**

```javascript
// 直接在变量声明前加 export
export const add = (a, b) => a + b;
export const subtract = (a, b) => a - b;

// 或者也可以集中导出：
// const multiply = (a, b) => a * b;
// export { multiply };
```

**文件：`main.js`**

```javascript
// 命名导入默认使用导出名；如需不同的本地名称，可以使用 as 指定别名
import { add, subtract } from "./mathUtils.js";

console.log(add(1, 2));
```

#### 场景三：混合导入 (最常见)

如果你觉得每次写 `{ add, subtract }` 很烦，你可以给所有导出的东西起一个别名。

```javascript
// * 代表所有，as allMath 是别名
import * as allMath from "./mathUtils.js";

console.log(allMath.add(1, 2));
console.log(allMath.subtract(5, 3));
```

---

### 2. 为什么要模块化？

1.  **作用域隔离**：
    - 每个模块都有自己独立的作用域。
    - 模块 A 里的 `let name = "张三"` 不会影响模块 B 里的 `let name = "李四"`。不用担心全局变量污染了！

2.  **代码复用**：
    - 写好一个通用的 `formatDate.js`，你的博客项目可以用，你的商城项目也可以用。直接 `import` 进来就行。

3.  **依赖管理**：
    - 代码之间的关系变得清晰。看文件头部的 `import` 你就知道这个文件依赖谁，维护起来极其方便。

---

### 3. 历史

在 ES6 (`import/export`) 统一江湖之前，JavaScript 还有两套古老的模块化方案，你在维护**老项目**（比如 2015 年前的代码）或者学习 Node.js 时可能会遇到：

- **CommonJS** (Node.js 环境):
  - 使用 `require()` 导入。
  - 使用 `module.exports` 导出。
  - _注：Node.js 同时支持 CommonJS 和 ECMAScript Modules，并提供两者之间的互操作机制。_
- **AMD / CMD** (RequireJS 时代):
  - 这是更古老的前端浏览器方案，现在基本很少见了。

---

### 4. 注意事项

1.  **必须在 HTML 中声明 `type="module"`**
    如果你在浏览器直接引入 JS 文件，必须这样写：

    ```html
    <script type="module" src="main.js"></script>
    ```

    - 如果把含有静态 `import` 声明的文件当作经典脚本加载，浏览器会抛出语法错误，例如 “Cannot use import statement outside a module”。
    - 模块脚本会自动采用**严格模式**，并默认延后到文档解析完成后执行；`defer` 属性对模块脚本没有额外作用。

2.  **浏览器兼容性**
    现代浏览器普遍支持 ES Modules。若需要兼容不支持模块或现代语法的旧浏览器，通常需要使用打包工具处理模块依赖，并结合 Babel 等转译工具及必要的 polyfill 生成目标环境可运行的代码。

## 防抖与节流

1. 防抖（debounce）  
防抖会在函数被调用后等待一段时间；如果等待期间再次调用，就重新计时。以默认的尾缘执行方式为例，只有连续调用停止并经过等待时间后，目标函数才会执行。

- Lodash 提供 `_.debounce(func, wait, options)` 创建防抖函数，`wait` 的单位是毫秒。

```javascript
box.addEventListener("mousemove", _.debounce(mousemove, 500));
```

2. 节流（throttle）  
节流会限制目标函数在连续调用期间的执行频率，使其在指定等待时间内最多按配置执行一次；Lodash 还可以配置是否在等待区间的开始或结束执行。

- Lodash 提供 `_.throttle(func, wait, options)` 创建节流函数，`wait` 的单位是毫秒。

```javascript
box.addEventListener("mousemove", _.throttle(mousemove, 500));
```

## 现代 JavaScript 语法总结

### 1. 变量声明：`let` 和 `const`

在 ES2015 之前，变量通常使用 `var` 声明。`var` 在函数内部具有函数作用域，在脚本顶层则属于全局作用域；它不受普通块级作用域限制。ES2015 引入了 `let` 和 `const`，用于创建块级作用域绑定。

- **`const`**：声明不可重新赋值的绑定，通常应优先使用；如果绑定的是对象或数组，其内部属性或元素仍然可以修改。
- **`let`**: 变量。可以被重新赋值。

```javascript
// 旧写法
var name = "XiaoMing";

// 新写法
let age = 18;
const birthYear = 2005;

age = 19; // 正确
// birthYear = 2006; // 报错！无法给常量重新赋值
```

### 2. 箭头函数

箭头函数提供了更简洁的函数表达式语法。它没有自己的 `this`，而是从外层词法环境中取得 `this`；这适合部分回调场景，但不能概括为自动解决所有 `this` 问题。箭头函数不适合用作需要动态 `this` 的对象方法，也不能作为构造函数使用。

```javascript
// 传统函数
function addTraditional(a, b) {
  return a + b;
}

// 箭头函数
const addArrow = (a, b) => a + b;

// 如果只有一个形式参数且它是简单标识符，括号可以省略
const double = n => n * 2;

// 箭头函数可以直接返回一个对象
const createUser = (uname) => ({ uname });
console.log(createUser("刘德华"));

// this 指向示例
function showStrictThis() {
  "use strict";
  console.log(this);
}

showStrictThis(); // undefined

const personWithMethod = {
  name: "andy",
  sayHi() {
    console.log(this); // personWithMethod
  },
};

personWithMethod.sayHi();

const arrowCallbackDemo = {
  uname: "pink老师",
  sayHi() {
    const count = () => {
      console.log(this); // arrowCallbackDemo
    };

    count();
  },
};

arrowCallbackDemo.sayHi();
```

### 3. 模板字符串

使用反引号 `` ` `` 代替引号。可以直接换行，并使用 `${}` 插入变量或表达式。告别繁琐的 `+` 号拼接。

```javascript
const user = "李华";
const greeting = `你好，${user}！`; // 插入变量

const result = `1 + 1 等于 ${1 + 1}`; // 插入表达式
```

### 4. 解构赋值

一种快速从数组或对象中提取值并赋给变量的语法。

**对象解构：**

```javascript
const person = { name: "Bob", age: 20, city: "Beijing" };

// 只提取 name 和 age
const { name, age } = person;

console.log(name); // "Bob"
```

**数组解构：**

```javascript
const numbers = [1, 2, 3];

const [first, second] = numbers;

console.log(second); // 2
```

### 5. 展开语法与剩余语法（`...`）

`...` 根据所处的语法位置表示展开语法或剩余语法。

**展开语法：** 在函数实参列表或数组字面量中，可以将可迭代对象展开为多个实参或数组元素；在对象字面量中，则会把源值的自有可枚举属性复制到新对象。

```javascript
const arr1 = [1, 2];
const arr2 = [...arr1, 3, 4]; // 结果: [1, 2, 3, 4]

// 合并对象
const obj = { a: 1 };
const newObj = { ...obj, b: 2 }; // { a: 1, b: 2 }
```

**剩余语法：** 在函数形参中，它会把尚未匹配的实参收集到数组中；在解构中，它可以把剩余数组元素收集到数组，或把剩余对象属性收集到对象。

```javascript
function sumAll(...numbers) {
  return numbers.reduce((total, num) => total + num, 0);
}

sumAll(1, 2, 3, 4); // 这里 numbers 变成了 [1, 2, 3, 4]
```

### 6. 数组的高阶方法

虽然这些方法在 ES6 之前就存在，但在 ES6 时代配合箭头函数使用最为广泛。

- **`map`**: 映射，把数组里的每一项经过处理生成一个新数组。
- **`filter`**: 过滤，筛选出符合条件的项。
- **`reduce`**: 汇总，将数组计算为一个值。

```javascript
const nums = [1, 2, 3, 4, 5];

// 所有数字乘以 2
const doubled = nums.map((n) => n * 2); // [2, 4, 6, 8, 10]

// 筛选出偶数
const evens = nums.filter((n) => n % 2 === 0); // [2, 4]
```

### 7. 默认参数

默认参数会在调用时没有传入对应实参，或显式传入 `undefined` 时生效。它与 `a = a || 1` 不完全相同：`0`、空字符串和 `false` 等假值不会触发默认参数，却会被 `||` 替换。

```javascript
function multiply(a, b = 1) {
  return a * b;
}

multiply(5); // 返回 5 (使用了默认的 b=1)
multiply(5, 2); // 返回 10
```

### 8. 模块化

这是现代前端开发的基础。允许将代码拆分成多个文件。

**导出:**

```javascript
// utils.js
export const PI = 3.14;
export function add(a, b) {
  return a + b;
}
```

**导入:**

```javascript
// main.js
import { PI, add } from "./utils.js";
```

### 9. 类

ES6 引入了 `class` 关键字，让面向对象编程的写法更像 Java 或 C++（虽然底层依然是基于原型的）。

```javascript
class Animal {
  constructor(name) {
    this.name = name;
  }

  speak() {
    console.log(`${this.name} 发出了叫声`);
  }
}

const dog = new Animal("旺财");
dog.speak(); // "旺财 发出了叫声"
```

### 10. Promise

Promise 表示异步操作最终完成或失败的结果，并支持链式处理、错误传递和多个异步操作的组合。它可以减少多层嵌套回调，但并不会消除回调，也不能自动避免所有异步流程嵌套问题。

```javascript
const fetchData = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve("数据获取成功！");
    }, 1000);
  });
};

fetchData().then((data) => {
  console.log(data); // 延迟时间到达并轮到该任务执行后打印，通常不会早于约 1 秒
});
```

### 补充：对象属性简写

如果你的对象属性名和变量名一样，你可以简写：

```javascript
const a = 1;
const b = 2;

// 旧写法: { a: a, b: b }
// 新写法:
const obj = { a, b }; // { a: 1, b: 2 }
```
