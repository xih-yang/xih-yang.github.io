# 21、Spring Data JPA 实战 - DataSource与JPA属性配置
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/1/21.html
- 分类：ORM框架
- 分组：教程目录
### 1、SpringBoot 2.2.x默认使用的DataSource

SpringBoot 2.2.x版本，默认使用的DataSource是HikariCP，可以直接通过注入DataSource，并打印出打印全限定名，可以查看。

或可以通过查看自动配置源码，来找到： @SpringBootApplication -> @EnableAutoConfiguration 所在jar包的META-INF/spring.factories中可以找到org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration-> 进入JpaRepositoriesAutoConfiguration后发现需要先配置HibernateJpaAutoConfiguration -> 进入HibernateJpaAutoConfiguration后发现需要先配置DataSourceAutoConfiguration -> 进入DataSourceAutoConfiguration后发现导入了DataSourcePoolMetadataProvidersConfiguration配置，点进入发现SpringBoot为我们提供了三种默认配置，Tomcat提供的jdbc、HikariCP、阿帕奇提供的Dbcp2，使用那个看引入的那个jar包了，通过maven依赖关系可以知道spring-boot-starter-data-jpa中引入了

spring-boot-starter-jdbc，而spring-boot-starter-jdbc中引用的是HikariCP，所以默认使用的是HikariCP。

```java
@Configuration(proxyBeanMethods = false)
public class DataSourcePoolMetadataProvidersConfiguration {
    @Configuration(proxyBeanMethods = false)
    @ConditionalOnClass(org.apache.tomcat.jdbc.pool.DataSource.class)
    static class TomcatDataSourcePoolMetadataProviderConfiguration {
        @Bean
        DataSourcePoolMetadataProvider tomcatPoolDataSourceMetadataProvider() {
            return (dataSource) -> {
                org.apache.tomcat.jdbc.pool.DataSource tomcatDataSource = DataSourceUnwrapper.unwrap(dataSource,
                        org.apache.tomcat.jdbc.pool.DataSource.class);
                if (tomcatDataSource != null) {
                    return new TomcatDataSourcePoolMetadata(tomcatDataSource);
                }
                return null;
            };
        }
    }
    @Configuration(proxyBeanMethods = false)
    @ConditionalOnClass(HikariDataSource.class)
    static class HikariPoolDataSourceMetadataProviderConfiguration {
        @Bean
        DataSourcePoolMetadataProvider hikariPoolDataSourceMetadataProvider() {
            return (dataSource) -> {
                HikariDataSource hikariDataSource = DataSourceUnwrapper.unwrap(dataSource, HikariDataSource.class);
                if (hikariDataSource != null) {
                    return new HikariDataSourcePoolMetadata(hikariDataSource);
                }
                return null;
            };
        }
    }
    @Configuration(proxyBeanMethods = false)
    @ConditionalOnClass(BasicDataSource.class)
    static class CommonsDbcp2PoolDataSourceMetadataProviderConfiguration {
        @Bean
        DataSourcePoolMetadataProvider commonsDbcp2PoolDataSourceMetadataProvider() {
            return (dataSource) -> {
                BasicDataSource dbcpDataSource = DataSourceUnwrapper.unwrap(dataSource, BasicDataSource.class);
                if (dbcpDataSource != null) {
                    return new CommonsDbcp2DataSourcePoolMetadata(dbcpDataSource);
                }
                return null;
            };
        }
    }
}
```

如果想使用另外两个连接池，只需要在pom中添加对应的依赖，并在properties中通过spring.datasource.type指定全限定名即可。

### 2、DataSource的相关配置

我们通过DataSourceAutoConfiguration类上的@EnableConfigurationProperties(DataSourceProperties.class)，可以知道相关的配置在DataSourceProperties类中，都是以spring.datasource开头的属性配置。

name：数据源的名称，使用嵌入式数据库时，默认名称是testdb。

generateUniqueName：是否生成随机数据源名称。

type：要使用的连接池实现的完全限定名。默认情况下，它是从类路径自动检测的。

driverClassName：JDBC驱动程序的完全限定名。默认情况下根据URL自动检测。

url：数据库的JDBC URL。

username：数据库登录用户名。

password：数据库登录密码。

jndiName：数据源的JNDI位置。设置时将忽略类、url、用户名和密码。

initializationMode：使用可用的DDL和DML脚本初始化数据源，默认使用嵌入式数据库时使用。

platform：要在DDL或DML脚本中使用的平台（例如schema-${Platform}.sql或data-${Platform}.sql）。

schema：DDL脚本资源位置。进行该配置后，每次启动程序，程序都会运行指定的sql文件，对数据库的结构进行操作。

schemaUsername：执行DDL脚本的数据库用户名。

schemaPassword：执行DDL脚本的数据库密码。

data：DML脚本资源位置。进行该配置后，每次启动程序，程序都会运行定的sql文件，对数据库的数据操作。

dataUsername：执行DML脚本的数据库用户名。

dataPassword：执行DML脚本的数据库密码。

continueOnError：如果初始化数据库时发生错误，是否停止。默认false

separator： SQL初始化脚本中的语句分隔符。

sqlScriptEncoding：SQL脚本编码。

xa：xa相关设置。

### 3、Spring-Boot中使用druid连接池

阿里的druid连接池使用者很多，而且提供了监控功能，使用起来也很方便。在pom中添加druid-spring-boot-starter依赖即可。主要的类是DruidDataSourceAutoConfigure，里面就配置了一个DruidDataSourceWrapper，兼容了DataSourceProperties的配置。连接池的相关配置可以在DruidDataSource和DruidAbstractDataSource中看到默认的配置。

```xml
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>druid-spring-boot-starter</artifactId>
    <version>${druid-spring-boot-starter.version}</version>
</dependency>
```

3.1、连接池通用配置

```java
#druid连接池的配置
#初始化连接大小
spring.datasource.druid.initial-size=1
#最小连接数
spring.datasource.druid.min-idle=1
#最大连接数
spring.datasource.druid.max-active=20
#获取连接等待超时的时间
spring.datasource.druid.max-wait=60000
#间隔多久才进行一次检测，检测需要关闭的空闲连接，单位是毫秒
spring.datasource.druid.time-between-eviction-runs-millis=60000
#一个连接在池中最小生存的时间，单位是毫秒
spring.datasource.druid.min-evictable-idle-time-millis=300000
#打开PSCache，并且指定每个连接上PSCache的大小
spring.datasource.druid.pool-prepared-statements=true
spring.datasource.druid.max-pool-prepared-statement-per-connection-size=20
#如果有initial-size数量较多时，打开会加快应用启动时间
spring.datasource.druid.async-init=true
#监控统计拦截的filters，属性类型是字符串，通过别名的方式配置扩展插件，常用的插件有：监控统计用的filter:stat；日志用的filter:log4j；防御SQL注入的filter:wall
spring.datasource.druid.filters=stat
```

3.2、druid还为我们提供了监控功能，配置如下：

```java
#druid监控配置
#StatViewServlet配置，说明请参考Druid Wiki，配置_StatViewServlet配置
spring.datasource.druid.stat-view-servlet.enabled=true
#配置url-pattern来访问内置监控页面
spring.datasource.druid.stat-view-servlet.url-pattern=/druid/*
#是否允许清空统计数据
spring.datasource.druid.stat-view-servlet.reset-enable=true
#用户名和密码
spring.datasource.druid.stat-view-servlet.login-username=druid
spring.datasource.druid.stat-view-servlet.login-password=druid
#白名单，如果allow没有配置或者为空，则允许所有访问
#spring.datasource.druid.stat-view-servlet.allow=127.0.0.1
#黑名单，deny优先于allow，如果在deny列表中，就算在allow列表中，也会被拒绝
#spring.datasource.druid.stat-view-servlet.deny=127.0.0.1
# WebStatFilter配置，说明请参考Druid Wiki，配置_配置WebStatFilter
spring.datasource.druid.web-stat-filter.enabled=true
spring.datasource.druid.web-stat-filter.url-pattern=/*
#排除一些不必要的url，比如*.js,/js/*等等
spring.datasource.druid.web-stat-filter.exclusions=*.js,*.gif,*.jpg,*.png,*.css,*.ico,/druid/*
#session统计功能
spring.datasource.druid.web-stat-filter.session-stat-enable=true
#spring.datasource.druid.web-stat-filter.session-stat-max-count=
#spring.datasource.druid.web-stat-filter.principal-session-name=
#spring.datasource.druid.web-stat-filter.principal-cookie-name=
#spring.datasource.druid.web-stat-filter.profile-enable=
# Spring监控配置，说明请参考Druid Github Wiki，配置_Druid和Spring关联监控配置
# Spring监控AOP切入点，如x.y.z.service.*,配置多个英文逗号分隔
spring.datasource.druid.aop-patterns=cn.caofanqi.study.studyspringdatajpa.controller.*
```

配置后，启动项目访问 [http://localhost:8080/druid/index.html](http://localhost:8080/druid/index.html) 如下：

3.3、多数据源配置

application.properties配置文件中添加连接池配置。

```java
#数据源1配置
spring.datasource.druid.one.driver-class-name=com.mysql.jdbc.Driver
spring.datasource.druid.one.url=jdbc:mysql://localhost:3306/study-spring-data-jpa1?characterEncoding=UTF-8&useSSL=false
spring.datasource.druid.one.username=root
spring.datasource.druid.one.password=root
spring.datasource.druid.one.initial-size=1
spring.datasource.druid.one.min-idle=1
spring.datasource.druid.one.max-active=10
spring.datasource.druid.one.max-wait=10000
#数据源2配置
spring.datasource.druid.two.driver-class-name=com.mysql.jdbc.Driver
spring.datasource.druid.two.url=jdbc:mysql://localhost:3306/study-spring-data-jpa2?characterEncoding=UTF-8&useSSL=false
spring.datasource.druid.two.username=root
spring.datasource.druid.two.password=root
spring.datasource.druid.two.initial-size=2
spring.datasource.druid.two.min-idle=2
spring.datasource.druid.two.max-active=20
spring.datasource.druid.two.max-wait=20000
```

JavaConfig配置

```java
/**
 * 多数据源配置
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
@Configuration
@Profile("multi-datasource")
public class MultiDataSourceConfig {
    @Primary
    @Bean(initMethod = "init")
    @ConfigurationProperties("spring.datasource.druid.one")
    public DataSource dataSourceOne(){
        return DruidDataSourceBuilder.create().build();
    }
    @Bean(initMethod = "init")
    @ConfigurationProperties("spring.datasource.druid.two")
    public DataSource dataSourceTwo(){
        return DruidDataSourceBuilder.create().build();
    }
}
```

测试用例：

```java
/**
 * 多数据源测试
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
@SpringBootTest
@ActiveProfiles("multi-datasource")
class MultiDataSourceConfigTest {
    @Resource
    private DruidDataSource dataSourceOne;
    @Resource
    private DruidDataSource dataSourceTwo;
    @Test
    void testDataSourceOne(){
        assertThat(dataSourceOne.getUrl()).isEqualTo("jdbc:mysql://localhost:3306/study-spring-data-jpa1?characterEncoding=UTF-8&useSSL=false");
        assertThat(dataSourceOne.getUsername()).isEqualTo("root");
        assertThat(dataSourceOne.getPassword()).isEqualTo("root");
        assertThat(dataSourceOne.getDriverClassName()).isEqualTo("com.mysql.jdbc.Driver");
        assertThat(dataSourceOne.getInitialSize()).isEqualTo(1);
        assertThat(dataSourceOne.getMinIdle()).isEqualTo(1);
        assertThat(dataSourceOne.getMaxActive()).isEqualTo(10);
        assertThat(dataSourceOne.getMaxWait()).isEqualTo(10000);
    }
    @Test
     void testDataSourceTwo() {
        assertThat(dataSourceTwo.getUrl()).isEqualTo("jdbc:mysql://localhost:3306/study-spring-data-jpa2?characterEncoding=UTF-8&useSSL=false");
        assertThat(dataSourceTwo.getUsername()).isEqualTo("root");
        assertThat(dataSourceTwo.getPassword()).isEqualTo("root");
        assertThat(dataSourceTwo.getDriverClassName()).isEqualTo("com.mysql.jdbc.Driver");
        assertThat(dataSourceTwo.getInitialSize()).isEqualTo(2);
        assertThat(dataSourceTwo.getMinIdle()).isEqualTo(2);
        assertThat(dataSourceTwo.getMaxActive()).isEqualTo(20);
        assertThat(dataSourceTwo.getMaxWait()).isEqualTo(20000);
    }
}
```

更多druid请看 https://github.com/alibaba/druid/tree/master/druid-spring-boot-starter

### 4、Jpa相关属性配置

主要在JpaProperties和HibernateProperties中。

JpaProperties类：

properties：Jpa提供商的本地属性。

mappingResources：映射资源（相当于persistence.xml中的“Mapping file”）

databasePlatform：要操作的目标数据库的名称，默认情况下自动检测。也可以使用“Database”枚举类设置。

database：要操作的目标数据库，默认情况下自动检测。也可以使用“databasePlatform”属性进行设置。

generateDdl：是否在启动时初始化ddl（根据实体生成表结构），默认不初始化。

showSql：是否打印SQL，默认不显示。

openInView：注册OpenEntityManagerInViewInterceptor。在请求的整个处理过程中将JPA EntityManager绑定到线程。

HibernateProperties类：

naming：命名策略。

ddlAuto：DDL模式。这实际上是“hibernate.hbm2ddl.auto”属性的快捷方式。在使用嵌入式数据库且未检测到架构管理器时，默认为“create-drop”。否则，默认为“none”。

useNewIdGeneratorMappings：是否使用Hibernate新的IdentifierGenerator来实现AUTO、TABLE和SEQUENCE。这实际上是“hibernate.id.new_generator_mappings”属性的快捷方式。未指定时将默认为“true”。

源码地址：https://github.com/caofanqi/study-spring-data-jpa
