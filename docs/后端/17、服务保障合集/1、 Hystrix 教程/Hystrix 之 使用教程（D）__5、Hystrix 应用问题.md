# 5、Hystrix 应用问题
- 来源：https://ddkk.com/zhuanlan/guarantee/hystrix/22.html
- 分类：服务保障
- 分组：Hystrix 之 使用教程（D）
**1、** 问题总结；

如果项目中使用了ThreadLocal，注意hystix创建新线程时，ThreadLocal中存的是之前线程中的数据，在hystix线程中获取不到

**2、** 问题；

```java
throwable异常参数必须写在最后边
```

```java
   public String getText(long liveId,int sdkId,Throwable throwable) {
        if (throwable instanceof HystrixTimeoutException) {
            logger.error("m={} is fusing;request={};ex={}", "getLiveVideoDependInfofallBack", JSON.toJSONString(request), "timeout");
        }else {
            logger.warn("m={} is fusing;request={}", "getLiveVideoDependInfofallBack", JSON.toJSONString(request));
        }
        return liveVideoInfoResponse;
    }
```

**3、** springboot启动类添加EnableHystrix开启Hystrix；

```java
@SpringBootApplication
@ImportResource("classpath:spring-*.xml")
@EnableHystrix
public class App {
    public static void main(String[] args) {
        SpringApplication.run(App.class, args);
    }
}
```

**4、** 异步注解方式时，注意要覆盖get方法；

```java
@Override
            public GetLiveVideoInfoResponse get() {
                return invoke();
            }
```
