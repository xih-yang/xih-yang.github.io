# 7、Sentinel 之@SentinelResource注解
- 来源：https://ddkk.com/zhuanlan/guarantee/sentinel/7.html
- 分类：服务保障
- 分组：Sentinel 之 使用教程（A）
## 资源

资源是Sentinel 的关键概念。它可以是 Java 应用程序中的任何内容，例如，由应用程序提供的服务，或由应用程序调用的其它应用提供的服务，甚至可以是一段代码。

只要通过 Sentinel API 定义的代码，就是资源，能够被 Sentinel 保护起来。大部分情况下，可以使用方法签名，URL，甚至服务名称作为资源名来标示资源。

## @SentinelResource

Sentinel资源的定义

## 源码

```java
@Target({
ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Inherited
public @interface SentinelResource {
	// 资源的名称
    String value() default "";
	// 流量的方向，默认为出站
    EntryType entryType() default EntryType.OUT;
	// 资源的分类（类型）
    int resourceType() default 0;
	// 异常函数的名称，默认为空
    String blockHandler() default "";
	// 处理异常所在的类
    Class<?>[] blockHandlerClass() default {
     };
	// 降级方法的名称，默认为空
    String fallback() default "";
	// 默认降级方法的名称，默认为空
    String defaultFallback() default "";
	// 降级方法所在的类（仅单个类）
    Class<?>[] fallbackClass() default {
     };
	// 要跟踪的异常类列表
    Class<? extends Throwable>[] exceptionsToTrace() default {
     Throwable.class};
	// 要忽略的异常类列表，默认为空
    Class<? extends Throwable>[] exceptionsToIgnore() default {
     };
}
```

## 案例

### 标识资源

可在控制台查看当前资源

```java
    @GetMapping("/resource")
    @SentinelResource(value = "resource")
    public String resource() {
        return "resource";
    }
```

### blockHandler

使用blockHandler指定发生BlockException时进入的方法，方法需满足以下条件

- 必须是 public 修饰
- 返回类型、参数与原方法一致，并在最后加BlockException 类型的参数
- 默认需和原方法在同一个类中

```java
    @GetMapping("/resource")
    @SentinelResource(value = "resource",blockHandler = "blockHandler")
    public String resource() {
        return "resource";
    }
    public String blockHandler(BlockException exception) {
        return "被限流了哦！！！";
    }
```

### blockHandlerClass

将限流和降级方法外置到单独的类中，需满足以下条件：

- 方法必须 使用public static 修饰
- 满足blockHandler处理条件

**1、** 编写类；

```java
public class TestBlockHandler {
    public static String blockHandler(BlockException exception) {
        return "被限流了哦！！！by TestBlockHandler";
    }
}
```

**1、** 测试类；

```java
@GetMapping("/resource")
@SentinelResource(value = "resource",blockHandler = "blockHandler",blockHandlerClass = TestBlockHandler.class)
public String resource() {
    return "resource";
}
```

**1、** 流控效果；

### fallback

用于在抛出异常的时候提供fallback处理逻辑。fallback函数可以针对所有类型的异常（除了 exceptionsToIgnore 里面排除掉的异常类型）进行处理，满足条件同blockHandler大致一致（BlockException替换为Throwable）。

```java
    @GetMapping("/ex")
    @SentinelResource(value = "ex",
            fallback = "fallback")
    public String ex() {
        int i = 3 / 0;
        return "ex";
    }
    public String fallback(Throwable throwable) {
        return throwable.getMessage();
    }
```

### fallbackClass

处理fallback的类。大致和blockHandlerClass一样

### defaultFallback

用于通用的 fallback 逻辑。默认fallback函数可以针对所有类型的异常进行处理。若同时配置了 fallback 和 defaultFallback，以fallback为准。

### exceptionsToIgnore

指定排除掉哪些异常。排除的异常不会计入异常统计，也不会进入fallback逻辑，而是原样抛出。
