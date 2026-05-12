# 01、分布式事务 Seata 教程 - 安装seata1.4+nacos1.4
- 来源：https://ddkk.com/zhuanlan/transaction/5/1.html
- 分类：分布式事务
- 分组：教程目录
### 介绍

Seata 是一款开源的分布式事务解决方案，致力于提供高性能和简单易用的分布式事务服务。Seata 将为用户提供了 AT、TCC、SAGA 和 XA 事务模式，为用户打造一站式的分布式解决方案。

Github: [https://github.com/seata/seata](https://github.com/seata/seata)

官方文档：https://seata.io/zh-cn/docs/overview/what-is-seata.html

### 安装nacos

**1、** 下载安装包并解压；

[下载地址](https://github.com/alibaba/nacos/releases)

**2、** 修改启动模式为单机（standalone）；

**3、** 启动并访问首页，输入nacos/nacos登录；

### 安装seata

**1、** 下载安装包并解压；

[下载地址](https://github.com/seata/seata/releases)

**2、** 导入seata数据库；

**3、** 配置数据库；

**4、** 在源码目录下打开GitBash,输入shnacos-config.sh，导入完成后，可在nacos中查看到所有配置；

**5、** 修改seata配置文件，修改注册中心及配置中心为nacos,配置nacos地址；

**6、** 启动seata服务端，并查看nacos，部署完成；
