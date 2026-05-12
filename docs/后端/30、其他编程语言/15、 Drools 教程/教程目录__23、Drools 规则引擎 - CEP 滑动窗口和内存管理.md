# 23、Drools 规则引擎 - CEP 滑动窗口和内存管理
- 来源：https://ddkk.com/zhuanlan/other/drools/1/23.html
- 分类：Drools 教程
- 分组：教程目录
#### 时间或长度的滑动窗口

在流模式中，Drools可从指定的时间或长度窗口处理事件。时间滑动窗口是指定处理事件的时间长度，长度的滑动窗口是指指定处理事件的数量。当你在DRL规则或者java应用中声明滑动窗口，Drools就会在编译时识别并创建合适的内部数据结构，以便用该滑动窗口中的数据去评估规则。

例如，下面的DRL规则片段指明Drools只处理最近2分钟的（时间滑动窗口）StockPoint，或者只处理10个StockPoint（长度滑动窗口）

处理最近2分钟的库存点（时间滑动窗口）

```java
StockPoint() over window:time(2m)
```

处理最近的10个库存点（长度滑动窗口）

```java
StockPoint() over window:length(10)
```

##### 为规则数据声明滑动窗口

你可以为事件声明一个时间滑动窗口或者长度滑动窗口，以便让Drools只使用窗口里面的数据去评估规则。

过程

在DRL规则文件中，为插入的事实指定 over window：()

例如，下面的两个根据平均温度来激活火警警报的DRL规则文件。第一个规则使用事件滑动窗口，计算最近10分钟的平均温度，而第二个规则文件使用长度滑动窗口，计算最近100个温度读数的平均值。

滑动时间窗口内的平均温度

```java
rule "Sound the alarm if temperature rises above threshold"
when
  TemperatureThreshold($max : max)
  Number(doubleValue > $max) from accumulate(
    SensorReading($temp : temperature) over window:time(10m),
    average($temp))
then
  // Sound the alarm.
end
```

滑动长度窗口内的平均温度

```java
rule "Sound the alarm if temperature rises above threshold"
when
  TemperatureThreshold($max : max)
  Number(doubleValue > $max) from accumulate(
    SensorReading($temp : temperature) over window:length(100),
    average($temp))
then
  // Sound the alarm.
end
```

Drools对于任何超过10分钟或者不是最近的100个读数的SensorReading事件，都不会处理，并且会不断的实时的重复计算按照事件和长度窗口的设置。

Drools不会自动的从会话中移除过期事件，因为其他没有设置滑动窗口的声明可能会依赖那些过期事件。Drools会在会话中存储事件，直到事件过期，这个过期是指在规则中显式声明的过期，或者是通过kie库的数据推断的隐式原因的过期。

#### 事件的内存管理

在流模式中，Drools使用自动的内存管理去维护存储在会话中的事件。Drools可以从会话中回收任何不再能够与规则匹配的事件，根据事件的时间约束，同时释放被回收事件所持有的一切资源。

Drools使用显示或者推断过期去回收过时过时的事件：

- 显示过期：drools引擎会移除那些在规则文件中声明了@expores标签的过期事件

DRL规则用显示过期的片段

```java
declare StockPoint
  @expires( 30m )
end
```

这个例子设置任意StockPoint事件会在30分钟后过期，同时如果没有其他规则使用这个事件，会被会话移除。

- 推断过期：Drools可以通过分析规则中的时间约束隐式地计算出给出事件的过期偏移量：

使用事件约束的DRL文件

```java
rule "Correlate orders"
when
  $bo : BuyOrder($id : id)
  $ae : AckOrder(id == $id, this after[0,10s] $bo)
then
  // Perform an action.
end
```

对于这个例子，Drools会自动计算，每当BuyOrder事件发生，drools需要至少存储该事件10s，用来等待AckOrder事件发生。在10s之后，Drools推断过期并从会话中移除事件。AckOrder事件只可以匹配已经存在的BuyOrder事件，所以如果没有匹配发生，Drools会推断过期，并立即删除事件。

同理可应用于时间滑动窗口window:time(),但是长度滑动窗口window:length()不计算他的过期。

Drools分析全部的Kie库，用来为每一个事件类型找到偏移，用来确认没有其他的规则使用这个准备移除的事件。每当隐式过期和显式过期冲突时，Drools会使用两者中更长的时间去存储事件。
