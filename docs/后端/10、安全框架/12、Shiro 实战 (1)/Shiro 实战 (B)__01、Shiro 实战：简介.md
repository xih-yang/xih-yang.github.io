# 01、Shiro 实战：简介
- 来源：https://ddkk.com/zhuanlan/security/shiro/7/16.html
- 分类：安全框架
- 分组：Shiro 实战 (B)
## 一、简介：

Apache Shiro 是 Java 的一个安全（权限）框架。Shiro 可以完成：认证、授权、加密、会话管理、与Web 集成、缓存等。shiro不会去维护用户、维护权限，这些需要我们自己去设计和提供，然后通过相应的接口注入给Shiro即可。

## 二、功能简介：

primary concerns：主要关注点

supporting features：支持功能

Authentication：身份认证和登录，验证用户是不是拥有相应的身份；

Authorization：授权，即权限验证，验证某个已认证的用户是否拥有某个权限；即判断用户是否能进行什么操作，如：验证某个用户是否拥有某个角色。或者细粒度的验证某个用户对某个资源是否具有某个权限；

Session Manager：会话管理，即用户登录后就是一次会话，在没有退出之前，它的所有信息都在会话中；会话可以是普通 JavaSE 环境，也可以是 Web 环境的；

Cryptography：加密，保护数据的安全性，如密码加密存储到数据库，而不是明文存储；

WebSupport：Web 支持，可以非常容易的集成到Web 环境；

Caching：缓存，比如用户登录后，其用户信息、拥有的角色和权限不必每次去数据库中查，这样可以提高效率；

Concurrency：Shiro 支持多线程应用的并发验证，即如果在一个线程中开启另一个线程，能把权限自动传播过去；

Testing：提供测试支持；

RunAs：允许一个用户假装为另一个用户（如果他们允许）的身份进行访问；

Remember Me：记住我，这个是非常常见的功能，即一次登录后，下次再来的话不用登录了。

## 三、shiro架构

从外部来看Shiro ，即从应用程序角度的来观察如何使用 Shiro 完成工作：

Subject：应用代码直接交互的对象是 Subject，也就是说 Shiro 的对外 API 核心就是 Subject。Subject 代表了当前“用户”；与 Subject 的所有交互都会委托给 SecurityManager； Subject 其实是一个门面，SecurityManager 才是实际的执行者。

SecurityManager：安全管理器；即所有与安全有关的操作都会与 SecurityManager 交互；且其管理着所有 Subject；可以看出它是 Shiro 的核心，它负责与 Shiro 的其他组件进行交互，它相当于 SpringMVC 中 DispatcherServlet 的角色。

Realm：Shiro 从 Realm 获取安全数据（如用户、角色、权限），就是说 SecurityManager 要验证用户身份，那么它需要从 Realm 获取相应的用户进行比较以确定用户身份是否合法；也需要从 Realm 得到用户相应的角色和权限进行验证用户是否能进行操作；可以把 Realm 看成 DataSource，即安全数据源。

**也就是说对于我们而言，最简单的一个Shiro应用**：

**1、** 应用代码通过Subject来进行认证和授权，而Subject又委托给SecurityManager；

**2、** 我们需要给Shiro的SecurityManager注入Realm，从而让SecurityManager能得到合法的用户及其权限进行判断。

**3、** 从以上也可以看出，Shiro不提供维护用户/权限，而是通过Realm让开发人员自己注入。
