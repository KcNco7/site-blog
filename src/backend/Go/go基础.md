# go语言教程

## 模块（go.mod）

Go module 是一组一起进行版本管理的包，由 `go.mod` 文件定义。一个代码仓库可以只有一个 module，也可以包含多个 module；一个 module 内也可以包含多个命令和包，因此“项目”和 module 不是严格的一一对应关系。

```go
module test-demo       // 模块路径，也是其他代码导入时的前缀
go 1.26                // 模块要求的最低 Go 语言版本
```

`go` 指令会影响语言语义和 Go 命令对最低版本的判断，但它不等同于记录当前实际执行的工具链版本；需要建议具体工具链时可使用 `toolchain` 指令。

- `go mod init <模块名>` — 初始化一个新模块
- `go mod tidy` — 自动添加/移除依赖
- 同一模块内的包通过 `模块名/包路径` 导入，例如 `import "test-demo/包名"`

> 本文所有示例都在 `package main` 下，后续学习多包时需注意模块的概念。
>
> ⚠️ **运行提示**：各章节示例代码都是独立的 `package main` + `func main`，若直接全部放到同一目录编译会报 `main redeclared` 错误。想实际运行某段示例时，请把它的代码单独放到一个子目录中（例如 `test-demo/ch03/main.go`），每个子目录就是一个可独立运行的小程序。

## 基础语法

```go
package main // 包

// import是导入关键字，后面跟着的是被导入的包名。
import (
	"fmt"
)

func main() {
	fmt.Println("Hello 世界!") // 打印语句
	var age int              // 声明
	var name = "111"         // 声明并赋值 可以省略类型 自己推断
	fmt.Println(name)
	fmt.Println(age)
	table := "xxx" // 声明并赋值 短声明符号 只能在局部变量
	fmt.Println(table)
	inputOutput()
	var a1, a2 = 1, 2 // 一次赋值多个
	fmt.Println(a1, a2)
    // 包级标识符、字段或方法的名称以 Unicode 大写字母开头时为 exported，
    // 可被其他包引用；其余名称不导出，但仍可在同一包内访问。
	// 注意：下划线 _ 开头的是空标识符，与访问权限无关
}
func inputOutput() {
	fmt.Println("init")
	// 格式化输出 不换行 %s %d %f
	// %T 打印类型
	// %v 任意类型（默认格式）
	// %#v 打印值的 Go 语法表示，例如字符串会带引号 "1111"
	fmt.Printf("%s 哇,1111", "2222")
	// 格式化后赋值
	var f = fmt.Sprintf("%s 哇,1111", "2222")

	var xxx string
	// Scan 从标准输入读取，返回值 n 是成功扫描的项数，err 是错误
	n, err := fmt.Scan(&xxx) // & 是取地址运算符，获取变量的内存地址
	fmt.Println(f, xxx, n, err)
}
```

## 基本类型

### 整数型

1. 整数字面量本身通常是无类型常量；进入需要具体类型的上下文后，未显式指定类型时常默认推断为 `int`
2. `uint` 等无符号整数可以表示零和正整数，不能表示负数
3. 后面的数字就是2进制的位数
4. uint8还有一个别名 byte， 一个字节=8个bit位
5. int类型的大小取决于所使用的平台

### 浮点型

默认是float64

1. float32的浮点数的最大范围约为3.4e38，可以使用常量定义：`math.MaxFloat32`
2. float64的浮点数的最大范围约为 1.8e308，可以使用一个常量定义：`math.MaxFloat64`

### rune（Unicode 码点）

> byte 等同于 uint8

1. `byte` 是 `uint8` 的别名，通常用于表示原始字节；一个 UTF-8 字符可能由多个 byte 编码
2. `rune` 是 `int32` 的别名，用于表示一个 Unicode 码点；码点不等同于用户看到的完整字符（例如某些字符由多个码点组合）

```go
package main // 包
import "fmt"

func main() {
	var a byte = 'a'
	var r rune = '中'
	// a 97 uint8
	fmt.Printf("%c %d %T\n", a, a, a)
	fmt.Printf("%c %U %T\n", r, r, r)
}

```

### 字符串

- 多行字符串用**反引号** `` ` `` 包裹（原样输出，不支持转义）
- 双引号字符串支持转义字符

转义字符:

- `\n` 换行（光标移到下一行开头）
- `\r` 回到行首（回车，光标回到当前行开头，不换行）
- `\"` 在双引号里面套双引号
- `\t` 制表符
- `\\` 反斜杠 (windows路径)

### 布尔类型

1. 默认为false
2. 不能强制转换
3. 不能参与运算 不能类型转换

### 零值问题

声明变量而不赋值，Go 会给每个变量一个默认的**零值**：

| 类型                                 | 零值           |
| ------------------------------------ | -------------- |
| 数值类型（int, float 等）            | 0              |
| bool                                 | false          |
| string                               | ""（空字符串） |
| 指针、切片、map、channel、接口、函数 | nil            |

### 常量

- 常量可以用作枚举
- 未显式声明类型的常量是无类型常量，能够在其值可表示的前提下适配不同的数值类型；把它赋给变量或传入需要具体类型的上下文时才会发生默认类型推断或转换

```go
const (
    Unknown = 0
    Female = 1
    Male = 2
)

// iota的使用
const (
	a, b = iota + 1, iota + 2 // iota = 0，a = 1，b = 2
	c, d                      // iota = 1，c = 2，d = 3
	e, f                      // iota = 2，e = 3，f = 4
	g, h = iota * 2, iota * 3 // iota = 3，g = 6，h = 9
	i, k                      // iota = 4，i = 8，k = 12
)
```

- 可以使用 `iota`关键字

> 💡 **省略表达式的行**：当某行省略表达式时（如上面的 `c, d`），它会**复用上一行的表达式模板**，但 `iota` 的值会自增。所以 `c, d` 等价于 `iota + 1, iota + 2`（此时 `iota=1`，得到 `c=2, d=3`）。`i, k` 同理复用 `iota * 2, iota * 3`（`iota=4`，得到 `i=8, k=12`）。

---

## 数组、切片与 map

### 数组

固定长度 用得少

```go
func main() {
	var nameList = [3]string{"aaa", "bbb", "ccc"}
	// bbb
	fmt.Println(nameList[1])
	// 不支持负向索引
	fmt.Println(nameList[len(nameList)-1])
}
```

### 切片

```go
func main() {
	// === 切片的几种创建方式 ===
	// 方式1：make([]T, len)
	// 这里 len=0、cap=0；实现不必为它分配可用的底层数组。
	// nil 切片同样可以安全 append，是否使用 make 取决于是否要预设长度或容量。
	var nameList []string = make([]string, 0)
    // nameList := make([]int, 3) // 空间3 初始化值0 让:=自动推导为切片

	// 方式2：字面量 —— 带初始元素，编译期确定底层数组，len=cap=3
	var list []string = []string{"1", "2", "3"}

	// 方式3：空字面量 —— 空切片（不是 nil 切片），len=0, cap=0，本身不是 nil，可 append
	list1 := []string{}

	fmt.Println(list)     // [1 2 3]
	fmt.Println(list1)    // []        空切片，打印空方括号
	fmt.Println(nameList) // []        make 出来的空切片，也是 []

	// append 往尾部追加，返回新切片（必须用返回值接住）
	// nameList 原 cap=0，这里会触发扩容，开辟新的底层数组
	nameList = append(nameList, "111", "222")
	fmt.Println(nameList) // [111 222]

	// make([]T, len) 不给第三参数 cap 时 cap=len
	// 这里 len=3，得到 [0 0 0]：长度 3，每个元素是 int 的零值 0
	age := make([]int, 3) // [0 0 0]
	fmt.Println(age)

	// 补充：make 还可指定容量 make([]T, len, cap)
	// age2 := make([]int, 3, 5) // len=3（可访问 3 个 0），cap=5（预留位置，减少扩容次数）
}
```

#### 切片的容量、追加与截取

```go
package main

import "fmt"

func main() {

	/**
	len 长度
	cap 容量
	*/

	var numbers = make([]int, 3, 5)
	fmt.Printf("len = %d, cap = %d, slice = %v\n\n", len(numbers), cap(numbers), numbers)
	// 长度 len = 3, 容量 cap = 5, 值 slice = [0 0 0]

	// 向numbers切片追加一个元素1
	// len = 4, cap = 5, slice = [0 0 0 1]
	numbers = append(numbers, 1)
	fmt.Printf("len = %d, cap = %d, slice = %v\n\n", len(numbers), cap(numbers), numbers)

	// 向numbers切片追加一个元素2
	// len = 5, cap = 5, slice = [0 0 0 1 2]
	numbers = append(numbers, 2)
	fmt.Printf("len = %d, cap = %d, slice = %v\n\n", len(numbers), cap(numbers), numbers)

	// 向 numbers 切片追加一个元素 3，超过原容量后会扩容。
	// 新容量由运行时实现决定，不应依赖它恰好翻倍为 10。
	numbers = append(numbers, 3)
	fmt.Printf("len = %d, cap = %d, slice = %v\n\n", len(numbers), cap(numbers), numbers)

	/**
	切片截取
	*/
	s := []int{1, 2, 3} // len = 3 cap = 3
	s1 := s[0:2]        // [0, 2)
	fmt.Println(s1)     // [1 2]

	// 浅拷贝
	s1[0] = 100
	fmt.Println(s)  // [100 2 3]
	fmt.Println(s1) // [100 2]

	// copy 会复制切片元素；对 int 这类值元素，结果拥有独立的底层数组。
	// 若元素内部仍含指针、切片或 map，copy 不会递归复制其指向的数据。
	s2 := make([]int, 3) //[0, 0, 0]
	copy(s2, s)          // s --> s2
	fmt.Println(s2)      // [100 2 3]
}
```

### map

```go
func main() {
	// 声明方式1：make
	var m1 map[string]int = make(map[string]int)
	m1["a"] = 1
	m1["b"] = 2
	fmt.Println(m1) // map[a:1 b:2]

	// 也可以只声明 不赋值
	var myMap3 map[string]string
	_ = myMap3 // 仅演示 nil map；局部变量必须被使用

	// 声明方式2：字面量
	m2 := map[string]string{
		"name": "Alice",
		"city": "Beijing",
	}
	fmt.Println(m2["name"])

	// 添加 修改（在已初始化的 m2 上操作）
	m2["Japan"] = "Tokyo"
	fmt.Println(m2["Japan"]) // Tokyo

	// 遍历
	for key, value := range m2 {
		fmt.Println(key, value)
	}

	// 删除 key （删掉刚才加的 Japan，再删 city）
	delete(m2, "Japan")
	delete(m2, "city")
	fmt.Println(m2) // map[name:Alice]

	// 读取不存在的 key 返回零值
	v := m2["age"] // ""
	fmt.Println(v)

	// 判断 key 是否存在
	val, ok := m2["age"]
	if !ok {
		fmt.Println("key age 不存在") // 走这里
	}
	_ = val


}
```

> 注意：map 的零值是 nil，向 nil map 写入会 panic，必须先用 make 初始化。

---

## 函数

- 多返回值
- 命名返回值

```go
func main() {
	c := test1("a", 111)
	fmt.Println(c)
	run1, run2 := manyReturn("xxx", 999)
	fmt.Println(run1, run2)
	x, y := manyReturn2(3, 4)
	fmt.Println(x, y)
}

// 基本用法
func test1(a string, b int) int {
	fmt.Println(a)
	fmt.Println(b)
	c := 100
	return c
}

// 多返回值
func manyReturn(a string, b int) (int, int) {
	fmt.Println(a)
	fmt.Println(b)
	return 111, 222
}

/*
*
多返回值 返回值命名
如果不给x y赋值 x y在函数内部 默认为零值
x y的作用域在整个manyReturn2函数内部
*/
func manyReturn2(a int, b int) (x int, y int) {
	fmt.Println(a + b)
	x = 222
	y = 999
	return
	// 也可以是 return 222,999
}
```

### 多返回值 vs 命名返回值 详解

#### 1. 普通多返回值 `(int, int)`

返回值列表只有类型、没名字，是**匿名**的。函数里必须 `return 值1, 值2` 把值「塞」进去：

- 个数必须一一对应（声明 2 个就 return 2 个，否则编译报错）
- 顺序对应：`return A, B` → 第一个返回值是 A，第二个是 B
- 函数内部**碰不到**「返回值变量」

最常见的用法是 **(结果, 错误)** 模式，例如 `n, err := fmt.Scan(&xxx)`。

#### 2. 命名返回值 `(x int, y int)`

返回值不光有类型，还有**名字**。本质上 Go 会在**函数一开始**就自动声明这两个变量并**赋零值**，相当于函数体最前面偷偷做了：

```go
var x int  // = 0
var y int  // = 0
```

`x`、`y` 就像普通局部变量，作用域是整个函数：可以赋值、读取、参与运算。

- **不赋值就 return** → 返回零值（int 就是 0）
- **赋值后 `return`（裸 return）** → 自动返回 x、y 当前的值
- **也可以 `return 222, 999`** → 显式给出值，会覆盖 x、y（两种写法结果一样）

裸 return 对照表：

| 写法                  | 匿名 `(int, int)`     | 命名 `(x int, y int)`   |
| --------------------- | --------------------- | ----------------------- |
| `return 222, 999`     | ✅ 显式给值           | ✅ 也可，会覆盖 x、y    |
| `return`（裸 return） | ❌ 编译错误，必须给值 | ✅ 自动返回 x、y 当前值 |

#### 3. 为什么要用命名返回值

- **配合 defer 修改返回值**（最实用）：defer 能改命名返回值，因为它是真实存在的变量；匿名返回值 defer 抓不到、改不了。
- **裸 return 简化长函数**：省得每次把一堆变量名重抄一遍。
- **自文档化**：如 `func Read() (n int, err error)` 中的 `n` 暗示「读到的字节数」，比 `(int, error)` 更易读。

#### 4. 坑：命名返回值会被遮蔽（shadowing）

命名返回值用 `=` 赋值最保险；若在内层块里用 `:=` 会**新建**局部变量、遮蔽外层的命名返回值，导致裸 return 返回的是外层那个（可能不是你以为的值）：

```go
func bad() (x int) {
    x = 5
    if true {
        x := 10     // ⚠️ 新建了一个局部 x，和外层命名返回值 x 不是同一个
        _ = x
    }
    return          // 裸 return 返回外层 x = 5，不是 10
}
```

#### 一句话总结

- **`(int, int)`** = 匿名多返回值，必须 `return 值1, 值2`，函数内碰不到返回值变量。
- **`(x int, y int)`** = 命名返回值，函数开头就存在（零值），可用 `=` 赋值，`return` 裸写自动返回它们；主要用在 defer 修改返回值、裸 return 简化、自文档化三种场景。

### `init` 函数

`init` 是 Go 的特殊函数：**每个包可以有多个 init，在 main 之前自动执行，不能手动调用**。

```go
package main

import "fmt"

func init() {
	fmt.Println("init 1 先执行")
}

func init() {
	fmt.Println("init 2 后执行（同一文件内从上到下）")
}

func main() {
	fmt.Println("main 最后执行")
}
// 输出：
// init 1 先执行
// init 2 后执行
// main 最后执行
```

> 应用场景：初始化配置、注册驱动、校验环境变量等。
> 同一文件内多个 `init` 按出现顺序执行；同一包跨文件的初始化顺序不应依赖文件名，Go 规范只鼓励构建系统按词法文件名顺序向编译器提供文件。包之间会先初始化被依赖的包，再初始化当前包。

## 错误处理（error）

Go 没有 `try/except` 异常机制。错误就是一个普通的**返回值**，类型是内置接口 `error`：

```go
type error interface {
    Error() string
}
```

惯用法是**多返回值 (结果, 错误)**：成功时 `err == nil`，失败时 `err != nil`。调用方通常应检查错误；若确实有意忽略，也应使用 `_` 或注释明确表达意图。

### 创建错误 — `errors.New` / `fmt.Errorf`

```go
package main

import (
	"errors"
	"fmt"
)

// 一个会失败的函数
func divide(a, b int) (int, error) {
	if b == 0 {
		return 0, errors.New("除数不能为零") // 简单字符串错误
	}
	return a / b, nil // 成功返回 nil
}

func main() {
	result, err := divide(10, 0)
	if err != nil {
		fmt.Println("出错了:", err) // 出错了: 除数不能为零
		return
	}
	fmt.Println("结果:", result)
}
```

### 错误包装 — `fmt.Errorf("%w")`

下层函数返回的错误，上层不要原样抛，而应该**加上自己的上下文**再往外传，这样排错时能看到完整的调用链。用 `%w` 包装（不是 `%s`）：

```go
func readConfig(path string) error {
	file, err := os.Open(path)
	if err != nil {
		// %w 把原始 err 包进去，保留它的类型信息
		return fmt.Errorf("读取配置 %s 失败: %w", path, err)
	}
	defer file.Close()
	return nil
}
```

> `%w`（wrap）和 `%s`/`%v` 的区别：`%w` 包裹的错误**还能被 `errors.Is/As` 识别**；`%s`/`%v` 只把文本写入新错误。调用方需要检查底层错误时使用 `%w`；若有意隐藏底层错误身份，则不要包装。

### 判断错误 — `errors.Is` 与 `errors.As`

| 函数                      | 用途                                                                       | 对比对象            |
| ------------------------- | -------------------------------------------------------------------------- | ------------------- |
| `errors.Is(err, target)`  | 沿错误链判断是否匹配目标；除可比较值相等外，也会调用错误自定义的 `Is` 方法 | 一个具体的 error 值 |
| `errors.As(err, &target)` | 判断 err 链里**是否能赋值给**某个类型，并取出它                            | 一个 error **类型** |

**哨兵错误**（预定义的错误值，用于 `==` 比较）：

```go
var ErrNotFound = errors.New("not found")

func findUser(id int) error {
	if id != 1 {
		return ErrNotFound
	}
	return nil
}

func main() {
	err := findUser(2)
	// 即使 err 被中间层 %w 包装过，errors.Is 也能穿透包装链找到 ErrNotFound
	if errors.Is(err, ErrNotFound) {
		fmt.Println("用户不存在")
	}
}
```

**自定义错误类型**（携带更多字段，用 `errors.As` 提取）：

```go
type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("%s: %s", e.Field, e.Message)
}

func main() {
	err := fmt.Errorf("保存用户失败: %w", &ValidationError{
		Field: "email", Message: "格式不正确",
	})

	var ve *ValidationError
	if errors.As(err, &ve) {
		fmt.Println("字段非法:", ve.Field, ve.Message)
	}
}
```

### panic / recover —— 仅限真异常

`error` 是**正常的失败**（文件打不开、网络超时），`panic` 是**不该发生的事**（数组越界、nil 解引用）。`panic` 会一路向上崩，直到被 `recover` 接住（通常在 defer 里），否则程序退出。

```go
func safeDiv(a, b int) (result int, err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("recovered: %v", r) // 把 panic 转成 error 返回
		}
	}()
	return a / b, nil // b=0 会 panic
}
```

> 可预期的失败优先返回 `error`。`panic` 更适合程序无法继续维持不变量的情况；库代码通常不应把普通输入错误当作 panic。

### 一句话总结

- 错误是返回值，**必检 `if err != nil`**。
- 往上抛要加上下文：`fmt.Errorf("...: %w", err)`。
- 比较错误：值用 `errors.Is`，类型用 `errors.As`。
- `panic/recover` 只给真正的程序错误，日常逻辑用 `error`。

## 包与导入

Go中如果导包不使用, 编译会报错. 匿名导包不使用就不会报错

```go
import (
	"lib0" // 正常导入
	_ "lib1" // 匿名
	mylib2 "lib2" // 别名
	. "lib3" // 不再需要 "包名.方法名" 直接使用方法名即可 尽量不使用 容易出现同名
)
```

---

## 指针

Go 有指针，但没有指针运算（不像 C）。指针保存值的**内存地址**。

### 基本语法

```go
func main() {
    // === 声明与取值 ===
    var x int = 10
    var p *int = &x // & 取地址，p 是指向 int 的指针

    fmt.Println(p)  // 0xc0000... 内存地址
    fmt.Println(*p) // 10  * 解引用，获取指针指向的值

    *p = 20         // 通过指针修改值
    fmt.Println(x)  // 20  原变量也被修改了

    // === 声明指针 ===
    var ptr *int         // 声明一个指向 int 的指针（零值是 nil）
    num := 42
    ptr = &num           // ptr 指向 num
    fmt.Println(*ptr)    // 42
    *ptr = 100           // 通过指针修改值
    fmt.Println(num)     // 100
}
```

### 图解

```
变量内存
┌──────────┬─────────────┐
│ 变量名    │ 值           │
├──────────┼─────────────┤
│ num      │ 42          │  ← 普通变量
│ p        │ 0xc000...   │  ← 指针变量，存储 num 的地址
└──────────┴─────────────┘
              │
              └──→ num = 42  （p 指向 num）
```

### 指针的作用

#### 1. 修改外部变量

```go
func changeVal(val int) {
    val = 100  // ❌ 只修改副本，不影响外面的变量
}

func changePtr(ptr *int) {
    *ptr = 100 // ✅ 通过指针修改原变量
}

func main() {
    num := 1
    changeVal(num)
    fmt.Println(num)  // 1（没变）

    changePtr(&num)
    fmt.Println(num)  // 100（变了）
}
```

#### 2. 避免拷贝大对象

```go
type BigStruct struct {
    Data [1024 * 1024]byte
}

// ❌ 每次调用拷贝 1MB
func process(b BigStruct) {}

// ✅ 只复制一个指针值；指针大小取决于目标体系结构，通常是一个机器字
func process(b *BigStruct) {}
```

#### 3. 方法接收者（值接收者 vs 指针接收者）

```go
type User struct {
    Name string
}

// 值接收者 — 读取或修改副本
func (u User) DisplayName() string {
    return u.Name
}

// 指针接收者 — 可以修改原对象
func (u *User) Rename(name string) {
    u.Name = name  // ✅ 修改原对象
}
```

同一个基础类型不能仅靠值接收者与指针接收者来“重载”两个同名方法；上例因此使用了不同的方法名。

| 接收者        | 方法集                              |
| ------------- | ----------------------------------- |
| 值类型 `T`    | 只包含值接收者的方法                |
| 指针类型 `*T` | 包含值接收者 + 指针接收者的所有方法 |

### 常见陷阱

#### 1. nil 指针

```go
var p *int         // p = nil
fmt.Println(*p)    // panic: nil pointer dereference
```

#### 2. 循环变量指针

```go
nums := []int{1, 2, 3}
var ptrs []*int

// ✅ Go 1.22+ 的写法 —— 直接取地址即可
for _, n := range nums {
    ptrs = append(ptrs, &n)
}
// ptrs[0] -> 1, ptrs[1] -> 2, ptrs[2] -> 3 ✅
```

> ⚠️ **版本差异**：在 **Go 1.22 之前**，`for` 的循环变量 `n` 在整个循环里是**同一个变量**，每次迭代只是被重新赋值。如果直接 `&n`，所有指针都会指向同一个地址、最终都拿到最后一个值（3）。那时的正确做法是在循环体内 `n := n` 显式新建一个局部变量。
>
> **Go 1.22 起**，循环变量每次迭代都是**新建**的，所以 `&n` 天然安全，`n := n` 的技巧已经**不再需要**。本笔记基于 Go 1.26，直接用上面的写法即可。

### 与 C 指针的对比

| 特性            | Go                    | C                                  |
| --------------- | --------------------- | ---------------------------------- |
| 指针运算        | ❌ 不允许             | ✅ 允许                            |
| 空指针          | nil（解引用会 panic） | NULL（错误解引用会产生未定义行为） |
| 垃圾回收        | ✅ 自动管理           | ❌ 手动管理                        |
| 取地址 / 解引用 | `&` / `*`             | `&` / `*`                          |

> **一句话总结**：Go 不支持普通指针运算，并由垃圾回收器管理可达内存，但仍可能出现 nil 解引用、对象长期被引用造成的内存滞留，以及未关闭文件或连接等资源泄漏。`&` 取地址，`*` 解引用，指针零值是 `nil`。

## defer

`defer` 是什么, 函数结束时执行的语句, 和Java的`finally` 类似

延迟调用会在外围函数正常返回或发生 panic 时执行；`os.Exit` 会立即终止进程，不会执行尚未运行的 `defer`。

```go
func main() {
	// defer 在流程结束之前触发 可以有多个defer 压栈的形式
	defer fmt.Println("end1")
	defer fmt.Println("end2")

	fmt.Println("begin1")
	fmt.Println("begin2")
	// 结果
	//begin1
	//begin2
	//end2
	//end1
}
```

### defer 与 return 的执行顺序

return 分两步走：

1. **给返回值赋值**
2. **执行 defer**
3. **函数真正返回**

所以结论是：**return 的赋值先于 defer，但函数最终返回在 defer 之后**。

```go
func deferDemo() int {
	n := 1
	defer func() {
		n += 10 // 修改的是局部变量 n，不影响返回值
	}()
	return n // 这里是【未命名返回值】：return 时把 n 的当前值拷贝到临时返回值里，defer 改的是 n 本身，影响不到那个拷贝
}
// 结果为 1，不是 11
```

如果返回值是**命名返回值**，defer 可以修改它：

```go
func deferNamed() (result int) {
	defer func() {
		result += 10 // 命名返回值可以被 defer 修改
	}()
	return 1 // 这里是【命名返回值】result：return 时 1 赋给 result这个具名变量，defer 直接改 result，所以最终返回 11
}
// 结果为 11
```

---

## 结构体、方法与接口

### 结构体与方法

结构体用于组合字段，方法可以绑定到已定义类型。Go 没有 class 和传统继承体系，通常通过组合与接口组织行为。

```go
package main

import "fmt"

// 声明新的定义类型 myint；它与 int 具有相同底层类型，但不是别名
type myint int

// 定义一个结构体
type Book struct {
	title  string
	author string
}

func changeBook(book Book) {
	// 传递一个book的副本
	book.title = "new title"
}

func changeBook2(book *Book) {
	// 传递一个book的指针
	book.title = "new title 2"
	// 会改变
}

func main() {
	// 别名
	var a myint = 42
	fmt.Println(a)

	var book1 Book
	book1.title = "Go Programming Language"
	book1.author = "www.golang.org"
	fmt.Println(book1)
}
```

Go 中的结构体与方法：

```go
package main

import "fmt"

// Hero 名称已导出，其他包可以引用
type Hero struct {
	// 字段名大写表示已导出；小写字段可在同一个包内访问，而不是只在“类内部”访问
	Name  string
	Age   int
	Level int
}

// GetName (h Hero) 表示当前方法绑定到当前的Hero结构体
func (h *Hero) GetName() {
	fmt.Println(h.Name)
}

func main() {
	hero := Hero{
		Name:  "Bob",
		Age:   20,
		Level: 20,
	}
	hero.GetName()
}
```

### 结构体嵌入与组合

```go
package main

import "fmt"

// Human 名称已导出，其他包可以引用
type Human struct {
	// 小写字段 sex 在同一个包内可见
	Name string
	sex  string
}

func (h *Human) Eat() {
	fmt.Println("Human Eat")
}
func (h *Human) Walk() {
	fmt.Println("Human Walk")
}

// SuperHuman 嵌入 Human，属于组合，并会提升 Human 的字段和方法
type SuperHuman struct {
	Human
	level int
}

// Walk 与提升的方法同名时，选择 SuperHuman 自己声明的方法；这不是类继承中的 override
func (h *SuperHuman) Walk() {
	fmt.Println("Superman Walk")
}

func (h *SuperHuman) Fly() {
	fmt.Println("Superman Fly")
}

func main() {
	happy := Human{
		Name: "Bob",
		sex:  "female",
	}
	happy.Eat()
	happy.Walk()

	happy2 := Human{"zhangsan", "female"}
	happy2.Eat()
	happy2.Walk()

	// 创建组合类型
	cry := SuperHuman{
		Human{"Alex", "man"},
		88,
	}

	// 也可以这样 可读性比较高
	var said SuperHuman
	said.Name = "Frank"
	said.sex = "man"
	said.level = 1

	cry.Walk() // 调用 SuperHuman 自己的 Walk
	cry.Fly()  // 子类独有
	cry.Eat()  // 调用被提升的 Human.Eat

}
```

### 接口与多态

接口值由动态类型和动态值共同描述，但接口本身不能简单等同于指针。接口不要求父类或子类关系：函数接收接口值后，会根据传入值的动态类型调用相应方法。

> Go 的接口是**隐式实现**：不需要像 Java 那样写 `implements`，只要一个类型实现了接口里定义的**全部方法**，它就自动满足该接口。上面的 `*Cat` 和 `*Dog` 都实现了 `AnimalIF` 的三个方法，所以它们都是 `AnimalIF`。

```go
package main

import "fmt"

type AnimalIF interface {
	Sleep()
	GetColor() string
	GetType() string
}

type Cat struct {
	color string // 颜色
}

func (c *Cat) Sleep() {
	fmt.Println("Cat 正在睡觉")
}

func (c *Cat) GetColor() string {
	return c.color
}

func (c *Cat) GetType() string {
	return "Cat"
}

type Dog struct {
	color string
}

func (d *Dog) Sleep() {
	fmt.Println("Dog 正在睡觉")
}

func (d *Dog) GetColor() string {
	return d.color
}

func (d *Dog) GetType() string {
	return "Dog"
}

// showAnimal 接收的是接口类型 AnimalIF
// 传进来的是 *Cat 就走 Cat 的方法，传进来的是 *Dog 就走 Dog 的方法 —— 这就是多态
func showAnimal(a AnimalIF) {
	fmt.Printf("类型: %s, 颜色: %s\n", a.GetType(), a.GetColor())
	a.Sleep()
}

func main() {
	cat := &Cat{color: "red"}
	dog := &Dog{color: "black"}

	// 同一个 showAnimal 函数，传入不同实现，行为不同
	showAnimal(cat) // 类型: Cat, 颜色: red / Cat 正在睡觉
	showAnimal(dog) // 类型: Dog, 颜色: black / Dog 正在睡觉
}
```

### 空接口与 any

```go
package main

import (
	"fmt"
)

func myFunc(arg interface{}) {
	fmt.Println(arg)

	// 给interface 提供 类型断言 机制
	value, ok := arg.(string)
	if !ok {
		fmt.Println("arg is not a string")
	} else {
		fmt.Println("arg is string type = ", value)
	}
}

type Book struct {
	title string
}

func main() {

	book := Book{"Golang"}
	myFunc(book)
	myFunc(book.title)
	myFunc(100)
	myFunc("111")
	myFunc(3.14)
}
```

---

## 反射

普通变量具有编译期静态类型；接口值还携带动态类型和动态值（常被非正式地描述为一个 pair）。`reflect.TypeOf` 和 `reflect.ValueOf` 可以在运行时检查传入值的类型和值，但不能把“动态 pair”泛化成所有变量的统一运行时表示。

简单介绍pair:

```go
package main

import "fmt"

func main() {
	var a string

	// pair <static type:string, value:"hello world">
	a = "hello world"

	// pair <type:string, value:"hello world">
	var allType interface{}
	allType = a

	str, _ := allType.(string)
	fmt.Println(str)
}
```

另一个例子（具体值赋给接口后，接口记录其动态类型和值）：

```go
package main

import (
	"fmt"
	"io"
	"os"
)

func main() {
	// os.Stdin 在 Windows、macOS 和 Linux 上都是 *os.File；这里无需自行打开或关闭终端设备。
	var r io.Reader = os.Stdin
	fmt.Printf("动态类型: %T\n", r)
}
```

### reflect 包

```go
package main

import (
	"fmt"
	"reflect"
)

func reflectNum(arg interface{}) {
	fmt.Println(reflect.TypeOf(arg))  // type
	fmt.Println(reflect.ValueOf(arg)) // value
}

type User struct {
	Id   string
	Name string
	Age  int
}

func (u User) Call() {
	fmt.Println("user is called ...")
	fmt.Println(u)
}

func main() {
	//var num float64 = 1.23456
	//reflectNum(num)

	user := User{"1", "Jack", 34}
	DoFileAndMethod(user)
}

func DoFileAndMethod(input interface{}) {
	// 获取input的Type
	inputType := reflect.TypeOf(input)
	if inputType == nil || inputType.Kind() != reflect.Struct {
		fmt.Println("input 必须是非 nil 结构体值")
		return
	}
	fmt.Println(inputType.Name()) // User
	fmt.Println(inputType)        // main.User

	// 获取input的Value
	inputValue := reflect.ValueOf(input)
	fmt.Println(inputValue) // {1 Jack 34}

	// 通过type 获取里面的字段
	// 1. 获取interface的reflect.type 通过type得到NumField 进行遍历
	// 2.得到每个field 数据类型
	// 3. field的Interface()方法 得到对应的value
	for i := 0; i < inputType.NumField(); i++ {
		filed := inputType.Field(i)
		value := inputValue.Field(i).Interface()
		fmt.Println("----------------------")
		fmt.Println(filed.Name, filed.Type, value)
	}

	// 通过type 获取里面的方法 调用
	for i := 0; i < inputType.NumMethod(); i++ {
		method := inputType.Method(i)
		fmt.Println("********************")
		fmt.Println(method.Name, method.Type)
	}
}
```

### 结构体标签

#### 概念

标签是附加在结构体字段上的**元数据**，本身不影响程序运行，但可以通过**反射**读取，常用于给第三方库提供配置信息。

#### 标签格式

```go
`key1:"value1" key2:"value2"`
```

- 用反引号 `` ` `` 包裹
- 多个标签用空格分隔
- 每个标签是 `key:"value"` 格式
- 通过 `reflect` 读取：`tag.Get("key")`

#### 常用标签汇总

| 标签                       | 用途                  |
| -------------------------- | --------------------- |
| `json:"..."`               | JSON 序列化（最常用） |
| `xml:"..."`                | XML 序列化            |
| `gorm:"..."`               | GORM 数据库映射       |
| `form:"..."`               | 表单参数绑定          |
| `binding:"..."`            | 参数验证              |
| `validate:"..."`           | 数据验证              |
| `yaml:"..."`               | YAML 序列化           |
| `db:"..."`                 | sqlx 数据库映射       |
| 自定义（如 `info`, `doc`） | 通过反射自己读取      |

#### 代码示例（反射读取自定义标签）

```go
package main

import (
	"fmt"
	"reflect"
)

type resume struct {
	Name string `info:"name" doc:"我的名字"`
	Sex  string `info:"sex"`
}

func findTag(str interface{}) {
	t := reflect.TypeOf(str)
	if t == nil || t.Kind() != reflect.Pointer || t.Elem().Kind() != reflect.Struct {
		fmt.Println("参数必须是指向结构体的非 nil 指针")
		return
	}
	t = t.Elem()

	for i := 0; i < t.NumField(); i++ {
		taginfo := t.Field(i).Tag.Get("info")
		tagdoc := t.Field(i).Tag.Get("doc")
		fmt.Println("info:", taginfo)
		fmt.Println("doc:", tagdoc)
	}
}
func main() {
	var re resume
	findTag(&re)
}
// 输出：
// info: name
// doc: 我的名字
// info: sex
// doc:
```

> **核心思想**：结构体标签 = 给字段贴的"便签纸"。程序本身不看它，但第三方库通过反射读取它来做对应的事情。

### JSON 中的结构体标签

`json` 标签是结构体标签中**最常用**的，用于控制结构体与 JSON 之间的转换。

#### json 标签语法

```go
type User struct {
    Name  string `json:"name"`            // JSON 字段名为 "name"
    Age   int    `json:"age"`             // JSON 字段名为 "age"
    Email string `json:"email,omitempty"` // 空值时省略该字段
    Pass  string `json:"-"`               // 完全忽略，不参与 JSON
}
```

| 标签写法            | 含义                                                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `json:"name"`       | JSON 中字段名为 "name"                                                                                                |
| `json:"-"`          | 该字段不参与 JSON 序列化/反序列化                                                                                     |
| `json:",omitempty"` | 值为 false、0、nil 指针/接口，或长度为 0 的字符串、数组、切片、map 时省略；普通结构体值不会仅因字段都是零值而自动省略 |

#### 序列化与反序列化

```go
package main

import (
	"encoding/json"
	"fmt"
)

type Movie struct {
	Title  string   `json:"title"`   // 映射为 "title"
	Year   int      `json:"year"`    // 映射为 "year"
	Price  float32  `json:"rmb"`     // 映射为 "rmb"（自定义名称）
	Actors []string `json:"actors"`  // 映射为 "actors"
}

func main() {
	movie := Movie{"喜剧之王", 2000, 10.0, []string{"周星驰", "xiangye"}}

	// 序列化：结构体 --> JSON 字符串
	jsonStr, err := json.Marshal(movie)
	if err != nil {
		fmt.Println("error:", err)
		return
	}
	fmt.Println(string(jsonStr))
	// {"title":"喜剧之王","year":2000,"rmb":10,"actors":["周星驰","xiangye"]}

	// 反序列化：JSON 字符串 --> 结构体
	myMovie := Movie{}
	err = json.Unmarshal(jsonStr, &myMovie) // 注意：必须传 &myMovie（指针）
	if err != nil {
		fmt.Println("error:", err)
	}
	fmt.Println(myMovie) // {喜剧之王 2000 10 [周星驰 xiangye]}
}
```

#### 为什么反序列化要传 `&myMovie`（指针）？

```
传值 (myMovie)    → 函数拿到副本 → 修改副本 → 原变量不变 ❌
传指针 (&myMovie) → 函数拿到地址 → 通过地址修改原变量 ✅
```

> **判断规则**：函数需要**修改**你的变量 → 传指针 `&`；函数只是**读取** → 传值。
>
> 常见需要传指针的函数：`json.Unmarshal`、`(*json.Decoder).Decode`、`db.Scan`、`fmt.Scan` 等。`encoding/json` 包没有顶层的 `json.Decode` 函数。

## 泛型（类型参数）

Go 1.18 引入了**泛型（Generics）**，可以用一套代码写「对任意类型都成立」的函数和类型，告别「为 int/float64/string 各抄一遍」或者退而求其次用 `interface{}` + 类型断言。

> 反射是在运行时检查类型和值；泛型在编译期进行类型检查，并能减少类型断言。具体实现可能采用单态化、字典传递或共享代码等策略，因此不应笼统承诺“零运行开销”。

### 泛型函数 —— `[T any]`

在函数名后、参数前，用方括号声明**类型参数 T**，`any` 是它的约束（任意类型都行）：

```go
package main

import "fmt"

// T 是类型参数，any 表示「任意类型」
func Reverse[T any](s []T) []T {
	for i, j := 0, len(s)-1; i < j; i, j = i+1, j-1 {
		s[i], s[j] = s[j], s[i]
	}
	return s
}

func main() {
	// 调用时可以省略类型参数，Go 会自动推断
	fmt.Println(Reverse([]int{1, 2, 3}))       // [3 2 1]
	fmt.Println(Reverse([]string{"a", "b", "c"})) // [c b a]
}
```

- 同一个 `Reverse`，int 切片、string 切片都能用。
- 不需要 `interface{}`，也不需要类型断言，**编译期类型安全**。

### 类型约束 —— `comparable` 与自定义约束

`any` 太宽，很多操作需要类型具备某种能力（比如「可比较」「是数字」）。约束放在方括号里：

```go
import "fmt"

// comparable 是内置约束：支持 == 和 != （map 的 key、查重都需要它）
func Contains[T comparable](slice []T, target T) bool {
	for _, v := range slice {
		if v == target { // 若没有 comparable 约束，这里编译不过
			return true
		}
	}
	return false
}

func main() {
	fmt.Println(Contains([]int{1, 2, 3}, 2))          // true
	fmt.Println(Contains([]string{"a", "b"}, "c"))    // false
}
```

**自定义数字约束**（用 `interface` 列出允许的类型）：

```go
type Number interface {
	int | int64 | float64 | float32 // 联合类型：满足其一即可
}

func Sum[T Number](nums []T) T {
	var total T
	for _, n := range nums {
		total += n // 数字才能用 +=
	}
	return total
}

func main() {
	fmt.Println(Sum([]int{1, 2, 3}))         // 6
	fmt.Println(Sum([]float64{1.5, 2.5}))    // 4
}
```

> 当前标准库的 `cmp.Ordered` 提供常用的有序类型约束。`golang.org/x/exp/constraints` 属于实验性扩展模块，并未整体迁入标准库。

### 泛型类型 —— 泛型切片、Map 与结构体

```go
// 泛型栈：任意类型的栈，一套实现
type Stack[T any] struct {
	data []T
}

func (s *Stack[T]) Push(v T) {
	s.data = append(s.data, v)
}

func (s *Stack[T]) Pop() (T, bool) {
	var zero T
	if len(s.data) == 0 {
		return zero, false
	}
	v := s.data[len(s.data)-1]
	s.data = s.data[:len(s.data)-1]
	return v, true
}

func main() {
	intStack := &Stack[int]{}
	intStack.Push(1)
	intStack.Push(2)
	v, _ := intStack.Pop()
	fmt.Println(v) // 2

	strStack := &Stack[string]{}
	strStack.Push("hi")
	// strStack.Push(1) // ❌ 编译错误：类型不匹配
}
```

注意方法接收者写法：`(s *Stack[T])`，要把类型参数带上。

### 泛型 vs interface{} vs 反射

| 方案                | 类型安全       | 运行开销                   | 何时用                                  |
| ------------------- | -------------- | -------------------------- | --------------------------------------- |
| **泛型**            | ✅ 编译期保证  | 取决于编译器实现与具体代码 | 需要对多种类型写同一套逻辑              |
| `interface{}`/`any` | 需要运行时断言 | 可能发生接口转换或分配     | 类型在运行时才确定                      |
| 反射                | ❌ 运行时探查  | 有                         | 处理结构体标签、ORM、序列化等元数据场景 |

### 一句话总结

- 泛型 = `func 名[T 约束](...)`，类型参数放方括号，调用时通常可自动推断。
- `any` 任意类型，`comparable` 可比较，自定义 `interface { int | float64 | ... }` 做联合约束。
- 泛型类型写 `type Stack[T any] struct{...}`，方法接收者带上 `[T]`。
- 根据问题选择工具：同一算法处理一组受约束类型时优先考虑泛型；动态异构值用接口；必须运行时检查结构时再使用反射。

---

## goroutine 与 GMP 调度模型

![img.png](/assert/go-image/多线程.png)

- 多进程/多线程解决了堵塞问题
- 进程/线程多的数量越多, 切换(`上下文切换`)成本就越大, 也就越浪费

![img.png](/assert/go-image/线程.png)

![img.png](/assert/go-image/线程与协程.png)

### 什么是 goroutine

Goroutine 是 Go 语言中的**轻量级线程**，由 Go 运行时（runtime）管理，而非操作系统。

| 特点                 | 说明                                             |
| -------------------- | ------------------------------------------------ |
| **极轻量**           | 使用可动态增长和收缩的小栈，通常远小于 OS 线程栈 |
| **低成本创建**       | 可轻松创建数十万个                               |
| **由 Go 调度器管理** | 使用 M:N 调度模型，多路复用到 OS 线程上          |

### 基本用法

只需在函数调用前加 `go` 关键字：

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

func sayHello(name string) {
    for i := 0; i < 3; i++ {
        fmt.Printf("[%s] Hello %d\n", name, i)
        time.Sleep(100 * time.Millisecond)
    }
}

func main() {
    var wg sync.WaitGroup
    wg.Add(2)
    go func() {
        defer wg.Done()
        sayHello("goroutine-1")
    }()
    go func() {
        defer wg.Done()
        sayHello("goroutine-2")
    }()

    sayHello("main") // main 本身也运行在 goroutine 中
    wg.Wait()         // 明确等待两个工作 goroutine 完成
}
```

判断顺序:

```go
package main

import (
	"fmt"
	"time"
)

func main() {

	// go创建一个形参为空 返回值为空的一个函数
	go func() {
		defer fmt.Println("A defer")

		func() {
			defer fmt.Println("B defer")
			fmt.Println("C defer")
		}()

		fmt.Println("A")

	}()

	for {
		time.Sleep(1 * time.Second)
	}

	/*
		顺序
		C defer
		B defer
		A
		A defer
	*/
}

```

### GMP 调度模型

```
┌─────────────────────────────────────────┐
│              Go Scheduler               │
│                                         │
│   G (Goroutine)  ──→  M (Machine/线程)  │
│         ↑                  ↑            │
│         └──── P (Processor) ────┘        │
│              本地运行队列                 │
└─────────────────────────────────────────┘
```

- **G (Goroutine)**：代表一个并发任务
- **M (Machine)**：OS 线程，执行代码
- **P (Processor)**：逻辑处理器，持有本地运行队列

这张图只是心智模型。实际调度还涉及全局运行队列、P 之间的 work stealing、网络轮询器、系统调用阻塞，以及 M 获取 P 后才能执行 Go 代码等机制。

### runtime.Goexit()

```go
package main

import (
	"fmt"
	"runtime"
	"time"
)

func main() {

	// go创建一个形参为空 返回值为空的一个函数
	go func() {
		defer fmt.Println("A defer")

		func() {
			defer fmt.Println("B defer")
			// 退出当前goroutine
			runtime.Goexit()
			fmt.Println("C defer") // 这里不会被执行
		}()

		fmt.Println("A") // 这里不会被执行

	}()

	for {
		time.Sleep(1 * time.Second)
	}

}
```

### goroutine 协作方式

#### Channel

```go
ch := make(chan string)

go func() {
    ch <- "done" // 发送
}()

msg := <-ch // 接收
fmt.Println(msg)
```

#### sync.WaitGroup

```go
var wg sync.WaitGroup

for i := 0; i < 5; i++ {
    wg.Add(1)
    go func(n int) {
        defer wg.Done()
        fmt.Println(n)
    }(i)
}

wg.Wait() // 等待所有完成
```

`WaitGroup` 只用于等待一组任务完成，不负责传递业务数据；数据通信可使用 channel，共享状态也可以根据场景使用互斥锁或原子操作保护。

### 注意事项

- **main 退出时所有 goroutine 会被终止**，需要同步机制等待
- **共享数据必须正确同步**，可根据场景使用 channel、`sync.Mutex`、`sync/atomic` 等机制
- **不要通过共享内存通信，要通过通信来共享内存**（Go 哲学）

---

## channel 与 select

基本使用:

```go
package main

import "fmt"

func main() {
	// 定义一个channel
	c := make(chan int)

	go func() {
		defer fmt.Println("goroutine close")
		fmt.Println("goroutine running.....")

		// 如果已经发送 但是对面还未读取 会阻塞
		c <- 666 // 将666 发送给c
	}()

	// 如果此时数据没传递过来 会阻塞
	num := <-c // 从c中接收数据 并且赋值给num

	fmt.Println(num)
	fmt.Println("main out!")
}
```

- 无缓冲channel

![img.png](/assert/go-image/无缓冲channel.png)

- 有缓冲channel

![img.png](/assert/go-image/有缓冲channel.png)

> 带缓冲的channel满时，发送方会阻塞，直到接收方读取数据腾出空间。

### 关闭 channel

```go
package main

import "fmt"

func main() {
	// 定义一个channel
	c := make(chan int)

	go func() {

		for i := 0; i < 5; i++ {
			c <- i
		}

		// close 关闭一个channel
		close(c)
		/*
		不关闭就会 deadlock
		无法向已经关闭的channel发送数据
		关闭后可以继续从channel接收数据
		不关闭的话，接收方永远不知道发送方已经结束，就会一直等下去。
        因此Go官方推荐发送方关闭channel
		 */
	}()

	for {
		// 若关闭前还有缓冲数据，接收这些值时 ok 仍为 true；
		// 只有通道已关闭且缓冲区已读空时，ok 才为 false。

		if data, ok := <-c; ok {
			fmt.Println(data)
		} else {
			break
		}
	}
	fmt.Println("Main done")
}
```

并非所有 channel 都必须关闭。只有接收方需要“不会再有值”的信号时才需要关闭，且通常由发送方或明确拥有发送生命周期的一方关闭；不要为了释放 channel 本身而关闭它。

### channel 与 range

```go
package main

import "fmt"

func main() {
	// 定义一个channel
	c := make(chan int)

	go func() {

		for i := 0; i < 5; i++ {
			c <- i
		}

		// close 关闭一个channel
		close(c)
	}()

	//for {
	//	// ok为true表示channel没有关闭 false表示关闭
	//
	//	if data, ok := <-c; ok {
	//		fmt.Println(data)
	//	} else {
	//		break
	//	}
	//}

	// 简写形式
	// 可以使用range来迭代不断操作channel
	for v := range c {
		fmt.Println(v)
	}
	fmt.Println("Main done")
}
```

### channel 与 select

单流程下一个go只能监控一个channel的状态，select可以完成监控多个channel的状态

> 要不断熟悉下面代码的执行流程:

```go
package main

import "fmt"

func fibonacii(c chan int, quit chan int) {
	x, y := 1, 1

	for {
		select {
		case c <- x: // 如果c可写执行这个 能写c就写(子goroutine在读)
			x, y = y, x+y // 同步赋值：新 x = 旧 y，新 y = 旧 x + 旧 y
		case <-quit: // 能读quit就读（子goroutine发quit时才"能读"）
			// <-quit 读quit
			fmt.Println("quit")
			return
		}
	}
}

func main() {

	c := make(chan int)
	quit := make(chan int)

	go func() {
		for i := 0; i < 6; i++ {
			fmt.Println(<-c) // 读c
		}
		quit <- 0
	}()

	fibonacii(c, quit)
}
```

## context（上下文）

goroutine + channel 解决了「并发」和「通信」，但还有一个现实问题没解决：**怎么在需要时取消一批 goroutine？怎么给它们设超时？怎么在 goroutine 之间传递请求级的截止时间/值？**

`context` 包用于在调用链中传播取消、截止时间和请求级值。并非每段并发代码都必须同时使用 goroutine、channel 和 context，应按生命周期与通信需求选择。

> 一句话理解：**`context.Context` 是一次请求/一次操作的「生命周期管家」**，沿着调用链向下传，负责「取消信号」和「截止时间」的传播。

### 核心：Context 沿调用链传递

约定：**函数的第一个参数通常是 `ctx context.Context`**，从 `main` / HTTP handler 一路传下去。不要把 ctx 存进结构体里，要显式传参。

### 创建根 context

```go
background := context.Background() // 空上下文，通常用于 main / 测试 / 顶层
todo := context.TODO()             // 暂时还不能确定上游 context 时占位
_, _ = background, todo
```

### 派生子 context —— 取消、超时与传值

| 函数                               | 作用                                          |
| ---------------------------------- | --------------------------------------------- |
| `context.WithCancel(parent)`       | 返回 ctx + `cancel()`，**手动取消**           |
| `context.WithTimeout(parent, dur)` | 返回 ctx + `cancel()`，**到点自动取消**       |
| `context.WithDeadline(parent, t)`  | 同上，指定绝对时间点                          |
| `context.WithValue(parent, k, v)`  | 在 ctx 上带一个键值（请求级数据，如 traceID） |

> 调用方应调用 `WithCancel`、`WithTimeout`、`WithDeadline` 返回的 `cancel()`，以尽快释放关联的计时器和引用；即使超时最终会触发，也通常在创建后立即 `defer cancel()`。

### 演示：取消信号传播

```go
package main

import (
	"context"
	"fmt"
	"time"
)

func worker(ctx context.Context, id int) {
	for {
		select {
		case <-ctx.Done(): // 收到取消信号，退出
			fmt.Printf("worker %d 被取消: %v\n", id, ctx.Err())
			return
		default:
			fmt.Printf("worker %d 工作中...\n", id)
			time.Sleep(500 * time.Millisecond)
		}
	}
}

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel() // 习惯性 defer，防止泄漏

	go worker(ctx, 1)
	go worker(ctx, 2)

	time.Sleep(2 * time.Second)
	cancel() // 主动取消：两个 worker 都会通过 ctx.Done() 收到信号并退出

	time.Sleep(500 * time.Millisecond) // 给 worker 留点时间打印退出信息
}
```

关键点：

- 子 goroutine 用 `select { case <-ctx.Done(): }` 监听取消。
- `cancel()` 一调用，所有从该 ctx 派生出去的 goroutine **同时**收到信号——这就是「取消一批 goroutine」。

### 演示：超时控制

调用外部 API/数据库时最常用：超过时限自动取消。

```go
func fetch(ctx context.Context) (string, error) {
	// 模拟一个可能很慢的操作
	select {
	case <-time.After(2 * time.Second):
		return "done", nil
	case <-ctx.Done(): // 超时或被取消
		return "", ctx.Err()
	}
}

func main() {
	// 给 1 秒上限，但 fetch 需要 2 秒 → 必然超时
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	result, err := fetch(ctx)
	if err != nil {
		fmt.Println("失败:", err) // 失败: context deadline exceeded
		return
	}
	fmt.Println(result)
}
```

### WithValue —— 请求级数据传递

```go
type ctxKey string
const traceIDKey ctxKey = "traceID"

ctx := context.WithValue(context.Background(), traceIDKey, "abc-123")
v := ctx.Value(traceIDKey)
```

> `WithValue` 只传**请求作用域的值**（traceID、userID、token），**不要**用它传函数参数。滥用会让代码难追踪。

### 一句话总结

- `context` 管「取消 + 超时 + 跨 goroutine 传值」，沿调用链传第一个参数。
- `WithCancel` 手动取消，`WithTimeout` 自动超时，返回的 `cancel()` 必须 `defer cancel()`。
- 子 goroutine 用 `<-ctx.Done()` 监听退出，`ctx.Err()` 看退出原因（`canceled` / `deadline exceeded`）。
- `WithValue` 只传请求级元数据，不传业务参数。

---

## Go Modules 解决的问题

Go modules解决了哪些问题:

1. Go语言长久以来的依赖管理问题。
2. 让项目源码和依赖版本不再必须依赖传统的 `GOPATH/src` 工作区布局；`GOPATH` 本身仍用于模块缓存、安装目录等默认位置，并未消失。
3. 统一社区中的其它的依赖管理工具(提供迁移功能)。

## Go Modules 常用操作

### 常用 `go mod` 命令

| 命令              | 作用                                                                                     |
| ----------------- | ---------------------------------------------------------------------------------------- |
| `go mod init`     | 初始化新模块，创建 go.mod 文件                                                           |
| `go mod download` | 下载go.mod文件中指明的所有依赖                                                           |
| `go mod tidy`     | 整理依赖：添加缺少的，删除未使用的                                                       |
| `go mod graph`    | 打印依赖关系图                                                                           |
| `go mod edit`     | 用命令行编辑 go.mod                                                                      |
| `go mod vendor`   | 把构建和测试主模块所需的依赖包复制到 `vendor` 目录；使用方式受 Go 版本和 `-mod` 设置影响 |
| `go mod verify`   | 检查已下载模块内容是否与模块缓存中记录的校验值一致，不验证依赖业务正确性                 |
| `go mod why`      | 解释为什么需要某个依赖                                                                   |

使用 `go mod init 模块路径` 显式初始化模块并创建 `go.mod`。IDE 可以提供向导，但不应假定它一定会自动创建。

### 调整依赖版本与来源

#### 使用 `go get` 切换版本

```bash
go get github.com/gin-gonic/gin@v1.8.0   # 降级到指定版本
go get github.com/gin-gonic/gin@latest    # 升级到最新
go get github.com/gin-gonic/gin@abc1234   # 指定某个 commit
```

通常优先使用 `go get 模块@版本` 调整依赖，让 Go 命令同步维护间接依赖和 `go.sum`。手工编辑 `require` 不是与 `go get` 完全等价的首选流程，编辑后至少应运行 `go mod tidy` 并测试。

#### 使用 `replace` 进行本地替换

```bash
go mod edit -replace=github.com/gin-gonic/gin=../local/gin
```

用本地目录替换远程包，适合本地调试或 fork 自己维护。

#### `require` 与 `replace` 的区别

```go
// go get 的效果 - 直接改 require
require (
    github.com/gin-gonic/gin v1.8.0
)

// replace 的效果 - 多一个 replace 块
require (
    github.com/gin-gonic/gin v1.9.1
)
replace (
    github.com/gin-gonic/gin => ../local/gin
)
```

---

## 单元测试

Go 自带测试框架，不需要第三方库。规则简单、约定大于配置：

### 基本约定

1. 测试文件名必须以 `_test.go` 结尾（如 `main_test.go`），编译时不会被建进产物。
2. 测试函数签名是 `func TestXxx(t *testing.T)`：名称以 `Test` 开头，紧随其后的首个字符不能是小写字母，且函数不能有其他参数或返回值。
3. 测试文件可以使用被测包本身，也可以使用以 `_test` 结尾的外部测试包；前者可访问包内未导出标识符，后者只能通过导出 API 测试。

### 第一个测试

假设有 `calc.go`：

```go
package calc

func Add(a, b int) int {
	return a + b
}
```

同目录下写 `calc_test.go`：

```go
package calc

import "testing"

func TestAdd(t *testing.T) {
	got := Add(2, 3)
	want := 5
	if got != want {
		t.Errorf("Add(2, 3) = %d, want %d", got, want)
	}
}
```

运行：

```bash
go test            # 跑当前包所有测试
go test -v         # 显示每个用例的详细结果
go test -run TestAdd   # 只跑名字匹配的用例
go test -cover     # 输出覆盖率
go test -coverprofile=cover.out && go tool cover -html=cover.out  # 生成 HTML 覆盖率报告
```

### 表驱动测试

把多组输入/期望列成表，循环跑，避免为每种情况写一个函数：

```go
package calc

import "testing"

func TestAdd(t *testing.T) {
	cases := []struct {
		name  string
		a, b  int
		want  int
	}{
		{"正数", 2, 3, 5},
		{"负数", -1, -1, -2},
		{"零", 0, 0, 0},
		{"混合", -5, 5, 0},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) { // 子测试，可单独 -run 指定
			if got := Add(tc.a, tc.b); got != tc.want {
				t.Errorf("Add(%d, %d) = %d, want %d", tc.a, tc.b, got, tc.want)
			}
		})
	}
}
```

`t.Run` 创建**子测试**，输出会按用例名分组，`go test -run TestAdd/负数` 可以只跑某个子用例。

### 失败、跳过与日志

| API                    | 行为                                                           |
| ---------------------- | -------------------------------------------------------------- |
| `t.Error` / `t.Errorf` | 标记失败，**继续**往下执行                                     |
| `t.Fatal` / `t.Fatalf` | 标记失败，**立刻停止**当前测试函数（遇到不能继续的错误用这个） |
| `t.Skip` / `t.Skipf`   | 跳过该用例（如缺环境）                                         |
| `t.Log` / `t.Logf`     | 记录日志；测试失败时会显示，成功测试通常需配合 `-v` 才显示     |

```go
func TestSlice(t *testing.T) {
	s := []int{1, 2, 3}
	if len(s) != 3 {
		t.Fatalf("长度不对，无法继续: %d", len(s)) // 后面依赖长度，直接 Fatal
	}
	if s[0] != 1 {
		t.Errorf("首元素应为 1，实际 %d", s[0]) // 不致命，继续检查别的
	}
}
```

### `testing.T` 的常用方法

- `t.Parallel()` —— 先暂停当前测试，待所属的顺序测试函数返回后，再与其他并行测试一起运行。并行用例不能无同步地共享可变状态。
- `t.Cleanup(func())` —— 注册清理函数，测试结束时按 LIFO 顺序执行（替代手写 defer 链）。

## 基准测试

签名 `func BenchmarkXxx(b *testing.B)`。Go 1.24 起推荐使用 `b.Loop()`，由测试框架控制迭代次数并更准确地管理计时区间：

```go
func BenchmarkAdd(b *testing.B) {
	for b.Loop() {
		Add(2, 3)
	}
}
```

```bash
go test -run=^$ -bench=.                         # 只跑所有基准，不运行普通测试
go test -run=^$ -bench=BenchmarkAdd -benchmem   # 同时看内存分配
```

如果不指定 `-run=^$`，`go test -bench=...` 默认仍会先运行匹配的普通测试。

## 小结

- 文件使用 `_test.go`，测试函数使用规定签名；可选择同包测试或 `_test` 外部包测试。
- 首选**表驱动 + `t.Run` 子测试**；失败 `t.Error`（继续）/ `t.Fatal`（停止）。
- `go test -v -cover` 看详情和覆盖率，`-bench` 跑性能。
- 这个项目目录就叫 `test-demo`，正好可以建 `xxx_test.go` 实操——`go test` 是 Go 工程的肌肉记忆。
