# 34、SpringCloud Alibaba Seata（1）Seata 简介与安装
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/67.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
## 1.Seata 简介

Seata 是一款开源的分布式事务解决方案，致力于在微服务架构下提供高性能和简单易用的分布式事务服务。在 Seata 开源之前，Seata 对应的内部版本在阿里经济体内部一直扮演着分布式一致性中间件的角色，帮助经济体平稳的度过历年的双 11，对各 BU 业务进行了有力的支撑。

经过多年沉淀与积累，商业化产品先后在阿里云、金融云进行售卖。2019.1 为了打造更加完善的技术生态和普惠技术成果，Seata 正式宣布对外开源，未来 Seata 将以社区共建的形式帮助其技术更加可靠与完备。

## 2.Seata-Server 的安装

在使用 Seata 之前，我们首先要安装 Seata-Server 服务器。

### 2.1 下载 Seata

由于我们使用的 SpringCloud Alibaba 版本为 2.2.0.RELEASE，他里面控制了 seata 的版本为 1.0.0，故我们在此下载 1.0.0 版本的 seata。

- 访问：

https://github.com/seata/seata/releases/tag/v1.0.0

由于我使用的是 windows 的电脑，故选择 seata-server-1.0.0.zip 该版本。

点击该文件下载

### 2.2 Seata-Server 目录分析

将 seata-server 复制到软件的目录里面，使用解压工具解压该文件

- Bin：可执行文件目录
- Conf：配置文件目录
- lib：依赖的 jar
- LICENSE：授权文件

### 2.3 Seata 启动

进入{seata}/bin 目录里面，双击：

- 代表 seata-server 已经启动成功。
