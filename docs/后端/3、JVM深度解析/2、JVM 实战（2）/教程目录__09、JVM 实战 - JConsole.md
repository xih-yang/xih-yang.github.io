# 09、JVM 实战 - JConsole
- 来源：https://ddkk.com/zhuanlan/java/jvm/2/9.html
- 分类：JVM 实战
- 分组：教程目录
Console工具在JDK/bin目录下，启动JConsole后，将自动搜索本机运行的jvm进程，不需要jps命令来查询指定。双击其中一个jvm进程即可开始监控，也可使用“远程进程”来连接远程服务器。

进入JConsole主界面，有“概述”、“内存”、“线程”、“类”、“VM摘要”和"Mbean"六个页签：

内存页签相当于jstat命令，用于监视收集器管理的虚拟机内存(Java堆和永久代)变化趋势，还可在详细信息栏观察全部GC执行的时间及次数。

线程页签

最后一个常用页签，VM页签，可清楚的了解显示指定的JVM参数及堆信息。
