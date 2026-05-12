# 63、Flink深入：Flink中通用RedisUtil工具类
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/4/63.html
- 分类：大数据框架
- 分组：教程目录
## 1. 开发目的

在使用SpringBoot后端开发中，我们如果需要对Redis进行增删查改，可以很方便的使用RedisTemplate或者StringRedisTemplate等对象进行操作。但是在大数据中，如果想要对Redis进行操作，就没有那么方便，特别当flink新一代流式计算框架兴起后，没有直接读取和写入Redis的连接源，不管是开始的时候从Redis中获取数据，还是在中间需要读取维度数据，或者最后将数据写入到Redis，都不方便。此时一个较为方便的工具类就能很方便的使用，能达到节省开发时间、减小开发难度等目的。

## 2. 导入依赖

```java
    <properties>
        <maven.compiler.source>8</maven.compiler.source>
        <maven.compiler.target>8</maven.compiler.target>
        <scala.binary.version>2.11</scala.binary.version>
        <scala.version>2.11.8</scala.version>
        <flink.binary.version>1.10</flink.binary.version>
        <flink.version>1.10.0</flink.version>
        <log4j.version>1.2.17</log4j.version>
        <slf4j.version>1.7.21</slf4j.version>
        <mysql.version>8.0.21</mysql.version>
        <fastjson.version>2.0.20</fastjson.version>
        <avro.version>1.11.0</avro.version>
        <huaweicloud.dws.jdbc.version>8.1.0</huaweicloud.dws.jdbc.version>
        <commons.beanutils.version>1.9.4</commons.beanutils.version>
        <guava.version>29.0-jre</guava.version>
        <okhttp.version>3.6.0</okhttp.version>
        <springboot.version>2.3.3.RELEASE</springboot.version>
        <hikari.cp.version>2.6.1</hikari.cp.version>
        <avro.version>1.10.0</avro.version>
        <jedis.version>4.2.0</jedis.version>
        <commons.lang.version>3.10</commons.lang.version>
        <huaweicloud.obs.version>3.21.4</huaweicloud.obs.version>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>
    <dependencies>
        <!-- flink相关jar包 -->
        <!--flink流的核心包-->
        <dependency>
            <groupId>org.apache.flink</groupId>
            <artifactId>flink-clients_${scala.binary.version}</artifactId>
            <version>${flink.version}</version>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <groupId>org.apache.flink</groupId>
            <artifactId>flink-java</artifactId>
            <version>${flink.version}</version>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <groupId>org.apache.flink</groupId>
            <artifactId>flink-streaming-java_${scala.binary.version}</artifactId>
            <version>${flink.version}</version>
            <scope>provided</scope>
        </dependency>
        <!--flink中的Table相关包-->
        <dependency>
            <groupId>org.apache.flink</groupId>
            <artifactId>flink-table-api-java</artifactId>
            <version>${flink.version}</version>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <groupId>org.apache.flink</groupId>
            <artifactId>flink-table-api-java-bridge_${scala.binary.version}</artifactId>
            <version>${flink.version}</version>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <groupId>org.apache.flink</groupId>
            <artifactId>flink-table-planner_${scala.binary.version}</artifactId>
            <version>${flink.version}</version>
            <scope>provided</scope>
        </dependency>
        <!-- flink连接kafka-->
        <dependency>
            <groupId>org.apache.flink</groupId>
            <artifactId>flink-connector-kafka_${scala.binary.version}</artifactId>
            <version>${flink.version}</version>
            <scope>provided</scope>
        </dependency>
        <!--flink的rocksdb包-->
        <dependency>
            <groupId>org.apache.flink</groupId>
            <artifactId>flink-statebackend-rocksdb_${scala.binary.version}</artifactId>
            <version>${flink.version}</version>
            <scope>provided</scope>
        </dependency>
        <!--MySQL驱动包 mysql8版本-->
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>${mysql.version}</version>
            <scope>provided</scope>
        </dependency>
        <!-- jdbc连接池包（使用JDBCTemplate） -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-jdbc</artifactId>
            <version>${springboot.version}</version>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <groupId>com.zaxxer</groupId>
            <artifactId>HikariCP</artifactId>
            <version>${hikari.cp.version}</version>
            <scope>provided</scope>
        </dependency>
        <!--redis-->
        <dependency>
            <groupId>redis.clients</groupId>
            <artifactId>jedis</artifactId>
            <version>${jedis.version}</version>
            <scope>provided</scope>
        </dependency>
        <!-- 华为云GaussDB的连接JDBC的Jar包 -->
        <dependency>
            <groupId>com.huaweicloud.dws</groupId>
            <artifactId>huaweicloud-dws-jdbc</artifactId>
            <version>${huaweicloud.dws.jdbc.version}</version>
            <scope>provided</scope>
        </dependency>
        <!-- 日志打印的jar包 -->
        <dependency>
            <groupId>log4j</groupId>
            <artifactId>log4j</artifactId>
            <version>${log4j.version}</version>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-api</artifactId>
            <version>${slf4j.version}</version>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-log4j12</artifactId>
            <version>${slf4j.version}</version>
            <scope>provided</scope>
        </dependency>
        <!-- json解析包，fastjson包 -->
        <dependency>
            <groupId>com.alibaba</groupId>
            <artifactId>fastjson</artifactId>
            <version>${fastjson.version}</version>
            <scope>provided</scope>
        </dependency>
        <!-- avro压缩包 -->
        <dependency>
            <groupId>org.apache.avro</groupId>
            <artifactId>avro</artifactId>
            <version>${avro.version}</version>
            <scope>provided</scope>
        </dependency>
        <!--commons-beanutils 是 Apache 开源组织提供的用于操作 JAVA BEAN 的工具包。使用 commons-beanutils，我们可以很方便的对 bean 对象的属性进行操作-->
        <dependency>
            <groupId>commons-beanutils</groupId>
            <artifactId>commons-beanutils</artifactId>
            <version>${commons.beanutils.version}</version>
            <scope>provided</scope>
        </dependency>
        <!--Guava 工程包含了若干被 Google 的 Java 项目广泛依赖的核心库,方便开发-->
        <dependency>
            <groupId>com.google.guava</groupId>
            <artifactId>guava</artifactId>
            <version>${guava.version}</version>
            <scope>provided</scope>
        </dependency>
        <!-- 共有的lang包 -->
        <dependency>
            <groupId>org.apache.commons</groupId>
            <artifactId>commons-lang3</artifactId>
            <version>${commons.lang.version}</version>
            <scope>provided</scope>
        </dependency>
        <!-- http包 -->
        <dependency>
            <groupId>com.squareup.okhttp3</groupId>
            <artifactId>okhttp</artifactId>
            <version>${okhttp.version}</version>
            <scope>provided</scope>
        </dependency>
        <!-- 华为云连接OBS包 -->
        <dependency>
            <groupId>com.huaweicloud</groupId>
            <artifactId>esdk-obs-java</artifactId>
            <version>${huaweicloud.obs.version}</version>
            <scope>provided</scope>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-shade-plugin</artifactId>
                <version>3.2.4</version>
                <executions>
                    <execution>
                        <phase>package</phase>
                        <goals>
                            <goal>shade</goal>
                        </goals>
                        <configuration>
                            <artifactSet>
                                <excludes>
                                    <exclude>com.google.code.findbugs:jsr305</exclude>
                                    <exclude>org.slf4j:*</exclude>
                                    <exclude>log4j:*</exclude>
                                    <exclude>org.apache.hadoop:*</exclude>
                                </excludes>
                            </artifactSet>
                            <filters>
                                <filter>
                                    <!-- Do not copy the signatures in the META-INF folder.
                                    Otherwise, this might cause SecurityExceptions when using the JAR. -->
                                    <artifact>*:*</artifact>
                                    <excludes>
                                        <exclude>META-INF/*.SF</exclude>
                                        <exclude>META-INF/*.DSA</exclude>
                                        <exclude>META-INF/*.RSA</exclude>
                                        <exclude>*.properties</exclude>
                                        <exclude>*.xml</exclude>
                                    </excludes>
                                </filter>
                            </filters>
                            <transformers combine.children="append">
                                <transformer
                                        implementation="org.apache.maven.plugins.shade.resource.ServicesResourceTransformer">
                                </transformer>
                            </transformers>
                        </configuration>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
```

## 3. 代码

注意：下述代码中使用了自定义的ModelUtil工具类，该工具类的具体介绍可以参考博主的另一篇博文：[Flink（60）：Flink中通用ModelUtil工具类](/zhuanlan/bigdata/flink/4/60.html)

## 3.1. 使用SpringBoot中的RedisTemplate实现

注意：下述方法为静态工具类，在使用时，直接使用RedisMlUtil调用方法即可；而且因为是静态工具类，所以这个类的库固定了，只能访问这个一个库的数据，如果需要其他的Redis集群可以再创建类似工具类（一般一个公司的Redis集群不会很多，所以一般用来读取数据的工具类，使用静态的即可）。并且其中的连接池的大小、超时时间等参数已进行固定（该参数可以根据公司集群来调节，博主使用的集群用如下配置即可）。另外还有，该类是静态，所以在每台机器上只会创建一个对象，这样连接池等大小就需要配置的大一点。

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.connection.*;
import org.springframework.data.redis.connection.jedis.JedisClientConfiguration;
import org.springframework.data.redis.connection.jedis.JedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import redis.clients.jedis.JedisPoolConfig;
import java.time.Duration;
/**
 * @date: 2022/12/29
 *  @Author ddkk.com  弟弟快看，程序员编程资料站
 * @desc: ml-redis集群工具类
 */
public class RedisMlUtil {
    static Logger logger = LoggerFactory.getLogger(RedisMlUtil.class);
    /**
     * StringRedisTemplate对象
     */
    private static StringRedisTemplate stringRedisTemplate;
    /**
     * 获取StringRedisTemplate对象
     *
     * @return StringRedisTemplate对象
     */
    public static StringRedisTemplate getStringRedisTemplate() {
        if (stringRedisTemplate == null) {
            synchronized (RedisMlUtil.class) {
                if (stringRedisTemplate == null) {
                    // 创建 Jedis连接池 配置对象
                    JedisPoolConfig jedisPoolConfig = new JedisPoolConfig();
                    jedisPoolConfig.setMaxTotal(50);
                    jedisPoolConfig.setMaxIdle(50);
                    jedisPoolConfig.setMinIdle(5);
                    // 通过 Jedis连接池配置 创建 jedis客户端 配置对象
                    JedisClientConfiguration.JedisClientConfigurationBuilder jedisClientConfigurationBuilder = JedisClientConfiguration.builder();
                    jedisClientConfigurationBuilder.connectTimeout(Duration.ofMillis(3000));
                    jedisClientConfigurationBuilder.usePooling().poolConfig(jedisPoolConfig);
                    JedisClientConfiguration jedisClientConfiguration = jedisClientConfigurationBuilder.build();
                    // 创建 redis 配置对象
                    RedisStandaloneConfiguration redisConfiguration = new RedisStandaloneConfiguration();
                    redisConfiguration.setHostName(ModelUtil.getConfigValue("redis.ml.hostname"));
                    redisConfiguration.setPort(Integer.parseInt(ModelUtil.getConfigValue("redis.ml.port")));
                    redisConfiguration.setPassword(RedisPassword.of(ModelUtil.getConfigValue("redis.ml.password")));
                    redisConfiguration.setDatabase(Integer.parseInt(ModelUtil.getConfigValue("redis.ml.database")));
                    // 通过 jedis客户端配置对象 和 redis配置对象 创建Jedis连接工厂
                    JedisConnectionFactory jedisConnectionFactory = new JedisConnectionFactory(redisConfiguration, jedisClientConfiguration);
                    // 通过 Jedis连接工厂 创建 redisTemplate
                    stringRedisTemplate = new StringRedisTemplate(jedisConnectionFactory);
                    logger.info(
                            "##### 创建ml-redis集群客户端StringRedisTemplate对象成功，其中最大连接数为：{}，空闲连接数为：{}，连接地址为：{}",
                            50,
                            5,
                            ModelUtil.getConfigValue("redis.ml.hostname")
                    );
                }
            }
        }
        return stringRedisTemplate;
    }
    /**
     * 通过传入的key获取对应的value值
     *
     * @param key 键
     * @return 值
     */
    public static String getValue(String key) {
        return RedisMlUtil.getStringRedisTemplate().opsForValue().get(key);
    }
}
```

## 3.2. 使用Jedis实现

注意：下述方法为静态工具类，在使用时，直接使用RedisMlUtil调用方法即可；而且因为是静态工具类，所以这个类的库固定了，只能访问这个一个库的数据，如果需要其他的Redis集群可以再创建类似工具类（一般一个公司的Redis集群不会很多，所以一般用来读取数据的工具类，使用静态的即可）。并且其中的连接池的大小、超时时间等参数已进行固定（该参数可以根据公司集群来调节，博主使用的集群用如下配置即可）。另外还有，该类是静态，所以在每台机器上只会创建一个对象，这样连接池等大小就需要配置的大一点。

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.JedisPoolConfig;
/**
 * @date: 2022/12/29
 *  @Author ddkk.com  弟弟快看，程序员编程资料站
 * @desc: ml-redis集群工具类
 */
public class RedisMlUtil {
    static Logger logger = LoggerFactory.getLogger(RedisMlUtil.class);
    /**
     * JedisPool对象
     */
    private static JedisPool jedisPool;
    /**
     * 获取JedisPool对象
     *
     * @return JedisPool对象
     */
    public static JedisPool getJedisPool() {
        if (jedisPool == null) {
            synchronized (RedisMlUtil.class) {
                if (jedisPool == null) {
                    JedisPoolConfig poolConfig = new JedisPoolConfig();
                    poolConfig.setMaxTotal(50);
                    poolConfig.setMaxIdle(50);
                    poolConfig.setMinIdle(5);
                    jedisPool = new JedisPool(
                            poolConfig,
                            ModelUtil.getConfigValue("redis.ml.hostname"),
                            Integer.parseInt(ModelUtil.getConfigValue("redis.ml.port")),
                            3000,
                            ModelUtil.getConfigValue("redis.ml.password")
                    );
                    logger.info(
                            "根据传入的参数创建redis连接池jedisPool对象成功，使用的host为：{}，使用的port为：{}，最大连接数为{}，最大空闲连接数为{}，最小空闲连接数为：{}，连接超时时间为(毫秒)：{}",
                            ModelUtil.getConfigValue("redis.ml.hostname"),
                            Integer.parseInt(ModelUtil.getConfigValue("redis.ml.port")),
                            50,
                            50,
                            5,
                            3000
                    );
                }
            }
        }
        return jedisPool;
    }
    /**
     * 获取对应的 Jedis
     * 注意：该jedis对象是从连接池中返回，使用完之后需要关闭
     *
     * @param index redis对应的索引
     * @return Jedis
     */
    public static Jedis getJedis(int index) {
        Jedis jedis = getJedisPool().getResource();
        jedis.select(index);
        return jedis;
    }
    /**
     * 通过传入的key获取对应的value值
     *
     * @param key 键
     * @return 值
     */
    public static String getValue(int index, String key) {
        Jedis jedis = getJedis(index);
        String value = jedis.get(key);
        jedis.close();
        return value;
    }
}
```

## 3.3. 通用工具类

注意：该工具类没有使用静态，所以在每次使用的时候，需要在open方法中创建该工具类对象，然后在process方法中使用该工具类中的方法即可。此工具类即可以用于维度等数据读取，又能用于将结果数据写入，并且每次创建工具类的时候，可以指定不同的Redis集群和不同的参数。同样，因为每次使用时都创建该类的对象，这样Flink程序中每一个并发，所以在使用时需要注意连接池等参数不要配置的太大。

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.JedisPoolConfig;
/**
 * @date: 2022/12/6
 *  @Author ddkk.com  弟弟快看，程序员编程资料站
 * @desc: RedisUtil
 */
public class RedisUtil {
    static Logger logger = LoggerFactory.getLogger(RedisUtil.class);
    /**
     * jedis连接池
     */
    private JedisPool jedisPool;
    /**
     * 通过传入的参数创建RedisUtil对象
     *
     * @param host     redis的host
     * @param port     redis的端口
     * @param password redis的password
     */
    public RedisUtil(String host, int port, String password) {
        initJedisPool(host, port, password, 2, 2, 1, 3000);
    }
    /**
     * 通过传入的参数创建RedisUtil对象
     *
     * @param host     redis的host
     * @param port     redis的端口
     * @param password redis的password
     * @param maxTotal 连接池中最大连接数
     * @param maxIdle  连接池中最大空闲连接数
     * @param minIdle  连接池中最小空闲连接数
     * @param timeout  连接Redis超时时间
     */
    public RedisUtil(String host, int port, String password, int maxTotal, int maxIdle, int minIdle, int timeout) {
        initJedisPool(host, port, password, maxTotal, maxIdle, minIdle, timeout);
    }
    /**
     * 初始化Jedis对象
     *
     * @param host     redis的host
     * @param port     redis的端口
     * @param password redis的password
     * @param maxTotal 连接池中最大连接数
     * @param maxIdle  连接池中最大空闲连接数
     * @param minIdle  连接池中最小空闲连接数
     * @param timeout  连接Redis超时时间
     */
    public void initJedisPool(String host, int port, String password, int maxTotal, int maxIdle, int minIdle, int timeout) {
        JedisPoolConfig poolConfig = new JedisPoolConfig();
        poolConfig.setMaxTotal(maxTotal);
        poolConfig.setMaxIdle(maxIdle);
        poolConfig.setMinIdle(minIdle);
        jedisPool = new JedisPool(
                poolConfig,
                host,
                port,
                timeout,
                password
        );
        logger.info(
                "根据传入的参数创建redis连接池jedisPool对象成功，使用的host为：{}，使用的port为：{}，最大连接数为{}，最大空闲连接数为{}，最小空闲连接数为：{}，连接超时时间为(毫秒)：{}",
                host,
                port,
                maxTotal,
                maxIdle,
                minIdle,
                timeout
        );
    }
    /**
     * 获取对应的 Jedis
     * 注意：该jedis对象是从连接池中返回，使用完之后需要关闭
     *
     * @param index redis对应的索引
     * @return Jedis
     */
    public Jedis getJedis(int index) {
        Jedis jedis = jedisPool.getResource();
        jedis.select(index);
        return jedis;
    }
    /**
     * 根据传入的数据库索引和key获取对应的值
     * 注意：如果该key不存在，就返回 'nil'，如果存储在key的值不是字符串，则返回错误
     *
     * @param index redis的索引
     * @param key   redis的key
     * @return value
     */
    public String getValue(int index, String key) {
        Jedis jedis = getJedis(index);
        String value = jedis.get(key);
        jedis.close();
        return value;
    }
}
```

## 4. 如何使用

在Flink作业中如何使用上述工具类，可以参考博主的另一篇MySQL工具类文章：[Flink（62）：Flink中通用MySQLUtil工具类](/zhuanlan/bigdata/flink/4/62.html)，使用基本相似，这里就不再过多描述了。
