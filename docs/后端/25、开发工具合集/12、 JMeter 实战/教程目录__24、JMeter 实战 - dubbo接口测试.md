# 24、JMeter 实战 - dubbo接口测试
- 来源：https://ddkk.com/zhuanlan/tools/jmeter/2/24.html
- 分类：开发工具
- 分组：教程目录
## 一、Dubbo简介

dubbo是一个分布式服务框架，致力于提供高性能和透明化的RPC远程服务调用方案，以及SOA服务治理方案。其核心部分包含如下几点：

**1、** 远程通讯：提供对多种基于长连接的NIO框架抽象封装，包括多种线程模型，序列化，以及“请求-响应”模式的信息交换方式；

**2、** 集群容错：提供基于接口方法的透明远程过程调用，包括多协议支持，以及软负载均衡，失败容错，地址路由，动态配置等集群支持；

**3、** 自动发现：基于注册中心目录服务，使服务消费方能动态的查找服务提供方，使地址透明，使服务提供方可以平滑增加或减少机器；

**4、** dubbo简化模型；

## 二、Dubbo插件

**1、** jmeter本身并不支持dubbo接口的测试，需要下载第三方插件，然后将jar包放入${JMETER_HOME}\lib\ext路径下，重启即可；

插件下载地址：[jmeter-plugins-dubbo](https://github.com/ningyu1/jmeter-plugins-dubbo/tree/master/dist)

**2、** 选择自己需要的插件，为了适配性考虑，建议1.3.2及以上的版本；

各版本更新说明：[changelog](https://github.com/dubbo/jmeter-plugins-dubbo/wiki/changelog)

**3、** 参数说明；

[简单参数对照表](https://github.com/dubbo/jmeter-plugins-dubbo/wiki/ParameterComparisonTable)、[复杂参数对照表](https://github.com/dubbo/jmeter-plugins-dubbo/wiki/FAQ)

## 三、Dubbo Sample

启动jmeter，添加线程组→Sampler→Listener，dubbo-sample界面如下：

各参数说明如下：

**Protocol：** 注册协议，包括zookeeper、multicast、Redis、simple；

**Address：** 注册地址，dubbo服务的IP+Port：

①、当使用zk，address填入zk地址，集群地址使用","分隔；

②、使用dubbo直连，address填写直连地址和服务端口；

**Protocol：** 使用的dubbo协议，包括dubbo、rmi、hessian、webservice、memcached、redis，根据自己的协议类型选择对应的选项即可；

**Timeout：** 请求超时时间，单位ms，根据dubbo具体配置填写；

**Version：** 版本，dubbo不同版本之间差异较大，不同版本之间不能互相调用，这里指定dubbo版本，是为了方便识别和说明；

**Retries：** 异常重试次数（类似这种分布式服务通信框架，大多都有重试机制，是为了保证事务成功率）；

**Cluster：** 集群类型，包括failover、failfast、failsafe、failback、failking；

**Group：** 组类型，如果有的话，根据配置填写即可；

**Connections：** 连接数，同上，根据配置填写；

**Async：** 服务处理类型，包括sync（同步）、async（异步），根据配置填写；

**Loadbalance：** 负载均衡策略，包括random（随机）、roundrobin（轮询）、leastactive（最少活跃数）、consistenthash（一致性哈希）；

**Interface：** 接口名（因为dubbo服务大多是开发根据规范自行命名的，因此这里需要填写完整的接口名+包名）；

**Method：** 当前接口下的方法名，按照开发提供的API文档填写即可；

**Args：** 接口报文，根据API文档填写，如上图所示，添加输入行，输入对应的参数类型和值即可（参数类型和值如何定义填写，请参考上面的链接）；

①、paramType：参数支持任何类型，包装类直接使用`java.lang`下的包装类，小类型使用：`int``、``float``、``shot``、``double``、``long``、``byte``、``boolean``、``char`，自定义类使用类完全名称；

②、paramValue：基础包装类和基础小类型直接使用值，例如：int为1，boolean为true等，自定义类与`List`或者`Map`等使用json格式数据；

以上即为利用jmeter的dubbo插件进行dubbo接口的测试，当然，同样可以进行性能测试，更多使用方式请自行探索。。。
