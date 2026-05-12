# 04、Java10 新特性 - 新的API 和选项
- 来源：https://ddkk.com/zhuanlan/java/java10/4.html
- 分类：Java 10 新特性
- 分组：教程目录
JDK10 版本为 Java 库添加了 70 多个新 API 和选项。以下是介绍的一些重要增强功能。

## Optional.orElseThrow() 方法

java.util.Optional 类中提供了一个新方法orElseThrow()，它现在是get()方法的首选替代方法。

## 用于创建不可修改集合的 API

List、Set 和 Map 接口中提供了一种新方法copyOf()，它可以从现有的集合实例创建新的集合实例。收集器类有新的方法toUnmodifiableList()、toUnmodifiableSet() 和 toUnmodifiableMap()将流的元素放入不可修改的集合中。

## 禁用 JRE 上次使用跟踪

引入了一个新标志 jdk.disableLastUsageTracking，它禁用正在运行的 VM 的 JRE 上次使用跟踪。

## Hash密码

jmxremote.password 文件中可用的纯文本密码现在被 JMX 代理用其 SHA3-512 哈希覆盖。

## Javadoc 对多个样式表的支持

javadoc 命令可以使用一个新选项作为 --add-stylesheet。此选项支持在生成的文档中使用多个样式表。

## Javadoc 对覆盖方法的支持

javadoc 命令可以使用一个新选项作为 --overridden-methods=value。许多类覆盖继承的方法但不更改规范。--overridden-methods=value 选项允许将这些方法与其他继承的方法组合在一起，而不是再次单独记录它们。

## 对摘要的 javadoc 支持

新的内联标签 {@summary ...} 可用于指定用作 API 描述摘要的文本。默认情况下，API 描述的摘要是从第一句话推断出来的。

## Java10 新的API的示例

```java
package com.yiidian;
import java.util.List;
import java.util.stream.Collectors;
public class Tester {
   public static void main(String[] args) {
      var ids = List.of(1, 2, 3, 4, 5); 
      try {
         // get an unmodifiable list
         List<Integer> copyOfIds = List.copyOf(ids);
         copyOfIds.add(6);	
      } catch(UnsupportedOperationException e){
         System.out.println("Collection is not modifiable.");
      }
      try{
         // get an unmodifiable list
         List<Integer> evenNumbers = ids.stream()
            .filter(i -> i % 2 == 0)
            .collect(Collectors.toUnmodifiableList());;
         evenNumbers.add(6);	
      }catch(UnsupportedOperationException e){
         System.out.println("Collection is not modifiable.");
      }
   }
}
```

输出结果为：

```java
Collection is not modifiable.
Collection is not modifiable.
```
