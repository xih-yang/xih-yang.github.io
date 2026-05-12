# 10、FlinkSQL - Flink 作业提交遇到的问题记录以及原理
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/3/10.html
- 分类：大数据框架
- 分组：教程目录
## 起因

- 由于近期研究了ElasticSearch的Connector，但是目前生产环境不需要此jar。
- Flink社区的一些小伙伴交流的时候，发现有人在使用Flink Session-Cluster模式提交作业，正好发现自己缺少这块知识细节。
- 虑到Yarn集群不可用，或者没有Yarn的开发环境下，有Flink Session Cluster也是一个不错的使用环境。

> 带着折腾的目的，故意舍近求远。

## 需求

研究ES和CDC的使用，需要flink-sql-connector-cdc和flink-sql-connector-elasticsearch

## 问题记录

## org.apache.flink.table.api.ValidationException: Could not find any factory for identifier 'mysql-cdc' that implements 'org.apache.flink.table.factories.DynamicTableSourceFactory' in the classpath

**※此问题网络上有一些解决方案**

例如maven-shade-plugin

```java
<transformer implementation="org.apache.maven.plugins.shade.resource.ServicesResourceTransformer"/>
```

仅看这个错误，是不够的，无法确定是 Source的问题，还是Classpath的问题。还需要分析操作场景，才能找到真实原因。

##### SPI 类型

如果是在开发自定义Flink Source/Sink的时候遇到此问题，则问题可能是SPI加载机制。

- 需要确保打的jar包 META-INF/services提供完整的信息。
- **确保Classpath加载没有问题的情况下**

##### Classpath类型

如果是下载了新的Connector，例如官方提供的、Ververica提供的，则问题可能是classpath加载问题。

- 如果是Yarn-Per-job模式提交作业，则需要确保所有涉及的Connector，包括FlinkSQL的connector，以及 TableAPI直接引用到的Connector，都以恰当的方式提交到Yarn集群。
- 例如 flink run 的参数 `-C`, `-yt`。
- 如果是Session-Cluster模式提交作业，例如Standalone-Session模式，启动集群的时候就要指定Connector的Classpath。
- 正常情况下，都需要放在`FLINK_DIST_DIR/lib`内。
- Session-Cluster模式**需要重启**。

## 实践

在实践过程中，此问题显而易见，ververica文档就说了，把jar放进lib内。

但是，舍近求远，由于平台项目本身用到了额外的目录存放这些Connector，并希望和lib区分开来。

问题就来了，如果放在其他的目录怎么办呢？

- 这里是用的Standalone-Cluster方式，且jar依赖放在了Connectors内，和lib分开了。

## 原理

Flink的`bin/config.sh`，是bin内的脚本的配置读取入口，内置了一些处理classpath的bash shell function。

- 生效的方式为：. config.sh，这就是一个source命令。
- bin/start-cluster.sh 以及 bin/flink 等脚本都依赖这个脚本中的一个function，也就是

```java
constructFlinkClassPath() {
    local FLINK_DIST
    local FLINK_CLASSPATH
    ...
}
```

这个类其实就是找出了 flink-dist.jar，以及lib下的jar,生成一个classpath字符串。

※模仿FLINK_CLASSPATH, 将connectors目录下的jar导入到classpath内。

```java
local FLINK_CONNECTORS
while read -d '' -r jarfile ; do
        if [[ "$jarfile" =~ .*/flink-dist[^/]*.jar$ ]]; then
            :
        elif [[ "$FLINK_CONNECTORS" == "" ]]; then
            FLINK_CONNECTORS="$jarfile";
        else
            FLINK_CONNECTORS="$FLINK_CONNECTORS":"$jarfile"
        fi
    done < <(find "$FLINK_LIB_DIR/../connectors" ! -type d -name '*.jar' -print0 | sort -z)
echo "$FLINK_CLASSPATH"":$FLINK_CONNECTORS""$FLINK_DIST"
```

将`$FLINK_CONNECTORS`插入到其中。

接下来，重启cluster，再次提交flink作业即可解决此问题。*同时，能解决所有这类问题。*

额外的信息：

- flink作业的jar依赖都用的 scope=provide。
- flink作业的jar的SPI没有关于mysql-cdc的相关定义。

即便如此，也能正确提交作业。
