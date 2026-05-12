# 09、Python 教程 - 魔法方法、特性和迭代器
- 来源：https://ddkk.com/zhuanlan/other/python/6/9.html
- 分类：Python 基础入门
- 分组：教程目录
## 构造函数

构造函数（constructor），它其实就是初始化方法，只是命名为`__init__`。

构造函数不同于普通方法的地方在于，将在`对象创建后自动调用它们`。

在Python中，创建构造函数很容易，只需将方法init的名称从普通的init改为魔法版__init__即可。

```java
class Beyond:
    def __init__(self):
        self.band = 1999
sq = Beyond()
sq.band#结果为：1999
```

**给构造函数添加几个参数**

```java
class Beyond:
    def __init__(self,value = 1999):
        self.band = value
yy = Beyond("This is a band")
yy.band#结果为：'This is a band'
```

**Python提供了魔法方法__del__，也称作析构函数（destructor）。这个方法在对象被销毁（作为垃圾被收集）前被调用，但鉴于你无法知道准确的调用时间，建议尽可能不要使用__del__。**

### 重写普通方法和特殊的构造函数

每个类都有一个或多个超类，并从它们那里继承行为。

**对类B的实例调用方法（或访问其属性）时，如果找不到该方法（或属性），将在其超类A中查找。**

类A定义了一个名为hello的方法，并被类B继承。

由于类B自己没有定义方法hello，因此对其调用方法hello时，打印的是消息"Hello, I am A."。

```java
class A:
    def hello(self):
        print("Hello,I am A")
class B(A):
    pass
a = A()
b = B()
a.hello()#结果为：Hello,I am A
b.hello()#结果为：Hello,I am A
```

**当然，类B可以重写方法hello**

重写是继承机制的一个重要方面，对构造函数来说尤其重要。

```java
class A:
    def hello(self):
        print("Hello,I am A")
class B(A):
    def hello(self):
        print("Hello,I am B")
b = B()
b.hello()#结果为：Hello,I am B
```

**构造函数用于初始化新建对象的状态，而对大多数子类来说，除超类的初始化代码外，还需要有自己的初始化代码。**

**重写构造函数时，必须调用超类（继承的类）的构造函数，否则可能无法正确地初始化对象。**

**Bird类，定义了所有鸟都具备的一种基本能力：进食。鸟进食后就不再饥饿。**

```java
class Bird:
    def __init__(self):
        self.hungry = True
    def eat(self):#进食
        if self.hungry:
            print('Yes,hungry')
            self.hungry = False#进食完，就不饿了
        else:
            print("No,thanks!")
b = Bird()
b.eat()#结果为：Yes,hungry
b.eat()#结果为：No,thanks!
```

**子类SongBird，它新增了鸣叫功能。**

SongBird是Bird的子类，继承了方法eat，但是一旦调用该方法会报异常：**SongBird没有属性hungry**

```java
class SongBird(Bird):
    def __init__(self):
        self.sound = 'beyond'
    def sing(self):
        print(self.sound)
sb = SongBird()
sb.sing()#结果为：beyond
sb.eat()#报错！！！
'''
AttributeError  Traceback (most recent call last)
<ipython-input-34-05f67b3cf162> in <module>()
----> 1 sb.eat()
<ipython-input-28-ede0d63683b8> in eat(self)
      3         self.hungry = True
      4     def eat(self):
----> 5         if self.hungry:
      6             print('Yes,hungry')
      7             self.hungry = False
AttributeError: 'SongBird' object has no attribute 'hungry'
'''
```

**SongBird中重写了构造函数，但新的构造函数没有包含任何初始化属性hungry的代码。要消除这种错误，SongBird的构造函数必须调用其超类（Bird）的构造函数，以确保基本的初始化得以执行。**

**有两种方法可以解决：调用未关联的超类构造函数，以及使用函数super。**

**下面开始介绍这两种解决方法**

### 调用未关联的超类构造函数

在SongBird类中，只添加了一行，其中包含代码`Bird.__init__(self)`。

通过将这个未关联方法的self参数设置为当前实例，将使用超类的构造函数来初始化SongBird对象。这意味着将设置其属性hungry。

```java
class Bird:
    def __init__(self):
        self.hungry = True
    def eat(self):
        if self.hungry:
            print('Yes,hungry')
            self.hungry = False
        else:
            print("No,thanks!")
class SongBird(Bird):
    def __init__(self):
        Bird.__init__(self)
        self.sound = 'beyond'
    def sing(self):
        print(self.sound)
sb = SongBird()
sb.eat()#结果为：Yes,hungry
sb.eat()#结果为：No,thanks!
```

**对实例调用方法时，方法的参数self将自动关联到实例（称为关联的方法）**

**通过类调用方法（如Bird.init），就没有实例与其相关联，可随便设置参数self，这样的方法称为未关联的。**

### 使用函数 super

调用这个函数时，将当前类和当前实例作为参数。对其返回的对象调用方法时，调用的将是超类（而不是当前类）的方法。

**在SongBird的构造函数中，可不使用Bird，而是使用super(SongBird, self)。**

在Python 3中调用函数super时，可不提供任何参数（通常也应该这样做）。

```java
class Bird:
    def __init__(self):
        self.hungry = True
    def eat(self):
        if self.hungry:
            print('Yes,hungry')
            self.hungry = False
        else:
            print("No,thanks!")
class SongBird(Bird):
    def __init__(self):
        super().__init__(self)
        self.sound = 'beyond'
    def sing(self):
        print(self.sound)
sb = SongBird()
sb.eat()#结果为：Yes,hungry
sb.eat()#结果为：No,thanks!
```

**相比于直接对超类调用未关联方法，使用函数super更直观**

即便有多个超类，也只需调用函数super一次（条件是所有超类的构造函数也使用函数super）。

使用函数super比调用超类的未关联构造函数（或其他方法）要好得多。

函数super返回的到底是什么呢？

通常，你无需关心这个问题，只管假定它返回你所需的超类即可。

实际上，它返回的是一个super对象，这个对象将负责为你执行方法解析。

当你访问它的属性时，它将在所有的超类（以及超类的超类，等等）中查找，直到找到指定的属性或引发AttributeError异常。

## 元素访问

在Python中，**协议**通常指的是**规范行为的规则**

在Python中，多态仅仅基于对象的行为（而不基于祖先，如属于哪个类或其超类等）

其他的语言可能要求对象属于特定的类或实现了特定的接口，而Python通常只要求对象遵循特定的协议。

### 基本的序列和映射协议

序列和映射基本上是元素（item）的集合，要实现它们的基本行为（协议），不可变对象需要实现2个方法，而可变对象需要实现4个。

方法名称
解释

len(self)
这个方法应返回集合包含的项数，对序列来说为元素个数，对映射来说为键-值对数。如果__len__返回零（且没有实现覆盖这种行为的__nonzero__），对象在布尔上下文中将被视为假（就像空的列表、元组、字符串和字典一样）

getitem(self, key)
这个方法应返回与指定键相关联的值。对序列来说，键应该是0~n-1的整数（也可以是负数），其中n为序列的长度。对映射来说，键可以是任何类型。

setitem(self, key, value)
这个方法应以与键相关联的方式存储值，以便以后能够使用__getitem__来获取。当然，仅当对象可变时才需要实现这个方法。

delitem(self, key)
这个方法在对对象的组成部分使用__del__语句时被调用，应删除与key相关联的值。同样，仅当对象可变（且允许其项被删除）时，才需要实现这个方法。

对于这些方法，还有一些额外的要求

对于序列，如果键为负整数，应从末尾往前数。换而言之，x[-n]应与x[len(x)-n]等效。

如果键的类型不合适（如对序列使用字符串键），可能引发TypeError异常。

对于序列，如果索引的类型是正确的，但不在允许的范围内，应引发IndexError异常。

模块**collections**的文档有更复杂的接口和使用的抽象基类（Sequence）

**实现一个算术序列，其中任何两个相邻数字的差都相同。

第一个值是由构造函数的参数start（默认为0）指定的，而相邻值之间的差是由参数step（默认为1）指定的。

允许用户修改某些元素，这是通过将不符合规则的值保存在字典changed中实现的。

如果元素未被修改，就使用公式self.start + key * self.step来计算它的值。**

```java
'''
函数check_index(key)：指定的键是否是可接受的索引？
键必须是非负整数，才是可接受的。如果不是整数，
将引发TypeError异常；如果是负数，将引发Index 
Error异常（因为这个序列的长度是无穷的）
'''
def check_index(key):#索引检查
    if not isinstance(key,int):raise TypeError
    if key < 0 :raise IndexError
class ArithmeticSequence:
#start -序列中的第一个值
#step -两个相邻值的差
#changed -一个字典，包含用户修改后的值
    def __init__(self,start=0,step=1):#初始化这个算术序列
        self.start = start#存储起始值
        self.step = step#存储步长值
        self.changed = {
     }#没有任何元素被修改
    def __getitem__(self,key):#从算术序列中获取一个元素
        check_index(key)
        try:return self.changed[key]#修改过？
        except KeyError:# 如果没有修改过，就计算元素的值
            return self.start + key * self.step
    def __setitem__(self,key,value):#修改算术序列中的元素
        check_index(key)
        self.changed[key] = value#存储修改后的值
s = ArithmeticSequence(1,2)
s[4]#结果为：9
s[4] = 2
s[4]#结果为：2
s[5]#结果为：11
#由于没有实现__del__，故禁止删除元素
del s[4]#报异常！！！
'''
AttributeError  Traceback (most recent call last)
<ipython-input-70-9cf88d1604ce> in <module>()
----> 1 del s[4]
AttributeError: __delitem__
'''
#这个类没有方法__len__，因为其长度是无穷的。
#如果所使用索引的类型非法，将引发TypeError异常；
#如果索引的类型正确，但不在允许的范围内（即为负数），将引发IndexError异常。
s["beyond"]#结果为：报异常！！！
'''
TypeError  Traceback (most recent call last)
<ipython-input-73-f5e041f04983> in <module>()
----> 1 s["beyond"]
<ipython-input-66-2648d9225498> in __getitem__(self, key)
      6 
      7     def __getitem__(self,key):
----> 8         check_index(key)
      9         try:return self.changed[key]
     10         except KeyError:
<ipython-input-55-f34d4d9f3aac> in check_index(key)
      1 def check_index(key):
----> 2     if not isinstance(key,int):raise TypeError
      3     if key < 0 :raise IndexError
TypeError: 
'''
s[-99]#结果为：报异常！！！
'''
IndexError  Traceback (most recent call last)
<ipython-input-74-8aa71bcb4b31> in <module>()
----> 1 s[-99]
<ipython-input-66-2648d9225498> in __getitem__(self, key)
      6 
      7     def __getitem__(self,key):
----> 8         check_index(key)
      9         try:return self.changed[key]
     10         except KeyError:
<ipython-input-55-f34d4d9f3aac> in check_index(key)
      1 def check_index(key):
      2     if not isinstance(key,int):raise TypeError
----> 3     if key < 0 :raise IndexError
IndexError: 
'''
```

### 从 list、dict 和 str 派生

**一个带访问计数器的列表。**

CounterList类深深地依赖于其超类（list）的行为。

CounterList没有重写的方法（如append、extend、index等）都可直接使用。

在两个被重写的方法中，使用super来调用超类的相应方法，并添加了必要的行为：初始化属性counter（在__init__中）和更新属性counter（在__getitem__中）。

重写__getitem__并不能保证一定会捕捉用户的访问操作，因为还有其他访问列表内容的方式，如通过方法pop。

CounterList的行为在大多数方面都类似于列表，但它有一个counter属性（其初始值为0）。

每当你访问列表元素时，这个属性的值都加1。

执行加法运算cl[4] + cl[2]后，counter的值递增两次，变成了2。

```java
class CounterList(list):
    def __init__(self,*args):
        super().__init__(*args)
        self.counter = 0
    def __getitem__(self,index):
        self.counter += 1
        return super(CounterList,self).__getitem__(index)
c1 = CounterList(range(10))
c1#结果为：[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
c1.reverse()
c1#结果为：[9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
del c1[3:6]
c1#结果为：[9, 8, 7, 3, 2, 1, 0]
c1.counter#结果为：0
c1[4] + c1[2]#结果为：9
c1.counter#结果为：2
```

## 特性

**通过存取方法定义的属性通常称为特性（property）** 。

在Python中，实际上有两种创建特定的机制，重点解释较新的那种——函数property，它只能用于新式类。

```java
class Rectangle:
    def __init__(self):
        self.width = 0
        self.height = 0
    def set_size(self,size):
        self.width,self.height = size
    def get_size(self):
        return self.width,self.height
r = Rectangle()
r.width = 10
r.height = 5
r.get_size()#结果为：(10, 5)
r.set_size((150,100))
r.width#结果为：150
```

get_size和set_size是假想属性size的存取方法，这个属性是一个由width和height组成的元组。（可随便将这个属性替换为更有趣的属性，如矩形的面积或其对角线长度。）

### 函数 property

通过调用函数property并将存取方法作为参数（获取方法在前，设置方法在后）创建了一个特性，然后将名称size关联到这个特性。

```java
class Rectangle:
    def __init__(self):
        self.width = 0
        self.height = 0
    def set_size(self,size):
        self.width,self.height = size
    def get_size(self):
        return self.width,self.height
    size = property(get_size,set_size)
r = Rectangle()
r.width = 10
r.height = 5
r.get_size()#结果为：(10, 5)
r.set_size((150,100))
r.width#结果为：150
```

实际上，调用函数property时，还可不指定参数、指定一个参数、指定三个参数或指定四个参数。

如果没有指定任何参数，创建的特性将既不可读也不可写。

如果只指定一个参数（获取方法），创建的特性将是只读的。

第三个参数是可选的，指定用于删除属性的方法（这个方法不接受任何参数）。

第四个参数也是可选的，指定一个文档字符串。

这些参数分别名为`fget`、`fset`、`fdel`和`doc`。

如果你要创建一个只可写且带文档字符串的特性，可使用它们作为关键字参数来实现。

**函数property的工作原理**

property其实并不是函数，而是一个类。

它的实例包含一些魔法方法，而所有的魔法都是由这些方法完成的。

这些魔法方法为`__get__`、`__set__`和`__delete__`，它们一道定义了所谓的描述符协议。

只要对象实现了这些方法中的任何一个，它就是一个描述符。描述符的独特之处在于其**访问方式**。

读取属性（具体来说，是在实例中访问类中定义的属性）时，如果它关联的是一个实现了__get__的对象，将不会返回这个对象，而是调用方法__get__并将其结果返回。

### 静态方法和类方法

静态方法和类方法是这样创建的：将它们分别包装在**staticmethod**和**classmethod**类的对象中。

静态方法的定义中**没有参数self**，可直接通过**类**来调用。

类方法的定义中包含类似于self的参数，通常被命名为**cls**。

对于类方法，也可通过**对象**直接调用，但参数cls将自动关联到类。

```java
class MyClass:
    def smeth():
        print("This is a static method")
    smeth = staticmethod(smeth)
    def cmeth(cls):
        print("This is a class method of ",cls)
    cmeth = classmethod(cmeth)
MyClass.smeth()#结果为：This is a static method
MyClass.cmeth()#结果为：This is a class method of  <class '__main__.MyClass'>
```

在Python 2.4中，引入了一种名为装饰器的新语法，可用于像这样包装方法。（实际上，装饰器可用于包装任何可调用的对象，并且可用于方法和函数。）可指定一个或多个装饰器，为此可在方法（或函数）前面使用运算符@列出这些装饰器（指定了多个装饰器时，应用的顺序与列出的顺序相反）。

装饰器语法也可用于特性，详情请参阅有关**函数property**的文档。

```java
class MyClass:
    @staticmethod
    def smeth():
        print("This is a static method1")
    @classmethod
    def cmeth(cls):
        print("This is a class method of1 ",cls)
MyClass.smeth()#结果为：This is a static method
MyClass.cmeth()#结果为：This is a class method of  <class '__main__.MyClass'>
```

### getattr、__setattr__等方法

方法
解释

__getattribute__(self, name)
在属性被访问时自动调用（只适用于新式类）

__getattr__(self, name)
在属性被访问而对象没有这样的属性时自动调用。

__setattr__(self, name, value)
试图给属性赋值时自动调用。

__delattr__(self, name)
试图删除属性时自动调用。

```java
'''
即便涉及的属性不是size，也将调用方法__setattr__。
因此这个方法必须考虑如下两种情形：如果涉及的属性为size，就执行与以前一样的操作；否则就使用魔法属性__dict__。
__dict__属性是一个字典，其中包含所有的实例属性。
之所以使用它而不是执行常规属性赋值，是因为旨在避免再次调用__setattr__，进而导致无限循环。
仅当没有找到指定的属性时，才会调用方法__getattr__。
这意味着如果指定的名称不是size，这个方法将引发AttributeError异常。
这在要让类能够正确地支持hasattr和getattr等内置函数时很重要。
如果指定的名称为size，就使用前一个实现中的表达式。
'''
class Rectangle:
    def __init__(self):
        self.width = 0
        self.height = 0
    def __setattr__(self,name,value):
        if name == 'size':
            self.width,self.height = value
        else:
            self.__dict__[name] = value
    def __getattr__(self,name):
        if name == 'size':
            return self.width,self.height
        else:
            raise AttributeError()
```

## 迭代器

`__iter__`，它是迭代器协议的基础。

### 迭代器协议

迭代（iterate）意味着重复多次，就像循环那样。

**方法__iter__返回一个迭代器**，它是包含方法__next__的对象，而调用这个方法时可不提供任何参数。

调用方法__next__时，迭代器应**返回其下一个值**。

如果迭代器没有可供返回的值，应引发StopIteration异常。

使用内置的便利函数next，在这种情况下，next(it)与it.**next**()等效。

**斐波那契数列**

```java
class Fibs:
    def __init__(self):
        self.a = 0
        self.b = 1
    def __next__(self):
        self.a , self.b = self.b , self.a + self.b
        return self.a
    def __iter__(self):
        return self
fibs = Fibs()
for f in fibs:
    if f > 1000:
        print(f)#结果为：1597
        break
```

**通过对可迭代对象调用内置函数iter，可获得一个迭代器。**

```java
it = iter([1,2,3])
next(it)#结果为：1
next(it)#结果为：2
next(it)#结果为：3
```

### 从迭代器创建序列

**使用构造函数list显式地将迭代器转换为列表。**

```java
class TestIterator:
    value = 0
    def __next__(self):
        self.value += 1
        if self.value > 10:raise StopIteration
        return self.value
    def __iter__(self):
        return self
ti = TestIterator()
list(ti)#结果为：[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
```

## 生成器

生成器它也被称为简单生成器（simple generator）。

生成器是一种使用普通函数语法定义的迭代器。

### 创建生成器

包含`yield`语句的函数都被称为`生成器`。

生成器不是使用return返回一个值，而是可以生成多个值，每次一个。

每次使用yield生成一个值后，函数都将冻结，即在此停止执行，等待被重新唤醒。

被重新唤醒后，函数将从停止的地方开始继续执行。

```java
def flatten(nested):
    for sublist in nested:
        for element in sublist:
            yield element
nested = [[1,2],[3,4],[5]]
for num in flatten(nested):
    print(num)#结果为：
'''
1
2
3
4
5
'''
list(flatten(nested))#结果为：[1, 2, 3, 4, 5]
```

生成器推导（也叫生成器表达式）。其工作原理与列表推导相同，但不是创建一个列表（即不立即执行循环），而是返回一个生成器，让你能够逐步执行计算。不同于列表推导，这里使用的是圆括号。

```java
g = ((i + 2) ** 2 for i in range(2, 27))
next(g)#结果为：16
```

直接在一对既有的圆括号内（如在函数调用中）使用生成器推导时，无需再添加一对圆括号。

```java
sum(i ** 2 for i in range(10))#结果为：285
```

### 递归式生成器

上述设计的生成器只能处理两层的嵌套列表，这是使用两个for循环来实现的。

如果要处理任意层嵌套的列表，该如何办呢？

该求助于**递归**了。

调用flatten时，有两种可能性（处理递归时都如此）：**基线条件**和**递归条件**。

在基线条件下，要求这个函数展开单个元素（如一个数）。

在这种情况下，for循环将引发TypeError异常（因为你试图迭代一个数），而这个生成器只生成一个元素。

如果要展开的是一个列表（或其他任何可迭代对象）：遍历所有的子列表（其中有些可能并不是列表）并对它们调用flatten，然后使用另一个for循环生成展开后的子列表中的所有元素。

**如果nested是字符串或类似于字符串的对象，它就属于序列，因此不会引发TypeError异常，但并不想对其进行迭代。**

```java
def flatten(nested):
    try:
        for sublist in nested:
            for element in flatten(sublist):
                yield element
    except TypeError:
        yield nested
list(flatten([[[1], 2], 3, 4, [5, [6, 7]], 8]))#结果为：[1, 2, 3, 4, 5, 6, 7, 8]
```

在函数flatten中，不应该对类似于字符串的对象进行迭代，主要原因有两个。

首先，你想将类似于字符串的对象视为原子值，而不是应该展开的序列。

其次，对这样的对象进行迭代会导致无穷递归，因为字符串的第一个元素是一个长度为1的字符串，而长度为1的字符串的第一个元素是字符串本身！

**要处理这种问题，必须在生成器开头进行检查。

要检查对象是否类似于字符串，最简单、最快捷的方式是，尝试将对象与一个字符串拼接起来，并检查这是否会引发TypeError异常。**

如果表达式nested + ''引发了TypeError异常，就忽略这种异常；

如果没有引发TypeError异常，内部try语句中的else子句将引发TypeError异常，这样将在外部的excpet子句中原封不动地生成类似于字符串的对象。

```java
def flatten(nested):
    try:# 不迭代类似于字符串的对象：
        try:nested + ''
        except TypeError:pass
        else:raise TypeError
        for sublist in nested:
            for element in flatten(sublist):
                yield element
    except TypeError:
        yield nested
list(flatten(['foo', ['bar', ['baz']]]))#['foo', 'bar', 'baz']
```

这里没有执行类型检查：没有检查nested是否是字符串，而**只是检查其行为是否类似于字符串，即能否与字符串拼接**。

### 通用生成器

生成器是包含关键字yield的函数，但被调用时不会执行函数体内的代码，而是返回一个迭代器。

每次请求值时，都将执行生成器的代码，直到遇到yield或return。yield意味着应生成一个值，而return意味着生成器应停止执行（即不再生成值；仅当在生成器调用return时，才能不提供任何参数）。

换而言之，`生成器由两个单独的部分组成：生成器的函数和生成器的迭代器。`

生成器的函数是由def语句定义的，其中包含yield。生成器的迭代器是这个函数返回的结果。

用不太准确的话说，这两个实体通常被视为一个，通称为**生成器**。

```java
def simple_generator():
    yield i
simple_generator#结果为：<function __main__.simple_generator>
simple_generator()#结果为：<generator object simple_generator at 0x000001C5C9CF2B48>
```

### 生成器的方法

在生成器开始运行后，可使用生成器和外部之间的通信渠道向它提供值。这个通信渠道包含如下两个端点。

端点名称
解释

外部世界
外部世界可访问生成器的方法send，这个方法类似于next，但接受一个参数（要发送的“消息”，可以是任何对象）。

生成器
在挂起的生成器内部，yield可能用作表达式而不是语句。换而言之，当生成器重新运行时，yield返回一个值——通过send从外部世界发送的值。如果使用的是next，yield将返回None。

**仅当生成器被挂起（即遇到第一个yield）后，使用send（而不是next）才有意义。**

```java
def repeater(value):
    while True:
        new = (yield value)
        if new is not None:
            value = new
r = repeater(1999)
next(r)#结果为：1999
r.send("Hello,beyond band!")#结果为：'Hello,beyond band!'
```

生成器还包含另外两个方法。

方法
解释

throw
用于在生成器中（yield表达式处）引发异常，调用时可提供一个异常类型、一个可选值和一个traceback对象。

close
用于停止生成器，调用时无需提供任何参数。

### 模拟生成器

**使用普通函数重写生成器flatten：**

```java
def flatten(nested): 
    result = [] 
    try: 不迭代类似于字符串的对象：
        try: nested + '' 
        except TypeError: pass 
        else: raise TypeError 
        for sublist in nested: 
            for element in flatten(sublist): 
                result.append(element) 
    except TypeError: 
        result.append(nested) 
    return result
```

## 八皇后问题

### 生成器的回溯

`回溯`的简单理解：

**你要去参加一个很重要的会议。你不知道会议在哪里召开，但前面有两扇门，而会议室就在其中一扇门的后面。你选择进入左边那扇门后，又看到两扇门。你再次选择进入左边那扇门，但发现走错了。因此你往回走，并进入右边那扇门，但发现也走错了。因此你继续往回走到起点，现在可以尝试进入右边那扇门。**

### 问题

**将8个皇后放在棋盘上，条件是任何一个皇后都不能威胁其他皇后，即任何两个皇后都不能吃掉对方。任意两个皇后都不能处于同一行、同一列或同一斜线上（八个方向）。** 怎样才能做到这一点呢？应将这些皇后放在什么地方呢？

这是一个典型的回溯问题：**在棋盘的第一行尝试为第一个皇后选择一个位置，再在第二行尝试为第二个皇后选择一个位置，依次类推。在发现无法为一个皇后选择合适的位置后，回溯到前一个皇后，并尝试为它选择另一个位置。最后，要么尝试完所有的可能性，要么找到了答案。**

### 状态表示

可简单地使用元组（或列表）来表示可能的解（或其一部分），其中每个元素表示相应行中皇后所在的位置（即列）。

如果state[0] == 3，就说明第1行的皇后放在第4列（从0开始计数）

完全可以使用列表（而不是元组）来表示状态，如果序列较小且是静态的，使用元组可能是不错的选择。

### 检测冲突

定义冲突：

函数conflict接受（用状态元组表示的）既有皇后的位置，并确定下一个皇后的位置是否会导致冲突。

参数nextX表示下一个皇后的水平位置（x坐标，即列），而nextY为下一个皇后的垂直位置（y坐标，即行）。

这个函数对既有的每个皇后执行简单的检查：

如果下一个皇后与当前皇后的x坐标相同或在同一条对角线上，将发生冲突，因此返回True；

如果没有发生冲突，就返回False。

`abs(state[i] - nextX) in (0, nextY - i)`如果下一个皇后和当前皇后的水平距离为0（在同一列）或与它们的垂直距离相等（位于一条对角线上），这个表达式就为真；否则为假。

```java
def conflict(state, nextX):
    nextY = len(state)
    for i in range(nextY):
        if abs(state[i] - nextX) in (0, nextY - i):
            return True
    return False
```

### 基线条件

如果只剩下最后一个皇后没有放好，就遍历所有可能的位置，并返回那些不会引发冲突的位置。参数num为皇后总数，而参数state是一个元组，包含已放好的皇后的位置。

```java
def queens(num, state):
    if len(state) == num-1:
        for pos in range(num):
            if not conflict(state, pos):
                 yield pos
#假设总共有4个皇后，而前3个皇后的位置分别为1、3和0，故还有位置2可以放置
list(queens(4, (1, 3, 0)))#结果为：[2]
```

### 递归条件

理想状态：**递归调用返回当前行下面所有皇后的位置**

对于递归调用，向它提供的是由当前行上面的皇后位置组成的元组。

```java
def queens(num=8, state=()):
    for pos in range(num):
         if not conflict(state, pos):
            if len(state) == num-1:
                 yield(pos,)
            else:
                for result in queens(num,state + (pos,)):
                    yield(pos,) + result
list(queens(3))#结果为：[]
list(queens(4))#结果为：[(1, 3, 0, 2), (2, 0, 3, 1)]
for solution in queens(8):
    print(solution )#结果为：
'''
(0, 4, 7, 5, 2, 6, 1, 3)
(0, 5, 7, 2, 6, 3, 1, 4)
(0, 6, 3, 5, 7, 1, 4, 2)
(0, 6, 4, 7, 1, 3, 5, 2)
(1, 3, 5, 7, 2, 0, 6, 4)
(1, 4, 6, 0, 2, 7, 5, 3)
(1, 4, 6, 3, 0, 7, 5, 2)
(1, 5, 0, 6, 3, 7, 2, 4)
(1, 5, 7, 2, 0, 3, 6, 4)
(1, 6, 2, 5, 7, 4, 0, 3)
(1, 6, 4, 7, 0, 3, 5, 2)
(1, 7, 5, 0, 2, 4, 6, 3)
(2, 0, 6, 4, 7, 1, 3, 5)
(2, 4, 1, 7, 0, 6, 3, 5)
(2, 4, 1, 7, 5, 3, 6, 0)
(2, 4, 6, 0, 3, 1, 7, 5)
(2, 4, 7, 3, 0, 6, 1, 5)
(2, 5, 1, 4, 7, 0, 6, 3)
(2, 5, 1, 6, 0, 3, 7, 4)
(2, 5, 1, 6, 4, 0, 7, 3)
(2, 5, 3, 0, 7, 4, 6, 1)
(2, 5, 3, 1, 7, 4, 6, 0)
(2, 5, 7, 0, 3, 6, 4, 1)
(2, 5, 7, 0, 4, 6, 1, 3)
(2, 5, 7, 1, 3, 0, 6, 4)
(2, 6, 1, 7, 4, 0, 3, 5)
(2, 6, 1, 7, 5, 3, 0, 4)
(2, 7, 3, 6, 0, 5, 1, 4)
(3, 0, 4, 7, 1, 6, 2, 5)
(3, 0, 4, 7, 5, 2, 6, 1)
(3, 1, 4, 7, 5, 0, 2, 6)
(3, 1, 6, 2, 5, 7, 0, 4)
(3, 1, 6, 2, 5, 7, 4, 0)
(3, 1, 6, 4, 0, 7, 5, 2)
(3, 1, 7, 4, 6, 0, 2, 5)
(3, 1, 7, 5, 0, 2, 4, 6)
(3, 5, 0, 4, 1, 7, 2, 6)
(3, 5, 7, 1, 6, 0, 2, 4)
(3, 5, 7, 2, 0, 6, 4, 1)
(3, 6, 0, 7, 4, 1, 5, 2)
(3, 6, 2, 7, 1, 4, 0, 5)
(3, 6, 4, 1, 5, 0, 2, 7)
(3, 6, 4, 2, 0, 5, 7, 1)
(3, 7, 0, 2, 5, 1, 6, 4)
(3, 7, 0, 4, 6, 1, 5, 2)
(3, 7, 4, 2, 0, 6, 1, 5)
(4, 0, 3, 5, 7, 1, 6, 2)
(4, 0, 7, 3, 1, 6, 2, 5)
(4, 0, 7, 5, 2, 6, 1, 3)
(4, 1, 3, 5, 7, 2, 0, 6)
(4, 1, 3, 6, 2, 7, 5, 0)
(4, 1, 5, 0, 6, 3, 7, 2)
(4, 1, 7, 0, 3, 6, 2, 5)
(4, 2, 0, 5, 7, 1, 3, 6)
(4, 2, 0, 6, 1, 7, 5, 3)
(4, 2, 7, 3, 6, 0, 5, 1)
(4, 6, 0, 2, 7, 5, 3, 1)
(4, 6, 0, 3, 1, 7, 5, 2)
(4, 6, 1, 3, 7, 0, 2, 5)
(4, 6, 1, 5, 2, 0, 3, 7)
(4, 6, 1, 5, 2, 0, 7, 3)
(4, 6, 3, 0, 2, 7, 5, 1)
(4, 7, 3, 0, 2, 5, 1, 6)
(4, 7, 3, 0, 6, 1, 5, 2)
(5, 0, 4, 1, 7, 2, 6, 3)
(5, 1, 6, 0, 2, 4, 7, 3)
(5, 1, 6, 0, 3, 7, 4, 2)
(5, 2, 0, 6, 4, 7, 1, 3)
(5, 2, 0, 7, 3, 1, 6, 4)
(5, 2, 0, 7, 4, 1, 3, 6)
(5, 2, 4, 6, 0, 3, 1, 7)
(5, 2, 4, 7, 0, 3, 1, 6)
(5, 2, 6, 1, 3, 7, 0, 4)
(5, 2, 6, 1, 7, 4, 0, 3)
(5, 2, 6, 3, 0, 7, 1, 4)
(5, 3, 0, 4, 7, 1, 6, 2)
(5, 3, 1, 7, 4, 6, 0, 2)
(5, 3, 6, 0, 2, 4, 1, 7)
(5, 3, 6, 0, 7, 1, 4, 2)
(5, 7, 1, 3, 0, 6, 4, 2)
(6, 0, 2, 7, 5, 3, 1, 4)
(6, 1, 3, 0, 7, 4, 2, 5)
(6, 1, 5, 2, 0, 3, 7, 4)
(6, 2, 0, 5, 7, 4, 1, 3)
(6, 2, 7, 1, 4, 0, 5, 3)
(6, 3, 1, 4, 7, 0, 2, 5)
(6, 3, 1, 7, 5, 0, 2, 4)
(6, 4, 2, 0, 5, 7, 1, 3)
(7, 1, 3, 0, 6, 4, 2, 5)
(7, 1, 4, 2, 0, 6, 3, 5)
(7, 2, 0, 5, 1, 4, 6, 3)
(7, 3, 0, 2, 5, 1, 6, 4)
'''
len(list(queens(8)))#结果为：92
```

### 扫尾工作

有可能在其他地方都用不到它，故在prettyprint中创建了一个简单的辅助函数。

```java
def prettyprint(solution):
    def line(pos, length=len(solution)):
        return '. ' * (pos) + 'X ' + '. ' * (length-pos-1)
    for pos in solution:
        print(line(pos))
import random
prettyprint(random.choice(list(queens(8))))#结果为：
'''
. X . . . . . . 
. . . . . . X . 
. . X . . . . . 
. . . . . X . . 
. . . . . . . X 
. . . . X . . . 
X . . . . . . . 
. . . X . . . . 
'''
```

## 小结

概念
解释

新式类和旧式类
Python类的工作方式在不断变化。较新的Python 2版本有两种类，其中旧式类正在快速退出舞台。新式类是Python 2.2引入的，提供了一些额外的功能，如支持旧式类正在快速退出舞台。新式类是Python 2.2引入的，提供了一些额外的功能，如支持或设置__metaclass__。

魔法方法
Python中有很多特殊方法，其名称以两个下划线开头和结尾。这些方法的功能Python中有很多特殊方法，其名称以两个下划线开头和结尾。这些方法的功能

构造函数
很多面向对象语言中都有构造函数，对于你自己编写的每个类，都可能需要很多面向对象语言中都有构造函数，对于你自己编写的每个类，都可能需要

重写
类可重写其超类中定义的方法（以及其他任何属性），为此只需实现这些方法即可。要调用被重写的版本，可直接通过超类调用未关联版本（旧式类），也可使用函数super来调用（新式类）。

序列和映射
要创建自定义的序列或映射，必须实现序列和映射协议指定的所有方法，其中包括__getitem__和__setitem__等魔法方法。通过从list（或UserList）和dict（或UserDict）派生，可减少很多工作量。

迭代器
简单地说，迭代器是包含方法__next__的对象，可用于迭代一组值。没有更多的值可供迭代时，方法__next__应引发StopIteration异常。可迭代对象包含方法__iter__，它返回一个像序列一样可用于for循环中的迭代器。通常，迭代器也是可迭代的，即包含返回迭代器本身的方法__iter__。

生成器
生成器的函数是包含关键字yield的函数，它在被调用时返回一个生成器，即一种特殊的迭代器。要与活动的生成器交互，可使用方法send、throw和close。

八皇后问题
八皇后问题是个著名的计算机科学问题，使用生成器可轻松地解决它。这个问题要求在棋盘上放置8个皇后，并确保任何两个皇后都不能相互攻击（一个皇后的八个方向都不能有另一个皇后的存在）。

## 本章介绍的新函数

函数
描述

iter(obj)
从可迭代对象创建一个迭代器

next(it)
让迭代器前进一步并返回下一个元素

property(fget, fset, fdel, doc)
返回一个特性；所有参数都是可选的

super(class, obj)
返回一个超类的关联实例
