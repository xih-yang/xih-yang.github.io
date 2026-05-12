# 13、Kubernetes - 实战：在Kubernetes部署Jaeger并进行trace管理
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/4/13.html
- 分类：容器服务
- 分组：教程目录
## 一、前言

在云原生的生产环境中，大量微服务和中间件的部署以及微服务之间复杂的调用关系会将业务系统排查的难度提高一个数量级，而一个优秀的APM系统是复杂的分布式业务系统进行问题排查最强大的帮手之一，一个好的APM系统可以更直观的反应系统内部的业务流，帮你快速将问题锁定在几个相关的上下游模块。

Uber开源的分布式系统调用链跟踪方案[Jaeger](https://www.jaegertracing.io/)能够在云原生快速部署的情况下，支持大规模、分布式、近实时的APM。根据Jaeger网站的描述，Uber现在每天使用Jaeger处理好几十亿的span。

## 二、Jaeger系统方案

### 2.1 Jaegr的功能特点

根据Jaeger的官网描述，Jager具有以下的功能：

- 分布式上下文传递
- 分布式业务监控
- RCA
- 服务依赖分析
- 性能调优

它的优秀的能力包括：

- 可扩展
- 对OpenTracing的原生支持
- 多后端存储的支持(Cassandra/ES/InfluxDB/DynamoDB etc.)
- 优秀的UI
- 云原生的部署
- 可观测性(和Prometheus的高度集成)
- 兼容Zipkin

同时，由于Jaeger是一款入侵性的APM，所以Jaeger还提供了多种客户端lib的支持。

### 2.2 Jaeger的架构方案

由于APM系统面对的通常是业务系统3～5倍甚至更多的TPS，所以APM面临的接入、存储、聚合和查询的压力是非常大的，一个好的APM系统必定是一个分布式可扩展的高性能系统。

根据不同的业务情况，需要选择不同的Jaeger架构进行部署实时。对于一些低TPS的CRM、BI、OA等业务系统，可以使用如下的架构快速部署：

基于Jaeger的低TPS系统APM方案

在这一架构中，Jaeger Clooector会直接将client/agent上报的Span存储到es或者ca这样的存储中，这一的架构可以快速进行改造和实施，缺点是无法低于高TPS系统的请求。而针对高TPS的业务流，需要使用kafka进行压力缓冲，具体架构如下：

基于Jaeger的高TPS系统APM方案

在这一架构中，kafka将业务接入和业务存储进行分离，可以提供业务压力缓存并增加系统可用性；而es可以提供强大的存储、聚合和查询功能，为最终的分析提供强大的后端支持；同时可以在es开启时间清理特性，保证trace数据的总存储量可控。

与此同时，Jaeger还提供了灵活的采样配置项以控制trace数据的tps：

- const，全量采集，采样率设置0/1 分别对应打开和关闭
- probabilistic ，概率采集，0~1之间取值，
- rateLimiting ，限速采集，每秒只能采集一定量的数据
- remote ，一种动态采集策略，根据当前系统的访问量调节采集策略

同时Jaeger还提供了一些tuning tip来提高Jaeger系统的性能：

[https://www.jaegertracing.io/docs/1.17/performance-tuning/](https://www.jaegertracing.io/docs/1.17/performance-tuning/)

## 三、快速部署Jaeger系统

### 3.1 获取代码

```java
git clone https://github.com/jaegertracing/jaeger-kubernetes.git
```

### 3.2 部署

```java
kubectl create ns jaeger
```

修改production/cassandra.yml选择使用合适的存储：

修改文件jaeger-production-template.yml：

最后为Jaeger UI增加Ingress

```java
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: jaeger-ui
  namespace: jaeger
spec:
  rules:
  - host: jaeger.test.com
    http:
      paths:
      - path: /
        backend:
          serviceName: jaeger-query
          servicePort: 80
```

最新的版本还可以通过Operator的方式进行部署([https://www.jaegertracing.io/docs/1.17/operator/](https://www.jaegertracing.io/docs/1.17/operator/))，支持如下几种业务方式：

- AllInOne (Default) strategy
- Production strategy
- Streaming strategy

## 四、使用Jaeger进行APM demo

在Jaeger的官网，提供了一个例子进行APM的demo：

[https://www.jaegertracing.io/docs/1.17/getting-started/#sample-app-hotrod](https://www.jaegertracing.io/docs/1.17/getting-started/#sample-app-hotrod)

这个例子里面的调用关系如下：

这个例子模拟了微服务之间的调用，微服务对中间件的调用，以及各种调用的成功和失败的情况，可以比较直接的反应jaeger的APM能力。

进行部署之后，可以进行访问：

并进行如下分析：
