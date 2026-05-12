# 11、Nepxion 教程 - Discovery 之全链路界面操作蓝绿灰度发布
- 来源：https://ddkk.com/zhuanlan/j2ee/nepxion/1/11.html
- 分类：J2EE框架
- 分组：Nepxion 教程
在之前的文章中讲过，用户可以通过 URL 请求以及配置中心进行灰度发布的操作，而且支持配置中心的灰度发布参数的动态变更。如果用户不希望使用上面的两种方式，`Nepxion Discovery` 框架还支持图形化进行灰度化配置。通过 Swagger 支持使用 Web 界面进行配置修改，同时`Nepxion Discovery` 也提供了桌面程序来进行灰度配置。其实桌面程序也是基于 restful 来进行操作的。`Nepxion Discovery` 框架支持以下几种方式的灰度发布的规则策略推送。

- 基于远程配置中心的规则策略订阅推送。[详细配置地址传送门](https://gitee.com/nepxion/Discovery#%E5%9F%BA%E4%BA%8E%E8%BF%9C%E7%A8%8B%E9%85%8D%E7%BD%AE%E4%B8%AD%E5%BF%83%E7%9A%84%E8%A7%84%E5%88%99%E7%AD%96%E7%95%A5%E8%AE%A2%E9%98%85%E6%8E%A8%E9%80%81)
- 基于Swagger和Rest的规则策略推送。[详细配置地址传送门](https://gitee.com/nepxion/Discovery#%E5%9F%BA%E4%BA%8ESwagger%E5%92%8CRest%E7%9A%84%E8%A7%84%E5%88%99%E7%AD%96%E7%95%A5%E6%8E%A8%E9%80%81)
- 基于图形化桌面端和Web端的规则策略推送。[详细配置地址传送门](https://gitee.com/nepxion/Discovery#%E5%85%A8%E9%93%BE%E8%B7%AF%E8%93%9D%E7%BB%BF%E7%81%B0%E5%BA%A6%E5%8F%91%E5%B8%83%E7%BC%96%E6%8E%92%E5%BB%BA%E6%A8%A1%E5%92%8C%E6%B5%81%E9%87%8F%E4%BE%A6%E6%B5%8B)

首先我们先来了解一下如果进行桌面程序来操作配置中心进行灰度发布的推送的。

## 1、基于图形化桌面端和Web端的规则策略推送

①获取图形化桌面端

桌面端获取方式有两种方式

- 通过https://github.com/Nepxion/DiscoveryUI/releases下载最新版本的discovery-desktop-release
- 编译https://github.com/Nepxion/DiscoveryUI下的desktop，在target目录下产生discovery-desktop-release

②启动控制台

- 通过https://github.com/Nepxion/DiscoveryPlatform下载最新版本的控制台
- 导入IDE或者编译成Spring Boot程序运行
- 运行之前，先修改src/main/resources/bootstrap.properties的相关配置，包括注册中心和配置中心的地址等

③启动图形化桌面端

- 修改config/console.properties中的url，指向控制台的地址
- 在Windows操作系统下，运行startup.bat，在Mac或者Linux操作系统下，运行startup.sh

④登录图形化桌面端

- 登录认证，用户名和密码为admin/admin或者nepxion/nepxion。控制台支持简单的认证，用户名和密码配置- 在上述控制台的bootstrap.properties中，使用者可以自己扩展AuthenticationResource并注入，实现更专业的认证功能

如何进行基于桌面程序的全链路蓝绿发布编排建模，官方网站已经说得很清楚了，这里我就不在赘述了。访问地址 – [Discovery#全链路蓝绿发布编排建模](https://gitee.com/nepxion/Discovery#%E5%85%A8%E9%93%BE%E8%B7%AF%E8%93%9D%E7%BB%BF%E5%8F%91%E5%B8%83%E7%BC%96%E6%8E%92%E5%BB%BA%E6%A8%A1) 。

之前已经说了不管是`基于Swagger和Rest的规则策略推送` 还是 `基于图形化桌面端和Web端的规则策略推送` 他们都基于对 Restful 接口的调用。那么这个 Restful 接口是谁提供的呢？其实就是 `discovery-console` 里面暴露的 restful 接口。

## 2、discovery-console

`discovery-console` 是控制平台目录，里面包含 4 个子模块：

```java
+ discovery-console
	└ discovery-console-starter        【控制平台的starter】
	└ discovery-console-starter-apollo 【控制平台的Apollo Starter】
	└ discovery-console-starter-nacos  【控制平台的Nacos Starter】
	└ discovery-console-starter-redis  【控制平台的Redis Starter】
```

里面最核心的就是 `discovery-console-starter`，另外 3 个模块是对不同配置中心的支持。我们首先来分析一下 `discovery-console-starter`。这个项目里面有对 spring 的扩展，也就是先来解读一下 `discovery-console-starter/resources/META-INF/spring.factories` 文件。

> discovery-console-starter/resources/META-INF/spring.factories

```java
org.springframework.boot.env.EnvironmentPostProcessor=\
com.nepxion.discovery.console.context.ConsoleEnvironmentPostProcessor
org.springframework.context.ApplicationContextInitializer=\
com.nepxion.discovery.console.context.ConsoleApplicationContextInitializer
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
com.nepxion.discovery.console.configuration.ConsoleAutoConfiguration
```

- ConsoleEnvironmentPostProcessor：这个类的功能比较简单，它实现了 EnvironmentPostProcessor 对 Spring 环境类的扩展在环境里面添加了 Key 值为 spring.application.type ，value 为 console。
- ConsoleApplicationContextInitializer：这个类实现了 ApplicationContextInitializer，在 Spring 容器初始化之前会执行。对于容器类型非 AnnotationConfigApplicationContext 里面进行了 Log 打印以及添加了对 Web 环境的支持。
- ConsoleAutoConfiguration：里面主要是配置了 Console 模块的几个功能：SwaggerConfiguration 暴露 swagger 接口，CorsRegistryConfiguration 支持跨越访问，ConsoleEndpoint 暴露控制灰度发布的 restful 接口。AuthenticationResource 提供用户验证功能，主要是用于客户端的登陆。

从上面的分析之中我们可以看到 `discovery-console` 的核心功能是提供 restful 为外部服务修改配置中心的路由规则。暴露 restful 接口的责任都是在`ConsoleEndpoint`这个类里面，那下面我们就来分析一下这个类。

## 3、ConsoleEndpoint

`ConsoleEndpoint` 这个类还是挺简单的，它其实是通过 spring mvc 暴露一些 restful 的接口。这个类里面主要持有以下几个对象：

> ConsoleEndpoint.java

```java
    @Autowired
    private DiscoveryClient discoveryClient;
    @Autowired(required = false)
    private ConfigAdapter configAdapter;
    @Autowired
    private AuthenticationResource authenticationResource;
    private RestTemplate consoleRestTemplate;
```

- DiscoveryClient ：服务发现客户端，可以从注册中心获取服务实例的信息。
- ConfigAdapter ：配置中心配置类，可以操作不同的配置中心，完成对配置中心灰度路由规则的操作
- AuthenticationResource：用户认证处理类，用于客户端界面的登陆认证
- RestTemplate：如果在图形化桌面端和Web端的规则策略推送时调用控制中心的接口时会把灰度策略推送到服务的各个实例里面

控制中心提供的灰度操作功能如下：

- 登录认证
- 获取注册发现中心类型
- 获取配置中心类型
- 获取服务注册中心的服务组名列表
- 获取服务注册中心的服务名列表
- 获取服务注册中心的网关名列表
- 获取服务注册中心的服务实例列表
- 获取服务注册中心的服务实例列表（精简数据）
- 获取服务注册中心的服务实例的Map（精简数据）
- 推送更新规则配置信息到远程配置中心
- 清除规则配置信息到远程配置中心
- 查看远程配置中心的规则配置信息
- 批量异步推送更新规则配置信息
- 批量同步推送更新规则配置信息
- 批量异步清除更新的规则配置信息
- 批量同步清除更新的规则配置信息
- 批量异步更新服务的动态版本
- 批量同步更新服务的动态版本
- 批量异步清除服务的动态版本
- 批量同步清除服务的动态版本
- 更新哨兵规则列表
- 清除哨兵规则列表
- 校验策略的条件表达式

但是针对于以下操作需要使用 AbstractRestInvoker#invoke 操作。

这个操作其实是需要对具体服务的实例(比如：servierA)进行操作。里面 `AbstractRestInvoker`

这个类里面持有三个对象。

- protected List`` instances ：当前服务的所有实例列表
- RestTemplate restTemplate：Spring MVC 提供发送 HTTP 的组件接口
- boolean async：是否异步执行

`AbstractRestInvoker` 有以下几个实例对象：

- ConfigClearRestInvoker：配置清除 Restful 调用处理类
- ConfigUpdateRestInvoker : 配置修改 Restful 调用处理类
- SentinelClearRestInvoker: 清除Sentinel 哨兵规则列表 Restful 调用处理类
- SentinelUpdateRestInvoker：更新Sentinel 规则列表 Restful 调用处理类
- VersionClearRestInvoker：清除灰度 版本 Restful 调用处理类
- VersionUpdateRestInvoker：修改灰度 版本 Restful 调用处理类

下面我们来分析一下 AbstractRestInvoker#invoke 的调用逻辑。

> AbstractRestInvoker.java

```java
public abstract class AbstractRestInvoker {
    public ResponseEntity<?> invoke() {
        if (CollectionUtils.isEmpty(instances)) {
            LOG.warn("No service instances found");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("No service instances found");
        }
        List<ResultEntity> resultEntityList = new ArrayList<ResultEntity>();
        for (ServiceInstance instance : instances) {
            Map<String, String> metadata = instance.getMetadata();
            String host = instance.getHost();
            int port = instance.getPort();
            String contextPath = metadata.get(DiscoveryConstant.SPRING_APPLICATION_CONTEXT_PATH);
            String url = "http://" + host + ":" + port + UrlUtil.formatContextPath(contextPath) + getSuffixPath();
            String result = null;
            try {
                checkPermission(instance);
                result = doRest(url);
                if (!StringUtils.equals(result, DiscoveryConstant.OK)) {
                    result = RestUtil.getCause(restTemplate);
                }
            } catch (Exception e) {
                result = e.getMessage();
            }
            ResultEntity resultEntity = new ResultEntity();
            resultEntity.setUrl(url);
            resultEntity.setResult(result);
            resultEntityList.add(resultEntity);
        }
        String info = getInfo();
        LOG.info(info + " results=\n{}", resultEntityList);
        return ResponseEntity.ok().body(resultEntityList);
    }
	......
}
```

通过传入的服务实例的列表，然后根据服务实例的信息拼接调用的 URL。拼接地址为：

```java
String url = "http://" + host + ":" + port + UrlUtil.formatContextPath(contextPath) + getSuffixPath();
```

也就是其实前面都是通过服务实例获取域名、端口以及 `ContextPath`， `getSuffixPath()` 其实就是对应的业务操作。比如版本清除也就是 `VersionClearRestInvoker` 里面 `version/clear- + async(异步)/sync(同步)`。那么这个地址是哪里提供的呢？

其实这个地址是在 `discovery-plugin-admin-center-starter` 这个模块里面进行提供的。不管是`基于Swagger和Rest的规则策略推送` 还是 `基于图形化桌面端和Web端的规则策略推送` 操作其实都是基于 `discovery-console`。 `discovery-console`相当于是一个桥梁的作用。

- 通过 DiscoveryClient来操作注册中心
- 通过 ConfigAdapter 来操作配置中心
- 通过 RestTemplate 来操作服务实例

如果需要界面化操作的时候微服务里面必须引入 `discovery-plugin-admin-center-starter` 这个模块。 `discovery-plugin-admin-center-starter` 里面暴露了以下 `restful`功能接口：

- ConfigEndpoint ：以 /config 开头的 Restful 配置接口
- GitEndpoint：以/git 开的头的 Git Restful 信息接口
- InspectorEndpoint：以/inspector 开头的 Restful 全链路侦测接口
- RouterEndpoint：以/router 开头的 Restful 路由接口
- SentinelCoreEndpoint：以/sentinel-core 开头的 Restful 哨兵核心接口
- SentinelParamEndpoint：以/sentinel-param 开头的 Restful 哨兵参数接口
- StrategyEndpoint：以/strategy 开头的 Restful 策略接口
- VersionEndpoint：以/version 开头的 Restful 版本接口

其中`discovery-console-starter` 里面的 `AbstractRestInvoker` 继承类与 `discovery-plugin-admin-center-starter` 里面的暴露的 XXXEndpoint 的关系是：

AbstractRestInvoker 继承类
XXXEndpoint

ConfigClearRestInvoker
ConfigEndpoint

ConfigUpdateRestInvoker
ConfigEndpoint

SentinelClearRestInvoker
SentinelCoreEndpoint / SentinelParamEndpoint

SentinelUpdateRestInvoker
SentinelCoreEndpoint / SentinelParamEndpoint

VersionClearRestInvoker
VersionEndpoint

VersionUpdateRestInvoker
VersionEndpoint

## 4、Discovery 图形化桌面端

`Discovery` 图形化桌面端其实是通过 java swing 编写的客户端工具，它默认配置的 `discovery-console` 地址是在 `desktop/src/main/resource/config/console.properties` 里面的值是 `url=http://localhost:6001/` 。当然你也可以在登陆界面进行自定义。

这个工程其实挺简单的。这里面需要提的就是以下两点：

- 启动类是 com.nepxion.discovery.console.desktop.ConsoleLauncher.
- Nepxion Discovery 基于 ConsoleController 把桌面应用程序与 discovery-console 里面提供的服务进行结合
