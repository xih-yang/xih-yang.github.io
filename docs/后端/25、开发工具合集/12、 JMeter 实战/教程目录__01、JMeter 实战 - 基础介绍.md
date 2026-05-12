# 01、JMeter 实战 - 基础介绍
- 来源：https://ddkk.com/zhuanlan/tools/jmeter/2/1.html
- 分类：开发工具
- 分组：教程目录
jmeter是一款优秀的开源性能测试工具，目前最新版本5.4.1版本，官网文档地址：[http://jmeter.apache.org/usermanual/index.html](http://jmeter.apache.org/usermanual/index.html)

## 一、优点

**1、** 开源工具，可扩展性非常好；

**2、** 高可扩展性，用户可自定义调试相关模块代码；

**3、** 精心简单的GUI设计，小巧灵活；

**4、** 完全的可移植性和100％纯java；

**5、** 完全swing和轻量组件支持（预编译的HAR使用javax.swing.*）包；

**6、** 完全多线程框架，允许通过多个线程并发取样以及单独的线程对不同的功能同时取样；

**7、** 支持脚本取样器；

## 二、安装及下载

这里附一个最新的jmeter官网下载地址：

[http://jmeter.apache.org/download_jmeter.cgi](http://jmeter.apache.org/download_jmeter.cgi)

该链接是3.0版本的jmeter安装包

jmeter本身不需要安装，只需要配置好JDK环境，然后在在jmeter文件中的bin文件中打开jmeter.bat文件即可

最新版本，建议配置的JDK最好用1.7及以上版本

## 三、基础构成

**1、组成部分**

1）负载发生器：产生负载，多进程或多线程模拟用户行为

2）用户运行器：脚本运行引擎，用户运行器附加在进程或线程上，根据脚本模拟指定的用户行为

3）资源生成器：生成测试过程中服务器、负载机的资源数据

4）报表生成器：根据测试中获得的数据生成报表，提供可视化的数据显示方式·

**2、主要概念**

**2.1测试计划（test plan）**

描述一个性能测试，包含本次测试所有相关功能

**2.2.threads（users）线程**

Setup thread group：

一种特殊类型的线程，可用于执行预测试操作。即执行测试前进行定期线程组的执行

Teardown thread group：

一种特殊类型的线程，可用于执行测试后动作。即执行测试结束后执行定期的线程组

以上两个线程组，举个例子：loadrunner的脚本除了action里是真正的脚本核心内容，还有初始化“环境”的初始化脚本和测试完毕后对应的清除信息的脚本块，与其对应

Thread group：

通常添加使用的线程，一般一个线程组可看做一个虚拟用户组，其中每个线程为一个虚拟用户

**2.3测试片段（test fragment）**

**2、** 5版本之后新增的一个选项，是一种特殊的线程组，在测试树上与线程组一个层级，但是它不被执行，除非它是一个模块控制器或者被控制器所引用时才会被执行；

**2.4控制器**

Jmeter有2种控制器：取样器（sampler）和逻辑控制器（Logic Controller）

作用：用这些原件驱动处理一个测试

1）取样器（Sampler）

是性能测试中向服务器发送请求，记录响应信息，记录响应时间的最小单元，JMeter 原生支持多种不同的sampler

如HTTP Request Sampler 、 FTP Request Sampler 、TCP Request Sampler 、JDBC Request Sampler 等

每一种不同类型的 sampler 可以根据设置的参数向服务器发出不同类型的请求。

Java Request Sampler 和 Beanshell Request Sampler 是两种特殊的可定制的 Sampler （暂不讨论）

2）逻辑控制器（Logic Controller）

包含两类原件：

一类是控制Test Plan中Sampler节点发送请求的逻辑顺序控制器，常用的有：If Controller、Swith Controller、Loop Controller、Random Controller等

另一类是用来组织和控制Sampler节点的，如Transaction Controller、Throughput Controller等

**2.5监听器（Listener）**

对测试结果进行处理和可视化展示的一系列组件，常用的有图形结果、查看结果树、聚合报告等

以上的五类原件就可以构成一个简单的性能测试脚本

下面再介绍几种jmeter提供的其他组件：

**2.6配置原件（Config Element）**

用于提供对静态数据配置的支持。CSV Date Set Config可以将本地数据文件形成数据池（Date Pool），而对应于HTTP Request Configuration

和TCP Request Sample等类型的Configuration元件则可以修改这些Sample的默认数据等

**2.7定时器（Time）**

用于操作之间设置等待时间，等待时间使性能测试中常用的控制客户端QPS的手段，jmeter定义了Constant Times、

Constant Throughput Times、Guass Ramdon Times等不同类型的Times

**2.8断言（Assertions）**

用于检查测试中得到的响应数据等是否符合预期，Assertions一般用来设置检查点，用以保证性能测试过程中的数据交互与预期一致

**2.9前处理器（Pre Processors）**

用于在实际请求发出之前对即将发出的请求进行特殊处理。

例如：Count处理器可以实现自增操作，自增后生成的的数据可以被将要发出的请求使用，而HTTP URL Re—Writing Modifier处理器则可以实现URL重写，

当URL中有sessionID一类的session信息时，可以通过该处理器填充发出请求实际的sessionID。

**2.10后处理器（Post Processors）**

用于对Sampler发出请求后得到的服务器响应进行处理。一般用来提取响应中的特定数据（类似loadrunner中的关联）。

例如：Regular Expression Extractor用于提取响应数据中匹配某正则表达式的数据段，并将其填充在参数中，Xpath Extractor则可以用于提取响应数据中通过给定Xpath值获得的数据。。。
