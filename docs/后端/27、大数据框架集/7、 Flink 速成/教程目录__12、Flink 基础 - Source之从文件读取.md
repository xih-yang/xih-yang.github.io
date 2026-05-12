# 12、Flink 基础 - Source之从文件读取
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/2/12.html
- 分类：大数据框架
- 分组：教程目录
## 一、文件准备

sensor.txt

```java
sensor_1 1547718199 35.8
sensor_6 1547718201, 15.4
sensor_7 1547718202, 6.7
sensor_10 1547718205 38.1
```

将文件上传到hdfs

```java
hadoop fs -copyFromLocal sensor.txt /user/hive/warehouse
```

## 二、程序准备

SourceTest2_File

```java
package org.example;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
/**
 * @remark  Flink Source之从文件读取
 */
public class SourceTest2_File {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        //从文件读取
        DataStream<String> dataStream = env.readTextFile("hdfs://hp1:8020/user/hive/warehouse/sensor.txt");
        // 打印输出
        dataStream.print();
        env.execute();
    }
}
```

## 三、运行Flink程序

运行命令:

```java
flink run -m yarn-cluster -c org.example.SourceTest2_File FlinkStudy-1.0-SNAPSHOT.jar
```

运行截图:
