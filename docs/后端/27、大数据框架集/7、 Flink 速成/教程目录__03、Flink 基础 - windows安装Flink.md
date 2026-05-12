# 03、Flink 基础 - windows安装Flink
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/2/3.html
- 分类：大数据框架
- 分组：教程目录
## 一、Flink下载

本次以Flink 1.9.0版本为例。

下载[flink-1.9.0-bin-scala_2.12.tgz](https://www.apache.org/dyn/closer.lua/flink/flink-1.9.0/flink-1.9.0-bin-scala_2.12.tgz)

下载后解压到 D:\flink\flink-1.9.0 目录

如果需要其他版本，可以在如下链接下载:

https://archive.apache.org/dist/flink/

## 二、运行Flink

## 2.1 Java安装

运行Flink 需要安装 Java 7.x 或更高的版本，操作系统需要 Win 7 或更高版本。

```java
C:\Users\Administrator>cd \
C:\>java -version
java version "1.8.0_201"
Java(TM) SE Runtime Environment (build 1.8.0_201-b09)
Java HotSpot(TM) 64-Bit Server VM (build 25.201-b09, mixed mode)
C:\>
```

如上图所示，则表示Java安装成功

## 2.2 运行Flink

运行Flink的命令非常简单，只需要进入到解压目录的bin目录下，运行start-cluster.bat即可

```java
C:\>D:
D:\>cd D:\flink\flink-1.9.0\bin
D:\flink\flink-1.9.0\bin>start-cluster.bat
Starting a local cluster with one JobManager process and one TaskManager process.
You can terminate the processes via CTRL-C in the spawned shell windows.
Web interface by default on http://localhost:8081/.
D:\flink\flink-1.9.0\bin>
```

## 三、访问 Flink UI

Flink有个UI界面，可以用于监控Flilnk的job运行状态，上一步已经给出了具体链接

http://localhost:8081/

## 四、运行自带的 WordCount 示例

以统计Flink 自带的 README.txt 文件为例。

命令:

```java
D:
cd D:\flink\flink-1.9.0\bin
flink.bat run D:\flink\flink-1.9.0\examples\batch\WordCount.jar -input D:\flink\flink-1.9.0\README.txt -output D:\flink\flink-1.9.0\README_CountWord_Result.txt
```

运行记录:

```java
C:\Users\Administrator>cd \
C:\>D:
D:\>cd D:\flink\flink-1.9.0\bin
D:\flink\flink-1.9.0\bin>
D:\flink\flink-1.9.0\bin>flink.bat run D:\flink\flink-1.9.0\examples\batch\WordCount.jar -input D:\flink\flink-1.9.0\README.txt -output D:\f
link\flink-1.9.0\README_CountWord_Result.txt
log4j:WARN No appenders could be found for logger (org.apache.flink.client.cli.CliFrontend).
log4j:WARN Please initialize the log4j system properly.
log4j:WARN See http://logging.apache.org/log4j/1.2/faq.html#noconfig for more info.
Starting execution of program
Program execution finished
Job with JobID 0a78fc943b501cbfc1f71ce541396ff7 has finished.
Job Runtime: 436 ms
D:\flink\flink-1.9.0\bin>
```

UI管理界面可以看到刚刚运行的FLink程序(之前运行失败了一个，所以是两个)
