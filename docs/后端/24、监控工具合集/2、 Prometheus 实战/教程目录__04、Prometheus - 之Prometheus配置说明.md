# 04、Prometheus - 之Prometheus配置说明
- 来源：https://ddkk.com/zhuanlan/monitoring/prometheus/4.html
- 分类：监控工具
- 分组：教程目录
## 0.前言

## 1.说明

Prometheus通过命令行和配置文件进行配置，命令行配置不能修改的系统参数（例如存储位置，要保留在磁盘和内存中的数据量等），但配置文件定义了与抓取作业及其实例相关的所有内容，以及哪些规则文件的加载。

Prometheus可以在运行时重新加载其配置。 如果新配置格式不正确，则更改将不会应用。 通过向Prometheus进程发送SIGHUP或向/-/reload端点发送HTTP POST请求（启用`--web.enable-lifecycle`）来触发配置重载，这还将重新加载所有已配置的规则文件。

## 2.配置文件

使用`--config.file`参数指定要加载的配置文件。该文件以YAML格式编写，由下面描述的方案定义。 括号表示参数是可选的。 对于非列表参数，该值设置为指定的默认值。

通用占位符定义如下：

```sh
<boolean>：一个可以取值为true或false的布尔值
<duration>：与正则表达式匹配的持续时间[0-9] +（ms | [smhdwy]）
<labelname>：与正则表达式匹配的字符串[a-zA-Z _] [a-zA-Z0-9 _] *
<labelvalue>：一串unicode字符
<filename>：当前工作目录中的有效路径
<host>：由主机名或IP后跟可选端口号组成的有效字符串
<path>：有效的URL路径
<scheme>：一个可以取值http或https的字符串
<string>：常规字符串
<secret>：一个秘密的常规字符串，例如密码
<tmpl_string>：在使用前进行模板扩展的字符串
```

其他占位符是单独指定的。[可以在此处找到有效的示例文件](https://github.com/prometheus/prometheus/blob/release-2.8/config/testdata/conf.good.yml)

全局配置指定在所有其他配置上下文中有效的参数。 它们还可用作其他配置节的默认值。

```sh
global:
  默认情况下抓取目标的频率.
  [ scrape_interval: <duration> | default = 1m ]
  抓取超时时间.
  [ scrape_timeout: <duration> | default = 10s ]
  评估规则的频率.
  [ evaluation_interval: <duration> | default = 1m ]
  与外部系统通信时添加到任何时间序列或警报的标签（联合，远程存储，Alertma# nager）.即添加到拉取的数据并存到数据库中
  external_labels:
    [ <labelname>: <labelvalue> ... ]
# 规则文件指定了一个globs列表. 
# 从所有匹配的文件中读取规则和警报.
rule_files:
  [ - <filepath_glob> ... ]
# 抓取配置列表.
scrape_configs:
  [ - <scrape_config> ... ]
# 警报指定与Alertmanager相关的设置.
alerting:
  alert_relabel_configs:
    [ - <relabel_config> ... ]
  alertmanagers:
    [ - <alertmanager_config> ... ]
# 与远程写入功能相关的设置.
remote_write:
  [ - <remote_write> ... ]
# 与远程读取功能相关的设置.
remote_read:
  [ - <remote_read> ... ]
```

### 2.1 scrape_config

``指定一组描述如何抓取的目标和参数。 一般一个scrape指定单个作业。目标可以通过``参数静态配置，也可以使用其中一种支持的服务发现机制动态发现。此外，``允许在抓取之前对任何目标及其标签进行高级修改。

```sh
# 默认分配给已抓取指标的job名称。
job_name: <job_name>
# 从job中抓取目标的频率.
[ scrape_interval: <duration> | default = <global_config.scrape_interval> ]
# 抓取此job时，每次抓取超时时间.
[ scrape_timeout: <duration> | default = <global_config.scrape_timeout> ]
# 从目标获取指标的HTTP资源路径.
[ metrics_path: <path> | default = /metrics ]
# honor_labels控制Prometheus如何处理已经存在于已抓取数据中的标签与Prometheus将附加服务器端的标签之间的冲突（"job"和"instance"标签，手动配置的目标标签以及服务发现实现生成的标签）。
# 如果honor_labels设置为"true"，则通过保留已抓取数据的标签值并忽略冲突的服务器端标签来解决标签冲突。
# 如果honor_labels设置为"false"，则通过将已抓取数据中的冲突标签重命名为"exported_ <original-label>"（例如"exported_instance"，"exported_job"）然后附加服务器端标签来解决标签冲突。 这对于联合等用例很有用，其中应保留目标中指定的所有标签。
# 请注意，任何全局配置的"external_labels"都不受此设置的影响。 在与外部系统通信时，它们始终仅在时间序列尚未具有给定标签时应用，否则将被忽略。
[ honor_labels: <boolean> | default = false ]
# 配置用于请求的协议方案.
[ scheme: <scheme> | default = http ]
# 可选的HTTP URL参数.
params:
  [ <string>: [<string>, ...] ]
# 使用配置的用户名和密码在每个scrape请求上设置Authorization标头。 password和password_file是互斥的。
basic_auth:
  [ username: <string> ]
  [ password: <secret> ]
  [ password_file: <string> ]
# 使用配置的承载令牌在每个scrape请求上设置Authorization标头。 它bearer_token_file和是互斥的。
[ bearer_token: <secret> ]
# 使用配置的承载令牌在每个scrape请求上设置Authorization标头。 它bearer_token和是互斥的。
[ bearer_token_file: /path/to/bearer/token/file ]
# 配置scrape请求的TLS设置.
tls_config:
  [ <tls_config> ]
# 可选的代理URL.
[ proxy_url: <string> ]
# Azure服务发现配置列表.
azure_sd_configs:
  [ - <azure_sd_config> ... ]
# Consul服务发现配置列表.
consul_sd_configs:
  [ - <consul_sd_config> ... ]
# DNS服务发现配置列表。
dns_sd_configs:
  [ - <dns_sd_config> ... ]
# EC2服务发现配置列表。
ec2_sd_configs:
  [ - <ec2_sd_config> ... ]
# OpenStack服务发现配置列表。
openstack_sd_configs:
  [ - <openstack_sd_config> ... ]
# 文件服务发现配置列表。
file_sd_configs:
  [ - <file_sd_config> ... ]
# GCE服务发现配置列表。
gce_sd_configs:
  [ - <gce_sd_config> ... ]
# Kubernetes服务发现配置列表。
kubernetes_sd_configs:
  [ - <kubernetes_sd_config> ... ]
# Marathon服务发现配置列表。
marathon_sd_configs:
  [ - <marathon_sd_config> ... ]
# AirBnB的神经服务发现配置列表。
nerve_sd_configs:
  [ - <nerve_sd_config> ... ]
# Zookeeper Serverset服务发现配置列表。
serverset_sd_configs:
  [ - <serverset_sd_config> ... ]
# Triton服务发现配置列表。
triton_sd_configs:
  [ - <triton_sd_config> ... ]
# 此job的标记静态配置目标列表。
static_configs:
  [ - <static_config> ... ]
# 目标重新标记配置列表。
relabel_configs:
  [ - <relabel_config> ... ]
# 度量标准重新配置列表。
metric_relabel_configs:
  [ - <relabel_config> ... ]
# 对每个将被接受的样本数量的每次抓取限制。
# 如果在度量重新标记后存在超过此数量的样本，则整个抓取将被视为失败。 0表示没有限制。
[ sample_limit: <int> | default = 0 ]
```

其中``在所有scrape配置中必须是唯一的。

### 2.2 tls_config

tls_config允许配置TLS连接。

```sh
# 用于验证API服务器证书的CA证书。
[ ca_file: <filename> ]
# 用于服务器的客户端证书身份验证的证书和密钥文件。
[ cert_file: <filename> ]
[ key_file: <filename> ]
# ServerName扩展名，用于指示服务器的名称。
# https://tools.ietf.org/html/rfc4366#section-3.1
[ server_name: <string> ]
# 禁用服务器证书的验证。
[ insecure_skip_verify: <boolean> ]
```

### 2.3 azure_sd_config

### 2.4 consul_sd_config

配置允许从Consul的Catalog API检索抓取目标（自动获取），重新标记期间，以下meta标签可用于目标：

- __meta_consul_address：目标地址
- __meta_consul_dc：目标的数据中心名称
- _*meta_consul_tagged_address* ：每个节点标记的目标地址的键值
- _*meta_consul_metadata* ：目标的每个节点元数据键值
- __meta_consul_node：为目标定义的节点名称
- __meta_consul_service_address：目标服务器的服务地址
- __meta_consul_service_id：目标的服务ID
- _*meta_consul_service_metadata* ：目标的每个服务元数据键值
- __meta_consul_service_port：目标服务器的服务端口
- __meta_consul_service：目标所属的服务的名称
- __meta_consul_tags：由标签分隔符连接的目标的标签列表

```sh
# 根据文档要求定义consul api信息
[ server: <host> | default = "localhost:8500" ]
[ token: <secret> ]
[ datacenter: <string> ]
[ scheme: <string> | default = "http" ]
[ username: <string> ]
[ password: <secret> ]
tls_config:
  [ <tls_config> ]
# 检索目标的服务列表，默认所有服务器
services:
  [ - <string> ]
# See https://www.consul.io/api/catalog.html#list-nodes-for-service to know more about the possible filters that can be used.
#标签的可选列表，用于过滤给定服务的节点。 服务必须包含列表中的所有标签。
tags:
  [ - <string> ]
# 节点元数据，用于过滤给定服务的节点。
[ node_meta:
  [ <name>: <value> ... ] ]
# Consul标签通过其连接到标签标签中的字符串
[ tag_separator: <string> | default = , ]
# Allow stale Consul results (see https://www.consul.io/api/features/consistency.html). Will reduce load on Consul.
[ allow_stale: <bool> ]
# 刷新提供的名称之后的时间，在大型设置中，增加此值可能是个好主意，因为目录会一直更改。
[ refresh_interval: <duration> | default = 30s ]
```

注意：用于抓取目标的IP地址和端口被组装为`:`。 但是，在某些Consul设置中，相关地址在`__meta_consul_service_address`中。 在这种情况下，您可以使用重新标记功能来替换特殊的`__address__`标签。

重新标记阶段是基于任意标签为服务筛选服务或节点的首选且功能更强大的方法。 对于拥有数千项服务的用户，直接使用Consul API可能会更高效，该API具有基本的过滤节点支持（当前通过节点元数据和单个标签）。

### 2.5 dns_sd_config

基于DNS的服务发现配置允许指定一组DNS域名，这些域名会定期查询以发现目标列表。 要联系的DNS服务器从/etc/resolv.conf中读取。

此服务发现方法仅支持基本的DNS A，AAAA和SRV记录查询，但不支持RFC6763中指定的高级DNS-SD方法。在重新标记阶段，元标签`__meta_dns_name`在每个目标上可用，并设置为生成已发现目标的记录名称。

```sh
# 要查询的DNS域名列表。
names:
  [ - <domain_name> ]
# 要执行的DNS查询的类型。
[ type: <query_type> | default = 'SRV' ]
# 查询类型不是SRV时使用的端口号。
[ port: <number>]
# 提供名称后刷新的时间。
[ refresh_interval: <duration> | default = 30s ]
```

其中``是有效的DNS域名。 其中``是SRV，A或AAAA。

### 2.6 openstack_sd_config

### 2.7 file_sd_config

### 2.8 dns_sd_config

### 2.9 gce_sd_config

### 2.10 kubernetes_sd_config

### 2.11 marathon_sd_config

### 2.12 nerve_sd_config

### 2.13 serverset_sd_config

### 2.14 triton_sd_config

### 2.15 static_config

[static_config](https://prometheus.io/docs/prometheus/latest/configuration/configuration/#file_sd_config)允许指定目标列表和它们的公共标签集，这是在scrape配置中指定静态目标的规范方法。

```sh
# 静态配置指定的目标。
targets:
  [ - '<host>' ]
# 分配给从目标中已抓取的所有指标的标签。
labels:
  [ <labelname>: <labelvalue> ... ]
```

### 2.16 relabel_config

重新标记是一种强大的工具，可以在抓取目标之前动态重写目标的标签集。 每个抓取配置可以配置多个重新标记步骤。 它们按照它们在配置文件中的出现顺序应用于每个目标的标签集。

最初，除了配置的每目标标签之外，目标的作业标签设置为相应的scrape配置的`job_name`值。`__address__`标签设置为目标的`:`地址。 重新标记后，如果在重新标记期间未设置实例标签，则实例标签默认设置为`__address__`的值。 `__scheme__`和`__metrics_path__`标签分别设置为目标的方案和度量标准路径。 `__param_ `标签设置为名为``的第一个传递的URL参数的值。

在重新标记阶段，可以使用带有`__meta_`前缀的附加标签。 它们由提供目标的服务发现机制设置，并在不同机制之间变化。

在目标重新标记完成后，将从标签集中删除以`__`开头的标签。如果重新标记步骤仅需临时存储标签值（作为后续重新标记步骤的输入），请使用`__tmp`标签名称前缀。 保证Prometheus本身不会使用此前缀。

```sh
# 源标签从现有标签中选择值。 它们的内容使用已配置的分隔符进行连接，并与已配置的正则表达式进行匹配，以进行替换，保留和删除操作。
[ source_labels: '[' <labelname> [, ...] ']' ]
# 分隔符放置在连接的源标签值之间。
[ separator: <string> | default = ; ]
# 在替换操作中将结果值写入的标签。
# 替换操作是强制性的。 正则表达式捕获组可用。
[ target_label: <labelname> ]
# 与提取的值匹配的正则表达式。
[ regex: <regex> | default = (.*) ]
# 采用源标签值的散列的模数。
[ modulus: <uint64> ]
# 如果正则表达式匹配，则执行正则表达式替换的替换值。 正则表达式捕获组可用。
[ replacement: <string> | default = $1 ]
# 基于正则表达式匹配执行的操作。
[ action: <relabel_action> | default = replace ]
```

``是任何有效的RE2正则表达式。 它是`replace`，`keep`，`drop`，`labelmap`，`labeldrop`和`labelkeep`操作所必需的。 正则表达式固定在两端。 要取消锚定正则表达式，请使用`。* .*`。

确定要采取的重新签名行动：

- replace：将regex与连接的source_labels匹配。 然后，将target_label设置为replacement，将匹配组引用（`$`{1}，`$`{2}，...）替换为其值。 如果正则表达式不匹配，则不进行替换。
- keep：删除regex与连接的source_labels不匹配的目标。
- drop：删除regex与连接的source_labels匹配的目标。
- hashmod：将target_label设置为连接的source_labels的哈希模数。
- labelmap：将regex与所有标签名称匹配。 然后将匹配标签的值复制到替换时给出的标签名称，替换为匹配组引用（`$`{1}，{2}，...）替换为其值。
- labeldrop：将regex与所有标签名称匹配。匹配的任何标签都将从标签集中删除。
- labelkeep：将regex与所有标签名称匹配。任何不匹配的标签都将从标签集中删除。

必须小心使用`labeldrop`和`labelkeep`，以确保在删除标签后仍然对指标进行唯一标记。

### 2.17 metric_relabel_configs

度量重新标记应用于样本，作为摄取前的最后一步。 它具有与目标重新标记相同的配置格式和操作。 度量标准重新标记不适用于自动生成的时间序列，例如up。

一个用途是将黑名单时间序列列入黑名单，这些时间序列太昂贵而无法摄取。

### 2.18 alert_relabel_configs

警报重新标记在发送到Alertmanager之前应用于警报。 它具有与目标重新标记相同的配置格式和操作。 外部标签后应用警报重新标记。这样做的一个用途是确保具有不同外部标签的HA对Prometheus服务器发送相同的警报。

### 2.19 alertmanager_config

`alertmanager_config`部分指定Prometheus服务器向其发送警报的Alertmanager实例。 它还提供参数以配置如何与这些Alertmanagers进行通信。

Alertmanagers可以通过`static_configs`参数静态配置，也可以使用其中一种支持的服务发现机制动态发现。此外，`relabel_configs`允许从发现的实体中选择Alertmanagers，并对使用的API路径提供高级修改，该路径通过`__alerts_path__`标签公开。

```sh
# 推送警报时按目标Alertmanager超时。
[ timeout: <duration> | default = 10s ]
# 将推送HTTP路径警报的前缀。
[ path_prefix: <path> | default = / ]
# 配置用于请求的协议方案。
[ scheme: <scheme> | default = http ]
# 使用配置的用户名和密码在每个请求上设置Authorization标头。 password和password_file是互斥的。
basic_auth:
  [ username: <string> ]
  [ password: <string> ]
  [ password_file: <string> ]
# 使用配置的承载令牌在每个请求上设置"Authorization"标头。 它与bearer_token_file互斥。
[ bearer_token: <string> ]
# 使用配置的承载令牌在每个请求上设置"Authorization"标头。 它与bearer_token互斥。
[ bearer_token_file: /path/to/bearer/token/file ]
# 配置scrape请求的TLS设置。
tls_config:
  [ <tls_config> ]
# 可选的代理URL。
[ proxy_url: <string> ]
# Azure服务发现配置列表。
azure_sd_configs:
  [ - <azure_sd_config> ... ]
# Consul服务发现配置列表。
consul_sd_configs:
  [ - <consul_sd_config> ... ]
# DNS服务发现配置列表。
dns_sd_configs:
  [ - <dns_sd_config> ... ]
# ECS服务发现配置列表。
ec2_sd_configs:
  [ - <ec2_sd_config> ... ]
# 文件服务发现配置列表。
file_sd_configs:
  [ - <file_sd_config> ... ]
# GCE服务发现配置列表。
gce_sd_configs:
  [ - <gce_sd_config> ... ]
# K8S服务发现配置列表。
kubernetes_sd_configs:
  [ - <kubernetes_sd_config> ... ]
# Marathon服务发现配置列表。
marathon_sd_configs:
  [ - <marathon_sd_config> ... ]
# AirBnB's Nerve 服务发现配置列表。
nerve_sd_configs:
  [ - <nerve_sd_config> ... ]
# Zookepper服务发现配置列表。
serverset_sd_configs:
  [ - <serverset_sd_config> ... ]
# Triton服务发现配置列表。
triton_sd_configs:
  [ - <triton_sd_config> ... ]
# 标记为静态配置的Alertmanagers列表。
static_configs:
  [ - <static_config> ... ]
# Alertmanager重新配置列表。
relabel_configs:
  [ - <relabel_config> ... ]
```

### 2.20 remote_write

write_relabel_configs是在将样本发送到远程端点之前应用于样本的重新标记。 在外部标签之后应用写入重新标记。 这可用于限制发送的样本。

```sh
# 要发送样本的端点的URL.
url: <string>
# 对远程写端点的请求超时。
[ remote_timeout: <duration> | default = 30s ]
# 远程写入重新标记配置列表。
write_relabel_configs:
  [ - <relabel_config> ... ]
# 使用配置的用户名和密码在每个远程写请求上设置Authorization标头.password和password_file是互斥的。
basic_auth:
  [ username: <string> ]
  [ password: <string> ]
  [ password_file: <string> ]
# 使用配置的承载令牌在每个远程写请求上设置Authorization头。 它与bearer_token_file互斥。
[ bearer_token: <string> ]
# 使用配置的承载令牌在每个远程写请求上设置Authorization头。 它与bearer_token互斥。
[ bearer_token_file: /path/to/bearer/token/file ]
# 配置远程写入请求的TLS设置。
tls_config:
  [ <tls_config> ]
# 可选的代理URL。
[ proxy_url: <string> ]
# 配置用于写入远程存储的队列。
queue_config:
  在我们开始删除之前每个分片缓冲的样本数。
  [ capacity: <int> | default = 10000 ]
  最大分片数，即并发数。
  [ max_shards: <int> | default = 1000 ]
  最小分片数，即并发数。
  [ min_shards: <int> | default = 1 ]
  每次发送的最大样本数。
  [ max_samples_per_send: <int> | default = 100]
  样本在缓冲区中等待的最长时间。
  [ batch_send_deadline: <duration> | default = 5s ]
  在可恢复错误上重试批处理的最大次数。
  [ max_retries: <int> | default = 3 ]
  初始重试延迟。 每次重试都会加倍。
  [ min_backoff: <duration> | default = 30ms ]
  最大重试延迟。
  [ max_backoff: <duration> | default = 100ms ]
```

有一个与此功能集成的列表。

### 2.21 remote_read

```sh
# 要发送样本的端点的URL.
url: <string>
# 可选的匹配器列表，必须存在于选择器中以查询远程读取端点。
required_matchers:
  [ <labelname>: <labelvalue> ... ]
# 对远程读取端点的请求超时。
[ remote_timeout: <duration> | default = 1m ]
# 本地存储应该有完整的数据。
[ read_recent: <boolean> | default = false ]
# 使用配置的用户名和密码在每个远程写请求上设置Authorization标头，password和password_file是互斥的。
basic_auth:
  [ username: <string> ]
  [ password: <string> ]
  [ password_file: <string> ]
# 使用配置的承载令牌在每个远程写请求上设置Authorization头。 它与bearer_toke_filen互斥。
[ bearer_token: <string> ]
# 使用配置的承载令牌在每个远程写请求上设置Authorization头。 它与bearer_token互斥。
[ bearer_token_file: /path/to/bearer/token/file ]
# 配置远程写入请求的TLS设置。
tls_config:
  [ <tls_config> ]
# 可选的代理URL。
[ proxy_url: <string> ]
有一个与此功能集成的列表。
```

## 3.配置模板

```sh
# my global config
global:
  scrape_interval:     15s
  evaluation_interval: 30s
  scrape_timeout is set to the global default (10s).
  external_labels:
    monitor: codelab
    foo:     bar
rule_files:
- "first.rules"
- "my/*.rules"
remote_write:
  - url: http://remote1/push
    write_relabel_configs:
    - source_labels: [__name__]
      regex:         expensive.*
      action:        drop
  - url: http://remote2/push
remote_read:
  - url: http://remote1/read
    read_recent: true
  - url: http://remote3/read
    read_recent: false
    required_matchers:
      job: special
scrape_configs:
- job_name: prometheus
  honor_labels: true
  scrape_interval is defined by the configured global (15s).
  scrape_timeout is defined by the global default (10s).
  metrics_path defaults to '/metrics'
  scheme defaults to 'http'.
  file_sd_configs:
    - files:
      - foo/*.slow.json
      - foo/*.slow.yml
      - single/file.yml
      refresh_interval: 10m
    - files:
      - bar/*.yaml
  static_configs:
  - targets: ['localhost:9090', 'localhost:9191']
    labels:
      my:   label
      your: label
  relabel_configs:
  - source_labels: [job, __meta_dns_name]
    regex:         (.*)some-[regex]
    target_label:  job
    replacement:   foo-${1}
    action defaults to 'replace'
  - source_labels: [abc]
    target_label:  cde
  - replacement:   static
    target_label:  abc
  - regex:
    replacement:   static
    target_label:  abc
  bearer_token_file: valid_token_file
- job_name: service-x
  basic_auth:
    username: admin_name
    password: "multiline\nmysecret\ntest"
  scrape_interval: 50s
  scrape_timeout:  5s
  sample_limit: 1000
  metrics_path: /my_path
  scheme: https
  dns_sd_configs:
  - refresh_interval: 15s
    names:
    - first.dns.address.domain.com
    - second.dns.address.domain.com
  - names:
    - first.dns.address.domain.com
    refresh_interval defaults to 30s.
  relabel_configs:
  - source_labels: [job]
    regex:         (.*)some-[regex]
    action:        drop
  - source_labels: [__address__]
    modulus:       8
    target_label:  __tmp_hash
    action:        hashmod
  - source_labels: [__tmp_hash]
    regex:         1
    action:        keep
  - action:        labelmap
    regex:         1
  - action:        labeldrop
    regex:         d
  - action:        labelkeep
    regex:         k
  metric_relabel_configs:
  - source_labels: [__name__]
    regex:         expensive_metric.*
    action:        drop
- job_name: service-y
  consul_sd_configs:
  - server: 'localhost:1234'
    token: mysecret
    services: ['nginx', 'cache', 'mysql']
    tag: "canary"
    node_meta:
      rack: "123"
    allow_stale: true
    scheme: https
    tls_config:
      ca_file: valid_ca_file
      cert_file: valid_cert_file
      key_file:  valid_key_file
      insecure_skip_verify: false
  relabel_configs:
  - source_labels: [__meta_sd_consul_tags]
    separator:     ','
    regex:         label:([^=]+)=([^,]+)
    target_label:  ${1}
    replacement:   ${2}
- job_name: service-z
  tls_config:
    cert_file: valid_cert_file
    key_file: valid_key_file
  bearer_token: mysecret
- job_name: service-kubernetes
  kubernetes_sd_configs:
  - role: endpoints
    api_server: 'https://localhost:1234'
    basic_auth:
      username: 'myusername'
      password: 'mysecret'
- job_name: service-kubernetes-namespaces
  kubernetes_sd_configs:
  - role: endpoints
    api_server: 'https://localhost:1234'
    namespaces:
      names:
        - default
- job_name: service-marathon
  marathon_sd_configs:
  - servers:
    - 'https://marathon.example.com:443'
    auth_token: "mysecret"
    tls_config:
      cert_file: valid_cert_file
      key_file: valid_key_file
- job_name: service-ec2
  ec2_sd_configs:
    - region: us-east-1
      access_key: access
      secret_key: mysecret
      profile: profile
      filters:
        - name: tag:environment
          values:
            - prod
        - name: tag:service
          values:
            - web
            - db
- job_name: service-azure
  azure_sd_configs:
    - environment: AzurePublicCloud
      authentication_method: OAuth
      subscription_id: 11AAAA11-A11A-111A-A111-1111A1111A11
      tenant_id: BBBB222B-B2B2-2B22-B222-2BB2222BB2B2
      client_id: 333333CC-3C33-3333-CCC3-33C3CCCCC33C
      client_secret: mysecret
      port: 9100
- job_name: service-nerve
  nerve_sd_configs:
    - servers:
      - localhost
      paths:
      - /monitoring
- job_name: 0123service-xxx
  metrics_path: /metrics
  static_configs:
    - targets:
      - localhost:9090
- job_name: 测试
  metrics_path: /metrics
  static_configs:
    - targets:
      - localhost:9090
- job_name: service-triton
  triton_sd_configs:
  - account: 'testAccount'
    dns_suffix: 'triton.example.com'
    endpoint: 'triton.example.com'
    port: 9163
    refresh_interval: 1m
    version: 1
    tls_config:
      cert_file: testdata/valid_cert_file
      key_file: testdata/valid_key_file
- job_name: service-openstack
  openstack_sd_configs:
  - role: instance
    region: RegionOne
    port: 80
    refresh_interval: 1m
    tls_config:
      ca_file: valid_ca_file
      cert_file: valid_cert_file
      key_file:  valid_key_file
alerting:
  alertmanagers:
  - scheme: https
    static_configs:
    - targets:
      - "1.2.3.4:9093"
      - "1.2.3.5:9093"
      - "1.2.3.6:9093"
```
