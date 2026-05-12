# 19、JMeter 实战 - 阶梯式加压测试
- 来源：https://ddkk.com/zhuanlan/tools/jmeter/2/19.html
- 分类：开发工具
- 分组：教程目录
性能测试中，有时需要模拟一种实际生产中经常出现的情况，即：从某个值开始不断增加压力，直至达到某个值，然后持续运行一段时间。

在jmeter中，有这样一个插件，可以帮我们实现这个功能，这个插件就是：** Stepping Thread Group**

**1、下载配置方法**

Stepping Thread Group是jmeter插件的一种，其作用就是模拟实际的生产情况，不断对服务器施加压力，直至到某个值，然后持续运行一段时间。

下载地址：[https://jmeter-plugins.org/downloads/old/](https://jmeter-plugins.org/downloads/old/)

下载界面如下：

下载后需要解压，然后将JMeterPlugins-Standard.jar包放在**jmeter安装目录的jmeter-3.0\lib\ext路径**下，重新启动jemter即可。

**2、使用介绍**

启动jmeter，添加线程组——jp@gc - Stepping Thread Group，如下图：

Stepping Thread Group界面如下：

功能如下：

**This group will start 100 threads**：设置线程组启动的线程总数为100个；

**First,wait for N seconds**：启动第一个线程之前，需要等待N秒；

**Then start N threads**：设置最开始时启动N个线程；

**Next,add 10 threads every 30 seconds,using ramp-up 5 seconds**：每隔30秒，在5秒内启动10个线程；

**Then hold load for 60 seconds**：启动的线程总数达到最大值之后，再持续运行60秒；

**Finally,stop 5 threads every 1 seconds**：每秒停止5个线程；

## 三、相关插件

Stepping Thread Group插件相对来说比较旧，在plugins插件组中，还有一个类似的优化过的插件，叫做：** Concurrency Thread Group**

相关介绍以及下载地址如下：[https://jmeter-plugins.org/wiki/ConcurrencyThreadGroup/](https://jmeter-plugins.org/wiki/ConcurrencyThreadGroup/)

其实最好的办法，是直接下载jmeter的第三方插件Plugin Manager（其中包含了很多扩展支持插件），解压后将其放入jmeter安装目录的jmeter-3.0\lib\ext路径下，然后重启即可。

下载地址：[https://jmeter-plugins.org/wiki/PluginsManager/](https://jmeter-plugins.org/wiki/PluginsManager/)

jmeter的第三方扩展插件功能是很丰富的，也算一定程度上弥补了jmeter作为开源工具的某些不足之处，具体的作用还是需要在实战中摸索实践。。。
