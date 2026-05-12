# 19、Java 9 新特性 – CompletableFuture API ( 下 )
- 来源：https://ddkk.com/zhuanlan/java/java9/19.html
- 分类：Java新特性
- 分组：教程目录
Java 9 同时为 CompletableFuture 类添加了一些工厂方法

## completedFuture(U value) 工厂方法

completedFuture(U value) 工厂方法的原型如下

```java
public static <U> CompletableFuture<U> completedFuture(U value)
```

此工厂方法返回一个已完成的、使用给定值的新 CompletableFuture 。

## completedStage(U value) 工厂方法

completedStage(U value) 工厂方法的原型如下

```java
public static <U> CompletionStage<U> completedStage(U value)
```

此工厂方法返回一个新的使用给定值 value 的已完成的 CompletionStage，且仅支持接口 CompletionStage 中定义的那些方法

## failedStage(Throwable ex) 工厂方法

failedStage(Throwable ex) 工厂方法的原型如下

```java
public static <U> CompletionStage<U> failedStage(Throwable ex)
```

此工厂方法返回一个新的 CompletionStage，使用给定异常的情况下异常完成，且仅支持接口 CompletionStage 中存在的那些方法
