# 26、Kotlin 数据类( data class )
- 来源：https://ddkk.com/zhuanlan/java/kotlin/26.html
- 分类：Kotlin 教程
- 分组：教程目录
Kotlin 使用 **data class** 创建一个只包含数据的类，这种类又称数据类

Kotlin 中的数据类是只包含属性布不包含方法的特殊类

```java
data class User(val name: String, val age: Int)
```

编译器会自动的从主构造函数中根据所有声明的属性提取以下函数：

- equals()/hashCode()
- toString()格式如"User(name=John, age=42)"
- componentN() functions对应于属性，按声明顺序排列
- copy()函数

如果这些函数在类中已经被明确定义了，或者从超类中继承而来，就不再会生成。

为了保证生成代码的一致性以及有意义，数据类需要满足以下条件：

- 主构造函数至少包含一个参数
- 所有的主构造函数的参数必须标识为val或者var;
- 数据类不可以声明为abstract,open,sealed或者inner;
- 数据类不能继承其他类 (但是可以实现接口)

### 复制

复制使用 copy() 函数，我们可以使用该函数复制对象并修改部分属性, 对于上文的 User 类，其实现会类似下面这样：

```java
fun copy(name: String = this.name, age: Int = this.age) = User(name, age)
```

### 实例

使用copy 类复制 User 数据类，并修改 age 属性:

```java
// filename: main.kt
// author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
// Copyright © 2015-2065 www.ddkk.com. All rights reserved.
data class User(val name: String, val age: Int)
fun main(args: Array<String>) {
    val jack = User(name = "Jack", age = 1)
    val olderJack = jack.copy(age = 2)
    println(jack)
    println(olderJack)
}
```

编译运行以上 Kotlin 范例，输出结果如下

```java
$ kotlinc main.kt -include-runtime -d main.jar 
$ java -jar main.jar
User(name=Jack, age=1)
User(name=Jack, age=2)
```

### 数据类以及解构声明

组件函数允许数据类在解构声明中使用

```java
val jane = User("Jane", 35)
val (name, age) = jane
println("$name, $age years of age") // prints "Jane, 35 years of age"
```

### 标准数据类

标准库提供了 Pair和 Triple 两个标准的数据类

在大多数情形中，命名数据类是更好的设计选择，因为这样代码可读性更强而且提供了有意义的名字和属性
