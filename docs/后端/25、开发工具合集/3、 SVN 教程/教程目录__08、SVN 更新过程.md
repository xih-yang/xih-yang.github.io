# 08、SVN 更新过程
- 来源：https://ddkk.com/zhuanlan/tools/svn/8.html
- 分类：开发工具
- 分组：教程目录
## SVN 更新过程

Jerry 提交了他第一个版本的代码. 但是他想他应该写两个函数用来接收输入和显示数组，在修改之后， array.c 看起来像是下面这样。

```java
#include <stdio.h>
#define MAX 16
void accept_input(int *arr, int n) {
   int i;
   for (i = 0; i < n; ++i) 
   scanf("%d", &arr[i]);
}
void display(int *arr, int n) {
   int i;
   for (i = 0; i < n; ++i) 
   printf("|%d| ", arr[i]);
   printf("\n");
}
int main(void) {
   int i, n, arr[MAX];
   printf("Enter the total number of elements: ");
   scanf("%d", &n);
   printf("Enter the elements\n");
   accept_input(arr, n);
   printf("Array has following elements\n");
   display(arr, n);
   return 0;
}
```

Jerry 编译和测试了他的代码，现在他准备提交他的更改。在此之前，他想要用下面的命令查看更改。

```java
[jerry@CentOS trunk]$ svn diff
```

上面的命令将会产生下面的效果

```java
Index: array.c
===================================================================
--- array.c   (revision 2)
+++ array.c   (working copy)
@@ -2,6 +2,24 @@
 #define MAX 16
+void accept_input(int *arr, int n)
+{
+   int i;
+
+   for (i = 0; i & n; ++i)
+      scanf("%d", &arr[i]);
+}
+
+void display(int *arr, int n)
+{
+   int i;
+
+   for (i = 0; i < n; ++i)
+      printf("|%d| ", arr[i]);
+   
+   printf("\n");
+}
+
 int main(void)
 {
    int i, n, arr[MAX];
@@ -10,15 +28,10 @@
    scanf("%d", &n);
    printf("Enter the elements\n");
+   accept_input(arr, n);
-   for (i = 0; i < n; ++i)
-      scanf("%d", &arr[i]);
-
    printf("Array has following elements\n");
-   for (i = 0; i < n; ++i)
-      printf("|%d| ", arr[i]);
-   
-   printf("\n");
+   display(arr, n);
    return 0;
 }
```

对于新增加的行， Subversion 在前面加上了 ＋ 号，并且用 – 号标记了删除掉的行。现在， Jerry 尝试使用下面的命令来提交他的更改：

```java
[jerry@CentOS trunk]$ svn commit -m "Add function to accept input and to display array contents"
```

上面的命令将会产生下面的效果

```java
Sending        trunk/array.c
svn: Commit failed (details follow):
svn: File or directory 'array.c' is out of date; try updating
svn: resource out of date; try updating
```

Subversion 不会允许 Jerry 提交他的更改，因为 Tom 已经修改了仓库，所以 Jerry 的工作副本已经失效。为了避免两人的代码被互相覆盖，Subversion 不允许他进行这样的操作。Jerry 在提交他的更改之前必须先更新工作副本。所以他使用了 update 命令，如下：

```java
[jerry@CentOS trunk]$ svn update
G    array.c
Updated to revision 3.
```

Subversion 在这个文件前面加上了字母 G 标记, 这意味着这个文件是被合并过的。

```java
[jerry@CentOS trunk]$ svn diff
```

上面的命令将会产生下面的效果

```java
Index: array.c
===================================================================
--- array.c   (revision 3)
+++ array.c   (working copy)
@@ -2,6 +2,24 @@
 #define MAX 16
+void accept_input(int *arr, int n)
+{
+   int i;
+
+   for (i = 0; i < n; ++i)
+      scanf("%d", &arr[i]);
+}
+
+void display(int *arr, int n)
+{
+   int i;
+
+   for (i = 0; i < n; ++i)
+      printf("|%d| ", arr[i]);
+   
+   printf("\n");
+}
+
 int main(void)
 {
    int i, n, arr[MAX];
@@ -15,15 +33,10 @@
    }
    printf("Enter the elements\n");
+   accept_input(arr, n);
-   for (i = 0; i < n; ++i)
-      scanf("%d", &arr[i]);
-
    printf("Array has following elements\n");
-   for (i = 0; i < n; ++i)
-      printf("|%d| ", arr[i]);
-   
-   printf("\n");
+   display(arr, n);
    return 0;
 }
```

Subversion 只展示出了 Jerry 的更改，但是 array.c 文件被合并了。如果你仔细观察，Subversion 现在展示的版本号是3。在之前的输出中，它展示的版本号是2。只是展示出了谁对其进行了更改和更改的目的。

```java
jerry@CentOS trunk]$ svn log
------------------------------------------------------------------------
r3 | tom   | 2013-08-18 20:21:50 +0530 (Sun, 18 Aug 2013)   | 1 line
Fix array overflow problem
------------------------------------------------------------------------
r2 | jerry | 2013-08-17 20:40:43 +0530 (Sat, 17 Aug 2013) | 1 line
Initial commit
------------------------------------------------------------------------
r1 | jerry | 2013-08-04 23:43:08 +0530 (Sun, 04 Aug 2013) | 1 line
Create trunk, branches, tags directory structure
------------------------------------------------------------------------
```

现在Jerry 的工作目录是和仓库同步的，他现在可以安全地提交更改了。

```java
[jerry@CentOS trunk]$ svn commit -m "Add function to accept input and to display array contents"
Sending        trunk/array.c
Transmitting file data .
Committed revision 4.
```
