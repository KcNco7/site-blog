# Gin

## 基本使用

```go
package main

import (
  "github.com/gin-gonic/gin"

  "net/http"
)

func main() {
  router := gin.Default()
  router.GET("/ping", func(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
		"data":    "Hello World",
    })
  })
  router.Run() // 默认端口8080 可以在这里更改
}
```

## 路由

### 使用HTTP方法

```go
package main

import (
  "net/http"

  "github.com/gin-gonic/gin"
)

func getting(c *gin.Context) {
  c.JSON(http.StatusOK, gin.H{"method": "GET"})
}

func posting(c *gin.Context) {
  c.JSON(http.StatusOK, gin.H{"method": "POST"})
}

func putting(c *gin.Context) {
  c.JSON(http.StatusOK, gin.H{"method": "PUT"})
}

func deleting(c *gin.Context) {
  c.JSON(http.StatusOK, gin.H{"method": "DELETE"})
}



func main() {
  // Creates a gin router with default middleware:
  // logger and recovery (crash-free) middleware
  router := gin.Default()

  router.GET("/someGet", getting)
  router.POST("/somePost", posting)
  router.PUT("/somePut", putting)
  router.DELETE("/someDelete", deleting)


  // By default it serves on :8080 unless a
  // PORT environment variable was defined.
  router.Run()
  // router.Run(":3000") for a hard coded port
}
```

### 路径参数

如果你学过 SpringMVC，这其实非常类似于 Spring 中的 `@PathVariable` 注解。它的作用就是**从 URL 的路径中把变量提取出来**。

为了让你更容易理解，我们先把 URL 的结构拆开看。一个 URL 中，斜杠 `/` 隔开的部分叫做“路径段”。
比如 `/user/john/profile`，它有三个路径段：`user`、`john`、`profile`。

Gin 提供了两种方式来捕获这些路径段：

#### 1. `:name` —— 精确匹配“单个”路径段

冒号 `:` 表示这是一个占位符，但它**只能匹配一个非空的路径段**，不能多也不能少。

- **定义路由**：`/user/:name`
- **匹配情况**：
  - 访问 `/user/john` ➔ **匹配成功**。Gin 会把 `john` 提取出来，赋值给变量 `name`。
  - 访问 `/user/john/profile` ➔ **匹配失败**。因为多了一个路径段 `profile`。
  - 访问 `/user/` ➔ **匹配失败**。因为冒号要求必须有一个具体的内容，这里冒号后面是空的。

**总结**：`:name` 就像是一个“专一的格子”，必须且只能往里面填一个词。

---

#### 2. `*action` —— 贪婪匹配“所有剩余”内容

星号 `*` 表示这是一个通配符（Catch-all），它会**把斜杠后面的所有内容，不管有几个路径段，一口气全部吞下去**。注意，它捕获的值**包含**前面的那个斜杠 `/`。

- **定义路由**：`/user/:name/*action`
- **匹配情况**：
  - 访问 `/user/john/send` ➔ **匹配成功**。
    - `:name` 提取出 `john`
    - `*action` 提取出 `/send`（注意带了斜杠）
  - 访问 `/user/john/send/message` ➔ **匹配成功**。
    - `:name` 提取出 `john`
    - `*action` 提取出 `/send/message`（把后面的全吞了）
  - 访问 `/user/john/` ➔ **匹配成功**。
    - `:name` 提取出 `john`
    - `*action` 提取出 `/`（仅仅是斜杠）

**总结**：`*action` 就像一个“大胃王”，不管后面跟着多长的路径，统统打包拿走，并且保留开头的斜杠。

---

#### 3. 在代码中如何获取这些值？

在 Gin 的处理函数中，你使用 `c.Param("参数名")` 就可以拿到它们：

```go
package main

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

func main() {
	r := gin.Default()

	// 演示 :name (单段匹配)
	r.GET("/user/:name", func(c *gin.Context) {
		name := c.Param("name") // 提取出 john
		c.String(http.StatusOK, "获取到的名字是: %s", name)
	})

	// 演示 :name 和 *action 结合使用
	r.GET("/download/:filename/*filepath", func(c *gin.Context) {
		filename := c.Param("filename")   // 提取出文件名
		filepath := c.Param("filepath")   // 提取出路径

		// 假设访问 /download/report/2023/summary.pdf
		// filename 会是 "report"
		// filepath 会是 "/2023/summary.pdf"

		c.String(http.StatusOK, "文件名: %s, 路径: %s", filename, filepath)
	})

	r.Run(":8080")
}
```

#### 使用场景区分

- 用 `:id` 的场景：比如查询某个具体用户 `/api/user/:id`，或者获取某篇文章 `/post/:postId`。
- 用 `*path` 的场景：比如实现一个静态文件服务器，无论用户输入多深的目录路径，你都要拦截并处理；或者做一个转发代理时。

### 查询字符串参数

查询字符串参数是出现在 URL 中 `?` 后面的键值对（例如 `/search?q=gin&page=2`）。

- `c.Query("key")` 返回查询参数的值，如果键不存在则返回**空字符串**。
- `c.DefaultQuery("key", "default")` 返回值，如果键不存在则返回指定的**默认值**。

这两种方法都是访问 `c.Request.URL.Query()` 的便捷方式，减少了样板代码。

```go
package main

import (
  "net/http"

  "github.com/gin-gonic/gin"
)

func main() {
  router := gin.Default()

  // Query string parameters are parsed using the existing underlying request object.
  // The request responds to a url matching:  /welcome?firstname=Jane&lastname=Doe
  router.GET("/welcome", func(c *gin.Context) {
    firstname := c.DefaultQuery("firstname", "Guest")
    lastname := c.Query("lastname") // shortcut for c.Request.URL.Query().Get("lastname")

    c.String(http.StatusOK, "Hello %s %s", firstname, lastname)
  })
  router.Run(":8080")
}
```

### 路由

路由决定一个 HTTP 请求到达服务器后，应该交给哪个处理函数。Gin 的路由系统基于 `httprouter`，使用基数树保存和查找路由。

一条路由由三部分组成：

```text
路由 = HTTP 方法 + URL 路径 + Handler
```

例如：

```go
router.GET("/users/:id", getUser)
```

其中：

| 部分      | 内容         | 作用                     |
| --------- | ------------ | ------------------------ |
| HTTP 方法 | `GET`        | 表示读取资源             |
| URL 路径  | `/users/:id` | 表示要匹配的请求路径     |
| Handler   | `getUser`    | 路由匹配后执行的处理函数 |

#### 1. HTTP 方法和路径共同决定路由

Gin 匹配路由时，会同时检查 HTTP 方法和 URL 路径：

```go
router.GET("/users", listUsers)
router.POST("/users", createUser)
```

虽然两条路由的路径相同，但是 HTTP 方法不同，所以它们是两条不同的路由：

| 请求          | 执行的 Handler |
| ------------- | -------------- |
| `GET /users`  | `listUsers`    |
| `POST /users` | `createUser`   |

如果方法或者路径有一个不匹配，就不会执行对应的 Handler。

#### 2. 查询字符串不参与路由匹配

下面三个请求都会匹配同一条 `/search` 路由：

```text
GET /search
GET /search?keyword=gin
GET /search?keyword=go&page=2
```

只需要注册一次：

```go
router.GET("/search", search)
```

因为查询字符串是在 Gin 找到 Handler 后，再通过 `c.Query()` 或 `c.DefaultQuery()` 读取的。

```go
func search(c *gin.Context) {
	keyword := c.Query("keyword")
	page := c.DefaultQuery("page", "1")

	c.JSON(http.StatusOK, gin.H{
		"keyword": keyword,
		"page":    page,
	})
}
```

路径参数和查询参数的区别：

| 请求            | 参数类型          | 是否参与路由匹配 |
| --------------- | ----------------- | ---------------- |
| `/users/42`     | `42` 是路径参数   | 是               |
| `/users?page=2` | `page` 是查询参数 | 否               |

#### 3. 请求的处理流程

```text
客户端发送请求
    ↓
Gin Engine 接收请求
    ↓
根据“HTTP 方法 + URL 路径”查找路由
    ↓
执行匹配路由的 Handler
    ↓
Handler 通过 gin.Context 读取请求并返回响应
```

路由通常在服务启动前注册。服务启动后，每个请求都会按照上面的流程查找并执行 Handler。

#### 4. Handler 与 gin.Context

Gin Handler 的基本形式是：

```go
func(c *gin.Context)
```

可以使用具名函数：

```go
func hello(c *gin.Context) {
	c.String(http.StatusOK, "Hello Gin")
}

router.GET("/hello", hello)
```

也可以使用匿名函数：

```go
router.GET("/hello", func(c *gin.Context) {
	c.String(http.StatusOK, "Hello Gin")
})
```

两种写法效果相同。代码较多时，使用具名函数可以让路由注册部分更清晰。

`gin.Context` 表示当前这一次请求和响应。Handler 可以通过它：

- 使用 `c.Param()` 获取路径参数。
- 使用 `c.Query()` 获取查询参数。
- 使用 `c.PostForm()` 获取表单参数。
- 使用 `c.JSON()`、`c.String()` 等方法返回响应。

#### 5. 一条路由可以有多个 Handler

Gin 的路由注册方法可以接收一个或多个 Handler：

```go
router.GET("/profile", checkLogin, getProfile)
```

它们会组成处理链：

```text
checkLogin → getProfile
```

前面的 Handler 通常用作中间件，最后一个 Handler 通常负责具体业务。中间件会在后面的章节中详细学习。

#### 6. gin.Engine 的职责

```go
router := gin.Default()
```

`router` 的类型是 `*gin.Engine`，它是 Gin 应用的核心对象，主要负责：

- 保存已经注册的路由。
- 根据请求方法和路径查找路由。
- 管理和执行中间件。
- 调用最终的 Handler。
- 启动 HTTP 服务。

可以通过 Engine 注册不同 HTTP 方法的路由：

```go
router.GET("/users", listUsers)
router.POST("/users", createUser)
router.PUT("/users/:id", updateUser)
router.DELETE("/users/:id", deleteUser)
```

#### 7. 常见的资源路由

假设要开发一组用户接口，可以这样设计：

```go
router.GET("/users", listUsers)
router.POST("/users", createUser)
router.GET("/users/:id", getUser)
router.PUT("/users/:id", updateUser)
router.DELETE("/users/:id", deleteUser)
```

| 方法和路径          | 作用         |
| ------------------- | ------------ |
| `GET /users`        | 查询用户列表 |
| `POST /users`       | 创建用户     |
| `GET /users/:id`    | 查询指定用户 |
| `PUT /users/:id`    | 更新指定用户 |
| `DELETE /users/:id` | 删除指定用户 |

这种使用资源名称组织路径、使用 HTTP 方法表达操作的方式，是后面学习 RESTful API 的基础。

#### 8. 本节练习

尝试注册下面三条路由：

```text
GET  /users
POST /users
GET  /users/:id
```

要求：

1. `GET /users` 返回 `{"operation":"list users"}`。
2. `POST /users` 返回 `{"operation":"create user"}`。
3. `GET /users/42` 返回 `{"operation":"get user","id":"42"}`。
4. 分别使用 GET 和 POST 请求访问 `/users`，观察它们是否进入不同的 Handler。

#### 9. 总结

1. Gin 路由由 HTTP 方法、URL 路径和 Handler 组成。
2. HTTP 方法和路径必须同时匹配。
3. 路径参数参与路由匹配，查询字符串不参与。
4. Handler 的基本形式是 `func(c *gin.Context)`。
5. `gin.Context` 表示当前请求和响应。
6. 一条路由可以注册多个 Handler，形成处理链。
7. `gin.Engine` 负责保存路由、匹配请求和执行 Handler。

官方文档：[路由](https://gin-gonic.com/zh-cn/docs/routing/)

::: tip 三类常用请求参数速查

| 参数类型           | 在请求中的体现                       | Gin 获取方式                                                            | 典型用途                 |
| ------------------ | ------------------------------------ | ----------------------------------------------------------------------- | ------------------------ |
| 路径参数（Path）   | `/users/42`，路由定义为 `/users/:id` | `c.Param("id")`                                                         | 定位某个具体资源         |
| 查询参数（Query）  | `/users?page=2&size=10`              | `c.Query("page")`、`c.DefaultQuery("size", "10")`、`c.GetQuery("page")` | 搜索、筛选、排序和分页   |
| 请求体参数（Body） | JSON、表单等内容放在请求体中         | JSON 使用 `c.ShouldBindJSON(&data)`；表单使用 `c.PostForm("name")` 等   | 提交创建或修改资源的数据 |

**记忆口诀：路径参数找谁，查询参数怎么找，请求体参数提交什么。**

```text
GET /users/42
           └── 路径参数：查找编号为 42 的用户

GET /users?page=2&size=10
           └── 查询参数：查询用户列表的第 2 页，每页 10 条

POST /users
Content-Type: application/json
Body: {"name":"张三","age":20}
           └── 请求体参数：提交要创建的用户数据
```

常用获取方法：

- 路径参数：`c.Param("key")`。
- 查询参数：`c.Query("key")`；需要默认值时使用 `c.DefaultQuery()`；需要判断参数是否存在时使用 `c.GetQuery()`。
- JSON 请求体：定义结构体后使用 `c.ShouldBindJSON(&data)`。
- 表单请求体：使用 `c.PostForm()`、`c.DefaultPostForm()` 或 `c.GetPostForm()`。

此外，请求数据还可能来自 Header、Cookie 和上传文件，但最先需要掌握的是上面三类。

:::

### Multipart/Urlencoded 表单

浏览器提交普通表单时，常见的请求体格式有两种：

| Content-Type                        | 特点                                   | 常见场景               |
| ----------------------------------- | -------------------------------------- | ---------------------- |
| `application/x-www-form-urlencoded` | 将字段编码成 `key=value&key2=value2`   | 只有普通文本字段的表单 |
| `multipart/form-data`               | 每个字段是一个独立部分，还可以携带文件 | 同时提交字段和文件     |

Gin 使用下面的方法读取这两种表单中的普通字段：

| 方法                                  | 字段不存在时的结果                           |
| ------------------------------------- | -------------------------------------------- |
| `c.PostForm("key")`                   | 返回空字符串                                 |
| `c.DefaultPostForm("key", "default")` | 返回指定的默认值                             |
| `c.GetPostForm("key")`                | 返回 `(value, exists)`，可以判断字段是否存在 |

三种方法在不同请求情况下的结果：

| 表单请求体       | `PostForm("name")` | `DefaultPostForm("name", "Guest")` | `GetPostForm("name")` |
| ---------------- | ------------------ | ---------------------------------- | --------------------- |
| `name=Tom`       | `"Tom"`            | `"Tom"`                            | `"Tom", true`         |
| `name=`          | `""`               | `""`                               | `"", true`            |
| 没有 `name` 字段 | `""`               | `"Guest"`                          | `"", false`           |

#### PostForm

`PostForm` 只返回字段值。字段不存在和字段存在但内容为空时，它都会返回空字符串，因此不能区分这两种情况：

```go
name := c.PostForm("name")
```

#### DefaultPostForm

`DefaultPostForm` 只在字段不存在时返回默认值。如果客户端提交了 `name=`，说明字段存在但值为空，此时得到的仍然是空字符串，不会使用默认值：

```go
name := c.DefaultPostForm("name", "Guest")
```

#### GetPostForm

`GetPostForm` 同时返回字段值和字段是否存在，适合处理必填字段或需要区分“未提交”和“提交空值”的场景：

```go
name, exists := c.GetPostForm("name")
if !exists {
	c.JSON(http.StatusBadRequest, gin.H{
		"error": "缺少 name 字段",
	})
	return
}
```

选择方法时可以这样记：

```text
只想获取字段值             → PostForm
字段缺失时需要默认值       → DefaultPostForm
需要判断字段是否真的提交   → GetPostForm
```

```go
router.POST("/form_post", func(c *gin.Context) {
	message := c.PostForm("message") // 这里的"message"来自前端的用户表单
	nick := c.DefaultPostForm("nick", "anonymous") // 这里的"nick"来自前端的用户表单

	c.JSON(http.StatusOK, gin.H{
		"message": message,
		"nick":    nick,
	})
})
```

两种请求都可以被 `PostForm` 读取。需要注意：

- `PostForm` 只读取请求体中的表单字段，不读取 URL 查询字符串。
- `PostForm` 不能读取 JSON 请求体；JSON 应使用 `ShouldBindJSON` 等绑定方法。
- `PostForm` 无法区分“字段不存在”和“字段存在但值为空”，需要区分时使用 `GetPostForm`。

官方文档：[Multipart/Urlencoded 表单](https://gin-gonic.com/zh-cn/docs/routing/multipart-urlencoded-form/)

### 查询字符串和表单

一个请求可以同时包含 URL 查询参数和请求体表单数据。例如：

```text
POST /post?id=123&page=2
Content-Type: application/x-www-form-urlencoded

name=Tom&message=Hello
```

Gin 将这两个数据源分开读取：

| 数据位置                  | 获取方法                                     |
| ------------------------- | -------------------------------------------- |
| URL 中 `?` 后面的查询参数 | `Query`、`DefaultQuery`、`GetQuery`          |
| 请求体中的表单字段        | `PostForm`、`DefaultPostForm`、`GetPostForm` |

```go
router.POST("/post", func(c *gin.Context) {
	id := c.Query("id")
	page := c.DefaultQuery("page", "1")

	name := c.PostForm("name")
	message := c.PostForm("message")

	c.JSON(http.StatusOK, gin.H{
		"id":      id,
		"page":    page,
		"name":    name,
		"message": message,
	})
})
```

测试：

```powershell
curl.exe -X POST "http://localhost:8080/post?id=123&page=2" `
  -d "name=Tom&message=Hello"
```

`Query` 和 `PostForm` 不会交叉读取。字段较多时，可以在后面的数据绑定章节使用结构体和 `ShouldBind`，让 Gin 自动解析字段。

官方文档：[查询字符串和表单](https://gin-gonic.com/zh-cn/docs/routing/query-and-post-form/)

### Map 作为查询字符串或表单参数

当多个参数属于同一个逻辑对象时，可以使用带方括号的 Map 形式传递：

```text
/search?filters[name]=gin&filters[level]=beginner
```

使用 `QueryMap` 获取查询字符串中的 Map：

```go
router.GET("/search", func(c *gin.Context) {
	filters := c.QueryMap("filters")

	c.JSON(http.StatusOK, gin.H{
		"filters": filters,
	})
})
```

得到：

```json
{
  "filters": {
    "name": "gin",
    "level": "beginner"
  }
}
```

表单中的 Map 使用 `PostFormMap`：

```go
router.POST("/users", func(c *gin.Context) {
	user := c.PostFormMap("user")

	c.JSON(http.StatusOK, gin.H{
		"user": user,
	})
})
```

测试：

```powershell
curl.exe -X POST http://localhost:8080/users `
  -d "user[name]=Tom&user[role]=admin"
```

常用方法：

```go
c.QueryMap("filters")
c.GetQueryMap("filters")
c.PostFormMap("user")
c.GetPostFormMap("user")
```

`GetQueryMap` 和 `GetPostFormMap` 会额外返回一个布尔值，用来判断整组参数是否存在。这些方法得到的是 `map[string]string`；如果需要数组或复杂嵌套结构，更适合使用数据绑定。

官方文档：[Map 作为查询字符串或表单参数](https://gin-gonic.com/zh-cn/docs/routing/map-as-querystring-or-postform/)

### 文件上传

#### 文件上传

文件上传使用 `multipart/form-data`。Gin 在 `gin.Context` 上提供了三个主要方法：

| 方法                            | 作用                                            |
| ------------------------------- | ----------------------------------------------- |
| `c.FormFile("file")`            | 按字段名获取单个文件                            |
| `c.MultipartForm()`             | 解析整个 Multipart 表单，获取多个文件和普通字段 |
| `c.SaveUploadedFile(file, dst)` | 将上传的文件保存到指定路径                      |

Gin 默认允许 Multipart 解析使用最多 32 MiB 内存：

```go
router.MaxMultipartMemory = 8 << 20 // 调整为 8 MiB
```

`MaxMultipartMemory` 只是内存阈值，不是上传文件的硬性大小限制。超过该阈值的数据可能写入磁盘临时文件。真正限制请求体总大小需要使用后面的 `http.MaxBytesReader`。

安全注意事项：

- 不能直接信任客户端提供的 `file.Filename`。
- 保存前至少使用 `filepath.Base` 清理文件名，实际项目最好生成服务器自己的唯一文件名。
- 应检查允许的文件类型、扩展名和内容，避免保存可执行文件或危险文件。
- 上传目录应与公开静态目录隔离，并设置合理的文件大小限制。

官方文档：[文件上传](https://gin-gonic.com/zh-cn/docs/routing/upload-file/)

#### 单文件

单文件上传使用 `FormFile` 获取文件，再使用 `SaveUploadedFile` 保存：

```go
router.POST("/upload", func(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "没有收到文件",
		})
		return
	}

	filename := filepath.Base(file.Filename)
	dst := filepath.Join("uploads", filename)

	if err := c.SaveUploadedFile(file, dst); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "保存文件失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"filename": filename,
	})
})
```

测试：

```powershell
curl.exe -X POST http://localhost:8080/upload `
  -F "file=@D:\test\hello.txt"
```

客户端字段名 `file` 必须和 `c.FormFile("file")` 一致。保存前还要确保 `uploads` 目录存在，并考虑同名文件覆盖问题。

官方文档：[单文件](https://gin-gonic.com/zh-cn/docs/routing/upload-file/single-file/)

#### 多文件

一次上传多个文件时，客户端应为所有文件使用相同的字段名：

```powershell
curl.exe -X POST http://localhost:8080/uploads `
  -F "files=@D:\test\a.txt" `
  -F "files=@D:\test\b.txt"
```

服务端通过 `MultipartForm` 获取所有文件：

```go
router.POST("/uploads", func(c *gin.Context) {
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "表单解析失败",
		})
		return
	}

	files := form.File["files"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "没有收到文件",
		})
		return
	}

	for _, file := range files {
		filename := filepath.Base(file.Filename)
		dst := filepath.Join("uploads", filename)

		if err := c.SaveUploadedFile(file, dst); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "保存文件失败",
			})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"count": len(files),
	})
})
```

`form.File["files"]` 中的键必须和客户端提交的字段名一致。实际项目还需要考虑文件重名，以及部分文件已经保存、后续文件保存失败时如何回滚。

官方文档：[多文件](https://gin-gonic.com/zh-cn/docs/routing/upload-file/multiple-file/)

#### 限制上传大小

限制上传时，需要区分内存阈值和请求体硬限制：

| 配置                        | 限制的对象               | 是否能严格拒绝超大上传       |
| --------------------------- | ------------------------ | ---------------------------- |
| `router.MaxMultipartMemory` | Multipart 解析使用的内存 | 否，超出部分可能进入临时文件 |
| `http.MaxBytesReader`       | 整个 HTTP 请求体         | 是                           |

使用 `http.MaxBytesReader` 限制请求体总大小：

```go
const MaxUploadSize = 10 << 20 // 10 MiB

router.POST("/upload", func(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(
		c.Writer,
		c.Request.Body,
		MaxUploadSize,
	)

	if err := c.Request.ParseMultipartForm(8 << 20); err != nil {
		var maxBytesErr *http.MaxBytesError
		if errors.As(err, &maxBytesErr) {
			c.JSON(http.StatusRequestEntityTooLarge, gin.H{
				"error": "上传内容超过大小限制",
			})
			return
		}

		c.JSON(http.StatusBadRequest, gin.H{
			"error": "表单解析失败",
		})
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "没有收到文件",
		})
		return
	}

	filename := filepath.Base(file.Filename)
	dst := filepath.Join("uploads", filename)
	if err := c.SaveUploadedFile(file, dst); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "保存文件失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"filename": filename,
	})
})
```

超过限制时应返回 `413 Request Entity Too Large`。必须在解析表单或调用 `FormFile` 之前包装 `c.Request.Body`。这个限制作用于整个 Multipart 请求体，因此还包含表单边界和字段头等额外字节。

一句话区分：

```text
MaxMultipartMemory 控制“最多用多少内存解析”；
MaxBytesReader 控制“客户端最多能上传多少请求数据”。
```

官方文档：[限制上传大小](https://gin-gonic.com/zh-cn/docs/routing/upload-file/limit-bytes/)

### 路由分组

路由分组用于把相关路由组织在共同的 URL 前缀下，常用于 API 版本、业务模块和共享中间件。

```go
router := gin.Default()

v1 := router.Group("/api/v1")
v1.GET("/users", listUsers)
v1.POST("/users", createUser)
v1.GET("/users/:id", getUser)
```

最终注册的完整路径是：

```text
GET  /api/v1/users
POST /api/v1/users
GET  /api/v1/users/:id
```

路由组可以嵌套：

```go
api := router.Group("/api")
v1 := api.Group("/v1")
users := v1.Group("/users")

users.GET("", listUsers)
users.GET("/:id", getUser)
```

还可以把中间件应用到整个路由组：

```go
admin := router.Group("/admin")
admin.Use(authMiddleware)

admin.GET("/users", listUsers)
admin.DELETE("/users/:id", deleteUser)
```

这样 `/admin` 下的所有路由都会先执行 `authMiddleware`。官网示例中用于包围路由组的 `{}` 只是普通 Go 代码块，用于视觉分隔，并不是路由分组的必需语法。

官方文档：[路由分组](https://gin-gonic.com/zh-cn/docs/routing/grouping-routes/)

### 重定向

重定向分为 HTTP 重定向和 Gin 内部路由转发。

#### HTTP 重定向

HTTP 重定向会告诉客户端访问另一个 URL，客户端收到响应后会重新发送请求：

```go
router.GET("/old", func(c *gin.Context) {
	c.Redirect(http.StatusMovedPermanently, "/new")
})
```

常见状态码：

| 状态码 | 含义       | 是否要求保留原请求方法 |
| ------ | ---------- | ---------------------- |
| 301    | 永久重定向 | 不一定                 |
| 302    | 临时重定向 | 不一定                 |
| 307    | 临时重定向 | 是                     |
| 308    | 永久重定向 | 是                     |

如果需要把 POST 请求重定向后仍保持 POST，应使用 307 或 308，而不是依赖 301 或 302。

#### Gin 内部路由转发

内部转发不会让客户端重新发起请求，而是在服务器内部修改路径并重新匹配路由：

```go
router.GET("/test", func(c *gin.Context) {
	c.Request.URL.Path = "/final"
	router.HandleContext(c)
})

router.GET("/final", func(c *gin.Context) {
	c.String(http.StatusOK, "final page")
})
```

区别：

```text
c.Redirect：客户端知道地址发生了变化，并重新发出请求。
HandleContext：服务器内部转发，客户端地址不会改变。
```

内部转发时应避免两个路由互相转发，否则可能产生循环。

官方文档：[重定向](https://gin-gonic.com/zh-cn/docs/routing/redirects/)

### API设计模式

API 设计模式不是新的 Gin API，而是关于如何设计一致、容易理解和维护的 HTTP 接口。

#### 1. 使用资源名称设计路径

推荐让路径表示资源，让 HTTP 方法表示操作：

| 方法和路径          | 作用             |
| ------------------- | ---------------- |
| `GET /users`        | 查询用户列表     |
| `POST /users`       | 创建用户         |
| `GET /users/:id`    | 查询指定用户     |
| `PUT /users/:id`    | 完整更新指定用户 |
| `PATCH /users/:id`  | 部分更新指定用户 |
| `DELETE /users/:id` | 删除指定用户     |

推荐：

```text
GET  /users
POST /users
```

不推荐把动作重复写进路径：

```text
GET  /getUsers
POST /createUser
```

#### 2. 使用一致的响应格式

成功响应：

```json
{
  "success": true,
  "data": {
    "id": 42,
    "name": "Tom"
  }
}
```

失败响应：

```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "用户不存在"
  }
}
```

统一格式可以让调用者始终知道从哪里读取数据、错误信息和分页元数据。

#### 3. 正确使用 HTTP 状态码

| 场景                 | 常用状态码                |
| -------------------- | ------------------------- |
| 查询或更新成功       | 200 OK                    |
| 创建成功             | 201 Created               |
| 删除成功且没有响应体 | 204 No Content            |
| 请求参数错误         | 400 Bad Request           |
| 未登录               | 401 Unauthorized          |
| 已登录但无权限       | 403 Forbidden             |
| 资源不存在           | 404 Not Found             |
| 资源状态冲突         | 409 Conflict              |
| 服务器内部错误       | 500 Internal Server Error |

#### 4. 分页

简单的页码分页：

```text
GET /users?page=2&page_size=20
```

Limit/Offset 分页：

```text
GET /users?limit=20&offset=40
```

数据量很大或数据频繁变化时，可以使用游标分页：

```text
GET /users?cursor=10086&limit=20
```

服务端应为 `limit` 设置默认值和最大值，避免客户端一次请求过多数据。

#### 5. 过滤和排序

使用查询字符串描述列表的过滤与排序条件：

```text
GET /products?category=book&sort=price&order=asc
```

路径仍然表示产品集合，查询参数表示“怎样查询这组产品”。

#### 6. API 版本管理

学习阶段最直观的是 URL 路径版本：

```text
/api/v1/users
/api/v2/users
```

可以结合路由分组：

```go
v1 := router.Group("/api/v1")
v2 := router.Group("/api/v2")
```

也可以通过请求头传递版本，但路径版本更容易观察、测试和调试。

#### 7. 结构化错误

错误响应不仅要给人看，也要让程序能够稳定判断错误类型：

```json
{
  "success": false,
  "error": {
    "code": "INVALID_ARGUMENT",
    "message": "page 必须是正整数"
  }
}
```

`code` 是稳定的机器可读标识，`message` 是给开发者或用户阅读的说明。不要把数据库错误、文件路径或堆栈等内部信息直接返回给客户端。

#### 8. 总结

1. URL 使用名词表示资源，HTTP 方法表示操作。
2. 同一项目应采用一致的成功和失败响应格式。
3. 根据处理结果返回准确的 HTTP 状态码。
4. 列表接口应考虑分页、过滤和排序。
5. API 版本可以通过路由分组统一管理。
6. 错误应包含稳定的错误码和安全、清晰的说明。

官方文档：[API 设计模式](https://gin-gonic.com/zh-cn/docs/routing/api-design/)

## 数据绑定

### 数据绑定概述

数据绑定可以把 Query、URI、JSON、表单、Header 等请求数据自动解析到 Go 结构体，并根据 `binding` 标签执行验证。

可以先把数据绑定理解为“从 HTTP 请求中获取数据”，但它不只是把原始数据读出来，还会继续完成下面几件事：

1. **读取数据**：从请求体、查询字符串、路径参数、表单或请求头中取得原始值。
2. **解析格式**：例如解析 JSON、XML 或表单格式。
3. **映射字段**：根据 `json`、`form`、`uri`、`header` 等标签，把请求字段对应到结构体字段。
4. **转换类型**：例如把请求中的数字转换为 Go 的 `int`，把日期字符串转换为时间类型。
5. **验证数据**：根据 `binding` 标签检查必填项、长度、数值范围和格式。

例如客户端发送：

```json
{
  "name": "Tom",
  "age": 20,
  "email": "tom@example.com"
}
```

调用：

```go
var req CreateUserRequest
err := c.ShouldBindJSON(&req)
```

绑定成功后，Gin 已经把 JSON 中的数据填写到了结构体中：

```go
req.Name  // "Tom"
req.Age   // 20
req.Email // "tom@example.com"
```

因此可以这样记忆：

```text
数据绑定 = 获取请求数据 + 解析格式 + 映射字段 + 类型转换 + 参数验证
```

数据绑定只负责接收和检查请求数据，不代表将数据保存到数据库。是否写入数据库仍然需要在后续业务逻辑中完成。

```text
HTTP 请求数据
    ↓
Gin 根据绑定方法、HTTP 方法和 Content-Type 选择 Binder
    ↓
按照结构体标签映射字段并转换 Go 类型
    ↓
执行 binding 验证
    ↓
得到 Handler 可以直接使用的结构体
```

与逐个读取参数相比：

```go
name := c.PostForm("name")
age := c.PostForm("age")
email := c.PostForm("email")
```

使用数据绑定只需要定义结构体并调用一次绑定方法：

```go
type CreateUserRequest struct {
	Name  string `json:"name" binding:"required,min=2,max=20"`
	Age   int    `json:"age" binding:"required,gte=1,lte=120"`
	Email string `json:"email" binding:"required,email"`
}

var req CreateUserRequest
if err := c.ShouldBindJSON(&req); err != nil {
	// 处理绑定或验证错误
}
```

常见结构体标签：

| 标签                     | 数据来源                                 |
| ------------------------ | ---------------------------------------- |
| `json:"name"`            | JSON 请求体                              |
| `xml:"name"`             | XML 请求体                               |
| `yaml:"name"`            | YAML 请求体                              |
| `form:"name"`            | 查询字符串、Urlencoded 或 Multipart 表单 |
| `uri:"id"`               | URL 路径参数                             |
| `header:"Authorization"` | HTTP 请求头                              |
| `binding:"required"`     | 验证规则                                 |

通常应为不同接口定义专用的请求 DTO，不要直接把客户端请求绑定到数据库模型，避免客户端修改本不应该开放的字段。

官方文档：[数据绑定](https://gin-gonic.com/zh-cn/docs/binding/)

### 模型绑定和验证

#### Bind 与 ShouldBind

Gin 提供两组绑定方法：

| 方法系列                                             | 绑定失败时的行为                 | 使用建议                        |
| ---------------------------------------------------- | -------------------------------- | ------------------------------- |
| `Bind`、`BindJSON`、`BindQuery` 等                   | Gin 自动中止请求并写入 400 响应  | 适合接受 Gin 默认错误响应的场景 |
| `ShouldBind`、`ShouldBindJSON`、`ShouldBindQuery` 等 | 只返回 `error`，由开发者决定响应 | 大多数业务接口优先使用          |

`Bind` 系列在出错时已经写入响应头。如果之后再次尝试修改状态码，可能出现 `Headers were already written` 警告。因此通常使用 `ShouldBind` 系列获得更好的控制。

#### ShouldBind 系列完整对比

当前项目使用 Gin `v1.12.0`。在这个版本中，`*gin.Context` 一共有 **16 个**以 `Should` 开头的绑定方法。前面经常提到的 `ShouldBind`、`ShouldBindJSON`、`ShouldBindQuery`、`ShouldBindUri` 和 `ShouldBindHeader` 只是业务开发中最常用的五个，并不是全部方法。

这些方法的共同特点是：绑定失败时只返回 `error`，不会自动写入 400 响应，也不会自动中止 Handler。调用方必须处理错误并及时 `return`：

```go
if err := c.ShouldBindJSON(&req); err != nil {
	c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	return
}
```

##### 普通绑定与指定数据来源

| 方法               | 读取的数据                                         | 字段标签或目标类型                           | 典型用途                                                       |
| ------------------ | -------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------- |
| `ShouldBind`       | 根据 HTTP 方法和 `Content-Type` 自动选择一种绑定器 | 由实际格式决定                               | HTML 表单，或者确实需要自动选择格式的接口                      |
| `ShouldBindJSON`   | 请求体，强制按 JSON 解析                           | `json`                                       | REST API 的创建、修改请求                                      |
| `ShouldBindXML`    | 请求体，强制按 XML 解析                            | `xml`                                        | 对接 XML 协议                                                  |
| `ShouldBindYAML`   | 请求体，强制按 YAML 解析                           | `yaml`                                       | 接收 YAML 配置或协议数据                                       |
| `ShouldBindTOML`   | 请求体，强制按 TOML 解析                           | `toml`                                       | 接收 TOML 配置数据                                             |
| `ShouldBindPlain`  | 原始文本请求体                                     | `*string` 或 `*[]byte`，不使用结构体字段标签 | Webhook、签名原文或纯文本接口                                  |
| `ShouldBindQuery`  | URL 中 `?` 后面的查询字符串                        | `form`                                       | 分页、搜索、排序和筛选                                         |
| `ShouldBindUri`    | 路由中的 `:id` 等路径参数                          | `uri`                                        | 资源 ID、订单号等路径参数                                      |
| `ShouldBindHeader` | HTTP 请求头                                        | `header`                                     | Token、API 版本和客户端元数据                                  |
| `ShouldBindWith`   | 由调用方明确传入的绑定器决定                       | 取决于绑定器                                 | 需要显式使用 `binding.JSON`、`binding.Form` 等绑定器的进阶场景 |

`ShouldBind` 是“自动选择一种绑定器”，不是把 Query、URI、Header 和 Body 一次全部绑定。一个请求同时包含多种来源时，应分别绑定：

```go
if err := c.ShouldBindUri(&uri); err != nil {
	// 处理路径参数错误
}

if err := c.ShouldBindQuery(&query); err != nil {
	// 处理查询参数错误
}
```

`ShouldBindUri` 和 `ShouldBindHeader` 不会被普通的 `ShouldBind` 自动替代；读取路径参数或请求头时，应显式调用对应方法。

##### 需要重复读取请求体时

普通的请求体绑定会消费 `c.Request.Body`。如果确实需要把同一份请求体尝试绑定到多个结构体，可以使用下面这一组会缓存请求体的方法：

| 方法                      | 作用                                                        |
| ------------------------- | ----------------------------------------------------------- |
| `ShouldBindBodyWith`      | 缓存请求体，并使用调用方传入的 `binding.BindingBody` 绑定器 |
| `ShouldBindBodyWithJSON`  | `ShouldBindBodyWith(&obj, binding.JSON)` 的快捷方法         |
| `ShouldBindBodyWithXML`   | `ShouldBindBodyWith(&obj, binding.XML)` 的快捷方法          |
| `ShouldBindBodyWithYAML`  | `ShouldBindBodyWith(&obj, binding.YAML)` 的快捷方法         |
| `ShouldBindBodyWithTOML`  | `ShouldBindBodyWith(&obj, binding.TOML)` 的快捷方法         |
| `ShouldBindBodyWithPlain` | `ShouldBindBodyWith(&obj, binding.Plain)` 的快捷方法        |

这一组方法会额外保存请求体字节，因此会增加内存开销。普通接口只绑定一次请求体时，不要为了方便而使用它们，继续使用 `ShouldBindJSON` 等普通方法即可。

##### 实际开发中的选择顺序

1. 明确是 JSON 请求体：使用 `ShouldBindJSON`。
2. 查询参数：使用 `ShouldBindQuery`。
3. 路径参数：使用 `ShouldBindUri`。
4. 请求头：使用 `ShouldBindHeader`。
5. Urlencoded 或 Multipart 表单：使用 `ShouldBind`。
6. XML、YAML、TOML 或纯文本：使用对应的专用方法。
7. 同一个请求体确实需要绑定多次：才使用 `ShouldBindBodyWith...`。

如果接口契约已经明确，优先使用专用方法，让代码直接表达数据来源。只有希望根据 HTTP 方法和 `Content-Type` 自动选择格式时，才使用通用的 `ShouldBind`。

官方源码参考：[Gin v1.12.0 Context 的 ShouldBind 方法](https://github.com/gin-gonic/gin/blob/v1.12.0/context.go#L829-L967)

#### JSON 绑定示例

下面是本次 `POST /users` 练习的正确版本：

```go
type CreateUserRequest struct {
	Name  string `json:"name" binding:"required,min=2,max=20"`
	Age   int    `json:"age" binding:"required,gte=1,lte=120"`
	Email string `json:"email" binding:"required,email"`
}

func createUserHandler(c *gin.Context) {
	var req CreateUserRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data": req,
	})
}
```

路由注册：

```go
router.POST("/users", createUserHandler)
```

客户端应设置与数据格式对应的 `Content-Type`，以正确表达 HTTP 接口契约：

```powershell
curl.exe -X POST http://localhost:8080/users `
  -H "Content-Type: application/json" `
  -d '{"name":"Tom","age":20,"email":"tom@example.com"}'
```

`ShouldBindJSON` 会直接强制使用 JSON 绑定器，不依赖 `Content-Type` 选择绑定器；但客户端仍应发送 `Content-Type: application/json`。使用通用的 `ShouldBind` 时，Gin 才会根据 HTTP 方法和 `Content-Type` 自动选择绑定器。

复习时至少检查：正确数据返回 201；缺少 `name`、邮箱格式错误或年龄越界时返回 400。错误响应后必须 `return`。

#### 常用验证规则

Gin 使用 `go-playground/validator/v10` 执行验证。

| 验证标签            | 含义                           |
| ------------------- | ------------------------------ |
| `required`          | 必填，不能是对应 Go 类型的零值 |
| `omitempty`         | 字段为空时跳过后续验证         |
| `min=2`、`max=50`   | 字符串长度或数值范围           |
| `gte=1`、`lte=100`  | 大于等于或小于等于指定值       |
| `email`             | 邮箱格式                       |
| `uuid`              | UUID 格式                      |
| `oneof=user admin`  | 值只能是给定选项之一           |
| `eqfield=Password`  | 必须等于另一个字段             |
| `gtfield=StartTime` | 必须大于另一个字段             |
| `-`                 | 跳过验证                       |

多个规则用逗号连接，表示必须全部通过：

```go
Name string `json:"name" binding:"required,min=2,max=50"`
```

`required` 会把对应类型的零值视为空。例如 `int` 的零值是 `0`：

```go
Age int `json:"age" binding:"required"`
```

如果业务需要区分“没有传 age”和“明确传了 0”，可以使用指针：

```go
Age *int `json:"age" binding:"required"`
```

此时没传是 `nil`，传了 `0` 则是指向 `0` 的指针。

官方文档：[模型绑定和验证](https://gin-gonic.com/zh-cn/docs/binding/binding-and-validation/)

### 自定义验证器

当 `required`、`min`、`email` 等内置标签无法表达业务规则时，可以向 Gin 使用的 Validator 注册自定义验证函数。

本节练习：注册用户时，大小写不敏感地禁止使用 `admin`、`root`、`system`。

需要补充以下导入：

```go
import (
	"strings"

	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
)
```

定义字段级自定义验证器。验证函数返回 `false` 表示验证失败，返回 `true` 表示验证通过：

```go
func isUsername(fl validator.FieldLevel) bool {
	username := strings.ToLower(fl.Field().String())

	switch username {
	case "admin", "root", "system":
		return false
	default:
		return true
	}
}
```

在结构体的 `binding` 标签中使用自定义规则 `notreserved`：

```go
type RegistrationRequest struct {
	Username string `json:"username" binding:"required,min=3,max=20,notreserved"`
	Email    string `json:"email" binding:"required,email"`
}
```

程序启动时，通过 `binding.Validator.Engine()` 取得底层验证器并完成注册。注册名称必须与结构体标签中的 `notreserved` 完全一致：

```go
v, ok := binding.Validator.Engine().(*validator.Validate)
if !ok {
	panic("无法获取 validator 验证器")
}

if err := v.RegisterValidation("notreserved", isUsername); err != nil {
	panic(err)
}

router.POST("/registrations", createRegistrationHandler)
```

Handler 仍然只负责绑定和响应，不要在 Handler 中重复判断保留用户名：

```go
func createRegistrationHandler(c *gin.Context) {
	var req RegistrationRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, req)
}
```

验证结果：

- 合法用户名和邮箱：返回 `201`。
- `admin`、`ROOT`、`SyStEm`：返回 `400`。
- 缺少 `username`、邮箱格式错误、用户名长度不符合要求：返回 `400`。

要点：`required` 负责非空验证，`notreserved` 只负责业务规则；自定义验证器负责判断“已经绑定完成的 Go 值是否合法”。

官方文档：[自定义验证器](https://gin-gonic.com/zh-cn/docs/examples/custom-validators/)

### 仅绑定查询字符串

`ShouldBindQuery` 只读取 URL 查询字符串，完全忽略请求体。即使当前请求是 POST，也不会让请求体字段覆盖查询参数。

下面是本次分页查询练习的正确版本：

```go
type ListUsersQuery struct {
	Keyword  string `form:"keyword" json:"keyword"`
	Page     int    `form:"page,default=1" json:"page" binding:"gte=1"`
	PageSize int    `form:"page_size,default=10" json:"page_size" binding:"gte=1,lte=100"`
}

func listUsersHandler(c *gin.Context) {
	var query ListUsersQuery

	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, query)
}
```

路由注册：

```go
router.GET("/users", listUsersHandler)
```

请求：

```text
GET /users?keyword=tom&page=2&page_size=10
```

复习时至少检查：不传参数时得到 `page=1`、`page_size=10`；`page=0`、`page_size=101` 或 `page=abc` 时返回 400。

官方文档：[仅绑定查询字符串](https://gin-gonic.com/zh-cn/docs/binding/only-bind-query-string/)

### 绑定查询字符串或 POST 数据

`ShouldBind` 会根据 HTTP 方法和 `Content-Type` 自动选择绑定器：

- GET 请求通常使用查询字符串绑定。
- `application/json` 使用 JSON 绑定。
- `application/xml` 使用 XML 绑定。
- `application/x-www-form-urlencoded` 和 `multipart/form-data` 使用表单绑定。

```go
type Person struct {
	Name string `form:"name" json:"name" binding:"required"`
	Age  int    `form:"age" json:"age" binding:"gte=0"`
}

router.Any("/person", func(c *gin.Context) {
	var person Person
	if err := c.ShouldBind(&person); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, person)
})
```

自动选择虽然方便，但一个接口同时接受多种格式会增加理解和测试成本。实际项目通常应该明确接口接受的格式。

官方文档：[绑定查询字符串或 POST 数据](https://gin-gonic.com/zh-cn/docs/binding/bind-query-or-post/)

### 绑定表单字段的默认值

在 `form` 标签中使用 `default`，可以为缺失的查询参数或表单字段设置默认值：

```go
type ListQuery struct {
	Page     int    `form:"page,default=1"`
	PageSize int    `form:"page_size,default=20"`
	Sort     string `form:"sort,default=id"`
}
```

请求没有携带这些参数时，会得到：

```text
Page     = 1
PageSize = 20
Sort     = "id"
```

从 Gin v1.11 开始，带有明确集合格式的切片和数组也支持默认值。

官方文档：[绑定表单字段的默认值](https://gin-gonic.com/zh-cn/docs/binding/bind-default-values/)

### 数组的集合格式

`collection_format` 控制 Gin 如何拆分切片或数组参数：

| 格式    | 请求示例           |
| ------- | ------------------ | ---- |
| `multi` | `tags=go&tags=web` |
| `csv`   | `tags=go,web`      |
| `ssv`   | `tags=go web`      |
| `tsv`   | 使用制表符分隔     |
| `pipes` | `tags=go           | web` |

```go
type SearchQuery struct {
	Tags   []string `form:"tags" collection_format:"csv"`
	Labels []string `form:"labels" collection_format:"multi"`
}
```

请求：

```text
GET /search?tags=go,web,gin&labels=bug&labels=helpwanted
```

当前官方文档标注这些集合格式由 Gin v1.11+ 支持。

官方文档：[数组的集合格式](https://gin-gonic.com/zh-cn/docs/binding/collection-format-for-arrays/)

### 绑定 URI

`ShouldBindUri` 使用 `uri` 标签将路径参数直接绑定到结构体，并可以同时验证类型和格式：

下面是本次用户 ID 练习的正确版本：

```go
type UserURI struct {
	ID int `uri:"id" json:"id" binding:"required,gte=1"`
}

func getUserHandler(c *gin.Context) {
	var uri UserURI

	if err := c.ShouldBindUri(&uri); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, uri)
}
```

路由：

```go
router.GET("/users/:id", getUserHandler)
```

与手动 `c.Param("id")` 相比，URI 绑定可以在一次调用中完成读取和验证。

复习时注意：路由中的 `:id` 必须与 `uri:"id"` 对应；多个验证规则之间不能留空格，正确写法是 `binding:"required,gte=1"`。`/users/1` 和 `/users/100` 返回 200，`/users/0`、`/users/abc` 和 `/users/-1` 返回 400。

官方文档：[绑定 URI](https://gin-gonic.com/zh-cn/docs/binding/bind-uri/)

### 绑定自定义反序列化器

自定义反序列化解决的是“请求中的字符串应该怎样转换成自定义 Go 类型”。当前 Gin 支持通过 `encoding.TextUnmarshaler` 或 `binding.BindUnmarshaler` 定义转换逻辑。

```go
type Birthday string

func (b *Birthday) UnmarshalText(text []byte) error {
	*b = Birthday(strings.ReplaceAll(string(text), "-", "/"))
	return nil
}

type BirthdayQuery struct {
	Birthday Birthday `form:"birthday,parser=encoding.TextUnmarshaler"`
}
```

区别：

```text
自定义反序列化器：请求字符串怎样转换成 Go 值。
自定义验证器：转换后的 Go 值是否合法。
```

这是进阶功能，普通字符串、数字和日期能够满足需求时不必自定义。

官方文档：[绑定自定义反序列化器](https://gin-gonic.com/zh-cn/docs/binding/bind-custom-unmarshaler/)

### 绑定请求头

`ShouldBindHeader` 使用 `header` 标签绑定 HTTP 请求头：

下面是本次 `GET /client-info` 练习的正确版本：

```go
type ClientHeaders struct {
	RequestID     string `header:"X-Request-ID" json:"request_id" binding:"required"`
	ClientVersion string `header:"X-Client-Version" json:"client_version" binding:"required"`
	Platform      string `header:"X-Platform" json:"platform" binding:"required,oneof=web ios android"`
}

func getClientInfoHandler(c *gin.Context) {
	var header ClientHeaders

	if err := c.ShouldBindHeader(&header); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, header)
}
```

路由注册：

```go
router.GET("/client-info", getClientInfoHandler)
```

三个标签的职责不同：

| 标签                                       | 作用                                                |
| ------------------------------------------ | --------------------------------------------------- |
| `header:"X-Platform"`                      | 指定从哪个 HTTP Header 读取值                       |
| `binding:"required,oneof=web ios android"` | 验证读取后的值是否合法                              |
| `json:"platform"`                          | 将结构体作为 JSON 响应时，把字段名输出为 `platform` |

`json` 标签不参与 `ShouldBindHeader`，因此不是 Header 绑定的必需项。如果接口会直接返回该结构体，建议为所有字段统一添加 `json` 标签；否则默认会输出 Go 字段名，例如 `RequestID` 和 `ClientVersion`。

HTTP 请求头名称不区分大小写，因此 `Authorization` 和 `authorization` 都可以匹配。

复习时至少检查：三个 Header 全部合法时返回 200；缺少 `X-Request-ID` 或平台值不在允许范围内时返回 400；Header 名全部使用小写时仍能绑定成功。

官方文档：[绑定请求头](https://gin-gonic.com/zh-cn/docs/binding/bind-header/)

### 绑定 HTML 复选框

多个复选框使用相同的 `name` 时会提交多个值：

```html
<input type="checkbox" name="colors[]" value="red" />
<input type="checkbox" name="colors[]" value="green" />
```

绑定到字符串切片：

```go
type ColorForm struct {
	Colors []string `form:"colors[]"`
}
```

同时选择红色和绿色时，结果为：

```go
[]string{"red", "green"}
```

官方文档：[绑定 HTML 复选框](https://gin-gonic.com/zh-cn/docs/binding/bind-html-checkbox/)

### Multipart/Urlencoded 绑定

`ShouldBind` 可以把普通表单和 Multipart 表单直接绑定到结构体：

下面是本次 `POST /preferences` 练习的正确版本：

```go
type PreferenceForm struct {
	Username      string `form:"username" json:"username" binding:"required,min=2,max=20"`
	Theme         string `form:"theme" json:"theme" binding:"required,oneof=light dark system"`
	Notifications bool   `form:"notifications,default=false" json:"notifications"`
}

func updatePreferencesHandler(c *gin.Context) {
	var form PreferenceForm

	if err := c.ShouldBind(&form); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, form)
}
```

路由注册：

```go
router.POST("/preferences", updatePreferencesHandler)
```

它可以接受：

```text
application/x-www-form-urlencoded
multipart/form-data
```

`ShouldBind` 会根据 `Content-Type` 自动选择表单绑定器。省略布尔字段时，Go 的 `bool` 零值本来就是 `false`；写成 `form:"notifications,default=false"` 可以把默认值意图直接记录在标签中。

复习时至少检查：合法的 Urlencoded 和 Multipart 请求返回 200；缺少 `username`、`theme` 不在允许范围内或 `notifications` 无法转换成布尔值时返回 400。

Multipart 中的文件也可以绑定到 `*multipart.FileHeader`：

```go
type UploadForm struct {
	Name   string                `form:"name" binding:"required"`
	Avatar *multipart.FileHeader `form:"avatar" binding:"required"`
}
```

绑定成功后仍然需要验证文件，并使用 `SaveUploadedFile` 等方法决定保存位置。

官方文档：[Multipart/Urlencoded 绑定](https://gin-gonic.com/zh-cn/docs/binding/multipart-urlencoded-binding/)

### 使用自定义结构体绑定表单数据请求

Gin 可以遍历嵌套结构体、结构体指针和匿名结构体，将内部字段的 `form` 标签一起绑定：

```go
type Address struct {
	City   string `form:"city"`
	Street string `form:"street"`
}

type UserForm struct {
	Name    string `form:"name"`
	Address Address
}
```

请求：

```text
GET /users?name=Tom&city=Shanghai&street=NanjingRoad
```

嵌套结构体适合把复杂表单拆成可复用的子结构，而不是把所有字段放进一个扁平结构体。

#### 本次实操：订单嵌套 JSON 绑定

```go
type ShippingAddressRequest struct {
	City   string `json:"city" binding:"required,min=2,max=30"`
	Street string `json:"street" binding:"required,min=3,max=100"`
}

type CreateOrderRequest struct {
	Product         string                 `json:"product" binding:"required,min=2,max=50"`
	Quantity        int                    `json:"quantity" binding:"required,min=1,max=100"`
	ShippingAddress ShippingAddressRequest `json:"shipping_address" binding:"required"`
}

func PostOrder(c *gin.Context) {
	var req CreateOrderRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, req)
}
```

路由注册：

```go
router.POST("/orders", PostOrder)
```

测试：

```powershell
$body = @'
{"product":"Keyboard","quantity":2,"shipping_address":{"city":"Shanghai","street":"Nanjing Road"}}
'@

$body | curl.exe -i -X POST http://localhost:8080/orders `
  -H "Content-Type: application/json" `
  --data-binary "@-"
```

官方文档：[使用自定义结构体绑定表单数据请求](https://gin-gonic.com/zh-cn/docs/binding/bind-form-data-request-with-custom-struct/)

### 将请求体绑定到不同的结构体

请求体是 `io.ReadCloser`，普通绑定会消费请求体，因此通常不能连续两次调用 `ShouldBindJSON`：

```go
c.ShouldBindJSON(&a)
c.ShouldBindJSON(&b) // 第二次通常已经没有内容可读
```

确实需要尝试绑定到多个结构体时，可以使用 `ShouldBindBodyWithJSON`：

```go
type EmailNotificationRequest struct {
	Email   string `json:"email" binding:"required,email"`
	Subject string `json:"subject" binding:"required,min=2,max=100"`
}

type SMSNotificationRequest struct {
	Phone   string `json:"phone" binding:"required,numeric,len=11"`
	Message string `json:"message" binding:"required,min=1,max=200"`
}

func EmailNotificationOrSMSNotification(c *gin.Context) {
	var reqEmail EmailNotificationRequest

	// 第一次绑定时读取并缓存请求体；绑定和验证成功则按邮件处理。
	if err := c.ShouldBindBodyWithJSON(&reqEmail); err == nil {
		c.JSON(http.StatusCreated, gin.H{
			"type": "email",
			"data": reqEmail,
		})
		return
	}

	var reqSMS SMSNotificationRequest

	// 使用缓存的同一份请求体继续尝试短信结构。
	if err := c.ShouldBindBodyWithJSON(&reqSMS); err == nil {
		c.JSON(http.StatusCreated, gin.H{
			"type": "sms",
			"data": reqSMS,
		})
		return
	}

	// 两种结构都不符合接口要求。
	c.JSON(http.StatusBadRequest, gin.H{
		"error": "unsupported notification payload",
	})
}
```

路由注册：

```go
router.POST("/notifications", EmailNotificationOrSMSNotification)
```

它会缓存请求体供后续绑定使用，因此会增加内存开销。普通接口只绑定一次时，应继续使用 `ShouldBindJSON`。

官方文档：[将请求体绑定到不同的结构体](https://gin-gonic.com/zh-cn/docs/binding/bind-body-into-different-structs/)

### 使用自定义结构体标签绑定表单数据

::: warning 学习优先级：低（进阶且不常用）
Gin 默认使用 `form` 标签绑定查询参数和表单。只有在集成无法修改的第三方结构体，并且它使用了 `url`、`query` 等其他标签时，才需要实现自定义绑定器。普通业务结构体继续使用 `form` 标签即可。
:::

::: details 完整示例：使用 `url` 标签绑定查询参数

```go
const (
	customFormTag = "url"
	defaultMemory = 32 << 20
)

// LegacyProductQuery 模拟无法修改标签的第三方结构体。
type LegacyProductQuery struct {
	Keyword string `url:"keyword" json:"keyword" binding:"required,min=2,max=30"`
	Page    int    `url:"page" json:"page" binding:"required,gte=1"`
}

// URLTagBinding 实现 binding.Binding 接口。
type URLTagBinding struct{}

func (URLTagBinding) Name() string {
	return "url-tag-form"
}

func (URLTagBinding) Bind(req *http.Request, obj any) error {
	// 解析 URL 查询参数和 application/x-www-form-urlencoded 表单。
	if err := req.ParseForm(); err != nil {
		return err
	}

	// 同时兼容 multipart/form-data；普通 GET 请求会进入 ErrNotMultipart。
	if err := req.ParseMultipartForm(defaultMemory); err != nil {
		if err != http.ErrNotMultipart {
			return err
		}
	}

	// 使用 url 标签把表单值映射到结构体字段。
	if err := binding.MapFormWithTag(obj, req.Form, customFormTag); err != nil {
		return err
	}

	// 映射完成后继续执行 binding 标签中的验证规则。
	if binding.Validator == nil {
		return nil
	}
	return binding.Validator.ValidateStruct(obj)
}

func legacyProductsHandler(c *gin.Context) {
	var query LegacyProductQuery

	// 显式指定使用自定义绑定器。
	if err := c.ShouldBindWith(&query, URLTagBinding{}); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, query)
}
```

路由注册：

```go
router.GET("/legacy-products", legacyProductsHandler)
```

测试：

```powershell
curl.exe -i "http://localhost:8080/legacy-products?keyword=gin&page=2"
```

:::

官方文档：[使用自定义结构体标签绑定表单数据](https://gin-gonic.com/zh-cn/docs/binding/bind-form-data-custom-struct-tag/)

### 常见错误

::: warning

1. 忘记传递结构体指针：应写 `ShouldBindJSON(&req)`，而不是 `ShouldBindJSON(req)`。
2. 使用通用 `ShouldBind` 时没有设置正确的 `Content-Type`，导致 Gin 选择了错误的绑定器；`ShouldBindJSON` 本身会直接使用 JSON 绑定器。
3. JSON 字段使用了 `form` 标签，却没有设置 `json` 标签。
4. 调用绑定方法后没有检查 `error`。
5. 绑定失败后仍然继续执行业务逻辑，忘记 `return`。
6. 使用 `Bind` 后又尝试修改状态码，导致响应头已经写入。
7. 把数据库模型直接暴露给绑定器，让客户端能够提交内部字段。
8. 对请求体连续调用多次普通绑定方法，导致后续读取为空。

:::

### 学习优先级

::: tip

必须掌握：

1. 先掌握五个核心方法：`ShouldBindJSON`、`ShouldBindQuery`、`ShouldBindUri`、`ShouldBindHeader` 和 `ShouldBind`；它们不是完整的方法清单。
2. `json`、`form`、`uri`、`header` 与 `binding` 标签。
3. `required`、`omitempty`、范围、格式和跨字段验证。
4. 绑定失败时返回正确错误响应并立即 `return`。

:::

::: info

随后掌握：

- 默认值和数组格式。
- Multipart 文件绑定。
- 嵌套结构体。
- 自定义验证器。

:::

::: details

暂时了解：

- 自定义反序列化器。
- 将请求体绑定到多个结构体。
- 自定义结构体标签。

:::

### 本阶段练习

把现有的 `POST /users` 改为接收 JSON：

```go
type CreateUserRequest struct {
	Name  string `json:"name" binding:"required,min=2,max=50"`
	Age   int    `json:"age" binding:"required,gte=1,lte=150"`
	Email string `json:"email" binding:"required,email"`
}
```

要求：

1. 使用 `ShouldBindJSON`。
2. 绑定或验证失败返回 400。
3. 创建成功返回 201。
4. 成功响应包含绑定后的用户数据。
5. 分别测试缺少 `name`、邮箱格式错误、年龄越界和正确请求。

## 渲染

### XML/JSON/YAML/ProtoBuf 渲染

::: warning 学习优先级
`c.JSON` 是 REST API 开发中的常用核心方法，需要掌握。XML、YAML 和 ProtoBuf 只在客户端协议明确要求时使用，现阶段了解即可。
:::

Gin 可以把同一份 Go 数据序列化为不同的响应格式，并自动设置相应的 `Content-Type`：

| 方法         | 响应格式                    | 常见场景                           |
| ------------ | --------------------------- | ---------------------------------- |
| `c.JSON`     | JSON                        | REST API、浏览器和移动端客户端     |
| `c.XML`      | XML                         | 遗留系统或企业协议集成             |
| `c.YAML`     | YAML                        | 配置类接口和运维工具               |
| `c.ProtoBuf` | Protocol Buffers 二进制数据 | 需要共享 `.proto` 定义的服务间通信 |

所有渲染方法都接收 HTTP 状态码和待序列化的数据：

```go
c.JSON(http.StatusOK, data)
```

::: details 完整示例：根据路径选择响应格式

```go
type ProfileResponse struct {
	ID       int    `json:"id" xml:"id" yaml:"id"`
	Name     string `json:"name" xml:"name" yaml:"name"`
	Language string `json:"language" xml:"language" yaml:"language"`
}

func renderProfileHandler(c *gin.Context) {
	profile := ProfileResponse{
		ID:       1,
		Name:     "Tom",
		Language: "Go",
	}

	switch c.Param("format") {
	case "json":
		c.JSON(http.StatusOK, profile)
	case "xml":
		c.XML(http.StatusOK, profile)
	case "yaml":
		c.YAML(http.StatusOK, profile)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported format"})
	}
}
```

路由注册：

```go
router.GET("/profiles/:format", renderProfileHandler)
```

:::

官方文档：[XML/JSON/YAML/ProtoBuf 渲染](https://gin-gonic.com/zh-cn/docs/rendering/rendering/)

### SecureJSON

::: warning 学习优先级：低（兼容旧版浏览器）
`SecureJSON` 主要防御旧版浏览器中的 JSON 劫持。现代浏览器已经修复这类问题，大多数新 API 使用 `c.JSON()` 即可。
:::

当响应是顶层 JSON 数组时，`c.SecureJSON()` 会在响应体前添加默认前缀 `while(1);`：

```text
while(1);["Tom","Alice","Bob"]
```

也可以在注册路由前自定义前缀：

```go
router.SecureJsonPrefix(")]}'\n")
```

::: details 完整示例

```go
func secureUsersHandler(c *gin.Context) {
	users := []string{"Tom", "Alice", "Bob"}

	// 顶层数组会被添加安全前缀。
	c.SecureJSON(http.StatusOK, users)
}
```

路由注册：

```go
router.GET("/secure-users", secureUsersHandler)
```

测试：

```powershell
curl.exe -i http://localhost:8080/secure-users
```

:::

官方文档：[SecureJSON](https://gin-gonic.com/zh-cn/docs/rendering/secure-json/)

### JSONP

::: warning 遗留技术：现代项目使用 CORS
JSONP 是旧版浏览器绕过同源限制的方案，只能用于通过 `<script>` 加载的 GET 请求。现代项目应使用更安全、支持所有 HTTP 方法的 CORS；JSONP 只应用于公开、只读、非敏感数据。
:::

`c.JSONP()` 会读取 `callback` 查询参数，并把 JSON 包装为 JavaScript 函数调用。没有 `callback` 时返回普通 JSON。

::: details 完整示例

```go
func jsonpUserHandler(c *gin.Context) {
	user := gin.H{
		"id":   1,
		"name": "Tom",
	}

	// Gin 自动读取并清理 callback 查询参数。
	c.JSONP(http.StatusOK, user)
}
```

路由注册：

```go
router.GET("/jsonp-user", jsonpUserHandler)
```

请求：

```text
GET /jsonp-user?callback=showUser
```

响应：

```javascript
showUser({ id: 1, name: "Tom" });
```

:::

官方文档：[JSONP](https://gin-gonic.com/zh-cn/docs/rendering/jsonp/)

### AsciiJSON

::: warning 学习优先级：低（遗留系统兼容）
`AsciiJSON` 把中文等非 ASCII 字符转换为 `\uXXXX`，并转义 `<`、`>`、`&` 等字符。现代 API 普遍支持 UTF-8，通常继续使用 `c.JSON()`；只有客户端或传输环境明确要求纯 ASCII 时才使用。
:::

::: details 完整示例

```go
func asciiJSONHandler(c *gin.Context) {
	data := gin.H{
		"language": "Go语言",
		"tag":      "<br>",
	}

	c.AsciiJSON(http.StatusOK, data)
}
```

路由注册：

```go
router.GET("/ascii-json", asciiJSONHandler)
```

响应：

```json
{ "language": "Go\u8bed\u8a00", "tag": "\u003cbr\u003e" }
```

:::

官方文档：[AsciiJSON](https://gin-gonic.com/zh-cn/docs/rendering/ascii-json/)

### PureJSON

::: info 学习优先级：了解
标准 `c.JSON()` 会把 `<`、`>`、`&` 等 HTML 特殊字符转义为 Unicode 序列；`c.PureJSON()` 会保留原始字符。普通 API 优先使用 `c.JSON()`，只有客户端明确要求响应文本保留这些字符时才使用 `PureJSON`。
:::

两种响应在客户端完成 JSON 解析后得到的字符串相同，区别只在原始响应文本。

::: details 完整示例：比较 JSON 与 PureJSON

```go
func jsonMessageHandler(c *gin.Context) {
	data := gin.H{"content": "<b>Gin & Go</b>"}

	// HTML 特殊字符会被转义。
	c.JSON(http.StatusOK, data)
}

func pureJSONMessageHandler(c *gin.Context) {
	data := gin.H{"content": "<b>Gin & Go</b>"}

	// HTML 特殊字符按原样输出。
	c.PureJSON(http.StatusOK, data)
}
```

路由注册：

```go
router.GET("/json-message", jsonMessageHandler)
router.GET("/pure-json-message", pureJSONMessageHandler)
```

:::

官方文档：[PureJSON](https://gin-gonic.com/zh-cn/docs/rendering/pure-json/)

### 提供静态文件

::: info 学习优先级：低（前后端分离项目）
前后端分离项目通常由 Nginx、CDN 或对象存储提供前端静态资源，Gin 主要负责 JSON API。只有小型一体化部署、Swagger 资源或少量公开文件需要使用这些方法。
:::

| 方法                  | 作用                                  |
| --------------------- | ------------------------------------- |
| `router.Static()`     | 把整个本地目录映射到一个 URL 前缀     |
| `router.StaticFile()` | 把单个本地文件映射到固定 URL          |
| `router.StaticFS()`   | 使用自定义 `http.FileSystem` 提供文件 |

::: warning 安全要求
只能公开专门存放公共资源的目录。不要把 `"."`、项目根目录或系统根目录作为静态目录，否则可能泄露源码、配置、`.env` 和私钥。
:::

::: details 完整示例

目录结构：

```text
public/
└── info.txt
```

路由注册：

```go
// 将 public 目录映射到 /assets。
router.Static("/assets", "./public")

// 将一个文件映射到固定地址。
router.StaticFile("/site-info", "./public/info.txt")

// 需要自定义文件系统时使用 StaticFS。
router.StaticFS("/files", http.Dir("./public"))
```

请求：

```text
GET /assets/info.txt
GET /site-info
```

:::

官方文档：[提供静态文件](https://gin-gonic.com/zh-cn/docs/rendering/serving-static-files/)

### 从文件提供数据

在 REST API 中，可以在完成业务判断和权限检查后，通过 Handler 返回本地文件：

| 方法                 | 作用                                          |
| -------------------- | --------------------------------------------- |
| `c.File()`           | 返回文件，浏览器可能直接显示                  |
| `c.FileAttachment()` | 以附件形式返回，并指定客户端下载文件名        |
| `c.FileFromFS()`     | 从受限制或自定义的 `http.FileSystem` 返回文件 |

::: warning 文件路径安全
路径参数只能作为业务标识，不能直接拼接为服务器文件路径。应通过固定 Map、数据库记录或其他可信映射，取得已经验证过的文件路径。
:::

::: details 完整示例：安全下载报表

```go
func DownLoadFile(c *gin.Context) {
	// 路由是 /reports/:name，因此使用 Param 读取路径参数。
	name := c.Param("name")

	// URL 中的业务名称只用于选择预先确定的安全路径。
	switch name {
	case "weekly":
		c.FileAttachment(
			"./downloads/weekly-report.txt",
			"gin-weekly-report.txt",
		)
		return
	default:
		c.JSON(http.StatusNotFound, gin.H{
			"error": "report not found",
		})
	}
}
```

路由注册：

```go
router.GET("/reports/:name", DownLoadFile)
```

:::

官方文档：[从文件提供数据](https://gin-gonic.com/zh-cn/docs/rendering/serving-data-from-file/)

### 从 Reader 提供数据

当数据来自内存、远程存储或其他实现了 `io.Reader` 的数据源时，可以使用 `c.DataFromReader()` 将内容写入响应，而不必先保存为本地文件。

```go
c.DataFromReader(statusCode, contentLength, contentType, reader, extraHeaders)
```

| 参数            | 作用                       |
| --------------- | -------------------------- |
| `statusCode`    | HTTP 响应状态码            |
| `contentLength` | 响应正文的字节数           |
| `contentType`   | 响应内容类型               |
| `reader`        | 提供响应数据的 `io.Reader` |
| `extraHeaders`  | 需要额外写入的响应头       |

::: details 完整示例：生成并下载 CSV 文件

```go
func getReader(c *gin.Context) {
	// CSV 数据保存在内存中。
	csvData := "id,name\n1,Tom\n2,Alice"

	// strings.Reader 实现了 io.Reader 接口。
	reader := strings.NewReader(csvData)

	// attachment 表示下载文件，filename 指定客户端看到的文件名。
	headers := map[string]string{
		"Content-Disposition": `attachment; filename="users.csv"`,
	}

	c.DataFromReader(
		http.StatusOK,
		int64(len(csvData)),
		"text/csv; charset=utf-8",
		reader,
		headers,
	)
}
```

路由注册：

```go
router.GET("/exports/users", getReader)
```

:::

官方文档：[从 Reader 提供数据](https://gin-gonic.com/zh-cn/docs/rendering/serving-data-from-reader/)

### HTML 渲染

::: info 学习优先级：低（前后端分离项目）
HTML 渲染主要用于由后端直接生成页面的服务端渲染项目。RESTful 前后端分离项目通常由前端负责页面渲染，Gin 主要返回 JSON，因此了解基本用法即可。
:::

Gin 使用 Go 标准库的 `html/template` 渲染 HTML，核心步骤是：启动时加载模板，然后在 Handler 中使用 `c.HTML()` 返回页面。

::: details 简单示例

模板文件 `templates/hello.tmpl`：

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>{{ .title }}</title>
  </head>
  <body>
    <h1>你好，{{ .name }}</h1>
  </body>
</html>
```

Gin 代码：

```go
// 模板在程序启动时加载一次。
router.LoadHTMLGlob("templates/*")

router.GET("/hello/:name", func(c *gin.Context) {
	c.HTML(http.StatusOK, "hello.tmpl", gin.H{
		"title": "Gin HTML",
		"name":  c.Param("name"),
	})
})
```

<span v-pre><code>{{ .title }}</code></span> 和 <span v-pre><code>{{ .name }}</code></span> 会被替换为传入的数据；动态内容会由 `html/template` 进行 HTML 转义。

:::

官方文档：[HTML 渲染](https://gin-gonic.com/zh-cn/docs/rendering/html-rendering/)

### 多模板

::: info 学习优先级：低（服务端 HTML 项目）
多模板用于让不同页面分别组合自己的布局和内容模板。RESTful 前后端分离项目通常不由 Gin 渲染页面，了解用途和基本结构即可，暂不实操。
:::

Gin 默认使用一个 `html.Template`。需要维护多套独立模板时，可以使用 `github.com/gin-contrib/multitemplate` 提供的渲染器：

::: details 简单示例

```go
func createHTMLRender() multitemplate.Renderer {
	renderer := multitemplate.NewRenderer()

	// 每个名称对应一套独立的模板文件组合。
	renderer.AddFromFiles(
		"index",
		"templates/base.html",
		"templates/index.html",
	)
	renderer.AddFromFiles(
		"article",
		"templates/base.html",
		"templates/article.html",
	)

	return renderer
}

router.HTMLRender = createHTMLRender()

router.GET("/", func(c *gin.Context) {
	c.HTML(http.StatusOK, "index", gin.H{"title": "首页"})
})

router.GET("/article", func(c *gin.Context) {
	c.HTML(http.StatusOK, "article", gin.H{"title": "文章"})
})
```

`c.HTML()` 的第二个参数不再是单个文件名，而是 `AddFromFiles()` 注册的模板名称。

:::

官方文档：[多模板](https://gin-gonic.com/zh-cn/docs/rendering/multiple-template/)

### 将模板构建到单一二进制文件中

::: info 学习优先级：低（服务端 HTML 部署）
该功能只在程序需要携带 HTML 模板一起发布时使用。前后端分离 API 通常不需要；如果以后需要，优先使用 Go 标准库的 `//go:embed`，无需旧式第三方资源打包工具。
:::

`//go:embed` 可以把模板文件编译进 Go 可执行文件，部署时不必再单独复制 `templates` 目录。

::: details 简单示例

```go
//go:embed templates/*
var templateFS embed.FS

func main() {
	router := gin.Default()

	// 从嵌入的文件系统解析模板并交给 Gin。
	tmpl := template.Must(
		template.ParseFS(templateFS, "templates/*.tmpl"),
	)
	router.SetHTMLTemplate(tmpl)

	router.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "index.tmpl", nil)
	})

	router.Run(":8080")
}
```

需要导入：

```go
import (
	"embed"
	"html/template"
	"net/http"

	"github.com/gin-gonic/gin"
)
```

:::

官方文档：[将模板构建到单一二进制文件中](https://gin-gonic.com/zh-cn/docs/rendering/bind-single-binary-with-template/)

## 中间件

### 默认不使用中间件

Gin 提供两种创建路由引擎的方式：

| 创建方式        | 默认包含的中间件                   | 适用场景                              |
| --------------- | ---------------------------------- | ------------------------------------- |
| `gin.Default()` | `gin.Logger()` 和 `gin.Recovery()` | 快速开发、使用 Gin 默认日志和恢复机制 |
| `gin.New()`     | 无                                 | 需要自行控制日志、异常恢复等中间件    |

`gin.New()` 创建的是空白引擎，可以通过 `router.Use()` 只添加项目需要的中间件。

::: details 完整示例：只启用 Recovery

```go
func main() {
	router := gin.New()

	// 捕获 Handler 中的 panic，返回 500，防止整个服务退出。
	router.Use(gin.Recovery())

	router.GET("/middleware/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "pong",
		})
	})

	// 该路由只用于学习时验证 Recovery，生产项目中不要保留。
	router.GET("/middleware/panic", func(c *gin.Context) {
		panic("recovery test")
	})

	router.Run(":8080")
}
```

请求 `/middleware/panic` 时，`gin.Recovery()` 会返回 `500`；服务不会退出，后续请求仍然可以正常处理。由于没有注册 `gin.Logger()`，普通请求不会输出 Gin 的访问日志。

:::

官方文档：[默认不使用中间件](https://gin-gonic.com/zh-cn/docs/middleware/without-middleware/)

### 使用中间件

Gin 中间件的类型是 `gin.HandlerFunc`。它可以在请求到达 Handler 前后执行通用逻辑，例如设置响应头、记录日志、认证和异常恢复。

| 注册范围 | 写法                                    | 生效范围                 |
| -------- | --------------------------------------- | ------------------------ |
| 全局     | `router.Use(middleware)`                | 当前路由引擎中的所有路由 |
| 路由组   | `group.Use(middleware)`                 | 该路由组中的所有路由     |
| 单个路由 | `router.GET(path, middleware, handler)` | 只对这一条路由生效       |

::: details 完整示例：为 API v1 路由组添加响应头

```go
func addAPIVersionHeader() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 为该路由组的响应添加版本信息。
		c.Header("X-API-Version", "v1")

		// 执行后面的中间件和最终 Handler。
		c.Next()
	}
}

func main() {
	router := gin.New()
	router.Use(gin.Recovery())

	api := router.Group("/api/v1")
	api.Use(addAPIVersionHeader())

	api.GET("/status", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
		})
	})

	router.Run(":8080")
}
```

访问 `/api/v1/status` 时会得到 `X-API-Version: v1`；注册在路由组外的接口不会包含这个响应头。

:::

官方文档：[使用中间件](https://gin-gonic.com/zh-cn/docs/middleware/using-middleware/)

### 自定义中间件

自定义中间件通常是一个返回 `gin.HandlerFunc` 的函数。`c.Next()` 将它分为请求处理前和请求处理后两个阶段：

```text
c.Next() 前的代码 → 后续中间件和 Handler → c.Next() 后的代码
```

| 方法                      | 作用                                      |
| ------------------------- | ----------------------------------------- |
| `c.Set(key, value)`       | 在当前请求的 Context 中保存数据           |
| `c.Get(key)`              | 安全读取数据，返回值和是否存在            |
| `c.MustGet(key)`          | 读取数据，不存在时触发 panic              |
| `c.Next()`                | 执行后续中间件和最终 Handler              |
| `c.AbortWithStatusJSON()` | 返回 JSON 并阻止后续 Handler 继续处理请求 |

::: details 完整示例：传递请求数据并记录响应耗时

```go
func requestTrace() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Handler 执行前记录开始时间。
		start := time.Now()

		// 数据只保存在当前请求的 Context 中。
		c.Set("source", "custom-middleware")

		// 执行后面的 Handler。
		c.Next()

		// Handler 执行结束后读取最终状态并计算耗时。
		log.Printf(
			"status=%d latency=%s",
			c.Writer.Status(),
			time.Since(start),
		)
	}
}

func getMiddlewareInfo(c *gin.Context) {
	source, exists := c.Get("source")
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "source not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"source": source,
	})
}
```

只为一条路由注册该中间件：

```go
router.GET(
	"/middleware/info",
	requestTrace(),
	getMiddlewareInfo,
)
```

访问 `/middleware/info` 会返回：

```json
{
  "source": "custom-middleware"
}
```

:::

官方文档：[自定义中间件](https://gin-gonic.com/en/docs/middleware/custom-middleware/)

### 自定义 Recovery

`gin.Recovery()` 可以捕获 Handler 中的 `panic` 并返回 `500`，但默认响应没有统一的 JSON 正文。RESTful API 可以使用 `gin.CustomRecovery()` 自定义日志和错误响应。

::: warning 不要泄露内部错误
服务端可以记录 `recovered` 的详细内容，但返回给客户端时应使用统一提示，避免暴露堆栈、数据库信息或其他内部实现细节。
:::

::: details 完整示例：返回统一的 500 JSON

```go
func jsonRecovery(c *gin.Context, recovered any) {
	// recovered 是传给 panic() 的值，只记录在服务端。
	log.Printf("panic recovered: %v", recovered)

	// 中断当前请求并返回统一的 JSON。
	c.AbortWithStatusJSON(
		http.StatusInternalServerError,
		gin.H{
			"error": "internal server error",
		},
	)
}

func main() {
	router := gin.New()

	// 使用自定义 Recovery，不再同时注册 gin.Recovery()。
	router.Use(gin.CustomRecovery(jsonRecovery))

	// 该路由只用于学习时验证 Recovery。
	router.GET("/middleware/panic", func(c *gin.Context) {
		panic("recovery test")
	})

	router.GET("/middleware/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "pong"})
	})

	router.Run(":8080")
}
```

访问 `/middleware/panic` 会得到：

```json
{
  "error": "internal server error"
}
```

响应状态是 `500`，但服务不会退出，后续请求仍然能够正常处理。

:::

官方文档：[自定义 Recovery](https://gin-gonic.com/en/docs/middleware/custom-recovery/)

### 错误处理中间件

错误处理中间件用于统一处理 Handler 主动提交的可预期错误。Handler 使用 `c.Error(err)` 将错误加入当前请求的 `c.Errors`，中间件在 `c.Next()` 返回后统一记录日志并生成 JSON 响应。

| 错误类型                         | 处理方式                        |
| -------------------------------- | ------------------------------- |
| 意外发生的 `panic`               | `gin.CustomRecovery()`          |
| Handler 主动返回的业务或服务错误 | `c.Error(err)` 和错误处理中间件 |

::: warning 避免重复响应和泄露内部错误
如果 Handler 已经写入响应，中间件不能再次写入，因此需要检查 `c.Writer.Written()`。内部错误写入服务端日志即可，对客户端返回统一提示。
:::

::: details 完整示例：集中处理 Handler 错误

```go
func apiErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 先执行后续中间件和 Handler。
		c.Next()

		if len(c.Errors) == 0 {
			return
		}

		// 读取并记录当前请求最后一个错误。
		err := c.Errors.Last().Err
		log.Printf("request error: %v", err)

		// Handler 已经写过响应时不再重复写入。
		if c.Writer.Written() {
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "internal server error",
		})
	}
}

func getMiddlewareError(c *gin.Context) {
	// 只提交错误，由全局错误处理中间件生成响应。
	c.Error(errors.New("user service unavailable"))
}
```

在所有路由注册之前添加中间件：

```go
router.Use(gin.CustomRecovery(jsonRecovery))
router.Use(apiErrorHandler())

router.GET("/middleware/error", getMiddlewareError)
```

访问 `/middleware/error` 会返回状态码 `500` 和统一 JSON，详细错误只出现在服务端日志中。

:::

::: details 实际例子：创建用户时邮箱已经存在

这个例子分为三个职责：

```text
Service 返回业务错误
    ↓
Handler 使用 c.Error(err) 提交错误
    ↓
错误处理中间件将错误转换成 HTTP 状态码和 JSON
```

首先定义一个可以被 `errors.Is()` 判断的业务错误：

```go
var ErrEmailAlreadyExists = errors.New("email already exists")
```

Service 只处理创建用户的业务逻辑，不依赖 Gin，也不决定 HTTP 状态码：

```go
func createUserService(email string) error {
	// 模拟查询数据库后发现邮箱已经存在。
	if email == "tom@example.com" {
		return ErrEmailAlreadyExists
	}

	// nil 表示创建成功。
	return nil
}
```

定义请求结构体和 Handler：

```go
type CreateAccountRequest struct {
	Email string `json:"email" binding:"required,email"`
}

func createAccount(c *gin.Context) {
	var req CreateAccountRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    "INVALID_REQUEST",
			"message": "请求参数不正确",
		})
		return
	}

	if err := createUserService(req.Email); err != nil {
		// Handler 不在这里决定状态码和响应格式，
		// 只把 Service 返回的错误加入当前请求的 c.Errors。
		c.Error(err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "用户创建成功",
	})
}
```

错误处理中间件在 Handler 返回后统一转换错误：

```go
func businessErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 执行后续中间件和 Handler，并等待它们执行结束。
		c.Next()

		// 没有错误时保留 Handler 原来的正常响应。
		if len(c.Errors) == 0 {
			return
		}

		// Handler 已经写过响应时不能重复写入。
		if c.Writer.Written() {
			return
		}

		err := c.Errors.Last().Err

		switch {
		case errors.Is(err, ErrEmailAlreadyExists):
			// 将 Go 业务错误翻译成适合 HTTP API 的 409 响应。
			c.JSON(http.StatusConflict, gin.H{
				"code":    "EMAIL_ALREADY_EXISTS",
				"message": "该邮箱已经注册",
			})

		default:
			// 未识别的内部错误只记录在服务端，不向客户端泄露细节。
			log.Printf("internal error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "服务器内部错误",
			})
		}
	}
}
```

在注册路由之前添加全局错误处理中间件：

```go
router.Use(businessErrorHandler())
router.POST("/accounts", createAccount)
```

发送请求：

```http
POST /accounts
Content-Type: application/json

{
  "email": "tom@example.com"
}
```

这次请求的实际执行顺序是：

```text
请求进入 businessErrorHandler
    ↓
中间件执行 c.Next()
    ↓
createAccount 调用 createUserService
    ↓
Service 返回 ErrEmailAlreadyExists
    ↓
Handler 调用 c.Error(err) 并 return
    ↓
c.Next() 执行结束，中间件继续向下执行
    ↓
中间件使用 errors.Is() 识别业务错误
    ↓
客户端收到 409 Conflict 和统一 JSON
```

最终响应：

```json
{
  "code": "EMAIL_ALREADY_EXISTS",
  "message": "该邮箱已经注册"
}
```

Service 返回错误只代表业务操作已经失败；错误处理中间件生成响应后，这次 HTTP 请求才真正处理完毕。

:::

官方文档：[错误处理中间件](https://gin-gonic.com/en/docs/middleware/error-handling-middleware/)

### 使用 BasicAuth 中间件

::: info 学习优先级：低（现代前后端分离项目）
BasicAuth 适合内部工具、临时管理接口或监控端点。面向用户的前后端分离系统通常使用 Session、JWT 或 OAuth，因此这里了解 Gin 的内置用法即可，不安排实操。
:::

`gin.BasicAuth()` 接收一个 `gin.Accounts` 用户名密码表，并保护应用它的路由组。认证成功后，可以通过 `gin.AuthUserKey` 读取用户名。

::: details 简单示例

```go
accounts := gin.Accounts{
	// 仅用于学习演示，生产项目不能硬编码明文密码。
	"admin": "demo-password",
}

admin := router.Group("/admin", gin.BasicAuth(accounts))

admin.GET("/profile", func(c *gin.Context) {
	username := c.MustGet(gin.AuthUserKey).(string)

	c.JSON(http.StatusOK, gin.H{
		"username": username,
	})
})
```

测试请求：

```bash
curl -u admin:demo-password http://localhost:8080/admin/profile
```

BasicAuth 只对凭据进行 Base64 编码，并不提供加密；生产环境必须配合 HTTPS，凭据应来自环境变量、密钥管理服务或安全的用户系统。

:::

官方文档：[使用 BasicAuth 中间件](https://gin-gonic.com/zh-cn/docs/middleware/using-basicauth-middleware/)

### 中间件中的 Goroutine

::: info 学习优先级：低频，但必须记住安全规则
只有在中间件或 Handler 中启动后台 Goroutine 时才会用到这一节。Gin 会复用原始 `gin.Context`，因此 Goroutine 不能直接持有并使用原始 `c`，必须使用 `c.Copy()` 创建只读副本。
:::

::: details 简单示例

```go
func asyncAudit() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 在当前请求结束前创建 Context 的只读副本。
		contextCopy := c.Copy()

		go func() {
			log.Printf(
				"async audit: method=%s path=%s",
				contextCopy.Request.Method,
				contextCopy.Request.URL.Path,
			)
		}()

		c.Next()
	}
}
```

`c.Copy()` 的副本只适合读取请求数据，不能在 Goroutine 中用它写 HTTP 响应。需要可靠执行、失败重试或持久化的后台任务，应使用消息队列或任务系统，而不是只启动一个 Goroutine。

:::

官方文档：[中间件中的 Goroutine](https://gin-gonic.com/zh-cn/docs/middleware/goroutines-inside-a-middleware/)

### 安全响应头

安全响应头可以统一限制浏览器解释和使用响应内容的方式。对于可能被浏览器访问的 REST API，应通过全局中间件为正常响应和错误响应都添加这些头。

| 响应头                    | 示例值                                       | 主要作用                       |
| ------------------------- | -------------------------------------------- | ------------------------------ |
| `X-Content-Type-Options`  | `nosniff`                                    | 禁止浏览器猜测内容类型         |
| `X-Frame-Options`         | `DENY`                                       | 禁止页面被嵌入 iframe          |
| `Referrer-Policy`         | `no-referrer`                                | 不向其他站点发送来源 URL       |
| `Content-Security-Policy` | `default-src 'none'; frame-ancestors 'none'` | 默认禁止加载外部资源并禁止嵌入 |
| `Permissions-Policy`      | `camera=(), microphone=(), geolocation=()`   | 禁用不需要的浏览器设备能力     |

::: details 完整示例：全局添加安全响应头

```go
func securityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 在 Handler 写入响应前设置响应头。
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("Referrer-Policy", "no-referrer")
		c.Header(
			"Content-Security-Policy",
			"default-src 'none'; frame-ancestors 'none'",
		)
		c.Header(
			"Permissions-Policy",
			"camera=(), microphone=(), geolocation=()",
		)

		c.Next()
	}
}
```

在所有路由注册之前全局添加：

```go
router.Use(securityHeaders())
```

:::

::: warning HTTPS 与旧响应头
`Strict-Transport-Security` 只应在生产域名已经完整启用 HTTPS 后设置，本地 HTTP 开发环境不要添加。`X-XSS-Protection` 已被现代浏览器废弃，不再作为新项目的必要响应头。
:::

官方文档：[安全响应头](https://gin-gonic.com/zh-cn/docs/middleware/security-headers/)

### CORS 跨域配置

浏览器的同源策略会限制网页访问不同协议、域名或端口的 API。前后端分离项目需要由后端通过 CORS 响应头明确允许可信前端来源。

::: warning CORS 不是身份认证
CORS 只约束浏览器中的跨域访问，不能阻止 curl、Postman 或其他服务器直接请求 API。接口仍然需要正常的认证、授权和输入验证。
:::

推荐使用 `gin-contrib/cors`：

```bash
go get github.com/gin-contrib/cors
```

::: details 完整示例：允许本地 Vite 前端访问 API

```go
router.Use(cors.New(cors.Config{
	// Origin 必须完整匹配协议、主机和端口。
	AllowOrigins: []string{
		"http://localhost:5173",
	},
	AllowMethods: []string{
		http.MethodGet,
		http.MethodPost,
		http.MethodPut,
		http.MethodPatch,
		http.MethodDelete,
		http.MethodOptions,
	},
	AllowHeaders: []string{
		"Origin",
		"Content-Type",
		"Authorization",
	},
	// 允许浏览器中的 JavaScript 读取该响应头。
	ExposeHeaders: []string{
		"X-API-Version",
	},
	// 浏览器可以缓存预检结果 12 小时。
	MaxAge: 12 * time.Hour,
}))
```

允许来源的 `OPTIONS` 预检请求会得到 `Access-Control-Allow-Origin`、允许方法和允许请求头；未配置的来源不会得到跨域许可。

:::

::: warning 来源与凭据
生产环境应使用明确的前端域名。不要为了省事使用任意来源；如果以后启用 Cookie 等凭据访问，更不能组合任意来源和 `AllowCredentials: true`。
:::

官方文档：[安全最佳实践：CORS](https://gin-gonic.com/zh-cn/docs/middleware/security-guide/)

### CSRF 防护

::: info 学习优先级：取决于认证方式
如果 API 使用 Cookie 或 Session 认证，浏览器会自动携带凭据，修改数据的请求需要 CSRF 防护。如果客户端只通过 JavaScript 主动添加 `Authorization: Bearer ...`，浏览器不会自动添加该请求头，通常不受传统 CSRF 攻击影响。
:::

Cookie 认证项目通常结合以下措施：

- CSRF Token；
- Cookie 的 `SameSite`、`Secure` 和 `HttpOnly` 属性；
- 校验 `Origin` 或 `Referer`；
- 对 `POST`、`PUT`、`PATCH`、`DELETE` 等修改操作进行保护。

当前尚未学习 Session 管理，因此暂不安排 CSRF 实操；学习 Session 后再结合具体认证方式配置。

官方文档：[安全最佳实践：CSRF](https://gin-gonic.com/zh-cn/docs/middleware/security-guide/)

### 接口限流

限流通过控制单位时间内允许的请求数量，减少接口滥用、暴力尝试和资源耗尽。`golang.org/x/time/rate` 提供了基于令牌桶算法的限流器。

```bash
go get golang.org/x/time/rate
```

::: details 完整示例：限制单个接口的请求速率

```go
func rateLimit() gin.HandlerFunc {
	// 每秒补充一个令牌，桶中最多保存两个令牌。
	limiter := rate.NewLimiter(rate.Every(time.Second), 2)

	return func(c *gin.Context) {
		if !limiter.Allow() {
			c.AbortWithStatusJSON(
				http.StatusTooManyRequests,
				gin.H{
					"code":    "RATE_LIMITED",
					"message": "请求过于频繁",
				},
			)
			return
		}

		c.Next()
	}
}
```

只限制一条路由：

```go
router.GET("/limited/ping", rateLimit(), func(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "pong",
	})
})
```

令牌用完后返回 `429 Too Many Requests`；令牌按配置的速度补充后，请求可以继续通过。

:::

::: warning 示例与生产环境的区别
这个简单示例由所有客户端共享一个内存限流器。生产项目通常按用户、API Key 或可信客户端 IP 分别限流；还需要清理过期记录。多实例部署应使用 Redis 等共享存储实现分布式限流。
:::

#### 理解令牌桶参数

```go
rate.NewLimiter(rate.Every(12*time.Second), 5)
```

这段配置表示：

- 桶中最多保存 `5` 个令牌，因此短时间内最多可以连续通过 5 个请求；
- 每 `12` 秒补充一个令牌，长期平均约为每分钟 5 个请求；
- 每次 `Allow()` 消耗一个令牌，没有令牌时立即返回 `false`；
- HTTP API 通常使用 `Allow()` 拒绝超限请求，而不是使用 `Wait()` 阻塞请求连接。

::: details 实战示例：按客户端 IP 限制创建账号接口

```go
func accountRateLimit() gin.HandlerFunc {
	var mu sync.Mutex
	clients := make(map[string]*rate.Limiter)

	return func(c *gin.Context) {
		ip := c.ClientIP()

		// Map 需要互斥锁保护；rate.Limiter 本身可以并发使用。
		mu.Lock()
		limiter, exists := clients[ip]
		if !exists {
			// 平均每分钟 5 次，最多允许 5 次突发请求。
			limiter = rate.NewLimiter(
				rate.Every(12*time.Second),
				5,
			)
			clients[ip] = limiter
		}
		mu.Unlock()

		if !limiter.Allow() {
			// Retry-After 的单位是秒。
			c.Header("Retry-After", "12")
			c.AbortWithStatusJSON(
				http.StatusTooManyRequests,
				gin.H{
					"code":    "RATE_LIMITED",
					"message": "请求过于频繁，请稍后重试",
				},
			)
			return
		}

		c.Next()
	}
}
```

只对需要保护的接口注册：

```go
router.POST(
	"/accounts",
	accountRateLimit(),
	createAccount,
)
```

需要导入：

```go
import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)
```

:::

#### 实战中如何选择限流维度

| 接口类型         | 常用限流键        | 示例策略                       |
| ---------------- | ----------------- | ------------------------------ |
| 未登录接口       | 客户端 IP         | 每 IP 每分钟限制一定次数       |
| 已登录接口       | 用户 ID           | 防止共享公网 IP 误伤多个用户   |
| 开放平台接口     | API Key           | 根据调用方或套餐设置额度       |
| 多租户系统       | 租户 ID           | 防止单个租户占满系统容量       |
| 登录接口         | IP 和账号         | 同时阻止单 IP 扫描和分布式撞库 |
| 短信验证码       | IP、用户和手机号  | 同时限制分钟、小时和每日次数   |
| 导出等高成本接口 | 用户 ID 或租户 ID | 使用比普通查询更严格的限制     |

限流数值不能直接照搬示例，应根据接口成本、正常用户行为、监控数据和业务风险逐步调整。健康检查与 CORS `OPTIONS` 预检请求通常不应计入普通业务接口额度。

#### 可信客户端 IP

基于 `c.ClientIP()` 限流前必须正确配置可信代理，否则攻击者可能伪造 `X-Forwarded-For` 绕过限制。

不使用反向代理时：

```go
router.SetTrustedProxies(nil)
```

使用 Nginx、负载均衡器或网关时，只信任真实代理的 IP 或网段：

```go
if err := router.SetTrustedProxies([]string{
	"10.0.0.10",
}); err != nil {
	log.Fatal(err)
}
```

#### 多实例生产部署

内存 Map 只适用于学习、单实例服务或小型内部项目：

- 必须根据最后访问时间定期删除长期不活跃的客户端，避免 Map 持续增长；
- 多个 Gin 实例各自计数，会使实际额度随实例数量增加；
- 进程重启后，内存中的限流状态会全部丢失。

多实例生产环境通常分层限流：

```text
客户端
  ↓
CDN / WAF / API Gateway：全局防护和抗攻击限流
  ↓
Nginx / Envoy：服务入口限流
  ↓
Gin + Redis：按用户、API Key、租户和具体业务接口限流
```

Redis 限流必须使用原子命令、事务或 Lua 脚本，避免多个并发请求同时读写计数造成超额放行。对于 Redis 故障时是放行还是拒绝，也应根据接口风险明确设计：普通查询通常倾向于保证可用性，登录、验证码等高风险接口则需要更谨慎。

官方文档：[安全最佳实践：限流](https://gin-gonic.com/zh-cn/docs/middleware/security-guide/)

### 输入验证、SQL 注入与 XSS

::: info 当前学习安排
结构体绑定和输入验证已经学习并实操。SQL 注入需要结合数据库驱动学习，XSS 的后端基础防护已包含在 `c.JSON()`、正确的 `Content-Type` 和安全响应头中，因此这里先总结，不重复安排任务。
:::

数据库查询必须使用参数化语句，不能把用户输入拼接到 SQL 中：

```go
// 占位符的具体写法取决于数据库驱动。
row := db.QueryRowContext(
	ctx,
	"SELECT id, email FROM users WHERE email = ?",
	email,
)
```

REST API 返回结构化数据时应使用 `c.JSON()`，不要把用户输入直接拼接成 HTML。前端展示用户数据时也必须使用框架默认转义能力，避免通过 `innerHTML` 等方式执行不可信内容。

官方文档：[安全最佳实践：输入验证、SQL 注入与 XSS](https://gin-gonic.com/zh-cn/docs/middleware/security-guide/)

### 可信代理

当 Gin 部署在 Nginx、API Gateway、负载均衡器等反向代理后面时，`c.ClientIP()` 可以从代理转发的请求头中获取客户端 IP。只有明确受信任的代理才能提供这些请求头。

如果应用直接对外提供服务、前面没有反向代理，可以禁用代理信任：

```go
package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery())

	// nil 表示不信任任何代理。
	// 此时 ClientIP() 使用与服务端直接建立连接的客户端地址，
	// 不会采用客户端自行填写的 X-Forwarded-For 等请求头。
	if err := router.SetTrustedProxies(nil); err != nil {
		log.Fatal(err)
	}

	router.GET("/client-ip", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"client_ip": c.ClientIP(),
		})
	})

	log.Fatal(router.Run(":8080"))
}
```

如果应用确实位于反向代理后面，应只填写实际代理服务器的 IP 或网段：

```go
// 只信任真正由自己控制的反向代理地址。
if err := router.SetTrustedProxies([]string{
	"192.0.2.10",
	"10.0.0.0/24",
}); err != nil {
	log.Fatal(err)
}
```

::: warning 生产环境注意
不要把所有地址都配置成可信代理。代理地址发生变化时，应同步更新可信 IP 或 CIDR；使用云负载均衡或 CDN 时，以服务商公布的出口网段和实际网络拓扑为准。
:::

官方文档：[配置受信任代理](https://gin-gonic.com/zh-cn/docs/server-config/trusted-proxies/)

### HTTPS 与 TLS

::: info 学习优先级
生产环境必须使用 HTTPS；但在前后端分离项目中，TLS 通常由 Nginx、Traefik、Ingress、CDN 或云负载均衡器终止，Gin 应用只在受保护的内部网络中提供 HTTP。因此这一项重点理解部署方式，暂不安排本地证书实操。
:::

常见部署链路：

```text
浏览器 ──HTTPS──> 反向代理 / 负载均衡器 ──内部 HTTP──> Gin
```

如果 Gin 直接暴露在公网，并且已经准备好证书和私钥，可以使用：

```go
// server.crt 是证书，server.key 是私钥。
if err := router.RunTLS(":8443", "server.crt", "server.key"); err != nil {
	log.Fatal(err)
}
```

Gin 也可以通过 `github.com/gin-gonic/autotls` 使用 Let's Encrypt 自动申请和续期证书：

```go
// 域名必须正确解析到当前服务器，并允许公网访问验证所需端口。
log.Fatal(autotls.Run(router, "api.example.com"))
```

::: warning 生产环境注意

- 私钥不能提交到 Git，也不能写进源码。
- HTTPS 部署确认无误后再启用 HSTS；HSTS 可以放在反向代理或 Gin 的安全响应头中。
- 如果 TLS 在反向代理终止，还需要正确配置可信代理，并保护 Gin 的内部 HTTP 端口不被公网直接访问。
  :::

官方文档：[安全最佳实践：HTTPS 和 TLS](https://gin-gonic.com/zh-cn/docs/middleware/security-guide/) · [支持 Let's Encrypt](https://gin-gonic.com/zh-cn/docs/server-config/support-lets-encrypt/)

### Session Management

::: info 当前学习安排
Session 是否需要深入实操取决于认证方案：Cookie/Session 登录需要重点学习；只使用 `Authorization: Bearer <token>` 的无状态 API 则不需要 Gin Session 中间件。当前项目还没有确定认证方案，因此先理解区别并保留正确示例，暂不安排任务。
:::

HTTP 本身无状态。Session 的保存方式取决于使用的 Store：

- `cookie.NewStore` 会把编码并签名后的 Session 数据保存在客户端 Cookie 中。
- Redis 或数据库等服务端 Store 通常只在 Cookie 中保存会话标识，实际 Session 数据保存在服务端。

Cookie Store 的认证密钥不能为空，推荐使用 32 或 64 字节，并应在程序启动时校验配置：

```go
authKey := []byte(os.Getenv("SESSION_AUTH_KEY"))
if len(authKey) != 32 && len(authKey) != 64 {
	log.Fatal("SESSION_AUTH_KEY must be 32 or 64 bytes")
}

// 只传认证密钥时，Session Cookie 会被签名以防止篡改，
// 但其中的数据不会被加密，因此不能保存密码、令牌等敏感数据。
store := cookie.NewStore(authKey)

// 设置 Session Cookie 的默认安全选项。
store.Options(sessions.Options{
	Path:     "/",
	MaxAge:   3600,
	HttpOnly: true,
	Secure:   true, // 生产环境仅通过 HTTPS 发送
	SameSite: http.SameSiteLaxMode,
})

router.Use(sessions.Sessions("session", store))

router.POST("/login", func(c *gin.Context) {
	session := sessions.Default(c)
	session.Set("user_id", 1001)

	// 修改 Session 后必须保存。
	if err := session.Save(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "save session failed"})
		return
	}

	c.Status(http.StatusNoContent)
})
```

选择时可以先记住：

- 使用 Redis、数据库等服务端 Store 时，可以删除服务端会话来立即注销或封禁用户；多实例部署通常使用 Redis 等共享存储。
- Cookie Store 将 Session 数据保存在客户端 Cookie 中；只传认证密钥时提供签名防篡改，但不提供加密。
- Cookie Store 没有服务端会话记录，若没有额外的版本号、拒绝列表或密钥轮换机制，也不能像服务端 Session 那样直接删除某条会话。
- JWT 适合无状态服务，但签发后较难立即撤销，不能在令牌中放敏感数据。
- 认证 Cookie 会被浏览器自动携带，修改数据的接口还需要考虑 CSRF 防护。
- 生产环境的 Session Cookie 至少应设置 `HttpOnly`、`Secure` 和合适的 `SameSite`。

官方文档：[Session Management](https://gin-gonic.com/en/docs/middleware/session-management/)

### 依赖注入：闭包模式

依赖注入不是消除依赖，而是让 Handler 只依赖一种能力，并由程序入口决定使用哪一个具体实现。闭包模式适合依赖较少的小型 Handler。

```go
// CreateUserFunc 描述 Handler 所需要的能力：
// 接收邮箱并尝试创建用户，失败时返回错误。
type CreateUserFunc func(email string) error

// newCreateAccountHandler 接收外部传入的创建用户函数，
// 再返回真正交给 Gin 注册的 Handler。
func newCreateAccountHandler(createUser CreateUserFunc) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req CreateAccountRequest

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    "INVALID_REQUEST",
				"message": "请求参数不正确",
			})
			return
		}

		// Handler 只使用注入进来的 createUser，
		// 不关心它连接的是真实数据库还是测试实现。
		if err := createUser(req.Email); err != nil {
			_ = c.Error(err)
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"message": "用户创建成功",
			"email":   req.Email,
		})
	}
}

func main() {
	router := gin.New()
	router.Use(businessErrorHandler())

	// main 负责选择具体实现并完成组装。
	router.POST(
		"/accounts",
		newCreateAccountHandler(createUserService),
	)

	log.Fatal(router.Run(":8080"))
}
```

测试时可以注入一个行为可控的函数，不需要连接真实数据库：

```go
fakeCreateUser := func(email string) error {
	return ErrEmailAlreadyExists
}

handler := newCreateAccountHandler(fakeCreateUser)
```

::: tip 判断是否完成了解耦
在 `newCreateAccountHandler` 内部只能调用参数 `createUser`，不能直接调用具体的 `createUserService`。具体实现只在 `main` 等程序组装位置出现。
:::

官方文档：[Dependency Injection Patterns](https://gin-gonic.com/en/docs/middleware/dependency-injection/)

### 依赖注入：结构体 Handler 模式

::: danger 重点掌握
这是 RESTful 前后端分离项目中最推荐掌握的依赖注入方式。数据库、Service、Repository 和配置等应用级依赖可以在程序启动时注入 Handler；同一业务模块的多个 Handler 方法可以共享这些依赖，同时保留编译期类型检查和良好的可测试性。
:::

结构体 Handler 模式把依赖保存在 Handler 的字段中。构造函数负责接收具体实现并创建 Handler，Handler 方法通过方法接收者使用这些依赖。这种方式适合一个业务模块拥有多个接口或多个依赖的项目。

```go
package main

import (
	"errors"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// ErrEmailAlreadyExists 是 Service 返回的业务错误。
var ErrEmailAlreadyExists = errors.New("email already exists")

// CreateAccountRequest 保存创建账户接口接收的 JSON 数据。
type CreateAccountRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// CreateUserFunc 描述 AccountHandler 所需要的能力：
// 接收邮箱，尝试创建用户，失败时返回错误。
type CreateUserFunc func(email string) error

// AccountHandler 保存账户接口需要使用的依赖。
// createUser 字段中保存的是一个可以被调用的函数值。
type AccountHandler struct {
	createUser CreateUserFunc
}

// NewAccountHandler 接收具体 Service，并把它保存到 Handler 字段中。
func NewAccountHandler(createUser CreateUserFunc) *AccountHandler {
	return &AccountHandler{
		createUser: createUser,
	}
}

// Create 通过方法接收者 h 访问已经注入的 createUser。
func (h *AccountHandler) Create(c *gin.Context) {
	var req CreateAccountRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    "INVALID_REQUEST",
			"message": "请求参数不正确",
		})
		return
	}

	// Handler 只调用字段中的依赖，
	// 不直接依赖 createUserService 这个具体实现。
	if err := h.createUser(req.Email); err != nil {
		switch {
		case errors.Is(err, ErrEmailAlreadyExists):
			c.JSON(http.StatusConflict, gin.H{
				"code":    "EMAIL_ALREADY_EXISTS",
				"message": "该邮箱已经注册",
			})

		default:
			log.Printf("create user failed: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "服务器内部错误",
			})
		}

		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "用户创建成功",
		"email":   req.Email,
	})
}

// createUserService 是当前使用的具体 Service 实现。
// Service 只处理业务规则，不依赖 Gin，也不决定 HTTP 状态码。
func createUserService(email string) error {
	if email == "tom@example.com" {
		return ErrEmailAlreadyExists
	}

	return nil
}

func main() {
	router := gin.Default()

	if err := router.SetTrustedProxies(nil); err != nil {
		log.Fatal(err)
	}

	// 1. 创建 Handler，并把具体 Service 注入其中。
	accountHandler := NewAccountHandler(createUserService)

	// 2. 注册 Handler 的 Create 方法。
	router.POST("/accounts", accountHandler.Create)

	if err := router.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
```

请求结果：

- 非法邮箱返回 `400 Bad Request`。
- `tom@example.com` 返回 `409 Conflict`。
- 其他合法邮箱返回 `201 Created`。

::: tip 核心关系
`createUserService` 是具体实现，`CreateUserFunc` 是 Handler 要求的函数类型，`AccountHandler.createUser` 是保存这个函数值的字段，`h.createUser(...)` 则是通过方法接收者取出并调用该函数。
:::

官方文档：[Dependency Injection Patterns](https://gin-gonic.com/en/docs/middleware/dependency-injection/)

### 依赖注入：中间件模式

中间件可以通过 `c.Set` 向当前请求的 `gin.Context` 中写入数据，后续 Handler 再通过 `c.Get` 读取。它适合认证用户、请求 ID、租户 ID、权限和链路追踪信息等随请求变化的数据。

```go
package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// 使用常量统一 Context 键名，避免写入和读取时出现拼写差异。
const currentUserKey = "current_user"

type CurrentUser struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}

// mockAuthMiddleware 模拟认证成功，
// 并把当前用户注入本次请求的 Context。
func mockAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Set(currentUserKey, CurrentUser{
			ID:   1001,
			Name: "Tom",
		})

		c.Next()
	}
}

func getCurrentUser(c *gin.Context) {
	// c.Get 同时返回数据和是否存在。
	value, exists := c.Get(currentUserKey)
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "current user not found",
		})
		return
	}

	// Context 中保存的是 any，需要安全地进行类型断言。
	currentUser, ok := value.(CurrentUser)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "invalid current user type",
		})
		return
	}

	c.JSON(http.StatusOK, currentUser)
}

func main() {
	router := gin.Default()

	api := router.Group("/api")
	api.Use(mockAuthMiddleware())
	api.GET("/me", getCurrentUser)

	router.Run(":8080")
}
```

请求 `GET /api/me`：

```json
{
  "id": 1001,
  "name": "Tom"
}
```

::: warning 使用边界
中间件注入依赖字符串键和运行时类型断言，会失去一部分编译期类型检查。数据库、Service、Repository 和配置等应用级依赖优先使用结构体 Handler 注入；中间件注入主要用于当前请求产生的数据。
:::

官方文档：[Dependency Injection Patterns](https://gin-gonic.com/en/docs/middleware/dependency-injection/)

## 日志

### 将日志写入文件

::: info 条件使用
传统部署中可能需要由应用直接写日志文件；Docker、Kubernetes 和大多数云平台更推荐应用写入标准输出，再由平台统一完成采集、检索和轮转。因此这一项理解配置方式即可，暂不安排任务。
:::

`gin.DefaultWriter` 决定 Gin 请求日志的输出位置。下面的示例同时输出到终端和文件：

```go
package main

import (
	"io"
	"log"
	"os"

	"github.com/gin-gonic/gin"
)

func main() {
	// 以追加方式打开文件，避免每次启动都清空旧日志。
	logFile, err := os.OpenFile(
		"gin.log",
		os.O_CREATE|os.O_APPEND|os.O_WRONLY,
		0o640,
	)
	if err != nil {
		log.Fatal(err)
	}
	defer logFile.Close()

	// 文件中不需要终端颜色控制字符。
	gin.DisableConsoleColor()

	// 每条 Gin 请求日志同时写入终端和 gin.log。
	gin.DefaultWriter = io.MultiWriter(os.Stdout, logFile)

	router := gin.Default()
	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "pong"})
	})

	if err := router.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
```

::: warning 生产环境注意
日志文件必须配置轮转和保留期限，不能让单个文件无限增长。不要记录密码、令牌、完整 Cookie 等敏感数据；容器环境优先输出到 `stdout`/`stderr`，由日志平台负责持久化。
:::

官方文档：[How to write log file](https://gin-gonic.com/en/docs/logging/write-log/)

### 自定义文本日志格式

::: info 低优先级
`gin.LoggerWithFormatter` 可以定制人类可读的单行文本格式，但生产 REST 服务更推荐后面要学习的结构化 JSON 日志。这里保留正确示例，不安排任务。
:::

```go
package main

import (
	"fmt"
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.New()

	router.Use(gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		return fmt.Sprintf(
			"%s | %d | %s | %s | %s\n",
			param.TimeStamp.Format(time.RFC3339),
			param.StatusCode,
			param.Method,
			param.Path,
			param.Latency,
		)
	}))
	router.Use(gin.Recovery())

	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "pong"})
	})

	if err := router.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
```

官方文档：[Custom log format](https://gin-gonic.com/en/docs/logging/custom-log-format/)

### 跳过指定路径的请求日志

健康检查等高频、低价值请求会产生大量重复日志。可以使用 `gin.LoggerConfig.SkipPaths` 让请求正常处理，但不输出对应的 Gin 请求日志。

```go
package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	// gin.New 不会自动挂载任何中间件，
	// 因此可以完全控制请求日志的配置。
	router := gin.New()

	router.Use(gin.LoggerWithConfig(gin.LoggerConfig{
		SkipPaths: []string{
			"/healthz",
		},
	}))
	router.Use(gin.Recovery())

	router.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
		})
	})

	router.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "pong",
		})
	})

	if err := router.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
```

请求结果：

- `GET /healthz` 正常返回 `200`，但不产生 Gin 请求日志。
- `GET /ping` 正常返回 `200`，并产生一条 Gin 请求日志。

::: tip 注意
需要自定义 Logger 时应使用 `gin.New()`，然后手动挂载 `gin.LoggerWithConfig(...)` 和 `gin.Recovery()`。`gin.Default()` 已经自带 Logger，再添加一个自定义 Logger 会造成配置不生效或重复日志。
:::

官方文档：[Skip logging](https://gin-gonic.com/en/docs/logging/skip-logging/)

### 控制日志颜色

::: info 低优先级
Gin 会根据终端环境处理日志颜色。写入文件、容器日志或日志采集系统时通常禁用颜色；仅在确认终端支持颜色时才需要强制开启。这一项不安排任务。
:::

```go
// 禁用日志颜色，避免文件中出现 ANSI 控制字符。
gin.DisableConsoleColor()

// 强制开启终端颜色。
// gin.ForceConsoleColor()
```

官方文档：[Controlling Log output coloring](https://gin-gonic.com/en/docs/logging/controlling-log-output-coloring/)

### 避免记录查询字符串

::: tip 生产环境推荐配置
查询参数中可能包含令牌、邮箱和其他隐私数据，不应进入日志文件或日志平台。生产环境建议启用 `SkipQueryString`，并继续从接口设计层面避免把敏感信息放进 URL。
:::

使用 `SkipQueryString: true` 后，Gin 仍会把查询参数正常交给 Handler，只是不再把它们写入请求日志。

```go
router := gin.New()

router.Use(gin.LoggerWithConfig(gin.LoggerConfig{
	// 健康检查请求不产生日志。
	SkipPaths: []string{
		"/healthz",
	},

	// 日志只记录 URL 路径，不记录 ? 后面的查询参数。
	SkipQueryString: true,
}))

router.Use(gin.Recovery())
```

例如客户端请求：

```text
GET /api/me?token=secret123&email=tom@example.com
```

日志只记录：

```text
GET "/api/me"
```

Handler 仍然可以读取查询参数：

```go
token := c.Query("token")
email := c.Query("email")
```

::: warning 日志安全
隐藏查询字符串不能代替正确的接口设计。密码、访问令牌等敏感信息不应放在 URL 中；同时也不要主动记录 `Authorization`、Cookie、密码或完整请求体。
:::

官方文档：[Avoid logging query strings](https://gin-gonic.com/en/docs/logging/avoid-logging-query-strings/)

### 定义启动时的路由日志格式

::: info 低优先级
这一项只影响 Gin 在调试模式下启动时打印的路由信息，不影响请求处理和每次请求产生的访问日志。通常保持默认格式即可，这里展示并记录用法，不安排任务。
:::

Gin 在启动时默认打印类似内容：

```text
[GIN-debug] GET /ping --> main.pingHandler (3 handlers)
```

可以在注册路由之前设置 `gin.DebugPrintRouteFunc`：

```go
package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	gin.DebugPrintRouteFunc = func(
		httpMethod string,
		absolutePath string,
		handlerName string,
		handlerCount int,
	) {
		log.Printf(
			"route method=%s path=%s handler=%s handlers=%d",
			httpMethod,
			absolutePath,
			handlerName,
			handlerCount,
		)
	}

	router := gin.Default()

	router.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "pong",
		})
	})

	router.Run(":8080")
}
```

::: tip 区分两类日志

- `gin.DebugPrintRouteFunc`：服务启动时输出已注册的路由。
- `gin.Logger()`：请求到来后输出状态码、路径和耗时等访问日志。
  :::

官方文档：[Define format for the log of routes](https://gin-gonic.com/en/docs/logging/define-format-for-the-log-of-routes/)

### 结构化日志

::: danger 重点掌握
生产 REST 服务推荐输出 JSON 结构化日志，便于日志平台按请求方法、路由、状态码、耗时和日志级别进行检索、统计和告警。Go 1.21 及以上版本可以直接使用标准库 `log/slog`。
:::

```go
package main

import (
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

func slogMiddleware(logger *slog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 跳过高频健康检查日志。
		if c.Request.URL.Path == "/healthz" {
			c.Next()
			return
		}

		start := time.Now()

		// 先执行后续中间件和 Handler，
		// 然后才能取得最终状态码、响应大小和完整耗时。
		c.Next()

		status := c.Writer.Status()
		latency := time.Since(start)

		// FullPath 返回路由模板，例如 /users/:id，
		// 避免每个真实用户 ID 都形成不同的日志分类。
		route := c.FullPath()
		if route == "" {
			route = c.Request.URL.Path
		}

		level := slog.LevelInfo
		switch {
		case status >= http.StatusInternalServerError:
			level = slog.LevelError
		case status >= http.StatusBadRequest:
			level = slog.LevelWarn
		}

		attrs := []slog.Attr{
			slog.String("method", c.Request.Method),

			// URL.Path 不包含查询字符串。
			slog.String("path", c.Request.URL.Path),
			slog.String("route", route),
			slog.Int("status", status),
			slog.Int64("latency_ms", latency.Milliseconds()),
			slog.String("client_ip", c.ClientIP()),
			slog.Int("response_size", c.Writer.Size()),
		}

		if len(c.Errors) > 0 {
			attrs = append(
				attrs,
				slog.String("errors", c.Errors.String()),
			)
		}

		logger.LogAttrs(
			c.Request.Context(),
			level,
			"HTTP request completed",
			attrs...,
		)
	}
}

func main() {
	logger := slog.New(
		slog.NewJSONHandler(os.Stdout, nil),
	)

	router := gin.New()
	router.Use(slogMiddleware(logger))
	router.Use(gin.Recovery())

	router.GET("/healthz", func(c *gin.Context) {
		c.Status(http.StatusNoContent)
	})

	router.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "pong",
		})
	})

	router.Run(":8080")
}
```

日志示例：

```json
{
  "time": "2026-07-23T23:25:41+08:00",
  "level": "INFO",
  "msg": "HTTP request completed",
  "method": "GET",
  "path": "/api/me",
  "route": "/api/me",
  "status": 200,
  "latency_ms": 1,
  "client_ip": "127.0.0.1",
  "response_size": 24
}
```

需要注意：

- 日志应在 `c.Next()` 后输出，才能取得最终响应结果。
- 记录 `URL.Path`，不要记录可能包含敏感数据的查询字符串。
- 4xx 可以记录为 `WARN`，5xx 可以记录为 `ERROR`。
- 不要记录密码、访问令牌、完整 Cookie 和其他敏感信息。

官方文档：[Structured Logging](https://gin-gonic.com/en/docs/logging/structured-logging/)

### Request ID / Correlation ID

::: danger 重点掌握
Request ID 为每个请求提供唯一标识，并同时出现在响应头和结构化日志中。客户端反馈问题时，可以使用该 ID 查找对应日志；在微服务之间继续传递同一个 ID，还可以关联一次调用经过的多个服务。
:::

```go
package main

import (
	"crypto/rand"
	"log/slog"
	"os"

	"github.com/gin-gonic/gin"
)

const requestIDKey = "request_id"
const requestIDHeader = "X-Request-ID"

func requestIDMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 优先沿用上游传来的 Request ID。
		requestID := c.GetHeader(requestIDHeader)

		// 没有上游 ID 时，由当前服务生成安全的随机 ID。
		if requestID == "" {
			requestID = rand.Text()
		}

		// 注入当前请求，供后续中间件和 Handler 使用。
		c.Set(requestIDKey, requestID)

		// 同时返回给客户端。
		c.Header(requestIDHeader, requestID)

		c.Next()
	}
}

func slogMiddleware(logger *slog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		logger.Info(
			"HTTP request completed",
			slog.String(
				"request_id",
				c.GetString(requestIDKey),
			),
			slog.String("method", c.Request.Method),
			slog.String("path", c.Request.URL.Path),
			slog.Int("status", c.Writer.Status()),
		)
	}
}

func main() {
	logger := slog.New(
		slog.NewJSONHandler(os.Stdout, nil),
	)

	router := gin.New()

	// Request ID 必须先注入，后面的日志中间件才能读取。
	router.Use(requestIDMiddleware())
	router.Use(slogMiddleware(logger))
	router.Use(gin.Recovery())

	router.Run(":8080")
}
```

不携带请求头时，服务器生成 ID：

```text
客户端请求
  ↓
requestIDMiddleware 生成 Request ID
  ↓
写入 gin.Context
  ↓
返回 X-Request-ID 响应头
  ↓
slogMiddleware 写入相同 request_id
```

如果可信上游已经携带：

```http
X-Request-ID: demo-123
```

响应头和日志会继续使用 `demo-123`。

::: warning 注意
Request ID 只用于追踪请求，不代表用户身份，不能用于认证或权限判断。生产环境接收外部 Request ID 时，可以进一步限制长度和允许的字符，避免异常请求头污染日志。
:::

官方文档：[Structured Logging：Request ID / Correlation ID](https://gin-gonic.com/en/docs/logging/structured-logging/#request-id--correlation-id)

### Zerolog 结构化日志

::: info 低优先级
`zerolog` 是第三方高性能 JSON 日志库，适合已经统一采用 zerolog 的项目。当前项目已经使用 Go 标准库 `slog` 完成结构化日志，没有必要同时维护两套日志依赖，因此这里只展示并记录用法，不安排任务。
:::

安装：

```shell
go get github.com/rs/zerolog
```

中间件示例：

```go
package main

import (
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
)

func zerologMiddleware(logger zerolog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		c.Next()

		logger.Info().
			Str("method", c.Request.Method).
			Str("path", c.Request.URL.Path).
			Int("status", c.Writer.Status()).
			Int64("latency_ms", time.Since(start).Milliseconds()).
			Str("client_ip", c.ClientIP()).
			Msg("HTTP request completed")
	}
}

func main() {
	logger := zerolog.New(os.Stdout).With().Timestamp().Logger()

	router := gin.New()
	router.Use(zerologMiddleware(logger))
	router.Use(gin.Recovery())

	router.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "pong",
		})
	})

	router.Run(":8080")
}
```

选择原则：

- 新的普通 Go/Gin 项目可以优先使用标准库 `log/slog`。
- 已经统一采用 zerolog 的项目可以继续使用 zerolog。
- 同一个服务应尽量只使用一套主要日志方案，保持字段和输出格式一致。

官方文档：[Structured Logging：Using zerolog](https://gin-gonic.com/en/docs/logging/structured-logging/#using-zerolog)

## 服务器配置

### 自定义 HTTP Server

::: danger 重点掌握
生产环境建议使用标准库 `http.Server` 启动 Gin，以便显式配置请求头、读取、写入和空闲连接超时。Gin 的 `*gin.Engine` 实现了 `http.Handler` 接口，因此可以直接赋值给 `http.Server.Handler`。
:::

```go
package main

import (
	"errors"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.New()
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	router.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "pong",
		})
	})

	server := &http.Server{
		Addr:              ":8080",
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
		MaxHeaderBytes:    1 << 20,
	}

	if err := server.ListenAndServe(); err != nil &&
		!errors.Is(err, http.ErrServerClosed) {
		log.Fatal(err)
	}
}
```

配置说明：

| 配置                | 作用                           |
| ------------------- | ------------------------------ |
| `Addr`              | HTTP Server 监听地址           |
| `Handler`           | 处理请求的 Gin 路由器          |
| `ReadHeaderTimeout` | 限制读取请求头的时间           |
| `ReadTimeout`       | 限制读取完整请求的时间         |
| `WriteTimeout`      | 限制写入响应的时间             |
| `IdleTimeout`       | 限制 Keep-Alive 空闲连接的时间 |
| `MaxHeaderBytes`    | 限制请求头的最大字节数         |

::: warning 配置注意
示例中的时间不是所有项目的固定答案。文件上传、下载、SSE 和其他长连接接口需要根据实际请求时长调整；`WriteTimeout` 太短可能提前中断长响应。
:::

官方文档：[Custom HTTP configuration](https://gin-gonic.com/en/docs/server-config/custom-http-config/)

### 运行时自定义 JSON 编解码器

::: info 低优先级
Gin 默认使用 Go 标准库兼容的 JSON 编解码能力，已经适合绝大多数 REST API。只有经过基准测试确认 JSON 是性能瓶颈，或项目确实需要特殊序列化行为时，才考虑全局替换 JSON 实现。这里展示并记录官方扩展方式，不安排任务。
:::

自定义实现需要满足 Gin 的 `json.Core` 接口，并且必须在创建和启动 Gin Engine 之前赋值给 `json.API`：

```go
package main

import (
	"io"

	"github.com/gin-gonic/gin"
	ginjson "github.com/gin-gonic/gin/codec/json"
	jsoniter "github.com/json-iterator/go"
)

var customJSONConfig = jsoniter.Config{
	EscapeHTML:             true,
	SortMapKeys:            true,
	ValidateJsonRawMessage: true,
}.Froze()

type customJSONAPI struct{}

func (customJSONAPI) Marshal(value any) ([]byte, error) {
	return customJSONConfig.Marshal(value)
}

func (customJSONAPI) Unmarshal(data []byte, value any) error {
	return customJSONConfig.Unmarshal(data, value)
}

func (customJSONAPI) MarshalIndent(
	value any,
	prefix string,
	indent string,
) ([]byte, error) {
	return customJSONConfig.MarshalIndent(value, prefix, indent)
}

func (customJSONAPI) NewEncoder(writer io.Writer) ginjson.Encoder {
	return customJSONConfig.NewEncoder(writer)
}

func (customJSONAPI) NewDecoder(reader io.Reader) ginjson.Decoder {
	return customJSONConfig.NewDecoder(reader)
}

func main() {
	// json.API 是全局配置，必须在 Gin 开始处理请求之前替换。
	ginjson.API = customJSONAPI{}

	router := gin.Default()
	router.Run(":8080")
}
```

使用边界：

- 替换 `json.API` 会影响整个进程中的 Gin JSON 编解码。
- 引入第三方 JSON 库前应进行兼容性测试和真实业务基准测试。
- 不应只因为第三方库“可能更快”就增加全局依赖和行为差异。
- 普通项目继续使用 Gin 默认 JSON 实现即可。

官方文档：[Custom JSON codec at runtime](https://gin-gonic.com/en/docs/server-config/custom-json-codec/)

### 运行多个 HTTP 服务

::: info 低优先级
只有同一进程需要分别暴露公共 API、管理接口或监控端口时，才需要同时运行多个 Gin 服务。常规 REST 项目通常一个进程只运行一个服务，因此这里展示并记录基本结构，不安排任务。
:::

下面的示例分别在 `8080` 和 `8081` 端口运行公共服务与管理服务：

```go
package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/sync/errgroup"
)

func publicRouter() http.Handler {
	router := gin.New()
	router.Use(gin.Recovery())

	router.GET("/api/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "public pong",
		})
	})

	return router
}

func adminRouter() http.Handler {
	router := gin.New()
	router.Use(gin.Recovery())

	router.GET("/healthz", func(c *gin.Context) {
		c.Status(http.StatusNoContent)
	})

	return router
}

func runServer(server *http.Server) func() error {
	return func() error {
		err := server.ListenAndServe()
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return err
	}
}

func main() {
	publicServer := &http.Server{
		Addr:              ":8080",
		Handler:           publicRouter(),
		ReadHeaderTimeout: 5 * time.Second,
	}

	adminServer := &http.Server{
		Addr:              ":8081",
		Handler:           adminRouter(),
		ReadHeaderTimeout: 5 * time.Second,
	}

	// 一个服务启动或运行失败时，取消 groupContext，
	// 再关闭仍在运行的另一个服务。
	group, groupContext := errgroup.WithContext(context.Background())
	group.Go(runServer(publicServer))
	group.Go(runServer(adminServer))

	group.Go(func() error {
		<-groupContext.Done()

		shutdownContext, cancel := context.WithTimeout(
			context.Background(),
			5*time.Second,
		)
		defer cancel()

		if err := publicServer.Shutdown(shutdownContext); err != nil {
			log.Printf("public server shutdown failed: %v", err)
		}
		if err := adminServer.Shutdown(shutdownContext); err != nil {
			log.Printf("admin server shutdown failed: %v", err)
		}

		return nil
	})

	if err := group.Wait(); err != nil {
		log.Fatal(err)
	}
}
```

使用时需要注意：

- 两个服务必须监听不同端口。
- 每个服务可以拥有独立的 Router、中间件和安全策略。
- 使用 `errgroup.WithContext`，一个服务失败时应关闭另一个服务，避免程序只剩部分端口继续运行。
- 管理端口不应直接暴露到公网。
- 生产代码还应配合下一节的优雅关闭，同时停止所有 Server。

官方文档：[Run multiple service](https://gin-gonic.com/en/docs/server-config/run-multiple-service/)

### 优雅关闭

::: warning 难理解（重点）
这一节同时涉及 goroutine、channel、操作系统信号、`context.Context` 和 `http.Server` 生命周期，第一次学习容易混淆。它不是低优先级知识：生产部署、容器停止和服务更新都需要正确处理优雅关闭。
:::

理解时固定分成四个角色：

```text
子 goroutine：运行 server.ListenAndServe()
        ↓
main goroutine：同时等待服务器错误或停止信号
        ↓
收到停止信号：创建带超时的 Context
        ↓
server.Shutdown(ctx)：停止接收新请求并等待现有请求完成
```

完整示例：

```go
package main

import (
	"context"
	"errors"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.New()
	router.Use(gin.Recovery())

	router.GET("/healthz", func(c *gin.Context) {
		c.Status(http.StatusNoContent)
	})

	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	server := &http.Server{
		Addr:              ":8080",
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
	}

	// 使用带缓冲的 channel 接收服务器运行结果。
	// 缓冲区可以避免 main 正在处理停止信号时，子 goroutine 因发送结果而阻塞。
	serverError := make(chan error, 1)

	// ListenAndServe 会阻塞，所以放到子 goroutine 中运行。
	// 整个程序中只调用一次 ListenAndServe。
	go func() {
		serverError <- server.ListenAndServe()
	}()

	// 同时监听 Ctrl+C 和系统发出的终止信号。
	signalContext, stop := signal.NotifyContext(
		context.Background(),
		os.Interrupt,
		syscall.SIGTERM,
	)
	defer stop()

	// main goroutine 同时等待两类事件：
	// 1. 服务器自身启动或运行失败；
	// 2. 程序收到停止信号。
	select {
	case err := <-serverError:
		if err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatal(err)
		}
		return
	case <-signalContext.Done():
		logger.Info("shutdown signal received")
	}

	// 最多给已有请求 10 秒钟的处理时间。
	shutdownContext, cancel := context.WithTimeout(
		context.Background(),
		10*time.Second,
	)
	defer cancel()

	// Shutdown 会停止接收新请求，并等待正在处理的请求结束。
	if err := server.Shutdown(shutdownContext); err != nil {
		log.Printf("graceful shutdown failed: %v", err)
	}

	// Shutdown 后，ListenAndServe 会返回 http.ErrServerClosed。
	// 这是正常关闭结果，不应当把它当作程序错误。
	if err := <-serverError; err != nil &&
		!errors.Is(err, http.ErrServerClosed) {
		log.Printf("server stopped with error: %v", err)
	}

	logger.Info("server stopped")
}
```

关键点：

- 子 goroutine 只负责运行服务器，main goroutine 负责管理服务器生命周期。
- `ListenAndServe()` 只能调用一次，返回结果通过 `serverError` 传给 main goroutine。
- `signal.NotifyContext` 把操作系统停止信号转换为 `Context` 的取消事件。
- `server.Shutdown(ctx)` 先停止接收新请求，再等待现有请求完成。
- 主动调用 `Shutdown` 后返回的 `http.ErrServerClosed` 是正常结果。

官方文档：[Graceful restart or stop](https://gin-gonic.com/zh-cn/docs/server-config/graceful-restart-or-stop/)

### HTTP/2 Server Push

::: danger 已淘汰（低优先级）
HTTP/2 Server Push 已被主要浏览器弃用，Chrome 从 106 版本开始默认关闭。Gin 官方英文文档也建议改用 `103 Early Hints` 或 `<link rel="preload">`。

对于 RESTful 前后端分离项目，静态资源通常由前端服务器、CDN 或反向代理提供，Gin API 服务一般不需要使用这个功能。本节只作了解，不安排实操。
:::

它原本允许服务器在返回 HTML 时，提前向浏览器推送页面即将使用的 JS、CSS 等资源。它与 WebSocket、SSE 等业务消息推送没有关系。

以下代码仅用于识别旧项目中的写法：

```go
router.GET("/", func(c *gin.Context) {
	// Pusher 只有在当前连接和 ResponseWriter 支持 HTTP/2 Push 时才不为 nil。
	if pusher := c.Writer.Pusher(); pusher != nil {
		if err := pusher.Push("/assets/app.js", nil); err != nil {
			log.Printf("failed to push resource: %v", err)
		}
	}

	c.HTML(http.StatusOK, "index.html", gin.H{
		"status": "success",
	})
})
```

现在应根据场景选择：

- HTML 页面加载关键资源：使用 `103 Early Hints` 或 `<link rel="preload">`。
- 前后端分离项目的静态资源：交给前端服务器、CDN 或反向代理。
- 服务端主动发送业务事件：使用 SSE 或 WebSocket，而不是 HTTP/2 Server Push。

官方资料：

- [Gin：HTTP2 server push](https://gin-gonic.com/en/docs/server-config/http2-server-push/)
- [Chrome：Remove HTTP/2 Server Push](https://developer.chrome.com/blog/removing-push)

### Cookie 处理

Cookie 是服务器通过响应头交给浏览器保存的数据。浏览器保存后，会在符合 Domain、Path、Secure 和 SameSite 等条件的后续请求中自动携带。

::: warning 前后端分离项目注意
如果使用 `Authorization: Bearer <token>`，普通业务接口通常不依赖 Cookie；如果把 Session ID、访问令牌或刷新令牌保存在 Cookie 中，本节就是认证安全的重点。

生产环境中的认证 Cookie 通常应启用 `Secure`、`HttpOnly` 和合适的 `SameSite`，并同时考虑 CSRF 防护。
:::

完整示例：

```go
package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ThemeRequest 表示设置主题接口接收的 JSON 数据。
// required：theme 字段不能为空。
// oneof=light dark：theme 只能是 light 或 dark。
type ThemeRequest struct {
	Theme string `json:"theme" binding:"required,oneof=light dark"`
}

func main() {
	router := gin.Default()

	// 设置主题 Cookie。
	router.POST("/preferences/theme", func(c *gin.Context) {
		var req ThemeRequest

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "theme must be light or dark",
			})
			return
		}

		// 设置 Cookie 的 SameSite 属性。
		c.SetSameSite(http.SameSiteLaxMode)

		// SetCookie 把 Set-Cookie 响应头写入本次响应。
		c.SetCookie(
			"theme",   // Cookie 名称
			req.Theme, // Cookie 值
			3600,      // 有效期，单位为秒
			"/",       // 对整个网站路径生效
			"",        // 当前域名
			false,     // 本地 HTTP 环境暂不启用 Secure
			true,      // HttpOnly：禁止前端 JavaScript 读取
		)

		c.Status(http.StatusNoContent)
	})

	// 读取浏览器在后续请求中携带的 Cookie。
	router.GET("/preferences/theme", func(c *gin.Context) {
		theme, err := c.Cookie("theme")
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "theme cookie not found",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"theme": theme,
		})
	})

	if err := router.Run(":8080"); err != nil {
		panic(err)
	}
}
```

执行顺序：

```text
POST 设置 Cookie
    ↓
浏览器读取 Set-Cookie 响应头并保存
    ↓
浏览器在下一次 GET 请求中携带 Cookie
    ↓
GET 使用 c.Cookie() 读取
```

`c.SetCookie()` 设置的是响应 Cookie，不会修改当前请求，因此不能指望在同一次请求中立即使用 `c.Cookie()` 读到它。

官方文档：[Cookie](https://gin-gonic.com/zh-cn/docs/server-config/cookie/)

### WebSocket 支持

::: warning 按需学习（当前低优先级）
WebSocket 适合聊天、实时通知、在线状态、协同编辑等需要服务端和客户端持续双向通信的功能。普通 RESTful CRUD 接口仍应使用 HTTP 请求与响应。

Gin 不内置 WebSocket 实现，通常与 `github.com/gorilla/websocket` 配合。当前项目没有实时通信需求，因此只保留参考示例，不安排实操。
:::

安装依赖：

```bash
go get github.com/gorilla/websocket
```

最小 Echo 示例：

```go
package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	// WebSocket 不使用普通 CORS 中间件完成 Origin 校验。
	// 生产环境必须明确限制允许连接的前端来源。
	CheckOrigin: func(r *http.Request) bool {
		return r.Header.Get("Origin") == "https://app.example.com"
	},
}

func handleWebSocket(c *gin.Context) {
	// 把当前 HTTP 连接升级为 WebSocket 连接。
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("websocket upgrade failed: %v", err)
		return
	}
	defer conn.Close()

	for {
		// 等待客户端发送消息。
		messageType, message, err := conn.ReadMessage()
		if err != nil {
			log.Printf("websocket read stopped: %v", err)
			return
		}

		// 把收到的消息原样返回给客户端。
		if err := conn.WriteMessage(messageType, message); err != nil {
			log.Printf("websocket write stopped: %v", err)
			return
		}
	}
}

func main() {
	router := gin.Default()
	router.GET("/ws", handleWebSocket)

	if err := router.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
```

生产环境还需要处理：

- 使用 Ping/Pong 检测失效连接。
- 客户端断开后及时清理连接。
- 限制消息大小、连接数和发送频率。
- 避免多个 goroutine 同时向同一个连接写数据。
- 身份认证不能只依赖客户端传入的用户 ID。

官方文档：[WebSocket 支持](https://gin-gonic.com/zh-cn/docs/server-config/websocket/)

### 数据库集成：连接池与 Handler 注入

Gin 不内置数据库功能。通常使用 Go 标准库的 `database/sql`，再配合 MySQL 驱动。

`*sql.DB` 表示数据库连接池，不是一条固定连接。它应当在程序启动时创建一次，再注入需要访问数据库的 Handler；不要在每次 HTTP 请求中重复调用 `sql.Open()`。

安装 MySQL 驱动：

```bash
go get github.com/go-sql-driver/mysql
```

完整示例：

```go
package main

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	// 空白导入会执行驱动的初始化代码，
	// 把名为 mysql 的驱动注册给 database/sql。
	_ "github.com/go-sql-driver/mysql"
)

// 本地学习时可以直接填写密码。
// 真实项目应改用环境变量或密钥管理服务。
const mysqlDSN = "root:your_password@tcp(127.0.0.1:3306)/study?charset=utf8mb4&parseTime=true&loc=Local&timeout=2s"

// DatabaseHandler 保存由外部注入的数据库连接池。
type DatabaseHandler struct {
	db *sql.DB
}

func NewDatabaseHandler(db *sql.DB) *DatabaseHandler {
	return &DatabaseHandler{
		db: db,
	}
}

// Health 检查数据库当前是否可用。
func (h *DatabaseHandler) Health(c *gin.Context) {
	// 使用请求的 Context；请求取消后，数据库操作也可以及时停止。
	if err := h.db.PingContext(c.Request.Context()); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "database unavailable",
		})
		return
	}

	c.Status(http.StatusNoContent)
}

func openDatabase() (*sql.DB, error) {
	// sql.Open 创建数据库连接池句柄，但不代表已经成功连接。
	db, err := sql.Open("mysql", mysqlDSN)
	if err != nil {
		return nil, err
	}

	// 根据数据库容量和应用流量配置连接池。
	db.SetMaxOpenConns(5)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(3 * time.Minute)
	db.SetConnMaxIdleTime(1 * time.Minute)

	// 启动阶段最多等待两秒，验证数据库是否真的可用。
	ctx, cancel := context.WithTimeout(
		context.Background(),
		2*time.Second,
	)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		// 验证失败时释放已经创建的连接池资源。
		db.Close()
		return nil, err
	}

	return db, nil
}

func main() {
	// 整个程序只初始化一次数据库连接池。
	db, err := openDatabase()
	if err != nil {
		log.Fatalf("open database failed: %v", err)
	}
	defer db.Close()

	// 把数据库连接池注入 Handler。
	databaseHandler := NewDatabaseHandler(db)

	router := gin.Default()
	router.GET("/database/health", databaseHandler.Health)

	if err := router.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
```

关键点：

- `go get` 只安装依赖，代码中仍需要空白导入 MySQL 驱动。
- `sql.Open()` 主要创建连接池句柄，使用 `PingContext()` 才能验证真实连接。
- `*sql.DB` 在 `main` 中创建一次，通过构造函数注入 Handler。
- Handler 只使用 `h.db`，不重新打开数据库。
- 程序结束时使用 `defer db.Close()` 释放连接池。
- 健康检查成功返回 `204`，数据库不可用返回 `503`。

官方资料：

- [Gin：数据库集成](https://gin-gonic.com/zh-cn/docs/server-config/database/)
- [Go MySQL Driver](https://github.com/go-sql-driver/mysql)

### 数据库集成：使用 QueryRowContext 查询单条数据

`QueryRowContext` 用于执行预期最多返回一行的 SQL 查询。调用它时传入 HTTP 请求的 `Context`，客户端断开或请求被取消后，数据库操作也可以停止。

先在 MySQL 中准备表和测试数据：

```sql
CREATE TABLE IF NOT EXISTS products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price_cents BIGINT NOT NULL
);

INSERT IGNORE INTO products (id, name, price_cents)
VALUES (1, 'Mechanical Keyboard', 29900);
```

完整示例：

```go
package main

import (
	"context"
	"database/sql"
	"errors"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	_ "github.com/go-sql-driver/mysql"
)

// 本地学习时替换为自己的 MySQL 密码。
// 真实项目应使用环境变量或密钥管理服务。
const mysqlDSN = "root:your_password@tcp(127.0.0.1:3306)/study?charset=utf8mb4&parseTime=true&loc=Local&timeout=2s"

type Product struct {
	ID         int64  `json:"id"`
	Name       string `json:"name"`
	PriceCents int64  `json:"price_cents"`
}

// ProductHandler 通过构造函数接收数据库连接池。
type ProductHandler struct {
	db *sql.DB
}

func NewProductHandler(db *sql.DB) *ProductHandler {
	return &ProductHandler{
		db: db,
	}
}

func (h *ProductHandler) Get(c *gin.Context) {
	// 路径参数来自用户输入，应先验证格式和取值范围。
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid product id",
		})
		return
	}

	var product Product

	// 使用 ? 占位符，把 SQL 和参数分开传递。
	// 不要使用字符串拼接或 fmt.Sprintf 拼接用户输入。
	const query = `
		SELECT id, name, price_cents
		FROM products
		WHERE id = ?
	`

	// QueryRowContext 返回 *sql.Row。
	// 查询和扫描过程中的错误会在 Scan 时返回。
	err = h.db.QueryRowContext(
		c.Request.Context(),
		query,
		id,
	).Scan(
		&product.ID,
		&product.Name,
		&product.PriceCents,
	)

	switch {
	case errors.Is(err, sql.ErrNoRows):
		c.JSON(http.StatusNotFound, gin.H{
			"error": "product not found",
		})
		return

	case err != nil:
		// 详细错误只记录在服务端，不直接返回给客户端。
		log.Printf("query product failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "database error",
		})
		return
	}

	c.JSON(http.StatusOK, product)
}

func openDatabase() (*sql.DB, error) {
	db, err := sql.Open("mysql", mysqlDSN)
	if err != nil {
		return nil, err
	}

	db.SetMaxOpenConns(5)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(3 * time.Minute)
	db.SetConnMaxIdleTime(1 * time.Minute)

	ctx, cancel := context.WithTimeout(
		context.Background(),
		2*time.Second,
	)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		db.Close()
		return nil, err
	}

	return db, nil
}

func main() {
	db, err := openDatabase()
	if err != nil {
		log.Fatalf("open database failed: %v", err)
	}
	defer db.Close()

	productHandler := NewProductHandler(db)

	router := gin.Default()
	router.GET("/products/:id", productHandler.Get)

	if err := router.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
```

响应规则：

- `GET /products/abc`：ID 格式错误，返回 `400`。
- `GET /products/999`：记录不存在，返回 `404`。
- 数据库查询失败：返回 `500`，详细错误只记录在服务端。
- `GET /products/1`：成功返回 `200` 和商品 JSON。

关键点：

- MySQL 参数占位符使用 `?`。
- SQL 和参数必须分开传递，不能拼接用户输入。
- `QueryRowContext()` 的查询错误通常在 `Scan()` 时返回。
- 使用 `errors.Is(err, sql.ErrNoRows)` 判断记录不存在。
- `Scan()` 参数的数量和顺序必须与 `SELECT` 字段对应。
- 金额使用整数分保存，避免浮点数精度问题。

::: tip 生产项目中的分层
本示例为了突出 `QueryRowContext`，让 Handler 直接持有 `*sql.DB`。大型生产项目通常会进一步拆分为 `Handler → Service → Repository → Database`，使 HTTP 处理、业务规则和数据访问各自独立。
:::

官方文档：[Gin：数据库集成](https://gin-gonic.com/zh-cn/docs/server-config/database/)

### GORM：MySQL 连接与单条查询

::: warning 重点
GORM 是 Go 项目常用的完整 ORM。它可以简化 CRUD、结构体映射、关联查询和事务处理，但底层仍然通过 `database/sql` 管理连接池。

必须理解两层对象的区别：

- `*gorm.DB`：执行 GORM 查询、创建、更新、删除和事务。
- `*sql.DB`：底层连接池，用于配置连接数量、生命周期、健康检查和关闭资源。
  :::

安装：

```bash
go get gorm.io/gorm
go get gorm.io/driver/mysql
```

同一个单条查询的对比：

```go
// database/sql：手写 SQL 并手动 Scan。
err := sqlDB.QueryRowContext(
	ctx,
	"SELECT id, name, price_cents FROM products WHERE id = ?",
	id,
).Scan(&product.ID, &product.Name, &product.PriceCents)

// GORM 泛型 API：根据模型完成查询和结构体映射。
product, err := gorm.G[Product](gormDB).
	Where("id = ?", id).
	First(ctx)
```

完整示例：

```go
package main

import (
	"context"
	"database/sql"
	"errors"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// 本地学习时替换为自己的 MySQL 密码。
// 真实项目应使用环境变量或密钥管理服务。
const mysqlDSN = "root:your_password@tcp(127.0.0.1:3306)/study?charset=utf8mb4&parseTime=true&loc=Local&timeout=2s"

// Product 默认映射到 products 表。
type Product struct {
	ID         int64  `gorm:"primaryKey" json:"id"`
	Name       string `json:"name"`
	PriceCents int64  `gorm:"column:price_cents" json:"price_cents"`
}

type ProductHandler struct {
	db *gorm.DB
}

func NewProductHandler(db *gorm.DB) *ProductHandler {
	return &ProductHandler{
		db: db,
	}
}

func (h *ProductHandler) Get(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid product id",
		})
		return
	}

	// GORM 泛型 API 直接返回 Product 和 error。
	// 请求取消后，数据库查询也可以通过 Context 及时停止。
	product, err := gorm.G[Product](h.db).
		Where("id = ?", id).
		First(c.Request.Context())

	switch {
	case errors.Is(err, gorm.ErrRecordNotFound):
		c.JSON(http.StatusNotFound, gin.H{
			"error": "product not found",
		})
		return

	case err != nil:
		log.Printf("query product failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "database error",
		})
		return
	}

	c.JSON(http.StatusOK, product)
}

// 同时返回 GORM 查询对象和底层 database/sql 连接池。
func openDatabase() (*gorm.DB, *sql.DB, error) {
	gormDB, err := gorm.Open(
		mysql.Open(mysqlDSN),
		&gorm.Config{},
	)
	if err != nil {
		return nil, nil, err
	}

	// 取得 GORM 底层的连接池。
	// 不要再调用 sql.Open 创建第二个连接池。
	sqlDB, err := gormDB.DB()
	if err != nil {
		return nil, nil, err
	}

	sqlDB.SetMaxOpenConns(5)
	sqlDB.SetMaxIdleConns(5)
	sqlDB.SetConnMaxLifetime(3 * time.Minute)
	sqlDB.SetConnMaxIdleTime(1 * time.Minute)

	ctx, cancel := context.WithTimeout(
		context.Background(),
		2*time.Second,
	)
	defer cancel()

	if err := sqlDB.PingContext(ctx); err != nil {
		sqlDB.Close()
		return nil, nil, err
	}

	return gormDB, sqlDB, nil
}

func main() {
	gormDB, sqlDB, err := openDatabase()
	if err != nil {
		log.Fatalf("open database failed: %v", err)
	}
	defer sqlDB.Close()

	productHandler := NewProductHandler(gormDB)

	router := gin.Default()
	router.GET("/products/:id", productHandler.Get)

	if err := router.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
```

错误对应关系：

| `database/sql`  | GORM                     | HTTP 响应                   |
| --------------- | ------------------------ | --------------------------- |
| `sql.ErrNoRows` | `gorm.ErrRecordNotFound` | `404 Not Found`             |
| 其他查询错误    | 其他 GORM 错误           | `500 Internal Server Error` |
| `nil`           | `nil`                    | `200 OK`                    |

关键点：

- GORM 的 `Product` 默认映射到 `products` 表，`PriceCents` 默认映射到 `price_cents`。
- 使用 `Where("id = ?", id)` 传递参数，仍然不能拼接用户输入。
- 泛型 API 通过 `gorm.G[Product](db)` 提供类型明确的查询结果。
- 使用 `c.Request.Context()` 关联 HTTP 请求和数据库操作。
- 使用 `errors.Is(err, gorm.ErrRecordNotFound)` 判断记录不存在。
- GORM 底层仍然使用 `database/sql`，连接池只创建一次。
- 关闭程序时调用底层 `sqlDB.Close()`。

官方资料：

- [GORM：连接 MySQL 与连接池](https://gorm.io/docs/connecting_to_the_database.html)
- [GORM：查询](https://gorm.io/docs/query.html)
- [GORM：错误处理](https://gorm.io/docs/error_handling.html)
- [GORM：Context](https://gorm.io/docs/context.html)

### 数据库事务

::: warning 重点
事务把多次数据库操作组成一个不可分割的整体：要么全部提交，要么全部回滚。转账、下单并扣库存、创建主记录和明细记录等功能都必须正确使用事务。

事务开始后，所有相关数据库操作都必须通过 `tx` 执行，不能中途使用原来的 `db`，否则那次操作会脱离事务。
:::

基本流程：

```text
BeginTx
   ↓
使用 tx 执行操作一
   ↓
使用 tx 执行操作二
   ↓
任意操作失败：Rollback
全部操作成功：Commit
```

准备测试表：

```sql
CREATE TABLE accounts (
    id BIGINT PRIMARY KEY,
    owner VARCHAR(100) NOT NULL,
    balance_cents BIGINT NOT NULL
) ENGINE=InnoDB;

INSERT INTO accounts (id, owner, balance_cents)
VALUES
    (1, 'Tom', 100000),
    (2, 'Jerry', 50000);
```

完整事务示例：

```go
package main

import (
	"context"
	"database/sql"
	"errors"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

var ErrInsufficientBalance = errors.New("insufficient balance")
var ErrAccountNotFound = errors.New("account not found")

type TransferRequest struct {
	FromAccountID int64 `json:"from_account_id" binding:"required,gt=0"`
	ToAccountID   int64 `json:"to_account_id" binding:"required,gt=0,nefield=FromAccountID"`
	AmountCents   int64 `json:"amount_cents" binding:"required,gt=0"`
}

type TransferHandler struct {
	db *sql.DB
}

func NewTransferHandler(db *sql.DB) *TransferHandler {
	return &TransferHandler{
		db: db,
	}
}

func transfer(
	ctx context.Context,
	db *sql.DB,
	fromAccountID int64,
	toAccountID int64,
	amountCents int64,
) error {
	// 开启事务。事务中的所有操作会使用同一条数据库连接。
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	// 任意位置提前返回时自动尝试回滚。
	// 如果 Commit 已成功，Rollback 只会返回 sql.ErrTxDone。
	defer tx.Rollback()

	// 使用一条原子 UPDATE 同时完成余额检查和扣款。
	debitResult, err := tx.ExecContext(
		ctx,
		`UPDATE accounts
		 SET balance_cents = balance_cents - ?
		 WHERE id = ? AND balance_cents >= ?`,
		amountCents,
		fromAccountID,
		amountCents,
	)
	if err != nil {
		return err
	}

	debitRows, err := debitResult.RowsAffected()
	if err != nil {
		return err
	}
	if debitRows != 1 {
		// UPDATE 影响 0 行有两种可能：来源账户不存在，或者余额不足。
		// 继续在同一事务中检查账户是否存在，避免返回错误的业务语义。
		var marker int
		err := tx.QueryRowContext(
			ctx,
			"SELECT 1 FROM accounts WHERE id = ?",
			fromAccountID,
		).Scan(&marker)

		switch {
		case errors.Is(err, sql.ErrNoRows):
			return ErrAccountNotFound
		case err != nil:
			return err
		default:
			return ErrInsufficientBalance
		}
	}

	// 收款操作也必须使用 tx，而不是原来的 db。
	creditResult, err := tx.ExecContext(
		ctx,
		`UPDATE accounts
		 SET balance_cents = balance_cents + ?
		 WHERE id = ?`,
		amountCents,
		toAccountID,
	)
	if err != nil {
		return err
	}

	creditRows, err := creditResult.RowsAffected()
	if err != nil {
		return err
	}
	if creditRows != 1 {
		return ErrAccountNotFound
	}

	// 只有所有操作都成功，才提交事务。
	return tx.Commit()
}

func (h *TransferHandler) Create(c *gin.Context) {
	var req TransferRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request",
		})
		return
	}

	err := transfer(
		c.Request.Context(),
		h.db,
		req.FromAccountID,
		req.ToAccountID,
		req.AmountCents,
	)

	switch {
	case errors.Is(err, ErrInsufficientBalance):
		c.JSON(http.StatusConflict, gin.H{
			"error": "insufficient balance",
		})
		return

	case errors.Is(err, ErrAccountNotFound):
		c.JSON(http.StatusNotFound, gin.H{
			"error": "account not found",
		})
		return

	case err != nil:
		log.Printf("transfer failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "database error",
		})
		return
	}

	c.Status(http.StatusNoContent)
}

// 在 main 中复用前面已经创建并验证过的 *sql.DB。
func registerTransferRoutes(router *gin.Engine, db *sql.DB) {
	transferHandler := NewTransferHandler(db)
	router.POST("/transfers", transferHandler.Create)
}
```

测试转账：

```json
{
  "from_account_id": 1,
  "to_account_id": 2,
  "amount_cents": 20000
}
```

成功后：

```text
Tom:   80000
Jerry: 70000
```

关键点：

- 使用 `db.BeginTx(ctx, nil)` 开启事务。
- 开启事务后立即 `defer tx.Rollback()`，覆盖所有提前返回路径。
- 事务内只使用 `tx.QueryContext`、`tx.QueryRowContext` 或 `tx.ExecContext`。
- 使用带余额条件的原子 `UPDATE`，避免先查余额再扣款造成并发竞争。
- 使用 `RowsAffected()` 判断目标记录是否成功更新；扣款影响 0 行时，继续区分来源账户不存在和余额不足。
- 只有全部操作成功才调用 `tx.Commit()`。
- 客户端取消请求后，`c.Request.Context()` 可以取消事务中的数据库操作。
- 收款账户不存在时返回错误，延迟执行的 `Rollback` 会撤销已经完成的扣款。

GORM 中可以使用回调管理事务：

```go
err := gormDB.Transaction(func(tx *gorm.DB) error {
	// 返回 error：GORM 自动回滚。
	// 返回 nil：GORM 自动提交。
	return nil
})
```

官方资料：

- [Go：执行数据库事务](https://go.dev/doc/database/execute-transactions)
- [GORM：Transactions](https://gorm.io/docs/transactions.html)

### Context 与请求取消

::: warning 重点
`c.Request.Context()` 代表当前 HTTP 请求的生命周期。客户端断开连接或请求超过截止时间时，Context 会发出取消信号。数据库查询、外部 HTTP 请求和其他耗时操作都应该接收并监听这个 Context。
:::

需要区分两个类型：

- `*gin.Context`：Gin 提供，用来读取请求参数、调用中间件和返回响应。
- `context.Context`：Go 标准库提供，用来传递截止时间和取消信号。

不要使用 `context.Background()` 代替当前请求的 Context，否则客户端断开连接后，下游操作仍可能继续执行。

#### 请求超时中间件

```go
package main

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// TimeoutMiddleware 为当前请求设置最大处理时间。
func TimeoutMiddleware(timeout time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 从当前请求派生 Context，保留客户端断开连接的取消信号。
		ctx, cancel := context.WithTimeout(c.Request.Context(), timeout)
		defer cancel()

		// 将带有截止时间的新 Context 放回 HTTP 请求。
		c.Request = c.Request.WithContext(ctx)

		c.Next()
	}
}

func SlowHandler(c *gin.Context) {
	ctx := c.Request.Context()

	select {
	case <-time.After(3 * time.Second):
		// 模拟耗时操作正常完成。
		c.JSON(http.StatusOK, gin.H{
			"message": "completed",
		})

	case <-ctx.Done():
		// 超过服务器设置的截止时间时返回 504。
		if errors.Is(ctx.Err(), context.DeadlineExceeded) {
			c.JSON(http.StatusGatewayTimeout, gin.H{
				"error": "request timed out",
			})
		}

		// context.Canceled 通常表示客户端已经断开，
		// 此时直接结束，不再尝试写入响应。
		return
	}
}

func main() {
	router := gin.Default()

	// 该中间件只作用于 /slow，不影响其他接口。
	router.GET(
		"/slow",
		TimeoutMiddleware(1*time.Second),
		SlowHandler,
	)

	_ = router.Run(":8080")
}
```

访问 `/slow` 时，模拟任务需要三秒，但接口只允许执行一秒，因此大约一秒后返回：

```http
HTTP/1.1 504 Gateway Timeout
Content-Type: application/json

{"error":"request timed out"}
```

关键点：

- 使用 `context.WithTimeout` 设置请求截止时间，并始终调用 `cancel()` 释放相关资源。
- 使用 `select` 同时等待任务完成和 `ctx.Done()`。
- 不要只使用 `time.Sleep` 模拟可取消任务，因为 `time.Sleep` 不会监听 Context。
- 调用数据库时传入 `c.Request.Context()`，例如 `db.QueryContext`、`db.QueryRowContext` 和 `db.ExecContext`。
- 调用外部 HTTP 服务时使用 `http.NewRequestWithContext`。
- 不要把原始 `*gin.Context` 传给后台 Goroutine；后台任务应接收它实际需要的数据和合适的 `context.Context`。

官方资料：

- [Gin：Context](https://gin-gonic.com/zh-cn/docs/server-config/context/)
- [Go：Canceling in-progress operations](https://go.dev/doc/database/cancel-operations)

## 测试

### 使用 httptest 测试 Gin 接口

::: warning 重点
Gin 实现了 Go 标准库的 `http.Handler` 接口，因此测试接口时不需要启动真实端口。使用 `net/http/httptest` 可以直接向 Gin 路由发送模拟请求，并检查状态码、响应头和响应体。
:::

测试过程：

```text
httptest 创建请求 -> Gin 路由处理请求 -> ResponseRecorder 记录响应 -> 测试断言
```

被测试的程序 `main.go`：

```go
package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func PingHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "pong",
	})
}

// 把路由创建过程单独放在函数中，生产启动和测试都可以复用。
func setupRouter() *gin.Engine {
	router := gin.New()
	router.GET("/ping", PingHandler)
	return router
}

func main() {
	router := setupRouter()
	_ = router.Run(":8080")
}
```

测试文件 `main_test.go`：

```go
package main

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestPingHandler(t *testing.T) {
	// 测试模式会关闭普通的调试输出。
	gin.SetMode(gin.TestMode)

	router := setupRouter()

	// ResponseRecorder 用来记录 Handler 返回的响应。
	recorder := httptest.NewRecorder()

	// 创建模拟请求，不会访问真实网络，也不需要监听 8080 端口。
	request := httptest.NewRequest(http.MethodGet, "/ping", nil)

	// 让 Gin 处理模拟请求。
	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf(
			"期望状态码 %d，实际得到 %d",
			http.StatusOK,
			recorder.Code,
		)
	}

	expectedBody := `{"message":"pong"}`
	if recorder.Body.String() != expectedBody {
		t.Fatalf(
			"期望响应体 %s，实际得到 %s",
			expectedBody,
			recorder.Body.String(),
		)
	}
}
```

执行全部测试：

```bash
go test ./...
```

关键点：

- Go 测试文件必须以 `_test.go` 结尾。
- 测试函数名称必须以 `Test` 开头，并接收 `*testing.T`。
- `httptest.NewRequest` 创建模拟 HTTP 请求。
- `httptest.NewRecorder` 记录响应状态码、响应头和响应体。
- `router.ServeHTTP` 直接执行完整的 Gin 路由和中间件链。
- `gin.SetMode(gin.TestMode)` 适合测试环境，不要在每个生产 Handler 中调用。
- 将路由组装提取到 `setupRouter`，可以让生产启动代码和测试复用同一套路由配置。

官方资料：

- [Gin：Testing](https://gin-gonic.com/en/docs/testing/)
- [Go：httptest](https://pkg.go.dev/net/http/httptest)

## 部署

### 云平台部署方式

::: info 低优先级
Gin 应用可以部署到 Railway、Seenode、Koyeb、Qovery、Render、Google App Engine，也可以部署到自己的服务器。平台名单和具体操作会随服务商变化，不需要记忆；Gin 应用本质上是一个可执行的 HTTP 服务，选择平台不会改变 Handler、路由和中间件的写法。
:::

对于 RESTful 前后端分离项目，更值得掌握的是：

- 生产环境使用 `release` 模式。
- 通过环境变量注入端口和其他配置。
- 使用反向代理或云负载均衡器处理公网 TLS。
- 正确设置可信代理、服务器超时和优雅关闭。

官方资料：[Gin：部署](https://gin-gonic.com/zh-cn/docs/deployment/)

### 使用环境变量配置运行模式和端口

Gin 常用的运行模式：

| 模式      | 用途                         |
| --------- | ---------------------------- |
| `debug`   | 本地开发，输出路由等调试信息 |
| `release` | 生产运行，减少调试输出       |
| `test`    | 自动化测试                   |

生产环境通常通过环境变量设置运行模式和端口：

```powershell
$env:GIN_MODE = "release"
$env:PORT = "8090"
go run .
```

要让 Gin 自动读取 `PORT`，调用 `Run` 时不要显式传入端口：

```go
package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()

	router.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "pong",
		})
	})

	// 设置 PORT 时使用该端口；未设置时默认使用 8080。
	if err := router.Run(); err != nil {
		log.Fatalf("start server failed: %v", err)
	}
}
```

测试完成后，可以删除当前 PowerShell 会话中的环境变量：

```powershell
Remove-Item Env:GIN_MODE
Remove-Item Env:PORT
```

关键点：

- 环境变量属于运行配置，不需要为了不同环境修改 Handler。
- `router.Run()` 会读取 `PORT`；显式传入地址时，以传入的地址为准。
- 本地开发通常使用 `debug`，生产环境使用 `release`，测试代码使用 `test`。
- 更复杂的生产服务仍可使用前面学过的自定义 `http.Server` 设置超时和优雅关闭。

## 构建标签

### 使用构建标签调整 Gin

::: info 低优先级
构建标签只改变 Gin 在编译时采用的内部实现，不改变路由、Handler 和中间件代码。它主要用于性能优化或缩小少量二进制体积，项目早期不需要专门调整。
:::

Gin 支持的常见构建标签：

| 标签        | 作用                                                           |
| ----------- | -------------------------------------------------------------- |
| `go_json`   | 使用 go-json 代替标准 JSON 编码器                              |
| `jsoniter`  | 使用 jsoniter 代替标准 JSON 编码器                             |
| `sonic`     | 使用 Sonic 代替默认 JSON 编码器，需要确认目标平台和 CPU 兼容性 |
| `nomsgpack` | 移除 MsgPack 绑定与渲染支持，稍微减小二进制体积                |

普通构建：

```powershell
go build -o gin-study.exe .
```

如果项目只使用 JSON，不使用 `c.MsgPack()`，可以构建不包含 MsgPack 的版本：

```powershell
go build -tags=nomsgpack -o gin-study-nomsgpack.exe .
```

构建标签也可以用于运行和测试：

```powershell
go run -tags=nomsgpack .
go test -tags=nomsgpack ./...
```

多个标签可以组合：

```powershell
go build -tags=nomsgpack,go_json .
```

关键点：

- 如果项目不使用 MsgPack，`nomsgpack` 不会影响 JSON、XML、YAML、TOML 和 ProtoBuf。
- 不要因为“可能更快”就直接更换 JSON 编码器；应先进行基准测试，确认 JSON 编码确实是性能瓶颈。
- Gin v1.12.0 使用 `sonic` 构建标签启用 Sonic，没有单独的 Gin `avx` 构建标签；启用前仍需确认目标平台和 CPU 兼容性。
- 对普通 RESTful 项目，默认构建方式通常已经足够。

官方资料：

- [Gin：Build Tags](https://gin-gonic.com/en/docs/build-tags/)
- [Gin：Build without MsgPack](https://gin-gonic.com/en/docs/build-tags/nomsgpack/)

## 基准测试

### Gin 路由性能报告

::: info 低优先级
这一章展示的是 Gin 路由器与其他 Go Web 路由器的性能对比，用来说明 Gin 的路由速度和内存分配表现。它不是日常开发必须调用的 Gin API，也不能直接代表包含数据库和外部服务的完整业务接口性能。
:::

常见指标：

| 指标        | 含义                         | 判断方式 |
| ----------- | ---------------------------- | -------- |
| `ns/op`     | 每次操作平均消耗的纳秒数     | 越低越好 |
| `B/op`      | 每次操作平均分配的内存字节数 | 越低越好 |
| `allocs/op` | 每次操作发生的内存分配次数   | 越低越好 |

Gin 官方在 2026 年 3 月使用 Gin v1.12.0 和 Go 1.25.8 进行的 GitHub API 路由基准测试中，一次匹配全部 203 条路由的结果约为：

```text
9,944 ns/op
0 B/op
0 allocs/op
```

这说明 Gin 的路由匹配速度很快，而且该测试场景没有产生堆内存分配。

阅读基准测试时需要注意：

- 必须在相同硬件、Go 版本、框架版本和测试用例下比较结果。
- `ns/op` 只表示被测操作的耗时，不等于一次真实 HTTP 请求的完整延迟。
- 路由测试通常不包含数据库查询、网络调用、JSON 编解码和业务逻辑。
- 不同框架可能基于不同的 HTTP 实现，跨框架数字需要谨慎比较。
- 在真实 RESTful 项目中，数据库、缓存和外部服务通常比路由匹配更容易成为性能瓶颈。
- 只有发现明确的性能问题后，才需要针对自己的 Handler、Service 或 Repository 编写基准测试并进行优化。

官方资料：[Gin：基准测试](https://gin-gonic.com/zh-cn/docs/benchmarks/)
