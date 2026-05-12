# 30、Lua中的table函数库
- 来源：https://ddkk.com/zhuanlan/other/lua/30.html
- 分类：Lua 教程
- 分组：教程目录
## Lua中的table函数库

table库由一些操作table的辅助函数组成。他的主要作用之一是对Lua中array的大小给出一个合理的解释。另外还提供了一些从list中插入删除元素的函数，以及对array元素排序函数。

## table.concat(table, sep, start, end)

concat是concatenate(连锁, 连接)的缩写. table.concat()函数列出参数中指定table的数组部分从start位置到end位置的所有元素, 元素间以指定的分隔符(sep)隔开。除了table外, 其他的参数都不是必须的, 分隔符的默认值是空字符, start的默认值是1, end的默认值是数组部分的总长.

sep, start, end这三个参数是顺序读入的, 所以虽然它们都不是必须参数, 但如果要指定靠后的参数, 必须同时指定前面的参数.

```sh
test = {"Tom", "Mary", "Jam","Hey"}
print(table.concat(test, ":"))
print("*************")
print(table.concat(test, nil, 1, 2))
print("*************")
print(table.concat(test, "\n", 2, 3))
print(table.maxn(test))
```
