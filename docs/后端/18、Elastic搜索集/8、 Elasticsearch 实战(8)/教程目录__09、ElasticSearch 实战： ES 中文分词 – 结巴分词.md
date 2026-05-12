# 09、ElasticSearch 实战： ES 中文分词 – 结巴分词
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/8/9.html
- 分类：搜索引擎
- 分组：教程目录
上一章节中我们牛刀小试了一下 Elasticsearch，使用 Elasticsearch 的标准分词器对我们的英文问候语进行了分词，但是，这个分词器对中文的分词结果却不尽人意

你也知道，我们中文没有所谓的空格分隔的词，只有黏在一起的字组成的词

于是，我们必须装一个中文分词插件

百度或Google 一下 Elasticsearch 中文分词 ，你会发现大量的文章和大量的分词器

但这里，我们只使用 **结巴分词**

## 结巴分词

[结巴分词](https://github.com/fxsjy/jieba) 是一个简单的相当流行的 Python 中文分词组件

它有以下特点

**1、** 支持三种分词模式：

**1、** 精确模式，试图将句子最精确地切开，适合文本分析；

**2、** 全模式，把句子中所有的可以成词的词语都扫描出来,速度非常快，但是不能解决歧义；

**3、** 搜索引擎模式，在精确模式的基础上，对长词再次切分，提高召回率，适合用于搜索引擎分词；

**2、** 支持繁体分词；

**3、** 支持自定义词典；

**4、** MIT授权协议；

虽然它的官方版本使用 Python 语言开发

但很多热心的开发者把它翻译成了各种语言，其中 Github 上的 Cheng Zhang 用户就制作了一个 Elasticsearch 版本的结巴分词插件

## Elasticsearch 结巴分词插件

Elasticsearch 结巴分词插件的官方地址为 [https://github.com/sing1ee/elasticsearch-jieba-plugin](https://github.com/sing1ee/elasticsearch-jieba-plugin)

你可以在简介中看到各个版本的结巴分词插件

因为我们使用的是 6.3.0 的版本，所以我们选择下载 v6.0.1

### 安装

下载完成后先不着急解压，正如官方文档所言，需要使用 [gradle](https://gradle.org/) 工具来生成 jar 文件

所以我们首先要做的就是安装 Gradle，安装过程我们就不详细介绍了，网上搜索一大堆

**1、** 打开一个新的终端，使用cd命令跳转到elasticsearch-jieba-plugin-6.0.1.zip所在的目录；

**2、** 使用下面的命令对elasticsearch-jieba-plugin-6.0.1.zip进行解压；

```java
unzip elasticsearch-jieba-plugin-6.0.1.zip
```

如果你的电脑是 Windows ，则直接右键点击解压即可

**3、** 使用cdelasticsearch-jieba-plugin-6.0.1命令跳转到elasticsearch-jieba-plugin-6.0.1目录；

cdelasticsearch-jieba-plugin-6.0.1

**4、** 接着运行gradlepz进行打包；

```java
Starting a Gradle Daemon (subsequent builds will be faster)
Download http://maven.aliyun.com/nexus/content/groups/public/org/elasticsearch/elasticsearch/6.0.0/elasticsearch-6.0.0.pom
Download http://maven.aliyun.com/nexus/content/groups/public/org/apache/logging/log4j/log4j-api/2.7/log4j-api-2.7.pom
....
Deprecated Gradle features were used in this build, making it incompatible with Gradle 5.0.
See https://docs.gradle.org/4.6/userguide/command_line_interface.html#sec:command_line_warnings
BUILD SUCCESSFUL in 3m 54s
4 actionable tasks: 4 executed
```

命令执行的过程时间有点长，如果不发生任何意外，会提示构建成功

```java
BUILD SUCCESSFUL in 3m 54s
4 actionable tasks: 4 executed
```

**5、** 接下里来使用cp命令将build/distributions/目录下的elasticsearch-jieba-plugin-6.0.0.zip压缩包拷贝到Elasticsearch安装目录下的plugins目录下；

```java
cp build/distributions/elasticsearch-jieba-plugin-6.0.0.zip /usr/local/elasticsearch/6.3.0/plugins
```

如果你是根据我们之前教程的安装目录，那么

**1、** 在Unix系统中目录应该是/usr/local/elasticsearch/6.3.0/plugins；

**2、** Windows系统中目录应该是d:\devops\elasticsearch-6.3.0；

**6、** 使用cd命令跳转到Elasticsearch安装目录下的plugins目录下；

```java
cd /usr/local/elasticsearch/6.3.0/plugins
```

**7、** 然后运行下面的命令来安装我们的结巴分词插件；

```java
unzip elasticsearch-jieba-plugin-6.0.0.zip
```

运行结果如下

```java
Archive:  elasticsearch-jieba-plugin-6.0.0.zip
   creating: jieba/
  inflating: jieba/jieba-analysis-1.0.2.jar  
  inflating: jieba/elasticsearch-jieba-plugin-6.0.0.jar  
  inflating: jieba/plugin.xml        
  inflating: jieba/plugin-descriptor.properties  
   creating: jieba/dic/
  inflating: jieba/dic/sougou.dict   
  inflating: jieba/dic/user.dict     
  inflating: jieba/dic/stopwords.txt
```

**8、** 然后运行下面的命令来删除elasticsearch-jieba-plugin-6.0.0.zip；

```java
rm elasticsearch-jieba-plugin-6.0.0.zip
```

**9、** 重新启动Elasticsearch；

## 重新启动 Elasticsearch 失败

因为当前的版本是 6.3.0 ，而结巴插件的版本是 6.0.0，所以启动过程必然报错

像我我连续报了两个错误

```java
2018-06-28T18:14:19,360][INFO ][o.e.n.Node               ] [] initializing ...
[2018-06-28T18:14:19,463][INFO ][o.e.e.NodeEnvironment    ] [4zwAMlT] using [1] data paths, mounts [[/ (/dev/disk1s1)]], net usable_space [12.8gb], net total_space [112.8gb], types [apfs]
[2018-06-28T18:14:19,464][INFO ][o.e.e.NodeEnvironment    ] [4zwAMlT] heap size [990.7mb], compressed ordinary object pointers [true]
[2018-06-28T18:14:19,467][INFO ][o.e.n.Node               ] [4zwAMlT] node name derived from node ID [4zwAMlTzRCaioBeOE9PaNw]; set [node.name] to override
[2018-06-28T18:14:19,468][INFO ][o.e.n.Node               ] [4zwAMlT] version[6.3.0], pid[33449], build[default/zip/424e937/2018-06-11T23:38:03.357887Z], OS[Mac OS X/10.13.5/x86_64], JVM[Oracle Corporation/Java HotSpot(TM) 64-Bit Server VM/1.8.0_101/25.101-b13]
[2018-06-28T18:14:19,468][INFO ][o.e.n.Node               ] [4zwAMlT] JVM arguments [-Xms1g, -Xmx1g, -XX:+UseConcMarkSweepGC, -XX:CMSInitiatingOccupancyFraction=75, -XX:+UseCMSInitiatingOccupancyOnly, -XX:+AlwaysPreTouch, -Xss1m, -Djava.awt.headless=true, -Dfile.encoding=UTF-8, -Djna.nosys=true, -XX:-OmitStackTraceInFastThrow, -Dio.netty.noUnsafe=true, -Dio.netty.noKeySetOptimization=true, -Dio.netty.recycler.maxCapacityPerThread=0, -Dlog4j.shutdownHookEnabled=false, -Dlog4j2.disable.jmx=true, -Djava.io.tmpdir=/var/folders/yk/2446sljj6hn82nvzkdgxltmw0000gn/T/elasticsearch.AXb282by, -XX:+HeapDumpOnOutOfMemoryError, -XX:HeapDumpPath=data, -XX:ErrorFile=logs/hs_err_pid%p.log, -XX:+PrintGCDetails, -XX:+PrintGCDateStamps, -XX:+PrintTenuringDistribution, -XX:+PrintGCApplicationStoppedTime, -Xloggc:logs/gc.log, -XX:+UseGCLogFileRotation, -XX:NumberOfGCLogFiles=32, -XX:GCLogFileSize=64m, -Des.path.home=/usr/local/elasticsearch/6.3.0, -Des.path.conf=/usr/local/elasticsearch/6.3.0/config, -Des.distribution.flavor=default, -Des.distribution.type=zip]
[2018-06-28T18:14:19,552][WARN ][o.e.b.ElasticsearchUncaughtExceptionHandler] [] uncaught exception in thread [main]
org.elasticsearch.bootstrap.StartupException: java.lang.IllegalArgumentException: Unknown properties in plugin descriptor: [jvm, site, isolated]
at org.elasticsearch.bootstrap.Elasticsearch.init(Elasticsearch.java:140) ~[elasticsearch-6.3.0.jar:6.3.0]
at org.elasticsearch.bootstrap.Elasticsearch.execute(Elasticsearch.java:127) ~[elasticsearch-6.3.0.jar:6.3.0]
at org.elasticsearch.cli.EnvironmentAwareCommand.execute(EnvironmentAwareCommand.java:86) ~[elasticsearch-6.3.0.jar:6.3.0]
at org.elasticsearch.cli.Command.mainWithoutErrorHandling(Command.java:124) ~[elasticsearch-cli-6.3.0.jar:6.3.0]
at org.elasticsearch.cli.Command.main(Command.java:90) ~[elasticsearch-cli-6.3.0.jar:6.3.0]
at org.elasticsearch.bootstrap.Elasticsearch.main(Elasticsearch.java:93) ~[elasticsearch-6.3.0.jar:6.3.0]
at org.elasticsearch.bootstrap.Elasticsearch.main(Elasticsearch.java:86) ~[elasticsearch-6.3.0.jar:6.3.0]
Caused by: java.lang.IllegalArgumentException: Unknown properties in plugin descriptor: [jvm, site, isolated]
at org.elasticsearch.plugins.PluginInfo.readFromProperties(PluginInfo.java:240) ~[elasticsearch-6.3.0.jar:6.3.0]
at org.elasticsearch.plugins.PluginsService.readPluginBundle(PluginsService.java:484) ~[elasticsearch-6.3.0.jar:6.3.0]
at org.elasticsearch.plugins.PluginsService.findBundles(PluginsService.java:463) ~[elasticsearch-6.3.0.jar:6.3.0]
at org.elasticsearch.plugins.PluginsService.<init>(PluginsService.java:147) ~[elasticsearch-6.3.0.jar:6.3.0]
at org.elasticsearch.node.Node.<init>(Node.java:311) ~[elasticsearch-6.3.0.jar:6.3.0]
at org.elasticsearch.node.Node.<init>(Node.java:252) ~[elasticsearch-6.3.0.jar:6.3.0]
at org.elasticsearch.bootstrap.Bootstrap$5.<init>(Bootstrap.java:213) ~[elasticsearch-6.3.0.jar:6.3.0]
at org.elasticsearch.bootstrap.Bootstrap.setup(Bootstrap.java:213) ~[elasticsearch-6.3.0.jar:6.3.0]
at org.elasticsearch.bootstrap.Bootstrap.init(Bootstrap.java:326) ~[elasticsearch-6.3.0.jar:6.3.0]
at org.elasticsearch.bootstrap.Elasticsearch.init(Elasticsearch.java:136) ~[elasticsearch-6.3.0.jar:6.3.0]
... 6 more
```

这个错误主要看

```java
Caused by: java.lang.IllegalArgumentException: Unknown properties in plugin descriptor: [jvm, site, isolated]
```

提示，这三个参数错误，那么很简单，直接使用 # 注释掉即可

另一个错误

```java
[2018-06-28T18:18:49,037][INFO ][o.e.n.Node               ] [] initializing ...
[2018-06-28T18:18:49,138][INFO ][o.e.e.NodeEnvironment    ] [4zwAMlT] using [1] data paths, mounts [[/ (/dev/disk1s1)]], net usable_space [12.8gb], net total_space [112.8gb], types [apfs]
[2018-06-28T18:18:49,139][INFO ][o.e.e.NodeEnvironment    ] [4zwAMlT] heap size [990.7mb], compressed ordinary object pointers [true]
[2018-06-28T18:18:49,141][INFO ][o.e.n.Node               ] [4zwAMlT] node name derived from node ID [4zwAMlTzRCaioBeOE9PaNw]; set [node.name] to override
[2018-06-28T18:18:49,141][INFO ][o.e.n.Node               ] [4zwAMlT] version[6.3.0], pid[33593], build[default/zip/424e937/2018-06-11T23:38:03.357887Z], OS[Mac OS X/10.13.5/x86_64], JVM[Oracle Corporation/Java HotSpot(TM) 64-Bit Server VM/1.8.0_101/25.101-b13]
[2018-06-28T18:18:49,142][INFO ][o.e.n.Node               ] [4zwAMlT] JVM arguments [-Xms1g, -Xmx1g, -XX:+UseConcMarkSweepGC, -XX:CMSInitiatingOccupancyFraction=75, -XX:+UseCMSInitiatingOccupancyOnly, -XX:+AlwaysPreTouch, -Xss1m, -Djava.awt.headless=true, -Dfile.encoding=UTF-8, -Djna.nosys=true, -XX:-OmitStackTraceInFastThrow, -Dio.netty.noUnsafe=true, -Dio.netty.noKeySetOptimization=true, -Dio.netty.recycler.maxCapacityPerThread=0, -Dlog4j.shutdownHookEnabled=false, -Dlog4j2.disable.jmx=true, -Djava.io.tmpdir=/var/folders/yk/2446sljj6hn82nvzkdgxltmw0000gn/T/elasticsearch.k4FNB531, -XX:+HeapDumpOnOutOfMemoryError, -XX:HeapDumpPath=data, -XX:ErrorFile=logs/hs_err_pid%p.log, -XX:+PrintGCDetails, -XX:+PrintGCDateStamps, -XX:+PrintTenuringDistribution, -XX:+PrintGCApplicationStoppedTime, -Xloggc:logs/gc.log, -XX:+UseGCLogFileRotation, -XX:NumberOfGCLogFiles=32, -XX:GCLogFileSize=64m, -Des.path.home=/usr/local/elasticsearch/6.3.0, -Des.path.conf=/usr/local/elasticsearch/6.3.0/config, -Des.distribution.flavor=default, -Des.distribution.type=zip]
[2018-06-28T18:18:53,168][WARN ][o.e.b.ElasticsearchUncaughtExceptionHandler] [] uncaught exception in thread [main]
org.elasticsearch.bootstrap.StartupException: java.lang.IllegalArgumentException: Plugin [analysis-jieba] was built for Elasticsearch version 6.0.0 but version 6.3.0 is running
at org.elasticsearch.bootstrap.Elasticsearch.init(Elasticsearch.java:140) ~[elasticsearch-6.3.0.jar:6.3.0]
at org.elasticsearch.bootstrap.Elasticsearch.execute(Elasticsearch.java:127) ~[elasticsearch-6.3.0.jar:6.3.0]
at org.elasticsearch.cli.EnvironmentAwareCommand.execute(EnvironmentAwareCommand.java:86) ~[elasticsearch-6.3.0.jar:6.3.0]
at org.elasticsearch.cli.Command.mainWithoutErrorHandling(Command.java:124) ~[elasticsearch-cli-6.3.0.jar:6.3.0]
at org.elasticsearch.cli.Command.main(Command.java:90) ~[elasticsearch-cli-6.3.0.jar:6.3.0]
at org.elasticsearch.bootstrap.Elasticsearch.main(Elasticsearch.java:93) ~[elasticsearch-6.3.0.jar:6.3.0]
at org.elasticsearch.bootstrap.Elasticsearch.main(Elasticsearch.java:86) ~[elasticsearch-6.3.0.jar:6.3.0]
Caused by: java.lang.IllegalArgumentException: Plugin [analysis-jieba] was built for Elasticsearch version 6.0.0 but version 6.3.0 is running
at org.elasticsearch.plugins.PluginsService.verifyCompatibility(PluginsService.java:421) ~[elasticsearch-6.3.0.jar:6.3.0]
at org.elasticsearch.plugins.PluginsService.loadBundle(PluginsService.java:618) ~[elasticsearch-6.3.0.jar:6.3.0]
at org.elasticsearch.plugins.PluginsService.loadBundles(PluginsService.java:557) ~[elasticsearch-6.3.0.jar:6.3.0]
at org.elasticsearch.plugins.PluginsService.<init>(PluginsService.java:162) ~[elasticsearch-6.3.0.jar:6.3.0]
at org.elasticsearch.node.Node.<init>(Node.java:311) ~[elasticsearch-6.3.0.jar:6.3.0]
at org.elasticsearch.node.Node.<init>(Node.java:252) ~[elasticsearch-6.3.0.jar:6.3.0]
at org.elasticsearch.bootstrap.Bootstrap$5.<init>(Bootstrap.java:213) ~[elasticsearch-6.3.0.jar:6.3.0]
at org.elasticsearch.bootstrap.Bootstrap.setup(Bootstrap.java:213) ~[elasticsearch-6.3.0.jar:6.3.0]
at org.elasticsearch.bootstrap.Bootstrap.init(Bootstrap.java:326) ~[elasticsearch-6.3.0.jar:6.3.0]
at org.elasticsearch.bootstrap.Elasticsearch.init(Elasticsearch.java:136) ~[elasticsearch-6.3.0.jar:6.3.0]
```

还是看那句

```java
Caused by: java.lang.IllegalArgumentException: Plugin [analysis-jieba] was built for Elasticsearch version 6.0.0 but version 6.3.0 is running
```

版本不对，修复方法也很简单，直接把

```java
elasticsearch.version=6.0.0
```

改成

```java
elasticsearch.version=6.3.0
```

修改完成后配置文件如下

```java
# Elasticsearch plugin descriptor file
# This file must exist as 'plugin-descriptor.properties' at
# the root directory of all plugins.
#
# A plugin can be 'site', 'jvm', or both.
#
### example site plugin for "foo":
#
# foo.zip <-- zip file for the plugin, with this structure:
#   _site/ <-- the contents that will be served
#   plugin-descriptor.properties <-- example contents below:
#
# site=true
# description=My cool plugin
# version=1.0
#
### example jvm plugin for "foo"
#
# foo.zip <-- zip file for the plugin, with this structure:
#   <arbitrary name1>.jar <-- classes, resources, dependencies
#   <arbitrary nameN>.jar <-- any number of jars
#   plugin-descriptor.properties <-- example contents below:
#
# jvm=true
# classname=foo.bar.BazPlugin
# description=My cool plugin
# version=2.0.0-rc1
# elasticsearch.version=2.0
# java.version=1.7
#
### mandatory elements for all plugins:
#
# 'description': simple summary of the plugin
description=A jieba analysis of plugins for Elasticsearch
#
# 'version': plugin's version
version=6.0.0
#
# 'name': the plugin name
name=analysis-jieba
### mandatory elements for site plugins:
#
# 'site': set to true to indicate contents of the _site/
#  directory in the root of the plugin should be served.
#site=${elasticsearch.plugin.site}
#
### mandatory elements for jvm plugins :
#
# 'jvm': true if the 'classname' class should be loaded
#  from jar files in the root directory of the plugin.
#  Note that only jar files in the root directory are
#  added to the classpath for the plugin! If you need
#  other resources, package them into a resources jar.
#jvm=true
#
# 'classname': the name of the class to load, fully-qualified.
classname=org.elasticsearch.plugin.analysis.jieba.AnalysisJiebaPlugin
#
# 'java.version' version of java the code is built against
# use the system property java.specification.version
# version string must be a sequence of nonnegative decimal integers
# separated by "."'s and may have leading zeros
java.version=1.8
#
# 'elasticsearch.version' version of elasticsearch compiled against
# You will have to release a new version of the plugin for each new
# elasticsearch release. This version is checked when the plugin
# is loaded so Elasticsearch will refuse to start in the presence of
# plugins with the incorrect elasticsearch.version.
elasticsearch.version=6.3.0
#
### deprecated elements for jvm plugins :
#
# 'isolated': true if the plugin should have its own classloader.
# passing false is deprecated, and only intended to support plugins
# that have hard dependencies against each other. If this is
# not specified, then the plugin is isolated by default.
#isolated=${elasticsearch.plugin.isolated}
#
```

## 试用结巴中文分词

成功启动后，我们就可以使用 **结巴中文** 分词插件了

结巴分词插件提供 3 个分析器：jieba_index 、jieba_search 和 jieba_other

分析器
说明

jieba_index
用于索引分词，分词粒度较细；

jieba_search
用于查询分词，分词粒度较粗；

jieba_other
全角转半角、大写转小写、字符分词；

所以，我们就可以重新发起前一个章节的请求了

```java
POST http://localhost:9200/_analyze 
```

请求正文

```java
{
"analyzer" : "jieba_index",
"text" : "你好，世界，很高兴认识你！"
}
```

返回响应

```java
{
"tokens" : [
{
  "token" : "你好",
  "start_offset" : 0,
  "end_offset" : 2,
  "type" : "word",
  "position" : 0
},
{
  "token" : "，",
  "start_offset" : 2,
  "end_offset" : 3,
  "type" : "word",
  "position" : 1
},
{
  "token" : "世界",
  "start_offset" : 3,
  "end_offset" : 5,
  "type" : "word",
  "position" : 2
},
{
  "token" : "，",
  "start_offset" : 5,
  "end_offset" : 6,
  "type" : "word",
  "position" : 3
},
{
  "token" : "很",
  "start_offset" : 6,
  "end_offset" : 7,
  "type" : "word",
  "position" : 4
},
{
  "token" : "高兴",
  "start_offset" : 7,
  "end_offset" : 9,
  "type" : "word",
  "position" : 5
},
{
  "token" : "认识",
  "start_offset" : 9,
  "end_offset" : 11,
  "type" : "word",
  "position" : 6
},
{
  "token" : "你",
  "start_offset" : 11,
  "end_offset" : 12,
  "type" : "word",
  "position" : 7
},
{
  "token" : "！",
  "start_offset" : 12,
  "end_offset" : 13,
  "type" : "word",
  "position" : 8
}
]
}
```

返回的分词结果为

```java
你好  ，世界 ，很 高兴 认识 你 ！
```

至于结巴分词的具体使用我们就不做介绍了，如果你感兴趣，可以访问

**1、**[ElasticSearch自定义分析器-集成结巴分词插件](https://www.cnblogs.com/dengzhizhong/p/6373333.html)；

**2、**[https://github.com/sing1ee/elasticsearch-jieba-plugin](https://github.com/sing1ee/elasticsearch-jieba-plugin)；
