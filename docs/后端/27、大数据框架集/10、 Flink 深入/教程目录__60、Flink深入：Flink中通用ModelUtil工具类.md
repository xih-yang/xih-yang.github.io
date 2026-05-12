# 60、Flink深入：Flink中通用ModelUtil工具类
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/4/60.html
- 分类：大数据框架
- 分组：教程目录
## 1. 开发目的

在日常的Flink中开发中，基本是在自己电脑的idea工具上进行Flink程序开发，并在本地联通测试环境进行调试（比如测试环境的Kafka等），当在本地调试通过后将代码打包，然后提交到正式环境运行。但在此过程中，因为本地调试和线上运行时使用的配置不同，会造成我们代码上线时需要修改较多配置（比如Checkpoint地址等），并且还不能修改错，不然可能会污染线上数据。由此开发了一个通用的ModelUtil工具类，可以根据不同的运行环境来决定不同的配置，这样上线时就不需要去特意配置了。

除了本地调试和上线运行外，在我们编写Flink代码时，针对环境变量由较多通用配置，如果每个程序主类都配置一遍，会感觉很麻烦，由此想到，可以将所有通用配置环境放到一个类里面统一配置，根据输入的参数来微调，这样创建Flink执行环境就较为简单了。

## 2. 环境依赖

具体环境依赖跟Flink依赖一致，可以参考博主另一篇文章： [Flink（8）：Flink的API说明和pom文件汇总](/zhuanlan/bigdata/flink/4/8.html)

## 3. 具体代码

博主使用的环境为华为云，所以线上的checkpoint保存地址为华为云的obs文件系统，另外博主使用的Flink版本为1.10版本

该工具类包括如下4个功能（方法）：

- 根据传入key获取对应配置文件中的配置值
- 对传入的Flink的流的执行环境配置Checkpoint（filesystem类型）
- 对传入的Flink的流的执行环境配置Checkpoint（rocksdb类型）
- 对传入的Flink的流的执行环境配置重启策略

```java
import org.apache.commons.lang3.SystemUtils;
import org.apache.flink.api.common.restartstrategy.RestartStrategies;
import org.apache.flink.api.common.time.Time;
import org.apache.flink.contrib.streaming.state.PredefinedOptions;
import org.apache.flink.contrib.streaming.state.RocksDBOptionsFactory;
import org.apache.flink.contrib.streaming.state.RocksDBStateBackend;
import org.apache.flink.runtime.state.filesystem.FsStateBackend;
import org.apache.flink.streaming.api.CheckpointingMode;
import org.apache.flink.streaming.api.environment.CheckpointConfig;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.util.TernaryBoolean;
import org.rocksdb.ColumnFamilyOptions;
import org.rocksdb.DBOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Collection;
import java.util.ResourceBundle;
import java.util.concurrent.TimeUnit;
/**
 * @date: 2021/6/9
 *  @Author ddkk.com  弟弟快看，程序员编程资料站
 * @desc: 模块工具类
 */
public class ModelUtil {
    public static ResourceBundle localConfig = ResourceBundle.getBundle("localConfig");
    public static ResourceBundle config = ResourceBundle.getBundle("config");
    public static Logger logger = LoggerFactory.getLogger(ModelUtil.class);
    /**
     * 根据key获取配置值
     *
     * @param key 配置参数的key
     * @return 配置参数的value
     */
    public static String getConfigValue(String key) {
        if (SystemUtils.IS_OS_WINDOWS) {
            return localConfig.getString(key);
        } else {
            return config.getString(key);
        }
    }
    /**
     * 对传入的Flink的流的执行环境配置Checkpoint
     *
     * @param env             Flink的流的执行环境
     * @param applicationName 应用程序名，会在checkpoint的路径下创建该应用程序的文件夹，用来保存该应用程序的checkpoint
     * @param interval        checkpoint的时间间隔，单位：毫秒，filesystem模式的checkpoint建议间隔为 10s - 60s 之间的整10数
     */
    public static void deployFsCheckpoint(StreamExecutionEnvironment env, String applicationName, long interval) {
        // 启动checkpoint，设置为精确一次，并通过传入的参数设置时间间隔
        env.getCheckpointConfig().setCheckpointingMode(CheckpointingMode.EXACTLY_ONCE);
        env.getCheckpointConfig().setCheckpointInterval(interval);
        // 设置 状态后端 和 checkpoint 为 filesystem 的模式，并通过配置文件指定文件夹（判断是本地调试还是集群环境）
        String checkpointPath = null;
        if (SystemUtils.IS_OS_WINDOWS) {
            checkpointPath = ModelUtil.getConfigValue("fs.checkpoint.path") + applicationName + "\\\\";
        } else {
            String obsPath = "obs://" +
                    ModelUtil.getConfigValue("obs.ak") + ":" +
                    ModelUtil.getConfigValue("obs.sk") + "@" +
                    ModelUtil.getConfigValue("obs.endpoint") +
                    ModelUtil.getConfigValue("fs.checkpoint.path");
            checkpointPath = obsPath + applicationName + "/";
        }
        env.setStateBackend(new FsStateBackend(checkpointPath));
        // 设置2个checkpoint之间的最小间隔，不需要设置，默认为0
        // env.getCheckpointConfig().setMinPauseBetweenCheckpoints(10 * 1000);
        // 设置能容忍100个检查点的失败
        env.getCheckpointConfig().setTolerableCheckpointFailureNumber(100);
        // 当作业被cancel时，不删除外部保存的检查点
        env.getCheckpointConfig().enableExternalizedCheckpoints(CheckpointConfig.ExternalizedCheckpointCleanup.RETAIN_ON_CANCELLATION);
        // 当在设置的时间内还没有保存成功认为该检查点失败，设置为interval的10倍
        env.getCheckpointConfig().setCheckpointTimeout(interval * 10);
        // 设置同时可以进行10个checkpoint
        env.getCheckpointConfig().setMaxConcurrentCheckpoints(10);
        logger.info(">>>>> 正在进行环境设置，会创建fs的checkpoint环境，applicationName：" + applicationName + " ; 间隔时间interval：" + interval + " ; ");
    }
    /**
     * 对传入的Flink的流的执行环境配置Checkpoint
     *
     * @param env             Flink的流的执行环境
     * @param applicationName 应用程序名，会在checkpoint的路径下创建该应用程序的文件夹，用来保存该应用程序的checkpoint
     * @param interval        checkpoint的时间间隔，单位：毫秒，RocksDB模式的checkpoint建议间隔为 1分钟到30分钟 之间的整分钟数
     */
    public static void deployRocksdbCheckpoint(StreamExecutionEnvironment env, String applicationName, long interval) {
        // 启动checkpoint，设置为精确一次，并通过传入的参数设置时间间隔
        env.getCheckpointConfig().setCheckpointingMode(CheckpointingMode.EXACTLY_ONCE);
        env.getCheckpointConfig().setCheckpointInterval(interval);
        // 设置 状态后端 和 checkpoint 为 filesystem 的模式，并通过配置文件指定文件夹（判断是本地调试还是集群环境）
        String checkpointPath = null;
        if (SystemUtils.IS_OS_WINDOWS) {
            checkpointPath = ModelUtil.getConfigValue("rocksdb.checkpoint.path") + applicationName + "\\\\";
        } else {
            String obsPath = "obs://" +
                    ModelUtil.getConfigValue("obs.ak") + ":" +
                    ModelUtil.getConfigValue("obs.sk") + "@" +
                    ModelUtil.getConfigValue("obs.endpoint") +
                    ModelUtil.getConfigValue("rocksdb.checkpoint.path");
            checkpointPath = obsPath + applicationName + "/";
        }
        RocksDBStateBackend rocksDbBackend = new RocksDBStateBackend(new FsStateBackend(checkpointPath), TernaryBoolean.TRUE);
        // 预定义选项，SPINNING_DISK_OPTIMIZED为基于磁盘的优化，一般使用SPINING_DISK_OPTIMIZED_HIGH_MEM，但这会消耗比较多的内存
        rocksDbBackend.setPredefinedOptions(PredefinedOptions.SPINNING_DISK_OPTIMIZED_HIGH_MEM);
        rocksDbBackend.setRocksDBOptions(new RocksDBOptionsFactory() {
            @Override
            public DBOptions createDBOptions(DBOptions currentOptions, Collection<AutoCloseable> handlesToClose) {
                return currentOptions
                        // 指定信息日志文件的最大大小。 如果当前日志文件大于' max_log_file_size '，一个新的信息日志文件将被创建。如果为0，所有日志将被写入一个日志文件。
                        .setMaxLogFileSize(64 * 1024 * 1024)
                        // 信息日志文件的最大保留个数。
                        // .setKeepLogFileNum(3)
                        ;
            }
            @Override
            public ColumnFamilyOptions createColumnOptions(ColumnFamilyOptions currentOptions, Collection<AutoCloseable> handlesToClose) {
                return currentOptions;
            }
        });
        env.setStateBackend(rocksDbBackend);
        // 设置2个checkpoint之间的最小间隔，不需要设置，默认为0
        // env.getCheckpointConfig().setMinPauseBetweenCheckpoints(interval);
        // 设置能容忍100个检查点的失败
        env.getCheckpointConfig().setTolerableCheckpointFailureNumber(100);
        // 当作业被cancel时，不删除外部保存的检查点
        env.getCheckpointConfig().enableExternalizedCheckpoints(CheckpointConfig.ExternalizedCheckpointCleanup.RETAIN_ON_CANCELLATION);
        // 当在设置的时间内还没有保存成功认为该检查点失败，设置为interval的10倍
        env.getCheckpointConfig().setCheckpointTimeout(interval * 10);
        // 设置同时可以进行10个checkpoint
        env.getCheckpointConfig().setMaxConcurrentCheckpoints(10);
        logger.info(">>>>> 正在进行环境设置，会创建rocksdb的checkpoint环境，applicationName：" + applicationName + " ; 间隔时间interval：" + interval + " ; ");
    }
    /**
     * 对传入的Flink的流的执行环境配置重启策略
     *
     * @param env Flink的流的执行环境
     */
    public static void deployRestartStrategy(StreamExecutionEnvironment env) {
        // 当任务中异常失败后，会重启任务3次，间隔时间为60秒
        env.setRestartStrategy(RestartStrategies.fixedDelayRestart(3, Time.of(60, TimeUnit.SECONDS)));
        logger.info(">>>>> 正在进行环境设置，重启策略为：重启任务3次，间隔时间为60秒");
        // 10分钟内重启5次,每次间隔2分钟（排除了网络等问题，如果再失败，需要手动查明原因）
        // env.setRestartStrategy(RestartStrategies.failureRateRestart(5, Time.of(10, TimeUnit.MINUTES), Time.of(2, TimeUnit.MINUTES)));
        // logger.info(">>>>> 正在进行环境设置，重启策略为：10分钟内重启5次,每次间隔2分钟");
    }
}
```

## 4. 具体使用

如下代码所示，在具体使用中，通过简短的4行代码既可以配置出Flink的运行环境：

```java
public static void main(String[] args) throws Exception {
    // 包括但不限于kafka的消费者id
    String applicationName = "应用名";
    StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
    env.setStreamTimeCharacteristic(TimeCharacteristic.EventTime);
    ModelUtil.deployRocksdbCheckpoint(env, applicationName, 3 * 1000);
    ModelUtil.deployRestartStrategy(env);
    // 具体业务代码
    env.execute(applicationName);
}
```

在resources文件夹下，需要配置出本地运行环境和线上运行环境的不同的配置选项，具体文件如下图所示：

线上运行配置如下图所示：

本地运行配置如下图所示：
