# 17、JVM 实战 - Class字节码指令解析
- 来源：https://ddkk.com/zhuanlan/java/jvm/3/17.html
- 分类：JVM 实战
- 分组：教程目录
## 1. 概述

官方文档：[https://docs.oracle.com/javase/specs/jvms/se8/html/jvms-6.html](https://docs.oracle.com/javase/specs/jvms/se8/html/jvms-6.html)

**1、** Java字节码对于虚拟机，就好像汇编语言对于计算机，属于基本执行命令；

**2、** Java虚拟机的指令由一个字节长度的、代表着某种特定操作含义的数字(称为操作码，Opcode)以及跟随其后的零至多个代表此操作所需参数(称为操作数，Operands)而构成，由于Java虚拟机采用面向操作数栈而不是寄存器的结构，所以大多数的指令都不包含操作数，只有一个操作码；

**3、** 由于限制了Java虚拟机操作码的长度为一个字节(即0~255)，这意味着指令集的操作码总数不可能超过256条；

**4、** 熟悉虚拟机的指令对于动态字节码生成、反编译Class文件、Class文件修补都有着非常重要的价值因此，阅读字节码作为了解Java虚拟机的基础技能，需要熟练掌握常见指令；

### 1.1 JVM 执行指令的模型

如果不考虑异常处理的话，那么 Java 虚拟机的解释器可以使用下面这个伪 代码当做最基本的执行模型来理解

```java
do {
	自动计算 PC 寄存器的值加 1;
	根据 PC 寄存器的指示位置，从字节码流中取出操作码;
	if(字节码存在操作数) 从字节码流中取出操作数;
	执行操作码所定义的操作;
}while(字节码长度>0)
```

### 1.2 字节码与数据类型

在Java 虚拟机的指令集中，大多数的指令都包含了其操作所对应的数据类 型信息。例如，`iload` 指令用于从局部变量表中加载 int 类型的数据到操作数栈 中，而 `fload` 指令加载的则是 float 类型的数据

对于大部分与数据类型相关的字节码指令，它们的**操作码助记符中都有特殊 的字符来表明专门为哪种数据类型服务**：

- i 代表对 int 类型的数据操作
- l 代表 long
- s 代表 short
- b 代表 byte
- c 代表 char
- f 代表 float
- d 代表 double

也有一些指令的**助记符中没有明确地指明操作类型的字母**,但是其也是固定操作某一个类型，如 `arraylength` 指令，它没有代表数据类型的特殊字符，但该操作数永远只能是一个数组类型的对象

**还有另一些指令，如无条件跳转指令 goto 则是与数据类型无关的**

**注意事项:**

大部分的指令都没有支持整数类型 byte、char 和 short，甚至没有任何指令支持 boolean 类型。编译器会在编译器或运行期将 byte 和 short 类型的数据带 符号扩展(Sign-Extend)为相应的 int 类型数据，将 boolean 和 char 类型数据零位扩展(Zero-Extend)为相应的 int 类型数据。与之类似，在处理 boolean、byte、 short 和 char 类型的数组时，也会转换为使用对应的 int 类型的字节码指令来 处理。因此，大多数对于 boolean、byte、short 和 char 类型数据的操作，实际 上都是使用相应的 int 类型作为运算类型

### 1.3 指令分类

由于完全介绍和学习这些指令需要花费大量时间，为了能够更快地熟悉和了解这些基本指令，这里将 JVM 中的字节码指令集按用途大致分成 9 类：

- 加载与存储指令
- 算术指令
- 类型转换指令
- 对象的创建与访问指令
- 方法调用与返回指令
- 操作数栈管理指令
- 比较控制指令
- 异常处理指令
- 同步控制指令

在做值相关操作时：

- 一个指令，可以从局部变量表、常量池、堆中对象、方法调用、系统调用等 中取得数据，这些数据(可能是值，可能是对象的引用)被压入操作数栈
- 一个指令，也可以从操作数栈中取出一到多个值(pop 多次)，完成赋值、加 减乘除、方法传参、系统调用等操作

## 2. 加载和存储指令

### 2.1 概念

**加载和存储指令用于将数据从栈帧的局部变量表和操作数栈之间来回传递**

常用指令:

**局部变量压栈指令**

将一个局部变量加载到操作数栈：`xload`、`xload_ `(其中 x 为 i、l、f、d、a表示操作的类型，n 为 0 到 3,表示实际操作的数)；`xaload` (其 x 为 i、 l、f、d、a、b、c、s 表示类型)

**常量入操作数栈指令**

将一个常量加载到操作数栈：`bipush`、`sipush`、`ldc`、`ldc_w`、 `ldc2_w`、`aconst_null`、`iconst_m1`、`iconst_*`、`iconst`*、fconst*、 `dconst_*`

**出栈装入局部变量表指令**

将一个数值从操作数栈存储到局部变量表： `xstore`、`xstore_`(其中 x 为 i、l、f、d、a，n 为 0 到 3); `xastore`(其 中 x 为 i、l、f、d、a、b、c、s)

**扩充局部变量表的访问索引的指令**：wide

上面所列举的指令助记符中，有一部分是以尖括号结尾的(例如 iload_)。 这些指令助记符实际上代表了一组指令(例如 iload_代表了 iload_0、iload_1、 iload_2 和 iload_3 这几个指令)。这几组指令都是某个带有一个操作数的通用指令 (例如 iload)的特殊形式，对于这若干组特殊指令来说，它们表面上没有操作数， 不需要进行取操作数的动作，但操作数都隐含在指令中

**例如: iload_0 和 iload 0, 都是代表将局部变量表中索引为0的数,压入到操作数栈中,但是 前者是一种特殊的形式,将最常用的几种 变为这种形式,节省空间,只需占用 一个操作符的空间即可, 无需操作数(iload 一般为0至3设为常用)**

### 2.2 操作数栈与局部变量表

这里对操作数栈和局部变量表做一个简单的概述,详细内容 参考这篇: [/zhuanlan/java/jvm/3/5.html](/zhuanlan/java/jvm/3/5.html)

**1. 操作数栈:**

我们知道，Java 字节码是 Java 虚拟机所使用的指令集。因此，它与 Java 虚拟机基于栈的计算模型是密不可分的

在解释执行过程中，每当为 Java 方法分配栈帧时，Java 虚拟机往往需要开 辟一块额外的空间作为操作数栈，来存放计算的操作数以及返回结果

具体来说便是：**执行每一条指令之前，Java 虚拟机要求该指令的操作数已被压入操作数栈中。在执行指令时，Java 虚拟机会将该指令所需的操作数弹出， 并且将指令的结果重新压入栈中**

**举个栗子**

以加法指令 `iadd` 为例。假设在执行该指令之前，栈顶的两个元素分别为 int 值 1 和 int 值 2，那么 iadd 指令将弹出这两个 int，并将求得的和 int 值为 3 压入栈中

由于iadd 指令只消耗栈顶的两个元素，因此，对于离栈顶距离为 2 的元素， 即图中的问号，iadd 指令并不关心它是否存在，更加不会对其进行修改

**2. 局部变量表:(Local Variables)**

Java 方法栈帧的另外一个重要组成部分则是局部变量区，字节码程序可以将 计算的结果缓存在局部变量区之中

实际上，Java 虚拟机将局部变量区当成一个数组，依次存放 this 指针(仅非 静态方法)，所传入的参数，以及字节码中的局部变量。

和操作数栈一样，long 类型以及 double 类型的值将占据两个单元，其余类 型仅占据一个单元

在栈帧中，与性能调优关系最为密切的部分就是局部变量表。局部变量表中 的变量也是重要的垃圾回收根节点，只要被局部变量表中直接或间接引用的对象 都不会被回收 在方法执行时，

虚拟机使用局部变量表完成方法的传递

### 2.3 局部变量压栈指令

代码:

```java
public class LoadAndStoreTest {
    //1.局部变量压栈指令
    public void load(int num, Object obj,long count,boolean flag,short[] arr) {
        System.out.println(num);
        System.out.println(obj);
        System.out.println(count);
        System.out.println(flag);
        System.out.println(arr);
    }
}
```

load方法对应的字节码指令:

```java
 0 getstatic2 <java/lang/System.out>
 3 iload_1
 4 invokevirtual3 <java/io/PrintStream.println>
 7 getstatic2 <java/lang/System.out>
10 aload_2
11 invokevirtual4 <java/io/PrintStream.println>
14 getstatic2 <java/lang/System.out>
17 lload_3
18 invokevirtual5 <java/io/PrintStream.println>
21 getstatic2 <java/lang/System.out>
24 iload 5
26 invokevirtual6 <java/io/PrintStream.println>
29 getstatic2 <java/lang/System.out>
32 aload 6
34 invokevirtual4 <java/io/PrintStream.println>
37 return
```

对应的局部变量表示意图:

上面的指令中,使用 iload_1, iload 5 等指令,将 对应下标的 值分别压入到栈中

**注意事项:**

**1、** 在0-3内,iload指令是使用特殊的指令,如iload_1,当超过这个数时,将必须使用操作数例如:iload5；

**2、** 此例中,取第五个数时,并不是取下标为4的,而是5,这是因为count为long型,占用了两个位置；

**3、** boolean类型的操作指令使用int类型代替,iload5；

### 2.4 常量入栈指令

常量入栈指令的功能是将常数压入操作数栈，根据数据类型和入栈内容的不同，又可以分为 const 系列、push 系列和 ldc 指令

**指令 const 系列：**用于对特定的常量入栈，入栈的常量隐含在指令本身里。指令有：`iconst_`(i 从-1 到 5)、`lconst_`(l 从 0 到 1)、`fconst_`(f 从 0 到 2)、`dconst_`(d 从 0 到 1)、`aconst_null`

**例如**:

- iconst_m1 将-1 压入操作数栈 (-1 专有)
- iconst_x(x 为 0 到 5)将 x 压入栈
- lconst_0、lconst_1 分别将长整数 0 和 1 压入栈
- fconst_0、fconst_1、fconst_2 分别将浮点数 0、1、2 压入栈
- dconst_0 和 dconst_1分别将 double 型 0 和 1 压入栈
- aconst_null 将 null 压入操作数栈

从指令的命名上不难找出规律，指令助记符的第一个字符总是喜欢表示数据 类型，i 表示整数，l 表示长整型，f 表示浮点数，d 表示双精度浮点，习惯上 用 a 表示对象引用。如果指令隐含操作的参数，会以下划线形式表示

**指令 push 系列：** 主要包括 bipush 和 sipush，将超出上面指令范围外的常量入栈,它们的区别在于接受数 据类型的不同，bipush 接收 8 位整数作为参数，sipush 接收 16位整数，它们都 将参数压入栈

**指令 ldc 系列：** 如果以上指令都不能满足需求，那么可以使用万能的 ldc 指令，它可以接收一个 8 位的参数，该参数指向**常量池中**的 int、float 或者 String 的索引，将指定的内容压入堆栈

类似的还有 ldc_w，它接收两个 8 位参数，能支持的索引范围大于 ldc

如果要压入的元素是 long 或者 double 类型的，则使用 ldc2_w 指令，使用方式都是类似的

**总结如下:**

类型
常数指令
范围

int(boolean,byte,char,short)
iconst
[-1,5]

bipush
[-128,127]

sipush
[-32768,32767]

ldc
any int value

long
lconst
0,1

ldc
any long value

float
fconst
0,1,2

ldc
any float value

double
dconst
0,1

ldc
any double value

reference
aconst
null

ldc
String , Class

**代码举例:**

```java
public class LoadAndStoreTest {
    //2.常量入栈指令
    public void pushConstLdc() {
        int i = -1; //iconst_m1
        int a = 5;  //iconst_5
        int b = 6; //bipush 6
        int c = 127; //bipush 127
        int d = 128; //sipush 128
        int e = 32767; //sipush 32767
        int f = 32768;//ldc7 <32768>
    }
    public void constLdc() {
        long a1 = 1; //lconst_1
        long a2 = 2; //ldc2_w8 <2>
        float b1 = 2; // fconst_2
        float b2 = 3; //ldc10 <3.0>
        double c1 = 1; //dconst_1
        double c2 = 2; //ldc2_w11 <2.0>
        Date d = null; // aconst_null
    }
}
```

### 2.5 出栈装入局部变量表

出栈装入局部变量表指令用于将**操作数栈中栈顶元素**弹出后，装入局部变量表的指定位置，用于给局部变量赋值

这类指令主要以 store 的形式存在，比如 xstore (x 为 i、l、f、d、a)、xstore_n(x 为 i、l、f、d、a，n 为 0 至 3)和 pasture(x 为 i、l、f、d、a、b、c、s)

- 其中，指令 istore_n 将从操作数栈中弹出一个整数，并把它赋值给局部变量 索引为 n的位置
- 指令 xstore 由于没有隐含参数信息，故需要提供一个 byte 类型的参数 类指定目标局部变量表的位置
- xastore 则专门针对数组操作，以 iastore 为例，它用于给一个 int 数组 的给定索引赋值。在 iastore 执行前，操作数栈顶需要以此准备 3 个元 素：值、索引、数组引用，iastore 会弹出这 3 个值，并将值赋给数组中 指定索引的位置

一般说来，类似像 store 这样的命令需要带一个参数，用来指明将弹出的元 素放在局部变量表的第几个位置。但是，为了尽可能压缩指令大小，使用专门的 istore_1 指令表示将弹出的元素放置在局部变量表第 1 个位置。类似的还有 istore_0、istore_2、istore_3，它们分别表示从操作数栈顶弹出一个元素，存放在 局部变量表第 0、2、3 个位置

由于局部变量表前几个位置总是非常常用，因此这种做法虽然增加了指令数 量，但是可以大大压缩生成的字节码的体积。如果局部变量表很大，需要存储的槽位索引大于 3，那么可以使用 istore 指令，外加一个参数，用来表示需要存放的槽 位位置

**代码举例:**

```java
public class LoadAndStoreTest {
    //3.出栈装入局部变量表指令
    public void store(int k, double d) {
        int m = k + 2; // istore 4  反到局部量表表索引为 4的位置
        long l = 12; //lstore 5
        String str = "atguigu"; //astore 7
        float f = 10.0F; // fstore 8
        d = 10; // dstore_2
    }
}
```

## 3. 算术运算符

算术指令用于对两个操作数栈上的值进行某种特定运算，并把结果重新压入操作数栈

**分类:**

大体上算术指令可以分为两种：对整型数据进行运算的指令与对浮点型类型 数据进行运算的指令

**byte、short、char 和 boolean 类型说明 :**

在每一大类中，都有针对 Java 虚拟机具体数据类型的专用算术指令。但没有直接支持 byte、short、char 和 boolean 类型的算术指令，对于这些数据的运算，都使用 int 类型的指令来处理。此外，在处理 boolean、byte、short 和 char 类型的数组时，也会转换为使用对应的 int 类型的字节码指令来处理

**运算时的溢出 :**

数据运算可能会导致溢出，例如两个很大的正整数相加，结果可能是一个负 数。其实 Java 虚拟机规范并无明确规定过整型数据溢出的具体结果，仅规定了 在处理整型数据时，只有除法指令以及求余指令中当出现除数为 0 时会导致虚拟 机抛出异常 ArithmeticException

**运算模式:**

- 向最接近数舍入模式：JVM 要求在进行浮点数计算时，所有的运算结果都 必须舍入到适当的精度，非精确结果必须舍入为可被表示的最接近的精确值，如 果有两种可表示的形式与该值一样接近，将优先选择最低有效位为零的
- 向零舍入模式：将浮点数转换为整数时，采用该模式，该模式将在目标数值 类型中选择一个最接近但是不大于原值的数字作为最精确的舍入结果

**NaN 值使用**

当一个操作产生溢出时，将会使用有符号的无穷大表示，如果某个操作结果 没有明确的数学定义的话，将会使用 NaN 值来表示。而且所有使用 NaN 值作 为操作数的算术操作，结果都会返回 NaN

代码举例:

```java
public class ArithmeticTest {
    @Test
    public void method1(){
        int i = 10;
        double j = i / 0.0;
        System.out.println(j);// Infinity 无穷大
        double d1 = 0.0;
        double d2 = d1 / 0.0;
        System.out.println(d2);//NaN: not a number
    }
}
```

> 所有算数指令

所有算术指令包括：

- 加法指令：iadd、ladd、fadd、dadd
- 减法指令：isub、lsub、fsub、dsub
- 乘法指令：imul、lmul、fmul、dmul
- 除法指令：idiv、ldiv、fdiv、ddiv
- 求余指令：irem、lrem、frem、drem(remainder：余数)
- 取反指令：ineg、lneg、fneg、dneg(negation：取反)
- 自增指令：iinc
- 位运算指令，又可分为：
- 位移指令：ishl、ishr、iushr、lshl、lshr、lushr
- 按位或指令：ior、lor
- 按位与指令：iand、land
- 按位异或指令：ixor、lxor 13
- 比较指令：dcmpg、dcmlp、fcmpg、fcmpl、lcmp

**举例:**

代码一:

```java
public static int bar(int i) {
	return ((i + 1) - 2) * 3 / 4;
}
```

字节码指令对应的图示： (绿色代表局部变量表, 蓝色代表操作数栈)

代码二:

```java
public void method8(){
   int i = 10;
   i = i++;
   System.out.println(i);//10
}
```

最后打印的结果 是10, 如果是第一次接触看这个代码. 还是比较难猜出来的,但是如果从字节码指令的角度看这个问题 就非常简单呢,

对应的字节码:

```java
 0 bipush 10 //将10 压入操作数栈
 2 istore_1 //符给 局部变量表 索引为1的位置(给i赋值1)
 3 iload_1 // 将 局部变量表索引为1的值拷贝取出, 也就是10
 4 iinc 1 by 1 // 将局部变量表 索引为1的位置的数自增1, 也就是i自增1, 也就是i此时为11
 7 istore_1 // 将操作数栈的栈顶数据 也就是10 放入局部变量表索引为1的位置, 此时又将i赋值为10 
 8 getstatic2 <java/lang/System.out>
11 iload_1
12 invokevirtual5 <java/io/PrintStream.println>
15 return
```

> 比较运算符

比较指令的作用是比较栈顶两个元素的大小，并将比较结果入栈

比较指令有：dcmpg、dcmpl、fcmpg、fcmpl、lcmp

- 与前面讲解的指令类似，首字符 d 表示 double 类型，f 表示 float，l 表 示 long
- 对于 double 和 float 类型的数字，由于 NaN 的存在，各有两个版本的比 较指令，以 float 为例，有 fcmpg 和 fcmpl 两个指令，它们的区别在于在 数字比较时，若遇到 NaN 值，处理结果不同
- 指令 dcmpl 和 dcmpg 也是类似的，根据其命名可以推测其含义，在此不再 赘述
- 指令 lcmp 针对 long 型整数，由于 long 型整数没有 NaN 值，故无需准备两套指令

**举例：** 指令 fcmpg 和 fcmpl 都从栈中弹出两个操作数，并将它们做比较，设栈顶的元素为 v2， 栈顶顺位第 2 位元素为 v1，若 v1 = v2，则压入 0；若 v1 > v2 则 压入 1；若 v1  long --> float --> double

代码举例:

```java
    //针对于宽化类型转换的基本测试
    public void upCast1(){
        int i  = 10; 
        long l = i; //i2l
        float f = i; //i2f
        double d = i; //i2d
        float f1 = l; // l2f
        double d1 = l; //l2d
        double d2 = f1; //f2d
    }
```

> 精度损失问题

宽化类型转换是不会因为超过目标类型最大值而丢失信息的，例如，从 int 转换到 long，或者从 int 转换到 double，都不会丢失任何信息，转换前后的值是精确相等的

但是,从 int、long 类型数值转换到 float，或者 long 类型数值转换到 double 时，将可能发生丢失精度——可能丢失掉几个最低有效位上的值，转换后的浮点 数值是根据 IEEE754 最接近舍入模式所得到的正确整数数值。尽管宽化类型转换实际上是可能发生精度丢失的，但是这种转换永远不会导致 Java 虚拟机抛出运行时异常

代码举例:

```java
    public void upCast2(){
        int i = 123123123;
        float f = i;
        System.out.println(f);//123123120 , 丢失最低位3
        long l = 123123123123L;
        l = 123123123123123123L;
        double d = l;
        System.out.println(d);//123123123123123120, 丢失最低位3
    }
```

> byte char short 类型转换问题

从byte、char 和 short 类型到 int 类型的宽化类型转换实际上是不存在的，对于 byte 类型转换为 int，虚拟机并没有做实质性的转化处理，只是简单地通过操作数栈交换了两个数据。而 byte 转为 long 时，使用的是 i2l，可 以看到在内部 byte 在这里已经等同于 int 类型处理，类似的还有 short 类型， 这种处理方式有两个特点：

- 一方面可以减少实际的数据类型，如果为 short 和 byte 都准备一套指 令，那么指令的数量就会大增，而虚拟机目前的设计上，只愿意使用一 个字节表示指令，因此指令总数不能超过 256 个，为了节省指令资源， 将 short 和 byte 当作 int 处理也是情理之中
- 另一方面，由于局部变量表中的槽位固定为 32 位，无论是 byte 或者 short 存入局部变量表，都会占用 32 位空间。从这个角度来说，也没有必要特意区分这几种数据类型

代码举例:

```java
// 以byte为例    
public void upCast3(byte b){
        int i = b; //istore_2, 仅仅只是将数据存到 索引为2的位置,没有发生类型转换
        long l = b; //i2l
        double d = b; // i2d
    }
```

### 4.2 窄化类型转换

Java 虚拟机也直接支持以下窄化类型转换：

- 从 int 类型至 byte、short 或者 char 类型。对应的指令有：i2b、i2c、i2s
- 从 long 类型到 int 类型。对应的指令有：l2i
- 从 float 类型到 int 或者 long 类型。对应的指令有：f2i、f2l
- 从 double 类型到 int、long 或者 float 类型。对应的指令有：d2i、d2l、d2f

**精度损失问题:**

窄化类型转换可能会导致转换结果具备不同的正负号、不同的数量级，因此， 转换过程很可能会导致数值丢失精度

尽管数据类型窄化转换可能会发生上限溢出、下限溢出和精度丢失等情况， 但是 Java 虚拟机规范中明确规定数值类型的窄化转换指令永远不可能导致虚 拟机抛出运行时异常

代码举例:

```java
    //窄化类型转换的精度损失
    public void downCast4(){
        int i = 128;
        byte b = (byte)i;
        System.out.println(b); //-128 符号位 变化,精度丢失
    }
	//窄化类型转换
    //基本的使用
    public void downCast1(){
        int i = 10;
        byte b = (byte)i; //i2b
        short s = (short)i; //i2s
        char c = (char)i; //i2c
        long l = 10L;
        int i1 = (int)l; //l2i
        //没有 long , float , double 转 byte short char的指令,以long转byte为例
        byte b1 = (byte) l; // l2i->i2b  分两步转化
    }
```

**补充说明:**

**1、** 当一个浮点值窄化转换为整数类型T(T限于int或long类型之一)的时候，将遵循以下转换规则：；

- 如果浮点值是 NaN，那转换结果就是 int 或 long 类型的 0
- 如果浮点值不是无穷大的话，浮点值使用 IEEE754 的向零舍入模式取整，获得整数值 v，如果 v 在目标类型 T(int 或 long)的表示范围之内， 那转换结果就是 v。否则，将根据 v 的符号，转换为 T 所能表示的最大或者最小正数

代码举例:

```java
    public void downCast5(){
        double d1 = Double.NaN; // 等价于0.0 / 0.0
        int i = (int)d1;
        System.out.println(d1); //NaN
        System.out.println(i); // 0
    }
    public void downCast6(){
        double d2 = Double.POSITIVE_INFINITY; //无穷大
        long l = (long)d2;
        int j = (int)d2;
        System.out.println(l); //9223372036854775807 long的最大值
        System.out.println(Long.MAX_VALUE); //9223372036854775807 
        System.out.println(j); //2147483647 int最大值
        System.out.println(Integer.MAX_VALUE); //2147483647
    }
```

**1、** 当一个double类型窄化转换为float类型时，将遵循以下转换规则：；

通过向最接近数舍入模式舍入一个可以使用 float 类型表示的数字。最后结果根据下面这 3 条规则判断：

- 如果转换结果的绝对值太小而无法使用 float 来表示，将返回 float 类 型的正负零
- 如果转换结果的绝对值太大而无法使用 float 来表示，将返回 float 类 型的正负无穷大
- 对于 double 类型的 NaN 值将按规定转换为 float 类型的 NaN 值

## 5.对象的创建与访问指令

Java 是面向对象的程序设计语言，虚拟机平台从字节码层面就对面向对象做 了深层次的支持。有一系列指令专门用于对象操作，可进一步细分为创建指令、 字段访问指令、数组操作指令和类型检查指令

### 5.1 创建指令

虽然类实例和数组都是对象，但 Java 虚拟机对类实例和数组的创建与操作 使用了不同的字节码指令

**1、** 创建类实例的指令：；

`new`: 它接收一个操作数，为指向常量池的索引，表示要创建的类型，执行完成后， 将对象的引用压入栈

**2、** 创建数组的指令：；

- newarray：创建基本类型数组
- anewarray：创建引用类型数组
- multianewarray：创建多维数组

上述创建指令可以用于创建对象或者数组，由于对象和数组在 Java 中的广泛使 用，这些指令的使用频率也很高

代码举例:

```java
public class NewTest {
    //1.创建指令
    public void newInstance() {
        Object obj = new Object(); //new2 <java/lang/Object>
        File file = new File("atguigu.avi");// new3 <java/io/File>
    }
    public void newArray() {
        int[] intArray = new int[10]; //newarray 10 (int)
        Object[] objArray = new Object[10]; //anewarray2 <java/lang/Object>
        int[][] mintArray = new int[10][10];//multianewarray6 <[[I> dim 2
        String[][] strArray = new String[10][];//虽然看起来是个二维数组,但是由于其中一个没有设置长度,所以底层作为 一位数组创建,anewarray7 <[Ljava/lang/String;>
    }
}
```

### 5.2 字段访问指令

对象创建后，就可以通过对象访问指令获取对象实例或数组实例中的字段或者数组元素

- 访问类字段(static 字段，或者称为类变量)的指令：getstatic(将静态字段压入操作数栈)、putstatic (将静态字段赋值给静态字段)
- 访问类实例字段(非 static 字段，或者称为实例变量)的指令：getfield、putfield

举例：以 getstatic 指令为例，它含有一个操作数，为指向常量池的 Fieldref 索引， 它的作用就是获取 Fieldref 指定的对象或者值，并将其压入操作数栈

```java
public void sayHello() {
	System.out.println("Hello");
}
```

对应的字节码:

```java
0 getstatic8 <java/lang/System.out> //获取System类的静态字段out, 并压入操作数栈
3 ldc9 <Hello>
5 invokevirtual10 <java/io/PrintStream.println>
8 return
```

代码二:

```java
public class NewTest {
   public void setOrderId(){
        Order order = new Order(); // new11 <com/atguigu/java/Order>
        order.id = 1001; //putfield13 <com/atguigu/java/Order.id>
        System.out.println(order.id); //getstatic8 <java/lang/System.out> -> getfield13 <com/atguigu/java/Order.id>
        Order.name = "ORDER";//putstatic16 <com/atguigu/java/Order.name>
        System.out.println(Order.name); //getstatic8 <java/lang/System.out> ->getstatic16 <com/atguigu/java/Order.name>
    }
}
class Order{
    int id;
    static String name;
}
```

### 5.3 数组操作指令

数组操作指令主要有：xastore 和 xaload 指令。具体为：

- 把一个数组元素加载到操作数栈的指令：baload、caload、saload、iaload、 laload、faload、daload、aaload
- 将一个操作数栈的值存储到数组元素中的指令：bastore、castore、sastore、 iastore、lastore、fastore、dastore、aastore

见下列表格:

数组类型
加载指令(将数组中元素取出)
存储指令(将值赋值给数组中某个位置)

byte(boolean)
baload
bastore

char
caload
castore

short
saload
sastore

int
iaload
iastore

long
laload
lastore

float
faload
fastore

double
daload
dastore

reference
aaload
aastore

- 取数组长度的指令：arraylength ,该指令弹出栈顶的数组元素，获取数组的长度，将长度压入栈

说明:

- 指令 xaload 表示将数组的元素压栈，比如 saload、caload 分别表示压入 short 数组和 char 数组。指令 xaload 在执行时，要求操作数中栈顶元素为 数组索引 i，栈顶顺位第 2 个元素为数组引用 a，该指令会弹出栈顶这两个 元素，并将 a[i] 重新压入堆栈
- xastore 则专门针对数组操作，以 iastore 为例，它用于给一个 int 数组的给 定索引赋值。在 iastore 执行前，操作数栈顶需要以此准备 3 个元素：值、 索引、数组引用，iastore 会弹出这 3 个值，并将值赋给数组中指定索引的位 置

代码举例:

```java
 //3.数组操作指令
    public void setArray() {
        int[] intArray = new int[10]; // newarray 10 (int)
        intArray[3] = 20; //将20 赋值给数组中索引为3的位置,会先将即将赋的值,数组索引和数组下标值压入栈,再执行 iastore 指令
        System.out.println(intArray[1]); //先将数组数组索引 和 数组下标 压入栈,再执行iaload 指令
        boolean[] arr = new boolean[10]; 
        arr[1] = true;//也是使用 bastore 指令
    }
	 public void arrLength(){
        double[] arr = new double[10];
        System.out.println(arr.length); //arraylength 指令
    }
```

### 5.4 类型检查指令

检查类实例或数组类型的指令：instanceof、checkcast

- 指令 checkcast 用于检查类型强制转换是否可以进行。如果可以进行，那么 checkcast 指令不会改变操作数栈，否则它会抛出 ClassCastException 异常
- 指令 instanceof 用来判断给定对象是否是某一个类的实例，它会将判断结果 压入操作数栈

代码举例:

```java
    //4.类型检查指令
    public String checkCast(Object obj) {
        if (obj instanceof String) {// instanceof17 <java/lang/String>
            return (String) obj; //checkcast17 <java/lang/String>
        } else {
            return null;
        }
    }
```

## 6. 方法的调用与返回指令

### 6.1 方法调用指令

方法调用指令：invokevirtual、invokeinterface、invokespecial、invokestatic、 invokedynamic

- invokevirtual 指令用于调用对象的实例方法，根据对象的实际类型进行分派 (**虚方法分派**)，支持多态。这也是 Java 语言中最常见的方法分派方式
- invokeinterface 指令用于调用接口方法，它会在运行时搜索由特定对象所实 现的这接口方法，并找出适合的方法进行调用 (**虚方法**)
- invokespecial 指令用于调用一些需要特殊处理的实例方法，包括实例初始化方法(构造器)、私有方法和父类方法。这些方法都是**静态类型绑定**的，不会在调用时进行动态派发
- invokestatic 指令用于调用命名类中的类方法(static方法)。这是**静态绑定的**
- invokedynamic 调用动态绑定的方法，这个是 JDK 1.7 后新加入的指令。用 于在运行时动态解析出调用点限定符所引用的方法，并执行该方法。前面 4 条调用指令的分派逻辑都固化在 Java 虚拟机内部，而 invokedynamic 指令 的分派逻辑是由用户所设定的引导方法决定的

代码举例:

```java
public class MethodInvokeReturnTest {
    //方法调用指令:invokespecial:静态分派
    public void invoke1(){
        //情况1：类实例构造器方法：<init>()
        Date date = new Date();
        Thread t1 = new Thread();
        //情况2：父类的方法
        super.toString();
        //情况3：私有方法
        methodPrivate();
    }
    private void methodPrivate(){
    }
    //方法调用指令:invokestatic:静态分派
    public void invoke2(){
        methodStatic();
    }
    public static void methodStatic(){
    }
    //方法调用指令:invokeinterface
    public void invoke3(){
        Thread t1 = new Thread();
        ((Runnable)t1).run();
        Comparable<Integer> com = null;
        com.compareTo(123);
    }
    //方法调用指令:invokeVirtual:动态分派
    public void invoke4(){
        System.out.println("hello");
        Thread t1 = new Thread();
        t1.run();
    }
}
```

**注: 接口中的 静态方法调用使用invokestatic, 默认方法调用使用 invokeinterface**

### 6.2 方法返回指令

方法调用结束前，需要进行返回。方法返回指令是根据返回值的类型区分的

- 包括 ireturn(当返回值是 boolean、byte、char、short 和 int 类型时使用)、 lreturn、freturn、dreturn 和 areturn
- 另外还有一条 return 指令供声明为 void 的方法、实例初始化方法以及 类和接口的类初始化方法使用

返回类型
返回指令

void
return

int(boolean, byte ,char ,short)
ireturn

long
lreturn

float
freturn

double
dreturn

reference
areturn

通过ireturn 指令，将当前函数操作数栈的顶层元素弹出，并将这个元素压 入调用者函数的操作数栈中(因为调用者非常关心函数的返回值)，所有在当前函数操作数栈中的其他元素都会被丢弃

如果当前返回的是 synchronized方 法 ， 那么还会执行一个隐含的 monitorexit 指令，退出临界区 . 最后，会丢弃当前方法的整个帧，恢复调用者的帧，并将控制权转交给调用者

代码举例:

```java
public class MethodInvokeReturnTest {
    //方法的返回指令
    public int returnInt(){
        int i = 500;
        return i; //ireturn
    }
    public double returnDouble(){
        return 0.0; //dreturn
    }
    public String returnString(){
        return "hello,world"; //areturn
    }
    public int[] returnArr(){
        return null; //areturn
    }
    public float returnFloat(){
        int i = 10;
        return i; //freturn
    }
    public byte returnByte(){
        return 0; //ireturn
    }
    public void methodReturn(){
         //先执行方法,  invokevirtual17 <com/atguigu/java/MethodInvokeReturnTest.returnByte>
        // 然后再执行 istore_1 将操作数中上个方法返回的值放入到局部变量表索引为1的位置
        int i = returnByte();
    }
}
```

## 7. 操作数栈管理指令

如同操作一个普通数据结构中的堆栈那样，JVM 提供的操作数栈管理指令， 可以用于直接操作操作数栈的指令

这类指令包括如下内容：

- 将一个或两个元素从栈顶弹出，并且直接废弃：pop、pop2 (两个slot,不一定是两个值)
- 复制栈顶一个或两个数值并将复制值或双份的复制值重新压入栈顶：dup、 dup2、dup_x1、dup2_x1、du p_x2、dup2_x2
- 将栈最顶端的两个 Slot 数值位置交换：swap、Java 虚拟机没有提供交换两 个 64 位数据类型(long、double)数值的指令
- 指令 nop 是一个非常特殊的指令，它的字节码为 0x00。和汇编语言中的 nop 一样，它表示什么都不做，这条指令一般可用于调试、占位等 这些指令属于通用型，对栈的压入或者弹出无需知名数据类型

**说明:**

**1、** 不带_x的指令是复制栈顶数据并压入栈顶包括两个指令，dup和dup2，dup的系数代表要复制的Slot个数；

- dup 开头的指令用于复制 1 个 Slot 的数据。例如 1 个 int 或 1 个 reference 类型数据
- dup2 开头的指令用于复制 2 个 Slot 的数据。例如 1 个 long，或 2 个 int， 或 1 个 int 加 1 个 float 类型数据

**2、** 带_x的指令是复制栈顶数据并插入栈顶以下的某个位置共有4个指令，dup_x1、dup2_x1、dup_x2、dup2_x2对于带_x的复制插入指令，只要将指令的dup和x的系数相加，结果即为需要插入的位置(从复制的位置开始数),因此；

- dup_x1 插入位置：1+1=2，即复制栈顶一个slot,放到栈顶开始以下 1 个Slot 下面 (也就是第三个位置)
- dup_x2 插入位置：1+2=3，即复制栈顶一个slot, 放到 栈顶 下面两个 Slot的 下面
- dup2_x1 插入位置：2+1=3, 即复制栈顶两个slot, 放到栈顶开始 一 个 Slot的下面
- dup2_x2 插入位置：2+2=4 , 即复制栈顶两个slot ,放到栈顶开始 连个 Slot 的下面

**3、** pop：将栈顶的1个Slot数值出栈例如1个short类型数值；

**4、** pop2：将栈顶的2个Slot数值出栈例如1个double类型数值，或者2个int类型数值；

代码举例:

```java
public class StackOperateTest {
    public void print(){
        //在new 一个对象时,会在操作数栈中存一个 对象的地址值, 然后再赋值一份, 一份用于调用 <init> 方法
        //一份用于 赋值给 局部变量表
        //下面的指令:
        //new3 <java/lang/Object>
        //dup  拷贝一份
        //invokespecial1 <java/lang/Object.<init>>  消耗一份
        //astore_1 再消耗一份
        Object obj = new Object(); 
        //调用 toString 方法 会将方法的返回值 存放到操作数栈,
        //但是又没有使用, 所以会将其废弃
        //pop  弹出
        obj.toString();
    }
    //类似的
    public void foo(){
        bar(); //pop2  因为返回值是long型的, 占两个slot
    }
    public long bar(){
        return 0;
    }
    public long nextIndex() {
        return index++;
    }
    private long index = 10;
}
```

其他方法比较简单, 下面仔细研究一下 nextIndex 方法

指令:

```java
 0 aload_0  //加载局部变量表索引为0的位置,也就是this,本对象的地址值到操作数栈
 1 dup  // 拷贝一份 , 此时操作数栈中有两个 
 2 getfield2 <com/atguigu/java/StackOperateTest.index> // 获取 操作数栈顶的地址值表示的对象的index字段,消耗一个, 并将index的值 long型的10, 放入到操作数栈中
 5 dup2_x1 // 复制栈顶两个slot 的值,也就是10 ,放到下面一个的位置, 也就是剩下的一个this对象地址值slot的下面(放到了最下面,一个10 )
 6 lconst_1 // 存一个long型的1 到操作数栈中的栈顶位置
 7 ladd // 将栈顶的两个值相加,并将返回值 11 压入栈中
 8 putfield2 <com/atguigu/java/StackOperateTest.index>// 再将栈中的11, 赋值给操作数栈中仅剩的this地址值的对象的index字段中
11 lreturn// 此时操作数栈中 仅剩栈底的10,作为方法的返回值
```

根据上面指令的执行,可以推导出, 对象的字段index 在执行完后,变为11, 但是方法的返回值却是10, 符合实际运行的结果

## 8. 控制转移指令

程序流程离不开条件控制，为了支持条件跳转，虚拟机提供了大量字节码指 令，大体上可以分为比较指令、条件跳转指令、比较条件跳转指令、多条件分支 跳转指令、无条件跳转指令等

### 8.1 条件跳转指令

条件跳转指令通常和比较指令结合使用。在条件跳转指令执行前，一般可以 先用比较指令进行栈顶元素的准备，然后进行条件跳转 ,(**一般在条件条件跳转指令前,都会有一个比较指令,将-1,0,1 其中一个数压入操作数栈顶,然后跳转指令就会已此判断跳转位置**)

条件跳转指令有：ifeq、iflt、ifle、ifne、ifgt、ifge、ifnull、ifnonnull。这些指令都接收两个字节的操作数，用于计算跳转的位置(16 位符号整数作为当前位 置的 offset)

**它们的统一含义为：弹出栈顶元素，测试它是否满足某一条件，如果满足条 件，则跳转到给定位置**

具体说明:

指令
判断规则

ifeq
但栈顶int类型数值等于0时跳转

ifne
当栈顶int类型数值不等于0时跳转

iflt
当栈顶int类型数值小于0时跳转

ifle
当栈顶int类型数值小于等于0时跳转

ifgt
当栈顶int类型数值大于0时跳转

ifge
当栈顶int类型数值大于等于0时跳转

ifnull
为null时跳转

ifnonnull
不为null时跳转

**注意：**

**1、** 与前面运算规则一致；

- 对于 boolean、byte、char、short 类型的条件分支比较操作，都是使用 int 类型的比较指令完成
- 对于 long、float、double 类型的条件分支比较操作，则会先执行相应类 型的比较运算指令，运算指令会返回一个整型值到操作数栈中，随后再 执行 int 类型的条件分支比较操作来完成整个分支跳转

**2、** 由于各类型的比较最终都会转为int类型的比较操作，所以Java虚拟机提供的int类型的条件分支指令是最为丰富和强大的；

**举例:**

方法一:

```java
public void compare1(){
    int a = 0;
    if(a != 0){
        a = 10;
    }else{
        a = 20;
    }
}
```

对应的字节码:

```java
 0 iconst_0  //将0压入操作数栈
 1 istore_1  //存储在局部变量表索引为1的位置
 2 iload_1  //再取出
 3 ifeq 12 (+9) // ifeq,如果栈顶数据为0,则跳转到指定的 偏移量为12的指令位置,如果不满足则继续向下执行
 6 bipush 10
 8 istore_1
 9 goto 15 (+6)
12 bipush 20 // 本例为跳转到这个位置,  存储 20 到局部变量表
14 istore_1
15 return //退出
```

方法二:

```java
public boolean compareNull(String str){
    if(str == null){
        return true;
    }else{
        return false;
    }
}
```

对应的字节码:

```java
0 aload_1 // 将参数压入栈顶(本例中为参数 str)
1 ifnonnull 6 (+5) //如果不为null, 则跳转,如果为null,则不跳转,
4 iconst_1 //为null, 压入 1,代表true
5 ireturn
6 iconst_0 //不为 null, 压入0, 代表false
7 ireturn
```

方法三(此例说明,跳转指令只识别int的类型 ,其他类型的比较,都会先使用比较指令先进行计算):

```java
public void compare2() {
    float f1 = 9;
    float f2 = 10;
    System.out.println(f1 < f2);//true
}
```

对应的字节码:

```java
 0 ldc2 <9.0>
 2 fstore_1
 3 ldc3 <10.0>
 5 fstore_2   //上面的指令 存储值到局部变量表
 6 getstatic4 <java/lang/System.out> //获取out字段
 9 fload_1 //加载 9
10 fload_2 //加载 10
11 fcmpg //比较运算符,比较栈顶的两个数,此例返回 -1,并压入栈顶
12 ifge 19 (+7) //当栈顶数据大于等于0时跳转到 19
15 iconst_1 //此例不跳转 则压入 1
16 goto 20 (+4) //再跳到 打印方法执行处
19 iconst_0
20 invokevirtual5 <java/io/PrintStream.println> //打印 1转为true.
23 return
```

### 8.2 比较条件跳转指令

上面的条件跳转指令只能通过int类型判断,而且只能和0比较(**如果不是int型将会使用比较符转换**),那如果是两个int型数值比较,就可以使用比较条件跳转指令

比较条件跳转指令类似于比较指令和条件跳转指令的结合体，它将比较和跳 转两个步骤合二为一、

这类指令有：if_icmped、if_icmpne、if_icmplt、if_icmpgt、if_icmple、if_icmpge、 if_acmped 和 if_acmpne 其中指令助记符加上 "if_" 后，以字符 "i" 开头的指令针对 int 型整数操作 (也包括 short 和 byte 类型)，以字符 "a" 开头的指令表示对象引用的比较

具体说明:(前者为栈顶顺位第二个数,后者为栈顶数)

指令
比较规则

if_icmped
比较栈顶两int类型数值大小,当前者等于后者时跳转

if_icmpne
比较栈顶两int类型数值大小,当前者不等于后者时跳转

if_icmplt
比较栈顶两int类型数值大小,当前者小于后者时跳转

if_icmpgt
比较栈顶两int类型数值大小,当前者大于后者时跳转

if_icmple
比较栈顶两int类型数值大小,当前者小于等于后者时跳转

if_icmpge
比较栈顶两int类型数值大小,当前者大于等于后者时跳转

if_acmped
比较栈顶两int类型数值大小,当结果相等时跳转

if_acmpne
比较栈顶两int类型数值大小,当结果不想等时跳转

这些指令都接收两个字节的操作数作为参数，用于计算跳转的位置。同时在 执行指令时，栈顶需要准备两个元素进行比较。指令执行完成后，栈顶的这两个 元素被清空，且没有任何数据入栈。如果预设条件成立，则执行跳转，否则，继 续执行下一条语句

举例:

方法一:

```java
   public void ifCompare1(){
        int i = 10;
        int j = 20;
       // short s1 = 9;
      //  byte b1 = 10;
        System.out.println(i > j);
    }
```

对应字节码指令(如果比较short 和 byte,也当做int处理):

```java
 0 bipush 10
 2 istore_1
 3 bipush 20
 5 istore_2
 6 getstatic4 <java/lang/System.out>
 9 iload_1
10 iload_2  // 上面的指令是将,10,20 存入局部变量表,并加载到操作数栈中
11 if_icmple 18 (+7) //比较栈顶的两个数, 当栈顶小于等于下面的数时 跳转, 也就是 10 <=20, 跳转
14 iconst_1
15 goto 19 (+4)
18 iconst_0 //跳转到这,压0,
19 invokevirtual5 <java/io/PrintStream.println> //打印false
22 return
```

方法二:

```java
    public void ifCompare3() {
        Object obj1 = new Object();
        Object obj2 = new Object();
        System.out.println(obj1 == obj2);//false
        System.out.println(obj1 != obj2);//true
    }
```

对应字节码指令:

```java
 0 new10 <java/lang/Object>
 3 dup
 4 invokespecial1 <java/lang/Object.<init>>
 7 astore_1
 8 new10 <java/lang/Object>
11 dup
12 invokespecial1 <java/lang/Object.<init>>
15 astore_2
16 getstatic4 <java/lang/System.out>
19 aload_1
20 aload_2  // 上面的指令不做解释了
21 if_acmpne 28 (+7) //比较地址值,  不相等跳转,此例不相等,跳转
24 iconst_1
25 goto 29 (+4)
28 iconst_0 //跳到这,给0 
29 invokevirtual5 <java/io/PrintStream.println> //打印false
32 getstatic4 <java/lang/System.out>
35 aload_1
36 aload_2
37 if_acmpeq 44 (+7) // 相等跳转, 此例不想等,不跳转, 
40 iconst_1 //给1
41 goto 45 (+4)
44 iconst_0
45 invokevirtual5 <java/io/PrintStream.println> //打印true
48 return
```

### 8.3 多条件分支跳转

多条件分支跳转指令是专为 switch-case 语句设计的，主要有 tableswitch 和 lookupswitch

指令名称
描述

tableswitch
用于switch条件跳转, case值连续

lookupswitch
用于switch条件跳转, case值不连续

从助记符上看，两者都是 switch 语句的实现，它们的区别：

tableswitch 要求多个条件分支值是连续的，它内部只存放起始值和终止值， 以及若干个跳转偏移量，通过给定的操作数 index，可以立即定位到跳转偏 移量位置，因此效率比较高

lookupswitch 内部存放着各个离散的 case-offset 对，每次执行都要搜索全部的 case-offset 对，找到匹配的 case 值，并根据对应的 offset 计算跳转地址， 因此效率较低

指令tableswitch 的示意图如下图所示。由于 tableswitch 的 case 值是连续 的，因此只需要记录最低值和最高值，以及每一项对应的 offset 偏移量，根据 给定的 index 值通过简单的计算即可直接定位到 offset

指令lookupswitch 处理的是离散的 case 值，**但是出于效率考虑，将 case-offset 对按照 case 值大小排序**，给定 index 时，需要查找与 index 相等的 case，获得其 offset，如果找不到则跳转到 default。指令 lookupswitch 如下图

代码举例:

方法一: case 值是连续的,并且在 case2的位置没有break

```java
public void swtich1(int select){
    int num;
    switch(select){
        case 1:
            num = 10;
            break;
        case 2:
            num = 20;
            //break;
        case 3:
            num = 30;
            break;
        default:
            num = 40;
    }
}
```

对应的字节码:

```java
 0 iload_1
 1 tableswitch 1 to 3	1:  28 (+27)  //如果匹配1,则跳到偏移量为28的指令
	2:  34 (+33) //如果为2 则跳到34
	3:  37 (+36) //如果为3 则跳到37
	default:  43 (+42) //如果没有匹配的,则走这个
28 bipush 10
30 istore_2
31 goto 46 (+15)
34 bipush 20 //假设num值为2,跳到这个指令,将20压入栈
36 istore_2 //并赋值给 局部变量表索引为2的位置 也就是num
37 bipush 30 //但是由于 没有break ,继续执行 又压了一个 30
39 istore_2 //覆盖
40 goto 46 (+6) //gotodao 46
43 bipush 40
45 istore_2
46 return //方法结束
```

方法二: 不连续的

```java
    public void swtich2(int select){
        int num;
        switch(select){
            case 100:
                num = 10;
                break;
            case 500:
                num = 20;
                break;
            case 200:
                num = 30;
                break;
            default:
                num = 40;
        }
    }
```

对应字节码:

```java
 0 iload_1
 1 lookupswitch 3 //使用 了lookupswitch 指令,并对case集进行了排序
	100:  36 (+35)
	200:  48 (+47)
	500:  42 (+41)
	default:  54 (+53)
36 bipush 10
38 istore_2
39 goto 57 (+18)
42 bipush 20
44 istore_2
45 goto 57 (+12)
48 bipush 30
50 istore_2
51 goto 57 (+6)
54 bipush 40
56 istore_2
57 return
```

方法三: 对象String

```java
    //jdk7新特性：引入String类型
    public void swtich3(String season){
        switch(season){
            case "SPRING":break;
            case "SUMMER":break;
            case "AUTUMN":break;
            case "WINTER":break;
        }
    }
```

对应的字节码:

```java
  0 aload_1
  1 astore_2
  2 iconst_m1
  3 istore_3
  4 aload_2
  5 invokevirtual11 <java/lang/String.hashCode> //先调用变量season 的hashCode 方法
  8 lookupswitch 4  // 首先判断的就是 hashCode, 我们发现在编译期间, 这些常量就已经转换为hashCode了,并排了序
	-1842350579:  52 (+44)
	-1837878353:  66 (+58)
	-1734407483:  94 (+86)
	1941980694:  80 (+72)
	default:  105 (+97)
 52 aload_2 //如果是跳到这里
 53 ldc12 <SPRING>
 55 invokevirtual13 <java/lang/String.equals> //再比较通过equals 方法比较
 58 ifeq 105 (+47) //通过判断指令判断 是否一样,再压入0或1, 再在最下面通过 tableswitch 指令进行跳转
 61 iconst_0
 62 istore_3
 63 goto 105 (+42)
 66 aload_2
 67 ldc14 <SUMMER>
 69 invokevirtual13 <java/lang/String.equals>
 72 ifeq 105 (+33)
 75 iconst_1
 76 istore_3
 77 goto 105 (+28)
 80 aload_2
 81 ldc15 <AUTUMN>
 83 invokevirtual13 <java/lang/String.equals>
 86 ifeq 105 (+19)
 89 iconst_2
 90 istore_3
 91 goto 105 (+14)
 94 aload_2
 95 ldc16 <WINTER>
 97 invokevirtual13 <java/lang/String.equals>
100 ifeq 105 (+5)
103 iconst_3
104 istore_3
105 iload_3
106 tableswitch 0 to 3	0:  136 (+30) //实际跳转
	1:  139 (+33)
	2:  142 (+36)
	3:  145 (+39)
	default:  145 (+39)
136 goto 145 (+9)
139 goto 145 (+6)
142 goto 145 (+3)
145 return
```

### 8.4 无条件跳转

目前主要的无条件跳转指令为 goto，指令 goto 接收两个字节的操作数，共 同组成一个带符号的整数，用于指定指令的偏移量，指令执行的目的就是跳转到 偏移量给定的位置处

如果指令偏移量太大，超过双字节的带符号整数的范围，则可以使用指令 goto_w，它和 goto 有相同的作用，但是它接收 4 个字节的操作数，可以表示更 大的地址范围

指令jsr、jsr_w、ret 虽然也是无条件跳转的，但主要用于 try-finally 语句， 且已经被虚拟机逐渐废弃，故不在这里介绍这两个指令

指令名称
描述

goto
无条件跳转

goto_w
无条件跳转(宽索引)

jsr
跳转至指定16位offset位置,并将jsr下一条指令地址压入栈顶

jsr_w
跳转至指定32位offset位置,并将jsr_w下一条指令地址压入栈顶

ret
返回至由指定的局部变量所给出的指令位置(一般与jsr,jsr_w联合使用)

代码举例:

```java
    //4.无条件跳转指令
    public void whileInt() {
        int i = 0;
        while (i < 100) {
            String s = "atguigu.com";
            i++;
        }
    }
```

对应的字节码:

```java
 0 iconst_0
 1 istore_1
 2 iload_1
 3 bipush 100 // 将100 压入栈
 5 if_icmpge 17 (+12) //如果i大于等于100 时跳转
 8 ldc17 <atguigu.com> 
10 astore_2 //如果不跳转 将字符串赋值给 s
11 iinc 1 by 1 // 局部变量索引为1的 自增1
14 goto 2 (-12) // goto到while起始位置
17 return
```

**注: 如果比较条件不是int型,要稍微复杂一点, 自增也不是这种方式, 如果改为int型的 for循环, 指令没有任何变化**

## 9. 异常处理指令

### 9.1 抛出异常指令

1．athrow 指令

在Java 程序中显式抛出异常的操作(throw 语句)都是由 athrow 指令来实现的

除了使用 throw 语句显式抛出异常情况之外，JVM 规范还规定了许多运行 时一场会在其它 Java 虚拟机指令检测到异常状况时自动抛出。

例如，在之前介绍的整数运算时，当除数为零时，虚拟机会在 idiv 或 ldiv 指令中抛出 ArithmeticException 异常

**注意**

正常情况下，操作数栈的压入弹出都是一条条指令完成的。唯一的例外情况 是在抛异常时，Java 虚拟机会清除操作数栈上的所有内容，而后将异常实例压 入调用者操作数栈上

> 异常及异常的处理

过程一：异常对象的生成过程 ---> throw(手动/自动) ---> 指令：athrow

过程二：异常的处理：抓抛模型 try-catch-finally ---> 使用异常表

代码举例:

```java
    public void throwZero(int i){
        if(i == 0){
            throw new RuntimeException("参数值为0");
        }
        System.out.println("success");
    }
```

对应的字节码指令:

```java
 0 iload_1
 1 ifne 14 (+13)  //不等于0 时跳转
 4 new2 <java/lang/RuntimeException> //如果等于0, 则不跳转 new 了一个异常对象
 7 dup
 8 ldc3 <参数值为0>
10 invokespecial4 <java/lang/RuntimeException.<init>> //调用构造方法
13 athrow //使用 athrow 指令,将此对象压入栈,并且下面的指令将不在执行
14 getstatic5 <java/lang/System.out> //不等于0 时跳转到这,进行打印
17 ldc6 <success>
19 invokevirtual7 <java/io/PrintStream.println>
22 return
```

### 9.2 异常处理指令

**1、** 处理异常；

在 Java 虚拟机中，处理异常(catch 语句)不是由字节码指令来实现的(早期 使用 jsr、ret 指令)，而是采用异常表来完成的
**2、** 异常表；

如果一个方法定义了一个 try-catch 或者 try-finally 的异常处理，就会创建 一个异常表。它包含了每个异常处理或者 finally 块的信息。异常表保存了每个 异常处理信息。比如：

- 起始位置
- 结束位置
- 程序计数器记录的代码处理的偏移地址
- 被捕获的异常类在常量池中的索引

**当一个异常被抛出时，JVM 会在当前的方法里寻找一个匹配的处理，如果没有找到，这个方法会强制结束并弹出当前栈帧** ,并且异常会重新抛给上层 调用的方法(在调用方法栈帧)。如果在所有栈帧弹出前仍然没有找到合适的异常处理，这个线程将终止。如果这个异常在最后一个非守护线程里抛出，将会导致 JVM 自己终止，比如这个线程是个 main 线程

**不管什么时候抛出异常，如果异常处理最终匹配了所有异常类型，代码就会继续执行。** 在这种情况下， 如果方法结束后没有抛出异常，仍然执行 finally 块，在 return 前，它直接跳到 finally 块来完成目标

代码举例:

方法一:

```java
public void tryCatch(){
    try{
        File file = new File("d:/hello.txt");
        FileInputStream fis = new FileInputStream(file);
        String info = "hello!";
    }catch (FileNotFoundException e) {
        e.printStackTrace();
    }
    catch(RuntimeException e){
        e.printStackTrace();
    }
}
```

异常处理表:

对应字节码:

```java
 0 new10 <java/io/File>
 3 dup
 4 ldc11 <d:/hello.txt>
 6 invokespecial12 <java/io/File.<init>>
 9 astore_1
10 new13 <java/io/FileInputStream>
13 dup
14 aload_1
15 invokespecial14 <java/io/FileInputStream.<init>>
18 astore_2
19 ldc15 <hello!>
21 astore_3
22 goto 38 (+16) // 上面的代码都是 try块中的代码指令, 如果全部正常执行完成,将跳转到return指令,正常退出方法
25 astore_1  //根据异常处理表得知,如果代码中出现 FileNotFoundException 异常,则跳转到 该指令, 将异常对象存在局部变量表索引为1的地方
26 aload_1 //加载此异常对象
27 invokevirtual17 <java/io/FileNotFoundException.printStackTrace> //调用打印方法
30 goto 38 (+8) // 正常退出
33 astore_1 //如果没有被FileNotFoundException异常处理捕获,而是RuntimeException 类型的,则 跳到这里
34 aload_1
35 invokevirtual18 <java/lang/RuntimeException.printStackTrace> //同样打印方法
38 return //正常退出
```

**看一个非常经典的题目:**

```java
//思考：如下方法返回结果为多少？
public static String func() {
    String str = "hello";
    try{
        return str;
    }
    finally{
        str = "atguigu";
    }
}
```

这个方法最后返回的结果是什么呢? 结果是"hello" ,下面通过字节码的角度看一下执行过程

对应的字节码:可以看出 此方法无论如何都是返回"hello"

```java
 0 ldc19 <hello> 
 2 astore_0//将hello  赋值给str
 //后面就是finally 的内容
 3 aload_0 //再加载出来
 4 astore_1 //再赋值给索引为1的位置, 相当于复制一份
 5 ldc20 <atguigu> 
 7 astore_0 // 再将 atguigu 字符串赋值给 str
 8 aload_1 //再取出索引为1的内容,即原来的hello
 9 areturn //返回,也就是hello
10 astore_2
11 ldc20 <atguigu>
13 astore_0
14 aload_2
15 athrow
```

异常处理表:

可以看出, 监控的范围为 3 -5 指令位置, 也就是 try块中的位置,监控的异常类型是any,任何一个

如果捕获到,则跳转到 10的位置,并给str变量赋值 "atguigu",体现了finally的作用

## 10 同步控制指令

Java 虚拟机支持两种同步结构：方法级同步 和 方法内部一段指令序列的同 步，这两种同步都是使用 monitor 来支持的

> 方法级的同步

方法级的同步：是隐式的，即无需通过字节码指令来控制，它实现在方法调 用 和 返 回 操 作 之 中 。 虚 拟 机 可 以 从 方 法 常 量 池 的 方 法 表 结 构 中 的 ACC_SYNCHRONIZED 访问标志得知一个方法是否声明为同步方法

当调用方法时，调用指令将会检查方法的 ACC_SYNCHRONIZED 访问标志 是否设置

- 如果设置了，执行线程将先持有同步锁，然后执行方法，最后在方法完成(无 论是正常完成还是非正常完成)时释放同步锁
- 在方法执行期间，执行线程持有了同步锁，其它任何线程都无法再获得同一 个锁
- 如果一个同步方法执行期间抛出了异常，并且在方法内部无法处理此异常， 那么这个同步方法所持有的锁将在异常抛到同步方法之外时自动释放

举例:

```java
private int i = 0;
public synchronized void add() {
	i++;
}
```

对应的字节码:

```java
0 aload_0
1 dup
2 getdield2 <com/atguigu/java1/SynchronizedTest.i>
5 iconst_1
6 iadd
7 putfield2 <com/atguigu/java1/SynchronizedTest.i>
10 return
```

**说明:**

这段代码和普通的无同步操作的代码没有什么不同，没有使用 monitorenter 和 monitorexit 进行同步区控制。

这是因为，对于同步方法而言，当虚拟机通过 方法的访问标识符判断是一个同步方法时，会自动在方法调用前进行加锁，当同 步方法执行完毕后，不管方法是正常结束还是有异常抛出，均会由虚拟机释放这个锁。因此，对于同步方法而言，monitorenter 和 monitorexit 指令是隐式存在的，并未直接出现在字节码中

但是出现在了方法的修饰上:

> 方法内指定指令序列的同步

同步一段指令集序列：通常是由 Java 中的 synchronized 语句块来表示的。 JVM 的指令集有 monitorenter 和 monitorexit 两条指令来支持 synchronized 关键字的语义

**1、** 当一个线程进入同步代码块时，它使用monitorenter指令请求进入如果当前对象的监视器计数器为0，则它会被准许进入，若为1，则判断持有当前监视器的线程是否为自己，如果是，则进入(**可重入**)，否则进行等待，知道对象的监视器计数器为0，才会被允许进入同步块；

**2、** 当线程退出同步块时，需要使用monitorexit声明退出在Java虚拟机中，任何对象都有一个监视器与之相关联，用来判断对象是否被锁定，当监视器被持有后，对象处于锁定状态；

**3、** 指令monitorenter和monitorexit在执行时，都需要在操作数栈顶压入对象，之后monitorenter和monitorexit的锁定和释放都是针对这个对象的监视器进行的；

**4、** 编译器必须确保无论方法通过何种方式完成，方法中调用过的每条monitorenter指令都必须执行其对应的monitorexit指令，而无论这个方法是正常结束还是异常结束；

**5、** 为了保证在方法异常完成时monitorenter和monitorexit指令依然可以正确配对执行，编译器会自动产生一个异常处理器，这个异常处理器声明可处理所有的异常，它的目的就是用来执行monitorexit指令；

代码举例:

```java
private int i = 0;   
private Object obj = new Object();
public void subtract(){
    synchronized (obj){
        i--;
    }
}
```

对应的字节码指令:

```java
 0 aload_0
 1 getfield4 <com/atguigu/java1/SynchronizedTest.obj>
 4 dup
 5 astore_1 // 上面的指令将monitorenter 指令需要的锁对象,也就是 字段obj 压入栈中
 6 monitorenter //判断 此对象是否锁标识是否为0, 或者是否是本线程持有,
 7 aload_0 //执行i-- 代码
 8 dup
 9 getfield2 <com/atguigu/java1/SynchronizedTest.i>
12 iconst_1
13 isub
14 putfield2 <com/atguigu/java1/SynchronizedTest.i>
17 aload_1  //代码结束
18 monitorexit // 释放锁
19 goto 27 (+8) //如果没有异常, 方法退出
22 astore_2
23 aload_1
24 monitorexit
25 aload_2
26 athrow
27 return
```

自己生成的异常处理表:

根据表中得知,

**1、** 如果在monitorenter监控区内,(临界区),发生错误,则跳转到22行后面,进行释放锁操作；

**2、** 如果在释放锁的过程中发生异常,再跳转到22指令,重新释放；
