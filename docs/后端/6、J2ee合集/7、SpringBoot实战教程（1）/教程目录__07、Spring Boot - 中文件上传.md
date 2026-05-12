# 07、Spring Boot - 中文件上传
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/4/7.html
- 分类：J2EE框架
- 分组：教程目录
## 1.创建项目

详细创建步骤参考博文：[传送门！！！](/zhuanlan/j2ee/springboot/4/2.html)

## 2.POM 文件

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.3.1.RELEASE</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
    <groupId>com.dqcgm</groupId>
    <artifactId>springbootfileupload</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>springbootfileupload</name>
    <description>Demo project for Spring Boot</description>
    <properties>
        <java.version>1.8</java.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
            <exclusions>
                <exclusion>
                    <groupId>org.junit.vintage</groupId>
                    <artifactId>junit-vintage-engine</artifactId>
                </exclusion>
            </exclusions>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

## 3.启动类

```java
package com.dqcgm.springbootfileupload;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
@SpringBootApplication
public class SpringbootfileuploadApplication {
    public static void main(String[] args) {
        SpringApplication.run(SpringbootfileuploadApplication.class, args);
    }
}
```

## 4.编写上传页面

```xml
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>UPLOAD</title>
</head>
<body>
    <form action="fileUploadController" method="post" enctype="multipart/form-data">
        <input type="file" name="file">
        <input type="submit" value="upload">
    </form>
</body>
</html>
```

## 5.编写 Controller

```java
package com.dqcgm.springbootfileupload.controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
@RestController
public class FileUploadController {
    @PostMapping("fileUploadController")
    public String fileUplad(MultipartFile file) throws Exception{
        System.out.println(file.getOriginalFilename());
        file.transferTo(new File("c:/"+file.getOriginalFilename()));
        return "OK";
    }
}
```

## 6.修改上传文件大小

```java
#配置单个上传文件的大小的限制
spring.servlet.multipart.max-file-size=2MB
#配置在一次请求中上传文件的总容量的限制
spring.servlet.multipart.max-request-size=20MB
```

运行结果：

源文件：

控制台输出：

C盘输入：
