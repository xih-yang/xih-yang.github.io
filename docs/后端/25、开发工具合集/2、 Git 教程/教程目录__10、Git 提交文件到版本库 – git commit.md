# 10、Git 提交文件到版本库 – git commit
- 来源：https://ddkk.com/zhuanlan/tools/git/10.html
- 分类：开发工具
- 分组：教程目录
前面章节我们已经把 README 和 main.c 文件从工作区添加到了暂存区

假设我们已经完成了开发任务，需要把暂存区的文件提交到版本库

使用git commit 命令可以把当前暂存区的文件提交到版本库

### 语法

gitcommit 命令语法格式如下

```sh
$ git commit -m "<本次提交说明信息>"
```

### 范例

使用以下的命令可以把 README 和 main.c 文件提交到版本库

```sh
$ git commit -m "初始化项目"
```

输出结果如下

```sh
$ git commit -m "初始化项目" 
[master (root-commit) b8af03d] 初始化项目
 2 files changed, 0 insertions(+), 0 deletions(-)
 create mode 100644 README
 create mode 100644 main.c
```

使用git status 查看当前项目状态，显示如下

```sh
$ git status
On branch master
nothing to commit, working tree clean
```

使用git log --pretty=oneline 可以查看我们刚刚的提交

```sh
$ git log --pretty=oneline
b8af03dfcae9d4c69c6395cfc3abb0c2d92a4b38 (HEAD -> master) 初始化项目
```
