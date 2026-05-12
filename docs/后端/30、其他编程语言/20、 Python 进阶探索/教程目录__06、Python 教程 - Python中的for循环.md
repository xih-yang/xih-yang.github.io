# 06、Python 教程 - Python中的for循环
- 来源：https://ddkk.com/zhuanlan/other/python/3/6.html
- 分类：Python 进阶探索
- 分组：教程目录
## 一、for循环语句

Python for循环可以遍历任何序列的项目，如一个列表或者一个字符串

语法格式：

```java
for iterating_var in sequence:
   statements(s)
```

for循环的几个示例：

**1求1~100之和**

```java
sum = 0
for i in range(1,101):
    sum  = sum + i
    sum += i
print(sum)
```

**2求1~100的偶数的和**

```java
sum  = 0
for i in range(2,101,2):
    sum += i
print(sum)
```

**3求1~100的奇数的和**

```java
sum = 0
for i in range(1,101,2):
    sum +=i
print(sum)
```

**4用户输入一个数字 求该数的阶乘**

```java
num = int(input('Num:'))
res = 1
for i in range(1,num+1):
    res = res * i
print('%d的阶乘的结果为:%d' %(num,res))
```

## 二、for循环中else的使用

在python 中，for … else 表示这样的意思，for 中的语句和普通的没有区别，else 中的语句会在**循环正常执行完**（即 for 不是通过 break 跳出而中断的）的情况下执行，while … else 也是一样。

示例：
用户登陆程序

**1、** 输入用户名和密码；

**2、** 判断用户名和密码是否正确(‘name==root’,'passwd=‘westos’)；

**3、** 为了防止暴力破解，登陆次数仅有三次，如果超过三次机会，报错；

```java
for i in range(3): 0 1 2
    name = input('用户名:')
    passwd = input('密码:')
    if name == 'root' and passwd == 'redhat':
        print('登陆成功')
        跳出整个循环 不会再执行后面的内容
        break
    else:
        print('登陆失败')
        print('您还剩余%d次机会' %(2-i))
else:
    print('登陆次数超过三次,请等待100s后再试!!!')
```

## 三、循环中的break，continue，exit()

**break** :跳出整个循环 不会再执行循环后面的内容

**continue** :跳出本次循环,continue后面的代码内容也不会被执行

**exit()** :结束整个程序的运行
