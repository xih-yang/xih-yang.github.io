# 64、Flink深入：Flink中异步匹配维度信息（AsyncJoinDimUtil）工具类
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/4/64.html
- 分类：大数据框架
- 分组：教程目录
## 1. 开发目的

在进行Flink作业的开发中，我们可能需要经常用到维度匹配的功能，即根据传入的数据（比如商品id），然后去维度表中匹配该数据对应的维度信息（比如根据商品id获取商品的颜色、尺码等）。这时如果我们使用Map或者Process算子，在每个并发中获取数据的话，等待数据库的响应时间就比较慢；所以这时候我们需要使用到Flink高级特性AsynIO，但是如果每次都自己写，重复代码就比较多，这时我们可以将其中的通用代码抽取出来，变成工具类，使用模板设计模式的思想，每个不同业务的核心方法不同即可。

## 2. 核心代码

## 2.1. 异步IO工具类 AsyncJoinDimUtil

### 2.1.1. 方法属性说明

> ThreadPoolExecutor threadPoolExecutor：线程池的执行对象，异步IO就是使用多线程来减少数据的响应时间；
> String tableName：维度数据所在的表名；
> AsyncJoinDimUtil()：空参构造函数，当获取的维度数据不需要表名时使用这个构建异步IO对象；
> AsyncJoinDimUtil(String tableName)：传入维度数据所在的表名，用于构建异步IO对象；
> void open(Configuration parameters)：继承自RichAsyncFunction类中的初始化方法，在此工具类中是用于初始化线程池的执行对象；
> void asyncInvoke(T input, ResultFuture resultFuture)：继承自RichAsyncFunction类中的数据具体处理方法，在此工具类中实现的功能是根据传入的数据获取维度数据，并对数据进行join；
> void timeout(T input, ResultFuture resultFuture)：继承自RichAsyncFunction类中的超时方法，当在设置的时间内还是没有返回数据时，会执行此方法（在此工具类中就是将传入的数据原始返回，即不关联维度数据了）；

### 2.1.2. 具体实现

```java
import com.alibaba.fastjson.JSONObject;
import com.yishou.bigdata.common.inter.AsyncJoinFunction;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.functions.async.ResultFuture;
import org.apache.flink.streaming.api.functions.async.RichAsyncFunction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Collections;
import java.util.concurrent.ThreadPoolExecutor;
/**
 * @date: 2022/12/28
 *  @Author ddkk.com  弟弟快看，程序员编程资料站
 * @desc: 异步匹配维度信息工具类
 */
public abstract class AsyncJoinDimUtil<T> extends RichAsyncFunction<T, T> implements AsyncJoinFunction<T> {
    static Logger logger = LoggerFactory.getLogger(AsyncJoinDimUtil.class);
    /**
     * 线程池
     */
    protected ThreadPoolExecutor threadPoolExecutor;
    /**
     * 该数据匹配的维度表名
     */
    protected String tableName;
    protected AsyncJoinDimUtil() {
    }
    /**
     * 通过传入的表名创建对应的对象
     *
     * @param tableName 维度表名
     */
    protected AsyncJoinDimUtil(String tableName) {
        this.tableName = tableName;
    }
    @Override
    public void open(Configuration parameters) throws Exception {
        super.open(parameters);
        ThreadPoolUtil threadPoolUtil = new ThreadPoolUtil();
        threadPoolExecutor = threadPoolUtil.getThreadPoolExecutor();
    }
    @Override
    public void asyncInvoke(T input, ResultFuture<T> resultFuture) throws Exception {
        threadPoolExecutor.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    // 通过维表名和传入的数据，获取查询维表的SQL，并进行查询
                    JSONObject dimInfo = getDimInfo(tableName, input);
                    // 合并数据（注意：因为是从维表查，所以只有1条结果）
                    if (dimInfo != null) {
                        join(input, dimInfo);
                    }
                    // 写出结果
                    resultFuture.complete(Collections.singletonList(input));
                } catch (Exception e) {
                    e.printStackTrace();
                    logger.error("@@@@@ 关联维表失败（关联时抛出异常），传入的数据为：{}，抛出的异常为：{}", input, e.getMessage());
                }
            }
        });
    }
    @Override
    public void timeout(T input, ResultFuture<T> resultFuture) throws Exception {
        resultFuture.complete(Collections.singletonList(input));
        logger.error("@@@@@ 关联维表超时（获取维度数据超时），已将传入数据直接传出（没有关联维度），传入的数据为：{}", input);
    }
}
```

## 2.2. 关联接口 AsyncJoinFunction

### 2.2.1. 方法属性说明

> JSONObject getDimInfo(String tableName, T input)：接口，通过对应的维度表名 和 输入数据，获取需要的维度信息；
> void join(T input, JSONObject dimInfo)：接口，将维度信息join到传入的数据中；

### 2.2.2. 具体实现

```java
import com.alibaba.fastjson.JSONObject;
/**
 * @date: 2022/12/28
 *  @Author ddkk.com  弟弟快看，程序员编程资料站
 * @desc: 异步关联方法，用于使用异步IO关联对应的维度数据
 */
public interface AsyncJoinFunction<T> {
    /**
     * 通过对应的维度表名 和 输入数据，获取需要的维度信息
     *
     * @param tableName 维度表名
     * @param input     输入的数据
     * @return 对应的维度信息
     */
    JSONObject getDimInfo(String tableName, T input);
    /**
     * 将维度信息join到传入的数据中
     *
     * @param input   传入的数据
     * @param dimInfo 维度信息
     */
    void join(T input, JSONObject dimInfo);
}
```

## 2.3. 线程池工具类 ThreadPoolUtil

### 2.3.1. 方法属性说明

> ThreadPoolExecutor threadPoolExecutor：线程池对象；
> ThreadPoolUtil()：构造函数（会初始化一个线程池，线程池配置：4个最少线程，10个最大线程，等待60秒）；
> ThreadPoolUtil(int corePoolSize, int maximumPoolSize, long keepAliveTime)：构造函数（会初始化一个线程池，根据传入的参数来初始化）；
> ThreadPoolUtil(int corePoolSize, int maximumPoolSize)：构造函数（会初始化一个线程池，根据传入的参数来初始化，但是等待时间为60秒）；
> initThreadPoolExecutor(int corePoolSize, int maximumPoolSize, long keepAliveTime, TimeUnit unit, BlockingQueue workQueue)：根据传入的参数初始化线程池执行对象，是在构造方法中调用此方法；
> ThreadPoolExecutor getThreadPoolExecutor()：从线程池中获取线程池执行对象；

### 2.3.2. 具体实现

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingDeque;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
/**
 * @date: 2022/12/28
 *  @Author ddkk.com  弟弟快看，程序员编程资料站
 * @desc: 线程池工具类
 */
public class ThreadPoolUtil {
    static Logger logger = LoggerFactory.getLogger(ThreadPoolUtil.class);
    /**
     * 线程池对象
     */
    private ThreadPoolExecutor threadPoolExecutor;
    /**
     * 空参构造函数（4个最少线程，10个最大线程，等待60秒）
     */
    public ThreadPoolUtil() {
        initThreadPoolExecutor(4, 10, 180, TimeUnit.SECONDS, new LinkedBlockingDeque<>());
    }
    /**
     * 构造函数
     *
     * @param corePoolSize    线程池维护线程的最少数量
     * @param maximumPoolSize 线程池维护线程的最大数量
     * @param keepAliveTime   线程池维护线程所允许的空闲时间（单位：秒）
     */
    public ThreadPoolUtil(int corePoolSize, int maximumPoolSize, long keepAliveTime) {
        initThreadPoolExecutor(corePoolSize, maximumPoolSize, keepAliveTime, TimeUnit.SECONDS, new LinkedBlockingDeque<>());
    }
    /**
     * 构造函数（默认等待60秒）
     *
     * @param corePoolSize    线程池维护线程的最少数量
     * @param maximumPoolSize 线程池维护线程的最大数量
     */
    public ThreadPoolUtil(int corePoolSize, int maximumPoolSize) {
        initThreadPoolExecutor(corePoolSize, maximumPoolSize, 180, TimeUnit.SECONDS, new LinkedBlockingDeque<>());
    }
    /**
     * 初始化线程池执行对象
     *
     * @param corePoolSize    线程池维护线程的最少数量
     * @param maximumPoolSize 线程池维护线程的最大数量
     * @param keepAliveTime   线程池维护线程所允许的空闲时间
     * @param unit            线程池维护线程所允许的空闲时间的单位
     * @param workQueue       线程池所使用的缓冲队列
     */
    public void initThreadPoolExecutor(int corePoolSize, int maximumPoolSize, long keepAliveTime, TimeUnit unit, BlockingQueue<Runnable> workQueue) {
        threadPoolExecutor = new ThreadPoolExecutor(corePoolSize, maximumPoolSize, keepAliveTime, unit, workQueue);
        logger.info(
                "##### 创建线程池成功，其中 线程池维护线程的最少数量 = {}，线程池维护线程的最大数量 = {}， 线程池维护线程所允许的空闲时间(秒) = {} ",
                corePoolSize,
                maximumPoolSize,
                keepAliveTime
        );
    }
    /**
     * 获取线程池执行对象
     *
     * @return 线程池执行对象
     */
    public ThreadPoolExecutor getThreadPoolExecutor() {
        return threadPoolExecutor;
    }
}
```

## 3. 具体使用

## 3.1. 关联MySQL维度数据

Flink中的异步IO调用为通过AsyncDataStream调用unorderedWait方法，具体使用可以参考博主的另一篇博文：[Flink（54）：Flink高级特性之异步IO（Async I/O）](/zhuanlan/bigdata/flink/4/54.html) ；这里的主要更改是创建AsyncJoinDimUtil对象，然后实现其中的getDimInfo()方法和join()方法，就可以对维度数据进行关联；这里是MySQL的实现，可以通过传入的表名，然后使用MySQL工具类即可以方便的获取需要的维度数据，关于MySQL工具类，可以参考博主的另一篇博文：[Flink（62）：Flink中通用MySQLUtil工具类](/zhuanlan/bigdata/flink/4/62.html) ；

```java
SingleOutputStreamOperator<JSONObject> mainStreamAddGoodsDim = AsyncDataStream
    .unorderedWait(
            // 传入的核心流（注意：建议在核心流后使用keyBy，因为AsynIO在前面是几个并发，就还是几个并发，使用keyBy会对数据进行打散分发）
            appGoodsClickStream.union(appGoodsExposureStream, h5GoodsClickStream, h5GoodsExposureStream).keyBy(value -> random.nextInt(1000)),
            new AsyncJoinDimUtil<JSONObject>("yishou.fmys_goods") {
                @Override
                public JSONObject getDimInfo(String tableName, JSONObject input) {
                    List<JSONObject> dimInfos = MySQLR7Util.queryListByKey(
                            tableName,
                            "goods_id",
                            input.getString("goods_id"),
                            JSONObject.class,
                            "goods_no", "goods_kh", "goods_name"
                    );
                    if (!dimInfos.isEmpty()) {
                        return dimInfos.get(0);
                    } else {
                        return null;
                    }
                }
                @Override
                public void join(JSONObject input, JSONObject dimInfo) {
                    input.put("goods_no", dimInfo.getString("goods_no"));
                    input.put("goods_kh", dimInfo.getString("goods_kh"));
                    input.put("goods_name", dimInfo.getString("goods_name"));
                }
            },
            120,
            TimeUnit.SECONDS
    )
    .name("async_add_goods_dim")
    .disableChaining();
```

## 3.2. 关联Redis维度数据

Flink中的异步IO调用为通过AsyncDataStream调用unorderedWait方法，具体使用可以参考博主的另一篇博文：[Flink（54）：Flink高级特性之异步IO（Async I/O）](/zhuanlan/bigdata/flink/4/54.html) ；这里的主要更改是创建AsyncJoinDimUtil对象，然后实现其中的getDimInfo()方法和join()方法，就可以对维度数据进行关联；这里是Redis的实现，所以可以不用传入表名，直接在getDimInfo()方法内部获取数据即可，关于Redis工具类，可以参考博主的另一篇博文： [Flink（63）：Flink中通用RedisUtil工具类](/zhuanlan/bigdata/flink/4/63.html) ；

```java
SingleOutputStreamOperator<JSONObject> mainStreamAddTokenDim = AsyncDataStream
        .unorderedWait(
                mainStreamAddGoodsDim.keyBy(value -> random.nextInt(1000)),
                new AsyncJoinDimUtil<JSONObject>() {
                    @Override
                    public JSONObject getDimInfo(String tableName, JSONObject input) {
                        String token = RedisMlUtil.getValue(0, "x_subject_token");
                        JSONObject result = new JSONObject();
                        result.put("token", token.substring(0, 5));
                        return result;
                    }
                    @Override
                    public void join(JSONObject input, JSONObject dimInfo) {
                        input.put("token", dimInfo.getString("token"));
                    }
                },
                120,
                TimeUnit.SECONDS
        )
        .name("async_add_token_dim")
        .disableChaining();
```

## 4. 注意点

- Flink中的异步IO调用方式为通过AsyncDataStream类调用其具体方法，然后将核心流作为参数传入，建议在核心流后使用keyBy，因为AsynIO在前面是几个并发，就还是几个并发，使用keyBy会对数据进行打散分发；
- 在使用线程池时，因为是每个并发会使用一个线程池，所以设置的线程数不要太多；
