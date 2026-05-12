# 11、ELK搭建（十一）：搭建MongoDB运行情况监控平台
- 来源：https://ddkk.com/zhuanlan/monitoring/kibana/11.html
- 分类：监控工具
- 分组：教程目录
## 0. 引言

mongoDB作为基于磁盘的非关系型数据库，JSON格式数据存储方式，具有优秀的查询效率。越来越多的场景使用到了MongoDB。在生产运维中，更需要我们能够实时的掌握mongo的运行情况，以方便我们数据库运行问题做出及时的调整和补救。

今天我们就MongoDB运行的实时情况，来搭建一个数据监控平台

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

所谓module就是针对不同的服务进行采集的模块，比如系统服务就是mongodb module。metricbeat中支持的module有几十种，包括但不仅限于：ActiveMQ module,Apache module,Docker module,HTTP module等，具体可以metricbeat[官方文档中的modules部分](https://www.elastic.co/guide/en/beats/metricbeat/7.13/metricbeat-module-mongodb.html)查看

2、metricset

采集的内容，以mongodb module为例，支持5种指标集：

- collstats

集合的相关信息，该数据集反馈了增删改查、红锁、写锁等指令的操作计数
- dbstats

数据库存储的相关信息，包含了集合数、对象平均大小、索引大小、当前数据大小等
- metrics

相关指令的执行和失败次数统计，比如aggregate、build_info、coll_stats等指令
- replstatus

反馈了mongo复制集的相关状态
- status

数据库锁、连接、内存、网络、日志等相关信息

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

**4、** 启动docker模块，metricbeat会根据modules.d/mongodb.yml中的配置项来获取系统数据；

```sh
./metricbeat modules enable mongodb
```

**5、** 配置要采集的内容，修改modules.d/mongodb.yml配置文件；

```sh
vim modules.d/mongodb.yml
```

配置文件内容，这里我们将所有指标集都开启，具体可根据自己的需要进行配置

```sh
- module: mongodb
  metricsets:
    - dbstats
    - status
    - collstats
    - metrics
    - replstatus
  period: 10s
  [mongodb://][user:pass@]host[:port]
  hosts: ["localhost:27017"]
  username: root
  password: 123456
```

**6、** 如上开启的指标集是通过mongodb的相关指令来采集的，而这些指令是需要给账号配置`clusterMonitor`角色权限的；

（1）登陆mongodb

```sh
mongo admin -u root -p 123456
```

（2）赋予`clusterMonitor`权限

```sh
db.grantRolesToUser("root",[{ role: "clusterMonitor", db: "admin" }]);
```

（3）重启mongodb

**7、** 加载kibana仪表盘，如果之前已经设置过就不用再执行了；

```sh
./metricbeat setup
```

**8、** 启动metricbeat（如果上述的指令没有自动退出的话，就新开个窗口执行，不要退出上述指令窗口）；

```sh
./metricbeat -e
```

**9、** 在kibana的`discover`窗口中查询`metricbeat-*`索引模式，能够查询到mongodb相关字段数据表明配置成功；

**10、** kibana中点击Dashboard，进入仪表盘，输入`mongo`，选择`OverviewECS`看板点击进入；

**11、** 右上角的数据默认是过去15分钟，如果查询没有数据的话，调整下时间范围；

至此，我们就可以看到mongodb服务的相关运行指标了，包括连接数、内存、并发事务等等，更多的指标还等待大家自己去探索！
