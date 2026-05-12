# Git 面试题及答案整理，最新面试题
- 来源：https://ddkk.com/zhuanlan/tiku/git.html
- 分类：私域粉丝-面试题
- 分组：面试题目录
## 一、配置操作

### 1. 全局配置

```java
git config --global user.name '你的名字'
git config --global user.email '你的邮箱'
```

### 2. 当前仓库配置

```java
git config --local user.name '你的名字'
git config --local user.email '你的邮箱'
```

### 3.查看 global 配置

```java
 git config --global --list
```

### 4. 查看当前仓库配置

```java
 git config --local --list
```

### 5. 删除 global 配置

```java
 git config --unset --global 要删除的配置项
```

### 6. 删除当前仓库配置

```java
 git config --unset --local 要删除的配置项
```

## 二、本地操作

### 1. 查看变更情况

```java
 git status
```

### 2. 将当前目录及其子目录下所有变更都加入到暂存区

```java
 git add .
```

### 3. 将仓库内所有变更都加入到暂存区

```java
 git add -A
```

### 4. 将指定文件添加到暂存区

```java
 git add 文件1 文件2 文件3
```

### 5. 比较工作区和暂存区的所有差异

```java
 git diff
```

### 6. 比较某文件工作区和暂存区的差异

```java
 git diff 文件
```

### 7. 比较暂存区和 HEAD 的所有差异

```java
 git diff --cached
```

### 8. 比较某文件暂存区和 HEAD 的差异

```java
 git diff --cached 文件
```

### 9. 比较某文件工作区和 HEAD 的差异

```java
 git diff HEAD 文件
```

### 10. 创建 commit

```java
git commit
```

### 11. 将工作区指定文件恢复成和暂存区一致

```java
 git checkout 文件1 文件2 文件3
```

### 12. 将暂存区指定文件恢复成和 HEAD 一致

```java
 git reset 文件1 文件2 文件3
```

### 13. 将暂存区和工作区所有文件恢复成和 HEAD 一样

```java
 git reset --hard
```

### 14. 用 difftool 比较任意两个 commit 的差异

```java
 git difftool 提交1 提交2
```

### 15. 查看哪些文件没被 Git 管控

```java
 git ls-files --others
```

### 16. 将未处理完的变更先保存到 stash 中

```java
 git stash
```

### 17. 临时任务处理完后继续之前的工作

- pop 不保留 stash
- apply 保留 stash

```java
git stash pop
git stash apply
```

### 18. 查看所有 stash

```java
git stash list
```

### 19. 取回某次 stash 的变更

```java
 git stash pop stash@{
     数字n}
```

### 20. 优雅修改最后一次 commit

```java
git add.
git commit --amend
```

## 三、分支操作

### 1. 查看当前工作分支及本地分支

```java
 git branch -v
```

### 2. 查看本地和远端分支

```java
 git branch -av
```

### 3. 查看远端分支

```java
 git branch -rv
```

### 4. 切换到指定分支

```java
 git checkout 指定分支
```

### 5. 基于当前分支创建新分支

```java
git branch 新分支
```

### 6. 基于指定分支创建新分支

```java
 git branch 新分支 指定分支
```

### 7. 基于某个 commit 创建分支

```java
 git branch 新分支 某个 commit 的 id
```

### 8. 创建并切换到该分支

```java
 git checkout -b 新分支
```

### 9. 安全删除本地某分支

```java
 git branch -d 要删除的分支
```

### 10. 强行删除本地某分支

```java
 git branch -D 要删除的分支
```

### 11. 删除已合并到 master 分支的所有本地分支

```java
 git branch --merged master | grep -v '^\*\| master' | xargs -n 1 git branch -d
```

### 12. 删除远端 origin 已不存在的所有本地分支

```java
 git remote prune orign
```

### 13. 将 A 分支合入到当前分支中且为 merge 创建 commit

```java
git merge A分支
```

### 14. 将 A 分支合入到 B 分支中且为 merge 创建 commit

```java
git merge A分支 B分支
```

### 15. 将当前分支基于 B 分支做 rebase，以便将B分支合入到当前分支

```java
 git rebase B分支
```

### 16. 将 A 分支基于 B 分支做 rebase，以便将 B 分支合入到 A 分支

```java
 git rebase B分支 A分支
```

## 四、变更历史

### 1. 当前分支各个 commit 用一行显示

```java
 git log --oneline
```

### 2. 显示就近的 n 个 commit

```java
git log -n
```

### 3. 用图示显示所有分支的历史

```java
 git log --oneline --graph --all
```

### 4. 查看涉及到某文件变更的所有 commit

```java
git log 文件
```

### 5. 某文件各行最后修改对应的 commit 以及作者

```java
 git blame 文件
```

## 五、标签操作

### 1. 查看已有标签

```java
 git tag
```

### 2. 新建标签

```java
 git tag v1.0
```

### 3. 新建带备注标签

```java
 git tag -a v1.0 -m '前端食堂'
```

### 4. 给指定的 commit 打标签

```java
 git tag v1.0 commitid
```

### 5. 推送一个本地标签

```java
 git push origin v1.0
```

### 6. 推送全部未推送过的本地标签

```java
 git push origin --tags
```

### 7. 删除一个本地标签

```java
 git tag -d v1.0
```

### 8. 删除一个远端标签

```java
 git push origin :refs/tags/v1.0
```

## 六、远端交互

### 1. 查看所有远端仓库

```java
 git remote -v
```

### 2. 添加远端仓库

```java
 git remote add url
```

### 3. 删除远端仓库

```java
 git remote remove remote的名称
```

### 4. 重命名远端仓库

```java
 git remote rename 旧名称 新名称
```

### 5. 将远端所有分支和标签的变更都拉到本地

```java
 git fetch remote
```

### 6. 把远端分支的变更拉到本地，且 merge 到本地分支

```java
git pull origin 分支名
```

### 7. 将本地分支 push 到远端

```java
git push origin 分支名
```

### 8. 删除远端分支

```java
git push remote --delete 远端分支名
git push remote :远端分支名
```
