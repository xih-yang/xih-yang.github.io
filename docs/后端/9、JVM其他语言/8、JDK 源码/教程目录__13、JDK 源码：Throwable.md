# 13、JDK 源码：Throwable
- 来源：https://ddkk.com/zhuanlan/java/jvm/12/13.html
- 分类：JDK 源码
- 分组：教程目录
## 一、概述

Throwable：被用来表示任何可以作为异常被抛出的类。有两个重要的子类Exception和Eerror。二者都是Java异常处理的重要子类，并且二者也包含许多重要的子类。通常用于指示发生了异常情况。类定义：

```java
public class Throwable implements Serializable
```

## 二、常见方法解析

常量
