# 04、Java14 新特性 - 新特性 - instanceof的模式匹配
- 来源：https://ddkk.com/zhuanlan/java/java14/4.html
- 分类：Java 14 新特性
- 分组：教程目录
Java 14 引入了 instanceof 运算符以将类型测试模式作为预览功能。类型测试模式有一个predicate来指定具有单个绑定变量的类型。

## Java14 instanceof语法

```java
if (obj instanceof String s) {
}
```

## Java14 instanceof的示例

ApiTester.java

```java
package com.yiidian;
public class APITester {
   public static void main(String[] args) {
      String message = "Welcome to yiidian.com";
      Object obj = message;
      // Old way of getting length
      if(obj instanceof String){
         String value = (String)obj;
         System.out.println(value.length());
      }
      // New way of getting length
      if(obj instanceof String value){
         System.out.println(value.length());
      }
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
25
25
```
