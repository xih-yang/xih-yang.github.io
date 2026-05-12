# 22、Flink 基础 - Sink之Redis
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/2/22.html
- 分类：大数据框架
- 分组：教程目录
## 一、pom.xml文件配置

查看Flink 1.9.0版本的官方文档

https://ci.apache.org/projects/flink/flink-docs-release-1.9/

可以看到连接里面是没有Redis，不过Bahir中有

参考官网提供的pom文件

```xml
<dependency>
  <groupId>org.apache.bahir</groupId>
  <artifactId>flink-connector-redis_2.11</artifactId>
  <version>1.1-SNAPSHOT</version>
</dependency>
```

**居然报错，提示不存在**

好吧，我在网上找了个博客:https://blog.csdn.net/qq_43605654/article/details/103618893

参考博客里面的配置，最后成功了

```xml
<!--连接redis依赖-->
<dependency>
    <groupId>org.apache.flink</groupId>
    <artifactId>flink-connector-redis_2.11</artifactId>
    <version>1.1.5</version>
</dependency>
```

## 二、代码准备

```java
package org.flink.sink;
import org.flink.beans.SensorReading;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.connectors.redis.RedisSink;
import org.apache.flink.streaming.connectors.redis.common.config.FlinkJedisPoolConfig;
import org.apache.flink.streaming.connectors.redis.common.mapper.RedisCommand;
import org.apache.flink.streaming.connectors.redis.common.mapper.RedisCommandDescription;
import org.apache.flink.streaming.connectors.redis.common.mapper.RedisMapper;
/**
 * @remark Sink之Redis
 */
public class SinkTest2_Redis {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        // 从文件读取数据
        DataStream<String> inputStream = env.readTextFile("C:\\\\Users\\\\Administrator\\\\IdeaProjects\\\\FlinkStudy\\\\src\\\\main\\\\resources\\\\sensor.txt");
        // 转换成SensorReading类型
        DataStream<SensorReading> dataStream = inputStream.map(line -> {
            String[] fields = line.split(",");
            return new SensorReading(fields[0], new Long(fields[1]), new Double(fields[2]));
        });
        // 定义jedis连接配置
        FlinkJedisPoolConfig config = new FlinkJedisPoolConfig.Builder()
                .setHost("localhost")
                .setPort(6379)
                .build();
        dataStream.addSink( new RedisSink<>(config, new MyRedisMapper()));
        env.execute();
    }
    // 自定义RedisMapper
    public static class MyRedisMapper implements RedisMapper<SensorReading>{
        // 定义保存数据到redis的命令，存成Hash表，hset sensor_temp id temperature
        @Override
        public RedisCommandDescription getCommandDescription() {
            return new RedisCommandDescription(RedisCommand.HSET, "sensor_temp");
        }
        @Override
        public String getKeyFromData(SensorReading data) {
            return data.getId();
        }
        @Override
        public String getValueFromData(SensorReading data) {
            return data.getTemperature().toString();
        }
    }
}
```

## 三、测试

运行完成第二步的Java代码后，登陆redis查看:
