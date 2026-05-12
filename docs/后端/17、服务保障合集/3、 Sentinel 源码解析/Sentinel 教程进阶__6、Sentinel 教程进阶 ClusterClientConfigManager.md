# 6、Sentinel 教程进阶 ClusterClientConfigManager
- 来源：https://ddkk.com/zhuanlan/guarantee/sentinelym/26.html
- 分类：服务保障
- 分组：Sentinel 教程进阶
```java
private static SentinelProperty<ClusterClientConfig> clientConfigProperty = new DynamicSentinelProperty<>();
private static SentinelProperty<ClusterClientAssignConfig> clientAssignProperty = new DynamicSentinelProperty<>();
private static final PropertyListener<ClusterClientConfig> CONFIG_PROPERTY_LISTENER
    = new ClientConfigPropertyListener();
private static final PropertyListener<ClusterClientAssignConfig> ASSIGN_PROPERTY_LISTENER
    = new ClientAssignPropertyListener();
private static final List<ServerChangeObserver> SERVER_CHANGE_OBSERVERS = new ArrayList<>();
static {
    bindPropertyListener();
}
private static void bindPropertyListener() {
    removePropertyListener();
    clientAssignProperty.addListener(ASSIGN_PROPERTY_LISTENER);
    clientConfigProperty.addListener(CONFIG_PROPERTY_LISTENER);
}
```

## ClientConfigPropertyListener

主要监听请求超时时间的改变（sentinel后台管理并没有开放这个属性）

com.alibaba.csp.sentinel.cluster.client.config.ClusterClientConfigManager.ClientConfigPropertyListener#configLoad

```java
@Override
public void configLoad(ClusterClientConfig config) {
    if (config == null) {
        RecordLog.warn("[ClusterClientConfigManager] Empty initial client config");
        return;
    }
    applyConfig(config);
}
```

com.alibaba.csp.sentinel.cluster.client.config.ClusterClientConfigManager.ClientConfigPropertyListener#applyConfig

```java
private synchronized void applyConfig(ClusterClientConfig config) {
        if (!isValidClientConfig(config)) {
            RecordLog.warn(
                "[ClusterClientConfigManager] Invalid cluster client config, ignoring: {}", config);
            return;
        }
        RecordLog.info("[ClusterClientConfigManager] Updating to new client config: {}", config);
        updateClientConfigChange(config);
    }
}
private static void updateClientConfigChange(ClusterClientConfig config) {
    if (config.getRequestTimeout() != requestTimeout) {
        requestTimeout = config.getRequestTimeout();
    }
}
```

## 控制netty请求token时的超时时间

## ClientAssignPropertyListener

主要监听token-client应该连接的token-server的ip和端口

```java
@Override
public void configLoad(ClusterClientAssignConfig config) {
    if (config == null) {
        RecordLog.warn("[ClusterClientConfigManager] Empty initial client assignment config");
        return;
    }
    applyConfig(config);
}
```

com.alibaba.csp.sentinel.cluster.client.config.ClusterClientConfigManager.ClientAssignPropertyListener#applyConfig

```java
private synchronized void applyConfig(ClusterClientAssignConfig config) {
    if (!isValidAssignConfig(config)) {
        RecordLog.warn(
            "[ClusterClientConfigManager] Invalid cluster client assign config, ignoring: " + config);
        return;
    }
    if (serverPort == config.getServerPort() && config.getServerHost().equals(serverHost)) {
        return;
    }
    RecordLog.info("[ClusterClientConfigManager] Assign to new target token server: {}", config);
    updateServerAssignment(config);
}
```

com.alibaba.csp.sentinel.cluster.client.config.ClusterClientConfigManager#updateServerAssignment

```java
private static void updateServerAssignment(/*@Valid*/ ClusterClientAssignConfig config) {
    String host = config.getServerHost();
    int port = config.getServerPort();
    for (ServerChangeObserver observer : SERVER_CHANGE_OBSERVERS) {
        observer.onRemoteServerChange(config);
    }
    serverHost = host;
    serverPort = port;
}
```

com.alibaba.csp.sentinel.cluster.client.DefaultClusterTokenClient#changeServer

```java
private void changeServer(/*@Valid*/ ClusterClientAssignConfig config) {
    if (serverEqual(serverDescriptor, config)) {
        return;
    }
    try {
        //重启token-client客户端，连接新的token-server
        if (transportClient != null) {
            transportClient.stop();
        }
        // Replace with new, even if the new client is not ready.
        this.transportClient = new NettyTransportClient(config.getServerHost(), config.getServerPort());
        this.serverDescriptor = new TokenServerDescriptor(config.getServerHost(), config.getServerPort());
        startClientIfScheduled();
        RecordLog.info("[DefaultClusterTokenClient] New client created: {}", serverDescriptor);
    } catch (Exception ex) {
        RecordLog.warn("[DefaultClusterTokenClient] Failed to change remote token server", ex);
    }
}
```
