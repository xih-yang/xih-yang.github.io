# 5、Sentinel 整合 Nacos实现动态规则配置持久化、双向同步
- 来源：https://ddkk.com/zhuanlan/guarantee/sentinel/33.html
- 分类：服务保障
- 分组：Sentinel 之 实战教程（B）
## 1、为什么整合Nacos

默认情况下`Sentinel`配置的规则是储存的内存中，在重新`Sentinel服务`后，配置会显示，我们通过整合第三方`中间件`实现，配置的持久化，比如使用`Nacos`；

我们要实现`Sentinel`与`Nacos`的双向同步持久化，就需要对`sentinel-dashboard`的源码包进行修改。

## 2、效果演示

我们以`流控规则`为例，演示一个数据同步持久化的操作；

**1、nacos同步到sentinel：**

在nacos中，新增`配置`文件，文件的DataId为`sentinel`，内容为：

```bash
[
    {
    	"app":"user-service",// 服务名称
        "resource": "/list", //资源名称
        "count": 1, //阀值
        "grade": 1, //阀值类型,0表示线程数,1表示QPS;
        "limitApp": "default", //来源应用	
        "strategy": 0,// 流控模式,0表示直接,1表示关联,2表示链路;
        "controlBehavior": 0 //流控效果,0表示快速失败,1表示Warm Up,2表示排队等待
    }
]
```

查看Sentinel控制台：数据已经实现了同步

**2、sentinel同步到nacos：**

我们在`sentinel`控制台，建立任意流控规则，如下：

查看Nacos控制台：配置数据已经实现了同步

## 3、源码拉取

**1、下载源码压缩包**

在[Sentinel-github](https://github.com/alibaba/Sentinel)下载需要版本的压缩包，比如`Sentinel-1.8.1.zip`

**2、加载源码**

将下载好的`Sentinel-1.8.1.zip`解压，使用`IDE`工具，打开`sentinel-dashboard`工程

**3、修改pom**

将`sentinel-datasource-nacos`的`scope`标签注释掉

```xml
<dependency>
    <groupId>com.alibaba.csp</groupId>
    <artifactId>sentinel-datasource-nacos</artifactId>
    <!--<scope>test</scope>-->
</dependency>
```

## 3、创建公共配置

在进行规则代码修改之前需要创建Nacos配置文件，在`com.alibaba.csp.sentinel.dashboard.rule`包下创建`nacos`包，并且在包下创建四个类：`RuleNacosConfig`、`RuleNacosProvider`、`RuleNacosPublisher`、`RuleNacosConstants`

**RuleNacosConfig：**

```java
@Configuration
public class RuleNacosConfig{
    @Bean
    public ConfigService nacosConfigService() throws Exception {
        Properties properties = new Properties();
        properties.put(PropertyKeyConst.SERVER_ADDR, "112.15.11.18:8848");
        // properties.put(PropertyKeyConst.NAMESPACE, "xxx"); 命名空间
        // properties.put(PropertyKeyConst.USERNAME, "xxx"); 用户名
        // properties.put(PropertyKeyConst.PASSWORD, "xxx"); 密码
        return ConfigFactory.createConfigService(properties);
    }
}
```

**RuleNacosProvider：**

```java
@Component
public class RuleNacosProvider {
    @Autowired
    private ConfigService configService;
    public String getRules(String dataId, String app) throws Exception {
        // 将服务名称设置为GroupId
        return configService.getConfig(dataId, app, 3000);
    }
}
```

**RuleNacosPublisher：**

```java
@Component
public class RuleNacosPublisher {
    @Autowired
    private ConfigService configService;
    public void publish(String dataId, String app, String rules) throws Exception {
        AssertUtil.notEmpty(app, "app name cannot be empty");
        if (rules == null) {
            return;
        }
        // 将服务名称设置为GroupId
        configService.publishConfig(dataId, app, rules);
    }
}
```

**RuleNacosConstants ：**

```java
public class RuleNacosConstants {
    public static final String FLOW_DATA_ID = "sentinel.rule.flow";
    public static final String DEGRADE_DATA_ID = "sentinel.rule.degrade";
    public static final String SYSTEM_DATA_ID = "sentinel.rule.system";
    public static final String PARAM_DATA_ID = "sentinel.rule.param";
    public static final String AUTHORITY_DATA_ID = "sentinel.rule.authority";
    public static final String GATEWAY_API_DATA_ID = "sentinel.rule.gateway.api";
    public static final String GATEWAY_FLOW_DATA_ID = "sentinel.rule.gateway.flow";
}
```

## 4、控制台规则配置

通过修改源码，实现`流控规则、降级规则、热点规则、系统规则、授权规则`的持久化操作；

### 4.1、流程规则

**1、修改sidebar.html：**

```xml
<!--将dashboard.flowV1 修改为dashboard.flow -->
<li ui-sref-active="active">
    <a ui-sref="dashboard.flowV1({app: entry.app})">
        <i class="glyphicon glyphicon-filter"></i>  流控规则
    </a>
</li>
<!--修改后代码-->
<li ui-sref-active="active">
    <a ui-sref="dashboard.flow({app: entry.app})">
        <i class="glyphicon glyphicon-filter"></i>  流控规则
    </a>
</li>
```

**2、修改FlowControllerV2：**

将`RuleNacosProvider`和`RuleNacosPublisher`注入到`FlowControllerV2`中

```java
// 修改位置如下：
@Autowired
@Qualifier("flowRuleDefaultProvider")
private DynamicRuleProvider<List<FlowRuleEntity>> ruleProvider;
@Autowired
@Qualifier("flowRuleDefaultPublisher")
private DynamicRulePublisher<List<FlowRuleEntity>> rulePublisher;
// 将上面代码修改为以下代码：
@Autowired
private RuleNacosProvider ruleProvider;
@Autowired
private RuleNacosPublisher rulePublisher;
```

修改读取逻辑：

```java
// 修改位置如下：
List<FlowRuleEntity> rules = ruleProvider.getRules(app);
if (rules != null && !rules.isEmpty()) {
    for (FlowRuleEntity entity : rules) {
         entity.setApp(app);
         if (entity.getClusterConfig() != null && entity.getClusterConfig().getFlowId() != null) {
             entity.setId(entity.getClusterConfig().getFlowId());
          }
     }
}
// 将上面代码修改为以下代码：
String ruleStr = ruleProvider.getRules(RuleNacosConstants.FLOW_DATA_ID, app);
List<FlowRuleEntity> rules = new ArrayList<>();
if (ruleStr != null) {
    rules = JSON.parseArray(ruleStr, FlowRuleEntity.class);
    if (rules != null && !rules.isEmpty()) {
        for (FlowRuleEntity entity : rules) {
            entity.setApp(app);
        }
    }
 }
```

修改推送逻辑：

```java
// 修改位置如下：
private void publishRules(/*@NonNull*/ String app) throws Exception {
    List<FlowRuleEntity> rules = repository.findAllByApp(app);
    rulePublisher.publish(app, rules);
}
// 将上面代码修改为以下代码：
private void publishRules(String app) {
  try {
       List<FlowRuleEntity> rules = repository.findAllByApp(app);
       String ruleStr = JSON.toJSONString(rules);
       rulePublisher.publish(RuleNacosConstants.FLOW_DATA_ID, app, ruleStr);
  } catch (Exception e) {
      e.printStackTrace();
  }
}
```

### 4.2、降级规则

**修改DegradeController：**

将`RuleNacosProvider`和`RuleNacosPublisher`注入到`DegradeController`中

```java
// 加入以下代码：
@Autowired
private RuleNacosProvider ruleProvider;
@Autowired
private RuleNacosPublisher rulePublisher;
```

修改读取逻辑：

```java
// 修改位置如下：
List<DegradeRuleEntity> rules = sentinelApiClient.fetchDegradeRuleOfMachine(app, ip, port);
// 将上面代码修改为以下代码：
String ruleStr = ruleProvider.getRules(RuleNacosConstants.DEGRADE_DATA_ID, app);
List<DegradeRuleEntity> rules = new ArrayList<>();
if (ruleStr != null) {
    rules = JSON.parseArray(ruleStr, DegradeRuleEntity.class);
    if (rules != null && !rules.isEmpty()) {
       for (DegradeRuleEntity entity : rules) {
           entity.setApp(app);
       }
   }
}
```

修改推送逻辑：

```java
// 1、修改位置如下：
private boolean publishRules(String app, String ip, Integer port) {
   List<DegradeRuleEntity> rules = repository.findAllByMachine(MachineInfo.of(app, ip, port));
   return sentinelApiClient.setDegradeRuleOfMachine(app, ip, port, rules);
}
// 将上面代码修改为以下代码：
private void publishRules(String app) {
  try {
      List<DegradeRuleEntity> rules = repository.findAllByApp(app);
      String ruleStr = JSON.toJSONString(rules);
      rulePublisher.publish(RuleNacosConstants.DEGRADE_DATA_ID, app, ruleStr);
  } catch (Exception e) {
     e.printStackTrace();
  }
}
=======================================================================================
// 2、修改位置如下：有两处
if (!publishRules(entity.getApp(), entity.getIp(), entity.getPort())) {
     logger.warn("Publish degrade rules failed, app={}", entity.getApp());
}
// 将上面代码修改为以下代码：
publishRules(entity.getApp());
=======================================================================================
// 3、修改位置如下：
if (!publishRules(oldEntity.getApp(), oldEntity.getIp(), oldEntity.getPort())) {
   logger.warn("Publish degrade rules failed, app={}", oldEntity.getApp());
}
// 将上面代码修改为以下代码：
publishRules(oldEntity.getApp());
```

### 4.3、热点规则

**修改ParamRuleController：**

将`RuleNacosProvider`和`RuleNacosPublisher`注入到`ParamFlowRuleController`中

```java
// 加入以下代码：
@Autowired
private RuleNacosProvider ruleProvider;
@Autowired
private RuleNacosPublisher rulePublisher;
```

修改读取逻辑：

```java
// 修改位置如下：
return sentinelApiClient.fetchParamFlowRulesOfMachine(app, ip, port)
                .thenApply(repository::saveAll)
                .thenApply(Result::ofSuccess)
                .get();
// 将上面代码修改为以下代码：
String ruleStr = ruleProvider.getRules(RuleNacosConstants.PARAM_DATA_ID, app);
List<ParamFlowRuleEntity> rules = new ArrayList<>();
if (ruleStr != null) {
    rules = JSON.parseArray(ruleStr, ParamFlowRuleEntity.class);
    if (rules != null && !rules.isEmpty()) {
        for (ParamFlowRuleEntity entity : rules) {
           entity.setApp(app);
   		}
    }
}
rules = repository.saveAll(rules);
return Result.ofSuccess(rules);
```

修改推送逻辑：

```java
// 1、修改位置如下：
private CompletableFuture<Void> publishRules(String app, String ip, Integer port) {
    List<ParamFlowRuleEntity> rules = repository.findAllByMachine(MachineInfo.of(app, ip, port));
    return sentinelApiClient.setParamFlowRuleOfMachine(app, ip, port, rules);
}
// 将上面代码修改为以下代码：
private void publishRules(String app) {
   try {
       List<ParamFlowRuleEntity> rules = repository.findAllByApp(app);
       String ruleStr = JSON.toJSONString(rules);
       rulePublisher.publish(RuleNacosConstants.PARAM_DATA_ID, app, ruleStr);
   } catch (Exception e) {
     e.printStackTrace();
   }
}
=======================================================================================
// 2、修改位置如下：有两处
try {
   entity = repository.save(entity);
   publishRules(entity.getApp(), entity.getIp(), entity.getPort()).get();
   return Result.ofSuccess(entity);
} catch (ExecutionException ex) {
	....
}
// 将上面代码修改为以下代码：
try {
   entity = repository.save(entity);
   publishRules(entity.getApp());
   return Result.ofSuccess(entity);
} catch (Exception ex) {
	....
}
=======================================================================================
// 3、修改位置如下：
try {
 	repository.delete(id);
    publishRules(oldEntity.getApp(), oldEntity.getIp(), oldEntity.getPort()).get();
    return Result.ofSuccess(id);
} catch (ExecutionException ex) {
	....
}
// 将上面代码修改为以下代码：
try {
 	repository.delete(id);
    publishRules(oldEntity.getApp());
    return Result.ofSuccess(id);
} catch (Exception ex) {
	....
}
```

### 4.4、系统规则

**修改SystemController：**

将`RuleNacosProvider`和`RuleNacosPublisher`注入到`SystemController`中

```java
// 加入以下代码：
@Autowired
private RuleNacosProvider ruleProvider;
@Autowired
private RuleNacosPublisher rulePublisher;
```

修改读取逻辑：

```java
// 修改位置如下：
List<SystemRuleEntity> rules = sentinelApiClient.fetchSystemRuleOfMachine(app, ip, port);
// 将上面代码修改为以下代码：
String ruleStr = ruleProvider.getRules(RuleNacosConstants.SYSTEM_DATA_ID, app);
List<SystemRuleEntity> rules = new ArrayList<>();
if (ruleStr != null) {
    rules = JSON.parseArray(ruleStr, SystemRuleEntity.class);
    if (rules != null && !rules.isEmpty()) {
        for (SystemRuleEntity entity : rules) {
             entity.setApp(app);
        }
    }
}
```

修改推送逻辑：

```java
// 1、修改位置如下：
private boolean publishRules(String app, String ip, Integer port) {
   List<SystemRuleEntity> rules = repository.findAllByMachine(MachineInfo.of(app, ip, port));
   return sentinelApiClient.setSystemRuleOfMachine(app, ip, port, rules);
}
// 将上面代码修改为以下代码：
private void publishRules(String app) {
  try {
       List<SystemRuleEntity> rules = repository.findAllByApp(app);
       String ruleStr = JSON.toJSONString(rules);
       rulePublisher.publish(RuleNacosConstants.SYSTEM_DATA_ID, app, ruleStr);
   } catch (Exception e) {
       e.printStackTrace();
  }
}
=======================================================================================
// 2、修改位置如下
if (!publishRules(app, ip, port)) {
    logger.warn("Publish system rules fail after rule add");
}
// 将上面代码修改为以下代码：
publishRules(entity.getApp());
=======================================================================================
// 3、修改位置如下
if (!publishRules(entity.getApp(), entity.getIp(), entity.getPort())) {
    logger.info("publish system rules fail after rule update");
}
// 将上面代码修改为以下代码：
publishRules(entity.getApp());
=======================================================================================
// 4、修改位置如下：
if (!publishRules(oldEntity.getApp(), oldEntity.getIp(), oldEntity.getPort())) {
    logger.info("publish system rules fail after rule delete");
}
// 将上面代码修改为以下代码：
publishRules(oldEntity.getApp());
```

### 4.5、授权规则

**修改AuthorityRuleController：**

将`RuleNacosPublisher`和`RuleNacosProvider`注入到`AuthorityRuleController`中

```java
// 加入以下代码：
@Autowired
private RuleNacosProvider ruleProvider;
@Autowired
private RuleNacosPublisher rulePublisher;
```

修改读取逻辑：

```java
// 修改位置如下：
List<AuthorityRuleEntity> rules = sentinelApiClient.fetchAuthorityRulesOfMachine(app, ip, port);
// 将上面代码修改为以下代码：
 String ruleStr = ruleProvider.getRules(RuleNacosConstants.AUTHORITY_DATA_ID, app);
List<AuthorityRuleEntity> rules = new ArrayList<>();
if (ruleStr != null) {
     rules = JSON.parseArray(ruleStr, AuthorityRuleEntity.class);
     if (rules != null && !rules.isEmpty()) {
         for (AuthorityRuleEntity entity : rules) {
              entity.setApp(app);
         }
    }
}
```

修改推送逻辑：

```java
// 1、修改位置如下：
private boolean publishRules(String app, String ip, Integer port) {
    List<AuthorityRuleEntity> rules = repository.findAllByMachine(MachineInfo.of(app, ip, port));
    return sentinelApiClient.setAuthorityRuleOfMachine(app, ip, port, rules);
}
// 将上面代码修改为以下代码：
private void publishRules(String app) {
   try {
       List<AuthorityRuleEntity> rules = repository.findAllByApp(app);
       String ruleStr = JSON.toJSONString(rules);
       rulePublisher.publish(RuleNacosConstants.AUTHORITY_DATA_ID, app, ruleStr);
   } catch (Exception e) {
       e.printStackTrace();
   }
}
=======================================================================================
// 2、修改位置如下：有两处
if (!publishRules(entity.getApp(), entity.getIp(), entity.getPort())) {
    logger.info("Publish authority rules failed after rule update");
}
// 将上面代码修改为以下代码：
publishRules(entity.getApp());
=======================================================================================
// 3、修改位置如下：
if (!publishRules(oldEntity.getApp(), oldEntity.getIp(), oldEntity.getPort())) {
   logger.error("Publish authority rules failed after rule delete");
}
// 将上面代码修改为以下代码：
publishRules(oldEntity.getApp());
```

## 5、网关控制台规则配置

配置网关控制台规则，在启动网关时需要加上参数：`-Dcsp.sentinel.app.type=1`

### 5.1、API管理

**修改GatewayApiController：**

将`RuleNacosPublisher`和`RuleNacosProvider`注入到`GatewayApiController`中

```java
// 加入以下代码：
@Autowired
private RuleNacosProvider ruleProvider;
@Autowired
private RuleNacosPublisher rulePublisher;
```

修改读取逻辑：

```java
// 修改位置如下：
List<ApiDefinitionEntity> apis = sentinelApiClient.fetchApis(app, ip, port).get();
// 将上面代码修改为以下代码：
String ruleStr = ruleProvider.getRules(RuleNacosConstants.GATEWAY_API_DATA_ID, app);
List<ApiDefinitionEntity> apis = new ArrayList<>();
if (ruleStr != null) {
    apis = JSON.parseArray(ruleStr, ApiDefinitionEntity.class);
    if (apis != null && !apis.isEmpty()) {
        for (ApiDefinitionEntity entity : apis) {
             entity.setApp(app);
        }
    }
}
```

修改推送逻辑：

```java
// 1、修改位置如下：
private boolean publishApis(String app, String ip, Integer port) {
   List<ApiDefinitionEntity> apis = repository.findAllByMachine(MachineInfo.of(app, ip, port));
   return sentinelApiClient.modifyApis(app, ip, port, apis);
}
// 将上面代码修改为以下代码：
private void publishApi(String app) {
  try {
    	 List<ApiDefinitionEntity> apis= repository.findAllByApp(app);
    	 String ruleStr = JSON.toJSONString(apis);
    	 rulePublisher.publish(RuleNacosConstants.GATEWAY_API_DATA_ID, app, ruleStr);
     } catch (Exception e) {
         e.printStackTrace();
   }
}
=======================================================================================
// 2、修改位置如下
if (!publishApis(app, ip, port)) {
     logger.warn("publish gateway apis fail after add");
}
// 将上面代码修改为以下代码：
publishApi(entity.getApp());
=======================================================================================
// 3、修改位置如下
if (!publishApis(app, entity.getIp(), entity.getPort())) {
    logger.warn("publish gateway apis fail after update");
}
// 将上面代码修改为以下代码：
publishApi(entity.getApp());
=======================================================================================
// 4、修改位置如下：
if (!publishApis(oldEntity.getApp(), oldEntity.getIp(), oldEntity.getPort())) {
    logger.warn("publish gateway apis fail after delete");
}
// 将上面代码修改为以下代码：
publishApi(oldEntity.getApp());
```

### 5.2、流程规则

**修改GatewayFlowRuleController：**

将`RuleNacosPublisher`和`RuleNacosProvider`注入到`GatewayFlowRuleController`中

```java
// 加入以下代码：
@Autowired
private RuleNacosProvider ruleProvider;
@Autowired
private RuleNacosPublisher rulePublisher;
```

修改读取逻辑：

```java
// 修改位置如下：
List<GatewayFlowRuleEntity> rules = sentinelApiClient.fetchGatewayFlowRules(app, ip, port).get();
// 将上面代码修改为以下代码：
String ruleStr = ruleProvider.getRules(RuleNacosConstants.GATEWAY_FLOW_DATA_ID, app);
List<GatewayFlowRuleEntity> rules = new ArrayList<>();
if (ruleStr != null) {
    rules = JSON.parseArray(ruleStr, GatewayFlowRuleEntity.class);
    if (rules != null && !rules.isEmpty()) {
       for (GatewayFlowRuleEntity entity : rules) {
           entity.setApp(app);
        }
    }
}
```

修改推送逻辑：

```java
// 1、修改位置如下：
private boolean publishRules(String app, String ip, Integer port) {
   List<GatewayFlowRuleEntity> rules = repository.findAllByMachine(MachineInfo.of(app, ip, port));
   return sentinelApiClient.modifyGatewayFlowRules(app, ip, port, rules);
}
// 将上面代码修改为以下代码：
private void publishRules(String app) {
  try {
      List<GatewayFlowRuleEntity> rules = repository.findAllByApp(app);
      String ruleStr = JSON.toJSONString(rules);
      rulePublisher.publish(RuleNacosConstants.GATEWAY_FLOW_DATA_ID, app, ruleStr);
   } catch (Exception e) {
      e.printStackTrace();
   }
}
=======================================================================================
// 2、修改位置如下
if (!publishRules(app, ip, port)) {
    logger.warn("publish gateway flow rules fail after add");
}
// 将上面代码修改为以下代码：
publishRules(entity.getApp());
=======================================================================================
// 3、修改位置如下
if (!publishRules(app, entity.getIp(), entity.getPort())) {
    logger.warn("publish gateway flow rules fail after update");
}
// 将上面代码修改为以下代码：
publishRules(entity.getApp());
=======================================================================================
// 4、修改位置如下：
if (!publishRules(oldEntity.getApp(), oldEntity.getIp(), oldEntity.getPort())) {
    logger.warn("publish gateway flow rules fail after delete");
}
// 将上面代码修改为以下代码：
publishRules(oldEntity.getApp());
```

### 5.3、降级规则

使用的是控制台规则配置中的降级规则接口，无需在做操作，参考《4.2、降级规则》。

### 5.4、系统规则

使用的是控制台规则配置中的降级规则接口，无需在做操作，参考《4.4、系统规则》。

## 6、打包部署

进入到`sentinel-dashboard`所在目的，通过`mvn clean install package -DskipTests=true`进行打包。

**部署jar参考：**

[《Linux搭建Sentinel 控制台环境》](/zhuanlan/guarantee/sentinel/29.html)

[《Docker搭建Sentinel 控制台环境》](/zhuanlan/guarantee/sentinel/30.html)

## 7、源码包下载

对于上述修改的代码，源码下载地址：

> 链接：https://pan.baidu.com/s/1wgGxEGL4M3cDZO_LKTvw6A?pwd=1234
>
> 提取码：1234

将下载的`Controller`和`Nacos`配置代码直接拷贝到源码中即可使用。
