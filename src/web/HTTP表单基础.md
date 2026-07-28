# HTTP 表单基础

学习 Gin 的 `PostForm`、`FormFile` 和文件上传之前，需要先理解 HTTP 请求体与 HTML 表单的基本知识。

## 1. HTTP 请求的组成

一个 HTTP 请求主要包含：

```text
请求方法 + URL + 请求头 + 请求体
```

例如：

```http
POST /login HTTP/1.1
Host: localhost:8080
Content-Type: application/x-www-form-urlencoded

username=tom&password=123456
```

其中：

- `POST /login`：请求方法和路径。
- `Content-Type`：告诉服务器请求体采用什么格式。
- 空行之后的内容：请求体。

Gin 会根据 `Content-Type` 判断应该如何解析请求体。

## 2. Content-Type

`Content-Type` 描述当前请求体中的数据格式。

常见类型：

| Content-Type | 请求体内容 |
| --- | --- |
| `application/json` | JSON 数据 |
| `application/x-www-form-urlencoded` | 普通表单字段 |
| `multipart/form-data` | 普通字段和文件 |
| `text/plain` | 普通文本 |

### Content-Type 与 Accept 的区别

```text
Content-Type：我发送的数据是什么格式。
Accept：我希望服务器返回什么格式。
```

例如：

```http
Content-Type: application/json
Accept: application/json
```

表示请求体是 JSON，同时希望服务器也返回 JSON。

## 3. HTML form

一个普通的 HTML 表单：

```html
<form action="/login" method="post">
  <input type="text" name="username">
  <input type="password" name="password">
  <button type="submit">登录</button>
</form>
```

需要理解的属性：

| 属性 | 作用 |
| --- | --- |
| `action` | 表单提交到哪个 URL |
| `method` | 使用 GET 还是 POST |
| `name` | 字段提交给服务器时使用的名字 |
| `enctype` | 表单请求体的编码格式 |

例如：

```html
<input name="username" value="tom">
```

服务器收到的字段是：

```text
username=tom
```

如果输入控件没有 `name`，它通常不会作为表单字段提交。

## 4. application/x-www-form-urlencoded

这是普通 HTML 表单默认使用的编码格式，适合提交文本字段。

表单：

```html
<form action="/login" method="post">
  <input name="username" value="tom">
  <input name="password" value="123456">
</form>
```

请求体大致是：

```text
username=tom&password=123456
```

它的格式与 URL 查询字符串类似，但数据所在的位置不同：

```text
查询字符串：位于 URL 的 ? 后面。
表单数据：位于 HTTP 请求体中。
```

例如：

```text
查询字符串：/login?username=tom&password=123456
表单请求体：username=tom&password=123456
```

Gin 读取表单字段：

```go
username := c.PostForm("username")
password := c.PostForm("password")
```

curl 测试：

```powershell
curl.exe -X POST http://localhost:8080/login `
  -d "username=tom&password=123456"
```

`curl -d` 默认以 URL-encoded 表单方式发送数据。

### URL 编码

特殊字符不能直接放入查询字符串或 URL-encoded 请求体时，需要进行编码。

例如：

| 原内容 | 编码结果 |
| --- | --- |
| 空格 | `+` 或 `%20` |
| `&` | `%26` |
| 中文“张三” | `%E5%BC%A0%E4%B8%89` |

浏览器、curl 和 Gin 通常会自动完成编码与解码。

## 5. multipart/form-data

URL-encoded 格式适合文本字段，但不适合图片、视频和压缩包等文件。

上传文件时，需要使用 `multipart/form-data`，它会把请求体拆分成多个部分，每个部分可以是普通字段或文件。

HTML 表单必须指定 `enctype`：

```html
<form
  action="/upload"
  method="post"
  enctype="multipart/form-data"
>
  <input type="text" name="description">
  <input type="file" name="file">
  <button type="submit">上传</button>
</form>
```

请求头大致是：

```http
Content-Type: multipart/form-data; boundary=----ABC123
```

请求体大致是：

```text
------ABC123
Content-Disposition: form-data; name="description"

头像
------ABC123
Content-Disposition: form-data; name="file"; filename="avatar.png"
Content-Type: image/png

这里是图片的二进制内容
------ABC123--
```

`boundary` 是分隔符，用来区分请求体中的不同字段和文件。通常由浏览器或 curl 自动生成，不需要手写。

Gin 中读取普通字段和文件：

```go
description := c.PostForm("description")
file, err := c.FormFile("file")
```

curl 测试：

```powershell
curl.exe -X POST http://localhost:8080/upload `
  -F "description=头像" `
  -F "file=@D:\images\avatar.png"
```

`curl -F` 表示发送 `multipart/form-data`。

使用 `curl -F` 时，不要手动设置下面的请求头：

```text
Content-Type: multipart/form-data
```

因为 curl 还需要自动生成并添加正确的 `boundary`。

## 6. 两种表单格式的区别

| 对比项 | application/x-www-form-urlencoded | multipart/form-data |
| --- | --- | --- |
| 普通文本 | 支持 | 支持 |
| 文件 | 不适合 | 支持 |
| 请求体结构 | `a=1&b=2` | 多个独立部分 |
| HTML 默认格式 | 是 | 否，需要设置 `enctype` |
| curl 参数 | `-d` | `-F` |
| Gin 普通字段 | `PostForm` | `PostForm` |
| Gin 文件 | 不适用 | `FormFile` |

## 7. 表单与 JSON 的区别

JSON 请求：

```http
POST /login HTTP/1.1
Content-Type: application/json

{
  "username": "tom",
  "password": "123456"
}
```

JSON 请求体不能使用 `PostForm` 读取，通常使用结构体和 `ShouldBindJSON`：

```go
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

var req LoginRequest
if err := c.ShouldBindJSON(&req); err != nil {
	// 处理参数错误
}
```

可以这样选择：

```text
普通 HTML 表单  → PostForm
包含文件的表单  → PostForm + FormFile
前后端 JSON API → ShouldBindJSON
```

## 8. Gin 常用读取方法

| 数据位置或格式 | Gin 方法 |
| --- | --- |
| URL 路径参数 | `c.Param()` |
| URL 查询参数 | `c.Query()`、`c.DefaultQuery()` |
| 普通表单字段 | `c.PostForm()`、`c.DefaultPostForm()` |
| 单个上传文件 | `c.FormFile()` |
| 整个 Multipart 表单 | `c.MultipartForm()` |
| JSON 请求体 | `c.ShouldBindJSON()` |

## 9. 建议学习顺序

1. HTTP 请求的 URL、Header 和 Body。
2. `Content-Type` 与 `Accept`。
3. HTML `<form>` 的 `method`、`action`、`name` 和 `enctype`。
4. URL 编码和查询字符串。
5. `application/x-www-form-urlencoded`。
6. `multipart/form-data`。
7. curl 的 `-d` 与 `-F`。
8. Gin 的 `Query`、`PostForm`、`FormFile` 和 `ShouldBindJSON`。

现阶段不需要深入学习 MIME 完整规范、boundary 的完整语法和 HTTP 分块传输。

## 10. 一句话总结

`Content-Type` 告诉服务器如何解释请求体：普通文本表单通常使用 `application/x-www-form-urlencoded`，包含文件的表单使用 `multipart/form-data`，前后端 API 则经常使用 `application/json`。
