# 11、Eureka 源码解析 - Eureka Server 覆盖状态
- 来源：https://ddkk.com/zhuanlan/registered/eureka/1/11.html
- 分类：注册中心
- 分组：教程目录
下面是官方提供的 Eureka 架构图：

### 1、Eureka Server 覆盖状态概述

在`InstanceInfo` 服务应用信息对象里面不仅有状态`status` ，还有覆盖状态 `overriddenStatus`。

> InstanceInfo

```java
public class InstanceInfo {
	// 服务应用信息状态
    private volatile InstanceStatus status = InstanceStatus.UP;
    // 服务应用信息覆盖状态
	private volatile InstanceStatus overriddenStatus = InstanceStatus.UNKNOWN;
}
```

可以调用 `Eureka-Server` 暴露的 HTTP Restful 接口 `apps/${APP_NAME}/${INSTANCE_ID}/status` 对服务应用实例覆盖状态的变更。从而达到主动的、强制的变更应用实例状态。

> 这里不会修改 Eureka-Client 应用实例的状态，而是修改在 Eureka-Server 注册的应用实例的状态。

通过这样的方式，Eureka-Client 在获取到注册信息时，并且配置 `eureka.shouldFilterOnlyUpInstances` 为 `true`(**默认为 true**)，过滤掉非 `InstanceStatus.UP` 的应用实例，从而避免调动该实例，以达到应用实例的暂停服务( `InstanceStatus.OUT_OF_SERVICE` )，而无需关闭应用实例。

因此，大多数情况下，调用该接口的目的，将应用实例状态在 ( InstanceStatus.UP ) 和 ( InstanceStatus.OUT_OF_SERVICE) 之间切换。引用官方代码 AbstractInstanceRegistry#statusUpdate 上的注释如下：

> Updates the status of an instance. Normally happens to put an instance
>
> between {@link InstanceStatus#OUT_OF_SERVICE} and
>
> {@link InstanceStatus#UP} to put the instance in and out of traffic.

### 2、Eureka Server 覆盖状态操作

在Eureka Server 中的服务应用处理类 `InstanceResource` 提供了 3 个接口来修改服务实例中的 `overriddenStatus`。

- renewLease： 心跳接口，可以传入 overriddenStatus 字段来修改服务信息(InstanceInfo) 的覆盖状态
- statusUpdate：覆盖状态修改接口，可以传入 value字段来修改服务信息(InstanceInfo) 的覆盖状态
- deleteStatusUpdate：删除覆盖状态接口，可以传入value字段来修改服务信息(InstanceInfo) 的覆盖状态

#### 2.1 续约修改覆盖状态

可以调用 InstanceResource#renewLease 这个续约接口可以修改服务应用信息的覆盖状态值，它的时序图如下所示：

在续约成功之后，如果传递的 `lastDirtyTimestamp` 字段不为空并且根据时间戳验证服务应用信息状态为 `Response.Status.NOT_FOUND`。就会从`ConcurrentMap overriddenInstanceStatusMap` 这个 Map 根据应用 ID 获取这个应用服务的实例之前是否进行了状态覆盖，如果没有，就会往`ConcurrentMap overriddenInstanceStatusMap` 这个 Map 里面添加服务 ID 的以及对应的覆盖状态并且设置应用信息 InstanceInfo 的覆盖状态。

> 在进行续约的时候如果实例的状态与覆盖状态不相等就会把状态设置成覆盖状态

```java
public boolean renew(String appName, String id, boolean isReplication) {
		......
        InstanceInfo instanceInfo = leaseToRenew.getHolder();
        if (instanceInfo != null) {
            // touchASGCache(instanceInfo.getASGName());
            InstanceStatus overriddenInstanceStatus = this.getOverriddenInstanceStatus(
                    instanceInfo, leaseToRenew, isReplication);
            if (overriddenInstanceStatus == InstanceStatus.UNKNOWN) {
                logger.info("Instance status UNKNOWN possibly due to deleted override for instance {}"
                        + "; re-register required", instanceInfo.getId());
                RENEW_NOT_FOUND.increment(isReplication);
                return false;
            }
            if (!instanceInfo.getStatus().equals(overriddenInstanceStatus)) {
                logger.info(
                        "The instance status {} is different from overridden instance status {} for instance {}. "
                                + "Hence setting the status to overridden status", instanceInfo.getStatus().name(),
                                overriddenInstanceStatus.name(),
                                instanceInfo.getId());
                instanceInfo.setStatusWithoutDirty(overriddenInstanceStatus);
            }
        }
	   ......	
}
```

#### 2.2 覆盖状态修改接口

可以调用 InstanceResource#statusUpdate 这个接口来修改服务应用信息的覆盖状态值，它的时序图如下所示：

- 首先它会根据服务找到对应服务的实例列表，然后根据服务实例的 ID 找到具体的服务实例
- 接着会调用服务实例信息的续约接口 Lease#renew 修改最近一次修改时间戳 lastUpdateTimestamp 为 System.currentTimeMillis() + duration(默认90秒);
- 如果服务实例的状态与覆盖状态相等就直接返回，否则进入下一个步骤
- 在 ConcurrentMap`` overriddenInstanceStatusMap 添加服务实例的 ID 与覆盖状态的映射
- 修改服务应用信息的覆盖状态为传入的状态
- 往修改队列 recentlyChangedQueue 里面添加当前服务应用信息的操作状态为ActionType.MODIFIED
- 清除注册服务中的响应缓存

#### 2.3 覆盖状态删除接口

可以调用 InstanceResource#deleteStatusUpdate 这个接口来删除服务应用信息的覆盖状态值，它的时序图如下所示：

- 首先它会根据服务找到对应服务的实例列表，然后根据服务实例的 ID 找到具体的服务实例
- 接着会调用服务实例信息的续约接口 Lease#renew 修改最近一次修改时间戳 lastUpdateTimestamp 为 System.currentTimeMillis() + duration(默认90秒);
- 如果服务实例的状态与覆盖状态相等就直接返回，否则进入下一个步骤
- 在 ConcurrentMap`` overriddenInstanceStatusMap 根据服务实例的 ID 删除覆盖状态的映射
- 修改服务应用信息的覆盖状态为传入的状态
- 往修改队列 recentlyChangedQueue 里面添加当前服务应用信息的操作状态为ActionType.MODIFIED
- 清除注册服务中的响应缓存

可以看到不管是对覆盖进行什么操作都是操作 `AbstractInstanceRegistry` 对象中的 `ConcurrentMap overriddenInstanceStatusMap` 这个属性非常重要，后面的章节中会具体分析。

### 3、应用实例覆盖状态映射

在之前的分析中我们可以看到覆盖状态操作其实包含以下两个步骤：

- 操作注册服务 AbstractInstanceRegistry 对象中的 ConcurrentMap`` overriddenInstanceStatusMap 服务实例 ID 与覆盖状态的映射
- 把服务实例里面的覆盖状态overriddenStatus 设置为传入的状态

上面讲过在在服务实例进行续约的时候就会从 `overriddenInstanceStatusMap` 根据服务实例 ID 获取到覆盖状态把覆盖状态更新到当前服务实例当中。其实对于服务注册也有同样的逻辑：

> AbstractInstanceRegistry#register

```java
public void register(InstanceInfo registrant, int leaseDuration, boolean isReplication) {
		......
       InstanceStatus overriddenStatusFromMap = overriddenInstanceStatusMap.get(registrant.getId());
       if (overriddenStatusFromMap != null) {
           logger.info("Storing overridden status {} from map", overriddenStatusFromMap);
           registrant.setOverriddenStatus(overriddenStatusFromMap);
       }
       // Set the status based on the overridden status rules
       InstanceStatus overriddenInstanceStatus = getOverriddenInstanceStatus(registrant, existingLease, isReplication);
       registrant.setStatusWithoutDirty(overriddenInstanceStatus);
	   ......
}
```

- 从 ConcurrentMap`` overriddenInstanceStatusMap 根据服务实例 ID 获取到覆盖状态
- 如果覆盖状态不为空就调用 registrant.setOverriddenStatus(overriddenStatusFromMap) 把覆盖状态设置到实例信息 InstanceInfo 的 overriddenStatus 覆盖状态当中
- 接着调用 AbstractInstanceRegistry#getOverriddenInstanceStatus 这个方法根据 InstanceStatusOverrideRule 这个实例覆盖状态规则的实现类获取覆盖状态
- 如果覆盖状态的值与实例信息 InstanceInfo registrant 里面状态(status)的值不一致就把覆盖状态的值设置为实例信息 InstanceInfo registrant的状态值。

> AbstractInstanceRegistry#getOverriddenInstanceStatus

```java
    protected InstanceInfo.InstanceStatus getOverriddenInstanceStatus(InstanceInfo r,
                                                                    Lease<InstanceInfo> existingLease,
                                                                    boolean isReplication) {
        InstanceStatusOverrideRule rule = getInstanceInfoOverrideRule();
        logger.debug("Processing override status using rule: {}", rule);
        return rule.apply(r, existingLease, isReplication).status();
    }
	protected abstract InstanceStatusOverrideRule getInstanceInfoOverrideRule();
```

在方法 AbstractInstanceRegistry#getOverriddenInstanceStatus 中会获取 InstanceStatusOverrideRule 应用覆盖状态的规则。这个规则接口的类结构如下图所示：

- StatusOverrideResult：是 InstanceStatusOverrideRule 定义的接口返回值里面有两个字段： match 用于判断是否规则匹配，实例状态 InstanceStatus 用于调用 registrant.setStatusWithoutDirty(overriddenInstanceStatus) 设置实例的状态 (status)
- AsgEnabledRule：是 AWS 环境才会使用这时我们不做讨论。

> AlwaysMatchInstanceStatusRule.java

```java
public class AlwaysMatchInstanceStatusRule implements InstanceStatusOverrideRule {
    private static final Logger logger = LoggerFactory.getLogger(AlwaysMatchInstanceStatusRule.class);
    @Override
    public StatusOverrideResult apply(InstanceInfo instanceInfo,
                                      Lease<InstanceInfo> existingLease,
                                      boolean isReplication) {
        logger.debug("Returning the default instance status {} for instance {}", instanceInfo.getStatus(),
                instanceInfo.getId());
        return StatusOverrideResult.matchingStatus(instanceInfo.getStatus());
    }
    @Override
    public String toString() {
        return AlwaysMatchInstanceStatusRule.class.getName();
    }
}
```

任何情况的匹配，直接返回 `instanceInfo` 的状态

> DownOrStartingRule.java

```java
public class DownOrStartingRule implements InstanceStatusOverrideRule {
    private static final Logger logger = LoggerFactory.getLogger(DownOrStartingRule.class);
    @Override
    public StatusOverrideResult apply(InstanceInfo instanceInfo,
                                      Lease<InstanceInfo> existingLease,
                                      boolean isReplication) {
        // ReplicationInstance is DOWN or STARTING - believe that, but when the instance says UP, question that
        // The client instance sends STARTING or DOWN (because of heartbeat failures), then we accept what
        // the client says. The same is the case with replica as well.
        // The OUT_OF_SERVICE from the client or replica needs to be confirmed as well since the service may be
        // currently in SERVICE
        if ((!InstanceInfo.InstanceStatus.UP.equals(instanceInfo.getStatus()))
                && (!InstanceInfo.InstanceStatus.OUT_OF_SERVICE.equals(instanceInfo.getStatus()))) {
            logger.debug("Trusting the instance status {} from replica or instance for instance {}",
                    instanceInfo.getStatus(), instanceInfo.getId());
            return StatusOverrideResult.matchingStatus(instanceInfo.getStatus());
        }
        return StatusOverrideResult.NO_MATCH;
    }
    @Override
    public String toString() {
        return DownOrStartingRule.class.getName();
    }
}
```

**上面的逻辑是**：服务实例信息的状态既不等于 `InstanceStatus.UP` 也不等于`InstanceStatus.OUT_OF_SERVICE` ，就直接返回服务实例信息里面的状态。

**代码注释**：`ReplicationInstance is DOWN or STARTING` -相信这个，但是当实例说UP的时候，质疑它客户端实例发送 `STARTING` 或 `DOWN(因为心跳失败)`，然后我们接受什么客户端说。replica也是如此。客户端或副本的`OUT_OF_SERVICE` 也需要确认，因为服务可能是当前服务。

> FirstMatchWinsCompositeRule.java

```java
public class FirstMatchWinsCompositeRule implements InstanceStatusOverrideRule {
    private final InstanceStatusOverrideRule[] rules;
    private final InstanceStatusOverrideRule defaultRule;
    private final String compositeRuleName;
    public FirstMatchWinsCompositeRule(InstanceStatusOverrideRule... rules) {
        this.rules = rules;
        this.defaultRule = new AlwaysMatchInstanceStatusRule();
        // Let's build up and "cache" the rule name to be used by toString();
        List<String> ruleNames = new ArrayList<>(rules.length+1);
        for (int i = 0; i < rules.length; ++i) {
            ruleNames.add(rules[i].toString());
        }
        ruleNames.add(defaultRule.toString());
        compositeRuleName = ruleNames.toString();
    }
    @Override
    public StatusOverrideResult apply(InstanceInfo instanceInfo,
                                      Lease<InstanceInfo> existingLease,
                                      boolean isReplication) {
        for (int i = 0; i < this.rules.length; ++i) {
            StatusOverrideResult result = this.rules[i].apply(instanceInfo, existingLease, isReplication);
            if (result.matches()) {
                return result;
            }
        }
        return defaultRule.apply(instanceInfo, existingLease, isReplication);
    }
    @Override
    public String toString() {
        return this.compositeRuleName;
    }
}
```

它的逻辑是里面有规则列表 `InstanceStatusOverrideRule[] rules` 同时也有默认规则 `InstanceStatusOverrideRule defaultRule` 首先遍历规则列表，如果有一个匹配就直接返回。反之就使用默认的规则进行匹配。

> OverrideExistsRule.java

```java
public class OverrideExistsRule implements InstanceStatusOverrideRule {
    private static final Logger logger = LoggerFactory.getLogger(OverrideExistsRule.class);
    private Map<String, InstanceInfo.InstanceStatus> statusOverrides;
    public OverrideExistsRule(Map<String, InstanceInfo.InstanceStatus> statusOverrides) {
        this.statusOverrides = statusOverrides;
    }
    @Override
    public StatusOverrideResult apply(InstanceInfo instanceInfo, Lease<InstanceInfo> existingLease, boolean isReplication) {
        InstanceInfo.InstanceStatus overridden = statusOverrides.get(instanceInfo.getId());
        // If there are instance specific overrides, then they win - otherwise the ASG status
        if (overridden != null) {
            logger.debug("The instance specific override for instance {} and the value is {}",
                    instanceInfo.getId(), overridden.name());
            return StatusOverrideResult.matchingStatus(overridden);
        }
        return StatusOverrideResult.NO_MATCH;
    }
    @Override
    public String toString() {
        return OverrideExistsRule.class.getName();
    }
}
```

它的逻辑是：从服务实例信息 ID 与覆盖状态的映射 `Map statusOverrides` 中根据服务实例信息 ID 获取，如果能够获取就返回覆盖状态的状态值，反之就不匹配。

> LeaseExistsRule.java

```java
public class LeaseExistsRule implements InstanceStatusOverrideRule {
    private static final Logger logger = LoggerFactory.getLogger(LeaseExistsRule.class);
    @Override
    public StatusOverrideResult apply(InstanceInfo instanceInfo,
                                      Lease<InstanceInfo> existingLease,
                                      boolean isReplication) {
        // This is for backward compatibility until all applications have ASG
        // names, otherwise while starting up
        // the client status may override status replicated from other servers
        if (!isReplication) {
            InstanceInfo.InstanceStatus existingStatus = null;
            if (existingLease != null) {
                existingStatus = existingLease.getHolder().getStatus();
            }
            // Allow server to have its way when the status is UP or OUT_OF_SERVICE
            if ((existingStatus != null)
                    && (InstanceInfo.InstanceStatus.OUT_OF_SERVICE.equals(existingStatus)
                    || InstanceInfo.InstanceStatus.UP.equals(existingStatus))) {
                logger.debug("There is already an existing lease with status {}  for instance {}",
                        existingLease.getHolder().getStatus().name(),
                        existingLease.getHolder().getId());
                return StatusOverrideResult.matchingStatus(existingLease.getHolder().getStatus());
            }
        }
        return StatusOverrideResult.NO_MATCH;
    }
    @Override
    public String toString() {
        return LeaseExistsRule.class.getName();
    }
}
```

- 如果是集群环境下直接返回 StatusOverrideResult.NO_MATCH 不匹配。
- 如果实例状态 Lease`` existingLease 中的实例信息是 InstanceStatus.OUT_OF_SERVICE 或者 InstanceStatus.UP 直接返回 Lease`` existingLease 实例信息里面的状态。

我们将`PeerAwareInstanceRegistryImpl` 的应用实例覆盖状态规则进行梳理一下：

状态
DownOrStartingRule
OverrideExistsRule
LeaseExistsRule
AlwaysMatchInstanceStatusRule

instanceInfo
STARTING

* 全部状态

existingLease

UP or OUT_OF_SERVER(非 Eureka Server 请求)

statusOverrides

* 全部状态

- 应用实例状态是最重要的属性，没有之一，因而在最终实例状态的计算，以可信赖为主。
- DownOrStartingRule ，instanceInfo处于 STARTING或者 DOWN 状态，应用实例可能不适合提供服务( 被请求 )，考虑可信赖，返回 instanceInfo 的状态。
- OverrideExistsRule ，当存在覆盖状态( statusoverrides ) ，使用该状态，比较好理解。
- LeaseExistsRule ，来自 Eureka-Client 的请求( **非 Eureka-Server 集群请求**)，当 Eureka-Server 的实例状态存在，并且处于 UP 或则 OUT_OF_SERVICE ，保留当前状态。原因，禁止 Eureka-Client主动在这两个状态之间切换。如果要切换，使用应用实例覆盖状态变更与删除接口。
- AlwaysMatchInstanceStatusRule ，使用 instanceInfo 的状态返回，以保证能匹配到状态。

从上面我们可以看到 Eureka Server 是从 AbstractInstanceRegistry#getOverriddenInstanceStatus 获取应用覆盖状态规则 InstanceStatusOverrideRule 对应的实例对象。而 Eureka Server 的注册服务实例是 PeerAwareInstanceRegistryImpl ，在它的初始化过程当中它的构建方法会初始化 InstanceStatusOverrideRule 对象。

```java
public class PeerAwareInstanceRegistryImpl extends AbstractInstanceRegistry implements PeerAwareInstanceRegistry {
    private final InstanceStatusOverrideRule instanceStatusOverrideRule;
    public PeerAwareInstanceRegistryImpl(
            EurekaServerConfig serverConfig,
            EurekaClientConfig clientConfig,
            ServerCodecs serverCodecs,
            EurekaClient eurekaClient
    ) {
        super(serverConfig, clientConfig, serverCodecs);
        this.eurekaClient = eurekaClient;
        this.numberOfReplicationsLastMin = new MeasuredRate(1000 * 60 * 1);
        // We first check if the instance is STARTING or DOWN, then we check explicit overrides,
        // then we check the status of a potentially existing lease.
        this.instanceStatusOverrideRule = new FirstMatchWinsCompositeRule(new DownOrStartingRule(),
                new OverrideExistsRule(overriddenInstanceStatusMap), new LeaseExistsRule());
    }
	......
```

它使用的是 `FirstMatchWinsCompositeRule` 这个规则类：它的逻辑是里面有规则列表 `InstanceStatusOverrideRule[] rules` 同时也有默认规则 `InstanceStatusOverrideRule defaultRule` 首先遍历规则列表，如果有一个匹配就直接返回。反之就使用默认的规则进行匹配。然后传入的规则依次是：`DownOrStartingRule` 、 `OverrideExistsRule` 和 `LeaseExistsRule`。
