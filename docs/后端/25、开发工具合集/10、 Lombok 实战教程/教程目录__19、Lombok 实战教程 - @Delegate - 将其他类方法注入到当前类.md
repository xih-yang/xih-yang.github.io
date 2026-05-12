# 19、Lombok 实战教程 - @Delegate | 将其他类方法注入到当前类
- 来源：https://ddkk.com/zhuanlan/tools/lombok/1/19.html
- 分类：开发工具
- 分组：教程目录
## 一、实验性功能说明

`@Delegate`是在`lombok v0.10`中作为特性引入的（当时实验包还不存在）。

在`lombok v1.14`中，它被移到了实验包中；`lombok`主包中的旧版本现在已被废弃。

实验因为：

- 不常用。
- 难以支持边缘情况，如递归委托。
- API相当不友好；如果你能简单地实现一些方法，并让@Delegate为你没有手动实现的东西生成委托，那就更好了，但由于泛型擦除的问题，这也无法做到没有注意事项。

当前状态：否定-目前我们认为该功能不会很快脱离实验状态，如果未来版本的`javac`或`ecj`难以继续维护该功能，则可能会放弃对该功能的支持。

## 二、简介

任何字段或无参数方法都可以用`@Delegate`来注解，让`lombok`生成转发对这个字段的调用（或调用这个方法的结果）的委托方法。

`Lombok`委托该字段类型（或方法的返回类型）的所有公共方法，以及其父类型的方法，但所有以`java.lang.Object`声明的方法除外。

你可以在`@Delegate`注解的类型参数中传递任意数量的类。如果你这样做，那么`lombok`将委托这些类型（以及它们的父类型，除了`java.lang.Object`）中的所有公共方法，而不是看字段/方法的类型。

所有属于计算类型的公共非`Object`方法都被复制，无论你是否也为这些方法写了实现。因此，这将导致重复的方法错误。你可以通过使用`@Delegate(excludes=SomeType.class)`参数来排除被排除类型中的所有公共方法，以及它们的超类型来避免这些错误。

为了非常精确地控制哪些被委托，哪些不被委托，可以用方法签名编写私有内部接口，然后在`@Delegate(types=PrivateInnerInterfaceWithIncludesList.class, excludes=SameForExcludes.class)`中指定这些私有内部接口作为类型。

## 三、示例比较

### 1. Lombok 写法

```java
import java.util.ArrayList;
import java.util.Collection;
import lombok.experimental.Delegate;
public class DelegationExample {
  private interface SimpleCollection {
    boolean add(String item);
    boolean remove(Object item);
  }
  @Delegate(types=SimpleCollection.class)
  private final Collection<String> collection = new ArrayList<String>();
}
class ExcludesDelegateExample {
  long counter = 0L;
  private interface Add {
    boolean add(String x);
    boolean addAll(Collection<? extends String> x);
  }
  @Delegate(excludes=Add.class)
  private final Collection<String> collection = new ArrayList<String>();
  public boolean add(String item) {
    counter++;
    return collection.add(item);
  }
  public boolean addAll(Collection<? extends String> col) {
    counter += col.size();
    return collection.addAll(col);
  }
}
```

### 2. Java 标准写法

```java
import java.util.ArrayList;
import java.util.Collection;
public class DelegationExample {
  private interface SimpleCollection {
    boolean add(String item);
    boolean remove(Object item);
  }
  private final Collection<String> collection = new ArrayList<String>();
  @java.lang.SuppressWarnings("all")
  public boolean add(final java.lang.String item) {
    return this.collection.add(item);
  }
  @java.lang.SuppressWarnings("all")
  public boolean remove(final java.lang.Object item) {
    return this.collection.remove(item);
  }
}
class ExcludesDelegateExample {
  long counter = 0L;
  private interface Add {
    boolean add(String x);
    boolean addAll(Collection<? extends String> x);
  }
  private final Collection<String> collection = new ArrayList<String>();
  public boolean add(String item) {
    counter++;
    return collection.add(item);
  }
  public boolean addAll(Collection<? extends String> col) {
    counter += col.size();
    return collection.addAll(col);
  }
  @java.lang.SuppressWarnings("all")
  public int size() {
    return this.collection.size();
  }
  @java.lang.SuppressWarnings("all")
  public boolean isEmpty() {
    return this.collection.isEmpty();
  }
  @java.lang.SuppressWarnings("all")
  public boolean contains(final java.lang.Object arg0) {
    return this.collection.contains(arg0);
  }
  @java.lang.SuppressWarnings("all")
  public java.util.Iterator<java.lang.String> iterator() {
    return this.collection.iterator();
  }
  @java.lang.SuppressWarnings("all")
  public java.lang.Object[] toArray() {
    return this.collection.toArray();
  }
  @java.lang.SuppressWarnings("all")
  public <T extends .java.lang.Object>T[] toArray(final T[] arg0) {
    return this.collection.<T>toArray(arg0);
  }
  @java.lang.SuppressWarnings("all")
  public boolean remove(final java.lang.Object arg0) {
    return this.collection.remove(arg0);
  }
  @java.lang.SuppressWarnings("all")
  public boolean containsAll(final java.util.Collection<?> arg0) {
    return this.collection.containsAll(arg0);
  }
  @java.lang.SuppressWarnings("all")
  public boolean removeAll(final java.util.Collection<?> arg0) {
    return this.collection.removeAll(arg0);
  }
  @java.lang.SuppressWarnings("all")
  public boolean retainAll(final java.util.Collection<?> arg0) {
    return this.collection.retainAll(arg0);
  }
  @java.lang.SuppressWarnings("all")
  public void clear() {
    this.collection.clear();
  }
}
```

## 四、支持的配置项

`lombok.delegate.flagUsage` = [`warning` | `error`] (默认: `not set`)

`Lombok`将`@Delegate`的任何用法标记为警告或错误（如果已配置）。

## 五、附属说明

当向注解的`types`或`types`参数传递类时，你不能包括泛型。这是`java`的一个限制。使用私有的内部接口或扩展预定类型的类，包括泛型参数来解决这个问题。

当向注解传递类时，这些类不需要是字段的超类型。请看例子

`@Delegate`不能用在静态字段或方法上。

当要委托/排除的计算类型本身包含`@Delegate`注释时，不能使用`@Delegate`；换句话说，如果你试图递归使用它，`@Delegate`会出错。
