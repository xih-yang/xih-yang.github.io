# 01、Tomcat 源码解析 - 导入 Tomcat 源码进 Eclipse
- 来源：https://ddkk.com/zhuanlan/server/tomcat/2/1.html
- 分类：服务器框架
- 分组：教程目录
**前言**

阅读tomcat源码，可以简单的用一般的文本编辑器查看，但是为了更加高效的阅读，可以借助IDE方便的功能，比如Type Hierachy、源码导航功能等。

参考文档：http://tomcat.apache.org/tomcat-9.0-doc/building.html

**导入步骤**

下面是导入eclipse的步骤，以及我在导入中碰到过的问题，我下的是tomcat9.x的版本，OS是WIN10，IDE是eclipse

**1、** 下载java8，配置JAVA_HOME和path；

**2、** 下载ant1.9.5orlater，配置ANT_HOME和path；

**3、** 下载tomcat源码，解压；

**4、** 修改下载的tomcat源码需要的jar包存放的路径（不是必须）；

tomcat源码根目录下会有个文件叫build.properties.default，熟悉ant的盆友知道这个是ant的property配置文件，去掉default后缀，修改里面的base.path属性

不修改这个路径的话，默认会放在C:\Users\xxxx\tomcat-build-libs下面，这个配置文件还可以修改ant build tomcat源码的时候的行为，具体可以查看上面的注释

、

**5、** 运行antide-eclipsetarget；

熟悉ant的盆友知道这个是运行ant指定的target，会先去网上下载tomcat编译需要的jar包，不过你也可以自己手动下载放到第四部你配置的路径下，如果是直接运行

antide-eclipse的话，我碰到的情况是会有两个jar包下载不了easymock3.2和cglib2.2.3，至于原因嘛，可以看到sourceforge呵呵

这个只能自己去下载然后放在之前配置的路径下，注意是目录的形式，不能直接放jar包，最后完整的包是下面的样子

再次运行ant ide-eclipse，就会执行成功，这个target会在源码根目录生成eclipse工程需要的文件，比如.classpath等，这个做法我们自己也可以参考，

不过首先要熟悉eclipse对工程的定义

**6、** importtomcat源码；

配置eclipse classpath，ANT_HOME以及TOMCAT_LIBS_BASE，TOMCAT_LIBS_BASE就是配置的jar存放的路径，通过existing projects into workspace，导入成功后，

可以通过Run Configuration里面的start-tomcat 和stop-tomcat来启动停止tomcat，这样就可以愉快方便的来阅读tomcat源码了。
