# 14、JDK 源码：Error、Exception
- 来源：https://ddkk.com/zhuanlan/java/jvm/12/14.html
- 分类：JDK 源码
- 分组：教程目录
## 一、概述

前面讲了Throwable，而Error和Exception都是Throwable的子类，Error代表出现的是严重错误，应用程序不应该用trycatch去捕获并且进行处理。绝大多数的Error都是非正常的，就根本不该出现的。Exception则设计被用来交由程序去处理。

## 二、方法和属性

这两个类都很简单，而且方法都是调用Throwable的对应实现。分别只有五个构造方法。

所有的构造最终调用Throwable的fillInStackTrace方法来实现，主要是跟踪填充堆栈信息，fillInStackTrace的实现如下：

```java
public synchronized Throwable fillInStackTrace() {
    if (stackTrace != null ||
        backtrace != null /* Out of protocol state */ ) {
        fillInStackTrace(0);
        stackTrace = UNASSIGNED_STACK;
    }
    return this;
}
private native Throwable fillInStackTrace(int dummy);
```
