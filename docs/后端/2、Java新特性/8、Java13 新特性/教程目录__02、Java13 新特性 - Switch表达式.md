# 02、Java13 新特性 - Switch表达式
- 来源：https://ddkk.com/zhuanlan/java/java13/2.html
- 分类：Java 13 新特性
- 分组：教程目录
Java 12 将表达式引入 Switch 语句并将其作为预览功能发布。Java 13 添加了一个新的 yield 构造来从 switch 语句返回一个值。它仍然是一个预览功能。

## Java13 Switch表达式的示例

ApiTester.java

```java
package com.yiidian;
public class APITester {
   public static void main(String[] args) {
      System.out.println("Old Switch");
      System.out.println(getDayTypeOldStyle("Monday"));
      System.out.println(getDayTypeOldStyle("Saturday"));
      System.out.println(getDayTypeOldStyle(""));
      System.out.println("New Switch");
      System.out.println(getDayType("Monday"));
      System.out.println(getDayType("Saturday"));
      System.out.println(getDayType(""));
   }
   public static String getDayType(String day) {
      var result = switch (day) {
         case "Monday", "Tuesday", "Wednesday","Thursday", "Friday" -> yield "Weekday";
         case "Saturday", "Sunday" -> yield "Weekend";
         default -> "Invalid day.";
      };
      return result;
   }
   public static String getDayTypeOldStyle(String day) {
      String result = null;
      switch (day) {
         case "Monday":
         case "Tuesday":
         case "Wednesday":
         case "Thursday":
         case "Friday":
            result = "Weekday";
            break;
         case "Saturday": 
         case "Sunday":
            result = "Weekend";
            break;
         default:
            result =  "Invalid day.";            
      }
      return result;
   }
}
```

编译并运行程序

```java
$javac -Xlint:preview --enable-preview -source 13 APITester.java
$java --enable-preview APITester
```

输出结果为

```java
Old Switch
Weekday
Weekend
Invalid day.
New Switch
Weekday
Weekend
Invalid day.
```
