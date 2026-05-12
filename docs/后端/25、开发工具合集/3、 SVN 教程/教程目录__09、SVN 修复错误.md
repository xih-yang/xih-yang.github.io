# 09、SVN 修复错误
- 来源：https://ddkk.com/zhuanlan/tools/svn/9.html
- 分类：开发工具
- 分组：教程目录
## SVN 修复错误

假设Jerry 意外地更改了 array.c 文件而导致编译错误，他想放弃修改。在这种状况下，‘revert’ 操作将派上用场。revert 操作将撤销任何文件或目录里的局部更改。

```java
[jerry@CentOS trunk]$ svn status
```

上面的命令将会产生下面的效果

```java
M       array.c
```

让我们尝试创建一个数组，如下：

```java
[jerry@CentOS trunk]$ make array
```

上面的命令将会产生下面的效果

```java
cc     array.c   -o array
array.c: In function ‘main’:
array.c:26: error: ‘n’ undeclared (first use in this function)
array.c:26: error: (Each undeclared identifier is reported only once
array.c:26: error: for each function it appears in.)
array.c:34: error: ‘arr’ undeclared (first use in this function)
make: *** [array] Error 1
```

Jerry 在 array.c 文件里执行了‘revert’操作。

```java
[jerry@CentOS trunk]$ svn revert array.c 
Reverted 'array.c'
[jerry@CentOS trunk]$ svn status
[jerry@CentOS trunk]$
```

现在开始编译代码。

```java
[jerry@CentOS trunk]$ make array
cc     array.c   -o array
```

进行revert 操作之后，他的文件恢复了原始的状态。 revert 操作不单单可以使单个文件恢复原状，而且可以使整个目录恢复原状。恢复目录用 －R 命令，如下。

```java
[jerry@CentOS project_repo]$ pwd
/home/jerry/project_repo
[jerry@CentOS project_repo]$ svn revert -R trunk
```

现在，我们已经知道如何撤销更改。但是，假使你想恢复一个已经提交的版本怎么办！Version Control System 工具不允许删除仓库的历史纪录。为了消除一个旧版本，我们必须撤销旧版本里的所有更改然后提交一个新版本。这种操作叫做 reverse merge。

假设Jerry 添加了一段线性搜索操作的代码，核查之后，他提交了更改。

```java
[jerry@CentOS trunk]$ svn diff
Index: array.c
===================================================================
--- array.c   (revision 21)
+++ array.c   (working copy)
@@ -2,6 +2,16 @@
 #define MAX 16
+int linear_search(int *arr, int n, int key)
+{
+   int i;
+
+   for (i = 0; i < n; ++i)
+      if (arr[i] == key)
+         return i;
+   return -1;
+}
+
 void bubble_sort(int *arr, int n)
 {
    int i, j, temp, flag = 1;
[jerry@CentOS trunk]$ svn status
?       array
M       array.c
[jerry@CentOS trunk]$ svn commit -m "Added code for linear search"
Sending        trunk/array.c
Transmitting file data .
Committed revision 22.
```

Jerry 很好奇 Tom 以前写的代码。所以他检查了 Subversion 的 log 信息。

```java
[jerry@CentOS trunk]$ svn log
```

上面的命令将会产生下面的效果

```java
------------------------------------------------------------------------
r5 | tom   | 2013-08-24 17:15:28 +0530 (Sat, 24 Aug 2013) | 1 line
Add binary search operation
------------------------------------------------------------------------
r4 | jerry | 2013-08-18 20:43:25 +0530 (Sun, 18 Aug 2013) | 1 line
Add function to accept input and to display array contents
```

查看log 信息之后，Jerry 意识到他犯了个严重的错误。因为 Tom 已经写了比线性搜索更好的二分法搜索，Jerry 发现自己的代码很冗余，他决定撤销之前对版本的修改。首先，找到仓库的当前版本，现在是版本 22，我们要撤销回之前的版本，比如版本 21。

```java
[jerry@CentOS trunk]$ svn up 
At revision 22.
[jerry@CentOS trunk]$ svn merge -r 22:21 array.c 
--- Reverse-merging r22 into 'array.c':
U    array.c
[jerry@CentOS trunk]$ svn commit -m "Reverted to revision 21"
Sending        trunk/array.c
Transmitting file data .
Committed revision 23.
```
