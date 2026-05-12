# 05、SVN 检出过程
- 来源：https://ddkk.com/zhuanlan/tools/svn/5.html
- 分类：开发工具
- 分组：教程目录
## SVN 检出过程

SVN提供了 *checkout* 命令来从版本库检出一个工作副本。下面的命令将会在当前工作副本中新建一个名为 *project_repo* 的文件夹。不用担心版本库的 URL 地址是什么，大部分时间里，SVN 管理员会提供给你地址和访问权限的。

```java
[tom@CentOS ~]$ svn checkout http://svn.server.com/svn/project_repo --username=tom
```

以上命令将产生如下结果：

```java
A    project_repo/trunk
A    project_repo/branches
A    project_repo/tags
Checked out revision 1.
```

每一次成功提交之后，修订版本号都会显示出来。如果你想查看更多关于版本库的信息，执行 *info* 命令。

```java
[tom@CentOS trunk]$ pwd
/home/tom/project_repo/trunk
[tom@CentOS trunk]$ svn info
```

以上命令将产生如下结果：

```java
Path: .
URL: http://svn.server.com/svn/project_repo/trunk
Repository Root: http://svn.server.com/svn/project_repo
Repository UUID: 7ceef8cb-3799-40dd-a067-c216ec2e5247
Revision: 1
Node Kind: directory
Schedule: normal
Last Changed Author: jerry
Last Changed Rev: 0
Last Changed Date: 2013-08-24 18:15:52 +0530 (Sat, 24 Aug 2013)
[tom@CentOS trunk]$ 
```
