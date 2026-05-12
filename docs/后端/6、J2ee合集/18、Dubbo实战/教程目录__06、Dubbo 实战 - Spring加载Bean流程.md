# 06、Dubbo 实战 - Spring加载Bean流程
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/4/6.html
- 分类：J2EE框架
- 分组：教程目录
根据上一小节对于spring扩展schema的介绍，大概可以猜到dubbo中相关的内容是如何实现的。

Dubbo 中定义的dubbo-provider.xml：

```java
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:context="http://www.springframework.org/schema/context"
    xmlns:dubbo="http://code.alibabatech.com/schema/dubbo"
    xsi:schemaLocation="http://www.springframework.org/schema/beans
        http://www.springframework.org/schema/beans/spring-beans-4.3.xsd
        http://www.springframework.org/schema/context
        http://www.springframework.org/schema/context/spring-context-4.3.xsd
        http://code.alibabatech.com/schema/dubbo 
        http://code.alibabatech.com/schema/dubbo/dubbo.xsd">
    <!-- 自动检测并装配bean -->
    <context:component-scan base-package="org.warehouse.component.dubbo.provider" />
    <!-- 提供方应用信息，用于计算依赖关系 -->
    <dubbo:application name="provider-of-hello-world-app" />
    <!-- 使用zookeeper注册中心暴露服务地址 -->
    <dubbo:registry protocol="zookeeper" address="192.168.1.103:2181" />
    <!-- 用dubbo协议在20880端口暴露服务 -->
    <dubbo:protocol name="dubbo" port="20880" />
    <!-- 声明需要暴露的服务接口 -->
    <dubbo:service interface="org.warehouse.component.dubbo.facade.DemoFacade" ref="demoFacadeImpl" />
</beans>
```

对应的自定义schema文件，对应的handler配置，可以在dubbo-{version}.jar 中 META-INF目录下找到。

spring.handlers文件：

```java
http\://code.alibabatech.com/schema/dubbo=com.alibaba.dubbo.config.spring.schema.DubboNamespaceHandler
```

可以看到，对应的handler是 DubboNamespaceHandler。对应的源码如下：

```java
/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.alibaba.dubbo.config.spring.schema;
import com.alibaba.dubbo.common.Version;
import com.alibaba.dubbo.config.*;
import com.alibaba.dubbo.config.spring.ReferenceBean;
import com.alibaba.dubbo.config.spring.ServiceBean;
import org.springframework.beans.factory.xml.NamespaceHandlerSupport;
/**
 * DubboNamespaceHandler
 *
 * @export
 */
public class DubboNamespaceHandler extends NamespaceHandlerSupport {
    static {
        Version.checkDuplicate(DubboNamespaceHandler.class);
    }
    public void init() {
        registerBeanDefinitionParser("application", new DubboBeanDefinitionParser(ApplicationConfig.class, true));
        registerBeanDefinitionParser("module", new DubboBeanDefinitionParser(ModuleConfig.class, true));
        registerBeanDefinitionParser("registry", new DubboBeanDefinitionParser(RegistryConfig.class, true));
        registerBeanDefinitionParser("monitor", new DubboBeanDefinitionParser(MonitorConfig.class, true));
        registerBeanDefinitionParser("provider", new DubboBeanDefinitionParser(ProviderConfig.class, true));
        registerBeanDefinitionParser("consumer", new DubboBeanDefinitionParser(ConsumerConfig.class, true));
        registerBeanDefinitionParser("protocol", new DubboBeanDefinitionParser(ProtocolConfig.class, true));
        registerBeanDefinitionParser("service", new DubboBeanDefinitionParser(ServiceBean.class, true));
        registerBeanDefinitionParser("reference", new DubboBeanDefinitionParser(ReferenceBean.class, false));
        registerBeanDefinitionParser("annotation", new AnnotationBeanDefinitionParser());
    }
}
```

从这里也可以看到，支持的标签其实不多。所有的Parser都封装到了DubboBeanDefinitionParser中。对应的class，就是传入的beanClass。比如application的就是ApplicationConfig。module的就是ModuleConfig。经过Parser的转换，dubbo-provider.xml大概可以变成如下的样子：

```java
<bean id="provider-of-hello-world-app" class="com.alibaba.dubbo.config.ApplicationConfig"/>
<bean id="registryConfig" class="com.alibaba.dubbo.config.RegistryConfig">
    <property name="address" value="10.125.195.174:2181"/>
    <property name="protocol" value="zookeeper"/>
</bean> 
<bean id="dubbo" class="com.alibaba.dubbo.config.ProtocolConfig"> 
    <property name="port" value="20880"/> 
</bean> 
<bean id="org.warehouse.component.dubbo.facade.DemoFacade" class="com.alibaba.dubbo.config.spring.ServiceBean">
    <property name="interface" value="org.warehouse.component.dubbo.facade.DemoFacade"/>
    <property name="ref" ref="demoFacadeImpl"/>
</bean>
```

Spring生成bean的过程主要是把这些属性都梳理清楚，生成对应的类。

### ServiceBean暴露服务

Spring加载dubbo-provider.xml，通过DubboBeanDefinitionParser解析ServiceBean后会将xml定义的服务暴露到zookeeper。从代码分析ServiceBean中export过程（暴露服务）是在如下过程触发的：

```java
    public void onApplicationEvent(ContextRefreshedEvent event) {
        if (isDelay() && !isExported() && !isUnexported()) {
            if (logger.isInfoEnabled()) {
                logger.info("The service ready on spring started. service: " + getInterface());
            }
            export();
        }
    }
```

onApplicationEvent方法定义在Spring的org.springframework.context.ApplicationListener接口中，该接口通过继承java.util.EventListener接口实现了观察者模式。

从debug的结果上看，onApplicationEvent是由org.springframework.context.support.AbstractApplicationContext中的方法触发：

```java
/**
     * Publish the given event to all listeners.
     * @param event the event to publish (may be an {@link ApplicationEvent}
     * or a payload object to be turned into a {@link PayloadApplicationEvent})
     * @param eventType the resolved event type, if known
     * @since 4.2
     */
    protected void publishEvent(Object event, @Nullable ResolvableType eventType) {
        Assert.notNull(event, "Event must not be null");
        if (logger.isTraceEnabled()) {
            logger.trace("Publishing event in " + getDisplayName() + ": " + event);
        }
        // Decorate event as an ApplicationEvent if necessary
        ApplicationEvent applicationEvent;
        if (event instanceof ApplicationEvent) {
            applicationEvent = (ApplicationEvent) event;
        }
        else {
            applicationEvent = new PayloadApplicationEvent<>(this, event);
            if (eventType == null) {
                eventType = ((PayloadApplicationEvent) applicationEvent).getResolvableType();
            }
        }
        // Multicast right now if possible - or lazily once the multicaster is initialized
        if (this.earlyApplicationEvents != null) {
            this.earlyApplicationEvents.add(applicationEvent);
        }
        else {
            getApplicationEventMulticaster().multicastEvent(applicationEvent, eventType);
        }
        // Publish event via parent context as well...
        if (this.parent != null) {
            if (this.parent instanceof AbstractApplicationContext) {
                ((AbstractApplicationContext) this.parent).publishEvent(event, eventType);
            }
            else {
                this.parent.publishEvent(event);
            }
        }
    }
```

publishEvent方法是在org.springframework.context.support.AbstractApplicationContext的finishRefresh方法中调用：

```java
/**
     * Finish the refresh of this context, invoking the LifecycleProcessor's
     * onRefresh() method and publishing the
     * {@link org.springframework.context.event.ContextRefreshedEvent}.
     */
    protected void finishRefresh() {
        // Clear context-level resource caches (such as ASM metadata from scanning).
        clearResourceCaches();
        // Initialize lifecycle processor for this context.
        initLifecycleProcessor();
        // Propagate refresh to lifecycle processor first.
        getLifecycleProcessor().onRefresh();
        // Publish the final event.
        publishEvent(new ContextRefreshedEvent(this));
        // Participate in LiveBeansView MBean, if active.
        LiveBeansView.registerApplicationContext(this);
    }
```

finishRefresh方法在org.springframework.context.support.AbstractApplicationContext的refresh方法中调用：

```java
@Override
    public void refresh() throws BeansException, IllegalStateException {
        synchronized (this.startupShutdownMonitor) {
            // Prepare this context for refreshing.
            prepareRefresh();
            // Tell the subclass to refresh the internal bean factory.
            ConfigurableListableBeanFactory beanFactory = obtainFreshBeanFactory();
            // Prepare the bean factory for use in this context.
            prepareBeanFactory(beanFactory);
            try {
                // Allows post-processing of the bean factory in context subclasses.
                postProcessBeanFactory(beanFactory);
                // Invoke factory processors registered as beans in the context.
                invokeBeanFactoryPostProcessors(beanFactory);
                // Register bean processors that intercept bean creation.
                registerBeanPostProcessors(beanFactory);
                // Initialize message source for this context.
                initMessageSource();
                // Initialize event multicaster for this context.
                initApplicationEventMulticaster();
                // Initialize other special beans in specific context subclasses.
                onRefresh();
                // Check for listener beans and register them.
                registerListeners();
                // Instantiate all remaining (non-lazy-init) singletons.
                finishBeanFactoryInitialization(beanFactory);
                // Last step: publish corresponding event.
                finishRefresh();
            }
            catch (BeansException ex) {
                if (logger.isWarnEnabled()) {
                    logger.warn("Exception encountered during context initialization - " +
                            "cancelling refresh attempt: " + ex);
                }
                // Destroy already created singletons to avoid dangling resources.
                destroyBeans();
                // Reset 'active' flag.
                cancelRefresh(ex);
                // Propagate exception to caller.
                throw ex;
            }
            finally {
                // Reset common introspection caches in Spring's core, since we
                // might not ever need metadata for singleton beans anymore...
                resetCommonCaches();
            }
        }
    }
```

而refresh方法就有AbstractApplicationContext的具体子类调用了，这里就不再进行分析，感兴趣的读者可以自行debug跟踪。
