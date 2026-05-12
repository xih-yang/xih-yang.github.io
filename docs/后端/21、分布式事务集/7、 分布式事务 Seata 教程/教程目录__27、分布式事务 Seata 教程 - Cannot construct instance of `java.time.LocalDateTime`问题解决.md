# 27、分布式事务 Seata 教程 - Cannot construct instance of `java.time.LocalDateTime`问题解决
- 来源：https://ddkk.com/zhuanlan/transaction/5/27.html
- 分类：分布式事务
- 分组：教程目录
## 错误信息

### 当前环境

- Spring Boot : 2.3.12.RELEASE
- Nacos : 2.0.3
- Seata:1.4.2
- mysql-connector-java：8.0.25

### 报错信息

在全局事务进行失败进行全局回滚时，出现报错信息，如下：

```java
com.fasterxml.jackson.databind.exc.InvalidDefinitionException: Cannot construct instance of java.time.LocalDateTime (no Creators, like default constructor, exist): cannot deserialize from Object value (no delegate- or property-based Creator)
 at [Source: (byte[])"{"@class":"io.seata.rm.datasource.undo.BranchUndoLog","xid":"192.168.1.29:8091:2747451841886423578","branchId":2747451841886423582,"sqlUndoLogs":["java.util.ArrayList",[{"@class":"io.seata.rm.datasource.undo.SQLUndoLog","sqlType":"INSERT","tableName":"illegal_det_record_detail","beforeImage":{"@class":"io.seata.rm.datasource.sql.struct.TableRecords$EmptyTableRecords","tableName":"illegal_det_record_detail","rows":["java.util.ArrayList",[]]},"afterImage":{"@class":"io.seata.rm.datasource.sql.stru"[truncated 3115 bytes]; line: 1, column: 2173] (through reference chain: io.seata.rm.datasource.undo.BranchUndoLog["sqlUndoLogs"]->java.util.ArrayList[0]->io.seata.rm.datasource.undo.SQLUndoLog["afterImage"]->io.seata.rm.datasource.sql.struct.TableRecords["rows"]->java.util.ArrayList[0]->io.seata.rm.datasource.sql.struct.Row["fields"]->java.util.ArrayList[11]->io.seata.rm.datasource.sql.struct.Field["value"])
	at com.fasterxml.jackson.databind.exc.InvalidDefinitionException.from(InvalidDefinitionException.java:67)
	at com.fasterxml.jackson.databind.DeserializationContext.reportBadDefinition(DeserializationContext.java:1615)
	at com.fasterxml.jackson.databind.DatabindContext.reportBadDefinition(DatabindContext.java:400)
	at com.fasterxml.jackson.databind.DeserializationContext.handleMissingInstantiator(DeserializationContext.java:1077)
	at com.fasterxml.jackson.databind.deser.BeanDeserializerBase.deserializeFromObjectUsingNonDefault(BeanDeserializerBase.java:1332)
	at com.fasterxml.jackson.databind.deser.BeanDeserializer.deserializeFromObject(BeanDeserializer.java:331)
	at com.fasterxml.jackson.databind.deser.BeanDeserializer._deserializeOther(BeanDeserializer.java:199)
	at com.fasterxml.jackson.databind.deser.BeanDeserializer.deserialize(BeanDeserializer.java:166)
	at com.fasterxml.jackson.databind.jsontype.impl.AsPropertyTypeDeserializer._deserializeTypedForId(AsPropertyTypeDeserializer.java:132)
	at com.fasterxml.jackson.databind.jsontype.impl.AsPropertyTypeDeserializer.deserializeTypedFromObject(AsPropertyTypeDeserializer.java:99)
	at com.fasterxml.jackson.databind.jsontype.impl.AsPropertyTypeDeserializer.deserializeTypedFromAny(AsPropertyTypeDeserializer.java:195)
	at com.fasterxml.jackson.databind.deser.std.UntypedObjectDeserializer$Vanilla.deserializeWithType(UntypedObjectDeserializer.java:710)
	at com.fasterxml.jackson.databind.deser.impl.MethodProperty.deserializeAndSet(MethodProperty.java:138)
	at com.fasterxml.jackson.databind.deser.BeanDeserializer.vanillaDeserialize(BeanDeserializer.java:293)
	at com.fasterxml.jackson.databind.deser.BeanDeserializer._deserializeOther(BeanDeserializer.java:194)
	at com.fasterxml.jackson.databind.deser.BeanDeserializer.deserialize(BeanDeserializer.java:166)
	at com.fasterxml.jackson.databind.jsontype.impl.AsPropertyTypeDeserializer._deserializeTypedForId(AsPropertyTypeDeserializer.java:132)
	at com.fasterxml.jackson.databind.jsontype.impl.AsPropertyTypeDeserializer.deserializeTypedFromObject(AsPropertyTypeDeserializer.java:99)
	at com.fasterxml.jackson.databind.deser.BeanDeserializerBase.deserializeWithType(BeanDeserializerBase.java:1209)
	at com.fasterxml.jackson.databind.deser.std.CollectionDeserializer.deserialize(CollectionDeserializer.java:292)
	at com.fasterxml.jackson.databind.deser.std.CollectionDeserializer.deserialize(CollectionDeserializer.java:249)
	at com.fasterxml.jackson.databind.deser.std.CollectionDeserializer.deserialize(CollectionDeserializer.java:26)
	at com.fasterxml.jackson.databind.jsontype.impl.AsArrayTypeDeserializer._deserialize(AsArrayTypeDeserializer.java:120)
	at com.fasterxml.jackson.databind.jsontype.impl.AsArrayTypeDeserializer.deserializeTypedFromArray(AsArrayTypeDeserializer.java:53)
	at com.fasterxml.jackson.databind.deser.std.CollectionDeserializer.deserializeWithType(CollectionDeserializer.java:318)
	at com.fasterxml.jackson.databind.deser.impl.MethodProperty.deserializeAndSet(MethodProperty.java:138)
	at com.fasterxml.jackson.databind.deser.BeanDeserializer.vanillaDeserialize(BeanDeserializer.java:293)
	at com.fasterxml.jackson.databind.deser.BeanDeserializer._deserializeOther(BeanDeserializer.java:194)
	at com.fasterxml.jackson.databind.deser.BeanDeserializer.deserialize(BeanDeserializer.java:166)
	at com.fasterxml.jackson.databind.jsontype.impl.AsPropertyTypeDeserializer._deserializeTypedForId(AsPropertyTypeDeserializer.java:132)
	at com.fasterxml.jackson.databind.jsontype.impl.AsPropertyTypeDeserializer.deserializeTypedFromObject(AsPropertyTypeDeserializer.java:99)
	at com.fasterxml.jackson.databind.deser.BeanDeserializerBase.deserializeWithType(BeanDeserializerBase.java:1209)
	at com.fasterxml.jackson.databind.deser.std.CollectionDeserializer.deserialize(CollectionDeserializer.java:292)
	at com.fasterxml.jackson.databind.deser.std.CollectionDeserializer.deserialize(CollectionDeserializer.java:249)
	at com.fasterxml.jackson.databind.deser.std.CollectionDeserializer.deserialize(CollectionDeserializer.java:26)
	at com.fasterxml.jackson.databind.jsontype.impl.AsArrayTypeDeserializer._deserialize(AsArrayTypeDeserializer.java:120)
	at com.fasterxml.jackson.databind.jsontype.impl.AsArrayTypeDeserializer.deserializeTypedFromArray(AsArrayTypeDeserializer.java:53)
	at com.fasterxml.jackson.databind.deser.std.CollectionDeserializer.deserializeWithType(CollectionDeserializer.java:318)
	at com.fasterxml.jackson.databind.deser.impl.MethodProperty.deserializeAndSet(MethodProperty.java:138)
	at com.fasterxml.jackson.databind.deser.BeanDeserializer.vanillaDeserialize(BeanDeserializer.java:293)
	at com.fasterxml.jackson.databind.deser.BeanDeserializer._deserializeOther(BeanDeserializer.java:194)
	at com.fasterxml.jackson.databind.deser.BeanDeserializer.deserialize(BeanDeserializer.java:166)
	at com.fasterxml.jackson.databind.jsontype.impl.AsPropertyTypeDeserializer._deserializeTypedForId(AsPropertyTypeDeserializer.java:132)
	at com.fasterxml.jackson.databind.jsontype.impl.AsPropertyTypeDeserializer.deserializeTypedFromObject(AsPropertyTypeDeserializer.java:99)
	at com.fasterxml.jackson.databind.deser.BeanDeserializerBase.deserializeWithType(BeanDeserializerBase.java:1209)
	at com.fasterxml.jackson.databind.deser.impl.MethodProperty.deserializeAndSet(MethodProperty.java:138)
	at com.fasterxml.jackson.databind.deser.BeanDeserializer.vanillaDeserialize(BeanDeserializer.java:293)
	at com.fasterxml.jackson.databind.deser.BeanDeserializer._deserializeOther(BeanDeserializer.java:194)
	at com.fasterxml.jackson.databind.deser.BeanDeserializer.deserialize(BeanDeserializer.java:166)
	at com.fasterxml.jackson.databind.jsontype.impl.AsPropertyTypeDeserializer._deserializeTypedForId(AsPropertyTypeDeserializer.java:132)
	at com.fasterxml.jackson.databind.jsontype.impl.AsPropertyTypeDeserializer.deserializeTypedFromObject(AsPropertyTypeDeserializer.java:99)
	at com.fasterxml.jackson.databind.deser.BeanDeserializerBase.deserializeWithType(BeanDeserializerBase.java:1209)
	at com.fasterxml.jackson.databind.deser.std.CollectionDeserializer.deserialize(CollectionDeserializer.java:292)
	at com.fasterxml.jackson.databind.deser.std.CollectionDeserializer.deserialize(CollectionDeserializer.java:249)
	at com.fasterxml.jackson.databind.deser.std.CollectionDeserializer.deserialize(CollectionDeserializer.java:26)
	at com.fasterxml.jackson.databind.jsontype.impl.AsArrayTypeDeserializer._deserialize(AsArrayTypeDeserializer.java:120)
	at com.fasterxml.jackson.databind.jsontype.impl.AsArrayTypeDeserializer.deserializeTypedFromArray(AsArrayTypeDeserializer.java:53)
	at com.fasterxml.jackson.databind.deser.std.CollectionDeserializer.deserializeWithType(CollectionDeserializer.java:318)
	at com.fasterxml.jackson.databind.deser.impl.MethodProperty.deserializeAndSet(MethodProperty.java:138)
	at com.fasterxml.jackson.databind.deser.BeanDeserializer.vanillaDeserialize(BeanDeserializer.java:293)
	at com.fasterxml.jackson.databind.deser.BeanDeserializer._deserializeOther(BeanDeserializer.java:194)
	at com.fasterxml.jackson.databind.deser.BeanDeserializer.deserialize(BeanDeserializer.java:166)
	at com.fasterxml.jackson.databind.jsontype.impl.AsPropertyTypeDeserializer._deserializeTypedForId(AsPropertyTypeDeserializer.java:132)
	at com.fasterxml.jackson.databind.jsontype.impl.AsPropertyTypeDeserializer.deserializeTypedFromObject(AsPropertyTypeDeserializer.java:99)
	at com.fasterxml.jackson.databind.deser.BeanDeserializerBase.deserializeWithType(BeanDeserializerBase.java:1209)
	at com.fasterxml.jackson.databind.deser.impl.TypeWrappedDeserializer.deserialize(TypeWrappedDeserializer.java:68)
	at com.fasterxml.jackson.databind.ObjectMapper._readMapAndClose(ObjectMapper.java:4526)
	at com.fasterxml.jackson.databind.ObjectMapper.readValue(ObjectMapper.java:3529)
	at io.seata.rm.datasource.undo.parser.JacksonUndoLogParser.decode(JacksonUndoLogParser.java:139)
	at io.seata.rm.datasource.undo.AbstractUndoLogManager.undo(AbstractUndoLogManager.java:276)
	at io.seata.rm.datasource.DataSourceManager.branchRollback(DataSourceManager.java:178)
	at io.seata.rm.AbstractRMHandler.doBranchRollback(AbstractRMHandler.java:125)
	at io.seata.rm.AbstractRMHandler$2.execute(AbstractRMHandler.java:67)
	at io.seata.rm.AbstractRMHandler$2.execute(AbstractRMHandler.java:63)
	at io.seata.core.exception.AbstractExceptionHandler.exceptionHandleTemplate(AbstractExceptionHandler.java:116)
	at io.seata.rm.AbstractRMHandler.handle(AbstractRMHandler.java:63)
	at io.seata.rm.DefaultRMHandler.handle(DefaultRMHandler.java:63)
	at io.seata.core.protocol.transaction.BranchRollbackRequest.handle(BranchRollbackRequest.java:35)
	at io.seata.rm.AbstractRMHandler.onRequest(AbstractRMHandler.java:150)
	at io.seata.core.rpc.processor.client.RmBranchRollbackProcessor.handleBranchRollback(RmBranchRollbackProcessor.java:63)
	at io.seata.core.rpc.processor.client.RmBranchRollbackProcessor.process(RmBranchRollbackProcessor.java:58)
	at io.seata.core.rpc.netty.AbstractNettyRemoting.lambda$processMessage$2(AbstractNettyRemoting.java:265)
	at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1149)
	at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:624)
	at io.netty.util.concurrent.FastThreadLocalRunnable.run(FastThreadLocalRunnable.java:30)
	at java.lang.Thread.run(Thread.java:748)
```

### 问题原因

#### 位置

全局事务进行回滚时，会去查询undo_log 表中的回滚信息，回滚信息记录了当前数据操作前后镜像。

Seata 默认采用的是`jackson` 进行序列化，而报错信息也是显示`jackson` 反序列化失败，最终定位到`JacksonUndoLogParser`类的`decode`方法：

```java
    public BranchUndoLog decode(byte[] bytes) {
        try {
            BranchUndoLog branchUndoLog;
            if (Arrays.equals(bytes, this.getDefaultContent())) {
                branchUndoLog = new BranchUndoLog();
            } else {
                branchUndoLog = (BranchUndoLog)this.mapper.readValue(bytes, BranchUndoLog.class);
            }
            return branchUndoLog;
        } catch (IOException var3) {
            LOGGER.error("json decode exception, {}", var3.getMessage(), var3);
            throw new RuntimeException(var3);
        }
    }
```

#### 原因

首先在数据库中，业务表的时间字段设置的是`datetime` 类型。

Seata 会自己去查询数据库表、字段的属性并缓存，在插入回滚信息时，可以看到数据表字段相关信息，这里数据库的`datetime` 被解析为`java.time.LocalDateTime`

**总结原因**：Seata 在使用`Jackson` 序列化器时，没有对`java.time.LocalDateTime`类型序列化进行配置，导致报错。

## 解决方案

### 方案1：更换序列化方式

支持以下几种序列化方式：

- FastjsonUndoLogParser：Fastjson序列化工具
- FstUndoLogParser：Fst序列化工具
- JacksonUndoLogParser：Jackson序列化工具
- KryoUndoLogParser：Kryo序列化工具
- ProtostuffUndoLogParser：Protostuff序列化工具

关于配置序列化可以参考[undo_log支持的多种序列化方式](/zhuanlan/transaction/5/6.html)。

也不是每种序列化都行，实测结果如下：

序列化工具
是否可行

Fastjson
×

Jackson
×

Protostuff
√

Fst
√

Kryo
√

### 方案2：降低Mysql 驱动版本

降低到`mysql-connector-java`<= `8.0.22`

```java
        <!--Mysql 驱动-->
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>8.0.22</version>
        </dependency>
```

可以看到在该版本下，数据库的`datetime` 被解析为`java.sql.Timestamp`也就不存在`java.time.LocalDateTime`无法反序列化的问题了。

### 方案3 ： 修改源码，支持解析

可以修改源码，支持`java.time.LocalDateTime`解析，具体参考[Github](https://github.com/seata/seata/pull/3228/files)。
