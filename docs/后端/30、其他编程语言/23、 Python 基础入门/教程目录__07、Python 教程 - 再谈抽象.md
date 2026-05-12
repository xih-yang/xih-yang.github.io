# 07、Python 教程 - 再谈抽象
- 来源：https://ddkk.com/zhuanlan/other/python/6/7.html
- 分类：Python 基础入门
- 分组：教程目录
## 对象魔法

多态：可对不同类型的对象执行相同的操作，而这些操作就像“被施了魔法”一样能够正常运行。(即：无需知道对象的内部细节就可使用它)（**无需知道对象所属的类（对象的类型）就能调用其方法**）

封装：对外部隐藏有关对象工作原理的细节。（**无需知道对象的构造就能使用它**）

继承：可基于通用类创建出专用类。

### 1，多态

即便你不知道变量指向的是哪种对象，也能够对其执行操作，且操作的行为将随对象所属的类型（类）而异。

### 2，多态和方法

与对象属性相关联的函数称为方法

如果有一个变量x，你无需知道它是字符串还是列表就能调用方法count：只要你向这个方法提供一个字符作为参数，它就能正常运行。count方法返回指定字符串出现的个数。

```java
'abc'.count('a')#结果为：1
['a',1, 2, 'a','a'].count('a')#结果为：3
```

标准库模块random包含一个名为**choice**的函数，它从序列中**随机**选择一个元素。

```java
from random import choice 
x = choice(['Hello, world!', [1, 2, 'e', 'e', 4]])#x可能包含字符串'Hello, world!'，也可能包含列表[1, 2, 'e', 'e', 4]
x.count('e')#可能是1，也可能是2
```

**多态形式多样**。每当无需知道对象是什么样的就能对其执行操作时，都是多态在起作用。这不仅仅适用于方法，还可以通过内置运算符和函数使用多态。

参数可以是任何支持加法的对象

加法运算符（+）既可用于数（这里是整数），也可用于字符串（以及其他类型的序列）

```java
1 + 2#结果为：3
'beyond' + 'huangjiaju'#结果为：'beyondhuangjiaju'
```

等价于下面函数：

```java
def add(x, y): 
    return x + y
add(1,2)#结果为：3
add('beyond','huangjiaju')#结果为：'beyondhuangjiaju'
```

**编写一个函数，通过打印一条消息来指出对象的长度**

```java
def length_message(x): 
    print("The length of", repr(x), "is", len(x))
length_message('beyond')#结果为：The length of 'beyond' is 6
length_message([1, 2, 3])#结果为：The length of [1, 2, 3] is 3
```

要破坏多态，唯一的办法是使用诸如type、issubclass等函数显式地执行类型检查，但你应尽可能避免以这种方式破坏多态。

### 3，封装

封装（encapsulation）指的是**向外部隐藏不必要的细节**

属性是归属于对象的变量，就像方法一样。

对象有自己的状态。对象的状态由其属性（如名称）描述。

对象的方法可能修改这些属性，因此对象将一系列函数（方法）组合起来，并赋予它们访问一些变量（属性）的权限，而属性可用于在两次函数调用之间存储值。

多态让你`无需知道对象所属的类（对象的类型）`就能调用其方法

而封装让你`无需知道对象的构造`就能使用它。

### 4，继承

继承是另一种`偷懒`的方式。

如果你已经有了一个类，并要创建一个与之很像的类（可能只是新增了几个方法），可以让创建的这个类去继承已有的类。

## 类

### 类到底是什么？

类的定义——一种对象。

每个对象都属于特定的类，并被称为该类的实例。

对于`类的名称`，在Python中，约定使用`单数并将首字母大写`，如Bird和Lark。

类是由其支持的方法定义的，类的所有实例都有该类的所有方法，因此子类的所有实例都有超类的所有方法。

### 创建自定义类

对huangjiaju调用set_name和greet时，huangjiaju都会作为第一个参数自动传递给它们，这就是self。

self很有用，甚至必不可少。如果没有它，所有的方法都无法访问对象本身——要操作的属性所属的对象

```java
class Band: 
    def set_name(self, name): 
        self.name = name 
    def get_name(self): 
        return self.name 
    def greet(self): 
        print("Hello! {} band.".format(self.name))
huangjiaju = Band()
bar = Band()
huangjiaju.set_name('Beyond')
bar.set_name('The Beatles')
huangjiaju.greet()#结果为：Hello! Beyond band.
bar.greet()#结果为：Hello! The Beatles band.
huangjiaju.name#结果为：'Beyond'
bar.name = 'The Rolling Stones'
bar.greet()#结果为：Hello! The Rolling Stones band.
```

### 属性、函数和方法

方法和函数的区别表现在于参数`self`。

方法（更准确地说是关联的方法）将其第一个参数关联到它所属的实例，因此无需提供这个参数。

```java
class Class:
    def method(self):
        print("I like beyond band!")
def function():
    print("huangjiaju")
instance = Class()
instance.method()#结果为：I like beyond band!
instance.method = function
instance.method()#结果为：huangjiaju
```

**有没有参数self并不取决于是否以刚才使用的方式（如instance.method）调用方法。**

当然，也完全可以让另一个变量指向同一个方法。

```java
class Band:
    songer = "huangjiaju"
    def sing(self):
        print(self.songer)
beyond = Band()
beyond.sing()#结果为：huangjiaju
beyondsonger = beyond.sing
beyondsonger()#结果为：huangjiaju
```

**私有属性不能从对象外部访问，而只能通过存取器方法（如get_name和set_name）来访问。**

Python没有为私有属性提供直接的支持，而要让方法或属性成为私有的（不能从外部访问），只需让其名称以两个下划线打头即可。

```java
class Band:
    def __huangjiaju(self):
        print("beyond can't see")
    def huangjiaqiang(self):
        print("beyond can see")
        self.__huangjiaju()
yy = Band()
yy.__huangjiaju()#报错！！！
yy.huangjiaqiang()#结果为：
'''
beyond can see
beyond can't see
'''
```

**从外部不能访问__huangjiaju，但在类中（如huangjiaqiang中）依然可以使用它。**

以两个下划线打头，这样的方法类似于其他语言中的标准私有方法。

在类定义中，对所有以两个下划线打头的名称都进行转换，即在开头加上一个下划线和类名。

```java
class Band:
    def __huangjiaju(self):
        print("beyond can't see")
    def huangjiaqiang(self):
        print("beyond can see")
        self.__huangjiaju()
yy = Band()
yy._Band__huangjiaju()#结果为：beyond can't see
```

### 类的命名空间

以下两条语句大致等价：它们都创建一个返回参数平方的函数

```java
def Hjj(x):return x*x
Hjq = lambda x:x*x
Hjj(8)#结果为：64
Hjq(9)#结果为：81
```

在class语句中定义的代码都是在一个特殊的命名空间（类的命名空间）内执行的，而类的所有成员都可访问这个命名空间。

```java
class NumberCounter:
    number = 0
    def init(self):
        NumberCounter.number += 1
m1 = NumberCounter()
m1.init()
NumberCounter.number#结果为：1
m2 = NumberCounter()
m2.init()
NumberCounter.number#结果为：2
'''
上述代码在类作用域内定义了一个变量，所有的成员（实例）都可访问它，
这里使用它来计算类实例的数量,注意到这里使用了init来初始化所有实例!!!
'''
#每个实例都可访问这个类作用域内的变量，就像方法一样
m1.number#结果为：1
m2.number#结果为：2
#在一个实例中给属性number赋值
m1.number = "yy"
m1.number#结果为：'yy'
m2.number#结果为：2
#新值被写入m1的一个属性中，这个属性遮住了类级变量。
```

### 指定超类

**子类扩展了超类的定义，要指定超类，可在class语句中的类名后加上超类名，并将其用圆括号括起。**

```java
class Filter:
    def init(self):
        self.blocked = []
    def filter(self,sequence):
        return [x for x in sequence if x not in self.blocked]
class SPAMFilter(Filter):#SPAMFilter是Filter的子类
    def init(self):重写超类Filter的方法init
        self.blocked = ['SPAM']
#Filter是一个过滤序列的通用类。实际上，它不会过滤掉任何东西。
f = Filter()
f.init()
f.filter([1,2,3])#结果为：[1, 2, 3]
#Filter类的用途在于可用作其他类（如将'SPAM'从序列中过滤掉的SPAMFilter类）的基类（超类）。
s = SPAMFilter()
s.init()
s.filter(['SPAM','SPAM','SPAM','SPAM','beyond','huangjiaju','SPAM'])#结果为：['beyond', 'huangjiaju']
```

请注意SPAMFilter类的定义中有两个要点。

Ⅰ以提供新定义的方式重写了Filter类中方法init的定义

Ⅱ直接从Filter类继承了方法filter的定义，因此无需重新编写其定义

### 深入探讨继承

要确定一个类是否是另一个类的子类，可使用`内置方法issubclass`。

如果你有一个类，并想知道它的基类，可访问其特殊属性`__bases__`。

要确定对象是否是特定类的实例，可使用`isinstance`。

要获悉对象属于哪个类，可使用属性`__class__`，还可使用`type(s)`来获悉其所属的类。

```java
class Filter:
    def init(self):
        self.blocked = []
    def filter(self,sequence):
        return [x for x in sequence if x not in self.blocked]
class SPAMFilter(Filter):#SPAMFilter是Filter的子类
    def init(self):重写超类Filter的方法init
        self.blocked = ['SPAM']
issubclass(SPAMFilter, Filter)#结果为：True
issubclass(Filter, SPAMFilter)#结果为：False
SPAMFilter.__bases__#结果为：(__main__.Filter,)
Filter.__bases__#结果为：(object,)
s = SPAMFilter()
isinstance(s,SPAMFilter)#结果为：True
isinstance(s,Filter)#结果为：True
isinstance(s,str)#结果为：False
s.__class__#结果为：__main__.SPAMFilter
type(s)#结果为：__main__.SPAMFilter
```

### 多个超类

子类TalkingCalculator本身无所作为，其所有的行为都是从超类那里继承的。关键是通过从Calculator那里继承calculate，并从Talker那里继承talk。这被称为多重继承，是一个功能强大的工具。除非万不得已，否则应避免使用多重继承，因为在有些情况下，它可能带来意外的“并发症”。

```java
class Calculator:
    def calulate(self,expression):
        self.value = eval(expression)
class Talker:
    def talk(self):
        print('Hi,my value is',self.value)
class TalkingCalulator(Calculator,Talker):
    pass
yy = TalkingCalulator()
yy.calulate('5+2+1*1314')
yy.talk()#结果为：Hi,my value is 1321
```

**多个超类的超类相同时，查找特定方法或属性时访问超类的顺序称为方法解析顺序（MRO），它使用的算法非常复杂。**

### 接口和内省

接口这一概念与多态相关。处理多态对象时，你只关心其`接口（协议）`——`对外暴露的方法和属性`

检查所需的方法是否存在`hasattr(对象名,方法名)`

检查属性是否是可调用的 `callable(getattr(对象名, '方法名', None))`

getattr（它让我能够指定属性不存在时使用的默认值，这里为None），然后对返回的对象调用callable

`setattr`与`getattr`功能相反，可用于设置对象的属性

要查看对象中存储的所有值，可检查其`__dict__`属性

```java
class Calculator:
    def calulate(self,expression):
        self.value = eval(expression)
class Talker:
    def talk(self):
        print('Hi,my value is',self.value)
class TalkingCalulator(Calculator,Talker):
    pass
yy = TalkingCalulator()
yy.calulate('5+2+1*1314')
yy.talk()#结果为：Hi,my value is 1321
hasattr(yy, 'talk')#结果为：True
hasattr(yy, 'hahaha')#结果为：False
callable(getattr(yy, 'talk', None))#结果为：True
callable(getattr(yy, 'hahah', None))#结果为：False
setattr(yy, 'name', 'huangjiaju')
yy.name#结果为：'huangjiaju'
yy.__dict__#结果为：{'name': 'huangjiaju', 'value': 1321}
```

### 抽象基类

Python几乎都只依赖于鸭子类型，即假设所有对象都能完成其工作，同时偶尔使用hasattr来检查所需的方法是否存在。

很多其他语言（如Java和Go）都采用显式指定接口的理念，而有些第三方模块提供了这种理念的各种实现。

Python通过引入模块`abc`提供了官方解决方案。这个模块为所谓的抽象基类提供了支持。标准库（如模块collections.abc）提供了多个很有用的抽象类，有关模块abc的详细信息。

**抽象类是不能（至少是不应该）实例化的类，其职责是定义子类应实现的一组抽象方法。**

```java
from abc import ABC,abstractmethod
class Talker(ABC):#形如@this的东西被称为装饰器
    @abstractmethod#使用@abstractmethod来将方法标记为抽象的——在子类中必须实现的方法。
    def talk(self):
        pass
'''抽象类（即包含抽象方法的类）最重要的特征是不能实例化'''
Talker()#报错！！！
'''
从它派生出一个子类，由于没有重写方法talk，因此这个类也是抽象的，不能实例化。
现在实例化它没有任何问题。这是抽象基类的主要用途，而且只有在这种情形下使用isinstance才是妥当的：
如果先检查给定的实例确实是Talker对象，就能相信这个实例在需要的情况下有方法talk。
'''
class Knigger(Talker):
    def talk(self):
        print("Ni!")
k = Knigger()
isinstance(k,Talker)#结果为：True
k.talk()#结果为：Ni!
'''
然而，还缺少一个重要的部分——让isinstance的多态程度更高的部分。
来创建另一个类,这个类的实例能够通过是否为Talker对象的检查，可它并不是Talker对象。
可从Talker派生出Herring，但Herring可能是从他人的模块中导入的。
在这种情况下，就无法采取这样的做法。
'''
class Herring:
    def talk(self):
        print("beyond.")
h = Herring()
isinstance(h,Talker)#结果为：False
'''
可将Herring注册为Talker（而不从Herring和Talker派生出子类），
这样所有的Herring对象都将被视为Talker对象。
'''
Talker.register(Herring)#结果为：__main__.Herring
isinstance(h,Talker)#结果为：True
issubclass(Herring,Talker)#结果为：True
#上述做法存在一个缺点，就是直接从抽象类派生提供的保障没有了。
class Clam:
    pass
Talker.register(Clam)#结果为：__main__.Clam
issubclass(Clam,Talker)#结果为：True
c = Clam()
isinstance(c,Talker)#结果为：True
c.talk()#报错！！！
#Clam有成为Talker的意图，相信它能承担Talker的职责，但可悲的是它失败了。
```

## 关于面向对象设计的一些思考

将相关的东西放在一起。如果一个函数操作一个全局变量，最好将它们作为一个类的属性和方法。

不要让对象之间过于亲密。方法应只关心其所属实例的属性，对于其他实例的状态，让它们自己去管理就好了。

慎用继承，尤其是多重继承。继承有时很有用，但在有些情况下可能带来不必要的复杂性。要正确地使用多重继承很难，要排除其中的bug更难。

保持简单。让方法短小紧凑。一般而言，应确保大多数方法都能在30秒内读完并理解。对于其余的方法，尽可能将其篇幅控制在一页或一屏内。

## 小结

概念
解释

对象
对象由属性和方法组成。属性不过是属于对象的变量，而方法是存储在属性中的函数。相比于其他函数，（关联的）方法有一个不同之处，那就是它总是将其所属的对象作为第一个参数，而这个参数通常被命名为self。

类
类表示一组（或一类）对象，而每个对象都属于特定的类。类的主要任务是定义其实例将包含的方法。

多态
多态指的是能够同样地对待不同类型和类的对象，即无需知道对象属于哪个类就可调用其方法。

封装
对象可能隐藏（封装）其内部状态。在有些语言中，这意味着对象的状态（属性）只能通过其方法来访问。在Python中，所有的属性都是公有的，但直接访问对象的状态时程序员应谨慎行事，因为这可能在不经意间导致状态不一致。

继承
一个类可以是一个或多个类的子类，在这种情况下，子类将继承超类的所有方法。你可指定多个超类，通过这样做可组合正交（独立且不相关）的功能。为此，一种常见的做法是使用一个核心超类以及一个或多个混合超类。

接口和内省
一般而言，你无需过于深入地研究对象，而只依赖于多态来调用所需的方法。然而，如果要确定对象包含哪些方法或属性，有一些函数可供你用来完成这种工作。

抽象基类
使用模块abc可创建抽象基类。抽象基类用于指定子类必须提供哪些功能，却不实现这些功能。

面向对象设计
关于该如何进行面向对象设计以及是否该采用面向对象设计，有很多不同的观点。无论你持什么样的观点，都必须深入理解问题，进而创建出易于理解的设计。

## 本章节介绍的新函数

函数
描述

callable(object)
判断对象是否是可调用的（如是否是函数或方法）

getattr(object,name[,default])
获取属性的值，还可提供默认值

hasattr(object, name)
确定对象是否有指定的属性

isinstance(object, class)
确定对象是否是指定类的实例

issubclass(A, B)
确定A是否是B的子类

random.choice(sequence)
从一个非空序列中随机地选择一个元素

setattr(object, name, value)
将对象的指定属性设置为指定的值

type(object)
返回对象的类型
