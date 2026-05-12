# 21、Flink深入：Flink之Window 案例
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/4/21.html
- 分类：大数据框架
- 分组：教程目录
## 1. 为什么需要Window

在流处理应用中，数据是连续不断的，有时我们需要做一些聚合类的处理，例如：在过去的1分钟内有多少用户点击了我们的网页。

在这种情况下，我们必须定义一个窗口(window)，用来收集最近1分钟内的数据，并对这个窗口内的数据进行计算。

## 2. Window的分类

## 2.1. 按照time和count分类

time-window:时间窗口:根据时间划分窗口,如:每xx分钟统计最近xx分钟的数据

count-window:数量窗口:根据数量划分窗口,如:每xx个数据统计最近xx个数据

## 2.2. 安装slide和size分类

窗口有两个重要的属性: 窗口大小size和滑动间隔slide,根据它们的大小关系可分为:

tumbling-window:滚动窗口:size=slide,如:每隔10s统计最近10s的数据

sliding-window:滑动窗口:size>slide,如:每隔5s统计最近10s的数据

注意:当size<slide的时候,如每隔15s统计最近10s的数据,那么中间5s的数据会丢失,所有开发中不用

## 2.3. 对Flink中Window功能的总结

```java
1.基于时间的滚动窗口tumbling-time-window--用的较多
2.基于时间的滑动窗口sliding-time-window--用的较多
3.基于数量的滚动窗口tumbling-count-window--用的较少
4.基于数量的滑动窗口sliding-count-window--用的较少
注意:Flink还支持一个特殊的窗口:Session会话窗口,需要设置一个会话超时时间,如30s,则表示30s内没有数据到来,则触发上个窗口的计算
```

## 3. Window中的API

## 3.1. window和windowAll

使用keyby的流,应该使用window方法

未使用keyby的流,应该调用windowAll方法

## 3.2. WindowAssigner

window/windowAll 方法接收的输入是一个 WindowAssigner， WindowAssigner 负责将每条输入的数据分发到正确的 window 中，Flink提供了很多各种场景用的WindowAssigner：

如果需要自己定制数据分发策略，则可以实现一个 class，继承自 WindowAssigner

## 3.3. Window中的evictor

```java
evictor 主要用于做一些数据的自定义操作，可以在执行用户代码之前，也可以在执行
用户代码之后，更详细的描述可以参考org.apache.flink.streaming.api.windowing.evictors.Evictor 的 evicBefore 和 evicAfter两个方法。
Flink 提供了如下三种通用的 evictor：
* CountEvictor 保留指定数量的元素
* TimeEvictor 设定一个阈值 interval，删除所有不再 max_ts - interval 范围内的元素，其中 max_ts 是窗口内时间戳的最大值。
* DeltaEvictor 通过执行用户给定的 DeltaFunction 以及预设的 theshold，判断是否删除一个元素。
```

## 3.4. Window中的trigger

```java
trigger 用来判断一个窗口是否需要被触发，每个 WindowAssigner 都自带一个默认的trigger，
如果默认的 trigger 不能满足你的需求，则可以自定义一个类，继承自Trigger 即可，我们详细描述下 Trigger 的接口以及含义：
* onElement() 每次往 window 增加一个元素的时候都会触发
* onEventTime() 当 event-time timer 被触发的时候会调用
* onProcessingTime() 当 processing-time timer 被触发的时候会调用
* onMerge() 对两个 rigger 的 state 进行 merge 操作
* clear() window 销毁的时候被调用
上面的接口中前三个会返回一个 TriggerResult， TriggerResult 有如下几种可能的选择：
* CONTINUE 不做任何事情
* FIRE 触发 window
* PURGE 清空整个 window 的元素并销毁窗口
* FIRE_AND_PURGE 触发窗口，然后销毁窗口
```

## 3.5. Window中的API调用示例

```java
source.keyBy(0).window(TumblingProcessingTimeWindows.of(Time.seconds(5)));
source.keyBy(0)..timeWindow(Time.seconds(5));
```
