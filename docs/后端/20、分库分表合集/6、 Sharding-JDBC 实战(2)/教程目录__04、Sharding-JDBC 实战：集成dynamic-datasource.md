# 04、Sharding-JDBC 实战：集成dynamic-datasource
- 来源：https://ddkk.com/zhuanlan/sharding/shardingjdbc/2/4.html
- 分类：分库分表
- 分组：教程目录
## 实现原理：

- 通过 DataSourceConfig.java 将ShardingJDBC数据源配置为动态数据源之一。
- 通过 @DS(DataSourceConfig.SHARDING_DATA_SOURCE_NAME) 使用 ShardingJDBC 的数据源进行分表操作。

## 1.Maven依赖

```java
<!-- Sharding-JDBC -->
<dependency>
    <groupId>org.apache.shardingsphere</groupId>
    <artifactId>sharding-jdbc-spring-boot-starter</artifactId>
    <version>${shardingsphere.version}</version>
</dependency>
<!-- 动态数据源 -->
<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>dynamic-datasource-spring-boot-starter</artifactId>
    <version>3.3.2</version>
</dependency>
```

## 2.yml配置

```java
server:
  port: 8081
spring:
  多数据源配置
  datasource:
    dynamic:
      primary: mydb1
      datasource:
        mydb1:
          url: jdbc:mysql://localhost:3306/mydb1?useUnicode=true&characterEncoding=utf-8&useSSL=true&serverTimezone=UTC
          username: root
          password: root
          driver-class-name: com.mysql.cj.jdbc.Driver
  sharding-jdbc配置
  shardingsphere:
    打印sql
    props:
      sql:
        show: true
    datasource:
      names: mydb2
      mydb2:
        type: com.alibaba.druid.pool.DruidDataSource
        url: jdbc:mysql://localhost:3306/mydb2?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Shanghai
        driver-class-name: com.mysql.cj.jdbc.Driver
        username: root
        password: root
        数据源其他配置
        initialSize: 5
        minIdle: 5
        maxActive: 20
        maxWait: 60000
        timeBetweenEvictionRunsMillis: 60000
        minEvictableIdleTimeMillis: 300000
        validationQuery: SELECT 1 FROM DUAL
        testWhileIdle: true
        testOnBorrow: false
        testOnReturn: false
        poolPreparedStatements: true
        配置监控统计拦截的filters，去掉后监控界面sql无法统计，'wall'用于防火墙
       filters: stat,wall,log4j
        maxPoolPreparedStatementPerConnectionSize: 20
        useGlobalDataSourceStat: true
        connectionProperties: druid.stat.mergeSql=true;druid.stat.slowSqlMillis=500
    sharding:
      表策略配置
      tables:
        t_user 是逻辑表
        t_user:
          分表节点 可以理解为分表后的那些表 比如 t_user_1 ,t_user_2
          actualDataNodes: mydb2.t_user_$->{
     1..2}
          tableStrategy:
            inline:
              根据哪列分表
              shardingColumn: age
              分表算法 例如：age为奇数 -> t_user_2； age为偶数 -> t_user_1
              algorithmExpression: t_user_$->{
     age % 2 + 1}
#              keyGenerator:
#                type: SNOWFLAKE
#                对id列采用 sharding-jdbc的全局id生成策略
#                column: id
# mybatis-plus
mybatis-plus:
  mapper-locations: classpath*:/mapper/*Mapper.xml
  实体扫描，多个package用逗号或者分号分隔
  typeAliasesPackage: cn.demo.project.*.entity
  测试环境打印sql
  configuration:
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
```

## 3.DataSourceConfig.java

> DataSourceConfig作用： 将ShardingJDBC数据源配置为动态数据源之一。

```java
import com.baomidou.dynamic.datasource.DynamicRoutingDataSource;
import com.baomidou.dynamic.datasource.provider.AbstractDataSourceProvider;
import com.baomidou.dynamic.datasource.provider.DynamicDataSourceProvider;
import com.baomidou.dynamic.datasource.spring.boot.autoconfigure.DataSourceProperty;
import com.baomidou.dynamic.datasource.spring.boot.autoconfigure.DynamicDataSourceAutoConfiguration;
import com.baomidou.dynamic.datasource.spring.boot.autoconfigure.DynamicDataSourceProperties;
import org.apache.shardingsphere.shardingjdbc.jdbc.adapter.AbstractDataSourceAdapter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.AutoConfigureBefore;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.context.annotation.Primary;
import javax.annotation.Resource;
import javax.sql.DataSource;
import java.util.Map;
/**
 * <p> @Title DataSourceConfig
 * <p> @Description 动态数据源配置（切换为sharding-jdbc数据源 => @DS(DataSourceConfig.SHARDING_DATA_SOURCE_NAME)）
 *
 * @author ACGkaka
 * @date 2022/12/21 16:01
 */
@Configuration
@AutoConfigureBefore({
     DynamicDataSourceAutoConfiguration.class, SpringBootConfiguration.class})
public class DataSourceConfig {
    /**
     * 分表数据源名称
     */
    public static final String SHARDING_DATA_SOURCE_NAME = "sharding-data-source";
    /**
     * 动态数据源配置项
     */
    @Autowired
    private DynamicDataSourceProperties properties;
    /**
     * sharding-jdbc有四种数据源，需要根据业务注入不同的数据源
     * <p>
     * 1.未使用分片, 脱敏的名称(默认): shardingDataSource;
     * 2.主从数据源: masterSlaveDataSource;
     * 3.脱敏数据源：encryptDataSource;
     * 4.影子数据源：shadowDataSource
     */
    @Lazy
    @Resource(name = "shardingDataSource")
    private AbstractDataSourceAdapter shardingDataSource;
    @Bean
    public DynamicDataSourceProvider dynamicDataSourceProvider() {
        Map<String, DataSourceProperty> datasourceMap = properties.getDatasource();
        return new AbstractDataSourceProvider() {
            @Override
            public Map<String, DataSource> loadDataSources() {
                Map<String, DataSource> dataSourceMap = createDataSourceMap(datasourceMap);
                // 将 shardingjdbc 管理的数据源也交给动态数据源管理
                dataSourceMap.put(SHARDING_DATA_SOURCE_NAME, shardingDataSource);
                return dataSourceMap;
            }
        };
    }
    /**
     * 将动态数据源设置为首选的
     * 当spring存在多个数据源时, 自动注入的是首选的对象
     * 设置为主要的数据源之后，就可以支持sharding-jdbc原生的配置方式了
     */
    @Primary
    @Bean
    public DataSource dataSource(DynamicDataSourceProvider dynamicDataSourceProvider) {
        DynamicRoutingDataSource dataSource = new DynamicRoutingDataSource();
        dataSource.setPrimary(properties.getPrimary());
        dataSource.setStrict(properties.getStrict());
        dataSource.setStrategy(properties.getStrategy());
        dataSource.setProvider(dynamicDataSourceProvider);
        dataSource.setP6spy(properties.getP6spy());
        dataSource.setSeata(properties.getSeata());
        return dataSource;
    }
}
```

## 4.TUserService.java

```java
import com.demo.module.entity.TUser;
import com.baomidou.mybatisplus.extension.service.IService;
import java.util.List;
/**
 * <p>
 * 用户表 服务类
 * </p>
 *
 * @author ACGkaka
 * @since 2023-04-25
 */
public interface TUserService extends IService<TUser> {
    /**
     * 查询 全部用户（mydb1数据库）
     * @return 全部用户
     */
    List<TUser> listFromDB1();
}
```

## 5.TUserServiceImpl.java

```java
import com.baomidou.dynamic.datasource.annotation.DS;
import com.demo.module.config.DataSourceConfig;
import com.demo.module.entity.TUser;
import com.demo.module.mapper.TUserMapper;
import com.demo.module.service.TUserService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.stereotype.Service;
import java.util.List;
/**
 * <p>
 * 用户表 服务实现类
 * </p>
 *
 * @author ACGkaka
 * @since 2023-04-25
 */
@Service
@DS(DataSourceConfig.SHARDING_DATA_SOURCE_NAME)
public class TUserServiceImpl extends ServiceImpl<TUserMapper, TUser> implements TUserService {
    @DS("mydb1")
    @Override
    public List<TUser> listFromDB1() {
        // 查询 全部用户（mydb1数据库）
        return this.list();
    }
}
```

## 6.测试代码

```java
@Test
void saveTest() {
    List<TUser> users = new ArrayList<>(3);
    users.add(new TUser("ACGkaka_1", "123456", 10));
    users.add(new TUser("ACGkaka_2", "123456", 11));
    users.add(new TUser("ACGkaka_3", "123456", 12));
    userService.saveBatch(users);
}
@Test
void listTest() {
    List<TUser> users1 = userService.listFromDB1();
    System.out.println(">>>>>>>>>> 【Result1】<<<<<<<<<< ");
    users1.forEach(System.out::println);
    List<TUser> users2 = userService.list();
    System.out.println(">>>>>>>>>> 【Result2】<<<<<<<<<< ");
    users2.forEach(System.out::println);
}
```

## 7.测试结果

**查询没有数据插入的mydb1，没有查到数据：**

**查询插入了 3 条数据的mydb2，查询到了 3 条：**

测试成功，数据根据动态数据源配置实现了对 mydb1 和 mydb2 两个数据库的操作。

## 8.源码地址

> 地址：https://gitee.com/acgkaka/SpringBootExamples/tree/master/springboot-sharding-jdbc-dynamic

整理完毕，完结撒花~

参考地址：

**1、** SpringBoot(50)整合sharding-jdbc和多数据源，https://blog.csdn.net/qq_38225558/article/details/121107962；
