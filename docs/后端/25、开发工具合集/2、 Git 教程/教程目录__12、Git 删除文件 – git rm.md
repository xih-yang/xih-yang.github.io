# 12、Git 删除文件 – git rm
- 来源：https://ddkk.com/zhuanlan/tools/git/12.html
- 分类：开发工具
- 分组：教程目录
如果只是简单地从工作目录中手工删除文件，运行 git status 时就显示 Changes not staged for commit的提示

要从Git 中移除某个文件，就必须要从已跟踪文件清单中移除，然后提交。可以用以下命令完成此项工作

```sh
git rm <file>
```

如果删除之前修改过并且已经放到暂存区域的话，则必须要用强制删除选项-f

```sh
git rm -f <file>
```

如果把文件从暂存区域移除，但仍然希望保留在当前工作目录中，换句话说，仅是从跟踪清单中删除，使用–cached选项即可

```sh
git rm --cached <file>
```

如我们删除 hello.php文件：

```sh
$ git rm hello.php 
rm 'hello.php'
$ ls
README
```

不从工作区中删除文件：

```sh
$ git rm --cached README 
rm 'README'
$ ls
README
```

可以递归删除，即如果后面跟的是一个目录做为参数，则会递归删除整个目录中的所有子目录和文件：

```sh
git rm –r *
```

进入某个目录中，执行此语句，会删除该目录下的所有文件和子目录。
