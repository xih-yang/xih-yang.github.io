# 20、Mybatis-Plus入门 - 兼容多种数据库
- 来源：https://ddkk.com/zhuanlan/orm/mybatisplus/5/20.html
- 分类：ORM框架
- 分组：教程目录
> 有道无术，术尚可求，有术无道，止于术。

### 前言

在我们实际开发软件产品过程中，数据库的类型可能不是确定的，也有客户会有要求必须用什么数据库，比如很多政府机构要求必须使用**国产数据库**，所以我们在开发时，需要适配多种数据库。

`MySQL`、`Oracle`、`PostgreSQL`、达梦等数据库在进行增删改查时，都是基于美国国家标准局制定的`SQL`标准，比如`SQL-92`、`SQL-99`。

但是每个数据库厂商实际的`SQL`会有较小差异，也就是数据库方言，大家最熟知的就是`MySQL`分页使用`limit`，`Oracle`分页使用`rownum`。

`MyBatis-Plus`支持各种标准 `SQL` 的数据库，接下来我们实际演示如何使用`MyBatis-Plus`适配各种数据库。

### 方案分析

#### 1. 分页

很多数据库分页`SQL`使用方式都不大相同，`MyBatis-Plus`内置分页插件`PaginationInnerInterceptor`已支持多种数据库，官网说明：

在使用**内置分页插件**时，可以设置数据库的类型：

```java
@Configuration
@MapperScan("com.pearl.pay.mapper") //持久层扫描
@EnableTransactionManagement //启用事务管理
public class MybatisPlusConfig {
    @Bean
    @ConditionalOnMissingBean(MybatisPlusInterceptor.class)
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        PaginationInnerInterceptor paginationInnerInterceptor = new PaginationInnerInterceptor();
        paginationInnerInterceptor.setDbType(DbType.MYSQL);
        interceptor.addInnerInterceptor(paginationInnerInterceptor);
        return interceptor;
    }
}
```

**内置分页插件**在执行`SQL`时，会根据当前数据库类型获取**分页方言**。

在**分页方言工厂类**DialectFactory中，可以看到具体获取方言逻辑，mysql、mariadb、clickhouse、oceanbase等数据库都是使用mysql方言。

`oracle`、`达梦数据库`用的是`oracle`方言：

`MYSQL` 数据库分页语句使用`LIMIT`组装：

`ORACLE` 数据库分页语句使用`ROWNUM、ROW_ID`组装：

**综上：****在分页时，适配多种数据库只需要在分页插件中设置数据库类型即可。**

#### 2. XML自定义SQL

调用`MP`的`API`进行增删改查时，比如调用`xxMpper.selectList()`时，因为`MP`在构建`SQL`时，都是使用的基础标准，所以一般不存在兼容问题。但是我们自己在`XML`文件中编写`SQL`，就需要注意各种数据库匹配兼容问题了。

`Mybatis`本身已经做了多数据库支持，只需要告诉框架用的是什么数据库，可以根据不同的数据库厂商执行不同的语句。

`Mybatis`中的`DatabaseIdProvider`（数据库厂商标识提供者）接口声明了获取厂商标识的方法，标识可用于以后为每种数据库类型构建不同的查询，该机制支持多个厂商或版本。

```java
public interface DatabaseIdProvider {
  default void setProperties(Properties p) {
    // NOP
  }
  // 根据数据源获取数据库厂商标识
  String getDatabaseId(DataSource dataSource) throws SQLException;
}
```

`Mybatis`也提供了`VendorDatabaseIdProvider`实现类：

```java
public class VendorDatabaseIdProvider implements DatabaseIdProvider {
  // 支持的数据库厂商（需要自己定义），比如： Oracle=》oracle
  private Properties properties;
  // 获取数据库厂商标识ID（databaseId）,eg：oracle
  @Override
  public String getDatabaseId(DataSource dataSource) {
    if (dataSource == null) {
      throw new NullPointerException("dataSource cannot be null");
    }
    try {
      return getDatabaseName(dataSource);
    } catch (Exception e) {
      LogHolder.log.error("Could not get a databaseId from dataSource", e);
    }
    return null;
  }
  @Override
  public void setProperties(Properties p) {
    this.properties = p;
  }
  // 根据产品名称，获取对应的databaseId。
  private String getDatabaseName(DataSource dataSource) throws SQLException {
    String productName = getDatabaseProductName(dataSource);
    if (this.properties != null) {
      for (Map.Entry<Object, Object> property : properties.entrySet()) {
        if (productName.contains((String) property.getKey())) {
          return (String) property.getValue();
        }
      }
      // no match, return null
      return null;
    }
    return productName;
  }
  // 从数据源中获取数据库产品名称，比如： Oracle
  private String getDatabaseProductName(DataSource dataSource) throws SQLException {
    try (Connection con = dataSource.getConnection()) {
      DatabaseMetaData metaData = con.getMetaData();
      return metaData.getDatabaseProductName();
    }
  }
}
```

在`Mybatis`的`XML`中编写`SQL`时，有个`databaseId`属性，可以指定当前语句块属于哪个数据库类型，比如：

```xml
<mapper namespace="org.pearl.mybatis.demo.dao.UserMapper">
    <select id="selectOneById" resultType="org.pearl.mybatis.demo.pojo.entity.User" databaseId="mysql">
    select * from user where user_id ={id}
  </select>
</mapper>
```

**综上：我们只需要配置DatabaseIdProvider中支持哪些数据库，然后在XML中针对每种数据库方言编写查询语句，并添加databaseId属性，Mybatis会在启动时获取数据源使用的哪个类型数据库，然后执行配置了当前数据库对应的语句**

### 案例演示

#### 1. 配置

搭建工程，集成`MP`、`Oracle`、`Mysql`很简单，这里就不赘述了。

在配置文件中，添加对应的`Oracle`、`Mysql`连接地址：

```java
spring:
  datasource:
    type: com.zaxxer.hikari.HikariDataSource
    driver-class-name: oracle.jdbc.OracleDriver
    url: jdbc:oracle:thin:@127.0.0.1:1521:ORCL
    username: root
    password: root
   driver-class-name: com.mysql.cj.jdbc.Driver
   url: jdbc:mysql://127.0.0.1:3306/d_account?zeroDateTimeBehavior=convertToNull&useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Shanghai
   username: root
   password: root
```

在`MP`中添加配置类：

```java
@Configuration
@MapperScan("com.pearl.pay.mapper") //持久层扫描
@EnableTransactionManagement //启用事务管理
public class MybatisPlusConfig {
     @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor(DataSource dataSource,DatabaseIdProvider databaseIdProvider) throws SQLException {
        // MP插件
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        PaginationInnerInterceptor paginationInnerInterceptor = new PaginationInnerInterceptor();
        // 获取当前数据源对应的数据库类型，添加分页插件
        String databaseId = databaseIdProvider.getDatabaseId(dataSource);
        DbType dbType = DbType.getDbType(databaseId);
        paginationInnerInterceptor.setDbType(dbType);
        interceptor.addInnerInterceptor(paginationInnerInterceptor);
        return interceptor;
    }
    @Bean
    public DatabaseIdProvider databaseIdProvider() {
        // 数据库厂商提供者
        DatabaseIdProvider databaseIdProvider = new VendorDatabaseIdProvider();
        Properties p = new Properties();
        p.setProperty("Oracle", "oracle");
        p.setProperty("Mysql", "mysql");
        databaseIdProvider.setProperties(p);
        return databaseIdProvider;
    }
}
```

#### 2. 简单分页查询

因为`MyBatis-Plus`内置分页插件已经做了适配，简单的（没有数据库方言）分页查询不用自己写代码适配。

首先添加一个分页查询：

```java
    IPage<User> test(Page<User> page);    
```

```java
    <select id="test" resultType="com.pearl.entity.User">
        select * from user
    </select>
```

数据源配置的是`Oracle`，没有配置`databaseId`，测试`SQL`语句打印如下：

```java
SELECT * FROM ( SELECT TMP.*, ROWNUM ROW_ID FROM ( select * from user) TMP WHERE ROWNUM <=10) WHERE ROW_ID > 0
```

数据源配置为`Mysql`，测试`SQL`语句打印如下：

```java
select * from user LIMIT 10
```

#### 3. 带方言的分页查询

**需求**： **查询时间节点小于当前时间的数据。**

`Oracle`当前时间使用的是`sysdate`函数，`Mysql`使用的是`now()`函数，这个时候就需要手动去兼容了。

编写两个重名的查询语句，针对不同的数据库厂商编写`SQL`，并配置对应的`databaseId`

```java
    <select id="test" resultType="com.pearl.entity.User" databaseId="mysql">
        select * from user t <![CDATA[ where t.create_time <= now()]]>
    </select>
    <select id="test" resultType="com.pearl.entity.User" databaseId="oracle">
        select * from user t  <![CDATA[ where t.create_time  <=  sysdate ]]>
    </select>
```

也可以使用`if`语句，判断当前数据库类型，添加不同语句（推荐）。

```java
    <select id="test" resultType="com.pearl.entity.User">
        select * from user t
        <where>
            <if test="_databaseId == 'mysql'">
                <![CDATA[ AND t.create_time <= now()]]>
            </if>
            <if test="_databaseId == 'oracle'">
                <![CDATA[ AND t.create_time  <=  sysdate ]]>
            </if>
        </where>
    </select>
```

切换数据库，执行如下：

```java
select * from user t where t.create_time <= now() LIMIT 10
SELECT * FROM ( SELECT TMP.*, ROWNUM ROW_ID FROM ( select * from user t where t.create_time <= sysdate ) TMP WHERE ROWNUM <=10) WHERE ROW_ID > 0
```

### 参考

接下来我们简单了解下`Oracle` 和`Mysql`的一些区别，便于开发。

**数据类型对照：**

数据库
对比项
类型

MySQL
数据类型
INTEGER、SMALLINT、TINYINT、MEDIUMINT、BIGINT

Oracle
数据类型
number

MySQL
日期和时间
date、timestamp、timestamp

Oracle
日期和时间
date、timestamp

MySQL
字符类型
char、varchar

Oracle
字符类型
char、varchar、varchar2、nvarchar、nvarchar2

MySQL
大字段
LONGTEXT

Oracle
大字段
clob

**常用函数对照：**

数据库
对比项
函数

MySQL
获取字符串长度
char_length(str)

Oracle
获取字符串长度
length(str)

MySQL
生成随机序列
UUID()

Oracle
生成随机序列
sys_guid()

MySQL
时间转换为字符串
date_format(NOW(),‘%Y-%m-%d’)

Oracle
时间转换为字符串
to_char(sysdate, ‘YYYY-MM-DD’)

MySQL
字符串型时间转换为时间
str_to_date(‘2019-01-01’,‘%Y-%m-%d’)

Oracle
字符串型时间转换为时间
to_date(‘2019-01-01’, ‘YYYY-MM-DD’)

MySQL
包含时分秒的函数转换
date_format(NOW(),‘%Y-%m-%d %H:%i:%s’)

Oracle
包含时分秒的函数转换
str_to_date(‘2019-01-01’,‘%Y-%m-%d %H:%i:%s’)

MySQL
当前时间
now()

Oracle
当前时间
sysdate

**其他：**

数据库
对比项
支持

MySQL
引号
双引号和单引号

Oracle
引号
只能识别单引号

MySQL
字符串连接符
concat()函数

Oracle
字符串连接符
可用双竖线连接字符串

MySQL
分页
limit

Oracle
分页
rownum
