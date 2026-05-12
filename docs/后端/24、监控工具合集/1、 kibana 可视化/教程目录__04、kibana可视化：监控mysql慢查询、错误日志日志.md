# 04、kibana可视化：监控mysql慢查询、错误日志日志
- 来源：https://ddkk.com/zhuanlan/monitoring/kibana/4.html
- 分类：监控工具
- 分组：教程目录
## 0. 引言

因为mysql免费、稳定以及还不错的性能，是当前市面上多数公司的数据库选择。在实际的生产环境中我们更需要及时知道数据库中的报错日志、慢日志等信息，来帮助我们进行排错和优化。

普通的到服务器上去查看日志的方式并不方便，特别是涉及到分布式部署时，因此我们需要一个统一的监控平台来实时、方便的查看这些日志数据。

那么我们今天就来一步步搭建这样的一个平台

## 2. 下载

首先关于ELK的搭建就不再累述了，不清楚的同学可以看看往期博客：

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

以下安装步骤也可以在kibana主页>添加数据>MySQL日志页面中看到

**1、** 解压压缩包（这里以mac版本示例，实际操作时请根据需要下载对应系统及版本的filebeat）；

```sh
tar -zxvf filebeat-7.13.0-darwin-x86_64.tar.gz
```

**2、** 修改filebeat.yml配置文件；

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

**3、** 启用mysql模块；

```sh
./filebeat modules enable mysql
```

**4、** 修改mysqlmodule配置文件；

```sh
vim modules.d/mysql.yml
```

修改内容，这里直接采用了默认配置，即采集错误日志和慢日志

```sh
- module: mysql
  Error logs
  error:
    enabled: true
    日志路径，如果不配置，filebeat将按照操作系统选择日志路径.
    var.paths: ["/opt/homebrew/var/mysql/MacBook-Pro.local.err*"]
  Slow logs
  slowlog:
    enabled: true
    日志路径，如果不配置，filebeat将按照操作系统选择日志路径.
    var.paths: ["/opt/homebrew/var/mysql/MacBook-Pro-slow.log*"]
```

如果不知道错误日志和慢日志位置的，可以通过以下两个指令查询

```sh
 show variables like 'log_error';
 show variables like '%slow_query_log%';
```

**5、** 加载kibana仪表盘；

```sh
./filebeat setup
```

**6、** 运行filebeat，注意这里不要把上述的指令中断后再执行，直接新开窗口执行，否则可能生成面板失败；

```sh
./filebeat -e
```

**7、** kibana主页>添加数据>MySQL日志中点击检查数据，如果出现成功提示则说明配置成功；

或者可以再dev-tool中查询filebeat-7.13.0索引，如果有索引且有数据则说明配置成功

```sh
GET filebeat-7.13.0/_search
```

**8、** 点击MySQL日志仪表盘生成仪表盘；

直接跳转到Filebeat MySQL数据看板。如果这里图形没有加载的话，检查一下filebeat-7.13.0索引是否有数据

#### 测试

**1、** 在mysql中执行以下指令，因为阈值设置的是3，所以设置睡眠5s会被判定为慢查询；

```sh
select sleep(5);
```

**2、** 查看面板，可以看到慢日志已经更新上来了；

到此，我们的mysql日志监控平台就搭建完成了，当然你也可以根据自己的需要来创建自定义图表。如果不知道怎么创建可以查看我往期的博客。

## 5. mysql开启慢日志

如果mysql没有开启慢日志的，要先开启：

**1、** 登陆mysql，查看mysql是否开启慢日志；

```sh
show variables like '%slow_query_log%';
```

如图所示是没有开启的

**2、** 开启慢查询日志，修改配置文件my.cnf；

```sh
sudo vim /etc/my.cnf
```

添加内容

```sh
[mysqld]
## 开启慢日志
slow_query_log=1
## 日志位置
slow_query_log_file=/opt/homebrew/var/mysql/MacBook-Pro-slow.log
## 设置阈值
long_query_time=3
## 输出形式
log_output=FILE
```

**3、** 重启mysql；

```sh
sudo mysql.server restart
```

**4、** 再次登陆查询，已经开启；
