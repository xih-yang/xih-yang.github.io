# 07、Spark深入解析、SparkCore之IDEA编写WordCount
- 来源：https://ddkk.com/zhuanlan/bigdata/spark/1/7.html
- 分类：大数据框架
- 分组：教程目录
## pom.xml

创建Maven项目并补全目录，配置pom.xml文件

```java
//pom文件中此处可将scala修改java或重新创建scala包
<sourceDirectory>src/main/scala</sourceDirectory>
        <testSourceDirectory>src/test/scala</testSourceDirectory>
```

```java
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>cn.itcast</groupId>
    <artifactId>SparkDemo</artifactId>
    <version>1.0-SNAPSHOT</version>
    <!-- 指定仓库位置，依次为aliyun、cloudera和jboss仓库 -->
    <repositories>
        <repository>
            <id>aliyun</id>
            <url>http://maven.aliyun.com/nexus/content/groups/public/</url>
        </repository>
        <repository>
            <id>cloudera</id>
            <url>https://repository.cloudera.com/artifactory/cloudera-repos/</url>
        </repository>
        <repository>
            <id>jboss</id>
            <url>http://repository.jboss.com/nexus/content/groups/public</url>
        </repository>
    </repositories>
    <properties>
        <maven.compiler.source>1.8</maven.compiler.source>
        <maven.compiler.target>1.8</maven.compiler.target>
        <encoding>UTF-8</encoding>
        <scala.version>2.11.8</scala.version>
        <scala.compat.version>2.11</scala.compat.version>
        <hadoop.version>2.7.4</hadoop.version>
        <spark.version>2.2.0</spark.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.scala-lang</groupId>
            <artifactId>scala-library</artifactId>
            <version>${scala.version}</version>
        </dependency>
        <dependency>
            <groupId>org.apache.spark</groupId>
            <artifactId>spark-core_2.11</artifactId>
            <version>${spark.version}</version>
        </dependency>
        <dependency>
            <groupId>org.apache.spark</groupId>
            <artifactId>spark-sql_2.11</artifactId>
            <version>${spark.version}</version>
        </dependency>
        <dependency>
            <groupId>org.apache.spark</groupId>
            <artifactId>spark-hive_2.11</artifactId>
            <version>${spark.version}</version>
        </dependency>
        <dependency>
            <groupId>org.apache.spark</groupId>
            <artifactId>spark-hive-thriftserver_2.11</artifactId>
            <version>${spark.version}</version>
        </dependency>
        <dependency>
            <groupId>org.apache.spark</groupId>
            <artifactId>spark-streaming_2.11</artifactId>
            <version>${spark.version}</version>
        </dependency>
        <!-- <dependency>
             <groupId>org.apache.spark</groupId>
             <artifactId>spark-streaming-kafka-0-8_2.11</artifactId>
             <version>${spark.version}</version>
         </dependency>-->
        <dependency>
            <groupId>org.apache.spark</groupId>
            <artifactId>spark-streaming-kafka-0-10_2.11</artifactId>
            <version>${spark.version}</version>
        </dependency>
        <dependency>
            <groupId>org.apache.spark</groupId>
            <artifactId>spark-sql-kafka-0-10_2.11</artifactId>
            <version>${spark.version}</version>
        </dependency>
        <!--<dependency>
            <groupId>org.apache.hadoop</groupId>
            <artifactId>hadoop-client</artifactId>
            <version>2.6.0-mr1-cdh5.14.0</version>
        </dependency>
        <dependency>
            <groupId>org.apache.hbase</groupId>
            <artifactId>hbase-client</artifactId>
            <version>1.2.0-cdh5.14.0</version>
        </dependency>
        <dependency>
            <groupId>org.apache.hbase</groupId>
            <artifactId>hbase-server</artifactId>
            <version>1.2.0-cdh5.14.0</version>
        </dependency>-->
        <dependency>
            <groupId>org.apache.hadoop</groupId>
            <artifactId>hadoop-client</artifactId>
            <version>2.7.4</version>
        </dependency>
        <dependency>
            <groupId>org.apache.hbase</groupId>
            <artifactId>hbase-client</artifactId>
            <version>1.3.1</version>
        </dependency>
        <dependency>
            <groupId>org.apache.hbase</groupId>
            <artifactId>hbase-server</artifactId>
            <version>1.3.1</version>
        </dependency>
        <dependency>
            <groupId>com.typesafe</groupId>
            <artifactId>config</artifactId>
            <version>1.3.3</version>
        </dependency>
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>5.1.38</version>
        </dependency>
    </dependencies>
    <build>
        <sourceDirectory>src/main/scala</sourceDirectory>
        <testSourceDirectory>src/test/scala</testSourceDirectory>
        <plugins>
            <!-- 指定编译java的插件 -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.5.1</version>
            </plugin>
            <!-- 指定编译scala的插件 -->
            <plugin>
                <groupId>net.alchim31.maven</groupId>
                <artifactId>scala-maven-plugin</artifactId>
                <version>3.2.2</version>
                <executions>
                    <execution>
                        <goals>
                            <goal>compile</goal>
                            <goal>testCompile</goal>
                        </goals>
                        <configuration>
                            <args>
                                <arg>-dependencyfile</arg>
                                <arg>${project.build.directory}/.scala_dependencies</arg>
                            </args>
                        </configuration>
                    </execution>
                </executions>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <version>2.18.1</version>
                <configuration>
                    <useFile>false</useFile>
                    <disableXmlReport>true</disableXmlReport>
                    <includes>
                        <include>**/*Test.*</include>
                        <include>**/*Suite.*</include>
                    </includes>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-shade-plugin</artifactId>
                <version>2.3</version>
                <executions>
                    <execution>
                        <phase>package</phase>
                        <goals>
                            <goal>shade</goal>
                        </goals>
                        <configuration>
                            <filters>
                                <filter>
                                    <artifact>*:*</artifact>
                                    <excludes>
                                        <exclude>META-INF/*.SF</exclude>
                                        <exclude>META-INF/*.DSA</exclude>
                                        <exclude>META-INF/*.RSA</exclude>
                                    </excludes>
                                </filter>
                            </filters>
                            <transformers>
                                <transformer
                                        implementation="org.apache.maven.plugins.shade.resource.ManifestResourceTransformer">
                                    <mainClass></mainClass>
                                </transformer>
                            </transformers>
                        </configuration>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
```

## 本地运行

- 准备数据

vimwords.txt

```java
hello me you her 
hello you her
hello her 
hello
```

**代码实现**

```java
import org.apache.spark.rdd.RDD
import org.apache.spark.{
     SparkConf, SparkContext}
//WordCount本地运行
object WordCountToLoad {
  def main(args: Array[String]): Unit = {
    //创建SparkConf
    //AppName：执行任务名称
    //Master：设置使用资源
    //local[*]：表示当前机器上所有可用资源
    val conf: SparkConf = new SparkConf().setAppName("WordCount").setMaster("local[*]")
    //创建SparkContext上下文对象
    val sc = new SparkContext(conf)
    //设置日志级别
    sc.setLogLevel("WARN")
    //读取文件
    val wordsTXT: RDD[String] = sc.textFile("src/data/words.txt")
    //处理数据
    //对每一行按空格进行切分，并扁平形成一个新的集合（集合中装有一个个的单词）
    //flatMap：对集合中的每一个元素进行操作，再进行扁平
    val wordRDD: RDD[String] = wordsTXT.flatMap(_.split(" "))
    //将每个单词记为1
    val wordOne: RDD[(String, Int)] = wordRDD.map((_, 1))
    //根据key进行聚合，统计每个单词的数量
    //例如：计算1,2,3,4,5相加之和
    //使用reduceByKey((a,b)=>a+b)计算
    //第一次计算：a=1,b=2  =>a+b  =>1+2
    //第二次计算：a=3,b=3  =>a+b  =>3+3
    //第三次计算：a=6,b=4  =>a+b  =>6+4
    //第四次计算：a=10,b=5  =>a+b  =>10+5
    //最终结果为15
    //第一个_：之前累加的结果
    //第二个_：当前进来的数据
    val wordCount: RDD[(String, Int)] = wordOne.reduceByKey(_ + _)
    //查询结果并输出
    val result: Array[(String, Int)] = wordCount.collect()
    result.foreach(println)
  }
```

## 集群运行

**准备数据**

vimwords.txt

```java
hello me you her 
hello you her
hello her 
hello
```

**代码实现**

```java
import org.apache.spark.{
     SparkConf, SparkContext}
import org.apache.spark.rdd.RDD
//WordCount集群运行
object WordCountToHDFS {
  def main(args: Array[String]): Unit = {
    //创建SparkConf
    //AppName：执行任务名称
    //Master：设置使用资源
    //local[*]：表示当前机器上所有可用资源
    val conf: SparkConf = new SparkConf().setAppName("WordCount")//.setMaster("local[*]")
    //创建SparkContext上下文对象
    val sc = new SparkContext(conf)
    //设置日志级别
    sc.setLogLevel("WARN")
    //读取文件
    //val wordsTXT: RDD[String] = sc.textFile("src/data/words.txt")
    //文件输入路径
    val wordsTXT: RDD[String] = sc.textFile(args(0))
    //处理数据
    //对每一行按空格进行切分，并扁平形成一个新的集合（集合中装有一个个的单词）
    //flatMap：对集合中的每一个元素进行操作，再进行扁平
    val wordRDD: RDD[String] = wordsTXT.flatMap(_.split(" "))
    //将每个单词记为1
    val wordOne: RDD[(String, Int)] = wordRDD.map((_, 1))
    //根据key进行聚合，统计每个单词的数量
    //例如：计算1,2,3,4,5相加之和
    //使用reduceByKey((a,b)=>a+b) 计算
    //第一次计算：a=1,b=2  =>a+b  =>1+2
    //第二次计算：a=3,b=3  =>a+b  =>3+3
    //第三次计算：a=6,b=4  =>a+b  =>6+4
    //第四次计算：a=10,b=5  =>a+b  =>10+5
    //最终结果为15
    //第一个_：之前累加的结果
    //第二个_：当前进来的数据
    val wordCount: RDD[(String, Int)] = wordOne.reduceByKey(_ + _)
    //查询结果并输出
    //文件输出路径
    wordCount.saveAsTextFile(args(1))
    //val result: Array[(String, Int)] = wordCount.collect()
    //result.foreach(println)
  }
}
```

- 打包

- 执行命令提交到YARN集群

```java
//参数说明详见文章末尾
/export/servers/spark-2.2.0-bin-2.6.0-cdh5.14.0/bin/spark-submit \
--class com.czxy.demo.WordCountToHDFS \
--master yarn \
--deploy-mode cluster \
--driver-memory 1g \
--executor-memory 1g \
--executor-cores 2 \
--queue default \
/opt/wordcount.jar \
hdfs://node01:8020/words.txt \
hdfs://node01:8020/wordcount_output
```

## Spark参数详解

**spark-shell**

**spark-shell是Spark自带的交互式Shell程序**，方便用户进行交互式编程，用户可以在该命令行下可以用scala编写spark程序，适合学习测试时使用！

- 示例

spark-shell可以携带参数

spark-shell --master local[N] 数字N表示在本地模拟N个线程来运行当前任务

spark-shell --master local[*] *表示使用当前机器上所有可用的资源

默认不携带参数就是–master local[*]

spark-shell --master spark://node01:7077,node02:7077 表示运行在集群上

**spark-submit**

**spark-submit命令用来提交jar包给spark集群/YARN**

spark-shell交互式编程确实很方便我们进行学习测试，但是在实际中我们一般是使用IDEA开发Spark应用程序打成jar包交给Spark集群/YARN去执行。

spark-submit命令是我们开发时常用的!!!

- 示例：计算π

cd/export/servers/spark

执行以下命令

```java
/export/servers/spark/bin/spark-submit \
--class org.apache.spark.examples.SparkPi \
--master spark://node01:7077  \
--executor-memory 1g \
--total-executor-cores 2 \
/export/servers/spark/examples/jars/spark-examples_2.11-2.2.0.jar \
10
```

**参数总结**

- Master参数形式

Master形式
解释

local
本地以一个worker线程运行(例如非并行的情况).

local[N]
本地以K worker 线程 (理想情况下, N设置为你机器的CPU核数).

local[*]
本地以本机同样核数的线程运行.

spark://HOST:PORT
连接到指定的Spark standalone cluster master. 端口是你的master集群配置的端口，缺省值为7077.

mesos://HOST:PORT
连接到指定的Mesos 集群. Port是你配置的mesos端口， 默认5050. 或者使用ZK,格式为 mesos://zk://…

yarn-client
以client模式连接到YARN cluster. 集群的位置基于HADOOP_CONF_DIR 变量找到.

yarn-cluster
以cluster模式连接到YARN cluster. 集群的位置基于HADOOP_CONF_DIR 变量找到.

- 其他参数

参数
含义

–master spark://node01:7077
指定 Master 的地址

–name “appName”
指定程序运行的名称

–class
程序的main方法所在的类

–jars xx.jar
程序额外使用的 jar 包

–driver-memory 512m
Driver运行所需要的内存, 默认1g

–executor-memory 2g
指定每个 executor 可用内存为 2g， 默认1g

–executor-cores 1
指定每一个 executor 可用的核数

–total-executor-cores 2
指定整个集群运行任务使用的 cup 核数为 2 个

–queue default
指定任务的对列

–deploy-mode
指定运行模式（client/cluster）

- 注意：

如果worker 节点的内存不足，那么在启动 spark-submit的时候，就不能为 executor分配超出 worker 可用的内存容量。

如果–executor-cores超过了每个 worker 可用的 cores，任务处于等待状态。

如果–total-executor-cores即使超过可用的 cores，默认使用所有的。以后当集群其他的资源释放之后，就会被该程序所使用。

如果内存或单个 executor 的 cores 不足，启动 spark-submit 就会报错，任务处于等待状态，不能正常执行。
