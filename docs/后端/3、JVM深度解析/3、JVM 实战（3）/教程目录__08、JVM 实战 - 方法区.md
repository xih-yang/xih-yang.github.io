# 08、JVM 实战 - 方法区
- 来源：https://ddkk.com/zhuanlan/java/jvm/3/8.html
- 分类：JVM 实战
- 分组：教程目录
## 1. 栈 堆 方法区的交互关系

前面的文章中已经了解了 栈 ,堆, java 运行时区中另一个非常重要的区域就是 方法区

那么这三者又有什么关系呢?

**与线程共享与否的角度**

**从Person person = new Person(); 看**

**1、** Person类的.class信息存放在方法区中；

**2、** person变量存放在Java栈的局部变量表中；

**3、** 真正的person对象存放在Java堆中；

**4、** 在person对象中，有个指针指向方法区中的person类型数据，表明这个person对象是用方法区中的Person类new出来的；

## 2. 方法区基本理解

### 2.1 概述

官方文档: [https://docs.oracle.com/javase/specs/jvms/se8/html/jvms-2.html#jvms-2.5.4](https://docs.oracle.com/javase/specs/jvms/se8/html/jvms-2.html#jvms-2.5.4)

在java虚拟机规范中, 明确说明：尽管所有的方法区在逻辑上是属于堆的一部分，但一些简单的实现可能不会选择去进行垃圾收集或者进行压缩。 说明在逻辑上, 方法区也为 堆的一部分,但是在 实现上又和实际的堆(新生代,老年代)完全不一致

所以,对于HotSpotJVM而言，**方法区还有一个别名叫做Non-Heap**（非堆），目的就是要和堆分开。

所以，**方法区可以看作是一块独立于Java堆的内存空间**。

### 2.2 具体特性

**1、** 方法区（MethodArea）与Java堆一样，是**各个线程共享的内存区域**；

**2、** 多个线程同时加载统一个类时，只能有一个线程能加载该类，其他线程只能等等待该线程加载完毕，然后直接使用该类，即**类只能加载一次**；

**3、** 方法区在JVM启动的时候被创建，并且它的实际的物理内存空间中和Java堆区一样都可以是不连续的；

**4、** 方法区的大小，跟堆空间一样，可以选择**固定大小或者可扩展**；

**5、** 方法区的大小决定了系统可以保存多少个类，如果系统定义了太多的类，导致方法区溢出，虚拟机同样会抛出内存溢出错误；

- java.lang.OutofMemoryError:PermGen space (8之前)
- java.lang.OutOfMemoryError:Metaspace (8及之后)
**6、** 导致方法区发生OOM的情况:加载大量的第三方的jar包,Tomcat部署的工程过多（30~50个）,大量动态的生成反射类(动态代理类)；

**7、** 关闭JVM就会释放这个区域的内存；

### 2.3 方法区的演进

**1、****在JDK7及以前，习惯上把方法区，称为永久代JDK8开始，使用元空间取代了永久代**JDK1.8后，元空间存放在**堆外内存中**；

**2、** 我们可以将方法区类比为Java中的接口，将永久代或元空间类比为Java中具体的实现类；

**3、** 本质上，方法区和永久代并不等价仅是对Hotspot而言的可以看作等价《Java虚拟机规范》对如何实现方法区，不做统一要求例如：BEAJRockit/IBMJ9中不存在永久代的概念；

**4、** 现在来看，当年使用永久代，不是好的主意导致Java程序更容易OOm（超过-XX:MaxPermsize上限）；

**5、** 而到了JDK8，终于完全废弃了永久代的概念，改用与JRockit、J9一样在本地内存中实现的元空间（Metaspace）来代替；

**6、** 元空间的本质和永久代类似，都是对JVM规范中方法区的实现不过元空间与永久代最大的区别在于：**元空间不使用虚拟机设置的内存，而是使用本地内存**；

**7、** 永久代、元空间二者并不只是名字变了，内部结构也调整了；

**8、** 根据《Java虚拟机规范》的规定，如果方法区无法满足新的内存分配需求时，将抛出OOM异常,虽然使用了本地内存,但是本地的内存也是有限度的,只是出现的概率大大缩小；

## 3. 设置方法区大小与 OOM

### 3.1 老旧版本如何设置 方法区初始大小 和最大内存

**JDK7及之前 永久代**

**1、** 通过-XX:Permsize来设置永久代初始分配空间默认值是20.75M；

**2、** -XX:MaxPermsize来设定永久代最大可分配空间32位机器默认是64M，64位机器模式是82M；

**3、** 当JVM加载的类信息容量超过了这个值，会报异常OutofMemoryError:PermGenspace；

可以使用 jps 和 jinfo指令 查看 java 程序的参数

**JDK8之后,元空间**

**1、** 元数据区大小可以使用参数**-XX:MetaspaceSize**和**-XX:MaxMetaspaceSize**指定；

2、** 默认值依赖于平台，Windows下，-XX:MetaspaceSize约为21M，-XX:MaxMetaspaceSize的值是-1，即没有限制**；

**3、** 与永久代不同，如果不指定大小，默认情况下，虚拟机会耗尽所有的可用系统内存如果元数据区发生溢出，虚拟机一样会抛出异常OutOfMemoryError:Metaspace；

**4、** -XX:MetaspaceSize：设置初始的元空间大小对于一个64位的服务器端JVM来说，其默认的-XX:MetaspaceSize值为21MB这就是初始的高水位线，一旦触及这个水位线，FullGC将会被触发并卸载没用的类（即这些类对应的类加载器不再存活），**然后这个高水位线将会重置**新的高水位线的值取决于GC后释放了多少元空间；

- 如果释放的空间不多，那么在不超过MaxMetaspaceSize时，适当提高该值。
- 如果释放空间过多，则适当降低该值。
**5、** 如果初始化的高水位线设置过低，上述高水位线调整情况会发生很多次通过垃圾回收器的日志可以观察到FullGC多次调用**为了避免频繁地GC，建议将-XX:MetaspaceSize设置为一个相对较高的值**；

### 3.2 方法区内存溢出 OOM

代码演示: OOMTest 类继承 ClassLoader 类，获得 defineClass() 方法，可自己进行类的加载

```java
/**
 * jdk6/7中：
 * -XX:PermSize=10m -XX:MaxPermSize=10m
 *
 * jdk8中：
 * -XX:MetaspaceSize=10m -XX:MaxMetaspaceSize=10m
 */
public class OOMTest extends ClassLoader {
    public static void main(String[] args) {
        int j = 0;
        try {
            OOMTest test = new OOMTest();
            for (int i = 0; i < 10000; i++) {
                //创建ClassWriter对象，用于生成类的二进制字节码
                ClassWriter classWriter = new ClassWriter(0);
                //指明版本号，修饰符，类名，包名，父类，接口
                classWriter.visit(Opcodes.V1_6, Opcodes.ACC_PUBLIC, "Class" + i, null, "java/lang/Object", null);
                //返回byte[]
                byte[] code = classWriter.toByteArray();
                //类的加载
                test.defineClass("Class" + i, code, 0, code.length);//Class对象
                j++;
            }
        } finally {
            System.out.println(j);
        }
    }
}
```

本机使用的是 java8 环境,当没有设置jvm参数时, 程序顺利执行,因为 会自动扩容方法区大小

**调整元空间大小** :`-XX:MetaspaceSize=10m -XX:MaxMetaspaceSize=10m`

```java
Exception in thread "main" java.lang.OutOfMemoryError: Metaspace
	at java.lang.ClassLoader.defineClass1(Native Method)
	at java.lang.ClassLoader.defineClass(ClassLoader.java:763)
	at java.lang.ClassLoader.defineClass(ClassLoader.java:642)
	at com.atguigu.java.OOMTest.main(OOMTest.java:29)
8531
```

报出OOM 错误 ,只加载了 8513次

**如何解决OOM?**

**1、** 要解决OOM异常(堆内存溢出,栈内存溢出)，一般的手段是首先通过内存映像分析工具（如Ec1ipseMemoryAnalyzer）对dump出来的堆转储快照进行分析，重点是确认内存中的对象是否是必要的，也就是要先分清楚到底是出现了内存泄漏（MemoryLeak）还是内存溢出（MemoryOverflow）；

**2、****内存泄漏就是有大量的引用指向某些对象，但是这些对象以后不会使用了**，但是因为它们还和GCROOT有关联，所以导致以后这些对象也不会被回收，这就是内存泄漏的问题；

**3、** 如果是内存泄漏，可进一步通过工具查看泄漏对象到GCRoots的引用链于是就能**找到泄漏对象是通过怎样的路径与GCRoots相关联并导致垃圾收集器无法自动回收它们的**掌握了泄漏对象的类型信息，以及GCRoots引用链的信息，就可以比较准确地定位出泄漏代码的位置；

**4、** 如果不存在内存泄漏，换句话说就是内存中的对象确实都还必须存活着，那就应当检查虚拟机的堆参数（-Xmx与-Xms），与机器物理内存对比看是否还可以调大，从代码上检查是否存在某些对象生命周期过长、持有状态时间过长的情况，尝试减少程序运行期的内存消耗；

## 4. 方法区内部结构

### 4.1 概述

在《深入理解Java虚拟机》书中对方法区（Method Area）存储内容描述如下：它用于存储已被虚拟机**加载的类型信息、常量、静态变量、即时编译器编译后的代码缓存**等

**类型信息:**

对每个加载的类型（类class、接口interface、枚举enum、注解annotation），JVM必须在方法区中存储以下类型信息：

**1、** 这个类型的完整有效名称（全名=包名.类名）；

**2、** 这个类型直接父类的完整有效名（对于interface或是java.lang.Object，都没有父类）；

**3、** 这个类型的修饰符（包括public，abstract，final的一个集合）；

**4、** 这个类型实现的接口的一个有序列表；

**域(Field)信息:**

JVM必须在方法区中保存类型的所有域的相关信息以及域的声明顺序。

域的相关信息包括：

- 域名称
- 域类型
- 域修饰符（包括 public，private，protected，static，final，volatile，transient的一个集合）

**方法（Method）信息**:

JVM必须保存所有方法的以下信息，同域信息一样包括声明顺序：

**1、** 方法名称；

**2、** 方法的返回类型（包括void返回类型），void在Java中对应的类为void.class；

**3、** 方法参数的数量和类型（按顺序）；

**4、** 方法的修饰符（包括public，private，protected，static，final，synchronized，native，abstract的一个集合）；

**5、** 方法的字节码（bytecodes）、操作数栈、局部变量表及大小（abstract和native方法除外）；

**6、** 异常表（abstract和native方法除外），异常表记录每个异常处理的开始位置、结束位置、代码处理在程序计数器中的偏移地址、被捕获的异常类的常量池索引；

### 4.2 举例查看一个class字节码

使用javap工具查看一个class 字节码 包括了哪些信息,这些信息被ClassLoader 加载后 ,都要保存到方法区

```java
/**
 * 测试方法区的内部构成
 */
public class MethodInnerStrucTest extends Object implements Comparable<String>, Serializable {
    //属性
    public int num = 10;
    private static String str = "测试方法的内部结构";
    //构造器没写
    //方法
    public void test1() {
        int count = 20;
        System.out.println("count = " + count);
    }
    public static int test2(int cal) {
        int result = 0;
        try {
            int value = 30;
            result = value / cal;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return result;
    }
    @Override
    public int compareTo(String o) {
        return 0;
    }
}
```

使用javap指令 ,进行解析, 并输入到相对路径下的txt文件下, `javap -v -p MethodInnerStrucTest.class > Text.txt``-p` 表示private 私有的也输出

```java
Classfile /D:/workspace_idea5/JVMDemo/out/production/chapter09/com/atguigu/java/MethodInnerStrucTest.class
  Last modified 2020-4-22; size 1626 bytes
  MD5 checksum 69643a16925bb67a96f54050375c75d0
  Compiled from "MethodInnerStrucTest.java"
  //类型信息 全类名 实现的接口名
public class com.atguigu.java.MethodInnerStrucTest extends java.lang.Object 
implements java.lang.Comparable<java.lang.String>, java.io.Serializable
  minor version: 0
  major version: 51
  flags: ACC_PUBLIC, ACC_SUPER  //类的修饰符
Constant pool:
  1 = Methodref         18.#52        // java/lang/Object."<init>":()V
  2 = Fieldref          17.#53        // com/atguigu/java/MethodInnerStrucTest.num:I
  3 = Fieldref          54.#55        // java/lang/System.out:Ljava/io/PrintStream;
  4 = Class             56            // java/lang/StringBuilder
  5 = Methodref         4.#52         // java/lang/StringBuilder."<init>":()V
  6 = String            57            // count =
  7 = Methodref         4.#58         // java/lang/StringBuilder.append:(Ljava/lang/String;)Ljava/lang/StringBuilder;
  8 = Methodref         4.#59         // java/lang/StringBuilder.append:(I)Ljava/lang/StringBuilder;
  9 = Methodref         4.#60         // java/lang/StringBuilder.toString:()Ljava/lang/String;
 10 = Methodref         61.#62        // java/io/PrintStream.println:(Ljava/lang/String;)V
 11 = Class             63            // java/lang/Exception
 12 = Methodref         11.#64        // java/lang/Exception.printStackTrace:()V
 13 = Class             65            // java/lang/String
 14 = Methodref         17.#66        // com/atguigu/java/MethodInnerStrucTest.compareTo:(Ljava/lang/String;)I
 15 = String            67            // 测试方法的内部结构
 16 = Fieldref          17.#68        // com/atguigu/java/MethodInnerStrucTest.str:Ljava/lang/String;
 17 = Class             69            // com/atguigu/java/MethodInnerStrucTest
 18 = Class             70            // java/lang/Object
 19 = Class             71            // java/lang/Comparable
 20 = Class             72            // java/io/Serializable
 21 = Utf8               num
 22 = Utf8               I
 23 = Utf8               str
 24 = Utf8               Ljava/lang/String;
 25 = Utf8               <init>
 26 = Utf8               ()V
 27 = Utf8               Code
 28 = Utf8               LineNumberTable
 29 = Utf8               LocalVariableTable
 30 = Utf8               this
 31 = Utf8               Lcom/atguigu/java/MethodInnerStrucTest;
 32 = Utf8               test1
 33 = Utf8               count
 34 = Utf8               test2
 35 = Utf8               (I)I
 36 = Utf8               value
 37 = Utf8               e
 38 = Utf8               Ljava/lang/Exception;
 39 = Utf8               cal
 40 = Utf8               result
 41 = Utf8               StackMapTable
 42 = Class             63            // java/lang/Exception
 43 = Utf8               compareTo
 44 = Utf8               (Ljava/lang/String;)I
 45 = Utf8               o
 46 = Utf8               (Ljava/lang/Object;)I
 47 = Utf8               <clinit>
 48 = Utf8               Signature
 49 = Utf8               Ljava/lang/Object;Ljava/lang/Comparable<Ljava/lang/String;>;Ljava/io/Serializable;
 50 = Utf8               SourceFile
 51 = Utf8               MethodInnerStrucTest.java
 52 = NameAndType       25:#26        // "<init>":()V
 53 = NameAndType       21:#22        // num:I
 54 = Class             73            // java/lang/System
 55 = NameAndType       74:#75        // out:Ljava/io/PrintStream;
 56 = Utf8               java/lang/StringBuilder
 57 = Utf8               count =
 58 = NameAndType       76:#77        // append:(Ljava/lang/String;)Ljava/lang/StringBuilder;
 59 = NameAndType       76:#78        // append:(I)Ljava/lang/StringBuilder;
 60 = NameAndType       79:#80        // toString:()Ljava/lang/String;
 61 = Class             81            // java/io/PrintStream
 62 = NameAndType       82:#83        // println:(Ljava/lang/String;)V
 63 = Utf8               java/lang/Exception
 64 = NameAndType       84:#26        // printStackTrace:()V
 65 = Utf8               java/lang/String
 66 = NameAndType       43:#44        // compareTo:(Ljava/lang/String;)I
 67 = Utf8               测试方法的内部结构
 68 = NameAndType       23:#24        // str:Ljava/lang/String;
 69 = Utf8               com/atguigu/java/MethodInnerStrucTest
 70 = Utf8               java/lang/Object
 71 = Utf8               java/lang/Comparable
 72 = Utf8               java/io/Serializable
 73 = Utf8               java/lang/System
 74 = Utf8               out
 75 = Utf8               Ljava/io/PrintStream;
 76 = Utf8               append
 77 = Utf8               (Ljava/lang/String;)Ljava/lang/StringBuilder;
 78 = Utf8               (I)Ljava/lang/StringBuilder;
 79 = Utf8               toString
 80 = Utf8               ()Ljava/lang/String;
 81 = Utf8               java/io/PrintStream
 82 = Utf8               println
 83 = Utf8               (Ljava/lang/String;)V
 84 = Utf8               printStackTrace
{
  //域信息
  public int num;
    descriptor: I  //类型
    flags: ACC_PUBLIC  // 修饰符
  private static java.lang.String str;
    descriptor: Ljava/lang/String;
    flags: ACC_PRIVATE, ACC_STATIC
  //方法信息
  public com.atguigu.java.MethodInnerStrucTest();
    descriptor: ()V  //返回值
    flags: ACC_PUBLIC  //修饰符
    Code:  //字节码指令
      stack=2, locals=1, args_size=1
         0: aload_0
         1: invokespecial1                  // Method java/lang/Object."<init>":()V
         4: aload_0
         5: bipush        10
         7: putfield     2                  // Field num:I
        10: return
      LineNumberTable:
        line 10: 0
        line 12: 4
      LocalVariableTable:
        Start  Length  Slot  Name   Signature
            0      11     0  this   Lcom/atguigu/java/MethodInnerStrucTest;
  public void test1();
    descriptor: ()V
    flags: ACC_PUBLIC
    Code:
      stack=3, locals=2, args_size=1
         0: bipush        20
         2: istore_1
         3: getstatic    3                  // Field java/lang/System.out:Ljava/io/PrintStream;
         6: new          4                  // class java/lang/StringBuilder
         9: dup
        10: invokespecial5                  // Method java/lang/StringBuilder."<init>":()V
        13: ldc          6                  // String count =
        15: invokevirtual7                  // Method java/lang/StringBuilder.append:(Ljava/lang/String;)Ljava/lang/StringBuilder;
        18: iload_1
        19: invokevirtual8                  // Method java/lang/StringBuilder.append:(I)Ljava/lang/StringBuilder;
        22: invokevirtual9                  // Method java/lang/StringBuilder.toString:()Ljava/lang/String;
        25: invokevirtual10                 // Method java/io/PrintStream.println:(Ljava/lang/String;)V
        28: return
      LineNumberTable:
        line 17: 0
        line 18: 3
        line 19: 28
      LocalVariableTable: 
        Start  Length  Slot  Name   Signature
            0      29     0  this   Lcom/atguigu/java/MethodInnerStrucTest;
            3      26     1 count   I
  public static int test2(int);
    descriptor: (I)I
    flags: ACC_PUBLIC, ACC_STATIC
    Code:
      stack=2, locals=3, args_size=1
         0: iconst_0
         1: istore_1
         2: bipush        30
         4: istore_2
         5: iload_2
         6: iload_0
         7: idiv
         8: istore_1
         9: goto          17
        12: astore_2
        13: aload_2
        14: invokevirtual12                 // Method java/lang/Exception.printStackTrace:()V
        17: iload_1
        18: ireturn
      Exception table:
         from    to  target type
             2     9    12   Class java/lang/Exception
      LineNumberTable:
        line 21: 0
        line 23: 2
        line 24: 5
        line 27: 9
        line 25: 12
        line 26: 13
        line 28: 17
      LocalVariableTable:
        Start  Length  Slot  Name   Signature
            5       4     2 value   I
           13       4     2     e   Ljava/lang/Exception;
            0      19     0   cal   I
            2      17     1 result   I
      StackMapTable: number_of_entries = 2
        frame_type = 255 /* full_frame */
          offset_delta = 12
          locals = [ int, int ]
          stack = [ class java/lang/Exception ]
        frame_type = 4 /* same */
  public int compareTo(java.lang.String);
    descriptor: (Ljava/lang/String;)I
    flags: ACC_PUBLIC
    Code:
      stack=1, locals=2, args_size=2
         0: iconst_0
         1: ireturn
      LineNumberTable:
        line 33: 0
      LocalVariableTable:
        Start  Length  Slot  Name   Signature
            0       2     0  this   Lcom/atguigu/java/MethodInnerStrucTest;
            0       2     1     o   Ljava/lang/String;
  public int compareTo(java.lang.Object);
    descriptor: (Ljava/lang/Object;)I
    flags: ACC_PUBLIC, ACC_BRIDGE, ACC_SYNTHETIC
    Code:
      stack=2, locals=2, args_size=2
         0: aload_0
         1: aload_1
         2: checkcast    13                 // class java/lang/String
         5: invokevirtual14                 // Method compareTo:(Ljava/lang/String;)I
         8: ireturn
      LineNumberTable:
        line 10: 0
      LocalVariableTable:
        Start  Length  Slot  Name   Signature
            0       9     0  this   Lcom/atguigu/java/MethodInnerStrucTest;
  static {};
    descriptor: ()V
    flags: ACC_STATIC
    Code:
      stack=1, locals=0, args_size=0
         0: ldc          15                 // String 测试方法的内部结构
         2: putstatic    16                 // Field str:Ljava/lang/String;
         5: return
      LineNumberTable:
        line 13: 0
}
Signature:49                          // Ljava/lang/Object;Ljava/lang/Comparable<Ljava/lang/String;>;Ljava/io/Serializable;
SourceFile: "MethodInnerStrucTest.java"
```

**当class 字节码加载到 方法区中后,实际上 要比上面还有多一些信息,例如:类信息中还要记录哪个加载器加载了该类 (同时类加载器也记录了它加载了哪些类 ),**

### 4.3域信息特殊情况

**non-final 类型的类变量**

**1、****静态变量和类关联在一起，随着类的加载而加载**，他们成为类数据在逻辑上的一部分；

**2、** 类变量被类的所有实例共享，即使没有类实例时，你也可以访问它；

**代码示例**

**1、** 如下代码所示，即使我们把order设置为null，也不会出现空指针异常；

**2、** 这更加表明了static类型的字段和方法随着类的加载而加载，并不属于特定的类实例；

```java
/**
 * non-final的类变量
 */
public class MethodAreaTest {
    public static void main(String[] args) {
        Order order = null;
        order.hello();
        System.out.println(order.count);
    }
}
class Order {
    public static int count = 1;
    public static final int number = 2;
    public static void hello() {
        System.out.println("hello!");
    }
}
```

**static final**

**1、** 全局常量就是使用staticfinal进行修饰；

**2、** 被声明为final的类变量的处理方法则不同，每个全局常量在编译的时候就会被分配了；

同样是上面的代码,使用javap 解析后:

```java
  public static int count;
    descriptor: I
    flags: ACC_PUBLIC, ACC_STATIC
  public static final int number;
    descriptor: I
    flags: ACC_PUBLIC, ACC_STATIC, ACC_FINAL
    ConstantValue: int 2   //在编译阶段 就已经将 number 赋值
```

### 4.3运行时常量池

要了解什么是运行时常量池,先要看一下什么是 常量池

**常量池:** 一个有效的字节码文件中除了包含类的版本信息、字段、方法以及接口等描述符信息外

还包含一项信息就是**常量池表**（**Constant Pool Table**），包括**各种字面量和对类型、域和方法的符号引用**,

在上一个小结中,我们查看了某个class字节码, 这个class字节码虽然表面的代码很少,但是 实际需要的类非常多,例如String类信息,, System 类,等等,但是编译出的字节码只有100k左右,就是因为class 字节码指令中,常量池的作用

在回看上一节中的class 对应的test1 方法:

```java
    public void test1() {
        int count = 20;
        System.out.println("count = " + count);
    }
```

对应的指令: 可以看到,在实际调用 某个实际的类时 使用 去引用 常量池中的实际位置,例如 指令中的5 代表的就是 方法中的 字符串拼接操作,去找 常量池中 StringBuilder 类的相关信息的实际位置(String的相关优化), 并在实际执行时, 将符号引用 替换为 实际的引用

```java
   Code:
      stack=3, locals=2, args_size=1
         0: bipush        20
         2: istore_1
         3: getstatic    3                  // Field java/lang/System.out:Ljava/io/PrintStream;
         6: new          4                  // class java/lang/StringBuilder
         9: dup
        10: invokespecial5                  // Method java/lang/StringBuilder."<init>":()V
        13: ldc          6                  // String count =
        15: invokevirtual7                  // Method java/lang/StringBuilder.append:(Ljava/lang/String;)Ljava/lang/StringBuilder;
        18: iload_1
        19: invokevirtual8                  // Method java/lang/StringBuilder.append:(I)Ljava/lang/StringBuilder;
        22: invokevirtual9                  // Method java/lang/StringBuilder.toString:()Ljava/lang/String;
        25: invokevirtual10                 // Method java/io/PrintStream.println:(Ljava/lang/String;)V
        28: return
      LineNumberTable:
        line 17: 0
        line 18: 3
        line 19: 28
```

常量池:

```java
Constant pool:
  1 = Methodref         18.#52        // java/lang/Object."<init>":()V
  2 = Fieldref          17.#53        // com/atguigu/java/MethodInnerStrucTest.num:I
  3 = Fieldref          54.#55        // java/lang/System.out:Ljava/io/PrintStream;
  4 = Class             56            // java/lang/StringBuilder
  5 = Methodref         4.#52         // java/lang/StringBuilder."<init>":()V
  6 = String            57            // count =
  7 = Methodref         4.#58         // java/lang/StringBuilder.append:(Ljava/lang/String;)Ljava/lang/StringBuilder;
  8 = Methodref         4.#59         // java/lang/StringBuilder.append:(I)Ljava/lang/StringBuilder;
  9 = Methodref         4.#60         // java/lang/StringBuilder.toString:()Ljava/lang/String;
 10 = Methodref         61.#62        // java/io/PrintStream.println:(Ljava/lang/String;)V
 11 = Class             63            // java/lang/Exception
 12 = Methodref         11.#64        // java/lang/Exception.printStackTrace:()V
 13 = Class             65            // java/lang/String
 14 = Methodref         17.#66        // com/atguigu/java/MethodInnerStrucTest.compareTo:(Ljava/lang/String;)I
 15 = String            67            // 测试方法的内部结构
 16 = Fieldref          17.#68        // com/atguigu/java/MethodInnerStrucTest.str:Ljava/lang/String;
 17 = Class             69            // com/atguigu/java/MethodInnerStrucTest
 18 = Class             70            // java/lang/Object
 19 = Class             71            // java/lang/Comparable
 20 = Class             72            // java/io/Serializable
 21 = Utf8               num
 22 = Utf8               I
 23 = Utf8               str
 24 = Utf8               Ljava/lang/String;
 25 = Utf8               <init>
 26 = Utf8               ()V
 27 = Utf8               Code
 28 = Utf8               LineNumberTable
 29 = Utf8               LocalVariableTable
 30 = Utf8               this
 31 = Utf8               Lcom/atguigu/java/MethodInnerStrucTest;
 32 = Utf8               test1
 33 = Utf8               count
 34 = Utf8               test2
 35 = Utf8               (I)I
 36 = Utf8               value
 37 = Utf8               e
 38 = Utf8               Ljava/lang/Exception;
 39 = Utf8               cal
 40 = Utf8               result
 41 = Utf8               StackMapTable
 42 = Class             63            // java/lang/Exception
 43 = Utf8               compareTo
 44 = Utf8               (Ljava/lang/String;)I
 45 = Utf8               o
 46 = Utf8               (Ljava/lang/Object;)I
 47 = Utf8               <clinit>
 48 = Utf8               Signature
 49 = Utf8               Ljava/lang/Object;Ljava/lang/Comparable<Ljava/lang/String;>;Ljava/io/Serializable;
 50 = Utf8               SourceFile
 51 = Utf8               MethodInnerStrucTest.java
 52 = NameAndType       25:#26        // "<init>":()V
 53 = NameAndType       21:#22        // num:I
 54 = Class             73            // java/lang/System
 55 = NameAndType       74:#75        // out:Ljava/io/PrintStream;
 56 = Utf8               java/lang/StringBuilder
 57 = Utf8               count =
 58 = NameAndType       76:#77        // append:(Ljava/lang/String;)Ljava/lang/StringBuilder;
 59 = NameAndType       76:#78        // append:(I)Ljava/lang/StringBuilder;
 60 = NameAndType       79:#80        // toString:()Ljava/lang/String;
 61 = Class             81            // java/io/PrintStream
 62 = NameAndType       82:#83        // println:(Ljava/lang/String;)V
 63 = Utf8               java/lang/Exception
 64 = NameAndType       84:#26        // printStackTrace:()V
 65 = Utf8               java/lang/String
 66 = NameAndType       43:#44        // compareTo:(Ljava/lang/String;)I
 67 = Utf8               测试方法的内部结构
 68 = NameAndType       23:#24        // str:Ljava/lang/String;
 69 = Utf8               com/atguigu/java/MethodInnerStrucTest
 70 = Utf8               java/lang/Object
 71 = Utf8               java/lang/Comparable
 72 = Utf8               java/io/Serializable
 73 = Utf8               java/lang/System
 74 = Utf8               out
 75 = Utf8               Ljava/io/PrintStream;
 76 = Utf8               append
 77 = Utf8               (Ljava/lang/String;)Ljava/lang/StringBuilder;
 78 = Utf8               (I)Ljava/lang/StringBuilder;
 79 = Utf8               toString
 80 = Utf8               ()Ljava/lang/String;
 81 = Utf8               java/io/PrintStream
 82 = Utf8               println
 83 = Utf8               (Ljava/lang/String;)V
 84 = Utf8               printStackTrace
```

常量池、可以看做是一张表，虚拟机指令根据这张常量表找到要执行的类名、方法名、参数类型、字面量等类型

**什么是运行时常量池**

**1、****运行时常量池（RuntimeConstantPool）是方法区的一部分**；

**2、** 常量池表（ConstantPoolTable）是Class字节码文件的一部分，用于存放编译期生成的各种字面量与符号引用，**这部分内容将在类加载后存放到方法区的运行时常量池中**；

**3、** 在加载类和接口到虚拟机后，就会创建对应的运行时常量池；

**4、****JVM为每个已加载的类型（类或接口）都维护一个常量池池中的数据项像数组项一样，是通过索引访问的**；

**5、** 运行时常量池中包含多种不同的常量，包括编译期就已经明确的数值字面量，也包括到运行期解析后才能够获得的方法或者字段引用**此时不再是常量池中的符号地址了，这里换为真实地址**；

**6、** 运行时常量池，相对于Class文件常量池的另一重要特征是：具备动态性(例如运行过程中动态创建了一个String类放入到运行时常量池中)；

**7、** 运行时常量池类似于传统编程语言中的符号表（symboltable），但是它所包含的数据却比符号表要更加丰富一些；

**8、** 当创建类或接口的运行时常量池时，如果构造运行时常量池所需的内存空间超过了方法区所能提供的最大值，则JVM会抛OutofMemoryError异常；

**总结: class 字节码中的常量池 ,描述了 符合引用 与实际引用的关系, 在加载该class 时,将本关系表加载到运行时常量池中, 此时的 符号引用可以真正的找到 运行时的其他类型信息, 并且 运行池常量池具有动态性,可能会动态添加**

## 5. 方法区的演进细节

### 5.1 Hotspot 演变过程

首先明确：只有Hotspot才有永久代。BEA JRockit、IBMJ9等来说，是不存在永久代的概念的。原则上如何实现方法区属于虚拟机实现细节，不受《Java虚拟机规范》管束，并不要求统一

那这一节我们就看一下最主流的 Hotspot jvm的 方法区 实现演变过程

JDK 版本
演变细节

JDK1.6及以前
有永久代（permanent generation），静态变量存储在永久代上

JDK1.7
有永久代，但已经逐步 “去永久代”，字符串常量池，静态变量移除，保存在堆中

JDK1.8
无永久代，类型信息，字段，方法，常量保存在本地内存的元空间，但字符串常量池、静态变量仍然在堆中。

内存结构图:

**JDK6**

方法区由永久代实现，使用 JVM 虚拟机内存

**JDK7**

方法区由永久代实现，使用 JVM 虚拟机内存,并将 静态变量和 字符串常量池移出方法区,放到了堆中

**JDK8**

方法区由元空间实现，使用物理机本地内存, 静态变量和字符串常量池保留在 堆中

### 5.2 元空间出现的原因

在官方收购 JRokit JVM 后, 将 JRokit 与 Hotspot 融合,因为 JRokit 没有 永久代的原因,所有也就去掉了,这是官方的解释.

而随着Java8的到来，HotSpot VM中确实再也见不到永久代了。但是这并不意味着类的元数据信息也消失了。这些数据被移到了一个与堆不相连的本地内存区域，这个区域叫做元空间（Metaspace）

**永久代为什么要被元空间替代？**

**1、** 为永久代设置空间大小是很难确定的；

- 在某些场景下，如果动态加载类过多，容易产生Perm区(永久代)的OOM。比如某个实际Web工

程中，因为功能点比较多，在运行过程中，要不断动态加载很多类，经常出现致命错误。`Exception in thread 'dubbo client x.x connector' java.lang.OutOfMemoryError:PermGen space`
- 而元空间和永久代之间最大的区别在于：**元空间并不在虚拟机中，而是使用本地内存**。

因此，**默认情况下，元空间的大小仅受本地内存限制**。

**1、** 对永久代进行调优是很困难的；

- 方法区的垃圾收集主要回收两部分内容：常量池中废弃的常量和不再用的类型，方法区的调优主要是为了降低Full GC
- 有些人认为方法区（如HotSpot虚拟机中的元空间或者永久代）是没有垃圾收集行为的，其实不然。《Java虚拟机规范》对方法区的约束是非常宽松的，提到过可以不要求虚拟机在方法区中实现垃圾收集。事实上也确实有未实现或未能完整实现方法区类型卸载的收集器存在（如JDK11时期的ZGC收集器就不支持类卸载）。
- **一般来说这个区域的回收效果比较难令人满意，尤其是类型的卸载，条件相当苛刻**。但是这部分区域的回收有时又确实是必要的。以前Sun公司的Bug列表中，曾出现过的若干个严重的Bug就是由于低版本的HotSpot虚拟机对此区域未完全回收而导致内存泄漏

### 5.3 字符串常量池为什么要挪到堆中

这里只做大概的描述,后面的章节中具体说明

**JDK7中将StringTable放到了堆空间中**。因为永久代的回收效率很低，在Full GC的时候才会执行永久代的垃圾回收，而Full GC是老年代的空间不足、永久代不足时才会触发。

这就**导致StringTable回收效率不高**，而我们开发中会有大量的字符串被创建，回收效率低，导致永久代内存不足。**放到堆里，能及时回收内存**。

### 5.4 静态变量在什么位置

在上面的 各个版本的 内存结构图中, 看到 静态变量的位置也随着 版本的更新而发生变化,

**下面用代码验证一下**: 创建一个静态变量 大小为100M

```java
/**
 *
 * jdk7 jdk6：
 * -Xms200m -Xmx200m -XX:PermSize=300m -XX:MaxPermSize=300m -XX:+PrintGCDetails
 * jdk 8：
 * -Xms200m -Xmx200m -XX:MetaspaceSize=300m -XX:MaxMetaspaceSize=300m -XX:+PrintGCDetails
 */
public class StaticFieldTest {
    private static byte[] arr = new byte[1024 * 1024 * 100];//100MB
    public static void main(String[] args) {
        System.out.println(StaticFieldTest.arr);
    }
}
```

**先测试JDK 8 的环境**: `-Xms200m -Xmx200m -XX:MetaspaceSize=300m -XX:MaxMetaspaceSize=300m -XX:+PrintGCDetails` 设置的是元空间的大小

可以看到, 静态变量实例数组放到的是堆中,并因为 新生代放不下,而放到了老年代

**再测试一下 JDK7**: `-Xms200m -Xmx200m -XX:PermSize=300m -XX:MaxPermSize=300m -XX:+PrintGCDetails` 设置永久代大小

静态变量仍然是放在 老年代中的 `used 102400K` 没什么问题

**再测试 JDK 6:**使用的参数和 7 一致

发现静态变量数组仍然存放在 堆中,这和我们上述的 内存变化结构图不一致

**因为, 上述 静态变量 变化的 ,都是指变量本身 即 private static byte[] arr = new byte[1024 * 1024 * 100]; 等号左边的部分,静态变量表存放的就是 引用本身, 只要是new 出来的对象 肯定都是放在堆中,便于垃圾回收**

不同变量本身存放的位置:

```java
/**
 * 《深入理解Java虚拟机》中的案例：
 * staticObj、instanceObj、localObj存放在哪里？
 */
public class StaticObjTest {
    static class Test {
        static ObjectHolder staticObj = new ObjectHolder();
        ObjectHolder instanceObj = new ObjectHolder();
        void foo() {
            ObjectHolder localObj = new ObjectHolder();
            System.out.println("done");
        }
    }
    private static class ObjectHolder {
    }
    public static void main(String[] args) {
        Test test = new StaticObjTest.Test();
        test.foo();
    }
}
```

在上面的代码中,分别定义了三个变量, 静态变量 staticObj, 普通类变量 instanceObj, 和 方法局部变量 localObj

可以使用 JHSDB.exe工具可以看到这三个变量的实例,也就是等号右边的部分 都是存放在堆中的，没有超出堆空间地址范围 (在JDK9的时候才引入的后面详细介绍使用方法)

下面看看各个变量的本身存放的位置

- instanceObj 是随着Test的对象实例存放在Java堆 ,属于某个对象实例
- localObject则是存放在foo()方法栈帧的局部变量表中。
- staticObj随着Test类的类型信息(Class对象)存放在方法区

使用Inspector工具,找到了一个引用该staticObj对象的地方，是在一个java.lang.Class的实例里，并且给出了这个实例的地址，通过Inspector查看该对象实例，可以清楚看到这确实是一个java.lang.Class类型的对象实例，里面有一个名为staticobj的实例字段：

在前面学习中,我们知道, 一个类被加载后的相关信息都存放在 方法区中, 因为java的面向对象原则,并在堆中创建了一个java.lang.Class 的对象,与 每个方法区的类信息一一映射,

而在java7 之后, 类的静态变量引用 便与该类的Class 绑定在一起,成为其一个字段的形式,一起存放在堆中了

## 6. 方法区的垃圾回收

有些人认为方法区（如Hotspot虚拟机中的元空间或者永久代）是没有垃圾收集行为的，其实不然。

《Java虚拟机规范》对方法区的约束是非常宽松的，提到过可以不要求虚拟机在方法区中实现垃圾收集。事实上也确实有未实现或未能完整实现方法区类型卸载的收集器存在（如JDK11时期的ZGC收集器就不支持类卸载）。

**一般来说这个区域的回收效果比较难令人满意，尤其是类型的卸载，条件相当苛刻。但是这部分区域的回收有时又确实是必要的**。以前sun公司的Bug列表中，曾出现过的若干个严重的Bug就是由于低版本的HotSpot虚拟机对此区域未完全回收而导致内存泄漏。

方法区的垃圾收集主要回收两部分内容：**常量池中废弃的常量和不再使用的类型**

**方法区常量的回收** :

**1、** 方法区内常量池之中主要存放的两大类常量：字面量和符号引用；

- 字面量比较接近Java语言层次的常量概念，如文本字符串、被声明为final的常量值等
- 而符号引用则属于编译原理方面的概念，包括下面三类常量：

类和接口的全限定名
- 字段的名称和描述符
- 方法的名称和描述符

**2、** HotSpot虚拟机对常量池的回收策略是很明确的，只要常量池中的常量没有被任何地方引用，就可以被回收；

**3、** 回收废弃常量与回收Java堆中的对象非常类似（关于常量的回收比较简单）；

**方法区类信息的回收**

判定一个常量是否“废弃”还是相对简单，而要判定一个类型是否属于“不再被使用的类”的条件就比较苛刻了。**需要同时满足下面三个条件**

**1、** 该类所有的实例都已经被回收，也就是Java堆中不存在该类及其任何派生子类的实例；

**2、** 加载该类的类加载器已经被回收，这个条件除非是经过精心设计的可替换类加载器的场景，如OSGi、JSP的重加载等，否则通常是很难达成的；

**3、** 该类信息对应的java.lang.Class对象没有在任何地方被引用，无法在任何地方通过反射访问该类的方法；

Java虚拟机被允许对满足上述三个条件的无用类进行回收，**这里说的仅仅是“被允许”，而并不是和对象一样，没有引用了就必然会回收**。关于是否要对类型进行回收，HotSpot虚拟机提供了`-Xnoclassgc`参数进行控制，还可以使用`-verbose:class` 以及 `-XX：+TraceClass-Loading`、`-XX：+TraceClassUnLoading`查看类加载和卸载信息

在大量使用反射、动态代理、CGLib等字节码框架，动态生成JSP以及OSGi这类频繁自定义类加载器的场景中，通常都需要Java虚拟机具备类型卸载的能力，以保证不会对方法区造成过大的内存压力。

## 7. 运行时数据区总结

根据前面到现在的学习 , jvm运行时数据区差不多都已经描述完了,下面进行一下总结

- 创建线程时 私有的结构: 程序计数器(记录当前线程下一步执行的指令地址)、虚拟机栈(用于保存执行的每一个方法即每一个栈帧)、本地方法栈 (用于执行特殊的方法 native本地方法)
- 线程共有内存 , 堆区 ,方法区
- 堆区 用于存放创建的对象实例, 划分两个区域 新生代和老年代,并有专门的垃圾回收器进行回收内存: Minor GC 针对于新生区，Major GC 针对于老年区，Full GC 针对于整个堆空间和方法区
- 方法区主要用于保存类的元信息和运行时常量池,方法区在 JDK7 之前，使用永久代实现，在 JDK8 之后，使用元空间实现

## 8. 运行时数据区相关的面试题

百度

- 说一下JVM内存模型吧，有哪些区？分别干什么的？

蚂蚁金服：

- Java8的内存分代改进
- JVM内存分哪几个区，每个区的作用是什么？
- JVM内存分布/内存结构？栈和堆的区别？堆的结构？为什么两个survivor区？
- Eden和survior的比例分配

小米：

- jvm内存分区，为什么要有新生代和老年代

字节跳动：

- Java的内存分区
- 讲讲vm运行时数据库区
- 什么时候对象会进入老年代？

京东：

- JVM的内存结构，Eden和Survivor比例。
- JVM内存为什么要分成新生代，老年代，持久代。新生代中为什么要分为Eden和survivor。

天猫：

- Jvm内存模型以及分区，需要详细到每个区放什么。
- JVM的内存模型，Java8做了什么改

拼多多：

- JVM内存分哪几个区，每个区的作用是什么？

美团：

- java内存分配
- jvm的永久代中会发生垃圾回收吗？
- jvm内存分区，为什么要有新生代和老年代？

是不是感觉很简单呢. 可以把自己的想法敲在评论区讨论一下哦
