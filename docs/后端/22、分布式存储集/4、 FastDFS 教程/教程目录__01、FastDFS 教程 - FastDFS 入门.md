# 01、FastDFS 教程 - FastDFS 入门
- 来源：https://ddkk.com/zhuanlan/filestorage/fastdfs/2/1.html
- 分类：分布式存储
- 分组：教程目录
## 一、分布式文件系统

> 分布式文件系统 (Distributed File System) 是一个软件/软件服务器，这个软件可以用来管理文件。但这个软件所管理的文件通常不是在一个服务器节点上，而是在多个服务器节点上，这些服务器节点通过网络相连构成一个庞大的文件存储服务器集群，这些服务器都用于存储文件资源，通过分布式文件系统来管理这些服务器上的文件。

常见的分布式文件系统有：

FastDFS、GFS、HDFS、Lustre 、Ceph 、GridFS、mogileFS、TFS等。

分布式文件系统与传统文件系统对比

传统方式弊端

- 如果用户数量多，IO操作比较多，对磁盘访问压力很大
- 如果磁盘发生故障，会造成数据丢失
- 存储容量有限

## 二、FastDFS 简介

FastDFS 是一个开源的轻量级分布式文件系统，为互联网应用量身定做，简单、灵活、高效，采用C语言开发，由阿里巴巴开发并开源。

FastDFS对文件进行管理，功能包括：文件存储、文件同步、文件访问 (文件上传、文件下载、文件删除) 等，解决了大容量文件存储的问题，特别适合以文件为载体的在线服务，如相册网站、文档网站、图片网站、视频网站等等。

FastDFS充分考虑了冗余备份、线性扩容等机制，并注重高可用、高性能等指标，使用FastDFS很容易搭建一套高性能的文件服务器集群提供文件上传、下载等服务。

FastDFS系统架构从第一个版本发布后一直没有大的调整，高版本完全兼容低版本的数据，可以做到平滑升级，推荐更新升级到最新版本。

FastDFS代码托管在github上：[https://github.com/happyfish100/fastdfs](https://github.com/happyfish100/fastdfs)

## 三、FastDFS 整体架构

FastDFS文件系统由两大部分构成，一个是客户端，一个是服务端。

> 客户端通常指我们的程序，比如我们的 Java 程序 去连接 FastDFS、操作FastDFS，那我们的 Java 程序就是一个客户端，FastDFS 提供专有 API 访问，目前提供了 C、Java 和 PHP几种编程语言的 API，用来访问 FastDFS 文件系统。

服务端由两个部分构成：一个是跟踪器 (tracker)，一个是存储节点 (storage) 。

> 跟踪器 (tracker) 主要做调度工作，在内存中记录集群中存储节点 storage 的状态信息，是前端 Client 和后端存储节点 storage 的枢纽。因为相关信息全部在内存中，Tracker server 的性能非常高，一个较大的集群 (比如上百个group) 中有3台就足够了。

> 存储节点 (storage) 用于存储文件，包括文件和文件属性 (meta data) 都保存到存储服务器磁盘上，完成文件管理的所有功能：文件存储、文件同步和提供文件访问等。

## 四、FastDFS 线上使用者

- UC ([http://www.uc.cn/](http://www.uc.cn/) ，存储容量超过10TB)
- 支付宝 ([http://www.alipay.com/](http://www.alipay.com/))
- 京东商城 (http://www.jd.com/)
- 淘淘搜 ([http://www.taotaosou.com/](http://www.taotaosou.com/))
- 赶集网 ([http://www.ganji.com/](http://www.ganji.com/))
- 淘米网 ([http://www.61.com/](http://www.61.com/))
- 迅雷 ([http://www.xunlei.com/](http://www.xunlei.com/))
- 蚂蜂窝 ([http://www.mafengwo.cn/](http://www.mafengwo.cn/))
- 5173 ([http://www.5173.com/](http://www.5173.com/))
- 搜道网 ([http://www.sodao.com/](http://www.5173.com/))
- 58同城 ([http://www.58.com/](http://www.58.com/))
- 商务联盟网 ([http://www.biz72.com/](http://www.biz72.com/))
- 中青网 ([http://www.youth.cn/](http://www.youth.cn/))
- 保利威视 ([http://www.freeovp.com/](http://www.freeovp.com/))
- 梦芭莎 ([http://www.moonbasa.com/](http://www.moonbasa.com/))
- 51CTO ([http://www.51cto.com/](http://www.51cto.com/))
- 搜房网 ([http://www.soufun.com/](http://www.soufun.com/))
