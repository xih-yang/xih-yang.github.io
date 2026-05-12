# 28、Python 教程 - Python中的异常
- 来源：https://ddkk.com/zhuanlan/other/python/3/28.html
- 分类：Python 进阶探索
- 分组：教程目录
## 一、Python中的异常

**1异常是什么**

异常就是程序运行时发生错误的信号

**Traceback** 是 Python 错误信息的报告。在其他编程语言中有着不同的叫法包括 stack trace, stack traceback, backtrac 等名称, 在 Python 中，我们使用的术语是 Traceback。

**2常见的异常种类**

```java
AttributeError 试图访问一个对象没有的树形，比如foo.x，但是foo没有属性x
IOError 输入/输出异常；基本上是无法打开文件
ImportError 无法引入模块或包；基本上是路径问题或名称错误
IndentationError 语法错误（的子类） ；代码没有正确对齐
IndexError 下标索引超出序列边界，比如当x只有三个元素，却试图访问x[5]
KeyError 试图访问字典里不存在的键
KeyboardInterrupt Ctrl+C被按下
NameError 使用一个还未被赋予对象的变量
SyntaxError Python代码非法，代码不能编译(个人认为这是语法错误，写错了）
TypeError 传入对象类型与要求的不符合
UnboundLocalError 试图访问一个还未被设置的局部变量，基本上是由于另有一个同名的全局变量，
导致你以为正在访问它
ValueError 传入一个调用者不期望的值，即使值的类型是正确的
```

## 二、异常的处理

**1异常处理的语句结构**

```java
try:
    <statements>       运行try语句块，并试图捕获异常
except <name1>:
    <statements>       如果name1异常发现，那么执行该语句块。
except (name2, name3):
    <statements>       如果元组内的任意异常发生，那么捕获它
except <name4> as <variable>:
    <statements>       如果name4异常发生，那么进入该语句块，并把异常实例命名为variable
except:
    <statements>       发生了以上所有列出的异常之外的异常
else:
	<statements>           如果没有异常发生，那么执行该语句块
finally:
    <statement>        无论是否有异常发生，均会执行该语句块。
```

**说明**

- else和finally是可选的，可能会有0个或多个except，但是，如果出现一个else的话，必须有至少一个except。
- 不管你如何指定异常，异常总是通过实例对象来识别，并且大多数时候在任意给定的时刻激活。一旦异常在程序中某处由一条except子句捕获，它就死掉了，除非由另一个raise语句或错误重新引发它

**2捕获异常并输出**

示例：

```java
def demo1():
    try:
        return int(input('请输入正确的整数:'))
    except Exception as r:
        print('未知错误 %s' %r)		#输出异常
def demo2():			#函数的错误：一级一级向上去找 最终会将异常传递到主函数里面去
    return demo1()
print(demo2())
```

结果示例：

```java
请输入正确的整数:a
未知错误 invalid literal for int() with base 10: 'a'
None
```

**3主动抛出异常**

raise语句用来手动抛出一个异常

示例：

```java
def input_passwd():
    1.提示用户输入密码
    pwd = input('请输入密码:')
    2.判断密码长度
    if len(pwd) >= 8:
        return pwd
    3.如果<8 就主动抛出异常
    print('主动抛出异常')
    a.创建异常对象
    ex = Exception('密码长度不够，必须大于8位')
    b.主动抛出异常
    raise ex
# 注意：只抛出二不捕获 代码会报错
try:
    print(input_passwd())
except Exception as re:
    print(re)
```

结果示例：

```java
请输入密码:as
主动抛出异常
密码长度不够，必须大于8位
```
