# 05、Sharding-JDBC 实战：PageHelper分页报错 Can‘t find index: AggregationSelectItem
- 来源：https://ddkk.com/zhuanlan/sharding/shardingjdbc/2/5.html
- 分类：分库分表
- 分组：教程目录
## 1.详细报错信息：

```java
Caused by: org.apache.ibatis.exceptions.PersistenceException: 
## Error querying database.  Cause: java.lang.IllegalStateException: Can't find index: AggregationSelectItem(type=COUNT, innerExpression=(0), alias=Optional.absent(), derivedAggregationSelectItems=[], index=-1), please add alias for aggregate selections
## The error may exist in file [D:\workspaces\springboot-demo\target\classes\com\demo\module\contract\dao\ContractDao.xml]
## The error may involve com.demo.module.contract.dao.ContractDao.findByIds_COUNT
## The error occurred while handling results
## SQL: SELECT count(0) FROM t_contract WHERE del_flag = 0 AND id IN (?, ?)
## Cause: java.lang.IllegalStateException: Can't find index: AggregationSelectItem(type=COUNT, innerExpression=(0), alias=Optional.absent(), derivedAggregationSelectItems=[], index=-1), please add alias for aggregate selections
	at org.apache.ibatis.exceptions.ExceptionFactory.wrapException(ExceptionFactory.java:30)
	at org.apache.ibatis.session.defaults.DefaultSqlSession.selectList(DefaultSqlSession.java:153)
	at org.apache.ibatis.session.defaults.DefaultSqlSession.selectList(DefaultSqlSession.java:145)
	at org.apache.ibatis.session.defaults.DefaultSqlSession.selectList(DefaultSqlSession.java:140)
	at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
	at sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)
	at sun.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
	at java.lang.reflect.Method.invoke(Method.java:497)
	at org.mybatis.spring.SqlSessionTemplate$SqlSessionInterceptor.invoke(SqlSessionTemplate.java:427)
	... 98 common frames omitted
Caused by: java.lang.IllegalStateException: Can't find index: AggregationSelectItem(type=COUNT, innerExpression=(0), alias=Optional.absent(), derivedAggregationSelectItems=[], index=-1), please add alias for aggregate selections
	at com.google.common.base.Preconditions.checkState(Preconditions.java:532)
	at org.apache.shardingsphere.core.parse.antlr.sql.statement.dml.SelectStatement.setIndexForAggregationItem(SelectStatement.java:224)
	at org.apache.shardingsphere.core.parse.antlr.sql.statement.dml.SelectStatement.setIndexForItems(SelectStatement.java:217)
	at org.apache.shardingsphere.core.merge.dql.DQLMergeEngine.merge(DQLMergeEngine.java:115)
	at org.apache.shardingsphere.shardingjdbc.jdbc.core.statement.ShardingPreparedStatement.getCurrentResultSet(ShardingPreparedStatement.java:151)
	at org.apache.shardingsphere.shardingjdbc.jdbc.core.statement.ShardingPreparedStatement.getResultSet(ShardingPreparedStatement.java:141)
	at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
	at sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)
	at sun.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
	at java.lang.reflect.Method.invoke(Method.java:497)
	at org.apache.ibatis.logging.jdbc.PreparedStatementLogger.invoke(PreparedStatementLogger.java:69)
	at com.sun.proxy.$Proxy296.getResultSet(Unknown Source)
	at org.apache.ibatis.executor.resultset.DefaultResultSetHandler.getFirstResultSet(DefaultResultSetHandler.java:238)
	at org.apache.ibatis.executor.resultset.DefaultResultSetHandler.handleResultSets(DefaultResultSetHandler.java:188)
	at org.apache.ibatis.executor.statement.PreparedStatementHandler.query(PreparedStatementHandler.java:65)
	at org.apache.ibatis.executor.statement.RoutingStatementHandler.query(RoutingStatementHandler.java:79)
	at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
	at sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)
	at sun.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
	at java.lang.reflect.Method.invoke(Method.java:497)
	at org.apache.ibatis.plugin.Plugin.invoke(Plugin.java:64)
	at com.sun.proxy.$Proxy294.query(Unknown Source)
	at com.baomidou.mybatisplus.core.executor.MybatisSimpleExecutor.doQuery(MybatisSimpleExecutor.java:69)
	at org.apache.ibatis.executor.BaseExecutor.queryFromDatabase(BaseExecutor.java:325)
	at org.apache.ibatis.executor.BaseExecutor.query(BaseExecutor.java:156)
	at com.baomidou.mybatisplus.core.executor.MybatisCachingExecutor.query(MybatisCachingExecutor.java:165)
	at com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor.intercept(MybatisPlusInterceptor.java:65)
	at org.apache.ibatis.plugin.Plugin.invoke(Plugin.java:62)
	at com.sun.proxy.$Proxy293.query(Unknown Source)
	at com.github.pagehelper.util.ExecutorUtil.executeAutoCount(ExecutorUtil.java:169)
	at com.github.pagehelper.PageInterceptor.count(PageInterceptor.java:178)
	at com.github.pagehelper.PageInterceptor.intercept(PageInterceptor.java:121)
	at org.apache.ibatis.plugin.Plugin.invoke(Plugin.java:62)
	at com.sun.proxy.$Proxy293.query(Unknown Source)
	at org.apache.ibatis.session.defaults.DefaultSqlSession.selectList(DefaultSqlSession.java:151)
	... 105 common frames omitted
```

## 2.问题原因：

SQLServer 和 PostgreSQL 获取不加别名的聚合列会改名。例如，如下SQL：

```java
SELECT SUM(num), SUM(num2) FROM tablexxx;
```

SQLServer 获取到的列为空字符串和(2)，PostgreSQL 获取到的列为空sum和sum(2)。这将导致 ShardingSphere 在结果归并时无法找到响应的列而出错。

正确的SQL写法应该为：

```java
SELECT SUM(num) AS sum_num, SUM(num2) AS sum_num2 FROM tablexxx;
```

**PageHelper分页工具会在分页前进行一次 select count(0) 查询，如上所述，PostgreSQL 中 select count(0) 的时候必须添加别名，例如 select count(0) as totalCount。**

## 3.解决方法：

### 3.1）使用MyBatisPlus自带的分页功能

**如果是使用MyBatisPlus自带的分页功能可以在分页前，将分页关闭，然后调用自己实现的count：**

```java
// 关闭分页
Pagination page = new Pagination();
page.setSearchCount(fasle);
// 分页查询
List<User> users= baseMapper.list(page, param);
page.setRecords(users);
// 自己实现count
page.setTotal(baseMapper.count(map));
return query;
```

### 3.2）PageHelper + ShardingJDBC5

**如果是使用的 PageHelper（此处我使用的是1.3.0版本） + ShardingJDBC 的 5.. 版本，依赖如下：**

```java
<!-- Mybatis的分页插件 -->
<dependency>
    <groupId>com.github.pagehelper</groupId>
    <artifactId>pagehelper-spring-boot-starter</artifactId>
    <version>1.3.0</version>
</dependency>
<!-- Sharding-JDBC -->
<dependency>
    <groupId>org.apache.shardingsphere</groupId>
    <artifactId>shardingsphere-jdbc-core-spring-boot-starter</artifactId>
    <version>5.1.0</version>
</dependency>
<!-- ShardingJDBC 5.1.0使用druid连接池需要加dbcp依赖 -->
<dependency>
    <groupId>org.apache.tomcat</groupId>
    <artifactId>tomcat-dbcp</artifactId>
    <version>10.0.16</version>
</dependency>
```

**那么直接配置 PageHelper 的方言类型即可，如下：**

```java
pagehelper:
  helperDialect: postgresql
```

### 3.3）PageHelper + ShardingJDBC4

**如果是使用的 PageHelper（此处我使用的是1.3.0版本），ShardingJDBC使用的是5的话，依赖如下：**

```java
<!-- Mybatis的分页插件 -->
<dependency>
    <groupId>com.github.pagehelper</groupId>
    <artifactId>pagehelper-spring-boot-starter</artifactId>
    <version>1.3.0</version>
</dependency>
<!-- Sharding-JDBC -->
<dependency>
    <groupId>org.apache.shardingsphere</groupId>
    <artifactId>sharding-jdbc-spring-boot-starter</artifactId>
    <version>4.0.0-RC1</version>
</dependency>
```

**那可能就难搞了，因为我就是这种情况，我是将 ShardingJDBC 先进行升级，然后再增加的 PageHelper 配置，最终解决问题。**

```java
pagehelper:
  helperDialect: postgresql
```

**ShardingJDBC 4升到5过后还是解决了许多问题，4版本的跨库和子查询问题都可以了，性能也提高了。实现自动创建表，动态获取节点表**

整理完毕，完结撒花~

参考地址：

**1、** sharding的遇到的相关坑，https://blog.csdn.net/star1210644725/article/details/104428593；

**2、** SharDingJDBC-5.1.0按月水平分表+读写分离，自动创表、自动刷新节点表，https://blog.csdn.net/weixin_51216079/article/details/123873967；
