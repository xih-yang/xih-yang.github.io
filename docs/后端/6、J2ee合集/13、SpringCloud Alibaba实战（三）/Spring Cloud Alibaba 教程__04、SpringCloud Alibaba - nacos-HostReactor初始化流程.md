# 04、SpringCloud Alibaba - nacos-HostReactor初始化流程
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/3/4.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程
**1、** 构造方法；

```java
public HostReactor(NamingProxy serverProxy, BeatReactor beatReactor, String cacheDir, boolean loadCacheAtStart,
            boolean pushEmptyProtection, int pollingThreadCount) {
        // init executorService
        //线程池
        this.executor = new ScheduledThreadPoolExecutor(pollingThreadCount, new ThreadFactory() {
            @Override
            public Thread newThread(Runnable r) {
                Thread thread = new Thread(r);
                thread.setDaemon(true);
                thread.setName("com.alibaba.nacos.client.naming.updater");
                return thread;
            }
        });
        this.beatReactor = beatReactor;
        this.serverProxy = serverProxy;
        this.cacheDir = cacheDir;
        if (loadCacheAtStart) {
        	//从本地缓存文件加载服务信息
            this.serviceInfoMap = new ConcurrentHashMap<String, ServiceInfo>(DiskCache.read(this.cacheDir));
        } else {
            this.serviceInfoMap = new ConcurrentHashMap<String, ServiceInfo>(16);
        }
        this.pushEmptyProtection = pushEmptyProtection;
        this.updatingMap = new ConcurrentHashMap<String, Object>();
        //容错服务，故障转移
        this.failoverReactor = new FailoverReactor(this, cacheDir);
        //用于接收服务端推送的UDP数据
        this.pushReceiver = new PushReceiver(this);
        //服务变化通知
        this.notifier = new InstancesChangeNotifier();
        //注册服务变化事件InstancesChangeEvent
        NotifyCenter.registerToPublisher(InstancesChangeEvent.class, 16384);
        //注册订阅者，有事件时会通知订阅者
        NotifyCenter.registerSubscriber(notifier);
    }
```

**2、** FailoverReactor；

1、FailoverReactor

```java
 public FailoverReactor(HostReactor hostReactor, String cacheDir) {
        this.hostReactor = hostReactor;
        this.failoverDir = cacheDir + "/failover";
        // init executorService
        this.executorService = new ScheduledThreadPoolExecutor(1, new ThreadFactory() {
            @Override
            public Thread newThread(Runnable r) {
                Thread thread = new Thread(r);
                thread.setDaemon(true);
                thread.setName("com.alibaba.nacos.naming.failover");
                return thread;
            }
        });
        this.init();
    }
```

2、init( )

```java
public void init() {
        //定时任务 SwitchRefresher
        executorService.scheduleWithFixedDelay(new SwitchRefresher(), 0L, 5000L, TimeUnit.MILLISECONDS);
         //定时任务 DiskFileWriter
        executorService.scheduleWithFixedDelay(new DiskFileWriter(), 30, DAY_PERIOD_MINUTES, TimeUnit.MINUTES);
        // backup file on startup if failover directory is empty.
        //启动时检查创建failoverDir目录
        executorService.schedule(new Runnable() {
            @Override
            public void run() {
                try {
                    File cacheDir = new File(failoverDir);
                    if (!cacheDir.exists() && !cacheDir.mkdirs()) {
                        throw new IllegalStateException("failed to create cache dir: " + failoverDir);
                    }
                    File[] files = cacheDir.listFiles();
                    if (files == null || files.length <= 0) {
                        new DiskFileWriter().run();
                    }
                } catch (Throwable e) {
                    NAMING_LOGGER.error("[NA] failed to backup file on startup.", e);
                }
            }
        }, 10000L, TimeUnit.MILLISECONDS);
    }
```

3、SwitchRefresher

故障转移开关检测

```java
 class SwitchRefresher implements Runnable {
        long lastModifiedMillis = 0L;
        @Override
        public void run() {
            try {
            	//读取故障转移开关文件
                File switchFile = new File(failoverDir + UtilAndComs.FAILOVER_SWITCH);
                if (!switchFile.exists()) {
                    switchParams.put("failover-mode", "false");
                    NAMING_LOGGER.debug("failover switch is not found, " + switchFile.getName());
                    return;
                }
                long modified = switchFile.lastModified();
                //跟上次修改时间比较，是否被修改过
                if (lastModifiedMillis < modified) {
                    lastModifiedMillis = modified;
                    //读取文件内容
                    String failover = ConcurrentDiskUtil.getFileContent(failoverDir + UtilAndComs.FAILOVER_SWITCH,
                            Charset.defaultCharset().toString());
                    if (!StringUtils.isEmpty(failover)) {
                        String[] lines = failover.split(DiskCache.getLineSeparator());
                        //如果开关时1，调用 FailoverFileReader().run()
                        for (String line : lines) {
                            String line1 = line.trim();
                            if ("1".equals(line1)) {
                                switchParams.put("failover-mode", "true");
                                NAMING_LOGGER.info("failover-mode is on");
                                new FailoverFileReader().run();
                            } else if ("0".equals(line1)) {
                                switchParams.put("failover-mode", "false");
                                NAMING_LOGGER.info("failover-mode is off");
                            }
                        }
                    } else {
                        switchParams.put("failover-mode", "false");
                    }
                }
            } catch (Throwable e) {
                NAMING_LOGGER.error("[NA] failed to read failover switch.", e);
            }
        }
    }
```

4、FailoverFileReader

故障转移服务列表获取

```java
 class FailoverFileReader implements Runnable {
        @Override
        public void run() {
            Map<String, ServiceInfo> domMap = new HashMap<String, ServiceInfo>(16);
            BufferedReader reader = null;
            try {
                File cacheDir = new File(failoverDir);
                if (!cacheDir.exists() && !cacheDir.mkdirs()) {
                    throw new IllegalStateException("failed to create cache dir: " + failoverDir);
                }
                File[] files = cacheDir.listFiles();
                if (files == null) {
                    return;
                }
                for (File file : files) {
                    if (!file.isFile()) {
                        continue;
                    }
                    if (file.getName().equals(UtilAndComs.FAILOVER_SWITCH)) {
                        continue;
                    }
                    //构造服务信息 ServiceInfo 
                    ServiceInfo dom = new ServiceInfo(file.getName());
                    try {
                        String dataString = ConcurrentDiskUtil
                                .getFileContent(file, Charset.defaultCharset().toString());
                        reader = new BufferedReader(new StringReader(dataString));
                        String json;
                        if ((json = reader.readLine()) != null) {
                            try {
                                dom = JacksonUtils.toObj(json, ServiceInfo.class);
                            } catch (Exception e) {
                                NAMING_LOGGER.error("[NA] error while parsing cached dom : " + json, e);
                            }
                        }
                    } catch (Exception e) {
                        NAMING_LOGGER.error("[NA] failed to read cache for dom: " + file.getName(), e);
                    } finally {
                        try {
                            if (reader != null) {
                                reader.close();
                            }
                        } catch (Exception e) {
                            //ignore
                        }
                    }
                    if (!CollectionUtils.isEmpty(dom.getHosts())) {
                        domMap.put(dom.getKey(), dom);
                    }
                }
            } catch (Exception e) {
                NAMING_LOGGER.error("[NA] failed to read cache file", e);
            }
            if (domMap.size() > 0) {
            	//最后将读取的服务列表赋值给serviceMap 
                serviceMap = domMap;
            }
        }
    }
```

5、DiskFileWriter

将从nacos服务端获取的服务列表写入故障转移文件

```java
class DiskFileWriter extends TimerTask {
        @Override
        public void run() {
            Map<String, ServiceInfo> map = hostReactor.getServiceInfoMap();
            for (Map.Entry<String, ServiceInfo> entry : map.entrySet()) {
                ServiceInfo serviceInfo = entry.getValue();
                if (StringUtils.equals(serviceInfo.getKey(), UtilAndComs.ALL_IPS) || StringUtils
                        .equals(serviceInfo.getName(), UtilAndComs.ENV_LIST_KEY) || StringUtils
                        .equals(serviceInfo.getName(), "00-00---000-ENV_CONFIGS-000---00-00") || StringUtils
                        .equals(serviceInfo.getName(), "vipclient.properties") || StringUtils
                        .equals(serviceInfo.getName(), "00-00---000-ALL_HOSTS-000---00-00")) {
                    continue;
                }
                DiskCache.write(serviceInfo, failoverDir);
            }
        }
    }
```

**3、** PushReceiver；

使用UDP方式用于接收Nacos服务端的推送，并更新到serviceInfoMap当中

1、PushReceiver 构造方法

```java
public PushReceiver(HostReactor hostReactor) {
        try {
            this.hostReactor = hostReactor;
            //UDP
            this.udpSocket = new DatagramSocket();
            //线程池
            this.executorService = new ScheduledThreadPoolExecutor(1, new ThreadFactory() {
                @Override
                public Thread newThread(Runnable r) {
                    Thread thread = new Thread(r);
                    thread.setDaemon(true);
                    thread.setName("com.alibaba.nacos.naming.push.receiver");
                    return thread;
                }
            });
            //执行当前类对象，本身实现了Runnable接口
            this.executorService.execute(this);
        } catch (Exception e) {
            NAMING_LOGGER.error("[NA] init udp socket failed", e);
        }
    }
```

2、run( )

```java
@Override
    public void run() {
        while (!closed) {
            try {
                // byte[] is initialized with 0 full filled by default
                byte[] buffer = new byte[UDP_MSS];
                DatagramPacket packet = new DatagramPacket(buffer, buffer.length);
                //接收nacos服务端UDP消息
                udpSocket.receive(packet);
                String json = new String(IoUtils.tryDecompress(packet.getData()), UTF_8).trim();
                NAMING_LOGGER.info("received push data: " + json + " from " + packet.getAddress().toString());
                PushPacket pushPacket = JacksonUtils.toObj(json, PushPacket.class);
                String ack;
                if ("dom".equals(pushPacket.type) || "service".equals(pushPacket.type)) {
                	//将接收到的服务信息更新到serviceInfoMap中
                    hostReactor.processServiceJson(pushPacket.data);
                    // send ack to server
                    ack = "{\"type\": \"push-ack\"" + ", \"lastRefTime\":\"" + pushPacket.lastRefTime + "\", \"data\":"
                            + "\"\"}";
                } else if ("dump".equals(pushPacket.type)) {
                    // dump data to server
                    ack = "{\"type\": \"dump-ack\"" + ", \"lastRefTime\": \"" + pushPacket.lastRefTime + "\", \"data\":"
                            + "\"" + StringUtils.escapeJavaScript(JacksonUtils.toJson(hostReactor.getServiceInfoMap()))
                            + "\"}";
                } else {
                    // do nothing send ack only
                    ack = "{\"type\": \"unknown-ack\"" + ", \"lastRefTime\":\"" + pushPacket.lastRefTime
                            + "\", \"data\":" + "\"\"}";
                }
                //发送
                udpSocket.send(new DatagramPacket(ack.getBytes(UTF_8), ack.getBytes(UTF_8).length,
                        packet.getSocketAddress()));
            } catch (Exception e) {
                if (closed) {
                    return;
                }
                NAMING_LOGGER.error("[NA] error while receiving push data", e);
            }
        }
    }
```

**4、** NotifyCenter；

1、InstancesChangeNotifier

注册Listener，存入listenerMap，服务变化事件来的时候通知监听者

```java
public void registerListener(String serviceName, String clusters, EventListener listener) {
        String key = ServiceInfo.getKey(serviceName, clusters);
        ConcurrentHashSet<EventListener> eventListeners = listenerMap.get(key);
        if (eventListeners == null) {
            synchronized (lock) {
                eventListeners = listenerMap.get(key);
                if (eventListeners == null) {
                    eventListeners = new ConcurrentHashSet<EventListener>();
                    listenerMap.put(key, eventListeners);
                }
            }
        }
        eventListeners.add(listener);
    }
```

通知Listener，调用Listener的onEvent方法

```java
 public void onEvent(InstancesChangeEvent event) {
        String key = ServiceInfo.getKey(event.getServiceName(), event.getClusters());
        ConcurrentHashSet<EventListener> eventListeners = listenerMap.get(key);
        if (CollectionUtils.isEmpty(eventListeners)) {
            return;
        }
        for (final EventListener listener : eventListeners) {
            final com.alibaba.nacos.api.naming.listener.Event namingEvent = transferToNamingEvent(event);
            if (listener instanceof AbstractEventListener && ((AbstractEventListener) listener).getExecutor() != null) {
                ((AbstractEventListener) listener).getExecutor().execute(new Runnable() {
                    @Override
                    public void run() {
                        listener.onEvent(namingEvent);
                    }
                });
                continue;
            }
            listener.onEvent(namingEvent);
        }
    }
```

2、DefaultPublisher

将InstancesChangeNotifier添加到DefaultPublisher

```java
 @Override
    public void addSubscriber(Subscriber subscriber) {
        subscribers.add(subscriber);
    }
```

发布事件的方法

```java
 @Override
    public boolean publish(Event event) {
        checkIsStart();
        //将事件放入队列中
        boolean success = this.queue.offer(event);
        if (!success) {
            LOGGER.warn("Unable to plug in due to interruption, synchronize sending time, event : {}", event);
            //没有放入队列，直接处理事件
            receiveEvent(event);
            return true;
        }
        return true;
    }
```

队列里的事件

```java
void openEventHandler() {
        try {
            // This variable is defined to resolve the problem which message overstock in the queue.
            int waitTimes = 60;
            // To ensure that messages are not lost, enable EventHandler when
            // waiting for the first Subscriber to register
            for (; ; ) {
                if (shutdown || hasSubscriber() || waitTimes <= 0) {
                    break;
                }
                ThreadUtils.sleep(1000L);
                waitTimes--;
            }
            //for循环处理队列中的事件
            for (; ; ) {
                if (shutdown) {
                    break;
                }
                final Event event = queue.take();
                receiveEvent(event);
                UPDATER.compareAndSet(this, lastEventSequence, Math.max(lastEventSequence, event.sequence()));
            }
        } catch (Throwable ex) {
            LOGGER.error("Event listener exception : {}", ex);
        }
    }
```

事件通知

```java
void receiveEvent(Event event) {
        final long currentEventSequence = event.sequence();
        // Notification single event listener
        for (Subscriber subscriber : subscribers) {
            // Whether to ignore expiration events
            if (subscriber.ignoreExpireEvent() && lastEventSequence > currentEventSequence) {
                LOGGER.debug("[NotifyCenter] the {} is unacceptable to this subscriber, because had expire",
                        event.getClass());
                continue;
            }
            // Because unifying smartSubscriber and subscriber, so here need to think of compatibility.
            // Remove original judge part of codes.
            notifySubscriber(subscriber, event);
        }
    }
    @Override
    public void notifySubscriber(final Subscriber subscriber, final Event event) {
        LOGGER.debug("[NotifyCenter] the {} will received by {}", event, subscriber);
        final Runnable job = new Runnable() {
            @Override
            public void run() {
            	//调用InstancesChangeNotifier的onEvent方法
                subscriber.onEvent(event);
            }
        };
        final Executor executor = subscriber.executor();
        if (executor != null) {
            executor.execute(job);
        } else {
            try {
                job.run();
            } catch (Throwable e) {
                LOGGER.error("Event callback exception : {}", e);
            }
        }
    }
```
