# 01、Shiro 速成：Shiro 权限框架简介
- 来源：https://ddkk.com/zhuanlan/security/shiro/5/10.html
- 分类：安全框架
- 分组：SpringBoot + Shiro 速成 (B)
## 前提

Java代码+ rbac 的数据库思想

就可以实现不同角色，实现不同功能

## Shiro 简介

目前市场上专门的Java权限框架有Apache Shiro 和 Spring Security。相较于Spring Security 来说 Shiro更加老牌，**所以就先讲解Shiro**，在后面的阶段中讲解Spring Security。学习好Shiro对于以后市场上在出现新型权限框架的学习能带来很大便利。因为权限的概念是不变的，变得是框架的实现方式。当然了，对于第一次学习权限框架的人来说，相较于权限框架的应用，更难的就是权限方面的概念。

## Shiro官方解释

中文:Apache Shiro是一个强大的并且简单使用的java权限框架.**主要应用认证(Authentication),授权(Authorization),cryptography(加密),和Session Manager**.Shiro具有简单易懂的API,使用Shiro可以快速并且简单的应用到任何应用中,无论是从最小的移动app到最大的企业级web应用都可以使用.

## 核心功能

在Shiro官网首页上占用了很大的篇幅说明了Shiro的核心功能。

> Authentication 认证。如用户的登录。
>
> Authorization 授权。用户是否有权限访问指定URL等。
>
> Cryptography 密码学。如密码的加密。
>
> Session Management Session 管理。
>
> Web Integration Web集成。Shiro不依赖于容器。

## Shiro 架构原理

### 1、第一行

第一行中示例出了一些语言。无论是什么语言都需要包含Subject

### 2、Subject

主体。每个用户登录成功后都会对应一个Subject对象，所有用户信息都存放在Subject中。**可以理解：Subject就是Shiro提供的用户实体类**。

> 也就是将前段传过来的用户名和密码，存到这个Subject对象里面，这个对象是shiro提供的，以后拿上Subject对象就可以在shiro框架里面随便走了，不然shiro框架不认识前段传过来的用户名和密码，他只是认识subject对象

### 3、Security Manager

Shiro最大的容器，此容器中包含了Shiro的绝大多数功能。在非Spring Boot项目中，获取Security Manager 是编写代码的第一步。而在Spring Boot中已经帮助我们自动化配置了。

> ssm项目里面，我们使用shiro框架，首先要拿到Security Manager对象，这个对象是自己创建的，但是在Springboot项目里面，只要集成了shiro依赖，那么spring容器里面就有Security Manager对象了，我们直接拿出来就可以使用了，不需要我们手动创建了

### 4、Authenticator

认证器。执行认证过程调用的组件。里面包含了认证策略。

### 5、Authorizer

授权器。执行授权时调用的组件。

### 6、Session Manager

Shiro被Web集成后，HttpSession对象会由Shiro的Session Manager进行管理。（以前session是由Tomcat进行管理）

### 7、Cache Manager

缓存管理。Shiro执行很多第三方缓存技术。例如：EHCache，Redis等。

### 8、Session DAO

操作Session内容的组件。将session中 的数据保存到数据库

### 9、Realms

Shiro框架实现权限控制不依赖于数据库，通过内置数据也可以实现权限控制。但是目前绝大多数应用的数据都存储在数据库中，**所以Shiro提供了Realms组件，此组件的作用就是访问数据库**。

**Shiro内置的访问数据库的代码，通过简单配置就可以访问数据库，也可以自定义Realms实现访问数据库逻辑（绝大多数都这么做）**

> shiro实现认证授权，数据可以保存在一个配置文件里面，用Java代码解析配置文件，实现认证授权，也可以把数据保存在数据库，shiro已经集成了操作数据库的代码，这个就是realms组件，里面有操作数据库的代码，我们只需要配置数据库的连接地址，用户名，密码，那么就可以使用shiro操作数据库了

### 解释以上的图

shiro框架可以被很多的语言使用，现在我们讲解使用Java语言操作shiro。

> 首先对于这个shiro框架，我们要拿到security manager 这个对象，这个对象里面有很多的子对象，只要拿到security manager 这个对象，就可以拿到子对象了。

**子对象有：**

```java
认证器对象
授权对象
session管理器对象
缓冲管理器对象 ：  操作缓冲数据库，比如Redis
session  DAO  将session中的数据缓冲到数据库里面
```

## shiro实现的流程

代码发起请求，shiro框架给我们一个subject对象，用这个subject对象得到security manager对象，如果我们要实现认证，那么security manager对象得到认证器对象，认证器对象调用realms组件进行操作数据库，实现认证。

如果要实现授权，security manager对象拿到授权对象，调用realms组件进行操作数据库，实现授权。

也就是都需要通过security manager对象获取。
