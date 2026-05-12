# 02、SpringBoot 实战 - 使用视图解析器 Thymeleaf
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/5/2.html
- 分类：J2EE框架
- 分组：教程目录
## Controller

```java
@GetMapping(value = "/")
public String index() {
    return "index";
}
```

## index.html

```xml
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Test</title>
    <script src="https://code.jquery.com/jquery-3.1.1.min.js"></script>
</head>
<body>
    <center><h1>这是一个测试</h1></center>
</body>
</html>
```

## application.yml

```java
server:
  port: 8080
  servlet:
    context-path: / 项目路径
spring:
  mvc:
    view:
      prefix: /templates/
      suffix: .html
```

## Maven 坐标

```xml
<!-- Thymeleaf -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-thymeleaf</artifactId>
</dependency>
```

## 运行

> 效果如下图所示:

## 注意

Controller 不要使用 @RestController、@ResponseBody 等注解，这两个注解会阻拦 thymeleaf 将 String 类型解析为页面。
