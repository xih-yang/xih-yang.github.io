# 58、Flink深入：Flink之FlinkCDC（上）
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/4/58.html
- 分类：大数据框架
- 分组：教程目录
## 1. CDC简介

## 1.1. 什么是CDC

CDC是 Change Data Capture（变更数据获取） 的简称。 核心思想是，监测并捕获数据库的变动（包括数据或数据表的插入、 更新以及删除等），将这些变更按发生的顺序完整记录下来，写入到消息中间件中以供其他服务进行订阅及消费。

## 1.2. CDC的种类

CDC主要分为 基于查询 和 基于Binlog 两种方式，我们主要了解一下这两种之间的区别：

## 1.3. Flink-CDC

Flink 社区开发了 flink-cdc-connectors 组件，这是一个可以直接从 MySQL、 PostgreSQL等数据库直接读取全量数据和增量变更数据的 source 组件。

FlinkCDC开源地址： https://github.com/ververica/flink-cdc-connectors

## 2. 基于DataStream方式的FlinkCDC应用

## 2.1. 导入依赖

```xml
<properties>
    <!-- maven基础版本号 -->
    <encoding>UTF-8</encoding>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <maven.compiler.source>8</maven.compiler.source>
    <maven.compiler.target>8</maven.compiler.target>
    <!-- flink版本号 -->
    <flink.binary.version>1.12</flink.binary.version>
    <flink.version>1.12.0</flink.version>
    <flink.cdc.version>1.2.0</flink.cdc.version>
    <scala.binary.version>2.12</scala.binary.version>
    <!-- 其他大数据版本号 -->
    <hadoop.version>3.1.3</hadoop.version>
    <!-- 日志版本号 -->
    <log4j.version>1.2.17</log4j.version>
    <slf4j.version>1.7.21</slf4j.version>
    <!-- 其他工具包版本号 -->
    <mysql.version>5.1.49</mysql.version>
    <fastjson.version>1.2.75</fastjson.version>
    <commons.beanutils.version>1.9.4</commons.beanutils.version>
    <guava.version>29.0-jre</guava.version>
    <okhttp.version>3.6.0</okhttp.version>
    <springboot.version>2.4.1</springboot.version>
    <HikariCP.version>2.6.1</HikariCP.version>
    <commons.lang3.version>3.10</commons.lang3.version>
</properties>
<dependencyManagement>
    <dependencies>
        <!--################ flink包###########-->
        <!--flink流的核心包-->
        <dependency>
            <groupId>org.apache.flink</groupId>
            <artifactId>flink-clients_${scala.binary.version}</artifactId>
            <version>${flink.version}</version>
        </dependency>
        <dependency>
            <groupId>org.apache.flink</groupId>
            <artifactId>flink-java</artifactId>
            <version>${flink.version}</version>
        </dependency>
        <dependency>
            <groupId>org.apache.flink</groupId>
            <artifactId>flink-streaming-java_${scala.binary.version}</artifactId>
            <version>${flink.version}</version>
        </dependency>
        <!--flink中的Table相关包-->
        <dependency>
            <groupId>org.apache.flink</groupId>
            <artifactId>flink-table-api-java</artifactId>
            <version>${flink.version}</version>
        </dependency>
        <dependency>
            <groupId>org.apache.flink</groupId>
            <artifactId>flink-table-planner_${scala.binary.version}</artifactId>
            <version>${flink.version}</version>
        </dependency>
        <dependency>
            <groupId>org.apache.flink</groupId>
            <artifactId>flink-table-planner-blink_${scala.binary.version}</artifactId>
            <version>${flink.version}</version>
        </dependency>
        <dependency>
            <groupId>org.apache.flink</groupId>
            <artifactId>flink-table-api-java-bridge_${scala.binary.version}</artifactId>
            <version>${flink.version}</version>
        </dependency>
        <!--flink的rocksdb包-->
        <dependency>
            <groupId>org.apache.flink</groupId>
            <artifactId>flink-statebackend-rocksdb_${scala.binary.version}</artifactId>
            <version>${flink.version}</version>
        </dependency>
        <!-- flink的连接包，包括kafka-->
        <dependency>
            <groupId>org.apache.flink</groupId>
            <artifactId>flink-connector-kafka_${scala.binary.version}</artifactId>
            <version>${flink.version}</version>
        </dependency>
        <dependency>
            <groupId>com.alibaba.ververica</groupId>
            <artifactId>flink-connector-mysql-cdc</artifactId>
            <version>${flink.cdc.version}</version>
        </dependency>
        <!--################ 其他大数据依赖包###########-->
        <!--hadoop的相关包-->
        <dependency>
            <groupId>org.apache.flink</groupId>
            <artifactId>flink-hadoop-compatibility_2.11</artifactId>
            <version>${flink.version}</version>
        </dependency>
        <dependency>
            <groupId>org.apache.hadoop</groupId>
            <artifactId>hadoop-client</artifactId>
            <version>${hadoop.version}</version>
        </dependency>
        <!--################ 日志打印的jar包###########-->
        <dependency>
            <groupId>log4j</groupId>
            <artifactId>log4j</artifactId>
            <version>${log4j.version}</version>
        </dependency>
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-api</artifactId>
            <version>${slf4j.version}</version>
        </dependency>
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-log4j12</artifactId>
            <version>${slf4j.version}</version>
        </dependency>
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>jcl-over-slf4j</artifactId>
            <version>${slf4j.version}</version>
        </dependency>
        <!--################ 其他工具依赖包###########-->
        <!-- beanutils工具包 -->
        <dependency>
            <groupId>commons-beanutils</groupId>
            <artifactId>commons-beanutils</artifactId>
            <version>${commons.beanutils.version}</version>
        </dependency>
        <!-- 谷歌guava工具包 -->
        <dependency>
            <groupId>com.google.guava</groupId>
            <artifactId>guava</artifactId>
            <version>${guava.version}</version>
        </dependency>
        <!--MySQL驱动包 mysql8版本-->
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>${mysql.version}</version>
        </dependency>
        <!-- json解析包，fastjson包 -->
        <dependency>
            <groupId>com.alibaba</groupId>
            <artifactId>fastjson</artifactId>
            <version>${fastjson.version}</version>
        </dependency>
        <!-- http包 -->
        <dependency>
            <groupId>com.squareup.okhttp3</groupId>
            <artifactId>okhttp</artifactId>
            <version>${okhttp.version}</version>
        </dependency>
        <!-- springboot中的jdbc包 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-jdbc</artifactId>
            <version>${springboot.version}</version>
        </dependency>
        <!-- HikariCP连接池包 -->
        <dependency>
            <groupId>com.zaxxer</groupId>
            <artifactId>HikariCP</artifactId>
            <version>${HikariCP.version}</version>
        </dependency>
        <!-- lang3工具包 -->
        <dependency>
            <groupId>org.apache.commons</groupId>
            <artifactId>commons-lang3</artifactId>
            <version>${commons.lang3.version}</version>
        </dependency>
    </dependencies>
</dependencyManagement>
```

## 2.2. 编写代码

### 2.2.1. 主类-从业务库中获取数据并写入到kafka中

```java
package com.ouyang.gmall.realtime.app.ods;
import com.alibaba.ververica.cdc.connectors.mysql.MySQLSource;
import com.alibaba.ververica.cdc.connectors.mysql.table.StartupOptions;
import com.alibaba.ververica.cdc.debezium.DebeziumSourceFunction;
import com.ouyang.gmall.realtime.app.function.CustomerDeserialization;
import com.ouyang.gmall.realtime.utils.FlinkUtil;
import com.ouyang.gmall.realtime.utils.ModelUtil;
import com.ouyang.gmall.realtime.utils.MyKafkaUtil;
import org.apache.flink.api.common.functions.MapFunction;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
/**
 * @date: 2022/1/14
 *  @Author ddkk.com  弟弟快看，程序员编程资料站
 * @desc: cdc，从业务库拉取binlog数据
 */
public class GmallCDC {
    public static Logger logger = LoggerFactory.getLogger(GmallCDC.class);
    public static final String ODS_BASE_DB_TOPIC_NAME = ModelUtil.getConfigValue("kafka.topic.ods.base.db");
    public static void main(String[] args) throws Exception {
        String applicationName = "gmall-cdc";
        long interval = 5000L;
        // 1.获取执行环境，并配置checkpoint
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        FlinkUtil.deployRocksdbCheckpoint(env, applicationName, interval, true);
        // 2.通过FlinkCDC构建SourceFunction并读取数据
        DebeziumSourceFunction<String> sourceFunction = MySQLSource.<String>builder()
                .hostname(ModelUtil.getConfigValue("mysql.hostname"))
                .port(Integer.parseInt(ModelUtil.getConfigValue("mysql.port")))
                .username(ModelUtil.getConfigValue("mysql.username"))
                .password(ModelUtil.getConfigValue("mysql.password"))
                .databaseList(ModelUtil.getConfigValue("mysql.database.gmall"))
                .deserializer(new CustomerDeserialization())
                .startupOptions(StartupOptions.initial())
                .build();
        DataStreamSource<String> streamSource = env.addSource(sourceFunction);
        //3.对数据进行日志打印，并将数据输出到Kafka中
        streamSource
                .map(new MapFunction<String, String>() {
                    @Override
                    public String map(String value) throws Exception {
                        logger.warn(value);
                        return value;
                    }
                })
                .addSink(MyKafkaUtil.getKafkaProducerExactlyOnce(ODS_BASE_DB_TOPIC_NAME));
        //4.启动任务
        env.execute(applicationName);
    }
}
```

### 2.2.2. 自定义反序列化器

```java
package com.ouyang.gmall.realtime.app.function;
import com.alibaba.fastjson.JSONObject;
import com.alibaba.ververica.cdc.debezium.DebeziumDeserializationSchema;
import io.debezium.data.Envelope;
import org.apache.flink.api.common.typeinfo.BasicTypeInfo;
import org.apache.flink.api.common.typeinfo.TypeInformation;
import org.apache.flink.util.Collector;
import org.apache.kafka.connect.data.Field;
import org.apache.kafka.connect.data.Schema;
import org.apache.kafka.connect.data.Struct;
import org.apache.kafka.connect.source.SourceRecord;
/**
 * @ date: 2022/1/14
 * @ Author ddkk.com  弟弟快看，程序员编程资料站
 * @ desc: 自定义flinkcdc的反序列化器
 */
public class CustomerDeserialization implements DebeziumDeserializationSchema<String> {
    @Override
    public void deserialize(SourceRecord sourceRecord, Collector<String> collector) throws Exception {
        /*
                 封装的数据格式
                 {
                     "database":"",
                     "tableName":"",
                     "before":{"id":"","tm_name":""....},
                     "after":{"id":"","tm_name":""....},
                     "type":"c u d",
                     "ts":156456135615
                 }
         */
        /*
                SourceRecord{
                    sourcePartition={server=mysql_binlog_source},
                    sourceOffset={ts_sec=1642091776, file=mysql-bin.000001, pos=4008355, row=1, server_id=1, event=2}
                }
                ConnectRecord{
                    topic='mysql_binlog_source.gmall.base_trademark', kafkaPartition=null, key=Struct{id=15},
                    keySchema=Schema{mysql_binlog_source.gmall.base_trademark.Key:STRUCT},
                    value=Struct{
                        before=Struct{id=15,tm_name=111},
                        after=Struct{id=15,tm_name=111,logo_url=11111111111},
                        source=Struct{
                            version=1.4.1.Final,
                            connector=mysql,
                            name=mysql_binlog_source,
                            ts_ms=1642091776000,
                            db=gmall,
                            table=base_trademark,
                            server_id=1,
                            file=mysql-bin.000001,
                            pos=4008492,
                            row=0,
                            thread=22
                        },
                        op=u,
                        ts_ms=1642091776679
                    },
                    valueSchema=Schema{
                        mysql_binlog_source.gmall.base_trademark.Envelope:STRUCT
                    },
                    timestamp=null,
                    headers=ConnectHeaders(headers=)
                }
         */
        //1.创建JSON对象用于存储最终数据
        JSONObject result = new JSONObject();
        //2.获取库名&表名
        String topic = sourceRecord.topic();
        String[] fields = topic.split("\\.");
        String database = fields[1];
        String tableName = fields[2];
        //3.获取 "before"数据 和 "after"数据
        Struct value = (Struct) sourceRecord.value();
        // 3.1. "before"数据
        Struct before = value.getStruct("before");
        JSONObject beforeJson = new JSONObject();
        if (before != null) {
            Schema beforeSchema = before.schema();
            for (Field field : beforeSchema.fields()) {
                Object beforeValue = before.get(field);
                beforeJson.put(field.name(), beforeValue);
            }
        }
        // 3.2. "after"数据
        Struct after = value.getStruct("after");
        JSONObject afterJson = new JSONObject();
        if (after != null) {
            Schema afterSchema = after.schema();
            for (Field field : afterSchema.fields()) {
                Object afterValue = after.get(field);
                afterJson.put(field.name(), afterValue);
            }
        }
        //4.获取timestamp
        long ts = (long) value.get("ts_ms");
        //5.获取操作类型  CREATE UPDATE DELETE，并转换为小写，其中create转换为insert，方便后续写入
        Envelope.Operation operation = Envelope.operationFor(sourceRecord);
        String type = operation.toString().toLowerCase();
        if ("create".equals(type)) {
            type = "insert";
        }
        //6.将字段写入JSON对象
        result.put("database", database);
        result.put("tableName", tableName);
        result.put("before", beforeJson);
        result.put("after", afterJson);
        result.put("type", type);
        result.put("ts", ts);
        //7.输出数据
        collector.collect(result.toJSONString());
    }
    @Override
    public TypeInformation<String> getProducedType() {
        return BasicTypeInfo.STRING_TYPE_INFO;
    }
}
```

### 2.2.3. 各方法参数详解

```java
package com.ouyang.gmall.realtime.app.ods;
import com.alibaba.ververica.cdc.connectors.mysql.MySQLSource;
import com.alibaba.ververica.cdc.connectors.mysql.table.StartupOptions;
import com.alibaba.ververica.cdc.debezium.DebeziumSourceFunction;
import com.alibaba.ververica.cdc.debezium.StringDebeziumDeserializationSchema;
import org.apache.flink.api.common.restartstrategy.RestartStrategies;
import org.apache.flink.runtime.state.filesystem.FsStateBackend;
import org.apache.flink.streaming.api.CheckpointingMode;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.CheckpointConfig;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
/**
 * @ date: 2022/2/3
 * @ Author ddkk.com  弟弟快看，程序员编程资料站
 * @ desc: 项目描述
 */
public class Test {
    public static void main(String[] args) throws Exception {
        //1.创建执行环境
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        //2.Flink-CDC 将读取 binlog 的位置信息以状态的方式保存在 CK,如果想要做到断点续传,需要从 Checkpoint 或者 Savepoint 启动程序
        //2.1 开启 Checkpoint,每隔 5 秒钟做一次 CK
        env.enableCheckpointing(5000L);
        //2.2 指定 CK 的一致性语义
        env.getCheckpointConfig().setCheckpointingMode(CheckpointingMode.EXACTLY_ONCE);
        //2.3 设置任务关闭的时候保留最后一次 CK 数据
        env.getCheckpointConfig().enableExternalizedCheckpoints(CheckpointConfig.ExternalizedCheckpointCleanup.RETAIN_ON_CANCELLATION);
        //2.4 指定从 CK 自动重启策略
        env.setRestartStrategy(RestartStrategies.fixedDelayRestart(3, 2000L));
        //2.5 设置状态后端
        env.setStateBackend(new FsStateBackend("hdfs://hadoop102:8020/flinkCDC"));
        //2.6 设置访问 HDFS 的用户名
        System.setProperty("HADOOP_USER_NAME", "atguigu");
        //3.创建 Flink-MySQL-CDC 的 Source
        //initial (default): Performs an initial snapshot on the monitored database tables uponfirst startup, and continue to read the latest binlog.
        //latest-offset: Never to perform snapshot on the monitored database tables upon firststartup, just read from the end of the binlog which means only have the changes since theconnector was started.
        //timestamp: Never to perform snapshot on the monitored database tables upon firststartup, and directly read binlog from the specified timestamp. The consumer will traverse thebinlog from the beginning and ignore change events whose timestamp is smaller than thespecified timestamp.
        //specific-offset: Never to perform snapshot on the monitored database tables uponfirst startup, and directly read binlog from the specified offset.
        DebeziumSourceFunction<String> mysqlSource = MySQLSource.<String>builder()
                .hostname("hadoop102")
                .port(3306)
                .username("root")
                .password("000000")
                .databaseList("gmall-flink")
                //可选配置项,如果不指定该参数,则会 读取上一个配置下的所有表的数据， 注意：指定的时候需要使用"db.table"的方式
                .tableList("gmall-flink.z_user_info") 
                .startupOptions(StartupOptions.initial())
                .deserializer(new StringDebeziumDeserializationSchema())
                .build();
        //4.使用 CDC Source 从 MySQL 读取数据
        DataStreamSource<String> mysqlDS = env.addSource(mysqlSource);
        //5.打印数据
        mysqlDS.print();
        //6.执行任务
        env.execute();
    }
}
```

## 3. FlinkSQL方式的应用

```java
package com.ouyang.gmall.cdc.app;
import com.ouyang.gmall.common.utils.FlinkUtil;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.table.api.Table;
import org.apache.flink.table.api.bridge.java.StreamTableEnvironment;
import org.apache.flink.types.Row;
/**
 * @ date: 2022/1/14
 * @ Author ddkk.com  弟弟快看，程序员编程资料站
 * @ desc: 基于SQL的CDC
 */
public class GmallCDCWithSQL {
    public static void main(String[] args) throws Exception {
        String applicationName = "gmall-cdc-sql";
        long interval = 5000L;
        // 1.获取执行环境，并配置checkpoint
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        FlinkUtil.deployRocksdbCheckpoint(env, applicationName, interval, true);
        StreamTableEnvironment tableEnv = StreamTableEnvironment.create(env);
        //2.DDL方式建表
        tableEnv.executeSql("CREATE TABLE mysql_binlog ( " +
                " id STRING NOT NULL, " +
                " tm_name STRING, " +
                " logo_url STRING " +
                ") WITH ( " +
                " 'connector' = 'mysql-cdc', " +
                " 'hostname' = 'bigdata1', " +
                " 'port' = '3306', " +
                " 'username' = 'root', " +
                " 'password' = '123456', " +
                " 'database-name' = 'gmall', " +
                " 'table-name' = 'base_trademark' " +
                ")");
        //3.查询数据
        Table table = tableEnv.sqlQuery("select * from mysql_binlog");
        //4.将动态表转换为流
        DataStream<Tuple2<Boolean, Row>> retractStream = tableEnv.toRetractStream(table, Row.class);
        retractStream.print();
        //5.启动任务
        env.execute(applicationName);
    }
}
```

注：此博文为介绍FlinkCDC的详细使用，如果需要了解FlinkCDC2.x的新特性可以查看 [Flink（59）：Flink之FlinkCDC（下）](/zhuanlan/bigdata/flink/4/59.html) 博文
