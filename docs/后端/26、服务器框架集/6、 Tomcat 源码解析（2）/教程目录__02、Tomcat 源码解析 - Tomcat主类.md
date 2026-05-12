# 02、Tomcat 源码解析 - Tomcat主类
- 来源：https://ddkk.com/zhuanlan/server/tomcat/2/2.html
- 分类：服务器框架
- 分组：教程目录
**问题：** 要找到tomcat的主类，任何java程序都是由主类的main方法启动的，java程序的编写运行主要两个步骤首先用javac命令编译源码，简单的程序简单用java 调用主类调用，复杂的程序也会使用jar命令打包class文件，主要步骤：1.javac 2.jar(不是必须) 3.java运行。

**寻找主类：** 我们知道我们平常启动tomcat的时候会用startup.bat(sh)，可以去查看startup代码，startup会调用catalina.bat(sh),最后查看catalina代码，主要是2个地方

catalina.bat为例

用eclipse查找我们之前导入的tomcat源码，主要可以找到两个类，一个是org.apache.catalina.startup.Bootstrap,一个是org.apache.catalina.startup.Tomcat

Bootstrap类，这个就是启动tomcat的入口，详细后面的文章介绍

Tomcat类，这个是我们用embedding的方式使用tomcat的时候的主类，这个后面应该会有专门的文章介绍，不在是默认使用server.xml，而是program的方式设置

我们的tomcat的server、service等，tomcat主要结构后面文章会介绍讲解。

完毕。
