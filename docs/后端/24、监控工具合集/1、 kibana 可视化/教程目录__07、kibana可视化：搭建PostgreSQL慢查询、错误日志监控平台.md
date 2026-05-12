# 07、kibana可视化：搭建PostgreSQL慢查询、错误日志监控平台
- 来源：https://ddkk.com/zhuanlan/monitoring/kibana/7.html
- 分类：监控工具
- 分组：教程目录
## 0. 引言

PostgreSQL是一款功能非常强大的的关系性数据库，适用于需要执行复杂查询的系统。市面上越来越多的公司开始采用PostgreSQL作为主数据库。

今天我们就来讲解如何搭建一个PostgreSQL的慢日志、错误日志监控平台，实时了解到数据库的日志情况，来帮助我们快速排错及优化。

## 2. 下载

我们的平台是基于elasticsearch+kibana来实现的，也就是我们常说的ELK体系。我们采用filebeat插件来采集监控postgresql的运行数据。

当然我们这里为了保证搭建的便捷性，并没有使用到Logstash，如果大家有需要的话可以把filebeat采集到的数据输出到Logstash

关于ELK的搭建就不再累述了，不清楚的同学可以看看往期博客：

[ELK搭建（一）：实现分布式微服务日志监控](/zhuanlan/monitoring/kibana/1.html)

因为我的ELK环境是7.13.0的，所以我们需要下载对应版本的filebeat

[filebeat官方下载地址](https://www.elastic.co/cn/downloads/past-releases##filebeat)

## 3. filebeat介绍

filebeat是elastic官方提供的一个轻量级的日志采集器，根据名称也能知道，主要用于文件的数据采集。基于Golang开发，可以安装到想要日志的服务器或者主机上来定期读取对应的数据，并发送到elasticsearch或者logstash上，甚至数据量大时，我们还可以先输出到kafka、redis等中间件上。

根据[官方文档](https://www.elastic.co/guide/en/beats/filebeat/8.2/how-filebeat-works.html)的解释，filebeat 主要包含两个主要组件：input和harvesters。

- harvester: harvester用于按行读取单个文件的内容。每个文件都会启动一个harvester，harvester负责打开和关闭文件。filebeat中还有一个Registrar组件用于记录文件的偏移量，即上一次读取的位置，下一次打开文件时会从Registrar读取偏移量然后继续读取数据
- input：负责管理harvester并且找到所有符合读取条件的文件。如果输入类型为log，则input会在驱动器上找到与定义的路径符合的文件，并会给每个文件都启动一个harvester.

其次再配置Output组件将获取的数据进行输出。

filebeat中支持多种服务的数据采集，包括但不仅限于Mysql,MongoDB,Nginx,Redis,ActiveMQ,PostgreSQL,RabbitMQ,Tomcat等等。更多可查看[官方文档](https://www.elastic.co/guide/en/beats/filebeat/7.13/filebeat-modules.html)

搭配上kibana提供的开箱即用的数据看板，可以快速搭建监控平台。

## 4. 安装filebeat

**1、** 解压压缩包（这里以mac版本示例，实际操作时请根据需要下载对应系统及版本的filebeat）；

```sh
tar -zxvf filebeat-7.13.0-darwin-x86_64.tar.gz
```

**2、** 修改filebeat.yml配置文件；

```sh
vim filebeat.yml
```

修改内容

```sh
setup.template.settings:
  index.number_of_shards: 1
  因为es是单节点，所以将副本分片设置为0.否则会报黄
  index.number_of_replicas: 0
output.elasticsearch:
  hosts: ["192.168.244.11:9200"]
  username: "elastic"
  password: "elastic"
setup.kibana:
  host: "192.168.244.11:5601"
```

**3、** 启用postgresql模块；

```sh
./filebeat modules enable postgresql
```

**4、** 修改postgresqlmodule配置文件；

```sh
vim modules.d/postgresql.yml
```

修改内容，这里直接采用了默认配置

```sh
- module: postgresql
  All logs
  log:
    enabled: true
    因为postgresql慢日志记录开启的是csvlog模式，postgresql的日志会被存储到.csv文件下
    var.paths: ["/opt/homebrew/var/postgres/log/*.csv"]
```

日志位置可以通过如下指令查询，但请先确保慢日志已经开启，如不知道怎么开启的参考文章最后说明

（1）查询配置文件位置

```sh
show config_file;
```

（2）查询配置文件中日志目录,以及日志文件命名格式

```sh
 cat /opt/homebrew/var/postgres/postgresql.conf
```

（3）日志文件夹一般在config文件的同文件夹下，则路径为：

```sh
## 因为postgresql慢日志记录开启的是csvlog模式，postgresql的日志会被存储到.csv文件下，所以日志文件为*.csv
/opt/homebrew/var/postgres/log/*.csv
```

**5、** 加载kibana仪表盘，如果之前执行过该指令的就无需再执行了；

```sh
./filebeat setup
```

**6、** 运行filebeat，注意这里不要把上述的指令中断后再执行，直接新开窗口执行，否则可能生成面板失败；

```sh
./filebeat -e
```

**7、** 在kibana的dev-tool中查询filebeat-7.13.0索引，如果有索引且有postgresql数据则说明配置成功；

```sh
GET filebeat-7.13.0/_search
```

**8、** 点击dashboard进入仪表盘页面，搜索postgresql，点击`OverviewECS`点击进入postgresql日志监控面板；

如下图所示，我们的日志数据就呈现出来了

如果面板中没有数据显示，但`filebeat-7.13.0`索引又能查询出数据，检查一下面板右上角查询的时间范围是否在日志的范围内，检查下postgresql服务器的日期是否正常

### 测试

**1、** 在postgresql中执行以下指令，因为阈值设置的是3秒，所以设置睡眠4s会被判定为慢查询；

```sh
select pg_sleep(4);
```

**2、** 查看面板，可以看到慢日志已经更新上来了；

到此，我们的postgresql日志监控平台就搭建完成了，大家不妨动手操作试试吧

## 5. postgresql开启慢日志

如果postgresql没有开启慢日志的，要先开启：

**1、** 开启慢查询日志，修改配置文件postgresql.cnf；

查询配置文件位置

```sh
## 登陆postgresql
psql postgres  
## 查询配置文件路径
show config_file;
```

修改文件

```sh
vim /opt/homebrew/var/postgres/postgresql.conf
```

添加内容

```sh
## 开启日志基础设置
log_destination = 'syslog'
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 10MB
log_min_messages = info
## 记录执行慢的SQL 
## 慢查询定义，单位毫秒
log_min_duration_statement = 3000
log_checkpoints = on
log_connections = on
log_disconnections = on
log_duration = on
log_line_prefix = '%m'
## 监控数据库中长时间的锁
log_lock_waits = on
## 记录DDL操作
log_statement = 'ddl'
```

**3、** 重启postgresql；

```sh
## 我这里是mac homebrew安装的，所以使用bomebrew指令重启
 brew services restart postgresql
```
