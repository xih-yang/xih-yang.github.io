# 11、JVM 实战 - Class 文件结构
- 来源：https://ddkk.com/zhuanlan/java/jvm/5/11.html
- 分类：JVM 实战
- 分组：教程目录
## 一、Class 文件结构

JDK的版本号已经到 14 了，相对于语言、API 以及 Java 技术体系中其他方面的变化，Class 文件结构一直处于比较稳定的状态，Class 文件的主体结构、字节码指令的语义和数量几乎没有出现过变动。

Class 文件是一组以8位字节为基础单位的二进制流，各个数据项目严格按照顺序紧凑地排列在 Class 文件中，中间没有添加任何分隔符，这使得整个 Class 文件中存储的内容几乎全部是程序运行的必要数据，没有空隙存在。

根据Java 虚拟机规范的规定，Class 文件格式采用一种类似于 C 语言结构体的伪结构来存储数据，这种伪结构只有两种数据类型：无符号数和表：

> 无符号数：以 u1、u2、u4、u8 来分别代表1个字节、2个字节、4个字节和8个字节的无符号数，无符号数可以用来描述数字、索引引用、数量值或者按照 UTF-8 编码构成字符串值。

> 表：由多个无符号数或者其他表作为数据项构成的复合数据类型，所有表都习惯性的以“_info” 结尾，用于描述有层次关系的复合结构的数据，整个 Class 文件本质上就是一张表。

下面是Class 文件格式：

类型
名称
数量
描述

u4
magic
1
表示这个文件是否为一个能被虚拟机接受的 Class 文件

u2
minor_version
1
次版本号

u2
major_version
1
主版本号，Java 的版本号从45开始

u2
constant_pool_count
1
常量池容量计数值

cp_info
constant_pool
constant_pool_count-1
常量池是Class文件中的资源仓库，主要存放两大类常量：字面量和符号引用（见下文释义）

u2
access_flags
1
识别类/接口层次的访问信息，比如：这个 Class 是类还是接口，是否为 pubilc，是否为 final 等

u2
this_class
1
类索引，用于确定这个类的全限定名

u2
super_class
1
父类索引，用于确定这个类的父类的全限定名

u2
interfaces_count
1
实现的接口索引集合数量

u2
interfaces
interfaces_count
用来描述这个类实现了哪些接口

u2
fields_count
1
字段数量

field_info
fields
fields_count
描述接口或者类中声明的变量，包括类级变量以及实例级变量

u2
methods_count
1
方法数量

method_info
methods
methods_count
描述接口或者类中声明的方法，包括类级方法以及实例级方法

u2
attributes_count
1
属性数量

attribute_info
attributes
attributes_count
描述字段/方法表中额外的信息，比如 Code 用来存储具体的代码，ConstantValue 用于存储常量等

**字面量** 指的是 Java 语言中的文本字符串、声明为 final 的常量值等。而 **符号引用** 则属于编译原理方面的概念，包括了下面三类常量：

- 类和接口的全限定名
- 字段的名称或描述符
- 方法的名称或描述符

## 二、Class 文件字节码

```java
public class TestClass {
    private int m;
    public int inc() {
        return m + 1;
    }
}
```

我们通过 JAVA_HOME/bin/javap 工具的 -verbose 参数输出 TestClass.class 文件的内容，用来分析 Class 文件字节码。

```java
javap -verbose TestClass
```

```java
 Classfile /D:/JMCui/jvm-demo/demo/target/classes/org/jvm/demo/chapter6/TestClass.class
     Last modified 2020-4-1; size 397 bytes
     MD5 checksum 291f52e2b746bf6c338ece68fdf3dc08
     Compiled from "TestClass.java"
     public class org.jvm.demo.chapter6.TestClass
     minor version: 0
     major version: 52
     flags: ACC_PUBLIC, ACC_SUPER
     Constant                                                                          :
    1 = Methodref         4.#18         // java/lang/Object."<init>":()V
    2 = Fieldref          3.#19         // org/jvm/demo/chapter6/TestClass.m:I
    3 = Class             20            // org/jvm/demo/chapter6/TestClass
    4 = Class             21            // java/lang/Object
    5 = Utf8               m
    6 = Utf8               I
    7 = Utf8               <init>
    8 = Utf8               ()V
    9 = Utf8               Code
    10 = Utf8               LineNumberTable
    11 = Utf8               LocalVariableTable
    12 = Utf8               this
    13 = Utf8               Lorg/jvm/demo/chapter6/TestClass;
    14 = Utf8               inc
    15 = Utf8               ()I
    16 = Utf8               SourceFile
    17 = Utf8               TestClass.java
    18 = NameAndType       7:#8          // "<init>":()V
    19 = NameAndType       5:#6          // m:I
    20 = Utf8               org/jvm/demo/chapter6/TestClass
    21 = Utf8               java/lang/Object
     {
     public org.jvm.demo.chapter6.TestClass();
     descriptor: ()V
     flags: ACC_PUBLIC
     Code:
     stack=1, locals=1, args_size=1
     0: aload_0
     1: invokespecial1                  // Method java/lang/Object."<init>":()V
     4: return
     LineNumberTable:
     line 7: 0
     LocalVariableTable:
     Start  Length  Slot  Name   Signature
     0       5     0  this   Lorg/jvm/demo/chapter6/TestClass;
     public int inc();
     descriptor: ()I
     flags: ACC_PUBLIC
     Code:
     stack=2, locals=1, args_size=1
     0: aload_0
     1: getfield     2                  // Field m:I
     4: iconst_1
     5: iadd
     6: ireturn
     LineNumberTable:
     line 12: 0
     LocalVariableTable:
     Start  Length  Slot  Name   Signature
     0       7     0  this   Lorg/jvm/demo/chapter6/TestClass;
     }
     SourceFile: "TestClass.java"
```

上面的**minor version**、 **major version**、**flags**、**Constant** 这些含义都比较好理解。

**Code** 属性是 Class 文件中最重要的一个属性，如果把一个 Java 程序中的信息分为代码（Code，方法体里面的 Java 代码）和元数据（Metadata，包括类、字段、方法定义及其他信息）两部分，那么整个 Class 文件中，Code 属性用于描述代码，所有的其他数据项目都用来描述元数据。

**stack**、**locals** 是 Code 属性中的内容，stack 表示操作数栈；locals 表示局部变量表所属的存储空间，单位是 Slot，Slot 是虚拟机为局部变量分配内存所使用的最小单位。

**args_size** 表示参数数量，上面的 args_size 之所以会为 1，是因为在实例方法的局部变量表中至少会存在一个指向当前对象实例的局部变量，局部变量表中也会预留出第一个 Slot 位来存放对象实例的引用。

**LineNumberTable** 用于描述 Java 源码行号与字节码行号（字节码的偏移量）之间的对应关系。

**LocalVariableTable** 用于描述栈帧中局部变量表中的变量与 Java 源码中定义的变量之间的关系。**LocalVariableTypeTable** 用于泛型类型记录特征签名（Signature）信息。

**SourceFile** 记录生成这个 Class 文件的源码文件名称。

**aload_0**、**invokespecial**、**return** 这些属于字节码指令，不是本文介绍的重点，相关的字节码指令以及其他属性信息可以阅读《Java 虚拟机规范》。
