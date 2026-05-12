# 01、Shiro 入门：Shiro 简介
- 来源：https://ddkk.com/zhuanlan/security/shiro/6/10.html
- 分类：安全框架
- 分组：SpringBoot + Shiro 入门 (A)
### 1.为什么学习 Shiro

**目前使用遇到的问题？**

- 使用 RBAC 进行角色访问控制的时候，代码书写起来相对比较麻烦
- 目前学习的写的操作代码整体不太安全

### 2.解决的方案

- Spring securing 安全框架 缺点：基于 Spring 之上的，局限性比较大
- shiro javaEE javaSE 分布式项目

### 3.什么是 shiro

- Apache Shiro 是一个强大而灵活的开源安全框架，它干净利 落地处理身份认证，授权，企业会话管理和加密
- [Shiro官网](http://shiro.apache.org/)

### 4.Shiro 中的体系的组成

- Authentication:身份的验证-就是我们平时做的登录
- Authorization：授权：赋予角色不同的 菜单功能
- Session Management:管理登录用户的信息
- Cryptography：加密技术 MD5 加密算法等。
- Web Support：shiro 对 web 项目进行的支持
- Caching:缓存 可以安全快速的操作
- Concurrency:支持并发多线程的处理
- Testing:测试
- Run As：可以实现在一个用户允许的前提下，使用另一 个用户访问
- Remember Me：记住我

### 5.shiro 的架构

- Subject(org.apache.shiro.subject.Subject)当前与软件进行交互的实体（用户，第三方服务，cron job，等等）的安全特定“视图”
- SecurityManager：SecurityManager 是 Shiro 架构的心脏。它基本上是一个“保护伞”对象，协调其管理的组件以确保它们能够一起顺利的工作类似于 SpringMVC 中的入口 servlet
- Realms：域，Realms 在 Shiro 和你的应用程序的安全数据之间担当 “桥梁”或“连接器”。当它实际上与安全相关的数据如用来执行身份验证（登录）及授权（访问控制）的用户帐户交互时，Shiro 从一个或多个为应用程序配置的 Realm 中寻找许多这样的东西
-
