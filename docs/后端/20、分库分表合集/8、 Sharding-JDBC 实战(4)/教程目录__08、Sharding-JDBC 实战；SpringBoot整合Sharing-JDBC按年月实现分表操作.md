# 08、Sharding-JDBC 实战；SpringBoot整合Sharing-JDBC按年月实现分表操作
- 来源：https://ddkk.com/zhuanlan/sharding/shardingjdbc/4/8.html
- 分类：分库分表
- 分组：教程目录
## 1、SpringBoot基础配置

框架搭建：SpringBoot + HikariCP/Druid + Mybatis + Mysql+sharding-jdbc

**1、POM依赖：**

```java
<dependency>
      <groupId>org.apache.shardingsphere</groupId>
      <artifactId>sharding-jdbc-spring-boot-starter</artifactId>
      <version>4.1.1</version>
</dependency>
```

**2、配置允许数据源覆盖**

`properties`文件加入以下配置

```java
# 允许数据源覆盖
spring.main.allow-bean-definition-overriding=true
```

**3、数据源配置**

数据源类型通常选择`DruidDataSource`或者`HikariDataSource`两者在配置上有所不同。

- DruidDataSource

```java
  <!-- 不能使用druid-spring-boot-starter，会导致：Property 'sqlSessionFactory' or 'sqlSessionTemplate' are required -->
   <dependency>
     <groupId>com.alibaba</groupId>
     <artifactId>druid</artifactId>
     <version>version</version>
   </dependency>
```

```java
 com.alibaba.druid.pool.DruidDataSource
 DruidDataSource需要引入druid的Jar包，使用：url
  spring.shardingsphere.datasource.m1.type=com.alibaba.druid.pool.DruidDataSource
  spring.shardingsphere.datasource.m1.url=
```

- HikariDataSource

```java
 com.zaxxer.hikari.HikariDataSource
 HikariDataSource要使用：jdbc-url
  spring.shardingsphere.datasource.m1.type=com.zaxxer.hikari.HikariDataSource
  spring.shardingsphere.datasource.m1.jdbc-url=
```

## 2、创建表

将用户(user)表，进行水平分表，分为：`user_202201,user_202202.... user_202212`

```java
//创建数据表
CREATE TABLE user_1/user_2/..../user_6 (
    id BIGINT(20) NOT NULL COMMENT 'Id',
    name VARCHAR(20) NOT NULL COMMENT '名称',
    phone VARCHAR(20) NOT NULL COMMENT '电话',
    email VARCHAR(20) NOT NULL COMMENT '邮箱',
    create_time TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '操作时间',
    PRIMARY KEY (id)
) 
```

## 3、完整properties配置

```java
server.port=9090
server.servlet.context-path=/demo
spring.application.name=sharding-jdbc-simple-demo
# 允许数据源覆盖
spring.main.allow-bean-definition-overriding=true
# MyBatis配置
# 搜索指定包别名
mybatis.typeAliasesPackage=com.lhz.sharding.model.entity
# 配置mapper的扫描，找到所有的mapper.xml映射文件
mybatis.mapperLocations=classpath*:mybatis/**/*.xml
#数据库类型
mybatis.configuration.database-id=mysql
#自动驼峰转换
mybatis.configuration.map-underscore-to-camel-case=true
#pagehelper  分页插件
pagehelper.helper-dialect=mysql
pagehelper.reasonable=false
pagehelper.support-methods-arguments=true
pagehelper.params=count=countSql
# 数据源名称，多数据源逗号隔开
spring.shardingsphere.datasource.names=m1
spring.shardingsphere.datasource.m1.type=com.zaxxer.hikari.HikariDataSource
spring.shardingsphere.datasource.m1.driver-class-name=com.mysql.cj.jdbc.Driver
spring.shardingsphere.datasource.m1.jdbc-url=jdbc:mysql://127.0.0.1:3307/shardingjdbc?useUnicode=true&useSSL=false&zeroDateTimeBehavior=convertToNull&characterEncoding=UTF-8&allowMultiQueries=true&serverTimezone=Asia/Shanghai
spring.shardingsphere.datasource.m1.username=root
spring.shardingsphere.datasource.m1.password=lhzlx
# 水平分表：user_202201、user_202202、user_202203..，多个表进行分表时，依次在tables标签后写逻辑
# user_202201、user_202202、user_202203... 为数据库中的事实表
# user为xml编码中操作的逻辑表，sharding-jdbc会自动根据策略操作事实表
# 配置节点分布情况，表示可以容纳user_202201到user_203212 张表，根据时间情况定
spring.shardingsphere.sharding.tables.user.actual-data-nodes=m1.user_$->{2022..2032}$->{(1..12).collect{t ->t.toString().padLeft(2,'0')}}
# 指定user表的主键生成策略为SNOWFLAKE
spring.shardingsphere.sharding.tables.user.key-generator.column=id
spring.shardingsphere.sharding.tables.user.key-generator.type=SNOWFLAKE
# 指定user表的分片策略，分片策略包括分片键和分片算法
# 配置表的分片策略
spring.shardingsphere.sharding.tables.user.table-strategy.standard.sharding-column=create_time
# 精确分片算法类名称，用于 = 和 IN。该类需实现 PreciseShardingAlgorithm 接口并提供无参数的构造器
spring.shardingsphere.sharding.tables.user.table-strategy.standard.precise-algorithm-class-name=\
  com.lhz.sharding.algorithm.DatePreciseShardingAlgorithm
# 范围分片算法类名称，用于 范围查询 可选。该类需实现 RangeShardingAlgorithm 接口并提供无参数的构造器
spring.shardingsphere.sharding.tables.user.table-strategy.standard.range-algorithm-class-name=\
  com.lhz.sharding.algorithm.DateRangeShardingAlgorithm
# 打开sql输出日志
spring.shardingsphere.props.sql.show=true
```

## 4、分片算法

### 4.1、精确分片算法

**DatePreciseShardingAlgorithm：**

```java
public class DatePreciseShardingAlgorithm implements PreciseShardingAlgorithm<Date> {
    /**
     * 精确匹配查询
     *
     * @param tbNames       数据库中所有的事实表
     * @param shardingValue 分片相关信息
     * @return 返回匹配的数据源
     */
    @Override
    public String doSharding(Collection<String> tbNames, PreciseShardingValue<Date> shardingValue) {
        String logicTableName = shardingValue.getLogicTableName();
        // 匹配满足当前分片规则的表名称
        Date date = shardingValue.getValue();
        Calendar cal = Calendar.getInstance();
        cal.setTime(date);
        int year = cal.get(Calendar.YEAR);
        int month = cal.get(Calendar.MONTH) + 1;
        String monthStr = month >= 10 ? month + "" : "0" + month;
        String value = year + monthStr;
        return logicTableName + "_" + value;
    }
}
```

### 4.2、范围分片算法

**DateRangeShardingAlgorithm：**

```java
public class DateRangeShardingAlgorithm implements RangeShardingAlgorithm<Date> {
    @Override
    public Collection<String> doSharding(Collection<String> tbNames, RangeShardingValue<Date> rangeShardingValue) {
        // 获取逻辑表名称
        String logicTableName = rangeShardingValue.getLogicTableName();
        // between and 的起始值，需要处理只有最大值或者只有最小值的情况
        boolean hasLowerBound = rangeShardingValue.getValueRange().hasLowerBound();
        boolean hasUpperBound = rangeShardingValue.getValueRange().hasUpperBound();
        long max = 0;
        long min = 0;
        // 只有最小值，比如：id > x
        if (hasLowerBound && !hasUpperBound) {
            Date lower = rangeShardingValue.getValueRange().lowerEndpoint();
            // 直接大于最小值的表
            String suffix = getSuffix(lower);
            min = Long.parseLong(suffix);
            // 获取最大的日期表
            ArrayList<String> arrayList = new ArrayList<>(tbNames);
            String maxSuffix = arrayList.get(tbNames.size() - 1).split("_")[1];
            max = Long.parseLong(maxSuffix);
        } else if (!hasLowerBound && hasUpperBound) {
            // 只有最大值，比如：id < x
            Date upper = rangeShardingValue.getValueRange().upperEndpoint();
            String suffix = getSuffix(upper);
            max = Long.parseLong(suffix);
            // 获取最小的日期表
            ArrayList<String> arrayList = new ArrayList<>(tbNames);
            String maxSuffix = arrayList.get(0).split("_")[1];
            min = Long.parseLong(maxSuffix);
        } else {
            // 区间值情况
            Date lower = rangeShardingValue.getValueRange().lowerEndpoint();
            Date upper = rangeShardingValue.getValueRange().upperEndpoint();
            String lowerSuffix = getSuffix(lower);
            String upperSuffix = getSuffix(upper);
            min = Long.parseLong(lowerSuffix);
            max = Long.parseLong(upperSuffix);
        }
        // 拼接事实表名称
        return matchMinAndMax(min, max, logicTableName);
    }
    private List<String> matchMinAndMax(long lower, long upper, String logicTableName) {
        List<String> tableNameList = new ArrayList<>();
        for (long index = lower; index <= upper; index++) {
            String tableName = logicTableName + "_" + index;
            tableNameList.add(tableName);
        }
        return tableNameList;
    }
    /**
     * 获取逻辑表后缀
     *
     * @param date
     * @return
     */
    private String getSuffix(Date date) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(date);
        int year = cal.get(Calendar.YEAR);
        int month = cal.get(Calendar.MONTH) + 1;
        String monthStr = month >= 10 ? month + "" : "0" + month;
        return year + monthStr;
    }
}
```

## 5、实体类

**User ：**

```java
@Data
public class User implements Serializable {
    private Long id;
    private String name;
    private String phone;
    private String email;
    private Date createTime;
}
```

## 6、Mapper类

**DateMapper：**

```java
@Mapper
public interface DateMapper {
    /**
     * 新增数据
     *
     * @param minTime
     * @param minTime
     * @return
     */
    List<User> listByRange(@Param("minTime") Date minTime, @Param("maxTime") Date maxTime);
    /**
     * @param user
     * @return
     */
    int insert(User user);
    /**
     * @param list
     * @return
     */
    int insertBatch(List<User> list);
}
```

**DateMapper.xml ：**

```java
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.lhz.sharding.mapper.DateMapper">
    <select id="listByRange"
            resultType="com.lhz.sharding.model.entity.User">
        select a.*
        from user a
        where a.create_time >={minTime}
          and a.create_time <={maxTime}
    </select>
    <insert id="insert" parameterType="com.lhz.sharding.model.entity.User">
        insert into user(id, name, phone, email, create_time)
        values (#{id},{name},{phone},{email},{createTime})
    </insert>
    <insert id="insertBatch" parameterType="com.lhz.sharding.model.entity.User">
        insert into user(id, name, phone, email,create_time)
        values
        <foreach collection="list" item="item" separator=",">
            (#{item.id},{item.name},{item.phone},{item.email},{item.createTime})
        </foreach>
    </insert>
</mapper>
```

## 7、Service类

**DateService:**

```java
@Service
public class DateService {
    @Resource
    private DateMapper dateMapper;
    /**
     * 范围查询
     *
     * @param minTime
     * @param maxTime
     * @return
     */
    public List<User> listByRange(Date minTime, Date maxTime) {
        return dateMapper.listByRange(minTime, maxTime);
    }
    /**
     * 新增数据
     *
     * @return
     */
    @ApiOperation(value = "新增数据", notes = "新增数据")
    @ApiOperationSupport(order = 25)
    @GetMapping("/insert")
    public int insert() {
        // 模拟数据
        List<User> list = new ArrayList<>();
        for (long a = 1; a <= 10; a++) {
            User user = new User();
            long id = new Random().nextInt(99999999);
            user.setId(id);
            user.setName("测试名称-" + a);
            user.setPhone("176-" + a);
            user.setEmail("123@com-" + a);
            user.setEmail("123@com-" + a);
            // 时间戳，从2022-01-01随机到2022-04-30
            long time = (16409664 + new Random().nextInt(102816)) * 100000L;
            user.setCreateTime(new Date(time));
            list.add(user);
        }
        // 批量新增
        dateMapper.insertBatch(list);
        // 单个新增
        User user = new User();
        long id = new Random().nextInt(99999999);
        user.setId(id);
        user.setName("测试名称-" + 999);
        user.setPhone("176-" + 999);
        user.setEmail("123@com-" + 999);
        // 时间戳，从2022-01-01随机到2022-04-30
        long time = (16409664 + new Random().nextInt(102816)) * 100000L;
        user.setCreateTime(new Date(time));
        return dateMapper.insert(user);
    }
}
```

## 8、Controller类

**DateController：**

```java
@RestController
@RequestMapping("date")
public class DateController {
    @Resource
    private DateService dateService;
    /**
     * 范围查询
     *
     * @return
     */
    @GetMapping("/listByRange")
    public List<User> listByRange() {
        // 模拟时间区间时间戳
        long minTime = 1644331100000L;
        long maxTime = 1651248000000L;
        return dateService.listByRange(new Date(minTime), new Date(maxTime));
    }
    /**
     * 新增数据
     *
     * @return
     */
    @GetMapping("/insert")
    public int insert() {
        return dateService.insert();
    }
}
```

## 9、测试

**1、查询：**

查询的时间范围从`2022-02-08 22:38:20` 到`2022-04-30 00:00:00`

所以设置的表分别为：`user_202202`,`user_202203`,`user_202204` 共三张

**2、新增：**

新增时的日期为`2022-01-08 03:06:40`，所以操作表`user_202201`
