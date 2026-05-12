# 06、分布式事务 Seata 教程 - undo_log支持的多种序列化方式
- 来源：https://ddkk.com/zhuanlan/transaction/5/6.html
- 分类：分布式事务
- 分组：教程目录
### rollback_info

在`undo_log`表中，`rollback_info`字段存储了事务失败时，需要回滚的相关信息，该字段为`longblob`类型（二进制数据）。

在Navicat 中，可以选中当前数据，然后通过查看选择文本方式展示。

通过[Json 格式化工具](https://www.json.cn/)，可以查看到详细信息。

### undo 配置项

```java
@Component
@ConfigurationProperties(
    prefix = "seata.client.undo"
)
public class UndoProperties {
    private boolean dataValidation = true;
    private String logSerialization = "jackson";
    private String logTable = "undo_log";
    private boolean onlyCareUpdateColumns = true;
}
```

其配置项的说明如下。

```java
      二阶段回滚镜像校验，默认true开启，false关闭
      data-validation: true
      undo序列化方式，默认jackson
      log-serialization: fastjson
      自定义undo表名，默认undo_log
      log-table: undo_log
      是否只校验SQL更新的字段，默认true开启，false关闭
      only-care-update-columns: true
```

### 支持的序列化方式

Seata 提供了`UndoLogParser`接口处理回滚日志的序列化和反序列化。

```java
public interface UndoLogParser {
	// 序列化类型名称，比如fastjson
    String getName();
	// 获取默认的内容=》{}
    byte[] getDefaultContent();
	// 序列化BranchUndoLog 对象 
    byte[] encode(BranchUndoLog var1);
	// 反序列化BranchUndoLog 对象 
    BranchUndoLog decode(byte[] var1);
}
```

`UndoLogParser`接口的实现类就对应了Seata 提供的序列化方式：

- FastjsonUndoLogParser：Fastjson序列化工具
- FstUndoLogParser：Fst序列化工具
- JacksonUndoLogParser：Jackson序列化工具
- KryoUndoLogParser：Kryo序列化工具
- ProtostuffUndoLogParser：Protostuff序列化工具

### 自定义序列化

只需要修改`log-serialization`配置即可，默认使用的是`jackson`，需要修改其他，需要进入相关的序列化包，这里推荐使用默认可以，因为这是Sring Boot已集成的，无需再添加第三方包。

### 使用fastjson时的主要事项

在公司项目使用`fastjson`序列化时，发现回滚失败，不停在重试：

```java
2022-01-25 15:03:51.156  INFO 52780 --- [_RMROLE_1_19_24] i.s.c.r.p.c.RmBranchRollbackProcessor    : rm handle branch rollback process:xid=192.168.58.1:8091:99302990136548174,branchId=99302990136548179,branchType=AT,resourceId=jdbc:mysql://127.0.0.1:3306/db_order,applicationData=null
2022-01-25 15:03:51.156  INFO 52780 --- [_RMROLE_1_19_24] io.seata.rm.AbstractRMHandler            : Branch Rollbacking: 192.168.58.1:8091:99302990136548174 99302990136548179 jdbc:mysql://127.0.0.1:3306/db_order
2022-01-25 15:03:51.157  INFO 52780 --- [_RMROLE_1_19_24] i.s.r.d.undo.AbstractUndoExecutor        : Field not equals, name version, old value 1, new value 1
2022-01-25 15:03:51.158  INFO 52780 --- [_RMROLE_1_19_24] i.seata.rm.datasource.DataSourceManager  : branchRollback failed. branchType:[AT], xid:[192.168.58.1:8091:99302990136548174], branchId:[99302990136548179], resourceId:[jdbc:mysql://127.0.0.1:3306/db_order], applicationData:[null]. reason:[Branch session rollback failed and try again later xid = 192.168.58.1:8091:99302990136548174 branchId = 99302990136548179 Has dirty records when undo.]
2022-01-25 15:03:51.158  INFO 52780 --- [_RMROLE_1_19_24] io.seata.rm.AbstractRMHandler            : Branch Rollbacked result: PhaseTwo_RollbackFailed_Retryable
 Consume Time：0 ms 2022-01-25 15:03:51
 Execute SQL：SELECT * FROM undo_log WHERE branch_id = 99302990136548179 AND xid = '192.168.58.1:8091:99302990136548174' FOR UPDATE
 Consume Time：0 ms 2022-01-25 15:03:51
 Execute SQL：SELECT * FROM order_tbl WHERE (id) in ( ('65') ) FOR UPDATE
```

通过Debug 发现，通过查询`undo_log`回滚信息时，数据库字段是`bigint`，回滚镜像中，却显示是字符串类型，在Seata 通过SQL 查询这条记录时，是Long 类型。

在进行镜像校验时，因为这个字段，镜像是字符串类型，当前查询的又是数值类型，导致校验不通过，抛出脏数据异常。

发现问题，是在FastJson 进行序列化时，将Long 类型转为了String 类型。

最终排查到Spring MVC 配置的消息转换器，在当前模块中，使用`WebMvcConfigurer`添加了`FastJsonHttpMessageConverter`，将Long 转为了字符串类型，导致`JSON.toJSONString`时将Long 转为了String…

在创建`SerializeConfig`时，使用了`globalInstance`并设置了相应的策略，这个是全局实例，会导致其他地方序列化时，也会采用全局的配置，这样就会出现Seata 序列化时，也采用个这个策略。

直接将`SerializeConfig`改为创建新的对象，再次测试，就没问题了。

```java
        //解决Long转json精度丢失的问题
        SerializeConfig serializeConfig = new SerializeConfig();
```
