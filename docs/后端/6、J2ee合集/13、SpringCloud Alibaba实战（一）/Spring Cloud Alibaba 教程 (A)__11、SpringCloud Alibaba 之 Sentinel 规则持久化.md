# 11、SpringCloud Alibaba 之 Sentinel 规则持久化
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/1/11.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
我们在使用 Sentinel DashBoard 进行Sentinel的规则设置时，一旦重启应用，Sentinel规则就会消失，在生产环境中我们需要将Sentinel规则进行持久化

GitHub地址：

[在生产环境中使用 Sentinel](https://github.com/alibaba/Sentinel/wiki/%E5%9C%A8%E7%94%9F%E4%BA%A7%E7%8E%AF%E5%A2%83%E4%B8%AD%E4%BD%BF%E7%94%A8-Sentinel)

## 规则管理及推送

一般来说，规则的推送有下面三种模式

推送模式
说明
优点
缺点

原始模式
API 将规则推送至客户端并直接更新到内存中，扩展写数据源（WritableDataSource）
简单，无任何依赖
不保证一致性；规则保存在内存中，重启即消失。严重不建议用于生产环境

Pull 模式
扩展写数据源（WritableDataSource）， 客户端主动向某个规则管理中心定期轮询拉取规则，这个规则中心可以是 RDBMS、文件 等
简单，无任何依赖；规则持久化
不保证一致性；实时性不保证，拉取过于频繁也可能会有性能问题。

Push 模式
扩展读数据源（ReadableDataSource），规则中心统一推送，客户端通过注册监听器的方式时刻监听变化，比如使用 Nacos、Zookeeper 等配置中心。这种方式有更好的实时性和一致性保证。生产环境下一般采用 push 模式的数据源。
规则持久化；一致性；快速
引入第三方依赖

## 一、原始模式

这是默认模式，该模式下规则不持久化，重启微服务，配置的限流降级等规则都丢失

如果不做任何修改，Dashboard 的推送规则方式是通过 API 将规则推送至客户端并直接更新到内存中

这种做法的好处是简单，无依赖；坏处是应用重启规则就会消失，仅用于简单测试，不能用于生产环境

## 二、Pull模式（拉模式）持久化到本地

pull 模式的数据源（如本地文件、RDBMS 等）一般是可写入的。使用时需要在客户端注册数据源：将对应的读数据源注册至对应的 RuleManager，将写数据源注册至 transport的 **`WritableDataSourceRegistry`**中

如上图所示：sentinel dashboard推送规则给微服务，微服务将规则更新到内存，同时将规则更新到本地文件，以实现规则的持久化

这种实现方法好处是简单，不引入新的依赖，坏处是无法保证监控数据的一致性

**1、** 在application.properties中配置依赖；

```xml
<!--sentinel-datasource-extension数据源扩展-->
<dependency>
    <groupId>com.alibaba.csp</groupId>
    <artifactId>sentinel-datasource-extension</artifactId>
</dependency>
```

由于之前添加过了 **spring-cloud-starter-alibaba-sentinel** 依赖，包含了 **sentinel-datasource** 依赖，此处可以不加

我们可以通过依赖查找是否含有依赖

pom.xml上右键->Diagrams–Show Dependencies这种方法解决时候连接线太长,不便于查找

于是安装使用 **Maven Helper** 插件搜索

插件安装完成后打开pom.xml文件,点击底部的Dependency Analyzer选项

找到红色的冲突项进行排除，选择Exclude就会排除未使用到的依赖进而解决依赖冲突问题

**2、** 自定义FileDataSourceInit类实现InitFunc（配置文件暂时不动）；

```java
import com.alibaba.csp.sentinel.command.handler.ModifyParamFlowRulesCommandHandler;
import com.alibaba.csp.sentinel.datasource.*;
import com.alibaba.csp.sentinel.init.InitFunc;
import com.alibaba.csp.sentinel.slots.block.authority.AuthorityRule;
import com.alibaba.csp.sentinel.slots.block.authority.AuthorityRuleManager;
import com.alibaba.csp.sentinel.slots.block.degrade.DegradeRule;
import com.alibaba.csp.sentinel.slots.block.degrade.DegradeRuleManager;
import com.alibaba.csp.sentinel.slots.block.flow.FlowRule;
import com.alibaba.csp.sentinel.slots.block.flow.FlowRuleManager;
import com.alibaba.csp.sentinel.slots.block.flow.param.ParamFlowRule;
import com.alibaba.csp.sentinel.slots.block.flow.param.ParamFlowRuleManager;
import com.alibaba.csp.sentinel.slots.system.SystemRule;
import com.alibaba.csp.sentinel.slots.system.SystemRuleManager;
import com.alibaba.csp.sentinel.transport.util.WritableDataSourceRegistry;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.TypeReference;
import java.io.File;
import java.io.IOException;
import java.util.List;
/**
 * 规则持久化
 */
public class FileDataSourceInit implements InitFunc {
    @Override
    public void init() throws Exception {
        //可以根据需要指定规则文件的位置
        //"user.home" 即C盘 C:\Users\用户名 下
        String ruleDir = System.getProperty("user.home") + "/sentinel/rules";
        String flowRulePath = ruleDir + "/flow-rule.json";
        String degradeRulePath = ruleDir + "/degrade-rule.json";
        String paramFlowRulePath = ruleDir + "/param-flow-rule.json";
        String systemRulePath = ruleDir + "/system-rule.json";
        String authorityRulePath = ruleDir + "/authority-rule.json";
        this.mkdirIfNotExits(ruleDir);
        this.createFileIfNotExits(flowRulePath);
        this.createFileIfNotExits(degradeRulePath);
        this.createFileIfNotExits(paramFlowRulePath);
        this.createFileIfNotExits(systemRulePath);
        this.createFileIfNotExits(authorityRulePath);
        //以下代码从官网拷贝过来
        // 流控规则：可读数据源
        ReadableDataSource<String, List<FlowRule>> flowRuleRDS = new FileRefreshableDataSource<>(
                flowRulePath,
                flowRuleListParser
        );
        // 将可读数据源注册至FlowRuleManager
        // 这样当规则文件发生变化时，就会更新规则到内存
        FlowRuleManager.register2Property(flowRuleRDS.getProperty());
        // 流控规则：可写数据源
        WritableDataSource<List<FlowRule>> flowRuleWDS = new FileWritableDataSource<>(
                flowRulePath,
                this::encodeJson
        );
        // 将可写数据源注册至transport模块的WritableDataSourceRegistry中
        // 这样收到控制台推送的规则时，Sentinel会先更新到内存，然后将规则写入到文件中
        WritableDataSourceRegistry.registerFlowDataSource(flowRuleWDS);
        // 降级规则：可读数据源
        ReadableDataSource<String, List<DegradeRule>> degradeRuleRDS = new FileRefreshableDataSource<>(
                degradeRulePath,
                degradeRuleListParser
        );
        DegradeRuleManager.register2Property(degradeRuleRDS.getProperty());
        // 降级规则：可写数据源
        WritableDataSource<List<DegradeRule>> degradeRuleWDS = new FileWritableDataSource<>(
                degradeRulePath,
                this::encodeJson
        );
        WritableDataSourceRegistry.registerDegradeDataSource(degradeRuleWDS);
        // 热点参数规则：可读数据源
        ReadableDataSource<String, List<ParamFlowRule>> paramFlowRuleRDS = new FileRefreshableDataSource<>(
                paramFlowRulePath,
                paramFlowRuleListParser
        );
        ParamFlowRuleManager.register2Property(paramFlowRuleRDS.getProperty());
        // 热点参数规则：可写数据源
        WritableDataSource<List<ParamFlowRule>> paramFlowRuleWDS = new FileWritableDataSource<>(
                paramFlowRulePath,
                this::encodeJson
        );
        ModifyParamFlowRulesCommandHandler.setWritableDataSource(paramFlowRuleWDS);
        // 系统规则：可读数据源
        ReadableDataSource<String, List<SystemRule>> systemRuleRDS = new FileRefreshableDataSource<>(
                systemRulePath,
                systemRuleListParser
        );
        SystemRuleManager.register2Property(systemRuleRDS.getProperty());
        // 系统规则：可写数据源
        WritableDataSource<List<SystemRule>> systemRuleWDS = new FileWritableDataSource<>(
                systemRulePath,
                this::encodeJson
        );
        WritableDataSourceRegistry.registerSystemDataSource(systemRuleWDS);
        // 授权规则：可读数据源
        ReadableDataSource<String, List<AuthorityRule>> authorityRuleRDS = new FileRefreshableDataSource<>(
                authorityRulePath,
                authorityRuleListParser
        );
        AuthorityRuleManager.register2Property(authorityRuleRDS.getProperty());
        // 授权规则：可写数据源
        WritableDataSource<List<AuthorityRule>> authorityRuleWDS = new FileWritableDataSource<>(
                authorityRulePath,
                this::encodeJson
        );
        WritableDataSourceRegistry.registerAuthorityDataSource(authorityRuleWDS);
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

**3、** 配置**SPI**（**ServiceProviderInterface**，JDK内置的一种服务提供发现机制，可以用来启用[框架](https://so.csdn.net/so/search?q=%E6%A1%86%E6%9E%B6&spm=1001.2101.3001.7020)扩展和替换组件）；

Java SPI是一种以接口为基础，使用配置文件来加载（或称之为服务发现）的动态加载机制，主要使用JDK中ServiceLoader来实现

（1）在classPath下 resources 创建路径META-INF/services/目录下 创建一个 文件 com.alibaba.csp.sentinel.init.InitFunc（以接口的全路径做为名称，不要带文件格式后缀）

（2）将自定义的类 包路径名拷贝至此（实现类的全路径）

**4、** 启动消费者服务，此时去SentinelDashBoard中创建一条流控规则；

根据自定义类 FileDataSourceInit 中 存放sentinel 规则的文件夹，

即 **C:\Users\用户名\sentinel\rules** 可找到相应Sentinel 规则持久化的JSON文件

```java
//可以根据需要指定规则文件的位置
//"user.home" 即C盘 C:\Users\用户名 下
String ruleDir = System.getProperty("user.home") + "/sentinel/rules";
```

## 三、Push模式（推模式）持久化到配置中心如Nacos

将规则存储在nacos配置中心，微服务从nacos配置中心获取规则，这种方式有更好的实时性和一致性保证，生产环境下一般采用该方式（支持nacos、zookeeper、Apollo等）；

但是目前有一个小问题，当我们在sentinel dashboard控制台更新规则，nacos里面的规则并不能得到更新，后续的版本中可能会解决该问题

**配置中心控制台/Sentinel 控制台 → 配置中心 → Sentinel 数据源 → Sentinel**，而不是经 Sentinel 数据源推送至配置中心

**1、** 添加sentinel-datasource-nacos依赖；

```xml
<!--sentinel数据持久化-->
<dependency>
    <groupId>com.alibaba.csp</groupId>
    <artifactId>sentinel-datasource-nacos</artifactId>
</dependency>
```

**2、** application.properties配置持久化数据源；

```bash
#基于nacos配置中心进行规则持久化 (利用nacos配置中心持久化流控规则)
spring.cloud.sentinel.datasource.ds1.nacos.server-addr=192.168.133.129:8848
spring.cloud.sentinel.datasource.ds1.nacos.data-id=${spring.application.name}.json
spring.cloud.sentinel.datasource.ds1.nacos.group-id=DEFAULT_GROUP
spring.cloud.sentinel.datasource.ds1.nacos.data-type=json
spring.cloud.sentinel.datasource.ds1.nacos.rule-type=flow
```

**3、** 在nacos配置中心配置流控规则；

```bash
[
  {
    "resource": "/test",
    "controlBehavior": 0,
    "count": 1.0,
    "grade": 1,
    "limitApp": "default",
    "strategy": 0
  }
]
```

**Data ID**： {spring.application.name}.json

可以仿写 本地持久化的JSON文件

```bash
[{
	"clusterConfig": {
		"acquireRefuseStrategy": 0,
		"clientOfflineTime": 2000,
		"fallbackToLocalWhenFail": true,
		"resourceTimeout": 2000,
		"resourceTimeoutStrategy": 0,
		"sampleCount": 10,
		"strategy": 0,
		"thresholdType": 0,
		"windowIntervalMs": 1000
	},
	"clusterMode": false,
	"controlBehavior": 0,
	"count": 1.0,
	"grade": 1,
	"limitApp": "default",
	"maxQueueingTimeMs": 500,
	"resource": "/test",
	"strategy": 0,
	"warmUpPeriodSec": 10
}]
```

浏览器输入快速访问

注：

如果配置了 SPI 进行本地化，则要清空SPI文件内容
