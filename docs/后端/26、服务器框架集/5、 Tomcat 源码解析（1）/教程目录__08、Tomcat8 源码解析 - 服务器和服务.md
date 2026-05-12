# 08、Tomcat8 源码解析 - 服务器和服务
- 来源：https://ddkk.com/zhuanlan/server/tomcat/1/8.html
- 分类：服务器框架
- 分组：教程目录
Tomcat源码版本：apache-tomcat-8.5.54-src

JDK源码版本：jdk1.8.0_171

## 一、服务器

**1、** org.apache.catalina.Server接口；

一个服务器提供了一种优雅的机制来启动和停止整个系统，不必再单独的启动连接器和容器了。当服务器启动的时候，它启动内部的所有组件。然后无限期的等待关闭命令，如果你想要关闭系统，发送一个关闭命令道指定端口即可。当服务器收到正确的关闭指令后，它停止所有组件的服务。

```java
package org.apache.catalina;
import java.io.File;
import org.apache.catalina.deploy.NamingResourcesImpl;
import org.apache.catalina.startup.Catalina;
public interface Server extends Lifecycle {
    //JNDI服务上下文
    public NamingResourcesImpl getGlobalNamingResources();
    public void setGlobalNamingResources(NamingResourcesImpl globalNamingResources);
    public javax.naming.Context getGlobalNamingContext();
    //等待关闭命令的端口
    public int getPort();
    public void setPort(int port);
    //等待关闭命令的地址
    public String getAddress();
    public void setAddress(String address);
    //获取关闭指令字符串
    public String getShutdown();
    public void setShutdown(String shutdown);
    //父类加载器
    public ClassLoader getParentClassLoader();
    public void setParentClassLoader(ClassLoader parent);
    //持有的Catalina
    public Catalina getCatalina();
    public void setCatalina(Catalina catalina);
    //持有的容器base
    public File getCatalinaBase();
    public void setCatalinaBase(File catalinaBase);
    //Catalina目录
    public File getCatalinaHome();
    public void setCatalinaHome(File catalinaHome);
    //一个服务器可以有零个或多个服务 下面是管理org.apache.catalina.Service服务组件的方法
    public void addService(Service service);
    public Service findService(String name);
    public Service[] findServices();
    public void removeService(Service service);
    public Object getNamingToken();
    public void await();
}
```

**2、** org.apache.catalina.core.StandardServer标准实现；

有四个跟生命周期相关的方法：

1、initInternal:初始化Server组件及其Service子组件:初始化要添加到服务器实例上的服务;

2、startInternal:启动Server组件及其Service子组件;

3、stopInternal:停止Server组件及其Service子组件;

4、destroyInternal:销毁Server组件及其Service子组件;

5、await:在8085端口创建一个ServerSocket对象，在 while 循环调用它的accept 方法。Accept 方法仅仅接受 8085 端口的信息。它将接受到的信息跟shutdown 命令进行匹配，如果匹配的话跳出循环关闭 SocketServer，如果不匹配继续 while 循环等待另一个命令。

## 二、服务

服务器还使用了另外一个组件，服务，它用来持有组件，例如容器或者一个多个的连接器。

**1、** org.apache.catalina.Service接口；

一个服务可以可以有一个容器和多个连接器。你可以添加多个连接器 ，并将它们跟容器相关联

```java
package org.apache.catalina;
import org.apache.catalina.connector.Connector;
import org.apache.catalina.mapper.Mapper;
public interface Service extends Lifecycle {
    //设置唯一的一个Engine容器
    public Engine getContainer();
    public void setContainer(Engine engine);
    //Service名称
    public String getName();
    public void setName(String name);
    //操作关联的Server
    public Server getServer();
    public void setServer(Server server);
    public ClassLoader getParentClassLoader();
    public void setParentClassLoader(ClassLoader parent);
    //容器注册的域
    public String getDomain();
    //操作多个连接器
    public void addConnector(Connector connector);
    public Connector[] findConnectors();
    public void removeConnector(Connector connector);
    //服务关联的线程池
    public void addExecutor(Executor ex);
    public Executor[] findExecutors();
    public Executor getExecutor(String name);
    public void removeExecutor(Executor ex);
    //服务关联的映射器
    Mapper getMapper();
}
```

**2、** org.apache.catalina.core.StandardService标准实现；

一个StandardService 实例包括两种组件：一个容器和多个连接器。

多个连接器可以使得 Tomcat 能服务于多个协议。包括HTTP协议请求、HTTPS协议请求、AJP协议请求。

有四个跟生命周期相关的方法：

1、initInternal:初始化Service组件及其子组件:初始化要添加到服务实例上的容器和连接器;

2、startInternal:启动Service组件及其子组件;

3、stopInternal:停止Service组件及其子组件;

4、destroyInternal:销毁Server组件及其Service子组件;

总结：

```java
1个Catalina包含1个Server；
1个Server包含多个Service；
每个Service对应有下面的组件：
    1个Engine；
    多个Connector；
    一个MapperListene；
```
