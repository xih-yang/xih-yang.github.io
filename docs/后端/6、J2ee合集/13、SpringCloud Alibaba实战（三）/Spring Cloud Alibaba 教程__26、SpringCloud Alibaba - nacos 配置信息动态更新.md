# 26、SpringCloud Alibaba - nacos 配置信息动态更新
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/3/26.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程
## 前言

nacos 客户端通过定时任务动态从 nacos 服务端拉取最新配置信息。

## 一、ClientWorker

**1、** 在NacosConfigService中会创建ClientWorker，会启动客户端线程更新配置信息；

```java
	this.worker = new ClientWorker(this.agent, this.configFilterChainManager, properties);
```

**2、** ClientWorker()；

```java
public ClientWorker(final HttpAgent agent, final ConfigFilterChainManager configFilterChainManager,
            final Properties properties) {
        this.agent = agent;
        this.configFilterChainManager = configFilterChainManager;
        // Initialize the timeout parameter
        init(properties);
        //线程池
        this.executor = Executors.newScheduledThreadPool(1, new ThreadFactory() {
            @Override
            public Thread newThread(Runnable r) {
                Thread t = new Thread(r);
                t.setName("com.alibaba.nacos.client.Worker." + agent.getName());
                t.setDaemon(true);
                return t;
            }
        });
        //线程池
        this.executorService = Executors
                .newScheduledThreadPool(Runtime.getRuntime().availableProcessors(), new ThreadFactory() {
                    @Override
                    public Thread newThread(Runnable r) {
                        Thread t = new Thread(r);
                        t.setName("com.alibaba.nacos.client.Worker.longPolling." + agent.getName());
                        t.setDaemon(true);
                        return t;
                    }
                });
        //执行检查配置信息任务
        this.executor.scheduleWithFixedDelay(new Runnable() {
            @Override
            public void run() {
                try {
                    checkConfigInfo();
                } catch (Throwable e) {
                    LOGGER.error("[" + agent.getName() + "] [sub-check] rotate check error", e);
                }
            }
        }, 1L, 10L, TimeUnit.MILLISECONDS);
    }
```

**3、** checkConfigInfo()；

```java
 public void checkConfigInfo() {
        // Dispatch taskes.
        // cacheMap 保存了 groupKey -> cacheData ，里面的初始值在下面还会分析到
        int listenerSize = cacheMap.size();
        // Round up the longingTaskCount.
        //给任务进行分组
        int longingTaskCount = (int) Math.ceil(listenerSize / ParamUtil.getPerTaskConfigSize());
        if (longingTaskCount > currentLongingTaskCount) {
            for (int i = (int) currentLongingTaskCount; i < longingTaskCount; i++) {
                // The task list is no order.So it maybe has issues when changing.
                //执行拉取nacos服务端配置信息任务
                executorService.execute(new LongPollingRunnable(i));
            }
            currentLongingTaskCount = longingTaskCount;
        }
    }
```

**4、** LongPollingRunnable；

```java
        @Override
        public void run() {
            List<CacheData> cacheDatas = new ArrayList<CacheData>();
            List<String> inInitializingCacheList = new ArrayList<String>();
            try {
                // check failover config
                for (CacheData cacheData : cacheMap.values()) {
                	//校验任务是否是当前任务的组
                    if (cacheData.getTaskId() == taskId) {
                        cacheDatas.add(cacheData);
                        try {
                        	//故障转移，本地文件
                            checkLocalConfig(cacheData);
                            if (cacheData.isUseLocalConfigInfo()) {
                                cacheData.checkListenerMd5();
                            }
                        } catch (Exception e) {
                            LOGGER.error("get local config info error", e);
                        }
                    }
                }
                // check server config
                //从远程检查变化的配置信息
                List<String> changedGroupKeys = checkUpdateDataIds(cacheDatas, inInitializingCacheList);
                if (!CollectionUtils.isEmpty(changedGroupKeys)) {
                    LOGGER.info("get changedGroupKeys:" + changedGroupKeys);
                }
                for (String groupKey : changedGroupKeys) {
                    String[] key = GroupKey.parseKey(groupKey);
                    String dataId = key[0];
                    String group = key[1];
                    String tenant = null;
                    if (key.length == 3) {
                        tenant = key[2];
                    }
                    try {
                    	//从远程获取配置信息
                        String[] ct = getServerConfig(dataId, group, tenant, 3000L);
                        CacheData cache = cacheMap.get(GroupKey.getKeyTenant(dataId, group, tenant));
                        cache.setContent(ct[0]);
                        if (null != ct[1]) {
                            cache.setType(ct[1]);
                        }
                        LOGGER.info("[{}] [data-received] dataId={}, group={}, tenant={}, md5={}, content={}, type={}",
                                agent.getName(), dataId, group, tenant, cache.getMd5(),
                                ContentUtils.truncateContent(ct[0]), ct[1]);
                    } catch (NacosException ioe) {
                        String message = String
                                .format("[%s] [get-update] get changed config exception. dataId=%s, group=%s, tenant=%s",
                                        agent.getName(), dataId, group, tenant);
                        LOGGER.error(message, ioe);
                    }
                }
                for (CacheData cacheData : cacheDatas) {
                    if (!cacheData.isInitializing() || inInitializingCacheList
                            .contains(GroupKey.getKeyTenant(cacheData.dataId, cacheData.group, cacheData.tenant))) {
                        //检查文件信息的md5，并通知监听者
                        cacheData.checkListenerMd5();
                        cacheData.setInitializing(false);
                    }
                }
                inInitializingCacheList.clear();
                executorService.execute(this);
            } catch (Throwable e) {
                // If the rotation training task is abnormal, the next execution time of the task will be punished
                LOGGER.error("longPolling error : ", e);
                //延时调用检查配置任务
                executorService.schedule(this, taskPenaltyTime, TimeUnit.MILLISECONDS);
            }
        }
```

**5、** cacheData.checkListenerMd5()；

```java
void checkListenerMd5() {
		//遍历 listeners 列表
        for (ManagerListenerWrap wrap : listeners) {
        	// 检查文件内容的md5是否发生变化
            if (!md5.equals(wrap.lastCallMd5)) {
            	//通知Listener
                safeNotifyListener(dataId, group, content, type, md5, wrap);
            }
        }
    }
```

**6、** safeNotifyListener()；

```java
	private void safeNotifyListener(final String dataId, final String group, final String content, final String type,
            final String md5, final ManagerListenerWrap listenerWrap) {
        final Listener listener = listenerWrap.listener;
        Runnable job = new Runnable() {
            @Override
            public void run() {
            	//当前类加载器
                ClassLoader myClassLoader = Thread.currentThread().getContextClassLoader();
                //listener 的类加载器
                ClassLoader appClassLoader = listener.getClass().getClassLoader();
                try {
                    if (listener instanceof AbstractSharedListener) {
                        AbstractSharedListener adapter = (AbstractSharedListener) listener;
                        adapter.fillContext(dataId, group);
                        LOGGER.info("[{}] [notify-context] dataId={}, group={}, md5={}", name, dataId, group, md5);
                    }
                    // 执行回调之前先将线程classloader设置为具体webapp的classloader，以免回调方法中调用spi接口是出现异常或错用（多应用部署才会有该问题）。
                    Thread.currentThread().setContextClassLoader(appClassLoader);
                    ConfigResponse cr = new ConfigResponse();
                    cr.setDataId(dataId);
                    cr.setGroup(group);
                    cr.setContent(content);
                    configFilterChainManager.doFilter(null, cr);
                    String contentTmp = cr.getContent();
                    // 回调 listener 接收配置信息
                    listener.receiveConfigInfo(contentTmp);
                    // compare lastContent and content
                    if (listener instanceof AbstractConfigChangeListener) {
                    	//解析配置变化信息
                        Map data = ConfigChangeHandler.getInstance()
                                .parseChangeData(listenerWrap.lastContent, content, type);
                        ConfigChangeEvent event = new ConfigChangeEvent(data);
                        //回调 listener 接收配置变化
                        ((AbstractConfigChangeListener) listener).receiveConfigChange(event);
                        listenerWrap.lastContent = content;
                    }
                    listenerWrap.lastCallMd5 = md5;
                    LOGGER.info("[{}] [notify-ok] dataId={}, group={}, md5={}, listener={} ", name, dataId, group, md5,
                            listener);
                } catch (NacosException ex) {
                    LOGGER.error("[{}] [notify-error] dataId={}, group={}, md5={}, listener={} errCode={} errMsg={}",
                            name, dataId, group, md5, listener, ex.getErrCode(), ex.getErrMsg());
                } catch (Throwable t) {
                    LOGGER.error("[{}] [notify-error] dataId={}, group={}, md5={}, listener={} tx={}", name, dataId,
                            group, md5, listener, t.getCause());
                } finally {
                    Thread.currentThread().setContextClassLoader(myClassLoader);
                }
            }
        };
        final long startNotify = System.currentTimeMillis();
        try {
            if (null != listener.getExecutor()) {
                listener.getExecutor().execute(job);
            } else {
                job.run();
            }
        } catch (Throwable t) {
            LOGGER.error("[{}] [notify-error] dataId={}, group={}, md5={}, listener={} throwable={}", name, dataId,
                    group, md5, listener, t.getCause());
        }
        final long finishNotify = System.currentTimeMillis();
        LOGGER.info("[{}] [notify-listener] time cost={}ms in ClientWorker, dataId={}, group={}, md5={}, listener={} ",
                name, (finishNotify - startNotify), dataId, group, md5, listener);
    }
```

## 二、NacosContextRefresher

**1、** 在NacosConfigAutoConfiguration中创建了beanNacosContextRefresher，在NacosContextRefresher中，会初始化上面提到的cacheMap和注册listener；

```java
	@Bean
	public NacosContextRefresher nacosContextRefresher(
			NacosConfigManager nacosConfigManager,
			NacosRefreshHistory nacosRefreshHistory) {
		// Consider that it is not necessary to be compatible with the previous
		// configuration
		// and use the new configuration if necessary.
		return new NacosContextRefresher(nacosConfigManager, nacosRefreshHistory);
	}
```

```java
	public NacosContextRefresher(NacosConfigManager nacosConfigManager,
			NacosRefreshHistory refreshHistory) {
		this.nacosConfigProperties = nacosConfigManager.getNacosConfigProperties();
		this.nacosRefreshHistory = refreshHistory;
		this.configService = nacosConfigManager.getConfigService();
		this.isRefreshEnabled = this.nacosConfigProperties.isRefreshEnabled();
	}
```

**2、** NacosContextRefresher类实现了ApplicationListener，用于监听ApplicationReadyEvent事件，在SpringApplication.run(MyApplication.class,args)启动的最后一步，会调用listeners.running(context);然后会发布ApplicationReadyEvent事件，此时会回调NacosContextRefresher的onApplicationEvent()方法；

```java
	@Override
	public void onApplicationEvent(ApplicationReadyEvent event) {
		// many Spring context
		//cas锁
		if (this.ready.compareAndSet(false, true)) {
			//注册监听器
			this.registerNacosListenersForApplications();
		}
	}
```

**3、** registerNacosListenersForApplications()；

```java
	private void registerNacosListenersForApplications() {
		if (isRefreshEnabled()) {
			//从缓存中获取到配置信息，配置信息在系统启动过程中从nacos服务端获取后放入缓存的
			for (NacosPropertySource propertySource : NacosPropertySourceRepository
					.getAll()) {
				if (!propertySource.isRefreshable()) {
					continue;
				}
				String dataId = propertySource.getDataId();
				//注册监听器
				registerNacosListener(propertySource.getGroup(), dataId);
			}
		}
	}
```

**4、** registerNacosListener()；

```java
private void registerNacosListener(final String groupKey, final String dataKey) {
		String key = NacosPropertySourceRepository.getMapKey(dataKey, groupKey);
		//创建 listener  ，放入 listenerMap
		Listener listener = listenerMap.computeIfAbsent(key,
				lst -> new AbstractSharedListener() {
					@Override
					public void innerReceive(String dataId, String group,
							String configInfo) {
						//配置信息刷新次数
						refreshCountIncrement();
						//记录到刷新历史列表
						nacosRefreshHistory.addRefreshRecord(dataId, group, configInfo);
						// todo feature: support single refresh for listening
						//发布 RefreshEvent 刷新事件
						applicationContext.publishEvent(
								new RefreshEvent(this, null, "Refresh Nacos config"));
						if (log.isDebugEnabled()) {
							log.debug(String.format(
									"Refresh Nacos config group=%s,dataId=%s,configInfo=%s",
									group, dataId, configInfo));
						}
					}
				});
		try {
			//将 Listener 添加到 configService 中，
			configService.addListener(dataKey, groupKey, listener);
		}
		catch (NacosException e) {
			log.warn(String.format(
					"register fail for nacos listener ,dataId=[%s],group=[%s]", dataKey,
					groupKey), e);
		}
	}
```

**5、** addListener()；

```java
	@Override
    public void addListener(String dataId, String group, Listener listener) throws NacosException {
        worker.addTenantListeners(dataId, group, Arrays.asList(listener));
    }
```

```java
 public void addTenantListeners(String dataId, String group, List<? extends Listener> listeners)
            throws NacosException {
        group = null2defaultGroup(group);
        String tenant = agent.getTenant();
        //创建 CacheData ，并添加到 cacheMap 中
        CacheData cache = addCacheDataIfAbsent(dataId, group, tenant);
        for (Listener listener : listeners) {
        	//添加 listener 
            cache.addListener(listener);
        }
    }
```

**6、** addCacheDataIfAbsent()；

```java
public CacheData addCacheDataIfAbsent(String dataId, String group, String tenant) throws NacosException {
        String key = GroupKey.getKeyTenant(dataId, group, tenant);
        CacheData cacheData = cacheMap.get(key);
        if (cacheData != null) {
            return cacheData;
        }
    	//创建 cacheData 
        cacheData = new CacheData(configFilterChainManager, agent.getName(), dataId, group, tenant);
        // multiple listeners on the same dataid+group and race condition
        //添加到 cacheMap
        CacheData lastCacheData = cacheMap.putIfAbsent(key, cacheData);
        if (lastCacheData == null) {
            //fix issue 1317
            //允许远程同步配置开关
            if (enableRemoteSyncConfig) {
            	//从远程获取配置信息
                String[] ct = getServerConfig(dataId, group, tenant, 3000L);
                //将配置信息放入 cacheData
                cacheData.setContent(ct[0]);
            }
            //计算所属的任务组
            int taskId = cacheMap.size() / (int) ParamUtil.getPerTaskConfigSize();
            cacheData.setTaskId(taskId);
            lastCacheData = cacheData;
        }
        // reset so that server not hang this check
        lastCacheData.setInitializing(true);
        LOGGER.info("[{}] [subscribe] {}", agent.getName(), key);
        MetricsMonitor.getListenConfigCountMonitor().set(cacheMap.size());
        return lastCacheData;
    }
```

**7、** addListener()；

```java
public void addListener(Listener listener) {
        if (null == listener) {
            throw new IllegalArgumentException("listener is null");
        }
        //包装 listener，记录配置信息的 md5
        ManagerListenerWrap wrap =
                (listener instanceof AbstractConfigChangeListener) ? new ManagerListenerWrap(listener, md5, content)
                        : new ManagerListenerWrap(listener, md5);
        //加入到 listeners 列表中
        if (listeners.addIfAbsent(wrap)) {
            LOGGER.info("[{}] [add-listener] ok, tenant={}, dataId={}, group={}, cnt={}", name, tenant, dataId, group,
                    listeners.size());
        }
    }
```

**8、** RefreshEventListener；

**1、** RefreshEventListener能够监听ApplicationReadyEvent和RefreshEvent事件；

```java
	@Override
	public boolean supportsEventType(Class<? extends ApplicationEvent> eventType) {
		return ApplicationReadyEvent.class.isAssignableFrom(eventType)
				|| RefreshEvent.class.isAssignableFrom(eventType);
	}
	@Override
	public void onApplicationEvent(ApplicationEvent event) {
		if (event instanceof ApplicationReadyEvent) {
			//处理 ApplicationReadyEvent
			handle((ApplicationReadyEvent) event);
		}
		else if (event instanceof RefreshEvent) {
			//处理 RefreshEvent
			handle((RefreshEvent) event);
		}
	}
	public void handle(ApplicationReadyEvent event) {
		this.ready.compareAndSet(false, true);
	}
	public void handle(RefreshEvent event) {
		if (this.ready.get()) {
      // don't handle events before app is ready
			log.debug("Event received " + event.getEventDesc());
			// ContextRefresher , 刷新上下文环境
			Set<String> keys = this.refresh.refresh();
			log.info("Refresh keys changed: " + keys);
		}
	}
```

## 总结

**1、** 系统启动后加载配置信息并放入缓存；

**2、** NacosContextRefresher根据缓存中的配置信息创建CacheData，并添加到cacheMap中，创建listener；

**3、** ClientWorker检查配置信息，从远程获取配置信息，回调listener，刷新上下文环境；
