# 40、Spring Boot 4 整合 邮件 完整教程
- 来源：https://ddkk.com/springboot/4-action/40.html
- 分类：Spring Boot 4 整合教程
- 分组：十、其他常用
- 日期：2025-12-08
发邮件的时候最烦的就是用第三方服务,阿里云邮件推送、腾讯云邮件这些都要钱,而且API还不统一,换一家就得改代码,累死累活还容易出错;其实Spring Mail这玩意儿不错,是Spring Framework提供的邮件发送功能,基于JavaMail API,支持SMTP、HTML邮件、附件、模板,功能全、可靠性高、兼容性好,是业界最广泛采用的Java邮件解决方案;但是直接用JavaMail写,那叫一个复杂,配置SMTP、写Java代码、处理MIME消息、管理连接,一堆配置写得人头疼;后来发现Spring Boot直接把这些都封装好了,用起来贼简单;现在Spring Boot 4出来了,整合邮件更是方便得不行,Spring Mail自动配置给你整得明明白白,零配置就能用;但是很多兄弟不知道里面的门道,也不知道咋配置SMTP服务器、发送简单邮件、发送HTML邮件、添加附件、使用模板这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

其实Spring Mail在Spring Boot里早就支持了,你只要加个`spring-boot-starter-mail`依赖,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋配置JavaMailSender、发送简单邮件、发送HTML邮件、添加附件、使用邮件模板、异步发送这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

## Spring Mail基础概念

### Spring Mail是啥玩意儿

Spring Mail是Spring Framework提供的邮件发送功能,基于JavaMail API,提供了简单易用的邮件发送接口;Spring Mail的核心特性包括:

1. **简单易用**: 提供了`JavaMailSender`接口,简化邮件发送
2. **多种邮件类型**: 支持简单文本邮件、HTML邮件、带附件邮件
3. **模板支持**: 支持Thymeleaf、FreeMarker等模板引擎
4. **异步发送**: 支持异步发送邮件,不阻塞主线程
5. **自动配置**: Spring Boot自动配置JavaMailSender,零配置就能用
6. **多种SMTP服务器**: 支持各种SMTP服务器,如QQ邮箱、163邮箱、Gmail等
7. **SSL/TLS支持**: 支持SSL/TLS加密传输

### Spring Mail和JavaMail的关系

1. **封装关系**: Spring Mail是对JavaMail API的封装,提供更简单的接口
2. **底层实现**: Spring Mail底层使用JavaMail API发送邮件
3. **简化操作**: Spring Mail简化了JavaMail的复杂操作,如MimeMessage创建
4. **Spring集成**: Spring Mail与Spring框架深度集成,支持依赖注入

### Spring Mail的核心概念

1. **JavaMailSender**: Spring Mail的核心接口,用于发送邮件
2. **SimpleMailMessage**: 简单文本邮件消息
3. **MimeMessage**: MIME格式邮件消息,支持HTML、附件等
4. **MimeMessageHelper**: 辅助类,简化MimeMessage的创建
5. **SMTP服务器**: 邮件发送服务器,如smtp.qq.com、smtp.163.com
6. **SMTP端口**: SMTP服务器端口,如25、465、587
7. **SSL/TLS**: 安全传输协议,用于加密邮件传输

### Spring Mail适用场景

1. **用户注册**: 发送注册验证邮件
2. **密码重置**: 发送密码重置链接
3. **订单通知**: 发送订单确认邮件
4. **系统通知**: 发送系统通知邮件
5. **营销邮件**: 发送营销推广邮件
6. **报表邮件**: 定时发送报表邮件

## 项目搭建和依赖配置

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-mail-demo/
├── pom.xml                          # Maven配置文件
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── demo/
│   │   │               ├── Application.java          # 启动类
│   │   │               ├── entity/                   # 实体类目录
│   │   │               ├── dto/                      # 数据传输对象目录
│   │   │               ├── service/                  # 服务层目录
│   │   │               ├── controller/               # 控制器目录
│   │   │               └── config/                   # 配置类目录
│   │   └── resources/
│   │       ├── application.yml       # 配置文件
│   │       └── templates/            # 邮件模板目录
│   └── test/
└── README.md
```

### 添加Maven依赖

这是最关键的,依赖配置不对后面全是坑;Spring Boot 4需要Java 17以上,而且Spring Mail最新版本已经支持Spring Boot 4了。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <!-- 继承Spring Boot父POM,统一管理版本 -->
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>4.0.0</version>  <!-- Spring Boot 4.0版本 -->
        <relativePath/>
    </parent>
    <groupId>com.example</groupId>
    <artifactId>spring-boot-mail-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 Mail Demo</name>
    <description>Spring Boot 4整合邮件示例项目</description>
    <properties>
        <java.version>17</java.version>  <!-- Java 17以上 -->
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>
    <dependencies>
        <!-- Spring Boot Web Starter: 包含Spring MVC、Tomcat等 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!-- Spring Boot Mail Starter: 邮件发送支持 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-mail</artifactId>
        </dependency>
        <!-- Spring Boot Thymeleaf Starter: 邮件模板支持(可选) -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-thymeleaf</artifactId>
        </dependency>
        <!-- Spring Boot Configuration Processor: 配置属性提示 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-configuration-processor</artifactId>
            <optional>true</optional>
        </dependency>
        <!-- Spring Boot Test: 测试支持 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <!-- Lombok: 简化Java代码(可选,但强烈推荐) -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <!-- Spring Boot Maven插件: 打包成可执行JAR -->
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

### 基础配置文件

在`application.yml`中添加基础配置:

```yaml
server:
  port: 8080  # 服务端口
spring:
  application:
    name: spring-boot-mail-demo  # 应用名称
  # 邮件配置
  mail:
    host: smtp.qq.com  # SMTP服务器地址
    port: 587  # SMTP端口,QQ邮箱使用587
    username: your-email@qq.com  # 发送邮件的邮箱地址
    password: your-auth-code  # 邮箱授权码(不是登录密码)
    default-encoding: UTF-8  # 默认编码
    # SMTP属性配置
    properties:
      mail:
        smtp:
          auth: true  # 需要认证
          starttls:
            enable: true  # 启用STARTTLS
            required: true  # 要求STARTTLS
          connectiontimeout: 5000  # 连接超时时间(毫秒)
          timeout: 5000  # 读取超时时间(毫秒)
          writetimeout: 5000  # 写入超时时间(毫秒)
    # 发件人配置
    from: your-email@qq.com  # 默认发件人地址
```

## 常见邮件服务商配置

### QQ邮箱配置

QQ邮箱是最常用的邮件服务商之一:

```yaml
spring:
  mail:
    host: smtp.qq.com
    port: 587  # 或465(SSL)
    username: your-email@qq.com
    password: your-auth-code  # 需要在QQ邮箱设置中获取授权码
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
            required: true
```

**获取QQ邮箱授权码**:

1. 登录QQ邮箱
2. 点击"设置" > "账户"
3. 找到"POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务"
4. 开启"POP3/SMTP服务"或"IMAP/SMTP服务"
5. 点击"生成授权码",获取授权码

### 163邮箱配置

163邮箱配置:

```yaml
spring:
  mail:
    host: smtp.163.com
    port: 25  # 或465(SSL),587(TLS)
    username: your-email@163.com
    password: your-auth-code  # 需要在163邮箱设置中获取授权码
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
            required: true
```

### Gmail配置

Gmail配置(需要应用专用密码):

```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: your-email@gmail.com
    password: your-app-password  # Gmail应用专用密码
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
            required: true
```

### 企业邮箱配置

企业邮箱配置(以腾讯企业邮箱为例):

```yaml
spring:
  mail:
    host: smtp.exmail.qq.com
    port: 465  # 或587
    username: your-email@company.com
    password: your-password
    properties:
      mail:
        smtp:
          auth: true
          ssl:
            enable: true  # 如果使用465端口,需要启用SSL
          starttls:
            enable: true  # 如果使用587端口,需要启用STARTTLS
            required: true
```

## 简单邮件发送

### 创建邮件服务

创建邮件服务,发送简单文本邮件:

```java
package com.example.demo.service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
/**
 * 邮件发送服务
 */
@Slf4j
@Service
public class MailService {
    @Autowired
    private JavaMailSender mailSender;
    @Value("${spring.mail.from}")
    private String from;
    /**
     * 发送简单文本邮件
     * 
     * @param to 收件人地址
     * @param subject 邮件主题
     * @param content 邮件内容
     */
    public void sendSimpleMail(String to, String subject, String content) {
        try {
            // 创建简单邮件消息
            SimpleMailMessage message = new SimpleMailMessage();
            // 设置发件人
            message.setFrom(from);
            // 设置收件人
            message.setTo(to);
            // 设置邮件主题
            message.setSubject(subject);
            // 设置邮件内容
            message.setText(content);
            // 发送邮件
            mailSender.send(message);
            log.info("简单邮件发送成功: {} -> {}", from, to);
        } catch (Exception e) {
            log.error("简单邮件发送失败: {}", e.getMessage(), e);
            throw new RuntimeException("邮件发送失败: " + e.getMessage(), e);
        }
    }
    /**
     * 发送简单文本邮件(多个收件人)
     * 
     * @param to 收件人地址数组
     * @param subject 邮件主题
     * @param content 邮件内容
     */
    public void sendSimpleMail(String[] to, String subject, String content) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(content);
            mailSender.send(message);
            log.info("简单邮件发送成功: {} -> {}", from, String.join(",", to));
        } catch (Exception e) {
            log.error("简单邮件发送失败: {}", e.getMessage(), e);
            throw new RuntimeException("邮件发送失败: " + e.getMessage(), e);
        }
    }
    /**
     * 发送简单文本邮件(带抄送和密送)
     * 
     * @param to 收件人地址
     * @param cc 抄送地址
     * @param bcc 密送地址
     * @param subject 邮件主题
     * @param content 邮件内容
     */
    public void sendSimpleMail(String to, String[] cc, String[] bcc, String subject, String content) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(to);
            message.setCc(cc);  // 抄送
            message.setBcc(bcc);  // 密送
            message.setSubject(subject);
            message.setText(content);
            mailSender.send(message);
            log.info("简单邮件发送成功: {} -> {}", from, to);
        } catch (Exception e) {
            log.error("简单邮件发送失败: {}", e.getMessage(), e);
            throw new RuntimeException("邮件发送失败: " + e.getMessage(), e);
        }
    }
}
```

## HTML邮件发送

### 发送HTML邮件

发送HTML格式的邮件:

```java
package com.example.demo.service;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
/**
 * HTML邮件发送服务
 */
@Slf4j
@Service
public class HtmlMailService {
    @Autowired
    private JavaMailSender mailSender;
    @Value("${spring.mail.from}")
    private String from;
    /**
     * 发送HTML邮件
     * 
     * @param to 收件人地址
     * @param subject 邮件主题
     * @param htmlContent HTML内容
     */
    public void sendHtmlMail(String to, String subject, String htmlContent) {
        try {
            // 创建MIME消息
            MimeMessage message = mailSender.createMimeMessage();
            // 创建MimeMessageHelper,true表示支持多部分消息
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            // 设置发件人
            helper.setFrom(from);
            // 设置收件人
            helper.setTo(to);
            // 设置邮件主题
            helper.setSubject(subject);
            // 设置HTML内容,true表示内容是HTML
            helper.setText(htmlContent, true);
            // 发送邮件
            mailSender.send(message);
            log.info("HTML邮件发送成功: {} -> {}", from, to);
        } catch (Exception e) {
            log.error("HTML邮件发送失败: {}", e.getMessage(), e);
            throw new RuntimeException("HTML邮件发送失败: " + e.getMessage(), e);
        }
    }
    /**
     * 发送HTML邮件(带纯文本备用)
     * 
     * @param to 收件人地址
     * @param subject 邮件主题
     * @param textContent 纯文本内容
     * @param htmlContent HTML内容
     */
    public void sendHtmlMail(String to, String subject, String textContent, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            // 设置纯文本和HTML内容
            helper.setText(textContent, htmlContent);
            mailSender.send(message);
            log.info("HTML邮件发送成功: {} -> {}", from, to);
        } catch (Exception e) {
            log.error("HTML邮件发送失败: {}", e.getMessage(), e);
            throw new RuntimeException("HTML邮件发送失败: " + e.getMessage(), e);
        }
    }
}
```

## 带附件的邮件

### 发送带附件的邮件

发送带附件的邮件:

```java
package com.example.demo.service;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import lombok.extern.slf4j.Slf4j;
import java.io.File;
/**
 * 附件邮件发送服务
 */
@Slf4j
@Service
public class AttachmentMailService {
    @Autowired
    private JavaMailSender mailSender;
    @Value("${spring.mail.from}")
    private String from;
    /**
     * 发送带附件的邮件
     * 
     * @param to 收件人地址
     * @param subject 邮件主题
     * @param content 邮件内容
     * @param filePath 附件文件路径
     * @param fileName 附件显示名称
     */
    public void sendMailWithAttachment(String to, String subject, String content, 
                                       String filePath, String fileName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            // true表示支持多部分消息(附件)
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(content);
            // 添加附件
            FileSystemResource file = new FileSystemResource(new File(filePath));
            helper.addAttachment(fileName, file);
            mailSender.send(message);
            log.info("带附件邮件发送成功: {} -> {}, 附件: {}", from, to, fileName);
        } catch (Exception e) {
            log.error("带附件邮件发送失败: {}", e.getMessage(), e);
            throw new RuntimeException("带附件邮件发送失败: " + e.getMessage(), e);
        }
    }
    /**
     * 发送带多个附件的邮件
     * 
     * @param to 收件人地址
     * @param subject 邮件主题
     * @param content 邮件内容
     * @param attachments 附件文件列表
     */
    public void sendMailWithAttachments(String to, String subject, String content, 
                                        java.util.List<java.util.Map<String, String>> attachments) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(content);
            // 添加多个附件
            for (java.util.Map<String, String> attachment : attachments) {
                String filePath = attachment.get("filePath");
                String fileName = attachment.get("fileName");
                FileSystemResource file = new FileSystemResource(new File(filePath));
                helper.addAttachment(fileName, file);
            }
            mailSender.send(message);
            log.info("带多个附件邮件发送成功: {} -> {}, 附件数量: {}", from, to, attachments.size());
        } catch (Exception e) {
            log.error("带多个附件邮件发送失败: {}", e.getMessage(), e);
            throw new RuntimeException("带多个附件邮件发送失败: " + e.getMessage(), e);
        }
    }
    /**
     * 发送带MultipartFile附件的邮件
     * 
     * @param to 收件人地址
     * @param subject 邮件主题
     * @param content 邮件内容
     * @param file 附件文件
     */
    public void sendMailWithMultipartFile(String to, String subject, String content, 
                                          MultipartFile file) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(content);
            // 添加MultipartFile附件
            helper.addAttachment(file.getOriginalFilename(), file);
            mailSender.send(message);
            log.info("带MultipartFile附件邮件发送成功: {} -> {}, 附件: {}", 
                    from, to, file.getOriginalFilename());
        } catch (Exception e) {
            log.error("带MultipartFile附件邮件发送失败: {}", e.getMessage(), e);
            throw new RuntimeException("带MultipartFile附件邮件发送失败: " + e.getMessage(), e);
        }
    }
}
```

## 带内联资源的邮件

### 发送带内联图片的邮件

发送带内联图片的HTML邮件:

```java
package com.example.demo.service;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
import java.io.File;
/**
 * 内联资源邮件发送服务
 */
@Slf4j
@Service
public class InlineResourceMailService {
    @Autowired
    private JavaMailSender mailSender;
    @Value("${spring.mail.from}")
    private String from;
    /**
     * 发送带内联图片的HTML邮件
     * 
     * @param to 收件人地址
     * @param subject 邮件主题
     * @param htmlContent HTML内容(包含cid:imageId)
     * @param imagePath 图片文件路径
     * @param imageId 图片内容ID
     */
    public void sendMailWithInlineImage(String to, String subject, String htmlContent, 
                                        String imagePath, String imageId) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            // 设置HTML内容
            helper.setText(htmlContent, true);
            // 添加内联图片
            FileSystemResource image = new FileSystemResource(new File(imagePath));
            helper.addInline(imageId, image);
            mailSender.send(message);
            log.info("带内联图片邮件发送成功: {} -> {}", from, to);
        } catch (Exception e) {
            log.error("带内联图片邮件发送失败: {}", e.getMessage(), e);
            throw new RuntimeException("带内联图片邮件发送失败: " + e.getMessage(), e);
        }
    }
    /**
     * 发送带多个内联资源的HTML邮件
     * 
     * @param to 收件人地址
     * @param subject 邮件主题
     * @param htmlContent HTML内容
     * @param inlineResources 内联资源列表
     */
    public void sendMailWithInlineResources(String to, String subject, String htmlContent, 
                                            java.util.List<java.util.Map<String, String>> inlineResources) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            // 添加多个内联资源
            for (java.util.Map<String, String> resource : inlineResources) {
                String resourcePath = resource.get("resourcePath");
                String resourceId = resource.get("resourceId");
                FileSystemResource file = new FileSystemResource(new File(resourcePath));
                helper.addInline(resourceId, file);
            }
            mailSender.send(message);
            log.info("带多个内联资源邮件发送成功: {} -> {}", from, to);
        } catch (Exception e) {
            log.error("带多个内联资源邮件发送失败: {}", e.getMessage(), e);
            throw new RuntimeException("带多个内联资源邮件发送失败: " + e.getMessage(), e);
        }
    }
}
```

## 邮件模板

### 使用Thymeleaf模板

使用Thymeleaf模板生成HTML邮件:

```java
package com.example.demo.service;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import lombok.extern.slf4j.Slf4j;
import java.util.Map;
/**
 * 模板邮件发送服务
 */
@Slf4j
@Service
public class TemplateMailService {
    @Autowired
    private JavaMailSender mailSender;
    @Autowired
    private TemplateEngine templateEngine;
    @Value("${spring.mail.from}")
    private String from;
    /**
     * 发送Thymeleaf模板邮件
     * 
     * @param to 收件人地址
     * @param subject 邮件主题
     * @param templateName 模板名称(如"welcome.html")
     * @param variables 模板变量
     */
    public void sendTemplateMail(String to, String subject, String templateName, 
                                 Map<String, Object> variables) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            // 创建Thymeleaf上下文
            Context context = new Context();
            if (variables != null) {
                context.setVariables(variables);
            }
            // 渲染模板
            String htmlContent = templateEngine.process(templateName, context);
            // 设置HTML内容
            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("模板邮件发送成功: {} -> {}, 模板: {}", from, to, templateName);
        } catch (Exception e) {
            log.error("模板邮件发送失败: {}", e.getMessage(), e);
            throw new RuntimeException("模板邮件发送失败: " + e.getMessage(), e);
        }
    }
}
```

### 创建邮件模板

创建Thymeleaf邮件模板,放在`src/main/resources/templates/email/`目录下:

**welcome.html**:

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <title>欢迎邮件</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #4CAF50;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .content {
            padding: 20px;
            background-color: #f9f9f9;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>欢迎加入我们!</h1>
        </div>
        <div class="content">
            <p>亲爱的 <span th:text="${username}">用户</span>,</p>
            <p>感谢您注册我们的服务!</p>
            <p>您的注册信息:</p>
            <ul>
                <li>用户名: <span th:text="${username}"></span></li>
                <li>邮箱: <span th:text="${email}"></span></li>
                <li>注册时间: <span th:text="${registerTime}"></span></li>
            </ul>
            <p>如有任何问题,请随时联系我们。</p>
        </div>
        <div class="footer">
            <p>© 2024 公司名称. 保留所有权利.</p>
        </div>
    </div>
</body>
</html>
```

## 控制器实现

### 邮件发送控制器

创建邮件发送控制器:

```java
package com.example.demo.controller;
import com.example.demo.service.MailService;
import com.example.demo.service.HtmlMailService;
import com.example.demo.service.AttachmentMailService;
import com.example.demo.service.TemplateMailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.HashMap;
import java.util.Map;
/**
 * 邮件发送控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/mail")
public class MailController {
    @Autowired
    private MailService mailService;
    @Autowired
    private HtmlMailService htmlMailService;
    @Autowired
    private AttachmentMailService attachmentMailService;
    @Autowired
    private TemplateMailService templateMailService;
    /**
     * 发送简单文本邮件
     */
    @PostMapping("/simple")
    public ResponseEntity<Map<String, Object>> sendSimpleMail(
            @RequestParam String to,
            @RequestParam String subject,
            @RequestParam String content) {
        Map<String, Object> result = new HashMap<>();
        try {
            mailService.sendSimpleMail(to, subject, content);
            result.put("success", true);
            result.put("message", "邮件发送成功");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("邮件发送失败: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("message", "邮件发送失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(result);
        }
    }
    /**
     * 发送HTML邮件
     */
    @PostMapping("/html")
    public ResponseEntity<Map<String, Object>> sendHtmlMail(
            @RequestParam String to,
            @RequestParam String subject,
            @RequestParam String htmlContent) {
        Map<String, Object> result = new HashMap<>();
        try {
            htmlMailService.sendHtmlMail(to, subject, htmlContent);
            result.put("success", true);
            result.put("message", "HTML邮件发送成功");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("HTML邮件发送失败: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("message", "HTML邮件发送失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(result);
        }
    }
    /**
     * 发送带附件的邮件
     */
    @PostMapping("/attachment")
    public ResponseEntity<Map<String, Object>> sendMailWithAttachment(
            @RequestParam String to,
            @RequestParam String subject,
            @RequestParam String content,
            @RequestParam("file") MultipartFile file) {
        Map<String, Object> result = new HashMap<>();
        try {
            attachmentMailService.sendMailWithMultipartFile(to, subject, content, file);
            result.put("success", true);
            result.put("message", "带附件邮件发送成功");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("带附件邮件发送失败: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("message", "带附件邮件发送失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(result);
        }
    }
    /**
     * 发送模板邮件
     */
    @PostMapping("/template")
    public ResponseEntity<Map<String, Object>> sendTemplateMail(
            @RequestParam String to,
            @RequestParam String subject,
            @RequestParam String templateName,
            @RequestBody Map<String, Object> variables) {
        Map<String, Object> result = new HashMap<>();
        try {
            templateMailService.sendTemplateMail(to, subject, templateName, variables);
            result.put("success", true);
            result.put("message", "模板邮件发送成功");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("模板邮件发送失败: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("message", "模板邮件发送失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(result);
        }
    }
}
```

## 异步邮件发送

### 配置异步邮件发送

对于大量邮件发送,使用异步发送提高性能:

```java
package com.example.demo.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import java.util.concurrent.Executor;
/**
 * 异步配置
 */
@Configuration
@EnableAsync
public class AsyncConfig {
    /**
     * 配置异步邮件发送线程池
     */
    @Bean(name = "mailExecutor")
    public Executor mailExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        // 核心线程数
        executor.setCorePoolSize(5);
        // 最大线程数
        executor.setMaxPoolSize(10);
        // 队列容量
        executor.setQueueCapacity(100);
        // 线程名前缀
        executor.setThreadNamePrefix("mail-async-");
        // 拒绝策略: 调用者运行
        executor.setRejectedExecutionHandler(new java.util.concurrent.ThreadPoolExecutor.CallerRunsPolicy());
        // 初始化
        executor.initialize();
        return executor;
    }
}
```

### 异步邮件服务

创建异步邮件发送服务:

```java
package com.example.demo.service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
import java.util.concurrent.CompletableFuture;
/**
 * 异步邮件发送服务
 */
@Slf4j
@Service
public class AsyncMailService {
    @Autowired
    private JavaMailSender mailSender;
    @Value("${spring.mail.from}")
    private String from;
    /**
     * 异步发送简单邮件
     * 
     * @param to 收件人地址
     * @param subject 邮件主题
     * @param content 邮件内容
     * @return CompletableFuture
     */
    @Async("mailExecutor")
    public CompletableFuture<Void> sendSimpleMailAsync(String to, String subject, String content) {
        return CompletableFuture.runAsync(() -> {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(from);
                message.setTo(to);
                message.setSubject(subject);
                message.setText(content);
                mailSender.send(message);
                log.info("异步邮件发送成功: {} -> {}", from, to);
            } catch (Exception e) {
                log.error("异步邮件发送失败: {}", e.getMessage(), e);
                throw new RuntimeException("异步邮件发送失败: " + e.getMessage(), e);
            }
        });
    }
    /**
     * 批量异步发送邮件
     * 
     * @param recipients 收件人列表
     * @param subject 邮件主题
     * @param content 邮件内容
     */
    @Async("mailExecutor")
    public void sendBatchMailAsync(java.util.List<String> recipients, String subject, String content) {
        for (String to : recipients) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(from);
                message.setTo(to);
                message.setSubject(subject);
                message.setText(content);
                mailSender.send(message);
                log.info("批量异步邮件发送成功: {} -> {}", from, to);
            } catch (Exception e) {
                log.error("批量异步邮件发送失败: {} -> {}, 错误: {}", from, to, e.getMessage(), e);
            }
        }
    }
}
```

## 实际应用场景

### 用户注册邮件

发送用户注册验证邮件:

```java
package com.example.demo.service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import lombok.extern.slf4j.Slf4j;
import jakarta.mail.internet.MimeMessage;
import java.util.HashMap;
import java.util.Map;
/**
 * 用户注册邮件服务
 */
@Slf4j
@Service
public class UserRegistrationMailService {
    @Autowired
    private JavaMailSender mailSender;
    @Autowired
    private TemplateEngine templateEngine;
    @Value("${spring.mail.from}")
    private String from;
    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;
    /**
     * 发送用户注册验证邮件
     * 
     * @param email 用户邮箱
     * @param username 用户名
     * @param verificationCode 验证码
     */
    public void sendRegistrationVerificationMail(String email, String username, String verificationCode) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(email);
            helper.setSubject("欢迎注册 - 请验证您的邮箱");
            // 准备模板变量
            Map<String, Object> variables = new HashMap<>();
            variables.put("username", username);
            variables.put("verificationCode", verificationCode);
            variables.put("verificationUrl", baseUrl + "/verify?code=" + verificationCode);
            // 渲染模板
            Context context = new Context();
            context.setVariables(variables);
            String htmlContent = templateEngine.process("email/registration-verification.html", context);
            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("用户注册验证邮件发送成功: {}", email);
        } catch (Exception e) {
            log.error("用户注册验证邮件发送失败: {}", e.getMessage(), e);
            throw new RuntimeException("用户注册验证邮件发送失败: " + e.getMessage(), e);
        }
    }
}
```

### 密码重置邮件

发送密码重置邮件:

```java
package com.example.demo.service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import lombok.extern.slf4j.Slf4j;
import jakarta.mail.internet.MimeMessage;
import java.util.HashMap;
import java.util.Map;
/**
 * 密码重置邮件服务
 */
@Slf4j
@Service
public class PasswordResetMailService {
    @Autowired
    private JavaMailSender mailSender;
    @Autowired
    private TemplateEngine templateEngine;
    @Value("${spring.mail.from}")
    private String from;
    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;
    /**
     * 发送密码重置邮件
     * 
     * @param email 用户邮箱
     * @param username 用户名
     * @param resetToken 重置令牌
     */
    public void sendPasswordResetMail(String email, String username, String resetToken) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(email);
            helper.setSubject("密码重置 - 请重置您的密码");
            // 准备模板变量
            Map<String, Object> variables = new HashMap<>();
            variables.put("username", username);
            variables.put("resetUrl", baseUrl + "/reset-password?token=" + resetToken);
            variables.put("expireMinutes", 30);  // 30分钟过期
            // 渲染模板
            Context context = new Context();
            context.setVariables(variables);
            String htmlContent = templateEngine.process("email/password-reset.html", context);
            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("密码重置邮件发送成功: {}", email);
        } catch (Exception e) {
            log.error("密码重置邮件发送失败: {}", e.getMessage(), e);
            throw new RuntimeException("密码重置邮件发送失败: " + e.getMessage(), e);
        }
    }
}
```

## 最佳实践

1. **邮件服务器配置**: 使用授权码而不是登录密码,提高安全性
2. **编码设置**: 使用UTF-8编码,支持中文邮件
3. **HTML邮件**: 使用HTML邮件提供更好的用户体验
4. **邮件模板**: 使用模板引擎生成邮件内容,便于维护
5. **异步发送**: 大量邮件使用异步发送,不阻塞主线程
6. **错误处理**: 妥善处理邮件发送异常,记录日志
7. **邮件队列**: 对于大量邮件,考虑使用消息队列
8. **邮件测试**: 使用测试邮件服务(如Mailtrap)进行测试
9. **邮件内容**: 避免发送垃圾邮件,遵守相关法律法规
10. **性能优化**: 合理配置线程池,提高邮件发送效率

## 常见问题

### 1. 邮件发送失败

检查SMTP服务器配置是否正确:

```yaml
spring:
  mail:
    host: smtp.qq.com  # 确保地址正确
    port: 587
    username: your-email@qq.com
    password: your-auth-code  # 确保是授权码,不是登录密码
```

### 2. 认证失败

确保使用的是授权码而不是登录密码,检查用户名是否正确。

### 3. 连接超时

增加连接超时时间:

```yaml
spring:
  mail:
    properties:
      mail:
        smtp:
          connectiontimeout: 10000  # 增加到10秒
          timeout: 10000
```

### 4. SSL/TLS错误

根据SMTP服务器要求配置SSL/TLS:

```yaml
spring:
  mail:
    port: 465  # SSL端口
    properties:
      mail:
        smtp:
          ssl:
            enable: true  # 启用SSL
```

### 5. 中文乱码

确保使用UTF-8编码:

```yaml
spring:
  mail:
    default-encoding: UTF-8
```

### 6. HTML邮件显示为文本

确保使用`MimeMessageHelper`并设置`true`参数:

```java
MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
helper.setText(htmlContent, true);  // true表示HTML内容
```

### 7. 附件过大

对于大附件,考虑使用云存储服务,在邮件中提供下载链接。

### 8. 邮件进入垃圾箱

确保邮件内容符合规范,避免触发垃圾邮件过滤器。

### 9. 发送速度慢

使用异步发送,或者使用邮件队列服务。

### 10. 邮件模板找不到

确保模板文件放在`src/main/resources/templates/`目录下。

## 邮件测试

### 使用GreenMail测试

GreenMail是一个用于测试的邮件服务器,可以在本地运行:

```xml
<!-- 添加GreenMail依赖 -->
<dependency>
    <groupId>com.icegreen</groupId>
    <artifactId>greenmail-junit5</artifactId>
    <version>2.0.0</version>
    <scope>test</scope>
</dependency>
```

测试配置:

```java
package com.example.demo;
import com.icegreen.greenmail.configuration.GreenMailConfiguration;
import com.icegreen.greenmail.junit5.GreenMailExtension;
import com.icegreen.greenmail.util.ServerSetupTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.TestPropertySource;
import jakarta.mail.internet.MimeMessage;
import static org.junit.jupiter.api.Assertions.*;
@SpringBootTest
@TestPropertySource(properties = {
    "spring.mail.host=localhost",
    "spring.mail.port=3025",
    "spring.mail.username=test@localhost",
    "spring.mail.password=test"
})
public class MailServiceTest {
    @RegisterExtension
    static GreenMailExtension greenMail = new GreenMailExtension(ServerSetupTest.SMTP)
            .withConfiguration(GreenMailConfiguration.aConfig().withUser("test@localhost", "test"))
            .withPerMethodLifecycle(false);
    @Autowired
    private JavaMailSender mailSender;
    @Test
    public void testSendSimpleMail() throws Exception {
        // 发送邮件
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("sender@localhost");
        message.setTo("recipient@localhost");
        message.setSubject("Test Subject");
        message.setText("Test Content");
        mailSender.send(message);
        // 验证邮件是否收到
        assertTrue(greenMail.waitForIncomingEmail(5000, 1));
        MimeMessage[] receivedMessages = greenMail.getReceivedMessages();
        assertEquals(1, receivedMessages.length);
        assertEquals("Test Subject", receivedMessages[0].getSubject());
    }
}
```

## 邮件队列

### 使用消息队列发送邮件

对于大量邮件,可以使用消息队列(如RabbitMQ、Kafka)进行异步处理:

```java
package com.example.demo.service;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
/**
 * 邮件队列服务
 */
@Slf4j
@Service
public class MailQueueService {
    @Autowired
    private RabbitTemplate rabbitTemplate;
    @Autowired
    private JavaMailSender mailSender;
    @Value("${spring.mail.from}")
    private String from;
    private static final String MAIL_QUEUE = "mail.queue";
    /**
     * 将邮件加入队列
     * 
     * @param to 收件人地址
     * @param subject 邮件主题
     * @param content 邮件内容
     */
    public void enqueueMail(String to, String subject, String content) {
        MailMessage mailMessage = new MailMessage(to, subject, content);
        rabbitTemplate.convertAndSend(MAIL_QUEUE, mailMessage);
        log.info("邮件已加入队列: {} -> {}", from, to);
    }
    /**
     * 监听邮件队列并发送
     */
    @RabbitListener(queues = MAIL_QUEUE)
    public void processMail(MailMessage mailMessage) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(mailMessage.getTo());
            message.setSubject(mailMessage.getSubject());
            message.setText(mailMessage.getContent());
            mailSender.send(message);
            log.info("队列邮件发送成功: {} -> {}", from, mailMessage.getTo());
        } catch (Exception e) {
            log.error("队列邮件发送失败: {}", e.getMessage(), e);
            // 可以加入死信队列或重试
        }
    }
    /**
     * 邮件消息类
     */
    public static class MailMessage {
        private String to;
        private String subject;
        private String content;
        public MailMessage() {}
        public MailMessage(String to, String subject, String content) {
            this.to = to;
            this.subject = subject;
            this.content = content;
        }
        // Getters and Setters
        public String getTo() { return to; }
        public void setTo(String to) { this.to = to; }
        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
    }
}
```

## 邮件发送监控

### 集成Actuator监控

可以集成Spring Boot Actuator监控邮件发送状态:

```java
package com.example.demo.actuator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;
/**
 * 邮件健康检查
 */
@Component
public class MailHealthIndicator implements HealthIndicator {
    @Autowired
    private JavaMailSender mailSender;
    @Override
    public Health health() {
        try {
            // 测试邮件发送器是否可用
            // 这里可以添加更详细的检查逻辑
            return Health.up()
                    .withDetail("status", "邮件服务正常")
                    .withDetail("host", "smtp.qq.com")
                    .build();
        } catch (Exception e) {
            return Health.down()
                    .withDetail("status", "邮件服务异常")
                    .withDetail("error", e.getMessage())
                    .build();
        }
    }
}
```

### 邮件发送统计

记录邮件发送统计信息:

```java
package com.example.demo.service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
import java.util.concurrent.atomic.AtomicLong;
/**
 * 邮件统计服务
 */
@Slf4j
@Service
public class MailStatisticsService {
    @Autowired
    private JavaMailSender mailSender;
    private final AtomicLong successCount = new AtomicLong(0);
    private final AtomicLong failureCount = new AtomicLong(0);
    /**
     * 记录发送成功
     */
    public void recordSuccess() {
        successCount.incrementAndGet();
    }
    /**
     * 记录发送失败
     */
    public void recordFailure() {
        failureCount.incrementAndGet();
    }
    /**
     * 获取统计信息
     */
    public MailStatistics getStatistics() {
        long success = successCount.get();
        long failure = failureCount.get();
        long total = success + failure;
        double successRate = total > 0 ? (double) success / total * 100 : 0;
        return new MailStatistics(success, failure, total, successRate);
    }
    /**
     * 邮件统计信息类
     */
    public static class MailStatistics {
        private final long successCount;
        private final long failureCount;
        private final long totalCount;
        private final double successRate;
        public MailStatistics(long successCount, long failureCount, long totalCount, double successRate) {
            this.successCount = successCount;
            this.failureCount = failureCount;
            this.totalCount = totalCount;
            this.successRate = successRate;
        }
        // Getters
        public long getSuccessCount() { return successCount; }
        public long getFailureCount() { return failureCount; }
        public long getTotalCount() { return totalCount; }
        public double getSuccessRate() { return successRate; }
    }
}
```

## 更多邮件模板示例

### 订单确认邮件模板

创建订单确认邮件模板`order-confirmation.html`:

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <title>订单确认</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #2196F3;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .content {
            padding: 20px;
            background-color: #f9f9f9;
        }
        .order-info {
            background-color: white;
            padding: 15px;
            margin: 15px 0;
            border-left: 4px solid #2196F3;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>订单确认</h1>
        </div>
        <div class="content">
            <p>亲爱的 <span th:text="${customerName}">客户</span>,</p>
            <p>感谢您的订单!您的订单信息如下:</p>
            <div class="order-info">
                <p><strong>订单号:</strong> <span th:text="${orderNumber}"></span></p>
                <p><strong>订单金额:</strong> ¥<span th:text="${orderAmount}"></span></p>
                <p><strong>订单时间:</strong> <span th:text="${orderTime}"></span></p>
            </div>
            <p>我们将在24小时内处理您的订单。</p>
        </div>
        <div class="footer">
            <p>© 2024 公司名称. 保留所有权利.</p>
        </div>
    </div>
</body>
</html>
```

### 系统通知邮件模板

创建系统通知邮件模板`system-notification.html`:

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <title>系统通知</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #FF9800;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .content {
            padding: 20px;
            background-color: #f9f9f9;
        }
        .notification {
            background-color: white;
            padding: 15px;
            margin: 15px 0;
            border-left: 4px solid #FF9800;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>系统通知</h1>
        </div>
        <div class="content">
            <p>亲爱的用户,</p>
            <div class="notification">
                <p th:text="${notificationContent}">通知内容</p>
            </div>
            <p>如有任何问题,请随时联系我们。</p>
        </div>
        <div class="footer">
            <p>© 2024 公司名称. 保留所有权利.</p>
        </div>
    </div>
</body>
</html>
```

## 总结

Spring Boot 4整合邮件非常方便,只需要添加`spring-boot-starter-mail`依赖就能用;Spring Mail是Spring Framework提供的邮件发送功能,基于JavaMail API;支持简单文本邮件、HTML邮件、带附件邮件、带内联资源邮件、邮件模板等高级功能;兄弟们根据实际需求选择合适的配置,就能轻松搞定邮件发送了;但是要注意合理配置SMTP服务器,使用授权码而不是登录密码,提高安全性;同时要注意错误处理和异步发送,确保邮件发送的可靠性;还要注意邮件内容规范,避免发送垃圾邮件;最后要注意性能优化,使用异步发送和线程池,提高邮件发送效率。
