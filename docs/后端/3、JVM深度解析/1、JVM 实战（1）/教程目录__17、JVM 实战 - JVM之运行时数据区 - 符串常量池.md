# 17、JVM 实战 - JVM之运行时数据区 - 符串常量池
- 来源：https://ddkk.com/zhuanlan/java/jvm/1/17.html
- 分类：JVM 实战
- 分组：教程目录
### 一、常量池(Constant Pool)、字符串常量池(String Table)和运行时常量池(Runtime Constant Pool)

常量池是字节码文件的一部分，主要存储了编译期间的各种字面量和符号引用(如下代码)，这部分内容在类加载后会存放到运行时常量池中，常量池和运行时常量池一一对应。

```java
 Constant pool:
  1 = Fieldref          4.#34         // method/MethodOOM$1.val$args:[Ljava/lang/String;
  2 = Methodref         5.#35         // java/lang/Object."<init>":()V
  3 = Methodref         36.#37        // net/sf/cglib/proxy/MethodProxy.invokeSuper:(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;
  4 = Class             38            // method/MethodOOM$1
  5 = Class             39            // java/lang/Object
  6 = Class             40            // net/sf/cglib/proxy/MethodInterceptor
  7 = Utf8               val$args
  8 = Utf8               [Ljava/lang/String;
  9 = Utf8               <init>
 10 = Utf8               ([Ljava/lang/String;)V
 11 = Utf8               Code
 12 = Utf8               LineNumberTable
 13 = Utf8               LocalVariableTable
```

- 运行时常量池是方法区的一部分，运行时常量池具备动态性，除了已加载常量池的内容，还有类加载时解析和运行时动态链接之后由符号引用转换的直接引用。
- 字符串常量池是针对String类型设计常量池，因为String类型的字符串是程序创建销毁最频繁的内容，这会带来极大的性能开销，字符串常量池的设计就是为了减少这种操作，同时也为了节省内存，创建String类型时，如果发现字符串常量池已经有这个字符串，就不会再去创建，而是将这个字符串的引用给这个变量。这种操作也让String类型不允许被修改，这也是String是final的原因之一。JDK1.6之前字符串常量池在方法区，JDK1.7以后移入Java堆中。

### 二、String#intern()方法

让字符串进入常量池**的方式又两种：使用双引号定义字符串，如String xx = "abc"，另外一种就是使用String#intern()方法**。

String::intern()是一个本地方法，它的作用是如果字符串常量池中已经包含一个等于（equals比较）此String对象的字符串，则返回代表常量池中这个字符串的String对象的引用;否则，会将此String对象包含的字符串添加到常量池中，并且返回此String对象的引用。

```java
public class StringTableDemo {
    public static void main(String[] args) {
        String str1 = new StringBuilder("计算机").append("软件").toString();
        System.out.println(str1.intern() == str1); 
        String str2 = new StringBuilder("Ja").append("va").toString();
        System.out.println(str2.intern() == str2);
    }
}
```

上面的关于intern()方法的描述和代码摘抄自《深入理解Java虚拟机》，代码执行之后，在JDK1.6版本返回两个false，而JDK1.7会返回true,false。

new StringBuilder("计算机").append("软件").toString()返回一个String对象，它的字符串内容是"计算机软件"，此时，"计算机软件"还未进入字符串常量池，执行str1.intern()之后，"计算机软件"会被放入字符串常量池，对于JDK1.6，字符串常量池在永久代，所以这个“计算机软件”放入常量池的动作是复制该字符串到字符串常量池，同时返回复制完成之后的返回位于常量池中的字符串的引用，而new StringBuilder("计算机").append("软件").toString()生成的原对象在Java堆中，所以str1.intern() == str1为false，str2.intern() == str2同理。

对于JDK1.7，字符串常量池位于Java堆中，str1.intern()执行同样先需要将“计算机软件”放入字符串常量池的操作，但是此时却不需要将字符串复制进入常量池，而是将"计算机软件"的引用存进常量池并返回，所以str1.intern()和str1都指向new StringBuilder("计算机").append("软件").toString();生成的对象，所以为true，而str2.intern() == str2为false，是因为Java字符串在虚拟机启动的过程中就已经被存进常量池，str2.intern()返回的是常量池中Jave字符串的引用，而str2指向堆中new StringBuilder("Ja").append("va").toString();生成的对象，所以为false。

**总结JDK1.6到JDK1.7字符串常量池的变化**：

1、字符串常量池从永久代移到Java堆。

2、String#intern()方法执行时，如果常量池没有等于（equals比较，不是==）该String对象的字符串，即首次遇到该字符串，JDK1.6会复制一份字符串到字符串常量池并返回引用，JDK1.7则会把该String对象的引用存入字符串常量池并返回。

3、无论是哪个版本JDK，常量池都是字面量，不是对象，因为JVM规范规定，对象只能在堆中，所以常量池中要么是String字面量要么是String对象的引用。
