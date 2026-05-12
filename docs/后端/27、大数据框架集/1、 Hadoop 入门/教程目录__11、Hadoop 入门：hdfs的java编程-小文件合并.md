# 11、Hadoop 入门：hdfs的java编程-小文件合并
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/1/11.html
- 分类：大数据框架
- 分组：教程目录
*上一篇章涉及到了I/O方式上传下载文件*

*这一篇我们来实现一下小文件合并*

### 代码

```java
/**
 * 小文件合并：读取本地小文件合并到hdfs的大文件中
 */
@Test
public void mergeFile() throws URISyntaxException, IOException, InterruptedException {
    // 获取分布式文件系统
    FileSystem fileSystem = FileSystem.get(new URI("hdfs://node001:8020"), new Configuration(), "sjj");
    FSDataOutputStream fsDataOutputStream = fileSystem.create(new Path("/xxx/.../bigFile.xml"));
    // 获取本地文件系统
    LocalFileSystem localFileSystem = FileSystem.getLocal(new Configuration());
    // 读取本地文件
    FileStatus[] fileStatuses = localFileSystem.listStatus(new Path("/xxx/.../smallFiles"));
    for(FileStatus fileStatus:fileStatuses){
        // 获取每一个本地文件路径
        Path path = fileStatus.getPath();
        // 读取本地小文件
        FSDataInputStream fsDataInputStream = localFileSystem.open(path);
        // 流对拷 org.apache.commons.io.IOUtils
        IOUtils.copy(fsDataInputStream,fsDataOutputStream);
        // 释放资源
        IOUtils.closeQuietly(fsDataInputStream);
    }
    // 释放资源
    IOUtils.closeQuietly(fsDataOutputStream);
    localFileSystem.close();
    fileSystem.close();
}
```
