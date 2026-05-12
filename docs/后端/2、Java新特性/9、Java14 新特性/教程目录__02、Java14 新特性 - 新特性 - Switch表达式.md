# 02、Java14 新特性 - 新特性 - Switch表达式
- 来源：https://ddkk.com/zhuanlan/java/java14/2.html
- 分类：Java 14 新特性
- 分组：教程目录
Java 12 将表达式引入 Switch 语句并将其作为预览功能发布。Java 13 添加了一个新的 yield 构造来从 switch 语句返回一个值。在 Java 14 中，switch 表达式已经是一个标准特性。

- 每个 case 块都可以使用 yield 语句返回一个值。
- 在枚举的情况下，可以跳过默认情况。在其他情况下，默认情况是必需的。

## Java14 Switch表达式的示例

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
         case "Monday", "Tuesday", "Wednesday","Thursday", "Friday": yield "Weekday";
         case "Saturday", "Sunday": yield "Weekend";
         default: yield "Invalid day.";
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
$javac APITester.java
$java APITester
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
