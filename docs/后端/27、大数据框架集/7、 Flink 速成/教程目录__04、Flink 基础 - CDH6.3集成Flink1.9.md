# 04、Flink 基础 - CDH6.3集成Flink1.9
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/2/4.html
- 分类：大数据框架
- 分组：教程目录
## 一、准备工作

## 1.1 CDH 6.3.1大数据平台搭建

[CDH 6.3 大数据平台搭建](/zhuanlan/bigdata/flink/2/44.html)

## 1.2 安装方式讨论

CDH本身不自带Flink服务，安装配置会比安装Spark麻烦一些。

但是CDH提供了两种安装Flink的方式

**1、** parcels方式；

**2、** 编译安装的方式；

第一种更简单，第二种需要配置的项较多，这里我们选择第一种方式。

## 1.3 安装介质下载及上传

我本地环境是CDH 6.3.1的，而介质是6.3.0的，本地亲测，可以正常使用。

安装介质文件如下:

```java
FLINK-1.9.0-csa1.0.0.0-cdh6.3.0.jar
FLINK-1.9.0-csa1.0.0.0-cdh6.3.0-el7.parcel
FLINK-1.9.0-csa1.0.0.0-cdh6.3.0-el7.parcel.sha
manifest.json
```

### 1.3.1 介质下载

网上大多给的是CDH官网的下载连接，这里我就不贴出来的，但是现在官网下载不了，在网上搜索了一天，鱼龙混杂，也没有找到满意的介质文件。

也就只有CSDN平台有付费下载的(C币相当于付费了):

**好在功夫不负有心人，在网上找到了了相关的连接:**

https://www.freesion.com/article/60511077131/

提供了百度网盘的下载连接:

链接: [https://pan.baidu.com/s/1sDv2GiIgzJEKeVUKc-ePWQ?pwd=1234](https://pan.baidu.com/s/1sDv2GiIgzJEKeVUKc-ePWQ?pwd=1234) 提取码: 1234

https://www.it610.com/article/1283193742785789952.htm

提供了百度网盘的下载连接:

链接: [https://pan.baidu.com/s/1C4UHfyQSChv6nGGiUw5QEg?pwd=1234](https://pan.baidu.com/s/1C4UHfyQSChv6nGGiUw5QEg?pwd=1234) 提取码: 1234

因为这两个热心的哥们都只提供了三个文件，都少了一个文件，这里我把链接地址和百度网盘都贴出来了，需要结合这两个才能下载到全部所需的文件。

### 1.3.2 上传文件

将文件传到对应位置:

FLINK-1.9.0-csa1.0.0.0-cdh6.3.0-el7.parcel

FLINK-1.9.0-csa1.0.0.0-cdh6.3.0-el7.parcel.sha

manifest.json

上述三个传到本地的parcel源目录：/opt/cloudera/parcel-repo

FLINK-1.9.0-csa1.0.0.0-cdh6.3.0.jar

上述一个文件上传到/opt/cloudera/csd

## 1.4 重启cdh集群

重启之前我们是看不到flink这个组件的

管理节点

```java
systemctl stop cloudera-scm-server
systemctl stop cloudera-scm-agent
systemctl start cloudera-scm-server
systemctl start cloudera-scm-agent
```

agent节点

```java
systemctl stop cloudera-scm-agent
systemctl start cloudera-scm-agent
```

**本地测试过，只有通过命令重启才行，通过界面重启无效**

## 二、安装Flink

## 2.1 配置本地Flink 的 parcel

选择主机->Parcel

点击检查新Parcel

选择左边的FLINK，下载Flink

下载完成后 选择 “激活”

等到激活完成即可

## 2.2 开始安装Flink

添加服务

选择Flink

选择History Server主机和Gateway主机

默认

开始安装

等待安装完成即可

如下，Flink服务安装成功

## 三、FAQ

## 3.1 Deploy client Configuration失败

如下图所示:

最后排查问题，介质文件上传路径出了问题，需要参考1.3.2步骤，重新上传文件

## 3.2 为激活 Parcel:[flink]

报错截图如下:

最后排查问题，介质文件上传路径出了问题，需要参考2.1步，重新激活Flink的Parcel
