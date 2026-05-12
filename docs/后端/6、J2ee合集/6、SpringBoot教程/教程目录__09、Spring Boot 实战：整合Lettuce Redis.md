# 09、Spring Boot 实战：整合Lettuce Redis
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/8/9.html
- 分类：J2EE框架
- 分组：教程目录
SpringBoot 是为了简化 Spring 应用的创建、运行、调试、部署等一系列问题而诞生的产物，**自动装配的特性让我们可以更好的关注业务本身而不是外部的XML配置，我们只需遵循规范，引入相关的依赖就可以轻易的搭建出一个 WEB 工程**

Spring Boot 除了支持常见的ORM框架外，更是对常用的中间件提供了非常好封装，随着Spring Boot2.x的到来，支持的组件越来越丰富，也越来越成熟，其中对Redis的支持不仅仅是丰富了它的API，更是替换掉底层Jedis的依赖，取而代之换成了Lettuce(生菜)

## Redis介绍

Redis是一个开源的使用ANSI C语言编写、支持网络、可基于内存亦可持久化的日志型、Key-Value数据库，并提供多种语言的API。相比Memcached它支持存储的类型相对更多**（字符、哈希、集合、有序集合、列表、GEO）** ，**同时Redis是线程安全的**。2010年3月15日起，Redis的开发工作由VMware主持，2013年5月开始，Redis的开发由Pivotal赞助。

## Lettuce

Lettuce 和 Jedis 的都是连接Redis Server的客户端程序。Jedis在**实现上是直连redis server，多线程环境下非线程安全，除非使用连接池，为每个Jedis实例增加物理连接**。Lettuce基于Netty的连接实例（StatefulRedisConnection），**可以在多个线程间并发访问，且线程安全，满足多线程环境下的并发访问，同时它是可伸缩的设计，一个连接实例不够的情况也可以按需增加连接实例**。

## 导入依赖

在pom.xml 中spring-boot-starter-data-redis的依赖，Spring Boot2.x 后底层不在是Jedis如果做版本升级的朋友需要注意下

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-pool2</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
```

## 属性配置

在application.properties 文件中配置如下内容，由于Spring Boot2.x 的改动，连接池相关配置需要通过spring.redis.lettuce.pool 或者 spring.redis.jedis.pool 进行配置了

```java
spring.redis.host=localhost
spring.redis.password=battcn
# 连接超时时间（毫秒）
spring.redis.timeout=10000
# Redis默认情况下有16个分片，这里配置具体使用的分片，默认是0
spring.redis.database=0
# 连接池最大连接数（使用负值表示没有限制） 默认 8
spring.redis.lettuce.pool.max-active=8
# 连接池最大阻塞等待时间（使用负值表示没有限制） 默认 -1
spring.redis.lettuce.pool.max-wait=-1
# 连接池中的最大空闲连接 默认 8
spring.redis.lettuce.pool.max-idle=8
# 连接池中的最小空闲连接 默认 0
spring.redis.lettuce.pool.min-idle=0
```

## 具体编码

Spring Boot对Redis的支持已经非常完善了，良好的序列化以及丰富的API足够应对日常开发

### 实体类

创建一个User类

```java
package com.battcn.entity;
import java.io.Serializable;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @since 2023/5/10 0007
 */
public class User implements Serializable {
    private static final long serialVersionUID = 8655851615465363473L;
    private Long id;
    private String username;
    private String password;
    // TODO  省略get set
}
```

### 自定义Template

默认情况下的模板只能支持RedisTemplate``，也就是只能存入字符串，这在开发中是不友好的，所以自定义模板是很有必要的，当自定义了模板又想使用String存储这时候就可以使用StringRedisTemplate的方式，它们并不冲突…

```java
package com.battcn.config;
import org.springframework.boot.autoconfigure.AutoConfigureAfter;
import org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import java.io.Serializable;
/**
 * TODO 修改database
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @since 2023/5/10 0022
 */
@Configuration
@AutoConfigureAfter(RedisAutoConfiguration.class)
public class RedisCacheAutoConfiguration {
    @Bean
    public RedisTemplate<String, Serializable> redisCacheTemplate(LettuceConnectionFactory redisConnectionFactory) {
        RedisTemplate<String, Serializable> template = new RedisTemplate<>();
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.setConnectionFactory(redisConnectionFactory);
        return template;
    }
}
```

### 测试

完成准备事项后，编写一个junit测试类来检验代码的正确性，有很多人质疑过Redis线程安全性，故下面也提供了响应的测试案例，如有疑问欢迎指正

```java
package com.battcn;
import com.battcn.entity.User;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.context.junit4.SpringRunner;
import java.io.Serializable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.IntStream;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @since 2023/5/10 0010
 */
@RunWith(SpringRunner.class)
@SpringBootTest
public class Chapter8ApplicationTest {
    private static final Logger log = LoggerFactory.getLogger(Chapter8ApplicationTest.class);
    @Autowired
    private StringRedisTemplate stringRedisTemplate;
    @Autowired
    private RedisTemplate<String, Serializable> redisCacheTemplate;
    @Test
    public void get() {
        // TODO 测试线程安全
        ExecutorService executorService = Executors.newFixedThreadPool(1000);
        IntStream.range(0, 1000).forEach(i ->
                executorService.execute(() -> stringRedisTemplate.opsForValue().increment("kk", 1))
        );
        stringRedisTemplate.opsForValue().set("k1", "v1");
        final String k1 = stringRedisTemplate.opsForValue().get("k1");
        log.info("[字符缓存结果] - [{}]", k1);
        // TODO 以下只演示整合，具体Redis命令可以参考官方文档，Spring Data Redis 只是改了个名字而已，Redis支持的命令它都支持
        String key = "battcn:user:1";
        redisCacheTemplate.opsForValue().set(key, new User(1L, "u1", "pa"));
        // TODO 对应 String（字符串）
        final User user = (User) redisCacheTemplate.opsForValue().get(key);
        log.info("[对象缓存结果] - [{}]", user);
    }
}
```

> 其它类型

下列的就是Redis其它类型所对应的操作方式

- **opsForValue：** 对应 String（字符串）
- **opsForZSet：** 对应 ZSet（有序集合）
- **opsForHash：** 对应 Hash（哈希）
- **opsForList：** 对应 List（列表）
- **opsForSet：** 对应 Set（集合）
- **opsForGeo：** 对应 GEO（地理位置）

## 总结

目前很多大佬都写过关于 **SpringBoot** 的教程了，如有雷同，请多多包涵，本教程基于最新的 spring-boot-starter-parent：2.0.1.RELEASE编写，包括新版本的特性都会一起介绍…

## 说点什么

全文代码：[https://github.com/battcn/spring-boot2-learning/tree/master/chapter8](https://github.com/battcn/spring-boot2-learning/tree/master/chapter8)
