# 09、RocketMQ 实战 - mqadmin命令
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/5/9.html
- 分类：消息队列
- 分组：教程目录
在mq解压目录的bin目录下有一个mqadmin命令，该命令是一个运维指令，用于对mq的主题，集群，

broker 等信息进行管理。

## 1 修改bin/tools.sh

在运行mqadmin命令之前，先要修改mq解压目录下bin/tools.sh配置的JDK的ext目录位置。本机的ext

目录在/usr/java/jdk1.8.0_161/jre/lib/ext 。

使用vim命令打开tools.sh文件，并在JAVA_OPT配置的-Djava.ext.dirs这一行的后面添加ext的路径。

```java
JAVA_OPT="${JAVA_OPT} -server -Xms1g -Xmx1g -Xmn256m -
XX:MetaspaceSize=128m -XX:MaxMetaspaceSize=128m"
JAVA_OPT="${JAVA_OPT} -
Djava.ext.dirs=${BASE_DIR}/lib:${JAVA_HOME}/jre/lib/ext:${JAVA_HOME}/lib/
ext:/usr/java/jdk1.8.0_161/jre/lib/ext"
JAVA_OPT="${JAVA_OPT} -cp ${CLASSPATH}"
```

## 2 运行mqadmin

直接运行该命令，可以看到其可以添加的commands。通过这些commands可以完成很多的功能。

> [root@mqOS rocketmq-all-4.8.0-bin-release]# ./bin/mqadmin
>
> The most commonly used mqadmin commands are:
>
> updateTopic Update or create topic
>
> deleteTopic Delete topic from broker and NameServer.
>
> updateSubGroup Update or create subscription group
>
> deleteSubGroup Delete subscription group from broker.
>
> updateBrokerConfig Update broker’s config
>
> updateTopicPerm Update topic perm
>
> topicRoute Examine topic route info
>
> topicStatus Examine topic Status info
>
> topicClusterList get cluster info for topic
>
> brokerStatus Fetch broker runtime status data
>
> queryMsgById Query Message by Id
>
> queryMsgByKey Query Message by Key
>
> queryMsgByUniqueKey Query Message by Unique key
>
> queryMsgByOffset Query Message by offset
>
> QueryMsgTraceById query a message trace
>
> printMsg Print Message Detail
>
> printMsgByQueue Print Message Detail
>
> sendMsgStatus send msg to broker.
>
> brokerConsumeStats Fetch broker consume stats data
>
> producerConnection Query producer’s socket connection and client
>
> version
>
> consumerConnection Query consumer’s socket connection, client
>
> version and subscription
>
> consumerProgress Query consumers’s progress, speed
>
> consumerStatus Query consumer’s internal data structure
>
> cloneGroupOffset clone offset from other group.
>
> clusterList List all of clusters
>
> topicList Fetch all topic list from name server
>
> updateKvConfig Create or update KV config.
>
> deleteKvConfig Delete KV config.
>
> wipeWritePerm Wipe write perm of broker in all name server
>
> resetOffsetByTime Reset consumer offset by timestamp(without
>
> client restart).
>
> updateOrderConf Create or update or delete order conf
>
> cleanExpiredCQ Clean expired ConsumeQueue on broker.
>
> cleanUnusedTopic Clean unused topic on broker.
>
> startMonitoring Start Monitoring
>
> statsAll Topic and Consumer tps stats
>
> allocateMQ Allocate MQ
>
> checkMsgSendRT check message send response time
>
> clusterRT List All clusters Message Send RT
>
> getNamesrvConfig Get configs of name server.
>
> updateNamesrvConfig Update configs of name server.
>
> getBrokerConfig Get broker config by cluster or special broker!
>
> queryCq Query cq command.
>
> sendMessage Send a message
>
> consumeMessage Consume message
>
> updateAclConfig Update acl config yaml file in broker
>
> deleteAccessConfig Delete Acl Config Account in broker
>
> clusterAclConfigVersion List all of acl config version information in
>
> cluster
>
> updateGlobalWhiteAddr Update global white address for acl Config File
>
> in broker
>
> getAccessConfigSubCommand List all of acl config information in
>
> cluster

## 3 该命令的官网详解

该命令在官网中有详细的用法解释。

https://github.com/apache/rocketmq/blob/master/docs/cn/operation.md
