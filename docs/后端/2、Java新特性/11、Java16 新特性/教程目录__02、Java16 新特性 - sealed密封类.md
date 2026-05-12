# 02、Java16 新特性 - sealed密封类
- 来源：https://ddkk.com/zhuanlan/java/java16/2.html
- 分类：Java 16 新特性
- 分组：教程目录
Java 15 引入了一个密封类作为预览功能，它提供了对继承的细粒度控制。Java 16 提供了一些小的增强功能，并将此功能保留为预览版。以下是密封类需要考虑的要点 ：

- 密封类是使用 sealed 关键字声明的。
- 密封类允许使用 permit 关键字声明哪个类可以是子类型。
- 扩展密封类的类必须声明为sealed 、non-sealed或final的。
- 密封类有助于在继承中创建有限且可确定的类层次结构。

## Java16 sealed密封类的示例

ApiTester.java

```java
public class APITester {
   public static void main(String[] args) {
      Person manager = new Manager(23, "Robert");
      manager.name = "Robert";
      System.out.println(getId(manager));
   }
   public static int getId(Person person) {
      if (person instanceof Employee) {
         return ((Employee) person).getEmployeeId();
      } 
      else if (person instanceof Manager) {
         return ((Manager) person).getManagerId();
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
$javac -Xlint:preview --enable-preview -source 16 APITester.java
$java --enable-preview APITester
```

输出结果为

```java
23
```
