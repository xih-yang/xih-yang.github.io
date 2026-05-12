# 02、Prometheus - 之Prometheus FIRST STEPS
- 来源：https://ddkk.com/zhuanlan/monitoring/prometheus/2.html
- 分类：监控工具
- 分组：教程目录
## 0.前言

本文来自Prometheus官网手册`https://prometheus.io/docs/introduction/first_steps/`和Prometheus简介`https://prometheus.fuckcloudnative.io/`。

## 1.说明

Prometheus是一个监控平台，通过在监控目标上的HTTP端点来收集受监控目标的指标。本指南将向您展示如何使用Prometheus安装，配置和监控我们的第一个资源。 您将下载，安装并运行Prometheus。您还将下载并安装exporter，这些工具可在主机和服务上公开时间序列数据。我们的第一个exporter将是Prometheus本身，它提供了有关内存使用，垃圾收集等的各种主机级指标。

## 2.下载 Prometheus

在你的平台上下载最新的版本`https://prometheus.io/download/`，然后解压它：

```sh
tar xvfz prometheus-*.tar.gz
cd prometheus-*
```

Prometheus服务器是一个称为prometheus（或Microsoft Windows上的prometheus.exe）的二进制文件。我们可以运行二进制文件，并通过传递--help标志来查看有关其选项的帮助。

```sh
./prometheus --help
usage: prometheus [<flags>]
The Prometheus monitoring server
Flags:
#帮助
  -h, --help                     Show context-sensitive help (also try --help-long and --help-man).
#版本
      --version                  Show application version.
#配置文件
      --config.file="prometheus.yml"  
                                 Prometheus configuration file path.
#监听端口
      --web.listen-address="0.0.0.0:9090"  
                                 Address to listen on for UI, API, and telemetry.
#空闲连接的超时时间
      --web.read-timeout=5m      Maximum duration before timing out read of the request, and closing idle connections.
#最大连接数
      --web.max-connections=512  Maximum number of simultaneous connections.
#可从外部访问Prometheus的URL（例如，如果Prometheus是通过反向代理提供的）。 用于生成返回到Prometheus本身的相对和绝对链接。 如果URL包含路径部分，它将被用作Prometheus服务的所有HTTP端点的前缀。 如果省略，则会自动派生相关的URL组件。
      --web.external-url=<URL>   The URL under which Prometheus is externally reachable (for example, if Prometheus is served via a reverse proxy). Used for generating relative and absolute links back to Prometheus itself. If
                                 the URL has a path portion, it will be used to prefix all HTTP endpoints served by Prometheus. If omitted, relevant URL components will be derived automatically.
#内部路由的前缀。 默认为--web.external-url的路径。
      --web.route-prefix=<path>  Prefix for the internal routes of web endpoints. Defaults to path of --web.external-url.
#静态资源目录的路径，位于/user      
      --web.user-assets=<path>   Path to static asset directory, available at /user.
#启用是否通过http请求重新加载
      --web.enable-lifecycle     Enable shutdown and reload via HTTP request.
#管理控制操作启用API端点
      --web.enable-admin-api     Enable API endpoints for admin control actions.
#模板目录的路径，位于/consoles
      --web.console.templates="consoles"  
                                 Path to the console template directory, available at /consoles.
#控制台库目录的路径
      --web.console.libraries="console_libraries"  
                                 Path to the console library directory.
#Prometheus实例页面的文档标题
      --web.page-title="Prometheus Time Series Collection and Processing Server"  
                                 Document title of Prometheus instance.
#用于CORS来源的正则表达式。
      --web.cors.origin=".*"     Regex for CORS origin. It is fully anchored. Example: 'https?://(domain1|domain2)\.com'
#指标(数据）存储的基本路径
      --storage.tsdb.path="data/"  
                                 Base path for metrics storage.
#将数据保留多长时间。此标志已被弃用，请改用"storage.tsdb.retention.time"。                              
      --storage.tsdb.retention=STORAGE.TSDB.RETENTION  
                                 [DEPRECATED] How long to retain samples in storage. This flag has been deprecated, use "storage.tsdb.retention.time" instead.
#将数据保留多长时间。默认15天
      --storage.tsdb.retention.time=STORAGE.TSDB.RETENTION.TIME  
                                 How long to retain samples in storage. When this flag is set it overrides "storage.tsdb.retention". If neither this flag nor "storage.tsdb.retention" nor "storage.tsdb.retention.size" is set,
                                 the retention time defaults to 15d. Units Supported: y, w, d, h, m, s, ms.
#可以为块存储的最大字节数。 支持的单位：KB，MB，GB，TB，PB。
      --storage.tsdb.retention.size=STORAGE.TSDB.RETENTION.SIZE  
                                 [EXPERIMENTAL] Maximum number of bytes that can be stored for blocks. A unit is required, supported units: B, KB, MB, GB, TB, PB, EB. Ex: "512MB". This flag is experimental and can be changed in
                                 future releases.
#不在数据目录中创建锁文件
      --storage.tsdb.no-lockfile  
                                 Do not create lockfile in data directory.
#允许重叠的块，从而启用垂直压缩和垂直查询合并。
      --storage.tsdb.allow-overlapping-blocks  
                                 [EXPERIMENTAL] Allow overlapping blocks, which in turn enables vertical compaction and vertical query merge.
#压缩tsdb WAL
      --storage.tsdb.wal-compression  
                                 Compress the tsdb WAL.
#关闭或配置重新加载时等待刷写数据的时间
      --storage.remote.flush-deadline=<duration>  
                                 How long to wait flushing sample on shutdown or config reload.
#在单个查询中通过远程读取接口返回的最大样本总数。 0表示没有限制。 对于流式响应类型，将忽略此限制。
      --storage.remote.read-sample-limit=5e7  
                                 Maximum overall number of samples to return via the remote read interface, in a single query. 0 means no limit. This limit is ignored for streamed response types.
#并发远程读取调用的最大数目。 0表示没有限制。
      --storage.remote.read-concurrent-limit=10  
                                 Maximum number of concurrent remote read calls. 0 means no limit.
#用于流式传输远程读取响应类型的单个帧中的最大字节数。 请注意，客户端也可能会限制帧大小。 1MB为默认情况下由protobuf推荐。
      --storage.remote.read-max-bytes-in-frame=1048576  
                                 Maximum number of bytes in a single frame for streaming remote read response types before marshalling. Note that client might have limit on frame size as well. 1MB as recommended by protobuf by
                                 default.
#容忍中断以恢复警报“ for”状态的最长时间。
      --rules.alert.for-outage-tolerance=1h  
                                 Max time to tolerate prometheus outage for restoring "for" state of alert.
#警报和恢复的“ for”状态之间的最短持续时间。 仅对于配置的“ for”时间大于宽限期的警报，才保持此状态。
      --rules.alert.for-grace-period=10m  
                                 Minimum duration between alert and restored "for" state. This is maintained only for alerts with configured "for" time greater than grace period.
#将警报重新发送到Alertmanager之前等待的最短时间。
      --rules.alert.resend-delay=1m  
                                 Minimum amount of time to wait before resending an alert to Alertmanager.
#等待的Alertmanager通知的队列容量。
      --alertmanager.notification-queue-capacity=10000  
                                 The capacity of the queue for pending Alertmanager notifications.
#向Alertmanager发送警报的超时。
      --alertmanager.timeout=10s  
                                 Timeout for sending alerts to Alertmanager.
#在表达式求值期间检索指标的最大回溯持续时间。
      --query.lookback-delta=5m  The maximum lookback duration for retrieving metrics during expression evaluations and federation.
#最大查询时间。
      --query.timeout=2m         Maximum time a query may take before being aborted.
#最大查询并发数。
      --query.max-concurrency=20  
                                 Maximum number of queries executed concurrently.
#单个查询可以加载到内存中的最大样本数。 请注意，如果查询尝试将更多的样本加载到内存中，则查询将失败，因此这也限制了查询可以返回的样本数。
      --query.max-samples=50000000  
                                 Maximum number of samples a single query can load into memory. Note that queries will fail if they try to load more samples than this into memory, so this also limits the number of samples a
                                 query can return.
#日志级别
      --log.level=info           Only log messages with the given severity or above. One of: [debug, info, warn, error]
#日志格式
      --log.format=logfmt        Output format of log messages. One of: [logfmt, json]
```

在启动Prometheus之前，让我们对其进行配置。

## 3.配置 Prometheus

Prometheus配置是YAML，Prometheus下载包里附带一个名为prometheus.yml的文件中的示例配置，这是一个很好的入门之处。我们删除了示例文件中的大部分注释，使其更简洁（注释是以＃为前缀的行）。

```sh
global:
  scrape_interval:     15s 抓取频率
  scrape_timeout:      10s 抓取超时
  evaluation_interval: 15s 评估规则评率
rule_files:
  - "first.rules"
  - "second.rules"
scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets: ['localhost:9090']
```

示例配置文件中有三个配置块：global，rule_files和scrape_configs。

- global：控制Prometheus服务器的全局配置。第一个是scrape_interval，它控制Prometheus抓取目标的频率，也可以为单个目标重写此值。在这种例子下，全局设置是每15s抓取一次。 evaluation_interval选项控制Prometheus评估规则的频率。 Prometheus使用规则创建新的时间序列并生成警报。
- rule_files：Prometheus服务器加载的任何规则的位置。 现在我们没有规则。
- scrape_configs：Prometheus监视的资源。 由于Prometheus还将自己的数据公开为HTTP端点，因此它可以抓取并监控自身的健康状况。 在默认配置中，有一个名为prometheus的作业，它会抓取Prometheus服务器公开的时间序列数据。 包含一个静态配置的目标，即端口9090上的localhost。Prometheus希望指标在/metrics路径上的目标上可用。 所以这个默认的工作是通过URL抓取：http//localhost:9090/metrics。返回的时间序列数据将详细说明Prometheus服务器的状态和性能。

有关配置选项的完整规范，请参阅配置文档`https://prometheus.io/docs/prometheus/latest/configuration/configuration/`。

## 4.启动 Prometheus

要使用我们新创建的配置文件启动Prometheus，请切换到包含Prometheus二进制文件的目录并运行：

```sh
./prometheus --config.file = prometheus.yml
```

Prometheus启动后应该能够在`http//localhost:9090`浏览到状态页面，给它大约30秒的时间从自己的HTTP指标端点收集有关自己的数据。还可以通过导航到其自己的指标端点来验证是否正在提供有关自身的指标：`http//localhost:9090/metrics`。

## 5.使用表达式浏览器

让我们试着看一下Prometheus收集的关于自己的一些数据。 要使用Prometheus的内置表达式浏览器，请导航到`http//localhost:9090/graph`并在"Graph"选项卡中选择"Console"视图。

Prometheus导出的一个度量标准称为`promhttp_metric_handler_requests_total`（Prometheus服务器已服务的/metrics请求的总数）。 继续并将其输入表达式控制台：

```sh
promhttp_metric_handler_requests_total
```

这应该返回许多不同的时间序列（以及为每个记录的最新值），所有时间序列都使用度量标准名称`promhttp_metric_handler_requests_total`，但具有不同的标签。 这些标签指定不同的请求状态。

如果我们只对导致HTTP代码200的请求感兴趣，我们可以使用此查询来检索该信息：

```sh
promhttp_metric_handler_requests_total{code="200"}
```

要计算返回的时间序列总数，您可以写：

```sh
count(promhttp_metric_handler_requests_total)
```

有关表达式语言的更多信息，请参阅表达式语言文档`https://prometheus.io/docs/prometheus/latest/querying/basics/`。

## 6.适用图表接口

要绘制表达式图表，请导航到`http//localhost:9090/graph` graph并使用"图表"选项卡。

例如，输入以下表达式来绘制在自我抓取的Prometheus中发生的返回状态代码200的每秒HTTP请求率：

```sh
rate(promhttp_metric_handler_requests_total{code="200"}[1m])
```

您可以尝试使用图形范围参数和其他设置。

## 7.监控其他目标

仅从Prometheus那里收集指标并不能很好地反映Prometheus的能力。 为了更好地了解Prometheus可以做什么，我们建议您浏览有关其他exporter的文档。 使用node exporter指南监控Linux或macOS主机指标`https://prometheus.io/docs/guides/node-exporter/`是一个很好的起点。

## 8.总结

在本指南中，您安装了Prometheus，配置了Prometheus实例来监视资源，并学习了在Prometheus表达式浏览器中处理时间序列数据的一些基础知识。 要继续了解Prometheus，请查看概述，了解接下来要探索的内容。
