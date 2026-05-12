# 20、SpringBoot 实战 - 集成 Druid 连接池
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/5/20.html
- 分类：J2EE框架
- 分组：教程目录
## 一、简介

### 1.定义

`Druid数据库连接池`：是一个 Java 语言编写的高性能、高可用性的开源数据库连接池组件，有阿里巴巴开发和维护。它提供了一种可靠的、可管理的、高性能的数据库连接池解决方案，可以在 Java 应用程序中管理和复用数据库连接。

**GitHub地址：**[https://github.com/alibaba/druid](https://github.com/alibaba/druid)

**官方文档：**[https://github.com/alibaba/druid/wiki/Druid连接池介绍](https://github.com/alibaba/druid/wiki/Druid%E8%BF%9E%E6%8E%A5%E6%B1%A0%E4%BB%8B%E7%BB%8D)

**常见问题：**[https://github.com/alibaba/druid/wiki/常见问题](https://github.com/alibaba/druid/wiki/%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98)

**starter文档：**[https://github.com/alibaba/druid/tree/master/druid-spring-boot-starter](https://github.com/alibaba/druid/tree/master/druid-spring-boot-starter)

**监控页面：**[http://localhost:8080/druid/index.html](http://localhost:8080/druid/index.html)

### 2.特点

以下是Druid连接池组件的特点：

**1、**`基于开放标准`：Druid连接池完全遵循Java数据库连接标准（JDBC），可以与任何标准的JDBC驱动程序一起使用；

**2、**`高性能`：Druid连接池采用了一系列优化策略和技术，包括连接池预热、连接池缓存、合理的连接分配等，以提供高并发、低延迟的数据库连接服务；

**3、**`监控和统计`：Druid连接池提供了一套完善的监控和统计功能，可以实时监控连接池的使用情况、性能指标以及SQL执行情况，方便开发人员进行系统调优和性能优化；

**4、**`安全可靠`：Druid连接池通过内置的防火墙和黑名单机制，可以预防恶意攻击和SQL注入等安全威胁，保证系统的安全可靠性；

**5、**`扩展性强`：Druid连接池支持定制化扩展，可以根据具体业务场景和需求进行灵活的配置和编程；

### 3.连接池配置说明

配置
缺省值
说明

name

配置这个属性的意义在于，如果存在多个数据源，监控的时候可以通过名字来区分开。
如果没有配置，将会生成一个名字，格式是：“DataSource-” + System.identityHashCode(this)。

jdbcUrl

连接数据库的url，不同数据库不一样。例如：
mysql：jdbc:mysql://127.0.0.1:3306/mydb
oracle：jdbc:oracle:thin:@127.0.0.1:1521:mydb

username

连接数据库的用户名。

password

连接数据库的密码。如果你不希望密码直接卸载配置文件中，可以使用 ConfigFilter。详细看这里：https://github.com/alibaba/druid/wiki/使用ConfigFilter。

driverClassName
根据url自动识别
选配，如果不配置，druid 会根据 url 自动识别 dbType，然后选择相应的 driverClassName（建议配置下）。

initialSize
0
初始化时建立物理连接的个数。初始化发生在显示调用 init 方法，或者第一次 getConnection 时。

maxActive
8
最大连接池数量。

maxIdle
8
已经不再使用，配置了也没效果。

minIdle

最小连接池数量。

maxWait

获取连接时最大等待时间，单位毫秒。配置了 maxWait 之后，缺省启用公平锁，并发效率会有所下降，如果需要可以通过配置 useUnfairLock 属性为 true 使用非公平锁。

poolPreparedStatements
false
是否缓存 preparedStatement，也就是 PSCache。PSCache 对支持游标的数据库性能提升巨大，比如说 oracle，在 mysql 下建议关闭。

maxOpenPreparedSatements
-1
要启用 PSCache，必须配置大于0，当大于0时，poolPreparedStatements 自动触发修改为 true。在 Druid 中，不会存在 Oracle 下 PSCache 占用内存过多的问题，可以把这个数值配置大一些，比如说 100。

validationQuery

用来检测连接是否有效的sql，要求是一个查询语句，如果 validationQuery 为 null，testOnBorrow、testOnReturn、testWhileIdle 都不会起作用。

testOnBorrow
true
申请连接时执行 validationQuery 检测连接是否有效，做这个配置会降低性能。

testOnReturn
false
归还连接时执行 validationQuery 检测连接是否有效，做这个配置会降低性能。

testWhileIdle
false
建议配置为 true，不影响性能，并且保证安全性。申请连接的时候检测，如果空闲时间大于 timeBetweenEvictionRunsMillis，执行 validationQuery 检测连接是否有效。

timeBetweenEvictionRunsMillis

有两个含义：
1）Destroy 线程会检测连接的间隔时间。2）testWhileIdle的判断依据，详细看 testWhileIdle 属性的说明。

numTestsPerEvictionRun

不再使用，一个 DruidDataSource 只支持一个 EvictionRun。

minEvictableIdleTimeMillis

connectionInitSqls

物理连接初始化的时候执行的sql。

exceptionSorter
根据 dbType 自动识别
当数据抛出一些不可恢复的异常时，抛弃连接。

filters

属性类型是字符串，通过别名的方式配置扩展插件，常用的插件有：
监控统计用的 filter: stat，日志用的 filter: log4j，预防 sql 注入的 filter: wall

proxyFilters

类型是 List，如果同时配置了 filters 和 proxyFilters，是组合关系，并非替换关系。

### 4.竞品对比

以下是各种数据库连接池对比：

功能类别
功能
Druid
HikariCP
DBCP
Tomcat-jdbc
C3P0

性能
PSCache
是
否
是
是
是

LRU
是
否
是
是
是

SLB负载均衡支持
是
否
否
否
否

稳定性
ExceptionSorter
是
否
否
否
否

扩展
扩展
Filter

JdbcIntercepter

监控
监控方式
jmx/log/http
jmx/metrics
jmx
jmx
jmx

支持SQL级监控
是
否
否
否
否

Spring/Web关联监控
是
否
否
否
否

诊断支持
LogFilter
否
否
否
否

连接泄露诊断
logAbandoned
否
否
否
否

安全
SQL防注入
是
无
无
无
无

支持配置加密
是
否
否
否
否

## 二、搭建测试项目

**源码地址：**[https://gitee.com/acgkaka/SpringBootExamples/tree/master/springboot-mybatis-plus-druid](https://gitee.com/acgkaka/SpringBootExamples/tree/master/springboot-mybatis-plus-druid)

### 1.Maven依赖

Druid 的 Maven 依赖有两种，`单独依赖`和`starter依赖`，这里由于我们是 SpringBoot 集成，所以使用 `starter依赖`。

**单独依赖：**

```xml
<!-- Druid -->
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>druid</artifactId>
    <version>1.1.12</version>
</dependency>
```

**starter依赖：**

```xml
<!-- Druid -->
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>druid-spring-boot-starter</artifactId>
    <version>1.1.18</version>
</dependency>
```

### 2.yaml配置

**官方配置示例：**[https://github.com/alibaba/druid/blob/master/druid-spring-boot-starter/src/test/resources/application.properties](https://github.com/alibaba/druid/blob/master/druid-spring-boot-starter/src/test/resources/application.properties)

**注意：**`spring.datasource.type` 并不一定是必须要填的，取决于使用的是 druid 的哪种依赖。

- 如果使用的是 Druid 的 单独依赖，则必须要设置 spring.datasource.type=com.alibaba.druid.pool.DruidDataSource，否则默认还是使用 Hikari 连接池。
- 如果使用的是 Druid 的 starter依赖，则不需要手动设置 type，会自动将数据库连接池切换为 Druid。

而且 `druid-spring-boot-starter` 不需要编写配置类，简化了配置。

下面是使用 Druid 的 `starter依赖` 集成后的配置内容：

**官方配置文档：**[https://github.com/alibaba/druid/tree/master/druid-spring-boot-starter](https://github.com/alibaba/druid/tree/master/druid-spring-boot-starter)

#### 2.1 JDBC配置

**方式一：配置在 spring.datasource 下**

```java
spring:
  datasource:
    JDBC 配置
    url: jdbc:mysql://localhost:3306/mydb?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Shanghai
    username: root
    password: root
    driver-class-name: com.mysql.cj.jdbc.Driver
```

**方式二：配置在 spring.datasource.druid 下**

```java
spring:
  datasource:
    druid:
      JDBC 配置
      url: jdbc:mysql://localhost:3306/mydb?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Shanghai
      username: root
      password: root
      driver-class-name: com.mysql.cj.jdbc.Driver
```

#### 2.2 连接池配置

```java
spring:
  datasource:
    druid:
     连接池配置-开始#####
      initial-size: 5初始化大小
      min-idle: 5最小连接数
      max-active: 20最大连接数
      max-wait: 60000配置获取连接等待超时的时间
      pool-prepared-statements: true是否缓存preparedStatement，也就是PSCache。PSCache对支持游标的数据库性能提升巨大，比如说oracle。在mysql5.5以下的版本中没有PSCache功能，建议关闭掉。5.5及以上版本有PSCache，建议开启。
      max-pool-prepared-statement-per-connection-size: 20配置PSCache的大小
      validation-query: SELECT 1 FROM DUAL用来检测连接是否有效的sql，要求是一个查询语句，常用SELECT 1 FROM DUAL
      validation-query-timeout: 3000检测连接是否有效的超时时间，单位是秒。底层调用jdbc Statement对象的void setQueryTimeout(int seconds)方法
      test-on-borrow: false申请连接时执行validationQuery检测连接是否有效，做了这个配置会降低性能
      test-on-return: false是否在归还到池中前进行检验
      test-while-idle: true是否在连接池空闲一段时间后检验连接有效性
      time-between-eviction-runs-millis: 60000配置间隔多久才进行一次检测，检测需要关闭的空闲连接，单位是毫秒
      min-evictable-idle-time-millis: 300000配置一个连接在池中最小生存的时间，单位是毫秒
      max-evictable-idle-time-millis: 600000配置连接池中连接，在时间段内一直空闲，被逐出连接池的时间，单位毫秒。在minEvictableIdleTimeMillis基础上扩展，会在minEvictableIdleTimeMillis基础上判断连接是否空闲（默认逐出时间就是minEvictableIdleTimeMillis）
     max-open-prepared-statements:和上面的等价
        配置监控统计拦截的filters，去掉后监控界面sql无法统计，'wall'用于防火墙
     filters: stat,wall,log4j
      use-global-data-source-stat: true是否使用统计
      connection-properties: druid.stat.mergeSql=true;druid.stat.slowSqlMillis=5000合并多个DruidDataSource的监控数据
     连接池配置-结束#####
```

#### 2.3 监控配置

```java
spring:
  datasource:
    druid:
     连接池监控配置-开始#####
      WebStatFilter配置，说明请参考Druid Wiki，配置_配置WebStatFilter
      web-stat-filter:
        enabled: true是否启用StatFilter，默认值false
        url-pattern: '/*'需要拦截的url
        exclusions: '*.js,*.gif,*.jpg,*.png,*.css,*.ico,/druid/*'过滤器忽略的资源
        session-stat-enable: true是否开启session统计功能，默认值false
        session-stat-max-count: 1000session统计最大值
        principal-session-name:session用户信息
        principal-cookie-name:session用户cookie名称
        profile-enable: true监控单个url调用的sql列表
      StatViewServlet配置，说明请参考Druid Wiki，配置_StatViewServlet配置
      stat-view-servlet:
        enabled: true是否启用StatViewServlet（监控页面）默认值为false（考虑到安全问题默认并未启动，如需启用建议设置密码或白名单以保障安全）
        url-pattern: /druid/*监控页面拦截url
        reset-enable: false是否启用重置功能
        login-username: admin监控页面登录用户名
        login-password: admin监控页面登录用户密码
       StatViewSerlvet展示出来的监控信息比较敏感，是系统运行的内部情况，如果你需要做访问控制，可以配置allow和deny这两个参数
       deny优先于allow，如果在deny列表中，就算在allow列表中，也会被拒绝。如果allow没有配置或者为空，则允许所有访问
       配置的格式
       <IP>或者<IP>/<SUB_NET_MASK_size>其中128.242.127.1/24，配置多个英文逗号分隔
       24表示，前面24位是子网掩码，比对的时候，前面24位相同就匹配,不支持IPV6。
        allow:监控页面白名单
        deny:黑名单
      Spring监控配置，说明请参考Druid Github Wiki，配置_Druid和Spring关联监控配置
     aop-patterns: com.demo.*.service.*Spring监控AOP切入点，如x.y.z.service.*,配置多个英文逗号分隔
     连接池监控配置-结束#####
```

**配置内容涉及参考地址：**

- web-stat-filter：[https://github.com/alibaba/druid/wiki/配置_配置WebStatFilter](https://github.com/alibaba/druid/wiki/%E9%85%8D%E7%BD%AE_%E9%85%8D%E7%BD%AEWebStatFilter)
- stat-view-servlet：[https://github.com/alibaba/druid/wiki/配置_StatViewServlet配置](https://github.com/alibaba/druid/wiki/%E9%85%8D%E7%BD%AE_StatViewServlet%E9%85%8D%E7%BD%AE)
- aop-patterns：[https://github.com/alibaba/druid/wiki/配置_Druid和Spring关联监控配置](https://github.com/alibaba/druid/wiki/%E9%85%8D%E7%BD%AE_Druid%E5%92%8CSpring%E5%85%B3%E8%81%94%E7%9B%91%E6%8E%A7%E9%85%8D%E7%BD%AE)

**补充：**

- 如果需要 Spring 监控，除了配置 aop-patterns 之外，还需要引入 spring-boot-starter-aop 依赖，否则 Spring 监控页面会一片空白。

## 三、测试

### 1.查看监控页面

**监控页面地址：**[http://localhost:8081/druid/index.html](http://localhost:8081/druid/index.html)

访问监控页面，输入账号密码，如果页面中的参数和配置的参数一致，则说明集成成功。

### 2.单元测试

**DemoApplicationTests.java**

```java
package com.demo;
import com.alibaba.druid.pool.DruidDataSource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import javax.sql.DataSource;
import java.sql.Connection;
@SpringBootTest
class DemoApplicationTests {
    @Autowired
    DataSource dataSource;
    /**
     * 验证数据库连接
     * @throws Exception
     */
    @Test
    void testConnection() throws Exception {
        // 默认：class com.zaxxer.hikari.HikariDataSource
        // Druid：class com.alibaba.druid.spring.boot.autoconfigure.DruidDataSourceWrapper
        System.out.println(dataSource.getClass());
        Connection connection = dataSource.getConnection();
        // 默认：HikariProxyConnection@1323996324 wrapping com.mysql.cj.jdbc.ConnectionImpl@7c281eb8
        // Druid：com.mysql.cj.jdbc.ConnectionImpl@3166f664
        System.out.println(connection);
        connection.close();
    }
    /**
     * 验证连接池的配置信息，是否生效
     * @throws Exception
     */
    @Test
    void contextLoads() throws Exception {
        System.out.println(dataSource.getClass());
        DruidDataSource druidDataSource = (DruidDataSource) dataSource;
        System.out.println("initSize:" + druidDataSource.getInitialSize());
        System.out.println("maxSize:" + druidDataSource.getMaxActive());
        Connection connection = dataSource.getConnection();
        System.out.println(connection);
        connection.close();
    }
}
```

**连接测试结果：**

引入Druid 连接池依赖之前，执行连接测试，结果如下：（默认使用的是 `Hikari` 连接池）

引入Druid 连接池依赖之后，执行连接测试，结果如下：（改为使用的是 `Druid` 连接池）

**配置测试结果：**

使用Druid 连接池之后，测试结果如下：

我们可以看到代码打印的结果与我们的配置一致，说明配置正常生效了。

**源码地址：**[https://gitee.com/acgkaka/SpringBootExamples/tree/master/springboot-mybatis-plus-druid](https://gitee.com/acgkaka/SpringBootExamples/tree/master/springboot-mybatis-plus-druid)

## 四、补充：

### 1.如何打印慢SQL？

想要在日志中输出慢SQL日志，首先需要进行如下配置：

```java
spring:
  datasource:
    druid:
      filter:
        stat:
          enabled: true是否启用统计
          slow-sql-millis: 5000慢SQL记录，默认值为3000，单位毫秒
          log-slow-sql: true是否打印慢日志
          merge-sql: true是否合并SQL
          db-type: mysql数据库类型，用于支持统计分析
```

除此之外，还需要再 `filters` 属性中加入项目使用的日志框架，如：`log4j` 或者 `slf4j`，并引入对应依赖。

**logback.xml配置：**

```xml
<!--druid start-->
<appender name="DruidFile"
          class="ch.qos.logback.core.rolling.RollingFileAppender">
    <File>${LOG_HOME:-d:/}logs/slow_sql/slow_sql.log</File>
    <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
        <FileNamePattern>${LOG_HOME:-d:/}logs/slow_sql/slow_sql-%d{yyyy-MM-dd}.%i.log
        </FileNamePattern>
        <MaxHistory>60</MaxHistory>
        <TimeBasedFileNamingAndTriggeringPolicy
                class="ch.qos.logback.core.rolling.SizeAndTimeBasedFNATP">
            <MaxFileSize>5MB</MaxFileSize>
        </TimeBasedFileNamingAndTriggeringPolicy>
    </rollingPolicy>
    <layout class="ch.qos.logback.classic.PatternLayout">
        <pattern>[%-5level] %d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %logger{36} - %msg%n
        </pattern>
    </layout>
    <filter class="ch.qos.logback.classic.filter.LevelFilter"><!-- 只打印错误日志 -->
        <level>ERROR</level>
        <onMatch>ACCEPT</onMatch>
        <onMismatch>DENY</onMismatch>
    </filter>
</appender>
<logger name="com.alibaba.druid.filter.stat.StatFilter" additivity="false">
    <!-- 这里可以按需配置日志级别 -->
    <level value="error" />
    <appender-ref ref="DruidFile" />
</logger>
<!--druid end-->
```

**慢SQL日志：**

根据logback.xml 配置，会产生慢 SQL 日志 `slow_sql.log`，内容如下所示：

```java
[ERROR] 2022-08-30 22:44:15.651 [http-nio-8080-exec-1] c.a.druid.filter.stat.StatFilter - slow sql 4698 millis. SELECT  id,name,no,create_time,update_time  FROM user[]
[ERROR] 2022-08-30 22:57:15.183 [http-nio-8080-exec-2] c.a.druid.filter.stat.StatFilter - slow sql 3645 millis. SELECT  id,name,no,create_time,update_time  FROM user[]
```

### 2.去除广告

Druid 的监控页面下方有阿里云的广告，可以通过代码去除。

创建`DruidAdConfig.java` 配置类：

```java
import com.alibaba.druid.spring.boot.autoconfigure.DruidDataSourceAutoConfigure;
import com.alibaba.druid.spring.boot.autoconfigure.properties.DruidStatProperties;
import com.alibaba.druid.util.Utils;
import org.springframework.boot.autoconfigure.AutoConfigureAfter;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import javax.servlet.*;
import java.io.IOException;
/**
 * Druid广告配置
 *
 * @author zzp
 */
@Configuration
@ConditionalOnWebApplication
@AutoConfigureAfter(DruidDataSourceAutoConfigure.class)
@ConditionalOnProperty(
        name = "spring.datasource.druid.stat-view-servlet.enabled",
        havingValue = "true",
        matchIfMissing = true)
public class DruidAdConfig {
    /**
     * 去除监控页面底部广告
     *
     * @param properties
     * @return org.springframework.boot.web.servlet.FilterRegistrationBean
     */
    @Bean
    public FilterRegistrationBean removeDruidAdFilterRegistrationBean(
            DruidStatProperties properties) {
        // 获取web监控页面的参数
        DruidStatProperties.StatViewServlet config = properties.getStatViewServlet();
        // 提取common.js的配置路径
        String pattern = config.getUrlPattern() != null ? config.getUrlPattern() : "/druid/*";
        String commonJsPattern = pattern.replaceAll("\\*", "js/common.js");
        final String filePath = "support/http/resources/js/common.js";
        // 创建filter进行过滤
        Filter filter =
                new Filter() {
                    @Override
                    public void init(FilterConfig filterConfig) throws ServletException {
     }
                    @Override
                    public void doFilter(
                            ServletRequest request, ServletResponse response, FilterChain chain)
                            throws IOException, ServletException {
                        chain.doFilter(request, response);
                        // 重置缓冲区，响应头不会被重置
                        response.resetBuffer();
                        // 获取common.js
                        String text = Utils.readFromResource(filePath);
                        // 正则替换banner, 除去底部的广告信息
                        text = text.replaceAll("<a.*?banner\"></a><br/>", "");
                        text = text.replaceAll("powered.*?shrek.wang</a>", "");
                        response.getWriter().write(text);
                    }
                    @Override
                    public void destroy() {
     }
                };
        FilterRegistrationBean registrationBean = new FilterRegistrationBean();
        registrationBean.setFilter(filter);
        registrationBean.addUrlPatterns(commonJsPattern);
        return registrationBean;
    }
}
```

### 3.如何手动获取监控内容

**官方说明：**[https://github.com/alibaba/druid/tree/master/druid-spring-boot-starter](https://github.com/alibaba/druid/tree/master/druid-spring-boot-starter)

- Druid 的监控数据可以在开启 StatFilter 后通过 DruidStatManagerFacade 进行获取。
- 获取到监控数据之后你可以将其暴露给你的监控系统进行使用。Druid 默认的监控系统数据也来源于此。

下面做一个简单的演示，在 SpringBoot 中国你如何通过 HTTP 接口将 Druid 监控数据以 JSON 的形式暴露出去，实际使用中你可以根据你的需要自动地对监控数据、暴露方式进行扩展。

```java
import com.alibaba.druid.stat.DruidStatManagerFacade;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
@RestController
public class DruidStatController {
    @GetMapping("/druidStat")
    public Object druidStat(){
        // DruidStatManagerFacade#getDataSourceStatDataList 该方法可以获取所有数据源的监控数据，
        // 除此之外 DruidStatManagerFacade 还提供了一些其他方法，你可以按需选择使用。
        return DruidStatManagerFacade.getInstance().getDataSourceStatDataList();
    }
}
```

**返回结果如下：**

详细内容如下：

```java
[
  {
    "Identity": 2122837918,
    "Name": "DataSource-2122837918",
    "DbType": "mysql",
    "DriverClassName": "com.mysql.cj.jdbc.Driver",
    "URL": "jdbc:mysql://localhost:3306/mydb?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Shanghai",
    "UserName": "root",
    "FilterClassNames": [
      "com.alibaba.druid.filter.stat.StatFilter"
    ],
    "WaitThreadCount": 0,
    "NotEmptyWaitCount": 0,
    "NotEmptyWaitMillis": 0,
    "PoolingCount": 5,
    "PoolingPeak": 5,
    "PoolingPeakTime": "2023-07-08T16:29:24.569+0000",
    "ActiveCount": 0,
    "ActivePeak": 0,
    "ActivePeakTime": null,
    "InitialSize": 5,
    "MinIdle": 5,
    "MaxActive": 20,
    "QueryTimeout": 0,
    "TransactionQueryTimeout": 0,
    "LoginTimeout": 0,
    "ValidConnectionCheckerClassName": "com.alibaba.druid.pool.vendor.MySqlValidConnectionChecker",
    "ExceptionSorterClassName": "com.alibaba.druid.pool.vendor.MySqlExceptionSorter",
    "TestOnBorrow": false,
    "TestOnReturn": false,
    "TestWhileIdle": true,
    "DefaultAutoCommit": true,
    "DefaultReadOnly": null,
    "DefaultTransactionIsolation": null,
    "LogicConnectCount": 0,
    "LogicCloseCount": 0,
    "LogicConnectErrorCount": 0,
    "PhysicalConnectCount": 5,
    "PhysicalCloseCount": 0,
    "PhysicalConnectErrorCount": 0,
    "DiscardCount": 0,
    "ExecuteCount": 0,
    "ExecuteUpdateCount": 0,
    "ExecuteQueryCount": 0,
    "ExecuteBatchCount": 0,
    "ErrorCount": 0,
    "CommitCount": 0,
    "RollbackCount": 0,
    "PSCacheAccessCount": 0,
    "PSCacheHitCount": 0,
    "PSCacheMissCount": 0,
    "StartTransactionCount": 0,
    "TransactionHistogram": [
      0,
      0,
      0,
      0,
      0,
      0,
      0
    ],
    "ConnectionHoldTimeHistogram": [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0
    ],
    "RemoveAbandoned": false,
    "ClobOpenCount": 0,
    "BlobOpenCount": 0,
    "KeepAliveCheckCount": 0,
    "KeepAlive": false,
    "FailFast": false,
    "MaxWait": 60000,
    "MaxWaitThreadCount": -1,
    "PoolPreparedStatements": true,
    "MaxPoolPreparedStatementPerConnectionSize": 20,
    "MinEvictableIdleTimeMillis": 300000,
    "MaxEvictableIdleTimeMillis": 600000,
    "LogDifferentThread": true,
    "RecycleErrorCount": 0,
    "PreparedStatementOpenCount": 0,
    "PreparedStatementClosedCount": 0,
    "UseUnfairLock": false,
    "InitGlobalVariants": false,
    "InitVariants": false
  }
]
```

整理完毕，完结撒花~ 🌻

参考地址：

**1、** Springboot整合druid，https://blog.csdn.net/qq_51133939/article/details/126248389；

**2、** SpringBoot配置Druid，https://blog.csdn.net/promsing/article/details/126446143；

**3、** Springboot集成Druid，https://blog.csdn.net/qq_34285557/article/details/125945877；

**4、** druid慢sql监控，https://blog.csdn.net/xixingzhe2/article/details/126614581；
