# 15、JDK 24 新特性：并发API增强（Concurrency Enhancements）完善多线程编程
- 来源：https://ddkk.com/zhuanlan/java/java24/15.html
- 分类：JDK 24 新特性
- 分组：教程目录
- 日期：2025-11-27
写Java并发代码的时候，最头疼的就是任务管理和数据传递了。特别是那种需要启动多个并发任务、等待它们完成的场景，代码写得又臭又长，还容易出错。鹏磊我之前写过一个数据处理的系统，需要启动多个任务并行处理，然后用`ExecutorService`管理，代码写得又臭又长，异常处理也麻烦，最后还出了bug，任务没正常关闭，资源泄漏了。

现在好了，JDK 24在并发API方面做了不少增强，结构化并发（Structured Concurrency）和作用域值（Scoped Values）都到了第四次预览版，虽然还在完善阶段，但已经能解决不少问题了。这些特性让并发编程变得更简单、更安全，代码写起来也顺手多了。兄弟们别磨叽，咱这就开始整活，把这些增强给整明白。

## JDK 24并发API增强的整体情况

JDK 24在并发API方面做了几项重要增强，主要针对任务管理和数据传递这两个痛点。这些增强都是为了简化并发编程，提升代码的可读性和安全性，让开发者能更高效地构建多线程应用。

主要增强包括：

1. **结构化并发（Structured Concurrency）**：第四次预览版，简化并发任务管理
2. **作用域值（Scoped Values）**：第四次预览版，提供新的线程局部变量传递机制
3. **虚拟线程同步优化**：虚拟线程在同步块中不会固定载体线程（JEP 491）

这些增强都是针对实际生产场景的痛点，特别是那种需要管理多个并发任务的场景，效果比较明显。

## 结构化并发（Structured Concurrency）

结构化并发是JDK 24引入的一个预览特性，用来简化并发任务的管理。它提供了一种结构化的方式来组织并发任务，让任务的生命周期更清晰，异常处理更简单，资源管理更安全。

### 什么是结构化并发

结构化并发的核心思想是：并发任务应该有明确的生命周期，父任务负责管理子任务，子任务的生命周期不能超过父任务。这样任务之间的关系更清晰，异常传播更可控，资源管理更安全。

以前管理并发任务，得这么写：

```java
// 老写法，用ExecutorService管理任务
public class DataProcessor {
    private final ExecutorService executor = Executors.newCachedThreadPool();
    public void processData(List<String> dataList) {
        List<Future<String>> futures = new ArrayList<>();
        // 启动多个任务
        for (String data : dataList) {
            Future<String> future = executor.submit(() -> {
                // 处理数据
                return processItem(data);
            });
            futures.add(future);
        }
        // 等待所有任务完成
        List<String> results = new ArrayList<>();
        for (Future<String> future : futures) {
            try {
                results.add(future.get());  // 可能抛出异常
            } catch (Exception e) {
                // 异常处理麻烦
                e.printStackTrace();
            }
        }
        // 关闭线程池（容易忘记）
        executor.shutdown();
    }
    private String processItem(String data) {
        // 处理单个数据项
        return "processed: " + data;
    }
}
```

现在用结构化并发，直接就能这么写：

```java
// 新写法，用结构化并发
import java.util.concurrent.StructuredTaskScope;
public class DataProcessor {
    public void processData(List<String> dataList) {
        // 使用结构化并发，自动管理任务生命周期
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
            // 启动多个任务
            List<StructuredTaskScope.Subtask<String>> subtasks = new ArrayList<>();
            for (String data : dataList) {
                StructuredTaskScope.Subtask<String> subtask = scope.fork(() -> {
                    // 处理数据
                    return processItem(data);
                });
                subtasks.add(subtask);
            }
            // 等待所有任务完成（自动处理异常）
            scope.join();
            // 收集结果
            List<String> results = subtasks.stream()
                .map(StructuredTaskScope.Subtask::get)
                .toList();
            // 资源自动关闭，不需要手动shutdown
        } catch (Exception e) {
            // 统一异常处理
            e.printStackTrace();
        }
    }
    private String processItem(String data) {
        // 处理单个数据项
        return "processed: " + data;
    }
}
```

是不是清爽多了？任务生命周期清晰，异常处理简单，资源自动管理，不用再担心资源泄漏了。

### 结构化并发的核心特性

结构化并发有几个核心特性，咱一个个来看。

#### 1. 任务生命周期管理

结构化并发保证子任务的生命周期不会超过父任务。如果父任务结束了，子任务也会被取消，不会出现"孤儿任务"。

```java
// 任务生命周期管理示例
public void processWithTimeout(List<String> dataList) {
    try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
        // 启动多个任务
        for (String data : dataList) {
            scope.fork(() -> {
                // 处理数据
                return processItem(data);
            });
        }
        // 等待所有任务完成
        scope.join();
        // 如果这里抛出异常或返回，子任务会自动取消
    }
    // scope关闭时，所有未完成的子任务会自动取消
}
```

#### 2. 异常传播

结构化并发提供了统一的异常处理机制。如果任何子任务失败，可以选择取消其他任务或等待所有任务完成。

```java
// 异常传播示例
public void processWithExceptionHandling(List<String> dataList) {
    try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
        // 启动多个任务
        for (String data : dataList) {
            scope.fork(() -> {
                // 如果这里抛出异常，其他任务会被取消
                return processItem(data);
            });
        }
        // 等待所有任务完成
        scope.join();  // 如果任何任务失败，会抛出异常
        // 收集结果
        scope.throwIfFailed();  // 检查是否有任务失败
    } catch (Exception e) {
        // 统一异常处理
        System.err.println("处理失败: " + e.getMessage());
    }
}
```

#### 3. 资源自动管理

结构化并发使用try-with-resources机制，资源会自动关闭，不需要手动管理。

```java
// 资源自动管理示例
public void processWithAutoClose(List<String> dataList) {
    // 使用try-with-resources，scope会自动关闭
    try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
        // 启动任务
        for (String data : dataList) {
            scope.fork(() -> processItem(data));
        }
        scope.join();
    }
    // scope关闭时，所有任务会自动取消，资源自动释放
    // 不需要手动调用shutdown()
}
```

### 结构化并发的使用场景

结构化并发适合哪些场景呢？鹏磊我觉得主要有这么几类：

#### 场景1：并行数据处理

需要并行处理多个数据项，等待所有处理完成：

```java
// 并行数据处理示例
public class ParallelDataProcessor {
    public List<String> processInParallel(List<String> dataList) {
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
            // 启动多个处理任务
            List<StructuredTaskScope.Subtask<String>> subtasks = dataList.stream()
                .map(data -> scope.fork(() -> processItem(data)))
                .toList();
            // 等待所有任务完成
            scope.join();
            scope.throwIfFailed();  // 检查是否有失败
            // 收集结果
            return subtasks.stream()
                .map(StructuredTaskScope.Subtask::get)
                .toList();
        }
    }
    private String processItem(String data) {
        // 处理单个数据项
        return "processed: " + data;
    }
}
```

#### 场景2：多服务调用

需要调用多个服务，等待所有响应：

```java
// 多服务调用示例
public class MultiServiceCaller {
    public Result callMultipleServices(Request request) {
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
            // 并行调用多个服务
            StructuredTaskScope.Subtask<ServiceAResult> serviceA = 
                scope.fork(() -> callServiceA(request));
            StructuredTaskScope.Subtask<ServiceBResult> serviceB = 
                scope.fork(() -> callServiceB(request));
            StructuredTaskScope.Subtask<ServiceCResult> serviceC = 
                scope.fork(() -> callServiceC(request));
            // 等待所有服务响应
            scope.join();
            scope.throwIfFailed();
            // 合并结果
            return new Result(
                serviceA.get(),
                serviceB.get(),
                serviceC.get()
            );
        }
    }
    private ServiceAResult callServiceA(Request request) {
        // 调用服务A
        return new ServiceAResult();
    }
    private ServiceBResult callServiceB(Request request) {
        // 调用服务B
        return new ServiceBResult();
    }
    private ServiceCResult callServiceC(Request request) {
        // 调用服务C
        return new ServiceCResult();
    }
}
```

#### 场景3：超时控制

需要控制任务的执行时间，超时后取消：

```java
// 超时控制示例
public class TimeoutProcessor {
    public void processWithTimeout(List<String> dataList, Duration timeout) {
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
            // 启动任务
            for (String data : dataList) {
                scope.fork(() -> processItem(data));
            }
            // 等待指定时间
            scope.joinUntil(Instant.now().plus(timeout));
            // 检查是否超时
            if (scope.state() == StructuredTaskScope.State.CANCELLED) {
                throw new TimeoutException("处理超时");
            }
        }
    }
    private String processItem(String data) {
        // 处理数据项
        return "processed: " + data;
    }
}
```

## 作用域值（Scoped Values）

作用域值是JDK 24引入的另一个预览特性，用来在线程间传递数据。它是对`ThreadLocal`的改进，提供了更安全、更灵活的数据传递机制。

### 什么是作用域值

作用域值的核心思想是：数据应该有明确的作用域，只能在特定的执行上下文中访问，不能跨线程泄漏。这样数据传递更安全，不会出现数据污染的问题。

以前用`ThreadLocal`传递数据，得这么写：

```java
// 老写法，用ThreadLocal
public class DataProcessor {
    private static final ThreadLocal<String> context = new ThreadLocal<>();
    public void process(String data) {
        // 设置上下文
        context.set(data);
        try {
            // 处理数据
            processData();
        } finally {
            // 必须手动清理，容易忘记
            context.remove();
        }
    }
    private void processData() {
        // 获取上下文
        String data = context.get();
        // 使用数据
        System.out.println("处理: " + data);
    }
}
```

现在用作用域值，直接就能这么写：

```java
// 新写法，用作用域值
import java.util.concurrent.ScopedValue;
public class DataProcessor {
    // 定义作用域值
    private static final ScopedValue<String> CONTEXT = ScopedValue.newInstance();
    public void process(String data) {
        // 使用作用域值，自动管理生命周期
        ScopedValue.where(CONTEXT, data).run(() -> {
            // 处理数据
            processData();
        });
        // 作用域结束后，值自动清理，不需要手动remove
    }
    private void processData() {
        // 获取作用域值
        String data = CONTEXT.get();
        // 使用数据
        System.out.println("处理: " + data);
    }
}
```

是不是清爽多了？作用域清晰，自动管理，不用再担心数据泄漏了。

### 作用域值的核心特性

作用域值有几个核心特性，咱一个个来看。

#### 1. 作用域限制

作用域值只能在定义的作用域内访问，不能跨线程泄漏：

```java
// 作用域限制示例
public class ScopedValueExample {
    private static final ScopedValue<String> CONTEXT = ScopedValue.newInstance();
    public void process(String data) {
        // 在作用域内设置值
        ScopedValue.where(CONTEXT, data).run(() -> {
            // 可以访问值
            String value = CONTEXT.get();  // 正常
            // 启动新线程
            Thread.ofVirtual().start(() -> {
                // 新线程无法访问父线程的作用域值
                // String value2 = CONTEXT.get();  // 会抛出异常
            });
        });
        // 作用域外无法访问
        // String value = CONTEXT.get();  // 会抛出异常
    }
}
```

#### 2. 不可变性

作用域值是不可变的，一旦设置就不能修改：

```java
// 不可变性示例
public class ImmutableExample {
    private static final ScopedValue<String> CONTEXT = ScopedValue.newInstance();
    public void process(String data) {
        ScopedValue.where(CONTEXT, data).run(() -> {
            // 值是不可变的
            String value = CONTEXT.get();  // 正常
            // 不能修改值
            // CONTEXT.set("new value");  // 编译错误，没有set方法
        });
    }
}
```

#### 3. 嵌套作用域

可以嵌套使用作用域值，内层作用域可以覆盖外层作用域的值：

```java
// 嵌套作用域示例
public class NestedScopeExample {
    private static final ScopedValue<String> CONTEXT = ScopedValue.newInstance();
    public void process() {
        // 外层作用域
        ScopedValue.where(CONTEXT, "outer").run(() -> {
            String outerValue = CONTEXT.get();  // "outer"
            // 内层作用域
            ScopedValue.where(CONTEXT, "inner").run(() -> {
                String innerValue = CONTEXT.get();  // "inner"
            });
            // 回到外层作用域
            String outerValue2 = CONTEXT.get();  // "outer"
        });
    }
}
```

### 作用域值的使用场景

作用域值适合哪些场景呢？鹏磊我觉得主要有这么几类：

#### 场景1：请求上下文传递

在Web应用中传递请求上下文：

```java
// 请求上下文传递示例
public class RequestContext {
    private static final ScopedValue<String> USER_ID = ScopedValue.newInstance();
    private static final ScopedValue<String> REQUEST_ID = ScopedValue.newInstance();
    public void handleRequest(String userId, String requestId) {
        // 设置请求上下文
        ScopedValue.where(USER_ID, userId)
            .where(REQUEST_ID, requestId)
            .run(() -> {
                // 处理请求
                processRequest();
            });
    }
    private void processRequest() {
        // 获取请求上下文
        String userId = USER_ID.get();
        String requestId = REQUEST_ID.get();
        // 使用上下文
        System.out.println("用户: " + userId + ", 请求: " + requestId);
    }
}
```

#### 场景2：配置传递

在并发任务中传递配置信息：

```java
// 配置传递示例
public class ConfigProcessor {
    private static final ScopedValue<Config> CONFIG = ScopedValue.newInstance();
    public void processWithConfig(Config config) {
        // 设置配置
        ScopedValue.where(CONFIG, config).run(() -> {
            // 启动多个任务
            try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
                for (int i = 0; i < 10; i++) {
                    scope.fork(() -> {
                        // 任务可以访问配置
                        Config taskConfig = CONFIG.get();
                        return processItem(i, taskConfig);
                    });
                }
                scope.join();
            }
        });
    }
    private String processItem(int index, Config config) {
        // 使用配置处理数据
        return "processed: " + index + " with " + config;
    }
}
```

#### 场景3：虚拟线程数据传递

在虚拟线程中传递数据：

```java
// 虚拟线程数据传递示例
public class VirtualThreadExample {
    private static final ScopedValue<String> CONTEXT = ScopedValue.newInstance();
    public void processWithVirtualThreads(String data) {
        // 设置作用域值
        ScopedValue.where(CONTEXT, data).run(() -> {
            // 创建虚拟线程
            Thread.ofVirtual().start(() -> {
                // 虚拟线程可以访问作用域值
                String value = CONTEXT.get();
                System.out.println("虚拟线程处理: " + value);
            });
        });
    }
}
```

## 结构化并发和作用域值的配合使用

结构化并发和作用域值可以配合使用，让并发编程更简单、更安全：

```java
// 配合使用示例
public class CombinedExample {
    private static final ScopedValue<String> USER_ID = ScopedValue.newInstance();
    public void processUserData(String userId, List<String> dataList) {
        // 设置用户上下文
        ScopedValue.where(USER_ID, userId).run(() -> {
            // 使用结构化并发处理数据
            try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
                // 启动多个任务
                List<StructuredTaskScope.Subtask<String>> subtasks = dataList.stream()
                    .map(data -> scope.fork(() -> {
                        // 任务可以访问作用域值
                        String currentUserId = USER_ID.get();
                        return processItem(data, currentUserId);
                    }))
                    .toList();
                // 等待所有任务完成
                scope.join();
                scope.throwIfFailed();
                // 收集结果
                List<String> results = subtasks.stream()
                    .map(StructuredTaskScope.Subtask::get)
                    .toList();
            }
        });
    }
    private String processItem(String data, String userId) {
        // 处理数据项
        return "用户 " + userId + " 处理: " + data;
    }
}
```

## 预览特性说明

结构化并发和作用域值在JDK 24中还是预览特性，需要启用预览功能才能用。

### 编译时启用预览

编译的时候需要加`--enable-preview`参数：

```bash
# 编译时启用预览特性
javac --enable-preview --release 24 Main.java
```

### 运行时启用预览

运行的时候也需要加`--enable-preview`参数：

```bash
# 运行时启用预览特性
java --enable-preview Main
```

### Maven配置

如果用Maven，需要在`pom.xml`里配置：

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <version>3.11.0</version>
            <configuration>
                <source>24</source>
                <target>24</target>
                <compilerArgs>
                    <arg>--enable-preview</arg>
                </compilerArgs>
            </configuration>
        </plugin>
    </plugins>
</build>
```

## 最佳实践

用这些并发API增强的时候，鹏磊我建议注意这么几点：

### 1. 合理使用结构化并发

结构化并发适合那种需要管理多个并发任务的场景，不适合那种简单的单任务场景：

```java
// 推荐：多个并发任务
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    for (String data : dataList) {
        scope.fork(() -> processItem(data));
    }
    scope.join();
}
// 不推荐：单个任务
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    scope.fork(() -> processItem(data));  // 过度使用
    scope.join();
}
```

### 2. 及时处理异常

结构化并发提供了统一的异常处理机制，要及时处理：

```java
// 推荐：及时处理异常
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    // 启动任务
    scope.fork(() -> processItem(data));
    scope.join();
    scope.throwIfFailed();  // 检查异常
} catch (Exception e) {
    // 处理异常
    log.error("处理失败", e);
}
```

### 3. 合理使用作用域值

作用域值适合那种需要在执行上下文中传递数据的场景，不适合那种全局配置：

```java
// 推荐：请求上下文
ScopedValue.where(USER_ID, userId).run(() -> {
    processRequest();
});
// 不推荐：全局配置
ScopedValue.where(CONFIG, config).run(() -> {
    // 全局配置应该用其他方式
});
```

## 总结

JDK 24在并发API方面做了不少增强，结构化并发和作用域值都到了第四次预览版，虽然还在完善阶段，但已经能解决不少问题了。这些增强让并发编程变得更简单、更安全，代码写起来也顺手多了。

主要增强：

1. **结构化并发**：简化并发任务管理，自动处理生命周期和异常
2. **作用域值**：提供安全的数据传递机制，避免数据泄漏
3. **虚拟线程优化**：虚拟线程在同步块中不会固定载体线程

适用场景：

- **结构化并发**：适合需要管理多个并发任务的场景
- **作用域值**：适合需要在执行上下文中传递数据的场景
- **配合使用**：可以配合使用，让并发编程更简单、更安全

虽然还是预览特性，但已经能看到Java在朝着更现代化的并发编程方向发展了。兄弟们可以试试，特别是那些需要管理多个并发任务的场景，用起来确实方便。等正式发布后，肯定会成为Java并发编程的标准做法。
