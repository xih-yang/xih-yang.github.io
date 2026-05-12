# 14、Kafka 实战 - Kafka-Eagle监控
- 来源：https://ddkk.com/zhuanlan/mq/kafka/4/14.html
- 分类：消息队列
- 分组：教程目录
Kafka-Eagle 框架可以监控Kafka 集群的整体运行情况，在生产环境中经常使用。

## 1 MySQL环境准备

https://blog.csdn.net/qq_18625571/article/details/130613704?spm=1001.2014.3001.5501

## 2 Kafka环境准备

**1、** 关闭Kafka集群。

```java
kf.sh stop
```

**2、** 修改/opt/module/kafka/bin/kafka-start.sh命令中

```java
vim bin/kafka-start.sh
#修改处如下：
if [ "x$KAFKA_HEAP_OPTS" = "x"]; then
    export KAFKA_HEAP_OPTS="-Xmx1G -Xms1G"
fi
#修改为：
if [ "x$KAFKA_HEAP_OPTS" = "x"]; then
    export KAFKA_HEAP_OPTS="-server -Xms2G -Xmx2G -XX:PermSize=128m -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -XX:ParallelGCThreads=8 -XX:ConcGCThreads=5 -XX:InitiatingHeapOccupancyPercent=70" 
    export JMX_PORT="9999"
#    export KAFKA_HEAP_OPTS="-Xmx1G -Xms1G"
fi
#分发：
xsync kafka-server-start.sh
```

## 3 安装Kafka-Eagle

**1、** 官网：[https://www.kafka-eagle.org/](https://www.kafka-eagle.org/)

**2、** 上传压缩包 kafka-eagle-bin-2.0.8.tar.gz 到集群/opt/software 目录。

**3、** 解压到本地。

```java
tar -zxvf kafka-eagle-bin-2.0.8.tar.gz
```

**4、** 进入刚才解压的目录，将 efak-web-2.0.8-bin.tar.gz 解压至/opt/module。

```java
tar -zxvf efak-web-2.0.8-bin.tar.gz -C /opt/module/
```

**5、** 修改名称。

```java
mv efak-web-2.0.8/ efak
```

**6、** 修改配置文件/opt/module/efak/conf/system-config.ptoperties如下

```java
######################################
# multi zookeeper & kafka cluster list
# Settings prefixed with 'kafka.eagle.' will be deprecated, use 'efak.' instead
######################################
efak.zk.cluster.alias=cluster1,cluster2
cluster1.zk.list=hadoop102:2181,hadoop103:2181,hadoop104:2181/kafka
######################################
# zookeeper enable acl
######################################
cluster1.zk.acl.enable=false
cluster1.zk.acl.schema=digest
cluster1.zk.acl.username=test
cluster1.zk.acl.password=test123
######################################
# broker size online list
######################################
cluster1.efak.broker.size=20
######################################
# zk client thread limit
######################################
kafka.zk.limit.size=32
######################################
# EFAK webui port
######################################
efak.webui.port=8048
######################################
# kafka jmx acl and ssl authenticate
######################################
cluster1.efak.jmx.acl=false
cluster1.efak.jmx.user=keadmin
cluster1.efak.jmx.password=keadmin123
cluster1.efak.jmx.ssl=false
cluster1.efak.jmx.truststore.location=/data/ssl/certificates/kafka.truststore
cluster1.efak.jmx.truststore.password=ke123456
######################################
# kafka offset storage
######################################
cluster1.efak.offset.storage=kafka
######################################
# kafka jmx uri
######################################
cluster1.efak.jmx.uri=service:jmx:rmi:///jndi/rmi://%s/jmxrmi
######################################
# kafka metrics, 15 days by default
######################################
efak.metrics.charts=true
efak.metrics.retain=15
######################################
# kafka sql topic records max
######################################
efak.sql.topic.records.max=5000
efak.sql.topic.preview.records.max=10
######################################
# delete kafka topic token
######################################
efak.topic.token=keadmin
######################################
# kafka sasl authenticate
######################################
cluster1.efak.sasl.enable=false
cluster1.efak.sasl.protocol=SASL_PLAINTEXT
cluster1.efak.sasl.mechanism=SCRAM-SHA-256
cluster1.efak.sasl.jaas.config=org.apache.kafka.common.security.scram.ScramLoginModule required username="kafka" password="kafka-eagle";
cluster1.efak.sasl.client.id=
cluster1.efak.blacklist.topics=
cluster1.efak.sasl.cgroup.enable=false
cluster1.efak.sasl.cgroup.topics=
cluster2.efak.sasl.enable=false
cluster2.efak.sasl.protocol=SASL_PLAINTEXT
cluster2.efak.sasl.mechanism=PLAIN
cluster2.efak.sasl.jaas.config=org.apache.kafka.common.security.plain.PlainLoginModule required username="kafka" password="kafka-eagle";
cluster2.efak.sasl.client.id=
cluster2.efak.blacklist.topics=
cluster2.efak.sasl.cgroup.enable=false
cluster2.efak.sasl.cgroup.topics=
######################################
# kafka ssl authenticate
######################################
cluster3.efak.ssl.enable=false
cluster3.efak.ssl.protocol=SSL
cluster3.efak.ssl.truststore.location=
cluster3.efak.ssl.truststore.password=
cluster3.efak.ssl.keystore.location=
cluster3.efak.ssl.keystore.password=
cluster3.efak.ssl.key.password=
cluster3.efak.ssl.endpoint.identification.algorithm=https
cluster3.efak.blacklist.topics=
cluster3.efak.ssl.cgroup.enable=false
cluster3.efak.ssl.cgroup.topics=
######################################
# kafka sqlite jdbc driver address
######################################
efak.driver=com.mysql.jdbc.Driver
efak.url=jdbc:mysql://hadoop102:3306/ke?useUnicode=true&characterEncoding=UTF-8&zeroDateTimeBehavior=convertToNull
efak.username=root
efak.password=123456
######################################
# kafka mysql jdbc driver address
######################################
#efak.driver=com.mysql.cj.jdbc.Driver
#efak.url=jdbc:mysql://127.0.0.1:3306/ke?useUnicode=true&characterEncoding=UTF-8&zeroDateTimeBehavior=convertToNull
#efak.username=root
#efak.password=123456
```

**7、** 添加环境变量。

```java
sudo vim /etc/profile.d/my_env.sh
#添加如下：
# kafkaEFAK
export KE_HOME=/opt/module/efak
export PATH=$PATH:$KE_HOME/bin
生效环境变量：
source /etc/profile
```

**8、** 启动zookeeper和Kafka。

```java
zk.sh start
kf.sh start
```

**9、** 启动efak。

```java
bin/ke.sh start
```

## 4 Kafka-Eagle页面操作

[http://192.168.30.102:8048/](http://192.168.30.102:8048/)
