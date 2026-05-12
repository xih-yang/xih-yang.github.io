# 03、Tomcat8 源码解析 - Tomcat服务启停过程
- 来源：https://ddkk.com/zhuanlan/server/tomcat/1/3.html
- 分类：服务器框架
- 分组：教程目录
tomcat源码版本：apache-tomcat-8.5.54-src

## 一、代码流程

```java
1、代码入口(运行startup.bat或startup.sh)
Bootstrap::main 
2、初始化
-->Bootstrap::init 初始化类加载器java.net.URLClassLoader
-->Bootstrap::initClassLoaders
-->Bootstrap::createClassLoader加载Tomcat公共资源lib目录
-->读取配置文件conf\catalina.properties属性:common.loader="${catalina.base}/lib","${catalina.base}/lib/*.jar","${catalina.home}/lib","${catalina.home}/lib/*.jar"
如果没有lib目录，ClassLoaderFactory::validateFile会打印如下警告信息：
四月 16, 2023 9:35:52 上午 org.apache.catalina.startup.ClassLoaderFactory validateFile
警告: Problem with directory [E:\workspace\mot\tomcat8.5\lib], exists: [false], isDirectory: [false], canRead: [false]
四月 16, 2023 9:35:52 上午 org.apache.catalina.startup.ClassLoaderFactory validateFile
警告: Problem with directory [E:\workspace\mot\tomcat8.5\lib], exists: [false], isDirectory: [false], canRead: [false]
四月 16, 2023 9:35:52 上午 org.apache.catalina.startup.ClassLoaderFactory validateFile
警告: Problem with directory [E:\workspace\mot\tomcat8.5\lib], exists: [false], isDirectory: [false], canRead: [false]
四月 16, 2023 9:35:52 上午 org.apache.catalina.startup.ClassLoaderFactory validateFile
警告: Problem with directory [E:\workspace\mot\tomcat8.5\lib], exists: [false], isDirectory: [false], canRead: [false]
3、解析server.xml
-->Bootstrap::setAwait(true);//设置await
-->Bootstrap::load()
---->反射调用org.apache.catalina.startup.Catalina::load()加载server.xml
------>org.apache.catalina.startup.Catalina::createStartDigester设置Digester匹配模式
------>Digester.parse根据模式匹配解析server.xml，生成org.apache.catalina.core.StandardServer、org.apache.catalina.core.StandardService等server.xml配置的各个元素
4、初始化server
------>org.apache.catalina.core.StandardServer::init初始化Server
------>org.apache.catalina.util.LifecycleBase::init
server根据配置需要加载6个监听器：
org.apache.catalina.core.NamingContextListener
org.apache.catalina.startup.VersionLoggerListener
org.apache.catalina.core.AprLifecycleListener
org.apache.catalina.core.JreMemoryLeakPreventionListener
org.apache.catalina.mbeans.GlobalResourcesLifecycleListener
org.apache.catalina.core.ThreadLocalLeakPreventionListener
其中当server处于before_init状态时执行org.apache.catalina.startup.VersionLoggerListener::log打印tomcat版本相关信息,读取配置文件org/apache/catalina/util/ServerInfo.properties打印tomcat版本信息：
四月 16, 2023 2:13:36 下午 org.apache.catalina.startup.VersionLoggerListener log
信息: Server.服务器版本:     Apache Tomcat/@VERSION@
四月 16, 2023 2:13:36 下午 org.apache.catalina.startup.VersionLoggerListener log
信息: 服务器构建:            @VERSION_BUILT@
四月 16, 2023 2:13:36 下午 org.apache.catalina.startup.VersionLoggerListener log
信息: 服务器版本号(：@VERSION_NUMBER@
四月 16, 2023 2:13:36 下午 org.apache.catalina.startup.VersionLoggerListener log
信息: OS Name:               Windows 7
四月 16, 2023 2:13:36 下午 org.apache.catalina.startup.VersionLoggerListener log
信息: OS.版本:               6.1
四月 16, 2023 2:13:36 下午 org.apache.catalina.startup.VersionLoggerListener log
信息: 架构:                  amd64
四月 16, 2023 2:13:36 下午 org.apache.catalina.startup.VersionLoggerListener log
信息: Java 环境变量:         C:\java\jdk1.8.0_171\jre
四月 16, 2023 2:13:36 下午 org.apache.catalina.startup.VersionLoggerListener log
信息: JVM 版本:              1.8.0_171-b11
四月 16, 2023 2:13:36 下午 org.apache.catalina.startup.VersionLoggerListener log
信息: JVM.供应商:            Oracle Corporation
四月 16, 2023 2:13:36 下午 org.apache.catalina.startup.VersionLoggerListener log
信息: CATALINA_BASE：[E:\workspace\mot\tomcat8.5]
四月 16, 2023 2:13:37 下午 org.apache.catalina.startup.VersionLoggerListener log
信息: CATALINA_HOME:         E:\workspace\mot\tomcat8.5
四月 16, 2023 2:13:37 下午 org.apache.catalina.startup.VersionLoggerListener log
信息: 命令行参数：[-agentlib:jdwp=transport=dt_socket,suspend=y,address=localhost:57732]
四月 16, 2023 2:13:37 下午 org.apache.catalina.startup.VersionLoggerListener log
信息: 命令行参数：[-Dmaven.multiModuleProjectDirectory=$M2_HOME]
四月 16, 2023 2:13:37 下午 org.apache.catalina.startup.VersionLoggerListener log
信息: 命令行参数：[-Dfile.encoding=UTF-8]
需要到java path下查找libtcnative-1.dll和tcnative-1.dll,如果找不到org.apache.catalina.core.AprLifecycleListener::lifecycleEvent打印如下信息：
四月 16, 2023 2:27:21 下午 org.apache.catalina.core.AprLifecycleListener lifecycleEvent
信息: The APR based Apache Tomcat Native library which allows optimal performance in production environments was not found on the java.library.path: [C:\java\jdk1.8.0_171\bin;C:\Windows\Sun\Java\bin;C:\Windows\system32;C:\Windows;C:/java/jdk1.8.0_171/bin/../jre/bin/server;C:/java/jdk1.8.0_171/bin/../jre/bin;C:/java/jdk1.8.0_171/bin/../jre/lib/amd64;C:\Program Files (x86)\Common Files\NetSarang;C:\Windows\system32;C:\Windows;C:\Windows\System32\Wbem;C:\Windows\System32\WindowsPowerShell\v1.0\;C:\Program Files\TortoiseSVN\bin;C:\java\jdk1.8.0_171\bin;C:\java\jdk1.8.0_171\jre\bin;D:\apache-maven-3.6.1\bin;D:\apache-maven-3.6.1\bin;D:\Git\cmd;C:\Python27;D:\mongoDB4.0\bin;D:\mysql-5.6.45-winx64\bin;C:\erl10.5\bin;C:\RabbitMQServer\rabbitmq_server-3.7.17\sbin;D:\gradle-4.6/bin;D:\apache-ant-1.10.7/bin;C:\Users\Administrator\AppData\Local\GitHubDesktop\bin;D:\pythoneclipse;;.]
------>org.apache.catalina.core.StandardServer::initInternal
------>org.apache.catalina.util.LifecycleMBeanBase::initInternal
------>org.apache.catalina.deploy.NamingResourcesImpl::init初始化JNDI
------>org.apache.catalina.util.LifecycleBase::init
------>org.apache.catalina.deploy.NamingResourcesImpl::initInternal
------>org.apache.catalina.util.LifecycleMBeanBase::initInternal
------>org.apache.catalina.core.StandardService::init初始化Service
------>org.apache.catalina.util.LifecycleBase::init
------>org.apache.catalina.core.StandardService::initInternal
------>org.apache.catalina.util.LifecycleMBeanBase::initInternal
------>org.apache.catalina.core.StandardEngine::init初始化Engine
------>org.apache.catalina.util.LifecycleBase::init
------>org.apache.catalina.core.StandardEngine::initInternal
------>org.apache.catalina.core.StandardEngine::getRealm获取Realm
------>org.apache.catalina.util.LifecycleMBeanBase::initInternal
------>org.apache.catalina.core.StandardThreadExecutor::init初始化线程池
------>org.apache.catalina.util.LifecycleBase::init
------>org.apache.catalina.core.StandardThreadExecutor::initInternal
------>org.apache.catalina.util.LifecycleMBeanBase::initInternal
------>org.apache.catalina.mapper.MapperListener::init初始化Mapper监听器
------>org.apache.catalina.util.LifecycleBase::init
------>org.apache.catalina.util.LifecycleMBeanBase::initInternal
------>org.apache.catalina.connector.Connector::init初始化连接器
------>org.apache.catalina.util.LifecycleBase::init
------>org.apache.catalina.connector.Connector::initInternal
-------->org.apache.coyote.http11.Http11NioProtocol::init初始化连接协议
-------->org.apache.coyote.http11.AbstractHttp11Protocol::init
-------->org.apache.coyote.AbstractProtocol::init 会打印如下信息：
四月 16, 2023 3:08:26 下午 org.apache.coyote.AbstractProtocol init
信息: 初始化协议处理器 ["http-nio-8080"]
-------->org.apache.tomcat.util.net.NioEndpoint::init
-------->org.apache.tomcat.util.net.AbstractJsseEndpoint::init
---------->org.apache.tomcat.util.net.AbstractEndpoint::init
------------>org.apache.tomcat.util.net.NioEndpoint::bind
-------------->org.apache.tomcat.util.net.NioSelectorPool::open
--------------->org.apache.tomcat.util.net.NioSelectorPool::getSharedSelector会打印如下信息：
四月 16, 2023 3:14:37 下午 org.apache.tomcat.util.net.NioSelectorPool getSharedSelector
信息: Using a shared selector for servlet write/read
------>org.apache.catalina.util.LifecycleMBeanBase::initInternal
Catalina::load方法结束，会打印如下信息：
四月 16, 2023 2:59:23 下午 org.apache.catalina.startup.Catalina load
信息: Initialization processed in 23101 ms
5、启动server
-->Bootstrap::start()
---->反射调用Catalina::start()
------>org.apache.catalina.core.StandardServer::start启动Server
------>org.apache.catalina.util.LifecycleBase::start
------>org.apache.catalina.core.StandardServer::startInternal
-------->org.apache.catalina.deploy.NamingResourcesImpl::start启动JNDI
-------->org.apache.catalina.util.LifecycleBase::start
-------->org.apache.catalina.deploy.NamingResourcesImpl::startInternal
-------->org.apache.catalina.core.StandardService::start启动Service
-------->org.apache.catalina.util.LifecycleBase::start
-------->org.apache.catalina.core.StandardService::startInternal打印如下信息：
四月 16, 2023 3:22:09 下午 org.apache.catalina.core.StandardService startInternal
信息: Starting service [Catalina]
---------->org.apache.catalina.core.StandardEngine::start启动Engine
---------->org.apache.catalina.util.LifecycleBase::start
---------->org.apache.catalina.core.StandardEngine::startInternal打印如下信息：
四月 16, 2023 3:22:57 下午 org.apache.catalina.core.StandardEngine startInternal
信息: Starting Servlet Engine: Apache Tomcat/@VERSION@
---------->org.apache.catalina.core.ContainerBase::startInternal
------------>org.apache.catalina.util.LifecycleBase::fireLifecycleEvent
-------------->org.apache.catalina.startup.HostConfig::lifecycleEvent
-------------->org.apache.catalina.startup.HostConfig::start
-------------->org.apache.catalina.startup.HostConfig::deployApps
---------------->org.apache.catalina.startup.HostConfig::deployDescriptors部署XML配置
---------------->org.apache.catalina.startup.HostConfig::deployWARs部署war包
---------------->org.apache.catalina.startup.HostConfig::deployDirectories部署目录，打印如下信息：
四月 16, 2023 3:38:47 下午 org.apache.catalina.startup.HostConfig deployDirectory
信息: 把web 应用程序部署到目录 [E:\workspace\mot\tomcat8.5\webapps\docs]
四月 16, 2023 4:08:36 下午 org.apache.catalina.startup.HostConfig deployDirectory
信息: Deployment of web application directory [E:\workspace\mot\tomcat8.5\webapps\docs] has finished in [1,018,421] ms
------------>org.apache.catalina.ha.tcp.SimpleTcpCluster::start启动Cluster
------------>org.apache.catalina.util.LifecycleBase::start
-------------->org.apache.catalina.tribes.group.GroupChannel::start
-------------->org.apache.catalina.ha.deploy.FarmWarDeployer::start
------------>org.apache.catalina.realm.LockOutRealm::start启动LockOutRealm
------------>org.apache.catalina.util.LifecycleBase::start
------------>org.apache.catalina.realm.LockOutRealm::startInternal
------------>org.apache.catalina.realm.CombinedRealm::startInternal
------------>org.apache.catalina.realm.RealmBase::startInternal
------------>org.apache.catalina.realm.UserDatabaseRealm::start启动UserDatabaseRealm
------------>org.apache.catalina.util.LifecycleBase::start
------------>org.apache.catalina.realm.UserDatabaseRealm::startInternal
------------>org.apache.catalina.realm.RealmBase::startInternal
------------>org.apache.catalina.core.StandardHost::start启动容器
------------>org.apache.catalina.util.LifecycleBase::start
------------>org.apache.catalina.core.StandardHost::startInternal
-------------->org.apache.catalina.core.StandardContext::startInternal
-------------->org.apache.jasper.servlet.JasperInitializer::onStartup
-------------->org.apache.jasper.servlet.TldScanner::scan
-------------->org.apache.jasper.servlet.TldScanner::scanJars 扫描所有部署应用下面WEB-INF下的tld文件  如果找不到就打印如下信息：
四月 16, 2023 3:57:36 下午 org.apache.jasper.servlet.TldScanner scanJars
信息: 至少有一个JAR被扫描用于TLD但尚未包含TLD。 为此记录器启用调试日志记录，以获取已扫描但未在其中找到TLD的完整JAR列表。 在扫描期间跳过不需要的JAR可以缩短启动时间和JSP编译时间。
---------------->org.apache.catalina.startup.HostConfig::deployDirectories部署目录，打印如下信息：
四月 16, 2023 4:08:36 下午 org.apache.catalina.startup.HostConfig deployDirectory
信息: Deployment of web application directory [E:\workspace\mot\tomcat8.5\webapps\docs] has finished in [1,018,421] ms
------------>org.apache.catalina.core.StandardPipeline::start启动Pipeline
------------>org.apache.catalina.util.LifecycleBase::start
------------>org.apache.catalina.core.StandardPipeline::startInternal
------------>org.apache.catalina.valves.AccessLogValve::start启动AccessLogValve
------------>org.apache.catalina.util.LifecycleBase::start
------------>org.apache.catalina.valves.AccessLogValve::startInternal
------------>org.apache.catalina.valves.AbstractAccessLogValve::startInternal
---------->org.apache.catalina.core.StandardThreadExecutor::start启动线程池
---------->org.apache.catalina.util.LifecycleBase::start
---------->org.apache.catalina.core.StandardThreadExecutor::startInternal
---------->org.apache.catalina.mapper.MapperListener::start启动Mapper监听器
---------->org.apache.catalina.util.LifecycleBase::start
---------->org.apache.catalina.mapper.MapperListener::startInternal
---------->org.apache.catalina.connector.Connector::start启动连接器
---------->org.apache.catalina.util.LifecycleBase::start
---------->org.apache.catalina.connector.Connector::startInternal
------------>org.apache.coyote.http11.Http11NioProtocol::start启动连接协议
------------>org.apache.coyote.AbstractProtocol::start 打印如下信息：
四月 16, 2023 4:42:15 下午 org.apache.coyote.AbstractProtocol start
信息: 开始协议处理句柄["http-nio-8080"]
------------>org.apache.tomcat.util.net.NioEndpoint::start
------------>org.apache.tomcat.util.net.AbstractEndpoint::start
------------>org.apache.tomcat.util.net.NioEndpoint::startInternal
Catalina::start方法最后打印如下信息：
四月 16, 2023 4:47:43 下午 org.apache.catalina.startup.Catalina start
信息: Server startup in 385951 ms
6、监听停止端口
------>Catalina::await
------>org.apache.catalina.core.StandardServer::await 使用ServerSocket监听localhost 8005端口 接收关闭指令（telnet localhost 8005 >SHUTDOWN）
StandardServer::await方法打印如下信息：
四月 16, 2023 4:49:30 下午 org.apache.catalina.core.StandardServer await
信息: A valid shutdown command was received via the shutdown port. Stopping the Server instance.
7、关闭server
------>Catalina::stop
------>org.apache.catalina.core.StandardServer::stop停止server
------>org.apache.catalina.util.LifecycleBase::stop
------>org.apache.catalina.core.StandardServer::stopInternal
-------->org.apache.catalina.core.StandardService::stop停止Service
-------->org.apache.catalina.util.LifecycleBase::stop
-------->org.apache.catalina.core.StandardService::stopInternal
四月 16, 2023 4:51:52 下午 org.apache.catalina.core.StandardService stopInternal
信息: 正在停止服务[Catalina]
-------->org.apache.catalina.connector.Connector::pause
-------->org.apache.coyote.http11.Http11NioProtocol::pause
-------->org.apache.coyote.AbstractProtocol::pause打印如下信息：
四月 16, 2023 4:51:52 下午 org.apache.coyote.AbstractProtocol pause
信息: Pausing ProtocolHandler ["http-nio-8080"]
-------->org.apache.coyote.AbstractProtocol::closeServerSocketGraceful
---------->org.apache.tomcat.util.net.NioEndpoint::closeServerSocketGraceful
-------->org.apache.catalina.core.StandardEngine::stop
-------->org.apache.catalina.util.LifecycleBase::stop
---------->org.apache.catalina.core.ContainerBase::stopInternal
-------->Pipeline::stop
-------->StandardHost::stop
-------->Realm::stop
-------->Cluster::stop
-------->StandardContext::stopInternal
-------->StandardWrapper::stopInternal
-------->StandardContext::filterStop
-------->StandardContext::listenerStop
-------->StandardContext::resourcesStop
-------->Connector::stop
-------->Connector::stopInternal
-------->org.apache.coyote.AbstractProtocol::stop会打印如下信息：
四月 16, 2023 4:51:53 下午 org.apache.coyote.AbstractProtocol stop
信息: 正在停止ProtocolHandler ["http-nio-8080"]
-------->MapperListener::stop
-------->StandardThreadExecutor::stop
-------->NamingResourcesImpl::stop
8、销毁server
------>org.apache.catalina.core.StandardServer::destroy销毁server
------>StandardService::destroy
-------->org.apache.coyote.AbstractProtocol::destroy
-------->org.apache.catalina.connector.Connector::destroyInternal
-------->org.apache.coyote.AbstractProtocol::destroy会打印如下信息：
四月 16, 2023 5:01:37 下午 org.apache.coyote.AbstractProtocol destroy
信息: 正在摧毁协议处理器 ["http-nio-8080"]
-------->org.apache.catalina.core.StandardEngine::destroy
-------->org.apache.catalina.core.ContainerBase::destroyInternal
------>NamingResourcesImpl::destroy
```

load:

initialize:

start:

deploy APP:

## 二、启停关键组件

```java
1、启停脚本
startup.bat、startup.sh、shutdown.bat、shutdown.sh内部调用catalina.bat或者catalina.sh，catalina.bat或者catalina.sh内部调用org.apache.catalina.startup.Bootstrap,并传入相应的参数；或者直接运行catalina.bat或者catalina.sh加入我们需要的参数
2、org.apache.catalina.startup.Bootstrap启动器
2.1 设置catalina.home和catalina.base目录
2.2 接收运行参数
2.3 init()
--initClassLoaders()创建三个类加载器：commonLoader、catalinaLoader、sharedLoader，默认都是URLClassLoader
--反射调用org.apache.catalina.startup.Catalina::setParentClassLoader设置其父加载器为sharedLoader
2.4 反射调用org.apache.catalina.startup.Catalina::setAwait、load、start、stop、stopServer方法
3、org.apache.catalina.startup.Catalina-实际server启动者
3.1 setAwait()：设置监听终止server指令的端口
3.2 load():
--initDirs();初始化系统默认的临时文件目录
--initNaming();在创建Digester匹配模式之前初始化JNDI服务
--createStartDigester()创建启动Digester匹配模式
--digester.push(this);将org.apache.catalina.startup.Catalina作为第一个元素
--digester.parse(inputSource);解析Server.xml
--org.apache.catalina.core.StandardServer.setCatalina(this);
--org.apache.catalina.core.StandardServer.setCatalinaHome(Bootstrap.getCatalinaHomeFile());设置catalina.home
--org.apache.catalina.core.StandardServer.setCatalinaBase(Bootstrap.getCatalinaBaseFile());设置catalina.base
--initStreams();重定向System.out and System.err 使用自定义的流
--org.apache.catalina.core.StandardServer.init()初始化server
3.3 start()
--org.apache.catalina.core.StandardServer.start()
--await()阻塞监听
--stop()当监听到关闭命令进行关闭
3.4 stop()
--org.apache.catalina.core.StandardServer.stop();停止server
--org.apache.catalina.core.StandardServer.destroy();销毁server
3.5 stopServer()终止server
--createStopDigester():创建终止Digester匹配模式
--org.apache.catalina.core.StandardServer.stop();停止server
--org.apache.catalina.core.StandardServer.destroy();销毁server
```

## 三、关闭钩子

对java而言，虚拟机会对以下几种操作进行关闭：

1、系统调用System.exit()方法；

2、程序最后一个守护线程退出时，应用程序正常退出；

3、用户强行中断程序运行，比如ctrl+c等其他方式中断java程序；

关闭钩子是一个特殊的线程，可以人为编码实现。java进程在停止之前，会调用已注册关闭钩子的run()方法。

关闭钩子的生成：

**1、** 创建Thread的子类；

**2、** 重写run方法，应用程序关闭时会调用该方法，不需要调用start方法；

**3、** 在应用中实例化关闭钩子类；

**4、** 使用Runtime注册关闭钩子：Runtime.getRuntime().addShutdownHook(shutdownHook);；

tomcat关闭钩子举例：

```java
public class Catalina {
    ....
    //默认使用关闭钩子
    protected boolean useShutdownHook = true;
    protected Thread shutdownHook = null;
    public void start() {
        ....        
        if (useShutdownHook) {
            if (shutdownHook == null) {
                shutdownHook = new CatalinaShutdownHook();
            }
            Runtime.getRuntime().addShutdownHook(shutdownHook);
            LogManager logManager = LogManager.getLogManager();
            if (logManager instanceof ClassLoaderLogManager) {
                ((ClassLoaderLogManager) logManager).setUseShutdownHook(false);
            }
        }
        ....
    }
    protected class CatalinaShutdownHook extends Thread {
        @Override
        public void run() {
            try {
                if (getServer() != null) {
                    Catalina.this.stop();
                }
            } catch (Throwable ex) {
                ExceptionUtils.handleThrowable(ex);
                log.error(sm.getString("catalina.shutdownHookFail"), ex);
            } finally {
                // If JULI is used, shut JULI down *after* the server shuts down
                // so log messages aren't lost
                LogManager logManager = LogManager.getLogManager();
                if (logManager instanceof ClassLoaderLogManager) {
                    ((ClassLoaderLogManager) logManager).shutdown();
                }
            }
        }
    }
    ......
}
```

参考：
[Tomcat源码分析(一)--服务启动](https://blog.csdn.net/haitao111313/article/details/7717160)
