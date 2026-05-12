# 09、Tomcat 内核详解 - Context容器
- 来源：https://ddkk.com/zhuanlan/server/tomcat/3/9.html
- 分类：服务器框架
- 分组：教程目录
Container容器是子容器的父接口，所有的子容器都必须实现这个接口，在Tomcat中Container容器的设计是典型的责任链设计模式，其有四个子容器：Engine、Host、Context和Wrapper。这四个容器之间是父子关系，Engine容器包含Host，Host包含Context，Context包含Wrapper。

我们在web项目中的一个Servlet类对应一个Wrapper，多个Servlet就对应多个Wrapper，当有多个Wrapper的时候就需要一个容器来管理这些Wrapper了，这就是Context容器了，Context容器对应一个工程，所以我们新部署一个工程到Tomcat中就会新创建一个Context容器。

## 1.Context容器的配置文件

**1、** Tomcat的server.xml配置文件中的节点用于配置Context，它直接在Tomcat解析server.xml的时候，就完成Context对象的创建，而不用交给HostConfig监听器创建；

**2、** Web应用的/META-INF/context.xml文件可用于配置Context，此配置文件用于配置Web应用对应的Context属性；

**3、** 可用%CATALINA_HOME%/conf[EngineName]/[HostName]/Web项目名.xml文件声明创建一个Context；

**4、** Tomcat全局配置为conf/context.xml，此文件配置的属性会设置到所有的Context中；

**5、** Tomcat的Host级别配置文件为/conf[EngineName]/[HostName]/context.xml.default文件，它配置的属性会设置到某Host下面所有的Context中；

## 2.包装器——Wrapper

在web项目中的一个Servlet类对应一个Wrapper，多个Servlet就对应多个Wrapper。它不能再包含其他的子容器了，它的父容器必须是Context容器。

## 3.Context域——Realm

## 4.访问日志——AccessLog

每个Context容器可以有自己的访问日志组件。

## 5.错误页面——ErrorPage

每个Context容器都拥有各自的错误处理页面，它用于定义在Web容器处理过程中出现问题之后向客户端展示错误信息的页面。它可以在Web部署描述文件中配置；

Web应用启动之后，会将web.xml中配置的这些error-page元素读取到ConText容器中，并以ErrorPage对象形式存在。ErrorPage类包含三个属性:errorCode、exceptionType和location，刚好对应web.xml中的error-page元素；

## 6.会话管理器——Manager

每个Context都会有自己的会话管理器；

## 7.目录上下文——DirContext

DirContext接口其实属于JNDI的标准接口，实现此接口即可实现目录对象相关属性的操作。

对于Tomcat来讲，就是Context容器需要支持一种便捷的方式去访问整个Web应用包含的文件。例如，通过一个字符串路径就可以找到对应的文件资源；

DirContext接口要完成的事情就是通过某些字符串便捷的获取对应的内容，于是Context容器需要依赖这个接口，为后面的访问提供便捷的访问方式。

war包和Web目录分别对应DirContext的实现类为WARDirContext和FileDirContext。

## 8.安全认证

web.xml中涉及安全认证的元素由元素和元素，Tomcat启动的时候将这些元素转换为Java形态，即SecurityConstraint和LoginConfig对象。

## 9.Jar扫描器——JarScanner

它一般在Context容器中，专门用于扫描Context对应的Web应用的JAR包。

## 10.过滤器

过滤器提供了为某个Web应用的所有请求和响应做统一逻辑处理的功能。

每个Context可以包含若干个过滤器。

Tomcat 解析的时候将该元素转换为FilterDef实体对象；

ContextFilterMaps对应元素，用于保存过滤器映射关系；

ApplicationFilterConfig是FilterConfig接口的具体实现，每当初始化一个Filter的时候，ApplicationFilterConfig对象会作为Filter的init方法的参数。

调用这些过滤器进行过滤的工作则由Wrapper容器中的管道负责；

## 11.命令资源——NamingResource

NamingResource将配置文件中声明的不同的资源及其属性映射到内存中，这些映射统一由NamingResource对象封装；

## 12.Servlet映射器——Mapper

Context容器包含了一个请求路由映射器Mapper组件，它属于局部路由映射器，它只能负责本Context容器内额路由导航，即每个Web应用包含若干个Servlet，而当对请求使用分发器RequestDispatcher以分发到不同的Servlet上处理的时，就用到了此映射器；

## 13.管道——Pipeline

Context容器的管道负责对请求进行Context级别的处理，管道中包含了若干个不同逻辑处理的阀门，其中有个基础阀门，主要逻辑就是找到对应的servlet并将请求传递给它进行处理；

Tomcat中的4种容器级别都包含了各自的管道对象。

每个容器的管道完成的工作都不同，每个管道都需要搭配阀门才能工作；

## 14.Web应用载入器——WebappLoader

每个Web应用对应一个WebappLoader，每个WebappLoader互相隔离，各自包含的类互相不可见；

WebappLoader的核心工作其实是由内部的WebappClassLoader完成的。

## 15.ServletContext的实现——ApplicationContext

在Servlet规范中规定了一个ServletContext接口，它提供了Web应用所有Servlet的视图，通过它可以对某个Web应用的各种资源和功能进行访问；

对应Tomcat容器，为了满足Servlet规范，必须包含一个ServletContext接口的实现，这个实现类就是ApplicationContext。，每个Tomcat的Context容器中都会包含一个ApplicationContext。

## 16.实例管理器——InstanceManager

Context容器中包含一个实例管理器，主要实现对Context容器中监听器、过滤器以及Servlet等实例进行管理。

## 17.ServletContainerInitializer初始化

在Web 容器启动的时候为了让第三方组件做一些初始化工作，Servlet规范中通过ServletContainerInitializer实现此功能；

## 18.Context容器的监听器

Context容器的生命周期伴随着Tomcat的整个生命周期，在Tomcat生命周期的不同阶段Context需要做很多不同的操作。为了更好的将这些操作从Tomcat中解耦出来，提供一种类似可拔插可扩展的能力，这里使用了监听器模式，把不同类型的工作交给不同的监听器，监听器对Tomcat声明周期不同阶段的事件作出响应；

实际上，Tomcat启动过程中，一般会在Context容器中添加4个监听器，分别是：ContextConfig、TldConfig、NamingContextListener以及MemoryLeakTrackingListener

### 1.ContextConfig容器

主要负责在适当的阶段对Web项目的配置文件进行相关处理；

### 2.TldConfig监听器

主要负责对TLD标签配置文件进行相关处理；

### 3.NamingContextListener监听器

负责对命名资源的创建；

### 4.MemoryLeakTrackingListener监听器

主要用于跟踪重加载可能导致内存泄露的相关处理；
