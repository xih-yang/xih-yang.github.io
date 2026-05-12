# 06、Sharding-JDBC 实战；SpringBoot整合Sharding-JDBC通过标准分片策略(Standard)实现分表操作
- 来源：https://ddkk.com/zhuanlan/sharding/shardingjdbc/4/6.html
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

将用户(user)表，进行水平分表，分为：`user_1,user_2 .... user_6`

```java
//创建数据表
CREATE TABLE user_1/user_2/..../user_6 (
    id BIGINT(20) NOT NULL COMMENT 'Id',
    name VARCHAR(20) NOT NULL COMMENT '名称',
    phone VARCHAR(20) NOT NULL COMMENT '电话',
    email VARCHAR(20) NOT NULL COMMENT '邮箱',
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
#sharding-jdbc 水平分表规则配置，使用Standard模式
# 数据源名称，多数据源逗号隔开
spring.shardingsphere.datasource.names=m1
spring.shardingsphere.datasource.m1.type=com.zaxxer.hikari.HikariDataSource
spring.shardingsphere.datasource.m1.driver-class-name=com.mysql.cj.jdbc.Driver
spring.shardingsphere.datasource.m1.jdbc-url=jdbc:mysql://127.0.0.1:3307/shardingjdbc?useUnicode=true&useSSL=false&zeroDateTimeBehavior=convertToNull&characterEncoding=UTF-8&allowMultiQueries=true&serverTimezone=Asia/Shanghai
spring.shardingsphere.datasource.m1.username=root
spring.shardingsphere.datasource.m1.password=lhzlx
# 水平分表：user_1/2/3..，多个表进行分表时，依次在tables标签后写逻辑
# user_1/2/3... 为数据库中的事实表
# user为xml编码中操作的逻辑表，sharding-jdbc会自动根据策略操作事实表
# 配置节点分布情况，表示有user_1到user_6共6张表
spring.shardingsphere.sharding.tables.user.actual-data-nodes=m1.user_$->{1..6}
# 指定user表的主键生成策略为SNOWFLAKE
spring.shardingsphere.sharding.tables.user.key-generator.column=id
spring.shardingsphere.sharding.tables.user.key-generator.type=SNOWFLAKE
# 指定user表的分片策略，分片策略包括分片键和分片算法
# 配置表的分片策略
spring.shardingsphere.sharding.tables.user.table-strategy.standard.sharding-column=id
# 精确分片算法类名称，用于 = 和 IN。该类需实现 PreciseShardingAlgorithm 接口并提供无参数的构造器
spring.shardingsphere.sharding.tables.user.table-strategy.standard.precise-algorithm-class-name=\
  com.lhz.sharding.algorithm.MyPreciseShardingAlgorithm
# 范围分片算法类名称，用于 范围查询 可选。该类需实现 RangeShardingAlgorithm 接口并提供无参数的构造器
spring.shardingsphere.sharding.tables.user.table-strategy.standard.range-algorithm-class-name=\
  com.lhz.sharding.algorithm.MyRangeShardingAlgorithm
# 打开sql输出日志
spring.shardingsphere.props.sql.show=true
```

## 4、分片算法

### 4.1、精确分片算法

**MyPreciseShardingAlgorithm：**

```java
import org.apache.shardingsphere.api.sharding.standard.PreciseShardingAlgorithm;
import org.apache.shardingsphere.api.sharding.standard.PreciseShardingValue;
import java.util.Collection;
/**
 * @Description: 精确匹配查询，需要实现PreciseShardingAlgorithm，可以实现对 =以及in的查询
 **/
public class MyPreciseShardingAlgorithm implements PreciseShardingAlgorithm<Long> {
    /**
     * 精确匹配查询
     *
     * @param tbNames       数据库中所有的事实表
     * @param shardingValue 分片相关信息
     * @return 返回匹配的数据源
     */
    @Override
    public String doSharding(Collection<String> tbNames, PreciseShardingValue<Long> shardingValue) {
        for (String tableName : tbNames) {
            /*
             * shardingValue.getValue() 为分片建的值，比如 id=2时，value就是 2
             * 比如：表分为user_1到user_6，id=1操作user_1表，id=6操作user_6表
             *
             * + 6的目的是为了保证，id=6操作user_6表，运维6%6=0，需要再进行+6
             */
            long index = shardingValue.getValue() % tbNames.size();
            String value = String.valueOf(index == 0 ? index + 6 : index);
            // 匹配满足当前分片规则的表名称
            if (tableName.endsWith(value)) {
                return tableName;
            }
        }
        throw new RuntimeException("数据库不存在");
    }
}
```

### 4.2、范围分片算法

**MyRangeShardingAlgorithm：**

```java
package com.lhz.sharding.algorithm;
import org.apache.shardingsphere.api.sharding.standard.RangeShardingAlgorithm;
import org.apache.shardingsphere.api.sharding.standard.RangeShardingValue;
import java.util.*;
/**
 * @Description: 范围查询
 **/
public class MyRangeShardingAlgorithm implements RangeShardingAlgorithm<Long> {
    @Override
    public Collection<String> doSharding(Collection<String> tbNames, RangeShardingValue<Long> rangeShardingValue) {
        // 获取逻辑表名称
        String logicTableName = rangeShardingValue.getLogicTableName();
        // between and 的起始值，需要处理只有最大值或者只有最小值的情况
        boolean hasLowerBound = rangeShardingValue.getValueRange().hasLowerBound();
        boolean hasUpperBound = rangeShardingValue.getValueRange().hasUpperBound();
        // 只有最小值，比如：id > x
        if (hasLowerBound && !hasUpperBound) {
            // 直接返回所有表名称
            return tbNames;
        }
        // 只有最大值，比如：id < x
        if (!hasLowerBound && hasUpperBound) {
            long upper = rangeShardingValue.getValueRange().upperEndpoint();
            if (upper < tbNames.size()) {
                // 如果最大值小于表的总数，则返回需要的表名
                return matchMinAndMax(1, upper, logicTableName, tbNames);
            } else {
                // 如果最大值大于表的总数，则返回所有
                return tbNames;
            }
        }
        long lower = rangeShardingValue.getValueRange().lowerEndpoint();
        long upper = rangeShardingValue.getValueRange().upperEndpoint();
        // 拼接事实表名称
        return matchMinAndMax(lower, upper, logicTableName, tbNames);
    }
    private List<String> matchMinAndMax(long lower, long upper, String logicTableName, Collection<String> tbNames) {
        List<String> tableNameList = new ArrayList<>();
        for (long index = lower; index <= upper; index++) {
            long tableNum = index % tbNames.size();
            // 事实表后缀
            String suffix = String.valueOf(tableNum == 0 ? tableNum + 6 : tableNum);
            String tableName = logicTableName + "_" + suffix;
            if (tbNames.contains(tableName)) {
                // 添加满足要求的表名称
                tableNameList.add(tableName);
            }
            // 如果满足要求的表已经覆盖了所有表，此处处理是为了方式查询区间过大，而分表不多，导致的过度遍历
            if (tableNameList.size() == tbNames.size()) {
                return tableNameList;
            }
        }
        return tableNameList;
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
}
```

## 6、Mapper类

**StandardMapper ：**

```java
@Mapper
public interface StandardMapper {
    /**
     * 根据ID查询
     *
     * @param id
     * @return
     */
    User selectById(@Param("id") Long id);
    /**
     * 根据ID删除
     *
     * @param id
     * @return
     */
    int deleteById(@Param("id") Long id);
    /**
     * 根据ID更新
     *
     * @param id
     * @return
     */
    int updateById(@Param("id") Long id);
    /**
     * 新增数据
     *
     * @param min
     * @param max
     * @return
     */
    List<User> listByRange(@Param("min") Long min, @Param("max") Long max);
    int insert(User user);
    int insertBatch(List<User> list);
}
```

**StandardMapper.xml ：**

```java
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.lhz.sharding.mapper.StandardMapper">
    <select id="selectById" parameterType="java.lang.Long"
            resultType="com.lhz.sharding.model.entity.User">
        select a.*
        from user a
        where a.id ={id}
           OR a.id IN (#{id})
    </select>
    <select id="listByRange"
            resultType="com.lhz.sharding.model.entity.User">
        select a.*
        from user a
        <!--where a.id >{min} -->
        <!--where a.id <{max} -->
        where a.id >={min} and a.id <={max}
        <!-- where a.id between{min} and{max}-->
    </select>
    <update id="updateById" parameterType="java.lang.Long">
        update
            user
        set name ='测试名称'
        where id ={id}
    </update>
    <delete id="deleteById" parameterType="java.lang.Long">
        delete
        from user
        where id ={id}
    </delete>
    <insert id="insert" parameterType="com.lhz.sharding.model.entity.User">
        insert into user(id, name, phone, email)
        values (#{id},{name},{phone},{email})
    </insert>
    <insert id="insertBatch" parameterType="com.lhz.sharding.model.entity.User">
        insert into user(id, name, phone, email)
        values
        <foreach collection="list" item="item" separator=",">
            (#{item.id},{item.name},{item.phone},{item.email})
        </foreach>
    </insert>
</mapper>
```

## 7、Service类

**StandardService :**

```java
@Service
public class StandardService {
    @Resource
    private StandardMapper standardMapper;
    /**
     * 根据ID查询
     *
     * @param id
     * @return
     */
    public User selectById(Long id) {
        return standardMapper.selectById(id);
    }
    /**
     * 范围查询
     *
     * @param min
     * @param max
     * @return
     */
    public List<User> listByRange(Long min, Long max) {
        return standardMapper.listByRange(min, max);
    }
    /**
     * 根据ID删除
     *
     * @param id
     * @return
     */
    @ApiOperation(value = "根据ID删除", notes = "根据ID删除")
    @ApiOperationSupport(order = 15)
    @GetMapping("/deleteById")
    public int deleteById(Long id) {
        return standardMapper.deleteById(id);
    }
    /**
     * 根据ID更新
     *
     * @param id
     * @return
     */
    @ApiOperation(value = "根据ID更新", notes = "根据ID更新")
    @ApiOperationSupport(order = 20)
    @GetMapping("/updateById")
    public int updateById(Long id) {
        return standardMapper.updateById(id);
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
        for (long a = 111; a <= 120; a++) {
            User user = new User();
            user.setId(a);
            user.setName("测试名称-" + a);
            user.setPhone("176-" + a);
            user.setEmail("123@com-" + a);
            list.add(user);
        }
        // 批量新增
        standardMapper.insertBatch(list);
        // 单个新增
        User user = new User();
        user.setId(999L);
        user.setName("测试名称-" + 999);
        user.setPhone("176-" + 999);
        user.setEmail("123@com-" + 999);
        return standardMapper.insert(user);
    }
}
```

## 8、Controller类

**StandardController：**

```java
@RestController
@RequestMapping("standard")
public class StandardController {
    @Resource
    private StandardService shandardService;
    /**
     * 根据ID查询
     *
     * @param id
     * @return
     */
    @GetMapping("/selectById")
    public User selectById(Long id) {
        return shandardService.selectById(id);
    }
    /**
     * 范围查询
     *
     * @param min
     * @param max
     * @return
     */
    @GetMapping("/listByRange")
    public List<User> listByRange(Long min, Long max) {
        return shandardService.listByRange(min, max);
    }
    /**
     * 根据ID删除
     *
     * @param id
     * @return
     */
    @GetMapping("/deleteById")
    public int deleteById(Long id) {
        return shandardService.deleteById(id);
    }
    /**
     * 根据ID更新
     *
     * @param id
     * @return
     */
    @GetMapping("/updateById")
    public int updateById(Long id) {
        return shandardService.updateById(id);
    }
    /**
     * 新增数据
     *
     * @return
     */
    @GetMapping("/insert")
    public int insert() {
        return shandardService.insert();
    }
}
```

## 9、测试

**1、删除、更新、精确查询：**

**2、范围查询：**

**2.1、只有最大值情况：**

当sql中的查询只有最大值，即`<=`时，比如：

```java
select * from user where id <{max}
```

这种情况则`hasUpperBound=true`、`hasLowerBound=false`，并且需要处理最大值小于表数量以及最大值大于表数量的情况；

**2.2、只有最小值情况：**

当sql中的查询只有最大值，即`<=`时，比如：

```java
select * from user where id >{min}
```

这种情况则`hasUpperBound=false`、`hasLowerBound=true`，那么直接返回所有表即可；

**2.3、最大与最小值都存在情况：**

当sql中的查询既有最大值又有最小值，比如：

```java
select * from user where a.id >={min} and a.id <={max}
或者
select * from user where a.id between{min} and{max}
```

这种情况需要遍历最小值到最大值的区间，并且匹配满足要求的表名称，需要注意的是，如果遍历过程中满足要求的表已经覆盖了所有表，那么就直接返回所有表，不再继续遍历，这是为了方式查询区间过大，而分表不多，导致的过度遍历。

**执行结果：**

**3、新增数据：**
