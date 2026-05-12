# 05、JVM 实战 - JVM虚拟机栈
- 来源：https://ddkk.com/zhuanlan/java/jvm/3/5.html
- 分类：JVM 实战
- 分组：教程目录
## 1.概述

说到jvm 其中让人印象最深的就是栈和堆,也是 jvm中占用内存最大的两个地方.

从宏观上来看**栈是运行时的单位，而堆是存储的单位** ,栈解决程序的运行问题，即程序如何执行，或者说如何处理数据。堆解决的是数据存储的问题，即数据怎么放，放哪里.

那么对于 jvm来说 , 运行时数据的结构为什么要设计成 栈的结构呢

**1、****由于跨平台性的设计，Java的指令都是根据栈结构来设计的**不同平台CPU架构不同，所以不能设计为基于寄存器的；

**2、****优点是跨平台，指令集小，编译器容易实现，缺点是性能下降，实现同样的功能需要更多的指令**；

## 2. 存储内容

Java虚拟机栈（Java Virtual Machine Stack），早期也叫Java栈。每个线程在创建时都会创建一个虚拟机栈，其内部保存一个个的栈帧（Stack Frame），每个栈帧对应着一次次的Java方法调用，

**栈是线程私有的 ,随着线程的创建而创建,随着线程的介绍而销毁**

**作用:**

主管Java程序的运行，它保存方法的局部变量（8 种基本数据类型、对象的引用地址）、部分结果，并参与方法的调用和返回。

**特点:**

栈是一种快速有效的分配存储方式，访问速度仅次于程序计数器。JVM直接对Java栈的操作只有两个：

**1、** 每个方法执行，伴随着**进栈**（入栈、压栈）；

**2、** 执行结束后的**出栈**工作；

因此虚拟机栈 这个空间 不会存在垃圾回收问题 ,但是会有 内存溢出的可能

## 3. 虚拟机栈内存问题

Java 虚拟机规范允许Java栈的大小**是动态的或者是固定不变的**。如果指定为固定长度,可以在jvm启动时指定每个 虚拟机栈的最大容量

使用参数 **-Xss** 选项来设置线程的最大栈空间，栈的大小直接决定了函数调用的最大可达深度。

```java
-Xss1024m		// 栈内存为 1024MBS
-Xss1024k		// 栈内存为 1024KB
```

代码示例:

这是一段无限递归调用的代码,将无限压栈,最终将导致栈内存溢出,

```java
public class StackErrorTest {
    private static int count = 1;
    public static void main(String[] args) {
        System.out.println(count);
        count++;
        main(args);
    }
}
```

没有设置任何初始参数,程序在递归 11418次后 溢出

当我们将 栈内存设置为 256KB 后, 在递归 2471 次后 就溢出了

**栈中可能出现的异常**

**1、** 如果线程请求分配的栈容量超过Java虚拟机栈允许的最大容量，Java虚拟机将会抛出一个**StackoverflowError**异常；

**2、** 如果Java虚拟机栈可以动态扩展，并且在尝试扩展的时候无法申请到足够的内存，或者在创建新的线程时没有足够的内存去创建对应的虚拟机栈，那Java虚拟机将会抛出一个**OutofMemoryError**异常；

## 4. 栈的运行原理

前面说到,每个线程都有自己的栈，栈中的数据都是以栈帧（Stack Frame）的格式存在,在这个线程上正在执行的每个方法都各自对应一个栈帧（Stack Frame）。栈帧是一个内存区块，是一个数据集，维系着方法执行过程中的各种数据信息。

那么当程序运行过程中, 栈中的结构是如果运转的呢:

**1、** JVM直接对Java栈的操作只有两个，就是对栈帧的**压栈和出栈**，遵循先进后出（后进先出）原则；

**2、** 在一条活动线程中，一个时间点上，只会有一个活动的栈帧即只有当前正在执行的方法的栈帧（栈顶栈帧）是有效的；

- 这个栈帧被称为当前栈帧（Current Frame）
- 与当前栈帧相对应的方法就是当前方法（Current Method
- 定义这个方法的类就是当前类（Current Class
**3、** 执行引擎运行的所有字节码指令只针对当前栈帧进行操作；

**4、** 如果在该方法中调用了其他方法，对应的新的栈帧会被创建出来，放在栈的顶端，成为新的当前帧；

**5、** 不同线程中所包含的栈帧是不允许存在相互引用的，即不可能在一个栈帧之中引用另外一个线程的栈帧；

**6、** 如果当前方法调用了其他方法，方法返回之际，当前栈帧会传回此方法的执行结果给前一个栈帧，接着，虚拟机会丢弃当前栈帧，使得前一个栈帧重新成为当前栈帧；

**7、** Java方法有两种返回函数的方式，但不管使用哪种方式，都会导致栈帧被弹出；
- 一种是正常的函数返回，使用return指令(即使返回值定义为void ,方法的结尾仍然是已return 结束)
- 另外一种是抛出异常

## 5. 栈帧的内部结构

根据上面的内容 得知,栈中存储的单位 为 每个方法对应的每个栈帧,, 那么 每个栈帧里面 又有哪些结构呢

**1、****局部变量表**（LocalVariables）；

**2、****操作数栈**（OperandStack）（或表达式栈）；

**3、** 动态链接（DynamicLinking）（指向运行时常量池的方法引用）；

**4、** 方法返回地址（ReturnAddress）（方法正常退出或者异常退出的定义）；

**5、** 一些附加信息；

## 6. 局部变量表

**1、** 局部变量表：**LocalVariables，被称之为局部变量数组或本地变量表**；

**2、** 定义为一个**数字数组(因为其他数据类型都可以使用数字类型存储)**，主要用于**存储方法参数和定义在方法体内的局部变量**，这些数据类型包括各类基本数据类型、对象引用（reference），以及returnAddress类型；

**3、** 由于局部变量表是建立在线程的栈上，是线程的私有数据，因此**不存在数据安全问题**；

**4、****局部变量表所需的容量大小是在编译期确定下来的**，并保存在方法的Code属性的**maximumlocalvariables**数据项中在方法运行期间是不会改变局部变量表的大小的；

**5、** 方法嵌套调用的次数由栈的大小决定一般来说，栈越大，方法嵌套调用次数越多；

- 对一个函数而言，它的参数和局部变量越多，使得局部变量表膨胀，它的栈帧就越大，以满足方法调用所需传递的信息增大的需求。
- 进而函数调用就会占用更多的栈空间，导致其嵌套调用次数就会减少。
**6、** 局部变量表中的变量只在当前方法调用中有效；
- 在方法执行时，虚拟机通过使用局部变量表完成参数值到参数变量列表的传递过程。
- 当方法调用结束后，随着方法栈帧的销毁，局部变量表也会随之销毁。

为什么说 局部变量表的大小在编译期就已经确定下来了

代码:

```java
public class LocalVariablesTest {
    private int count = 0;
    public static void main(String[] args) {
        LocalVariablesTest test = new LocalVariablesTest();
        int num = 10;
        test.test1();
    }
    public void test1() {
        Date date = new Date();
        String name1 = "atguigu.com";
        test2(date, name1);
        System.out.println(date + name1);
    }
    public String test2(Date dateP, String name2) {
        dateP = null;
        name2 = "songhongkang";
        double weight = 130.5;//占据两个slot
        char gender = '男';
        return dateP + name2;
    }
}
```

使用javap 解析出的字节码指令:

所以,在编译期间，局部变量的个数、每个局部变量的大小都已经被记录下来,局部变量表所需的容量大小是在编译期确定下来的

## 7. 使用 jclasslib 插件 查看class字节码

下面需要看看字节码 文件中 对于方法的一些描述信息,但是 原生解析出的字节码不是很好看,可以使用 idea的插件jclasslib 工具

实例代码: 非常普通的 main方法

```java
public static void main(String[] args) {
        LocalVariablesTest test = new LocalVariablesTest();
        int num = 10;
        test.test1();
}
```

**1、** 方法名返回值类型,权限修饰；

**1、** 本方法字节码指令集；

**1、** 方法异常信息表；

**1、** 其他项(局部变量表长度,字节码指令长度)；

**1、** 字节码指令行号和原始java代码行号的对应关系；

**1、** 局部变量在字节码指令中哪个位置生效,生效的长度是多少；

## 8. Slot 槽

上面说到,局部变量存放于局部变量表中,而局部变量表中 则是以 Slot (变量槽) 的方式存储

**1、** 参数值的存放总是从局部变量数组索引0的位置开始，到数组长度-1的索引结束(**局部变量表本身就是一个数组**)；

**2、** 局部变量表，最基本的存储单元是Slot（变量槽），局部变量表中存放编译期可知的各种基本数据类型（8种），引用类型（reference），returnAddress类型的变量；

**3、** 在局部变量表里，32位以内的类型只占用一个slot（包括returnAddress类型），64位的类型占用两个slot（long和double）；

**4、** JVM会为局部变量表中的每一个Slot都分配一个访问索引，通过这个索引即可成功访问到局部变量表中指定的局部变量值；

**5、** 当一个实例方法被调用的时候，它的方法参数和方法体内部定义的局部变量将会按照顺序被复制到局部变量表中的每一个slot上；

**6、** 如果需要访问局部变量表中一个64bit的局部变量值时，只需要使用前一个索引即可（**比如：访问long或double类型变量,他们占用两个slot,访问第一个slot的索引即可**）；

**7、****如果当前帧是由构造方法或者实例方法创建的，那么该对象引用this将会存放在index为0的slot处，其余的参数按照参数表顺序继续排列**；

示意图:

示例代码1:

```java
public void test3() {
    this.count++;
}
```

可以看到 this 也以局部变量的形式存放于局部变量表中,并指向访问调用的对象实例 ,这也是普通方法,构造方法可以使用this关键字访问本身的原因,而static 修饰的方式,则没有存放这个 this变量,所以在内部则无法使用

示例代码2:

```java
public String test2(Date dateP, String name2) {
    dateP = null;
    name2 = "songhongkang";
    double weight = 130.5;//占据两个slot
    char gender = '男';
    return dateP + name2;
}
```

通过字节码可以清楚的看到, double类型的 weight 占用两个 位置, index索引直接跳了两位

**slot的重复利用问题**

栈帧中的局部变量表中的槽位是可以重用的，如果一个局部变量过了其作用域，那么在其作用域之后申明新的局部变量变就很有可能会复用过期局部变量的槽位，从而达到节省资源的目的。

实例代码:

```java
public void test4() {
    int a = 0;
    {
        //b的作用域 在括号结束后 将结束,那么将回收 b 占用局部变量表中的slot位置
        int b = 0;
        b = a + 1;
    }
    //变量c使用之前已经销毁的变量b占据的slot的位置
    int c = a + 1;
}
```

## 9. jvm中 变量的分类

按照数据类型分：

**1、** 基本数据类型；

**2、** 引用数据类型；

按照在类中声明的方式分

**1、** 基本类型静态类变量:linking的prepare阶段：给类变量默认赋值；

**2、** 引用类型静态类变量:initial阶段：给类变量显式赋值即静态代码块赋值；

**3、** 普通成员变量(实例变量)：随着对象的创建，会在堆空间中分配实例变量空间，并进行默认赋值；

**4、** 局部变量：在使用前，必须要进行显式赋值的！否则，编译不通过，；

```java
public void test5Temp(){
       int num;
       System.out.println(num);//错误信息：变量num未进行初始化
    }
```

在局部变量未初始化时,无法使用,这是因为对象在初始化后才加入到 局部变量表,

**补充说明**

**1、** 在栈帧中，与性能调优关系最为密切的部分就是前面提到的局部变量表在方法执行时，虚拟机使用局部变量表完成方法的传递；

**2、****局部变量表中的变量也是重要的垃圾回收根节点**，只要被局部变量表中直接或间接引用的对象都不会被回收；

## 10 操作数栈

栈帧中又一个非常重要的 组件, 操作数栈(Operand Stack), 也是栈的结构**,是由数组实现的**, 用来保存 指令执行时的各种数据临时保存,很多特点和 局部变量表类似

**1、** 每一个独立的栈帧除了包含局部变量表以外，还包含一个后进先出（Last-In-First-Out）的操作数栈，也可以称之为**表达式栈**（ExpressionStack）；

**2、** 操作数栈，在方法执行过程中，**根据字节码指令，往栈中写入数据或提取数据**，即入栈（push）和出栈（pop）；

**3、** 某些字节码指令将值压入操作数栈，其余的字节码指令将操作数取出栈使用它们后再把结果压入栈，比如：执行复制、交换、求和等操作；

另外我们说 jvm的解释引擎 是基于栈的执行引擎,其中的栈就是指操作数栈,在一个方法中,所有需要的 局部变量等都存放在 局部变量表(包括局部变量表中的数据也是由操作数栈中产生并赋值),

然后由字节码指令复制出这些数据,拷贝到操作数栈,在操作数栈中 进行运算,得出的结果也是保存在操作数栈中,最后将结果 再覆盖回原先的位置,这就是jvm 运行的核心

**特点:**

**1、** 操作数栈，**主要用于保存计算过程的中间结果，同时作为计算过程中变量临时的存储空间**；

**2、** 操作数栈就是JVM执行引擎的一个工作区，当一个方法刚开始执行的时候，一个新的栈帧也会随之被创建出来，这时方法的操作数栈是空的（这个时候数组是有长度的，只是操作数栈为空）；

**3、** 每一个操作数栈都会拥有一个明确的栈深度用于存储数值，其所需的**最大深度在编译期就定义好了**，保存在方法的属性中，为**maxstack**的值；

**4、** 栈中的任何一个元素都是可以任意的Java数据类型；

- 32bit的类型占用一个栈单位深度
- 64bit的类型占用两个栈单位深度
**5、** 操作数栈并非采用访问索引的方式来进行数据访问的，而是**只能通过标准的入栈和出栈操作来完成一次数据访问**；

**6、** 如果被调用的方法带有返回值的话，其**返回值将会被压入当前栈帧的操作数栈中**，并更新PC寄存器中下一条需要执行的字节码指令；

**7、** 操作数栈中元素的数据类型必须与字节码指令的序列严格匹配，这由编译器在编译器期间进行验证，同时在类加载过程中的类检验阶段的数据流分析阶段要再次验证；

代码演示:

```java
public void testAddOperation() {
    byte i = 15;
    int j = 8;
    int k = i + j;
}
```

上面的代码 解析出的字节码:

```java
 0 bipush 15 
 2 istore_1
 3 bipush 8
 5 istore_2
 6 iload_1
 7 iload_2
 8 iadd
 9 istore_3
10 return
```

指令执行流程:

第一条语句，PC寄存器指向的是0，也就是指令地址为0，然后使用bipush让操作数15入操作数栈。

此时PC寄存器 指向第二条指令 ,执行,将 操作数栈中的数据弹出赋值到 局部变量表中 索引为1的位置(0位置为this)

继续向下执行, 操作数8 也入栈

下一个指令 同样将8 弹出,并赋值到 局部变量表中索引为2的位置

然后从局部变量表中取出索引为 1 和 2的位置的数据，依次将放在操作数栈中，

然后将操作数栈中的两个元素执行相加操作，并存储在局部变量表3的位置

在上面的指令中,可以看到, 当定义 int 类型 8 时, 压入的操作数栈的类型为byte`bipush 8` 这是因为 jvm向操作数栈中 存放数据时,以最小的方式存放, 如果存放的数据超过byte 则以 short 依次向上

**关于调用方法，返回值入操作数栈的说明**

上面描述中说到,当方法有返回值时,会将返回值也压入栈.

```java
public int getSum(){
    int m = 10;
    int n = 20;
    int k = m + n;
    return k;
}
public void testGetSum(){
    //获取上一个栈桢返回的结果，并保存在操作数栈中
    int i = getSum();
    int j = 10;
}
```

方法的最后,执行ireturn指令

testGetSum() 方法字节码指令：一上来就加载 getSum() 方法的返回值

**关于 i++ 和 ++i 的问题**

这个问题 相信只要是 学java的都遇到过,一般都是记做, 先赋值再运算,或者先运算再赋值,那么如果现在用 指令的方式查看,再结合 操作数栈,将会非常清楚了

**i++:**

```java
int i3 = 10;
int i4 = i3++;
```

(前面还有代码 不要在意指令的细节)

```java
12 bipush 10 //将10 压入操作数栈
14 istore_3  // 存放到 局部变量表中
15 iload_3   //取出 i3 的值10,并压入操作数栈
16 iinc 3 by 1 // 将i3(3为局部变量表索引3 可不是i3的意思) 执行+1 操作
19 istore 4  //将操作数栈中的数据赋值到 i4中
```

那么此时的 i3=11 , i4 等于10

**++i:**

```java
int i5 = 10;
int i6 = ++i5;
```

```java
21 bipush 10  //将 10 压入操作数栈
23 istore 5   // 将操作数栈中的 10 保存到变量 i5 中
25 iinc 5 by 1  //变量 i5 执行 +1 操作
28 iload 5  // 将变量 i5 的值（11）加载至操作数栈中
30 istore 6  //将操作数栈中的值保存至变量 i6 中（11）
```

那么此时的 i5 和 i6 都为11

**栈顶缓存技术了解**

栈顶缓存技术：Top Of Stack Cashing

**1、** 前面提过，基于栈式架构的虚拟机所使用的零地址指令更加紧凑，但完成一项操作的时候必然需要使用更多的入栈和出栈指令，这同时也就意味着将需要更多的指令分派（instructiondispatch）次数和内存读/写次数；

**2、** 由于操作数是存储在内存中的，因此频繁地执行内存读/写操作必然会影响执行速度为了解决这个问题，HotSpotJVM的设计者们提出了栈顶缓存（Tos，Top-of-StackCashing）技术，将栈顶元素全部缓存在物理CPU的寄存器中，以此降低对内存的读/写次数，提升执行引擎的执行效率；

**3、** 寄存器的主要优点：指令更少，执行速度快；

## 11 动态链接

前面说到 栈中的每个栈帧都代表着一个方法的调用, 那么在栈帧中,又怎么去联系到 方法本身的呢,靠的就是 动态链接

**1、** 每一个栈帧内部都包含**一个指向运行时常量池中该栈帧所属方法的引用**；

**2、** 包含这个引用的目的就是**为了支持当前方法的代码能够实现动态链接**（DynamicLinking），比如：invokedynamic指令；

**3、** 在Java源文件被编译到字节码文件中时，**所有的变量和方法引用都作为符号引用（SymbolicReference）保存在class文件的常量池里**；

**4、** 比如：描述一个方法调用了另外的其他方法时，就是通过常量池中指向方法的符号引用来表示的，那么**动态链接的作用就是为了将这些符号引用转换为调用方法的直接引用**；

代码:

```java
public class DynamicLinkingTest {
    int num = 10;
    public void methodA(){
        System.out.println("methodA()....");
    }
    public void methodB(){
        System.out.println("methodB()....");
        methodA();
        num++;
    }
}
```

字节码:

```java
  public void methodB();
    descriptor: ()V
    flags: ACC_PUBLIC
    Code:
      stack=3, locals=1, args_size=1
         0: getstatic    3                  // Field java/lang/System.out:Ljava/io/PrintStream;
         3: ldc          6                  // String methodB()....
         5: invokevirtual5                  // Method java/io/PrintStream.println:(Ljava/lang/String;)V
         8: aload_0
         9: invokevirtual7                  // Method methodA:()V
        12: aload_0
        13: dup
        14: getfield     2                  // Field num:I
        17: iconst_1
        18: iadd
        19: putfield     2                  // Field num:I
        22: return
      LineNumberTable:
        line 16: 0
        line 18: 8
        line 20: 12
        line 21: 22
      LocalVariableTable:
        Start  Length  Slot  Name   Signature
            0      23     0  this   Lcom/atguigu/java1/DynamicLinkingTest;
```

根据上面的字节码指令可以看到,methodB 在调用methodA 时, 使用invokevirtual 指令 并调用符号引用 #7, 而根据#7符号引用,从运行时常量池中就可以一步步的找到方法的本体

为什么要使用这种方式:

**1、** 因为在不同的方法，都可能调用常量或者方法，所以**只需要存储一份即可，然后记录其引用即可，节省了空间**；

**2、** 常量池的作用：就是为了提供一些符号和常量，便于指令的识别；

## 12 方法的调用

### 12.1 方法的链接方式 和 绑定方式

在前面说到,方法的调用会将 字节码指令中的符号引用 转为 方法的实际引用,,那么 这种方式就称为链接,共有两种方式

**1、****静态链接**：；

当一个字节码文件被装载进JVM内部时，如果被调用的目标方法在编译期确定，且运行期保持不变时，这种情况下将调用方法的符号引用转换为直接引用的过程称之为静态链接
**2、****动态链接**：；

如果被调用的方法在编译期无法被确定下来，也就是说，只能够在程序运行期将调用的方法的符号转换为直接引用，由于这种引用转换过程具备动态性，因此也被称之为动态链接。

静态链接和动态链接对应的方法的绑定机制为：早期绑定（Early Binding）和晚期绑定（Late Binding）。**绑定是一个字段、方法或者类在符号引用被替换为直接引用的过程**，这仅仅发生一次。

**1、****早期绑定**；

早期绑定就是指被调用的目标方法如果在编译期可知，且运行期保持不变时，即可将这个方法与所属的类型进行绑定，这样一来，由于明确了被调用的目标方法究竟是哪一个，因此也就可以使用静态链接的方式将符号引用转换为直接引用。
**2、****晚期绑定**；

如果被调用的方法在编译期无法被确定下来，只能够在程序运行期根据实际的类型绑定相关的方法，这种绑定方式也就被称之为晚期绑定。

动态链接 静态链接 调用方法,往往体现在对象的多态上,下面用代码演示一下

```java
/**
 * 说明早期绑定和晚期绑定的例子
 *
 * @author shkstart
 * @create 2020 上午 11:59
 */
class Animal {
    public void eat() {
        System.out.println("动物进食");
    }
}
interface Huntable {
    void hunt();
}
class Dog extends Animal implements Huntable {
    @Override
    public void eat() {
        System.out.println("狗吃骨头");
    }
    @Override
    public void hunt() {
        System.out.println("捕食耗子，多管闲事");
    }
}
class Cat extends Animal implements Huntable {
    public Cat() {
        super();//确定调用方法为父类的空参构造,表现为：早期绑定
    }
    public Cat(String name) {
        this();//确定调用的方法为本类的空参构造,表现为：早期绑定
    }
    @Override
    public void eat() {
        super.eat();//确定调用的方法为父类的eat方法,表现为：早期绑定
        System.out.println("猫吃鱼");
    }
    @Override
    public void hunt() {
        System.out.println("捕食耗子，天经地义");
    }
}
public class AnimalTest {
    public void showAnimal(Animal animal) {
        animal.eat();//超类Animal的eat方法,不确定实际对象,表现为：晚期绑定
    }
    public void showHunt(Huntable h) {
        h.hunt();//接口的hunt方法,不确定实际的调用对象,表现为：晚期绑定
    }
}
```

父类表现的晚期绑定对应的 class指令: invokevirtual

接口表现出的 晚期绑定对应的 class指令: invokeinterface

表现为早期绑定的 的class指令: invokespecial

### 12.2. 方法调用指令——虚方法和非虚方法

**虚方法与非虚方法的区别**

**1、** 如果方法在编译期就确定了具体的调用版本，这个版本在运行时是不可变的这样的方法称为非虚方法；

**2、** 静态方法、私有方法、final方法、实例构造器、父类方法都是非虚方法**(都是无法被子类重写,无法表现为多态性)**；

**3、** 其他方法称为虚方法；

**虚拟机中调用方法的指令**

**四条普通指令：**

**1、** invokestatic：调用静态方法，解析阶段确定唯一方法版本；

**2、** invokespecial：调用``方法、私有及父类中没有被重写的方法，解析阶段确定唯一方法版本；

**3、** invokevirtual：调用所有虚方法(除了final修饰的方法)；

**4、** invokeinterface：调用接口方法；

**一条动态调用指令**

invokedynamic：动态解析出需要调用的方法，然后执行

**区别**

**1、** 前四条指令固化在虚拟机内部，方法的调用执行不可人为干预；

**2、** 而invokedynamic指令则支持由用户确定方法版本；

**3、** 其中invokestatic指令和invokespecial指令调用的方法称为非虚方法，其余的（fina1修饰的除外）称为虚方法；

代码示例:

```java
/**
 * 解析调用中非虚方法、虚方法的测试
 *
 * invokestatic指令和invokespecial指令调用的方法称为非虚方法
 * @author shkstart
 * @create 2020 下午 12:07
 */
class Father {
    public Father() {
        System.out.println("father的构造器");
    }
    public static void showStatic(String str) {
        System.out.println("father " + str);
    }
    public final void showFinal() {
        System.out.println("father show final");
    }
    public void showCommon() {
        System.out.println("father 普通方法");
    }
}
public class Son extends Father {
    public Son() {
        //invokespecial
        super();
    }
    public Son(int age) {
        //invokespecial
        this();
    }
    //不是重写的父类的静态方法，因为静态方法不能被重写！
    public static void showStatic(String str) {
        System.out.println("son " + str);
    }
    private void showPrivate(String str) {
        System.out.println("son private" + str);
    }
    public void show() {
        //本类静态方法: invokestatic
        showStatic("atguigu.com");
        //父类静态方法: invokestatic
        super.showStatic("good!");
        //本类private方法: invokespecial
        showPrivate("hello!");
        //本类final方法: invokevirtual
        //虽然字节码指令中显示为invokevirtual，但因为此方法声明有final，不能被子类重写，所以也认为此方法是非虚方法。
        showFinal();
        //父类没有被重写的方法: invokespecial
        super.showCommon();
        //本类普通方法有可能有子类重写: invokevirtual
        showCommon();
        info();
        MethodInterface in = null;
        //接口表现的虚方法: invokeinterface
        in.methodA();
    }
    public void info() {
    }
    public void display(Father f) {
        f.showCommon();
    }
    public static void main(String[] args) {
        Son so = new Son();
        so.show();
    }
}
interface MethodInterface {
    void methodA();
}
```

### 12.3. invokedynamic 指令

JVM字节码指令集一直比较稳定，一直到Java7中才增加了一个invokedynamic指令，这是Jvm为了实现【动态类型语言】支持而做的一种改进。

**什么是动态语言,什么是静态语言:**

在于对类型的检查是在编译期还是在运行期,满足前者的就是静态类型语言,反之就是动态语言,说的再直白点,静态语言是判断变量自身的类型信息,动态类型语言是判断变量值的类型信息,变量没有类型信息,变量值才有

例如:

```java
Java: String info ="Hello";//info=Hello 报错
JS:  var name = "Hello" name = 10; //类型变化
Python:  info = 130 //没有指定类型
```

但是在Java7中并没有提供直接生成invokedynamic指令的方法，需要借助ASM这种底层字节码工具来产生invokedynamic指令。直到Java8的Lambda表达式的出现，invokedynamic指令的生成，在Java中才有了直接的生成方式。

```java
@FunctionalInterface
interface Func {
    public boolean func(String str);
}
public class Lambda {
    public void lambda(Func func) {
        return;
    }
    public static void main(String[] args) {
        Lambda lambda = new Lambda();
        Func func = s -> {
            return true;
        };
        lambda.lambda(func);
        lambda.lambda(s -> {
            return true;
        });
    }
}
```

字节码指令: 使用lambda的方法创建对象的方式为 invokedynamic,

Java7中增加的动态语言类型支持的本质是对Java虚拟机规范的修改，而不是对Java语言规则的修改,只是使java语言稍微有一些动态语言的特点,总体来说 java语言还是静态语言，最直接的受益者就是运行在Java平台的动态语言的编译器。是jvm支持跨语言的基础

### 12.4. 虚方法表

**方法重写的本质**

**1、** 找到操作数栈顶的第一个元素所执行的对象的实际类型，记作C；

**2、** 如果在类型C中找到与常量中的描述符合简单名称都相符的方法，则进行访问权限校验；

- 如果通过则返回这个方法的直接引用，查找过程结束
- 如果不通过，则返回java.1ang.IllegalAccessError 异常
**3、** 如果本类没找到，**按照继承关系从下往上依次对C的各个父类进行第2步的搜索和验证过程**；

**4、** 如果始终没有找到合适的方法，则抛出java.lang.AbstractMethodError异常(如调用接口方法没有被重写)；

**IllegalAccessError介绍**

**1、** 程序试图访问或修改一个属性或调用一个方法，这个属性或方法，你没有权限访问；

**2、** 一般的，这个会引起编译器异常这个错误如果发生在运行时，就说明一个类发生了不兼容的改变；

**3、** 比如，Maven中存在jar包冲突；

虚方法表:

**1、** 在面向对象的编程中，会很频繁的使用到**动态分派**，如果在每次动态分派的过程中都要重新在类的方法元数据中搜索合适的目标的话就可能**影响到执行效率**；

**2、** 因此，为了提高性能，**JVM采用在类的方法区建立一个虚方法表**（virtualmethodtable）来实现，非虚方法不会出现在表中使用索引表来代替查找；

**3、****每个类中都有一个虚方法表，表中存放着各个方法的实际入口**；

**4、** 虚方法表是什么时候被创建的呢？**虚方法表会在类加载的链接阶段被创建并开始初始化**，类的变量初始值准备完成之后，JVM会把该类的虚方法表也初始化完毕；

**5、** 如图所示：如果类中重写了方法，那么调用的时候，就会直接在该类的虚方法表中查找；

## 13 方法返回地址

方法栈帧中另外一个比较重要的 区域: 方法返回地址,

当方法A调用方法B时, 在方法B 中的方法返回地址信息区域中存放调用该方法时下一行代码 指令地址 (PC寄存器中的值), 当执行到尾行指令 return时,将 此值返回给 执行引擎,继续执行方法后的代码

一个方法的结束，有两种方式：

- 正常执行完成
- 出现未处理的异常，非正常退出

**1、** 无论通过哪种方式退出，在方法退出后都返回到该方法被调用的位置方法正常退出时，**调用者的pc计数器的值作为返回地址**，即调用该方法的指令的下一条指令的地址而通过异常退出的，**返回地址是要通过调用方法的一方的异常表来确定,如果也没有处理就继续向上抛**，栈帧中一般不会保存这部分信息；

**2、** 本质上，方法的退出就是当前栈帧出栈的过程此时，需要恢复上层方法的局部变量表、操作数栈、将返回值压入调用者栈帧的操作数栈、设置PC寄存器值等，让调用者方法继续执行下去；

**3、** 正常完成出口和异常完成出口的区别在于：通过异常完成出口退出的不会给他的上层调用者产生任何的返回值；

当一个方法开始执行后，只有两种方式可以退出这个方法，

**正常退出：**

**1、** 执行引擎遇到任意一个方法返回的字节码指令（return），会有返回值传递给上层的方法调用者，简称正常完成出口；

**2、** 一个方法在正常调用完成之后，究竟需要使用哪一个返回指令，还需要根据方法返回值的实际数据类型而定；

**3、** 在字节码指令中，返回指令包含：；

- ireturn：当返回值是boolean，byte，char，short和int类型时使用
- lreturn：Long类型
- freturn：Float类型
- dreturn：Double类型
- areturn：引用类型
- return：返回值类型为void的方法、实例初始化方法、类和接口的初始化方法

**异常退出：**

**1、** 在方法执行过程中遇到异常（Exception），并且这个异常没有在方法内进行处理，也就是只要在本方法的异常表中没有搜索到匹配的异常处理器，就会导致方法退出，简称异常完成出口；

**2、** 方法执行过程中，抛出异常时的异常处理，存储在一个异常处理表，方便在发生异常的时候找到处理异常的代码；

异常处理表：

- 反编译字节码文件，可得到 Exception table
- from ：字节码指令起始地址
- to ：字节码指令结束地址
- target ：出现异常跳转至地址为 11 的指令执行
- type ：捕获异常的类型

## 14 附加信息

栈帧中,除了 局部变量表,操作数栈,动态链接,方法方法地址 这四个区域外,还允许携带与JAVA 虚拟机实现相关的一些附加信息(看不同java虚拟机的实现),例如 对程序调试提供支持的信息

## 15 关于虚拟机栈的几个问题

**栈溢出的情况?**

StackOverflowError. (可以通过 -Xss 设置固定栈的大小 ,如果不设置,栈的区域可以进行动态扩容,但是也有限度,如果扩容至内存最大值,将会报出 OOM的错误,Out Of Memory 内存溢出)

**调整栈大小，就能保证不出现溢出么？**

不能,只能保证 溢出的概率变小,一个无退出的递归方法,总能消耗完

**分配的栈内存越大越好么？**

不是,栈区太大了,占用过多的内存数据

**垃圾回收是否涉及到虚拟机栈？**

不会,栈区只有入栈 出栈动作,内存无需回收

**方法中定义的局部变量是否线程安全？**

如果对象是在内部产生，并在内部消亡，没有返回到外部，那么它就是线程安全的，

若局部变量是参数传进来的 或者 返回出去了,那么这个变量在外面有可能有多个线程操作 不是线程安全的

**运行时数据区，哪些部分存在Error和GC？**

运行时数据区
是否存在Error
是否存在GC

程序计数器
否
否

虚拟机栈
是（SOF）
否

本地方法栈
是
否

方法区
是（OOM）
是

堆
是（OOM）
是
