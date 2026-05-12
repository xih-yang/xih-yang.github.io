# 07、JVM 实战 - JVM之运行时数据区 - 局部变量表
- 来源：https://ddkk.com/zhuanlan/java/jvm/1/7.html
- 分类：JVM 实战
- 分组：教程目录
虚拟机栈由栈帧组成，栈帧由局部变量表、操作数栈、动态链接和方法返回四部分组成，有的虚拟机还有一些附加信息。栈帧和Java方法对应，所以可以通过Java方法理解栈帧的各部分内容。

### 一、局部变量表(Local Variables Table)

局部变量表是一组变量值的存储空间，用于存放方法参数和方法内部定义的局部变量。局部变量表的最大容量在编译期间就已经确定，保存在字节码文件的Code属性的locals里面，并且在运行期间也不会改变。

```java
public class LocalVariableTable {
    public int add(int x, int y) {
        long i = 1L;
        {
            long j = 1;
            i = j;
        }
        int z = x + y;
        return z;
    }
}
```

```java
Code:
  stack=2, locals=7, args_size=3
     0: lconst_1
     1: lstore_3
     2: lconst_1
     3: lstore        5
     5: lload         5
     7: lstore_3
     8: iload_1
     9: iload_2
    10: iadd
    11: istore        5
    13: iload         5
    15: ireturn
  LineNumberTable:
    line 5: 0
    line 7: 2
    line 8: 5
    line 10: 8
    line 11: 13
  LocalVariableTable:
    Start  Length  Slot  Name   Signature
        5       3     5     j   J
        0      16     0  this   Lvmstack/LocalVariableTable;
        0      16     1     x   I
        0      16     2     y   I
        2      14     3     i   J
       13       3     5     z   I
```

如上代码，上面是源码，下面为javap -v LocalVariableTable.class之后的字节码文件的Code属性部分。

- stack=2是操作数栈的最大深度，locals=7是局部变量的最大容量，args_size=3是方法参数的个数（因为是成员方法，所以除了x,y,还包含了this，静态方法则没有this），第一列数字的0-15则是方法执行时对应的JVM字节码指令地址，后面是字节码指令。
- LineNumberTable则原Java方法和字节码指令的行号对应，这里原Java方法第一行是5，最后一行是13，分别对应字节码的0-15行。
- LocalVariableTable是局部变量表，可以看到局部变量在编译期间就确定了变量内容，Start和Length是变量作用域的表示，Start是开始位置，0对应字节码指令的行号的0，Length是偏移量，Start=0和Length=16表示this这个变量在字节码指令0-15行这个作用域里一直有效，Slot是变量槽的索引，意义后面补充，Name是变量名，Signature是变量类型，I表示为int类型，J是long类型。

**变量槽(Slot)**：

变量槽是局部变量表的最小存储单元，变量槽可以放置基本数据类型、引用数据类型、returnAddress数据类型。每一个变量槽都占据的32bit的内存空间。

- 基本数据类型：基本数据类型包括byte、boolean、short、int、float、long、double、char，变量槽只能存储32bit，所以64bit的long、double用2个连续变量槽存储，其他类型都用一个变量槽存储。
- 引用数据类型: 引用数据类型包括对象类型和数组类型，变槽量存储了引用类型的引用地址，占用一个变量槽。
- returnAddress数据类型：returnAddress指向了一条字节码指令的地址，也占用一个变量槽，这种类型基本被虚拟机淘汰。

局部变量表是实际是一个数字数组，byte、short、char都会转为为int类型，boolean则用0和非0表示。每一个变量槽都有自己对应的索引，索引从0开始到最大长度处结束，如果是成员方法，this变量始终会占据0索引对应的位置，对于long和double类型，则用两个变量槽中的第一个索引对应，验证这点可在上面的字节码指令代码看到i变量的Slot一列索引是3，之后是z变量的5并非4。

**变量的作用域和Slot的复用：**

变量本身是有作用域的，在上面Java方法代码中，将变量j放在代码块中，j的作用域范围就限制在代码块内，变量槽本身是可以复用的，这样可以提高存储资源的利用，当程序计数器的值（当前要执行字节码指令的地址，字节码代码中Code属性的第一列数字）超出了变量的作用域，变量槽就会交给其他变量复用，在字节码指令代码中Slot一列中可以看到j变量和z变量的索引都是5（j的变量作用域是5-8行，对应原Java方法的8-10行），说明z变量复用了j变量的变量槽。

**变量槽的复用对GC的影响**：

JVM的垃圾回收会将没有引用的对象回收，那超出变量作用域的对象会不会被回收？下面是一段摘抄自《深入理解Java虚拟机》的代码和执行结果，代码内容为创建一个64M的字节数组对象，手动进行GC，执行这段代码时，可以设置JVM参数为-verbose:gc或者-XX:+PrintGC，就可以看到GC的简单日志。

```java
public static void main(String[] args) {
    {
        byte[] b = new byte[1024 * 1024 * 60];
    }
    System.gc();
}
```

```java
[GC (System.gc())  64000K->62208K(243712K), 0.0012488 secs]
[Full GC (System.gc())  62208K->62051K(243712K), 0.0041738 secs]
```

理论上GC时，已经超出了变量b的作用域范围，其对象理应被GC掉，但实际并没有，说明变量b和其对象的引用在超出变量范围后依然存在，导致无法被GC。再来看下面代码和执行结果，在加入int a=0;之后，成功GC掉了数组对象，说明b的变量槽被a复用，导致b与数组对象引用被打断，数组对象成功被GC。所以超出作用域范围的对象不一定会被回收，不过可以利用这点，当方法存在超出作用域大内存对象时，可以手动设置变量为null，从而让对象可以被回收，但《深入理解Java虚拟机》作者并不推荐，一是这种方式并不优雅，二是这种代码只存在试验代码中，且赋null值操作在JVM编译优化之后，看以看做无效操作。

```java
public static void main(String[] args) {
    {
        byte[] b = new byte[1024 * 1024 * 60];
    }
    int a = 0;
    System.gc();
}
```

```java
[GC (System.gc())  64000K->62240K(243712K), 0.0010034 secs]
[Full GC (System.gc())  62240K->611K(243712K), 0.0041288 secs]    
```

**线程安全问题：**

栈帧不允许其他线程访问，所以栈帧中的局部变量也不存在线程安全问题。

**局部变量的值从哪里来？**

线程在执行Java方法时，首先会将方法参数放入到局部变量表，对于方法内部的变量，基本类型的变量和值都会存储在局部变量表中，引用类型则先会在堆中创建对象，再将引用放入到局部变量中，局部变量表占据栈帧的大部分内存，所以如果虚拟机栈大小限定，局部变量太多就可能会导致StackOverflowError异常。局部变量在进入局部变量表时并不会像静态变量一样有初始化的从操作，所以局部变量并没有初值，所以需手动设置初值，否则在调用改变量时编译不通过。
