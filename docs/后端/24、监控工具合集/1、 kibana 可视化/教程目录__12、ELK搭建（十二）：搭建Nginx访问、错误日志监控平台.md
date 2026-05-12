# 12、ELK搭建（十二）：搭建Nginx访问、错误日志监控平台
- 来源：https://ddkk.com/zhuanlan/monitoring/kibana/12.html
- 分类：监控工具
- 分组：教程目录
## 0. 引言

Nginx是一款轻量级、高性能的流量分发和反向代理的web服务。随着市场业务量的增加，普通的web容器，如tomcat的并发量已经远不能满足我们的业务量，同时随着分布式架构的普及，我们需要一款反向代理服务的支持，于是Nginx应运而生。

Nginx已经在大多数业务中普遍使用，因此针对Nginx的流量监控，错误日志监控极其必要，这样才能让我们能够及时了解系统运行情况。

那么今天，我们就来看看如何搭建Nginx访问记录、错误日志监控平台

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

**3、** 启用nginx模块；

```sh
./filebeat modules enable nginx
```

**4、** 修改postgresqlmodule配置文件；

```sh
vim modules.d/nginx.yml
```

修改内容，这里开启了错误日志和访问日志

```sh
- module: nginx
  Access logs
  access:
    enabled: true
    var.paths: ['/opt/homebrew/Cellar/nginx/1.21.6/logs/access.log']
  Error logs
  error:
    enabled: true
    var.paths: ['/opt/homebrew/Cellar/nginx/1.21.6/logs/error.log']
```

**5、** 加载kibana仪表盘，如果之前执行过该指令的就无需再执行了；

```sh
./filebeat setup
```

**6、** 运行filebeat，注意这里不要把上述的指令中断后再执行，直接新开窗口执行，否则可能生成面板失败；

```sh
./filebeat -e
```

**7、** 在kibana的discover中查询filebeat-*索引模版，如果存在nginx相关字段，并且有数据输出表示配置正确需要注意查询时间范围；

**8、** 点击dashboard进入仪表盘页面，搜索nginx，点击`AccessanderrorlogsECS`点击进入nginx日志监控面板；

如下图所示，我们的日志数据就呈现出来了

点击`Nginx logs overview`可以切换到汇总面板

如果面板中没有数据显示，检查一下面板右上角查询的时间范围是否在日志的范围内、nginx服务器的日期是否正常
