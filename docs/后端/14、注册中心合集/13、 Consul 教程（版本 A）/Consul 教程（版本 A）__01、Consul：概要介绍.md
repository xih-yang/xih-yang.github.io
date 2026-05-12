# 01、Consul：概要介绍
- 来源：https://ddkk.com/zhuanlan/registered/consul/d-1/1.html
- 分类：注册中心
- 分组：Consul 教程（版本 A）
Consul是一个分布式、高可用的扩展的用于服务发现和配置的工具。Consul是一个基于Mozilla Public License 2.0的开源工具，同时提供企业版本的支持。

## 概要信息

Consul的概要信息如下表所示：

项目
说明

官网
https://www.consul.io

开源/闭源
开源

源码管理地址
https://github.com/hashicorp/consul/

License类别
Mozilla Public License 2.0

开发语言
Go

操作系统支持
跨平台，支持多种操作系统，比如Linux, Mac OS X, FreeBSD, Solaris, and Windows等

当前稳定版本
1.7.1 （2021/02/20）

企业版本：https://www.hashicorp.com/products/consul/

## 主要特性

Consul提供了如下主要的关键特性：

- 服务发现：使用Consul可以更加简单地通过DNS或者HTTP方式来进行服务的注册和发现，外部的服务也可以进行注册。
- 健康检查：使用Consul的健康检查可以确认集中服务的状态信息，这项功能的集成有助于更好地进行路由分发等操作。
- Key/Value存储：可以通过简单的HTTP API进行Key/Value的使用，是的动态配置、特性标记、Leader选举等变得更加灵活
- 多数据中心：Consul内建支持多数据中心，可以不需要复杂的配置就可以实现任意数量区域的支持。
- 服务网格：应用可以在服务网格配置使用sidecar代理来建立TLS连接，而在使用中也可以做到对于连接的透明性和无意识。

## 安装

提供源码方式的安装或者二进制安装的方式，本文直接使用二进制方式进行安装。

## 下载地址

- 下载地址：https://www.consul.io/downloads.html

选择所需要的二进制版本进行下载。

## 解压和设定

二进制压缩包中包含Consul的二进制文件，放至PATH搜索目录中，并设定权限之后即可使用，比如MacOS下的1.7.1为例：

> 下载命令：wget https://releases.hashicorp.com/consul/1.7.1/consul_1.7.1_darwin_amd64.zip

解压Consul的二进制文件

```sh
liumiaocn:~ liumiao$ ls consul_1.7.1_darwin_amd64.zip 
consul_1.7.1_darwin_amd64.zip
liumiaocn:~ liumiao$ unzip consul_1.7.1_darwin_amd64.zip 
Archive:  consul_1.7.1_darwin_amd64.zip
  inflating: consul                  
liumiaocn:~ liumiao$ ls -l consul
-rwxr-xr-x  1 liumiao  staff  108190560 Feb 20 23:43 consul
liumiaocn:~ liumiao$ 
```

移动至PATH指定的搜索目录，比如/usr/local/bin下

```sh
liumiaocn:~ liumiao$ mv consul /usr/local/bin
liumiaocn:~ liumiao$ which consul
/usr/local/bin/consul
liumiaocn:~ liumiao$ 
```

确认版本

```sh
liumiaocn:~ liumiao$ consul --version
Consul v1.7.1
Protocol 2 spoken by default, understands 2 to 3 (agent will automatically use protocol >2 when speaking to compatible agents)
liumiaocn:~ liumiao$ 
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://blog.csdn.net/liumiaocn/category_9752887.html
