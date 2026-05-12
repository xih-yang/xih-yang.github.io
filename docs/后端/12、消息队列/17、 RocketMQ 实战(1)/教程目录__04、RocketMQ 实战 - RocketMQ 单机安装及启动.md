# 04、RocketMQ 实战 - RocketMQ 单机安装及启动
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/5/4.html
- 分类：消息队列
- 分组：教程目录
## 1 准备工作

### 软硬件需求

系统要求是64位的，JDK要求是1.8及其以上版本的。

### 下载RocketMQ安装包

将下载的安装包上传到Linux。

解压。

## 2、修改初始内存

### 修改runserver.sh

使用vim命令打开bin/runserver.sh文件。现将这些值修改为如下：

### 修改runbroker.sh

使用vim命令打开bin/runbroker.sh文件。现将这些值修改为如下：

## 3、启动

### 启动NameServer

> nohup sh bin/mqnamesrv &
>
> tail -f ~/logs/rocketmqlogs/namesrv.log

### 启动broker

> nohup sh bin/mqbroker -n localhost:9876 &
>
> tail -f ~/logs/rocketmqlogs/broker.log

## 4、发送/接收消息测试

### 发送消息

> export NAMESRV_ADDR=localhost:9876
>
> sh bin/tools.sh org.apache.rocketmq.example.quickstart.Producer

### 接收消息

> sh bin/tools.sh org.apache.rocketmq.example.1 quickstart.Consumer

## 5、关闭Server

无论是关闭name server还是broker，都是使用bin/mqshutdown命令。

> [root@mqOS rocketmq]# sh bin/mqshutdown broker
>
> The mqbroker(1740) is running…
>
> Send shutdown request to mqbroker(1740) OK
>
> [root@mqOS rocketmq]# sh bin/mqshutdown namesrv
>
> The mqnamesrv(1692) is running…
>
> Send shutdown request to mqnamesrv(1692) OK
>
> [2]+ 退出 143 nohup sh bin/mqbroker -n localhost:9876
