# 10、ELK搭建（十）：搭建redis运行指标监控平台
- 来源：https://ddkk.com/zhuanlan/monitoring/kibana/10.html
- 分类：监控工具
- 分组：教程目录
## 0. 引言

Redis作为基于内存的非关系型数据库，常常被应用于热点数据缓存，它很大程度上为我们关系性数据库提供了性能补充。保证redis的高可用，对应整个应用程序的运行至关重要，一个直观的监控redis运行情况的数据看板可以为我们实时了解redis运行情况提供极大的便利。

话不多说，开始我们今天的监控平台搭建之旅吧

## 1. 下载

我们的平台是基于elasticsearch+kibana来实现的，也就是我们常说的ELK体系。我们采用Metricbeat插件来采集监控redis的运行数据。

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

采集的内容，以redis module为例，支持三种指标集：

（1）info：通过redis info指令来查询redis的相关运行数据，包括但不仅限于服务器运行的环境参数、客户端相关信息、 服务器运行内存统计数据、持久化信息、 通用数据统计、主从复制相关信息、CPU使用情况

（2）key：redis key相关指标

（3）keyspace：redis keyspace相关指标信息，也是通过info指令获取。要使用这个指标集的话需要提前在redis中开启键空间通知keyspace，但这个会额外消耗内存，还是那句话：`Use it when you really need`

更多关于指标集的介绍可以查看[官方文档](https://www.elastic.co/guide/en/beats/metricbeat/7.13/metricbeat-module-redis.html)

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

**4、** 启动docker模块，metricbeat会根据modules.d/redis.yml中的配置项来获取系统数据；

```sh
./metricbeat modules enable redis
```

**5、** 配置要采集的内容，修改modules.d/redis.yml配置文件；

```sh
vim modules.d/redis.yml 
```

配置文件内容，这里我们将info,keyspace指标集都开启，具体可根据自己的需要进行配置

这里我们没有开启key指标集，我们将在最后单独讲解

```sh
- module: redis
  metricsets:
    - info
    - keyspace
##    - key
  period: 10s
  Redis hosts
  hosts: ["127.0.0.1:6379"]
  Network type to be used for redis connection. Default: tcp
 network: tcp
  Max number of concurrent connections. Default: 10
 maxconn: 10
  Redis AUTH password. Empty by default.
 password: foobared
```

**6、** 加载kibana仪表盘，如果之前已经设置过就不用再执行了；

```sh
./metricbeat setup
```

**7、** 启动metricbeat（如果上述的指令没有自动退出的话，就新开个窗口执行，不要退出上述指令窗口）；

```sh
./metricbeat -e
```

**8、** 在kibana的`discover`窗口中查询`metricbeat-*`索引模式，能够查询到redis相关字段数据表明配置成功；

**9、** kibana中点击Dashboard，进入仪表盘，输入`redis`，选择`OverviewECS`看板点击进入；

**10、** 右上角的数据默认是过去1小时，如果查询没有数据的话，调整下时间范围；

这里keyspaces看板没有数据，是因为我们redis中没有开启keyspace，这个我们会在后面开启给大家演示。

## 4. key指标集

key指标集是redis键相关的指标，要开启这个指标集的话，需要我们额外配置键的匹配模式，如下所示，我们开启了监听`user_`开头的key。limit限制了监听20个key

```sh
- module: redis
  metricsets:
    - key
  key.patterns:
    - pattern: 'user_*'
      limit: 20
```

重启metricbeat，我们再添加、修改、删除几条`user_*` key，增加一些数据

key指标集使用了一个单独的数据看板，进入dashboard，输入`redis`，进入`Keys ECS`

可以查看到key相关的数据

## 5. redis开启keyspace通知

登陆redis

```sh
redis-cli
```

执行指令，如下设置会监听所有的键，这里仅作测试，具体大家根据自己的需求来设置

```sh
config set notify-keyspace-events KEA
```

监听所有键

```sh
psubscribe '__key*__:*'
```

在另外一个窗口登陆redis，添加一个键值

```sh
set user_test 111
```

会发现之前的窗口输出了新增的键

开启完成后，再次查看看板，会发现keysapces中已经有数据了（注意，如果仅仅是开启订阅，而没有添加key进去，也不会产生数据）

至此，我们针对redis的指标监控就全部结束了，动手操作试试吧
