# 13、分布式事务 Seata 教程 - 分布式事务环境下数据库批量插入和批量更新操作
- 来源：https://ddkk.com/zhuanlan/transaction/5/13.html
- 分类：分布式事务
- 分组：教程目录
### 前言

批量插入和批量更新是常用的数据库操作，接下来我们分析下在seata 中如何使用。

如果使用循环遍历插入，效率是很慢的，所以一般的ORM框架都是支持批量操作的，接下来以Mybatis 为例，深入了解下如何使用批处理。

### 批量插入

#### Mybatis-plus

Mybatis 提供了批处理的相关API，Mybatis-plus对其进行了封装，Service 接口提供了`saveBatch`方法用于批量插入操作，源码如下：

```java
    public boolean saveBatch(Collection<T> entityList, int batchSize) {
        String sqlStatement = this.sqlStatement(SqlMethod.INSERT_ONE);
        int size = entityList.size();
        this.executeBatch((sqlSession) -> {
            int i = 1;
            for(Iterator var6 = entityList.iterator(); var6.hasNext(); ++i) {
                T entity = var6.next();
                sqlSession.insert(sqlStatement, entity);
                if (i % batchSize == 0 || i == size) {
                    sqlSession.flushStatements();
                }
            }
        });
        return true;
    }
```

可以看到，`saveBatch`是循环添加每一条插入语句，然后进行批量提交，所以在使用的时候需要在JDBC连接中添加批处理参数`rewriteBatchedStatements=true`，这是因为：

```java
MySQL的JDBC连接的url中要加rewriteBatchedStatements参数，并保证5.1.13以上版本的驱动，才能实现高性能的批量插入。
MySQL JDBC驱动在默认情况下会无视executeBatch()语句，把我们期望批量执行的一组sql语句拆散，一条一条地发给MySQL数据库，批量插入实际上是单条插入，直接造成较低的性能。
只有把rewriteBatchedStatements参数置为true, 驱动才会帮你批量执行SQL
另外这个选项对INSERT/UPDATE/DELETE都有效
```

可以看到这里是循环插入：

所有插入语句执行后，会为每条插入记录生成全局锁，正常全局提交后，再删除相关日志和锁记录。

#### 使用foreach标签

Mybatis 中可以使用foreach标签进行批量插入，效率比上面的方式更快，比如先写一个Mapper 接口：

```java
  public Integer insertBatch(List<OrderTbl> list);
```

再使用foreach标签执行批量插入：

```java
    <insert id="insertBatch" parameterType="java.util.List">
        INSERT INTO order_tbl ( id, user_id, commodity_code, count ) VALUES
        <foreach collection="list" item="orderTbl" index="index" separator=",">
            (
            NULL,{orderTbl.userId},
           {orderTbl.commodityCode},
           {orderTbl.count}
            )
        </foreach>
    </insert>
```

执行时的SQL 如下图：

SQL执行以后，Seata 会为这些所有的插入数据生成全局锁：

在回滚日志中，也记载了所有数据：

当无异常时，全局提交，删除相关日志记录。

异常时，根据回滚日志查询到所有插入的记录，再依次删除。

### 批量更新

Seata 也是支持Mysql 批量更新的，批量更新的方式也有很多种，这里以Mybatis-plus 提供的方法为例。

`updateBatchById` 其和批量插入一样，也是循环所有更新语句，然后批量提交：

```java
    public boolean updateBatchById(Collection<T> entityList, int batchSize) {
        Assert.notEmpty(entityList, "error: entityList must not be empty", new Object[0]);
        String sqlStatement = this.sqlStatement(SqlMethod.UPDATE_BY_ID);
        int size = entityList.size();
        this.executeBatch((sqlSession) -> {
            int i = 1;
            for(Iterator var6 = entityList.iterator(); var6.hasNext(); ++i) {
                T anEntityList = var6.next();
                ParamMap<T> param = new ParamMap();
                param.put("et", anEntityList);
                sqlSession.update(sqlStatement, param);
                if (i % batchSize == 0 || i == size) {
                    sqlSession.flushStatements();
                }
            }
        });
        return true;
    }
```

执行SQL 时，可以看到依然是循环：

执行完成后，依旧是查询前后镜像，生成回滚日志。

最终进行全局提交或者回滚。
