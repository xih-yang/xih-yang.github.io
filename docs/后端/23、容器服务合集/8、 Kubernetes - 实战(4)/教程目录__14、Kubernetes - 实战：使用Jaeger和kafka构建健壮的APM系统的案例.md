# 14、Kubernetes - 实战：使用Jaeger和kafka构建健壮的APM系统的案例
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/4/14.html
- 分类：容器服务
- 分组：教程目录
## 一、前言

文章[在Kubernetes部署Jaeger并进行trace管理》](/zhuanlan/container/kubernetes/4/13.html)介绍了使用Jaeger进行APM的基本架构和测试案例，并且提及了使用Kafka和ES构建更健壮和高能力的Jaeger APM系统的架构方案：

在文章[《](https://www.confluent.io/blog/fault-tolerance-distributed-systems-tracing-with-apache-kafka-jaeger/)[Fault Tolerance in Distributed Systems: Tracing with Apache Kafka and Jaeger](https://www.confluent.io/blog/fault-tolerance-distributed-systems-tracing-with-apache-kafka-jaeger/)[》](https://www.confluent.io/blog/fault-tolerance-distributed-systems-tracing-with-apache-kafka-jaeger/)和文章[《Distributed Tracing with Apache Kafka and Jaeger》](https://objectpartners.com/2019/04/25/distributed-tracing-with-apache-kafka-and-jaeger/)中，作者demo了上述通过kafka进行Jaeger Span中转的方案，这个方案可以：

- 减轻业务系统Span接入的压力
- 增加系统健壮性
- 提供跨kafka的服务之间的可跟踪性

## 二、问题描述

在原生的Jaeger系统中，主要存在以下问题

- 系统不支持、高频率Span的实时接入和存储(Jaeger client/agent是分布式的，但是Jaeger collector是存在接入能力瓶颈的)
- 系统的缺乏健壮性，Jaeger Collector的失败会导致trace数据的丢失
- 系统无法跟踪经由kafka结偶的微服务系统之间的调用关系

比如在案例中，服务调用关系如下：

通过kafka进行数据交互的系统

中间的stream-app、spring-consumer-app和consumer-app存在通过kafka topic进行信息交换的关系，但是在原生的jaeger系统中，生产方在数据经过kafka之后就无法通过trace id和数据消费放进行span连接，导致出现如下的业务系统trace碎片化的问题：

基于Kafka的业务系统的trace碎片化

## 三、解决方案

### 3.1 使用kafka进行trace span的接入

kafka集群能够轻松的接入高频和大批量的span数据，并且进行短时间的中专，但是要达到这个目的，必须对Jaeger client进行修改，作为kafka topic的生产者注入span到指定的topic：

```java
    @PostConstruct
    public void setClientSupplierForStreams() {
        streamsBuilderFactory.setClientSupplier(new TracingKafkaClientSupplier(tracer()));
    }
```

```java
    KafkaProducer producer = new KafkaProducer(properties);
    return new TracingKafkaProducer(producer, tracer);
```

这样，Jaeger client将不会直接将数据发送到agent或者collector，而是先在kafka进行缓存。

### 3.2 将kafka中的span放入Jaeger系统

span进入kafka之后，需要指定topic数据的消费者处理这些数据，并发送给collector：

```java
    KafkaConsumer consumer = new KafkaConsumer(properties);
    consumer.subscribe(Collections.singletonList(sentenceTopic));
    return new TracingKafkaConsumer(consumer, tracer);
```

到此为止，我们可以使用kafka作为中间buffer，近实时的接入高频次大批量数据。最后需要解决的问题是将被kafka数据交互分割的业务流程trace在Jaeger里面串联起来，这里就需要将trace id放入kafka进行传递。

### 3.3 使用kafka header补救kafka横断

将“关联信息”插入kafka业务消息header，业务系统在消费数据的时候就可以获取trace id并且在生成trace的时候加以引用：

```java
    ProducerRecord producerRecord = new ProducerRecord(sentenceTopic, null, null, sentence, headers);
```

返回消息也需要携带id：

```java
    HttpHeaders responseHeaders = new HttpHeaders();
    tracer.inject(span.context(), Format.Builtin.HTTP_HEADERS, new HttpHeadersCarrier(responseHeaders));
    return new ResponseEntity(Integer.toString(randomNumber), responseHeaders, HttpStatus.OK);
```

## 四、测试

### 4.1 部署

获取代码：

[https://github.com/burkaa01/jaeger-tracing-kafka-sender](https://github.com/burkaa01/jaeger-tracing-kafka-sender)

启动系统：

```java
docker-compose up -d
```

这个系统包括业务系统、Jaeger、Kafka、ES等：

同时为了便于查看，还部署了kibana系统：

docker-compose.yaml

```java
version: "3.2"
services:
  kibana:
    image: kibana:6.5.0
    restart: always
    environment:
      ELASTICSEARCH_URL: "http://172.172.222.121:9200"
    ports:
       - "5601:5601"
```

### 4.2 注入数据

进入jaeger-tracing-kafka-sender，运行：

```java
cd ./kafka-connect/file-source
curl -X POST -H "Content-Type: application/json" --data @file-source.json http://localhost:8083/connectors
curl http://localhost:8083/connectors
cd ../elastic-sink
curl -X POST -H "Content-Type: application/json" --data @elastic-sink.json http://localhost:8083/connectors
curl http://localhost:8083/connectors
```

### 4.3 查看结果

Jaeger UI的trace有8个span

Elastic Search里面的数据：
