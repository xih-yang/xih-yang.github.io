# 05、FastDFS 教程 - FastDFS常用命令总结
- 来源：https://ddkk.com/zhuanlan/filestorage/fastdfs/1/5.html
- 分类：分布式存储
- 分组：教程目录
**1、启动FastDFS**

```java
tracker: /usr/local/bin/fdfs_trackered %FastDFS%/tracker.conf
storage: /usr/local/bin/fdfs_storaged %FastDFS%/storage.conf
```

也可以简写为：

```java
tracker: fdfs_trackered %FastDFS%/tracker.conf
storage: fdfs_storaged %FastDFS%/storage.conf
```

其中的%FastDFS%指的是FastDFS的所在目录，根据自己的情况进行替换即可。

**2、关闭FastDFS**

```java
tracker: /usr/local/bin/stop.sh fdfs_tracker
storage: /usr/local/bin/stop.sh fdfs_storage
```

或者

```java
killall fdfs_trackered
killall fdfs_storaged
```

注意，千万不要使用kill-9强行杀死进程。

**3、重启FastDFS**

```java
tracker: /usr/local/bin/restart.sh fdfs_trackered
storage: /usr/local/bin/restart.sh fdfs_storaged
```

**4、查看集群情况**

在任意一台storage(tracker也可以)

```java
/usr/local/bin/fdfs_monitor %FastDFS%/storage.conf
```

**5、删除一个storage**

在任意一台storage(tracker也可以)

```java
/usr/local/bin/fdfs_monitor %FastDFS%/storage.conf delete group2 20.12.1.73
```

**6、测试上传**

```java
fdfs_test /etc/fdfs/client.conf upload test.txt
```
