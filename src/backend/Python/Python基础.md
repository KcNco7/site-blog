# Python 开发快速复习与上手指南

> 适用范围：Python 3.12+。面向已有 Java、Go、JavaScript/TypeScript 等语言经验的开发者，目标是快速恢复 Python 基础，并能够阅读 NiceGUI、FastAPI 等项目。

## 这份文档怎么用

你已经会 Vue 3、React、Java、Go、NestJS、Next.js，所以不需要从“什么是变量、循环、HTTP”重新学起。你的目标是建立语言映射，并补齐 Python 特有的部分。

第一遍只看这些章节，总计约一小时：

1. 函数、lambda 和闭包。
2. 作用域、对象引用和可变性。
3. dataclass、Enum 和类型标注。
4. 模块、`with`、装饰器。
5. `async/await` 和阻塞任务处理。
6. Python 工程开发最小工作流。
7. NiceGUI/FastAPI 项目重点。

基础类型、`if`、`for`、类和异常处理只需快速扫一遍；它们与你熟悉的语言概念基本相同。

### 你已有知识与 Python 的映射

| 你熟悉的概念 | Python 中常见写法 | 需要特别注意 |
|---|---|---|
| TypeScript `interface` / Java DTO | `dataclass`、Pydantic `BaseModel` | 类型标注本身通常不做运行时校验 |
| Java/Go enum | `Enum` | 一般比较枚举成员，不直接比较字符串 |
| JS Promise | coroutine + `async/await` | 调用 `async def` 只会得到 coroutine，必须 `await` |
| Java try-with-resources / Go `defer` | `with` 上下文管理器 | 用于文件、锁、事务，也用于 NiceGUI 布局嵌套 |
| Java Annotation / NestJS Decorator | Python 装饰器 | 装饰器会接收并替换原函数 |
| JS callback | 函数对象、lambda、闭包 | 传函数写 `handler`，立即调用才写 `handler()` |
| npm module / Java package | `.py` 模块与 Python 包 | 模块首次导入时会执行顶层代码 |
| NestJS Controller | FastAPI `APIRouter` | 路由函数可以直接同步或异步 |
| class-validator | Pydantic | FastAPI 用它解析并验证请求体 |
| JPA / TypeORM / Prisma | SQLAlchemy | Session 生命周期和事务边界最重要 |
| Node 事件循环 | `asyncio` 事件循环 | 不能在异步处理函数里执行阻塞 I/O 或 `time.sleep()` |

### 阅读陌生 Python 项目的固定顺序

```text
pyproject.toml      依赖和 Python 版本
      ↓
main.py             程序入口、启动方式、路由注册
      ↓
models/schemas      数据结构和输入输出
      ↓
pages/routes        页面或 HTTP 入口
      ↓
services/devices    业务逻辑和外部设备
      ↓
db/repositories     数据持久化
      ↓
tests               项目真正承诺的行为
```

不要按文件名字母顺序阅读，也不要先钻进 CSS、图表配置和工具函数。先追踪一个完整功能：输入从哪里进入、经过哪个函数、状态在哪里改变、结果在哪里显示或保存。

## 目录

1. [Python 的基本特点](#一python-的基本特点)
2. [变量和基本类型](#二变量和基本类型)
3. [集合类型](#三集合类型)
4. [条件和循环](#四条件和循环)
5. [函数](#五函数)
6. [作用域、引用和可变性](#六作用域引用和可变性)
7. [类、dataclass 和 Enum](#七类dataclass-和-enum)
8. [模块和包](#八模块和包)
9. [异常处理](#九异常处理)
10. [文件和 JSON](#十文件和-json)
11. [with 上下文管理器](#十一with-上下文管理器)
12. [装饰器](#十二装饰器)
13. [迭代器和生成器](#十三迭代器和生成器)
14. [async/await](#十四asyncawait)
15. [类型标注](#十五类型标注)
16. [常用内置函数](#十六常用内置函数)
17. [常见陷阱](#十七常见陷阱)
18. [日志、调试和测试](#十八日志调试和测试)
19. [NiceGUI 项目重点](#十九nicegui-项目重点)
20. [Python 工程开发最小工作流](#二十python-工程开发最小工作流)
21. [FastAPI 最小开发模型](#二十一fastapi-最小开发模型)
22. [一小时复习计划](#二十二一小时复习计划)
23. [最终速查表](#二十三最终速查表)

---

## 一、Python 的基本特点

Python 是动态类型语言，变量保存的是对象引用：

```python
name = 'Alice'
age = 20

age = 'twenty'  # 语法允许，但一般不建议改变变量含义
```

Python 使用缩进表示代码块，通常使用 4 个空格：

```python
if age >= 18:
    print('成年人')
else:
    print('未成年人')
```

运行 Python 文件：

```powershell
python main.py
```

使用 `uv` 的项目：

```powershell
uv run python main.py
```

---

## 二、变量和基本类型

### 1. 数字和布尔值

```python
age = 20           # int
price = 19.99      # float
value = 3 + 4j     # complex
enabled = True     # bool
```

常见运算：

```python
10 + 3   # 13
10 - 3   # 7
10 * 3   # 30
10 / 3   # 3.333... 普通除法
10 // 3  # 3，整除
10 % 3   # 1，取余
10 ** 3  # 1000，幂
```

`bool` 是 `int` 的子类：

```python
True == 1   # True
False == 0  # True
```

### 2. 字符串

```python
name = 'NiceGUI'
message = "Hello"
long_text = """
多行文本
第二行
"""
```

常见方法：

```python
name.lower()
name.upper()
name.strip()
name.replace('GUI', 'UI')
name.startswith('Nice')
name.endswith('GUI')
'A,B,C'.split(',')
','.join(['A', 'B', 'C'])
```

推荐使用 f-string：

```python
name = '张三'
age = 20

text = f'{name}今年{age}岁'
```

数字格式：

```python
price = 12345.678

f'{price:.2f}'    # 12345.68
f'{price:,.2f}'   # 12,345.68
f'{0.25:.0%}'     # 25%
```

### 3. None

`None` 表示没有值，类似 JavaScript 的 `null`：

```python
result = None

if result is None:
    print('没有结果')
```

推荐：

```python
value is None
value is not None
```

不推荐：

```python
value == None
```

### 4. 类型转换

```python
int('123')       # 123
float('12.5')    # 12.5
str(123)         # '123'
bool(1)          # True
list('ABC')      # ['A', 'B', 'C']
```

以下值会被判断为假：

```python
False
None
0
0.0
''
[]
{}
set()
```

---

## 三、集合类型

### 1. list 列表

类似 JavaScript 数组：

```python
numbers = [10, 20, 30]
names = ['A', 'B', 'C']
```

访问和切片：

```python
numbers[0]    # 10
numbers[-1]   # 30，最后一个
numbers[1:3]  # [20, 30]
numbers[:2]   # [10, 20]
numbers[::2]  # 每隔一个元素
```

修改：

```python
numbers.append(40)
numbers.extend([50, 60])
numbers.insert(0, 5)
numbers.remove(20)
last = numbers.pop()
numbers.clear()
```

查询：

```python
len(numbers)
20 in numbers
numbers.index(30)
numbers.count(10)
```

排序：

```python
numbers.sort()                 # 修改原列表
numbers.sort(reverse=True)
new_numbers = sorted(numbers)  # 返回新列表
```

对象排序：

```python
users = [
    {'name': 'A', 'age': 30},
    {'name': 'B', 'age': 20},
]

users.sort(key=lambda user: user['age'])
```

### 2. tuple 元组

元组不能修改：

```python
point = (10, 20)
x, y = point
```

单元素元组必须带逗号：

```python
value = (10,)
```

函数可以返回多个值：

```python
def get_position():
    return 10, 20

x, y = get_position()
```

### 3. dict 字典

类似 JavaScript 对象或 Java 的 `Map`：

```python
user = {
    'name': '张三',
    'age': 20,
}
```

操作：

```python
user['name']
user['age'] = 21
user['email'] = 'test@example.com'
del user['email']
```

安全读取：

```python
user.get('name')
user.get('email', '没有邮箱')
```

遍历：

```python
for key in user:
    print(key)

for value in user.values():
    print(value)

for key, value in user.items():
    print(key, value)
```

合并：

```python
defaults = {'theme': 'light', 'language': 'zh'}
settings = {'theme': 'dark'}

result = defaults | settings
# {'theme': 'dark', 'language': 'zh'}
```

### 4. set 集合

集合中的元素不重复：

```python
numbers = {1, 2, 3}
numbers.add(4)
numbers.remove(2)
```

集合运算：

```python
a = {1, 2, 3}
b = {2, 3, 4}

a | b  # 并集
a & b  # 交集
a - b  # 差集
a ^ b  # 对称差集
```

空集合必须使用：

```python
empty_set = set()
```

`{}` 创建的是字典。

---

## 四、条件和循环

### 1. 条件判断

```python
age = 20

if age < 18:
    print('未成年')
elif age < 60:
    print('成年人')
else:
    print('老年人')
```

逻辑运算：

```python
age >= 18 and enabled
age < 18 or is_student
not enabled
```

链式比较：

```python
if 0 <= progress <= 100:
    print('有效进度')
```

三元表达式：

```python
status = '成年' if age >= 18 else '未成年'
```

模式匹配：

```python
match status:
    case 'running':
        print('运行中')
    case 'error':
        print('故障')
    case _:
        print('未知状态')
```

### 2. for 循环

```python
for name in ['A', 'B', 'C']:
    print(name)
```

带索引：

```python
for index, name in enumerate(['A', 'B', 'C']):
    print(index, name)
```

同时遍历多个集合：

```python
names = ['A', 'B']
ages = [20, 30]

for name, age in zip(names, ages):
    print(name, age)
```

数字循环：

```python
for number in range(5):       # 0～4
    print(number)

for number in range(1, 5):    # 1～4
    print(number)

for number in range(0, 10, 2):
    print(number)              # 0、2、4、6、8
```

### 3. while 循环

```python
count = 0

while count < 5:
    print(count)
    count += 1
```

循环控制：

```python
for number in range(10):
    if number == 2:
        continue

    if number == 8:
        break

    print(number)
```

### 4. 推导式

列表推导式：

```python
squares = [number ** 2 for number in range(5)]

even_numbers = [
    number
    for number in range(10)
    if number % 2 == 0
]
```

字典推导式：

```python
squares = {
    number: number ** 2
    for number in range(5)
}
```

集合推导式：

```python
unique_lengths = {
    len(name)
    for name in names
}
```

不要在推导式里编写过于复杂的业务逻辑。

---

## 五、函数

基本写法：

```python
def add(a, b):
    return a + b
```

带类型标注：

```python
def add(a: int, b: int) -> int:
    return a + b
```

类型标注默认不会进行运行时验证，但能帮助 IDE 和类型检查器。

### 1. 默认参数

```python
def greet(name: str, message: str = '你好') -> str:
    return f'{message}，{name}'

greet('张三')
greet('张三', '欢迎')
greet(name='张三', message='欢迎')
```

### 2. 可变参数

```python
def total(*numbers: int) -> int:
    return sum(numbers)

total(1, 2, 3)
```

关键字参数：

```python
def show_user(**fields):
    print(fields)

show_user(name='张三', age=20)
```

### 3. 参数解包

```python
numbers = [1, 2, 3]
total(*numbers)

user = {'name': '张三', 'age': 20}
show_user(**user)
```

### 4. 参数传递限制

```python
def connect(host, /, port=8080, *, timeout=5):
    pass

connect('localhost', port=9000, timeout=10)
```

- `/` 前的参数只能按位置传递。
- `*` 后的参数只能按名称传递。

### 5. 函数是一等对象

```python
def start():
    print('启动')

callback = start
callback()
```

传递回调时不要加括号：

```python
ui.button('启动', on_click=start)
```

下面会在创建按钮时立即执行：

```python
ui.button('启动', on_click=start())
```

### 6. lambda

```python
add = lambda a, b: a + b

ui.button('启动', on_click=lambda: line.start())
```

复杂逻辑应使用普通函数：

```python
def handle_start():
    line.start()
    ui.notify('启动成功')
```

### 7. 闭包

```python
def create_counter():
    count = 0

    def increment():
        nonlocal count
        count += 1
        return count

    return increment
```

循环回调陷阱：

```python
for station in stations:
    ui.button(
        station.name,
        on_click=lambda s=station: reset(s),
    )
```

`lambda s=station` 保存当前循环中的对象。

---

## 六、作用域、引用和可变性

Python 按 LEGB 顺序查找变量：

1. Local：当前函数。
2. Enclosing：外层函数。
3. Global：当前模块。
4. Built-in：Python 内置名称。

修改全局变量需要 `global`：

```python
count = 0

def increment():
    global count
    count += 1
```

修改闭包变量需要 `nonlocal`：

```python
def outer():
    count = 0

    def increment():
        nonlocal count
        count += 1
```

修改对象属性不需要 `global`：

```python
line.running = True
line.products += 1
```

变量保存对象引用：

```python
a = [1, 2]
b = a

b.append(3)

print(a)  # [1, 2, 3]
```

浅复制：

```python
b = a.copy()
b = list(a)
b = a[:]
```

深复制：

```python
from copy import deepcopy

b = deepcopy(a)
```

常见不可变类型：

```text
int、float、bool、str、tuple、frozenset、None
```

常见可变类型：

```text
list、dict、set、普通类实例
```

`==` 比较值，`is` 判断是否为同一个对象：

```python
a == b
a is b
```

`is` 主要用于判断 `None`：

```python
value is None
```

---

## 七、类、dataclass 和 Enum

### 1. 普通类

```python
class User:
    def __init__(self, name: str, age: int) -> None:
        self.name = name
        self.age = age

    def greet(self) -> str:
        return f'你好，我是{self.name}'
```

使用：

```python
user = User('张三', 20)
user.greet()
```

`self` 类似 Java/JavaScript 的 `this`，但需要显式声明。

### 2. 类属性和实例属性

```python
class User:
    category = 'person'  # 类属性

    def __init__(self, name):
        self.name = name  # 实例属性
```

### 3. dataclass

推荐用于数据模型：

```python
from dataclasses import dataclass

@dataclass
class User:
    name: str
    age: int = 0
```

自动生成：

- `__init__`
- `__repr__`
- `__eq__`

可变默认值必须使用 `default_factory`：

```python
from dataclasses import dataclass, field

@dataclass
class User:
    name: str
    tags: list[str] = field(default_factory=list)
```

不可变 dataclass：

```python
@dataclass(frozen=True)
class Point:
    x: int
    y: int
```

减少实例内存：

```python
@dataclass(slots=True)
class Point:
    x: int
    y: int
```

### 4. Enum

```python
from enum import Enum

class Status(Enum):
    IDLE = '待机'
    RUNNING = '运行中'
    ERROR = '故障'
```

使用：

```python
status = Status.RUNNING

status.name   # RUNNING
status.value  # 运行中

if status == Status.ERROR:
    print('发生故障')
```

### 5. 继承

```python
class Animal:
    def speak(self):
        return '声音'

class Dog(Animal):
    def speak(self):
        return '汪'
```

调用父类：

```python
class Admin(User):
    def __init__(self, name, permissions):
        super().__init__(name)
        self.permissions = permissions
```

优先使用组合，谨慎使用复杂继承。

### 6. property

```python
class Rectangle:
    def __init__(self, width, height):
        self.width = width
        self.height = height

    @property
    def area(self):
        return self.width * self.height
```

使用时不加括号：

```python
rectangle.area
```

---

## 八、模块和包

一个 `.py` 文件就是一个模块。

```text
project/
├── main.py
├── simulator.py
└── components/
    ├── __init__.py
    └── device_panel.py
```

导入模块：

```python
import simulator

simulator.line.start()
```

导入模块成员：

```python
from simulator import line, Status

line.start()
```

别名：

```python
import numpy as np
```

包内相对导入：

```python
from .device_panel import render_station_card
```

入口判断：

```python
if __name__ == '__main__':
    main()
```

含义：

- 直接运行文件时执行。
- 被其他模块导入时不执行。

模块第一次导入时会执行，之后通常从 `sys.modules` 缓存中读取。

避免循环导入：

```text
a.py 导入 b.py
b.py 又导入 a.py
```

通常可以把公共模型抽取到第三个模块解决循环导入。

---

## 九、异常处理

基本结构：

```python
try:
    number = int(text)
except ValueError:
    print('不是有效数字')
```

完整结构：

```python
try:
    result = do_work()
except ValueError as error:
    print(f'参数错误：{error}')
except OSError as error:
    print(f'系统错误：{error}')
else:
    print('没有发生异常')
finally:
    print('无论如何都会执行')
```

主动抛出异常：

```python
def set_progress(progress: int) -> None:
    if not 0 <= progress <= 100:
        raise ValueError('progress 必须在 0～100 之间')
```

自定义异常：

```python
class DeviceError(Exception):
    pass
```

不要吞掉所有异常：

```python
try:
    do_work()
except Exception:
    pass
```

至少应该记录异常：

```python
import logging

try:
    do_work()
except Exception:
    logging.exception('执行失败')
```

---

## 十、文件和 JSON

推荐使用 `pathlib`：

```python
from pathlib import Path

path = Path('config.json')
```

读取和写入：

```python
content = path.read_text(encoding='utf-8')
path.write_text('hello', encoding='utf-8')
```

路径操作：

```python
path.exists()
path.is_file()
path.is_dir()

base = Path('data')
file_path = base / 'users.json'
```

传统文件操作：

```python
with open('data.txt', 'r', encoding='utf-8') as file:
    content = file.read()
```

JSON：

```python
import json

data = {'name': '张三', 'age': 20}

text = json.dumps(data, ensure_ascii=False, indent=2)
data = json.loads(text)
```

写入 JSON：

```python
Path('user.json').write_text(
    json.dumps(data, ensure_ascii=False, indent=2),
    encoding='utf-8',
)
```

---

## 十一、with 上下文管理器

文件：

```python
with open('data.txt', encoding='utf-8') as file:
    content = file.read()
```

NiceGUI：

```python
with ui.card():
    ui.label('标题')
    ui.button('按钮')
```

`with` 的本质：

```python
manager.__enter__()

try:
    ...
finally:
    manager.__exit__()
```

创建上下文管理器：

```python
from contextlib import contextmanager

@contextmanager
def transaction():
    print('开始事务')
    try:
        yield
        print('提交事务')
    except Exception:
        print('回滚事务')
        raise
```

使用：

```python
with transaction():
    save_data()
```

---

## 十二、装饰器

装饰器用于包装函数：

```python
from functools import wraps

def logger(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        print(f'调用 {func.__name__}')
        return func(*args, **kwargs)

    return wrapper
```

使用：

```python
@logger
def add(a, b):
    return a + b
```

等价于：

```python
add = logger(add)
```

带参数的装饰器：

```python
def repeat(times):
    def decorator(func):
        def wrapper(*args, **kwargs):
            for _ in range(times):
                func(*args, **kwargs)

        return wrapper

    return decorator
```

NiceGUI 中：

```python
@ui.page('/stations')
def stations_page():
    ...
```

近似等价于：

```python
stations_page = ui.page('/stations')(stations_page)
```

`@ui.refreshable` 会给函数增加 `.refresh()`：

```python
@ui.refreshable
def station_list():
    ...

station_list()
station_list.refresh()
```

---

## 十三、迭代器和生成器

常见可迭代对象：

```text
list、tuple、dict、set、str、range
```

迭代器：

```python
numbers = iter([1, 2, 3])

next(numbers)  # 1
next(numbers)  # 2
```

生成器使用 `yield`：

```python
def numbers():
    yield 1
    yield 2
    yield 3
```

生成器不会一次性创建全部数据：

```python
def read_large_file(path):
    with open(path, encoding='utf-8') as file:
        for line in file:
            yield line.strip()
```

生成器表达式：

```python
squares = (number ** 2 for number in range(1_000_000))
```

列表推导式会立即创建整个列表：

```python
squares = [number ** 2 for number in range(1_000_000)]
```

---

## 十四、async/await

Python 异步与 JavaScript 类似：

```python
import asyncio

async def load_data():
    await asyncio.sleep(1)
    return {'value': 42}
```

调用异步函数会得到 coroutine：

```python
coroutine = load_data()
```

通常需要等待：

```python
result = await load_data()
```

程序入口：

```python
asyncio.run(load_data())
```

并发执行：

```python
results = await asyncio.gather(
    load_user(),
    load_orders(),
    load_settings(),
)
```

创建任务：

```python
task = asyncio.create_task(load_data())
result = await task
```

不要阻塞事件循环。

错误：

```python
async def handler():
    time.sleep(5)
```

正确延时：

```python
async def handler():
    await asyncio.sleep(5)
```

原生异步 HTTP：

```python
import httpx

async def load_data():
    async with httpx.AsyncClient() as client:
        response = await client.get('https://example.com')
        return response.json()
```

NiceGUI 中执行同步 I/O：

```python
from nicegui import run

result = await run.io_bound(blocking_io_function, argument)
```

适合：

- 同步数据库驱动
- 文件读写
- PLC、Modbus、串口
- `requests.get`

CPU 密集任务：

```python
result = await run.cpu_bound(compute_function, data)
```

简单判断：

```text
异步库                 → 直接 await
同步且主要等待 I/O     → run.io_bound
大量 CPU 计算          → run.cpu_bound
单纯延时               → asyncio.sleep
```

---

## 十五、类型标注

基本类型：

```python
name: str
age: int
price: float
enabled: bool
```

集合：

```python
names: list[str]
user: dict[str, object]
point: tuple[int, int]
ids: set[int]
```

联合类型：

```python
def find_user(user_id: int) -> User | None:
    ...
```

`User | None` 表示可能返回 `User`，也可能返回 `None`。

Literal：

```python
from typing import Literal

LogLevel = Literal['info', 'warning', 'error']

def log(level: LogLevel, message: str) -> None:
    ...
```

Callable：

```python
from collections.abc import Callable

Handler = Callable[[str], None]
```

泛型：

```python
from typing import TypeVar

T = TypeVar('T')

def first(items: list[T]) -> T | None:
    return items[0] if items else None
```

类型检查工具：

```powershell
mypy .
pyright
```

---

## 十六、常用内置函数

```python
len(items)
sum(numbers)
min(numbers)
max(numbers)
sorted(items)
reversed(items)
enumerate(items)
zip(a, b)
range(10)
any(conditions)
all(conditions)
```

例子：

```python
any_error = any(
    station.status == Status.ERROR
    for station in stations
)

all_idle = all(
    station.status == Status.IDLE
    for station in stations
)

active_count = sum(
    station.status == Status.RUNNING
    for station in stations
)
```

因为 `True == 1`，最后一种写法可以统计满足条件的数量。

---

## 十七、常见陷阱

### 1. 可变默认参数

错误：

```python
def add_item(item, items=[]):
    items.append(item)
    return items
```

正确：

```python
def add_item(item, items=None):
    if items is None:
        items = []

    items.append(item)
    return items
```

### 2. `is` 和 `==`

```python
a == b  # 值相等
a is b  # 同一个对象
```

### 3. 修改正在遍历的列表

危险：

```python
for item in items:
    if should_remove(item):
        items.remove(item)
```

推荐：

```python
items = [
    item
    for item in items
    if not should_remove(item)
]
```

### 4. 捕获过于宽泛的异常

避免：

```python
except:
    pass
```

推荐捕获具体异常。

### 5. 循环中的 lambda

错误：

```python
callbacks = []

for number in range(3):
    callbacks.append(lambda: number)
```

所有回调最后都可能返回 `2`。

正确：

```python
callbacks.append(lambda value=number: value)
```

### 6. 浅复制和深复制

```python
a = [[1], [2]]
b = a.copy()

b[0].append(3)

print(a)  # [[1, 3], [2]]
```

外层列表复制了，但内部列表仍然共享。

### 7. 忘记返回值

```python
def add(a, b):
    result = a + b
```

没有 `return` 时自动返回 `None`。

### 8. 导入时执行代码

模块顶层代码在导入时执行：

```python
print('模块被导入')
connection = connect_database()
```

大型资源通常应在应用启动阶段创建，或者延迟初始化。

---

## 十八、日志、调试和测试

### 1. logging

实际项目推荐使用 `logging`：

```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

logger.info('应用启动')
logger.warning('设备响应缓慢')
logger.error('读取失败')
```

记录异常堆栈：

```python
try:
    do_work()
except Exception:
    logger.exception('执行失败')
```

### 2. 调试

```python
print(variable)
print(type(variable))
print(repr(variable))
```

断点：

```python
breakpoint()
```

### 3. 测试

内置 `unittest`：

```python
import unittest

class TestCalculator(unittest.TestCase):
    def test_add(self):
        self.assertEqual(1 + 2, 3)

if __name__ == '__main__':
    unittest.main()
```

pytest：

```python
def test_add():
    assert 1 + 2 == 3
```

运行：

```powershell
pytest
```

测试异常：

```python
import pytest

def test_invalid_progress():
    with pytest.raises(ValueError):
        set_progress(101)
```

---

## 十九、NiceGUI 项目重点

阅读 NiceGUI 项目时，重点识别以下结构。

### 1. 数据模型

```python
@dataclass
class Station:
    name: str
    progress: int = 0
```

### 2. 全局业务对象

```python
line = ProductionLine()
```

### 3. 路由

```python
@ui.page('/stations')
def stations_page():
    ...
```

### 4. 组件

```python
def render_station_card(station):
    with ui.card():
        ui.label(station.name)
```

### 5. 事件回调

```python
def handle_start():
    line.start()

ui.button('启动', on_click=handle_start)
```

### 6. 局部重新渲染

```python
@ui.refreshable
def station_grid():
    for station in line.stations:
        render_station_card(station)

station_grid()
station_grid.refresh()
```

### 7. 定时器

```python
app.timer(0.5, line.tick)
ui.timer(0.25, refresh_page)
```

- `app.timer` 属于整个服务。
- `ui.timer` 属于当前页面。

### 8. 异步事件

```python
async def handle_load():
    result = await load_data()
    label.text = str(result)
```

---

## 二十、Python 工程开发最小工作流

### 1. 先看 `pyproject.toml`

现代 Python 项目通常用 `pyproject.toml` 描述：

- 项目名称和 Python 版本。
- 正式依赖和开发依赖。
- pytest、ruff、类型检查器等工具配置。

使用 `uv` 的常用命令：

```powershell
uv sync                     # 按锁文件安装依赖
uv add fastapi              # 添加正式依赖
uv add --dev pytest ruff    # 添加开发依赖
uv remove package-name      # 删除依赖
uv run python main.py       # 在项目环境中运行程序
uv run pytest               # 运行测试
```

不要在项目之外随意执行全局 `pip install`。优先使用项目自带虚拟环境和锁文件，这与 npm lockfile、Go module 的目标相同。

### 2. 推荐目录结构

小项目可以从简单结构开始：

```text
project/
├── pyproject.toml
├── README.md
├── main.py
├── app/
│   ├── __init__.py
│   ├── models.py
│   ├── services.py
│   ├── api.py
│   └── db.py
└── tests/
    └── test_services.py
```

拆分原则是职责，不是文件行数：

- `models/schemas`：数据形状。
- `api/pages`：接收输入、调用业务逻辑、返回结果。
- `services`：业务规则。
- `db/repositories`：持久化。
- `devices/clients`：外部设备和第三方服务。

页面或路由函数应该尽量薄。不要把数据库访问、设备控制和复杂计算全部写在点击事件或路由函数中。

### 3. 日常开发闭环

```text
同步依赖 → 运行项目 → 修改一个最小功能 → 测试 → 格式和静态检查
```

常用命令示例：

```powershell
uv sync
uv run python main.py
uv run pytest
uv run ruff check .
uv run ruff format .
```

只有项目已经添加相应工具时，后两条命令才可用。

### 4. 配置和敏感信息

不要把数据库密码、Token 和设备凭据写死在源码：

```python
import os

database_url = os.environ['DATABASE_URL']
debug = os.getenv('DEBUG', 'false').lower() == 'true'
```

- 必需配置使用 `os.environ['NAME']`，缺失时立即报错。
- 可选配置使用 `os.getenv('NAME', default)`。
- `.env` 文件不应提交真实密钥。

### 5. 快速定位问题

按以下顺序检查：

1. 阅读完整异常最后一行，确认异常类型和消息。
2. 从 traceback 最下面向上找第一个属于本项目的文件。
3. 检查实际值：`repr(value)`、`type(value)`。
4. 确认函数是否真的被调用、异步函数是否被 `await`。
5. 把 UI/API 层拿掉，直接测试业务函数。

Python traceback 类似 Java stack trace；最下面通常最接近根因。

### 6. 完成一个功能的最低标准

- 输入有类型和边界检查。
- 业务函数不依赖具体 UI。
- 异常没有被静默吞掉。
- 至少有一个成功测试和一个失败测试。
- 阻塞任务没有占用异步事件循环。
- 日志不包含密码或 Token。

---

## 二十一、FastAPI 最小开发模型

你可以把 FastAPI 理解成更轻量、更显式的 NestJS。日常开发主要是四件事：定义请求模型、注册路由、注入依赖、返回或抛出异常。

### 1. 最小接口

```python
from fastapi import FastAPI

app = FastAPI()

@app.get('/api/health')
def health() -> dict[str, str]:
    return {'status': 'ok'}
```

返回 `dict` 时，FastAPI 会把它序列化为 JSON。

### 2. 路径参数和 404

```python
from fastapi import HTTPException

@app.get('/api/devices/{device_id}')
def get_device(device_id: int) -> dict:
    device = find_device(device_id)

    if device is None:
        raise HTTPException(status_code=404, detail='设备不存在')

    return device
```

`device_id: int` 会触发参数解析；无法转换为整数时，FastAPI 会自动返回验证错误。

### 3. 请求体和 Pydantic

```python
from typing import Literal

from pydantic import BaseModel, Field

class CreateBatchRequest(BaseModel):
    sensor_type: Literal['resolver', 'sdu', 'lsu', 'fssu']
    serial_no: str = Field(min_length=1, max_length=64)
    operator: str = Field(min_length=1, max_length=32)
    temperature: float = Field(default=23.0, ge=-55, le=125)

@app.post('/api/test-batches', status_code=201)
def create_batch(data: CreateBatchRequest) -> dict:
    batch = create_batch_service(data.model_dump())
    return batch
```

区别非常重要：

```python
temperature: float                    # 普通类型标注，不保证运行时校验
temperature: float = Field(ge=-55)    # Pydantic 模型会运行时解析和校验
```

### 4. APIRouter 对应 Controller

正式项目不要把所有接口堆在 `main.py`：

```python
from fastapi import APIRouter

router = APIRouter(prefix='/api/test-batches', tags=['test-batches'])

@router.get('')
def list_batches() -> list[dict]:
    return []
```

在入口注册：

```python
app.include_router(router)
```

### 5. Depends 对应依赖注入

```python
from collections.abc import Generator

from fastapi import Depends
from sqlalchemy.orm import Session

def get_db() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

@app.get('/api/test-batches')
def list_batches(db: Session = Depends(get_db)) -> list[dict]:
    ...
```

核心不是 `Depends` 语法，而是每个请求拥有明确的 Session 生命周期，并正确提交、回滚和关闭。

### 6. `def` 还是 `async def`

```python
@app.get('/sync')
def sync_route():
    return blocking_library_call()

@app.get('/async')
async def async_route():
    return await async_library_call()
```

判断原则：

- 使用真正的异步库时写 `async def` 并 `await`。
- 使用同步数据库或同步设备 SDK 时，不要仅为了形式把函数改成 `async def`。
- 在异步函数中不得调用 `time.sleep()` 或长时间阻塞操作。

### 7. 从 NestJS 迁移时最容易犯的错

- 为了模仿 NestJS，刚开始就创建过多层空目录和抽象类。
- 以为类型标注等同于 Pydantic 的运行时验证。
- 把一个全局 SQLAlchemy Session 给所有请求共享。
- 在 `async def` 中调用同步硬件或数据库函数，阻塞整个事件循环。
- 在路由函数里写完所有业务逻辑，导致无法独立测试。

---

## 二十二、一小时复习计划

### 0～10 分钟：基本语法

复习：

- 基本类型
- 列表、字典、集合
- `if`、`for`
- 列表推导式

练习：筛选故障设备。

```python
stations = [
    {'name': '上料', 'status': 'running'},
    {'name': '加工', 'status': 'error'},
    {'name': '包装', 'status': 'idle'},
]

errors = [
    station
    for station in stations
    if station['status'] == 'error'
]
```

### 10～20 分钟：函数

复习：

- 默认参数
- `*args`
- `**kwargs`
- lambda
- 闭包
- 作用域

### 20～30 分钟：面向对象

复习：

- class
- dataclass
- Enum
- property
- 对象引用

练习：实现 `Station` 和 `ProductionLine`。

### 30～40 分钟：模块和框架语法

复习：

- import
- `__name__`
- with
- 装饰器
- 回调

### 40～50 分钟：异步

复习：

- `async def`
- `await`
- `asyncio.sleep`
- `gather`
- I/O 和 CPU 任务的区别

### 50～60 分钟：阅读 NiceGUI 项目

按照以下顺序阅读：

1. `main.py`
2. `runtime.py`
3. `simulator.py`
4. `pages/dashboard.py`
5. `pages/stations.py`
6. `components/device_panel.py`

不要从 CSS 开始阅读。

---

## 二十三、最终速查表

```python
# 变量
name = 'Alice'
age: int = 20

# 列表
items = [1, 2, 3]
items.append(4)

# 字典
user = {'name': 'Alice'}
name = user.get('name')

# 条件
if age >= 18:
    pass
elif age > 12:
    pass
else:
    pass

# 循环
for index, item in enumerate(items):
    print(index, item)

# 推导式
squares = [x ** 2 for x in items if x > 1]

# 函数
def add(a: int, b: int = 0) -> int:
    return a + b

# 类
class User:
    def __init__(self, name: str):
        self.name = name

# dataclass
@dataclass
class Station:
    name: str
    progress: int = 0

# Enum
class Status(Enum):
    IDLE = '待机'
    RUNNING = '运行中'

# 异常
try:
    value = int(text)
except ValueError:
    value = 0

# 文件
content = Path('data.txt').read_text(encoding='utf-8')

# 异步
async def load():
    await asyncio.sleep(1)

# 上下文管理器
with ui.card():
    ui.label('内容')

# 装饰器
@ui.page('/')
def page():
    pass
```

复习时最重要的是能够解释下面五个问题：

1. 变量保存的是值还是对象引用？
2. 修改对象和重新给变量赋值有什么区别？
3. 函数为什么可以作为回调传递？
4. `app.timer` 和 `ui.timer` 有什么区别？
5. `await` 为什么不会阻塞整个应用？

能够清楚回答这些问题，就足以继续学习 NiceGUI。
