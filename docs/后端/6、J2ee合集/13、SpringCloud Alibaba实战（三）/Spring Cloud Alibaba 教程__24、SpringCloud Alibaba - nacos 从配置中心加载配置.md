# 24、SpringCloud Alibaba - nacos 从配置中心加载配置
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/3/24.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程
## 启动流程

在启动main()过程中，会调用

```java
SpringApplication.run(CloudApplication.class, args);
-> prepareContext() -> applyInitializers() -> initializer.initialize(context);
```

会调用ApplicationContextInitializer 的 initialize( ) 方法

PropertySourceBootstrapConfiguration 实现了 ApplicationContextInitializer 接口，定义在 spring.factories 中。

下面看一下它的 initialize( ) 方法

**1、** initialize()；

```java
@Override
	public void initialize(ConfigurableApplicationContext applicationContext) {
		List<PropertySource<?>> composite = new ArrayList<>();
		AnnotationAwareOrderComparator.sort(this.propertySourceLocators);
		boolean empty = true;
		ConfigurableEnvironment environment = applicationContext.getEnvironment();
		for (PropertySourceLocator locator : this.propertySourceLocators) {
			//加载配置
			Collection<PropertySource<?>> source = locator.locateCollection(environment);
			if (source == null || source.size() == 0) {
				continue;
			}
			List<PropertySource<?>> sourceList = new ArrayList<>();
			for (PropertySource<?> p : source) {
				if (p instanceof EnumerablePropertySource) {
					EnumerablePropertySource<?> enumerable = (EnumerablePropertySource<?>) p;
					sourceList.add(new BootstrapPropertySource<>(enumerable));
				}
				else {
					sourceList.add(new SimpleBootstrapPropertySource(p));
				}
			}
			logger.info("Located property source: " + sourceList);
			composite.addAll(sourceList);
			empty = false;
		}
		if (!empty) {
			MutablePropertySources propertySources = environment.getPropertySources();
			String logConfig = environment.resolvePlaceholders("${logging.config:}");
			LogFile logFile = LogFile.get(environment);
			for (PropertySource<?> p : environment.getPropertySources()) {
				if (p.getName().startsWith(BOOTSTRAP_PROPERTY_SOURCE_NAME)) {
					propertySources.remove(p.getName());
				}
			}
			insertPropertySources(propertySources, composite);
			reinitializeLoggingSystem(environment, logConfig, logFile);
			setLogLevels(applicationContext, environment);
			handleIncludedProfiles(environment);
		}
	}
```

**2、** locateCollection()；

PropertySourceLocator 的实现类是 NacosPropertySourceLocator

```java
default Collection<PropertySource<?>> locateCollection(Environment environment) {
		return locateCollection(this, environment);
	}
```

```java
static Collection<PropertySource<?>> locateCollection(PropertySourceLocator locator, Environment environment) {
		//加载配置
		PropertySource<?> propertySource = locator.locate(environment);
		if (propertySource == null) {
			return Collections.emptyList();
		}
		if (CompositePropertySource.class.isInstance(propertySource)) {
			Collection<PropertySource<?>> sources = ((CompositePropertySource) propertySource).getPropertySources();
			List<PropertySource<?>> filteredSources = new ArrayList<>();
			for (PropertySource<?> p : sources) {
				if (p != null) {
					filteredSources.add(p);
				}
			}
			return filteredSources;
		}
		else {
			return Arrays.asList(propertySource);
		}
	}
```

**3、** locator.locate(environment)；

```java
	@Override
	public PropertySource<?> locate(Environment env) {
		nacosConfigProperties.setEnvironment(env);
		//NacosConfigService
		ConfigService configService = nacosConfigManager.getConfigService();
		if (null == configService) {
			log.warn("no instance of config service found, can't load config from nacos");
			return null;
		}
		long timeout = nacosConfigProperties.getTimeout();
		nacosPropertySourceBuilder = new NacosPropertySourceBuilder(configService,
				timeout);
		// dataIdPrefix 首先从spring.cloud.nacos.config.prefix获取，
		//不存在时从spring.cloud.nacos.config.name获取，
		//还不存在时从spring.application.name获取
		//spring.cloud.nacos.config.name
		String name = nacosConfigProperties.getName();
		//spring.cloud.nacos.config.prefix
		String dataIdPrefix = nacosConfigProperties.getPrefix();
		if (StringUtils.isEmpty(dataIdPrefix)) {
			dataIdPrefix = name;
		}
		if (StringUtils.isEmpty(dataIdPrefix)) {
			//spring.application.name
			dataIdPrefix = env.getProperty("spring.application.name");
		}
		CompositePropertySource composite = new CompositePropertySource(
				NACOS_PROPERTY_SOURCE_NAME);
		//加载共享的配置 
		// spring.cloud.nacos.config.sharedConfigs[0].dataId
		loadSharedConfiguration(composite);
		//加载额外的配置
		// spring.cloud.nacos.config.extensionConfigs[0].dataId
		loadExtConfiguration(composite);
		//加载应用的配置
		loadApplicationConfiguration(composite, dataIdPrefix, nacosConfigProperties, env);
		return composite;
	}
```

**4、** loadApplicationConfiguration()；

```java
	private void loadApplicationConfiguration(
			CompositePropertySource compositePropertySource, String dataIdPrefix,
			NacosConfigProperties properties, Environment environment) {
		//配置文件后缀，默认是 properties
		String fileExtension = properties.getFileExtension();
		//配置所属组，默认是 DEFAULT_GROUP
		String nacosGroup = properties.getGroup();
		// load directly once by default
		loadNacosDataIfPresent(compositePropertySource, dataIdPrefix, nacosGroup,
				fileExtension, true);
		// load with suffix, which have a higher priority than the default
		//加载配置文件，如 client.properties
		loadNacosDataIfPresent(compositePropertySource,
				dataIdPrefix + DOT + fileExtension, nacosGroup, fileExtension, true);
		// Loaded with profile, which have a higher priority than the suffix
		for (String profile : environment.getActiveProfiles()) {
			//加载profile配置文件，如 client-dev.properties
			String dataId = dataIdPrefix + SEP1 + profile + DOT + fileExtension;
			loadNacosDataIfPresent(compositePropertySource, dataId, nacosGroup,
					fileExtension, true);
		}
	}
```

**5、** loadNacosDataIfPresent()；

```java
	private void loadNacosDataIfPresent(final CompositePropertySource composite,
			final String dataId, final String group, String fileExtension,
			boolean isRefreshable) {
		if (null == dataId || dataId.trim().length() < 1) {
			return;
		}
		if (null == group || group.trim().length() < 1) {
			return;
		}
		//加载配置
		NacosPropertySource propertySource = this.loadNacosPropertySource(dataId, group,
				fileExtension, isRefreshable);
		//放在CompositePropertySource 中的首位
		this.addFirstPropertySource(composite, propertySource, false);
	}
```

**6、** loadNacosPropertySource()；

```java
private NacosPropertySource loadNacosPropertySource(final String dataId,
			final String group, String fileExtension, boolean isRefreshable) {
		if (NacosContextRefresher.getRefreshCount() != 0) {
			if (!isRefreshable) {
				//从缓存中获取
				return NacosPropertySourceRepository.getNacosPropertySource(dataId,
						group);
			}
		}
		//从远程获取
		return nacosPropertySourceBuilder.build(dataId, group, fileExtension,
				isRefreshable);
	}
```

**7、** nacosPropertySourceBuilder.build()；

```java
	NacosPropertySource build(String dataId, String group, String fileExtension,
			boolean isRefreshable) {
		//加载nacos服务端配置数据
		List<PropertySource<?>> propertySources = loadNacosData(dataId, group,
				fileExtension);
		NacosPropertySource nacosPropertySource = new NacosPropertySource(propertySources,
				group, dataId, new Date(), isRefreshable);
		//放入缓存
		NacosPropertySourceRepository.collectNacosPropertySource(nacosPropertySource);
		return nacosPropertySource;
	}
```

**8、** loadNacosData()；

```java
	private List<PropertySource<?>> loadNacosData(String dataId, String group,
			String fileExtension) {
		String data = null;
		try {
			//加载配置
			data = configService.getConfig(dataId, group, timeout);
			if (StringUtils.isEmpty(data)) {
				log.warn(
						"Ignore the empty nacos configuration and get it based on dataId[{}] & group[{}]",
						dataId, group);
				return Collections.emptyList();
			}
			if (log.isDebugEnabled()) {
				log.debug(String.format(
						"Loading nacos data, dataId: '%s', group: '%s', data: %s", dataId,
						group, data));
			}
			//解析配置
			return NacosDataParserHandler.getInstance().parseNacosData(dataId, data,
					fileExtension);
		}
		catch (NacosException e) {
			log.error("get data from Nacos error,dataId:{} ", dataId, e);
		}
		catch (Exception e) {
			log.error("parse data from Nacos error,dataId:{},data:{}", dataId, data, e);
		}
		return Collections.emptyList();
	}
```

**9、** configService.getConfig()；

```java
 	@Override
    public String getConfig(String dataId, String group, long timeoutMs) throws NacosException {
        return getConfigInner(namespace, dataId, group, timeoutMs);
    }
```

```java
	private String getConfigInner(String tenant, String dataId, String group, long timeoutMs) throws NacosException {
        group = null2defaultGroup(group);
        ParamUtils.checkKeyParam(dataId, group);
        ConfigResponse cr = new ConfigResponse();
        cr.setDataId(dataId);
        cr.setTenant(tenant);
        cr.setGroup(group);
        // 优先使用本地配置
        //故障转移，从本地获取
        String content = LocalConfigInfoProcessor.getFailover(agent.getName(), dataId, group, tenant);
        if (content != null) {
            LOGGER.warn("[{}] [get-config] get failover ok, dataId={}, group={}, tenant={}, config={}", agent.getName(),
                    dataId, group, tenant, ContentUtils.truncateContent(content));
            cr.setContent(content);
            configFilterChainManager.doFilter(null, cr);
            content = cr.getContent();
            return content;
        }
        try {
        	//从远程获取
            String[] ct = worker.getServerConfig(dataId, group, tenant, timeoutMs);
            cr.setContent(ct[0]);
            configFilterChainManager.doFilter(null, cr);
            content = cr.getContent();
            return content;
        } catch (NacosException ioe) {
            if (NacosException.NO_RIGHT == ioe.getErrCode()) {
                throw ioe;
            }
            LOGGER.warn("[{}] [get-config] get from server error, dataId={}, group={}, tenant={}, msg={}",
                    agent.getName(), dataId, group, tenant, ioe.toString());
        }
        LOGGER.warn("[{}] [get-config] get snapshot ok, dataId={}, group={}, tenant={}, config={}", agent.getName(),
                dataId, group, tenant, ContentUtils.truncateContent(content));
        //从快照获取
        content = LocalConfigInfoProcessor.getSnapshot(agent.getName(), dataId, group, tenant);
        cr.setContent(content);
        configFilterChainManager.doFilter(null, cr);
        content = cr.getContent();
        return content;
    }
```

**10、** getServerConfig()；

```java
 	public String[] getServerConfig(String dataId, String group, String tenant, long readTimeout)
            throws NacosException {
        String[] ct = new String[2];
        if (StringUtils.isBlank(group)) {
            group = Constants.DEFAULT_GROUP;
        }
        HttpRestResult<String> result = null;
        try {
            Map<String, String> params = new HashMap<String, String>(3);
            if (StringUtils.isBlank(tenant)) {
                params.put("dataId", dataId);
                params.put("group", group);
            } else {
                params.put("dataId", dataId);
                params.put("group", group);
                params.put("tenant", tenant);
            }
            //调用http get 获取
            result = agent.httpGet(Constants.CONFIG_CONTROLLER_PATH, null, params, agent.getEncode(), readTimeout);
        } catch (Exception ex) {
            String message = String
                    .format("[%s] [sub-server] get server config exception, dataId=%s, group=%s, tenant=%s",
                            agent.getName(), dataId, group, tenant);
            LOGGER.error(message, ex);
            throw new NacosException(NacosException.SERVER_ERROR, ex);
        }
        switch (result.getCode()) {
            case HttpURLConnection.HTTP_OK:
            	//200 响应成功，保存快照
                LocalConfigInfoProcessor.saveSnapshot(agent.getName(), dataId, group, tenant, result.getData());
                ct[0] = result.getData();
                if (result.getHeader().getValue(CONFIG_TYPE) != null) {
                    ct[1] = result.getHeader().getValue(CONFIG_TYPE);
                } else {
                    ct[1] = ConfigType.TEXT.getType();
                }
                return ct;
            case HttpURLConnection.HTTP_NOT_FOUND:
            	//404资源不存在，清理本地快照
                LocalConfigInfoProcessor.saveSnapshot(agent.getName(), dataId, group, tenant, null);
                return ct;
            case HttpURLConnection.HTTP_CONFLICT: {
                LOGGER.error(
                        "[{}] [sub-server-error] get server config being modified concurrently, dataId={}, group={}, "
                                + "tenant={}", agent.getName(), dataId, group, tenant);
                throw new NacosException(NacosException.CONFLICT,
                        "data being modified, dataId=" + dataId + ",group=" + group + ",tenant=" + tenant);
            }
            case HttpURLConnection.HTTP_FORBIDDEN: {
                LOGGER.error("[{}] [sub-server-error] no right, dataId={}, group={}, tenant={}", agent.getName(),
                        dataId, group, tenant);
                throw new NacosException(result.getCode(), result.getMessage());
            }
            default: {
                LOGGER.error("[{}] [sub-server-error]  dataId={}, group={}, tenant={}, code={}", agent.getName(),
                        dataId, group, tenant, result.getCode());
                throw new NacosException(result.getCode(),
                        "http error, code=" + result.getCode() + ",dataId=" + dataId + ",group=" + group + ",tenant="
                                + tenant);
            }
        }
    }
```

**11、** httpGet()；

```java
 @Override
    public HttpRestResult<String> httpGet(String path, Map<String, String> headers, Map<String, String> paramValues,
            String encode, long readTimeoutMs) throws Exception {
        Histogram.Timer timer = MetricsMonitor.getConfigRequestMonitor("GET", path, "NA");
        HttpRestResult<String> result;
        try {
        	//执行远程调用
            result = httpAgent.httpGet(path, headers, paramValues, encode, readTimeoutMs);
        } catch (IOException e) {
            throw e;
        } finally {
            timer.observeDuration();
            timer.close();
        }
        return result;
    }
```

**12、** httpAgent.httpGet()；

```java
   @Override
    public HttpRestResult<String> httpGet(String path, Map<String, String> headers, Map<String, String> paramValues,
            String encode, long readTimeoutMs) throws Exception {
        final long endTime = System.currentTimeMillis() + readTimeoutMs;
        injectSecurityInfo(paramValues);
        //nacos 服务端地址
        String currentServerAddr = serverListMgr.getCurrentServerAddr();
        int maxRetry = this.maxRetry;
        HttpClientConfig httpConfig = HttpClientConfig.builder()
                .setReadTimeOutMillis(Long.valueOf(readTimeoutMs).intValue())
                .setConTimeOutMillis(ConfigHttpClientManager.getInstance().getConnectTimeoutOrDefault(100)).build();
        do {
            try {
                Header newHeaders = getSpasHeaders(paramValues, encode);
                if (headers != null) {
                    newHeaders.addAll(headers);
                }
                Query query = Query.newInstance().initParams(paramValues);
                //最终使用 java.net.HttpURLConnection 类进行远程调用
                HttpRestResult<String> result = NACOS_RESTTEMPLATE
                        .get(getUrl(currentServerAddr, path), httpConfig, newHeaders, query, String.class);
                if (isFail(result)) {
                    LOGGER.error("[NACOS ConnectException] currentServerAddr: {}, httpCode: {}",
                            serverListMgr.getCurrentServerAddr(), result.getCode());
                } else {
                    // Update the currently available server addr
                    //更新当前可用的 nacos 服务地址
                    serverListMgr.updateCurrentServerAddr(currentServerAddr);
                    return result;
                }
            } catch (ConnectException connectException) {
                LOGGER.error("[NACOS ConnectException httpGet] currentServerAddr:{}, err : {}",
                        serverListMgr.getCurrentServerAddr(), connectException.getMessage());
            } catch (SocketTimeoutException socketTimeoutException) {
                LOGGER.error("[NACOS SocketTimeoutException httpGet] currentServerAddr:{}， err : {}",
                        serverListMgr.getCurrentServerAddr(), socketTimeoutException.getMessage());
            } catch (Exception ex) {
                LOGGER.error("[NACOS Exception httpGet] currentServerAddr: " + serverListMgr.getCurrentServerAddr(),
                        ex);
                throw ex;
            }
            if (serverListMgr.getIterator().hasNext()) {
                currentServerAddr = serverListMgr.getIterator().next();
            } else {
                maxRetry--;
                if (maxRetry < 0) {
                    throw new ConnectException(
                            "[NACOS HTTP-GET] The maximum number of tolerable server reconnection errors has been reached");
                }
                serverListMgr.refreshCurrentServerAddr();
            }
        } while (System.currentTimeMillis() <= endTime);
        LOGGER.error("no available server");
        throw new ConnectException("no available server");
    }
```
