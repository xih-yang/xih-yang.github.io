# 30、Kafka 实战 - Docker-compose部署Kafka集群
- 来源：https://ddkk.com/zhuanlan/mq/kafka/3/30.html
- 分类：消息队列
- 分组：教程目录
## Docker-compose部署Kafka集群

### 删除Docker

```java
#停止所有容器
docker stop $(docker ps -a -q)
#删除所有容器
docker rm $(docker ps -aq)
#删除所有镜像
docker rmi -f $(docker images -qa)
#删除旧Docker
sudo yum remove docker \
docker-client \
docker-client-latest \
docker-common \
docker-latest \
docker-latest-logrotate \
docker-logrotate \
docker-engine
```

### 安装Docker

```java
#安装Docker
yum install docker -y
#启动Docker
service docker start
#停止Docker
service docker stop
#重启Docker
service docker restart
#配置Docker镜像加速器
sudo tee /etc/docker/daemon.json <<-'EOF'
{
    "registry-mirrors": ["https://mirror.ccs.tencentyun.com"]
}
EOF
#查看Docker运行状态
systemctl status docker
```

### 安装Docker-Compose

```java
#安装docker-compose
curl -L https://get.daocloud.io/docker/compose/releases/download/1.29.2/docker-compose-uname \
-s-uname -m >` \
/usr/local/bin/docker-compose 
chmod +x /usr/local/bin/docker-compose
docker-compose --version 
```

### 上传Docker-Compose文件

docker-compose.yml

```java
version: '3.1'
services:
  zookeeper:
    image: wurstmeister/zookeeper
    container_name: zookeeper
    ports:
      - 2181:2181
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
      KAFKA_JMX_PORT: 39999
    restart: always
  kafka1:
    image: wurstmeister/kafka
    container_name: kafka1
    depends_on:
      - zookeeper
    ports:
      - 9092:9092
    environment:
      KAFKA_BROKER_ID: 0
      KAFKA_NUM_PARTITIONS: 2
      KAFKA_ZOOKEEPER_CONNECT: 81.68.232.188:2181 这里不能写zookeeper，要写ip
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://81.68.232.188:9092 这里不能写zookeeper，要写ip
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 3
      KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: 0
      KAFKA_JMX_PORT: 49999
    volumes:
      - /data/docker-compose/kafka/broker1/logs:/opt/kafka/logs
      - /var/run/docker.sock:/var/run/docker.sock
    restart: always
  kafka2:
    image: wurstmeister/kafka
    container_name: kafka2
    depends_on:
      - zookeeper
    ports:
      - 9093:9093
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_NUM_PARTITIONS: 2
      KAFKA_ZOOKEEPER_CONNECT: 81.68.232.188:2181 这里不能写zookeeper，要写ip
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://81.68.232.188:9093 这里不能写zookeeper，要写ip
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9093
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 3
      KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: 0
      KAFKA_JMX_PORT: 49999
    volumes:
      - /data/docker-compose/kafka/broker2/logs:/opt/kafka/logs
      - /var/run/docker.sock:/var/run/docker.sock
    restart: always
  kafka3:
    image: wurstmeister/kafka
    container_name: kafka3
    depends_on:
      - zookeeper
    ports:
      - 9094:9094
    environment:
      KAFKA_BROKER_ID: 2
      KAFKA_NUM_PARTITIONS: 2
      KAFKA_ZOOKEEPER_CONNECT: 81.68.232.188:2181 这里不能写zookeeper，要写ip
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://81.68.232.188:9094 这里不能写zookeeper，要写ip
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9094
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 3
      KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: 0
      KAFKA_JMX_PORT: 49999
    volumes:
      - /data/docker-compose/kafka/broker3/logs:/opt/kafka/logs
      - /var/run/docker.sock:/var/run/docker.sock
    restart: always
```

### 启动集群

```java
cd /root
docker-compose up -d
docker ps
```

### 测试

- 创建主题

```java
docker exec -it kafka1 bash
cd /opt/kafka/bin/
./kafka-topics.sh \
--create \
--zookeeper 81.68.232.188:2181 \
--replication-factor 3 \
--partitions 2 \
--topic test
```

- 查看主题

```java
#查看主题详情
./kafka-topics.sh  \
--zookeeper 81.68.232.188:2181 \
--describe \
--topic test
```

- 删除主题

```java
./kafka-topics.sh  \
--delete \
--zookeeper 81.68.232.188:2181 \
--topic test
```

### SpringBoot

可以连接SpringBoot做测试

- YML

```java
server:
  port: 80
spring:
  kafka:
    bootstrap-servers: 81.68.232.188:9092,81.68.232.188:9093,81.68.232.188:9094
    producer:
      retries: 3
      batch-size: 16384
      buffer-memory: 33554432
      acks: 1
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.apache.kafka.common.serialization.StringSerializer
    consumer:
      group-id: default-group
      enable-auto-commit: false
      auto-offset-reset: earliest
      key-deserializer:
        org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer:
        org.apache.kafka.common.serialization.StringDeserializer
      max-poll-records: 500
    listener:
      ack-mode: MANUAL_IMMEDIATE
#  redis:
#    host: 172.16.253.21
```

- POM

```java
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>2.7.8</version>
    <relativePath/> <!-- lookup parent from repository -->
</parent>
....
<dependency>
    <groupId>org.springframework.kafka</groupId>
    <artifactId>spring-kafka</artifactId>
</dependency>
```

- 生产者

```java
@RestController
@RequestMapping("/msg")
public class MyKafkaController {
    private final static String TOPIC_NAME = "test";
    @Resource
    private KafkaTemplate<String,String> kafkaTemplate;
    @RequestMapping("/send")
    public String sendMessage(){
        kafkaTemplate.send(TOPIC_NAME,0,"key","this is a message!");
        return "send success!";
    }
}
```

- 消费者

```java
@Component
public class MyConsumer {
    @KafkaListener(topics = "test",groupId = "default-group")
    public void listenGroup(ConsumerRecord<String, String> record, Acknowledgment ack) {
        String value = record.value();
        System.out.println(value);
        System.out.println(record);
        //⼿动提交offset
        ack.acknowledge();
    }
//    @KafkaListener(groupId = "default-group",  topicPartitions = {
//            //@TopicPartition(topic = "test", partitions = {
      "0", "1" }),
//            @TopicPartition(topic = "test", partitions = "0",
//                    partitionOffsets = @PartitionOffset(partition = "1", initialOffset = "100"))
//    }, concurrency = "3") //concurrency就是同组下的消费者个数，就是并发消费数，建议⼩于等于分区总数
//    public void listenGroup(ConsumerRecord < String, String > record,
//                            Acknowledgment ack) {
//        String value = record.value();
//        System.out.println(value);
//        System.out.println(record);
//        //⼿动提交offset
//        ack.acknowledge();
//    }
}
```

- 测试
