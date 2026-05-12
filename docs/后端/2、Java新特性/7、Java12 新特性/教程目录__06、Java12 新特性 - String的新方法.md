# 06、Java12 新特性 - String的新方法
- 来源：https://ddkk.com/zhuanlan/java/java12/6.html
- 分类：Java 12 新特性
- 分组：教程目录
Java 12 为 String 引入了以下新方法，以便于格式化。

## Java12 indent（n）方法

根据传递的参数调整每行字符串的缩进。

### 用法

```java
string.indent(n)
```

- n > 0 ： 在每行的开头插入空格。
- n  f) 方法

将字符串转换为 R 形式的结果。

### 用法

```java
String transformed = text.transform(value -> new StringBuilder(value).reverse().toString());
```

## Optional describeConstable() 方法

返回包含 String 实例描述的可选对象。

### 用法

```java
Optional<String> optional = message.describeConstable();
```

## resolveConstantDesc (MethodHandles.Lookup lookup) 方法

返回给定字符串的描述符实例字符串。

### 用法

```java
String constantDesc = message.resolveConstantDesc(MethodHandles.lookup());
```

## Java12 String方法示例

ApiTester.java

```java
package com.yiidian;
import java.lang.invoke.MethodHandles;
import java.util.Optional;
public class APITester {
   public static void main(String[] args) {
      String str = "Welcome \nto yiidian.com!";
      System.out.println(str.indent(0));
      System.out.println(str.indent(3));
      String text = "Java";
      String transformed = text.transform(value -> new StringBuilder(value).reverse().toString());
      System.out.println(transformed);
      Optional<String> optional = text.describeConstable();
      System.out.println(optional);
      String cDescription = text.resolveConstantDesc(MethodHandles.lookup());
      System.out.println(cDescription);
   }
}
```

输出结果为

```java
Welcome 
to yiidian.com!
   Welcome 
   to yiidian.com!
avaJ
Optional[Java]
Java
```
