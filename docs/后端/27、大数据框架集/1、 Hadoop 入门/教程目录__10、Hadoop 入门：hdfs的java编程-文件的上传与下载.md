# 10、Hadoop 入门：hdfs的java编程-文件的上传与下载
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/1/10.html
- 分类：大数据框架
- 分组：教程目录
## 上传文件

### 方式一：常规流程

```java
@Test
public void uploadFile2Hdfs() throws IOException {
    // configuration
    Configuration configuration = new Configuration();
    // 设置namenode
    configuration.set("fs.defaultFS","hdfs://node001:8020");
    // filesystem
    FileSystem fileSystem = FileSystem.get(configuration);
    // 拷贝文件
    fileSystem.copyFromLocalFile(new Path("pom.xml"),new Path("/sjj/test"));
    // 释放资源
    fileSystem.close();
}
```

### 方式二：I/O上传文件

```java
@Test
public void putFile2Hdfs() throws URISyntaxException, IOException, InterruptedException {
    // 获取文件系统
    Configuration configuration = new Configuration();
    FileSystem fileSystem = FileSystem.get(new URI("hdfs://node001:8020"), configuration, "sjj");
    // 创建输入流
    FileInputStream fis = new FileInputStream(new File("pom.xml"));
    // 获取输入流，父目录不存在会自动创建
    FSDataOutputStream fos = fileSystem.create(new Path("/sjj/test/pom.xml"));
    // 流对拷 org.apache.commons.io.IOUtils
    IOUtils.copy(fis,fos);
    // 释放资源
    IOUtils.closeQuietly(fos);
    IOUtils.closeQuietly(fis);
    fileSystem.close();
}
```

## 下载文件

### 方式一：常规流程

```java
@Test
public void downloadFileFromHdfs() throws IOException {
    // configuration
    Configuration configuration = new Configuration();
    // 设置namenode
    configuration.set("fs.defaultFS","hdfs://node001:8020");
    // filesystem
    FileSystem fileSystem = FileSystem.get(configuration);
    // 下载文件
    fileSystem.copyToLocalFile(new Path("/sjj/test/pom.xml"),new Path("/Users/soutsukyou/Desktop/ForHadoop/"));
    // 释放资源
    fileSystem.close();
}
```

### 方式二：I/O下载文件

```java
@Test
public void getFileFromHdfs() throws URISyntaxException, IOException, InterruptedException {
    // 获取文件系统
    Configuration configuration = new Configuration();
    FileSystem fileSystem = FileSystem.get(new URI("hdfs://node001:8020"), configuration, "sjj");
    // 创建输入流
    FSDataInputStream fis = fileSystem.open(new Path("/sjj/test/pom.xml"));
    // 获取输出流
    FileOutputStream fos = new FileOutputStream("/Users/soutsukyou/Desktop/ForHadoop/");
    // 流对拷 org.apache.commons.io.IOUtils
    IOUtils.copy(fis,fos);
    // 释放资源
    IOUtils.closeQuietly(fos);
    IOUtils.closeQuietly(fis);
    fileSystem.close();
}
```

## 其它操作

```java
// 删除文件
fileSystem.delete();
// 重命名文件
fileSystem.rename();
```
