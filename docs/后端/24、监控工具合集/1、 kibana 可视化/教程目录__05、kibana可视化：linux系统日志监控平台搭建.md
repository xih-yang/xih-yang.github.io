# 05、kibana可视化：linux系统日志监控平台搭建
- 来源：https://ddkk.com/zhuanlan/monitoring/kibana/5.html
- 分类：监控工具
- 分组：教程目录
## 0. 引言

现在的生产系统多使用linux系统，在实际生产过程中我们除了需要监控一些业务日志之外，有时也需要监控linux系统本身的日志，来帮助我们进行一些排错和判断。那么这一期，我们就针对linux系统日志监控平台的搭建来进行讲解

与往期一样，我们针对实际搭建教程更多是快速搭建为主，不做过多的原理性讲解，这一类讲解我们放到后期单独开几期博客来探讨。

## 1. 下载

首先针对elasticsearch,kibana的下载安装不再累述，还不知道的同学可以看看之前的博客。

[ELK搭建（一）：实现分布式微服务日志监控](/zhuanlan/monitoring/kibana/1.html)

因为我的ELK环境是7.13.0的，所以我们需要下载对应版本的filebeat

[filebeat官方下载地址](https://www.elastic.co/cn/downloads/past-releases##filebeat)

## 2. filebeat下载

filebeat是elastic官方提供的一个轻量级的日志采集器，根据名称也能知道，主要用于文件的数据采集。基于Golang开发，可以安装到想要日志的服务器或者主机上来定期读取对应的数据，并发送到elasticsearch或者logstash上，甚至数据量大时，我们还可以先输出到kafka、redis等中间件上。

根据[官方文档](https://www.elastic.co/guide/en/beats/filebeat/8.2/how-filebeat-works.html)的解释，filebeat 主要包含两个主要组件：input和harvesters。

- harvester: harvester用于按行读取单个文件的内容。每个文件都会启动一个harvester，harvester负责打开和关闭文件。filebeat中还有一个Registrar组件用于记录文件的偏移量，即上一次读取的位置，下一次打开文件时会从Registrar读取偏移量然后继续读取数据
- input：负责管理harvester并且找到所有符合读取条件的文件。如果输入类型为log，则input会在驱动器上找到与定义的路径符合的文件，并会给每个文件都启动一个harvester.

其次再配置Output组件将获取的数据进行输出。

filebeat中支持多种服务的数据采集，包括但不仅限于Mysql,MongoDB,Nginx,Redis,ActiveMQ,PostgreSQL,RabbitMQ,Tomcat等等。更多可查看[官方文档](https://www.elastic.co/guide/en/beats/filebeat/7.13/filebeat-modules.html)

搭配上kibana提供的开箱即用的数据看板，可以快速搭建监控平台。

## 3. 安装

以下安装步骤也可以在kibana主页>添加数据>系统日志页面中看到

**1、** 解压压缩包（这里以mac版本示例，实际操作时请根据需要下载对应系统及版本的filebeat）；

```sh
tar -zxvf filebeat-7.13.0-darwin-x86_64.tar.gz
```

**2、** 修改filebeat.yml配置文件；

```sh
filebeat.config.modules:
  Glob pattern for configuration loading
  path: ${path.config}/modules.d/*.yml
 Set to true to enable config reloading
  reload.enabled: false
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

**3、** 启用system模块，如果已经启用过可以不用执行；

```sh
./filebeat modules enable system
```

**4、** 修改systemmodule的配置文件；

```sh
vim modules.d/system.yml
```

修改内容，这里采用了默认配置，采集系统日志和权限日志

```sh
- module: system
  Syslog
  syslog:
    enabled: true 
   日志路径，为空的话会根据操作系统自动设置
   var.paths:
  Authorization logs
  auth:
    enabled: true
   日志路径，为空的话会根据操作系统自动设置
   var.paths:
```

**5、** 加载kibana仪表盘，如果已经设置过了，就不用再设置；

```sh
./filebeat setup
```

**6、** 启动filebeat（新开窗口执行以下指令）；

```sh
./filebeat -e
```

**7、** 启动后，在kibana的系统日志页面中点击`检查数据`可以看看自己有没有创建成功出现以下提示说明成功；

**8、** 点击系统`Syslog仪表盘`跳转系统日志仪表盘页面；

输入查询日期范围，然后就可以看到我们的系统日志数据就可视化的呈现在kibana的数据看板中了

本期的系统日志监控平台搭建就到这里了，其实到现在为止，我们也讲了三期的利用kibana开箱即用的数据看板来搭建我们的监控平台。相信大家对此也有了一定的了解了。

其实大家可以将kibana提供这些开箱即用的数据看板利用起来，快捷的搭建自己想要的监控看板
