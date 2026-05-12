# 07、Tomcat 内核详解 - Engine容器
- 来源：https://ddkk.com/zhuanlan/server/tomcat/3/7.html
- 分类：服务器框架
- 分组：教程目录
Engine即为全局引擎容器，包含以下主要组件：

- 虚拟主机——Host组件

Host组件是Engine容器的一个子容器，它表示一个虚拟主机。Host组件也包含了很多其他的组件

- 访问日志——AccessLog组件

因为Engine是一个全局的Servlet容器，所以这里的访问日志作用的范围是所有客户端的请求访问，不管访问哪个虚拟主机都会被该日志组件记录。

- 管道——Pipeline组件

Pipeline其实属于一种设计模式，在Tomcat中可以认为它是将不同容器级别串联起来的通道，当请求进来之后就可以通过管道进行流转处理。Tomcat中有4个级别的容器，每个容器都会有一个属于自己的Pipeline。

- Engine集群——Cluster组件

Tomcat中有Engine和Host两个级别的集群，而这里的集群组件正是属于全局引擎容器。它主要是把不同JVM的全局引擎容器内的所有应用都抽象成集群，让它们能在不同的JVM之间互相通信，是会话同步，集群部署得以实现。

- Engine域——Realm组件

Realm对象其实就是一个存储了用户、密码以及权限等的数据对象，它的存储方式可能是内存、xml文件或者数据库等。它的作用是配合Tomcat实现资源认证模块。

Tomcat中有多个级别的Realm域，这里的Realm域是Engine容器级别，在节点下配置Realm，则在启动的时候对应的域会添加到Realm容器中。

- 生命周期监听器——LifecycleListener组件

Engine容器内的生命周期监听器是为了监听Tomcat从启动到关闭整个过程的某些事件，然后根据这些事件做不同的逻辑处理。

- 日志——Log组件

日志组件负责的事情就是不同级别的日志输出，几乎所有的系统都有日志组件
