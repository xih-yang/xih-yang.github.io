# 02、微服务 Kong 快速入门
- 来源：https://ddkk.com/zhuanlan/gateway/kong/d-2/2.html
- 分类：API网关
- 分组：KONG 教程（版本 B）
在本节中，您将学习如何管理您的KONG实例。首先，我们将指导您如何启动Kong，以便您能访问KONG的RESTful形式的管理界面，您可以通过它来管理您的API，consumers等。通过管理型API发送的数据将存储在KONG的数据库中（KONG支持PostgreSQL和Cassandra两种数据库）。

## 1、启动KONG

使用以下命令来启动KONG服务：

```sh
$ kong start
```

NOTE：CLI还可以通过配置（-c ）选项，来启动指定的配置下的KONG服务。

## 2、验证KONG是否正确启动：

在开始第一步之前，请先准备好您的数据库配置。当您把这些都配置好后，您会看到一个类似于（Kong started）的信息，这表明您的服务已经正常启动了。

**默认情况下，KONG监听的端口为：**

**1、** 8000：此端口是KONG用来监听来自客户端传入的HTTP请求，并将此请求转发到上有服务器；

**2、** 8443：此端口是KONG用来监听来自客户端传入的HTTP请求的。它跟8000端口的功能类似，但是它只是用来监听HTTP请求的，没有转发功能。您可以通过修改配置文件来禁止它；

**3、** 8001：通过此端口，管理者可以对KONG的监听服务进行配置；

**4、** 8444：通过此端口，管理者可以对HTTP请求进行监控；

## 3、停止KONG服务：

通过以下命令，您可以停止KONG的服务：

```sh
$ kong stop
```

## 4、重启KONG服务：

通过以下命令，可以即时地重启KONG服务，而无需停机：

```sh
$ kong reload
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://www.cnblogs.com/SummerinShire/category/861287.html
