# 04、熔断器Hystrix
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloud/1/4.html
- 分类：J2EE框架
- 分组：教程目录
Springboot: 2.1.6.RELEASE

SpringCloud: Greenwich.SR1

如无特殊说明，本系列教程全采用以上版本

## 1. 熔断器

#### 服务雪崩

在正常的微服务架构体系下，一个业务很少有只需要调用一个服务就可以返回数据的情况，这种比较常见的是出现在demo中，一般都是存在调用链的，比如A->B->C->D，如果D在某一个瞬间出现问题，比如网络波动，io偏高，导致卡顿，随着时间的流逝，后续的流量继续请求，会造成D的压力上升，有可能引起宕机。

你以为这就是结束么，图样图森破，这才是噩梦的开始，在同一个调用链上的ABC三个服务都会随着D的宕机而引发宕机，这还不是结束，一个服务不可能只有一个接口，当它开始卡顿宕机时，会影响到其他调用链的正常调用，最终导致所有的服务瘫痪。

如下图所示：

#### 熔断器

相信大家都知道家用电闸，原来老式的电闸是使用保险丝的（现在很多都是空气开关了），当家里用电量过大的时候，保险丝经常烧断，这么做是保护家里的用电器，防止过载。

熔断器的作用和这个很像，它可以实现快速失败，如果在一段时间内服务调用失败或者异常，会强制要求当前调用失败，不在走远程调用，走服务降级操作（返回固定数据或者其他一些降级操作）。从而防止应用程序不断地尝试执行可能会失败的操作，使得应用程序继续执行而不用等待修正错误，或者浪费CPU时间去等到长时间的超时产生。熔断器也可以自动诊断错误是否已经修正，如果已经修正，应用程序会再次尝试调用操作。

熔断器模式就像是那些容易导致错误的操作的一种代理。这种代理能够记录最近调用发生错误的次数，然后决定使用允许操作继续，或者立即返回错误。 Hystrix会有一个熔断时间窗口，具体转换逻辑如下：

熔断器就是保护服务高可用的最后一道防线。

## 2. Hystrix

#### 1. 断路器机制

断路器很好理解, 当Hystrix Command请求后端服务失败数量超过一定比例(默认50%), 断路器会切换到开路状态(Open)。这时所有请求会直接失败而不会发送到后端服务。断路器保持在开路状态一段时间后(默认5秒), 自动切换到半开路状态(HALF-OPEN)。这时会判断下一次请求的返回情况, 如果请求成功, 断路器切回闭路状态(CLOSED), 否则重新切换到开路状态(OPEN)。Hystrix的断路器就像我们家庭电路中的保险丝, 一旦后端服务不可用, 断路器会直接切断请求链, 避免发送大量无效请求影响系统吞吐量, 并且断路器有自我检测并恢复的能力。

#### 2. Fallback

Fallback相当于是降级操作。对于查询操作, 我们可以实现一个fallback方法, 当请求后端服务出现异常的时候, 可以使用fallback方法返回的值。fallback方法的返回值一般是设置的默认值或者来自缓存。

#### 3. 资源隔离

在Hystrix中, 主要通过线程池来实现资源隔离。通常在使用的时候我们会根据调用的远程服务划分出多个线程池。例如调用产品服务的Command放入A线程池, 调用账户服务的Command放入B线程池。这样做的主要优点是运行环境被隔离开了。这样就算调用服务的代码存在bug或者由于其他原因导致自己所在线程池被耗尽时, 不会对系统的其他服务造成影响。但是带来的代价就是维护多个线程池会对系统带来额外的性能开销。如果是对性能有严格要求而且确信自己调用服务的客户端代码不会出问题的话, 可以使用Hystrix的信号模式(Semaphores)来隔离资源。

## 3. Feign Hystrix

上一篇我们使用了producer和consumers，熔断器是只作用在服务调用端，因此上一篇使用到的consumers我们可以直接拿来使用。因为，Feign中已经依赖了Hystrix所以在maven配置上不用做任何改动。

#### 1. 配置文件application.yml新增

```sh
server:
  port: 8081
spring:
  application:
    name: spring-cloud-consumers
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
feign:
  hystrix:
    enabled: true
```

其中新增了feign.hystrix.enabled = true

#### 2. 创建fallback类，继承与HelloRemote实现回调的方法

```java
package com.springcloud.consumers.fallback;
import com.springcloud.consumers.remote.HelloRemote;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.RequestParam;
/**
 * Created with IntelliJ IDEA.
 *
 * @User: weishiyao
 * @Date: 2021/7/2
 * @Time: 23:14
 * @email: inwsy@hotmail.com
 * Description:
 */
@Component
public class HelloRemoteFallBack implements HelloRemote {
    @Override
    public String hello(@RequestParam(value = "name") String name) {
        return "hello " + name + ", i am fallback massage";
    }
}
```

### 3. 添加fallback属性

在HelloRemote类添加指定fallback类，在服务熔断的时候返回fallback类中的内容。

```java
package com.springcloud.consumers.remote;
import com.springcloud.consumers.fallback.HelloRemoteFallBack;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
/**
 * @Author: shiyao.wei
 * @Date: 2021/7/2 11:14
 * @Version: 1.0
 * @Desc:
 */
@FeignClient(name= "SPRING-CLOUD-PRODUCER", fallback = HelloRemoteFallBack.class)
public interface HelloRemote {
    @RequestMapping(value = "/hello")
    String hello(@RequestParam(value = "name") String name);
}
```

所有改动结束。

## 4. 测试

现在我们测试看下结果，老规矩，顺次启动注册中心Eureka、provider、consumer

访问上一节我们访问过的链接：[http://localhost:8081/hello/spring](http://localhost:8081/hello/spring)

现在可以看到页面正常显示：hello spring，producer is ready

现在我们手动把provider停掉，再访问一下链接看一下：

现在页面已经显示我们熔断后的信息了：hello spring, i am fallback massage

现在说明我们的测试已经成功了。

好了，现在可以将代码打包扔到Github上去了：）

[示例代码-Github](https://github.com/meteor1993/SpringCloudLearning/tree/master/chapter4)

参考：

[微服务框架Spring Cloud介绍 Part5: 在微服务系统中使用Hystrix, Hystrix Dashboard与Turbine](http://skaka.me/blog/2016/09/04/springcloud5/)

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

vs
