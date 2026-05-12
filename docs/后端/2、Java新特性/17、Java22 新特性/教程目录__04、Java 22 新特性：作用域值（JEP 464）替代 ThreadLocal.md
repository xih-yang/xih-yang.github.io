# 04、Java 22 新特性：作用域值（JEP 464）替代 ThreadLocal
- 来源：https://ddkk.com/zhuanlan/java/java22/4.html
- 分类：Java 22 新特性
- 分组：教程目录
- 日期：2025-11-26
兄弟们，鹏磊今天来聊聊 Java 22 里的作用域值（Scoped Values）这个新特性，这玩意儿是 JEP 464 引入的，专门用来替代 `ThreadLocal` 的。说实话，`ThreadLocal` 用这么多年了，虽然方便，但确实有不少坑，内存泄漏、数据不一致啥的，老让人头疼。作用域值就是为了解决这些问题来的。

作用域值是 Java 22 的预览特性，它提供了一种更安全、更高效的方式来在线程及其子线程之间共享不可变数据。跟 `ThreadLocal` 比起来，作用域值有几个明显的优势：不可变性保证数据安全、限定的生命周期避免内存泄漏、子线程继承性特别适合虚拟线程场景，而且性能贼好，读取速度跟本地变量差不多。

## 为什么需要作用域值

先说说 `ThreadLocal` 的问题。`ThreadLocal` 虽然用起来方便，但确实有不少坑：

```java
// ThreadLocal 的典型用法
private static final ThreadLocal<String> context = new ThreadLocal<>();  // 定义 ThreadLocal 变量
// 设置值
context.set("用户ID: 12345");  // 在当前线程中设置值
// 获取值
String value = context.get();  // 从当前线程获取值
// 问题1：容易忘记清理，导致内存泄漏
// 如果线程被线程池复用，不清理的话，数据会一直存在
// 问题2：子线程无法继承
Thread childThread = new Thread(() -> {
    String childValue = context.get();  // 这里获取不到父线程的值，返回 null
    System.out.println(childValue);  // 输出 null
});
childThread.start();
// 问题3：可以随意修改，可能导致数据不一致
context.set("新值");  // 随时可以修改，没有保护机制
```

作用域值就是为了解决这些问题。它通过不可变性和限定的生命周期，让数据共享更安全、更可控。

## 基本用法

作用域值的基本用法很简单，先定义一个 `ScopedValue`，然后用 `where` 方法绑定值，在作用域内执行代码：

```java
import java.util.concurrent.ScopedValue;  // 导入作用域值类
// 定义一个作用域值，用于存储用户信息
private static final ScopedValue<String> currentUser = ScopedValue.newInstance();  // 创建作用域值实例
// 在作用域内绑定值并执行代码
ScopedValue.where(currentUser, "张三").run(() -> {  // 绑定值"张三"，然后执行代码块
    // 在这个作用域内，可以直接获取当前用户信息
    String user = currentUser.get();  // 获取绑定的值
    System.out.println("当前用户: " + user);  // 输出：当前用户: 张三
    // 调用其他方法，作用域值会自动传递
    processRequest();  // 这个方法内部也能访问 currentUser
});
// 作用域外访问会抛出异常
// String user = currentUser.get();  // 这里会抛出异常，因为不在作用域内
```

这玩意儿的好处是，值一旦绑定就不能修改，而且作用域结束后自动失效，不用担心内存泄漏。

## 实际应用场景

### 用户上下文传递

最常见的场景就是传递用户上下文信息，比如用户ID、权限信息啥的：

```java
// 定义用户信息记录
record UserInfo(String userId, String username, String role) {}  // 用户信息记录，包含ID、用户名、角色
// 定义作用域值
private static final ScopedValue<UserInfo> userContext = ScopedValue.newInstance();  // 创建用户上下文作用域值
// 处理请求的方法
void handleRequest(String userId, String username, String role) {
    // 创建用户信息对象
    UserInfo userInfo = new UserInfo(userId, username, role);  // 构建用户信息
    // 绑定用户信息到作用域值
    ScopedValue.where(userContext, userInfo).run(() -> {  // 绑定用户信息，然后执行
        // 在这个作用域内，任何地方都能获取用户信息
        processOrder();  // 处理订单，内部会用到用户信息
        logActivity();  // 记录活动日志，也会用到用户信息
    });
    // 作用域结束后，userContext 自动失效，不用担心内存泄漏
}
// 处理订单的方法
void processOrder() {
    // 直接获取用户信息，不需要传参数
    UserInfo user = userContext.get();  // 获取当前作用域的用户信息
    System.out.println("处理订单，用户: " + user.username());  // 使用用户信息
    // 调用其他方法，用户信息会自动传递
    validatePermission();  // 验证权限，也会用到用户信息
}
// 验证权限的方法
void validatePermission() {
    UserInfo user = userContext.get();  // 获取用户信息
    if (!"admin".equals(user.role())) {  // 检查角色
        throw new SecurityException("权限不足");  // 权限不足时抛出异常
    }
}
// 记录活动日志的方法
void logActivity() {
    UserInfo user = userContext.get();  // 获取用户信息
    System.out.println("用户 " + user.username() + " 执行了操作");  // 记录日志
}
```

这样写的好处是，不需要在每个方法里都传用户信息参数，代码更简洁，而且数据不可变，更安全。

### 请求追踪ID

另一个常见场景是传递请求追踪ID，用于日志追踪和调试：

```java
// 定义追踪ID作用域值
private static final ScopedValue<String> traceId = ScopedValue.newInstance();  // 创建追踪ID作用域值
// 处理请求
void processRequest(String requestId) {
    // 生成追踪ID
    String id = generateTraceId(requestId);  // 生成唯一的追踪ID
    // 绑定追踪ID
    ScopedValue.where(traceId, id).run(() -> {  // 绑定追踪ID，然后执行
        // 所有日志都会带上追踪ID
        logInfo("开始处理请求");  // 记录日志，会自动带上追踪ID
        processData();  // 处理数据
        logInfo("请求处理完成");  // 记录日志
    });
}
// 生成追踪ID的方法
String generateTraceId(String requestId) {
    return "trace-" + requestId + "-" + System.currentTimeMillis();  // 生成包含时间戳的追踪ID
}
// 记录日志的方法
void logInfo(String message) {
    String id = traceId.get();  // 获取追踪ID
    System.out.println("[" + id + "] " + message);  // 输出带追踪ID的日志
}
// 处理数据的方法
void processData() {
    logInfo("开始处理数据");  // 记录日志，会自动带上追踪ID
    // 处理逻辑...
    logInfo("数据处理完成");  // 记录日志
}
```

这样所有日志都会自动带上追踪ID，调试起来方便多了。

## 与虚拟线程结合

作用域值特别适合跟虚拟线程（Virtual Threads）一起用，因为虚拟线程可以创建很多子线程，作用域值会自动继承：

```java
import java.util.concurrent.Executors;  // 导入执行器
import java.util.concurrent.ExecutorService;  // 导入执行器服务
// 定义作用域值
private static final ScopedValue<String> requestId = ScopedValue.newInstance();  // 创建请求ID作用域值
// 使用虚拟线程处理请求
void handleRequestWithVirtualThread(String id) {
    // 绑定请求ID
    ScopedValue.where(requestId, id).run(() -> {  // 绑定请求ID
        try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {  // 创建虚拟线程执行器
            // 提交多个任务，都会继承 requestId
            executor.submit(() -> {
                String rid = requestId.get();  // 子线程可以获取父线程的作用域值
                System.out.println("任务1，请求ID: " + rid);  // 输出请求ID
            });
            executor.submit(() -> {
                String rid = requestId.get();  // 子线程可以获取父线程的作用域值
                System.out.println("任务2，请求ID: " + rid);  // 输出请求ID
            });
            executor.submit(() -> {
                String rid = requestId.get();  // 子线程可以获取父线程的作用域值
                System.out.println("任务3，请求ID: " + rid);  // 输出请求ID
            });
        }
    });
}
```

虚拟线程创建的子线程会自动继承作用域值，不需要手动传递，用起来贼方便。

## 嵌套作用域

作用域值支持嵌套，内层作用域可以覆盖外层作用域的值：

```java
// 定义作用域值
private static final ScopedValue<String> context = ScopedValue.newInstance();  // 创建作用域值
// 外层作用域
ScopedValue.where(context, "外层值").run(() -> {  // 绑定外层值
    System.out.println("外层: " + context.get());  // 输出：外层: 外层值
    // 内层作用域，覆盖外层值
    ScopedValue.where(context, "内层值").run(() -> {  // 绑定内层值，覆盖外层值
        System.out.println("内层: " + context.get());  // 输出：内层: 内层值
        // 更内层的作用域
        ScopedValue.where(context, "最内层值").run(() -> {  // 绑定最内层值
            System.out.println("最内层: " + context.get());  // 输出：最内层: 最内层值
        });
        // 回到内层作用域
        System.out.println("内层: " + context.get());  // 输出：内层: 内层值
    });
    // 回到外层作用域
    System.out.println("外层: " + context.get());  // 输出：外层: 外层值
});
```

嵌套作用域时，内层会覆盖外层，但外层值不会丢失，内层作用域结束后会自动恢复。

## 与 ThreadLocal 对比

作用域值跟 `ThreadLocal` 比起来，有几个明显的优势：

### 1. 不可变性

作用域值一旦绑定就不能修改，`ThreadLocal` 可以随时修改：

```java
// ThreadLocal 可以修改
ThreadLocal<String> tl = new ThreadLocal<>();  // 创建 ThreadLocal
tl.set("初始值");  // 设置初始值
tl.set("修改后的值");  // 可以随时修改，可能导致数据不一致
// 作用域值不可变
ScopedValue<String> sv = ScopedValue.newInstance();  // 创建作用域值
ScopedValue.where(sv, "初始值").run(() -> {
    // sv.set("新值");  // 编译错误，作用域值不支持修改
    String value = sv.get();  // 只能读取，不能修改
});
```

### 2. 自动清理

作用域值作用域结束后自动失效，`ThreadLocal` 需要手动清理：

```java
// ThreadLocal 需要手动清理
ThreadLocal<String> tl = new ThreadLocal<>();  // 创建 ThreadLocal
try {
    tl.set("值");  // 设置值
    // 使用值...
} finally {
    tl.remove();  // 必须手动清理，否则可能内存泄漏
}
// 作用域值自动清理
ScopedValue<String> sv = ScopedValue.newInstance();  // 创建作用域值
ScopedValue.where(sv, "值").run(() -> {
    // 使用值...
});  // 作用域结束后自动失效，不需要手动清理
```

### 3. 子线程继承

作用域值可以被子线程继承，`ThreadLocal` 不行：

```java
// ThreadLocal 子线程无法继承
ThreadLocal<String> tl = new ThreadLocal<>();  // 创建 ThreadLocal
tl.set("父线程值");  // 在父线程设置值
Thread child = new Thread(() -> {
    String value = tl.get();  // 子线程获取不到，返回 null
    System.out.println(value);  // 输出 null
});
child.start();
// 作用域值子线程可以继承
ScopedValue<String> sv = ScopedValue.newInstance();  // 创建作用域值
ScopedValue.where(sv, "父线程值").run(() -> {  // 绑定值
    Thread child = new Thread(() -> {
        String value = sv.get();  // 子线程可以获取父线程的值
        System.out.println(value);  // 输出：父线程值
    });
    child.start();
});
```

### 4. 性能优势

作用域值的读取性能跟本地变量差不多，比 `ThreadLocal` 快：

```java
// ThreadLocal 读取需要查找线程本地存储
ThreadLocal<String> tl = new ThreadLocal<>();  // 创建 ThreadLocal
tl.set("值");  // 设置值
String value = tl.get();  // 需要查找线程本地存储，有一定开销
// 作用域值读取性能更好
ScopedValue<String> sv = ScopedValue.newInstance();  // 创建作用域值
ScopedValue.where(sv, "值").run(() -> {
    String value = sv.get();  // 读取速度跟本地变量差不多，性能更好
});
```

## 完整示例：Web 请求处理

来个完整的例子，模拟 Web 请求处理，用作用域值传递请求上下文：

```java
import java.util.concurrent.ScopedValue;  // 导入作用域值
import java.util.concurrent.Executors;  // 导入执行器
import java.util.concurrent.ExecutorService;  // 导入执行器服务
// 定义请求上下文记录
record RequestContext(String requestId, String userId, String ipAddress) {}  // 请求上下文，包含请求ID、用户ID、IP地址
// 定义作用域值
private static final ScopedValue<RequestContext> requestContext = ScopedValue.newInstance();  // 创建请求上下文作用域值
// 模拟处理 Web 请求
void handleWebRequest(String requestId, String userId, String ipAddress) {
    // 创建请求上下文
    RequestContext context = new RequestContext(requestId, userId, ipAddress);  // 构建请求上下文对象
    // 绑定请求上下文
    ScopedValue.where(requestContext, context).run(() -> {  // 绑定请求上下文，然后执行
        // 记录请求开始
        logRequest("开始处理请求");  // 记录日志，会自动带上请求上下文
        // 验证用户权限
        if (validateUser()) {  // 验证用户，内部会用到请求上下文
            // 处理业务逻辑
            processBusinessLogic();  // 处理业务逻辑，内部会用到请求上下文
            // 记录请求完成
            logRequest("请求处理完成");  // 记录日志
        } else {
            // 记录权限拒绝
            logRequest("权限验证失败");  // 记录日志
            throw new SecurityException("用户无权限");  // 抛出安全异常
        }
    });
}
// 验证用户的方法
boolean validateUser() {
    RequestContext ctx = requestContext.get();  // 获取请求上下文
    System.out.println("验证用户: " + ctx.userId() + ", IP: " + ctx.ipAddress());  // 输出用户信息
    // 模拟权限验证逻辑
    return ctx.userId() != null && !ctx.userId().isEmpty();  // 简单的验证逻辑
}
// 处理业务逻辑的方法
void processBusinessLogic() {
    RequestContext ctx = requestContext.get();  // 获取请求上下文
    // 使用虚拟线程处理多个子任务
    try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {  // 创建虚拟线程执行器
        // 提交多个任务，都会继承请求上下文
        executor.submit(() -> {
            RequestContext taskCtx = requestContext.get();  // 子线程可以获取请求上下文
            System.out.println("任务1，请求ID: " + taskCtx.requestId());  // 输出请求ID
        });
        executor.submit(() -> {
            RequestContext taskCtx = requestContext.get();  // 子线程可以获取请求上下文
            System.out.println("任务2，请求ID: " + taskCtx.requestId());  // 输出请求ID
        });
    }
}
// 记录请求日志的方法
void logRequest(String message) {
    RequestContext ctx = requestContext.get();  // 获取请求上下文
    String log = String.format("[%s] [%s] %s", ctx.requestId(), ctx.userId(), message);  // 格式化日志
    System.out.println(log);  // 输出日志
}
// 主方法，测试一下
public static void main(String[] args) {
    ScopedValueDemo demo = new ScopedValueDemo();  // 创建示例对象
    // 模拟处理几个请求
    demo.handleWebRequest("req-001", "user-123", "192.168.1.100");  // 处理第一个请求
    demo.handleWebRequest("req-002", "user-456", "192.168.1.101");  // 处理第二个请求
}
```

这个例子展示了作用域值在实际项目中的应用，代码简洁，而且不用担心内存泄漏。

## 注意事项

使用作用域值时，有几个需要注意的地方：

1. **作用域外访问会抛异常**：如果不在作用域内访问作用域值，会抛出 `NoSuchElementException`：

```java
ScopedValue<String> sv = ScopedValue.newInstance();  // 创建作用域值
// 作用域外访问
try {
    String value = sv.get();  // 这里会抛出异常，因为不在作用域内
} catch (NoSuchElementException e) {
    System.out.println("作用域值未绑定");  // 捕获异常
}
```

1. **值不可变**：作用域值一旦绑定就不能修改，如果需要修改，得创建新的作用域：

```java
ScopedValue<String> sv = ScopedValue.newInstance();  // 创建作用域值
ScopedValue.where(sv, "初始值").run(() -> {
    // 如果需要修改值，得创建新的作用域
    ScopedValue.where(sv, "新值").run(() -> {
        String value = sv.get();  // 获取新值
        System.out.println(value);  // 输出：新值
    });
});
```

1. **预览特性**：作用域值是 Java 22 的预览特性，编译和运行时要启用预览功能：

```bash
# 编译时启用预览
javac --release 22 --enable-preview ScopedValueDemo.java
# 运行时启用预览
java --enable-preview ScopedValueDemo
```

## 总结

作用域值是 Java 22 引入的一个很实用的特性，专门用来替代 `ThreadLocal`。它通过不可变性和限定的生命周期，解决了 `ThreadLocal` 的内存泄漏和数据不一致问题。特别适合跟虚拟线程一起用，子线程自动继承作用域值，用起来贼方便。

虽然现在还是预览特性，但已经可以在项目里试试了。如果你们项目里用了很多 `ThreadLocal`，可以考虑迁移到作用域值，代码会更安全、更简洁。不过要注意，作用域值是预览特性，生产环境用的话得谨慎点，等正式版出来再大规模用。

兄弟们，今天就聊到这儿，有啥问题评论区见！
