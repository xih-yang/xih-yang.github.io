# 22、Kotlin 内部类( inner class )
- 来源：https://ddkk.com/zhuanlan/java/kotlin/22.html
- 分类：Kotlin 教程
- 分组：教程目录
Kotlin 支持一个类内部在定义一个类

Kotlin 使用 inner class 关键字定义内部类

Kotlin 内部类与嵌套类的区别是：

**1、** 内部类会带有一个外部类的对象的引用，嵌套类则没有；

**2、** 内部类需要使用innerclass定义，而嵌套类则使用class定义；

Kotlin 内部类会带有一个对外部类的对象的引用，所以内部类可以访问外部类成员属性和成员函数

Kotlin 内部类使用 this@[外部类名] 持有外部类对象的引用

```java
// filename: main.kt
// author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
// Copyright © 2015-2065 www.ddkk.com. All rights reserved.
class Outer {
    private val bar: Int = 1
    var v = "成员属性"
    /**嵌套内部类**/
    inner class Inner {
        fun foo() = bar  // 访问外部类成员
        fun innerTest() {
            var o = this@Outer //获取外部类的成员变量
            println("内部类可以引用外部类的成员，例如：" + o.v)
        }
    }
}
fun main(args: Array<String>) {
    val demo = Outer().Inner().foo()
    println(demo) //   1
    val demo2 = Outer().Inner().innerTest()   
    println(demo2)   // 内部类可以引用外部类的成员，例如：成员属性
}
```

编译运行以上 Kotlin 范例，输出结果如下

```java
$ kotlinc main.kt -include-runtime -d main.jar 
$ java -jar main.jar
1
内部类可以引用外部类的成员，例如：成员属性
kotlin.Unit
```

为了消除歧义，要访问来自外部作用域的 this，我们使用this@label，其中 @label 是一个 代指 this 来源的标签

## 匿名内部类

Kotlin 支持使用对象表达式来创建匿名内部类

```java
// filename: main.kt
// author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
// Copyright © 2015-2065 www.ddkk.com. All rights reserved.
class Test {
    var v = "成员属性"
    fun setInterFace(test: TestInterFace) {
        test.test()
    }
}
/**
 * 定义接口
 */
interface TestInterFace {
    fun test()
}
fun main(args: Array<String>) {
    var test = Test()
    /**
     * 采用对象表达式来创建接口对象，即匿名内部类的实例。
     */
    test.setInterFace(object : TestInterFace {
        override fun test() {
            println("对象表达式创建匿名内部类的实例")
        }
    })
}
```

编译运行以上 Kotlin 范例，输出结果如下

```java
$ kotlinc main.kt -include-runtime -d main.jar 
$ java -jar main.jar
对象表达式创建匿名内部类的实例
```
