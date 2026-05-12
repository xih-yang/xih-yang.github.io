# 08、Tomcat 内核详解 - Host容器
- 来源：https://ddkk.com/zhuanlan/server/tomcat/3/8.html
- 分类：服务器框架
- 分组：教程目录
一个Servlet引擎可以包含若干个Host容器，它是根据URL地址中的主机部分抽象的，一个Servlet引擎可以包含若干个Host容器，而一个Host容器可以包含若干个Context容器、AccessLog组件、Pipeline组件、Cluster组件、Realm组件、HostConfig组件和Log组件。

## 1. Web应用——Context

每个Host容器保安若干个Web应用（Context），对于Web项目来讲，其结构相对比较复杂，而且包含很多机制，Tomcat需要对它的结构进行解析，同时还需要具体实现各种功能和机制，这些复杂的工作就交给了Context容器。Context容器对应实现了Web应用包含的语义，实现了Servlet和JSP规范；

## 2. 访问日志——AccessLog

Host容器里面的AccessLog组件负责客户端请求访问日志的记录。Host容器的访问日志作用范围是该虚拟主机的所有客户端的请求访问，不管是哪个应用都会被该日志组件记录。

## 3. 管道——Pipeline

在Tomcat中，它是将不同级别的容器串联起来的通道，当请求进来的时候就通过管道进行流转处理。

## 4.Host集群——Cluster

它提供了Host级别的集群会话和集群部署；

## 5.Host域——Realm

Realm对象其实就是一个存储了用户、密码以及权限等的数据对象，它的存储方式可能是内存、xml文件或者数据库等。它的作用是配合Tomcat实现资源认证模块。

Tomcat中有多个级别的Realm域，这里的Realm域是Host容器级别，在节点中配置；

## 6.生命周期监听器——HostConfig

在Tomcat启动的时候有两个阶段将Context添加到Host中。

**第一种方式：用Digester****框架解析server.xml****；**

需要先将Context节点配置到server.xml的Host节点下，缺点就是将应用配置与Web服务器耦合在一起，而且对server.xml配置的修改不会立即生效，除非重启Tomcat。

**第二种方式：在server.xml****加载解析完之后再在特定的时刻寻找指定的Context** **配置文件。**这时候已经将应用配置解耦出Web服务器。

HostConfig监听器当START_EVENT事件发生的时候则会执行Web应用部署加载动作。

Web应用有三种部署类型：

- Descriptor描述符类型
- WAR包类型
- 目录类型

### 6.1 Descriptor描述符类型

Descriptor描述符的部署是通过对指定部署文件解析之后进行部署的。部署文件会按照一定的规则存放，一般为%CATALINA_HOME%/conf[EngineName]/[HostName]/Web项目名.xml，此文件的大致内容为 reloadable=”true”表示/WEB-INF/classes/和/WEB-INF/lib改变的时候会自动的重新加载，如果一个Host包含多个Context则可以配置多个XML描述文件。为了优化多个应用项目部署时间，HostConfig监听器引入了使用线程池和Future优化部署耗时。；

### 6.2 WAR包类型

WAR包类型部署方式是直接读取%CATALINA_HOME%/webapps目录下所有以war包形式打包的web项目，然后根据war包的内容生成Tomcat内部需要的各种对象。为了优化多个应用项目部署时间，HostConfig监听器引入了使用线程池和Future优化部署耗时。；

### 6.3目录类型

目录类型部署方式是直接读取%CATALINA_HOME%/webapps目录下所有目录形式的Web项目，与前面两种一样，HostConfig监听器引入了使用线程池和Future优化部署耗时。
