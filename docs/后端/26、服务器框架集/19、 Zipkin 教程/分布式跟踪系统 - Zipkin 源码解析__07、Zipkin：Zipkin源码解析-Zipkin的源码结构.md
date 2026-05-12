# 07、Zipkin：Zipkin源码解析-Zipkin的源码结构
- 来源：https://ddkk.com/zhuanlan/linktrack/zipkin/7.html
- 分类：链路追踪
- 分组：分布式跟踪系统 - Zipkin 源码解析
前面花了大量篇幅来介绍Brave的使用，一直把Zipkin当黑盒在使用，现在来逐渐拨开Zipkin的神秘面纱。

Zipkin的源代码地址为：[https://github.com/openzipkin/zipkin](https://github.com/openzipkin/zipkin)

Zipkin的源码结构

- zipkin - 对应的是zipkin v1
- zipkin2 - 对应的是zipkin v2
- zipkin-server - 是zipkin的web工程目录，zipkin.server.ZipkinServer是启动类
- zipkin-ui - zipkin ui工程目录，zipkin的设计师前后端分离的，zipkin-server提供数据查询接口，zipkin-ui做数据展现。
- zipkin-autoconfigure - 是为springboot提供的自动配置相关的类
- collector-kafka
- collector-kafka10
- collector-rabbitmq
- collector-scribe
- metrics-prometheus
- storage-cassandra
- storage-cassandra3
- storage-elasticsearch-aws
- storage-elasticsearch-http
- storage-mysql
- ui

zipkin-collector - 是zipkin比较重要的模块，收集trace信息，支持从kafka和rabbitmq，以及scribe中收集，这个模块是可选的，因为zipkin默认使用http协议提供给客户端来收集

1. kafka
2. kafka10
3. rabbitmq
4. scribe

zipkin-storage - 也是zipkin比较重要的模块，用于存储收集的trace信息，默认是使用内置的InMemoryStorage，即存储在内存中，重启就会丢失。我们可以根据我们实际的需要更换存储方式，将trace存储在mysql，elasticsearch，cassandra中。

1. cassandra
2. elasticsearch
3. elasticsearch-http
4. mysql
5. zipkin2_cassandra

## ZipkinServer

ZipkinServer是SpringBoot启动类，该类上使用了@EnableZipkinServer注解，加载了相关的Bean，而且在启动方法中添加了监听器RegisterZipkinHealthIndicators类，来初始化健康检查的相关bean。

```java
@SpringBootApplication
@EnableZipkinServer
public class ZipkinServer {
  public static void main(String[] args) {
    new SpringApplicationBuilder(ZipkinServer.class)
        .listeners(new RegisterZipkinHealthIndicators())
        .properties("spring.config.name=zipkin-server").run(args);
  }
}
```

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Import({
  ZipkinServerConfiguration.class,
  BraveConfiguration.class,
  ZipkinQueryApiV1.class,
  ZipkinHttpCollector.class
})
public @interface EnableZipkinServer {
}
```

EnableZipkinServer注解导入了ZipkinServerConfiguration，BraveConfiguration，ZipkinQueryApiV1，ZipkinHttpCollector。注意，这里并没有导入ZipkinQueryApiV2，但是由于SpringBoot项目会默认加载和启动类在一个包，或者在其子包的所有使用Component，Controller，Service等注解的类，所以在启动后，也会发现ZipkinQueryApiV2也被加载了。

- ZipkinServerConfiguration - Zipkin Server端所有核心配置
- BraveConfiguration - Zipkin存储trace信息时，还可以将自身的trace信息一起记录，这时就依赖Brave相关的类，都在这个类里配置
- ZipkinQueryApiV1 - Zipkin V1版本的查询API都在这个Controller中
- ZipkinQueryApiV2 - Zipkin V2版本的查询API都在这个Controller中
- ZipkinHttpCollector - Zipkin默认的Collector使用http协议里收集Trace信息，客户端调用/api/v1/spans或/api/v2/spans来上报trace信息

## ZipkinServerConfiguration

所有Zipkin服务需要的Bean都在这个类里进行配置

- ZipkinHealthIndicator - Zipkin健康自检的类
- CollectorSampler - Collector的采样率，默认100%采样，可以通过zipkin.collector.sample-rate来设置采样率
- CollectorMetrics - Collector的统计信息，默认实现为ActuateCollectorMetrics
- BraveTracedStorageComponentEnhancer - Zipkin存储trace时的self-trace类，启用后会将Zipkin的Storage存储模块执行的trace信息也采集进系统中
- InMemoryConfiguration - 默认的内存Storage存储配置，当zipkin.storage.type属性未指定，或者容器中没有配置StorageComponent时，该配置被激活

## ZipkinHealthIndicator

Zipkin健康自检的类，实现了springboot-actuate的CompositeHealthIndicator，提供系统组件的健康信息

```java
final class ZipkinHealthIndicator extends CompositeHealthIndicator {
  ZipkinHealthIndicator(HealthAggregator healthAggregator) {
    super(healthAggregator);
  }
  void addComponent(Component component) {
    String healthName = component instanceof V2StorageComponent
      ? ((V2StorageComponent) component).delegate().getClass().getSimpleName()
      : component.getClass().getSimpleName();
    healthName = healthName.replace("AutoValue_", "");
    addHealthIndicator(healthName, new ComponentHealthIndicator(component));
  }
  static final class ComponentHealthIndicator implements HealthIndicator {
    final Component component;
    ComponentHealthIndicator(Component component) {
      this.component = component;
    }
    @Override public Health health() {
      Component.CheckResult result = component.check();
      return result.ok ? Health.up().build() : Health.down(result.exception).build();
    }
  }
}
```

## RegisterZipkinHealthIndicators

启动时加载的RegisterZipkinHealthIndicators类，当启动启动后，收到ApplicationReadyEvent事件，即系统已经启动完毕，会将Spring容器中的zipkin.Component添加到ZipkinHealthIndicator中

```java
public final class RegisterZipkinHealthIndicators implements ApplicationListener {
  @Override public void onApplicationEvent(ApplicationEvent event) {
    if (!(event instanceof ApplicationReadyEvent)) return;
    ConfigurableListableBeanFactory beanFactory =
        ((ApplicationReadyEvent) event).getApplicationContext().getBeanFactory();
    ZipkinHealthIndicator healthIndicator = beanFactory.getBean(ZipkinHealthIndicator.class);
    for (Component component : beanFactory.getBeansOfType(Component.class).values()) {
      healthIndicator.addComponent(component);
    }
  }
}
```

启动zipkin，访问下面地址，可以看到输出zipkin的健康检查信息

[http://localhost:9411/health.json](http://localhost:9411/health.json)

```java
{"status":"UP","zipkin":{"status":"UP","InMemoryStorage":{"status":"UP"}},"diskSpace":{"status":"UP","total":429495595008,"free":392936411136,"threshold":10485760}}
```

## ZipkinHttpCollector

Zipkin默认的Collector使用http协议里收集Trace信息，客户端均调用/api/v1/spans或/api/v2/spans来上报trace信息

```java
  @Autowired ZipkinHttpCollector(StorageComponent storage, CollectorSampler sampler,
      CollectorMetrics metrics) {
    this.metrics = metrics.forTransport("http");
    this.collector = Collector.builder(getClass())
        .storage(storage).sampler(sampler).metrics(this.metrics).build();
  }
  @RequestMapping(value = "/api/v2/spans", method = POST)
  public ListenableFuture<ResponseEntity<?>> uploadSpansJson2(
    @RequestHeader(value = "Content-Encoding", required = false) String encoding,
    @RequestBody byte[] body
  ) {
    return validateAndStoreSpans(encoding, JSON2_DECODER, body);
  }
  ListenableFuture<ResponseEntity<?>> validateAndStoreSpans(String encoding, SpanDecoder decoder,
      byte[] body) {
    SettableListenableFuture<ResponseEntity<?>> result = new SettableListenableFuture<>();
    metrics.incrementMessages();
    if (encoding != null && encoding.contains("gzip")) {
      try {
        body = gunzip(body);
      } catch (IOException e) {
        metrics.incrementMessagesDropped();
        result.set(ResponseEntity.badRequest().body("Cannot gunzip spans: " + e.getMessage() + "\n"));
      }
    }
    collector.acceptSpans(body, decoder, new Callback<Void>() {
      @Override public void onSuccess(@Nullable Void value) {
        result.set(SUCCESS);
      }
      @Override public void onError(Throwable t) {
        String message = t.getMessage() == null ? t.getClass().getSimpleName() : t.getMessage();
        result.set(t.getMessage() == null || message.startsWith("Cannot store")
            ? ResponseEntity.status(500).body(message + "\n")
            : ResponseEntity.status(400).body(message + "\n"));
      }
    });
    return result;
  }
```

ZipkinHttpCollector中uploadSpansJson2方法接受所有/api/v2/spans请求，然后调用validateAndStoreSpans方法校验并存储Span

在validateAndStoreSpans方法中，当请求数据为gzip格式，会先解压缩，然后调用collector的acceptSpans方法

## Collector

zipkin.collector.Collector的acceptSpans方法中，对各种格式的Span数据做了兼容处理，我们这里只看下V2版的JSON格式的Span是如何处理的，即会调用storage2(V2Collector)的acceptSpans方法

```java
public class Collector
  extends zipkin.internal.Collector<SpanDecoder, zipkin.Span> {
  @Override
  public void acceptSpans(byte[] serializedSpans, SpanDecoder decoder, Callback<Void> callback) {
    try {
      if (decoder instanceof DetectingSpanDecoder) decoder = detectFormat(serializedSpans);
    } catch (RuntimeException e) {
      metrics.incrementBytes(serializedSpans.length);
      callback.onError(errorReading(e));
      return;
    }
    if (storage2 != null && decoder instanceof V2JsonSpanDecoder) {
      storage2.acceptSpans(serializedSpans, SpanBytesDecoder.JSON_V2, callback);
    } else {
      super.acceptSpans(serializedSpans, decoder, callback);
    }
  }
}
```

## V2Collector

zipkin.internal.V2Collector继承了zipkin.internal.Collector，而在Collector的acceptSpans方法中会调用decodeList先将传入的二进制数据转换成Span对象，然后调用accept方法，accept方法中会调用sampled方法，将需要采样的Span过滤出来，最后调用record方法将Span信息存入Storage中。

```java
public abstract class Collector<D, S> {
  protected void acceptSpans(byte[] serializedSpans, D decoder, Callback<Void> callback) {
    metrics.incrementBytes(serializedSpans.length);
    List<S> spans;
    try {
      spans = decodeList(decoder, serializedSpans);
    } catch (RuntimeException e) {
      callback.onError(errorReading(e));
      return;
    }
    accept(spans, callback);
  }
  public void accept(List<S> spans, Callback<Void> callback) {
    if (spans.isEmpty()) {
      callback.onSuccess(null);
      return;
    }
    metrics.incrementSpans(spans.size());
    List<S> sampled = sample(spans);
    if (sampled.isEmpty()) {
      callback.onSuccess(null);
      return;
    }
    try {
      record(sampled, acceptSpansCallback(sampled));
      callback.onSuccess(null);
    } catch (RuntimeException e) {
      callback.onError(errorStoringSpans(sampled, e));
      return;
    }
  }
  List<S> sample(List<S> input) {
    List<S> sampled = new ArrayList<>(input.size());
    for (S s : input) {
      if (isSampled(s)) sampled.add(s);
    }
    int dropped = input.size() - sampled.size();
    if (dropped > 0) metrics.incrementSpansDropped(dropped);
    return sampled;
  }
}
```

V2Collector中的record方法会调用storage的accept方法，zipkin默认会使用InMemoryStorage来存储

```java
public final class V2Collector extends Collector<BytesDecoder<Span>, Span> {
  @Override protected List<Span> decodeList(BytesDecoder<Span> decoder, byte[] serialized) {
    List<Span> out = new ArrayList<>();
    if (!decoder.decodeList(serialized, out)) return Collections.emptyList();
    return out;
  }
  @Override protected boolean isSampled(Span span) {
    return sampler.isSampled(Util.lowerHexToUnsignedLong(span.traceId()), span.debug());
  }
  @Override protected void record(List<Span> sampled, Callback<Void> callback) {
    storage.spanConsumer().accept(sampled).enqueue(new V2CallbackAdapter<>(callback));
  }
}
```

## ZipkinQueryApiV1 & ZipkinQueryApiV2

暴露了Zipkin对外的查询API，V1和V2的区别，主要是Span里的字段叫法不一样了，这里主要看下ZipkinQueryApiV2，ZipkinQueryApiV2方法都比较简单，主要是调用storage组件来实现查询功能。

dependencies - 查看所有trace的依赖关系

services - 查看所有的services

spans - 根据serviceName查询spans信息

traces - 根据serviceName，spanName，annotationQuery，minDuration，maxDuration等来搜索traces信息

trace/{traceIdHex} - 根据traceId查询某条trace信息

至此ZipkinServer的代码分析的差不多了，在后面博文中我们再具体分析各种Storage，和Collector的源代码。
