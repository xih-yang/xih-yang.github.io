# 08、kibana可视化：搭建PostgreSQL性能、运行效率监控平台
- 来源：https://ddkk.com/zhuanlan/monitoring/kibana/8.html
- 分类：监控工具
- 分组：教程目录
## 0. 引言

PostgreSQL作为一款免费、开源、企业级的关系数据库，被越来越多的企业所青睐，上一章我们讲解了如何搭建一个实时监控PostgreSQL慢日志、错误日志的平台，但是针对PostgreSQL的运行性能还无法监控，生产环境中，特别是构建了数据库集群后，我们常常需要了解到各个数据库的运行情况、性能效率等， 这样才能为我们数据库优化、性能优化提供更有力的保障

话不多说，今天我们就来搭建一个PostgreSQL性能、运行效率监控平台

## 1. 下载

我们的平台是基于elasticsearch+kibana来实现的，也就是我们常说的ELK体系。我们采用Metricbeat插件来采集监控postgresql的运行数据。

当然我们这里为了保证搭建的便捷性，并没有使用到Logstash，如果大家有需要的话可以把Metricbeat采集到的数据输出到Logstash

首先关于ELK的搭建就不再累述了，不清楚的同学可以看看往期博客：

[ELK搭建（一）：实现分布式微服务日志监控](/zhuanlan/monitoring/kibana/1.html)

因为我的ELK环境是7.13.0的，所以我们需要下载对应版本、对应系统的Metricbeat

[Metricbeat官方下载地址](https://www.elastic.co/cn/downloads/past-releases##metricbeat)

## 2. Metricbeat介绍

metricbeat是elstic官方推出的一款轻量型的采集器，属于beats系列中专门用于各种系统和服务统计的beat。不仅可以统计postgresql等数据，也可以统计redis、nginx、服务器cpu、内存、磁盘等服务的相关指标。

metricbeat定时从服务器中通过抓包的方式获取对应指标数据，然后发送到elasticsearch或者logstash中

metricbeat由两个部分组成：

- 1、module

所谓module就是针对不同的服务进行采集的模块，比如系统服务就是system module。metricbeat中支持的module有几十种，包括但不仅限于：ActiveMQ module,Apache module,Docker module,HTTP module等，具体可以metricbeat[官方文档中的modules部分](https://www.elastic.co/guide/en/beats/metricbeat/7.13/metricbeat-modules.html)查看
- 2、metricset

采集的内容，以postgresql module为例，支持四种指标集：

（1）activity：进程活动指标集，包含客户端、数据库、进程ID、用户等指标

（2）bgwriter：缓存刷新指标集，包含缓冲区、检查点相关指标

（3）database：数据库指标集，包含blocks、冲突、死锁、数据行变化情况等指标

（4）statement：状态指标集，包含查询调用次数、本地内存、共享内存、临时内存、响应时间、执行计划、执行统计等指标

更多关于指标集的介绍可以查看[官方文档](https://www.elastic.co/guide/en/beats/metricbeat/7.13/metricbeat-module-postgresql.html)

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

**4、** 启动postgresql模块，metricbeat会根据modules.d/postgresql.yml中的配置项来获取系统数据；

```sh
./metricbeat modules enable postgresql
```

**5、** 配置要采集的内容，修改modules.d/postgresql.yml配置文件；

```sh
vim modules.d/postgresql.yml 
```

配置文件内容，这里我们将database、bgwriter、activity的指标都开启，具体可根据自己的需要进行配置

```sh
- module: postgresql
  metricsets:
    - database
    - bgwriter
    - activity
  period: 10s
  hosts: ["postgres://localhost:5432?sslmode=disable"]
  username: postgres
  password: postgres
```

**6、** 加载kibana仪表盘，如果之前已经设置过就不用再执行了；

```sh
./metricbeat setup
```

**7、** 启动metricbeat（如果上述的指令没有自动退出的话，就新开个窗口执行，不要退出上述指令窗口）；

```sh
./metricbeat -e
```

**8、** 在kibana的dev-tool窗口中查询`metricbeat-7.13.0`索引，能够查询到上述指标集数据表明配置成功；

```sh
GET metricbeat-7.13.0/_search
```

**9、** kibana中点击Dashboard，进入仪表盘，输入`postgresql`，选择`Databaseoverview`看板点击进入；

**10、** 同时我们在数据库中进行一些增删改查操作，制造一些数据可以选择查询哪个数据库，不选的话默认全部；

这里看到`Query Latency`和`Top Queries`图表是无数据的，这是因为没有开启statement指标集，我们将在最后讲解该指标集

如果查询没有数据的话，检查下右上角的查询时间范围，以及postgresql服务器的的时间是否正确。

## 4. 使用statement指标集

statement指标集我们在上述的演示中并没有开启，这是因为该指标集需要在postgresql服务器中单独配置`pg_stats_statement`模块。并且开启该模块会额外占用我们的服务器内存，所以`Use it when really need`

[statement 官方文档](https://www.elastic.co/guide/en/beats/metricbeat/7.13/metricbeat-metricset-postgresql-statement.html)

**1、** 在postgresql配置文件中添加；

```sh
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.max = 10000
pg_stat_statements.track = all
```

**2、** 重启postgresql（我这里是homebrew安装的，所以采用该指令重启）；

```sh
brew services restart postgresql
```

**3、** 登陆postgresql，执行指令；

```sh
CREATE EXTENSION pg_stat_statements;
```

**4、** metricbeatpg配置文件中添加`statement`坐标集；

```sh
- module: postgresql
  metricsets:
    - database
    - bgwriter
    - activity
    - statement
  period: 10s
  hosts: ["postgres://localhost:5432?sslmode=disable"]
  username: postgres
  password: postgres
```

**5、** 重启metricbeat，查看看板，数据发生了变化；
