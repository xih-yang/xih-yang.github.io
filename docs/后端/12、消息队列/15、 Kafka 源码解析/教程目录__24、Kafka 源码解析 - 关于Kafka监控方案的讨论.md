# 24、Kafka 源码解析 - 关于Kafka监控方案的讨论
- 来源：https://ddkk.com/zhuanlan/mq/kafka/8/24.html
- 分类：消息队列
- 分组：教程目录
目前Kafka监控方案看似很多，然而并没有一个“大而全”的通用解决方案。各家框架也是各有千秋，以下是我了解到的一些内容：

## 一、Kafka manager

Github地址： https://github.com/yahoo/kafka-manager。 这款监控框架的好处在于监控内容相对丰富，既能够实现broker级常见的JMX监控(比如出入站流量监控)，也能对consumer消费进度进行监控(比如lag等)。另外用户还能在页面上直接对集群进行管理，比如分区重分配或创建topic——当然这是一把双刃剑，好在kafka manager自己提供了只读机制，允许用户禁掉这些管理功能。

## 二、Kafka Monitor

Github地址：[https://github.com/linkedin/kafka-monitor。](https://link.zhihu.com/?target=https%3A//github.com/linkedin/kafka-monitor%25E3%2580%2582%25E8%25BF%2599%25E6%25AC%25BE%25E7%259B%2591%25E6%258E%25A7%25E6%25A1%2586%25E6%259E%25B6%25E6%259B%25B4%25E5%25A4%259A%25E7%259A%2584%25E6%2598%25AF%25E5%2585%25B3%25E6%25B3%25A8%25E5%25AF%25B9Kafka%25E9%259B%2586%25E7%25BE%25A4%25E5%2581%259A%25E7%25AB%25AF%25E5%2588%25B0%25E7%25AB%25AF%25E7%259A%2584%25E6%2595%25B4%25E4%25BD%2593%25E7%25B3%25BB%25E7%25BB%259F%25E6%25B5%258B%25E8%25AF%2595%25EF%25BC%258C%25E5%25B9%25B6%25E4%25BA%25A7%25E5%2587%25BA%25E5%2590%2584%25E7%25A7%258D%25E7%25B3%25BB%25E7%25BB%259F%25E7%25BA%25A7%25E7%259A%2584%25E7%259B%2591%25E6%258E%25A7%25E6%258C%2587%25E6%25A0%2587%25EF%25BC%258C%25E6%25AF%2594%25E5%25A6%2582%25E7%25AB%25AF%25E5%2588%25B0%25E7%25AB%25AF%25E7%259A%2584%25E5%25BB%25B6%25E6%2597%25B6%25EF%25BC%258C%25E6%2595%25B4%25E4%25BD%2593%25E6%25B6%2588%25E6%2581%25AF%25E4%25B8%25A2%25E5%25A4%25B1%25E7%258E%2587%25E7%25AD%2589%25E3%2580%2582%25E5%25AF%25B9%25E4%25BA%258E%25E6%2596%25B0%25E6%2590%25AD%25E5%25BB%25BA%25E7%259A%2584Kafka%25E7%25BA%25BF%25E4%25B8%258A%25E9%259B%2586%25E7%25BE%25A4%25EF%25BC%258C%25E4%25BD%25BF%25E7%2594%25A8Kafka) 这款监控框架更多的是关注对Kafka集群做端到端的整体系统测试，并产出各种系统级的监控指标，比如端到端的延时，整体消息丢失率等。对于新搭建的Kafka线上集群，使用Kafka Monitor做个整体测试有助于你了解该集群整体的一些性能，但若是用于日常监控该框架便有些不便了，需要自己修改webapp/index.html中的监控指标，流程上有些不太友好。不过这款框架的优势是其主要贡献者是LinkedIn的lindong(Kafka 1.0.0版本中正式支持JBOD就是lindong开发的)，质量上应该是有保证的。

## 三、Kafka Offset Monitor

Github地址：https://github.com/quantifind/KafkaOffsetMonitor。 KafkaOffsetMonitor应该算比较早的监控框架了，有着很酷的UI，使用者也是很多。但其比较大的劣势是对新版本consumer和security的支持，另外该项目已经近2年未维护了，其主力开发甚至是另起炉灶，重新写了一个新的KafkaOffsetMonitor来支持新版本consumer——[https://github.com/Morningstar/kafka-offset-monitor。](https://link.zhihu.com/?target=https%3A//github.com/Morningstar/kafka-offset-monitor%25E3%2580%2582%25E4%25B8%258D%25E8%25BF%2587%25E7%259B%25AE%25E5%2589%258D%25E8%25AF%25A5%25E9%25A1%25B9%25E7%259B%25AEstar%25E6%2595%25B0%25E5%25BE%2588%25E5%25B0%2591%25EF%25BC%258C%25E5%25BA%2594%25E8%25AF%25A5%25E6%25B2%25A1%25E6%259C%2589%25E5%25A4%25A7%25E8%25A7%2584%25E6%25A8%25A1%25E5%25BA%2594%25E7%2594%25A8%25EF%25BC%258C%25E5%2588%25B0%25E5%25BA%2595%25E6%2598%25AF%25E5%2590%25A6%25E9%2580%2582%25E7%2594%25A8%25E4%25BA%258E%25E7%2594%259F%25E4%25BA%25A7%25E7%258E%25AF%25E5%25A2%2583%25E9%259C%2580%25E8%25A6%2581%25E7%2594%25A8%25E6%2588%25B7%25E8%2587%25AA%25E8%25A1%258C%25E5%2588%25A4%25E6%2596%25AD)不过目前该项目star数很少，应该没有大规模应用，到底是否适用于生产环境需要用户自行判断

## 四、Burrow

Github地址： https://github.com/linkedin/Burrow。 Burrow是LinkedIn开源的一款专门监控consumer lag的框架。事实上，当初其开源时我对它还是期待挺高的，不过令人遗憾地是后劲不足，发展得非常缓慢，而且这款框架是用Go写的，安装时要求必须有Go运行环境，故Burrow在普及上不如其他框架。Burrow没有UI界面，只开放了很多HTTP endpoint，这对于想偷懒的运维来说更是一个减分项。总之它的功能目前十分有限，普及率和知名度都是比较低的。不过好处是该项目主要贡献者是LinkedIn团队维护Kafka集群的主要负责人，故质量上是很有保证的

## 五、JMXTrans + InfluxDB + Grafana

这实际上是一套监控框架的组合。有着非常非常炫酷的UI效果，极其适合向领导展示。具体搭建方法网上有很多教程，可以参考下。这里就不再赘述了。

总之，目前Kafka的监控并没有“放之四海而皆准”的解决方案，应该说每种框架都有自己独到的地方。用户需要结合自身监控需求选择适合的监控框架~
