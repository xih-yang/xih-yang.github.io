# 17、Python 教程 - while循环
- 来源：https://ddkk.com/zhuanlan/other/python/4/17.html
- 分类：Python 入门实战
- 分组：教程目录
## 1 while 循环

如果使用 `while` 循环，只要条件为真，我们就可以执行一组语句。

实例
只要i 小于 7，打印 i：

```java
i = 1
while i < 7:
    print(i)
    i += 1    输出 1, 2, 3, 4, 5, 6
```

***注释：请记得递增 i，否则循环会永远继续。***

while 循环需要准备好相关的变量。在这个实例中，我们需要定义一个索引变量 i，我们将其设置为 1。

## 2 break 语句

如果使用 `break` 语句，即使 while 条件为真，我们也可以停止循环：

实例
在i等于 3 时退出循环：

```java
i = 1
while i < 7:
    print(i)
    if i == 3:
        break
    i += 1    输出 1, 2, 3
```

## 3 continue 语句

如果使用 `continue` 语句，我们可以停止当前的迭代，并继续下一个：

实例
如果i 等于 3，则继续下一个迭代：

```java
i = 0
while i < 7:
    i += 1 
    if i == 3:
        continue
    print(i)  输出1, 2, 4, 5, 6, 7
```

## 4 else 语句

通过使用 `else` 语句，当条件不再成立时，我们可以运行一次代码块：

实例
条件为假时打印一条消息：

```java
i = 1
while i < 6:
    print(i)
    i += 1    1, 2, 3, 4, 5
else:
    print("i is no longer less than 6")    i is no longer less than 6
```
