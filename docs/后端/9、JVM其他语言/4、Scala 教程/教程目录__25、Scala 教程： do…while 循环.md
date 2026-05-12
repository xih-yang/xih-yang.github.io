# 25、Scala 教程： do…while 循环
- 来源：https://ddkk.com/zhuanlan/java/scala/25.html
- 分类：Scala 教程
- 分组：教程目录
不像while 循环在循环头部测试循环条件, Scala 语言中，do…while 循环是在循环的尾部检查它的条件。

do…while 循环与 while 循环类似，但是 do…while 循环会确保至少执行一次循环。

## 语法

Scala 语言中 **while** 循环的语法：

```java
do {
   statement(s);
} while( condition );
```

## 流程图

请注意，条件表达式出现在循环的尾部，所以循环中的 statement(s) 会在条件被测试之前至少执行一次。

如果条件为 true，控制流会跳转回上面的 do，然后重新执行循环中的 statement(s)。

这个过程会不断重复，直到给定条件变为 false 为止。

### 范例

```java
object Test {
   def main(args: Array[String]) {
      // 局部变量
      var a = 10;
      // do 循环
      do{
         println( "Value of a: " + a );
         a = a + 1;
      }while( a < 15 )
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
