# 23、Kotlin 继承( extend )
- 来源：https://ddkk.com/zhuanlan/java/kotlin/23.html
- 分类：Kotlin 教程
- 分组：教程目录
Kotlin 允许一个类继承自另一个类

Kotlin 中所有类都继承自 Any 类

Any类是所有类的超类，对于没有超类型声明的类是默认超类

Kotlin 规定如果一个类可以给继承，必须使用 **open** 关键字修饰

> 注意：Any 不是 java.lang.Object

```java
class Example // 从 Any 隐式继承
```

Any默认提供了三个函数：

```java
equals()
hashCode()
toString()
```

如果一个类要被继承，可以使用 open 关键字进行修饰

```java
open class Base(p: Int)           // 定义基类
class Derived(p: Int) : Base(p)
```

## 构造函数

### 子类有主构造函数

如果子类有主构造函数， 则基类必须在主构造函数中立即初始化。

#### 范例

```java
// filename: main.kt
// author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
// Copyright © 2015-2065 www.ddkk.com. All rights reserved.
open class Person(var name : String, var age : Int){// 基类
}
class Student(name : String, age : Int, var no : String, var score : Int) : Person(name, age) {
}
// 测试
fun main(args: Array<String>)
{
    val s =  Student("Runoob", 18, "S12346", 89)
    println("学生名： ${s.name}")
    println("年龄： ${s.age}")
    println("学生号： ${s.no}")
    println("成绩： ${s.score}")
}
```

编译运行以上 Kotlin 范例，输出结果如下

```java
$ kotlinc main.kt -include-runtime -d main.jar 
$ java -jar main.jar
学生名： Runoob
年龄： 18
学生号： S12346
成绩： 89
```

### 子类没有主构造函数

如果子类没有主构造函数，则必须在每一个二级构造函数中用 super 关键字初始化基类，或者在代理另一个构造函数

初始化基类时，可以调用基类的不同构造方法

```java
calss Student : Person {
    constructor(ctx: Context) : super(ctx) {
    } 
    constructor(ctx: Context, attrs: AttributeSet) : super(ctx,attrs) {
    }
}
```

#### 范例

```java
// filename: main.kt
// author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
// Copyright © 2015-2065 www.ddkk.com. All rights reserved.
/**用户基类**/
open class Person(name:String)
{
    /**次级构造函数**/
    constructor(name:String,age:Int):this(name){
        //初始化
        println("-------基类次级构造函数---------")
    }
}
/**子类继承 Person 类**/
class Student:Person{
    /**次级构造函数**/
    constructor(name:String,age:Int,no:String,score:Int):super(name,age){
        println("-------继承类次级构造函数---------")
        println("学生名： ${name}")
        println("年龄： ${age}")
        println("学生号： ${no}")
        println("成绩： ${score}")
    }
}
fun main(args: Array<String>) {
    var s =  Student("Runoob", 18, "S12345", 89)
}
```

编译运行以上 Kotlin 范例，输出结果如下

```java
$ kotlinc main.kt -include-runtime -d main.jar 
$ java -jar main.jar
-------基类次级构造函数---------
-------继承类次级构造函数---------
学生名： Runoob
年龄： 18
学生号： S12345
成绩： 89
```

## 重写

在基类中，使用 fun 声明函数时，此函数默认为 final 修饰，不能被子类重写

如果允许子类重写该函数，那么就要手动添加 open 修饰它, 子类重写方法使用 override 关键词

```java
// filename: main.kt
// author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
// Copyright © 2015-2065 www.ddkk.com. All rights reserved.
/**用户基类**/
open class Person{
    open fun study(){       // 允许子类重写
        println("我毕业了")
    }
}
/**子类继承 Person 类**/
class Student : Person() {
    override fun study(){    // 重写方法
        println("我在读大学")
    }
}
fun main(args: Array<String>) {
    val s =  Student()
    s.study();
}
```

编译运行以上 Kotlin 范例，输出结果如下

```java
$ kotlinc main.kt -include-runtime -d main.jar 
$ java -jar main.jar
我在读大学
```

如果有多个相同的方法（继承或者实现自其他类，如A、B类），则必须要重写该方法，使用 **super** 范型去选择性地调用父类的实现

```java
// filename: main.kt
// author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
// Copyright © 2015-2065 www.ddkk.com. All rights reserved.
open class A {
    open fun f () { print("A") }
    fun a() { print("a") }
}
interface B {
    fun f() { print("B") } //接口的成员变量默认是 open 的
    fun b() { print("b") }
}
class C() : A() , B{
    override fun f() {
        super<A>.f()//调用 A.f()
        super<B>.f()//调用 B.f()
    }
}
fun main(args: Array<String>)
{
    val c =  C()
    c.f();
}
```

C继承自 a() 或 b(), C 不仅可以从 A 或则 B 中继承函数，而且 C 可以继承 A()、B() 中共有的函数。此时该函数在中只有一个实现，为了消除歧义，该函数必须调用A()和B()中该函数的实现，并提供自己的实现。

编译运行以上 Kotlin 范例，输出结果如下

```java
$ kotlinc main.kt -include-runtime -d main.jar 
$ java -jar main.jar
AB
```

## 属性重写

属性重写使用 override 关键字，属性必须具有兼容类型，每一个声明的属性都可以通过初始化程序或者 getter 方法被重写

```java
open class Foo {
    open val x: Int get { …… }
}
class Bar1 : Foo() {
    override val x: Int = ……
}
```

我们可以用一个 var 属性重写一个 val 属性，但是反过来不行

因为val 属性本身定义了 getter 方法，重写为 var 属性会在衍生类中额外声明一个setter方法

我们可以在主构造函数中使用 override 关键字作为属性声明的一部分

```java
interface Foo {
    val count: Int
}
class Bar1(override val count: Int) : Foo
class Bar2 : Foo {
    override var count: Int = 0
}
```
