# 02、SpringCloud Alibaba - nacos服务自动注册流程
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/3/2.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程
## 一、NacosServiceRegistryAutoConfiguration

```java
@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties
@ConditionalOnNacosDiscoveryEnabled
# 默认开启服务自动注册
@ConditionalOnProperty(value = "spring.cloud.service-registry.auto-registration.enabled",
		matchIfMissing = true)
@AutoConfigureAfter({
      AutoServiceRegistrationConfiguration.class,
		AutoServiceRegistrationAutoConfiguration.class,
		NacosDiscoveryAutoConfiguration.class })
public class NacosServiceRegistryAutoConfiguration {
	@Bean
	public NacosServiceRegistry nacosServiceRegistry(
			NacosDiscoveryProperties nacosDiscoveryProperties) {
		return new NacosServiceRegistry(nacosDiscoveryProperties);
	}
	@Bean
	@ConditionalOnBean(AutoServiceRegistrationProperties.class)
	public NacosRegistration nacosRegistration(
			ObjectProvider<List<NacosRegistrationCustomizer>> registrationCustomizers,
			NacosDiscoveryProperties nacosDiscoveryProperties,
			ApplicationContext context) {
		return new NacosRegistration(registrationCustomizers.getIfAvailable(),
				nacosDiscoveryProperties, context);
	}
	@Bean
	@ConditionalOnBean(AutoServiceRegistrationProperties.class)
	public NacosAutoServiceRegistration nacosAutoServiceRegistration(
			NacosServiceRegistry registry,
			AutoServiceRegistrationProperties autoServiceRegistrationProperties,
			NacosRegistration registration) {
		return new NacosAutoServiceRegistration(registry,
				autoServiceRegistrationProperties, registration);
	}
}
```

配置类中设计到的几个bean：NacosServiceRegistry 、NacosRegistration 、NacosAutoServiceRegistration 、AutoServiceRegistrationConfiguration

NacosServiceRegistry ： 实现服务的注册逻辑

NacosRegistration ： 通过 NacosRegistrationCustomizer 实现类定制化服务

NacosAutoServiceRegistration ： 服务启动后自动注册的入口

AutoServiceRegistrationConfiguration : 用于注册 AutoServiceRegistrationProperties``

## 二、注册流程

**1、** NacosAutoServiceRegistration；

它实现了ApplicationListener，监听 WebServerInitializedEvent 事件，

在spring容器启动过程中，WebServerStartStopLifecycle 发布了 ServletWebServerInitializedEvent

```java
public void start() {
        this.webServer.start();
        this.running = true;
        this.applicationContext.publishEvent(new ServletWebServerInitializedEvent(this.webServer, this.applicationContext));
    }
```

**2、** bind()；

```java
AbstractAutoServiceRegistration.java
	public void bind(WebServerInitializedEvent event) {
		ApplicationContext context = event.getApplicationContext();
		if (context instanceof ConfigurableWebServerApplicationContext) {
			if ("management".equals(((ConfigurableWebServerApplicationContext) context).getServerNamespace())) {
				return;
			}
		}
		//端口绑定
		this.port.compareAndSet(0, event.getWebServer().getPort());
		this.start();
	}
```

**3、** start()；

```java
public void start() {
		if (!isEnabled()) {
			if (logger.isDebugEnabled()) {
				logger.debug("Discovery Lifecycle disabled. Not starting");
			}
			return;
		}
		// only initialize if nonSecurePort is greater than 0 and it isn't already running
		// because of containerPortInitializer below
		if (!this.running.get()) {
		    //发布服务注册前的事件
			this.context.publishEvent(new InstancePreRegisteredEvent(this, getRegistration()));
			//服务注册
			register();
			if (shouldRegisterManagement()) {
				registerManagement();
			}
			//发布服务注册事件
			this.context.publishEvent(new InstanceRegisteredEvent<>(this, getConfiguration()));
			//运行状态设置为true
			this.running.compareAndSet(false, true);
		}
	}
```

**4、** register()；

```java
@Override
	protected void register() {
	    //校验注册功能是否打开
		if (!this.registration.getNacosDiscoveryProperties().isRegisterEnabled()) {
			log.debug("Registration disabled.");
			return;
		}
		if (this.registration.getPort() < 0) {
			this.registration.setPort(getPort().get());
		}
		//注册
		super.register();
	}
protected void register() {
		//调用 NacosServiceRegistry
		this.serviceRegistry.register(getRegistration());
	}
```

**5、** register()；

```java
NacosServiceRegistry.java
public void register(Registration registration) {
		if (StringUtils.isEmpty(registration.getServiceId())) {
			log.warn("No service to register for nacos client...");
			return;
		}
		//获取 NamingService 
		NamingService namingService = namingService();
		String serviceId = registration.getServiceId();
		String group = nacosDiscoveryProperties.getGroup();
		Instance instance = getNacosInstanceFromRegistration(registration);
		try {
			//注册
			namingService.registerInstance(serviceId, group, instance);
			log.info("nacos registry, {} {} {}:{} register finished", group, serviceId,
					instance.getIp(), instance.getPort());
		}
		catch (Exception e) {
			log.error("nacos registry, {} register failed...{},", serviceId,
					registration.toString(), e);
			// rethrow a RuntimeException if the registration is failed.
			// issue : https://github.com/alibaba/spring-cloud-alibaba/issues/1132
			rethrowRuntimeException(e);
		}
	}
```

**6、** registerInstance()；

```java
@Override
    public void registerInstance(String serviceName, String groupName, Instance instance) throws NacosException {
        NamingUtils.checkInstanceIsLegal(instance);
        String groupedServiceName = NamingUtils.getGroupedName(serviceName, groupName);
        if (instance.isEphemeral()) {
        	//构造心跳信息
            BeatInfo beatInfo = beatReactor.buildBeatInfo(groupedServiceName, instance);
            //开启心跳检测
            beatReactor.addBeatInfo(groupedServiceName, beatInfo);
        }
        //服务注册
        serverProxy.registerService(groupedServiceName, groupName, instance);
    }
```

**7、** addBeatInfo()；

```java
 public void addBeatInfo(String serviceName, BeatInfo beatInfo) {
        NAMING_LOGGER.info("[BEAT] adding beat: {} to beat map.", beatInfo);
        String key = buildKey(serviceName, beatInfo.getIp(), beatInfo.getPort());
        BeatInfo existBeat = null;
        //fix1733
        if ((existBeat = dom2Beat.remove(key)) != null) {
            existBeat.setStopped(true);
        }
        dom2Beat.put(key, beatInfo);
        //创建心跳检测任务 BeatTask，线程池执行该任务
        executorService.schedule(new BeatTask(beatInfo), beatInfo.getPeriod(), TimeUnit.MILLISECONDS);
        MetricsMonitor.getDom2BeatSizeMonitor().set(dom2Beat.size());
    }
```

**8、** registerService()；

调用nacos服务端注册服务

```java
public void registerService(String serviceName, String groupName, Instance instance) throws NacosException {
        NAMING_LOGGER.info("[REGISTER-SERVICE] {} registering service {} with instance: {}", namespaceId, serviceName,
                instance);
        //构造请求参数
        final Map<String, String> params = new HashMap<String, String>(16);
        params.put(CommonParams.NAMESPACE_ID, namespaceId);
        params.put(CommonParams.SERVICE_NAME, serviceName);
        params.put(CommonParams.GROUP_NAME, groupName);
        params.put(CommonParams.CLUSTER_NAME, instance.getClusterName());
        params.put("ip", instance.getIp());
        params.put("port", String.valueOf(instance.getPort()));
        params.put("weight", String.valueOf(instance.getWeight()));
        params.put("enable", String.valueOf(instance.isEnabled()));
        params.put("healthy", String.valueOf(instance.isHealthy()));
        params.put("ephemeral", String.valueOf(instance.isEphemeral()));
        params.put("metadata", JacksonUtils.toJson(instance.getMetadata()));
        //通过 NamingProxy调用nacos api进行服务注册
        reqApi(UtilAndComs.nacosUrlInstance, params, HttpMethod.POST);
    }
```

**9、** BeatTask；

定时任务向nacos服务端发送心跳消息

```java
class BeatTask implements Runnable {
        BeatInfo beatInfo;
        public BeatTask(BeatInfo beatInfo) {
            this.beatInfo = beatInfo;
        }
        @Override
        public void run() {
            if (beatInfo.isStopped()) {
                return;
            }
            long nextTime = beatInfo.getPeriod();
            try {
            	//请求nacos api心跳接口
                JsonNode result = serverProxy.sendBeat(beatInfo, BeatReactor.this.lightBeatEnabled);
                long interval = result.get("clientBeatInterval").asLong();
                boolean lightBeatEnabled = false;
                if (result.has(CommonParams.LIGHT_BEAT_ENABLED)) {
                    lightBeatEnabled = result.get(CommonParams.LIGHT_BEAT_ENABLED).asBoolean();
                }
                BeatReactor.this.lightBeatEnabled = lightBeatEnabled;
                if (interval > 0) {
                    nextTime = interval;
                }
                //校验返回状态码
                int code = NamingResponseCode.OK;
                if (result.has(CommonParams.CODE)) {
                    code = result.get(CommonParams.CODE).asInt();
                }
                if (code == NamingResponseCode.RESOURCE_NOT_FOUND) {
                    Instance instance = new Instance();
                    instance.setPort(beatInfo.getPort());
                    instance.setIp(beatInfo.getIp());
                    instance.setWeight(beatInfo.getWeight());
                    instance.setMetadata(beatInfo.getMetadata());
                    instance.setClusterName(beatInfo.getCluster());
                    instance.setServiceName(beatInfo.getServiceName());
                    instance.setInstanceId(instance.getInstanceId());
                    instance.setEphemeral(true);
                    try {
                    	//服务资源不存在，重新注册
                        serverProxy.registerService(beatInfo.getServiceName(),
                                NamingUtils.getGroupName(beatInfo.getServiceName()), instance);
                    } catch (Exception ignore) {
                    }
                }
            } catch (NacosException ex) {
                NAMING_LOGGER.error("[CLIENT-BEAT] failed to send beat: {}, code: {}, msg: {}",
                        JacksonUtils.toJson(beatInfo), ex.getErrCode(), ex.getErrMsg());
            }
            //延时调度 BeatTask
            executorService.schedule(new BeatTask(beatInfo), nextTime, TimeUnit.MILLISECONDS);
        }
    }
```
