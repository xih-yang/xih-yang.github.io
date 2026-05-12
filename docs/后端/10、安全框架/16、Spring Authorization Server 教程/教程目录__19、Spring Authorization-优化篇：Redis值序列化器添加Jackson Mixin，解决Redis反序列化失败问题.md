# 19、Spring Authorization-优化篇：Redis值序列化器添加Jackson Mixin，解决Redis反序列化失败问题
- 来源：https://ddkk.com/zhuanlan/security/springauthorization/19.html
- 分类：安全框架
- 分组：教程目录
## 前言

在[授权码模式的前后端分离](https://juejin.cn/post/7254096495184134181)的那篇文章中使用了Redis来保存用户的认证信息，在Redis的配置文件中配置的值序列化器是默认的Jdk序列化器，虽然这样也可以使用，但是在Redis客户端中查看时是乱码的(看起来是)，如果切换为Jackson提供的值序列化器时又会在反序列化时失败，这样是不符合实际的，在项目框架搭建完毕或在已有项目中这些配置实际上应该都已经配置好了的，不能说为了这么一个功能去改原有配置，**所以这里要跟大家说一声对不起，因为在下学艺不精而导致这么一个大缺陷一直留到了现在**。😭

## 问题分析

当时用到的地方就是在登录成功和初始化`SecurityContextHolderFilter`中初始化认证信息的地方存、取`SecurityContext`(认证信息)，存的时候倒是没有问题，但是取的时候就会因为框架内的类不提供默认的构造器从而造成反序列化失败的问题，或者是类型转换异常

Jackson 只能识别java基本类型，遇到复杂类型时，Jackson 就会先序列化成 LinkedHashMap，然后再尝试强转为所需类别，这样大部分情况下会强转失败，异常信息如下

```java
java.lang.ClassCastException: class java.util.LinkedHashMap cannot be cast to class org.springframework.security.core.context.SecurityContext
```

这种情况需要添加一个配置，如下

```java
objectMapper.activateDefaultTyping(  
    objectMapper.getPolymorphicTypeValidator(),  
    ObjectMapper.DefaultTyping.NON_FINAL,  
    JsonTypeInfo.As.PROPERTY);
```

但是当添加了这个配置后重启后再次尝试发现还是有异常，不过这时就是因为框架中的类没有提供默认构造器造成的，异常如下：

```java
org.springframework.data.redis.serializer.SerializationException: Could not read JSON: Cannot construct instance of org.springframework.security.authentication.UsernamePasswordAuthenticationToken (no Creators, like default constructor, exist): cannot deserialize from Object value (no delegate- or property-based Creator)
 at [Source: (byte[])"{"@class":"org.springframework.security.core.context.SecurityContextImpl","authentication":{"@class":"org.springframework.security.authentication.UsernamePasswordAuthenticationToken","authorities":["java.util.Collections$UnmodifiableRandomAccessList",[{"@class":"com.example.model.security.CustomGrantedAuthority","authority":"system"},{"@class":"com.example.model.security.CustomGrantedAuthority","authority":"app"},{"@class":"com.example.model.security.CustomGrantedAuthority","authority":"web"}]],"[truncated 893 bytes]; line: 1, column: 184] (through reference chain: org.springframework.security.core.context.SecurityContextImpl["authentication"])
```

异常提示问题在`SecurityContextImpl`的`authentication`属性上，因为该属性的实例是`UsernamePasswordAuthenticationToken`，这个类并没有一个默认的构造器，所以在反序列化时直接报错了，最开始时我的想法是写一个实现类，然后存取的时候用自定义的类中转一下，但是后来又发现了`Json Mixin`这个东西，发现这个玩意儿更方便，于是就实现了一下，写了一个`UsernamePasswordAuthenticationMixin`类来实现自定义反序列化逻辑，**但是昨天突然发现这东西其实框架已经实现了😰就很尴尬，要将这些东西加进来添加一下框架提供的CoreJackson2Module就行**，配置如下：

```java
// 添加Security提供的Jackson Mixin  
objectMapper.registerModule(new CoreJackson2Module());
```

## 解决方案

Redis配置文件中配置的`RedisTemplate`添加值序列化器，值序列化器使用的`ObjectMapper`添加以上提到的那些配置，包括复杂类型映射、Security提供的`Json Mixin`，完整的Redis配置类如下

```java
package com.example.config;
import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.PropertyAccessor;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;
import org.springframework.security.jackson2.CoreJackson2Module;
/**
 * Redis的key序列化配置类
 *
 * @author vains
 */
@Configuration
@RequiredArgsConstructor
public class RedisConfig {
    private final Jackson2ObjectMapperBuilder builder;
    /**
     * 默认情况下使用
     *
     * @param connectionFactory redis链接工厂
     * @return RedisTemplate
     */
    @Bean
    public RedisTemplate<Object, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        // 字符串序列化器
        StringRedisSerializer stringRedisSerializer = new StringRedisSerializer();
        // 创建ObjectMapper并添加默认配置
        ObjectMapper objectMapper = builder.createXmlMapper(false).build();
        // 序列化所有字段
        objectMapper.setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.ANY);
        // 此项必须配置，否则如果序列化的对象里边还有对象，会报如下错误：
        //     java.lang.ClassCastException: java.util.LinkedHashMap cannot be cast to XXX
        objectMapper.activateDefaultTyping(
                objectMapper.getPolymorphicTypeValidator(),
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY);
        // 添加Security提供的Jackson Mixin
        objectMapper.registerModule(new CoreJackson2Module());
        // 存入redis时序列化值的序列化器
        Jackson2JsonRedisSerializer<Object> valueSerializer =
                new Jackson2JsonRedisSerializer<>(objectMapper, Object.class);
        RedisTemplate<Object, Object> redisTemplate = new RedisTemplate<>();
        // 设置值序列化
        redisTemplate.setValueSerializer(valueSerializer);
        // 设置hash格式数据值的序列化器
        redisTemplate.setHashValueSerializer(valueSerializer);
        // 默认的Key序列化器为：JdkSerializationRedisSerializer
        redisTemplate.setKeySerializer(stringRedisSerializer);
        // 设置字符串序列化器
        redisTemplate.setStringSerializer(stringRedisSerializer);
        // 设置hash结构的key的序列化器
        redisTemplate.setHashKeySerializer(stringRedisSerializer);
        // 设置连接工厂
        redisTemplate.setConnectionFactory(connectionFactory);
        return redisTemplate;
    }
    /**
     * 操作hash的情况下使用
     *
     * @param connectionFactory redis链接工厂
     * @return RedisTemplate
     */
    @Bean
    public RedisTemplate<Object, Object> redisHashTemplate(RedisConnectionFactory connectionFactory) {
        return redisTemplate(connectionFactory);
    }
}
```

## 扩展说明

从上边的配置可以看出`Spring`对于三方框架内部没有默认构造器的类的反序列化支持还是挺好的，如果集成其它框架时遇到这种情况时就可以仿照`Security`框架提供的`Mixin`类实现一个自己的`Mixin`类以支持反序列化，当然也可以找找在框架中是否有类似的`Jackson2Module`类；当自己封装一个`starter`时也可以提供`Jackson2Module`类来映射类，不过这个就按照个人的喜好来了，自己封装自由度很高的。

当然在使用`Security`时如果遇到其它反序列化失败的类，都可以在框架中找找有没有其它的`Jackson2Module`类，如果提供的有那就不用自己封装了，直接往`ObjectMapper`添加一个`Module`就行。
