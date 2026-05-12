# 16、SpringBoot 整合 ActiveMQ 完整总结
- 来源：https://ddkk.com/zhuanlan/mq/activemq/1/18.html
- 分类：消息队列
- 分组：教程目录
## 1、SpringBoot简介

**1.1 原有Spring优缺点分析**

### 1.1.1 Spring的优点分析

Spring是Java企业版（Java Enterprise Edition，JEE，也称J2EE）的轻量级代替品。无需开发重量级的Enterprise JavaBean（EJB），Spring为企业级Java开发提供了一种相对简单的方法，通过**依赖注入**和**面向切面编程**，用简单的Java对象（Plain Old Java Object，POJO）实现了EJB的功能。

### 1.1.2 Spring的缺点分析

虽然**Spring的组件代码是轻量级**的，但它的**配置却是重量级**的。一开始，Spring用XML配置，而且是很多XML配置。Spring 2.5引入了基于注解的组件扫描，这消除了大量针对应用程序自身组件的显式XML配置。Spring 3.0引入了基于Java的配置，这是一种类型安全的可重构配置方式，可以代替XML。

所有这些配置都代表了开发时的损耗。因为在思考Spring特性配置和解决业务问题之间需要进行思维切换，所以编写配置挤占了编写应用程序逻辑的时间。和所有框架一样，Spring实用，但与此同时它要求的回报也不少。

除此之外，项目的依赖管理也是一件耗时耗力的事情。在环境搭建时，需要分析要导入哪些库的坐标，而且还需要分析导入与之有依赖关系的其他库的坐标，一旦选错了依赖的版本，随之而来的不兼容问题就会严重阻碍项目的开发进度。

## 1.2 SpringBoot的概述

### 1.2.1 SpringBoot解决上述Spring的缺点

SpringBoot对上述Spring的缺点进行的改善和优化，基于**约定优于配置**的思想，可以让开发人员**不必在配置与逻辑业务之间进行思维的切换**，全身心的投入到逻辑业务的代码编写中，从而大大提高了开发的效率，一定程度上缩短了项目周期。

### 1.2.2 SpringBoot的特点

（1）为基于Spring的开发提供更快的入门体验

（2）** 开箱即用**，没有代码生成，也**无需XML配置**。同时也可以修改默认值来满足特定的需求

（3）提供了一些大型项目中常见的非功能性特性，如嵌入式服务器、安全、指标，健康检测、外部配置等

（4）SpringBoot不是对Spring功能上的增强，而是提供了一种**快速使用Spring的方式**

### 1.2.3 SpringBoot的核心功能

**起步依赖**：起步依赖本质上是一个Maven项目对象模型（Project Object Model，POM），定义了对其他库的传递依赖，这些东西加在一起即支持某项功能。

简单的说，起步依赖就是将**具备某种功能的坐标打包到一起**，并提供一些默认的功能。

**自动配置**：Spring Boot的自动配置是一个运行时（更准确地说，是应用程序启动时）的过程，考虑了众多因素，才决定Spring配置应该用哪个，不该用哪个。该过程是Spring自动完成的。

## 2. SpringBoot快速入门

**2.1 代码实现**

### 2.1.1 创建Maven工程

使用idea工具创建一个maven工程，该工程为普通的java工程即可

### 2.1.2 添加SpringBoot的起步依赖

SpringBoot要求，项目要继承SpringBoot的起步依赖spring-boot-starter-parent

```xml
<!--所有的springboot工程都必须继承spring-boot-starter-parent-->
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>2.0.1.RELEASE</version>
</parent>
```

SpringBoot要集成SpringMVC进行Controller的开发，所以项目要导入web的启动依赖

```xml
<dependencies>
<!--web功能的起步依赖-->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

### 2.1.3 编写SpringBoot引导类

要通过SpringBoot提供的引导类起步SpringBoot才可以进行访问

```java
//声明该类是一个SpringBoot引导类
@SpringBootApplication
public class MySpringBootApplication {
    //main是java程序的入口
    public static void main(String[] args) {
        //run方法 表示运行SpringBoot的引导类  run参数就是SpringBoot引导类的字节码对象
        SpringApplication.run(MySpringBootApplication.class);
    }
}
```

### 2.1.4 编写Controller

在引导类MySpringBootApplication同级包或者子级包中创建QuickStartController

```java
@Controller
public class QuickController {
    @RequestMapping("/quick")
    @ResponseBody
    public String quick(){
        return "nihao springboot";
    }
}
```

### 2.1.5 测试

执行SpringBoot起步类的主方法，控制台打印日志如下：

通过日志发现，Tomcat started on port(s): 8080 (http) with context path ‘’

tomcat已经起步，端口监听8080，web应用的虚拟工程名称为空。

## 2.2 快速入门解析

### 2.2.1 SpringBoot代码解析

（1）** @SpringBootApplication**：标注SpringBoot的启动类，该注解具备多种功能（后面详细剖析）

（2）** SpringApplication.run(MySpringBootApplication.class)** 代表运行SpringBoot的启动类，参数为SpringBoot

启动类的字节码对象

### 2.2.2 SpringBoot工程热部署

我们在开发中反复修改类、页面等资源，每次修改后都是需要重新启动才生效，这样每次启动都很麻烦，浪费了大量的时间，我们可以在修改代码后不重启就能生效，在 pom.xml 中添加如下配置就可以实现这样的功能，我们称

之为热部署。

```xml
<!--热部署配置-->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-devtools</artifactId>
</dependency>
```

#### 注意：IDEA进行SpringBoot热部署失败原因

出现这种情况，并不是热部署配置问题，其根本原因是因为Intellij IEDA默认情况下不会自动编译，需要对IDEA进行自动编译的设置，如下：

然后Shift+Ctrl+Alt+/，选择Registry

### 2.2.3 使用idea快速创建SpringBoot项目

## 3. SpringBoot原理分析

**3.1 起步依赖原理分析**

### 3.1.1 分析spring-boot-starter-parent

按住Ctrl点击pom.xml中的spring-boot-starter-parent，跳转到了spring-boot-starter-parent的pom.xml，xml配置如下（只摘抄了部分重点配置）：

spring-boot-starter-parent-2.0.1.RELEASE.pom

```xml
<?xml version="1.0" encoding="utf-8"?><project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
<modelVersion>4.0.0</modelVersion>
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-dependencies</artifactId>
    <version>2.0.1.RELEASE</version>
    <relativePath>../../spring-boot-dependencies</relativePath>
</parent>
<artifactId>spring-boot-starter-parent</artifactId>
<packaging>pom</packaging>
<name>Spring Boot Starter Parent</name>
<description>Parent pom providing dependency and plugin management for applications
    built with Maven</description>
<url>https://projects.spring.io/spring-boot/#/spring-boot-starter-parent</url>
<properties>
    <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
    <java.version>1.8</java.version>
    <resource.delimiter>@</resource.delimiter>
    <maven.compiler.source>${java.version}</maven.compiler.source>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <maven.compiler.target>${java.version}</maven.compiler.target>
</properties>
    <build>
        <resources>
            <resource>
                <filtering>true</filtering>
                <directory>${basedir}/src/main/resources</directory>
                <includes>
                    <include>**/application*.yml</include>
                    <include>**/application*.yaml</include>
                    <include>**/application*.properties</include>
                </includes>
            </resource>
            <resource>
                <directory>${basedir}/src/main/resources</directory>
                <excludes>
                    <exclude>**/application*.yml</exclude>
                    <exclude>**/application*.yaml</exclude>
                    <exclude>**/application*.properties</exclude>
                </excludes>
            </resource>
        </resources>
        <pluginManagement>
            <plugins>
                <plugin>
                    <groupId>org.jetbrains.kotlin</groupId>
                    <artifactId>kotlin-maven-plugin</artifactId>
                    <version>${kotlin.version}</version>
                    <executions>
                        <execution>
                            <id>compile</id>
                            <phase>compile</phase>
                            <goals>
                                <goal>compile</goal>
                            </goals>
                        </execution>
                        <execution>
                            <id>test-compile</id>
                            <phase>test-compile</phase>
                            <goals>
                                <goal>test-compile</goal>
                            </goals>
                        </execution>
                    </executions>
                    <configuration>
                        <jvmTarget>${java.version}</jvmTarget>
                        <javaParameters>true</javaParameters>
                    </configuration>
                </plugin>
                <plugin>
                    <artifactId>maven-compiler-plugin</artifactId>
                    <configuration>
                        <parameters>true</parameters>
                    </configuration>
                </plugin>
                <plugin>
                    <artifactId>maven-failsafe-plugin</artifactId>
                    <executions>
                        <execution>
                            <goals>
                                <goal>integration-test</goal>
                                <goal>verify</goal>
                            </goals>
                        </execution>
                    </executions>
                    <configuration>
                        <classesDirectory>${project.build.outputDirectory}</classesDirectory>
                    </configuration>
                </plugin>
                <plugin>
                    <artifactId>maven-jar-plugin</artifactId>
                    <configuration>
                        <archive>
                            <manifest>
                                <mainClass>${start-class}</mainClass>
                                <addDefaultImplementationEntries>true</addDefaultImplementationEntries>
                            </manifest>
                        </archive>
                    </configuration>
                </plugin>
                <plugin>
                    <artifactId>maven-war-plugin</artifactId>
                    <configuration>
                        <archive>
                            <manifest>
                                <mainClass>${start-class}</mainClass>
                                <addDefaultImplementationEntries>true</addDefaultImplementationEntries>
                            </manifest>
                        </archive>
                    </configuration>
                </plugin>
                <plugin>
                    <groupId>org.codehaus.mojo</groupId>
                    <artifactId>exec-maven-plugin</artifactId>
                    <configuration>
                        <mainClass>${start-class}</mainClass>
                    </configuration>
                </plugin>
                <plugin>
                    <artifactId>maven-resources-plugin</artifactId>
                    <configuration>
                        <delimiters>
                            <delimiter>${resource.delimiter}</delimiter>
                        </delimiters>
                        <useDefaultDelimiters>false</useDefaultDelimiters>
                    </configuration>
                </plugin>
                <plugin>
                    <groupId>pl.project13.maven</groupId>
                    <artifactId>git-commit-id-plugin</artifactId>
                    <executions>
                        <execution>
                            <goals>
                                <goal>revision</goal>
                            </goals>
                        </execution>
                    </executions>
                    <configuration>
                        <verbose>true</verbose>
                        <dateFormat>yyyy-MM-dd'T'HH:mm:ssZ</dateFormat>
                        <generateGitPropertiesFile>true</generateGitPropertiesFile>
                        <generateGitPropertiesFilename>${project.build.outputDirectory}/git.properties</generateGitPropertiesFilename>
                    </configuration>
                </plugin>
                <plugin>
                    <groupId>org.springframework.boot</groupId>
                    <artifactId>spring-boot-maven-plugin</artifactId>
                    <executions>
                        <execution>
                            <goals>
                                <goal>repackage</goal>
                            </goals>
                        </execution>
                    </executions>
                    <configuration>
                        <mainClass>${start-class}</mainClass>
                    </configuration>
                </plugin>
                <plugin>
                    <artifactId>maven-shade-plugin</artifactId>
                    <executions>
                        <execution>
                            <phase>package</phase>
                            <goals>
                                <goal>shade</goal>
                            </goals>
                            <configuration>
                                <transformers>
                                    <transformer implementation="org.apache.maven.plugins.shade.resource.AppendingTransformer">
                                        <resource>META-INF/spring.handlers</resource>
                                    </transformer>
                                    <transformer implementation="org.springframework.boot.maven.PropertiesMergingResourceTransformer">
                                        <resource>META-INF/spring.factories</resource>
                                    </transformer>
                                    <transformer implementation="org.apache.maven.plugins.shade.resource.AppendingTransformer">
                                        <resource>META-INF/spring.schemas</resource>
                                    </transformer>
                                    <transformer implementation="org.apache.maven.plugins.shade.resource.ServicesResourceTransformer"/>
                                    <transformer implementation="org.apache.maven.plugins.shade.resource.ManifestResourceTransformer">
                                        <mainClass>${start-class}</mainClass>
                                    </transformer>
                                </transformers>
                            </configuration>
                        </execution>
                    </executions>
                    <dependencies>
                        <dependency>
                            <groupId>org.springframework.boot</groupId>
                            <artifactId>spring-boot-maven-plugin</artifactId>
                            <version>2.0.1.RELEASE</version>
                        </dependency>
                    </dependencies>
                    <configuration>
                        <keepDependenciesWithProvidedScope>true</keepDependenciesWithProvidedScope>
                        <createDependencyReducedPom>true</createDependencyReducedPom>
                        <filters>
                            <filter>
                                <artifact>*:*</artifact>
                                <excludes>
                                    <exclude>META-INF/*.SF</exclude>
                                    <exclude>META-INF/*.DSA</exclude>
                                    <exclude>META-INF/*.RSA</exclude>
                                </excludes>
                            </filter>
                        </filters>
                    </configuration>
                </plugin>
                <plugin>
                    <groupId>org.eclipse.m2e</groupId>
                    <artifactId>lifecycle-mapping</artifactId>
                    <version>1.0.0</version>
                    <configuration>
                        <lifecycleMappingMetadata>
                            <pluginExecutions>
                                <pluginExecution>
                                    <pluginExecutionFilter>
                                        <groupId>org.codehaus.mojo</groupId>
                                        <artifactId>flatten-maven-plugin</artifactId>
                                        <versionRange>[1.0.0,)</versionRange>
                                        <goals>
                                            <goal>flatten</goal>
                                        </goals>
                                    </pluginExecutionFilter>
                                    <action>
                                        <ignore/>
                                    </action>
                                </pluginExecution>
                            </pluginExecutions>
                        </lifecycleMappingMetadata>
                    </configuration>
                </plugin>
            </plugins>
        </pluginManagement>
    </build>
</project>
```

按住Ctrl点击pom.xml中的spring-boot-starter-dependencies，跳转到了spring-boot-starter-dependencies的pom.xml，xml配置如下（只摘抄了部分重点配置）：

```xml
<properties>
    <activemq.version>5.15.3</activemq.version>
    <antlr2.version>2.7.7</antlr2.version>
    <appengine-sdk.version>1.9.63</appengine-sdk.version>
    <artemis.version>2.4.0</artemis.version>
    <aspectj.version>1.8.13</aspectj.version>
    <assertj.version>3.9.1</assertj.version>
    <atomikos.version>4.0.6</atomikos.version>
    <bitronix.version>2.1.4</bitronix.version>
<build-helper-maven-plugin.version>3.0.0</build-helper-maven-plugin.version>
    <byte-buddy.version>1.7.11</byte-buddy.version>
</properties>        
<dependencyManagement>
<dependencies>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot</artifactId>
    <version>2.0.1.RELEASE</version>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-test</artifactId>
    <version>2.0.1.RELEASE</version>
</dependency>
</dependencyManagement>
<build>
<pluginManagement>
    <plugins>
        <plugin>
            <groupId>org.jetbrains.kotlin</groupId>
            <artifactId>kotlin-maven-plugin</artifactId>
            <version>${kotlin.version}</version>
        </plugin>
        <plugin>
            <groupId>org.jooq</groupId>
            <artifactId>jooq-codegen-maven</artifactId>
            <version>${jooq.version}</version>
        </plugin>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
            <version>2.0.1.RELEASE</version>
        </plugin>
</build>
```

从上面的spring-boot-starter-dependencies的pom.xml中我们可以发现，一部分坐标的版本、依赖管理、插件管理已经定义好，所以我们的SpringBoot工程继承spring-boot-starter-parent后已经具备版本锁定等配置了。所以起步依赖的作用就是进行依赖的传递。

### 3.1.2 分析spring-boot-starter-web

按住Ctrl点击pom.xml中的spring-boot-starter-web，跳转到了spring-boot-starter-web的pom.xml，xml配置如下：

spring-boot-starter-web-2.0.1.RELEASE.pom

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd" xmlns="http://maven.apache.org/POM/4.0.0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <modelVersion>4.0.0</modelVersion>
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starters</artifactId>
    <version>2.0.1.RELEASE</version>
  </parent>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-web</artifactId>
  <version>2.0.1.RELEASE</version>
  <name>Spring Boot Web Starter</name>
  <description>Starter for building web, including RESTful, applications using Spring
		MVC. Uses Tomcat as the default embedded container</description>
  <url>https://projects.spring.io/spring-boot/#/spring-boot-parent/spring-boot-starters/spring-boot-starter-web</url>
  <organization>
    <name>Pivotal Software, Inc.</name>
    <url>https://spring.io</url>
  </organization>
  <licenses>
    <license>
      <name>Apache License, Version 2.0</name>
      <url>http://www.apache.org/licenses/LICENSE-2.0</url>
    </license>
  </licenses>
  <developers>
    <developer>
      <name>Pivotal</name>
      <email>info@pivotal.io</email>
      <organization>Pivotal Software, Inc.</organization>
      <organizationUrl>http://www.spring.io</organizationUrl>
    </developer>
  </developers>
  <scm>
    <connection>scm:git:git://github.com/spring-projects/spring-boot.git/spring-boot-starters/spring-boot-starter-web</connection>
    <developerConnection>scm:git:ssh://git@github.com/spring-projects/spring-boot.git/spring-boot-starters/spring-boot-starter-web</developerConnection>
    <url>http://github.com/spring-projects/spring-boot/spring-boot-starters/spring-boot-starter-web</url>
  </scm>
  <issueManagement>
    <system>Github</system>
    <url>https://github.com/spring-projects/spring-boot/issues</url>
  </issueManagement>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter</artifactId>
      <version>2.0.1.RELEASE</version>
      <scope>compile</scope>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-json</artifactId>
      <version>2.0.1.RELEASE</version>
      <scope>compile</scope>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-tomcat</artifactId>
      <version>2.0.1.RELEASE</version>
      <scope>compile</scope>
    </dependency>
    <dependency>
      <groupId>org.hibernate.validator</groupId>
      <artifactId>hibernate-validator</artifactId>
      <version>6.0.9.Final</version>
      <scope>compile</scope>
    </dependency>
    <dependency>
      <groupId>org.springframework</groupId>
      <artifactId>spring-web</artifactId>
      <version>5.0.5.RELEASE</version>
      <scope>compile</scope>
    </dependency>
    <dependency>
      <groupId>org.springframework</groupId>
      <artifactId>spring-webmvc</artifactId>
      <version>5.0.5.RELEASE</version>
      <scope>compile</scope>
    </dependency>
  </dependencies>
</project>
```

从上面的spring-boot-starter-web的pom.xml中我们可以发现，spring-boot-starter-web就是将web开发要使用的spring-web、spring-webmvc等坐标进行了“打包”，这样我们的工程只要引入spring-boot-starter-web起步依赖的坐标就可以进行web开发了，同样体现了依赖传递的作用。

## 3.2 自动配置原理解析

**按住Ctrl点击查看启动类MySpringBootApplication上的注解**@SpringBootApplication

SpringBootApplication.class

```java
//
// Source code recreated from a .class file by IntelliJ IDEA
// (powered by Fernflower decompiler)
//
package org.springframework.boot.autoconfigure;
@Target({
     ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@SpringBootConfiguration
@EnableAutoConfiguration
@ComponentScan(
    excludeFilters = {
     @Filter(
    type = FilterType.CUSTOM,
    classes = {
     TypeExcludeFilter.class}
), @Filter(
    type = FilterType.CUSTOM,
    classes = {
     AutoConfigurationExcludeFilter.class}
)}
)
public @interface SpringBootApplication {
    @AliasFor(
        annotation = EnableAutoConfiguration.class
    )
    Class<?>[] exclude() default {
     };
    @AliasFor(
        annotation = EnableAutoConfiguration.class
    )
    String[] excludeName() default {
     };
    @AliasFor(
        annotation = ComponentScan.class,
        attribute = "basePackages"
    )
    String[] scanBasePackages() default {
     };
    @AliasFor(
        annotation = ComponentScan.class,
        attribute = "basePackageClasses"
    )
    Class<?>[] scanBasePackageClasses() default {
     };
}
```

其中

@SpringBootConfiguration：等同与@Configuration，既标注该类是Spring的一个配置类

@EnableAutoConfiguration：SpringBoot自动配置功能开启

**按住Ctrl点击查看注解@EnableAutoConfiguration**

```java
@Target({
ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@AutoConfigurationPackage
@Import({
     AutoConfigurationImportSelector.class})
public @interface EnableAutoConfiguration {
    String ENABLED_OVERRIDE_PROPERTY = "spring.boot.enableautoconfiguration";
    Class<?>[] exclude() default {
     };
    String[] excludeName() default {
     };
}
```

其中，@Import(AutoConfigurationImportSelector.class) 导入了AutoConfigurationImportSelector类

**按住Ctrl点击查看AutoConfigurationImportSelector源码**

```java
public String[] selectImports(AnnotationMetadata annotationMetadata) {
        List<String> configurations = this.getCandidateConfigurations(annotationMetadata, attributes);
        configurations = this.removeDuplicates(configurations);
        Set<String> exclusions = this.getExclusions(annotationMetadata, attributes);
        this.checkExcludedClasses(configurations, exclusions);
        configurations.removeAll(exclusions);
        configurations = this.filter(configurations, autoConfigurationMetadata);
        this.fireAutoConfigurationImportEvents(configurations, exclusions);
        return StringUtils.toStringArray(configurations);
    }
}
protected List<String> getCandidateConfigurations(AnnotationMetadata metadata, AnnotationAttributes attributes) {
    List<String> configurations = SpringFactoriesLoader.loadFactoryNames(this.getSpringFactoriesLoaderFactoryClass(), this.getBeanClassLoader());
    Assert.notEmpty(configurations, "No auto configuration classes found in META-INF/spring.factories. If you are using a custom packaging, make sure that file is correct.");
    return configurations;
}
```

其中，SpringFactoriesLoader.loadFactoryNames 方法的作用就是从META-INF/spring.factories文件中读取指定类对应的类名称列表

spring.factories 文件中有关自动配置的配置信息如下：

```java
... ... ...
org.springframework.boot.autoconfigure.web.reactive.function.client.WebClientAutoConf
iguration,\
org.springframework.boot.autoconfigure.web.servlet.DispatcherServletAutoConfiguration
,\
org.springframework.boot.autoconfigure.web.servlet.ServletWebServerFactoryAutoConfigu
ration,\
org.springframework.boot.autoconfigure.web.servlet.error.ErrorMvcAutoConfiguration,\
org.springframework.boot.autoconfigure.web.servlet.HttpEncodingAutoConfiguration,\
org.springframework.boot.autoconfigure.web.servlet.MultipartAutoConfiguration,\
... ... ...
```

上面配置文件存在大量的以Configuration为结尾的类名称，这些类就是存有自动配置信息的类，而SpringApplication在获取这些类名后再加载

我们以ServletWebServerFactoryAutoConfiguration为例来分析源码：

```java
@Configuration
@AutoConfigureOrder(Ordered.HIGHEST_PRECEDENCE)
@ConditionalOnClass(ServletRequest.class)
@ConditionalOnWebApplication(type = Type.SERVLET)
@EnableConfigurationProperties(ServerProperties.class)
@Import({
 ServletWebServerFactoryAutoConfiguration.BeanPostProcessorsRegistrar.class,
ServletWebServerFactoryConfiguration.EmbeddedTomcat.class,
ServletWebServerFactoryConfiguration.EmbeddedJetty.class,
ServletWebServerFactoryConfiguration.EmbeddedUndertow.class })
public class ServletWebServerFactoryAutoConfiguration {
... ... ...
}
```

其中，
@EnableConfigurationProperties(ServerProperties.class) 代表加载ServerProperties服务器配置属性类

进入ServerProperties.class源码如下：

```java
@ConfigurationProperties(prefix = "server", ignoreUnknownFields = true)
public class ServerProperties {
/**
* Server HTTP port.
*/
private Integer port;
/**
* Network address to which the server should bind.
*/
private InetAddress address;
... ... ...
}
```

其中

prefix = “server” 表示SpringBoot配置文件中的前缀，SpringBoot会将配置文件中以server开始的属性映射到该类

的字段中。映射关系如下：

## 4. SpringBoot的配置文件

**4.1 SpringBoot配置文件类型**

### 4.1.1 SpringBoot配置文件类型和作用

SpringBoot是基于约定的，所以很多配置都有默认值。**但如果想使用自己的配置替换默认配置的话，就可以使用application.properties或者application.yml（application.yaml）进行配置。**

SpringBoot默认会从Resources目录下加载application.properties或application.yml（application.yaml）文件

其中，**application.properties文件是键值对**类型的文件，之前一直在使用，所以此处不在对properties文件的格式

进行阐述。除了properties文件外，SpringBoot还可以使用yml文件进行配置，下面对yml文件进行讲解。

### 4.1.2 application.yml配置文件

#### 4.1.2.1 yml配置文件简介

YML文件格式是YAML (YAML Aint Markup Language)编写的文件格式，YAML是一种直观的能够被电脑识别的的数据序列化格式，并且容易被人类阅读，容易和脚本语言交互的，可以被支持YAML库的不同的编程语言程序导入，比如： C/C++, Ruby, Python, Java, Perl, C#, PHP等。YML文件是以数据为核心的，比传统的xml方式更加简洁。

YML文件的扩展名可以使用.yml或者.yaml。

#### 4.1.2.2 yml配置文件的语法

**4、** 1.2.2.1配置普通数据；

**4、** 1.2.2.2配置对象数据；

注意：key1前面的空格个数不限定，在yml语法中，相同缩进代表同一个级别

**4、** 1.2.2.2配置Map数据；

**同上面的对象写法**

**4、** 1.2.2.3配置数组（List、Set）数据；

注意：value1与之间的 - 之间存在一个空格

### 4.1.3 SpringBoot配置信息的查询

SpringBoot的配置文件，主要的目的就是对配置信息进行修改的，但在配置时的key从哪里去查询呢？我们可以查阅SpringBoot的官方文档

[https://docs.spring.io/spring-boot/docs/2.0.1.RELEASE/reference/htmlsingle/#getting-started-maven-installation](https://docs.spring.io/spring-boot/docs/2.0.1.RELEASE/reference/htmlsingle/#getting-started-maven-installation)

常用的配置摘抄如下：

```java
# QUARTZ SCHEDULER (QuartzProperties)
spring.quartz.jdbc.initialize-schema=embedded Database schema initialization mode.
spring.quartz.jdbc.schema=classpath:org/quartz/impl/jdbcjobstore/tables_@@platform@@.
sql Path to the SQL file to use to initialize the database schema.
spring.quartz.job-store-type=memory Quartz job store type.
spring.quartz.properties.*= Additional Quartz Scheduler properties.
# ----------------------------------------
# WEB PROPERTIES
# ----------------------------------------
# EMBEDDED SERVER CONFIGURATION (ServerProperties)
server.port=8080 Server HTTP port.
server.servlet.context-path= Context path of the application.
server.servlet.path=/ Path of the main dispatcher servlet.
# HTTP encoding (HttpEncodingProperties)
spring.http.encoding.charset=UTF-8 Charset of HTTP requests and responses. Added to
the "Content-Type" header if not set explicitly.
# JACKSON (JacksonProperties)
spring.jackson.date-format= Date format string or a fully-qualified date format
class name. For instance, yyyy-MM-dd HH:mm:ss.
# SPRING MVC (WebMvcProperties)
spring.mvc.servlet.load-on-startup=-1 Load on startup priority of the dispatcher
servlet.
spring.mvc.static-path-pattern=/** Path pattern used for static resources.
spring.mvc.view.prefix= Spring MVC view prefix.
spring.mvc.view.suffix= Spring MVC view suffix.
# DATASOURCE (DataSourceAutoConfiguration & DataSourceProperties)
spring.datasource.driver-class-name= Fully qualified name of the JDBC driver. Autodetected
based on the URL by default.
spring.datasource.password= Login password of the database.
spring.datasource.url= JDBC URL of the database.
spring.datasource.username= Login username of the database.
# JEST (Elasticsearch HTTP client) (JestProperties)
spring.elasticsearch.jest.password= Login password.
spring.elasticsearch.jest.proxy.host= Proxy host the HTTP client should use.
spring.elasticsearch.jest.proxy.port= Proxy port the HTTP client should use.
spring.elasticsearch.jest.read-timeout=3s Read timeout.
spring.elasticsearch.jest.username= Login username.
```

可以通过配置application.poperties 或者 application.yml 来修改SpringBoot的默认配置

例如：
application.properties文件

```sh
server.port=8888
server.servlet.context-path=demo
```

application.yml文件

```sh
server:
   port: 8888
   servlet:
     context-path: /demo
```

## 4.2 配置文件与配置类的属性映射方式

### 4.2.1 使用注解@Value映射

可以通过@Value注解将配置文件中的值映射到一个Spring管理的Bean的字段上

例如：
application.yml

```java
person:
   name: zhangsan
   age: 18
```

实体Bean代码如下：

```java
@Controller
public class QuickStartController {
@Value("${person.name}")
private String name;
@Value("${person.age}")
private Integer age;
@RequestMapping("/quick")
@ResponseBody
public String quick(){
return "springboot 访问成功! name="+name+",age="+age;
}
}
```

### 4.2.2 使用注解@ConfigurationProperties映射

通过注解@ConfigurationProperties(prefix=“配置文件中的key的前缀”)可以将配置文件中的配置自动与实体进行映射

application.yml

```java
person:
    name: zhangsan
    age: 18
```

实体Bean代码如下：

```java
@Controller
@ConfigurationProperties(prefix = "person")
public class QuickStartController {
private String name;
private Integer age;
@RequestMapping("/quick")
@ResponseBody
public String quick(){
return "springboot 访问成功! name="+name+",age="+age;
}
public void setName(String name) {
this.name = name;
}
public void setAge(Integer age) {
this.age = age;
}
}
```

注意：使用@ConfigurationProperties方式可以进行配置文件与实体字段的自动映射，但需要字段必须提供set方

法才可以，而使用@Value注解修饰的字段不需要提供set方法

## 5. SpringBoot与整合其他技术

**5.1 SpringBoot整合Mybatis**

### 5.1.1 添加Mybatis的起步依赖

```xml
<!--mybatis起步依赖-->
<dependency>
<groupId>org.mybatis.spring.boot</groupId>
<artifactId>mybatis-spring-boot-starter</artifactId>
<version>1.1.1</version>
</dependency>
```

### 5.1.2 添加数据库驱动坐标

```xml
<!-- MySQL连接驱动 -->
<dependency>
<groupId>mysql</groupId>
<artifactId>mysql-connector-java</artifactId>
</dependency>
```

### 5.1.3 添加数据库连接信息

在application.properties中添加数据量的连接信息

```sh
#DB Configuration:
spring.datasource.driverClassName=com.mysql.jdbc.Driver
spring.datasource.url=jdbc:mysql://127.0.0.1:3306/test?
useUnicode=true&characterEncoding=utf8
spring.datasource.username=root
spring.datasource.password=root
```

### 5.1.4 创建user表

在test数据库中创建user表

```java
-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS user;
CREATE TABLE user (
id int(11) NOT NULL AUTO_INCREMENT,
username varchar(50) DEFAULT NULL,
password varchar(50) DEFAULT NULL,
name varchar(50) DEFAULT NULL,
PRIMARY KEY (id)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;
-- ----------------------------
-- Records of user
-- ----------------------------
INSERT INTO user VALUES ('1', 'zhangsan', '123', '张三');
INSERT INTO user VALUES ('2', 'lisi', '123', '李四');
```

### 5.1.5 创建实体Bean

```java
public class User {
// 主键
private Long id;
// 用户名
private String username;
// 密码
private String password;
// 姓名
private String name;
//此处省略getter和setter方法 .. ..
}
```

### 5.1.6 编写Mapper

```java
@Mapper
public interface UserMapper {
public List<User> queryUserList();
}
```

注意：@Mapper标记该类是一个mybatis的mapper接口，可以被spring boot自动扫描到spring上下文中

### 5.1.7 配置Mapper映射文件

在src\main\resources\mapper路径下加入UserMapper.xml配置文件"

```xml
<?xml version="1.0" encoding="utf-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
"http://mybatis.org/dtd/mybatis-3-mapper.dtd" >
<mapper namespace="com.itheima.mapper.UserMapper">
<select id="queryUserList" resultType="user">
select * from user
</select>
</mapper>
```

### 5.1.8 在application.properties中添加mybatis的信息

```sh
#spring集成Mybatis环境
#pojo别名扫描包
mybatis.type-aliases-package=com.itheima.domain
#加载Mybatis映射文件
mybatis.mapper-locations=classpath:mapper/*Mapper.xml
```

### 5.1.9 编写测试Controller

```java
@Controller
public class MapperController {
    @Autowired
    private UserMapper userMapper;
    @RequestMapping("/queryUser")
    @ResponseBody
    public List<User> queryUser(){
    List<User> users = userMapper.queryUserList();
    return users;
    }
}
```

### 5.1.10 测试

## 5.2 SpringBoot整合Mybatis

### 5.2.1 添加Junit的起步依赖

```xml
<!--测试的起步依赖-->
<dependency>
<groupId>org.springframework.boot</groupId>
<artifactId>spring-boot-starter-test</artifactId>
<scope>test</scope>
</dependency>
```

### 5.2.2 编写测试类

```java
@RunWith(SpringRunner.class)
@SpringBootTest(classes = MySpringBootApplication.class)
public class MapperTest {
@Autowired
private UserMapper userMapper;
@Test
public void test() {
List<User> users = userMapper.queryUserList();
System.out.println(users);
}
}
```

其中，
SpringRunner继承自SpringJUnit4ClassRunner，使用哪一个Spring提供的测试测试引擎都可以

```java
public final class SpringRunner extends SpringJUnit4ClassRunner
```

@SpringBootTest的属性指定的是引导类的字节码对象

### 5.2.3 控制台打印信息

## 5.3 SpringBoot整合Mybatis

### 5.3.1 添加Spring Data JPA的起步依赖

```xml
<!-- springBoot JPA的起步依赖 -->
<dependency>
<groupId>org.springframework.boot</groupId>
<artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
```

### 5.3.2 添加数据库驱动依赖

```xml
<!-- MySQL连接驱动 -->
<dependency>
<groupId>mysql</groupId>
<artifactId>mysql-connector-java</artifactId>
</dependency>
```

### 5.3.3 在application.properties中配置数据库和jpa的相关属性

```java
#DB Configuration:
spring.datasource.driverClassName=com.mysql.jdbc.Driver
spring.datasource.url=jdbc:mysql://127.0.0.1:3306/test?
useUnicode=true&characterEncoding=utf8
spring.datasource.username=root
spring.datasource.password=root
#JPA Configuration:
spring.jpa.database=MySQL
spring.jpa.show-sql=true
spring.jpa.generate-ddl=true
spring.jpa.hibernate.ddl-auto=update
spring.jpa.hibernate.naming_strategy=org.hibernate.cfg.ImprovedNamingStrategy
```

### 5.3.4 创建实体配置实体

```java
@Entity
public class User {
// 主键
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;
// 用户名
private String username;
// 密码
private String password;
// 姓名
private String name;
//此处省略setter和getter方法... ...
}
```

### 5.3.5 编写UserRepository

```java
public interface UserRepository extends JpaRepository<User,Long>{
public List<User> findAll();
}
```

### 5.3.6 编写测试类

```java
@RunWith(SpringRunner.class)
@SpringBootTest(classes=MySpringBootApplication.class)
public class JpaTest {
@Autowired
private UserRepository userRepository;
@Test
public void test(){
List<User> users = userRepository.findAll();
System.out.println(users);
}
}
```

### 5.3.7 控制台打印信息

注意：如果是jdk9，执行报错如下：

原因：jdk缺少相应的jar

解决方案：手动导入对应的maven坐标，如下：

```xml
<!--jdk9需要导入如下坐标-->
<dependency>
<groupId>javax.xml.bind</groupId>
<artifactId>jaxb-api</artifactId>
<version>2.3.0</version>
</dependency>
```

### 5.3.8 完整代码

springboot_mybatis

pom

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
	<modelVersion>4.0.0</modelVersion>
	<groupId>com.itheima</groupId>
	<artifactId>springboot_mybatis</artifactId>
	<version>0.0.1-SNAPSHOT</version>
	<packaging>jar</packaging>
	<name>springboot_mybatis</name>
	<description>Demo project for Spring Boot</description>
	<parent>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starter-parent</artifactId>
		<version>2.0.1.RELEASE</version>
		<relativePath/> <!-- lookup parent from repository -->
	</parent>
	<properties>
		<project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
		<project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
		<java.version>1.8</java.version>
	</properties>
	<dependencies>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-web</artifactId>
		</dependency>
		<!--SpingBoot集成junit测试的起步依赖-->
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-test</artifactId>
			<scope>test</scope>
		</dependency>
		<!--mybatis起步依赖-->
		<dependency>
			<groupId>org.mybatis.spring.boot</groupId>
			<artifactId>mybatis-spring-boot-starter</artifactId>
			<version>1.1.1</version>
		</dependency>
		<!-- MySQL连接驱动 -->
		<dependency>
			<groupId>mysql</groupId>
			<artifactId>mysql-connector-java</artifactId>
		</dependency>
	</dependencies>
	<build>
		<plugins>
			<plugin>
				<groupId>org.springframework.boot</groupId>
				<artifactId>spring-boot-maven-plugin</artifactId>
			</plugin>
		</plugins>
	</build>
</project>
```

MybatisController

```java
@Controller
public class MybatisController {
    @Autowired
    private UserMapper userMapper;
    @RequestMapping("/query")
    @ResponseBody
    public List<User> queryUserList(){
        List<User> users = userMapper.queryUserList();
        return users;
    }
}
```

User

```java
public class User {
    private Long id;
    private String username;
    private String password;
    private String name;
    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public String getUsername() {
        return username;
    }
    public void setUsername(String username) {
        this.username = username;
    }
    public String getPassword() {
        return password;
    }
    public void setPassword(String password) {
        this.password = password;
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", username='" + username + '\'' +
                ", password='" + password + '\'' +
                ", name='" + name + '\'' +
                '}';
    }
}
```

UserMapper

```java
@Mapper
public interface UserMapper {
    public List<User> queryUserList();
}
```

SpringbootMybatisApplication

```java
@SpringBootApplication
public class SpringbootMybatisApplication {
	public static void main(String[] args) {
		SpringApplication.run(SpringbootMybatisApplication.class, args);
	}
}
```

UserMapper.xml

```xml
<?xml version="1.0" encoding="utf-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd" >
<mapper namespace="com.itheima.mapper.UserMapper">
    <select id="queryUserList" resultType="user">
        select * from user
    </select>
</mapper>
```

application.properties

```java
#\u6570\u636E\u5E93\u8FDE\u63A5\u4FE1\u606F
spring.datasource.driverClassName=com.mysql.jdbc.Driver
spring.datasource.url=jdbc:mysql://127.0.0.1:3306/test?useUnicode=true&characterEncoding=utf8
spring.datasource.username=root
spring.datasource.password=root
#\u914D\u7F6Emybatis\u7684\u4FE1\u606F
#spring\u96C6\u6210Mybatis\u73AF\u5883
#pojo\u522B\u540D\u626B\u63CF\u5305
mybatis.type-aliases-package=com.itheima.domain
#\u52A0\u8F7DMybatis\u6620\u5C04\u6587\u4EF6
mybatis.mapper-locations=classpath:mapper/*Mapper.xml
```

MybatisTest

```java
@RunWith(SpringRunner.class)
@SpringBootTest(classes = SpringbootMybatisApplication.class)
public class MybatisTest {
    @Autowired
    private UserMapper userMapper;
    @Test
    public void test(){
        List<User> users = userMapper.queryUserList();
        System.out.println(users);
    }
}
```

SpringbootMybatisApplicationTests

```java
@RunWith(SpringRunner.class)
@SpringBootTest
public class SpringbootMybatisApplicationTests {
	@Test
	public void contextLoads() {
	}
}
```

## 5.4 SpringBoot整合Redis

### 5.4.1 添加redis的起步依赖

```xml
<!-- 配置使用redis启动器 -->
<dependency>
<groupId>org.springframework.boot</groupId>
<artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

### 5.4.2 配置redis的连接信息

```java
#Redis
spring.redis.host=127.0.0.1
spring.redis.port=6379
```

### 5.4.3 注入RedisTemplate测试redis操作

```java
@RunWith(SpringRunner.class)
@SpringBootTest(classes = SpringbootJpaApplication.class)
public class RedisTest {
@Autowired
private UserRepository userRepository;
@Autowired
private RedisTemplate<String, String> redisTemplate;
@Test
public void test() throws JsonProcessingException {
//从redis缓存中获得指定的数据
String userListData = redisTemplate.boundValueOps("user.findAll").get();
//如果redis中没有数据的话
if(null==userListData){
//查询数据库获得数据
List<User> all = userRepository.findAll();
//转换成json格式字符串
ObjectMapper om = new ObjectMapper();
userListData = om.writeValueAsString(all);
//将数据存储到redis中，下次在查询直接从redis中获得数据，不用在查询数据库
redisTemplate.boundValueOps("user.findAll").set(userListData);
System.out.println("===============从数据库获得数据===============");
}else{
System.out.println("===============从redis缓存中获得数据===============");
}
System.out.println(userListData);
}
}
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
