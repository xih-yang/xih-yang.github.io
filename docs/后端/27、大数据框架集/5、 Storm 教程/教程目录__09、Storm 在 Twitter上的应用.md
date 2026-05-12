# 09、Storm 在 Twitter上的应用
- 来源：https://ddkk.com/zhuanlan/bigdata/storm/9.html
- 分类：大数据框架
- 分组：教程目录
在本章中，我们将讨论Apache Storm的实时应用程序。我们将看到Storm如何在Twitter中使用。

## Twitter

Twitter是一种在线社交网络服务，提供发送和接收用户推文的平台。注册用户可以阅读和发布tweet，但未注册的用户只能阅读tweets。 Hashtag用于按关键字在相关关键字之前附加＃来对tweet进行分类。现在让我们来看一个实时场景，找到每个主题使用最多的hashtag。

### Spout创建

spout的目的是尽快收到人们提交的tweets。Twitter提供了“Twitter Streaming API”，一个基于Web服务的工具，用于实时检索人们提交的tweets。Twitter Streaming API可以使用任何编程语言访问。

**twitter4j**是一个开源的非官方Java库，它提供了一个基于Java的模块，可以轻松访问Twitter Streaming API。twitter4j提供了一个基于监听器的框架来访问tweet。要访问Twitter Streaming API，我们需要登录Twitter开发人员帐户，并获取以下OAuth身份验证详细信息。

- Customerkey
- CustomerSecret
- 的accessToken
- AccessTookenSecret

Storm在其入门套件中提供了一个twitter spout，TwitterSampleSpout。我们将使用它来检索tweet。该邮件需要OAuth身份验证详细信息和至少一个关键字。该spout将发出基于关键字的实时tweet。完整的程序代码如下。

### 编码：TwitterSampleSpout.java

```java
import java.util.Map;
import java.util.concurrent.LinkedBlockingQueue;
import twitter4j.FilterQuery;
import twitter4j.StallWarning;
import twitter4j.Status;
import twitter4j.StatusDeletionNotice;
import twitter4j.StatusListener;
import twitter4j.TwitterStream;
import twitter4j.TwitterStreamFactory;
import twitter4j.auth.AccessToken;
import twitter4j.conf.ConfigurationBuilder;
import backtype.storm.Config;
import backtype.storm.spout.SpoutOutputCollector;
import backtype.storm.task.TopologyContext;
import backtype.storm.topology.OutputFieldsDeclarer;
import backtype.storm.topology.base.BaseRichSpout;
import backtype.storm.tuple.Fields;
import backtype.storm.tuple.Values;
import backtype.storm.utils.Utils;
@SuppressWarnings("serial")
public class TwitterSampleSpout extends BaseRichSpout {
   SpoutOutputCollector _collector;
   LinkedBlockingQueue<Status> queue = null;
   TwitterStream _twitterStream;
   String consumerKey;
   String consumerSecret;
   String accessToken;
   String accessTokenSecret;
   String[] keyWords;
   public TwitterSampleSpout(String consumerKey, String consumerSecret,
      String accessToken, String accessTokenSecret, String[] keyWords) {
         this.consumerKey = consumerKey;
         this.consumerSecret = consumerSecret;
         this.accessToken = accessToken;
         this.accessTokenSecret = accessTokenSecret;
         this.keyWords = keyWords;
   }
   public TwitterSampleSpout() {
      // TODO Auto-generated constructor stub
   }
   @Override
   public void open(Map conf, TopologyContext context,
      SpoutOutputCollector collector) {
         queue = new LinkedBlockingQueue<Status>(1000);
         _collector = collector;
         StatusListener listener = new StatusListener() {
            @Override
            public void onStatus(Status status) {
               queue.offer(status);
            }
            @Override
            public void onDeletionNotice(StatusDeletionNotice sdn) {}
            @Override
            public void onTrackLimitationNotice(int i) {}
            @Override
            public void onScrubGeo(long l, long l1) {}
            @Override
            public void onException(Exception ex) {}
            @Override
            public void onStallWarning(StallWarning arg0) {
               // TODO Auto-generated method stub
            }
         };
         ConfigurationBuilder cb = new ConfigurationBuilder();
         cb.setDebugEnabled(true)
            .setOAuthConsumerKey(consumerKey)
            .setOAuthConsumerSecret(consumerSecret)
            .setOAuthAccessToken(accessToken)
            .setOAuthAccessTokenSecret(accessTokenSecret);
         _twitterStream = new TwitterStreamFactory(cb.build()).getInstance();
         _twitterStream.addListener(listener);
         if (keyWords.length == 0) {
            _twitterStream.sample();
         }else {
            FilterQuery query = new FilterQuery().track(keyWords);
            _twitterStream.filter(query);
         }
   }
   @Override
   public void nextTuple() {
      Status ret = queue.poll();
      if (ret == null) {
         Utils.sleep(50);
      } else {
         _collector.emit(new Values(ret));
      }
   }
   @Override
   public void close() {
      _twitterStream.shutdown();
   }
   @Override
   public Map<String, Object> getComponentConfiguration() {
      Config ret = new Config();
      ret.setMaxTaskParallelism(1);
      return ret;
   }
   @Override
   public void ack(Object id) {}
   @Override
   public void fail(Object id) {}
   @Override
   public void declareOutputFields(OutputFieldsDeclarer declarer) {
      declarer.declare(new Fields("tweet"));
   }
}
```

## Hashtag阅读器spout

由spout发出的tweet将被转发到**HashtagReaderBolt**，它将处理该tweet并发出所有可用的hashtag。HashtagReaderBolt使用twitter4j提供的**getHashTagEntities**方法。getHashTagEntities读取tweet并返回hashtag的列表。完整的程序代码如下 –

### 编码：HashtagReaderBolt.java

```java
import java.util.HashMap;
import java.util.Map;
import twitter4j.*;
import twitter4j.conf.*;
import backtype.storm.tuple.Fields;
import backtype.storm.tuple.Values;
import backtype.storm.task.OutputCollector;
import backtype.storm.task.TopologyContext;
import backtype.storm.topology.IRichBolt;
import backtype.storm.topology.OutputFieldsDeclarer;
import backtype.storm.tuple.Tuple;
public class HashtagReaderBolt implements IRichBolt {
   private OutputCollector collector;
   @Override
   public void prepare(Map conf, TopologyContext context, OutputCollector collector) {
      this.collector = collector;
   }
   @Override
   public void execute(Tuple tuple) {
      Status tweet = (Status) tuple.getValueByField("tweet");
      for(HashtagEntity hashtage : tweet.getHashtagEntities()) {
         System.out.println("Hashtag: " + hashtage.getText());
         this.collector.emit(new Values(hashtage.getText()));
      }
   }
   @Override
   public void cleanup() {}
   @Override
   public void declareOutputFields(OutputFieldsDeclarer declarer) {
      declarer.declare(new Fields("hashtag"));
   }
   @Override
   public Map<String, Object> getComponentConfiguration() {
      return null;
   }
}
```

## Hashtag计数器spout

发出的hashtag将被转发到HashtagCounterBolt。这个bolt将处理所有的hashtags，并使用Java Map对象将每个hashtags及其计数保存在内存中。完整的程序代码如下。

### 编码：HashtagCounterBolt.java

```java
import java.util.HashMap;
import java.util.Map;
import backtype.storm.tuple.Fields;
import backtype.storm.tuple.Values;
import backtype.storm.task.OutputCollector;
import backtype.storm.task.TopologyContext;
import backtype.storm.topology.IRichBolt;
import backtype.storm.topology.OutputFieldsDeclarer;
import backtype.storm.tuple.Tuple;
public class HashtagCounterBolt implements IRichBolt {
   Map<String, Integer> counterMap;
   private OutputCollector collector;
   @Override
   public void prepare(Map conf, TopologyContext context, OutputCollector collector) {
      this.counterMap = new HashMap<String, Integer>();
      this.collector = collector;
   }
   @Override
   public void execute(Tuple tuple) {
      String key = tuple.getString(0);
      if(!counterMap.containsKey(key)){
         counterMap.put(key, 1);
      }else{
         Integer c = counterMap.get(key) + 1;
         counterMap.put(key, c);
      }
      collector.ack(tuple);
   }
   @Override
   public void cleanup() {
      for(Map.Entry<String, Integer> entry:counterMap.entrySet()){
         System.out.println("Result: " + entry.getKey()+" : " + entry.getValue());
      }
   }
   @Override
   public void declareOutputFields(OutputFieldsDeclarer declarer) {
      declarer.declare(new Fields("hashtag"));
   }
   @Override
   public Map<String, Object> getComponentConfiguration() {
      return null;
   }
}
```

## 提交拓扑

提交拓扑是主要应用程序。Twitter拓扑由TwitterSampleSpout，HashtagReaderBolt和HashtagCounterBolt组成。以下程序代码显示如何提交拓扑。

### 编码：TwitterHashtagStorm.java

```java
import java.util.*;
import backtype.storm.tuple.Fields;
import backtype.storm.tuple.Values;
import backtype.storm.Config;
import backtype.storm.LocalCluster;
import backtype.storm.topology.TopologyBuilder;
public class TwitterHashtagStorm {
   public static void main(String[] args) throws Exception{
      String consumerKey = args[0];
      String consumerSecret = args[1];
      String accessToken = args[2];
      String accessTokenSecret = args[3];
      String[] arguments = args.clone();
      String[] keyWords = Arrays.copyOfRange(arguments, 4, arguments.length);
      Config config = new Config();
      config.setDebug(true);
      TopologyBuilder builder = new TopologyBuilder();
      builder.setSpout("twitter-spout", new TwitterSampleSpout(consumerKey,
         consumerSecret, accessToken, accessTokenSecret, keyWords));
      builder.setBolt("twitter-hashtag-reader-bolt", new HashtagReaderBolt())
         .shuffleGrouping("twitter-spout");
      builder.setBolt("twitter-hashtag-counter-bolt", new HashtagCounterBolt())
         .fieldsGrouping("twitter-hashtag-reader-bolt", new Fields("hashtag"));
      LocalCluster cluster = new LocalCluster();
      cluster.submitTopology("TwitterHashtagStorm", config,
         builder.createTopology());
      Thread.sleep(10000);
      cluster.shutdown();
   }
}
```

## 构建和运行应用程序

完整的应用程序有四个Java代码。他们如下 –

- TwitterSampleSpout.java
- HashtagReaderBolt.java
- HashtagCounterBolt.java
- TwitterHashtagStorm.java

您可以使用以下命令编译应用程序 –

```java
javac -cp “/path/to/storm/apache-storm-0.9.5/lib/*”:”/path/to/twitter4j/lib/*” *.java
```

使用以下命令执行应用程序 –

```java
javac -cp “/path/to/storm/apache-storm-0.9.5/lib/*”:”/path/to/twitter4j/lib/*”:.
TwitterHashtagStorm <customerkey> <customersecret> <accesstoken> <accesstokensecret>
<keyword1> <keyword2> … <keywordN>
```

### 输出

应用程序将打印当前可用的主题标签及其计数。输出应类似于以下内容 –

```java
Result: jazztastic : 1
Result: foodie : 1
Result: Redskins : 1
Result: Recipe : 1
Result: cook : 1
Result: android : 1
Result: food : 2
Result: NoToxicHorseMeat : 1
Result: Purrs4Peace : 1
Result: livemusic : 1
Result: VIPremium : 1
Result: Frome : 1
Result: SundayRoast : 1
Result: Millennials : 1
Result: HealthWithKier : 1
Result: LPs30DaysofGratitude : 1
Result: cooking : 1
Result: gameinsight : 1
Result: Countryfile : 1
Result: androidgames : 1
```
