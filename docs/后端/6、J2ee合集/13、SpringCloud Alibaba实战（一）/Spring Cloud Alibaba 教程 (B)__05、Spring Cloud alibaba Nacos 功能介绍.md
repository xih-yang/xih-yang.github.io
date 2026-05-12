# 05、Spring Cloud alibaba Nacos 功能介绍
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/1/31.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (B)
## 1. 背景

先来说说大背景。

现在，很明显的一个趋势就是：**微服务**。

这个趋势的底层驱动力就来源于分布式系统的普及，而微服务的各个特性是如今大大小小的企业无法拒绝的诱惑。

然后，用上了微服务的架构风格，用Spring Cloud，或者Dubbo搭了一套脚手架，就开始干起来了。

接下来，一众小公司画完了大饼之后，发现自己根本吃不下。这就是典型的落后劳动力与先进生产力的尖锐矛盾。这个时候，返璞归真的想法是不能有了，重构代价太大。

当然，哪里有问题，哪里就有商机。各大XX云厂商经过一系列包装之后，用**“云原生(Cloud Native)”**的新概念粉墨登场。

Spring Cloud Alibaba就是其中之一。

这个概念的一个核心价值就是：**平滑上云，赋能运维。**最明显的业务表象就是，会提供一套Open API，甚至是贴心的提供一个可视化控制台，傻瓜式的那种。

## 2. 从Nacos说起

这是一颗耀眼的掌上明珠，迅速引起了我的注意。

按照套路，分为两讲。其一讲述NACOS的功能特性，及其使用，再者就是更深入一步，看看大厂的攻城狮们写的代码。

本文所使用的版本是**NACOS 1.0.0**，由于此版本还是第一个NACOS正式版，NACOS正处在飞速发展阶段，本文的一些内容可能会不适用于以后的版本，请读者自行辨别。

NACOS解决两个核心问题：动态配置管理，服务注册发现。

兼容性方面，除了支持自家的Dubbo，还对Spring Cloud，Kubernetes，Istio有所兼容。

对照以上的全景图，现在的NACOS还有一段距离，但是并不遥远。

至此，不说道说道Eureka，都有点过意不去了。

我用下来的体验是：NACOS完全可以替代Eureka了。

江山代有才人出，这是必然的结果。

在“云原生”的大背景之下，NACOS顺利成章的推出了Console，将触角进一步延伸至服务的精细化管理。

当然，不排除Eureka也在憋大招。

再说说动态配置的特性。

当然，NACOS略胜一筹，可替代Spring Cloud Config了。

原先在Git/SVN上托管的配置项，都可以在Console上统一管理了。

如果想先睹为快，可以接下着往下读。如果想再多了解一些，可以直接跳过这部分，阅读下一个小节。

可以把NACOS理解成是一个中心化的服务，这在阿里系的架构中屡见不鲜。所以，必须得先启动这个服务。

有两个办法：其一是直接clone[源码](https%3A//github.com/alibaba/nacos)，使用maven打包。第二个办法是直接下载GitHub release出来的压缩包。

推荐后者。

**方法1：**主要运行以下命令：

```bash
git clone https://github.com/alibaba/nacos.git 
cd nacos/ 
mvn -Prelease-nacos clean install -U
```

经过一段时间的构建过程，在**./distribution/target**目录下有我们想要的压缩包。

**方法2：** 进入[https://github.com/alibaba/nacos/releases](https://github.com/alibaba/nacos/releases)，找到压缩包，下载。

为了演示，我们先用单机模式启动。

Windows环境下：startup.cmd -m standalone

一切就绪的话，访问[http://127.0.0.1:8848/nacos/index.html](http%3A//127.0.0.1%3A8848/nacos/index.html)，使用nacos/nacos登录。

接下来，随便逛逛。

## 3. 重要的概念

为了避免在Console中迷失自我，有必要先阐述几个重要的概念。

这张图很重要。表述了namespace、group和service/dataId的包含关系。

NACOS给的最佳实践表明，最外层的namespace是可以用于区分部署环境的，比如test，uat，product等。同时，也有一个商业利用价值：多租户。以namespace为单位，给用户开辟使用空间。

其它两个领域模型不用多解释了，见名知意。其目的也非常明显，就是为了能够逻辑上区分两个目标对象。

默认情况下，namespace=public，group=DEFAULT_GROUP。

明白了这个数据模型后，可以稍微玩转一下Console了，比如新建若干个namespace：

namespace顺利创建成功后，会在每个一级页面看到由namespace组成的TAB，可以任意切换namespace，对其下的数据进行操作。比如下图的配置列表：

当然，还有众多的领域模型，但是跟这一讲的关系不大了，下一讲深入源码的时候再进行剖析。接下来会创建一个Demo工程，用于构建基于NACOS的config server和discovery server。

在进行下一章节之前，强烈建议先创建一个Spring Boot样板工程，可以不做任何配置，不添加任何一段代码。

当然，为了让这一讲的内容更具实战意义，我不会照搬官网的Demo，本文所作的Demo工程也可以从[GitHub](https%3A//github.com/liu-weihao/nacos-example)上克隆得到。请提前准备好，接下来的内容只会挑重点讲解，侧重点不会在如何搭建工程。

## 4. 使用NACOS的搭建工程

工程名称为：nacos-example，在各个pom.xml文件中相关依赖管理就不再赘述了。

现在来介绍一下，这个demo工程干了一件什么事：用户在下单的时候，需要校验用户的状态，商品是否上架以及购买的数量上限。

为了体现动态配置，用户状态和购买的数量上限做成配置项。而这两者的配置在不同的namespace下是有所不同的。

为了体现服务间的调用，下单入口在order模块，经由user模块进行校验。

根据上述，NACOS服务启动好了后，我们分别创建dev，product两个namespace，在写spring boot配置的时候，填写的不是test，product这些namespace名称，而是ID，此ID会在namespace成功创建后，由系统自动分配，目前的生成规则就是随机的UUID函数。

这样的配置规则会存在很大的争议，本文不做讨论。

user模块需要动态配置，所以可以看作是一个config client。又因为需要接受order模块的调用，所以也是一个service provider。

同样的，order模块需要动态配置，所以也是一个config client。

至此，读者会发现一些NACOS带来的“弊病”，最显现的问题就是“多重角色”带来的侵入性。因为是中心化的架构，如果没有做到很好的解耦，出现这个问题也不足为奇了。

特别是在远程调用的角色分配上，NACOS严格遵从了“生产者-消费者”模型，在实际业务场景下，难免会有服务既是生产者，又是消费者，而Eureka是没有这种区分的。

接下来把目光转向配置。

阿里系的开源产品大多建议是用properties文件，由于个人习惯，我使用的是yml，达到的效果是一样的。

值得注意的是，因为需要更高优先级的加载顺序，所以配置文件必须使用bootstrap.yml。

user模块的配置文件，区分了环境，为了增加辨识度，也定义了group进行隔离。如下：

```bash
server:
  port: 8100
spring:
  application:
    name: user
  cloud:
    nacos:
      config:
        server-addr: 127.0.0.1:8848
        file-extension: yaml
        namespace: 7d3e5f19-a102-471a-b6e0-67bd7d1d35f3
        group: USER_GROUP
      discovery:
        server-addr: 127.0.0.1:8848
        namespace: 7d3e5f19-a102-471a-b6e0-67bd7d1d35f3
---
spring:
  profiles: prod
  cloud:
    nacos:
      config:
        server-addr: 11.162.196.16:8848
        namespace: c4c81555-91e1-4ef5-8b57-77c5407b3481
      discovery:
        server-addr: 11.162.196.16:8848
        namespace: c4c81555-91e1-4ef5-8b57-77c5407b3481
---
spring:
  profiles:
    active: dev
```

order模块的配置文件类似，不再赘述。

然后对自定义配置参数进行封装。如果只有单个参数，可以不用JavaBean的形式，但是绝大多数情况下都是多参数配置的，本文给出了JavaBean形式的封装。

user模块使用到的配置参数：

```java
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
@Getter
@Setter
@ConfigurationProperties(prefix = "user")
public class UserConfig {
    /**
     * 用户状态：enable-启用，disable-禁用
     */
    private String status;
}
```

order模块使用到的配置参数：

```java
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
@Getter
@Setter
@ConfigurationProperties(prefix = "order")
public class OrderConfig {
    /**
     * 最大购买数量
     */
    private int maxNum = Integer.MAX_VALUE;
    /**
     * 是否上架
     */
    private boolean onSale = true;
}
```

然后就是编写功能实现代码，主要入口在order模块中的OrderController：

```java
@RefreshScope
@RestController
@RequestMapping
public class OrderController {
    @Autowired
    private OrderConfig config;
    @Autowired
    private UserRpcService userRpcService;
    @PostMapping(value = "/order")
    public String placeOrder(@RequestParam(name = "num", defaultValue = "1") Integer num) {
        if (!"enable".equals(userRpcService.getUserStatus())) return "该用户已被禁用，暂不能下单";
        if (num <= 0) return "购买数量有误";
        if (!config.isOnSale()) return "商品未上架";
        if (num > config.getMaxNum()) return "购买数量超限";
        return "OK";
    }
}
```

一些列的下单校验，第一个校验是判断用户状态，使用了基于Feign的远程调用。当然，必须在user模块中提供对应的Controller实现：

```java
@RefreshScope
@RestController
@RequestMapping(value = "/user")
public class UserController {
    @Autowired
    private UserConfig config;
    @GetMapping(value = "/status")
    public String getUserStatus() {
        return config.getStatus();
    }
}
```

Controller中的@RefreshScope注解就是用来实现配置自动更新的。

整个工程准备就绪之后，先别急着run，还需要在Console中添加配置，用以测试动态配置是否生效。

添加配置的过程不再赘述，需要注意的是Data Id的填写规范。dataId的完整格式由三部分组成：

> ${prefix}-${spring.profile.active}.${file-extension}

**prefix**，默认使用${spring.application.name}，也可以通过spring.cloud.nacos.config.prefix来配置。

**spring.profile.active**，即为当前环境对应的 profile，详情可以参考 [Spring Boot文档](https://docs.spring.io/spring-boot/docs/current/reference/html/boot-features-profiles.html%23boot-features-profiles)。 注意：当 spring.profile.active 为空时，对应的连接符 - 也将不存在，dataId 的拼接格式变成 ${prefix}.${file-extension}

**file-exetension，**为配置内容的数据格式，可以通过配置项 spring.cloud.nacos.config.file-extension 来配置。目前只支持 properties 和 yaml 类型。

接下来就是分别启动order和user两个模块，随便玩玩。

## 5. 其他功能简介

NACOS会记录配置文件的历史版本，保留30天，同时还贴心的提供了一键回滚功能，回滚操作将会触发配置更新。

NACOS提供了配置监听的Open-API。注册监听采用的是异步 Servlet 技术。注册监听本质就是带着配置和配置值的 MD5 值和后台对比。如果 MD5 值不一致，就立即返回不一致的配置。如果值一致，就等待一定时间段，返回空值。

最后就是优雅上/下线功能，算是NACOS的一大亮点。在每个服务详情里面，可以有多个实例(instance)，通过Console可以控制每个实例的上/下线。如果是重新上线的话，会有一段时间的注册过程，并不是点击“上线”按钮之后就能立马访问到该实例。

## 6. NACOS的进阶功能

如果决定要将NACOS大规模投产，上述功能还远远满足不了条件。在这一章节，将会讲解若干个进阶功能，为你的NACOS服务保驾护航。

### 6.1 集群模式

只启动一个NACOS服务实例未免有些势单力薄了，前述内容都是在单机部署的前提下，这一小节教你如何部署一个NACOS集群。

找到conf/cluster.conf文件，如果没有，就新建。编辑里面的内容，仅需指定机器的ip和port，最好是3个或者3个以上。如果没有这么多机器资源，可以直接在一台机器上部署，区分端口号即可。如下：

```java
# ip:port
192.168.0.88:8848
192.168.0.88:8849
192.168.0.88:8840
```

请注意，在集群模式下就不能用127.0.0.1或者localhost了，当前版本对于网卡解析存在bug。

> 这个问题是因为Nacos获取本机IP时,没有获取到正确的外部IP.需要保证InetAddress.getLocalHost().getHostAddress()或者hostname -i的结果是与cluster.conf里配置的IP是一致的.

找到conf/application.properties，如果没有，说明有问题。编辑里面的内容，主要目的是启用MySQL作为存储层（目前仅支持MySQL）。在该文件末尾追加：

```java
spring.datasource.platform=mysql
db.num=1
db.url.0=jdbc:mysql://127.0.0.1:3306/nacos?characterEncoding=utf8&connectTimeout=1000&socketTimeout=3000&autoReconnect=true
db.user=root
db.password=123456
```

然后新建一个名为nacos的数据库，运行conf/nacos-mysql.sql脚本文件。

以上，就是运行NACOS集群模式所需的配置内容。

因为要在一台机器上模拟多个NACOS服务，可以将配置好的工程复制出两份，然后在conf/application.properties中修改端口号即可。

然后，分别在三个命令窗口启动NACOS：

```bash
startup -m cluster
```

分别使用对应的端口号访问Console，如果能顺利打开，说明部署成功了。

最后，在上述搭建的demo工程中，修改server-addr的值，把其他NACOS访问地址也加上去：

```bash
server:
  port: 8200
spring:
  application:
    name: order
  cloud:
    nacos:
      config:
        server-addr: 192.168.0.88:8848,192.168.0.88:8849,192.168.0.88:8840
        file-extension: yaml
        namespace: 7d3e5f19-a102-471a-b6e0-67bd7d1d35f3
        group: ORDER_GROUP
      discovery:
        server-addr: 192.168.0.88:8848,192.168.0.88:8849,192.168.0.88:8840
        namespace: 7d3e5f19-a102-471a-b6e0-67bd7d1d35f3
```

### 6.2 安全措施

很遗憾，NACOS的官网并没有就安全性进行详细的介绍。唯一看到的accessKey和secretKey两项疑似安全的配置项，却是为了配合阿里云的ACM而设立的。

让我最为关注的配置文件加密功能也暂未release出来，以下是官方原话：

> Nacos计划在1.X版本提供加密的能力，目前还不支持加密，只能靠sdk做好了加密再存到nacos中。

NACOS Console的安全性同样很糟糕，密码无法修改，用户不能创建，也没有角色、权限的概念。

NACOS的服务注册与发现基于HttpURLConnection进行远程调用，这个地方是提供了HTTPS的启用开关，JVM参数名是：com.alibaba.nacos.client.naming.tls.enable。

除此之外，目前只能在NACOS的外围做一些安全措施了。

### 6.3 一些有用的配置

**nacos.home**，这个是NACOS服务的启动参数，以JVM参数的形式传入。但是很遗憾，使用这个参数并不是很方便，需要修改启动脚本，大概是在startup.sh文件中的104行：

```bash
JAVA_OPT="${JAVA_OPT} -Dnacos.home=${BASE_DIR}"
```

更为彻底的方法是修改BASE_DIR的值（默认为startup.sh文件的父目录），大概在startup.sh文件中的71行：

```bash
export BASE_DIR=cd $(dirname $0)/..; pwd
```

**nacos.logging.path**，日志是一个系统运行最宝贵的附加产物，有的时候为了便于管理，需要自定义日志目录。如果需要指定，同样需要修改startup.sh脚本。大概在104行后追加一行：

```bash
JAVA_OPT="${JAVA_OPT} -Dnacos.logging.path=指定的目录"
```

当然，日志级别也能指定，分别通过com.alibaba.nacos.naming.log.level和com.alibaba.nacos.config.log.level这两个JVM参数指定。

不过，还需要特别说明一下，并非所有日志都是有价值的，可以根据实际情况进行删减，否则会对服务器造成不必要的负担，相关日志配置可以在**conf/nacos-logback.xml**文件中修改。

### 6.4 endpoint

在上述配置文件中所涉及的serverAddr参数是穷举了所有可用的NACOS服务，在大规模应用场景下，这种配置方式显然是不合理的。endpoint相当于一个DNS服务，可以代理所有NACOS服务，只需要指定一个访问域名。

[这篇文章](https%3A//nacos.io/zh-cn/blog/address-server.html)是对endpoint的一个最佳实践，并且给出了环境隔离的有效手段。

## 7. 总结

本文是对Spring Cloud Alibaba Nacos的功能性介绍。

如果研发能力强劲的队伍，可以尝尝这只“螃蟹”，顺带还能贡献不少的PR。

个人建议先观望一段时间，大概在v1.2.0版本之后，就可以逐渐引入到公司的技术栈内了。
