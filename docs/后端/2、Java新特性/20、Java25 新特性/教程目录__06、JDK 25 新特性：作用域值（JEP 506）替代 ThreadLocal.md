# 06、JDK 25 新特性：作用域值（JEP 506）替代 ThreadLocal
- 来源：https://ddkk.com/zhuanlan/java/java25/6.html
- 分类：JDK 25 新特性
- 分组：教程目录
- 日期：2025-11-27
鹏磊我在使用 `ThreadLocal` 时，经常遇到内存泄漏、生命周期不明确等问题。特别是在虚拟线程和线程池环境下，这些问题更加突出。JDK 25 引入的作用域值（Scoped Values，JEP 506）正是为了替代 `ThreadLocal` 而设计的。

作用域值提供了不可变的数据共享机制，值绑定到特定的作用域而非线程，作用域结束时自动清理，避免了内存泄漏风险。鹏磊我觉得更重要的是，子线程可以自动继承父线程的作用域值，这在虚拟线程和结构化并发场景下特别有用。相比 `ThreadLocal`，作用域值在性能、安全性和易用性方面都有显著提升。

## 作用域值是啥

先说说啥是作用域值吧。简单点说，作用域值就是一个不可变的值，它绑定到一个特定的作用域里，只有在这个作用域内才能访问，作用域结束了就自动清理了。这跟 `ThreadLocal` 不一样，`ThreadLocal` 的值是跟线程绑定的，生命周期不明确，容易泄漏；作用域值是跟作用域绑定的，生命周期很清晰。

作用域值的核心特点有几个：第一是不可变性，一旦设置了就不能改了，保证了线程安全；第二是作用域明确，值只在绑定的作用域内有效，出了作用域就访问不到了；第三是自动清理，作用域结束的时候值就自动清理了，不会泄漏；第四是子线程继承，子线程能自动继承父线程的作用域值，这在虚拟线程和结构化并发里特别有用。

## 为啥要替代 ThreadLocal

`ThreadLocal` 用了这么多年，为啥现在要替代它呢？主要是它有几个问题：

第一个问题是生命周期不明确。`ThreadLocal` 的值是跟线程绑定的，线程不结束，值就一直存在，但很多时候咱不知道线程啥时候结束，特别是用线程池的时候，线程是复用的，值可能一直不清理，导致内存泄漏。

第二个问题是内存泄漏风险。如果 `ThreadLocal` 的值是个大对象，或者引用了其他对象，线程不结束这些对象就释放不了，时间长了内存就泄漏了。虽然可以用 `remove()` 手动清理，但容易忘，而且代码里到处都是清理逻辑也挺烦的。

第三个问题是在虚拟线程环境下不好用。虚拟线程是轻量级的，数量可能很多，如果用 `ThreadLocal`，每个虚拟线程都要维护自己的值，开销比较大。而且虚拟线程可能被挂起和恢复，`ThreadLocal` 的值传递也不够灵活。

第四个问题是子线程继承麻烦。如果要在子线程里用父线程的 `ThreadLocal` 值，得手动传递，代码写起来麻烦，而且容易出错。

作用域值就是为了解决这些问题而设计的，它提供了更清晰、更安全、更高效的线程间数据共享方式。

## 基本用法

先看看作用域值的基本用法。首先得创建一个 `ScopedValue` 实例，这通常用静态 final 字段来定义，因为作用域值是不可变的，定义一次就能一直用。

```java
import java.lang.ScopedValue;
// 创建一个作用域值，用来存储用户信息
private static final ScopedValue<String> USER = ScopedValue.newInstance();  // 创建一个新的作用域值实例
// 在作用域内绑定值并执行代码
public static void main(String[] args) {
    // 把 "Alice" 绑定到 USER 作用域值上，然后执行 run 方法里的代码
    ScopedValue.where(USER, "Alice").run(() -> {
        // 在这个作用域内，USER.get() 返回 "Alice"
        System.out.println("当前用户: " + USER.get());  // 输出: 当前用户: Alice
        // 调用其他方法，这些方法也能访问 USER 的值
        processRequest();  // 这个方法里也能用 USER.get() 获取值
    });
    // 出了作用域，再访问 USER.get() 就会抛异常
    // USER.get();  // 这行会抛 ScopedValue$UnboundException
}
```

这个例子里面，`USER` 是一个作用域值，用来存储用户名。`ScopedValue.where(USER, "Alice").run(...)` 这行代码把 "Alice" 绑定到 `USER` 上，然后执行 `run` 方法里的代码块。在这个代码块里，任何地方调用 `USER.get()` 都能获取到 "Alice"。出了这个代码块，`USER` 就自动解绑了，再访问就会抛异常。

## 嵌套作用域

作用域值支持嵌套，内层作用域可以重新绑定值，外层作用域的值会被内层覆盖，但内层作用域结束后，外层作用域的值会恢复。

```java
private static final ScopedValue<String> USER = ScopedValue.newInstance();  // 定义作用域值
public static void main(String[] args) {
    // 外层作用域，绑定 "Alice"
    ScopedValue.where(USER, "Alice").run(() -> {
        System.out.println("外层用户: " + USER.get());  // 输出: 外层用户: Alice
        // 内层作用域，重新绑定 "Bob"
        ScopedValue.where(USER, "Bob").run(() -> {
            System.out.println("内层用户: " + USER.get());  // 输出: 内层用户: Bob
            // 再嵌套一层，绑定 "Charlie"
            ScopedValue.where(USER, "Charlie").run(() -> {
                System.out.println("最内层用户: " + USER.get());  // 输出: 最内层用户: Charlie
            });
            // 内层作用域结束后，恢复为 "Bob"
            System.out.println("恢复后用户: " + USER.get());  // 输出: 恢复后用户: Bob
        });
        // 外层作用域结束后，恢复为 "Alice"
        System.out.println("外层恢复后用户: " + USER.get());  // 输出: 外层恢复后用户: Alice
    });
}
```

这个例子展示了嵌套作用域的行为。外层绑定 "Alice"，内层绑定 "Bob"，最内层绑定 "Charlie"。在内层作用域里，访问 `USER.get()` 得到的是内层的值；内层作用域结束后，值会恢复到外层的值。这种机制让作用域值在不同层级的代码里都能正确工作。

## 检查值是否绑定

有时候咱需要检查一个作用域值是不是已经绑定了，可以用 `isBound()` 方法。如果没绑定，可以用 `orElse()` 提供默认值，或者用 `orElseThrow()` 抛异常。

```java
private static final ScopedValue<String> USER = ScopedValue.newInstance();  // 定义作用域值
public static void main(String[] args) {
    // 检查 USER 是否绑定
    if (USER.isBound()) {
        // 如果绑定了，获取值
        System.out.println("用户: " + USER.get());
    } else {
        // 如果没绑定，使用默认值
        System.out.println("用户: " + USER.orElse("匿名用户"));  // 输出: 用户: 匿名用户
    }
    // 在作用域内绑定值
    ScopedValue.where(USER, "Alice").run(() -> {
        // 现在绑定了，可以用 get() 获取
        System.out.println("用户: " + USER.get());  // 输出: 用户: Alice
        // 或者用 orElse，但绑定了就用绑定的值
        System.out.println("用户: " + USER.orElse("匿名用户"));  // 输出: 用户: Alice
    });
    // 如果没绑定，orElseThrow 会抛异常
    try {
        String user = USER.orElseThrow(() -> new IllegalStateException("用户未设置"));  // 会抛异常
    } catch (IllegalStateException e) {
        System.out.println("捕获异常: " + e.getMessage());  // 输出: 捕获异常: 用户未设置
    }
}
```

注意一下，JDK 25 里 `orElse()` 方法不允许传 `null` 了，如果传 `null` 会抛 `NullPointerException`。这是为了保证默认值总是非空的，提高 API 的安全性。

## 执行有返回值的方法

除了 `run()` 方法执行 `Runnable`，还可以用 `call()` 方法执行 `Callable`，这样能获取返回值。

```java
import java.util.concurrent.Callable;
private static final ScopedValue<String> USER = ScopedValue.newInstance();  // 定义作用域值
public static void main(String[] args) throws Exception {
    // 执行有返回值的方法
    String result = ScopedValue.where(USER, "Alice").call(() -> {
        // 在这个作用域内，USER.get() 返回 "Alice"
        String userName = USER.get();  // 获取绑定的用户名
        return "处理用户: " + userName;  // 返回处理结果
    });
    System.out.println(result);  // 输出: 处理用户: Alice
    // 也可以抛出异常
    try {
        ScopedValue.where(USER, "Alice").call(() -> {
            if (USER.get().equals("Alice")) {
                throw new RuntimeException("用户 Alice 不允许操作");  // 抛异常
            }
            return "成功";
        });
    } catch (RuntimeException e) {
        System.out.println("捕获异常: " + e.getMessage());  // 输出: 捕获异常: 用户 Alice 不允许操作
    }
}
```

`call()` 方法会执行 `Callable`，返回结果，如果 `Callable` 抛异常，异常会传播出来。这样就能在作用域内执行有返回值的操作了。

## 多个作用域值组合使用

有时候需要同时绑定多个作用域值，可以用 `ScopedValue.Carrier` 来组合多个值。

```java
private static final ScopedValue<String> USER = ScopedValue.newInstance();  // 用户作用域值
private static final ScopedValue<String> REQUEST_ID = ScopedValue.newInstance();  // 请求 ID 作用域值
private static final ScopedValue<Integer> PRIORITY = ScopedValue.newInstance();  // 优先级作用域值
public static void main(String[] args) {
    // 用 Carrier 组合多个作用域值
    ScopedValue.Carrier carrier = ScopedValue.where(USER, "Alice")  // 绑定用户
            .where(REQUEST_ID, "req-123")  // 绑定请求 ID
            .where(PRIORITY, 10);  // 绑定优先级
    // 执行代码，所有值都可用
    carrier.run(() -> {
        System.out.println("用户: " + USER.get());  // 输出: 用户: Alice
        System.out.println("请求 ID: " + REQUEST_ID.get());  // 输出: 请求 ID: req-123
        System.out.println("优先级: " + PRIORITY.get());  // 输出: 优先级: 10
        // 调用其他方法，这些方法也能访问所有作用域值
        processRequest();
    });
}
// 处理请求的方法，可以访问所有作用域值
static void processRequest() {
    String user = USER.get();  // 获取用户
    String requestId = REQUEST_ID.get();  // 获取请求 ID
    int priority = PRIORITY.get();  // 获取优先级
    System.out.println("处理请求 - 用户: " + user + ", 请求 ID: " + requestId + ", 优先级: " + priority);
}
```

`ScopedValue.Carrier` 可以链式调用 `where()` 方法绑定多个值，然后一次性执行代码。这样就能同时传递多个上下文信息了，不用一个个单独绑定。

## 与虚拟线程配合使用

作用域值最大的优势就是跟虚拟线程配合使用。虚拟线程是轻量级的，数量可能很多，如果用 `ThreadLocal`，每个线程都要维护自己的值，开销比较大。作用域值就不一样了，它是跟作用域绑定的，不是跟线程绑定的，虚拟线程能自动继承父线程的作用域值。

```java
import java.util.concurrent.Executors;
import java.util.concurrent.ExecutorService;
private static final ScopedValue<String> USER = ScopedValue.newInstance();  // 定义作用域值
public static void main(String[] args) throws InterruptedException {
    // 创建虚拟线程执行器
    try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
        // 在主线程绑定用户信息
        ScopedValue.where(USER, "Alice").run(() -> {
            // 提交任务到虚拟线程，虚拟线程会自动继承 USER 的值
            executor.submit(() -> {
                // 虚拟线程里也能访问 USER 的值
                System.out.println("虚拟线程中的用户: " + USER.get());  // 输出: 虚拟线程中的用户: Alice
                // 可以创建子虚拟线程，也会继承
                try (ExecutorService childExecutor = Executors.newVirtualThreadPerTaskExecutor()) {
                    childExecutor.submit(() -> {
                        System.out.println("子虚拟线程中的用户: " + USER.get());  // 输出: 子虚拟线程中的用户: Alice
                    });
                }
            });
        });
        // 等待任务完成
        Thread.sleep(100);
    }
}
```

这个例子展示了作用域值在虚拟线程环境下的使用。主线程绑定了 `USER` 的值，然后提交任务到虚拟线程，虚拟线程能自动继承这个值。子虚拟线程也能继承，这样就能在整个调用链里传递上下文信息了，不用手动传递参数。

## 与结构化并发配合

作用域值跟结构化并发（Structured Concurrency）配合使用效果也很好。结构化并发把相关的并发任务当成一个工作单元来管理，作用域值能在这个工作单元里传递上下文信息。

```java
import java.util.concurrent.StructuredTaskScope;
import java.util.concurrent.ExecutionException;
private static final ScopedValue<String> USER = ScopedValue.newInstance();  // 定义作用域值
public static void main(String[] args) throws InterruptedException, ExecutionException {
    // 绑定用户信息
    ScopedValue.where(USER, "Alice").run(() -> {
        // 创建结构化任务作用域
        try (var scope = new StructuredTaskScope<String>()) {
            // 提交多个任务，都能访问 USER 的值
            var task1 = scope.fork(() -> {
                String user = USER.get();  // 获取用户信息
                return "任务1完成，用户: " + user;
            });
            var task2 = scope.fork(() -> {
                String user = USER.get();  // 获取用户信息
                return "任务2完成，用户: " + user;
            });
            // 等待所有任务完成
            scope.join();
            // 获取结果
            System.out.println(task1.get());  // 输出: 任务1完成，用户: Alice
            System.out.println(task2.get());  // 输出: 任务2完成，用户: Alice
        }
    });
}
```

结构化并发里，所有子任务都能访问父作用域的作用域值，这样就能在整个并发工作单元里共享上下文信息了，代码写起来简洁多了。

## 实际应用场景

作用域值在实际开发中还是挺有用的，下面举几个常见的应用场景。

### 场景一：Web 请求上下文传递

在 Web 应用里，经常需要在请求处理过程中传递用户信息、请求 ID 等上下文信息。以前用 `ThreadLocal`，现在可以用作用域值，更安全，性能也更好。

```java
// Web 框架的请求处理器示例
public class RequestHandler {
    private static final ScopedValue<String> USER_ID = ScopedValue.newInstance();  // 用户 ID
    private static final ScopedValue<String> REQUEST_ID = ScopedValue.newInstance();  // 请求 ID
    private static final ScopedValue<Locale> LOCALE = ScopedValue.newInstance();  // 语言环境
    // 处理请求的方法
    public void handleRequest(HttpRequest request) {
        // 从请求中提取上下文信息
        String userId = extractUserId(request);  // 提取用户 ID
        String requestId = generateRequestId();  // 生成请求 ID
        Locale locale = extractLocale(request);  // 提取语言环境
        // 绑定到作用域值
        ScopedValue.Carrier carrier = ScopedValue.where(USER_ID, userId)
                .where(REQUEST_ID, requestId)
                .where(LOCALE, locale);
        // 执行请求处理逻辑
        carrier.run(() -> {
            // 调用业务逻辑，这些方法都能访问上下文信息
            processBusinessLogic();
        });
    }
    // 业务逻辑方法，可以访问作用域值
    private void processBusinessLogic() {
        String userId = USER_ID.get();  // 获取用户 ID
        String requestId = REQUEST_ID.get();  // 获取请求 ID
        Locale locale = LOCALE.get();  // 获取语言环境
        // 使用上下文信息处理业务
        System.out.println("处理业务 - 用户: " + userId + ", 请求: " + requestId + ", 语言: " + locale);
    }
}
```

### 场景二：日志上下文传递

在日志系统里，经常需要传递请求 ID、用户 ID 等上下文信息，让日志能关联起来。作用域值很适合这种场景。

```java
import java.util.logging.Logger;
public class LoggingExample {
    private static final ScopedValue<String> REQUEST_ID = ScopedValue.newInstance();  // 请求 ID
    private static final ScopedValue<String> USER_ID = ScopedValue.newInstance();  // 用户 ID
    private static final Logger logger = Logger.getLogger(LoggingExample.class.getName());
    // 处理请求
    public void processRequest(String requestId, String userId) {
        // 绑定上下文信息
        ScopedValue.where(REQUEST_ID, requestId)
                .where(USER_ID, userId)
                .run(() -> {
                    // 记录日志，自动包含上下文信息
                    logger.info("开始处理请求");  // 日志会自动包含请求 ID 和用户 ID
                    // 调用其他方法，日志也会包含上下文
                    doSomething();
                });
    }
    // 其他方法，日志自动包含上下文
    private void doSomething() {
        String requestId = REQUEST_ID.get();  // 获取请求 ID
        String userId = USER_ID.get();  // 获取用户 ID
        logger.info("执行操作");  // 日志会自动包含上下文信息
    }
}
```

### 场景三：事务上下文传递

在数据库事务处理里，需要传递事务上下文信息，作用域值也能很好地支持这种场景。

```java
public class TransactionExample {
    private static final ScopedValue<Transaction> TX = ScopedValue.newInstance();  // 事务上下文
    // 执行事务
    public void executeTransaction() {
        // 创建事务
        Transaction tx = beginTransaction();  // 开始事务
        // 绑定事务上下文
        ScopedValue.where(TX, tx).run(() -> {
            try {
                // 执行数据库操作，都能访问事务上下文
                insertData();
                updateData();
                // 提交事务
                TX.get().commit();  // 获取事务并提交
            } catch (Exception e) {
                // 回滚事务
                TX.get().rollback();  // 获取事务并回滚
                throw e;
            }
        });
    }
    // 插入数据
    private void insertData() {
        Transaction tx = TX.get();  // 获取事务上下文
        // 使用事务执行插入操作
        tx.execute("INSERT INTO ...");
    }
    // 更新数据
    private void updateData() {
        Transaction tx = TX.get();  // 获取事务上下文
        // 使用事务执行更新操作
        tx.execute("UPDATE ...");
    }
}
```

## 性能优势

作用域值相比 `ThreadLocal` 有几个性能优势：

第一个是内存占用更小。`ThreadLocal` 每个线程都要维护一个 Map，存储所有的值，内存占用比较大。作用域值是用栈结构存储的，只有当前作用域的值在栈上，内存占用小多了。

第二个是访问速度更快。`ThreadLocal` 的访问需要查 Map，有哈希计算的开销。作用域值是直接访问栈上的值，速度更快。

第三个是清理开销更小。`ThreadLocal` 需要手动清理，或者等线程结束才清理，清理开销比较大。作用域值是自动清理的，作用域结束就清理了，开销很小。

第四个是虚拟线程友好。虚拟线程数量可能很多，如果用 `ThreadLocal`，每个线程都要维护 Map，开销很大。作用域值不依赖线程，只依赖作用域，虚拟线程能自动继承，开销很小。

## 注意事项

用作用域值的时候有几个注意事项：

第一个是不可变性。作用域值一旦绑定就不能改了，如果需要可变的值，得用其他方式，比如用 `AtomicReference` 包装。

第二个是作用域限制。作用域值只在绑定的作用域内有效，出了作用域就访问不到了，设计代码结构的时候要注意作用域的范围。

第三个是异常处理。如果作用域内的代码抛异常，作用域值也会自动清理，但异常会传播出来，要注意异常处理。

第四个是性能考虑。虽然作用域值性能比 `ThreadLocal` 好，但如果频繁创建和销毁作用域，还是有一定开销的，要根据实际情况权衡。

## 总结

作用域值（JEP 506）是 JDK 25 引入的一个很重要的特性，它提供了比 `ThreadLocal` 更安全、更高效、更清晰的线程间数据共享方式。主要优势包括：不可变性保证线程安全，作用域明确自动清理，子线程自动继承，性能更好，虚拟线程友好。

在实际开发中，作用域值特别适合用在 Web 请求上下文传递、日志上下文传递、事务上下文传递等场景。配合虚拟线程和结构化并发使用，效果更好。

虽然作用域值有一些限制，比如值不可变、作用域限制等，但这些限制也带来了安全性和性能优势。总的来说，作用域值是一个很好的 `ThreadLocal` 替代方案，值得在实际项目中尝试使用。

兄弟们，作用域值这特性还是挺实用的，特别是如果你在用虚拟线程或者结构化并发，作用域值能让代码写起来更简洁，性能也更好。建议大家在合适的场景下试试，应该会有不错的体验。
