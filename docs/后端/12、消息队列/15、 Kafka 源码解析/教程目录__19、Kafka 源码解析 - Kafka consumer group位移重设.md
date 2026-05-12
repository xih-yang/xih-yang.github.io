# 19、Kafka 源码解析 - Kafka consumer group位移重设
- 来源：https://ddkk.com/zhuanlan/mq/kafka/8/19.html
- 分类：消息队列
- 分组：教程目录
本文阐述如何使用Kafka自带的kafka-consumer-groups.sh脚本随意设置消费者组(consumer group)的位移。需要特别强调的是， 这是0.11.0.0版本提供的新功能且只适用于新版本consumer。

在新版本之前，如果要为已有的consumer group调整位移必须要手动编写Java程序调用KafkaConsumer#seek方法，费时费力不说还容易出错。0.11.0.0版本丰富了kafka-consumer-groups脚本的功能，用户可以直接使用该脚本很方便地为已有的consumer group重新设置位移，但**前提是：consumer group状态必须是inactive的，即不能是处于正在工作中的状态。**

先务虚一下。总体来说，重设位移的流程由3步组成，如下图所示：

- 确定topic作用域——当前有3种作用域指定方式：--all-topics（为consumer group下所有topic的所有分区调整位移），--topic t1 --topic t2（为指定的若干个topic的所有分区调整位移），--topic t1:0,1,2（为指定的topic分区调整位移）
- 确定位移重设策略——当前支持8种设置规则：
- --to-earliest：把位移调整到分区当前最小位移
- --to-latest：把位移调整到分区当前最新位移
- --to-current：把位移调整到分区当前位移
- --to-offset ： 把位移调整到指定位移处
- --shift-by N： 把位移调整到当前位移 + N处，注意N可以是负数，表示向前移动
- --to-datetime ：把位移调整到大于给定时间的最早位移处，datetime格式是yyyy-MM-ddTHH:mm:ss.xxx，比如2017-08-04T00:00:00.000
- --by-duration ：把位移调整到距离当前时间指定间隔的位移处，duration格式是PnDTnHnMnS，比如PT0H5M0S
- --from-file ：从CSV文件中读取调整策略
- 确定执行方案——当前支持3种方案：
- 什么参数都不加：只是打印出位移调整方案，不具体执行

--execute：执行真正的位移调整

--export：把位移调整方案按照CSV格式打印，方便用户成csv文件，供后续直接使用

针对上面的8种策略，本文重点演示前面7种策略。

首先，我们创建一个测试topic，5个分区，并发送5,000,000条测试消息：

```java
> bin/kafka-topics.sh --zookeeper localhost:2181 --create --partitions 5 --replication-factor 1 --topic test
Created topic "test".
> bin/kafka-producer-perf-test.sh --topic test --num-records 5000000 --throughput -1 --record-size 100 --producer-props bootstrap.servers=localhost:9092 acks=-1
1439666 records sent, 287760.5 records/sec (27.44 MB/sec), 75.7 ms avg latency, 317.0 max latency.
1541123 records sent, 308163.0 records/sec (29.39 MB/sec), 136.4 ms avg latency, 480.0 max latency.
1878025 records sent, 375529.9 records/sec (35.81 MB/sec), 58.2 ms avg latency, 600.0 max latency.
5000000 records sent, 319529.652352 records/sec (30.47 MB/sec), 86.33 ms avg latency, 600.00 ms max latency, 38 ms 50th, 319 ms 95th, 516 ms 99th, 591 ms 99.9th.
```

然后，启动一个console consumer程序，组名设置为test-group：

```java
bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test --from-beginning --consumer-property group.id=test-group
..............
```

待运行一段时间后关闭consumer程序将group设置为inactive。现在运行kafka-consumer-groups.sh脚本首先确定当前group的消费进度：

```java
bogon:kafka_0.11 huxi$ bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --group test-group --describe
Note: This will only show information about consumers that use the Java consumer API (non-ZooKeeper-based consumers).
TOPIC PARTITION CURRENT-OFFSET LOG-END-OFFSET LAG CONSUMER-ID HOST CLIENT-ID
test 0 1000000 1000000 0 consumer-1-8688633a-2f88-4c41-89ca-fd0cd6d19ec7 /127.0.0.1 consumer-1
test 1 1000000 1000000 0 consumer-1-8688633a-2f88-4c41-89ca-fd0cd6d19ec7 /127.0.0.1 consumer-1
test 2 1000000 1000000 0 consumer-1-8688633a-2f88-4c41-89ca-fd0cd6d19ec7 /127.0.0.1 consumer-1
test 3 1000000 1000000 0 consumer-1-8688633a-2f88-4c41-89ca-fd0cd6d19ec7 /127.0.0.1 consumer-1
test 4 1000000 1000000 0 consumer-1-8688633a-2f88-4c41-89ca-fd0cd6d19ec7 /127.0.0.1 consumer-1
```

由上面输出可知，当前5个分区LAG列的值都是0，表示全部消费完毕。现在我们演示下如何重设位移。

**1、** --to-earliest；

```java
bogon:kafka_0.11 huxi$ bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --group test-group --reset-offsets --all-topics --to-earliest --execute
Note: This will only show information about consumers that use the Java consumer API (non-ZooKeeper-based consumers).
TOPIC PARTITION NEW-OFFSET 
test 0 0 
test 1 0 
test 4 0 
test 3 0 
test 2 0
```

上面输出表明，所有分区的位移都已经被重设为0

**2、** --to-latest；

```java
bogon:kafka_0.11 huxi$ bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --group test-group --reset-offsets --all-topics --to-latest --execute
Note: This will only show information about consumers that use the Java consumer API (non-ZooKeeper-based consumers).
TOPIC PARTITION NEW-OFFSET 
test 0 1000000 
test 1 1000000 
test 4 1000000 
test 3 1000000 
test 2 1000000
```

上面输出表明，所有分区的位移都已经被重设为最新位移，即1,000,000

**3、** --to-offset；

```java
bogon:kafka_0.11 huxi$ bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --group test-group --reset-offsets --all-topics --to-offset 500000 --execute
Note: This will only show information about consumers that use the Java consumer API (non-ZooKeeper-based consumers).
TOPIC PARTITION NEW-OFFSET 
test 0 500000 
test 1 500000 
test 4 500000 
test 3 500000 
test 2 500000
```

上面输出表明，所有分区的位移都已经调整为给定的500000

**4、** --to-current；

```java
bogon:kafka_0.11 huxi$ bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --group test-group --reset-offsets --all-topics --to-current --execute
Note: This will only show information about consumers that use the Java consumer API (non-ZooKeeper-based consumers).
TOPIC PARTITION NEW-OFFSET 
test 0 500000 
test 1 500000 
test 4 500000 
test 3 500000 
test 2 500000
```

输出表明所有分区的位移都已经被移动到当前位移（这个有点傻，因为位移距上一步没有变动）

**5、** --shift-byN；

```java
bogon:kafka_0.11 huxi$ bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --group test-group --reset-offsets --all-topics --shift-by -100000 --execute
Note: This will only show information about consumers that use the Java consumer API (non-ZooKeeper-based consumers).
TOPIC PARTITION NEW-OFFSET 
test 0 400000 
test 1 400000 
test 4 400000 
test 3 400000 
test 2 400000
```

输出表明所有分区的位移被移动到(500000 - 100000) = 400000处

**6、** --to-datetime；

```java
bogon:kafka_0.11 huxi$ bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --group test-group --reset-offsets --all-topics --to-datetime 2017-08-04T14:30:00.000
Note: This will only show information about consumers that use the Java consumer API (non-ZooKeeper-based consumers).
TOPIC PARTITION NEW-OFFSET 
test 0 1000000 
test 1 1000000 
test 4 1000000 
test 3 1000000 
test 2 1000000
```

将所有分区的位移调整为2017年8月4日14：30之后的最早位移

**7、** --by-duration；

```java
bogon:kafka_0.11 huxi$ bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --group test-group --reset-offsets --all-topics --by-duration PT0H30M0S
Note: This will only show information about consumers that use the Java consumer API (non-ZooKeeper-based consumers).
TOPIC PARTITION NEW-OFFSET 
test 0 0 
test 1 0 
test 4 0 
test 3 0 
test 2 0
```

将所有分区位移调整为30分钟之前的最早位移。
