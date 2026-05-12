# 19、JDK 17 新特性：JDK 17 性能优化：JVM 性能调优与最佳实践
- 来源：https://ddkk.com/zhuanlan/java/java17/19.html
- 分类：JDK 17 新特性
- 分组：教程目录
- 日期：2025-11-28
JVM 性能调优，鹏磊最烦的就是参数太多，不知道从哪开始。堆内存、GC、JIT 编译、代码缓存，每个都有很多参数，调不好反而性能下降。这篇文章就给你整一个完整的 JVM 性能调优指南，从基础到进阶，帮你把应用性能调上去。

JVM 性能调优是应用性能优化的关键，需要根据应用特点调整堆内存、GC、JIT 编译等参数。这玩意儿虽然参数多，但掌握了规律就能事半功倍。建议先了解应用特点，然后逐步调优，持续监控，找到最佳配置。

## 堆内存调优

堆内存是 JVM 性能调优的基础：

### 设置堆大小

设置合适的堆大小很重要：

```bash
# 设置初始堆大小和最大堆大小
-Xms8g -Xmx8g
# 建议初始堆大小和最大堆大小相同
# 避免堆大小动态调整带来的性能开销
# 示例：8GB 堆内存
java -Xms8g -Xmx8g MyApp
```

设置合适的堆大小能提升性能。

### MaxRAMPercentage

设置堆内存占系统内存的百分比：

```bash
# 设置堆内存占系统内存的 75%
-XX:MaxRAMPercentage=75
# 适用于容器环境
# 让 JVM 根据容器内存自动调整堆大小
```

`MaxRAMPercentage` 适用于容器环境，让 JVM 自动调整堆大小。

### MinRAMPercentage

设置小堆内存占系统内存的百分比：

```bash
# 设置小堆内存占系统内存的 75%
-XX:MinRAMPercentage=75
# 适用于小堆场景（约 125MB）
```

`MinRAMPercentage` 适用于小堆场景。

### MaxHeapFreeRatio 和 MinHeapFreeRatio

控制堆内存的释放策略：

```bash
# 设置堆内存释放比例
-XX:MaxHeapFreeRatio=10
-XX:MinHeapFreeRatio=5
# 默认值：MaxHeapFreeRatio=70, MinHeapFreeRatio=40
# 降低这些值可以减小堆大小，但可能影响性能
# 需要根据实际情况调整
```

调整堆内存释放比例能减小内存占用。

## GC 调优

GC 调优是 JVM 性能调优的重点：

### 选择合适的 GC

根据应用特点选择合适的 GC：

```bash
# 高吞吐量应用：使用 Parallel GC
-XX:+UseParallelGC
# 低延迟应用：使用 G1 GC
-XX:+UseG1GC -XX:MaxGCPauseMillis=100
# 极低延迟应用：使用 ZGC
-XX:+UseZGC
# 极低延迟应用：使用 Shenandoah
-XX:+UseShenandoahGC
```

选择合适的 GC 能提升性能。

### G1 GC 调优

G1 GC 的调优参数：

```bash
# G1 GC 调优示例
java -XX:+UseG1GC \
     -XX:MaxGCPauseMillis=100 \
     -XX:G1HeapRegionSize=16m \
     -XX:G1ReservePercent=20 \
     -XX:InitiatingHeapOccupancyPercent=45 \
     MyApp
```

G1 GC 的调优参数能帮你优化性能。

### ZGC 调优

ZGC 的调优参数：

```bash
# ZGC 调优示例
java -XX:+UseZGC \
     -XX:ZCollectionInterval=5 \
     -XX:ZFragmentationLimit=25 \
     -XX:+ZProactive \
     -XX:+ZUncommit \
     MyApp
```

ZGC 的调优参数能帮你优化性能。

## JIT 编译优化

JIT 编译优化能提升代码执行性能：

### 启用分层编译

分层编译是默认启用的：

```bash
# 分层编译（默认启用）
-XX:+TieredCompilation
# 禁用分层编译
-XX:-TieredCompilation
```

分层编译能提升启动和运行性能。

### 方法内联

方法内联是重要的优化：

```bash
# 启用方法内联（默认启用）
-XX:+Inline
# 设置内联大小限制
-XX:MaxInlineSize=35
-XX:FreqInlineSize=325
-XX:InlineSmallCode=1000
```

方法内联能减少方法调用开销。

### 逃逸分析

逃逸分析能优化对象分配：

```bash
# 启用逃逸分析（默认启用）
-XX:+DoEscapeAnalysis
# 禁用逃逸分析
-XX:-DoEscapeAnalysis
```

逃逸分析能优化对象分配，减少 GC 压力。

## 代码缓存优化

代码缓存优化能提升 JIT 编译性能：

### 设置代码缓存大小

设置合适的代码缓存大小：

```bash
# 设置初始代码缓存大小
-XX:InitialCodeCacheSize=32m
# 设置最大代码缓存大小
-XX:ReservedCodeCacheSize=256m
# 代码缓存用于存储编译后的代码
# 大小不足会导致代码被去优化
```

设置合适的代码缓存大小能提升性能。

### 分段代码缓存

分段代码缓存能提升代码缓存利用率：

```bash
# 启用分段代码缓存（默认启用）
-XX:+SegmentedCodeCache
# 设置各段大小
-XX:NonNMethodCodeHeapSize=5m
-XX:NonProfiledCodeHeapSize=120m
-XX:ProfiledCodeHeapSize=120m
```

分段代码缓存能提升代码缓存利用率。

## 实际应用：高吞吐量应用

高吞吐量应用的调优：

```bash
# 高吞吐量应用配置
java -server \
     -XX:+UseParallelGC \
     -XX:+UseLargePages \
     -Xmn10g \
     -Xms26g \
     -Xmx26g \
     -XX:MaxHeapFreeRatio=10 \
     -XX:MinHeapFreeRatio=5 \
     MyApp
```

高吞吐量应用用 Parallel GC，堆内存设置大一些。

## 实际应用：低延迟应用

低延迟应用的调优：

```bash
# 低延迟应用配置
java -XX:+UseG1GC \
     -XX:MaxGCPauseMillis=100 \
     -Xms8g \
     -Xmx8g \
     -XX:+UseStringDeduplication \
     MyApp
```

低延迟应用用 G1 GC，设置最大停顿时间。

## 实际应用：容器环境

容器环境的调优：

```bash
# 容器环境配置
java -XX:MaxRAMPercentage=75 \
     -XX:MinRAMPercentage=50 \
     -XX:+UseContainerSupport \
     -XX:+UseG1GC \
     -XX:MaxGCPauseMillis=200 \
     MyApp
```

容器环境用 MaxRAMPercentage，让 JVM 自动调整。

## 性能监控

性能监控是调优的基础：

```java
import java.lang.management.*;
import java.util.*;
// 性能监控示例
public class PerformanceMonitoring {
    public static void main(String[] args) {
        // 获取运行时信息
        RuntimeMXBean runtimeBean = ManagementFactory.getRuntimeMXBean();  // 获取运行时 Bean
        System.out.println("JVM 名称: " + runtimeBean.getVmName());  // 输出 JVM 名称
        System.out.println("JVM 版本: " + runtimeBean.getVmVersion());  // 输出 JVM 版本
        // 获取内存信息
        MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();  // 获取内存 Bean
        MemoryUsage heapUsage = memoryBean.getHeapMemoryUsage();  // 获取堆内存使用情况
        System.out.println("堆内存使用: " + heapUsage.getUsed() / 1024 / 1024 + " MB");  // 输出堆内存使用
        System.out.println("堆内存最大: " + heapUsage.getMax() / 1024 / 1024 + " MB");  // 输出堆内存最大
        // 获取 GC 信息
        List<GarbageCollectorMXBean> gcBeans = ManagementFactory.getGarbageCollectorMXBeans();  // 获取 GC Bean
        for (GarbageCollectorMXBean gcBean : gcBeans) {
            System.out.println("GC 名称: " + gcBean.getName());  // 输出 GC 名称
            System.out.println("收集次数: " + gcBean.getCollectionCount());  // 输出收集次数
            System.out.println("收集时间: " + gcBean.getCollectionTime() + " ms");  // 输出收集时间
        }
        // 获取编译信息
        CompilationMXBean compBean = ManagementFactory.getCompilationMXBean();  // 获取编译 Bean
        if (compBean.isCompilationTimeMonitoringSupported()) {
            System.out.println("编译时间: " + compBean.getTotalCompilationTime() + " ms");  // 输出编译时间
        }
    }
}
```

性能监控能帮你了解 JVM 的工作情况。

## GC 日志

GC 日志是调优的重要工具：

```bash
# 启用 GC 日志
-XX:+PrintGCDetails
-XX:+PrintGCDateStamps
-Xlog:gc*:file=gc.log:time,level,tags
# 使用统一日志框架（JDK 17 推荐）
-Xlog:gc*:file=gc.log:time,level,tags:filecount=5,filesize=10M
# 分析 GC 日志能帮你了解 GC 的工作情况
# 找出性能瓶颈
```

GC 日志能帮你分析 GC 性能。

## 性能分析工具

性能分析工具能帮你找出性能瓶颈：

```bash
# 使用 jstat 监控 GC
jstat -gc <pid> 1000
# 使用 jmap 生成堆转储
jmap -dump:format=b,file=heap.hprof <pid>
# 使用 jstack 查看线程栈
jstack <pid>
# 使用 VisualVM 或 JProfiler 进行性能分析
```

性能分析工具能帮你找出性能瓶颈。

## 调优流程

调优流程能帮你系统化地调优：

```java
// 调优流程
// 1. 了解应用特点
//    - 吞吐量优先还是延迟优先
//    - 内存使用模式
//    - GC 频率和停顿时间
//
// 2. 设置基础参数
//    - 堆内存大小
//    - GC 选择
//    - JIT 编译选项
//
// 3. 运行应用并监控
//    - GC 日志
//    - 性能指标
//    - 资源使用
//
// 4. 分析数据
//    - GC 频率和停顿时间
//    - 内存使用情况
//    - CPU 使用情况
//
// 5. 调整参数
//    - 根据分析结果调整
//    - 逐步优化
//    - 记录最佳配置
//
// 6. 重复步骤 3-5
//    - 持续优化
//    - 直到达到目标
```

调优流程能帮你系统化地调优。

## 注意事项

### 注意事项一：不要过度调优

过度调优可能适得其反：

```bash
# 过度调优
# 1. 参数太多，难以维护
# 2. 可能引入新的问题
# 3. 不同环境需要不同配置
# 4. 建议使用默认值，只在必要时调整
```

不要过度调优，使用默认值，只在必要时调整。

### 注意事项二：测试验证

调优后要测试验证：

```java
// 测试验证
// 1. 功能测试：确保功能正常
// 2. 性能测试：验证性能提升
// 3. 压力测试：验证稳定性
// 4. 长期运行：验证稳定性
```

调优后要测试验证，确保功能正常和性能提升。

### 注意事项三：文档记录

记录调优过程和结果：

```java
// 文档记录
// 1. 记录调优前的性能指标
// 2. 记录调优的参数
// 3. 记录调优后的性能指标
// 4. 记录问题和解决方案
```

记录调优过程和结果，方便后续维护。

## 最佳实践

### 最佳实践一：从默认值开始

从默认值开始，逐步调优：

```bash
# 从默认值开始
# 1. 使用默认 GC（G1）
# 2. 使用默认堆内存设置
# 3. 使用默认 JIT 编译选项
# 4. 只在必要时调整
```

从默认值开始，逐步调优。

### 最佳实践二：监控优先

先监控，再调优：

```java
// 监控优先
// 1. 先启用监控
// 2. 收集性能数据
// 3. 分析性能瓶颈
// 4. 针对性调优
```

先监控，再调优，避免盲目调优。

### 最佳实践三：持续优化

性能调优是持续的过程：

```java
// 持续优化
// 1. 定期监控性能
// 2. 分析性能趋势
// 3. 及时调整参数
// 4. 记录优化效果
```

持续优化，保持应用性能。

## 总结

JVM 性能调优是应用性能优化的关键，需要根据应用特点调整堆内存、GC、JIT 编译等参数。这玩意儿虽然参数多，但掌握了规律就能事半功倍。建议从默认值开始，逐步调优，持续监控，找到最佳配置。

建议在实际项目中建立性能监控体系，定期分析性能数据，及时调整参数。虽然调优可能需要一些时间，但能让应用性能提升明显。下一篇文章咱就聊聊 JDK 17 迁移指南，看看怎么从 JDK 8/11 升级。兄弟们有啥问题随时问，鹏磊会尽量解答。
