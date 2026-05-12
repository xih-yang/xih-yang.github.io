# 03、SpringCloud Alibaba - Nacos-NacosNamingService初始化流程
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/3/3.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程
**1、** NacosServiceManager的创建；

```java
@Configuration(proxyBeanMethods = false)
@ConditionalOnDiscoveryEnabled
@ConditionalOnNacosDiscoveryEnabled
public class NacosServiceAutoConfiguration {
	@Bean
	public NacosServiceManager nacosServiceManager() {
		return new NacosServiceManager();
	}
}
```

**2、** NacosWatch的创建；

```java
@Configuration(proxyBeanMethods = false)
@ConditionalOnDiscoveryEnabled
@ConditionalOnBlockingDiscoveryEnabled
@ConditionalOnNacosDiscoveryEnabled
@AutoConfigureBefore({
      SimpleDiscoveryClientAutoConfiguration.class,
		CommonsClientAutoConfiguration.class })
@AutoConfigureAfter(NacosDiscoveryAutoConfiguration.class)
public class NacosDiscoveryClientConfiguration {
	@Bean
	public DiscoveryClient nacosDiscoveryClient(
			NacosServiceDiscovery nacosServiceDiscovery) {
		return new NacosDiscoveryClient(nacosServiceDiscovery);
	}
	@Bean
	@ConditionalOnMissingBean
	@ConditionalOnProperty(value = "spring.cloud.nacos.discovery.watch.enabled",
			matchIfMissing = true)
	public NacosWatch nacosWatch(NacosServiceManager nacosServiceManager,
			NacosDiscoveryProperties nacosDiscoveryProperties,
			ObjectProvider<ThreadPoolTaskScheduler> taskExecutorObjectProvider) {
		return new NacosWatch(nacosServiceManager, nacosDiscoveryProperties,
				taskExecutorObjectProvider);
	}
}
```

**3、** 在NacosWatch的start方法中会通过nacosServiceManager创建NacosNamingService；

```java
NamingService namingService = nacosServiceManager
					.getNamingService(properties.getNacosProperties());
```

```java
public NamingService getNamingService(Properties properties) {
		if (Objects.isNull(this.namingService)) {
			//构建 NamingService 
			buildNamingService(properties);
		}
		return namingService;
	}
```

**4、** buildNamingService()；

```java
private NamingService buildNamingService(Properties properties) {
		if (Objects.isNull(namingService)) {
			synchronized (NacosServiceManager.class) {
				if (Objects.isNull(namingService)) {
					namingService = createNewNamingService(properties);
				}
			}
		}
		return namingService;
	}
```

**5、** createNewNamingService()；

```java
private NamingService createNewNamingService(Properties properties) {
		try {
			return createNamingService(properties);
		}
		catch (NacosException e) {
			throw new RuntimeException(e);
		}
	}
```

```java
 public static NamingService createNamingService(Properties properties) throws NacosException {
        return NamingFactory.createNamingService(properties);
    }
```

```java
 public static NamingService createNamingService(Properties properties) throws NacosException {
        try {
            Class<?> driverImplClass = Class.forName("com.alibaba.nacos.client.naming.NacosNamingService");
            Constructor constructor = driverImplClass.getConstructor(Properties.class);
            NamingService vendorImpl = (NamingService) constructor.newInstance(properties);
            return vendorImpl;
        } catch (Throwable e) {
            throw new NacosException(NacosException.CLIENT_INVALID_PARAM, e);
        }
    }
```

可以看出，这里是通过反射的方式调用 com.alibaba.nacos.client.naming.NacosNamingService 的构造方法

**5、** NacosNamingService的构造方法；

```java
public NacosNamingService(Properties properties) throws NacosException {
        init(properties);
    }
```

**6、** init()；

```java
private void init(Properties properties) throws NacosException {
        ValidatorUtils.checkInitParam(properties);
         // 初始化命名空间
        this.namespace = InitUtils.initNamespaceForNaming(properties);
        InitUtils.initSerialization();
        // 初始化Nacos注册中心服务地址
        initServerAddr(properties);
        // 初始化web上下文
        InitUtils.initWebRootContext(properties);
        // 初始化缓存目录
        initCacheDir();
        // 初始化日志文件
        initLogName(properties);
        //服务端的代理，用于客户端与服务端之间的通信
        this.serverProxy = new NamingProxy(this.namespace, this.endpoint, this.serverList, properties);
        //用于客户端与服务器之间的心跳通信
        this.beatReactor = new BeatReactor(this.serverProxy, initClientBeatThreadCount(properties));
        //用于客户端服务的订阅，从服务端更新服务信息
        this.hostReactor = new HostReactor(this.serverProxy, beatReactor, this.cacheDir, isLoadCacheAtStart(properties),
                isPushEmptyProtect(properties), initPollingThreadCount(properties));
    }
```

**7、** initNamespaceForNaming()；

```java
public static String initNamespaceForNaming(Properties properties) {
        String tmpNamespace = null;
        //获取环境变量 isUseCloudNamespaceParsing 或 nacos.use.cloud.namespace.parsing 或 默认值true
        String isUseCloudNamespaceParsing = properties.getProperty(PropertyKeyConst.IS_USE_CLOUD_NAMESPACE_PARSING,
                System.getProperty(SystemPropertyKeyConst.IS_USE_CLOUD_NAMESPACE_PARSING,
                        String.valueOf(Constants.DEFAULT_USE_CLOUD_NAMESPACE_PARSING)));
        if (Boolean.parseBoolean(isUseCloudNamespaceParsing)) {
            tmpNamespace = TenantUtil.getUserTenantForAns();
            tmpNamespace = TemplateUtils.stringEmptyAndThenExecute(tmpNamespace, new Callable<String>() {
                @Override
                public String call() {
                	//获取环境变量 ans.namespace
                    String namespace = System.getProperty(SystemPropertyKeyConst.ANS_NAMESPACE);
                    LogUtils.NAMING_LOGGER.info("initializer namespace from System Property :" + namespace);
                    return namespace;
                }
            });
            tmpNamespace = TemplateUtils.stringEmptyAndThenExecute(tmpNamespace, new Callable<String>() {
                @Override
                public String call() {
                	//获取环境变量 ALIBABA_ALIWARE_NAMESPACE
                    String namespace = System.getenv(PropertyKeyConst.SystemEnv.ALIBABA_ALIWARE_NAMESPACE);
                    LogUtils.NAMING_LOGGER.info("initializer namespace from System Environment :" + namespace);
                    return namespace;
                }
            });
        }
        tmpNamespace = TemplateUtils.stringEmptyAndThenExecute(tmpNamespace, new Callable<String>() {
            @Override
            public String call() {
            	//获取环境变量 namespace
                String namespace = System.getProperty(PropertyKeyConst.NAMESPACE);
                LogUtils.NAMING_LOGGER.info("initializer namespace from System Property :" + namespace);
                return namespace;
            }
        });
        if (StringUtils.isEmpty(tmpNamespace) && properties != null) {
            tmpNamespace = properties.getProperty(PropertyKeyConst.NAMESPACE);
        }
        tmpNamespace = TemplateUtils.stringEmptyAndThenExecute(tmpNamespace, new Callable<String>() {
            @Override
            public String call() {
            	//获取默认值 public
                return UtilAndComs.DEFAULT_NAMESPACE_ID;
            }
        });
        return tmpNamespace;
    }
```

**8、** initServerAddr()；

```java
private void initServerAddr(Properties properties) {
        serverList = properties.getProperty(PropertyKeyConst.SERVER_ADDR);
        endpoint = InitUtils.initEndpoint(properties);
        //endpoint存在时，serverList 设置为空
        if (StringUtils.isNotEmpty(endpoint)) {
            serverList = "";
        }
    }
```

```java
public static String initEndpoint(final Properties properties) {
        if (properties == null) {
            return "";
        }
        // Whether to enable domain name resolution rules
        //获取环境变量 isUseEndpointParsingRule 或 nacos.use.endpoint.parsing.rule 或 默认值true
        String isUseEndpointRuleParsing = properties.getProperty(PropertyKeyConst.IS_USE_ENDPOINT_PARSING_RULE,
                System.getProperty(SystemPropertyKeyConst.IS_USE_ENDPOINT_PARSING_RULE,
                        String.valueOf(ParamUtil.USE_ENDPOINT_PARSING_RULE_DEFAULT_VALUE)));
        boolean isUseEndpointParsingRule = Boolean.parseBoolean(isUseEndpointRuleParsing);
        String endpointUrl;
        if (isUseEndpointParsingRule) {
            // Get the set domain name information
            //获取配置 endpoint
            endpointUrl = ParamUtil.parsingEndpointRule(properties.getProperty(PropertyKeyConst.ENDPOINT));
            if (StringUtils.isBlank(endpointUrl)) {
                return "";
            }
        } else {
            endpointUrl = properties.getProperty(PropertyKeyConst.ENDPOINT);
        }
        if (StringUtils.isBlank(endpointUrl)) {
            return "";
        }
        //获取 ALIBABA_ALIWARE_ENDPOINT_PORT 或 endpointPort 或默认值8080
        String endpointPort = TemplateUtils
                .stringEmptyAndThenExecute(System.getenv(PropertyKeyConst.SystemEnv.ALIBABA_ALIWARE_ENDPOINT_PORT),
                        new Callable<String>() {
                            @Override
                            public String call() {
                                return properties.getProperty(PropertyKeyConst.ENDPOINT_PORT);
                            }
                        });
        endpointPort = TemplateUtils.stringEmptyAndThenExecute(endpointPort, new Callable<String>() {
            @Override
            public String call() {
                return "8080";
            }
        });
        return endpointUrl + ":" + endpointPort;
    }
```

**9、** initWebRootContext()；

初始化nacos服务端访问路径信息

```java
public static void initWebRootContext(Properties properties) {
        final String webContext = properties.getProperty(PropertyKeyConst.CONTEXT_PATH);
        TemplateUtils.stringNotEmptyAndThenExecute(webContext, new Runnable() {
            @Override
            public void run() {
                UtilAndComs.webContext = ContextPathUtil.normalizeContextPath(webContext);
                UtilAndComs.nacosUrlBase = UtilAndComs.webContext + "/v1/ns";
                UtilAndComs.nacosUrlInstance = UtilAndComs.nacosUrlBase + "/instance";
            }
        });
        initWebRootContext();
    }
    /**
     * Init web root context.
     */
    @Deprecated
    public static void initWebRootContext() {
        // support the web context with ali-yun if the app deploy by EDAS
        final String webContext = System.getProperty(SystemPropertyKeyConst.NAMING_WEB_CONTEXT);
        TemplateUtils.stringNotEmptyAndThenExecute(webContext, new Runnable() {
            @Override
            public void run() {
                UtilAndComs.webContext = ContextPathUtil.normalizeContextPath(webContext);
                UtilAndComs.nacosUrlBase = UtilAndComs.webContext + "/v1/ns";
                UtilAndComs.nacosUrlInstance = UtilAndComs.nacosUrlBase + "/instance";
            }
        });
    }
```

**10、** NamingProxy；

1、构造方法

```java
public NamingProxy(String namespaceId, String endpoint, String serverList, Properties properties) {
        this.securityProxy = new SecurityProxy(properties, nacosRestTemplate);
        this.properties = properties;
        this.setServerPort(DEFAULT_SERVER_PORT);
        this.namespaceId = namespaceId;
        this.endpoint = endpoint;
        //重试次数
        this.maxRetry = ConvertUtils.toInt(properties.getProperty(PropertyKeyConst.NAMING_REQUEST_DOMAIN_RETRY_COUNT,
                String.valueOf(UtilAndComs.REQUEST_DOMAIN_RETRY_COUNT)));
        if (StringUtils.isNotEmpty(serverList)) {
            this.serverList = Arrays.asList(serverList.split(","));
            if (this.serverList.size() == 1) {
                this.nacosDomain = serverList;
            }
        }
        //初始化定时刷新任务
        this.initRefreshTask();
    }
    private void initRefreshTask() {
        //线程池
        this.executorService = new ScheduledThreadPoolExecutor(2, new ThreadFactory() {
            @Override
            public Thread newThread(Runnable r) {
                Thread t = new Thread(r);
                t.setName("com.alibaba.nacos.client.naming.updater");
                t.setDaemon(true);
                return t;
            }
        });
        //定时任务 refreshSrvIfNeed
        this.executorService.scheduleWithFixedDelay(new Runnable() {
            @Override
            public void run() {
                refreshSrvIfNeed();
            }
        }, 0, vipSrvRefInterMillis, TimeUnit.MILLISECONDS);
         //定时任务 login
        this.executorService.scheduleWithFixedDelay(new Runnable() {
            @Override
            public void run() {
                securityProxy.login(getServerList());
            }
        }, 0, securityInfoRefreshIntervalMills, TimeUnit.MILLISECONDS);
        refreshSrvIfNeed();
        this.securityProxy.login(getServerList());
    }
```

2、refreshSrvIfNeed( )

```java
private void refreshSrvIfNeed() {
        try {
            //校验服务端列表serverList是否为空
            if (!CollectionUtils.isEmpty(serverList)) {
                NAMING_LOGGER.debug("server list provided by user: " + serverList);
                return;
            }
            //校验刷新时间间隔
            if (System.currentTimeMillis() - lastSrvRefTime < vipSrvRefInterMillis) {
                return;
            }
            //调用远程接口获取服务端列表 "http://" + endpoint + "/nacos/serverlist"
            List<String> list = getServerListFromEndpoint();
            if (CollectionUtils.isEmpty(list)) {
                throw new Exception("Can not acquire Nacos list");
            }
            if (!CollectionUtils.isEqualCollection(list, serversFromEndpoint)) {
                NAMING_LOGGER.info("[SERVER-LIST] server list is updated: " + list);
            }
            //更新服务列表serversFromEndpoint 
            serversFromEndpoint = list;
            //更新最新刷新时间
            lastSrvRefTime = System.currentTimeMillis();
        } catch (Throwable e) {
            NAMING_LOGGER.warn("failed to update server list", e);
        }
    }
```

3、login( )

```java
public boolean login(List<String> servers) {
        try {
        	//校验刷新时间间隔
            if ((System.currentTimeMillis() - lastRefreshTime) < TimeUnit.SECONDS
                    .toMillis(tokenTtl - tokenRefreshWindow)) {
                return true;
            }
            //尝试登录nacos服务列表
            for (String server : servers) {
                if (login(server)) {
                    lastRefreshTime = System.currentTimeMillis();
                    return true;
                }
            }
        } catch (Throwable ignore) {
        }
        return false;
    }
```

**11、** BeatReactor；

客户端需要通过BeatReactor周期性的进行服务的上报，以便让nacos服务端能够实时感知服务的状态。如果一段时间内未进行上报，nacos服务端会移除该服务的注册。

**12、** HostReactor；

HostReactor把服务信息维护到serviceInfoMap中。
