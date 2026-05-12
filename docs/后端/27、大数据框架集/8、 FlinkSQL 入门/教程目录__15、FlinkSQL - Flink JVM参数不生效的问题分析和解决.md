# 15、FlinkSQL - Flink JVM参数不生效的问题分析和解决
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/3/15.html
- 分类：大数据框架
- 分组：教程目录
## 研究内容

flink客户端提交命令为 flink run ...., 如果客户端的main 需要读取系统属性(System properties)，读取系统属性变量的位置有两种：

- 从作业的main方法中读取。
- 从作业的算子中读取。

## 测试环境

Flink -m yarn-cluster

## 测试方法

对于JVM参数指定的系统变量

```java
-Dkafka.start_from_timestamp=1648828800000
```

**指定方式**

```java
FLINK_ENV_JAVA_OPTS="-Dkafka.start_from_timestamp=1648828800009" bin/flink run ...
```

读取环境变量

```java
String property = System.getProperty("kafka.start_from_timestamp");
if (property == null) {
    //-Dkafka.start_from_timestamp=1648828800000
    System.err.println("-Dkafka.start_from_timestamp Not found");
    System.err.println("This are Properties Found in this JVM:");
    System.err.println(System.getProperties().stringPropertyNames());
} else {
    System.err.println("-Dkafka.start_from_timestamp is" + property);
}
```

- 读取位置1（在算子外部）提交日志中的输出：

`-Dkafka.start_from_timestamp is1648828800009`
- 读取位置2（在算子内部）TaskManager 输出结果：

```java
-Dkafka.start_from_timestamp Not found
This are Properties Found in this JVM:
[zookeeper.sasl.client, java.runtime.name, sun.boot.library.path, java.vm.version, java.vm.vendor, java.vendor.url, path.separator, java.vm.name, file.encoding.pkg, user.country, sun.java.launcher, sun.os.patch.level, java.vm.specification.name, user.dir, java.runtime.version, java.awt.graphicsenv, java.endorsed.dirs, os.arch, java.io.tmpdir, line.separator, java.vm.specification.vendor, os.name, log4j.configuration, sun.jnu.encoding, java.library.path, sun.nio.ch.bugLevel, java.specification.name, java.class.version, sun.management.compiler, os.version, user.home, user.timezone, java.awt.printerjob, file.encoding, java.specification.version, log4j.configurationFile, user.name, java.class.path, log.file, java.vm.specification.version, sun.arch.data.model, java.home, sun.java.command, java.specification.vendor, user.language, awt.toolkit, java.vm.info, java.version, java.ext.dirs, sun.boot.class.path, java.vendor, java.security.auth.login.config, file.separator, java.vendor.url.bug, sun.cpu.endian, sun.io.unicode.encoding, sun.cpu.isalist]
```

## 测试项目

```java
1. flink-conf.yaml 中指定 env.java.opts
2. FLINK_ENV_JAVA_OPTS 指定 -Dkey=value这样的 System Properties
3. 在 flink run -m yarn-cluster ... -yD env.java.opts="自定义参数" 中这样指定
```

**注：env.java.opts.client, env.java.opts.taskmanager 的测试方法均类似**

本文仅以第二种指定方式为例。其他方式不做赘述。

## 结论

- 对于 FLINK_ENV_JAVA_OPTS 系统环境变量设置的自定义系统变量，仅在客户端提交作业过程中可以访问。
- 对于 flink-conf.yaml 中的 env.java.opts 经过验证，可以在客户端以及TaskManager中访问。
- 对于 flink run -m yarn-cluster ... -yD env.java.opts="自定义参数"，仅在算子也就是在TaskManager中可以访问，客户端中无法访问。

## 感叹

JVM参数，系统属性，只不过是Java的一个option而已。

## 回到起点

> java [options] classname [args]
>
> -Dproperty=value
>
> Sets a system property value. The property variable is a string with no spaces that represents the name of the property. The value variable is a string that represents the value of the property. If value is a string with spaces, then enclose it in quotation marks (for example -Dfoo="foo bar").

也就是说，必须在 紧跟 java 才能生效，举例：

#### 无效

```java
java -jar -Dxxx=yyy example.jar
```

#### 有效

```java
java -Dxxx=yyy -jar example.jar
```

对于bin/flink：

```java
exec "${JAVA_RUN}" $JVM_ARGS $FLINK_ENV_JAVA_OPTS "${log_setting[@]}" -classpath "manglePathList "$CC_CLASSPATH:$INTERNAL_HADOOP_CLASSPATHS"" org.apache.flink.client.cli.CliFrontend "$@"
```

我们传参 flink run ... 无论怎么传，只不过传递给了CliFrontend后面的 "$@" 而已。

因此bin/flink 中 config.sh 读取了 flink-conf.yaml最终存储到JVM_ARGS 和 FLINK_ENV_JAVA_OPTS 才是真正的JVM参数。

## 参考链接

[FLINK-27130](https://issues.apache.org/jira/browse/FLINK-27130)

[Oracle technotes](https://docs.oracle.com/javase/8/docs/technotes/tools/windows/java.html#CBBIJCHG)
