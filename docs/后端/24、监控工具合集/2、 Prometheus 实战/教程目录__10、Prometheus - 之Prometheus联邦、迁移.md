# 10、Prometheus - 之Prometheus联邦、迁移
- 来源：https://ddkk.com/zhuanlan/monitoring/prometheus/10.html
- 分类：监控工具
- 分组：教程目录
## 0.前言

FEDERATION 允许Prometheus服务器从另一台Prometheus服务器抓取选定的时间序列。

## 1.用例

联盟有不同的用例。通常，它用于实现可扩展的Prometheus监控设置或将相关指标从一个服务的Prometheus拉到另一个服务。

### 1.1分层联盟

分层联盟使Prometheus可以扩展到具有数十个数据中心和数百万个节点的环境。在此用例中，联合拓扑就像一棵树，更高级别的Prometheus服务器从大量从属服务器收集聚合的时间序列数据。

例如，设置可能包含许多高度详细收集数据的每个数据中心Prometheus服务器（实例级深入分析），以及一组仅收集和存储聚合数据的全局Prometheus服务器（作业级向下钻取））来自那些本地服务器。 这提供了聚合全局视图和详细的本地视图。

### 1.2跨服务联盟

在跨服务联盟中，将一项服务的Prometheus服务器配置为从另一项服务的Prometheus服务器抓取所选数据，以针对单个服务器内的两个数据集启用警报和查询。

例如，运行多个服务的集群调度程序可能会公开有关集群上运行的服务实例的资源使用情况信息（例如内存和CPU使用情况）。另一方面，在该群集上运行的服务将仅公开特定于应用程序的服务指标。通常，这两组指标是由单独的Prometheus服务器抓取的。使用联盟，包含服务级别指标的Prometheus服务器可以从群集Prometheus中获取有关其特定服务的群集资源使用指标，以便可以在该服务器中使用这两组指标。

## 2.联邦配置

在任何给定的Prometheus服务器上，`/federate`端点允许检索该服务器中所选时间序列集的当前值。 必须至少指定一个`match[]`URL参数才能选择要公开的时间序列。 每个`match[]`参数都需要指定一个瞬时向量选择器，如`up`或`{job="api-server"}`。 如果提供了多个`match[]`参数，则选择所有匹配系列的并集。

要将指标从一个服务器联合到另一个服务器，请将目标Prometheus服务器配置为从源服务器的`/federate`端点进行采集，同时还启用`honor_labels scrape`选项（以不覆盖源服务器公开的任何标签）并传入所需的`match[]`参数。

例如，以下scrape_config将任何带有标签`job="prometheus"`的系列或以job开头的度量标准名称联合起来：`source-prometheus-{1,2,3}:9090`的Prometheus服务器进入抓取Prometheus：

```sh
scrape_configs:
  - job_name: 'federate'
    scrape_interval: 15s
    honor_labels: true
    metrics_path: '/federate'
    params:
      'match[]':
        - '{job="prometheus"}'
        - '{__name__=~"job:.*"}'
    static_configs:
      - targets:
        - 'source-prometheus-1:9090'
        - 'source-prometheus-2:9090'
        - 'source-prometheus-3:9090'
```

## 3.迁移指南

[PROMETHEUS 2.0迁移指南](https://prometheus.io/docs/prometheus/latest/migration/)、[Prometheus简介](https://prometheus.fuckcloudnative.io/)
