# 12、JDK 25 新特性：JFR 方法计时和追踪（JEP 520）精确性能分析
- 来源：https://ddkk.com/zhuanlan/java/java25/12.html
- 分类：JDK 25 新特性
- 分组：教程目录
- 日期：2025-11-27
以前做性能分析，用采样分析器（Sampling Profiler）的时候，数据总是不太准。为啥？因为它只是定期采样，看线程在干啥，然后根据采样次数估算方法执行时间。这就像你每隔几分钟看一眼表，然后估算你一天干了啥，肯定不准确。

现在 JDK 25 里的 JEP 520 就不一样了，它给 JFR 加上了方法计时和追踪功能，能记录每个方法的完整统计信息，包括执行时间、调用次数等，数据是精确的，不是估算的。这就像你装了个摄像头，把每个方法从开始到结束都录下来了，想看啥数据都有。

这个特性是通过字节码插桩（Bytecode Instrumentation）实现的，不用改源代码，在运行时自动给方法插桩，记录方法进入和退出的时间。你可以通过命令行参数、配置文件、jcmd 工具或者 JMX API 来选择要追踪的方法，想追踪哪个就追踪哪个，很灵活。

虽然这个功能很强大，但也要注意性能开销。JFR 一般要求 CPU 开销小于 1%，但启用方法计时和追踪后，如果追踪的方法太多，开销可能会超过这个阈值。所以建议只追踪那些关键方法，别啥都追踪，不然性能反而会下降。

## 采样分析器的局限性

先说说为啥采样分析器不准确吧。采样分析器的工作原理是定期中断线程，看线程在执行啥方法，然后根据采样次数估算方法执行时间。比如一个方法被采样了 10 次，就认为它执行时间比较长。

这听起来挺合理的，但实际上问题不少。第一个问题是数据不完整。采样是随机的，可能某些方法从来没被采样到，或者采样次数太少，数据就不准确。这就像你调查的时候，只问了少数几个人，结果肯定有偏差。

第二个问题是时间估算不准确。采样分析器只能估算方法执行时间，不能精确测量。比如一个方法实际执行了 100 毫秒，但采样分析器可能估算成 80 毫秒或者 120 毫秒，误差挺大的。

第三个问题是调用次数不知道。采样分析器只能知道方法被采样了多少次，不知道实际调用了多少次。比如一个方法被调用了 1000 次，但只被采样了 10 次，你就不知道它实际被调用了多少次。

第四个问题是不能追踪调用链。采样分析器只能看到当前执行的方法，不能看到完整的调用链，不知道方法是从哪调用的，调用了哪些其他方法。

## 方法计时和追踪的优势

JEP 520 的方法计时和追踪就不一样了，它能记录每个方法的完整统计信息，数据是精确的，不是估算的。

第一个优势是数据精确。方法计时和追踪会记录每个方法的实际执行时间，不是估算的。比如一个方法执行了 100 毫秒，就记录 100 毫秒，不会估算成其他值。

第二个优势是调用次数准确。方法计时和追踪会记录每个方法的实际调用次数，不是采样次数。比如一个方法被调用了 1000 次，就记录 1000 次，不会因为采样而漏掉。

第三个优势是能追踪调用链。方法计时和追踪能记录完整的调用链，知道方法是从哪调用的，调用了哪些其他方法。这对分析性能瓶颈很有用，能知道哪个方法调用了慢方法。

第四个优势是不用改源代码。方法计时和追踪是通过字节码插桩实现的，在运行时自动给方法插桩，不用改源代码。这对那些不能改源代码的应用特别有用，比如第三方库、框架等。

## 基本用法

方法计时和追踪的使用很简单，可以通过命令行参数来选择要追踪的方法。

```bash
# 追踪 SimpleJpaRepository 类的 findAll 方法
java -XX:StartFlightRecording:jdk.MethodTrace#filter=org.springframework.data.jpa.repository.support.SimpleJpaRepository::findAll,filename=recording.jfr MyApp
```

这个命令会启动 JFR 录制，并追踪 `SimpleJpaRepository` 类的 `findAll` 方法。`filter` 参数用来指定要追踪的方法，格式是 `类名::方法名`。`filename` 参数指定录制文件的路径。

运行完应用后，可以用 `jfr` 工具查看录制数据：

```bash
# 查看方法追踪事件
jfr view --events jdk.MethodTrace recording.jfr
```

这个命令会显示所有方法追踪事件，包括方法执行时间、调用次数等信息。

如果你想追踪多个方法，可以用逗号分隔：

```bash
# 追踪多个方法
java -XX:StartFlightRecording:jdk.MethodTrace#filter=com.example.Service::method1,com.example.Service::method2,filename=recording.jfr MyApp
```

## 在代码中使用

除了命令行参数，你也可以在代码里控制方法计时和追踪。

```java
import jdk.jfr.*;
import java.nio.file.Paths;
public class MethodTimingExample {
    public static void main(String[] args) throws Exception {
        // 创建一个新的录制，用来记录性能数据
        Recording recording = new Recording();
        // 启用方法追踪事件
        recording.enable("jdk.MethodTrace");  // 启用方法追踪事件，用来记录方法执行信息
        // 设置方法过滤器，只追踪特定方法
        // 格式：类名::方法名，可以用通配符
        recording.setSettings(Map.of(
            "jdk.MethodTrace#filter", "com.example.Service::process*"  // 只追踪 process 开头的方法
        ));
        recording.start();  // 开始录制，JFR 会自动给方法插桩
        // 你的业务代码
        Service service = new Service();  // 创建服务对象
        service.processData();  // 执行方法，JFR 会记录这个方法的执行时间
        recording.stop();  // 停止录制，数据已经采集完了
        // 保存录制数据到文件
        recording.dump(Paths.get("method-timing.jfr"));  // 把数据保存到文件，方便后续分析
        // 关闭录制，释放资源
        recording.close();  // 关闭录制，释放内存
    }
}
class Service {
    // 这个方法会被追踪，因为匹配了过滤器
    public void processData() {
        // 模拟一些工作
        try {
            Thread.sleep(100);  // 模拟耗时操作，JFR 会记录这个方法的执行时间
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
    // 这个方法不会被追踪，因为不匹配过滤器
    public void otherMethod() {
        // 其他方法
    }
}
```

这个例子展示了怎么在代码里启用方法计时和追踪。`enable("jdk.MethodTrace")` 用来启用方法追踪事件，`setSettings()` 用来设置方法过滤器，只追踪特定方法。JFR 会自动给匹配的方法插桩，记录方法执行时间。

## 方法过滤器语法

方法过滤器的语法很灵活，可以用多种方式来选择要追踪的方法。

```bash
# 追踪单个方法
jdk.MethodTrace#filter=com.example.Service::method1
# 追踪多个方法，用逗号分隔
jdk.MethodTrace#filter=com.example.Service::method1,com.example.Service::method2
# 使用通配符，追踪所有以 process 开头的方法
jdk.MethodTrace#filter=com.example.Service::process*
# 追踪整个类的所有方法
jdk.MethodTrace#filter=com.example.Service::*
# 追踪多个类的方法
jdk.MethodTrace#filter=com.example.Service::*,com.example.Util::*
```

方法过滤器的格式是 `类名::方法名`，可以用通配符 `*` 来匹配多个方法或类。这对追踪整个包或整个类的方法很有用。

## 分析录制数据

录制完数据后，可以用 JFR 工具来分析。除了命令行工具，也可以用 JFR 的 API 来编程分析。

```java
import jdk.jfr.consumer.*;
import java.nio.file.Paths;
import java.util.*;
public class AnalyzeMethodTiming {
    public static void main(String[] args) throws Exception {
        // 读取录制文件
        RecordingFile file = new RecordingFile(Paths.get("method-timing.jfr"));  // 打开录制文件，准备读取数据
        // 统计方法执行时间
        Map<String, Long> methodTimes = new HashMap<>();  // 用来存储方法执行时间，key 是方法名，value 是总时间
        Map<String, Integer> methodCounts = new HashMap<>();  // 用来存储方法调用次数，key 是方法名，value 是调用次数
        // 遍历所有事件
        while (file.hasMoreEvents()) {  // 还有事件就继续读取
            RecordedEvent event = file.readEvent();  // 读取一个事件
            // 只处理方法追踪事件
            if ("jdk.MethodTrace".equals(event.getEventType().getName())) {  // 判断是不是方法追踪事件
                String methodName = event.getString("method");  // 获取方法名，格式是 类名::方法名
                long duration = event.getDuration().toNanos();  // 获取方法执行时间，单位是纳秒
                // 累加执行时间
                methodTimes.merge(methodName, duration, Long::sum);  // 累加执行时间，如果方法已经存在就相加，不存在就新建
                // 累加调用次数
                methodCounts.merge(methodName, 1, Integer::sum);  // 累加调用次数，每次调用加 1
            }
        }
        // 计算平均执行时间并排序
        List<MethodStats> stats = new ArrayList<>();  // 用来存储方法统计信息
        for (String method : methodTimes.keySet()) {  // 遍历所有方法
            long totalTime = methodTimes.get(method);  // 获取总执行时间
            int count = methodCounts.get(method);  // 获取调用次数
            long avgTime = totalTime / count;  // 计算平均执行时间，总时间除以调用次数
            stats.add(new MethodStats(method, totalTime, count, avgTime));  // 创建统计对象，存储方法信息
        }
        // 按总执行时间排序
        stats.sort((a, b) -> Long.compare(b.totalTime, a.totalTime));  // 按总执行时间降序排序，找出最耗时的方法
        // 打印结果
        System.out.println("方法执行统计（按总执行时间排序）：");  // 打印标题
        for (MethodStats stat : stats) {  // 遍历统计结果
            System.out.printf("%s: 总时间=%d ms, 调用次数=%d, 平均时间=%d ms%n",  // 打印方法统计信息
                stat.method, stat.totalTime / 1_000_000, stat.count, stat.avgTime / 1_000_000);
        }
        file.close();  // 关闭文件，释放资源
    }
    // 方法统计信息类，用来存储方法的统计数据
    static class MethodStats {
        String method;  // 方法名
        long totalTime;  // 总执行时间（纳秒）
        int count;  // 调用次数
        long avgTime;  // 平均执行时间（纳秒）
        MethodStats(String method, long totalTime, int count, long avgTime) {
            this.method = method;
            this.totalTime = totalTime;
            this.count = count;
            this.avgTime = avgTime;
        }
    }
}
```

这个例子展示了怎么用 JFR API 来分析方法计时数据。`RecordingFile` 用来读取录制文件，`readEvent()` 用来读取事件，`getString()` 和 `getDuration()` 用来获取事件数据。通过分析这些数据，可以找出最耗时的方法，从而优化性能。

## 性能开销

方法计时和追踪虽然很强大，但也要注意性能开销。JFR 一般要求 CPU 开销小于 1%，但启用方法计时和追踪后，如果追踪的方法太多，开销可能会超过这个阈值。

为啥会有开销呢？因为方法计时和追踪是通过字节码插桩实现的，每个被追踪的方法都会在进入和退出时执行额外的代码，记录时间戳。如果方法调用很频繁，这些额外代码的开销就会累积，导致性能下降。

怎么减少开销呢？第一个是只追踪关键方法，别啥都追踪。比如只追踪那些执行时间长、调用频繁的方法，不追踪那些执行时间短、调用少的方法。

第二个是使用过滤器，精确选择要追踪的方法。比如只追踪某个包或某个类的方法，不追踪其他方法。

第三个是定期分析，不要一直开启。比如只在性能测试的时候开启，生产环境可以定期开启一段时间，收集数据后关闭。

## 实际应用场景

方法计时和追踪特别适合哪些场景呢？第一个是性能基准测试，需要精确测量方法执行时间，采样分析器不够准确，方法计时和追踪能提供精确数据。

第二个是性能优化，需要找出性能瓶颈，方法计时和追踪能提供详细的调用链和执行时间，帮助定位问题。

第三个是第三方库分析，不能改源代码，但需要分析性能，方法计时和追踪不用改源代码，很适合这种场景。

第四个是生产环境监控，需要定期收集性能数据，方法计时和追踪可以配置过滤器，只追踪关键方法，减少开销。

## 注意事项

用方法计时和追踪的时候，有几个注意事项。第一个是性能开销，如果追踪的方法太多，开销可能会很大，建议只追踪关键方法。

第二个是方法过滤器要精确，不要用太宽泛的过滤器，比如 `*::*` 会追踪所有方法，开销会很大。

第三个是生产环境要谨慎使用，虽然可以配置过滤器减少开销，但还是建议只在必要时使用，比如性能问题排查、定期监控等。

第四个是数据量可能很大，如果追踪的方法很多、调用很频繁，录制文件可能会很大，要注意磁盘空间。

## 总结

JEP 520 的方法计时和追踪功能给 JFR 增加了精确性能分析的能力，能记录每个方法的完整统计信息，数据是精确的，不是估算的。通过字节码插桩实现，不用改源代码，使用灵活，可以通过命令行参数、配置文件、jcmd 工具或 JMX API 来控制。

这个特性对性能基准测试、性能优化、第三方库分析等场景特别有用，能提供详细的调用链和执行时间，帮助开发者更好地分析和优化应用性能。但也要注意性能开销，建议只追踪关键方法，不要啥都追踪。

如果你需要精确的性能数据，建议试试 JEP 520 的方法计时和追踪功能，它比采样分析器更准确，能提供更详细的性能信息。虽然可能有性能开销，但通过合理的配置，可以控制在可接受的范围内。
