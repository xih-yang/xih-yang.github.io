# 09、Git 添加文件到暂存区- git add
- 来源：https://ddkk.com/zhuanlan/tools/git/9.html
- 分类：开发工具
- 分组：教程目录
前面我们已经初始化了一个 Git 仓库

假设我们已经创建了几个文件，如下

```sh
$ tree .
.
├── README
└── main.c
0 directories, 2 files
```

现在我们想让这几个文件提交到暂存区，则需要使用 git add 命令

### 语法

gitadd 语法格式如下

```sh
$ git add <file>
```

### 范例

比如下面的命令就是把当前目录下的 README 和 main.c 提交到暂存区

```sh
$ git add *.c
$ git add README
```

我们可以使用 git status 查看暂存区的状态

```sh
$ git status
On branch master
No commits yet
Changes to be committed:
  (use "git rm --cached <file>..." to unstage)
    new file:   README
    new file:   main.c
```

可以看到两个文件已经添加到了暂存区，但还没有提交到版本库
