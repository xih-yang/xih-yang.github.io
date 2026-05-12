# 17、JVM 实战 - 字节码与执行细节
- 来源：https://ddkk.com/zhuanlan/java/jvm/7/17.html
- 分类：JVM 实战
- 分组：教程目录
### 1、字节码文件的跨平台性

**Java语言：跨平台的语言（write once ，run anywhere）**

- 当Java源代码成功编译成字节码后，如果想在不同的平台上面运行，则无须再次编译

**Java虚拟机：跨语言的平台**

- **Java虚拟机不和包括 Java 在内的任何语言绑定，它只与“Class 文件”这种特定的二进制文件格式所关联。** 无论使用何种语言进行软件开发，只要能将源文件编译为正确的Class文件，那么这种语言就可以在Java虚拟机上执行。

想要让一个Java程序正确地运行在JVM中，Java源码就必须要被编译为符合JVM规范的字节码。

- 前端编译器的主要任务就是负责将符合Java语法规范的Java代码转换为符合JVM规范的字节码文件。
- javac是一种能够将Java源码编译为字节码的前端编译器。
- Javac编译器在将Java源码编译为一个有效的字节码文件过程中经历了4个步骤，分别是词法解析、语法解析、语义解析以及生成字节码。

**前端编译器**

- Java源代码的编译结果是字节码，那么肯定需要有一种编译器能够将Java源码编译为字节码，承担这个重要责任的就是配置在path环境变量中的javac编译器
- javac是一种能够将Java源码编译为字节码的前端编译器。
- 前端编译器并不会直接涉及编译优化等方面的技术，而是将这些具体优化细节移交给HotSpot的JIT编译器负责。

### 2、透过字节码看代码细节

#### 2.1、判断 Integer 是否相等

**（面试题）判断下列代码的True或false？**

```java
public class IntegerTest {
    public static void main(String[] args) {
        Integer x = 5;
        int y = 5;
        System.out.println(x == y);
        Integer x1 = 10;
        Integer y1 = 10;
        System.out.println(x1 == y1);
        Integer x2 = 128;
        Integer y2 = 128;
        System.out.println(x2 == y2);
    }
}
```

运行结果：

分析：通过观察字节码我们发现创建创建Integer对象的时候调用了 valueOf() 方法

进入该方法之后

对参数i 进行了判断 i >= IntegerCache.low && i <= IntegerCache.high，如果在这个范围内就直接获取数组中的Integer对象。

- **Integer有一个缓存**，范围为-128~127，Integer x = 5，在字节码中实质是调用了Integer.valueOf，在此范围内返回的就是IntergerCache中的Integer对象，否则会返回新的Integer对象。
- y 是 基本数据类型的5
- x == y的比较虽然表面看是引用类型和基本类型的比较，但是x会调用``方法自动拆箱为基本数据类型，最终的比较就是x和y的值进行的比较，显然相等，true

```java
    Integer x = 5;//调用Integer.valueOf 从数组中返回
    int y = 5; // 基本数据5 
    System.out.println(x == y); //true
```

```java
    Integer x1 = 10;  // 从数组中返回
    Integer y1 = 10;  // 从数组中返回
    System.out.println(x1 == y1); // 使用的是内部缓存数组中的同一个对象，返回true
```

```java
    Integer x2 = 128; // 不在缓存范围内,创建了新的对象
    Integer y2 = 128; // 不在缓存范围内,创建了新的对象
    System.out.println(x2 == y2); // 是两个对象，false
```

#### 2.2、判断 String 是否相等

运行结果：

分析：

- 一旦字符串的拼接操作有变量就会使用StringBuilder进行拼接，拼接完成后调用StringBuilder.toString返回一个新的String对象str1
- str2是从字符串常量池中直接获取的
- 所以str1 不等于 str2

#### 2.3、类初始化相关

**（面试题）下列程序的执行结果？**

```java
class Father {
    int x = 10;
    public Father() {
        this.print();
        x = 20;
    }
    public void print() {
        System.out.println("Father.x = " + x);
    }
}
class Son extends Father {
    int x = 30;
    //    float x = 30.1F;
    public Son() {
        this.print();
        x = 40;
    }
    public void print() {
        System.out.println("Son.x = " + x);
    }
}
public class SonTest {
    public static void main(String[] args) {
        Father f = new Son();
        System.out.println(f.x);
    }
}
```

打印结果为：

**成员变量（非静态的）的赋值过程：**

**1、** 默认初始化；

**2、** 显式初始化/代码块中初始化；

**3、** 构造器中初始化；

**4、** 有了对象之后，可以“对象.属性”或"对象.set方法"的方式对成员变量进行赋值；
