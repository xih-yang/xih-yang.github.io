# 21、Lombok 实战教程 - @UtilityClass | 针对实用工具类的注解
- 来源：https://ddkk.com/zhuanlan/tools/lombok/1/21.html
- 分类：开发工具
- 分组：教程目录
## 一、实验性功能说明

`@UtilityClass`是在`lombok v1.16.2`中作为实验性功能引入的。

实验因为：

- 关于其是否常见到足以算作模板的问题，存在一些争议。

当前状态：积极-目前我们认为该功能可能很快脱离实验状态，不会有任何或微小的变化。

## 二、简介

一个实用工具类是一个只是函数命名空间的类。它的实例不可能存在，而且它的所有成员都是静态的。例如，`java.lang.Math`和`java.util.Collections`是著名的实用工具类。这个注解会自动将被注解的类变成一个这样的类。

一个实用工具类不能被实例化。通过用`@UtilityClass`标记你的类，`lombok`会自动生成一个抛出异常的私有构造函数，将你添加的任何显式构造函数标记为错误，并将该类标记为`final`。如果该类是一个内部类，该类也被标记为`static`。

实用工具类的所有成员都被自动标记为静态。甚至是字段和内部类。

## 三、示例比较

### 1. Lombok 写法

```java
import lombok.experimental.UtilityClass;
@UtilityClass
public class UtilityClassExample {
  private final int CONSTANT = 5;
  public int addSomething(int in) {
    return in + CONSTANT;
  }
}
```

### 2. Java 标准写法

```java
public final class UtilityClassExample {
  private static final int CONSTANT = 5;
  private UtilityClassExample() {
    throw new java.lang.UnsupportedOperationException("This is a utility class and cannot be instantiated");
  }
  public static int addSomething(int in) {
    return in + CONSTANT;
  }
}
```

## 四、支持的配置项

`lombok.utilityClass.flagUsage` = [`warning` | `error`] (默认: `not set`)

`Lombok`将`@UtilityClass`的任何使用标记为警告或错误（如果已配置）。

## 五、附属说明

目前还没有任何方法来创建非静态成员，或者定义你自己的构造函数。如果你想实例化实用工具类，即使只是作为一个内部实现，也不能使用`@UtilityClass`。

由于`javac`处理静态导入的方式很特别，试图对`@UtilityClass`的任何成员进行非星形静态导入都不会成功。要么使用星形静态导入:`import static TypeMarkedWithUtilityClass.*;`或者不要静态导入任何成员。
