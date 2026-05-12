# 2、Hystrix 实战案例
- 来源：https://ddkk.com/zhuanlan/guarantee/hystrix/15.html
- 分类：服务保障
- 分组：Hystrix 之 使用教程（C）
## 1、案例说明

**1、** 用户在购物APP上的用户服务注册信息，注册成功后由用户服务调用活动服务发放优惠券等；

其中当活动服务不可用时，此时调用出错，导致所有请求在用户服务中阻塞，当请求量大时导致用户服务不可用。此时注册失败。

最终导致所有服务不可用。

## 2、环境搭建

创建三个工程【服务注册中心/用户服务（进行用户注册（user））/活动服务(用户注册后，发放优惠券（根据userid）)】

### 2.1、创建工程

首先创建一个Empty Project【类似于namespace】，接着创建三个module，其中registry和activity需要添加依赖Spring Cloud Discovery，而user需要添加依赖Ops/Spring Cloud Discovery/Spring Could Circute Breaker。

### 2.2、工程配置

## 3、代码正常逻辑

### 3.1、注册中心

### 3.2、用户服务

#### 1、Bean的生成

```java
@SpringBootApplication
@EnableDiscoveryClient  //表示将其注册到注册中心
public class UserApplication {
    /**
     * 作为Spring的一个Bean
     **/
    @Bean
    @LoadBalanced
    public RestTemplate restTemplate()
    {
        return new RestTemplate();
    }
    public static void main(String[] args) {
        SpringApplication.run(UserApplication.class, args);
    }
}
```

#### 2、用户注册

```java
@RestController
public class RegistrationController {
    @Autowired
    private ActivityService activityService;
    /**
     * @Description  用户注册
     * http://localhost:8200/userRegistration
     **/
    @PostMapping("userRegistration")
    public String userRegistration(@RequestBody User user){
        System.out.println("用户注册成功" + user);
        return activityService.firstLogin(user.getId());
    }
}
```

#### 3、用户服务与活动服务交互

```java
/**
 * @version 1.0
 * @description: 用户服务与活动服务交互
 * @author: lihe
 * @date 2022/2/3 20:17
 **/
@Service
public class ActivityService {
    @Autowired
    private RestTemplate restTemplate;
    /**
     * @Description 调用活动服务，完成初次登陆，奖励发放
     **/
    public String firstLogin(Long userId){
        //使用服务名，实际上Spring会将服务名转为对应ip
        return restTemplate.postForObject("http://activity/firstLoginActivity", userId, String.class);
    }
}
```

#### 4、实体

```java
@Data
public class User {
    private Long id;
    private String  name;
}
```

### 3.3、活动服务

```java
/**
 * @version 1.0
 *   处理 注册登陆相关活动。即注册成功后发放优惠券
 * @author: lihe
 * @date 2022/2/3 17:21
 **/
@RestController
public class LoginActivityController {
    private static final String SUCCESS  = "success";
    @PostMapping("firstLoginActivity")
    public String firstLoginActivity(@RequestBody Long userId){
        System.out.println("LoginActivityController 为首次登陆用户发放优惠券成功"+userId);
        return SUCCESS;
    }
}
```

### 3.4、启动【Services中启动】

### 3.5、postman访问

## 4、服务出现性能问题

### 4.1、工程正常创建，服务正常运行，但是目前，存在以下问题：

**1、** 当活动服务出现性能问题不可用时，很容易导致**活动服务**宕机，进而导致**用户服务**宕机【此时有大量用户进行注册导致大量请求挤压在用户服务中等待活动服务返回】；

**2、** 当活动服务不可用时，用户虽然已经注册成功，但收到的是服务端的错误信息；

### 4.2、我们希望的结果：

**1、** 活动服务出现性能问题时，用户服务不要被拖垮；

**2、** 当活动服务不可用时，要让用户看到正常注册【活动的事情，用备用方案】；

### 4.3、解决方案：

**1、** 当活动服务响应时间过长时，用户服务不再等待；

**2、** 提供一个备用方案，当活动服务不可用时执行备用方案；

我们有了解决方案，可以自己写代码实现。

不过，SpringCloud提供了一个组件，叫做Hystrix，可以帮我们解决以上问题。

## 5、超时问题分析

### 1、 用户注册；

```java
/**
 * @description: 用户注册
 **/
@RestController
public class RegistrationController {
    @Autowired
    private ActivityService activityService;
    /**
     * 活动服务存在性能问题，响应时间过长
     * http://localhost:8200/userRegistrationTimeout
     **/
    @PostMapping("userRegistrationTimeout")
    public String userRegistrationTimeout(@RequestBody User user){
        System.out.println("用户注册成功" + user);
        return activityService.firstLoginTimeout(user.getId());
    }
}
```

### 2、 用户服务与活动服务交互；

```java
/**
 * @description: 用户服务与活动服务交互
 **/
@Service
public class ActivityService {
    @Autowired
    private RestTemplate restTemplate;
    /**
     *  调用活动服务，完成初次登陆，奖励发放
     **/
    public String firstLoginTimeout(Long userId){
        //使用服务名，实际上Spring会将服务名转为对应ip
        return restTemplate.postForObject("http://activity/firstLoginActivityTimeout", userId, String.class);
    }
}
```

### 3、 模拟活动服务超时；

```java
/**
 *   处理 注册登陆相关活动
 **/
@RestController
public class LoginActivityController {
    private static final String SUCCESS  = "success";
    @PostMapping("firstLoginActivityTimeout")
    public String firstLoginActivityTimeout(@RequestBody Long userId){
        try {
            //至少保证1s钟睡眠
            TimeUnit.SECONDS.sleep(RandomUtils.nextInt(5)+1);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println("LoginActivityController 为首次登陆用户发放优惠券成功"+userId);
        return SUCCESS;
    }
```

### 4、 postman请求时间长，最终也会成功；

## 6、Hystrix使用

断路器注解：可以使用@SpringCloudApplication代替@SpringBootApplication @EnableDiscoveryClient @EnableCircuitBreaker

```java
@SpringBootApplication
@EnableDiscoveryClient
@EnableCircuitBreaker
public @interface SpringCloudApplication {
}
@EnableCircuitBreaker
public @interface EnableHystrix {
}
public @interface EnableCircuitBreaker {
}
```

### 6.1、添加断路器注解

```java
//@SpringBootApplication
//@EnableDiscoveryClient  //表示将其注册到注册中心
//@EnableHystrix
//@EnableCircuitBreaker
/**
 * SpringCloudApplication
 *  提供了springboot 的功能
 *  提供了自动注册到服务中心的功能
 *  开启了断路器
 **/
@SpringCloudApplication
public class UserApplication {
    /**
     * 作为Spring的一个Bean
     **/
    @Bean
    @LoadBalanced
    public RestTemplate restTemplate()
    {
        return new RestTemplate();
    }
    public static void main(String[] args) {
        SpringApplication.run(UserApplication.class, args);
    }
}
```

## 7、问题解决具体方法

### 7.1、当活动服务响应时间过长时，用户服务不再等待。

**1、** 使用@HystrixCommand；

```java
/**
  * @description: 用户服务与活动服务交互
 **/
@Service
public class ActivityService {
    @Autowired
    private RestTemplate restTemplate;
    /**
     *  调用活动服务，完成初次登陆，奖励发放
     *  定义超时时间，让用户服务不再等待活动服务的响应
     *  这样的话，可以及时释放资源。
     *  使用hystrix，设置超时时间超过2s时则不继续等待调用，直接返回
     **/
    @HystrixCommand(commandProperties = {
            @HystrixProperty(name="execution.isolation.thread.timeoutInMilliseconds",value = "2000")
    })
    public String firstLoginTimeout(Long userId){
        //使用服务名，实际上Spring会将服务名转为对应ip
        return restTemplate.postForObject("http://activity/firstLoginActivityTimeout", userId, String.class);
    }
}
```

**2、** HystrxiCommandProperties中参数；

```java
public abstract class HystrixCommandProperties {
  this.executionTimeoutInMilliseconds = getProperty(propertyPrefix, key, "execution.isolation.thread.timeoutInMilliseconds", builder.getExecutionIsolationThreadTimeoutInMilliseconds(), default_executionTimeoutInMilliseconds);
}
```

### 7.2、提供一个备用方案，当活动服务不可用时执行备用方案。

**1、** 用户注册；

```java
/**
 * @description: 用户注册
 **/
@RestController
public class RegistrationController {
    @Autowired
    private ActivityService activityService;
    /**
     * 活动服务存在性能问题，响应时间过长
     * http://localhost:8200/userRegistrationFallback
     **/
    @PostMapping("userRegistrationFallback")
    public String userRegistrationFallback(@RequestBody User user){
        System.out.println("用户注册成功" + user);
        return activityService.firstLoginFallback(user.getId());
    }
}
```

**2、** 用户服务与活动服务交互；

```java
/**
 * 用户服务与活动服务交互
 **/
@Service
public class ActivityService {
    @Autowired
    private RestTemplate restTemplate;
    /**
     *  需要提供一个备用方案，当活动服务不可用时，执行备用方案,即降级
     **/
    @HystrixCommand(fallbackMethod = "firstLoginFallback0")
    public String firstLoginFallback(Long userId){
        //使用服务名，实际上Spring会将服务名转为对应ip
        return restTemplate.postForObject("http://activity/firstLoginActivityError", userId, String.class);
    }
    public String firstLoginFallback0(Long userId){
        return "活动备用方案--降级";
    }
}
```

**3、** 处理注册登陆相关活动；

```java
/**
 *   处理 注册登陆相关活动
 **/
@RestController
public class LoginActivityController {
    private static final String SUCCESS  = "success";
    /**
     * 模拟活动服务不可用
     **/
    @PostMapping("firstLoginActivityError")
    public String firstLoginActivityError(@RequestBody Long userId){
        throw new RuntimeException("LoginActivityController 为首次登陆用户发放优惠券失败"+userId);
    }
}
```

**4、** postman返回结果；
