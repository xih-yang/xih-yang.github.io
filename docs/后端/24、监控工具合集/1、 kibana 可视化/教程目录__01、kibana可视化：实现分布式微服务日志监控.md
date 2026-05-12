# 01、kibana可视化：实现分布式微服务日志监控
- 来源：https://ddkk.com/zhuanlan/monitoring/kibana/1.html
- 分类：监控工具
- 分组：教程目录
## 1、目标

本次我们搭建的目标是通过ELK来收集微服务中的日志。本期主要以实操、快速搭建为主进行讲解，部分基础概念不做过多描述，后续会再单独出几期博客说明。更多ELK搭建可以关注本专栏，后续会持续输出。

## 2、思路

首先我们要部署的架构如下图所示，需要收集两个微服务的日志，并且最终在kibana中可视化呈现出来。

可以看出日志的传输路线是：微服务产生日志，并将日志数据保存到磁盘中的.log文件中，filebeat监听log文件，将其数据收集并结构化后传输到logstash上，logstash将日志进行过滤收集，再传输到elasticsearch上，elasticsearch把日志作为索引进行存储并且构造对应倒排索引，kibana可视化呈现日志，需要查询时kibana调用elasticsearch进行日志数据的查询

在微服务节点上，我们通过更加轻量级的filebeat来收集日志，然后将日志传输给logstash

当然可以直接将日志传输给ES，那么这里为什么还要在中间加一层logstash呢？

（1）当需要收集的节点较多时，传输的log量和次数就会大量增加，如果filebeat直接传输给es，就会占用掉es的大量资源。应该让es专注与数据查询和处理。让数据发给logstash，以此作一层缓冲。

（2）logstash有多种过滤器可以使用，通过logstash做一些过滤，过滤掉无效的日志

## 3、下载

环境采用jdk1.8，es7.13.0，kibana7.13.0，filebeat7.13.0

需要注意的是下载es,kibana,beats需要保持版本一致

### 3.1 filebeat下载

[https://www.elastic.co/cn/downloads/past-releases/filebeat-7-13-0](https://www.elastic.co/cn/downloads/past-releases/filebeat-7-13-0)

选择linux64位版本

其他beats下载

[https://www.elastic.co/cn/downloads/beats/](https://www.elastic.co/cn/downloads/beats/)

### 3.2 elasticsearch下载

[https://www.elastic.co/cn/downloads/past-releases/elasticsearch-7-13-0](https://www.elastic.co/cn/downloads/past-releases/elasticsearch-7-13-0)

### 3.3 kibana下载

[https://www.elastic.co/cn/downloads/past-releases/kibana-7-13-0](https://www.elastic.co/cn/downloads/past-releases/kibana-7-13-0)

### 3.4 环境

服务器
服务

172.16.188.7
elasticsearch

172.16.188.13
kibana

172.16.188.6
logstash

172.16.188.2
filebeat + 微服务1

172.16.188.3
filebeat + 微服务2

## 4、部署ELK

### 4.1 部署微服务

如果你是在已经部署好的微服务上部署ELK，请跳过本节。

首先的我创建了两个微服务user,order

源码地址：[https://gitee.com/wuhanxue/elk-test](https://gitee.com/wuhanxue/elk-test)

**1、** 每个微服务都只有一个controller，其方法就是把参数作为日志内容输出到日志文件中；

在error方法中设置一个1/0，产生一个错误日志

我这里为了mac本地测试方便使用的日志路径是`/Users/wuhanxue/Downloads`

```sh
## 应用名称
spring.application.name=order-service
## 应用服务 WEB 访问端口
server.port=8080
logging.file.path=/Users/wuhanxue/Downloads 
```

**2、** mavenpackage打包两个服务，并且分别上传到两个服务器节点上（提前安装好jdk环境）；

**3、** 启动两个微服务；

```sh
java -jar user-service-0.0.1-SNAPSHOT.jar
java -jar order-service-0.0.1-SNAPSHOT.jar
```

### 4.2 部署elasticsearch

如果知道如何部署elasticsearch的可以跳过本节

**1、** 将安装文件传输到服务器上；

**2、** 解压es文件；

```sh
tar -zxvf elasticsearch-7.13.0-linux-x86_64.tar.gz 
```

**3、** 修改配置文件；

```sh
## 集群名称
cluster.name: cluster1
## 初始主节点
cluster.initial_master_nodes: ["node-1"]
## 节点名
node.name: node-1
## 是否可选为主节点
node.roles: [master,data,remote_cluster_client]
## data文件夹，提前创建好
path.data: /var/local/elasticsearch_data
## 日志文件夹，提前创建好
path.logs: /var/local/elasticsearch_logs
## 对方暴露的ip地址
network.host: 172.16.188.7
## 允许跨域访问，head访问时需要开启
http.cors.enabled: true
http.cors.allow-origin: "*"
```

**4、** 因为es不允许以root账号启动，所以需要提前创建一个其他账号，我这里已经创建了elastic用户；

**5、** 将es安装目录权限赋给elastic账号；

```sh
chown  -R elastic:elastic elasticsearch-7.13.0
```

**6、** 以elastic账户启动；

```sh
## es安装目录下执行
./bin/elasticsearch
```

#### 4.2.1 内存过小问题

自己测试的时候，可能会因为服务器内存过小而导致启动报错，这个时候需要修改两个东西

**1、** 增加最大用户打开文件数；

```sh
##  root执行指令
vim /etc/security/limits.conf
## 文件最后添加
## * 表示所有用户， 
* soft nproc 65536
* hard nproc 65536
* soft nofile 65536
* hard nofile 65536
root soft nproc 65536
root hard nproc 65536
root soft nofile 65536
root hard nofile 65536
## 保存后重启
reboot
## 查看当前值
ulimit -Hn
```

**2、** 增加vm.max_map_count；

```sh
vim /etc/sysctl.conf
## 最后添加
vm.max_map_count=655360
## 查看
sysctl -p
```

#### 4.2.2 端口开放问题

需要打开9200，9300端口

```sh
## 查看指定端口是否已经开放
firewall-cmd --query-port=9200/tcp
firewall-cmd --query-port=9300/tcp
## 开放指定端口
firewall-cmd --add-port=9200/tcp --permanent
firewall-cmd --add-port=9300/tcp --permanent
## 重新载入添加的端口
firewall-cmd --reload
```

#### 4.2.3 测试

访问http://ip:9200/，出现以下页面则成功

### 4.3 部署kibana

如果知道如何部署kibana的可以跳过本节

**1、** 上传安装包到服务器；

**2、** 解压安装包；

```sh
tar -zxvf kibana-7.13.0-linux-x86_64.tar.gz
```

**3、** 修改配置文件；

```sh
vim config/kibana.yml
```

内容如下

```sh
## 默认端口为5601，我这里因为开启了两个所以修改为了5602
server.port: 5602
server.name: kibana2
server.host: "0"
elasticsearch.hosts: [ "http://172.16.188.7:9200"]
xpack.monitoring.ui.container.elasticsearch.enabled: true
```

**4、** 同样kibana也是不允许用root账号启动了，创建一个elastic账号，并且将kibana安装目录的权限赋给他；

```sh
chown  -R elastic:elastic kibana-7.13.0
```

**5、** 开通5602端口；

```sh
firewall-cmd --add-port=5602/tcp --permanent 
## 重新载入添加的端口
firewall-cmd --reload
```

**6、** 以elastic账户，启动kibana；

```sh
./bin/kibana
```

**7、** 测试，访问ip:5602，出现以下页面则部署成功；

## 4.4 部署logstash

**0、** logstash依赖与java环境，且elastic支持的jdk版本为jdk8,11,14之一提前安装好java环境我这里选择了jdk8（但实际上es官方在7.13版本中更加推荐的是jdk11+）；

需要注意的是logstash7.13.0已自带jdk，在安装目录下的jdk目录，所以如果服务器没有单独安装jdk的话，会采用logstash下的jdk

**1、** 将logstash安装包上传到服务器，这里使用scp的方式进行传输；

```sh
scp logstash-7.13.0-linux-x86_64.tar.gz root@172.16.188.6/var/local
```

**2、** 解压安装包；

```sh
tar -zxvf logstash-7.13.0-linux-x86_64.tar.gz
```

**3、** 修改配置文件，logstash提供了一个实例配置文件logstash-sample.conf，我们直接在它的基础上进行修改；

```sh
## beats传入的端口，默认5044
input {
  beats {
    port => 5044
  }
}
## 输出日志的方式
output { 
## 按照日志标签对日志进行分类处理，日志标签后续会在filebeat中定义
 if "user-log" in [tags] {
    elasticsearch {
      hosts => ["http://172.16.188.7:9200"]
      index => "[user-log]-%{+YYYY.MM.dd}"
    }
 }
 if "order-log" in [tags] {
    elasticsearch {
      hosts => ["http://172.16.188.7:9200"]
      index => "[order-log]-%{+YYYY.MM.dd}"
    }
 }
}
```

**4、** 开放5044端口；

```sh
firewall-cmd --add-port=5044/tcp --permanent 
## 重新载入添加的端口
firewall-cmd --reload
```

**5、** 以上述配置文件启动logstash，logstash启动较慢，在等待它启动的时候，我们可以去部署filebeat了；

```sh
./bin/logstash -f config/logstash-sample.conf
```

## 4.5 部署filebeat

**1、** 将filebeat传输到两个微服务所在的服务器上，这里采用scp的方式进行传输；

```sh
scp filebeat-7.13.0-linux-x86_64.tar.gz root@172.16.188.3:/var/local
scp filebeat-7.13.0-linux-x86_64.tar.gz root@172.16.188.2:/var/local
```

**2、** 在/var/local目录下解压filebeat；

```sh
tar -zxvf filebeat-7.13.0-linux-x86_64.tar.gz
```

**3、** 进入filebeat安装目录后，修改filebeat配置文件；

```sh
vim filebeat.yml
## 如果没有安装vim可执行如下指令安装
yum install vim
```

内容如下：

```sh
## 从日志文件输入日志
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /Users/wuhanxue/Downloads/*.log
  定义日志标签，注意当order服务时将该标签改为order-log
  tags: ["user-log"]
setup.template.settings:
## 设置主分片数
  index.number_of_shards: 1
## 因为测试环境只有一个es节点，所以将副本分片设置为0，否则集群会报黄
  index.number_of_replicas: 0
## 输出到logstash
output.logstash:
## logstash所在服务器的ip和端口
  hosts: ["172.16.188.6:5044"]
## 默认配置，不做改动
processors:
  - add_host_metadata:
      when.not.contains.tags: forwarded
  - add_cloud_metadata: ~
  - add_docker_metadata: ~
  - add_kubernetes_metadata: ~
```

**4、** 启动filebeat；

```sh
 ./filebeat -e -c filebeat.yml
```

**5、** 另一个微服务上也做同样配置；

**6、** 重启微服务，将启动日志，输入到beats中；

**7、** 调用接口，创建几条日志；

user-service

```sh
http://172.16.188.2:8081/user/info?log=use
http://172.16.188.2:8081/user/error?log=use
```

order-service

```sh
http://172.16.188.3:8080/order/info?log=orde
http://172.16.188.3:8080/order/error?log=orde
```

### 4.6 kibana可视化

#### 4.6.1 操作步骤

在kibana中dev tool输入指令

```sh
GET _cat/indices
```

结果，可以看到日志索引已经创建成功了，接下来我们来实现可视化

**1、** 打开kibana，进入stackmanagement>indexmanagement；

这里会发现新创建的日志索引状态时黄的，这是因为副本分片数设置为1了，之前在filebeat中的设置并没有成功，这里原因未知，后续研究后更新上来。

我们可以通过修改索引的副本分片数来使索引状态更新为绿色：点击索引，在弹出框中点击edit settings，修改number_of_replicas为0，点击save。当然也可以直接通过DSL指令修改

**2、** 点击Indexpatterns,点击创建索引模式；

输出order-log的正则匹配

```sh
[order-log]-*
```

选择一个时间字段，如果日志数据中本身没有，可以使用@timestamp

同理创建user-log的索引模式

**3、** 索引可视化；

点击左侧菜单栏中的Discover

点击左侧的索引下拉列表，选择需要查询的索引模式，在时间框中输入日期范围，点击刷新，会看到列表中日志数据已经查询出来了

**4、** 定制列表字段；

上述图片中可以看到，列表中的字段是直接显示的整个doc，如果我们想要分栏显示某部分字段怎么办呢？

可以在available fields中添加想要显示的字段

添加后

**5、** 查询日志；

如果不指定字段，那么查询针对所有的字段，为了提高查询效率，可以指定字段

`:`

#### 4.6.2 同一条日志被处理成了多条

观察日志我们可以发现，本来属于同一条错误日志的数据，被分割成了多条doc，这时因为filebeat是按照换行符进行分割的，而某些报错日志本身就包含换行符，为了让这样的日志归并到一个doc，我们需要通过multiline参数来帮忙

**1、** multiline的原理就是通过某串字符来区分是同一条日志，比如如下的日志格式，每条日志都是以`[`开头的，所以可以以`[`来区分；

```sh
[2021-01-03 23:00:00] INFO order create
[2021-01-03 23:00:00] IndexNotFoundException[no such index]
    at org.elasticsearch.cluster.metadata.IndexNameExpressionResolver$WildcardExpressionResolver.resolve(IndexNameExpressionResolver.java:566)
    at org.elasticsearch.cluster.metadata.IndexNameExpressionResolver.concreteIndices(IndexNameExpressionResolver.java:133)
    at org.elasticsearch.cluster.metadata.IndexNameExpressionResolver.concreteIndices(IndexNameExpressionResolver.java:77)
    at org.elasticsearch.action.admin.indices.delete.TransportDeleteIndexAction.checkBlock(TransportDeleteIndexAction.java:75)
```

[详情可见multiline官方文档](https://www.elastic.co/guide/en/beats/filebeat/7.13/multiline-examples.html)

**2、** 按照上述的原理，我们观察日志的格式，思考可以同一条日志有什么格式规律；

当然这里因为我们处理的是微服务的日志，我们可以直接在服务中定义方便我们处理的日志格式，但是不排除有些场景无法自定义日志格式，因此我们观察下图中日志的格式

**3、** 容易观察到每条日志都是日期开头的，实际查看官方文档中，就有关于日期的正则表达，在filebeat的配置文件中添加如下配置；

```sh
multiline.type: pattern
multiline.pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
multiline.negate: true
multiline.match: after
```

注意这里的配置需要添加在filebeat.inputs下

```sh
## 从日志文件输入日志
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /Users/wuhanxue/Downloads/*.log
  tags: ["user-log"]
  exclude_lines: ['^$']
  multiline:
    type: pattern
    pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
    negate: true
    match: after
setup.template.settings:
## 设置主分片数
  index.number_of_shards: 1
## 因为测试环境只有一个es节点，所以将副本分片设置为0，否则集群会报黄
  index.number_of_replicas: 0
## 输出到logstash
output.logstash:
## logstash所在服务器的ip和端口
  hosts: ["172.16.188.6:5044"]
```

另外如果有空行的话，可以添加如下配置排除空行

```sh
filebeat.inputs:
- type: log
  exclude_lines: ['^$']
```

再次查看kibana会发现多行日志已经归并为一条了

#### 4.6.3 测试正则是否正确

我们在实际生产中书写完多行匹配的正则表达式，可能需要测试一下是否能够匹配得到，如果每次都需要启动filebeat来测试的话，难免有些麻烦，关于这点官方文档中也提供了一个网址用来测试

[https://go.dev/play/](https://go.dev/play/)

测试代码，供大家参考

```sh
// You can edit this code!
// Click here and start typing.
package main
import (
	"fmt"
	"regexp"
	"strings"
)
var pattern = ^[0-9]{4}-[0-9]{2}-[0-9]{2}
var negate = false
var content = 2022-01-05 00:24:07.705 ERROR 1695 --- [nio-8081-exec-5] o.a.c.c.C.[.[.[/].[dispatcherServlet]    : Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception [Request processing failed; nested exception is java.lang.ArithmeticException: / by zero] with root cause
java.lang.ArithmeticException: / by zero
	at com.example.userservice.controller.UserController.errorLog(UserController.java:27) ~[classes!/:na]
	at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method) ~[na:1.8.0_271]
	at sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62) ~[na:1.8.0_271]
	at sun.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43) ~[na:1.8.0_271]
	at java.lang.reflect.Method.invoke(Method.java:498) ~[na:1.8.0_271]
	at org.springframework.web.method.support.InvocableHandlerMethod.doInvoke(InvocableHandlerMethod.java:190) ~[spring-web-5.2.12.RELEASE.jar!/:5.2.12.RELEASE]
	at org.springframework.web.method.support.InvocableHandlerMethod.invokeForRequest(InvocableHandlerMethod.java:138) ~[spring-web-5.2.12.RELEASE.jar!/:5.2.12.RELEASE]
	at org.springframework.web.servlet.mvc.method.annotation.ServletInvocableHandlerMethod.invokeAndHandle(ServletInvocableHandlerMethod.java:105) ~[spring-webmvc-5.2.12.RELEASE.jar!/:5.2.12.RELEASE]
	at org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter.invokeHandlerMethod(RequestMappingHandlerAdapter.java:878) ~[spring-webmvc-5.2.12.RELEASE.jar!/:5.2.12.RELEASE]
	at org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter.handleInternal(RequestMappingHandlerAdapter.java:792) ~[spring-webmvc-5.2.12.RELEASE.jar!/:5.2.12.RELEASE]
	at org.springframework.web.servlet.mvc.method.AbstractHandlerMethodAdapter.handle(AbstractHandlerMethodAdapter.java:87) ~[spring-webmvc-5.2.12.RELEASE.jar!/:5.2.12.RELEASE]
	at org.springframework.web.servlet.DispatcherServlet.doDispatch(DispatcherServlet.java:1040) ~[spring-webmvc-5.2.12.RELEASE.jar!/:5.2.12.RELEASE]
	at org.springframework.web.servlet.DispatcherServlet.doService(DispatcherServlet.java:943) ~[spring-webmvc-5.2.12.RELEASE.jar!/:5.2.12.RELEASE]
	at org.springframework.web.servlet.FrameworkServlet.processRequest(FrameworkServlet.java:1006) ~[spring-webmvc-5.2.12.RELEASE.jar!/:5.2.12.RELEASE]
	at org.springframework.web.servlet.FrameworkServlet.doGet(FrameworkServlet.java:898) ~[spring-webmvc-5.2.12.RELEASE.jar!/:5.2.12.RELEASE]
	at javax.servlet.http.HttpServlet.service(HttpServlet.java:626) ~[tomcat-embed-core-9.0.41.jar!/:4.0.FR]
	at org.springframework.web.servlet.FrameworkServlet.service(FrameworkServlet.java:883) ~[spring-webmvc-5.2.12.RELEASE.jar!/:5.2.12.RELEASE]
	at javax.servlet.http.HttpServlet.service(HttpServlet.java:733) ~[tomcat-embed-core-9.0.41.jar!/:4.0.FR]
	at org.apache.catalina.core.ApplicationFilterChain.internalDoFilter(ApplicationFilterChain.java:231) ~[tomcat-embed-core-9.0.41.jar!/:9.0.41]
	at org.apache.catalina.core.ApplicationFilterChain.doFilter(ApplicationFilterChain.java:166) ~[tomcat-embed-core-9.0.41.jar!/:9.0.41]
	at org.apache.tomcat.websocket.server.WsFilter.doFilter(WsFilter.java:53) ~[tomcat-embed-websocket-9.0.41.jar!/:9.0.41]
	at org.apache.catalina.core.ApplicationFilterChain.internalDoFilter(ApplicationFilterChain.java:193) ~[tomcat-embed-core-9.0.41.jar!/:9.0.41]
	at org.apache.catalina.core.ApplicationFilterChain.doFilter(ApplicationFilterChain.java:166) ~[tomcat-embed-core-9.0.41.jar!/:9.0.41]
	at org.springframework.web.filter.RequestContextFilter.doFilterInternal(RequestContextFilter.java:100) ~[spring-web-5.2.12.RELEASE.jar!/:5.2.12.RELEASE]
	at org.springframework.web.filter.OncePerRequestFilter.doFilter(OncePerRequestFilter.java:119) ~[spring-web-5.2.12.RELEASE.jar!/:5.2.12.RELEASE]
	at org.apache.catalina.core.ApplicationFilterChain.internalDoFilter(ApplicationFilterChain.java:193) ~[tomcat-embed-core-9.0.41.jar!/:9.0.41]
	at org.apache.catalina.core.ApplicationFilterChain.doFilter(ApplicationFilterChain.java:166) ~[tomcat-embed-core-9.0.41.jar!/:9.0.41]
	at org.springframework.web.filter.FormContentFilter.doFilterInternal(FormContentFilter.java:93) ~[spring-web-5.2.12.RELEASE.jar!/:5.2.12.RELEASE]
	at org.springframework.web.filter.OncePerRequestFilter.doFilter(OncePerRequestFilter.java:119) ~[spring-web-5.2.12.RELEASE.jar!/:5.2.12.RELEASE]
	at org.apache.catalina.core.ApplicationFilterChain.internalDoFilter(ApplicationFilterChain.java:193) ~[tomcat-embed-core-9.0.41.jar!/:9.0.41]
	at org.apache.catalina.core.ApplicationFilterChain.doFilter(ApplicationFilterChain.java:166) ~[tomcat-embed-core-9.0.41.jar!/:9.0.41]
	at org.springframework.web.filter.CharacterEncodingFilter.doFilterInternal(CharacterEncodingFilter.java:201) ~[spring-web-5.2.12.RELEASE.jar!/:5.2.12.RELEASE]
	at org.springframework.web.filter.OncePerRequestFilter.doFilter(OncePerRequestFilter.java:119) ~[spring-web-5.2.12.RELEASE.jar!/:5.2.12.RELEASE]
	at org.apache.catalina.core.ApplicationFilterChain.internalDoFilter(ApplicationFilterChain.java:193) ~[tomcat-embed-core-9.0.41.jar!/:9.0.41]
	at org.apache.catalina.core.ApplicationFilterChain.doFilter(ApplicationFilterChain.java:166) ~[tomcat-embed-core-9.0.41.jar!/:9.0.41]
	at org.apache.catalina.core.StandardWrapperValve.invoke(StandardWrapperValve.java:202) ~[tomcat-embed-core-9.0.41.jar!/:9.0.41]
	at org.apache.catalina.core.StandardContextValve.invoke(StandardContextValve.java:97) [tomcat-embed-core-9.0.41.jar!/:9.0.41]
	at org.apache.catalina.authenticator.AuthenticatorBase.invoke(AuthenticatorBase.java:542) [tomcat-embed-core-9.0.41.jar!/:9.0.41]
	at org.apache.catalina.core.StandardHostValve.invoke(StandardHostValve.java:143) [tomcat-embed-core-9.0.41.jar!/:9.0.41]
	at org.apache.catalina.valves.ErrorReportValve.invoke(ErrorReportValve.java:92) [tomcat-embed-core-9.0.41.jar!/:9.0.41]
	at org.apache.catalina.core.StandardEngineValve.invoke(StandardEngineValve.java:78) [tomcat-embed-core-9.0.41.jar!/:9.0.41]
	at org.apache.catalina.connector.CoyoteAdapter.service(CoyoteAdapter.java:343) [tomcat-embed-core-9.0.41.jar!/:9.0.41]
	at org.apache.coyote.http11.Http11Processor.service(Http11Processor.java:374) [tomcat-embed-core-9.0.41.jar!/:9.0.41]
	at org.apache.coyote.AbstractProcessorLight.process(AbstractProcessorLight.java:65) [tomcat-embed-core-9.0.41.jar!/:9.0.41]
	at org.apache.coyote.AbstractProtocol$ConnectionHandler.process(AbstractProtocol.java:888) [tomcat-embed-core-9.0.41.jar!/:9.0.41]
	at org.apache.tomcat.util.net.NioEndpoint$SocketProcessor.doRun(NioEndpoint.java:1597) [tomcat-embed-core-9.0.41.jar!/:9.0.41]
	at org.apache.tomcat.util.net.SocketProcessorBase.run(SocketProcessorBase.java:49) [tomcat-embed-core-9.0.41.jar!/:9.0.41]
	at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1149) [na:1.8.0_271]
	at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:624) [na:1.8.0_271]
	at org.apache.tomcat.util.threads.TaskThread$WrappingRunnable.run(TaskThread.java:61) [tomcat-embed-core-9.0.41.jar!/:9.0.41]
	at java.lang.Thread.run(Thread.java:748) [na:1.8.0_271]
func main() {
	regex, err := regexp.Compile(pattern)
	if err != nil {
		fmt.Println("fail to compile: ", err)
		return
	}
	//lines := strings.Split(content, "\n")
	lines := strings.Split(content, "|||")
	for _, line := range lines {
		fmt.Println("line: ", line)
		matches := regex.MatchString(line)
		if negate {
			matches = !matches
		}
		fmt.Printf("%v\t%v\n", matches, line)
	}
}
```
