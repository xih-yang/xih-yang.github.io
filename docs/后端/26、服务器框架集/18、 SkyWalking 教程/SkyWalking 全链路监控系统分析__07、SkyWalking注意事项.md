# 07、SkyWalking注意事项
- 来源：https://ddkk.com/zhuanlan/linktrack/skywalking/7.html
- 分类：链路追踪
- 分组：SkyWalking 全链路监控系统分析
## 1、agent部署

拷贝agent目录到所需位置。

日志，插件和配置都包含在包中，请不要改变目录结构。

建议将该agent目录与客户端应用放在同一台服务器， 多台服务器需要监控则都部署agent目录，每台服务器上的应用配置本机的agent参数。

增加JVM启动参数如下：

-javaagent:/path/to/skywalking-agent/skywalking-agent.jar。

参数值为skywalking-agent.jar的绝对路径。

新的agent package 目录结构如下：

--from https://blog.csdn.net/jilo88/article/details/81355265

## 2、JAR启动

在启动你的应用程序的命令行中添加 -javaagent 参数。并确保在-jar参数之前添加它。例如:

java -javaagent:/path/to/skywalking-agent/skywalking-agent.jar -jar yourApp.jar

--from https://blog.csdn.net/jilo88/article/details/81355265

## 3、主机时间未同步

**Collector****和被监控应用的系统主机时间，没有同步：**

--from

https://github.com/apache/incubator-skywalking/blob/5.x/docs/cn/FAQ/Why-have-traces-no-others-CN.md

## 4、参考资源

（一）、环境部署--社区

**1、** 网络；

https://blog.csdn.net/y_h_d/article/details/83342846

https://blog.csdn.net/zhangkang65/article/details/78991760

**2、** 端口修改skywalking8080端口修改；

https://my.oschina.net/ytqvip/blog/1793767

**3、** 社区；

docker环境：

https://www.cnblogs.com/liguobao/p/9686310.html

**4、** 版本5.X；

A类

es环境安装：

http://blog.51cto.com/zero01/2130696

高级特性

https://blog.csdn.net/jilo88/article/details/81355265

https://blog.csdn.net/SoberChina/article/details/79315242

https://blog.csdn.net/qq_42281649/article/details/82804703

**5、** 独到总结；

https://blog.csdn.net/qq_36236890/article/details/79647017

**6、** 官方社区；

https://github.com/OpenSkywalking/Community

**7、** 高级部署；

http://blog.51cto.com/536410/2318051

**8、** APM、Google；

pass==++++https://www.cnblogs.com/xiaoqi/p/apm.html

（二）、环境部署--官方--文档

**1、** 官方；

中文

https://github.com/apache/incubator-skywalking/blob/5.x/docs/README_ZH.md

--英文

https://github.com/apache/incubator-skywalking

**2、** Docker；

https://github.com/JaredTan95/skywalking-docker

**3、** 如何构建项目；

https://github.com/apache/incubator-skywalking/blob/master/docs/en/guides/How-to-build.md

（三）、高级特性

**1、** 个性化服务过滤；

https://github.com/apache/incubator-skywalking/blob/5.x/apm-sniffer/optional-plugins/trace-ignore-plugin/README_CN.md

https://blog.csdn.net/u013095337/article/details/80452088

**2、** 版本、；

https://github.com/SkywalkingTest/agent-integration-test-report#dubbo

（四）、理论、深入研究文章

**1、** 架构设计-系列文章；

https://github.com/apache/incubator-skywalking/blob/5.x/docs/cn/Architecture-CN.md

https://blog.csdn.net/Saphulot/article/details/81739411

pass==https://www.jianshu.com/p/2fd56627a3cf

**2、** 全面深入分析；

https://juejin.im/post/5a7a9e0af265da4e914b46f1

**3、** 全面学习；

http://www.iocoder.cn/categories/SkyWalking/

**4、** 10加文章；

https://juejin.im/post/5ab5b0e26fb9a028e25d7fcb

**5、** skywalking源码解析之javaAgent工具ByteBuddy的应用；

http://www.kailing.pub/article/index/arcid/178.html

**6、** 谷歌论文《Dapper，大规模分布式系统的跟踪系统》；

http://bigbully.github.io/Dapper-translation/

（五）、监控应用

https://www.jianshu.com/p/3ddd986c7581

https://www.cnblogs.com/huangxincheng/p/9666930.html

（六）、APM常见技术对比

https://blog.csdn.net/u012394095/article/details/79700200

https://www.jianshu.com/p/0fbbf99a236e

https://www.cnblogs.com/davidwang456/articles/8119047.html

（七）、UI

https://blog.csdn.net/qq_36236890/article/details/79647017

http://blog.zollty.com/b/archive/apm-comparison-of-skywalking-and-pinpiont.html
