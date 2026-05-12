# 2、JavaScript 常量和变量
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/2.html
- 分类：前端框架
- 分组：教程目录
常量/字面量/直接量

概念：值不可以被修改的叫做常量

JavaScript中的数据类型：

symbol、number、string、undefine、boolean、bigInt、object、null

**基本数据类型:** 只能存储一个值

数字：number、

字符串：string（’’，" "） 单、双引号必须成对出现 ‘100’,‘null’,‘undefined’

布尔值：boolean（true、false）

**复合/引用数据类型:** array（批量处理大量数据、函数）、object（结构复杂，数据、函数） 存储多个值

**特殊数据类型：null、undefined、NaN（not a number）**

**变量：**

概念：值可以被修改的叫做变量。

计算机组成：磁盘、内存、CPU/GPU（CPU、GPU用于运算）

CPU运算器，会将我们编号的代码运行。CPU在运行程序的时候无法读取我们磁盘中的内容，只能读取我们内存中的内容。

ctrl+s：保存到我们的磁盘不是内存

程序的运行过程：程序保存->磁盘->内存->CPU运行

我们的程序在被CPU执行的时候，是要占用资源的。资源=内存

内存有空间，程序的本质在内存中运行。

编程：合理分配内存

**变量使用：**

**1、** 声明变量（必须声明以后才能使用）var；

关键字：系统被征用有特殊功能的单词

从声明到定义，再到读取过程

```java
var num=10;
alert(num);
```

就拿上面这段程序说:首先用var关键字声明，相当于开辟了一个名为num内存空间，然后num=10，意思就是将10放入到我们刚刚开辟的num内存空间当中。alert（num）就是cpu读取num里面的内容，并展示在页面当中。所以说，我们声明之后内存空间，可以往里面存储数值，也可以将数值重新覆盖

**2、** 初始化：声明变量时直接给变量赋值；

**3、** 如果我们声明变量的时候，没有值赋给这个变量，系统默认是赋值成undefined；

```java
var num；//声明名为num的空间  空间里面存的是undefined
num=10；//先除掉undefined  ,  在赋值10
alert（num）
```

```java
var num=null；//声明名为num的空间  空间里面存的是null。空什么都没有，相当于空着
num=10；//直接将10放进内存
alert（num）
```

所以说在**初始赋值null**的操作的运行效率**高于**比什么都不赋值，让计算机默认为是undefined的。但是今天我们的手机和计算机运行速度也挺快的，可做也可不做。

**变量的命名**

标识符/标识符：用户自定义的名字。变量名也是标识符

命名规则：

**1、** 只能由数字、字母、下划线和$组成；

**2、** 不能以数字开头；

**3、** 不能是保留字和关键字；

保留字：javascript已经征用，但是还未确定功能的单词

**4、** 区分大小写；

**5、** 见名思意（username、age）；

**6、** 单词个数超过两个的；

①驼峰命名法 className

②下划线命名 class_name

**变量弱引用：**

js是弱引用语言：变量数据类型在赋值的时候才能确定

一般不建议随便的改变是数据类型。容易引起歧义。比如

```java
var num='10'把number型，变成了string字符串
var num=10；
num='hello'
```

关键字：typeof

格式：typeof 常量、变量

功能：输出当前常量或者变量的数据类型

typeof 100 => number

typeof ‘hello’ => string

typeof true => boolean

typeof undefined => undefined

typeof typeof 任何数据类型 => string
