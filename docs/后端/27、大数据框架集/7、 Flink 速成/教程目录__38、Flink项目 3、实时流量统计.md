# 38、Flink项目 3、实时流量统计
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/2/38.html
- 分类：大数据框架
- 分组：教程目录
## 一、项目概述

## 1.1 模块创建和数据准备

新建一个NetworkFlowAnalysis的package。

将apache 服务器的日志文件 apache.log 复制到资源文件目录 src/main/resources

下，我们将从这里读取数据。

当然， 我们也可以仍然用 UserBehavior.csv 作为数据源， 这时我们分析的就不 是每一次对服务器的访问请求了，而是具体的页面浏览（“pv”） 操作。

## 1.2 基于服务器 log 的热门页面浏览量统计

我们现在要实现的模块是 “ 实时流量统计”。对于一个电商平台而言，用户登 录的入口流量、不同页面的访问流量都是值得分析的重要数据，而这些数据，可以 简单地从 web 服务器的日志中提取出来。

我们在这里先实现“ 热门页面浏览数” 的统计， 也就是读取服务器日志中的每 一行 log， 统计在一段时间内用户访问每一个 url 的次数，然后排序输出显示。

具体做法为： 每隔 5 秒， 输出最近 10 分钟内访问量最多的前 N 个 URL。 可以 看出，这个需求与之前“实时热门商品统计” 非常类似，所以我们完全可以借鉴此 前的代码。

在NetworkFlowAnalysis 下创建 NetworkFlow 类，在 beans 下 定 义 POJO 类 ApacheLogEvent，这是输入的日志数据流；另外还有 UrlViewCount，这是窗口操作 统计的输出数据类型。在 main 函数中创建 StreamExecutionEnvironment 并做配置， 然后从 apache.log 文件中读取数据， 并包装成 ApacheLogEvent 类型。

需要注意的是， 原始日志中的时间是“ dd/MM/yyyy:HH:mm:ss” 的形式， 需要 定义一个 DateTimeFormat 将其转换为我们需要的时间戳格式：

```java
.map( line -> {
String[] fields = line.split(" "); SimpleDateFormat simpleDateFormat = new
SimpleDateFormat("dd/MM/yyyy:HH:mm:ss");
Long timestamp = simpleDateFormat.parse(fields[3]).getTime();
return new ApacheLogEvent(fields[0], fields[1], timestamp, fields[5], fields[6]);
} )
```

## 二、pom文件配置

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

## 三、代码

## 3.1 POJO类

ApacheLogEvent

```java
package com.zqs.flink.project.networkflowanalysis.beans;
public class ApacheLogEvent {
    private String ip;
    private String userId;
    private Long timestamp;
    private String method;
    private String url;
    public ApacheLogEvent(){
    }
    public ApacheLogEvent(String ip, String userId, Long timestamp, String method, String url) {
        this.ip = ip;
        this.userId = userId;
        this.timestamp = timestamp;
        this.method = method;
        this.url = url;
    }
    public String getIp() {
        return ip;
    }
    public String getUserId() {
        return userId;
    }
    public Long getTimestamp() {
        return timestamp;
    }
    public String getMethod() {
        return method;
    }
    public String getUrl() {
        return url;
    }
    public void setIp(String ip) {
        this.ip = ip;
    }
    public void setUserId(String userId) {
        this.userId = userId;
    }
    public void setTimestamp(Long timestamp) {
        this.timestamp = timestamp;
    }
    public void setMethod(String method) {
        this.method = method;
    }
    public void setUrl(String url) {
        this.url = url;
    }
    @Override
    public String toString() {
        return "ApacheLogEvent{" +
                "ip='" + ip + '\'' +
                ", userId='" + userId + '\'' +
                ", timestamp=" + timestamp +
                ", method='" + method + '\'' +
                ", url='" + url + '\'' +
                '}';
    }
}
```

PageViewCount

```java
package com.zqs.flink.project.networkflowanalysis.beans;
public class PageViewCount {
    private String url;
    private Long windowEnd;
    private Long count;
    public PageViewCount(){
    }
    public PageViewCount(String url, Long windowEnd, Long count) {
        this.url = url;
        this.windowEnd = windowEnd;
        this.count = count;
    }
    public String getUrl() {
        return url;
    }
    public void setUrl(String url) {
        this.url = url;
    }
    public Long getWindowEnd() {
        return windowEnd;
    }
    public void setWindowEnd(Long windowEnd) {
        this.windowEnd = windowEnd;
    }
    public Long getCount() {
        return count;
    }
    public void setCount(Long count) {
        this.count = count;
    }
    @Override
    public String toString() {
        return "PageViewCount{" +
                "url='" + url + '\'' +
                ", windowEnd=" + windowEnd +
                ", count=" + count +
                '}';
    }
}
```

UserBehavior

```java
package com.zqs.flink.project.networkflowanalysis.beans;
public class UserBehavior {
    // 定义私有属性
    private Long userId;
    private Long itemId;
    private Integer categoryId;
    private String behavior;
    private Long timestamp;
    public UserBehavior() {
    }
    public UserBehavior(Long userId, Long itemId, Integer categoryId, String behavior, Long timestamp) {
        this.userId = userId;
        this.itemId = itemId;
        this.categoryId = categoryId;
        this.behavior = behavior;
        this.timestamp = timestamp;
    }
    public Long getUserId() {
        return userId;
    }
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    public Long getItemId() {
        return itemId;
    }
    public void setItemId(Long itemId) {
        this.itemId = itemId;
    }
    public Integer getCategoryId() {
        return categoryId;
    }
    public void setCategoryId(Integer categoryId) {
        this.categoryId = categoryId;
    }
    public String getBehavior() {
        return behavior;
    }
    public void setBehavior(String behavior) {
        this.behavior = behavior;
    }
    public Long getTimestamp() {
        return timestamp;
    }
    public void setTimestamp(Long timestamp) {
        this.timestamp = timestamp;
    }
    @Override
    public String toString() {
        return "UserBehavior{" +
                "userId=" + userId +
                ", itemId=" + itemId +
                ", categoryId=" + categoryId +
                ", behavior='" + behavior + '\'' +
                ", timestamp=" + timestamp +
                '}';
    }
}
```

## 3.2 热门页面

**代码:**

HotPages

```java
package com.zqs.flink.project.networkflowanalysis;
import akka.protobuf.ByteString;
import com.zqs.flink.project.networkflowanalysis.beans.ApacheLogEvent;
import com.zqs.flink.project.networkflowanalysis.beans.PageViewCount;
import org.apache.flink.api.common.functions.AggregateFunction;
import org.apache.flink.api.common.state.ListState;
import org.apache.flink.api.common.state.ListStateDescriptor;
import org.apache.flink.api.common.state.MapState;
import org.apache.flink.api.common.state.MapStateDescriptor;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.shaded.guava18.com.google.common.collect.Lists;
import org.apache.flink.streaming.api.TimeCharacteristic;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.KeyedProcessFunction;
import org.apache.flink.streaming.api.functions.timestamps.BoundedOutOfOrdernessTimestampExtractor;
import org.apache.flink.streaming.api.functions.windowing.WindowFunction;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.streaming.api.windowing.windows.TimeWindow;
import org.apache.flink.util.Collector;
import org.apache.flink.util.OutputTag;
import java.net.URL;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Map;
import java.util.regex.Pattern;
/**
 * @remark  热门页面
 */
public class HotPages {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setStreamTimeCharacteristic(TimeCharacteristic.EventTime);
        env.setParallelism(1);
        //读取文件
        URL resource = HotPages.class.getResource("/apache.log");
        DataStream<String> inputStream = env.readTextFile(resource.getPath());
        DataStream<ApacheLogEvent> dataStream = inputStream
                .map(line -> {
                    String[] fields = line.split(" ");
                    SimpleDateFormat simpleDateFormat = new SimpleDateFormat("dd/MM/yyyy:HH:mm:ss");
                    Long timestamp = simpleDateFormat.parse(fields[3]).getTime();
                    return new ApacheLogEvent(fields[0], fields[1], timestamp, fields[5], fields[6]);
                })
                .assignTimestampsAndWatermarks(new BoundedOutOfOrdernessTimestampExtractor<ApacheLogEvent>(Time.seconds(1)) {
                    @Override
                    public long extractTimestamp(ApacheLogEvent element) {
                        return element.getTimestamp();
                    }
                });
        dataStream.print("data");
        // 分组开窗聚合
        // 定义一个侧输出流标签
        OutputTag<ApacheLogEvent> lateTag = new OutputTag<ApacheLogEvent>("late"){
     };
        SingleOutputStreamOperator<PageViewCount> windowAggStream = dataStream
                .filter(data -> "GET".equals(data.getMethod()))     // 过滤get请求
                .filter(data -> {
                    String regex = "^((?!\\.(css|js|png|ico)$).)*$";
                    return Pattern.matches(regex, data.getUrl());
                })
                .keyBy(ApacheLogEvent:: getUrl)     //  按照url分组
                .timeWindow(Time.minutes(10), Time.seconds(5))
                .allowedLateness(Time.minutes(1))
                .sideOutputLateData(lateTag)
                .aggregate(new PageCountAgg(), new PageCountResult());
        windowAggStream.print("agg");
        windowAggStream.getSideOutput(lateTag).print("late");
        // 收集同一窗口count数据，排序输出
        DataStream<String> resultStream = windowAggStream
                .keyBy(PageViewCount::getWindowEnd)
                .process(new TopNHotPages(3));
        resultStream.print();
        env.execute("hot pages job");
    }
    // 自定义聚合函数
    public static class PageCountAgg implements AggregateFunction<ApacheLogEvent, Long, Long> {
        @Override
        public Long createAccumulator() {
            return 0L;
        }
        @Override
        public Long add(ApacheLogEvent value, Long accumulator) {
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
    // 实现自定义的窗口函数
    public static class PageCountResult implements WindowFunction<Long, PageViewCount, String, TimeWindow>{
        @Override
        public void apply(String url, TimeWindow window, Iterable<Long> input, Collector<PageViewCount> out) throws Exception {
            out.collect(new PageViewCount(url, window.getEnd(), input.iterator().next() ));
        }
    }
    // 实现自定义的处理函数
    public static class TopNHotPages extends KeyedProcessFunction<Long, PageViewCount, String>{
        private Integer topSize;
        public TopNHotPages(Integer topSize){
            this.topSize = topSize;
        }
        // 定义状态，保存当前所有pageViewCount到Map中
        MapState<String, Long> pageViewCountMapState;
        @Override
        public void open(Configuration parameters) throws Exception {
            pageViewCountMapState = getRuntimeContext().getMapState(new MapStateDescriptor<String, Long>("page-count-map", String.class, Long.class));
        }
        @Override
        public void processElement(PageViewCount value, Context ctx, Collector<String> out) throws Exception {
            pageViewCountMapState.put(value.getUrl(), value.getCount());
            ctx.timerService().registerEventTimeTimer(value.getWindowEnd() + 1);
            // 注册一个1分钟之后的定时器,用来清空状态
            ctx.timerService().registerEventTimeTimer(value.getWindowEnd() + 60 + 1000L);
        }
        @Override
        public void onTimer(long timestamp, OnTimerContext ctx, Collector<String> out) throws Exception {
            // 先判断是否到了窗口关闭清理时间,如果是,直接清空状态返回
            if ( timestamp == ctx.getCurrentKey() + 60 * 1000L ){
                pageViewCountMapState.clear();
                return;
            }
            ArrayList<Map.Entry<String, Long>> pageViewCounts = Lists.newArrayList(pageViewCountMapState.entries());
            pageViewCounts.sort(new Comparator<Map.Entry<String, Long>>() {
                @Override
                public int compare(Map.Entry<String, Long> o1, Map.Entry<String, Long> o2) {
                    if(o1.getValue() > o2.getValue())
                        return -1;
                    else if(o1.getValue() < o2.getValue())
                        return 1;
                    else
                        return 0;
                }
            });
            // 格式化成String输出
            StringBuilder resultBuilder = new StringBuilder();
            resultBuilder.append("=================================================\n");
            resultBuilder.append("窗口结束时间:").append(new Timestamp(timestamp -1)).append("\n");
            // 遍历列表，取top n输出
            for (int i = 0; i < Math.min(topSize, pageViewCounts.size()); i++){
                Map.Entry<String, Long> currentItemViewCount = pageViewCounts.get(i);
                resultBuilder.append("NO ").append(i + 1).append(":")
                        .append(" 页面URL = ").append(currentItemViewCount.getKey())
                        .append(" 浏览量 = ").append(currentItemViewCount.getValue())
                        .append("\n");
            }
            resultBuilder.append("======================================\n\n");
            // 控制输出频率
            Thread.sleep(1000L);
            out.collect(resultBuilder.toString());
        }
    }
}
```

**测试记录:**

## 3.3 页面访问量

**代码:**

PageView

```java
package com.zqs.flink.project.networkflowanalysis;
import com.zqs.flink.project.networkflowanalysis.beans.UserBehavior;
import com.zqs.flink.project.networkflowanalysis.beans.PageViewCount;
import org.apache.flink.api.common.functions.AggregateFunction;
import org.apache.flink.api.common.functions.MapFunction;
import org.apache.flink.api.common.state.ValueState;
import org.apache.flink.api.common.state.ValueStateDescriptor;
import org.apache.flink.api.java.tuple.Tuple;
import org.apache.flink.api.java.tuple.Tuple2;
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
import java.net.URL;
import java.util.Random;
/**
 * @remark  page view 统计
 */
public class PageView {
    public static void main(String[] args) throws Exception{
        // 1.创建执行环境
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(4);
        env.setStreamTimeCharacteristic(TimeCharacteristic.EventTime);
        // 2. 读取数据, 创建DataStream
        URL resource = PageView.class.getResource("/UserBehavior.csv");
        DataStream<String> inputStream = env.readTextFile(resource.getPath());
        // 3. 转换为POJO， 分配时间戳和watermark
        DataStream<UserBehavior> dataStream = inputStream
                .map(line -> {
                    String[] fields = line.split(",");
                    return new UserBehavior(new Long(fields[0]), new Long(fields[1]), new Integer(fields[2]), fields[3], new Long(fields[4]));
                })
                .assignTimestampsAndWatermarks(new AscendingTimestampExtractor<UserBehavior>() {
                    @Override
                    public long extractAscendingTimestamp(UserBehavior element) {
                        return element.getTimestamp() * 1000L;
                    }
                });
        // 4. 分组开窗聚合，得到每个窗口内各个商品的count值
        SingleOutputStreamOperator<Tuple2<String, Long>> pvResultStream0 =
                dataStream
                .filter(data -> "pv".equals(data.getBehavior()))        //  过滤pv行为
                .map(new MapFunction<UserBehavior, Tuple2<String, Long>>() {
                    @Override
                    public Tuple2<String, Long> map(UserBehavior value) throws Exception {
                        return new Tuple2<>("pv", 1L);
                    }
                })
                .keyBy(0)   //  按商品分组
                .timeWindow(Time.hours(1))      // 开1小时滚动窗口
                .sum(1);
        // 并行任务改进， 设计随机key，解决数据倾斜问题
        SingleOutputStreamOperator<PageViewCount> pvStream = dataStream.filter(data -> "pv".equals(data.getBehavior()))
                .map(new MapFunction<UserBehavior, Tuple2<Integer, Long>>() {
                    @Override
                    public Tuple2<Integer, Long>  map(UserBehavior value) throws Exception {
                        Random random = new Random();
                        return new Tuple2<>(random.nextInt(10), 1L);
                    }
                })
                .keyBy(data -> data.f0)
                .timeWindow(Time.hours(1))
                .aggregate(new PvCountAgg(), new PvCountResult());
        // 将各分区数据汇总起来
        DataStream<PageViewCount> pvResultStream = pvStream
                .keyBy(PageViewCount::getWindowEnd)
                .process(new TotalPvCount());
        pvResultStream.print();
        env.execute("pv count job");
    }
    // 实现自定义预聚合函数
    public static class PvCountAgg implements AggregateFunction<Tuple2<Integer, Long>, Long, Long>{
        @Override
        public Long createAccumulator() {
            return 0L;
        }
        @Override
        public Long add(Tuple2<Integer, Long> value, Long accumulator) {
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
    // 实现自定义窗口
    public static class PvCountResult implements WindowFunction<Long, PageViewCount, Integer, TimeWindow>{
        @Override
        public void apply(Integer integer, TimeWindow window, Iterable<Long> input, Collector<PageViewCount> out) throws Exception {
            out.collect( new PageViewCount(integer.toString(), window.getEnd(), input.iterator().next()));
        }
    }
    //  实现自定义处理函数,把相同窗口分组统计的count值叠加
    public static class TotalPvCount extends KeyedProcessFunction<Long, PageViewCount, PageViewCount>{
        // 定义状态， 保存当前的总Count值
        ValueState<Long> totalCountState;
        @Override
        public void open(Configuration parameters) throws Exception {
            totalCountState = getRuntimeContext().getState(new ValueStateDescriptor<Long>("total-count", Long.class, 0L));
        }
        @Override
        public void processElement(PageViewCount value, Context ctx, Collector<PageViewCount> out) throws Exception {
            totalCountState.update( totalCountState.value() + value.getCount() );
            ctx.timerService().registerEventTimeTimer(value.getWindowEnd() + 1);
        }
        @Override
        public void onTimer(long timestamp, OnTimerContext ctx, Collector<PageViewCount> out) throws Exception {
            // 定时器出发, 所有分组count值都到齐, 直接输出当前的总count值
            Long totalCount = totalCountState.value();
            out.collect(new PageViewCount("pv", ctx.getCurrentKey(), totalCount));
            // 清空状态
            totalCountState.clear();
        }
    }
}
```

**测试记录:**

## 3.4 页面独立访问量

**代码:**

UniqueVisitor

```java
package com.zqs.flink.project.networkflowanalysis;
/**
 * @remark  unique page view 统计
 */
import com.zqs.flink.project.networkflowanalysis.beans.UserBehavior;
import com.zqs.flink.project.networkflowanalysis.beans.PageViewCount;
import org.apache.flink.streaming.api.TimeCharacteristic;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.timestamps.AscendingTimestampExtractor;
import org.apache.flink.streaming.api.functions.windowing.AllWindowFunction;
import org.apache.flink.streaming.api.functions.windowing.WindowFunction;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.streaming.api.windowing.windows.TimeWindow;
import org.apache.flink.util.Collector;
import java.net.URL;
import java.util.HashSet;
public class UniqueVisitor {
    public static void main(String[] args) throws Exception {
        // 1. 创建执行环境
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        env.setStreamTimeCharacteristic(TimeCharacteristic.EventTime);
        // 2. 读取数据， 创建DataStream
        URL resource = UniqueVisitor.class.getResource("/UserBehavior.csv");
        DataStream<String> inputStream = env.readTextFile(resource.getPath());
        // 3. 转换为POJO, 分配时间戳和watermark
        DataStream<UserBehavior> dataStream = inputStream
                .map(line -> {
                    String[] fields = line.split(",");
                    return new UserBehavior(new Long(fields[0]), new Long(fields[1]), new Integer(fields[2]), fields[3], new Long(fields[4]));
                })
                .assignTimestampsAndWatermarks(new AscendingTimestampExtractor<UserBehavior>() {
                    @Override
                    public long extractAscendingTimestamp(UserBehavior element) {
                        return element.getTimestamp() * 1000L;
                    }
                });
        // 开窗统计uv值
        SingleOutputStreamOperator<PageViewCount> uvStream = dataStream.filter(data -> "pv".equals(data.getBehavior()))
                .timeWindowAll(Time.hours(1))
                .apply(new UvCountResult());
        uvStream.print();
        env.execute("uv count job");
    }
    // 实现自定义全窗口函数
    public static class UvCountResult implements AllWindowFunction<UserBehavior, PageViewCount, TimeWindow>{
        @Override
        public void apply(TimeWindow window, Iterable<UserBehavior> values, Collector<PageViewCount> out) throws Exception {
            // 定义一个Set结构，保存窗口中所有的userId,自动去重
            HashSet<Long> uidSet = new HashSet<>();
            for (UserBehavior ub: values)
                uidSet.add(ub.getUserId());
            out.collect( new PageViewCount("uv", window.getEnd(), (long)uidSet.size()));
        }
    }
}
```

**测试记录:**

## 3.5 布隆过滤器实现独立访问量

**代码:**

UvWithBloomFilter

```java
package com.zqs.flink.project.networkflowanalysis;
/**
 * @remark  unique page view 布隆过滤器
 */
import com.zqs.flink.project.networkflowanalysis.beans.UserBehavior;
import com.zqs.flink.project.networkflowanalysis.beans.PageViewCount;
// import kafka.server.DynamicConfig;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.TimeCharacteristic;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.timestamps.AscendingTimestampExtractor;
import org.apache.flink.streaming.api.functions.windowing.ProcessAllWindowFunction;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.streaming.api.windowing.triggers.Trigger;
import org.apache.flink.streaming.api.windowing.triggers.TriggerResult;
import org.apache.flink.streaming.api.windowing.windows.TimeWindow;
import org.apache.flink.util.Collector;
import redis.clients.jedis.Jedis;
import java.net.URL;
public class UvWithBloomFilter {
    public static void main(String[] args) throws Exception {
        // 1. 创建执行环境
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        env.setStreamTimeCharacteristic(TimeCharacteristic.EventTime);
        // 2. 读取数据，创建DataStream
        URL resource = UniqueVisitor.class.getResource("/UserBehavior.csv");
        DataStream<String> inputStream = env.readTextFile(resource.getPath());
        // 3. 转换为POJO，分配时间戳和watermark
        DataStream<UserBehavior> dataStream = inputStream
                .map(line -> {
                    String[] fields = line.split(",");
                    return new UserBehavior(new Long(fields[0]), new Long(fields[1]), new Integer(fields[2]), fields[3], new Long(fields[4]));
                })
                .assignTimestampsAndWatermarks(new AscendingTimestampExtractor<UserBehavior>() {
                    @Override
                    public long extractAscendingTimestamp(UserBehavior element) {
                        return element.getTimestamp() * 1000L;
                    }
                });
        // 开窗统计uv值
        SingleOutputStreamOperator<PageViewCount> uvStream = dataStream
                .filter(data -> "pv".equals(data.getBehavior()))
                .timeWindowAll(Time.hours(1))
                .trigger( new MyTrigger() )
                .process( new UvCountResultWithBloomFliter() );
        uvStream.print();
        env.execute("uv count with bloom filter job");
    }
    // 自定义触发器
    public static class MyTrigger extends Trigger<UserBehavior, TimeWindow>{
        @Override
        public TriggerResult onElement(UserBehavior element, long timestamp, TimeWindow window, TriggerContext ctx) throws Exception {
            // 每一条数据来到, 直接触发窗口计算,并且直接清空窗口
            return TriggerResult.FIRE_AND_PURGE;
        }
        @Override
        public TriggerResult onProcessingTime(long time, TimeWindow window, TriggerContext ctx) throws Exception {
            return TriggerResult.CONTINUE;
        }
        @Override
        public TriggerResult onEventTime(long time, TimeWindow window, TriggerContext ctx) throws Exception {
            return TriggerResult.CONTINUE;
        }
        @Override
        public void clear(TimeWindow window, TriggerContext ctx) throws Exception {
        }
    }
    // 自定义一个布隆过滤器
    public static class MyBloomFilter {
        // 定义位图的大小,一般需要定义为2的整次幂
        private Integer cap;
        public MyBloomFilter(Integer cap){
            this.cap = cap;
        }
        // 实现一个hash函数
        public Long hashCode(String value, Integer seed){
            Long result = 0l;
            for (int i = 0; i < value.length(); i++){
                result = result * seed + value.charAt(i);
            }
            return result & (cap - 1);
        }
    }
    // 实现自定义的处理函数
    public static class UvCountResultWithBloomFliter extends ProcessAllWindowFunction<UserBehavior, PageViewCount, TimeWindow>{
        // 定义jedis连接和布隆过滤器
        Jedis jedis;
        MyBloomFilter myBloomFilter;
        @Override
        public void open(Configuration parameters) throws Exception {
            jedis = new Jedis("10.31.1.122", 6379);
            myBloomFilter = new MyBloomFilter(1 << 29);     // 要处理1亿个数据，用64MB大小的位图
        }
        @Override
        public void process(Context context, Iterable<UserBehavior> elements, Collector<PageViewCount> out) throws Exception {
            // 将位图和窗口count值全部存入redis，用windowEnd作为key
            Long windowEnd = context.window().getEnd();
            String bitmapKey = windowEnd.toString();
            // 把count值存成一张hash表
            String countHashName = "uv_count";
            String countKey = windowEnd.toString();
            // 1. 取当前的userId
            Long userId = elements.iterator().next().getUserId();
            // 2. 计算位图中的offset
            Long offset = myBloomFilter.hashCode(userId.toString(), 61);
            // 3. 用redis的getbit命令，判断对应位置的值
            Boolean isExist = jedis.getbit(bitmapKey, offset);
            if ( !isExist ){
                // 如果不存在，对应位图的位置置1
                jedis.setbit(bitmapKey, offset, true);
                // 更新redis中保存的count值
                Long uvCount = 0L;  // 初始count值
                String uvCountString = jedis.hget(countHashName, countKey);
                if ( uvCountString != null && !"".equals(uvCountString) )
                    uvCount = Long.valueOf(uvCountString);
                jedis.hset(countHashName, countKey, String.valueOf(uvCount + 1));
                out.collect(new PageViewCount("uv", windowEnd, uvCount + 1));
            }
        }
        @Override
        public void close() throws Exception {
            super.close();
        }
    }
}
```

**测试记录:**
