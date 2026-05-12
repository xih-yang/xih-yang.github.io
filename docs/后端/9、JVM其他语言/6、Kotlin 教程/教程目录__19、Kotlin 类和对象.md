# 19、Kotlin 类和对象
- 来源：https://ddkk.com/zhuanlan/java/kotlin/19.html
- 分类：Kotlin 教程
- 分组：教程目录
Kotlin 类可以包含：构造函数和初始化代码块、函数、属性、内部类、对象声明

Kotlin 使用 class 关键字声明类，后面紧跟类名

```java
class MyClass {  // 类名为 MyClass
    // 大括号内是类体构成
}
```

Kotlin 允许定义一个空类

```java
class Empty
```

可以在类中定义成员函数

```java
class MyClass()
{
    fun foo()   // 成员函数
    { 
        print("Foo") 
    } 
}
```

## 类的属性

### 属性定义

类的属性可以用关键字 var 声明为可变的，否则使用只读关键字 val 声明为不可变

```java
class Site {
    var name: String = ""
    var url: String = ""
    var city: String = ""
}
```

我们可以像使用普通函数那样使用构造函数创建类实例

```java
val site = Site() // Kotlin 中没有 new 关键字
```

要使用一个属性，只要用名称引用它即可

```java
site.name           // 使用 . 号来引用
site.url
```

Koltin 中的类可以有一个 主构造器，以及一个或多个次构造器，主构造器是类头部的一部分，位于类名称之后

```java
class Person constructor(firstName: String) {}
```

如果主构造器没有任何注解，也没有任何可见度修饰符，那么 constructor 关键字可以省略

```java
class Person(firstName: String) {
}
```

### getter 和 setter

属性声明的完整语法

```java
var <propertyName>[: <PropertyType>] [= <property_initializer>]
    [<getter>]
    [<setter>]
```

getter 和 setter 都是可选

如果属性类型可以从初始化语句或者类的成员函数中推断出来，那就可以省去类型

val属性不允许设置 setter 函数，因为它是只读的

```java
var allByDefault: Int? // 错误: 需要一个初始化语句, 默认实现了 getter 和 setter 方法
var initialized = 1    // 类型为 Int, 默认实现了 getter 和 setter
val simple: Int?       // 类型为 Int ，默认实现 getter ，但必须在构造函数中初始化
val inferredType = 1   // 类型为 Int 类型,默认实现 getter
```

### 范例

以下范例定义了一个 Person 类，包含两个可变变量 lastName 和 no，lastName 修改了 getter 方法，no 修改了 setter 方法。

```java
// filename: main.kt
// author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
// Copyright © 2015-2065 www.ddkk.com. All rights reserved.
class Person {
    var lastName: String = "zhang"
        get() = field.toUpperCase()   // 将变量赋值后转换为大写
        set
    var no: Int = 100
        get() = field                // 后端变量
        set(value) {
            if (value < 10) {       // 如果传入的值小于 10 返回该值
                field = value
            } else {
                field = -1         // 如果传入的值大于等于 10 返回 -1
            }
        }
    var heiht: Float = 145.4f
        private set
}
// 测试
fun main(args: Array<String>) {
    var person: Person = Person()
    person.lastName = "wang"
    println("lastName:${person.lastName}")
    person.no = 9
    println("no:${person.no}")
    person.no = 20
    println("no:${person.no}")
}
```

编译运行以上 Kotlin 范例，输出结果如下

```java
$ kotlinc main.kt -include-runtime -d main.jar 
$ java -jar main.jar
lastName:WANG
no:9
no:-1
```

Kotlin 中类不能有字段

提供了Backing Fields(后端变量) 机制,备用字段使用 field 关键字声明,

field 关键词只能用于属性的访问器

```java
var no: Int = 100
        get() = field                // 后端变量
        set(value) {
            if (value < 10) {       // 如果传入的值小于 10 返回该值
                field = value
            } else {
                field = -1         // 如果传入的值大于等于 10 返回 -1
            }
        }
```

非空属性必须在定义的时候初始化

Kotlin 提供了一种可以延迟初始化的方案,使用 lateinit 关键字描述属性

```java
class LazyProperty(val initializer: () -> Int) {
    var value: Int? = null
    val lazy: Int
        get() {
            if (value == null) {
                value = initializer()
            }
            return value!!
        }
}
```

## 主构造器

Kotlin 类的主构造器中不能包含任何代码，初始化代码可以放在初始化代码段中

初始化代码段使用 init 关键字作为前缀

```java
class Person constructor(firstName: String) 
{
    init {
        System.out.print("FirstName is $firstName")
    }
}
```

主构造器的参数可以在初始化代码段中使用，也可以在类主体n定义的属性初始化代码中使用

一种简洁语法，可以通过主构造器来定义属性并初始化属性值（ 可以是 va r或 val ）

```java
class People(val firstName: String, val lastName: String) 
{
    //...
}
```

如果构造器有注解，或者有可见度修饰符，这时 constructor 关键字是必须的，注解和修饰符要放在它之前

### 范例

创建一个 Site 类，并通过构造函数传入网站名

```java
// filename: main.kt
// author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
// Copyright © 2015-2065 www.ddkk.com. All rights reserved.
class Site  constructor(name: String) {  // 类名为 Site
    // 大括号内是类体构成
    var url: String = "http://www.ddkk.com"
    var country: String = "CN"
    var siteName = name
    init {
        println("初始化网站名: ${name}")
    }
    fun printTest() {
        println("我是类的函数")
    }
}
fun main(args: Array<String>)
{
    val site =  Site("www.ddkk.com")
    println(site.siteName)
    println(site.url)
    println(site.country)
    site.printTest()
}
```

编译运行以上 Kotlin 范例，输出结果如下

```java
$ kotlinc main.kt -include-runtime -d main.jar 
$ java -jar main.jar
初始化网站名: www.ddkk.com
www.ddkk.com
http://www.ddkk.com
CN
我是类的函数
```

## 次构造函数

Kotlin 可以使用 constructor 关键词定义二级构造函数

```java
class Person 
{ 
    constructor(parent: Person)
    {
        parent.children.add(this) 
    }
}
```

如果类有主构造函数，每个次构造函数都要，或直接或间接通过另一个次构造函数代理主构造函数

在同一个类中代理另一个构造函数使用 this 关键字

```java
class Person(val name: String) {
    constructor (name: String, age:Int) : this(name) {
        // 初始化...
    }
}
```

如果一个非抽象类没有声明构造函数(主构造函数或次构造函数)，它会产生一个没有参数的构造函数

构造函数是 public

如果你不想你的类有公共的构造函数，你就得声明一个空的主构造函数

```java
class DontCreateMe private constructor () {
}
```

在JVM 虚拟机中，如果主构造函数的所有参数都有默认值，编译器会生成一个附加的无参的构造函数，这个构造函数会直接使用默认值

这使得Kotlin 可以更简单的使用像 Jackson 或者 JPA 这样使用无参构造函数来创建类实例的库

```java
class Customer(val customerName: String = "")
```

### 范例

```java
// filename: main.kt
// author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
// Copyright © 2015-2065 www.ddkk.com. All rights reserved.
class Site  constructor(name: String) {  // 类名为 Site
    // 大括号内是类体构成
    var url: String = "http://www.ddkk.com"
    var country: String = "CN"
    var siteName = name
    init {
        println("初始化网站名: ${name}")
    }
    // 次构造函数
    constructor (name: String, alexa: Int) : this(name) {
        println("Alexa 排名 $alexa")
    }
    fun printTest() {
        println("我是类的函数")
    }
}
fun main(args: Array<String>) {
    val site =  Site("DDKK.COM 弟弟快看，程序员编程资料站", 10000)
    println(site.siteName)
    println(site.url)
    println(site.country)
    site.printTest()
}
```

编译运行以上 Kotlin 范例，输出结果如下

```java
$ kotlinc main.kt -include-runtime -d main.jar 
$ java -jar main.jar
初始化网站名: DDKK.COM 弟弟快看，程序员编程资料站
Alexa 排名 10000
DDKK.COM 弟弟快看，程序员编程资料站
http://www.ddkk.com
CN
我是类的函数
```

## 类的修饰符

Kotlin 类的修饰符包括 classModifier 和_accessModifier_

**1、** classModifier:类属性修饰符，标示类本身特性；

```java
abstract    // 抽象类  
final       // 类不可继承，默认属性
enum        // 枚举类
open        // 类可继承，类默认是final的
annotation  // 注解类
```

**2、** accessModifier:访问权限修饰符；

```java
private    // 仅在同一个文件中可见
protected  // 同一个文件中或子类可见
public     // 所有调用的地方都可见
internal   // 同一个模块中可见
```

### 范例

```java
// filename: main.kt
// author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
// Copyright © 2015-2065 www.ddkk.com. All rights reserved.
package foo
private fun foo() {} // 在 example.kt 内可见
public var bar: Int = 5 // 该属性随处可见
internal val baz = 6    // 相同模块内可见
```
