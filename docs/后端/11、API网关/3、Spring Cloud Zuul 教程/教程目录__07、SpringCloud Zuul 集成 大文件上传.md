# 07、SpringCloud Zuul 集成 大文件上传
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudzuul/7.html
- 分类：API网关
- 分组：教程目录
正常情况下，我们使用普通的响应层（如SpringMVC）框架，是可以上传任意大小的文件的。在SpringMVC，是通过其“multipartResolver”这个Bean的设置，指定其“MaxUploadSize”参数的具体数字，来控制上传文件的具体大小的。

Zuul作为服务网关的情况下，也是可以上传文件的，Zuul在做文件上传的时候，只支持小文件的上传（1M以内），大文件（10M以上）上传会则报错，这是Zuul对文件上传的默认的设置。

**新建一个上传项目：ms-zuul-fileupload**

## 1、 pom文件：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-zuul</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-eureka</artifactId>
</dependency>
```

## 2、 修改配置文件

```sh
server:
  port: 8009
spring:
  application:
    name: ms-zuul-fileupload
  servlet:
      multipart:
        max-file-size: 500Mb      # Max file size，默认1M
        max-request-size: 1000Mb   # Max request size，默认10M
eureka:
  client:
    healthcheck:
      enabled: true
    serviceUrl:
      defaultZone: http://ljf:123@localhost:8761/eureka
  instance:
    prefer-ip-address: true
    instance-id: ${spring.application.name}:${spring.cloud.client.ipAddress}:${spring.application.instance_id:${server.port}}
turbine:
  aggregator:
    clusterConfig: ljf-turbine,ljf-feigin
  app-config: ms-hystrix-consumer,ms-fegin-consumer
  cluster-name-expression: metadata['cluster']
  combine-host-port: true
#设置查看指标
management:
  endpoint:
    health:
      show-details: always
  endpoints:
    web:
      exposure:
        include: "*"
```

## 3、 controller:

```java
package com.ljf.weifuwu.springcloud.fileupload.zuul.controller;
import org.springframework.stereotype.Controller;
import org.springframework.util.FileCopyUtils;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
@Controller
public class FileUploadController {
 /**
    * 上传文件
    * ps.该示例比较简单，没有做IO异常、文件大小、文件非空等处理
    * @param file 待上传的文件
    * @return 文件在服务器上的绝对路径
    * @throws IOException IO异常
    */
 @RequestMapping(value = "/zuul-Upload", method = RequestMethod.POST)
 public @ResponseBody String handleFileUpload(@RequestParam(value = "zuulFile", required = true) MultipartFile file) throws IOException {
     System.out.println("上传功能，controller!!!!");
     byte[] bytes = file.getBytes();
     File fileToSave = new File(file.getOriginalFilename());
     FileCopyUtils.copy(bytes, fileToSave);
     System.out.println("文件上传存储路径:"+fileToSave.getAbsolutePath());
     return fileToSave.getAbsolutePath();
 }
}
```

## 4、 启动类：

```java
package com.ljf.weifuwu.springcloud.fileupload.zuul;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
/**
 * Hello world!
 *
 */
@SpringBootApplication
@EnableEurekaClient
public class ZuulFileUploadApp
{
    public static void main( String[] args )
    {
        SpringApplication.run(ZuulFileUploadApp.class, args);
        System.out.println( "zuul-fileupload启动起来了!" );
    }
}
```

## 5、 index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>zuul实现上传文件页面</title>
</head>
<body>
<div style="width:800px;height:300px;border:1px solid red">
    <span>
         <form method="POST" enctype="multipart/form-data" action="/zuul-Upload"> 
               <span style="width:100px;"> 请选择上传的文件</span>:<span style="width:300px;"><input type="file" name="zuulFile"></span>
                  <span>提交： <input type="submit" value="Upload"></span>
        </form>
    </span>
</div>
</body>
</html>
```

## 6、 启动服务：ms-eureka-center(8761)、ms-zuul-consumer(8008)、ms-zuul-fileupload(8009)；

**6、** 直接访问ms-zuul-fileupload进行访问：

**6、** 1上传一个小文件871kb；

上传成功！！！

## 7、 通过zuul进行上传

在index.hmtl中的action跳转路径改为：http://localhost:8008/user-fileupload/zuul-Upload

在启动类中加： multipartConfigElement()方法

```java
package com.ljf.weifuwu.springcloud.fileupload.zuul;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.servlet.MultipartConfigFactory;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
import org.springframework.context.annotation.Bean;
import javax.servlet.MultipartConfigElement;
/**
 * Hello world!
 *
 */
@SpringBootApplication
@EnableEurekaClient
public class ZuulFileUploadApp
{
    /**
     * 文件上传配置
     *
     * @return
     */
    @Bean
    public MultipartConfigElement multipartConfigElement() {
        MultipartConfigFactory factory = new MultipartConfigFactory();
        //  单个数据大小
        factory.setMaxFileSize("500000KB"); // KB,MB
        /// 总上传数据大小
        factory.setMaxRequestSize("1000000KB");
        return factory.createMultipartConfig();
    }
    public static void main( String[] args )
    {
        SpringApplication.run(ZuulFileUploadApp.class, args);
        System.out.println( "zuul-fileupload启动起来了!" );
    }
}
```

还是上传不成功，需要对网关项目进行配置，在网关项目ms-zuul-consumer，添加要访问的项目

在启动类上加配置： multipartConfigElement()方法

```java
package com.ljf.weifuwu.springcloud.zuul;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.servlet.MultipartConfigFactory;
import org.springframework.cloud.netflix.zuul.EnableZuulProxy;
import org.springframework.context.annotation.Bean;
import javax.servlet.MultipartConfigElement;
/**
 * Hello world!
 *
 */
@SpringBootApplication
@EnableZuulProxy
public class ZuulConsumerApp
{
    /**
     * 文件上传配置
     *
     * @return
     */
    @Bean
    public MultipartConfigElement multipartConfigElement() {
        MultipartConfigFactory factory = new MultipartConfigFactory();
        //  单个数据大小
        factory.setMaxFileSize("500000KB"); // KB,MB
        /// 总上传数据大小
        factory.setMaxRequestSize("1000000KB");
        return factory.createMultipartConfig();
    }
    public static void main(String args[]){
    SpringApplication.run(ZuulConsumerApp.class, args);
    System.out.println( "zuul启动起来了!" );
}
}
```

再次启动：然后上传： 页面提示超时错误，但是后端已经上传成功！

通过上面的报错“microservice-file-upload timed-out and no fallback available.”我们可以了解到，主要原因还是因为请求处理超时，并且没有响应我们在上传大文件时，会因为上传时间过长，而导致hystrix认为该请求无响应，最终给客户端反馈了超时并没有响应的异常，我们只需在网关项目ms-zuul-consumer的application的配置文件中，提升hystrix的超时时间即可：

```js
hystrix.command.default.execution.isolation.thread.timeoutInMilliseconds: 60000
ribbon:
  ConnectTimeout: 3000
  ReadTimeout: 60000
```

如截图：

再次上传后：可以看到页面的提示了，返回了正确的上传路径。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
