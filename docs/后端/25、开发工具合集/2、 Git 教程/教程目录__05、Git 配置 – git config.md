# 05、Git 配置 – git config
- 来源：https://ddkk.com/zhuanlan/tools/git/5.html
- 分类：开发工具
- 分组：教程目录
经过上一章的紧张安装，我们终于可以使用 Git 了，但在这之前我们先做一些简单的配置

Git提供了 git config 命令来配置 Git

## Git 环境变量

gitconfig 命令专门用来配置或读取相应的工作环境变量

Git有三种级别的环境变量，它们分别是： 系统 Git 配置、当前用户 Git 配置 和 当前项目 Git 配置

这些环境变量，决定了 Git 在各个环节的具体工作方式和行为

三种级别的 Git 环境变量存储在 三个 不同的配置文件中

**1、** 系统Git配置：/etc/gitconfig文件；

```sh
/etc/gitconfig 是对所有用户都普遍适用的配置
可以使用以下命令来读写 /etc/gitconfig 文件
```

```sh
$ git config --system
```

**2、** 当前用户Git配置：~/.gitconfig文件；

```sh
~/.gitconfig 这个当前用户目录下的配置文件只适用于当前用户
可以使用以下命令来读写 ~/.gitconfig 文件
```

```sh
$ git config --global
```

**3、** 当前项目的Git配置：.git/config文件；

```sh
.git/config 是当前项目下的配置文件，只适用于当前项目有效
可以使用以下命令来读写 .git/config 文件
```

```sh
$ git config
```

每一个级别的配置都会覆盖上层的相同配置，所以 .git/config 里的配置会覆盖 /etc/gitconfig中的同名变量

### Windows 上配置文件目录

在Windows 系统上，Git 会找寻用户主目录下的 .gitconfig 文件

主目录即 `$` HOME 变量指定的目录，一般都是 C:\Documents and Settings\ `$` USER

`$` USER 是当前用户的登录名

此外，Git 还会尝试找寻 Git 安装目录下的 gitconfig 文件

## 配置 Git

### 1. 配置用户信息

可以使用以下命令配置个人的用户名称和电子邮件地址

```sh
$ git config --global user.name "penglei"
$ git config --global user.email penglei@souyunku.cn
```

**1、** 如果用了**–global**选项，那么更改的配置文件就是位于你用户主目录下的那个，以后我们所有的项目都会默认使用这里配置的用户信息；

**2、** 如果要配置某个特定的项目中使用其他名字或者电邮，只要去掉–global选项即可；

```sh
这样新的设定保存在当前项目的 .git/config 文件里
```

### 2. 配置文本编辑器

我们可以设置 Git 默认使用的文本编辑器

一般情况下可能会配置成 vi 或 vim 当然我们也可以配置成其它的，比如 emacs

```sh
$ git config --global core.editor emacs
```

### 3. 配置差异分析工具

差异分析工具是用在解决合并冲突时查看文件差异的

我们可以将默认的差异分析工具改成 vimdiff

```sh
$ git config --global merge.tool vimdiff
```

Git可以理解 kdiff3，tkdiff，meld，xxdiff，emerge，vimdiff，gvimdiff，ecmerge，和 opendiff 等合并工具的输出信息

## 查看配置信息

#### 1. 要检查已有的配置信息，可以使用 git config --list 命令

```sh
$ git config --list
http.postbuffer=2M
user.name=penglei
user.email=penglei@souyunku.cn
```

如果看到重复的变量名，那就说明它们来自不同的配置文件（比如 /etc/gitconfig 和 ~/.gitconfig），不过 Git 实际采用的是最后一个

也可以直接查阅某个环境变量的设定，只要把特定的名字跟在后面即可

```sh
$ git config user.name
penglei
```

#### 2. 我们也可以直接查看配置文件

比如我们可以用 cat ~/.gitconfig 或 cat /etc/gitconfig 命令查看配置

```sh
$ cat /etc/gitconfig
[http]
    postBuffer = 2M
[user]
    name = souyunku
    email = test@souyunku.cn
```
