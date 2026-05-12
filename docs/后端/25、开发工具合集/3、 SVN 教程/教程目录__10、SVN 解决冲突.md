# 10、SVN 解决冲突
- 来源：https://ddkk.com/zhuanlan/tools/svn/10.html
- 分类：开发工具
- 分组：教程目录
## SVN 解决冲突

*Tom*决定给他的工程添加一个 README 文件，于是他创建了这个文件并在其中添加了 TODO 列表。添加完成之后，该文件的存放处位于 revision 6.

```java
[tom@CentOS trunk]$ cat README 
/* TODO: Add contents in README file */
[tom@CentOS trunk]$ svn status
?       README
[tom@CentOS trunk]$ svn add README 
A         README
[tom@CentOS trunk]$ svn commit -m "Added README file. Will update it's content in future."
Adding         trunk/README
Transmitting file data .
Committed revision 6. 
```

*Jerry* 检出了位于 revision 6 最后的代码，并且他直接立刻开始了工作。几个小时以后，*Tom* 更新了 README 文件并且提交了他所修改的地方。修改的 README 将会看上去像这个样子。

```java
[tom@CentOS trunk]$ cat README 
* Supported operations:
1) Accept input
2) Display array elements
[tom@CentOS trunk]$ svn status
M       README
[tom@CentOS trunk]$ svn commit -m "Added supported operation in README"
Sending        trunk/README
Transmitting file data .
Committed revision 7.
```

现在，仓库位于修改版本 7，并且 *Jerry* 的工作副本已经过期。*Jerry* 也更新 README 文件并且试图提交他的更改。

*Jerry* 的 README 文件将会看上去像这个样子：

```java
[jerry@CentOS trunk]$ cat README 
* File list
1) array.c  Implementation of array operation.
2) README   Instructions for user.
[jerry@CentOS trunk]$ svn status
M       README
[jerry@CentOS trunk]$ svn commit -m "Updated README"
Sending        trunk/README
svn: Commit failed (details follow):
svn: File or directory 'README' is out of date; try updating
svn: resource out of date; try updating
```

## 第一步：视图冲突

Subversion 已经检测出 README 自上次更新后文件已经更改。所以，*Jerry* 必须更新他的工作副本。

```java
[jerry@CentOS trunk]$ svn up
Conflict discovered in 'README'.
Select: (p) postpone, (df) diff-full, (e) edit,
        (mc) mine-conflict, (tc) theirs-conflict,
        (s) show all options:
```

Subversion 提示说有一个冲突在 README 文件，并且 Subversion 并不知道如何解决这个问题。于是 *Jerry* 选择 *df* 选项来检查冲突。

```java
[jerry@CentOS trunk]$ svn up
Conflict discovered in 'README'.
Select: (p) postpone, (df) diff-full, (e) edit,
        (mc) mine-conflict, (tc) theirs-conflict,
        (s) show all options: df
--- .svn/text-base/README.svn-base  Sat Aug 24 18:07:13 2013
+++ .svn/tmp/README.tmp Sat Aug 24 18:13:03 2013
@@ -1 +1,11 @@
-/* TODO: Add contents in README file */
+<<<<<<< .mine
+* File list
+
+1) array.c Implementation of array operation.
+2) README  Instructions for user.
+=======
+* Supported operations:
+
+1) Accept input
+2) Display array elements
+>>>>>>> .r7
Select: (p) postpone, (df) diff-full, (e) edit, (r) resolved,
        (mc) mine-conflict, (tc) theirs-conflict,
        (s) show all options:
```

## 第二步：推迟冲突

接下来*Jerry* 用 *postpone（p）* 来解决冲突。

```java
Select: (p) postpone, (df) diff-full, (e) edit, (r) resolved,
        (mc) mine-conflict, (tc) theirs-conflict,
        (s) show all options: p
C    README
Updated to revision 7.
Summary of conflicts:
  Text conflicts: 1
```

在用文档编辑器打开 README 文件后，*Jerry* 意识到 Subversion 已经包含了 *Tom* 的代码和他的代码，并被冲突标示包裹了起来。

```java
[jerry@CentOS trunk]$ cat README
<<<<<<< .min
* File list
1) array.c  Implementation of array operation.
2) README   Instructions for user.
=======
*  Supported operations:
1) Accept input
2) Display array elements
>>>>>>> .r7
```

*Jerry* 想让 *Tom* 的更改跟他的保持一致，所以他决定移除包含冲突标识的行。

所以，更改后的 README 将会是这个样子。

```java
[jerry@CentOS trunk]$ cat README
* File list
1) array.c  Implementation of array operation.
2) README   Instructions for user.
* Supported operations:
1) Accept input
2) Display array elements
```

*Jerry* 解决了冲突并试图再次提交。

```java
[jerry@CentOS trunk]$ svn commit -m "Updated README"
svn: Commit failed (details follow):
svn: Aborting commit: '/home/jerry/project_repo/trunk/README' remains in conflict
[jerry@CentOS trunk]$ svn status
?       README.r6
?       README.r7
?       README.mine
C       README
```

## 第三步：解决冲突

在上面的提交中，字母 *C* 指示说有一个冲突在 README 文件。*Jerry* 解决了冲突但并没有告诉 Subversion 已经解决了冲突。 他使用了 resolve 命令通知 Subversion 冲突的解决。

```java
[jerry@CentOS trunk]$ svn resolve --accept=working README
Resolved conflicted state of 'README'
[jerry@CentOS trunk]$ svn status
M       README
[jerry@CentOS trunk]$ svn commit -m "Updated README"
Sending        trunk/README
Transmitting file data .
Committed revision 8.
```
