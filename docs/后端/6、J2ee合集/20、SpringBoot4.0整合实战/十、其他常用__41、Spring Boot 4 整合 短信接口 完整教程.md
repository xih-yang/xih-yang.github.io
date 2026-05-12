# 41、Spring Boot 4 整合 短信接口 完整教程
- 来源：https://ddkk.com/springboot/4-action/41.html
- 分类：Spring Boot 4 整合教程
- 分组：十、其他常用
- 日期：2025-12-08
发短信的时候最烦的就是用第三方服务,阿里云短信、腾讯云短信这些都要钱,而且API还不统一,换一家就得改代码,累死累活还容易出错;其实短信服务这玩意儿不错,是云服务商提供的短信发送功能,支持验证码、通知、营销短信,功能全、可靠性高、到达率高,是业界最广泛采用的短信解决方案;但是直接用短信服务商API写,那叫一个复杂,配置AccessKey、写Java SDK、管理签名模板、处理回执,一堆配置写得人头疼;后来发现Spring Boot直接把这些都封装好了,用起来贼简单;现在Spring Boot 4出来了,整合短信接口更是方便得不行,短信SDK自动配置给你整得明明白白,零配置就能用;但是很多兄弟不知道里面的门道,也不知道咋配置短信客户端、发送验证码、发送通知短信、使用模板、批量发送这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

其实短信接口在Spring Boot里早就支持了,你只要加个短信SDK依赖,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋配置短信客户端、发送验证码、发送通知短信、使用模板、批量发送、异步发送这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

## 短信服务基础概念

### 短信服务是啥玩意儿

短信服务(SMS Service)是云服务商提供的短信发送功能,通过API接口发送短信到用户手机;短信服务的核心特性包括:

1. **高到达率**: 通过运营商通道发送,到达率高
2. **快速送达**: 短信通常在几秒内送达
3. **多种类型**: 支持验证码、通知、营销等类型短信
4. **模板管理**: 支持短信模板,便于管理
5. **签名管理**: 支持短信签名,提高可信度
6. **回执查询**: 支持查询短信发送状态
7. **多服务商**: 支持阿里云、腾讯云、华为云等多个服务商

### 短信服务和HTTP、SMTP的区别

1. **协议**: 短信服务使用HTTP/HTTPS API;HTTP是超文本传输协议;SMTP是邮件传输协议
2. **通道**: 短信服务通过运营商通道发送;HTTP通过互联网传输;SMTP通过邮件服务器传输
3. **到达率**: 短信服务到达率高;HTTP和SMTP到达率相对较低
4. **成本**: 短信服务按条计费;HTTP和SMTP通常免费或成本较低
5. **用途**: 短信服务主要用于验证码、通知;HTTP用于Web通信;SMTP用于邮件发送

### 短信服务的核心概念

1. **短信签名**: 短信发送时显示的签名,如"【公司名称】"
2. **短信模板**: 预定义的短信内容模板,支持变量替换
3. **AccessKey**: 访问密钥ID,用于身份验证
4. **AccessSecret**: 访问密钥Secret,用于签名
5. **短信回执**: 短信发送后的状态回执,如成功、失败
6. **短信队列**: 用于批量发送短信的队列
7. **短信限流**: 防止短信轰炸的限流机制

### 短信服务适用场景

1. **用户注册**: 发送注册验证码
2. **登录验证**: 发送登录验证码
3. **密码重置**: 发送密码重置验证码
4. **订单通知**: 发送订单状态通知
5. **系统通知**: 发送系统重要通知
6. **营销推广**: 发送营销推广短信

## 项目搭建和依赖配置

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-sms-demo/
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
│   │       └── application.yml       # 配置文件
│   └── test/
└── README.md
```

### 添加Maven依赖

这是最关键的,依赖配置不对后面全是坑;Spring Boot 4需要Java 17以上,而且短信SDK最新版本已经支持Spring Boot 4了。

**阿里云短信依赖**:

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
    <artifactId>spring-boot-sms-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 SMS Demo</name>
    <description>Spring Boot 4整合短信接口示例项目</description>
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
        <!-- 阿里云短信服务SDK -->
        <dependency>
            <groupId>com.aliyun</groupId>
            <artifactId>dysmsapi20170525</artifactId>
            <version>3.0.0</version>
        </dependency>
        <!-- 阿里云核心SDK -->
        <dependency>
            <groupId>com.aliyun</groupId>
            <artifactId>tea-openapi</artifactId>
            <version>0.3.0</version>
        </dependency>
        <!-- 腾讯云短信服务SDK -->
        <dependency>
            <groupId>com.tencentcloudapi</groupId>
            <artifactId>tencentcloud-sdk-java-sms</artifactId>
            <version>3.1.1000</version>
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
    name: spring-boot-sms-demo  # 应用名称
# 阿里云短信配置
aliyun:
  sms:
    access-key-id: your-access-key-id  # 阿里云AccessKey ID
    access-key-secret: your-access-key-secret  # 阿里云AccessKey Secret
    sign-name: 你的签名  # 短信签名
    template-code: SMS_123456789  # 短信模板代码
    region-id: cn-hangzhou  # 地域ID,默认cn-hangzhou
# 腾讯云短信配置
tencent:
  sms:
    secret-id: your-secret-id  # 腾讯云SecretId
    secret-key: your-secret-key  # 腾讯云SecretKey
    app-id: your-app-id  # 短信应用ID
    sign-name: 你的签名  # 短信签名
    template-id: 123456  # 短信模板ID
    region: ap-beijing  # 地域,默认ap-beijing
```

## 阿里云短信服务

### 阿里云短信配置

创建阿里云短信配置类:

```java
package com.example.demo.config;
import com.aliyun.dysmsapi20170525.Client;
import com.aliyun.teaopenapi.models.Config;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
/**
 * 阿里云短信配置类
 */
@Slf4j
@Data
@Configuration
public class AliyunSmsConfig {
    @Value("${aliyun.sms.access-key-id}")
    private String accessKeyId;
    @Value("${aliyun.sms.access-key-secret}")
    private String accessKeySecret;
    @Value("${aliyun.sms.region-id:cn-hangzhou}")
    private String regionId;
    @Value("${aliyun.sms.sign-name}")
    private String signName;
    @Value("${aliyun.sms.template-code}")
    private String templateCode;
    /**
     * 创建阿里云短信客户端
     */
    @Bean
    public Client aliyunSmsClient() throws Exception {
        Config config = new Config()
                .setAccessKeyId(accessKeyId)
                .setAccessKeySecret(accessKeySecret)
                .setRegionId(regionId);
        Client client = new Client(config);
        log.info("阿里云短信客户端初始化成功, Region: {}", regionId);
        return client;
    }
}
```

### 阿里云短信服务

创建阿里云短信服务:

```java
package com.example.demo.service;
import com.aliyun.dysmsapi20170525.Client;
import com.aliyun.dysmsapi20170525.models.SendSmsRequest;
import com.aliyun.dysmsapi20170525.models.SendSmsResponse;
import com.aliyun.teautil.models.RuntimeOptions;
import com.example.demo.config.AliyunSmsConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;
/**
 * 阿里云短信服务
 */
@Slf4j
@Service
public class AliyunSmsService {
    @Autowired
    private Client aliyunSmsClient;
    @Autowired
    private AliyunSmsConfig aliyunSmsConfig;
    private final ObjectMapper objectMapper = new ObjectMapper();
    /**
     * 发送短信
     * 
     * @param phoneNumber 手机号码
     * @param templateCode 模板代码
     * @param templateParam 模板参数(JSON字符串)
     * @return 是否发送成功
     */
    public boolean sendSms(String phoneNumber, String templateCode, String templateParam) {
        try {
            SendSmsRequest request = new SendSmsRequest()
                    .setPhoneNumbers(phoneNumber)
                    .setSignName(aliyunSmsConfig.getSignName())
                    .setTemplateCode(templateCode)
                    .setTemplateParam(templateParam);
            RuntimeOptions runtime = new RuntimeOptions();
            SendSmsResponse response = aliyunSmsClient.sendSmsWithOptions(request, runtime);
            if ("OK".equals(response.getBody().getCode())) {
                log.info("阿里云短信发送成功: {} -> {}, RequestId: {}", 
                        phoneNumber, templateCode, response.getBody().getRequestId());
                return true;
            } else {
                log.error("阿里云短信发送失败: {} -> {}, Code: {}, Message: {}", 
                        phoneNumber, templateCode, response.getBody().getCode(), response.getBody().getMessage());
                return false;
            }
        } catch (Exception e) {
            log.error("阿里云短信发送异常: {}", e.getMessage(), e);
            return false;
        }
    }
    /**
     * 发送验证码短信
     * 
     * @param phoneNumber 手机号码
     * @param code 验证码
     * @return 是否发送成功
     */
    public boolean sendVerificationCode(String phoneNumber, String code) {
        try {
            Map<String, String> params = new HashMap<>();
            params.put("code", code);
            String templateParam = objectMapper.writeValueAsString(params);
            return sendSms(phoneNumber, aliyunSmsConfig.getTemplateCode(), templateParam);
        } catch (Exception e) {
            log.error("发送验证码短信失败: {}", e.getMessage(), e);
            return false;
        }
    }
    /**
     * 发送通知短信
     * 
     * @param phoneNumber 手机号码
     * @param templateCode 模板代码
     * @param params 模板参数
     * @return 是否发送成功
     */
    public boolean sendNotificationSms(String phoneNumber, String templateCode, Map<String, String> params) {
        try {
            String templateParam = objectMapper.writeValueAsString(params);
            return sendSms(phoneNumber, templateCode, templateParam);
        } catch (Exception e) {
            log.error("发送通知短信失败: {}", e.getMessage(), e);
            return false;
        }
    }
    /**
     * 批量发送短信
     * 
     * @param phoneNumbers 手机号码列表
     * @param templateCode 模板代码
     * @param templateParam 模板参数(JSON字符串)
     * @return 成功发送的数量
     */
    public int sendBatchSms(java.util.List<String> phoneNumbers, String templateCode, String templateParam) {
        int successCount = 0;
        for (String phoneNumber : phoneNumbers) {
            if (sendSms(phoneNumber, templateCode, templateParam)) {
                successCount++;
            }
        }
        return successCount;
    }
}
```

## 腾讯云短信服务

### 腾讯云短信配置

创建腾讯云短信配置类:

```java
package com.example.demo.config;
import com.tencentcloudapi.common.Credential;
import com.tencentcloudapi.common.profile.ClientProfile;
import com.tencentcloudapi.common.profile.HttpProfile;
import com.tencentcloudapi.sms.v20210111.SmsClient;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
/**
 * 腾讯云短信配置类
 */
@Slf4j
@Data
@Configuration
public class TencentSmsConfig {
    @Value("${tencent.sms.secret-id}")
    private String secretId;
    @Value("${tencent.sms.secret-key}")
    private String secretKey;
    @Value("${tencent.sms.app-id}")
    private String appId;
    @Value("${tencent.sms.sign-name}")
    private String signName;
    @Value("${tencent.sms.template-id}")
    private String templateId;
    @Value("${tencent.sms.region:ap-beijing}")
    private String region;
    /**
     * 创建腾讯云短信客户端
     */
    @Bean
    public SmsClient tencentSmsClient() {
        Credential cred = new Credential(secretId, secretKey);
        HttpProfile httpProfile = new HttpProfile();
        httpProfile.setEndpoint("sms.tencentcloudapi.com");
        ClientProfile clientProfile = new ClientProfile();
        clientProfile.setHttpProfile(httpProfile);
        SmsClient client = new SmsClient(cred, region, clientProfile);
        log.info("腾讯云短信客户端初始化成功, Region: {}", region);
        return client;
    }
}
```

### 腾讯云短信服务

创建腾讯云短信服务:

```java
package com.example.demo.service;
import com.tencentcloudapi.common.exception.TencentCloudSDKException;
import com.tencentcloudapi.sms.v20210111.SmsClient;
import com.tencentcloudapi.sms.v20210111.models.SendSmsRequest;
import com.tencentcloudapi.sms.v20210111.models.SendSmsResponse;
import com.example.demo.config.TencentSmsConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Arrays;
/**
 * 腾讯云短信服务
 */
@Slf4j
@Service
public class TencentSmsService {
    @Autowired
    private SmsClient tencentSmsClient;
    @Autowired
    private TencentSmsConfig tencentSmsConfig;
    /**
     * 发送短信
     * 
     * @param phoneNumber 手机号码(需要带国家码,如+86)
     * @param templateId 模板ID
     * @param templateParams 模板参数数组
     * @return 是否发送成功
     */
    public boolean sendSms(String phoneNumber, String templateId, String[] templateParams) {
        try {
            SendSmsRequest req = new SendSmsRequest();
            // 设置短信应用ID
            req.setSmsSdkAppId(tencentSmsConfig.getAppId());
            // 设置短信签名
            req.setSignName(tencentSmsConfig.getSignName());
            // 设置模板ID
            req.setTemplateId(templateId);
            // 设置手机号(需要带国家码)
            String[] phoneNumberSet = {phoneNumber};
            req.setPhoneNumberSet(phoneNumberSet);
            // 设置模板参数
            req.setTemplateParamSet(templateParams);
            SendSmsResponse resp = tencentSmsClient.SendSms(req);
            if ("Ok".equals(resp.getSendStatusSet()[0].getCode())) {
                log.info("腾讯云短信发送成功: {} -> {}, RequestId: {}", 
                        phoneNumber, templateId, resp.getRequestId());
                return true;
            } else {
                log.error("腾讯云短信发送失败: {} -> {}, Code: {}, Message: {}", 
                        phoneNumber, templateId, resp.getSendStatusSet()[0].getCode(), 
                        resp.getSendStatusSet()[0].getMessage());
                return false;
            }
        } catch (TencentCloudSDKException e) {
            log.error("腾讯云短信发送异常: {}", e.getMessage(), e);
            return false;
        }
    }
    /**
     * 发送验证码短信
     * 
     * @param phoneNumber 手机号码
     * @param code 验证码
     * @return 是否发送成功
     */
    public boolean sendVerificationCode(String phoneNumber, String code) {
        // 腾讯云短信需要带国家码
        String fullPhoneNumber = phoneNumber.startsWith("+") ? phoneNumber : "+86" + phoneNumber;
        String[] templateParams = {code};
        return sendSms(fullPhoneNumber, tencentSmsConfig.getTemplateId(), templateParams);
    }
    /**
     * 发送通知短信
     * 
     * @param phoneNumber 手机号码
     * @param templateId 模板ID
     * @param params 模板参数数组
     * @return 是否发送成功
     */
    public boolean sendNotificationSms(String phoneNumber, String templateId, String[] params) {
        String fullPhoneNumber = phoneNumber.startsWith("+") ? phoneNumber : "+86" + phoneNumber;
        return sendSms(fullPhoneNumber, templateId, params);
    }
    /**
     * 批量发送短信
     * 
     * @param phoneNumbers 手机号码列表
     * @param templateId 模板ID
     * @param templateParams 模板参数数组
     * @return 成功发送的数量
     */
    public int sendBatchSms(java.util.List<String> phoneNumbers, String templateId, String[] templateParams) {
        int successCount = 0;
        for (String phoneNumber : phoneNumbers) {
            String fullPhoneNumber = phoneNumber.startsWith("+") ? phoneNumber : "+86" + phoneNumber;
            if (sendSms(fullPhoneNumber, templateId, templateParams)) {
                successCount++;
            }
        }
        return successCount;
    }
}
```

## 统一短信服务接口

### 创建短信服务接口

为了支持多个短信服务商,创建统一的短信服务接口:

```java
package com.example.demo.service;
/**
 * 短信服务接口
 */
public interface SmsService {
    /**
     * 发送验证码短信
     * 
     * @param phoneNumber 手机号码
     * @param code 验证码
     * @return 是否发送成功
     */
    boolean sendVerificationCode(String phoneNumber, String code);
    /**
     * 发送通知短信
     * 
     * @param phoneNumber 手机号码
     * @param templateCode 模板代码
     * @param params 模板参数
     * @return 是否发送成功
     */
    boolean sendNotificationSms(String phoneNumber, String templateCode, Object params);
}
```

### 实现统一短信服务

实现统一的短信服务,支持多个服务商:

```java
package com.example.demo.service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.Map;
/**
 * 统一短信服务实现
 */
@Slf4j
@Service
public class UnifiedSmsService implements SmsService {
    @Autowired
    private AliyunSmsService aliyunSmsService;
    @Autowired
    private TencentSmsService tencentSmsService;
    @Value("${sms.provider:aliyun}")
    private String smsProvider;  // 短信服务商: aliyun, tencent
    @Override
    public boolean sendVerificationCode(String phoneNumber, String code) {
        try {
            switch (smsProvider.toLowerCase()) {
                case "aliyun":
                    return aliyunSmsService.sendVerificationCode(phoneNumber, code);
                case "tencent":
                    return tencentSmsService.sendVerificationCode(phoneNumber, code);
                default:
                    log.error("不支持的短信服务商: {}", smsProvider);
                    return false;
            }
        } catch (Exception e) {
            log.error("发送验证码短信失败: {}", e.getMessage(), e);
            return false;
        }
    }
    @Override
    public boolean sendNotificationSms(String phoneNumber, String templateCode, Object params) {
        try {
            switch (smsProvider.toLowerCase()) {
                case "aliyun":
                    if (params instanceof Map) {
                        return aliyunSmsService.sendNotificationSms(phoneNumber, templateCode, (Map<String, String>) params);
                    }
                    return false;
                case "tencent":
                    if (params instanceof String[]) {
                        return tencentSmsService.sendNotificationSms(phoneNumber, templateCode, (String[]) params);
                    }
                    return false;
                default:
                    log.error("不支持的短信服务商: {}", smsProvider);
                    return false;
            }
        } catch (Exception e) {
            log.error("发送通知短信失败: {}", e.getMessage(), e);
            return false;
        }
    }
}
```

## 验证码服务

### 创建验证码服务

创建验证码生成和验证服务:

```java
package com.example.demo.service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import java.util.Random;
import java.util.concurrent.TimeUnit;
/**
 * 验证码服务
 */
@Slf4j
@Service
public class VerificationCodeService {
    @Autowired
    private SmsService smsService;
    @Autowired
    private StringRedisTemplate redisTemplate;
    private static final String CODE_PREFIX = "sms:code:";
    private static final int CODE_EXPIRE_MINUTES = 5;  // 验证码5分钟过期
    private static final int CODE_LENGTH = 6;  // 验证码长度
    /**
     * 生成验证码
     * 
     * @return 验证码
     */
    private String generateCode() {
        Random random = new Random();
        StringBuilder code = new StringBuilder();
        for (int i = 0; i < CODE_LENGTH; i++) {
            code.append(random.nextInt(10));
        }
        return code.toString();
    }
    /**
     * 发送验证码
     * 
     * @param phoneNumber 手机号码
     * @return 是否发送成功
     */
    public boolean sendVerificationCode(String phoneNumber) {
        try {
            // 生成验证码
            String code = generateCode();
            // 发送短信
            boolean sent = smsService.sendVerificationCode(phoneNumber, code);
            if (sent) {
                // 保存验证码到Redis,5分钟过期
                String key = CODE_PREFIX + phoneNumber;
                redisTemplate.opsForValue().set(key, code, CODE_EXPIRE_MINUTES, TimeUnit.MINUTES);
                log.info("验证码发送成功: {}", phoneNumber);
                return true;
            } else {
                log.error("验证码发送失败: {}", phoneNumber);
                return false;
            }
        } catch (Exception e) {
            log.error("发送验证码异常: {}", e.getMessage(), e);
            return false;
        }
    }
    /**
     * 验证验证码
     * 
     * @param phoneNumber 手机号码
     * @param code 验证码
     * @return 是否验证成功
     */
    public boolean verifyCode(String phoneNumber, String code) {
        try {
            String key = CODE_PREFIX + phoneNumber;
            String storedCode = redisTemplate.opsForValue().get(key);
            if (storedCode == null) {
                log.warn("验证码不存在或已过期: {}", phoneNumber);
                return false;
            }
            if (storedCode.equals(code)) {
                // 验证成功后删除验证码
                redisTemplate.delete(key);
                log.info("验证码验证成功: {}", phoneNumber);
                return true;
            } else {
                log.warn("验证码错误: {}", phoneNumber);
                return false;
            }
        } catch (Exception e) {
            log.error("验证验证码异常: {}", e.getMessage(), e);
            return false;
        }
    }
    /**
     * 检查是否在限流时间内
     * 
     * @param phoneNumber 手机号码
     * @return 是否在限流时间内
     */
    public boolean isRateLimited(String phoneNumber) {
        String key = CODE_PREFIX + "rate:" + phoneNumber;
        String value = redisTemplate.opsForValue().get(key);
        return value != null;
    }
    /**
     * 设置限流
     * 
     * @param phoneNumber 手机号码
     * @param seconds 限流时间(秒)
     */
    public void setRateLimit(String phoneNumber, int seconds) {
        String key = CODE_PREFIX + "rate:" + phoneNumber;
        redisTemplate.opsForValue().set(key, "1", seconds, TimeUnit.SECONDS);
    }
}
```

## 控制器实现

### 短信发送控制器

创建短信发送控制器:

```java
package com.example.demo.controller;
import com.example.demo.service.SmsService;
import com.example.demo.service.VerificationCodeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
/**
 * 短信发送控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/sms")
public class SmsController {
    @Autowired
    private SmsService smsService;
    @Autowired
    private VerificationCodeService verificationCodeService;
    /**
     * 发送验证码
     */
    @PostMapping("/send-code")
    public ResponseEntity<Map<String, Object>> sendVerificationCode(@RequestParam String phoneNumber) {
        Map<String, Object> result = new HashMap<>();
        try {
            // 检查限流
            if (verificationCodeService.isRateLimited(phoneNumber)) {
                result.put("success", false);
                result.put("message", "发送过于频繁,请稍后再试");
                return ResponseEntity.ok(result);
            }
            // 发送验证码
            boolean sent = verificationCodeService.sendVerificationCode(phoneNumber);
            if (sent) {
                // 设置限流,60秒内不能重复发送
                verificationCodeService.setRateLimit(phoneNumber, 60);
                result.put("success", true);
                result.put("message", "验证码发送成功");
                return ResponseEntity.ok(result);
            } else {
                result.put("success", false);
                result.put("message", "验证码发送失败");
                return ResponseEntity.ok(result);
            }
        } catch (Exception e) {
            log.error("发送验证码失败: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("message", "发送验证码失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(result);
        }
    }
    /**
     * 验证验证码
     */
    @PostMapping("/verify-code")
    public ResponseEntity<Map<String, Object>> verifyCode(
            @RequestParam String phoneNumber,
            @RequestParam String code) {
        Map<String, Object> result = new HashMap<>();
        try {
            boolean verified = verificationCodeService.verifyCode(phoneNumber, code);
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

## 异步短信发送

### 配置异步短信发送

对于大量短信发送,使用异步发送提高性能:

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
     * 配置异步短信发送线程池
     */
    @Bean(name = "smsExecutor")
    public Executor smsExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        // 核心线程数
        executor.setCorePoolSize(5);
        // 最大线程数
        executor.setMaxPoolSize(10);
        // 队列容量
        executor.setQueueCapacity(100);
        // 线程名前缀
        executor.setThreadNamePrefix("sms-async-");
        // 拒绝策略: 调用者运行
        executor.setRejectedExecutionHandler(new java.util.concurrent.ThreadPoolExecutor.CallerRunsPolicy());
        // 初始化
        executor.initialize();
        return executor;
    }
}
```

### 异步短信服务

创建异步短信发送服务:

```java
package com.example.demo.service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import java.util.concurrent.CompletableFuture;
/**
 * 异步短信服务
 */
@Slf4j
@Service
public class AsyncSmsService {
    @Autowired
    private SmsService smsService;
    /**
     * 异步发送验证码
     * 
     * @param phoneNumber 手机号码
     * @param code 验证码
     * @return CompletableFuture
     */
    @Async("smsExecutor")
    public CompletableFuture<Boolean> sendVerificationCodeAsync(String phoneNumber, String code) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                boolean sent = smsService.sendVerificationCode(phoneNumber, code);
                log.info("异步验证码发送{}: {} -> {}", sent ? "成功" : "失败", phoneNumber, code);
                return sent;
            } catch (Exception e) {
                log.error("异步验证码发送异常: {}", e.getMessage(), e);
                return false;
            }
        });
    }
}
```

## 最佳实践

1. **短信签名**: 使用规范的短信签名,提高可信度
2. **短信模板**: 使用审核通过的短信模板,避免被拦截
3. **验证码限流**: 实现验证码发送限流,防止短信轰炸
4. **验证码过期**: 设置合理的验证码过期时间,通常5-10分钟
5. **异步发送**: 大量短信使用异步发送,不阻塞主线程
6. **错误处理**: 妥善处理短信发送异常,记录日志
7. **回执查询**: 对于重要短信,查询发送回执确认状态
8. **成本控制**: 合理控制短信发送量,避免不必要的成本
9. **多服务商**: 支持多个短信服务商,提高可用性
10. **性能优化**: 合理配置线程池,提高短信发送效率

## 常见问题

### 1. 短信发送失败

检查AccessKey、SecretKey是否正确,检查签名和模板是否审核通过。

### 2. 验证码收不到

检查手机号码格式是否正确,检查短信模板参数是否正确。

### 3. 短信被拦截

确保短信内容符合规范,避免包含敏感词汇。

### 4. 发送速度慢

使用异步发送,或者增加线程池大小。

### 5. 成本过高

合理控制短信发送量,使用短信队列批量发送。

### 6. 验证码过期

检查Redis配置,确保验证码正确存储和过期。

### 7. 限流不生效

检查Redis连接,确保限流key正确设置。

### 8. 多服务商切换

通过配置文件切换短信服务商,确保接口统一。

### 9. 短信模板参数错误

确保模板参数格式正确,阿里云使用JSON格式,腾讯云使用数组格式。

### 10. 手机号码格式错误

腾讯云短信需要带国家码(如+86),阿里云短信不需要。

## 短信回执查询

### 阿里云短信回执查询

查询阿里云短信发送状态:

```java
package com.example.demo.service;
import com.aliyun.dysmsapi20170525.Client;
import com.aliyun.dysmsapi20170525.models.QuerySendDetailsRequest;
import com.aliyun.dysmsapi20170525.models.QuerySendDetailsResponse;
import com.aliyun.teautil.models.RuntimeOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.text.SimpleDateFormat;
import java.util.Date;
/**
 * 短信回执查询服务
 */
@Slf4j
@Service
public class SmsReceiptService {
    @Autowired
    private Client aliyunSmsClient;
    /**
     * 查询短信发送详情
     * 
     * @param phoneNumber 手机号码
     * @param sendDate 发送日期(yyyyMMdd格式)
     * @param pageSize 每页记录数
     * @param currentPage 当前页码
     * @return 发送详情
     */
    public QuerySendDetailsResponse querySendDetails(String phoneNumber, String sendDate, 
                                                      Long pageSize, Long currentPage) {
        try {
            QuerySendDetailsRequest request = new QuerySendDetailsRequest()
                    .setPhoneNumber(phoneNumber)
                    .setSendDate(sendDate)
                    .setPageSize(pageSize)
                    .setCurrentPage(currentPage);
            RuntimeOptions runtime = new RuntimeOptions();
            QuerySendDetailsResponse response = aliyunSmsClient.querySendDetailsWithOptions(request, runtime);
            log.info("查询短信发送详情成功: {} -> {}, 总数: {}", 
                    phoneNumber, sendDate, response.getBody().getTotalCount());
            return response;
        } catch (Exception e) {
            log.error("查询短信发送详情失败: {}", e.getMessage(), e);
            return null;
        }
    }
    /**
     * 查询今天的短信发送详情
     * 
     * @param phoneNumber 手机号码
     * @return 发送详情
     */
    public QuerySendDetailsResponse queryTodaySendDetails(String phoneNumber) {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMdd");
        String sendDate = sdf.format(new Date());
        return querySendDetails(phoneNumber, sendDate, 10L, 1L);
    }
}
```

## 短信队列

### 使用消息队列发送短信

对于大量短信,可以使用消息队列(如RabbitMQ、Kafka)进行异步处理:

```java
package com.example.demo.service;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
/**
 * 短信队列服务
 */
@Slf4j
@Service
public class SmsQueueService {
    @Autowired
    private RabbitTemplate rabbitTemplate;
    @Autowired
    private SmsService smsService;
    private static final String SMS_QUEUE = "sms.queue";
    /**
     * 将短信加入队列
     * 
     * @param phoneNumber 手机号码
     * @param code 验证码
     */
    public void enqueueSms(String phoneNumber, String code) {
        SmsMessage smsMessage = new SmsMessage(phoneNumber, code);
        rabbitTemplate.convertAndSend(SMS_QUEUE, smsMessage);
        log.info("短信已加入队列: {} -> {}", phoneNumber, code);
    }
    /**
     * 监听短信队列并发送
     */
    @RabbitListener(queues = SMS_QUEUE)
    public void processSms(SmsMessage smsMessage) {
        try {
            boolean sent = smsService.sendVerificationCode(smsMessage.getPhoneNumber(), smsMessage.getCode());
            if (sent) {
                log.info("队列短信发送成功: {} -> {}", smsMessage.getPhoneNumber(), smsMessage.getCode());
            } else {
                log.error("队列短信发送失败: {} -> {}", smsMessage.getPhoneNumber(), smsMessage.getCode());
                // 可以加入死信队列或重试
            }
        } catch (Exception e) {
            log.error("队列短信发送异常: {}", e.getMessage(), e);
        }
    }
    /**
     * 短信消息类
     */
    public static class SmsMessage {
        private String phoneNumber;
        private String code;
        public SmsMessage() {}
        public SmsMessage(String phoneNumber, String code) {
            this.phoneNumber = phoneNumber;
            this.code = code;
        }
        // Getters and Setters
        public String getPhoneNumber() { return phoneNumber; }
        public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
    }
}
```

## 短信发送统计

### 短信发送统计服务

记录短信发送统计信息:

```java
package com.example.demo.service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.TimeUnit;
/**
 * 短信统计服务
 */
@Slf4j
@Service
public class SmsStatisticsService {
    @Autowired
    private StringRedisTemplate redisTemplate;
    private static final String STATS_PREFIX = "sms:stats:";
    private static final String DAILY_PREFIX = "sms:daily:";
    /**
     * 记录发送成功
     */
    public void recordSuccess() {
        String key = STATS_PREFIX + "success";
        redisTemplate.opsForValue().increment(key);
    }
    /**
     * 记录发送失败
     */
    public void recordFailure() {
        String key = STATS_PREFIX + "failure";
        redisTemplate.opsForValue().increment(key);
    }
    /**
     * 记录每日发送量
     */
    public void recordDaily(String phoneNumber) {
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String key = DAILY_PREFIX + date + ":" + phoneNumber;
        redisTemplate.opsForValue().increment(key);
        redisTemplate.expire(key, 7, TimeUnit.DAYS);  // 7天后过期
    }
    /**
     * 获取今日发送量
     */
    public long getTodayCount(String phoneNumber) {
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String key = DAILY_PREFIX + date + ":" + phoneNumber;
        String count = redisTemplate.opsForValue().get(key);
        return count != null ? Long.parseLong(count) : 0;
    }
    /**
     * 获取统计信息
     */
    public SmsStatistics getStatistics() {
        String successKey = STATS_PREFIX + "success";
        String failureKey = STATS_PREFIX + "failure";
        String successCount = redisTemplate.opsForValue().get(successKey);
        String failureCount = redisTemplate.opsForValue().get(failureKey);
        long success = successCount != null ? Long.parseLong(successCount) : 0;
        long failure = failureCount != null ? Long.parseLong(failureCount) : 0;
        long total = success + failure;
        double successRate = total > 0 ? (double) success / total * 100 : 0;
        return new SmsStatistics(success, failure, total, successRate);
    }
    /**
     * 短信统计信息类
     */
    public static class SmsStatistics {
        private final long successCount;
        private final long failureCount;
        private final long totalCount;
        private final double successRate;
        public SmsStatistics(long successCount, long failureCount, long totalCount, double successRate) {
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

## 实际应用场景

### 用户注册验证码

发送用户注册验证码:

```java
package com.example.demo.service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
/**
 * 用户注册服务
 */
@Slf4j
@Service
public class UserRegistrationService {
    @Autowired
    private VerificationCodeService verificationCodeService;
    @Autowired
    private SmsStatisticsService smsStatisticsService;
    /**
     * 发送注册验证码
     * 
     * @param phoneNumber 手机号码
     * @return 是否发送成功
     */
    public boolean sendRegistrationCode(String phoneNumber) {
        try {
            // 检查今日发送量,防止短信轰炸
            long todayCount = smsStatisticsService.getTodayCount(phoneNumber);
            if (todayCount >= 10) {
                log.warn("今日发送量已达上限: {}", phoneNumber);
                return false;
            }
            // 发送验证码
            boolean sent = verificationCodeService.sendVerificationCode(phoneNumber);
            if (sent) {
                // 记录统计
                smsStatisticsService.recordSuccess();
                smsStatisticsService.recordDaily(phoneNumber);
                log.info("注册验证码发送成功: {}", phoneNumber);
            } else {
                smsStatisticsService.recordFailure();
                log.error("注册验证码发送失败: {}", phoneNumber);
            }
            return sent;
        } catch (Exception e) {
            log.error("发送注册验证码异常: {}", e.getMessage(), e);
            smsStatisticsService.recordFailure();
            return false;
        }
    }
}
```

### 订单通知短信

发送订单状态通知短信:

```java
package com.example.demo.service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
import java.util.HashMap;
import java.util.Map;
/**
 * 订单通知服务
 */
@Slf4j
@Service
public class OrderNotificationService {
    @Autowired
    private SmsService smsService;
    /**
     * 发送订单确认短信
     * 
     * @param phoneNumber 手机号码
     * @param orderNumber 订单号
     * @param orderAmount 订单金额
     */
    public void sendOrderConfirmationSms(String phoneNumber, String orderNumber, String orderAmount) {
        try {
            Map<String, String> params = new HashMap<>();
            params.put("orderNumber", orderNumber);
            params.put("orderAmount", orderAmount);
            boolean sent = smsService.sendNotificationSms(phoneNumber, "ORDER_CONFIRM", params);
            if (sent) {
                log.info("订单确认短信发送成功: {} -> {}", phoneNumber, orderNumber);
            } else {
                log.error("订单确认短信发送失败: {} -> {}", phoneNumber, orderNumber);
            }
        } catch (Exception e) {
            log.error("发送订单确认短信异常: {}", e.getMessage(), e);
        }
    }
}
```

## 总结

Spring Boot 4整合短信接口非常方便,只需要添加短信SDK依赖就能用;短信服务是云服务商提供的短信发送功能,支持验证码、通知、营销等类型短信;支持阿里云、腾讯云等多个服务商,可以根据需求选择合适的服务商;支持验证码生成和验证、短信回执查询、短信队列、短信统计等高级功能;兄弟们根据实际需求选择合适的配置,就能轻松搞定短信发送了;但是要注意合理配置短信签名和模板,使用审核通过的模板,避免被拦截;同时要注意验证码限流和过期时间,防止短信轰炸;还要注意错误处理和异步发送,确保短信发送的可靠性;最后要注意成本控制,合理控制短信发送量,避免不必要的成本;对于大量短信,可以使用消息队列和异步发送,提高系统性能和可靠性。
