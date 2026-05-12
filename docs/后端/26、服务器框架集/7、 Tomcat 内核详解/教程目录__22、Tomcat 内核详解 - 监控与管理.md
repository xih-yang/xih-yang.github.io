# 22、Tomcat 内核详解 - 监控与管理
- 来源：https://ddkk.com/zhuanlan/server/tomcat/3/22.html
- 分类：服务器框架
- 分组：教程目录
Tomcat在对内部监控上主要使用了JMX。JMX即Java管理扩展（Java Management Extension），作为一个Java管理体系的规范标准，其主要负责系统管理，是基于此规范而扩展的系统拥有管理监控功能。通过它对Tomcat运行时进行监控和管理，包括服务器性能、JVM相关性能、Web连接数、线程池、数据库连接池、配置文件重新加载等。并且提供了一些远程可视化管理。它实时性高，同时也为分布式系统的管理提供了一个基础框架，提供了较为丰富的管理手段；

## 1.Java管理扩展——JMX

总体来讲，JMX体系结构分为三个层次：

- 设备层：Mbean

主要定义了信息模型，在JMX中，各种管理对象以管理构件的形式存在，需要管理的时候，向Mbean服务器进行注册，它定义了如何实现JMX管理资源的规范，只要将资源配置入JMX框架中就可以成为JMX一个管理构件（MBean）。资源可以是一个java应用，一个服务或者一个设备。另外，该层还定义了一个通知机制以及一些辅助元数据类；

- 代理层：MbeanServer

主要定义了各种服务以及通信模型。所有的构件需要向一个核心的Mbean服务注册，才可以被管理。

- 分布服务层：HTML适配器、SNMP适配器、RMI适配器

它是JMX架构的最外一层，它负责使JMX代理对外界可用，主要定义了能够对代理层进行操作的管理接口和构件，具体内容依靠适配器实现，这样外部管理者就可以操作代理。

### 1.1 JMX的基本结构

http://blog.csdn.net/u013782203/article/details/51435717

JMX可以为一个应用程序、设备、系统等植入监控和管理功能。

### 1.2 JMX例子

## 2.JMX管理下的Tomcat

Tomcat内部注册JMX很简单：

第一步：编写被托管类；

第二步：找到编写的托管类所在的包下的配置文件mbeans-descriptors.xml，添加如下内容：

第三步：注册托管对象

Tomcat将组件和操作都交由JMX，当Tomcat以JMX模式启动的时候，则可以很方便的对其进行监控、管理；

## 3.ManagerServlet

为了可以管理Tomcat内部各个模块资源的Servlet入口，Tomcat必须暴露它的一个内部模块作为入口就是ManagerServlet。

普通的Servlet是无法访问tomcat内部的，所以为了区别普通的Servlet，Tomcat提出了ContainerServlet接口，有了它，Web容器就可以进行区别了。

**ManagerServlet****提供的常见功能；**

**ManagerServlet****通过遍历Context****容器来实现；**

- 列出已经部署的web应用

你可以通过访问如下url来列出已经部署的web应用：

- 启动web应用

http://localhost:8080/manager/start?path=/contextPath

- 关闭web应用

http://localhost:8080/manager/stop?path=/contextPath

- 列出可用的全局JNDI资源
- 会话统计
- 输出操作系统和JVM信息；
- 重新加载某个应用
