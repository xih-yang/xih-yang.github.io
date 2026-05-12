# 16、Python 教程 - Python中的is和==的区别
- 来源：https://ddkk.com/zhuanlan/other/python/3/16.html
- 分类：Python 进阶探索
- 分组：教程目录
## 两者区别

- 当使用==判断两个变量是否相等时,判断的是变量类型（type），变量值（value）
- 当使用is判断两个变量是否相同时,判断的是变量类型（type），变量值（value） 以及变量在内存中的位置（id）

示例：

```java
>>> a = '1'
>>> b = 1
>>> a == b
False
>>> a = '1'
>>> b = a
>>> b
'1'
>>> a is b
True
>>> a == b
True
>>> li = [1,2,3]
>>> li1 = li
>>> li1
[1, 2, 3]
>>> id(li)
140076065706056
>>> id(li1)
140076065706056
>>> li2 = li.copy()			#copy会开辟新的内存空间
>>> li
[1, 2, 3]
>>> li1
[1, 2, 3]
>>> li2
[1, 2, 3]
>>> id(li)
140076065706056
>>> id(li1)
140076065706056
>>> id(li2)
140076065719560
>>> li == li1
True
>>> li == li2
True
>>> li2 is li
False
>>> li1 is li
True
```
