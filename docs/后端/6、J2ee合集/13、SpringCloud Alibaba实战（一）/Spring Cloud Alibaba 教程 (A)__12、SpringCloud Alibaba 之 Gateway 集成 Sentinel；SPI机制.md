# 12、SpringCloud Alibaba 之 Gateway 集成 Sentinel；SPI机制
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/1/12.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
## 一、Gateway 集成Sentinel

Gateway网关集成Sentinel是为了流控、熔断、降级

**1、** 添加sentinel-spring-cloud-gateway-adapter依赖；

```xml
<!-- sentinel-spring-cloud-gateway-adapter
    Gateway集成Sentinel
 -->
<dependency>
    <groupId>com.alibaba.csp</groupId>
    <artifactId>sentinel-spring-cloud-gateway-adapter</artifactId>
    <version>1.8.0</version>
</dependency>
```

**2、** 添加sentinel控制台配置；

```bash
#sentinel dashboard管理后台
spring：
  cloud：
    sentinel:
      eager: true
      transport:
        dashboard: 192.168.172.128:8080
```

**3、** 在配置类spring容器中配置一个Sentinel的全局过滤器；

```java
@Configuration
public class GatewayConfiguration {
    //省略号代表其它配置
    ......
    @Bean
    @Order(-1)
    public GlobalFilter sentinelGatewayFilter() {
        return new SentinelGatewayFilter();
    }
    ......
}
```

**4、** 启动测试；

（1）启动Nacos（如果使用MySQL数据持久化，则要先启动mysql服务）

```java
cd /opt/software/nacos/bin/
sh startup.sh -m standalone
```

启动MySQL服务（如果docker启动，先启动docker并挂载mysql，防止数据丢失）

http://192.168.133.129:8848/nacos

（2）启动Sentinel DashBoard控制台

```java
cd /opt/software/sentinel-dashboard-1.8.4/
java -jar sentinel-dashboard-1.8.4.jar
```

http://192.168.133.129:8080/

（3）分别启动服务提供者、服务消费者

（4）启动Spring Cloud Gateway

（5）浏览器输入访问

http://localhost:8081/test

## 二、Spring Cloud Gateway集成Sentinel规则持久化

### 一、使用SPI配置

**1、** 在application.properties中配置依赖；

```xml
<!--sentinel-datasource-extension数据源扩展-->
<dependency>
    <groupId>com.alibaba.csp</groupId>
    <artifactId>sentinel-datasource-extension</artifactId>
</dependency>
```

由于之前添加过了 **spring-cloud-starter-alibaba-sentinel** 依赖，包含了 **sentinel-datasource** 依赖，此处可以不加

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

**3、** 配置SPI（ServiceProviderInterface，JDK内置的一种服务提供发现机制，可以用来启用框架扩展和替换组件）；

Java SPI是一种以接口为基础，使用配置文件来加载（或称之为服务发现）的动态加载机制，主要使用JDK中ServiceLoader来实现

（1）在classPath下 resources 创建路径META-INF/services/目录下 创建一个 文件 com.alibaba.csp.sentinel.init.InitFunc（以接口的全路径做为名称，不要带文件格式后缀）

（2）将自定义的类 包路径名拷贝至此（实现类的全路径）

**4、** 启动消费者服务，此时去SentinelDashBoard中创建一条流控规则；

根据自定义类 FileDataSourceInit 中 存放sentinel 规则的文件夹，

即C:\Users\用户名\sentinel\rules 可找到相应Sentinel 规则持久化的JSON文件

```java
        //可以根据需要指定规则文件的位置
        //"user.home" 即C盘 C:\Users\用户名 下
        String ruleDir = System.getProperty("user.home") + "/sentinel/rules";
```

### 二、使用Nacos配置

**1、** 添加sentinel-datasource-nacos依赖；

```java
<!--sentinel数据持久化-->
<dependency>
    <groupId>com.alibaba.csp</groupId>
    <artifactId>sentinel-datasource-nacos</artifactId>
</dependency>
```

**2、** application.properties配置持久化数据源；

```java
#配置sentinel规则持久化到nacos
datasource:
  ncs1:
    nacos:
      server-addr: 192.168.133.128:80
      data-id: ${spring.application.name}.json
      group-id: DEFAULT_GROUP
      rule-type: flow
      data-type: json
degrade:
   nacos:
     server-addr: 192.168.133.128:80
     data-id: ${spring.application.name}-degrade.json
     group-id: DEFAULT_GROUP
     rule-type: degrade
     data-type: json
```

**3、** 在nacos配置中心配置流控规则；

```java
[
  {
    "resource": "abc",
    "controlBehavior": 0,
    "count": 1.0,
    "grade": 1,
    "limitApp": "default",
    "strategy": 0
  }
]
```

## 三、Sprng Cloud Gateway跨域CORS

可参考[https://blog.csdn.net/MinggeQingchun/article/details/125538531](https://blog.csdn.net/MinggeQingchun/article/details/125538531)

传统的Ajax请求只能获取在同一个域名下的资源，但是HTML5规范中打破了这种限制，允许Ajax发起跨域的请求（需要设置一下）

其实浏览器本身是可以发起跨域请求的，比如你可以链接一个另一个域名下的图片或者js，比如，但是javascript脚本是不能获取这些另一个域名下的资源内容的

**CORS**是一个W3C标准，全称是”**跨域资源共享**”（**Cross-origin resource sharing**），允许浏览器向跨源服务器，发出XMLHttpRequest请求，从而克服了AJAX只能同源使用的限制

这种CORS使用了一个额外的HTTP响应头来赋予当前user-agent（浏览器）获得跨域资源的权限，这里的跨域也就是Cross-Origin的概念，这里的权限就是访问另一个域名下的资源权限

CORS是现在HTML5标准中的一部分，在大部分现代浏览器中都有所支持，可能在某些老版本的浏览器不支持CORS，如果要兼容一些老的浏览器版本，则需要采用JSONP进行跨域请求

## 同源与非同源（跨域和不跨域）

如果 **访问****协议、端口（如果指定了端口**）、host 都相同，则称之为**同源****（不跨域）** ，否则为**非同源（跨域）**

如源链接： http://shop.company.com/good/page.html

**URL**

**是否同源**

**原因**

[http://shop.company.com/good2/other.html](http://store.company.com/dir2/other.html)

是

[http://shop.company.com/good/inner/another.html](http://store.company.com/dir/inner/another.html)

是

[https://shop.company.com/good.html](https://store.company.com/secure.html)

否

协议不同

[http://shop.company.com:81/good/etc.html](http://store.company.com:81/dir/etc.html)

否

端口不同

[http://news.company.com/good/other.html](http://news.company.com/dir/other.html)

否

host不同

解决跨域：

```java
/**
 * 配置网关跨域cors请求支持
 */
@Configuration
public class CorsConfig {
    @Bean
    public CorsWebFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.addAllowedMethod("*"); //是什么请求方法，比如 GET POST PUT DELATE .....
        config.addAllowedOrigin("*"); //来自哪个域名的请求，*号表示所有
        config.addAllowedHeader("*"); //是什么请求头
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource(new PathPatternParser());
        source.registerCorsConfiguration("/**", config);
        return new CorsWebFilter(source);
    }
}
```
