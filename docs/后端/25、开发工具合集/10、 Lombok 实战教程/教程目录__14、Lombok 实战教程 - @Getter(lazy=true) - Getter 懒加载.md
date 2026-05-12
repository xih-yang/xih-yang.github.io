# 14、Lombok 实战教程 - @Getter(lazy=true) | Getter 懒加载
- 来源：https://ddkk.com/zhuanlan/tools/lombok/1/14.html
- 分类：开发工具
- 分组：教程目录
## 一、简介

`@Getter(lazy=true)`是在`Lombok v0.10`中引入的。

你可以让`lombok`生成一个`getter`，它将在第一次调用这个`getter`时计算一个值，并从那时起缓存它。如果计算数值需要大量的`CPU`，或者数值需要大量的内存，这就很有用。要使用这个功能，创建一个`private final`变量，用运行成本高的表达式来初始化它，并用`@Getter(lazy=true)`来注释你的字段。这个字段将从你的代码的其余部分隐藏起来，并且表达式的评估不会超过一次，即在第一次调用`getter`的时候。没有神奇的标记值（也就是说，即使你昂贵的计算结果是空的，结果也会被缓存），你昂贵的计算不需要是线程安全的，因为`lombok`负责锁。

如果初始化表达式很复杂，或者包含泛型，我们建议将代码移到一个私有的（如果可能的话是静态的）方法中，并调用该方法。

## 二、示例比较

### 1. Lombok 写法

```java
import lombok.Getter;
public class GetterLazyExample {
  @Getter(lazy=true) private final double[] cached = expensive();
  private double[] expensive() {
    double[] result = new double[1000000];
    for (int i = 0; i < result.length; i++) {
      result[i] = Math.asin(i);
    }
    return result;
  }
}
```

### 2. Java 标准写法

```java
public class GetterLazyExample {
  private final java.util.concurrent.AtomicReference<java.lang.Object> cached = new java.util.concurrent.AtomicReference<java.lang.Object>();
  public double[] getCached() {
    java.lang.Object value = this.cached.get();
    if (value == null) {
      synchronized(this.cached) {
        value = this.cached.get();
        if (value == null) {
          final double[] actualValue = expensive();
          value = actualValue == null ? this.cached : actualValue;
          this.cached.set(value);
        }
      }
    }
    return (double[])(value == this.cached ? null : value);
  }
  private double[] expensive() {
    double[] result = new double[1000000];
    for (int i = 0; i < result.length; i++) {
      result[i] = Math.asin(i);
    }
    return result;
  }
}
```

## 三、支持的配置项

`lombok.getter.lazy.flagUsage` = [`warning` | `error`] (默认: `not set`)

`Lombok`将`@Getter（lazy=true）`的任何使用标记为警告或错误（如果配置）。

## 四、附属说明

你不应该直接引用这个字段，始终使用`lombok`生成的`getter`，因为这个字段的类型会被处理成一个`AtomicReference`。不要试图直接访问这个`AtomicReference`；如果它指向自己，那么这个值已经被计算过了，是空的。如果该引用指向`null`，那么该值就没有被计算。这种行为在未来的版本中可能会改变。因此，始终使用生成的`getter`来访问你的字段!

其他`Lombok`注解，比如`@ToString`，总是调用`getter`，即使你使用`doNotUseGetters=true`。

[【1】@Getter(lazy=true) | Laziness is a virtue!](https://projectlombok.org/features/GetterLazy)
