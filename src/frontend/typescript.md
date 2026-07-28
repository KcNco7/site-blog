# Typescript

上手即用：

```shell
npm init -y
npm install --save-dev typescript
npx tsc --init
```

`npx tsc --init` 创建的是 `tsconfig.json`，不是 TypeScript 源文件。配置完成后，再创建例如 `src/index.ts` 的源文件。

## 1. 数据类型

### 基础类型

TypeScript 保留 JavaScript 的运行时值和类型，并在此基础上增加编译阶段的类型标注与检查。大多数 TypeScript 类型会在编译后被擦除，不会成为 JavaScript 运行时对象。

### 任意类型

- `any` 和 `unknown` 都能接收任意类型的值。
- `any` 会绕过大部分类型检查，继续访问属性、调用方法时通常也不会受到约束。
- `unknown` 在使用前必须通过类型守卫、断言等方式缩小范围，因此比 `any` 更安全。

TypeScript 类型之间不存在一条适用于所有情况的线性“大小顺序”。理解类型关系时，可以关注这些特殊类型：

- `unknown` 常被称为安全的顶层类型：其他类型的值都可以赋给它；在 `strict` 模式下，未经缩小的 `unknown` 通常只能赋给 `unknown` 或 `any`。
- `never` 表示不会出现的值，常被称为底层类型；它可以赋给其他类型，但其他类型通常不能赋给 `never`。
- `Object`、`Number`、`String`、`Boolean` 是包装对象相关类型，业务代码通常应使用小写的 `object`、`number`、`string`、`boolean`。

未经缩小的 `unknown` 不能直接读取属性或调用方法。完成 `typeof`、`instanceof` 等检查后，才能按具体类型使用。

## 2. Object、object、{}

`Object` 是全局包装对象接口，描述 JavaScript 值通过装箱后可用的通用成员。在启用 `strictNullChecks` 时，除 `null` 和 `undefined` 外的大多数值都可以赋给它；业务类型通常不建议用它表示“任意对象”。

`object` 表示非原始值，包括普通对象、数组和函数；它不接受 `string`、`number`、`boolean`、`bigint`、`symbol`、`null` 和 `undefined` 等原始值。
例如：  
123 '123' true ❌️  
{} [] `() => 123` ✅️

`{}` 通常表示任意非 `null`、非 `undefined` 的值，并不等同于 `new Object()`。需要表达键值对象时可以使用 `Record<string, unknown>`，需要表达未知值时使用 `unknown`。

## 3. 接口(interface)和对象类型

1. 遇到重名的interface，会进行合并
2. 索引签名：`interface Person { [property: string]: unknown }`
3. `?`和`readonly`：可选属性和只读
4. 接口继承
5. 用interface定义函数类型
6. 和自定义类型 `type` 的区别 [type](#_12-类型推断和类型别名)

```typescript
interface Person extends B {
  name: string;
  age?: number; // 可选属性
  readonly id: number; // 只读属性
  readonly test: () => boolean; // 只读函数属性
  [property: string]: unknown; // 额外属性需要先缩小类型再使用
}

interface B {
  xxx: string;
}

let person: Person = {
  id: 1,
  name: '张三',
  age: 18,
  test: () => true,
  xxx: 'xxx',
}
```

索引签名使用 `unknown` 可以接收不同类型的额外属性，同时避免像 `any` 一样跳过检查；读取额外属性后，需要先缩小类型。

```typescript
interface NameToNumbers {
  (name: string): number[];
}

const fn: NameToNumbers = function (name: string) {
  return [1, 2, 3];
};
```

## 4. 数组类型

1. 定义数组的方式(2种)
2. 定义二维数组(2种)
3. 多种值类型的数组
4. 数组在函数中的用法（定义伪数组）

```typescript
// 定义数组的方式(2种)
let numbers1: number[] = [1, 2, 3];
let numbers2: Array<number> = [1, 2, 3];

// 定义对象数组
interface A {
  name: string;
  age?: number;
}

let people: A[] = [{ name: "张三" }, { name: "111" }];

// 定义二维数组(2种)
let matrix1: number[][] = [
  [1, 2, 3],
  [4, 5, 6],
];
let matrix2: Array<Array<number>> = [
  [1, 2, 3],
  [4, 5, 6],
];

// 多种类型的数组
let mixedValues: Array<number | string | boolean | Record<string, unknown>> = [1, "2", true, {}];
let pair: [number, string] = [1, "2"]; // 元组：长度和每个位置的类型固定
let stringOrNumberValues: (string | number)[] = [1, "2", 3]; // 联合类型数组：长度不固定

// 数组在函数中的用法
function logNumbers(...args: number[]) {
  console.log(args);
  const arrayLike: IArguments = arguments; // arguments 是类数组对象
}
logNumbers(1, 2, 3);
```

## 5. 函数类型

1. 定义函数参数和返回值
2. 函数的默认值和可选参数
3. 如何定义参数类型是对象的函数
4. TypeScript 可以用参数列表首位的虚拟 `this` 参数声明函数体内的 `this` 类型；它只参与类型检查，编译后不会成为实际参数
5. 函数重载

```typescript
// 1. 定义函数参数和返回值
function addNumbers(a: number, b: number): number {
  return a + b
}
console.log(addNumbers(1, 2))

const addNumbersArrow = (a: number, b: number): number => a + b
console.log(addNumbersArrow(1, 2))

// 2. 函数的默认值和可选参数
function addWithDefault(a: number = 10, b: number = 0): number {
  return a + b
}
```

同一个参数不能同时写成可选参数并提供默认值，但同一个函数可以包含不同的默认参数和可选参数。可选参数通常放在必选参数之后；默认参数如果出现在必选参数之前，调用时需要显式传入 `undefined` 才能使用默认值。

```typescript
// 3. 如何定义参数类型是对象的函数
interface UserInfo {
    name: string;
    age: number;
}

function xx(user: UserInfo): UserInfo {
    return user
}
// 4. this
interface NumberList {
    user: number[];
    add(this: NumberList, num: number): void;
}

let numberList: NumberList = {
    user: [1,2,3],
    add(this: NumberList, num: number) {
        this.user.push(num)
    }
}
numberList.add(4)

// 5. 函数重载
let user: number[] = [1,2,3]

function findNum(ids: number[]): number[]; // 如果传入的是number数组，就是添加
function findNum(id: number): number[]; // 如果传入了id，就是单个查询
function findNum(): number[]; // 如果没有id，就是查询全部
function findNum(ids?: number | number[]): number[] {
    if (typeof ids === 'number') {
        return user.filter(item => item === ids)
    } else if(Array.isArray(ids)) {
        user.push(...ids)
        return user
    } else {
        return user
    }
}
```

## 6. 类型断言 联合类型 交叉类型

- 联合类型：是 "或" 的关系（要么是 A，要么是 B）。
- 交叉类型：是 "且" 的关系（既是 A，又是 B）。
- 类型断言：“我比你更清楚这个值的类型，请按这个类型来检查。”

类型断言只影响编译阶段的类型检查，不会转换数据，也不会执行运行时验证。外部输入仍需要类型守卫、校验函数或校验库确认其真实结构。

```typescript
// 联合类型
let value: number | string = '1' // 联合类型

function toBoolean(value: number | boolean): boolean {
    return Boolean(value)
}

// 示例2
// 基础示例
let status: string | number;

status = "200"; // ✅ 合法
status = 200;   // ✅ 合法
// status = true; // ❌ 错误

// 对象联合示例
interface Bird {
  fly(): void;
  layEggs(): void;
}

interface Fish {
  swim(): void;
  layEggs(): void;
}

type Pet = Bird | Fish;

function getSmallPet(pet: Pet) {
  pet.layEggs(); // ✅ 可以，因为 Bird 和 Fish 都有 layEggs 方法
  // pet.fly(); // ❌ 错误：Fish 没有 fly 方法，TS 无法确定当前是 Bird 还是 Fish
}

// 交叉类型
interface People {
    name: string;
    age: number;
}

interface Man {
    sex: number;
}


const printPerson = (person: People & Man): void => {
    console.log(person.name, person.age, person.sex)
}

printPerson({
    name: '张三',
    age: 18,
    sex: 1,
    })

// 类型缩小
function printLength(value: number | string): void {
    if (typeof value === 'string') {
        console.log(value.length)
    }
}
printLength('1231231231312')

interface A {
    run: string;
}
interface B {
    buy: string;
}

function printProperty(value: A | B): void {
    if ('run' in value) {
        console.log(value.run)
    } else {
        console.log(value.buy)
    }
}

printProperty({
    buy: '123123123123'
})
```

## 7. 内置对象

```typescript
// 1.ECMAScript
const boxedNumber: Number = new Number(1);
const date: Date = new Date();
const reg: RegExp = new RegExp("123");
const error: Error = new Error("123");

// 2. DOM
const divElement = document.getElementById("div");
if (!(divElement instanceof HTMLDivElement)) {
  throw new Error("没有找到 id 为 div 的 HTMLDivElement");
}
const footerNodes: NodeListOf<HTMLElement> =
  document.querySelectorAll("footer");
const nestedFooters: NodeListOf<HTMLElement> =
  document.querySelectorAll<HTMLElement>("div footer");

// 3. BOM
const storage: Storage = localStorage;
const currentLocation: Location = window.location;
const promise: Promise<string> = new Promise((resolve) => {
  resolve("完成");
});
const cookie: string = document.cookie;
```

`Number` 是包装对象类型，上面的 `boxedNumber` 仅用于展示内置对象。普通数值应使用小写 `number`，通常不应通过 `new Number()` 创建包装对象。

代码雨：

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        overflow: hidden;
      }
    </style>
  </head>
  <body>
    <canvas id="canvas"></canvas>
    <script src="/src/main.ts" type="module"></script>
  </body>
</html>
```

下面的 HTML 假设由 Vite 等构建工具处理 `/src/main.ts`。如果直接使用 `tsc` 编译并由浏览器打开页面，应改为引用编译生成的 JavaScript 文件。

```typescript
const canvas = document.querySelector<HTMLCanvasElement>("#canvas");
if (!canvas) {
  throw new Error("没有找到 Canvas 元素");
}
const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("当前环境不支持 Canvas 2D 上下文");
}
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let str: string[] = "Hello World".split("");
const drops: number[] = Array<number>(Math.ceil(canvas.width / 10)).fill(0);
console.log(drops);

const rain = () => {
  ctx.fillStyle = "rgba(0,0,0,0.05)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0f0";
  drops.forEach((item, index) => {
    ctx.fillText(
      str[Math.floor(Math.random() * str.length)] as string,
      index * 10,
      item + 10,
    );
    drops[index] =
      item > canvas.height || item > 10000 * Math.random() ? 0 : item + 10;
  });
};

setInterval(rain, 50);
```

## 8. 类

1. class基本用法 继承 约束类型
2. 类成员修饰符 `readonly`、`private`、`protected`、`public`
   - `readonly`：只能在声明处或构造器中初始化，之后不能通过该属性重新赋值
   - `private`：仅允许在声明它的类内部访问
   - `protected`：允许在声明它的类及其派生类内部访问
   - `public`：可以从任意位置访问，也是默认可见性
3. `super()`调用基类构造器；派生类构造器必须先调用它，才能访问`this`
4. 静态方法
5. get set

TypeScript 的 `private` 和 `protected` 主要由类型检查器约束。需要运行时硬私有成员时，可以使用 ECMAScript 的 `#privateField`。

```typescript
// 1. class基本用法 继承 约束类型
interface Options {
    el: string | HTMLElement;
}

interface VueCls {
    options: Options;
    init(): void;
}

// 简化的 VNode 数据结构
interface Vnode {
    tag: string; // 标签名
    text?: string; // 文本
    children?: Vnode[];
}

class Dom {
    // 创建节点方法
    createElement(el: string): HTMLElement {
        return document.createElement(el);
    }
    // 创建文本方法
    setText(el: HTMLElement, text?: string) {
        el.textContent = text ?? '';
    }
    // 渲染
    render(data: Vnode) {
        let root = this.createElement(data.tag);
        if(data.children && Array.isArray(data.children)) {
            data.children.forEach(item => {
                let child = this.render(item);
                root.appendChild(child);
            })
        } else {
            this.setText(root, data.text);
        }

        return root;
    }

}

class Vue extends Dom implements VueCls { // 对类进行约束
    options: Options;
    constructor(options: Options) {
        super(); // 调用基类构造器
        this.options = options;
        this.init();
    }
    init(): void {
        // 根据 VNode 递归创建真实 DOM；此示例不包含 diff 和 patch
        const data: Vnode = {
            tag: 'div',
            children: [
                {
                    tag: 'section',
                    text: '子节点1'
                },
                {
                    tag: 'section',
                    text: '子节点1'
                }
            ]
        };
        const root = this.render(data);
        const app = typeof this.options.el === 'string'
            ? document.querySelector<HTMLElement>(this.options.el)
            : this.options.el;
        if (!app) {
            throw new Error(`没有找到挂载元素：${this.options.el}`);
        }
        app.appendChild(root);
    }
}

const vue = new Vue({
    el: '#app',
})

// 2. class修饰符 readonly private protected public
// 3. 静态方法和静态 getter
class StaticExample {
    static xxx(): void {
        console.log('static method');
    }

    static get vis(): string {
        this.xxx();
        return '1111';
    }
}

// 4. super()调用基类构造器
// 5. get set

class Ref<T> {
    private _value: T;
    constructor(value: T) {
        this._value = value;
    }

    get value(): T {
        return this._value;
    }

    set value(newValue: T) {
        this._value = newValue;
    }
}

const ref = new Ref('123');
ref.value = '456';
console.log(ref.value); // '456'

```

## 9. 抽象类 基类

抽象类具有这些特点：

- 抽象类不能被直接实例化。
- 抽象类可以包含已经实现的成员，也可以声明抽象成员。
- 非抽象派生类必须实现继承到的抽象成员，之后才能被实例化。

```typescript
// 定义抽象类
// 抽象类不允许被实例化
abstract class Animal {
    name: string;
    constructor(name = '') {
        this.name = name;
    }

    getName(): string { // 已经提供实现的具体方法
        return this.name;
     }

    abstract init(name: string): void; // 只能描述
}

class Dog extends Animal {
    constructor() {
        super();
    }
    init(name: string) {
        this.name = name;
    }
 }

const dog = new Dog();
dog.init('Dog');
```

## 10. 元组

```typescript
let arr: [string, number] = ['123', 123];

const arr1: readonly [string, number] = ['123', 123];

const arr2: readonly [x: string, y?: boolean] = ['123'];

type First = typeof arr2[0];
type TupleLength = typeof arr2['length'];
```

`const` 只禁止变量重新指向另一份数据，`readonly` 元组才禁止通过索引修改元素。上例中的 `First` 是 `string`，因为第二个元素可选，所以 `TupleLength` 是 `1 | 2`。

## 11. 枚举

- 数字枚举
- 字符串枚举
- 在接口中使用枚举成员类型
- `const enum`
- 数字枚举的反向映射

```typescript
// 1. 数字枚举
enum NumericColor {
    Red, // 默认从0开始
    Blue,
    Yellow
}

enum CustomNumericColor {
    Red = 1,
    Blue, // 2
    Yellow // 3
}

// 2. 字符串枚举
enum StringColor {
    Red = 'red',
    Blue = 'blue',
    Yellow = 'yellow'
}

// 3. 在接口中使用具体的枚举成员类型
interface ColorSelection {
    selected: CustomNumericColor.Red;
}

const selection: ColorSelection = {
    selected: CustomNumericColor.Red
}

// 4. const 枚举
const enum Direction {
    Up = 1,
    Down = 2,
}

// 5. 数字枚举的反向映射(value -> key)
enum ResultType {
    Success
}
let success: number = ResultType.Success;
console.log(success); // 0
let key = ResultType[success];
console.log(key); // Success
```

“在接口中使用枚举成员类型”不是一种新的枚举类别。`selected: CustomNumericColor.Red` 表示该属性只能接受这个具体成员。

`const enum` 的成员通常会在使用位置被内联，不生成可供运行时读取的枚举对象。`preserveConstEnums` 会改变发射行为；发布声明文件或使用 `isolatedModules` 时，还需要考虑环境枚举的兼容问题。

只有生成运行时对象的数字枚举成员具有从值到名称的反向映射；字符串枚举不生成这种映射。

## 12. 类型推断和类型别名

> type 和 interface 区别

- `type` 和 `interface` 都可以描述对象结构。
- `interface` 支持声明合并，也可以通过 `extends` 继承其他对象类型。
- `type` 还可以直接为联合类型、元组和原始类型等任意类型创建别名。

TypeScript 会根据初始化值、函数返回值和上下文推断类型；当推断结果不够准确或需要公开类型契约时，仍应显式标注。

```typescript
type StringOrNumber = string | number;
const sample: StringOrNumber = '123';

interface NamedEntity {
    id: number;
}

interface User extends NamedEntity {
    name: string | number;
}

// 检查字面量类型 1 是否可赋给 number
type IsNumberLiteral = 1 extends number ? 1 : 0;
```

TypeScript 类型不存在一条适用于所有情况的线性“从上到下”顺序。类型之间应根据可赋值性、联合、交叉和类型缩小等具体规则判断。

## 13. never

never类型表示的是那些永不存在的值的类型。

```typescript
// 同一个值不可能同时是 string 和 number，因此结果是 never
type Impossible = string & number;

// 抛出异常
function aaa(): never {
  throw new Error("111");
}

// 无限循环
function bbb(): never {
  while (true) {
    console.log("111");
  }
}

// 编译期穷尽性检查，并提供运行时错误
function assertNever(value: never): never {
  throw new Error(`未处理的值：${String(value)}`);
}

type A = "唱" | "跳" | "rap" | "篮球";
function kun(value: A): void {
  switch (value) {
    case "唱":
      console.log("111");
      break;
    case "跳":
      console.log("222");
      break;
    case "rap":
      console.log("333");
      break;
    case "篮球":
      console.log("444");
      break;
    default:
      return assertNever(value);
  }
}
```

## 14. symbol类型

1. 基本使用
2. 使用 symbol 作为对象属性键
3. 读取对象的 symbol 键

```typescript
// 基本使用
const a1: symbol = Symbol(1); // 每次调用都会创建新的 symbol
const a2: symbol = Symbol(1);
console.log(a1, a2); // Symbol(1) Symbol(1)
console.log(a1 === a2); // false
console.log(a1 == a2); // false

// Symbol.for 会从全局 Symbol 注册表查找或创建给定 key 对应的 symbol
console.log(Symbol.for("1111") === Symbol.for("1111")); // true

// 使用 symbol 作为计算属性键
const obj = {
  name: 1,
  [a1]: 2,
  [a2]: 3,
};

// for...in 枚举可枚举的字符串键，也可能包含原型链上的键，不包含 symbol 键
for (const key in obj) {
  console.log(key);
}

// Object.keys 返回自身、可枚举的字符串键，不包含 symbol 键
console.log(Object.keys(obj));

// Object.getOwnPropertyNames 返回自身的全部字符串键，不包含 symbol 键
console.log(Object.getOwnPropertyNames(obj));

// Object.getOwnPropertySymbols 返回自身的全部 symbol 键
console.log(Object.getOwnPropertySymbols(obj));

// Reflect.ownKeys 返回自身的全部字符串键和 symbol 键，包括不可枚举键
console.log(Reflect.ownKeys(obj)); // [ 'name', Symbol(1), Symbol(2) ]
```

`[a1]`、`[a2]` 是对象字面量中的计算属性，不是 TypeScript 索引签名。普通 `Symbol(description)` 每次创建不同值；`Symbol.for(key)` 才会通过全局 Symbol 注册表复用同一个键对应的 symbol。

## 15. 迭代器 生成器

1. 生成器函数与生成器对象
2. 可迭代协议与迭代器协议
3. Set 和 Map
   - Set：使用 SameValueZero 比较值；对象是否重复取决于是否为同一引用
   - Map：普通对象的属性键是字符串或 symbol，Map 的键可以是任意值
4. `arguments` 与 NodeList
5. `for...of`
6. 数组解构和展开语法如何消费可迭代对象
7. 让普通对象实现可迭代协议

生成器函数是创建迭代器的一种便捷方式，但生成器和迭代器不是同一个概念。同步生成器 `yield` 一个 Promise 时只会产出该 Promise，不会等待其完成；需要等待异步值时，应使用异步生成器与 `for await...of`。

只有实现可迭代协议的值才能通过 `[Symbol.iterator]()` 获取迭代器。Set 的对象值按引用判断是否重复；Map 使用对象、数组等引用值作为键时，也按引用身份匹配。

```typescript
// 1. 生成器函数与生成器对象
function* createSequence() {
    yield Promise.resolve(1); // 产出 Promise，不会在同步生成器中等待它
    yield '111'
    yield '222'
    yield '333'
}

const sequenceIterator = createSequence(); // 返回生成器对象，它同时是迭代器
console.log(sequenceIterator.next()); // { value: Promise<number>, done: false }
console.log(sequenceIterator.next()); // { value: '111', done: false }
console.log(sequenceIterator.next()); // { value: '222', done: false }
console.log(sequenceIterator.next()); // { value: '333', done: false }
console.log(sequenceIterator.next()); // { value: undefined, done: true }

// 2. 只接收实现了可迭代协议的值
function each<T>(value: Iterable<T>): void {
    const iterator = value[Symbol.iterator]();
    let next = iterator.next();
    while(!next.done) {
        console.log(next.value);
        next = iterator.next();
    }
}

// 3. Set 和 Map
const set: Set<number> = new Set([1, 2, 3, 4, 5]);

const map: Map<number[], string> = new Map();
const arrayKey = [1, 2, 3, 4, 5];
map.set(arrayKey, '111');
console.log(map.get(arrayKey)); // '111'
console.log(map.get([1, 2, 3, 4, 5])); // undefined，不是同一个数组引用

// 4. arguments 与 NodeList
function args() {
    console.log(arguments); // 类数组对象
}

const list = document.querySelectorAll('div'); // DOM 集合

// 5. for...of
for (let value of set) {
    console.log(value);
}

// 6. 数组解构和展开语法会消费可迭代对象
const [first, second, third] = [1, 2, 3];
console.log(first, second, third);

const values = [4, 5, 6];
const copy = [...values];
console.log(copy); // [4, 5, 6]

// 7. 让普通对象实现可迭代协议
const iterable: Iterable<number> = {
  [Symbol.iterator](): Iterator<number> {
    let current = 0;
    const max = 10;

    return {
      next(): IteratorResult<number> {
        if (current >= max) {
          return {
            value: undefined,
            done: true,
          };
        }

        return {
          value: current++,
          done: false,
        };
      },
    };
  },
};

for (const value of iterable) {
  console.log(value);
}

```

## 16. 泛型

泛型属于 TypeScript 的静态类型系统。类型参数可以把输入、输出或数据结构中的多个位置关联起来：同一个 `T` 表示这些位置遵循同一组类型关系；需要分别表示不同类型时，可以使用 `T`、`U` 等多个类型参数。

```typescript
// 函数重载：先声明重载签名，最后提供一个实现
function combine(first: number, second: number): number[];
function combine(first: string, second: string): string[];
function combine(
  first: number | string,
  second: number | string,
): Array<number | string> {
  return [first, second];
}

combine(1, 2);
combine("1", "2");

// 泛型函数：返回固定长度和位置类型的元组
function createPair<T>(first: T, second: T): [T, T] {
  return [first, second];
}

createPair<number>(1, 2); // 显式指定 T
createPair("1", "2"); // 自动推导 T 为 string

// type 和 interface 都可以定义泛型结构
type ApiResult<T> = {
  data: T;
  message: string;
};

const booleanResult: ApiResult<boolean> = {
  data: true,
  message: "success",
};

interface Box<T> {
  value: T;
}

const messageBox: Box<string> = {
  value: "success",
};

// 默认类型参数
function createPairWithDefaults<T = number, V = number>(
  first: T,
  second: V,
): [T, V] {
  return [first, second];
}

const defaultSecond = createPairWithDefaults<string>("count", 1);
const inferredPair = createPairWithDefaults(1, false);
```

`defaultSecond` 只显式指定了 `T`，因此 `V` 使用默认的 `number`；`inferredPair` 没有显式类型实参，`T` 和 `V` 分别由两个参数推导为 `number` 和 `boolean`。

### 在请求函数中使用泛型

类型参数只能描述通过校验后的结果类型，不能验证服务器在运行时返回的数据。下面的示例先把解析结果视为 `unknown`，再通过类型守卫进行检查。

```typescript
const httpClient = {
  get<T>(
    url: string,
    validate: (value: unknown) => value is T,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", url);
      xhr.timeout = 10_000;

      xhr.onreadystatechange = () => {
        if (xhr.readyState !== XMLHttpRequest.DONE) {
          return;
        }

        if (xhr.status < 200 || xhr.status >= 300) {
          reject(new Error(`请求失败，状态码：${xhr.status}`));
          return;
        }

        try {
          const data: unknown = JSON.parse(xhr.responseText);
          if (!validate(data)) {
            reject(new TypeError("响应数据结构不符合预期"));
            return;
          }
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };

      xhr.onerror = () => reject(new Error("网络请求失败"));
      xhr.ontimeout = () => reject(new Error("网络请求超时"));
      xhr.onabort = () => reject(new Error("网络请求已取消"));
      xhr.send();
    });
  },
};

interface GitHubUser {
  login: string;
  id: number;
}

function isGitHubUser(value: unknown): value is GitHubUser {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return (
    "login" in value &&
    typeof value.login === "string" &&
    "id" in value &&
    typeof value.id === "number"
  );
}

httpClient
  .get("https://api.github.com/users/github", isGitHubUser)
  .then((user) => {
    console.log(user.login);
    console.log(user.id);
  })
  .catch((error: unknown) => {
    console.error(error);
  });
```

## 17. 泛型约束

泛型约束使用 `extends` 指定类型参数必须满足的条件。这里的 `extends` 表示类型参数必须可以赋值给约束类型，并不只表示类继承。

```typescript
// 1. 普通的数字加法不需要泛型
function add(a: number, b: number): number {
  return a + b;
}
add(1, 2);

// 2. 泛型约束类型范围
interface HasLength {
  readonly length: number;
}
function getLength<T extends HasLength>(value: T): number {
  return value.length;
}
getLength("1");
getLength([1, 2, 3]);

// 3. 泛型约束对象
const person = {
  name: "aaaaa",
  sex: "male",
};

function getProperty<T, K extends keyof T>(object: T, key: K): T[K] {
  return object[key];
}

getProperty(person, "name");

interface Person {
  name: string;
  age: number;
  sex: string;
}

// 映射类型中的 in 在类型层遍历 keyof T 得到的属性键，不执行运行时代码
type OptionalProperties<T> = {
  [key in keyof T]?: T[key];
};

type OptionalPerson = OptionalProperties<Person>;

const optionalPerson: OptionalPerson = {
  name: "小明",
};
```

`keyof T` 会得到 `T` 的属性键联合类型，键可能是字符串、数字或 symbol。索引访问类型 `T[K]` 表示属性 `K` 在 `T` 中对应的值类型。映射属性后的 `?` 会把对应属性变成可选属性，因此 `OptionalProperties<Person>` 等价于内置的 `Partial<Person>`；需要把属性变成只读属性时，可以使用内置的 `Readonly<T>`。

## 18. tsconfig.json

运行 `tsc --init` 可以按照当前安装的 TypeScript 版本生成一份初始 `tsconfig.json`。不同版本生成的选项和默认值可能不同，应以项目实际使用的 TypeScript 版本为准。

### 一份可输出 JavaScript 的基础配置

下面的 JSONC 示例适合由 TypeScript 直接输出 JavaScript、再交给打包器处理的项目：

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "esModuleInterop": true,
    "sourceMap": true,
    "incremental": true,
    "tsBuildInfoFile": "./.tsbuildinfo",
    "removeComments": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["dist", "node_modules"]
}
```

- `target` 控制需要降级的 JavaScript 语法，也会影响默认标准库声明；显式设置 `lib` 会改用所列出的库。`ES2019.Array` 表示 ES2019 引入的数组声明，并不是 ES8。
- `allowJs` 允许 `.js`、`.jsx` 文件进入项目；`checkJs` 会对这些 JavaScript 文件执行类型检查。只想检查单个文件时，也可以使用 `// @ts-check`。
- `rootDir` 描述源文件的目录结构，并影响输出目录中的相对结构；它不负责决定哪些文件进入项目。`outDir` 才是生成文件的目标目录。
- `incremental` 把构建信息保存到 `tsBuildInfoFile`，供后续构建复用未变化部分的检查结果。
- `diagnostics` 输出编译器各阶段的性能统计，`listFiles` 列出参与编译的文件，`listEmittedFiles` 列出实际生成的文件。
- `strict: true` 会开启一组严格检查。`alwaysStrict` 还会按 ECMAScript 严格模式解析文件，并在适用的输出中加入 `"use strict"`；`strictFunctionTypes` 会更严格地检查函数类型的参数兼容性，但方法声明存在例外。
- `noUnusedLocals` 和 `noUnusedParameters` 会把未使用的局部变量或参数报告为编译诊断错误。
- `noFallthroughCasesInSwitch` 只负责报告非空 `case` 的贯穿问题，不会自动插入 `break`；`noImplicitReturns` 会报告并非所有代码路径都显式返回值的函数。

### 输出 JavaScript、声明文件或只检查类型

`sourceMap` 和 `inlineSourceMap` 是两种替代方案，不能同时启用。`removeComments`、`listEmittedFiles` 等选项只在实际生成文件时有意义。

需要只生成声明文件时，可以使用：

```jsonc
{
  "compilerOptions": {
    "declaration": true,
    "declarationDir": "./types",
    "emitDeclarationOnly": true,
    "declarationMap": true
  }
}
```

`declaration` 通常会按照源文件及其目录结构生成对应的 `.d.ts`，不会统一自动生成一个 `index.d.ts`。`declarationMap` 只有在生成声明文件时才会产生结果。

只进行类型检查、不生成任何文件时，可以使用：

```jsonc
{
  "compilerOptions": {
    "noEmit": true
  }
}
```

不要把 `noEmit` 与 `outDir`、`emitDeclarationOnly`、source map 等输出选项混在同一场景中。`noEmitOnError` 表示在本来允许生成文件时，只要发生编译错误就不输出文件。

`outFile` 不是通用打包工具。它不能打包 CommonJS 或 ES 模块，只能和 `module: "none"`、`"amd"` 或 `"system"` 等有限模式配合使用。

### 类型包与降级辅助函数

默认情况下，TypeScript 会包含所有可见的 `node_modules/@types` 包。显式设置 `typeRoots` 后，只会自动包含这些目录下的类型包；设置 `types` 后，只有列出的包会自动加入全局作用域。

```jsonc
{
  "compilerOptions": {
    "typeRoots": ["./typings", "./node_modules/@types"],
    "types": ["node", "vite/client"]
  }
}
```

`types` 不会禁止代码显式导入其他包及其类型。不要使用空的 `typeRoots` 或 `types`，除非确实希望关闭相应的自动类型加载。

某些语法降级时需要辅助函数：

- `importHelpers: true` 会从 `tslib` 导入辅助函数，因此运行时必须能够解析 `tslib`；它只影响模块文件。
- `noEmitHelpers: true` 表示项目自行在全局环境提供辅助函数。这与从 `tslib` 导入是不同方案，不应当作固定组合。
- `downlevelIteration` 在低于 ES2015 的目标下，让 `for...of`、展开和解构等操作更接近迭代协议；运行环境仍可能需要提供 `Symbol.iterator`。

### 模块解析与路径

`module` 控制模块代码的生成形式，`moduleResolution` 控制 TypeScript 如何查找导入目标。现代 Node.js 项目通常使用配套的 `node16` 或 `nodenext`；由 Vite 等打包器处理的项目可以使用 `bundler`。旧名称 `node` 对应旧的 `node10` 算法。

`esModuleInterop` 主要改善 CommonJS 模块的默认导入和命名空间导入兼容性，并会启用 `allowSyntheticDefaultImports`。`allowUmdGlobalAccess` 只允许模块文件通过全局变量访问已经加载的 UMD 声明，不负责加载 UMD 脚本。

```jsonc
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    },
    "rootDirs": ["./src", "./generated"]
  }
}
```

现代 TypeScript 使用 `paths` 时不要求同时设置 `baseUrl`。`paths` 只影响 TypeScript 的模块解析，不会改写生成代码中的导入路径，因此打包器或运行时也要配置相同别名。`rootDirs` 只在类型检查和模块解析阶段建立虚拟目录关系，不复制文件，也不改变运行时路径。

### `files`、`include` 和 `exclude`

- `files` 明确列出入口文件。
- `include` 通过 glob 模式添加文件。
- `exclude` 主要过滤 `include` 找到的文件，不会排除由 `files` 明确指定或被其他文件导入的依赖。

`files` 和 `include` 同时存在时，两者得到的文件会共同进入项目；`exclude` 不是 `include` 的简单反向操作。

## 19. 命名空间（namespace）

命名空间可以把脚本中的相关类型和值组织在一个名称下，减少顶层名称冲突；但它本身仍可能出现在全局作用域中。现代应用代码通常优先使用 ES 模块，namespace 更适合组织传统全局脚本，或为以全局变量形式加载的库编写类型声明。

namespace 内部的成员可以互相访问。只有需要从 namespace 外部访问的成员才需要 `export`；同名 namespace 可以合并，但后续声明只能访问之前已经导出的成员。

### 导出、嵌套、合并与别名

`test.ts`：

```typescript
export namespace Test {
  const internalValue = "只能在当前 namespace 声明中访问";

  export const value = 1;
  export const add = (first: number, second: number): number => {
    return first + second;
  };

  export namespace Nested {
    export const value = 2;
  }

  console.log(internalValue);
}

// 同名 namespace 会进行声明合并
export namespace Test {
  export const mergedValue = 3;
}
```

`main.ts`：

```typescript
import { Test } from "./test";

// import Alias = Namespace.Member 为限定名称创建较短的别名
import NestedNamespace = Test.Nested;

console.log(Test.value);
console.log(Test.mergedValue);
console.log(NestedNamespace.value);
```

### 全局脚本中的组织示例

下面仅演示 namespace 在传统全局脚本中的组织方式。模块化项目应优先把不同平台能力拆成模块。

```typescript
namespace IOS {
  export const pushNotification = (
    message: string,
    type: number,
  ): void => {
    console.log(`iOS notification: ${message}, type: ${type}`);
  };
}

namespace Android {
  export const pushNotification = (message: string): void => {
    console.log(`Android notification: ${message}`);
  };

  export const callPhone = (phone: string): void => {
    console.log(`Call: ${phone}`);
  };
}

IOS.pushNotification("订单已发货", 1);
Android.pushNotification("订单已发货");
Android.callPhone("10086");
```

## 20. 模块系统与导入导出

JavaScript 历史上出现过 CommonJS、AMD、CMD 和 UMD 等模块组织方式。现代浏览器和现代 Node.js 主要使用标准的 ES Modules，也就是 `import`、`export` 语法。

### CommonJS

CommonJS 主要使用 `require()` 加载模块，通过 `module.exports` 导出值。

`math.cjs`：

```javascript
function add(first, second) {
  return first + second;
}

module.exports = { add };
```

`main.cjs`：

```javascript
const math = require("./math.cjs");

console.log(math.add(1, 2));
```

`exports` 初始时是 `module.exports` 的引用，可以写成 `exports.add = add`；如果重新给 `module.exports` 赋值，最终导出的就是新值，不应再依赖旧的 `exports` 引用。

### AMD 与 CMD

AMD 通常与 RequireJS 等浏览器加载器配合使用：

```javascript
define("app", ["./math"], function (math) {
  return {
    run: function () {
      console.log(math.add(1, 2));
    },
  };
});

require(["app"], function (app) {
  app.run();
});
```

CMD 通常与 SeaJS 配合使用，属于非标准的历史模块方案：

```javascript
define(function (require, exports) {
  const math = require("./math");
  exports.result = math.add(1, 2);
});
```

### UMD

UMD 是一种兼容包装模式，可以根据运行环境暴露 CommonJS、AMD 或浏览器全局变量形式的 API。现代应用通常交给构建工具生成 UMD，而不是手写包装器。

```javascript
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else if (typeof define === "function" && define.amd) {
    define([], factory);
  } else {
    root.eventUtil = factory();
  }
})(globalThis, function () {
  return {
    on: function (target, eventName, listener) {
      target.addEventListener(eventName, listener);
    },
  };
});
```

### Node.js 中的 ESM 与 CommonJS

Node.js 会结合文件扩展名和最近的 `package.json` 判断模块格式：`.mjs` 始终作为 ES 模块，`.cjs` 始终作为 CommonJS；`.js` 文件通常由 `package.json` 的 `"type": "module"` 或 `"type": "commonjs"` 决定。

### ES 模块

一个模块最多有一个默认导出；默认导入的本地绑定名称由导入方决定。命名导出使用固定的导出名称，导入时可以通过 `as` 创建本地别名。`export { ... }` 是导出列表，不是对象解构。

`config.ts`：

```typescript
const config = {
  appName: "TypeScript Demo",
};

export default config;
```

`math.ts`：

```typescript
export const add = (first: number, second: number): number => {
  return first + second;
};

export const values = [1, 2, 3];
```

`user.ts`：

```typescript
const userName = "小明";
const getGreeting = (): string => `你好，${userName}`;

export { userName, getGreeting };
```

`main.ts`：

```typescript
import appConfig from "./config";
import { add, values as initialValues } from "./math";
import * as math from "./math";
import { getGreeting } from "./user";

console.log(appConfig.appName);
console.log(add(1, 2));
console.log(initialValues);
console.log(math.add(2, 3));
console.log(getGreeting());
```

命名空间导入 `import * as math` 会创建模块命名空间对象，可以通过 `math.add` 等属性访问模块的公开导出。控制台如何展示该对象取决于运行环境，不应依赖固定的打印形式。

静态 `import` 声明位于模块顶层；动态 `import()` 是运行时表达式，可以在函数或条件分支中调用。它返回一个 Promise，成功值是模块命名空间对象，加载失败时 Promise 会被拒绝。

```typescript
async function runMathFeature(enabled: boolean): Promise<void> {
  if (!enabled) {
    return;
  }

  try {
    const mathModule = await import("./math");
    console.log(mathModule.add(3, 4));
  } catch (error) {
    console.error("模块加载失败", error);
  }
}

runMathFeature(true);
```

## 21. 声明文件与 declare

声明文件使用 `.d.ts` 描述 JavaScript API 的类型，不包含运行时实现。类型可能由 npm 包自身提供，也可能来自 `@types`、项目包含的 `.d.ts` 文件或显式配置的类型包目录。

### 使用已有的第三方声明

使用 Express 时，需要同时安装运行时代码和类型声明：

```bash
npm install express
npm install --save-dev @types/express
```

`index.ts`：

```typescript
import express, { type Request, type Response } from "express";

const app = express();
const router = express.Router();

app.use("/api", router);

router.get("/hello", (_request: Request, response: Response) => {
  response.json({
    code: 200,
    data: "hello world",
  });
});

app.listen(3000, () => {
  console.log("server is running at http://localhost:3000");
});
```

如果库已经提供准确的声明文件，不应再使用 `declare module` 重新声明整个库，否则可能覆盖或破坏原有类型。

### 为没有类型的模块编写声明

假设项目依赖一个没有声明文件的 JavaScript 包 `legacy-format`，可以创建 `src/types/legacy-format/index.d.ts`：

```typescript
declare module "legacy-format" {
  export interface FormatOptions {
    uppercase?: boolean;
  }

  export function format(
    value: string,
    options?: FormatOptions,
  ): string;
}
```

业务代码即可正常导入：

```typescript
import { format } from "legacy-format";

console.log(format("hello", { uppercase: true }));
```

`.d.ts` 必须进入 TypeScript 项目：可以让 `include` 覆盖 `src/**/*.d.ts`，通过其他文件的导入关系引入，或者把它按照类型包目录结构放入 `typeRoots`。不要为了消除错误而随意声明无关的全局 `any` 变量。

## 22. Mixin（混入）

对象组合可以把多个对象的可枚举自有属性复制到一个新对象中。类 Mixin 通常接收一个基类构造器并返回派生类，从而为基类增加可复用行为；它不是在运行时把两个类直接合并成一个类。

### 对象组合

```typescript
interface AgeInfo {
  age: number;
}

interface NameInfo {
  name: string;
}

const ageInfo: AgeInfo = {
  age: 18,
};

const nameInfo: NameInfo = {
  name: "张三",
};

const profileBySpread = { ...ageInfo, ...nameInfo };
console.log(profileBySpread); // { age: 18, name: "张三" }

const profileByAssign = Object.assign({}, ageInfo, nameInfo);
console.log(profileByAssign); // { age: 18, name: "张三" }
```

对象展开和 `Object.assign` 都只执行浅层复制：嵌套对象仍然共享引用；存在同名属性时，后面的来源会覆盖前面的值。TypeScript 会根据各来源对象推导组合后的属性，但这属于静态类型推导，与运行时的浅层赋值规则是两回事。

### 类 Mixin 与组合

下面的 Mixin 工厂返回 `App` 的派生类，并在派生类内部组合 `Logger` 和 `HtmlRenderer`：

```typescript
class Logger {
  log(message: string): void {
    console.log(message);
  }
}

class HtmlRenderer {
  render(): void {
    console.log("render html");
  }
}

class App {
  run(): void {
    console.log("app run");
  }
}

type Constructor<T> = new (...args: any[]) => T;

function withRendering<TBase extends Constructor<App>>(Base: TBase) {
  return class extends Base {
    private readonly logger = new Logger();
    private readonly htmlRenderer = new HtmlRenderer();

    override run(): void {
      super.run();
      this.logger.log("enhanced app run");
    }

    render(): void {
      this.logger.log("app render");
      this.htmlRenderer.render();
    }
  };
}

const MixedApp = withRendering(App);
const app = new MixedApp();

app.run();
app.render();
```

## 23. 装饰器（decorator）

TypeScript 5 支持符合新装饰器提案的标准装饰器语义，不需要开启 `experimentalDecorators`。旧版实验装饰器仍然可用，但调用签名、类型检查和生成结果与标准装饰器不同，两套代码不能直接混用。

### TypeScript 5 标准装饰器

标准装饰器接收被装饰的值和对应的上下文对象。下面分别展示类装饰器、方法装饰器工厂和字段装饰器。

```typescript
type AnyClass = abstract new (...args: any[]) => object;

const classRegistry = new Map<string, AnyClass>();

// 类装饰器
function registered<T extends AnyClass>(
  target: T,
  context: ClassDecoratorContext<T>,
): void {
  const className = context.name ?? "(anonymous)";
  classRegistry.set(className, target);
}

// 方法装饰器工厂
function logged(prefix = "LOG") {
  return function <This, Args extends unknown[], Return>(
    originalMethod: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<
      This,
      (this: This, ...args: Args) => Return
    >,
  ): (this: This, ...args: Args) => Return {
    const methodName = String(context.name);

    return function (this: This, ...args: Args): Return {
      console.log(`${prefix}: entering ${methodName}`);
      const result = originalMethod.call(this, ...args);
      console.log(`${prefix}: leaving ${methodName}`);
      return result;
    };
  };
}

// 字段装饰器：返回字段初始化转换函数
function trimField<This>(
  _value: undefined,
  context: ClassFieldDecoratorContext<This, string>,
): (this: This, initialValue: string) => string {
  const fieldName = String(context.name);

  return function (initialValue: string): string {
    console.log(`initialize ${fieldName}`);
    return initialValue.trim();
  };
}

@registered
class HttpClient {
  @trimField
  label = "  API Client  ";

  @logged("HTTP")
  getList(page: number): string[] {
    return [`page-${page}`];
  }
}

const client = new HttpClient();
console.log(client.label); // "API Client"
console.log(client.getList(1)); // ["page-1"]
console.log(classRegistry.has("HttpClient")); // true
```

装饰器工厂是返回装饰器的函数，例如 `logged("HTTP")`。这不等同于必须把多参数函数转换成一连串单参数函数的“柯里化”。

不要依赖装饰器直接修改原型后再通过 `as any` 访问新增成员：装饰器不会自动把动态增加的成员写回原类的声明类型，同名原型成员也可能被覆盖。需要让新增实例成员进入静态类型时，类 Mixin 通常更合适。

字段装饰器处理的是字段定义和初始化过程，而不是任意某个实例初始化完成后的属性值。上面的 `trimField` 通过返回初始化转换函数处理每个实例的初始值。

### 旧版实验装饰器与元数据

依赖旧版参数装饰器或 `reflect-metadata` 的框架，需要明确启用旧版模式：

```jsonc
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

```bash
npm install reflect-metadata
```

并在应用入口导入：

```typescript
import "reflect-metadata";
```

`emitDecoratorMetadata` 只会为旧版装饰器生成有限的设计类型元数据，并不会提供运行时参数校验、自动请求注入或完整的 TypeScript 类型信息。TypeScript 5 标准装饰器与 `emitDecoratorMetadata` 不兼容，也不支持参数装饰器。

## 24. 使用 Webpack 构建 TypeScript 与 Vue 3 项目

项目结构：

```text
root
|- index.html
|- package.json
|- tsconfig.json
|- webpack.config.js
|- src
|   |- App.vue
|   |- main.ts
|   |- shim.d.ts
```

### 安装依赖

```bash
npm install vue
npm install --save-dev webpack webpack-cli webpack-dev-server
npm install --save-dev typescript ts-loader
npm install --save-dev vue-loader @vue/compiler-sfc
npm install --save-dev html-webpack-plugin css-loader style-loader
```

`vue` 和 `@vue/compiler-sfc` 应使用相互匹配的版本。

### 配置 `package.json`

```jsonc
{
  "scripts": {
    "dev": "webpack serve --mode development",
    "build": "webpack --mode production"
  }
}
```

### 配置 `tsconfig.json`

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "esModuleInterop": true,
    "sourceMap": true
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.vue"]
}
```

### 配置 `webpack.config.js`

```javascript
const path = require("node:path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { VueLoaderPlugin } = require("vue-loader");

/** @type {import("webpack").Configuration} */
const config = {
  stats: "errors-only",
  mode: "development",
  entry: "./src/main.ts",
  devtool: "source-map",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
    clean: true,
  },
  devServer: {
    hot: true,
    historyApiFallback: true,
  },
  resolve: {
    extensions: [".ts", ".js", ".vue"],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./index.html",
    }),
    new VueLoaderPlugin(),
  ],
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: "vue-loader",
      },
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loader: "ts-loader",
        options: {
          appendTsSuffixTo: [/\.vue$/],
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
};

module.exports = config;
```

`VueLoaderPlugin` 是手动配置 Vue Loader 时不可缺少的插件。Loader 从数组末尾向前执行，因此 CSS 会先交给 `css-loader`，再由 `style-loader` 注入页面。

### 创建入口文件和 HTML

```typescript
// src/main.ts
import { createApp } from "vue";
import App from "./App.vue";

createApp(App).mount("#app");
```

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vue 3 Webpack Demo</title>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>
```

### 声明 `.vue` 模块

```typescript
// src/shim.d.ts
declare module "*.vue" {
  import type { DefineComponent } from "vue";

  const component: DefineComponent;
  export default component;
}
```

这个声明让 TypeScript 能够识别 `.vue` 文件的默认导出；组件内部更具体的类型仍由 Vue 和相关工具链负责推导。

## 25. 发布订阅模式

发布订阅和观察者模式都能表达一对多通知，但两者并不完全相同。观察者模式通常由被观察对象直接维护观察者；发布订阅通常通过事件名称和事件通道连接发布者与订阅者，使双方不必直接持有彼此。

DOM `EventTarget`、Electron IPC 和应用内事件总线都具有发布订阅特征，但它们的运行环境、传输边界和数据约束并不相同。

### 使用 DOM 自定义事件

`document` 是管理监听器和派发事件的 `EventTarget`；`CustomEvent` 对象只描述某一次事件及其数据。

```typescript
interface NoticeDetail {
  message: string;
}

const handleNotice = (event: Event): void => {
  const noticeEvent = event as CustomEvent<NoticeDetail>;
  console.log(noticeEvent.detail.message);
};

document.addEventListener("app:notice", handleNotice, { once: true });

const noticeEvent = new CustomEvent<NoticeDetail>("app:notice", {
  detail: {
    message: "订单已发货",
  },
});

document.dispatchEvent(noticeEvent); // 调用一次 handleNotice
document.dispatchEvent(noticeEvent); // once 监听器已经自动移除
```

需要手动移除监听器时，必须传入注册时的同一个函数引用：

```typescript
const handleClick = (): void => {
  console.log("点击了");
};

document.addEventListener("click", handleClick);
document.removeEventListener("click", handleClick);
```

### 实现类型安全的事件总线

事件映射可以让不同事件拥有不同的参数元组，从而在注册和派发时同时获得类型检查。

```typescript
type Listener<Args extends unknown[]> = (...args: Args) => void;
type StoredListener = Listener<never[]>;

class EventEmitter<
  Events extends { [EventName in keyof Events]: unknown[] },
> {
  private readonly listeners = new Map<
    keyof Events,
    Set<StoredListener>
  >();

  on<EventName extends keyof Events>(
    eventName: EventName,
    listener: Listener<Events[EventName]>,
  ): () => void {
    let eventListeners = this.listeners.get(eventName);

    if (!eventListeners) {
      eventListeners = new Set();
      this.listeners.set(eventName, eventListeners);
    }

    eventListeners.add(listener as StoredListener);
    return () => this.off(eventName, listener);
  }

  once<EventName extends keyof Events>(
    eventName: EventName,
    listener: Listener<Events[EventName]>,
  ): void {
    const wrappedListener: Listener<Events[EventName]> = (...args) => {
      this.off(eventName, wrappedListener);
      listener(...args);
    };

    this.on(eventName, wrappedListener);
  }

  emit<EventName extends keyof Events>(
    eventName: EventName,
    ...args: Events[EventName]
  ): void {
    const eventListeners = this.listeners.get(eventName);
    if (!eventListeners) {
      return;
    }

    for (const storedListener of [...eventListeners]) {
      const listener = storedListener as Listener<Events[EventName]>;
      listener(...args);
    }
  }

  off<EventName extends keyof Events>(
    eventName: EventName,
    listener: Listener<Events[EventName]>,
  ): void {
    const eventListeners = this.listeners.get(eventName);
    if (!eventListeners) {
      return;
    }

    eventListeners.delete(listener as StoredListener);
    if (eventListeners.size === 0) {
      this.listeners.delete(eventName);
    }
  }
}

interface AppEvents {
  message: [enabled: boolean, count: number];
  notice: [message: string];
}

const bus = new EventEmitter<AppEvents>();

const handleMessage = (enabled: boolean, count: number): void => {
  console.log(enabled, count);
};

const unsubscribe = bus.on("message", handleMessage);
bus.emit("message", true, 1);
unsubscribe();

bus.once("notice", (message) => console.log(message));
bus.emit("notice", "第一次通知");
bus.emit("notice", "不会再次触发");
```

## 26. Map、Set、WeakMap 与 WeakSet

```typescript
// 1. Set
const numberSet = new Set([1, 2, 3, 3, 4, 5, 6]);
console.log(numberSet); // Set(6) { 1, 2, 3, 4, 5, 6 }
numberSet.add(7);
console.log(numberSet.has(1)); // true
numberSet.delete(1);

const firstObject = { id: 1 };
const secondObject = { id: 1 };
const objectSet = new Set([firstObject, firstObject, secondObject]);
console.log(objectSet.size); // 2

// 2. Map
const objectKey = { name: "张三" };
const objectMap = new Map<object, string>();
objectMap.set(objectKey, "用户信息");
console.log(objectMap.get(objectKey)); // "用户信息"

const scoreMap = new Map<string, number>();
scoreMap.set("TypeScript", 100);
console.log(scoreMap.get("TypeScript")); // 100

// 3. WeakMap 与 WeakSet
const weakKey = { name: "Lison" };
const metadata = new WeakMap<object, string>();
metadata.set(weakKey, "private metadata");
console.log(metadata.has(weakKey)); // true

const visitedObjects = new WeakSet<object>();
visitedObjects.add(weakKey);
console.log(visitedObjects.has(weakKey)); // true
```

Set 和 Map 使用 SameValueZero 比较键和值。对于对象，这意味着是否相同取决于引用身份：同一个对象引用会被视为相同，两个结构相同但分别创建的对象仍然不同。Map 的键可以是任意 JavaScript 值，包括原始值和对象。

WeakMap 和 WeakSet 不会因为对象作为弱键存在，就阻止该对象被垃圾回收；但垃圾回收发生的具体时间无法预测，也不能通过代码观察。当前标准还允许未注册的 symbol 作为弱键，是否能在 TypeScript 中直接使用取决于运行环境和所选标准库声明。

为了避免暴露键的存活状态，WeakMap 和 WeakSet 不提供键枚举、`size` 或 `clear()`。需要遍历键时，应使用 Map 或 Set。

## 27. Proxy 与 Reflect

Proxy 通过 handler 中的 trap 拦截目标对象的内部操作；Reflect 提供与这些操作相对应的方法，便于在 trap 中保留默认语义。

`target` 是原始目标对象，`key` 是属性键，`value` 是准备写入的值，`receiver` 是本次操作使用的接收者。把 `receiver` 传给 Reflect 有助于正确处理继承和访问器中的 `this`。

### 代理普通对象

```typescript
interface PersonRecord {
  name: string;
  age: number;
}

const personTarget: PersonRecord = {
  name: "张三",
  age: 18,
};

const personProxy = new Proxy(personTarget, {
  get(target, key, receiver) {
    console.log(`读取属性：${String(key)}`);
    return Reflect.get(target, key, receiver);
  },

  set(target, key, value, receiver) {
    console.log(`写入属性：${String(key)}`);
    return Reflect.set(target, key, value, receiver);
  },
});

console.log(personProxy.name);
personProxy.age = 19;
```

### 函数代理与访问控制

`apply` 只对本身可调用的目标有效，`construct` 只对本身可构造的目标有效。给普通对象配置这些 trap，不会让它自动变成函数或构造器。

```typescript
const add = (first: number, second: number): number => first + second;

const tracedAdd = new Proxy(add, {
  apply(target, thisArgument, argumentsList) {
    console.log("调用 add", argumentsList);
    return Reflect.apply(target, thisArgument, argumentsList);
  },
});

console.log(tracedAdd(1, 2)); // 3

const guardedTarget: PersonRecord = {
  name: "小明",
  age: 16,
};

const guardedPerson = new Proxy(guardedTarget, {
  get(target, key, receiver) {
    if (key === "name" && target.age < 18) {
      return "访问受限";
    }

    return Reflect.get(target, key, receiver);
  },
});

console.log(guardedPerson.name); // "访问受限"
console.log(guardedPerson.age); // 16
```

`has`、`ownKeys`、`deleteProperty` 等 trap 也有各自的返回类型和代理不变量，不能用空函数代替默认行为。Map 和 Set 还依赖内部槽，直接代理后调用原生方法可能出现接收者不兼容；需要按具体 API 绑定方法或提供包装层。

### 简化的响应式依赖追踪

下面的示例只演示三个核心步骤：执行副作用时记录它读取的属性，属性成功写入且值发生变化时查找依赖，最后重新执行相关副作用。它不是 MobX、Vue 等框架的完整实现。

```typescript
type Effect = () => void;

let activeEffect: Effect | undefined;

const targetDependencies = new WeakMap<
  object,
  Map<PropertyKey, Set<Effect>>
>();

function track(target: object, key: PropertyKey): void {
  if (!activeEffect) {
    return;
  }

  let propertyDependencies = targetDependencies.get(target);
  if (!propertyDependencies) {
    propertyDependencies = new Map();
    targetDependencies.set(target, propertyDependencies);
  }

  let effects = propertyDependencies.get(key);
  if (!effects) {
    effects = new Set();
    propertyDependencies.set(key, effects);
  }

  effects.add(activeEffect);
}

function trigger(target: object, key: PropertyKey): void {
  const effects = targetDependencies.get(target)?.get(key);
  if (!effects) {
    return;
  }

  for (const effect of [...effects]) {
    effect();
  }
}

function autorun(effect: Effect): void {
  const wrappedEffect = (): void => {
    activeEffect = wrappedEffect;
    try {
      effect();
    } finally {
      activeEffect = undefined;
    }
  };

  wrappedEffect();
}

function observable<T extends object>(target: T): T {
  return new Proxy(target, {
    get(currentTarget, key, receiver) {
      track(currentTarget, key);
      return Reflect.get(currentTarget, key, receiver);
    },

    set(currentTarget, key, value, receiver) {
      const previousValue = Reflect.get(currentTarget, key, receiver);
      const succeeded = Reflect.set(currentTarget, key, value, receiver);

      if (succeeded && !Object.is(previousValue, value)) {
        trigger(currentTarget, key);
      }

      return succeeded;
    },
  });
}

const reactivePerson = observable({
  name: "张三",
  status: "offline",
});

autorun(() => {
  console.log(`status changed: ${reactivePerson.status}`);
});

reactivePerson.status = "online"; // 触发相关副作用
reactivePerson.name = "李四"; // 没有读取 name 的副作用，不触发日志
reactivePerson.status = "online"; // 值未变化，不重复触发
```

## 28. 类型守卫

类型守卫使用运行时能够执行的条件检查，帮助 TypeScript 在编译阶段把一个较宽的静态类型收窄为更具体的类型。`typeof`、`instanceof`、相等性检查、`in` 操作符和用户自定义类型谓词都可以参与类型收窄。

### 使用 `typeof` 和 `Array.isArray()`

JavaScript 的 `typeof` 可以返回 `"string"`、`"number"`、`"bigint"`、`"boolean"`、`"symbol"`、`"undefined"`、`"object"` 和 `"function"`。数组和普通对象都会得到 `"object"`；`null` 也会因为历史原因得到 `"object"`，因此需要单独判断。函数得到的是 `"function"`，而不是 `"object"`。

```typescript
const isString = (value: unknown): value is string => {
  return typeof value === "string";
};

const isArray = (value: unknown): value is unknown[] => {
  return Array.isArray(value);
};

function describeValue(value: unknown): string {
  if (isString(value)) {
    return `字符串长度：${value.length}`;
  }

  if (isArray(value)) {
    return `数组长度：${value.length}`;
  }

  if (value === null) {
    return "值为 null";
  }

  return `typeof 结果：${typeof value}`;
}
```

`Array.isArray()` 比 `value instanceof Array` 更适合判断数组，因为来自 iframe 等其他 realm 的数组可能拥有不同的 `Array` 构造函数。

### 自定义类型谓词

类型谓词的形式是 `parameterName is Type`。其中的参数名必须来自当前函数的参数，谓词中的类型也必须能够赋给该参数原来的类型。TypeScript 会信任开发者给出的谓词，因此函数体必须真正实现对应检查。

下面的示例接收未知值，只处理记录型对象的自有、可枚举字符串键。它不会修改原对象：数字保留两位小数，字符串去除两端空白，函数则作为受信任的无参数回调执行。

```typescript
type Callable = (...args: never[]) => unknown;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const isNumber = (value: unknown): value is number => {
  return typeof value === "number";
};

const isCallable = (value: unknown): value is Callable => {
  return typeof value === "function";
};

function transformRecord(
  data: unknown,
): Record<string, unknown> | undefined {
  if (!isRecord(data)) {
    return undefined;
  }

  const result: Record<string, unknown> = { ...data };

  for (const key of Object.keys(result)) {
    const value = result[key];

    if (isNumber(value)) {
      result[key] = Number(value.toFixed(2));
    } else if (isString(value)) {
      result[key] = value.trim();
    } else if (isCallable(value)) {
      value();
    }
  }

  return result;
}

const sampleRecord = {
  a: 100.1111,
  b: " 张三  ",
  c: () => {
    console.log("hello world");
  },
};

const transformedRecord = transformRecord(sampleRecord);
console.log(transformedRecord);
```

`Object.keys()` 不会遍历继承的属性，也不会返回 symbol 键。`for...in` 会枚举继承的可枚举字符串属性，但配合自有属性判断后仍然可以使用。示例中的回调来自受信任的本地对象；执行外部输入中的任意函数可能产生副作用或抛出异常，不应直接照搬。

函数独立调用时的 `this` 取决于调用方式、严格模式和模块类型：严格模式与 ES 模块中通常是 `undefined`，不能简单概括为“Node.js 中是 undefined、浏览器中是 window”。如果回调依赖接收者，应显式约定并传入 `this`。

## 29. 协变、逆变与双变

TypeScript 主要使用结构化类型系统：两个类型是否兼容，主要取决于它们拥有的成员，而不是是否显式声明了继承关系。型变描述的是：当两个类型之间存在兼容关系时，使用它们构造出的生产者、消费者等复合类型会沿哪个方向保持兼容。

下面假设项目启用了 `strictFunctionTypes`；`strict: true` 也会启用这项检查。

### 协变：保持原方向

`Employee` 拥有 `Person` 所要求的全部成员，因此 `Employee` 可以赋给 `Person`。只在返回值位置使用类型参数的生产者会沿相同方向兼容。

```typescript
interface Person {
  name: string;
}

interface Employee {
  name: string;
  employeeId: number;
}

type Producer<T> = () => T;

const produceEmployee: Producer<Employee> = () => ({
  name: "李四",
  employeeId: 1001,
});

const producePerson: Producer<Person> = produceEmployee;
console.log(producePerson().name);
```

### 逆变：反转兼容方向

函数参数位置呈现相反方向：能够处理任意 `Person` 的函数，也一定能够处理更具体的 `Employee`。反过来不安全，因为只接受 `Employee` 的函数可能读取普通 `Person` 不具备的 `employeeId`。

```typescript
type Consumer<T> = (value: T) => void;

const consumePerson: Consumer<Person> = (person) => {
  console.log(person.name);
};

const consumeEmployee: Consumer<Employee> = consumePerson;
consumeEmployee({ name: "王五", employeeId: 1002 });

const consumeEmployeeOnly: Consumer<Employee> = (employee) => {
  console.log(employee.employeeId);
};

let consumeAnyPerson: Consumer<Person> = consumePerson;

// @ts-expect-error 只处理 Employee 的函数不能安全地处理任意 Person
consumeAnyPerson = consumeEmployeeOnly;
```

### 双变与方法参数例外

启用 `strictFunctionTypes` 后，函数语法中的参数会进行更严格的逆变检查；但为了兼容既有的类层次和 DOM 类型，方法语法中的参数仍可能按双变方式检查。双变意味着两个兼容方向都可能被接受，其中一个方向可能不安全，因此不应把这种例外当作设计目标。

```typescript
interface MethodHandler<T> {
  handle(value: T): void;
}

const employeeMethodHandler: MethodHandler<Employee> = {
  handle(employee) {
    console.log(employee.employeeId);
  },
};

// 方法参数的双变检查允许该赋值，但调用方可能只传入普通 Person
const personMethodHandler: MethodHandler<Person> = employeeMethodHandler;
personMethodHandler.handle({ name: "赵六" });
```

## 30. 常用内置工具类型

工具类型只在编译阶段转换静态类型，不会在运行时修改、复制或删除对象属性。下面介绍其中一组常用工具：

1. `Partial<T>`：把第一层属性改成可选。
2. `Required<T>`：移除第一层属性的可选修饰符。
3. `Pick<T, K>`：选取对象类型中的一组属性。
4. `Exclude<T, U>`：从联合类型 `T` 中排除可赋给 `U` 的成员。
5. `Omit<T, K>`：从对象类型中排除一组键。
6. `Record<K, V>`：构造键为 `K`、值为 `V` 的对象类型。
7. `ReturnType<F>`：取得函数类型 `F` 的返回值类型。

```typescript
interface User {
  address: string;
  name: string;
  age?: number;
  profile?: {
    nickname?: string;
  };
}

// 1. Partial
type PartialUser = Partial<User>;
// 第一层属性都变为可选；如果提供 profile，其内部结构不会被递归转换

type CustomPartial<T> = {
  [Property in keyof T]?: T[Property];
};

// 2. Required
type RequiredUser = Required<User>;
// age 和 profile 变为必选，但 profile.nickname 仍然是可选属性

type CustomRequired<T> = {
  [Property in keyof T]-?: T[Property];
};

// 3. Pick
type PickedUser = Pick<User, "address" | "name">;

type CustomPick<T, K extends keyof T> = {
  [Property in K]: T[Property];
};

// 4. Exclude
type RemainingKey = Exclude<
  "address" | "name" | "age",
  "address" | "name"
>; // "age"

type CustomExclude<T, U> = T extends U ? never : T;
// 条件类型对联合类型逐项处理，never 最终会从联合类型中消失

// 5. Omit
type PublicUser = Omit<User, "address" | "profile">;
// 只改变静态类型，不会删除实际对象上的属性

type CustomOmit<T, K extends PropertyKey> = Pick<
  T,
  Exclude<keyof T, K>
>;

// 6. Record
type ActionKey = "a" | "b" | "c";
type Action = "sing" | "jump" | "dance";

const actionMap: Record<ActionKey, Action> = {
  a: "sing",
  b: "jump",
  c: "dance",
};

// 每个 ActionKey 都必须存在，每个值都必须属于 Action 联合类型
type CustomRecord<K extends PropertyKey, V> = {
  [Property in K]: V;
};

// 7. ReturnType
const createValues = () => [1, 2, 3, "111", false];

type ValuesReturnType = ReturnType<typeof createValues>;
// (number | string | boolean)[]

type CustomReturnType<
  F extends (...args: any[]) => unknown,
> = F extends (...args: any[]) => infer Result ? Result : never;
```

## 31. `infer` 关键字与条件类型

条件类型使用 `T extends Pattern ? TrueType : FalseType` 根据类型兼容关系选择结果。`infer` 只能在条件类型的 `extends` 匹配模式中声明待推断的类型变量，不能随意写在普通泛型约束中。推断出的变量可以在真分支中使用：

```typescript
type ArrayElement<T> = T extends readonly (infer Element)[]
  ? Element
  : T;

type NumberElement = ArrayElement<readonly number[]>; // number
type PlainString = ArrayElement<string>; // string
```

`infer` 只参与编译阶段的类型计算，不会生成运行时代码。TypeScript 4.7 起还可以直接约束推断变量，例如只提取字符串类型的元组首项：

```typescript
type FirstString<T> = T extends readonly [
  infer First extends string,
  ...unknown[],
]
  ? First
  : never;

type StringHead = FirstString<readonly ["hello", 1]>; // "hello"
type NonStringHead = FirstString<readonly [1, "hello"]>; // never
```

### 提取 Promise 兑现值类型

下面的 `UnwrapPromise` 匹配一层 `PromiseLike<T>`；不匹配时保留原类型。`DeepUnwrapPromise` 会递归提取嵌套的兑现值类型。

```typescript
interface AsyncUser {
  name: string;
  age: number;
}

type UnwrapPromise<T> = T extends PromiseLike<infer Value>
  ? Value
  : T;

type DeepUnwrapPromise<T> = T extends PromiseLike<infer Value>
  ? DeepUnwrapPromise<Value>
  : T;

type OneLevelUser = UnwrapPromise<Promise<AsyncUser>>; // AsyncUser
type NestedPromise = Promise<Promise<AsyncUser>>;
type DeepUser = DeepUnwrapPromise<NestedPromise>; // AsyncUser
type PreservedNumber = UnwrapPromise<number>; // number

type BuiltInDeepUser = Awaited<NestedPromise>; // AsyncUser
```

实际项目通常应优先使用内置的 `Awaited<T>`。它用于模拟 `await` 的递归展开行为，并且还定义了 `null`、`undefined` 和 thenable 等情况的处理规则。

### 多个候选位置中的推断

当同一个推断变量出现在多个协变候选位置时，候选类型可能合并为联合类型。关键是多个位置必须使用同一个 `infer U`；分别声明不同变量只会分别得到各自的类型。

```typescript
type CovariantCandidates<T> = T extends {
  first: infer U;
  second: infer U;
}
  ? U
  : never;

type SameCandidate = CovariantCandidates<{
  first: string;
  second: string;
}>; // string

type UnionCandidate = CovariantCandidates<{
  first: string;
  second: number;
}>; // string | number
```

当同一个推断变量出现在多个函数参数等逆变候选位置时，候选类型可能合并为交叉类型。互不相容的原始类型形成交叉后，结果可能化简为 `never`。

```typescript
type ContravariantCandidates<T> = T extends {
  first: (value: infer U) => void;
  second: (value: infer U) => void;
}
  ? U
  : never;

type SharedParameter = ContravariantCandidates<{
  first: (value: string) => void;
  second: (value: string) => void;
}>; // string

type ImpossibleParameter = ContravariantCandidates<{
  first: (value: string) => void;
  second: (value: number) => void;
}>; // string & number，化简为 never
```

对具有多个调用签名的函数类型进行推断时，TypeScript 通常从最后一个签名推断，不会根据参数列表执行重载解析：

```typescript
interface Formatter {
  (value: string): number;
  (value: number): string;
  (value: string | number): string | number;
}

type InferReturn<T> = T extends (...args: any[]) => infer Result
  ? Result
  : never;

type FormatterReturn = InferReturn<Formatter>; // string | number
```

### 条件类型的分布行为

当条件类型左侧是裸类型参数时，联合类型会逐项进入条件类型。用方括号包住 `extends` 两侧，可以关闭这种分布行为。

```typescript
type ToArray<T> = T extends unknown ? T[] : never;
type DistributedArray = ToArray<string | number>;
// string[] | number[]

type ToArrayWithoutDistribution<T> = [T] extends [unknown]
  ? T[]
  : never;
type CombinedArray = ToArrayWithoutDistribution<string | number>;
// (string | number)[]
```

## 32. 使用 `infer` 提取元组类型

下面四个工具都接受可变或只读元组。`First` 和 `Last` 提取元素类型，`Shift` 和 `Pop` 返回移除元素后的新可变元组。

```typescript
type ExampleTuple = readonly ["a", "b", "c"];

type First<T extends readonly unknown[]> =
  T extends readonly [infer FirstElement, ...unknown[]]
    ? FirstElement
    : never;

type Last<T extends readonly unknown[]> =
  T extends readonly [...unknown[], infer LastElement]
    ? LastElement
    : never;

type Shift<T extends readonly unknown[]> =
  T extends readonly [unknown, ...infer Rest]
    ? Rest
    : [];

type Pop<T extends readonly unknown[]> =
  T extends readonly [...infer Rest, unknown]
    ? Rest
    : [];

type FirstResult = First<ExampleTuple>; // "a"
type LastResult = Last<ExampleTuple>; // "c"
type ShiftResult = Shift<ExampleTuple>; // ["b", "c"]
type PopResult = Pop<ExampleTuple>; // ["a", "b"]

type EmptyFirst = First<[]>; // never
type EmptyLast = Last<[]>; // never
type EmptyShift = Shift<[]>; // []
type EmptyPop = Pop<[]>; // []
```

## 33. 使用 `infer` 递归处理元组

递归条件类型可以逐项拆分有限元组。下面的实现接受可变或只读输入，并返回一个新的可变元组；普通数组没有可递归确定的有限长度，因此保持原类型。

```typescript
type ReverseTuple<T extends readonly unknown[]> =
  number extends T["length"]
    ? T
    : T extends readonly [infer First, ...infer Rest]
      ? [...ReverseTuple<Rest>, First]
      : [];

type NumberTuple = readonly [1, 2, 3, 4];
type ReversedNumberTuple = ReverseTuple<NumberTuple>;
// [4, 3, 2, 1]

type PreservedArray = ReverseTuple<string[]>;
// string[]；普通数组不进行有限元组递归
```

递归条件类型只在编译阶段计算。复杂递归会增加类型检查开销，并可能达到编译器的递归深度限制，因此应把它用于边界清晰的类型转换，避免在大型公开类型中进行无界递归。

## 34. 插件编写（待补充）

原知识库只保留了“插件编写”的占位，没有注明插件所属的平台、使用场景或 API。由于无法判断这里计划介绍的是 Vite、TypeScript、Vue 还是其他插件，本节暂不编造正文，等待主题明确后再补充。

## 35. `keyof` 类型运算符

`keyof T` 会产生能够用于访问类型 `T` 的属性键类型。对于具有明确属性的对象，它通常是字符串、数字字面量或 `unique symbol` 组成的联合类型；索引签名、数组、元组、联合类型等情况还会影响最终结果。

`keyof` 只参与编译阶段的类型计算，不会在运行时读取或枚举对象。可选和只读修饰符会影响属性的使用方式，但相应属性仍然属于 `keyof T`。

### 基本用法

```typescript
interface KeyofPerson {
  readonly id: string;
  name: string;
  age: number;
  nickname?: string;
}

type PersonKeys = keyof KeyofPerson;
// "id" | "name" | "age" | "nickname"

type PersonValues = KeyofPerson[PersonKeys];
// string | number | undefined
```

`KeyofPerson[PersonKeys]` 是索引访问类型：使用键联合依次访问属性后，会得到所有属性值类型组成的联合类型。

### 从运行时值取得键类型

先用 `typeof` 取得值的静态类型，再使用 `keyof` 取得键类型：

```typescript
const applicationSettings = {
  theme: "dark",
  pageSize: 20,
  compact: true,
};

type ApplicationSettings = typeof applicationSettings;
type ApplicationSettingKeys = keyof ApplicationSettings;
// "theme" | "pageSize" | "compact"
```

### 字符串、数字与 symbol 键

JavaScript 的属性键可以是字符串或 symbol；数字形式的属性访问会转换为字符串。TypeScript 在类型层面保留字符串、数字字面量和 `unique symbol`，以便准确描述不同声明方式。

```typescript
type NumericProperties = {
  0: string;
  1: string;
};

type NumericPropertyKeys = keyof NumericProperties; // 0 | 1

declare const tokenKey: unique symbol;

interface SymbolKeyedRecord {
  id: number;
  [tokenKey]: string;
}

type SymbolKeyedRecordKeys = keyof SymbolKeyedRecord;
// "id" | typeof tokenKey

type AnyPropertyKey = keyof any;
// string | number | symbol，与内置 PropertyKey 含义相同

type UnknownPropertyKey = keyof unknown; // never
```

### 索引签名

字符串索引签名的键类型是 `string | number`，因为 `object[0]` 与 `object["0"]` 在运行时会访问同一个属性。只有数字索引签名时，键类型以 `number` 为主，显式声明的其他属性会另外进入键联合。

```typescript
interface BooleanDictionary {
  [key: string]: boolean;
}

type BooleanDictionaryKeys = keyof BooleanDictionary;
// string | number

interface NumberDictionary {
  [index: number]: string;
  length: number;
}

type NumberDictionaryKeys = keyof NumberDictionary;
// number | "length"
```

### 数组与元组

数组键包括数字索引以及当前标准库声明提供的属性和方法，不应把它们手写成一份固定列表。元组还包含与具体位置有关的键。需要取得数组或元组的元素类型时，通常使用 `T[number]`。

```typescript
type TextArrayKeys = keyof string[];

type Coordinate = readonly [number, number];
type CoordinateKeys = keyof Coordinate;
type CoordinateElement = Coordinate[number]; // number
```

原始类型 `string` 的 `keyof` 也来自标准库对字符串成员的声明，具体成员可能随所选 `lib` 变化，因此不适合把 `length`、`charAt` 等少数成员写成固定完整结果。

### 泛型键约束与索引访问

`K extends keyof T` 把键参数限制为对象允许的键，`T[K]` 则根据具体键取得对应的属性类型。读取可选属性时，返回类型会包含 `undefined`。

```typescript
function getProperty<
  T extends object,
  K extends keyof T,
>(object: T, key: K): T[K] {
  return object[key];
}

function setProperty<
  T extends object,
  K extends keyof T,
>(object: T, key: K, value: T[K]): void {
  object[key] = value;
}

const selectedPerson: KeyofPerson = {
  id: "user-1",
  name: "张三",
  age: 18,
};

const selectedName = getProperty(selectedPerson, "name");
// string

const selectedNickname = getProperty(selectedPerson, "nickname");
// string | undefined

setProperty(selectedPerson, "age", 19);

// @ts-expect-error "missing" 不是 KeyofPerson 的键
getProperty(selectedPerson, "missing");

// @ts-expect-error age 属性需要 number
setProperty(selectedPerson, "age", "19");
```

### `keyof` 与运行时键枚举

`Object.keys()` 返回对象自有、可枚举的字符串键，不包含 symbol 键和不可枚举属性；它的返回类型通常是 `string[]`。`keyof T` 描述的是静态类型允许访问的键，不表达属性在运行时是否自有、可枚举，也不保证运行时对象没有额外属性。因此二者不能直接视为同一个操作。

### 联合类型、交叉类型与类

对于联合类型，只能安全访问每个成员都拥有的共有键；对于交叉类型，结果通常包含各组成类型的键。

```typescript
interface IdentifiedRecord {
  id: string;
  createdAt: Date;
}

interface NamedRecord {
  id: string;
  name: string;
}

type UnionRecordKeys = keyof (IdentifiedRecord | NamedRecord);
// "id"

type IntersectionRecordKeys = keyof (IdentifiedRecord & NamedRecord);
// "id" | "createdAt" | "name"

class ApiServiceForKeys {
  static version = "1.0";

  endpoint = "/api";
  private secret = "internal";

  connect(): void {
    console.log(this.endpoint);
  }
}

type ServiceInstanceKeys = keyof ApiServiceForKeys;
// 公开实例成员 endpoint | connect，不包含 private secret

type ServiceConstructorKeys = keyof typeof ApiServiceForKeys;
// 类值一侧的键，其中包含公开静态成员 version
```

## 36. 映射类型

映射类型使用 `[Property in Keys]` 遍历属性键联合，并为每个键生成属性。键可以来自 `keyof T`，也可以来自任意 `PropertyKey` 联合。

### 保留键并转换属性值

```typescript
interface FeatureSet {
  darkMode: () => void;
  newUserProfile: () => void;
}

type FeatureFlags<T> = {
  [Property in keyof T]: boolean;
};

type ApplicationFeatureFlags = FeatureFlags<FeatureSet>;
// { darkMode: boolean; newUserProfile: boolean }

type FeatureFunction = FeatureSet[keyof FeatureSet];
// () => void

type RouteName = "home" | "settings";

type RouteTable = {
  [Route in RouteName]: `/${Route}`;
};
// { home: "/home"; settings: "/settings" }
```

### 映射修饰符

直接使用 `[Property in keyof T]` 的同态映射通常会保留来源属性的 `readonly` 和可选修饰符。使用 `+` 可以显式添加修饰符，使用 `-` 可以移除修饰符；省略前缀时默认为添加。

```typescript
type CustomReadonly<T> = {
  readonly [Property in keyof T]: T[Property];
};

type MutableRequired<T> = {
  -readonly [Property in keyof T]-?: T[Property];
};

type ReadonlyPartial<T> = {
  +readonly [Property in keyof T]+?: T[Property];
};

interface DraftAccount {
  readonly id: string;
  name?: string;
}

type EditableAccount = MutableRequired<DraftAccount>;
// { id: string; name: string }

type LockedDraftAccount = ReadonlyPartial<EditableAccount>;
// { readonly id?: string; readonly name?: string }
```

### 键重映射与过滤

TypeScript 4.1 起可以使用 `as` 重命名键。模板字面量只能直接处理字符串，因此下面先用 `Property & string` 排除数字和 symbol 键。把重映射结果改成 `never`，可以过滤对应属性。

```typescript
type GetterMethods<T> = {
  [Property in keyof T as `get${Capitalize<Property & string>}`]:
    () => T[Property];
};

interface ProductRecord {
  kind: "product";
  id: number;
  name: string;
}

type ProductGetters = GetterMethods<ProductRecord>;
// getKind、getId、getName

type RemoveKind<T> = {
  [Property in keyof T as Property extends "kind"
    ? never
    : Property]: T[Property];
};

type ProductWithoutKind = RemoveKind<ProductRecord>;
// { id: number; name: string }
```
