# 46、Flink深入：Flink之TableAPI和FlinkSQL的案例三
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/4/46.html
- 分类：大数据框架
- 分组：教程目录
## 1. 需求

> 使用Flink SQL来统计5秒内 每个用户的 订单总数、订单的最大金额、订单的最小金额
>
> 也就是每隔5秒统计最近5秒的每个用户的订单总数、订单的最大金额、订单的最小金额。
>
> 编码步骤：
>
> 1.创建环境
>
> 2.使用自定义函数模拟实时流数据
>
> 3.设置事件时间和Watermaker
>
> 4.注册表
>
> 5.执行sql-可以使用sql风格或table风格(了解)
>
> 6.输出结果
>
> 7.触发执行

## 2. 方式一

toAppendStream → 将计算后的数据append到结果DataStream中去

toRetractStream → 将计算后的新的数据在DataStream原数据的基础上更新true或是删除false

```java
package com.ddkk.sql;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.source.RichSourceFunction;
import org.apache.flink.table.api.Table;
import org.apache.flink.table.api.bridge.java.StreamTableEnvironment;
import org.apache.flink.types.Row;
import java.time.Duration;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import static org.apache.flink.table.api.Expressions.$;
public class FlinkSQL_Table_Demo04 {
    public static void main(String[] args) throws Exception {
        //1.准备环境
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        StreamTableEnvironment tEnv = StreamTableEnvironment.create(env);
        //2.Source
        DataStreamSource<Order> orderDS  = env.addSource(new RichSourceFunction<Order>() {
            private Boolean isRunning = true;
            @Override
            public void run(SourceContext<Order> ctx) throws Exception {
                Random random = new Random();
                while (isRunning) {
                    Order order = new Order(UUID.randomUUID().toString(), random.nextInt(3), random.nextInt(101), System.currentTimeMillis());
                    TimeUnit.SECONDS.sleep(1);
                    ctx.collect(order);
                }
            }
            @Override
            public void cancel() {
                isRunning = false;
            }
        });
        //3.Transformation
        DataStream<Order> watermakerDS = orderDS
                .assignTimestampsAndWatermarks(
                        WatermarkStrategy.<Order>forBoundedOutOfOrderness(Duration.ofSeconds(2))
                                .withTimestampAssigner((event, timestamp) -> event.getCreateTime())
                );
        //4.注册表
        tEnv.createTemporaryView("t_order", watermakerDS,
                $("orderId"), $("userId"), $("money"), $("createTime").rowtime());
        //5.执行SQL
        String sql = "select " +
                "userId," +
                "count(*) as totalCount," +
                "max(money) as maxMoney," +
                "min(money) as minMoney " +
                "from t_order " +
                "group by userId," +
                "tumble(createTime, interval '5' second)";
        Table ResultTable = tEnv.sqlQuery(sql);
        //6.Sink
        //将SQL的执行结果转换成DataStream再打印出来
        //toAppendStream → 将计算后的数据append到结果DataStream中去
        //toRetractStream  → 将计算后的新的数据在DataStream原数据的基础上更新true或是删除false
        DataStream<Tuple2<Boolean, Row>> resultDS = tEnv.toRetractStream(ResultTable, Row.class);
        resultDS.print();
        env.execute();
    }
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Order {
        private String orderId;
        private Integer userId;
        private Integer money;
        private Long createTime;
    }
}
```

## 3. 方式二

```java
package com.ddkk.sql;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.source.RichSourceFunction;
import org.apache.flink.table.api.Table;
import org.apache.flink.table.api.Tumble;
import org.apache.flink.table.api.bridge.java.StreamTableEnvironment;
import org.apache.flink.types.Row;
import java.time.Duration;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import static org.apache.flink.table.api.Expressions.$;
import static org.apache.flink.table.api.Expressions.lit;
public class FlinkSQL_Table_Demo05 {
    public static void main(String[] args) throws Exception {
        //1.准备环境
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        StreamTableEnvironment tEnv = StreamTableEnvironment.create(env);
        //2.Source
        DataStreamSource<Order> orderDS = env.addSource(new RichSourceFunction<Order>() {
            private Boolean isRunning = true;
            @Override
            public void run(SourceContext<Order> ctx) throws Exception {
                Random random = new Random();
                while (isRunning) {
                    Order order = new Order(UUID.randomUUID().toString(), random.nextInt(3), random.nextInt(101), System.currentTimeMillis());
                    TimeUnit.SECONDS.sleep(1);
                    ctx.collect(order);
                }
            }
            @Override
            public void cancel() {
                isRunning = false;
            }
        });
        //3.Transformation
        DataStream<Order> watermakerDS = orderDS
                .assignTimestampsAndWatermarks(
                        WatermarkStrategy.<Order>forBoundedOutOfOrderness(Duration.ofSeconds(2))
                                .withTimestampAssigner((event, timestamp) -> event.getCreateTime())
                );
        //4.注册表
        tEnv.createTemporaryView("t_order", watermakerDS,
                $("orderId"), $("userId"), $("money"), $("createTime").rowtime());
        //查看表约束
        tEnv.from("t_order").printSchema();
        //5.TableAPI查询
        Table ResultTable = tEnv.from("t_order")
                //.window(Tumble.over("5.second").on("createTime").as("tumbleWindow"))
                .window(Tumble.over(lit(5).second())
                        .on($("createTime"))
                        .as("tumbleWindow"))
                .groupBy($("tumbleWindow"), $("userId"))
                .select(
                        $("userId"),
                        $("userId").count().as("totalCount"),
                        $("money").max().as("maxMoney"),
                        $("money").min().as("minMoney"));
        //6.将SQL的执行结果转换成DataStream再打印出来
        DataStream<Tuple2<Boolean, Row>> resultDS = tEnv.toRetractStream(ResultTable, Row.class);
        resultDS.print();
        //7.excute
        env.execute();
    }
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Order {
        private String orderId;
        private Integer userId;
        private Integer money;
        private Long createTime;
    }
}
```
