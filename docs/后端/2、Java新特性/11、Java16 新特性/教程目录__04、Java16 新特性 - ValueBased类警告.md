# 04、Java16 新特性 - ValueBased类警告
- 来源：https://ddkk.com/zhuanlan/java/java16/4.html
- 分类：Java 16 新特性
- 分组：教程目录
某些类，例如 java.util.Optional 和 java.time.LocalDateTime，是ValueBased的。ValueBased的类的此类实例是final的且不可变的。此类类具有 @jdk.internal.ValueBased 注释，Java 16 现在会生成编译时警告，以防此类类使用 synchronized 关键字进行同步。包装类是ValueBased的。例如，Double 类是ValueBased的。

## ValueBased注解的源码

```java
package java.lang;
@jdk.internal.ValueBased
public final class Double extends Number
   implements Comparable<Double>, Constable, ConstantDesc {
   //...
}
```

## Java16 ValueBased类警告的示例

```java
public class APITester {
   public static void main(String[] args) {
      Double d = 10.0;
      synchronized (d) {
         System.out.println(d);			
      } 
   }
}
```

编译并运行程序

```java
$javac APITester.java
```

## 输出

```java
APITester.java:4: warning: [synchronization] attempt to synchronize on an instance of a value-based class
   synchronized (d) {
   ^
1 warning
```
