# 24、Kotlin 接口 ( interface )
- 来源：https://ddkk.com/zhuanlan/java/kotlin/24.html
- 分类：Kotlin 教程
- 分组：教程目录
Kotlin 使用 **interface** 关键字定义接口，这点与 JAVA 语言类似

### 定义接口( interface )

Kotlin **interface** 关键字可以定义接口，定义接口和定义类类似

Kotlin 还允许接口( interface ) 的方法有默认实现

```java
interface MyInterface {
    fun bar()    // 未实现
    fun foo() {  //已实现
      // 可选的方法体
      println("foo")
    }
}
```

上面的代码定义了一个名为 MyInterface 的接口，它有两个方法: bar() 和 foo()，其中 foo() 方法有默认实现

### 实现接口 ( interface )

Kotlin 可以定义一个或者对象实现一个或多个接口。

Kotlin 实现接口的方法就是在类名或者对象名后面使用 **冒号(:)+接口名**

Kotlin 必须实现接口中所有没有默认实现的方法

```java
class MyClass : MyInterface {
    override fun bar() {
        // 方法体
    }
}
```

上面的代码定义了一个类 MyClass 实现了 MyInterface 接口，同时还重写了 bar 方法

### 范例

```java
// filename: main.kt
// author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
// Copyright © 2015-2065 www.ddkk.com. All rights reserved.
interface MyInterface {
    fun bar()
    fun foo() {
        // 可选的方法体
        println("foo")
    }
    // fun hello()
}
class MyImpl : MyInterface {
    override fun bar() {
        // 方法体
        println("bar")
    }
}
fun main(args: Array<String>) {
    val c =  MyImpl()
    c.foo();
    c.bar();
}
```

运行以上 Kotlin 范例，输出结果如下：

```java
$ kotlinc main.kt -include-runtime -d main.jar 
$ java -jar main.jar
foo
bar
```

Kotlin 必须实现接口中所有没有默认实现的方法

如果把范例中的 // fun hello() 的 // 去掉，编译时就会报错

```java
kotlinc main.kt -include-runtime -d main.jar
main.kt:14:1: error: class 'MyImpl' is not abstract and does not implement abstract member public abstract fun hello(): Unit defined in MyInterface
class MyImpl : MyInterface {
```

## 接口 ( interface ) 中的属性

Kotlin 接口中的属性只能是抽象的，不允许初始化值

Kotlin 接口不会保存属性值，实现接口时，必须重写属性

```java
interface MyInterface
{
    var name:String // name 属性, 抽象的,不能初始化
}
class MyImpl : MyInterface 
{
    override var name: String = "DDKK.COM 弟弟快看，程序员编程资料站" //重载属性
}
```

### 范例

```java
// filename: main.kt
// author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
// Copyright © 2015-2065 www.ddkk.com. All rights reserved.
interface MyInterface 
{
    var name:String         // name 属性, 抽象的
    fun bar()
    fun foo() {
                            // 可选的方法体
        println("foo")
    }
}
class MyImpl : MyInterface 
{
    override var name: String = "DDKK.COM 弟弟快看，程序员编程资料站" //重载属性
    override fun bar() 
    {
        // 方法体
        println("bar")
    }
}
fun main(args: Array<String>) 
{
    val c =  MyImpl()
    c.foo();
    c.bar();
    println(c.name)
}
```

编译运行以上 Kotlin 范例，输出结果如下

```java
$ kotlinc main.kt -include-runtime -d main.jar 
$ java -jar main.jar
foo
bar
DDKK.COM 弟弟快看，程序员编程资料站
```

## Kotlin 实现接口时的函数重写

日常Kotlin 开发时，可能要求一个类实现多个接口，就会遇到同一方法继承多个实现的问题

Kotlin 实现接口，重写接口方法时，默认不会调用接口的方法，如果要调用接口的方法，必须使用 **super** 关键字显示调用

### 范例

```java
interface A 
{
    fun foo() { print("A") }   // 已实现
    fun bar()                  // 未实现，没有方法体，是抽象的
}
interface B 
{
    fun foo() { print("B") }   // 已实现
    fun bar() { print("bar") } // 已实现
}
class C : A 
{
    override fun bar() { print("bar") }   // 重写
}
class D : A, B {
    override fun foo() 
    {
        super<A>.foo()
        super<B>.foo()
    }
    override fun bar()
    {
        super<B>.bar()
    }
}
fun main(args: Array<String>)
{
    val d =  D()
    d.foo();
    d.bar();
}
```

编译运行以上 Kotlin 范例，输出结果如下

```java
$ kotlinc main.kt -include-runtime -d main.jar 
$ java -jar main.jar
ABbar
```

上面范例中接口 A 和 B 都定义了方法 foo() 和 bar()， 两者都实现了 foo(), B 实现了 bar()

因为C 是一个实现了 A 的具体类，所以必须要重写 bar() 并实现这个抽象方法

然而，如果我们从 A 和 B 派生 D，我们需要实现多个接口继承的所有方法，并指明 D 应该如何实现它们

这一规则 既适用于继承单个实现（bar()）的方法也适用于继承多个实现（foo()）的方法
