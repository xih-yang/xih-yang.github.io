# 13、Quartz 实战 - spirng4和quartz2实现动态任务调用
- 来源：https://ddkk.com/zhuanlan/job/quartz/4/13.html
- 分类：作业调度
- 分组：教程目录
pom.xml

```java
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/maven-v4_0_0.xsd">
	<modelVersion>4.0.0</modelVersion>
	<groupId>cn.zto.quartz</groupId>
	<artifactId>JobManager</artifactId>
	<packaging>war</packaging>
	<version>0.0.1-SNAPSHOT</version>
	<name>JobManager Maven Webapp</name>
	<url>http://maven.apache.org</url>
	<properties>
		<annotation-version>1.2</annotation-version>
		<springframework-version>4.0.6.RELEASE</springframework-version>
	</properties>
	<dependencies>
		<dependency>
			<groupId>junit</groupId>
			<artifactId>junit</artifactId>
			<version>4.11</version>
			<scope>test</scope>
		</dependency>
		<dependency>
			<groupId>javax.annotation</groupId>
			<artifactId>javax.annotation-api</artifactId>
			<version>${annotation-version}</version>
			<scope>provided</scope>
		</dependency>
		<dependency>
			<groupId>commons-fileupload</groupId>
			<artifactId>commons-fileupload</artifactId>
			<version>1.2.2</version>
		</dependency>
		<!-- spring -->
		<dependency>
			<groupId>org.springframework</groupId>
			<artifactId>spring-context</artifactId>
			<version>${springframework-version}</version>
		</dependency>
		<dependency>
			<groupId>org.springframework</groupId>
			<artifactId>spring-context-support</artifactId>
			<version>${springframework-version}</version>
		</dependency>
		<dependency>
			<groupId>org.springframework</groupId>
			<artifactId>spring-web</artifactId>
			<version>${springframework-version}</version>
		</dependency>
		<dependency>
			<groupId>org.springframework</groupId>
			<artifactId>spring-tx</artifactId>
			<version>${springframework-version}</version>
		</dependency>
		<dependency>
			<groupId>org.springframework</groupId>
			<artifactId>spring-test</artifactId>
			<version>${springframework-version}</version>
		</dependency>
		<dependency>
			<groupId>org.springframework</groupId>
			<artifactId>spring-beans</artifactId>
			<version>${springframework-version}</version>
		</dependency>
		<dependency>
			<groupId>org.springframework</groupId>
			<artifactId>spring-jdbc</artifactId>
			<version>${springframework-version}</version>
		</dependency>
		<dependency>
			<groupId>org.springframework</groupId>
			<artifactId>spring-jdbc</artifactId>
			<version>${springframework-version}</version>
		</dependency>
		<dependency>
			<groupId>org.springframework</groupId>
			<artifactId>spring-webmvc</artifactId>
			<version>${springframework-version}</version>
		</dependency>
		<dependency>
			<groupId>org.springframework</groupId>
			<artifactId>spring-orm</artifactId>
			<version>${springframework-version}</version>
		</dependency>
		<!-- quartz -->
		<dependency>
			<groupId>org.quartz-scheduler</groupId>
			<artifactId>quartz</artifactId>
			<version>2.2.1</version>
		</dependency>
		<dependency>
			<groupId>org.quartz-scheduler</groupId>
			<artifactId>quartz-jobs</artifactId>
			<version>2.2.1</version>
		</dependency>
		<!-- jstl -->
		<dependency>
			<groupId>jstl</groupId>
			<artifactId>jstl</artifactId>
			<version>1.2</version>
		</dependency>
		<dependency>
			<groupId>taglibs</groupId>
			<artifactId>standard</artifactId>
			<version>1.1.2</version>
		</dependency>
		<!-- servlet -->
		<dependency>
			<groupId>javax.servlet</groupId>
			<artifactId>servlet-api</artifactId>
			<version>2.4</version>
			<scope>provided</scope>
		</dependency>
		<dependency>
			<groupId>javax.servlet.jsp</groupId>
			<artifactId>jsp-api</artifactId>
			<version>2.0</version>
			<scope>provided</scope>
		</dependency>
		<!-- log4j -->
		<dependency>
			<groupId>log4j</groupId>
			<artifactId>log4j</artifactId>
			<version>1.2.17</version>
		</dependency>
		<!-- fastJson -->
		<dependency>
			<groupId>com.alibaba</groupId>
			<artifactId>fastjson</artifactId>
			<version>1.1.41</version>
		</dependency>
		<!-- jackson -->
		<dependency>
			<groupId>org.codehaus.jackson</groupId>
			<artifactId>jackson-mapper-asl</artifactId>
			<version>1.9.11</version>
		</dependency>
		<!-- druid -->
		<dependency>
			<groupId>com.alibaba</groupId>
			<artifactId>druid</artifactId>
			<version>1.0.7</version>
		</dependency>
		<!-- aspectjweaver -->
		<dependency>
			<groupId>org.aspectj</groupId>
			<artifactId>aspectjweaver</artifactId>
			<version>1.8.1</version>
		</dependency>
		<!-- mybatis -->
		<dependency>
			<groupId>org.mybatis</groupId>
			<artifactId>mybatis</artifactId>
			<version>3.2.7</version>
		</dependency>
		<dependency>
			<groupId>org.mybatis</groupId>
			<artifactId>mybatis-spring</artifactId>
			<version>1.2.2</version>
		</dependency>
		<dependency>
			<groupId>com.mysql.jdbc</groupId>
			<artifactId>mysql-connector-java</artifactId>
			<version>5.1.24-bin</version>
		</dependency>
		<dependency>
			<groupId>org.apache.maven.plugins</groupId>
			<artifactId>maven-resources-plugin</artifactId>
			<version>2.5</version>
		</dependency>
	</dependencies>
	<build>
		<finalName>JobManager</finalName>
		<plugins>
			<plugin>
				<groupId>org.apache.maven.plugins</groupId>
				<artifactId>maven-resources-plugin</artifactId>
				<configuration>
					<encoding>UTF-8</encoding>
				</configuration>
			</plugin>
			<plugin>
				<artifactId>maven-compiler-plugin</artifactId>
				<configuration>
					<encoding>UTF-8</encoding>
				</configuration>
			</plugin>
		</plugins>
	</build>
</project>
```

quartz.properties 和实例12是一样的

applicationContext.xml

```java
<?xml version="1.0" encoding="UTF-8" ?>
<beans xmlns="http://www.springframework.org/schema/beans"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:p="http://www.springframework.org/schema/p"
	xmlns:tx="http://www.springframework.org/schema/tx" xmlns:aop="http://www.springframework.org/schema/aop"
	xmlns:context="http://www.springframework.org/schema/context"
	xmlns:task="http://www.springframework.org/schema/task"
	xsi:schemaLocation="
            http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans-4.0.xsd
            http://www.springframework.org/schema/aop http://www.springframework.org/schema/aop/spring-aop-4.0.xsd
            http://www.springframework.org/schema/tx http://www.springframework.org/schema/tx/spring-tx-4.0.xsd
			http://www.springframework.org/schema/context
           	http://www.springframework.org/schema/context/spring-context-4.0.xsd
           	http://www.springframework.org/schema/task
			http://www.springframework.org/schema/task/spring-task-4.0.xsd">
	<context:annotation-config />
	<!-- 自动扫描(自动注入) -->
	<context:component-scan base-package="cn.zto" />
	<bean id="DataSource" class="com.alibaba.druid.pool.DruidDataSource" init-method="init" destroy-method="close">
		<property name="url" value="jdbc:mysql:///quartz" />
		<property name="username" value="root" />
		<property name="password" value="123456" />
		<!-- 连接池最大使用连接数量 -->
		<property name="maxActive" value="5" />
		<!-- 初始化大小 -->
		<property name="initialSize" value="1" />
		<!-- 获取连接最大等待时间 -->
		<property name="maxWait" value="60000" />
		<!-- 连接池最小空闲 -->
		<property name="minIdle" value="2" />
		<!-- 逐出连接的检测时间间隔 -->
		<property name="timeBetweenEvictionRunsMillis" value="3000" />
		<!-- 最小逐出时间 -->
		<property name="minEvictableIdleTimeMillis" value="300000" />
		<!-- 测试有效用的SQL Query -->
		<property name="validationQuery" value="SELECT 'x'" />
		<!-- 连接空闲时测试是否有效 -->
		<property name="testWhileIdle" value="true" />
		<!-- 获取连接时测试是否有效 -->
		<property name="testOnBorrow" value="false" />
		<!-- 归还连接时是否测试有效 -->
		<property name="testOnReturn" value="false" />
	</bean>
	<!-- 声明工厂 -->
	<bean id="scheduler" autowire="no" class="org.springframework.scheduling.quartz.SchedulerFactoryBean">
		<property name="schedulerName" value="TestScheduler1"/>
		<property name="dataSource" ref="DataSource" />
		<property name="configLocation" value="classpath:quartz.properties" />
		<!--applicationContextSchedulerContextKey： 
		是org.springframework.scheduling.quartz.SchedulerFactoryBean这个类中
		把spring上下 文以key/value的方式存放在了quartz的上下文中了，
		可以用applicationContextSchedulerContextKey所定义的key得到对应的spring上下文-->  
		<property name="applicationContextSchedulerContextKey" value="applicationContextKey"/>     
	</bean>
</beans>
```

spring-mvc.xml

```java
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans" xmlns:mvc="http://www.springframework.org/schema/mvc" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:p="http://www.springframework.org/schema/p" xmlns:context="http://www.springframework.org/schema/context" xsi:schemaLocation="http://www.springframework.org/schema/beans 
http://www.springframework.org/schema/beans/spring-beans-3.0.xsd 
http://www.springframework.org/schema/context 
http://www.springframework.org/schema/context/spring-context-3.0.xsd 
http://www.springframework.org/schema/mvc 
http://www.springframework.org/schema/mvc/spring-mvc-3.0.xsd">
	<!-- 自动扫描controller包下的所有类，使其认为spring mvc的控制器 -->
	<context:component-scan base-package="cn.zto.controller" />
	<!-- 避免IE执行AJAX时,返回JSON出现下载文件 -->
	<bean id="mappingJacksonHttpMessageConverter" class="org.springframework.http.converter.json.MappingJacksonHttpMessageConverter">
		<property name="supportedMediaTypes">
			<list>
				<value>text/html;charset=UTF-8</value>
			</list>
		</property>
	</bean>
	<!-- 启动Spring MVC的注解功能，完成请求和注解POJO的映射 -->
	<bean class="org.springframework.web.servlet.mvc.annotation.AnnotationMethodHandlerAdapter">
		<property name="messageConverters">
			<list>
				<ref bean="mappingJacksonHttpMessageConverter" /><!-- json转换器 -->
			</list>
		</property>
	</bean>
	<!-- 对模型视图名称的解析，即在模型视图名称添加前后缀 -->
	<bean class="org.springframework.web.servlet.view.InternalResourceViewResolver" p:prefix="/" p:suffix=".jsp" />
	<bean id="multipartResolver" class="org.springframework.web.multipart.commons.CommonsMultipartResolver">
		<property name="defaultEncoding">
			<value>UTF-8</value>
		</property>
		<property name="maxUploadSize">
			<value>32505856</value><!-- 上传文件大小限制为31M，31*1024*1024 -->
		</property>
		<property name="maxInMemorySize">
			<value>4096</value>
		</property>
	</bean>
</beans>
```

SchedulerController.java

```java
package cn.zto.controller;
import java.util.List;
import javax.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import cn.zto.service.JobService;
import cn.zto.vo.PageTrigger;
@Controller
public class SchedulerController {
	private boolean init = false;
	@Autowired
	private JobService jobService;
	@RequestMapping("/show")
	public String show(HttpServletRequest request){
		if (!init) {
			jobService.stopScheduler();
		}
		getTriggers(request);
		return "show";
	}
	@RequestMapping("/{name}/{group}/stop")
	public String stop(@PathVariable String name,@PathVariable String group){
		jobService.stopJob(name, group);
		return "redirect:/show";
	}
	@RequestMapping("/{name}/{group}/del")
	public String del(@PathVariable String name, @PathVariable String group){
		jobService.delJob(name, group);
		return "redirect:/show";
	}
	@RequestMapping("/{name}/{group}/{cron}/modify")
	public String modify(@PathVariable String name, @PathVariable String group ,@PathVariable String cron){
		jobService.modifyTrigger(name, group, cron);
		return "redirect:/show";
	}
	@RequestMapping("/{name}/{group}/startNow")
	public String stratNow(@PathVariable String name, @PathVariable String group){
		jobService.startNowJob(name, group);
		return "redirect:/show";
	}
	@RequestMapping("/{name}/{group}/resume")
	public String resume(@PathVariable String name, @PathVariable String group){
		jobService.restartJob(name, group);
		return "redirect:/show";
	}
	public void getTriggers(HttpServletRequest request){
		List<PageTrigger> triggers = jobService.getTriggersInfo();
		System.out.println(triggers.size());
		request.setAttribute("triggers", triggers);
	}
}
```

不知道为什么Quartz会随着容器的启动 自动启动所有这里手动的将它暂停

JobService.java

```java
package cn.zto.service;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import org.quartz.CronScheduleBuilder;
import org.quartz.CronTrigger;
import org.quartz.JobBuilder;
import org.quartz.JobDetail;
import org.quartz.JobKey;
import org.quartz.Scheduler;
import org.quartz.SchedulerException;
import org.quartz.SimpleTrigger;
import org.quartz.Trigger;
import org.quartz.TriggerBuilder;
import org.quartz.TriggerKey;
import org.quartz.impl.matchers.GroupMatcher;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import cn.zto.vo.PageTrigger;
@Repository("jobService")
public class JobService {
	@Autowired
	private Scheduler scheduler;
	public List<JobDetail> getJobs(){
		try {
			GroupMatcher<JobKey> matcher = GroupMatcher.anyJobGroup();
			Set<JobKey> jobKeys = scheduler.getJobKeys(matcher);
			List<JobDetail> jobDetails = new ArrayList<JobDetail>();
			for (JobKey key : jobKeys) {
				jobDetails.add(scheduler.getJobDetail(key));
			}
			return jobDetails;
		} catch (SchedulerException e) {
			e.printStackTrace();
		}
		 return null;
	}
	//获取所有的触发器
	public List<PageTrigger> getTriggersInfo(){
		try {
			GroupMatcher<TriggerKey> matcher = GroupMatcher.anyTriggerGroup();
			Set<TriggerKey> Keys = scheduler.getTriggerKeys(matcher);
			List<PageTrigger> triggers = new ArrayList<PageTrigger>();
			for (TriggerKey key : Keys) {
				Trigger trigger = scheduler.getTrigger(key);
				PageTrigger pageTrigger = new PageTrigger();
				pageTrigger.setName(trigger.getJobKey().getName());
				pageTrigger.setGroup(trigger.getJobKey().getGroup());
				pageTrigger.setStatus(scheduler.getTriggerState(key)+"");
				if (trigger instanceof SimpleTrigger) {
					SimpleTrigger simple = (SimpleTrigger) trigger;
					pageTrigger.setExpression("重复次数:"+ (simple.getRepeatCount() == -1 ? 
							"无限" : simple.getRepeatCount()) +",重复间隔:"+(simple.getRepeatInterval()/1000L));
					pageTrigger.setDesc(simple.getDescription());
				}
				if (trigger instanceof CronTrigger) {
					CronTrigger cron = (CronTrigger) trigger;
					pageTrigger.setExpression(cron.getCronExpression());
					pageTrigger.setDesc(cron.getDescription());
				}
				triggers.add(pageTrigger);
			}
			return triggers;
		} catch (SchedulerException e) {
			e.printStackTrace();
		}
		return null;
	}
	//暂停任务
	public void stopJob(String name, String group){
		JobKey key = new JobKey(name, group);
		try {
			scheduler.pauseJob(key);
		} catch (SchedulerException e) {
			e.printStackTrace();
		}
	}
	//恢复任务
	public void restartJob(String name, String group){
		JobKey key = new JobKey(name,group);
		try {
			scheduler.resumeJob(key);
		} catch (SchedulerException e) {
			e.printStackTrace();
		}
	}
	//立马执行一次任务
	public void startNowJob(String name, String group){
		try {
			JobKey key = new JobKey(name, group);
			JobDetail job = JobBuilder.newJob(
						scheduler.getJobDetail(key).getJobClass())
					.storeDurably()
					.build();
			scheduler.addJob(job, false);
			scheduler.triggerJob(job.getKey());
		} catch (SchedulerException e) {
			e.printStackTrace();
		}
	}
	//删除任务
	public void delJob(String name, String group){
		JobKey key = new JobKey(name,group);
		try {
			scheduler.deleteJob(key);
		} catch (SchedulerException e) {
			e.printStackTrace();
		}
	}
	//修改触发器时间
	public void modifyTrigger(String name,String group,String cron){
		try {
			TriggerKey key = TriggerKey.triggerKey(name, group);
			Trigger trigger = scheduler.getTrigger(key);
			CronTrigger newTrigger = (CronTrigger) TriggerBuilder.newTrigger()
					.withIdentity(key)
					.withSchedule(CronScheduleBuilder.cronSchedule(cron))
					.build();
			scheduler.rescheduleJob(key, newTrigger);
		} catch (SchedulerException e) {
			e.printStackTrace();
		}
	}
	//暂停调度器
	public void stopScheduler(){
		 try {
			if (!scheduler.isInStandbyMode()) {
				scheduler.standby();
			}
		} catch (SchedulerException e) {
			e.printStackTrace();
		}
	}
}
```

PageTrigger.java

```java
package cn.zto.vo;
import java.io.Serializable;
public class PageTrigger implements Serializable{
	private String name;
	private String group;
	private String expression;
	private String status;
	private String desc;
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public String getGroup() {
		return group;
	}
	public void setGroup(String group) {
		this.group = group;
	}
	public String getExpression() {
		return expression;
	}
	public void setExpression(String expression) {
		this.expression = expression;
	}
	public String getStatus() {
		return status;
	}
	public void setStatus(String status) {
		this.status = status;
	}
	public String getDesc() {
		return desc;
	}
	public void setDesc(String desc) {
		this.desc = desc;
	}
}
```

SimpleJob.java 和实例12是一样的

web.xml

```java
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://java.sun.com/xml/ns/javaee" xmlns:web="http://java.sun.com/xml/ns/javaee/web-app_2_5.xsd" xsi:schemaLocation="http://java.sun.com/xml/ns/javaee http://java.sun.com/xml/ns/javaee/web-app_3_0.xsd" id="WebApp_ID" version="3.0">
	<display-name>mybatis</display-name>
	<context-param>
		<param-name>contextConfigLocation</param-name>
		<param-value>classpath:applicationContext.xml</param-value>
	</context-param>
	<filter>
		<description>字符集过滤器</description>
		<filter-name>encodingFilter</filter-name>
		<filter-class>org.springframework.web.filter.CharacterEncodingFilter</filter-class>
		<init-param>
			<description>字符集编码</description>
			<param-name>encoding</param-name>
			<param-value>UTF-8</param-value>
		</init-param>
	</filter>
	<filter-mapping>
		<filter-name>encodingFilter</filter-name>
		<url-pattern>/*</url-pattern>
	</filter-mapping>
	<listener>
		<description>spring监听器</description>
		<listener-class>org.springframework.web.context.ContextLoaderListener</listener-class>
	</listener>
	<!-- 防止spring内存溢出监听器 -->
	<listener>
		<listener-class>org.springframework.web.util.IntrospectorCleanupListener</listener-class>
	</listener>
	<!-- spring mvc servlet -->
	<servlet>
		<description>spring mvc servlet</description>
		<servlet-name>springmvc</servlet-name>
		<servlet-class>org.springframework.web.servlet.DispatcherServlet</servlet-class>
		<init-param>
			<param-name>contextConfigLocation</param-name>
			<param-value>classpath:spring-mvc.xml</param-value>
		</init-param>
		<load-on-startup>1</load-on-startup>
	</servlet>
	<servlet-mapping>
		<servlet-name>springmvc</servlet-name>
		<url-pattern>/</url-pattern>
	</servlet-mapping>
	<welcome-file-list>
		<welcome-file>/index.jsp</welcome-file>
	</welcome-file-list>
	<!-- 配置session超时时间，单位分钟 -->
	<session-config>
		<session-timeout>15</session-timeout>
	</session-config>
</web-app>
```

show.jsp

```java
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>Insert title here</title>
</head>
<body>
<table>
	<thead>
		<td>任务名</td>
		<td>任务组</td>
		<td>时间表达式</td>
		<td>状态</td>
		<td>备注</td>
		<td>操作</td>
	</thead>
	<tbody>
		<c:forEach  var="trigger" items="${triggers }">
		<tr>
			<td>${trigger.name }</td>
			<td>${trigger.group }</td>
			<td>${trigger.expression }</td>
			<td>${trigger.status }</td>
			<td>${trigger.desc }</td>
			<td>
				<a href="${trigger.name }/${trigger.group }/stop">暂停</a>
				<a href="${trigger.name }/${trigger.group }/resume">恢复</a>
				<a href="${trigger.name }/${trigger.group }/del">删除</a>
				<a href="modify">修改表达式</a>
				<a href="${trigger.name }/${trigger.group }/startNow">立即运行一次</a>
			</td>
		</tr>
		</c:forEach>
	</tbody>
</table>
</body>
</html>
```

这里就不写修改表达式了

运行效果

trigger各状态说明：

None：Trigger已经完成，且不会在执行，或者找不到该触发器，或者Trigger已经被删除

NORMAL:正常状态

PAUSED：暂停状态

COMPLETE：触发器完成，但是任务可能还正在执行中

BLOCKED：线程阻塞状态

ERROR：出现错误

项目地址: [jobManage](https://github.com/hubigsea/JobMonage)
