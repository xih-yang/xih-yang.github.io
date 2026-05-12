# 52、Flink深入：Flink高级特性之双流Join
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/4/52.html
- 分类：大数据框架
- 分组：教程目录
## 1. 双流Join介绍

介绍文章网址：

[Apache Flink 1.12 Documentation: Joining](https://ci.apache.org/projects/flink/flink-docs-release-1.12/dev/stream/operators/joining.html)

[面试实时开发必问——Flink中如何做流Join呢？ - 知乎](https://zhuanlan.zhihu.com/p/340560908)

[十Flink实现双流join_andy的博客-CSDN博客_flink双流join](https://blog.csdn.net/andyonlines/article/details/108173259)

具体介绍：

Join大体分类只有两种：Window Join和Interval Join。

Window Join又可以根据Window的类型细分出3种：Tumbling Window Join、Sliding Window Join、Session Widnow Join。Windows类型的join都是利用window的机制，先将数据缓存在Window State中，当窗口触发计算时，执行join操作；

interval join也是利用state存储数据再处理，区别在于state中的数据有失效机制，依靠数据触发数据清理；

目前Stream join的结果是数据的笛卡尔积

## 2. Window Join

## 2.1. Tumbling Window Join

执行翻滚窗口联接时，具有公共键和公共翻滚窗口的所有元素将作为成对组合联接，并传递给JoinFunction或FlatJoinFunction。因为它的行为类似于内部连接，所以一个流中的元素在其滚动窗口中没有来自另一个流的元素，因此不会被发射！

如图所示，我们定义了一个大小为2毫秒的翻滚窗口，结果窗口的形式为[0,1]、[2,3]、。。。。该图显示了每个窗口中所有元素的成对组合，这些元素将传递给JoinFunction。注意，在翻滚窗口[6,7]中没有发射任何东西，因为绿色流中不存在与橙色元素⑥和⑦结合的元素。

```java
import org.apache.flink.api.java.functions.KeySelector;
import org.apache.flink.streaming.api.windowing.assigners.TumblingEventTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;
 ...
DataStream<Integer> orangeStream = ...DataStream<Integer> greenStream = ...
orangeStream.join(greenStream)
    .where(<KeySelector>)
    .equalTo(<KeySelector>)
    .window(TumblingEventTimeWindows.of(Time.milliseconds(2)))
    .apply (new JoinFunction<Integer, Integer, String> (){
        @Override
        public String join(Integer first, Integer second) {
            return first + "," + second;
        }
    });
```

## 2.2. Sliding Window Join

在执行滑动窗口联接时，具有公共键和公共滑动窗口的所有元素将作为成对组合联接，并传递给JoinFunction或FlatJoinFunction。在当前滑动窗口中，一个流的元素没有来自另一个流的元素，则不会发射！请注意，某些元素可能会连接到一个滑动窗口中，但不会连接到另一个滑动窗口中！

在本例中，我们使用大小为2毫秒的滑动窗口，并将其滑动1毫秒，从而产生滑动窗口[-1，0]，[0,1]，[1,2]，[2,3]…。x轴下方的连接元素是传递给每个滑动窗口的JoinFunction的元素。在这里，您还可以看到，例如，在窗口[2,3]中，橙色②与绿色③连接，但在窗口[1,2]中没有与任何对象连接。

```java
import org.apache.flink.api.java.functions.KeySelector;
import org.apache.flink.streaming.api.windowing.assigners.SlidingEventTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;
...
DataStream<Integer> orangeStream = ...DataStream<Integer> greenStream = ...
orangeStream.join(greenStream)
    .where(<KeySelector>)
    .equalTo(<KeySelector>)
    .window(SlidingEventTimeWindows.of(Time.milliseconds(2) /* size */, Time.milliseconds(1) /* slide */))
    .apply (new JoinFunction<Integer, Integer, String> (){
        @Override
        public String join(Integer first, Integer second) {
            return first + "," + second;
        }
    });
```

## 2.3. Session Window Join

在执行会话窗口联接时，具有相同键（当“组合”时满足会话条件）的所有元素以成对组合方式联接，并传递给JoinFunction或FlatJoinFunction。同样，这执行一个内部连接，所以如果有一个会话窗口只包含来自一个流的元素，则不会发出任何输出！

在这里，我们定义了一个会话窗口连接，其中每个会话被至少1ms的间隔分割。有三个会话，在前两个会话中，来自两个流的连接元素被传递给JoinFunction。在第三个会话中，绿色流中没有元素，所以⑧和⑨没有连接！

```java
import org.apache.flink.api.java.functions.KeySelector;
import org.apache.flink.streaming.api.windowing.assigners.EventTimeSessionWindows;
import org.apache.flink.streaming.api.windowing.time.Time;
 ...
DataStream<Integer> orangeStream = ...DataStream<Integer> greenStream = ...
orangeStream.join(greenStream)
    .where(<KeySelector>)
    .equalTo(<KeySelector>)
    .window(EventTimeSessionWindows.withGap(Time.milliseconds(1)))
    .apply (new JoinFunction<Integer, Integer, String> (){
        @Override
        public String join(Integer first, Integer second) {
            return first + "," + second;
        }
    });
```

## 3. Interval Join

前面学习的Window Join必须要在一个Window中进行JOIN，那如果没有Window如何处理呢？interval join也是使用相同的key来join两个流（流A、流B），并且流B中的元素中的时间戳，和流A元素的时间戳，有一个时间间隔。

```java
b.timestamp ∈ [a.timestamp + lowerBound; a.timestamp + upperBound] 
or 
a.timestamp + lowerBound <= b.timestamp <= a.timestamp + upperBound
```

也就是：流B的元素的时间戳 ≥ 流A的元素时间戳 + 下界，且，流B的元素的时间戳 ≤ 流A的元素时间戳 + 上界。

在上面的示例中，我们将两个流“orange”和“green”连接起来，其下限为-2毫秒，上限为+1毫秒。默认情况下，这些边界是包含的，但是可以应用.lowerBoundExclusive（）和.upperBoundExclusive来更改行为orangeElem.ts + lowerBound  需求：
>
> 使用两个指定Source模拟数据，一个Source是订单明细，一个Source是商品数据。我们通过window join，将数据关联到一起。

> 思路：
>
> 1、Window Join首先需要使用where和equalTo指定使用哪个key来进行关联，此处我们通过应用方法，基于GoodsId来关联两个流中的元素。
>
> 2、设置5秒的滚动窗口，流的元素关联都会在这个5秒的窗口中进行关联。
>
> 3、apply方法中实现将两个不同类型的元素关联并生成一个新类型的元素。

```java
import com.alibaba.fastjson.JSON;
import lombok.Data;
import org.apache.flink.api.common.eventtime.*;
import org.apache.flink.api.common.typeinfo.TypeInformation;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.source.RichSourceFunction;
import org.apache.flink.streaming.api.windowing.assigners.TumblingEventTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
public class JoinDemo01 {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        // 构建商品数据流
        DataStream<Goods> goodsDS = env.addSource(new GoodsSource11(), TypeInformation.of(Goods.class)).assignTimestampsAndWatermarks(new GoodsWatermark());
        // 构建订单明细数据流
        DataStream<OrderItem> orderItemDS = env.addSource(new OrderItemSource(), TypeInformation.of(OrderItem.class)).assignTimestampsAndWatermarks(new OrderItemWatermark());
        // 进行关联查询
        DataStream<FactOrderItem> factOrderItemDS = orderItemDS.join(goodsDS)
                // 第一个流orderItemDS
                .where(OrderItem::getGoodsId)
                // 第二流goodsDS
                .equalTo(Goods::getGoodsId)
                .window(TumblingEventTimeWindows.of(Time.seconds(5)))
                .apply((OrderItem item, Goods goods) -> {
                    FactOrderItem factOrderItem = new FactOrderItem();
                    factOrderItem.setGoodsId(goods.getGoodsId());
                    factOrderItem.setGoodsName(goods.getGoodsName());
                    factOrderItem.setCount(new BigDecimal(item.getCount()));
                    factOrderItem.setTotalMoney(goods.getGoodsPrice().multiply(new BigDecimal(item.getCount())));
                    return factOrderItem;
                });
        factOrderItemDS.print();
        env.execute("滚动窗口JOIN");
    }
    //商品类
    @Data
    public static class Goods {
        private String goodsId;
        private String goodsName;
        private BigDecimal goodsPrice;
        public static List<Goods> GOODS_LIST;
        public static Random r;
        static  {
            r = new Random();
            GOODS_LIST = new ArrayList<>();
            GOODS_LIST.add(new Goods("1", "小米12", new BigDecimal(4890)));
            GOODS_LIST.add(new Goods("2", "iphone12", new BigDecimal(12000)));
            GOODS_LIST.add(new Goods("3", "MacBookPro", new BigDecimal(15000)));
            GOODS_LIST.add(new Goods("4", "Thinkpad X1", new BigDecimal(9800)));
            GOODS_LIST.add(new Goods("5", "MeiZu One", new BigDecimal(3200)));
            GOODS_LIST.add(new Goods("6", "Mate 40", new BigDecimal(6500)));
        }
        public static Goods randomGoods() {
            int rIndex = r.nextInt(GOODS_LIST.size());
            return GOODS_LIST.get(rIndex);
        }
        public Goods() {
        }
        public Goods(String goodsId, String goodsName, BigDecimal goodsPrice) {
            this.goodsId = goodsId;
            this.goodsName = goodsName;
            this.goodsPrice = goodsPrice;
        }
        @Override
        public String toString() {
            return JSON.toJSONString(this);
        }
    }
    //订单明细类
    @Data
    public static class OrderItem {
        private String itemId;
        private String goodsId;
        private Integer count;
        @Override
        public String toString() {
            return JSON.toJSONString(this);
        }
    }
    //关联结果
    @Data
    public static class FactOrderItem {
        private String goodsId;
        private String goodsName;
        private BigDecimal count;
        private BigDecimal totalMoney;
        @Override
        public String toString() {
            return JSON.toJSONString(this);
        }
    }
    //构建一个商品Stream源（这个好比就是维表）
    public static class GoodsSource11 extends RichSourceFunction {
        private Boolean isCancel;
        @Override
        public void open(Configuration parameters) throws Exception {
            isCancel = false;
        }
        @Override
        public void run(SourceContext sourceContext) throws Exception {
            while(!isCancel) {
                Goods.GOODS_LIST.stream().forEach(goods -> sourceContext.collect(goods));
                TimeUnit.SECONDS.sleep(1);
            }
        }
        @Override
        public void cancel() {
            isCancel = true;
        }
    }
    //构建订单明细Stream源
    public static class OrderItemSource extends RichSourceFunction {
        private Boolean isCancel;
        private Random r;
        @Override
        public void open(Configuration parameters) throws Exception {
            isCancel = false;
            r = new Random();
        }
        @Override
        public void run(SourceContext sourceContext) throws Exception {
            while(!isCancel) {
                Goods goods = Goods.randomGoods();
                OrderItem orderItem = new OrderItem();
                orderItem.setGoodsId(goods.getGoodsId());
                orderItem.setCount(r.nextInt(10) + 1);
                orderItem.setItemId(UUID.randomUUID().toString());
                sourceContext.collect(orderItem);
                orderItem.setGoodsId("111");
                sourceContext.collect(orderItem);
                TimeUnit.SECONDS.sleep(1);
            }
        }
        @Override
        public void cancel() {
            isCancel = true;
        }
    }
    //构建水印分配器（此处为了简单），直接使用系统时间了
    public static class GoodsWatermark implements WatermarkStrategy<Goods> {
        @Override
        public TimestampAssigner<Goods> createTimestampAssigner(TimestampAssignerSupplier.Context context) {
            return (element, recordTimestamp) -> System.currentTimeMillis();
        }
        @Override
        public WatermarkGenerator<Goods> createWatermarkGenerator(WatermarkGeneratorSupplier.Context context) {
            return new WatermarkGenerator<Goods>() {
                @Override
                public void onEvent(Goods event, long eventTimestamp, WatermarkOutput output) {
                    output.emitWatermark(new Watermark(System.currentTimeMillis()));
                }
                @Override
                public void onPeriodicEmit(WatermarkOutput output) {
                    output.emitWatermark(new Watermark(System.currentTimeMillis()));
                }
            };
        }
    }
    public static class OrderItemWatermark implements WatermarkStrategy<OrderItem> {
        @Override
        public TimestampAssigner<OrderItem> createTimestampAssigner(TimestampAssignerSupplier.Context context) {
            return (element, recordTimestamp) -> System.currentTimeMillis();
        }
        @Override
        public WatermarkGenerator<OrderItem> createWatermarkGenerator(WatermarkGeneratorSupplier.Context context) {
            return new WatermarkGenerator<OrderItem>() {
                @Override
                public void onEvent(OrderItem event, long eventTimestamp, WatermarkOutput output) {
                    output.emitWatermark(new Watermark(System.currentTimeMillis()));
                }
                @Override
                public void onPeriodicEmit(WatermarkOutput output) {
                    output.emitWatermark(new Watermark(System.currentTimeMillis()));
                }
            };
        }
    }
}
```

## 5. 案例二

> 1、通过keyBy将两个流join到一起
>
> 2、interval join需要设置流A去关联哪个时间范围的流B中的元素。此处，我设置的下界为-1、上界为0，且上界是一个开区间。表达的意思就是流A中某个元素的时间，对应上一秒的流B中的元素。
>
> 3、process中将两个key一样的元素，关联在一起，并加载到一个新的FactOrderItem对象中

```java
import com.alibaba.fastjson.JSON;
import lombok.Data;
import org.apache.flink.api.common.eventtime.*;
import org.apache.flink.api.common.typeinfo.TypeInformation;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.co.ProcessJoinFunction;
import org.apache.flink.streaming.api.functions.source.RichSourceFunction;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.util.Collector;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
public class JoinDemo02 {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        // 构建商品数据流
        DataStream<Goods> goodsDS = env.addSource(new GoodsSource11(), TypeInformation.of(Goods.class)).assignTimestampsAndWatermarks(new GoodsWatermark());
        // 构建订单明细数据流
        DataStream<OrderItem> orderItemDS = env.addSource(new OrderItemSource(), TypeInformation.of(OrderItem.class)).assignTimestampsAndWatermarks(new OrderItemWatermark());
        // 进行关联查询
        SingleOutputStreamOperator<FactOrderItem> factOrderItemDS = orderItemDS.keyBy(item -> item.getGoodsId())
                .intervalJoin(goodsDS.keyBy(goods -> goods.getGoodsId()))
                .between(Time.seconds(-1), Time.seconds(0))
                .upperBoundExclusive()
                .process(new ProcessJoinFunction<OrderItem, Goods, FactOrderItem>() {
                    @Override
                    public void processElement(OrderItem left, Goods right, Context ctx, Collector<FactOrderItem> out) throws Exception {
                        FactOrderItem factOrderItem = new FactOrderItem();
                        factOrderItem.setGoodsId(right.getGoodsId());
                        factOrderItem.setGoodsName(right.getGoodsName());
                        factOrderItem.setCount(new BigDecimal(left.getCount()));
                        factOrderItem.setTotalMoney(right.getGoodsPrice().multiply(new BigDecimal(left.getCount())));
                        out.collect(factOrderItem);
                    }
                });
        factOrderItemDS.print();
        env.execute("Interval JOIN");
    }
    //商品类
    @Data
    public static class Goods {
        private String goodsId;
        private String goodsName;
        private BigDecimal goodsPrice;
        public static List<Goods> GOODS_LIST;
        public static Random r;
        static  {
            r = new Random();
            GOODS_LIST = new ArrayList<>();
            GOODS_LIST.add(new Goods("1", "小米12", new BigDecimal(4890)));
            GOODS_LIST.add(new Goods("2", "iphone12", new BigDecimal(12000)));
            GOODS_LIST.add(new Goods("3", "MacBookPro", new BigDecimal(15000)));
            GOODS_LIST.add(new Goods("4", "Thinkpad X1", new BigDecimal(9800)));
            GOODS_LIST.add(new Goods("5", "MeiZu One", new BigDecimal(3200)));
            GOODS_LIST.add(new Goods("6", "Mate 40", new BigDecimal(6500)));
        }
        public static Goods randomGoods() {
            int rIndex = r.nextInt(GOODS_LIST.size());
            return GOODS_LIST.get(rIndex);
        }
        public Goods() {
        }
        public Goods(String goodsId, String goodsName, BigDecimal goodsPrice) {
            this.goodsId = goodsId;
            this.goodsName = goodsName;
            this.goodsPrice = goodsPrice;
        }
        @Override
        public String toString() {
            return JSON.toJSONString(this);
        }
    }
    //订单明细类
    @Data
    public static class OrderItem {
        private String itemId;
        private String goodsId;
        private Integer count;
        @Override
        public String toString() {
            return JSON.toJSONString(this);
        }
    }
    //关联结果
    @Data
    public static class FactOrderItem {
        private String goodsId;
        private String goodsName;
        private BigDecimal count;
        private BigDecimal totalMoney;
        @Override
        public String toString() {
            return JSON.toJSONString(this);
        }
    }
    //构建一个商品Stream源（这个好比就是维表）
    public static class GoodsSource11 extends RichSourceFunction {
        private Boolean isCancel;
        @Override
        public void open(Configuration parameters) throws Exception {
            isCancel = false;
        }
        @Override
        public void run(SourceContext sourceContext) throws Exception {
            while(!isCancel) {
                Goods.GOODS_LIST.stream().forEach(goods -> sourceContext.collect(goods));
                TimeUnit.SECONDS.sleep(1);
            }
        }
        @Override
        public void cancel() {
            isCancel = true;
        }
    }
    //构建订单明细Stream源
    public static class OrderItemSource extends RichSourceFunction {
        private Boolean isCancel;
        private Random r;
        @Override
        public void open(Configuration parameters) throws Exception {
            isCancel = false;
            r = new Random();
        }
        @Override
        public void run(SourceContext sourceContext) throws Exception {
            while(!isCancel) {
                Goods goods = Goods.randomGoods();
                OrderItem orderItem = new OrderItem();
                orderItem.setGoodsId(goods.getGoodsId());
                orderItem.setCount(r.nextInt(10) + 1);
                orderItem.setItemId(UUID.randomUUID().toString());
                sourceContext.collect(orderItem);
                orderItem.setGoodsId("111");
                sourceContext.collect(orderItem);
                TimeUnit.SECONDS.sleep(1);
            }
        }
        @Override
        public void cancel() {
            isCancel = true;
        }
    }
    //构建水印分配器（此处为了简单），直接使用系统时间了
    public static class GoodsWatermark implements WatermarkStrategy<Goods> {
        @Override
        public TimestampAssigner<Goods> createTimestampAssigner(TimestampAssignerSupplier.Context context) {
            return (element, recordTimestamp) -> System.currentTimeMillis();
        }
        @Override
        public WatermarkGenerator<Goods> createWatermarkGenerator(WatermarkGeneratorSupplier.Context context) {
            return new WatermarkGenerator<Goods>() {
                @Override
                public void onEvent(Goods event, long eventTimestamp, WatermarkOutput output) {
                    output.emitWatermark(new Watermark(System.currentTimeMillis()));
                }
                @Override
                public void onPeriodicEmit(WatermarkOutput output) {
                    output.emitWatermark(new Watermark(System.currentTimeMillis()));
                }
            };
        }
    }
    public static class OrderItemWatermark implements WatermarkStrategy<OrderItem> {
        @Override
        public TimestampAssigner<OrderItem> createTimestampAssigner(TimestampAssignerSupplier.Context context) {
            return (element, recordTimestamp) -> System.currentTimeMillis();
        }
        @Override
        public WatermarkGenerator<OrderItem> createWatermarkGenerator(WatermarkGeneratorSupplier.Context context) {
            return new WatermarkGenerator<OrderItem>() {
                @Override
                public void onEvent(OrderItem event, long eventTimestamp, WatermarkOutput output) {
                    output.emitWatermark(new Watermark(System.currentTimeMillis()));
                }
                @Override
                public void onPeriodicEmit(WatermarkOutput output) {
                    output.emitWatermark(new Watermark(System.currentTimeMillis()));
                }
            };
        }
    }
}
```
