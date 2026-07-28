# 设置 Go 环境变量

## 环境变量设置

### 1. PowerShell（当前用户配置）

```powershell
# GOENV 不能通过 `go env -w GOENV=...` 设置，必须使用操作系统环境变量。
[Environment]::SetEnvironmentVariable("GOENV", "D:\Go\env", "User")
$env:GOENV = "D:\Go\env" # 同步到当前 PowerShell 会话

# 写入 GOENV 指向的 Go 环境配置文件
go env -w GOPATH=D:\Go\mod
go env -w GOMODCACHE=D:\Go\mod\libs
go env -w GOBIN=D:\Go\mod\bin
go env -w GOCACHE=D:\Go\cache
go env -w GOTMPDIR=D:\Go\temp
```

Go modules 在当前 Go 版本中默认启用，不再需要设置 `GO111MODULE=on`。执行前应先确保所配置的缓存和临时目录存在。

### 2. 在 **Path** 变量中最前面添加：

```shell
D:\Go\root\go1.26.1\bin
D:\Go\mod\bin
```

你的 PATH 应该包含（按顺序）：

| 顺序 | 路径                      | 用途                |
| ---- | ------------------------- | ------------------- |
| 1    | `D:\Go\root\go1.26.1\bin` | Go 编译器           |
| 2    | `D:\Go\mod\bin`           | `go install` 安装的可执行文件（GOBIN） |

---

## 验证设置

**重启 PowerShell** 后运行：

```powershell
go version
go env GOPATH GOMODCACHE GOCACHE
```

---

## 目录对应关系

```
D:\Go\
├── root\go1.26.1\bin\go.exe    ← Go 编译器 (添加到 PATH)
├── mod\                        ← GOPATH
│   ├── bin\                    ← GOBIN（go install 安装的可执行文件）
│   └── libs\                   ← GOMODCACHE（下载的 Go 模块缓存）
├── cache\                      ← GOCACHE (编译缓存)
├── temp\                       ← GOTMPDIR (临时文件)
└── env\                        ← GOENV (配置文件)
```

---

释义如下

- `go/root`目录用于存放各个版本 go 语言源文件
- `go/mod`对应`GOPATH`
- `go/mod/libs`对应`GOMODCACHE`，也就是下载的 Go 模块缓存目录
- `go/mod/bin`对应`GOBIN`，用于存放 `go install` 安装的可执行文件
- `go/cache`，对应`GOCACHE`，存放缓存文件
- `go/temp`，对应`GOTMPDIR`，存放临时文件
- `go/env`，对应`GOENV`，全局环境变量配置文件
