# Spring Boot 4.0 整合实战 - 阅读指南
- 来源：https://ddkk.com/springboot/4-action/index.html
- 分类：Spring Boot 4 整合教程
- 分组：一、核心框架与模板
- 日期：2025-12-08
兄弟们，鹏磊我这次整了个大活,把 Spring Boot 4 的整合教程都给你整理出来了，一共 46 篇，从基础框架到云原生部署，该有的都有了。

## 一、这是个啥教程？

这教程说白了就是教你怎么在 Spring Boot 4 里面整合各种常用技术栈的;现在 Spring Boot 4 刚出来没多久，很多兄弟还在用 2.x 或者 3.x,但是新版本确实有不少改进，而且以后肯定要升级的，早点学没坏处。

鹏磊我这些年做项目，基本上把常用的技术都整合过一遍了，什么 MyBatis、Redis、Kafka、微服务这些，踩过的坑也不少;所以我就想着把这些经验整理出来，做成一个系列教程，让兄弟们少走点弯路。

这个教程覆盖了企业级开发中常用的技术栈，从 Web 框架到数据持久化,从消息队列到微服务，从安全认证到监控运维，基本上你项目里能用到的，这里都有对应的整合教程;每篇教程都是实战为主，不是那种光讲理论的，都是能直接拿来用的代码。

## 二、教程都讲啥？

这个教程总共 46 篇，我按功能模块分成了 10 个部分：

**一、核心框架与模板**

Spring MVC、Thymeleaf、Freemarker、WebSocket、WebFlux这些基础玩意儿，不会这些别说你会Spring Boot

**二、数据访问与持久化**

MyBatis、MyBatisPlus、JPA/Hibernate、Spring Data JDBC、Redis、MongoDB、Elasticsearch，数据库相关的全套齐活

**三、消息队列**

Kafka、RabbitMQ、RocketMQ，异步处理消息队列这块也不能落下

**四、安全与认证**

Security、OAuth2、JWT、Shiro，安全这块现在可马虎不得，动不动就被黑

**五、微服务与云原生**

Spring Cloud Gateway、Nacos、OpenFeign、Sentinel、Dubbo、Eureka，搞微服务必备

**六、监控与运维**

Actuator、Prometheus、Admin、ELK、SkyWalking，线上出问题不监控咋整

**七、任务调度**

Quartz、XXL-Job、Spring Task，定时任务总得会吧

**八、API文档**

Swagger、Knife4j、OpenAPI，接口文档不写清楚，前端天天找你撕逼

**九、文件与存储**

MinIO、阿里云OSS、FTP，文件上传下载也是常见需求

**十、其他常用**

邮件、短信、验证码、支付、Docker、Kubernetes，这些零碎但又常用的也得会

### 一、核心框架与模板（1-5 章）

这部分主要讲 Spring Boot 4 的基础 Web 框架和模板引擎,包括 MVC、Thymeleaf、Freemarker，还有 WebSocket 和 WebFlux 这种响应式编程的。

**01、**[Spring Boot 4 整合 Spring MVC 完整教程](https://www.ddkk.com/springboot/4-action/1.html)；

**02、**[Spring Boot 4 整合 Thymeleaf 完整教程](https://www.ddkk.com/springboot/4-action/2.html)；

**03、**[Spring Boot 4 整合 Freemarker 完整教程](https://www.ddkk.com/springboot/4-action/3.html)；

**04、**[Spring Boot 4 整合 WebSocket 完整教程](https://www.ddkk.com/springboot/4-action/4.html)；

**05、**[Spring Boot 4 整合 WebFlux 完整教程](https://www.ddkk.com/springboot/4-action/5.html)；

### 二、数据访问与持久化（6-12 章）

数据库这块是项目的基础,这里涵盖了主流的 ORM 框架和 NoSQL 数据库，MyBatis、JPA、Redis、MongoDB、Elasticsearch 这些都有。

**06、**[Spring Boot 4 整合 MyBatis 完整教程](https://www.ddkk.com/springboot/4-action/6.html)；

**07、**[Spring Boot 4 整合 MyBatisPlus 完整教程](https://www.ddkk.com/springboot/4-action/7.html)；

**08、**[Spring Boot 4 整合 JPA/Hibernate 完整教程](https://www.ddkk.com/springboot/4-action/8.html)；

**09、**[Spring Boot 4 整合 Spring Data JDBC 完整教程](https://www.ddkk.com/springboot/4-action/9.html)；

**10、**[Spring Boot 4 整合 Redis 完整教程](https://www.ddkk.com/springboot/4-action/10.html)；

**11、**[Spring Boot 4 整合 MongoDB 完整教程](https://www.ddkk.com/springboot/4-action/11.html)；

**12、**[Spring Boot 4 整合Elasticsearch 完整教程](https://www.ddkk.com/springboot/4-action/12.html)；

### 三、消息队列（13-15 章）

异步消息处理这块,Kafka、RabbitMQ、RocketMQ 这三个主流消息队列都给你整上了，看你们公司用哪个就学哪个;你瞅瞅哪个顺眼就用哪个呗。

**13、**[Spring Boot 4 整合 Kafka 完整教程](https://www.ddkk.com/springboot/4-action/13.html)；

**14、**[Spring Boot 4 整合 RabbitMQ 完整教程](https://www.ddkk.com/springboot/4-action/14.html)；

**15、**[Spring Boot 4 整合 RocketMQ 完整教程](https://www.ddkk.com/springboot/4-action/15.html)；

### 四、安全与认证（16-19 章）

安全这块不能马虎,Spring Security、OAuth2、JWT、Shiro 这些认证授权框架都给你安排上了。

**16、**[Spring Boot 4 整合 Security 完整教程](https://www.ddkk.com/springboot/4-action/16.html)；

**17、**[Spring Boot 4 整合 OAuth2 完整教程](https://www.ddkk.com/springboot/4-action/17.html)；

**18、**[Spring Boot 4 整合 JWT 完整教程](https://www.ddkk.com/springboot/4-action/18.html)；

**19、**[Spring Boot 4 整合 Shiro 完整教程](https://www.ddkk.com/springboot/4-action/19.html)；

### 五、微服务与云原生（20-25 章）

现在微服务是主流,Spring Cloud 全家桶肯定得会，Gateway、Nacos、OpenFeign、Sentinel、Dubbo、Eureka 这些组件都给你整明白了。

**20、**[Spring Boot 4 整合 Spring Cloud Gateway 完整教程](https://www.ddkk.com/springboot/4-action/20.html)；

**21、**[Spring Boot 4 整合 Nacos 完整教程](https://www.ddkk.com/springboot/4-action/21.html)；

**22、**[Spring Boot 4 整合 OpenFeign 完整教程](https://www.ddkk.com/springboot/4-action/22.html)；

**23、**[Spring Boot 4 整合 Sentinel 完整教程](https://www.ddkk.com/springboot/4-action/23.html)；

**24、**[Spring Boot 4 整合 Dubbo 完整教程](https://www.ddkk.com/springboot/4-action/24.html)；

**25、**[Spring Boot 4 整合 Eureka 完整教程](https://www.ddkk.com/springboot/4-action/25.html)；

### 六、监控与运维（26-30 章）

项目上线了得监控啊,Actuator、Prometheus、Admin、ELK、SkyWalking 这些监控工具都得会用，不然出问题了都不知道咋回事;别到时候出事了还一脸懵逼。

**26、**[Spring Boot 4 整合 Actuator 完整教程](https://www.ddkk.com/springboot/4-action/26.html)；

**27、**[Spring Boot 4 整合 Prometheus 完整教程](https://www.ddkk.com/springboot/4-action/27.html)；

**28、**[Spring Boot 4 整合 Admin 完整教程](https://www.ddkk.com/springboot/4-action/28.html)；

**29、**[Spring Boot 4 整合 ELK 完整教程](https://www.ddkk.com/springboot/4-action/29.html)；

**30、**[Spring Boot 4 整合 SkyWalking 完整教程](https://www.ddkk.com/springboot/4-action/30.html)；

### 七、任务调度（31-33 章）

定时任务这块,Quartz、XXL-Job、Spring Task 这三个常用的调度框架都给你整上了，看你们项目需求选哪个。

**31、**[Spring Boot 4 整合 Quartz 完整教程](https://www.ddkk.com/springboot/4-action/31.html)；

**32、**[Spring Boot 4 整合 XXL-Job 完整教程](https://www.ddkk.com/springboot/4-action/32.html)；

**33、**[Spring Boot 4 整合 Spring Task 完整教程](https://www.ddkk.com/springboot/4-action/33.html)；

### 八、API文档（34-36 章）

接口文档这块,Swagger、Knife4j、OpenAPI 这三个工具都给你整明白了，写接口文档不用再手写了。

**34、**[Spring Boot 4 整合 Swagger 完整教程](https://www.ddkk.com/springboot/4-action/34.html)；

**35、**[Spring Boot 4 整合 Knife4j 完整教程](https://www.ddkk.com/springboot/4-action/35.html)；

**36、**[Spring Boot 4 整合 OpenAPI 完整教程](https://www.ddkk.com/springboot/4-action/36.html)；

### 九、文件与存储（37-39 章）

文件存储这块,MinIO、阿里云 OSS、FTP 这三个常用的存储方案都给你整上了，看你们公司用哪个。

**37、**[Spring Boot 4 整合 MinIO 完整教程](https://www.ddkk.com/springboot/4-action/37.html)；

**38、**[Spring Boot 4 整合 阿里云OSS 完整教程](https://www.ddkk.com/springboot/4-action/38.html)；

**39、**[Spring Boot 4 整合 FTP 完整教程](https://www.ddkk.com/springboot/4-action/39.html)；

### 十、其他常用（40-46 章）

最后这部分是一些常用的功能,邮件、短信、验证码、支付接口这些，还有 Docker 和 Kubernetes 这种容器化部署的。

**40、**[Spring Boot 4 整合 邮件 完整教程](https://www.ddkk.com/springboot/4-action/40.html)；

**41、**[Spring Boot 4 整合 短信接口 完整教程](https://www.ddkk.com/springboot/4-action/41.html)；

**42、**[Spring Boot 4 整合 验证码 完整教程](https://www.ddkk.com/springboot/4-action/42.html)；

**43、**[Spring Boot 4 整合 支付宝支付接口 完整教程](https://www.ddkk.com/springboot/4-action/43.html)；

**44、**[Spring Boot 4 整合 微信支付接口 完整教程](https://www.ddkk.com/springboot/4-action/44.html)；

**45、**[Spring Boot 4 整合 Docker 完整教程](https://www.ddkk.com/springboot/4-action/45.html)；

**46、**[Spring Boot 4 整合 Kubernetes 完整教程](https://www.ddkk.com/springboot/4-action/46.html)；

## 三、适合谁看？

这个教程主要适合这几类人：

1. **刚接触 Spring Boot 4 的兄弟**：如果你之前用的是 2.x 或者 3.x,想升级到 4.0，这个教程能帮你快速上手新版本的整合方式;
2. **需要快速整合某个技术的兄弟**：比如你项目里突然要用 Kafka 了，但是之前没整过,直接看对应的教程就能快速搞定。
3. **想系统学习 Spring Boot 整合的兄弟**：如果你想把常用的技术栈都学一遍,这个系列教程能给你一个完整的路线图。
4. **做企业级项目的兄弟**：如果你在做企业级项目，需要整合各种技术栈,这个教程能帮你少踩很多坑;
5. **准备面试的兄弟**：面试的时候经常问 Spring Boot 整合各种框架的问题,这个教程能帮你快速复习。

不过话说回来，如果你对 Spring Boot 基础都不太熟,建议先补补基础再来，不然可能有点吃力;别到时候看半天看不懂，那就尴尬了。

## 四、怎么用这个教程？

这个教程用起来挺简单的，主要就是按需学习：

1. **按顺序学**：如果你想系统学习,可以按照章节顺序一篇一篇看，从基础框架到高级特性，循序渐进;
2. **按需学习**：如果你项目里需要整合某个技术,直接找到对应的章节看就行，不用从头开始。
3. **动手实践**：每篇教程都有完整的代码示例,建议你跟着敲一遍，光看不练肯定不行;别光看不动手，那样学不会的。
4. **遇到问题**：如果整合过程中遇到问题,可以看看教程里有没有提到，或者去对应的技术社区问问。
5. **版本注意**：这个教程是基于 Spring Boot 4.0 的,如果你用的是其他版本，可能有些配置不太一样，需要自己调整一下。

另外，鹏磊我在写这些教程的时候,尽量把常见的坑都标注出来了，但是每个项目的情况不一样,可能还会遇到其他问题，这时候就需要你自己去查资料或者调试了;别指望啥问题都能在教程里找到答案，有时候还是得靠自己。

## 五、最后说几句

这个教程前前后后整了挺长时间的,基本上把 Spring Boot 4 常用的整合都覆盖了;鹏磊我写这些教程的初衷就是想让兄弟们少走点弯路，毕竟我踩过的坑不想让你们再踩一遍。

当然，技术这东西更新很快,可能过段时间又有新的版本或者新的整合方式了，但是基本的思路和原理不会变，学会了这些,以后遇到新的技术也能快速上手;技术再怎么变，底层逻辑还是那些东西。

最后，如果这个教程对你有帮助,记得给鹏磊我点个赞，或者分享给需要的兄弟;如果有什么问题或者建议，也可以在评论区留言，我看到会回复的。

好了，废话不多说了,开始学习吧，兄弟们加油！
