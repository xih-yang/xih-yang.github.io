# 13、Dubbo 3.x 源码解析 - Dubbo服务发布导出源码(2)
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/2/13.html
- 分类：J2EE框架
- 分组：教程目录
> 基于Dubbo 3.1，详细介绍了Dubbo服务的发布与引用的源码。

此前我们学习了[Dubbo服务发布导出源码(1)](/zhuanlan/j2ee/dubbo/2/12.html)，也就是Dubbo服务发布导出的入口源码，现在我们继续学习，服务导出的核心方法**doExportUrls的源码。**

## 1 doExportUrls导出全部服务url

该方法根据配置不同的协议，导出服务地址到多个注册中心，Dubbo支持dubbo、rmi、hessian、http、webservice、thrift、redis等多种协议。

大概步骤为：

**1、** 调用**registerService**方法，注册**serviceDescriptor**服务描述符到本地内存的服务仓库ModuleServiceRepository的**services**缓存中，即**注册service**；

**2、** 构建此服务对应的服务提供者模型**providerModel**，并且**调用registerProvider方法**注册到本地内存的服务仓库ModuleServiceRepository的**providers**缓存中，即**注册provider**；

**3、** 通过**loadRegistries**方法加载全部的注册中心url地址信息，方便后续对于所有的注册中心进行服务导出；

**4、** 遍历**当前service支持的所有协议**，对每一个协议调用**doExportUrlsFor1Protocol**方法尝试**向多个注册中心url集合进行服务导出**；

```java
/**
 * ServiceConfig的方法
 * <p>
 * 导出服务url
 */
@SuppressWarnings({
     "unchecked", "rawtypes"})
private void doExportUrls() {
    //获取Module级别的服务存储仓库，其内部保存着服务提供者的缓存
    ModuleServiceRepository repository = getScopeModel().getServiceRepository();
    //服务描述符，通过它可以获取服务描述信息，例如服务提供的方法，服务接口名，服务接口Class等
    ServiceDescriptor serviceDescriptor;
    //服务实现类型是否属于ServerService类型，一般都不属于
    final boolean serverService = ref instanceof ServerService;
    /*
     * 1 注册serviceDescriptor服务描述符到本地内存的服务仓库ModuleServiceRepository的services缓存中，即注册service
     */
    //如果属于ServerService
    if (serverService) {
        //通过服务实现获取服务描述符
        serviceDescriptor = ((ServerService) ref).getServiceDescriptor();
        //注册服务描述符到服务仓库内部的services集合中
        repository.registerService(serviceDescriptor);
    } else {
        //大部分情况的逻辑
        //注册服务描述符到服务仓库内部的services集合中
        serviceDescriptor = repository.registerService(getInterfaceClass());
    }
    /*
     * 2 构建此服务对应的服务提供者模型providerModel，并且注册到本地内存的服务仓库ModuleServiceRepository的providers缓存中，即注册provider
     */
    providerModel = new ProviderModel(serviceMetadata.getServiceKey(),
        //服务实现
        ref,
        //服务描述符
        serviceDescriptor,
        //域模型
        getScopeModel(),
        //服务元数据，服务接口类加载器
        serviceMetadata, interfaceClassLoader);
    // Compatible with dependencies on ServiceModel#getServiceConfig(), and will be removed in a future version
    //与ServiceModel#getServiceConfig()上的依赖项兼容，并将在未来的版本中删除
    providerModel.setConfig(this);
    providerModel.setDestroyRunner(getDestroyRunner());
    //注册服务提供者模型到服务仓库内部的providers集合中
    repository.registerProvider(providerModel);
    /*
     * 3 加载全部的注册中心url地址信息，方便后续对于所有的注册中心进行服务导出
     */
    List<URL> registryURLs = ConfigValidationUtils.loadRegistries(this, true);
    /*
     * 4 遍历当前service支持的协议，对每一个协议尝试向多个注册中心url集合进行服务导出
     */
    for (ProtocolConfig protocolConfig : protocols) {
        //获取另一个路径key
        String pathKey = URL.buildKey(getContextPath(protocolConfig)
            .map(p -> p + "/" + path)
            .orElse(path), group, version);
        // stub service will use generated service name
        //如果服务实现类型不属于ServerService类型，一般都不属于
        if (!serverService) {
            // In case user specified path, register service one more time to map it to path.
            //如果用户指定了路径，则再注册一次服务以将其映射到路径。
            repository.registerService(pathKey, interfaceClass);
        }
        /*
         * 根据协议向多个注册中心url集合进行服务导出
         */
        doExportUrlsFor1Protocol(protocolConfig, registryURLs);
    }
    //设置引用服务的url
    providerModel.setServiceUrls(urls);
}
```

## 2 registerService注册服务

**该方法注册服务描述符到本地内存的服务仓库ModuleServiceRepository内部的services集合中。ServiceDescriptor服务描述符，通过它的相关方法可以直接获取服务描述信息，例如服务提供的方法，服务接口名，服务接口Class等。**

实际上，在ApplicationModel#initialize方法中，就会创建一个服务ServiceRepository，其构造器内部会调用ModuleServiceRepository#registerService方法，在那时就会进行服务的注册了。

registerService方法的大概步骤为：

**1、** 基于服务接口class构建一个**ReflectionServiceDescriptor**对象；

**2、** 调用另一个两个参数的**registerService**方法完成注册，**key为服务接口名，value就是对应的方法描述符**；

```java
/**
 * ModuleServiceRepository的方法
 * <p>
 * 注册服务描述符到服务仓库内部的services集合中
 *
 * @param interfaceClazz 服务接口
 * @return 服务描述符
 */
public ServiceDescriptor registerService(Class<?> interfaceClazz) {
    //构建一个ReflectionServiceDescriptor对象
    ServiceDescriptor serviceDescriptor = new ReflectionServiceDescriptor(interfaceClazz);
    //调用另一个两个参数的registerService方法完成注册
    return registerService(interfaceClazz, serviceDescriptor);
}
/**
 * 注册服务
 *
 * @param interfaceClazz    服务接口
 * @param serviceDescriptor 服务描述符
 * @return 服务描述符
 */
public ServiceDescriptor registerService(Class<?> interfaceClazz, ServiceDescriptor serviceDescriptor) {
    //如果该服务不存在，则存入一个空的CopyOnWriteArrayList到services并返回，否则返回此前存在的serviceDescriptors集合
    List<ServiceDescriptor> serviceDescriptors = services.computeIfAbsent(interfaceClazz.getName(),
        k -> new CopyOnWriteArrayList<>());
    //加锁
    synchronized (serviceDescriptors) {
        //遍历此前的serviceDescriptors集合，获取第一个interfaceClazz为当前参数的数据
        Optional<ServiceDescriptor> previous = serviceDescriptors.stream()
            .filter(s -> s.getServiceInterfaceClass().equals(interfaceClazz)).findFirst();
        //如果存在服务
        if (previous.isPresent()) {
            //获取此前的服务描述符
            return previous.get();
        }
        //如果不存在服务
        else {
            //将当前服务描述符加入到集合中
            serviceDescriptors.add(serviceDescriptor);
            //返回当前服务描述符
            return serviceDescriptor;
        }
    }
}
```

### 2.1 ReflectionServiceDescriptor反射的服务描述符

下面看看ReflectionServiceDescriptor的构造器的源码。

**serviceInterfaceClass就是服务接口class，interfaceName就是接口全路径名，随后调用initMethods方法，获取接口全部的公共方法封装为ReflectionMethodDescriptor方法描述符对象，随后存入methods缓存map集合，key为方法名，value为方法描述符集合，因为可能有同名方法，随后还会构建descToMethods缓存map集合，key为方法名，value为一个方法参数到方法描述符的映射。**

```java
public ReflectionServiceDescriptor(Class<?> interfaceClass) {
//服务接口Class
    this.serviceInterfaceClass = interfaceClass;
    //接口全路径名
    this.interfaceName = interfaceClass.getName();
    //初始化方法描述符
    initMethods();
}
private void initMethods() {
    //获取接口的所有public方法，包括自身的和从父类、接口继承的。
    Method[] methodsToExport = this.serviceInterfaceClass.getMethods();
    for (Method method : methodsToExport) {
        //设置访问标记
        method.setAccessible(true);
        //构建方法描述符对象
        MethodDescriptor methodDescriptor = new ReflectionMethodDescriptor(method);
        //存入methods缓存map集合，key为方法名，value为方法描述符集合，因为可能有同名方法
        List<MethodDescriptor> methodModels = methods.computeIfAbsent(method.getName(), (k) -> new ArrayList<>(1));
        methodModels.add(methodDescriptor);
    }
    //存入descToMethods缓存map集合，key为方法名，value为一个方法参数到方法描述符的映射
    methods.forEach((methodName, methodList) -> {
        Map<String, MethodDescriptor> descMap = descToMethods.computeIfAbsent(methodName, k -> new HashMap<>());
        methodList.forEach(methodModel -> descMap.put(methodModel.getParamDesc(), methodModel));
    });
}
```

## 3 loadRegistries加载注册中心地址

**一个服务可以支持多个注册中心，例如zookeeper、nacos。该方法加载全部的注册中心url地址信息，方便后续对于所有的注册中心进行服务导出。大概逻辑为：**

**1、** 在该方法中首先获取**全部的注册中心配置**集合，然后**对每个注册中心的配置拼接好注册中心url**；

**2、** 随后会对url根据协议类型进行一次统一的协议替换，如果协议参数中有**registry-type=service**的参数，那么协议改为“**service-discovery-registry**”，即**服务级别发现注册中心地址**，否则协议取url的registry-protocol-type参数的值，如果也没有该参数，那么协议改为“registry”，即**接口级别发现注册中心地址**；

**3、** 最后调用**genCompatibleRegistries**方法获取兼容的注册中心地址；

```java
/**
 * ConfigValidationUtils的方法
 * 加载全部的注册中心url地址信息
 *
 * @param interfaceConfig 当前服务配置/引用配置
 * @param provider        是否是服务提供者
 * @return
 */
public static List<URL> loadRegistries(AbstractInterfaceConfig interfaceConfig, boolean provider) {
    // 必要时检查&&覆盖
    List<URL> registryList = new ArrayList<>();
    ApplicationConfig application = interfaceConfig.getApplication();
    //获取全部的注册中心配置信息
    List<RegistryConfig> registries = interfaceConfig.getRegistries();
    if (CollectionUtils.isNotEmpty(registries)) {
        //遍历全部注册中心配置
        for (RegistryConfig config : registries) {
            // try to refresh registry in case it is set directly by user using config.setRegistries()
            //尝试刷新注册表，以防它是由用户使用config.setRegistries()直接设置的。
            if (!config.isRefreshed()) {
                config.refresh();
            }
            //拼接注册中心url地址
            String address = config.getAddress();
            if (StringUtils.isEmpty(address)) {
                address = ANYHOST_VALUE;
            }
            if (!RegistryConfig.NO_AVAILABLE.equalsIgnoreCase(address)) {
                //url参数map
                Map<String, String> map = new HashMap<String, String>();
                AbstractConfig.appendParameters(map, application);
                AbstractConfig.appendParameters(map, config);
                map.put(PATH_KEY, RegistryService.class.getName());
                AbstractInterfaceConfig.appendRuntimeParameters(map);
                if (!map.containsKey(PROTOCOL_KEY)) {
                    map.put(PROTOCOL_KEY, DUBBO_PROTOCOL);
                }
                //根据模式 \s*[|;]+\s* 拆分url
                List<URL> urls = UrlUtils.parseURLs(address, map);
                for (URL url : urls) {
                    //重写url
                    url = URLBuilder.from(url)
                        .addParameter(REGISTRY_KEY, url.getProtocol())
                        //重设协议，如果协议参数中有registry-type=service的参数，那么协议改为“service-discovery-registry”，即服务级别发现注册中心地址
                        //否则协议取url的registry-protocol-type参数的值，如果也没有该参数，那么协议改为“registry”，即接口级别发现注册中心地址
                        .setProtocol(extractRegistryType(url))
                        .setScopeModel(interfaceConfig.getScopeModel())
                        .build();
                    //provider延迟注册状态将在RegistryProtocol#export中检查  provider delay register state will be checked in RegistryProtocol#export
                    if (provider || url.getParameter(SUBSCRIBE_KEY, true)) {
                        registryList.add(url);
                    }
                }
            }
        }
    }
    //获取兼容的注册中心地址
    return genCompatibleRegistries(interfaceConfig.getScopeModel(), registryList, provider);
}
```

### 3.1 genCompatibleRegistries获取兼容的双注册地址

在该方法调用之前，会根据url参数中的registry-type参数更改协议，如果协议参数中有registry-type=service的参数，那么协议改为“service-discovery-registry”，即**服务级别发现注册中心地址**，否则协议取url的registry-protocol-type参数的值，如果也没有该参数，那么协议改为“registry”，即**接口级别发现注册中心地址**。

**大部分情况下，我们是不会主动在注册中心url中添加registry-type参数的，因此，一般协议都会被更改为registry。而在genCompatibleRegistries方法中，会进行一系列判断并仍然可能多添加一个service-discovery-registry协议地址，即最终返回两个协议地址，一个是接口级别的，另一个是服务级别的。这就是所谓的Dubbo3.0的服务端自动开启接口级 + 应用级双注册功能：https://dubbo.apache.org/zh/docs3-v2/java-sdk/upgrades-and-compatibility/service-discovery/service-discovery-samples/**

该方法的大概逻辑为：

如果当前为服务提供者，那么需要对参数协议地址进行兼容性改造：

如果参数url协议已经是服务级别发现注册中心地址协议，即service-discovery-registry，一般都是registry，因为这需要手动配置registry-type=service参数；

1. 获取服务注册模式registerMode：获取url参数中的register-mode属性，如果没有则默认值为dubbo.application.register-mode属性的值，该属性默认值为instance。
2. 如果值为null，或者不是interface、instance、all三者中的一个，那么registerMode默认instance，即应用级模式。
3. 将参数中的应用级url加入结果集。
4. 如果服务注册模式为all，并且没有接口级地址，那么新增一个接口级地址，即registry开头，随后将接口级别注册地址加入结果集，这样配置的一个注册中心就有两个url地址了。

协议如果不是服务级别发现注册中心地址协议，即不是service-discovery-registry，一般都是走这个逻辑；

1. 获取服务注册模式**registerMode**：获取url参数中的**register-mode**属性，如果没有则默认值为dubbo.application.register-mode属性的值，**该属性默认值为all**。
2. 如果值为null，或者不是interface、instance、all三者中的一个，那么registerMode默认interface，即接口级模式。
3. **如果服务注册模式为all或者instance，并且没有应用级地址，那么新增一个应用级地址，即service-discovery-registry开头，随后将接口级别注册地址加入结果集。**
4. **如果服务注册模式为all或者interface，那么再将参数中的接口级url加入结果集。**

如果当前不是服务提供者，那么直接返回参数协议地址即可；

**通过上面的步骤可知，默认情况下，在Dubbo3.1中，将会对于一个注册中心返回两个注册协议地址，一个接口级别的协议地址，以registry开头，兼容Dubbo2，另一个是应用级别的协议地址，以service-discovery-registry开头，满足Dubbo3。**

下面举一个这两种url地址的例子：

**1、****服务级别发现注册中心地址**：service-discovery-registry://127.0.0.1:2181/org.apache.dubbo.registry.RegistryService?REGISTRY_CLUSTER=registry1&application=demo-provider&application.version=1&dubbo=2.0.2&pid=28659&registry=zookeeper&registry-type=service&registry.type=service&timeout=20001&timestamp=1666161869858；

**2、****接口级别发现注册中心地址**：registry://127.0.0.1:2181/org.apache.dubbo.registry.RegistryService?REGISTRY_CLUSTER=registry1&application=demo-provider&application.version=1&dubbo=2.0.2&pid=30594&registry=zookeeper&timeout=20001&timestamp=1666162612790；

```java
/**
 * ConfigValidationUtils的方法
 * 获取兼容的注册中心地址
 *
 * @param scopeModel   域模型
 * @param registryList 注册地址
 * @param provider     是否是服务提供者
 * @return 兼容的注册中心地址
 */
private static List<URL> genCompatibleRegistries(ScopeModel scopeModel, List<URL> registryList, boolean provider) {
    List<URL> result = new ArrayList<>(registryList.size());
    registryList.forEach(registryURL -> {
        //如果是服务提供者
        if (provider) {
            // for registries enabled service discovery, automatically register interface compatible addresses.
            //对于启用服务发现的注册中心，自动注册接口兼容地址。
            String registerMode;
            //协议如果是服务级别发现注册中心地址协议，即service-discovery-registry，一般都是registry
            if (SERVICE_REGISTRY_PROTOCOL.equals(registryURL.getProtocol())) {
                //获取服务注册模式，获取url参数中的register-mode属性，默认值为dubbo.application.register-mode属性的值，该属性默认值为instance
                registerMode = registryURL.getParameter(REGISTER_MODE_KEY, ConfigurationUtils.getCachedDynamicProperty(scopeModel, DUBBO_REGISTER_MODE_DEFAULT_KEY, DEFAULT_REGISTER_MODE_INSTANCE));
                //如果值为null，或者不是interface、instance、all三者中的一个，那么registerMode默认instance，即应用级模式
                if (!isValidRegisterMode(registerMode)) {
                    registerMode = DEFAULT_REGISTER_MODE_INSTANCE;
                }
                //加入结果
                result.add(registryURL);
                //如果服务注册模式为all，并且没有接口级地址，那么新增一个接口级地址，即registry开头
                if (DEFAULT_REGISTER_MODE_ALL.equalsIgnoreCase(registerMode)
                    && registryNotExists(registryURL, registryList, REGISTRY_PROTOCOL)) {
                    URL interfaceCompatibleRegistryURL = URLBuilder.from(registryURL)
                        .setProtocol(REGISTRY_PROTOCOL)
                        .removeParameter(REGISTRY_TYPE_KEY)
                        .build();
                    //将接口级别注册地址加入结果集
                    result.add(interfaceCompatibleRegistryURL);
                }
            }
            //协议如果不是服务级别发现注册中心地址协议，即不是service-discovery-registry，一般都是registry
            else {
                //获取服务注册模式，获取url参数中的register-mode属性，默认值为dubbo.application.register-mode属性的值，该属性默认值为all
                registerMode = registryURL.getParameter(REGISTER_MODE_KEY, ConfigurationUtils.getCachedDynamicProperty(scopeModel, DUBBO_REGISTER_MODE_DEFAULT_KEY, DEFAULT_REGISTER_MODE_ALL));
                //如果值为null，或者不是interface、instance、all三者中的一个，那么registerMode默认interface，即接口级模式
                if (!isValidRegisterMode(registerMode)) {
                    registerMode = DEFAULT_REGISTER_MODE_INTERFACE;
                }
                //如果服务注册模式为all或者instance，并且没有应用级地址，那么新增一个应用级地址，即service-discovery-registry开头
                if ((DEFAULT_REGISTER_MODE_INSTANCE.equalsIgnoreCase(registerMode) || DEFAULT_REGISTER_MODE_ALL.equalsIgnoreCase(registerMode))
                    && registryNotExists(registryURL, registryList, SERVICE_REGISTRY_PROTOCOL)) {
                    URL serviceDiscoveryRegistryURL = URLBuilder.from(registryURL)
                        .setProtocol(SERVICE_REGISTRY_PROTOCOL)
                        .removeParameter(REGISTRY_TYPE_KEY)
                        .build();
                    //将应用级别注册地址加入结果集
                    result.add(serviceDiscoveryRegistryURL);
                }
                //如果服务注册模式为all或者interface
                if (DEFAULT_REGISTER_MODE_INTERFACE.equalsIgnoreCase(registerMode) || DEFAULT_REGISTER_MODE_ALL.equalsIgnoreCase(registerMode)) {
                    //将接口级别注册地址加入结果集
                    result.add(registryURL);
                }
            }
            //注册状态报告服务
            FrameworkStatusReportService reportService = ScopeModelUtil.getApplicationModel(scopeModel).getBeanFactory().getBean(FrameworkStatusReportService.class);
            //注册报告服务
            reportService.reportRegistrationStatus(reportService.createRegistrationReport(registerMode));
        }
        //如果不是服务提供者，那么直接将url加入结果集
        else {
            result.add(registryURL);
        }
    });
    return result;
}
```

## 4 doExportUrlsFor1Protocol单协议多注册中心导出

**该方法根据单个协议向多个注册中心url集合进行服务导出。**

**1、** 首先会构建给定协议的服务导出url，在dubbo中，各种交互都是通过url的形式进行数据传递的，所以url在dubbo源码中无处不在；

**1、** 这里构建的服务导出url中包含ip、端口、服务接口、服务方法等参数，样式例如：dubbo://127.0.0.1:20880/org.apache.dubbo.demo.DemoService?anyhost=true&application=demo-provider&application.version=1&background=false&bind.ip=127.0.0.1&bind.port=20880&delay=5000&deprecated=false&dubbo=2.0.2&dynamic=true&generic=false&interface=org.apache.dubbo.demo.DemoService&methods=sayHello,sayHelloAsync&pid=1688&side=provider&timeout=3000&timestamp=1666274253014；

**2、** 然后调用exportUrl方法对所有的注册中心进行服务url导出；

```java
/**
 * ServiceConfig的方法
 * <p>
 * 根据协议向多个注册中心url集合进行服务导出
 *
 * @param protocolConfig 协议
 * @param registryURLs   多个注册中心url集合
 */
private void doExportUrlsFor1Protocol(ProtocolConfig protocolConfig, List<URL> registryURLs) {
    //构建协议导出服务的各种参数，用于组装服务导出的url
    Map<String, String> map = buildAttributes(protocolConfig);
    // remove null key and null value
    //移除空key和空值的属性
    map.keySet().removeIf(key -> StringUtils.isEmpty(key) || StringUtils.isEmpty(map.get(key)));
    // init serviceMetadata attachments
    //将map存入服务元数据的附加数据中
    serviceMetadata.getAttachments().putAll(map);
    //通过协议 + 参数 构建服务导出url，包含ip、端口、服务接口、服务方法等参数，样式例如：
    //dubbo://127.0.0.1:20880/org.apache.dubbo.demo.DemoService?anyhost=true&application=demo-provider&application.version=1&background=false&bind.ip=127.0.0.1&bind.port=20880&delay=5000&deprecated=false&dubbo=2.0.2&dynamic=true&generic=false&interface=org.apache.dubbo.demo.DemoService&methods=sayHello,sayHelloAsync&pid=1688&side=provider&timeout=3000&timestamp=1666274253014
    //在dubbo中，各种交互都是通过url的形式进行数据传递的
    URL url = buildUrl(protocolConfig, map);
    /*
     * 导出协议url
     */
    exportUrl(url, registryURLs);
}
```

## 5 exportUrl导出服务url

**该方法是导出服务url的入口方法，Dubbo在服务导出前会根据scope属性判断服务导出的范围，none代表不导出、local仅导出到本地JVM、remote会导出到远程，默认情况下会同时导出到本地JVM和远程。**

**通过exportLocal进行本地导出，通过exportRemote方法进行远程导出，在远程导出完毕之后，还会调用MetadataUtils#publishServiceDefinition方法发布服务元数据信息。**

```java
/**
 * 导出服务url
 *
 * @param url          要导出的服务url
 * @param registryURLs 注册中心url地址
 */
private void exportUrl(URL url, List<URL> registryURLs) {
    String scope = url.getParameter(SCOPE_KEY);
    // don't export when none is configured
    //如果没有配置scope，则不要导出
    if (!SCOPE_NONE.equalsIgnoreCase(scope)) {
        // export to local if the config is not remote (export to remote only when config is remote)
        //如果配置不是远程的则导出到本地(只有当配置是远程的时才导出到远程)
        if (!SCOPE_REMOTE.equalsIgnoreCase(scope)) {
            /*
             * 1 本地导出
             */
            exportLocal(url);
        }
        // export to remote if the config is not local (export to local only when config is local)
        //如果配置不是本地的，则导出到远程(仅当配置为本地时，导出到本地)
        if (!SCOPE_LOCAL.equalsIgnoreCase(scope)) {
            /*
             * 2 远程导出
             */
            url = exportRemote(url, registryURLs);
            /*
             * 3 发布服务元数据信息
             */
            if (!isGeneric(generic) && !getScopeModel().isInternal()) {
                MetadataUtils.publishServiceDefinition(url, providerModel.getServiceModel(), getApplicationModel());
            }
        }
    }
    //服务urls集合加入该导出的url
    this.urls.add(url);
}
```

### 5.1 exportLocal本地导出

**构建injvm协议的url，ip地址固定为127.0.0.1，端口为0。可以看到所谓的本地导出，没有监听端口，没有远程调用。说白了就是本jvm的消费者调用本jvm上的服务提供者，但是仍然会走dubbo的Filter和Listener。随后调用doExportUrl方法导出服务url。**

```java
/**
 * ServiceConfig的方法
 * <p>
 * 本地导出服务，采用injvm协议
 * always export injvm
 */
private void exportLocal(URL url) {
    //构建injvm协议的url，ip地址固定为127.0.0.1，端口为0。可以看到所谓的本地导出，没有监听端口，没有远程调用
    //说白了就是本jvm的消费者调用本jvm上的服务提供者，但是仍然会走dubbo的Filter和Listener
    URL local = URLBuilder.from(url)
        .setProtocol(LOCAL_PROTOCOL)
        .setHost(LOCALHOST_VALUE)
        .setPort(0)
        .build();
    local = local.setScopeModel(getScopeModel())
        .setServiceModel(providerModel);
    /*
     * 导出url
     */
    doExportUrl(local, false);
    logger.info("Export dubbo service " + interfaceClass.getName() + " to local registry url : " + local);
}
```

### 5.2 exportRemote远程导出

**该方法会对服务url依次调用注册中心registryURL并通过doExportUrl方法进行远程服务导出，在导出前，注册中心url的attributes中添加key为export，value为服务导出url的属性。**

**注意，如果注册中心url集合为空，那么表示直连服务消费者，如果注册中心配置成 表示服务消费者直连服务提供者，消费者可通过在service标签中配置url属性配置直连url。**

```java
/**
 * ServiceConfig的方法
 * <p>
 * 远程导出url
 *
 * @param url          导出的服务url
 * @param registryURLs 注册中心url
 * @return
 */
private URL exportRemote(URL url, List<URL> registryURLs) {
    //如果注册中心url集合不为空，那么进行远程导出
    if (CollectionUtils.isNotEmpty(registryURLs)) {
        //遍历注册中心url，依次注册
        for (URL registryURL : registryURLs) {
            //如果是应用级注册中心，那么为url添加service-name-mapping=true参数
            if (SERVICE_REGISTRY_PROTOCOL.equals(registryURL.getProtocol())) {
                url = url.addParameterIfAbsent(SERVICE_NAME_MAPPING_KEY, "true");
            }
            //if protocol is only injvm ,not register
            //如果导出的服务url为injvm，那么不会进行导出
            if (LOCAL_PROTOCOL.equalsIgnoreCase(url.getProtocol())) {
                continue;
            }
            //动态添加dynamic属性
            url = url.addParameterIfAbsent(DYNAMIC_KEY, registryURL.getParameter(DYNAMIC_KEY));
            //加载监控配置url
            URL monitorUrl = ConfigValidationUtils.loadMonitor(this, registryURL);
            if (monitorUrl != null) {
                url = url.putAttribute(MONITOR_KEY, monitorUrl);
            }
            // For providers, this is used to enable custom proxy to generate invoker
            //对于服务提供者，这用于支持自定义代理生成调用程序
            String proxy = url.getParameter(PROXY_KEY);
            if (StringUtils.isNotEmpty(proxy)) {
                registryURL = registryURL.addParameter(PROXY_KEY, proxy);
            }
            if (logger.isInfoEnabled()) {
                if (url.getParameter(REGISTER_KEY, true)) {
                    logger.info("Register dubbo service " + interfaceClass.getName() + " url " + url + " to registry " + registryURL.getAddress());
                } else {
                    logger.info("Export dubbo service " + interfaceClass.getName() + " to url " + url);
                }
            }
            //注册中心url的attributes中添加key为export，value为服务导出url的属性，进行服务导出
            doExportUrl(registryURL.putAttribute(EXPORT_KEY, url), true);
        }
    }
    //否则进行直接导出，者表示直连服务消费者，如果注册中心配置成<dubbo:registry address="N/A"/> 表示服务消费者直连服务提供者
    //消费者可通过在service标签中配置url属性配置直连url
    else {
        if (logger.isInfoEnabled()) {
            logger.info("Export dubbo service " + interfaceClass.getName() + " to url " + url);
        }
        doExportUrl(url, true);
    }
    return url;
}
```

### 5.3 publishServiceDefinition发布服务元数据

**在进行了远程服务导出之后，还需要通过MetadataUtils#publishServiceDefinition方法将服务的元数据信息发布到全部的元数据中心。**

**该方法最终是调用MetadataReport的storeProviderMetadata方法同步ProviderMetadata，调用MetadataReport的storeConsumerMetadata方法同步ConsumerMetadata，这两个方法我们在此前**[Dubbo启动元数据中心](/zhuanlan/j2ee/dubbo/2/9.html)**的时候就讲过了。**

```java
/**
 * 将生产者或者消费者的元数据信息发布到元数据中心
 *
 * @param url               服务url
 * @param serviceDescriptor 服务描述符
 * @param applicationModel  应用程序模型
 */
public static void publishServiceDefinition(URL url, ServiceDescriptor serviceDescriptor, ApplicationModel applicationModel) {
    if (getMetadataReports(applicationModel).size() == 0) {
        String msg = "Remote Metadata Report Server is not provided or unavailable, will stop registering service definition to remote center!";
        logger.warn(msg);
        return;
    }
    try {
        //服务类型
        String side = url.getSide();
        //如果是provider，即服务提供者
        if (PROVIDER_SIDE.equalsIgnoreCase(side)) {
            //获取服务key {group}/{servicePath}:{version}
            String serviceKey = url.getServiceKey();
            //获取全部服务元数据，宝库哦服务接口名、源代码位置、服务方法、注解等等服务描述信息
            FullServiceDefinition serviceDefinition = serviceDescriptor.getFullServiceDefinition(serviceKey);
            if (StringUtils.isNotEmpty(serviceKey) && serviceDefinition != null) {
                serviceDefinition.setParameters(url.getParameters());  //url的参数设置到serviceDefinition中
                //遍历全部元数据中心
                for (Map.Entry<String, MetadataReport> entry : getMetadataReports(applicationModel).entrySet()) {
                    MetadataReport metadataReport = entry.getValue();
                    if (!metadataReport.shouldReportDefinition()) {
                        logger.info("Report of service definition is disabled for " + entry.getKey());
                        continue;
                    }
                    //调用storeProviderMetadata方法同步ProviderMetadata，该方法我们在此前Dubbo启动元数据中心的时候就讲过了
                    metadataReport.storeProviderMetadata(
                        new MetadataIdentifier(
                            url.getServiceInterface(),
                            url.getVersion() == null ? "" : url.getVersion(),
                            url.getGroup() == null ? "" : url.getGroup(),
                            PROVIDER_SIDE,
                            applicationModel.getApplicationName())
                        , serviceDefinition);
                }
            }
        }
        //如果是服务消费者
        else {
            //遍历全部元数据中心
            for (Map.Entry<String, MetadataReport> entry : getMetadataReports(applicationModel).entrySet()) {
                MetadataReport metadataReport = entry.getValue();
                if (!metadataReport.shouldReportDefinition()) {
                    logger.info("Report of service definition is disabled for " + entry.getKey());
                    continue;
                }
                //调用storeConsumerMetadata方法同步ConsumerMetadata，该方法我们在此前Dubbo启动元数据中心的时候就讲过了
                metadataReport.storeConsumerMetadata(
                    new MetadataIdentifier(
                        url.getServiceInterface(),
                        url.getVersion() == null ? "" : url.getVersion(),
                        url.getGroup() == null ? "" : url.getGroup(),
                        CONSUMER_SIDE,
                        applicationModel.getApplicationName()),
                    url.getParameters());
            }
        }
    } catch (Exception e) {
        //ignore error
        logger.error("publish service definition metadata error.", e);
    }
}
```

这两个方法会将服务元数据信息同步到元数据中心，zookeeper作为元数据中心时，节点路径/dubbo/{pathTag}/{servicePath}/{version}/{group}/{side}，例如 /dubbo/metadata/org.apache.dubbo.demo.GreetingService/1.0.0/greeting/provider/demo-provider。

zookeeper中的provider的元数据格式如下：

zookeeper中的consumer的元数据格式如下：

## 6 总结

**本次我们学习了服务导出的核心方法doExportUrls的部分源码。通过源码我们可以知道：**

**默认情况下，在Dubbo3.1中，将会对于一个注册中心返回两个注册协议地址，一个接口级别的协议地址，以registry开头，兼容Dubbo2，另一个是应用级别的协议地址，以service-discovery-registry开头，满足Dubbo3。即服务端自动开启接口级 + 应用级双注册功能：https://dubbo.apache.org/zh/docs3-v2/java-sdk/upgrades-and-compatibility/service-discovery/service-discovery-samples/。**

**在导出服务的时候，Dubbo**一个服务可以支持多个不同的协议，例如dubbo、rmi、hessian、http、webservice、thrift、redis，以及支持多个不同的注册中心，例如zookeeper、nacos。服务将会被同时根据不同的协议想不同的注册中心进行服务导出。

**doExportUrls方法中，首先构建并注册对应服务的serviceDescriptor、providerModel，然后通过loadRegistries加载全部的注册中心url地址信息，最后遍历当前服务接口支持的协议，依次调用doExportUrlsFor1Protocol方法，尝试将每个协议向多个注册中心url进行服务导出。**

loadRegistries方法用于加载注册中心url地址，获取全部注册中心配置集合，然后对每个注册中心的配置拼接好注册中心url，协议将被改写为注册中心协议；

**1、** 在Dubbo3.1版本中，如果url没有特殊参数，那么默认情况下，每个注册中心都会生成两个注册中心协议url，一个service-discovery-registry开头的协议表示服务级别发现注册中心，一个registry开头的协议表示接口级别发现注册中心也就是说，服务将会同时进行接口级别和服务级别的注册；

**2、** doExportUrlsFor1Protocol方法中，会根据协议参数和当前服务元数据，构建出一个服务导出协议url，然后调用exportUrl方法继续导出；

**exportUrl方法中，获取scope属性判断服务导出的范围，none代表不导出、local仅导出到本地JVM、remote会导出到远程，默认为null，表示会同时导出到本地JVM和远程，分别调用exportLocal和exportRemote方法。在远程导出完毕之后，还会调用MetadataUtils#publishServiceDefinition方法发布服务元数据信息。**

exportLocal方法用于本地导出，用不上注册中心协议url，主要用于本jvm的消费者调用本jvm上的服务提供者，不涉及远程网络调用；

**1、** 将服务导出协议url改写为injvm协议的url，ip地址固定为127.0.0.1，端口为0可以看到所谓的本地导出，没有监听端口，没有远程调用，但是仍然会走dubbo的Filter和Listener随后调用doExportUrl方法执行协议导出；

**2、** exportRemote方法用于远程导出，涉及到服务注册、启动服务端nettyserver等逻辑，用于远程网络调用；

**1、** 遍历全部注册中心协议url添加参数，例如如果是应用级注册中心，那么为url添加service-name-mapping=true参数；

**2、** 在注册中心协议url内部的attributes中添加属性，key为export，value为服务导出协议url，随后调用doExportUrl方法执行协议导出；

exportLocal 和exportRemote方法最终都会调用doExportUrl方法，该方法是服务导出的核心方法。**下次我们将继续深入学习导出对某一个服务忌语某一个协议导出到某一个注册中心的doExportUrl方法的具体源码。**
