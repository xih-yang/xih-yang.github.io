# 04、Spring Boot - 中编写 HelloWorld
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/4/4.html
- 分类：J2EE框架
- 分组：教程目录
## 1.创建项目

具体步骤详见：

[三种创建Spring Boot的方式](/zhuanlan/j2ee/springboot/4/2.html)

本次使用咋IDEA内用maven创建项目

## 2.修改 Tomcat 端口

在resources中创建Application.yml

## 3.创建启动类

```java
package com.dqcgm.springboothelloword;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
@SpringBootApplication
public class SpringBoothellowordApplication {
    public static void main(String[] args) {
        SpringApplication.run(SpringBoothellowordApplication.class,args);
    }
}
```

## 4.创建 Controller

```java
package com.dqcgm.springboothelloword.controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
@RestController //@Controller+@ResponsBody 直接返回字符串
public class HelloWorldController {
    @RequestMapping("/helloword")
    public String showHellowWorld(){
        return "HelloWord";
    }
}
```

运行结果：

## 5.Spring Boot 在 Controller 中常用注解

- @RestController

@RestController 相当于@Controller+@ResponseBody 注解

如果使用@RestController 注解 Controller 中的方法无法返回页面，相当于在方法上面自动加了 @ResponseBody 注解 ，所以没办法跳转并传输数据到另一个页面，所以 InternalResourceViewResolver 也不起作用，返回的内容就是 Return 里的内容。
- @GetMapping

@GetMapping 注解是@RequestMapping(method = RequestMethod.GET)的缩写
- @PostMapping

@PostMapping 注解是@RequestMapping(method = RequestMethod.POST)的缩写。
- @PutMapping

@PutMapping 注解是@RequestMapping(method = RequestMethod.PUT)的缩写
- @DeleteMapping

@DeleteMapping 注解是@RequestMapping(method = RequestMethod.DELETE)的缩写。
