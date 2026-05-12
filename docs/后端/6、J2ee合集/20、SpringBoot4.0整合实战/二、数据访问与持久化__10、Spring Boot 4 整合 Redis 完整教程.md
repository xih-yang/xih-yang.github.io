# 10、Spring Boot 4 整合 Redis 完整教程
- 来源：https://ddkk.com/springboot/4-action/10.html
- 分类：Spring Boot 4 整合教程
- 分组：二、数据访问与持久化
- 日期：2025-12-08
用Redis做缓存的时候,最烦的就是要写一堆连接管理、序列化、异常处理这些底层代码,虽然Redis性能好但是集成起来麻烦;后来有了Spring Data Redis,这些问题都解决了,它提供了RedisTemplate、Spring Cache抽象、Repository这些好东西,开发效率直接翻倍;现在Spring Boot 4出来了,整合Redis更是简单得不行,自动配置给你整得明明白白的,咱今天就聊聊Spring Boot 4咋整合Redis的。

其实Redis在Spring Boot里早就支持了,你只要加个`spring-boot-starter-data-redis`依赖,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋用RedisTemplate、Spring Cache、发布订阅这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

## 项目搭建和环境准备

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-redis-demo/
├── pom.xml                          # Maven配置文件
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── demo/
│   │   │               ├── Application.java          # 启动类
│   │   │               ├── entity/                   # 实体类目录
│   │   │               ├── service/                  # 服务层目录
│   │   │               ├── controller/               # 控制器目录
│   │   │               └── config/                   # 配置类目录
│   │   └── resources/
│   │       ├── application.yml                       # 配置文件
│   └── test/
│       └── java/                                     # 测试代码目录
```

### pom.xml完整配置

这是最关键的,依赖配置不对后面全是坑;Spring Boot 4需要Java 17以上,而且Spring Boot 4默认使用Lettuce作为Redis客户端(比Jedis性能更好)。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <!-- 继承Spring Boot父POM,统一管理版本 -->
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>4.0.0</version>  <!-- Spring Boot 4.0版本 -->
        <relativePath/>
    </parent>
    <groupId>com.example</groupId>
    <artifactId>spring-boot-redis-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 Redis Demo</name>
    <description>Spring Boot 4整合Redis示例项目</description>
    <properties>
        <java.version>17</java.version>  <!-- Java 17以上 -->
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>
    <dependencies>
        <!-- Spring Boot Web Starter: 包含Spring MVC、Tomcat等 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!-- Spring Boot Data Redis Starter: 包含Spring Data Redis、Lettuce等 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis</artifactId>
        </dependency>
        <!-- Spring Boot Cache Starter: Spring Cache抽象支持 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-cache</artifactId>
        </dependency>
        <!-- Spring Boot Test: 测试支持 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <!-- Lombok: 简化Java代码(可选,但强烈推荐) -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <!-- Spring Boot Maven插件: 打包和运行 -->
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

### Redis安装和启动

如果本地没有Redis,可以用Docker快速启动一个:

```bash
# 使用Docker启动Redis
docker run -d --name redis -p 6379:6379 redis:latest
# 或者使用Docker Compose
# docker-compose.yml
version: '3.8'
services:
  redis:
    image: redis:latest
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
```

### application.yml配置

Spring Boot 4的配置文件,Redis连接和缓存配置都在这:

```yaml
spring:
  application:
    name: spring-boot-redis-demo
  # Redis配置
  data:
    redis:
      # Redis服务器地址
      host: localhost
      # Redis服务器端口
      port: 6379
      # Redis密码(如果没有密码可以不配置)
      # password: yourpassword
      # 数据库索引(默认0)
      database: 0
      # 连接超时时间(毫秒)
      timeout: 3000
      # Lettuce连接池配置(Spring Boot 4默认使用Lettuce)
      lettuce:
        pool:
          # 最大连接数
          max-active: 20
          # 最大阻塞等待时间(毫秒)
          max-wait: -1
          # 最大空闲连接数
          max-idle: 10
          # 最小空闲连接数
          min-idle: 5
  # Spring Cache配置
  cache:
    type: redis  # 使用Redis作为缓存实现
    redis:
      # 缓存过期时间(毫秒),默认不过期
      time-to-live: 600000  # 10分钟
      # 是否缓存空值
      cache-null-values: false
      # 键的前缀
      key-prefix: "cache:"
      # 是否使用键前缀
      use-key-prefix: true
# 日志配置
logging:
  level:
    root: INFO
    com.example.demo: DEBUG  # 项目包日志级别
    org.springframework.data.redis: DEBUG  # Redis日志级别
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
# 服务器配置
server:
  port: 8080  # 服务端口
```

## RedisTemplate基础使用

RedisTemplate是Spring Data Redis的核心类,提供了所有Redis操作的抽象:

### Redis配置类

```java
package com.example.demo.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.PropertyAccessor;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
/**
 * Redis配置类
 * 配置RedisTemplate的序列化方式
 */
@Configuration
public class RedisConfig {
    /**
     * 配置RedisTemplate
     * 设置key和value的序列化方式
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        // 使用Jackson2JsonRedisSerializer来序列化和反序列化redis的value值
        Jackson2JsonRedisSerializer<Object> serializer = new Jackson2JsonRedisSerializer<>(Object.class);
        ObjectMapper mapper = new ObjectMapper();
        mapper.setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.ANY);
        mapper.activateDefaultTyping(LaissezFaireSubTypeValidator.instance, ObjectMapper.DefaultTyping.NON_FINAL);
        serializer.setObjectMapper(mapper);
        // 设置key的序列化方式为String
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        // 设置value的序列化方式为JSON
        template.setValueSerializer(serializer);
        template.setHashValueSerializer(serializer);
        template.afterPropertiesSet();
        return template;
    }
}
```

### 字符串操作

```java
package com.example.demo.service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import java.util.concurrent.TimeUnit;
/**
 * Redis字符串操作示例
 */
@Service
public class RedisStringService {
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    /**
     * 设置键值对
     */
    public void set(String key, Object value) {
        redisTemplate.opsForValue().set(key, value);
    }
    /**
     * 设置键值对,带过期时间
     */
    public void set(String key, Object value, long timeout, TimeUnit unit) {
        redisTemplate.opsForValue().set(key, value, timeout, unit);
    }
    /**
     * 获取值
     */
    public Object get(String key) {
        return redisTemplate.opsForValue().get(key);
    }
    /**
     * 如果键不存在则设置
     */
    public Boolean setIfAbsent(String key, Object value) {
        return redisTemplate.opsForValue().setIfAbsent(key, value);
    }
    /**
     * 如果键不存在则设置,带过期时间
     */
    public Boolean setIfAbsent(String key, Object value, long timeout, TimeUnit unit) {
        return redisTemplate.opsForValue().setIfAbsent(key, value, timeout, unit);
    }
    /**
     * 递增
     */
    public Long increment(String key) {
        return redisTemplate.opsForValue().increment(key);
    }
    /**
     * 递增指定值
     */
    public Long increment(String key, long delta) {
        return redisTemplate.opsForValue().increment(key, delta);
    }
    /**
     * 递减
     */
    public Long decrement(String key) {
        return redisTemplate.opsForValue().decrement(key);
    }
    /**
     * 删除键
     */
    public Boolean delete(String key) {
        return redisTemplate.delete(key);
    }
    /**
     * 判断键是否存在
     */
    public Boolean hasKey(String key) {
        return redisTemplate.hasKey(key);
    }
    /**
     * 设置过期时间
     */
    public Boolean expire(String key, long timeout, TimeUnit unit) {
        return redisTemplate.expire(key, timeout, unit);
    }
    /**
     * 获取过期时间
     */
    public Long getExpire(String key) {
        return redisTemplate.getExpire(key);
    }
}
```

### 列表操作

```java
package com.example.demo.service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import java.util.List;
/**
 * Redis列表操作示例
 */
@Service
public class RedisListService {
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    /**
     * 从左边推入元素
     */
    public Long leftPush(String key, Object value) {
        return redisTemplate.opsForList().leftPush(key, value);
    }
    /**
     * 从右边推入元素
     */
    public Long rightPush(String key, Object value) {
        return redisTemplate.opsForList().rightPush(key, value);
    }
    /**
     * 从左边弹出元素
     */
    public Object leftPop(String key) {
        return redisTemplate.opsForList().leftPop(key);
    }
    /**
     * 从右边弹出元素
     */
    public Object rightPop(String key) {
        return redisTemplate.opsForList().rightPop(key);
    }
    /**
     * 获取列表长度
     */
    public Long size(String key) {
        return redisTemplate.opsForList().size(key);
    }
    /**
     * 获取列表指定范围元素
     */
    public List<Object> range(String key, long start, long end) {
        return redisTemplate.opsForList().range(key, start, end);
    }
    /**
     * 获取列表所有元素
     */
    public List<Object> getAll(String key) {
        return redisTemplate.opsForList().range(key, 0, -1);
    }
}
```

### 集合操作

```java
package com.example.demo.service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import java.util.Set;
/**
 * Redis集合操作示例
 */
@Service
public class RedisSetService {
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    /**
     * 添加元素到集合
     */
    public Long add(String key, Object... values) {
        return redisTemplate.opsForSet().add(key, values);
    }
    /**
     * 移除集合中的元素
     */
    public Long remove(String key, Object... values) {
        return redisTemplate.opsForSet().remove(key, values);
    }
    /**
     * 获取集合所有成员
     */
    public Set<Object> members(String key) {
        return redisTemplate.opsForSet().members(key);
    }
    /**
     * 判断元素是否在集合中
     */
    public Boolean isMember(String key, Object value) {
        return redisTemplate.opsForSet().isMember(key, value);
    }
    /**
     * 获取集合大小
     */
    public Long size(String key) {
        return redisTemplate.opsForSet().size(key);
    }
    /**
     * 求两个集合的交集
     */
    public Set<Object> intersect(String key1, String key2) {
        return redisTemplate.opsForSet().intersect(key1, key2);
    }
    /**
     * 求两个集合的并集
     */
    public Set<Object> union(String key1, String key2) {
        return redisTemplate.opsForSet().union(key1, key2);
    }
    /**
     * 求两个集合的差集
     */
    public Set<Object> difference(String key1, String key2) {
        return redisTemplate.opsForSet().difference(key1, key2);
    }
}
```

### 哈希操作

```java
package com.example.demo.service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import java.util.Map;
/**
 * Redis哈希操作示例
 */
@Service
public class RedisHashService {
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    /**
     * 设置哈希字段
     */
    public void put(String key, String field, Object value) {
        redisTemplate.opsForHash().put(key, field, value);
    }
    /**
     * 获取哈希字段值
     */
    public Object get(String key, String field) {
        return redisTemplate.opsForHash().get(key, field);
    }
    /**
     * 批量设置哈希字段
     */
    public void putAll(String key, Map<String, Object> map) {
        redisTemplate.opsForHash().putAll(key, map);
    }
    /**
     * 获取哈希所有字段和值
     */
    public Map<Object, Object> entries(String key) {
        return redisTemplate.opsForHash().entries(key);
    }
    /**
     * 删除哈希字段
     */
    public Long delete(String key, Object... fields) {
        return redisTemplate.opsForHash().delete(key, fields);
    }
    /**
     * 判断哈希字段是否存在
     */
    public Boolean hasKey(String key, String field) {
        return redisTemplate.opsForHash().hasKey(key, field);
    }
    /**
     * 获取哈希所有字段
     */
    public Set<Object> keys(String key) {
        return redisTemplate.opsForHash().keys(key);
    }
    /**
     * 获取哈希字段数量
     */
    public Long size(String key) {
        return redisTemplate.opsForHash().size(key);
    }
}
```

## Spring Cache集成

Spring Cache提供了声明式缓存,用注解就能实现缓存功能:

### 缓存配置

```java
package com.example.demo.config;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
/**
 * Spring Cache配置类
 * @EnableCaching注解启用缓存支持
 */
@Configuration
@EnableCaching
public class CacheConfig {
    /**
     * 配置RedisCacheManager
     * 设置默认缓存配置和各个缓存的特定配置
     */
    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        // 默认缓存配置
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(10))  // 默认过期时间10分钟
            .disableCachingNullValues()  // 不缓存空值
            .serializeKeysWith(RedisSerializationContext.SerializationPair
                .fromSerializer(new StringRedisSerializer()))  // key序列化
            .serializeValuesWith(RedisSerializationContext.SerializationPair
                .fromSerializer(new Jackson2JsonRedisSerializer<>(Object.class)));  // value序列化
        // 各个缓存的特定配置
        Map<String, RedisCacheConfiguration> cacheConfigs = new HashMap<>();
        // 用户缓存:1小时过期
        cacheConfigs.put("users", RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofHours(1))
            .prefixCacheNameWith("users:"));
        // 商品缓存:30分钟过期
        cacheConfigs.put("products", RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(30))
            .prefixCacheNameWith("products:"));
        // 配置缓存:不过期
        cacheConfigs.put("config", RedisCacheConfiguration.defaultCacheConfig()
            .prefixCacheNameWith("config:")
            .disableKeyPrefix());  // 不使用前缀
        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(defaultConfig)
            .withInitialCacheConfigurations(cacheConfigs)
            .transactionAware()  // 支持事务
            .build();
    }
}
```

### 使用缓存注解

```java
package com.example.demo.service;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
/**
 * 用户服务类
 * 演示Spring Cache注解的使用
 */
@Service
public class UserService {
    /**
     * @Cacheable: 缓存查询结果
     * value: 缓存名称
     * key: 缓存键(支持SpEL表达式)
     * unless: 条件表达式,如果结果为true则不缓存
     */
    @Cacheable(value = "users", key = "#id", unless = "#result == null")
    public User getUserById(Long id) {
        // 模拟数据库查询
        System.out.println("从数据库查询用户: " + id);
        User user = new User();
        user.setId(id);
        user.setName("用户" + id);
        return user;
    }
    /**
     * @CachePut: 更新缓存
     * 方法执行后更新缓存
     */
    @CachePut(value = "users", key = "#user.id")
    public User updateUser(User user) {
        // 模拟更新数据库
        System.out.println("更新用户: " + user.getId());
        return user;
    }
    /**
     * @CacheEvict: 清除缓存
     * allEntries: 是否清除所有缓存
     * beforeInvocation: 是否在方法执行前清除缓存
     */
    @CacheEvict(value = "users", key = "#id")
    public void deleteUser(Long id) {
        // 模拟删除数据库记录
        System.out.println("删除用户: " + id);
    }
    /**
     * 清除所有用户缓存
     */
    @CacheEvict(value = "users", allEntries = true)
    public void clearAllUsers() {
        System.out.println("清除所有用户缓存");
    }
    /**
     * 条件缓存: 只缓存年龄大于18的用户
     */
    @Cacheable(value = "users", key = "#id", condition = "#id > 0")
    public User getUserByIdConditional(Long id) {
        System.out.println("从数据库查询用户: " + id);
        User user = new User();
        user.setId(id);
        user.setName("用户" + id);
        return user;
    }
}
```

## 发布订阅

Redis支持发布订阅模式,可以实现消息通知:

### 消息监听器

```java
package com.example.demo.listener;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.stereotype.Component;
/**
 * Redis消息监听器
 * 实现MessageListener接口处理接收到的消息
 */
@Component
public class RedisMessageListener implements MessageListener {
    @Override
    public void onMessage(Message message, byte[] pattern) {
        // 获取消息内容
        String body = new String(message.getBody());
        // 获取频道
        String channel = new String(message.getChannel());
        // 获取模式
        String patternStr = new String(pattern);
        System.out.println("收到消息 - 频道: " + channel + ", 内容: " + body);
    }
}
```

### 发布订阅配置

```java
package com.example.demo.config;
import com.example.demo.listener.RedisMessageListener;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;
/**
 * Redis发布订阅配置
 */
@Configuration
public class RedisPubSubConfig {
    /**
     * 配置消息监听容器
     */
    @Bean
    public RedisMessageListenerContainer messageListenerContainer(
            RedisConnectionFactory connectionFactory,
            RedisMessageListener messageListener) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        // 订阅频道
        container.addMessageListener(messageListener, new ChannelTopic("user:notify"));
        container.addMessageListener(messageListener, new ChannelTopic("order:notify"));
        return container;
    }
}
```

### 发布消息服务

```java
package com.example.demo.service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
/**
 * Redis发布订阅服务
 */
@Service
public class RedisPubSubService {
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    /**
     * 发布消息到指定频道
     */
    public void publish(String channel, Object message) {
        redisTemplate.convertAndSend(channel, message);
    }
    /**
     * 发布用户通知
     */
    public void publishUserNotify(String message) {
        publish("user:notify", message);
    }
    /**
     * 发布订单通知
     */
    public void publishOrderNotify(String message) {
        publish("order:notify", message);
    }
}
```

## Controller层

```java
package com.example.demo.controller;
import com.example.demo.entity.User;
import com.example.demo.service.RedisStringService;
import com.example.demo.service.RedisPubSubService;
import com.example.demo.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
/**
 * Redis测试控制器
 */
@RestController
@RequestMapping("/api/redis")
public class RedisController {
    @Autowired
    private RedisStringService redisStringService;
    @Autowired
    private UserService userService;
    @Autowired
    private RedisPubSubService redisPubSubService;
    /**
     * 设置缓存
     * POST /api/redis/set?key=test&value=hello
     */
    @PostMapping("/set")
    public ResponseEntity<String> set(@RequestParam String key, @RequestParam String value) {
        redisStringService.set(key, value);
        return ResponseEntity.ok("设置成功");
    }
    /**
     * 获取缓存
     * GET /api/redis/get?key=test
     */
    @GetMapping("/get")
    public ResponseEntity<Object> get(@RequestParam String key) {
        Object value = redisStringService.get(key);
        return ResponseEntity.ok(value);
    }
    /**
     * 获取用户(带缓存)
     * GET /api/redis/user/{id}
     */
    @GetMapping("/user/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        User user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }
    /**
     * 发布消息
     * POST /api/redis/publish?channel=test&message=hello
     */
    @PostMapping("/publish")
    public ResponseEntity<String> publish(
            @RequestParam String channel,
            @RequestParam String message) {
        redisPubSubService.publish(channel, message);
        return ResponseEntity.ok("发布成功");
    }
}
```

## 启动类

```java
package com.example.demo;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
/**
 * Spring Boot 4应用启动类
 */
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
        System.out.println("Spring Boot 4 Redis应用启动成功!");
    }
}
```

## 最佳实践和注意事项

### 1. 序列化选择

- **Key序列化**: 推荐使用`StringRedisSerializer`,便于调试
- **Value序列化**: 推荐使用`Jackson2JsonRedisSerializer`,支持复杂对象

### 2. 连接池配置

- 根据实际并发量调整连接池大小
- 生产环境建议使用连接池,避免频繁创建连接

### 3. 缓存策略

- 合理设置过期时间,避免缓存雪崩
- 使用缓存预热,提高系统性能
- 注意缓存穿透和缓存击穿问题

### 4. 事务支持

- Redis事务是弱事务,不支持回滚
- 如果需要强事务,考虑使用数据库事务

### 5. 性能优化

- 使用Pipeline批量操作,减少网络往返
- 合理使用批量操作API
- 避免大key和热key问题

### 6. 监控和运维

- 监控Redis内存使用情况
- 定期清理过期key
- 使用Redis Sentinel或Cluster保证高可用

## 总结

Spring Boot 4整合Redis其实挺简单的,主要就这几步:

1. **加依赖**:`spring-boot-starter-data-redis`
2. **配连接**:在`application.yml`里配置Redis连接信息
3. **配序列化**:配置RedisTemplate的序列化方式
4. **用RedisTemplate**:操作各种Redis数据结构
5. **用Spring Cache**:用注解实现声明式缓存
6. **用发布订阅**:实现消息通知功能

Redis最大的优势就是性能好,支持多种数据结构,可以做缓存、消息队列、计数器等;而且Spring Boot的自动配置把大部分配置都给你整好了,基本上开箱即用。

兄弟们要是遇到啥问题,比如连接失败、序列化错误、缓存不生效这些,先检查配置对不对,再看日志输出,基本上都能解决;实在不行就看看官方文档,Spring Data Redis的文档还是挺详细的。

好了,今天就聊到这,兄弟们有啥问题欢迎留言讨论!
