# 02、XXL-JOB 快速入门
- 来源：https://ddkk.com/zhuanlan/job/xxljob/1/2.html
- 分类：作业调度
- 分组：教程目录
## 2.1 初始化“调度数据库”

请下载项目源码并解压，获取 “调度数据库初始化SQL脚本” 并执行即可。

“调度数据库初始化SQL脚本” 位置为:

```sh
/xxl-job/doc/db/tables_xxl_job.sql 
```

调度中心支持集群部署，集群情况下各节点务必连接同一个mysql实例;

如果mysql做主从,调度中心集群节点务必强制走主库;

## 2.2 编译源码

解压源码,按照maven格式将源码导入IDE, 使用maven进行编译即可，源码结构如下：

```sh
xxl-job-admin：调度中心 
xxl-job-core：公共依赖 
xxl-job-executor-samples：执行器Sample示例（选择合适的版本执行器，可直接使用，也可以参考其并将现有项目改造成执行器） 
 ：xxl-job-executor-sample-springboot：Springboot版本，通过Springboot管理执行器，推荐这种方式； 
 ：xxl-job-executor-sample-frameless：无框架版本； 
```

## 2.3 配置部署“调度中心”

```sh
调度中心项目：xxl-job-admin 
作用：统一管理任务调度平台上调度任务，负责触发调度执行，并且提供任务管理平台。 
```

## 步骤一：调度中心配置：

调度中心配置文件地址：

```sh
/xxl-job/xxl-job-admin/src/main/resources/application.properties 
```

调度中心配置内容说明：

```sh
调度中心JDBC链接：链接地址请保持和 2.1章节 所创建的调度数据库的地址一致 
spring.datasource.url=jdbc:mysql://127.0.0.1:3306/xxl_job?useUnicode=true&characterEncoding=UTF-8&autoReconnect=true&serverTimezone=Asia/Shanghai 
spring.datasource.username=root 
spring.datasource.password=root_pwd 
spring.datasource.driver-class-name=com.mysql.jdbc.Driver 
报警邮箱 
spring.mail.host=smtp.qq.com 
spring.mail.port=25 
spring.mail.username=xxx@qq.com 
spring.mail.password=xxx 
spring.mail.properties.mail.smtp.auth=true 
spring.mail.properties.mail.smtp.starttls.enable=true 
spring.mail.properties.mail.smtp.starttls.required=true 
spring.mail.properties.mail.smtp.socketFactory.class=javax.net.ssl.SSLSocketFactory 
调度中心通讯TOKEN [选填]：非空时启用； 
xxl.job.accessToken= 
调度中心国际化配置 [必填]： 默认为 "zh_CN"/中文简体, 可选范围为 "zh_CN"/中文简体, "zh_TC"/中文繁体 and "en"/英文； 
xxl.job.i18n=zh_CN 
调度线程池最大线程配置【必填】 
xxl.job.triggerpool.fast.max=200 
xxl.job.triggerpool.slow.max=100 
调度中心日志表数据保存天数 [必填]：过期日志自动清理；限制大于等于7时生效，否则, 如-1，关闭自动清理功能； 
xxl.job.logretentiondays=30 
```

## 步骤二：部署项目：

如果已经正确进行上述配置，可将项目编译打包部署。

调度中心访问地址：[http://localhost:8080/xxl-job-admin](http://localhost:8080/xxl-job-admin) (该地址执行器将会使用到，作为回调地址)

默认登录账号 “admin/123456”, 登录后运行界面如下图所示。

至此“调度中心”项目已经部署成功。

## 步骤三：调度中心集群（可选）：

调度中心支持集群部署，提升调度系统容灾和可用性。

调度中心集群部署时，几点要求和建议：

- DB配置保持一致；
- 集群机器时钟保持一致（单机集群忽视）；
- 建议：推荐通过nginx为调度中心集群做负载均衡，分配域名。调度中心访问、执行器回调配置、调用API服务等操作均通过该域名进行。

## 其他：Docker 镜像方式搭建调度中心：

- 下载镜像

```sh
 // Docker地址：https://hub.docker.com/r/xuxueli/xxl-job-admin/     (建议指定版本号) 
 docker pull xuxueli/xxl-job-admin 
```

- 创建容器并运行

```sh
 docker run -p 8080:8080 -v /tmp:/data/applogs --name xxl-job-admin  -d xuxueli/xxl-job-admin:{指定版本} 
 /** 
 * 如需自定义 mysql 等配置，可通过 "-e PARAMS" 指定，参数格式 PARAMS="--key=value  --key2=value2" ； 
 * 配置项参考文件：/xxl-job/xxl-job-admin/src/main/resources/application.properties 
 * 如需自定义 JVM内存参数 等配置，可通过 "-e JAVA_OPTS" 指定，参数格式 JAVA_OPTS="-Xmx512m" ； 
 */ 
 docker run -e PARAMS="--spring.datasource.url=jdbc:mysql://127.0.0.1:3306/xxl_job?useUnicode=true&characterEncoding=UTF-8&autoReconnect=true&serverTimezone=Asia/Shanghai" -p 8080:8080 -v /tmp:/data/applogs --name xxl-job-admin  -d xuxueli/xxl-job-admin:{指定版本} 
```

## 2.4 配置部署“执行器项目”

```sh
 “执行器”项目：xxl-job-executor-sample-springboot (提供多种版本执行器供选择，现以 springboot 版本为例，可直接使用，也可以参考其并将现有项目改造成执行器) 
 作用：负责接收“调度中心”的调度并执行；可直接部署执行器，也可以将执行器集成到现有业务项目中。 
```

## 步骤一：maven依赖

确认pom文件中引入了 “xxl-job-core” 的maven依赖；

## 步骤二：执行器配置

执行器配置，配置文件地址：

```sh
     /xxl-job/xxl-job-executor-samples/xxl-job-executor-sample-springboot/src/main/resources/application.properties 
```

执行器配置，配置内容说明：

```sh
调度中心部署根地址 [选填]：如调度中心集群部署存在多个地址则用逗号分隔。执行器将会使用该地址进行"执行器心跳注册"和"任务结果回调"；为空则关闭自动注册； 
xxl.job.admin.addresses=http://127.0.0.1:8080/xxl-job-admin 
执行器通讯TOKEN [选填]：非空时启用； 
xxl.job.accessToken= 
执行器AppName [选填]：执行器心跳注册分组依据；为空则关闭自动注册 
xxl.job.executor.appname=xxl-job-executor-sample 
执行器注册 [选填]：优先使用该配置作为注册地址，为空时使用内嵌服务 ”IP:PORT“ 作为注册地址。从而更灵活的支持容器类型执行器动态IP和动态映射端口问题。 
xxl.job.executor.address= 
执行器IP [选填]：默认为空表示自动获取IP，多网卡时可手动设置指定IP，该IP不会绑定Host仅作为通讯实用；地址信息用于 "执行器注册" 和 "调度中心请求并触发任务"； 
xxl.job.executor.ip= 
执行器端口号 [选填]：小于等于0则自动获取；默认端口为9999，单机部署多个执行器时，注意要配置不同执行器端口； 
xxl.job.executor.port=9999 
执行器运行日志文件存储磁盘路径 [选填] ：需要对该路径拥有读写权限；为空则使用默认路径； 
xxl.job.executor.logpath=/data/applogs/xxl-job/jobhandler 
执行器日志文件保存天数 [选填] ： 过期日志自动清理, 限制值大于等于3时生效; 否则, 如-1, 关闭自动清理功能； 
xxl.job.executor.logretentiondays=30 
```

## 步骤三：执行器组件配置

执行器组件，配置文件地址：

```sh
 /xxl-job/xxl-job-executor-samples/xxl-job-executor-sample-springboot/src/main/java/com/xxl/job/executor/core/config/XxlJobConfig.java 
```

执行器组件，配置内容说明：

```sh
@Bean 
public XxlJobSpringExecutor xxlJobExecutor() { 
 logger.info(">>>>>>>>>>> xxl-job config init."); 
 XxlJobSpringExecutor xxlJobSpringExecutor = new XxlJobSpringExecutor(); 
 xxlJobSpringExecutor.setAdminAddresses(adminAddresses); 
 xxlJobSpringExecutor.setAppname(appname); 
 xxlJobSpringExecutor.setIp(ip); 
 xxlJobSpringExecutor.setPort(port); 
 xxlJobSpringExecutor.setAccessToken(accessToken); 
 xxlJobSpringExecutor.setLogPath(logPath); 
 xxlJobSpringExecutor.setLogRetentionDays(logRetentionDays); 
 return xxlJobSpringExecutor; 
} 
```

## 步骤四：部署执行器项目：

如果已经正确进行上述配置，可将执行器项目编译打部署，系统提供多种执行器Sample示例项目，选择其中一个即可，各自的部署方式如下。

```sh
 xxl-job-executor-sample-springboot：项目编译打包成springboot类型的可执行JAR包，命令启动即可； 
 xxl-job-executor-sample-frameless：项目编译打包成JAR包，命令启动即可； 
```

至此“执行器”项目已经部署结束。

## 步骤五：执行器集群（可选）：

执行器支持集群部署，提升调度系统可用性，同时提升任务处理能力。

执行器集群部署时，几点要求和建议：

- 执行器回调地址（xxl.job.admin.addresses）需要保持一致；执行器根据该配置进行执行器自动注册等操作。
- 同一个执行器集群内AppName（xxl.job.executor.appname）需要保持一致；调度中心根据该配置动态发现不同集群的在线执行器列表。

## 2.5 开发第一个任务“Hello World”

本示例以新建一个 “GLUE模式(Java)” 运行模式的任务为例。更多有关任务的详细配置，请查看“章节三：任务详解”。

（“GLUE模式(Java)”的执行代码托管到调度中心在线维护，相比“Bean模式任务”需要在执行器项目开发部署上线，更加简便轻量）

> 前提：请确认“调度中心”和“执行器”项目已经成功部署并启动；

## 步骤一：新建任务：

登录调度中心，点击下图所示“新建任务”按钮，新建示例任务。然后，参考下面截图中任务的参数配置，点击保存。

## 步骤二：“GLUE模式(Java)” 任务开发：

请点击任务右侧 “GLUE” 按钮，进入 “GLUE编辑器开发界面” ，见下图。“GLUE模式(Java)” 运行模式的任务默认已经初始化了示例任务代码，即打印Hello World。

（“GLUE模式(Java)” 运行模式的任务实际上是一段继承自IJobHandler的Java类代码，它在执行器项目中运行，可使用[@Resource](https://github.com/Resource)/[@Autowire](https://github.com/Autowire)注入执行器里中的其他服务，详细介绍请查看第三章节）

## 步骤三：触发执行：

请点击任务右侧 “执行” 按钮，可手动触发一次任务执行（通常情况下，通过配置Cron表达式进行任务调度触发）。

## 步骤四：查看日志：

请点击任务右侧 “日志” 按钮，可前往任务日志界面查看任务日志。

在任务日志界面中，可查看该任务的历史调度记录以及每一次调度的任务调度信息、执行参数和执行信息。运行中的任务点击右侧的“执行日志”按钮，可进入日志控制台查看实时执行日志。

在日志控制台，可以Rolling方式实时查看任务在执行器一侧运行输出的日志信息，实时监控任务进度；
