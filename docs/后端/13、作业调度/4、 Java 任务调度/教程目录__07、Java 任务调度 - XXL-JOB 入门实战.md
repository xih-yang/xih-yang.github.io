# 07、Java 任务调度 - XXL-JOB 入门实战
- 来源：https://ddkk.com/zhuanlan/job/job/1/7.html
- 分类：作业调度
- 分组：教程目录
在系统开发不可以避免的要使用到定时任务，简单的任务可以使用spring的@Scheduled注解或者quartz来实现，但对于复杂的任务最好使用分布式的调度框架来处理，这样可以部署集群，保证系统的扩展性及高可用性。本文主要介绍XXL-JOB的基本使用，详细说明请参考官方文档：https://www.xuxueli.com/xxl-job；文中使用到的软件及版本：XXL-JOB 2.2.0、SpringBoot 2.2.5.RELEASE、Java 1.8.0_191、MySQL 5.7。

## 1、@Scheduled及Quartz的不足

### 1.1、@Scheduled的不足

Spring的@Scheduled对于单机的简单任务使用起来很方便，但只能单节点运行，不利于横向扩展。

### 1.2、Quartz的不足

Quartz作为开源作业调度中的佼佼者，是作业调度的首选。但是集群环境中Quartz存在以下问题：

问题一：调用API的的方式操作任务，不人性化；

问题二：需要持久化业务QuartzJobBean到底层数据表中，系统侵入性相当严重；

问题三：调度逻辑和QuartzJobBean耦合在同一个项目中，这将导致一个问题，在调度任务数量逐渐增多，同时调度任务逻辑逐渐加重的情况下，此时调度系统的性能将大大受限于业务；

问题四：quartz底层以“抢占式”获取DB锁并由抢占成功节点负责运行任务，会导致节点负载悬殊非常大；

XXL-JOB弥补了quartz的上述不足之处。

## 2、XXL-JOB使用

### 2.1、下载源码

下载地址：https://github.com/xuxueli/xxl-job，下载后用idea打开：

### 2.2、初始化调度数据库

SQL脚本位置为：

```java
/xxl-job/doc/db/tables_xxl_job.sql
```

### 2.3、配置部署调度中心(xxl-job-admin)

#### 2.3.1、配置修改

配置文件路径为：

```java
/xxl-job/xxl-job-admin/src/main/resources/application.properties
```

修改配置文件中的数据库的相关信息，其他参数根据需要修改：

```java
spring.datasource.url=jdbc:mysql://10.49.196.10:3306/xxl_job?useUnicode=true&characterEncoding=UTF-8&autoReconnect=true&serverTimezone=Asia/Shanghai
spring.datasource.username=admin
spring.datasource.password=Root_123!
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
```

#### 2.3.2、部署调度中心

调度中心是一个SpringBoot的工程，在本地可以直接运行，或打成jar包到服务器上运行。

调度中心访问地址：http://localhost:8080/xxl-job-admin (该地址执行器将会使用到，作为回调地址)

默认登录账号：admin/123456

#### 2.3.3、调度中心集群部署

调度中心支持集群部署，提升调度系统容灾和可用性。

调度中心集群部署时，几点要求和建议：

　　DB配置保持一致；

　　集群机器时钟保持一致（单机集群忽视）；

　　建议：推荐通过nginx为调度中心集群做负载均衡，分配域名。调度中心访问、执行器回调配置、调用API服务等操作均通过该域名进行。

### 2.4、配置部署执行器项目

可以直接在运行XXL-JOB自带的样例执行器项目xxl-job-executor-sample-springboot(需要修改数据库等配置参数再运行)，这里自己使用SpringBoot来开发执行器。

#### 2.4.1、引入依赖

```java
<dependency>
    <groupId>com.xuxueli</groupId>
    <artifactId>xxl-job-core</artifactId>
    <version>2.2.0</version>
</dependency>
```

#### 2.4.2、执行器配置文件修改

拷贝/xxl-job/xxl-job-executor-samples/xxl-job-executor-sample-springboot/src/main/resources/application.properties中的配置信息到自己SpringBoot工程中的配置文件中，并根据需要修改对应的配置信息。

```java
# web port
server.port=8081
# no web
#spring.main.web-environment=false
# log config
logging.config=classpath:logback.xml
### xxl-job admin address list, such as "http://address" or "http://address01,http://address02"
xxl.job.admin.addresses=http://127.0.0.1:8080/xxl-job-admin
### xxl-job, access token
xxl.job.accessToken=
### xxl-job executor appname
xxl.job.executor.appname=xxl-job-executor-sample
### xxl-job executor registry-address: default use address to registry , otherwise use ip:port if address is null
xxl.job.executor.address=
### xxl-job executor server-info
xxl.job.executor.ip=10.49.196.58
xxl.job.executor.port=9999
### xxl-job executor log-path
xxl.job.executor.logpath=/data/applogs/xxl-job/jobhandler
### xxl-job executor log-retention-days
xxl.job.executor.logretentiondays=30
```

#### 2.4.3、执行器配置

```java
@Configuration
public class XxlJobConfig {
    private Logger logger = LoggerFactory.getLogger(XxlJobConfig.class);
    @Value("${xxl.job.admin.addresses}")
    private String adminAddresses;
    @Value("${xxl.job.accessToken}")
    private String accessToken;
    @Value("${xxl.job.executor.appname}")
    private String appname;
    @Value("${xxl.job.executor.address}")
    private String address;
    @Value("${xxl.job.executor.ip}")
    private String ip;
    @Value("${xxl.job.executor.port}")
    private int port;
    @Value("${xxl.job.executor.logpath}")
    private String logPath;
    @Value("${xxl.job.executor.logretentiondays}")
    private int logRetentionDays;
    @Bean
    public XxlJobSpringExecutor xxlJobExecutor() {
        logger.info(">>>>>>>>>>> xxl-job config init.");
        XxlJobSpringExecutor xxlJobSpringExecutor = new XxlJobSpringExecutor();
        xxlJobSpringExecutor.setAdminAddresses(adminAddresses);
        xxlJobSpringExecutor.setAppname(appname);
        xxlJobSpringExecutor.setAddress(address);
        xxlJobSpringExecutor.setIp(ip);
        xxlJobSpringExecutor.setPort(port);
        xxlJobSpringExecutor.setAccessToken(accessToken);
        xxlJobSpringExecutor.setLogPath(logPath);
        xxlJobSpringExecutor.setLogRetentionDays(logRetentionDays);
        return xxlJobSpringExecutor;
    }
    /**
     * 针对多网卡、容器内部署等情况，可借助 "spring-cloud-commons" 提供的 "InetUtils" 组件灵活定制注册IP；
     *
     *      1、引入依赖：
     *          <dependency>
     *             <groupId>org.springframework.cloud</groupId>
     *             <artifactId>spring-cloud-commons</artifactId>
     *             <version>${version}</version>
     *         </dependency>
     *
     *      2、配置文件，或者容器启动变量
     *          spring.cloud.inetutils.preferred-networks: 'xxx.xxx.xxx.'
     *
     *      3、获取IP
     *          String ip_ = inetUtils.findFirstNonLoopbackHostInfo().getIpAddress();
     */
}
```

可以直接拷贝/xxl-job/xxl-job-executor-samples/xxl-job-executor-sample-springboot/src/main/java/com/xxl/job/executor/core/config/XxlJobConfig.java到自己的工程中。

#### 2.4.4、部署执行器

执行器是一个SpringBoot的工程，在本地可以直接运行，或打成jar包到服务器上运行。

#### 2.4.5、执行器集群部署(可选)

执行器支持集群部署，提升调度系统可用性，同时提升任务处理能力。

执行器集群部署时，几点要求和建议：

　　执行器回调地址(xxl.job.admin.addresses)需要保持一致；执行器根据该配置进行执行器自动注册等操作。

　　同一个执行器集群内AppName(xxl.job.executor.appname)需要保持一致；调度中心根据该配置动态发现不同集群的在线执行器列表。

### 2.5、任务创建

#### 2.5.1、BEAN模式任务

任务以JobHandler方式维护在执行器端；前台结合"JobHandler"属性匹配执行器中任务。

##### 2.5.1.1、开发JobHandler

在执行器的项目中新建类，方法上增加@XxlJob注解即表示一个JobHandler。

```java
@Component
public class TestJob {
    protected static Logger logger = LoggerFactory.getLogger(TestJob.class);
    @XxlJob("testJobHandler")
    public ReturnT<String> testJobHandler(String param) throws Exception {
        XxlJobLogger.log("test-JOB, Hello World.");
        for (int i = 0; i < 5; i++) {
            //XxlJobLogger打印的日志可以在控制台查看
            XxlJobLogger.log("beat at:" + i);
            logger.info("beat at:" + i);
            TimeUnit.SECONDS.sleep(2);
        }
        return ReturnT.SUCCESS;
    }
}
```

##### 2.5.1.2、前台配置任务

JobHandler填的值对应上一步@XxlJob中的值。

#### 2.5.2、GLUE模式(Java)任务

任务以源码方式维护在调度中心；该模式的任务实际上是一段继承自IJobHandler的Java类代码，它在执行器项目中运行，可使用@Resource/@Autowire注入执行器里中的其他服务.

保存后在“操作”中点击GLUE IDE：
