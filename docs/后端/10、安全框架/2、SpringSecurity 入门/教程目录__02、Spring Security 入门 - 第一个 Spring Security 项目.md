# 02、Spring Security 入门 - 第一个 Spring Security 项目
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/5/2.html
- 分类：安全框架
- 分组：教程目录
### 1.导入依赖

Spring Security 已经被 Spring boot 进行集成，使用时直接引入启动器即可。

```xml
<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-security</artifactId>
</dependency>
```

### 2.访问页面

导入 spring-boot-starter-security 启动器后，Spring Security 已经生效，默认拦截全部请求，如果用户没有登录，跳转到内置登录页面

在项目中新建 login.html 页面后

在浏览器输入：http://localhost:8080/login.html 后会显示下面页面

默认的 username 为 user，password 打印在控制台中。（每个人显示的不一样）

在浏览器中输入账号和密码后会显示 login.html 页面内容。
