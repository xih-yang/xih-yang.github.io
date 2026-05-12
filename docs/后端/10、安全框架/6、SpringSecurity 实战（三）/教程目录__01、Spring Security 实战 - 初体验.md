# 01、Spring Security 实战 - 初体验
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/9/1.html
- 分类：安全框架
- 分组：教程目录
## 前言

安全不管是生活中，还是工作中，都是尤为重要的。在大数据时代下，有些信息我们可以公开，而有些数据并不想公开，那么在项目开发过程中，系统如何保证它的安全性了？**SpringSecurity**就是专门为保证系统安全性而开发的，接下来介绍如何使用**SpringSecurity**。

## 依赖

SpringBoot集成SpringSecurity也非常简单，只需要引入下面依赖即可

```xml
<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-security</artifactId>
</dependency>
```

## 使用

添加一个接口，启动项目

```java
@RestController
public class SecurityController {
    @GetMapping
    public String index(){
        return "index";
    }
}
```

在浏览器输入[http://localhost:8080/](http://localhost:8080/)，直接跳转到登录页面，说明SpringSecurity已经生效。

输入默认用户名：user，在控制台找到密码登录

此时SpringSecurity已经成功集成到项目当中。真正开发中不会使用这种方式，一是用户名默认的；二是密码每次在项目启动时，随机生成。

## 配置文件

在application.yml中添加以下配置，重新启动项目

```java
spring:
  security:
    user:
      name: admin
      password: 123
```

此时可以通过指定用户密码进行登录

## 总结

上面介绍了两种配置方式：一是以**默认的用户名密码**方式登录，二是在配置文件中用**指定用户名密码**登录。

下面介绍在[内存中配置用户名密码](/zhuanlan/security/springsecurity/9/2.html)的方式登录。
