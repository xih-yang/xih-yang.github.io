# 06、Shiro 速成：SpringBoot+Shiro 实现退出功能
- 来源：https://ddkk.com/zhuanlan/security/shiro/5/15.html
- 分类：安全框架
- 分组：SpringBoot + Shiro 速成 (B)
## 退出

退出之后，将session销毁，将记住我的功能也要销毁

### 1修改配置类

修改ShiroConfig类，添加logout filter 对应的url。

红色部分为新增内容。

也就是shiro有一个过滤器就是专门做退出功能的，我们要配置哪些路径需要退出就可以了

### 2修改主页面
