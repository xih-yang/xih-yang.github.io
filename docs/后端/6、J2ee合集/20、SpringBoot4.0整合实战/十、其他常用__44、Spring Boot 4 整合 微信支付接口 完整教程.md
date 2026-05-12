# 44、Spring Boot 4 整合 微信支付接口 完整教程
- 来源：https://ddkk.com/springboot/4-action/44.html
- 分类：Spring Boot 4 整合教程
- 分组：十、其他常用
- 日期：2025-12-08
对接微信支付的时候最烦的就是配置证书、写签名、处理回调,一堆配置写得人头疼,而且APIv3还复杂,一不小心就出错;其实微信支付这玩意儿不错,是国内最主流的支付方式之一,支持JSAPI支付、Native支付、H5支付、APP支付,功能全、安全性高、用户体验好,是电商、O2O、SaaS等场景的标配;但是直接用微信支付APIv3写,那叫一个复杂,配置商户号、写RSA签名、管理证书、处理异步通知,一堆配置写得人头疼;后来发现微信支付官方Java SDK直接把这些都封装好了,用起来贼简单;现在Spring Boot 4出来了,整合微信支付更是方便得不行,微信支付SDK自动配置给你整得明明白白,零配置就能用;但是很多兄弟不知道里面的门道,也不知道咋配置微信支付客户端、创建支付订单、查询支付状态、处理支付回调、退款这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

其实微信支付在Spring Boot里早就支持了,你只要加个微信支付SDK依赖,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋配置微信支付客户端、创建支付订单、查询支付状态、处理支付回调、退款、关闭订单这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

## 微信支付基础概念

### 微信支付是啥玩意儿

微信支付(WeChat Pay)是微信官方提供的支付服务,通过API接口实现各种支付场景;微信支付的核心特性包括:

1. **多种支付方式**: 支持JSAPI支付、Native支付、H5支付、APP支付等
2. **高安全性**: 使用RSA签名和证书加密,保证交易安全
3. **异步通知**: 支持异步通知机制,及时获取支付结果
4. **订单查询**: 支持查询订单状态,便于对账
5. **退款功能**: 支持全额退款和部分退款
6. **多场景支持**: 适用于电商、O2O、SaaS等多种业务场景
7. **APIv3**: 使用最新的APIv3接口,更安全、更规范

### 微信支付和支付宝支付的区别

1. **用户群体**: 微信支付主要面向微信生态用户;支付宝主要面向淘宝、天猫用户
2. **支付场景**: 微信支付更适合社交场景;支付宝更适合电商场景
3. **API风格**: 微信支付APIv3相对规范;支付宝API相对统一
4. **证书管理**: 微信支付主要使用证书模式;支付宝支持证书模式和非证书模式
5. **回调机制**: 两者都支持异步通知,但参数格式不同

### 微信支付的核心概念

1. **商户号(mchid)**: 微信支付分配给商户的唯一标识
2. **应用ID(appid)**: 微信开放平台分配给应用的应用ID
3. **商户API证书**: 商户用于签名请求的私钥证书
4. **商户证书序列号**: 商户API证书的序列号
5. **微信支付平台证书**: 微信支付提供的公钥证书,用于验证响应
6. **APIv3密钥**: 用于回调通知数据加密解密的密钥
7. **异步通知**: 支付完成后微信支付主动推送的通知
8. **订单号**: 商户系统生成的唯一订单号
9. **交易号**: 微信支付生成的唯一交易号

### 微信支付适用场景

1. **电商平台**: 在线购物、订单支付
2. **O2O服务**: 外卖、打车、预约服务
3. **SaaS平台**: 会员充值、服务订阅
4. **内容付费**: 知识付费、课程购买
5. **游戏充值**: 游戏币充值、道具购买
6. **生活缴费**: 水电费、话费充值

## 项目搭建和依赖配置

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-wechatpay-demo/
├── pom.xml                          # Maven配置文件
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── demo/
│   │   │               ├── Application.java                    # 启动类
│   │   │               ├── config/                              # 配置类目录
│   │   │               │   └── WechatPayConfig.java            # 微信支付配置类
│   │   │               ├── service/                              # 服务层目录
│   │   │               │   ├── WechatPayJsapiService.java       # JSAPI支付服务
│   │   │               │   ├── WechatPayNativeService.java      # Native支付服务
│   │   │               │   ├── WechatPayH5Service.java          # H5支付服务
│   │   │               │   ├── WechatPayQueryService.java        # 支付查询服务
│   │   │               │   ├── WechatPayNotifyService.java      # 支付回调服务
│   │   │               │   ├── WechatPayRefundService.java      # 退款服务
│   │   │               │   └── WechatPayCloseService.java       # 关闭订单服务
│   │   │               ├── controller/                            # 控制器目录
│   │   │               │   ├── WechatPayJsapiController.java   # JSAPI支付控制器
│   │   │               │   ├── WechatPayNativeController.java   # Native支付控制器
│   │   │               │   ├── WechatPayH5Controller.java       # H5支付控制器
│   │   │               │   ├── WechatPayQueryController.java    # 支付查询控制器
│   │   │               │   └── WechatPayNotifyController.java   # 支付回调控制器
│   │   │               ├── entity/                                # 实体类目录(可选)
│   │   │               └── dto/                                 # 数据传输对象目录(可选)
│   │   └── resources/
│   │       ├── application.yml                   # 配置文件
│   │       └── cert/                              # 证书目录
│   │           ├── apiclient_key.pem              # 商户API证书私钥
│   │           └── wechatpay_*.pem                # 微信支付平台证书(可选,SDK可自动下载)
│   └── test/
│       └── java/
│           └── com/
│               └── example/
│                   └── demo/
│                       └── WechatPayServiceTest.java # 测试类(可选)
└── README.md
```

### 添加Maven依赖

这是最关键的,依赖配置不对后面全是坑;Spring Boot 4需要Java 17以上,而且微信支付官方Java SDK最新版本已经支持Spring Boot 4了。

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
    <artifactId>spring-boot-wechatpay-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 WeChat Pay Demo</name>
    <description>Spring Boot 4整合微信支付接口示例项目</description>
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
        <!-- 微信支付官方Java SDK: APIv3版本 -->
        <dependency>
            <groupId>com.github.wechatpay-apiv3</groupId>
            <artifactId>wechatpay-java</artifactId>
            <version>0.2.15</version>
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
    name: spring-boot-wechatpay-demo  # 应用名称
# 微信支付配置
wechat:
  pay:
    # 基础配置
    app-id: wx8888888888888888  # 应用ID,微信开放平台分配
    mch-id: 1900000001  # 商户号,微信支付分配
    merchant-serial-number: 1DDE55AD98E1234567890ABCDEF  # 商户API证书序列号
    api-v3-key: your-api-v3-key-32-characters-long  # APIv3密钥,32个字符
    # 证书配置
    private-key-path: classpath:cert/apiclient_key.pem  # 商户API证书私钥路径
    # 微信支付平台证书路径(可选,如果使用自动更新证书功能则不需要)
    # wechatpay-certificate-path: classpath:cert/wechatpay_cert.pem
    # 是否使用自动更新证书功能(推荐)
    auto-update-certificate: true  # true表示自动更新证书,false表示使用本地证书
    # 异步通知地址(可选,也可以在调用时单独指定)
    notify-url: https://www.yourdomain.com/wechatpay/notify  # 支付类接口异步通知接收服务地址
    # 环境配置
    # 生产环境: https://api.mch.weixin.qq.com
    # 沙箱环境: https://api.mch.weixin.qq.com/sandboxnew
    # 默认使用生产环境,SDK会自动处理
```

## 微信支付SDK配置

### 微信支付配置类

创建微信支付配置类,用于初始化微信支付SDK:

```java
package com.example.demo.config;
import com.wechat.pay.java.core.Config;
import com.wechat.pay.java.core.RSAAutoCertificateConfig;
import com.wechat.pay.java.core.RSAConfig;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.nio.file.Paths;
/**
 * 微信支付配置类
 * 用于初始化微信支付SDK
 */
@Slf4j
@Data
@Configuration
public class WechatPayConfig {
    @Value("${wechat.pay.app-id}")
    private String appId;
    @Value("${wechat.pay.mch-id}")
    private String mchId;
    @Value("${wechat.pay.merchant-serial-number}")
    private String merchantSerialNumber;
    @Value("${wechat.pay.api-v3-key}")
    private String apiV3Key;
    @Value("${wechat.pay.private-key-path}")
    private String privateKeyPath;
    @Value("${wechat.pay.wechatpay-certificate-path:}")
    private String wechatPayCertificatePath;
    @Value("${wechat.pay.auto-update-certificate:true}")
    private boolean autoUpdateCertificate;
    @Value("${wechat.pay.notify-url:}")
    private String notifyUrl;
    /**
     * 创建微信支付配置对象
     * 根据配置选择自动更新证书或使用本地证书
     */
    @Bean
    public Config wechatPayConfig() {
        try {
            Config config;
            if (autoUpdateCertificate) {
                // 使用自动更新证书功能(推荐)
                // SDK会自动下载和更新微信支付平台证书
                config = new RSAAutoCertificateConfig.Builder()
                        .merchantId(mchId)
                        .privateKeyFromPath(privateKeyPath)
                        .merchantSerialNumber(merchantSerialNumber)
                        .apiV3Key(apiV3Key)
                        .build();
                log.info("微信支付配置初始化成功(自动更新证书), 商户号: {}, AppId: {}", mchId, appId);
            } else {
                // 使用本地证书
                if (wechatPayCertificatePath == null || wechatPayCertificatePath.isEmpty()) {
                    throw new RuntimeException("使用本地证书模式时必须配置wechatpay-certificate-path");
                }
                config = new RSAConfig.Builder()
                        .merchantId(mchId)
                        .privateKeyFromPath(privateKeyPath)
                        .merchantSerialNumber(merchantSerialNumber)
                        .wechatPayCertificatesFromPath(wechatPayCertificatePath)
                        .build();
                log.info("微信支付配置初始化成功(本地证书), 商户号: {}, AppId: {}", mchId, appId);
            }
            return config;
        } catch (Exception e) {
            log.error("微信支付配置初始化失败: {}", e.getMessage(), e);
            throw new RuntimeException("微信支付配置初始化失败", e);
        }
    }
}
```

## 支付接口详细说明

### 支付接口参数详解

微信支付APIv3接口的核心参数包括:

1. **appid(应用ID)**: 微信开放平台分配给应用的应用ID,必填
2. **mchid(商户号)**: 微信支付分配给商户的唯一标识,必填
3. **out_trade_no(商户订单号)**: 商户系统内部订单号,32个字符以内,只能包含字母、数字、下划线,需保证商户系统内唯一,必填
4. **description(商品描述)**: 商品描述信息,长度不超过127个字符,必填
5. **amount(订单金额)**: 订单金额信息,包含total(总金额,单位为分)和currency(币种,CNY),必填
6. **notify_url(通知地址)**: 支付完成后微信支付主动推送通知的地址,HTTP/HTTPS开头字符串,必填
7. **payer(支付者信息)**: 支付者信息,JSAPI支付需要openid,Native支付不需要,必填(JSAPI)或选填(Native)
8. **time_expire(交易结束时间)**: 订单失效时间,格式为yyyy-MM-ddTHH:mm:ss+08:00,选填
9. **attach(附加数据)**: 附加数据,在查询API和支付通知中原样返回,可作为自定义参数使用,选填
10. **goods_tag(订单优惠标记)**: 订单优惠标记,用于代金券或立减优惠活动,选填

### 金额处理说明

微信支付的金额单位为分,不是元;例如:

- 1元 = 100分
- 99.99元 = 9999分
- 0.01元 = 1分

在代码中处理金额时需要注意单位转换。

## JSAPI支付(公众号支付)

### JSAPI支付流程说明

JSAPI支付的完整流程如下:

1. **商户系统调用下单接口**: 商户系统调用`prepay`接口,传入订单信息和用户openid
2. **微信支付返回预支付交易会话ID**: 微信支付返回`prepay_id`
3. **商户生成调起支付参数**: 商户使用`prepay_id`生成调起支付所需的参数(时间戳、随机串、签名等)
4. **前端调起微信支付**: 前端使用生成的参数调起微信支付
5. **用户在微信内完成支付**: 用户在微信内输入密码或使用指纹等完成支付
6. **微信支付异步通知**: 支付完成后,微信支付主动推送异步通知到商户服务器
7. **商户处理业务逻辑**: 商户验证签名后处理业务逻辑(如更新订单状态)
8. **商户返回success**: 商户返回"success"给微信支付,微信支付停止重试

### JSAPI支付服务

创建JSAPI支付服务,用于生成预支付交易会话ID和调起支付参数:

```java
package com.example.demo.service;
import com.wechat.pay.java.core.Config;
import com.wechat.pay.java.service.payments.jsapi.JsapiService;
import com.wechat.pay.java.service.payments.jsapi.JsapiServiceExtension;
import com.wechat.pay.java.service.payments.jsapi.model.*;
import com.wechat.pay.java.service.payments.model.Transaction;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;
/**
 * 微信支付JSAPI支付服务
 * 用于公众号内调起微信支付
 */
@Slf4j
@Service
public class WechatPayJsapiService {
    @Autowired
    private Config wechatPayConfig;
    @Value("${wechat.pay.app-id}")
    private String appId;
    @Value("${wechat.pay.mch-id}")
    private String mchId;
    @Value("${wechat.pay.notify-url:}")
    private String notifyUrl;
    /**
     * 创建JSAPI支付订单(预支付)
     * 
     * @param outTradeNo 商户订单号
     * @param description 商品描述
     * @param totalAmount 订单总金额,单位为分
     * @param openid 用户openid,用户在公众号下的唯一标识
     * @param notifyUrl 异步通知地址(可选,优先级低于全局配置)
     * @return 预支付交易会话ID(prepay_id)
     */
    public String prepay(String outTradeNo, String description, Long totalAmount, 
                        String openid, String notifyUrl) {
        try {
            // 创建JSAPI支付服务
            JsapiService service = new JsapiService.Builder().config(wechatPayConfig).build();
            // 构建预支付请求
            PrepayRequest request = new PrepayRequest();
            // 设置应用ID
            request.setAppid(appId);
            // 设置商户号
            request.setMchid(mchId);
            // 设置商户订单号
            request.setOutTradeNo(outTradeNo);
            // 设置商品描述
            request.setDescription(description);
            // 设置订单金额
            Amount amount = new Amount();
            amount.setTotal(totalAmount);  // 总金额,单位为分
            amount.setCurrency("CNY");     // 币种,人民币
            request.setAmount(amount);
            // 设置支付者信息
            Payer payer = new Payer();
            payer.setOpenid(openid);  // 用户openid
            request.setPayer(payer);
            // 设置异步通知地址
            String finalNotifyUrl = (notifyUrl != null && !notifyUrl.isEmpty()) 
                    ? notifyUrl : this.notifyUrl;
            if (finalNotifyUrl != null && !finalNotifyUrl.isEmpty()) {
                request.setNotifyUrl(finalNotifyUrl);
            }
            // 调用预支付接口
            PrepayResponse response = service.prepay(request);
            // 获取预支付交易会话ID
            String prepayId = response.getPrepayId();
            log.info("JSAPI支付订单创建成功, 订单号: {}, prepay_id: {}", outTradeNo, prepayId);
            return prepayId;
        } catch (Exception e) {
            log.error("JSAPI支付订单创建异常, 订单号: {}", outTradeNo, e);
            throw new RuntimeException("JSAPI支付订单创建异常: " + e.getMessage(), e);
        }
    }
    /**
     * 创建JSAPI支付订单并生成调起支付参数
     * 使用JsapiServiceExtension可以一次性获取调起支付所需的所有参数
     * 
     * @param outTradeNo 商户订单号
     * @param description 商品描述
     * @param totalAmount 订单总金额,单位为分
     * @param openid 用户openid
     * @param notifyUrl 异步通知地址(可选)
     * @return 调起支付所需的所有参数
     */
    public Map<String, String> prepayWithRequestPayment(String outTradeNo, String description, 
                                                         Long totalAmount, String openid, 
                                                         String notifyUrl) {
        try {
            // 创建JSAPI支付扩展服务
            JsapiServiceExtension service = new JsapiServiceExtension.Builder()
                    .config(wechatPayConfig).build();
            // 构建预支付请求
            PrepayRequest request = new PrepayRequest();
            request.setAppid(appId);
            request.setMchid(mchId);
            request.setOutTradeNo(outTradeNo);
            request.setDescription(description);
            Amount amount = new Amount();
            amount.setTotal(totalAmount);
            amount.setCurrency("CNY");
            request.setAmount(amount);
            Payer payer = new Payer();
            payer.setOpenid(openid);
            request.setPayer(payer);
            String finalNotifyUrl = (notifyUrl != null && !notifyUrl.isEmpty()) 
                    ? notifyUrl : this.notifyUrl;
            if (finalNotifyUrl != null && !finalNotifyUrl.isEmpty()) {
                request.setNotifyUrl(finalNotifyUrl);
            }
            // 调用预支付接口并获取调起支付参数
            PrepayWithRequestPaymentResponse response = service.prepayWithRequestPayment(request);
            // 构建返回参数
            Map<String, String> paymentParams = new HashMap<>();
            paymentParams.put("appId", response.getAppId());           // 应用ID
            paymentParams.put("timeStamp", response.getTimeStamp());   // 时间戳
            paymentParams.put("nonceStr", response.getNonceStr());     // 随机字符串
            paymentParams.put("package", response.getPackageValue());  // 订单详情扩展字符串
            paymentParams.put("signType", response.getSignType());     // 签名类型
            paymentParams.put("paySign", response.getPaySign());        // 签名
            log.info("JSAPI支付订单创建成功(含调起支付参数), 订单号: {}", outTradeNo);
            return paymentParams;
        } catch (Exception e) {
            log.error("JSAPI支付订单创建异常, 订单号: {}", outTradeNo, e);
            throw new RuntimeException("JSAPI支付订单创建异常: " + e.getMessage(), e);
        }
    }
}
```

### JSAPI支付控制器

创建JSAPI支付控制器,提供HTTP接口:

```java
package com.example.demo.controller;
import com.example.demo.service.WechatPayJsapiService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
/**
 * 微信支付JSAPI支付控制器
 */
@Slf4j
@RestController
@RequestMapping("/wechatpay/jsapi")
public class WechatPayJsapiController {
    @Autowired
    private WechatPayJsapiService wechatPayJsapiService;
    /**
     * 创建JSAPI支付订单
     * 
     * @param outTradeNo 商户订单号
     * @param description 商品描述
     * @param totalAmount 订单总金额,单位为分
     * @param openid 用户openid
     * @param notifyUrl 异步通知地址(可选)
     * @return 预支付交易会话ID
     */
    @PostMapping("/prepay")
    public Map<String, Object> prepay(@RequestParam String outTradeNo,
                                      @RequestParam String description,
                                      @RequestParam Long totalAmount,
                                      @RequestParam String openid,
                                      @RequestParam(required = false) String notifyUrl) {
        try {
            // 创建支付订单,获取prepay_id
            String prepayId = wechatPayJsapiService.prepay(
                    outTradeNo, description, totalAmount, openid, notifyUrl);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("prepayId", prepayId);
            result.put("outTradeNo", outTradeNo);
            result.put("message", "订单创建成功");
            return result;
        } catch (Exception e) {
            log.error("创建JSAPI支付订单失败", e);
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "订单创建失败: " + e.getMessage());
            return result;
        }
    }
    /**
     * 创建JSAPI支付订单并获取调起支付参数
     * 
     * @param outTradeNo 商户订单号
     * @param description 商品描述
     * @param totalAmount 订单总金额,单位为分
     * @param openid 用户openid
     * @param notifyUrl 异步通知地址(可选)
     * @return 调起支付所需的所有参数
     */
    @PostMapping("/prepayWithPayment")
    public Map<String, Object> prepayWithRequestPayment(@RequestParam String outTradeNo,
                                                         @RequestParam String description,
                                                         @RequestParam Long totalAmount,
                                                         @RequestParam String openid,
                                                         @RequestParam(required = false) String notifyUrl) {
        try {
            // 创建支付订单并获取调起支付参数
            Map<String, String> paymentParams = wechatPayJsapiService.prepayWithRequestPayment(
                    outTradeNo, description, totalAmount, openid, notifyUrl);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("paymentParams", paymentParams);
            result.put("outTradeNo", outTradeNo);
            result.put("message", "订单创建成功");
            return result;
        } catch (Exception e) {
            log.error("创建JSAPI支付订单失败", e);
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "订单创建失败: " + e.getMessage());
            return result;
        }
    }
}
```

### JSAPI支付前端集成示例

前端获取调起支付参数后,需要在微信内调起支付,以下是完整的前端示例:

**HTML页面示例**:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>微信支付</title>
    <!-- 引入微信JS-SDK -->
    <script src="https://res.wx.qq.com/open/js/jweixin-1.6.0.js"></script>
</head>
<body>
    <div class="payment-container">
        <h2>订单支付</h2>
        <p>订单号: <span id="orderNo"></span></p>
        <p>订单金额: <span id="amount"></span>元</p>
        <button onclick="createPayment()">立即支付</button>
    </div>
    <script>
        const orderNo = 'ORDER_20240101123456';
        const amount = 99.00;  // 元
        const totalAmount = Math.round(amount * 100);  // 转换为分
        const openid = 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o';  // 用户openid,需要从后端获取
        // 创建支付订单并调起支付
        async function createPayment() {
            try {
                // 调用后端接口创建支付订单并获取调起支付参数
                const response = await fetch('/wechatpay/jsapi/prepayWithPayment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        outTradeNo: orderNo,
                        description: '测试商品',
                        totalAmount: totalAmount,
                        openid: openid
                    })
                });
                const result = await response.json();
                if (result.success) {
                    const paymentParams = result.paymentParams;
                    // 调起微信支付
                    WeixinJSBridge.invoke('getBrandWCPayRequest', {
                        "appId": paymentParams.appId,           // 公众号ID,由商户传入
                        "timeStamp": paymentParams.timeStamp,     // 时间戳,自1970年以来的秒数
                        "nonceStr": paymentParams.nonceStr,       // 随机串
                        "package": paymentParams.package,         // 订单详情扩展字符串
                        "signType": paymentParams.signType,       // 微信签名方式:RSA
                        "paySign": paymentParams.paySign          // 微信签名
                    }, function(res) {
                        if (res.err_msg === "get_brand_wcpay_request:ok") {
                            // 使用以上方式判断前端返回,微信团队郑重提示:
                            // res.err_msg将在用户支付成功后返回ok,但并不保证它绝对可靠
                            alert('支付成功!');
                            // 跳转到支付成功页面
                            window.location.href = '/payment/success?orderNo=' + orderNo;
                        } else {
                            alert('支付失败: ' + res.err_msg);
                        }
                    });
                } else {
                    alert('创建支付订单失败: ' + result.message);
                }
            } catch (error) {
                console.error('创建支付订单异常:', error);
                alert('创建支付订单异常: ' + error.message);
            }
        }
        // 兼容处理
        if (typeof WeixinJSBridge === "undefined") {
            if (document.addEventListener) {
                document.addEventListener('WeixinJSBridgeReady', createPayment, false);
            } else if (document.attachEvent) {
                document.attachEvent('WeixinJSBridgeReady', createPayment);
                document.attachEvent('onWeixinJSBridgeReady', createPayment);
            }
        } else {
            // 显示订单信息
            document.getElementById('orderNo').textContent = orderNo;
            document.getElementById('amount').textContent = amount.toFixed(2);
        }
    </script>
</body>
</html>
```

## Native支付(扫码支付)

### Native支付流程说明

Native支付的完整流程如下:

1. **商户系统调用下单接口**: 商户系统调用`prepay`接口,传入订单信息
2. **微信支付返回二维码链接**: 微信支付返回`code_url`
3. **商户展示二维码**: 商户将`code_url`转换为二维码图片展示给用户
4. **用户扫码支付**: 用户使用微信APP扫描二维码完成支付
5. **微信支付异步通知**: 支付完成后,微信支付主动推送异步通知到商户服务器
6. **商户处理业务逻辑**: 商户验证签名后处理业务逻辑
7. **商户返回success**: 商户返回"success"给微信支付

### Native支付服务

创建Native支付服务,用于生成支付二维码:

```java
package com.example.demo.service;
import com.wechat.pay.java.core.Config;
import com.wechat.pay.java.service.payments.nativepay.NativePayService;
import com.wechat.pay.java.service.payments.nativepay.model.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
/**
 * 微信支付Native支付服务
 * 用于生成支付二维码,用户扫码支付
 */
@Slf4j
@Service
public class WechatPayNativeService {
    @Autowired
    private Config wechatPayConfig;
    @Value("${wechat.pay.app-id}")
    private String appId;
    @Value("${wechat.pay.mch-id}")
    private String mchId;
    @Value("${wechat.pay.notify-url:}")
    private String notifyUrl;
    /**
     * 创建Native支付订单(生成支付二维码)
     * 
     * @param outTradeNo 商户订单号
     * @param description 商品描述
     * @param totalAmount 订单总金额,单位为分
     * @param notifyUrl 异步通知地址(可选,优先级低于全局配置)
     * @return 二维码链接(code_url),前端可以将其转换为二维码图片
     */
    public String prepay(String outTradeNo, String description, Long totalAmount, String notifyUrl) {
        try {
            // 创建Native支付服务
            NativePayService service = new NativePayService.Builder()
                    .config(wechatPayConfig).build();
            // 构建预支付请求
            PrepayRequest request = new PrepayRequest();
            // 设置应用ID
            request.setAppid(appId);
            // 设置商户号
            request.setMchid(mchId);
            // 设置商户订单号
            request.setOutTradeNo(outTradeNo);
            // 设置商品描述
            request.setDescription(description);
            // 设置订单金额
            Amount amount = new Amount();
            amount.setTotal(totalAmount);  // 总金额,单位为分
            amount.setCurrency("CNY");     // 币种,人民币
            request.setAmount(amount);
            // 设置异步通知地址
            String finalNotifyUrl = (notifyUrl != null && !notifyUrl.isEmpty()) 
                    ? notifyUrl : this.notifyUrl;
            if (finalNotifyUrl != null && !finalNotifyUrl.isEmpty()) {
                request.setNotifyUrl(finalNotifyUrl);
            }
            // 调用预支付接口
            PrepayResponse response = service.prepay(request);
            // 获取二维码链接
            String codeUrl = response.getCodeUrl();
            log.info("Native支付订单创建成功, 订单号: {}, code_url: {}", outTradeNo, codeUrl);
            return codeUrl;
        } catch (Exception e) {
            log.error("Native支付订单创建异常, 订单号: {}", outTradeNo, e);
            throw new RuntimeException("Native支付订单创建异常: " + e.getMessage(), e);
        }
    }
}
```

### Native支付控制器

创建Native支付控制器:

```java
package com.example.demo.controller;
import com.example.demo.service.WechatPayNativeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
/**
 * 微信支付Native支付控制器
 */
@Slf4j
@RestController
@RequestMapping("/wechatpay/native")
public class WechatPayNativeController {
    @Autowired
    private WechatPayNativeService wechatPayNativeService;
    /**
     * 创建Native支付订单
     * 
     * @param outTradeNo 商户订单号
     * @param description 商品描述
     * @param totalAmount 订单总金额,单位为分
     * @param notifyUrl 异步通知地址(可选)
     * @return 二维码链接
     */
    @PostMapping("/prepay")
    public Map<String, Object> prepay(@RequestParam String outTradeNo,
                                      @RequestParam String description,
                                      @RequestParam Long totalAmount,
                                      @RequestParam(required = false) String notifyUrl) {
        try {
            // 创建支付订单,获取二维码链接
            String codeUrl = wechatPayNativeService.prepay(
                    outTradeNo, description, totalAmount, notifyUrl);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("codeUrl", codeUrl);
            result.put("outTradeNo", outTradeNo);
            result.put("message", "订单创建成功");
            return result;
        } catch (Exception e) {
            log.error("创建Native支付订单失败", e);
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "订单创建失败: " + e.getMessage());
            return result;
        }
    }
}
```

### Native支付前端集成示例

前端获取二维码链接后,需要将其转换为二维码图片展示给用户:

**HTML页面示例**:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>扫码支付</title>
    <!-- 引入二维码生成库 -->
    <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
</head>
<body>
    <div id="qrcode-container">
        <h2>请使用微信扫码支付</h2>
        <div id="qrcode"></div>
        <p>订单号: <span id="orderNo"></span></p>
        <p>订单金额: <span id="amount"></span>元</p>
        <button onclick="checkPayment()">检查支付状态</button>
    </div>
    <script>
        const orderNo = 'ORDER_20240101123456';
        const amount = 99.00;
        const totalAmount = Math.round(amount * 100);  // 转换为分
        // 创建支付订单
        async function createOrder() {
            try {
                const response = await fetch('/wechatpay/native/prepay', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        outTradeNo: orderNo,
                        description: '测试商品',
                        totalAmount: totalAmount
                    })
                });
                const result = await response.json();
                if (result.success) {
                    // 显示订单信息
                    document.getElementById('orderNo').textContent = result.outTradeNo;
                    document.getElementById('amount').textContent = amount.toFixed(2);
                    // 生成二维码
                    QRCode.toCanvas(document.getElementById('qrcode'), result.codeUrl, {
                        width: 300,
                        margin: 2
                    }, function (error) {
                        if (error) {
                            console.error('生成二维码失败:', error);
                            alert('生成二维码失败');
                        } else {
                            console.log('二维码生成成功');
                            // 开始轮询检查支付状态
                            startPolling();
                        }
                    });
                } else {
                    alert('创建订单失败: ' + result.message);
                }
            } catch (error) {
                console.error('创建订单异常:', error);
                alert('创建订单异常: ' + error.message);
            }
        }
        // 轮询检查支付状态
        let pollingInterval;
        function startPolling() {
            pollingInterval = setInterval(async () => {
                const paid = await checkPayment();
                if (paid) {
                    clearInterval(pollingInterval);
                    alert('支付成功!');
                    window.location.href = '/payment/success?orderNo=' + orderNo;
                }
            }, 3000);  // 每3秒检查一次
        }
        // 检查支付状态
        async function checkPayment() {
            try {
                const response = await fetch('/wechatpay/query?outTradeNo=' + orderNo);
                const result = await response.json();
                if (result.success && result.tradeState === 'SUCCESS') {
                    return true;
                }
                return false;
            } catch (error) {
                console.error('检查支付状态异常:', error);
                return false;
            }
        }
        // 页面加载时创建订单
        window.onload = function() {
            createOrder();
        };
    </script>
</body>
</html>
```

## H5支付

### H5支付流程说明

H5支付的完整流程如下:

1. **商户系统调用下单接口**: 商户系统调用`prepay`接口,传入订单信息和H5场景信息
2. **微信支付返回H5支付链接**: 微信支付返回`h5_url`
3. **商户跳转到H5支付链接**: 商户将用户跳转到微信支付返回的`h5_url`
4. **用户在微信支付页面完成支付**: 用户在微信支付页面完成支付
5. **微信支付异步通知**: 支付完成后,微信支付主动推送异步通知到商户服务器
6. **商户处理业务逻辑**: 商户验证签名后处理业务逻辑

### H5支付服务

创建H5支付服务:

```java
package com.example.demo.service;
import com.wechat.pay.java.core.Config;
import com.wechat.pay.java.service.payments.h5.H5Service;
import com.wechat.pay.java.service.payments.h5.model.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
/**
 * 微信支付H5支付服务
 * 用于在手机浏览器中调起微信支付
 */
@Slf4j
@Service
public class WechatPayH5Service {
    @Autowired
    private Config wechatPayConfig;
    @Value("${wechat.pay.app-id}")
    private String appId;
    @Value("${wechat.pay.mch-id}")
    private String mchId;
    @Value("${wechat.pay.notify-url:}")
    private String notifyUrl;
    /**
     * 创建H5支付订单
     * 
     * @param outTradeNo 商户订单号
     * @param description 商品描述
     * @param totalAmount 订单总金额,单位为分
     * @param sceneInfo H5场景信息,包含场景类型和场景信息
     * @param notifyUrl 异步通知地址(可选,优先级低于全局配置)
     * @return H5支付链接(h5_url)
     */
    public String prepay(String outTradeNo, String description, Long totalAmount,
                        SceneInfo sceneInfo, String notifyUrl) {
        try {
            // 创建H5支付服务
            H5Service service = new H5Service.Builder().config(wechatPayConfig).build();
            // 构建预支付请求
            PrepayRequest request = new PrepayRequest();
            // 设置应用ID
            request.setAppid(appId);
            // 设置商户号
            request.setMchid(mchId);
            // 设置商户订单号
            request.setOutTradeNo(outTradeNo);
            // 设置商品描述
            request.setDescription(description);
            // 设置订单金额
            Amount amount = new Amount();
            amount.setTotal(totalAmount);  // 总金额,单位为分
            amount.setCurrency("CNY");     // 币种,人民币
            request.setAmount(amount);
            // 设置H5场景信息
            if (sceneInfo != null) {
                request.setSceneInfo(sceneInfo);
            }
            // 设置异步通知地址
            String finalNotifyUrl = (notifyUrl != null && !notifyUrl.isEmpty()) 
                    ? notifyUrl : this.notifyUrl;
            if (finalNotifyUrl != null && !finalNotifyUrl.isEmpty()) {
                request.setNotifyUrl(finalNotifyUrl);
            }
            // 调用预支付接口
            PrepayResponse response = service.prepay(request);
            // 获取H5支付链接
            String h5Url = response.getH5Url();
            log.info("H5支付订单创建成功, 订单号: {}, h5_url: {}", outTradeNo, h5Url);
            return h5Url;
        } catch (Exception e) {
            log.error("H5支付订单创建异常, 订单号: {}", outTradeNo, e);
            throw new RuntimeException("H5支付订单创建异常: " + e.getMessage(), e);
        }
    }
}
```

### H5支付控制器

创建H5支付控制器:

```java
package com.example.demo.controller;
import com.example.demo.service.WechatPayH5Service;
import com.wechat.pay.java.service.payments.h5.model.SceneInfo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
/**
 * 微信支付H5支付控制器
 */
@Slf4j
@RestController
@RequestMapping("/wechatpay/h5")
public class WechatPayH5Controller {
    @Autowired
    private WechatPayH5Service wechatPayH5Service;
    /**
     * 创建H5支付订单
     * 
     * @param outTradeNo 商户订单号
     * @param description 商品描述
     * @param totalAmount 订单总金额,单位为分
     * @param sceneType 场景类型,如"Wap"表示手机浏览器
     * @param sceneInfo 场景信息,包含应用名称、网站URL等
     * @param notifyUrl 异步通知地址(可选)
     * @return H5支付链接
     */
    @PostMapping("/prepay")
    public Map<String, Object> prepay(@RequestParam String outTradeNo,
                                      @RequestParam String description,
                                      @RequestParam Long totalAmount,
                                      @RequestParam String sceneType,
                                      @RequestParam(required = false) String appName,
                                      @RequestParam(required = false) String appUrl,
                                      @RequestParam(required = false) String bundleId,
                                      @RequestParam(required = false) String packageName,
                                      @RequestParam(required = false) String notifyUrl) {
        try {
            // 构建H5场景信息
            SceneInfo sceneInfo = new SceneInfo();
            SceneInfo.H5Info h5Info = new SceneInfo.H5Info();
            h5Info.setType(sceneType);  // 场景类型,如"Wap"
            if (appName != null && !appName.isEmpty()) {
                h5Info.setAppName(appName);  // 应用名称
            }
            if (appUrl != null && !appUrl.isEmpty()) {
                h5Info.setAppUrl(appUrl);     // 网站URL
            }
            if (bundleId != null && !bundleId.isEmpty()) {
                h5Info.setBundleId(bundleId);  // iOS Bundle ID
            }
            if (packageName != null && !packageName.isEmpty()) {
                h5Info.setPackageName(packageName);  // Android Package Name
            }
            sceneInfo.setH5Info(h5Info);
            // 创建支付订单,获取H5支付链接
            String h5Url = wechatPayH5Service.prepay(
                    outTradeNo, description, totalAmount, sceneInfo, notifyUrl);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("h5Url", h5Url);
            result.put("outTradeNo", outTradeNo);
            result.put("message", "订单创建成功");
            return result;
        } catch (Exception e) {
            log.error("创建H5支付订单失败", e);
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "订单创建失败: " + e.getMessage());
            return result;
        }
    }
}
```

## 支付查询

### 支付查询服务

创建支付查询服务,用于查询订单支付状态:

```java
package com.example.demo.service;
import com.wechat.pay.java.core.Config;
import com.wechat.pay.java.core.exception.ServiceException;
import com.wechat.pay.java.service.payments.jsapi.JsapiService;
import com.wechat.pay.java.service.payments.jsapi.model.QueryOrderByIdRequest;
import com.wechat.pay.java.service.payments.jsapi.model.QueryOrderByOutTradeNoRequest;
import com.wechat.pay.java.service.payments.model.Transaction;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;
/**
 * 微信支付查询服务
 * 用于查询订单支付状态
 */
@Slf4j
@Service
public class WechatPayQueryService {
    @Autowired
    private Config wechatPayConfig;
    @Value("${wechat.pay.mch-id}")
    private String mchId;
    /**
     * 查询订单支付状态(通过商户订单号)
     * 
     * @param outTradeNo 商户订单号
     * @return 订单支付状态信息
     */
    public Transaction queryByOutTradeNo(String outTradeNo) {
        try {
            // 创建支付服务(可以使用任意支付方式的服务,查询接口是通用的)
            JsapiService service = new JsapiService.Builder().config(wechatPayConfig).build();
            // 构建查询请求
            QueryOrderByOutTradeNoRequest request = new QueryOrderByOutTradeNoRequest();
            request.setOutTradeNo(outTradeNo);
            request.setMchid(mchId);
            // 调用查询接口
            Transaction transaction = service.queryOrderByOutTradeNo(request);
            log.info("订单查询成功, 订单号: {}, 交易状态: {}, 交易号: {}", 
                    outTradeNo, transaction.getTradeState(), transaction.getTransactionId());
            return transaction;
        } catch (ServiceException e) {
            // API返回失败,例如ORDER_NOT_EXISTS
            log.error("订单查询失败, 订单号: {}, 错误码: {}, 错误信息: {}", 
                    outTradeNo, e.getErrorCode(), e.getErrorMessage());
            throw new RuntimeException("订单查询失败: " + e.getErrorMessage(), e);
        } catch (Exception e) {
            log.error("订单查询异常, 订单号: {}", outTradeNo, e);
            throw new RuntimeException("订单查询异常: " + e.getMessage(), e);
        }
    }
    /**
     * 查询订单支付状态(通过微信支付交易号)
     * 
     * @param transactionId 微信支付交易号
     * @return 订单支付状态信息
     */
    public Transaction queryByTransactionId(String transactionId) {
        try {
            JsapiService service = new JsapiService.Builder().config(wechatPayConfig).build();
            QueryOrderByIdRequest request = new QueryOrderByIdRequest();
            request.setTransactionId(transactionId);
            request.setMchid(mchId);
            Transaction transaction = service.queryOrderById(request);
            log.info("订单查询成功, 交易号: {}, 交易状态: {}", transactionId, transaction.getTradeState());
            return transaction;
        } catch (ServiceException e) {
            log.error("订单查询失败, 交易号: {}, 错误码: {}", transactionId, e.getErrorCode());
            throw new RuntimeException("订单查询失败: " + e.getErrorMessage(), e);
        } catch (Exception e) {
            log.error("订单查询异常, 交易号: {}", transactionId, e);
            throw new RuntimeException("订单查询异常: " + e.getMessage(), e);
        }
    }
    /**
     * 检查订单是否支付成功
     * 
     * @param outTradeNo 商户订单号
     * @return true表示支付成功,false表示未支付或支付失败
     */
    public boolean isPaid(String outTradeNo) {
        try {
            Transaction transaction = queryByOutTradeNo(outTradeNo);
            // 交易状态: SUCCESS(支付成功)
            //          REFUND(转入退款)
            //          NOTPAY(未支付)
            //          CLOSED(已关闭)
            //          REVOKED(已撤销)
            //          USERPAYING(用户支付中)
            //          PAYERROR(支付失败)
            String tradeState = transaction.getTradeState();
            return "SUCCESS".equals(tradeState);
        } catch (Exception e) {
            log.error("检查订单支付状态异常, 订单号: {}", outTradeNo, e);
            return false;
        }
    }
    /**
     * 获取订单详细信息
     * 
     * @param outTradeNo 商户订单号
     * @return 订单详细信息
     */
    public Map<String, Object> getOrderDetail(String outTradeNo) {
        try {
            Transaction transaction = queryByOutTradeNo(outTradeNo);
            Map<String, Object> detail = new HashMap<>();
            detail.put("outTradeNo", transaction.getOutTradeNo());           // 商户订单号
            detail.put("transactionId", transaction.getTransactionId());     // 微信支付交易号
            detail.put("tradeState", transaction.getTradeState());           // 交易状态
            detail.put("tradeStateDesc", transaction.getTradeStateDesc());    // 交易状态描述
            detail.put("amount", transaction.getAmount());                   // 订单金额信息
            detail.put("payer", transaction.getPayer());                     // 支付者信息
            detail.put("successTime", transaction.getSuccessTime());         // 支付完成时间
            log.info("获取订单详细信息成功, 订单号: {}", outTradeNo);
            return detail;
        } catch (Exception e) {
            log.error("获取订单详细信息异常, 订单号: {}", outTradeNo, e);
            throw new RuntimeException("获取订单详细信息异常: " + e.getMessage(), e);
        }
    }
}
```

### 支付查询控制器

创建支付查询控制器,提供查询接口:

```java
package com.example.demo.controller;
import com.example.demo.service.WechatPayQueryService;
import com.wechat.pay.java.service.payments.model.Transaction;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
/**
 * 微信支付查询控制器
 */
@Slf4j
@RestController
@RequestMapping("/wechatpay/query")
public class WechatPayQueryController {
    @Autowired
    private WechatPayQueryService wechatPayQueryService;
    /**
     * 查询订单支付状态(通过商户订单号)
     */
    @GetMapping("/outTradeNo")
    public Map<String, Object> queryByOutTradeNo(@RequestParam String outTradeNo) {
        try {
            Transaction transaction = wechatPayQueryService.queryByOutTradeNo(outTradeNo);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("outTradeNo", transaction.getOutTradeNo());
            result.put("transactionId", transaction.getTransactionId());
            result.put("tradeState", transaction.getTradeState());
            result.put("tradeStateDesc", transaction.getTradeStateDesc());
            result.put("amount", transaction.getAmount());
            result.put("successTime", transaction.getSuccessTime());
            return result;
        } catch (Exception e) {
            log.error("查询订单支付状态失败", e);
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "查询失败: " + e.getMessage());
            return result;
        }
    }
    /**
     * 查询订单支付状态(通过微信支付交易号)
     */
    @GetMapping("/transactionId")
    public Map<String, Object> queryByTransactionId(@RequestParam String transactionId) {
        try {
            Transaction transaction = wechatPayQueryService.queryByTransactionId(transactionId);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("outTradeNo", transaction.getOutTradeNo());
            result.put("transactionId", transaction.getTransactionId());
            result.put("tradeState", transaction.getTradeState());
            result.put("amount", transaction.getAmount());
            return result;
        } catch (Exception e) {
            log.error("查询订单支付状态失败", e);
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "查询失败: " + e.getMessage());
            return result;
        }
    }
    /**
     * 检查订单是否支付成功
     */
    @GetMapping("/isPaid")
    public Map<String, Object> isPaid(@RequestParam String outTradeNo) {
        try {
            boolean paid = wechatPayQueryService.isPaid(outTradeNo);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("paid", paid);
            result.put("outTradeNo", outTradeNo);
            return result;
        } catch (Exception e) {
            log.error("检查订单支付状态失败", e);
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("paid", false);
            result.put("message", "检查失败: " + e.getMessage());
            return result;
        }
    }
    /**
     * 获取订单详细信息
     */
    @GetMapping("/detail")
    public Map<String, Object> getOrderDetail(@RequestParam String outTradeNo) {
        try {
            Map<String, Object> detail = wechatPayQueryService.getOrderDetail(outTradeNo);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("detail", detail);
            return result;
        } catch (Exception e) {
            log.error("获取订单详细信息失败", e);
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "获取失败: " + e.getMessage());
            return result;
        }
    }
}
```

## 支付回调处理

### 支付回调服务

创建支付回调服务,用于处理微信支付异步通知:

```java
package com.example.demo.service;
import com.wechat.pay.java.core.Config;
import com.wechat.pay.java.core.notification.NotificationParser;
import com.wechat.pay.java.core.notification.RequestParam;
import com.wechat.pay.java.service.payments.model.Transaction;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Map;
/**
 * 微信支付回调服务
 * 用于处理微信支付异步通知
 */
@Slf4j
@Service
public class WechatPayNotifyService {
    @Autowired
    private Config wechatPayConfig;
    /**
     * 验证并处理支付回调
     * 
     * @param requestBody 回调请求体
     * @param signature 微信支付签名
     * @param timestamp 时间戳
     * @param nonce 随机串
     * @param serial 证书序列号
     * @return 处理结果
     */
    public NotifyResult verifyAndHandleNotify(String requestBody, String signature, 
                                             String timestamp, String nonce, String serial) {
        try {
            // 构建请求参数
            RequestParam requestParam = new RequestParam.Builder()
                    .serialNumber(serial)
                    .nonce(nonce)
                    .signature(signature)
                    .timestamp(timestamp)
                    .body(requestBody)
                    .build();
            // 创建通知解析器
            NotificationParser parser = new NotificationParser(wechatPayConfig);
            // 验证签名并解析通知
            Transaction transaction = parser.parse(requestParam, Transaction.class);
            // 解析通知参数
            String tradeState = transaction.getTradeState();
            String outTradeNo = transaction.getOutTradeNo();
            String transactionId = transaction.getTransactionId();
            Long totalAmount = transaction.getAmount().getTotal();
            String successTime = transaction.getSuccessTime();
            log.info("微信支付回调签名验证成功, 订单号: {}, 交易号: {}, 交易状态: {}, 支付金额: {}, 支付时间: {}", 
                    outTradeNo, transactionId, tradeState, totalAmount, successTime);
            // 根据交易状态处理业务逻辑
            if ("SUCCESS".equals(tradeState)) {
                // 交易成功,处理业务逻辑
                handleTradeSuccess(outTradeNo, transactionId, totalAmount, successTime);
            } else if ("REFUND".equals(tradeState)) {
                // 转入退款,处理业务逻辑
                handleTradeRefund(outTradeNo, transactionId);
            } else if ("CLOSED".equals(tradeState)) {
                // 交易关闭,处理业务逻辑
                handleTradeClosed(outTradeNo, transactionId);
            } else if ("REVOKED".equals(tradeState)) {
                // 已撤销,处理业务逻辑
                handleTradeRevoked(outTradeNo, transactionId);
            }
            // 返回成功响应给微信支付
            return new NotifyResult(true, "处理成功", outTradeNo);
        } catch (Exception e) {
            log.error("处理微信支付回调异常, 请求体: {}", requestBody, e);
            return new NotifyResult(false, "处理异常: " + e.getMessage(), null);
        }
    }
    /**
     * 处理交易成功
     */
    private void handleTradeSuccess(String outTradeNo, String transactionId, 
                                   Long totalAmount, String successTime) {
        // TODO: 在这里实现你的业务逻辑
        // 例如: 更新订单状态、发送通知、记录日志等
        log.info("处理交易成功, 订单号: {}, 交易号: {}, 金额: {}, 时间: {}", 
                outTradeNo, transactionId, totalAmount, successTime);
        // 示例: 更新订单状态
        // orderService.updateOrderStatus(outTradeNo, OrderStatus.PAID);
    }
    /**
     * 处理转入退款
     */
    private void handleTradeRefund(String outTradeNo, String transactionId) {
        // TODO: 在这里实现你的业务逻辑
        log.info("处理转入退款, 订单号: {}, 交易号: {}", outTradeNo, transactionId);
    }
    /**
     * 处理交易关闭
     */
    private void handleTradeClosed(String outTradeNo, String transactionId) {
        // TODO: 在这里实现你的业务逻辑
        log.info("处理交易关闭, 订单号: {}, 交易号: {}", outTradeNo, transactionId);
    }
    /**
     * 处理已撤销
     */
    private void handleTradeRevoked(String outTradeNo, String transactionId) {
        // TODO: 在这里实现你的业务逻辑
        log.info("处理已撤销, 订单号: {}, 交易号: {}", outTradeNo, transactionId);
    }
    /**
     * 支付回调处理结果
     */
    public static class NotifyResult {
        private boolean success;
        private String message;
        private String outTradeNo;
        public NotifyResult(boolean success, String message, String outTradeNo) {
            this.success = success;
            this.message = message;
            this.outTradeNo = outTradeNo;
        }
        // Getters and Setters
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public String getOutTradeNo() { return outTradeNo; }
        public void setOutTradeNo(String outTradeNo) { this.outTradeNo = outTradeNo; }
    }
}
```

### 支付回调控制器

创建支付回调控制器,接收微信支付异步通知:

```java
package com.example.demo.controller;
import com.example.demo.service.WechatPayNotifyService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
/**
 * 微信支付回调控制器
 * 接收微信支付异步通知
 */
@Slf4j
@RestController
@RequestMapping("/wechatpay/notify")
public class WechatPayNotifyController {
    @Autowired
    private WechatPayNotifyService wechatPayNotifyService;
    /**
     * 接收微信支付异步通知
     * 
     * @param requestBody 请求体
     * @param signature 微信支付签名
     * @param timestamp 时间戳
     * @param nonce 随机串
     * @param serial 证书序列号
     * @return 响应给微信支付(必须返回JSON格式)
     */
    @PostMapping("/callback")
    public Map<String, String> notifyCallback(@RequestBody String requestBody,
                                              @RequestHeader("Wechatpay-Signature") String signature,
                                              @RequestHeader("Wechatpay-Timestamp") String timestamp,
                                              @RequestHeader("Wechatpay-Nonce") String nonce,
                                              @RequestHeader("Wechatpay-Serial") String serial) {
        try {
            log.info("收到微信支付异步通知, 签名: {}, 时间戳: {}, 随机串: {}, 序列号: {}", 
                    signature, timestamp, nonce, serial);
            log.debug("请求体: {}", requestBody);
            // 验证并处理回调
            WechatPayNotifyService.NotifyResult result = wechatPayNotifyService.verifyAndHandleNotify(
                    requestBody, signature, timestamp, nonce, serial);
            Map<String, String> response = new HashMap<>();
            if (result.isSuccess()) {
                // 处理成功,返回成功响应给微信支付
                response.put("code", "SUCCESS");
                response.put("message", "成功");
            } else {
                // 处理失败,返回失败响应给微信支付
                // 微信支付会继续发送通知,直到收到成功响应或超过重试次数
                log.warn("微信支付回调处理失败: {}", result.getMessage());
                response.put("code", "FAIL");
                response.put("message", result.getMessage());
            }
            return response;
        } catch (Exception e) {
            log.error("处理微信支付回调异常", e);
            // 异常情况返回失败,微信支付会重试
            Map<String, String> response = new HashMap<>();
            response.put("code", "FAIL");
            response.put("message", "处理异常: " + e.getMessage());
            return response;
        }
    }
}
```

## 退款功能

### 退款服务

创建退款服务,用于处理订单退款:

```java
package com.example.demo.service;
import com.wechat.pay.java.core.Config;
import com.wechat.pay.java.service.refund.RefundService;
import com.wechat.pay.java.service.refund.model.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
/**
 * 微信支付退款服务
 * 用于处理订单退款
 */
@Slf4j
@Service
public class WechatPayRefundService {
    @Autowired
    private Config wechatPayConfig;
    @Value("${wechat.pay.mch-id}")
    private String mchId;
    @Value("${wechat.pay.notify-url:}")
    private String notifyUrl;
    /**
     * 申请退款(通过商户订单号)
     * 
     * @param outTradeNo 商户订单号
     * @param outRefundNo 商户退款单号
     * @param reason 退款原因(可选)
     * @param refundAmount 退款金额,单位为分
     * @param totalAmount 原订单总金额,单位为分
     * @param notifyUrl 退款通知地址(可选)
     * @return 退款结果
     */
    public Refund refundByOutTradeNo(String outTradeNo, String outRefundNo, 
                                     String reason, Long refundAmount, Long totalAmount,
                                     String notifyUrl) {
        try {
            // 创建退款服务
            RefundService service = new RefundService.Builder().config(wechatPayConfig).build();
            // 构建退款请求
            CreateRequest request = new CreateRequest();
            // 设置商户订单号
            request.setOutTradeNo(outTradeNo);
            // 设置商户退款单号
            request.setOutRefundNo(outRefundNo);
            // 设置退款原因
            if (reason != null && !reason.isEmpty()) {
                request.setReason(reason);
            }
            // 设置退款金额信息
            AmountReq amount = new AmountReq();
            amount.setRefund(refundAmount);  // 退款金额,单位为分
            amount.setTotal(totalAmount);     // 原订单总金额,单位为分
            amount.setCurrency("CNY");       // 币种,人民币
            request.setAmount(amount);
            // 设置退款通知地址
            String finalNotifyUrl = (notifyUrl != null && !notifyUrl.isEmpty()) 
                    ? notifyUrl : this.notifyUrl;
            if (finalNotifyUrl != null && !finalNotifyUrl.isEmpty()) {
                request.setNotifyUrl(finalNotifyUrl);
            }
            // 调用退款接口
            Refund refund = service.create(request);
            log.info("退款成功, 订单号: {}, 退款单号: {}, 退款金额: {}, 退款状态: {}", 
                    outTradeNo, outRefundNo, refundAmount, refund.getStatus());
            return refund;
        } catch (Exception e) {
            log.error("退款异常, 订单号: {}, 退款单号: {}", outTradeNo, outRefundNo, e);
            throw new RuntimeException("退款异常: " + e.getMessage(), e);
        }
    }
    /**
     * 申请退款(通过微信支付交易号)
     * 
     * @param transactionId 微信支付交易号
     * @param outRefundNo 商户退款单号
     * @param reason 退款原因(可选)
     * @param refundAmount 退款金额,单位为分
     * @param totalAmount 原订单总金额,单位为分
     * @param notifyUrl 退款通知地址(可选)
     * @return 退款结果
     */
    public Refund refundByTransactionId(String transactionId, String outRefundNo,
                                       String reason, Long refundAmount, Long totalAmount,
                                       String notifyUrl) {
        try {
            RefundService service = new RefundService.Builder().config(wechatPayConfig).build();
            CreateRequest request = new CreateRequest();
            request.setTransactionId(transactionId);
            request.setOutRefundNo(outRefundNo);
            if (reason != null && !reason.isEmpty()) {
                request.setReason(reason);
            }
            AmountReq amount = new AmountReq();
            amount.setRefund(refundAmount);
            amount.setTotal(totalAmount);
            amount.setCurrency("CNY");
            request.setAmount(amount);
            String finalNotifyUrl = (notifyUrl != null && !notifyUrl.isEmpty()) 
                    ? notifyUrl : this.notifyUrl;
            if (finalNotifyUrl != null && !finalNotifyUrl.isEmpty()) {
                request.setNotifyUrl(finalNotifyUrl);
            }
            Refund refund = service.create(request);
            log.info("退款成功, 交易号: {}, 退款单号: {}, 退款金额: {}", 
                    transactionId, outRefundNo, refundAmount);
            return refund;
        } catch (Exception e) {
            log.error("退款异常, 交易号: {}, 退款单号: {}", transactionId, outRefundNo, e);
            throw new RuntimeException("退款异常: " + e.getMessage(), e);
        }
    }
}
```

## 关闭订单

### 关闭订单服务

创建关闭订单服务,用于关闭未支付的订单:

```java
package com.example.demo.service;
import com.wechat.pay.java.core.Config;
import com.wechat.pay.java.service.payments.jsapi.JsapiService;
import com.wechat.pay.java.service.payments.jsapi.model.CloseOrderRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
/**
 * 微信支付关闭订单服务
 * 用于关闭未支付的订单
 */
@Slf4j
@Service
public class WechatPayCloseService {
    @Autowired
    private Config wechatPayConfig;
    @Value("${wechat.pay.mch-id}")
    private String mchId;
    /**
     * 关闭订单(通过商户订单号)
     * 
     * @param outTradeNo 商户订单号
     */
    public void closeByOutTradeNo(String outTradeNo) {
        try {
            // 创建支付服务
            JsapiService service = new JsapiService.Builder().config(wechatPayConfig).build();
            // 构建关闭订单请求
            CloseOrderRequest request = new CloseOrderRequest();
            request.setMchid(mchId);
            request.setOutTradeNo(outTradeNo);
            // 调用关闭订单接口
            // 方法没有返回值,意味着成功时API返回204 No Content
            service.closeOrder(request);
            log.info("订单关闭成功, 订单号: {}", outTradeNo);
        } catch (Exception e) {
            log.error("订单关闭异常, 订单号: {}", outTradeNo, e);
            throw new RuntimeException("订单关闭异常: " + e.getMessage(), e);
        }
    }
}
```

## 最佳实践

### 1. 订单号生成

订单号必须保证唯一性,建议使用UUID或雪花算法生成:

```java
import java.util.UUID;
/**
 * 生成唯一订单号
 */
public String generateOutTradeNo() {
    // 方式1: 使用UUID
    return "ORDER_" + UUID.randomUUID().toString().replace("-", "");
    // 方式2: 使用时间戳+随机数
    // return "ORDER_" + System.currentTimeMillis() + "_" + (int)(Math.random() * 10000);
    // 方式3: 使用雪花算法(需要引入相关依赖)
    // return "ORDER_" + snowflakeIdGenerator.nextId();
}
```

### 2. 金额处理

金额必须使用分为单位,建议使用Long类型处理:

```java
/**
 * 将元转换为分
 */
public Long yuanToFen(Double yuan) {
    return Math.round(yuan * 100);
}
/**
 * 将分转换为元
 */
public Double fenToYuan(Long fen) {
    return fen / 100.0;
}
```

### 3. 幂等性处理

支付回调可能重复发送,需要做幂等性处理:

```java
/**
 * 处理支付回调(带幂等性)
 */
public void handleNotifyWithIdempotency(String outTradeNo, String transactionId) {
    // 检查是否已经处理过
    if (isProcessed(transactionId)) {
        log.info("订单已处理过,跳过, 订单号: {}, 交易号: {}", outTradeNo, transactionId);
        return;
    }
    // 处理业务逻辑
    handleTradeSuccess(outTradeNo, transactionId, null, null);
    // 标记为已处理
    markAsProcessed(transactionId);
}
```

### 4. 异常处理

建议统一处理异常,避免暴露敏感信息:

```java
/**
 * 统一异常处理
 */
@ControllerAdvice
public class WechatPayExceptionHandler {
    @ExceptionHandler(Exception.class)
    public Map<String, Object> handleException(Exception e) {
        log.error("微信支付接口调用异常", e);
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("message", "系统异常,请稍后重试");
        // 不要返回详细的异常信息给前端
        return result;
    }
}
```

### 5. 日志记录

建议记录关键操作日志,便于排查问题:

```java
/**
 * 记录支付日志
 */
public void logPayment(String outTradeNo, String action, Map<String, Object> params) {
    log.info("支付操作日志 - 订单号: {}, 操作: {}, 参数: {}", outTradeNo, action, params);
    // 可以保存到数据库,便于后续查询和分析
}
```

### 6. 安全建议

1. **证书保护**: 不要将证书私钥硬编码在代码中,建议使用配置文件或环境变量
2. **HTTPS**: 生产环境必须使用HTTPS
3. **签名验证**: 所有回调必须验证签名
4. **金额校验**: 回调中要校验金额是否与订单一致
5. **订单状态**: 要校验订单状态,避免重复处理
6. **APIv3密钥**: APIv3密钥要妥善保管,不要泄露

## 总结

微信支付接口整合其实没那么复杂,主要就是配置好微信支付SDK、创建支付订单、处理支付回调这几个步骤;Spring Boot 4整合微信支付更是方便,微信支付官方Java SDK已经把复杂的签名、证书管理都封装好了,你只需要关注业务逻辑就行;但是要注意订单号唯一性、金额单位(分)、幂等性处理、安全验证这些细节,这些搞不好容易出问题;鹏磊今天给兄弟们掰扯了微信支付的基础概念、项目搭建、JSAPI支付、Native支付、H5支付、支付查询、支付回调、退款、关闭订单这些功能,还有最佳实践,希望能帮到兄弟们;如果还有啥不明白的,可以看看微信支付官方文档,或者给鹏磊留言。
