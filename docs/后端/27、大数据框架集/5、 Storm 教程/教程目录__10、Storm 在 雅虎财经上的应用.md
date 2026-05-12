# 10、Storm 在 雅虎财经上的应用
- 来源：https://ddkk.com/zhuanlan/bigdata/storm/10.html
- 分类：大数据框架
- 分组：教程目录
雅虎财经是互联网领先的商业新闻和金融数据网站。它是雅虎的一部分，并提供有关金融新闻，市场统计，国际市场数据和其他任何人都可以访问的财务资源信息。

如果您是注册的Yahoo!用户，那么您可以自定义Yahoo! Finance以利用其特定产品。Yahoo! Finance API用于从Yahoo!查询财务数据**。**

此API显示实时延迟15分钟的数据，并每1分钟更新其数据库，以访问当前股票相关信息。现在让我们看一家公司的实时情景，看看当公司的股票价值低于100时如何提高警报。

## Spout创建

spout的目的是获得公司的详细信息，并发出价格spout。您可以使用以下程序代码创建spout。

### 编码：YahooFinanceSpout.java

```java
import java.util.*;
import java.io.*;
import java.math.BigDecimal;
//import yahoofinace packages
import yahoofinance.YahooFinance;
import yahoofinance.Stock;
import backtype.storm.tuple.Fields;
import backtype.storm.tuple.Values;
import backtype.storm.topology.IRichSpout;
import backtype.storm.topology.OutputFieldsDeclarer;
import backtype.storm.spout.SpoutOutputCollector;
import backtype.storm.task.TopologyContext;
public class YahooFinanceSpout implements IRichSpout {
   private SpoutOutputCollector collector;
   private boolean completed = false;
   private TopologyContext context;
   @Override
   public void open(Map conf, TopologyContext context, SpoutOutputCollector collector){
      this.context = context;
      this.collector = collector;
   }
   @Override
   public void nextTuple() {
      try {
         Stock stock = YahooFinance.get("INTC");
         BigDecimal price = stock.getQuote().getPrice();
         this.collector.emit(new Values("INTC", price.doubleValue()));
         stock = YahooFinance.get("GOOGL");
         price = stock.getQuote().getPrice();
         this.collector.emit(new Values("GOOGL", price.doubleValue()));
         stock = YahooFinance.get("AAPL");
         price = stock.getQuote().getPrice();
         this.collector.emit(new Values("AAPL", price.doubleValue()));
      } catch(Exception e) {}
   }
   @Override
   public void declareOutputFields(OutputFieldsDeclarer declarer) {
      declarer.declare(new Fields("company", "price"));
   }
   @Override
   public void close() {}
   public boolean isDistributed() {
      return false;
   }
   @Override
   public void activate() {}
   @Override
   public void deactivate() {}
   @Override
   public void ack(Object msgId) {}
   @Override
   public void fail(Object msgId) {}
   @Override
   public Map<String, Object> getComponentConfiguration() {
      return null;
   }
}
```

## Bolt创建

这里的的目的是当价格低于100时处理给定公司的价格。它使用Java Map对象在股价低于100时设置截止价格限制警报为真;否则为false。完整的程序代码如下 –

### 编码：PriceCutOffBolt.java

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
public class PriceCutOffBolt implements IRichBolt {
   Map<String, Integer> cutOffMap;
   Map<String, Boolean> resultMap;
   private OutputCollector collector;
   @Override
   public void prepare(Map conf, TopologyContext context, OutputCollector collector) {
      this.cutOffMap = new HashMap <String, Integer>();
      this.cutOffMap.put("INTC", 100);
      this.cutOffMap.put("AAPL", 100);
      this.cutOffMap.put("GOOGL", 100);
      this.resultMap = new HashMap<String, Boolean>();
      this.collector = collector;
   }
   @Override
   public void execute(Tuple tuple) {
      String company = tuple.getString(0);
      Double price = tuple.getDouble(1);
      if(this.cutOffMap.containsKey(company)){
         Integer cutOffPrice = this.cutOffMap.get(company);
         if(price < cutOffPrice) {
            this.resultMap.put(company, true);
         } else {
            this.resultMap.put(company, false);
         }
      }
      collector.ack(tuple);
   }
   @Override
   public void cleanup() {
      for(Map.Entry<String, Boolean> entry:resultMap.entrySet()){
         System.out.println(entry.getKey()+" : " + entry.getValue());
      }
   }
   @Override
   public void declareOutputFields(OutputFieldsDeclarer declarer) {
      declarer.declare(new Fields("cut_off_price"));
   }
   @Override
   public Map<String, Object> getComponentConfiguration() {
      return null;
   }
}
```

## 提交拓扑

这是YahooFinanceSpout.java和PriceCutOffBolt.java连接在一起并生成拓扑的主要应用程序。以下程序代码显示了如何提交拓扑。

### 编码：YahooFinanceStorm.java

```java
import backtype.storm.tuple.Fields;
import backtype.storm.tuple.Values;
import backtype.storm.Config;
import backtype.storm.LocalCluster;
import backtype.storm.topology.TopologyBuilder;
public class YahooFinanceStorm {
   public static void main(String[] args) throws Exception{
      Config config = new Config();
      config.setDebug(true);
      TopologyBuilder builder = new TopologyBuilder();
      builder.setSpout("yahoo-finance-spout", new YahooFinanceSpout());
      builder.setBolt("price-cutoff-bolt", new PriceCutOffBolt())
         .fieldsGrouping("yahoo-finance-spout", new Fields("company"));
      LocalCluster cluster = new LocalCluster();
      cluster.submitTopology("YahooFinanceStorm", config, builder.createTopology());
      Thread.sleep(10000);
      cluster.shutdown();
   }
}
```

## 构建和运行应用程序

完整的应用程序有三个Java代码。他们如下 –

- YahooFinanceSpout.java
- PriceCutOffBolt.java
- YahooFinanceStorm.java

应用程序可以使用以下命令构建 –

```java
javac -cp “/path/to/storm/apache-storm-0.9.5/lib/*”:”/path/to/yahoofinance/lib/*” *.java
```

应用程序可以使用以下命令运行 –

```java
javac -cp “/path/to/storm/apache-storm-0.9.5/lib/*”:”/path/to/yahoofinance/lib/*”:.
YahooFinanceStorm
```

### 输出

输出将类似于以下内容 –

```java
GOOGL : false
AAPL : false
INTC : true
```
