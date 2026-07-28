# JWT（JSON Web Token）

JWT（JSON Web Token）是一种紧凑的声明传递格式。Web 身份认证中常见的是经过签名的 JWT，也就是 JWS：服务端签发令牌，资源服务验证签名和声明后识别请求者。

签名只能证明内容未被篡改且来自持有签名密钥的一方，并不会隐藏内容。常见的紧凑型 JWS 由三段 Base64URL 数据组成：

```text
header.payload.signature
```

Header 描述令牌类型和算法，Payload 保存 claims（声明），Signature 用于完整性和来源校验。Header 和 Payload 可以被客户端直接解码，因此不能把密码、证件号码等秘密放入其中。

## 安装

```bash
npm i jsonwebtoken
npm i -D @types/jsonwebtoken

# 示例使用 Express 时再安装
npm i express
npm i -D @types/express
```

## 签发令牌

下面以 HS256 为例。HS256 使用同一个高熵 secret 签发和验证；任何持有该 secret 的服务都同时具备签发能力。

```js
import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error("缺少 JWT_SECRET");
}

const token = jwt.sign(
  {
    sub: "user-123",
    username: "tom",
    role: "user",
  },
  secret,
  {
    algorithm: "HS256",
    expiresIn: "1h",
    issuer: "https://auth.example.com",
    audience: "example-api",
  },
);

console.log(token);
```

`jsonwebtoken` 默认会加入 `iat`。只有配置 `expiresIn` 或直接提供 `exp` 时才会有过期时间。`expiresIn: 60` 中的数字按秒解释；字符串应明确写单位，例如 `"15m"`、`"1h"`。

## 验证令牌

验证不能只检查签名，还应限制算法，并校验当前系统约定的 `issuer`、`audience` 等声明。

```js
import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET;
const token = process.env.ACCESS_TOKEN;

if (!secret || !token) {
  throw new Error("缺少 JWT_SECRET 或 ACCESS_TOKEN");
}

try {
  const payload = jwt.verify(token, secret, {
    algorithms: ["HS256"],
    issuer: "https://auth.example.com",
    audience: "example-api",
  });

  console.log("验证通过：", payload);
} catch (error) {
  console.error("验证失败：", error instanceof Error ? error.message : error);
}
```

`verify()` 返回的 Payload 仍来自外部输入。签名通过不代表业务字段就符合应用预期，TypeScript 项目还应对 `sub`、`role` 等字段做运行时校验。

常见验证错误包括：

- `TokenExpiredError`：令牌已过期。
- `NotBeforeError`：当前时间早于 `nbf`。
- `JsonWebTokenError`：令牌格式、签名或声明校验失败。

## `decode()` 只负责解析

```js
const decoded = jwt.decode(token);
console.log(decoded);
```

`decode()` 不验证签名，结果完全不可信。它适合调试或读取 Header 来辅助选择验证密钥，不能代替 `verify()` 完成认证或授权。

## 登录与鉴权流程

典型流程是：

1. 登录接口校验请求格式。
2. 从数据库读取用户，并使用 Argon2、bcrypt 或 scrypt 校验密码哈希；数据库不应保存明文密码。
3. 校验成功后签发短期 access token。
4. 客户端通过 HTTPS 携带令牌访问资源接口。
5. 资源接口验证签名、算法、签发者、受众、有效期和业务 claims。
6. 如需长期会话，另行设计 refresh token 的轮换、吊销和重用检测机制。

下面只展示签发步骤；`authenticateUser()` 代表项目自己的数据库和密码哈希校验逻辑：

```js
app.post("/login", async (req, res) => {
  const user = await authenticateUser(req.body.username, req.body.password);

  if (!user) {
    return res.status(401).json({ message: "用户名或密码错误" });
  }

  const token = jwt.sign(
    { sub: String(user.id), role: user.role },
    secret,
    {
      algorithm: "HS256",
      expiresIn: "15m",
      issuer: "https://auth.example.com",
      audience: "example-api",
    },
  );

  return res.json({ accessToken: token });
});
```

客户端常用标准 Bearer 方案传递 access token：

```http
Authorization: Bearer <access-token>
```

服务端应严格检查认证方案，不能把任意 `Authorization` 内容都当作令牌：

```js
function readBearerToken(req) {
  const match = req.headers.authorization?.match(/^Bearer ([^\s]+)$/i);
  return match?.[1] ?? null;
}
```

## 安全边界

- 只通过 HTTPS 传输令牌，并结合具体客户端模型选择安全的存储方式。
- access token 应尽量短期有效；JWT 不会自动提供注销、吊销或 refresh token 轮换能力。
- 不要记录完整令牌，也不要把密钥提交到仓库。
- HS256 secret 必须足够随机；多服务验证或第三方验证场景通常更适合使用非对称签名。
- 权限变化、账号禁用等需要立即生效时，应使用短有效期、令牌版本、拒绝列表或服务端会话等补充机制。

---

## HS256 与 RS256

### HS256：对称消息认证码

HS256 使用同一个 secret 签发和验证。部署简单，但每个验证方都必须拿到 secret，而拿到 secret 的一方也能签发令牌。因此它适合由同一信任边界控制签发与验证的场景，不应仅凭“单体或微服务”标签机械选择。

```js
const token = jwt.sign({ sub: "user-1" }, secret, {
  algorithm: "HS256",
  expiresIn: "15m",
  issuer: "https://auth.example.com",
  audience: "example-api",
});

const payload = jwt.verify(token, secret, {
  algorithms: ["HS256"],
  issuer: "https://auth.example.com",
  audience: "example-api",
});
```

secret 应由密码学安全随机源生成并通过密钥管理系统或环境变量注入，不能使用短口令或示例字符串作为生产密钥。

### RS256：非对称签名

RS256 使用 RSA 私钥签发、公钥验证。资源服务只持有公钥时可以验证却不能签发，适合签发方与多个验证方分离的场景。

```js
import fs from "node:fs";
import jwt from "jsonwebtoken";

const privateKeyPath = process.env.JWT_PRIVATE_KEY_PATH;
const publicKeyPath = process.env.JWT_PUBLIC_KEY_PATH;
if (!privateKeyPath || !publicKeyPath) {
  throw new Error("缺少 JWT 密钥路径");
}

const privateKey = fs.readFileSync(privateKeyPath);
const publicKey = fs.readFileSync(publicKeyPath);

const token = jwt.sign({ sub: "user-1" }, privateKey, {
  algorithm: "RS256",
  expiresIn: "15m",
  issuer: "https://auth.example.com",
  audience: "example-api",
  keyid: "2026-01",
});

const payload = jwt.verify(token, publicKey, {
  algorithms: ["RS256"],
  issuer: "https://auth.example.com",
  audience: "example-api",
});

console.log(payload);
```

`jsonwebtoken` 默认拒绝小于 2048 位的 RSA 私钥，不应通过兼容选项绕过该限制。生产系统还要规划密钥轮换：可在 Header 中写入 `kid`，验证方再从受信任的本地密钥集合或 JWKS 中选择公钥。不能根据不受信任的 `kid` 任意读取文件或请求 URL。

## 同步与回调 API

`jsonwebtoken` 的 `sign()` 和 `verify()` 同时支持同步返回值与回调形式。传入回调时通过回调接收结果；不传回调时同步返回或抛出错误。

### 回调签发

```js
jwt.sign(
  { sub: "user-1" },
  secret,
  {
    algorithm: "HS256",
    expiresIn: "15m",
    issuer: "https://auth.example.com",
    audience: "example-api",
  },
  (error, token) => {
    if (error || !token) {
      console.error(error ?? new Error("签发失败"));
      return;
    }
    console.log(token);
  },
);
```

### 回调验证

```js
jwt.verify(
  token,
  secret,
  {
    algorithms: ["HS256"],
    issuer: "https://auth.example.com",
    audience: "example-api",
  },
  (error, payload) => {
    if (error) {
      console.error("验证失败", error.message);
      return;
    }
    console.log("验证通过", payload);
  },
);
```

回调形式不等于把所有密码学工作自动移到工作线程。选择同步、回调或 Promise 封装主要取决于控制流和密钥获取方式；如果验证密钥需要从 JWKS 异步获取，可以向 `verify()` 传入密钥获取函数。

## 常见错误

### 把 `decode()` 当作验证

`decode()` 只解析内容。认证和授权必须从 `verify()` 开始，并继续校验应用所需的 claims。

### 没有限制算法

不要只依赖令牌 Header 自己声明的 `alg`。验证端应显式配置允许的算法，并确保密钥类型与算法匹配。

### 只验证签名，不验证令牌用途

同一系统中若存在 access token、refresh token、邮件验证 token 等不同令牌，应使用不同的 audience、类型声明或验证规则，必要时使用不同密钥，避免一种令牌被误用于另一种接口。

### 宽松解析 `Authorization`

Bearer 方案应拒绝缺少前缀、令牌为空或包含额外空白的输入，而不是直接删除任意前缀：

```js
function readBearerToken(req) {
  const match = req.headers.authorization?.match(/^Bearer ([^\s]+)$/i);
  return match?.[1] ?? null;
}
```

### 混淆秒与字符串单位

`expiresIn: 60` 表示 60 秒；`expiresIn: "60"` 会被时长解析器当作 60 毫秒。字符串形式应明确写成 `"60s"`、`"15m"` 等。

## 最小可运行示例

先设置一个足够随机的 `JWT_SECRET`，然后运行：

```js
import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error("请先设置 JWT_SECRET");
}

const options = {
  algorithm: "HS256",
  issuer: "https://auth.example.com",
  audience: "example-api",
};

const token = jwt.sign(
  { sub: "user-1001", role: "admin" },
  secret,
  { ...options, expiresIn: "15m" },
);

try {
  const payload = jwt.verify(token, secret, {
    algorithms: ["HS256"],
    issuer: options.issuer,
    audience: options.audience,
  });
  console.log(payload);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
}
```

---

## TypeScript 导入方式

启用 `esModuleInterop` 后可以使用默认导入：

```ts
import jwt from "jsonwebtoken";
import type { JwtPayload, SignOptions } from "jsonwebtoken";
```

未启用时可写成：

```ts
import * as jwt from "jsonwebtoken";
```

下面使用第一种形式。示例还用 Zod 验证运行时数据：

```bash
npm i jsonwebtoken zod
npm i -D @types/jsonwebtoken
```

## 分离业务 claims 与标准 claims

签发函数的输入只描述应用自己负责的字段。`iat`、`exp`、`iss` 和 `aud` 由签发选项生成，不需要通过继承 `JwtPayload` 混入输入类型。

```ts
export interface AccessTokenClaims {
  sub: string;
  username: string;
  role: "admin" | "user";
}
```

类型断言只能影响编译器，不能检查外部数据。验证后的 Payload 必须再经过运行时 schema。

## JWT 工具模块

```ts
// src/jwt.ts
import jwt from "jsonwebtoken";
import type { JwtPayload, SignOptions } from "jsonwebtoken";
import { z } from "zod";

const issuer = "https://auth.example.com";
const audience = "example-api";

function requireSecret(): string {
  const value = process.env.JWT_SECRET;
  if (!value) {
    throw new Error("缺少 JWT_SECRET");
  }
  return value;
}

export interface AccessTokenClaims {
  sub: string;
  username: string;
  role: "admin" | "user";
}

const accessTokenSchema = z.object({
  sub: z.string().min(1),
  username: z.string().min(1),
  role: z.enum(["admin", "user"]),
  iat: z.number().int(),
  exp: z.number().int(),
});

export type VerifiedAccessToken = JwtPayload &
  z.infer<typeof accessTokenSchema>;

const signOptions = {
  algorithm: "HS256",
  expiresIn: "15m",
  issuer,
  audience,
} satisfies SignOptions;

export function signAccessToken(claims: AccessTokenClaims): string {
  return jwt.sign(claims, requireSecret(), signOptions);
}

export function verifyAccessToken(token: string): VerifiedAccessToken {
  const decoded = jwt.verify(token, requireSecret(), {
    algorithms: ["HS256"],
    issuer,
    audience,
  });

  if (typeof decoded === "string") {
    throw new Error("令牌 Payload 必须是对象");
  }

  const claims = accessTokenSchema.parse(decoded);
  return { ...decoded, ...claims };
}
```

该 schema 要求 access token 必须包含 `iat` 和 `exp`，并检查业务字段。若还需要校验 token 类型、租户或权限版本，应把相应字段加入签发与验证规则。

## 扩展 Express Request

新建 `src/types/express.d.ts`：

```ts
import type { VerifiedAccessToken } from "../jwt";

declare global {
  namespace Express {
    interface Request {
      user?: VerifiedAccessToken;
    }
  }
}

export {};
```

通常只要 `tsconfig.json` 的 `include` 覆盖 `src`，声明文件就会被编译器读取。不要为了这一项随意设置 `typeRoots`；一旦设置，它会改变类型包的查找范围。

```json
{
  "include": ["src"]
}
```

## Bearer 鉴权中间件

```ts
// src/auth-middleware.ts
import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "./jwt";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const match = req.headers.authorization?.match(/^Bearer ([^\s]+)$/i);

  if (!match) {
    res.status(401).json({ message: "未认证" });
    return;
  }

  try {
    req.user = verifyAccessToken(match[1]);
    next();
  } catch (error) {
    // 对外使用统一消息；具体错误应写入受控日志，且不要记录完整令牌。
    console.warn("Access token verification failed", error);
    res.status(401).json({ message: "未认证" });
  }
}
```

受保护路由在中间件之后可以读取 `req.user`：

```ts
import express from "express";
import { authMiddleware } from "./auth-middleware";

const app = express();

app.get("/profile", authMiddleware, (req, res) => {
  res.json({
    id: req.user?.sub,
    username: req.user?.username,
    role: req.user?.role,
  });
});
```

如果业务要求 `user` 在特定处理器中一定存在，可以进一步定义经过认证的 Request 类型，或由框架层保证中间件顺序；可选属性能避免把全局所有路由都误认为已认证。

## 错误处理

`jsonwebtoken` 常见错误类包括 `TokenExpiredError`、`NotBeforeError` 和 `JsonWebTokenError`。服务端可以在日志或监控中区分它们，但通常不应把验签细节原样返回给客户端：

```ts
try {
  verifyAccessToken(token);
} catch (error) {
  if (error instanceof jwt.TokenExpiredError) {
    console.warn("access token expired");
  } else if (error instanceof jwt.NotBeforeError) {
    console.warn("access token is not active yet");
  } else if (error instanceof jwt.JsonWebTokenError) {
    console.warn("invalid access token");
  } else {
    console.error("unexpected verification failure", error);
  }
}
```

`decode()` 的返回值同样需要当作不可信输入。即便它在 TypeScript 中被断言为某个接口，也不能用于身份认证。

---

## 准备 RSA 密钥

开发环境可以用 OpenSSL 生成一对 RSA 密钥。私钥只交给签发服务，公钥交给验证方：

```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:3072 -out private.pem
openssl rsa -pubout -in private.pem -out public.pem
```

密钥文件不应提交到仓库。生产环境通常使用密钥管理服务，并通过 `kid` 与受信任的 JWKS 或本地公钥集合支持轮换。

## RS256 的 TypeScript 写法

```ts
import fs from "node:fs";
import jwt from "jsonwebtoken";

const privateKeyPath = process.env.JWT_PRIVATE_KEY_PATH;
const publicKeyPath = process.env.JWT_PUBLIC_KEY_PATH;

if (!privateKeyPath || !publicKeyPath) {
  throw new Error("缺少 JWT_PRIVATE_KEY_PATH 或 JWT_PUBLIC_KEY_PATH");
}

const privateKey = fs.readFileSync(privateKeyPath);
const publicKey = fs.readFileSync(publicKeyPath);

const token = jwt.sign(
  { sub: "user-1", username: "admin", role: "admin" },
  privateKey,
  {
    algorithm: "RS256",
    expiresIn: "15m",
    issuer: "https://auth.example.com",
    audience: "example-api",
    keyid: "2026-01",
  },
);

const payload = jwt.verify(token, publicKey, {
  algorithms: ["RS256"],
  issuer: "https://auth.example.com",
  audience: "example-api",
});

console.log(payload);
```

## Promise 风格封装

`jsonwebtoken` 同时提供同步和回调 API，本身不直接返回 Promise。需要统一 `async/await` 控制流时，可以封装回调版本，但泛型或类型断言不能代替运行时 claims 校验。

```ts
// src/jwt.ts
import fs from "node:fs";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { z } from "zod";

const issuer = "https://auth.example.com";
const audience = "example-api";
const keyId = "2026-01";

const privateKeyPath = process.env.JWT_PRIVATE_KEY_PATH;
const publicKeyPath = process.env.JWT_PUBLIC_KEY_PATH;

if (!privateKeyPath || !publicKeyPath) {
  throw new Error("缺少 JWT 私钥或公钥路径");
}

const privateKey = fs.readFileSync(privateKeyPath);
const publicKey = fs.readFileSync(publicKeyPath);

export interface AccessTokenClaims {
  sub: string;
  username: string;
  role: "admin" | "user";
}

const verifiedTokenSchema = z.object({
  sub: z.string().min(1),
  username: z.string().min(1),
  role: z.enum(["admin", "user"]),
  iat: z.number().int(),
  exp: z.number().int(),
});

export type VerifiedAccessToken = JwtPayload &
  z.infer<typeof verifiedTokenSchema>;

export function signAccessTokenAsync(
  claims: AccessTokenClaims,
): Promise<string> {
  return new Promise((resolve, reject) => {
    jwt.sign(
      claims,
      privateKey,
      {
        algorithm: "RS256",
        expiresIn: "15m",
        issuer,
        audience,
        keyid: keyId,
      },
      (error, token) => {
        if (error || !token) {
          reject(error ?? new Error("签发失败"));
          return;
        }
        resolve(token);
      },
    );
  });
}

export function verifyAccessTokenAsync(
  token: string,
): Promise<VerifiedAccessToken> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      publicKey,
      {
        algorithms: ["RS256"],
        issuer,
        audience,
      },
      (error, decoded) => {
        if (error || !decoded || typeof decoded === "string") {
          reject(error ?? new Error("令牌 Payload 必须是对象"));
          return;
        }

        const result = verifiedTokenSchema.safeParse(decoded);
        if (!result.success) {
          reject(new Error("令牌 claims 不符合约定"));
          return;
        }

        resolve({ ...decoded, ...result.data });
      },
    );
  });
}
```

## 完整 Express 示例

安装依赖：

```bash
npm i express jsonwebtoken zod argon2
npm i -D typescript tsx @types/express @types/jsonwebtoken
```

以下示例使用环境变量中的 Argon2 哈希模拟数据库记录。实际项目应从数据库读取用户，并由注册或改密流程生成密码哈希。

```ts
// src/app.ts
import express from "express";
import type { NextFunction, Request, Response } from "express";
import argon2 from "argon2";
import { z } from "zod";
import {
  signAccessTokenAsync,
  verifyAccessTokenAsync,
} from "./jwt";
import type { VerifiedAccessToken } from "./jwt";

declare global {
  namespace Express {
    interface Request {
      user?: VerifiedAccessToken;
    }
  }
}

const demoPasswordHash = process.env.DEMO_PASSWORD_HASH;
if (!demoPasswordHash) {
  throw new Error("缺少 DEMO_PASSWORD_HASH");
}

const demoUser = {
  id: "user-1",
  username: "admin",
  role: "admin" as const,
  passwordHash: demoPasswordHash,
};

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

async function authenticateUser(username: string, password: string) {
  if (username !== demoUser.username) {
    return null;
  }

  return (await argon2.verify(demoUser.passwordHash, password))
    ? demoUser
    : null;
}

async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const match = req.headers.authorization?.match(/^Bearer ([^\s]+)$/i);

  if (!match) {
    res.status(401).json({ message: "未认证" });
    return;
  }

  try {
    req.user = await verifyAccessTokenAsync(match[1]);
    next();
  } catch (error) {
    console.warn("Access token verification failed", error);
    res.status(401).json({ message: "未认证" });
  }
}

const app = express();
app.use(express.json());

app.post("/login", async (req, res) => {
  const input = loginSchema.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ message: "请求格式错误" });
    return;
  }

  const user = await authenticateUser(
    input.data.username,
    input.data.password,
  );

  if (!user) {
    res.status(401).json({ message: "用户名或密码错误" });
    return;
  }

  const accessToken = await signAccessTokenAsync({
    sub: user.id,
    username: user.username,
    role: user.role,
  });

  res.json({ accessToken });
});

app.get("/profile", authMiddleware, (req, res) => {
  res.json({
    id: req.user?.sub,
    username: req.user?.username,
    role: req.user?.role,
  });
});

app.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});

export {};
```

可以用一次性脚本为开发示例生成哈希，再把输出写入本地环境变量：

```bash
node -e "require('argon2').hash(process.argv[1]).then(console.log)" "change-me"
```

## 仍需由系统设计解决的问题

- 全程使用 HTTPS，并避免在日志、URL 或错误响应中泄漏令牌。
- access token 保持短期有效；refresh token 应有单独的存储、轮换、吊销和重用检测策略。
- 规划 `kid`、旧公钥保留窗口和 JWKS 缓存，避免轮换瞬间使有效令牌全部失效。
- 不要让未验证的 `kid`、`jku` 等 Header 值控制任意文件读取或网络请求。
- 登录限流、多因素认证、账号锁定和会话撤销不由 JWT 格式自动提供。
