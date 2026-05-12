# 05、Java15 新特性 - Record的sealed密封类
- 来源：https://ddkk.com/zhuanlan/java/java15/5.html
- 分类：Java 15 新特性
- 分组：教程目录
由于默认情况下Record是final的，并且可以继承接口。我们可以定义密封接口并让Record实现它们以更好地管理代码。

## Record的sealed密封类的示例

ApiTester.java

```java
public class APITester {
   public static void main(String[] args) {
      Person employee = new Employee(23, "Robert");
      System.out.println(employee.id());
	   System.out.println(employee.name());
   }
}
sealed interface Person permits Employee, Manager {
   int id();
   String name();
}
record Employee(int id, String name) implements Person {}
record Manager(int id, String name) implements Person {}
```

编译并运行程序

```java
$javac -Xlint:preview --enable-preview -source 15 APITester.java
$java --enable-preview APITester
```

输出结果为

```java
23
Robert
```
