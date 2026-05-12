# 05、Java16 新特性 - Record类
- 来源：https://ddkk.com/zhuanlan/java/java16/5.html
- 分类：Java 16 新特性
- 分组：教程目录
Java 14 引入了一个新的类类型Record作为预览功能，以促进不可变数据对象的创建。Java 15 进一步增强了记录类型。在 Java 16 中，Record现在是 JDK 的标准功能。

## Java16 Record类的示例

ApiTester.java

```java
package com.yiidian;
public class APITester {
   public static void main(String[] args) {
      StudentRecord student = new StudentRecord (1, "Julie", "Red", "VI", 12);
      System.out.println(student.id());
      System.out.println(student.name());
      System.out.println(student);
   } 
}
record StudentRecord(int id, 
   String name, 
   String section, 
   String className,
   int age){}
```

编译并运行程序

```java
$javac APITester.java
$java APITester
```

输出结果为

```java
1
Julie
StudentRecord[id=1, name=Julie, section=Red, className=VI, age=12]
```
