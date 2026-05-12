# 08、Git 创建仓库 – git init
- 来源：https://ddkk.com/zhuanlan/tools/git/8.html
- 分类：开发工具
- 分组：教程目录
Git使用 git init 命令初始化一个 Git 仓库

我们可以使用一个已经存在的目录作为 Git 仓库

## git init 命令

Git使用 **git init** 命令来初始化一个 Git 仓库

Git的很多命令都需要在 Git 的仓库中运行，所以 **git init** 是使用 Git 的第一个命令

在执行完成 **git init** 命令后

Git仓库会生成一个 .git 目录，该目录包含了资源的所有元数据，其它的项目目录保持不变

### 语法

下面的命令在当前目录下创建一个 Git 仓库

```sh
$ git init
Initialized empty Git repository in /tmp/git/.git/
```

该命令执行完后会在当前目录生成一个 .git 目录

```sh
$ ls -al
total 0
drwxr-xr-x  4 penglei staff  128 11  4 17:33 .
drwxrwxrwx 52 penglei staff 1664 11  4 17:33 ..
drwxr-xr-x 13 penglei staff  416 11  4 17:41 .git
```

也可以指定一个目录作为 Git 仓库

```sh
$ git init path_to_new_dir
```

命令执行完后会在 path_to_new_dir 目录下新建一个 .git 目录

所有Git 需要的数据和资源都存放在这个目录中
