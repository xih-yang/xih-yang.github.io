# 06、Sentinel源码解析，Sentinel是如何动态加载配置限流的？
- 来源：https://ddkk.com/zhuanlan/guarantee/sentinelym/6.html
- 分类：服务保障
- 分组：Sentinel 源码解析
有时候我们做限流的时候并不想直接写死在代码里面，然后每次要改规则，或者增加规则的时候只能去重启应用来解决。而是希望能够动态的更改配置，这样万一出现紧急情况还能动态的进行配置修改。例如2018年的双十一，淘宝的其他服务没有一点问题，万万没想到在前几分钟购物车服务挂了，这个时候就可以紧急限流，对应用进行拯救。

其实看完前面的内容，对动态配置应该是水到渠成的事情，因为所有的配置修改都是通过限流管理器如FlowRuleManager的内部监听器来实现的，所以只要动态的给监听器信号，那么就可以做到动态的修改配置。

接下来我们来看看Sentinel是怎么做的。一般的情况下，动态配置常见的实现方式有两种：

- 拉模式：客户端主动向某个规则管理中心定期轮询拉取规则，这个规则中心可以是 RDBMS、文件，甚至是 VCS 等。这样做的方式是简单，缺点是无法及时获取变更；
- 推模式：规则中心统一推送，客户端通过注册监听器的方式时刻监听变化，比如使用 Nacos、Zookeeper 等配置中心。这种方式有更好的实时性和一致性保证。

**而Sentinel目前两种都支持**

- Pull-based: 文件、Consul (since 1.7.0)
- Push-based: ZooKeeper, Redis, Nacos, Apollo

由于支持的方式太多，我这里只讲解两种，文件和ZooKeeper，分别对应推拉两种模式。

### Pull-based： 文件

首先上个例子：

FlowRule.json

```bash
[
  {
    "resource": "abc",
    "controlBehavior": 0,
    "count": 20.0,
    "grade": 1,
    "limitApp": "default",
    "strategy": 0
  },
  {
    "resource": "abc1",
    "controlBehavior": 0,
    "count": 20.0,
    "grade": 1,
    "limitApp": "default",
    "strategy": 0
  }
]
```

SimpleFileDataSourceDemo：

```java
public class SimpleFileDataSourceDemo {
    private static final String KEY = "abc";
    public static void main(String[] args) throws Exception {
        SimpleFileDataSourceDemo simpleFileDataSourceDemo = new SimpleFileDataSourceDemo();
        simpleFileDataSourceDemo.init();
        Entry entry = null;
        try {
            entry = SphU.entry(KEY);
            // dosomething
        } catch (BlockException e1) {
            // dosomething
        } catch (Exception e2) {
            // biz exception
        } finally {
            if (entry != null) {
                entry.exit();
            }
        }
    }
    private void init() throws Exception {
       String flowRulePath = "/Users/luozhiyun/Downloads/test/FlowRule.json";
        // Data source for FlowRule
        FileRefreshableDataSource<List<FlowRule>> flowRuleDataSource = new FileRefreshableDataSource<>(
                flowRulePath, flowRuleListParser);
        FlowRuleManager.register2Property(flowRuleDataSource.getProperty());
    }
    private Converter<String, List<FlowRule>> flowRuleListParser = source -> JSON.parseObject(source,
            new TypeReference<List<FlowRule>>() {});
}
```

这个例子主要就是写死一个资源文件，然后读取资源文件里面的内容，再通过自定义的资源解析器来解析文件的内容后设置规则。

这里我们主要需要分析FileRefreshableDataSource是怎么加载文件然后通过FlowRuleManager注册的。

FileRefreshableDataSource继承关系：

**FileRefreshableDataSource**

```java
private static final int MAX_SIZE = 1024 * 1024 * 4;
private static final long DEFAULT_REFRESH_MS = 3000;
private static final int DEFAULT_BUF_SIZE = 1024 * 1024;
private static final Charset DEFAULT_CHAR_SET = Charset.forName("utf-8");
public FileRefreshableDataSource(String fileName, Converter<String, T> configParser) throws FileNotFoundException {
    this(new File(fileName), configParser, DEFAULT_REFRESH_MS, DEFAULT_BUF_SIZE, DEFAULT_CHAR_SET);
}
public FileRefreshableDataSource(File file, Converter<String, T> configParser, long recommendRefreshMs, int bufSize,
                                 Charset charset) throws FileNotFoundException {
    super(configParser, recommendRefreshMs);
    if (bufSize <= 0 || bufSize > MAX_SIZE) {
        throw new IllegalArgumentException("bufSize must between (0, " + MAX_SIZE + "], but " + bufSize + " get");
    }
    if (file == null || file.isDirectory()) {
        throw new IllegalArgumentException("File can't be null or a directory");
    }
    if (charset == null) {
        throw new IllegalArgumentException("charset can't be null");
    }
    this.buf = new byte[bufSize];
    this.file = file;
    this.charset = charset;
    // If the file does not exist, the last modified will be 0.
    this.lastModified = file.lastModified();
    firstLoad();
}
```

FileRefreshableDataSource的构造器里面会设置各种参数，如：缓冲区大小、字符编码、文件上次的修改时间、文件定时刷新时间等。

这个方法会调用父类的构造器进行初始化，我们再看一下AutoRefreshDataSource做了什么。

**AutoRefreshDataSource**

```java
public AutoRefreshDataSource(Converter<S, T> configParser, final long recommendRefreshMs) {
    super(configParser);
    if (recommendRefreshMs <= 0) {
        throw new IllegalArgumentException("recommendRefreshMs must > 0, but " + recommendRefreshMs + " get");
    }
    this.recommendRefreshMs = recommendRefreshMs;
    startTimerService();
}
```

AutoRefreshDataSource的构造器一开始会调用父类的构造器进行初始化，如下：

**AbstractDataSource**

```java
public AbstractDataSource(Converter<S, T> parser) {
    if (parser == null) {
        throw new IllegalArgumentException("parser can't be null");
    }
    this.parser = parser;
    this.property = new DynamicSentinelProperty<T>();
}
```

AbstractDataSource的构造器是为了给两个变量设值parser和property，其中property是DynamicSentinelProperty的实例。

我们再回到AutoRefreshDataSource中，AutoRefreshDataSource设值完recommendRefreshMs参数后会调用startTimerService方法来开启一个定时的调度任务。

**AutoRefreshDataSource#startTimerService**

```java
private void startTimerService() {
    service = Executors.newScheduledThreadPool(1,
        new NamedThreadFactory("sentinel-datasource-auto-refresh-task", true));
    service.scheduleAtFixedRate(new Runnable() {
        @Override
        public void run() {
            try {
                if (!isModified()) {
                    return;
                }
                T newValue = loadConfig();
                getProperty().updateValue(newValue);
            } catch (Throwable e) {
                RecordLog.info("loadConfig exception", e);
            }
        }
    }, recommendRefreshMs, recommendRefreshMs, TimeUnit.MILLISECONDS);
}
public SentinelProperty<T> getProperty() {
    return property;
}
```

这个方法里面会开启一个线程，每3000ms调用一次run方法。run方法里会首先会校验一下文件有没有被修改过，如果有的话就调用loadConfig来加载配置，然后调用getProperty方法获取父类设置的property来更新配置。

下来我们依次来讲解一下这几个主要的方法：

isModified方法是一个钩子，调用的是FileRefreshableDataSource的isModified方法：

**FileRefreshableDataSource#isModified**

```java
protected boolean isModified() {
    long curLastModified = file.lastModified();
    if (curLastModified != this.lastModified) {
        this.lastModified = curLastModified;
        return true;
    }
    return false;
}
```

isModified每次都会查看file有没有被修改，并记录一下修改的时间。

接着往下是调用loadConfig加载文件：

**AbstractDataSource#loadConfig**

```java
public T loadConfig() throws Exception {
    return loadConfig(readSource());
}
public T loadConfig(S conf) throws Exception {
    T value = parser.convert(conf);
    return value;
}
```

**FileRefreshableDataSource#readSource**

```java
public String readSource() throws Exception {
    if (!file.exists()) {
        // Will throw FileNotFoundException later.
        RecordLog.warn(String.format("[FileRefreshableDataSource] File does not exist: %s", file.getAbsolutePath()));
    }
    FileInputStream inputStream = null;
    try {
        inputStream = new FileInputStream(file);
        FileChannel channel = inputStream.getChannel();
        if (channel.size() > buf.length) {
            throw new IllegalStateException(file.getAbsolutePath() + " file size=" + channel.size()
                + ", is bigger than bufSize=" + buf.length + ". Can't read");
        }
        int len = inputStream.read(buf);
        return new String(buf, 0, len, charset);
    } finally {
        if (inputStream != null) {
            try {
                inputStream.close();
            } catch (Exception ignore) {
            }
        }
    }
}
```

loadConfig方法的实现还是很清晰的，首先是调用readSource通过io流读取文件，然后再通过传入的解析器解析文件的内容。

接着会调用DynamicSentinelProperty的updateValue方法，遍历监听器更新配置：

**DynamicSentinelProperty#updateValue**

```java
public boolean updateValue(T newValue) {
    //判断新的元素和旧元素是否相同
    if (isEqual(value, newValue)) {
        return false;
    }
    RecordLog.info("[DynamicSentinelProperty] Config will be updated to: " + newValue);
    value = newValue;
    for (PropertyListener<T> listener : listeners) {
        listener.configUpdate(newValue);
    }
    return true;
}
```

当然，还没加载FlowRuleManager的时候肯定是没有监听器的。

讲完了FileRefreshableDataSource的父类的加载，我们再回到FileRefreshableDataSource的构造器中。继续往下走会调用firstLoad方法首次加载配置文件初始化一次。

**FileRefreshableDataSource#firstLoad**

```java
private void firstLoad() {
    try {
        T newValue = loadConfig();
        getProperty().updateValue(newValue);
    } catch (Throwable e) {
        RecordLog.info("loadConfig exception", e);
    }
}
```

下面我们再看一下FlowRuleManager是怎么注册的。注册的时候会调用register2Property方法进行注册：

**FlowRuleManager#register2Property**

```java
public static void register2Property(SentinelProperty<List<FlowRule>> property) {
    AssertUtil.notNull(property, "property cannot be null");
    synchronized (LISTENER) {
        RecordLog.info("[FlowRuleManager] Registering new property to flow rule manager");
        currentProperty.removeListener(LISTENER);
        property.addListener(LISTENER);
        currentProperty = property;
    }
}
```

这个方法实际上就是添加了一个监听器，然后将FlowRuleManager的currentProperty替换成flowRuleDataSource创建的property。然后flowRuleDataSource里面的定时线程会每隔3秒钟调用一下这个LISTENER的configUpdate方法进行刷新规则，这样就实现了动态更新规则。

### Push-based：ZooKeeper

我们还是先给出一个例子：

```java
public static void main(String[] args) { 
    final String remoteAddress = "127.0.0.1:2181";
    final String path = "/Sentinel-Demo/SYSTEM-CODE-DEMO-FLOW";
    ReadableDataSource<String, List<FlowRule>> flowRuleDataSource = new ZookeeperDataSource<>(remoteAddress, path,
            source -> JSON.parseObject(source, new TypeReference<List<FlowRule>>() {}));
    FlowRuleManager.register2Property(flowRuleDataSource.getProperty()); 
}
```

在这里我定义了`/Sentinel-Demo/SYSTEM-CODE-DEMO-FLOW`这个path，如果这个path内的内容发生了变化，那么就会刷新规则。

我们先看一下ZookeeperDataSource的继承关系：

**ZookeeperDataSource**

```java
public ZookeeperDataSource(final String serverAddr, final String path, Converter<String, T> parser) {
    super(parser);
    if (StringUtil.isBlank(serverAddr) || StringUtil.isBlank(path)) {
        throw new IllegalArgumentException(String.format("Bad argument: serverAddr=[%s], path=[%s]", serverAddr, path));
    }
    this.path = path;
    init(serverAddr, null);
}
```

**AbstractDataSource**

```java
public AbstractDataSource(Converter<S, T> parser) {
    if (parser == null) {
        throw new IllegalArgumentException("parser can't be null");
    }
    this.parser = parser;
    this.property = new DynamicSentinelProperty<T>();
}
```

ZookeeperDataSource首先会调用父类进行参数的设置，在校验完之后调用init方法进行初始化。

**ZookeeperDataSource#init**

```java
private void init(final String serverAddr, final List<AuthInfo> authInfos) {
    initZookeeperListener(serverAddr, authInfos);
    loadInitialConfig();
}
```

**ZookeeperDataSource#initZookeeperListener**

```java
private void initZookeeperListener(final String serverAddr, final List<AuthInfo> authInfos) {
    try {
        //设置监听
        this.listener = new NodeCacheListener() {
            @Override
            public void nodeChanged() {
                try {
                    T newValue = loadConfig();
                    RecordLog.info(String.format("[ZookeeperDataSource] New property value received for (%s, %s): %s",
                            serverAddr, path, newValue));
                    // Update the new value to the property.
                    getProperty().updateValue(newValue);
                } catch (Exception ex) {
                    RecordLog.warn("[ZookeeperDataSource] loadConfig exception", ex);
                }
            }
        };
        String zkKey = getZkKey(serverAddr, authInfos);
        if (zkClientMap.containsKey(zkKey)) {
            this.zkClient = zkClientMap.get(zkKey);
        } else {
            //如果key不存在，那么就加锁设值
            synchronized (lock) {
                if (!zkClientMap.containsKey(zkKey)) {
                    CuratorFramework zc = null;
                    //根据不同的条件获取client
                    if (authInfos == null || authInfos.size() == 0) {
                        zc = CuratorFrameworkFactory.newClient(serverAddr, new ExponentialBackoffRetry(SLEEP_TIME, RETRY_TIMES));
                    } else {
                        zc = CuratorFrameworkFactory.builder().
                                connectString(serverAddr).
                                retryPolicy(new ExponentialBackoffRetry(SLEEP_TIME, RETRY_TIMES)).
                                authorization(authInfos).
                                build();
                    }
                    this.zkClient = zc;
                    this.zkClient.start();
                    Map<String, CuratorFramework> newZkClientMap = new HashMap<>(zkClientMap.size());
                    newZkClientMap.putAll(zkClientMap);
                    newZkClientMap.put(zkKey, zc);
                    zkClientMap = newZkClientMap;
                } else {
                    this.zkClient = zkClientMap.get(zkKey);
                }
            }
        }
        //为节点添加watcher
        //监听数据节点的变更，会触发事件
        this.nodeCache = new NodeCache(this.zkClient, this.path);
        this.nodeCache.getListenable().addListener(this.listener, this.pool);
        this.nodeCache.start();
    } catch (Exception e) {
        RecordLog.warn("[ZookeeperDataSource] Error occurred when initializing Zookeeper data source", e);
        e.printStackTrace();
    }
}
```

这个方法主要就是用来创建client和设值监听，都是zk的常规操作，不熟悉的，可以去看看Curator是怎么使用的。

```java
private void loadInitialConfig() {
    try {
        //调用父类的loadConfig方法
        T newValue = loadConfig();
        if (newValue == null) {
            RecordLog.warn("[ZookeeperDataSource] WARN: initial config is null, you may have to check your data source");
        }
        getProperty().updateValue(newValue);
    } catch (Exception ex) {
        RecordLog.warn("[ZookeeperDataSource] Error when loading initial config", ex);
    }
}
```

设值完zk的client和监听后会调用一次updateValue，首次加载节点的信息。

**AbstractDataSource**

```java
public T loadConfig() throws Exception {
    return loadConfig(readSource());
}
public T loadConfig(S conf) throws Exception {
    T value = parser.convert(conf);
    return value;
}
```

父类的loadConfig会调用子类的readSource读取配置信息，然后调用parser.convert进行反序列化。

**ZookeeperDataSource#readSource**

```java
public String readSource() throws Exception {
    if (this.zkClient == null) {
        throw new IllegalStateException("Zookeeper has not been initialized or error occurred");
    }
    String configInfo = null;
    ChildData childData = nodeCache.getCurrentData();
    if (null != childData && childData.getData() != null) {
        configInfo = new String(childData.getData());
    }
    return configInfo;
}
```

这个方法是用来读取zk节点里面的信息。

最后FlowRuleManager.register2Property的方法就和上面的文件动态配置的是一样的了。
