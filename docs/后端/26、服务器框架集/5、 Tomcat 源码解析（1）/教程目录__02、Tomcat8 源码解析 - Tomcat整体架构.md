# 02、Tomcat8 源码解析 - Tomcat整体架构
- 来源：https://ddkk.com/zhuanlan/server/tomcat/1/2.html
- 分类：服务器框架
- 分组：教程目录
## 一、整体架构

Tomcat主要有两个组件：连接器Connector和容器Container。Tomcat为了实现统一管理连接器和容器等各种组件，额外添加了服务器组件（server）和服务组件（service），一个server可以有多个service，一个service包含多个连接器和一个容器。

**1、** 服务器组件-Server；

1、/tomcat8.5/conf/server.xml

server.xml体现了上图的整体架构，Server作为顶层元素包括整个配置。

包含一堆监听器，用于在Tomcat整个生命周期中对不同事件进行处理；提供了Tomcat容器全局的命名资源实现；监听某个端口以接收SHUTDOWN命令；多个Service。

参考：

[Tomcat Server中的监听器](https://blog.csdn.net/qq_36807862/article/details/81287713)

[tomcat中server.xml配置详解](https://www.cnblogs.com/starhu/p/5599773.html#top)

2、org.apache.catalina.Server接口和org.apache.catalina.core.StandardServer实现

StandardServer作为Server的唯一实现，主要方法如下:

Server接口继承于Lifecycle接口，具有Lifecycle接口的全部特性。

getPort/setPort，getPortOffset，setPortOffset设置TOMCAT停止的监听端口，setPort用于设置基本的端口，setPortOffset设置增量的端口，例如：port设置为8005，portoffset为1000，则实际的端口为：8005+1000=9005,在集群环境中，可以通过portoffset属性区分不同的实例。getPortWithOffset方法可以获得计算后的端口。

如果端口被设置为：-2，则不开启监听，TOMCAT不会自己停止

如果端口设置为-1，则，通过线程sleep等待停止命令

否则通过监听端口，等待停止的命令

getAddress/setAddress用于设置监听的地址，默认监听localhost。举个例子，默认情况下，通过192.168.1.2的局域网地址无法发送停止命令，TOMCAT不会响应，这是因为访问监听的地址为：localhost，只能通过127.0.0.1，或者localhost进行连接

getShutdown/setShutdown用于设置停止的命令

addService/removeService/findService/findServices，用于添加，删除，查询获取service信息

**2、** 服务组件-Service；

1、Service是对外提供的服务，name唯一，不能重复。

：处理所有直接由Tomcat服务器接收的web客户请求

：处理所有由Apahce服务器转发过来的Web客户请求

2、org.apache.catalina.Service接口的唯一实现类org.apache.catalina.core.StandardService，其中主要方法如下：

getName/setName获取和设置service的name，server中，service的名字，不能重复

getContainer/setContainer获取和设置engine容器，每个service只能包含一个engine容器

getServer/setServer设置service依赖的server容器

addConnector/removeConnector/findConnectors，添加删除查找connector，connector用于接收和处理请求，是和外部联系的组件

addExecutor/findExecutors/getExecutor/removeExecutor，executor，是扩展至java标准的

getMapper，返回mapper信息，mapper用于处理所有的servlet映射信息。

3、一个Service包含多个连接器-Connector和一个容器Container(Engine)。

**3、** 连接器-Connector；

连接器就是一个http请求过来了，连接器负责接收这个请求，然后解析请求协议、请求方法、请求路径、请求头、请求参数等，创建一个 Request 和 Response 对象分别用于和请求端交换数据，然后转发给容器来处理。

1、org.apache.catalina.connector.Connector为连接器类。

2、org.apache.coyote为对应的请求协议处理包，目前可以处理HTTP/1.1、AJP/1.3、HTTP/2协议。

**4、** Servlet容器-Container；

容器即servlet容器，容器有很多层，分别是Engine，Host，Context，Wrapper。最大的容器Engine，代表一个servlet引擎，接下来是Host，代表一个虚拟机，然后是Context，代表一个应用，Wrapper对应一个servlet。从连接器传过来连接后，容器便会顺序经过上面的容器，最后到达特定的servlet。

涉及的主要组件：

org.apache.catalina.Container

org.apache.catalina.Engine接口和org.apache.catalina.core.StandardEngine实现

org.apache.catalina.Host接口和org.apache.catalina.core.StandardHost实现

org.apache.catalina.Context接口和org.apache.catalina.core.StandardContext实现

org.apache.catalina.Wrapper接口和org.apache.catalina.core.StandardWrapper实现

## 二、源码包清单

## 三、tomcat安装目录
