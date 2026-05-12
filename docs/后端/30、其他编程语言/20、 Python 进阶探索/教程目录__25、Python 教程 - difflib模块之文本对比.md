# 25、Python 教程 - difflib模块之文本对比
- 来源：https://ddkk.com/zhuanlan/other/python/3/25.html
- 分类：Python 进阶探索
- 分组：教程目录
## 一、difflib模块

**1. 什么是difflib? 用来做什么?**

difflib为python的标准库模块，无需安装。

作用是对比文本之间的差异。

并且支持输出可读性比较强的HTML文档，与Linux下的diff命令相似。

在版本控制方面非常有用。

**2. 符号理解**

符号含义

‘-’包含在第一个系列行中，但不包含第二个。

‘+’包含在第二个系列行中，但不包含第一个。

’’两个系列行一致

‘?’存在增量差异

‘^’存在差异字符

## 二、使用difflib模块对比文本

对比两个文本的不同并输出为`.html`文件

```java
import difflib
text1 = '''  1. Beautiful is better than ugly.
       2. Explicit is better than implicit.
       3. Simple is better than complex.
       4. Complex is better than complicated.
		'''.splitlines(keepends=True)				#keepends=True 表示保留换行符
text2 = '''  1. Beautiful is better than ugly.
       3.   Simple is better than complex.
       4. Complicated is better than complex.
       5. Flat is better than nested.
     '''.splitlines(keepends=True)
# d = difflib.Differ()
# print(''.join(list(d.compare(text1,text2))))
d = difflib.HtmlDiff()
htmlContent = d.make_file(text1,text2)
# print(htmlContent)
with open('diff.html','w') as f:
    f.write(htmlContent)
```

打开上述代码运行输出的`.html`文件后:

## 三、使用difflib模块对比文件

对比两个文件的不同并输出为`.html`文件

```java
import difflib
filename1 = '1.txt'
filename2 = '2.txt'
with open(filename1) as f1,open(filename2) as f2:
    content1 = f1.read().splitlines(keepends=True)
    content2 = f2.read().splitlines(keepends=True)
d = difflib.HtmlDiff()
htmlcontent = d.make_file(content1,content2)
with open('txtDiff.html','w') as f:
    f.write(htmlcontent)
```

输出结果为名为`txtDiff.html`的文件，用浏览器打开该文件后：
