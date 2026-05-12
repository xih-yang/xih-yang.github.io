# 04、Shiro 入门：Shiro 认证流程简易描述
- 来源：https://ddkk.com/zhuanlan/security/shiro/6/13.html
- 分类：安全框架
- 分组：SpringBoot + Shiro 入门 (A)
- 通过 shiro 相关的 API 创建了 SecurityManager 以及获得 subject 实例
- 封装了 token 信息

具体描述：

- 通过 subject.login(token)进行用户认证 Subject 接受 token 信息
- 通过 DelegatingSubject 将 token 委托给 securityManager 完成认证
- securityManager 通过使用 DefaultSecurityManager 完成相关功能
- 由 DefaultSecurityManager 中的 login 方法完成对应的认证
- 在 login 中调用了 AuthenticatingSecurityManager 中的 authenticate 方法完成认证
- 使用其中的doAuthenticate 获得realms信息如果是单个直接进行比较，判断是否成功，如果是多个 raalm 需要使用验证策略完成对应的认证工作
