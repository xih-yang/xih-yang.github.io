# 16、JVM 实战 - Class字节码结构
- 来源：https://ddkk.com/zhuanlan/java/jvm/3/16.html
- 分类：JVM 实战
- 分组：教程目录
## 1. 相关概念

### 1.1字节码文件的跨平台性

**1、****Java语言是跨平台的(writeonce,runanywhere)**；

当 Java 源代码成功编译成字节码后，如果想在不同的平台上面运行， 则无须再次编译

但是 这个优势不再那么吸引人了。Python、PHP、Perl、Ruby、Lisp 等有强 大的解释器 ,跨平台似乎已经快称为一门语言必选的特性

**2、****Java虚拟机：跨语言的平台**；

Java 虚拟机不和包括 Java 在内的任何语言绑定，它只与"Class 文件"这 种特定的二进制文件格式所关联。无论使用何种语言进行软件开发， 只要能 将源文件编译为正确的 Class 文件，那么这种语言就可以在 Java 虚拟机上执行，可以说，统一而强大的 Class 文件结构，就是 Java 虚拟机的基石、桥梁。

> JVM的特性

所有的JVM 全部遵守 Java 虚拟 机规范，也就是说所有的 JVM 环境都是一样的， 这样一来字节码文件可以在 各种 JVM 上进行。JVM官方文档规范：[https://docs.oracle.com/javase/specs/index.html](https://docs.oracle.com/javase/specs/index.html)

想要让一个 Java 程序正确地运行在 JVM 中，Java 源码就是必须要被编译 为符合 JVM 规范的字节码 ,所以在把java文件转换为 JVM可以识别的Class文件,需要编译器的完成,也就是javac, 称为前端编译器

前端编译器的主要任务就是负责将符合 Java 语法规范的 Java 代码转换为 符合 JVM 规范的字节码文件

javac 是一种能够将 Java 源码编译为字节码的前端编译器

javac 编译器在将 Java 源码编译为一个有效的字节码文件过程中经历了 4 个步骤，分别是词法分析、语法分析、语义分析以及生成字节码。

**Oracle 的 JDK 软件包括两部分内容(对应上图)：**

一部分是将 Java 源代码编译成 Java 虚拟机的指令集的编译器

另一部分是用于实现 Java 虚拟机的运行时环境

### 1.2 前端编译器

前面说到,java 语言要想在JVM 中运行,需要将 java文件编译为class字节码文件,官方给我们提供的为

`JAVA_HOME` 的bin目录下的javac.

但是HotSpot VM 并没有强制要求前端编译器只能使用 javac 来编译字节码，其实只要编译结果符合 JVM 规范都可以被 JVM 所识别即可。在 Java 的前端编译器领域，除了 javac 之外，还有一种被大家经常用到的前端编译器，那就是内 置在 Eclipse 中的 ECJ (Eclipse Compiler for Java)编译器。和 javac 的全量式编 译不同，ECJ 是一种增量式编译器。

**以下是从java文件到被jvm执行的概念图:**

> 常用IDE自带的编译器

**1、** 在Eclipse中，当开发人员编写完代码后，使用"Ctrl+S"快捷键时，ECJ编译器所采取的编译方案是把未编译部分的源码逐行进行编译，而非每次都全量编译因此ECJ的编译效率会比javac更加迅速和高效，当然编译质量和javac相比大致还是一样的；

**2、** ECJ不仅是Eclipse的默认内置前端编译器，在Tomcat中同样也是使用ECJ编译器来编译jsp文件由于ECJ编译器是采用GPLv2的开源协议进行源代码公开，所以，大家可以登录Eclipse官网下载ECJ编译器的源码进行二次开发；

**3、** 默认情况下，IntelliJIDEA使用javac编译器（还可以自己设置为AspectJ编译器ajc）；

**前端编译器并不会过多的直接涉及编译优化等方面的技术，而是将这些具体优化细节移 交给 HotSpot 的 JIT 编译器负责**

### 1.3 举例说明查看字节码的作用

看的懂字节码文件,对我们了解一些java 语言执行的细节有非常大的帮助,下面将举几个常见的面试题说明

> int类型的自动拆装箱

```java
public class IntegerTest {
    public static void main(String[] args) {
        Integer x = 5;
        int y = 5;
        System.out.println(x == y); //true
        Integer i1 = 10;
        Integer i2 = 10;
        System.out.println(i1 == i2);//true
        Integer i3 = 128;
        Integer i4 = 128;
        System.out.println(i3 == i4);//false
    }
}
```

上面的代码中,将依次打印 true ,true ,false,这是为什么呢,通过字节码文件指令可以非常清楚的了解

下面是通过javap解析出的main方法的字节码指令

```java
 0 iconst_5 //生成一个5 放入操作数栈
 1 invokestatic2 <java/lang/Integer.valueOf> //使用5调用Integer的valueOf方法,构建Integer 对象(自动装箱)
 4 astore_1 // 放到局部变量表索引为1的位置
 5 iconst_5 //再生成一个5 
 6 istore_2 //放到局部变量表索引为 2 的地方
 7 getstatic3 <java/lang/System.out> // 打印
10 aload_1
11 invokevirtual4 <java/lang/Integer.intValue> //调用 变量为x 的intValue方法,返回基本类型int
14 iload_2
15 if_icmpne 22 (+7)
18 iconst_1
19 goto 23 (+4)
22 iconst_0
23 invokevirtual5 <java/io/PrintStream.println>
26 bipush 10
28 invokestatic2 <java/lang/Integer.valueOf>
31 astore_3
32 bipush 10
34 invokestatic2 <java/lang/Integer.valueOf>
37 astore 4
39 getstatic3 <java/lang/System.out>
42 aload_3
43 aload 4
45 if_acmpne 52 (+7)
48 iconst_1
49 goto 53 (+4)
52 iconst_0
53 invokevirtual5 <java/io/PrintStream.println>
56 sipush 128
59 invokestatic2 <java/lang/Integer.valueOf>
62 astore 5
64 sipush 128
67 invokestatic2 <java/lang/Integer.valueOf>
70 astore 6
72 getstatic3 <java/lang/System.out>
75 aload 5
77 aload 6
79 if_acmpne 86 (+7)
82 iconst_1
83 goto 87 (+4)
86 iconst_0
87 invokevirtual5 <java/io/PrintStream.println>
90 return
```

- 通过上面的字节码指令,可以看出,java的自动拆装箱功能, 也非常直观的了解到第一个打印输出问题的答案,因为最后都是通过 基本类型比较,所以打印为 true
- 第二个打印输出,比较的是两个对象的地址值,按道理应该为false,那为什么打印true呢,可以查看 在自动装箱调用的 valueOf 方法的源码得知

```java
public static Integer valueOf(int var0) {
    return var0 >= -128 && var0 <= Integer.IntegerCache.high ? Integer.IntegerCache.cache[var0 + 128] : new Integer(var0);
}
```

在Integer底层维护了一个缓存,当数字 在-128 到 +127 之间时,将取用缓存中的数据, 所以自动装箱时的返回的都是同一个对象

- 第三个打印输出的对象都已经超过了这个缓存,各自new的Integer对象,所以为 false

## 2. 如何查看字节码文件

源代码经过编译器编译之后便会生成一个字节码文件，字节码是一种二进制的类 文件，它的内容是 JVM 的指令，而不像 C、C++ 经由编译器直接生成机器码

Java 虚拟机的指令由一个字节长度的、代表着某种特定操作含义的**操作码 (opcode)以及跟随其后的零至多个代表此操作所需参数的操作数(operand)**所构 成。虚拟机中许多指令并不包含操作数，只有一个操作码

比如:

那么我们如何解读供虚拟机解释执行的二进制字节码？

**方式一:** 最简单粗暴的方式, 直接将class文件以二进制的形式打开:一个字符一个字符看

需要使用 Notepad++ 的 HEX-Editor插件或者使用 Binary Viewer 客户端工具 查看

**方式二:** 上面实例中使用的方式, 使用jdk自带的 javap 指令,是排版好的 指令

**方式三:** 使用IDEA 插件, jclasslib 或者 jclasslib的 客户端工具, 更加人性化,显示的信息已经总结归纳

## 3. Class 文件结构

官方文档: [https://docs.oracle.com/javase/specs/jvms/se8/html/jvms-4.html](https://docs.oracle.com/javase/specs/jvms/se8/html/jvms-4.html)

### 3.1 Class文件的本质

**任何一个 Class 文件都对应着唯一一个类或接口的定义信息**，但是Class 文件实际上它并不一定以磁盘文件形式存在,也有可能从网络中获取。所以Class 文件是一组以 8 位字 节为基础单位的二进制流

**Class 文件格式 :**

Class 的结构不像 XML 等描述语言，由于它没有任何分隔符号。所以在其中的数据项，无论是字节顺序还是数量，都是被严格限定的，哪个字节代表什么 含义，长度是多少，先后顺序如何，都不允许改变

Class 文件格式采用一种类似于 C 语言结构体的方式进行数据存储，这种结构中只有两种数据类型：无符号数和表

- 无符号数属于基本的数据类型，**用来描述基本数据类型** , 以 u1、u2、u4、u8 来分别代表 1 个字节、 2 个字节、4 个字节、8 个字节的无符号数，无符号数可以用来描述数字、索引引用本身、数量值或者按照 UTF-8 编码构成字符串值
- 表是由多个无符号数或者其他表作为数据项构成的复合数据类型，**用来描述符合数据类型**, 所有表都习惯性地以"_info"结尾。表用于描述有层次关系的复合结构的数据，**整个 Class 文件本质上就是一张表**。由于表没有固定长度，所以通常会在其前面加上个数说明

举例:

```java
public class Demo {
    private int num = 1;
    public int add(){
        num = num + 2;
        return num;
    }
}
```

对应的二进制文件,以下也就是这个类,这个class文件的本体:

**换句话说,如果充分了解上面每个字符的含义,也就可以反编译为源代码**

### 3.2 Class 文件的结构划分

Class 文件的结构并不是一成不变的，随着 Java 虚拟机的不断发展，总是不可 避免地会对 Class 文件结构做出一些调整，但是其基本结构和框架是非常稳定的

下面这个是官网对字节码文件内部的划分的结构:

```java
ClassFile {
    u4             magic;
    u2             minor_version;
    u2             major_version;
    u2             constant_pool_count;
    cp_info        constant_pool[constant_pool_count-1];
    u2             access_flags;
    u2             this_class;
    u2             super_class;
    u2             interfaces_count;
    u2             interfaces[interfaces_count];
    u2             fields_count;
    field_info     fields[fields_count];
    u2             methods_count;
    method_info    methods[methods_count];
    u2             attributes_count;
    attribute_info attributes[attributes_count];
}
```

**对应的含义:**

类型
名称
说明
长度
数量

u4
magic
魔数,识别Class文件格式
4个字节
1

u2
minor_version
副版本号(小版本)
2个字节
1

u2
major_version
主版本号(大版本)
2个字节
1

u2
constant_pool_count
常量池计数器(常量池长度)
2个字节
1

cp_info
constant_pool
常量池表(长度不固定所以为表,_info结尾)
n个字节
constant_pool_count-1

u2
access_flags
访问标识
2个字节
1

u2
this_class
类索引
2个字节
1

u2
super_class
父类索引
2个字节
1

u2
interfaces_count
接口计数器(长度,一个类可以有多个接口,所以也是不固定的)
2个字节
1

u2
interfaces[interfaces_count]
接口索引集合
2个字节
interfaces_count

u2
fields_count
字段计数器
2个字节
1

field_info
fields
字段表
n个字节
fields_count

u2
methods_count
方法计数器
2个字节
1

method_info
methods
方法表
n个字节
methods_count

u2
attributes_count
属性计数器
2个字节
1

attribute_info
attributes
属性表
n个字节
attributes_count

**总体来说,可以分成如下几个大类:**

- 魔数
- Class 文件版本
- 常量池
- 访问标志
- 类索引、父类索引、接口索引集合
- 字段表集合
- 方法表集合
- 属性表集合

## 4. 解析二进制Class文件

首先我们看一下最原始的二进制文件 和 上述介绍中各个结构中的对应,

**以上一小节中的字节码为例,以颜色区分每个区域**

### 4.1 Magic Number(魔数)

**1、** 每个Class文件开头的4个字节的无符号整数称为魔数(MagicNumber)；

**2、** 它的唯一作用是确定这个文件是否为一个能被虚拟机接受的有效合法的Class文件即：魔数是Class文件的标识符；

**3、** 魔数值固定为0xCAFEBABE不会改变；

**4、** 如果一个Class文件不以0xCAFEBABE开头，虚拟机在进行文件校验的时候就会直接抛出以下错误：；

```java
Error: A JNI error has occurred, please check your installation and try again
Exception in thread "main" java.lang.ClassFormatError: Incompatible magic value
1885430635 in class file StringTest
```

字节码中对应的位置:

### 4.2 Class文件的版本

**1、** 紧接着魔数的4个字节存储的是Class文件的版本号同样也是4个字节第5个和第6个字节所代表的含义就是编译的副版本号minor_version，而第7个和第8个字节就是编译的主版本号major_version；

**2、** 它们共同构成了Class文件的格式版本号譬如某个Class文件的主版本号为M，服版本号为m，那么这个Class文件的格式版本号就确定为M.m；

**字节码中对应的位置:**

根据图示, 可以看出,此class 文件的主版本为 34(十六进制), 副版本为 0,

主副版本组合即可表示主 JDK编译器的版本,对照如下:

主版本（十进制）
副版本（十进制）
编译器版本

45
3
1.1

46
0
1.2

47
0
1.3

48
0
1.4

49
0
1.5

50
0
1.6

51
0
1.7

52
0
1.8

53
0
1.9

54
0
1.10

55
0
1.11

那么我的主版本为对应的十进制为52, 根据对照表,可以看出我的编译器版本为 1.8,即为JDK8

**注意事项:**

**1、** Java的版本号是从45开始的，JDK1.1之后的每个JDK大版本发布主版本号向上加1；

**2、** 不同版本的Java编译器编译的Class文件对应的版本是不一样的目前，高版本的Java虚拟机可以执行由低版本编译器生成的Class文件，但是低版本的Java虚拟机不能执行由高版本编译器生成的Class文件否则JVM会抛出`java.lang.UnsupportedClassVersionError`异常(**向下兼容**)；

**3、** 在实际应用中，由于开发环境和生产环境的不同，可能会导致该问题的发生因此，需要我们在开发时，特别注意开发编译的JDK版本和生产环境的JDK版本是否一致；

### 4.3 常量池

在版本号之后，紧跟着的是常量池的数量，以及若干个常量池表项

常量池是 Class 文件中内容最为丰富的区域之一(仓库)。常量池对于 Class 文件中 的字段和方法解析也有着至关重要的作用

随着Java 虚拟机的不断发展，常量池的内容也日渐丰富，**可以说，常量池 是整个 Class 文件的基石**

**常量池中常量的数量是不固定的，所以在常量池的入口需要放置一项 u2 类 型的无符号数，代表常量池容量计数值(constant_pool_count)，与 Java 中语 言习惯不一样的是，这个容量计数是从 1 而不是 0 开始的**

由上表可见，Class 文件使用了一个前置的容量计数器(constant_pool_count)加若 干个连续的数据项(constant_pool)的形式来描述常量池内容，我们把这一系列连 续常量池数据称为常量池集合

- 常量池表项中，用于存放编译时期生成的各种字面量和符号引用，**这部分内 容将在类加载后进入方法区的运行时常量池中存放**

> 常量池计数器

由于常量池的数量不固定，时长时短，所以需要放置两个字节来表示常量池 容量计数值

常量池容量计数值(u2 类型)：从 1 开始，表示常量池中有多少项常量。即 constant_pool_count = 1 表示常量池中有 0 个常量项 ,这是为什么呢:

**因为常量池数组是从1开始的, 它把第 0 项常量空出来了。这是为了满足后面某些指向常量池的索引值的数据在 特定情况下需要表达"不引用任何一个常量池项目"的含义，这种情况可用索引值 0 来表示**

**字节码中的位置:**

长度为16进制的16,即十进制的22, 即代表 常量池中的项目为21个

> 常量池表

constant_pool 是一种表结构，以 1 ~ constant_pool_count - 1 为索引。表明了 后面有多少个常量项

常量池 主 要 存 放 两 大 类 常 量 ： 字面量 (Literal) 和 符 号 引 用 (Symbolic References)

它包含了 Class 文件结构及其子结构中引用的所有**字符串常量、类或接口 名、字段名和其他常量。**

常量池中的每一项都具备相同的特征。第 1 个字节 作为类型标记，用于确定该项的格式，这个字节称为 tag byte(标记字节、标 签字节)

**每个标记对应的类型:**

类型
标志(或标识)
描述

CONSTANT_utf8_info
1
UTF-8编码的字符串

CONSTANT_Integer_info
3
整型字面量

CONSTANT_Float_info
4
浮点型字面量

CONSTANT_Long_info
5
长整型字面量

CONSTANT_Double_info
6
双精度浮点型字面量

CONSTANT_Class_info
7
类或接口的符号引用

CONSTANT_String_info
8
字符串类型字面量

CONSTANT_Fieldref_info
9
字段的符号引用

CONSTANT_Methodref_info
10
类中方法的符号引用

CONSTANT_InterfaceMethodref_info
11
接口中方法的符号引用

CONSTANT_NameAndType_info
12
字段或方法的符号引用

CONSTANT_MethodHandle_info
15
表示方法句柄

CONSTANT_MethodType_info
16
标志方法类型

CONSTANT_InvokeDynamic_info
18
表示一个动态方法调用点

**上面说到, 常量池中主要存放的就是各种 字面量和符号引用, 那么什么是字面量和符号引用呢?**

**字面量:**

- 文本字符串: String str = "Hello";
- 声明为final 的常量值 : final int i = 10;

**符号引用:**

- 类和接口的全限定名
- 字段的名称和描述符
- 方法的名称和描述符

**全限定名**:`com/atguigu/test/Demo;`这个就是类的全限定名，仅仅是把包的"."替换成"/"， 为了使连续的多个全限定名之间不产生混淆，在使用时最后一般会加入一个";" 表示全限定名结束

**简单的名称:**简单名称是指没有类型和参数修饰的方法或者字段名称，上面例子中的类的 add() 方法和 num 字段的简单名称分别是 add 和 num

**描述符 :**描述符的作用是用来描述字段的数据类型、方法的参数列表(包括数量、类 型以及顺序)和返回值。根据描述符规则，基本数据类型(byte、char、double、 float、int、long、short、boolean)以及代表无返回值的 void 类型都用一个大写字 符来表示，而对象类型则用字符 L 加对象的全限定名表示，详见下表：

标志符
含义

B
基本数据类型byte

C
基本数据类型char

D
基本数据类型double

F
基本数据类型float

I
基本数据类型int

J
基本数据类型long

S
基本数据类型short

Z
基本数据类型boolean

V
代表void类型

L
对象类型，比如：Ljava/lang/Object;

[
数组类型，代表一维数组。比如：double[][][] is [[[D

用描述符来描述方法时，按照先参数列表，后返回值的顺序描述，参数列表 按照参数的严格顺序放在一组小括号"()"之内，如方法 java.lang.String toString() 的描述符为`() Ljava/lang/String;`，方法 int abc(int[] x ,int y)描述符为`([II) I`.

**补充说明:**

虚拟机在加载 Class 文件时才会进行动态链接，也就是说，Class 文件中不会保存各个方法和字段的最终内存布局信息(也不可能保存到)，因此，这些字段和方法的符号引用不经过转换是无法直接被虚拟机使用的。**当虚拟机运行时，需要从Class常量池表中获得 对应的符号引用，再在类加载过程中的解析阶段将其替换为直接引用，并翻译到 具体的内存地址中。放到运行时常量池, 这样当类在使用各个类型信息或者常量时,从运行时常量池中就可以取到真正的数据** 这里说明下符号引用和直接引用的区别与关联：

- 符号引用：符号引用以一组符号来描述所引用的目标，符号可以是任何形式 的字面量，只要使用时能无歧义地定位到目标即可。符号引用与虚拟机实现的内存布局无关，引用的目标并不一定已经加载到内存中
- 直接引用：直接引用可以是**直接指向目标的指针、相对偏移量或是一个能 间接定位到目标的句柄。直接引用是与虚拟机实现的内存布局相关的，**同 一个符号引用在不同虚拟机实例上翻译出来的直接引用一般不会相同。如果有了直接引用，那说明引用的目标必定已经存在于内存之中了

> 解析二进制文件

根据上面所说的 内容,我们可以对二进制字节码进行解读,但是在解读之前,我们还缺一项数据,,

前面说到, 常量池表中的每一项的第一个字节作为 类型标识, 那么这个类型占多少个字节呢,也就是说 该项的长度是多少呢, 请看下面这张表:

**开始解析:**

首先紧随常量池表长度之后的,也就是第一项的 类型描述符为 `0a`,对应的十进制数为10, 根据上面的表查询到, 此项的类型为`CONSTANT_Methodref_info` 是类中方法的符号引用, 可以看出,除了tag 描述符外,应该还有两个 `U2`无符号数, 也就是四个字节, 所以, 该项的位置,应该为图中蓝色的部分

下面依次类推, 下一项中的类型数为 09 ,则类型为 `CONSTANT_Fieldref_info` 字段的符号引用, 实体也占四个字节,总共是五个字节, 用淡黄色表示:

后面再继续像这样解析, 但是需要注意的是, String 类型的常量,由于 其内容长度不固定,所以解析的方式不一样:

在最后一个蓝色的部分,可以看到,其类型描述符为 01, 所以其类型为`CONSTANT_utf8_info`,也就是字符串常量, 根据表上的信息可以得知,后面两个字节为 描述 字符串的长度, 也就是 00 03 , 也就是 三个字节, 那再加上后面三个字节的字符串本体,正和得到图中标识的六个字节的蓝色部分;

.......十年后

最后解析出全部内容(黄蓝交替): 总共是 21 项, 22-1

根据上面解析出的信息, 第一项类型为 `CONSTANT_Methodref_info`, 第二项类型为 `CONSTANT_Fieldref_info`, 依次类推,这里我使用IDEA的插件,给我们展示好的 表格,

**但是这里我们仅仅只是解析出 每一项的类型, 那每一项中实体 字符表示的是什么意思呢, 以第一项为例**

第一项的全部内容为: `0a 00 04 00 12` ,

- 其中00 04 表示的是第一个符号, 代表的含义根据表中可以看到,说的是,声明此方法的类描述符,再根据十进制所代表的 4, 继续指向表中序号为4 的位置, 是一个 Class_info 类型, 然后再看第四项中,实体的信息为 00 15, 表示的含义为指向 全限定类名的常量,根据十进制 21, 可以看到表中对应的为一个 UTF8_info 字符串信息,再解析 此字符串类型项的信息, 为java/lang/object

对应的图示信息为:

- 在看看第二个u2 字符00 12表示的数据, 为指向名称和类型描述符, 再根据十进制18, 指向的是 一个NameAndType_info 类型的信息, 再根据此项,分别指向 方法的名称07和方法的描述符08, 分别对应字符串

"" 和 "()V",表示 方法的名称和返回值类型,对应的 图示:

> 常量池表总结

- 这 14 种表(或者常量项结构)的共同点是：表开始的第一位是一个 u1 类型的 标志位(tag)，代表当前这个常量项使用的是哪种表结构，即哪种常量类型
- 在常量池列表中，CONSTANT_Utf8_info 常量项是一种使用改进过的 UTF-8 编码格式来存储诸如文字字符串、类或者接口的全限定名、字段或者 方法的简单名称以及描述符等常量字符串信息
- 这 14 种常量项结构还有一个特点是，其中 13 个常量项占用的字节固定，只 有 CONSTANT_Utf8_info 占用字节不固定，其大小由 length 决定。为什 么？**因为从常量池存放的内容可知，其存放的是字面量和符号引用，最终 这些内容都会是一个字符串，这些字符串的大小是在编写程序时才确定，** 比如你定义一个类，类名可以取长取短，所以在没编译前，大小不固定，编译后，通过 UTF-8 编码，就可以知道其长度
- 常量池：可以理解为 Class 文件之中的资源仓库，它是 Class 文件结构中与 其他项目关联最多的数据类型(后面的很多数据类型都会指向此处)，也是占 用 Class 文件空间最大的数据项目之一

**那么 为什么需要常量池这个东西呢?**

Java 代码在进行 javac 编译的时候，并不像 C 和 C++ 那样有"连接"这一 步骤，而是在虚拟机加载 Class 文件的时候进行动态链接。也就是说，**在 Class 文件中不会保存各个方法、字段的最终内存布局信息，因此这些字段、方法的符号引用不经过运行期转换的话无法得到真正的内存入口地址，也就无法直接被虚拟机使用。**当虚拟机运行时，需要从常量池获得对应的符号引用，再在类创建时或运行时解析、翻译到具体的内存地址之中。

### 4.4 访问标识

在常量池后，紧跟着访问标记。该标记使用两个字节表示，用于识别一些类 或者接口层次的访问信息，包括：

这个Class 是类还是接口；是否定义为 public 类型；是否定义为 abstract 类型；如果是类的话，是否被声明为 final 等。各种访问标记如下所示：

标志名称
标志值
含义

ACC_PUBLIC
0x0001
标志为public类型

ACC_FINAL
0x0010
标志被声明为final，只有类可以设置

ACC_SUPER
0x0020
标志允许使用invokespecial字节码指令的新语义，JDK1.0.2之后编译出来的类的默认都有这个标志。（使用增强的方法调用父类方法）

ACC_INTERFACE
0x0200
标志这是一个接口

ACC_ABSTRACT
0x0400
是否为abstract类型，对于接口或者抽象类来说，次标志值为真，其他类型为假

ACC_SYNTHETIC
0x1000
标志此类并非由用户代码产生（即：由编译器产生的类，没有源码对应）

ACC_ANNOTATION
0x2000
标志这是一个注解

ACC_ENUM
0x4000
标志这是一个枚举

- 类的访问权限通常为 ACC_ 开头的常量
- 每一个种类型的表示都是通过设置访问标记的 32 位中的特定位来实现的。 比如，若是 public final 的类，则该标记为 ACC_PUBLIC | ACC_FINAL
- 使用 ACC_SUPER 可以让类更准确地定位到父类的方法 super.method()，现代编译器都会设置并且使用这个标记

如我们上面的例子:

用来描述类的访问标识的 为`00 21`, 是 0x0020 + 0x0001 ,组合权限,也就是 `ACC_PUBLIC`+ `ACC_SUPER`,也就是public标识的类

> 补充说明

**1、** 带有ACC_INTERFACE标志的Class文件表示的是接口而不是类，反之则表示的是类而不是接口；

- 如果一个 Class 文件被设置了 ACC_INTERFACE 标志，那么同时也得 设置 ACC_ABSTRACT 标志。同时它不能再设置 ACC_FINAL、 ACC_SUPER 或 ACC_ENUM 标志
- 如果没有设置 ACC_INTERFACE 标志，那么这个 Class文件可以具有 上表中除 ACC_ANNOTATION 外的其他所有标志。当然，ACC_FINAL 和 ACC_ABSTRACT 这类互斥的标志除外。这两个标志不能同时设置

**2、** ACC_SUPER标志用于确定类或接口里面的invokespecial指令使用的是哪一种执行语义**针对Java虚拟机指令集的编译器都应当设置这个标志**对于JavaSE8及后续版本来说，无论Class文件中这个标志的实际值是什么，也不管Class文件的版本；

**3、** ACC_SYNTHETIC标志意味着该类或接口是由编译器生成的，而不是由源代码生成的；

**4、** 注解类型必须设置ACC_ANNOTATION标志如果设置了ACC_ANNOTATION标志，那么也必须设置ACC_INTERFACE标志；

**5、** ACC_ENUM标志标明该类或其父类为枚举类型；

**6、** 表中没有使用的access_flags标志是为未来扩充而预留的，这些预留的标志在编译器中应该设置为0，Java虚拟机实现也应该忽略他们；

### 4.5 类索引、父类索引、接口索引集合

在访问标记后，会指定该类的类别、父类类别以及实现的接口，格式如下：

长度
含义

u2
this_class

u2
super_class

u2
interfaces_count

u2
interfaces[interfaces_count]

这三项数据来确定这个类的继承关系

- 类索引用于确定这个类的全限定名
- 父类索引用于确定这个类的父类的全限定名。由于 Java 语言不允许多 重继承，所以父类索引只有一个，除了 java.lang.Object 之外，所有的 Java 类都有父类，因此除了 java.lang.Object 外，所有 Java 类的父类索 引都不为 0
- 接口索引集合就用来描述这个类实现了哪些接口，这些被实现的接口将 按 implements 语句(如果这个类本身是一个接口，则应当是 extends 语句)后的接口顺序从左到右排列在接口索引集合中

如下图所示,是案例中对应的位置:

**1、****this_class(类索引)**；

图中, 表示本类索引的内容为`00 03`, 表示的十进制的3,this_class 的值必须是对常量池表中某项的一个有效索 引值。常量池在这个索引处的成员必须为 CONSTANT_Class_info 类型结构体， 该结构体表示这个 Class 文件所定义的类或接口

**2、****super_class(父类索引)**；

例中所示的内容为 `00 04` ,指向常量池的索引。它提供了当前类的父类的全限定名。 如果我们没有继承任何类，其默认继承的是 java/lang/Object 类。同时，由 于 Java 不支持多继承，所以其父类只有一个 ,同时super_class 指向的父类不能是 final

**3、****interfaces**；

指向常量池索引集合，它提供了一个符号引用到所有已实现的接口 ,由于一个类可以实现多个接口，因此需要以数组形式保存多个接口的索引， 表示接口的每个索引也是一个指向常量池的 CONSTANT_Class(当然这里就 必须是接口，而不是类)

- **interfaces_count**: interfaces_count 项的值表示当前类或接口的直接超接口数量 , 例中表示为0,确实没有实现接口
- **interfaces[interfaces_count]**: interfaces[] 中每个成员的值必须是对常量池表中某项的有效索引值，它的长 度为 interfaces_count。每个成员 interfaces[i] 必须为 CONSTANT_Class_info 结 构，其中 0  字段计数器

一个类中有多少个字段,是不固定的,老规矩,要使用计数器

fields_count 的值表示当前 Class 文件 fields 表的成员个数。使用两个字节 来表示

fields 表中每一项都是一个 `field_info` 结构，用于表示该类或接口所声明 的所有类字段或者实例字段，**不包括方法内部声明的变量，也不包括从父类或父接口继承的那些字段**

> 字段表

fields 表中的每个成员都是一个 `fields_info` 结构的数据项，用于表示当前类或接口中某个字段的完整描述

一个字段的信息包括如下这些信息，这些信息中，各个修饰符都是布尔值，要么有，要么没有

- 作用域(public、private、protected 修饰符)
- 是实例变量还是类变量(static 修饰符)
- 可变性(final)
- 并发可见性(volatile 修饰符，是否强制从主内存读写)
- 可否序列化(transient 修饰符)
- 字段数据类型(基本数据类型、对象、数组)
- 字段名称

而一个`fields_info` 也是由各个部分组成:

类型
名称
含义
数量

u2
access_flags
访问标志
1

u2
name_index
字段名索引
1

u2
descriptor_index
描述符索引
1

u2
attribute_count
属性计数器
1

attribute_info
attribute
属性集合
attribute_count

**上面的例子中,字段只有一项,意味着字段表中也只有一项, 各个区域所标识的内容如下图:**

**1、****字段表访问标识**:；

一个字段可以被各种关键字去修饰，比如：作用域修饰符(public、 private、protected)、static 修饰符、final 修饰符、volatile 修饰符等等。因此， 其可像类的访问标志那样，使用一些标志来标记字段。字段的访问标志有如下这些：

标志名称
标志值
含义

ACC_PUBLIC
0x0001
字段是否为public

ACC_PRIVATE
0x0002
字段是否为private

ACC_PROTECTED
0x0004
字段是否为protected

ACC_STATIC
0x0008
字段是否为static

ACC_FINAL
0x0010
字段是否为final

ACC_VOLATILE
0x0040
字段是否为volatile

ACC_TRANSTENT
0x0080
字段是否为transient

ACC_SYNCHETIC
0x1000
字段是否为由编译器自动产生

ACC_ENUM
0x4000
字段是否为enum

每个修饰符所对应的值也都一一对应,如我们案例中,标识 字段修饰符的为 `00 02` , 代表这个字段为 private 修饰,如果多个修饰符, 则表现为 值相加

**2、****字段名索引**；

根据字段名索引的值，查询常量池中的指定索引项即可 , 例中内容为`00 05` 指向的就是 常量池中"num"字符串

**3、****描述符索引**；

描述符的作用是用来描述字段的数据类型、方法的参数列表(包括数量、类型 以及顺序)和返回值。根据描述符规则，基本数据类型(byte、char、double、float、 int、long、short、boolean)及代表无返回值的 void 类型都用一个大写字符来表示， 而对象则用字符 L 加对象的全限定名来表示，(这里就是指描述字段)如下所示：

标志符
含义

B
基本数据类型byte

C
基本数据类型char

D
基本数据类型double

F
基本数据类型float

I
基本数据类型int

J
基本数据类型long

S
基本数据类型short

Z
基本数据类型boolean

V
代表void类型

L
对象类型，比如：Ljava/lang/Object;

[
数组类型，代表一维数组。比如：double[][][] is [[[D

**4、****属性表集合**

一个字段还可能拥有一些属性，用于存储更多的额外信息。比如初始化值、 一些注释信息等。属性个数存放在 attribute_count 中，属性具体内容存放在 attributes 数组中 , 如例中所示, 该num 字段的属性 计数器为 0

以 final 修饰的 常量为例,就有属性,一个属性项的结构如下:

类型
名称
数量
含义

u2
attribute_name_index
1
属性名索引

u4
attribute_length
1
属性长度

u1
info
attribute_length
属性表

### 4.7 方法表集合

methods表: 指向常量池索引集合，它完整描述了每个方法的签名

**1、** 在字节码文件中，每一个`method_info`项都对应着一个类或者接口中的方法信息比如方法的访问修饰符(public、private或protected)，方法的返回值类型以及方法的参数信息等；

**2、** 如果这个方法不是抽象的或者不是native的，那么字节码中会体现出来；

**3、** 一方面，methods表只描述当前类或接口中声明的方法，不包括从父类或父接口继承的方法另一方面，**methods表有可能会出现由编译器自动添加的方法，最典型的便是编译器产生的初始化方法信息(比如：类(接口)静态初始化方法()和实例初始化方法()**；

**注意事项:**

**1、** 在Java语言中，要重载(Overload)一个方法，除了要与原方法具有相同的简单名称之外，还要求必须拥有一个与原方法不同的特征签名，；

**2、** 特征签名就是一个方法中各个参数在常量池中的字段符号引用的集合，也就是因为返回值不会包含在特征签名之中，；

**3、** 因此Java语言里无法仅仅依靠返回值的不同来对一个已有方法进行重载；

**4、** 但在Class文件格式中，特征签名的范围更大一些，只要描述符不是完全一致的两个方法就可以共存也就是说，如果两个方法有相同的名称和特征签名，但返回值不同，那么也是可以合法共存于同一个Class文件中(**允许存在方法名和参数列表相同,但返回值不同的方法)**；

**5、** 也就是说，尽管Java语法规范并不允许在一个类或者接口中声明多个方法签名相同的方法，**但是和Java语法规范相反**，**字节码文件中却恰恰允许存放多个方法签名相同的方法，唯一的条件就是这些方法之间的返回值不能相同**；

> 方法计数器

methods_count 的值表示当前 Class 文件 methods 表的成员个数，使用两个 字节来表示

methods 表中每个成员都是一个 `method_info`结构

> 方法表

**1、** methods表中的每个成员都是一个`method_info`结构，用于表示当前类或接口中某个方法的完整描述如果某个`method_info`结构的access_flags项既没有设置ACC_NATIVE标志也没有设置ACC_ABSTRACT标志，那么该结构中也应包含实现这个方法所有的Java虚拟机指令；

**2、** method_info结构可以表示类和接口中定义的所有方法，包括普通方法、静态方法、实例初始化方法和静态初始化方法；

**3、** 方法表的结构实际跟字段表是一样的，方法表结构如下：；

类型
名称
含义
数量

u2
access_flags
访问标志
1

u2
name_index
方法名索引
1

u2
descriptor_index
描述符索引
1

u2
attribute_count
属性计数器
1

attribute_info
attribute
属性集合
attribute_count

如例中所示 "00 02", , 我们的这个字节码有两个方法 ,分别是 `()` 和 `add()`,每个方法后面空出的内容为方法的属性,后面介绍

**以第二个方法为例:**

**1、****方法的访问标识:**；

`00 01` , 参照访问标识表: 含义为 public 的

标志名称
标志值
含义

ACC_PUBLIC
0x0001
字段是否为public

ACC_PRIVATE
0x0002
字段是否为private

ACC_PROTECTED
0x0004
字段是否为protected

ACC_STATIC
0x0008
字段是否为static

ACC_FINAL
0x0010
字段是否为final

ACC_VOLATILE
0x0040
字段是否为volatile

ACC_TRANSTENT
0x0080
字段是否为transient

ACC_SYNCHETIC
0x1000
字段是否为由编译器自动产生

ACC_ENUM
0x4000
字段是否为enum

**2、** **方法名索引:**；

`00 0e` , 指向 常量池中的 "add" 字符串
**3、****方法描述符索引:**；

`00 0f` 指向常量池中的 "()V" 字符串,表示空参,返回值为void
**4、****方法的属性计数器:**；

`00 01` 代表该方法的属性只有一个(code 属性,存放方法的方法体代码指令)

**注意 , 字段表中的某一项的属性 和 方法表中的某一项的属性的结构是相同的, 可以回去看一眼结构**

### 4.8 属性表集合

方法表集合之后的属性表集合，指的是 Class 文件所携带的辅助信息，比如 该 Class 文件的源文件的名称。以及任何带有 RetentionPolicy.CLASS 或者 RetentionPolicy.RUNTIME 的注解。这类信息通常被用于 Java 虚拟机的验证和 运行，以及 Java 程序的调试，一般无需深入了解

**此外，字段表、方法表都可以有自己的属性表。用于描述某些场景专有的信息,类中的属性表集合是用来描述类的信息, 字段表和 方法表中的属性是用来描述 某一项的, 他们的结构都是相同的**

属性表集合的限制没有那么严格，不再要求各个属性表具有严格的顺序，并 且只要不与已有的属性名重复，任何人实现的编译器都可以向属性表中写入自己 定义的属性信息，但 Java 虚拟机运行时会忽略掉它不认识的属性

**类中的属性表集合也是由属性计数器 和属性表组成**

> 属性计数器

attributes_count 的值表示当前 Class 文件属性表的成员个数。属性表中每一项都是一个 attribute_info 结构

> 属性表

属性表的每个项的值必须是 attribute_info 结构。属性表的结构比较灵活，各种 不同的属性只要满足以下结构即可

**属性的通用格式:**

类型
名称
数量
含义

u2
attribute_name_index
1
属性名索引

u4
attribute_length
1
属性长度

u1
info
attribute_length
属性表

即只需说明属性的名称以及占用位数的长度即可，属性表具体的结构可以去自定义,

属性表JAVA 本身自带 有很多类型，上面看到的 Code 属性只是其中一种， Java 8 里面定义了 23 种属性 下面这些是虚拟机中预定义的属性：

下面是几个常见的属性的构造:

**1、****ConstantValue属性**；

ConstantValue 属性表示一个常量字段的值。位于 field_info 结构的属性表中

```java
ConstantValue_attribute {
    u2 attribute_name_index;
    u4 attribute_length;
    u2 constantvalue_index; //字段值在常量池中的索引，常量池在该索引处的项
    给出该属性表示的常量值。(例如，值是 long 型的，在常量池中便是
    CONSTANT_Long)
}
```

**2、****Deprecated属性**；

```java
Deprecated_attribute {
    u2 attribute_name_index;
    u4 attribute_length;
}
```

**3、****Code属性**；

Code 属性就是存放方法体里面的代码，但是，并非所有方法表都有 Code 属 性，像接口或者抽象方法，他们没有具体的方法体，因此也就不会有 Code 属 性了

Code 属性表的结构，如下：

可以看到：Code 属性表的前两项跟属性表是一致的，即 Code 属性表遵循 属性表的结构，后`面那些则是他自定义`的结构

**4、****InnerClasses属性**；

为了方便说明特别定义一个表示类或接口的 Class 格式为 C。如果 C 的常 量池中包含某个 CONSTANT_Class_info 成员，且这个成员所表示的类或接口不 属于任何一个包，那么 C 的 ClassFile 结构的属性表中就必须含有对应的 InnerClasses 属性。InnerClasses 属性是在 JDK 1.1 中为了支持内部类和内部接 口而引入的，位于 ClassFile 结构的属性表

**5、****LineNumberTable属性**；

LineNumberTable 属性是可选变长属性，位于 Code 结构的属性表

LineNumberTable 属性是用来描述 Java 源码行号与字节码行号之间的对应关系，这个属性可以用来在调试的时候定位代码执行的行数

- start_pc，即字节码行号；
- line_number，即 Java 源代码行号 在 Code 属性的属性表中，

LineNumberTable 属性可以按照任意顺序出现， 此外，多个 LineNumberTable 属性可以共同表示一个行号在源文件中表示的内 容，即 LineNumberTable 属性不需要与源文件的行一一对应

LineNumberTable 属性表结构：

**1、****LocalVariableTable属性**；

LocalVariableTable 是可选变长属性，位于 Code 属性的属性表中。它被调试器 **用于确定方法在执行过程中局部变量的信息。**在 Code 属性的属性中， LocalVariableTable 属性可以按照任意顺序出现。Code 属性中的每个局部变量最 多只能有一个 LocalVariableTable 属性。

- start_pc + length 表示这个变量在字节码中的生命周期起始和结束的偏 移位置(this 生命周期从头 0 到结尾 10)
- index 就是这个变量在局部变量表中的槽位(槽位可复用)
- name 就是变量名称
- Descriptor 表示局部变量类型描述

LocalVariableTable 属性表结构：

**1、****Signature属性**；

Signature 属性是可选的定长属性，位于 ClassFile，field_info 或 method_info 结构的属性表中。在 Java 语言中，任何类、接口、初始化方法或成员的泛型签 名如果包含了类型变量(Type Variables)或参数化类型(Parameterized Types)，则 Signature 属性会为它记录泛型签名信息

**2、****SourceFile属性**；

SourceFile 属性结构 , 可以看到，其长度总是固定的 8 个字节

**3、****其他属性**；

Java 虚拟机中预定义的属性有 20 多个，这里就不一一介绍了，通过上面几个属 性的介绍，只要领会其精髓，其他属性的解读也是易如反掌

> 解析案例中的() 方法的 code属性(包含代码指令,局部变量表,异常表等信息)

解析过程过于繁琐,想要了解可以观看视频: [https://www.bilibili.com/video/BV1PJ411n7xZ?p=230](https://www.bilibili.com/video/BV1PJ411n7xZ?p=230)

**总结:通过手动去解读字节码文件，终于大概了解到其构成和原理了 实际上，我们可以使用各种工具来帮我们去解读字节码文件，而不用直接去 看这些 16 进制，太繁琐了 **

## 5. 补充: javap 的使用

通过上面分析原生的字节码文件,发现自己分析类文件结构太麻烦了！Oracle 提供了 javap 工具

当然这些信息中，有些信息(如本地变量表、指令和代码行偏移量映射表、常量池中方法的参数名称等等)需要在使用 javac 编译成 Class 文件时，指定参数 才能输出，比如，你直接 javac xx.java，就不会再生成对应的局部变量表等信息， 如果你使用 javac -g xx.java 就可以生成所有相关信息了。如果你使用的是IDEA / Eclipse，则默认情况下,在编译时会帮你生成局部变量表 , 指令和代码行偏移量映射表等信息

通过反编译生成的汇编代码，我们可以深入的了解 Java 代码的工作机制。 比如我们看到的 i++，这行代码实际运行时是先获取变量 i 的值，然后将这个 值加 1，最后再将加 1 后的值赋值给变量 i

> javap具体的使用

在命令行中直接输入 javap 或 javap -help 可以看到 javap 的 options 有如下 选项：

```java
用法: javap <options> <classes>
其中, 可能的选项包括:
  -help  --help  -?        输出此用法消息
  -version                 版本信息
  -v  -verbose             输出附加信息
  -l                       输出行号和本地变量表
  -public                  仅显示公共类和成员
  -protected               显示受保护的/公共类和成员
  -package                 显示程序包/受保护的/公共类
                           和成员 (默认)
  -p  -private             显示所有类和成员
  -c                       对代码进行反汇编
  -s                       输出内部类型签名
  -sysinfo                 显示正在处理的类的
                           系统信息 (路径, 大小, 日期, MD5 散列)
  -constants               显示最终常量
  -classpath <path>        指定查找用户类文件的位置
  -cp <path>               指定查找用户类文件的位置
  -bootclasspath <path>    覆盖引导类文件的位置
```

**1、** -version:；

`javap -version` : 查看 javap 所在jdk的版本

**2、** -public:；

`javap -public Demo.class` : 输出 Demo 类中public 访问权限的字段和方法

**3、** -protected:；

和`-public` 类似,输出 protected 和 public 修饰的字段和方法

**4、** -p(-private):；

也是控制访问权限, 输出所有的 字符和方法

**5、** -package:；

输出除了 private 的字符和方法,包括 默认访问修饰符

**6、** -sysinfo；

输出处理的类的 系统信息, 路径,大小,日期,MD5 散列, 源文件名

**7、** -constants:；

输出的内容和 -package 类似, 但是包括 static字段的最终的值

**8、** -s；

输出包括默认访问修饰以下的内部方法的类型信息,如果想要查看 private的, 可以带上 -p:

`javap -s -p Demo.class`

**9、** -l；

输出行号和局部变量表(需要在生成class文件时就指定输出)

**10、** -c；

最最常用的指令, 输出 对代码的反汇编指令

**1、** -v(-verbose)；

输出最详细的信息, 包括行号,局部变量表,反汇编等信息(不包括私有的)

**总结:**

一般常用的是 -v -l -c 三个选项

- javap -l 会输出行号和本地变量表信息
- javap -c 会对当前 Class 字节码进行反编译生成汇编代码
- javap -v 除了包含 -c 内容外，还会输出行号、局部变量表信息、常 量池等信息

平时只需使用 `javap -v -p Demo.class` ,就可以显示最全的信息了

> 解读javap解析的文件

代码:

```java
public class JavapTest {
    private int num;
    boolean flag;
    protected char gender;
    public String info;
    public static final int COUNTS = 1;
    static{
        String url = "www.atguigu.com";
    }
    {
        info = "java";
    }
    public JavapTest(){
    }
    private JavapTest(boolean flag){
        this.flag = flag;
    }
    private void methodPrivate(){
    }
    int getNum(int i){
        return num + i;
    }
    protected char showGender(){
        return gender;
    }
    public void showInfo(){
        int i = 10;
        System.out.println(info + i);
    }
}
```

执行`javap -v -p JavapTest.class`命令

输出的内容:

```java
Classfile /D:/dev/workspace/demo/代码/JVMDemo1/out/production/chapter01/com/atguigu/java1/JavapTest.class //文件的位置
  Last modified 2020-12-1; size 1358 bytes //最后修改的时间 和 文件的大小
  MD5 checksum 526b4a845e4d98180438e4c5781b7e88  //文件的散列 MD5 值
  Compiled from "JavapTest.java" 		 //源代码的名称
public class com.atguigu.java1.JavapTest
  minor version: 0		//文件的副版本
  major version: 52		//文件的主版本
  flags: ACC_PUBLIC, ACC_SUPER	//类的访问标识
Constant pool:		//常量池信息
  1 = Methodref         16.#46        // java/lang/Object."<init>":()V
  2 = String            47            // java
  3 = Fieldref          15.#48        // com/atguigu/java1/JavapTest.info:Ljava/lang/String;
  4 = Fieldref          15.#49        // com/atguigu/java1/JavapTest.flag:Z
  5 = Fieldref          15.#50        // com/atguigu/java1/JavapTest.num:I
  6 = Fieldref          15.#51        // com/atguigu/java1/JavapTest.gender:C
  7 = Fieldref          52.#53        // java/lang/System.out:Ljava/io/PrintStream;
  8 = Class             54            // java/lang/StringBuilder
  9 = Methodref         8.#46         // java/lang/StringBuilder."<init>":()V
 10 = Methodref         8.#55         // java/lang/StringBuilder.append:(Ljava/lang/String;)Ljava/lang/StringBuilder;
 11 = Methodref         8.#56         // java/lang/StringBuilder.append:(I)Ljava/lang/StringBuilder;
 12 = Methodref         8.#57         // java/lang/StringBuilder.toString:()Ljava/lang/String;
 13 = Methodref         58.#59        // java/io/PrintStream.println:(Ljava/lang/String;)V
 14 = String            60            // www.atguigu.com
 15 = Class             61            // com/atguigu/java1/JavapTest
 16 = Class             62            // java/lang/Object
 17 = Utf8               num
 18 = Utf8               I
 19 = Utf8               flag
 20 = Utf8               Z
 21 = Utf8               gender
 22 = Utf8               C
 23 = Utf8               info
 24 = Utf8               Ljava/lang/String;
 25 = Utf8               COUNTS
 26 = Utf8               ConstantValue
 27 = Integer            1
 28 = Utf8               <init>
 29 = Utf8               ()V
 30 = Utf8               Code
 31 = Utf8               LineNumberTable
 32 = Utf8               LocalVariableTable
 33 = Utf8               this
 34 = Utf8               Lcom/atguigu/java1/JavapTest;
 35 = Utf8               (Z)V
 36 = Utf8               methodPrivate
 37 = Utf8               getNum
 38 = Utf8               (I)I
 39 = Utf8               i
 40 = Utf8               showGender
 41 = Utf8               ()C
 42 = Utf8               showInfo
 43 = Utf8               <clinit>
 44 = Utf8               SourceFile
 45 = Utf8               JavapTest.java
 46 = NameAndType       28:#29        // "<init>":()V
 47 = Utf8               java
 48 = NameAndType       23:#24        // info:Ljava/lang/String;
 49 = NameAndType       19:#20        // flag:Z
 50 = NameAndType       17:#18        // num:I
 51 = NameAndType       21:#22        // gender:C
 52 = Class             63            // java/lang/System
 53 = NameAndType       64:#65        // out:Ljava/io/PrintStream;
 54 = Utf8               java/lang/StringBuilder
 55 = NameAndType       66:#67        // append:(Ljava/lang/String;)Ljava/lang/StringBuilder;
 56 = NameAndType       66:#68        // append:(I)Ljava/lang/StringBuilder;
 57 = NameAndType       69:#70        // toString:()Ljava/lang/String;
 58 = Class             71            // java/io/PrintStream
 59 = NameAndType       72:#73        // println:(Ljava/lang/String;)V
 60 = Utf8               www.atguigu.com
 61 = Utf8               com/atguigu/java1/JavapTest
 62 = Utf8               java/lang/Object
 63 = Utf8               java/lang/System
 64 = Utf8               out
 65 = Utf8               Ljava/io/PrintStream;
 66 = Utf8               append
 67 = Utf8               (Ljava/lang/String;)Ljava/lang/StringBuilder;
 68 = Utf8               (I)Ljava/lang/StringBuilder;
 69 = Utf8               toString
 70 = Utf8               ()Ljava/lang/String;
 71 = Utf8               java/io/PrintStream
 72 = Utf8               println
 73 = Utf8               (Ljava/lang/String;)V
{					//字段表信息 start
  private int num;// 字段的 访问修饰符 类型 和名称
    descriptor: I  //字段描述符: 字段的类型
    flags: ACC_PRIVATE //字段的访问标识
  boolean flag;
    descriptor: Z
    flags:
  protected char gender;
    descriptor: C
    flags: ACC_PROTECTED
  public java.lang.String info;
    descriptor: Ljava/lang/String;
    flags: ACC_PUBLIC
  public static final int COUNTS;
    descriptor: I
    flags: ACC_PUBLIC, ACC_STATIC, ACC_FINAL
    ConstantValue: int 1
							// 字段表信息 end
							// 方法表信息 start
  public com.atguigu.java1.JavapTest();  //构造器1
    descriptor: ()V   //方法的描述符, 方法的参数列表 和 返回值类型信息
    flags: ACC_PUBLIC  // 方法的修饰符
    Code:  //方法的code 属性
      stack=2, locals=1, args_size=1 // 操作数栈的最大深度:3,局部变量表个数:1,接收参数的个数: 1(虽然是无参 但是默认有一个this)
      //方法内部代码的指令集: 偏移量: 操作指令 操作数
         0: aload_0
         1: invokespecial1                  // Method java/lang/Object."<init>":()V
         4: aload_0
         5: ldc          2                  // String java
         7: putfield     3                  // Field info:Ljava/lang/String;
        10: return
      LineNumberTable://行号表: 行号-指令偏移量 一一对应关系
        line 20: 0
        line 18: 4
        line 22: 10
      LocalVariableTable: // 局部变量表 , 
        Start  Length  Slot  Name   Signature
            0      11     0  this   Lcom/atguigu/java1/JavapTest;
  private com.atguigu.java1.JavapTest(boolean); //构造器2
    descriptor: (Z)V
    flags: ACC_PRIVATE
    Code:
      stack=2, locals=2, args_size=2
         0: aload_0
         1: invokespecial1                  // Method java/lang/Object."<init>":()V
         4: aload_0
         5: ldc          2                  // String java
         7: putfield     3                  // Field info:Ljava/lang/String;
        10: aload_0
        11: iload_1
        12: putfield     4                  // Field flag:Z
        15: return
      LineNumberTable:
        line 23: 0
        line 18: 4
        line 24: 10
        line 25: 15
      LocalVariableTable:
        Start  Length  Slot  Name   Signature
            0      16     0  this   Lcom/atguigu/java1/JavapTest;
            0      16     1  flag   Z
  private void methodPrivate();
    descriptor: ()V
    flags: ACC_PRIVATE
    Code:
      stack=0, locals=1, args_size=1
         0: return
      LineNumberTable:
        line 28: 0
      LocalVariableTable:
        Start  Length  Slot  Name   Signature
            0       1     0  this   Lcom/atguigu/java1/JavapTest;
  int getNum(int);
    descriptor: (I)I
    flags:
    Code:
      stack=2, locals=2, args_size=2
         0: aload_0
         1: getfield     5                  // Field num:I
         4: iload_1
         5: iadd
         6: ireturn
      LineNumberTable:
        line 30: 0
      LocalVariableTable:
        Start  Length  Slot  Name   Signature
            0       7     0  this   Lcom/atguigu/java1/JavapTest;
            0       7     1     i   I
  protected char showGender();
    descriptor: ()C
    flags: ACC_PROTECTED
    Code:
      stack=1, locals=1, args_size=1
         0: aload_0
         1: getfield     6                  // Field gender:C
         4: ireturn
      LineNumberTable:
        line 33: 0
      LocalVariableTable:
        Start  Length  Slot  Name   Signature
            0       5     0  this   Lcom/atguigu/java1/JavapTest;
  public void showInfo();
    descriptor: ()V
    flags: ACC_PUBLIC
    Code:
      stack=3, locals=2, args_size=1
         0: bipush        10
         2: istore_1
         3: getstatic    7                  // Field java/lang/System.out:Ljava/io/PrintStream;
         6: new          8                  // class java/lang/StringBuilder
         9: dup
        10: invokespecial9                  // Method java/lang/StringBuilder."<init>":()V
        13: aload_0
        14: getfield     3                  // Field info:Ljava/lang/String;
        17: invokevirtual10                 // Method java/lang/StringBuilder.append:(Ljava/lang/String;)Ljava/lang/StringBuilder;
        20: iload_1
        21: invokevirtual11                 // Method java/lang/StringBuilder.append:(I)Ljava/lang/StringBuilder;
        24: invokevirtual12                 // Method java/lang/StringBuilder.toString:()Ljava/lang/String;
        27: invokevirtual13                 // Method java/io/PrintStream.println:(Ljava/lang/String;)V
        30: return
      LineNumberTable:
        line 36: 0
        line 37: 3
        line 38: 30
      LocalVariableTable:
        Start  Length  Slot  Name   Signature
            0      31     0  this   Lcom/atguigu/java1/JavapTest;
            3      28     1     i   I
// 方法表 end
//静态代码块
  static {};
    descriptor: ()V
    flags: ACC_STATIC
    Code:
      stack=1, locals=1, args_size=0
         0: ldc          14                 // String www.atguigu.com
         2: astore_0
         3: return
      LineNumberTable:
        line 15: 0
        line 16: 3
      LocalVariableTable:
        Start  Length  Slot  Name   Signature
}
SourceFile: "JavapTest.java" // 附近信息,源文件名
```

> javap使用的总结

通过javap 命令可以查看一个 Java 类反汇编得到的 Class 文件版本号、常 量池、访问标识、变量表、指令代码行号表等信息。不显式类索引、父类索 引、接口索引集合、`()`、`()`等结构 (其实也显示了只是展示方式不同)

通过对前面的例子代码反汇编文件的简单分析，可以发现，一个方法的执行 通常会涉及下面几块内存的操作

- Java 栈中：局部变量表、操作数栈
- Java 堆： 通过对象的地址引用去操作
- 常量池
- 其他如帧数据区、方法区的剩余部分等情况，测试中没有显示出来，这 里说明一下

平常，我们比较关注的是 Java 类中每个方法的反汇编中的指令操作过程， 这些指令都是顺序执行的，可以参考官方文档查看每个指令含义

## 6. Class文件结构总结

本章主要介绍了 Class 文件的基本格式

随着Java 平台的不断发展，在将来，Class 文件的内容也一定会做进一步 的扩充，但是其基本的格式和结构不会做重大调整

从Java 虚拟机的角度看，通过 Class 文件，可以让更多的计算机语言支持 Java 虚拟机平台。因此，Class 文件结构不仅仅是 Java 虚拟机的执行入口，更 是 Java 生态圈的基础和核心
