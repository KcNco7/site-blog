# AJAX

AJAX 通常指页面不发生整体导航的情况下，由浏览器客户端通过 JavaScript 向服务器发送 HTTP 请求、处理响应，并根据需要更新界面。（例如：搜索框输入内容后的关键词联想。）

核心：异步请求数据，按需更新页面，而不进行整页刷新。

::: info ajax fetch axios这三个是什么关系 有什么区别
AJAX 是一种 Web 开发方式；Fetch 是浏览器原生请求 API，Axios 是第三方 HTTP 客户端，应根据项目环境和功能需求选择。

Fetch 是**浏览器内置**的请求 API，不需要额外安装。它是处理 HTTP 请求的现代原生方案之一，在多数常规请求中可以替代较早出现的 `XMLHttpRequest`；需要上传进度监听等特定能力时，XHR 仍有使用场景。Fetch 基于 Promise，能让异步流程更容易组合，但不合理的嵌套仍可能使代码难以维护。**优点**：不用引入外部库。**注意**：收到 404、500 等 HTTP 响应时，Fetch 的请求 Promise 仍可能正常兑现，需要自行检查响应状态。

Axios 是一个需要额外引入的、基于 Promise 的 HTTP 客户端，可以通过包管理器安装，也可以通过 CDN 脚本加载。它通过适配器在不同环境中发送请求，并提供数据转换、拦截器、超时和取消等功能。
**优点**：

1. 写起来更简单。
2. 它会自动处理 JSON 转换。
3. 默认情况下，Axios 会让 2xx 之外的 HTTP 响应进入拒绝分支；该范围可以通过 `validateStatus` 配置，但业务错误仍需自行处理。
   :::

## 原生 AJAX —— XMLHttpRequest (XHR)

```javascript
// 1. 创建 XMLHttpRequest 对象
const xhr = new XMLHttpRequest();

// 2. 初始化请求 (设置请求方法和 URL)
// 这里的 URL 使用公共测试 API：https://jsonplaceholder.typicode.com/users
xhr.open("GET", "https://jsonplaceholder.typicode.com/users");

// 3. 指定按 JSON 解析响应
xhr.responseType = "json";

// 4. 监听状态变化（这里只演示 readyState，完整事件处理见下文）
xhr.onreadystatechange = function () {
  if (xhr.readyState !== 4) return;

  // 网络错误、CORS 失败等情况可能没有可用的 HTTP 状态码，
  // 此时 status 可能为 0，交给 error 事件处理。
  if (xhr.status === 0) return;

  if (xhr.status >= 200 && xhr.status < 300) {
    console.log(xhr.response);
  } else {
    console.error(`HTTP 状态码：${xhr.status}`);
  }
};

// 5. 单独处理网络错误或请求被浏览器阻止的情况
xhr.addEventListener("error", () => {
  console.error("网络错误或跨源请求被阻止");
});

// 6. 发送请求
xhr.send();
```

### 关键点解析

- **`readyState`**：XHR 客户端当前所处的状态（0 到 4）。
  - 0（`UNSENT`）：XHR 对象已经创建，但尚未调用 `open()`。
  - 1（`OPENED`）：已经调用 `open()`；这不代表已经与服务器建立连接。
  - 2（`HEADERS_RECEIVED`）：已经收到响应状态和响应头。
  - 3（`LOADING`）：正在接收响应体，部分响应数据可能已经可用。
  - 4（`DONE`）：请求过程已经结束；成功与否仍需检查 HTTP 状态和相关错误事件。
- **`status`**：HTTP 状态码（200 成功，404 未找到，500 服务器错误）。
- **`JSON.parse()`**：响应可能是 JSON、普通文本、二进制数据或空内容；只有拿到尚未解析的有效 JSON 文本并需要作为 JavaScript 数据处理时，才使用 `JSON.parse()`。设置 `responseType = "json"` 后应读取 `xhr.response`。

### XHR 事件与响应类型补充

除了监听 `readystatechange`，还可以分别监听 `load`、`error`、`timeout` 和 `abort`，让成功、网络错误、超时和主动取消的处理职责更加清楚。设置 `responseType = "json"` 后，浏览器会尝试把 JSON 响应解析到 `response` 中：

```js
const request = new XMLHttpRequest();

request.open("GET", "/api/users");
request.responseType = "json";
request.timeout = 10_000;

request.addEventListener("load", () => {
  if (request.status >= 200 && request.status < 300) {
    console.log(request.response);
  } else {
    console.error(`HTTP 状态码：${request.status}`);
  }
});

request.addEventListener("error", () => {
  console.error("网络错误");
});

request.addEventListener("timeout", () => {
  console.error("请求超时");
});

request.addEventListener("abort", () => {
  console.log("请求已取消");
});

request.send();
```

## 现代标准 —— Fetch API

原生 XHR 通常需要通过多个事件回调处理响应、网络错误、超时和取消。浏览器原生的 **Fetch API** 基于 Promise，更便于组合异步流程。

### 1. GET 请求

```javascript
fetch("https://jsonplaceholder.typicode.com/users")
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  })
  .then((data) => {
    // 这里拿到的是解析后的 JS 对象
    console.log(data);
  })
  .catch((error) => {
    console.error("请求失败:", error);
  });
```

::: warning Fetch 的 HTTP 状态检查
`fetch()` 返回的 Promise 在收到 `404`、`500` 等 HTTP 响应时仍可能正常兑现；只有网络错误、无效 URL、请求被取消等情况才会使请求 Promise 拒绝。因此，每个 Fetch 请求都应在读取响应体前检查 `response.ok` 或 `response.status`，不仅限于 `async/await` 示例。
:::

### 2. async/await 写法（推荐）

`async/await` 适合表达具有明确先后关系的异步流程，阅读顺序通常更接近同步代码。

```javascript
async function getUsers() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/users");

    // 检查响应是否成功 (Fetch 不会自动把 404/500 当作错误抛出，需要手动检查)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error("出错了:", error);
  }
}

getUsers();
```

### 3. POST 请求（发送数据）

前端不仅要“读”数据，还要“写”数据（比如提交表单）。

```javascript
async function createUser() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/users", {
      method: "POST", // 指定方法
      headers: {
        "Content-Type": "application/json", // 告诉服务器发的是 JSON
      },
      body: JSON.stringify({
        name: "张三",
        username: "zhangsan",
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (response.status === 204 || response.status === 205) {
      console.log("创建成功，无响应体");
      return;
    }

    const contentType = response.headers.get("content-type") ?? "";
    const mediaType = contentType.split(";", 1)[0].trim().toLowerCase();
    const isJSON =
      mediaType === "application/json" || mediaType.endsWith("+json");

    if (!isJSON) {
      throw new TypeError("响应不是 JSON");
    }

    const data = await response.json();
    console.log("服务器返回:", data);
  } catch (error) {
    console.error(error);
  }
}
```

### 4. 响应体读取与通用封装

`response.json()`、`response.text()`、`response.blob()` 等方法都是异步操作。响应体通常只能读取一次；如果同一响应确实需要被读取多次，应在读取前使用 `response.clone()`。当响应内容不是合法 JSON 时，`response.json()` 也会拒绝。

```js
async function fetchJSON(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`HTTP 状态码：${response.status}`);
  }

  const method = (options.method ?? "GET").toUpperCase();

  if (
    response.status === 204 ||
    response.status === 205 ||
    method === "HEAD"
  ) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const mediaType = contentType.split(";", 1)[0].trim().toLowerCase();
  const isJSON =
    mediaType === "application/json" || mediaType.endsWith("+json");

  if (!isJSON) {
    throw new TypeError("响应不是 JSON");
  }

  return response.json();
}
```

### 5. 使用 AbortController 取消请求

将 `AbortSignal` 传给 `fetch()` 后，可以主动取消请求，也可以结合定时器实现超时控制：

```js
async function fetchWithTimeout(url, timeout = 10_000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new DOMException("请求超时", "TimeoutError"));
  }, timeout);

  try {
    return await fetchJSON(url, {
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
```

调用 `controller.abort()` 主动取消请求时，相关 Promise 通常会以 `AbortError` 拒绝。上面的超时逻辑为中止操作提供了 `TimeoutError` 原因，因此调用方可以区分超时、主动取消和其他失败。

---

## 示例：把数据放到页面上

**场景**：点击按钮，获取用户列表并显示在 `ul` 中。

**HTML**:

```html
<button id="btn">获取用户列表</button>
<ul id="list"></ul>
```

**JavaScript**:

```javascript
const btn = document.getElementById("btn");
const list = document.getElementById("list");

if (!(btn instanceof HTMLButtonElement) || !(list instanceof HTMLUListElement)) {
  throw new Error("页面缺少获取按钮或用户列表");
}

btn.addEventListener("click", async () => {
  // 1. 改变按钮文字，提示正在加载
  btn.textContent = "加载中...";
  btn.disabled = true;

  try {
    // 2. 发送请求
    const response = await fetch("https://jsonplaceholder.typicode.com/users");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const users = await response.json();

    if (
      !Array.isArray(users) ||
      !users.every((user) => typeof user?.name === "string")
    ) {
      throw new TypeError("用户列表格式不正确");
    }

    // 3. 清空列表
    list.innerHTML = "";

    // 4. 遍历数据，创建 DOM 节点
    users.forEach((user) => {
      const li = document.createElement("li");
      li.textContent = user.name; // 假设只展示名字
      list.appendChild(li);
    });
  } catch (error) {
    list.innerHTML = '<li style="color:red">数据加载失败</li>';
  } finally {
    // 5. 恢复按钮状态
    btn.textContent = "获取用户列表";
    btn.disabled = false;
  }
});
```

## 进阶与常见坑

掌握了基本的读写后，你需要了解以下几个现实开发中必须面对的问题。

### 1. JSON 格式

- **传输格式**：HTTP 请求体和响应体可以承载 JSON、普通文本、表单、文件、二进制数据或空内容，应根据接口约定和内容类型处理。
- **JSON 操作流程**：
  - 发送 JSON：JavaScript 对象 -> `JSON.stringify()` -> JSON 文本 -> 发给服务器。
  - 接收 JSON：收到 JSON 响应 -> `response.json()`、`JSON.parse()` 或相应客户端的解析能力 -> JavaScript 值。

### 2. 跨域问题

页面请求不同源地址属于跨源请求。浏览器会依据同源策略和服务器返回的 CORS 响应头，决定页面 JavaScript 能否读取响应；部分请求可能已经发送到服务器，并非所有跨源请求都会被浏览器直接阻止。

- **解决方案**：
  1.  **后端解决**：后端设置 CORS 头（最常见）。
  2.  **前端开发环境**：使用代理（如 Webpack/Vite 的 proxy 配置）。

#### CORS 与凭据补充

对于符合条件的简单跨域请求，浏览器可能先发送请求，再根据响应中的 CORS 头决定是否允许页面 JavaScript 读取响应；需要预检的请求则会先发送 `OPTIONS` 请求。

Fetch 默认只在同源请求中携带凭据。跨域请求需要携带 Cookie 等凭据时，可以设置：

```js
fetch("https://api.example.com/profile", {
  credentials: "include",
});
```

此时服务器还必须返回允许凭据的 CORS 响应头，并为 `Access-Control-Allow-Origin` 指定明确的来源，不能使用 `*`。

开发服务器代理会让浏览器向同源开发服务器发出请求，再由代理转发到目标服务；它适合本地开发，但不会自动解决生产环境的跨域配置。生产环境仍需要正确配置服务端 CORS，或使用自己控制的后端代理。

### 3. 交互优化

- **加载状态**：请求时显示 Loading 图标/文字，请求结束隐藏。
- **错误处理**：网断了怎么办？服务器崩了怎么办？不要只写 `console.log`，要在页面上给用户提示（比如使用 Toast 或 Modal）。
- **防抖**：搜索框输入联想等高频交互可能产生大量无效请求，并带来服务器压力和响应顺序问题。可以在用户停止输入一段时间后再发送请求；具体延迟应根据交互体验和接口成本确定。

## Axios

Fetch 与 Axios 都是常见的 HTTP 请求方案。Axios 是第三方、基于 Promise 的 HTTP 客户端，是否采用应根据目标平台、团队约定和所需功能决定。

- **常见能力：**
  - 浏览器兼容范围取决于所用 Axios 版本；面向旧环境时，还应核对所需的 JavaScript 与 Web API polyfill。
  - 自动转换 JSON 数据（不需要手动写 `response.json()`）。
  - 请求和响应拦截器（统一处理 Token、错误码）。
  - 支持通过 `AbortController` 显式取消请求。
  - 可以配合 `Promise.all()` 等标准 Promise API 组织并发请求；并发能力并非 Axios 独有。

### 安装、导入与响应结构

通过包管理器安装后，可以在模块中导入 Axios：

```bash
npm install axios
```

```js
import axios from "axios";
```

如果页面使用经典 `<script>` 标签加载 Axios 的 UMD 构建，全局变量 `axios` 通常会直接存在；通过 ESM CDN 加载时，则需要使用 `import` 显式导入。

Axios 兑现请求 Promise 时返回的是响应对象，常用字段包括：

- `data`：服务器返回的数据。
- `status`：HTTP 状态码。
- `headers`：响应头。
- `config`：本次请求使用的配置。
- `request`：底层请求对象。

```js
async function getCities() {
  const response = await axios.get("/api/cities", {
    params: {
      province: "辽宁省",
    },
  });

  console.log(response.data);
  console.log(response.status);
}
```

### 取消请求需要显式操作

Axios 支持使用 `AbortController` 取消请求，但不会自动判断并取消重复请求。需要由调用方保存控制器并在合适的时机调用 `abort()`：

```js
const controller = new AbortController();

const request = axios.get("/api/users", {
  signal: controller.signal,
});

controller.abort();

request.catch((error) => {
  if (error.code === "ERR_CANCELED") {
    console.log("请求已取消");
    return;
  }

  console.error("请求失败", error);
});
```

### Axios 请求示例

```html
<p id="city-list"></p>

<form id="register-form">
  <label>
    用户名
    <input id="username" name="username" autocomplete="username" required />
  </label>
  <label>
    密码
    <input
      id="password"
      name="password"
      type="password"
      autocomplete="new-password"
      required
    />
  </label>
  <button type="submit">注册</button>
</form>

<p id="register-status" role="status" aria-live="polite"></p>
<p class="my-p"></p>
```

```javascript
const cityOutput = document.querySelector("#city-list");
const registerForm = document.querySelector("#register-form");
const usernameInput = document.querySelector("#username");
const passwordInput = document.querySelector("#password");
const registerStatus = document.querySelector("#register-status");

axios({
  url: "https://hmajax.itheima.net/api/city",
  params: {
    pname: "辽宁省",
  },
})
  .then((result) => {
    if (!(cityOutput instanceof HTMLElement)) return;

    const cities = result?.data?.list;

    if (!Array.isArray(cities)) {
      throw new TypeError("城市列表格式不正确");
    }

    cityOutput.replaceChildren();

    cities.forEach((city, index) => {
      if (index > 0) {
        cityOutput.append(document.createElement("br"));
      }

      cityOutput.append(document.createTextNode(String(city)));
    });
  })
  .catch((error) => {
    console.error("城市列表加载失败", error);

    if (cityOutput instanceof HTMLElement) {
      cityOutput.textContent = "城市列表加载失败，请稍后重试。";
    }
  });

if (
  registerForm instanceof HTMLFormElement &&
  usernameInput instanceof HTMLInputElement &&
  passwordInput instanceof HTMLInputElement &&
  registerStatus instanceof HTMLElement
) {
  registerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    registerStatus.textContent = "";

    axios({
      url: "https://hmajax.itheima.net/api/register",
      method: "post",
      data: {
        username: usernameInput.value,
        password: passwordInput.value,
      },
    })
      .then((result) => {
        console.log(result);
        registerStatus.textContent = "注册成功。";
      })
      .catch((error) => {
        console.error("注册失败", error);
        registerStatus.textContent = "注册失败，请检查输入后重试。";
      });
  });
}
```

### 错误对象与安全渲染

Axios 请求失败时，可以根据错误对象区分“服务器返回了非预期状态码”“请求已发出但没有收到响应”和“创建请求时发生错误”：

```js
async function demonstrateAxiosErrorHandling() {
  try {
    await axios.get("/api/users");
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error("服务器响应错误", error.response.status);
      } else if (error.request) {
        console.error("未收到服务器响应");
      } else {
        console.error("请求配置错误", error.message);
      }
    } else {
      throw error;
    }
  }
}

demonstrateAxiosErrorHandling().catch((error) => {
  console.error("未预期的错误", error);
});
```

把接口返回的数据直接拼接后赋给 `innerHTML` 可能带来 XSS 风险。展示普通文本时，应优先创建 DOM 节点并设置 `textContent`：

```js
const container = document.querySelector("p");
const cities = ["沈阳市", "大连市"];

if (container instanceof HTMLElement) {
  container.replaceChildren();

  cities.forEach((city) => {
    const line = document.createElement("span");
    line.textContent = city;
    container.append(line, document.createElement("br"));
  });
}
```

线上页面还应优先使用 HTTPS 接口，避免 HTTPS 页面请求 HTTP 资源时被浏览器作为混合内容阻止。

### 用 XHR 与 Promise 演示简易封装

```javascript
/**
 * 目标：封装_简易axios函数_获取省份列表
 *  1. 定义myAxios函数，接收配置对象，返回Promise对象
 *  2. 发起GET请求并支持配置超时时间
 *  3. 调用成功/失败的处理程序
 *  4. 使用myAxios函数，获取省份列表展示
 */
// 1. 定义myAxios函数，接收配置对象，返回Promise对象
function myAxios(config) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const method = (config.method ?? "GET").toUpperCase();

    if (method !== "GET") {
      reject(new TypeError("这个简易封装只支持 GET 请求"));
      return;
    }

    xhr.open("GET", config.url);
    xhr.timeout = config.timeout ?? 10_000;

    xhr.addEventListener("load", () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(xhr.responseText || `HTTP 状态码：${xhr.status}`));
        return;
      }

      if (
        xhr.status === 204 ||
        xhr.status === 205 ||
        xhr.responseText === ""
      ) {
        resolve(null);
        return;
      }

      try {
        resolve(JSON.parse(xhr.responseText));
      } catch (error) {
        reject(error);
      }
    });

    xhr.addEventListener("error", () => {
      reject(new TypeError("网络错误"));
    });

    xhr.addEventListener("timeout", () => {
      reject(new DOMException("请求超时", "TimeoutError"));
    });

    xhr.addEventListener("abort", () => {
      reject(new DOMException("请求已取消", "AbortError"));
    });

    xhr.send();
  });
}

// 4. 使用myAxios函数，获取省份列表展示
myAxios({
  url: "https://hmajax.itheima.net/api/province",
})
  .then((result) => {
    console.log(result);

    const output = document.querySelector(".my-p");

    if (!(output instanceof HTMLElement)) return;

    const provinces = result?.list;

    if (!Array.isArray(provinces)) {
      throw new TypeError("省份列表格式不正确");
    }
    output.replaceChildren();

    provinces.forEach((province, index) => {
      if (index > 0) {
        output.append(document.createElement("br"));
      }

      output.append(document.createTextNode(String(province)));
    });
  })
  .catch((error) => {
    console.log(error);

    const output = document.querySelector(".my-p");

    if (output instanceof HTMLElement) {
      output.textContent =
        error instanceof Error ? error.message : "请求失败，请稍后重试。";
    }
  });
```

### 简易封装的适用边界

上面的 `myAxios()` 用于演示“XHR 加 Promise”的基本思路，并不等同于完整 Axios。它目前只支持 GET 请求，尚未处理查询参数、请求体、请求头、供调用方使用的取消接口、拦截器和多种响应类型等能力。

`load` 触发后仍需检查 HTTP 状态码；网络错误、超时和取消分别通过对应事件拒绝 Promise。JSON 解析放在 `try...catch` 中，解析失败时显式调用 `reject()`。

## Axios 二次封装

```javascript
import axios from "axios";

const service = axios.create({
  baseURL: "/api",
  allowAbsoluteUrls: false,
});

// 请求拦截器
service.interceptors.request.use((config) => {
  return config;
});

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  },
);
```

### 为什么要创建独立实例

`axios.create()` 会返回一个具有独立默认配置和独立拦截器的 Axios 实例。项目同时访问多个后端服务时，可以为每个服务分别创建实例，避免把接口地址、身份凭据和拦截逻辑混在全局 Axios 对象上。

实例配置可以集中定义 `baseURL`、`timeout`、请求头等选项。配置合并时，Axios 库默认值的优先级最低，其次是实例默认值，单次请求传入的配置优先级最高。

```js
const api = axios.create({
  baseURL: "/api",
  allowAbsoluteUrls: false,
  timeout: 10_000,
});

async function getUsers() {
  // 本次请求单独使用 20 秒超时，会覆盖实例的默认值。
  const response = await api.get("/users", {
    timeout: 20_000,
  });

  return response.data;
}
```

使用相对路径形式的 `baseURL`，可以让浏览器沿用当前页面的协议和域名；如果前后端分属不同域名，则应填写可信的 HTTPS 接口地址，并同时正确配置服务端 CORS。调用时还应只传入相对 URL，并验证最终请求地址；`allowAbsoluteUrls: false` 可以防止绝对 URL 直接覆盖实例的 `baseURL`。

### 请求拦截器的职责

请求拦截器适合统一追加认证信息、语言、请求标识等配置。成功回调必须返回 `config` 或一个最终兑现为 `config` 的 Promise，否则请求链无法继续。

```js
service.interceptors.request.use(
  (config) => {
    const requestURL = config.url ?? "";
    const isExternalURL = /^(?:[a-z][a-z\d+\-.]*:)?\/\//i.test(requestURL);

    if (isExternalURL) {
      throw new Error("该 Axios 实例只允许传入相对 URL");
    }

    const trustedBaseURL = new URL(
      service.defaults.baseURL ?? "/",
      window.location.origin,
    );
    const finalURL = new URL(service.getUri(config), window.location.origin);
    const trustedPath = `${trustedBaseURL.pathname.replace(/\/+$/, "")}/`;
    const isTrustedTarget =
      finalURL.origin === trustedBaseURL.origin &&
      (finalURL.pathname === trustedBaseURL.pathname ||
        finalURL.pathname.startsWith(trustedPath));

    if (!isTrustedTarget) {
      throw new Error("请求目标超出了该 Axios 实例的 baseURL 范围");
    }

    const token = sessionStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);
```

携带令牌的实例应限制在可信的 `baseURL` 范围内，不要把认证头设置到会访问第三方域名的全局 Axios 默认配置中。

`sessionStorage` 只能让令牌在当前标签页会话中保存，并不能防御 XSS：同源 JavaScript 仍然可以读取其中的数据。认证方案应结合实际威胁模型选择；如果改用带有 `HttpOnly`、`Secure` 和合适 `SameSite` 属性的 Cookie，还需要同时设计 CSRF 防护。

### 响应拦截器决定调用方收到什么

响应成功回调返回 `response` 时，调用方得到完整响应对象；如果改为返回 `response.data`，调用方便可直接取得业务数据，但整个项目必须保持一致，否则同一实例的返回值结构会前后不一。

```js
service.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      console.error("接口响应错误", error.response.status);
    } else if (error.request) {
      console.error("请求已发出，但没有收到响应");
    } else {
      console.error("创建请求时发生错误", error.message);
    }

    return Promise.reject(error);
  },
);
```

错误回调若不能真正恢复请求，应继续抛出错误或返回被拒绝的 Promise，避免把失败请求伪装成成功结果。

### 导出并调用封装后的实例

通常把实例放在单独模块中并默认导出，业务模块只通过该实例发起请求：

```js
// request.js
export default service;
```

```js
// user-api.js
import service from "./request.js";

export async function getUsers() {
  const response = await service.get("/users", {
    params: {
      page: 1,
    },
  });

  return response;
}
```

如果响应拦截器已经统一返回 `response.data`，这里就应直接返回 `response`，不要再次读取 `.data`。

### 拦截器的注册与移除

`use()` 会返回拦截器编号，可以用 `eject()` 移除。测试、热更新或组件反复挂载的环境中，应避免重复注册同一个拦截器：

```js
const interceptorId = service.interceptors.request.use((config) => config);

service.interceptors.request.eject(interceptorId);
```
