# 56、Flink深入：Flink高级特性之文件写入（File Sink）
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/4/56.html
- 分类：大数据框架
- 分组：教程目录
## 1. 文件写入介绍

官网介绍：[Apache Flink 1.12 Documentation: File Sink](https://ci.apache.org/projects/flink/flink-docs-release-1.12/dev/connectors/file_sink.html)

新的Data Sink API (Beta)

之前发布的 Flink 版本中[1]，已经支持了 source connector 工作在流批两种模式下，因此在 Flink 1.12 中，社区着重实现了统一的 Data Sink API（FLIP-143）。新的抽象引入了 write/commit 协议和一个更加模块化的接口。Sink 的实现者只需要定义 what 和 how：SinkWriter，用于写数据，并输出需要 commit 的内容（例如，committables）；Committer 和 GlobalCommitter，封装了如何处理 committables。框架会负责 when 和 where：即在什么时间，以及在哪些机器或进程中commit。

这种模块化的抽象允许为 BATCH 和 STREAMING 两种执行模式，实现不同的运行时策略，以达到仅使用一种 sink 实现，也可以使两种模式都可以高效执行。Flink 1.12 中，提供了统一的 FileSink connector，以替换现有的 StreamingFileSink connector （FLINK-19758）。其它的 connector 也将逐步迁移到新的接口。

Flink 1.12的 FileSink 为批处理和流式处理提供了一个统一的接收器，它将分区文件写入Flink文件系统抽象所支持的文件系统。这个文件系统连接器为批处理和流式处理提供了相同的保证，它是现有流式文件接收器的一种改进。

## 2. 案例演示

```java
import org.apache.flink.api.common.serialization.SimpleStringEncoder;
import org.apache.flink.connector.file.sink.FileSink;
import org.apache.flink.core.fs.Path;
import org.apache.flink.runtime.state.filesystem.FsStateBackend;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.sink.filesystem.OutputFileConfig;
import org.apache.flink.streaming.api.functions.sink.filesystem.bucketassigners.DateTimeBucketAssigner;
import org.apache.flink.streaming.api.functions.sink.filesystem.rollingpolicies.DefaultRollingPolicy;
import java.util.concurrent.TimeUnit;
/**
 * Desc
 */
public class FileSinkDemo {
    public static void main(String[] args) throws Exception {
        //1.env
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.enableCheckpointing(TimeUnit.SECONDS.toMillis(10));
        env.setStateBackend(new FsStateBackend("file:///D:/ckp"));
        //2.source
        DataStreamSource<String> lines = env.socketTextStream("node1", 9999);
        //3.sink
        //设置sink的前缀和后缀
        //文件的头和文件扩展名
        //prefix-xxx-.txt
        OutputFileConfig config = OutputFileConfig
                .builder()
                .withPartPrefix("prefix")
                .withPartSuffix(".txt")
                .build();
        //设置sink的路径
        String outputPath = "hdfs://node1:8020/FlinkFileSink/parquet";
        final FileSink<String> sink = FileSink
                .forRowFormat(new Path(outputPath), new SimpleStringEncoder<String>("UTF-8"))
                .withBucketAssigner(new DateTimeBucketAssigner<>())
                .withRollingPolicy(
                        DefaultRollingPolicy.builder()
                                .withRolloverInterval(TimeUnit.MINUTES.toMillis(15))
                                .withInactivityInterval(TimeUnit.MINUTES.toMillis(5))
                                .withMaxPartSize(1024 * 1024 * 1024)
                                .build())
                .withOutputFileConfig(config)
                .build();
        lines.sinkTo(sink).setParallelism(1);
        env.execute();
    }
}
```
