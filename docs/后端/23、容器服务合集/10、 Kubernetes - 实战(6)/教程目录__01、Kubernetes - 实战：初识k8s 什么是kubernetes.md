# 01、Kubernetes - 实战：初识k8s 什么是kubernetes
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/6/1.html
- 分类：容器服务
- 分组：教程目录
## Kubernetes简介

**为什么要用k8s？**

容器间(Docker)在夸主机通信时，只能通过在主机做端口映射(DNAT)来实现，这种方式对于很多集群应用来说及其不方便。会影响整体处理速度，所以引入k8s使用Pod来进行管理容器间(Docker)的集群，使其更易于通信。

Kubernetes Google公司开发 10年容器化基础架构 基于borg使用Go语言进行改写

特点：

**1、** 轻量级：消耗资源小；

**2、** 开源，不收费；

**3、** 弹性伸缩；

**4、** 负载均衡IPVS；

## 学习路径及所需掌握内容

介绍说明：k8s的前世今生 k8s框架 k8s关键字含义

基础概念：什么是Pod？ 控制器类型 k8s网络通讯模式

Kubernetes部署安装：构建k8s集群

资源清单：掌握资源清单的语法 编写Pod 掌握Pod的生命周期

Pod控制器：掌握各种控制器的特点 以及 使用定义方式

服务发现：掌握SVC原理及其构建方式

存储：掌握各种控制器的特点 并且 能够在不同环境中选择合适的存储方案

调度器：掌握调度器原理 能够根据要求把Pod定义到想要的节点运行

安全：集群的认证 鉴权 访问控制 原理及其流程

HELM：类似Linux yum 掌握HELM原理 HEML模板自定义 HELM部署一些常用插件

运维：修改Kubeadm达到证书可用期限为10年 能够构建高可用的Kubernetes集群

## Kubernetes架构

服务分类：

有状态服务：DBMS 等必须持久跟进的服务

无状态服务：LVS Apache 等

高可用集群副本最好是 >= 3 的奇数个

**插件介绍**

MASTER：

Api Server：所有服务访问的统一入口

ControllerManager：维持副本期望数目

Scheduler：负责接受任务，选择合适的节点进行分配任务

Etcd：键值对数据库，存储K8S集群的所有重要信息(持久化)

NODE：

Kubelet：直接跟容器引擎(Docker)交互实现容器的生命周期管理

Kube-Proxy：负责写入规则至iptables或IPVS实现服务映射访问(负载均衡)

其他插件：

CoreDNS：可以为集群中的SVC创建一个域名IP的对应关系解析(A记录)

Dashboard：给K8S集群提供一个B/S机构的访问体系

Ingress Controller：官方只能实现四层代理，Ingress可以实现七层代理

Fedetation：提供一个可以跨集群中心多K8S统一管理功能

Prometheus：提供一个K8S集群的监控能力

ELK：提供K8S的集群日志统一分析接入平台
