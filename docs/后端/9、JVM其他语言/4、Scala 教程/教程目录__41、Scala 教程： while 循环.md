# 41、Scala 教程： while 循环
- 来源：https://ddkk.com/zhuanlan/java/scala/41.html
- 分类：Scala 教程
- 分组：教程目录
只要给定的条件为 true，Scala 语言中的 **while** 循环语句会重复执行循环体内的代码块。

## 语法

Scala 语言中 **while** 循环的语法：

```java
while(condition)
{
   statement(s);
}
```

在这里， **statement(s)** 可以是一个单独的语句，也可以是几个语句组成的代码块。

**condition** 可以是任意的表达式，当为任意非零值时都为 true。当条件为 true 时执行循环。 当条件为 false 时，退出循环，程序流将继续执行紧接着循环的下一条语句。

## 流程图

在这里， *while* 循环的关键点是循环可能一次都不会执行。当条件为 false 时，会跳过循环主体，直接执行紧接着 while 循环的下一条语句。

### 范例

```java
object Test {
   def main(args: Array[String]) {
      // 局部变量
      var a = 10;
      // while 循环执行
      while( a < 15 ){
         println( "Value of a: " + a );
         a = a + 1;
      }
   }
}
```

执行以上代码输出结果为：

```java
value of a: 10
value of a: 11
value of a: 12
value of a: 13
value of a: 14
```
