# 08、Sharding-JDBC 实战；拓展分片算法
- 来源：https://ddkk.com/zhuanlan/sharding/shardingjdbc/3/8.html
- 分类：分库分表
- 分组：教程目录
上篇中提到可以通过spi机制拓展分布式序列算法,其实shardingjdbc很多核心组件和算法都支持自定义扩展。这篇说下通过spi机制拓展分片算法;

简单的说就是实现对应的接口，实现getType 方法和对应的分片类，然后就可以在配置文件中使用对应的类型了;

假设要扩展一个标准的分片算法

**1、** 首先自定义类，并实现StandardShardingAlgorithm，其他的组合或强制路由的算法需要实现其他的那2个接口；

```java
package com.example.shardingjdbcdemo.spi;
import lombok.SneakyThrows;
import org.apache.shardingsphere.sharding.api.sharding.standard.PreciseShardingValue;
import org.apache.shardingsphere.sharding.api.sharding.standard.RangeShardingValue;
import org.apache.shardingsphere.sharding.api.sharding.standard.StandardShardingAlgorithm;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Collection;
import java.util.Date;
import java.util.Map;
import java.util.Properties;
import java.util.concurrent.ConcurrentHashMap;
public class MonthStandardAlgorithm implements StandardShardingAlgorithm {
    private Properties properties = new Properties();
    private static final String MONTH_FORMAT = "month_pattern";
    private static final String DEFAULT_MONTH_FORMAT = "yyyy_MM";
    private SimpleDateFormat dateTimeFormatter;
    private Map<String,Boolean> tableExists = new ConcurrentHashMap<>();
    private static DateFormat parse = new SimpleDateFormat("yyyy-MM-dd'T'hh:mm:ss.SSS");
    @Override
    public Properties getProps() {
        return properties;
    }
    @Override
    public void setProps(Properties props) {
       this.properties = props;
    }
    @SneakyThrows
    @Override
    public String doSharding(Collection availableTargetNames, PreciseShardingValue shardingValue) {
        //拿到时间字符串
        String dateStr = shardingValue.getValue().toString();
        Date date = MonthStandardAlgorithm.parse.parse(dateStr);
        String realName = shardingValue.getLogicTableName() + "_" + dateTimeFormatter.format(date);
        Boolean exists = tableExists.get(realName);
        if(exists == null || !exists){
            //TODO 创建对应的表
        }
        return realName;
    }
    @Override
    public Collection<String> doSharding(Collection availableTargetNames, RangeShardingValue shardingValue) {
        //TODO 实现对应的逻辑
        return availableTargetNames;
    }
    @Override
    public void init() {
        String pattern = this.properties.getOrDefault(MONTH_FORMAT, DEFAULT_MONTH_FORMAT).toString();
        if(pattern.indexOf("mm") == -1 && pattern.indexOf("MM") == -1){
            throw new IllegalArgumentException(String.format("MONTH_FORMAT %s 格式错误",pattern));
        }
        dateTimeFormatter = new SimpleDateFormat(pattern);
    }
    @Override
    public String getType() {
        return "MONTH";
    }
}
```

**2、** 重新getType()方法，这里就定义了此算法的类型名称了，是可以直接配置在配置文件的；在系统初始化的时候会根据配置的类型通过spi进行查找；

**3、** 实现sharding方法，自行处理分片的相关的逻辑;；

**4、** 定义SPI文件；

在META-INF/services 下新增文件名为

org.apache.shardingsphere.sharding.spi.ShardingAlgorithm

文件内填充内容 com.example.shardingjdbcdemo.spi.MonthStandardAlgorithm (写自己的实现类)

**5、** 这样就可以按照正常的配置分片算法的类型为我们的自定义的类型了;；

完整配置

```java
spring:
  application:
    name: shardingjdbcDemo
  main:
    allow-bean-definition-overriding: true
  shardingsphere:
   数据源信息
    datasource:
     名称为dbsource-0的数据源
      dbsource-0:
        type: com.zaxxer.hikari.HikariDataSource
        driver-class-name: com.mysql.cj.jdbc.Driver
        jdbc-url: jdbc:mysql://127.0.0.1:3306/db1?serverTimezone=Asia/Shanghai&useUnicode=true&characterEncoding=utf8&useSSL=false
        username: root
        password: 123456
      names: dbsource-0
   规则的配置
    rules:
      sharding:
        tables:
         order表的规则
          t_order:
            actual-data-nodes: dbsource-0.t_order_$->{0..1}
           分表策略
            table-strategy:
             标准策略
              standard:
                sharding-column: user_id
                sharding-algorithm-name: order-alg
            keyGenerateStrategy:
              column: order_id
              keyGeneratorName: order-incr
         user表的配置
          t_user:
            actual-data-nodes: dbsource-0.t_user_$->{0..1}
            table-strategy:
             标准策略
              standard:
                sharding-column: user_id
                sharding-algorithm-name: user-alg
            keyGenerateStrategy:
              column: user_id
              keyGeneratorName: user-incr
          t_log:
            actual-data-nodes: dbsource-0.t_log_2022_0$->{1..9},dbsource-0.t_log_2022_$->{11..12}
            table-strategy:
             标准策略
              standard:
                sharding-column: log_time
                sharding-algorithm-name: log-alg
            keyGenerateStrategy:
              column: id
              keyGeneratorName: snowflake
       分片算法
        sharding-algorithms:
          order-alg:
            type: INLINE
            props:
              algorithm-expression: t_order_$->{user_id % 2}
          user-alg:
            type: INLINE
            props:
              algorithm-expression: t_user_$->{user_id % 2}
          log-alg:
            type: MONTH
            props:
              month_pattern: yyyy_MM
        binding-tables:
          - t_order,t_user
        keyGenerators:
          user-incr:
            type: INCREMENT
          order-incr:
            type: INCREMENT
          snowflake:
            type: SNOWFLAKE
            props:
              worker-id: 1
    props:
      sql-show: true
      sql-comment-parse-enabled: true
```
