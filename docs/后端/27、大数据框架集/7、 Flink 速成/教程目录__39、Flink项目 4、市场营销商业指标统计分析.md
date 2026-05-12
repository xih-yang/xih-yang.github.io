# 39、Flink项目 4、市场营销商业指标统计分析
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/2/39.html
- 分类：大数据框架
- 分组：教程目录
## 一、 项目概述

随着智能手机的普及，在如今的电商网站中已经有越来越多的用户来自移动端， 相比起传统浏览器的登录方式 ，手机 APP 成为了更多用户访问电商网站的首选 。对 于电商企业来说 ，一般会通过各种不同的渠道对自己的 APP 进行市场推广，而这些 渠道的统计数据（比如，不同网站上广告链接的点击量、 APP 下载量）就成了市场 营销的重要商业指标。

## 二、代码

## 2.1 pom文件配置

pom文件如下:

```xml
</dependency>
    <dependency>
      <groupId>org.apache.flink</groupId>
      <artifactId>flink-java</artifactId>
      <version>1.10.1</version>
      <scope>provided</scope>
    </dependency>
    <dependency>
      <groupId>org.apache.flink</groupId>
      <artifactId>flink-streaming-java_2.11</artifactId>
      <version>1.10.1</version>
      <scope>provided</scope>
    </dependency>
    <dependency>
      <groupId>org.apache.flink</groupId>
      <artifactId>flink-connector-kafka_2.11</artifactId>
      <version>1.10.1</version>
    </dependency>
    <dependency>
      <groupId>org.apache.flink</groupId>
      <artifactId>flink-core</artifactId>
      <version>1.10.1</version>
    </dependency>
    <dependency>
      <groupId>org.apache.flink</groupId>
      <artifactId>flink-clients_2.11</artifactId>
      <version>1.10.1</version>
    </dependency>
    <dependency>
      <groupId>org.apache.flink</groupId>
      <artifactId>flink-connector-redis_2.11</artifactId>
      <version>1.1.5</version>
    </dependency>
    <!-- https://mvnrepository.com/artifact/mysql/mysql-connector-java -->
    <dependency>
      <groupId>mysql</groupId>
      <artifactId>mysql-connector-java</artifactId>
      <version>8.0.19</version>
    </dependency>
    <dependency>
      <groupId>org.apache.flink</groupId>
      <artifactId>flink-statebackend-rocksdb_2.11</artifactId>
      <version>1.10.1</version>
    </dependency>
    <!-- Table API 和 Flink SQL -->
    <dependency>
      <groupId>org.apache.flink</groupId>
      <artifactId>flink-table-planner-blink_2.11</artifactId>
      <version>1.10.1</version>
    </dependency>
    <dependency>
      <groupId>org.apache.flink</groupId>
      <artifactId>flink-table-planner_2.11</artifactId>
      <version>1.10.1</version>
    </dependency>
    <dependency>
      <groupId>org.apache.flink</groupId>
      <artifactId>flink-table-api-java-bridge_2.11</artifactId>
      <version>1.10.1</version>
    </dependency>
    <dependency>
      <groupId>org.apache.flink</groupId>
      <artifactId>flink-streaming-scala_2.11</artifactId>
      <version>1.10.1</version>
    </dependency>
    <dependency>
      <groupId>org.apache.flink</groupId>
      <artifactId>flink-table-common</artifactId>
      <version>1.10.1</version>
    </dependency>
    <dependency>
      <groupId>org.apache.flink</groupId>
      <artifactId>flink-csv</artifactId>
      <version>1.10.1</version>
    </dependency>
```

## 2.2 POJO类

AdClickEvent

```java
    private Long userId;
    private Long adId;
    private String province;
    private String city;
    private Long timestamp;
```

AdCountViewByProvince

```java
    private String province;
    private String windowEnd;
    private Long count;
```

BlackListUserWarning

```java
    private Long userId;
    private Long adId;
    private String warningMsg;
```

ChannelPromotionCount

```java
    private String channel;
    private String behavior;
    private String windowEnd;
    private Long count;
```

MarketingUserBehavior

```java
    private Long userId;
    private String behavior;
    private String channel;
    private Long timestamp;
```

## 2.3 自定义测试数据源

定义一个源数据的 POJO 类 MarketingUserBehavior，再 定义一个 SourceFunction， 用于产生用户行为源数据，命名为 SimulatedMarketingBehaviorSource：

```java
// 实现自定义的模拟市场用户行为数据源
    public static class SimulatedMarketingUserBehaviorSource implements SourceFunction<MarketingUserBehavior>{
        // 控制是否正常运行的标示位
        Boolean running = true;
        // 定义用户行为和渠道的范围
        List<String> behaviorList = Arrays.asList("CLICK", "DOWNLOAD", "INSTALL", "UNINSTALL");
        List<String> channelList = Arrays.asList("app store", "wechat", "weibo");
        Random random = new Random();
        @Override
        public void run(SourceContext<MarketingUserBehavior> ctx) throws Exception {
            while(running){
                //  随机生成所有字段
                Long id = random.nextLong();
                String behavior = behaviorList.get( random.nextInt(behaviorList.size()) );
                String channel = channelList.get( random.nextInt(channelList.size()));
                Long timestamp = System.currentTimeMillis();
                // 发出数据
                ctx.collect(new MarketingUserBehavior(id ,behavior, channel, timestamp));
                Thread.sleep(100L);
            }
        }
        @Override
        public void cancel() {
            running = false;
        }
    }
```

## 2.4 分渠道统计

另外定义一个窗口处理的输出结果 POJO 类 ChannelPromotionCount，并自定义 预聚合函数 AggregateFunction 和全窗口函数 ProcessWindowFunction 进行处理。

**代码:**

```java
package com.zqs.flink.project.market_analysis;
/**
 * @remark App Marketing By Channel
 */
import com.zqs.flink.project.market_analysis.beans.ChannelPromotionCount;
import com.zqs.flink.project.market_analysis.beans.MarketingUserBehavior;
import org.apache.flink.api.common.functions.AggregateFunction;
import org.apache.flink.api.java.tuple.Tuple;
import org.apache.flink.streaming.api.TimeCharacteristic;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.source.SourceFunction;
import org.apache.flink.streaming.api.functions.timestamps.AscendingTimestampExtractor;
import org.apache.flink.streaming.api.functions.windowing.ProcessWindowFunction;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.streaming.api.windowing.windows.TimeWindow;
import org.apache.flink.util.Collector;
import java.sql.Timestamp;
import java.util.Arrays;
import java.util.List;
import java.util.Random;
public class AppMarketingByChannel {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        env.setStreamTimeCharacteristic(TimeCharacteristic.EventTime);
        // 1. 从自定义数据源中读取数据
        DataStream<MarketingUserBehavior> dataStream = env.addSource(new SimulatedMarketingUserBehaviorSource() )
                .assignTimestampsAndWatermarks(new AscendingTimestampExtractor<MarketingUserBehavior>() {
                    @Override
                    public long extractAscendingTimestamp(MarketingUserBehavior element) {
                        return element.getTimestamp();
                    }
                });
        // 2. 分渠道开窗统计
        SingleOutputStreamOperator<ChannelPromotionCount> resultStream = dataStream
                .filter(data -> !"UNINSTALL".equals(data.getBehavior()))
                .keyBy("channel", "behavior")
                .timeWindow(Time.hours(1), Time.seconds(5))     // 定义滑窗
                .aggregate(new MarketingCountAgg(), new MarketingCountResult());
        resultStream.print();
        env.execute("app marketing by channel job");
    }
    // 实现自定义的模拟市场用户行为数据源
    public static class SimulatedMarketingUserBehaviorSource implements SourceFunction<MarketingUserBehavior>{
        // 控制是否正常运行的标示位
        Boolean running = true;
        // 定义用户行为和渠道的范围
        List<String> behaviorList = Arrays.asList("CLICK", "DOWNLOAD", "INSTALL", "UNINSTALL");
        List<String> channelList = Arrays.asList("app store", "wechat", "weibo");
        Random random = new Random();
        @Override
        public void run(SourceContext<MarketingUserBehavior> ctx) throws Exception {
            while(running){
                //  随机生成所有字段
                Long id = random.nextLong();
                String behavior = behaviorList.get( random.nextInt(behaviorList.size()) );
                String channel = channelList.get( random.nextInt(channelList.size()));
                Long timestamp = System.currentTimeMillis();
                // 发出数据
                ctx.collect(new MarketingUserBehavior(id ,behavior, channel, timestamp));
                Thread.sleep(100L);
            }
        }
        @Override
        public void cancel() {
            running = false;
        }
    }
    // 实现自定义的增量聚合函数
    public static class MarketingCountAgg implements AggregateFunction<MarketingUserBehavior, Long, Long>{
        @Override
        public Long createAccumulator() {
            return 0L;
        }
        @Override
        public Long add(MarketingUserBehavior value, Long accumulator) {
            return accumulator + 1;
        }
        @Override
        public Long getResult(Long accumulator) {
            return accumulator;
        }
        @Override
        public Long merge(Long a, Long b) {
            return a + b;
        }
    }
    // 实现自定义全窗口函数
    public static class MarketingCountResult extends ProcessWindowFunction<Long, ChannelPromotionCount, Tuple, TimeWindow>{
        @Override
        public void process(Tuple tuple, Context context, Iterable<Long> elements, Collector<ChannelPromotionCount> out) throws Exception {
            String channel = tuple.getField(0);
            String behavior = tuple.getField(1);
            String windowEnd = new Timestamp(context.window().getEnd()).toString();
            Long count = elements.iterator().next();
            out.collect(new ChannelPromotionCount(channel, behavior, windowEnd, count));
        }
    }
}
```

**测试记录:**

## 2.5 不分渠道（总量）统计

同样我们还可以考察不分渠道的市场推广统计，这样得到的就是所有渠道推广 的总量，创建 AppMarketingStatistics 类。

**代码如下:**

```java
package com.zqs.flink.project.market_analysis;
import com.zqs.flink.project.market_analysis.beans.ChannelPromotionCount;
import com.zqs.flink.project.market_analysis.beans.MarketingUserBehavior;
import org.apache.flink.api.common.functions.AggregateFunction;
import org.apache.flink.api.common.functions.MapFunction;
import org.apache.flink.api.java.tuple.Tuple;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.streaming.api.TimeCharacteristic;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.timestamps.AscendingTimestampExtractor;
import org.apache.flink.streaming.api.functions.windowing.WindowFunction;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.streaming.api.windowing.windows.TimeWindow;
import org.apache.flink.util.Collector;
import java.sql.Timestamp;
/**
 * @remark App Marketing Statistics
 */
public class AppMarketingStatistics {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        env.setStreamTimeCharacteristic(TimeCharacteristic.EventTime);
        // 1. 从自定义数据源中读取数据
        DataStream<MarketingUserBehavior> dataStream = env.addSource(new AppMarketingByChannel.SimulatedMarketingUserBehaviorSource())
                .assignTimestampsAndWatermarks(new AscendingTimestampExtractor<MarketingUserBehavior>() {
                    @Override
                    public long extractAscendingTimestamp(MarketingUserBehavior element) {
                        return element.getTimestamp();
                    }
                });
        // 2. 开窗统计总量
        SingleOutputStreamOperator<ChannelPromotionCount> resultStream = dataStream
                .filter(data -> !"UNINSTALL".equals(data.getBehavior()))
                .map(new MapFunction<MarketingUserBehavior, Tuple2<String, Long>>() {
                    @Override
                    public Tuple2<String, Long> map(MarketingUserBehavior value) throws Exception {
                        return new Tuple2<>("total", 1L);
                    }
                })
                .keyBy(0)
                .timeWindow(Time.hours(1), Time.seconds(5))
                .aggregate( new MarketingStatisticsAgg(), new MarketingStatisticsResult() );
        resultStream.print();
        env.execute("app marketing by channel job");
    }
    public static class MarketingStatisticsAgg implements AggregateFunction<Tuple2<String, Long>, Long, Long>{
        @Override
        public Long createAccumulator() {
            return 0L;
        }
        @Override
        public Long add(Tuple2<String, Long> value, Long accumulator) {
            return accumulator + 1;
        }
        @Override
        public Long getResult(Long accumulator) {
            return accumulator;
        }
        @Override
        public Long merge(Long a, Long b) {
            return a + b;
        }
    }
    public static class MarketingStatisticsResult implements WindowFunction<Long, ChannelPromotionCount, Tuple, TimeWindow>{
        @Override
        public void apply(Tuple tuple, TimeWindow window, Iterable<Long> input, Collector<ChannelPromotionCount> out) throws Exception {
            String windowEnd = new Timestamp( window.getEnd() ).toString();
            Long count = input.iterator().next();
            out.collect(new ChannelPromotionCount("total", "total", windowEnd, count));
        }
    }
}
```

**测试记录:**

## 2.6 黑名单过滤

**代码:**

```java
package com.zqs.flink.project.market_analysis;
/**
 * @remark Ad Statistics By Province
 */
import com.zqs.flink.project.market_analysis.beans.AdClickEvent;
import com.zqs.flink.project.market_analysis.beans.AdCountViewByProvince;
import com.zqs.flink.project.market_analysis.beans.BlackListUserWarning;
import org.apache.flink.api.common.functions.AggregateFunction;
import org.apache.flink.api.common.state.ValueState;
import org.apache.flink.api.common.state.ValueStateDescriptor;
import org.apache.flink.api.java.tuple.Tuple;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.TimeCharacteristic;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.KeyedProcessFunction;
import org.apache.flink.streaming.api.functions.timestamps.AscendingTimestampExtractor;
import org.apache.flink.streaming.api.functions.windowing.WindowFunction;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.streaming.api.windowing.windows.TimeWindow;
import org.apache.flink.util.Collector;
import org.apache.flink.util.OutputTag;
import sun.awt.SunHints;
import java.net.URL;
import java.sql.Timestamp;
public class AdStatisticsByProvince {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setStreamTimeCharacteristic(TimeCharacteristic.EventTime);
        env.setParallelism(1);
        // 1. 从文件中读取数据
        URL resource = AdStatisticsByProvince.class.getResource("/AdClickLog.csv");
        DataStream<AdClickEvent> adClickEventStream = env.readTextFile(resource.getPath())
                .map( line -> {
                    String[] fields = line.split(",");
                    return new AdClickEvent(new Long(fields[0]), new Long(fields[1]), fields[2], fields[3], new Long(fields[4]));
                })
                .assignTimestampsAndWatermarks(new AscendingTimestampExtractor<AdClickEvent>() {
                    @Override
                    public long extractAscendingTimestamp(AdClickEvent element) {
                        return element.getTimestamp() * 1000L;
                    }
                });
        // 2. 对同一个用户点击同一个广告的行为进行检测预警
        SingleOutputStreamOperator<AdClickEvent> filterAdClickStream = adClickEventStream
                .keyBy("userId", "adId")        // 基于用户id和广告id做分组
                .process(new FilterBlackListUser(100));
        // 3. 基于省份分组，开窗聚合
        SingleOutputStreamOperator<AdCountViewByProvince> adCountResultStream = filterAdClickStream
                .keyBy(AdClickEvent::getProvince)
                .timeWindow(Time.hours(1), Time.minutes(5))
                .aggregate(new AdCountAgg(), new AdCountResult());
        adCountResultStream.print();
        filterAdClickStream.getSideOutput(new OutputTag<BlackListUserWarning>("blacklist"){
     }).print("blacklist-user");
        env.execute("ad count by province job");
    }
    public static class AdCountAgg implements AggregateFunction<AdClickEvent, Long, Long>{
        @Override
        public Long createAccumulator() {
            return 0L;
        }
        @Override
        public Long add(AdClickEvent value, Long accumulator) {
            return accumulator + 1;
        }
        @Override
        public Long getResult(Long accumulator) {
            return accumulator + 1;
        }
        @Override
        public Long merge(Long a, Long b) {
            return a + b;
        }
    }
    public static class AdCountResult implements WindowFunction<Long, AdCountViewByProvince, String, TimeWindow>{
        @Override
        public void apply(String province, TimeWindow window, Iterable<Long> input, Collector<AdCountViewByProvince> out) throws Exception {
            String windowEnd = new Timestamp( window.getEnd()).toString();
            Long count = input.iterator().next();
            out.collect( new AdCountViewByProvince(province, windowEnd, count));
        }
    }
    // 实现自定义处理函数
    public static class FilterBlackListUser extends KeyedProcessFunction<Tuple, AdClickEvent, AdClickEvent>{
        // 定义属性值:  点击次数上限
        private Integer countUpperBound;
        public FilterBlackListUser(Integer countUpperBound){
            this.countUpperBound = countUpperBound;
        }
        // 定义状态, 保存当前用户对某一广告的点击次数
        ValueState<Long> countState;
        // 定义一个标志状态，保存当前用户是否已经被发送到黑名单
        ValueState<Boolean> isSentState;
        @Override
        public void open(Configuration parameters) throws Exception {
            countState = getRuntimeContext().getState(new ValueStateDescriptor<Long>("ad-count", Long.class, 0L));
            isSentState = getRuntimeContext().getState(new ValueStateDescriptor<Boolean>("is-sent", Boolean.class, false));
        }
        @Override
        public void processElement(AdClickEvent value, Context ctx, Collector<AdClickEvent> out) throws Exception {
            // 判断当前用户对同一广告的点击次数，如果不够上限，就count加1正常输出；如果达到上限，直接过滤掉，并侧输出流输出黑名单报警
            // 首先获取当前的count值
            Long curCount = countState.value();
            // 1. 判断是否是第一个数据，如果是的话，注册一个第二天0点的定时器
            if (curCount == 0){
                Long ts = (ctx.timerService().currentProcessingTime() / (24*60*60*1000) + 1) * (24*60*60*1000) - 8*60*60*1000;
                ctx.timerService().registerProcessingTimeTimer(ts);
            }
            // 2. 判断是否报警
            if (curCount >= countUpperBound){
                // 判断是否输出到黑名单过，如果没有的话就输出到侧输出流
                if (!isSentState.value()){
                    isSentState.update(true);       //  更新状态
                    ctx.output( new OutputTag<BlackListUserWarning>("blacklist"){
     },
                            new BlackListUserWarning(value.getUserId(), value.getAdId(), "click over " + countUpperBound + "times." ));
                }
                return;     // 不再执行下面操作
            }
            // 如果没有返回，点击次数加1，更新状态，正常输出当前数据到主流
            countState.update(curCount + 1);
            out.collect(value);
        }
        @Override
        public void onTimer(long timestamp, OnTimerContext ctx, Collector<AdClickEvent> out) throws Exception {
            // 清空所有状态
            countState.clear();
            isSentState.clear();
        }
    }
}
```

**测试记录:**
