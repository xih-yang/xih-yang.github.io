# 18、JDK 17 新特性：JDK 17 性能优化：ZGC 和 Shenandoah 垃圾回收器的增强
- 来源：https://ddkk.com/zhuanlan/java/java17/18.html
- 分类：JDK 17 新特性
- 分组：教程目录
- 日期：2025-11-28
垃圾回收器的性能，鹏磊最烦的就是停顿时间。以前用 G1，停顿时间虽然可控，但还是不够理想。特别是大堆内存的应用，停顿时间可能达到几百毫秒，影响用户体验。JDK 17 对 ZGC 和 Shenandoah 这两个低延迟垃圾回收器做了不少增强，停顿时间能控制在几毫秒以内，性能提升明显。

ZGC 和 Shenandoah 是 JDK 17 中的两个低延迟垃圾回收器，停顿时间能控制在几毫秒以内，适合对延迟敏感的应用。ZGC 支持超大堆（最大 16TB），停顿时间与堆大小无关；Shenandoah 也是低延迟，支持压缩指针。这玩意儿对于实时应用、游戏服务器、金融交易系统这些对延迟敏感的场景特别有用，性能提升明显。

## 什么是 ZGC

ZGC（Z Garbage Collector）是 Oracle 开发的低延迟垃圾回收器，主要特点：

1. **低延迟**：停顿时间控制在几毫秒以内
2. **大堆支持**：支持 8MB 到 16TB 的堆大小
3. **停顿时间独立**：停顿时间与堆大小无关
4. **并发回收**：大部分工作并发执行，不暂停应用

```java
// ZGC 的特点
// 1. 低延迟：停顿时间控制在几毫秒以内
// 2. 大堆支持：支持 8MB 到 16TB 的堆大小
// 3. 停顿时间独立：停顿时间与堆大小无关
// 4. 并发回收：大部分工作并发执行
```

ZGC 是低延迟垃圾回收器，适合对延迟敏感的应用。

## 什么是 Shenandoah

Shenandoah 是 Red Hat 开发的低延迟垃圾回收器，主要特点：

1. **低延迟**：停顿时间控制在几毫秒以内
2. **并发回收**：大部分工作并发执行
3. **压缩指针支持**：支持压缩指针，节省内存
4. **停顿时间独立**：停顿时间与堆大小无关

```java
// Shenandoah 的特点
// 1. 低延迟：停顿时间控制在几毫秒以内
// 2. 并发回收：大部分工作并发执行
// 3. 压缩指针支持：支持压缩指针
// 4. 停顿时间独立：停顿时间与堆大小无关
```

Shenandoah 也是低延迟垃圾回收器，适合对延迟敏感的应用。

## 启用 ZGC

启用 ZGC 很简单，只需要一个 JVM 参数：

```bash
# 启用 ZGC
java -XX:+UseZGC -Xmx4g MyApp
# 完整示例
java -XX:+UseZGC \
     -Xmx8g \
     -Xms8g \
     -XX:+UnlockExperimentalVMOptions \
     MyApp
```

启用 ZGC 只需要一个参数，配置简单。

## ZGC 配置选项

ZGC 提供了多个配置选项：

```bash
# ZGC 配置选项示例
java -XX:+UseZGC \
     -Xmx8g \
     -XX:ZCollectionInterval=5 \
     -XX:ZFragmentationLimit=25 \
     -XX:+ZProactive \
     -XX:+ZUncommit \
     -XX:ZUncommitDelay=300 \
     MyApp
```

ZGC 的配置选项能帮你优化性能。

### ZCollectionInterval

设置 GC 循环的最大间隔：

```bash
# 设置 GC 循环间隔为 5 秒
-XX:ZCollectionInterval=5
# 默认值为 0（禁用）
# 设置后，ZGC 会定期执行 GC 循环
```

`ZCollectionInterval` 能控制 GC 的执行频率。

### ZFragmentationLimit

设置堆碎片的最大百分比：

```bash
# 设置堆碎片限制为 20%
-XX:ZFragmentationLimit=20
# 默认值为 25%
# 较低的值会导致更积极的压缩，回收更多内存，但消耗更多 CPU
```

`ZFragmentationLimit` 能控制堆碎片。

### ZProactive

启用主动 GC 循环：

```bash
# 启用主动 GC 循环（默认启用）
-XX:+ZProactive
# 禁用主动 GC 循环
-XX:-ZProactive
# 主动 GC 循环在应用空闲时执行，保持堆大小较小
```

`ZProactive` 能在应用空闲时执行 GC。

### ZUncommit

启用未使用堆内存的释放：

```bash
# 启用未使用堆内存的释放（默认启用）
-XX:+ZUncommit
# 禁用未使用堆内存的释放
-XX:-ZUncommit
# 释放未使用的堆内存能降低 JVM 的内存占用
```

`ZUncommit` 能释放未使用的堆内存。

### ZUncommitDelay

设置未使用堆内存释放的延迟时间：

```bash
# 设置延迟时间为 300 秒（5 分钟）
-XX:ZUncommitDelay=300
# 默认值为 300 秒
# 较低的值会导致更早释放内存，但可能很快又要重新分配
```

`ZUncommitDelay` 能控制内存释放的时机。

## 启用 Shenandoah

启用 Shenandoah 也很简单：

```bash
# 启用 Shenandoah
java -XX:+UseShenandoahGC -Xmx4g MyApp
# 完整示例
java -XX:+UseShenandoahGC \
     -Xmx8g \
     -Xms8g \
     MyApp
```

启用 Shenandoah 只需要一个参数，配置简单。

## Shenandoah 配置选项

Shenandoah 也提供了多个配置选项：

```bash
# Shenandoah 配置选项示例
java -XX:+UseShenandoahGC \
     -Xmx8g \
     -XX:ShenandoahGCMode=satb \
     -XX:ShenandoahGCHeuristics=adaptive \
     MyApp
```

Shenandoah 的配置选项能帮你优化性能。

### ShenandoahGCMode

设置 Shenandoah 的 GC 模式：

```bash
# 设置 GC 模式为 satb（默认）
-XX:ShenandoahGCMode=satb
# 其他模式：
# - satb: Snapshot-At-The-Beginning 模式
# - generational: 分代模式（JDK 17 新增）
```

`ShenandoahGCMode` 能选择不同的 GC 模式。

### ShenandoahGCHeuristics

设置 Shenandoah 的启发式算法：

```bash
# 设置启发式算法为 adaptive（默认）
-XX:ShenandoahGCHeuristics=adaptive
# 其他选项：
# - adaptive: 自适应模式
# - static: 静态模式
# - compact: 压缩模式
# - aggressive: 激进模式
```

`ShenandoahGCHeuristics` 能选择不同的启发式算法。

## 性能对比

性能对比能看出 ZGC 和 Shenandoah 的优势：

```java
import java.util.*;
// 性能测试示例
public class GCPerformanceTest {
    public static void main(String[] args) {
        int iterations = 10_000_000;  // 1000 万次迭代
        List<Object> list = new ArrayList<>();  // 对象列表
        long start = System.nanoTime();  // 开始时间
        // 创建大量对象
        for (int i = 0; i < iterations; i++) {
            list.add(new Object());  // 创建对象
            // 定期清理，模拟 GC
            if (i % 1000 == 0) {
                list.removeIf(obj -> Math.random() < 0.5);  // 随机删除
            }
        }
        long time = System.nanoTime() - start;  // 计算时间
        System.out.println("执行时间: " + time / 1_000_000 + " ms");  // 输出时间
        System.out.println("对象数量: " + list.size());  // 输出对象数量
        // 使用 ZGC 或 Shenandoah 后，停顿时间明显减少
        // 特别是在大堆内存的情况下，性能提升更明显
    }
}
```

使用 ZGC 或 Shenandoah 后，停顿时间明显减少，性能提升明显。

## 实际应用：实时应用

实时应用对延迟要求特别高：

```bash
# 实时应用配置示例
java -XX:+UseZGC \
     -Xmx16g \
     -Xms16g \
     -XX:ZCollectionInterval=10 \
     -XX:ZFragmentationLimit=20 \
     -XX:+ZProactive \
     -XX:+ZUncommit \
     -XX:ZUncommitDelay=600 \
     -XX:+PrintGCDetails \
     -XX:+PrintGCDateStamps \
     RealTimeApp
```

实时应用用 ZGC，停顿时间控制在几毫秒以内。

## 实际应用：游戏服务器

游戏服务器也需要低延迟：

```bash
# 游戏服务器配置示例
java -XX:+UseShenandoahGC \
     -Xmx8g \
     -Xms8g \
     -XX:ShenandoahGCMode=satb \
     -XX:ShenandoahGCHeuristics=adaptive \
     -XX:+PrintGCDetails \
     -XX:+PrintGCDateStamps \
     GameServer
```

游戏服务器用 Shenandoah，延迟低，体验好。

## 实际应用：金融交易系统

金融交易系统对延迟要求极高：

```bash
# 金融交易系统配置示例
java -XX:+UseZGC \
     -Xmx32g \
     -Xms32g \
     -XX:ZCollectionInterval=5 \
     -XX:ZFragmentationLimit=15 \
     -XX:+ZProactive \
     -XX:+ZUncommit \
     -XX:ZUncommitDelay=300 \
     -XX:+PrintGCDetails \
     -XX:+PrintGCDateStamps \
     TradingSystem
```

金融交易系统用 ZGC，停顿时间极短，满足实时性要求。

## 监控 GC 性能

监控 GC 性能很重要：

```java
import java.lang.management.*;
import java.util.*;
// 监控 GC 性能
public class GCMonitoring {
    public static void main(String[] args) {
        // 获取所有 GC MXBean
        List<GarbageCollectorMXBean> gcBeans = ManagementFactory.getGarbageCollectorMXBeans();  // 获取 GC Bean
        for (GarbageCollectorMXBean gcBean : gcBeans) {
            System.out.println("GC 名称: " + gcBean.getName());  // 输出 GC 名称
            System.out.println("收集次数: " + gcBean.getCollectionCount());  // 输出收集次数
            System.out.println("收集时间: " + gcBean.getCollectionTime() + " ms");  // 输出收集时间
            // 获取内存池信息
            String[] memoryPoolNames = gcBean.getMemoryPoolNames();  // 获取内存池名称
            for (String poolName : memoryPoolNames) {
                System.out.println("  内存池: " + poolName);  // 输出内存池名称
            }
        }
        // 获取堆内存信息
        MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();  // 获取内存 Bean
        MemoryUsage heapUsage = memoryBean.getHeapMemoryUsage();  // 获取堆内存使用情况
        System.out.println("堆内存使用: " + heapUsage.getUsed() / 1024 / 1024 + " MB");  // 输出堆内存使用
        System.out.println("堆内存最大: " + heapUsage.getMax() / 1024 / 1024 + " MB");  // 输出堆内存最大
    }
}
```

监控 GC 性能能帮你了解 GC 的工作情况。

## 性能调优建议

### 建议一：选择合适的 GC

根据应用特点选择合适的 GC：

```bash
# 低延迟应用：使用 ZGC 或 Shenandoah
-XX:+UseZGC
# 或
-XX:+UseShenandoahGC
# 高吞吐量应用：使用 G1 或 Parallel GC
-XX:+UseG1GC
# 或
-XX:+UseParallelGC
```

选择合适的 GC 能提升性能。

### 建议二：设置合适的堆大小

设置合适的堆大小：

```bash
# 设置初始堆大小和最大堆大小
-Xms8g -Xmx8g
# 建议初始堆大小和最大堆大小相同
# 避免堆大小动态调整带来的性能开销
```

设置合适的堆大小能提升性能。

### 建议三：启用 GC 日志

启用 GC 日志便于分析：

```bash
# 启用 GC 日志
-XX:+PrintGCDetails
-XX:+PrintGCDateStamps
-Xlog:gc*:file=gc.log:time,level,tags
# 分析 GC 日志能帮你了解 GC 的工作情况
# 找出性能瓶颈
```

启用 GC 日志便于分析性能。

## 注意事项

### 注意事项一：CPU 使用

ZGC 和 Shenandoah 可能增加 CPU 使用：

```bash
# CPU 使用
# ZGC 和 Shenandoah 是并发回收器
# 会使用额外的 CPU 资源进行并发回收
# 需要确保有足够的 CPU 资源
```

ZGC 和 Shenandoah 可能增加 CPU 使用，需要确保有足够的 CPU 资源。

### 注意事项二：内存使用

ZGC 和 Shenandoah 可能增加内存使用：

```bash
# 内存使用
# ZGC 和 Shenandoah 需要额外的内存用于并发回收
# 建议堆大小至少是应用实际使用的 2 倍
```

ZGC 和 Shenandoah 可能增加内存使用，需要确保有足够的内存。

### 注意事项三：平台支持

ZGC 和 Shenandoah 的平台支持不同：

```bash
# 平台支持
# ZGC: Linux/x64, macOS/x64, macOS/AArch64, Windows/x64
# Shenandoah: Linux/x64, Linux/AArch64, Linux/PPC64le
# 需要根据平台选择合适的 GC
```

ZGC 和 Shenandoah 的平台支持不同，需要根据平台选择。

## 最佳实践

### 最佳实践一：测试不同 GC

测试不同 GC 的性能：

```bash
# 测试不同 GC
# 1. 使用 G1（默认）
java -XX:+UseG1GC -Xmx8g MyApp
# 2. 使用 ZGC
java -XX:+UseZGC -Xmx8g MyApp
# 3. 使用 Shenandoah
java -XX:+UseShenandoahGC -Xmx8g MyApp
# 对比性能，选择最适合的 GC
```

测试不同 GC 的性能，选择最适合的。

### 最佳实践二：监控 GC 性能

持续监控 GC 性能：

```java
// 监控 GC 性能
// 1. 使用 JMX 监控
// 2. 使用 GC 日志分析
// 3. 使用性能分析工具
// 4. 定期检查 GC 指标
```

持续监控 GC 性能，及时发现问题。

### 最佳实践三：调优 GC 参数

根据实际情况调优 GC 参数：

```bash
# 调优 GC 参数
# 1. 根据应用特点调整参数
# 2. 根据监控数据优化
# 3. 逐步调整，观察效果
# 4. 记录最佳配置
```

根据实际情况调优 GC 参数，提升性能。

## 总结

ZGC 和 Shenandoah 是 JDK 17 中的两个低延迟垃圾回收器，停顿时间能控制在几毫秒以内，适合对延迟敏感的应用。这玩意儿对于实时应用、游戏服务器、金融交易系统这些对延迟敏感的场景特别有用，性能提升明显。

建议在实际项目中根据应用特点选择合适的 GC，并持续监控和调优。虽然配置可能需要一些工作，但能让应用性能提升明显。下一篇文章咱就聊聊 JDK 17 性能优化，看看 JVM 性能调优与最佳实践。兄弟们有啥问题随时问，鹏磊会尽量解答。
