# 09、Hadoop 入门：hdfs的java编程-创建目录
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/1/9.html
- 分类：大数据框架
- 分组：教程目录
## 前言

[api文档](https://hadoop.apache.org/docs/stable/api/index.html)

*为了方便，我先在test下新建*

## 文件编写

### 创建文件

### 编写文件

```java
import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.FileSystem;
import org.apache.hadoop.fs.Path;
import org.junit.Test;
import java.io.IOException;
public class HdfsOperate {
    /**
     * 创建目录
     */
    @Test
    public void mkDirOnHdfs() throws IOException {
        // configuration
        Configuration configuration = new Configuration();
        // 设置namenode
        configuration.set("fs.defaultFS","hdfs://node001:8020");
        // filesystem
        FileSystem fileSystem = FileSystem.get(configuration);
        // 通过filesystem对象创建目录
        boolean ans = fileSystem.mkdirs(new Path("/sjj/test"));
        System.out.println("创建结果："+ans);
        // 释放资源
        fileSystem.close();
    }
}
```

或者这样写

```java
@Test
public void mkDirOnHdfs_2() throws IOException, URISyntaxException, InterruptedException {
    // configuration
    Configuration configuration = new Configuration();
    // filesystem
    FileSystem fileSystem = FileSystem.get(new URI("hdfs://node001:8020"), configuration, "sjj");
    // 通过filesystem对象创建目录
    boolean ans = fileSystem.mkdirs(new Path("/sjj/test_2"));
    System.out.println("创建结果："+ans);
    // 释放资源
    fileSystem.close();
}
```

### 运行文件

**运行文件之前确保你的hadoop集群是打开的**

## 创建目录时指定权限

```java
// 创建目录时指定权限
@Test
public void mkDirOnHdfs_3() throws IOException, URISyntaxException, InterruptedException {
    // configuration
    Configuration configuration = new Configuration();
    // filesystem对象、设置namenode
    FileSystem fileSystem = FileSystem.get(new URI("hdfs://node001:8020"), configuration, "sjj");
    // 设置权限(当前用户拥有读写权限，当前用户组其它用户拥有读权限，其它用户组用户拥有读权限)
    FsPermission fsPermission = new FsPermission(FsAction.READ_WRITE, FsAction.READ, FsAction.READ);
    // 通过filesystem对象创建目录
    boolean ans = fileSystem.mkdirs(new Path("/sjj/test_3"),fsPermission);
    System.out.println("创建结果："+ans);
    // 释放资源
    fileSystem.close();
}
```
