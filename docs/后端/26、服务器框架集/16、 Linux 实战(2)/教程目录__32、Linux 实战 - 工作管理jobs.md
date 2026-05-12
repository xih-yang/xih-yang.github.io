# 32、Linux 实战 - 工作管理jobs
- 来源：https://ddkk.com/zhuanlan/server/linux/5/32.html
- 分类：服务器框架
- 分组：教程目录
## 工作管理——jobs命令

### 工作管理简介

因为处理后台进程的命令为jobs，所以把后台进程处理称作工作管理。

后台管理中的注意事项：

- 前台是指可以操控和执行命令的这个环境，后台的进程可以自由运行，不能用ctrl+c来终止，只能用fg/bg来调用。
- 当前的登录终端，只能管理当前的终端的工作，而不能管理其他的登录终端的工作。
- 放入后台的命令必须可以持续运行一段时间。
- 放入后台的命令不需要和前台 用户有交互，否则放入后台也只会停止运行。

### 怎么把服务放入后台

- **在命令后面加上"空格&"。**

```java
[root@ddkk.com ~]# tar -zcf etc.tar.gz /etc &
[1] 2590
[root@ddkk.com ~]# tar: 从成员名中删除开头的“/”
jobs
[1]+  运行中               tar -zcf etc.tar.gz /etc &
```

- **在命令执行时按ctrl+z，命令会暂停并且进入后台。**

### 后台命令管理

#### 查看后台的进程

命令格式：

```java
[root@ddkk.com ~]# jobs -l
#"-l"选项用来查看进程的PID
```

#### 将后台暂停的工作恢复到前台执行

```java
[root@ddkk.com ~]# fg %工作号
#"%工作号"是jobs中显示的序号
```

#### 让后台的工作开始执行

```java
[root@ddkk.com ~]# bg %工作号
```

例：bg

```java
[root@ddkk.com ~]# tar -zcf root.test.tar.gz /
tar: 从成员名中删除开头的“/”
^Z
[1]+  已停止               tar -zcf root.test.tar.gz /
[root@ddkk.com ~]# bg %1
[1]+ tar -zcf root.test.tar.gz / &
[root@ddkk.com ~]# jobs
[1]+  运行中               tar -zcf root.test.tar.gz / &
[root@ddkk.com ~]# kill -9 2618
[root@ddkk.com ~]# jobs
[1]+  已杀死               tar -zcf root.test.tar.gz /
```

#### 后台命令脱离登录终端运行

如果把命令放入后台，命令只能依赖当前终端运行，终端关闭，服务也就终止了，那如果有一些需要长期在后台运行的命令怎么办呢。

- 将需要在后台执行的命令放入/etc/rc.d/local文件，让系统在启动时执行这个后台程序。
- 使用系统定时任务，让系统在指定的时间执行需要的后台命令，这样的后台命令不依赖登录终端。
- 使用nohup命令。

**nohup**命令的作用就是让后台在离开操作终端时，也能正确执行。

命令格式：

```java
[root@ddkk.com ~]# nohup [命令] &
```
