# 06、SVN 执行修改
- 来源：https://ddkk.com/zhuanlan/tools/svn/6.html
- 分类：开发工具
- 分组：教程目录
## SVN 执行修改

*Jerry* 从版本库检出了最新的版本并开始在项目上工作。他在 *trunk* 目录下创建了一个 *array.c* 文件。

```java
[jerry@CentOS ~]$ cd project_repo/trunk/
[jerry@CentOS trunk]$ cat array.c
```

以上命令将产生如下结果：

```java
#include <stdio.h>
#define MAX 16
int main(void) {
   int i, n, arr[MAX];
   printf("Enter the total number of elements: ");
   scanf("%d", &n);
   printf("Enter the elements\n");
   for (i = 0; i < n; ++i) scanf("%d", &arr[i]);
   printf("Array has following elements\n");
   for (i = 0; i < n; ++i) printf("|%d| ", arr[i]);
   printf("\n");
   return 0;
}
```

他想在提交之前测试他的代码。

```java
[jerry@CentOS trunk]$ make array
cc     array.c   -o array
[jerry@CentOS trunk]$ ./array 
Enter the total number of elements: 5
Enter the elements
1
2
3
4
5
Array has following elements
|1| |2| |3| |4| |5| 
```

他编译并测试了代码，一切正常，现在是时候提交更改了。

```java
[jerry@CentOS trunk]$ svn status
?       array.c
?       array
```

SVN显示在文件名前显示“?”，因为它不知道如何处理这些文件。

在提交之前，*Jerry* 需要将文件添加到待变更列表中。

```java
[jerry@CentOS trunk]$ svn add array.c 
A         array.c
```

现在让我们来用 *status* 命令来检查它。SVN在 *array.c* 文件前面显示了一个 **A**，它意味着这个文件已经被成功地添加到了待变更列表中。

```java
[jerry@CentOS trunk]$ svn status
?       array
A       array.c
```

为了把*array.c* 存储到版本库中，使用 *commit -m* 加上注释信息来提交。如果你忽略了 *-m* 选项， SVN会打开一个可以输入多行的文本编辑器来让你输入提交信息。

```java
[jerry@CentOS trunk]$ svn commit -m "Initial commit"
Adding         trunk/array.c
Transmitting file data .
Committed revision 2.
```

现在 *array.c* 被成功地添加到了版本库中，并且修订版本号增加了1。
