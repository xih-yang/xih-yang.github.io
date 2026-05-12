# 12、SVN 分支
- 来源：https://ddkk.com/zhuanlan/tools/svn/12.html
- 分类：开发工具
- 分组：教程目录
## SVN 分支

Branch 选项会给开发者创建出另外一条线路。当有人希望开发进程分开成两条不同的线路时，这个选项会非常有用。我们先假设你已经发布了一个产品的 1.0 版本，你可能想创建一个新的分支，这样就可以不干扰到 1.0 版本的bug修复的同时，又可以开发2.0版本。

在这一节，我们将看到如何创建，穿过和合并分支。Jerry 因为代码冲突的事情不开心，所以他决定创建一个新的私有分支。

```java
[jerry@CentOS project_repo]$ ls
branches  tags  trunk
[jerry@CentOS project_repo]$ svn copy trunk branches/jerry_branch
A         branches/jerry_branch
[jerry@CentOS project_repo]$ svn status
A  +    branches/jerry_branch
[jerry@CentOS project_repo]$ svn commit -m "Jerry's private branch"
Adding         branches/jerry_branch
Adding         branches/jerry_branch/README
Committed revision 9.
[jerry@CentOS project_repo]$ 
```

现在Jerry 在自己的分支下开始工作。他给序列添加了 sort 选项。Jerry 修改后的代码如下：

```java
[jerry@CentOS project_repo]$ cd branches/jerry_branch/
[jerry@CentOS jerry_branch]$ cat array.c 
```

上面的代码将会产生下面的结果：

```java
#include <stdio.h>
#define MAX 16
void bubble_sort(int *arr, int n)
{
   int i, j, temp, flag = 1;
   for (i = 1; i < n && flag == 1; ++i) {
      flag = 0;
      for (j = 0; j < n - i; ++j) {
         if (arr[j] > arr[j + 1]) {
            flag = 1;
            temp = arr[j];
            arr[j] = arr[j + 1];
            arr[j + 1] = temp;
         }
      }
   }
}
void accept_input(int *arr, int n)
{
   int i;
   for (i = 0; i < n; ++i) 
   scanf("%d", &arr[i]);
}
void display(int *arr, int n)
{
   int i;
   for (i = 0; i < n; ++i)
   printf("|%d| ", arr[i]);
   printf("\n");
}
int main(void)
{
   int i, n, key, ret, arr[MAX];
   printf("Enter the total number of elements: ");
   scanf("%d", &n);
   /* Error handling for array overflow */
   if (n >MAX) {
      fprintf(stderr, "Number of elements must be less than %d\n", MAX);
      return 1;
   }
   printf("Enter the elements\n");
   accept_input(arr, n);
   printf("Array has following elements\n");
   display(arr, n);
   printf("Sorted data is\n");
   bubble_sort(arr, n);
   display(arr, n);
   return 0;
}
```

Jerry 编译并且测试了他的代码，准备提交他的更改。

```java
[jerry@CentOS jerry_branch]$ make array
cc     array.c   -o array
[jerry@CentOS jerry_branch]$ ./array 
```

上面的命令将会产生如下的结果：

```java
Enter the total number of elements: 5
Enter the elements
10
-4
2
7 
9
Array has following elements
|10| |-4| |2| |7| |9| 
Sorted data is
|-4| |2| |7| |9| |10| 
[jerry@CentOS jerry_branch]$ svn status
?       array
M       array.c
[jerry@CentOS jerry_branch]$ svn commit -m "Added sort operation"
Sending        jerry_branch/array.c
Transmitting file data .
Committed revision 10.
```

同时，越过主干，Tom 决定实现 search 选项。Tom 添加了 search 选项而添加代码，他的代码如下：

```java
[tom@CentOS trunk]$ svn diff
```

上面的命令将会产生下面的结果：

```java
Index: array.c
===================================================================
--- array.c   (revision 10)
+++ array.c   (working copy)
@@ -2,6 +2,27 @@
 #define MAX 16
+int bin_search(int *arr, int n, int key)
+{
+   int low, high, mid;
+
+   low   = 0;
+   high   = n - 1;
+   mid   = low + (high - low) / 2;
+
+   while (low <= high) {
+      if (arr[mid] == key)
+         return mid;
+      if (arr[mid] > key)
+         high = mid - 1;
+      else
+         low = mid + 1;
+      mid = low + (high - low) / 2;
+   }
+
+   return -1;
+}
+
 void accept_input(int *arr, int n)
 {
    int i;
@@ -22,7 +43,7 @@
 int main(void)
 {
-   int i, n, arr[MAX];
+   int i, n, ret, key, arr[MAX];
    printf("Enter the total number of elements: ");
    scanf("%d", &n);
@@ -39,5 +60,16 @@
    printf("Array has following elements\n");
    display(arr, n);
+   printf("Enter the element to be searched: ");
+   scanf("%d", &key);
+
+   ret = bin_search(arr, n, key);
+   if (ret < 0) {
+      fprintf(stderr, "%d element not present in array\n", key);
+      return 1;
+   }
+
+   printf("%d element found at location %d\n", key, ret + 1);
+
    return 0;
 }
After reviewing, he commits his changes.
[tom@CentOS trunk]$ svn status
?       array
M       array.c
[tom@CentOS trunk]$ svn commit -m "Added search operation"
Sending        trunk/array.c
Transmitting file data .
Committed revision 11.
```

但是Tom 好奇 Jerry 在他自己的私有分支中干了什么：

```java
[tom@CentOS trunk]$ cd ../branches/
[tom@CentOS branches]$ svn up
A    jerry_branch
A    jerry_branch/array.c
A    jerry_branch/README
[tom@CentOS branches]$ svn log
------------------------------------------------------------------------
r9 | jerry | 2013-08-27 21:56:51 +0530 (Tue, 27 Aug 2013) | 1 line
Added sort operation
------------------------------------------------------------------------
```

通过查看 Subversion 的 log 信息，Tom 发现 Jerry 依赖 ‘sort’ 选项。Tom 决定增添用折半查找，期望数据总是根据种类进行分类。但是如果用户提供的数据是没有进行分类呢？在那种情况下，折半查找将会失效。所以他决定接着 Jerry 的代码，在搜索选项前先进性分类。所以他告诉 Subversion 合并 Jerry 的分支到主干中去。

```java
[tom@CentOS trunk]$ pwd
/home/tom/project_repo/trunk
[tom@CentOS trunk]$ svn merge ../branches/jerry_branch/
--- Merging r9 through r11 into '.':
U    array.c
```

在融合后，array.c 会看上去是这个样子：

```java
[tom@CentOS trunk]$ cat array.c
```

上面的代码将会产生下面的结果：

```java
#include <stdio.h>
#define MAX 16
void bubble_sort(int *arr, int n)
{
   int i, j, temp, flag = 1;
   for (i = 1; i < n && flag == 1; ++i) {
      flag = 0;
      for (j = 0; j < n - i; ++j) {
         if (arr[j] > arr[j + 1]) {
            flag        = 1;
            temp        = arr[j];
            arr[j]      = arr[j + 1];
            arr[j + 1]  = temp;
         }
      }
   }
}
int bin_search(int *arr, int n, int key)
{
   int low, high, mid;
   low   = 0;
   high  = n - 1;
   mid   = low + (high - low) / 2;
   while (low <= high) {
      if (arr[mid] == key)
         return mid;
      if (arr[mid] > key)
         high = mid - 1;
      else
         low = mid + 1;
      mid = low + (high - low) / 2;
   }
   return -1;
}
void accept_input(int *arr, int n)
{
   int i;
   for (i = 0; i < n; ++i)
      scanf("%d", &arr[i]);
}
void display(int *arr, int n)
{
   int i;
   for (i = 0; i < n; ++i)
      printf("|%d| ", arr[i]);
   printf("\n");
}
int main(void)
{
   int i, n, ret, key, arr[MAX];
   printf("Enter the total number of elements: ");
   scanf("%d", &n);
   /* Error handling for array overflow */
   if (n > MAX) {
      fprintf(stderr, "Number of elements must be less than %d\n", MAX);
      return 1;
   }
   printf("Enter the elements\n");
   accept_input(arr, n);
   printf("Array has following elements\n");
   display(arr, n);
   printf("Sorted data is\n");
   bubble_sort(arr, n);
   display(arr, n);
   printf("Enter the element to be searched: ");
   scanf("%d", &key);
   ret = bin_search(arr, n, key);
   if (ret < 0) {
      fprintf(stderr, "%d element not present in array\n", key);
      return 1;
   }
   printf("%d element found at location %d\n", key, ret +   1);
   return 0;
}
```

经过编译和测试后，Tom 提交了他的更改到仓库。

```java
[tom@CentOS trunk]$ make array
cc     array.c   -o array
[tom@CentOS trunk]$ ./array 
Enter the total number of elements: 5
Enter the elements
10
-2
8
15
3
Array has following elements
|10| |-2| |8| |15| |3| 
Sorted data is
|-2| |3| |8| |10| |15| 
Enter the element to be searched: -2
-2 element found at location 1
[tom@CentOS trunk]$ svn commit -m "Merge changes from Jerry's code"
Sending        trunk
Sending        trunk/array.c
Transmitting file data .
Committed revision 12.
[tom@CentOS trunk]$ 
```
