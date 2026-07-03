# NestJS项目实战 <Badge type="warning" text="总结于掘金文档" />

---

# 第01章—设计篇：需求分析

## 前言

一般常规的项目立项之初会有一份 **MRD**（Market Requirements Document，市场需求文档）用来判断产品的必需性以及价值等。

对于基础项目开发来说，使用 **MRD** 可能有些重量级，但我们也需要对一个新的基建类型项目做一个简单评估，包括研发必需性、投入的成本以及产生的价值等等。有些轮子是必造，而有些轮子不是。

这一章，我们就来探讨一下：**你的团队需要一个网关系统吗？**

## 应用场景

对于现在主流的后端架构来说，微服务的普及范围还是比较广的，毕竟巨石项目的维护与开发都不太灵活。

以电商服务为例子，一个系统可以拆分成**用户、交易、订单、商品、活动**等多个功能模块，如果全部的功能都维护在一个项目里面，某些可以公用的模块（例如**用户、权限**等）就没办法共享给其他项目，项目的体积与代码复杂度也会逐步上升，导致后期维护与协同的成本逐步增加。

**但上述缺点都不是最主要的问题，最主要的问题是所有功能都放在一个系统里面开发部署，其中任意一个模块出现了问题都可能会导致整个系统雪崩**。

**对于一个应用的稳定性来说，如果没办法对单一的模块做熔断、升级、回滚等操作，线上不可控的概率极大，这也是目前主流采用微服务架构最大的原因之一**。

但是，当一个系统的微服务模块数量非常多的情况下，也经常会出现以下问题：

1. 通用性的认证、鉴权、限流等功能会导致每个微服务都存在造轮子的行为；
2. 业务复杂度上升之后，存在域名分配的问题，没办法对每个服务都分配一个新的域名，同时每一个新的服务上线，运维重复配置的工作量多不少；
3. 太多的域名服务对客户端并不友好，特别是请求层没有做 [BFF](https://zhuanlan.zhihu.com/p/463196408) 的话，每一次拆分新的微服务出来都可能会引起前端的改造；
4. 并非每个服务都是同一种语言或者框架所开发，前面提到的公共的插件并不能满足所有的服务，这个情况可能在 `DevOps` 系统中比较常见。

为了解决上述的问题，网关系统随之诞生。我们可以通过网关的统一入口来调度各个微服务功能模块，使得每个微服务可以关注于自身的业务功能开发。

## 什么是网关系统（Gateway）

**网关系统根据请求类型可以分为**：

1. 静态资源网关：处理前端资源数据包括 **CSR**、**SSR** 等；
2. **API** 网关：随着微服务架构（**MSA**）的普及，通过统一的 **API** 网关可以聚合所有零散的微服务资源，保持统一的出入口，降低多项目的接入成本以及其他项目的使用成本。

**从功能属性上可以分为**：

1. 流量网关：无关业务属性，单纯做安全（黑白名单）、分流（负载均衡）等；
2. 业务网关：用户（认证、鉴权）、服务稳定性（降级、容灾）、业务属性灰度、代理（资源代理、缓存）、统一前置（日志、数据校验）等。

所以，市面上常见的网关系统除了提供**请求聚合功能**之外基本都包含所有通用功能：

- 认证（验证登录态，一般不做鉴权）
- 分流
- 代理（静态资源、**API** 等）
- **AB test** （流量灰度，一般根据 **IP** 或者用户信息灰度）
- 缓存（成本不低，看看就行）
- 等等

## Gateway 功能拆解

通过上面对网关系统的简单了解和分析，我们能够知道，拥有网关系统对团队技术的价值贡献不小。那么如何实现一个网关系统呢？接下来，我们可以根据自己团队情况与需求，对将要实现的网关功能进行拆解，方便后期业务开发。

> 前文也提到了，业务网关最大的价值是与微服务架构的配合，如果后端服务没有使用微服务架构，网关的价值会打一定的折扣，所以是否需要网关服务还要结合团队的架构设计来考虑。同时在需求拆解的过程中要考虑侧重点，例如当前只需要完成前端静态资源转发就没必要去开发后端 **API** 转发的逻辑，可以把架构设计方案做大一点，后面有需求方便拓展，但没必要一次性全部做完，从团队的角度来考虑，寻求 **ROI（投资回报率）** 的最大化。

#### Nginx

`Nginx` 作为专业的 `WEB` 代理服务器，在代理方面能够提供**负载均衡、流量切换**等功能，脚本语言也有 `lua` 支持。

那么 `Nginx` 做不到什么呢？

1. `Nginx` 作为专业的转发服务器，对 `Session` 以及 `Cookie` 的处理比较弱。
2. `Nginx`仅仅支持 `HTTP` 协议（`Email` 不算常用功能）。
3. 虽然可以通过 `Lua` 脚本来处理一些拓展的功能，但是 `Lua` 脚本的变更以及修改 `Nginx` 的配置都需要重新启动无法做到热更新，比较麻烦。
4. 没有可视化管理界面也是一个比较大的硬伤（开源的有一些可视化配置项目，但跟可视化管理有一定的区别与差距）。

#### Gateway

业务性的 `Gateway` 需要做点啥：

1. 统一鉴权收口，通过统一配置给接口资源添加权限；
2. 支持 `RPC` 微服务调用，减少资源消耗；
3. 系统易于监控，同时可以采集收口进来的信息。

通过两者的对比可以看出，`Nginx` 更关注**负载均衡以及反向代理**，对业务部分的侵入很低，而 `Gateway` 作为后端应用，可以携带业务属性，两者可以很好的互补。

在系统架构设计上，我们可以使用 `Nginx` 作为上文所说的流量网关，由 `Nginx` 做一层流量代理，通过负载均衡到 `Gateway` 做业务层的转发处理，这样可以减少我们自建网关系统的工作量。

![网关系统整体架构.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e15b1e4bc0b842a1affeba55594b232d~tplv-k3u1fbpfcp-watermark.image?)

## 我们的网关系统设计

一个完整的网关系统是大而全的，接下来我们将挑选几个比较常见的模块来完成自研 `Gateway` 开发（如果目前团队欠缺或者自己有需求的话，可以接着使用 `demo` 项目继续优化，拓展需要的模块，达到理想可用的状态）：

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f73f00d3e2aa4b779c6539089252c54e~tplv-k3u1fbpfcp-watermark.image?)

由上图可以看出，我们的网关系统架构可以分为两大模块，分别是**代理转发的基础模块**以及独立的**用户模块**。

- **网关基础服务**

因为流量入口已经有 `Nginx` 作负载均衡，我们网关的基础服务就可以专注于代理模块的开发：

1. 专注于前后端资源分发以及不同类型的项目 **API** 分发；
2. 常用资源缓存模块；
3. **AB Test** 模块；
4. 通用日志模块。

- **统一用户中心系统**

用户系统需要提供的功能有：

1. 用户登录、认证等基础功能；
2. 权限系统（基于 **RBAC** 包括角色、系统、资源等权限控制）。

> 如果当前团队中没有统一用户中心的话，建议将用户中心系统优先级提高，作为第一优先级的基建项目，完成之后可以赋能给予其他后端项目用户登录、鉴权的功能，可以减少其他后端基建的很多重复工作量。

- **物料系统**

物料系统主要是针对于静态资源的管理，一般物料系统会跟 **DevOps** 体系关联比较大，毕竟物料会涉及构建部署的过程，但我们的主题并不是 **DevOps**，所以物料系统在小册的占比不会很高，只是作为一个辅助类型的项目为网关服务提供静态资源路由的配置、资源版本的管理等功能。

## 写在最后

本章主要针对网关系统的必要性做了简单分析，介绍了网关系统应用的场景以及网关的类型、作用等，最后针对我们要做的系统进行架构设计与功能拆解。

按照一个完整的项目迭代来说，在架构设计与需求模块都敲定之后，接下来就需要开发同学出技术方案进行项目开发，所以下一章我们将对技术方面的内容进行设计与规划。

如果你有什么疑问，欢迎在评论区提出或者加群沟通。 👏

---

# 第02章—设计篇：技术选型

## 前言

通过上一章的学习，我们了解了网关系统，并且针对要做的功能做了项目架构设计与需求拆解。

那在一个项目正式开发之前，我们还需要做一个技术调研，从开发框架、使用的工具、数据库等等进行一系列的预研，避免在业务开发过程中出现因为技术原因导致完成不了需求的局面。

例如团队中并没有 `Java` 开发，构建工具使用了基于 `Java` 的 `Jenkins`，这个时候想对 `Jenkins` 有一些技术改造要求无法顺利完成。

本章我们就一起对**开发框架**与**数据库**的类型做简单的对比与选择。

> 对于工程中所使用的环境以及中间件配置，感谢后端大佬[和耳朵](https://juejin.cn/user/325111173878983)专门写了一篇介绍的文章配合一下，内容非常全面，需要的同学可以点击查看【[环境与中间件配置](https://juejin.cn/post/7118919471317647397/)】

## 技术选型

### 开发框架选型

市面上常见的网关系统及框架有如下几种。

> 只是举了一些常见的框架，并未全部列出，还有很多其他优秀的框架可以自行找寻

- Nginx+Lua：Open Resty、Abtesting Gateway。
- Java：Spring Cloud Gateway。
- Go：Janus、Grpc-Gateway。
- Node.js：Express Gateway、MicroGateway。

上述都是业内成熟的框架以及方案，并且网关系统作为**独立**于业务的技术中间层，并不存在开发语言与框架的限制，所以可以根据自己团队的实际技术栈选择适合的网关框架。

但对于前端开发者来说，使用其他语言的成本不低。同时为了更好地理解业务需求，我们并不打算使用市面已经开源或者成熟的框架去搭建一个网关系统，而是使用 `JS` 来从头搭建一个网关系统。

既然选择了 `JS` 来开发系统，服务端的开发框架也有很多比如老牌的 `Express`、`Koa` 等可供选择。这里，我们选择基于它俩封装的上层框架 `Egg` 与 `NestJs` 进行简单对比。

#### `Egg` 与 `NestJs` 对比

首先，我们先看看两家的 **Slogan**。

- `Egg`: 为企业级框架和应用而生。
- `NestJS`: 用于构建高效、可伸缩的服务端应用程序的渐进式 **Node.js** 框架。

从 **Slogan** 上我们可以看出， `Egg`更关注**企业**的维度，`NestJS` 更注重**项目**这个维度。

接下来是它们的学习体验。首先是 `Egg`：

1. 文档体验非常棒，毕竟是阿里开源，国人开发的框架，中文文档内容很丰富，使用过程中出现问题，可以很方便地找到对应的内容。
2. 奉行『**约定优于配置**』，按照[一套统一的约定](https://www.eggjs.org/zh-CN/advanced/loader)进行应用开发，团队内部采用这种方式可以减少开发人员的学习与协同成本。
3. 使用的总人数虽然不比 NestJS，但胜在国人多，遇到问题可以咨询的人也会多一些。

接着是 `NestJS`：

1. 中文文档大部分的内容是中文直译，有些内容没有翻译完整或者翻译意境不对。另外，中文版本的内容也会落后英文版本很多，文档资料使用、学习起来会比较麻烦。
2. 使用总人数虽然比 `Egg` 更多一些，但是在国内使用的人数不及 `Egg`，所以很多问题解答中文版本会少于 `Egg`。

#### 技术分析

**Egg**

1. `Egg` 的底层框架是基于 `Koa` 开发，在性能与开发体验上会比 `Express` 更优越。
2. 可选用 `JS` 以及 `TS` 开发，两者都是基于 `Classify` 开发，对刚接触服务端开发的前端更友好。
3. 约定优于配置，减少开发负担、学习以及协作成本。
4. 高度可扩展的插件机制，可以方便定制插件。
5. 内置集群：使用 `Cluster`，自带进程守护、多进程以及进程间通讯等功能。

**NestJS**

1. `NestJS` 的底层框架是基于 `Express` 开发的。
2. 除了 `Express` 之外，`NestJS` 也支持使用 [Fastify](https://github.com/fastify/fastify) 作为底层框架。因为 `NestJS` 的设计理念本身就是一个框架适配器，其主要功能是代理中间件和处理器到适当的特定库应用中，从而达到框架的独立性。
3. `TS` 编程并结合了 `OOP`（面向对象编程），`FP`（函数式编程）和 `FRP`（函数式响应编程）的元素，学习成本会高于 `Egg`，对新手前端友好度不高，再加上文档缺陷，劝退概率倍增。
4. 模块加载方面使用 IoC 模式：模块容器 - 依赖注入(通过装饰器和元数据实现)，开发效率以及维护性会更高。
5. 整个框架的配套功能非常完善例如：鉴权、文档、微服务、`CLI` 工具等。

#### 综合对比

`NestJS` 提供了更多的选择，更加自由以及更偏向后端开发的体验，而 `Egg` 作为深度定制过的框架，自定义的程度会弱于 `NestJS`，在团队初期快速开发业务的时候非常适合。

上述对比并不代表两个框架一定有个高下之分，针对于团队、项目的不同时期，开发人员的能力、喜好，哪一种框架能发挥最大价值，它就是当前对你来说最好的框架。

此外，使用 `Egg` 来对比 `NestJS` 并不是非常合适，两者的设计模式上有差别，理论上应该用另一款 **IoC** 框架 [Midway](http://www.midwayjs.org/) 来对比，不过在 [DevOps](https://juejin.cn/book/6948353204648148995) 小册中我们使用 `Egg` 作为开发框架，所以这本小册优先使用了 `Egg` 作为选型对比。

### 数据库选型

数据库部分，我们主要对比 **MySQL** 和 **MongoDB**。

`MySQL` 作为典型的关系型数据库，支持**单点、集群部署架构**，成熟度非常高。它作为开源数据库拥有非常全的文档与社区资源，出现问题能快速获得对应的帮助，后端首推数据库之一。

但是对于复杂读写操作，需要组合索引查询多表，对性能消耗不小，需要做读写分离或者表结构拆解，对业务架构设计要求比较高。

`MongoDB` 是非关系型数据库、`nosql` 的代表作。它可以通过副本集、分片实现高可用，在集群架构拥有十分**高的扩展性**，但要实现这种高可用对运维的要求比较高。

`MongoDB` **数据处理方式** 是基于内存的，将热数据存在物理内存中，从而达到**高速读写**。由于性能出色，一般用在博客、内容管理等大数据存储的系统中较为合适。

总的来说，这两种数据库各有千秋，我们要根据不同的项目需求来选择合适的数据库。

在之前的架构设计中，我们一共需要开发 **3** 个系统，其中物料系统除了需要保存物料的版本信息之外，还需要存储 `HTML` 这种内容数据，所以**在物料系统中使用 `MongoDB` 无疑是非常好的选择**。**常规的项目如用户中心，针对于权限的管理非常复杂，所以选择 `MySQL` 使用多表关联来存储数据更为合适。**

但是用户中心使用 `MySQL` 作为数据库的话，用户登录信息这种共用的数据就不可能保存在每个 `pod`，而且频繁的读取 `MySQL` 也不太实际。这个时候就需要使用 `Redis` 来做统一缓存，弥补关系型数据的缺陷。`Redis` 是一个高性能的 **key-value** 数据库，一般常用于业务数据缓存的操作。

## 写在最后

本章主要针对项目需求对技术选型做了一些介绍，对于 `Egg` 与 `NestJS` 的篇幅介绍较多，毕竟小册主要还是围绕 `NestJS` 展开的，其他工具详细的介绍与使用会在对应的篇幅再拓展。

此外，一个团队对技术的选择除了适配业务需求，也要考虑团队的整体水平与技术栈。例如，在团队后端的开发语言使用的是 `Go`，那么 `CICD` 工具选择 `Jenkins` 显然不是最优的选择，要考虑到使用与后期维护的问题。同样，如果团队水平梯度不高，就没有必要一定强上 `NestJS`，可以优先选用 `Egg` 这种对前端体验友好的框架，后期过渡升级到 `Midway` 也是合理的技术规划。

如果你有什么疑问，欢迎在评论区提出或者加群沟通。 👏

---

# 第03章—新手篇：熟悉NestJS

## 前言

经过了需求分析以及技术选型之后，我们正式步入了第三个环节：**脚手架搭建**。

**工欲善其事，必先利其器**，`NestJS` 为开发者提供了很多开箱即用的功能，我们可以根据团队的需求搭建一套适配所有业务开发的基础脚手架。因此，接下来的 2 章是基础篇的教学，我将带领大家逐步学习怎么搭建一套基础业务脚手架，便于后期快速开发业务。

> 本章的内容比较基础，如果使用过 NestJs 的同学或者对 IoC 模式熟悉的同学可以快速略过。

## 控制反转 IoC

在之前的介绍中有提到，`NestJS` 作为开发体验上最接近于传统后端的开发框架，其中最大的相同点就是 **IoC**，也就是 `Java` 中经常提到的**控制反转**。

在接下去使用 `NestJS` 的开发过程中会大量接触到 **IoC** 模式，所以先对 **IoC** 做一个简单概念解析，了解一下什么是 **IoC**，以及为什么要使用 **IoC**。

> **控制反转**（Inversion of Control，缩写为 **IoC**）是[面向对象编程](https://baike.baidu.com/item/%E9%9D%A2%E5%90%91%E5%AF%B9%E8%B1%A1%E7%BC%96%E7%A8%8B/254878)中的一种设计原则，可以用来降低计算机[代码](https://baike.baidu.com/item/%E4%BB%A3%E7%A0%81/86048)之间的[耦合度](https://baike.baidu.com/item/%E8%80%A6%E5%90%88%E5%BA%A6/2603938)。其中最常见的方式叫做[依赖注入](https://baike.baidu.com/item/%E4%BE%9D%E8%B5%96%E6%B3%A8%E5%85%A5/5177233)**（Dependency Injection，简称DI**），还有一种方式叫“依赖查找”（Dependency Lookup）。通过控制反转，对象在被创建的时候，由一个调控系统内所有对象的外界实体将其所依赖的对象的引用传递给它。也可以说，依赖被注入到对象中。

如果学过 `Java` 的同学应该会比较熟悉，但如果是前端同学刚刚接触的话，可能会比较陌生，一时间难以上手。纯文字版本的解释难免晦涩，接下来我们用一个简单的小例子来解释 **IoC** 容器的使用：

```js
class A {
  constructor(params) {
    this.params = params;
  }
}

class B extends A {
  constructor(params) {
    super(params);
  }
  run() {
    console.log(this.params);
  }
}

new B("hello").run();
```

我们可以看到，**B** 中代码的实现是需要依赖 **A** 的，**两者的代码耦合度非常高。在两者之间的业务逻辑复杂程度增加的情况下，维护成本与代码可读性都会随着增加，并且很难再多引入额外的模块进行功能拓展**。

为了解决这个情况，我们可以引入一个 **IoC** 容器：

```js
class A {
  constructor(params) {
    this.params = params;
  }
}

class C {
  constructor(params) {
    this.params = params;
  }
}

class Container {
  constructor() {
    this.modules = {};
  }

  provide(key, object) {
    this.modules[key] = object;
  }

  get(key) {
    return this.modules[key];
  }
}

const mo = new Container();

mo.provide("a", new A("hello"));
mo.provide("c", new C("world"));

class B {
  constructor(container) {
    this.a = container.get("a");
    this.c = container.get("c");
  }
  run() {
    console.log(this.a.params + " " + this.c.params);
  }
}

new B(mo).run();
```

如上述代码所示，在引入 **IoC** 容器 `container` 之后，**B** 与 **A** 的代码逻辑已经解耦，可以单独拓展其他功能，也可以方便地加入其他模块 **C**。所以在面对复杂的后端业务逻辑中，引入 **IoC** 可以降低组件之间的耦合度，实现系统各层之间的解耦，减少维护与理解成本。

> 当然，上述的 **Demo** 只是一个非常简单的例子，实际开发过程中场景远比 **Demo** 更加复杂。

## Nest CLI

与所有的主流框架一样，`NestJs` 也有自己的 [Nest CLI](https://github.com/nestjs/nest-cli) 工具，除了提供创建基础模板的功能之外，额外提供了很多方便的功能。

与前端项目的开发模式不同，在后端业务开发中存在着大量可复用或者有规则的模块，善于使用 `CLI` 可以帮助我们节约大量的重复工作，现在我们来一起学一下 `CLI` 的运用。首先看下 `CLI` 提供了多少的功能：

```
$ nest --help
```

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/033026f8259846ee9f491e67fdecdbed~tplv-k3u1fbpfcp-watermark.image?)

如上图所示，运行完 `help` 命令之后，可以使用 `generate` 便捷地生成常用文件，例如**超频使用**的 `Controller` 以及 `Service` 的文件等。

#### 使用规则

除了 `nest --help` 查看全局命令之外，运行`nest <command> --help` 可以查看特定于命令的选项。

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c9409f599ecc40be8c8517f506a37297~tplv-k3u1fbpfcp-watermark.image?)

| 命令       | 别名 | 描述                                                       |
| ---------- | ---- | ---------------------------------------------------------- |
| `new`      | `n`  | 搭建一个新的标准模式应用程序，包含所有需要运行的样板文件。 |
| `generate` | `g`  | 根据原理图生成或修改文件。                                 |

通用的命令选项

| 选项                                  | 描述                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------- |
| `--dry-run`                           | 报告将要进行的更改，但不更改文件系统，别名: -d。                                |
| `--skip-git`                          | 跳过 `git` 存储库初始化，别名: -g。                                             |
| `--skip-install`                      | 跳过软件包安装，别名：-s。                                                      |
| `--package-manager [package-manager]` | 指定包管理器，使用 `npm` 或 `yarn`，必须全局安装包管理器，别名: -p。            |
| `--language [language]`               | 指定编程语言(`TS` 或 `JS`)，别名: -l。                                          |
| `--collection [collectionName]`       | 指定逻辑示意图集合，使用已安装的包含原理的 `npm` 软件包的软件包名称，别名：-c。 |

> 在常规项目中，使用**创建模板和文件这两个命令**最多，所以小册只列举了这两个功能，如果你想了解更多的 `CLI` 功能可以直接查看[源文档](https://docs.nestjs.com/cli/overview)。

#### 配置规则

直接通过 `CLI` 创建的项目根路径下会自动生成一个 `nest-cli.json` 配置文件：

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/141a0784f4754767ab7236d42f5cd7c6~tplv-k3u1fbpfcp-watermark.image?)

```
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "root": "src"
}
```

默认生成的配置文件有如上一些属性：

| 配置属性        | 属性描述                                             |
| --------------- | ---------------------------------------------------- |
| collection      | 用于配置生成部件的 schematics 组合的点，一般无需修改 |
| sourceRoot      | 默认项目根目录                                       |
| ---             | ---                                                  |
| compilerOptions | 编译选项与设置                                       |
| generateOptions | 全局生成的选项和选项的设置                           |
| monorepo        | 启用 monorepo                                        |
| project         | monorepo 模式结构项目配置                            |
| ---             | ---                                                  |
| assets          | 额外文件类型资源处理，非 TS 与 JS 类型               |
| watchAssets     | 是否使用 watch 模式来监控指定资源文件                |

> `monorepo` 模式开发有它的优点，如果是个人维护或者是关联性比较高的项目可以尝试使用 `monorepo` 来开发项目，但是小册选择的网关项目拆出的三个模块虽然有一定的关系，但物料以及用户系统同时还会与 `DevOps` 等其他系统有关联，所以会使用 `multirepo` 维护三个不同的项目，以微服务的模式关联各个模块功能。

## 创建项目工程模板

在查看完 `Nest CLI` 的常用命令之后，可以使用以下命令快速创建一个简单的工程模板：

```
$ npm i -g @nestjs/cli
$ nest new gateway
```

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9be61963c4bf400b925f4445f9fb7f6b~tplv-k3u1fbpfcp-watermark.image?)

#### 项目文件介绍

除去配置常见的配置文件之外，在 `src` 目录下有一些 `NestJS` 标准的文件规范：

```
src
 ├── app.controller.spec.ts
 ├── app.controller.ts
 ├── app.module.ts
 ├── app.service.ts
 └── main.ts
```

| 文件名            | 文件描述                                                                 |
| ----------------- | ------------------------------------------------------------------------ |
| app.controller.ts | 常见功能是用来处理 http 请求以及调用 service 层的处理方法                |
| app.module.ts     | 根模块用于处理其他类的引用与共享。                                       |
| app.service.ts    | 封装通用的业务逻辑、与数据层的交互（例如数据库）、其他额外的一些三方请求 |
| main.ts           | 应用程序入口文件。它使用 `NestFactory` 用来创建 Nest 应用实例。          |

在后续开发项目的过程中，使用约定俗成的 `name.[type]` 规则来创建对应的类型文件，便于查找对应的模块。

#### 第一个 http 请求

依赖安装完毕之后，可以使用如下命令启动 `NestJS` 应用，然后浏览器即可访问 [http://localhost:3000/](http://localhost:3000/) ：出现如下界面即代表项目已经正常启动了。

```
$ npm run start
```

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fd6ca06553cc45f18162ce05b100cef3~tplv-k3u1fbpfcp-watermark.image?)

服务正常启动之后，接下来我们要开始写下第一个功能【用户模块】。

首先运行如下命令，`CLI` 会快速帮助我们自动生成一个用户的 `UserController`

```
$ nest g co user
```

不过此命令同时也会生成后缀为 `spec` 的测试文件，虽然有测试功能非常好，但在快速开发过程中，并非每一个功能都需要自动化测试覆盖，只要保证主要的功能有用例覆盖即可。

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/695e104a35584d0983d4705b3cdfdff4~tplv-k3u1fbpfcp-watermark.image?)

如果不需要每一次生成 `spec` 文件，可以在根目录下的 `nest-cli.json` 添加如下配置，禁用测试用例生成，后续再使用 `CLI` 创建 `Controller` 或者 `Service` 类型文件的时候，将不会继续生成：

```
  "generateOptions": {
    "spec": false
  }
```

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8e4056a6db47430ba49fa4f537e1a442~tplv-k3u1fbpfcp-watermark.image?)

回归正题，在创建 `UserController` 的同时 `CLI` 也会自动在 `app.module.ts` 里面帮我们注册好 `Controller`。整个过程非常简便，只要在 `UserController` 写下第一个 `http` 请求即可。

```
import { Controller, Get } from '@nestjs/common';

@Controller('user')
export class UserController {
  @Get()
  getHello(): string {
    return 'hello, world!';
  }
}
```

等待程序重新编译运行完毕之后，在浏览器输入 http://localhost:3000/user 访问即可看到：【**你好，世界！**】

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/309b5021d7514ac1ac16ee667c97485c~tplv-k3u1fbpfcp-watermark.image?)

#### 第一个 CURD

在小试牛刀之后，下面我们要开始借助 `CLI` 的能力快速生成 `CURD` 模块：

- 生成一个模块 (nest g mo) 来组织代码，使其保持清晰的界限（Module）。
- 生成一个控制器 (nest g co) 来定义 CRUD 路径（Controller）。
- 生成一个服务 (nest g s) 来表示/隔离业务逻辑（Service）。
- 生成一个实体类/接口来代表资源数据类型（Entity）。

可以看出一个最简单的 `CURD` 涉及的模块也会非常多（至少需要以上四个模块才能完成一个基础的 `CURD` 功能），并且要运行多个命令才能得到想要的结果，所幸 `Nest CLI` 已经集成了这样的功能来帮助我们减少重复的工作量：

```
$ nest g resource user
```

> 之前我们已经生成 `user` 的 `controller` 文件，所以在使用此条命令之前需要将之前生成的 `user` 目录全部删除，同时删除 `app.module.ts` 中的 `UserController` 引入。

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/83e636a4559c47feb3f7f297fdb81c5f~tplv-k3u1fbpfcp-watermark.image?)

> 第一次使用这个命令的时候，除了生成文件之外还会自动使用 `npm` 帮我们更新资源，安装一些额外的插件，后续再次使用就不会更新了。

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1ada9368017b496d956fecdf78b4d8f7~tplv-k3u1fbpfcp-watermark.image?)

安装依赖之后可以看到，我们借助 `Nest CLI` 快速生成了一套标准的 `CURD` 模块甚至 `dto` 文件也一并生成了，后续只需要更新用户模块的业务逻辑即可。

## 写在最后

本章主要是介绍了 **IoC** 设计模式以及如何借助 `CLI` 创建了简单的工程模板与 `CURD` 模块。可以看到， `Nest CLI` 对比其他一些 `CLI` 工具在针对开发功能优化这块做得非常不错，特别是模块生成跟自动注册这块逻辑。不过，也是基于后端有一套规则可循这些功能才能实现，这也正是前后端项目不太一样的地方。

虽然 `NestJs` 提供了一个简单的工程模板，但这个模板离实际可用的工程差距还有点大，接下来将与大家一起逐步添加对应的功能，使之达到一个符合实际项目开发要求的模板。

> 基础篇的内容大部分都是围绕着 `NestJS` 提供的功能模块开发，所以有一些细节的部分可以参考 `NestJS` 的英文文档一起阅读，小册中使用到的部分会尽可能讲解得详细一点。

本章的 **Demo** 地址放在 [demo/v1](https://github.com/boty-design/gateway/tree/demo/v1)，需要的同学自取。

如果你有什么疑问，欢迎在评论区提出或者加群沟通。 👏

---

# 第04章—配置篇：基础功能配置

## 前言

在上一章节中，我们学习了 `NestJS CLI` 的用法，得到了一套基础的项目工程。最开始做项目对比的时候也提到过，`NestJS` 作为一款**自定义程度较高**的框架，`CLI` 直接提供的基础功能虽然并不完善，但同时也为开发者提供了非常多的内置或配套的功能例如**高速缓存、日志拦截、过滤器、微服务**等多种模块，方便开发者根据自身的业务需求定制适合当前业务的工程。

本章将根据业务需求或者团队规范，选择对应的模块搭建出一个符合要求的通用性脚手架。

## Fastify

对于网关系统来说，无论是资源还是 `API` 接口数据，它都将承担所有的请求转发，虽然外层可以有 `Nginx` 做负载均衡策略，但如果框架本身的性能越好，业务实现的效果就会越好，同时对业务代码要求也可以稍微降低一点。

> 框架或者语言带来的性能提升还是非常重要的。可以给大家举一个明显的例子，**Windows** 自带的 `VBS` 脚本可以操作 **Excel**，`Java` 或者其他语言框架也可以操作 **Excel**。但是，其他语言的操作效率会远超 `VBS`，即使是在操作更为复杂或者文件读写内容更多的情况下。这里我们并不去深究为什么其他语言的速度会更快，但是对于一个快速迭代的业务项目或者小团队来说，选择效率高、性能高的框架作为开发语言无疑是降低整体成本最好的一种方式。

而 `Nest` 作为一个上层框架，可以通过适配器模式使得底层可以兼容任意 `HTTP` 类型的 `Node` 框架，本身内置的框架有两种 [Express](https://expressjs.com/) 与 [Fastify](https://www.fastify.io/)。

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c3aaf3b9e3b64b6ca5bd0afb3d7b1d4b~tplv-k3u1fbpfcp-watermark.image?)

如上图所示，`Fastify` 与其他主流 `HTTP` 框架对比，其在 **QPS**(**并发处理请求**)的效率上要远超其他框架，达到了几乎两倍的基准测试结果，所以在网关系统这个对性能要求非常高的项目中使用 `Fastify` 无疑是一种非常好的选择。

> 当然具体的性能开销、优化大部分还是依赖业务复杂度以及代码质量，框架能够提供的是只是一层基础架构。能从这层架构上搭建出什么样的产品，取决于开发者自身。同时，我并不是鼓励所有的项目都使用 `Fastify`，在业务复杂度以及对性能要求并非十分敏感的项目中，`Express` 也是一种非常好的选择。作为老牌的框架，它经历了非常多的大型项目实战的考验以及长期的迭代，所以 `Express` 社区生态非常的丰富，遇到任何的问题都可以快速找到解决方案，这也是 `NestJS` 采用 `Express` 作为默认基础框架的原因。

介绍完 `Fastify` 的优势之后，接下来我们开始着手改造模板项目框架。首先，通过 `CLI` 默认生成的项目框架中，底层平台使用的是 `Express`，代码如下所示：

```ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
```

毕竟 `Fastify` 作为唯二内置的平台，整体的替换过程会非常顺畅。首先，安装对应的适配器依赖 `@nestjs/platform-fastify`。其次，使用 `FastifyAdapter` 替换默认的 `Express` 。

```ts
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  await app.listen(3000);
}
bootstrap();
```

## 版本控制

之前学习过 **DevOps** 小册的同学，应该对 [GitLab OpenApi](https://docs.gitlab.com/ee/api/) 比较熟悉，肯定也使用过这样的请求 **https://gitlab.example.com/api/v4/projects** ，可以看出链接上面是带 v4 版本的。

因为我们有两种项目分别是**物料**与**用户**，这两款系统作为基础应用，后期也会对其他的项目提供类似的 Open Api，同时避免不了升级之后，需要兼容老项目的情况。此时就会存在多种版本的 Api，所以我们也在工程添加版本控制来避免未来升级的时候，造成其他系统崩溃。

#### 单个请求控制

**第一步**：在 `main.ts` 启用版本配置：

```ts
import { VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // 接口版本化管理
  app.enableVersioning({
    type: VersioningType.URI,
  });

  await app.listen(3000);
}
bootstrap();
```

**第二步**：启用版本配置之后再在 `Controller` 中请求方法添加对应的版本号装饰器：

```ts
import { Controller, Version } from '@nestjs/common';

  @Get()
  @Version('1')
  findAll() {
    return this.userService.findAll();
  }
```

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2015a74a73e04d32a9672c9a46e508c8~tplv-k3u1fbpfcp-watermark.image?)

配置完毕之后从上图可以看到，只有携带了版本号的请求 http://localhost:3000/v1/user 能正常返回数据，而之前未携带版本号的请求 http://localhost:3000/user 返回了 404 错误。

除了针对某一个请求添加版本之外，同样也可以添加全局以及整个 `Controller` 的版本，具体的版本配置规则可以根据自己的实际需求取舍。

#### 全局配置请求控制

**第一步**：修改 `enableVersioning` 配置项：

```diff
app.enableVersioning({
+   defaultVersion: '1',
    type: VersioningType.URI,
});
```

**第二步**：修改 `Controller` 的配置，在 `Controller` 装饰器中添加 `version` 属性：

```diff
- @Get()
- @Version('1')
+ @Controller({
+  path: 'user',
+  version: '1',
+ })
```

完成上述的操作就可以对一整个 `Controller` 进行版本控制。但有的时候，我们需要做针对一些接口做兼容性的更新，而其他的请求是不需要携带版本，又或者请求有多个版本的时候，而默认请求想指定一个版本的话，我们可以在 `enableVersioning` 添加 `defaultVersion` 参数达到上述的要求：

```diff
+ import { VersioningType, VERSION_NEUTRAL } from '@nestjs/common';
  app.enableVersioning({
-    defaultVersion: '1',
+    defaultVersion: [VERSION_NEUTRAL, '1', '2']
  });
```

```ts
  @Get()
  @Version([VERSION_NEUTRAL, '1'])
  findAll() {
    return this.userService.findAll();
  }

  @Get()
  @Version('2')
  findAll2() {
    return 'i am new one';
  }
```

接下来分别访问对应的请求http://localhost:3000/user 与 http://localhost:3000/v2/user 可以获取到如下的返回值：

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/38d458d6dedc49a7949b5cd0d84def5b~tplv-k3u1fbpfcp-watermark.image?)

## 全局返回参数

在配置版本的过程中，也不断地测试了很多次接口，不难发现返回的接口数据非常的不标准，在一个正常的项目中不太合适用这种数据结构返回，毕竟这样对前端不友好，也不利于前端做统一的拦截与取值，所以需要格式化请求参数，输出统一的接口规范。

一般正常项目的返回参数应该包括如下的内容：

```json
{
    data, // 数据
    status: 0, // 接口状态值
    extra: {}, // 拓展信息
    message: 'success', // 异常信息
    success：true // 接口业务返回状态
}
```

想要输出上述标准的返回参数格式的话：

**第一步**：新建 `src/common/interceptors/transform.interceptor.ts` 文件：

```ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

interface Response<T> {
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => ({
        data,
        status: 0,
        extra: {},
        message: "success",
        success: true,
      })),
    );
  }
}
```

**第二步**：修改 `main.ts` 文件，添加 `useGlobalInterceptors` 全局拦截器，处理返回值

```diff
+ import { TransformInterceptor } from './common/interceptors/transform.interceptor';
// 统一响应体格式
+ app.useGlobalInterceptors(new TransformInterceptor());
```

然后我们再次访问之前的请求，就能获取到标准格式的接口返回值了：

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/826099eac0d4471b922d919d64e6040e~tplv-k3u1fbpfcp-watermark.image?)

## 全局异常拦截

处理完正常的返回参数格式之后，对于异常处理也应该做一层标准的封装，这样利于开发前端的同学统一处理这类异常错误。

**第一步**：新建 `src/common/exceptions/base.exception.filter.ts` 与 `http.exception.filter.ts` 两个文件，从命名中可以看出它们分别处理**统一异常**与 `HTTP` 类型的接口相关异常。

`base.exception.filter` => **`Catch` 的参数为空时，默认捕获所有异常**

```ts
import { FastifyReply, FastifyRequest } from "fastify";

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  ServiceUnavailableException,
  HttpException,
} from "@nestjs/common";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    request.log.error(exception);

    // 非 HTTP 标准异常的处理。
    response.status(HttpStatus.SERVICE_UNAVAILABLE).send({
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: new ServiceUnavailableException().getResponse(),
    });
  }
}
```

`http.exception.filter.ts` => `Catch` 的参数为 `HttpException` 将只捕获 `HTTP` 相关的异常错误

```ts
import { FastifyReply, FastifyRequest } from "fastify";
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from "@nestjs/common";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();
    const status = exception.getStatus();

    response.status(status).send({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.getResponse(),
    });
  }
}
```

**第二步**：在 `main.ts` 文件中添加 `useGlobalFilters` 全局过滤器：

```diff
+ import { AllExceptionsFilter } from './common/exceptions/base.exception.filter';
+ import { HttpExceptionFilter } from './common/exceptions/http.exception.filter';
  // 异常过滤器
+ app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());
```

> **这里一定要注意引入自定义异常的先后顺序，不然异常捕获逻辑会出现混乱**。

完成上述操作之后开始检验是否配置正常。首先访问一个不存在的接口 http://localhost:3000/test ，此时可以对比自定义与原生的异常返回参数区别。

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b0b8f5e7f9b24dcaacf33ab10d88f613~tplv-k3u1fbpfcp-watermark.image?)

验证完 `HTTP` 异常之后，我们接着在 `UserController` 中伪造一个程序运行异常的接口，来验证常规异常是否能被正常捕获：

```
  @Get('findError')
  @Version([VERSION_NEUTRAL, '1'])
  findError() {
    const a: any = {}
    console.log(a.b.c)
    return this.userService.findAll();
  }
```

再次访问 http://localhost:3000/user/findError ，此时可以看到原生与自定义返回的异常错误存在一定的区别了。

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/23892fd1a32e4e4cba805df4e3bf7892~tplv-k3u1fbpfcp-watermark.image?)

除了全局异常拦截处理之外，我们需要再新建一个 `business.exception.ts` 来处理业务运行中预知且主动抛出的异常：

```ts
import { HttpException, HttpStatus } from "@nestjs/common";
import { BUSINESS_ERROR_CODE } from "./business.error.codes";

type BusinessError = {
  code: number;
  message: string;
};

export class BusinessException extends HttpException {
  constructor(err: BusinessError | string) {
    if (typeof err === "string") {
      err = {
        code: BUSINESS_ERROR_CODE.COMMON,
        message: err,
      };
    }
    super(err, HttpStatus.OK);
  }

  static throwForbidden() {
    throw new BusinessException({
      code: BUSINESS_ERROR_CODE.ACCESS_FORBIDDEN,
      message: "抱歉哦，您无此权限！",
    });
  }
}
```

```ts
export const BUSINESS_ERROR_CODE = {
  // 公共错误码
  COMMON: 10001,
  // 特殊错误码
  TOKEN_INVALID: 10002,
  // 禁止访问
  ACCESS_FORBIDDEN: 10003,
  // 权限已禁用
  PERMISSION_DISABLED: 10003,
  // 用户已冻结
  USER_DISABLED: 10004,
};
```

简单改造一下 `HttpExceptionFilter`，在处理 `HTTP` 异常返回之前先处理业务异常：

```ts
import { FastifyReply, FastifyRequest } from "fastify";
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { BusinessException } from "./business.exception";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();
    const status = exception.getStatus();

    // 处理业务异常
    if (exception instanceof BusinessException) {
      const error = exception.getResponse();
      response.status(HttpStatus.OK).send({
        data: null,
        status: error["code"],
        extra: {},
        message: error["message"],
        success: false,
      });
      return;
    }

    response.status(status).send({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.getResponse(),
    });
  }
}
```

> 由于异常拦截的返回函数使用的是 `Fastify` 提供的，所以我们使用的返回方法是 `.send（）`，如果你没有使用 `Fastify` 作为 `HTTP` 底层服务的话，拦截返回的方法要保持跟官网一致（官网默认的是 `Express` 的框架，所以返回方法不一样）。

完成配置之后，我们继续在 `UserController` 中重新伪造一个业务异常的场景：

```diff
+ import { BusinessException } from 'src/common/exceptions/business.exception';

  @Get('findBusinessError')
  @Version([VERSION_NEUTRAL, '1'])
  findBusinessError() {
    const a: any = {}
    try {
      console.log(a.b.c)
    } catch (error) {
      throw new BusinessException('你这个参数错了')
    }
    return this.userService.findAll();
  }
```

访问接口 http://localhost:3000/user/findBusinessError ，可以看到能够返回我们预期的错误了。

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/44e2d881639342428a05875258e7dba3~tplv-k3u1fbpfcp-watermark.image?)

> 自定义业务异常的优点在于，当你的业务逻辑复杂到一定的地步，在任意的一处出现可预知的错误，此时可以直接抛出异常让用户感知，不需要写很多冗余的返回代码。

异常拦截、全局返回参数修改以及替换 `Fastify` 框架的代码已上传 [demo/v2](https://github.com/boty-design/gateway/tree/demo/v2)， 需要的同学可以自取。

## 环境配置

一般在项目开发中，至少会经历过 `Dev` -> `Test` -> `Prod` 三个环境。如果再富余一点的话，还会再多一个 `Pre` 环境。甚至在不差钱的情况下，每个环境可能都会有**多套配置**。那么对应的使用的数据库、`Redis` 或者其他的配置项都会随着环境的变换而改变，所以在实际项目开发中，多环境的配置非常必要。

#### 自带环境配置

`NestJS` 本身也自带了多环境配置方法

1. 安装 `@nestjs/config`

```
$ yarn add  @nestjs/config
```

2. 安装完毕之后，在 `app.module.ts` 中添加 `ConfigModule` 模块

```ts
import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UserModule } from "./user/user.module";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [ConfigModule.forRoot(), UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

`@nestjs/config` 默认会从**项目根目录**载入并解析一个 `.env` 文件，从 `.env` 文件和 `process.env` 合并环境变量键值对，并将结果存储到一个可以通过 `ConfigService` 访问的私有结构。

`forRoot()` 方法注册了 `ConfigService` 提供者，后者提供了一个 `get()` 方法来读取这些**解析/合并**的配置变量。

> 当一个键同时作为环境变量（例如，通过操作系统终端如`export DATABASE_USER=test`导出）存在于运行环境中以及`.env`文件中时，以运行环境变量优先。

默认的 `.env` 文件变量定义如下所示，配置后会默认读取此文件:

```
DATABASE_USER=test
DATABASE_PASSWORD=test
```

#### 自定义 YAML

虽然 `Nest` 自带了环境配置的功能，使用的 [dotenv](https://github.com/motdotla/dotenv) 来作为默认解析，但默认配置项看起来并不是非常清爽，我们接下来使用结构更加清晰的 `YAML` 来覆盖默认配置。

> 想要了解 `YAML` 更多细节的同学可以点击[链接](https://baike.baidu.com/item/YAML/1067697)看下，如果使用过 `GitLab CICD` 的同学，应该对 `.yml` 文件比较熟悉了，这里我就不对 `YAML` 配置文件做过多阐述了。

1. 在使用自定义 `YAML` 配置文件之前，先要修改 `app.module.ts` 中 `ConfigModule` 的配置项 `ignoreEnvFile`，禁用默认读取 `.env` 的规则：

```
ConfigModule.forRoot({ ignoreEnvFile: true, });
```

2. 然后再安装 `YAML` 的 `Node` 库 `yaml`：

```
$ yarn add yaml
```

3. 安装完毕之后，在根目录新建 `.config` 文件夹，并创建对应环境的 `yaml` 文件，如下图所示：

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/71e2c740648641b499440a0bd0038e31~tplv-k3u1fbpfcp-watermark.image?)

4. 新建 `utils/index.ts` 文件，添加读取 `YAML` 配置文件的方法：

```ts
import { parse } from "yaml";
const path = require("path");
const fs = require("fs");

// 获取项目运行环境
export const getEnv = () => {
  return process.env.RUNNING_ENV;
};

// 读取项目配置
export const getConfig = () => {
  const environment = getEnv();
  const yamlPath = path.join(process.cwd(), `./.config/.${environment}.yaml`);
  const file = fs.readFileSync(yamlPath, "utf8");
  const config = parse(file);
  return config;
};
```

5. 最后添加在 `app.module.ts` 自定义配置项即可正常使用环境变量：

```diff
+ import { getConfig } from './utils';
    ConfigModule.forRoot({
      ignoreEnvFile: true,
+     isGlobal: true,
+     load: [getConfig]
    }),
```

> 注意：`load` 方法中传入的 `getConfig` 是一个函数，并不是直接 JSON 格式的配置对象，直接添加变量会报错。

#### 使用自定义配置

完成之前的配置后，就可以使用 `cross-env` 指定运行环境来使用对应环境的配置变量。

1. 添加 cross-env 依赖：

```shell
$ yarn add cross-env
```

2. 修改启动命令：

```
"start:dev": "cross-env RUNNING_ENV=dev nest start --watch",
```

3. 添加 .dev.yaml 配置:

```
TEST_VALUE:
  name: cookie
```

> 注意 `yaml` 配置的规则，缩进以及冒号 **:** 后的空格是经常容易出错的地方

4. 在我们之前创建好的 `UserController` 中添加 `ConfigService` 以及新的请求：

```ts
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  @Get("getTestName")
  getTestName() {
    return this.configService.get("TEST_VALUE").name;
  }
}
```

完成上述所有步骤之后，重启项目，接下来访问 http://localhost:3000/v1/user/getTestName 能看到已经能够根据环境变量拿到对应的值：

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fc2fc65526944018b70040715cbcb340~tplv-k3u1fbpfcp-watermark.image?)

> 这里应该注意到，我们并没有注册 `ConfigModule`。这是因为在 `app.module` 中添加 `isGlobal` 属性，开启 `Config` 全局注册，如果 `isGlobal` 没有添加的话，则需要先在对应的 `module` 文件中注册后才能正常使用 `ConfigService`。

> 项目配置的相关代码已上传 [demo/v3](https://github.com/boty-design/gateway/tree/demo/v3) 分支中，需要的同学自取。由于 `.config` 里面的配置信息比较隐私，所以不会上传到 `git` 当中，需要的同学可以在[第九章节-学习里程碑](https://juejin.cn/book/7065201654273933316/section/7111992826132430859)中获取对应的模板。

## 热重载

`NestJS` 的 `dev` 模式是将 `TS` 代码编译成 `JS` 再启动，这样每次我们修改代码都会重复经历一次编译的过程。在项目开发初期，业务模块体量不大的情况下，性能开销并不会有很大的影响，但是在业务模块增加到一定数量时，每一次更新代码导致的重新编译就会异常痛苦。为了避免这个情况，`NestJS` 也提供了热重载的功能，借助 `Webpack` 的 `HMR`，使得每次更新只需要替换更新的内容，减少编译的时间与过程。

> 注意：`Webpack`并不会自动将（例如 `graphql` 文件）复制到 `dist` 文件夹中。同理，`Webpack` 与静态路径（例如 `TypeOrmModule` 中的 `entities` 属性）不兼容。所以如果有同学跳过本章，直接配置了 `TypeOrmModule` 中的 `entities`，反过来再直接配置热重载会导致启动失败。

由于我们是使用 `CLI` 插件安装的工程模板，可以直接使用 `HotModuleReplacementPlugin` 创建配置，减少工作量。

1. 照例安装所需依赖：

```
$ yarn add webpack-node-externals run-script-webpack-plugin webpack
```

2. 根目录新建 `webpack-hmr.config.js` 文件，复制下述代码：

```js
const nodeExternals = require("webpack-node-externals");
const { RunScriptWebpackPlugin } = require("run-script-webpack-plugin");

module.exports = function (options, webpack) {
  return {
    ...options,
    entry: ["webpack/hot/poll?100", options.entry],
    externals: [
      nodeExternals({
        allowlist: ["webpack/hot/poll?100"],
      }),
    ],
    plugins: [
      ...options.plugins,
      new webpack.HotModuleReplacementPlugin(),
      new webpack.WatchIgnorePlugin({
        paths: [/.js$/, /.d.ts$/],
      }),
      new RunScriptWebpackPlugin({ name: options.output.filename }),
    ],
  };
};
```

3. 修改 `main.ts`，开启 `HMR` 功能：

```ts
declare const module: any;

async function bootstrap() {
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
```

4. 修改启动脚本启动命令即可：

```
"start:hotdev": "cross-env RUNNING_ENV=dev nest build --webpack --webpackPath webpack-hmr.config.js --watch"
```

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d7b960fe772e404cbac3276e5e167db9~tplv-k3u1fbpfcp-watermark.image?)

然后修改一段简单的代码（随意修改即可），测试一下热更新的是否正常生效：

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/659b2d68c1d145d1b3a7f5bfff96ee98~tplv-k3u1fbpfcp-watermark.image?)

如上图所示，我们已经开启了 `HMR` 功能，具体什么时候使用可以根据自己的项目以及喜好开启，如果没有使用 `CLI` 创建的工程模板，但也想开启 `HMR` 功能的话，可以根据[文档](https://docs.nestjs.cn/8/recipes?id=%e6%b2%a1%e6%9c%89%e4%bd%bf%e7%94%a8-cli) 自行配置。

> 热更新的功能看自己的需求再开启，有的时候存在缓存的情况出现，**另外，在使用热更新的时候，数据库章节中实体类需要手动注册，不能自动注册**，所以如果项目不大的啥情况，使用 **NestJS** 自带的项目启动脚本即可。

## 文档

作为一个后端服务，**API** 文档是必不可少的，除了接口描述、参数描述之外，自测也十分方便。`NestJS` 自带了 `Swagger` 文档，集成非常简单，接下来进行文档的配置部分。

1. 工程之前使用了 `fastify` 所以需要安装以下依赖：

```
$ yarn add @nestjs/swagger
```

> 新版本已经不需要安装 fastify-swagger 依赖，默认被内置在 `@nestjs/swagger` 中了。

2. 依赖安装完毕之后，先创建 `src/doc.ts` 文件：

```ts
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import * as packageConfig from "../package.json";

export const generateDocument = (app) => {
  const options = new DocumentBuilder()
    .setTitle(packageConfig.name)
    .setDescription(packageConfig.description)
    .setVersion(packageConfig.version)
    .build();

  const document = SwaggerModule.createDocument(app, options);

  SwaggerModule.setup("/api/doc", app, document);
};
```

> 为了节约配置项，`Swagger` 的配置信息全部取自 `package.json`，有额外需求的话可以自己维护配置信息的文件。

默认情况下，在 `TS` 开发的项目中是没办法导入 `.json` 后缀的模块，所以可以在 `tsconfig.json` 中新增 `resolveJsonModule` 配置即可。

```diff
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "es2017",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false,
+   "resolveJsonModule": true
  }
}
```

4. 在 `main.ts` 中引入方法即可：

```diff
import { VersioningType, VERSION_NEUTRAL } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/exceptions/base.exception.filter';
import { HttpExceptionFilter } from './common/exceptions/http.exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
+ import { generateDocument } from './doc';

declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // 统一响应体格式
  app.useGlobalInterceptors(new TransformInterceptor());

  // 异常过滤器
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

  // 接口版本化管理
  app.enableVersioning({
    defaultVersion: [VERSION_NEUTRAL, '1', '2'],
    type: VersioningType.URI,
  });

+  // 创建文档
+  generateDocument(app)

  // 添加热更新
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }

  await app.listen(3000);
}
bootstrap();
```

完成上述内容之后，浏览器打开 http://localhost:3000/api/doc 就能看到 `Swagger` 已经将我们的前面写好的接口信息收集起来了。

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/777e652772fe47ce8ea0ac87dd17812e~tplv-k3u1fbpfcp-watermark.image?)

> 从上图可以看出，`Swagger` 会默认收集我们的接口信息，但是没有描述与分类，使用上很不方便，由于使用过程中的细节较多，具体的配置细节可以从[官网文档](https://docs.nestjs.cn/8/recipes?id=swagger)获取。

> 热更新与 `Swagger` 文档配置代码以上传 [demo/v4](https://github.com/boty-design/gateway/tree/demo/v4)，需要的同学可以自取。

## 写在最后

本章主要介绍了，对 `CLI` 创建的标准工程模板进行一些常规项目必备的功能配置，例如替换底层 `HTTP` 框架、环境变量配置等等内容。

添加了上述**通用性基础配置**后的工程模板能基本满足一个小型的业务需求，如果还有其他要求的话可以增减功能或者修改某些配置来适配，总体还是看**团队自身的业务需求来定制**，比如团队中有`统一权限控制的插件`或者`构建服务的脚本`都可以放在工程模板中，方便其他同学开箱即用。

现在，我们已经对 `NestJS` 有了初步了解。下一章，我们将正式使用 `NestJS` 开发业务需求。

如果你有什么疑问，欢迎在评论区提出或者加群沟通。 👏

---

# 第05章—工具篇：飞书应用对接

## 前言

在上一章中，我们对 **CLI** 创建的基础工程模板添加了一些通用性的功能配置，也能满足大部分业务开发的需求。

在完成了基础配置之后，就可以根据自身团队的情况来开发专属的业务功能，例如团队中使用企业微信、钉钉、飞书等企业工具，可以对接匹配的三方功能。在用户系统中，为了开发便捷以及方便团队的使用，我们可以借助三方登录帮助获取团队和个人的信息。另外上述几个三方软件也提供了很多便捷的功能，例如机器人、消息通知、文档等。

在 [DevOps 小册](https://juejin.cn/book/6948353204648148995)中，使用钉钉作为三方拓展，为了带给大家不一样的学习体验，这次将使用飞书作为用例来完成我们用户、机器人等功能。

## 飞书应用对接

### 创建应用

要利用飞书的功能，首先要去[开放平台](https://open.feishu.cn/app)创建一个飞书应用，如下图所示：

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/bfe6b0b9245341da933be8c9c2f86091~tplv-k3u1fbpfcp-watermark.image?)

创建完毕之后，需要拿到飞书应用的 **App ID**（应用唯一的 ID 标识） 与 **App Secret**（应用的密钥） 才能调用飞书的 **Open API**。

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/348117865caf41b09d9bdd7be54f82b3~tplv-k3u1fbpfcp-watermark.image?)

### 封装底层请求库

虽然 `NestJS` 内置了 `@nestjs/axios` 请求库，但是对于飞书的 `Open API` 封装，我们还是利用之前的模式，不将它与 `NestJS` 过度的耦合在一起。

> 将飞书 **Open Api** 独立封装之后，可以抽成一个工具库，后期可以提供给其他的 `SDK` 使用，如果跟 `NestJS` 耦合过多，再想提供给其他 `SDK` 使用，就只能提供 `HTTP` 请求调用的方式，这样使用起来不太方便。看个人习惯，我倾向使用独立封装的模式。

1. 添加应用配置，使用上一章节的环境配置功能，在 `yaml` 文件中添加飞书的配置项：

```
FEISHU_CONFIG:
  FEISHU_URL: https://open.feishu.cn/open-apis
  FEISHU_API_HOST: https://open.feishu.cn
  FEISHU_APP_ID: balabalabala
  FEISHU_APP_SECRET: balabalabala
```

> **ID** 与 **Secret** 的信息记得妥善保管，如果你创建的应用权限过高的话，意外泄密可能会导致不可预期的损失，**切记**！

2. 新建 `utils/request.ts` 文件：

```ts
import axios, { Method } from "axios";
import { getConfig } from "@/utils";

const {
  FEISHU_CONFIG: { FEISHU_URL },
} = getConfig();

/**
 * @description: 任意请求
 */
const request = async ({ url, option = {} }) => {
  try {
    return axios.request({
      url,
      ...option,
    });
  } catch (error) {
    throw error;
  }
};

interface IMethodV {
  url: string;
  method?: Method;
  headers?: { [key: string]: string };
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
}

export interface IRequest {
  data: any;
  code: number;
}

/**
 * @description: 带 version 的通用 api 请求
 */
const methodV = async ({
  url,
  method,
  headers,
  params = {},
  query = {},
}: IMethodV): Promise<IRequest> => {
  let sendUrl = "";
  if (/^(http:\/\/|https:\/\/)/.test(url)) {
    sendUrl = url;
  } else {
    sendUrl = `${FEISHU_URL}${url}`;
  }
  try {
    return new Promise((resolve, reject) => {
      axios({
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          ...headers,
        },
        url: sendUrl,
        method,
        params: query,
        data: {
          ...params,
        },
      })
        .then(({ data, status }) => {
          resolve({ data, code: status });
        })
        .catch((error) => {
          reject(error);
        });
    });
  } catch (error) {
    throw error;
  }
};

export { request, methodV };
```

> 这里跟之前一样，封装了两种请求方法，一种是植入飞书请求的版本，另一种是自由请求，这个习惯也看个人，如果自己的项目不需要自由请求或者直接使用 `@nestjs/axios` 的请求模块的话，可以把 `request` 方法删除。

此外上述引用中，使用了 `alias @`，正常情况也是不会被 `TS` 项目识别，需要在 tsconfig.json 配置文件中添加 `path` 参数：

```diff
{
  "compilerOptions": {
+    "paths": {
+      "@/*": [
+        "src/*"
+      ],
+    },
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "es2017",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false,
    "resolveJsonModule": true
  }
}
```

3. 创建飞书请求基础层，如下图所示：

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5940e9416a8d4b4aa34c7fb4e0c8edf7~tplv-k3u1fbpfcp-watermark.image?)

上图中封装的模块比较少，只有权限、用户等模块，实际开发中需要按照业务需求选择性封装对应的模块，比如群组、消息、通讯录等等。下面以获取 `Token` 的方法做一个简单的示例：

```ts
import { APP_ID, APP_SECRET } from "./const";
import { methodV } from "src/utils/request";

export type GetAppTokenRes = {
  code: number;
  msg: string;
  app_access_token: string;
  expire: number;
};

export const getAppToken = async () => {
  const { data } = await methodV({
    url: `/auth/v3/app_access_token/internal`,
    method: "POST",
    params: {
      app_id: APP_ID,
      app_secret: APP_SECRET,
    },
  });
  return data as GetAppTokenRes;
};
```

以上就已经完成了一个独立的飞书应用底层请求层的封装，接下来看如何在业务中使用。

## 调用飞书 API

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/0ff30c28ef3a46a789afab078648819d~tplv-k3u1fbpfcp-watermark.image?)

飞书的调用文档还是非常详细的，按照上图所示的流程正确操作，一般不会出现异常。

第 **1**、**2** 步我们完成了（应用申请与权限授予），按照步骤 **3** 还需要封装 [API 访问凭证](https://open.feishu.cn/document/ukTMukTMukTM/uMTNz4yM1MjLzUzM) 方便后续的调用。

#### 封装 API 访问凭证

根据文档描述，飞书提供了下述 **3** 种访问凭证，分别有不同的用途：

| 访问凭证类型        | 是否需要用户授权 | 是否需要租户管理员授权 | 适用的应用场景                 |
| ------------------- | ---------------- | ---------------------- | ------------------------------ |
| app_access_token    | 不需要           | 不需要                 | 纯后台服务等                   |
| tenant_access_token | 不需要           | 需要                   | 网页应用、机器人、纯后台服务等 |
| user_access_token   | 需要             | 不需要                 | 小程序、网页应用等             |

凭证的有效期是 **2** 小时，只有在小于 **30** 分钟的时候调用才会返回新的凭证，否则返回的还是原凭证，所以频繁调用返回的价值不大。

调用三方接口获取凭证后，再使用凭证调用 **API** 的链路过程比较长，同时也可能收网络波动、请求频率的限制，需要将凭证缓存在本地，等有效期小于 **30** 分钟时再去换取新的凭证，减少调用链接、降低请求频率。

`NestJS` 提供了**高速缓存**的插件 `cache-manager`，为对各种缓存存储提供程序提供了统一的 `API`，内置的是内存中的数据存储。

1. 安装对应的依赖与 `@types`

```shell
$ yarn add cache-manager
$ yarn add -D @types/cache-manager
```

2. 在使用的 `Module` 中注册 `CacheModule`，新建 `src/user/user.module.ts`

```ts
import { CacheModule, forwardRef, Module } from "@nestjs/common";
import { FeishuService } from "./feishu/feishu.service";
import { FeishuController } from "./feishu/feishu.controller";

@Module({
  imports: [CacheModule.register()],
  controllers: [FeishuController],
  providers: [FeishuService],
})
export class UserModule {}
```

如果需要在其他地方也使用缓存，但又不想每次都引入 `CacheModule`，也可以在 `app.module.ts` 中引入，跟 `ConfigModule` 开启全局配置即可：

```ts
import { CacheModule, Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UserModule } from "./user/user.module";
import { ConfigModule } from "@nestjs/config";
import { getConfig } from "./utils";

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
    }),
    ConfigModule.forRoot({
      ignoreEnvFile: true,
      isGlobal: true,
      load: [getConfig],
    }),
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

> 为了项目开发方便，我们的项目默认开启全局缓存配置，所以不需要在 `user.module.ts` 再次注册 `CacheModule`

在 `yaml` 配置文件中添加缓存 `key` => `APP_TOKEN_CACHE_KEY`，注意如果不添加缓存 `key` 的话，在高速缓存里面可以读取数据，但是在下一章替换 `Redis` 的时候，由于未配置 `key`，程序将使用 `undefined` 读取 `Redis`，导致 `Redis` 报错。

```yaml
APP_TOKEN_CACHE_KEY: APP_TOKEN_CACHE_KEY
```

3. 新建 `src/user/feishu/feishu.service.ts`

```ts
import { CACHE_MANAGER, Inject, Injectable, Logger } from "@nestjs/common";
import {
  getAppToken,
  getUserAccessToken,
  getUserToken,
  refreshUserToken,
} from "src/helper/feishu/auth";
import { Cache } from "cache-manager";
import { BusinessException } from "@/common/exceptions/business.exception";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class FeishuService {
  private APP_TOKEN_CACHE_KEY;
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {
    this.APP_TOKEN_CACHE_KEY = this.configService.get("APP_TOKEN_CACHE_KEY");
  }

  async getAppToken() {
    let appToken: string;
    appToken = await this.cacheManager.get(this.APP_TOKEN_CACHE_KEY);
    if (!appToken) {
      const response = await getAppToken();
      if (response.code === 0) {
        // token 有效期为 2 小时，在此期间调用该接口 token 不会改变。当 token 有效期小于 30 分的时候,再次请求获取 token 的时候，会生成一个新的 token，与此同时老的 token 依然有效。
        appToken = response.app_access_token;
        this.cacheManager.set(this.APP_TOKEN_CACHE_KEY, appToken, {
          ttl: response.expire - 60,
        });
      } else {
        throw new BusinessException("飞书调用异常");
      }
    }
    return appToken;
  }
}
```

为了和缓存管理器实例进行交互，需要使用 `CACHE_MANAGER` 标记将其注入 `cacheManager` 实例。

`Cache` 的实例 `cacheManager`，拥有 `get`、`set`、`del` 等多个方法，使用起来非常方便，也提供存储缓存过期时间的配置项 `ttl`（位于 `key` 与 `value` 之后的第三个传入参数），可以根据需求自行配置，上述代码就是配置了缓存时间的示例，在换取不到凭证或者本地缓存超时之后才会请求飞书的接口换取新的凭证。

#### 飞书机器人

封装完应用凭证之后就可以使用凭证调用飞书的 Open API，这里我们使用飞书机器人推送消息作为例子给大家演示一下。

1. 首先需要开启机器人的能力。
   ![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6b07f7db3b604a5db992049e0e3447ef~tplv-k3u1fbpfcp-watermark.image?)

2. 发布应用并选择应用使用范围，如果不在应用可用范围的用户，机器人是没办法推送消息的。
   ![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e7a9bee8fb874984850c08acf70cfb22~tplv-k3u1fbpfcp-watermark.image?)

3. 封装机器人发送消息对应的 API。

发送消息的接口为 https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=[] ，可用根据以下几种类型发送消息给指定的用户或群组：

`Query 参数 receive_id_type` **可选值**：

- `open_id`：以 open_id 来识别用户([什么是 Open ID](https://open.feishu.cn/document/home/user-identity-introduction/open-id)) 。
- `user_id`：以 user_id 来识别用户，需要有获取用户 userID 的权限 ([什么是 User ID](https://open.feishu.cn/document/home/user-identity-introduction/user-id))。
- `union_id`：以 union_id 来识别用户([什么是 Union ID](https://open.feishu.cn/document/home/user-identity-introduction/union-id))。
- `email`：以 email 来识别用户，是用户的真实邮箱。
- `chat_id`：以 chat_id 来识别群聊，群 ID 说明请参考：[群ID 说明](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/chat-id-description) 。

根据发送用户与信息的类型有如下几种参数。

`Body` **参数**：
| 名称 | 类型 | 必填 | 描述 |
| ---------- | ------ | -- | ------ |
| receive_id | string | 是 | 依据 receive_id_type 的值，填写对应的消息接收者 id**示例值**："ou_7d8a6e6df7621556ce0d21922b676706ccs"
| content | string | 是 | 消息内容，json 结构序列化后的字符串。不同msg_type对应不同内容。消息类型 包括：text、post、image、file、audio、media、sticker、interactive、share_chat、share_user等，具体格式说明参考：[发送消息content说明](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/im-v1/message/create_json)|
| msg_type | string | 是 | 消息类型 包括：text、post、image、file、audio、media、sticker、interactive、share_chat、share_user等，类型定义请参考[发送消息content说明](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/im-v1/message/create_json)|

根据上述的接口描述，可用封装如下的函数：

```ts
import { methodV } from "src/utils/request";

export enum RECEIVE_TYPE {
  "open_id",
  "user_id",
  "union_id",
  "email",
  "chat_id",
}

export enum MSG_TYPE {
  text,
  post,
  image,
  file,
  audio,
  media,
  sticker,
  interactive,
  share_chat,
  share_user,
}

type MESSAGES_PARAMS = {
  receive_id: string;
  content: string;
  msg_type: MSG_TYPE;
};

export const messages = async (
  receive_id_type: RECEIVE_TYPE,
  params: MESSAGES_PARAMS,
  app_token: string,
) => {
  console.log(receive_id_type, params, app_token);

  const { data } = await methodV({
    url: `/im/v1/messages`,
    method: "POST",
    query: { receive_id_type },
    params,
    headers: {
      Authorization: `Bearer ${app_token}`,
    },
  });
  return data;
};
```

4. 开发对应的 `Service`。

```ts
  async sendMessage(receive_id_type, params) {
    const app_token = await this.getAppToken()
    return messages(receive_id_type, params, app_token as string)
  }
```

注意：这里的 `app_token` 获取方式使用上述封装好的访问凭证方法，带有缓存的版本。

5. 新建对应的 `feishu.controller.ts` 以及 `feishu.dto.ts`：

```ts
import {
  Body,
  Controller,
  Post,
  Version,
  VERSION_NEUTRAL,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { FeishuService } from "./feishu.service";
import { FeishuMessageDto } from "./feishu.dto";

@ApiTags("飞书")
@Controller("feishu")
export class FeishuController {
  constructor(private readonly feishuService: FeishuService) {}

  @ApiOperation({
    summary: "消息推送",
  })
  @Version([VERSION_NEUTRAL])
  @Post("sendMessage")
  sendMessage(@Body() params: FeishuMessageDto) {
    const { receive_id_type, ...rest } = params;
    return this.feishuService.sendMessage(receive_id_type, rest);
  }
}
```

```ts
import { RECEIVE_TYPE, MSG_TYPE } from "@/helper/feishu/message";
import { ApiProperty } from "@nestjs/swagger";

export class FeishuMessageDto {
  @ApiProperty({ example: "email" })
  receive_id_type: RECEIVE_TYPE;

  @ApiProperty({ example: "cookieboty@qq.com" })
  receive_id?: string;

  @ApiProperty({ example: '{\"text\":\" test content\"}' })
  content?: string;

  @ApiProperty({ example: "text", enum: MSG_TYPE })
  msg_type?: keyof MSG_TYPE;
}
```

6. 正常导入 `Module` 之后，打开 `swagger` 可以看到对应的接口信息。

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d8dd231ebdd648129c393dd01fc3c1e2~tplv-k3u1fbpfcp-watermark.image?)

7. 点击 **Try it out** 发送测试信息，如果按照步骤一路下来的话，应该能正常收到飞书机器人推送的消息了。

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/eca80f9932d048e9b049c41d8515e29b~tplv-k3u1fbpfcp-watermark.image?)

以上就完成了飞书机器人推送消息的开发，大家可以发挥自己的想象，看在什么场景需要推送消息，例如：`CICD`、安全预警、流程流转、`Bug` 通知等等各种场景推送。

同时，飞书机器的消息有很多个性化的设计，例如卡片消息、富文本、语音等等，卡片消息飞书也提供了[可视化搭建的工具](https://open.feishu.cn/tool/cardbuilder)，非常方便定制化一套漂亮的卡片消息：

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6608a7fe10e446449f548bdb2056c80f~tplv-k3u1fbpfcp-watermark.image?)

> **飞书发送消息使用的邮箱与你登录注册邮箱并不相同**，有不少同学会卡在这一步，如果需要使用邮箱发送的同学需要在管理员后台配置该用户的邮箱才能正常发送信息，或者可以使用手机号、用户 id 来发送消息。**同时要注意发送消息的机器人要具备推送消息的权限**。

#### 完善体验

前面的流程都是正常请求，接下来我们看下非正常请求。首先，将 `receive_id_type` 的类型改成 `email2`，这个参数没有存在于飞书文档中提供的参数类型中，然后请求接口：

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/825fe40a83e746b79e9256a51d5e70a9~tplv-k3u1fbpfcp-watermark.image?)

可以看到，返回的接口是业务性质的通用报错 503，但我们已经预先知道了请求参数类型有几种，这种错误可以在请求飞书之后就预先校验出来，减少请求次数同时给予用户正确的反馈，我们可以借助 `class-validator` 来做入参校验：

1. 安装 `class-validator` 相关的依赖。

```shell
$ yarn add class-validator class-transformer
```

2. `main.ts` 添加 `ValidationPipe` 验证管道，从 `@nestjs/common` 导出。

```diff
+import { ValidationPipe, VersioningType, VERSION_NEUTRAL } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/exceptions/base.exception.filter';
import { HttpExceptionFilter } from './common/exceptions/http.exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { generateDocument } from './doc';

declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // 统一响应体格式
  app.useGlobalInterceptors(new TransformInterceptor());

  // 异常过滤器
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

  // 接口版本化管理
  app.enableVersioning({
    defaultVersion: [VERSION_NEUTRAL, '1', '2'],
    type: VersioningType.URI,
  });

+  // 启动全局字段校验，保证请求接口字段校验正确。
+  app.useGlobalPipes(new ValidationPipe());

  // 创建文档
  generateDocument(app)

  // 添加热更新
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }

  await app.listen(3000);
}
bootstrap();

```

3. 使用 `class-validator` 内置的验证装饰器对需要验证的 Dto 参数添加校验。

```ts
import { RECEIVE_TYPE, MSG_TYPE } from "@/helper/feishu/message";
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsEnum } from "class-validator";

export class FeishuMessageDto {
  @IsNotEmpty()
  @IsEnum(RECEIVE_TYPE)
  @ApiProperty({ example: "email" })
  receive_id_type: RECEIVE_TYPE;

  @IsNotEmpty()
  @ApiProperty({ example: "cookieboty@qq.com" })
  receive_id?: string;

  @IsNotEmpty()
  @ApiProperty({ example: '{\"text\":\" test content\"}' })
  content?: string;

  @IsNotEmpty()
  @IsEnum(MSG_TYPE)
  @ApiProperty({ example: "text" })
  msg_type?: MSG_TYPE;
}
```

我们使用了 `IsNotEmpty`（禁止传空）以及 `IsEnum`(参数必须是有效的枚举）来约束前端传参数，然后一起来看看效果：

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/cfcfaad80df64c5880949e773fe0f2bd~tplv-k3u1fbpfcp-watermark.image?)

如上图所示，由于 `email2` 并不存在于之前定义好的枚举 `RECEIVE_TYPE` 里面，所以在参数校验的时候就被拦截并且返回了具体的错误信息 `receive_id_type must be a valid enum value`，对于前端传参数与错误提示比较友好。

内置的验证装饰器非常多，下面只是简单的一些例子，更多的装饰器可以[翻阅文档](https://github.com/typestack/class-validator)

| 装饰器                                | 描述                                                                                           |
| ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **常见的验证装饰器**                  |                                                                                                |
| `@IsDefined(value: any)`              | 检查值是否已定义（!== undefined, !== null）。这是唯一忽略 skipMissingProperties 选项的装饰器。 |
| `@IsOptional()`                       | 检查给定值是否为空（=== null，=== undefined），如果是，则忽略该属性上的所有验证器。            |
| `@Equals(comparison: any)`            | 检查值是否等于 ("===") 比较。                                                                  |
| `@NotEquals(comparison: any)`         | 检查值是否不等于 ("!==") 比较。                                                                |
| `@IsEmpty()`                          | 检查给定值是否为空（=== ''、=== null、=== 未定义）。                                           |
| `@IsNotEmpty()`                       | 检查给定值是否不为空（！== ''，！== null，！== undefined）。                                   |
| `@IsIn(values: any[])`                | 检查值是否在允许值的数组中。                                                                   |
| `@IsNotIn(values: any[])`             | 检查 value 是否不在不允许的值数组中。                                                          |
| **类型验证装饰器**                    |                                                                                                |
| `@IsBoolean()`                        | 检查值是否为布尔值。                                                                           |
| `@IsDate()`                           | 检查值是否为日期。                                                                             |
| `@IsString()`                         | 检查字符串是否为字符串。                                                                       |
| `@IsNumber(options: IsNumberOptions)` | 检查值是否为数字。                                                                             |
| `@IsInt()`                            | 检查值是否为整数。                                                                             |
| `@IsArray()`                          | 检查值是否为数组                                                                               |
| `@IsEnum(entity: object)`             | 检查值是否是有效的枚举                                                                         |

4. 完成了参数校验后，还剩下最后一步，先看下现在的文档描述。

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/db00ae1e05024339b3a14e9fe61609e2~tplv-k3u1fbpfcp-watermark.image?)

从上述页面中可以看出，接口字段描述使用 `enum` 类型在展示上并不直观，对接的前端同学无法感知到底用了什么、需要传什么值才能符合要求，这个可以使用 `Swagger` 中 `ApiProperty` 的 `enum` 参数，来让文档识别出对应的枚举参数：

```ts
  @IsNotEmpty()
  @IsEnum(RECEIVE_TYPE)
  @ApiProperty({ example: 'email', enum: RECEIVE_TYPE })
  receive_id_type: RECEIVE_TYPE
```

配置完毕之后可以看到 `Swagger` 的字段描述也能将对应的枚举正确显示了

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a7fa969b31964fa3b43b1bcc264dc4b9~tplv-k3u1fbpfcp-watermark.image?)

## 写在最后

本章的示例代码以上传 [demo/v5](https://github.com/boty-design/gateway/tree/demo/v5)，需要的同学自取。

本章以**对接飞书应用**完成了一个简单的业务后端需求开发，包括飞书 **Open Api** 的对接以及**NestJs** 的缓存、`Controller`、`Service` 等模块的开发，从小的需求逐步熟悉 `NestJs` 框架的开发模式与后端业务开发逻辑。

飞书的三方应用还提供了很多额外的外部接口，例如飞书文档、组织架构（人员信息管理）、审批等等都是非常有用处的功能，在接下去的用户系统中我们就会使用组织架构中的接口作为自建用户系统的底层数据与三方登录。

大家可以根据自己团队的需求选择对应的模块来减少开发工作量，比如审批的任务流开发就非常麻烦，就算有开源的插件集成，还是需要额外对接消息通知。而直接利用飞书提供的审批接口不仅能减少代码量、提高开发效率同时也打通飞书的交互，给用户最小的心智学习成本。

如果你有什么疑问，欢迎在评论区提出或者加群沟通。 👏

---

# 第06章—工具篇：数据库

## 前言

在上一章中，我们通过接入飞书应用以及机器人消息推送，对使用 `NestJS` 框架以及后端业务开发有了一定的经验，也开启了正式开发的第一步。

在一个普通的后端业务开发中基本逃不开 **CURD**，也就是对数据的常规操作。在技术选型中提到，网关系统中将同时使用 **2** 种数据库 `MySQL` 与 `MongoDB`（分别是关系型数据库与非关系数据库的代表），分别进行用户与物料服务的数据存储。

作为基础脚手架的搭建，为了便于业务开发同学的使用与体验，比较好的方式是使用配置模式提供统一的 **API** 调用减少开发的理解与接入成本。

本章我们将学习对数据库的封装以及常规的数据库操作。

## TypeORM

日常对数据库的操作需要借助于 `SQL`，至少需要掌握基础的 `SQL` 语法就有建表、增删改查等。但如果想要在代码中直接实现对数据库的操作，就需要去写大量 `SQL` ，这在**可读性、维护性及开发体验上都非常糟糕**。

于是，**ORM** 框架应运而生。这类的框架是为了解决面向对象与关系数据库存在的互不匹配的现象，把面向 `SQL` 开发转变为面向对象开发，开发不需要关注底层实现细节，而是以操作对象的模式使用数据库。

> 对象关系映射（Object Relational Mapping，简称 ORM）模式是一种为了解决面向对象与关系数据库存在的互不匹配现象的技术。

[TypeORM](https://github.com/typeorm/typeorm) 作为 `Node.js` 中老牌的 `ORM` 框架，无论是接口定义，还是代码实现方面都简单易懂、可读性高，也很容易对接多种数据源。

虽然市面上也有其他不错的 `ORM` 框架，比如 [Sequelize](https://sequelize.org/)、[Prisma](https://www.prisma.io/) 等，但 `TypeORM` 使用 `TypeScript` 编写，在 `NestJS` 框架下运行得非常好，也是 `NestJS` 首推的 `ORM` 框架，有开箱即用的 `@nestjs/typeorm` 软件包支持。

综上所述，我们的 `ORM` 框架也将选用 `TypeORM` 来开发（看个人喜好与需求，如果喜欢 **GraphQL** 的，使用 [Prisma](https://www.prisma.io/) 更好）。

#### 封装

`NestJS` 使用 `TypeORM` 的方式有两种。一种是 `NestJS` 提供的 `@nestjs/typeorm` 集成包，可以导出 `TypeOrmModule.forRoot` 方法来连接数据库，同时可以使用 `ormconfig.json` 将数据库链接配置项剥离。另外一种是直接使用 `typeorm`，自由封装 `Providers` 导入使用。

两种方案各有优缺点，使用 `@nestjs/typeorm` 集成的方案较为简便，但自建的业务脚手架需要两种数据库保证在开发中体验一致性，此外之前已经自定义了全局环境变量的配置，没有必要再多一个 `ormconfig.json` 的配置来增加额外理解成本，所以接下来我们将使用第二种方案来连接数据库。

**第一步**：跟之前一样，为了使用 `TypeORM`，先安装以下依赖。

```shell
$ yarn add typeorm mysql2 mongoose
```

**第二步**：在 `dev.yaml` 中添加数据库配置参数。

```
MONGODB_CONFIG:
  name: "fast_gateway_test"          # 自定义次数据库链接名称
  type: mongodb                      # 数据库链接类型
  url: "mongodb://localhost:27017"   # 数据库链接地址
  username: "xxxx"                   # 数据库链接用户名
  password: "123456"                 # 数据库链接密码
  database: "fast_gateway_test"      # 数据库名
  entities: "mongo"                  # 自定义加载类型
  logging: false                     # 数据库打印日志
  synchronize: true                  # 是否开启同步数据表功能
```

以上是数据库连接的必要参数，其他的参数可以[参考文档](https://typeorm.io/data-source-options)根据需求添加，例如 `retryAttempts`（重试连接数据库的次数）、`keepConnectionAlive`（应用程序关闭后连接是否关闭） 等配置项。

**第三步**：新建 `src/common/database/database.providers.ts`

```ts
import { DataSource, DataSourceOptions } from "typeorm";
import { getConfig } from "src/utils/index";
const path = require("path");

// 设置数据库类型
const databaseType: DataSourceOptions["type"] = "mongodb";
const { MONGODB_CONFIG } = getConfig();

const MONGODB_DATABASE_CONFIG = {
  ...MONGODB_CONFIG,
  type: databaseType,
  entities: [
    path.join(
      __dirname,
      `../../**/*.${MONGODB_CONFIG.entities}.entity{.ts,.js}`,
    ),
  ],
};

const MONGODB_DATA_SOURCE = new DataSource(MONGODB_DATABASE_CONFIG);

// 数据库注入
export const DatabaseProviders = [
  {
    provide: "MONGODB_DATA_SOURCE",
    useFactory: async () => {
      await MONGODB_DATA_SOURCE.initialize();
      return MONGODB_DATA_SOURCE;
    },
  },
];
```

**第四步**：新建 `database.module.ts`

```ts
import { Module } from "@nestjs/common";
import { DatabaseProviders } from "./database.providers";

@Module({
  providers: [...DatabaseProviders],
  exports: [...DatabaseProviders],
})
export class DatabaseModule {}
```

至此我们已经封装了 `MongoDB` 的 `Provider`，如果需要引入 `MySQL` 或者其他类型数据库的话，只需要替换对应的配置参数，重复上述步骤即可。

> 在我写这个小册的时候，用的 `TypeORM` 版本是 `0.3.5+，`而 `0.3.5+` 的中英文文档是不同步的，中文文档是 `0.2.37+` 的版本，如果你出现开发过程中发现一些兼容的问题，此时中文文档是对应不上的，需要查看[英文文档](https://typeorm.io/)。

#### 使用

**第一步**：注册实体，创建 `src/user/user.mongo.entity.ts`

```ts
import { Entity, Column, UpdateDateColumn, ObjectIdColumn } from "typeorm";

@Entity()
export class User {
  @ObjectIdColumn()
  id?: number;

  @Column({ default: null })
  name: string;
}
```

在 `MongoDB` 里面使用的是 `ObjectIdColumn` 作为类似 `MySQL` 的自增主键，来保证数据唯一性，只是类似，并不是跟普通自增主键一样会递增，把它看成 `uuid` 类似即可。

此外应该注意我们创建的实体类文件命名后缀为 `entity.ts`，而在上文数据库连接的配置中有一个 `entities` 参数：

```
entities:[path.join(__dirname, `../../**/*.${MONGODB_CONFIG.entities}.entity{.ts,.js}`)]
```

这个属性配置代表：只要是以 `entity.ts` 结尾的实例类，都会被自动扫描识别，并在数据库中生成对应的实体表。

所以想使用 `MySQL` 又同时想使用自动注册这个功能的话，一定要区分后缀名，不然会出现混乱注册的情况，`mysql` 的配置例如下面所示：

```
MYSQL_CONFIG:
  name: "user-test"
  type: "mysql"
  host: "localhost"
  port: 3306
  username: "xxxx"
  password: "123456"
  database: "user-test"
  entities: "mysql" # 这里的命名一定要跟 MongoDB 里面的配置命名区分开
  synchronize: true
```

> MongoDB 是无模式的，所以即使在配置参数开启了 `synchronize`，启动项目的时候也不会去数据库创建对应的表，所以不用奇怪，并没有出错，但 `Mysql` 在每次应用程序启动时自动同步表结构，容易造成数据丢失，生产环境记得关闭，以免造成无可预计的损失。

**第二步**：创建 `user.providers.ts`：

```ts
import { User } from "./user.mongo.entity";

export const UserProviders = [
  {
    provide: "USER_REPOSITORY",
    useFactory: async (AppDataSource) =>
      await AppDataSource.getRepository(User),
    inject: ["MONGODB_DATA_SOURCE"],
  },
];
```

**第三步**：创建 `user.service.ts`，新增添加用户 `service`：

```ts
import { In, Like, Raw, MongoRepository } from "typeorm";
import { Injectable, Inject } from "@nestjs/common";
import { User } from "./user.mongo.entity";

@Injectable()
export class UserService {
  constructor(
    @Inject("USER_REPOSITORY")
    private userRepository: MongoRepository<User>,
  ) {}

  createOrSave(user) {
    return this.userRepository.save(user);
  }
}
```

**第四步**：创建 `user.controller.ts`，添加新增用户的 `http` 请求方法:

```ts
import { Controller, Post, Body, Query, Get } from "@nestjs/common";
import { UserService } from "./user.service";
import { AddUserDto } from "./user.dto";

@ApiTags("用户")
@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: "新增用户",
  })
  @Post("/add")
  create(@Body() user: AddUserDto) {
    return this.userService.createOrSave(user);
  }
}
```

`user.dto.ts` 的内容如下：

```ts
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";
export class AddUserDto {
  @ApiProperty({ example: 123 })
  id?: string;

  @ApiProperty({ example: "cookie" })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: "cookieboty@qq.com" })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: "cookieboty" })
  @IsNotEmpty()
  username: string;
}
```

**第五步**：创建 `user.module.ts`，将 `controller`、`providers`、`service` 等都引入后，**切记**将 `user.module.ts` 导入 `app.module.ts` 后才会生效，这一步别忘记了 :

```ts
import { Module } from "@nestjs/common";
import { DatabaseModule } from "@/common/database/database.module";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { UserProviders } from "./user.providers";
import { FeishuController } from "./feishu/feishu.controller";
import { FeishuService } from "./feishu/feishu.service";

@Module({
  imports: [DatabaseModule],
  controllers: [FeishuController, UserController],
  providers: [...UserProviders, UserService, FeishuService],
  exports: [UserService],
})
export class UserModule {}
```

完成上述所有步骤之后，此时打开 `Swagger` 文档可以看到，已经创建好了 `/api/user/add` 新增用户的 `http` 接口：

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5a2ab7e0c5f1468f93b1fe3a445b51eb~tplv-k3u1fbpfcp-watermark.image?)

点击测试能正常得到如下返回值的话，则代表数据插入成功，功能正常：

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7f96c873a40a4c8da2c2a5570ae82945~tplv-k3u1fbpfcp-watermark.image?)

> `MongoDB` 的示例代码已上传 [demo/v6](https://github.com/boty-design/gateway/tree/demo/v6)，需要的同学自取。

## Redis

在技术选型中，我们提到了 `Redis` 虽然作为数据库，但是常见的用法是作为统一、高速缓存服务来使用。

在基础功能配置中，使用了 `NestJS` 自带的高速缓存插件 `cache-manager` 来缓存飞书的接口凭证，`cache-manager` 除了提供本地的高速缓存之外，也提供了替换底层缓存服务的能力。

跟我们上文封装的数据库工具一样，`cache-manager` 将底层的多种缓存对接逻辑进行封装，屏蔽底层接口的差异性，对外则提供了一致的 `API` 调用，可以减少接入与理解成本，对于开发者来说可以很方便地把之前的缓存类型由本地替换成 `Redis`。

**第一步**：安装对应的 `cache-manager-redis-store` 依赖

```shell
$ yarn add cache-manager-redis-store
```

**第二步**：`yaml` 中新增 `Redis` 配置参数：

```
REDIS_CONFIG:
  host: "localhost"  # redis 链接
  port: 6379         # redis 端口
  auth: "xxxx"       # redis 连接密码
  db: 1              # redis 数据库
```

**第三步**：改造之前获取环境变量的方法，可以根据传入的变量名获取对应的配置：

```ts
export const getConfig = (type?: string) => {
  const environment = getEnv();
  const yamlPath = path.join(process.cwd(), `./.config/.${environment}.yaml`);
  const file = fs.readFileSync(yamlPath, "utf8");
  const config = parse(file);
  if (type) {
    return config[type];
  }
  return config;
};
```

**第四步**：修改 `app.module.ts` 中的 `CacheModule` 初始化配置：

```ts
import { CacheModule, Module } from "@nestjs/common";
import { UserModule } from "./user/user.module";
import { ConfigModule } from "@nestjs/config";
import { getConfig } from "./utils";
import * as redisStore from "cache-manager-redis-store";

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: getConfig("REDIS_CONFIG").host,
      port: getConfig("REDIS_CONFIG").port,
      auth_pass: getConfig("REDIS_CONFIG").auth,
      db: getConfig("REDIS_CONFIG").db,
    }),
    ConfigModule.forRoot({
      ignoreEnvFile: true,
      isGlobal: true,
      load: [getConfig],
    }),
    UserModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

完成上述操作之后，之前业务调用方法不需要做任何额外的改动，就已经完成了 `Redis` 的接入。

可以使用之前的飞书消息推送的接口，正常访问得到如下结果则代表替换完成：

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/750d0e0ef5314e828e0d0ae7fe3c9853~tplv-k3u1fbpfcp-watermark.image?)

如果想要查看 `Redis` 的缓存数据，比较简单的方式可以使用 `VScode` 带有的 `Redis` 插件：

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c182110d5bb74431a19d3336ccd4e0c7~tplv-k3u1fbpfcp-watermark.image?)

点击配置 `Redis` 参数直连服务：

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d07d3569d64847c8823dc79c3a0fe479~tplv-k3u1fbpfcp-watermark.image?)

输入以下命令即可获取存储的 `token` 内容：

```shell
$ GET APP_TOKEN_CACHE_KEY
```

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9033d365c8cd4fc59169d1f472c913f0~tplv-k3u1fbpfcp-watermark.image?)

在对接完毕 Redis 之后，即使集群部署服务，都可以使用统一的缓存，也不担心重启服务之后缓存数据丢失的情况。

> `Redis` 的示例代码已上传 [demo/v7](https://github.com/boty-design/gateway/tree/demo/v7)，需要的同学自取。

## 写在最后

本章的内容是后端业务 `CURD` 中最重要的一块 => **数据库相关的内容**，介绍了如何基于 `TypeORM` 封装数据库方法以及使用方法，使用 `user` 进行简单的新增 `demo` 演示，更多 `TypeORM` 与数据库的使用方法在后面的业务开发代码中会结合实例介绍。

另外对 `Redis` 的使用也做了部分介绍，主要是利用了 `cache-manager` 提供的功能，如果有兴趣的话可以使用 `redis` 库按照封装数据库的方式自己封装对应的模块，或者直接使用 `Service` 封装一套缓存的 `API` 也行。

对于此类工具的封装以及使用的方法非常多，看自己的需求以及喜好开发即可，但是在基础建设中一定要切记，如果出现多种底层数据、工具来源，一定要在适配层抹平差异化，对外提供的 `API` 调用保证一致性。

可以参考一下我之前的博客[项目实战|缓存处理](https://juejin.cn/post/6854573211594522631)，对于前端的 `Cookie`、`Storage`、`indexDb` 等多种缓存数据源都做了适配抹平底层接口差异化的处理，业务同学在使用的过程中替换数据源非常简便，学习与开发成本降低很多。

如果你有什么疑问，欢迎在评论区提出，或者加群沟通。 👏

---

# 第07章—基础篇：自定义日志

## 前言

在所有的后端服务中，日志是必不可少的一个关键环节，毕竟日常中我们不可能随时盯着控制台，问题的出现也会有随机性、不可预见性。一旦出现问题，要追踪错误以及解决，需要知道错误发生的原因、时间等细节信息。

之前的需求分析部分，在网关基础代理的服务中，网关作为所有业务流量的入口也有统一日志落库的需求。所以本章将介绍如何开发一个自定义的日志插件。

## 开启默认 Logger

`NestJS` 框架自带了 `log` 插件，如果只是普通使用，直接开启日志功能即可：

```ts
const app = await NestFactory.create(ApplicationModule, { logger: true });
```

但我们为了框架的性能使用 `Fastify` 来替换底层框架之后，需要使用下述代码来开启 `Fastify` 的日志系统：

```ts
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter({
    logger: true,
  }),
);
```

接下来，当我们访问 http://localhost:3000/ ，就可以看到控制台已经在正常打印接口请求的日志了：

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9a5e662a415341a79982faf9d4c59636~tplv-k3u1fbpfcp-watermark.image?)

虽然自带的日志功能开启之后，控制台能够正常打印日志，但是 `Fastify` 默认的日志输出格式无法满足业务需求。首先，无法**快速区分**日志类型，打印日志能参考的价值不大，其次，`logger` 并没有本地落库，后续查找也很麻烦，对于一个实战工程来说，快速定位日志问题以及有**本地存储**、**日志轮转**等功能还是必要的。

## 自定义 Logger

既然自带的日志功能不能满足我们的业务需求，那就需要对默认的日志功能进行拓展。

1. 安装几个必要的依赖：

```
$ yarn add fast-json-parse // 格式化返回对象
$ yarn add pino-multi-stream // 替换输出流
$ yarn add split2 // 处理文本流
$ yarn add dayjs // 可选，如果自己写时间格式化函数可以不用
```

2. `Fastify` 作为一款专注于性能的 `HTTP` 框架，使用 [pino](https://github.com/pinojs/pino) 作为内置日志工具，下面是自定义日志的参数配置：

```
const split = require('split2')
const stream = split(JSON.parse)

  logger: {
    level: 'info',
    file: '/path/to/file' // 将调用 pino.destination()
    // stream: stream
  }
```

> 开启 `file` 配置的话，日志会自动存储在本地，如果开启 `stream` 的配置，就需要自己自定义修改配置，**这两者是互斥的，只能配置一个**。

每个团队对日志的需求也并不相同，如果想对日志做更多定制化的功能，可以选择开启 `stream` 配置，自己开发所需要的日志功能。

#### logStream

1. 新建 `common/logger/logStream.ts` 文件：

```ts
const chalk = require("chalk");
const dayjs = require("dayjs");
const split = require("split2");
const JSONparse = require("fast-json-parse");

const levels = {
  [60]: "Fatal",
  [50]: "Error",
  [40]: "Warn",
  [30]: "Info",
  [20]: "Debug",
  [10]: "Trace",
};

const colors = {
  [60]: "magenta",
  [50]: "red",
  [40]: "yellow",
  [30]: "blue",
  [20]: "white",
  [10]: "white",
};

interface ILogStream {
  format?: () => void;
}

export class LogStream {
  public trans;
  private customFormat;

  constructor(opt?: ILogStream) {
    this.trans = split((data) => {
      this.log(data);
    });

    if (opt?.format && typeof opt.format === "function") {
      this.customFormat = opt.format;
    }
  }

  log(data) {
    data = this.jsonParse(data);
    const level = data.level;
    data = this.format(data);
    console.log(chalk[colors[level]](data));
  }

  jsonParse(data) {
    return JSONparse(data).value;
  }

  format(data) {
    if (this.customFormat) {
      return this.customFormat(data);
    }

    const Level = levels[data.level];
    const DateTime = dayjs(data.time).format("YYYY-MM-DD HH:mm:ss.SSS A");
    const logId = data.reqId || "_logId_";

    let reqInfo = "[-]";

    if (data.req) {
      reqInfo = `[${data.req.remoteAddress || ""} - ${data.req.method} - ${data.req.url}]`;
    }

    if (data.res) {
      reqInfo = JSON.stringify(data.res);
    }

    // 过滤 swagger 日志
    if (data?.req?.url && data?.req?.url.indexOf("/api/doc") !== -1) {
      return null;
    }
    return `${Level} | ${DateTime} | ${logId} | ${reqInfo} | ${data.stack || data.msg}`;
  }
}
```

`levels` 以及 `colors` 分别是定义**日志类型**与**控制台输出颜色**，可以根据自己的习惯或者团队规则进行配置。`format` 是格式化 `Fastify` 的日志输出，也可以根据自己的习惯格式化日志格式。`log` 则是将日志输出到控制台。

> `logStream.ts` 整体比较简单易懂，主要的功能就是格式化日志以及打印日志。

在接入自定义日志后，可以看到控住台输出内容变成如下所示：

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c221318c9de74df7a44a9f69d47a8998~tplv-k3u1fbpfcp-watermark.image?)

对比最开始的默认日志打印格式，现在可以很清晰的从控制台看出日志的类型与内容，方便我们快速定位问题。

#### fileStream

在接管了控制台输出日志后，我们接着开发日志的落库与轮转功能：

新建 `common/logger/fileStream.ts` 文件：

```ts
import { dirname } from "path";
import { createWriteStream, stat, rename } from "fs";

const assert = require("assert");
const mkdirp = require("mkdirp");

import { LogStream } from "./logStream";

const defaultOptions = {
  maxBufferLength: 4096, // 日志写入缓存队列最大长度
  flushInterval: 1000, // flush间隔
  logRotator: {
    byHour: true,
    byDay: false,
    hourDelimiter: "_",
  },
};

const onError = (err) => {
  console.error(
    "%s ERROR %s [chair-logger:buffer_write_stream] %s: %s\n%s",
    new Date().toString(),
    process.pid,
    err.name,
    err.message,
    err.stack,
  );
};

const fileExists = async (srcPath) => {
  return new Promise((resolve, reject) => {
    // 自运行返回Promise
    stat(srcPath, (err, stats) => {
      if (!err && stats.isFile()) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
};

const fileRename = async (oldPath, newPath) => {
  return new Promise((resolve, reject) => {
    rename(oldPath, newPath, (e) => {
      resolve(e ? false : true);
    });
  });
};

export class FileStream extends LogStream {
  private options: any = {};
  private _stream = null;
  private _timer = null;
  private _bufSize = 0;
  private _buf = [];
  private lastPlusName = "";
  private _RotateTimer = null;

  constructor(options) {
    super(options);
    assert(options.fileName, "should pass options.fileName");
    this.options = Object.assign({}, defaultOptions, options);
    this._stream = null;
    this._timer = null;
    this._bufSize = 0;
    this._buf = [];
    this.lastPlusName = this._getPlusName();
    this.reload();
    this._RotateTimer = this._createRotateInterval();
  }

  log(data) {
    data = this.format(this.jsonParse(data));
    if (data) this._write(data + "\n");
  }

  /**
   * 重新载入日志文件
   */
  reload() {
    // 关闭原来的 stream
    this.close();
    // 新创建一个 stream
    this._stream = this._createStream();
    this._timer = this._createInterval();
  }

  reloadStream() {
    this._closeStream();
    this._stream = this._createStream();
  }
  /**
   * 关闭 stream
   */
  close() {
    this._closeInterval(); // 关闭定时器
    if (this._buf && this._buf.length > 0) {
      // 写入剩余内容
      this.flush();
    }
    this._closeStream(); //关闭流
  }

  /**
   * @deprecated
   */
  end() {
    console.log("transport.end() is deprecated, use transport.close()");
    this.close();
  }

  /**
   * 覆盖父类，写入内存
   * @param {Buffer} buf - 日志内容
   * @private
   */
  _write(buf) {
    this._bufSize += buf.length;
    this._buf.push(buf);
    if (this._buf.length > this.options.maxBufferLength) {
      this.flush();
    }
  }

  /**
   * 创建一个 stream
   * @return {Stream} 返回一个 writeStream
   * @private
   */
  _createStream() {
    mkdirp.sync(dirname(this.options.fileName));
    const stream = createWriteStream(this.options.fileName, { flags: "a" });
    stream.on("error", onError);
    return stream;
  }

  /**
   * 关闭 stream
   * @private
   */
  _closeStream() {
    if (this._stream) {
      this._stream.end();
      this._stream.removeListener("error", onError);
      this._stream = null;
    }
  }

  /**
   * 将内存中的字符写入文件中
   */
  flush() {
    if (this._buf.length > 0) {
      this._stream.write(this._buf.join(""));
      this._buf = [];
      this._bufSize = 0;
    }
  }

  /**
   * 创建定时器，一定时间内写入文件
   * @return {Interval} 定时器
   * @private
   */
  _createInterval() {
    return setInterval(() => {
      this.flush();
    }, this.options.flushInterval);
  }

  /**
   * 关闭定时器
   * @private
   */
  _closeInterval() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  /**
   * 分割定时器
   * @private
   */
  _createRotateInterval() {
    return setInterval(() => {
      this._checkRotate();
    }, 1000);
  }

  /**
   * 检测日志分割
   */
  _checkRotate() {
    let flag = false;

    const plusName = this._getPlusName();
    if (plusName === this.lastPlusName) {
      return;
    }
    this.lastPlusName = plusName;
    this.renameOrDelete(this.options.fileName, this.options.fileName + plusName)
      .then(() => {
        this.reloadStream();
      })
      .catch((e) => {
        console.log(e);
        this.reloadStream();
      });
  }

  _getPlusName() {
    let plusName;
    const date = new Date();
    if (this.options.logRotator.byHour) {
      plusName = `${date.getFullYear()}-${
        date.getMonth() + 1
      }-${date.getDate()}${this.options.logRotator.hourDelimiter}${date.getHours()}`;
    } else {
      plusName = `${date.getFullYear()}-${
        date.getMonth() + 1
      }-${date.getDate()}`;
    }
    return `.${plusName}`;
  }

  /**
   * 重命名文件
   * @param {*} srcPath
   * @param {*} targetPath
   */
  async renameOrDelete(srcPath, targetPath) {
    if (srcPath === targetPath) {
      return;
    }
    const srcExists = await fileExists(srcPath);
    if (!srcExists) {
      return;
    }
    const targetExists = await fileExists(targetPath);

    if (targetExists) {
      console.log(`targetFile ${targetPath} exists!!!`);
      return;
    }
    await fileRename(srcPath, targetPath);
  }
}
```

`fileStream.ts` 的主要功能是存储日志文件以及日志轮转。文件这块处理的内容比较多，但是从代码角度来看并不复杂，大家可以根据代码注释看完以及对应的功能来理解。

完成上述文件之后，修改 main.ts 接入自定义的日志插件：

```
import { ValidationPipe, VersioningType, VERSION_NEUTRAL } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastify from 'fastify';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/exceptions/base.exception.filter';
import { HttpExceptionFilter } from './common/exceptions/http.exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { FastifyLogger } from './common/logger';
import { generateDocument } from './doc';

declare const module: any;

async function bootstrap() {

  const fastifyInstance = fastify({
    logger: FastifyLogger,
  })

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(fastifyInstance)
  );

  // 统一响应体格式
  app.useGlobalInterceptors(new TransformInterceptor());

  // 异常过滤器
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

  // 接口版本化管理
  app.enableVersioning({
    defaultVersion: [VERSION_NEUTRAL, '1', '2'],
    type: VersioningType.URI,
  });

  // 启动全局字段校验，保证请求接口字段校验正确。
  app.useGlobalPipes(new ValidationPipe());

  // 创建文档
  generateDocument(app)

  // 添加热更新
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }

  await app.listen(3000);
}
bootstrap();
```

重新启动项目之后，可以看到本地根路径的 `logs` 文件夹下有对应的日志文件生成：

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3995c3eea1e5412483fcc95bf82c450d~tplv-k3u1fbpfcp-watermark.image?)

> 自定义插件参考 [fastify-logger](https://github.com/weivea/fastify-logger) 这个项目，原项目是 `JS` 的版本，在 `NestJS` 中使用有些麻烦，索性拉下来改成 `TS` 版本了，另外稍微修改了一些内容适配项目。

## 写在最后

本章文中贴出的代码只有部分重要的示例，完整的代码示例已上传 [demo/v8](https://github.com/boty-design/gateway/tree/demo/v8)，需要的同学可以自取。

本章是针对自定义日志的处理，如果项目并不非常复杂，已经足够满足日常开发需求。

但实际上一个**企业级的项目**在日志处理方面可能会更加复杂，特别是使用 `k8s` 容器编排部署之后，日志会零散地落库在各个 `pod` 中，排查问题、恢复数据等操作需要聚合多个 `pod` 的日志才行，这就需要借助其他的工具例如 `elk` 等来处理日志。这块内容衍生性比较大，如果有需求，后期可以再拿出来单独讨论一下。

如果你有什么疑问，欢迎在评论区提出或者加群沟通。 👏

---

# 第08章—基础篇：鉴权与登录

## 前言

统一的用户中心作为基础服务，为了方便团队同学使用，一般会将 **OA** 系统、钉钉、飞书、企业微信等等各种第三方常用服务的用户数据打通，使得团队成员可以快速登录。

在 [DevOps 小册](https://juejin.cn/book/6948353204648148995)中，我们使用了 `GitLab` 作为三方应用授权，避免用户重复登录，飞书也提供了一样的三方授权能力。

在本章中，我们将学习使用 `NestJS` 的守卫模块结合之前封装过的飞书**用户模块**进行三方授权登录，并保存用户信息，为用户系统的业务开发做完最后一步的准备工作。

## 飞书对接

飞书应用第三方网站免登的步骤如下。

1. 网页后端发现用户未登录，[请求身份验证](https://open.feishu.cn/document/ukTMukTMukTM/ukzN4UjL5cDO14SO3gTN)；
2. 用户登录后，开放平台生成登录预授权码，302跳转至重定向地址。
3. 网页后端调用[获取登录用户身份](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/authen-v1/authen/access_token)校验登录预授权码合法性，获取到用户身份。
4. 如需其他用户信息，网页后端可调用[获取用户信息（身份验证）](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/authen-v1/authen/user_info)。

授权流程图如下所示：

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/0fff3a5fc92c432ea5aa09cf3a392c74~tplv-k3u1fbpfcp-watermark.image?)

接下来，我们按照步骤逐步实现飞书的三方授权

#### 请求用户身份验证

**第一步**：开启网页能力并配置重定向链接。

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d66663a5eba541b08f55a711c23449ce~tplv-k3u1fbpfcp-watermark.image?)

如上图所示，点击网页菜单开启网页能力之后，在安全设置菜单中，添加回调 URL 地址。这里我们使用的是 `http://127.0.0.1:8080/auth`，你可以根据自己的喜好来设定。

**第二步**：请求用户身份验证。

根据飞书的文档组装身份验证请求接口：`https://open.feishu.cn/open-apis/authen/v1/index?redirect_uri={REDIRECT_URI}&app_id={APPID}&state={STATE} `，参数说明如下所示：
参数 | 类型 | 必须 | 说明 |
| ------------ | ------ | -- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| redirect_uri | string | 是 | 重定向 `URL`（使用第一步配置的重定向 `URL` 即可） |
| app_id | string | 是 | 固定的应用标识，在应用后台【凭证和基础信息】中可见 |
| state | string | 否 | 用来维护请求和回调状态的附加字符串， 在授权完成回调时会附加此参数，应用可以根据此字符串来判断上下文关系 |

所以对于我们的应用，请求身份的链接为：`https://open.feishu.cn/open-apis/authen/v1/index?app_id=cli_xxxxxxd&redirect_uri=http%3A%2F%2F127.0.0.1%3A8080%2Fauth`，在浏览器直接输入此链接如果出现如下的飞书授权界面，则代表我们已经正常配置成功了：

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/24e4a3045ab94e42a991f28f82ecff48~tplv-k3u1fbpfcp-watermark.image?)

**第三步**：获取登录预授权码。这一步比较简单，正常出现飞书应用授权的界面之后，点击授权【**按钮**】即可获取到对应的登录预授权码。

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5a69e15e58894e7e92d06c26cf58861b~tplv-k3u1fbpfcp-watermark.image?)

出现上图的界面并不意外，毕竟这个链接是随便填写的，飞书并不会真的去校验这个链接是否真实存在。当我们点击授权之后，它会将登录预授权码放在重定向 `URL` 的 `code` 参数中直接转发，所以即使这个请求是假的，也能顺利拿到对应的 `code`。

**第四步**：获取用户凭证。在这一步中，使用第三步获取到的登录预授权码，也就是重定向 `URL Query` 参数中的 `code` 向飞书换取真正的用户凭证，注意 `code` 的有效期只有 **5** 分钟，且只能使用一次，过期或已使用的 `code` 都无法再次换取真实用户凭证。

1. 在 `src/helper/feishu/auth.ts` 中添加新的换取用户凭证方法：

```ts
export const getUserToken = async ({ code, app_token }) => {
  const { data } = await methodV({
    url: `/authen/v1/access_token`,
    method: "POST",
    headers: {
      Authorization: `Bearer ${app_token}`,
    },
    params: {
      grant_type: "authorization_code",
      code,
    },
  });
  return data;
};
```

2. 在 `src/user/feishu/feishu.service.ts` 中添加新的换取用户凭证的 `Service`：

```ts
async getUserToken(code: string) {
    const app_token = await this.getAppToken()
    const dto: GetUserTokenDto = {
      code,
      app_token
    };
    const res: any = await getUserToken(dto);
    if (res.code !== 0) {
      throw new BusinessException(res.msg);
    }
    return res.data;
}
```

3. 在 `src/user/feishu/feishu.controller.ts` 中添加新的换取用户凭证的 `Controller`：

```ts
  @ApiOperation({
    summary: '获取用户凭证',
  })
  @Post('getUserToken')
  getUserToken(@Body() params: GetUserTokenDto) {
    const { code } = params
    return this.feishuService.getUserToken(code);
  }
```

4. 在 `feishu.dto.ts` 中添加新的 `GetUserTokenDto`：

```
export class GetUserTokenDto {
  @IsNotEmpty()
  @ApiProperty({ example: 'xxxx', description: '飞书临时登录凭证' })
  code: string;

  app_token: string;
}
```

打开 **Swagger** 调试 `getUserToken` 接口，将第三步获取的临时登录凭证输入参数调试。如果配置正常的话，此时可以拿到飞书的用户信息和真实的用户凭证 `access_token`，以及 `refresh_token` 等回调值。

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/aa7ca11c948648cd86c7bd3b66e61925~tplv-k3u1fbpfcp-watermark.image?)

之后可以将 `access_token` 的值缓存起来，使用 `access_token` 调用飞书提供的任意接口，但前提是这个应用拥有对应的模块接口权限才能够正常调用。

**第五步**: 刷新用户凭证。安全起见，飞书获取的 `access_token` 和 `refresh_token` 均存在有效期。`access_token` 的有效期为 **2** 小时，过期之前可以通过有效期更长的 `refresh_token` 缓存新的 `access_token`，来保证能够正常调用飞书接口。

1. 在 `src/helper/feishu/auth.ts` 中新增刷新用户 `access_token` 方法：

```ts
export const refreshUserToken = async ({ refreshToken, app_token }) => {
  const { data } = await methodV({
    url: `/authen/v1/refresh_access_token`,
    method: "POST",
    headers: {
      Authorization: `Bearer ${app_token}`,
    },
    params: {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      app_token,
    },
  });
  return data;
};
```

2. 在 `src/user/feishu/feishu.service.ts` 中添加**刷新**、**存储**、**读取** `access_token` 的 `Service`：

```ts
  async setUserCacheToken(tokenInfo: any) {
    const {
      refresh_token,
      access_token,
      user_id,
      expires_in,
      refresh_expires_in,
    } = tokenInfo;

    // 缓存用户的 token
    await this.cacheManager.set(`${this.USER_TOKEN_CACHE_KEY}_${user_id}`, access_token, {
      ttl: expires_in - 60,
    });

    // 缓存用户的 fresh token
    await this.cacheManager.set(
      `${this.USER_REFRESH_TOKEN_CACHE_KEY}_${user_id}`,
      refresh_token,
      {
        ttl: refresh_expires_in - 60,
      },
    );
  }

  async getCachedUserToken(userId: string) {
    let userToken: string = await this.cacheManager.get(
       `${this.USER_TOKEN_CACHE_KEY}_${userId}`,
    );

    // 如果 token 失效
    if (!userToken) {
      const refreshToken: string = await this.cacheManager.get(
        `${this.USER_REFRESH_TOKEN_CACHE_KEY}_${userId}`,
      );
      if (!refreshToken) {
        throw new BusinessException({
          code: BUSINESS_ERROR_CODE.TOKEN_INVALID,
          message: 'token 已失效',
        });
      }
      // 获取新的用户 token
      const usrTokenInfo = await this.getUserTokenByRefreshToken(refreshToken);
      // 更新缓存的用户 token
      await this.setUserCacheToken(usrTokenInfo);
      userToken = usrTokenInfo.access_token;
    }
    return userToken;
  }

  async getUserTokenByRefreshToken(refreshToken: string) {
    return await refreshUserToken({
      refreshToken,
      app_token: await this.getAppToken(),
    });
  }
```

根据方法名可以清晰地知道对应的功能，我就不过多介绍了。至此，飞书应用的三方授权模块对接完毕。

## 鉴权与登录

上述步骤只是对接了飞书应用，还不足够完成登录态。接下来，我们要借助 `NestJS` 提供的 `Guards` 模块、`Passport` 与 `JWT` 来完成登录模块的开发。

首选需要安装对应的依赖：

```shell
$ yarn add @nestjs/passport passport
$ yarn add -D @types/passport-local
$ yarn add @nestjs/jwt passport-jwt
$ yarn add @fastify/cookie
```

**第一步**：新建 `src/auth/auth.service.ts`。

```ts
import { Injectable } from "@nestjs/common";

import { JwtService } from "@nestjs/jwt";
import { FeishuUserInfo } from "src/user/feishu/feishu.dto";
import { FeishuService } from "src/user/feishu/feishu.service";
import { User } from "@/user/user.mongo.entity";
import { UserService } from "src/user/user.service";

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    private feishuService: FeishuService,
  ) {}

  // 验证飞书用户
  async validateFeishuUser(code: string): Promise<Payload> {
    const feishuInfo: FeishuUserInfo =
      await this.getFeishuTokenByApplications(code);

    // 将飞书的用户信息同步到数据库
    const user: User =
      await this.userService.createOrUpdateByFeishu(feishuInfo);

    return {
      userId: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      feishuAccessToken: feishuInfo.accessToken,
      feishuUserId: feishuInfo.feishuUserId,
    };
  }

  // jwt 登录
  async login(user: Payload) {
    return {
      access_token: this.jwtService.sign(user),
    };
  }

  // 获取飞书用户信息
  async getFeishuTokenByApplications(code: string) {
    const data = await this.feishuService.getUserToken(code);
    const feishuInfo: FeishuUserInfo = {
      accessToken: data.access_token,
      avatarBig: data.avatar_big,
      avatarMiddle: data.avatar_middle,
      avatarThumb: data.avatar_thumb,
      avatarUrl: data.avatar_url,
      email: data.email,
      enName: data.en_name,
      mobile: data.mobile,
      name: data.name,
      feishuUnionId: data.union_id,
      feishuUserId: data.user_id,
    };
    return feishuInfo;
  }
}
```

上述代码中分为两个模块，一个是获取飞书用户信息以及对获取到的用户信息本地落库，另外一个是调用 `jwtService` 进行登录。

**第二步**：新建 `/src/auth/strategies` 目录，添加 `feishu-auth.strategy.ts` 与 `jwt-auth.strategy.ts` 两个文件：

```ts
// feishu-auth.strategy.ts
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, Query, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "../auth.service";
import { Strategy } from "passport-custom";
import { FastifyRequest } from "fastify";

@Injectable()
export class FeishuStrategy extends PassportStrategy(Strategy, "feishu") {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(req: FastifyRequest): Promise<Payload> {
    const q: any = req.query;

    const user = await this.authService.validateFeishuUser(q.code as string);

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
```

```ts
// jwt-auth.strategy.ts
import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-jwt";
import { jwtConstants } from "../constants";

import { FastifyRequest } from "fastify";

const cookieExtractor = function (req: FastifyRequest) {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies["jwt"];
  }
  return token;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: jwtConstants.ignoreExpiration,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: Payload): Promise<Payload> {
    return { ...payload };
  }
}
```

`FeishuStrategy` 根据 `passport` 提供的方法，自定义了飞书的专属策略，调用 `authService` 中的 `validateFeishuUser` 方法，从飞书获取对应的用户信息。`JwtStrategy` 则是使用 `passport-jwt`拓展的功能，对 `cookie` 做了拦截、解密等功能。

注意无论是使用 `passport` 自带的三方功能或者自行拓展 `passport`，都需要对 `validate` 方法进行重写以便实现自己的业务逻辑。

**第三步**：新建 `/src/auth/guards` 目录，添加 `feishu-auth.guard.ts` 与 `jwt-auth.guard.ts` 两个文件：

```ts
// feishu-auth.guard.ts
import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class FeishuAuthGuard extends AuthGuard("feishu") {}
```

这里要**注意**，因为 `FeishuAuthGuard` 已经继承了通用的 `AuthGuard`，验证逻辑在 `FeishuStrategy` 实现了，所以并没有额外的代码出现，如果有其他的逻辑则需要对不同的方法进行重写已完成需求。

```ts
// jwt-auth.guard.ts
import { ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { BUSINESS_ERROR_CODE } from "@/common/exceptions/business.error.codes";
import { BusinessException } from "@/common/exceptions/business.exception";
import { IS_PUBLIC_KEY } from "../constants";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const loginAuth = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (loginAuth) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      throw (
        err ||
        new BusinessException({
          code: BUSINESS_ERROR_CODE.TOKEN_INVALID,
          message: "token 已失效",
        })
      );
    }
    return user;
  }
}
```

`JwtAuthGuard` 模块实现了 `canActivate` 与 `handleRequest` 的重写，分别是针对于自定义逻辑与异常捕获的处理。

因为我们使用了 `JwtAuthGuard` 作为全局验证，但有的时候也是需要针对于部分接口开启白名单。例如，登录接口就需要开启白名单，毕竟把登录接口也拦截了，整个项目就无法正常使用了。

**第四步**：在**第二步**中，`FeishuStrategy` 将获取到的飞书用户信息返回出来，被路由守卫挂载到 `request` 上，用户信息里面的内容会在后期频繁使用到，所以我们自定义一个用户的装饰器 `PayloadUser`，方便后期使用。

```ts
export const PayloadUser = createParamDecorator(
  (data, ctx: ExecutionContext): Payload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

**第五步**：新建 `src/auth/auth.controller.ts`。

```ts
import {
  Controller,
  UseGuards,
  Res,
  Get,
  Query,
  VERSION_NEUTRAL,
} from "@nestjs/common";

import { FeishuAuthGuard } from "./guards/feishu-auth.guard";
import { AuthService } from "./auth.service";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { GetTokenByApplications } from "./auth.dto";
import { Public } from "./constants";
import { PayloadUser } from "@/helper";
import { FastifyReply } from "fastify";

@ApiTags("用户认证")
@Controller({
  path: "auth",
  version: [VERSION_NEUTRAL],
})
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({
    summary: "飞书 Auth2 授权登录",
    description:
      "通过 code 获取`access_token`https://open.feishu.cn/open-apis/authen/v1/index?app_id=cli_xxxxxx&redirect_uri=http%3A%2F%2F127.0.0.1%3A8080%2Fauth",
  })
  @UseGuards(FeishuAuthGuard)
  @Public()
  @Get("/feishu/auth2")
  async getFeishuTokenByApplications(
    @PayloadUser() user: Payload,
    @Res({ passthrough: true }) response: FastifyReply,
    @Query() query: GetTokenByApplications,
  ) {
    const { access_token } = await this.authService.login(user);
    response.setCookie("jwt", access_token, {
      path: "/",
    });
    return access_token;
  }

  @ApiOperation({
    summary: "解析 token",
    description: "解析 token 信息",
  })
  @Get("/token/info")
  async getTokenInfo(@PayloadUser() user: Payload) {
    return user;
  }
}
```

`/src/helper/index.ts` 的内容如下：

```ts
import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const PayloadUser = createParamDecorator(
  (data, ctx: ExecutionContext): Payload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

由于 `Payload` 这种类型的申明会频繁使用到，所以可以创建全局类型申明文件来使用，新建 `types/globle.d.ts` 文件，根据自己的需求定制即可:

```
declare type Payload = {
  status?: number;
  userId: number;
  username: string;
  name: string;
  email: string;
  feishuAccessToken: string;
  feishuUserId: string;
  department?: string;
  departmentId?: string;
};
```

在 `getFeishuTokenByApplications` 方法中我们使用了 `@UseGuards(FeishuAuthGuard)` 与 `@Public()` 两个装饰器，分别是飞书应用授权拦截与开启接口白名单。

在经过了 `@UseGuards(FeishuAuthGuard)` 之后，可以使用 `@PayloadUser` 获取到的飞书用户信息，再将用户信息进行 `JWT` 注册。

**第六步**：新建 `/src/auth/auth.module.ts`。

```ts
import { Module } from "@nestjs/common";
import { UserModule } from "src/user/user.module";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt-auth.strategy";
import { PassportModule } from "@nestjs/passport";

import { JwtModule } from "@nestjs/jwt";
import { jwtConstants } from "./constants";
import { AuthController } from "./auth.controller";
import { FeishuStrategy } from "./strategies/feishu-auth.strategy";

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: jwtConstants.expiresIn },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, FeishuStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

将 `JwtModule` 在 `AuthModule` 中注册，并将其他的 `Controller`、`Services` 等都导入，最后记得将 `AuthModule` 导入 `app.module.ts`：

```ts
import { CacheModule, Module } from "@nestjs/common";
import { UserModule } from "./user/user.module";
import { ConfigModule } from "@nestjs/config";
import { getConfig } from "./utils";
import * as redisStore from "cache-manager-redis-store";
import { APP_GUARD } from "@nestjs/core";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: getConfig("REDIS_CONFIG").host,
      port: getConfig("REDIS_CONFIG").port,
      auth_pass: getConfig("REDIS_CONFIG").auth,
      db: getConfig("REDIS_CONFIG").db,
    }),
    ConfigModule.forRoot({
      ignoreEnvFile: true,
      isGlobal: true,
      load: [getConfig],
    }),
    UserModule,
    AuthModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
```

`/src/auth/constants.ts` 的内容如下：

```ts
import { SetMetadata } from "@nestjs/common";

export const jwtConstants = {
  secret: "yyds", // 秘钥，不对外公开。
  expiresIn: "15s", // 时效时长
  ignoreExpiration: true, // 是否忽略 token 时效
};

export const IS_PUBLIC_KEY = "isPublic";

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

**第七步**：修改 `main.ts` 注册 `@fastify/cookie`

```diff
import { ValidationPipe, VersioningType, VERSION_NEUTRAL } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastify from 'fastify';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/exceptions/base.exception.filter';
import { HttpExceptionFilter } from './common/exceptions/http.exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { FastifyLogger } from './common/logger';
import { generateDocument } from './doc';
+import fastifyCookie from '@fastify/cookie';

declare const module: any;

async function bootstrap() {

  const fastifyInstance = fastify({
    logger: FastifyLogger,
  })

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(fastifyInstance)
  );

+  app.register(fastifyCookie, {
+    secret: 'my-secret', // for cookies signature
+  });

  // 统一响应体格式
  app.useGlobalInterceptors(new TransformInterceptor());

  // 异常过滤器
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

  // 接口版本化管理
  app.enableVersioning({
    defaultVersion: [VERSION_NEUTRAL, '1', '2'],
    type: VersioningType.URI,
  });

  // 启动全局字段校验，保证请求接口字段校验正确。
  app.useGlobalPipes(new ValidationPipe());

  // 创建文档
  generateDocument(app)

  // 添加热更新
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }

  await app.listen(3000);
}
bootstrap();
```

将飞书应用对接中获取的临时登录凭证填入 `Swagger` 测试接口中执行，如下图所示，`JWT Token` 已经正常返回了，并且被 `NestJS` 后端注入到 `cookie` 中：

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d3c0c63fde7340768c588847f4e3e0d9~tplv-k3u1fbpfcp-watermark.image?)

**第八步**：一般来说，登录权限需要全局开启，只有少部分的接口通过白名单开放给外部使用，所以需要将 `JWT` 的自定义路由挂载到全局，修改 `app.module.ts`，添加全局 `APP_GUARD` 模块。

```js
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: getConfig('REDIS_CONFIG').host,
      port: getConfig('REDIS_CONFIG').port,
      auth_pass: getConfig('REDIS_CONFIG').auth,
      db: getConfig('REDIS_CONFIG').db
    }),
    ConfigModule.forRoot({
      ignoreEnvFile: true,
      isGlobal: true,
      load: [getConfig]
    }),
    AuthModule,
    UserModule
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
```

在正常写入 `JWT Token` 以及添加全局 `JWT` 路由拦截后，可以通过 `Swagger` 中的 `/token/info` 接口来测试是否能正常解析 `token` 的信息，如果一切正常的话，则出现如下图界面：

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/0b4c6feb3cb24695827ad5b0bd64ecc7~tplv-k3u1fbpfcp-watermark.image?)

## 写在最后

本章示例代码以上传 [demo/v9](https://github.com/boty-design/gateway/tree/demo/v9)，文中示例已经是大部分的完整代码了，除了 `User` 模块的实体类可以根据自己的类型来处理，如若需要的同学可以拉取代码对比。

本章主要介绍了如何利用飞书的三方接口以及 `NestJS` 提供的 `Guards` 能力，使用 `Passport` 与 `JWT` 来完成第三方应用授权的功能，减少用户的使用成本。

其中，我们学习了 `Guards` 模块、`Passport` 以及 `JWT` 的相关知识，有兴趣的同学可以与其他的框架如 `Egg` 的接入做一个对比，**设计理念**与**代码编写**的不同可以从登录功能的实现中深刻体会到。

另外，本章并未过多的介绍 `Guards` 模块，`NestJS` 源文档对此的描述已经足够完备，想要了解更多的细节或者设计可以去源文档直接查阅，作为实战类型的小册，本章之后的主体内容将聚焦在如何完成业务开发上，不会再针对某一个模块功能做更详细的解释。

如果你有什么疑问，欢迎在评论区提出或者加群沟通。 👏

---

# 第09章—学习里程碑：基础篇完结

## 学习里程碑 | 🏆 - 基础篇完结

首先，恭喜你能从第一章坚持学习到这里。这一章，我们就一起来回顾一下我们都学到了什么。

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/437c5900fd524160bc6cf673bcb4396c~tplv-k3u1fbpfcp-watermark.image?)

对照上图的实战路径，我们已经一起走过了**需求分析** -> **技术选型** -> **脚手架搭建**三个环节，还完成了少量的**需求开发**任务。

#### 需求分析

从应用场景到团队需求，我们进行了一轮对网关系统必要性的讨论，并将网关系统拆分为三个模块：**网关基础**、**物料**、**用户**三个服务，分别执行代理、鉴权、静态资源管理等功能。

#### 技术选项

针对于需求分析得出来的结果，最终我们敲定了开发框架以及数据库的选型。对于项目开发的技术选型，从团队业务的角度出发，个人有下述一些想法：

1. 如果是稳定类型、或者团队主要的项目，切记不要强行尝试新的技术、框架，试错成本太高，一般的团队承受不起；
2. 不到万不得不要自己造轮子，即使要造轮子也可以使用业务成熟的框架进行二开；
3. 如果团队不大的情况，项目的基建要尽早统一，可以减少对接成本；
4. 资源富裕的情况下，边缘类型的新项目、内部项目等尽可能尝试新的技术，技术团队始终要走在技术的前沿，有机会可以以技术驱动业务。

#### 脚手架搭建

在后续章节中围绕着开发脚手架搭建，我们一起学习了 `NestJS CLI` 的使用、`Controller`、`Service`、`Provide`、`Module` 等基础知识，同时对接了**飞书应用**、**数据库**、**日志**等小的需求开发。

几乎每一章的代码与步骤都尽可能详细地写在文章里面，包括预期的结果等。力争每一位前端同学都能够从 0 到 1 完成上述到所有内容，**如果出现内容描述不清晰或者步骤缺失的情况，请及时联系我补充修改**。

## 仓库地址

https://github.com/boty-design/gateway

上述是基础篇中代码的仓库地址，但并不包含**配置文件（数据库、token这种都属于隐私性质的数据）**，需要各位同学自己添加，**如果 `demo` 跑不起来，加群@我解决，同时不到万不得已，建议还是自己从头撸出来**。

下面是一份全量的 `example.yaml` 配置，由需要的同学自取：

```yml
MONGODB_CONFIG:
  name: "fast_gateway_test"
  type: mongodb
  url: "mongodb://127.0.0.1:27017"
  username: "root"
  password: "root"
  database: "fast_gateway_test"
  entities: "mongo"
  logging: false
  synchronize: true
MYSQL_CONFIG:
  name: "user-test"
  type: "mysql"
  host: "127.0.0.1"
  port: 3306
  username: "yanxiaofan"
  password: "123456"
  database: "user-test"
  entities: "mysql"
  synchronize: true
REDIS_CONFIG:
  host: "127.0.0.1"
  port: 6379
  auth: "yanxiaofan"
  db: 1
TEST_VALUE:
  name: "cookie"
FEISHU_CONFIG:
  FEISHU_URL: https://open.feishu.cn/open-apis
  FEISHU_API_HOST: https://open.feishu.cn
  FEISHU_APP_ID: cli_xxxxxxx
  FEISHU_APP_SECRET: xxxxxxx
APP_TOKEN_CACHE_KEY: APP_TOKEN_CACHE_KEY
```

## Warring

小册于 `2022/07/24` 进行了一个小型的版本重构，按照每一章的进度添加了最小示例，所有的步骤代码都已上传 [GitHub](https://github.com/boty-design/gateway) 中，按照 `demo/v*` 的分支规则提交。

但建议同学们在学习的时候，尽量自己跟着小册的内容再配合阅读 `NestJS` 的官网 `API` 来进行，小册是提供一个快捷学习的途径，通过给予一个最终的目标，分阶段的让大家来学习，而不是单纯完成任务。我甚至可以写的再更详细一点，但如果直接复制、参考 `Demo` 来完成目标，最终预期的学习效果并不会非常理想。

**能够完完整整自己敲出来的代码才印象才是最深刻的，而在这过程中对 `NestJS` 开发的熟练度与理解包括排查错误与阅读文档的能力才会有很高的提升**。

## END

至此上半场的内容已经顺利完成，此时你应该依据具备了使用 `NestJS` 开发服务端的常规能力，接下来我们将进入下半场的内容 - **项目实战**。

在项目实战中，对于代码的内容会逐步减少，只有部分关键的代码会在文章中展示，原因有 2 个：

1. 大部分的业务开发代码价值都不会很高；
2. 每个人的编码习惯不一样，对功能模块的划分、业务的封装都有自己的见解。

所以实战篇的内容主要围绕着架构设计展开，但是最后依然会提供一份简单的实现代码作为参考，所以并不用担心没有参考的代码。

如果你有什么疑问，欢迎在评论区提出或者加群沟通。 👏

---

# 第10章—FAQ：学习篇

## 前言

本章将会记录微信群或者私人与我沟通所有学习篇相关的问题。

## 飞书应用相关问题

鉴于很多同学反馈对于飞书应用配置比较繁琐，为了方便协助大家完成飞书的流程，现在可以扫下面的二维码统一加入我创建的飞书组织：

![飞书20221011-223636.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/654f6d0dca464a7c9ae2b1356b636af1~tplv-k3u1fbpfcp-watermark.image?)

**飞书应用的秘钥如下，大家可以直接使用，加入飞书组织后需要的话可以联系我配置邮箱或者其他的数据，如果自己创建应用也可以联系我帮忙调整权限之类的**：

```
FEISHU_CONFIG:
  FEISHU_URL: https://open.feishu.cn/open-apis
  FEISHU_API_HOST: https://open.feishu.cn
  FEISHU_APP_ID: cli_a2ed5e7be4f9500d
  FEISHU_APP_SECRET: <已脱敏，请替换为自己的应用密钥>
```

## v9 版本升级方案

`NestJS` 于 **7** 月 **8** 号推送了 **v9** 版本，所以有不少同学在跟着教程安装的过程中出现了依赖问题。

本着买新不买旧的原则，小册也立马出更新升级 **v9** 的方案，如果你的项目配置出现问题可以参考如下的升级方案。

1. 升级所有相关的基础包到 **v9** 版本

如果直接使用最新的 **CLI** 工具应该不需要升级基础包，如果不是的话，至少需要更新如下两个基础包的版本

```shell
yarn add @nestjs/core@9.0.1
yarn add @nestjs/platform-fastify@9.0.1
```

2. 替换 `fastify` 相关依赖，之前所有 `fastify-` 规则的依赖都替换为 `@fastify/` 类型，例如 `fastify-cookie` 替换成 `@fastify/cookie`

3. 新版将只需要安装 `@nestjs/swagger` 即可，不在需要额外安装 `fastify-swagger`

4. 需要额外安装 `@fastify/static`

5. `redis` 模块采用 [ioredis](https://github.com/luin/ioredis) 替换之前的，配置方式略有改变如下所示：

```ts
// Before
const app = await NestFactory.createMicroservice<MicroserviceOptions>(
  AppModule,
  {
    transport: Transport.REDIS,
    options: {
      url: "redis://localhost:6379",
    },
  },
);

// Now
const app = await NestFactory.createMicroservice<MicroserviceOptions>(
  AppModule,
  {
    transport: Transport.REDIS,
    options: {
      host: "localhost",
      port: 6379,
    },
  },
);
```

整体来说，**v9** 版本的升级除了一些依赖版本有所改变以及加了一些新的特性之外，没有很大的改动，升级过程也非常平滑，所以就不针对之前的文章内容做出更改，而是单独出了一份升级 **v9** 的加餐章节。

当然你可以继续使用 **v8** 版本开发项目，只要锁定版本就行了，**但我们后续的工程将使用 **v9** 版本开发，保持框架的所有依赖都是最新的**，所以如果你的项目还没有正式投入使用，建议最好跟随一起升级到最新的版本。

如果你有什么疑问，欢迎在评论区提出或者加群沟通。 👏

---

# 第11章—用户篇：RBAC权限设计

## 前言

从本章开始是一道分水线，在这之前我们一起学习了 `NestJS` 的基础用法，通过搭建脚手架以及完成一些小需求逐步地熟悉了 `NestJS` 的开发模式。

首先，我们一起看一个非常熟悉的场景。张三在页面中点击了删除按钮后，系统在背后做了一些什么样的操作？

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/52142b047b764852a160e46821a5cf32~tplv-k3u1fbpfcp-watermark.image?)

一个用户在使用系统做某些操作的时候，系统会去数据库或者其他持久化的地方查询该用户所拥有的权限，然后根据查询出的结果判断此次操作是否正常。

简单的情况，一张表存储用户的权限，然后直接查询判断即可。但**用户量足够大又或者权限非常多**的话怎么办呢？一个新的系统需要接入用户、权限的时候，又该怎么办？

带着这些疑问，本章将介绍如何去设计一个**可拓展的**用户权限系统？

## RBAC 权限设计

### 什么是 RBAC 模型

为了解决前述的问题，我们将引入 **RBAC** 权限管理设计。

> **RBAC（Role-Based Access Control）** 的三要素即**用户**、**角色**与**权限**。 用户通过赋予的角色，执行角色所拥有的权限。

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1683434857d14024bf5318a679af4666~tplv-k3u1fbpfcp-watermark.image?)

**RBAC** 引入之后的流程如上图所示，用户在进入系统之后，会先进行角色判断，再根据对应的角色查询所匹配的权限，最后根据返回结果来判断是否可执行。

直观来说，整个调用的链路被拉长了，直接使用用户与权限的绑定关系，明显速度会更快。

所以为什么不直接使用**用户 -> 权限**的链路而是采用**用户 -> 角色 -> 权限**的链路呢？

通过下述的表格数据，我们来对比一下两个方案的差别：

| 方案                     | 用户量       | 权限数 | 权限表数据量       |
| ------------------------ | ------------ | ------ | ------------------ |
| **用户 -> 权限**         | **1**        | **10** | **10 \* 1**        |
| **用户 -> 权限**         | **100，000** | **10** | **10 \* 100，000** |
| **用户 -> 角色 -> 权限** | **1**        | **10** | **10 \* Role**     |
| **用户 -> 角色 -> 权限** | **100，000** | **10** | **10 \* Role**     |

上面的数据可能看得有些懵懂，我们转换文字版本来解释一下：

如果一个用户拥有 **10** 个权限的话，使用用户权限关联表后，一个用户就会有 **10** 条数据，**10** 万个用户的话就有 **100** 万的数据，代表着当一个用户进入系统之后，我们需要在**百万级别的数据表**中查询对应的权限数据。

而使用 **RBAC** 之后，当用户进入系统之后，先查询用户对应的角色，再查询角色映射对应的权限表，即便是一个角色对应一个用户，那么查询量也就是在 **10 \* 10** ，比直接查询百万数据表的数据量直线下降，如上对比可以看出，使用 **RBAC** 能大量节约查询成本与时间。

同时一个角色可以挂载多个权限，从实际使用场景、覆盖的范围以及性能优化上都比单纯的**用户-权限**表更高效。

### RBAC 模型的分类

**RBAC** 模型可分为 **RBAC0**、**RBAC1**、**RBAC2**、**RBAC3**，其中 **RBAC0** 是基础模型。 **RBAC1**、**RBAC2**、**RBAC3** 都是在 **RBAC0** 模型的基础上升级。

#### RBAC0 模型

**RBAC0** 即最简单的用户角色权限管理模型：

- 用户和角色可以是一对多，一个用户只能赋予一个角色； 一个角色可以关联多个用户
- 用户和角色可以是多对多的关系， 一个用户拥有多个角色；一个角色可以关联多个用户

通常在功能简单，用户人员较少，并且用户岗位很明确，而且用户不会兼任时使用一对多关系；其余情况普遍采用多对多的关系。

基于此模型设计数据库表如下：

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/25a84dce643d4a688af1026671814efd~tplv-k3u1fbpfcp-watermark.image?)

#### RBAC1 模型

基于模型 **RBAC0** 的升级版本，一个角色可以从另一个角色继承许可权，即角色具有上下级的关系。

一个简单的例子，**GitLab** 中 **master** 与 **dev** 分为两种角色，**matser** 的权限会涵盖 **dev** 所有的权限，也就是 **master** 继承了 **dev** 的权限，同时额外增加了更高级别的权限。

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2759d0ce19b04b1498cc8e3ed9e38126~tplv-k3u1fbpfcp-watermark.image?)

角色间的继承关系可分为一般继承关系和受限继承关系：

- 一般继承关系允许角色间的多继承，无特殊限制；
- 受限继承关系则进一步要求角色继承关系是一个树结构，也就是继承关系受到限制，继承 **A** 类后的角色不再允许继承同级角色 **B** 类，等同于测试与开发的子权限不能互相继承。

简单的表达关系如下所示：

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5772933eb57d47068e6498e0d07a8f25~tplv-k3u1fbpfcp-watermark.image?)

#### RBAC2 模型

**RBAC2** 模型是在 **RBAC0** 模型基础上解决了角色的授权场景。角色授权分为两类：

- 静态职责分离
- 动态职责分离

静态职责分离又具体分为：

1. 角色互斥 -- 多种角色间不能同时赋予同一个用户，比如 **devops** 中，研发、产品与测试的权限不会相互重复赋予，当然你可以设置一个更高级别的角色权限 **leader** 来同时享用所有权限。
2. 基数约束 -- 角色至多能赋予 **N** 个用户。
3. 先决条件角色 -- 授予用户 **B** 角色前提是用户必须已经拥有 **A** 角色，这个在项目管理中比较常见，当你想给你组员分配角色时，你的角色权限理应高于需要分配的角色。

动态职责分离即运行时通过当前会话确定用户角色。例如以我们的范例飞书来说，在飞书账号中可以有多重公司认证，但登录的时候只能选择确定的一家公司身份才能进入。

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1a74a10e944e4fd2b21c010a8f6ab83b~tplv-k3u1fbpfcp-watermark.image?)

#### RBAC3 模型

**RBAC3** 模型是目前最全面的权限管理，它是基于 **RBAC0** 的基础上，并将 **RBAC1** 和 **RBAC2** 进行了整合。模型示例如下图所示：

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/947ee692cda447269d167c821a07b9e2~tplv-k3u1fbpfcp-watermark.image?)

## 进阶 - 用户组

当系统用户非常多以及角色种类非常多的情况，为了更方便的管理人员，此时可以引用用户组的概念。

每一个用户组分配一批用户，再将角色分配到用户组，将用户与角色之间的桥接关系再引入一层用户组，使得用户只与用户组绑定，用户组与角色绑定。当新的用户想要分配权限的时候，可以直接添加到对应的用户组，这样快速开通该用户组的所有权限，再根据需求分配更细节的角色即可。

这个场景的实例可以参考 **GitLab** 的 **Group** 管理模式。

- 用户可以拥有单独的角色权限
- 用户分配到用户组就可以自动拥有用户组的角色权限

这种设计大大减少了数据的冗余性和管理员对权限管理的工作复杂程度。

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5b7265490e764a49b3a2220e43494c73~tplv-k3u1fbpfcp-watermark.image?)

## 权限的拓展

当系统逐渐庞大后，权限也需要更加的粒度细化。对于权限的管理分为功能权限和数据权限：

- 功能权限：将系统的可操作性分配给角色，来控制用户的可见性和可编辑性
  1. 读写权限：可见可编辑，
  2. 只读权限：仅可见不可更改
  3. 不可见权限：不可见也没有操作入口
- 数据权限：数据是多维的、抽象的，主要控制某条数据记录对用户是否可见，结合功能权限可以更灵活的配置业务过程中每一位员工的功能操作权限及数据可见范围
  1. 基础数据：比如只有创建人可编辑，其他人只读
  2. 数据共享：比如部门 **A** 的所有成员均可查看部门 **A** 的全部处理的财务记录。

针对功能权限按功能类型可分为菜单模块、页面元素模块、文件资源模块等。要结合实际业务需要合理划分功能点来控制权限的粒度，将权限拆分到模块可以方便后续的其他类型模块拓展。

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/0b4a90a89e93423187917875ee11c781~tplv-k3u1fbpfcp-watermark.image?)

针对于上述所有的拓展与设计，最终版本的设计如下所示：

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/192cff00645e41759d06859323f589d4~tplv-k3u1fbpfcp-watermark.image?)

## 项目实战设计

真实的项目中，建议按照上述的模式开发，整体功能完整性与拓展性都会比较好，但是对于我们的系统而言，有点重量级，所以并不会完全按照上述的架构设计开发功能。

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d24caa0187c544c5933aff6b50af9b8d~tplv-k3u1fbpfcp-watermark.image?)

在我们的需求设计中，用户系统需要分别针对两个系统提供鉴权服务，借助用户组的概念，最终用户系统的用户权限模型为下图所示：

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9ba2555d099b4011bcc9e98d009c024a~tplv-k3u1fbpfcp-watermark.image?)

> 下面是权限操作界面的网图，给大家做一个参考，实际我们的项目并没有前端的项目开发，只涉及后端开发，如果有需要或者有兴趣可以参考下图自行实现。

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/08cfaa8b8d8b4751a26889f65abf1a9a~tplv-k3u1fbpfcp-watermark.image?)

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/022d90ce9b204af28b5713597b2c2816~tplv-k3u1fbpfcp-watermark.image?)

## 写在最后

用户系统的代码已完成初版，需要的同学可以自取 [feat/user](https://github.com/boty-design/gateway/tree/feat/user)，相关的注释也已经补充完毕，如果感觉哪里需要修改或者不明白的地方可以随时与我沟通。

从本章开始将进入正式的实战环境，**从第十章开始一直到微服务的章节将全部都是真实的项目设计**，我们将通过各种项目的设计与思路来解析每个项目开发。

跟之前说的一样，由于每个人的编码习惯与真实需求不一致，所以不会跟学习篇一样，将代码以及步骤完完整整的搬到教程里面来，只是提供具体的设计方案与思路，但最后提供以教程中的架构实现的项目，所以记得关注 <https://github.com/boty-design/gateway>，同时进群获取最新的进度。

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9b5e343d74b549249a6a4a7d426b6fbd~tplv-k3u1fbpfcp-watermark.image?)

如果你有什么疑问，欢迎在评论区提出或者加群沟通。 👏

---

# 第12章—物料篇：物料系统设计

## 前言

上一章介绍了 **RBAC** 权限模型的设计，后续会将基于 **RBAC** 的用户中心代码放在 **GitHub** 上，大家可以进群获取最新的代码进度。

在需求分析中，我们提到了在网关基础服务中需要代理转发静态资源，正常来说这个功能一般是 `DevOps` 或者搭建系统来完成的，但由于 `DevOps` 与搭建系统自身就是一个非常庞大的体系，为了专注于网关系统功能不扩散范围，所以我们挑选了一个比较基础的物料服务来进行**页面资源的管理**。

本章我们将介绍物料的一些相关知识以及物料系统的设计。

## 物料系统

#### 什么是物料?

物料这个概念也算是一个比较新的名词，有些同学可能没有听说过，但实际上你不仅接触过物料而且已经在使用甚至是开发了。

首先，我们来剖析一个前端的项目构成：**应用 -> 页面 -> 区块 -> 业务组件 -> 基础组件**。

如果一个成熟的团队会用什么来快速完成整个工程呢？

1. 一套基于团队标准规范的**基础组件库**，包含 **PC** 与 **H5** 甚至多端组件库；
2. 多套符合业务常见的**业务组件库**，例如电商组件库（购物车、商品库、金刚位、广告位等）；
3. 多种**区块**组合，例如金刚位与广告位的多种组合模式，需要微调整的模块；
4. 多套**模板**，例如电商中的各种营销模板（砍一刀、大转盘、抽奖机等）。

上面这些模块在一个稍具规模的团队中，至少具备 **1** 跟 **2** 或者更多，只不过不少的团队没有将它们归类并做成一套通用的物料系统而已。

所以物料的概念可以理解为：**所有能直接搭建出页面级别的基础模块都可以纳入物料的统筹**。

#### 为什么需要物料？

前面提到了，一个成熟的团队应该怎样**快速**完成一个新的工程，以及如何对旧工程进行迭代、优化升级。

当一个团队负责业务越来越多，研发成员逐步增加，项目上下游协作链路越来越长（**设计 -> 研发 -> 测试 -> 产品验收**），如果每一次新的需求或者新的项目启动的时候，都没有任何开发、样式的规范，也没有任何的资源、组件或者代码的复用率，很容易导致项目迭代、维护困难，业务与样式质量差。最重要的是会有很多重复的工作，造成资源浪费与人工成本增加。

这也是为什么当一个团队的业务逐步稳定之后，就会开始制定**设计规范、开发规范**，增加代码、组件的复用率，提高个人开发效率。当规范达到一定的标准，相对应也会减少设计、测试的投入，整体的效能也会有所提高。

#### 如何去开启第一步？

跟工厂流水线一样，首先从**开发语言**、**脚手架**入手，从源头将最基础的地基统一了，才有机会完成后面的规范。不然团队中每个人都根据自己的喜好选择 `Vue`、`React`、`Angular` 或者其他小众一点的框架来开发的话，这个标准的落地就会非常困难。

在完成了基础开发语言与框架的统一之后，就可以联合产品与设计制定相关的基础 `UI` 级别的规范，产出通用的组件库代码。

最后，再根据自身的业务不断精炼代码，抽取通用逻辑与组件，完成第一批业务组件的积累。

#### 何为组件、区块与模板？

基础组件的概念比较好理解，将所有业务剔除，能够保持最小的元素就可以作为基础组件，它是可枚举、可抽象以及通用的，例如常见的 **table** 以及 **form** 一套组件。

> 目前业内做的比较好的 `React` 技术栈的组件库有 [Antd](https://ant.design/docs/react/introduce-cn)，`Vue` 技术栈的组件库有 [Element](https://element-plus.org/zh-CN/#/zh-CN) 与 [iView](https://iview.github.io/)。个人并不建议每个团队都从头开始造轮子，可以以目前主流成熟的开源组件库为基础做二次开发定制，这也应了小册第一章所说的，并不是所有的轮子都有必要造。

基础组件作为最小单位的构成元素，通用性非常高，覆盖面非常广，但是仍然没办法满足实际业务线快速开发的需求，业务组件也就由此诞生。

业务组件是基于基础组件但附带了**业务属性**的组件，通常情况下业务组件受垂直业务领域的影响，必然是有领域壁垒的，比如电商组件库与 **SCM** 组件库就有很大的差距。

无论是业务组件还是基础组件，都属于组件的范畴，最终的产物大多数都是以 **Props** 这种可配置的传参模式来使用。

区块则是融合了基础与业务组件之后的产物，**与组件不同的是，区块是以复制代码的模式直接添加到工程化当中**。

当你的业务需要大量的重复模块的代码，这些模块的代码在每一处都会有不同的业务处理方式，无法通过配置来完成所有的功能时，这个时候就需要区块来帮你完成了。

模板可以看作大号区块，但更加成熟，以页面级别为单位，由前三种子模块组装而成，同样也是以代码的模板加入到工程中。

#### 产物管理

组件一般都是以配置模式使用，所以通常都需要经过构建才能被工程所引用，常规的组件产物有两种形态：**NPM** 包与 **CDN** 资源。这种模式非常利于组件模块快速被工程引入，而且通过构建之后非常方便版本管理。

至于区块与模板，因为已经是纯 **Code** 的模式，所以发布 **NPM** 与 **CDN** 都不太合适，一般是直接使用 **Git** 仓库源码模式来管理。但是通过仓库源码直接管理的话，依赖引入（需要手动引入或者全局引入一套全组件依赖）与版本管理都会有问题。

此时，就需要借助一个物料系统来帮我们将这些零碎的模块统一管理起来，方便业务同学使用。

## 物料系统设计

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6521f34d998148b3857244458245ca63~tplv-k3u1fbpfcp-watermark.image?)

基于上述的分析与讨论，最终我们的物料系统需要保存的数据类型有上述几种:

1. 基础组件
2. 物料组件
3. 区块
4. 模板
5. 页面

> 其中，页面的产物类型是额外附加上去，一般属于**搭建系统**才会保存的产物类型，但由于我们的网关系统中需要这种产物，所以才会放进来。

在产物管理中提到了，组件与区块、模板在存储方面是有一些区别的，所以在物料体系设计中，需要对这两种类型的产物做一些兼容性的合并。

首先考虑接入物料系统中的代码仓库管理模式采用 **monorepo** 还是 **multirepo**。

对于上述两种代码仓库管理模式各有千秋，常规的物料系统一般都是采用 **multirepo** 管理产物，这样方便数据管理产物的构建与版本。对于**业务组件库**这种本身就有领域壁垒的类型产物，以 **multirepo** 的模式来管理非常方便，也能够让大部分的开发所接受。

但是，如果采用 **multirepo** 来管理**基础组件库**，对开发来说就非常难受。因为基础组件库本身有不少的逻辑与基础能力可以复用，但 **multirepo** 模式会把它拆得比较零碎，所以对于基础组件库常见的管理模式是 **monorepo**。

那么问题来了，**multirepo** 的管理模式在物料系统中可以有唯一的映射，每一次的项目构建的产物结果都具备唯一性，但是 **monorepo** 的构建产物不具备唯一性，每次的构建产物结果可能存在多个。

为了解决这个问题，在我们的物料系统中，引入**虚拟物料的概念**，也就是 **monorepo** 模式管理的工程，可以手动在系统中申明，在构建环境不再关注构建产物的具体结果，根据构建的版本统一升级所有虚拟物料的版本即可。

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4ffade5dde0447ae9176e9db832e34cd~tplv-k3u1fbpfcp-watermark.image?)

下图分别是真实物料与虚拟物料添加的界面，虚拟物料的产物结果是通过人工添加进去管理的，而真实物料则是每一个仓库就对应一个物料。

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9300bd5b71294080a0b9cfd2f1de3399~tplv-k3u1fbpfcp-watermark.image?)

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3347cc973b7441a492f7fb17c6310078~tplv-k3u1fbpfcp-watermark.image?)

下图是物料系统一个单仓的管理与发布界面：

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c0c2f4d1f6ff4d95b549d9802ce5c722~tplv-k3u1fbpfcp-watermark.image?)

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e3ca28bca02c4adaa615054859abb945~tplv-k3u1fbpfcp-watermark.image?)

对于区块、模板以及页面这种类型的物料，在发布的时候除了版本管理之外，最好也将 **Code** 内容完整地存在数据库中，这样方便其他的系统消费，例如使用 **Snapshot** 做成代码插入插件，在 **VS Code** 中开发时直接消费区块、模板等物料。

## 写在最后

本章介绍了物料的特性以及物料系统该怎么设计，具体的开发细节以及数据表结构设计将会在下一章详细讲述。

在物料系统设计中出现的截图是已经投入使用的完整版本，它包含了 `DevOps` 与搭建体系，但小册的物料实战并不会展示完整的体系，而是聚焦在物料管理控制这个流程上。有兴趣的同学在跟着完成物料实战之后，可以结合自己公司的 `CICD` 体系完善起来。

如果你有什么疑问，欢迎在评论区提出或者加群沟通。 👏

---

# 第13章—物料篇：物料开发与构建

## 前言

上一章我们一起学习了物料的相关知识以及该如何设计一个通用的物料系统，大家应该也对物料的价值以及设计有一个初步的概念。

在本章我们将会介绍物料系统的开发以及服务端构建的相关知识，注意本章的内容虽然会涉及到物料产物 `CICD` 相关的范围，但实际小册提供的物料系统并不包含 `CICD` 构建的模块，所以有想将物料系统实际用于生产的同学需要自己来实现 `CICD` 的功能。

## 物料系统开发

先来回顾一下上一章的内容，物料的产物分类有下面几种：

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6521f34d998148b3857244458245ca63~tplv-k3u1fbpfcp-watermark.image?)

#### 构建类型产物

其中所有的组件类都是需要通过构建产出的，其他的如模板、代码区块都是以 `code` 模式存在。既然存在构建过程那么物料系统就需要对接 `Devops` 系统，通过 `CICD` 来构建产物上传物料。

所以在物料系统中会有 `Project` 的概念对应的是 `Git` 仓库，每一个 `Project` 都会对应一个 `Git` 仓库方便 `Devops` 系统进行工程构建，于是我们第一个物料系统的表为 `Project`：

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/725b6df598ef4a7f973b79794efb45aa~tplv-k3u1fbpfcp-watermark.image?)

> `Project` 表主要是存储 `CICD` 项目构建信息，所以这张表一般情况下也是存在于 `Devops` 系统中，所以如果有 `Devops` 系统的话，就没必要在物料系统中再创建一张表，一般可以由 `Devops` 直接提供 `CICD` 底层服务通过微服务集成到物料系统或者使用双写表模式来共同管理 `Project` 表（双写表模式并不推荐，存在互相覆盖以及重复开发的情况）。

在上一章我们也提到了，物料中存在两种包管理方式分别是 **monorepo** 与 **multirepo**，根据 **multirepo** 类型的物料，物料系统是可以根据产物直接推断出版本依赖结果，但是 **monorepo** 类型的物料并做不到，只能通过以创建虚拟物料的方式来推断出产物结果。

通常情况下物料的数量一般比较多，而且也会与各个业务线有关联，所以在物料系统中会有一个物料集的概念，来管理同一类的物料，比如电商物料库与 **CRM** 物料库等，所以我们的物料表结构可以如下所示：

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/88588302680644e0962268adf15cf34d~tplv-k3u1fbpfcp-watermark.image?)

从上图的实体类可以看出，虚拟物料集与实体物料类会保存 `ProjectId` 字段，物料系统可用根据 `ProjectId` 字段可以查询出 `Project` 的项目信息，从而进入 `CICD` 流程来进行项目构建。

表中的 `alphaVersion`、`betaVersion`、`gammaVersion` 分别对应的是 `NPM` 产物中的 `alpha`、`beta`、`gamma` 类型的包如：`@boty-design/fe-cli@0.0.1-beta.8`，小数点最后一位则使用 `devVersion`、`testVersion`、`preVersion` 来表示物料当前的版本分别在各个环境已经构建了多少次，当然最终生产环境打出来的包为 `@boty-design/fe-cli@0.0.1`。

在构建完毕项目之后，就需要保存对应的产物结果，`NPM` 类型的物料结果是可以通过物料实体类中的 **name + version** 两个字段直接推断出来如：`@boty-design/fe-cli@0.0.1`，而 `CDN` 类型的产物需要带有全连接才行如：`https://abc.com/boty-design/fe-cli/0.0.1/idnexjs`（如果能保证 `CDN` 的域名一致的话，其实也可以使用 **name + version** 推断出产物结果），所以产物结果表可以为：

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/19dcbcbbf7bf414598d83259b584bfe3~tplv-k3u1fbpfcp-watermark.image?)

所以结合上述所有的表，最终构建类型物料的表结构如下：

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/aecea9f2ae0e40afae7ddb9e85cee9ca~tplv-k3u1fbpfcp-watermark.image?)

理论上以上的表结构设计足够满足绝大部分类型的物料存储，各位同学可以根据自己的实际情况来进行调整，比如团队中不需要 `dev`、`test` 环境的，可以删除 `alpha`、`beta` 相关的字段。或者想使用 `CICD` 的方式来产出对应的页面或者区块的话，也可以拓展 `MaterialConfig` 的表结构。

#### 代码类型产物

除去组件这种强依赖构建的类型之外，剩下如区块、模板都可以以 `Code` 形式直接存储在数据库当中。所以他们的表结构相对于简单，只涉及到对应配置的增删改查：

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6c3f0389bd6c447285a14b0280a946e9~tplv-k3u1fbpfcp-watermark.image?)

在 `Config` 表中有一个 `contain` 的字段是用来保存 `Code` 的，与物件类型的物料不同，`CodeMaterial` 表除了 `currentVersion` 之外额外多了 `currentConfigId` 字段，在客户端消费区块跟模板的时候需要使用 `currentConfigId` 从 `Config` 表中查询对应的数据，获取存储的 `Code` 内容。

#### 网关资源

网关一般只需要代理前端页面级别的资源，其他的资源一般都是放在 `CDN` 或者 `OSS` 上，所以我们需要一张 `Page` 表来存储对应的访问域名、路径与产物：

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6a2c2f6591fc45f4845ae443a23fe3dd~tplv-k3u1fbpfcp-watermark.image?)

网关基础服务会将访问域名解析为 `domain` 与 `path`，再读取 `Page` 表来查询对应的配置信息，最后将查询出来的 `HTML` 资源返回给前端访问。

最后放上物料系统的终极表结构设计：

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f6e7041b0c1d4330b51acf06238fb06d~tplv-k3u1fbpfcp-watermark.image?)

## 物料构建

上述是物料系统的开发，接下来我们简单讲述一下物料系统的构建过程：

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6759968c75c44a90a5d9374c9dc8386e~tplv-k3u1fbpfcp-watermark.image?)

常规的流程如上图所示，物料系统会创建一条 `task` 来记录物料的发布信息，同时触发 `Devops` 的构建流程，在 `Devops` 构建流程完成之后，由 `Devops` 系统推送构建消息给物料系统，物料系统根据推送消息的结果，来判断是否来保存物料的产物信息。

**这里有一个非常重要的点**，所有的物料产物结果尽可能的保持结构唯一尤其是 `CDN` 类型的产物，`CDN` 的最终产物的结果一般可以为 `https://domain/ptah/name/version/index.js`，如果不能保证产物的格式统一的话，那么对于物料系统来说可以有两种解决方案：

1. 所有的产物结果保存都由 `CLI` 工具构建出真实产物后上传
2. 使用拓展字段来手动修正产物结果，使得 `CDN` 的数据有效

**但这两种解决方案无疑都是会造成额外的使用与学习成本**，所以最好的方案是开发物料的时候，可以以统一脚手架与模板来约束研发开发物料，对于物料系统的开发与管理成本会比较少，另外统一的规范也是能够在团队快速推广物料系统的好手段。

## 写在最后

物料系统的地址为 [feat/material](https://github.com/boty-design/gateway/tree/feat/material)，需要的同学自取，会持续更新。

其实对于网关系统来说，只需要代理页面级别的资源，根据域名匹配返回对应的 `HTML` 内容，所以上述的所有表只有 `Page` 与 `Config` 这两张表在网关体系是真实有用的。

`Page` 的产物一般与 `CICD` 或者搭建系统有关，但无论是 `Devops` 还是搭建系统，两者都属于一个非常庞大的系统，在网关系统的小册中肯定是完成不了的，单独拎出去写两本小册恐怕都不够，但我又想多一个实战的项目给大家历练，所以最后选择了将 `Page` 相关的开发直接升级为物料系统。

最终的物料系统代码目前也在开发中，跟用户系统一样，小册里面不会过多的展示相关的代码，每个人的实际需求与风格都不相同，不想做过多的约束，但我会按照上文中的架构与表结构设计直接开发一套完成的工程放在 `github` 上供给同学们参考。

希望同学们最好可以根据小册的内容加上自己的理解独立完成物料系统的开发，在不涉及 `Devops` 的情况下，物料系统开发的难度远不如用户系统，如果开发过程遇上任何的难处或者疑惑的地方，欢迎加群或者加我的微信来讨论解决方案。

如果你有什么疑问，欢迎在评论区提出或者加群沟通。 👏

---

# 第14章—网关篇：代理与缓存

## 前言

前两章，我们一起学习了物料、用户系统的设计与开发，在经过了用户系统与物料系统的折磨之后，大家应该对 `NestJS` 已经非常的熟悉了，学习旅途也到了网关系统中**最关键与核心**的功能模块开发。

由于物料与网关核心功能的耦合度非常高，操作起来非常麻烦，毕竟我们没有真实的界面，所以在本章内容中，我们会使用 `mock` 数据来实现代理转发的功能，同时对缓存数据做一个大概的介绍。

## 网关核心系统开发

#### 拦截路由

在需求分析中我们提到了，网关基础服务作为所有资源的前置入口，需要对所有的请求进行拦截，再根据请求的类型分发到对应的服务或者返回需求的资源，所以我们需要一个接受所有请求的 `Controller`。

新建 `src/core/intercepter.controller.ts` 如下所示

```ts
import { Public } from "@/auth/constants";
import { Controller, Get, Req, Res } from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";
@Controller()
export class IntercepterController {
  constructor() {}
  @Get()
  async getApp(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    res.send("html");
  }
}
```

> 注意，此时的 `getApp` 引入了 `@Res() res: FastifyReply`，不能直接 `return` 返回值，需要使用 `res.send` 来返回 `html` 格式

新建 `src/core/intercepter.module.ts`，并在 `app.module.ts` 中导入。

```ts
import { Module } from "@nestjs/common";

import { IntercepterController } from "./intercepter.controller";

@Module({
  controllers: [IntercepterController],
})
export class IntercepterModule {}
```

然后请求接口 http://localhost/api （**为了方便后期修改 `DNS` 测试本地域名，可以将项目启动端口改成 80**），可以得到如下返回值。

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f51de1f90d414269a80034eabc35089e~tplv-k3u1fbpfcp-watermark.image?)

从图上看出，请求路径是携带了 `api` 前缀的，并不符合拦截全部路由的要求，可以修改 `main.ts` 中的 `setGlobalPrefix` 方法：

```diff
- app.setGlobalPrefix('api');
+ app.setGlobalPrefix('api', { exclude: ['*'] });
```

同时再修改 `src/core/intercepter.controller.ts` 中的 `getApp` 的 `Get` 配置：

```diff
- @Controller()
+ @Controller('*')
export class IntercepterController {
  constructor() { }
  @Get()
  async getApp(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    res.send('html')
  }
}
```

然后再访问如下路由对比即可以发现，当访问到项目已存在的接口时，会正常走之前的业务逻辑，当访问不存在的业务逻辑路由时，将统一进入 `IntercepterController` 中：

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2d0a80ad81024acda2f7330fad156d7f~tplv-k3u1fbpfcp-watermark.image?)

#### 解析路由

首先，我们需要根据域名来匹配不同的返回页面，在上一步已经将项目启动端口修改为 **80**，所以直接修改系统的 `host` 目录，来修改域名 `DNS` 解析，使之指向本地服务，然后浏览器访问即可：

```yaml
127.0.0.1 www.cookieboty.com
127.0.0.1 nginx.cookieboty.com
127.0.0.1 jenkins.cookieboty.com
127.0.0.1 gitlab.cookieboty.com
127.0.0.1 devops.cookieboty.com
127.0.0.1 fe.cookieboty.com
```

```diff
@Controller('*')
export class IntercepterController {
  constructor() { }
  @Get()
  async getApp(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
-    res.send('html')
+    res.send(req.headers.host)
  }
}
```

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6bba855e6a4f4205855c0d55d933bc57~tplv-k3u1fbpfcp-watermark.image?)

如上图所示，我们可以通过 `req.headers.host` 来拿到对应的域名来判断返回资源，但是仅仅有域名肯定是不足够的。

通常情况下，一个域名下面会存在多个前端项目，这些前端项目可以通过路由前缀来区分，例如 www.cookieboty.com/devops 、www.cookieboty.com/jenkins 等等，所以我们也需要对整个 `url` 进行解析。

同时，也存在 `SPA` 项目中使用 `history` 的情况，这样的话就会存在虚拟路由，真实的访问地址与浏览器请求的地址不匹配的情况，我们也需要模拟 `Nginx` 中的 `try_files` 模式。

`第一步`：借助 `url` 库来组装路由

```diff
+ import { URL } from 'url';

export class IntercepterController {
  constructor() { }
  @Get()
  async getApp(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
+   const urlObj = new URL(req.url, `http://${req.headers.host}`);
+   console.log('urlObj===>', urlObj)
    res.send(req.headers.host)
  }
}
```

访问之前的域名可以在控制台得到如下的结构：

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3e7457f9da2d4868982713167018d3c6~tplv-k3u1fbpfcp-watermark.image?)

> 可以看到控制台中有两种打印，普通的 `html` 会自动请求 `favicon` 资源，我们只需要拦截正常的请求，过滤掉 `favicon.ico` 这种类型的请求即可，或者返回一个通用的小图标也行。

**第二步**：修改 `IntercepterController`，添加读取 `html` 方法与判断空异常：

```
@Controller()
export class IntercepterController {
  constructor(private readonly intercepterService: IntercepterService) { }

  @Get('*')
  @Public()
  async getApp(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    const urlObj = new URL(req.url, `http://${req.headers.host}`);

    if (urlObj.pathname === '/favicon.ico') return res.send('ico');

    const html = await this.intercepterService.readHtml(urlObj);

   if (!html) return res.send('404');

    res.headers({
      'Content-Type': 'text/html',
    });
    res.send(html);
  }
}
```

**第三步**：新建 `src/core/intercepter.service.ts` 添加 `IntercepterService`

```ts
import { Injectable } from "@nestjs/common";

import { WebSiteDataModel } from "./types";
import { getMatchedSync } from "./intercepter";
import { ConfigService } from "@nestjs/config";
import * as WebsitesMock from "./websites_mock.json";
import * as FilesMock from "./files_mock.json";

@Injectable()
export class IntercepterService {
  constructor() {}

  get websites(): Record<string, WebSiteDataModel> {
    return WebsitesMock as Record<string, WebSiteDataModel>;
  }

  async readHtml(urlObj: URL) {
    const { data: matchedData } = getMatchedSync(urlObj, this.websites);
    if (!matchedData) return null;
    const html = FilesMock[matchedData.pageId];
    return html;
  }
}
```

`files_mock.json`

```json
{
  "1": "devops",
  "2": "jenkins",
  "3": "nginx"
}
```

`websites_mock.json`

```json
{
  "www.cookieboty.com": {
    "/devops": {
      "lastModified": 1,
      "pageId": 1
    },
    "/jenkins": {
      "lastModified": 1,
      "pageId": 2
    },
    "/nginx": {
      "lastModified": 1,
      "pageId": 3
    }
  }
}
```

**第四步**：创建解析 `url` 的方法，解析路由地址，例如将 `devops/list`、`devops/detail` 等路由全部指向到根路由地址 `devops` 的资源上，在第三步中的 `getMatchedSync` 方法就用作此判断：

```ts
export const getMatchedSync = (
  urlObj: URL,
  websites: Record<string, WebSiteDataModel> = {},
):
  | { path: string | undefined; data: PageModelItem | undefined }
  | undefined => {
  if (!urlObj.hostname) {
    return undefined;
  }

  const website = matchWebsite(urlObj.hostname, websites);

  if (!website) {
    return undefined;
  }

  const { data, path } = matchPath(website, urlObj.pathname);

  if (!data) {
    return { path: undefined, data: undefined };
  }

  return { data, path };
};
```

先由 `matchWebsite` 来匹配 `host`，获取匹配成功的 `host` 数据之后，再使用 matchPath 方法进行 `path` 的匹配：

```ts
export const matchWebsite = (
  host: string,
  websites: Record<string, WebSiteDataModel>,
): WebSiteDataModel | undefined => {
  return websites[host];
};

export const matchPath = (
  website: WebSiteDataModel | undefined,
  targetPath: string,
): { path: string; data: PageModelItem } | undefined => {
  if (!website) return;

  const targetPathArr = splitPath(targetPath);

  if (targetPathArr.find((i) => i === "*")) {
    throw new Error(
      "[matchPath] website custome path include *, redirect to 404",
    );
  }

  // 全匹配
  if (website[targetPath]) {
    return {
      path: targetPath,
      data: website[targetPath],
    };
  }

  // .html 后缀 且 不等于 index.html,
  if (/\/[^\/]+\.html$/.test(targetPath) && !/\/index\.html/.test(targetPath)) {
    return {
      path: targetPath,
      data: website[targetPath],
    };
  }

  // 通配
  let matchLen = 0;
  let resultKey: string;
  Object.keys(website.path || {}).forEach((path) => {
    if (!path.startsWith("/")) path = `/${path}`;

    const pathArr = splitPath(path);
    // 非必须容错：仅允许最后一个字符出现 *
    if (pathArr.slice(0, -1).find((i) => i === "*"))
      throw new Error("[matchPath] path include *");

    /**
     * 遍历路由规则列表，匹配命中立即停止遍历
     */
    let currentMatchLen = 0;
    let currentResultKey: string;
    for (let i = 0; i < pathArr.length; i += 1) {
      if (targetPathArr[i] !== pathArr[i]) {
        currentMatchLen = 0;
        currentResultKey = undefined;
        return;
      } else if (undefined === targetPathArr[i]) {
        currentMatchLen = 0;
        currentResultKey = undefined;
        return;
      }
      currentMatchLen = i + 1;
      currentResultKey = path;
    }

    if (matchLen < currentMatchLen) {
      matchLen = currentMatchLen;
      resultKey = currentResultKey;
    }
  });

  return {
    path: resultKey,
    data: website.path[resultKey],
  };
};
```

#### 获取资源

在解析路由的第三步中，大家应该注意到在路由匹配中，有 **2** 个 `mock json` 文件 `websites_mock.json` 与 `files_mock.json`，它是由物料系统中的 `pages` 组成的，具体的结构为：

```ts
/**
 * @description 站点数据模型
 */
export interface WebSiteDataModel {
  /**
   * @description 站点下的所有 path 表
   */
  [host: string]: {
    [path: string]: PageModelItem;
  };
}

export interface PageModelItem {
  /**
   * @description 最后修改时间
   */
  lastModified?: number;

  /**
   * @description 页面 id
   */
  pageId?: number;

  /**
   * @description 权限
   */
  permissions?: Array<() => (boolean | Promise<boolean>) | boolean>;
}
```

正常情况下，我们是需要通过 `pageId` 去数据库查询出对应的资源返回，不过在 `mock` 的情况省略了，现在我们一起来看看结果如何：

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b97b6feac96e49ecaf6f4ef51828c0c5~tplv-k3u1fbpfcp-watermark.image?)

> 注意 http://www.cookieboty.com/jenkins/list 与 http://www.cookieboty.com/jenkins 这两个路由，它就是之前所提到过的虚拟路由匹配，当访问的资源为 `SPA` 项目使用 `history` 构建的话，`jenkins` 之后所有的路径都需要强制指向 `jenkins` 这个路由上。

#### 缓存

由于我们是静态资源代理，所以为了达到最快的访问速度，给用户提供最高的性能体验，可以借助 **3** 层缓存来实现。

**第一层缓存**：由客户端自身在访问之后产生的协商缓存，当请求资源不变的情况下，用户访问的是本地资源，这个知识点，大部分的前端同学都应该掌握的非常熟悉，这里就不再拓展了。接下来介绍一下，在我们的项目中如何利用缓存来提高访问效率。

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4c75a9135fbb4e10b1eeb3cbb14e0f62~tplv-k3u1fbpfcp-watermark.image?)

如上图所示，第二层缓存与第三层缓存分别是程序运行本地服务器与 **Redis** 服务。

当第一个用户在访问页面时，如果在本地没有查询到资源的话，会向 **Redis** 服务请求资源，当 **Redis** 服务也没有请求到对应的资源的话，最后再去请求 **MongoDB** 获取。

同样在每一次请求到资源的情况下，都会在对应的层级缓存资源，这样任一一个用户访问资源之后，就会产生缓存数据，这样可以减少数据库的读写，同时提高响应速度。

可能有同学说 `Redis` 这一层可以省略，但一般网关服务也会使用分布式部署方式，在分布式架构中你命中的服务不一定是在本地有缓存了，所以即使丢失本地缓存，也不能舍弃 `Redis`，当任一的服务命中资源之后，都会在 `Redis` 中产生缓存，其他的服务也可以共享缓存数据。

另外在本地缓存中，由于会存储大量的文件，所以也会存在旧版资源冗余的情况，所以在之前的设计中，永远都只保存最新的资源产物，不会保留历史产物，通过 `lastModified` 参数来判断需要更新资源。

当资源过多的情况下也可以使用 `LRU` 算法来清空本地资源，看需求进行功能拓展即可，大家尽情发挥，不用客气。

> 在缓存的工具选择上，大家可以选择自己熟悉的工具即可，只是 `NestJS` 自带的缓存插件对接 `Redis` 比较方便，并不代表你一定要使用 `Redis` 才行，比如我们公司目前的缓存使用的是 `Nacos`。

## 写在最后

本章的代码地址为 [feat/core](https://github.com/boty-design/gateway/tree/feat/core)，需要的同学自取，会持续更新。

由于篇幅所限，文章里面提到的开发内容比较少，只有最核心的两个功能，其他的功能可以等待完整的项目出来之后再对比学习即可，一般关键的地方我会做必要的注释，如果还有其他的问题可以加群讨论或者直接联系我都行。

到目前为止，我们已经陆陆续续开发 **3** 个大的功能模块，大家应该能感觉到目前的工程已经很庞大了，如果是普通开发模式的话，每一次的重启速度已经变慢。

整个项目目前已经有 **40+** 个接口，如果物料系统再复杂点的话，已经 **50+** 的接口不在话下。而这只是 `Controller` 的数量，并未括工具类与 `Service` 层的代码。

所以在接下来下一章，我们将对这个逐渐变成巨石的工程进行项目拆分，降低项目之间的耦合度，做到独立部署与独立开发。

如果你有什么疑问，欢迎在评论区提出或者加群沟通。 👏

---

# 第15章—进阶篇：项目拆分

## 前言

在上一章的末尾提到了目前我们的工程已经成为了一个非常大的应用，它分别有网关 `Core`、用户、物料三大模块组成，即使目前模块的功能都还是最简单的情况下，都已经达到了 **40+** 接口的程度，后期再复杂一点的情况下，那么整个项目的迭代都会变得很复杂。

为了避免后期的开发与维护的麻烦，可以提前将工程拆解为 **3** 个独立的项目。

## 项目拆分

#### 拆分方式

在物料系统中提到了一般项目管理方式有如下两种：

- **multirepo 分散式管理**

将项目分化成为多个模块，每一个模块都有一个独立的 `Reporsitory` 来管理。

**优点**：

1. 对于每个项目来说，不再限定开发语言与规范，开发人员可以选择擅长的框架来开发功能；
2. 单项目的功能将更加聚焦，只关注某一个具体模块的开发，开发人员在需求分配上会更为合理；
3. 可以有自己的分支管理规范与开发节奏，单需求开发效率更高。

**缺点**：

1. 同步上线会比较困难，一个大型的项目可能存在十几或者更多服务模块，一次上线可能需要同步构建多个服务；
2. 由于多个仓库管理，同步需求中相互依赖性上升，开发联调效率会降低；
3. 存在不同语言、框架实现的情况，会造成总体项目维护成本上升。

- **monorepo 集中式管理**

将所有的模块统一的放在同一个 `Reporsitory` 中管理。

**优点**：

1. 统一的规范、语言、框架，项目整体结构完整性远超 `multirepo` 方式；
2. 标准化的开发流程，规避很多不必要的冲突与错误，包括整体架构升级等；
3. 所有模块都在一个项目中方便调试与总体工程级别的迭代与维护。

**缺点**：

1. 项目过大的情况下，整体代码过于臃肿；
2. 单仓库中对分支管理要求较高，修改和开发可能变得繁琐，降低效率。

综上所述，两种模式都有利有弊，分布式管理比较简单也是大家常用的开发模式，所以接下来我们将着重展示 `monorepo` 的拆分步骤。

#### Monorepo 拆分

由于我们的项目是基于 `Nest CLI` 搭建的，所以可以直接使用 `Nest CLI` 提供的 `monorepo` 的拆分功能。

首先执行，`CLI` 的 `generate app` 脚本，分别创建对应的 `materials` 与 `userCenter` 工程。

```shell
$  nest generate app materials
$  nest generate app userCenter
```

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/17f6c27dfaa84ccf86680ff878121d99~tplv-k3u1fbpfcp-watermark.image?)

如上图所示，`Nest CLI` 已经帮我们创建好了对应的工程目录，同时大家也可以观察一下 `nest-cli.json` 里面的参数配置区别：

```diff
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "apps/fast-gateway/src",
  "monorepo": fasle,
-  "sourceRoot": "src"
+  "root": "apps/fast-gateway",
+  "compilerOptions": {
+    "webpack": true,
+    "tsConfigPath": "apps/fast-gateway/tsconfig.app.json"
+  },
+  "projects": {
+    "fast-gateway": {
+      "type": "application",
+      "root": "apps/fast-gateway",
+      "entryFile": "main",
+      "sourceRoot": "apps/fast-gateway/src",
+      "compilerOptions": {
+        "tsConfigPath": "apps/fast-gateway/tsconfig.app.json"
+      }
+    },
+    "materials": {
+      "type": "application",
+      "root": "apps/materials",
+      "entryFile": "main",
+      "sourceRoot": "apps/materials/src",
+      "compilerOptions": {
+        "tsConfigPath": "apps/materials/tsconfig.app.json"
+      }
+    },
+    "user-center": {
+      "type": "application",
+      "root": "apps/user-center",
+      "entryFile": "main",
+      "sourceRoot": "apps/user-center/src",
+      "compilerOptions": {
+        "tsConfigPath": "apps/user-center/tsconfig.app.json"
+      }
+    }
+  }
}
```

> 默认情况下，启动了 `monorepo` 模式就会默认打开 `webpack` 的配置项，但如果不想自己导入实体类或者其他静态路径的话，可以设置为 `false`。

与之前我们项目中使用的 `nest-cli.json` 配置不同的，多了 `monorepo`、`compilerOptions`、`projects` 等参数，它们是之前介绍过的在 `NestJS` 中使用 `monorepo` 模式开发的必备参数，但这些已经有 `CLI` 帮我们创建好了，对于规范化的工程来说，`CLI` 能做的事情还是非常多的。

接着修改启动脚本，由于我们默认的项目是 `fast-gateway`，所以直接使用 `nest start:dev` 启动的就是 `fast-gateway` 的项目，其他的启动脚本修改如下：

```json
// package.json
"start:gateway": "cross-env RUNNING_ENV=dev nest start --watch",
"start:user": "cross-env RUNNING_ENV=dev nest start --watch user-center",
"start:materials": "cross-env RUNNING_ENV=dev nest start --watch materials",
```

其中 `user-center` 与 `materials` 分别对应启动配置文件中的子项目，如果填错的话，则会默认启动主项目。

由于之前我们使用了别名配置，所以要修改对应的 `tsconfig.app.json` 的配置才能正常启动项目：

```json
// apps/fast-gateway/tsconfig.app.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "paths": {
      "@/*": ["src/*"],
      "types/*": ["../../types/*"]
    },
    "baseUrl": ".",
    "outDir": "../../dist/apps/fast-gateway"
  },
  "include": ["src/**/*", "../../types/*.d.ts"],
  "exclude": ["node_modules", "dist", "test", "**/*spec.ts"]
}
```

主要是修改了别名路径跟全局依赖这些配置，再修改完 `tsconfig` 配置之后，基本上不需要改动代码，即可正常启动项目。

接下来，我们分别运行 `yarn start:gateway` 与 `yarn start:user`，即可看到两个项目已经可以分别运行起来了。

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6aa02111cc4d4397966bddca93b83184~tplv-k3u1fbpfcp-watermark.image?)

#### 公共模块 library

任何适合复用的功能都可以作为库来管理，也就是提取重复的模块，然后在每个项目中直接引用，如果需要修改的话，则只需要库的代码即可。

`NestJS` 在 `monorepos` 的模式下，提供了 `library` 的配置，可以让项目以轻量级的方式来使用这些公共的模块，而在 `multirepo` 的模式下，大部分则是采用 `npm` 包的方式来处理公共模块。

在之前的项目开发中，我们有一个 `comm` 的文件夹来处理公共的逻辑部分，之前良好的编码规范此时就派上了用场，接下来可以使用 `library` 来讲 `comm` 中的模块进行封装。

**第一步**：创建 `comm library`：

```shell
$ nest g library common
```

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/59d13a774e374a34a86e5df3aac17308~tplv-k3u1fbpfcp-watermark.image?)

**第二步**：将 `fast-gateway` 工程中 `comm` 的模块全部移植到 lib 中，并在 `index.ts` 中导出

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9c01ab4699014925b7d08614abbf2681~tplv-k3u1fbpfcp-watermark.image?)

**第三步**：修改工程中的引用路径

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d457130031fd46068d8448b31580bdee~tplv-k3u1fbpfcp-watermark.image?)

如果怕修改不彻底的话，可以直接删除 `comm` 目录，然后根据控制台错误修改对应的引用路径即可。

> 注意：`comm` 中的 `database` 模块也被复制了，移动了路径所以要记得修改加载实体路径，否则启动的时候并不会报错，但运行的时候会报找不到实体类，因为我们的三个项目的数据库都是共用的，所以这一块的代码也被我抽取出来使用。所以 `database` 模块的抽取需要根据自己的实际情况来使用。

#### 拆解业务

再完成了之前所有的步骤之后，就可以开始拆分具体的业务代码了，与 `comm` 转成 `library` 一样，公共的代码我们也是按照目录来划分的，~~所以拆解业务的过程也会非常的顺利~~(_一点都不顺利，改引用路径改的快死了_)

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1f629431b4a943faaaa89ad2b1f6ca30~tplv-k3u1fbpfcp-watermark.image?)

为了快速的分割项目，有些路径我使用了相对路径，有兴趣的同学可以将引用路径优化的更好一点。

如果有同学不习惯使用 `monorepo` 的开发方式，而是 `multirepo` 来管理项目，那么拆分的过程相对来说会比较顺利，路径问题应该比较容易解决。

如果想使用 `multirepo` 来管理项目的话，则需要使用 `nest build common` 命令将 `library` 打包之后上传到私有或者公有源以 `npm` 包的方式引入即可，但要注意这种方式引入之后数据库的实体类引用路径可能也需要修改。

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f1ae0c5e49604170bdd6fe0ff393bd8e~tplv-k3u1fbpfcp-watermark.image?)

## 写在最后

本章的示例代码在 [feat/monorepo](https://github.com/boty-design/gateway/tree/feat/monorepo)，后续会进行持续的迭代，有需要的同学自取。

本章主要介绍了将一个完成的工程拆分为多个项目的过程，借助 `NestJs CLI` 提供的 `monorepo` 与 `library` 的功能，总体拆分的过程还是非常的顺利，基本上只需要修改简单的引用路径与 `tsconfig` 的别名即可。

在项目拆分之后，除去公共模块的引用之外，每个系统的功能都保持了最单一的模块，但系统之间有些服务还是需要相互关联：比如用户系统需要提供给物料、网关系统登录、鉴权的功能、物料系统需要提供给网关资源消费的数据，此时就需要使用到微服务来将我们各个系统之间的功能进行打通。

所以在下一章节，我们将一起学习如何使用微服务将各个系统之间的服务关联起来。

如果你有什么疑问，欢迎在评论区提出或者加群沟通。 👏

---

# 第16章—进阶篇：微服务

## 前言

在上一章节中，我们已经对一个稍具复杂的项目进行了拆分，目前工程已经被拆成功能较为单一的三个独立项目：`Core`、用户与物料系统。

既然每个项目的功能是单一，但是在之前的需求分析中，它们又是组成网关系统的各个重要部分，那么该如何将各个系统中有关联的服务进行联通呢？

本章将介绍如何借助 `NestJS` 提供的 `RPC` 服务来打通各个系统之间的关联。

## 微服务

> 维基上对其定义为：一种软件开发技术- 面向服务的体系结构（SOA）架构样式的一种变体，它提倡将单一应用程序划分成一组小的服务，服务之间互相协调、互相配合，为用户提供最终价值。每个服务运行在其独立的进程中，服务与服务间采用轻量级的通信机制互相沟通（通常是基于 `HTTP` 的 `RESTful API`）。每个服务都围绕着具体业务进行构建，并且能够独立地部署到生产环境、类生产环境等。另外，应尽量避免统一的、集中式的服务管理机制，对具体的一个服务而言，应根据上下文，选择合适的语言、工具对其进行构建。

#### 微服务的优势

如上所说，微服务其实是将一个庞大的系统切割成多个最小单元，每一个单元都是一个或者一组相同的功能集合。

与传统的服务开发不同的是，当一个项目拆解为微服务的时候，带来的优势有如下几点：

1. 不再局限于**单一技术架构**的实现，根据不同模块的特殊性可以有专业的技术解决方案；
2. 新的业务功能不需要承担旧的技术债，同时可以拆解服务逐步进行技术升级；
3. **业务功能单一**，复杂度下降，开发维护效率提高；
4. 独立部署，单服务启动速度提高，必要时可以根据实际情况对某一些服务进行服务器**升级、扩容**。

#### 微服务通信方式

1. 同步方式：`RPC`、`HTTP`、`TCP`；
2. 异步方式：消息队列，使用中过程中需要考虑消息的可靠传输、高性能等情况，常见的工具有`Kafka`、`Notify` 等。

`HTTP` 与 `TCP` 都是常见的通信方式，那么 `RPC` 又是啥？

`RPC` **是一种设计、实现框架，通讯协议只是其中一部分**，并不限定某一类的通信协议，大部分的 `RPC` 协议使用的是 `TCP`，但也可以使用 `HTTP` 协议来封装，比如谷歌的 `gRPC` 使用的就是 `HTTP2` 协议。

在大概了解了微服务的一些知识之后，接下来继续我们的学习过程。

## NestJS 微服务使用

`NestJS` 作为一款非常成熟的框架，本身就支持微服务架构的设计，同时也内置了很多 `RPC` 的传输器，所以在 `NestJS` 中使用微服务是非常方便的。

#### 启动微服务

**第一步**：安装微服务依赖 `@nestjs/microservices`

```shell
$ yarn add @nestjs/microservices
```

**第二步**：修改用户系统中 `user-center/src/main.ts` ，添加微服务启动配置，并启动用户系统的微服务

```ts
declare const module: any;

import { NestFactory } from "@nestjs/core";
import { UserCenterModule } from "./user-center.module";

import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";

import fastify from "fastify";
import * as cookieParser from "cookie-parser";

import { generateDocument } from "./doc";
import {
  FastifyLogger,
  catchError,
  AllExceptionsFilter,
  HttpExceptionFilter,
} from "@app/common";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import fastifyCookie from "@fastify/cookie";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
catchError();
async function bootstrap() {
  // 初始化 fastify
  const fastifyInstance = fastify({
    logger: FastifyLogger,
  });

  // 创建 NEST 实例
  const app = await NestFactory.create<NestFastifyApplication>(
    UserCenterModule,
    new FastifyAdapter(fastifyInstance),
  );

  // micro serivce
  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.TCP,
      options: {
        port: 4100,
        host: "0.0.0.0",
      },
    },
    {
      inheritAppConfig: true, // 继承 app 配置
    },
  );

  app.register(fastifyCookie, {
    secret: "my-secret", // for cookies signature
  });

  // 异常过滤器
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

  // 设置全局接口前缀
  app.setGlobalPrefix("api");

  // 格式化 cookie
  app.use(cookieParser());

  // 接口版本化管理
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // 启动全局字段校验，保证请求接口字段校验正确。
  app.useGlobalPipes(new ValidationPipe());

  // 创建文档
  generateDocument(app);

  // 启动所有微服务
  await app.startAllMicroservices();

  // 启动服务
  await app.listen(4000);

  // 添加热更新
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
```

重启服务，看到控制台中有如下打印日志即代表微服务启动成功：

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/638ff629248a406e81ea2a4a90c75a51~tplv-k3u1fbpfcp-watermark.image?)

也可以使用 `netstat -ano -p tcp|findstr 4100` 检查 TCP 端口是否正常启动：

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/690f529ae82948a590f22e8ef1392cc2~tplv-k3u1fbpfcp-watermark.image?)

> 默认情况下，使用 `NestJS` 自带的 `RPC` 将使用 **TCP协议** 监听消息。

**第三步**：在物料系统中添加 `RPC` 客户端连接：

`.dev.yaml` 文件新增新的配置项 `USER_MICROSERVICES`：

```yml
USER_MICROSERVICES:
  host: "0.0.0.0"
  port: 4100
```

新建 `materials/src/microservices/microservices.module.ts`，添加如下代码，并导入 `materials.module.ts` 后，重启即可：

```ts
import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { getConfig } from "@app/common";
const { USER_MICROSERVICES } = getConfig();

@Module({
  imports: [
    ClientsModule.register([
      {
        name: "USER-SERVER",
        transport: Transport.TCP,
        options: USER_MICROSERVICES,
      },
    ]),
  ],
  providers: [],
  exports: [],
})
export class MicroservicesModule {}
```

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1617b6bb8bfe4960975743e104a82196~tplv-k3u1fbpfcp-watermark.image?)

#### 用户系统打通

**第一步**：在用户系统的 `user/UserController` 添加如下代码：

```ts
import { MessagePattern, Payload as MicroPayload } from "@nestjs/microservices";

export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userRoleService: UserRoleService,
  ) {}
  @MessagePattern("userCenter.user.profile")
  @Public()
  micro_profile(@MicroPayload() data: Payload) {
    return this.profile(data);
  }
}
```

**第二步**：在物料系统中移植之前的 `Auth` 模块，只保留以下模块：

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ea2be6057f73452d907064453fc60fc4~tplv-k3u1fbpfcp-watermark.image?)

**第三步**：物料系统中新增 `microservices/user.service.ts`：

```diff
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UserService {
  constructor(
    @Inject('USER-SERVER') private userServer: ClientProxy
  ) { }

  getUser(user) {
-   return this.userServer.send('userCenter.user.profile', user)
+   return firstValueFrom(this.userServer.send('userCenter.user.profile', user))
  }
}
```

> 注意客户端中获取 `RPC` 服务端的接口的方法是 `ClientProxy` 中的 `send()`，此方法请求并返回是响应数据流的 `Observable`，这并不是正常的 `HTTP` 返回的内容，而是通过 `TCP` 协议传输的内容。所以直接获取值是获取不到的，一定要记得使用 `rxjs` 中的 `firstValueFrom` 包一层才能拿到正常的返回值。

**第四步**：物料系统中新增 `src/auth/permission.guard.ts`

```ts
import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserService } from "../../microservices/user.service";
import { IS_PUBLIC_KEY } from "../constants";

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const loginAuth = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (loginAuth) return true;
    const request = context.switchToHttp().getRequest();
    const user: Payload = request.user;
    const codes = await this.userService.getUser(user);
    console.log("microservices===>", codes);
    return codes;
  }
}
```

`第五步`：将新的网关验证 `PermissionGuard` 导入 `materials.module.ts`：

```ts
import { CacheModule, Module } from "@nestjs/common";

import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";

import { ConfigModule } from "@nestjs/config";
import { TransformInterceptor, getConfig } from "@app/common";
import { GroupModule } from "./materials/group/group.module";
import { MaterialModule } from "./materials/material/material.module";
import { ProjectModule } from "./materials/project/project.module";
import { TaskModule } from "./materials/task/task.module";
import * as redisStore from "cache-manager-redis-store";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";
import { AuthModule } from "./auth/auth.module";
import { MicroservicesModule } from "./microservices/microservices.module";
import { PermissionGuard } from "./auth/guards/permission.guard";

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: getConfig("REDIS_CONFIG").host,
      port: getConfig("REDIS_CONFIG").port,
      auth_pass: getConfig("REDIS_CONFIG").auth,
      db: getConfig("REDIS_CONFIG").db,
    }),
    ConfigModule.forRoot({
      ignoreEnvFile: true,
      isGlobal: true,
      load: [getConfig],
    }),
    MicroservicesModule,
    GroupModule,
    TaskModule,
    MaterialModule,
    ProjectModule,
    AuthModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class MaterialsModule {}
```

然后访问物料系统的任意 `API` 得到如下结果则代表微服务正常启动，下图中使用的接口是http://localhost:3000/doc#/%E9%A1%B9%E7%9B%AE/ProjectController_getList

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9a6ed6fcdd464a09bf15d605c93fcf70~tplv-k3u1fbpfcp-watermark.image?)

> 由于是两个项目，启动后是不同的端口，所以在用户系统中登录之后保存的 `token` 是不会共享 `cookie` 在物料系统下面，所以为了方便，大家可以在用户系统登录完毕之后，手动将 `cookie` 存在物料系统下，如下图所示：

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/56532ebefe634c9ba62531171d4883a8~tplv-k3u1fbpfcp-watermark.image?)

至此已经完成了用户与物料系统的微服务打通，有兴趣的话，可以再将 `auth` 与 `microservices` 模块也一起放在 `libs common` 模块中，这样网关 `Core` 系统也能直接使用通用的鉴权工具。

## 写在最后

本章的示例代码在 [feat/microservices](https://github.com/boty-design/gateway/tree/feat/microservices)，后续会进行持续的迭代，有需要的同学自取。

本章主要介绍了如何在 `NestJS` 中使用 `RPC` 来打通各个微服务中的功能，前文的例子非常简单，实际上我们可以做的内容非常多的，比如在 `PermissionGuard` 中，我们可以通过 `RPC` 从用户系统中获取该登录用户的权限，然后再根据返回的权限对物料系统的接口做权限限制等。

示例中我们使用的微服务通信方式为同步模式，微服务的通信方式还有异步模式（一般也就是消息队列），但在我们的网关系统中其实是没有使用消息队列的场景，所以在网关系统中就无此实战，但是消息队列在 `Devops` 与物料系统的打通中会有很大的应用场景，所以各位可以持续关注 https://github.com/boty-design 这个组织，后期会以开源的方式完成整个工程的搭建。

**想了解后续的工程进度的同学，记得进学习群，每一次的功能发布，我都会在群里及时通知。**

如果你有什么疑问，欢迎在评论区提出或者加群沟通。 👏

---

# 第17章—进阶篇：自动化测试

## 前言

如果已经学习到了这一章，相信你已经至少将之前的项目做了一个大概的雏形出来了。

无论是参考示例还是全部靠自己做出来的，总之恭喜你已经度过了在一个项目开发周期中的最开心的时刻，因为之前每一项功能的完成，带来的都是一个个的成就感，让人能坚持下来并且乐此不彼的是在旅途中能不断的完成一些阶段性的目标，但接下来要做的我猜是大部分的开发都有点头疼的是事情，因为本章开始我们需要写自动化测试用例了。

## NestJS 自动化测试

一个项目的质量需要靠什么来保证，肯定不是看开发人员的经验，只要是人一定会犯错，没有完美的人也没有完美的程序。但从概率学上来说机器一定是比较靠谱的，毕竟只有逻辑而没有感情，所以自动化测试能够给予项目一定的质量和性能保证，同时一个项目的自动测测试用例覆盖越全面，对于测试同学的负担也就越少。

自动化测试有非常多的类型有单元测试，端到端(`e2e`)测试，集成测试等等，自动测试的框架也非常多，所幸`NestJS` 提供了内置开箱即用的 [Jest](https://github.com/facebook/jest) 和 [SuperTest](https://github.com/visionmedia/supertest) 集成，以及在测试环境中可以模拟 `NestJS` 的依赖注入体系，更方便的测试模块，这样使得我们可以降低一定的选择困难症，直接使用 `NestJS` 集成的即可。

> 当然你仍然可以选择自己熟悉的自动化测试框架（例如：[mocha](https://mochajs.org/)）来使用，`NestJS` 框架并未对你做过多的限制，只是处于 `NestJS` 的体系当中，除非有特殊需求，否则还是建议使用自带的测试功能。

#### Unit TEST

首先安装 `NestJS` 测试工具的依赖 `@nestjs/testing`，如果是 `CLI` 创建的话就不需要再安装依赖了。

```shell
$ yarn add @nestjs/testing
```

还记得之前在使用 `CLI` 快速创建的 `*.spec.ts` 文件吗？接下来我们就要使用上它了。

**第一步**：在 `intercepter.controller.ts` 中新增一个测试方法：

```diff
import {
  Controller,
  Get,
  Req,
  Res,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { URL } from 'url';
import { IntercepterService } from './intercepter.service';

@Controller()
export class IntercepterController {
  constructor(private readonly intercepterService: IntercepterService) { }

  @Get('*')
  async getApp(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    console.log(urlObj)
    if (urlObj.pathname === '/favicon.ico') return res.send('ico');

    const html = await this.intercepterService.readHtml(urlObj);

    if (!html) return res.send('404');

    res.headers({
      'Content-Type': 'text/html',
    });
    res.send(html);
  }

+  @Get('test')
+  getTest() {
+    return 'test'
+  }
}

```

**第二步**：新建 `intercepter.controller.spec.ts`，一般单元测试用例与测试模块保持在同一个目录下。

```ts
import { IntercepterController } from "./intercepter.controller";
import { IntercepterService } from "./intercepter.service";
import { ConfigService } from "@nestjs/config";
import { getConfig } from "@app/common";
import { FastifyRequest } from "fastify";

describe("IntercepterController", () => {
  let intercepterController: IntercepterController;
  let intercepterService: IntercepterService;
  let configService: ConfigService;

  beforeEach(() => {
    configService = new ConfigService({
      isGlobal: true,
      load: [getConfig],
    });

    intercepterService = new IntercepterService(configService);
    intercepterController = new IntercepterController(intercepterService);
  });

  describe("getTest", () => {
    it("should return an html", async () => {
      //     const result = 'devops';
      const result = "test";
      expect(await intercepterController.getTest()).toBe(result);
    });
  });
});
```

**第三步**：运行测试命令 `yarn test`，即可获得如下结果，当 `result` 分别是 `devops` 与 `test` 的测试结果如下：

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/41fc4c9c93bd48c0bbfbcdd660ed6b46~tplv-k3u1fbpfcp-watermark.image?)

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6bb7d968b9a44d348dfe3766a14fb0b3~tplv-k3u1fbpfcp-watermark.image?)

如上一个非常简单测试用例就完成了，接下来我们挑战一下高难的测试用例开发，来测试我们之前的网关代理接口。

首先看下 `IntercepterController` 的 `getApp` 这个方法，它的入参分别为 `@Req` 与 `@Res`，在单元测试中是没有正常的请求体的，所以需要手动将这两个入参数据模拟出来，我们可以借助 `mock-req-res` 这个库来生成模拟参数：

```shell
$ yarn add mock-req-res
$ yarn add sinon
```

在 `intercepter.controller.spec.ts` 中新增测试方法：

```
  describe('getApp', () => {
    it('should return devops', async () => {
      const req = mockRequest({
        headers: {
          host: 'www.cookieboty.com'
        },
        url: '/devops'
      })
      const res = mockResponse()
      const result = 'devops';
      expect(await intercepterController.getApp(req, res)).toBe(result);
    });
  });
```

继续执行之前的测试脚本：`yarn test` 即可得到如下结果：

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/0feed309c6074543971312a9b6ebf7ea~tplv-k3u1fbpfcp-watermark.image?)

啊嘞，报错很正常，从报错信息能很明显看出是模拟的 `@Res` 参数有问题，另外在 `getApp` 中是直接使用了 `res.send` 返回数据，这样在单元测试中是无法拿到正常的返回值，所以也需要同时修改 `getApp` 的返回方法：

```diff
 @Get('*')
  async getApp(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    if (urlObj.pathname === '/favicon.ico') return res.send('ico');
    const html = await this.intercepterService.readHtml(urlObj);

    if (!html) return res.send('404');

    res.headers({
      'Content-Type': 'text/html',
    });
-   res.send(html);
+   return res.send(html);
  }
```

然后在修改 `intercepter.controller.spec.ts` 的 `getApp` 方法：

```diff
describe('getApp', () => {
    it('should return devops', async () => {
      const req = mockRequest({
        headers: {
          host: 'www.cookieboty.com'
        },
        url: '/devops'
      })
-      const res = mockResponse()
+      const res = mockResponse({
+        headers: () => { },
+        send: d => d
+      })
      const result = 'devops';
      expect(await intercepterController.getApp(req, res)).toBe(result);
    });
  });
```

再次运行测试脚本得到如下结果代表测试成功：

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/adc693c624454185b6f8f4b56a02adc9~tplv-k3u1fbpfcp-watermark.image?)

上述的测试脚本，其实还没有使用到 `NestJS` 给我们提供的测试工具，大家可以发现，我们是将 `ConfigService` 与 `IntercepterService` 实例直接传递的，当依赖的测试模块多起来的时候并不是非常方便，接下来我们使用 `NestJS` 提供的测试工具来修改我们的脚本。

```diff
// intercepter.controller.spec.ts
  beforeEach(async () => {

-    configService = new ConfigService({
-      isGlobal: true,
-      load: [getConfig]
-    })
-    intercepterService = new IntercepterService(configService);
-    intercepterController = new IntercepterController(intercepterService);

+    const moduleRef = await Test.createTestingModule({
+      imports: [IntercepterModule,
+        ConfigModule.forRoot({
+          ignoreEnvFile: true,
+          isGlobal: true,
+          load: [getConfig]
+        }),],
+    }).compile();

+    intercepterService = moduleRef.get<IntercepterService>(IntercepterService);
+    intercepterController = moduleRef.get<IntercepterController>(IntercepterController);
  });
```

从以上代码对比大家可以发现，使用了 `NestJS` 自带的 `Test.createTestingModule` 方法后，除了不再需要主动实例化类之外，其他所有相关的依赖，我们只需要借助 `NestJS` 本身的依赖注入就可以完成，同时使用 `createTestingModule` ，会模拟 `NestJS` 的运行时，可以获取到上下文，所以拓展性会变得更高，有兴趣的同学可以试试更多的功能。

#### E2E TEST

单元测试主要是某个方法或者模块的逻辑测试，而 `E2E` 测试在更聚合的层面覆盖了类和模块的交互，尽可能的模拟用户在生产环境的操作。

当需要测试的链路非常长与复杂的情况下，单元测试是无法很好的保证链路可靠性，或者说它会变得更加复杂，所以这个时候也就需要 `E2E` 测试来保证链接的稳定与正确性。

接下来我们来一起学习 E2E 的测试用例开发。

首先在项目的 `test` 文件夹下创建 `apps/fast-gateway/test/intercepter.e2e-spec.ts` 文件：

```ts
import * as request from "supertest";
import { Test } from "@nestjs/testing";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { IntercepterModule } from "../src/core/intercepter.module";
import { ConfigService, ConfigModule } from "@nestjs/config";
import { getConfig } from "../src/utils/index";

describe("Cats", () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        IntercepterModule,
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          isGlobal: true,
          load: [getConfig],
        }),
      ],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  it(`/GET devops`, () => {
    return request(app.getHttpServer())
      .get("/devops")
      .set("host", "www.cookieboty.com")
      .expect(200)
      .expect("devops");
  });

  it(`/GET jenkins`, () => {
    return request(app.getHttpServer())
      .get("/jenkins")
      .set("host", "www.cookieboty.com")
      .expect(200)
      .expect("jenkins");
  });

  it(`/GET 404`, () => {
    return request(app.getHttpServer())
      .get("/jenk")
      .set("host", "www.cookieboty.com")
      .expect(200)
      .expect("404");
  });

  it(`/GET nginx`, () => {
    return request(app.getHttpServer())
      .get("/nginx")
      .set("host", "www.cookieboty.com")
      .expect(200)
      .expect("nginx2");
  });

  afterAll(async () => {
    await app.close();
  });
});
```

> `e2e` 的测试文件一定要放在对应项目的 `test` 文件夹中，否则不会生效。

接下来运行 `e2e` 测试脚本：`yarn test:e2e`，下图分别是测试用例正常与异常的示例：

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d0804420a6cf4137a1a295052d102a91~tplv-k3u1fbpfcp-watermark.image?)

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b265c3df26764b72b3dd0a835ffcf5ad~tplv-k3u1fbpfcp-watermark.image?)

## 写在最后

本章的示例代码在 [feat/microservices](https://github.com/boty-design/gateway/tree/feat/microservices)，后续会进行持续的迭代，有需要的同学自取。

大家对比一下可以我们的开发代码与测试代码即可发现，测试用例的代码量远超开发的代码，由于要涵盖的逻辑非常多，所以为了保证测试用例的质量会有大量的用例判断。

虽然测试用例能很好的保证代码的质量，但是会消耗非常多的时间来开发，这也是为什么我在开发项目最开始的时候跟大家提过，如果项目紧急的情况下，可以先把测试用例开发放在最后，测试用例覆盖最主要的核心功能即可。

由于网关系统代理的测试用例很特殊，需要针对域名做处理，所以本章的例子主要围绕着模拟请求体与修改 `Host` 来展现，其他简单的 `CURD` 的测试用例大家可以尽可能的多写写，熟能生巧。

`Jest` 的功能还是非常强大的，还有非常多有趣以及有用的 `Api` 大家可以自行研究参考下，有问题的话欢迎在群里提出交流，

如果你有什么疑问，欢迎在评论区提出或者加群沟通。 👏

---

# 第18章—进阶篇：应用部署

## 前言

按照目前的进度，相信很多同学已经完成基础篇的内容，也有部分同学完成了用户或者物料系统的开发，所以应广大同学的要求，将应用部署这章提前写出来，方便大家完成项目开发流程中关键的最后一步。

与开发环境不同，在生产环境中服务端的项目都需要后台启动，如果是前端启动的话，当你关闭 `ssh` 连接或者控制台的时候，程序也就自动退出了，这显然不是我们希望的结果。

本章将介绍 `NestJS` 两种方式的发布类型： `PM2` 与 `Docker Compose` 部署。

## PM2

[PM2](https://pm2.keymetrics.io/docs/usage/quick-start/) 是一款使用于生产环境的 `NodeJS` 的进程管理工具，操作非常简便，内置了进程管理、监控、日志以及负载均衡的能力。

首先需要安装 `PM2` 的依赖，一般会安装在全局依赖：

```shell
$ yarn global add pm2
```

普通的前端项目启动的话，直接使用以下命令就行了：

```shell
pm2 start app.js
```

但毕竟是这一个实战的项目而且也有不同的环境变量存在，直接这么启动并不合适，可以借助 `Ecosystem File` 来完成我们的需求。

1. 项目根目录新建 `ecosystem.config.js`：

```js
module.exports = {
  apps: [
    {
      name: "gateway",
      script: "dist/src/main.js",
      env_production: {
        RUNNING_ENV: "prod",
      },
      env_development: {
        RUNNING_ENV: "dev",
      },
    },
  ],
};
```

2. 添加 `package.json` 中的 `scripts` 构建命令：

```diff
+ "build": "nest build",
+ "build:webpack": "nest build --webpack",
```

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f9413666d6ab417bb3a04f8387bab393~tplv-k3u1fbpfcp-watermark.image?)

对比一下两种构建命令的不同点：

- `nest build`：将 `NestJS` 项目的源码从 `TS` 编译成 `JS` 之后再使用 `node main.js` 来运行项目，这样有个好处是还能看到大概的工程路径，也可以使用 `TypeOrm` 动态注册实体类的功能。
- `nest build --webpack` 会将 `NestJS` 项目打包成一个独立的 `main.js`，从文件类型的角度来说，做了一次混淆跟合并，原理跟之前提到过的热更新启动是一样的，按照这种模式的话来使用的话，**就不能使用动态注册实体类的功能，只能手动引入实体类**。

两种构建产物的方式都可以完成要求，按照自己的喜好选择就行，但无论是 `webpack` 打包成单文件的模式还是使用 `TSC` 模式生成 `JS` 项目代码，都需要在发布工程里面添加 `node_modules`，否则是没办法正常启动。

因为这两种模式并没有将依赖直接打包进产物内，虽然可以曲线修改 `webpack.config` 可以使得在 `webpack` 模式下，能将所有的依赖都打入单文件，但是由于环境依赖的问题，这种模式的产物大概率只能在相同的环境运行依赖，例如 `windows` 下打包的产物是无法部署在 `linux` 环境下。

3. 在 `package.json` 的 `scripts` 中添加启动脚本：

```diff
+ "start:prod": "nest build && pm2 start ecosystem.config.js --env production"
```

添加完毕之后，执行 `yarn start:prod` 出现如下界面既完成了项目生产环境的部署，如果不能正常访问接口的话，可以使用 `pm2 log gateway` 查看启动日志，如果按照我给的方案走一般不会出现问题，有问题的话，大概率是配置文件找不到，调整配置文件即可。

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9e6ebe6ebbc04661893303c0aa76ba47~tplv-k3u1fbpfcp-watermark.image?)

> **切记，如果使用 webpack 模式部署生产环境，一定要手动注册实体类！！！！不然会报错的！！！！**

更多的 `PM2` 的 `API` 使用与黑科技，用兴趣的同学可以自己进行摸索，这里就不过多介绍了。

## Docker Compose

`Docker Compose` 项目是 `Docker` 官方的开源项目，负责实现对 `Docker` 容器集群的快速编排日常开发工作中，经常会碰到需要多个容器相互配合来完成某项任务的情况。

比如我们的网关服务体系就由 **3** 个不同的服务组成，其中还不包括 `Redis`、`Mysql` 这种中间件的服务，所以每个服务都使用直接 `Docker` 来部署的话，效率低下而且维护麻烦，而借助 `Docker Compose` 可以将我们的服务统一一次性部署完成。

**第一步**：要把项目工程打包成 `image`，根路径创建文件 `Dockerfile`:

```
FROM node:16-alpine3.15

RUN mkdir -p /home/app/

WORKDIR /home/app/

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

ENTRYPOINT ["npm", "run"]

CMD ["start"]
```

**第二步**：根目录运行以下脚本来就行构建：

```shell
$ docker build -f ./Dockerfile -t gateway:0.0.1 .
```

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1c719d5ac1ad49b58bdc554c7e672868~tplv-k3u1fbpfcp-watermark.image?)

**第三步**：运行以下命令既可以启动容器运行：

```shell
docker run -d -e RUNNING_ENV=prod -p 3000:3000 gateway:0.0.1
```

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/18c0205306a64373a6361e6ee15438eb~tplv-k3u1fbpfcp-watermark.image?)

使用 `docker logs [容器id] `既可以看到我们的项目已经正常启动了：

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c22bfa0ebc0b47ca95ede19bfd303fd0~tplv-k3u1fbpfcp-watermark.image?)

以上是直接使用 `Docker` 来部署项目，换成 `Docker Compose` 的话，则需要额外新建文件 `docker-compose.gateway-service-dev.yml`：

```
version: "3"
services:
  gateway-service-dev:
    container_name: gateway-service-dev
    build:
      context: ./
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      RUNNING_ENV: 'dev'
    networks:
      - servicebus
networks:
  servicebus:
    name: servicebus
```

启动命令为：

```shell
docker-compose -f docker-compose.gateway-service-dev.yml up -d  --build
```

其中 `build` 参数代表构建过程，所以我们在使用 docker-compose 构建的时候可以省去第二步构建镜像的步骤，配合 `docker file` 中的前置安装依赖步骤，可以在每次更新代码后需要重新构建时，项目依赖不更新的情况下，使用缓存构建，大幅度减少构建时间。

## 写在最后

部署篇的章节为了方便大家快速使用，目前较为简单，等待所有的项目都完成之后，会在 `docker compose` 部分扩充内容，给大家展示容器编排的优势。

另外如果有机会或者想尝试 `K8S` 部署的话，可以参考 `Devops` 的小册，里面有 `Rancher` 章节是关于集群部署的

如果你有什么疑问，欢迎在评论区提出或者加群沟通。 👏

---

# 第19章—完结篇：课程总结

## 学习里程碑 | 🏆 - 完结篇

如果你看到了这章，恭喜你已经走到了这段旅途的终点，一路走来想必非常不容易吧。

有些同学是第一次接触 `NestJs`，对 `IoC` 的开发模式不能很好的理解，各种模块的注入开发很不习惯，也有些同学是第一次接触服务端开发，可能在飞书那个章节又被【劝退】了吧。

很正常，我也理解，因为我也是这么过来的，学习本身就并不是一件容易的事情，知识的获取如果能这么容易的话，这个世界就非常和平了。

## 小册总结

这次小册的内容可能与大部分的小册都不太一样，从小册的内容与学习模式上都略有不同。

大家在阅读的时候会发现，在学习篇的时候，每一个步骤、每一个阶段的内容都非常详细，尽最大可能的保证从文章中就能直接写出可用的代码，并且在写小册的过程中也在不断收集大家的问题，中间还对学习篇的所有章节进行了一次调整。因为这个时候大家是在打基础，而且开发的都是公共模块与脚手架搭建，所以这一块的详细是为了让大家轻松上手，后期能够快速开发项目。

但是学习篇之后的项目实战风格就急速转变，以概念与最小单元模块实现为主，单只看小册的示例代码已经无法将功能完全写出来了。

原因之前也有提到过，我并不想教大家写出来的都是一摸一样的代码，先入为主的思维是可怕的，除非不到万不得已，最好学习路径就是跟着架构设计然后自己实现一遍，这样不仅印象深刻，也会在开发过程中夹杂自己的思考，为什么要这么做？能不能做的更好？

小册并不是买了就会，也不是看完就会，之所以挑了这三个实战的项目，是因为它们可能是能够真实给你团队带来拓展技术与业务的项目，至少其中的物料项目对于前端来说是必然有一定的价值的。

人都是有惰性的，**只有你工作中不断地能使用起来，并且它能够给你带来直接的价值，你才有机会、有动力去更深入的去学习、去了解它。**

## 学习成果

通过全篇的学习，你大概能够掌握以下这些技能：

1. 对服务端开发非常熟悉，同时对掌握 `IoC` 开发模式，可能原理还不太清楚，但全篇走完后熟练开发是不在话下的；
2. 掌握处理三方对接的能力，包括排查错误、阅读文档等；
3. 学会安装各种中间件，例如 `Mysql`、`Redis` 等等；
4. 解决版本依赖错误，毕竟在这边小册书写的过程中，`NestJS` 做了一个版本升级，不少同学卡在了依赖错误上；
5. 熟悉用户、物料、网关的系统架构设计。

如果你没有很好的掌握以上的技能的话，那么大概率你有可能参考示例太多了，自己手写的代码太少了，收获也就自然少了。

## 写在最后

历时五周，整体的流程大纲已经完成的差不多了，小册暂时也告一段落了，至于为什么会这么快就完结，可能也是对上本小册作为史上最长连载的补偿吧。

非常感谢各位同学的支持，以及掘金小编给予的协助。但接下来的旅途并未结束，小册里面的实战项目仍然会继续更新，包括各位提的意见以及后续随着实战项目的更新，依然会对小册的内容做一些调整与升级。

同时小册的三个实战项目都将与九月计划好的 `Devops` 小册重构的项目进行联动，大家还是可以对这个实战项目有一些些期待，届时也可以对项目的功能、不足都提些意见，能够让它更加的完善。

按照目前主流的观点，程序员的旅途我快走到头了，在可能要结束的旅途中，我还是想留一下一些曾经我也在这个道路的影子。
