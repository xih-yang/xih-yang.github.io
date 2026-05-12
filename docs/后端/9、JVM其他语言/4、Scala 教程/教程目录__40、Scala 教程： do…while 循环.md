# 40、Scala 教程： do…while 循环
- 来源：https://ddkk.com/zhuanlan/java/scala/40.html
- 分类：Scala 教程
- 分组：教程目录
for循环允许您编写一个执行指定次数的循环控制结构。

## 语法

Scala 语言中 **for** 循环的语法：

```java
for( var x <- Range ){
   statement(s);
}
```

以上语法中， **Range** 可以是一个数字区间表示 **i to j** ，或者 **i until j** 。左箭头 <- 用于为变量 x 赋值。

## 范例

### i to j

以下是一个使用了 **i to j** 语法(包含 j)的范例:

```java
object Test {
   def main(args: Array[String]) {
      var a = 0;
      // for 循环
      for( a <- 1 to 5){
         println( "Value of a: " + a );
      }
   }
}
```

执行以上代码输出结果为：

```java
value of a: 1
value of a: 2
value of a: 3
value of a: 4
value of a: 5
```

## i until j

以下是一个使用了 **i until j** 语法(不包含 j)的范例:

```java
object Test {
   def main(args: Array[String]) {
      var a = 0;
      // for 循环
      for( a <- 1 until 5){
         println( "Value of a: " + a );
      }
   }
}
```

执行以上代码输出结果为：

```java
$ scalac Test.scala
$ scala Test
value of a: 1
value of a: 2
value of a: 3
value of a: 4
```

### 使用分号(;)

在 **for 循环** 中你可以使用分号 (;) 来设置多个区间，它将迭代给定区间所有的可能值。以下范例演示了两个区间的循环范例：

```java
object Test {
   def main(args: Array[String]) {
      var a = 0;
      var b = 0;
      // for 循环
      for( a <- 1 to 2; b <- 1 to 2){
         println( "Value of a: " + a );
         println( "Value of b: " + b );
      }
   }
}
```

执行以上代码输出结果为：

```java
Value of a: 1
Value of b: 1
Value of a: 1
Value of b: 2
Value of a: 2
Value of b: 1
Value of a: 2
Value of b: 2
```

## for 循环集合

for循环集合的语法如下：

```java
for( var x <- List ){
   statement(s);
}
```

以上语法中， **List** 变量是一个集合，for 循环会迭代所有集合的元素。

### 范例

以下范例将循环数字集合。我们使用 *List()* 来创建集合。再以后章节我们会详细介绍集合。

```java
object Test {
   def main(args: Array[String]) {
      var a = 0;
      val numList = List(1,2,3);
      // for 循环
      for( a <- numList ){
         println( "Value of a: " + a );
      }
   }
}
```

执行以上代码输出结果为：

```java
value of a: 1
value of a: 2
value of a: 3
```

## for 循环过滤

Scala 可以使用一个或多个 **if** 语句来过滤一些元素。

以下是在 for 循环中使用过滤器的语法。

```java
for( var x <- List
      if condition1; if condition2...
   ){
   statement(s);
}
```

你可以使用分号(;)来为表达式添加一个或多个的过滤条件。

### 范例

以下是for 循环中过滤的范例：

```java
object Test {
   def main(args: Array[String]) {
      var a = 0;
      val numList = List(1,2,3,4,5,6,7,8,9,10);
      // for 循环
      for( a <- numList
           if a != 3; if a < 8 ){
         println( "Value of a: " + a );
      }
   }
}
```

执行以上代码输出结果为：

```java
value of a: 1
value of a: 2
value of a: 4
value of a: 5
value of a: 6
value of a: 7
```

## for 使用 yield

你可以将 for 循环的返回值作为一个变量存储。语法格式如下：

```java
var retVal = for{ var x <- List
     if condition1; if condition2...
}yield x
```

注意大括号中用于保存变量和条件， *retVal* 是变量， 循环中的 yield 会把当前的元素记下来，保存在集合中，循环结束后将返回该集合。

### 范例

以下范例演示了 for 循环中使用 yield：

```java
object Test {
   def main(args: Array[String]) {
      var a = 0;
      val numList = List(1,2,3,4,5,6,7,8,9,10);
      // for 循环
      var retVal = for{ a <- numList 
                        if a != 3; if a < 8
                      }yield a
      // 输出返回值
      for( a <- retVal){
         println( "Value of a: " + a );
      }
   }
}
```

执行以上代码输出结果为：

```java
value of a: 1
value of a: 2
value of a: 4
value of a: 5
value of a: 6
value of a: 7
```
