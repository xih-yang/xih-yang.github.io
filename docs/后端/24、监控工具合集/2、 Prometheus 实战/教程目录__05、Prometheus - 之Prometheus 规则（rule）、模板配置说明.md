# 05、Prometheus - 之Prometheus 规则（rule）、模板配置说明
- 来源：https://ddkk.com/zhuanlan/monitoring/prometheus/5.html
- 分类：监控工具
- 分组：教程目录
## 0.前言

## 1.记录规则

#### 1.1配置规则

Prometheus支持两种类型的规则，这些规则可以定期配置，然后定期评估：记录规则和[警报规则](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/)。 要在Prometheus中包含规则，请创建包含必要规则语句的文件，并让Prometheus通过Prometheus配置中的`rule_files`字段加载文件， 规则文件使用YAML。

通过将`SIGHUP`发送到Prometheus进程，可以在运行时重新加载规则文件。 仅当所有规则文件格式正确时才会应用更改。

#### 1.2语法检查规则

要在不启动Prometheus服务器的情况下快速检查规则文件在语法上是否正确，请安装并运行Prometheus的`promtool`命令行实用工具：一般下载来整个Prometheus已经包含了promtool工具。

```sh
go get github.com/prometheus/prometheus/cmd/promtool
promtool check rules /path/to/example.rules.yml
```

当文件在语法上有效时，检查器将已解析规则的文本表示打印到标准输出，然后以`0`返回状态退出。如果存在任何语法错误或无效的输入参数，则会向标准错误输出错误消息，并以`1`返回状态退出。

#### 1.3 录制规则

录制规则允许预先计算经常需要或计算上昂贵的表达式，并将其结果保存为一组新的时间序列。 因此，查询预先计算的结果通常比每次需要时执行原始表达式快得多。 这对于仪表板尤其有用，仪表板需要在每次刷新时重复查询相同的表达式。记录和警报规则存在于规则组中，组内的规则以固定间隔顺序运行。

规则文件的语法是：

```sh
groups:
  [ - <rule_group> ]
```

一个简单的示例规则文件将是：

```sh
groups:
  - name: example
    rules:
    - record: job:http_inprogress_requests:sum
      expr: sum(http_inprogress_requests) by (job)
```

###### 1.3.1rule_group#

```sh
# 组的名称。 在文件中必须是唯一的。
name: <string>
# 评估组中的规则的频率。
[ interval: <duration> | default = global.evaluation_interval ]
rules:
  [ - <rule> ... ]
```

###### 1.3.2rule#

记录规则的语法是：

```sh
# 要输出的时间序列的名称。 必须是有效的度量标准名称。
record: <string>
# 要评估的PromQL表达式。 每个评估周期都会在当前时间进行评估，并将结果记录为一组新的时间序列，其中度量标准名称由“记录”给出。
expr: <string>
# 在存储结果之前添加或覆盖的标签。
labels:
  [ <labelname>: <labelvalue> ]
```

警报规则的语法是：

```sh
# 警报的名称。 必须是有效的度量标准名称。
alert: <string>
# 要评估的PromQL表达式。 每个评估周期都会在当前时间进行评估，并且所有结果时间序列都会成为待处理/触发警报。
expr: <string>
# 警报一旦被退回这段时间就会被视为开启。
# 尚未解雇的警报被认为是未决的。
[ for: <duration> | default = 0s ]
# 为每个警报添加或覆盖的标签。
labels:
  [ <labelname>: <tmpl_string> ]
# 要添加到每个警报的注释。
annotations:
  [ <labelname>: <tmpl_string> ]
```

比如按照规则的语法来创建一个新的metric，`prometheus.rules.yml`：

```sh
groups:
- name: example
  rules:
  - record: Cpu_Usage
    expr: clamp_max(((avg by (mode) ( (clamp_max(rate(node_cpu_seconds_total{mode!="idle"}[10s]),1)) or (clamp_max(irate(node_cpu_seconds_total{mode!="idle"}[10s]),1)) ))*100 ),100)
```

再去Prometheus上进行配置，`prometheus.yml`：

```sh
rule_files:
  - "prometheus.rules.yml"
```

## 2.预警规则

警报规则基于Prometheus表达式定义警报条件，并将有关触发警报的通知发送到外部服务。 每当警报表达式在给定时间点生成一个或多个向量元素时，警报将视为这些元素的标签集的活动状态。

#### 2.1定义报警规则

警报规则在Prometheus中与记录规则相同的方式配置。带警报的示例规则文件将是：

```sh
groups:
- name: example
  rules:
  - alert: HighErrorRate
    expr: job:request_latency_seconds:mean5m{job="myjob"} > 0.5
    for: 10m
    labels:
      severity: page
    annotations:
      summary: High request latency
```

- for子句：使Prometheus在第一次遇到新的表达式输出向量元素和将此警告作为此元素的触发计数之间等待一段时间。 在这种情况下，Prometheus将在每次评估期间检查警报是否继续处于活动状态10分钟，然后再触发警报。 处于活动状态但尚未触发的元素处于pending状态。
- labels子句：允许指定要附加到警报的一组附加标签。 任何现有的冲突标签都将被覆盖。 标签值可以是模板化的。
- annotations子句：指定一组信息标签，可用于存储更长的附加信息，例如警报描述或Runbook链接。 注释值可以是模板化的。

#### 2.2模板

可以使用控制台模板化标签和注释值。 $labels变量保存警报实例的标签键/值对，$value保存警报实例的评估值。

```sh
# 要插入触发元素的标签值：
{{ $labels.<labelname> }}
# 要插入触发元素的数值表达式值：
{{ $value }}
```

例子：

```sh
groups:
- name: example
  rules:
  对于任何无法访问> 5分钟的实例的警报。
  - alert: InstanceDown
    expr: up == 0
    for: 5m
    labels:
      severity: page
    annotations:
      summary: "Instance {{ $labels.instance }} down"
      description: "{{ $labels.instance }} of job {{ $labels.job }} has been down for more than 5 minutes."
  对中值请求延迟> 1s的任何实例发出警报。
  - alert: APIHighRequestLatency
    expr: api_http_request_latencies_second{quantile="0.5"} > 1
    for: 10m
    annotations:
      summary: "High request latency on {{ $labels.instance }}"
      description: "{{ $labels.instance }} has a median request latency above 1s (current value: {{ $value }}s)"
```

#### 2.3在运行时检查警报

要手动检查哪些警报处于活动状态（待处理或触发），请导航至Prometheus实例的"Alerts"选项卡。 这将显示每个定义的警报当前处于活动状态的确切标签集。

对于待处理和触发警报，Prometheus还存储`ALERTS{alertname="",alertstate ="pending|firing",}`形式的合成时间序列。 只要警报处于指示的活动（挂起或触发）状态，样本值就会设置为1，并且当不再是这种情况时，系列会标记为过时。

#### 2.4发送提醒通知

Prometheus的警报规则很好地解决了现在的问题，但并不是一个完全成熟的通知解决方案。 需要另一层来在简单警报定义之上添加摘要，通知速率限制。 其中Alertmanager承担了这一角色，可以被配置为周期性地向Alertmanager实例发送关于警报状态的信息，然后该实例负责调度正确的通知。另外Prometheus可以配置为通过其服务发现集成自动发现可用的Alertmanager实例。

## 3.模板例子

Prometheus支持在警报的注释和标签以及服务的控制台页面中进行模板化。 模板能够针对本地数据库运行查询，迭代数据，使用条件，格式化数据等.Prometheus模板语言基于[Go模板系统](https://pkg.go.dev/text/template)。

#### 3.1简单的警报字段模板

```sh
alert: InstanceDown
expr: up == 0
for: 5m
labels:
  severity: page
annotations:
  summary: "Instance {{$labels.instance}} down"
  description: "{{$labels.instance}} of job {{$labels.job}} has been down for more than 5 minutes."
```

对于每个触发的警报，将在每次规则迭代期间执行警报字段模板，因此请保持所有查询和模板的轻量级。 如果您需要更复杂的警报模板，建议您改为链接到控制台。

#### 3.2简单的迭代

这将显示实例列表以及它们是否已启动：

```sh
{{ range query "up" }}
  {{ .Labels.instance }} {{ .Value }}
{{ end }}
```

特别的`.`变量包含每个循环迭代的当前样本的值。

#### 3.3展示一个值

```sh
{{ with query "some_metric{instance='someinstance'}" }}
  {{ . | first | value | humanize }}
{{ end }}
```

Go和Go的模板语言都是强类型的，因此必须检查是否返回了样本以避免执行错误。 例如，如果抓取或规则评估尚未运行，或者主机已关闭，则可能会发生这种情况。包含的`prom_query_drilldown`模板处理此问题，允许格式化结果，并链接到[表达式浏览器](https://prometheus.io/docs/visualization/browser/)。

#### 3.4使用命令行URL参数

```sh
{{ with printf "node_memory_MemTotal{job='node',instance='%s'}" .Params.instance | query }}
  {{ . | first | value | humanize1024}}B
{{ end }}
```

如果以`console.html?instance = hostname`的身份访问，`.Params.instance`将评估为`hostname`。

#### 3.5高级迭代

```sh
<table>
{{ range printf "node_network_receive_bytes{job='node',instance='%s',device!='lo'}" .Params.instance | query | sortByLabel "device"}}
  <tr><th colspan=2>{{ .Labels.device }}</th></tr>
  <tr>
    <td>Received</td>
    <td>{{ with printf "rate(node_network_receive_bytes{job='node',instance='%s',device='%s'}[5m])" .Labels.instance .Labels.device | query }}{{ . | first | value | humanize }}B/s{{end}}</td>
  </tr>
  <tr>
    <td>Transmitted</td>
    <td>{{ with printf "rate(node_network_transmit_bytes{job='node',instance='%s',device='%s'}[5m])" .Labels.instance .Labels.device | query }}{{ . | first | value | humanize }}B/s{{end}}</td>
  </tr>{{ end }}
<table>
```

在这里，我们遍历所有网络设备并显示每个网络设备的网络流量。由于`range`操作未指定变量，因此循环内部`.Params.instance`不可用，现在是循环变量。

#### 3.6定义可重用模板

Prometheus支持定义可重用的模板。 当与控制台库支持结合使用时，这一功能特别强大，允许跨控制台共享模板。

```sh
{{/* Define the template */}}
{{define "myTemplate"}}
  do something
{{end}}
{{/* Use the template */}}
{{template "myTemplate"}}
```

模板仅限于一个参数。 args函数可用于包装多个参数。

```sh
{{define "myMultiArgTemplate"}}
  First argument: {{.arg0}}
  Second argument: {{.arg1}}
{{end}}
{{template "myMultiArgTemplate" (args 1 2)}}
```

## 4.模板参考

见[官网说明](https://prometheus.io/docs/prometheus/latest/configuration/template_reference/#template-reference)和[Prometheus模板参考](https://www.jianshu.com/p/cfd1361ffcc6)

## 5.规则的单元测试

使用`promtool`来测试规则：

```sh
# 单个测试文件
./promtool test rules test.yml
# 多个测试文件
./promtool test rules test1.yml test2.yml test3.yml
```

#### 5.1测试文件格式

```sh
# 这是要考虑进行测试的规则文件列表。
rule_files:
  [ - <file_name> ]
# 可选的, 默认 = 1m
evaluation_interval: <duration>
# 下面列出组名称的顺序将是规则组的评估顺序（在给定的评估时间）。 订单仅适用于下面提到的组。
# 下面不需要提到所有组。
group_eval_order:
  [ - <group_name> ]
# 所有测试都列在这里。
tests:
  [ - <test_group> ]
```

###### 5.1.1test_group#

```sh
# 系列数据
interval: <duration>
input_series:
  [ - <series> ]
# 上述数据的单元测试
# 警报规则的单元测试。 我们从输入文件中考虑警报规则。
alert_rule_test:
  [ - <alert_test_case> ]
# 单元测试PromQL表达式。
promql_expr_test:
  [ - <promql_test_case> ]
```

###### 5.1.2series#

```sh
# 这遵循通常的系列符号 '<metric name>{<label name>=<label value>, ...}'
# 例子: 
#      series_name{label1="value1", label2="value2"}
#      go_goroutines{job="prometheus", instance="localhost:9090"}
series: <string>
# 这使用扩展表示法。
# 扩展符号：
#     'a+bxc' becomes 'a a+b a+(2*b) a+(3*b) … a+(c*b)'
#     'a-bxc' becomes 'a a-b a-(2*b) a-(3*b) … a-(c*b)'
# 例子:
#     1. '-2+4x3' becomes '-2 2 6 10'
#     2. ' 1-2x4' becomes '1 -1 -3 -5 -7'
values: <string>
```

###### 5.1.3alert_test_case#

Prometheus允许为不同的警报规则使用相同的警报名称。 因此，在此单元测试中，必须在单个下列出alertname的所有触发警报的并集。

```sh
# 这是从必须检查警报的时间= 0开始经过的时间。
eval_time: <duration>
# 要测试的警报的名称。
alertname: <string>
# 在给定评估时间在给定警报名称下触发的预期警报列表。 如果您想测试是否不应该触发警报规则，那么您可以提及上述字段并将“exp_alerts”留空。
exp_alerts:
  [ - <alert> ]
```

###### 5.1.4alert#

这些是预期警报的扩展标签和注释。

注意：标签还包括与警报关联的样本标签（与您在`/alerts`中看到的标签相同，没有系列`__name__`和`alertname`）

```sh
exp_labels:
  [ <labelname>: <string> ]
exp_annotations:
  [ <labelname>: <string> ]
```

###### 5.1.5promql_test_case#

```sh
# 表达评估
expr: <string>
# 这是从必须检查警报的时间= 0开始经过的时间。
eval_time: <duration>
# 在给定评估时间的预期样品。
exp_samples:
  [ - <sample> ]
```

###### 5.1.6sample#

```sh
# 通常系列表示法中的样本标签 '<metric name>{<label name>=<label value>, ...}'
# 例子: 
#      series_name{label1="value1", label2="value2"}
#      go_goroutines{job="prometheus", instance="localhost:9090"}
labels: <string>
# promql表达式的期望值。
value: <number>
```

#### 5.2例子

这是用于通过测试的单元测试的示例输入文件。`test.yml`是遵循上述语法的测试文件，`alerts.yml`包含警报规则。将alerts.yml放在同一目录中，运行`./promtool test rules test.yml`。

###### 5.2.1test.yml#

```sh
# This is the main input for unit testing. 
# Only this file is passed as command line argument.
rule_files:
    - alerts.yml
evaluation_interval: 1m
tests:
    Test 1.
    - interval: 1m
      Series data.
      input_series:
          - series: 'up{job="prometheus", instance="localhost:9090"}'
            values: '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0'
          - series: 'up{job="node_exporter", instance="localhost:9100"}'
            values: '1+0x6 0 0 0 0 0 0 0 0' 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0
          - series: 'go_goroutines{job="prometheus", instance="localhost:9090"}'
            values: '10+10x2 30+20x5' 10 20 30 30 50 70 90 110 130
          - series: 'go_goroutines{job="node_exporter", instance="localhost:9100"}'
            values: '10+10x7 10+30x4' 10 20 30 40 50 60 70 80 10 40 70 100 130
      Unit test for alerting rules.
      alert_rule_test:
          Unit test 1.
          - eval_time: 10m
            alertname: InstanceDown
            exp_alerts:
                Alert 1.
                - exp_labels:
                      severity: page
                      instance: localhost:9090
                      job: prometheus
                  exp_annotations:
                      summary: "Instance localhost:9090 down"
                      description: "localhost:9090 of job prometheus has been down for more than 5 minutes."
      Unit tests for promql expressions.
      promql_expr_test:
          Unit test 1.
          - expr: go_goroutines > 5
            eval_time: 4m
            exp_samples:
                Sample 1.
                - labels: 'go_goroutines{job="prometheus",instance="localhost:9090"}'
                  value: 50
                Sample 2.
                - labels: 'go_goroutines{job="node_exporter",instance="localhost:9100"}'
                  value: 50
```

###### 5.2.2alerts.yml#

```sh
# This is the rules file.
groups:
- name: example
  rules:
  - alert: InstanceDown
    expr: up == 0
    for: 5m
    labels:
        severity: page
    annotations:
        summary: "Instance {{ $labels.instance }} down"
        description: "{{ $labels.instance }} of job {{ $labels.job }} has been down for more than 5 minutes."
  - alert: AnotherInstanceDown
    expr: up == 0
    for: 10m
    labels:
        severity: page
    annotations:
        summary: "Instance {{ $labels.instance }} down"
        description: "{{ $labels.instance }} of job {{ $labels.job }} has been down for more than 5 minutes."
```
