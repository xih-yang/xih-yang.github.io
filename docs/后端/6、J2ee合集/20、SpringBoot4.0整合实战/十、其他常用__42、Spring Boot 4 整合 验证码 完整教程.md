# 42、Spring Boot 4 整合 验证码 完整教程
- 来源：https://ddkk.com/springboot/4-action/42.html
- 分类：Spring Boot 4 整合教程
- 分组：十、其他常用
- 日期：2025-12-08
用验证码的时候最烦的就是自己写,图片验证码、滑块验证码这些都要自己实现,而且容易被破解,累死累活还容易出错;用第三方验证码服务吧,Google reCAPTCHA、hCaptcha这些要配置密钥,而且API还不统一,换一家就得改代码;其实验证码这玩意儿不错,是防止机器人攻击的重要手段,支持图片验证码、行为验证码、短信验证码,功能全、安全性高、用户体验好,是业界最广泛采用的验证码解决方案;但是直接用验证码服务商API写,那叫一个复杂,配置密钥、写Java代码、处理验证逻辑、管理会话,一堆配置写得人头疼;后来发现Spring Boot直接把这些都封装好了,用起来贼简单;现在Spring Boot 4出来了,整合验证码更是方便得不行,验证码SDK自动配置给你整得明明白白,零配置就能用;但是很多兄弟不知道里面的门道,也不知道咋配置验证码客户端、生成图片验证码、集成reCAPTCHA、使用hCaptcha、集成Turnstile这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

其实验证码在Spring Boot里早就支持了,你只要加个验证码SDK依赖,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋配置验证码生成器、生成图片验证码、集成第三方验证码服务、验证验证码、管理验证码会话这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

## 验证码基础概念

### 验证码是啥玩意儿

验证码(CAPTCHA,Completely Automated Public Turing test to tell Computers and Humans Apart)是一种区分计算机和人类的测试,用于防止机器人攻击;验证码的核心特性包括:

1. **防机器人**: 防止自动化程序攻击
2. **多种类型**: 支持图片验证码、行为验证码、短信验证码等
3. **用户体验**: 提供良好的用户体验,不影响正常用户
4. **安全性**: 提供高安全性,难以被破解
5. **易集成**: 易于集成到现有系统中
6. **多服务商**: 支持Google reCAPTCHA、hCaptcha、Cloudflare Turnstile等多个服务商
7. **自定义**: 支持自定义验证码样式和难度

### 验证码的类型

1. **图片验证码**: 显示数字、字母、汉字等,用户输入识别
2. **滑块验证码**: 用户拖动滑块完成验证
3. **点选验证码**: 用户点击指定图片完成验证
4. **行为验证码**: 基于用户行为分析,无需用户操作
5. **短信验证码**: 发送验证码到用户手机
6. **语音验证码**: 通过语音播报验证码

### 验证码的核心概念

1. **验证码生成器**: 用于生成验证码的工具
2. **验证码存储**: 存储验证码和会话信息
3. **验证码验证**: 验证用户输入的验证码是否正确
4. **验证码过期**: 验证码的有效期,通常几分钟
5. **验证码限流**: 防止验证码被频繁请求
6. **验证码难度**: 验证码的复杂程度,影响用户体验和安全性

### 验证码适用场景

1. **用户注册**: 防止机器人批量注册
2. **用户登录**: 防止暴力破解密码
3. **密码重置**: 防止恶意重置密码
4. **表单提交**: 防止垃圾信息提交
5. **API接口**: 防止API被恶意调用
6. **评论系统**: 防止垃圾评论

## 项目搭建和依赖配置

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-captcha-demo/
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
│   │       └── static/               # 静态资源目录
│   └── test/
└── README.md
```

### 添加Maven依赖

这是最关键的,依赖配置不对后面全是坑;Spring Boot 4需要Java 17以上,而且验证码SDK最新版本已经支持Spring Boot 4了。

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
    <artifactId>spring-boot-captcha-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 Captcha Demo</name>
    <description>Spring Boot 4整合验证码示例项目</description>
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
        <!-- Spring Boot Redis Starter: Redis支持 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis</artifactId>
        </dependency>
        <!-- Kaptcha: 图片验证码生成库 -->
        <dependency>
            <groupId>com.github.penggle</groupId>
            <artifactId>kaptcha</artifactId>
            <version>2.3.2</version>
        </dependency>
        <!-- EasyCaptcha: 简单易用的验证码库 -->
        <dependency>
            <groupId>com.github.whvcse</groupId>
            <artifactId>easy-captcha</artifactId>
            <version>1.6.2</version>
        </dependency>
        <!-- Apache Commons Lang: 工具类 -->
        <dependency>
            <groupId>org.apache.commons</groupId>
            <artifactId>commons-lang3</artifactId>
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
    name: spring-boot-captcha-demo  # 应用名称
  # Redis配置
  data:
    redis:
      host: localhost
      port: 6379
      password:  # Redis密码,没有则留空
      database: 0
      timeout: 5000  # 连接超时时间(毫秒)
# 验证码配置
captcha:
  # 图片验证码配置
  image:
    width: 120  # 图片宽度
    height: 40  # 图片高度
    length: 4  # 验证码长度
    expire-seconds: 300  # 过期时间(秒),默认5分钟
  # Google reCAPTCHA配置
  recaptcha:
    site-key: your-recaptcha-site-key  # reCAPTCHA站点密钥
    secret-key: your-recaptcha-secret-key  # reCAPTCHA密钥
    verify-url: https://www.google.com/recaptcha/api/siteverify  # 验证URL
  # hCaptcha配置
  hcaptcha:
    site-key: your-hcaptcha-site-key  # hCaptcha站点密钥
    secret-key: your-hcaptcha-secret-key  # hCaptcha密钥
    verify-url: https://api.hcaptcha.com/siteverify  # 验证URL
  # Cloudflare Turnstile配置
  turnstile:
    site-key: your-turnstile-site-key  # Turnstile站点密钥
    secret-key: your-turnstile-secret-key  # Turnstile密钥
    verify-url: https://challenges.cloudflare.com/turnstile/v0/siteverify  # 验证URL
```

## 图片验证码

### Kaptcha配置

使用Kaptcha生成图片验证码:

```java
package com.example.demo.config;
import com.google.code.kaptcha.impl.DefaultKaptcha;
import com.google.code.kaptcha.util.Config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.util.Properties;
/**
 * Kaptcha验证码配置
 */
@Configuration
public class KaptchaConfig {
    @Bean
    public DefaultKaptcha kaptcha() {
        DefaultKaptcha kaptcha = new DefaultKaptcha();
        Properties properties = new Properties();
        // 图片边框
        properties.setProperty("kaptcha.border", "yes");
        properties.setProperty("kaptcha.border.color", "105,179,90");
        // 字体颜色
        properties.setProperty("kaptcha.textproducer.font.color", "blue");
        // 图片宽高
        properties.setProperty("kaptcha.image.width", "120");
        properties.setProperty("kaptcha.image.height", "40");
        // 字体大小
        properties.setProperty("kaptcha.textproducer.font.size", "30");
        // 验证码长度
        properties.setProperty("kaptcha.textproducer.char.length", "4");
        // 字体
        properties.setProperty("kaptcha.textproducer.font.names", "宋体,楷体,微软雅黑");
        // 字符集
        properties.setProperty("kaptcha.textproducer.char.string", "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ");
        // 图片样式
        properties.setProperty("kaptcha.obscurificator.impl", "com.google.code.kaptcha.impl.ShadowGimpy");
        // 背景颜色
        properties.setProperty("kaptcha.background.color.from", "lightGray");
        properties.setProperty("kaptcha.background.color.to", "white");
        Config config = new Config(properties);
        kaptcha.setConfig(config);
        return kaptcha;
    }
}
```

### 图片验证码服务

创建图片验证码服务:

```java
package com.example.demo.service;
import com.google.code.kaptcha.impl.DefaultKaptcha;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
/**
 * 图片验证码服务
 */
@Slf4j
@Service
public class ImageCaptchaService {
    @Autowired
    private DefaultKaptcha kaptcha;
    @Autowired
    private StringRedisTemplate redisTemplate;
    @Value("${captcha.image.expire-seconds:300}")
    private int expireSeconds;
    private static final String CAPTCHA_PREFIX = "captcha:image:";
    /**
     * 生成验证码图片
     * 
     * @return 验证码信息(包含图片Base64和验证码ID)
     */
    public CaptchaInfo generateCaptcha() {
        try {
            // 生成验证码文本
            String code = kaptcha.createText();
            // 生成验证码图片
            BufferedImage image = kaptcha.createImage(code);
            // 将图片转换为Base64
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            ImageIO.write(image, "png", outputStream);
            byte[] imageBytes = outputStream.toByteArray();
            String imageBase64 = Base64.getEncoder().encodeToString(imageBytes);
            // 生成验证码ID
            String captchaId = UUID.randomUUID().toString();
            // 存储验证码到Redis
            String key = CAPTCHA_PREFIX + captchaId;
            redisTemplate.opsForValue().set(key, code.toLowerCase(), expireSeconds, TimeUnit.SECONDS);
            log.info("生成图片验证码成功: {}", captchaId);
            return new CaptchaInfo(captchaId, "data:image/png;base64," + imageBase64);
        } catch (IOException e) {
            log.error("生成图片验证码失败: {}", e.getMessage(), e);
            throw new RuntimeException("生成图片验证码失败", e);
        }
    }
    /**
     * 验证验证码
     * 
     * @param captchaId 验证码ID
     * @param code 用户输入的验证码
     * @return 是否验证成功
     */
    public boolean verifyCaptcha(String captchaId, String code) {
        try {
            String key = CAPTCHA_PREFIX + captchaId;
            String storedCode = redisTemplate.opsForValue().get(key);
            if (storedCode == null) {
                log.warn("验证码不存在或已过期: {}", captchaId);
                return false;
            }
            if (storedCode.equalsIgnoreCase(code)) {
                // 验证成功后删除验证码
                redisTemplate.delete(key);
                log.info("验证码验证成功: {}", captchaId);
                return true;
            } else {
                log.warn("验证码错误: {} -> {}", captchaId, code);
                return false;
            }
        } catch (Exception e) {
            log.error("验证验证码异常: {}", e.getMessage(), e);
            return false;
        }
    }
    /**
     * 验证码信息类
     */
    public static class CaptchaInfo {
        private String captchaId;
        private String imageBase64;
        public CaptchaInfo(String captchaId, String imageBase64) {
            this.captchaId = captchaId;
            this.imageBase64 = imageBase64;
        }
        // Getters and Setters
        public String getCaptchaId() { return captchaId; }
        public void setCaptchaId(String captchaId) { this.captchaId = captchaId; }
        public String getImageBase64() { return imageBase64; }
        public void setImageBase64(String imageBase64) { this.imageBase64 = imageBase64; }
    }
}
```

### EasyCaptcha配置

使用EasyCaptcha生成图片验证码:

```java
package com.example.demo.config;
import com.wf.captcha.SpecCaptcha;
import com.wf.captcha.base.Captcha;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
/**
 * EasyCaptcha验证码配置
 */
@Configuration
public class EasyCaptchaConfig {
    @Bean
    public SpecCaptcha specCaptcha() {
        SpecCaptcha captcha = new SpecCaptcha(120, 40, 4);
        captcha.setCharType(Captcha.TYPE_DEFAULT);  // 数字和字母混合
        return captcha;
    }
}
```

### EasyCaptcha验证码服务

创建EasyCaptcha验证码服务:

```java
package com.example.demo.service;
import com.wf.captcha.SpecCaptcha;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import java.util.Base64;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
/**
 * EasyCaptcha验证码服务
 */
@Slf4j
@Service
public class EasyCaptchaService {
    @Autowired
    private SpecCaptcha specCaptcha;
    @Autowired
    private StringRedisTemplate redisTemplate;
    @Value("${captcha.image.expire-seconds:300}")
    private int expireSeconds;
    private static final String CAPTCHA_PREFIX = "captcha:easy:";
    /**
     * 生成验证码图片
     * 
     * @return 验证码信息
     */
    public CaptchaInfo generateCaptcha() {
        try {
            // 生成验证码文本和图片
            String code = specCaptcha.text();
            String imageBase64 = specCaptcha.toBase64();
            // 生成验证码ID
            String captchaId = UUID.randomUUID().toString();
            // 存储验证码到Redis
            String key = CAPTCHA_PREFIX + captchaId;
            redisTemplate.opsForValue().set(key, code.toLowerCase(), expireSeconds, TimeUnit.SECONDS);
            log.info("生成EasyCaptcha验证码成功: {}", captchaId);
            return new CaptchaInfo(captchaId, "data:image/png;base64," + imageBase64);
        } catch (Exception e) {
            log.error("生成EasyCaptcha验证码失败: {}", e.getMessage(), e);
            throw new RuntimeException("生成验证码失败", e);
        }
    }
    /**
     * 验证验证码
     * 
     * @param captchaId 验证码ID
     * @param code 用户输入的验证码
     * @return 是否验证成功
     */
    public boolean verifyCaptcha(String captchaId, String code) {
        try {
            String key = CAPTCHA_PREFIX + captchaId;
            String storedCode = redisTemplate.opsForValue().get(key);
            if (storedCode == null) {
                log.warn("验证码不存在或已过期: {}", captchaId);
                return false;
            }
            if (storedCode.equalsIgnoreCase(code)) {
                redisTemplate.delete(key);
                log.info("验证码验证成功: {}", captchaId);
                return true;
            } else {
                log.warn("验证码错误: {} -> {}", captchaId, code);
                return false;
            }
        } catch (Exception e) {
            log.error("验证验证码异常: {}", e.getMessage(), e);
            return false;
        }
    }
    /**
     * 验证码信息类
     */
    public static class CaptchaInfo {
        private String captchaId;
        private String imageBase64;
        public CaptchaInfo(String captchaId, String imageBase64) {
            this.captchaId = captchaId;
            this.imageBase64 = imageBase64;
        }
        // Getters and Setters
        public String getCaptchaId() { return captchaId; }
        public void setCaptchaId(String captchaId) { this.captchaId = captchaId; }
        public String getImageBase64() { return imageBase64; }
        public void setImageBase64(String imageBase64) { this.imageBase64 = imageBase64; }
    }
}
```

## Google reCAPTCHA v3

### reCAPTCHA配置

创建reCAPTCHA配置类:

```java
package com.example.demo.config;
import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
/**
 * Google reCAPTCHA配置
 */
@Data
@Configuration
public class RecaptchaConfig {
    @Value("${captcha.recaptcha.site-key}")
    private String siteKey;
    @Value("${captcha.recaptcha.secret-key}")
    private String secretKey;
    @Value("${captcha.recaptcha.verify-url}")
    private String verifyUrl;
}
```

### reCAPTCHA验证服务

创建reCAPTCHA验证服务:

```java
package com.example.demo.service;
import com.example.demo.config.RecaptchaConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import java.util.Map;
/**
 * Google reCAPTCHA验证服务
 */
@Slf4j
@Service
public class RecaptchaService {
    @Autowired
    private RecaptchaConfig recaptchaConfig;
    @Autowired
    private RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    /**
     * 验证reCAPTCHA token
     * 
     * @param token reCAPTCHA token
     * @param remoteIp 用户IP地址(可选)
     * @return 验证结果
     */
    public RecaptchaResponse verifyToken(String token, String remoteIp) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("secret", recaptchaConfig.getSecretKey());
            params.add("response", token);
            if (remoteIp != null && !remoteIp.isEmpty()) {
                params.add("remoteip", remoteIp);
            }
            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    recaptchaConfig.getVerifyUrl(), request, Map.class);
            Map<String, Object> responseBody = response.getBody();
            if (responseBody != null) {
                RecaptchaResponse recaptchaResponse = new RecaptchaResponse();
                recaptchaResponse.setSuccess((Boolean) responseBody.get("success"));
                recaptchaResponse.setScore((Double) responseBody.get("score"));
                recaptchaResponse.setAction((String) responseBody.get("action"));
                recaptchaResponse.setChallengeTs((String) responseBody.get("challenge_ts"));
                recaptchaResponse.setHostname((String) responseBody.get("hostname"));
                log.info("reCAPTCHA验证结果: success={}, score={}, action={}", 
                        recaptchaResponse.isSuccess(), recaptchaResponse.getScore(), recaptchaResponse.getAction());
                return recaptchaResponse;
            }
            return new RecaptchaResponse();
        } catch (Exception e) {
            log.error("reCAPTCHA验证异常: {}", e.getMessage(), e);
            RecaptchaResponse errorResponse = new RecaptchaResponse();
            errorResponse.setSuccess(false);
            return errorResponse;
        }
    }
    /**
     * 验证reCAPTCHA token(带action验证)
     * 
     * @param token reCAPTCHA token
     * @param expectedAction 期望的action
     * @param remoteIp 用户IP地址
     * @return 是否验证成功
     */
    public boolean verifyToken(String token, String expectedAction, String remoteIp) {
        RecaptchaResponse response = verifyToken(token, remoteIp);
        if (!response.isSuccess()) {
            return false;
        }
        // 验证action是否匹配
        if (expectedAction != null && !expectedAction.equals(response.getAction())) {
            log.warn("reCAPTCHA action不匹配: expected={}, actual={}", expectedAction, response.getAction());
            return false;
        }
        // 验证分数(通常0.5以上认为是人类)
        if (response.getScore() != null && response.getScore() < 0.5) {
            log.warn("reCAPTCHA分数过低: {}", response.getScore());
            return false;
        }
        return true;
    }
    /**
     * reCAPTCHA响应类
     */
    public static class RecaptchaResponse {
        private boolean success;
        private Double score;
        private String action;
        private String challengeTs;
        private String hostname;
        // Getters and Setters
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public Double getScore() { return score; }
        public void setScore(Double score) { this.score = score; }
        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }
        public String getChallengeTs() { return challengeTs; }
        public void setChallengeTs(String challengeTs) { this.challengeTs = challengeTs; }
        public String getHostname() { return hostname; }
        public void setHostname(String hostname) { this.hostname = hostname; }
    }
}
```

## hCaptcha

### hCaptcha配置

创建hCaptcha配置类:

```java
package com.example.demo.config;
import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
/**
 * hCaptcha配置
 */
@Data
@Configuration
public class HcaptchaConfig {
    @Value("${captcha.hcaptcha.site-key}")
    private String siteKey;
    @Value("${captcha.hcaptcha.secret-key}")
    private String secretKey;
    @Value("${captcha.hcaptcha.verify-url}")
    private String verifyUrl;
}
```

### hCaptcha验证服务

创建hCaptcha验证服务:

```java
package com.example.demo.service;
import com.example.demo.config.HcaptchaConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import java.util.Map;
/**
 * hCaptcha验证服务
 */
@Slf4j
@Service
public class HcaptchaService {
    @Autowired
    private HcaptchaConfig hcaptchaConfig;
    @Autowired
    private RestTemplate restTemplate;
    /**
     * 验证hCaptcha token
     * 
     * @param token hCaptcha token
     * @param remoteIp 用户IP地址(可选)
     * @return 验证结果
     */
    public HcaptchaResponse verifyToken(String token, String remoteIp) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("secret", hcaptchaConfig.getSecretKey());
            params.add("response", token);
            if (remoteIp != null && !remoteIp.isEmpty()) {
                params.add("remoteip", remoteIp);
            }
            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    hcaptchaConfig.getVerifyUrl(), request, Map.class);
            Map<String, Object> responseBody = response.getBody();
            if (responseBody != null) {
                HcaptchaResponse hcaptchaResponse = new HcaptchaResponse();
                hcaptchaResponse.setSuccess((Boolean) responseBody.get("success"));
                hcaptchaResponse.setChallengeTs((String) responseBody.get("challenge_ts"));
                hcaptchaResponse.setHostname((String) responseBody.get("hostname"));
                log.info("hCaptcha验证结果: success={}, hostname={}", 
                        hcaptchaResponse.isSuccess(), hcaptchaResponse.getHostname());
                return hcaptchaResponse;
            }
            return new HcaptchaResponse();
        } catch (Exception e) {
            log.error("hCaptcha验证异常: {}", e.getMessage(), e);
            HcaptchaResponse errorResponse = new HcaptchaResponse();
            errorResponse.setSuccess(false);
            return errorResponse;
        }
    }
    /**
     * hCaptcha响应类
     */
    public static class HcaptchaResponse {
        private boolean success;
        private String challengeTs;
        private String hostname;
        // Getters and Setters
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public String getChallengeTs() { return challengeTs; }
        public void setChallengeTs(String challengeTs) { this.challengeTs = challengeTs; }
        public String getHostname() { return hostname; }
        public void setHostname(String hostname) { this.hostname = hostname; }
    }
}
```

## Cloudflare Turnstile

### Turnstile配置

创建Turnstile配置类:

```java
package com.example.demo.config;
import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
/**
 * Cloudflare Turnstile配置
 */
@Data
@Configuration
public class TurnstileConfig {
    @Value("${captcha.turnstile.site-key}")
    private String siteKey;
    @Value("${captcha.turnstile.secret-key}")
    private String secretKey;
    @Value("${captcha.turnstile.verify-url}")
    private String verifyUrl;
}
```

### Turnstile验证服务

创建Turnstile验证服务:

```java
package com.example.demo.service;
import com.example.demo.config.TurnstileConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import java.util.Map;
/**
 * Cloudflare Turnstile验证服务
 */
@Slf4j
@Service
public class TurnstileService {
    @Autowired
    private TurnstileConfig turnstileConfig;
    @Autowired
    private RestTemplate restTemplate;
    /**
     * 验证Turnstile token
     * 
     * @param token Turnstile token
     * @param remoteIp 用户IP地址(可选)
     * @return 验证结果
     */
    public TurnstileResponse verifyToken(String token, String remoteIp) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("secret", turnstileConfig.getSecretKey());
            params.add("response", token);
            if (remoteIp != null && !remoteIp.isEmpty()) {
                params.add("remoteip", remoteIp);
            }
            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    turnstileConfig.getVerifyUrl(), request, Map.class);
            Map<String, Object> responseBody = response.getBody();
            if (responseBody != null) {
                TurnstileResponse turnstileResponse = new TurnstileResponse();
                turnstileResponse.setSuccess((Boolean) responseBody.get("success"));
                turnstileResponse.setChallengeTs((String) responseBody.get("challenge_ts"));
                turnstileResponse.setHostname((String) responseBody.get("hostname"));
                turnstileResponse.setAction((String) responseBody.get("action"));
                turnstileResponse.setCdata((String) responseBody.get("cdata"));
                log.info("Turnstile验证结果: success={}, hostname={}, action={}", 
                        turnstileResponse.isSuccess(), turnstileResponse.getHostname(), turnstileResponse.getAction());
                return turnstileResponse;
            }
            return new TurnstileResponse();
        } catch (Exception e) {
            log.error("Turnstile验证异常: {}", e.getMessage(), e);
            TurnstileResponse errorResponse = new TurnstileResponse();
            errorResponse.setSuccess(false);
            return errorResponse;
        }
    }
    /**
     * Turnstile响应类
     */
    public static class TurnstileResponse {
        private boolean success;
        private String challengeTs;
        private String hostname;
        private String action;
        private String cdata;
        // Getters and Setters
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public String getChallengeTs() { return challengeTs; }
        public void setChallengeTs(String challengeTs) { this.challengeTs = challengeTs; }
        public String getHostname() { return hostname; }
        public void setHostname(String hostname) { this.hostname = hostname; }
        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }
        public String getCdata() { return cdata; }
        public void setCdata(String cdata) { this.cdata = cdata; }
    }
}
```

## 统一验证码服务接口

### 创建验证码服务接口

为了支持多种验证码类型,创建统一的验证码服务接口:

```java
package com.example.demo.service;
/**
 * 验证码服务接口
 */
public interface CaptchaService {
    /**
     * 生成验证码
     * 
     * @return 验证码信息
     */
    CaptchaInfo generateCaptcha();
    /**
     * 验证验证码
     * 
     * @param captchaId 验证码ID
     * @param code 用户输入的验证码
     * @return 是否验证成功
     */
    boolean verifyCaptcha(String captchaId, String code);
    /**
     * 验证码信息类
     */
    class CaptchaInfo {
        private String captchaId;
        private String imageBase64;
        public CaptchaInfo(String captchaId, String imageBase64) {
            this.captchaId = captchaId;
            this.imageBase64 = imageBase64;
        }
        // Getters and Setters
        public String getCaptchaId() { return captchaId; }
        public void setCaptchaId(String captchaId) { this.captchaId = captchaId; }
        public String getImageBase64() { return imageBase64; }
        public void setImageBase64(String imageBase64) { this.imageBase64 = imageBase64; }
    }
}
```

### 实现统一验证码服务

实现统一的验证码服务,支持多种验证码类型:

```java
package com.example.demo.service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
/**
 * 统一验证码服务实现
 */
@Slf4j
@Service
public class UnifiedCaptchaService implements CaptchaService {
    @Autowired
    private ImageCaptchaService imageCaptchaService;
    @Autowired
    private EasyCaptchaService easyCaptchaService;
    @Value("${captcha.type:image}")
    private String captchaType;  // 验证码类型: image, easy
    @Override
    public CaptchaInfo generateCaptcha() {
        switch (captchaType.toLowerCase()) {
            case "image":
                return imageCaptchaService.generateCaptcha();
            case "easy":
                return easyCaptchaService.generateCaptcha();
            default:
                log.warn("不支持的验证码类型: {}, 使用默认类型", captchaType);
                return imageCaptchaService.generateCaptcha();
        }
    }
    @Override
    public boolean verifyCaptcha(String captchaId, String code) {
        switch (captchaType.toLowerCase()) {
            case "image":
                return imageCaptchaService.verifyCaptcha(captchaId, code);
            case "easy":
                return easyCaptchaService.verifyCaptcha(captchaId, code);
            default:
                return imageCaptchaService.verifyCaptcha(captchaId, code);
        }
    }
}
```

## 控制器实现

### 图片验证码控制器

创建图片验证码控制器:

```java
package com.example.demo.controller;
import com.example.demo.service.CaptchaService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
/**
 * 验证码控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/captcha")
public class CaptchaController {
    @Autowired
    private CaptchaService captchaService;
    /**
     * 生成图片验证码
     */
    @GetMapping("/generate")
    public ResponseEntity<Map<String, Object>> generateCaptcha() {
        Map<String, Object> result = new HashMap<>();
        try {
            CaptchaService.CaptchaInfo captchaInfo = captchaService.generateCaptcha();
            result.put("success", true);
            result.put("captchaId", captchaInfo.getCaptchaId());
            result.put("imageBase64", captchaInfo.getImageBase64());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("生成验证码失败: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("message", "生成验证码失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(result);
        }
    }
    /**
     * 验证验证码
     */
    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyCaptcha(
            @RequestParam String captchaId,
            @RequestParam String code) {
        Map<String, Object> result = new HashMap<>();
        try {
            boolean verified = captchaService.verifyCaptcha(captchaId, code);
            if (verified) {
                result.put("success", true);
                result.put("message", "验证码验证成功");
            } else {
                result.put("success", false);
                result.put("message", "验证码错误或已过期");
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("验证验证码失败: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("message", "验证验证码失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(result);
        }
    }
}
```

### reCAPTCHA控制器

创建reCAPTCHA验证控制器:

```java
package com.example.demo.controller;
import com.example.demo.service.RecaptchaService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;
/**
 * reCAPTCHA控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/recaptcha")
public class RecaptchaController {
    @Autowired
    private RecaptchaService recaptchaService;
    /**
     * 验证reCAPTCHA token
     */
    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyRecaptcha(
            @RequestParam String token,
            @RequestParam(required = false) String action,
            HttpServletRequest request) {
        Map<String, Object> result = new HashMap<>();
        try {
            // 获取用户IP地址
            String remoteIp = getRemoteIp(request);
            // 验证token
            boolean verified = recaptchaService.verifyToken(token, action, remoteIp);
            if (verified) {
                result.put("success", true);
                result.put("message", "reCAPTCHA验证成功");
            } else {
                result.put("success", false);
                result.put("message", "reCAPTCHA验证失败");
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("验证reCAPTCHA失败: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("message", "验证reCAPTCHA失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(result);
        }
    }
    /**
     * 获取用户IP地址
     */
    private String getRemoteIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}
```

### hCaptcha控制器

创建hCaptcha验证控制器:

```java
package com.example.demo.controller;
import com.example.demo.service.HcaptchaService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;
/**
 * hCaptcha控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/hcaptcha")
public class HcaptchaController {
    @Autowired
    private HcaptchaService hcaptchaService;
    /**
     * 验证hCaptcha token
     */
    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyHcaptcha(
            @RequestParam String token,
            HttpServletRequest request) {
        Map<String, Object> result = new HashMap<>();
        try {
            // 获取用户IP地址
            String remoteIp = getRemoteIp(request);
            // 验证token
            HcaptchaService.HcaptchaResponse response = hcaptchaService.verifyToken(token, remoteIp);
            if (response.isSuccess()) {
                result.put("success", true);
                result.put("message", "hCaptcha验证成功");
            } else {
                result.put("success", false);
                result.put("message", "hCaptcha验证失败");
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("验证hCaptcha失败: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("message", "验证hCaptcha失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(result);
        }
    }
    /**
     * 获取用户IP地址
     */
    private String getRemoteIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}
```

### Turnstile控制器

创建Turnstile验证控制器:

```java
package com.example.demo.controller;
import com.example.demo.service.TurnstileService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;
/**
 * Turnstile控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/turnstile")
public class TurnstileController {
    @Autowired
    private TurnstileService turnstileService;
    /**
     * 验证Turnstile token
     */
    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyTurnstile(
            @RequestParam String token,
            HttpServletRequest request) {
        Map<String, Object> result = new HashMap<>();
        try {
            // 获取用户IP地址
            String remoteIp = getRemoteIp(request);
            // 验证token
            TurnstileService.TurnstileResponse response = turnstileService.verifyToken(token, remoteIp);
            if (response.isSuccess()) {
                result.put("success", true);
                result.put("message", "Turnstile验证成功");
            } else {
                result.put("success", false);
                result.put("message", "Turnstile验证失败");
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("验证Turnstile失败: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("message", "验证Turnstile失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(result);
        }
    }
    /**
     * 获取用户IP地址
     */
    private String getRemoteIp(HttpServletRequest request) {
        String ip = request.getHeader("CF-Connecting-IP");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Forwarded-For");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}
```

## RestTemplate配置

### 配置RestTemplate

配置RestTemplate用于调用验证码服务API:

```java
package com.example.demo.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;
/**
 * RestTemplate配置
 */
@Configuration
public class RestTemplateConfig {
    @Bean
    public RestTemplate restTemplate() {
        RestTemplate restTemplate = new RestTemplate();
        restTemplate.setRequestFactory(clientHttpRequestFactory());
        return restTemplate;
    }
    @Bean
    public ClientHttpRequestFactory clientHttpRequestFactory() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);  // 连接超时5秒
        factory.setReadTimeout(10000);  // 读取超时10秒
        return factory;
    }
}
```

## 实际应用场景

### 用户注册验证码

在用户注册时使用验证码:

```java
package com.example.demo.controller;
import com.example.demo.service.CaptchaService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
/**
 * 用户注册控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/user")
public class UserRegistrationController {
    @Autowired
    private CaptchaService captchaService;
    /**
     * 用户注册
     */
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(
            @RequestParam String username,
            @RequestParam String password,
            @RequestParam String captchaId,
            @RequestParam String captchaCode) {
        Map<String, Object> result = new HashMap<>();
        try {
            // 验证验证码
            if (!captchaService.verifyCaptcha(captchaId, captchaCode)) {
                result.put("success", false);
                result.put("message", "验证码错误或已过期");
                return ResponseEntity.ok(result);
            }
            // 验证码验证通过,继续注册流程
            // TODO: 实现用户注册逻辑
            result.put("success", true);
            result.put("message", "注册成功");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("用户注册失败: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("message", "注册失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(result);
        }
    }
}
```

### 登录验证码

在用户登录时使用验证码:

```java
package com.example.demo.controller;
import com.example.demo.service.RecaptchaService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;
/**
 * 用户登录控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
public class LoginController {
    @Autowired
    private RecaptchaService recaptchaService;
    /**
     * 用户登录
     */
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @RequestParam String username,
            @RequestParam String password,
            @RequestParam String recaptchaToken,
            HttpServletRequest request) {
        Map<String, Object> result = new HashMap<>();
        try {
            // 验证reCAPTCHA
            String remoteIp = getRemoteIp(request);
            if (!recaptchaService.verifyToken(recaptchaToken, "login", remoteIp)) {
                result.put("success", false);
                result.put("message", "reCAPTCHA验证失败");
                return ResponseEntity.ok(result);
            }
            // reCAPTCHA验证通过,继续登录流程
            // TODO: 实现用户登录逻辑
            result.put("success", true);
            result.put("message", "登录成功");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("用户登录失败: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("message", "登录失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(result);
        }
    }
    /**
     * 获取用户IP地址
     */
    private String getRemoteIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}
```

## 最佳实践

1. **验证码类型选择**: 根据场景选择合适的验证码类型,图片验证码适合简单场景,行为验证码适合复杂场景
2. **验证码难度**: 合理设置验证码难度,平衡用户体验和安全性
3. **验证码过期**: 设置合理的验证码过期时间,通常5-10分钟
4. **验证码限流**: 实现验证码请求限流,防止验证码被频繁请求
5. **验证码存储**: 使用Redis存储验证码,支持分布式部署
6. **错误处理**: 妥善处理验证码验证异常,记录日志
7. **多服务商**: 支持多个验证码服务商,提高可用性
8. **用户体验**: 提供良好的用户体验,不影响正常用户
9. **安全性**: 确保验证码验证逻辑的安全性,防止绕过
10. **性能优化**: 合理配置验证码生成和验证的性能

## 常见问题

### 1. 验证码生成失败

检查Kaptcha或EasyCaptcha配置是否正确,检查Redis连接是否正常。

### 2. 验证码验证失败

检查验证码ID是否正确,检查验证码是否已过期,检查用户输入的验证码是否正确。

### 3. reCAPTCHA验证失败

检查site-key和secret-key是否正确,检查token是否有效,检查action是否匹配。

### 4. hCaptcha验证失败

检查site-key和secret-key是否正确,检查token是否有效。

### 5. Turnstile验证失败

检查site-key和secret-key是否正确,检查token是否有效。

### 6. 验证码图片不显示

检查图片Base64编码是否正确,检查前端是否正确处理Base64数据。

### 7. 验证码过期

检查Redis配置,确保验证码正确存储和过期。

### 8. 验证码限流不生效

检查Redis连接,确保限流key正确设置。

### 9. 多服务商切换

通过配置文件切换验证码服务商,确保接口统一。

### 10. 验证码被破解

使用更复杂的验证码类型,如行为验证码,或者结合多种验证码类型。

## 验证码限流

### 实现验证码限流

防止验证码被频繁请求,实现限流机制:

```java
package com.example.demo.service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import java.util.concurrent.TimeUnit;
/**
 * 验证码限流服务
 */
@Slf4j
@Service
public class CaptchaRateLimitService {
    @Autowired
    private StringRedisTemplate redisTemplate;
    private static final String RATE_LIMIT_PREFIX = "captcha:rate:";
    private static final int MAX_REQUESTS_PER_MINUTE = 5;  // 每分钟最多5次请求
    private static final int RATE_LIMIT_EXPIRE_SECONDS = 60;  // 限流时间60秒
    /**
     * 检查是否超过限流
     * 
     * @param key 限流key(可以是IP地址或用户ID)
     * @return 是否超过限流
     */
    public boolean isRateLimited(String key) {
        String rateLimitKey = RATE_LIMIT_PREFIX + key;
        String count = redisTemplate.opsForValue().get(rateLimitKey);
        if (count != null) {
            int requestCount = Integer.parseInt(count);
            if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
                log.warn("验证码请求超过限流: {} -> {}", key, requestCount);
                return true;
            }
        }
        return false;
    }
    /**
     * 增加请求计数
     * 
     * @param key 限流key
     */
    public void incrementRequest(String key) {
        String rateLimitKey = RATE_LIMIT_PREFIX + key;
        // 如果key不存在,创建并设置过期时间
        if (!redisTemplate.hasKey(rateLimitKey)) {
            redisTemplate.opsForValue().set(rateLimitKey, "1", RATE_LIMIT_EXPIRE_SECONDS, TimeUnit.SECONDS);
        } else {
            // 如果key存在,增加计数
            redisTemplate.opsForValue().increment(rateLimitKey);
        }
    }
    /**
     * 获取剩余请求次数
     * 
     * @param key 限流key
     * @return 剩余请求次数
     */
    public int getRemainingRequests(String key) {
        String rateLimitKey = RATE_LIMIT_PREFIX + key;
        String count = redisTemplate.opsForValue().get(rateLimitKey);
        if (count != null) {
            int requestCount = Integer.parseInt(count);
            return Math.max(0, MAX_REQUESTS_PER_MINUTE - requestCount);
        }
        return MAX_REQUESTS_PER_MINUTE;
    }
}
```

### 集成验证码限流

在验证码服务中集成限流:

```java
package com.example.demo.service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
/**
 * 带限流的验证码服务
 */
@Slf4j
@Service
public class RateLimitedCaptchaService {
    @Autowired
    private CaptchaService captchaService;
    @Autowired
    private CaptchaRateLimitService rateLimitService;
    /**
     * 生成验证码(带限流)
     * 
     * @param clientId 客户端ID(IP地址或用户ID)
     * @return 验证码信息
     */
    public CaptchaService.CaptchaInfo generateCaptchaWithRateLimit(String clientId) {
        // 检查限流
        if (rateLimitService.isRateLimited(clientId)) {
            log.warn("验证码请求超过限流: {}", clientId);
            throw new RuntimeException("验证码请求过于频繁,请稍后再试");
        }
        // 增加请求计数
        rateLimitService.incrementRequest(clientId);
        // 生成验证码
        return captchaService.generateCaptcha();
    }
}
```

## 前端集成示例

### 图片验证码前端集成

HTML页面集成图片验证码:

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>图片验证码示例</title>
    <style>
        .captcha-container {
            margin: 20px 0;
        }
        .captcha-image {
            cursor: pointer;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .captcha-input {
            margin-top: 10px;
            padding: 8px;
            width: 200px;
        }
    </style>
</head>
<body>
    <h1>图片验证码示例</h1>
    <form id="registerForm">
        <div>
            <label>用户名:</label>
            <input type="text" name="username" required>
        </div>
        <div>
            <label>密码:</label>
            <input type="password" name="password" required>
        </div>
        <div class="captcha-container">
            <label>验证码:</label>
            <div>
                <img id="captchaImage" class="captcha-image" alt="验证码" onclick="refreshCaptcha()">
                <button type="button" onclick="refreshCaptcha()">刷新</button>
            </div>
            <input type="text" id="captchaCode" class="captcha-input" placeholder="请输入验证码" required>
            <input type="hidden" id="captchaId">
        </div>
        <button type="submit">注册</button>
    </form>
    <script>
        let captchaId = '';
        // 生成验证码
        function refreshCaptcha() {
            fetch('/api/captcha/generate')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        captchaId = data.captchaId;
                        document.getElementById('captchaImage').src = data.imageBase64;
                    } else {
                        alert('生成验证码失败: ' + data.message);
                    }
                })
                .catch(error => {
                    console.error('生成验证码错误:', error);
                    alert('生成验证码失败');
                });
        }
        // 表单提交
        document.getElementById('registerForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            formData.append('captchaId', captchaId);
            formData.append('captchaCode', document.getElementById('captchaCode').value);
            fetch('/api/user/register', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('注册成功');
                    // 刷新验证码
                    refreshCaptcha();
                } else {
                    alert('注册失败: ' + data.message);
                    // 刷新验证码
                    refreshCaptcha();
                }
            })
            .catch(error => {
                console.error('注册错误:', error);
                alert('注册失败');
            });
        });
        // 页面加载时生成验证码
        refreshCaptcha();
    </script>
</body>
</html>
```

### reCAPTCHA前端集成

HTML页面集成reCAPTCHA v3:

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>reCAPTCHA v3示例</title>
</head>
<body>
    <h1>reCAPTCHA v3示例</h1>
    <form id="loginForm">
        <div>
            <label>用户名:</label>
            <input type="text" name="username" required>
        </div>
        <div>
            <label>密码:</label>
            <input type="password" name="password" required>
        </div>
        <button type="submit" id="loginButton">登录</button>
    </form>
    <!-- 加载reCAPTCHA v3脚本 -->
    <script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY"></script>
    <script>
        // 表单提交时执行reCAPTCHA
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            grecaptcha.ready(function() {
                grecaptcha.execute('YOUR_SITE_KEY', {action: 'login'}).then(function(token) {
                    // 将token添加到表单数据
                    const formData = new FormData(document.getElementById('loginForm'));
                    formData.append('recaptchaToken', token);
                    // 提交表单
                    fetch('/api/auth/login', {
                        method: 'POST',
                        body: formData
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            alert('登录成功');
                        } else {
                            alert('登录失败: ' + data.message);
                        }
                    })
                    .catch(error => {
                        console.error('登录错误:', error);
                        alert('登录失败');
                    });
                });
            });
        });
    </script>
</body>
</html>
```

### hCaptcha前端集成

HTML页面集成hCaptcha:

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>hCaptcha示例</title>
</head>
<body>
    <h1>hCaptcha示例</h1>
    <form id="submitForm">
        <div>
            <label>内容:</label>
            <textarea name="content" required></textarea>
        </div>
        <!-- hCaptcha组件 -->
        <div class="h-captcha" data-sitekey="YOUR_SITE_KEY"></div>
        <button type="submit">提交</button>
    </form>
    <!-- 加载hCaptcha脚本 -->
    <script src="https://js.hcaptcha.com/1/api.js" async defer></script>
    <script>
        // 表单提交
        document.getElementById('submitForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const hcaptchaResponse = document.querySelector('[name="h-captcha-response"]').value;
            if (!hcaptchaResponse) {
                alert('请完成hCaptcha验证');
                return;
            }
            formData.append('token', hcaptchaResponse);
            fetch('/api/hcaptcha/verify', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('提交成功');
                } else {
                    alert('提交失败: ' + data.message);
                    // 重置hCaptcha
                    hcaptcha.reset();
                }
            })
            .catch(error => {
                console.error('提交错误:', error);
                alert('提交失败');
            });
        });
    </script>
</body>
</html>
```

### Turnstile前端集成

HTML页面集成Cloudflare Turnstile:

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Turnstile示例</title>
</head>
<body>
    <h1>Cloudflare Turnstile示例</h1>
    <form id="submitForm">
        <div>
            <label>内容:</label>
            <textarea name="content" required></textarea>
        </div>
        <!-- Turnstile组件 -->
        <div class="cf-turnstile" data-sitekey="YOUR_SITE_KEY"></div>
        <button type="submit">提交</button>
    </form>
    <!-- 加载Turnstile脚本 -->
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
    <script>
        // 表单提交
        document.getElementById('submitForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const turnstileResponse = document.querySelector('[name="cf-turnstile-response"]').value;
            if (!turnstileResponse) {
                alert('请完成Turnstile验证');
                return;
            }
            formData.append('token', turnstileResponse);
            fetch('/api/turnstile/verify', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('提交成功');
                } else {
                    alert('提交失败: ' + data.message);
                    // 重置Turnstile
                    turnstile.reset();
                }
            })
            .catch(error => {
                console.error('提交错误:', error);
                alert('提交失败');
            });
        });
    </script>
</body>
</html>
```

## 验证码统计

### 验证码统计服务

记录验证码使用统计信息:

```java
package com.example.demo.service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.TimeUnit;
/**
 * 验证码统计服务
 */
@Slf4j
@Service
public class CaptchaStatisticsService {
    @Autowired
    private StringRedisTemplate redisTemplate;
    private static final String STATS_PREFIX = "captcha:stats:";
    private static final String DAILY_PREFIX = "captcha:daily:";
    /**
     * 记录验证码生成
     */
    public void recordGenerate(String type) {
        String key = STATS_PREFIX + "generate:" + type;
        redisTemplate.opsForValue().increment(key);
    }
    /**
     * 记录验证码验证成功
     */
    public void recordVerifySuccess(String type) {
        String key = STATS_PREFIX + "verify:success:" + type;
        redisTemplate.opsForValue().increment(key);
    }
    /**
     * 记录验证码验证失败
     */
    public void recordVerifyFailure(String type) {
        String key = STATS_PREFIX + "verify:failure:" + type;
        redisTemplate.opsForValue().increment(key);
    }
    /**
     * 记录每日验证码使用量
     */
    public void recordDailyUsage(String type) {
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String key = DAILY_PREFIX + date + ":" + type;
        redisTemplate.opsForValue().increment(key);
        redisTemplate.expire(key, 30, TimeUnit.DAYS);  // 30天后过期
    }
    /**
     * 获取今日验证码使用量
     */
    public long getTodayUsage(String type) {
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String key = DAILY_PREFIX + date + ":" + type;
        String count = redisTemplate.opsForValue().get(key);
        return count != null ? Long.parseLong(count) : 0;
    }
    /**
     * 获取统计信息
     */
    public CaptchaStatistics getStatistics(String type) {
        String generateKey = STATS_PREFIX + "generate:" + type;
        String successKey = STATS_PREFIX + "verify:success:" + type;
        String failureKey = STATS_PREFIX + "verify:failure:" + type;
        String generateCount = redisTemplate.opsForValue().get(generateKey);
        String successCount = redisTemplate.opsForValue().get(successKey);
        String failureCount = redisTemplate.opsForValue().get(failureKey);
        long generate = generateCount != null ? Long.parseLong(generateCount) : 0;
        long success = successCount != null ? Long.parseLong(successCount) : 0;
        long failure = failureCount != null ? Long.parseLong(failureCount) : 0;
        long total = success + failure;
        double successRate = total > 0 ? (double) success / total * 100 : 0;
        return new CaptchaStatistics(generate, success, failure, total, successRate);
    }
    /**
     * 验证码统计信息类
     */
    public static class CaptchaStatistics {
        private final long generateCount;
        private final long successCount;
        private final long failureCount;
        private final long totalCount;
        private final double successRate;
        public CaptchaStatistics(long generateCount, long successCount, long failureCount, 
                                 long totalCount, double successRate) {
            this.generateCount = generateCount;
            this.successCount = successCount;
            this.failureCount = failureCount;
            this.totalCount = totalCount;
            this.successRate = successRate;
        }
        // Getters
        public long getGenerateCount() { return generateCount; }
        public long getSuccessCount() { return successCount; }
        public long getFailureCount() { return failureCount; }
        public long getTotalCount() { return totalCount; }
        public double getSuccessRate() { return successRate; }
    }
}
```

## 验证码拦截器

### 创建验证码拦截器

创建验证码拦截器,自动验证验证码:

```java
package com.example.demo.interceptor;
import com.example.demo.service.CaptchaService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
/**
 * 验证码拦截器
 */
@Slf4j
@Component
public class CaptchaInterceptor implements HandlerInterceptor {
    @Autowired
    private CaptchaService captchaService;
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // 获取验证码ID和验证码
        String captchaId = request.getParameter("captchaId");
        String captchaCode = request.getParameter("captchaCode");
        // 如果请求包含验证码参数,进行验证
        if (captchaId != null && captchaCode != null) {
            boolean verified = captchaService.verifyCaptcha(captchaId, captchaCode);
            if (!verified) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"success\":false,\"message\":\"验证码错误或已过期\"}");
                return false;
            }
        }
        return true;
    }
}
```

### 配置验证码拦截器

配置验证码拦截器:

```java
package com.example.demo.config;
import com.example.demo.interceptor.CaptchaInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
/**
 * Web配置
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Autowired
    private CaptchaInterceptor captchaInterceptor;
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(captchaInterceptor)
                .addPathPatterns("/api/user/register", "/api/user/login")  // 需要验证码的路径
                .excludePathPatterns("/api/captcha/**");  // 排除验证码相关路径
    }
}
```

## 总结

Spring Boot 4整合验证码非常方便,只需要添加验证码SDK依赖就能用;验证码是防止机器人攻击的重要手段,支持图片验证码、行为验证码、短信验证码等多种类型;支持Kaptcha、EasyCaptcha、Google reCAPTCHA、hCaptcha、Cloudflare Turnstile等多个服务商,可以根据需求选择合适的服务商;支持验证码生成和验证、验证码限流、验证码统计、验证码拦截器等高级功能;兄弟们根据实际需求选择合适的配置,就能轻松搞定验证码了;但是要注意合理配置验证码难度和过期时间,平衡用户体验和安全性;同时要注意验证码限流和错误处理,确保验证码验证的可靠性;还要注意安全性,确保验证码验证逻辑的安全性,防止绕过;最后要注意性能优化,合理配置验证码生成和验证的性能,提高系统响应速度;对于前端集成,要正确配置验证码组件,确保验证码正确显示和验证。
