# 09、ELK搭建（九）：搭建Docker容器指标监控平台
- 来源：https://ddkk.com/zhuanlan/monitoring/kibana/9.html
- 分类：监控工具
- 分组：教程目录
## 0. 引言

Docker是一款轻量级的应用容器引擎，可以帮助我们快速部署各类软件，自动化构建系列生产环境。因此，我们也需要一个统一的监控页面，来让我们实时了解docker中各个容器的运行情况

所以今天，我们的目标就是基于ELK搭建一个docker容器监控平台

## 1. 下载

我们的平台是基于elasticsearch+kibana来实现的，也就是我们常说的ELK体系。我们采用Metricbeat插件来采集监控docker的运行数据。

当然我们这里为了保证搭建的便捷性，并没有使用到Logstash，如果大家有需要的话可以把Metricbeat采集到的数据输出到Logstash

首先关于ELK的搭建就不再累述了，不清楚的同学可以看看往期博客：

[ELK搭建（一）：实现分布式微服务日志监控](/zhuanlan/monitoring/kibana/1.html)

因为我的ELK环境是7.13.0的，所以我们需要下载对应版本、对应系统的Metricbeat

[Metricbeat官方下载地址](https://www.elastic.co/cn/downloads/past-releases##metricbeat)

## 2. Metricbeat介绍

metricbeat是elstic官方推出的一款轻量型的采集器，属于beats系列中专门用于各种系统和服务统计的beat。不仅可以统计docker等数据，也可以统计redis、nginx、服务器cpu、内存、磁盘等服务的相关指标。

metricbeat定时从服务器中通过抓包的方式获取对应指标数据，然后发送到elasticsearch或者logstash中

metricbeat由两个部分组成：

1、module

所谓module就是针对不同的服务进行采集的模块，比如系统服务就是system module。metricbeat中支持的module有几十种，包括但不仅限于：ActiveMQ module,Apache module,Docker module,HTTP module等，具体可以metricbeat[官方文档中的modules部分](https://www.elastic.co/guide/en/beats/metricbeat/7.13/metricbeat-modules.html)查看

2、metricset

采集的内容，以postgresql module为例，支持九种指标集：

（1）container：容器相关指标

（2）cpu：CPU相关指标

（3）diskio：磁盘相关指标

（4）event：docker指令相关指标

（5）healthcheck：心跳检查相关指标

（6）image：镜像相关指标

（7）info：容器运行状态相关指标

（8）memory：内存相关指标

（9）network：网络相关指标

更多关于指标集的介绍可以查看[官方文档](https://www.elastic.co/guide/en/beats/metricbeat/7.13/metricbeat-module-docker.html)

## 3. 安装Metricbeat

**1、** 将安装包上传到服务器上，可以使用FTP软件或者以下指令上传；

```sh
scp metricbeat-7.13.0-linux-arm64.tar.gz root@192.168.244.18:/var/local 
```

**2、** 解压压缩包；

```sh
tar -zxvf metricbeat-7.13.0-linux-arm64.tar.gz 
```

**3、** 修改配置文件metricbeat.yml中的连接信息；

```sh
vim metricbeat.yml
```

修改内容

```sh
setup.template.settings:
## 因为我这里es是单节点，所以设置主分片数为1，副本分片数为0.否则会报黄
  index.number_of_shards: 1
  index.number_of_replicas: 0
output.elasticsearch:
## 你的es所在服务器ip
  hosts: ["192.168.244.11:9200"]
  username: "elastic"
  password: "elastic"
setup.kibana:
## kibana所在服务器ip
  host: "192.168.244.11:5601"
```

**4、** 启动docker模块，metricbeat会根据modules.d/docker.yml中的配置项来获取系统数据；

```sh
./metricbeat modules enable docker
```

**5、** 配置要采集的内容，修改modules.d/docker.yml配置文件；

```sh
vim modules.d/docker.yml 
```

配置文件内容，这里我们将全部的指标都开启，具体可根据自己的需要进行配置

```sh
- module: docker
  metricsets:
    - container
    - cpu
    - diskio
    - event
    - healthcheck
    - info
    - memory
    - network
  period: 10s
  hosts: ["unix:///var/run/docker.sock"]
  enabled: true	
  If set to true, replace dots in labels with _.
 labels.dedot: false
  To connect to Docker over TLS you must specify a client and CA certificate.
 ssl:
   certificate_authority: "/etc/pki/root/ca.pem"
   certificate:           "/etc/pki/client/cert.pem"
   key:                   "/etc/pki/client/cert.key"
```

**6、** 加载kibana仪表盘，如果之前已经设置过就不用再执行了；

```sh
./metricbeat setup
```

**7、** 启动metricbeat（如果上述的指令没有自动退出的话，就新开个窗口执行，不要退出上述指令窗口）；

```sh
./metricbeat -e
```

**8、** 在kibana的`discover`窗口中查询`metricbeat-*`索引模式，能够查询到docker相关字段数据表明配置成功；

**9、** kibana中点击Dashboard，进入仪表盘，输入`docker`，选择`OverviewECS`看板点击进入；

**10、** 右上角的数据默认是过去1小时，如果查询没有数据的话，调整下时间范围；

针对docker的容器监控就搭建完成啦，操作并不难，动手试试吧～
