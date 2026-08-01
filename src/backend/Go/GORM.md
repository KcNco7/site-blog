# 现代 GORM 学习指南：官方推荐写法优先

> 面向人群：已经掌握 Go、HTTP、SQL 和常见后端分层，希望快速学会现代 GORM。  
> 适用版本：GORM `v1.31.1`，示例以当前稳定版泛型 API 为主。

## 先说结论

截至本文核对日期，GORM 最新稳定标签为 `v1.31.1`。虽然它通常被称作 GORM v2，但 Go module 标签仍然是 `v1.x`；不要误用旧版的 `github.com/jinzhu/gorm` 和 `v1.gorm.io` 文档。

官方目前明确建议：

1. 新项目和重构代码优先使用 `gorm.G[T](db)` 泛型 API。
2. 每次数据库操作都传入 `context.Context`。
3. 查询值使用 `?` 占位符，不拼接用户输入。
4. 多步写操作使用 `db.Transaction` 闭包。
5. 更新时明确字段，理解 Go 零值处理。
6. 查询单条记录使用 `First`/`Take`，不要对单个 struct 直接使用无限制 `Find`。
7. 关联数据需要时显式 `Preload`，避免 N+1 查询。
8. 新泛型 API 故意移除了容易产生歧义的 `Save` 和 `FirstOrCreate`。

本文中的“官方行为”来自 GORM 官网；目录结构、生产迁移和测试策略属于在这些行为之上的工程建议，会特别标明。

> 版本提醒：部分官网教程片段仍把泛型 `Update`/`Delete` 写成只返回 `error`。当前稳定标签 `v1.31.1` 的正式接口中，`Update`、`Updates`、`Delete` 都返回 `(rowsAffected int, err error)`。本文以 `v1.31.1` 的官方标签源码和 API 为准。

## 目录

1. [GORM 的正确心智模型](#一gorm-的正确心智模型)
2. [安装与数据库连接](#二安装与数据库连接)
3. [模型与数据库约束](#三模型与数据库约束)
4. [泛型 API CRUD](#四泛型-api-crud)
5. [最容易出错的更新操作](#五最容易出错的更新操作)
6. [错误处理](#六错误处理)
7. [关联与 Preload](#七关联与-preload)
8. [事务](#八事务)
9. [迁移策略](#九迁移策略)
10. [Repository 与 Service 分层](#十repository-与-service-分层)
11. [Context、超时与并发](#十一context超时与并发)
12. [安全、日志与性能](#十二安全日志与性能)
13. [测试策略](#十三测试策略)
14. [GORM CLI 与代码生成](#十四gorm-cli-与代码生成)
15. [两小时学习路线](#十五两小时学习路线)
16. [最终速查表](#十六最终速查表)

---

## 一、GORM 的正确心智模型

### 1. `*gorm.DB` 不是 Java 的单个 Session

```go
db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
```

`db` 是长期复用的数据库句柄，底层连接池由 Go 的 `database/sql` 管理。通常在应用启动时创建一次，并注入 Repository；不要每个请求都重新 `gorm.Open`。

```text
HTTP Handler
    ↓ context
Service
    ↓
Repository
    ↓
*gorm.DB（长期复用）
    ↓
database/sql 连接池
    ↓
PostgreSQL / MySQL
```

事务中的 `tx *gorm.DB` 是例外：事务开始后，事务内所有操作必须使用 `tx`，不能误用外层 `db`。

### 2. 泛型 API 的作用

```go
user, err := gorm.G[User](db).
    Where("id = ?", id).
    First(ctx)
```

- `User` 决定查询模型和返回类型。
- `db` 提供连接、配置和插件。
- `Where` 构建 SQL 条件。
- `First(ctx)` 执行 SQL，并直接返回 `(User, error)`。

它比传统写法更符合普通 Go 错误处理：

```go
// 泛型 API：新代码优先
user, err := gorm.G[User](db).Where("id = ?", id).First(ctx)

// 传统 API：旧项目中仍然常见
var user User
err := db.WithContext(ctx).Where("id = ?", id).First(&user).Error
```

两套 API 可以在同一个项目中共存。连接配置、连接池、迁移和事务入口仍然会直接使用 `*gorm.DB`。

### 3. GORM 不替代 SQL

学习 GORM 时必须能够预测大致 SQL：

```go
users, err := gorm.G[User](db).
    Where("active = ?", true).
    Order("id DESC").
    Limit(20).
    Find(ctx)
```

大致对应：

```sql
SELECT *
FROM users
WHERE active = true
ORDER BY id DESC
LIMIT 20;
```

如果不能解释生成的 SQL、索引使用和事务边界，就还没有真正掌握 ORM。

---

## 二、安装与数据库连接

### 1. 创建学习项目

本文推荐先使用 PostgreSQL；换成 MySQL 时只需替换驱动和 DSN。

```powershell
mkdir gorm-learning
cd gorm-learning
go mod init example.com/gorm-learning
go get gorm.io/gorm@v1.31.1
go get gorm.io/driver/postgres
```

如果只是快速做本地实验，可以使用 SQLite：

```powershell
go get gorm.io/driver/sqlite
```

### 2. 最小连接

```go
package database

import (
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
)

func Open(dsn string) (*gorm.DB, error) {
    return gorm.Open(postgres.Open(dsn), &gorm.Config{
        TranslateError: true,
    })
}
```

`TranslateError: true` 会把部分数据库方言错误转换为 GORM 的统一错误，例如：

- `gorm.ErrDuplicatedKey`
- `gorm.ErrForeignKeyViolated`

### 3. 更适合服务端项目的连接初始化

```go
package database

import (
    "context"
    "fmt"
    "log"
    "os"
    "time"

    "gorm.io/driver/postgres"
    "gorm.io/gorm"
    "gorm.io/gorm/logger"
)

func OpenPostgres(ctx context.Context, dsn string) (*gorm.DB, error) {
    gormLogger := logger.New(
        log.New(os.Stdout, "", log.LstdFlags),
        logger.Config{
            SlowThreshold:             500 * time.Millisecond,
            LogLevel:                  logger.Warn,
            IgnoreRecordNotFoundError: true,
            ParameterizedQueries:      true,
            Colorful:                  false,
        },
    )

    db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
        TranslateError: true,
        Logger:         gormLogger,
    })
    if err != nil {
        return nil, fmt.Errorf("open postgres: %w", err)
    }

    sqlDB, err := db.DB()
    if err != nil {
        return nil, fmt.Errorf("get sql db: %w", err)
    }

    // 以下数值只是学习示例，生产环境应根据数据库容量和流量调整。
    sqlDB.SetMaxOpenConns(30)
    sqlDB.SetMaxIdleConns(10)
    sqlDB.SetConnMaxLifetime(30 * time.Minute)
    sqlDB.SetConnMaxIdleTime(5 * time.Minute)

    if err := sqlDB.PingContext(ctx); err != nil {
        _ = sqlDB.Close()
        return nil, fmt.Errorf("ping postgres: %w", err)
    }

    return db, nil
}
```

应用退出时关闭底层连接池：

```go
sqlDB, err := db.DB()
if err != nil {
    return err
}
defer sqlDB.Close()
```

### 4. DSN 不要写死

```go
dsn := os.Getenv("DATABASE_URL")
if dsn == "" {
    log.Fatal("DATABASE_URL is required")
}
```

生产密码不要写进源码、Git 或 SQL 日志。

---

## 三、模型与数据库约束

### 1. 推荐先显式声明字段

`gorm.Model` 很方便，但它自动带软删除。为了在学习阶段看清楚实际字段，可以先显式声明：

```go
package user

import "time"

type User struct {
    ID        uint      `gorm:"primaryKey"`
    Email     string    `gorm:"size:320;not null;uniqueIndex"`
    Name      string    `gorm:"size:100;not null"`
    Active    bool      `gorm:"not null"`
    CreatedAt time.Time
    UpdatedAt time.Time
    Orders    []Order   `gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
}

type Order struct {
    ID          uint      `gorm:"primaryKey"`
    UserID      uint      `gorm:"not null;index"`
    AmountCents int64     `gorm:"not null;check:amount_cents >= 0"`
    Status      string    `gorm:"size:32;not null;index"`
    CreatedAt   time.Time
    UpdatedAt   time.Time
}
```

GORM 默认约定：

- `ID` 是主键。
- `User` 对应表名 `users`。
- `CreatedAt`、`UpdatedAt` 自动维护。
- Go 字段名转换为 `snake_case` 列名。
- 只有导出字段会被映射。

### 2. `gorm.Model` 包含什么

```go
type Model struct {
    ID        uint
    CreatedAt time.Time
    UpdatedAt time.Time
    DeletedAt gorm.DeletedAt `gorm:"index"`
}
```

使用：

```go
type Product struct {
    gorm.Model
    Name  string
    Price int64
}
```

只在你确实需要这些字段，尤其是软删除时嵌入它。不是所有表都必须软删除。

### 3. `NULL` 与 Go 零值

```go
type User struct {
    Nickname  *string
    Birthday  *time.Time
    DeletedAt gorm.DeletedAt
}
```

- `string` 无法区分数据库 `NULL` 和空字符串。
- `*string` 可以区分 `nil`、`""` 和非空字符串。
- 也可以使用 `sql.NullString`、`sql.NullTime`。

是否允许 `NULL` 是业务语义，不要为了省事把所有字段都改成指针。

### 4. Model 不等于 API DTO

不要直接把 GORM Model 当作所有 API 的请求和响应：

```go
type CreateUserInput struct {
    Email string `json:"email"`
    Name  string `json:"name"`
}

type UserResponse struct {
    ID    uint   `json:"id"`
    Email string `json:"email"`
    Name  string `json:"name"`
}
```

这样可以避免客户端修改 `ID`、`CreatedAt`、权限字段或内部关联。

### 5. 约束和索引属于数据模型的一部分

```go
type Membership struct {
    ID       uint
    TenantID uint `gorm:"not null;uniqueIndex:uk_tenant_user"`
    UserID   uint `gorm:"not null;uniqueIndex:uk_tenant_user"`
    Role     string `gorm:"size:32;not null;index"`
}
```

注意：

- `uniqueIndex` 是唯一索引。
- 相同索引名表示联合索引。
- 联合索引字段顺序会影响查询性能。
- 数据库约束是最终一致性防线，不能只依靠应用校验。

---

## 四、泛型 API CRUD

下面的代码都假设已经存在：

```go
var db *gorm.DB
var ctx context.Context
```

### 1. Create

```go
user := User{
    Email:  "alice@example.com",
    Name:   "Alice",
    Active: true,
}

if err := gorm.G[User](db).Create(ctx, &user); err != nil {
    return fmt.Errorf("create user: %w", err)
}

fmt.Println(user.ID)
```

`Create` 必须接收指针，因为 GORM 需要回填主键等字段。

批量创建：

```go
users := []User{
    {Email: "a@example.com", Name: "A", Active: true},
    {Email: "b@example.com", Name: "B", Active: true},
}

if err := gorm.G[User](db).CreateInBatches(ctx, &users, 100); err != nil {
    return fmt.Errorf("create users in batches: %w", err)
}
```

需要影响行数时：

```go
result := gorm.WithResult()
err := gorm.G[User](db, result).Create(ctx, &user)
if err != nil {
    return err
}

fmt.Println(result.RowsAffected)
```

### 2. 查询单条

```go
user, err := gorm.G[User](db).
    Where("id = ?", id).
    First(ctx)
```

`First`：按主键升序取第一条；没有结果时返回 `gorm.ErrRecordNotFound`。

```go
user, err := gorm.G[User](db).
    Where("email = ?", email).
    Take(ctx)
```

`Take`：没有隐含排序，适合条件本身唯一的查询。

泛型 `Find` 固定返回切片。不要为了查询单条而调用 `Find` 后自行取第一个元素：

```go
// 不推荐：语义是查列表，且忘记条件时可能读取整张表。
users, err := gorm.G[User](db).Find(ctx)
user := users[0]
```

传统 API 中也不要写 `db.Find(&user)` 查询单个 struct；官网指出它可能查询整表，并只留下一个不确定结果。

### 3. 查询列表

```go
users, err := gorm.G[User](db).
    Where("active = ?", true).
    Order("id DESC").
    Limit(20).
    Offset(0).
    Find(ctx)
if err != nil {
    return nil, fmt.Errorf("list users: %w", err)
}
```

常见条件：

```go
gorm.G[User](db).Where("email = ?", email)
gorm.G[User](db).Where("id IN ?", ids)
gorm.G[User](db).Where("created_at >= ?", start)
gorm.G[User](db).Where("name LIKE ?", "%"+keyword+"%")
gorm.G[User](db).Where("active = ? AND id > ?", true, cursor)
```

### 4. 只查询必要字段

```go
type UserSummary struct {
    ID   uint
    Name string
}

summaries, err := gorm.G[UserSummary](db).
    Table("users").
    Select("id", "name").
    Order("id DESC").
    Limit(20).
    Find(ctx)
```

大表不要习惯性 `SELECT *`。API 列表通常只需要少数字段。

### 5. Delete

```go
rows, err := gorm.G[User](db).
    Where("id = ?", id).
    Delete(ctx)
```

GORM 默认会阻止没有条件的全表删除：

```go
_, err := gorm.G[User](db).Delete(ctx)
// gorm.ErrMissingWhereClause
```

不要为了绕过保护而随意启用 `AllowGlobalUpdate`。

如果模型包含 `gorm.DeletedAt`，`Delete` 默认执行软删除；普通查询会自动排除已删除记录。

### 6. Upsert

```go
import "gorm.io/gorm/clause"

err := gorm.G[User](
    db,
    clause.OnConflict{
        Columns:   []clause.Column{{Name: "email"}},
        DoUpdates: clause.AssignmentColumns([]string{"name", "updated_at"}),
    },
).Create(ctx, &user)
```

Upsert 必须先确定冲突键和允许更新的字段，不要默认覆盖所有列。

---

## 五、最容易出错的更新操作

### 1. 更新单字段

```go
rows, err := gorm.G[User](db).
    Where("id = ?", id).
    Update(ctx, "active", false)
```

### 2. struct 更新会忽略零值

```go
rows, err := gorm.G[User](db).
    Where("id = ?", id).
    Updates(ctx, User{
        Name:   "Alice",
        Active: false,
    })
```

默认情况下，struct 更新只更新非零字段，所以 `false`、`0`、`""` 可能被忽略。

需要更新零值时，优先使用 `Select` 明确字段：

```go
rows, err := gorm.G[User](db).
    Where("id = ?", id).
    Select("Name", "Active").
    Updates(ctx, User{
        Name:   "",
        Active: false,
    })
```

确实需要动态 map 时，可以使用传统 API 并明确 `Model`：

```go
result := db.WithContext(ctx).
    Model(&User{}).
    Where("id = ?", id).
    Updates(map[string]any{
        "name":   "Alice",
        "active": false,
    })

rows, err := result.RowsAffected, result.Error
```

泛型 `Updates(ctx, value)` 的参数类型必须与 `gorm.G[T]` 的 `T` 一致；不能把 `map[string]any` 直接传给 `gorm.G[User](db).Updates(...)`。

### 3. 新代码不要寻找 `Save`

泛型 API 故意没有 `Save`，因为它具有“更新失败后可能创建”的歧义和并发风险。

明确表达意图：

```go
// 创建
err := gorm.G[User](db).Create(ctx, &user)

// 更新明确字段
rows, err := gorm.G[User](db).
    Where("id = ?", user.ID).
    Select("Name", "Active").
    Updates(ctx, User{
        Name:   user.Name,
        Active: user.Active,
    })
```

### 4. 必须检查受影响行数的场景

```go
rows, err := gorm.G[User](db).
    Where("id = ?", id).
    Update(ctx, "name", name)
if err != nil {
    return err
}
if rows == 0 {
    return ErrUserNotFound
}
```

仅仅 `err == nil` 不代表一定更新到了记录。

### 5. 并发扣减使用原子 SQL

不要先查库存，再在 Go 中计算并更新：

```go
// 容易产生并发丢失更新
product, _ := gorm.G[Product](db).Where("id = ?", id).First(ctx)
product.Stock--
```

使用带条件的原子更新：

```go
result := db.WithContext(ctx).
    Model(&Product{}).
    Where("id = ? AND stock > 0", id).
    UpdateColumn("stock", gorm.Expr("stock - ?", 1))
if result.Error != nil {
    return result.Error
}
if result.RowsAffected == 0 {
    return ErrOutOfStock
}
```

这是少数使用传统 API 更直观的场景。核心不是 API 风格，而是让检查条件和更新发生在同一条 SQL 中。

---

## 六、错误处理

### 1. `ErrRecordNotFound`

```go
user, err := gorm.G[User](db).
    Where("id = ?", id).
    First(ctx)

switch {
case errors.Is(err, gorm.ErrRecordNotFound):
    return User{}, ErrUserNotFound
case err != nil:
    return User{}, fmt.Errorf("find user %d: %w", id, err)
default:
    return user, nil
}
```

使用 `errors.Is`，不要比较错误字符串。

### 2. 约束错误

初始化时启用：

```go
&gorm.Config{TranslateError: true}
```

处理统一错误：

```go
if errors.Is(err, gorm.ErrDuplicatedKey) {
    return ErrEmailAlreadyExists
}

if errors.Is(err, gorm.ErrForeignKeyViolated) {
    return ErrInvalidUserID
}
```

### 3. 给错误增加上下文

```go
if err != nil {
    return fmt.Errorf("create order for user %d: %w", userID, err)
}
```

Repository 返回数据库语义；Service 将其转换为业务错误；HTTP 层再映射成状态码。

```text
gorm.ErrRecordNotFound
        ↓ Repository
ErrUserNotFound
        ↓ Handler
HTTP 404
```

不要在 Repository 里直接返回 HTTP 状态码。

---

## 七、关联与 Preload

### 1. 一对多模型

```go
type User struct {
    ID     uint
    Name   string
    Orders []Order
}

type Order struct {
    ID     uint
    UserID uint `gorm:"not null;index"`
    Amount int64
}
```

### 2. 显式预加载

```go
user, err := gorm.G[User](db).
    Preload("Orders", nil).
    Where("id = ?", id).
    First(ctx)
```

`Preload` 通常会分别查询主表和关联表：

```sql
SELECT * FROM users WHERE id = ?;
SELECT * FROM orders WHERE user_id IN (?);
```

带条件和排序：

```go
user, err := gorm.G[User](db).
    Preload("Orders", func(q gorm.PreloadBuilder) error {
        q.Where("status = ?", "paid").Order("id DESC")
        return nil
    }).
    Where("id = ?", id).
    First(ctx)
```

### 3. 避免 N+1

不推荐：

```go
users, _ := gorm.G[User](db).Find(ctx)
for _, user := range users {
    orders, _ := gorm.G[Order](db).
        Where("user_id = ?", user.ID).
        Find(ctx)
    _ = orders
}
```

推荐：

```go
users, err := gorm.G[User](db).
    Preload("Orders", nil).
    Find(ctx)
```

### 4. `Preload` 与 Join

- `Preload`：额外查询，适合一对多和大多数关联读取。
- Join Preload：单条 Join 查询，官方说明主要适用于一对一关系，例如 `has one`、`belongs to`。
- 复杂报表：直接写明确的 Join 或 Raw SQL，映射到专门的结果 struct。

不要默认把所有关联全部 Preload。API 需要什么就加载什么。

### 5. 创建关联的隐式行为

创建模型时，如果关联字段不是零值，GORM 可以自动保存关联。业务代码中建议显式控制要保存的关联，避免一次 `Create` 意外写入过多表：

```go
err := gorm.G[User](db).
    Omit("Orders").
    Create(ctx, &user)
```

复杂业务通常更适合在事务中分别创建主记录和关联记录。

---

## 八、事务

### 1. 官方推荐的闭包写法

```go
func CreateOrder(
    ctx context.Context,
    db *gorm.DB,
    order *Order,
) error {
    return db.Transaction(func(tx *gorm.DB) error {
        rows, err := gorm.G[Product](tx).
            Where("id = ? AND stock > 0", order.ProductID).
            Update(ctx, "stock", gorm.Expr("stock - ?", 1))
        if err != nil {
            return fmt.Errorf("decrease stock: %w", err)
        }
        if rows == 0 {
            return ErrOutOfStock
        }

        if err := gorm.G[Order](tx).Create(ctx, order); err != nil {
            return fmt.Errorf("create order: %w", err)
        }

        return nil
    })
}
```

在 `v1.31.1` 中，泛型 `Update`、`Updates` 和 `Delete` 都直接返回 `(rowsAffected, error)`，所以可以同时检查执行错误和是否真正命中记录。

更直接的库存写法：

```go
func CreateOrder(ctx context.Context, db *gorm.DB, order *Order) error {
    return db.Transaction(func(tx *gorm.DB) error {
        result := tx.WithContext(ctx).
            Model(&Product{}).
            Where("id = ? AND stock > 0", order.ProductID).
            UpdateColumn("stock", gorm.Expr("stock - ?", 1))
        if result.Error != nil {
            return fmt.Errorf("decrease stock: %w", result.Error)
        }
        if result.RowsAffected == 0 {
            return ErrOutOfStock
        }

        if err := gorm.G[Order](tx).Create(ctx, order); err != nil {
            return fmt.Errorf("create order: %w", err)
        }

        return nil
    })
}
```

规则：

- 返回 `nil`：提交。
- 返回任意错误：回滚。
- 事务内始终使用 `tx`。
- 事务要短，不在事务里调用慢速外部 HTTP 服务。

### 2. 写操作默认事务

GORM 默认让 create/update/delete 在事务中执行，以保证一致性。官方文档说明禁用默认事务可以提升写性能，但这是用一致性保障换性能。

```go
gorm.Open(postgres.Open(dsn), &gorm.Config{
    SkipDefaultTransaction: true,
})
```

工程建议：先保留默认设置。只有在压测证明它是瓶颈，并且业务能够承担风险时再考虑关闭。

### 3. 手动事务

GORM 支持 `Begin`、`Commit`、`Rollback`，也支持嵌套事务、SavePoint 和 RollbackTo。但大多数业务优先使用 `db.Transaction`，因为错误路径更不容易漏掉回滚。

---

## 九、迁移策略

### 1. `AutoMigrate` 的实际行为

```go
if err := db.AutoMigrate(
    &User{},
    &Order{},
); err != nil {
    return fmt.Errorf("auto migrate: %w", err)
}
```

官网说明：`AutoMigrate` 会创建缺失的表、外键、约束、列和索引，也可能调整部分列类型；为了保护数据，它不会删除已经不用的列。

### 2. 工程建议

- 本地学习、原型、测试：可以使用 `AutoMigrate`。
- 正式生产：优先使用带版本、可审查、可回滚的迁移文件。
- 不要在每个 HTTP 实例启动时无条件执行复杂迁移。
- 生产迁移前检查生成 SQL、锁表风险和回滚方案。

`AutoMigrate` 不是完整的生产迁移历史系统，它也不会自动理解“字段重命名”是重命名而不是新增字段。

### 3. 外键约束

GORM 在迁移时默认会为关联创建外键约束。可以全局关闭，但不要只为省事关闭数据库完整性：

```go
gorm.Open(postgres.Open(dsn), &gorm.Config{
    DisableForeignKeyConstraintWhenMigrating: true,
})
```

是否关闭应由数据库架构策略决定，而不是用于掩盖错误模型。

---

## 十、Repository 与 Service 分层

这是工程建议，不是 GORM 强制结构。

### 1. 推荐目录

```text
gorm-learning/
├── cmd/api/main.go
├── internal/database/postgres.go
├── internal/user/model.go
├── internal/user/repository.go
├── internal/user/service.go
├── internal/user/handler.go
├── migrations/
└── go.mod
```

### 2. Repository

```go
package user

type Repository struct {
    db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
    return &Repository{db: db}
}

func (r *Repository) Create(ctx context.Context, user *User) error {
    if err := gorm.G[User](r.db).Create(ctx, user); err != nil {
        return fmt.Errorf("create user: %w", err)
    }
    return nil
}

func (r *Repository) FindByID(ctx context.Context, id uint) (User, error) {
    user, err := gorm.G[User](r.db).
        Where("id = ?", id).
        First(ctx)
    if errors.Is(err, gorm.ErrRecordNotFound) {
        return User{}, ErrNotFound
    }
    if err != nil {
        return User{}, fmt.Errorf("find user by id: %w", err)
    }
    return user, nil
}

func (r *Repository) SetActive(
    ctx context.Context,
    id uint,
    active bool,
) error {
    rows, err := gorm.G[User](r.db).
        Where("id = ?", id).
        Update(ctx, "active", active)
    if err != nil {
        return fmt.Errorf("set user active: %w", err)
    }
    if rows == 0 {
        return ErrNotFound
    }
    return nil
}
```

### 3. Service

```go
type Service struct {
    repo *Repository
}

func (s *Service) Register(
    ctx context.Context,
    input CreateUserInput,
) (User, error) {
    email := strings.TrimSpace(strings.ToLower(input.Email))
    if email == "" {
        return User{}, ErrInvalidEmail
    }

    user := User{
        Email:  email,
        Name:   strings.TrimSpace(input.Name),
        Active: true,
    }

    if err := s.repo.Create(ctx, &user); err != nil {
        return User{}, err
    }
    return user, nil
}
```

- Repository 负责 SQL/GORM 细节。
- Service 负责业务规则和事务用例。
- Handler 负责协议解析和 HTTP 状态码。

不要一开始设计“能操作所有 Model 的万能泛型 Repository”。它通常会隐藏每个聚合真正需要的查询和事务语义。

---

## 十一、Context、超时与并发

### 1. Repository 方法始终接收 Context

```go
func (r *Repository) FindByID(
    ctx context.Context,
    id uint,
) (User, error) {
    return gorm.G[User](r.db).
        Where("id = ?", id).
        First(ctx)
}
```

HTTP Handler 传递请求 Context：

```go
user, err := service.FindByID(r.Context(), id)
```

不要在 Repository 内部无条件创建 `context.Background()`，否则客户端断开、请求取消和截止时间无法向下传播。

### 2. 查询超时

```go
ctx, cancel := context.WithTimeout(parentCtx, 2*time.Second)
defer cancel()

users, err := gorm.G[User](db).Find(ctx)
```

泛型 API 将 Context 直接传给最终执行方法；传统 API 使用：

```go
db.WithContext(ctx).Find(&users)
```

### 3. 并发原则

- 根 `*gorm.DB` 可以长期共享。
- 不要把一个事务 `tx` 交给无关 goroutine 并长时间持有。
- 不要在事务中启动无法统一取消和回滚的后台任务。
- 乐观锁、悲观锁和原子更新是数据库并发控制问题，不是 Go mutex 能替代的。

---

## 十二、安全、日志与性能

### 1. SQL 注入

安全：

```go
gorm.G[User](db).Where("email = ?", userInput).First(ctx)
```

危险：

```go
gorm.G[User](db).
    Where(fmt.Sprintf("email = '%s'", userInput)).
    First(ctx)
```

用户输入只能作为参数，不得拼进 SQL。

### 2. 排序字段必须白名单

`Order`、`Select`、`Table` 等接收 SQL 标识符的位置不能把用户输入直接传入：

```go
allowedSorts := map[string]string{
    "created_at": "created_at DESC",
    "name":       "name ASC",
}

orderBy, ok := allowedSorts[input.Sort]
if !ok {
    orderBy = "id DESC"
}

users, err := gorm.G[User](db).
    Order(orderBy).
    Find(ctx)
```

### 3. 日志

官网 Logger 支持：

- 慢 SQL 阈值。
- `Silent`、`Error`、`Warn`、`Info` 级别。
- Context，用于 trace/request ID。
- `ParameterizedQueries`，避免在日志里输出参数。

调试单条操作可以使用传统 API 的 `Debug()`，但不要让生产环境长期打印所有 SQL 和敏感参数。

### 4. 性能优化顺序

1. 先看真实慢 SQL 和执行计划。
2. 修正 N+1。
3. 添加正确索引。
4. 限制查询字段和结果数量。
5. 批量写入使用 `CreateInBatches`。
6. 调整连接池。
7. 再评估 PrepareStmt、默认事务、读写分离等配置。

官网明确指出 GORM 默认性能对多数应用已经足够。不要在没有指标时盲目开启所有“性能选项”。

### 5. 分页

小数据量可以：

```go
users, err := gorm.G[User](db).
    Order("id DESC").
    Limit(pageSize).
    Offset((page - 1) * pageSize).
    Find(ctx)
```

大数据量优先游标分页：

```go
users, err := gorm.G[User](db).
    Where("id < ?", cursor).
    Order("id DESC").
    Limit(pageSize).
    Find(ctx)
```

---

## 十三、测试策略

### 1. Repository 测试测试什么

- struct tag 是否映射成预期 schema。
- 零值是否正确更新。
- 唯一键和外键错误是否正确转换。
- 事务是否真正回滚。
- Preload 是否加载正确关联。
- 软删除是否符合预期。

### 2. SQLite 的边界

SQLite 内存库适合快速学习和普通 CRUD：

```go
db, err := gorm.Open(
    sqlite.Open("file::memory:?cache=shared"),
    &gorm.Config{TranslateError: true},
)
```

但 PostgreSQL/MySQL 的数据类型、锁、约束、SQL 方言和并发行为不同。关键 Repository 集成测试应使用与生产相同的数据库引擎。

### 3. 事务回滚测试

```go
func TestCreateOrderRollsBackWhenOrderInsertFails(t *testing.T) {
    // 1. 准备商品库存。
    // 2. 制造订单插入失败。
    // 3. 调用事务用例。
    // 4. 重新查询库存，确认没有被扣减。
}
```

不要只测试“函数返回了错误”，还要验证数据库最终状态。

---

## 十四、GORM CLI 与代码生成

GORM 当前提供新的官方 CLI，可从接口上的 SQL 注释和 Model 生成类型安全代码：

```powershell
go install gorm.io/cli/gorm@latest
```

生成：

```powershell
gorm gen -i ./internal -o ./internal/generated
```

选择建议：

- 初学阶段：先学 `gorm.G[T]`，掌握 CRUD、Context、事务和 SQL。
- 查询很多、Raw SQL 很复杂：再引入 GORM CLI 生成类型安全方法。
- 旧项目已经深度使用 `gorm.io/gen`：不必立即全部重写。
- 新项目需要轻量的字段 helper 和类型化 Raw SQL：优先评估新 CLI。

代码生成不能替代数据库设计、索引和事务知识。

---

## 十五、两小时学习路线

### 0～20 分钟：连接与 Model

完成：

- 创建 Go module。
- 连接 PostgreSQL 或 SQLite。
- 定义 `User`、`Order`。
- 执行一次 `AutoMigrate`。

### 20～50 分钟：泛型 CRUD

完成：

- `Create`
- `First` / `Take`
- `Where` + `Find`
- `Update` / `Updates`
- `Delete`

每次操作都打印或观察 SQL，并尝试解释它。

### 50～70 分钟：故意踩坑

必须亲自验证：

1. struct 更新 `false` 为什么没生效。
2. `First` 查不到时是什么错误。
3. 不带 Where 的 Delete 为什么被阻止。
4. 拼接 SQL 为什么危险。

### 70～90 分钟：关联

完成：

- 创建一个用户和两条订单。
- 使用 `Preload("Orders", nil)` 查询。
- 对比 N+1 写法产生的 SQL 数量。

### 90～110 分钟：事务

实现：

```text
创建订单
├── 原子扣库存
├── 插入订单
└── 任一步失败全部回滚
```

### 110～120 分钟：分层

把代码拆成：

```text
database → repository → service → main
```

做到这里，你已经能处理 GORM 日常开发的大约 80%。

第二阶段再学习：

- 锁和并发控制。
- Raw SQL 和复杂报表。
- Scopes。
- Hooks。
- 多数据库与读写分离。
- GORM CLI。

---

## 十六、最终速查表

```go
// 创建
err := gorm.G[User](db).Create(ctx, &user)

// 查单条
user, err := gorm.G[User](db).
    Where("id = ?", id).
    First(ctx)

// 判断不存在
if errors.Is(err, gorm.ErrRecordNotFound) {
    // ...
}

// 查列表
users, err := gorm.G[User](db).
    Where("active = ?", true).
    Order("id DESC").
    Limit(20).
    Find(ctx)

// 更新单字段
rows, err := gorm.G[User](db).
    Where("id = ?", id).
    Update(ctx, "active", false)

// 更新多字段，包括零值
rows, err = gorm.G[User](db).
    Where("id = ?", id).
    Select("Name", "Active").
    Updates(ctx, User{
        Name:   "",
        Active: false,
    })

// 删除
rows, err = gorm.G[User](db).
    Where("id = ?", id).
    Delete(ctx)

// 预加载关联
user, err = gorm.G[User](db).
    Preload("Orders", nil).
    Where("id = ?", id).
    First(ctx)

// 事务
err = db.Transaction(func(tx *gorm.DB) error {
    if err := gorm.G[User](tx).Create(ctx, &user); err != nil {
        return err
    }
    return nil
})

// 迁移
err = db.AutoMigrate(&User{}, &Order{})

// 底层连接池
sqlDB, err := db.DB()
sqlDB.SetMaxOpenConns(30)
sqlDB.SetMaxIdleConns(10)
```

## 必须牢记的 12 条规则

1. 新代码优先 `gorm.G[T]`。
2. 每个 Repository 方法接收 `context.Context`。
3. 根 `*gorm.DB` 长期复用，不要每个请求重新连接。
4. 单条查询使用 `First`/`Take`。
5. 值使用占位符，排序和字段名使用白名单。
6. struct 查询和更新默认忽略零值。
7. 更新 `false`、`0`、空字符串时使用 map 或 `Select`。
8. 所有错误都要检查，找不到记录使用 `errors.Is`。
9. 多步写操作使用 `db.Transaction`，事务内只用 `tx`。
10. 关联按需 `Preload`，警惕 N+1。
11. `AutoMigrate` 不会删除废弃列，生产迁移要可审查。
12. 优化前先看 SQL、执行计划和指标。

## 官方资料

- [GORM 官方文档](https://gorm.io/docs/)
- [官方：The Generics Way](https://gorm.io/docs/the_generics_way.html)
- [官方：Models](https://gorm.io/docs/models.html)
- [官方：Create](https://gorm.io/docs/create.html)
- [官方：Query](https://gorm.io/docs/query.html)
- [官方：Update](https://gorm.io/docs/update.html)
- [官方：Delete](https://gorm.io/docs/delete.html)
- [官方：Preload](https://gorm.io/docs/preload.html)
- [官方：Context](https://gorm.io/docs/context.html)
- [官方：Error Handling](https://gorm.io/docs/error_handling.html)
- [官方：Transactions](https://gorm.io/docs/transactions.html)
- [官方：Migration](https://gorm.io/docs/migration.html)
- [官方：Security](https://gorm.io/docs/security.html)
- [官方：Performance](https://gorm.io/docs/performance.html)
- [官方：GORM CLI](https://gorm.io/cli/index.html)
- [GORM GitHub 仓库与 Releases](https://github.com/go-gorm/gorm)
- [GORM v1.31.1 泛型 API 源码](https://github.com/go-gorm/gorm/blob/v1.31.1/generics.go)
