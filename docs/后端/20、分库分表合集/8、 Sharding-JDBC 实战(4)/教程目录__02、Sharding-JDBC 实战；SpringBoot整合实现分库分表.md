# 02、Sharding-JDBC 实战；SpringBoot整合实现分库分表
- 来源：https://ddkk.com/zhuanlan/sharding/shardingjdbc/4/2.html
- 分类：分库分表
- 分组：教程目录
垂直分库和垂直分表是一种思想，其实质和单库单表一样，并不是由Sharding-jdbc进行维护

在进行SQL操作时，如果SQL中的字段不是分片(分库分表)策略的分片键，则会对所有分库(表)进行广播路由操作，如果条件中存在多个分片策略键，则会按照每个字段的分片策略进行不同的路由查询，在SQL中操作的表的字段必须进行了分片策略配置才会按照分片策略进行匹配操作

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

## 2、水平分表

将用户(user)表，进行水平分表，分为：user_0,user_1,user_2，并且对表进行CRUD操作；id为1的数据进入user_1，id为3的数据进入user_0，依次类推；

**1、SQL：**

```java
//创建数据表
CREATE TABLE user_0/1/2 (
    id BIGINT(20) NOT NULL COMMENT 'Id',
    name VARCHAR(20) NOT NULL COMMENT '名称',
    phone VARCHAR(20) NOT NULL COMMENT '电话',
    email VARCHAR(20) NOT NULL COMMENT '邮箱',
    PRIMARY KEY (id)
) 
```

**2、properties配置：**

```java
#sharding-jdbc 水平分表规则配置
# 数据源名称，多数据源逗号隔开
spring.shardingsphere.datasource.names=m1
spring.shardingsphere.datasource.m1.type=com.zaxxer.hikari.HikariDataSource
spring.shardingsphere.datasource.m1.driver-class-name=com.mysql.cj.jdbc.Driver
spring.shardingsphere.datasource.m1.jdbc-url=jdbc:mysql://127.0.0.1:3307/shardingjdbc?useUnicode=true&useSSL=false&zeroDateTimeBehavior=convertToNull&characterEncoding=UTF-8&allowMultiQueries=true&serverTimezone=Asia/Shanghai
spring.shardingsphere.datasource.m1.username=root
spring.shardingsphere.datasource.m1.password=123456
# 水平分表：user_0/1/2，多个表进行分表时，依次在tables标签后写逻辑
# user_0/1/2 为数据库中的事实表
# user为xml编码中操作的逻辑表，sharding-jdbc会自动根据策略操作事实表
# 配置节点分布情况
spring.shardingsphere.sharding.tables.user.actual-data-nodes=m1.user_$->{
     0..2}
# 指定user表的主键生成策略为SNOWFLAKE
spring.shardingsphere.sharding.tables.user.key-generator.column=id
spring.shardingsphere.sharding.tables.user.key-generator.type=SNOWFLAKE
# 指定user表的分片策略，分片策略包括分片键和分片算法， user_0/1/2 所有对3取余
spring.shardingsphere.sharding.tables.user.table-strategy.inline.sharding-column=id
spring.shardingsphere.sharding.tables.user.table-strategy.inline.algorithm-expression=user_$->{
     id % 3}
# 打开sql输出日志
spring.shardingsphere.props.sql.show=true
```

**3、代码实现**

> Controller：

```java
@RestController
@RequestMapping("test")
public class TestController {
   // TODO DEMO配置文件中，存在多种配置策略，如何只需要对某一种类型进行测试，则需要修改配置文件配置
   @Resource
   private TestService testService;
   @GetMapping("/table")
   public Object table() {
       return testService.table();
   }
```

**Service：**

```java
@Service
public class TestService {
   @Resource
   private TableMapper tableMapper;
   public Object table() {
       // 插入测试
       for (long i = 1; i <= 10; i++) {
           User user = new User();
           user.setId(i);
           user.setName("Name_" + i);
           user.setPhone("phone");
           user.setEmail("email");
           tableMapper.insertTable(user);
       }
       // 修改测试(模拟修改Id为1的数据)
       tableMapper.updateTableById(1L, "修改名称");
       // 删除测试(模拟修改Id为2的数据)
       tableMapper.deleteTableById(2L);
       // 查询测试
       List<User> list = tableMapper.listAllTable();
       return list;
   }
}    
```

**Mapper**

```java
@Mapper
public interface TableMapper {
    int insertTable(User user);
    int deleteTableById(Long id);
    int updateTableById(@Param("id") Long id, @Param("name") String name);
    List<User> listAllTable();
}
```

**Mapping**

```java
<!--SQL写法 CRUD -->
<insert id="insertTable" parameterType="com.sharding.model.entity.User">
     insert into user(id, name, phone, email)
     values (#{id},{name},{phone},{email})
 </insert>
 <delete id="deleteTableById">
     delete
     from user
     where id ={id}
 </delete>
 <update id="updateTableById">
     update
         user
      set name ={name}
     where id ={id}
 </update>
 <select id="listAllTable"
         resultType="com.sharding.model.entity.User">
     select *
     from user
     order by id desc
 </select>
```

**在执行SQL时，会根据SQL语句的逻辑表查询，然后Sharding-JDBC会根据分片策略操作事实表，如果操作的表没有进行配置任何的分片策略，则和正常操作方式一样不受任何影响，如 果对事实表的分片字段进行操作时，数据会随机被写入到不同的数据表中，并且修改/删除/查询时会对所有的分库进行查询操作。**

在设计分片字段时，一定要想清楚，CURD需要使用到相同的分片建，否则会操作全表操作，导致性能下降。

**4、效果：**

## 3、水平分库

模拟系统使用，存在水平分库

将数据库分为：sharding_0、sharding_1，需要手动创建

事实表：user

**1、SQL：**

```java
//创建数据表
CREATE TABLE user (
    id BIGINT(20) NOT NULL COMMENT 'Id',
    name VARCHAR(20) NOT NULL COMMENT '名称',
    phone VARCHAR(20) NOT NULL COMMENT '电话',
    email VARCHAR(20) NOT NULL COMMENT '邮箱',
    PRIMARY KEY (id)
) 
```

**2、properties配置：**

```java
#sharding-jdbc 水平分库规则配置
# 数据源名称，多数据源逗号隔开
spring.shardingsphere.datasource.names=ds0,ds1
# 配置第一个库-ds0
spring.shardingsphere.datasource.ds0.type=com.zaxxer.hikari.HikariDataSource
spring.shardingsphere.datasource.ds0.driver-class-name=com.mysql.cj.jdbc.Driver
spring.shardingsphere.datasource.ds0.jdbc-url=jdbc:mysql://127.0.0.1:3307/sharding_0?useUnicode=true&useSSL=false&zeroDateTimeBehavior=convertToNull&characterEncoding=UTF-8&allowMultiQueries=true&serverTimezone=Asia/Shanghai
spring.shardingsphere.datasource.ds0.username=root
spring.shardingsphere.datasource.ds0.password=123456
# 配置第二个库-ds1
spring.shardingsphere.datasource.ds1.type=com.zaxxer.hikari.HikariDataSource
spring.shardingsphere.datasource.ds1.driver-class-name=com.mysql.cj.jdbc.Driver
spring.shardingsphere.datasource.ds1.jdbc-url=jdbc:mysql://127.0.0.1:3307/sharding_1?useUnicode=true&useSSL=false&zeroDateTimeBehavior=convertToNull&characterEncoding=UTF-8&allowMultiQueries=true&serverTimezone=Asia/Shanghai
spring.shardingsphere.datasource.ds1.username=root
spring.shardingsphere.datasource.ds1.password=123456
# 分库策略，以事实表user表的id为分片键，分片策略为id % 2
spring.shardingsphere.sharding.tables.user.database-strategy.inline.sharding-column = id
spring.shardingsphere.sharding.tables.user.database-strategy.inline.algorithm-expression =ds$->{
     id % 2}
## 打开sql输出日志
spring.shardingsphere.props.sql.show=true
```

**3、代码实现**

**Controller：**

```java
@RestController
@RequestMapping("test")
public class TestController {
    // TODO DEMO配置文件中，存在多种配置策略，如何只需要对某一种类型进行测试，则需要修改配置文件配置
    @Resource
    private TestService testService;
    @GetMapping("/database")
    public Object database() {
        return testService.database();
    }
}
```

**Service：**

```java
@Service
public class TestService {
    @Resource
    private DatabaseMapper databaseMapper;
	public Object database() {
        // 插入测试
        for (long i = 1; i <= 10; i++) {
            User user = new User();
            user.setId(i);
            user.setName("Name_" + i);
            user.setPhone("phone");
            user.setEmail("email");
            databaseMapper.insertDatabase(user);
        }
        // 修改测试(模拟修改Id为1的数据)
        databaseMapper.updateDatabaseById(1L, "修改名称");
        // 删除测试(模拟修改Id为2的数据)
        databaseMapper.deleteDatabaseById(2L);
        // 查询测试
        List<User> list = databaseMapper.listAllDatabase();
        return list;
    }
}
```

**Mapper**

```java
@Mapper
public interface DatabaseMapper {
    int insertDatabase(User user);
    int deleteDatabaseById(Long id);
    int updateDatabaseById(@Param("id") Long id, @Param("name") String name);
    List<User> listAllDatabase();
}
```

**Mapping**

```java
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.sharding.mapper.DatabaseMapper">
    <insert id="insertDatabase" parameterType="com.sharding.model.entity.User">
        insert into user(id, name, phone, email)
        values (#{id},{name},{phone},{email})
    </insert>
    <delete id="deleteDatabaseById">
        delete
        from user
        where id ={id}
    </delete>
    <update id="updateDatabaseById">
        update
            user
         set name ={name}
        where id ={id}
    </update>
    <select id="listAllDatabase"
            resultType="com.sharding.model.entity.User">
        select *
        from user
        order by id desc
    </select>
</mapper>
```

**4、效果：**

## 4、水平分库及分表

模拟系统使用，存在水平分片(分库和分表)

将数据库分为：sharding_0、sharding_1

将用户(user)表，进行水平分表，分为：user_0,user_1,user_2，并且对表进行CRUD操作,按id分片

将用户(account)表，进行水平分表，分为：account_0,account_1,account_2，并且对表进行CRUD操作,按user_id分片

**1、SQL：**

```java
//创建数据表
CREATE TABLE user_0/1/2 (
	id BIGINT(20) NOT NULL COMMENT 'Id',
	name VARCHAR(20) NOT NULL COMMENT '名称',
	phone VARCHAR(20) NOT NULL COMMENT '电话',
	email VARCHAR(20) NOT NULL COMMENT '邮箱',
	PRIMARY KEY (id)
) 
CREATE TABLE account_0/1/2 (
	id BIGINT(20) NOT NULL COMMENT 'Id',
	user_id BIGINT(20) NOT NULL COMMENT 'user_id',
	user_name VARCHAR(20) NOT NULL COMMENT '用户名',
	PRIMARY KEY (id)
) 
```

**2、properties配置：**

```java
#sharding-jdbc 水平分库及分表规则配置
# 数据源名称，多数据源逗号隔开
spring.shardingsphere.datasource.names=ds0,ds1
# 配置第一个库
spring.shardingsphere.datasource.ds0.type=com.zaxxer.hikari.HikariDataSource
spring.shardingsphere.datasource.ds0.driver-class-name=com.mysql.cj.jdbc.Driver
spring.shardingsphere.datasource.ds0.jdbc-url=jdbc:mysql://127.0.0.1:3307/sharding_0?useUnicode=true&useSSL=false&zeroDateTimeBehavior=convertToNull&characterEncoding=UTF-8&allowMultiQueries=true&serverTimezone=Asia/Shanghai
spring.shardingsphere.datasource.ds0.username=root
spring.shardingsphere.datasource.ds0.password=123456
# 配置第二个库
spring.shardingsphere.datasource.ds1.type=com.zaxxer.hikari.HikariDataSource
spring.shardingsphere.datasource.ds1.driver-class-name=com.mysql.cj.jdbc.Driver
spring.shardingsphere.datasource.ds1.jdbc-url=jdbc:mysql://127.0.0.1:3307/sharding_1?useUnicode=true&useSSL=false&zeroDateTimeBehavior=convertToNull&characterEncoding=UTF-8&allowMultiQueries=true&serverTimezone=Asia/Shanghai
spring.shardingsphere.datasource.ds1.username=root
spring.shardingsphere.datasource.ds1.password=123456
# 对数据同时进行分库和分表(ds0/ds1及user_0/1/2,account_0/1/2)
# 如果大多数数据库都是以id为分片键，则写入通过default-database-strategy使用，其余以其他分键的表则使用tables.xxx.database-strategy
spring.shardingsphere.sharding.default-database-strategy.inline.sharding-column = id
spring.shardingsphere.sharding.default-database-strategy.inline.algorithm-expression =ds$->{
     id % 2}
# 单独分库策略，以user表的id为分片键，分库策略为id % 2
#spring.shardingsphere.sharding.tables.user.database-strategy.inline.sharding-column = id
#spring.shardingsphere.sharding.tables.user.database-strategy.inline.algorithm-expression =ds$->{id % 2}
# 单独分库策略，以account表的id为分片键，分库策略为id % 2
#spring.shardingsphere.sharding.tables.account.database-strategy.inline.sharding-column = id
#spring.shardingsphere.sharding.tables.account.database-strategy.inline.algorithm-expression =ds$->{id % 2}
# user表分片策略
# 分片节点分布
spring.shardingsphere.sharding.tables.user.actual-data-nodes=ds$->{
     0..1}.user_$->{
     0..2}
# 指定user表的主键生成策略为SNOWFLAKE
#spring.shardingsphere.sharding.tables.user.key-generator.column=id
#spring.shardingsphere.sharding.tables.user.key-generator.type=SNOWFLAKE
# 指定user表的分片策略，分片策略包括分片键和分片算法， 分片键为id ,算法为对3取余
spring.shardingsphere.sharding.tables.user.table-strategy.inline.sharding-column=id
spring.shardingsphere.sharding.tables.user.table-strategy.inline.algorithm-expression=user_$->{
     id % 3}
# account表分片策略
# 分片节点分布
spring.shardingsphere.sharding.tables.account.actual-data-nodes=ds$->{
     0..1}.account_$->{
     0..2}
# 指定account表的分片策略，分片策略包括分片键和分片算法， 分片键为user_id ,算法为对3取余
spring.shardingsphere.sharding.tables.account.table-strategy.inline.sharding-column=user_id
spring.shardingsphere.sharding.tables.account.table-strategy.inline.algorithm-expression=account_$->{
     user_id % 3}
# 打开sql输出日志
spring.shardingsphere.props.sql.show=true
```

**3、代码实现**

**Controller：**

```java
@RestController
@RequestMapping("test")
public class TestController {
    // TODO DEMO配置文件中，存在多种配置策略，如何只需要对某一种类型进行测试，则需要修改配置文件配置
    @Resource
    private TestService testService;
    @GetMapping("/database/table")
    public Object databaseTable() {
        return testService.databaseTable();
    }
}
```

**Service：**

```java
@Service
public class TestService {
    @Resource
    private DatabaseTableMapper databaseTableMapper;
    public Object databaseTable() {
        // 插入测试
        for (long i = 1; i <= 10; i++) {
            //模拟ID
            long id = (long) (Math.random() * 100000);
            User user = new User();
            user.setId(id);
            user.setName("Name_" + i);
            user.setPhone("phone");
            user.setEmail("email");
            databaseTableMapper.insertDatabaseUser(user);
            Account account = new Account();
            account.setId(id);
            account.setUserId(user.getId());
            account.setUserName("UserName_" + i);
            databaseTableMapper.insertDatabaseAccount(account);
        }
        // 修改测试(模拟修改Id为1的数据)
        databaseTableMapper.updateDatabaseUserById(100L, "修改名称");
        // 删除测试(模拟修改Id为2的数据)
        databaseTableMapper.deleteDatabaseUserById(200L);
        // 修改测试(模拟修改Id为1的数据)
        databaseTableMapper.updateDatabaseAccountById(100L, "修改名称");
        // 删除测试(模拟修改Id为2的数据)
        databaseTableMapper.deleteDatabaseAccountById(200L);
        // 查询测试
        List<User> userLIst = databaseTableMapper.listAllDatabaseUser();
        List<Account> accountList = databaseTableMapper.listAllDatabaseAccount();
        Map<String, Object> map = new HashMap<>();
        map.put("user", userLIst);
        map.put("account", accountList);
        return map;
    }
}
```

**Mapper**

```java
@Mapper
public interface DatabaseTableMapper {
    int insertDatabaseUser(User user);
    int deleteDatabaseUserById(Long id);
    int updateDatabaseUserById(@Param("id") Long id, @Param("name") String name);
    List<User> listAllDatabaseUser();
    int insertDatabaseAccount(Account account);
    int deleteDatabaseAccountById(Long id);
    int updateDatabaseAccountById(@Param("id") Long id, @Param("userName") String userName);
    List<Account> listAllDatabaseAccount();
}
```

**Mapping**

```java
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.sharding.mapper.DatabaseTableMapper">
    <insert id="insertDatabaseUser" parameterType="com.sharding.model.entity.User">
        insert into user(id, name, phone, email)
        values (#{id},{name},{phone},{email})
    </insert>
    <delete id="deleteDatabaseUserById">
        delete
        from user
        where id ={id}
    </delete>
    <update id="updateDatabaseUserById">
        update
            user
         set name ={name}
        where id ={id}
    </update>
    <select id="listAllDatabaseUser"
            resultType="com.sharding.model.entity.User">
        select *
        from user
        order by id desc
    </select>
    <insert id="insertDatabaseAccount" parameterType="com.sharding.model.entity.User">
        insert into account(id, user_id, user_name)
        values (#{id},{userId},{userName})
    </insert>
    <delete id="deleteDatabaseAccountById">
        delete
        from account
        where id ={id}
    </delete>
    <update id="updateDatabaseAccountById">
        update
            account
         set user_name ={userName}
        where id ={id}
    </update>
    <select id="listAllDatabaseAccount"
            resultType="com.sharding.model.entity.Account">
        select *
        from account
        order by id desc
    </select>
</mapper>
```

**4、效果：**

## 5、公共表

公共表属于系统中数据量较小，变动少，而且属于高频联合查询的依赖表。比如：**参数表、数据字典表**等属于此类型。可以在分库时将这类表在**每个数据库**都保存一份，当更新操作时**SQL同时发送到所有分库**进行执行，保证所有库中的公共表的数据一致。

如果不进行公共表配置，会导致数据被随机写入到不同库中。

操作数据库：sharding_0、sharding_1

公共表：tb_dict

**1、SQL：**

```java
//创建数据表
CREATE TABLE tb_dict (
	id BIGINT(20) NOT NULL COMMENT 'Id',
	name VARCHAR(20) NOT NULL COMMENT '名称',
	value VARCHAR(20) NOT NULL COMMENT '名称'
	PRIMARY KEY (id)
) 
```

**2、properties配置：**

```java
# 指定为公共表，多个逗号隔开
spring.shardingsphere.sharding.broadcast-tables=tb_dict
```

**比如：**

```java
#sharding-jdbc 水平分库 操作公共表
# 数据源名称，多数据源逗号隔开
spring.shardingsphere.datasource.names=ds0,ds1
# 配置第一个库
spring.shardingsphere.datasource.ds0.type=com.zaxxer.hikari.HikariDataSource
spring.shardingsphere.datasource.ds0.driver-class-name=com.mysql.cj.jdbc.Driver
spring.shardingsphere.datasource.ds0.jdbc-url=jdbc:mysql://127.0.0.1:3307/sharding_0?useUnicode=true&useSSL=false&zeroDateTimeBehavior=convertToNull&characterEncoding=UTF-8&allowMultiQueries=true&serverTimezone=Asia/Shanghai
spring.shardingsphere.datasource.ds0.username=root
spring.shardingsphere.datasource.ds0.password=123456
# 配置第二个库
spring.shardingsphere.datasource.ds1.type=com.zaxxer.hikari.HikariDataSource
spring.shardingsphere.datasource.ds1.driver-class-name=com.mysql.cj.jdbc.Driver
spring.shardingsphere.datasource.ds1.jdbc-url=jdbc:mysql://127.0.0.1:3307/sharding_1?useUnicode=true&useSSL=false&zeroDateTimeBehavior=convertToNull&characterEncoding=UTF-8&allowMultiQueries=true&serverTimezone=Asia/Shanghai
spring.shardingsphere.datasource.ds1.username=root
spring.shardingsphere.datasource.ds1.password=123456
# 对数据同时进行分库和分表(ds0/ds1)
spring.shardingsphere.sharding.default-database-strategy.inline.sharding-column = id
spring.shardingsphere.sharding.default-database-strategy.inline.algorithm-expression =ds$->{
     id % 2}
# 指定为公共表
spring.shardingsphere.sharding.broadcast-tables=tb_dict
# 打开sql输出日志
spring.shardingsphere.props.sql.show=true
```

**3、代码实现**

**Controller：**

```java
@RestController
@RequestMapping("test")
public class TestController {
    // TODO DEMO配置文件中，存在多种配置策略，如何只需要对某一种类型进行测试，则需要修改配置文件配置
    @Resource
    private TestService testService;
    @GetMapping("/database/common")
    public Object databaseCommon() {
        return testService.databaseCommon();
    }
}
```

**Service：**

```java
@Service
public class TestService {
    @Resource
    private DatabaseCommonMapper databaseCommonMapper;
    public Object databaseCommon() {
        for (long i = 1; i <= 10; i++) {
            Dict dict = new Dict();
            dict.setId(i);
            dict.setName("测试名称_" + 1);
            dict.setValue(i + "");
            databaseCommonMapper.insertDatabaseCommon(dict);
        }
        // 修改测试(模拟修改Id为1的数据)
        databaseCommonMapper.updateDatabaseCommonById(1L, "修改名称");
        // 删除测试(模拟修改Id为2的数据)
        databaseCommonMapper.deleteDatabaseCommonById(2L);
        return "操作公共表";
    }
}
```

**Mapper**

```java
@Mapper
public interface DatabaseCommonMapper {
    int insertDatabaseCommon(Dict dict);
    int deleteDatabaseCommonById(Long id);
    int updateDatabaseCommonById(@Param("id") Long id, @Param("name") String name);
}
```

**Mapping**

```java
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.sharding.mapper.DatabaseCommonMapper">
    <insert id="insertDatabaseCommon" parameterType="com.sharding.model.entity.User">
        insert into tb_dict(id, name, value)
        values (#{id},{name},{value})
    </insert>
    <delete id="deleteDatabaseCommonById">
        delete
        from tb_dict
        where id ={id}
    </delete>
    <update id="updateDatabaseCommonById">
        update
            tb_dict
         set name ={name}
        where id ={id}
    </update>
</mapper>
```

**4、效果：**

## 6、绑定表

指分片规则一致的主表和子表(join表)。例如： t_order 表和 t_order_item 表，均按照 order_id 分片,绑定表之间的分区键完全相同，则此两张表互为绑定表关系。绑定表之间的多表关联查询不会出现笛卡尔积关联，关联查询效率将大大提升。

```java
// 在原有的分片策略基础上，加上以下配置：
spring.shardingsphere.sharding.binding-tables=t_order,t_order_item
```

> 比如：t_order 分片为t_order_0/1，t_order_item分片为t_order_item0/1

```java
<!--执行SQL-->
SELECT i.* FROM t_order o JOIN t_order_item i ON o.order_id=i.order_id WHERE o.order_id in (10,11);
```

> 在不配置绑定表关系时，假设分片键 order_id 将数值10路由至第0片，将数值11路由至第1片，那么路由后的SQL应该为4条，它们呈现为笛卡尔积：

```java
SELECT i.* FROM t_order_0 o JOIN t_order_item_0 i ON o.order_id=i.order_id WHERE o.order_id in(10, 11);
SELECT i.* FROM t_order_0 o JOIN t_order_item_1 i ON o.order_id=i.order_id WHERE o.order_id in(10, 11);
SELECT i.* FROM t_order_1 o JOIN t_order_item_1 i ON o.order_id=i.order_id WHERE o.order_id in(10, 11);
SELECT i.* FROM t_order_1 o JOIN t_order_item_0 i ON o.order_id=i.order_id WHERE o.order_id in(10, 11);
```

> 在配置绑定表关系后，路由的SQL应该为2条：

```java
SELECT i.* FROM t_order_0 o JOIN t_order_item_0 i ON o.order_id=i.order_id WHERE o.order_id in(10, 11);
SELECT i.* FROM t_order_1 o JOIN t_order_item_1 i ON o.order_id=i.order_id WHERE o.order_id in(10, 11);
```

## 7、事务

在需要使用到事务的service使用以下注解即可：

```java
@ShardingTransactionType(TransactionType.LOCAL)
@Transactional
```

注意：`@ShardingTransactionType`需要同Spring的`@Transactional`配套使用，事务才会生效。
