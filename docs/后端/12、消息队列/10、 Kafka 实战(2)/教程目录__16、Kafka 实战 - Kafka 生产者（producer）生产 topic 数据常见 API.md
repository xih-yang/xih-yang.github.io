# 16、Kafka 实战 - Kafka 生产者（producer）生产 topic 数据常见 API
- 来源：https://ddkk.com/zhuanlan/mq/kafka/2/16.html
- 分类：消息队列
- 分组：教程目录
### 一、将本地数据用java语言（API）导入到topic

**1、** 本次主要是把文本文件所有数据导入到topic中；

代码说明：将本地文件所有内容逐行地 通过API 打入kafka 的 topic 中

```java
import java.io.BufferedReader;
import java.io.FileReader;
import java.util.Properties;
import org.apache.kafka.clients.producer.Callback;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.Producer;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.clients.producer.RecordMetadata;
public class Producer3 {
    public static void main(String[] args) throws Exception {
        Properties props = new Properties();
        props.put("bootstrap.servers", "192.168.16.100:9092");
        props.put("ack","1");
        props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        Producer<String, String> producer = new KafkaProducer<String, String>(props);
        //获得文件路径
        String filePath1="D:\\AWork\\4_Spark\\Project\\GZKY\\src\\file\\WordsList.txt";
        //创建buffer
        BufferedReader br = new BufferedReader(new FileReader(filePath1));
        String line ;
        while((line = br.readLine()) != null) {
            //将文本每条数据转换成 ProducerRecord
            final ProducerRecord<String, String> record = new ProducerRecord<String, String>("gong_test", line+",ll");
            //将数据发个topic
            producer.send(record, new Callback() {
                public void onCompletion(RecordMetadata metadata, Exception e) {
                    // 如果发送消息成功，返回了 RecordMetadata
                    if(metadata != null) {
                        StringBuilder sb = new StringBuilder();
                        sb.append("message has been sent successfully! ")
                                .append("send to partition ").append(metadata.partition())
                                .append(", offset = ").append(metadata.offset());
                        System.out.println(sb.toString());
                        //System.out.println(record.toString());
                    }
                    // 如果消息发送失败，抛出异常
                    if(e != null) {
                        e.printStackTrace();
                    }
                }
            });
            //每隔500ms产生以此数据
            Thread.sleep(500);
        }
        producer.close();
    }
}
```

**2、** 本地文件通过API以Json格式打入kafka的topic中；

此时可以通过json的形式，选择性地拿取本地文件数据到topic

代码如下：

```java
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.Properties;
import org.json.JSONException;
import org.json.JSONObject;
import org.apache.kafka.clients.producer.Callback;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.Producer;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.clients.producer.RecordMetadata;
/*
此版本是java版本
将本地文件 通过API 以Json格式 打入kafka  的  topic 中
 */
public class Producer4 {
    public static void main(String[] args) throws IOException, JSONException, InterruptedException {
        Properties props = new Properties();
        props.put("bootstrap.servers", "192.168.16.100:9092");
        props.put("ack","1");
        props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        Producer<String, String> producer = new KafkaProducer<String, String>(props);
        //获得文件路径
        String filePath1="D:\\AWork\\4_Spark\\Project\\GZKY\\src\\file\\WordsList.txt";
        //
        BufferedReader bf=new BufferedReader(new FileReader(filePath1));
        String line;
        while ((line=bf.readLine())!=null){
            JSONObject jo=new JSONObject();
            String[] lines=line.split(",");
            jo.put("1",lines[0]);
            jo.put("2",lines[1]);
            jo.put("3",lines[2]);
            jo.put("4",lines[3]);
            ProducerRecord<String,String> record=new ProducerRecord<String,String> ("gong_test",jo.toString());
            producer.send(record, new Callback() {
                public void onCompletion(RecordMetadata recordMetadata, Exception e) {
                    if(recordMetadata!=null){
                        StringBuffer sb=new StringBuffer();
                        sb.append("success  ").append("partition:").append(recordMetadata.partition())
                                .append(" offset:").append(recordMetadata.offset());
                        System.out.println(sb.toString());
                    }
                    if(e!=null){
                        e.printStackTrace();
                    }
                }
            });
            Thread.sleep(500);
        }
        producer.close();
    }
}
```

### 二、Scala版本将本地文件以JSON格式打到Kafka中

```java
import java.util.Properties
import kafka.producer.{
     KeyedMessage, Producer, ProducerConfig}
import org.apache.spark.sql.SparkSession
import org.json.JSONObject
/*
此版本是spark版本
把本地文本数据数据导入到Kafka的topic中  此方法可以挑选文本中有用的字段->json格式
*/
object ProducerJson {
  def main(args: Array[String]): Unit = {
    //往topic中写数据
    val topic = "gong_test"
    //指定broker的ip和端口号
    val brokers="192.168.16.100:9092"
    //建配置文件
    val props=new Properties()
    props.put("metadata.broker.list",brokers)
    //指定Kafka的编译器 放入
    props.put("serializer.class","kafka.serializer.StringEncoder")
    //配置kafka的config
    //val kafkaconfig=new ProducerConfig(props)、
    val kafkaconfig=new ProducerConfig(props)
    val producer= new Producer[String,String](kafkaconfig)
    //配置SPark的congfig
    val ss = SparkSession.builder().appName("LocalToKafka").master("local[2]").getOrCreate()
    val sc =ss.sparkContext
    //定义path
    val filePath="D:\\AWork\\gzky\\WordsList.txt"
    val records=sc.textFile(filePath).map(_.split(",")).collect()
    //把数据预处理变成json
    for (record<-records){
      val event = new JSONObject() // import org.json.JSONObject
      event
        .put("camera_id", record(0))
        .put("car_id", record(1))
        .put("event_time", record(2))
        .put("speed", record(3))
        .put("road_id", record(4))
      // 生产event 消息
      producer.send(new KeyedMessage[String,String](topic,event.toString()))
      println(""+event)
      Thread.sleep(200)
    }
     sc.stop()
  }
}
```

### 三、直接在shell中使用kafka的producer

目的将本地文件一次性打入到topic中

```java
./kafka-console-producer.sh --broker-list 192.168.16.100:9092 --topic gonst </root/WordsList.txt
```

总结：

当然kafka的topic数据来源有很多，比如：从一个端口直接生产数据，或者从flume端接收数据等，上面只是写了从本地数据到topic。
