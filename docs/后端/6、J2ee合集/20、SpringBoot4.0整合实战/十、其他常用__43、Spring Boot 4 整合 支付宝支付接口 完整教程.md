# 43、Spring Boot 4 整合 支付宝支付接口 完整教程
- 来源：https://ddkk.com/springboot/4-action/43.html
- 分类：Spring Boot 4 整合教程
- 分组：十、其他常用
- 日期：2025-12-08
搞支付的时候最烦的就是对接支付宝,配置证书、写签名、处理回调,一堆配置写得人头疼,而且API还复杂,一不小心就出错;其实支付宝支付这玩意儿不错,是国内最主流的支付方式,支持当面付、手机网站支付、电脑网站支付、APP支付,功能全、安全性高、用户体验好,是电商、O2O、SaaS等场景的标配;但是直接用支付宝OpenAPI写,那叫一个复杂,配置AppId、写RSA签名、管理证书、处理异步通知,一堆配置写得人头疼;后来发现支付宝EasySDK直接把这些都封装好了,用起来贼简单;现在Spring Boot 4出来了,整合支付宝支付更是方便得不行,支付宝SDK自动配置给你整得明明白白,零配置就能用;但是很多兄弟不知道里面的门道,也不知道咋配置支付宝客户端、创建支付订单、查询支付状态、处理支付回调、退款这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

其实支付宝支付在Spring Boot里早就支持了,你只要加个支付宝SDK依赖,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋配置支付宝客户端、创建支付订单、查询支付状态、处理支付回调、退款、关闭订单这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

## 支付宝支付基础概念

### 支付宝支付是啥玩意儿

支付宝支付(Alipay Payment)是支付宝开放平台提供的支付服务,通过API接口实现各种支付场景;支付宝支付的核心特性包括:

1. **多种支付方式**: 支持当面付、手机网站支付、电脑网站支付、APP支付等
2. **高安全性**: 使用RSA2签名和证书加密,保证交易安全
3. **异步通知**: 支持异步通知机制,及时获取支付结果
4. **订单查询**: 支持查询订单状态,便于对账
5. **退款功能**: 支持全额退款和部分退款
6. **多场景支持**: 适用于电商、O2O、SaaS等多种业务场景
7. **证书模式**: 支持证书模式和非证书模式两种签名方式

### 支付宝支付和微信支付的区别

1. **用户群体**: 支付宝主要面向淘宝、天猫用户;微信支付主要面向微信生态用户
2. **支付场景**: 支付宝更适合电商场景;微信支付更适合社交场景
3. **API风格**: 支付宝API相对统一;微信支付API相对复杂
4. **证书管理**: 支付宝支持证书模式和非证书模式;微信支付主要使用证书模式
5. **回调机制**: 两者都支持异步通知,但参数格式不同

### 支付宝支付的核心概念

1. **AppId**: 支付宝分配给开发者的应用ID,用于标识应用
2. **应用私钥**: 开发者生成的RSA私钥,用于签名请求
3. **支付宝公钥**: 支付宝提供的RSA公钥,用于验证响应
4. **应用公钥证书**: 开发者上传到支付宝的应用公钥证书
5. **支付宝公钥证书**: 支付宝提供的公钥证书,用于验证响应
6. **异步通知**: 支付完成后支付宝主动推送的通知
7. **同步返回**: 支付页面跳转返回的参数
8. **订单号**: 商户系统生成的唯一订单号
9. **交易号**: 支付宝生成的唯一交易号

### 支付宝支付适用场景

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
spring-boot-alipay-demo/
├── pom.xml                          # Maven配置文件
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── demo/
│   │   │               ├── Application.java                    # 启动类
│   │   │               ├── config/                              # 配置类目录
│   │   │               │   └── AlipayConfig.java              # 支付宝配置类
│   │   │               ├── service/                            # 服务层目录
│   │   │               │   ├── AlipayFaceToFaceService.java    # 当面付服务
│   │   │               │   ├── AlipayWapService.java           # 手机网站支付服务
│   │   │               │   ├── AlipayPageService.java          # 电脑网站支付服务
│   │   │               │   ├── AlipayQueryService.java         # 支付查询服务
│   │   │               │   ├── AlipayNotifyService.java        # 支付回调服务
│   │   │               │   ├── AlipayRefundService.java        # 退款服务
│   │   │               │   └── AlipayCloseService.java          # 关闭订单服务
│   │   │               ├── controller/                          # 控制器目录
│   │   │               │   ├── AlipayFaceToFaceController.java # 当面付控制器
│   │   │               │   ├── AlipayWapController.java        # 手机网站支付控制器
│   │   │               │   ├── AlipayPageController.java        # 电脑网站支付控制器
│   │   │               │   ├── AlipayQueryController.java       # 支付查询控制器
│   │   │               │   └── AlipayNotifyController.java      # 支付回调控制器
│   │   │               ├── entity/                              # 实体类目录(可选)
│   │   │               └── dto/                                 # 数据传输对象目录(可选)
│   │   └── resources/
│   │       ├── application.yml                   # 配置文件
│   │       └── cert/                              # 证书目录(如果使用证书模式)
│   │           ├── appCertPublicKey_*.crt         # 应用公钥证书
│   │           ├── alipayCertPublicKey_RSA2.crt  # 支付宝公钥证书
│   │           └── alipayRootCert.crt            # 支付宝根证书
│   └── test/
│       └── java/
│           └── com/
│               └── example/
│                   └── demo/
│                       └── AlipayServiceTest.java # 测试类(可选)
└── README.md
```

### 添加Maven依赖

这是最关键的,依赖配置不对后面全是坑;Spring Boot 4需要Java 17以上,而且支付宝EasySDK最新版本已经支持Spring Boot 4了。

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
    <artifactId>spring-boot-alipay-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 Alipay Demo</name>
    <description>Spring Boot 4整合支付宝支付接口示例项目</description>
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
        <!-- 支付宝EasySDK: 简化支付宝API调用 -->
        <dependency>
            <groupId>com.alipay.sdk</groupId>
            <artifactId>alipay-easysdk</artifactId>
            <version>2.3.0</version>
        </dependency>
        <!-- 支付宝SDK Java v3: 完整版SDK(可选,如果需要更多功能) -->
        <dependency>
            <groupId>com.alipay.sdk</groupId>
            <artifactId>alipay-sdk-java-v3</artifactId>
            <version>3.1.38.ALL</version>
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
    name: spring-boot-alipay-demo  # 应用名称
# 支付宝配置
alipay:
  # 基础配置
  app-id: 2021001234567890  # 支付宝分配给开发者的应用ID
  protocol: https  # 协议类型
  gateway-host: openapi.alipay.com  # 网关地址,生产环境用openapi.alipay.com,沙箱环境用openapi.alipaydev.com
  sign-type: RSA2  # 签名类型,RSA2或RSA
  # 私钥配置(非证书模式)
  merchant-private-key: |
    MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
    # 这里填写你的应用私钥,建议从配置文件或环境变量读取,不要硬编码
  
  # 支付宝公钥(非证书模式)
  alipay-public-key: |
    MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
    # 这里填写支付宝公钥,建议从配置文件或环境变量读取
  
  # 证书模式配置(如果使用证书模式,则不需要上面的公钥私钥配置)
  merchant-cert-path: classpath:cert/appCertPublicKey_2021001234567890.crt  # 应用公钥证书路径
  alipay-cert-path: classpath:cert/alipayCertPublicKey_RSA2.crt  # 支付宝公钥证书路径
  alipay-root-cert-path: classpath:cert/alipayRootCert.crt  # 支付宝根证书路径
  # 异步通知地址(可选,也可以在调用时单独指定)
  notify-url: https://www.yourdomain.com/alipay/notify  # 支付类接口异步通知接收服务地址
  # 是否使用证书模式
  use-cert: false  # true表示使用证书模式,false表示使用非证书模式
```

## 支付宝EasySDK配置

### 支付宝配置类

创建支付宝配置类,用于初始化支付宝EasySDK:

```java
package com.example.demo.config;
import com.alipay.easysdk.factory.Factory;
import com.alipay.easysdk.kernel.Config;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import javax.annotation.PostConstruct;
import java.io.InputStream;
/**
 * 支付宝配置类
 * 用于初始化支付宝EasySDK
 */
@Slf4j
@Data
@Configuration
public class AlipayConfig {
    @Value("${alipay.app-id}")
    private String appId;
    @Value("${alipay.protocol:https}")
    private String protocol;
    @Value("${alipay.gateway-host:openapi.alipay.com}")
    private String gatewayHost;
    @Value("${alipay.sign-type:RSA2}")
    private String signType;
    @Value("${alipay.merchant-private-key:}")
    private String merchantPrivateKey;
    @Value("${alipay.alipay-public-key:}")
    private String alipayPublicKey;
    @Value("${alipay.merchant-cert-path:}")
    private String merchantCertPath;
    @Value("${alipay.alipay-cert-path:}")
    private String alipayCertPath;
    @Value("${alipay.alipay-root-cert-path:}")
    private String alipayRootCertPath;
    @Value("${alipay.notify-url:}")
    private String notifyUrl;
    @Value("${alipay.use-cert:false}")
    private boolean useCert;
    /**
     * 初始化支付宝EasySDK配置
     * 在Spring容器启动后自动执行
     */
    @PostConstruct
    public void initAlipayConfig() {
        try {
            Config config = new Config();
            // 设置协议和网关
            config.protocol = protocol;
            config.gatewayHost = gatewayHost;
            config.signType = signType;
            // 设置AppId
            config.appId = appId;
            // 根据是否使用证书模式设置不同的配置
            if (useCert) {
                // 证书模式: 使用证书文件路径
                config.merchantCertPath = merchantCertPath;
                config.alipayCertPath = alipayCertPath;
                config.alipayRootCertPath = alipayRootCertPath;
                log.info("支付宝配置初始化成功(证书模式), AppId: {}, Gateway: {}", appId, gatewayHost);
            } else {
                // 非证书模式: 使用公钥私钥字符串
                config.merchantPrivateKey = merchantPrivateKey;
                config.alipayPublicKey = alipayPublicKey;
                log.info("支付宝配置初始化成功(非证书模式), AppId: {}, Gateway: {}", appId, gatewayHost);
            }
            // 设置异步通知地址(可选)
            if (notifyUrl != null && !notifyUrl.isEmpty()) {
                config.notifyUrl = notifyUrl;
            }
            // 设置全局配置(全局只需设置一次)
            Factory.setOptions(config);
            log.info("支付宝EasySDK初始化完成");
        } catch (Exception e) {
            log.error("支付宝配置初始化失败: {}", e.getMessage(), e);
            throw new RuntimeException("支付宝配置初始化失败", e);
        }
    }
    /**
     * 获取支付宝配置对象
     * 用于需要动态配置的场景
     */
    @Bean
    public Config alipayConfigBean() {
        Config config = new Config();
        config.protocol = protocol;
        config.gatewayHost = gatewayHost;
        config.signType = signType;
        config.appId = appId;
        if (useCert) {
            config.merchantCertPath = merchantCertPath;
            config.alipayCertPath = alipayCertPath;
            config.alipayRootCertPath = alipayRootCertPath;
        } else {
            config.merchantPrivateKey = merchantPrivateKey;
            config.alipayPublicKey = alipayPublicKey;
        }
        if (notifyUrl != null && !notifyUrl.isEmpty()) {
            config.notifyUrl = notifyUrl;
        }
        return config;
    }
}
```

## 支付接口详细说明

### 支付接口参数详解

支付宝支付接口的核心参数包括:

1. **subject(订单标题)**: 商品的标题/交易标题/订单标题/订单关键字等,不能为空,长度不超过256个字符
2. **outTradeNo(商户订单号)**: 商户系统内部订单号,64个字符以内,只能包含字母、数字、下划线,需保证商户系统内唯一
3. **totalAmount(订单总金额)**: 订单总金额,单位为元,精确到小数点后两位,取值范围[0.01,100000000]
4. **returnUrl(同步返回地址)**: 支付完成后同步跳转的地址,HTTP/HTTPS开头字符串
5. **notifyUrl(异步通知地址)**: 支付宝服务器主动通知商户服务器里指定的页面http/https路径
6. **sellerId(卖家支付宝用户ID)**: 卖家支付宝用户ID,如果该值为空,则默认为商户签约账号对应的支付宝用户ID
7. **discountableAmount(可打折金额)**: 参与优惠计算的金额,单位为元,精确到小数点后两位
8. **goodsDetail(商品明细)**: 订单包含的商品列表信息,JSON格式,详见商品明细说明
9. **extendParams(扩展参数)**: 业务扩展参数,详见扩展参数说明
10. **timeoutExpress(超时时间)**: 该笔订单允许的最晚付款时间,逾期将关闭交易,取值范围:1m～15d,m-分钟,h-小时,d-天,1c-当天

### 商品明细说明

商品明细(goodsDetail)是一个JSON数组,每个商品包含以下字段:

```json
[
  {
    "goods_id": "apple-01",           // 商品的编号,必填
    "goods_name": "Apple iPhone11 128G",  // 商品名称,必填
    "quantity": 1,                     // 商品数量,必填
    "price": "5799.00",                // 商品单价,单位为元,必填
    "goods_category": "电子产品",       // 商品类目,可选
    "body": "128GB 黑色",              // 商品描述信息,可选
    "show_url": "https://www.example.com/goods/apple-01"  // 商品的展示地址,可选
  }
]
```

### 扩展参数说明

扩展参数(extendParams)是一个JSON对象,可以包含以下字段:

```json
{
  "sys_service_provider_id": "2088511833207846",  // 系统服务商ID,可选
  "hb_fq_num": "3",                               // 花呗分期数,可选
  "hb_fq_seller_percent": "100",                  // 花呗分期卖家承担手续费比例,可选
  "industry_reflux_info": "{\"scene_code\":\"metro_tradeorder\",\"channel\":\"xxxx\",\"scene_data\":{\"asset_name\":\"ALIPAY\"}}",  // 行业回流信息,可选
  "card_type": "S0JP0000"                         // 卡类型,可选
}
```

## 当面付(扫码支付)

### 当面付流程说明

当面付的完整流程如下:

1. **商户系统调用预下单接口**: 商户系统调用`preCreate`接口,传入订单信息
2. **支付宝返回二维码内容**: 支付宝返回二维码字符串(QR Code)
3. **商户展示二维码**: 商户将二维码展示给用户(可以转换为二维码图片)
4. **用户扫码支付**: 用户使用支付宝APP扫描二维码完成支付
5. **支付宝异步通知**: 支付完成后,支付宝主动推送异步通知到商户服务器
6. **商户处理业务逻辑**: 商户验证签名后处理业务逻辑(如更新订单状态)
7. **商户返回success**: 商户返回"success"给支付宝,支付宝停止重试

### 当面付服务

创建当面付服务,用于生成收款二维码:

```java
package com.example.demo.service;
import com.alipay.easysdk.factory.Factory;
import com.alipay.easysdk.kernel.util.ResponseChecker;
import com.alipay.easysdk.payment.facetoface.models.AlipayTradePrecreateResponse;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
/**
 * 支付宝当面付服务
 * 用于生成收款二维码,用户扫码支付
 */
@Slf4j
@Service
public class AlipayFaceToFaceService {
    /**
     * 创建当面付订单(生成收款二维码)
     * 
     * @param subject 订单标题,如"Apple iPhone11 128G"
     * @param outTradeNo 商户订单号,商户系统内唯一,如"2234567890"
     * @param totalAmount 订单总金额,单位为元,精确到小数点后两位,如"5799.00"
     * @return 二维码内容(QR Code),前端可以将其转换为二维码图片
     */
    public String preCreate(String subject, String outTradeNo, String totalAmount) {
        try {
            // 调用支付宝API创建订单
            AlipayTradePrecreateResponse response = Factory.Payment.FaceToFace()
                    .preCreate(subject, outTradeNo, totalAmount);
            // 检查响应是否成功
            if (ResponseChecker.success(response)) {
                // 获取二维码内容
                String qrCode = response.getQrCode();
                log.info("当面付订单创建成功, 订单号: {}, 二维码: {}", outTradeNo, qrCode);
                return qrCode;
            } else {
                // 调用失败,记录错误信息
                log.error("当面付订单创建失败, 订单号: {}, 错误码: {}, 错误信息: {}, 子错误码: {}, 子错误信息: {}", 
                        outTradeNo, response.code, response.msg, response.subCode, response.subMsg);
                throw new RuntimeException("当面付订单创建失败: " + response.msg + ", " + response.subMsg);
            }
        } catch (Exception e) {
            log.error("当面付订单创建异常, 订单号: {}", outTradeNo, e);
            throw new RuntimeException("当面付订单创建异常: " + e.getMessage(), e);
        }
    }
    /**
     * 创建当面付订单(带可选参数)
     * 
     * @param subject 订单标题
     * @param outTradeNo 商户订单号
     * @param totalAmount 订单总金额
     * @param sellerId 卖家支付宝用户ID(可选)
     * @param discountableAmount 可打折金额(可选)
     * @param goodsDetail 商品明细列表(可选)
     * @param asyncNotifyUrl 异步通知地址(可选,优先级低于全局配置)
     * @return 二维码内容
     */
    public String preCreateWithOptions(String subject, String outTradeNo, String totalAmount,
                                       String sellerId, String discountableAmount,
                                       Object goodsDetail, String asyncNotifyUrl) {
        try {
            // 使用链式调用设置可选参数
            var builder = Factory.Payment.FaceToFace();
            // 设置卖家ID(可选)
            if (sellerId != null && !sellerId.isEmpty()) {
                builder = builder.optional("seller_id", sellerId);
            }
            // 设置可打折金额(可选)
            if (discountableAmount != null && !discountableAmount.isEmpty()) {
                builder = builder.optional("discountable_amount", discountableAmount);
            }
            // 设置商品明细(可选)
            if (goodsDetail != null) {
                builder = builder.optional("goods_detail", goodsDetail);
            }
            // 设置独立的异步通知地址(可选,优先级低于全局配置)
            if (asyncNotifyUrl != null && !asyncNotifyUrl.isEmpty()) {
                builder = builder.asyncNotify(asyncNotifyUrl);
            }
            // 调用API创建订单
            AlipayTradePrecreateResponse response = builder.preCreate(subject, outTradeNo, totalAmount);
            if (ResponseChecker.success(response)) {
                String qrCode = response.getQrCode();
                log.info("当面付订单创建成功(带可选参数), 订单号: {}, 二维码: {}", outTradeNo, qrCode);
                return qrCode;
            } else {
                log.error("当面付订单创建失败, 订单号: {}, 错误码: {}, 错误信息: {}", 
                        outTradeNo, response.code, response.msg);
                throw new RuntimeException("当面付订单创建失败: " + response.msg);
            }
        } catch (Exception e) {
            log.error("当面付订单创建异常, 订单号: {}", outTradeNo, e);
            throw new RuntimeException("当面付订单创建异常: " + e.getMessage(), e);
        }
    }
    /**
     * 批量设置可选参数示例
     * 
     * @param subject 订单标题
     * @param outTradeNo 商户订单号
     * @param totalAmount 订单总金额
     * @param optionalArgs 可选参数Map
     * @return 二维码内容
     */
    public String preCreateWithBatchOptions(String subject, String outTradeNo, String totalAmount,
                                           Map<String, Object> optionalArgs) {
        try {
            var builder = Factory.Payment.FaceToFace();
            // 批量设置可选参数
            if (optionalArgs != null && !optionalArgs.isEmpty()) {
                builder = builder.batchOptional(optionalArgs);
            }
            AlipayTradePrecreateResponse response = builder.preCreate(subject, outTradeNo, totalAmount);
            if (ResponseChecker.success(response)) {
                String qrCode = response.getQrCode();
                log.info("当面付订单创建成功(批量可选参数), 订单号: {}", outTradeNo);
                return qrCode;
            } else {
                log.error("当面付订单创建失败, 订单号: {}", outTradeNo);
                throw new RuntimeException("当面付订单创建失败: " + response.msg);
            }
        } catch (Exception e) {
            log.error("当面付订单创建异常, 订单号: {}", outTradeNo, e);
            throw new RuntimeException("当面付订单创建异常: " + e.getMessage(), e);
        }
    }
    /**
     * 创建当面付订单(完整参数示例)
     * 包含商品明细、扩展参数等所有可选参数
     * 
     * @param subject 订单标题
     * @param outTradeNo 商户订单号
     * @param totalAmount 订单总金额
     * @param timeoutExpress 超时时间,如"30m"表示30分钟,"1d"表示1天
     * @param sellerId 卖家支付宝用户ID
     * @param discountableAmount 可打折金额
     * @param goodsDetailList 商品明细列表
     * @param extendParams 扩展参数JSON字符串
     * @param asyncNotifyUrl 异步通知地址
     * @return 二维码内容
     */
    public String preCreateFull(String subject, String outTradeNo, String totalAmount,
                               String timeoutExpress, String sellerId, String discountableAmount,
                               List<Map<String, Object>> goodsDetailList, String extendParams,
                               String asyncNotifyUrl) {
        try {
            var builder = Factory.Payment.FaceToFace();
            // 设置超时时间
            if (timeoutExpress != null && !timeoutExpress.isEmpty()) {
                builder = builder.optional("timeout_express", timeoutExpress);
            }
            // 设置卖家ID
            if (sellerId != null && !sellerId.isEmpty()) {
                builder = builder.optional("seller_id", sellerId);
            }
            // 设置可打折金额
            if (discountableAmount != null && !discountableAmount.isEmpty()) {
                builder = builder.optional("discountable_amount", discountableAmount);
            }
            // 设置商品明细
            if (goodsDetailList != null && !goodsDetailList.isEmpty()) {
                builder = builder.optional("goods_detail", goodsDetailList);
            }
            // 设置扩展参数
            if (extendParams != null && !extendParams.isEmpty()) {
                builder = builder.optional("extend_params", extendParams);
            }
            // 设置异步通知地址
            if (asyncNotifyUrl != null && !asyncNotifyUrl.isEmpty()) {
                builder = builder.asyncNotify(asyncNotifyUrl);
            }
            // 调用API创建订单
            AlipayTradePrecreateResponse response = builder.preCreate(subject, outTradeNo, totalAmount);
            if (ResponseChecker.success(response)) {
                String qrCode = response.getQrCode();
                log.info("当面付订单创建成功(完整参数), 订单号: {}, 二维码: {}", outTradeNo, qrCode);
                return qrCode;
            } else {
                log.error("当面付订单创建失败, 订单号: {}, 错误码: {}, 错误信息: {}", 
                        outTradeNo, response.code, response.msg);
                throw new RuntimeException("当面付订单创建失败: " + response.msg);
            }
        } catch (Exception e) {
            log.error("当面付订单创建异常, 订单号: {}", outTradeNo, e);
            throw new RuntimeException("当面付订单创建异常: " + e.getMessage(), e);
        }
    }
    /**
     * 构建商品明细列表
     * 
     * @param goodsList 商品信息列表
     * @return 商品明细列表
     */
    public List<Map<String, Object>> buildGoodsDetailList(List<GoodsInfo> goodsList) {
        List<Map<String, Object>> goodsDetailList = new ArrayList<>();
        for (GoodsInfo goods : goodsList) {
            Map<String, Object> goodsDetail = new HashMap<>();
            goodsDetail.put("goods_id", goods.getGoodsId());           // 商品编号,必填
            goodsDetail.put("goods_name", goods.getGoodsName());       // 商品名称,必填
            goodsDetail.put("quantity", goods.getQuantity());           // 商品数量,必填
            goodsDetail.put("price", goods.getPrice());                 // 商品单价,必填
            // 可选字段
            if (goods.getGoodsCategory() != null) {
                goodsDetail.put("goods_category", goods.getGoodsCategory());  // 商品类目
            }
            if (goods.getBody() != null) {
                goodsDetail.put("body", goods.getBody());              // 商品描述
            }
            if (goods.getShowUrl() != null) {
                goodsDetail.put("show_url", goods.getShowUrl());        // 商品展示地址
            }
            goodsDetailList.add(goodsDetail);
        }
        return goodsDetailList;
    }
    /**
     * 商品信息类
     */
    @Data
    public static class GoodsInfo {
        private String goodsId;          // 商品编号
        private String goodsName;         // 商品名称
        private Integer quantity;         // 商品数量
        private String price;             // 商品单价
        private String goodsCategory;     // 商品类目(可选)
        private String body;              // 商品描述(可选)
        private String showUrl;           // 商品展示地址(可选)
    }
}
```

### 当面付前端集成示例

前端获取二维码后,需要将其转换为二维码图片展示给用户,以下是完整的前端示例:

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
        <h2>请使用支付宝扫码支付</h2>
        <div id="qrcode"></div>
        <p>订单号: <span id="orderNo"></span></p>
        <p>订单金额: <span id="amount"></span>元</p>
        <button onclick="checkPayment()">检查支付状态</button>
    </div>
    <script>
        // 订单信息
        const orderNo = 'ORDER_20240101123456';
        const amount = '99.00';
        // 创建支付订单
        async function createOrder() {
            try {
                const response = await fetch('/alipay/facetoface/precreate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        subject: '测试商品',
                        outTradeNo: orderNo,
                        totalAmount: amount
                    })
                });
                const result = await response.json();
                if (result.success) {
                    // 显示订单信息
                    document.getElementById('orderNo').textContent = result.outTradeNo;
                    document.getElementById('amount').textContent = amount;
                    // 生成二维码
                    QRCode.toCanvas(document.getElementById('qrcode'), result.qrCode, {
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
                    // 跳转到支付成功页面
                    window.location.href = '/payment/success?orderNo=' + orderNo;
                }
            }, 3000); // 每3秒检查一次
        }
        // 检查支付状态
        async function checkPayment() {
            try {
                const response = await fetch('/alipay/query?outTradeNo=' + orderNo);
                const result = await response.json();
                if (result.success && result.tradeStatus === 'TRADE_SUCCESS') {
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

**Vue.js示例**:

```vue
  
    请使用支付宝扫码支付
    
    订单号: {{ orderNo }}
    订单金额: {{ amount }}元
    检查支付状态
  


import QRCode from 'qrcode';
export default {
  data() {
    return {
      orderNo: 'ORDER_20240101123456',
      amount: '99.00',
      pollingTimer: null
    };
  },
  mounted() {
    this.createOrder();
  },
  beforeDestroy() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
    }
  },
  methods: {
    async createOrder() {
      try {
        const response = await this.$http.post('/alipay/facetoface/precreate', {
          subject: '测试商品',
          outTradeNo: this.orderNo,
          totalAmount: this.amount
        });
        if (response.data.success) {
          // 生成二维码
          await QRCode.toCanvas(this.$refs.qrcode, response.data.qrCode, {
            width: 300,
            margin: 2
          });
          // 开始轮询
          this.startPolling();
        } else {
          alert('创建订单失败: ' + response.data.message);
        }
      } catch (error) {
        console.error('创建订单异常:', error);
        alert('创建订单异常');
      }
    },
    startPolling() {
      this.pollingTimer = setInterval(async () => {
        const paid = await this.checkPayment();
        if (paid) {
          clearInterval(this.pollingTimer);
          this.$router.push('/payment/success?orderNo=' + this.orderNo);
        }
      }, 3000);
    },
    async checkPayment() {
      try {
        const response = await this.$http.get('/alipay/query', {
          params: { outTradeNo: this.orderNo }
        });
        return response.data.success && response.data.tradeStatus === 'TRADE_SUCCESS';
      } catch (error) {
        console.error('检查支付状态异常:', error);
        return false;
      }
    }
  }
};
```

### 当面付控制器

创建当面付控制器,提供HTTP接口:

```java
package com.example.demo.controller;
import com.example.demo.service.AlipayFaceToFaceService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
/**
 * 支付宝当面付控制器
 */
@Slf4j
@RestController
@RequestMapping("/alipay/facetoface")
public class AlipayFaceToFaceController {
    @Autowired
    private AlipayFaceToFaceService alipayFaceToFaceService;
    /**
     * 创建当面付订单
     * 
     * @param subject 订单标题
     * @param outTradeNo 商户订单号
     * @param totalAmount 订单总金额
     * @return 二维码内容
     */
    @PostMapping("/precreate")
    public Map<String, Object> preCreate(@RequestParam String subject,
                                         @RequestParam String outTradeNo,
                                         @RequestParam String totalAmount) {
        try {
            // 创建订单,获取二维码
            String qrCode = alipayFaceToFaceService.preCreate(subject, outTradeNo, totalAmount);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("qrCode", qrCode);
            result.put("outTradeNo", outTradeNo);
            result.put("message", "订单创建成功");
            return result;
        } catch (Exception e) {
            log.error("创建当面付订单失败", e);
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "订单创建失败: " + e.getMessage());
            return result;
        }
    }
    /**
     * 创建当面付订单(带可选参数)
     */
    @PostMapping("/precreate/options")
    public Map<String, Object> preCreateWithOptions(@RequestParam String subject,
                                                   @RequestParam String outTradeNo,
                                                   @RequestParam String totalAmount,
                                                   @RequestParam(required = false) String sellerId,
                                                   @RequestParam(required = false) String discountableAmount,
                                                   @RequestParam(required = false) String asyncNotifyUrl) {
        try {
            String qrCode = alipayFaceToFaceService.preCreateWithOptions(
                    subject, outTradeNo, totalAmount, sellerId, discountableAmount, null, asyncNotifyUrl);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("qrCode", qrCode);
            result.put("outTradeNo", outTradeNo);
            return result;
        } catch (Exception e) {
            log.error("创建当面付订单失败", e);
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "订单创建失败: " + e.getMessage());
            return result;
        }
    }
    /**
     * 创建当面付订单(完整参数,包含商品明细)
     * 
     * @param request 订单请求对象
     * @return 订单创建结果
     */
    @PostMapping("/precreate/full")
    public Map<String, Object> preCreateFull(@RequestBody PreCreateRequest request) {
        try {
            // 构建商品明细列表
            List<Map<String, Object>> goodsDetailList = null;
            if (request.getGoodsList() != null && !request.getGoodsList().isEmpty()) {
                goodsDetailList = alipayFaceToFaceService.buildGoodsDetailList(request.getGoodsList());
            }
            // 创建订单
            String qrCode = alipayFaceToFaceService.preCreateFull(
                    request.getSubject(),
                    request.getOutTradeNo(),
                    request.getTotalAmount(),
                    request.getTimeoutExpress(),
                    request.getSellerId(),
                    request.getDiscountableAmount(),
                    goodsDetailList,
                    request.getExtendParams(),
                    request.getAsyncNotifyUrl()
            );
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("qrCode", qrCode);
            result.put("outTradeNo", request.getOutTradeNo());
            result.put("message", "订单创建成功");
            return result;
        } catch (Exception e) {
            log.error("创建当面付订单失败", e);
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "订单创建失败: " + e.getMessage());
            return result;
        }
    }
    /**
     * 订单创建请求对象
     */
    @Data
    public static class PreCreateRequest {
        private String subject;              // 订单标题
        private String outTradeNo;           // 商户订单号
        private String totalAmount;           // 订单总金额
        private String timeoutExpress;        // 超时时间
        private String sellerId;             // 卖家ID
        private String discountableAmount;    // 可打折金额
        private List<AlipayFaceToFaceService.GoodsInfo> goodsList;  // 商品列表
        private String extendParams;         // 扩展参数JSON字符串
        private String asyncNotifyUrl;        // 异步通知地址
    }
}
```

## 手机网站支付

### 手机网站支付流程说明

手机网站支付的完整流程如下:

1. **商户系统调用支付接口**: 商户系统调用`pay`接口,传入订单信息和同步返回地址
2. **支付宝返回支付页面URL**: 支付宝返回一个完整的支付页面URL(HTML表单)
3. **商户跳转到支付页面**: 商户将用户跳转到支付宝返回的URL
4. **用户在支付宝页面完成支付**: 用户在支付宝页面输入密码或使用指纹等完成支付
5. **支付宝同步返回**: 支付完成后,支付宝将用户重定向回商户的`returnUrl`
6. **支付宝异步通知**: 支付完成后,支付宝主动推送异步通知到商户服务器
7. **商户处理业务逻辑**: 商户验证签名后处理业务逻辑
8. **商户返回success**: 商户返回"success"给支付宝

**注意**: 同步返回和异步通知可能不是同时到达,建议以异步通知为准,同步返回仅用于页面跳转。

### 手机网站支付服务

创建手机网站支付服务,用于生成支付页面URL:

```java
package com.example.demo.service;
import com.alipay.easysdk.factory.Factory;
import com.alipay.easysdk.kernel.util.ResponseChecker;
import com.alipay.easysdk.payment.wap.models.AlipayTradeWapPayResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.Map;
/**
 * 支付宝手机网站支付服务
 * 用于生成手机网站支付页面URL,用户跳转到支付宝完成支付
 */
@Slf4j
@Service
public class AlipayWapService {
    /**
     * 创建手机网站支付订单
     * 
     * @param subject 订单标题
     * @param outTradeNo 商户订单号
     * @param totalAmount 订单总金额
     * @param returnUrl 支付完成后同步跳转地址
     * @return 支付页面URL,前端可以跳转到此URL完成支付
     */
    public String pay(String subject, String outTradeNo, String totalAmount, String returnUrl) {
        try {
            // 调用支付宝API创建支付订单
            AlipayTradeWapPayResponse response = Factory.Payment.Wap()
                    .pay(subject, outTradeNo, totalAmount, returnUrl);
            // 检查响应是否成功
            if (ResponseChecker.success(response)) {
                // 获取支付页面URL
                String body = response.getBody();
                log.info("手机网站支付订单创建成功, 订单号: {}, 支付URL: {}", outTradeNo, body);
                return body;
            } else {
                log.error("手机网站支付订单创建失败, 订单号: {}, 错误码: {}, 错误信息: {}", 
                        outTradeNo, response.code, response.msg);
                throw new RuntimeException("手机网站支付订单创建失败: " + response.msg);
            }
        } catch (Exception e) {
            log.error("手机网站支付订单创建异常, 订单号: {}", outTradeNo, e);
            throw new RuntimeException("手机网站支付订单创建异常: " + e.getMessage(), e);
        }
    }
    /**
     * 创建手机网站支付订单(带可选参数)
     * 
     * @param subject 订单标题
     * @param outTradeNo 商户订单号
     * @param totalAmount 订单总金额
     * @param returnUrl 支付完成后同步跳转地址
     * @param asyncNotifyUrl 异步通知地址(可选)
     * @param optionalArgs 可选参数Map
     * @return 支付页面URL
     */
    public String payWithOptions(String subject, String outTradeNo, String totalAmount,
                                 String returnUrl, String asyncNotifyUrl, Map<String, Object> optionalArgs) {
        try {
            var builder = Factory.Payment.Wap();
            // 设置异步通知地址(可选)
            if (asyncNotifyUrl != null && !asyncNotifyUrl.isEmpty()) {
                builder = builder.asyncNotify(asyncNotifyUrl);
            }
            // 批量设置可选参数(可选)
            if (optionalArgs != null && !optionalArgs.isEmpty()) {
                builder = builder.batchOptional(optionalArgs);
            }
            // 调用API创建支付订单
            AlipayTradeWapPayResponse response = builder.pay(subject, outTradeNo, totalAmount, returnUrl);
            if (ResponseChecker.success(response)) {
                String body = response.getBody();
                log.info("手机网站支付订单创建成功(带可选参数), 订单号: {}", outTradeNo);
                return body;
            } else {
                log.error("手机网站支付订单创建失败, 订单号: {}", outTradeNo);
                throw new RuntimeException("手机网站支付订单创建失败: " + response.msg);
            }
        } catch (Exception e) {
            log.error("手机网站支付订单创建异常, 订单号: {}", outTradeNo, e);
            throw new RuntimeException("手机网站支付订单创建异常: " + e.getMessage(), e);
        }
    }
}
```

### 手机网站支付前端集成示例

手机网站支付需要前端跳转到支付宝返回的URL,以下是完整的前端示例:

**HTML页面示例**:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>手机网站支付</title>
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
        const amount = '99.00';
        const returnUrl = window.location.origin + '/payment/return';
        // 创建支付订单并跳转
        async function createPayment() {
            try {
                const response = await fetch('/alipay/wap/pay', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        subject: '测试商品',
                        outTradeNo: orderNo,
                        totalAmount: amount,
                        returnUrl: returnUrl
                    })
                });
                const result = await response.json();
                if (result.success) {
                    // 直接跳转到支付宝支付页面
                    // 注意: payUrl是一个HTML表单,需要提交表单或直接跳转
                    window.location.href = result.payUrl;
                } else {
                    alert('创建支付订单失败: ' + result.message);
                }
            } catch (error) {
                console.error('创建支付订单异常:', error);
                alert('创建支付订单异常: ' + error.message);
            }
        }
        // 显示订单信息
        document.getElementById('orderNo').textContent = orderNo;
        document.getElementById('amount').textContent = amount;
    </script>
</body>
</html>
```

**支付返回页面处理**:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>支付结果</title>
</head>
<body>
    <div class="result-container">
        <h2 id="result-title">支付处理中...</h2>
        <p id="result-message"></p>
    </div>
    <script>
        // 获取URL参数
        const urlParams = new URLSearchParams(window.location.search);
        const orderNo = urlParams.get('out_trade_no');
        const tradeNo = urlParams.get('trade_no');
        const tradeStatus = urlParams.get('trade_status');
        // 验证支付结果
        async function verifyPayment() {
            try {
                const response = await fetch('/alipay/notify/return', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                const result = await response.json();
                if (result.success) {
                    document.getElementById('result-title').textContent = '支付成功';
                    document.getElementById('result-message').textContent = 
                        '订单号: ' + orderNo + ', 交易号: ' + tradeNo;
                    // 3秒后跳转到订单详情页
                    setTimeout(() => {
                        window.location.href = '/order/detail?orderNo=' + orderNo;
                    }, 3000);
                } else {
                    document.getElementById('result-title').textContent = '支付验证失败';
                    document.getElementById('result-message').textContent = result.message;
                }
            } catch (error) {
                console.error('验证支付结果异常:', error);
                document.getElementById('result-title').textContent = '支付验证异常';
            }
        }
        // 页面加载时验证
        window.onload = function() {
            verifyPayment();
        };
    </script>
</body>
</html>
```

### 手机网站支付控制器

创建手机网站支付控制器:

```java
package com.example.demo.controller;
import com.example.demo.service.AlipayWapService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
/**
 * 支付宝手机网站支付控制器
 */
@Slf4j
@RestController
@RequestMapping("/alipay/wap")
public class AlipayWapController {
    @Autowired
    private AlipayWapService alipayWapService;
    /**
     * 创建手机网站支付订单
     * 
     * @param subject 订单标题
     * @param outTradeNo 商户订单号
     * @param totalAmount 订单总金额
     * @param returnUrl 支付完成后同步跳转地址
     * @return 支付页面URL
     */
    @PostMapping("/pay")
    public Map<String, Object> pay(@RequestParam String subject,
                                   @RequestParam String outTradeNo,
                                   @RequestParam String totalAmount,
                                   @RequestParam String returnUrl) {
        try {
            // 创建支付订单,获取支付URL
            String payUrl = alipayWapService.pay(subject, outTradeNo, totalAmount, returnUrl);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("payUrl", payUrl);
            result.put("outTradeNo", outTradeNo);
            result.put("message", "支付订单创建成功");
            return result;
        } catch (Exception e) {
            log.error("创建手机网站支付订单失败", e);
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "支付订单创建失败: " + e.getMessage());
            return result;
        }
    }
}
```

## 电脑网站支付

### 电脑网站支付流程说明

电脑网站支付的完整流程如下:

1. **商户系统调用支付接口**: 商户系统调用`pay`接口,传入订单信息和同步返回地址
2. **支付宝返回支付表单HTML**: 支付宝返回一个HTML表单,包含所有支付参数
3. **商户展示支付表单**: 商户将HTML表单直接输出到页面,或自动提交表单
4. **用户跳转到支付宝页面**: 表单提交后,用户跳转到支付宝支付页面
5. **用户在支付宝页面完成支付**: 用户在支付宝页面完成支付
6. **支付宝同步返回**: 支付完成后,支付宝将用户重定向回商户的`returnUrl`
7. **支付宝异步通知**: 支付完成后,支付宝主动推送异步通知到商户服务器
8. **商户处理业务逻辑**: 商户验证签名后处理业务逻辑

**注意**: 电脑网站支付返回的是HTML表单,可以直接在页面中输出,浏览器会自动提交表单跳转到支付宝。

### 电脑网站支付服务

创建电脑网站支付服务:

```java
package com.example.demo.service;
import com.alipay.easysdk.factory.Factory;
import com.alipay.easysdk.kernel.util.ResponseChecker;
import com.alipay.easysdk.payment.page.models.AlipayTradePagePayResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.Map;
/**
 * 支付宝电脑网站支付服务
 * 用于生成电脑网站支付页面URL,用户跳转到支付宝完成支付
 */
@Slf4j
@Service
public class AlipayPageService {
    /**
     * 创建电脑网站支付订单
     * 
     * @param subject 订单标题
     * @param outTradeNo 商户订单号
     * @param totalAmount 订单总金额
     * @param returnUrl 支付完成后同步跳转地址
     * @return 支付页面HTML表单,前端可以直接提交此表单跳转到支付宝
     */
    public String pay(String subject, String outTradeNo, String totalAmount, String returnUrl) {
        try {
            // 调用支付宝API创建支付订单
            AlipayTradePagePayResponse response = Factory.Payment.Page()
                    .pay(subject, outTradeNo, totalAmount, returnUrl);
            // 检查响应是否成功
            if (ResponseChecker.success(response)) {
                // 获取支付页面HTML表单
                String body = response.getBody();
                log.info("电脑网站支付订单创建成功, 订单号: {}, 支付表单: {}", outTradeNo, body);
                return body;
            } else {
                log.error("电脑网站支付订单创建失败, 订单号: {}, 错误码: {}, 错误信息: {}", 
                        outTradeNo, response.code, response.msg);
                throw new RuntimeException("电脑网站支付订单创建失败: " + response.msg);
            }
        } catch (Exception e) {
            log.error("电脑网站支付订单创建异常, 订单号: {}", outTradeNo, e);
            throw new RuntimeException("电脑网站支付订单创建异常: " + e.getMessage(), e);
        }
    }
    /**
     * 创建电脑网站支付订单(带可选参数)
     */
    public String payWithOptions(String subject, String outTradeNo, String totalAmount,
                                 String returnUrl, String asyncNotifyUrl, Map<String, Object> optionalArgs) {
        try {
            var builder = Factory.Payment.Page();
            if (asyncNotifyUrl != null && !asyncNotifyUrl.isEmpty()) {
                builder = builder.asyncNotify(asyncNotifyUrl);
            }
            if (optionalArgs != null && !optionalArgs.isEmpty()) {
                builder = builder.batchOptional(optionalArgs);
            }
            AlipayTradePagePayResponse response = builder.pay(subject, outTradeNo, totalAmount, returnUrl);
            if (ResponseChecker.success(response)) {
                String body = response.getBody();
                log.info("电脑网站支付订单创建成功(带可选参数), 订单号: {}", outTradeNo);
                return body;
            } else {
                log.error("电脑网站支付订单创建失败, 订单号: {}", outTradeNo);
                throw new RuntimeException("电脑网站支付订单创建失败: " + response.msg);
            }
        } catch (Exception e) {
            log.error("电脑网站支付订单创建异常, 订单号: {}", outTradeNo, e);
            throw new RuntimeException("电脑网站支付订单创建异常: " + e.getMessage(), e);
        }
    }
}
```

### 电脑网站支付前端集成示例

电脑网站支付返回的是HTML表单,可以直接在页面中输出,以下是完整的前端示例:

**HTML页面示例**:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>电脑网站支付</title>
</head>
<body>
    <div class="payment-container">
        <h2>订单支付</h2>
        <p>订单号: <span id="orderNo"></span></p>
        <p>订单金额: <span id="amount"></span>元</p>
        <button onclick="createPayment()">立即支付</button>
        <div id="payment-form-container" style="display: none;"></div>
    </div>
    <script>
        const orderNo = 'ORDER_20240101123456';
        const amount = '99.00';
        const returnUrl = window.location.origin + '/payment/return';
        // 创建支付订单
        async function createPayment() {
            try {
                const response = await fetch('/alipay/page/pay', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        subject: '测试商品',
                        outTradeNo: orderNo,
                        totalAmount: amount,
                        returnUrl: returnUrl
                    })
                });
                const result = await response.json();
                if (result.success) {
                    // payUrl是HTML表单,直接插入到页面中
                    const formContainer = document.getElementById('payment-form-container');
                    formContainer.innerHTML = result.payUrl;
                    formContainer.style.display = 'block';
                    // 自动提交表单,跳转到支付宝
                    const form = formContainer.querySelector('form');
                    if (form) {
                        form.submit();
                    }
                } else {
                    alert('创建支付订单失败: ' + result.message);
                }
            } catch (error) {
                console.error('创建支付订单异常:', error);
                alert('创建支付订单异常: ' + error.message);
            }
        }
        // 显示订单信息
        document.getElementById('orderNo').textContent = orderNo;
        document.getElementById('amount').textContent = amount;
    </script>
</body>
</html>
```

**Spring Boot Controller返回HTML表单**:

```java
/**
 * 电脑网站支付控制器
 */
@Slf4j
@RestController
@RequestMapping("/alipay/page")
public class AlipayPageController {
    @Autowired
    private AlipayPageService alipayPageService;
    /**
     * 创建电脑网站支付订单并直接跳转
     */
    @PostMapping("/pay")
    public void pay(@RequestParam String subject,
                   @RequestParam String outTradeNo,
                   @RequestParam String totalAmount,
                   @RequestParam String returnUrl,
                   HttpServletResponse response) throws IOException {
        try {
            // 创建支付订单,获取HTML表单
            String payForm = alipayPageService.pay(subject, outTradeNo, totalAmount, returnUrl);
            // 直接输出HTML表单到响应,浏览器会自动提交表单跳转到支付宝
            response.setContentType("text/html;charset=UTF-8");
            response.getWriter().write(payForm);
            response.getWriter().flush();
        } catch (Exception e) {
            log.error("创建电脑网站支付订单失败", e);
            response.setContentType("text/html;charset=UTF-8");
            response.getWriter().write("<html><body><h2>支付订单创建失败</h2><p>" + 
                    e.getMessage() + "</p></body></html>");
        }
    }
}
```

## 支付查询

### 支付查询服务

创建支付查询服务,用于查询订单支付状态:

```java
package com.example.demo.service;
import com.alipay.easysdk.factory.Factory;
import com.alipay.easysdk.kernel.util.ResponseChecker;
import com.alipay.easysdk.payment.common.models.AlipayTradeQueryResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
/**
 * 支付宝支付查询服务
 * 用于查询订单支付状态
 */
@Slf4j
@Service
public class AlipayQueryService {
    /**
     * 查询订单支付状态(通过商户订单号)
     * 
     * @param outTradeNo 商户订单号
     * @return 订单支付状态信息
     */
    public AlipayTradeQueryResponse queryByOutTradeNo(String outTradeNo) {
        try {
            // 调用支付宝API查询订单
            AlipayTradeQueryResponse response = Factory.Payment.Common()
                    .queryByOutTradeNo(outTradeNo);
            // 检查响应是否成功
            if (ResponseChecker.success(response)) {
                log.info("订单查询成功, 订单号: {}, 交易状态: {}, 交易号: {}", 
                        outTradeNo, response.getTradeStatus(), response.getTradeNo());
                return response;
            } else {
                log.error("订单查询失败, 订单号: {}, 错误码: {}, 错误信息: {}", 
                        outTradeNo, response.code, response.msg);
                throw new RuntimeException("订单查询失败: " + response.msg);
            }
        } catch (Exception e) {
            log.error("订单查询异常, 订单号: {}", outTradeNo, e);
            throw new RuntimeException("订单查询异常: " + e.getMessage(), e);
        }
    }
    /**
     * 查询订单支付状态(通过支付宝交易号)
     * 
     * @param tradeNo 支付宝交易号
     * @return 订单支付状态信息
     */
    public AlipayTradeQueryResponse queryByTradeNo(String tradeNo) {
        try {
            // 调用支付宝API查询订单
            AlipayTradeQueryResponse response = Factory.Payment.Common()
                    .queryByTradeNo(tradeNo);
            if (ResponseChecker.success(response)) {
                log.info("订单查询成功, 交易号: {}, 交易状态: {}", tradeNo, response.getTradeStatus());
                return response;
            } else {
                log.error("订单查询失败, 交易号: {}, 错误码: {}", tradeNo, response.code);
                throw new RuntimeException("订单查询失败: " + response.msg);
            }
        } catch (Exception e) {
            log.error("订单查询异常, 交易号: {}", tradeNo, e);
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
            AlipayTradeQueryResponse response = queryByOutTradeNo(outTradeNo);
            // 交易状态: WAIT_BUYER_PAY(交易创建,等待买家付款)
            //          TRADE_CLOSED(未付款交易超时关闭,或支付完成后全额退款)
            //          TRADE_SUCCESS(交易支付成功)
            //          TRADE_FINISHED(交易结束,不可退款)
            String tradeStatus = response.getTradeStatus();
            return "TRADE_SUCCESS".equals(tradeStatus) || "TRADE_FINISHED".equals(tradeStatus);
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
            AlipayTradeQueryResponse response = queryByOutTradeNo(outTradeNo);
            Map<String, Object> detail = new HashMap<>();
            detail.put("outTradeNo", response.getOutTradeNo());           // 商户订单号
            detail.put("tradeNo", response.getTradeNo());                 // 支付宝交易号
            detail.put("tradeStatus", response.getTradeStatus());         // 交易状态
            detail.put("totalAmount", response.getTotalAmount());         // 订单总金额
            detail.put("receiptAmount", response.getReceiptAmount());     // 实收金额
            detail.put("buyerPayAmount", response.getBuyerPayAmount());   // 买家付款金额
            detail.put("pointAmount", response.getPointAmount());         // 积分支付的金额
            detail.put("invoiceAmount", response.getInvoiceAmount());     // 开票金额
            detail.put("sendPayDate", response.getSendPayDate());         // 本次交易打款给卖家的时间
            detail.put("buyerUserId", response.getBuyerUserId());        // 买家支付宝用户ID
            detail.put("buyerLogonId", response.getBuyerLogonId());      // 买家支付宝账号
            detail.put("sellerId", response.getSellerId());               // 卖家支付宝用户ID
            detail.put("sellerEmail", response.getSellerEmail());         // 卖家支付宝账号
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
import com.example.demo.service.AlipayQueryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
/**
 * 支付宝支付查询控制器
 */
@Slf4j
@RestController
@RequestMapping("/alipay/query")
public class AlipayQueryController {
    @Autowired
    private AlipayQueryService alipayQueryService;
    /**
     * 查询订单支付状态(通过商户订单号)
     */
    @GetMapping("/outTradeNo")
    public Map<String, Object> queryByOutTradeNo(@RequestParam String outTradeNo) {
        try {
            var response = alipayQueryService.queryByOutTradeNo(outTradeNo);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("outTradeNo", response.getOutTradeNo());
            result.put("tradeNo", response.getTradeNo());
            result.put("tradeStatus", response.getTradeStatus());
            result.put("totalAmount", response.getTotalAmount());
            result.put("receiptAmount", response.getReceiptAmount());
            result.put("buyerPayAmount", response.getBuyerPayAmount());
            result.put("sendPayDate", response.getSendPayDate());
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
     * 查询订单支付状态(通过支付宝交易号)
     */
    @GetMapping("/tradeNo")
    public Map<String, Object> queryByTradeNo(@RequestParam String tradeNo) {
        try {
            var response = alipayQueryService.queryByTradeNo(tradeNo);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("outTradeNo", response.getOutTradeNo());
            result.put("tradeNo", response.getTradeNo());
            result.put("tradeStatus", response.getTradeStatus());
            result.put("totalAmount", response.getTotalAmount());
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
            boolean paid = alipayQueryService.isPaid(outTradeNo);
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
            Map<String, Object> detail = alipayQueryService.getOrderDetail(outTradeNo);
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

创建支付回调服务,用于处理支付宝异步通知:

```java
package com.example.demo.service;
import com.alipay.easysdk.factory.Factory;
import com.alipay.easysdk.kernel.util.ResponseChecker;
import com.alipay.easysdk.payment.common.models.AlipayTradeNotifyResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.Map;
/**
 * 支付宝支付回调服务
 * 用于处理支付宝异步通知
 */
@Slf4j
@Service
public class AlipayNotifyService {
    /**
     * 验证并处理支付回调
     * 
     * @param notifyParams 支付宝回调参数Map
     * @return 处理结果
     */
    public NotifyResult verifyAndHandleNotify(Map<String, String> notifyParams) {
        try {
            // 验证签名
            boolean signVerified = Factory.Payment.Common()
                    .verifyNotify(notifyParams);
            if (!signVerified) {
                log.warn("支付宝回调签名验证失败, 参数: {}", notifyParams);
                return new NotifyResult(false, "签名验证失败", null);
            }
            // 解析通知参数
            String tradeStatus = notifyParams.get("trade_status");
            String outTradeNo = notifyParams.get("out_trade_no");
            String tradeNo = notifyParams.get("trade_no");
            String totalAmount = notifyParams.get("total_amount");
            String gmtPayment = notifyParams.get("gmt_payment");
            log.info("支付宝回调签名验证成功, 订单号: {}, 交易号: {}, 交易状态: {}, 支付金额: {}, 支付时间: {}", 
                    outTradeNo, tradeNo, tradeStatus, totalAmount, gmtPayment);
            // 根据交易状态处理业务逻辑
            if ("TRADE_SUCCESS".equals(tradeStatus) || "TRADE_FINISHED".equals(tradeStatus)) {
                // 交易成功,处理业务逻辑
                handleTradeSuccess(outTradeNo, tradeNo, totalAmount, gmtPayment);
            } else if ("TRADE_CLOSED".equals(tradeStatus)) {
                // 交易关闭,处理业务逻辑
                handleTradeClosed(outTradeNo, tradeNo);
            } else if ("WAIT_BUYER_PAY".equals(tradeStatus)) {
                // 等待买家付款,通常不需要处理
                log.info("订单等待买家付款, 订单号: {}", outTradeNo);
            }
            // 返回成功响应给支付宝
            return new NotifyResult(true, "处理成功", outTradeNo);
        } catch (Exception e) {
            log.error("处理支付宝回调异常, 参数: {}", notifyParams, e);
            return new NotifyResult(false, "处理异常: " + e.getMessage(), null);
        }
    }
    /**
     * 处理交易成功
     * 
     * @param outTradeNo 商户订单号
     * @param tradeNo 支付宝交易号
     * @param totalAmount 支付金额
     * @param gmtPayment 支付时间
     */
    private void handleTradeSuccess(String outTradeNo, String tradeNo, String totalAmount, String gmtPayment) {
        // TODO: 在这里实现你的业务逻辑
        // 例如: 更新订单状态、发送通知、记录日志等
        log.info("处理交易成功, 订单号: {}, 交易号: {}, 金额: {}, 时间: {}", 
                outTradeNo, tradeNo, totalAmount, gmtPayment);
        // 示例: 更新订单状态
        // orderService.updateOrderStatus(outTradeNo, OrderStatus.PAID);
    }
    /**
     * 处理交易关闭
     * 
     * @param outTradeNo 商户订单号
     * @param tradeNo 支付宝交易号
     */
    private void handleTradeClosed(String outTradeNo, String tradeNo) {
        // TODO: 在这里实现你的业务逻辑
        log.info("处理交易关闭, 订单号: {}, 交易号: {}", outTradeNo, tradeNo);
        // 示例: 更新订单状态
        // orderService.updateOrderStatus(outTradeNo, OrderStatus.CLOSED);
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

创建支付回调控制器,接收支付宝异步通知:

```java
package com.example.demo.controller;
import com.example.demo.service.AlipayNotifyService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
/**
 * 支付宝支付回调控制器
 * 接收支付宝异步通知
 */
@Slf4j
@RestController
@RequestMapping("/alipay/notify")
public class AlipayNotifyController {
    @Autowired
    private AlipayNotifyService alipayNotifyService;
    /**
     * 接收支付宝异步通知
     * 
     * @param params 支付宝回调参数
     * @return 响应给支付宝(必须返回"success"或"fail")
     */
    @PostMapping("/callback")
    public String notifyCallback(@RequestParam Map<String, String> params) {
        try {
            log.info("收到支付宝异步通知, 参数: {}", params);
            // 验证并处理回调
            AlipayNotifyService.NotifyResult result = alipayNotifyService.verifyAndHandleNotify(params);
            if (result.isSuccess()) {
                // 处理成功,返回"success"给支付宝
                // 支付宝收到"success"后不会再发送通知
                return "success";
            } else {
                // 处理失败,返回"fail"给支付宝
                // 支付宝会继续发送通知,直到收到"success"或超过重试次数
                log.warn("支付宝回调处理失败: {}", result.getMessage());
                return "fail";
            }
        } catch (Exception e) {
            log.error("处理支付宝回调异常", e);
            // 异常情况返回"fail",支付宝会重试
            return "fail";
        }
    }
    /**
     * 支付完成同步返回页面
     * 用户支付完成后跳转回商户页面
     */
    @GetMapping("/return")
    public Map<String, Object> returnCallback(@RequestParam Map<String, String> params) {
        try {
            log.info("收到支付宝同步返回, 参数: {}", params);
            // 验证签名
            boolean signVerified = alipayNotifyService.verifyAndHandleNotify(params).isSuccess();
            Map<String, Object> result = new HashMap<>();
            result.put("success", signVerified);
            result.put("message", signVerified ? "支付成功" : "支付验证失败");
            result.put("params", params);
            return result;
        } catch (Exception e) {
            log.error("处理支付宝同步返回异常", e);
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "处理异常: " + e.getMessage());
            return result;
        }
    }
}
```

## 退款功能

### 退款服务

创建退款服务,用于处理订单退款:

```java
package com.example.demo.service;
import com.alipay.easysdk.factory.Factory;
import com.alipay.easysdk.kernel.util.ResponseChecker;
import com.alipay.easysdk.payment.common.models.AlipayTradeRefundResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
/**
 * 支付宝退款服务
 * 用于处理订单退款
 */
@Slf4j
@Service
public class AlipayRefundService {
    /**
     * 退款(通过商户订单号)
     * 
     * @param outTradeNo 商户订单号
     * @param refundAmount 退款金额,单位为元,精确到小数点后两位
     * @param refundReason 退款原因(可选)
     * @return 退款结果
     */
    public AlipayTradeRefundResponse refundByOutTradeNo(String outTradeNo, String refundAmount, String refundReason) {
        try {
            // 调用支付宝API退款
            AlipayTradeRefundResponse response = Factory.Payment.Common()
                    .refundByOutTradeNo(outTradeNo, refundAmount, refundReason);
            if (ResponseChecker.success(response)) {
                log.info("退款成功, 订单号: {}, 退款金额: {}, 退款单号: {}", 
                        outTradeNo, refundAmount, response.getOutRequestNo());
                return response;
            } else {
                log.error("退款失败, 订单号: {}, 错误码: {}, 错误信息: {}", 
                        outTradeNo, response.code, response.msg);
                throw new RuntimeException("退款失败: " + response.msg);
            }
        } catch (Exception e) {
            log.error("退款异常, 订单号: {}", outTradeNo, e);
            throw new RuntimeException("退款异常: " + e.getMessage(), e);
        }
    }
    /**
     * 退款(通过支付宝交易号)
     * 
     * @param tradeNo 支付宝交易号
     * @param refundAmount 退款金额
     * @param refundReason 退款原因(可选)
     * @return 退款结果
     */
    public AlipayTradeRefundResponse refundByTradeNo(String tradeNo, String refundAmount, String refundReason) {
        try {
            AlipayTradeRefundResponse response = Factory.Payment.Common()
                    .refundByTradeNo(tradeNo, refundAmount, refundReason);
            if (ResponseChecker.success(response)) {
                log.info("退款成功, 交易号: {}, 退款金额: {}", tradeNo, refundAmount);
                return response;
            } else {
                log.error("退款失败, 交易号: {}, 错误码: {}", tradeNo, response.code);
                throw new RuntimeException("退款失败: " + response.msg);
            }
        } catch (Exception e) {
            log.error("退款异常, 交易号: {}", tradeNo, e);
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
import com.alipay.easysdk.factory.Factory;
import com.alipay.easysdk.kernel.util.ResponseChecker;
import com.alipay.easysdk.payment.common.models.AlipayTradeCloseResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
/**
 * 支付宝关闭订单服务
 * 用于关闭未支付的订单
 */
@Slf4j
@Service
public class AlipayCloseService {
    /**
     * 关闭订单(通过商户订单号)
     * 
     * @param outTradeNo 商户订单号
     * @return 关闭结果
     */
    public AlipayTradeCloseResponse closeByOutTradeNo(String outTradeNo) {
        try {
            // 调用支付宝API关闭订单
            AlipayTradeCloseResponse response = Factory.Payment.Common()
                    .closeByOutTradeNo(outTradeNo);
            if (ResponseChecker.success(response)) {
                log.info("订单关闭成功, 订单号: {}", outTradeNo);
                return response;
            } else {
                log.error("订单关闭失败, 订单号: {}, 错误码: {}, 错误信息: {}", 
                        outTradeNo, response.code, response.msg);
                throw new RuntimeException("订单关闭失败: " + response.msg);
            }
        } catch (Exception e) {
            log.error("订单关闭异常, 订单号: {}", outTradeNo, e);
            throw new RuntimeException("订单关闭异常: " + e.getMessage(), e);
        }
    }
    /**
     * 关闭订单(通过支付宝交易号)
     * 
     * @param tradeNo 支付宝交易号
     * @return 关闭结果
     */
    public AlipayTradeCloseResponse closeByTradeNo(String tradeNo) {
        try {
            AlipayTradeCloseResponse response = Factory.Payment.Common()
                    .closeByTradeNo(tradeNo);
            if (ResponseChecker.success(response)) {
                log.info("订单关闭成功, 交易号: {}", tradeNo);
                return response;
            } else {
                log.error("订单关闭失败, 交易号: {}", tradeNo);
                throw new RuntimeException("订单关闭失败: " + response.msg);
            }
        } catch (Exception e) {
            log.error("订单关闭异常, 交易号: {}", tradeNo, e);
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

金额必须精确到小数点后两位,建议使用BigDecimal处理:

```java
import java.math.BigDecimal;
import java.math.RoundingMode;
/**
 * 格式化金额
 */
public String formatAmount(BigDecimal amount) {
    // 保留两位小数,四舍五入
    return amount.setScale(2, RoundingMode.HALF_UP).toString();
}
```

### 3. 幂等性处理

支付回调可能重复发送,需要做幂等性处理:

```java
/**
 * 处理支付回调(带幂等性)
 */
public void handleNotifyWithIdempotency(Map<String, String> params) {
    String outTradeNo = params.get("out_trade_no");
    String tradeNo = params.get("trade_no");
    // 检查是否已经处理过
    if (isProcessed(tradeNo)) {
        log.info("订单已处理过,跳过, 订单号: {}, 交易号: {}", outTradeNo, tradeNo);
        return;
    }
    // 处理业务逻辑
    handleTradeSuccess(outTradeNo, tradeNo, params.get("total_amount"), params.get("gmt_payment"));
    // 标记为已处理
    markAsProcessed(tradeNo);
}
```

### 4. 异常处理

建议统一处理异常,避免暴露敏感信息:

```java
/**
 * 统一异常处理
 */
@ControllerAdvice
public class AlipayExceptionHandler {
    @ExceptionHandler(Exception.class)
    public Map<String, Object> handleException(Exception e) {
        log.error("支付宝接口调用异常", e);
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

1. **私钥保护**: 不要将私钥硬编码在代码中,建议使用配置文件或环境变量
2. **HTTPS**: 生产环境必须使用HTTPS
3. **签名验证**: 所有回调必须验证签名
4. **金额校验**: 回调中要校验金额是否与订单一致
5. **订单状态**: 要校验订单状态,避免重复处理

## 总结

支付宝支付接口整合其实没那么复杂,主要就是配置好支付宝SDK、创建支付订单、处理支付回调这几个步骤;Spring Boot 4整合支付宝支付更是方便,支付宝EasySDK已经把复杂的签名、证书管理都封装好了,你只需要关注业务逻辑就行;但是要注意订单号唯一性、金额精度、幂等性处理、安全验证这些细节,这些搞不好容易出问题;鹏磊今天给兄弟们掰扯了支付宝支付的基础概念、项目搭建、当面付、手机网站支付、电脑网站支付、支付查询、支付回调、退款、关闭订单这些功能,还有最佳实践,希望能帮到兄弟们;如果还有啥不明白的,可以看看支付宝开放平台的官方文档,或者给鹏磊留言。
