# 03、Java15 新特性 - instanceof的模式匹配
- 来源：https://ddkk.com/zhuanlan/java/java15/3.html
- 分类：Java 15 新特性
- 分组：教程目录
Java 14 引入了 instanceof 运算符以将类型测试模式作为预览功能。类型测试模式有一个 predicate来指定具有单个绑定变量的类型。它仍然是 Java 15 中的预览功能。

## Java15 instanceof的模式匹配的语法

```java
if (person instanceof Employee e) {
   return e.getEmployeeId();
}
```

## Java15 instanceof的模式匹配的示例

ApiTester.java

```java
public class APITester {
   public static void main(String[] args) {
      Person manager = new Manager(23, "Robert");
      manager.name = "Robert";
      System.out.println(getId(manager));
   }
   public static int getId(Person person) {
      if (person instanceof Employee e) {
         return e.getEmployeeId();
      } 
      else if (person instanceof Manager m) {
         return m.getManagerId();
      }
      return -1;
   }
}
abstract sealed class Person permits Employee, Manager {
   String name;
   String getName() {
      return name;
   }
}
final class Employee extends Person {
   String name;
   int id;
   Employee(int id, String name){
      this.id = id;
      this.name = name;
   }
   int getEmployeeId() {
      return id;
   }
}
non-sealed class Manager extends Person {
   int id;
   Manager(int id, String name){
      this.id = id;
      this.name = name;
   }
   int getManagerId() {
      return id;
   }
}
```

编译并运行程序

```java
$javac -Xlint:preview --enable-preview -source 14 APITester.java
$java --enable-preview APITester
```

输出结果为

```java
23
```
