# 13、ELK搭建（十三）：搭建Nginx资源访问率、丢包率、读写率等运行性能监控平台
- 来源：https://ddkk.com/zhuanlan/monitoring/kibana/13.html
- 分类：监控工具
- 分组：教程目录
## 0. 引言

Nginx是一款轻量级、高性能的流量分发和反向代理的web服务。随着市场业务量的增加，普通的web容器，如tomcat的并发量已经远不能满足我们的业务量，同时随着分布式架构的普及，我们需要一款反向代理服务的支持，于是Nginx应运而生。

Nginx已经在大多数业务中普遍使用，因此针对Nginx的性能监控十分必要，这样我们才能实时掌握服务器请求情况和运行效率

所以今天，我们的目标就是搭建一个Nginx运行性能监控平台

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

所谓module就是针对不同的服务进行采集的模块，metricbeat中支持的module有几十种，包括但不仅限于：ActiveMQ module,Apache module,Docker module,HTTP module等，具体可以metricbeat[官方文档中的modules部分](https://www.elastic.co/guide/en/beats/metricbeat/7.13/metricbeat-module-nginx.html)查看

2、metricset

采集的内容，以nginx module为例，支持1种指标集`stubstatus`，包含了连接数、请求率、丢包率、读/写/等待率等信息

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

**4、** 启动nginx模块，metricbeat会根据modules.d/nginx.yml中的配置项来获取系统数据；

```sh
./metricbeat modules enable nginx
```

**5、** 配置要采集的内容，修改modules.d/nginx.yml配置文件；

```sh
vim modules.d/nginx.yml
```

配置文件内容，具体可根据自己的需要进行配置

```sh
- module: nginx
  metricsets:
    - stubstatus
  period: 10s
  Nginx hosts
  hosts: ["http://127.0.0.1"]
  Path to server status. Default server-status
  server_status_path: "server-status"
 username: "user"
 password: "secret"
```

**6、** 如上开启的指标集是通过nginx中的ngx_http_stub_status模块来获取数据的，因此我们需要开启nginx中的ngx_http_stub_status；

（1）修改nginx配置文件

```sh
vim /opt/homebrew/etc/nginx/nginx.conf
```

（2）修改内容，注意这里的location路径与上述`modules.d/nginx.yml`文件中书写的`server_status_path`保持一致；上述配置文件中的端口要与`server.listen`的端口保持一致

```sh
 server {
        listen       80;
        server_name  localhost;
         location /server-status {
          stub_status;
        }
    }
```

（3）重启nginx

```sh
nginx -s reload
```

**7、** 加载kibana仪表盘，如果之前已经设置过就不用再执行了；

```sh
./metricbeat setup
```

**8、** 启动metricbeat（如果上述的指令没有自动退出的话，就新开个窗口执行，不要退出上述指令窗口）；

```sh
./metricbeat -e
```

**9、** 在kibana的`discover`窗口中查询`metricbeat-*`索引模式，能够查询到nginx相关字段数据表明配置成功；

**10、** kibana中点击Dashboard，进入仪表盘，输入`nginx`，选择`OverviewECS`看板点击进入；

**11、** 右上角的数据默认是过去15分钟，如果查询没有数据的话，调整下时间范围；

至此，我们就可以实时看到Nginx的相关运行指标了，包括读写等待频率、资源访问频率等。配置很简单，大家不妨动手试试看
