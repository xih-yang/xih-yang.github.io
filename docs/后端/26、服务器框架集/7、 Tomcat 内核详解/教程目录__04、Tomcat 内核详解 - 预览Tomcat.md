# 04、Tomcat 内核详解 - 预览Tomcat
- 来源：https://ddkk.com/zhuanlan/server/tomcat/3/4.html
- 分类：服务器框架
- 分组：教程目录
如果把Tomcat的内核高度的抽象，则它可以看成连接器（Connector）组件和容器（Container）组件组成，其中Connector组件负责在服务端处理客户端的连接，包括接收客户端连接、接收客户端的消息报文以及消息报文的解析等工作；

Container组件则负责对客户端的请求进行逻辑处理，并把结果返回给客户端。

## 1.整体结构及属性介绍

从Tomcat服务器配置文件server.xmlde内容格式也可以看出Tomcat的大致结构：

## Server组件

Server是最顶级的组件，它代表Tomcat的运行实例，在一个JVM中只会包含一个Server。在Server的整个生命周期中，不同的阶段会有不同的事情需要完成，为了方便扩展，它引入了监听器的方式，所以它包含了Listener组件。另外，为了方便在Tomcat中集成JNDI，引入了GlobalNamingResources组件。同时，还包含了Service核心组件；

## Service组件

Service组件是服务的抽象，它代表请求从接收到处理的所有的组合的集合。

Server组件可以包含多个Service组件，每个Service组件都包含了若干用于接收客户端消息的Connector组件和处理请求的Engine组件。其中，不同的Connector组件使用不同的通信协议，如HTTP协议和AJP协议，此外，Service组件还包含若干Executor组件，每个Executor都是一个连接池，它可以为Service内部所有的组件提供线程池执行任务；

## Connector组件

Connector组件主要职责就是接收客户端连接并接收消息报文，消息报文经由它解析之后送往容器中处理。

因为不在不同的通信协议，所以每个协议对应一种Connector组件。目前Tomcat包含HTTP和AJP两种协议的Connector；

Connector组件的内部实现也会根据网络I/O的不不同方式分为阻塞I/O和非阻塞I/O；

1》阻塞I/O方式下的组件：

- Http11Protocol组件：

主要包含JIOEndpoint组件和Http11Processor组件；

JionPoint组件内部的Acceptor组件将启动某个端口监听，一个请求到来之后被扔进线程池Executor，线程池进行任务处理，处理过程中将通过Http11Processor组件对HTTP协议解析并传递到Engine容器继续处理；

- Mapper组件：客户端请求的路由导航组件，听过它能够对一个完整的请求地址进行路由，通俗的讲，就是它能够通过请求地址找到对应的Servlet；
- CoyoAdaptor组件：一个将Connector和Container适配起来的适配器；

2》非阻塞I/O方式下的组件：

唯独多了一个Poller组件，它的职责是在非阻塞I/O方式下轮询多个客户端的连接，不断的检测，处理各种事件，例如不断检测各个连接是否有可读，对于可读的客户端连接尝试进行读取并解析消息报文；

- Http11NioProtocol组件：

主要包含NioEndpoint组件和Http11NioProcessor组件；

JionPoint组件内部的Acceptor组件将启动某个端口监听，一个请求到来之后被扔进线程池Executor，线程池进行任务处理，处理过程中将通过Http11Processor组件对HTTP协议解析并传递到Engine容器继续处理；

- Mapper组件：客户端请求的路由导航组件，听过它能够对一个完整的请求地址进行路由，通俗的讲，就是它能够通过请求地址找到对应的Servlet；
- CoyoAdaptor组件：一个将Connector和Container适配起来的适配器；

### Engine组件

Tomcat内部有4个级别的容器，分别是：Engine、Host、Context和Wrapper。Engine代表全局Servlet引擎，每个Service组件只能包含一个Engine容器组件，但是Engine组件可以包含若干Host容器组件，除了Host之外，还包括如下组件：

- Listener组件：完成相关监听工作；
- AccessLog组件：客户端的访问日志，所有客户端访问都会被记录
- Cluster组件：提供集群功能，可以将Engine容器需要共享的数据同步到集群中的其他Tomcat实例上；
- Pipeline组件：Engine容器对请求进行管道处理；
- Realm组件：提供了Engine容器级别的用户-密码-权限的数据对象，配合资源认证模块使用；

### Host组件

Host组件代表虚拟主机，这些虚拟主机可以存放若干Web应用的抽象（Context容器）。

- Listener组件：完成相关监听工作；
- AccessLog组件：客户端的访问日志，所有客户端访问都会被记录
- Cluster组件：提供集群功能，可以将Engine容器需要共享的数据同步到集群中的其他Tomcat实例上；
- Pipeline组件：Engine容器对请求进行管道处理；
- Realm组件：提供了Engine容器级别的用户-密码-权限的数据对象，配合资源认证模块使用；

### Context组件

Context组件四是Web应用的抽象，web应用程序部署到Tomcat后运行时就会转化为Context对象。它包含了各种静态资源、若干Servlet（Wrapper容器）以及各种动态资源；

- Listener组件：完成相关监听工作；
- AccessLog组件：客户端的访问日志，所有客户端访问都会被记录
- Pipeline组件：Engine容器对请求进行管道处理；
- Realm组件：提供了Engine容器级别的用户-密码-权限的数据对象，配合资源认证模块使用；
- Loader组件：Web应用加载器，保证不同Web应用之间的资源隔离；
- Manager组件：会话管理器，用于管理对应Web容器的会话，包括维护会话的生成、更新和销毁；
- NamingResource组件：命名资源，它将负责Tomcat配置文件的server.xml和Web应用的context.xml资源和属性映射到内存中；
- Mapper组件：Servlet映射器，它属于Context内部的路由映射器，只负责Context容器的路由导航；
- Wrapper组件：Context的子容器；

### Wrapper组件：

Wrapper容器是Tomcat4个容器级别中最小的，与之相应的是Servlet一个Wrapper对应一个Servlet。它包含如下组件：

- Servlet组件：
- ServletPool组件：Servlet对象池，当Web应用的Servlet实现了SingleThreadModel接口的时候，则会在Wrapper中产生一个Servlet对象池，ServletPool组件能够保证Servlet对象的线程安全；
- Pipline组件：Wrapper容器对请求进行处理的管道；
