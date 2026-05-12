# 15、Java 22 新特性：Java 22 新特性总结与最佳实践
- 来源：https://ddkk.com/zhuanlan/java/java22/15.html
- 分类：Java 22 新特性
- 分组：教程目录
- 日期：2025-11-26
兄弟们，鹏磊今天来聊聊 Java 22 新特性的总结和最佳实践，这玩意儿是前面 14 篇文章的总结。说实话，写这个教程花了不少时间，把 Java 22 的新特性都捋了一遍，从基础特性到组合使用，从性能优化到实战应用，基本上都覆盖了。今天咱们就来总结一下，看看这些新特性到底咋用，啥时候用，怎么用才能发挥最大效果。

Java 22 这个版本，说实话，变化挺大的，新特性也挺多。但不是说所有特性都得用，得根据实际场景选择。有些特性适合生产环境，有些还在预览阶段，得谨慎使用。有些特性能提升性能，有些能简化代码，有些能改善并发编程。今天鹏磊就结合实战经验，给兄弟们整一套完整的最佳实践指南，从特性选择到使用建议，从迁移策略到注意事项，全方位覆盖。

## Java 22 新特性全景总结

先说说 Java 22 都有哪些新特性，咱们按类别总结一下：

### 语言特性改进

**未命名变量和模式（JEP 456）**：这玩意儿是正式特性，生产环境可以直接用。主要作用是简化代码，用下划线 `_` 表示未使用的变量，代码更简洁了。

```java
// 未命名变量的典型用法
try {
    processData();  // 处理数据，不需要捕获异常信息
} catch (Exception _) {  // 用下划线表示未使用的异常变量
    // 只需要知道异常发生了，不需要具体信息
    logError("处理失败");  // 记录错误日志
}
// 在循环中使用未命名变量
for (int i = 0; i < items.size(); i++) {  // 只需要索引，不需要元素
    processItem(i);  // 处理元素
}
// 在模式匹配中使用未命名变量
if (obj instanceof String _) {  // 只需要类型检查，不需要绑定变量
    System.out.println("是字符串");  // 输出信息
}
```

**字符串模板（JEP 459）**：这玩意儿是第二预览版，API 可能会变，生产环境慎用。主要作用是简化字符串拼接，可以在字符串里直接嵌入表达式。

```java
// 字符串模板的典型用法（需要启用预览特性）
String name = "张三";  // 定义变量
int age = 25;  // 定义变量
String message = STR."我叫\{name}，今年\{age}岁";  // 使用字符串模板，直接嵌入表达式
System.out.println(message);  // 输出：我叫张三，今年25岁
// 多行字符串模板
String sql = STR."""
    SELECT * FROM users
    WHERE name = '\{name}'
    AND age > \{age}
    """;  // 多行字符串模板，方便写 SQL
```

**在 super() 调用之前的语句（JEP 447）**：这玩意儿是预览版，构造函数更灵活了，可以在 super() 之前执行一些逻辑。

```java
// 在 super() 调用之前的语句（需要启用预览特性）
public class Child extends Parent {
    private final String config;  // 配置字段
    public Child(String name) {
        // 在 super() 之前可以执行逻辑
        this.config = loadConfig(name);  // 加载配置
        if (config == null) {  // 检查配置
            throw new IllegalArgumentException("配置不能为空");  // 抛出异常
        }
        super(config);  // 调用父类构造函数
    }
    private String loadConfig(String name) {  // 加载配置方法
        // 加载配置逻辑
        return "config-" + name;  // 返回配置
    }
}
```

**流收集器（JEP 461）**：这玩意儿是预览版，流处理更强大了，可以自定义收集器。

```java
// 流收集器的典型用法（需要启用预览特性）
List<String> names = List.of("张三", "李四", "王五");  // 创建列表
// 使用新的收集器
Map<String, Integer> result = names.stream()  // 创建流
    .collect(Collectors.groupingBy(  // 分组收集
        name -> name.substring(0, 1),  // 按首字母分组
        Collectors.summingInt(String::length)  // 求和长度
    ));  // 返回结果
```

### 并发编程增强

**作用域值（JEP 464）**：这玩意儿是第二预览版，替代 ThreadLocal 的新方案，线程间共享数据更安全。

```java
// 作用域值的典型用法（需要启用预览特性）
private static final ScopedValue<String> currentUser = ScopedValue.newInstance();  // 定义作用域值
// 在作用域内绑定值并执行代码
ScopedValue.where(currentUser, "张三").run(() -> {  // 绑定值，然后执行
    String user = currentUser.get();  // 获取绑定的值
    System.out.println("当前用户: " + user);  // 输出：当前用户: 张三
    // 调用其他方法，作用域值会自动传递
    processRequest();  // 这个方法内部也能访问 currentUser
});
```

**结构化并发（JEP 462）**：这玩意儿是第二预览版，多线程编程更简单，错误处理更清晰。

```java
// 结构化并发的典型用法（需要启用预览特性）
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {  // 创建结构化任务作用域
    // Fork 多个任务并行执行
    var task1 = scope.fork(() -> fetchData1());  // 并行获取数据1
    var task2 = scope.fork(() -> fetchData2());  // 并行获取数据2
    var task3 = scope.fork(() -> fetchData3());  // 并行获取数据3
    scope.join();  // 等待所有任务完成
    scope.throwIfFailed();  // 检查是否有失败
    // 获取所有任务的结果
    String result1 = task1.get();  // 获取结果1
    String result2 = task2.get();  // 获取结果2
    String result3 = task3.get();  // 获取结果3
}
```

### 性能优化

**向量 API（JEP 460）**：这玩意儿是第七孵化版，利用硬件 SIMD 指令，数值计算性能提升明显。

```java
// 向量 API 的典型用法（需要启用孵化特性）
import jdk.incubator.vector.*;  // 导入向量 API 包
public void vectorAdd(float[] a, float[] b, float[] result) {
    VectorSpecies<Float> species = FloatVector.SPECIES_PREFERRED;  // 获取首选向量种类
    int i = 0;  // 循环索引
    // 向量化处理
    for (; i < species.loopBound(a.length); i += species.length()) {  // 向量化循环
        FloatVector va = FloatVector.fromArray(species, a, i);  // 从数组加载向量
        FloatVector vb = FloatVector.fromArray(species, b, i);  // 从数组加载向量
        FloatVector vc = va.add(vb);  // 向量相加
        vc.intoArray(result, i);  // 将结果写回数组
    }
    // 处理剩余元素
    for (; i < a.length; i++) {  // 处理剩余部分
        result[i] = a[i] + b[i];  // 标量处理
    }
}
```

**外部函数和内存 API（JEP 454）**：这玩意儿是正式特性，调用本地代码更高效，内存操作更安全。

```java
// 外部函数和内存 API 的典型用法
import java.lang.foreign.*;  // 导入外部函数和内存 API
import java.lang.foreign.FunctionDescriptor;  // 导入函数描述符
// 定义本地函数接口
Linker linker = Linker.nativeLinker();  // 创建链接器
SymbolLookup lookup = SymbolLookup.loaderLookup();  // 创建符号查找器
// 查找本地函数
MemorySegment strlen = lookup.find("strlen").orElseThrow();  // 查找 strlen 函数
// 定义函数描述符
FunctionDescriptor descriptor = FunctionDescriptor.of(  // 创建函数描述符
    ValueLayout.JAVA_LONG,  // 返回类型：long
    ValueLayout.ADDRESS  // 参数类型：指针
);
// 创建方法句柄
MethodHandle methodHandle = linker.downcallHandle(strlen, descriptor);  // 创建方法句柄
// 调用本地函数
try (Arena arena = Arena.ofConfined()) {  // 创建内存区域
    MemorySegment str = arena.allocateUtf8String("Hello");  // 分配字符串内存
    long length = (long) methodHandle.invoke(str);  // 调用本地函数
    System.out.println("长度: " + length);  // 输出：长度: 5
}
```

### 工具和 API

**类文件 API（JEP 457）**：这玩意儿是正式特性，解析、生成、转换类文件更方便了。

```java
// 类文件 API 的典型用法
import java.lang.classfile.*;  // 导入类文件 API
// 读取类文件
byte[] classBytes = Files.readAllBytes(Paths.get("MyClass.class"));  // 读取类文件字节
ClassModel model = ClassFile.of().parse(classBytes);  // 解析类文件
// 遍历类的方法
for (MethodModel method : model.methods()) {  // 遍历方法
    System.out.println("方法: " + method.methodName());  // 输出方法名
    System.out.println("描述符: " + method.methodType());  // 输出方法描述符
}
// 修改类文件
byte[] modified = ClassFile.of().transform(classBytes, (classBuilder, element) -> {  // 转换类文件
    if (element instanceof MethodModel method) {  // 如果是方法
        // 修改方法逻辑
        classBuilder.withMethod(  // 添加方法
            method.methodName(),  // 方法名
            method.methodType(),  // 方法类型
            method.flags(),  // 方法标志
            methodBuilder -> {  // 方法构建器
                // 修改方法体
            }
        );
    } else {
        classBuilder.with(element);  // 保留其他元素
    }
});
```

**启动多个源文件程序（JEP 458）**：这玩意儿是正式特性，命令行运行多个源文件，小项目开发更简单。

```bash
# 直接运行多个源文件，不需要先编译
java Main.java Util.java Helper.java
# 或者使用通配符
java *.java
```

## 特性使用建议

### 生产环境可用特性

这些特性是正式特性，生产环境可以直接用，不用担心 API 变化：

1. **未命名变量和模式（JEP 456）**：正式特性，直接使用，能简化代码
2. **外部函数和内存 API（JEP 454）**：正式特性，适合性能敏感场景
3. **类文件 API（JEP 457）**：正式特性，适合工具开发
4. **启动多个源文件程序（JEP 458）**：正式特性，适合小项目开发

### 预览特性使用建议

这些特性是预览版，API 可能会变，生产环境要谨慎使用：

1. **字符串模板（JEP 459）**：第二预览版，可以先在非关键路径使用，熟悉 API
2. **作用域值（JEP 464）**：第二预览版，可以先在测试环境使用，等正式版再迁移
3. **结构化并发（JEP 462）**：第二预览版，可以先在内部工具使用，积累经验
4. **在 super() 调用之前的语句（JEP 447）**：预览版，可以先在实验性功能使用
5. **流收集器（JEP 461）**：预览版，可以先在数据处理场景使用

使用预览特性需要启用预览标志：

```bash
# 编译时启用预览特性
javac --enable-preview --release 22 MyClass.java
# 运行时启用预览特性
java --enable-preview MyClass
```

### 孵化特性使用建议

这些特性是孵化版，API 变化可能更大，建议先了解，等稳定了再用：

1. **向量 API（JEP 460）**：第七孵化版，可以先在性能测试中使用，确认效果再大规模使用

使用孵化特性需要启用孵化模块：

```bash
# 运行时启用孵化模块
java --add-modules jdk.incubator.vector MyClass
```

## 最佳实践指南

### 代码质量提升

**使用未命名变量简化代码**：在不需要使用变量值的地方，用下划线 `_` 代替，代码更简洁。

```java
// ✅ 好的做法：使用未命名变量
try {
    processData();  // 处理数据
} catch (Exception _) {  // 不需要异常信息，用下划线
    logError("处理失败");  // 记录错误
}
// ❌ 不好的做法：定义未使用的变量
try {
    processData();  // 处理数据
} catch (Exception e) {  // 定义了变量但没使用
    logError("处理失败");  // 记录错误，e 变量浪费了
}
```

**使用字符串模板简化字符串拼接**：在需要字符串拼接的地方，用字符串模板代替 `StringBuilder` 或 `+` 号。

```java
// ✅ 好的做法：使用字符串模板
String name = "张三";  // 定义变量
int age = 25;  // 定义变量
String message = STR."我叫\{name}，今年\{age}岁";  // 使用模板，代码更简洁
// ❌ 不好的做法：使用字符串拼接
String name = "张三";  // 定义变量
int age = 25;  // 定义变量
String message = "我叫" + name + "，今年" + age + "岁";  // 使用 + 号拼接，代码啰嗦
```

### 并发编程最佳实践

**使用作用域值替代 ThreadLocal**：在需要线程间共享数据的场景，优先使用作用域值，避免内存泄漏。

```java
// ✅ 好的做法：使用作用域值
private static final ScopedValue<String> currentUser = ScopedValue.newInstance();  // 定义作用域值
ScopedValue.where(currentUser, "张三").run(() -> {  // 绑定值并执行
    String user = currentUser.get();  // 获取值
    processRequest();  // 处理请求，作用域值自动传递
});  // 作用域结束，值自动失效，不用担心内存泄漏
// ❌ 不好的做法：使用 ThreadLocal
private static final ThreadLocal<String> currentUser = new ThreadLocal<>();  // 定义 ThreadLocal
currentUser.set("张三");  // 设置值
try {
    String user = currentUser.get();  // 获取值
    processRequest();  // 处理请求
} finally {
    currentUser.remove();  // 必须手动清理，容易忘记
}
```

**使用结构化并发管理并发任务**：在需要并发执行多个任务的场景，使用结构化并发，代码更清晰，错误处理更简单。

```java
// ✅ 好的做法：使用结构化并发
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {  // 创建作用域
    var task1 = scope.fork(() -> fetchData1());  // 并行获取数据1
    var task2 = scope.fork(() -> fetchData2());  // 并行获取数据2
    var task3 = scope.fork(() -> fetchData3());  // 并行获取数据3
    scope.join();  // 等待所有任务完成
    scope.throwIfFailed();  // 检查失败，自动处理错误
    // 获取结果
    String result1 = task1.get();  // 获取结果1
    String result2 = task2.get();  // 获取结果2
    String result3 = task3.get();  // 获取结果3
}  // 作用域结束，所有任务自动取消，不用担心资源泄漏
// ❌ 不好的做法：使用传统并发
ExecutorService executor = Executors.newFixedThreadPool(3);  // 创建线程池
List<Future<String>> futures = new ArrayList<>();  // 创建 Future 列表
futures.add(executor.submit(() -> fetchData1()));  // 提交任务1
futures.add(executor.submit(() -> fetchData2()));  // 提交任务2
futures.add(executor.submit(() -> fetchData3()));  // 提交任务3
try {
    // 获取结果，需要手动处理异常
    for (Future<String> future : futures) {  // 遍历 Future
        String result = future.get();  // 获取结果，可能抛出异常
        // 处理结果
    }
} catch (Exception e) {  // 处理异常
    // 需要手动取消其他任务
    for (Future<String> future : futures) {  // 遍历 Future
        future.cancel(true);  // 取消任务
    }
    throw e;  // 重新抛出异常
} finally {
    executor.shutdown();  // 必须手动关闭线程池
}
```

### 性能优化最佳实践

**使用向量 API 优化数值计算**：在需要大量数值计算的场景，使用向量 API，性能提升明显。

```java
// ✅ 好的做法：使用向量 API
public void vectorAdd(float[] a, float[] b, float[] result) {
    VectorSpecies<Float> species = FloatVector.SPECIES_PREFERRED;  // 获取首选种类
    int i = 0;  // 循环索引
    // 向量化处理
    for (; i < species.loopBound(a.length); i += species.length()) {  // 向量化循环
        FloatVector va = FloatVector.fromArray(species, a, i);  // 加载向量
        FloatVector vb = FloatVector.fromArray(species, b, i);  // 加载向量
        FloatVector vc = va.add(vb);  // 向量相加
        vc.intoArray(result, i);  // 写回数组
    }
    // 处理剩余元素
    for (; i < a.length; i++) {  // 处理剩余部分
        result[i] = a[i] + b[i];  // 标量处理
    }
}
// ❌ 不好的做法：使用标量计算
public void scalarAdd(float[] a, float[] b, float[] result) {
    for (int i = 0; i < a.length; i++) {  // 标量循环
        result[i] = a[i] + b[i];  // 标量相加，性能较差
    }
}
```

**组合使用多种优化技术**：单一技术效果有限，组合使用效果才明显。

```java
// ✅ 好的做法：组合使用向量 API 和结构化并发
public float[] parallelVectorAdd(float[] a, float[] b) throws InterruptedException {
    try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {  // 创建结构化任务作用域
        // 将数组分成多个块，并行处理
        int chunkSize = a.length / Runtime.getRuntime().availableProcessors();  // 计算块大小
        var tasks = new ArrayList<StructuredTaskScope.Subtask<float[]>>();  // 创建任务列表
        for (int i = 0; i < a.length; i += chunkSize) {  // 遍历块
            final int start = i;  // 捕获起始位置
            final int end = Math.min(i + chunkSize, a.length);  // 计算结束位置
            var task = scope.fork(() -> vectorAddChunk(a, b, start, end));  // 并行处理块
            tasks.add(task);  // 添加到任务列表
        }
        scope.join();  // 等待所有任务完成
        scope.throwIfFailed();  // 检查失败
        // 合并结果
        float[] result = new float[a.length];  // 创建结果数组
        int offset = 0;  // 偏移量
        for (var task : tasks) {  // 遍历任务
            float[] chunk = task.get();  // 获取块结果
            System.arraycopy(chunk, 0, result, offset, chunk.length);  // 复制到结果数组
            offset += chunk.length;  // 更新偏移量
        }
        return result;  // 返回结果
    }
}
```

### 特性组合使用

**字符串模板和作用域值组合**：在需要格式化字符串并传递上下文的场景，组合使用字符串模板和作用域值。

```java
// ✅ 好的做法：组合使用字符串模板和作用域值
private static final ScopedValue<String> currentUser = ScopedValue.newInstance();  // 定义作用域值
public void logMessage(String message) {
    ScopedValue.where(currentUser, "张三").run(() -> {  // 绑定用户
        String user = currentUser.get();  // 获取用户
        String log = STR."[\{user}] \{message}";  // 使用字符串模板格式化日志
        System.out.println(log);  // 输出日志
    });
}
```

**结构化并发和作用域值组合**：在需要并发执行多个任务并共享上下文的场景，组合使用结构化并发和作用域值。

```java
// ✅ 好的做法：组合使用结构化并发和作用域值
private static final ScopedValue<String> currentUser = ScopedValue.newInstance();  // 定义作用域值
public Map<String, String> fetchUserData(String userId) throws InterruptedException {
    return ScopedValue.where(currentUser, userId).call(() -> {  // 绑定用户ID
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {  // 创建结构化任务作用域
            // 子任务自动继承作用域值，不需要传参数
            var userInfoTask = scope.fork(() -> fetchUserInfo());  // 获取用户信息
            var userOrdersTask = scope.fork(() -> fetchUserOrders());  // 获取用户订单
            var userPreferencesTask = scope.fork(() -> fetchUserPreferences());  // 获取用户偏好
            scope.join();  // 等待所有任务完成
            scope.throwIfFailed();  // 检查失败
            // 获取结果
            return Map.of(  // 返回结果映射
                "info", userInfoTask.get(),  // 用户信息
                "orders", userOrdersTask.get(),  // 用户订单
                "preferences", userPreferencesTask.get()  // 用户偏好
            );
        }
    });
}
```

## 迁移策略

### 从旧版本升级到 Java 22

**第一步：检查兼容性**：先检查项目是否使用了已移除的 API，比如 `java.lang.Thread.countStackFrames`。

```bash
# 使用 jdeps 检查依赖
jdeps --jdk-internals your-project.jar
# 检查是否有使用已移除的 API
```

**第二步：逐步迁移**：不要一次性迁移所有代码，先迁移非关键路径，积累经验。

```java
// 第一步：先在新功能中使用新特性
public class NewFeature {
    // 使用未命名变量（正式特性，安全）
    public void process() {
        try {
            doSomething();  // 执行操作
        } catch (Exception _) {  // 使用未命名变量
            logError("失败");  // 记录错误
        }
    }
}
// 第二步：在测试环境使用预览特性
public class TestFeature {
    // 使用字符串模板（预览特性，需要测试）
    public void test() {
        String name = "测试";  // 定义变量
        String message = STR."测试消息: \{name}";  // 使用字符串模板
        System.out.println(message);  // 输出消息
    }
}
```

**第三步：性能测试**：使用新特性后，进行性能测试，确认效果。

```java
// 使用 JMH 进行性能测试
@Benchmark
public void testVectorAPI() {
    // 测试向量 API 性能
}
@Benchmark
public void testScalar() {
    // 测试标量性能
}
```

### 从 ThreadLocal 迁移到作用域值

**第一步：识别使用场景**：找出所有使用 ThreadLocal 的地方。

```java
// 旧的代码：使用 ThreadLocal
private static final ThreadLocal<String> currentUser = new ThreadLocal<>();  // 定义 ThreadLocal
public void process(String userId) {
    currentUser.set(userId);  // 设置值
    try {
        doSomething();  // 执行操作
    } finally {
        currentUser.remove();  // 清理值
    }
}
```

**第二步：迁移到作用域值**：将 ThreadLocal 替换为作用域值。

```java
// 新的代码：使用作用域值
private static final ScopedValue<String> currentUser = ScopedValue.newInstance();  // 定义作用域值
public void process(String userId) {
    ScopedValue.where(currentUser, userId).run(() -> {  // 绑定值并执行
        doSomething();  // 执行操作，不需要手动清理
    });  // 作用域结束，值自动失效
}
```

## 注意事项和常见问题

### 预览特性的注意事项

**API 可能会变化**：预览特性的 API 可能会在后续版本中变化，需要关注更新。

```java
// 当前版本的字符串模板
String message = STR."我叫\{name}";  // 当前语法
// 未来版本可能会变化（示例，不是真实变化）
// String message = STR."我叫${name}";  // 可能的未来语法
```

**需要启用预览标志**：使用预览特性需要在编译和运行时启用预览标志。

```bash
# 编译时启用预览特性
javac --enable-preview --release 22 MyClass.java
# 运行时启用预览特性
java --enable-preview MyClass
```

### 性能优化的注意事项

**需要充分预热**：向量 API 等性能优化特性需要充分预热，让 JIT 编译器优化。

```java
// 性能测试前需要预热
public void benchmark() {
    // 预热阶段
    for (int i = 0; i < 10000; i++) {  // 预热循环
        vectorAdd(a, b, result);  // 执行操作，让 JIT 优化
    }
    // 正式测试
    long start = System.nanoTime();  // 记录开始时间
    for (int i = 0; i < 1000000; i++) {  // 测试循环
        vectorAdd(a, b, result);  // 执行操作
    }
    long end = System.nanoTime();  // 记录结束时间
    System.out.println("耗时: " + (end - start) + " 纳秒");  // 输出耗时
}
```

**需要硬件支持**：向量 API 的性能提升依赖于硬件 SIMD 支持，不支持 SIMD 的硬件可能没有提升。

```java
// 检查硬件支持
VectorSpecies<Float> species = FloatVector.SPECIES_PREFERRED;  // 获取首选种类
int vectorLength = species.length();  // 获取向量长度
System.out.println("向量长度: " + vectorLength);  // 输出向量长度
// 如果向量长度是 1，说明硬件不支持 SIMD，向量化没有意义
```

### 并发编程的注意事项

**作用域值的不可变性**：作用域值一旦绑定就不能修改，如果需要可变数据，考虑其他方案。

```java
// ✅ 好的做法：使用不可变数据
private static final ScopedValue<String> currentUser = ScopedValue.newInstance();  // 定义作用域值
ScopedValue.where(currentUser, "张三").run(() -> {  // 绑定值
    String user = currentUser.get();  // 获取值，不能修改
    processRequest();  // 处理请求
});
// ❌ 不好的做法：尝试修改作用域值（会失败）
ScopedValue.where(currentUser, "张三").run(() -> {  // 绑定值
    // currentUser.set("李四");  // 这行代码会失败，作用域值不可修改
});
```

**结构化并发的任务取消**：结构化并发作用域结束时，所有未完成的任务会自动取消。

```java
// 结构化并发会自动取消未完成的任务
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {  // 创建作用域
    var task1 = scope.fork(() -> longRunningTask1());  // 长时间运行的任务1
    var task2 = scope.fork(() -> longRunningTask2());  // 长时间运行的任务2
    scope.join();  // 等待所有任务完成
    // 如果某个任务失败，其他任务会自动取消
}  // 作用域结束，所有未完成的任务自动取消
```

## 总结

Java 22 这个版本，新特性挺多的，但不是说所有特性都得用，得根据实际场景选择。今天鹏磊总结了一下，给兄弟们整了一套完整的最佳实践指南：

**正式特性可以直接用**：未命名变量和模式、外部函数和内存 API、类文件 API、启动多个源文件程序这些正式特性，生产环境可以直接用，不用担心 API 变化。

**预览特性要谨慎使用**：字符串模板、作用域值、结构化并发这些预览特性，API 可能会变，生产环境要谨慎使用，可以先在非关键路径使用，积累经验。

**孵化特性建议先了解**：向量 API 这种孵化特性，API 变化可能更大，建议先了解，等稳定了再用。

**组合使用效果更好**：单一技术效果有限，组合使用效果才明显。比如向量 API + 结构化并发 + 作用域值，性能提升和代码质量都能兼顾。

**持续学习和优化**：Java 22 的新特性还在不断演进，得持续学习，持续优化。性能优化不是一次性的，得持续监控，根据实际情况调整。

兄弟们，这个教程就到这里了。Java 22 确实是个好东西，新特性挺多的，值得好好学一下。希望这个教程能帮到兄弟们，有啥问题欢迎留言讨论，鹏磊会继续分享 Java 的最新动态。

好了，就这些，开始用 Java 22 整活吧！
