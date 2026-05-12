# 8、Sentinel 教程进阶 ClusterServerConfigManager
- 来源：https://ddkk.com/zhuanlan/guarantee/sentinelym/28.html
- 分类：服务保障
- 分组：Sentinel 教程进阶
声明了三个属性，为属性添加监听器

```java
/**
 * Property for cluster server global transport configuration.
 */
private static SentinelProperty<ServerTransportConfig> transportConfigProperty = new DynamicSentinelProperty<>();
/**
 * Property for cluster server namespace set.
 */
private static SentinelProperty<Set<String>> namespaceSetProperty = new DynamicSentinelProperty<>();
/**
 * Property for cluster server global flow control configuration.
 */
private static SentinelProperty<ServerFlowConfig> globalFlowProperty = new DynamicSentinelProperty<>();
private static final PropertyListener<ServerTransportConfig> TRANSPORT_PROPERTY_LISTENER
    = new ServerGlobalTransportPropertyListener();
private static final PropertyListener<ServerFlowConfig> GLOBAL_FLOW_PROPERTY_LISTENER
    = new ServerGlobalFlowPropertyListener();
private static final PropertyListener<Set<String>> NAMESPACE_SET_PROPERTY_LISTENER
    = new ServerNamespaceSetPropertyListener();
static {
    transportConfigProperty.addListener(TRANSPORT_PROPERTY_LISTENER);
    globalFlowProperty.addListener(GLOBAL_FLOW_PROPERTY_LISTENER);
    namespaceSetProperty.addListener(NAMESPACE_SET_PROPERTY_LISTENER);
}
```

## ServerGlobalTransportPropertyListener

监听server的端口配置

当我们修改端口，保存后，sentinel后台会调用服务的sentinel-api /cluster/server/modifyTransportConfig

进而触发transportConfigProperty的改变，进而再触发ServerGlobalTransportPropertyListener的configUpdate方法，最后会重启token-server到新的端口

com.alibaba.csp.sentinel.cluster.server.config.ClusterServerConfigManager.ServerGlobalTransportPropertyListener#configUpdate

```java
@Override
public void configUpdate(ServerTransportConfig config) {
    applyConfig(config);
}
```

com.alibaba.csp.sentinel.cluster.server.config.ClusterServerConfigManager.ServerGlobalTransportPropertyListener#applyConfig

```java
private synchronized void applyConfig(ServerTransportConfig config) {
    if (!isValidTransportConfig(config)) {
        RecordLog.warn(
            "[ClusterServerConfigManager] Invalid cluster server transport config, ignoring: {}", config);
        return;
    }
    RecordLog.info("[ClusterServerConfigManager] Updating new server transport config: {}", config);
    if (config.getIdleSeconds() != idleSeconds) {
        idleSeconds = config.getIdleSeconds();
    }
    //!!!
    updateTokenServer(config);
}
```

com.alibaba.csp.sentinel.cluster.server.config.ClusterServerConfigManager#updateTokenServer

```java
private static void updateTokenServer(ServerTransportConfig config) {
    int newPort = config.getPort();
    AssertUtil.isTrue(newPort > 0, "token server port should be valid (positive)");
    if (newPort == port) {
        return;
    }
    ClusterServerConfigManager.port = newPort;
    for (ServerTransportConfigObserver observer : TRANSPORT_CONFIG_OBSERVERS) {
        //!!!
        observer.onTransportConfigChange(config);
    }
}
```

com.alibaba.csp.sentinel.cluster.server.SentinelDefaultTokenServer#changeServerConfig

```java
private synchronized void changeServerConfig(ServerTransportConfig config) {
    if (config == null || config.getPort() <= 0) {
        return;
    }
    int newPort = config.getPort();
    if (newPort == port) {
        return;
    }
    try {
        if (server != null) {
            stopServer();
        }
        this.server = new NettyTransportServer(newPort);
        this.port = newPort;
        startServerIfScheduled();
    } catch (Exception ex) {
        RecordLog.warn("[SentinelDefaultTokenServer] Failed to apply modification to token server", ex);
    }
}
```

## ServerGlobalFlowPropertyListener

监听token-server最大允许qps的改变

当我们修改最大允许QPS并保存后，sentinel后台会调用服务的token-api cluster/server/modifyFlowConfig

进而触发globalFlowProperty的改变，进而再触发ServerGlobalFlowPropertyListener的configUpdate方法

## ServerNamespaceSetPropertyListener

待研究
