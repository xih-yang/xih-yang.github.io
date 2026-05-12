# 05、Spring Boot 4 实战：虚拟线程（Virtual Threads）完整实践指南
- 来源：https://ddkk.com/springboot/4/5.html
- 分类：Spring Boot 4.0 实战教程
- 分组：教程目录
- 日期：2025-11-25
兄弟们，鹏磊今天来聊聊虚拟线程这玩意儿；这是 Java 21 最重要的特性之一，也是 Spring Boot 4 深度集成的功能。虚拟线程能支持百万级并发，性能提升不是一点半点；如果你要做高并发应用，这玩意儿绝对值得研究。这功能确实牛逼，用好了性能提升很明显。

## 一、什么是虚拟线程？

### 1. 基本概念

虚拟线程（Virtual Threads）是 Java 21 引入的轻量级线程，由 JVM 管理，不是操作系统线程；一个平台线程（Platform Thread）可以运行成千上万个虚拟线程。这玩意儿比传统线程轻量多了，创建和销毁的开销很小，能支持百万级并发。

```java
// 传统平台线程，一个线程对应一个操作系统线程
Thread platformThread = Thread.ofPlatform()
    .name("platform-thread")
    .start(() -> {
        System.out.println("这是平台线程: " + Thread.currentThread().getName());
    });
// 虚拟线程，多个虚拟线程可以共享一个平台线程
Thread virtualThread = Thread.ofVirtual()
    .name("virtual-thread")
    .start(() -> {
        System.out.println("这是虚拟线程: " + Thread.currentThread().getName());
        System.out.println("是否是虚拟线程: " + Thread.currentThread().isVirtual());
    });
// 输出：
// 这是平台线程: platform-thread
// 这是虚拟线程: virtual-thread
// 是否是虚拟线程: true
```

### 2. 虚拟线程 vs 平台线程

虚拟线程和平台线程的主要区别：

特性平台线程虚拟线程

资源消耗高（每个线程占用 1MB+ 内存）低（每个线程占用几KB内存）
创建开销高（需要系统调用）低（JVM 内部管理）
数量限制受操作系统限制（通常几千个）几乎无限制（可创建百万个）
适用场景CPU 密集型任务I/O 密集型任务
阻塞成本高（占用操作系统线程）低（自动挂起，不占线程）

```java
// 对比创建线程的开销
public class ThreadComparison {
    public static void main(String[] args) throws InterruptedException {
        // 创建 10000 个平台线程，会占用大量资源
        long start = System.currentTimeMillis();
        List<Thread> platformThreads = new ArrayList<>();
        for (int i = 0; i < 10000; i++) {
            Thread thread = Thread.ofPlatform()
                .start(() -> {
                    try {
                        Thread.sleep(100);  // 模拟 I/O 操作
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                });
            platformThreads.add(thread);
        }
        // 等待所有线程完成
        for (Thread thread : platformThreads) {
            thread.join();
        }
        long platformTime = System.currentTimeMillis() - start;
        // 创建 10000 个虚拟线程，资源占用很小
        start = System.currentTimeMillis();
        List<Thread> virtualThreads = new ArrayList<>();
        for (int i = 0; i < 10000; i++) {
            Thread thread = Thread.ofVirtual()
                .start(() -> {
                    try {
                        Thread.sleep(100);  // 模拟 I/O 操作，虚拟线程会自动挂起
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                });
            virtualThreads.add(thread);
        }
        // 等待所有线程完成
        for (Thread thread : virtualThreads) {
            thread.join();
        }
        long virtualTime = System.currentTimeMillis() - start;
        System.out.println("平台线程耗时: " + platformTime + "ms");
        System.out.println("虚拟线程耗时: " + virtualTime + "ms");
        // 虚拟线程通常更快，因为创建和调度开销小
    }
}
```

## 二、为什么需要虚拟线程？

### 1. 传统线程的局限性

传统线程模型有几个问题：

- **资源消耗大**：每个线程占用 1MB+ 内存，创建大量线程会耗尽内存
- **创建开销高**：创建线程需要系统调用，开销大
- **数量限制**：受操作系统限制，通常只能创建几千个线程
- **阻塞成本高**：线程阻塞时占用操作系统线程，资源浪费

```java
// 传统方式处理大量并发请求，受线程数量限制
@Service
public class TraditionalUserService {
    private final ExecutorService executor = Executors.newFixedThreadPool(200);  // 最多 200 个线程
    public CompletableFuture<User> fetchUser(Long id) {
        // 如果并发请求超过 200 个，后面的请求会排队等待
        // 线程池满了，性能会急剧下降
        return CompletableFuture.supplyAsync(() -> {
            // 模拟数据库查询，会阻塞线程
            return userRepository.findById(id);
        }, executor);
    }
}
```

### 2. 虚拟线程的优势

虚拟线程解决了这些问题：

- **资源消耗小**：每个虚拟线程只占用几KB内存，可以创建百万个
- **创建开销低**：JVM 内部管理，不需要系统调用
- **数量无限制**：可以创建百万甚至千万个虚拟线程
- **阻塞成本低**：虚拟线程阻塞时自动挂起，不占用平台线程

```java
// 使用虚拟线程处理大量并发请求，不受线程数量限制
@Service
public class VirtualThreadUserService {
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();  // 虚拟线程执行器
    public CompletableFuture<User> fetchUser(Long id) {
        // 可以创建百万个虚拟线程，不受限制
        // 每个请求都有独立的虚拟线程，不会排队
        return CompletableFuture.supplyAsync(() -> {
            // 模拟数据库查询，虚拟线程会自动挂起，不占用平台线程
            return userRepository.findById(id);
        }, executor);
    }
}
```

## 三、如何创建虚拟线程？

### 1. 使用 Thread.ofVirtual()

最简单的方式是用 `Thread.ofVirtual()` 创建虚拟线程：

```java
// 方式1：直接创建并启动虚拟线程
Thread virtualThread = Thread.ofVirtual()
    .name("my-virtual-thread")  // 设置线程名称
    .start(() -> {
        // 任务逻辑
        System.out.println("虚拟线程执行任务");
    });
// 方式2：创建未启动的虚拟线程
Thread virtualThread = Thread.ofVirtual()
    .name("my-virtual-thread")
    .unstarted(() -> {
        System.out.println("虚拟线程执行任务");
    });
virtualThread.start();  // 手动启动
// 方式3：创建虚拟线程工厂
ThreadFactory virtualThreadFactory = Thread.ofVirtual()
    .name("worker-", 0)  // 名称前缀和起始编号
    .factory();
Thread thread1 = virtualThreadFactory.newThread(() -> System.out.println("任务1"));
Thread thread2 = virtualThreadFactory.newThread(() -> System.out.println("任务2"));
thread1.start();
thread2.start();
```

### 2. 使用 Executors.newVirtualThreadPerTaskExecutor()

推荐用 `Executors.newVirtualThreadPerTaskExecutor()` 创建虚拟线程执行器：

```java
// 创建虚拟线程执行器，每个任务都会创建一个新的虚拟线程
ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();
// 提交任务，每个任务都在独立的虚拟线程上运行
for (int i = 0; i < 1000000; i++) {
    int taskId = i;
    executor.submit(() -> {
        // 处理任务，可以创建百万个虚拟线程，不受限制
        processTask(taskId);
    });
}
// 关闭执行器
executor.shutdown();
try {
    executor.awaitTermination(1, TimeUnit.HOURS);
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();
}
```

### 3. 使用虚拟线程执行器服务

虚拟线程执行器服务可以替代传统的线程池：

```java
@Service
public class TaskService {
    // 使用虚拟线程执行器，替代传统线程池
    private final ExecutorService virtualExecutor = Executors.newVirtualThreadPerTaskExecutor();
    public void processTasks(List<Task> tasks) {
        // 为每个任务创建虚拟线程，不受线程数量限制
        List<CompletableFuture<Void>> futures = tasks.stream()
            .map(task -> CompletableFuture.runAsync(() -> {
                // 处理任务，虚拟线程会自动管理
                processTask(task);
            }, virtualExecutor))
            .toList();
        // 等待所有任务完成
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
    }
    private void processTask(Task task) {
        // 任务处理逻辑，I/O 操作时虚拟线程会自动挂起
        try {
            Thread.sleep(100);  // 模拟 I/O 操作
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
```

## 四、Spring Boot 4 中的虚拟线程

### 1. 启用虚拟线程

在 Spring Boot 4 中，可以通过配置启用虚拟线程：

```yaml
# application.yml 配置
spring:
  threads:
    virtual:
      enabled: true  # 启用虚拟线程，只有 Java 21 才支持
```

### 2. 配置虚拟线程执行器

在代码里配置虚拟线程执行器：

```java
@Configuration
public class VirtualThreadConfig {
    @Bean
    public Executor virtualThreadExecutor() {
        // 创建虚拟线程执行器，底层用的是 Java 21 的虚拟线程
        // 这玩意儿比传统线程池强多了，性能提升不是一点半点
        return Executors.newVirtualThreadPerTaskExecutor();
    }
    // 配置异步任务使用虚拟线程
    @Bean
    public TaskExecutor taskExecutor() {
        // 返回虚拟线程执行器，@Async 注解会使用这个执行器
        return new TaskExecutor() {
            private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();
            @Override
            public void execute(Runnable task) {
                executor.submit(task);
            }
        };
    }
}
```

### 3. 配置 WebMvc 使用虚拟线程

让 Tomcat 使用虚拟线程处理请求：

```java
@Configuration
public class WebMvcVirtualThreadConfig {
    // 配置 Tomcat 使用虚拟线程处理请求
    @Bean
    public TomcatProtocolHandlerCustomizer<?> protocolHandlerVirtualThreadExecutorCustomizer() {
        // 让 Tomcat 使用虚拟线程处理请求，性能提升明显
        // 每个 HTTP 请求都在独立的虚拟线程上处理，不受线程数量限制
        return protocolHandler -> {
            protocolHandler.setExecutor(Executors.newVirtualThreadPerTaskExecutor());
        };
    }
}
```

### 4. 使用 @Async 注解

`@Async` 注解也可以使用虚拟线程：

```java
@Service
public class AsyncService {
    @Async  // 使用虚拟线程执行异步任务
    public CompletableFuture<String> asyncTask(String input) {
        // 异步任务逻辑，在虚拟线程上执行
        try {
            Thread.sleep(1000);  // 模拟耗时操作，虚拟线程会自动挂起
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        return CompletableFuture.completedFuture("处理完成: " + input);
    }
}
@RestController
public class AsyncController {
    @Autowired
    private AsyncService asyncService;
    @GetMapping("/async")
    public CompletableFuture<String> handleAsync() {
        // 调用异步方法，在虚拟线程上执行
        return asyncService.asyncTask("请求数据");
    }
}
```

## 五、虚拟线程的最佳实践

### 1. 适合的场景

虚拟线程适合以下场景：

- **I/O 密集型任务**：数据库查询、HTTP 请求、文件读写等
- **高并发应用**：需要处理大量并发请求的 Web 应用
- **微服务调用**：服务间调用，大部分时间在等待响应

```java
// 适合使用虚拟线程的场景：I/O 密集型任务
@Service
public class IoIntensiveService {
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();
    public CompletableFuture<String> fetchData(String url) {
        // HTTP 请求，I/O 操作，适合用虚拟线程
        return CompletableFuture.supplyAsync(() -> {
            // 虚拟线程在等待 HTTP 响应时会自动挂起，不占用平台线程
            return httpClient.get(url);
        }, executor);
    }
    public CompletableFuture<User> queryUser(Long id) {
        // 数据库查询，I/O 操作，适合用虚拟线程
        return CompletableFuture.supplyAsync(() -> {
            // 虚拟线程在等待数据库响应时会自动挂起
            return userRepository.findById(id);
        }, executor);
    }
}
```

### 2. 不适合的场景

虚拟线程不适合以下场景：

- **CPU 密集型任务**：大量计算，没有 I/O 操作
- **长时间运行的同步代码**：会占用平台线程

```java
// 不适合使用虚拟线程的场景：CPU 密集型任务
@Service
public class CpuIntensiveService {
    // CPU 密集型任务，不适合用虚拟线程
    // 应该用平台线程或者 ForkJoinPool
    public void heavyComputation() {
        // 大量计算，没有 I/O 操作，虚拟线程不会带来性能提升
        long result = 0;
        for (int i = 0; i < 1000000000; i++) {
            result += i * i;  // CPU 密集型计算
        }
    }
    // 适合用 ForkJoinPool 处理 CPU 密集型任务
    private final ForkJoinPool forkJoinPool = new ForkJoinPool();
    public void parallelComputation() {
        forkJoinPool.submit(() -> {
            // CPU 密集型任务，用 ForkJoinPool 更合适
            heavyComputation();
        });
    }
}
```

### 3. 避免固定虚拟线程

虚拟线程阻塞时会自动挂起，所以不要用 `synchronized` 等会固定虚拟线程的操作：

```java
// 错误示例：使用 synchronized 会固定虚拟线程
public class BadExample {
    private final Object lock = new Object();
    public void badMethod() {
        synchronized (lock) {  // synchronized 会固定虚拟线程到平台线程
            // 如果这里阻塞，虚拟线程会被固定到平台线程，失去优势
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }
}
// 正确示例：使用 ReentrantLock 替代 synchronized
public class GoodExample {
    private final ReentrantLock lock = new ReentrantLock();
    public void goodMethod() {
        lock.lock();  // ReentrantLock 不会固定虚拟线程
        try {
            // 虚拟线程可以正常挂起和恢复
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        } finally {
            lock.unlock();
        }
    }
}
```

### 4. 合理使用虚拟线程执行器

不要为每个任务都创建新的虚拟线程执行器，应该复用：

```java
// 错误示例：为每个任务创建新的执行器
public class BadExecutorUsage {
    public void badMethod() {
        // 每次都创建新的执行器，浪费资源
        ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();
        executor.submit(() -> System.out.println("任务"));
        executor.shutdown();  // 立即关闭，任务可能还没执行完
    }
}
// 正确示例：复用执行器
@Service
public class GoodExecutorUsage {
    // 在类级别创建执行器，复用
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();
    public void goodMethod() {
        // 复用执行器，资源利用更高效
        executor.submit(() -> System.out.println("任务"));
    }
    @PreDestroy
    public void cleanup() {
        // 应用关闭时关闭执行器
        executor.shutdown();
    }
}
```

## 六、虚拟线程的性能优化

### 1. 系统属性配置

虚拟线程调度器可以通过系统属性配置：

```bash
# 设置虚拟线程调度器的并行度，默认是 CPU 核心数
-Djdk.virtualThreadScheduler.parallelism=8
# 设置虚拟线程调度器的最大线程池大小，默认是 256
-Djdk.virtualThreadScheduler.maxPoolSize=512
# 运行应用
java -Djdk.virtualThreadScheduler.parallelism=8 \
     -Djdk.virtualThreadScheduler.maxPoolSize=512 \
     -jar myapp.jar
```

### 2. 监控虚拟线程

可以通过 JVM 工具监控虚拟线程：

```java
// 监控虚拟线程数量
public class VirtualThreadMonitor {
    public void monitorVirtualThreads() {
        ThreadMXBean threadBean = ManagementFactory.getThreadMXBean();
        // 获取所有线程
        ThreadInfo[] threads = threadBean.dumpAllThreads(false, false);
        // 统计虚拟线程数量
        long virtualThreadCount = Arrays.stream(threads)
            .filter(thread -> {
                // 检查是否是虚拟线程
                // 注意：ThreadInfo 可能不直接支持 isVirtual()，需要其他方式判断
                return thread.getThreadName().contains("VirtualThread");
            })
            .count();
        System.out.println("虚拟线程数量: " + virtualThreadCount);
    }
}
```

## 七、虚拟线程的限制和注意事项

### 1. 固定虚拟线程的操作

以下操作会固定虚拟线程到平台线程：

- `synchronized` 关键字
- `Object.wait()` 和 `Object.notify()`
- `Thread.sleep()` 不会固定，但某些 JNI 调用会固定

```java
// 会固定虚拟线程的操作
public class PinningExample {
    private final Object lock = new Object();
    public void pinnedMethod() {
        synchronized (lock) {  // synchronized 会固定虚拟线程
            // 虚拟线程被固定到平台线程，失去优势
        }
    }
    // 使用 ReentrantLock 替代 synchronized
    private final ReentrantLock reentrantLock = new ReentrantLock();
    public void unpinnedMethod() {
        reentrantLock.lock();  // ReentrantLock 不会固定虚拟线程
        try {
            // 虚拟线程可以正常挂起和恢复
        } finally {
            reentrantLock.unlock();
        }
    }
}
```

### 2. 线程本地变量

虚拟线程支持线程本地变量，但要注意内存泄漏：

```java
// 线程本地变量在虚拟线程中的使用
public class ThreadLocalExample {
    private static final ThreadLocal<String> context = new ThreadLocal<>();
    public void useThreadLocal() {
        // 虚拟线程支持 ThreadLocal
        context.set("虚拟线程上下文");
        // 使用完后要清理，避免内存泄漏
        try {
            String value = context.get();
            System.out.println("上下文值: " + value);
        } finally {
            context.remove();  // 清理线程本地变量
        }
    }
}
```

### 3. 调试虚拟线程

虚拟线程的调试和传统线程类似，但要注意线程名称：

```java
// 设置虚拟线程名称，方便调试
Thread virtualThread = Thread.ofVirtual()
    .name("worker-", 0)  // 设置名称前缀和编号
    .start(() -> {
        // 任务逻辑
        System.out.println("线程名称: " + Thread.currentThread().getName());
    });
```

## 八、性能对比

### 1. 并发性能对比

虚拟线程在高并发场景下性能提升明显：

```java
// 性能对比测试
public class PerformanceComparison {
    public static void main(String[] args) throws InterruptedException {
        int taskCount = 100000;  // 10 万个任务
        // 测试平台线程池
        long start = System.currentTimeMillis();
        ExecutorService platformExecutor = Executors.newFixedThreadPool(200);
        for (int i = 0; i < taskCount; i++) {
            platformExecutor.submit(() -> {
                try {
                    Thread.sleep(100);  // 模拟 I/O 操作
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }
        platformExecutor.shutdown();
        platformExecutor.awaitTermination(1, TimeUnit.HOURS);
        long platformTime = System.currentTimeMillis() - start;
        // 测试虚拟线程
        start = System.currentTimeMillis();
        ExecutorService virtualExecutor = Executors.newVirtualThreadPerTaskExecutor();
        for (int i = 0; i < taskCount; i++) {
            virtualExecutor.submit(() -> {
                try {
                    Thread.sleep(100);  // 模拟 I/O 操作
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }
        virtualExecutor.shutdown();
        virtualExecutor.awaitTermination(1, TimeUnit.HOURS);
        long virtualTime = System.currentTimeMillis() - start;
        System.out.println("平台线程耗时: " + platformTime + "ms");
        System.out.println("虚拟线程耗时: " + virtualTime + "ms");
        System.out.println("性能提升: " + (platformTime - virtualTime) * 100.0 / platformTime + "%");
        // 虚拟线程通常能提升 30-50% 的性能
    }
}
```

## 九、总结

虚拟线程是 Java 21 最重要的特性之一，也是 Spring Boot 4 深度集成的功能。主要优势：

- **资源消耗小**：可以创建百万个虚拟线程，这玩意儿确实轻量
- **性能提升明显**：I/O 密集型任务性能提升 30-50%，这提升不是一点半点
- **使用简单**：和传统线程 API 兼容，学习成本低，上手快

反正鹏磊觉得这功能确实实用，特别是做高并发应用的时候，性能提升很明显。

适用场景：

- **I/O 密集型任务**：数据库查询、HTTP 请求等
- **高并发应用**：需要处理大量并发请求的 Web 应用
- **微服务调用**：服务间调用，大部分时间在等待响应

注意事项：

- **不适合 CPU 密集型任务**：应该用平台线程或 ForkJoinPool
- **避免使用 synchronized**：会固定虚拟线程，失去优势
- **合理使用执行器**：复用执行器，不要为每个任务创建新的

好了，今天就聊到这；下一篇咱详细说说声明式 HTTP 客户端 @HttpExchange 从入门到精通，包括怎么用声明式客户端简化 HTTP 调用。兄弟们有啥问题可以在评论区留言，鹏磊看到会回复的。
