# 14、分布式事务 Seata 教程 - Seata源码分析之全局事务扫描器GlobalTransactionScanner
- 来源：https://ddkk.com/zhuanlan/transaction/5/14.html
- 分类：分布式事务
- 分组：教程目录
### 自动配置类

基于Spring Boot的自动配置功能，可以在`seata-spring-boot-starter`中找到Seata 引入的自动配置类，当开启了`seata.enabled=true`时，将会加载。

扫描器是在`SeataAutoConfiguration`自动配置类中加载注入的：

```java
@ConditionalOnProperty(prefix = SEATA_PREFIX, name = "enabled", havingValue = "true", matchIfMissing = true)
public class SeataAutoConfiguration {
    private static final Logger LOGGER = LoggerFactory.getLogger(SeataAutoConfiguration.class);
    @Bean(BEAN_NAME_FAILURE_HANDLER)
    @ConditionalOnMissingBean(FailureHandler.class)
    public FailureHandler failureHandler() {
        return new DefaultFailureHandlerImpl();
    }
    @Bean
    @DependsOn({
     BEAN_NAME_SPRING_APPLICATION_CONTEXT_PROVIDER, BEAN_NAME_FAILURE_HANDLER})
    @ConditionalOnMissingBean(GlobalTransactionScanner.class)
    public GlobalTransactionScanner globalTransactionScanner(SeataProperties seataProperties, FailureHandler failureHandler) {
        if (LOGGER.isInfoEnabled()) {
            LOGGER.info("Automatically configure Seata");
        }
        // 直接new 全局事务扫描器，传入applicationId、txServiceGroup、失败处理器。
        return new GlobalTransactionScanner(seataProperties.getApplicationId(), seataProperties.getTxServiceGroup(), failureHandler);
    }
}
```

### 全局事务扫描器

`GlobalTransactionScanner`继承并实现了一系列接口，实现了众多功能。

```java
public class GlobalTransactionScanner extends AbstractAutoProxyCreator
    implements ConfigurationChangeListener, InitializingBean, ApplicationContextAware, DisposableBean }
```

#### 1. 初始化客户端

实现了`InitializingBean`接口，该接口为bean提供了初始化方法的方式，它只包括`afterPropertiesSet`方法，凡是继承该接口的类，在初始化bean的时候都会执行该方法。

`GlobalTransactionScanner`实现了`afterPropertiesSet`方法，主要是执行 `initClient()`初始化分布式事务客户端：

```java
    @Override
    public void afterPropertiesSet() {
    	// 查询配置service.disableGlobalTransaction 是否开启当前服务的分布式事务
        if (disableGlobalTransaction) {
            if (LOGGER.isInfoEnabled()) {
                LOGGER.info("Global transaction is disabled.");
            }
            ConfigurationCache.addConfigListener(ConfigurationKeys.DISABLE_GLOBAL_TRANSACTION,
                    (ConfigurationChangeListener)this);
            return;
        }
        // 开启了全局事务，则会初始化客户端
        if (initialized.compareAndSet(false, true)) {
            initClient();
        }
    }
```

在`initClient()`方法中，会初始化TM、RM，使用netty 和Seata 服务端进行通信。

```java
    private void initClient() {
        if (LOGGER.isInfoEnabled()) {
            LOGGER.info("Initializing Global Transaction Clients ... ");
        }
        // 1. 应用ID、事务分组为空则会抛出异常 
        if (StringUtils.isNullOrEmpty(applicationId) || StringUtils.isNullOrEmpty(txServiceGroup)) {
            throw new IllegalArgumentException(String.format("applicationId: %s, txServiceGroup: %s", applicationId, txServiceGroup));
        }
        //init TM
        // 初始化事务管理器TM，打印日志
        TMClient.init(applicationId, txServiceGroup, accessKey, secretKey);
        if (LOGGER.isInfoEnabled()) {
            LOGGER.info("Transaction Manager Client is initialized. applicationId[{}] txServiceGroup[{}]", applicationId, txServiceGroup);
        }
        //init RM
        // 初始化资源管理器RM，打印日志
        RMClient.init(applicationId, txServiceGroup);
        if (LOGGER.isInfoEnabled()) {
            LOGGER.info("Resource Manager is initialized. applicationId[{}] txServiceGroup[{}]", applicationId, txServiceGroup);
        }
        if (LOGGER.isInfoEnabled()) {
            LOGGER.info("Global Transaction Clients are initialized. ");
        }
        // 注册容器关闭时的钩子
        registerSpringShutdownHook();
    }
```

#### 2. 注销

实现了`DisposableBean`接口，该接口负责在Bean生命周期结束前调用`destroy()`方法做一些收尾工作。

`destroy()`负责在应用关闭后，释放相关资源。

```java
    @Override
    public void destroy() {
        ShutdownHook.getInstance().destroyAll();
    }
```

#### 3. AOP 代理

`GlobalTransactionScanner`继承了`AbstractAutoProxyCreator(自动代理创建者)` 抽象类，Spring 通过 `AbstractAutoProxyCreator`在 bean 初始化完成之后创建它的代理AOP 代理，其主要有两个核心方法：

- wrapIfNecessary：代理增强的前置判断处理，表示是否该Bean需要增强，如果增强的话创建代理类
- postProcessAfterInitialization：当一个spring的Bean已经初始化完毕的时候，后置处理一些东西

`GlobalTransactionScanner`中的`wrapIfNecessary（如果需要则进行包装）`方法，主要是对存在全局事务注解的Bean，添加相应的拦截器。

```java
 /**
     * 将扫描以下内容，并添加相应的拦截器
     *
     * 1. TM: @GlobalTransactional注解添加GlobalTransactionalInterceptor（handleGlobalTransaction方法处理）
     * 2. @GlobalLock注解添加GlobalTransactionalInterceptor（handleGlobalLock方法处理）
     * @see io.seata.spring.annotation.GlobalLock // GlobalLock annotation
     * 3. TCC 模式，添加TccActionInterceptor 拦截器
     *  @LocalTCC 
     *  @TwoPhaseBusinessAction 
     *  RemotingParser接口 
     */
    @Override
    protected Object wrapIfNecessary(Object bean, String beanName, Object cacheKey) {
        try {
            synchronized (PROXYED_SET) {
            // 1. 如果已被代理，则跳过该Bean ,PROXYED_SET是一个Set<String> 集合
                if (PROXYED_SET.contains(beanName)) {
                    return bean;
                }
                interceptor = null;
                //check TCC proxy
                //  2. 判断是否开启TCC模式，是则添加TCC 拦截器
                if (TCCBeanParserUtils.isTccAutoProxy(bean, beanName, applicationContext)) {
                    //TCC interceptor, proxy bean of sofa:reference/dubbo:reference, and LocalTCC
                    interceptor = new TccActionInterceptor(TCCBeanParserUtils.getRemotingDesc(beanName));
                    ConfigurationCache.addConfigListener(ConfigurationKeys.DISABLE_GLOBAL_TRANSACTION,
                        (ConfigurationChangeListener)interceptor);
                } else {
                // 3. 查询Bean的 Class 类型
                    Class<?> serviceInterface = SpringProxyUtils.findTargetClass(bean);
                    Class<?>[] interfacesIfJdk = SpringProxyUtils.findInterfaces(bean);
					// 如果类或者方法上没有GlobalTransactional或者GlobalLock 注解，直接返回Bean
                    if (!existsAnnotation(new Class[]{
     serviceInterface})
                        && !existsAnnotation(interfacesIfJdk)) {
                        return bean;
                    }
					// 4. 初始化GlobalTransactionalInterceptor
                    if (globalTransactionalInterceptor == null) {
                        globalTransactionalInterceptor = new GlobalTransactionalInterceptor(failureHandlerHook);
                        ConfigurationCache.addConfigListener(
                            ConfigurationKeys.DISABLE_GLOBAL_TRANSACTION,
                            (ConfigurationChangeListener)globalTransactionalInterceptor);
                    }
                    interceptor = globalTransactionalInterceptor;
                }
                LOGGER.info("Bean[{}] with name [{}] would use interceptor [{}]", bean.getClass().getName(), beanName, interceptor.getClass().getName());
                // 5. 判断是否已经是AOP代理类，不是则走一遍父类的包装
                if (!AopUtils.isAopProxy(bean)) {
                    bean = super.wrapIfNecessary(bean, beanName, cacheKey);
                } else {
                	// 6. 代理对象添加拦截器
                    AdvisedSupport advised = SpringProxyUtils.getAdvisedSupport(bean);
                    Advisor[] advisor = buildAdvisors(beanName, getAdvicesAndAdvisorsForBean(null, null, null));
                    for (Advisor avr : advisor) {
                        advised.addAdvisor(0, avr);
                    }
                }
                // 添加到已处理的集合中，标识该bean已经处理过了
                PROXYED_SET.add(beanName);
                return bean;
            }
        } catch (Exception exx) {
            throw new RuntimeException(exx);
        }
    }
```

#### 总结

**1、** 自动配置类，注入全局事务扫描器`GlobalTransactionScanner`；

**2、**`GlobalTransactionScanner`会初始化TM、RM客户端；

**3、** 扫描`Bean`，添加了全局事务注解的类和方法，添加对应的拦截器；

**4、** 应用关闭，释放相关资源；
