# 10、SkyWalking Web UI使用手册（SkyWalking web翻译及使用）
- 来源：https://ddkk.com/zhuanlan/linktrack/skywalking/10.html
- 分类：链路追踪
- 分组：SkyWalking 全链路监控系统分析
## 一、菜单、标签翻译

## 1、Dashboard(仪表界面)

Dashboard：仪表盘，面板

Calls HeatMap：调用热力图（反映：请求数量和响应时间）

AvgApplication Alarm：应用平均告警（数量百分比）

Slow Service：慢服务（Top10）

Application Throughput：应用吞吐量（cpm，每分钟调用次数）

Cpm：每分钟调用次数

## 2、Topology(拓扑界面)

Topology：拓扑结构

Topology Map：拓扑结构图

Overview：概览

SLA：应用的服务可用率

Calls Per Minute：每分钟调用

AvgResponse Time：平均响应时间

## 3、Application (应用界面)

Application Map：应用图（应用调用关系图）

Topology Map：拓扑结构图

AvgThroughput：平均吞吐量（实例进程的平均吞吐量）

AvgResponse Time：平均响应时间（实例进程的平均响应时间）

Running Server：

More Server Details：更多细节

## 4、Service (服务界面)

AvgThroughput：平均吞吐量（服务平均吞吐量）

AvgResponse Time：平均响应时间（服务平均响应时间）

AvgSLA：平均可用率（服务平均可用率）

Dependency Map：依赖图（服务依赖关系图的平均吞吐量和响应时间）

## 5、Alarm(告警界面)

Alarm List：告警列表

Application：服务器（告警信息）

Server：应用（告警信息）

Service：服务（告警信息）

## 6、Trace(链路追踪界面)

Time Range：时间范围

Trace State：追踪状态

Duration：持续时间，时长

Spans：跨度，跨越（调用的span链路信息（时序图））

--可以看到各span的耗时、异常和其他信息

--（不同的span支持不同的信息，例如DB类型的，可以打印出sql）

Span type-Entry/ Exit：span类型为进入/出去

Component：组件

Iserror-false/true：请求是否错误-false/true

Related Trace：相关追踪

Iserror标签解释：

-有异常的情况，会出现Is error=true，这时Logs会显示异常信息，如图所示。

## 二、总览视图使用

## 1、应用监控展示效果

### 1.1、监控一个应用展示形式

### 1.2、监控多个应用展示形式

--注：如上图所示，红色标记代表应用app_monitor_my的信息，绿色标记代表应用app_mall_web_01的信息。

## 2、应用监控数据缺失分析

### 2.1、描述

Application Throughput中应用变少，显示结果如下图所示：

### 2.2、原因

如下图所示，默认显示的是最近15分钟监控到的数据。

### 2.3、解决方法

选择缺失应用访问过的时间区间查看。

如下图，选择最近6小时：

结果如下，显示了3多个应用，因为这些应用在近6小时内有访过，而最近15分钟只有应用app_mall_01被访问过。

## 3、查询范围功能使用

### 3.1、最近某个区间

单击Last 15 minutes

选择时间

### 3.2、自定义区间

单击Last 15 minutes

选择区间

## 4、如何让监控结果每隔n秒自动刷新

单击Last 15 minutes

选择重新加载选项

则会每隔5秒钟加载一次

## 5、其他视图或菜单解释

应用数

url数

数据库和缓存数

MQ数

平均应用告警百分比

调用热图

慢服务

应用吞吐量

## 三、Avg Application Alarm使用

## 1、选择一个时间段查看曲线图

## 2、查看告警占比高的时间段

## 3、在Trace功能中查看告警数据

注-选择步骤2中对应的时间段

### 3.1、方式一-查看所有追踪类型

**3、** 1.1选择查询条件；

**3、** 1.2结果展示；

……

### 3.2、方式二-查看错误追踪类型

**3、** 2.1选择查询条件；

**3、** 2.2结果展示；

## 四、拓扑结构图功能使用

## 1、用户拓扑图

注-默认为用户图，效果同点击User展示结果一致。

如下图所示：左侧为“用户-应用-中间件”关系图；右侧为用户的各项统计结果。

## 2、应用拓扑图

如下图所示：左侧为“用户-应用-中间件”关系图；右侧为对应应用的各项统计结果

## 3、过滤查看某个应用图

如下图所示，显示了近7天的多个应用拓扑图

可在Filter application中选择想要查看的应用拓扑图

## 五、应用功能使用

## 1、切换应用

## 2、慢服务

## 3、更多服务详情（JVM、CPU、GC等）

## 六、服务功能使用

## 1、总览

如下图所示：展示了应用app_mall_web_01的服务/api/m/member/createMemberOrder的各项监控结果

## 2、吞吐量功能

如上图所示：表示2019-01-24 15:37、2019-01-24 15:38、2019-01-24 15:41三个时间点的吞吐量分别为1、1、1（即每分钟调用该URL资源的次数）

## 3、平均响应时间功能

### 3.1、总览

如下图所示，显示最近30分钟内，服务/api/m/member/createMemberOrder被调用3次的平均响应时间为20.33秒

### 3.2、曲线图分析

15:37对应的调用情况

15:38对应的调用情况

15:41对应的调用情况

## 4、依赖图功能

### 4.1、总览

如上图所示，展示的是/api/m/member/createMemberOrder调用的依赖关系图。

先后调用了getUserMembers()和/login/status

### 4.2、详解

鼠标点击可查看各个调用的统计数据

## 5、服务spans功能

### 5.1、总览

单击id进入总览

### 5.2、详情查看

单击每个span可查看监控结果

## 七、告警功能

## 1、总览

显示了最近6小时的告警结果

## 2、详解

### 2.1、Application-服务器告警信息

### 2.2、Server-应用告警信息

### 2.3、Service-服务告警信息

## 八、链路追踪功能

## 1、总览

## 2、详解

### 2.1、时间区间选择

### 2.2、应用过滤

### 2.3、追踪状态选

### 2.4、traceId查询

### 2.5、调用耗时范围

## 九、参考资源

https://blog.csdn.net/qq_36236890/article/details/79647017

http://blog.zollty.com/b/archive/apm-comparison-of-skywalking-and-pinpiont.html
