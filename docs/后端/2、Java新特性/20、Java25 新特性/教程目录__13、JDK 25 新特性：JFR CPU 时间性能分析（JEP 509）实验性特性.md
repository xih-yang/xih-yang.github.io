# 13、JDK 25 新特性：JFR CPU 时间性能分析（JEP 509）实验性特性
- 来源：https://ddkk.com/zhuanlan/java/java25/13.html
- 分类：JDK 25 新特性
- 分组：教程目录
- 日期：2025-11-27
晚上十点，服务器 CPU 使用率突然飙升到 90%，报警响个不停。鹏磊我赶紧连上去看，用 JFR 录了一段数据，分析完发现 `jdk.ExecutionSample` 事件显示的方法执行时间加起来只有 30%，剩下的 60% CPU 时间去哪了？查了半天才发现，应用调用了很多原生方法（Native Methods），这些时间 JFR 没记录到，因为传统的执行采样只采样 Java 代码，不采样原生代码。

这就是 JEP 509 要解决的问题。JDK 25 里新增了 `jdk.CPUTimeSample` 事件，能记录包括原生代码在内的 CPU 时间，不管方法是在 Java 代码里执行还是在原生代码里执行，都能被采样到。这对那些大量使用原生方法的应用特别有用，比如用 FFM API 调用 C 库的应用，或者用 JNI 调用原生库的应用。

这个特性目前还是实验性的，只在 Linux 系统上可用，其他平台暂时不支持。因为是实验性的，行为可能会变，生产环境用的时候要谨慎点。但如果你在 Linux 上做性能分析，特别是那些有原生代码调用的应用，这个特性还是挺有用的。

## 传统执行采样的局限性

先说说传统执行采样是咋回事吧。JFR 的 `jdk.ExecutionSample` 事件会定期采样线程的调用栈，看线程在执行啥方法，然后根据采样次数估算方法执行时间。这听起来挺合理的，但实际上有个大问题：它只采样 Java 代码，不采样原生代码。

啥意思呢？比如你的 Java 方法调用了原生方法，原生方法执行了 100 毫秒，但 `jdk.ExecutionSample` 只能看到 Java 方法，看不到原生方法里的执行时间。这就像你统计工作时间，只统计了在办公室的时间，没统计在外面跑业务的时间，结果肯定不准。

这个问题在几种场景下特别明显。第一个是大量使用 JNI 的应用，比如调用 C/C++ 库的应用，原生代码的执行时间可能占很大比例，但 JFR 看不到。

第二个是使用 FFM API 的应用，JDK 19 引入的 Foreign Function & Memory API 让 Java 能直接调用 C 函数，这些调用也是原生代码，传统执行采样看不到。

第三个是 I/O 密集型应用，比如网络 I/O、文件 I/O 等，这些操作很多都是在原生代码里执行的，传统执行采样也看不到。

第四个是多线程应用，如果线程在等待锁或者等待 I/O，这些时间传统执行采样也看不到，导致 CPU 使用率分析不准确。

## CPU 时间采样的优势

JEP 509 的 CPU 时间采样就不一样了，它能记录包括原生代码在内的 CPU 时间，不管方法是在 Java 代码里执行还是在原生代码里执行，都能被采样到。

第一个优势是能看到原生代码的执行时间。CPU 时间采样会记录线程实际消耗的 CPU 时间，包括在原生代码里执行的时间。这样你就能知道应用到底在哪消耗 CPU 了，不会漏掉原生代码的部分。

第二个优势是更准确的性能分析。因为能看到完整的 CPU 时间，所以性能分析更准确，能找出真正的性能瓶颈。比如一个方法看起来执行时间不长，但实际上调用了耗时的原生方法，CPU 时间采样能发现这个问题。

第三个优势是适合多线程和 I/O 密集型应用。CPU 时间采样能区分 CPU 时间和挂起时间，比如线程在等待 I/O 的时候不消耗 CPU，CPU 时间采样不会记录这段时间，但能记录线程实际消耗 CPU 的时间。

第四个优势是能分析 CPU 使用率。因为能记录完整的 CPU 时间，所以能更准确地分析 CPU 使用率，不会因为漏掉原生代码而导致分析不准确。

## 基本用法

CPU 时间采样的使用很简单，通过命令行参数启用 `jdk.CPUTimeSample` 事件就行了。

```bash
# 启用 CPU 时间采样，保存到文件
java -XX:StartFlightRecording=jdk.CPUTimeSample#enabled=true,filename=cpu-time.jfr MyApp
```

这个命令会启动 JFR 录制，并启用 `jdk.CPUTimeSample` 事件。`enabled=true` 用来启用这个事件，`filename` 参数指定录制文件的路径。

运行完应用后，可以用 `jfr` 工具查看录制数据：

```bash
# 查看 CPU 时间采样事件
jfr view --events jdk.CPUTimeSample cpu-time.jfr
```

这个命令会显示所有 CPU 时间采样事件，包括方法执行时间、线程 CPU 时间等信息。

你也可以用 JDK Mission Control 或者 VisualVM 来分析录制文件，这些工具能提供更直观的可视化界面，方便分析 CPU 使用情况。

## 在代码中使用

除了命令行参数，你也可以在代码里控制 CPU 时间采样。

```java
import jdk.jfr.*;
import java.nio.file.Paths;
public class CPUTimeSamplingExample {
    public static void main(String[] args) throws Exception {
        // 创建一个新的录制，用来记录性能数据
        Recording recording = new Recording();
        // 启用 CPU 时间采样事件
        recording.enable("jdk.CPUTimeSample");  // 启用 CPU 时间采样事件，用来记录 CPU 时间
        recording.start();  // 开始录制，JFR 会自动采样 CPU 时间
        // 你的业务代码，包括 Java 代码和原生代码调用
        doWork();  // 执行一些工作，可能包括原生代码调用
        recording.stop();  // 停止录制，数据已经采集完了
        // 保存录制数据到文件
        recording.dump(Paths.get("cpu-time.jfr"));  // 把数据保存到文件，方便后续分析
        // 关闭录制，释放资源
        recording.close();  // 关闭录制，释放内存
    }
    private static void doWork() {
        // 模拟一些工作，可能包括原生代码调用
        for (int i = 0; i < 1000000; i++) {
            Math.sqrt(i);  // Java 代码，会被采样
            // 如果有原生方法调用，也会被采样
        }
    }
}
```

这个例子展示了怎么在代码里启用 CPU 时间采样。`enable("jdk.CPUTimeSample")` 用来启用 CPU 时间采样事件，然后 JFR 会自动采样 CPU 时间，包括 Java 代码和原生代码的执行时间。

## 与执行采样的对比

CPU 时间采样和执行采样有啥区别呢？第一个区别是采样范围不同。执行采样只采样 Java 代码，CPU 时间采样能采样包括原生代码在内的所有 CPU 时间。

第二个区别是时间计算方式不同。执行采样是根据采样次数估算执行时间，CPU 时间采样是直接记录线程实际消耗的 CPU 时间，更准确。

第三个区别是适用场景不同。执行采样适合纯 Java 应用，CPU 时间采样适合有原生代码调用的应用，或者需要精确 CPU 时间分析的应用。

第四个区别是性能开销不同。执行采样的开销比较小，CPU 时间采样的开销可能稍大一些，因为需要记录更多信息。

```java
import jdk.jfr.consumer.*;
import java.nio.file.Paths;
import java.util.*;
public class CompareSamplingMethods {
    public static void main(String[] args) throws Exception {
        // 读取包含执行采样和 CPU 时间采样的录制文件
        RecordingFile file = new RecordingFile(Paths.get("comparison.jfr"));  // 打开录制文件，准备读取数据
        // 统计执行采样数据
        Map<String, Integer> executionSamples = new HashMap<>();  // 用来存储执行采样数据，key 是方法名，value 是采样次数
        // 统计 CPU 时间采样数据
        Map<String, Long> cpuTimeSamples = new HashMap<>();  // 用来存储 CPU 时间采样数据，key 是方法名，value 是 CPU 时间（纳秒）
        // 遍历所有事件
        while (file.hasMoreEvents()) {  // 还有事件就继续读取
            RecordedEvent event = file.readEvent();  // 读取一个事件
            String eventType = event.getEventType().getName();  // 获取事件类型名称
            if ("jdk.ExecutionSample".equals(eventType)) {  // 判断是不是执行采样事件
                // 处理执行采样事件
                RecordedStackTrace stackTrace = event.getStackTrace();  // 获取调用栈
                if (stackTrace != null && stackTrace.getFrames().size() > 0) {  // 如果有调用栈
                    String method = stackTrace.getFrames().get(0).getMethod().getName();  // 获取顶层方法名
                    executionSamples.merge(method, 1, Integer::sum);  // 累加采样次数
                }
            } else if ("jdk.CPUTimeSample".equals(eventType)) {  // 判断是不是 CPU 时间采样事件
                // 处理 CPU 时间采样事件
                RecordedStackTrace stackTrace = event.getStackTrace();  // 获取调用栈
                if (stackTrace != null && stackTrace.getFrames().size() > 0) {  // 如果有调用栈
                    String method = stackTrace.getFrames().get(0).getMethod().getName();  // 获取顶层方法名
                    long cpuTime = event.getDuration().toNanos();  // 获取 CPU 时间，单位是纳秒
                    cpuTimeSamples.merge(method, cpuTime, Long::sum);  // 累加 CPU 时间
                }
            }
        }
        // 打印对比结果
        System.out.println("执行采样 vs CPU 时间采样对比：");  // 打印标题
        System.out.println("方法名\t执行采样次数\tCPU 时间（ms）");  // 打印表头
        // 合并两个数据集，打印对比
        Set<String> allMethods = new HashSet<>();  // 用来存储所有方法名
        allMethods.addAll(executionSamples.keySet());  // 添加执行采样的方法
        allMethods.addAll(cpuTimeSamples.keySet());  // 添加 CPU 时间采样的方法
        for (String method : allMethods) {  // 遍历所有方法
            int execCount = executionSamples.getOrDefault(method, 0);  // 获取执行采样次数，如果没有就是 0
            long cpuTime = cpuTimeSamples.getOrDefault(method, 0L);  // 获取 CPU 时间，如果没有就是 0
            System.out.printf("%s\t%d\t%.2f%n", method, execCount, cpuTime / 1_000_000.0);  // 打印对比数据
        }
        file.close();  // 关闭文件，释放资源
    }
}
```

这个例子展示了怎么对比执行采样和 CPU 时间采样的数据。通过对比，你能看出哪些方法在原生代码里消耗了 CPU 时间，但执行采样没采样到。

## 分析 CPU 时间数据

录制完数据后，可以用 JFR 工具来分析 CPU 时间数据，找出 CPU 消耗最多的方法。

```java
import jdk.jfr.consumer.*;
import java.nio.file.Paths;
import java.util.*;
public class AnalyzeCPUTime {
    public static void main(String[] args) throws Exception {
        // 读取录制文件
        RecordingFile file = new RecordingFile(Paths.get("cpu-time.jfr"));  // 打开录制文件，准备读取数据
        // 统计每个方法的 CPU 时间
        Map<String, Long> methodCPUTime = new HashMap<>();  // 用来存储方法 CPU 时间，key 是方法名，value 是总 CPU 时间
        Map<String, Integer> methodCallCount = new HashMap<>();  // 用来存储方法调用次数，key 是方法名，value 是调用次数
        // 统计每个线程的 CPU 时间
        Map<String, Long> threadCPUTime = new HashMap<>();  // 用来存储线程 CPU 时间，key 是线程名，value 是总 CPU 时间
        // 遍历所有事件
        while (file.hasMoreEvents()) {  // 还有事件就继续读取
            RecordedEvent event = file.readEvent();  // 读取一个事件
            // 只处理 CPU 时间采样事件
            if ("jdk.CPUTimeSample".equals(event.getEventType().getName())) {  // 判断是不是 CPU 时间采样事件
                // 获取调用栈
                RecordedStackTrace stackTrace = event.getStackTrace();  // 获取调用栈，用来找出执行的方法
                if (stackTrace != null && stackTrace.getFrames().size() > 0) {  // 如果有调用栈
                    // 获取顶层方法
                    RecordedFrame topFrame = stackTrace.getFrames().get(0);  // 获取调用栈顶层，这是当前执行的方法
                    String methodName = topFrame.getMethod().getType().getName() + "." + topFrame.getMethod().getName();  // 构建完整方法名，格式是 类名.方法名
                    // 获取 CPU 时间
                    long cpuTime = event.getDuration().toNanos();  // 获取 CPU 时间，单位是纳秒
                    // 累加方法 CPU 时间
                    methodCPUTime.merge(methodName, cpuTime, Long::sum);  // 累加 CPU 时间，如果方法已经存在就相加，不存在就新建
                    methodCallCount.merge(methodName, 1, Integer::sum);  // 累加调用次数，每次调用加 1
                }
                // 获取线程信息
                RecordedThread thread = event.getThread();  // 获取线程信息
                if (thread != null) {  // 如果有线程信息
                    String threadName = thread.getJavaName();  // 获取线程名
                    long cpuTime = event.getDuration().toNanos();  // 获取 CPU 时间
                    threadCPUTime.merge(threadName, cpuTime, Long::sum);  // 累加线程 CPU 时间
                }
            }
        }
        // 计算平均 CPU 时间并排序
        List<MethodCPUTime> methodStats = new ArrayList<>();  // 用来存储方法统计信息
        for (String method : methodCPUTime.keySet()) {  // 遍历所有方法
            long totalCPUTime = methodCPUTime.get(method);  // 获取总 CPU 时间
            int callCount = methodCallCount.get(method);  // 获取调用次数
            long avgCPUTime = totalCPUTime / callCount;  // 计算平均 CPU 时间，总时间除以调用次数
            methodStats.add(new MethodCPUTime(method, totalCPUTime, callCount, avgCPUTime));  // 创建统计对象，存储方法信息
        }
        // 按总 CPU 时间排序
        methodStats.sort((a, b) -> Long.compare(b.totalCPUTime, a.totalCPUTime));  // 按总 CPU 时间降序排序，找出最耗 CPU 的方法
        // 打印方法 CPU 时间统计
        System.out.println("方法 CPU 时间统计（按总 CPU 时间排序）：");  // 打印标题
        System.out.println("方法名\t总 CPU 时间（ms）\t调用次数\t平均 CPU 时间（ms）");  // 打印表头
        for (MethodCPUTime stat : methodStats) {  // 遍历统计结果
            System.out.printf("%s\t%.2f\t%d\t%.2f%n",  // 打印方法统计信息
                stat.method, stat.totalCPUTime / 1_000_000.0, stat.callCount, stat.avgCPUTime / 1_000_000.0);
        }
        // 打印线程 CPU 时间统计
        System.out.println("\n线程 CPU 时间统计：");  // 打印标题
        threadCPUTime.entrySet().stream()  // 转换为流，方便排序
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())  // 按 CPU 时间降序排序
            .forEach(entry -> System.out.printf("%s: %.2f ms%n", entry.getKey(), entry.getValue() / 1_000_000.0));  // 打印线程统计信息
        file.close();  // 关闭文件，释放资源
    }
    // 方法 CPU 时间统计信息类，用来存储方法的 CPU 时间统计数据
    static class MethodCPUTime {
        String method;  // 方法名
        long totalCPUTime;  // 总 CPU 时间（纳秒）
        int callCount;  // 调用次数
        long avgCPUTime;  // 平均 CPU 时间（纳秒）
        MethodCPUTime(String method, long totalCPUTime, int callCount, long avgCPUTime) {
            this.method = method;
            this.totalCPUTime = totalCPUTime;
            this.callCount = callCount;
            this.avgCPUTime = avgCPUTime;
        }
    }
}
```

这个例子展示了怎么分析 CPU 时间数据。通过分析，你能找出哪些方法消耗了最多的 CPU 时间，包括在原生代码里消耗的时间，从而优化性能。

## 实际应用场景

CPU 时间采样特别适合哪些场景呢？第一个是大量使用原生代码的应用，比如调用 C/C++ 库的应用，或者使用 FFM API 的应用，这些应用的原生代码执行时间可能占很大比例，CPU 时间采样能看到这些时间。

第二个是 I/O 密集型应用，比如网络 I/O、文件 I/O 等，这些操作很多都是在原生代码里执行的，CPU 时间采样能看到这些操作的 CPU 消耗。

第三个是多线程应用，需要分析每个线程的 CPU 使用情况，CPU 时间采样能提供详细的线程 CPU 时间数据。

第四个是性能优化，需要找出真正的性能瓶颈，CPU 时间采样能提供更准确的性能数据，帮助定位问题。

## 实验性特性的注意事项

CPU 时间采样目前还是实验性的，有几个注意事项。第一个是只在 Linux 系统上可用，其他平台暂时不支持。如果你在其他平台上用，会报错或者不工作。

第二个是行为可能会变，因为是实验性的，后续版本可能会修改行为或者 API，生产环境用的时候要谨慎点。

第三个是性能开销可能比较大，特别是采样频率高的时候，可能会影响应用性能，建议只在必要时使用。

第四个是数据格式可能会变，因为是实验性的，后续版本可能会修改数据格式，分析工具可能需要更新。

## 性能开销

CPU 时间采样的性能开销是啥样的呢？理论上，因为需要记录更多信息，包括原生代码的执行时间，所以开销可能比执行采样稍大一些。

但实际上，开销还是可以接受的，特别是采样频率不是太高的时候。根据测试，CPU 时间采样的开销一般在 1-2% 左右，对大多数应用来说是可以接受的。

怎么减少开销呢？第一个是降低采样频率，不要采样太频繁，比如可以设置采样间隔，减少采样次数。

第二个是只采样关键方法，不要啥都采样，可以用过滤器选择要采样的方法，减少采样范围。

第三个是定期采样，不要一直开启，比如只在性能测试的时候开启，生产环境可以定期开启一段时间，收集数据后关闭。

## 与其他 JFR 事件的配合

CPU 时间采样可以和其他 JFR 事件配合使用，提供更全面的性能分析。

```bash
# 同时启用多个事件，提供全面的性能分析
java -XX:StartFlightRecording=\
  jdk.CPUTimeSample#enabled=true,\
  jdk.ExecutionSample#enabled=true,\
  jdk.MethodTrace#enabled=true,\
  filename=comprehensive.jfr MyApp
```

这个命令同时启用了 CPU 时间采样、执行采样和方法追踪，能提供更全面的性能分析数据。CPU 时间采样能看到原生代码的执行时间，执行采样能看到 Java 代码的执行情况，方法追踪能提供详细的调用链信息，三者结合能提供更完整的性能分析。

## 总结

JEP 509 的 CPU 时间采样功能给 JFR 增加了记录原生代码 CPU 时间的能力，能提供更准确的性能分析数据。通过记录包括原生代码在内的 CPU 时间，能找出真正的性能瓶颈，不会因为漏掉原生代码而导致分析不准确。

这个特性对大量使用原生代码的应用、I/O 密集型应用、多线程应用等场景特别有用，能提供详细的 CPU 时间数据，帮助开发者更好地分析和优化应用性能。但也要注意这是实验性特性，只在 Linux 系统上可用，行为可能会变，生产环境用的时候要谨慎点。

如果你在 Linux 上做性能分析，特别是那些有原生代码调用的应用，建议试试 JEP 509 的 CPU 时间采样功能，它比传统执行采样更准确，能提供更完整的性能数据。虽然可能有性能开销，但通过合理的配置，可以控制在可接受的范围内。
