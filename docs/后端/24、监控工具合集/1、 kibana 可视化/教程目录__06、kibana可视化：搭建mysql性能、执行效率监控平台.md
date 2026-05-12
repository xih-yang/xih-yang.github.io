# 06、kibana可视化：搭建mysql性能、执行效率监控平台
- 来源：https://ddkk.com/zhuanlan/monitoring/kibana/6.html
- 分类：监控工具
- 分组：教程目录
## 0. 引言

mysql作为市场的主流数据库，承载了大部分公司的核心业务数据，同时也是大多数业务的底层存储。 针对mysql运行情况的监控必不可少，之前我们讲解了如何搭建mysql慢日志、错误日志的监控平台。

那么本期，我们针对mysql集群、性能、各类sql语句执行情况、服务状态等指标来搭建一个可视化的监控平台，方便我们实时了解mysql资源利用率、sql执行效率、访问压力等等。

## 1. 下载

我们的平台是基于elasticsearch+kibana来实现的，也就是我们常说的ELK体系。我们采用Metricbeat插件来采集监控mysql的运行数据。

当然我们这里为了保证搭建的便捷性，并没有使用到Logstash，如果大家有需要的话可以把Metricbeat采集到的数据输出到Logstash

首先关于ELK的搭建就不再累述了，不清楚的同学可以看看往期博客：

[ELK搭建（一）：实现分布式微服务日志监控](/zhuanlan/monitoring/kibana/1.html)

因为我的ELK环境是7.13.0的，所以我们需要下载对应版本的Metricbeat

[Metricbeat官方下载地址](https://www.elastic.co/cn/downloads/past-releases##metricbeat)

## 2. Metricbeat介绍

metricbeat是elstic官方推出的一款轻量型的采集器，属于beats系列中专门用于各种系统和服务统计的beat。不仅可以统计mysql等数据，也可以统计redis、nginx、服务器cpu、内存、磁盘等服务的相关指标。

metricbeat定时从服务器中通过抓包的方式获取对应指标数据，然后发送到elasticsearch或者logstash中

metricbeat由两个部分组成：

**1、module**

所谓module就是针对不同的服务进行采集的模块，比如系统服务就是system module。metricbeat中支持的module有几十种，包括但不仅限于：ActiveMQ module,Apache module,Docker module,HTTP module等，具体可以metricbeat[官方文档中的modules部分](https://www.elastic.co/guide/en/beats/metricbeat/7.13/metricbeat-modules.html)查看

**2、metricset**

采集的内容，以mysql module为例，支持采集的内容包括但不仅限于：

（1）select、update、insert、update语句速率

（2）当前mysql线程连接数

（3）线程连接数趋势

（4）中止连接率趋势

（5）线程活动趋势

（6）缓冲池数据量变化趋势

（7）缓冲池利用率变化趋势

（8）缓冲池效率趋势

（9）mysql网络流量趋势

（10）IO访问次数趋势

## 3. 安装Metricbeat

以下的安装步骤也可以在kibana中看到：主页>添加数据>MySQL 指标

**1、** 将安装包上传到需要mysql所在的服务器上，可以使用FTP软件或者以下指令上传；

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

**4、** 启动mysql模块，metricbeat会根据modules.d/mysql.yml中的配置项来获取系统数据；

```sh
./metricbeat modules enable mysql
```

**5、** 配置要采集的内容，修改modules.d/mysql.yml配置文件；

```sh
vim modules.d/mysql.yml 
```

配置文件内容，这里我们将status、galera_status、performance的指标都开启，具体可根据自己的需要进行配置

`注意`：这里没有开启query指标集，这是因为query用于监控我们自定义查询语句的指标数据的，需要额外配置其他项并且需要自己构建看板，并不能拆箱即用，所以我们在以后单独介绍。如果直接开启query的话，会出现报错

```sh
- module: mysql
  metricsets:
    - status
    - galera_status
    - performance
   - query
  period: 10s
  hosts: ["root:123456@tcp(127.0.0.1:3306)/"] 
```

这里的mysql配置也可以采取如下形式

```sh
hosts: ["tcp(127.0.0.1:3306)/"]
username: root
password: 123456
```

更多关于Metricbeat的配置可查看[官方文档](https://www.elastic.co/guide/en/beats/metricbeat/7.13/metricbeat-module-mysql.html)

metricbeat-mysql支持4种指标集：

**6、** 加载kibana仪表盘，如果之前已经设置过就不用再执行了；

```sh
./metricbeat setup
```

**7、** 启动metricbeat（如果上述的指令没有自动退出的话，就新开个窗口执行，不要退出上述指令窗口）；

```sh
./metricbeat -e
```

**8、** 这里可以在kibana的mysql指标部署流程指南中点击“检查数据”进行测试，成功的话如图所示；

**9、** 我们对数据库做一下查询、新增、修改等操作，创造一些数据，然后点击`mysql指标仪表板`（MetricbeatMySQL）；

可以看到mysql的相关指标都显示出来了。

如果觉得看板太过拥挤可以拖拽调整看板位置和大小

### 图表详情

为了大家观看方便，单独截取几个图表出来，供大家参考

问题率

select语句速率

insert,update,delete速率

连接数变化趋势

线程趋势

缓冲池效率

网络流量

## 常见报错

### 1、Exiting: 1 error: missing required field accessing ‘0.queries’

mysql.yml中使用query metricset需要额外再配置其他属性，如下所示

```sh
- module: mysql
  metricsets:
    - status
    - galera_status
    - performance
    - query
  period: 10s
  hosts: ["root:123456@tcp(127.0.0.1:3306)/"]
  query metricsets 额外配置项
  namespace: "my_namespace"
  queries:
  - query: "select * from user_test.user"
    response_format: "table"
    query_namespace: "user query"
  - query: "select * from order_test.order"
    response_format: "table"
    query_namespace: "order query"
```

### 2、点击检查数据一直显示‘未收到数据’

这是因为metricbeat配置未成功导致的，检查mysql.yml配置文件，以及elasticsearch，kibana，mysql的地址是否正确
