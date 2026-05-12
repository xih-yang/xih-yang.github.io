# 06、Java 8 - Lambda 表达式 （ 上 ）- 简介
- 来源：https://ddkk.com/zhuanlan/java/java8/6.html
- 分类：Java 8 新特性
- 分组：教程目录
Lambda 表达式在 Java 8 中引入，并且被吹捧为 Java 8 最大的特性。

Lambda 表达式是函数式编程的的一个重要特性，标志者 Java 向函数式编程迈出了重要的第一步。

## Java Lambda 表达式语法

Java Lambda 表达式的语法结构如下

```java
parameter -> expression body
```

实际代码可能如下

#### 有参数且只有一条语句时

```java
(a,b) -> a + b
```

#### 只有一个参数时

```java
a  -> a
```

#### 没有参数时

```java
()  -> System.out.println("DDKK.COM 弟弟快看，程序员编程资料站")
```

#### 有多条语句时

```java
(a,b) -> {
    int c = a + b;
    System.out.println("DDKK.COM 弟弟快看，程序员编程资料站")
}
```

针对这个 Java Lambda 表达式语法，有几个重要的特征需要说明

- **可选的参数类型声明** ： 无需声明参数的类型。编译器可以从参数的值推断出相同的值。
- **可选的参数周围的小括号 ()** ： 如果只有一个参数，可以忽略参数周围的小括号。但如果有多个参数，则必须添加小括号。
- **可选的大括号 {}** : 如果 Lambda 表达式只包含一条语句，那么可以省略大括号。但如果有多条语句，则必须添加大括号。
- **可选的 return 关键字** ： 如果 Lambda 表达式只有一条语句，那么编译器会自动 return 该语句最后的结果。但如果显式使用了 return 语句，则必须添加大括号 {} ，哪怕只有一条语句。

## Java Lambda 表达式的原理

后面我们会讲到，Java 8 中的 Lambda 表达式其实是一个特殊的只有一个方法的类的实例。

这些类是 Java 8 内部已经定义好的，而且实现了 java.lang.FunctionalInterface 这个接口。

这个java.lang.FunctionalInterface 接口是一种信息性注解类型，用于标识一个接口类型声明为函数接口（ functional interface ）。

从某些方面说，Java 8 的 Lambda 表达式是使用匿名内部类的语法创建了 java.util.function 包下相应签名的接口的或者其它自定义的只有一个方法的接口实例。

但是，实际上，Java 8 中的 Lambda 不仅仅是使用匿名内部类，还使用了 Java 8 接口的默认方法和一些其它的功能。这方面，有空我会写一篇文章。

## 范例一： Java Lambda 表达式

Lambda 比较常见的使用场景就是 new Runnable 匿名内部类的使用

#### LambdaTester.java

```java
public class LambdaTester
{
    public static void main(String[] args)
    {
        Runnable r = () -> System.out.println("你好，DDKK.COM 弟弟快看，程序员编程资料站，你好，教程 ");
        Thread th = new Thread(r);
        th.start(); 
     }
}
```

运行结果如下

```java
[penglei@www.ddkk.com helloworld]$ javac LambdaTester.java && java LambdaTester
你好，DDKK.COM 弟弟快看，程序员编程资料站，你好，教程 
```

## 范例二

#### LambdaTester.java

```java
public class LambdaTester {
   public static void main(String args[])
   {
      LambdaTester tester = new LambdaTester();
      // 有声明参数类型
      MathOperation addition = (int a, int b) -> a + b;
      // 没有声明参数类型
      MathOperation subtraction = (a, b) -> a - b;
      // 使用 return 语句显式返回值需要添加大括号
      MathOperation multiplication = (int a, int b) -> { return a * b; };
      // 如果只有一条语句，那么可以省略大括号，Java 会返回表达式的值
      MathOperation division = (int a, int b) -> a / b;
      System.out.println("10 + 5 = " + tester.operate(10, 5, addition));
      System.out.println("10 - 5 = " + tester.operate(10, 5, subtraction));
      System.out.println("10 x 5 = " + tester.operate(10, 5, multiplication));
      System.out.println("10 / 5 = " + tester.operate(10, 5, division));
   }
   interface MathOperation {
      int operation(int a, int b);
   }
   private int operate(int a, int b, MathOperation mathOperation) {
      return mathOperation.operation(a, b);
   }
}
```

运行结果如下

```java
[penglei@www.ddkk.com helloworld]$ javac LambdaTester.java && java LambdaTester
10 + 5 = 15
10 - 5 = 5
10 x 5 = 50
10 / 5 = 2
```

## Java Lambda 表达式的缺点

不知道大家有没有从上面的表达式中看到一些端倪，好像，好像 Java 8 中的 Lambda 不能凭空出现。

Java Lambda 表达式最大的缺点，就是不能像其它语言的 Lambda 表达式一样凭空出现。

Java 中的 Lambda 表达式需要有一个函数接口声明作为模板。这个模板定义了 Lambda 表达式的参数类型和返回值类型。

例如下面的代码，我们先要声明一个函数接口类型，然后才能定义一个参数和返回值都一样的表达式

#### LambdaTester.java

```java
public class LambdaTester {
   // 先声明一个函数接口
   interface GreetingService {
      void sayMessage(String message);
   }
   public static void main(String args[])
   {
      LambdaTester tester = new LambdaTester();
      // 有小括号
      GreetingService greetService1 = message ->
      System.out.println("你好，" + message);
      // 省略小括号
      GreetingService greetService2 = (message) ->
      System.out.println("你好，" + message);
      greetService1.sayMessage("DDKK.COM 弟弟快看，程序员编程资料站");
      greetService2.sayMessage("教程 ");
   }
}
```

运行结果如下

```java
[penglei@www.ddkk.com helloworld]$ javac LambdaTester.java && java LambdaTester
你好，DDKK.COM 弟弟快看，程序员编程资料站
你好，教程 
```
