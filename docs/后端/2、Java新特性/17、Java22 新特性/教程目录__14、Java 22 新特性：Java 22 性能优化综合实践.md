# 14、Java 22 新特性：Java 22 性能优化综合实践
- 来源：https://ddkk.com/zhuanlan/java/java22/14.html
- 分类：Java 22 新特性
- 分组：教程目录
- 日期：2025-11-26
兄弟们，鹏磊今天来聊聊 Java 22 的性能优化综合实践，这玩意儿是前面几篇文章的综合应用。说实话，写高性能代码这么多年了，最头疼的就是如何把各种优化技巧组合起来用，单个特性虽然好，但组合起来用效果才最明显。今天咱们就来整一个综合性的性能优化方案，把向量 API、结构化并发、作用域值这些新特性，还有 JVM 调优、代码优化这些老技巧，全都组合起来，搞一个完整的性能优化实战。

性能优化这玩意儿，不是说你用了某个新特性就能提升性能，得综合考虑代码层面、并发层面、JVM 层面、硬件层面，方方面面都得照顾到。Java 22 提供了很多新工具，但怎么用、什么时候用、怎么组合用，这才是关键。今天鹏磊就结合实战经验，给兄弟们整一套完整的性能优化方案，从代码到 JVM，从单线程到多线程，从数值计算到 IO 操作，全方位覆盖。

## 性能优化的整体思路

先说说性能优化的整体思路。性能优化不是瞎搞，得有个清晰的思路：

```java
// 性能优化的整体思路
public class PerformanceOptimizationStrategy {
    // 第一步：识别性能瓶颈
    // 用性能分析工具找出瓶颈，别瞎猜
    // 常见的瓶颈：CPU 密集型、IO 密集型、内存分配、GC 停顿、锁竞争
    // 第二步：选择合适的优化策略
    // CPU 密集型：用向量 API、并行流、Fork/Join
    // IO 密集型：用虚拟线程、异步 IO、NIO
    // 内存密集型：减少对象分配、对象池、堆外内存
    // 并发密集型：结构化并发、作用域值、无锁数据结构
    // 第三步：组合使用多种技术
    // 单一技术效果有限，组合使用效果才明显
    // 比如：向量 API + 结构化并发 + 作用域值
    // 第四步：持续监控和调优
    // 优化不是一次性的，得持续监控，根据实际情况调整
}
```

这玩意儿的关键是，得先找出瓶颈，再针对性地优化，别瞎搞。而且单一技术效果有限，得组合使用，效果才明显。

## 数值计算性能优化

数值计算是性能优化的重点，特别是矩阵运算、图像处理、科学计算这些场景。Java 22 的向量 API 就是专门为这个设计的。

### 矩阵乘法优化

矩阵乘法是典型的数值计算场景，用向量 API 可以大幅提升性能：

```java
import jdk.incubator.vector.*;  // 导入向量 API 包
import java.util.concurrent.StructuredTaskScope;  // 导入结构化并发
import java.util.concurrent.ScopedValue;  // 导入作用域值
// 矩阵乘法优化：向量 API + 结构化并发
public class MatrixMultiplication {
    // 定义作用域值，用于传递矩阵参数
    private static final ScopedValue<MatrixParams> matrixParams = ScopedValue.newInstance();  // 创建作用域值
    // 矩阵参数记录
    record MatrixParams(float[] a, float[] b, int size) {}  // 矩阵参数，包含矩阵 a、矩阵 b、矩阵大小
    // 优化的矩阵乘法：使用向量 API 和结构化并发
    public float[] multiply(float[] a, float[] b, int size) throws InterruptedException {
        // 绑定矩阵参数到作用域值
        return ScopedValue.where(matrixParams, new MatrixParams(a, b, size)).call(() -> {  // 绑定参数，然后执行
            float[] result = new float[size * size];  // 创建结果矩阵
            // 使用结构化并发并行计算多个行
            try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {  // 创建结构化任务作用域
                // 将矩阵乘法分解为多个行的计算，并行执行
                var tasks = new ArrayList<StructuredTaskScope.Subtask<Void>>();  // 存储任务列表
                // 为每一行创建一个任务
                for (int i = 0; i < size; i++) {  // 遍历每一行
                    final int row = i;  // 捕获行索引
                    // Fork 一个任务来计算这一行
                    var task = scope.fork(() -> computeRow(row));  // 并行计算每一行
                    tasks.add(task);  // 添加到任务列表
                }
                scope.join();  // 等待所有任务完成
                scope.throwIfFailed();  // 检查是否有失败
            }
            return result;  // 返回结果矩阵
        });
    }
    // 计算矩阵的一行：使用向量 API 优化
    private Void computeRow(int row) {
        MatrixParams params = matrixParams.get();  // 获取矩阵参数
        float[] a = params.a();  // 获取矩阵 a
        float[] b = params.b();  // 获取矩阵 b
        int size = params.size();  // 获取矩阵大小
        float[] result = new float[size];  // 创建行结果数组
        VectorSpecies<Float> species = FloatVector.SPECIES_PREFERRED;  // 获取首选向量种类
        // 向量化计算这一行的每个元素
        for (int j = 0; j < size; j++) {  // 遍历这一行的每个元素
            FloatVector sum = FloatVector.zero(species);  // 初始化和向量
            int k = 0;  // 循环索引
            // 向量化计算：sum += a[row][k] * b[k][j]
            for (; k < species.loopBound(size); k += species.length()) {  // 向量化循环
                // 加载矩阵 a 的一行
                FloatVector va = FloatVector.fromArray(species, a, row * size + k);  // 从矩阵 a 加载向量
                // 加载矩阵 b 的一列（需要转置访问）
                float[] bColumn = new float[species.length()];  // 创建临时数组存储列数据
                for (int idx = 0; idx < species.length() && k + idx < size; idx++) {  // 复制列数据
                    bColumn[idx] = b[(k + idx) * size + j];  // 转置访问矩阵 b
                }
                FloatVector vb = FloatVector.fromArray(species, bColumn, 0);  // 从临时数组加载向量
                // 向量乘加：sum += va * vb
                sum = sum.fma(va, vb);  // 融合乘加累加
            }
            // 归约求和
            result[j] = sum.reduceLanes(VectorOperators.ADD);  // 归约求和得到结果
            // 处理剩余元素
            for (; k < size; k++) {  // 处理剩余部分
                result[j] += a[row * size + k] * b[k * size + j];  // 标量处理剩余元素
            }
        }
        return null;  // 返回 null（Void 类型）
    }
}
```

这玩意儿的好处是，既用了向量 API 加速单线程计算，又用了结构化并发并行计算多行，性能提升贼明显。而且用作用域值传递参数，代码更简洁，不用到处传参数。

### 图像处理优化

图像处理也是典型的数值计算场景，用向量 API 可以大幅提升性能：

```java
import jdk.incubator.vector.*;  // 导入向量 API 包
import java.util.concurrent.StructuredTaskScope;  // 导入结构化并发
// 图像处理优化：向量 API + 结构化并发
public class ImageProcessing {
    // 图像灰度化：使用向量 API 优化
    public void grayscale(byte[] rgbImage, byte[] grayImage, int width, int height) {
        VectorSpecies<Byte> species = ByteVector.SPECIES_PREFERRED;  // 获取首选向量种类
        int pixelCount = width * height;  // 计算像素总数
        int i = 0;  // 循环索引
        // 向量化处理：每次处理多个像素
        for (; i < species.loopBound(pixelCount * 3); i += species.length() * 3) {  // 每次处理多个像素（RGB 三个通道）
            // 加载 RGB 通道
            ByteVector r = ByteVector.fromArray(species, rgbImage, i);  // 加载红色通道
            ByteVector g = ByteVector.fromArray(species, rgbImage, i + 1);  // 加载绿色通道
            ByteVector b = ByteVector.fromArray(species, rgbImage, i + 2);  // 加载蓝色通道
            // 灰度化公式：gray = 0.299 * r + 0.587 * g + 0.114 * b
            // 由于 ByteVector 不支持浮点运算，需要转换为 IntVector
            IntVector rInt = r.convert(VectorOperators.B2I, 0);  // 转换为 int
            IntVector gInt = g.convert(VectorOperators.B2I, 0);  // 转换为 int
            IntVector bInt = b.convert(VectorOperators.B2I, 0);  // 转换为 int
            // 计算灰度值（使用整数运算避免浮点）
            IntVector gray = rInt.mul(77).add(gInt.mul(150)).add(bInt.mul(29)).div(256);  // 灰度化计算（整数版本）
            // 转换回 byte 并存储
            ByteVector grayByte = gray.convert(VectorOperators.I2B, 0);  // 转换回 byte
            int grayIndex = i / 3;  // 计算灰度图像索引
            grayByte.intoArray(grayImage, grayIndex);  // 存储灰度值
        }
        // 处理剩余像素
        for (; i < pixelCount * 3; i += 3) {  // 处理剩余像素
            int r = rgbImage[i] & 0xFF;  // 获取红色通道（无符号）
            int g = rgbImage[i + 1] & 0xFF;  // 获取绿色通道
            int b = rgbImage[i + 2] & 0xFF;  // 获取蓝色通道
            int gray = (r * 77 + g * 150 + b * 29) / 256;  // 灰度化计算
            grayImage[i / 3] = (byte) gray;  // 存储灰度值
        }
    }
    // 图像模糊：使用向量 API 和结构化并发
    public void blur(byte[] image, byte[] result, int width, int height, int radius) throws InterruptedException {
        // 使用结构化并发并行处理多行
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {  // 创建结构化任务作用域
            var tasks = new ArrayList<StructuredTaskScope.Subtask<Void>>();  // 存储任务列表
            // 为每一行创建一个任务
            for (int y = 0; y < height; y++) {  // 遍历每一行
                final int row = y;  // 捕获行索引
                // Fork 一个任务来处理这一行
                var task = scope.fork(() -> blurRow(image, result, width, height, row, radius));  // 并行处理每一行
                tasks.add(task);  // 添加到任务列表
            }
            scope.join();  // 等待所有任务完成
            scope.throwIfFailed();  // 检查是否有失败
        }
    }
    // 模糊一行：使用向量 API 优化
    private Void blurRow(byte[] image, byte[] result, int width, int height, int row, int radius) {
        VectorSpecies<Byte> species = ByteVector.SPECIES_PREFERRED;  // 获取首选向量种类
        // 对每个像素进行模糊处理
        for (int x = 0; x < width; x++) {  // 遍历这一行的每个像素
            int sum = 0;  // 累加和
            int count = 0;  // 像素计数
            // 在模糊半径内累加像素值
            for (int dy = -radius; dy <= radius; dy++) {  // 遍历垂直方向
                for (int dx = -radius; dx <= radius; dx++) {  // 遍历水平方向
                    int nx = x + dx;  // 计算邻居像素 x 坐标
                    int ny = row + dy;  // 计算邻居像素 y 坐标
                    // 检查边界
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {  // 边界检查
                        sum += image[ny * width + nx] & 0xFF;  // 累加像素值
                        count++;  // 增加计数
                    }
                }
            }
            // 计算平均值
            result[row * width + x] = (byte) (sum / count);  // 存储模糊后的像素值
        }
        return null;  // 返回 null
    }
}
```

图像处理用向量 API 可以大幅提升性能，特别是灰度化、模糊、边缘检测这些操作，性能提升几倍甚至几十倍。

## 并发性能优化

并发性能优化是另一个重点，Java 22 的结构化并发和作用域值可以大幅提升并发性能。

### 并发数据聚合

并发数据聚合是常见的场景，用结构化并发和作用域值可以大幅提升性能：

```java
import java.util.concurrent.StructuredTaskScope;  // 导入结构化并发
import java.util.concurrent.ScopedValue;  // 导入作用域值
import java.util.List;  // 导入列表类
import java.util.Map;  // 导入映射类
import java.util.HashMap;  // 导入哈希映射类
import java.util.stream.Collectors;  // 导入流收集器
// 并发数据聚合：结构化并发 + 作用域值
public class ConcurrentDataAggregation {
    // 定义作用域值，用于传递聚合参数
    private static final ScopedValue<AggregationParams> aggregationParams = ScopedValue.newInstance();  // 创建作用域值
    // 聚合参数记录
    record AggregationParams(List<List<Data>> dataChunks, String groupBy) {}  // 聚合参数，包含数据块列表、分组字段
    // 数据记录
    record Data(String category, double value) {}  // 数据记录，包含类别、值
    // 并发聚合：使用结构化并发并行处理多个数据块
    public Map<String, Double> aggregate(List<Data> data, String groupBy) throws InterruptedException {
        // 将数据分成多个块，并行处理
        int chunkSize = Math.max(1, data.size() / Runtime.getRuntime().availableProcessors());  // 计算块大小
        List<List<Data>> chunks = new ArrayList<>();  // 创建块列表
        // 分割数据
        for (int i = 0; i < data.size(); i += chunkSize) {  // 遍历数据
            int end = Math.min(i + chunkSize, data.size());  // 计算块结束位置
            chunks.add(data.subList(i, end));  // 添加数据块
        }
        // 绑定聚合参数到作用域值
        return ScopedValue.where(aggregationParams, new AggregationParams(chunks, groupBy)).call(() -> {  // 绑定参数，然后执行
            // 使用结构化并发并行处理多个数据块
            try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {  // 创建结构化任务作用域
                var tasks = new ArrayList<StructuredTaskScope.Subtask<Map<String, Double>>>();  // 存储任务列表
                // 为每个数据块创建一个任务
                for (int i = 0; i < chunks.size(); i++) {  // 遍历数据块
                    final int chunkIndex = i;  // 捕获块索引
                    // Fork 一个任务来聚合这个数据块
                    var task = scope.fork(() -> aggregateChunk(chunkIndex));  // 并行聚合每个数据块
                    tasks.add(task);  // 添加到任务列表
                }
                scope.join();  // 等待所有任务完成
                scope.throwIfFailed();  // 检查是否有失败
                // 合并所有任务的结果
                Map<String, Double> result = new HashMap<>();  // 创建结果映射
                for (var task : tasks) {  // 遍历所有任务
                    Map<String, Double> chunkResult = task.get();  // 获取任务结果
                    // 合并结果
                    chunkResult.forEach((key, value) -> {  // 遍历任务结果
                        result.merge(key, value, Double::sum);  // 累加值
                    });
                }
                return result;  // 返回聚合结果
            }
        });
    }
    // 聚合一个数据块
    private Map<String, Double> aggregateChunk(int chunkIndex) {
        AggregationParams params = aggregationParams.get();  // 获取聚合参数
        List<Data> chunk = params.dataChunks().get(chunkIndex);  // 获取数据块
        // 按类别聚合
        return chunk.stream()  // 创建流
            .collect(Collectors.groupingBy(  // 按类别分组
                Data::category,  // 分组键：类别
                Collectors.summingDouble(Data::value)  // 聚合值：求和
            ));  // 返回聚合结果
    }
}
```

这玩意儿的好处是，既用了结构化并发并行处理多个数据块，又用了作用域值自动传递参数，代码更简洁，性能更好。

### 并发 IO 操作优化

并发 IO 操作是另一个重点，用虚拟线程和结构化并发可以大幅提升性能：

```java
import java.util.concurrent.StructuredTaskScope;  // 导入结构化并发
import java.util.concurrent.ScopedValue;  // 导入作用域值
import java.net.http.HttpClient;  // 导入 HTTP 客户端
import java.net.http.HttpRequest;  // 导入 HTTP 请求
import java.net.http.HttpResponse;  // 导入 HTTP 响应
import java.net.URI;  // 导入 URI 类
// 并发 IO 操作优化：虚拟线程 + 结构化并发 + 作用域值
public class ConcurrentIOOptimization {
    // 定义作用域值，用于传递请求上下文
    private static final ScopedValue<RequestContext> requestContext = ScopedValue.newInstance();  // 创建作用域值
    // 请求上下文记录
    record RequestContext(String userId, String traceId) {}  // 请求上下文，包含用户ID、追踪ID
    // HTTP 客户端（使用虚拟线程）
    private final HttpClient httpClient = HttpClient.newBuilder()  // 创建 HTTP 客户端
        .executor(java.util.concurrent.Executors.newVirtualThreadPerTaskExecutor())  // 使用虚拟线程执行器
        .build();  // 构建客户端
    // 并发获取多个资源：使用结构化并发和虚拟线程
    public Map<String, String> fetchResources(List<String> urls, String userId, String traceId) throws InterruptedException {
        // 绑定请求上下文到作用域值
        return ScopedValue.where(requestContext, new RequestContext(userId, traceId)).call(() -> {  // 绑定上下文，然后执行
            // 使用结构化并发并行获取多个资源
            try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {  // 创建结构化任务作用域
                var tasks = new HashMap<String, StructuredTaskScope.Subtask<String>>();  // 存储任务映射
                // 为每个 URL 创建一个任务
                for (String url : urls) {  // 遍历 URL 列表
                    // Fork 一个任务来获取这个资源
                    var task = scope.fork(() -> fetchResource(url));  // 并行获取每个资源
                    tasks.put(url, task);  // 添加到任务映射
                }
                scope.join();  // 等待所有任务完成
                scope.throwIfFailed();  // 检查是否有失败
                // 收集所有任务的结果
                Map<String, String> result = new HashMap<>();  // 创建结果映射
                tasks.forEach((url, task) -> {  // 遍历所有任务
                    try {
                        result.put(url, task.get());  // 获取任务结果
                    } catch (Exception e) {  // 处理异常
                        result.put(url, "Error: " + e.getMessage());  // 存储错误信息
                    }
                });
                return result;  // 返回结果
            }
        });
    }
    // 获取单个资源：使用虚拟线程和 HTTP 客户端
    private String fetchResource(String url) {
        RequestContext context = requestContext.get();  // 获取请求上下文
        try {
            // 创建 HTTP 请求
            HttpRequest request = HttpRequest.newBuilder()  // 创建请求构建器
                .uri(URI.create(url))  // 设置 URI
                .header("X-User-Id", context.userId())  // 添加用户ID头
                .header("X-Trace-Id", context.traceId())  // 添加追踪ID头
                .GET()  // 设置 GET 方法
                .build();  // 构建请求
            // 发送请求并获取响应
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());  // 发送请求
            // 记录日志（使用作用域值）
            logRequest(url, response.statusCode());  // 记录请求日志
            return response.body();  // 返回响应体
        } catch (Exception e) {  // 处理异常
            logError(url, e);  // 记录错误日志
            throw new RuntimeException("Failed to fetch resource: " + url, e);  // 抛出运行时异常
        }
    }
    // 记录请求日志
    private void logRequest(String url, int statusCode) {
        RequestContext context = requestContext.get();  // 获取请求上下文
        System.out.printf("[%s] %s: %s -> %d%n", context.traceId(), context.userId(), url, statusCode);  // 输出日志
    }
    // 记录错误日志
    private void logError(String url, Exception e) {
        RequestContext context = requestContext.get();  // 获取请求上下文
        System.err.printf("[%s] %s: %s -> Error: %s%n", context.traceId(), context.userId(), url, e.getMessage());  // 输出错误日志
    }
}
```

这玩意儿的好处是，既用了虚拟线程处理大量并发 IO，又用了结构化并发管理任务生命周期，还用作用域值自动传递上下文，代码更简洁，性能更好。

## JVM 调优实践

JVM 调优是性能优化的重要环节，Java 22 提供了很多新的调优选项。

### GC 调优

GC 调优是 JVM 调优的重点，Java 22 的 G1 GC 有很多改进：

```bash
# G1 GC 调优配置
# 适合大多数应用的配置
# 堆内存设置
-Xms4g              # 初始堆大小，设置为最大堆大小，避免动态调整
-Xmx4g              # 最大堆大小，根据应用内存需求设置
# G1 GC 配置
-XX:+UseG1GC        # 使用 G1 垃圾收集器
-XX:MaxGCPauseMillis=200    # 最大 GC 停顿时间目标（毫秒）
-XX:G1HeapRegionSize=16m    # G1 堆区域大小，默认会根据堆大小自动计算
# G1 GC 调优参数
-XX:InitiatingHeapOccupancyPercent=45    # 触发并发标记的堆占用百分比
-XX:ConcGCThreads=4                      # 并发 GC 线程数，通常设置为 CPU 核心数的 1/4
-XX:ParallelGCThreads=8                  # 并行 GC 线程数，通常设置为 CPU 核心数
# GC 日志配置
-Xlog:gc*:file=gc.log:time,uptime,level,tags    # 输出 GC 日志到文件
-XX:+PrintGCDetails                      # 打印详细 GC 信息（Java 22 推荐用 -Xlog）
# 性能监控
-XX:+HeapDumpOnOutOfMemoryError         # OOM 时自动生成堆转储
-XX:HeapDumpPath=/var/log/heapdump.hprof # 堆转储文件路径
-XX:+PrintCommandLineFlags               # 打印 JVM 参数
# 示例：启动应用
java -Xms4g -Xmx4g \
     -XX:+UseG1GC \
     -XX:MaxGCPauseMillis=200 \
     -XX:InitiatingHeapOccupancyPercent=45 \
     -Xlog:gc*:file=gc.log:time,uptime,level,tags \
     -XX:+HeapDumpOnOutOfMemoryError \
     -XX:HeapDumpPath=/var/log/heapdump.hprof \
     -jar application.jar
```

这玩意儿的关键是，得根据应用特点调整参数，别瞎搞。比如低延迟应用可以设置更小的停顿时间，高吞吐应用可以设置更大的堆。

### JIT 编译优化

JIT 编译优化也是重点，Java 22 的 JIT 编译器有很多优化：

```bash
# JIT 编译优化配置
# 适合需要极致性能的应用
# 编译器配置
-XX:+TieredCompilation           # 启用分层编译（默认启用）
-XX:TieredStopAtLevel=4          # 编译到最高级别（C2 编译器）
# C2 编译器优化
-XX:+AggressiveOpts              # 启用激进优化（Java 22 已废弃，但某些场景仍有用）
-XX:+UseStringDeduplication      # 启用字符串去重（G1 GC 特有）
# 内联优化
-XX:MaxInlineSize=35             # 方法内联的最大字节码大小
-XX:FreqInlineSize=325            # 热点方法内联的最大字节码大小
# 循环优化
-XX:+UnlockExperimentalVMOptions # 解锁实验性选项
-XX:+EnableVectorSupport          # 启用向量支持（向量 API 需要）
# 性能分析
-XX:+PrintCompilation            # 打印编译信息
-XX:+LogCompilation              # 记录编译日志
-XX:LogFile=compilation.log      # 编译日志文件
# 示例：启动应用
java -XX:+TieredCompilation \
     -XX:TieredStopAtLevel=4 \
     -XX:+UseStringDeduplication \
     -XX:+EnableVectorSupport \
     -jar application.jar
```

JIT 编译优化的关键是，得让代码充分预热，让 JIT 编译器有足够的时间优化热点代码。

## 性能监控和分析

性能监控和分析是性能优化的重要环节，得持续监控，找出瓶颈。

### 使用 JFR 监控性能

Java Flight Recorder (JFR) 是 Java 22 内置的性能监控工具：

```java
import jdk.jfr.*;  // 导入 JFR 包
// 使用 JFR 监控性能
public class PerformanceMonitoring {
    // 启用 JFR 事件
    @Label("数据处理")  // 事件标签
    @Description("监控数据处理性能")  // 事件描述
    static class DataProcessingEvent extends Event {  // 自定义事件
        @Label("数据大小")  // 字段标签
        int dataSize;  // 数据大小
        @Label("处理时间")  // 字段标签
        long processingTime;  // 处理时间（纳秒）
    }
    // 记录性能事件
    public void processData(int[] data) {
        DataProcessingEvent event = new DataProcessingEvent();  // 创建事件
        event.begin();  // 开始记录
        try {
            // 处理数据
            long startTime = System.nanoTime();  // 记录开始时间
            // ... 数据处理逻辑 ...
            long endTime = System.nanoTime();  // 记录结束时间
            // 设置事件字段
            event.dataSize = data.length;  // 设置数据大小
            event.processingTime = endTime - startTime;  // 设置处理时间
        } finally {
            event.end();  // 结束记录
            event.commit();  // 提交事件
        }
    }
}
```

```bash
# 启动应用时启用 JFR
java -XX:+FlightRecorder \
     -XX:StartFlightRecording=duration=60s,filename=recording.jfr \
     -jar application.jar
# 或者运行时开始录制
jcmd <pid> JFR.start duration=60s filename=recording.jfr
# 分析 JFR 记录
jfr print recording.jfr  # 打印事件
jfr summary recording.jfr  # 打印摘要
```

JFR 可以监控 CPU、内存、GC、线程、锁等各种性能指标，是性能分析的重要工具。

### 使用 JMH 进行基准测试

JMH (Java Microbenchmark Harness) 是 Java 基准测试的标准工具：

```java
import org.openjdk.jmh.annotations.*;  // 导入 JMH 注解
import java.util.concurrent.TimeUnit;  // 导入时间单位
// 使用 JMH 进行基准测试
@BenchmarkMode(Mode.AverageTime)  // 基准测试模式：平均时间
@OutputTimeUnit(TimeUnit.NANOSECONDS)  // 输出时间单位：纳秒
@State(Scope.Benchmark)  // 状态范围：基准测试级别
public class VectorAPIBenchmark {
    private float[] a;  // 数组 a
    private float[] b;  // 数组 b
    private float[] result;  // 结果数组
    private static final int SIZE = 10000;  // 数组大小
    // 设置基准测试数据
    @Setup
    public void setup() {
        a = new float[SIZE];  // 创建数组 a
        b = new float[SIZE];  // 创建数组 b
        result = new float[SIZE];  // 创建结果数组
        // 初始化数据
        for (int i = 0; i < SIZE; i++) {  // 遍历数组
            a[i] = i * 0.1f;  // 设置数组 a 的值
            b[i] = i * 0.2f;  // 设置数组 b 的值
        }
    }
    // 标量相加基准测试
    @Benchmark
    public void scalarAdd() {
        for (int i = 0; i < SIZE; i++) {  // 标量循环
            result[i] = a[i] + b[i];  // 标量相加
        }
    }
    // 向量相加基准测试
    @Benchmark
    public void vectorAdd() {
        // 使用向量 API 实现（代码省略）
        // ...
    }
}
```

```bash
# 编译基准测试
javac -cp jmh-core.jar:jmh-generator-annprocess.jar VectorAPIBenchmark.java
# 运行基准测试
java -cp .:jmh-core.jar org.openjdk.jmh.Main VectorAPIBenchmark
# 或者使用 Maven
mvn clean install
java -jar target/benchmarks.jar
```

JMH 可以准确测量代码性能，是性能优化的重要工具。

## 综合优化案例

最后，咱们来看一个综合优化案例，把前面说的所有技术都组合起来：

```java
import jdk.incubator.vector.*;  // 导入向量 API
import java.util.concurrent.StructuredTaskScope;  // 导入结构化并发
import java.util.concurrent.ScopedValue;  // 导入作用域值
import java.util.List;  // 导入列表类
import java.util.Map;  // 导入映射类
// 综合优化案例：实时数据分析系统
public class RealTimeDataAnalysis {
    // 定义作用域值，用于传递分析上下文
    private static final ScopedValue<AnalysisContext> analysisContext = ScopedValue.newInstance();  // 创建作用域值
    // 分析上下文记录
    record AnalysisContext(String userId, String sessionId, Map<String, Object> config) {}  // 分析上下文，包含用户ID、会话ID、配置
    // 实时数据分析：综合使用多种优化技术
    public AnalysisResult analyze(List<DataPoint> dataPoints, String userId, String sessionId) throws InterruptedException {
        // 绑定分析上下文到作用域值
        return ScopedValue.where(analysisContext, new AnalysisContext(userId, sessionId, getConfig())).call(() -> {  // 绑定上下文，然后执行
            // 第一步：数据预处理（使用向量 API 优化）
            float[] processedData = preprocessData(dataPoints);  // 预处理数据
            // 第二步：并行计算多个指标（使用结构化并发）
            try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {  // 创建结构化任务作用域
                // Fork 多个任务并行计算不同指标
                var meanTask = scope.fork(() -> calculateMean(processedData));  // 计算均值
                var varianceTask = scope.fork(() -> calculateVariance(processedData));  // 计算方差
                var trendTask = scope.fork(() -> calculateTrend(processedData));  // 计算趋势
                var anomalyTask = scope.fork(() -> detectAnomalies(processedData));  // 检测异常
                scope.join();  // 等待所有任务完成
                scope.throwIfFailed();  // 检查是否有失败
                // 收集所有任务的结果
                return new AnalysisResult(  // 创建分析结果
                    meanTask.get(),  // 获取均值
                    varianceTask.get(),  // 获取方差
                    trendTask.get(),  // 获取趋势
                    anomalyTask.get()  // 获取异常检测结果
                );
            }
        });
    }
    // 数据预处理：使用向量 API 优化
    private float[] preprocessData(List<DataPoint> dataPoints) {
        float[] data = new float[dataPoints.size()];  // 创建数据数组
        // 转换为数组
        for (int i = 0; i < dataPoints.size(); i++) {  // 遍历数据点
            data[i] = dataPoints.get(i).value();  // 提取值
        }
        // 使用向量 API 归一化
        VectorSpecies<Float> species = FloatVector.SPECIES_PREFERRED;  // 获取首选向量种类
        // 计算均值和标准差（使用向量 API）
        FloatVector sum = FloatVector.zero(species);  // 初始化和向量
        int i = 0;  // 循环索引
        // 向量化求和
        for (; i < species.loopBound(data.length); i += species.length()) {  // 向量化循环
            FloatVector v = FloatVector.fromArray(species, data, i);  // 加载向量
            sum = sum.add(v);  // 累加
        }
        // 计算均值
        float mean = sum.reduceLanes(VectorOperators.ADD) / data.length;  // 归约求和并计算均值
        // 处理剩余元素
        for (; i < data.length; i++) {  // 处理剩余部分
            mean += data[i] / data.length;  // 累加剩余元素
        }
        // 计算标准差（使用向量 API）
        FloatVector sumSquared = FloatVector.zero(species);  // 初始化和平方向量
        i = 0;  // 重置索引
        // 向量化计算平方差
        for (; i < species.loopBound(data.length); i += species.length()) {  // 向量化循环
            FloatVector v = FloatVector.fromArray(species, data, i);  // 加载向量
            FloatVector diff = v.sub(mean);  // 计算差值
            sumSquared = sumSquared.add(diff.mul(diff));  // 累加平方差
        }
        // 计算标准差
        float variance = sumSquared.reduceLanes(VectorOperators.ADD) / data.length;  // 归约求和并计算方差
        float stdDev = (float) Math.sqrt(variance);  // 计算标准差
        // 归一化数据（使用向量 API）
        i = 0;  // 重置索引
        for (; i < species.loopBound(data.length); i += species.length()) {  // 向量化循环
            FloatVector v = FloatVector.fromArray(species, data, i);  // 加载向量
            FloatVector normalized = v.sub(mean).div(stdDev);  // 归一化：(x - mean) / stdDev
            normalized.intoArray(data, i);  // 写回数组
        }
        // 处理剩余元素
        for (; i < data.length; i++) {  // 处理剩余部分
            data[i] = (data[i] - mean) / stdDev;  // 归一化剩余元素
        }
        return data;  // 返回预处理后的数据
    }
    // 计算均值：使用向量 API 优化
    private double calculateMean(float[] data) {
        VectorSpecies<Float> species = FloatVector.SPECIES_PREFERRED;  // 获取首选向量种类
        FloatVector sum = FloatVector.zero(species);  // 初始化和向量
        int i = 0;  // 循环索引
        // 向量化求和
        for (; i < species.loopBound(data.length); i += species.length()) {  // 向量化循环
            FloatVector v = FloatVector.fromArray(species, data, i);  // 加载向量
            sum = sum.add(v);  // 累加
        }
        // 归约求和
        float result = sum.reduceLanes(VectorOperators.ADD);  // 归约求和
        // 处理剩余元素
        for (; i < data.length; i++) {  // 处理剩余部分
            result += data[i];  // 累加剩余元素
        }
        return result / data.length;  // 返回均值
    }
    // 计算方差：使用向量 API 优化
    private double calculateVariance(float[] data) {
        double mean = calculateMean(data);  // 计算均值
        VectorSpecies<Float> species = FloatVector.SPECIES_PREFERRED;  // 获取首选向量种类
        FloatVector sumSquared = FloatVector.zero(species);  // 初始化和平方向量
        int i = 0;  // 循环索引
        // 向量化计算平方差
        for (; i < species.loopBound(data.length); i += species.length()) {  // 向量化循环
            FloatVector v = FloatVector.fromArray(species, data, i);  // 加载向量
            FloatVector diff = v.sub((float) mean);  // 计算差值
            sumSquared = sumSquared.add(diff.mul(diff));  // 累加平方差
        }
        // 归约求和
        float result = sumSquared.reduceLanes(VectorOperators.ADD);  // 归约求和
        // 处理剩余元素
        for (; i < data.length; i++) {  // 处理剩余部分
            float diff = data[i] - (float) mean;  // 计算差值
            result += diff * diff;  // 累加平方差
        }
        return result / data.length;  // 返回方差
    }
    // 计算趋势：使用向量 API 优化
    private Trend calculateTrend(float[] data) {
        // 使用线性回归计算趋势（简化版）
        VectorSpecies<Float> species = FloatVector.SPECIES_PREFERRED;  // 获取首选向量种类
        int n = data.length;  // 数据点数量
        // 计算斜率和截距（使用向量 API 优化）
        // ... 实现细节省略 ...
        return new Trend(0.0, 0.0);  // 返回趋势（简化）
    }
    // 检测异常：使用向量 API 优化
    private List<Integer> detectAnomalies(float[] data) {
        double mean = calculateMean(data);  // 计算均值
        double stdDev = Math.sqrt(calculateVariance(data));  // 计算标准差
        double threshold = mean + 3 * stdDev;  // 异常阈值（3 倍标准差）
        List<Integer> anomalies = new ArrayList<>();  // 创建异常列表
        // 检测异常点
        for (int i = 0; i < data.length; i++) {  // 遍历数据
            if (Math.abs(data[i] - mean) > threshold) {  // 检查是否异常
                anomalies.add(i);  // 添加异常索引
            }
        }
        return anomalies;  // 返回异常列表
    }
    // 获取配置
    private Map<String, Object> getConfig() {
        AnalysisContext context = analysisContext.get();  // 获取分析上下文
        // 根据上下文返回配置
        return Map.of("threshold", 3.0, "windowSize", 100);  // 返回配置（简化）
    }
    // 数据点记录
    record DataPoint(long timestamp, float value) {}  // 数据点，包含时间戳、值
    // 分析结果记录
    record AnalysisResult(double mean, double variance, Trend trend, List<Integer> anomalies) {}  // 分析结果，包含均值、方差、趋势、异常
    // 趋势记录
    record Trend(double slope, double intercept) {}  // 趋势，包含斜率、截距
}
```

这个综合案例把向量 API、结构化并发、作用域值都组合起来了，既优化了数值计算，又优化了并发性能，还优化了代码结构，效果贼好。

## 总结

Java 22 的性能优化综合实践，核心就是把各种优化技术组合起来用。单一技术虽然好，但组合起来用效果才最明显：

1. **数值计算优化**：用向量 API 充分利用 CPU 的 SIMD 能力，性能提升几倍甚至几十倍
2. **并发性能优化**：用结构化并发管理任务生命周期，用作用域值传递上下文，代码更简洁，性能更好
3. **JVM 调优**：根据应用特点调整 GC 参数、JIT 参数，持续监控和调优
4. **性能监控**：用 JFR 监控性能，用 JMH 进行基准测试，持续找出瓶颈
5. **综合应用**：把各种技术组合起来，针对具体场景优化，效果最明显

性能优化不是一次性的，得持续监控、持续调优。而且得根据实际场景选择合适的技术，别瞎搞。Java 22 提供了很多新工具，但怎么用、什么时候用、怎么组合用，这才是关键。

兄弟们，今天就聊到这里。性能优化这玩意儿，得结合实战经验，持续学习，持续优化。有啥问题欢迎留言讨论，鹏磊会继续分享 Java 22 的其他新特性。
