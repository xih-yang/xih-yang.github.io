# 27、Kafka 实战 - Kafka-eagle监控平台
- 来源：https://ddkk.com/zhuanlan/mq/kafka/3/27.html
- 分类：消息队列
- 分组：教程目录
## Kafka-eagle监控平台

### 搭建

- 去kafka-eagle官⽹下载压缩包

http://download.kafka-eagle.org/
- 分配⼀台虚拟机
- 虚拟机中安装jdk
- 解压缩kafka-eagle的压缩包
- 给kafka-eagle配置环境变量

```java
export KE_HOME=/usr/local/kafka-eagle
export PATH=$PATH:$KE_HOME/bin
```

- 需要修改kafka-eagle内部的配置⽂件： vim system-config.properties

修改⾥⾯的zk的地址和mysql的地址
- 进⼊到bin中，通过命令来启动

```java
./ke.sh start
```

### 平台的使⽤

Consumer-》MyGroup1-》Running
