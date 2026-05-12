# 08、Python 教程 - 异常
- 来源：https://ddkk.com/zhuanlan/other/python/6/8.html
- 分类：Python 基础入门
- 分组：教程目录
**异常事件可能是错误（如试图除以零），也可能是通常不会发生的事情。

Python提供功能强大的替代解决方案——异常处理机制。**

## 异常是什么？

Python使用异常对象来表示异常状态，并在遇到错误时引发异常。异常对象未被处理或捕 获）时，程序将终止并显示一条错误消息（traceback）。

```java
1 / 0
'''
ZeroDivisionError  Traceback (most recent call last)
<ipython-input-146-05c9758a9c21> in <module>()
----> 1/0
ZeroDivisionError: division by zero
'''
```

事实上，每个异常都是某个类（这里是ZeroDivisionError）的实例.

## 让事情沿你指定的轨道出错

### raise 语句

要引发异常，可使用`raise`语句，并将一个类（必须是Exception的子类）或实例作为参数。将类作为参数时，将自动创建一个实例。

在第一个示例（raise Exception）中，引发的是通用异常，没有指出出现了什么错误。

在第二个示例中，添加了错误消息beyondhuangjiaju。

```java
raise Exception
'''
Exception  Traceback (most recent call last)
<ipython-input-147-fca2ab0ca76b> in <module>()
----> raise Exception
Exception: 
'''
raise Exception('beyondhuangjiaju')
'''
Exception  Traceback (most recent call last)
<ipython-input-149-dfdac40c1137> in <module>()
----> raise Exception('beyondhuangjiaju')
Exception: beyondhuangjiaju
'''
raise ArithmeticError
'''
ArithmeticError  Traceback (most recent call last)
<ipython-input-150-36d9a98b39c2> in <module>()
----> raise ArithmeticError
ArithmeticError: 
'''
raise ArithmeticError("beyondhuangjiaju")
'''
ArithmeticError  Traceback (most recent call last)
<ipython-input-151-a6ed875c1de3> in <module>()
----> 1 raise ArithmeticError("beyondhuangjiaju")
ArithmeticError: beyondhuangjiaju
'''
```

一些内置的异常类如下表所示：

类名
描述

Exception
几乎所有的异常类都是从它派生而来的

AttributeError
引用属性或给它赋值失败时引发

OSError
操作系统不能执行指定的任务（如打开文件）时引发，有多个子类

IndexError
使用序列中不存在的索引时引发，为LookupError的子类

KeyError
使用映射中不存在的键时引发，为LookupError的子类

NameError
找不到名称（变量）时引发

SyntaxError
代码不正确时引发

TypeError
将内置操作或函数用于类型不正确的对象时引发

ValueError
将内置操作或函数用于这样的对象时引发：其类型正确但包含的值不合适

ZeroDivisionError
在除法或求模运算的第二个参数为零时引发

### 自定义的异常类

如何创建异常类呢？

就像创建其他类一样，但务必直接或间接地继承Exception（这意味着从任何内置异常类派生都可以）。

当然，如果你愿意，也可在自定义异常类中添加方法。

```java
class SomeCustomBeyondException(Exception): pass
```

## 捕获异常

异常比较有趣的地方是可对其进行处理，通常称之为`捕获异常`。

可使用`try/except`语句。

```java
try: 
    x = int(input('Enter the first number: ')) 
    y = int(input('Enter the second number: ')) 
    print(x / y) 
except ZeroDivisionError: 
    print("The second number can't be zero!")
'''
Enter the first number: 5
Enter the second number: 0
The second number can't be zero!
'''
```

### 不用提供参数

来看一个能够“抑制”异常ZeroDivisionError的计算器类。如果启用了这种功能，计算器将打印一条错误消息，而不让异常继续传播。在与用户交互的会话中使用这个计算器时，抑制异常很有用；但在程序内部使用时，引发异常是更佳的选择（此时应关闭“抑制”功能）。

```java
class MuffledCalculator: 
    muffled = False 
    def calc(self, expr): 
        try: 
            return eval(expr) 
        except ZeroDivisionError: 
            if self.muffled: 
                print('Division by zero is illegal') 
            else: 
                raise
calculator = MuffledCalculator()
calculator.calc('10 / 2')#结果为：5.0
calculator.calc('10 / 0')#报错！！！
calculator.muffled = True
calculator.calc('10 / 0')结果为：Division by zero is illegal
```

如果无法处理异常，在except子句中使用不带参数的raise通常是不错的选择，但有时你可能想引发别的异常。

在这种情况下，导致进入except子句的异常将被作为异常上下文存储起来，并出现在最终的错误消息中。

```java
try:
    1/0
except ZeroDivisionError:
    raise ValueError
#在处理上述异常时，引发了另一个异常：
'''
ZeroDivisionError  Traceback (most recent call last)
<ipython-input-160-14da06562399> in <module>()
      1 try:
----> 2     1/0
      3 except ZeroDivisionError:
ZeroDivisionError: division by zero
During handling of the above exception, another exception occurred:
ValueError  Traceback (most recent call last)
<ipython-input-160-14da06562399> in <module>()
      2     1/0
      3 except ZeroDivisionError:
----> 4     raise ValueError
ValueError: 
'''
#可使用raise ... from ...语句来提供自己的异常上下文，也可使用None来禁用上下文。
try:
    1/0
except ZeroDivisionError:
    raise ValueError from None
'''
ValueError  Traceback (most recent call last)
<ipython-input-161-f4775ad0e53d> in <module>()
      2     1/0
      3 except ZeroDivisionError:
----> 4     raise ValueError from None
ValueError: 
'''
```

### 多个 except 子句

当你在输入字符串的时候，此时会引发另一种异常，该程序中的except子句只捕获`ZeroDivisionError`异常，这种异常将成为漏网之鱼，导致程序终止。

```java
try: 
    x = int(input('Enter the first number: ')) 
    y = int(input('Enter the second number: ')) 
    print(x / y) 
except ZeroDivisionError: 
    print("The second number can't be zero!")
'''
Enter the first number: 1999
Enter the second number: beyond
---------------------------------------------------------------------------
ValueError  Traceback (most recent call last)
<ipython-input-2-f93dbf72378b> in <module>()
      1 try:
      2     x = int(input('Enter the first number: '))
----> 3     y = int(input('Enter the second number: '))
      4     print(x / y)
      5 except ZeroDivisionError:
ValueError: invalid literal for int() with base 10: 'beyond'
'''
```

为同时捕获这种异常，可在try/except语句中再添加一个except子句。

```java
try: 
    x = int(input('Enter the first number: ')) 
    y = int(input('Enter the second number: ')) 
    print(x / y) 
except ZeroDivisionError: 
    print("The second number can't be zero!")
except TypeError:
    print("That wasn't a number,was it?")
```

### 一箭双雕

如果要使用一个except子句捕获多种异常，可在`一个元组中指定这些异常`。

**在except子句中，异常两边的圆括号很重要。**

```java
try: 
    x = int(input('Enter the first number: ')) 
    y = int(input('Enter the second number: ')) 
    print(x / y) 
except (ZeroDivisionError,TypeError,NameError): 
    print("Your numbers were bogus ...")
```

在上述代码中，如果用户输入字符串、其他非数字值或输入的第二个数为零，都将打印同样的错误消息。当然，仅仅打印错误消息帮助不大。

### 捕获对象

```java
try: 
    x = int(input('Enter the first number: ')) 
    y = int(input('Enter the second number: ')) 
    print(x / y) 
except (ZeroDivisionError,TypeError) as e: 
    print(e)
```

这里的except子句捕获两种异常，但由于同时显式地捕获了对象本身，因此可将其打印出来，让用户知道发生了什么情况。

### 一网打尽

即使程序处理了好几种异常，还是可能有一些漏网之鱼。

如果用户在提示时**不输入任何内容就按回车键**，将出现一条错误消息，这种异常未被try/except语句捕获，这理所当然，因为你没有预测到这种问题，也没有采取相应的措施。

```java
try: 
    x = int(input('Enter the first number: ')) 
    y = int(input('Enter the second number: ')) 
    print(x / y) 
except: 
    print("Something wrong happened...")
'''
Enter the first number: 
Something wrong happened...
'''
```

**像这样捕获所有的异常很危险，因为这不仅会隐藏你有心理准备的错误，还会隐藏你没有考虑过的错误。**

**在大多数情况下，更好的选择是使用except Exception as e并对异常对象进行检查。**

**SystemExit**和**KeyboardInterrupt**从**BaseException（Exception的超类）**派生而来

### 万事大吉

使用`except Exception as e`的小技巧在这个小型除法程序中打印更有用的错误消息。

```java
while True:
    try:
        x = int(input('Enter the first number: ')) 
        y = int(input('Enter the second number: ')) 
        value = x / y
        print("x / y is",value)
    except Exception as e:
        print("Invalid input:",e)
        print('Please try again')
    else:
        break
'''
Enter the first number: 1014
Enter the second number: beyond
Invalid input: invalid literal for int() with base 10: 'beyond'
Please try again
Enter the first number: 1202
Enter the second number: 
Invalid input: invalid literal for int() with base 10: ''
Please try again
Enter the first number: 1014
Enter the second number: 0522
x / y is 1.9425287356321839
'''
```

### 最后

最后，还有`finally`子句，可用于在发生异常时执行`清理`工作。这个子句是与try子句配套的。

finally子句非常适合用于确保文件或网络套接字等得以关闭。

**不管try子句中发生什么异常，都将执行finally子句。**

```java
x = None
try:
    x = 1 / 0
except NameError:
    print("Unknown variable")
else:
    print("That went well!")
finally:
    print('Cleaning up ...')
    del x
```

## 异常和函数

异常和函数有着天然的联系。

如果不处理函数中引发的异常，它将向上传播到调用函数的地方。

如果在那里也未得到处理，异常将继续传播，直至到达主程序（全局作用域）。

如果主程序中也没有异常处理程序，程序将终止并显示栈跟踪消息。

```java
def faulty():
    raise Exception('Something is wrong')
def ignore_exception():
    faulty()
def handle_exception():
    try:
        faulty()
    except:
        print('Exception handled')
ignore_exception()
'''
Exception  Traceback (most recent call last)
<ipython-input-6-5ac314d0ac0c> in <module>()
----> 1 ignore_exception()
<ipython-input-5-6806e60d5602> in ignore_exception()
      3 
      4 def ignore_exception():
----> 5     faulty()
      6 
      7 def handle_exception():
<ipython-input-5-6806e60d5602> in faulty()
      1 def faulty():
----> 2     raise Exception('Something is wrong')
      3 
      4 def ignore_exception():
      5     faulty()
Exception: Something is wrong
'''
handle_exception()#结果为：Exception handled
```

faulty中引发的异常依次从faulty和ignore_exception向外传播，最终导致显示一条栈跟踪消息。

调用handle_exception时，异常最终传播到handle_exception，并被这里的try/except语句处理。

## 异常之禅

**假设有一个字典，你要在指定的键存在时打印与之相关联的值，否则什么都不做。**

```java
def describe_person(person):
    print('Description of',person['name'])
    print('Age:',person['age'])
    if 'occupation' in person:
        print('Occupation:',person['occupation'])
```

上面的这段代码很直观，但效率不高（虽然这里的重点是代码简洁），

因为它必须两次查找occupation’键：

一次检查这个键是否存在（在条件中），

另一次获取这个键关联的值，以便将其打印出来。

```java
def describe_person(person):
    print('Description of',person['name'])
    print('Age:',person['age'])
    try:
        print('Occupation:',person['occupation'])
    except KeyError:
        pass
```

上面的这个函数直接假设存在’occupation’键。如果这种假设正确，就能省点事：直接获取并打印值，而无需检查这个键是否存在。如果这个键不存在，将引发KeyError异常，而except子句将捕获这个异常。

**检查一个对象是否包含属性write**

```java
try:
    obj.write
except AttributeError:
    print('The object is not writeable')
else:
    print('The object is writeable')
```

try子句只是访问属性write，而没有使用它来做任何事情。

如果引发了AttributeError异常，说明对象没有属性write，否则就说明有这个属性。

在很多情况下，相比于使用if/else，**使用try/except语句更自然**，也更符合Python的风格。

## 不那么异常的情况

如果你只想发出警告，指出情况偏离了正轨，可使用`模块warnings中的函数warn`。

警告只显示一次。如果再次运行最后一行代码，什么事情都不会发生。

```java
from warnings import warn
warn('I like beyond band')
'''
D:\Anaconda3\lib\site-packages\ipykernel_launcher.py:2: UserWarning: I like beyond band
'''
```

如果其他代码在使用你的模块，可使用模块warnings中的函数filterwarnings来抑制你发出的警告（或特定类型的警告），并指定要采取的措施，如"error"或"ignore"。

```java
from warnings import filterwarnings
filterwarnings("ignore")
warn("Anyone out there?")
filterwarnings("error")
warn("Something is very wrong!")
'''
UserWarning  Traceback (most recent call last)
<ipython-input-13-2678cd9c1908> in <module>()
      3 warn("Anyone out there?")
      4 filterwarnings("error")
----> 5 warn("Something is very wrong!")
UserWarning: Something is very wrong!
'''
```

上述引发的异常为UserWarning。发出警告时，可指定将引发的异常（即警告类别），但必须是Warning的子类。如果将警告转换为错误，将使用你指定的异常。另外，还可根据异常来过滤掉特定类型的警告。

```java
from warnings import filterwarnings
filterwarnings("error")
warn("This function is really old...",DeprecationWarning)
'''
DeprecationWarning  Traceback (most recent call last)
<ipython-input-14-db2d386b9ad9> in <module>()
      1 from warnings import filterwarnings
      2 filterwarnings("error")
----> 3 warn("This function is really old...",DeprecationWarning)
DeprecationWarning: This function is really old...
'''
```

```java
from warnings import filterwarnings
filterwarnings("ignore", category=DeprecationWarning)
warn("Another deprecation warning.", DeprecationWarning)
warn("Something else.")
'''
UserWarning  Traceback (most recent call last)
<ipython-input-15-2ae8758ff90f> in <module>()
      1 filterwarnings("ignore", category=DeprecationWarning)
      2 warn("Another deprecation warning.", DeprecationWarning)
----> 3 warn("Something else.")
UserWarning: Something else.
'''
```

## 小结

概念
解释

异常对象
异常情况（如发生错误）是用异常对象表示的。对于异常情况，有多种处理方式；如果忽略，将导致程序终止。

引发异常
可使用raise语句来引发异常。它将一个异常类或异常实例作为参数，但你也可提供两个参数（异常和错误消息）。如果在except子句中调用raise时没有提供任何参数，它将重新引发该子句捕获的异常。

自定义的异常类
你可通过从Exception派生来创建自定义的异常。

捕获异常
要捕获异常，可在try语句中使用except子句。在except子句中，如果没有指定异常类，将捕获所有的异常。你可指定多个异常类，方法是将它们放在元组中。如果向except提供两个参数，第二个参数将关联到异常对象。在同一条try/except语句中，可包含多个except子句，以便对不同的异常采取不同的措施。

else子句
除except子句外，你还可使用else子句，它在主try块没有引发异常时执行。

finally
要确保代码块（如清理代码）无论是否引发异常都将执行，可使用try/finally，并将代码块放在finally子句中。

异常和函数
在函数中引发异常时，异常将传播到调用函数的地方（对方法来说亦如此）。

警告
警告类似于异常，但（通常）只打印一条错误消息。你可指定警告类别，它们是Warning的子类。

## 本章介绍的新函数

函数
描述

warnings.filterwarnings(action,category=Warning, …)
用于过滤警告

warnings.warn(message, category=None)
用于发出警告
