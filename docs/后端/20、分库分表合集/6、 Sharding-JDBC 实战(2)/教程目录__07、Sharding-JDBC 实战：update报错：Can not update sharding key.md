# 07、Sharding-JDBC 实战：update报错：Can not update sharding key
- 来源：https://ddkk.com/zhuanlan/sharding/shardingjdbc/2/7.html
- 分类：分库分表
- 分组：教程目录
## 1.详细报错信息：

```java
Caused by: org.apache.ibatis.exceptions.PersistenceException:
## Error updating database.  Cause: org.apache.shardingsphere.infra.exception.ShardingSphereException: Can not update sharding key since the updated value will change t_contract's data nodes.
## The error may exist in com/demo/module/contract/dao/ContractDao.java (best guess)
## The error may involve com.demo.module.contract.dao.ContractDao.updateById-Inline
## The error occurred while setting parameters
## SQL: UPDATE t_contract  SET CONTRACT_ID=?, NAME=?, ACCOUNT=?, CREATE_TIME=?, UPDATE_TIME=?  WHERE ID=?
## Cause: org.apache.shardingsphere.infra.exception.ShardingSphereException: Can not update sharding key since the updated value will change t_contract's data nodes.
        at org.apache.ibatis.exceptions.ExceptionFactory.wrapException(ExceptionFactory.java:30)
        at org.apache.ibatis.session.defaults.DefaultSqlSession.update(DefaultSqlSession.java:199)
        at com.baomidou.mybatisplus.extension.service.impl.ServiceImpl.lambda$updateBatchById$3(ServiceImpl.java:194)
        at com.baomidou.mybatisplus.extension.toolkit.SqlHelper.lambda$executeBatch$0(SqlHelper.java:215)
        at com.baomidou.mybatisplus.extension.toolkit.SqlHelper.executeBatch(SqlHelper.java:179)
        ... 118 common frames omitted
Caused by: org.apache.shardingsphere.infra.exception.ShardingSphereException: Can not update sharding key since the updated value will change t_contract's data nodes.
        at org.apache.shardingsphere.sharding.route.engine.validator.dml.impl.ShardingUpdateStatementValidator.postValidate(ShardingUpdateStatementValidator.java:54)
        at org.apache.shardingsphere.sharding.route.engine.ShardingSQLRouter.lambda$createRouteContext$1(ShardingSQLRouter.java:57)
        at java.util.Optional.ifPresent(Optional.java:159)
        at org.apache.shardingsphere.sharding.route.engine.ShardingSQLRouter.createRouteContext(ShardingSQLRouter.java:57)
        at org.apache.shardingsphere.sharding.route.engine.ShardingSQLRouter.createRouteContext(ShardingSQLRouter.java:44)
        at org.apache.shardingsphere.infra.route.engine.impl.PartialSQLRouteExecutor.route(PartialSQLRouteExecutor.java:73)
        at org.apache.shardingsphere.infra.route.engine.SQLRouteEngine.route(SQLRouteEngine.java:53)
        at org.apache.shardingsphere.infra.context.kernel.KernelProcessor.route(KernelProcessor.java:54)
        at org.apache.shardingsphere.infra.context.kernel.KernelProcessor.generateExecutionContext(KernelProcessor.java:46)
        at org.apache.shardingsphere.driver.jdbc.core.statement.ShardingSpherePreparedStatement.createExecutionContext(ShardingSpherePreparedStatement.java:431)
        at org.apache.shardingsphere.driver.jdbc.core.statement.ShardingSpherePreparedStatement.addBatch(ShardingSpherePreparedStatement.java:500)
        at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
        at sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)
        at sun.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
        at java.lang.reflect.Method.invoke(Method.java:498)
        at org.apache.ibatis.logging.jdbc.PreparedStatementLogger.invoke(PreparedStatementLogger.java:59)
        at com.sun.proxy.$Proxy446.addBatch(Unknown Source)
        at org.apache.ibatis.executor.statement.PreparedStatementHandler.batch(PreparedStatementHandler.java:58)
        at org.apache.ibatis.executor.statement.RoutingStatementHandler.batch(RoutingStatementHandler.java:69)
        at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
        at sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)
        at sun.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
        at java.lang.reflect.Method.invoke(Method.java:498)
        at org.apache.ibatis.plugin.Plugin.invoke(Plugin.java:63)
        at com.sun.proxy.$Proxy444.batch(Unknown Source)
        at com.baomidou.mybatisplus.core.executor.MybatisBatchExecutor.doUpdate(MybatisBatchExecutor.java:85)
        at org.apache.ibatis.executor.BaseExecutor.update(BaseExecutor.java:117)
        at com.baomidou.mybatisplus.core.executor.MybatisCachingExecutor.update(MybatisCachingExecutor.java:85)
        at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
        at sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)
        at sun.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
        at java.lang.reflect.Method.invoke(Method.java:498)
        at org.apache.ibatis.plugin.Invocation.proceed(Invocation.java:49)
        at com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor.intercept(MybatisPlusInterceptor.java:83)
        at org.apache.ibatis.plugin.Plugin.invoke(Plugin.java:61)
        at com.sun.proxy.$Proxy443.update(Unknown Source)
        at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
        at sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)
        at sun.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
        at java.lang.reflect.Method.invoke(Method.java:498)
        at org.apache.ibatis.plugin.Plugin.invoke(Plugin.java:63)
        at com.sun.proxy.$Proxy443.update(Unknown Source)
        at org.apache.ibatis.session.defaults.DefaultSqlSession.update(DefaultSqlSession.java:197)
        ... 121 common frames omitted
```

## 2.问题原因：

**核心报错内容：Can not update sharding key since the updated value will change t_contract’s data nodes.**

**问题原因：****update语句中涉及了分片键值的更新，更新后的键值可能会导致数据所在分片位置，所以分片键的值不可更新。**

## 3.解决方法：

将MybatisPlus版本升级到 `3.4.1` 以上，在实体类的 `@TableFiled` 注解中增加参数：`updateStrategy = FieldStrategy.NEVER`，意思是永远不更新该字段值。如下所示：

```java
import com.baomidou.mybatisplus.annotation.FieldStrategy;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import java.io.Serializable;
import java.time.LocalDateTime;
/**
 * <p>
 * 用户表
 * </p>
 *
 * @author ACGkaka
 * @since 2023-04-25
 */
@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = false)
@TableName("t_user")
public class User implements Serializable {
    private static final long serialVersionUID = 1L;
    /**
     * 主键
     */
    @TableId(value = "id")
    private Long id;
    /**
     * 用户名
     */
    @TableField("username")
    private String username;
    /**
     * 密码
     */
    @TableField("password")
    private String password;
    /**
     * 年龄
     */
    @TableField("age")
    private Integer age;
    /**
     * 创建时间
     */
    @TableField(value = "createTime", updateStrategy = FieldStrategy.NEVER)
    private LocalDateTime createTime;
    /**
     * 更新时间
     */
    @TableField("updateTime")
    private LocalDateTime updateTime;
}
```

整理完毕，完结撒花~
