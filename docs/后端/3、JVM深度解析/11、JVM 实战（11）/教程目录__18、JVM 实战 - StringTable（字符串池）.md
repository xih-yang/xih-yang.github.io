# 18、JVM 实战 - StringTable（字符串池）
- 来源：https://ddkk.com/zhuanlan/java/jvm/11/18.html
- 分类：JVM 实战
- 分组：教程目录
## 1.String的基本特性

```java
String:字符串，使用一对""引起来表示。
String sl = "atguigu";//字面量的定义方式
String s2 = new String( "hello");//new的定义方式
String声明为final的，不可被继承
String实现了serializable接口:表示字符串是支持序列化的。
实现了Comparable接口:表示String可以比较大小
String在jdk8及以前内部定义了final char[] value用于存储字符串数据。jdk9时改为byte[]
String存储结构变更
String 再也不用char[]来存储啦，改成了byte[]加上编码标记，节约了一些空间。
```

StringBuffer和 StringBuilder也是跟着变动的

String:代表不可变的字符序列。简称:不可变性。

当对字符串重新赋值时，需要重写指定内存区域赋值，不能使用原有的value进行赋值。

当对现有的字符串进行连接操作时，也需要重新指定内存区域赋值，不能使用原有的value进行赋值。

当调用String的replace()方法修改指定字符或字符串时，也需要重新指定内存区域赋值，不能使用原有的value进行赋值。

通过字面量的方式（区别于new）给一个字符串赋值，此时的字符串值声明在字符串常量池中。

不可变性另一种体现形式：

```java
	/**
     * 通过exchange是不能改变字符串的值的，只是在方法中短暂修改，就如同传入参数是int一样
     */
	@Test
    public void test() {
        StringTest es = new StringTest();
        exchange(es.s, es.c);
        System.out.println(es.s);//good
        System.out.println(es.c);//1bc
        es.s = "oo";
        System.out.println(es.s);//oo
        String tt = "tt";
        exchange(tt, es.c);
        System.out.println(tt);//tt
        exchangeStr(es);
        System.out.println(es.s);//better
    }
    class StringTest {
        String s = "good";
        char[] c = {
     'a', 'b', 'c'};
    }
    public void exchangeStr(StringTest es){
        es.s = "better";
    }
    public void exchange(String s, char[] c) {
        s = "s";
        c[0] = '1';
        System.out.println(s);//s
        System.out.println(c);//1bc
    }
```

字符串常量池中是不会存储相同内容的字符串的

String的String Pool是一个固定大小的Hashtable，默认值大小长度是1009。如果放进字符串常量池中的String非常多，就会造成Hash冲突严重，从而导致链表会很长，而链表长了后直接会造成的影响就是当调用String.intern时性能会大幅下降。

```java
使用 -XX:StringTablesize 可设置stringTable的长度
```

```java
在jdk6中StringTable是固定的，就是1009的长度，所以如果常量池中的字符串过多就会导致效率下降很快。StringTablesize设置没有要求
在jdk7中，StringTable的长度默认值是60013，1009是可设置的最小值。
从jdk8开始，设置StringTable的长度的话，1009是可设置的最小值。
```

## 2.String的内存分配

在Java语言中有8种基本数据类型和一种比较特殊的类型string。这些类型为了使它们在运行过程中速度更快、更节省内存，都提供了一种常量池的概念。

常量池就类似一个Java系统级别提供的缓存。8种基本数据类型的常量池都是系统协调的，string类型的常量池比较特殊。它的主要使用方法有两种。

- 直接使用双引号声明出来的String对象会直接存储在常量池中。比如:String info = “gg”;
- 如果不是用双引号声明的String对象，可以使用String提供的 intern () 方法。这个后面重点谈

Java 6 及以前，字符串常量池存放在永久代。

Java 7 中 oracle 的工程师对字符串池的逻辑做了很大的改变，即将字符串常量池的位置调整到Java堆内。

- 所有的字符串都保存在堆(Heap）中，和其他普通对象一样，这样可以让你在进行调优应用时仅需要调整堆大小就可以了。
- 字符串常量池概念原本使用得比较多，但是这个改动使得我们有足够的理由让我们重新考虑在Java 7 中使用String.intern ()

Java8元空间，字符串常量在堆

红色框里的字比较模糊，一个是静态变量、一个是字符串常量池StringTable

jdk6

jdk7

StringTable调整的原因

①permSize默认比较小

②永久代垃圾回收频率低

## 3.String的基本操作

Java语言规范里要求完全相同的字符串字面量，应该包含同样的Unicode字符序列(包含同一份码点序列的常量)，并且必须是指向同一个string类实例。

## 4.字符串拼接操作

**1、** 常量与常量的拼接结果在常量池，原理是编译期优化；

**2、** 常量池中不会存在相同内容的常量；

**3、** 只要其中有一个是变量，结果就在堆中变量拼接的原理是stringBuilder；

**4、** 如果拼接的结果调用intern()方法，则主动将常量池中还没有的字符串对象放入池中，并返回此对象地址；

可见我的另一篇博客: [https://blog.csdn.net/munangs/article/details/123200123](https://blog.csdn.net/munangs/article/details/123200123).

## 5.intern()的使用

可见我的另一篇博客: [https://blog.csdn.net/munangs/article/details/123200123](https://blog.csdn.net/munangs/article/details/123200123).

如果不是用双引号声明的string对象，可以使用string提供的intern方法: intern方法会从字符串常量池中查询当前字符串是否存在，若不存在就会将当前字符串放入常量池中。

- 比如: String myInfo = new String (“I love gs”).intern () ;
- 也就是说，如果在任意字符串上调用String.intern方法，那么其返回结果所指向的那个类实例，必须和直接以常量形式出现的字符串实例完全相同。
- 因此，下列表达式的值必定是true:

( “a” +“b” + “c” ) .intern() == “abc”
- 也就是说 Interned String就是确保字符串在内存里只有一份拷贝，这样可以节约内存空间，加快字符串操作任务的执行速度。注意，这个值会被存放在字符串内部池(String Intern Pool）

```java
/**
         * s,s3存的都是对象地址值
         * .intern()后str、str3就存的是字符串常量池中的字符串地址值
         */
        String s = new String("1");
        String str = s.intern();
        String s2 = "1";
        System.out.println(s == s2);//false
        System.out.println(str == s2);//true
        String s3 = new String("1") + new String("1");
        String s4 = "11";
        String str3 = s3.intern();
        System.out.println(s3 == s4);//false
        System.out.println(str3 == s4);//true
```

保证变量s指向的是字符串常量池中的数据的两种方式:

- 方式一:String s = “shkstart";//字面量定义的方式
- 方式二:调用 intern()

String s = new String( “shkstart” ).intern();

String s = new StringBuilder(“shkstart”).toString( ).intern();

> String 的 intern() 的使用:
>
> jdk1.6中，将这个字符串对象尝试放入串池。
>
>
> 如果串池中有，则并不会放入。返回已有的串池中的对象的地址
>
> 如果没有，会把此对象复制一份，放入串池，并返回串池中的对象地址

Jdk1.7起，将这个字符串对象尝试放入串池。

> 如果串池中有，则并不会放入。返回已有的串池中的对象的地址
>
> 如果没有，则会把对象的引用地址复制一份，放入串池，并返回串池中的引用地址

执行效率:

通过stringBuilder的append()的方式添加字符串的效率要远高于使用String的字符串拼接方式详情: StringBuilder的append()的方式:自始至终中只创建过一个StringBuilder的对象；

使用string的字符串拼接方式：创建过多个StringBuilder和String的对象

使用string的字符串拼接方式：内存中由于创建了较多的StringBuilder和String的对象，内存占用更大；如果进行GC，需要花费额外的时间。

改进的空间:在实际开发中，如果基本确定要前前后后添加的字符串长度不高于某个限定值highLevel的情况下,建议使用构造器

```java
StringBuilder s = new StringBuilder(highlevel);//new char[highlevel]
```

使用intern()测试执行效率:空间使用上：对于程序中大量存在存在的字符串，尤其其中存在很多重复字符串时，使用intern()可以节省内存空间。

注意

```java
new String("ab")会创建几个对象
两个，一个对象是:new关键字在堆空间创建的；另一个对象是:字符串常量池中的对象“ab”。字节码指令: Ldc
```

```java
new String("a")+new String("b")会创建几个对象
可以说5个也可以说6个
如图解
```

## 6.StringTable的垃圾回收

string的垃圾回收:

参数

```java
-Xms15m  -Xmx15m  -XX:+PrintStringTableStatistics  -XX:+PrintGCDetails
```

## 7.G1中String去重操作

对许多Java应用(有大的也有小的）但:

> 堆存活数据集合里面string对象占了25%
>
> 堆存活数据集合里面重复的string对象有13.5%
>
> string对象的平均长度是45

许多大规模的Java应用的瓶颈在于内存，测试表明，在这些类型的应用里面，Java堆中存活的数据集合差不多25%是String对象。更进一步，这里面差不多一半String对象是重复的，重复的意思是说:

string1.equals (string2)=true。堆上存在重复的string对象必然是一种内存的浪费。这个项目将在G1垃圾收集器中实现自动持续对重复的String对象进行去重，这样就能避免浪费内存。

实现
当垃圾收集器工作的时候，会访问堆上存活的对象。对每一个访问的对象都会检查是否是候选的要去重的String对象。

如果是，把这个对象的一个引用插入到队列中等待后续的处理。一个去重的线程在后台运行，处理这个队列。处理队列的一个元素意味着从队列删除这个元素，然后尝试去重它引用的string对象。

使用一个hashtable来记录所有的被string对象使用的不重复的char数组。当去重的时候，会查这个hashtable，来看堆上是否已经存在一个一模一样的char数组。

如果存在，string对象会被调整引用那个数组，释放对原来的数组的引用，最终会被垃圾收集器回收掉。

如果查找失败，char数组会被插入到hashtable，这样以后的时候就可以共享这个数组了。

·命令行选项

UseStringDeduplication (bool) : 开启string去重，默认是不开启的，需要手动开启。

PrintStringDeduplicationstatistics (bool) : 打印详细的去重统计信息

StringDeduplicationAgeThreshold (uintx) : 达到这个年龄的string对象被认为是去重的候选对象
