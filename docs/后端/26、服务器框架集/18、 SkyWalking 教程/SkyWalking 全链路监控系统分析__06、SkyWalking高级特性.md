# 06、SkyWalking高级特性
- 来源：https://ddkk.com/zhuanlan/linktrack/skywalking/6.html
- 分类：链路追踪
- 分组：SkyWalking 全链路监控系统分析
## 1、agent插件使用

插件全部放置在 /agent/plugins目录中。新的插件只需要在启动阶段放在目录中就自动生效，删除则失效。

## 2、agent日志位置

\agent\logs

## 3、自定义配置过滤路径

### 3.1参考文献

--from

https://github.com/apache/incubator-skywalking/blob/5.x/apm-sniffer/optional-plugins/trace-ignore-plugin/README_CN.md

即个性化服务过滤。

SkyWalking提供了一个可选插件 apm-trace-ignore-plugin。

### 3.2介绍

- 这个插件的作用是对追踪的个性化服务过滤。
- 可以设置多个需要忽略的URL路径, 意味着包含这些路径的追踪信息不会被agent发送到 collector。
- 当前的路径匹配规则是Ant Path匹配风格 , 例如 /path/*, /path/**, /path/?。
- 将apm-trace-ignore-plugin-x.jar拷贝到agent/plugins后，重启探针即可生效。
- [Skywalking-使用可选插件 apm-trace-ignore-plugin](https://blog.csdn.net/u013095337/article/details/80452088) 有详细使用介绍

请访问https://blog.csdn.net/u013095337/article/details/80452088

### 3.3如何配置路径

有两种配置方式，可使用任意一种，配置生效的优先级从高到低：

**1、** 在系统环境变量中配置，需要在系统变量中添加skywalking.trace.ignore_path,值是需要忽略的路径，多个以,号分隔；

如：在启动参数设置，添加-Dskywalking.trace.ignore_path=/your/path/**

**2、** 将；

/agent/optional-plugins/apm-trace-ignore-plugin/apm-trace-ignore-plugin.config 复制或剪切到 /agent/config/ 目录下，

加上配置

trace.ignore_path=/your/path/1/**,/your/path/2/**

## 4、使用SkyWalking手动追踪API

使用maven 和 gradle 依赖相应的工具包，该工具包通过mavne有可能无法下载，可手动下载jar导入到maven

```xml
<dependency>
    <groupId>org.apache.skywalking</groupId>
    <artifactId>apm-toolkit-trace</artifactId>
    <version>$\{skywalking.version\}</version>
</dependency>
```

可使用TraceContext.traceId() API，在应用程序的任何地方获取traceId.

import org.apache.skywalking.apm.toolkit.trace.TraceContext;

...

modelAndView.addObject("traceId", TraceContext.traceId());

示例代码，仅供参考：

import org.apache.skywalking.apm.toolkit.trace.Trace;

对任何需要追踪的方法，使用 [@Trace](https://my.oschina.net/u/876728) 标注，则此方法会被加入到追踪链中。

在被追踪的方法中自定义 tag。

```java
ActiveSpan.tag("my\_tag", "my\_value");
/**
 \* 对任何需要追踪的方法，使用 @Trace 标注，则此方法会被加入到追踪链中。
 \* 在被追踪的方法中自定义 tag.
 \*/
@RequestMapping("/login")
@Trace
public String login(@RequestParam("userName") String userName, @RequestParam("passwrod") String passwrod)\{ 
logger.info("login to system1, user: " \+ userName);
//TraceContext.traceId() API，在应用程序的任何地方获取traceId.
System.out.println(userName + "======" \+ passwrod + "========"\+ TraceContext.traceId());
ActiveSpan.tag("login\_tag", "login to system, user: " \+ userName);
return userService.login(userName,passwrod);
\}
```

## 5、增加log4j2日志组件集成

使用maven 和 gradle 依赖相应的工具包

```xml
<dependency>
    <groupId>org.apache.skywalking</groupId>
    <artifactId>apm-toolkit-log4j-2.x</artifactId>
    <version>{project.release.version}</version>
</dependency>
```

在log4j2.xml中的pattern 配置节，配置[%traceId]

```xml
<Appenders>
  <Console name="Console" target="SYSTEM_OUT">
     <PatternLayout pattern="%d [%traceId] %-5p %c{1}:%L - %m%n"/>
  </Console>
</Appenders>
```

当使用-javaagent参数激活sky-walking的探针, 如果当前上下文中存在traceid，log4j2将在输出traceId。如果探针没有被激活，将输出TID: N/A。

## 6、agent config非官方解释

--from https://juejin.im/post/5ab5b0e26fb9a028e25d7fcb

配置conf文件 /config/agent.config

# 当前的应用编码，最终会显示在webui上。

# 建议一个应用的多个实例，使用有相同的application_code。请使用英文

agent.application_code=Your_ApplicationName

# 每三秒采样的Trace数量

# 默认为负数，代表在保证不超过内存Buffer区的前提下，采集所有的Trace

# agent.sample_n_per_3_secs=-1

# 设置需要忽略的请求地址

# 默认配置如下

# agent.ignore_suffix=.jpg,.jpeg,.js,.css,.png,.bmp,.gif,.ico,.mp3,.mp4,.html,.svg

# 探针调试开关，如果设置为true，探针会将所有操作字节码的类输出到/debugging目录下

# skywalking团队可能在调试，需要此文件

# agent.is_open_debugging_class = true

# 对应Collector的config/application.yml配置文件中 agent_server/jetty/port 配置内容

# 例如：

# 单节点配置：SERVERS="127.0.0.1:8080"

# 集群配置：SERVERS="10.2.45.126:8080,10.2.45.127:7600"

collector.servers=127.0.0.1:10800

# 日志文件名称前缀

logging.file_name=skywalking-agent.log

# 日志文件最大大小

# 如果超过此大小，则会生成新文件。

# 默认为300M

logging.max_file_size=314572800

# 日志级别，默认为DEBUG。

logging.level=DEBUG
