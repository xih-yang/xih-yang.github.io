# 08、Prometheus - 之Prometheus API说明
- 来源：https://ddkk.com/zhuanlan/monitoring/prometheus/8.html
- 分类：监控工具
- 分组：教程目录
## 0.前言

## 1.HTTP API

在Prometheus服务器上的`/api/v1`下可以访问当前稳定的HTTP API。将在该端点下添加任何非中断添加项。

### 1.1格式概述

API返回是JSON格式，每个请求成功的返回值都是以2xx开头的编码。如果API处理的是无效请求，返回一个JSON错误对象，并返回下面的错误码：

```sh
400 Bad Request。当参数错误或者丢失时。
422 Unprocessable Entity。当一个表达式不能被执行时。
503 Service Unavailable。当查询超时或者中断时。
```

对于在API端点之前发生的错误，可以返回其他非2xx代码。如果存在请求执行的错误，则可能会返回一系列警告，并收集所有的数据将在数据字段中返回。

JSON响应格式如下：

```sh
{
  "status": "success" | "error",
  "data": <data>,
  // Only set if status is "error". The data field may still hold
  // additional data.
  "errorType": "<string>",
  "error": "<string>",
  // Only if there were warnings while executing the request.
  // There will still be data in the data field.
  "warnings": ["<string>"]
}
```

输入时间戳可以以RFC3339格式提供，也可以以秒为单位提供给Unix时间戳，可选的小数位数用于亚秒级精度。 输出时间戳始终表示为Unix时间戳，以秒为单位。

可以以[]结尾的查询参数的名称。

- ``占位符：指的是Prometheus时间序列选择器，如http_requests_total或http_requests_total{method =〜"(GET|POST)"}，需要进行URL编码。
- 占位符：指的是[0-9]+[smhdwy]形式的Prometheus持续时间字符串。 例如，5m指的是5分钟的持续时间。
- 占位符：指的是引用布尔值（字符串true和false）。

### 2.1表达式查询

可以在单个时刻或在一段时间内评估查询语言表达。 以下部分描述了每种表达式查询的API端点。

#### 2.1.1Instant queries(即时查询)#

以下端点在单个时间点评估即时查询：

```sh
GET /api/v1/query
```

URL查询参数：

```sh
query=<string>: Prometheus表达式查询字符串。
time=<rfc3339 | uninx_timestamp>: 执行时间戳，可选项。
timeout=<duration>: 执行超时时间设置，可选项，默认由-query.timeout标志设置
如果time缺省，则用当前服务器时间表示执行时刻。这个查询结果的data部分有下面格式：
```

```sh
{
 "resultType": "matrix" | "vector" | "scalar" | "string",
 "result": <value>
}
```

是一个查询结果数据，依赖于这个resultType格式,见表达式查询结果格式。

下面例子执行了在时刻是`2015-07-01T20:10:51.781Z`的up表达式：

```sh
$ curl 'http://localhost:9090/api/v1/query?query=up&time=2015-07-01T20:10:51.781Z'
{
 "status": "success",
 "data":{
    "resultType": "vector",
    "result" : [
         {
            "metric" : {
               "__name__" : "up",
               "job" : "prometheus",
               "instance" : "localhost:9090"
            },
            "value": [ 1435781451.781, "1" ]
         },
         {
            "metric" : {
               "__name__" : "up",
               "job" : "node",
               "instance" : "localhost:9100"
            },
            "value" : [ 1435781451.781, "0" ]
         }
    ]
 }
}
```

#### 2.1.2 范围查询#

以下端点在一段时间内评估表达式查询：

```sh
GET /api/v1/query_range
```

URL查询参数:

```sh
query=<string>: Prometheus表达式查询字符串。
start=<rfc3339 | unix_timestamp>: 开始时间戳。
end=<rfc3339 | unix_timestamp>: 结束时间戳。
step=<duration>: 以持续时间格式查询分辨率步长或浮点秒数。
timeout=<duration>:评估超时。 可选的。 默认为-query.timeout标志的值并受其限制。
```

查询结果的数据部分具有以下格式：

```sh
{
    "resultType": "matrix",
    "result": <value>
}
```

对于``占位符的格式，详见范围向量结果格式。以下示例在30秒范围内评估表达式，查询分辨率为15秒。

```sh
$ curl 'http://localhost:9090/api/v1/query_range?query=up&start=2015-07-01T20:10:30.781Z&end=2015-07-01T20:11:00.781Z&step=15s'
{
   "status" : "success",
   "data" : {
      "resultType" : "matrix",
      "result" : [
         {
            "metric" : {
               "__name__" : "up",
               "job" : "prometheus",
               "instance" : "localhost:9090"
            },
            "values" : [
               [ 1435781430.781, "1" ],
               [ 1435781445.781, "1" ],
               [ 1435781460.781, "1" ]
            ]
         },
         {
            "metric" : {
               "__name__" : "up",
               "job" : "node",
               "instance" : "localhost:9091"
            },
            "values" : [
           [ 1435781430.781, "0" ],
               [ 1435781445.781, "0" ],
               [ 1435781460.781, "1" ]
            ]
         }
      ]
   }
}
```

### 2.2查询元数据

#### 2.2.1通过标签匹配器找到度量指标列表#

以下端点返回与特定标签集匹配的时间系列列表：

```sh
GET /api/v1/series
POST /api/v1/series
```

URL查询参数：

```sh
match[]=<series_selector>: 选择器是series_selector，这个参数个数必须大于等于1.
start=<rfc3339 | unix_timestamp>: 开始时间戳。
end=<rfc3339 | unix_timestamp>: 结束时间戳。
```

查询结果的data部分包含一个对象列表，这些对象包含标识每个系列的标签名称/值对。

下面例子返回时间序列数据, 选择器是up或者`process_start_time_seconds{job="prometheus"}`：

```sh
$ curl -g 'http://localhost:9090/api/v1/series?match[]=up&match[]=process_start_time_seconds{job="prometheus"}'
{
   "status" : "success",
   "data" : [
      {
         "__name__" : "up",
         "job" : "prometheus",
         "instance" : "localhost:9090"
      },
      {
         "__name__" : "up",
         "job" : "node",
         "instance" : "localhost:9091"
      },
      {
         "__name__" : "process_start_time_seconds",
         "job" : "prometheus",
         "instance" : "localhost:9090"
      }
   ]
}
```

#### 2.2.2查询标签名#

以下端点返回标签名称的列表：

```sh
GET /api/v1/labels
POST /api/v1/labels
```

JSON响应的data部分是字符串标签名称的列表：

```sh
$ curl 'localhost:9090/api/v1/labels'
{
    "status": "success",
    "data": [
        "__name__",
        "call",
        "code",
        "config",
        "dialer_name",
        "endpoint",
        "event",
        "goversion",
        "handler",
        "instance",
        "interval",
        "job",
        "le",
        "listener_name",
        "name",
        "quantile",
        "reason",
        "role",
        "scrape_job",
        "slice",
        "version"
    ]
}
```

#### 2.2.3查询标签值#

以下端点返回提供的标签名称的标签值列表：

```sh
GET /api/v1/label/<label_name>/values
```

JSON响应的data部分是字符串标签值的列表。此示例查询作业标签的所有标签值：

```sh
$ curl http://localhost:9090/api/v1/label/job/values
{
   "status" : "success",
   "data" : [
      "node",
      "prometheus"
   ]
}
```

### 2.3表达式查询结果格式

表达式查询可能会在data部分的result属性中返回以下响应值。 ``占位符是数字样本值。 JSON不支持特殊的浮点值，例如`NaN`，`Inf`和`-Inf`，因此样本值将作为带引号的JSON字符串而不是原始数字传输。

#### 2.3.1范围向量#

范围向量返回的result类型是一个matrix矩阵。下面返回的结果是result部分的数据格式：

```sh
[
  {
    "metric": { "<label_name>": "<label_value>", ... },
    "values": [ [ <unix_time>, "<sample_value>" ], ... ]
  },
  ...
]
```

#### 2.3.2瞬时向量#

瞬时向量的result类型是vector。下面是result部分的数据格式：

```sh
[
  {
    "metric": { "<label_name>": "<label_value>", ... },
    "value": [ <unix_time>, "<sample_value>" ]
  },
  ...
]
```

#### 2.3.3Scalars标量#

标量查询返回result类型是scalar。下面是result部分的数据格式：

```sh
[ <unix_time>, "<scalar_value>" ]
```

#### 2.3.4字符串#

字符串的result类型是string。下面是result部分的数据格式：

```sh
[ <unix_time>, "<string_value>" ]
```

### 2.4Targets目标

以下端点返回Prometheus目标发现的当前状态概述：

```sh
GET /api/v1/targets
```

活动目标和删除目标都是响应的一部分。 labels表示重新标记发生后的标签集，discoveredLabels表示在发生重新标记之前在服务发现期间检索到的未修改标签。

```sh
$ curl http://localhost:9090/api/v1/targets
{
  "status": "success",
  "data": {
    "activeTargets": [
      {
        "discoveredLabels": {
          "__address__": "127.0.0.1:9090",
          "__metrics_path__": "/metrics",
          "__scheme__": "http",
          "job": "prometheus"
        },
        "labels": {
          "instance": "127.0.0.1:9090",
          "job": "prometheus"
        },
        "scrapeUrl": "http://127.0.0.1:9090/metrics",
        "lastError": "",
        "lastScrape": "2017-01-17T15:07:44.723715405+01:00",
        "health": "up"
      }
    ],
    "droppedTargets": [
      {
        "discoveredLabels": {
          "__address__": "127.0.0.1:9100",
          "__metrics_path__": "/metrics",
          "__scheme__": "http",
          "job": "node"
        },
      }
    ]
  }
}
```

### 2.5Rules规则

`/rules` API端点返回当前加载的警报和记录规则列表。 此外，它还返回由每个警报规则的Prometheus实例触发的当前活动警报。由于`/rules`端点相当新，它没有与总体API v1相同的稳定性保证。

```sh
GET /api/v1/rules
```

```sh
$ curl http://localhost:9090/api/v1/rules
{
    "data": {
        "groups": [
            {
                "rules": [
                    {
                        "alerts": [
                            {
                                "activeAt": "2018-07-04T20:27:12.60602144+02:00",
                                "annotations": {
                                    "summary": "High request latency"
                                },
                                "labels": {
                                    "alertname": "HighRequestLatency",
                                    "severity": "page"
                                },
                                "state": "firing",
                                "value": 1
                            }
                        ],
                        "annotations": {
                            "summary": "High request latency"
                        },
                        "duration": 600,
                        "health": "ok",
                        "labels": {
                            "severity": "page"
                        },
                        "name": "HighRequestLatency",
                        "query": "job:request_latency_seconds:mean5m{job=\"myjob\"} > 0.5",
                        "type": "alerting"
                    },
                    {
                        "health": "ok",
                        "name": "job:http_inprogress_requests:sum",
                        "query": "sum(http_inprogress_requests) by (job)",
                        "type": "recording"
                    }
                ],
                "file": "/rules.yaml",
                "interval": 60,
                "name": "example"
            }
        ]
    },
    "status": "success"
}
```

### 2.6Alerts报警

`/alerts`端点返回所有活动警报的列表。由于`/alerts`端点相当新，它没有与总体`API v1`相同的稳定性保证。

```sh
GET /api/v1/alerts
```

```sh
$ curl http://localhost:9090/api/v1/alerts
{
    "data": {
        "alerts": [
            {
                "activeAt": "2018-07-04T20:27:12.60602144+02:00",
                "annotations": {},
                "labels": {
                    "alertname": "my-alert"
                },
                "state": "firing",
                "value": 1
            }
        ]
    },
    "status": "success"
}
```

### 2.7查询目标元数据

以下端点返回有关目标正在刮取的度量标准的元数据。 这是实验性的，将来可能会发生变化。

```sh
GET /api/v1/targets/metadata
```

URL查询参数：

```sh
match_target=<label_selectors>：通过标签集匹配目标的标签选择器。 如果留空则选择所有目标。
metric=<string>：用于检索元数据的度量标准名称。 如果留空，则检索所有度量标准元数据。
limit=<number>：要匹配的最大目标数。
```

查询结果的data部分包含一个包含度量元数据和目标标签集的对象列表。以下示例从前两个目标返回go_goroutines指标的所有元数据条目，标签为job ="prometheus"。

```sh
curl -G http://localhost:9091/api/v1/targets/metadata \
    --data-urlencode 'metric=go_goroutines' \
    --data-urlencode 'match_target={job="prometheus"}' \
    --data-urlencode 'limit=2'
{
  "status": "success",
  "data": [
    {
      "target": {
        "instance": "127.0.0.1:9090",
        "job": "prometheus"
      },
      "type": "gauge",
      "help": "Number of goroutines that currently exist.",
      "unit": ""
    },
    {
      "target": {
        "instance": "127.0.0.1:9091",
        "job": "prometheus"
      },
      "type": "gauge",
      "help": "Number of goroutines that currently exist.",
      "unit": ""
    }
  ]
}
```

以下示例返回标签`instance="127.0.0.1:9090"`的所有目标的所有度量标准的元数据：

```sh
curl -G http://localhost:9091/api/v1/targets/metadata \
    --data-urlencode 'match_target={instance="127.0.0.1:9090"}'
{
  "status": "success",
  "data": [
    // ...
    {
      "target": {
        "instance": "127.0.0.1:9090",
        "job": "prometheus"
      },
      "metric": "prometheus_treecache_zookeeper_failures_total",
      "type": "counter",
      "help": "The total number of ZooKeeper failures.",
      "unit": ""
    },
    {
      "target": {
        "instance": "127.0.0.1:9090",
        "job": "prometheus"
      },
      "metric": "prometheus_tsdb_reloads_total",
      "type": "counter",
      "help": "Number of times the database reloaded block data from disk.",
      "unit": ""
    },
    // ...
  ]
}
```

### 2.8Altermanagers警报管理器

以下端点返回Prometheus alertmanager发现的当前状态概述：

```sh
GET /api/v1/alertmanagers
```

活动和丢弃的Alertmanagers都是响应的一部分：

```sh
$ curl http://localhost:9090/api/v1/alertmanagers
{
  "status": "success",
  "data": {
    "activeAlertmanagers": [
      {
        "url": "http://127.0.0.1:9090/api/v1/alerts"
      }
    ],
    "droppedAlertmanagers": [
      {
        "url": "http://127.0.0.1:9093/api/v1/alerts"
      }
    ]
  }
}
```

### 2.9Status状态

以下状态端点显示当前的Prometheus配置。

#### 2.9.1Config配置#

以下端点返回当前加载的配置文件：

```sh
GET /api/v1/status/config
```

配置作为转储的YAML文件返回。 由于YAML库的限制，不包括YAML注释。

```sh
$ curl http://localhost:9090/api/v1/status/config
{
  "status": "success",
  "data": {
    "yaml": "<content of the loaded config file in YAML>",
  }
}
```

#### 2.9.2Flags标志#

以下端点返回Prometheus配置的标志值：

```sh
GET /api/v1/status/flags
```

所有值都以“字符串”的形式出现。

```sh
$ curl http://localhost:9090/api/v1/status/flags
{
  "status": "success",
  "data": {
    "alertmanager.notification-queue-capacity": "10000",
    "alertmanager.timeout": "10s",
    "log.level": "info",
    "query.lookback-delta": "5m",
    "query.max-concurrency": "20",
    ...
  }
}
```

#### 2.9.3运行时信息#

以下端点返回有关Prometheus服务器的各种运行时信息属性：

```sh
GET /api/v1/status/runtimeinfo
```

返回的值具有不同的类型，具体取决于运行时属性的性质。

```sh
$ curl http://localhost:9090/api/v1/status/runtimeinfo
{
  "status": "success",
  "data": {
    "startTime": "2019-11-02T17:23:59.301361365+01:00",
    "CWD": "/",
    "reloadConfigSuccess": true,
    "lastConfigTime": "2019-11-02T17:23:59+01:00",
    "chunkCount": 873,
    "timeSeriesCount": 873,
    "corruptionCount": 0,
    "goroutineCount": 48,
    "GOMAXPROCS": 4,
    "GOGC": "",
    "GODEBUG": "",
    "storageRetention": "15d"
  }
}
```

注意：在Prometheus版本之间，确切返回的运行时属性可能会更改

#### 2.9.4Build信息#

以下端点返回有关Prometheus服务器的各种构建信息属性：

```sh
GET /api/v1/status/buildinfo
```

所有值都的结果类型是字符串：

```sh
$ curl http://localhost:9090/api/v1/status/buildinfo
{
  "status": "success",
  "data": {
    "version": "2.13.1",
    "revision": "cb7cbad5f9a2823a622aaa668833ca04f50a0ea7",
    "branch": "master",
    "buildUser": "julius@desktop",
    "buildDate": "20191102-16:19:59",
    "goVersion": "go1.13.1"
  }
}
```

注意：在Prometheus版本之间，返回的确切构建属性可能会更改

### 2.10TSDB Admin APIs，TSDB管理API

这些是为高级用户公开数据库功能的API。 除非设置了--web.enable-admin-api，否则不会启用这些API。我们还公开了一个gRPC API，其定义可以在这里找到。 这是实验性的，将来可能会发生变化。

#### 2.10.1快照#

快照会将所有当前数据的快照创建到TSDB数据目录下的`snapshots/-`中，并将该目录作为响应返回。 它可以选择跳过仅存在于头块中但尚未压缩到磁盘的快照数据。

```sh
POST /api/v1/admin/tsdb/snapshot?skip_head=<bool>
```

```sh
$ curl -XPOST http://localhost:9090/api/v1/admin/tsdb/snapshot
{
  "status": "success",
  "data": {
    "name": "20171210T211224Z-2be650b6d019eb54"
  }
}
```

快照已存在`/snapshots/20171210T211224Z-2be650b6d019eb54`

#### 2.10.2删除序列#

DeleteSeries删除时间范围内所选系列的数据。 实际数据仍然存在于磁盘上，并在将来的压缩中清除，或者可以通过点击Clean Tombstones端点来明确清理。

如果成功，则返回204。

```sh
POST /api/v1/admin/tsdb/delete_series
```

URL查询参数：

```sh
match[]=<series_selector>：选择要删除的系列的重复标签匹配器参数。 必须至少提供一个match[]参数。
start= <rfc3339 | unix_timestamp>：开始时间戳。 可选，默认为最短可能时间。
end= <rfc3339 | unix_timestamp>：结束时间戳。 可选，默认为最长可能时间。
```

不提及开始和结束时间将清除数据库中匹配系列的所有数据。例：

```sh
$ curl -X POST \
  -g 'http://localhost:9090/api/v1/admin/tsdb/delete_series?match[]=up&match[]=process_start_time_seconds{job="prometheus"}'
```

#### 2.10.3CleanTombstones#

CleanTombstones从磁盘中删除已删除的数据并清理现有的逻辑删除。 这可以在删除系列后使用以释放空间。如果成功，则返回204。

```sh
POST /api/v1/admin/tsdb/clean_tombstones
```

这不需要参数或正文：

```sh
$ curl -XPOST http://localhost:9090/api/v1/admin/tsdb/clean_tombstones
```

## 3.管理API

Prometheus提供了一组管理API，以简化自动化和集成

### 3.1监控检测

```sh
GET /-/healthy
```

始终返回200，应用于检查Prometheus的运行状况。

### 3.2准备检查

```sh
GET /-/ready
```

当Prometheus准备服务流量（即响应查询）时，此端点返回200。

### 3.3重载

```sh
PUT  /-/reload
POST /-/reload
OR
kill -HUP pid
curl -X POST http://IP/-/reload
```

该端点触发Prometheus配置和规则文件的重新加载。 默认情况下它是禁用的，可以通过`--web.enable-lifecycle`标志启用。或者，可以通过将SIGHUP发送到Prometheus进程来触发配置重载。

### 3.4退出

```sh
PUT  /-/quit
POST /-/quit
```

该端点触发Prometheus的正常关闭。 默认情况下它是禁用的，可以通过`--web.enable-lifecycle`标志启用。或者，可以通过将SIGTERM发送到Prometheus进程来触发正常关闭。
