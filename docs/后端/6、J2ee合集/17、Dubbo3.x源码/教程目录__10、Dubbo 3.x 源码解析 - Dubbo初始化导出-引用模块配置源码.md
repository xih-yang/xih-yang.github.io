# 10、Dubbo 3.x 源码解析 - Dubbo初始化导出/引用模块配置源码
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/2/10.html
- 分类：J2EE框架
- 分组：教程目录
> 基于Dubbo 3.1，详细介绍了Dubbo初始化导出/引用模块配置的源码。

现在我们来学习，Dubbo配置的加载与覆盖的最后一部分，模块模型的初始化源码。

**实际上，通过模块模型moduleModel的模块发布器DefaultModuleDeployer#initialize方法将会初始化导出/引用模块的服务，即初始化与服务生产者、消费者相关的配置。**

## 1 DefaultModuleDeployer#initialize初始化模块

在DefaultApplicationDeployer#initialize方法中，将会调用initModuleDeployers方法，初始化ModuleDeployer，而在DefaultModuleDeployer# prepare方法中，同样会调用initModuleDeployers方法，该方法主要是初始化与服务生产者、消费者相关的配置。

大概步骤为：

**1、** 调用loadConfigs方法，加载和刷新模型的ProviderConfig、ConsumerConfig、ModuleConfig配置；

**2、** 获取exportAsync、referAsync、background等属性的值；

```java
/**
 * DefaultModuleDeployer的方法
 * <p>
 * 初始化模块模型
 */
@Override
public void initialize() throws IllegalStateException {
    //只初始化一次
    if (initialized) {
        return;
    }
    // Ensure that the initialization is completed when concurrent calls
    //确保在并发调用时完成正常初始化
    synchronized (this) {
        if (initialized) {
            return;
        }
        /*
         * 1 加载模型的配置并且刷新他们
         */
        loadConfigs();
        // read ModuleConfig
        //获取模型配置
        ModuleConfig moduleConfig = moduleModel.getConfigManager().getModule().orElseThrow(() -> new IllegalStateException("Default module config is not initialized"));
        //服务端是否开启导出    
        exportAsync = Boolean.TRUE.equals(moduleConfig.getExportAsync());
        //消费端是否开启异步调用
        referAsync = Boolean.TRUE.equals(moduleConfig.getReferAsync());
        // start in background
        //后台开始启动标
        background = moduleConfig.getBackground();
        if (background == null) {
            // compatible with old usages  与旧用法兼容
            background = isExportBackground() || isReferBackground();
        }
        initialized = true;
        if (logger.isInfoEnabled()) {
            logger.info(getIdentifier() + " has been initialized!");
        }
    }
}
```

##

2loadConfigs加载模型配置

该方法用于获取ModuleConfigManager并基于它加载模型的配置并且刷新。

```java
/**
 * DefaultModuleDeployer的方法
 * 
 * 加载模型的配置并且刷新
 */
private void loadConfigs() {
    // load module configs
    //加载模型配置
    moduleModel.getConfigManager().loadConfigs();
    //刷新全部配置
    moduleModel.getConfigManager().refreshAll();
}
```

### 2.1 ModuleConfigManager#loadConfigs加载模型配置

该方法用于真正加载模型配置，大概步骤为：

**1、** 首先调用loadConfigsOfTypeFromProps方法加载各种指定类型的配置，包括ProviderConfig、ConsumerConfig、ModuleConfig配置；

**2、** 调用checkDefaultAndValidateConfigs方法检查配置：；

**1、** 某些配置不存在但是必须有，就会创建默认配置；

**2、** 通过ConfigValidator.validate方法校验配置，默认实现为DefaultConfigValidator；

```java
/**
 * ModuleConfigManager的方法
 * <p>
 * 加载模型配置
 */
@Override
public void loadConfigs() {
    // load dubbo.providers.xxx
    //加载dubbo服务提供者缺省值配置。同时该配置为 <dubbo:service> 和 <dubbo:protocol> 标签的缺省值设置。
    loadConfigsOfTypeFromProps(ProviderConfig.class);
    // load dubbo.consumers.xxx
    //加载dubbo服务消费者缺省值配置。同时该标签为 <dubbo:reference> 标签的缺省值设置。
    loadConfigsOfTypeFromProps(ConsumerConfig.class);
    // load dubbo.modules.xxx
    //加载dubbo模块信息配置
    loadConfigsOfTypeFromProps(ModuleConfig.class);
    // check configs
    //检查并设置某些字段的默认值
    checkDefaultAndValidateConfigs(ProviderConfig.class);
    checkDefaultAndValidateConfigs(ConsumerConfig.class);
    checkDefaultAndValidateConfigs(ModuleConfig.class);
}
```

### 2.2 ModuleConfigManager#refreshAll刷新模型配置

ModuleConfigManager的refreshAll方法刷新全部应用程序配置，包括ModuleConfig、ProviderConfig、ConsumerConfig、ReferenceConfigBase、ServiceConfigBase的配置。注意此时Reference和Service的配置并没有加载，他们会在后续的步骤中加载。

```java
/**
 * 刷新模型配置
 */
@Override
public void refreshAll() {
    // refresh all configs here
    //刷新ModuleConfig配置
    getModule().ifPresent(ModuleConfig::refresh);
    //刷新ProviderConfig配置
    getProviders().forEach(ProviderConfig::refresh);
    //刷新ConsumerConfig配置
    getConsumers().forEach(ConsumerConfig::refresh);
    //刷新ReferenceConfigBase配置
    getReferences().forEach(ReferenceConfigBase::refresh);
    //刷新ServiceConfigBase配置
    getServices().forEach(ServiceConfigBase::refresh);
}
```
