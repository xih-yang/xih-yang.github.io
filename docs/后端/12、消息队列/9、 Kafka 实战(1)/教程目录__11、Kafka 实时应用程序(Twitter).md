# 11、Kafka 实时应用程序(Twitter)
- 来源：https://ddkk.com/zhuanlan/mq/kafka/1/11.html
- 分类：消息队列
- 分组：教程目录
让我们分析一个实时应用程序，以获取最新的Twitter Feed和其标签。 早些时候，我们已经看到了Storm和Spark与Kafka的集成。 在这两种情况下，我们创建了一个Kafka生产者(使用cli)向Kafka生态系统发送消息。 然后，storm和spark集成通过使用Kafka消费者读取消息，并将其分别注入到storm和spark生态系统中。 因此，实际上我们需要创建一个Kafka Producer，

- 使用“Twitter Streaming API”阅读Twitter Feed，
- 处理Feeds，
- 提取HashTags
- 发送到Kafka。

一旦Kafka接收到 HashTags ，Storm / Spark集成接收到该信息并将其发送到Storm / Spark生态系统。

## Twitter Streaming API

“Twitter Streaming API”可以使用任何编程语言访问。 “twitter4j”是一个开源的非官方Java库，它提供了一个基于Java的模块，可以轻松访问“Twitter Streaming API”。 “twitter4j”提供了一个基于监听器的框架来访问tweet。 要访问“Twitter Streaming API”，我们需要登录Twitter开发者帐户，并应获取以下 **OAuth** 身份验证详细信息。

- Customerkey
- CustomerSecret
- AccessToken
- AccessTookenSecret

创建开发人员帐户后，下载“twitter4j”jar文件并将其放置在java类路径中。

完整的Twitter Kafka生产者编码(KafkaTwitterProducer.java)如下所列 –

```java
import java.util.Arrays;
import java.util.Properties;
import java.util.concurrent.LinkedBlockingQueue;
import twitter4j.*;
import twitter4j.conf.*;
import org.apache.kafka.clients.producer.Producer;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerRecord;
public class KafkaTwitterProducer {
   public static void main(String[] args) throws Exception {
      LinkedBlockingQueue<Status> queue = new LinkedBlockingQueue<Sta-tus>(1000);
      if(args.length < 5){
         System.out.println(
            "Usage: KafkaTwitterProducer <twitter-consumer-key>
            <twitter-consumer-secret> <twitter-access-token>
            <twitter-access-token-secret>
            <topic-name> <twitter-search-keywords>");
         return;
      }
      String consumerKey = args[0].toString();
      String consumerSecret = args[1].toString();
      String accessToken = args[2].toString();
      String accessTokenSecret = args[3].toString();
      String topicName = args[4].toString();
      String[] arguments = args.clone();
      String[] keyWords = Arrays.copyOfRange(arguments, 5, arguments.length);
      ConfigurationBuilder cb = new ConfigurationBuilder();
      cb.setDebugEnabled(true)
         .setOAuthConsumerKey(consumerKey)
         .setOAuthConsumerSecret(consumerSecret)
         .setOAuthAccessToken(accessToken)
         .setOAuthAccessTokenSecret(accessTokenSecret);
      TwitterStream twitterStream = new TwitterStreamFactory(cb.build()).get-Instance();
      StatusListener listener = new StatusListener() {
         @Override
         public void onStatus(Status status) {      
            queue.offer(status);
            // System.out.println("@" &plus; status.getUser().getScreenName() 
               &plus; " - " &plus; status.getText());
            // System.out.println("@" &plus; status.getUser().getScreen-Name());
            /*for(URLEntity urle : status.getURLEntities()) {
               System.out.println(urle.getDisplayURL());
            }*/
            /*for(HashtagEntity hashtage : status.getHashtagEntities()) {
               System.out.println(hashtage.getText());
            }*/
         }
         @Override
         public void onDeletionNotice(StatusDeletionNotice statusDeletion-Notice) {
            // System.out.println("Got a status deletion notice id:" 
               &plus; statusDeletionNotice.getStatusId());
         }
         @Override
         public void onTrackLimitationNotice(int numberOfLimitedStatuses) {
            // System.out.println("Got track limitation notice:" &plus; 
               num-berOfLimitedStatuses);
         }
         @Override
         public void onScrubGeo(long userId, long upToStatusId) {
            // System.out.println("Got scrub_geo event userId:" &plus; userId &plus; 
            "upToStatusId:" &plus; upToStatusId);
         }      
         @Override
         public void onStallWarning(StallWarning warning) {
            // System.out.println("Got stall warning:" &plus; warning);
         }
         @Override
         public void onException(Exception ex) {
            ex.printStackTrace();
         }
      };
      twitterStream.addListener(listener);
      FilterQuery query = new FilterQuery().track(keyWords);
      twitterStream.filter(query);
      Thread.sleep(5000);
      //Add Kafka producer config settings
      Properties props = new Properties();
      props.put("bootstrap.servers", "localhost:9092");
      props.put("acks", "all");
      props.put("retries", 0);
      props.put("batch.size", 16384);
      props.put("linger.ms", 1);
      props.put("buffer.memory", 33554432);
      props.put("key.serializer", 
         "org.apache.kafka.common.serializa-tion.StringSerializer");
      props.put("value.serializer", 
         "org.apache.kafka.common.serializa-tion.StringSerializer");
      Producer<String, String> producer = new KafkaProducer<String, String>(props);
      int i = 0;
      int j = 0;
      while(i < 10) {
         Status ret = queue.poll();
         if (ret == null) {
            Thread.sleep(100);
            i++;
         }else {
            for(HashtagEntity hashtage : ret.getHashtagEntities()) {
               System.out.println("Hashtag: " &plus; hashtage.getText());
               producer.send(new ProducerRecord<String, String>(
                  top-icName, Integer.toString(j++), hashtage.getText()));
            }
         }
      }
      producer.close();
      Thread.sleep(5000);
      twitterStream.shutdown();
   }
}
```

### 汇编

使用以下命令编译应用程序 –

```java
javac -cp "/path/to/kafka/libs/*":"/path/to/twitter4j/lib/*":. KafkaTwitterProducer.java
```

### 执行

打开两个控制台。 在一个控制台中运行上面编译的应用程序，如下所示。

```java
java -cp “/path/to/kafka/libs/*":"/path/to/twitter4j/lib/*":
. KafkaTwitterProducer <twitter-consumer-key>
<twitter-consumer-secret>
<twitter-access-token>
<twitter-ac-cess-token-secret>
my-first-topic food
```

在另一个窗口中运行前一章中解释的Spark / Storm应用程序中的任何一个。 主要要注意的是，在这两种情况下使用的主题应该是相同的。 在这里，我们使用“我的第一主题”作为主题名称。

### 输出

此应用程序的输出将取决于关键字和Twitter的当前Feed。 下面指定样本输出(集成storm)。

```java
. . .
food : 1
foodie : 2
burger : 1
. . .
```
