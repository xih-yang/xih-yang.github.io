# 07、Sentinel源码解析，Sentinel是怎么和控制台通信的？
- 来源：https://ddkk.com/zhuanlan/guarantee/sentinelym/7.html
- 分类：服务保障
- 分组：Sentinel 源码解析
这里会介绍：

**1、** Sentinel会使用多线程的方式实现一个类Reactor的IO模型；

**2、** Sentinel会使用心跳检测来观察控制台是否正常；

客户端会在InitExecutor调用doInit方法中与控制台建立通信，所以我们直接看doInit方法：

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

因为这里我们引入了`sentinel-transport-simple-http`模块，所以使用spi加载InitFunc的子类的时候会加载三个子类实例，分别是：CommandCenterInitFunc、HeartbeatSenderInitFunc、MetricCallbackInit。

然后会遍历loader，根据@InitOrder的大小进行排序，并封装成OrderWrapper放入到initList中。

所以initList里面的对象顺序是：

**1、** CommandCenterInitFunc；

**2、** HeartbeatSenderInitFunc；

**3、** MetricCallbackInit；

然后遍历initList依次调用init方法。

所以下面我们来看一下这三个实现类的init方法做了什么：

#### CommandCenterInitFunc

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

**CommandCenterProvider**

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

CommandCenterProvider会在首次初始化的时候调用resolveInstance方法。在resolveInstance方法里面会调用`SpiLoader.loadHighestPriorityInstance`来获取CommandCenter，这里获取的是SimpleHttpCommandCenter这个实例，loadHighestPriorityInstance方法具体的实现非常简单，我就不去分析了。

然后将commandCenter赋值SimpleHttpCommandCenter实例。

所以`CommandCenterProvider.getCommandCenter()`方法返回的是SimpleHttpCommandCenter实例。

然后调用SimpleHttpCommandCenter的beforeStart方法。

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

这个类会通过spi先加载CommandHandler的实现类，然后将实现类按注解上面的name属性放入到map里面去。

CommandHandler的实现类是用来和控制台进行交互的处理类，负责处理。

这也是策略模式的一种应用，根据map里面的不同策略来做不同的处理，例如SendMetricCommandHandler是用来统计调用信息然后发送给控制台用的，ModifyRulesCommandHandler是用来做实时修改限流策略的处理的等等。

然后我们再回到CommandCenterInitFunc中，继续往下走，调用`commandCenter.start()`方法。

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

我们来看看SendMetricCommandHandler是怎么处理返回统计数据的：

**SendMetricCommandHandler#handle**

```java
public CommandResponse<String> handle(CommandRequest request) {
    // Note: not thread-safe.
    if (searcher == null) {
        synchronized (lock) {
            //获取应用名
            String appName = SentinelConfig.getAppName();
            if (appName == null) {
                appName = "";
            }
            if (searcher == null) {
                //用来找metric文件，
                searcher = new MetricSearcher(MetricWriter.METRIC_BASE_DIR,
                    MetricWriter.formMetricFileName(appName, PidUtil.getPid()));
            }
        }
    }
    //获取请求的开始结束时间和最大的行数
    String startTimeStr = request.getParam("startTime");
    String endTimeStr = request.getParam("endTime");
    String maxLinesStr = request.getParam("maxLines");
    //用来确定资源
    String identity = request.getParam("identity");
    long startTime = -1;
    int maxLines = 6000;
    if (StringUtil.isNotBlank(startTimeStr)) {
        startTime = Long.parseLong(startTimeStr);
    } else {
        return CommandResponse.ofSuccess("");
    }
    List<MetricNode> list;
    try {
        // Find by end time if set.
        if (StringUtil.isNotBlank(endTimeStr)) {
            long endTime = Long.parseLong(endTimeStr);
            //根据开始结束时间找到统计数据
            list = searcher.findByTimeAndResource(startTime, endTime, identity);
        } else {
            if (StringUtil.isNotBlank(maxLinesStr)) {
                maxLines = Integer.parseInt(maxLinesStr);
            }
            maxLines = Math.min(maxLines, 12000);
            list = searcher.find(startTime, maxLines);
        }
    } catch (Exception ex) {
        return CommandResponse.ofFailure(new RuntimeException("Error when retrieving metrics", ex));
    }
    if (list == null) {
        list = new ArrayList<>();
    }
    //如果identity为空就加入CPU负载和系统负载
    if (StringUtil.isBlank(identity)) {
        addCpuUsageAndLoad(list);
    }
    StringBuilder sb = new StringBuilder();
    for (MetricNode node : list) {
        sb.append(node.toThinString()).append("\n");
    }
    return CommandResponse.ofSuccess(sb.toString());
}
```

我们在第一篇文章里介绍了Metric统计信息会在MetricTimerListener的run方法中定时写入文件中去。

所以handle方法里面主要是如何根据请求的开始结束时间，资源名来获取磁盘的文件，然后返回磁盘的统计信息，并记录一下当前的统计信息，防止重复发送统计数据到控制台。

#### HeartbeatSenderInitFunc

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
