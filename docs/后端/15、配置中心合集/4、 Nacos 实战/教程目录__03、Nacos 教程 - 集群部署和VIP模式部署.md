# 03、Nacos 教程 - 集群部署和VIP模式部署
- 来源：https://ddkk.com/zhuanlan/registered/nacos/1/3.html
- 分类：注册中心
- 分组：教程目录
## 前言

Nacos官网:[https://nacos.io/](https://nacos.io/)。

如何部署Nacos集群？

什么是VIP模式？

VIP模式部署集群怎么操作？

## 准备工作

文章中使用的版本信息如下

nacos版本1.4.3

nginx版本1.20.2

如果尚未学习单点部署，请先学习单点部署:[02、Nacos 教程 - 下载安装启动和排错](/zhuanlan/registered/nacos/1/2.html)

如果对nginx不清楚，在文中用到nginx的时候，可以阅读以下nginx相关的资料:[nginx专栏](https://blog.csdn.net/u011628753/category_11690922.html)

## 第一节 如何集群部署nacos

### 1. 如何部署nacos集群

这里是本地模拟3台nacos

***集群部署，必须配置外部的相同数据源(配置同一个mysql数据库地址)，不要使用nacos内置数据库。***

**1、** 复制3分nacos文件夹；

**2、** 分别修改三个nacos的端口为8848,8849,8850(conf下的application.properties)；

***这里只粘贴了一张图***

**3、** 修改conf文件夹下的cluster.conf.example文件的后缀，去掉.example(变成cluster.conf文件)，并在里面添加内容，将这个文件分别复制到3个nacos下的conf目录下；

**4、** 在nacos的bin目录下使用集群启动命令(3个nacos都需要执行启动命令)；

```java
#集群启动nacos(请确保先切换到nacos的bin目录)
startup.cmd -m cluster
```

**5、** 打开nacos地址(默认账号密码nacos/nacos)；

**1、** 点击集群管理>>节点管理，如果显示3个nacos记录，即为集群启动成功；

### 2. 微服务中如何配置多个nacos地址

在微服务的配置文件里需要配置多个nacos地址，以逗号分割。

这种配置多个nacos地址的方式，显然很难实现nacos集群的扩缩容，nacos一旦增加或者减少，就需要在每个微服务里进行修改，很繁琐。

```java
spring:
  cloud:
    nacos:
      discovery:
        server-addr: 127.0.0.1:8848,127.0.0.1:8849,127.0.0.1:8850
```

## 第二节 数据库主备高可用的配置

除了配置多节点外，高可用还需要配置多数据源。

配置两个数据源，在conf目录下的application.properties添加配置数据源(数据库主备高可用)

## 第三节 nginx+nacos集群(VIP模式)

### 1. VIP 模式

传统模式的问题：

在第一节中，我们每个微服务都需要配置多个nacos的地址，就形成了多对多的关系，当nacos集群发生变化(数量增加减少，ip和端口发生变化)时，每个微服务都需要修改配置文件里的nacos地址，很不方便。

VIP模式：

在微服务和 nacos集群中增加一个nginx，通过nginx负载分发到nacos集群中，而微服务只需要配置nginx的地址即可，这样就避免了传统模式的缺点。

### 2. 安装nginx

nginx基础(2):windows安装nginx

### 3. 配置nginx转发

```java
#全局配置信息
events {
    worker_connections  1024;#最大连接数
}
http {
	upstream hello{
	#weight表示权重,默认是轮循,此处表示8848访问一次,8849访问2次,8850访问5次,按照这个方式循环调用
		server 127.0.0.1:8848 weight=1;
		server 127.0.0.1:8849 weight=2;
		server 127.0.0.1:8850 weight=5;
	}
    server {
        listen       18888;
        server_name  localhost;
		location / {
            root   html;
            index  index.html index.htm;
			proxy_pass http://hello;
        }
		location /othermodule {
            root   html;
            index  index.html index.htm;
        }
    }
}
```

**1、** 启动nginx,并访问nacos,[http://localhost:18888/nacos/](http://localhost:18888/nacos/)，默认账号名和密码都是nacos；

### 4. 微服务中配置nginx

通过nginx+nacos集群，我们只需要在微服务中配置nginx的转发地址即可，不需要填写具体的nacos地址

```java
spring:
  cloud:
    nacos:
      discovery:
        server-addr: 127.0.0.1:18888
```

## 遇到的问题

### 问题1:节点显示多了

如果用户是多网卡，则会出现下面的问题，8848端口只有1个nacos,但是显示两行记录。

**解决办法：**

**1、** 打开对应出错的nacos的conf目录下application.properties文件，指定ip；

```java
#要指定你网卡里有的ip，不要瞎设置
nacos.inetutils.ip-address=127.0.0.1
```

**1、** 检查cluster.conf文件(conf目录下)，如果出现多余的配置，请删除(nacos会自动帮你乱添加配置)；

**2、** 按照集群启动命令重新启动nacos；

### 问题2：Error occurred during initialization of VM

```java
D:\developsoft\nacos_cluster\nacos3\bin>startup.cmd -m cluster
"nacos is starting with cluster"
Error occurred during initialization of VM
Could not reserve enough space for object heap
```

堆内存不足

**解决办法**：

关掉一些应用，或者增加内存。
