# 13、Git 重命名文件 – git mv
- 来源：https://ddkk.com/zhuanlan/tools/git/13.html
- 分类：开发工具
- 分组：教程目录
gitmv 命令用于移动或重命名一个文件、目录、软连接

### 语法

gitmv 命令语法格式如下

```sh
git mv <old_file> <new_file>
```

### 范例

假如当前项目版本库中有如下文件

```sh
$ ls 
README  main.c
```

现在我们想把 README 文件重命名为 README.md 则可以使用下面的命令

```sh
$ git mv README README.md
$ ls
README.md  main.c
$ git status
On branch master
Changes to be committed:
  (use "git reset HEAD <file>..." to unstage)
    renamed:    README -> README.md
(spider) 
```

我们可以看到，重命名后文件会放入暂存区，需要使用 git commit 命令提交到仓库
