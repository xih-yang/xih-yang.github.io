# 06、Hadoop 教程 - HDFS的API操作
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/3/6.html
- 分类：大数据框架
- 分组：教程目录
## 1. 客户端环境准备

需要在win10上运行hadoop，需要安装对应的hadoop包，并配置环境变量

### 1.1. win10安装hadoop环境

在win10上安装hadoop环境，只需要将对应的包解压到文件夹下即可，如下图所示：

注：还可以在win10上搭建伪分布式集群，参考连接：[windows环境搭建hadoop伪集群 - 简书](https://www.jianshu.com/p/1e7e9a70262d)

### 1.2. 配置Hadoop环境变量

1）配置HADOOP_HOME环境变量

2）配置Path环境变量。注意：如果环境变量不起作用，可以重启电脑试试。

3）配置winutils

hadoop因为主要是在Linux中运行，在win10中可能会出问题，此时需要配置winutils，具体配置可以参考另一篇文章： [Hadoop 之 winutils_电光闪烁的博客-CSDN博客_hadoop winutils](https://blog.csdn.net/yang_shibiao/article/details/122620656)

注意：winutils配置在hadoop的bin下，或者C:\Windows\System32 下均可

## 1.3. 在IDEA中创建Maven工程

1）对应pom依赖

```java
<dependencies>
    <dependency>
        <groupId>org.apache.hadoop</groupId>
        <artifactId>hadoop-client</artifactId>
        <version>3.1.3</version>
    </dependency>
    <dependency>
        <groupId>junit</groupId>
        <artifactId>junit</artifactId>
        <version>4.12</version>
    </dependency>
    <dependency>
        <groupId>org.slf4j</groupId>
        <artifactId>slf4j-log4j12</artifactId>
        <version>1.7.30</version>
    </dependency>
</dependencies>
```

2）在项目的src/main/resources目录下，新建一个文件，命名为“log4j.properties”，在文件中填入

```java
log4j.rootLogger=INFO, stdout  
log4j.appender.stdout=org.apache.log4j.ConsoleAppender  
log4j.appender.stdout.layout=org.apache.log4j.PatternLayout  
log4j.appender.stdout.layout.ConversionPattern=%d %p [%c] - %m%n  
log4j.appender.logfile=org.apache.log4j.FileAppender  
log4j.appender.logfile.File=target/spring.log  
log4j.appender.logfile.layout=org.apache.log4j.PatternLayout  
log4j.appender.logfile.layout.ConversionPattern=%d %p [%c] - %m%n
```

3）创建对应包名，并创建HdfsClient类

```java
package com.ouyang.hdfs;
import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.FileSystem;
import org.apache.hadoop.fs.Path;
import org.junit.Test;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @ desc: 项目描述
 */
public class HdfsClient {
    @Test
    public void testMkdirs() throws IOException, URISyntaxException, InterruptedException {
        // 1 获取文件系统
        Configuration configuration = new Configuration();
        FileSystem fs = FileSystem.get(new URI("hdfs://yangshibiao:8020"), configuration, "root");
        // 2 创建目录
        fs.mkdirs(new Path("/sanguo/zhugeliang/"));
        // 3 关闭资源
        fs.close();
    }
}
```

4）执行程序。客户端去操作HDFS时，是有一个用户身份的。默认情况下，HDFS客户端API会从采用Windows默认用户访问HDFS，会报权限异常错误。所以在访问HDFS时，一定要配置用户。

## 2. HDFS的API案例实操

### 2.1. HDFS文件上传（测试参数优先级）

1）编写源代码

```java
@Test
public void testCopyFromLocalFile() throws IOException, InterruptedException, URISyntaxException {
    // 1 获取文件系统
    Configuration configuration = new Configuration();
    configuration.set("dfs.replication", "2");
    FileSystem fs = FileSystem.get(new URI("hdfs://hadoop102:8020"), configuration, "atguigu");
    // 2 上传文件
    fs.copyFromLocalFile(new Path("d:/sunwukong.txt"), new Path("/xiyou/huaguoshan"));
    // 3 关闭资源
    fs.close();
｝
```

2）将hdfs-site.xml拷贝到项目的resources资源目录下

```java
<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
<configuration>
	<property>
		<name>dfs.replication</name>
         <value>1</value>
	</property>
</configuration>
```

3）参数优先级

> 参数优先级排序：（1）客户端代码中设置的值 >（2）ClassPath下的用户自定义配置文件 >（3）然后是服务器的自定义配置（xxx-site.xml） >（4）服务器的默认配置（xxx-default.xml）

### 2.2. HDFS文件下载

```java
@Test
public void testCopyToLocalFile() throws IOException, InterruptedException, URISyntaxException{
    // 1 获取文件系统
    Configuration configuration = new Configuration();
    FileSystem fs = FileSystem.get(new URI("hdfs://hadoop102:8020"), configuration, "atguigu");
    // 2 执行下载操作
    // boolean delSrc 指是否将原文件删除
    // Path src 指要下载的文件路径
    // Path dst 指将文件下载到的路径
    // boolean useRawLocalFileSystem 是否开启文件校验
    fs.copyToLocalFile(false, new Path("/xiyou/huaguoshan/sunwukong.txt"), new Path("d:/sunwukong2.txt"), true);
    // 3 关闭资源
    fs.close();
}
```

注意：如果执行上面代码，下载不了文件，有可能是你电脑的微软支持的运行库少，需要安装一下微软运行库。

### 2.3. HDFS文件更名和移动

```java
@Test
public void testRename() throws IOException, InterruptedException, URISyntaxException{
	// 1 获取文件系统
	Configuration configuration = new Configuration();
	FileSystem fs = FileSystem.get(new URI("hdfs://hadoop102:8020"), configuration, "atguigu"); 
	// 2 修改文件名称
	fs.rename(new Path("/xiyou/huaguoshan/sunwukong.txt"), new Path("/xiyou/huaguoshan/meihouwang.txt"));
	// 3 关闭资源
	fs.close();
}
```

### 2.4. HDFS删除文件和目录

```java
@Test
public void testDelete() throws IOException, InterruptedException, URISyntaxException{
	// 1 获取文件系统
	Configuration configuration = new Configuration();
	FileSystem fs = FileSystem.get(new URI("hdfs://hadoop102:8020"), configuration, "atguigu");
	// 2 执行删除
	fs.delete(new Path("/xiyou"), true);
	// 3 关闭资源
	fs.close();
}
```

### 2.5. HDFS文件详情查看

查看文件名称、权限、长度、块信息

```java
@Test
public void testListFiles() throws IOException, InterruptedException, URISyntaxException {
	// 1获取文件系统
	Configuration configuration = new Configuration();
	FileSystem fs = FileSystem.get(new URI("hdfs://hadoop102:8020"), configuration, "atguigu");
	// 2 获取文件详情
	RemoteIterator<LocatedFileStatus> listFiles = fs.listFiles(new Path("/"), true);
	while (listFiles.hasNext()) {
		LocatedFileStatus fileStatus = listFiles.next();
		System.out.println("========" + fileStatus.getPath() + "=========");
		System.out.println(fileStatus.getPermission());
		System.out.println(fileStatus.getOwner());
		System.out.println(fileStatus.getGroup());
		System.out.println(fileStatus.getLen());
		System.out.println(fileStatus.getModificationTime());
		System.out.println(fileStatus.getReplication());
		System.out.println(fileStatus.getBlockSize());
		System.out.println(fileStatus.getPath().getName());
		// 获取块信息
		BlockLocation[] blockLocations = fileStatus.getBlockLocations();
		System.out.println(Arrays.toString(blockLocations));
	}
	// 3 关闭资源
	fs.close();
}
```

### 2.6. HDFS文件和文件夹判断

```java
@Test
public void testListStatus() throws IOException, InterruptedException, URISyntaxException{
    // 1 获取文件配置信息
    Configuration configuration = new Configuration();
    FileSystem fs = FileSystem.get(new URI("hdfs://hadoop102:8020"), configuration, "atguigu");
    // 2 判断是文件还是文件夹
    FileStatus[] listStatus = fs.listStatus(new Path("/"));
    for (FileStatus fileStatus : listStatus) {
        // 如果是文件
        if (fileStatus.isFile()) {
            System.out.println("f:"+fileStatus.getPath().getName());
        }else {
            System.out.println("d:"+fileStatus.getPath().getName());
        }
    }
    // 3 关闭资源
    fs.close();
}
```
