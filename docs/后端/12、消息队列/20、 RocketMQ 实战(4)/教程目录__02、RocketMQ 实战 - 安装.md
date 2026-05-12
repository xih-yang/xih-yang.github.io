# 02、RocketMQ 实战 - 安装
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/8/2.html
- 分类：消息队列
- 分组：教程目录
## 安装

### 下载

> http://rocketmq.apache.org/dowloading/releases/

### 安装

- 把下载的安装包扔到自己的虚拟机上,解压

### 目录介绍

- bin:启动的脚本,包括shell脚本和CMD脚本
- conf:配制文件,包括broker配置文件
- lib:依赖的jar包,Netty,commons-lang,FastJson等

### 启动MQ

- 启动NameServer

> 启动NameServer
>
> nohup sh bin/mqnameserv &
>
> 查看启动日志
>
> tail -f ~/log/rocketmqlogs/namesrv.log

- 启动Broker

> 启动Broker
>
> nohup sh bin/mqbroker -n localhost:9876 &
>
> 查看启动日志
>
> tail -f ~/log/rocketmqlogs/broker.log

- 可能存在的问题:RocketMq默认的虚拟机内存较大,启动Broker如果因为内存不足失败,

编辑以下两个配置文件,修改jvm大小

> vi runbroker.sh
>
> vi runserver.sh

- 可以修改为

> JAVA_OPT="${JAVE_OPT} -server -Xms256m -Xmx256m -Xmn128m -XX:MetaspaceSize=128m -XX:MaxMetaspaceSize=320m"

### 测试

- 发送消息

> 设置环境变量
>
> export NAMESRV_ADDR=localhost:9876
>
> 使用安装包的Demo发送消息
>
> sh /bin/tools.sh org.apache.rocketmq.example.quickstart.Producer

- 接受消息

> 设置环境变量
>
> export NAMESRV_ADDR=localhost:9876
>
> 接受消息
>
> sh /bin/tools.sh org.apache.rocketmq.example.quickstart.Consumer

### 关闭

- 关闭NameServer

> sh /bin/mqshutdown namesrv

- 关闭Broker

> sh bin/mqshutdown broker
