# PinPoint 之 linux 环境搭建
- 来源：https://ddkk.com/zhuanlan/linktrack/pinpoint/2.html
- 分类：链路追踪
- 分组：教程目录
PinPoint是一种用于监视分布式系统性能的开源工具。它可以帮助开发人员更快地诊断问题并改进系统性能。Linux是PinPoint常用的操作系统之一，下面将简要介绍如何在Linux上搭建PinPoint。

## 1、安装Java和Maven

PinPoint是由Java编写的，因此需要安装Java。在Linux上，可以通过以下命令安装OpenJDK 8：

```bash
sudo apt-get update
sudo apt-get install openjdk-8-jdk
```

同时，PinPoint还需要Maven来构建和部署应用程序。可以通过以下命令安装Maven：

```bash
sudo apt-get install maven
```

## 2、下载并安装PinPoint

下载Pinpoint的最新版本，并将其解压到一个合适的目录下：

```bash
curl -LO https://github.com/naver/pinpoint/releases/download/v2.0.3/pinpoint-2.0.3.tar.gz
tar zxf pinpoint-2.0.3.tar.gz
cd pinpoint-2.0.3
```

## 3、启动Pinpoint

在Pinpoint目录下启动Pinpoint：

```bash
./pinpoint-agent.sh start
```

这将启动Pinpoint的代理程序，使其能够收集应用程序的性能数据。

## 4、部署应用程序

Pinpoint需要针对每个应用程序进行配置。要启用Pinpoint，在应用程序中添加以下Java参数：

```bash
-javaagent:/path/to/pinpoint-agent/pinpoint-bootstrap-2.0.3.jar -Dpinpoint.agentId=YOUR_AGENT_ID -Dpinpoint.applicationName=YOUR_APPLICATION_NAME
```

其中，`/path/to/pinpoint-agent`是Pinpoint代理程序的目录，`YOUR_AGENT_ID`和`YOUR_APPLICATION_NAME`是应用程序的代理ID和应用程序名称。

## 5、查看性能数据

现在，可以在Pinpoint的Web界面上查看应用程序的性能数据。打开Web浏览器，输入以下URL：

```bash
http://localhost:8181
```

这将打开Pinpoint的Web界面。在这里，可以查看应用程序的拓扑图、事务跟踪和性能统计信息。

以上是在Linux上搭建Pinpoint的基本步骤。尽管本文只提供了基本信息，但这应该足以让你开始使用Pinpoint监视和改进你的应用程序的性能。
