# 31、Scala 教程： 偏应用函数
- 来源：https://ddkk.com/zhuanlan/java/scala/31.html
- 分类：Scala 教程
- 分组：教程目录
**Scala 偏应用** 函数是一种表达式，不需要提供函数需要的所有参数，只需要提供部分，或不提供所需参数。

如下范例，我们打印日志信息：

```java
import java.util.Date
object Test {
   def main(args: Array[String]) {
      val date = new Date
      log(date, "message1" )
      Thread.sleep(1000)
      log(date, "message2" )
      Thread.sleep(1000)
      log(date, "message3" )
   }
   def log(date: Date, message: String)  = {
     println(date + "----" + message)
   }
}
```

上面代码执行结果为：

```java
Fri Aug 11 21:57:58 CST 2017----message1
Fri Aug 11 21:57:58 CST 2017----message2
Fri Aug 11 21:57:58 CST 2017----message3
```

范例中，log() 方法接收两个参数：date 和 message。我们在程序执行时调用了三次，参数 date 值都相同，message 不同。

我们可以使用偏应用函数优化以上方法，绑定第一个 date 参数，第二个参数使用下划线(_)替换缺失的参数列表，并把这个新的函数值的索引的赋给变量。以上范例修改如下：

```java
import java.util.Date
object Test {
   def main(args: Array[String]) {
      val date = new Date
      val logWithDateBound = log(date, _ : String)
      logWithDateBound("message1" )
      Thread.sleep(1000)
      logWithDateBound("message2" )
      Thread.sleep(1000)
      logWithDateBound("message3" )
   }
   def log(date: Date, message: String)  = {
     println(date + "----" + message)
   }
}
```

上面代码执行结果为：

```java
Fri Aug 11 21:58:27 CST 2017----message1
Fri Aug 11 21:58:27 CST 2017----message2
Fri Aug 11 21:58:27 CST 2017----message3
```
