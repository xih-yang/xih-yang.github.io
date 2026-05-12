# 02、Java12 新特性 - Switch表达式
- 来源：https://ddkk.com/zhuanlan/java/java12/2.html
- 分类：Java 12 新特性
- 分组：教程目录
Java 12 将表达式引入 Switch 语句并将其作为预览功能发布。以下是新的switch表达式的变更：

- 没有落差。
- 不需要break语句来防止失败。
- 单个案例可以有多个常量标签。
- 默认情况现在是强制性的。

## Java12 Switch表达式的示例

ApiTester.java

```java
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
      String result = switch (day) {
         case "Monday", "Tuesday", "Wednesday","Thursday", "Friday" -> "Weekday";
         case "Saturday", "Sunday" -> "Weekend";
         default -> {
            break "Invalid day.";            
         }
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
$javac -Xlint:preview --enable-preview -source 12 APITester.java
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
