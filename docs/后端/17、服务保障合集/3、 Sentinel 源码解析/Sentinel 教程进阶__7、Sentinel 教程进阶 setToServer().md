# 7、Sentinel 教程进阶 setToServer()
- 来源：https://ddkk.com/zhuanlan/guarantee/sentinelym/27.html
- 分类：服务保障
- 分组：Sentinel 教程进阶
```java
public static boolean setToServer() {
    if (mode == 1) {
        return true;
    } else {
        mode = 1;
        sleepIfNeeded();
        lastModified = TimeUtil.currentTimeMillis();
        //启动server
        return startServer();
    }
}
```

```java
private static boolean startServer() {
    try {
        ClusterTokenClient tokenClient = TokenClientProvider.getClient();
        if (tokenClient != null) {
            tokenClient.stop();
        }
        //获取server并启动
        EmbeddedClusterTokenServer server = EmbeddedClusterTokenServerProvider.getServer();
        if (server != null) {
            //启动server(实际上是启动一个netty server)
            server.start();
            RecordLog.info("[ClusterStateManager] Changing cluster mode to server", new Object[0]);
            return true;
        } else {
            RecordLog.warn("[ClusterStateManager] Cannot change to server (no server SPI found)", new Object[0]);
            return false;
        }
    } catch (Exception var2) {
        RecordLog.warn("[ClusterStateManager] Error when changing cluster mode to server", var2);
        return false;
    }
}
public final class EmbeddedClusterTokenServerProvider {
    private static EmbeddedClusterTokenServer server = null;
    static {
        //类加载的时候加载spiEmbeddedClusterTokenServer
        resolveInstance();
    }
    private static void resolveInstance() {
        EmbeddedClusterTokenServer s = (EmbeddedClusterTokenServer)SpiLoader.of(EmbeddedClusterTokenServer.class).loadFirstInstance();
        if (s == null) {
            RecordLog.warn("[EmbeddedClusterTokenServerProvider] No existing cluster token server, cluster server mode will not be activated", new Object[0]);
        } else {
            server = s;
            RecordLog.info("[EmbeddedClusterTokenServerProvider] Cluster token server resolved: {}", new Object[]{server.getClass().getCanonicalName()});
        }
    }
    //返回server
    public static EmbeddedClusterTokenServer getServer() {
        return server;
    }
}
```

```java
com.alibaba.csp.sentinel.cluster.server.DefaultEmbeddedTokenServer
```

## DefaultEmbeddedTokenServer

```java
public class DefaultEmbeddedTokenServer implements EmbeddedClusterTokenServer {
    private final TokenService tokenService = TokenServiceProvider.getService();
    private final ClusterTokenServer server = new SentinelDefaultTokenServer(true);
    public DefaultEmbeddedTokenServer() {
    }
    public void start() throws Exception {
        this.server.start();
    }
    public void stop() throws Exception {
        this.server.stop();
    }
    public TokenResult requestToken(Long ruleId, int acquireCount, boolean prioritized) {
        return this.tokenService != null ? this.tokenService.requestToken(ruleId, acquireCount, prioritized) : new TokenResult(-1);
    }
    public TokenResult requestParamToken(Long ruleId, int acquireCount, Collection<Object> params) {
        return this.tokenService != null ? this.tokenService.requestParamToken(ruleId, acquireCount, params) : new TokenResult(-1);
    }
    public TokenResult requestConcurrentToken(String clientAddress, Long ruleId, int acquireCount) {
        return null;
    }
    public void releaseConcurrentToken(Long tokenId) {
    }
}
```

## SentinelDefaultTokenServer

```java
public SentinelDefaultTokenServer() {
    this(false);
}
public SentinelDefaultTokenServer(boolean embedded) {
    this.shouldStart = new AtomicBoolean(false);
    this.embedded = embedded;
    //ClusterServerConfigManager添加监听
    ClusterServerConfigManager.addTransportConfigChangeObserver(new ServerTransportConfigObserver() {
        public void onTransportConfigChange(ServerTransportConfig config) {
            SentinelDefaultTokenServer.this.changeServerConfig(config);
        }
    });
    //初始化server
    this.initNewServer();
}
private void initNewServer() {
    if (this.server == null) {
        int port = ClusterServerConfigManager.getPort();
        if (port > 0) {
            //server为一个netty server
            this.server = new NettyTransportServer(port);
            this.port = port;
        }
    }
}
```
