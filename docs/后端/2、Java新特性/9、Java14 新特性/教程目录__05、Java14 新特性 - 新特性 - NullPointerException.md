# 05、Java14 新特性 - 新特性 - NullPointerException
- 来源：https://ddkk.com/zhuanlan/java/java14/5.html
- 分类：Java 14 新特性
- 分组：教程目录
Java 14 引入了 NullPointerException 和有用的信息，以防 -XX:+ShowCodeDetailsInExceptionMessages 标志被传递给 JVM。

## Java14 NullPointerException的示例

ApiTester.java

```java
package com.yiidian;
public class APITester {
   public static void main(String[] args) {
      String message = null;
      System.out.println(message.length());
   }   
}
```

旧方法：编译并运行程序

```java
$javac APITester.java
$java APITester
```

输出结果为

```java
Exception in thread "main" java.lang.NullPointerException
   at APITester.main(APITester.java:6)
```

新方式：用新标志编译和运行程序

```java
$javac APITester.java
$java -XX:+ShowCodeDetailsInExceptionMessages APITester
```

输出结果为

```java
Exception in thread "main" java.lang.NullPointerException: Cannot invoke "String.length()" because "<local1>" is null
   at APITester.main(APITester.java:6)
```
