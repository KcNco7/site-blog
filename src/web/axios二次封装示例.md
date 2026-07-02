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
import axios, { AxiosRequestConfig, AxiosError } from 'axios'
import type { ApiResponse } from '@/types/api'

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

// 请求拦截器
instance.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 响应拦截器 —— 统一处理错误，直接返回 data
instance.interceptors.response.use(
  response => {
    const res: ApiResponse = response.data
    if (res.code !== 200) {
      // 统一业务错误处理
      return Promise.reject(new Error(res.message))
    }
    return res.data  // 只返回 data 字段
  },
  (error: AxiosError) => {
    // 统一 HTTP 错误处理
    const message = error.response?.status === 401
      ? '未授权，请重新登录'
      : error.message
    return Promise.reject(new Error(message))
  }
)

// 封装方法
const request = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return instance.get(url, config)
  },
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return instance.post(url, data, config)
  },
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return instance.put(url, data, config)
  },
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return instance.delete(url, config)
  }
}

export default request
```

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
// 页面中使用
const handleLogin = async () => {
  try {
    const result = await login({ username: 'admin', password: '123456' })
    // result 类型自动推断为 LoginResult ✅
    console.log(result.token)
    console.log(result.userInfo.name)
  } catch (error) {
    console.error((error as Error).message)
  }
}
```

## 关键设计点

| 设计 | 说明 |
|------|------|
| 拦截器剥离外层 | `response.data` 直接返回 `data` 字段，调用层无需 `.data` |
| 泛型 `T` 只描述业务数据 | 不需要每次写 `ApiResponse<User>`，直接写 `User` |
| 统一错误处理 | 业务错误 + HTTP 错误都在拦截器处理，调用层只需 `try/catch` |
