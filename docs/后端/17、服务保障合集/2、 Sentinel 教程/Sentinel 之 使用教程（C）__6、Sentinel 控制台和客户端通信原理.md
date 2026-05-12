# 6、Sentinel 控制台和客户端通信原理
- 来源：https://ddkk.com/zhuanlan/guarantee/sentinel/18.html
- 分类：服务保障
- 分组：Sentinel 之 使用教程（C）
## 控制台

控制台主要的处理类是 `FlowControllerV1` 。

```java
@RestController
@RequestMapping(value = "/v1/flow")
public class FlowControllerV1 {
    private final Logger logger = LoggerFactory.getLogger(FlowControllerV1.class);
    @Autowired
    private InMemoryRuleRepositoryAdapter<FlowRuleEntity> repository;
    @Autowired
    private SentinelApiClient sentinelApiClient;
    @GetMapping("/rules")
    @AuthAction(PrivilegeType.READ_RULE)
    public Result<List<FlowRuleEntity>> apiQueryMachineRules(@RequestParam String app,
                                                             @RequestParam String ip,
                                                             @RequestParam Integer port) {
        if (StringUtil.isEmpty(app)) {
            return Result.ofFail(-1, "app can't be null or empty");
        }
        if (StringUtil.isEmpty(ip)) {
            return Result.ofFail(-1, "ip can't be null or empty");
        }
        if (port == null) {
            return Result.ofFail(-1, "port can't be null");
        }
        try {
            List<FlowRuleEntity> rules = sentinelApiClient.fetchFlowRuleOfMachine(app, ip, port);
            rules = repository.saveAll(rules);
            return Result.ofSuccess(rules);
        } catch (Throwable throwable) {
            logger.error("Error when querying flow rules", throwable);
            return Result.ofThrowable(-1, throwable);
        }
    }
    private <R> Result<R> checkEntityInternal(FlowRuleEntity entity) {
        if (StringUtil.isBlank(entity.getApp())) {
            return Result.ofFail(-1, "app can't be null or empty");
        }
        if (StringUtil.isBlank(entity.getIp())) {
            return Result.ofFail(-1, "ip can't be null or empty");
        }
        if (entity.getPort() == null) {
            return Result.ofFail(-1, "port can't be null");
        }
        if (StringUtil.isBlank(entity.getLimitApp())) {
            return Result.ofFail(-1, "limitApp can't be null or empty");
        }
        if (StringUtil.isBlank(entity.getResource())) {
            return Result.ofFail(-1, "resource can't be null or empty");
        }
        if (entity.getGrade() == null) {
            return Result.ofFail(-1, "grade can't be null");
        }
        if (entity.getGrade() != 0 && entity.getGrade() != 1) {
            return Result.ofFail(-1, "grade must be 0 or 1, but " + entity.getGrade() + " got");
        }
        if (entity.getCount() == null || entity.getCount() < 0) {
            return Result.ofFail(-1, "count should be at lease zero");
        }
        if (entity.getStrategy() == null) {
            return Result.ofFail(-1, "strategy can't be null");
        }
        if (entity.getStrategy() != 0 && StringUtil.isBlank(entity.getRefResource())) {
            return Result.ofFail(-1, "refResource can't be null or empty when strategy!=0");
        }
        if (entity.getControlBehavior() == null) {
            return Result.ofFail(-1, "controlBehavior can't be null");
        }
        int controlBehavior = entity.getControlBehavior();
        if (controlBehavior == 1 && entity.getWarmUpPeriodSec() == null) {
            return Result.ofFail(-1, "warmUpPeriodSec can't be null when controlBehavior==1");
        }
        if (controlBehavior == 2 && entity.getMaxQueueingTimeMs() == null) {
            return Result.ofFail(-1, "maxQueueingTimeMs can't be null when controlBehavior==2");
        }
        if (entity.isClusterMode() && entity.getClusterConfig() == null) {
            return Result.ofFail(-1, "cluster config should be valid");
        }
        return null;
    }
    @PostMapping("/rule")
    @AuthAction(PrivilegeType.WRITE_RULE)
    public Result<FlowRuleEntity> apiAddFlowRule(@RequestBody FlowRuleEntity entity) {
        Result<FlowRuleEntity> checkResult = checkEntityInternal(entity);
        if (checkResult != null) {
            return checkResult;
        }
        entity.setId(null);
        Date date = new Date();
        entity.setGmtCreate(date);
        entity.setGmtModified(date);
        entity.setLimitApp(entity.getLimitApp().trim());
        entity.setResource(entity.getResource().trim());
        try {
            entity = repository.save(entity);
            publishRules(entity.getApp(), entity.getIp(), entity.getPort()).get(5000, TimeUnit.MILLISECONDS);
            return Result.ofSuccess(entity);
        } catch (Throwable t) {
            Throwable e = t instanceof ExecutionException ? t.getCause() : t;
            logger.error("Failed to add new flow rule, app={}, ip={}", entity.getApp(), entity.getIp(), e);
            return Result.ofFail(-1, e.getMessage());
        }
    }
    @PutMapping("/save.json")
    @AuthAction(PrivilegeType.WRITE_RULE)
    public Result<FlowRuleEntity> apiUpdateFlowRule(Long id, String app,
                                                  String limitApp, String resource, Integer grade,
                                                  Double count, Integer strategy, String refResource,
                                                  Integer controlBehavior, Integer warmUpPeriodSec,
                                                  Integer maxQueueingTimeMs) {
        if (id == null) {
            return Result.ofFail(-1, "id can't be null");
        }
        FlowRuleEntity entity = repository.findById(id);
        if (entity == null) {
            return Result.ofFail(-1, "id " + id + " dose not exist");
        }
        if (StringUtil.isNotBlank(app)) {
            entity.setApp(app.trim());
        }
        if (StringUtil.isNotBlank(limitApp)) {
            entity.setLimitApp(limitApp.trim());
        }
        if (StringUtil.isNotBlank(resource)) {
            entity.setResource(resource.trim());
        }
        if (grade != null) {
            if (grade != 0 && grade != 1) {
                return Result.ofFail(-1, "grade must be 0 or 1, but " + grade + " got");
            }
            entity.setGrade(grade);
        }
        if (count != null) {
            entity.setCount(count);
        }
        if (strategy != null) {
            if (strategy != 0 && strategy != 1 && strategy != 2) {
                return Result.ofFail(-1, "strategy must be in [0, 1, 2], but " + strategy + " got");
            }
            entity.setStrategy(strategy);
            if (strategy != 0) {
                if (StringUtil.isBlank(refResource)) {
                    return Result.ofFail(-1, "refResource can't be null or empty when strategy!=0");
                }
                entity.setRefResource(refResource.trim());
            }
        }
        if (controlBehavior != null) {
            if (controlBehavior != 0 && controlBehavior != 1 && controlBehavior != 2) {
                return Result.ofFail(-1, "controlBehavior must be in [0, 1, 2], but " + controlBehavior + " got");
            }
            if (controlBehavior == 1 && warmUpPeriodSec == null) {
                return Result.ofFail(-1, "warmUpPeriodSec can't be null when controlBehavior==1");
            }
            if (controlBehavior == 2 && maxQueueingTimeMs == null) {
                return Result.ofFail(-1, "maxQueueingTimeMs can't be null when controlBehavior==2");
            }
            entity.setControlBehavior(controlBehavior);
            if (warmUpPeriodSec != null) {
                entity.setWarmUpPeriodSec(warmUpPeriodSec);
            }
            if (maxQueueingTimeMs != null) {
                entity.setMaxQueueingTimeMs(maxQueueingTimeMs);
            }
        }
        Date date = new Date();
        entity.setGmtModified(date);
        try {
            entity = repository.save(entity);
            if (entity == null) {
                return Result.ofFail(-1, "save entity fail: null");
            }
            publishRules(entity.getApp(), entity.getIp(), entity.getPort()).get(5000, TimeUnit.MILLISECONDS);
            return Result.ofSuccess(entity);
        } catch (Throwable t) {
            Throwable e = t instanceof ExecutionException ? t.getCause() : t;
            logger.error("Error when updating flow rules, app={}, ip={}, ruleId={}", entity.getApp(),
                entity.getIp(), id, e);
            return Result.ofFail(-1, e.getMessage());
        }
    }
    @DeleteMapping("/delete.json")
    @AuthAction(PrivilegeType.WRITE_RULE)
    public Result<Long> apiDeleteFlowRule(Long id) {
        if (id == null) {
            return Result.ofFail(-1, "id can't be null");
        }
        FlowRuleEntity oldEntity = repository.findById(id);
        if (oldEntity == null) {
            return Result.ofSuccess(null);
        }
        try {
            repository.delete(id);
        } catch (Exception e) {
            return Result.ofFail(-1, e.getMessage());
        }
        try {
            publishRules(oldEntity.getApp(), oldEntity.getIp(), oldEntity.getPort()).get(5000, TimeUnit.MILLISECONDS);
            return Result.ofSuccess(id);
        } catch (Throwable t) {
            Throwable e = t instanceof ExecutionException ? t.getCause() : t;
            logger.error("Error when deleting flow rules, app={}, ip={}, id={}", oldEntity.getApp(),
                oldEntity.getIp(), id, e);
            return Result.ofFail(-1, e.getMessage());
        }
    }
    private CompletableFuture<Void> publishRules(String app, String ip, Integer port) {
        List<FlowRuleEntity> rules = repository.findAllByMachine(MachineInfo.of(app, ip, port));
        return sentinelApiClient.setFlowRuleOfMachineAsync(app, ip, port, rules);
    }
}
```

从上面可以看出来，dashboard 是通过一个叫 SentinelApiClient 的类去指定的 ip 和 port 处获取数据的。这个 ip 和 port 是前端页面直接提交给后端的，而前端页面又是通过 /app/{app}/machines.json 接口获取机器列表的。

## 连接 dashboard

sentinel-core 在初始化的时候，通过 JVM 参数中指定的 dashboard 的 ip 和 port，会主动向 dashboard 发起连接的请求，该请求是通过 HeartbeatSender 接口以心跳的方式发送的，并将自己的 ip 和 port 告知 dashboard。这里 sentinel-core 上报给 dashboard 的端口是 sentinel 对外暴露的自己的 CommandCenter 的端口。

HeartbeatSender 有两个实现类，一个是通过 http，另一个是通过 netty，我们看 http 的实现类：

**SimpleHttpHeartbeatSender.java**

```java
private final HeartbeatMessage heartBeat = new HeartbeatMessage();
private final SimpleHttpClient httpClient = new SimpleHttpClient();
@Override
public boolean sendHeartbeat() throws Exception {
    if (TransportConfig.getRuntimePort() <= 0) {
        RecordLog.info("[SimpleHttpHeartbeatSender] Runtime port not initialized, won't send heartbeat");
        return false;
    }
    InetSocketAddress addr = getAvailableAddress();
    if (addr == null) {
        return false;
    }
    SimpleHttpRequest request = new SimpleHttpRequest(addr, HEARTBEAT_PATH);
    request.setParams(heartBeat.generateCurrentMessage());
    try {
        SimpleHttpResponse response = httpClient.post(request);
        if (response.getStatusCode() == OK_STATUS) {
            return true;
        }
    } catch (Exception e) {
        RecordLog.warn("[SimpleHttpHeartbeatSender] Failed to send heartbeat to " + addr + " : ", e);
    }
    return false;
}
```

通过一个 HttpClient 向 dashboard 发送了自己的信息，包括 ip port 和版本号等信息。

其中consoleHost 和 consolePort 的值就是从 JVM 参数 csp.sentinel.dashboard.server 中获取的。

dashboard 在接收到 sentinel-core 的连接之后，就会与 sentinel-core 建立连接，并将 sentinel-core 上报的 ip 和 port 的信息包装成一个 MachineInfo 对象，然后通过 SimpleMachineDiscovery 将该对象保存在一个 map 中，如下图所示：

## 请求数据

当dashboard 有了具体的 sentinel-core 实例的 ip 和 port 之后，就可以去请求所需要的数据了。

让我们再回到最开始的地方，我在页面上查询某一台机器的限流的规则时，是将该机器的 ip 和 port 以及 appName 都传给了服务端，服务端通过这些信息去具体的远程实例中请求所需的数据，拿到数据后再封装成 dashboard 所需的格式返回给前端页面进行展示。

具体请求限流规则列表的代码在 SentinelApiClient 中，如下所示：

**SentinelApiClient.java**

```java
public List<FlowRuleEntity> fetchFlowRuleOfMachine(String app, String ip, int port) {
    String url = "http://" + ip + ":" + port + "/" + GET_RULES_PATH + "?type=" + FLOW_RULE_TYPE;
    String body = httpGetContent(url);
    logger.info("FlowRule Body:{}", body);
    List<FlowRule> rules = RuleUtils.parseFlowRule(body);
    if (rules != null) {
        return rules.stream().map(rule -> FlowRuleEntity.fromFlowRule(app, ip, port, rule))
            .collect(Collectors.toList());
    } else {
        return null;
    }
}
```

可以看到也是通过一个 httpClient 请求的数据，然后再对结果进行转换，具体请求的过程是在 httpGetContent 方法中进行的，我们看下该方法，如下所示：

```java
private String httpGetContent(String url) {
    final HttpGet httpGet = new HttpGet(url);
    final CountDownLatch latch = new CountDownLatch(1);
    final AtomicReference<String> reference = new AtomicReference<>();
    httpClient.execute(httpGet, new FutureCallback<HttpResponse>() {
        @Override
        public void completed(final HttpResponse response) {
            try {
                reference.set(getBody(response));
            } catch (Exception e) {
                logger.info("httpGetContent " + url + " error:", e);
            } finally {
                latch.countDown();
            }
        }
        @Override
        public void failed(final Exception ex) {
            latch.countDown();
            logger.info("httpGetContent " + url + " failed:", ex);
        }
        @Override
        public void cancelled() {
            latch.countDown();
        }
    });
    try {
        latch.await(5, TimeUnit.SECONDS);
    } catch (Exception e) {
        logger.info("wait http client error:", e);
    }
    return reference.get();
}
```

从代码中可以看到，是通过一个异步的 httpClient 再结合 CountDownLatch 等待 5 秒的超时时间去获取结果的。

## 客户端

sentinel-core 在启动的时候，执行了一个 InitExecutor.init 的方法，该方法会触发所有 InitFunc 实现类的 init 方法。

**InitExecutor#doInit**

```java
public static void doInit() {
    //InitExecutor只会初始化一次，并且初始化失败会退出
    if (!initialized.compareAndSet(false, true)) {
        return;
    }
    try {
        //通过spi加载InitFunc子类
        ServiceLoader<InitFunc> loader = ServiceLoader.load(InitFunc.class);
        List<OrderWrapper> initList = new ArrayList<OrderWrapper>();
        for (InitFunc initFunc : loader) {
            RecordLog.info("[InitExecutor] Found init func: " + initFunc.getClass().getCanonicalName());
            //给所有的initFunc排序，按@InitOrder从小到大进行排序
            //然后封装成OrderWrapper对象
            insertSorted(initList, initFunc);
        }
        for (OrderWrapper w : initList) {
            w.func.init();
            RecordLog.info(String.format("[InitExecutor] Executing %s with order %d",
                w.func.getClass().getCanonicalName(), w.order));
        }
    } catch (Exception ex) {
        RecordLog.warn("[InitExecutor] WARN: Initialization failed", ex);
        ex.printStackTrace();
    } catch (Error error) {
        RecordLog.warn("[InitExecutor] ERROR: Initialization failed with fatal error", error);
        error.printStackTrace();
    }
}
```

因为这里我们引入了`sentinel-transport-simple-http`模块，所以使用spi加载InitFunc的子类的时候会新加载两个子类实例，分别是：CommandCenterInitFunc、HeartbeatSenderInitFunc。然后会遍历loader，根据@InitOrder的大小进行排序，并封装成OrderWrapper放入到initList中。

所以initList里面的对象顺序是：

- CommandCenterInitFunc
- HeartbeatSenderInitFunc
- MetricCallbackInit

然后遍历initList依次调用init方法。

## CommandCenterInitFunc

CommandCenterInitFunc 则会启动一个 CommandCenter 对外提供 sentinel-core 的数据服务，而这些数据服务是通过一个一个的 CommandHandler 来提供的，如下图所示：

**CommandCenterInitFunc#init**

```java
public void init() throws Exception {
    //获取commandCenter对象
    CommandCenter commandCenter = CommandCenterProvider.getCommandCenter();
    if (commandCenter == null) {
        RecordLog.warn("[CommandCenterInitFunc] Cannot resolve CommandCenter");
        return;
    }
    //调用SimpleHttpCommandCenter的beforeStart方法
    //用来设置CommandHandler的实现类
    commandCenter.beforeStart();
    commandCenter.start();
    RecordLog.info("[CommandCenterInit] Starting command center: "
            + commandCenter.getClass().getCanonicalName());
}
```

这个方法里面的所有操作都是针对CommandCenter来进行的，所以我们先来看看CommandCenterProvider这个类。

CommandCenterProvider

```java
static {
    //初始化commandCenter对象
    resolveInstance();
}
private static void resolveInstance() {
    //获取SpiOrder更大的子类实现类
    CommandCenter resolveCommandCenter = SpiLoader.loadHighestPriorityInstance(CommandCenter.class);
    if (resolveCommandCenter == null) {
        RecordLog.warn("[CommandCenterProvider] WARN: No existing CommandCenter found");
    } else {
        commandCenter = resolveCommandCenter;
        RecordLog.info("[CommandCenterProvider] CommandCenter resolved: " + resolveCommandCenter.getClass()
            .getCanonicalName());
    }
}
```

`CommandCenterProvider`会在首次初始化的时候调用`resolveInstance`方法。在`resolveInstance`方法里面会调用`SpiLoader.loadHighestPriorityInstance`来获取`CommandCenter`，这里获取的是`SimpleHttpCommandCenter`这个实例，`loadHighestPriorityInstance`方法具体的实现非常简单，我就不去分析了。然后将`commandCenter`赋值`SimpleHttpCommandCenter`实例。

所以CommandCenterProvider.getCommandCenter()方法返回的是SimpleHttpCommandCenter实例。然后调用SimpleHttpCommandCenter的beforeStart方法。

**SimpleHttpCommandCenter#beforeStart**

```java
public void beforeStart() throws Exception {
    // Register handlers
    //调用CommandHandlerProvider的namedHandlers方法
    //获取CommandHandler的spi中设置的实现类
    Map<String, CommandHandler> handlers = CommandHandlerProvider.getInstance().namedHandlers();
    //将handlers中的数据设置到handlerMap中
    registerCommands(handlers);
}
```

这个方法首先会调用CommandHandlerProvider的namedHandlers中获取所有的CommandHandler实现类。

**CommandHandlerProvider#namedHandlers**

```java
private final ServiceLoader<CommandHandler> serviceLoader = ServiceLoader.load(CommandHandler.class);
public Map<String, CommandHandler> namedHandlers() {
    Map<String, CommandHandler> map = new HashMap<String, CommandHandler>();
    for (CommandHandler handler : serviceLoader) {
        //获取实现类CommandMapping注解的name属性
        String name = parseCommandName(handler);
        if (!StringUtil.isEmpty(name)) {
            map.put(name, handler);
        }
    }
    return map;
}
```

这个类会通过spi先加载`CommandHandler`的实现类，然后将实现类按注解上面的name属性放入到map里面去。`CommandHandler`的实现类是用来和控制台进行交互的处理类，负责处理。

这也是策略模式的一种应用，根据map里面的不同策略来做不同的处理，例如`SendMetricCommandHandler`是用来统计调用信息然后发送给控制台用的，`ModifyRulesCommandHandler`是用来做实时修改限流策略的处理的等等。

然后我们再回到`CommandCenterInitFunc`中，继续往下走，调用`commandCenter.start()`方法。

**SimpleHttpCommandCenter#start**

```java
public void start() throws Exception {
    //获取当前机器的cpu线程数
    int nThreads = Runtime.getRuntime().availableProcessors();
    //创建一个cpu线程数大小的固定线程池，用来做业务线程池用
    this.bizExecutor = new ThreadPoolExecutor(nThreads, nThreads, 0L, TimeUnit.MILLISECONDS,
        new ArrayBlockingQueue<Runnable>(10),
        new NamedThreadFactory("sentinel-command-center-service-executor"),
        new RejectedExecutionHandler() {
            @Override
            public void rejectedExecution(Runnable r, ThreadPoolExecutor executor) {
                CommandCenterLog.info("EventTask rejected");
                throw new RejectedExecutionException();
            }
        });
    Runnable serverInitTask = new Runnable() {
        int port;
        {
            try {
                //获取port
                port = Integer.parseInt(TransportConfig.getPort());
            } catch (Exception e) {
                port = DEFAULT_PORT;
            }
        }
        @Override
        public void run() {
            boolean success = false;
            //创建一个ServerSocket
            ServerSocket serverSocket = getServerSocketFromBasePort(port);
            if (serverSocket != null) {
                CommandCenterLog.info("[CommandCenter] Begin listening at port " + serverSocket.getLocalPort());
                socketReference = serverSocket;
                executor.submit(new ServerThread(serverSocket));
                success = true;
                port = serverSocket.getLocalPort();
            } else {
                CommandCenterLog.info("[CommandCenter] chooses port fail, http command center will not work");
            }
            if (!success) {
                port = PORT_UNINITIALIZED;
            }
            TransportConfig.setRuntimePort(port);
            //关闭线程池
            executor.shutdown();
        }
    };
    new Thread(serverInitTask).start();
}
```

**1、** 这个方法会创建一个固定大小的业务线程池；

**2、** 创建一个serverInitTask，里面负责建立serverSocket然后用executor去创建一个ServerThread异步执行serverSocket；

**3、** executor用完之后会在serverInitTask里面调用executor的shutdown方法去关闭线程池；

其中executor是一个单线程的线程池：

```java
private ExecutorService executor = Executors.newSingleThreadExecutor(
    new NamedThreadFactory("sentinel-command-center-executor"));
```

ServerThread是SimpleHttpCommandCenter的内部类：

```java
public void run() {
    while (true) {
        Socket socket = null;
        try {
              //建立连接
            socket = this.serverSocket.accept();
              //默认的超时时间是3s
            setSocketSoTimeout(socket);
            HttpEventTask eventTask = new HttpEventTask(socket);
            //使用业务线程异步处理
            bizExecutor.submit(eventTask);
        } catch (Exception e) {
            CommandCenterLog.info("Server error", e);
            if (socket != null) {
                try {
                    socket.close();
                } catch (Exception e1) {
                    CommandCenterLog.info("Error when closing an opened socket", e1);
                }
            }
            try {
                // In case of infinite log.
                Thread.sleep(10);
            } catch (InterruptedException e1) {
                // Indicates the task should stop.
                break;
            }
        }
    }
}
```

run方法会使用构造器传入的serverSocket建立连接后设置超时时间，封装成HttpEventTask类，然后使用上面创建的bizExecutor异步执行任务。

HttpEventTask是Runnable的实现类，所以调用bizExecutor的submit的时候会调用其中的run方法使用socket与控制台进行交互。

**HttpEventTask#run**

```java
public void run() {
          ....
        // Validate the target command.
        //获取commandName
        String commandName = HttpCommandUtils.getTarget(request);
        if (StringUtil.isBlank(commandName)) {
            badRequest(printWriter, "Invalid command");
            return;
        }
        // Find the matching command handler.
        //根据commandName获取处理器名字
        CommandHandler<?> commandHandler = SimpleHttpCommandCenter.getHandler(commandName);
        if (commandHandler != null) {
            //调用处理器结果，然后返回给控制台
            CommandResponse<?> response = commandHandler.handle(request);
            handleResponse(response, printWriter, outputStream);
        }  
          ....
    } catch (Throwable e) {
        ....
    } finally {
        ....
    }
}
```

HttpEventTask的run方法很长，但是很多都是有关输入输出流的，我们不关心，所以省略。只需要知道会把request请求最后转换成一个控制台发过来的指令，然后通过SimpleHttpCommandCenter调用getHandler得到处理器，然后处理数据就行了。

所以这个整个的处理流程就是：

通过这样的一个处理流程，然后实现了类似reactor的一个处理流程。

**SimpleHttpCommandCenter#getHandler**

```java
public static CommandHandler getHandler(String commandName) {
    return handlerMap.get(commandName);
}
```

handlerMap里面的数据是通过前面我们分析的调用beforeStart方法设置进来的。

然后通过commandName获取对应的控制台，例如：控制台发送过来metric指令，那么就会对应的调用SendMetricCommandHandler的handle方法来处理控制台的指令。

## HeartbeatSenderInitFunc

HeartbeatSenderInitFunc主要是用来做心跳线程使用的，定期的和控制台进行心跳连接。

**HeartbeatSenderInitFunc#init**

```java
public void init() {
    //获取HeartbeatSender的实现类
    HeartbeatSender sender = HeartbeatSenderProvider.getHeartbeatSender();
    if (sender == null) {
        RecordLog.warn("[HeartbeatSenderInitFunc] WARN: No HeartbeatSender loaded");
        return;
    }
    //创建一个corepoolsize为2，maximumPoolSize为最大的线程池
    initSchedulerIfNeeded();
    //获取心跳间隔时间，默认10s
    long interval = retrieveInterval(sender);
    //设置间隔心跳时间
    setIntervalIfNotExists(interval);
    //开启一个定时任务，每隔interval时间发送一个心跳
    scheduleHeartbeatTask(sender, interval);
}
```

**1、** 首先会调用HeartbeatSenderProvider.getHeartbeatSender方法，里面会根据spi创建实例，返回一个SimpleHttpHeartbeatSender实例；

**2、** 调用initSchedulerIfNeeded方法创建一个corepoolsize为2的线程池；

**3、** 获取心跳间隔时间，如果没有设置，那么是10s；

**4、** 调用scheduleHeartbeatTask方法开启一个定时线程调用；

我们来看看scheduleHeartbeatTask方法：

**HeartbeatSenderInitFunc#scheduleHeartbeatTask**

```java
private void scheduleHeartbeatTask(/*@NonNull*/ final HeartbeatSender sender, /*@Valid*/ long interval) {
    pool.scheduleAtFixedRate(new Runnable() {
        @Override
        public void run() {
            try {
                sender.sendHeartbeat();
            } catch (Throwable e) {
                RecordLog.warn("[HeartbeatSender] Send heartbeat error", e);
            }
        }
    }, 5000, interval, TimeUnit.MILLISECONDS);
    RecordLog.info("[HeartbeatSenderInit] HeartbeatSender started: "
        + sender.getClass().getCanonicalName());
}
```

默认的情况，创建的这个定时任务会每隔10s调用一次SimpleHttpHeartbeatSender的sendHeartbeat方法。

**SimpleHttpHeartbeatSender#sendHeartbeat**

```java
public boolean sendHeartbeat() throws Exception {
    if (TransportConfig.getRuntimePort() <= 0) {
        RecordLog.info("[SimpleHttpHeartbeatSender] Runtime port not initialized, won't send heartbeat");
        return false;
    }
    //获取控制台的ip和端口等信息
    InetSocketAddress addr = getAvailableAddress();
    if (addr == null) {
        return false;
    }
    //设置http调用的ip和端口，还有访问的url
    SimpleHttpRequest request = new SimpleHttpRequest(addr, HEARTBEAT_PATH);
    //获取版本号，端口等信息
    request.setParams(heartBeat.generateCurrentMessage());
    try {
        //发送post请求
        SimpleHttpResponse response = httpClient.post(request);
        if (response.getStatusCode() == OK_STATUS) {
            return true;
        }
    } catch (Exception e) {
        RecordLog.warn("[SimpleHttpHeartbeatSender] Failed to send heartbeat to " + addr + " : ", e);
    }
    return false;
}
```

这个心跳检测的方法就写的很简单了，通过Dcsp.sentinel.dashboard.server预先设置好的ip和端口号发送post请求到控制台，然后检测是否返回200，如果是则说明控制台正常，否则进行异常处理。

## 总结

现在我们已经知道了 dashboard 是如何获取到实时数据的了，具体的流程如下所示：

**1、** 首先sentinel-core向dashboard发送心跳包；

**2、** dashboard将sentinel-core的机器信息保存在内存中；

**3、** dashboard根据sentinel-core的机器信息通过httpClient获取实时的数据；

**4、** sentinel-core接收到请求之后，会找到具体的CommandHandler来处理；

**5、** sentinel-core将处理好的结果返回给dashboard；
