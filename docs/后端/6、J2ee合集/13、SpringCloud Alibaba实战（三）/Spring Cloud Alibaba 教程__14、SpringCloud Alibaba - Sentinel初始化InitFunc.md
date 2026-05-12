# 14、SpringCloud Alibaba - Sentinel初始化InitFunc
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/3/14.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程
## 一、InitExecutor

**1、** InitFunc接口的初始化是在InitExecutor的doInit()方法中实现的调用doInit()的地方有三处：；

1、SentinelAutoConfiguration

```java
@PostConstruct
	private void init() {
        ...
        //检查是否配置了 spring.cloud.sentinel.eager=true
		if (properties.isEager()) {
			InitExecutor.doInit();
		}
	}
```

2、Env

```java
public class Env {
    public static final Sph sph = new CtSph();
    static {
        // If init fails, the process will exit.
        InitExecutor.doInit();
    }
}
```

3、ClusterStateManager

```java
static {
        InitExecutor.doInit();
        stateProperty.addListener(PROPERTY_LISTENER);
    }
```

**2、** doInit()；

使用SPI方式，使用 ServiceLoader 获取META-INF/services目录下的com.alibaba.csp.sentinel.init.InitFunc

```java
 public static void doInit() {
 		//只被初始化一次
        if (!initialized.compareAndSet(false, true)) {
            return;
        }
        try {
        	//采用ServiceLoader的方式加载InitFunc 	·
            ServiceLoader<InitFunc> loader = ServiceLoaderUtil.getServiceLoader(InitFunc.class);
            List<OrderWrapper> initList = new ArrayList<OrderWrapper>();
            for (InitFunc initFunc : loader) {
                RecordLog.info("[InitExecutor] Found init func: " + initFunc.getClass().getCanonicalName());
                //对initFunc 进行排序
                insertSorted(initList, initFunc);
            }
            for (OrderWrapper w : initList) {
            	//依次调用init()
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

**3、** insertSorted()；

```java
private static void insertSorted(List<OrderWrapper> list, InitFunc func) {
		//解析出 order，根据order 进行排序
        int order = resolveOrder(func);
        int idx = 0;
        for (; idx < list.size(); idx++) {
            if (list.get(idx).getOrder() > order) {
                break;
            }
        }
        list.add(idx, new OrderWrapper(order, func));
    }
    private static int resolveOrder(InitFunc func) {
        if (!func.getClass().isAnnotationPresent(InitOrder.class)) {
        	//没有 @InitOrder 注解时，默认最低优先级
            return InitOrder.LOWEST_PRECEDENCE;
        } else {
        	//获取 @InitOrder 注解 的value值
            return func.getClass().getAnnotation(InitOrder.class).value();
        }
    }
```

## 二、CommandCenterInitFunc

初始化所有命令处理器，接收服务端发来的命令信息并进行处理。

**1、** init()；

```java
@InitOrder(-1)
public class CommandCenterInitFunc implements InitFunc {
    @Override
    public void init() throws Exception {
    	//采用SPI方式获取到 SimpleHttpCommandCenter
        CommandCenter commandCenter = CommandCenterProvider.getCommandCenter();
        if (commandCenter == null) {
            RecordLog.warn("[CommandCenterInitFunc] Cannot resolve CommandCenter");
            return;
        }
		//命令处理中心启动前的逻辑
        commandCenter.beforeStart();
        //命令处理中心启动
        commandCenter.start();
        RecordLog.info("[CommandCenterInit] Starting command center: "
                + commandCenter.getClass().getCanonicalName());
    }
}
```

**2、** beforeStart()；

```java
 public void beforeStart() throws Exception {
        // 通过SPI方式获取所有的 CommandHandler
        Map<String, CommandHandler> handlers = CommandHandlerProvider.getInstance().namedHandlers();
        //将命令处理器保存到内存缓存
        registerCommands(handlers);
    }
```

**3、** start()；

```java
 @Override
    public void start() throws Exception {
        int nThreads = Runtime.getRuntime().availableProcessors();
        //业务线程池
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
        	//跟服务端的连接端口，默认是8719
            int port;
            {
                try {
                    port = Integer.parseInt(TransportConfig.getPort());
                } catch (Exception e) {
                    port = DEFAULT_PORT;
                }
            }
            @Override
            public void run() {
                boolean success = false;
                //创建ServerSocket 连接
                ServerSocket serverSocket = getServerSocketFromBasePort(port);
                if (serverSocket != null) {
                    CommandCenterLog.info("[CommandCenter] Begin listening at port " + serverSocket.getLocalPort());
                    socketReference = serverSocket;
                    //创建 ServerThread 线程任务
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
                executor.shutdown();
            }
        };
        new Thread(serverInitTask).start();
    }
```

**4、** ServerThread；

```java
class ServerThread extends Thread {
        private ServerSocket serverSocket;
        ServerThread(ServerSocket s) {
            this.serverSocket = s;
            setName("sentinel-courier-server-accept-thread");
        }
        @Override
        public void run() {
            while (true) {
                Socket socket = null;
                try {
                	//阻塞接收消息
                    socket = this.serverSocket.accept();
                    setSocketSoTimeout(socket);
                    //创建任务
                    HttpEventTask eventTask = new HttpEventTask(socket);
                    //放入业务线程池
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
    }
```

## 三、HeartbeatSenderInitFunc

初始化心跳发送者，启动心跳线程,对sentinel服务端发起心跳

**1、** init()；

```java
@Override
    public void init() {
    	//心跳发送者 SimpleHttpHeartbeatSender
        HeartbeatSender sender = HeartbeatSenderProvider.getHeartbeatSender();
        if (sender == null) {
            RecordLog.warn("[HeartbeatSenderInitFunc] WARN: No HeartbeatSender loaded");
            return;
        }
		//初始化心跳发送任务线程池
        initSchedulerIfNeeded();
        //获取心跳发送周期，如果没有配置，使用默认值10s，private static final long DEFAULT_INTERVAL = 1000 * 10;
        long interval = retrieveInterval(sender);
        setIntervalIfNotExists(interval);
        //调度心跳发送任务
        scheduleHeartbeatTask(sender, interval);
    }
```

**2、** scheduleHeartbeatTask()；

```java
private void scheduleHeartbeatTask(/*@NonNull*/ final HeartbeatSender sender, /*@Valid*/ long interval) {
        pool.scheduleAtFixedRate(new Runnable() {
            @Override
            public void run() {
                try {
                	//发送心跳
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

**3、** sender.sendHeartbeat()；

```java
 @Override
    public boolean sendHeartbeat() throws Exception {
    	//校验端口
        if (TransportConfig.getRuntimePort() <= 0) {
            RecordLog.info("[SimpleHttpHeartbeatSender] Command server port not initialized, won't send heartbeat");
            return false;
        }
        //获取sentinel服务端地址
        Tuple2<String, Integer> addrInfo = getAvailableAddress();
        if (addrInfo == null) {
            return false;
        }
        InetSocketAddress addr = new InetSocketAddress(addrInfo.r1, addrInfo.r2);
        //请求信息
        SimpleHttpRequest request = new SimpleHttpRequest(addr, TransportConfig.getHeartbeatApiPath());
        //参数信息
        request.setParams(heartBeat.generateCurrentMessage());
        try {
        	//发送请求
            SimpleHttpResponse response = httpClient.post(request);
            if (response.getStatusCode() == OK_STATUS) {
                return true;
            } else if (clientErrorCode(response.getStatusCode()) || serverErrorCode(response.getStatusCode())) {
                RecordLog.warn("[SimpleHttpHeartbeatSender] Failed to send heartbeat to " + addr
                    + ", http status code: " + response.getStatusCode());
            }
        } catch (Exception e) {
            RecordLog.warn("[SimpleHttpHeartbeatSender] Failed to send heartbeat to " + addr, e);
        }
        return false;
    }
```

**4、** httpClient.post()；

通过Socket 连接进行发送

```java
public SimpleHttpResponse post(SimpleHttpRequest request) throws IOException {
        if (request == null) {
            return null;
        }
        return request(request.getSocketAddress(),
            RequestMethod.POST, request.getRequestPath(),
            request.getParams(), request.getCharset(),
            request.getSoTimeout());
    }
    private SimpleHttpResponse request(InetSocketAddress socketAddress,
                                       RequestMethod type, String requestPath,
                                       Map<String, String> paramsMap, Charset charset, int soTimeout)
        throws IOException {
        Socket socket = null;
        BufferedWriter writer;
        try {
            socket = new Socket();
            socket.setSoTimeout(soTimeout);
            //连接服务端
            socket.connect(socketAddress, soTimeout);
            writer = new BufferedWriter(new OutputStreamWriter(socket.getOutputStream(), charset));
            requestPath = getRequestPath(type, requestPath, paramsMap, charset);
            writer.write(getStatusLine(type, requestPath) + "\r\n");
            if (charset != null) {
                writer.write("Content-Type: application/x-www-form-urlencoded; charset=" + charset.name() + "\r\n");
            } else {
                writer.write("Content-Type: application/x-www-form-urlencoded\r\n");
            }
            writer.write("Host: " + socketAddress.getHostName() + "\r\n");
            if (type == RequestMethod.GET) {
                writer.write("Content-Length: 0\r\n");
                writer.write("\r\n");
            } else {
                // POST method.
                String params = encodeRequestParams(paramsMap, charset);
                writer.write("Content-Length: " + params.getBytes(charset).length + "\r\n");
                writer.write("\r\n");
                writer.write(params);
            }
            writer.flush();
            SimpleHttpResponse response = new SimpleHttpResponseParser().parse(socket.getInputStream());
            socket.close();
            socket = null;
            return response;
        } finally {
            if (socket != null) {
                try {
                    socket.close();
                } catch (Exception ex) {
                    RecordLog.warn("Error when closing {} request to {} in SimpleHttpClient", type, socketAddress, ex);
                }
            }
        }
    }
```

## 四、DefaultClusterClientInitFunc

初始化集群客户端需要的编解码相关的类，TYPE_PING、TYPE_FLOW、TYPE_PARAM_FLOW

```java
@InitOrder(0)
public class DefaultClusterClientInitFunc implements InitFunc {
    @Override
    public void init() throws Exception {
    	//初始化 Netty Encoder 使用的 EntityWriter
        initDefaultEntityWriters();
        //初始化 Netty Decoder 使用的 EntityDecoder 
        initDefaultEntityDecoders();
    }
    private void initDefaultEntityWriters() {
        RequestDataWriterRegistry.addWriter(ClientConstants.TYPE_PING, new PingRequestDataWriter());
        RequestDataWriterRegistry.addWriter(ClientConstants.TYPE_FLOW, new FlowRequestDataWriter());
        Integer maxParamByteSize = ClusterClientStartUpConfig.getMaxParamByteSize();
        if (maxParamByteSize == null) {
            RequestDataWriterRegistry.addWriter(ClientConstants.TYPE_PARAM_FLOW, new ParamFlowRequestDataWriter());
        } else {
            RequestDataWriterRegistry.addWriter(ClientConstants.TYPE_PARAM_FLOW, new ParamFlowRequestDataWriter(maxParamByteSize));
        }
    }
    private void initDefaultEntityDecoders() {
        ResponseDataDecodeRegistry.addDecoder(ClientConstants.TYPE_PING, new PingResponseDataDecoder());
        ResponseDataDecodeRegistry.addDecoder(ClientConstants.TYPE_FLOW, new FlowResponseDataDecoder());
        ResponseDataDecodeRegistry.addDecoder(ClientConstants.TYPE_PARAM_FLOW, new FlowResponseDataDecoder());
    }
}
```

## 五、MetricCallbackInit

初始化统计相关的类 MetricEntryCallback、MetricExitCallback

```java
public class MetricCallbackInit implements InitFunc {
    @Override
    public void init() throws Exception {
        StatisticSlotCallbackRegistry.addEntryCallback(MetricEntryCallback.class.getCanonicalName(),
            new MetricEntryCallback());
        StatisticSlotCallbackRegistry.addExitCallback(MetricExitCallback.class.getCanonicalName(),
            new MetricExitCallback());
    }
}
```

## 六、ParamFlowStatisticSlotCallbackInit

初始化流控参数回调 ParamFlowStatisticEntryCallback、ParamFlowStatisticExitCallback

```java
public class ParamFlowStatisticSlotCallbackInit implements InitFunc {
    @Override
    public void init() {
        StatisticSlotCallbackRegistry.addEntryCallback(ParamFlowStatisticEntryCallback.class.getName(),
            new ParamFlowStatisticEntryCallback());
        StatisticSlotCallbackRegistry.addExitCallback(ParamFlowStatisticExitCallback.class.getName(),
            new ParamFlowStatisticExitCallback());
    }
}
```

## 七、DefaultClusterServerInitFunc

初始化服务端集群相关的一些类

```java
@Override
    public void init() throws Exception {
    	//EntityDecoder
        initDefaultEntityDecoders();
        //EntityWriter
        initDefaultEntityWriters();
		//RequestProcessor
        initDefaultProcessors();
        // Eagerly-trigger the SPI pre-load of token service.
        //TokenService
        TokenServiceProvider.getService();
        RecordLog.info("[DefaultClusterServerInitFunc] Default entity codec and processors registered");
    }
```
