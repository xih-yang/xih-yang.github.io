# 41、Flink项目 6、订单支付实时监控
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/2/41.html
- 分类：大数据框架
- 分组：教程目录
## 一、项目概述

## 1.1 订单支付实时监控

**基本需求**

**1、** 用户下单之后，应设置订单失效时间，以提高用户支付的意愿，并降低系统风险；

**2、** 用户下单后15分钟未支付，则输出监控信息；

**解决思路**

**1、** 利用CEP库进行事件流的模式匹配，并设定匹配的时间间隔；

**2、** 也可以利用状态编程，用processfunction实现处理逻辑；

## 1.2 订单支付实时对账

**基本需求**

**1、** 用户下单并支付后，应查询到账信息，进行实时对账；

**2、** 如果有不匹配的支付信息或者到账信息，输出提示信息；

**解决思路**

**1、** 从两条流中分别读取订单支付信息和到账信息，合并处理；

**2、** 用connect连接合并两条流，用coProcessFunction做匹配处理；

## 二、 代码

## 2.1 pom文件配置

pom文件配置如下:

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
    <dependency>
      <groupId>org.apache.flink</groupId>
      <artifactId>flink-cep_2.11</artifactId>
      <version>1.10.1</version>
    </dependency>
```

## 2.2 POJO类

OrderEvent

```java
    private Long orderId;
    private String eventType;
    private String txId;
    private Long timestamp;
```

ReceiptEvent

```java
    private String txId;
    private String payChannel;
    private Long timestamp;
```

OrderResult

```java
    private Long orderId;
    private String resultState;
```

## 2.3 订单支付超时监控-CEP

**代码:**

```java
package com.zqs.flink.project.orderpay_detect;
/**
 * @remark 订单支付超时监控
 */
import com.zqs.flink.project.orderpay_detect.beans.OrderEvent;
import com.zqs.flink.project.orderpay_detect.beans.OrderResult;
import org.apache.flink.cep.CEP;
import org.apache.flink.cep.PatternSelectFunction;
import org.apache.flink.cep.PatternStream;
import org.apache.flink.cep.PatternTimeoutFunction;
import org.apache.flink.cep.pattern.Pattern;
import org.apache.flink.cep.pattern.conditions.SimpleCondition;
import org.apache.flink.streaming.api.TimeCharacteristic;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.timestamps.AscendingTimestampExtractor;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.util.OutputTag;
import java.net.URL;
import java.util.List;
import java.util.Map;
public class OrderPayTimeout {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setStreamTimeCharacteristic(TimeCharacteristic.EventTime);
        env.setParallelism(1);
        // 读取数据并转换成POJO类型
        URL resource = OrderPayTimeout.class.getResource("/OrderLog.csv");
        DataStream<OrderEvent> orderEventStream = env.readTextFile(resource.getPath())
                .map( line -> {
                    String[] fields = line.split(",");
                    return new OrderEvent(new Long(fields[0]), fields[1], fields[2], new Long(fields[3]));
                } )
                .assignTimestampsAndWatermarks(new AscendingTimestampExtractor<OrderEvent>() {
                    @Override
                    public long extractAscendingTimestamp(OrderEvent element) {
                        return element.getTimestamp() * 1000L;
                    }
                });
        // 1. 定义一个带时间限制的模式
        Pattern<OrderEvent, OrderEvent> orderPayPattern = Pattern
                .<OrderEvent>begin("create").where(new SimpleCondition<OrderEvent>() {
                    @Override
                    public boolean filter(OrderEvent value) throws Exception {
                        return "create".equals(value.getEventType());
                    }
                })
                .followedBy("pay").where(new SimpleCondition<OrderEvent>() {
                    @Override
                    public boolean filter(OrderEvent value) throws Exception {
                        return "pay".equals(value.getEventType());
                    }
                })
                .within(Time.minutes(15));
        // 2. 定义侧输出流标签， 用来表示超时事件
        OutputTag<OrderResult> orderTimeoutTag = new OutputTag<OrderResult>("order-timeout"){
     };
        // 3. 将pattern应用到输入数据流上， 得到pattern stream
        PatternStream<OrderEvent> patternStream = CEP.pattern(orderEventStream.keyBy(OrderEvent::getOrderId), orderPayPattern);
        // 4. 调用select方法，实现对匹配复杂事件和超时复杂事件的提取和处理
        SingleOutputStreamOperator<OrderResult> resultStream = patternStream
                .select(orderTimeoutTag, new OrderTimeoutSelect(), new OrderPaySelect() );
        resultStream.print("payed normally");
        resultStream.getSideOutput(orderTimeoutTag).print("timeout");
        env.execute("order timeout detect job");
    }
    // 实现自定义的超时事件处理函数
    public static class OrderTimeoutSelect implements PatternTimeoutFunction<OrderEvent, OrderResult>{
        @Override
        public OrderResult timeout(Map<String, List<OrderEvent>> pattern, long timeoutTimestamp) throws Exception {
            Long timeoutOrderId = pattern.get("create").iterator().next().getOrderId();
            return new OrderResult(timeoutOrderId, "timeout " + timeoutTimestamp);
        }
    }
    // 实现自定义的正常匹配事件处理函数
    public static class OrderPaySelect implements PatternSelectFunction<OrderEvent, OrderResult>{
        @Override
        public OrderResult select(Map<String, List<OrderEvent>> pattern) throws Exception {
            Long payedOrderId = pattern.get("pay").iterator().next().getOrderId();
            return new OrderResult(payedOrderId, "payed");
        }
    }
}
```

**测试记录:**

## 2.4 订单支付超时监控-Without CEP

**代码:**

```java
package com.zqs.flink.project.orderpay_detect;
/**
 * @remark 监控超时未支付订单-不使用CEP
 */
import com.zqs.flink.project.orderpay_detect.beans.OrderEvent;
import com.zqs.flink.project.orderpay_detect.beans.OrderResult;
import org.apache.flink.api.common.state.ValueState;
import org.apache.flink.api.common.state.ValueStateDescriptor;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.TimeCharacteristic;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.KeyedProcessFunction;
import org.apache.flink.streaming.api.functions.timestamps.AscendingTimestampExtractor;
import org.apache.flink.util.Collector;
import org.apache.flink.util.OutputTag;
import java.net.URL;
public class OrderTimeoutWithoutCep {
    // 定义超时时间的侧输出流标签
    private final static OutputTag<OrderResult> orderTimeoutTag = new OutputTag<OrderResult>("order-timeout"){
     };
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setStreamTimeCharacteristic(TimeCharacteristic.EventTime);
        env.setParallelism(1);
        // 读取数据并转换成POJO类型
        URL resource = OrderPayTimeout.class.getResource("/OrderLog.csv");
        DataStream<OrderEvent> orderEventStream = env.readTextFile(resource.getPath())
                .map(line -> {
                    String[] fields = line.split(",");
                    return new OrderEvent(new Long(fields[0]), fields[1], fields[2], new Long(fields[3]));
                })
                .assignTimestampsAndWatermarks(new AscendingTimestampExtractor<OrderEvent>() {
                    @Override
                    public long extractAscendingTimestamp(OrderEvent element) {
                        return element.getTimestamp() * 1000L;
                    }
                });
        // 自定义处理函数，主流输出正常匹配订单事件， 侧输出流输出超时报警事件
        SingleOutputStreamOperator<OrderResult> resultStream = orderEventStream
                .keyBy(OrderEvent::getOrderId)
                .process(new OrderPayMatchDetect());
        resultStream.print("payed normally");
        resultStream.getSideOutput(orderTimeoutTag).print("timeout");
        env.execute("order timeout detect without cep job");
    }
    // 实现自定义KeyedProcessFunction
    public static class OrderPayMatchDetect extends KeyedProcessFunction<Long, OrderEvent, OrderResult>{
        // 定义状态， 保存之前点单是否已经来过create、pay事件
        ValueState<Boolean> isPayedState;
        ValueState<Boolean> isCreatedState;
        // 定义状态，保存定时器时间戳
        ValueState<Long> timerTsState;
        @Override
        public void open(Configuration parameters) throws Exception {
            isPayedState = getRuntimeContext().getState(new ValueStateDescriptor<Boolean>("is-payed", Boolean.class, false));
            isCreatedState = getRuntimeContext().getState(new ValueStateDescriptor<Boolean>("is-created", Boolean.class, false));
            timerTsState = getRuntimeContext().getState(new ValueStateDescriptor<Long>("timer-ts", Long.class));
        }
        @Override
        public void processElement(OrderEvent value, Context ctx, Collector<OrderResult> out) throws Exception {
            // 先获取当前装填
            Boolean isPayed = isPayedState.value();
            Boolean isCreated = isCreatedState.value();
            Long timerTs = timerTsState.value();
            // 判断当前事件类型
            if( "create".equals(value.getEventType()) ){
                // 1. 如果来的是create，要判断是否支付过
                if( isPayed ){
                    // 1.1 如果已经正常支付，输出正常匹配结果
                    out.collect(new OrderResult(value.getOrderId(), "payed successfully"));
                    // 清空状态，删除定时器
                    isCreatedState.clear();
                    isPayedState.clear();
                    timerTsState.clear();
                    ctx.timerService().deleteEventTimeTimer(timerTs);
                } else {
                    // 1.2 如果没有支付过，注册15分钟后的定时器，开始等待支付事件
                    Long ts = ( value.getTimestamp() + 15 * 60 ) * 1000L;
                    ctx.timerService().registerEventTimeTimer(ts);
                    // 更新状态
                    timerTsState.update(ts);
                    isCreatedState.update(true);
                }
            } else if( "pay".equals(value.getEventType()) ){
                // 2. 如果来的是pay，要判断是否有下单事件来过
                if( isCreated ){
                    // 2.1 已经有过下单事件，要继续判断支付的时间戳是否超过15分钟
                    if( value.getTimestamp() * 1000L < timerTs ){
                        // 2.1.1 在15分钟内，没有超时，正常匹配输出
                        out.collect(new OrderResult(value.getOrderId(), "payed successfully"));
                    } else {
                        // 2.1.2 已经超时，输出侧输出流报警
                        ctx.output(orderTimeoutTag, new OrderResult(value.getOrderId(), "payed but already timeout"));
                    }
                    // 统一清空状态
                    isCreatedState.clear();
                    isPayedState.clear();
                    timerTsState.clear();
                    ctx.timerService().deleteEventTimeTimer(timerTs);
                } else {
                    // 2.2 没有下单事件，乱序，注册一个定时器，等待下单事件
                    ctx.timerService().registerEventTimeTimer( value.getTimestamp() * 1000L);
                    // 更新状态
                    timerTsState.update(value.getTimestamp() * 1000L);
                    isPayedState.update(true);
                }
            }
        }
        @Override
        public void onTimer(long timestamp, OnTimerContext ctx, Collector<OrderResult> out) throws Exception {
            // 定时器触发， 说明一定有一个事件没来
            if ( isPayedState.value() ){
                // 如果pay来了，说明create没来
                ctx.output(orderTimeoutTag, new OrderResult(ctx.getCurrentKey(), "payed but not found created log "));
            } else {
                // 如果pay没来，支付超时
                ctx.output(orderTimeoutTag, new OrderResult(ctx.getCurrentKey(), "timerout"));
            }
            // 清空状态
            isCreatedState.clear();
            isPayedState.clear();
            timerTsState.clear();
        }
    }
}
```

**测试记录:**

## 2.5 支付账单核对

**代码:**

```java
package com.zqs.flink.project.orderpay_detect;
/**
 * @remak  支付账单核对
 */
import com.zqs.flink.project.orderpay_detect.beans.OrderEvent;
import com.zqs.flink.project.orderpay_detect.beans.ReceiptEvent;
import org.apache.flink.api.common.state.ValueState;
import org.apache.flink.api.common.state.ValueStateDescriptor;
import org.apache.flink.api.java.tuple.Tuple;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.TimeCharacteristic;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.co.CoProcessFunction;
import org.apache.flink.streaming.api.functions.timestamps.AscendingTimestampExtractor;
import org.apache.flink.util.Collector;
import org.apache.flink.util.OutputTag;
import java.net.URL;
public class TxPayMatch {
    // 定义侧输出流标签
    private final static OutputTag<OrderEvent> unmatchedPays = new OutputTag<OrderEvent>("unmatched-pays"){
     };
    private final static OutputTag<ReceiptEvent> unmatchedReceipts = new OutputTag<ReceiptEvent>("unmatched-receipts"){
     };
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setStreamTimeCharacteristic(TimeCharacteristic.EventTime);
        env.setParallelism(1);
        // 读取数据并转换成POJO类型
        // 读取订单支付事件数据
        URL orderResource = TxPayMatch.class.getResource("/OrderLog.csv");
        DataStream<OrderEvent> orderEventStream = env.readTextFile(orderResource.getPath())
                .map( line -> {
                    String[] fields = line.split(",");
                    return new OrderEvent(new Long(fields[0]), fields[1], fields[2], new Long(fields[3]));
                } )
                .assignTimestampsAndWatermarks(new AscendingTimestampExtractor<OrderEvent>() {
                    @Override
                    public long extractAscendingTimestamp(OrderEvent element) {
                        return element.getTimestamp() * 1000L;
                    }
                })
                .filter( data -> !"".equals(data.getTxId()) );    // 交易id不为空，必须是pay事件
        // 读取到账事件数据
        URL receiptResource = TxPayMatch.class.getResource("/ReceiptLog.csv");
        SingleOutputStreamOperator<ReceiptEvent> receiptEventStream = env.readTextFile(receiptResource.getPath())
                .map(line -> {
                    String[] fields = line.split(",");
                    return new ReceiptEvent(fields[0], fields[1], new Long(fields[2]));
                })
                .assignTimestampsAndWatermarks(new AscendingTimestampExtractor<ReceiptEvent>() {
                    @Override
                    public long extractAscendingTimestamp(ReceiptEvent element) {
                        return element.getTimestamp() * 1000L;
                    }
                });
        // 将两条流进行连接合并，进行匹配处理，不匹配的事件输出到侧输出流
        SingleOutputStreamOperator<Tuple2<OrderEvent, ReceiptEvent>> resultStream = orderEventStream
                .keyBy(OrderEvent::getTxId)
                .connect(receiptEventStream.keyBy(ReceiptEvent::getTxId))
                .process(new TxPayMatchDetect());
        resultStream.print("matched-pays");
        resultStream.getSideOutput(unmatchedPays).print("unmatched-pays");
        resultStream.getSideOutput(unmatchedReceipts).print("unmathced-receipts");
        env.execute("tx match detect job");
    }
    // 实现自定义CoProcessFunction
    public static class TxPayMatchDetect extends CoProcessFunction<OrderEvent, ReceiptEvent, Tuple2<OrderEvent, ReceiptEvent>>{
        // 定义状态， 保存当前已经到来的订单支付事件和到账时间
        ValueState<OrderEvent> payState;
        ValueState<ReceiptEvent> receiptState;
        @Override
        public void open(Configuration parameters) throws Exception {
            payState = getRuntimeContext().getState(new ValueStateDescriptor<OrderEvent>("pay", OrderEvent.class));
            receiptState = getRuntimeContext().getState(new ValueStateDescriptor<ReceiptEvent>("receipt", ReceiptEvent.class));
        }
        @Override
        public void processElement1(OrderEvent pay, Context ctx, Collector<Tuple2<OrderEvent, ReceiptEvent>> out) throws Exception {
            // 订单支付事件来了，判断是否已经有对应的到账事件
            ReceiptEvent receipt = receiptState.value();
            if ( receipt != null){
                // 如果receipt不为空， 说明到账事件已经来过， 输出匹配事件，清空状态
                out.collect( new Tuple2<>(pay, receipt));
                payState.clear();
                receiptState.clear();
            } else {
                // 如果receipt没来， 注册一个定时器，开始等待
                ctx.timerService().registerEventTimeTimer((pay.getTimestamp() + 5) * 1000L);  // 等待5秒钟
                // 更新状态
                payState.update(pay);
            }
        }
        @Override
        public void processElement2(ReceiptEvent receipt, Context ctx, Collector<Tuple2<OrderEvent, ReceiptEvent>> out) throws Exception {
            // 到账事件来了，判断是否已经有对应的支付事件
            OrderEvent pay = payState.value();
            if ( pay != null ){
                // 如果pay不为空，说明支付事件已经来过，输出匹配时间，清空状态
                out.collect( new Tuple2<>(pay, receipt));
                payState.clear();
                receiptState.clear();
            } else {
                // 如果pay没来， 注册一个定时器，开始等待
                ctx.timerService().registerEventTimeTimer( (receipt.getTimestamp() + 3) * 1000L );
                // 更新状态
                receiptState.update(receipt);
            }
        }
        @Override
        public void onTimer(long timestamp, OnTimerContext ctx, Collector<Tuple2<OrderEvent, ReceiptEvent>> out) throws Exception {
            // 定时器触发，有可能是有一个事件没来，不匹配，也有可能是都来过了，已经输出并清空状态
            // 判断哪个不为空，那么另一个就没来
            if(payState.value() != null ){
                ctx.output(unmatchedPays, payState.value());
            }
            if (receiptState.value() != null){
                ctx.output(unmatchedReceipts, receiptState.value());
            }
            // 清空状态
            payState.clear();
            receiptState.clear();
        }
    }
}
```

**测试记录:**

## 2.6 账单核对-使用join

**代码:**

```java
package com.zqs.flink.project.orderpay_detect;
/**
 * @remark 账单核对-使用join
 */
import com.zqs.flink.project.orderpay_detect.beans.OrderEvent;
import com.zqs.flink.project.orderpay_detect.beans.ReceiptEvent;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.streaming.api.TimeCharacteristic;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.co.ProcessJoinFunction;
import org.apache.flink.streaming.api.functions.timestamps.AscendingTimestampExtractor;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.util.Collector;
import java.net.URL;
public class TxPayMatchByJoin {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setStreamTimeCharacteristic(TimeCharacteristic.EventTime);
        env.setParallelism(1);
        // 读取数据并转换成POJO类型
        // 读取订单支付事件数据
        URL orderResource = TxPayMatchByJoin.class.getResource("/OrderLog.csv");
        DataStream<OrderEvent> orderEventStream = env.readTextFile(orderResource.getPath())
                .map(line -> {
                    String[] fields = line.split(",");
                    return new OrderEvent(new Long(fields[0]), fields[1], fields[2], new Long(fields[3]));
                })
                .assignTimestampsAndWatermarks(new AscendingTimestampExtractor<OrderEvent>() {
                    @Override
                    public long extractAscendingTimestamp(OrderEvent element) {
                        return element.getTimestamp() * 1000L;
                    }
                })
                .filter(data -> !"".equals(data.getTxId()));    // 交易id不为空，必须是pay事件
        // 读取到账事件数据
        URL receiptResource = TxPayMatchByJoin.class.getResource("/ReceiptLog.csv");
        SingleOutputStreamOperator<ReceiptEvent> receiptEventStream = env.readTextFile(receiptResource.getPath())
                .map(line -> {
                    String[] fields = line.split(",");
                    return new ReceiptEvent(fields[0], fields[1], new Long(fields[2]));
                })
                .assignTimestampsAndWatermarks(new AscendingTimestampExtractor<ReceiptEvent>() {
                    @Override
                    public long extractAscendingTimestamp(ReceiptEvent element) {
                        return element.getTimestamp() * 1000L;
                    }
                });
        // 区间连接两条流, 得到匹配的数据
        SingleOutputStreamOperator<Tuple2<OrderEvent, ReceiptEvent>> resultStream = orderEventStream
                .keyBy(OrderEvent::getTxId)
                .intervalJoin(receiptEventStream.keyBy(ReceiptEvent::getTxId))
                .between(Time.seconds(-3), Time.seconds(5))     // -3,5区间范围
                .process(new TxPayMatchDetectByJoin());
        resultStream.print();
        env.execute("tx pay match by join job");
    }
    // 实现自定义ProcessJoinFunction
    public static class TxPayMatchDetectByJoin extends ProcessJoinFunction<OrderEvent, ReceiptEvent, Tuple2<OrderEvent, ReceiptEvent>>{
        @Override
        public void processElement(OrderEvent left, ReceiptEvent right, Context ctx, Collector<Tuple2<OrderEvent, ReceiptEvent>> out) throws Exception {
            out.collect(new Tuple2<>(left, right));
        }
    }
}
```

**测试记录:**

类似SQL的内连接，只能显示对应上的数据。
