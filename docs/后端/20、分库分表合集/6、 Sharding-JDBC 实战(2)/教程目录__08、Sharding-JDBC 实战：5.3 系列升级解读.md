# 08、Sharding-JDBC 实战：5.3 系列升级解读
- 来源：https://ddkk.com/zhuanlan/sharding/shardingjdbc/2/8.html
- 分类：分库分表
- 分组：教程目录
> 补充：如果要看 5.4.0 的文档，直接把地址中的 5.3.0 改为 5.4.0 即可，以此类推。

### 一、背景

在`5.3.0` 版本以前，ShardingSphere-JDBC 同时支持 Java API、YAML、Spring Boot Starter 和 Spring Namespace 等配置方式。**为兼容 Spring 的配置方式**，**给 ShardingSphere 社区带来了以下难题**：

- 当新增或更新 API 时，需要**调整多项配置文件，工作量大**。
- 社区需要维护**多重配置文档 & 示例**。
- Spring Bean **生命周期管理易受项目其他依赖的影响**。如：PostProcessor 无法正常执行。
- Spring Boot Starter & Spring Namespace **配置风格**与 ShardingSphere 标准的 YAML **存在较大差别**。
- Spring Boot Starter & Spring Namespace **受 Spring 版本影响**，带来额外的**配置兼容性问题**。

例如：在最新发布的 Spring Boot 3.0.0 中，**移除了对 2.x 版本 spring.factories 的支持**。这为想要升级但正在使用 **ShardingSphere Spring Boot Starter** 的用户带来了挑战，而**升级 Spring Boot 依赖**也会为 ShardingSphere 用户带来**新的兼容性问题**。基于以上考虑，ShardingSphere 社区决定**在 ShardingSphere 5.3.0 Release 中移除 Spring 全部依赖和配置支持。**

那么，对需要使用 Spring Boot 或 Spring Namespace 的 ShardingSphere-JDBC 用户，应当如何接入 ShardingSphere？原有的用户怎样升级呢？本文将为您解答这些疑问。

### 二、影响范围

**5.3 系列版本升级的影响范围如下：**

- 使用 ShardingSphere Spring Boot Starter 的用户；
- 使用 ShardingSphere Spring Namespace 的用户。

#### 1.Maven 坐标调整

**原有配置：**

```java
<dependency>
    <groupId>org.apache.shardingsphere</groupId>
    <artifactId>shardingsphere-jdbc-core-spring-boot-starter</artifactId>
    <version>${shardingsphere.version}</version>
</dependency>
<dependency>
	<groupId>org.apache.shardingsphere</groupId>
    <artifactId>shardingsphere-jdbc-core-spring-namespace</artifactId>
    <version>${shardingsphere.version}</version>
</dependency>
```

**调整为：**

```java
<dependency>
	<groupId>org.apache.shardingsphere</groupId>
    <artifactId>shardingsphere-jdbc-core</artifactId>
    <version>${shardingsphere.version}</version>
</dependency>
```

#### 2.自定义算法调整

移除Spring 模块会同时**移除 AlgorithmProvided 相关类**。若此前用户在自定义算法中**有使用到 Bean 注入相关的逻辑，更新后将失效。**对需要在算法中使用 Spring Bean 的场景，需开发者主动管理。

#### 3.事务调整

移除Spring 模块同时**移除事务**，用于支持方法级别事务声明的 @ShardingSphereTransactionType 注解。若用户有在方法级别更改事务类型的需求，请使用 Java API 方式。

参考：用户手册-分布式事务，[https://shardingsphere.apache.org/document/current/cn/user-manual/shardingsphere-jdbc/special-api/transaction/java-api/](https://shardingsphere.apache.org/document/current/cn/user-manual/shardingsphere-jdbc/special-api/transaction/java-api/)

#### 4.配置文件调整

在升级5.3.0 版本后，**原有的 Spring Boot Starter 或 Spring Namespace 数据源配置将会失效**，具体配置升级的方式在下面会有介绍。

### 三、升级指导

#### 1.新的 ShardingSphereDriver 数据库驱动

从5.1.2 版本开始，工程师无需修改代码。ShardingSphere-JDBC 提供了原生 JDBC 驱动 **ShardingSphereDriver**，工程师仅通过配置即可接入使用，接入方式如下：

参考：用户手册-JDBC 驱动，[https://shardingsphere.apache.org/document/current/cn/user-manual/shardingsphere-jdbc/yaml-config/jdbc-driver/](https://shardingsphere.apache.org/document/current/cn/user-manual/shardingsphere-jdbc/yaml-config/jdbc-driver/)

这种方式可以更加统一 **ShardingSphere-JDBC** 和 **ShardingSphere-Proxy** 的配置文件格式，只需少量修改即可复用。在**升级到 5.3.x 版本后**，使用 Spring Boot Starter 或 Spring Namespace 的用户**推荐使用 ShardingSphereDriver 方式来接入** ShardingSphere-JDBC。

#### 2.正在使用 Spring Boot Starter 如何升级

##### 升级前

在application.yml 中，ShardingSphere 相关的配置如下：

**application.yml**

```java
spring:
  shardingsphere:
    database:
      name: sharding_db
    datasource:
      names: ds_0,ds_1
      ds_0:
        type: com.zaxxer.hikari.HikariDataSource
        driver-class-name: com.mysql.cj.jdbc.Driver
        jdbc-url: jdbc:mysql://127.0.0.1:3306/demo_ds_0?serverTimezone=UTC&useSSL=false
        username: root
        password:
      ds_1:
        type: com.zaxxer.hikari.HikariDataSource
        driver-class-name: com.mysql.cj.jdbc.Driver
        jdbc-url: jdbc:mysql://127.0.0.1:3306/demo_ds_1?serverTimezone=UTC&useSSL=false
        username: root
        password:
    rules:
      sharding:
        default-database-strategy:
          standard:
            sharding-column: id
            sharding-algorithm-name: database_inline
        tables:
          t_order:
            actual-data-nodes: ds_$->{
     0..1}.t_order_$->{
     0..1}
            table-strategy:
              standard:
                sharding-column: count
                sharding-algorithm-name: t_order_inline
        sharding-algorithms: 
          database_inline:
            type: INLINE
            props:
              algorithm-expression: ds_$->{
     user_id % 2}
          t_order_inline:
            type: INLINE
            props:
              algorithm-expression: t_order_$->{
     order_id % 2}
    props:
      sql-show: true
```

##### 升级后

在 **resources** 目录下新建 **YAML** 配置文件，如：sharding.yaml，并按照用户手册-YAML配置改写原有配置内容。

参考：用户手册-YAML 配置，[https://shardingsphere.apache.org/document/current/cn/user-manual/shardingsphere-jdbc/yaml-config/](https://shardingsphere.apache.org/document/current/cn/user-manual/shardingsphere-jdbc/yaml-config/)

**application.yml**

```java
spring:
  datasource:
    driver-class-name: org.apache.shardingsphere.driver.ShardingSphereDriver
    url: jdbc:shardingsphere:classpath:sharding.yaml
```

**sharding.yaml**

```java
dataSources:
  ds_0:
    dataSourceClassName: com.zaxxer.hikari.HikariDataSource
    driverClassName: com.mysql.jdbc.Driver
    jdbcUrl: jdbc:mysql://127.0.0.1:3306/demo_ds_0?serverTimezone=UTC&useSSL=false
    username: root
    password:
  ds_1:
    dataSourceClassName: com.zaxxer.hikari.HikariDataSource
    driverClassName: com.mysql.jdbc.Driver
    jdbcUrl: jdbc:mysql://127.0.0.1:3306/demo_ds_1?serverTimezone=UTC&useSSL=false
    username: root
    password:
rules:
- !SHARDING
  tables:
    t_order:
      actualDataNodes: ds_$->{
     0..1}.t_order_$->{
     0..1}
      tableStrategy:
        standard:
          shardingColumn: count
          shardingAlgorithmName: t_order_inline
  defaultDatabaseStrategy:
    standard:
      shardingColumn: id
      shardingAlgorithmName: database_inline
  shardingAlgorithms:
    database_inline:
      type: INLINE
      props:
        algorithm-expression: ds_$->{
     user_id % 2}
    t_order_inline:
      type: INLINE
      props:
        algorithm-expression: t_order_$->{
     order_id % 2}
props:
  sql-show: true
```

如果以集群模式部署，当对应 namespace 已有所需配置：sharding.yaml 中仅配置 mode 即可：

```java
mode:
  type: Cluster
  repository:
    type: ZooKeeper
    props:
      namespace: governance_ds
      server-lists: localhost:2181
      retryIntervalMilliseconds: 500
      timeToLiveSeconds: 60
      maxRetries: 3
      operationTimeoutMilliseconds: 500
```

#### 3.正在使用 Spring Namespace 如何升级

##### 升级前

**spring-sharding.xml**

```java
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:context="http://www.springframework.org/schema/context"
       xmlns:tx="http://www.springframework.org/schema/tx"
       xmlns:shardingsphere="http://shardingsphere.apache.org/schema/shardingsphere/datasource"
       xmlns:sharding="http://shardingsphere.apache.org/schema/shardingsphere/sharding"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
                           http://www.springframework.org/schema/beans/spring-beans.xsd 
                           http://www.springframework.org/schema/tx 
                           http://www.springframework.org/schema/tx/spring-tx.xsd
                           http://www.springframework.org/schema/context 
                           http://www.springframework.org/schema/context/spring-context.xsd
                           http://shardingsphere.apache.org/schema/shardingsphere/datasource
                           http://shardingsphere.apache.org/schema/shardingsphere/datasource/datasource.xsd
                           http://shardingsphere.apache.org/schema/shardingsphere/sharding
                           http://shardingsphere.apache.org/schema/shardingsphere/sharding/sharding.xsd
                           ">
    <bean id="ds_0" class="com.zaxxer.hikari.HikariDataSource" destroy-method="close">
        <property name="driverClassName" value="com.mysql.jdbc.Driver"/>
        <property name="jdbcUrl" value="jdbc:mysql://127.0.0.1:3306/demo_ds_0?serverTimezone=UTC&useSSL=false&useUnicode=true&characterEncoding=UTF-8"/>
        <property name="username" value="root"/>
        <property name="password" value=""/>
    </bean>
    <bean id="ds_1" class="com.zaxxer.hikari.HikariDataSource" destroy-method="close">
        <property name="driverClassName" value="com.mysql.jdbc.Driver"/>
        <property name="jdbcUrl" value="jdbc:mysql://127.0.0.1:3306/demo_ds_1?serverTimezone=UTC&useSSL=false&useUnicode=true&characterEncoding=UTF-8"/>
        <property name="username" value="root"/>
        <property name="password" value=""/>
    </bean>
    <sharding:standard-strategy id="databaseStrategy" sharding-column="user_id" algorithm-ref="inlineStrategyShardingAlgorithm" />
    <sharding:sharding-algorithm id="inlineStrategyShardingAlgorithm" type="INLINE">
        <props>
            <prop key="algorithm-expression">ds_${user_id % 2}</prop>
        </props>
    </sharding:sharding-algorithm>
    <sharding:standard-strategy id="orderTableStrategy" sharding-column="order_id" algorithm-ref="orderTableAlgorithm" />
    <sharding:sharding-algorithm id="orderTableAlgorithm" type="INLINE">
        <props>
            <prop key="algorithm-expression">t_order_${order_id % 2}</prop>
        </props>
    </sharding:sharding-algorithm>
    <sharding:rule id="shardingRule">
        <sharding:table-rules>
            <sharding:table-rule logic-table="t_order" database-strategy-ref="databaseStrategy" table-strategy-ref="orderTableStrategy" />
        </sharding:table-rules>
    </sharding:rule>
    <shardingsphere:data-source id="shardingDataSource" database-name="sharding-databases" data-source-names="ds_0,ds_1" rule-refs="shardingRule" >
        <props>
            <prop key="sql-show">true</prop>
        </props>
    </shardingsphere:data-source>
</beans>
```

##### 升级后

**sharding.yaml**

新增sharding.yaml 配置文件，格式同 Spring Boot 示例中一致。

**spring-sharding.xml**

spring-sharding.xml 中**移除原有 ShardingSphere 配置，替换为 ShardingSphereDriver 配置内容**。

```java
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans 
                           http://www.springframework.org/schema/beans/spring-beans.xsd">
    <bean id="shardingDataSource" class="org.springframework.jdbc.datasource.SimpleDriverDataSource">
        <property name="driverClass" value="org.apache.shardingsphere.driver.ShardingSphereDriver" />
        <property name="url" value="jdbc:shardingsphere:classpath:sharding.yaml" />
    </bean>
</beans>
```

🎉完成以上配置，即可畅享

ShardingSphere-JDBC 全新版本！

### 四、总结

此次升级，大大减少了 **ShardingSphere-JDBC** 和 **ShardingSphere -Proxy** 在配置方面的差异，**为 ShardingSphere-JDBC 用户顺利过渡到 ShardingSphere 集群架构打好了基础**，在 API 标准化、提升配置兼容性方面迈出了坚实的一步。

对于新用户而言，**ShardingSphereDriver** 的配置方式也能**减少配置侵入性**，上手更简单。此后，Apache ShardingSphere 社区也能更好的专注于自身功能迭代，为用户和开发者带来更多更好的特性。

整理完毕，完结撒花~ 🌻

参考地址：

**1、** ShardingSphere5.3系列升级解读：Spring配置升级指南，https://blog.csdn.net/ShardingSphere/article/details/128910559；
