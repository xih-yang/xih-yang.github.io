# 03、Prometheus - 之Prometheus概念：数据模型、metric类型、任务、实例
- 来源：https://ddkk.com/zhuanlan/monitoring/prometheus/3.html
- 分类：监控工具
- 分组：教程目录
## 0.前言

## 1.说明

Prometheus从根本上存储的所有数据都是[时间序列](https://en.wikipedia.org/wiki/Time_series): 具有时间戳的数据流只属于单个度量指标和该度量指标下的多个标签维度。除了存储时间序列数据外，Prometheus还可以生成临时派生的时间序列作为查询的结果。

### 1.1metrics和labels(度量指标名称和标签)

每一个时间序列数据由metric度量指标名称和它的标签labels键值对集合唯一确定。

这个metric度量指标名称指定监控目标系统的测量特征（如：`http_requests_total`接收http请求的总计数）。

注意：冒号保留用于用户定义的录制规则。 它们不应被exporter或直接仪表使用。

labels开启了Prometheus的多维数据模型：对于相同的度量名称，通过不同标签列表的结合, 会形成特定的度量维度实例。(例如：所有包含度量名称为/api/tracks的http请求，打上`method=POST`的标签，则形成了具体的http请求)。这个查询语言在这些度量和标签列表的基础上进行过滤和聚合。改变任何度量上的任何标签值，则会形成新的时间序列图。

metric度量指标可能包含ASCII字母、数字、下划线和冒号，他必须配正则表达式`[a-zA-Z_:][a-zA-Z0-9_:]*`。

label标签名称可以包含ASCII字母、数字和下划线。它们必须匹配正则表达式`[a-zA-Z_][a-zA-Z0-9_]*`。

带有_下划线的标签名称被保留内部使用，标签labels值包含任意的Unicode码。

具体详见[metrics和labels命名最佳实践](https://prometheus.io/docs/practices/naming/)。

### 1.2样本

样本形成了实际的时间序列数据列表。每个采样值包括：

- 一个64位的浮点值
- 一个精确到毫秒级的时间戳

### 1.3Notation(符号)

表示一个度量指标和一组键值对标签，需要使用以下符号：

```sh
[metric name]{[label name]=[label value], ...}
```

例如，度量指标名称是`api_http_requests_total`， 标签为`method="POST"`, `handler="/messages"` 的示例如下所示：

```sh
api_http_requests_total{method="POST", handler="/messages"}
```

这些命名和OpenTSDB使用方法是一样的。

### 1.4度量指标类型

Prometheus客户端库提供了四种核心的metrics类型，这四种类型目前仅在客户端库和wire协议中区分。Prometheus服务还没有充分利用这些类型，将来可能会发生改变。

### 1.5Counter(计数器)

counter 是表示单个单调递增计数器的累积度量，其值只能在重启时增加或重置为零。 例如，您可以使用计数器来表示所服务的请求数，已完成的任务或错误。

不要使用计数器来暴露可能减少的值。例如，不要使用计数器来处理当前正在运行的进程数，而是使用gauge。

客户端使用计数器的文档：

- [Go](https://pkg.go.dev/github.com/prometheus/client_golang/prometheus#Counter)
- [Java](https://github.com/prometheus/client_java/blob/master/simpleclient/src/main/java/io/prometheus/client/Counter.java)
- [Python](https://github.com/prometheus/client_python#counter)
- [Ruby](https://github.com/prometheus/client_ruby#counter)

### 1.6Gauge(测量器)

gauge是一个度量指标，它表示一个既可以递增, 又可以递减的值。

测量器主要测量类似于温度、当前内存使用量等，也可以统计当前服务运行随时增加或者减少的Goroutines数量

客户端使用计量器的文档：

- [Go](https://pkg.go.dev/github.com/prometheus/client_golang/prometheus#Gauge)
- [Java](https://github.com/prometheus/client_java/blob/master/simpleclient/src/main/java/io/prometheus/client/Gauge.java)
- [Python](https://github.com/prometheus/client_python#gauge)
- [Ruby](https://github.com/prometheus/client_ruby#gauge)

### 1.7Histogram(柱状图)

直方图对观察结果进行采样（通常是请求持续时间或响应大小等），并将其计入可配置存储桶中。它还提供所有观察值的总和。基本度量标准名称为的直方图在scrape期间显示多个时间序列：

- 暴露的观察桶的累积计数器：``_bucket{le="``"}
- 所有观测值的总和：``_sum
- 已观察到的事件数：``_count，和``_bucket{le="+Inf"}相同

使用[histogram_quantile函数](https://prometheus.io/docs/prometheus/latest/querying/functions/#histogram_quantile), 计算直方图或者是直方图聚合计算的分位数阈值。 一个直方图计算[Apdex值](https://en.wikipedia.org/wiki/Apdex)也是合适的, 当在buckets上操作时，记住直方图是累计的。详见[直方图和总结](https://prometheus.io/docs/practices/histograms/)

客户库的直方图使用文档：

- [Go](https://pkg.go.dev/github.com/prometheus/client_golang/prometheus#Histogram)
- [Java](https://github.com/prometheus/client_java/blob/master/simpleclient/src/main/java/io/prometheus/client/Summary.java)
- [Python](https://github.com/prometheus/client_python#histogram)
- [Ruby](https://github.com/prometheus/client_ruby#summary)

### 1.8Summary

类似histogram柱状图，summary是采样点分位图统计(通常是请求持续时间和响应大小等)。虽然它还提供观察的总数和所有观测值的总和，但它在滑动时间窗口上计算可配置的分位数。基本度量标准名称``的`summary`在scrape期间公开了多个时间序列：

- 流φ-quantiles (0 ≤ φ ≤ 1), 显示为``{quantiles="[φ]"}
- ``_sum， 是指所有观察值的总和
- ``_count, 是指已观察到的事件计数值

有关φ-分位数，Summary用法和histogram图差异的详细说明，详见[histogram和summaries](https://prometheus.io/docs/practices/histograms/)

有关`summaries`的客户端使用文档：

- [Go](https://pkg.go.dev/github.com/prometheus/client_golang/prometheus#Summary)
- [Java](https://github.com/prometheus/client_java/blob/master/simpleclient/src/main/java/io/prometheus/client/Summary.java)
- [Python](https://github.com/prometheus/client_python#summary)
- [Ruby](https://github.com/prometheus/client_ruby#summary)

## 2.任务与实例

就Prometheus而言，pull拉取采样点的端点服务称之为instance，通常对应一个过程（实例）。具有相同目的的instance，例如，为可伸缩性或可靠性而复制的流程称为作业，构成了一个job。

例如,一个被称作api-server的任务有四个相同的实例。

```sh
job: api-server
instance 1：1.2.3.4:5670
instance 2：1.2.3.4:5671
instance 3：5.6.7.8:5670
instance 4：5.6.7.8:5671
```

### 2.1自动化生成的标签和时间序列

当Prometheus拉取一个目标，会自动地把两个标签添加到度量名称的标签列表中，分别是：

```sh
job: 目标所属的配置任务名称。
instance: 被抓取的目标网址的一部分: host:port
```

如果以上两个标签二者之一存在于采样点中，这个取决于honor_labels配置选项。详见[文档](https://prometheus.io/docs/prometheus/latest/configuration/configuration/#%3Cscrape_config%3E)

对于每个采样点所在服务instance，Prometheus都会存储以下的度量指标采样点：

```sh
up{job="[job-name]", instance="instance-id"}:1，表示采样点所在服务健康；0，标识抓取失败
scrape_duration_seconds{job="[job-name]", instance="[instance-id]"}: 抓取的持续时间
scrape_samples_post_metric_relabeling{job="<job-name>", instance="<instance-id>"}: 应用度量标准重新标记后剩余的样本数。
scrape_samples_scraped{job="<job-name>", instance="<instance-id>"}: 目标暴露的样本数量。
```

运行时间序列对于实例可用性监视很有用。
