# 03、kibana可视化：监控服务器CPU、网络、磁盘、内存指标
- 来源：https://ddkk.com/zhuanlan/monitoring/kibana/3.html
- 分类：监控工具
- 分组：教程目录
## 0. 引言

本期我们来讲解如何通过ELK+metricbeat来监控服务器/主机中的CPU、网络、磁盘、内存等指标变化。并绘制会数据看板来方便我们实时监控

## 1. 下载

首先关于ELK的搭建就不再累述了，不清楚的同学可以看看往期博客：

[ELK搭建（一）：实现分布式微服务日志监控](/zhuanlan/monitoring/kibana/1.html)

因为我的ELK环境是7.13.0的，所以我们需要下载对应版本的Metricbeat

[Metricbeat官方下载地址](https://www.elastic.co/cn/downloads/past-releases##metricbeat)

## 2 Metricbeat介绍

metricbeat是elstic官方推出的一款轻量型的采集器，属于beats系列中专门用于各种系统和服务统计的beat。不仅可以统计服务器cpu、内存、磁盘等数据，也可以统计redis、nginx、myql等服务的相关指标。

metricbeat定时从服务器中获取对应指标数据，然后发送到elasticsearch或者logstash中

**metricbeat由两个部分组成：**

1、module

所谓module就是针对不同的服务进行采集的模块，比如系统服务就是system module。metricbeat中支持的module有几十种，包括但不仅限于：ActiveMQ module,Apache module,Docker module,HTTP module等，具体可以metricbeat[官方文档中的modules部分](https://www.elastic.co/guide/en/beats/metricbeat/7.13/metricbeat-modules.html)查看

2、metricset

采集的内容，以system module为例，支持采集的内容包括cpu,load,memory,network,process,process_summary,uptime等

## 3. 安装Metricbeat

以下的安装步骤也可以在kibana中看到：主页>添加数据>系统指标

**1、** 将安装包上传到需要监控的服务器上，可以使用FTP软件或者以下指令上传；

```sh
scp metricbeat-7.13.0-linux-arm64.tar.gz root@192.168.244.18:/var/local 
```

**2、** 解压压缩包；

```sh
tar -zxvf metricbeat-7.13.0-linux-arm64.tar.gz 
```

**3、** 修改配置文件metricbeat.yml中的连接信息；

```sh
setup.template.settings:
  index.number_of_shards: 1
  index.number_of_replicas: 0
output.elasticsearch:
  hosts: ["192.168.244.11:9200"]
  username: "elastic"
  password: "elastic"
setup.kibana:
  host: "192.168.244.11:5601"
```

**4、** 启动system模块，metricbeat会根据modules.d/system.yml中的配置项来获取系统数据；

```sh
./metricbeat modules enable system
```

**5、** 配置要采集的内容，修改modules.d/system.yml配置文件；

```sh
vim modules.d/system.yml 
```

配置文件内容，这里使用默认的，具体可根据自己的需要进行配置

```sh
- module: system
  period: 10s
  metricsets:
    - cpu
    - load
    - memory
    - network
    - process
    - process_summary
    - socket_summary
   - entropy
   - core
   - diskio
   - socket
   - service
   - users
  process.include_top_n:
    by_cpu: 5      include top 5 processes by CPU
    by_memory: 5   include top 5 processes by memory
  Configure the mount point of the host’s filesystem for use in monitoring a host from within a container
 system.hostfs: "/hostfs"
- module: system
  period: 1m
  metricsets:
    - filesystem
    - fsstat
  processors:
  - drop_event.when.regexp:
      system.filesystem.mount_point: '^/(sys|cgroup|proc|dev|etc|host|lib|snap)($|/)'
- module: system
  period: 15m
  metricsets:
    - uptime
```

更多关于Metricbeat的配置可查看[官方文档](https://www.elastic.co/guide/en/beats/metricbeat/7.13/metricbeat-module-system.html)，metricbeat支持18种指标集：

**6、** 加载kibana仪表盘，如果之前已经设置过就不用再执行了；

```sh
./metricbeat setup
```

**7、** 启动metricbeat；

```sh
./metricbeat -e
```

**8、** 这里可以在kibana的系统指标部署流程指南中点击“检查数据”进行测试，成功的话如图所示；

**9、** 点击`系统指标仪表板`，自动创建数据看板并查看点击HostOverview我们可以看到服务器的主要指标，包括：已用CPU、内存、虚拟内存（swap）、进程数、输入输出流量等等；

#### 数据看板无数据如何解决

如果出现数据看板无法查看的话，说明是无法查询到数据

首先在索引管理页面看看是否有metric-开头的索引（也可以直接查询metricbeat别名），并且其文档数是否大于0。如果不存在该索引或者数量为0，说明metricbeat并没有成功把监控的系统数据传到es上，那么就需要到metricbeat上查看对应日志，或者查看es的日志，看看是否有报错，对症下药

其次如果索引存在，并且数量也大于0 ，说明数据是成功上传过来了的，这时候还显示不了，那么先调节一下查询的时间范围

如果还是没有数据显示，那么检查下metricbeat所在服务器的时区是否为中国时区，时间与当前网络时间是否同步，可以通过`date`查看当前时间。如果时间不对，将时间调整正确即可

## 总结

好了本期关于服务器基础指标的监控平台搭建教程就到此为止了，当然我们还没有针对metricbeat中的system模块的配置文件中的指标做介绍，这个我们将在后续进行详解，或者大家也可以直接查看官方文档。感兴趣的同学可以关注本专栏
