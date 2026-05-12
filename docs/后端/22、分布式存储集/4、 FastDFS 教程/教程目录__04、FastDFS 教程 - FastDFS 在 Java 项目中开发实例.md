# 04、FastDFS 教程 - FastDFS 在 Java 项目中开发实例
- 来源：https://ddkk.com/zhuanlan/filestorage/fastdfs/2/4.html
- 分类：分布式存储
- 分组：教程目录
在实际项目开发中，FastDFS提供的主要功能有

- **upload**：上传文件
- **download**：下载文件
- **delete**：删除文件

## 一、FastDFS文件系统的 Java 客户端

FastDFS 文件系统 Java 客户端是指采用 Java 语言编写的一套程序，专门用来访问 FastDFS文件系统，其实就是一个 jar 包。

> 注意：如果能连上 mvnrepository上搜索到的用友云提供的 fastdfs-client，那大家就下载那个 jar 包使用，如果连不上，这个 jar 包需要我们自己来打。

**下载官方的源代码**

从[https://codeload.github.com/happyfish100/fastdfs-client-java/zip/master](https://codeload.github.com/happyfish100/fastdfs-client-java/zip/master) 上下载FastDFS源代码到本地

**解压之后，采用 maven 命令编译成 jar 安装到本地 maven 库**

之后，在 Java 程序中使用它提供的 API 来访问 FastDFS 文件系统。

## 二、文件上传功能的实现

**A、使用 IDEA 创建普通的 maven 项目，不需要使用模板**

**B、在 pom.xml 文件中添加我们打包好的 FastDFS 本地仓库的 jar 包 (FastDFS的 java客户端依赖)**

**C、拷贝源代码包中的 fdfs_client.conf 文件到 resources 目录下，在里面主要配置 tracker 地址**

**D、编写代码，进行上传测试**

```java
package com.fancy.fastdfs;
import org.csource.common.MyException;
import org.csource.fastdfs.*;
import java.io.IOException;
public class FastDFS {
    public static void main(String[] args) {
        fileUpload();
    }
    //上传文件的方法
    public static void fileUpload() {
        TrackerServer trackerServer = null;
        StorageServer storageServer = null;
        try {
            //1.加载配置文件，默认去classpath下加载
            ClientGlobal.init("fdfs_client.conf");
            //2.创建TrackerClient对象
            TrackerClient trackerClient = new TrackerClient();
            //3.创建TrackerServer对象
            trackerServer = trackerClient.getConnection();
            //4.创建StorageServler对象
            storageServer = trackerClient.getStoreStorage(trackerServer);
            //5.创建StorageClient对象，这个对象完成对文件的操作
            StorageClient storageClient = new StorageClient(trackerServer, storageServer);
            //6.上传文件  第一个参数：本地文件路径 第二个参数：上传文件的后缀 第三个参数：文件信息
            String[] uploadArray = storageClient.upload_file("D:/test.txt", "txt", null);
            for (String str : uploadArray) {
                System.out.println(str);
            }
        } catch (IOException e) {
            e.printStackTrace();
        } catch (MyException e) {
            e.printStackTrace();
        } finally {
            if (storageServer != null) {
                try {
                    storageServer.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
            if (trackerServer != null) {
                try {
                    trackerServer.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }
}
```

**E、运行程序，在 Linux 上，FastDFS 存储目录下查看上传文件内容**

## 三、将文件上传功能中的公共代码进行封装

因为使用 FastDFS 进行文件操作代码大多都是通用的，所以我们这里在 FastDFS 类中将通用的功能进行封装，并提供上传、下载、删除文件的方法。

**注意：这里只是简单的封装，如果多线程会有问题**

**A、抽取获取StorageClient的方法**

```java
public static StorageClient getStorageClient() throws IOException, MyException {
    //1.加载配置文件，默认去classpath下加载
    ClientGlobal.init("fdfs_client.conf");
    //2.创建TrackerClient对象
    TrackerClient trackerClient = new TrackerClient();
    //3.创建TrackerServer对象
    trackerServer = trackerClient.getConnection();
    //4.创建StorageServler对象
    storageServer = trackerClient.getStoreStorage(trackerServer);
    //5.创建StorageClient对象，这个对象完成对文件的操作
    StorageClient storageClient = new StorageClient(trackerServer,storageServer);
    return storageClient;
}
```

**B、定义两个全局变量**

```java
private static TrackerServer trackerServer = null;
private static StorageServer storageServer = null;
```

**C、抽取关闭资源的方法**

```java
public static void closeFastDFS() {
    if (storageServer != null) {
        try {
            storageServer.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    if (trackerServer != null) {
        try {
            trackerServer.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

**D、改造文件上传的方法**

```java
public static void fileUpload(){
    try {
        //1. 获取StorageClient对象
        StorageClient storageClient = getStorageClient();
        //2.上传文件  第一个参数：本地文件路径 第二个参数：上传文件的后缀 第三个参数：文件信息
        String [] uploadArray = storageClient.upload_file("D:/aa.txt","txt",null);
        for (String str:uploadArray) {
            System.out.println(str);
        }
    } catch (IOException e) {
        e.printStackTrace();
    } catch (MyException e) {
        e.printStackTrace();
    } finally {
        closeFastDFS();
    }
}
```

**E、下载文件的方法**

```java
public static void fileDownload(){
    try {
        //1. 获取StorageClient对象
        StorageClient storageClient = getStorageClient();
        //2.下载文件 返回0表示成功，其它均表示失败
        int num = storageClient.download_file("group1",
                "M00/00/00/wKjrgFxOqueAAPWKAAAAKAM14xY563.txt","E:/bb.txt");
        System.out.println(num);
    } catch (IOException e) {
        e.printStackTrace();
    } catch (MyException e) {
        e.printStackTrace();
    } finally {
        closeFastDFS();
    }
}
```

**F、删除文件的方法**

```java
/删除文件的方法
public static void fileDelete(){
    try {
        //1. 获取StorageClient对象
        StorageClient storageClient = getStorageClient();
        //2.删除文件 返回0表示成功，其它均表示失败
        int num = storageClient.delete_file("group1",
        "M00/00/00/wKjrgFxOqueAAPWKAAAAKAM14xY563.txt");
        System.out.println(num);
    } catch (IOException e) {
        e.printStackTrace();
    } catch (MyException e) {
        e.printStackTrace();
    } finally {
        closeFastDFS();
    }
}
```
