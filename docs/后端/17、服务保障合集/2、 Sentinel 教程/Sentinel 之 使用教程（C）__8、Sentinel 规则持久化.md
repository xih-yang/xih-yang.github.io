# 8、Sentinel 规则持久化
- 来源：https://ddkk.com/zhuanlan/guarantee/sentinel/20.html
- 分类：服务保障
- 分组：Sentinel 之 使用教程（C）
> 规则持久化分成两种方式：拉模式和推模式。

## 拉模式

## 原理简述

- FileRefreshableDataSource 定时从指定文件中读取规则JSON文件【图中的本地文件】，如果发现文件发生变化，就更新规则缓存。
- FileWritableDataSource 接收控制台规则推送，并根据配置，修改规则JSON文件【图中的本地文件】。

## 功能实现

加依赖

```xml
<dependency>
  <groupId>com.alibaba.csp</groupId>
  <artifactId>sentinel-datasource-extension</artifactId>
</dependency>
```

增加拉模式规则持久化类

```java
/**
 * 拉模式规则持久化
 *
 * @author itmuch.com
 */
public class FileDataSourceInit implements InitFunc {
    @Override
    public void init() throws Exception {
        // TIPS: 如果你对这个路径不喜欢，可修改为你喜欢的路径
        String ruleDir = System.getProperty("user.home") + "/sentinel/rules";
        String flowRulePath = ruleDir + "/flow-rule.json";
        String degradeRulePath = ruleDir + "/degrade-rule.json";
        String systemRulePath = ruleDir + "/system-rule.json";
        String authorityRulePath = ruleDir + "/authority-rule.json";
        String paramFlowRulePath = ruleDir + "/param-flow-rule.json";
        this.mkdirIfNotExits(ruleDir);
        this.createFileIfNotExits(flowRulePath);
        this.createFileIfNotExits(degradeRulePath);
        this.createFileIfNotExits(systemRulePath);
        this.createFileIfNotExits(authorityRulePath);
        this.createFileIfNotExits(paramFlowRulePath);
        // 流控规则
        ReadableDataSource<String, List<FlowRule>> flowRuleRDS = new FileRefreshableDataSource<>(
            flowRulePath,
            flowRuleListParser
        );
        // 将可读数据源注册至FlowRuleManager
        // 这样当规则文件发生变化时，就会更新规则到内存
        FlowRuleManager.register2Property(flowRuleRDS.getProperty());
        WritableDataSource<List<FlowRule>> flowRuleWDS = new FileWritableDataSource<>(
            flowRulePath,
            this::encodeJson
        );
        // 将可写数据源注册至transport模块的WritableDataSourceRegistry中
        // 这样收到控制台推送的规则时，Sentinel会先更新到内存，然后将规则写入到文件中
        WritableDataSourceRegistry.registerFlowDataSource(flowRuleWDS);
        // 降级规则
        ReadableDataSource<String, List<DegradeRule>> degradeRuleRDS = new FileRefreshableDataSource<>(
            degradeRulePath,
            degradeRuleListParser
        );
        DegradeRuleManager.register2Property(degradeRuleRDS.getProperty());
        WritableDataSource<List<DegradeRule>> degradeRuleWDS = new FileWritableDataSource<>(
            degradeRulePath,
            this::encodeJson
        );
        WritableDataSourceRegistry.registerDegradeDataSource(degradeRuleWDS);
        // 系统规则
        ReadableDataSource<String, List<SystemRule>> systemRuleRDS = new FileRefreshableDataSource<>(
            systemRulePath,
            systemRuleListParser
        );
        SystemRuleManager.register2Property(systemRuleRDS.getProperty());
        WritableDataSource<List<SystemRule>> systemRuleWDS = new FileWritableDataSource<>(
            systemRulePath,
            this::encodeJson
        );
        WritableDataSourceRegistry.registerSystemDataSource(systemRuleWDS);
        // 授权规则
        ReadableDataSource<String, List<AuthorityRule>> authorityRuleRDS = new FileRefreshableDataSource<>(
            authorityRulePath,
            authorityRuleListParser
        );
        AuthorityRuleManager.register2Property(authorityRuleRDS.getProperty());
        WritableDataSource<List<AuthorityRule>> authorityRuleWDS = new FileWritableDataSource<>(
            authorityRulePath,
            this::encodeJson
        );
        WritableDataSourceRegistry.registerAuthorityDataSource(authorityRuleWDS);
        // 热点参数规则
        ReadableDataSource<String, List<ParamFlowRule>> paramFlowRuleRDS = new FileRefreshableDataSource<>(
            paramFlowRulePath,
            paramFlowRuleListParser
        );
        ParamFlowRuleManager.register2Property(paramFlowRuleRDS.getProperty());
        WritableDataSource<List<ParamFlowRule>> paramFlowRuleWDS = new FileWritableDataSource<>(
            paramFlowRulePath,
            this::encodeJson
        );
        ModifyParamFlowRulesCommandHandler.setWritableDataSource(paramFlowRuleWDS);
    }
    private Converter<String, List<FlowRule>> flowRuleListParser = source -> JSON.parseObject(
        source,
        new TypeReference<List<FlowRule>>() {
        }
    );
    private Converter<String, List<DegradeRule>> degradeRuleListParser = source -> JSON.parseObject(
        source,
        new TypeReference<List<DegradeRule>>() {
        }
    );
    private Converter<String, List<SystemRule>> systemRuleListParser = source -> JSON.parseObject(
        source,
        new TypeReference<List<SystemRule>>() {
        }
    );
    private Converter<String, List<AuthorityRule>> authorityRuleListParser = source -> JSON.parseObject(
        source,
        new TypeReference<List<AuthorityRule>>() {
        }
    );
    private Converter<String, List<ParamFlowRule>> paramFlowRuleListParser = source -> JSON.parseObject(
        source,
        new TypeReference<List<ParamFlowRule>>() {
        }
    );
    private void mkdirIfNotExits(String filePath) throws IOException {
        File file = new File(filePath);
        if (!file.exists()) {
            file.mkdirs();
        }
    }
    private void createFileIfNotExits(String filePath) throws IOException {
        File file = new File(filePath);
        if (!file.exists()) {
            file.createNewFile();
        }
    }
    private <T> String encodeJson(T t) {
        return JSON.toJSONString(t);
    }
}
```

配置

在项目的 resources/META-INF/services 目录下创建文件，名为 com.alibaba.csp.sentinel.init.InitFunc ，内容为：

```java
# 改成上面FileDataSourceInit的包名类名全路径即可。
com.itmuch.contentcenter.FileDataSourceInit
```

优缺点分析

> 优点

- 简单易懂
- 没有多余依赖（比如配置中心、缓存等）

> 缺点

- 由于规则是用 `FileRefreshableDataSource` 定时更新的，所以规则更新会有延迟。如果`FileRefreshableDataSource`定时时间过大，可能长时间延迟；如果`FileRefreshableDataSource`过小，又会影响性能；
- 规则存储在本地文件，如果有一天需要迁移微服务，那么需要把规则文件一起迁移，否则规则会丢失。

### 推模式

### 原理简述

- 控制台推送规则：
- 将规则推送到Nacos或其他远程配置中心
- Sentinel客户端链接Nacos，获取规则配置；并监听Nacos配置变化，如发生变化，就更新本地缓存（从而让本地缓存总是和Nacos一致）
- 控制台监听Nacos配置变化，如发生变化就更新本地缓存（从而让控制台本地缓存总是和Nacos一致）

### 整合Apollo

**控制面板改造**

首先我们来改造sentinel的控制面板。在源码中官方已经给出来了单元测试。我们来进行改造。

我们在java包下面的`com.alibaba.csp.sentinel.dashboard.rule`创建一个apollo包，开始创建我们自己的类。

**ApolloConfig**

由于我们要将限流配置保存到Apollo中，所以我们需要配置地址和调用OpenAPI的token。

```java
@Configuration
@EnableApolloConfig
public class ApolloConfig {
    /**
     * apollo地址
     */
    @Value("${apollo.sentinel.portal.url}")
    private String apolloPortalUrl;
    /**
     * apollo token
     */
    @Value("${apollo.sentinel.token}")
    private String apolloApplicationToken;
    /**
     * @Author www.ddkk.com
     * @Description apollo openApi
     * @Date 09:39 2020-06-02
     * @param
     * @return
     **/
    @Bean
    public ApolloOpenApiClient apolloOpenApiClient() {
        ApolloOpenApiClient client = ApolloOpenApiClient.newBuilder()
            .withPortalUrl(apolloPortalUrl)
            .withToken(apolloApplicationToken)
            .build();
        return client;
    }
}
```

**ApolloCommonService**

主要用来对Apollo里的值和Sentinel中的实体类相互转换。在保存规则和读取规则都会调这里面的方法。

```java
@Service
public class ApolloCommonService {
    /**
     * 没有找到配置项，apollo 返回的错误码
     */
    private static final int NO_FOUND_ERROR_CODE = 404;
    @Autowired
    private ApolloOpenApiClient apolloOpenApiClient;
    @Value("${apollo.sentinel.env}")
    private String env;
    @Value("${apollo.sentinel.appid}")
    private String appId;
    @Value("${apollo.sentinel.cluster.name}")
    private String clusterName;
    @Value("${apollo.sentinel.namespace.name}")
    private String namespaceName;
    @Value("${apollo.sentinel.modify.user}")
    private String modifyUser;
    @Value("${apollo.sentinel.modify.comment}")
    private String modifyComment;
    @Value("${apollo.sentinel.release.comment}")
    private String releaseComment;
    @Value("${apollo.sentinel.release.user}")
    private String releaseUser;
    /**
     * @Author www.ddkk.com
     * @Description 从apollo中获取规则
     * @Date 19:52 2020-06-02
     * @param
     * @return
     **/
    public <T> List<T> getRules(String appName, String flowDataIdSuffix, Class<T> ruleClass) {
        // flowDataId
        String flowDataId = appName + flowDataIdSuffix;
        OpenNamespaceDTO openNamespaceDTO = apolloOpenApiClient.getNamespace(appId, env, clusterName, namespaceName);
        String rules = openNamespaceDTO
                .getItems()
                .stream()
                .filter(p -> p.getKey().equals(flowDataId))
                .map(OpenItemDTO::getValue)
                .findFirst()
                .orElse("");
        if (StringUtil.isEmpty(rules)) {
            return new ArrayList<>();
        }
        List<T> flow = JSON.parseArray(rules, ruleClass);
        if (Objects.isNull(flow)) {
            return new ArrayList<>();
        }
        return flow;
    }
    /**
     * @Author www.ddkk.com
     * @Description 设置规则类型
     * @Date 01:31 2020-06-03
     * @param
     * @return
     **/
    public void publishRules(String appName, String flowDataIdSuffix, String rules) {
        // flowDataId
        String flowDataId = appName + flowDataIdSuffix;
        AssertUtil.notEmpty(appName, "app name cannot be empty");
        if (rules == null) {
            return;
        }
        OpenItemDTO openItemDTO = new OpenItemDTO();
        openItemDTO.setKey(flowDataId);
        openItemDTO.setValue(rules);
        openItemDTO.setComment(modifyComment);
        openItemDTO.setDataChangeCreatedBy(modifyUser);
        try {
            apolloOpenApiClient.createOrUpdateItem(appId, env, clusterName, namespaceName, openItemDTO);
        } catch (Exception e) {
            if (e.getCause() instanceof ApolloOpenApiException) {
                ApolloOpenApiException apolloOpenApiException = (ApolloOpenApiException) e.getCause();
                if (Integer.valueOf(NO_FOUND_ERROR_CODE).equals(apolloOpenApiException.getStatus())) {
                    apolloOpenApiClient.createItem(appId, env, clusterName, namespaceName, openItemDTO);
                    System.out.println("初始化应用配置 -> {}" + flowDataId);
                }
            } else {
                e.printStackTrace();
            }
        }
        // Release configuration
        NamespaceReleaseDTO namespaceReleaseDTO = new NamespaceReleaseDTO();
        namespaceReleaseDTO.setEmergencyPublish(true);
        namespaceReleaseDTO.setReleaseComment(releaseComment);
        namespaceReleaseDTO.setReleasedBy(releaseUser);
        namespaceReleaseDTO.setReleaseTitle(releaseComment);
        apolloOpenApiClient.publishNamespace(appId, env, clusterName, namespaceName, namespaceReleaseDTO);
    }
    /**
     * @Author www.ddkk.com
     * @Description 删除规则
     * @Date 01:33 2020-06-03
     * @param
     * @return
     **/
    public void deleteRules(String rulekey, String operator) {
        try {
            apolloOpenApiClient.removeItem(appId, env, clusterName, namespaceName, rulekey, operator);
        } catch (Exception e) {
            if (e.getCause() instanceof ApolloOpenApiException) {
                ApolloOpenApiException apolloOpenApiException = (ApolloOpenApiException) e.getCause();
                if (Integer.valueOf(NO_FOUND_ERROR_CODE).equals(apolloOpenApiException.getStatus())) {
                    apolloOpenApiClient.removeItem(appId, env, clusterName, namespaceName, rulekey, operator);
                }
            } else {
                e.printStackTrace();
            }
        }
        // Release configuration
        NamespaceReleaseDTO namespaceReleaseDTO = new NamespaceReleaseDTO();
        namespaceReleaseDTO.setEmergencyPublish(true);
        namespaceReleaseDTO.setReleaseComment(releaseComment);
        namespaceReleaseDTO.setReleasedBy(releaseUser);
        namespaceReleaseDTO.setReleaseTitle(releaseComment);
        apolloOpenApiClient.publishNamespace(appId, env, clusterName, namespaceName, namespaceReleaseDTO);
    }
}
```

**AbstractApolloCommonService**

基础抽象类，主要定义类Apollo中配置的不同规则前缀和上面提到的Apollo规则的处理类。

```java
@Service
public abstract class AbstractApolloCommonService {
    @Autowired
    protected ApolloCommonService apolloCommonService;
    /**
     * 流控规则前缀标示
     */
    @Value("${apollo.sentinel.flow.key.suffix:-flow}")
    String flowDataIdSuffix;
    /**
     * 熔断降级规则前缀标示
     */
    @Value("${apollo.sentinel.degrade.key.suffix:-degrade}")
    String degradeDataIdSuffix;
    /**
     * 热点规则前缀标示
     */
    @Value("${apollo.sentinel.paramFlow.key.suffix:-paramFlow}")
    String paramFlowDataIdSuffix;
    /**
     * 系统规则前缀标示
     */
    @Value("${apollo.sentinel.system.key.suffix:-system}")
    String systemDataIdSuffix;
    /**
     * 授权规则前缀标示
     */
    @Value("${apollo.sentinel.authority.key.suffix:-authority}")
    String authorityDataIdSuffix;
}
```

**DynamicRuleProvider和DynamicRulePublisher**

```java
public interface DynamicRuleProvider<T> {
    T getRules(String appName) throws Exception;
}
public interface DynamicRulePublisher<T> {
    void publish(String app, T rules) throws Exception;
}
```

这个是Sentinel提供的对规则的处理接口。分别包含`getRules`和`publish`方法用来对规则进行获取和保存，针对不同的限流规则我们实现不同的实体类就可以了。我们用限流规则来举例。

**FlowRuleApolloProvider和FlowRuleApolloPublisher**

```java
@Component("flowRuleApolloProvider")
public class FlowRuleApolloProvider extends AbstractApolloCommonService implements
        DynamicRuleProvider<List<FlowRuleEntity>> {
    @Override
    public List<FlowRuleEntity> getRules(String appName) {
        return apolloCommonService.getRules(appName, flowDataIdSuffix, FlowRuleEntity.class);
    }
}
@Component("flowRuleApolloPublisher")
public class FlowRuleApolloPublisher extends AbstractApolloCommonService implements
        DynamicRulePublisher<List<FlowRuleEntity>> {
    @Override
    public void publish(String app, List<FlowRuleEntity> rules) {
        apolloCommonService.publishRules(app, flowDataIdSuffix, JSON.toJSONString(rules));
    }
}
```

**FlowControllerV2**

这是控制台的限流处理类，需要引用我们刚刚创建的类。

```java
@RestController
@RequestMapping(value = "/v2/flow")
public class FlowControllerV2 {
	...
    @Autowired
    @Qualifier("flowRuleApolloProvider")
    private DynamicRuleProvider<List<FlowRuleEntity>> ruleProvider;
    @Autowired
    @Qualifier("flowRuleApolloPublisher")
    private DynamicRulePublisher<List<FlowRuleEntity>> rulePublisher;
    ...
}    
```

**sidebar.html**

修改页面，让他调用V2的controller

```java
<li ui-sref-active="active" ng-if="!entry.isGateway">
<a ui-sref="dashboard.flow({app: entry.app})">
  <i class="glyphicon glyphicon-filter"></i>  流控规则</a>
</li>
```

重启下sentinel控制台，设置一下流控规则，我们就看到规则已经保存到Apollo中了。

**客户端改造**

引入依赖

```xml
<dependency>
    <groupId>com.alibaba.csp</groupId>
    <artifactId>sentinel-datasource-apollo</artifactId>
</dependency>
```

增加Apollo配置

```bash
apollo:
  meta: http://39.106.161.250:8080
  bootstrap:
    enabled: true
    namespaces: FISH.Sentinel-Common
```

增加限流规则配置，告诉客户端如何读取Apollo中的配置规则。

```bash
spring:
  cloud:
    sentinel:
      filter:
        enabled: true
      transport:
        dashboard: localhost:8080
      datasource:
        ds:
          apollo:
            namespaceName: FISH.Sentinel-Common
            flowRulesKey: order-flow
            ruleType: flow
```

这样客户端就能动态读取Apollo配置的规则了。
