# 03、Shiro 入门：Shiro 验证时异常对照
- 来源：https://ddkk.com/zhuanlan/security/shiro/6/12.html
- 分类：安全框架
- 分组：SpringBoot + Shiro 入门 (A)
- DisabledAccountException 账户失效异常
- ConcurrentAccessException 竞争次数过多
- ExcessiveAttemptsException 尝试次数过多
- UnknownAccountException 用户名不正确
- IncorrectCredentialsException 凭证（密码）不正确
- ExpiredCredentialsException 凭证过期

**使用 shiro 做异常处理的时候，尽量把异常信息表示的婉转一点，这 样有助于提升代码的安全性**
