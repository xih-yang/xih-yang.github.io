# 07、XXL-JOB 源码分析 - 执行器启动与动态代码加载解读
- 来源：https://ddkk.com/zhuanlan/job/xxljob/2/7.html
- 分类：作业调度
- 分组：XXL-JOB 源码解析
## 一、 结构

前面六章基本上已经把调度器的部分覆盖了，接下来我们解读执行器部分，也就是xxl-job-core包。

目录
说明

biz
调度器与执行器交互的接口与实现

enums
相关枚举

executor
执行器实例以及执行器与spring的嵌合

glue
java动态加载的实现与其他胶水代码的枚举定义

handler
IJobHandler以及它的特定实现类。

log
日志自定义实现，将日志写入本地文件保存

server
netty服务器实现，用于与调度器通信

thread
任务线程，注册线程，日志文件清理线程等。

util
工具类

## 二、 启动流程

XxlJobExecutor是执行器的核心启动类。

xxl-job默认支持spring集成，spring体系下不需要额外的操作。同时也提供了一些其他的框架集成实现，放在了xxl-job-executor-samples中：

我们这里只关注spring方式启动。

- XxlJobSpringExecutor.afterSingletonsInstantiated()

XxlJobSpringExecutor使用了SmartInitializingSingleton而非InitializingBean来进行初始化。`SmartInitializingSingleton是在spring容器中所有bean加载完成后，才会被调用，这里主要是为了保证JobHandler已经spring容器加载`。
- 第一步，将业务系统@XxlJob注解了的方法加载成JobHandler实例，保存到一个本地Map对象中（代码无亮点，不再展开，关于spring的部分以后开个spring源码系列再来唠）。
- 第二步，加载Glue代码工厂实例，用于做运行中动态代码加载，此部分放在下面第三章详解。
- 第三步，进入XxlJobExecutor启动主流程。
- XxlJobExecutor.start()
- 第一步，初始化任务处理日志的路径目录初始化，值得一提这里的默认base路径不适用于windwos需要重新设定：
- 第二步，初始化调度器，xxl-job 的调度器原来支持多节点部署，是我肤浅了。
- 第三步，启动日志文件清理线程，文件清理周期由用户指定，logRetentionDays=1代表清理一天前的日志文件。
- 第四步，启动回调线程，这里值得一提，我们知道xxl-job的任务是通过调度器下发给执行器的，而当执行器执行完任务之后，会将执行结果存放在一个queue中。然后由这个回调线程不断的将queue中的结果返还给调度器。
- 第五步，启动内嵌服务器EmbedServer。
- XxlJobExecutor.initEmbedServer()
- 第一步，寻找一个可用的端口，默认先使用9999，这里值得一提的是找可用端口的代码：`从9999开始，往下递减，判断可用的方法则是直接使用java.net.ServerSocket实例化，抛异常说明已经被占用了。`
- 第二步，拼接了一个http协议的请求地址。
- 第三步，启动netty服务器。

netty服务器的作用是与调度器进行通信，相关的具体配置，我们下一章节再结合netty进行讲解。

## 三、 动态代码执行

Glue=胶水，胶水代码这个词还是挺贴切的。

xxl-job支持的胶水代码主要是两部分，JVM类代码和脚本语言代码。

### 脚本代码的执行

脚本代码的执行与glue包没什么关系，我们从任务执行的一段代码中找到相关部分的截出来。

首先判断判断是否是脚本代码，最后使用脚本代码生成了一个ScriptJobHandler对象，重点就在这里。

- ScriptJobHandler.execute()
- 第一步，获取cmd，这里的cmd见第三章的枚举图，cmd即为各种脚本语言的执行器，`也即执行器本地必须安装了相关的脚本执行器才可以执行相关脚本。`
- 第二步，将脚本保存成一个本地文件，准备之后直接用执行器执行。
- 第三步，获取到前文提到的日志文件地址。
- 第四步，对广播分片模式的支持（广播分片模式见前文【xxl-job源码阅读——（五）快慢线程池与负载策略解析】）
- 第五步，使用Java.lang.Runtime执行命令。这里还有个面试常见题，join()。

### JVM类的执行

Groovy也是基于JVM的语言，类似的还有Scala，虽然语法比java精简，但是易读性可能会差一些。

之前我看Scala代码与人讨论，得出一个结论，Scala资深大神写的代码，只有大神自己能看懂╮(￣▽ ￣)╭。

xxl支持的JVM类代码，其实也只是java与groovy，因为这里直接使用了GroovyClassLoader作为类加载器。

- Glue工厂类的初始化

SpringGlueFactory是GlueFactory的子类，在前文的执行器启动过程中，Spring框架下加载的，是SpringGlueFactory。
- SpringGlueFactory

相较于GlueFactory只是多了一个方法——injectService，看方法名字也能明白，作用是将一个object注入到spring容器中，作为一个bean存在。
- GlueFactory

核心的主要是GroovyClassLoader与一个代码加载方法，
- 第一步，通过GroovyClassLoader编译class，
- 第二步，通过class反射实例化一个object。
- 第三步，将object注入到spring容器中。

到此结束，看过类加载器相关面试题的话这部分还是比较好理解的。

另外，动态代码加载也不只是GroovyClassLoader这一种方式，使用JDK中的tools.jar一样可以做到这个功能，当然就只支持java语法了，有兴趣的同学可以看我以前写的这一篇：

[JAVA代码的动态编译加载，随后实例化bean注入Spring容器

]:
[https://blog.csdn.net/qq_35946969/article/details/117453470](https://blog.csdn.net/qq_35946969/article/details/117453470)
