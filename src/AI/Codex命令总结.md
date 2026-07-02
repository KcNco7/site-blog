# Codex Slash Commands 总结

整理日期：2026-06-08

这份文档总结的是 Codex 中常见的 `/` 命令，也就是 slash commands。
例如 `/clear` 属于 **Codex CLI 终端版**，不是所有界面都支持同一套命令。

## 一、CLI 中最常用的命令

| 命令 | 用途 |
| --- | --- |
| `/clear` | 清屏并新开对话 |
| `/new` | 新开对话，但不清屏 |
| `/resume` | 恢复以前的会话 |
| `/status` | 查看当前模型、权限策略、可写目录、上下文或 token 使用情况 |
| `/model` | 切换模型 |
| `/plan` | 进入规划模式，先让 Codex 给出执行方案 |
| `/goal` | 设定持续目标，让 Codex 围绕该目标继续工作 |
| `/review` | 审查当前工作区改动 |
| `/diff` | 查看 Git diff，包括未跟踪文件 |
| `/compact` | 压缩长对话，节省上下文 |
| `/permissions` | 切换自动批准、只读等权限模式 |

## 二、CLI 中偏会话控制的命令

| 命令 | 用途 |
| --- | --- |
| `/fork` | 把当前对话分叉成一个新线程 |
| `/side` | 开一个临时旁支对话，不打乱主线 |
| `/btw` | 与 `/side` 类似，用于插入一个临时分支话题 |
| `/copy` | 复制最新一条已完成的 Codex 输出 |
| `/raw` | 切换原始滚动输出模式，方便复制终端内容 |
| `/ps` | 查看后台终端任务状态 |
| `/stop` | 停止后台终端任务 |
| `/quit` | 退出 CLI |
| `/exit` | 退出 CLI |

## 三、CLI 中偏配置和调试的命令

| 命令 | 用途 |
| --- | --- |
| `/fast` | 开关 Fast 服务层级，不是所有模型都支持 |
| `/personality` | 切换回复风格 |
| `/theme` | 切换终端高亮主题 |
| `/statusline` | 配置底部状态栏显示项 |
| `/title` | 配置终端窗口标题显示项 |
| `/vim` | 切换 Vim 输入模式 |
| `/keymap` | 修改快捷键映射 |
| `/debug-config` | 查看最终生效的配置及其来源 |
| `/experimental` | 开关实验特性 |
| `/approve` | 对最近一次被自动审查拒绝的动作进行一次手动批准重试 |
| `/sandbox-add-read-dir` | 为沙箱额外添加只读目录，Windows 原生 CLI 专用 |

## 四、CLI 中偏工具和集成的命令

| 命令 | 用途 |
| --- | --- |
| `/mention` | 把文件或目录附加到当前对话上下文 |
| `/ide` | 把 IDE 中打开的文件或选区拉入当前上下文 |
| `/init` | 生成 `AGENTS.md` 模板 |
| `/mcp` | 查看 MCP 工具或服务状态 |
| `/apps` | 浏览并插入 app 或 connectors |
| `/plugins` | 查看和管理插件 |
| `/skills` | 浏览并使用技能 |
| `/hooks` | 查看和管理生命周期 hooks |
| `/agent` | 切换到某个 subagent 线程 |
| `/memories` | 管理 memory 的使用和生成 |
| `/feedback` | 提交反馈，可附日志 |
| `/logout` | 退出登录 |

## 五、IDE 扩展中常见命令

IDE 扩展里的命令集和 CLI 不完全一样，常见的有：

| 命令 | 用途 |
| --- | --- |
| `/auto-context` | 自动带上最近文件和 IDE 上下文 |
| `/cloud` | 切换到云端执行 |
| `/cloud-environment` | 选择云端环境 |
| `/local` | 切回本地执行 |
| `/review` | 代码审查模式 |
| `/status` | 查看 thread ID、上下文用量、速率限制 |
| `/feedback` | 提交反馈 |
| `/goal` | 设置持续目标 |

## 六、Codex App 中常见命令

Codex App 里常见的命令更偏任务和状态管理：

| 命令 | 用途 |
| --- | --- |
| `/plan` | 切换到计划模式 |
| `/goal` | 设置持续目标 |
| `/review` | 代码审查模式 |
| `/status` | 查看线程和上下文状态 |
| `/mcp` | 查看 MCP 连接状态 |
| `/feedback` | 提交反馈 |

## 七、使用时需要注意

- 命令是否可用，和你所在的界面有关，比如 `CLI`、`IDE 扩展`、`Codex App`。
- 同名命令在不同界面里，显示的信息和行为可能略有区别。
- 某些命令受模型、权限模式、实验特性或功能开关影响，不一定每个用户都能看到。
- `/clear` 是 CLI 里的命令，不应默认认为在 App 或 IDE 中也存在。

## 八、建议优先记住的 15 个命令

如果你主要在 CLI 里用 Codex，优先记这几个：

1. `/clear`
2. `/new`
3. `/resume`
4. `/status`
5. `/model`
6. `/plan`
7. `/goal`
8. `/review`
9. `/diff`
10. `/compact`
11. `/permissions`
12. `/mention`
13. `/mcp`
14. `/plugins`
15. `/init`

## 官方文档

- CLI slash commands: <https://developers.openai.com/codex/cli/slash-commands>
- IDE slash commands: <https://developers.openai.com/codex/ide/slash-commands>
- Codex App commands: <https://developers.openai.com/codex/app/commands>

