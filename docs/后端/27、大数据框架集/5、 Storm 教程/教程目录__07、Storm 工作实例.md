# 07、Storm 工作实例
- 来源：https://ddkk.com/zhuanlan/bigdata/storm/7.html
- 分类：大数据框架
- 分组：教程目录
我们已经经历了Apache Storm的核心技术细节，现在是时候编写一些简单的场景。

## 场景 – 移动呼叫日志分析器

移动呼叫及其持续时间将作为对Apache Storm的输入，Storm将处理和分组在相同呼叫者和接收者之间的呼叫及其呼叫总数。

## Spout创建

Spout是用于数据生成的组件。基本上，一个spout将实现一个IRichSpout接口。 “IRichSpout”接口有以下重要方法 –

- **open** -为Spout提供执行环境。执行器将运行此方法来初始化喷头。
- **nextTuple** -通过收集器发出生成的数据。
- **close** -当spout将要关闭时调用此方法。
- **declareOutputFields** -声明元组的输出模式。
- **ack** -确认处理了特定元组。
- **fail** -指定不处理和不重新处理特定元组。

### open

open方法的签名如下 –

```java
open(Map conf, TopologyContext context, SpoutOutputCollector collector)
```

- **conf** - 为此spout提供storm配置。
- **context** - 提供有关拓扑中的spout位置，其任务ID，输入和输出信息的完整信息。
- **collector** - 使我们能够发出将由bolts处理的元组。

### nextTuple

nextTuple方法的签名如下 –

```java
nextTuple()
```

nextTuple()从与ack()和fail()方法相同的循环中定期调用。它必须释放线程的控制，当没有工作要做，以便其他方法有机会被调用。因此，nextTuple的第一行检查处理是否已完成。如果是这样，它应该休眠至少一毫秒，以减少处理器在返回之前的负载。

### close

**close**方法的签名如下-

```java
close()
```

### declareOutputFields

**declareOutputFields**方法的签名如下-

```java
declareOutputFields(OutputFieldsDeclarer declarer)
```

**declarer**-它用于声明输出流id，输出字段等

此方法用于指定元组的输出模式。

### ack

**ack**方法的签名如下 –

```java
ack(Object msgId)
```

该方法确认已经处理了特定元组。

### fail

**nextTuple**方法的签名如下-

```java
ack(Object msgId)
```

此方法通知特定元组尚未完全处理。 Storm将重新处理特定的元组。

### FakeCallLogReaderSpout

在我们的场景中，我们需要收集呼叫日志详细信息。呼叫日志的信息包含。

- 主叫号码
- 接收号码
- 持续时间

由于我们没有呼叫日志的实时信息，我们将生成假呼叫日志。假信息将使用Random类创建。完整的程序代码如下。

### 编码 – FakeCallLogReaderSpout.java

```java
import java.util.*;
//import storm tuple packages
import backtype.storm.tuple.Fields;
import backtype.storm.tuple.Values;
//import Spout interface packages
import backtype.storm.topology.IRichSpout;
import backtype.storm.topology.OutputFieldsDeclarer;
import backtype.storm.spout.SpoutOutputCollector;
import backtype.storm.task.TopologyContext;
//Create a class FakeLogReaderSpout which implement IRichSpout interface 
   to access functionalities
public class FakeCallLogReaderSpout implements IRichSpout {
   //Create instance for SpoutOutputCollector which passes tuples to bolt.
   private SpoutOutputCollector collector;
   private boolean completed = false;
   //Create instance for TopologyContext which contains topology data.
   private TopologyContext context;
   //Create instance for Random class.
   private Random randomGenerator = new Random();
   private Integer idx = 0;
   @Override
   public void open(Map conf, TopologyContext context, SpoutOutputCollector collector) {
      this.context = context;
      this.collector = collector;
   }
   @Override
   public void nextTuple() {
      if(this.idx <= 1000) {
         List<String> mobileNumbers = new ArrayList<String>();
         mobileNumbers.add("1234123401");
         mobileNumbers.add("1234123402");
         mobileNumbers.add("1234123403");
         mobileNumbers.add("1234123404");
         Integer localIdx = 0;
         while(localIdx++ < 100 && this.idx++ < 1000) {
            String fromMobileNumber = mobileNumbers.get(randomGenerator.nextInt(4));
            String toMobileNumber = mobileNumbers.get(randomGenerator.nextInt(4));
            while(fromMobileNumber == toMobileNumber) {
               toMobileNumber = mobileNumbers.get(randomGenerator.nextInt(4));
            }
            Integer duration = randomGenerator.nextInt(60);
            this.collector.emit(new Values(fromMobileNumber, toMobileNumber, duration));
         }
      }
   }
   @Override
   public void declareOutputFields(OutputFieldsDeclarer declarer) {
      declarer.declare(new Fields("from", "to", "duration"));
   }
   //Override all the interface methods
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

Bolt是一个使用元组作为输入，处理元组，并产生新的元组作为输出的组件。Bolts将实现**IRichBolt**接口。在此程序中，使用两个Bolts

类**CallLogCreatorBolt**和**CallLogCounterBolt**来执行操作。

IRichBolt接口有以下方法 –

- **prepare** -为bolt提供要执行的环境。执行器将运行此方法来初始化spout。
- **execute** -处理单个元组的输入
- **cleanup**-当spout要关闭时调用。
- **declareOutputFields** -声明元组的输出模式。

### Prepare

**prepare**方法的签名如下 –

```java
prepare(Map conf, TopologyContext context, OutputCollector collector)
```

- **conf** -为此bolt提供Storm配置。
- **context** -提供有关拓扑中的bolt位置，其任务ID，输入和输出信息等的完整信息。
- **collector** -使我们能够发出处理的元组。

### execute

**execute**方法的签名如下-

```java
execute(Tuple tuple)
```

这里的**元组**是要处理的输入元组。

**execute**方法一次处理单个元组。元组数据可以通过Tuple类的getValue方法访问。不必立即处理输入元组。多元组可以被处理和输出为单个输出元组。处理的元组可以通过使用OutputCollector类发出。

### cleanup

**cleanup**方法的签名如下 –

```java
cleanup()
```

### declareOutputFields

**declareOutputFields**方法的签名如下-

```java
declareOutputFields(OutputFieldsDeclarer declarer)
```

这里的参数**declarer**用于声明输出流id，输出字段等。

此方法用于指定元组的输出模式**。**

## 呼叫日志创建者bolt

呼叫日志创建者bolt接收呼叫日志元组。呼叫日志元组具有主叫方号码，接收方号码和呼叫持续时间。此bolt通过组合主叫方号码和接收方号码简单地创建一个新值。新值的格式为“来电号码 – 接收方号码”，并将其命名为新字段“呼叫”。完整的代码如下。

### 编码 – CallLogCreatorBolt.java

```java
//import util packages
import java.util.HashMap;
import java.util.Map;
import backtype.storm.tuple.Fields;
import backtype.storm.tuple.Values;
import backtype.storm.task.OutputCollector;
import backtype.storm.task.TopologyContext;
//import Storm IRichBolt package
import backtype.storm.topology.IRichBolt;
import backtype.storm.topology.OutputFieldsDeclarer;
import backtype.storm.tuple.Tuple;
//Create a class CallLogCreatorBolt which implement IRichBolt interface
public class CallLogCreatorBolt implements IRichBolt {
   //Create instance for OutputCollector which collects and emits tuples to produce output
   private OutputCollector collector;
   @Override
   public void prepare(Map conf, TopologyContext context, OutputCollector collector) {
      this.collector = collector;
   }
   @Override
   public void execute(Tuple tuple) {
      String from = tuple.getString(0);
      String to = tuple.getString(1);
      Integer duration = tuple.getInteger(2);
      collector.emit(new Values(from + " - " + to, duration));
   }
   @Override
   public void cleanup() {}
   @Override
   public void declareOutputFields(OutputFieldsDeclarer declarer) {
      declarer.declare(new Fields("call", "duration"));
   }
   @Override
   public Map<String, Object> getComponentConfiguration() {
      return null;
   }
}
```

## 呼叫日志计数器Bolt

呼叫日志创建者bolt接收呼叫日志元组。呼叫日志元组具有主叫方号码，接收方号码和呼叫持续时间。此bolt通过组合主叫方号码和接收方号码简单地创建一个新值。新值的格式为“来电号码 – 接收方号码”，并将其命名为新字段“呼叫”。完整的代码如下。

### 编码 – CallLogCounterBolt.java

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
public class CallLogCounterBolt implements IRichBolt {
   Map<String, Integer> counterMap;
   private OutputCollector collector;
   @Override
   public void prepare(Map conf, TopologyContext context, OutputCollector collector) {
      this.counterMap = new HashMap<String, Integer>();
      this.collector = collector;
   }
   @Override
   public void execute(Tuple tuple) {
      String call = tuple.getString(0);
      Integer duration = tuple.getInteger(1);
      if(!counterMap.containsKey(call)){
         counterMap.put(call, 1);
      }else{
         Integer c = counterMap.get(call) + 1;
         counterMap.put(call, c);
      }
      collector.ack(tuple);
   }
   @Override
   public void cleanup() {
      for(Map.Entry<String, Integer> entry:counterMap.entrySet()){
         System.out.println(entry.getKey()+" : " + entry.getValue());
      }
   }
   @Override
   public void declareOutputFields(OutputFieldsDeclarer declarer) {
      declarer.declare(new Fields("call"));
   }
   @Override
   public Map<String, Object> getComponentConfiguration() {
      return null;
   }
}
```

## 创建拓扑

Storm拓扑基本上是一个Thrift结构。 TopologyBuilder类提供了简单而容易的方法来创建复杂的拓扑。TopologyBuilder类具有设置spout**（setSpout）** 和设置bolt**（setBolt）** 的方法。最后，TopologyBuilder有createTopology来创建拓扑。使用以下代码片段创建拓扑 –

```java
TopologyBuilder builder = new TopologyBuilder();
builder.setSpout("call-log-reader-spout", new FakeCallLogReaderSpout());
builder.setBolt("call-log-creator-bolt", new CallLogCreatorBolt())
   .shuffleGrouping("call-log-reader-spout");
builder.setBolt("call-log-counter-bolt", new CallLogCounterBolt())
   .fieldsGrouping("call-log-creator-bolt", new Fields("call"));
```

**shuffleGrouping**和**fieldsGrouping**方法有助于为spout和bolts设置流分组。

## 本地集群

为了开发目的，我们可以使用“LocalCluster”对象创建本地集群，然后使用“LocalCluster”类的“submitTopology”方法提交拓扑。 “submitTopology”的参数之一是“Config”类的实例。“Config”类用于在提交拓扑之前设置配置选项。此配置选项将在运行时与集群配置合并，并使用prepare方法发送到所有任务（spout和bolt）。一旦拓扑提交到集群，我们将等待10秒钟，集群计算提交的拓扑，然后使用“LocalCluster”的“shutdown”方法关闭集群。完整的程序代码如下 –

### 编码 – LogAnalyserStorm.java

```java
import backtype.storm.tuple.Fields;
import backtype.storm.tuple.Values;
//import storm configuration packages
import backtype.storm.Config;
import backtype.storm.LocalCluster;
import backtype.storm.topology.TopologyBuilder;
//Create main class LogAnalyserStorm submit topology.
public class LogAnalyserStorm {
   public static void main(String[] args) throws Exception{
      //Create Config instance for cluster configuration
      Config config = new Config();
      config.setDebug(true);
      //
      TopologyBuilder builder = new TopologyBuilder();
      builder.setSpout("call-log-reader-spout", new FakeCallLogReaderSpout());
      builder.setBolt("call-log-creator-bolt", new CallLogCreatorBolt())
         .shuffleGrouping("call-log-reader-spout");
      builder.setBolt("call-log-counter-bolt", new CallLogCounterBolt())
         .fieldsGrouping("call-log-creator-bolt", new Fields("call"));
      LocalCluster cluster = new LocalCluster();
      cluster.submitTopology("LogAnalyserStorm", config, builder.createTopology());
      Thread.sleep(10000);
      //Stop the topology
      cluster.shutdown();
   }
}
```

## 构建和运行应用程序

完整的应用程序有四个Java代码。它们是 –

- FakeCallLogReaderSpout.java
- CallLogCreaterBolt.java
- CallLogCounterBolt.java
- LogAnalyerStorm.java

应用程序可以使用以下命令构建 –

```java
javac -cp “/path/to/storm/apache-storm-0.9.5/lib/*” *.java
```

应用程序可以使用以下命令运行 –

```java
java -cp “/path/to/storm/apache-storm-0.9.5/lib/*”:. LogAnalyserStorm
```

### 输出

一旦应用程序启动，它将输出有关集群启动过程，spout和螺栓处理的完整详细信息，最后是集群关闭过程。在“CallLogCounterBolt”中，我们打印了呼叫及其计数详细信息。此信息将显示在控制台上如下 –

```java
1234123402 - 1234123401 : 78
1234123402 - 1234123404 : 88
1234123402 - 1234123403 : 105
1234123401 - 1234123404 : 74
1234123401 - 1234123403 : 81
1234123401 - 1234123402 : 81
1234123403 - 1234123404 : 86
1234123404 - 1234123401 : 63
1234123404 - 1234123402 : 82
1234123403 - 1234123402 : 83
1234123404 - 1234123403 : 86
1234123403 - 1234123401 : 93
```

## 非JVM语言

Storm拓扑通过Thrift接口实现，这使得轻松地提交任何语言的拓扑。Storm支持Ruby，Python和许多其他语言。让我们来看看python绑定。

### Python绑定

Python是一种通用的解释，交互，面向对象和高级编程语言。Storm支持Python实现其拓扑。Python支持发射，锚定，acking和日志操作。

如你所知，bolt可以用任何语言定义。用另一种语言编写的bolt作为子进程执行，Storm通过stdin / stdout与JSON消息进行通信。首先拿一个支持python绑定的样例boltWordCount。

```java
public static class WordCount implements IRichBolt {
   public WordSplit() {
      super("python", "splitword.py");
   }
   public void declareOutputFields(OutputFieldsDeclarer declarer) {
      declarer.declare(new Fields("word"));
   }
}
```

这里的类**WordCount**实现**IRichBolt**接口和运行与python实现指定超级方法参数“splitword.py”。现在创建一个名为“splitword.py”的python实现。

```java
import storm
   class WordCountBolt(storm.BasicBolt):
      def process(self, tup):
         words = tup.values[0].split(" ")
         for word in words:
         storm.emit([word])
WordCountBolt().run()
```

这是Python的示例实现，它计算给定句子中的单词。同样，您也可以与其他支持语言绑定。
