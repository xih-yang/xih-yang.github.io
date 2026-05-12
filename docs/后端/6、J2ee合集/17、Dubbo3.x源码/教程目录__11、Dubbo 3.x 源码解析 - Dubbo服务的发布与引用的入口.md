# 11、Dubbo 3.x 源码解析 - Dubbo服务的发布与引用的入口
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/2/11.html
- 分类：J2EE框架
- 分组：教程目录
> 基于Dubbo 3.1，详细介绍了Dubbo服务的发布与引用的入口的源码。

在经过一系列的流程加载了Dubbo配置之后，接下来将会进行最重要的一步，也就是Dubbo服务的发布与引用的过程，该过程完毕之后，Dubbo可正式对外提供服务。

那么Dubbo服务的发布与引用的入口在哪里呢？本次我们来学习。

## 1 Dubbo服务的发布与引用的入口

此前我们在Dubbo配置加载的部分学到过一个DubboBeanUtils#registerCommonBeans方法，此前在很多文章中提到的DubboBootstrapApplicationListener实际上在Dubbo3.1版本中是没有出现了，也就是说在最新的Dubbo源码中，基于spring的Dubbo的启动不再是通过DubboBootstrap类引导完成的，实际上是基于DubboDeployApplicationListener和DubboConfigApplicationListener这两个新加入的监听器来实现Dubbo启动的。

**其中DubboDeployApplicationListener可以看作是DubboBootstrapApplicationListener的替代组件，而DubboConfigApplicationListener则用于加载Dubbo配置，DubboConfigApplicationListener的作用我们在Dubbo配置的加载部分已经讲了，现在我们来看看DubboDeployApplicationListener这个监听器的作用，它实际上就是最新版本的Dubbo服务的发布与引用的入口。**

在spring容器启动的最后一个步也就是refresh方法内部最后的finishRefresh方法中，将会向所有监听器发布一个ContextRefreshedEvent事件，表示容器刷新完毕。

**DubboDeployApplicationListener**是一个ApplicationListener的实现，其可以监听ApplicationContextEvent事件，而ContextRefreshedEvent继承自ApplicationContextEvent，因此DubboDeployApplicationListener可以监听到该事件。

**实际上，到这里就很明白了，DubboDeployApplicationListener#onApplicationEvent方法便是真正的Dubbo服务的发布与引用的入口。可以发现，实际上和原来的监听器DubboBootstrapApplicationListener的入口是一样的。**

```java
/**
 * DubboDeployApplicationListener的方法
 * <p>
 * 监听ApplicationContextEvent，启动或者关闭服务
 */
@Override
public void onApplicationEvent(ApplicationContextEvent event) {
    if (nullSafeEquals(applicationContext, event.getSource())) {
        if (event instanceof ContextRefreshedEvent) {
            //容器刷新完毕事件，启动服务
            onContextRefreshedEvent((ContextRefreshedEvent) event);
        } else if (event instanceof ContextClosedEvent) {
            //监听容器关闭事件，关闭服务
            onContextClosedEvent((ContextClosedEvent) event);
        }
    }
}
private void onContextRefreshedEvent(ContextRefreshedEvent event) {
    //获取模块发布器
    ModuleDeployer deployer = moduleModel.getDeployer();
    Assert.notNull(deployer, "Module deployer is null");
    // start module
    //启动模块，启动服务
    Future future = deployer.start();
    // if the module does not start in background, await finish
    //如果模块没有在后台启动，则等待完成
    if (!deployer.isBackground()) {
        try {
            //调用get方法阻塞等待直到完成启动
            future.get();
        } catch (InterruptedException e) {
            logger.warn("Interrupted while waiting for dubbo module start: " + e.getMessage());
        } catch (Exception e) {
            logger.warn("An error occurred while waiting for dubbo module start: " + e.getMessage(), e);
        }
    }
}
```

## 2 start启动模块服务

最终是通过DefaultModuleDeployer#start方法启动服务的。

内部首先调用DefaultApplicationDeployer#initialize方法初始化应用程序发布器，之前学过该方法，只会初始化一次。随后调用startSync方法开始同步启动服务，这是本次学习的重点方法。

```java
/**
 * DefaultModuleDeployer的方法
 * <p>
 * 启动模块服务
 */
@Override
public Future start() throws IllegalStateException {
    // initialize，maybe deadlock applicationDeployer lock & moduleDeployer lock
    //初始化应用程序发布器，之前学过该方法，只会初始化一次
    applicationDeployer.initialize();
    /*
     * 开始同步启动
     */
    return startSync();
}
```

## 3 startSync启动服务

**该方法可以类比此前的DubboBootstrapApplicationListener中的start方法，内部将会先调用exportServices方法进行服务导出，随后调用referServices方法进行服务引用，如果看过此前版本的源码，那么这两个方法大家应该不会陌生吧。**

```java
/**
 * DefaultModuleDeployer的方法
 * <p>
 * 启动模块服务
 */
private synchronized Future startSync() throws IllegalStateException {
    //如果正在停止、已停止、已失败，那么抛出异常
    if (isStopping() || isStopped() || isFailed()) {
        throw new IllegalStateException(getIdentifier() + " is stopping or stopped, can not start again");
    }
    try {
        //如果正在启动或者启动完成，则直接返回
        if (isStarting() || isStarted()) {
            return startFuture;
        }
        //设置发布器的状态为STARTING，即正在发布
        onModuleStarting();
        //初始化模块模型，一般在此前的步骤中就初始化了
        initialize();
        // export services
        /*
         * 1 服务导出
         */
        exportServices();
        // prepare application instance
        // exclude internal module to avoid wait itself
        //先启动内部模块模型
        if (moduleModel != moduleModel.getApplicationModel().getInternalModule()) {
            applicationDeployer.prepareInternalModule();
        }
        // refer services
        /*
         * 2 服务引用
         */
        referServices();
        // if no async export/refer services, just set started
        //如果没有异步的导出/引用服务，只需设置已启动状态即可，默认情况
        if (asyncExportingFutures.isEmpty() && asyncReferringFutures.isEmpty()) {
            /*
             * 3 dubbo模块启动后的处理
             */
            onModuleStarted();
        } else {
            //异步的等待导出/引用服务完成
            frameworkExecutorRepository.getSharedExecutor().submit(() -> {
                try {
                    // wait for export finish
                    waitExportFinish();
                    // wait for refer finish
                    waitReferFinish();
                } catch (Throwable e) {
                    logger.warn("wait for export/refer services occurred an exception", e);
                } finally {
                    //异步回调完成，则设置已启动状态
                    onModuleStarted();
                }
            });
        }
    } catch (Throwable e) {
        onModuleFailed(getIdentifier() + " start failed: " + e, e);
        throw e;
    }
    return startFuture;
}
```

## 4 总结

**本次我们主要学习Dubbo 3.x版本的Dubbo服务的发布与引用的入口，它和此前版的入口还是有些区别的，但是这不是重点，接下来的文章我们将会学习Dubbo3.x的exportServices方法服务导出，referServices方法服务引用的源码，这才是重点！**
