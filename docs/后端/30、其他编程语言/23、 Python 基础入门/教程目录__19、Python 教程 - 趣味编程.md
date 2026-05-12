# 19、Python 教程 - 趣味编程
- 来源：https://ddkk.com/zhuanlan/other/python/6/19.html
- 分类：Python 基础入门
- 分组：教程目录
本章将介绍一些通用的Python编程指南。

## 为何要有趣

Python有趣的地方之一就是让用户的编程效率非常高效。

[极限编程是一种软件开发方法](http://www.extremeprogramming.org)

## 编程柔术

python的灵活性
描述

原型设计Python的优点之一是让你能够快速地编写程序。要更深入地了解面临的问题，编写原型程序是一种很好的办法。

配置
灵活性形式多样。配置旨在让程序的某些方面修改起来更容易——对你和用户来说都如此。

自动化测试能够轻松地修改程序，有了测试后，就能确信程序在修改后也能正确地运行。

## 原型设计

原型（prototype）指的是尝试性实现，即一个模型。它实现了最终程序的主要功能，但在后期可能需要重写，也可能不用重写。通常，最初的原型都能变成可行的程序。

Python的优点在于，使用它编写模型的投入很少，因此完全可以弃之不用。

每个项目都有两个实现。

第一个实现是摸着石头过河：拼凑出一个能够解决问题（或部分问题）的程序，以便了解需要的组件以及对优秀解决方案的要求。在这个过程中，最重要的可能就是看到程序的各种缺陷。基于这些新的认识，再次尝试解决面临的问题，而此时人们的判断力和洞察力可能更强。

## 配置

重温抽象这一重要原则。第6章和第7章介绍了如何提高代码的抽象程度，这是通过将代码放在函数和方法中并将较大的结构隐藏在类中实现的。

另一种简单得多的提高程序抽象程度的方式：提取代码中的符号常量（symbolic constant）。

### 提取常量

**常量，指的是内置的字面量值，如数、字符串和列表。**

对于这些值，可将其存储在全局变量中，而不在程序中反复输入它们。

全局变量存在的问题仅在被修改时才会呈现出来，因为很难确定代码的哪部分修改了哪些全局变量。

一种高效的方法是：不去修改这些全局变量，而是将它们作为常量（即符号常量）。

要指出变量被视为符号常量，可遵循一种特殊的命名约定：**只在变量名中使用大写字母并用下划线分隔单词。**

**计算圆的面积和周长**

`在程序开头包含代码行PI = 3.14，然后使用名称PI而不是数本身。这样，以后要使用更精确的值时，只需修改这行代码即可。每当需要输入常量（如数字42或字符串Hello,world!）多次时，都应考虑将其存储在全局变量中。`

```java
from math import pi
pi = 3.14#若需要修改pi的值，可以在此处修改即可
r=input("please input the r")
area = pi*float(r)*float(r)
circumference = pi*2*float(r)
print(float(area))
print(float(circumference))
'''#运行结果为：
please input the r2
12.56
12.56
'''
```

### 配置文件

虽然可以为自己方便而提取常量，但有些常量必须暴露给用户。

例如，如果用户不喜欢你编写的GUI程序的背景色，可能应该允许他们使用其他颜色；对于你开发的街机游戏，可让用户决定启动时显示的问候消息；对于你开发的Web浏览器，可让用户决定默认显示的起始页面。

可将这些配置变量放在独立的文件中，而不将它们放在模块开头。

为此，最简单的方式是**专门为配置创建一个模块**。

```java
from config import PI
```

如上述代码所示，如果要修改PI的值，只需编辑config.py，而不用在代码中搜索。

使用配置文件有利有弊。一方面，配置很有用；但另一方面，使用针对整个项目的中央共享变量库可能降低项目的模块化程度（即增大耦合程度）。因此，使用配置文件时，务必不要破坏抽象（如封装）。

另一种方法是使用标准库模块configparser，从而可在配置文件中使用标准格式。

必须使用[files]、[colors]等标题将配置文件分成几部分（section）。

标题的名称可随便指定，但必须将它们用方括号括起。

**一个简单的配置文件（area.ini）**

```java
[numbers]
pi: 3.1415926535897931
[messages]
greeting: Welcome to the area calculation program!
question: Please enter the radius: 
result_message: The area is
```

**一个使用ConfigParser的程序**

```java
from configparser import ConfigParser
CONFIGFILE = "area.ini"
config = ConfigParser() 
# 读取配置文件：
config.read(CONFIGFILE) 
# 打印默认问候语（greeting）：
# 在messages部分查找问候语：
print(config['messages'].get('greeting')) 
# 使用配置文件中的提示（question）让用户输入半径：
radius = float(input(config['messages'].get('question') + ' ')) 
# 打印配置文件中的结果消息（result_message）；
# 以空格结束以便接着在当前行打印：
print(config['messages'].get('result_message'), end=' ') 
# getfloat()将获取的值转换为浮点数：
print(config['numbers'].getfloat('pi') * radius**2)
```

## 日志

日志大致上就是收集与程序运行相关的数据，供你事后进行研究或积累。

print语句是一种简单的日志形式。

标准库中的日志模块为**logging**。

**一个使用模块logging的程序**

```java
import logging
logging.basicConfig(level=logging.INFO, filename='mylog.log') 
logging.info('Starting program') 
logging.info('Trying to divide 1 by 0') 
print(1 / 0)
logging.info('The division succeeded') 
logging.info('Ending program')
'''#运行结果为：
import logging
logging.basicConfig(level=logging.INFO, filename='mylog.log') 
logging.info('Starting program') 
logging.info('Trying to divide 1 by 0') 
print(1 / 0)
logging.info('The division succeeded') 
logging.info('Ending program')
'''
```

**运行这个程序时，将生成下面的日志文件（mylog.log）：**

日志内容如下：

```java
INFO:root:Starting program 
INFO:root:Trying to divide 1 by 0
```

试图将1除以0后什么都没有记录下来，因为这种错误将导致程序终止。这是一种简单的错误，你可根据程序崩溃时打印的异常来跟踪确定问题出在什么地方。

不会导致程序终止、而只是让它行为异常的bug是最难查找的，但通过查看详尽的日志文件也许能够帮助你找出问题出在什么地方。

这个示例中的日志文件并不是很详细，但通过合理地配置模块logging，可让日志以你希望的方式运行。下面是几个这样的示例。

- 记录不同类型的条目（信息、调试信息、警告、自定义类型等）。默认情况下，只记录警告。（这就是在一个使用模块logging的程序中显式地将level设置为**logging.INFO**的原因所在。）
- 只记录与程序特定部分相关的条目。
- 记录有关时间、日期等方面的信息。
- 记录到其他位置，如套接字。
- 配置日志器，将一些或大部分日志过滤掉，这样无需重写程序就能获得所需的日志信息。模块logging非常复杂，文档中还提供了其他很多相关的信息。

## 小结

概念
描述

灵活性
设计和编程时，应以灵活性为目标。随着对所面临问题了解得越来越深入，你应心甘情愿乃至随时准备修改程序的方方面面，不要固守最初的想法。

原型设计
要深入了解问题和可能的实现方案，一个重要的技巧是编写程序的简化版本，以了解它是如何工作的。使用Python编写原型非常容易，使用众多其他语言编写一个原型所需的时间足以让你用Python编写多个原型。即便如此，除非万不得已，否则不要推倒重来，因为重构通常是更佳的解决方案。

配置
通过提取程序中的常量，可让以后修改程序变得更容易。通过将这些常量放在配置文件中，让用户能够配置程序，使其按自己希望的方式行事。通过使用环境变量和命令行选项，可进一步提高程序的可配置性。

日志
日志对找出程序存在的问题或监视其行为大有裨益。你可自己动手使用print语句实现简单的日志，但最安全的做法是使用标准库中的模块logging。
