# nestjs

## 常用命令

查看帮助

```sh
nest --help
```

## RESTful 风格设计

### 版本控制

开启版本控制:

```ts
// main.ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { VersioningType } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableVersioning({
    type: VersioningType.URI, // 启用版本控制
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

然后在`@Controller()`装饰器中添加版本号

```ts
import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";

@Controller({
  version: "1", // 添加版本控制
})
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
```

### code码

```text
200 OK                    请求成功
201 Created               资源创建成功
204 No Content            请求成功且没有响应体
304 Not Modified          条件请求命中缓存（不是普通成功响应）
400 Bad Request           请求语法或参数不合法
401 Unauthorized          未提供或提供了无效的身份凭据
403 Forbidden             身份已确认，但没有执行该操作的权限
404 Not Found             目标资源或路由不存在
500 Internal Server Error 服务器内部错误
502 Bad Gateway           网关或代理从上游收到无效响应
```

## 控制器

### Get

获取参数：

```ts
import { Controller, Get, Query } from "@nestjs/common";

@Controller("users")
export class UsersController {
  @Get()
  findAll(@Query("name") name?: string) {
    return {
      code: 200,
      message: name,
    };
  }
}
```

也可以使用`@Query()`装饰器:

```ts
import { Controller, Get, Query } from "@nestjs/common";

@Controller("users")
export class UsersController {
  @Get()
  findAll(@Query() query: { name?: string }) {
    return {
      code: 200,
      message: query.name,
    };
  }
}
```

### Post

```ts
import { Body, Controller, Post } from "@nestjs/common";

@Controller("users")
export class UsersController {
  @Post()
  create(@Body() body: { name: string }) {
    return {
      message: body,
    };
  }
}
```

也可以给 `@Body()` 传入字段名，直接取得请求体中的某个字段：

```ts
import { Body, Controller, Post } from "@nestjs/common";

@Controller("users")
export class UsersController {
  @Post()
  create(@Body("age") age: number) {
    return {
      message: age,
    };
  }
}
```

### 动态参数

```ts
import {
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
} from "@nestjs/common";

@Controller("users")
export class UsersController {
  @Get(":id")
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @Headers("user-agent") userAgent?: string,
  ) {
    return {
      code: 200,
      message: { id, userAgent },
    };
  }
}
```

## Session

安装：

```sh
pnpm add express-session # session
pnpm add @types/express-session -D # session类型
```

配置session：

```ts
// main.ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { VersioningType } from "@nestjs/common"; // 版本控制
import session from "express-session"; // session

async function bootstrap() {
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret || sessionSecret.length < 32) {
    throw new Error("SESSION_SECRET 必须至少包含 32 个字符");
  }

  const app = await NestFactory.create(AppModule);
  app.enableVersioning({
    type: VersioningType.URI, // 启用版本控制
  });
  app.use(
    // session
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      rolling: true, // 每次请求都重置过期时间
      name: "xxx.sid", // sessionId
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 过期时间 7天
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

`express-session` 的默认 MemoryStore 只适合开发调试，会泄漏内存且不能跨进程共享。生产环境应配置 Redis 等外部 Store，使用足够强且来自环境变量的 secret，并在 HTTPS 和反向代理场景正确设置 `trust proxy` 与安全 Cookie 属性。

### 验证码模块

```sh
pnpm add svg-captcha
```

## Providers

- 类 Provider：通常用 `@Injectable()` 声明，并按类 token 注入
- Value Provider：`{ provide: TOKEN, useValue: value }`
- Factory Provider：`{ provide: TOKEN, useFactory, inject }`
- Alias Provider：`{ provide: ALIAS, useExisting: ExistingProvider }`

Provider 必须注册在模块的 `providers` 中；要让其他模块使用，还需从当前模块 `exports` 导出，并在消费模块中导入该模块。

## Module

1. 共享模块

```ts
import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // 添加导出
})
export class UsersModule {}
```

2. 全局模块：在模块类上使用 `@Global()`，并仍需在根模块中至少导入一次。全局模块会降低依赖关系的显式性，不应为了省略 imports 而滥用。
3. 动态模块：通过静态 `register()` / `registerAsync()` 等方法返回 `DynamicModule`，按调用方配置 providers、imports 和 exports。

---

## 中间件

中间件在路由处理器之前执行，适合日志、请求上下文、通用头处理等任务。认证和授权通常应交给 Guard，因为 Guard 能读取 `ExecutionContext` 和路由元数据。

生成并实现一个类中间件：

```sh
nest g middleware logger
```

```ts
// logger.middleware.ts
import { Injectable, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    console.log(req.method, req.originalUrl);
    next();
  }
}
```

在模块中按路由注册。NestJS 11 使用命名通配符；`{*splat}` 还能匹配没有额外路径段的根路径。

```ts
// app.module.ts
import {
  MiddlewareConsumer,
  Module,
  RequestMethod,
  type NestModule,
} from "@nestjs/common";
import { LoggerMiddleware } from "./logger.middleware";

@Module({})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .exclude({ path: "health", method: RequestMethod.GET })
      .forRoutes({ path: "{*splat}", method: RequestMethod.ALL });
  }
}
```

不依赖 Nest DI 的简单函数也可以通过 `app.use()` 注册为全局中间件：

```ts
// main.ts
import { NestFactory } from "@nestjs/core";
import type { NextFunction, Request, Response } from "express";
import { AppModule } from "./app.module";

function requestLogger(req: Request, _res: Response, next: NextFunction) {
  console.log(req.method, req.originalUrl);
  next();
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(requestLogger);
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
```

不要用字符串白名单中间件代替权限校验：`originalUrl` 包含查询字符串，简单的 `startsWith` 还可能误匹配；直接 `res.send("无权访问")` 默认也可能返回 200。需要身份与权限判断时，应使用认证 Guard、授权 Guard，并返回正确的 401 或 403。

### CORS

Nest 已封装 Express/Fastify 对应的 CORS 能力，不必为了基础配置直接调用第三方中间件：

```ts
const app = await NestFactory.create(AppModule);
app.enableCors({
  origin: ["https://app.example.com"],
  credentials: true,
});
```

允许携带凭据时必须返回明确的允许来源，不能把 `Access-Control-Allow-Origin` 配成 `*`。还应只开放业务需要的方法和请求头。

## 上传文件与静态目录

Nest 的 `FileInterceptor` 基于 Multer，仅适用于 Express adapter，并处理 `multipart/form-data`。Fastify 项目需要使用与 Fastify 兼容的上传方案。

```sh
pnpm add multer
pnpm add -D @types/multer
```

先配置一个确定的上传目录和文件命名方式：

```ts
// upload.config.ts
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { extname, join } from "node:path";
import { MulterModule } from "@nestjs/platform-express";
import { diskStorage } from "multer";

export const uploadDir = join(process.cwd(), "uploads");
mkdirSync(uploadDir, { recursive: true });

export const UploadStorageModule = MulterModule.register({
  storage: diskStorage({
    destination: uploadDir,
    filename(_request, file, callback) {
      const extension = extname(file.originalname).toLowerCase();
      callback(null, randomUUID() + extension);
    },
  }),
});
```

在业务模块中导入 `UploadStorageModule`，再在 Controller 中限制文件类型和大小：

```ts
// uploads.controller.ts
import {
  Controller,
  MaxFileSizeValidator,
  ParseFilePipeBuilder,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";

@Controller("uploads")
export class UploadsController {
  @Post("image")
  @UseInterceptors(FileInterceptor("file"))
  upload(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /^image\/(png|jpeg)$/ })
        .addMaxSizeValidator({ maxSize: 5 * 1024 * 1024 })
        .build(),
    )
    file: Express.Multer.File,
  ) {
    return {
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}
```

MIME 类型和扩展名都不能单独证明文件内容安全。生产系统还应考虑魔数检测、恶意文件扫描、配额、鉴权、对象存储，以及禁止把上传目录当作可执行代码目录。

若这些文件确实允许任何人公开访问，可通过 Express adapter 暴露静态目录：

```ts
// main.ts
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { uploadDir } from "./upload.config";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(uploadDir, { prefix: "/images/" });
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
```

静态资源中间件会绕过普通 Controller 的对象级授权。私有文件不应放在公开静态目录，应通过受保护的下载接口读取。

## 下载文件与文件流

Nest 的 `StreamableFile` 可以把 Node.js 可读流交给框架处理，同时保留拦截器等框架能力：

```ts
// downloads.controller.ts
import {
  Controller,
  Get,
  Res,
  StreamableFile,
} from "@nestjs/common";
import { createReadStream } from "node:fs";
import { join } from "node:path";
import type { Response } from "express";
import { uploadDir } from "./upload.config";

@Controller("downloads")
export class DownloadsController {
  @Get("example")
  download(
    @Res({ passthrough: true }) response: Response,
  ): StreamableFile {
    const filePath = join(uploadDir, "example.png");

    response.setHeader("Content-Type", "image/png");
    response.setHeader(
      "Content-Disposition",
      'attachment; filename="example.png"',
    );

    return new StreamableFile(createReadStream(filePath));
  }
}
```

如果文件名来自请求参数，必须先把业务 ID 映射到服务端保存的真实路径，并验证解析后的路径仍位于允许目录中，不能直接把用户输入拼进文件系统路径。还应正确处理文件不存在、流错误、缓存策略和大文件的范围请求需求。

---

## RxJS

RxJS 用 Observable 表达随时间到达的值，并通过操作符组合异步数据流。它不只是“异步队列”，也不完全等同于把异步数据当数组处理。

1. Observable（可观察对象）
   - 描述值如何产生，可以发出零个、一个或多个值，也可能完成或报错。
   - 冷 Observable 通常在每次订阅时开始独立执行；热 Observable（例如某些 Subject 或共享事件源）即使没有当前订阅者也可能继续产生值。
2. Subscription（订阅）
   - `subscribe()` 返回 Subscription，可用 `unsubscribe()` 取消仍在进行的订阅。
   - 已完成或已报错的有限流会自动结束；长期事件流若由调用方手动订阅，则应根据生命周期取消或使用相应操作符管理。
3. Operators（操作符）
   - `map`、`filter`：变换或筛选值。
   - `concatMap`、`mergeMap`、`switchMap`：以不同并发和取消语义处理高阶流。
   - `debounceTime`：在一段静默时间后发出值。
   - `reduce`：在源 Observable 完成时聚合结果。

### 典型应用场景

- 搜索输入：`debounceTime` 配合 `switchMap` 可丢弃旧请求结果，减少竞态。
- 多请求编排：`concatMap` 适合按顺序处理，`mergeMap` 适合受控并发，`forkJoin` 等待所有有限输入完成后汇总最后值。
- 实时数据：处理 WebSocket、SSE 或消息事件流。
- NestJS：Controller 可以返回 Observable；`HttpService` 也返回 Observable，可在 `pipe()` 中转换响应。

Promise 更适合单次结果；Observable 更适合需要多个值、取消、组合或复杂时序的流程。具体选择取决于数据源和所有权，不存在所有异步逻辑都应改成 RxJS 的规则。

## 响应拦截器

拦截器可以在 Controller 前后执行逻辑。下面把普通业务返回值包装为统一响应结构：

```ts
// transform.interceptor.ts
import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from "@nestjs/common";
import { map, type Observable } from "rxjs";

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: true;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        data,
        message: "success",
        success: true,
      })),
    );
  }
}
```

若拦截器需要依赖注入，推荐通过 `APP_INTERCEPTOR` 注册：

```ts
// app.module.ts
import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { TransformInterceptor } from "./transform.interceptor";

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
```

统一包装前要排除不应转换的响应，例如 `StreamableFile`、SSE、手动使用 `@Res()` 的路由以及已经符合协议的第三方回调。否则全局 `map` 可能破坏流或文件响应。

## 异常过滤器

Exception Filter 只处理作用域内未被捕获且与 `@Catch()` 类型匹配的异常。下面的过滤器保留 Nest 的 HTTP 状态码，并规范化常见错误信息：

```ts
// http-exception.filter.ts
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
} from "@nestjs/common";
import type { Request, Response } from "express";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();
    const statusCode = exception.getStatus();
    const payload = exception.getResponse();

    response.status(statusCode).json({
      success: false,
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
      error: payload,
    });
  }
}
```

通过 `APP_FILTER` 注册可以保留依赖注入能力：

```ts
// app.module.ts
import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { HttpExceptionFilter } from "./http-exception.filter";

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
```

`@Catch(HttpException)` 不会捕获任意未知错误。Nest 的默认异常层会把未识别异常转换为 500，并避免直接把内部堆栈暴露给客户端；若编写 catch-all filter，也应记录内部详情但只返回稳定、无敏感信息的错误体。

---

## Pipe 转换

Pipe 有两个核心职责：

1. 转换：把进入路由处理器的数据转换成需要的值。
2. 校验：不符合要求时抛出异常，阻止 Controller 方法执行。

路径参数和查询参数最初都是字符串。`ParseIntPipe` 会校验并返回 number：

```ts
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
} from "@nestjs/common";

@Controller("users")
export class UsersController {
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return { id };
  }

  @Get("by-public-id/:id")
  findByPublicId(@Param("id", ParseUUIDPipe) id: string) {
    return { id };
  }
}
```

`ParseUUIDPipe` 是 Nest 内置管道，不需要为了使用它额外安装 `uuid`。只有在业务代码需要生成或操作 UUID 时，才按所选 UUID 库的要求安装依赖；现代 `uuid` 包已经自带 TypeScript 类型。

## Pipe 验证 DTO

可以用 `nest g resource login` 生成资源骨架，再给 DTO 添加验证规则：

```sh
pnpm add class-validator class-transformer
```

```ts
// create-login.dto.ts
import { Type } from "class-transformer";
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Length,
  Max,
  Min,
} from "class-validator";

export class CreateLoginDto {
  @IsNotEmpty()
  @IsString()
  @Length(5, 30)
  name!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(150)
  age!: number;
}
```

最常见的做法是在应用边界注册全局 `ValidationPipe`：

```ts
// main.ts
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
```

`whitelist` 只保留 DTO 中带有验证装饰器的字段；`forbidNonWhitelisted` 会改为拒绝额外字段。`transform` 会创建 DTO 实例，但复杂字段仍应使用 `@Type()` 或显式转换，不能假定所有输入都会按 TypeScript 类型自动转换。

### 手写校验 Pipe

理解机制时可以实现一个简化版 class-validator Pipe；生产项目通常直接使用内置 `ValidationPipe`：

```ts
import {
  type ArgumentMetadata,
  BadRequestException,
  Injectable,
  type PipeTransform,
  type Type,
} from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

@Injectable()
export class DtoValidationPipe implements PipeTransform {
  async transform(value: unknown, metadata: ArgumentMetadata) {
    const metatype = metadata.metatype;
    if (!metatype || this.isPrimitive(metatype)) return value;

    const dto = plainToInstance(metatype, value);
    const errors = await validate(dto as object);
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }
    return dto;
  }

  private isPrimitive(metatype: Type<unknown>): boolean {
    const primitives: Type<unknown>[] = [
      String,
      Boolean,
      Number,
      Array,
      Object,
    ];
    return primitives.includes(metatype);
  }
}
```

这个简化实现没有覆盖内置 `ValidationPipe` 的 whitelist、异常工厂、转换选项等完整能力。

## Guard（守卫）

Guard 在 Controller 之前决定当前请求能否进入处理器。认证 Guard 负责确认“是谁”，授权 Guard 再判断“能做什么”；客户端传入的 query、body 或 header 角色值不能直接作为可信权限依据。

先声明角色元数据：

```ts
// roles.decorator.ts
import { SetMetadata } from "@nestjs/common";

export const ROLES_KEY = "roles";
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

授权 Guard 同时读取方法级和 Controller 级元数据，并使用认证阶段写入的 `request.user`：

```ts
// roles.guard.ts
import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { ROLES_KEY } from "./roles.decorator";

type AuthenticatedRequest = Request & {
  user?: { id: string; roles: string[] };
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) throw new UnauthorizedException();

    return requiredRoles.every((role) => request.user!.roles.includes(role));
  }
}
```

在路由上声明权限：

```ts
import { Controller, Get, UseGuards } from "@nestjs/common";
import { Roles } from "./roles.decorator";
import { RolesGuard } from "./roles.guard";

@Controller("reports")
@UseGuards(RolesGuard)
export class ReportsController {
  @Get()
  @Roles("admin")
  findAll() {
    return [];
  }
}
```

上例假定更早的认证 Guard 已验证凭据并写入 `request.user`。如果直接单独使用 `RolesGuard`，请求不会凭空获得可信用户信息。

### 全局守卫

需要依赖注入的全局 Guard 应通过 `APP_GUARD` 注册，而不是在 `main.ts` 中手写 `new RolesGuard()`：

```ts
// app.module.ts
import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { RolesGuard } from "./roles.guard";

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
```

若同时注册认证和授权 Guard，应确认 provider 顺序和职责边界，让授权判断基于已经验证的用户信息。返回 `false` 时 Nest 会拒绝请求；缺少身份时主动抛出 `UnauthorizedException` 能更清楚地区分 401 与 403。

## 自定义参数装饰器

`createParamDecorator` 用于从当前执行上下文提取参数：

```ts
// request-url.decorator.ts
import {
  createParamDecorator,
  type ExecutionContext,
} from "@nestjs/common";
import type { Request } from "express";

export const RequestUrl = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<Request>();
    return request.originalUrl;
  },
);
```

使用方式：

```ts
import { Controller, Get } from "@nestjs/common";
import { RequestUrl } from "./request-url.decorator";

@Controller("debug")
export class DebugController {
  @Get()
  showUrl(@RequestUrl() url: string) {
    return { url };
  }
}
```

`applyDecorators()` 用于在“定义装饰器时”组合多个装饰器，不应从参数装饰器的运行时回调中返回。参数装饰器回调应返回要传给 Controller 参数的实际值。

---

## Swagger配置与装饰器

1. 安装：`pnpm add @nestjs/swagger`

```ts
// main.ts
// ...
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger"; // 引入 SwaggerModule 和 DocumentBuilder

const options = new DocumentBuilder()
  .addBearerAuth()
  .setTitle("测试文档")
  .setDescription("测试文档")
  .setVersion("1.0")
  .build();
const document = SwaggerModule.createDocument(app, options);
SwaggerModule.setup("/api-docs", app, document);
```

具体的一些装饰器的用法示例:

```ts
import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { GuardService } from "./guard.service";
import { CreateGuardDto } from "./dto/create-guard.dto";
import { UpdateGuardDto } from "./dto/update-guard.dto";
import { RoleGuard } from "../guard/role/role.guard";
import { Role, ReqUrl } from "../guard/role/role.decorator";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";

@Controller("guard") // 添加权限守卫
@UseGuards(RoleGuard)
@ApiTags("守卫接口")
@ApiBearerAuth() // 添加bearer 比如token
export class GuardController {
  constructor(private readonly guardService: GuardService) {}

  @Post()
  create(@Body() createGuardDto: CreateGuardDto) {
    return this.guardService.create(createGuardDto);
  }

  @Get()
  @Role("admin")
  @ApiOperation({
    summary: "get",
    description: "获取所有用户列表",
  })
  @ApiQuery({
    name: "name",
    description: "用户名",
  })
  findAll(@Query("name") name?: string, @ReqUrl("123") url?: string) {
    return this.guardService.findAll(name);
  }

  @Get(":id")
  @ApiParam({
    name: "id",
    description: "用户id",
    required: true,
    type: Number,
  })
  findOne(@Param("id") id: string) {
    return this.guardService.findOne(+id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateGuardDto: UpdateGuardDto) {
    return this.guardService.update(+id, updateGuardDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.guardService.remove(+id);
  }
}
```

---

## Prisma ORM

> 内容状态：现有原文较少，已保留发布顺序，等待后续补充。
