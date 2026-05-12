# 08、Python 教程 - Python中的while循环
- 来源：https://ddkk.com/zhuanlan/other/python/3/8.html
- 分类：Python 进阶探索
- 分组：教程目录
## 一、while循环

**1语句格式**

```java
while 条件满足：
    语句1～～～
else:
    全部循环结束后 要执行的语句
```

示例：

```java
#计算1+2+...+100
sum = 0
i = 1
while i <= 100:
    sum += i
    手动给计数器加1
    i += 1
print(sum)
```

## 二、while死循环

当while语句后面的条件永远为真时就会形成死循环：

```java
 while True:
      print('!!!!!')
```

## 三、while的嵌套

示例打印乘法表：

```java
row  = 1
while row <= 9:
    col = 1
    while col <= row:
        print('%d * %d = %d\t' %(row,col,row*col),end='')
        col += 1
    手动换行
    print('')
    row +=1
# \t:制表符 协助我们在输出文本的时候在垂直方向保持对齐
# \n:换行符
```

程序结果：
