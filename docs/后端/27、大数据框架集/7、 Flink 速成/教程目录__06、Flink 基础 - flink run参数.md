# 06、Flink 基础 - flink run参数
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/2/6.html
- 分类：大数据框架
- 分组：教程目录
执行flink run 后参数：

```java
参数说明
Action "run" compiles and runs a program.
Syntax: run [OPTIONS] <jar-file> <arguments>
"run" action options:
 -c,--class <classname>                         Class with the program entry
                                                point ("main" method or
                                                "getPlan()" method. Only
                                                needed if the JAR file does
                                                not specify the class in its
                                                manifest.
 -C,--classpath <url>                           Adds a URL to each user code
                                                classloader  on all nodes in
                                                the cluster. The paths must
                                                specify a protocol (e.g.
                                                file://) and be accessible
                                                on all nodes (e.g. by means
                                                of a NFS share). You can use
                                                this option multiple times
                                                for specifying more than one
                                                URL. The protocol must be
                                                supported by the {@link
                                                java.net.URLClassLoader}.
 -d,--detached                                  If present, runs the job in
                                                detached mode
 -m,--jobmanager <host:port>                    Address of the JobManager
                                                (master) to which to
                                                connect. Use this flag to
                                                connect to a different
                                                JobManager than the one
                                                specified in the
                                                configuration.
 -p,--parallelism <parallelism>                 The parallelism with which
                                                to run the program. Optional
                                                flag to override the default
                                                value specified in the
                                                configuration.
 -q,--sysoutLogging                             If present, suppress logging
                                                output to standard out.
 -s,--fromSavepoint <savepointPath>             Path to a savepoint to reset
                                                the job back to (for example
                                                file:///flink/savepoint-1537
                                                ).
 -z,--zookeeperNamespace <zookeeperNamespace>   Namespace to create the
                                                Zookeeper sub-paths for high
                                                availability mode
Options for yarn-cluster mode:
 -yD <arg>                            Dynamic properties
 -yd,--yarndetached                   Start detached
 -yid,--yarnapplicationId <arg>       Attach to running YARN session
 -yj,--yarnjar <arg>                  Path to Flink jar file
 -yjm,--yarnjobManagerMemory <arg>    Memory for JobManager Container [in
                                      MB]
 -yn,--yarncontainer <arg>            Number of YARN container to allocate
                                      (=Number of Task Managers)
 -ynm,--yarnname <arg>                Set a custom name for the application
                                      on YARN
 -yq,--yarnquery                      Display available YARN resources
                                      (memory, cores)
 -yqu,--yarnqueue <arg>               Specify YARN queue.
 -ys,--yarnslots <arg>                Number of slots per TaskManager
 -yst,--yarnstreaming                 Start Flink in streaming mode
 -yt,--yarnship <arg>                 Ship files in the specified directory
                                      (t for transfer)
 -ytm,--yarntaskManagerMemory <arg>   Memory per TaskManager Container [in
                                      MB]
 -yz,--yarnzookeeperNamespace <arg>   Namespace to create the Zookeeper
                                      sub-paths for high availability mode
-n 10 一共启动10个TaskManager节点
-jm 1024 JobManager的内存大小为1024M
-tm 2048 TaskManager的内存大小为2048M
-d 使用detached模式进行部署（部署完成后本地命令行可以退出）
-qu default 部署到YARN的default队列中
```
