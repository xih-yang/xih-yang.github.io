# 14、Quartz 实战 - 让Quartz的Job使用Spring注入的Bean
- 来源：https://ddkk.com/zhuanlan/job/quartz/4/14.html
- 分类：作业调度
- 分组：教程目录
```java
<!-- 由spring生成scheduler -->
<bean id="scheduler" class="org.springframework.scheduling.quartz.SchedulerFactoryBean">
    <!--<property name="jobFactory">
        <bean class="cn.zto.job.JobBeanJobFactory"/>
    </property>-->
    <property name="schedulerName" value="scheduler"/>
    <property name="configLocation" value="classpath:cn/zto/quartz/quartz.properties" />
</bean>
```

由于将Scheduler交给Spring生成， SchedulerFactoryBean有个jobFactory属性 而且jobFactory是实现SchedulerContextAware的类还要继承AdaptableJobFactory

jobFactorySet是个默认为false的boolean类型的

在Spirng-context-support jar包下org.springframework.scheduling.quartz包中有个SpringBeanJobFactory的类继承了AdaptableJobFactory实现AdaptableJobFactory

spring会默认使用这个给jobFactory

我们可以继承SpringBeanJobFactory重写他的createJobInstance方法

当Spring在加载配置文件时，如果配置文件中有Bean实现了ApplicationContextAware接口时

Spring会自动调用setApplicationContext方法

我们可以通过这个获取Spring上下文然后在创建Job时让Job自动注入到Spring容器中

JobBeanJobFactory.class

```java
package cn.zto.job;
import org.quartz.spi.TriggerFiredBundle;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.scheduling.quartz.SpringBeanJobFactory;
public class JobBeanJobFactory extends SpringBeanJobFactory implements ApplicationContextAware {
	private ApplicationContext applicationContext;
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        this.applicationContext = applicationContext;
    }
    @Override
    protected Object createJobInstance(TriggerFiredBundle bundle) throws Exception {
        Object jobInstance = super.createJobInstance(bundle);
        //把Job交给Spring来管理，这样Job就能使用由Spring产生的Bean了
        applicationContext.getAutowireCapableBeanFactory().autowireBean(jobInstance);
        return jobInstance;
    }
}
```

xml配置

```java
	<!-- 由spring生成scheduler -->
	<bean id="scheduler" class="org.springframework.scheduling.quartz.SchedulerFactoryBean">
		<property name="jobFactory">
			<bean class="cn.zto.job.JobBeanJobFactory"/>
		</property>
		<property name="schedulerName" value="scheduler"/>
		<property name="configLocation" value="classpath:cn/zto/quartz/quartz.properties" />
	</bean>
```

还可以使用Spring的AOP机制

详情的话可以查看这个地址

[http://sulong.me/2011/09/05/inject_dependency_to_domain_by_spring](http://sulong.me/2011/09/05/inject_dependency_to_domain_by_spring)
