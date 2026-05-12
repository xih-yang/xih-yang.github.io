# 06、Spring Boot - 中访问静态资源
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/4/6.html
- 分类：J2EE框架
- 分组：教程目录
在 SpringBoot 项目中没有我们之前常规 web 开发的 WebContent（WebApp），它只有 src 目录。

在 src/main/resources 下面有两个文件夹，static 和 templates。

SpringBoot 默认在 static 目录中存放静态页面，而 templates 中放动态页面。

## 1.static 目录

Spring Boot 通过 classpath/static 目录访问静态资源。注意存放静态资源的目录名称必须是 static。

## 2.templates 目录

在 Spring Boot 中不推荐使用 jsp 作为视图层技术，而是默认使用 Thymeleaf 来做动态页面。

Templates 目录这是存放 Thymeleaf 的页面

## 3.静态资源存放其他位置

- classpath:/META‐INF/resources/
- classpath:/resources/
- classpath:/static/
- classpath:/public/

## 4.自定义静态资源位置

```java
spring.resources.static-locations=classpath:/suibian/,classpath:/static/
```
