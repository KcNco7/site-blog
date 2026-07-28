# Git

## Git大体流程

1. `git init` 初始化一个仓库
2. `git add .` 暂存当前目录及其子目录中的改动；在仓库根目录执行时通常覆盖整个工作树
3. `git commit -m "提交说明"` 提交暂存区到仓库区
4. `git remote add origin REMOTE_URL` 为尚未配置远程地址的本地仓库添加远程仓库
5. `git push --set-upstream origin HEAD` 在远程地址和认证已经配置好的前提下，首次推送当前分支并建立上游关系

## 一、Git安装后-指定名称和邮箱

```shell
git config --global user.name "Your Name"
git config --global user.email "email@example.com"

# 查看当前生效的提交身份和配置信息
git config --get user.name
git config --get user.email
git config --list
```

`user.name` 和 `user.email` 是写入提交记录的身份信息，不是远程平台的登录凭据。通过 HTTPS 访问远程仓库时通常使用凭据管理器或访问令牌；通过 SSH 访问时使用 SSH 密钥。

## 二、创建本地仓库

```shell
# 创建目录并进入该目录
mkdir learngit
cd learngit

# 查看当前目录
pwd

# 初始化仓库，生成隐藏的 .git 目录
git init
```

## 三、添加和提交

```shell
# 暂存指定文件并提交
git add test.txt
git commit -m "wrote a test file"

# 查看工作区和暂存区状态
git status

# 暂存整个工作树中的改动
git add --all

# 暂存当前目录及其子目录中的改动
git add .
```

`git add --all` 在不带路径参数时更新整个工作树；`git add .` 的作用范围从当前目录开始。在仓库根目录执行 `git add .` 时，它通常也会覆盖整个工作树。

## 四、版本控制

```shell
# 查看提交历史
git log
git log --oneline

# 查看本地引用的移动记录
git reflog

# 查看文件内容和当前状态
cat test.txt
git status

# 将当前分支移到上一个提交，重置暂存区并保留工作区修改
git reset --mixed HEAD^

# 取消 hello.php 的暂存，保留工作区内容
git restore --staged hello.php

# 将当前分支移到指定提交，重置暂存区并保留工作区修改
git reset --mixed COMMIT_HASH
```

示例中的 `COMMIT_HASH` 是占位符。应先运行 `git log --oneline`，从当前仓库的提交历史中复制需要定位的真实提交哈希，再替换该占位符。

`git reflog` 记录本地分支、`HEAD` 等引用的移动历史，不是每次文件修改的历史。`git reset --soft`、`git reset --mixed` 和 `git reset --hard` 对暂存区、工作区的影响不同，其中 `--hard` 会丢弃未提交修改。对于已经推送并被他人使用的提交，通常优先使用 `git revert` 创建反向提交，避免改写共享历史。

## 五、删除文件

```shell
# 普通删除后，尚未暂存时恢复文件
rm test.txt
git restore test.txt

# git rm 会同时删除文件并暂存这次删除；恢复时先取消暂存
git rm test.txt
git restore --staged test.txt
git restore test.txt

# 如果删除已经单独提交，创建一个反向提交
git rm test.txt
git commit -m "remove test.txt"
git revert DELETE_COMMIT

# 如果删除提交还包含其他改动，只从删除前的版本取回该文件
git restore --source=DELETE_COMMIT^ -- test.txt
git add test.txt
git commit -m "restore test.txt"
```

示例中的 `DELETE_COMMIT` 需要替换为实际删除提交的哈希值。如果删除提交还包含其他改动，只恢复目标文件通常比还原整个提交更合适。

## 工作区、暂存区与本地仓库

理解 Git 的关键不是记命令，而是分清数据当前位于哪一层：

| 区域 | 作用 |
|------|------|
| 工作区 | 当前正在编辑的文件 |
| 暂存区（index） | 准备写入下一次提交的文件内容 |
| 本地仓库 | 已经创建的提交、分支和标签等对象 |

`git add` 会把执行命令那一刻的文件内容写入暂存区。暂存后若又修改了同一个文件，新的修改仍在工作区，需要再次执行 `git add` 才会进入下一次提交。

```shell
git status
git diff
git add -p
git diff --staged
git commit -m "feat: add user profile"
```

- `git diff` 查看尚未暂存的修改。
- `git diff --staged` 查看即将提交的修改。
- `git add -p` 可以按修改片段选择暂存内容，便于保持一次提交只表达一个目的。

`git commit` 只创建本地提交；`git push` 是把已有提交发送到远程仓库，需要先配置远程地址并完成远程身份认证。

## 提交身份不等于远程登录凭据

`user.name` 和 `user.email` 会写入提交的作者、提交者信息，它们不是 GitHub、GitLab 等平台的登录密码。

```shell
git config --global user.name "Your Name"
git config --global user.email "email@example.com"

git config --get user.name
git config --get user.email
git config --list --show-origin
```

如果某个项目需要使用不同邮箱，可以在该仓库中设置本地配置：

```shell
git config --local user.email "work@example.com"
```

HTTPS 的令牌通常交给系统凭据管理器或 Git credential helper 保存；SSH 认证则使用 SSH 密钥和代理。不要把密码、访问令牌写入仓库配置文件或提交到版本库。

## `git add .` 与 `git add -A` 的范围

在现代 Git 中，二者都会暂存其作用范围内文件的新增、修改和删除，主要差别是路径范围：

- `git add .` 以当前目录为路径范围，处理当前目录及其子目录。
- `git add -A` 在不带路径参数时更新整个工作树。

如果命令是在仓库根目录执行，两者通常得到相同结果。提交前仍应使用 `git status` 和 `git diff --staged` 确认实际暂存内容。

## 根据目标选择撤销命令

| 目标 | 命令 | 影响 |
|------|------|------|
| 取消暂存，保留工作区修改 | `git restore --staged <file>` | 只更新暂存区 |
| 丢弃未暂存修改 | `git restore <file>` | 覆盖工作区文件 |
| 修改最近一次本地提交 | `git commit --amend` | 创建新的提交替换原提交 |
| 撤销已经共享的提交 | `git revert <commit>` | 新建一个反向提交，不改写已有历史 |
| 移动本地分支并保留修改 | `git reset --soft` 或 `git reset --mixed` | 改写本地分支位置 |
| 连同暂存区和工作区一起回退 | `git reset --hard` | 会丢弃未提交修改，风险最高 |

`git reset --soft <commit>` 会移动分支并保留暂存区和工作区；默认的 `git reset --mixed <commit>` 还会重置暂存区，但保留工作区。已经推送并被他人使用的提交，通常优先用 `git revert`，避免改写共享历史。

执行 `restore`、`reset --hard` 等覆盖内容的命令前，应先检查 `git status` 和 `git diff`，必要时先提交、暂存到 stash 或另做备份。

`git reflog` 记录本地分支、`HEAD` 等引用曾经指向的位置，可用于寻找误删或误重置前的提交；它不是文件每次编辑的历史记录，而且本地 reflog 条目会按策略过期。

## 删除、停止跟踪与忽略文件

```shell
# 删除文件，并把删除操作加入暂存区
git rm path/to/file

# 只停止跟踪，保留工作区文件
git rm --cached .env

# 恢复被误删但尚未提交的已跟踪文件
git restore path/to/file
```

`.gitignore` 只影响尚未被跟踪的文件；已经进入版本库的文件不会因为后来写入 `.gitignore` 就自动停止跟踪。

```gitignore
node_modules/
dist/
.env
*.log
```

如果密钥或访问令牌已经提交，仅删除文件或加入 `.gitignore` 不能让秘密从历史记录中消失。应立即吊销并更换该凭据，再按团队流程处理历史记录。

## 六、远程仓库

```shell
# 生成 SSH 密钥
ssh-keygen -t ed25519 -C "youremail@example.com"
```

下面的“添加远程”“移除远程”和“克隆仓库”是三个独立场景，不应当作一组命令按顺序全部执行。

### 为已有的本地仓库添加远程地址

```shell
# 添加并查看远程仓库配置
git remote add origin git@github.com:Daisy/AKgit.git
git remote -v

# 首次推送当前分支并建立上游关系，之后可直接使用 git push
git push --set-upstream origin HEAD
git push
```

### 移除本地保存的远程配置

```shell
git remote remove origin
```

`git remote remove origin` 不会删除 GitHub 等平台上的远程仓库。它会删除当前本地仓库中名为 `origin` 的远程配置，以及该远程对应的 `origin/*` 远程跟踪引用；本地普通分支和远程服务器上的分支不因此被删除。

### 克隆一个已有的远程仓库

```shell
git clone git@github.com:Daisy/AKgit.git
cd AKgit
ls
```

默认分支可能叫 `main`、`master` 或其他名称；使用 `HEAD` 可以表示当前分支，也可以根据仓库实际情况写出明确的分支名。

## 七、多人协作

```shell
# 创建并切换到 dev 分支
git switch -c dev

# 查看分支；切换到目标分支后合并 dev
git branch
git switch main
```

下面两种合并方式是替代方案，只选择其中一种执行。

普通合并允许 Git 在可以快进时直接快进：

```shell
git merge dev
```

如果需要明确保留一次合并提交，则改用：

```shell
git merge --no-ff -m "merge: integrate dev" dev
```

```shell
# 删除已经合并的本地 dev 分支
git branch -d dev

# 推送当前分支并建立上游关系
git push --set-upstream origin HEAD

# 获取远程信息，并基于已有的 origin/dev 创建本地跟踪分支
git fetch origin
git switch --track -c dev origin/dev

# 拉取时明确选择只允许快进的策略
git pull --ff-only

# 或者先获取，再把尚未共享的本地提交变基到主分支之后
git fetch origin
git rebase origin/main
```

`origin` 只是远程仓库的一个常用别名。上述 `main` 应替换成仓库实际使用的主分支名。`git pull` 会获取并整合上游改动，具体采用快进、合并还是变基应明确选择；它可能产生冲突，但不会自动替开发者正确解决冲突。`git rebase` 会改写被重放提交的 ID，通常只用于自己尚未共享的本地提交。

## 八、远程仓库本地仓库关联

```shell
# 创建并切换到本地分支，首次推送时建立上游关系
git switch -c dev
git push --set-upstream origin HEAD

# 将已有的本地 dev 分支关联到已有的 origin/dev
git fetch origin
git branch --set-upstream-to=origin/dev dev
```

`git push --set-upstream origin HEAD` 会推送当前分支并设置上游分支。只有远程服务器允许创建分支且同名远程分支尚不存在时，这次推送才会新建远程分支；如果远程分支已经存在，则会尝试更新它。

## 使用 SSH 连接远程仓库

`origin` 只是远程仓库的常用别名，不是固定关键字。远程地址可以使用 SSH，也可以使用 HTTPS。

```shell
# 生成新的 Ed25519 密钥对
ssh-keygen -t ed25519 -C "youremail@example.com"

# 把公钥添加到代码托管平台后，测试 GitHub SSH 连接
ssh -T git@github.com

# 添加、检查或修改远程地址
git remote add origin git@github.com:OWNER/REPOSITORY.git
git remote -v
git remote set-url origin git@github.com:OWNER/NEW-REPOSITORY.git
```

私钥只保存在自己的设备上，不能上传到仓库或发送给他人。添加远程主机前，还应核对首次连接时显示的主机指纹。

克隆地址中不能随意加入空格：

```shell
git clone git@github.com:OWNER/REPOSITORY.git
cd REPOSITORY
```

## 本地分支、远程分支与远程跟踪分支

这三个概念需要分开：

- `dev` 是可以直接提交的本地分支。
- 远程服务器上有自己的 `dev` 分支。
- `origin/dev` 是本地保存的远程跟踪分支，用于表示最近一次获取到的远程 `dev` 状态，不能直接在其上提交。

获取远程信息后，可以创建并跟踪对应的本地分支：

```shell
git fetch origin
git switch --track -c dev origin/dev
```

`git fetch origin` 会下载远程对象，并按照配置的 refspec 通常更新 `refs/remotes/origin/*` 等远程跟踪引用；它还会把本次获取到的引用信息写入 `FETCH_HEAD`，标签则按自动跟随规则或显式的标签 refspec 获取。`fetch` 本身不会把这些更新自动合并或变基到当前工作分支，因此适合先查看远端发生了什么。

## 设置上游分支

上游分支主要是当前本地分支默认拉取和比较的分支，`git pull`、`git status`、`git branch -vv` 等命令会使用这项关联。第一次推送新分支时可以同时建立关联：

```shell
git switch -c feature/login
git push --set-upstream origin HEAD
```

设置上游后通常可以简化 `git pull`；不带参数的 `git push` 最终推送到哪里，还会受到 `push.default`、`branch.<name>.pushRemote`、`remote.pushDefault` 等配置影响，不能一概认为它总是推送到上游分支。可以用下面的命令检查或修改关联：

```shell
git branch -vv
git branch --set-upstream-to=origin/dev dev
```

仓库默认分支可能叫 `main`、`master` 或其他名称，不应在脚本中盲目假定。可使用 `git branch --show-current` 查看当前分支。

## `fetch` 与 `pull` 的区别

`git pull` 会先执行获取操作，再把上游分支整合到当前分支。整合方式可能受命令参数和本地配置影响，因此团队协作时最好明确写出策略：

```shell
# 只允许快进；出现分叉时停止
git pull --ff-only

# 获取后，把本地未共享提交变基到上游之后
git pull --rebase

# 获取后，通过 merge 整合
git pull --no-rebase
```

如果想先检查再决定如何整合，可以拆成两步：

```shell
git fetch --prune origin
git log --oneline --graph --decorate --all

# 二选一
git merge origin/main
git rebase origin/main
```

`git pull` 可能产生冲突，但不会代替开发者判断并解决冲突。

## merge 与 rebase 的边界

| 操作 | 特点 | 适合场景 |
|------|------|----------|
| `git merge` | 保留分支真实分叉，必要时创建合并提交 | 公共分支、希望保留分支关系 |
| `git rebase` | 把提交重新放到新基点上，提交 ID 会改变 | 整理自己尚未共享的本地提交 |

不要随意 rebase 已经推送并被他人基于其工作的提交。若确实需要更新自己的远程功能分支，应先与协作者确认，并优先使用 `git push --force-with-lease`；它仍然属于改写远程历史的高风险操作。

## 处理合并或变基冲突

开始合并或变基前，应先用 `git status` 检查工作区。属于当前工作的改动应先形成清晰提交；暂时无关且不准备提交的改动可以先执行 `git stash push -u -m "before merge"` 保存。

`git merge --abort` 会尝试恢复到本次合并开始前的状态，但它不是未提交修改的备份。如果开始合并时工作区已经有未提交改动，尤其是合并过程中又修改了相同文件，Git 可能无法完整重建合并前状态。

发生冲突后，先用 `git status` 查看冲突文件，人工选择正确内容并删除冲突标记，然后暂存处理结果：

```shell
git status
git add path/to/resolved-file
```

继续或放弃操作的命令取决于当前流程：

```shell
# merge
git merge --continue
git merge --abort

# rebase
git rebase --continue
git rebase --abort
```

不要在不理解双方改动的情况下机械删除冲突标记；代码能成功合并也不代表业务行为一定正确，之后还需要运行测试。

## 一套清晰的功能分支流程

```shell
# 将 MAIN_BRANCH 替换为仓库实际主分支名，例如 main 或 master
git switch MAIN_BRANCH
git pull --ff-only

# 创建功能分支
git switch -c feature/login

# 完成一次小而明确的提交
git add -p
git commit -m "feat: add login form"

# 推送并建立上游关系
git push --set-upstream origin HEAD
```

推送后通常通过代码托管平台创建 Pull Request 或 Merge Request，完成审查和自动检查后再合并。合并完成后，先切回实际主分支并同步，再清理功能分支：

```shell
# 将 MAIN_BRANCH 替换为上面使用的实际主分支名
git switch MAIN_BRANCH
git pull --ff-only

git branch -d feature/login
git push origin --delete feature/login
```

如果代码托管平台在合并后已经自动删除远程功能分支，可以跳过最后一条远程删除命令。
