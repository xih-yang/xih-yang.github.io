# 54、Flink深入：Flink高级特性之异步IO（Async I/O）
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/4/54.html
- 分类：大数据框架
- 分组：教程目录
## 1. 异步IO概述

## 1.1. 异步IO操作的需求

官网地址：[Apache Flink 1.12 Documentation: Asynchronous I/O for External Data Access](https://ci.apache.org/projects/flink/flink-docs-release-1.12/dev/stream/operators/asyncio.html)

Async I/O 是阿里巴巴贡献给社区的一个呼声非常高的特性，于1.2版本引入。主要目的是为了解决与外部系统交互时网络延迟成为了系统瓶颈的问题。流计算系统中经常需要与外部系统进行交互，我们通常的做法如向数据库发送用户a的查询请求，然后等待结果返回，在这之前，我们的程序无法发送用户b的查询请求。这是一种同步访问方式，如下图所示：

> 左图所示：通常实现方式是向数据库发送用户a的查询请求（例如在MapFunction中），然后等待结果返回，在这之前，我们无法发送用户b的查询请求，这是一种同步访问的模式，图中棕色的长条标识等待时间，可以发现网络等待时间极大的阻碍了吞吐和延迟
> 右图所示：为了解决同步访问的问题，异步模式可以并发的处理多个请求和回复，可以连续的向数据库发送用户a、b、c、d等的请求，与此同时，哪个请求的回复先返回了就处理哪个回复，从而连续的请求之间不需要阻塞等待，这也正是Async I/O的实现原理。

## 1.2. 使用Aysnc I/O的前提条件

- 数据库(或key/value存储系统)提供支持异步请求的client。（如java的vertx）
- 没有异步请求客户端的话也可以将同步客户端丢到线程池中执行作为异步客户端

## 1.3. Async I/O API

Async I/O API允许用户在数据流中使用异步客户端访问外部存储，该API处理与数据流的集成，以及消息顺序性（Order），事件时间（EventTime），一致性（容错）等脏活累活，用户只专注于业务，如果目标数据库中有异步客户端，则三步即可实现异步流式转换操作（针对该数据库的异步）：

- 实现用来分发请求的AsyncFunction，用来向数据库发送异步请求并设置回调
- 获取操作结果的callback，并将它提交给ResultFuture
- 将异步I/O操作应用于DataStream

## 2. 案例展示

参考博文：[两种方式实现Flink异步IO查询Mysql_优优我心的博客-CSDN博客_flink mysql 异步io](https://blog.csdn.net/weixin_41608066/article/details/105957940)

## 2.1. 需求

使用异步IO实现从MySQL中读取数据

## 2.2. 数据准备

```java
DROP TABLE IF EXISTS t_category;
CREATE TABLE t_category (
  id int(11) NOT NULL,
  name varchar(255) DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
-- --------
-- Records of t_category
-- --------
INSERT INTO t_category VALUES ('1', '手机');
INSERT INTO t_category VALUES ('2', '电脑');
INSERT INTO t_category VALUES ('3', '服装');
INSERT INTO t_category VALUES ('4', '化妆品');
INSERT INTO t_category VALUES ('5', '食品');
```

## 2.3. 代码演示一（读取MySQL数据）

```java
import io.vertx.core.AsyncResult;
import io.vertx.core.Handler;
import io.vertx.core.Vertx;
import io.vertx.core.VertxOptions;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.jdbc.JDBCClient;
import io.vertx.ext.sql.SQLClient;
import io.vertx.ext.sql.SQLConnection;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.datastream.AsyncDataStream;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.async.ResultFuture;
import org.apache.flink.streaming.api.functions.async.RichAsyncFunction;
import org.apache.flink.streaming.api.functions.source.RichSourceFunction;
import java.sql.*;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
/**
 * 使用异步io的先决条件
 * 1.数据库(或key/value存储)提供支持异步请求的client。
 * 2.没有异步请求客户端的话也可以将同步客户端丢到线程池中执行作为异步客户端。
 */
public class ASyncIODemo {
    public static void main(String[] args) throws Exception {
        //1.env
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        //2.Source
        //DataStreamSource[1,2,3,4,5]
        DataStreamSource<CategoryInfo> categoryDS = env.addSource(new RichSourceFunction<CategoryInfo>() {
            private Boolean flag = true;
            @Override
            public void run(SourceContext<CategoryInfo> ctx) throws Exception {
                Integer[] ids = {1, 2, 3, 4, 5};
                for (Integer id : ids) {
                    ctx.collect(new CategoryInfo(id, null));
                }
            }
            @Override
            public void cancel() {
                this.flag = false;
            }
        });
        //3.Transformation
        //方式一：Java-vertx中提供的异步client实现异步IO
        //unorderedWait无序等待
        SingleOutputStreamOperator<CategoryInfo> result1 = AsyncDataStream
                .unorderedWait(categoryDS, new ASyncIOFunction1(), 1000, TimeUnit.SECONDS, 10);
        //方式二：MySQL中同步client+线程池模拟异步IO
        //unorderedWait无序等待
        SingleOutputStreamOperator<CategoryInfo> result2 = AsyncDataStream
                .unorderedWait(categoryDS, new ASyncIOFunction2(), 1000, TimeUnit.SECONDS, 10);
        //4.Sink
        result1.print("方式一：Java-vertx中提供的异步client实现异步IO \n");
        result2.print("方式二：MySQL中同步client+线程池模拟异步IO \n");
        //5.execute
        env.execute();
    }
}
@Data
@NoArgsConstructor
@AllArgsConstructor
class CategoryInfo {
    private Integer id;
    private String name;
}
class MysqlSyncClient {
    private static transient Connection connection;
    private static final String JDBC_DRIVER = "com.mysql.jdbc.Driver";
    private static final String URL = "jdbc:mysql://localhost:3306/bigdata";
    private static final String USER = "root";
    private static final String PASSWORD = "root";
    static {
        init();
    }
    private static void init() {
        try {
            Class.forName(JDBC_DRIVER);
        } catch (ClassNotFoundException e) {
            System.out.println("Driver not found!" + e.getMessage());
        }
        try {
            connection = DriverManager.getConnection(URL, USER, PASSWORD);
        } catch (SQLException e) {
            System.out.println("init connection failed!" + e.getMessage());
        }
    }
    public void close() {
        try {
            if (connection != null) {
                connection.close();
            }
        } catch (SQLException e) {
            System.out.println("close connection failed!" + e.getMessage());
        }
    }
    public CategoryInfo query(CategoryInfo category) {
        try {
            String sql = "select id,name from t_category where id = "+ category.getId();
            Statement statement = connection.createStatement();
            ResultSet rs = statement.executeQuery(sql);
            if (rs != null && rs.next()) {
                category.setName(rs.getString("name"));
            }
        } catch (SQLException e) {
            System.out.println("query failed!" + e.getMessage());
        }
        return category;
    }
}
/**
 * 方式一：Java-vertx中提供的异步client实现异步IO
 */
class ASyncIOFunction1 extends RichAsyncFunction<CategoryInfo, CategoryInfo> {
    private transient SQLClient mySQLClient;
    @Override
    public void open(Configuration parameters) throws Exception {
        JsonObject mySQLClientConfig = new JsonObject();
        mySQLClientConfig
                .put("driver_class", "com.mysql.jdbc.Driver")
                .put("url", "jdbc:mysql://localhost:3306/bigdata")
                .put("user", "root")
                .put("password", "root")
                .put("max_pool_size", 20);
        VertxOptions options = new VertxOptions();
        options.setEventLoopPoolSize(10);
        options.setWorkerPoolSize(20);
        Vertx vertx = Vertx.vertx(options);
        //根据上面的配置参数获取异步请求客户端
        mySQLClient = JDBCClient.createNonShared(vertx, mySQLClientConfig);
    }
    //使用异步客户端发送异步请求
    @Override
    public void asyncInvoke(CategoryInfo input, ResultFuture<CategoryInfo> resultFuture) throws Exception {
        mySQLClient.getConnection(new Handler<AsyncResult<SQLConnection>>() {
            @Override
            public void handle(AsyncResult<SQLConnection> sqlConnectionAsyncResult) {
                if (sqlConnectionAsyncResult.failed()) {
                    return;
                }
                SQLConnection connection = sqlConnectionAsyncResult.result();
                connection.query("select id,name from t_category where id = " +input.getId(), new Handler<AsyncResult<io.vertx.ext.sql.ResultSet>>() {
                    @Override
                    public void handle(AsyncResult<io.vertx.ext.sql.ResultSet> resultSetAsyncResult) {
                        if (resultSetAsyncResult.succeeded()) {
                            List<JsonObject> rows = resultSetAsyncResult.result().getRows();
                            for (JsonObject jsonObject : rows) {
                                CategoryInfo categoryInfo = new CategoryInfo(jsonObject.getInteger("id"), jsonObject.getString("name"));
                                resultFuture.complete(Collections.singletonList(categoryInfo));
                            }
                        }
                    }
                });
            }
        });
    }
    @Override
    public void close() throws Exception {
        mySQLClient.close();
    }
    @Override
    public void timeout(CategoryInfo input, ResultFuture<CategoryInfo> resultFuture) throws Exception {
        System.out.println("async call time out!");
        input.setName("未知");
        resultFuture.complete(Collections.singleton(input));
    }
}
/**
 * 方式二：同步调用+线程池模拟异步IO
 */
class ASyncIOFunction2 extends RichAsyncFunction<CategoryInfo, CategoryInfo> {
    private transient MysqlSyncClient client;
    private ExecutorService executorService;//线程池
    @Override
    public void open(Configuration parameters) throws Exception {
        super.open(parameters);
        client = new MysqlSyncClient();
        executorService = new ThreadPoolExecutor(10, 10, 0L, TimeUnit.MILLISECONDS, new LinkedBlockingQueue<Runnable>());
    }
    //异步发送请求
    @Override
    public void asyncInvoke(CategoryInfo input, ResultFuture<CategoryInfo> resultFuture) throws Exception {
        executorService.execute(new Runnable() {
            @Override
            public void run() {
                resultFuture.complete(Collections.singletonList((CategoryInfo) client.query(input)));
            }
        });
    }
    @Override
    public void close() throws Exception {
    }
    @Override
    public void timeout(CategoryInfo input, ResultFuture<CategoryInfo> resultFuture) throws Exception {
        System.out.println("async call time out!");
        input.setName("未知");
        resultFuture.complete(Collections.singleton(input));
    }
}
```

## 2.4. 代码演示二（读取Redis数据）

```java
import io.vertx.core.Vertx;
import io.vertx.core.VertxOptions;
import io.vertx.redis.RedisClient;
import io.vertx.redis.RedisOptions;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.TimeCharacteristic;
import org.apache.flink.streaming.api.datastream.AsyncDataStream;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.async.ResultFuture;
import org.apache.flink.streaming.api.functions.async.RichAsyncFunction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.JedisPoolConfig;
import java.util.Collections;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;
/**
    使用异步IO访问redis
        hset AsyncReadRedis beijing 1
        hset AsyncReadRedis shanghai 2
        hset AsyncReadRedis guangzhou 3
        hset AsyncReadRedis shenzhen 4
        hset AsyncReadRedis hangzhou 5
        hset AsyncReadRedis wuhan 6
        hset AsyncReadRedis chengdu 7
        hset AsyncReadRedis tianjin 8
        hset AsyncReadRedis chongqing 9
        city.txt
        1,beijing
        2,shanghai
        3,guangzhou
        4,shenzhen
        5,hangzhou
        6,wuhan
        7,chengdu
        8,tianjin
        9,chongqing
 */
public class AsyncIODemo_Redis {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setStreamTimeCharacteristic(TimeCharacteristic.EventTime);
        DataStreamSource<String> lines = env.readTextFile("data/input/city.txt");
        SingleOutputStreamOperator<String> result1 = AsyncDataStream.orderedWait(lines, new AsyncRedis(), 10, TimeUnit.SECONDS, 1);
        SingleOutputStreamOperator<String> result2 = AsyncDataStream.orderedWait(lines, new AsyncRedisByVertx(), 10, TimeUnit.SECONDS, 1);
        result1.print().setParallelism(1);
        result2.print().setParallelism(1);
        env.execute();
    }
}
/**
 * 使用异步的方式读取redis的数据
 */
class AsyncRedis extends RichAsyncFunction<String, String> {
    //定义redis的连接池对象
    private JedisPoolConfig config = null;
    private static String ADDR = "localhost";
    private static int PORT = 6379;
    //等待可用连接的最大时间，单位是毫秒，默认是-1，表示永不超时，如果超过等待时间，则会抛出异常
    private static int TIMEOUT = 10000;
    //定义redis的连接池实例
    private JedisPool jedisPool = null;
    //定义连接池的核心对象
    private Jedis jedis = null;
    //初始化redis的连接
    @Override
    public void open(Configuration parameters) throws Exception {
        super.open(parameters);
        //定义连接池对象属性配置
        config = new JedisPoolConfig();
        //初始化连接池对象
        jedisPool = new JedisPool(config, ADDR, PORT, TIMEOUT);
        //实例化连接对象（获取一个可用的连接）
        jedis = jedisPool.getResource();
    }
    @Override
    public void close() throws Exception {
        super.close();
        if(jedis.isConnected()){
            jedis.close();
        }
    }
    //异步调用redis
    @Override
    public void asyncInvoke(String input, ResultFuture<String> resultFuture) throws Exception {
        System.out.println("input:"+input);
        //发起一个异步请求，返回结果
        CompletableFuture.supplyAsync(new Supplier<String>() {
            @Override
            public String get() {
                String[] arrayData = input.split(",");
                String name = arrayData[1];
                String value = jedis.hget("AsyncReadRedis", name);
                System.out.println("output:"+value);
                return  value;
            }
        }).thenAccept((String dbResult)->{
            //设置请求完成时的回调，将结果返回
            resultFuture.complete(Collections.singleton(dbResult));
        });
    }
    //连接超时的时候调用的方法，一般在该方法中输出连接超时的错误日志，如果不重新该方法，连接超时后会抛出异常
    @Override
    public void timeout(String input, ResultFuture<String> resultFuture) throws Exception {
        System.out.println("redis connect timeout!");
    }
}
/**
 * 使用高性能异步组件vertx实现类似于连接池的功能，效率比连接池要高
 * 1）在java版本中可以直接使用
 * 2）如果在scala版本中使用的话，需要scala的版本是2.12+
 */
class AsyncRedisByVertx extends RichAsyncFunction<String,String> {
    //用transient关键字标记的成员变量不参与序列化过程
    private transient RedisClient redisClient;
    //获取连接池的配置对象
    private JedisPoolConfig config = null;
    //获取连接池
    JedisPool jedisPool = null;
    //获取核心对象
    Jedis jedis = null;
    //Redis服务器IP
    private static String ADDR = "localhost";
    //Redis的端口号
    private static int PORT = 6379;
    //访问密码
    private static String AUTH = "XXXXXX";
    //等待可用连接的最大时间，单位毫秒，默认值为-1，表示永不超时。如果超过等待时间，则直接抛出JedisConnectionException；
    private static int TIMEOUT = 10000;
    private static final Logger logger = LoggerFactory.getLogger(AsyncRedis.class);
    //初始化连接
    @Override
    public void open(Configuration parameters) throws Exception {
        super.open(parameters);
        config = new JedisPoolConfig();
        jedisPool = new JedisPool(config, ADDR, PORT, TIMEOUT);
        jedis = jedisPool.getResource();
        RedisOptions config = new RedisOptions();
        config.setHost(ADDR);
        config.setPort(PORT);
        VertxOptions vo = new VertxOptions();
        vo.setEventLoopPoolSize(10);
        vo.setWorkerPoolSize(20);
        Vertx vertx = Vertx.vertx(vo);
        redisClient = RedisClient.create(vertx, config);
    }
    //数据异步调用
    @Override
    public void asyncInvoke(String input, ResultFuture<String> resultFuture) throws Exception {
        System.out.println("input:"+input);
        String[] split = input.split(",");
        String name = split[1];
        // 发起一个异步请求
        redisClient.hget("AsyncReadRedis", name, res->{
            if(res.succeeded()){
                String result = res.result();
                if(result== null){
                    resultFuture.complete(null);
                    return;
                }
                else {
                    // 设置请求完成时的回调: 将结果传递给 collector
                    resultFuture.complete(Collections.singleton(result));
                }
            }else if(res.failed()) {
                resultFuture.complete(null);
                return;
            }
        });
    }
    @Override
    public void timeout(String input, ResultFuture resultFuture) throws Exception {
    }
    @Override
    public void close() throws Exception {
        super.close();
        if (redisClient != null) {
            redisClient.close(null);
        }
    }
}
```

## 3. 原理深入

## 3.1. AsyncDataStream

AsyncDataStream是一个工具类，用于将AsyncFunction应用于DataStream，AsyncFunction发出的并发请求都是无序的，该顺序基于哪个请求先完成，为了控制结果记录的发出顺序，flink提供了两种模式，分别对应AsyncDataStream的两个静态方法，**OrderedWait**和**unorderedWait。**

> orderedWait（有序）：消息的发送顺序与接收到的顺序相同（包括 watermark ），也就是先进先出。
>
>
>
> unorderWait（无序）：
>
>
>
> 在ProcessingTime中，完全无序，即哪个请求先返回结果就先发送（最低延迟和最低消耗）。
>
>
>
> 在EventTime中，以watermark为边界，介于两个watermark之间的消息可以乱序，但是watermark和消息之间不能乱序，这样既认为在无序中又引入了有序，这样就有了与有序一样的开销。

AsyncDataStream.(un)orderedWait 的主要工作就是创建了一个 AsyncWaitOperator。AsyncWaitOperator 是支持异步 IO 访问的算子实现，该算子会运行 AsyncFunction 并处理异步返回的结果，其内部原理如下图所示。

> 如图所示，AsyncWaitOperator 主要由两部分组成：
>
>
> StreamElementQueue
> Emitter

StreamElementQueue 是一个 Promise 队列，所谓 Promise 是一种异步抽象表示将来会有一个值（海底捞排队给你的小票），这个队列是未完成的 Promise 队列，也就是进行中的请求队列。Emitter 是一个单独的线程，负责发送消息（收到的异步回复）给下游。

> 图中E5表示进入该算子的第五个元素（”Element-5”）：
>
>
> 在执行过程中首先会将其包装成一个 “Promise” P5，然后将P5放入队列
> 最后调用 AsyncFunction 的 ayncInvoke 方法，该方法会向外部服务发起一个异步的请求，并注册回调
> 该回调会在异步请求成功返回时调用 AsyncCollector.collect 方法将返回的结果交给框架处理。
> 实际上 AsyncCollector 是一个 Promise ，也就是 P5，在调用 collect 的时候会标记 Promise 为完成状态，并通知 Emitter 线程有完成的消息可以发送了。
> Emitter 就会从队列中拉取完成的 Promise ，并从 Promise 中取出消息发送给下游。

## 3.2. 消息的顺序性

Async I/O 提供了两种输出模式。其实细分有三种模式:

**1、** 有序；

**2、** ProcessingTime无序；

**3、** EventTime无序；

Flink 使用队列来实现不同的输出模式，并抽象出一个队列的接口（StreamElementQueue），这种分层设计使得AsyncWaitOperator和Emitter不用关心消息的顺序问题。StreamElementQueue有两种具体实现，分别是 **OrderedStreamElementQueue****和UnorderedStreamElementQueue**。UnorderedStreamElementQueue 比较有意思，它使用了一套逻辑巧妙地实现完全无序和EventTime 无序。

### 3.2.1. 有序

有序比较简单，使用一个队列就能实现。所有新进入该算子的元素（包括 watermark），都会包装成 Promise 并按到达顺序放入该队列。如下图所示，尽管P4的结果先返回，但并不会发送，只有 P1 （队首）的结果返回了才会触发 Emitter 拉取队首元素进行发送。

### 3.2.2. ProcessingTime 无序

ProcessingTime 无序也比较简单，因为没有 watermark，不需要协调 watermark 与消息的顺序性，所以使用两个队列就能实现，一个 **uncompletedQueue** 一个 **completedQueue**。所有新进入该算子的元素，同样的包装成 **Promise** 并放入 **uncompletedQueue** 队列，当**uncompletedQueue**队列中任意的**Promise**返回了数据，则将该 **Promise** 移到 **completedQueue** 队列中，并通知 **Emitter** 消费。如下图所示：

### 3.2.3. EventTime 无序

**EventTime****无序类似于有序与 ProcessingTime 无序的结合体**。因为有 **watermark**，需要协调 watermark与消息之间的顺序性，所以**uncompletedQueue**中存放的元素从原先的 **Promise** 变成了 **Promise****集合**。

**1、** 如果进入算子的是消息元素，则会包装成Promise放入队尾的集合中；

**2、** 如果进入算子的是watermark，也会包装成Promise并放到一个独立的集合中，再将该集合加入到uncompletedQueue队尾，最后再创建一个空集合加到uncompletedQueue队尾；

**3、** 这样，watermark就成了消息顺序的边界；

**4、** 只有处在队首的集合中的Promise返回了数据，才能将该Promise移到completedQueue；

**5、** 队列中，由Emitter消费发往下游；

**6、** 只有队首集合空了，才能处理第二个集合；

这样就保证了当且仅当某个 watermark 之前所有的消息都已经被发送了，该 watermark 才能被发送。过程如下图所示：
