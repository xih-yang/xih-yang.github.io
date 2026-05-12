# 07、JDK 23 新特性：ZGC 分代模式（JEP 474）：默认启用分代垃圾收集器的性能提升
- 来源：https://ddkk.com/zhuanlan/java/java23/7.html
- 分类：JDK 23 新特性
- 分组：教程目录
- 日期：2025-11-28
跑大内存应用的时候，最烦的就是GC停顿了，特别是那些对延迟要求贼高的场景，停顿个几毫秒都可能出问题。ZGC从JDK 11开始引入，一直主打低延迟，现在JDK 23的JEP 474把ZGC的默认模式改成了分代模式，性能又提升了一截。

鹏磊我之前在生产环境用ZGC的时候，虽然延迟确实低，但是有时候内存占用还是有点高。现在有了分代模式，年轻代和老年代分开管理，短命对象能更快被回收，内存占用和CPU开销都降下来了。今天咱就好好聊聊这个ZGC分代模式，看看它到底整了哪些活，怎么用才能发挥最大效果。

## JEP 474 的核心改进

JEP 474把ZGC的默认模式从非分代模式切换到了分代模式，并且把非分代模式标记为废弃了。这个改动看起来简单，但是背后的意义挺大的。分代GC的基本思想是：大部分对象都是短命的，只有少部分对象会存活很久。把内存分成年轻代和老年代，可以针对不同生命周期的对象采用不同的回收策略。

以前ZGC只有非分代模式，所有对象都混在一起处理。虽然ZGC的并发标记和并发回收能力很强，但是对短命对象的处理效率还是不够高。现在有了分代模式，年轻代可以更频繁地回收，老年代回收频率可以降低，整体效率就上去了。

## 分代GC的基本原理

### 分代假设

分代GC基于一个重要的假设：大部分对象都是短命的，只有少部分对象会存活很久。这个假设在大多数Java应用中都是成立的。比如临时变量、方法参数、局部对象这些，通常用完了就死了；而像单例对象、缓存对象、配置对象这些，可能会存活很久。

基于这个假设，分代GC把堆内存分成两个区域：年轻代（Young Generation）和老年代（Old Generation）。年轻代主要存放新创建的对象，老年代存放存活时间较长的对象。

### 年轻代回收

年轻代的特点是对象生命周期短，大部分对象很快就会被回收。所以年轻代可以更频繁地进行回收，而且回收速度要快。ZGC的分代模式里，年轻代回收是并发的，不会造成应用停顿。

```java
// 创建大量短命对象，这些对象会在年轻代
public void processRequests(List<Request> requests) {
    for (Request req : requests) {
        // 创建临时对象，这些对象生命周期很短
        Response resp = new Response();  // 这个对象可能在下次GC就被回收了
        resp.setStatus(200);
        resp.setData(processData(req.getData()));  // processData也可能创建临时对象
        // 处理完就完了，对象很快变成垃圾
        sendResponse(resp);
    }
    // 方法结束后，这些临时对象都可以被回收
}
```

年轻代回收的时候，ZGC会标记所有存活的对象，然后把它们提升到老年代，或者如果对象还年轻，就留在年轻代。这个过程是并发的，不会阻塞应用线程。

### 老年代回收

老年代的对象存活时间比较长，回收频率可以低一些。但是老年代回收的时候，需要处理的对象可能比较多，所以老年代回收的复杂度会高一些。

```java
// 这些对象可能会进入老年代
public class CacheManager {
    private static final Map<String, Object> cache = new ConcurrentHashMap<>();  // 这个Map可能会存活很久
    public void put(String key, Object value) {
        cache.put(key, value);  // 这些对象可能会长期存活
    }
    // 单例对象，会一直存活
    private static final CacheManager instance = new CacheManager();
}
```

老年代回收的时候，ZGC会进行完整的标记和回收，包括处理跨代引用。跨代引用就是老年代对象引用年轻代对象，或者年轻代对象引用老年代对象。这些引用需要特殊处理，确保不会漏掉存活的对象。

## ZGC分代模式的配置

### 启用分代模式

在JDK 23里，ZGC默认就是分代模式，不需要额外配置。但是如果你想显式指定，可以用这个参数：

```bash
# 启用ZGC分代模式（JDK 23默认）
-XX:+UseZGC -XX:+ZGenerational
```

如果你还在用JDK 21或者更早的版本，需要先升级到JDK 23才能用分代模式。JDK 21的ZGC还是非分代模式。

### 禁用分代模式（不推荐）

虽然非分代模式已经被废弃了，但是JDK 23里还能用。不过不建议用，因为未来版本可能会移除：

```bash
# 禁用分代模式，使用非分代模式（已废弃）
-XX:+UseZGC -XX:-ZGenerational
```

### 年轻代大小配置

可以配置年轻代的大小，控制年轻代和老年代的比例：

```bash
# 设置年轻代初始大小
-XX:ZYoungGenerationSize=256m
# 设置年轻代最大大小
-XX:ZYoungGenerationMaxSize=512m
```

年轻代太小的话，对象可能很快就被提升到老年代，增加老年代的负担；年轻代太大的话，年轻代回收的时间可能会变长。一般建议年轻代占堆内存的25%到50%。

### 其他相关参数

还有一些其他参数可以调优：

```bash
# 设置GC线程数
-XX:ConcGCThreads=4
# 设置最大堆内存
-Xmx8g
# 启用GC日志
-Xlog:gc*:file=gc.log:time,tags
```

## 性能优势分析

### 降低内存占用

分代模式可以更及时地回收短命对象，减少内存占用。在非分代模式下，短命对象可能要在堆里待很久才被回收；分代模式下，年轻代频繁回收，短命对象很快就被清理掉了。

```java
// 这个场景下，分代模式的优势很明显
public void batchProcess(List<Data> dataList) {
    List<Result> results = new ArrayList<>();  // 临时列表
    for (Data data : dataList) {
        // 处理每个数据，创建大量临时对象
        Result result = processData(data);  // 创建临时对象
        results.add(result);
        // 如果数据量大，这里会创建很多临时对象
    }
    // 处理完这批数据后，这些临时对象都可以被回收
    return results;
    // 分代模式下，这些对象在年轻代，下次年轻代回收就会被清理
    // 非分代模式下，可能要等很久才回收
}
```

### 降低CPU开销

分代模式下，年轻代回收频率高但是处理的对象少，老年代回收频率低但是处理的对象多。整体来说，CPU开销会降低，因为不需要每次都处理整个堆。

### 降低GC停顿时间

虽然ZGC本身就是低延迟的，但是分代模式可以进一步降低停顿时间。年轻代回收的时候，只需要处理年轻代的对象，不需要扫描整个堆，所以停顿时间会更短。

### 提升吞吐量

分代模式可以提升应用的整体吞吐量。因为GC效率提高了，应用线程可以花更多时间在业务逻辑上，而不是等待GC。

## 实际应用场景

### 微服务应用

微服务应用通常会有大量的HTTP请求，每个请求都会创建很多临时对象。分代模式可以快速回收这些临时对象，降低内存占用：

```java
@RestController
public class UserController {
    @GetMapping("/users/{id}")
    public ResponseEntity<UserDTO> getUser(@PathVariable Long id) {
        // 这些对象都是短命的，会在年轻代
        User user = userService.findById(id);  // 临时对象
        UserDTO dto = convertToDTO(user);  // 临时对象
        return ResponseEntity.ok(dto);  // 临时对象
        // 请求处理完，这些对象很快就会被回收
    }
    // 分代模式下，这些临时对象在年轻代，回收很快
    // 非分代模式下，可能要等很久才回收
}
```

### 大数据处理

大数据处理场景下，会创建大量的中间对象。分代模式可以快速回收这些中间对象，降低内存压力：

```java
public List<Result> processBigData(List<RawData> rawDataList) {
    List<Result> results = new ArrayList<>();  // 临时列表
    for (RawData rawData : rawDataList) {
        // 处理每个数据，创建大量中间对象
        ProcessedData processed = transform(rawData);  // 中间对象
        ValidatedData validated = validate(processed);  // 中间对象
        Result result = calculate(validated);  // 中间对象
        results.add(result);
        // 这些中间对象处理完就可以回收了
    }
    return results;
    // 分代模式下，这些中间对象在年轻代，回收很快
}
```

### 缓存应用

缓存应用里，缓存对象会长期存活，但是会有很多临时对象。分代模式可以快速回收临时对象，同时让缓存对象留在老年代：

```java
public class CacheService {
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();  // 长期存活
    public Object get(String key) {
        // 这些是临时对象，会在年轻代
        CacheEntry entry = cache.get(key);  // 临时引用
        if (entry != null && !entry.isExpired()) {
            return entry.getValue();  // 临时对象
        }
        return null;
    }
    // 缓存对象在老年代，临时对象在年轻代
    // 分代模式可以分别优化
}
```

## 迁移注意事项

### 从非分代模式迁移

如果你之前用的是非分代模式，迁移到分代模式需要注意几个问题：

1. **性能测试**：迁移后要做性能测试，看看内存占用、CPU使用率、GC停顿时间有没有变化。一般来说，分代模式会更好，但是也要验证一下。
2. **参数调整**：可能需要调整一些GC参数，比如年轻代大小。可以先保持默认值，观察一段时间，再根据实际情况调整。
3. **监控指标**：要关注GC相关的监控指标，比如年轻代回收频率、老年代回收频率、对象提升率等。这些指标可以帮助你优化配置。

### 兼容性考虑

分代模式在JDK 23里是默认的，但是非分代模式还能用。如果你的应用对非分代模式有特殊依赖，可以先测试一下分代模式，看看有没有问题。一般来说，分代模式是向后兼容的，不会影响应用的功能。

### 未来版本规划

非分代模式已经被标记为废弃了，未来版本可能会移除。所以建议尽快迁移到分代模式，避免以后升级的时候出问题。

## 最佳实践

### 合理设置年轻代大小

年轻代大小要根据应用的特点来设置。如果应用创建大量短命对象，可以适当增大年轻代；如果应用的对象存活时间比较长，可以适当减小年轻代。

```bash
# 根据应用特点调整年轻代大小
# 短命对象多的应用
-XX:ZYoungGenerationSize=512m
# 对象存活时间长的应用
-XX:ZYoungGenerationSize=256m
```

### 监控GC指标

要定期监控GC相关的指标，及时发现问题：

```bash
# 启用详细的GC日志
-Xlog:gc*:file=gc.log:time,tags,level:info
# 或者用JFR（Java Flight Recorder）监控
-XX:+FlightRecorder
-XX:StartFlightRecording=duration=60s,filename=recording.jfr
```

### 压力测试

在迁移到分代模式之前，要做充分的压力测试，模拟生产环境的负载，看看性能表现如何。

### 逐步迁移

如果是生产环境，建议逐步迁移。可以先在测试环境验证，然后在部分生产实例上试用，最后再全面推广。

## 性能对比

### 内存占用对比

分代模式下，内存占用通常会降低10%到30%，因为短命对象可以更快被回收。

### CPU开销对比

分代模式下，CPU开销通常会降低5%到15%，因为不需要每次都处理整个堆。

### 停顿时间对比

虽然ZGC本身就是低延迟的，但是分代模式可以进一步降低停顿时间，特别是在处理大量短命对象的场景下。

### 吞吐量对比

分代模式下，应用吞吐量通常会提升5%到20%，因为GC效率提高了。

## 总结

ZGC分代模式是JDK 23的一个重要改进，通过将内存分成年轻代和老年代，可以更高效地处理不同生命周期的对象。分代模式可以降低内存占用、降低CPU开销、降低GC停顿时间、提升应用吞吐量，对大多数应用来说都是个好消息。

迁移到分代模式相对简单，因为它是JDK 23的默认模式，不需要额外配置。但是建议做一下性能测试，看看对你的应用有没有影响。如果之前用的是非分代模式，可能需要调整一些参数，但是一般来说，分代模式的性能会更好。

非分代模式已经被标记为废弃了，未来版本可能会移除，所以建议尽快迁移到分代模式。分代模式代表了ZGC的发展方向，以后ZGC的优化都会围绕分代模式进行，所以早点迁移，早点受益。

总的来说，ZGC分代模式是个很实用的改进，特别是对那些对延迟和内存占用有要求的应用来说。兄弟们可以根据自己的应用特点，合理配置参数，充分发挥分代模式的优势。
