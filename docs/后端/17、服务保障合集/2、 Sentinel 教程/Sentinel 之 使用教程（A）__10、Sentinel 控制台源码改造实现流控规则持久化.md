# 10、Sentinel 控制台源码改造实现流控规则持久化
- 来源：https://ddkk.com/zhuanlan/guarantee/sentinel/10.html
- 分类：服务保障
- 分组：Sentinel 之 使用教程（A）
## 之前遗留问题

之前我们集成了Nacos，实现了推送规则到客户端，但是控制台添加的规则不能持久化到Naocs中，这时需要对控制台源码进行改造。

先来回顾下默认添加流控规则的执行流程：

**1、** 控制台添加规则，会同步到sentinel服务端的内存中；

**2、** 然后调用客户端API，远程请求添加规则接口，同步到客户端内存中；

查询规则时流程如下：

**1、** 控制台调用远程API，查询客户端内存中的规则；

**2、** 将客户端查询到的规则，重新存放到sentinel服务端内存中，会事先清理；

## 官网提供的解决方案

### 方案流程

生产环境下一般更常用的是 push 模式的数据源。对于 push 模式的数据源,如远程配置中心（ZooKeeper, Nacos, Apollo等等），推送的操作不应由 Sentinel 客户端进行，而应该经控制台统一进行管理，直接进行推送，数据源仅负责获取配置中心推送的配置并更新到本地。

因此推送规则正确做法应该是：配置中心控制台/Sentinel 控制台 → 配置中心 → Sentinel客户端数据源 → Sentinel客户端。

自己画图，更容易理解，首先控制台调用Nacos，实现规则添加、删除、修改等，然后Nacos推送规则到客户端。查询规则时，则直接调用Nacos中的API查询。这样就实现了控制台和Nacos规则的双向同步。

### 方案细节

从Sentinel 1.4.0 开始，Sentinel 控制台提供 DynamicRulePublisher 和 DynamicRuleProvider 接口用于实现应用维度的规则推送和拉取，并提供了相关的示例。

- DynamicRuleProvider: 拉取规则
- DynamicRulePublisher: 推送规则

提供了Nacos、ZooKeeper 和 Apollo 的推送和拉取规则实现示例（位于 test 目录下）。

Sentinel 提供流控规则推送的示例页面（/v2/flow），用户改造控制台对接配置中心后可直接通过 v2 页面推送规则至配置中心。

以Nacos 为例，若希望使用 Nacos 作为动态规则配置中心，用户可以提取出相关的类，然后只需在 FlowControllerV2 中指定对应的 bean 即可开启 Nacos 适配。前端页面需要手动切换，或者修改前端路由配置（sidebar.html 流控规则路由从 dashboard.flowV1 改成 dashboard.flow 即可，注意簇点链路页面对话框需要自行改造）。

```java
@Autowired
@Qualifier("flowRuleNacosProvider")
private DynamicRuleProvider<List<FlowRuleEntity>> ruleProvider;
@Autowired
@Qualifier("flowRuleNacosPublisher")
private DynamicRulePublisher<List<FlowRuleEntity>> rulePublisher;
```

### 修改控制台源码实现流控规则持久化

接下来，参考以上官方提供的解决方案，我们来实际操作一下

#### 1. 改造代码

首先将pom中的sentinel-datasource-nacos中的scope去掉，将Nacos相关依赖引入到编译环境中来。

将test目录下nacos动态规则实现的相关代码，复制到com.alibaba.csp.sentinel.dashboard.rule包下。

修改FlowControllerV2类，将动态规则发布及拉取的注入类，替换为flowRuleNacosProvider及flowRuleNacosPublisher。

#### 2. 改造页面

找到图中目录下的sidebar页面，将流控规则菜单中的dashboard.flowV1改为dashboard.flow。

可以看到flow调用的页面和接口是V2相关的内容。

## 案例测试

### 1. 添加规则

重启修改源码后的控制台，刷新页面，可以看到页面菜单已经被修改了。

在新菜单中添加规则并保存。

在Nacos配置管理中，搜索SENTINEL_GROUP分组的配置文件，发现了一个自动生成的配置。

我们控制台添加的配置就被持久化到了Nacos中。

默认自动生成的Nacos配置适配的 dataId 和 groupId 约定如下：

- groupId: SENTINEL_GROUP
- 流控规则 dataId: {appName}-flow-rules，比如应用名为 appA，则 dataId 为 appA-flow-rules

用户可以在 NacosConfigUtil 修改对应的 groupId 和 dataId 前缀。

用户可以在 NacosConfig 配置对应的 Converter，默认已提供 FlowRuleEntity 的 decoder 和 encoder。

此时需要在客户端中修改groupId 和dataId 。将Nacos中新增的规则Push过来。注意rule-type：如果是网关流控规则数据源类型是 gw-flow，若将网关流控规则数据源指定为 flow 则不生效。

访问接口，发现限流成功，规则生效。

## 遗留问题

上面我们分析了控制台实现持久化页面规则，发现sentinel远程已经提供了方案，其他规则，都需要参照流控规则的方式进行改造。。。还是比较麻烦的。
