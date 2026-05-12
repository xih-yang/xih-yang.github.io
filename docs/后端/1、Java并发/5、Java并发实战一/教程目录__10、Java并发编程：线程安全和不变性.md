# 10、Java并发编程：线程安全和不变性
- 来源：https://ddkk.com/zhuanlan/java/concurrency/5/10.html
- 分类：Java并发
- 分组：教程目录
只有当多个线程访问同一资源，并且一个或多个线程写入该资源时，才会出现竞态条件。如果多个线程读取同一资源，则不会出现竞态条件。

我们可以使共享对象不可变，以此来确保线程之间共享的对象不会被任何线程更新，从而保证线程安全。下面是一个例子：

```java
public class ImmutableValue{
  private int value = 0;
  public ImmutableValue(int value){
    this.value = value;
  }
  public int getValue(){
    return this.value;
  }
}
```

注意下ImmutableValue实例的构造函数是如何传递value的。还要注意这里没有赋值方法。一旦创建了ImmutableValue实例，就不能更改其值。它是不可变的。但是你可以使用getValue（）方法读取它的值。

如果需要对ImmutableValue实例执行操作，可以用操作的结果值返回一个新的实例来实现。下面是一个add操作的示例：

```java
public class ImmutableValue{
  private int value = 0;
  public ImmutableValue(int value){
    this.value = value;
  }
  public int getValue(){
    return this.value;
  }
      public ImmutableValue add(int valueToAdd){
      return new ImmutableValue(this.value + valueToAdd);
      }
}
```

注意add（）方法用加法操作的结果返回了一个新的ImmutableValue实例，而不是自己加上value。

## 引用不是线程安全的！

必须记住，即使一个对象是不可变的从而是线程安全的，该对象的引用也不一定是线程安全的。看看这个例子：

```java
public class Calculator{
  private ImmutableValue currentValue = null;
  public ImmutableValue getValue(){
    return currentValue;
  }
  public void setValue(ImmutableValue newValue){
    this.currentValue = newValue;
  }
  public void add(int newValue){
    this.currentValue = this.currentValue.add(newValue);
  }
}
```

Calculator类保存了一个ImmutableValue实例的引用。请注意，它可以通过setValue（）和add（）方法更改该引用。因此，即使Calculator类在内部使用了不可变对象，它本身却不是不可变的，因此也不是线程安全的。换言之：ImmutableValue类是线程安全的，但使用它（的类或方法）却不是线程安全的。当试图通过不变性实现线程安全时，需要记住这一点。

为了使Calculator类线程安全，可以声明getValue（）、setValue（）和add（）方法为synchronized，从而解决该问题。
