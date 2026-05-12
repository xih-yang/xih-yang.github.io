# 12、Dubbo 2.7 源码解析 - 之 服务发布
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/3/12.html
- 分类：J2EE框架
- 分组：教程目录
## 源码解析 之 服务发布

## 1. 查找服务发布的入口

之前已经分析过标签解析了，现在我们看下这个标签解析后封装的类：

```java
public class ServiceBean<T> extends ServiceConfig<T> implements InitializingBean, DisposableBean, ApplicationContextAware, ApplicationListener<ContextRefreshedEvent>, BeanNameAware,ApplicationEventPublisherAware {
	...
}
```

ServiceBean实现的众多接口中，我们需要关注ApplicationListener，它是一个监听器，可以监听任意ApplicationEvent事件

```java
public interface ApplicationListener<E extends ApplicationEvent> extends EventListener {
	/**
	 * Handle an application event.
	 * @param event the event to respond to
	 */
	void onApplicationEvent(E event);
}
```

看下ServiceBean对ApplicationListener的实现：

```java
// org.apache.dubbo.config.spring.ServiceBean#onApplicationEvent
// 当Spring容器刷新时会触发其执行
// 刷新Spring容器的时机非常多，但是有一个场景一定会刷新，就是Spring容器刚创建的时候
@Override
public void onApplicationEvent(ContextRefreshedEvent event) {
    // 若当前service尚未发布，也没有取消发布，则进行发布
    if (!isExported() && !isUnexported()) {
        if (logger.isInfoEnabled()) {
            logger.info("The service ready on spring started. service: " + getInterface());
        }
        // 发布服务
        export();
    }
}
```

看到ServiceBean会监听Spring容器的刷新事件，看下真正的服务发布方法export：

```java
//org.apache.dubbo.config.spring.ServiceBean#export
public void export() {
    super.export();
    // 发布成功后发布Export事件
    // Publish ServiceBeanExportedEvent
    publishExportEvent();
}
```

主要关注super.export方法，其实现在父类ServiceConfig：

```java
//org.apache.dubbo.config.ServiceConfig#export
public synchronized void export() {
    // 检查并更新子配置，之前分析IOC注入逻辑时候跟过，主要分析的是动态配置中心的获取流程
    // 现在不看了，直接往下走
    checkAndUpdateSubConfigs();
    // 若配置的是不发布服务，则直接结束
    if (!shouldExport()) {
        return;
    }
    // 判断是否延迟发布
    if (shouldDelay()) {
        // 如果延迟发布则定义定时任务     this::doExport Lambda中的实例方法引用
        DELAY_EXPORT_EXECUTOR.schedule(this::doExport, getDelay(), TimeUnit.MILLISECONDS);
    } else {
        // 直接发布
        doExport();
    }
}
```

看下shouldExport方法，判断是否发布：

```java
//org.apache.dubbo.config.ServiceConfig#shouldExport
private boolean shouldExport() {
    Boolean export = getExport();
    // default value is true
    return export == null ? true : export;
}
//org.apache.dubbo.config.ServiceConfig#getExport
public Boolean getExport() {
    // 若<dubbo:service/>的export属性不为null，则直接返回
    // 若<dubbo:service/>的export属性为null，且<dubbo:provider/>标签不为null，
    // 则取<dubbbo:provider/>的export属性
    // 即<dubbo:service/>优先级比<dubbbo:provider/>高
    return (export == null && provider != null) ? provider.getExport() : export;
}
```

看下shouldDelay，是否延迟发布：

```java
//org.apache.dubbo.config.ServiceConfig#shouldDelay
private boolean shouldDelay() {
    Integer delay = getDelay();
    return delay != null && delay > 0;
}
//org.apache.dubbo.config.ServiceConfig#getDelay
public Integer getDelay() {
    return (delay == null && provider != null) ? provider.getDelay() : delay;
}
```

现在我们看核心方法doExport，发布服务：

```java
protected synchronized void doExport() {
	//判断是否取消发布
    if (unexported) {
        throw new IllegalStateException("The service " + interfaceClass.getName() + " has already unexported!");
    }
    //判断是否发布过了
    if (exported) {
        return;
    }
    // 修改发布状态
    exported = true;
    if (StringUtils.isEmpty(path)) {
	    //path就是service name
	    //会作为URL里面的路径，在dubbo中表示服务类型
        path = interfaceName;
    }
    doExportUrls();
}
```

继续跟doExportUrls，这个方法就是真正发布的动作。

```java
//org.apache.dubbo.config.ServiceConfig#doExportUrls
private void doExportUrls() {
    // 加载多注册中心（形成标准化的注册中心URL）
    List<URL> registryURLs = loadRegistries(true);
    // 遍历当前service的所有服务暴露协议
    for (ProtocolConfig protocolConfig : protocols) {
        String pathKey = URL.buildKey(getContextPath(protocolConfig).map(p -> p + "/" + path).orElse(path), group, version);
        ProviderModel providerModel = new ProviderModel(pathKey, ref, interfaceClass);
        ApplicationModel.initProviderModel(pathKey, providerModel);
        // 使用一个协议将service暴露到所有注册中心
        doExportUrlsFor1Protocol(protocolConfig, registryURLs);
    }
}
```

## 2. 服务发布流程概要

服务发布概括的说，分下面几步：

- 1.加载所有的注册中心
- 2.获取服务配置的所有协议，并遍历（每种协议都会将服务发布一次到所有注册中心）
- 3.根据Service、注册中心、暴露协议等各种信息 形成注册的URL（Dubbo两大设计原则之一：URL 作为配置信息的统一格式）
- 4.对URL进行服务暴露，其中服务暴露分本地暴露和远程暴露
- 4.1本地暴露

先用该URL构建Invoker
- `再使用injvm伪协议对Invoker进行暴露`
- 服务暴露最终会形成Exporter

4.2 远程暴露（分有注册中心、没注册中心两种情况）

- 先用该URL构建Invoker
- `再使用的上面第2步遍历的配置的协议进行暴露`
- 服务暴露最终会形成Exporter

5.其中关于有/没注册中心的情况

没有注册中心，直接使用配置的协议进行暴露

有注册中心会用RegistryProtocol进行服务暴露（`相比于没有注册中心情况，只是多做了注册到注册中心的动作，最终还是会用配置的协议进行暴露`）

6.其中关于配置的协议暴露，我们会专门分析Dubbo协议的服务暴露。

## 3. 流程分析

### 3.1 加载所有的注册中心

继续看doExportUrls方法：

```java
//org.apache.dubbo.config.ServiceConfig#doExportUrls
private void doExportUrls() {
    // 加载多注册中心（形成标准化的注册中心URL）
    List<URL> registryURLs = loadRegistries(true);
    // 遍历当前service的所有服务暴露协议
    for (ProtocolConfig protocolConfig : protocols) {
        String pathKey = URL.buildKey(getContextPath(protocolConfig).map(p -> p + "/" + path).orElse(path), group, version);
        ProviderModel providerModel = new ProviderModel(pathKey, ref, interfaceClass);
        ApplicationModel.initProviderModel(pathKey, providerModel);
        // 使用一个协议将service暴露到所有注册中心
        doExportUrlsFor1Protocol(protocolConfig, registryURLs);
    }
}
```

我们先分析加载注册中心的逻辑，看loadRegistries方法，`其中入参是一个布尔值，true代表当前是提供者`：

```java
//org.apache.dubbo.config.AbstractInterfaceConfig#loadRegistries
//provider：代表当前是provider还是consummer，consummer也会调用这个方法，后面分析订阅可以看到
protected List<URL> loadRegistries(boolean provider) {
    // check && override if necessary
    List<URL> registryList = new ArrayList<URL>();
    // 若注册中心不为空
    if (CollectionUtils.isNotEmpty(registries)) {
        // 遍历所有注册中心
        for (RegistryConfig config : registries) {
            // 获取<dubbo:registry/>的address属性
            String address = config.getAddress();
            // 若没有设置address属性，则对所有ip均成立
            if (StringUtils.isEmpty(address)) {
	            //0.0.0.0，广播地址
                address = ANYHOST_VALUE;
            }
            // 若当前不是直连     NO_AVAILABLE值为N/A
            if (!RegistryConfig.NO_AVAILABLE.equalsIgnoreCase(address)) {
                // 该map中用于存放要组装url的数据    xxx://xxx/xxx&xxx&xxxx
                Map<String, String> map = new HashMap<String, String>();
                // 将<dubbo:application/>中的属性写入到map
                appendParameters(map, application);
                // 将<dubbo:registry/>中的属性写入到map
                appendParameters(map, config);
                // 将path写入到map
                // 这里path值为org.apache.dubbo.registry.RegistryService
                // dubbo中所有配置都是用URL来表示的，而用URL的path代表服务名
                map.put(PATH_KEY, RegistryService.class.getName());
                // 将运行时的一些参数写入到map，例如dubbo协议版本、dubbo版本号、时间戳、PID
                appendRuntimeParameters(map);
                if (!map.containsKey(PROTOCOL_KEY)) {
                	//如果注册中心没有指定协议，默认是dubbo协议
                    map.put(PROTOCOL_KEY, DUBBO_PROTOCOL);
                }
                // 从一个地址解析出多个URL
                // 即处理注册中心集群的情况
                // 并会在URL上拼接map中的属性
                List<URL> urls = UrlUtils.parseURLs(address, map);
                for (URL url : urls) {
	                // 将原来的类似于 zookeeper://zkOS:2181?...&..&..格式的地址
	                // 格式化为 registry://zkOS:2181?....&xxx& registry=zookeeper
	                // 即不管连接的哪一个注册中心，格式都是registry://xxxxx?& registry=xxx
	                // 用registry属性代表了注册中心类型
                    url = URLBuilder.from(url)
                            .addParameter(REGISTRY_KEY, url.getProtocol())
                            .setProtocol(REGISTRY_PROTOCOL)
                            .build();
                    // 若当前为提供者，且需要注册，  或  当前为消费者，且需要订阅
                    // 则记录下这个URL
                    // <dubbo:service/>标签的register属性为true，代表需要注册，没有指定则取默认值true
                    // <dubbo:reference/>标签的subscribe属性为true，代表需要订阅，没有指定则取默认值true
                    if ((provider && url.getParameter(REGISTER_KEY, true))
                            || (!provider && url.getParameter(SUBSCRIBE_KEY, true))) {
                        registryList.add(url);
                    }
                }
            }
        }
    }
    //返回的就是需要注册的注册中心集合
    return registryList;
}
```

主要看下解析地址，拼接map中属性的方法UrlUtils.parseURLs(address, map)：

```java
//org.apache.dubbo.common.utils.UrlUtils#parseURLs
public static List<URL> parseURLs(String address, Map<String, String> defaults) {
    if (address == null || address.length() == 0) {
        return null;
    }
    // 使用分隔符分隔地址为多个地址
    String[] addresses = REGISTRY_SPLIT_PATTERN.split(address);
    if (addresses == null || addresses.length == 0) {
        return null; //here won't be empty
    }
    List<URL> registries = new ArrayList<URL>();
    // 分隔出的每个地址形成URL后存放起来
    for (String addr : addresses) {
    	//parseURL里会对Map中的数据进行一些处理，最终形成URL，就不跟了
        registries.add(parseURL(addr, defaults));
    }
    return registries;
}
```

> DEBUG：看一下url的转换
>
>
>
> 往下走：

### 3.2 获取服务配置的所有协议，并遍历（每种协议都会将服务发布一次到所有注册中心）

回到doExportUrls方法：

```java
//org.apache.dubbo.config.ServiceConfig#doExportUrls
private void doExportUrls() {
    // 加载多注册中心（形成标准化的注册中心URL）
    List<URL> registryURLs = loadRegistries(true);
    // 遍历当前service的所有服务暴露协议
    for (ProtocolConfig protocolConfig : protocols) {
        String pathKey = URL.buildKey(getContextPath(protocolConfig).map(p -> p + "/" + path).orElse(path), group, version);
        ProviderModel providerModel = new ProviderModel(pathKey, ref, interfaceClass);
        ApplicationModel.initProviderModel(pathKey, providerModel);
        // 使用一个协议将service暴露到所有注册中心
        doExportUrlsFor1Protocol(protocolConfig, registryURLs);
    }
}
```

这里没什么好说的，一眼就看出遍历当前服务配置要发布的所有协议。

#### (1) pathKey生成逻辑

这里我们主要看一下pathKey生成的内容是啥，看`String pathKey = URL.buildKey(getContextPath(protocolConfig).map(p -> p + "/" + path).orElse(path), group, version);`这一行方法：

这个pathKey 就是将来该服务写入到ZK的提供者临时节点的节点名字，可以看到由path服务名、group组号和version版本号组成，代表服务名称。

拆开来分析，先看getContextPath(protocolConfig)方法：

```java
//org.apache.dubbo.config.ServiceConfig#getContextPath
private Optional<String> getContextPath(ProtocolConfig protocolConfig) {
	// protocolConfig就是暴露协议标签封装的对象
    // 获取<dubbo:protocol/>的contextPath属性
    String contextPath = protocolConfig.getContextpath();
    if (StringUtils.isEmpty(contextPath) && provider != null) {
        // 获取<dubbo:provider/>的contextPath属性
        contextPath = provider.getContextpath();
    }
    //Optional是jdk8提供的，代表"可选的对象"
    return Optional.ofNullable(contextPath);
}
```

> dubbo:protocol/和dubbo:provider/都可以配置contextpath属性：
>
> contextPath属性代表的是应用的上下文路径

getContextPath(protocolConfig)返回的是Optional对象，`Optional.map(p -> p + "/" + path).orElse(path)`方法中，map中的p代表的就是Optional中封装的对象，如果封装的对象不空就会执行map方法，做了一个字符串拼接，如果封装的对象为空，map方法就不会执行，而执行orElse的时候，如果封装的对象不为空，直接返回封装的对象，否则返回path，`即Optional中封装的对象不为空，最终结果为p + "/" + path，空，最终结果为path。`

> 大部分情况都不会配置这个contextPath，所以这里path一般都是服务接口名。

看下合并的方法

```java
//org.apache.dubbo.common.URL#buildKey
public static String buildKey(String path, String group, String version) {
    StringBuilder buf = new StringBuilder();
    if (group != null && group.length() > 0) {
        buf.append(group).append("/");
    }
    buf.append(path);
    if (version != null && version.length() > 0) {
        buf.append(":").append(version);
    }
    //group/xx.xxx.xxxService/:0.0.0
    return buf.toString();
}
```

#### (2) 初始化提供者模型

pathKey生成以后，接下来看下`ApplicationModel.initProviderModel(pathKey, providerModel)`方法：

```java
//org.apache.dubbo.config.ServiceConfig#doExportUrls
private void doExportUrls() {
    // 加载多注册中心（形成标准化的注册中心URL）
    List<URL> registryURLs = loadRegistries(true);
    // 遍历当前service的所有服务暴露协议
    for (ProtocolConfig protocolConfig : protocols) {
        String pathKey = URL.buildKey(getContextPath(protocolConfig).map(p -> p + "/" + path).orElse(path), group, version);
        ProviderModel providerModel = new ProviderModel(pathKey, ref, interfaceClass);
        ApplicationModel.initProviderModel(pathKey, providerModel);
        // 使用一个协议将service暴露到所有注册中心
        doExportUrlsFor1Protocol(protocolConfig, registryURLs);
    }
}
```

先看下ProviderModel：

```java
/**
 * ProviderModel which is about published services
 * 关于已发布的服务的ProviderModel
 */
public class ProviderModel {
    private final String serviceName;
    private final Object serviceInstance;
    private final Class<?> serviceInterfaceClass;
    private final Map<String, List<ProviderMethodModel>> methods = new HashMap<String, List<ProviderMethodModel>>();
    public ProviderModel(String serviceName, Object serviceInstance, Class<?> serviceInterfaceClass) {
        if (null == serviceInstance) {
            throw new IllegalArgumentException("Service[" + serviceName + "]Target is NULL.");
        }
		//服务名称
        this.serviceName = serviceName;
        //服务提供者
        this.serviceInstance = serviceInstance;
        //服务接口
        this.serviceInterfaceClass = serviceInterfaceClass;
		//初始化方法，将方法转成ProviderMethodModel
        initMethod();
    }
    ...
}
```

在看下ApplicationModel#initProviderModel方法，ApplicationModel统一维护了提供者模型和消费者模型：

```java
/**
 * Represent a application which is using Dubbo and store basic metadata info for using
 * during the processing of RPC invoking.
 *
 * ApplicationModel includes many ProviderModel which is about published services
 * and many Consumer Model which is about subscribed services.
 *
 * adjust project structure in order to fully utilize the methods introduced here.
 */
public class ApplicationModel {
	...
    /**
     * full qualified class name -> provided service
     */
    private static final ConcurrentMap<String, ProviderModel> PROVIDED_SERVICES = new ConcurrentHashMap<>();
    /**
     * full qualified class name -> subscribe service
     */
    private static final ConcurrentMap<String, ConsumerModel> CONSUMED_SERVICES = new ConcurrentHashMap<>();
	...
    public static void initProviderModel(String serviceName, ProviderModel providerModel) {
        if (PROVIDED_SERVICES.putIfAbsent(serviceName, providerModel) != null) {
            LOGGER.warn("Already register the same:" + serviceName);
        }
    }
    ...
}
```

这个时候仅仅放了一个Provider模型，还没有具体的东西。

> java.util.concurrent.ConcurrentMap#putIfAbsent
>
>
>
> ```plaintext
```java 
/**
 * If the specified key is not already associated
 * with a value, associate it with the given value.
 * This is equivalent to
 * 等价于下面
 *  <pre> {@code
 * if (!map.containsKey(key))
 *   return map.put(key, value);
 * else
 *   return map.get(key);
 * }</pre>
 * 不包含这个key，就将key/value放入map，并返回null
 * 包含的话直接返回已经存在的value
 * ...
 */
 V putIfAbsent(K key, V value);
```

```plaintext
### 3.3 根据Service、注册中心、暴露协议等各种信息 形成注册的URL
```java 
//org.apache.dubbo.config.ServiceConfig#doExportUrls
private void doExportUrls() {
    // 加载多注册中心（形成标准化的注册中心URL）
    List<URL> registryURLs = loadRegistries(true);
    // 遍历当前service的所有服务暴露协议
    for (ProtocolConfig protocolConfig : protocols) {
        String pathKey = URL.buildKey(getContextPath(protocolConfig).map(p -> p + "/" + path).orElse(path), group, version);
        ProviderModel providerModel = new ProviderModel(pathKey, ref, interfaceClass);
        ApplicationModel.initProviderModel(pathKey, providerModel);
        // 使用一个协议将service暴露到所有注册中心
        doExportUrlsFor1Protocol(protocolConfig, registryURLs);
    }
}
```

接下来看最重要的doExportUrlsFor1Protocol方法，先看上半部分组装URL的逻辑：

```java
//org.apache.dubbo.config.ServiceConfig#doExportUrlsFor1Protocol
private void doExportUrlsFor1Protocol(ProtocolConfig protocolConfig, List<URL> registryURLs) {
    // 获取服务暴露协议名称
    String name = protocolConfig.getName();
    if (StringUtils.isEmpty(name)) {
	    //空的话默认Dubbo
        name = DUBBO;
    }
    // 创建并初始化用于存放元数据信息的map
    Map<String, String> map = new HashMap<String, String>();
    // side=provider代表提供者
    map.put(SIDE_KEY, PROVIDER_SIDE);
	//添加运行时数据
    appendRuntimeParameters(map);
    //添加各种标签对应的元数据
    appendParameters(map, metrics);
    appendParameters(map, application);
    appendParameters(map, module);
    // remove 'default.' prefix for configs from ProviderConfig
    // appendParameters(map, provider, Constants.DEFAULT_KEY);
    appendParameters(map, provider);
    appendParameters(map, protocolConfig);
    appendParameters(map, this);
    // 方法级别的标签处理
    if (CollectionUtils.isNotEmpty(methods)) {
        for (MethodConfig method : methods) {
	        //也是添加各种元数据
			...
        } // end of methods for
    }
	//判断是否是泛化服务，对接口的方法的处理
    if (ProtocolUtils.isGeneric(generic)) {
        map.put(GENERIC_KEY, generic);
        map.put(METHODS_KEY, ANY_VALUE);
    } else {
        String revision = Version.getVersion(interfaceClass, version);
        if (revision != null && revision.length() > 0) {
            map.put(REVISION_KEY, revision);
        }
        String[] methods = Wrapper.getWrapper(interfaceClass).getMethodNames();
        if (methods.length == 0) {
            logger.warn("No method found in service interface " + interfaceClass.getName());
            map.put(METHODS_KEY, ANY_VALUE);
        } else {
            map.put(METHODS_KEY, StringUtils.join(new HashSet<String>(Arrays.asList(methods)), ","));
        }
    }
    if (!ConfigUtils.isEmpty(token)) {
        if (ConfigUtils.isDefault(token)) {
            map.put(TOKEN_KEY, UUID.randomUUID().toString());
        } else {
            map.put(TOKEN_KEY, token);
        }
    }  // map的初始化-end
	// 上面所有代码都是在做元数据map的初始化
    // export service
    //为服务提供者注册和绑定IP地址，可以单独配置。(配置优先级:环境变量-> java系统属性->配置文件中的主机属性->/etc/hosts ->默认网络地址->第一个可用网络地址)
    String host = this.findConfigedHosts(protocolConfig, registryURLs, map);
    //为服务提供者注册和绑定端口，可以单独配置(配置优先级:环境变量-> java系统属性-协议配置文件中的>端口属性->协议默认端口)
    Integer port = this.findConfigedPorts(protocolConfig, name, map);
    // 使用暴露协议名称、host、port、path(服务接口名)及元数据(map)组装为一个URL
    URL url = new URL(name, host, port, getContextPath(protocolConfig).map(p -> p + "/" + path).orElse(path), map);
    // ConfiguratorFactory用于对现有暴露协议进行再配置的SPI扩展
    if (ExtensionLoader.getExtensionLoader(ConfiguratorFactory.class)
            .hasExtension(url.getProtocol())) {
       // 判断是否存在指定协议的再配置扩展类
        url = ExtensionLoader.getExtensionLoader(ConfiguratorFactory.class)
                // 对指定协议进行再配置
                .getExtension(url.getProtocol()).getConfigurator(url).configure(url);
    }
	...
}
```

> 关于ConfiguratorFactory对现有暴露协议进行再配置：
>
>
>
> ```plaintext
```java 
// ConfiguratorFactory用于对现有暴露协议进行再配置的SPI扩展
if (ExtensionLoader.getExtensionLoader(ConfiguratorFactory.class)
        .hasExtension(url.getProtocol())) {
        // 判断是否存在指定协议的再配置扩展类
    url = ExtensionLoader.getExtensionLoader(ConfiguratorFactory.class)
            // 对指定协议进行再配置
            .getExtension(url.getProtocol()).getConfigurator(url).configure(url);
}
```

```plaintext
> 
>看下hasExtension方法：
> 
>     ```java 
>     //org.apache.dubbo.common.extension.ExtensionLoader#hasExtension
>     public boolean hasExtension(String name) {
>         
>           
>         if (StringUtils.isEmpty(name)) {
>         
>           
>             throw new IllegalArgumentException("Extension name == null");
>         }
>         Class<?> c = this.getExtensionClass(name);
>         return c != null;
>     }
>     //org.apache.dubbo.common.extension.ExtensionLoader#getExtensionClass
>     private Class<?> getExtensionClass(String name) {
>         
>           
>         if (type == null) {
>         
>           
>             throw new IllegalArgumentException("Extension type == null");
>         }
>         if (name == null) {
>         
>           
>             throw new IllegalArgumentException("Extension name == null");
>         }
>         // 从 所有支持的扩展类(不包含adaptive与wrapper) 中查找是否有指定名称的类
>         return getExtensionClasses().get(name);
>     }
>     
```

> DEBUG：
>
>
>
> dubbo源码中只有两个ConfiguratorFactory，没有dubbo的：
>
>
>
> 所以这里也不用太关注

### 3.4 对URL进行服务暴露，其中服务暴露分本地暴露和远程暴露

```java
//org.apache.dubbo.config.ServiceConfig#doExportUrlsFor1Protocol
private void doExportUrlsFor1Protocol(ProtocolConfig protocolConfig, List<URL> registryURLs) {
	...
	//上面代码已经把注册URL构建完成了
    // 获取<dubbo:service/>的scope属性
    String scope = url.getParameter(SCOPE_KEY);
    // don't export when none is configured
    // 如果scope属性为"none"，则什么也不做
    if (!SCOPE_NONE.equalsIgnoreCase(scope)) {
        // export to local if the config is not remote (export to remote only when config is remote)
        // 若scope的值不为"remote"，则进行本地服务暴露
        if (!SCOPE_REMOTE.equalsIgnoreCase(scope)) {
            // 本地暴露
            exportLocal(url);
        }
        // export to remote if the config is not local (export to local only when config is local)
        // 若scope的值不为local，则进行远程服务暴露
        if (!SCOPE_LOCAL.equalsIgnoreCase(scope)) {
            ...
        }
    }
    this.urls.add(url);
}
```

可以看到根据scope的值

- none：不暴露
- local：只本地暴露
- remote：只远程暴露
- 不配置：既本地暴露、也远程暴露

#### 3.4.1 本地暴露

先看本地服务暴露exportLocal方法：

```java
//org.apache.dubbo.config.ServiceConfig#exportLocal
private void exportLocal(URL url) {
	// 此时传进来的是注册URL dubbo://hostL:port/service?xxx&xxx...
    // 构建URL
    URL local = URLBuilder.from(url)
		    //LOCAL_PROTOCOL值为injvm
            .setProtocol(LOCAL_PROTOCOL)  // 指定当前url的协议为injvm
            //LOCALHOST_VALUE值为127.0.0.1
            .setHost(LOCALHOST_VALUE)  // 指定host为本机
            .setPort(0)   // 指定没有端口
            .build();
    // 将注册URL的协议强行改成injvm
    // protocol是自适应类，这样可以通过自适应机制让InjvmProtocol进行暴露
    // 可以看到是先用PROXY_FACTORY转成Invoker，在用protocol发布的
    // 发布的时候会将Invoker封装成Exporter
    Exporter<?> exporter = protocol.export(
            PROXY_FACTORY.getInvoker(ref, (Class) interfaceClass, local));
    exporters.add(exporter);
    logger.info("Export dubbo service " + interfaceClass.getName() + " to local registry url : " + local);
}
```

**先看一下构建Invoker：**

`PROXY_FACTORY.getInvoker(ref, (Class) interfaceClass, local)`方法中，PROXY_FACTORY是ProxyFactory接口的自适应类，代理有两种实现，JDK和Javassist，默认是Javassist：

```java
public class JavassistProxyFactory extends AbstractProxyFactory {
	//给服务创建代理，消费者端调用来生成服务的代理对象（服务订阅的时候用）
    @Override
    @SuppressWarnings("unchecked")
    public <T> T getProxy(Invoker<T> invoker, Class<?>[] interfaces) {
        return (T) Proxy.getProxy(interfaces).newInstance(new InvokerInvocationHandler(invoker));
    }
	//创建服务，提供者端调用生成提供者的代理对象
    @Override
    public <T> Invoker<T> getInvoker(T proxy, Class<T> type, URL url) {
        // TODO Wrapper cannot handle this scenario correctly: the classname contains '$'
        // Wrapper.getWrapper方法会为每种服务接口生成一个包装类实例，有兴趣自己看吧
        // 反正最终执行的方法是proxy.methodName
        final Wrapper wrapper = Wrapper.getWrapper(proxy.getClass().getName().indexOf('$') < 0 ? proxy.getClass() : type);
        return new AbstractProxyInvoker<T>(proxy, type, url) {
            @Override
            protected Object doInvoke(T proxy, String methodName,
                                      Class<?>[] parameterTypes,
                                      Object[] arguments) throws Throwable {
                return wrapper.invokeMethod(proxy, methodName, parameterTypes, arguments);
            }
        };
    }
}
```

该类中有两个方法，一个是给消费者端用的，一个是给提供者端用的。

**再看一下injvm协议暴露：**

> DEBUG：
>
>
>
>
>
>
>
> 为了方便看源码，断点调试，可以把这个动态生成的自适应类Protocol$Adaptive拷贝出来生成java文件放入工程中（为什么拷贝出来能够运行之前讲Dubbo动态编译的时候解释过）

上面显示的是ProtocalFilterWrapper，因为被Wrapper增强了，不是重点，直接看InjvmProtocol：

```java
public class InjvmProtocol extends AbstractProtocol implements Protocol {
	...
	//这个exporterMap是在父类抽象类AbstractProtocol中的
	//每个暴露协议都有一个这样的Map，用来存当前协议中所有暴露的服务
	//消费者端请求的时候，需要从这个map中找服务
	protected final Map<String, Exporter<?>> exporterMap = new ConcurrentHashMap<String, Exporter<?>>();
    @Override
    public <T> Exporter<T> export(Invoker<T> invoker) throws RpcException {
        return new InjvmExporter<T>(invoker, invoker.getUrl().getServiceKey(), exporterMap);
    }
    ...
}
```

我们看下InjvmExporter：

```java
class InjvmInvoker<T> extends AbstractInvoker<T> {
    private final String key;
    private final Map<String, Exporter<?>> exporterMap;
    InjvmInvoker(Class<T> type, URL url, String key, Map<String, Exporter<?>> exporterMap) {
        super(type, url);
        this.key = key;
        //当消费者端消费的时候，调用信息到达提供者端时，就要从这个map中找暴露的服务
        //这个exporterMap是AbstractProtocol中传过来的，可以看出来一种暴露协议专门维护
        //一个这样的map
        this.exporterMap = exporterMap;
    }
	...
}
```

本地暴露injvm协议很简单，就是构建一个Exporter放入exporterMap即可。

> 本地服务暴露的意义：
>
> 消费者消费服务的时候，如果这个服务本地有，就直接调用本地的服务了
>
> 因为服务器既是服务提供者又是服务消费者，是有可能消费到自己的服务，直接本地调用。

#### 3.4.2 远程暴露

重新返回 doExportUrlsFor1Protocol()方法，接下来看远程服务暴露：

```java
private void doExportUrlsFor1Protocol(ProtocolConfig protocolConfig, List<URL> registryURLs) {
	...
	//上面代码已经把注册URL构建完成了
    // 获取<dubbo:service/>的scope属性
    String scope = url.getParameter(SCOPE_KEY);
	// don't export when none is configured
    if (!SCOPE_NONE.equalsIgnoreCase(scope)) {
		...// 若scope的值不为remote，则进行本地服务暴露
        // 若scope的值不为local，则进行远程服务暴露
        if (!SCOPE_LOCAL.equalsIgnoreCase(scope)) {
            if (!isOnlyInJvm() && logger.isInfoEnabled()) {
                logger.info("Export dubbo service " + interfaceClass.getName() + " to url " + url);
            }
            if (CollectionUtils.isNotEmpty(registryURLs)) {
       // 若存在注册中心
                // 遍历所有注册中心
                for (URL registryURL : registryURLs) {
                    //if protocol is only injvm ,not register
                    // 若当前协议为injvm，则说明当前仅做本地暴露，这里的远程暴露直接结束
                    if (LOCAL_PROTOCOL.equalsIgnoreCase(url.getProtocol())) {
                        continue;
                    }
                    url = url.addParameterIfAbsent(DYNAMIC_KEY, registryURL.getParameter(DYNAMIC_KEY));
                    URL monitorUrl = loadMonitor(registryURL);
                    if (monitorUrl != null) {
                        url = url.addParameterAndEncoded(MONITOR_KEY, monitorUrl.toFullString());
                    }
                    if (logger.isInfoEnabled()) {
                        logger.info("Register dubbo service " + interfaceClass.getName() + " url " + url + " to registry " + registryURL);
                    }
                    // For providers, this is used to enable custom proxy to generate invoker
                    String proxy = url.getParameter(PROXY_KEY);
                    if (StringUtils.isNotEmpty(proxy)) {
                        registryURL = registryURL.addParameter(PROXY_KEY, proxy);
                    }
                    // 使用URL构建出invoker
                    Invoker<?> invoker = PROXY_FACTORY.getInvoker(ref, (Class) interfaceClass, registryURL.addParameterAndEncoded(EXPORT_KEY, url.toFullString()));
                    // 使用当前<dubbo:service/>的配置，对invoker进行一次封装，形成真正用于暴露的invoker
                    DelegateProviderMetaDataInvoker wrapperInvoker = new DelegateProviderMetaDataInvoker(invoker, this);
                    // 远程服务暴露(会注册到注册中心)
                    Exporter<?> exporter = protocol.export(wrapperInvoker);
                    exporters.add(exporter);
                }
            } else {
       // 处理没有注册中心的情况
                Invoker<?> invoker = PROXY_FACTORY.getInvoker(ref, (Class) interfaceClass, url);
                DelegateProviderMetaDataInvoker wrapperInvoker = new DelegateProviderMetaDataInvoker(invoker, this);
                // 服务暴露(不注册到注册中心)
                Exporter<?> exporter = protocol.export(wrapperInvoker);
                exporters.add(exporter);
            }
            /**
             * @since 2.7.0
             * ServiceData Store
             */
            MetadataReportService metadataReportService = null;
            if ((metadataReportService = getMetadataReportService()) != null) {
                metadataReportService.publishProvider(url);
            }
        }
    }
    this.urls.add(url);
}
```

这里分两个情况：

- 有注册中心的情况
- 没有注册中心的情况

**先看没有注册中心的情况：**

```java
private void doExportUrlsFor1Protocol(ProtocolConfig protocolConfig, List<URL> registryURLs) {
	...
	// 获取<dubbo:service/>的scope属性
	String scope = url.getParameter(SCOPE_KEY);
	// don't export when none is configured
	if (!SCOPE_NONE.equalsIgnoreCase(scope)) {
		...
		// 若scope的值不为local，则进行远程服务暴露
		if (!SCOPE_LOCAL.equalsIgnoreCase(scope)) {
			...
			if (CollectionUtils.isNotEmpty(registryURLs)) {
       // 若存在注册中心
				...
			} else {
       // 处理没有注册中心的情况
				// 构建Invoker，之前分析过了
				// 注意这里的url是 dubbo://ip:port/xxxx?xxx&xxx
				Invoker<?> invoker = PROXY_FACTORY.getInvoker(ref, (Class) interfaceClass, url);
				// 委托类，将invoker和元数据ServiceConfig封装在了一起，没什么特别的
				DelegateProviderMetaDataInvoker wrapperInvoker = new DelegateProviderMetaDataInvoker(invoker, this);
				// 服务暴露(不注册到注册中心)
				// 注意，此时这里的url是dubbo://ip:port/xxxx?xxx&xxx
				// 所以protocol自适应会直接用DubboProtocol进行暴露
				// 这是与有注册中心情况的最重要的区别！
				Exporter<?> exporter = protocol.export(wrapperInvoker);
				exporters.add(exporter);
			}
			/**
			 * @since 2.7.0
			 * ServiceData Store
			 */
			MetadataReportService metadataReportService = null;
			if ((metadataReportService = getMetadataReportService()) != null) {
				metadataReportService.publishProvider(url);
			}
		}
	}
	this.urls.add(url);
}
```

这里需要提醒的是Exporter`` exporter = protocol.export(wrapperInvoker)这个方法，通过自适应进制，会直接调用org.apache.dubbo.rpc.protocol.dubbo.DubboProtocol#export方法，因为invoker中的URL参数路径是dubbo://ip:port/xxxx?xxx&xxx，这是与有注册中心情况的最重要的区别！

DubboProtocol协议进行服务暴露将在3.6中讲解。

**有注册中心的情况：**

```java
private void doExportUrlsFor1Protocol(ProtocolConfig protocolConfig, List<URL> registryURLs) {
	...
	// 获取<dubbo:service/>的scope属性
	String scope = url.getParameter(SCOPE_KEY);
	// don't export when none is configured
	if (!SCOPE_NONE.equalsIgnoreCase(scope)) {
		...
		// 若scope的值不为local，则进行远程服务暴露
		if (!SCOPE_LOCAL.equalsIgnoreCase(scope)) {
			...
			if (CollectionUtils.isNotEmpty(registryURLs)) {
       // 若存在注册中心
				// 遍历所有注册中心
				for (URL registryURL : registryURLs) {
					//if protocol is only injvm ,not register
					// 若当前协议为injvm，则说明当前仅做本地暴露，这里的远程暴露直接结束
					if (LOCAL_PROTOCOL.equalsIgnoreCase(url.getProtocol())) {
						continue;
					}
					//DYNAMIC_KEY=dynamic，指定是否动态
					url = url.addParameterIfAbsent(DYNAMIC_KEY, registryURL.getParameter(DYNAMIC_KEY));
					// 加载监控中心的元数据信息
					URL monitorUrl = loadMonitor(registryURL);
					if (monitorUrl != null) {
						//如果存在将监控中心信息加入到"注册URL"
						url = url.addParameterAndEncoded(MONITOR_KEY, monitorUrl.toFullString());
					}
					if (logger.isInfoEnabled()) {
						logger.info("Register dubbo service " + interfaceClass.getName() + " url " + url + " to registry " + registryURL);
					}
					// For providers, this is used to enable custom proxy to generate invoker
					// 指定生成动态代理的方式，默认是javassist
					String proxy = url.getParameter(PROXY_KEY);
					if (StringUtils.isNotEmpty(proxy)) {
						registryURL = registryURL.addParameter(PROXY_KEY, proxy);
					}
					// 使用URL构建出invoker，注意这里构建invoker用的不是"注册URL"了
					// 而是用 注册中心URL，并在注册中心URL上加上参数"export"，值就是"注册URL"
					Invoker<?> invoker = PROXY_FACTORY.getInvoker(ref, (Class) interfaceClass, registryURL.addParameterAndEncoded(EXPORT_KEY, url.toFullString()));
					// 使用当前<dubbo:service/>的配置，对invoker进行一次封装，形成真正用于暴露的invoker
					// 委托类，将invoker和元数据封装在了一起
					DelegateProviderMetaDataInvoker wrapperInvoker = new DelegateProviderMetaDataInvoker(invoker, this);
					// 远程服务暴露(会注册到注册中心)
					// 注意这里和没有注册中心的情况有很大区别
					// 此时invoker 的URL格式是 
					// registry://zkOS:2181?....&xxx&registry=zookeeper&export="注册URL"
					// 所以protocol.export会走RegistryProtocol进行服务暴露
					Exporter<?> exporter = protocol.export(wrapperInvoker);
					exporters.add(exporter);
				}
			} else {
       // 处理没有注册中心的情况
				...
			}
			/**
			 * @since 2.7.0
			 * ServiceData Store
			 */
			MetadataReportService metadataReportService = null;
			if ((metadataReportService = getMetadataReportService()) != null) {
				metadataReportService.publishProvider(url);
			}
		}
	}
	this.urls.add(url);
}
```

`注意：这里和没有注册中心的情况有很大区别，此时invoker 的URL格式是registry://zkOS:2181?....&xxx&registry=zookeeper&export="注册URL"， 用的是注册中心URL，所以protocol.export会走RegistryProtocol进行服务暴露`

### 3.5 有注册中心情况的服务暴露 - 完成服务注册

> DEBUG：
>
> 还是Protocol$Adaptive，此时extName为registry：
>
>
>
> 可以看下增强类：

接下来直接看org.apache.dubbo.registry.integration.RegistryProtocol#export，该方法主要完成了三件事：

- 注册ServiceConfigurationListener监听器，实时监控配置中心的配置信息变化
- 使用配置的协议（这里就是Dubbo协议）进行服务暴露
- 注册到注册中心

`即相比于没有注册中心的情况，多做了一步注册到注册中心的动作，这里主要分析注册到注册中心的逻辑，真正的服务暴露dubbo协议暴露，在3.6中讲解。`

```java
public class RegistryProtocol implements Protocol {
	...
    @Override
    public <T> Exporter<T> export(final Invoker<T> originInvoker) throws RpcException {
        // 从invoker中获取到注册中心URL
        URL registryUrl = getRegistryUrl(originInvoker);
        // url to export locally
        // 从invoker中获取到提供者URL（刚才说过"注册URL"作为注册中心URL的参数,key是export）
        URL providerUrl = getProviderUrl(originInvoker);
        // Subscribe the override data
        // FIXME When the provider subscribes, it will affect the scene : a certain JVM exposes the service and call
        //  the same service. Because the subscribed is cached key with the name of the service, it causes the
        //  subscription information to cover.
        final URL overrideSubscribeUrl = getSubscribedOverrideUrl(providerUrl);
        final OverrideListener overrideSubscribeListener = new OverrideListener(overrideSubscribeUrl, originInvoker);
        overrideListeners.put(overrideSubscribeUrl, overrideSubscribeListener);
		// 将动态配置中心的配置元数据信息覆盖当前提供者元数据信息
		// 并注册一个ServiceConfigurationListener监听器，监听动态配置中心的信息变化
        providerUrl = overrideUrlWithConfig(providerUrl, overrideSubscribeListener);
        //export invoker
        // 远程暴露，使用配置的协议进行真正的暴露
        final ExporterChangeableWrapper<T> exporter = doLocalExport(originInvoker, providerUrl);
        // url to registry
        // 获取注册中心
        final Registry registry = getRegistry(originInvoker);
        // 获取注册的URL，并过滤掉url参数
        final URL registeredProviderUrl = getRegisteredProviderUrl(providerUrl, registryUrl);
        ProviderInvokerWrapper<T> providerInvokerWrapper = ProviderConsumerRegTable.registerProvider(originInvoker,
                registryUrl, registeredProviderUrl);
        //to judge if we need to delay publish
        //获取是否要注册到注册中心，没有配置默认就是true
        boolean register = registeredProviderUrl.getParameter("register", true);
        if (register) {
            // 将提供者注册到注册中心
            register(registryUrl, registeredProviderUrl);
            providerInvokerWrapper.setReg(true);
        }
        // Deprecated! Subscribe to override rules in 2.6.x or before.
        registry.subscribe(overrideSubscribeUrl, overrideSubscribeListener);
        exporter.setRegisterUrl(registeredProviderUrl);
        exporter.setSubscribeUrl(overrideSubscribeUrl);
        //Ensure that a new exporter instance is returned every time export
        // 确保每次导出时都返回一个新的export实例
        return new DestroyableExporter<>(exporter);
    }
    ...
}
```

整个方法整体流程看过了，现在我们看一些细节：

#### (1) 从invoker中获取到注册中心URL

看getRegistryUrl方法：

```java
//org.apache.dubbo.registry.integration.RegistryProtocol#getRegistryUrl
private URL getRegistryUrl(Invoker<?> originInvoker) {
    URL registryUrl = originInvoker.getUrl();
    if (REGISTRY_PROTOCOL.equals(registryUrl.getProtocol())) {
        // 获取到URL中的registry属性，当前为zookeeper
        String protocol = registryUrl.getParameter(REGISTRY_KEY, DEFAULT_REGISTRY);
        // 将URL的协议替换为zookeeper，将去掉URL中的registry属性
        registryUrl = registryUrl.setProtocol(protocol).removeParameter(REGISTRY_KEY);
    }
    return registryUrl;
}
```

> DEBUG：
>
>
>
> 从registry://换成了zookeeper://

#### (2) 从invoker中获取到提供者URL

看getProviderUrl方法：

```java
//org.apache.dubbo.registry.integration.RegistryProtocol#getProviderUrl
private URL getProviderUrl(final Invoker<?> originInvoker) {
    // 获取到URL中的export属性，并解码为String
    // registry://zkOS:2181/org.apache.dubbo.registry.RegistryService?application=demo-provider
    // &dubbo=2.0.2&export=dubbo%3A%2F%2F192.168.0.109%3A20880%2Forg.apache.dubbo.demo.DemoService
    // %3Fanyhost%3Dtrue%26application%3Ddemo-provider%26bean.name%3Dorg.apache.dubbo.demo.DemoService
    // %26bind.ip%3D192.168.0.109%26bind.port%3D20880%26deprecated%3Dfalse%26dubbo%3D2.0.2
    // %26dynamic%3Dtrue%26generic%3Dfalse%26interface%3Dorg.apache.dubbo.demo.DemoService%26methods%3DsayHello%26pid%3D18440%26
    // qos.port%3D22222%26register%3Dtrue%26release%3D%26side%3Dprovider%26
    // timestamp%3D1589549171978&pid=18440&qos.port=22222&registry=zookeeper&timestamp=1589549171971
    String export = originInvoker.getUrl().getParameterAndDecoded(EXPORT_KEY);
    if (export == null || export.length() == 0) {
        throw new IllegalArgumentException("The registry export url is null! registry: " + originInvoker.getUrl());
    }
    return URL.valueOf(export);
}
```

> DEBUG：
>
>
>
> 解码后就没有乱码

#### (3) 真正的服务暴露，使用配置的协议进行服务暴露入口

看doLocalExport 方法：

```java
//org.apache.dubbo.registry.integration.RegistryProtocol#doLocalExport
private <T> ExporterChangeableWrapper<T> doLocalExport(final Invoker<T> originInvoker, URL providerUrl) {
    String key = getCacheKey(originInvoker);
    return (ExporterChangeableWrapper<T>) bounds.computeIfAbsent(key, s -> {
	    //创建Invoker委托对象，将Invoker和提供者URL元数据信息绑定在一起
        Invoker<?> invokerDelegate = new InvokerDelegate<>(originInvoker, providerUrl);
        //核心方法其实是protocol.export(invokerDelegate)
        //这里originInvoker的URL已经是 "注册URL"了，dubbo://xxx...
        //所以之后肯定会走DubboProtocol进行服务暴露，将在3.6详细讲解
        return new ExporterChangeableWrapper<>((Exporter<T>) protocol.export(invokerDelegate), originInvoker);
    });
}
```

> java.util.concurrent.ConcurrentMap#computeIfAbsent方法：
>
>
>
> ```plaintext
```java 
/**
 * {@inheritDoc}
 *
 * @implSpec
 * The default implementation is equivalent to the following steps for this
 * {@code map}, then returning the current value or {@code null} if now
 * absent:
 * 等价于：
 * <pre> {@code
 * if (map.get(key) == null) {
 *     V newValue = mappingFunction.apply(key);
 *     if (newValue != null)
 *         return map.putIfAbsent(key, newValue);
 * }
 * }</pre>
 * ...
 */
@Override
default V computeIfAbsent(K key,
        Function<? super K, ? extends V> mappingFunction) {
	...
}
```

```plaintext
#### (4) 获取注册中心
看getRegistry(originInvoker) 方法：
```java 
//org.apache.dubbo.registry.integration.RegistryProtocol#getRegistry
private Registry getRegistry(final Invoker<?> originInvoker) {
	//刚才跟过getRegistryUrl，URL的协议替换为zookeeper
    URL registryUrl = getRegistryUrl(originInvoker);
    return registryFactory.getRegistry(registryUrl);
}
```

> DEBUG，registryFactory是一个自适应类：

看ZookeeperRegistryFactory的getRegistry方法，其实现是父类的抽象类AbstractRegistryFactory的getRegistry方法：

```java
//org.apache.dubbo.registry.support.AbstractRegistryFactory#getRegistry
public Registry getRegistry(URL url) {
	//再次构建URL
    url = URLBuilder.from(url)
            .setPath(RegistryService.class.getName())
            .addParameter(INTERFACE_KEY, RegistryService.class.getName())//INTERFACE_KEY=interface
            .removeParameters(EXPORT_KEY, REFER_KEY)//移除export和refer属性
            .build();
    // 从url中获取注册中心的key (需要将注册中心的key放入map中下次获取就不需要重复创建注册中心)
    String key = url.toServiceStringWithoutResolving();
    // Lock the registry access process to ensure a single instance of the registry
    // 保证注册中心是单例
    LOCK.lock();
    try {
        Registry registry = REGISTRIES.get(key);
        if (registry != null) {
            return registry;
        }
        //create registry by spi/ioc
        // 创建注册中心
        registry = createRegistry(url);
        if (registry == null) {
            throw new IllegalStateException("Can not create registry " + url);
        }
        REGISTRIES.put(key, registry);
        return registry;
    } finally {
        // Release the lock
        LOCK.unlock();
    }
}
```

继续看createRegistry方法创建注册中心：

```java
public class ZookeeperRegistryFactory extends AbstractRegistryFactory {
    private ZookeeperTransporter zookeeperTransporter;
    /**
     * Invisible injection of zookeeper client via IOC/SPI
     * @param zookeeperTransporter
     */
    public void setZookeeperTransporter(ZookeeperTransporter zookeeperTransporter) {
        this.zookeeperTransporter = zookeeperTransporter;
    }
    @Override
    public Registry createRegistry(URL url) {
        return new ZookeeperRegistry(url, zookeeperTransporter);
    }
}
```

看一下ZookeeperRegistry构造：

```java
public class ZookeeperRegistry extends FailbackRegistry {
   	...
	private final static int DEFAULT_ZOOKEEPER_PORT = 2181;
	//这个zkClient是Dubbo封装的
    private final ZookeeperClient zkClient;
    public ZookeeperRegistry(URL url, ZookeeperTransporter zookeeperTransporter) {
        super(url);
        if (url.isAnyHost()) {
            throw new IllegalStateException("registry address == null");
        }
        String group = url.getParameter(GROUP_KEY, DEFAULT_ROOT);
        if (!group.startsWith(PATH_SEPARATOR)) {
            group = PATH_SEPARATOR + group;
        }
        this.root = group;
        // zookeeperTransporter封装的是ZK的客户端，默认是curator
        // 使用curator客户端连接上注册中心，并返回一个zkClient(Dubbo的API，封装的也是curator)
        zkClient = zookeeperTransporter.connect(url);
        // 为zkClient添加一个连接状态监听，若连接失败，则会重新连接
        zkClient.addStateListener(state -> {
            if (state == StateListener.RECONNECTED) {
                try {
                    recover();  // 重连
                    //为什么需要重连，可以看到ZookeeperRegistry继承FailbackRegistry
                    //所以具有容错的功能
                } catch (Exception e) {
                    logger.error(e.getMessage(), e);
                }
            }
        });
    }
    ...
}
```

#### (5) 将提供者注册到注册中心

注册中心获取完了，最后看register方法

```java
//org.apache.dubbo.registry.integration.RegistryProtocol#register
public void register(URL registryUrl, URL registeredProviderUrl) {
    // 获取注册中心，之前已经创建成功，这个时候是从缓存获取的
    Registry registry = registryFactory.getRegistry(registryUrl);
    // 完成注册(调用父类抽象类的register())
    registry.register(registeredProviderUrl);
}
```

> DUBUG，看到registry是ZookeeperRegistry：

我们看ZookeeperRegistry的父类FailbackRegistry的register方法：

```java
//org.apache.dubbo.registry.support.FailbackRegistry#register
public void register(URL url) {
    super.register(url);
    removeFailedRegistered(url);
    removeFailedUnregistered(url);
    try {
        // Sending a registration request to the server side
        // 调用子类的doRegister()
        doRegister(url);
    } catch (Exception e) {
        Throwable t = e;
        // If the startup detection is opened, the Exception is thrown directly.
        boolean check = getUrl().getParameter(Constants.CHECK_KEY, true)
                && url.getParameter(Constants.CHECK_KEY, true)
                && !CONSUMER_PROTOCOL.equals(url.getProtocol());
        boolean skipFailback = t instanceof SkipFailbackWrapperException;
        if (check || skipFailback) {
            if (skipFailback) {
                t = t.getCause();
            }
            throw new IllegalStateException("Failed to register " + url + " to registry " + getUrl().getAddress() + ", cause: " + t.getMessage(), t);
        } else {
            logger.error("Failed to register " + url + ", waiting for retry, cause: " + t.getMessage(), t);
        }
        // Record a failed registration request to a failed list, retry regularly
        addFailedRegistered(url);
    }
}
```

继续看doRegister

```java
//org.apache.dubbo.registry.zookeeper.ZookeeperRegistry#doRegister
public void doRegister(URL url) {
    try {
        // 创建节点
        // 第二个参数若为false，则创建持久节点，true，则创建临时节点
        // DYNAMIC_KEY = dynamic
        // 这里可以看出dynamic属性用来控制 提供者在注册中心的信息是否是实时的
        zkClient.create(toUrlPath(url), url.getParameter(DYNAMIC_KEY, true));
    } catch (Throwable e) {
        throw new RpcException("Failed to register " + url + " to zookeeper " + getUrl() + ", cause: " + e.getMessage(), e);
    }
}
```

> DEBUG，看下效果：
>
>
>
> 一执行完毕

### 3.6 真正的服务暴露 - Dubbo协议的服务暴露

无论是否有注册中心，最终都会通过配置的协议进行服务暴露，默认是Dubbo暴露协议，接下来我们分析Dubbo服务暴露协议，看protocol.export(invokerDelegate)方法：

>

增强的方法不用关注，直接看org.apache.dubbo.rpc.protocol.dubbo.DubboProtocol#export

```java
public <T> Exporter<T> export(Invoker<T> invoker) throws RpcException {
    URL url = invoker.getUrl();
	// 此时的url是 dubbo://xxxx..
    // export service.
    String key = serviceKey(url);
    // 生成exporter
    DubboExporter<T> exporter = new DubboExporter<T>(invoker, key, exporterMap);
    // 将exporter存放到exporterMap中，将来消费者的调用请求到来后，会首先从这里查找
    // 其所需要的exporter
    exporterMap.put(key, exporter);
    //export an stub service for dispatching event
    Boolean isStubSupportEvent = url.getParameter(STUB_EVENT_KEY, DEFAULT_STUB_EVENT);
    Boolean isCallbackservice = url.getParameter(IS_CALLBACK_SERVICE, false);
    if (isStubSupportEvent && !isCallbackservice) {
        String stubServiceMethods = url.getParameter(STUB_EVENT_METHODS_KEY);
        if (stubServiceMethods == null || stubServiceMethods.length() == 0) {
            if (logger.isWarnEnabled()) {
                logger.warn(new IllegalStateException("consumer [" + url.getParameter(INTERFACE_KEY) +
                        "], has set stubproxy support event ,but no stub methods founded."));
            }
        } else {
            stubServiceMethodsMap.put(url.getServiceKey(), stubServiceMethods);
        }
    }
    // 启动NettyServer
    openServer(url);
    // 优化序列化
    optimizeSerialization(url);
    return exporter;
}
```

从代码中可以看出，Dubbo协议暴露做了下面几件事：

- 生成exporter并放入了exporterMap
- 导出用于分派事件的存根服务
- 启动交换服务的服务端(Dubbo暴露协议底层实现是NettyServer)
- 优化序列化

这里我们只关注第三步。

> DEBUG，看下exporterMap的ServiceKey是啥：

#### 3.6.1 启动交换服务的服务端(Dubbo暴露协议底层实现是NettyServer)

> dubbo中的交换服务，也叫作消息交换模式，通俗说就是 请求响应模型，更高一层的抽象
>
>
>
> 对于提供者端来说是ExchangeServer，负责接受请求，处理请求，响应请求
>
>
>
> 对于消费者端来说是ExchangeClient，负责发起请求，接受提供者端的响应，处理响应
>
>
>
> ```java
@SPI(HeaderExchanger.NAME)
public interface Exchanger {
    /**
     * bind.
     * 绑定一个地址和端口、消息处理器，启动Server端
     * @param url
     * @param handler
     * @return message server
     */
    @Adaptive({
      Constants.EXCHANGER_KEY})
    ExchangeServer bind(URL url, ExchangeHandler handler) throws RemotingException;
    /**
     * connect.
     * 连接Server端，启动客户端端，也绑定了一个消息处理器
     * @param url
     * @param handler
     * @return message channel
     */
    @Adaptive({
      Constants.EXCHANGER_KEY})
    ExchangeClient connect(URL url, ExchangeHandler handler) throws RemotingException;
}
```

```plaintext
看openServer方法：
```java 
//org.apache.dubbo.rpc.protocol.dubbo.DubboProtocol#openServer
private void openServer(URL url) {
    // find server.
    // 获取key：  ip:port
    String key = url.getAddress();
    //client can export a service which's only for server to invoke
    // 从url中获取isServer属性值，isServer为true，表示当前为provider
    boolean isServer = url.getParameter(IS_SERVER_KEY, true);
    if (isServer) {
        // dubbo-check
        // serverMap是成员变量，每种暴露协议都会维护一个这个map
        // 而map的key放的是ip:port
		// 由此我们可以推断：
		// 相同IP、端口的情况，每种暴露协议都会创建一个ExchangeServer
		// 相同协议情况，每个ip、端口都会创建一个ExchangeServer
        ExchangeServer server = serverMap.get(key);
        if (server == null) {
            synchronized (this) {
                server = serverMap.get(key);
                if (server == null) {
                    // 对于Dubbo协议来说createServer(url)中最终会创建一个NettyServer
                    serverMap.put(key, createServer(url));
                }
            }
        } else {
            // server supports reset, use together with override
            // 不同的是服务不一样,url不一样
            // 所以如果IP、端口一样的不同服务会走else方法  
            // 只需要更新server里的url即可。在原来的URL基础上加上新的服务的URL
            server.reset(url);
        }
    }
}
```

> 从这段代码中可以看出 服务和 ExchangeServer、协议、IP端口 之间的关系：
>
> 首先每个协议之间是隔离的，在相同协议的情况下，每一个IP端口会对应一个Server
>
> 对于ExchangeServer来说，每一个ExchangeServer专门处理 一个固定协议、固定地址端口 的所有服务

看createServer方法：

```java
//org.apache.dubbo.rpc.protocol.dubbo.DubboProtocol#createServer
private ExchangeServer createServer(URL url) {
    url = URLBuilder.from(url)
            // send readonly event when server closes, it's enabled by default
            .addParameterIfAbsent(CHANNEL_READONLYEVENT_SENT_KEY, Boolean.TRUE.toString())
            // enable heartbeat by default
            .addParameterIfAbsent(HEARTBEAT_KEY, String.valueOf(DEFAULT_HEARTBEAT))
            .addParameter(CODEC_KEY, DubboCodec.NAME)
            .build();
    //DEFAULT_REMOTING_SERVER = netty
    //默认用netty实现Transporter
    //Transporter可以理解为七层网络模型的传输层，负责数据通信的
    String str = url.getParameter(SERVER_KEY, DEFAULT_REMOTING_SERVER);
    if (str != null && str.length() > 0 && !ExtensionLoader.getExtensionLoader(Transporter.class).hasExtension(str)) {
        throw new RpcException("Unsupported server type: " + str + ", url: " + url);
    }
    ExchangeServer server;
    try {
	    //绑定地址端口，和请求处理器，启动ExchangeServer 
	    //此时url是dubbo://ip:port/xxxService?xxx&xxx...
        server = Exchangers.bind(url, requestHandler);
    } catch (RemotingException e) {
        throw new RpcException("Fail to start server(url: " + url + ") " + e.getMessage(), e);
    }
    str = url.getParameter(CLIENT_KEY);
    if (str != null && str.length() > 0) {
        Set<String> supportedTypes = ExtensionLoader.getExtensionLoader(Transporter.class).getSupportedExtensions();
        if (!supportedTypes.contains(str)) {
            throw new RpcException("Unsupported client type: " + str);
        }
    }
    return server;
}
```

继续看server = Exchangers.bind(url, requestHandler)方法：

```java
//org.apache.dubbo.remoting.exchange.Exchangers#bind(org.apache.dubbo.common.URL, org.apache.dubbo.remoting.exchange.ExchangeHandler)
public static ExchangeServer bind(URL url, ExchangeHandler handler) throws RemotingException {
    if (url == null) {
        throw new IllegalArgumentException("url == null");
    }
    if (handler == null) {
        throw new IllegalArgumentException("handler == null");
    }
    url = url.addParameterIfAbsent(Constants.CODEC_KEY, "exchange");
    return getExchanger(url).bind(url, handler);
}
public static Exchanger getExchanger(URL url) {
	//EXCHANGER_KEY = "exchanger"
	//DEFAULT_EXCHANGER = "header"
	//即默认用头交换模式
    String type = url.getParameter(Constants.EXCHANGER_KEY, Constants.DEFAULT_EXCHANGER);
    return getExchanger(type);
}
public static Exchanger getExchanger(String type) {
    return ExtensionLoader.getExtensionLoader(Exchanger.class).getExtension(type);
}
```

上面代码可以看出，会调用HeaderExchanger的bind方法：

```java
public class HeaderExchanger implements Exchanger {
    public static final String NAME = "header";
    @Override
    public ExchangeClient connect(URL url, ExchangeHandler handler) throws RemotingException {
        return new HeaderExchangeClient(Transporters.connect(url, new DecodeHandler(new HeaderExchangeHandler(handler))), true);
    }
    @Override
    public ExchangeServer bind(URL url, ExchangeHandler handler) throws RemotingException {
    	//看到这里创建了一个头交换Server实例
    	//并对handler进行了两次包装，最终封装成了ChannelHandler
        return new HeaderExchangeServer(Transporters.bind(url, new DecodeHandler(new HeaderExchangeHandler(handler))));
    }
}
```

这里我们主要关注看Transporters.bind()方法，`Transporters字面翻译是传输者，可以理解为七层网络模型中的传输层，是真正负责数据传输的，而一般默认会用netty实现`，我们继续看：

```java
//org.apache.dubbo.remoting.Transporters#bind(org.apache.dubbo.common.URL, org.apache.dubbo.remoting.ChannelHandler...)
public static Server bind(URL url, ChannelHandler... handlers) throws RemotingException {
    if (url == null) {
        throw new IllegalArgumentException("url == null");
    }
    if (handlers == null || handlers.length == 0) {
        throw new IllegalArgumentException("handlers == null");
    }
    ChannelHandler handler;
    if (handlers.length == 1) {
        handler = handlers[0];
    } else {
    	//如果多个处理器，用ChannelHandlerDispatcher包装一下，底层实现就是循环遍历
        handler = new ChannelHandlerDispatcher(handlers);
    }
    return getTransporter().bind(url, handler);
}
public static Transporter getTransporter() {
    return ExtensionLoader.getExtensionLoader(Transporter.class).getAdaptiveExtension();
}
```

注意此时getTransporter返回的是Transporter的动态自适应类

> 我们在把这个类拷贝出来，方便断点：

看NettyTransporter ：

```java
public class NettyTransporter implements Transporter {
    public static final String NAME = "netty";
    @Override
    public Server bind(URL url, ChannelHandler listener) throws RemotingException {
        return new NettyServer(url, listener);
    }
    @Override
    public Client connect(URL url, ChannelHandler listener) throws RemotingException {
        return new NettyClient(url, listener);
    }
}
```

继续跟org.apache.dubbo.remoting.transport.netty4.NettyServer构造：

```java
public class NettyServer extends AbstractServer implements Server {
    private static final Logger logger = LoggerFactory.getLogger(NettyServer.class);
    /**
     * the cache for alive worker channel.
     * <ip:port, dubbo channel>
     */
    private Map<String, Channel> channels;
    /**
     * netty server bootstrap.
     */
    private ServerBootstrap bootstrap;
    /**
     * the boss channel that receive connections and dispatch these to worker channel.
     */
	private io.netty.channel.Channel channel;
    private EventLoopGroup bossGroup;
    private EventLoopGroup workerGroup;
    public NettyServer(URL url, ChannelHandler handler) throws RemotingException {
        // you can customize name and type of client thread pool by THREAD_NAME_KEY and THREADPOOL_KEY in CommonConstants.
        // the handler will be warped: MultiMessageHandler->HeartbeatHandler->handler
        super(url, ChannelHandlers.wrap(handler, ExecutorUtil.setThreadName(url, SERVER_THREAD_POOL_NAME)));
    }
    ...
}
```

跟super构造：

```java
public abstract class AbstractServer extends AbstractEndpoint implements Server {
    protected static final String SERVER_THREAD_POOL_NAME = "DubboServerHandler";
    private static final Logger logger = LoggerFactory.getLogger(AbstractServer.class);
    ExecutorService executor;
    private InetSocketAddress localAddress;
    private InetSocketAddress bindAddress;
    private int accepts;
    private int idleTimeout;
    public AbstractServer(URL url, ChannelHandler handler) throws RemotingException {
        super(url, handler);
        localAddress = getUrl().toInetSocketAddress();
        String bindIp = getUrl().getParameter(Constants.BIND_IP_KEY, getUrl().getHost());
        int bindPort = getUrl().getParameter(Constants.BIND_PORT_KEY, getUrl().getPort());
        if (url.getParameter(ANYHOST_KEY, false) || NetUtils.isInvalidLocalHost(bindIp)) {
            bindIp = ANYHOST_VALUE;
        }
        bindAddress = new InetSocketAddress(bindIp, bindPort);
        this.accepts = url.getParameter(ACCEPTS_KEY, DEFAULT_ACCEPTS);
        this.idleTimeout = url.getParameter(IDLE_TIMEOUT_KEY, DEFAULT_IDLE_TIMEOUT);
        try {
	        //跟doOpen
            doOpen();
            if (logger.isInfoEnabled()) {
                logger.info("Start " + getClass().getSimpleName() + " bind " + getBindAddress() + ", export " + getLocalAddress());
            }
        } catch (Throwable t) {
            throw new RemotingException(url.toInetSocketAddress(), null, "Failed to bind " + getClass().getSimpleName()
                    + " on " + getLocalAddress() + ", cause: " + t.getMessage(), t);
        }
        ...
    }
    ...
}
```

主要看doOpen，实现在其子类：

```java
//org.apache.dubbo.remoting.transport.netty4.NettyServer#doOpen
protected void doOpen() throws Throwable {
    bootstrap = new ServerBootstrap();
    bossGroup = new NioEventLoopGroup(1, new DefaultThreadFactory("NettyServerBoss", true));
    workerGroup = new NioEventLoopGroup(getUrl().getPositiveParameter(IO_THREADS_KEY, Constants.DEFAULT_IO_THREADS),
            new DefaultThreadFactory("NettyServerWorker", true));
	//自定义handler，真正处理业务的
    final NettyServerHandler nettyServerHandler = new NettyServerHandler(getUrl(), this);
    channels = nettyServerHandler.getChannels();
    bootstrap.group(bossGroup, workerGroup)
            .channel(NioServerSocketChannel.class)
            .childOption(ChannelOption.TCP_NODELAY, Boolean.TRUE)
            .childOption(ChannelOption.SO_REUSEADDR, Boolean.TRUE)
            .childOption(ChannelOption.ALLOCATOR, PooledByteBufAllocator.DEFAULT)
            .childHandler(new ChannelInitializer<NioSocketChannel>() {
                @Override
                protected void initChannel(NioSocketChannel ch) throws Exception {
                    // FIXME: should we use getTimeout()?
                    int idleTimeout = UrlUtils.getIdleTimeout(getUrl());
                    NettyCodecAdapter adapter = new NettyCodecAdapter(getCodec(), getUrl(), NettyServer.this);
                    ch.pipeline()//.addLast("logging",new LoggingHandler(LogLevel.INFO))//for debug
                            .addLast("decoder", adapter.getDecoder())
                            .addLast("encoder", adapter.getEncoder())
                            .addLast("server-idle-handler", new IdleStateHandler(0, 0, idleTimeout, MILLISECONDS))
                            .addLast("handler", nettyServerHandler);
                }
            });
    // bind
    ChannelFuture channelFuture = bootstrap.bind(getBindAddress());
    channelFuture.syncUninterruptibly();
    channel = channelFuture.channel();
}
```

这里可以看出提供者接收消费者请求消息的入口就是NettyServerHandler。
