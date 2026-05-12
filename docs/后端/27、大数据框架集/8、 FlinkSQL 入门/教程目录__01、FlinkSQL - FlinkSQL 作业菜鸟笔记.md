# 01、FlinkSQL - FlinkSQL 作业菜鸟笔记
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/3/1.html
- 分类：大数据框架
- 分组：教程目录
因为最近的需求是做FlinkSQL平台，需要在实时计算平台上集成FlinkSQL功能，但目前刚刚有了研究成果，所以有了这篇笔记。

## 第一步：编写一个流

这里使用python编写的一个流，比Java简洁。

需要注意的是 pip install kakfa-python，不能是 pip install kafka。

这里生产的集群是SCRAM加密的，所以配置会多一些。

有一个单词本，words.txt就是一些英文单词，一行一个。

这个Producer每5秒产生一个记录，以JSON形式发布到流。

```java
from kafka import KafkaProducer
import json
import random
import time
import sys
if __name__ == '__main__':
    producer = KafkaProducer(
        bootstrap_servers="kafka1211.slannka.com:9194",
        key_serializer=lambda v: str.encode if v is not None else None,
        value_serializer=lambda v: v.encode('utf-8') if v is not None else None,
        security_protocol="SASL_PLAINTEXT",
        sasl_mechanism="SCRAM-SHA-256",
        sasl_plain_username="slankkaCopyrightReserved",
        sasl_plain_password="passwordOfUsername",
        api_version=(2, 2, 1)
    )
    count = 0
    thefile = open("data/words.txt", "rb")
    while True:
        buffer = thefile.read(1024 * 8192)
        if not buffer:
            break
        count += buffer.count('\n'.encode())
    thefile.close()
    textfile = open("data/words.txt", "r")
    lines = textfile.readlines()  读取全部内容 ，并以列表方式返回
    while True:
        initial values in each loop
        offset = 0
        word = None
        get a random value represents a word
        randint = random.randint(0, count)
        print("total: ", count, ", randInt: ", randint)
        for line in lines:
            if offset == randint:
                word = line.strip()
                break
            offset += 1
        val = {
            "word": word,
            "len": len(word)
        }
        value = json.dumps(val)
        print("sending:", value)
        producer.send("test_enc_putong", value)
        print("send finished..(wait 5s.)")
        time.sleep(5.0)
    producer.close(3000)
    textfile.close()
```

## 第二步：编写FLINKSQL

```java
create table WordCountTab (
    word STRING,
    len INT,
  ts TIMESTAMP(3) METADATA FROM 'timestamp'这一行不支持则可以去掉
) with (
    'connector' = 'kafka',
    'topic' = 'test_slankka',
    'properties.bootstrap.servers' = 'xxxxx.xxxxx.xxxxxx.com:9194',
    'properties.group.id' = 'test_flinksql_consumer',
    'format' = 'json',
    'scan.startup.mode' = 'earliest-offset',
    'properties.sasl.jaas.config'= 'org.apache.kafka.common.security.scram.ScramLoginModule required username="slankkaCopyrightReserved" password="passwordOfUsername";',
    'properties.sasl.mechanism' = 'SCRAM-SHA-256',
    'properties.security.protocol' = 'SASL_PLAINTEXT'
);
create table WordCountSink (
   word STRING,
   len INT
) WITH (
   'connector' = 'jdbc',
   'url' = 'jdbc:mysql://mysql1211.slankkaCorps.com:3306/rtc',
   'table-name' = 'flink_sink_test',
   'username' = 'root',
   'password' = 'root'
);
INSERT INTO WordCountSink
SELECT word, len FROM WordCountTab;
```

执行即可，生成一个Flink JOB，这个任务会不断得写到Mysql中。
