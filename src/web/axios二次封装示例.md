# axios二次封装示例

```typescript
// types/api.ts
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}
```

```typescript
// utils/request.ts
import axios, {
  type AxiosRequestConfig,
  type AxiosResponse
} from 'axios'
import type { ApiResponse } from '@/types/api'

type RequestErrorKind =
  | 'business'
  | 'protocol'
  | 'http'
  | 'network'
  | 'timeout'
  | 'canceled'
  | 'configuration'
  | 'unknown'

class ApiError extends Error {
  constructor(
    message: string,
    public readonly kind: RequestErrorKind,
    public readonly status?: number,
    public readonly code?: string | number,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readMessage(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined
  return typeof value.message === 'string' ? value.message : undefined
}

function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  return (
    isRecord(value) &&
    typeof value.code === 'number' &&
    typeof value.message === 'string' &&
    'data' in value
  )
}

// 根据实际后端接口契约集中维护业务成功码。
const API_SUCCESS_CODES = new Set<number>([200])

const baseURL = import.meta.env.VITE_API_BASE_URL
if (typeof baseURL !== 'string' || baseURL.trim() === '') {
  throw new Error('缺少 VITE_API_BASE_URL，请检查启动环境配置')
}

const trustedBaseURL = new URL(baseURL, window.location.origin)
if (!['http:', 'https:'].includes(trustedBaseURL.protocol)) {
  throw new Error('VITE_API_BASE_URL 必须使用 HTTP 或 HTTPS')
}

const trustedPathPrefix = trustedBaseURL.pathname.endsWith('/')
  ? trustedBaseURL.pathname
  : `${trustedBaseURL.pathname}/`

const instance = axios.create({
  baseURL,
  timeout: 10_000,
  allowAbsoluteUrls: false
})

type AccessTokenProvider = () => string | null
let accessTokenProvider: AccessTokenProvider = () => null

export function setAccessTokenProvider(provider: AccessTokenProvider) {
  accessTokenProvider = provider
}

// 请求拦截器
instance.interceptors.request.use(config => {
  if (config.baseURL !== baseURL) {
    throw new Error('不允许通过单次请求覆盖认证实例的 baseURL')
  }

  const requestURL = config.url
  if (
    typeof requestURL !== 'string' ||
    requestURL.trim() === '' ||
    requestURL.startsWith('//') ||
    /^[a-z][a-z\d+.-]*:/i.test(requestURL)
  ) {
    throw new Error('认证实例只接受相对请求 URL')
  }

  const targetURL = new URL(
    requestURL.replace(/^\/+/, ''),
    new URL(trustedPathPrefix, trustedBaseURL)
  )
  const isTrustedTarget =
    targetURL.origin === trustedBaseURL.origin &&
    (targetURL.pathname === trustedBaseURL.pathname ||
      targetURL.pathname.startsWith(trustedPathPrefix))

  if (!isTrustedTarget) {
    throw new Error('请求目标超出了认证实例的可信 baseURL 范围')
  }

  const token = accessTokenProvider()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

function normalizeRequestError(error: unknown): ApiError {
  if (!axios.isAxiosError(error)) {
    return new ApiError('发生未知错误', 'unknown', undefined, undefined, error)
  }

  if (axios.isCancel(error)) {
    return new ApiError('请求已取消', 'canceled', undefined, error.code, error)
  }

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new ApiError('请求超时', 'timeout', undefined, error.code, error)
  }

  if (error.response) {
    const message = readMessage(error.response.data) ?? error.message
    return new ApiError(
      message,
      'http',
      error.response.status,
      error.code,
      error
    )
  }

  if (error.request) {
    return new ApiError(
      '网络异常或服务器没有响应',
      'network',
      undefined,
      error.code,
      error
    )
  }

  return new ApiError(
    error.message,
    'configuration',
    undefined,
    error.code,
    error
  )
}

// 响应拦截器保留完整响应，并统一归类请求链中的失败。
instance.interceptors.response.use(
  response => response,
  (error: unknown) => Promise.reject(normalizeRequestError(error))
)

async function send<T, D = unknown>(
  config: AxiosRequestConfig<D>
): Promise<T> {
  const response = await instance.request<
    unknown,
    AxiosResponse<unknown, D>,
    D
  >(config)
  const payload = response.data

  if (!isApiResponse(payload)) {
    throw new ApiError(
      '接口响应格式不符合约定',
      'protocol',
      response.status
    )
  }

  if (!API_SUCCESS_CODES.has(payload.code)) {
    throw new ApiError(
      payload.message,
      'business',
      response.status,
      payload.code
    )
  }

  return payload.data as T
}

const request = {
  get<T>(url: string, config?: AxiosRequestConfig) {
    return send<T>({ ...config, url, method: 'GET' })
  },
  post<T, D = unknown>(
    url: string,
    data: D,
    config?: AxiosRequestConfig<D>
  ) {
    return send<T, D>({ ...config, url, method: 'POST', data })
  },
  put<T, D = unknown>(
    url: string,
    data: D,
    config?: AxiosRequestConfig<D>
  ) {
    return send<T, D>({ ...config, url, method: 'PUT', data })
  },
  delete<T>(url: string, config?: AxiosRequestConfig) {
    return send<T>({ ...config, url, method: 'DELETE' })
  }
}

export default request
```

上面的运行时检查会验证统一响应外壳中的 `code`、`message` 和 `data` 字段。泛型 `T` 仍然来自调用方声明；对支付、权限等高风险数据，还应使用项目选定的校验器继续验证 `data` 的具体结构。

令牌来源由应用启动层通过 `setAccessTokenProvider()` 注入，封装层不再固定依赖 `localStorage`。如果提供函数仍从 Web Storage 读取令牌，同源脚本在发生 XSS 时依然可能窃取它；采用 Cookie 时则应同时考虑 `HttpOnly`、`Secure`、`SameSite` 和 CSRF 防护。

```typescript
// api/user.ts
import request from '@/utils/request'

interface User {
  id: number
  name: string
  email: string
}

interface LoginParams {
  username: string
  password: string
}

interface LoginResult {
  token: string
  userInfo: User
}

// 调用时直接传入业务数据类型，无需关心外层 ApiResponse 包裹
export const getUser = (id: number) =>
  request.get<User>(`/api/user/${id}`)

export const getUserList = () =>
  request.get<User[]>('/api/user/list')

export const login = (params: LoginParams) =>
  request.post<LoginResult>('/api/login', params)
```

```typescript
import { ref } from 'vue'
import { login } from '@/api/user'

const username = ref('')
const password = ref('')

const handleLogin = async () => {
  try {
    const result = await login({
      username: username.value,
      password: password.value
    })
    // result 类型自动推断为 LoginResult ✅
    console.log(result.token)
    console.log(result.userInfo.name)
  } catch (error: unknown) {
    console.error(
      error instanceof Error ? error.message : '登录失败，请稍后重试'
    )
  }
}
```

## 关键设计点

| 设计 | 说明 |
|------|------|
| `send()` 剥离外层 | 拦截器保留完整响应，由 `send()` 验证响应结构并返回业务 `data` |
| 泛型 `T` 只描述业务数据 | 不需要每次写 `ApiResponse<User>`，直接写 `User`；必要时继续校验具体数据结构 |
| 分类处理错误 | 区分业务协议、HTTP、网络、超时、取消和配置错误，调用层可以按 `kind` 分别处理 |

## 类型层与运行时返回值必须一致

响应拦截器即使在运行时把 `AxiosResponse` 转换为业务数据，TypeScript 也不会因此自动改变 Axios 实例方法的声明。因此，本文让响应拦截器保留完整响应，再由显式声明返回值的 `send<T, D>()` 检查响应结构、业务状态并取出 `data`。`get()`、`post()`、`put()` 和 `delete()` 都通过该函数发起请求，类型层与运行时行为保持一致。

响应拦截器的拒绝分支处理整个请求链中的失败，并把 HTTP 响应错误、网络故障、超时、取消和配置错误归为不同类别；它不只会收到 HTTP 错误。业务状态和响应数据结构则由 `send()` 处理：

```typescript
instance.interceptors.response.use(
  response => response,
  (error: unknown) => Promise.reject(normalizeRequestError(error))
)

async function send<T, D = unknown>(
  config: AxiosRequestConfig<D>
): Promise<T> {
  const response = await instance.request<
    unknown,
    AxiosResponse<unknown, D>,
    D
  >(config)
  const payload = response.data

  if (!isApiResponse(payload)) {
    throw new ApiError(
      '接口响应格式不符合约定',
      'protocol',
      response.status
    )
  }

  if (!API_SUCCESS_CODES.has(payload.code)) {
    throw new ApiError(
      payload.message,
      'business',
      response.status,
      payload.code
    )
  }

  return payload.data as T
}
```

这里的 `T` 表示成功时的业务数据，`D` 表示请求体数据。业务成功码应由实际后端协议决定，并像 `API_SUCCESS_CODES` 一样集中维护，不能假定所有项目都使用 `200`。

## Vite 环境变量的类型与边界

Vite 会把 `VITE_` 前缀的环境变量暴露给客户端代码，而且读取到的值都是字符串。可以在 `src/vite-env.d.ts` 中补充类型：

```typescript
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

这段声明只为 TypeScript 提供静态类型，不能保证运行时一定存在该变量。创建 Axios 实例前仍应检查 `import.meta.env.VITE_API_BASE_URL` 是否为非空字符串；本文主示例在缺失配置时会立即抛出清晰错误。

`VITE_API_BASE_URL` 适合保存公开的接口地址，不应存放密钥、数据库密码等秘密。`.env` 文件发生变化后，需要重新启动开发服务器。

## 在 Vue 组件中管理请求状态

页面除了取得数据，还应处理重复提交、加载状态和未知错误。`catch` 中先进行类型收窄，可以避免直接使用类型断言：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { login } from '@/api/user'

const submitting = ref(false)
const errorMessage = ref('')
const username = ref('')
const password = ref('')

async function handleLogin() {
  if (submitting.value) return

  submitting.value = true
  errorMessage.value = ''

  try {
    const result = await login({
      username: username.value,
      password: password.value
    })

    console.log(result.userInfo.name)
  } catch (error: unknown) {
    errorMessage.value =
      error instanceof Error ? error.message : '登录失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}
</script>
```

## 认证信息与请求格式

- 令牌提供函数如果从 `localStorage` 或 `sessionStorage` 读取数据，同源 JavaScript 在发生 XSS 时仍可能窃取令牌。若后端支持，也可以采用 `HttpOnly`、`Secure`、合适 `SameSite` 属性的 Cookie，并同时考虑 CSRF 防护。
- 同源 Cookie 通常会随请求发送；跨源 Cookie 请求还需要在 Axios 中设置 `withCredentials: true`，服务端必须返回 `Access-Control-Allow-Credentials: true` 和明确的 `Access-Control-Allow-Origin`，后者不能使用通配符 `*`。
- 携带认证信息的 Axios 实例应限定可信的 `baseURL`，不要把令牌发送给第三方地址。
- 不必为所有请求固定设置 `Content-Type: application/json`。发送 `FormData` 等数据时，应让浏览器和 Axios 根据请求体生成正确的内容类型与 multipart boundary。
- 如果要保留 Axios 的错误详情，不要只创建一个没有附加信息的普通 `Error`；可以继续抛出 `AxiosError`，或像本文一样转换成包含 `kind`、`status`、`code`、`cause` 等字段的项目错误类型。网络、超时和取消等失败应保留不同类别，供调用方分别处理。
