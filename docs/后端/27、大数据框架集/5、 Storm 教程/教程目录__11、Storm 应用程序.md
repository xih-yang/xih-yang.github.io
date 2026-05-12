# 11、Storm 应用程序
- 来源：https://ddkk.com/zhuanlan/bigdata/storm/11.html
- 分类：大数据框架
- 分组：教程目录
Apache Storm框架支持许多当今最好的工业应用程序。我们将在本章中简要介绍Storm的一些最显着的应用。

## Klout

Klout是一个应用程序，它使用社交媒体分析，根据在线社交影响力通过**Klout得分**，这是一个介于1和100之间的数值对用户排名。Klout使用Apache Storm的内置Trident抽象来创建流数据的复杂拓扑。

## 天气频道

天气频道使用Storm拓扑来获取天气数据。它绑定了Twitter，以在Twitter和移动应用程序启用天气知道的广告。**OpenSignal**是一家专门从事无线覆盖制图的公司。**StormTag**和**WeatherSignal**是由OpenSignal创建的基于天气的项目。StormTag是一个蓝牙气象站，连接到钥匙串。由设备收集的天气数据发送到WeatherSignal应用程序和OpenSignal服务器。

## 电信业

电信提供商每秒处理数百万的电话呼叫。他们对掉话和低音质进行取证。呼叫详细记录以每秒百万的速率流入，Apache Storm实时处理这些流并识别任何令人不安的模式。Storm分析可以用来不断提高通话质量。
