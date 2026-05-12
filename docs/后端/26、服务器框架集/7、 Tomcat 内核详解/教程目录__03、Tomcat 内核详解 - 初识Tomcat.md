# 03、Tomcat 内核详解 - 初识Tomcat
- 来源：https://ddkk.com/zhuanlan/server/tomcat/3/3.html
- 分类：服务器框架
- 分组：教程目录
## 1.Tomcat的批处理

### 1.startup.bat

startup.bat是windows下的启动批处理脚本，它的主要功能就是找到另一个批处理脚本catalina.bat，并且执行catalina.bat。

### 2.shutdown.bat

关闭脚本shutdown.bat的内容与启动脚本startup.bat的内容基本一样，其执行顺序也是先找到另一个批处理脚本catalina.bat的路径，然后执行catalina.bat，不同的是，执行catalina.bat传入的参数不同，如启动的时候传入的参数是start，则关闭的时候传入的参数为stop；

### 3.catalina.bat

catalina.bat批处理脚本才是Tomcat服务器启动和关闭的核心脚本，它的最终目的是组合出一个最终的执行命令，组合的时候会涉及到多个变量和组合逻辑。

第一步：

目的是用户在按Ctrl+C组合键终止程序的时候自动确认。

第二步：

主要用于设置CATALINA_HOME、CATALINA_BASE两个变量；

第三步：

主要用于尝试寻找setenv.bat和setclasspath.bat并执行，然后再将Tomcat的启动包bootstrap.jar和日志包tomca-juli.jar添加到CASSPATH环境变量下；

第四步：

对日志配置进行设置；

Tomcat中的日志实现使用了jdk自带的日志工具。

其中有两个属性可以配置：

java.util.logging.config.file和java.util.logging.manager

第五步：执行命令前参数的初始化；

第六步：根据不同的参数跳转到不同的位置执行不同的命令；

第七部：把前面的所有脚本运行之后组成的一个最终的命令开始执行；

### 4.setclasspath.bat

setclasspath.bat的职责负责寻找JAVA_HOME和JRE_HOME两个环境变量；

## 2.Tomcat中的变量以及属性

变量和属性的目的就是主要将某些参数剥离出程序，以实现可配置性；

可以在批处理中添加或者修改环境变量；

在Tomcat程序中可以通过System.getenv(name)获取环境变量

Tomcat程序中可以通过System.getProperty(name)获取JVM系统属性；

而Tomcat属性主要通过catalina.properties配置文件配置，在Tomcat启动的时候会加载，Tomcat程序通过CATALINAProperties获取；

### 1.环境变量

%JAVA_HOME%：JDK的安装目录

%CLASSPATH%：JDK搜索class的时候优先搜索该目录下的jar包；

%PATH%：执行某个命令的时候，如果在本地找不到此命令或者文件，则会从%PATH%变量声明的目录中查找；

### 2.JVM系统变量

**1、** user.dir；

**2、** java.io.tmpdir；

**3、** java.home；

**4、** user.home；

**5、** java.vm.vendor；

**6、** java.runtime.version；

**7、** ；

### 3.Tomcat属性

**1、** package.access：与Java安全管理器的权限配置有关；

**2、** package.definition：与Java安全管理器的权限配置相关，用于配置包的定义权限；

**3、** common.loader：用于配置Tomcat中用commonLoader类加载器加载的类库；

**4、** server.loader：用于配置Tomcat中用serverLoader类加载器加载的类库，默认配置为空；

**5、** shared.loader：用于配置Tomcat中用sharedLoader类加载器加载的类库，默认配置为空；
