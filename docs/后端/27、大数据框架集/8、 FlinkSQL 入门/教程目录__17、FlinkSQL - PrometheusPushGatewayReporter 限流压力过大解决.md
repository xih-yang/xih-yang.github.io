# 17、FlinkSQL - PrometheusPushGatewayReporter 限流压力过大解决
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/3/17.html
- 分类：大数据框架
- 分组：教程目录
## 背景

Flink 的指标非常多，同时由于参数配置的不正确，导致指标上报频率过快，PushGateway集群压力过大。

## 相关文章

如果读者在找限流、拦截指标的做法，可参考我的其他文章，本篇略显敷衍的文章是记录如何使用 Nginx 对指标上报过程中进一步进行限流。

[【Flink系列】使用OpenResty 在InfluxDB协议层拦截Flink指标](/zhuanlan/bigdata/flink/3/13.html)

[【Flink系列】构建实时计算平台——特别篇，用InfluxDb收集Flink Metrics](/zhuanlan/bigdata/flink/3/3.html)

## 解决方案

Nginx + limit_req

## 代码

```java
location ^~ /metrics/job/flink {
    limit_req zone=one nodelay;
    limit_req_status 503;
    error_page 503 =200/process_503;
    ...
    ...
    }
location /process_503{
    return 200;
}
```

## 结论

指标上报的时候，超出频率，会返回503，导致NodeManager上打印StackTrace，对排查错误有不良影响，所以process_503直接返回200。避免Prometheus client 报错。
