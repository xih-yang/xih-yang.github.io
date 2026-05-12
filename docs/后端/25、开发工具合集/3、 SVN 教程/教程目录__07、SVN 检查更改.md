# 07、SVN 检查更改
- 来源：https://ddkk.com/zhuanlan/tools/svn/7.html
- 分类：开发工具
- 分组：教程目录
## SVN 检查更改

Jerry 往仓库里添加了一个叫做 array.c 的文件。 Tom 签出最后一个版本后开始工作。

```java
[tom@CentOS ~]$ svn co http://svn.server.com/svn/project_repo --username=tom
```

上面的命令将会产生下面的效果

```java
A    project_repo/trunk
A    project_repo/trunk/array.c
A    project_repo/branches
A    project_repo/tags
Checked out revision 2.
```

但是，他发现有人已经添加了代码，他很好奇是谁添加的，于是他用下面的命令检查 log 信息：

```java
[tom@CentOS trunk]$ svn log
```

上面的命令将会产生下面的效果

```java
------------------------------------------------------------------------
r2 | jerry | 2013-08-17 20:40:43 +0530 (Sat, 17 Aug 2013) | 1 line
Initial commit
------------------------------------------------------------------------
r1 | jerry | 2013-08-04 23:43:08 +0530 (Sun, 04 Aug 2013) | 1 line
Create trunk, branches, tags directory structure
------------------------------------------------------------------------
```

当Tom 查看 Jerry 的代码时，他注意到了里面的一个 bug 。 Jerry 没有检查数组溢出，这会导致很严重的问题。所以 Tom 决定修复这个问题。在修改之后， array.c 将会是这个样子。

```java
#include <stdio.h>
#define MAX 16
int main(void)
{
   int i, n, arr[MAX];
   printf("Enter the total number of elements: ");
   scanf("%d", &n);
   /* handle array overflow condition */
   if (n > MAX) {
      fprintf(stderr, "Number of elements must be less than %d\n", MAX);
      return 1;
   }
   printf("Enter the elements\n");
   for (i = 0; i < n; ++i)
      scanf("%d", &arr[i]);
   printf("Array has following elements\n");
   for (i = 0; i < n; ++i)
      printf("|%d| ", arr[i]);
      printf("\n");
   return 0;
}
```

Tom想使用 status 操作来看看将要生效的更改列表

```java
[tom@CentOS trunk]$ svn status
M       array.c
```

array.c 文件已经被修改，Subversion 会在修改过的文件前面加一个字母 M 。接下来 Tom 编译测试了他的代码，并且工作良好。在提交更改前，他想要再次检查他的更改。

```java
[tom@CentOS trunk]$ svn diff
Index: array.c
===================================================================
--- array.c   (revision 2)
+++ array.c   (working copy)
@@ -9,6 +9,11 @@
    printf("Enter the total number of elements: ");
    scanf("%d", &n);
+   if (n > MAX) {
+      fprintf(stderr, "Number of elements must be less than %d\n", MAX);
+      return 1;
+   }
+
    printf("Enter the elements\n");
    for (i = 0; i < n; ++i)
```

Tom在 array.c 文件中添加了几行代码,Subversion 会在新添加的这几行代码前面添加 ＋ 号标记，现在，他已经准备好提交他的代码。

```java
[tom@CentOS trunk]$ svn commit -m "Fix array overflow problem"
```

上面的命令将会产生下面的效果

```java
Sending        trunk/array.c
Transmitting file data .
Committed revision 3.
```

Tom的更改被成功得提交到了仓库中。
