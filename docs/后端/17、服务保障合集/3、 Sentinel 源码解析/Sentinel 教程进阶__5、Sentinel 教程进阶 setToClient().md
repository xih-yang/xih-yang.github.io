# 5、Sentinel 教程进阶 setToClient()
- 来源：https://ddkk.com/zhuanlan/guarantee/sentinelym/25.html
- 分类：服务保障
- 分组：Sentinel 教程进阶
```java
public static boolean setToClient() {
    if (mode == CLUSTER_CLIENT) {
        return true;
    }
    mode = CLUSTER_CLIENT;
    sleepIfNeeded();
    lastModified = TimeUtil.currentTimeMillis();
    return startClient();
}
```

```java
private static boolean startClient() {
    try {
        EmbeddedClusterTokenServer server = EmbeddedClusterTokenServerProvider.getServer();
        if (server != null) {
            server.stop();
        }
        //!!!
        ClusterTokenClient tokenClient = TokenClientProvider.getClient();
        if (tokenClient != null) {
            tokenClient.start();
            RecordLog.info("[ClusterStateManager] Changing cluster mode to client");
            return true;
        } else {
            RecordLog.warn("[ClusterStateManager] Cannot change to client (no client SPI found)");
            return false;
        }
    } catch (Exception ex) {
        RecordLog.warn("[ClusterStateManager] Error when changing cluster mode to client", ex);
        return false;
    }
}
```

spiclient配置

## DefaultClusterTokenClient

```java
//client属性
private ClusterTransportClient transportClient;
//启动
@Override
public void start() throws Exception {
    if (shouldStart.compareAndSet(false, true)) {
        startClientIfScheduled();
    }
}
private void startClientIfScheduled() throws Exception {
    if (shouldStart.get()) {
        if (transportClient != null) {
            //调用client start方法
            transportClient.start();
        } else {
            RecordLog.warn("[DefaultClusterTokenClient] Cannot start transport client: client not created");
        }
    }
}
public DefaultClusterTokenClient() {
    ClusterClientConfigManager.addServerChangeObserver(new ServerChangeObserver() {
        @Override
        public void onRemoteServerChange(ClusterClientAssignConfig assignConfig) {
            changeServer(assignConfig);
        }
    });
    //在构造方法中会初始化client
    initNewConnection();
}
private void initNewConnection() {
    if (transportClient != null) {
        return;
    }
    String host = ClusterClientConfigManager.getServerHost();
    int port = ClusterClientConfigManager.getServerPort();
    if (StringUtil.isBlank(host) || port <= 0) {
        return;
    }
    try {
        //client 是netty client
        this.transportClient = new NettyTransportClient(host, port);
        this.serverDescriptor = new TokenServerDescriptor(host, port);
        RecordLog.info("[DefaultClusterTokenClient] New client created: {}", serverDescriptor);
    } catch (Exception ex) {
        RecordLog.warn("[DefaultClusterTokenClient] Failed to initialize new token client", ex);
    }
}
```
