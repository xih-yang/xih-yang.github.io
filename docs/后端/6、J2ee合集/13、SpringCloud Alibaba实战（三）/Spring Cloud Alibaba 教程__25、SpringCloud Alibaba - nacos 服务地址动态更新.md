# 25、SpringCloud Alibaba - nacos 服务地址动态更新
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/3/25.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程
## 前言

通过配置endpoint来实现服务地址的动态更新。

## 服务地址动态更新

**1、** 在NacosConfigBootstrapConfiguration创建NacosConfigManager的过程中，会创建NacosConfigService；

```java
NacosConfigBootstrapConfiguration.java
	@Bean
	@ConditionalOnMissingBean
	public NacosConfigManager nacosConfigManager(
			NacosConfigProperties nacosConfigProperties) {
		return new NacosConfigManager(nacosConfigProperties);
	}
```

**2、** NacosConfigManager；

```java
	public NacosConfigManager(NacosConfigProperties nacosConfigProperties) {
		this.nacosConfigProperties = nacosConfigProperties;
		// Compatible with older code in NacosConfigProperties,It will be deleted in the
		// future.
		//创建 NacosConfigService
		createConfigService(nacosConfigProperties);
	}
```

**3、** createConfigService()；

```java
	static ConfigService createConfigService(
			NacosConfigProperties nacosConfigProperties) {
		if (Objects.isNull(service)) {
			synchronized (NacosConfigManager.class) {
				try {
					if (Objects.isNull(service)) {
						//创建 NacosConfigService
						service = NacosFactory.createConfigService(
								nacosConfigProperties.assembleConfigServiceProperties());
					}
				}
				catch (NacosException e) {
					log.error(e.getMessage());
					throw new NacosConnectionFailureException(
							nacosConfigProperties.getServerAddr(), e.getMessage(), e);
				}
			}
		}
		return service;
	}
```

```java
 public static ConfigService createConfigService(Properties properties) throws NacosException {
        return ConfigFactory.createConfigService(properties);
    }
```

使用反射创建 NacosConfigService

```java
public static ConfigService createConfigService(Properties properties) throws NacosException {
        try {
            Class<?> driverImplClass = Class.forName("com.alibaba.nacos.client.config.NacosConfigService");
            Constructor constructor = driverImplClass.getConstructor(Properties.class);
            ConfigService vendorImpl = (ConfigService) constructor.newInstance(properties);
            return vendorImpl;
        } catch (Throwable e) {
            throw new NacosException(NacosException.CLIENT_INVALID_PARAM, e);
        }
    }
```

**4、** NacosConfigService；

```java
 public NacosConfigService(Properties properties) throws NacosException {
        ValidatorUtils.checkInitParam(properties);
        String encodeTmp = properties.getProperty(PropertyKeyConst.ENCODE);
        if (StringUtils.isBlank(encodeTmp)) {
            this.encode = Constants.ENCODE;
        } else {
            this.encode = encodeTmp.trim();
        }
        // 初始化命名空间
        initNamespace(properties);
        // 与nacos服务端交互的http请求代理
        this.agent = new MetricsHttpAgent(new ServerHttpAgent(properties));
        //启动定时任务更新服务地址
        this.agent.start();
        // 创建ClientWorker，用于定时更新配置
        this.worker = new ClientWorker(this.agent, this.configFilterChainManager, properties);
    }
```

**5、** agent.start()；

```java
	 public void start() throws NacosException {
        httpAgent.start();
    }
```

```java
 	public void start() throws NacosException {
        serverListMgr.start();
    }
```

```java
 	public synchronized void start() throws NacosException {
        //是否已经启动，
        //或者服务列表时固定的，即配置了serverAddr，不配置serverAddr并配置endpoint时，可以从endpoint获取
        if (isStarted || isFixed) {
            return;
        }
        //获取服务列表任务
        GetServerListTask getServersTask = new GetServerListTask(addressServerUrl);
        //没有获取到服务列表，会进行重试
        for (int i = 0; i < initServerlistRetryTimes && serverUrls.isEmpty(); ++i) {
        	//执行任务
            getServersTask.run();
            try {
                this.wait((i + 1) * 100L);
            } catch (Exception e) {
                LOGGER.warn("get serverlist fail,url: {}", addressServerUrl);
            }
        }
        if (serverUrls.isEmpty()) {
            LOGGER.error("[init-serverlist] fail to get NACOS-server serverlist! env: {}, url: {}", name,
                    addressServerUrl);
            throw new NacosException(NacosException.SERVER_ERROR,
                    "fail to get NACOS-server serverlist! env:" + name + ", not connnect url:" + addressServerUrl);
        }
        // executor schedules the timer task
        //延时 30s 调度 getServersTask
        this.executorService.scheduleWithFixedDelay(getServersTask, 0L, 30L, TimeUnit.SECONDS);
        isStarted = true;
    }
```

**6、** GetServerListTask；

```java
 class GetServerListTask implements Runnable {
        final String url;
        GetServerListTask(String url) {
            this.url = url;
        }
        @Override
        public void run() {
            /*
             get serverlist from nameserver
             */
            try {
            	//更新服务列表
                updateIfChanged(getApacheServerList(url, name));
            } catch (Exception e) {
                LOGGER.error("[" + name + "][update-serverlist] failed to update serverlist from address server!", e);
            }
        }
    }
```

**7、** getApacheServerList()；

```java
private List<String> getApacheServerList(String url, String name) {
        try {
        	//通过http请求获取服务列表
            HttpRestResult<String> httpResult = nacosRestTemplate.get(url, Header.EMPTY, Query.EMPTY, String.class);
            if (httpResult.ok()) {
                if (DEFAULT_NAME.equals(name)) {
                    EnvUtil.setSelfEnv(httpResult.getHeader().getOriginalResponseHeader());
                }
                //解析服务列表
                List<String> lines = IoUtils.readLines(new StringReader(httpResult.getData()));
                List<String> result = new ArrayList<String>(lines.size());
                for (String serverAddr : lines) {
                    if (StringUtils.isNotBlank(serverAddr)) {
                        String[] ipPort = IPUtil.splitIPPortStr(serverAddr.trim());
                        String ip = ipPort[0].trim();
                        if (ipPort.length == 1) {
                            result.add(ip + IPUtil.IP_PORT_SPLITER + ParamUtil.getDefaultServerPort());
                        } else {
                            result.add(serverAddr);
                        }
                    }
                }
                return result;
            } else {
                LOGGER.error("[check-serverlist] error. addressServerUrl: {}, code: {}", addressServerUrl,
                        httpResult.getCode());
                return null;
            }
        } catch (Exception e) {
            LOGGER.error("[check-serverlist] exception. url: " + url, e);
            return null;
        }
    }
```

**8、** updateIfChanged()；

```java
	private void updateIfChanged(List<String> newList) {
        if (null == newList || newList.isEmpty()) {
            LOGGER.warn("[update-serverlist] current serverlist from address server is empty!!!");
            return;
        }
        List<String> newServerAddrList = new ArrayList<String>();
        for (String server : newList) {
            if (server.startsWith(HTTP) || server.startsWith(HTTPS)) {
                newServerAddrList.add(server);
            } else {
                newServerAddrList.add(HTTP + server);
            }
        }
        /*
         no change
         */
        if (newServerAddrList.equals(serverUrls)) {
            return;
        }
        //更新服务列表
        serverUrls = new ArrayList<String>(newServerAddrList);
        //服务列表迭代器
        iterator = iterator();
        //第一个服务地址
        currentServerAddr = iterator.next();
        // Using unified event processor, NotifyCenter
        //发布服务列表变化事件 ServerlistChangeEvent
        NotifyCenter.publishEvent(new ServerlistChangeEvent());
        LOGGER.info("[{}] [update-serverlist] serverlist updated to {}", name, serverUrls);
    }
```
