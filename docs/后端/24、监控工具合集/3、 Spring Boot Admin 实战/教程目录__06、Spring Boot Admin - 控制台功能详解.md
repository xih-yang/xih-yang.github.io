# 06、Spring Boot Admin - 控制台功能详解
- 来源：https://ddkk.com/zhuanlan/monitoring/springbootadmin/6.html
- 分类：监控工具
- 分组：教程目录
## 应用墙

此页面主要显示当前监控的所有应用，绿色代表健康状态，应用掉线后，会变为灰色。

## 应用

此页面以列表形式显示所有监控应用，包含应用数、实例数、实例状态、搜索框、应用列表、在线时间、应用名、应用地址、应用状态等信息。

### 应用-细节

**最上位置**：显示应用名、分配ID、访问地址等

**信息**：显示应用信息，通过build-info.properties等文件构建

**元数据**：因为当前使用的是nacos，所以会显示nacos元数据信息

**健康**：主要显示一些健康状态信息，包含自定义、服务发现、硬盘空间等，可通过AbstractHealthIndicator自定义相关信息。

**进程/垃圾回收/线程**：主要显示进程ID、运行时间、CPU、线程、垃圾回收等信息。

**内存**：是要显示堆(Heap)和非堆(Non-heap)内存使用情况。

### 应用-性能

这里其实应该叫监控指标，可以通过添加指标来检测相关信息，比如：监控一下GC某个指标，按图操作就可以在页面显示相关监控信息

### 应用-环境

环境配置信息：

- server.ports： 服务端口
- servletContextInitParams： Servlet初始化参数
- systemProperties： 当前应用系统属性
- systemEnvironment： 系统环境变量
- springCloudClientHostInfo： spring cloud客户端主机信息
- applicationConfig: [classpath:/application.properties]：配置文件application.properties
- applicationConfig: [classpath:/application.yml]：配置文件application.yml
- springCloudDefaultProperties：spring cloud默认属性

### 应用-类

服务的所有bean信息及作用域

### 应用-配置属性

spring自动装配加载的配置信息

### 应用-计划任务

当前项目中 @Scheduled配置的定时任务详情

### 应用-日志配置

当前项目配置的日志级别信息

### 应用-JVM

**线程转储**：查看线程的详细信息，支持下载，W活动线程，R守护线程

**内存转储**：java堆内存文件的生成。Java进程所使用的内存情况在某一时间的一次快照。以文件的形式持久化到磁盘中。

### 应用-映射

当前项目中所有的web接口映射、 过滤器等信息

### 应用-缓存

缓存信息

## 日志报表

当前应用一些上线、离线等事件日志

## 其他

开发者信息/当前用户/语言切换等基础功能
