# 38、Spring Boot 4 整合 阿里云OSS 完整教程
- 来源：https://ddkk.com/springboot/4-action/38.html
- 分类：Spring Boot 4 整合教程
- 分组：九、文件与存储
- 日期：2025-12-08
存文件的时候最烦的就是用本地磁盘,文件多了管理麻烦,而且单机存储容易丢数据,扩展性也不好;用开源对象存储吧,MinIO这些要自己部署维护,太麻烦;用云存储吧,阿里云OSS、腾讯云COS这些都要钱,但是功能全、性能好、可靠性高,是业界最流行的云存储解决方案;但是直接用阿里云OSS写,那叫一个复杂,配置AccessKey、写Java SDK、管理存储桶、处理文件上传下载,一堆配置写得人头疼;后来发现Spring Boot直接把这些都封装好了,用起来贼简单;现在Spring Boot 4出来了,整合阿里云OSS更是方便得不行,阿里云OSS Java SDK自动配置给你整得明明白白,零配置就能用;但是很多兄弟不知道里面的门道,也不知道咋配置OSS客户端、使用Java SDK、管理存储桶、生成预签名URL、使用STS临时凭证这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

其实阿里云OSS在Spring Boot里早就支持了,你只要加个`aliyun-sdk-oss`依赖,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋配置OSS客户端、上传下载文件、管理存储桶、设置访问策略、生成预签名URL、使用分片上传这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

## 阿里云OSS基础概念

### 阿里云OSS是啥玩意儿

阿里云对象存储OSS(Object Storage Service)是一款海量、安全、低成本、高可靠的云存储服务,提供99.9999999999%的数据持久性;阿里云OSS的核心特性包括:

1. **海量存储**: 支持无限容量的对象存储,按需付费
2. **高可靠性**: 提供99.9999999999%的数据持久性,数据自动冗余
3. **高可用性**: 支持多地域部署,自动故障转移
4. **低成本**: 按实际使用量付费,无最低消费
5. **安全可靠**: 支持访问控制、数据加密、防盗链等安全功能
6. **多语言SDK**: 支持Java、Python、Go、JavaScript等多种语言
7. **丰富功能**: 支持图片处理、视频处理、CDN加速等功能

### 阿里云OSS和传统文件存储的区别

1. **存储方式**: OSS是对象存储,使用存储空间(Bucket)和对象(Object)的概念;传统文件存储是文件系统
2. **访问方式**: OSS通过HTTP/HTTPS API访问;传统文件存储通过文件系统API访问
3. **扩展性**: OSS支持无限扩展,按需付费;传统文件存储扩展困难
4. **数据冗余**: OSS支持自动数据冗余;传统文件存储需要手动备份
5. **API统一**: OSS使用RESTful API,标准统一;传统文件存储API不统一
6. **成本**: OSS按实际使用量付费;传统文件存储需要预先购买硬件

### 阿里云OSS的核心概念

1. **存储空间(Bucket)**: 类似于文件夹,用于组织对象,全局唯一
2. **对象(Object)**: 存储的实际数据,可以是文件、图片、视频等
3. **地域(Region)**: OSS的数据中心所在地,如华东1(杭州)、华北2(北京)等
4. **访问域名(Endpoint)**: OSS服务的访问地址,如`oss-cn-hangzhou.aliyuncs.com`
5. **访问密钥(AccessKey)**: 用于身份验证的密钥ID和密钥Secret
6. **预签名URL(Presigned URL)**: 临时访问URL,无需认证即可访问
7. **STS临时凭证**: 通过RAM角色获取的临时访问凭证,更安全

### 阿里云OSS适用场景

1. **文件存储**: 存储用户上传的文件、图片、视频等
2. **静态资源**: 存储网站的静态资源,如CSS、JS、图片等
3. **数据备份**: 备份数据库、日志文件等
4. **大数据存储**: 存储大数据分析的数据文件
5. **CDN加速**: 结合CDN加速静态资源访问
6. **图片处理**: 使用OSS图片处理功能处理图片

## 阿里云OSS账号配置

### 创建AccessKey

1. **登录阿里云控制台**: 访问 https://ecs.console.aliyun.com/
2. **进入AccessKey管理**: 点击右上角头像 > AccessKey管理
3. **创建AccessKey**: 点击"创建AccessKey",获取AccessKey ID和AccessKey Secret
4. **保存凭证**: 妥善保存AccessKey ID和AccessKey Secret,Secret只显示一次

**注意**: 生产环境建议使用RAM用户和STS临时凭证,不要直接使用主账号AccessKey。

### 创建存储空间(Bucket)

1. **进入OSS控制台**: 访问 https://oss.console.aliyun.com/
2. **创建存储空间**: 点击"创建Bucket"
3. **配置存储空间**:

- **Bucket名称**: 全局唯一,如`my-spring-boot-bucket`
- **地域**: 选择离用户最近的地域,如华东1(杭州)
- **存储类型**: 标准存储、低频访问、归档存储等
- **读写权限**: 私有、公共读、公共读写
4. **完成创建**: 点击"确定"完成创建

### 配置跨域访问(CORS)

如果需要前端直接上传文件到OSS,需要配置CORS:

1. **进入Bucket管理**: 选择目标Bucket > 数据安全 > 跨域设置
2. **创建规则**: 点击"创建规则"
3. **配置规则**:

- **来源**: 允许的域名,如`https://example.com`
- **允许Methods**: GET、PUT、POST、DELETE等
- **允许Headers**: 允许的请求头
- **暴露Headers**: 暴露给前端的响应头
- **缓存时间**: 浏览器缓存CORS结果的时间

## 项目搭建和依赖配置

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-oss-demo/
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

这是最关键的,依赖配置不对后面全是坑;Spring Boot 4需要Java 17以上,而且阿里云OSS Java SDK最新版本已经支持Spring Boot 4了。

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
    <artifactId>spring-boot-oss-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 OSS Demo</name>
    <description>Spring Boot 4整合阿里云OSS示例项目</description>
    <properties>
        <java.version>17</java.version>  <!-- Java 17以上 -->
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <!-- 阿里云OSS Java SDK版本 -->
        <aliyun-oss.version>3.18.1</aliyun-oss.version>
    </properties>
    <dependencies>
        <!-- Spring Boot Web Starter: 包含Spring MVC、Tomcat等 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!-- 阿里云OSS Java SDK: OSS客户端库 -->
        <dependency>
            <groupId>com.aliyun.oss</groupId>
            <artifactId>aliyun-sdk-oss</artifactId>
            <version>${aliyun-oss.version}</version>
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
    name: spring-boot-oss-demo  # 应用名称
# 阿里云OSS配置
aliyun:
  oss:
    endpoint: https://oss-cn-hangzhou.aliyuncs.com  # OSS服务端点
    access-key-id: YOUR_ACCESS_KEY_ID  # 访问密钥ID
    access-key-secret: YOUR_ACCESS_KEY_SECRET  # 访问密钥Secret
    bucket-name: my-spring-boot-bucket  # 存储空间名称
    region: cn-hangzhou  # 地域,如cn-hangzhou、cn-beijing等
    # 可选配置
    cdn-domain: https://cdn.example.com  # CDN加速域名(可选)
    url-expiration: 3600  # 预签名URL过期时间(秒),默认1小时
```

## OSS客户端配置

### 创建OSS配置类

创建配置类,初始化OSS客户端:

```java
package com.example.demo.config;
import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
/**
 * 阿里云OSS配置类
 * 用于配置OSS客户端
 */
@Configuration
@ConfigurationProperties(prefix = "aliyun.oss")
@Data
public class OssConfig {
    private String endpoint;  // OSS服务端点
    private String accessKeyId;  // 访问密钥ID
    private String accessKeySecret;  // 访问密钥Secret
    private String bucketName;  // 存储空间名称
    private String region;  // 地域
    private String cdnDomain;  // CDN加速域名(可选)
    private Long urlExpiration = 3600L;  // 预签名URL过期时间(秒)
    /**
     * 创建OSS客户端Bean
     * OSS客户端是线程安全的,可以共享使用
     */
    @Bean
    public OSS ossClient() {
        return new OSSClientBuilder().build(
                endpoint,  // 设置端点
                accessKeyId,  // 设置访问密钥ID
                accessKeySecret  // 设置访问密钥Secret
        );
    }
}
```

### 验证OSS连接

创建服务类,验证OSS连接:

```java
package com.example.demo.service;
import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSException;
import com.aliyun.oss.model.Bucket;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.List;
/**
 * OSS连接测试服务
 */
@Slf4j
@Service
public class OssConnectionService {
    @Autowired
    private OSS ossClient;
    @Value("${aliyun.oss.bucket-name}")
    private String bucketName;
    /**
     * 测试OSS连接
     */
    public void testConnection() {
        try {
            // 检查存储空间是否存在
            boolean exists = ossClient.doesBucketExist(bucketName);
            if (exists) {
                log.info("OSS连接成功,存储空间{}已存在", bucketName);
            } else {
                log.warn("OSS连接成功,但存储空间{}不存在", bucketName);
            }
            // 列出所有存储空间
            List<Bucket> buckets = ossClient.listBuckets();
            log.info("当前账号下的存储空间数量: {}", buckets.size());
        } catch (OSSException e) {
            log.error("OSS连接失败: {}", e.getMessage(), e);
        }
    }
}
```

## 存储空间管理

### 创建存储空间服务

创建服务类,管理存储空间:

```java
package com.example.demo.service;
import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSException;
import com.aliyun.oss.model.Bucket;
import com.aliyun.oss.model.CreateBucketRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
/**
 * OSS存储空间管理服务
 */
@Slf4j
@Service
public class OssBucketService {
    @Autowired
    private OSS ossClient;
    /**
     * 检查存储空间是否存在
     * 
     * @param bucketName 存储空间名称
     * @return 是否存在
     */
    public boolean bucketExists(String bucketName) {
        try {
            return ossClient.doesBucketExist(bucketName);
        } catch (OSSException e) {
            log.error("检查存储空间是否存在失败: {}", e.getMessage(), e);
            return false;
        }
    }
    /**
     * 创建存储空间
     * 
     * @param bucketName 存储空间名称
     * @return 是否创建成功
     */
    public boolean createBucket(String bucketName) {
        try {
            // 检查存储空间是否已存在
            if (bucketExists(bucketName)) {
                log.info("存储空间{}已存在", bucketName);
                return true;
            }
            // 创建存储空间请求
            CreateBucketRequest createBucketRequest = new CreateBucketRequest(bucketName);
            // 设置存储类型为标准存储
            createBucketRequest.setStorageClass(com.aliyun.oss.model.StorageClass.Standard);
            // 设置访问权限为私有
            createBucketRequest.setCannedACL(com.aliyun.oss.model.CannedAccessControlList.Private);
            // 创建存储空间
            ossClient.createBucket(createBucketRequest);
            log.info("存储空间{}创建成功", bucketName);
            return true;
        } catch (OSSException e) {
            log.error("创建存储空间失败: {}", e.getMessage(), e);
            return false;
        }
    }
    /**
     * 删除存储空间
     * 注意: 存储空间必须为空才能删除
     * 
     * @param bucketName 存储空间名称
     * @return 是否删除成功
     */
    public boolean deleteBucket(String bucketName) {
        try {
            // 检查存储空间是否存在
            if (!bucketExists(bucketName)) {
                log.warn("存储空间{}不存在", bucketName);
                return false;
            }
            // 删除存储空间
            ossClient.deleteBucket(bucketName);
            log.info("存储空间{}删除成功", bucketName);
            return true;
        } catch (OSSException e) {
            log.error("删除存储空间失败: {}", e.getMessage(), e);
            return false;
        }
    }
    /**
     * 列出所有存储空间
     * 
     * @return 存储空间列表
     */
    public List<Bucket> listBuckets() {
        try {
            return ossClient.listBuckets();
        } catch (OSSException e) {
            log.error("列出存储空间失败: {}", e.getMessage(), e);
            return List.of();
        }
    }
    /**
     * 获取存储空间信息
     * 
     * @param bucketName 存储空间名称
     * @return 存储空间信息
     */
    public Bucket getBucketInfo(String bucketName) {
        try {
            List<Bucket> buckets = ossClient.listBuckets();
            return buckets.stream()
                    .filter(bucket -> bucket.getName().equals(bucketName))
                    .findFirst()
                    .orElse(null);
        } catch (OSSException e) {
            log.error("获取存储空间信息失败: {}", e.getMessage(), e);
            return null;
        }
    }
}
```

## 文件上传下载

### 文件上传服务

创建文件上传服务:

```java
package com.example.demo.service;
import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSException;
import com.aliyun.oss.model.PutObjectRequest;
import com.aliyun.oss.model.PutObjectResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.InputStream;
import java.util.UUID;
/**
 * OSS文件上传服务
 */
@Slf4j
@Service
public class OssUploadService {
    @Autowired
    private OSS ossClient;
    @Value("${aliyun.oss.bucket-name}")
    private String bucketName;
    /**
     * 上传文件
     * 
     * @param file 文件
     * @return 文件对象名称
     */
    public String uploadFile(MultipartFile file) throws Exception {
        // 生成唯一文件名
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String objectName = UUID.randomUUID().toString() + extension;
        // 上传文件
        return uploadFile(file, objectName);
    }
    /**
     * 上传文件到指定路径
     * 
     * @param file 文件
     * @param objectName 对象名称(文件路径)
     * @return 文件对象名称
     */
    public String uploadFile(MultipartFile file, String objectName) throws Exception {
        try {
            // 创建上传请求
            PutObjectRequest putObjectRequest = new PutObjectRequest(
                    bucketName,  // 存储空间名称
                    objectName,  // 对象名称
                    file.getInputStream()  // 文件输入流
            );
            // 设置文件元数据
            putObjectRequest.setMetadata(com.aliyun.oss.model.ObjectMetadata.builder()
                    .contentType(file.getContentType())  // 内容类型
                    .contentLength(file.getSize())  // 文件大小
                    .build());
            // 上传文件
            PutObjectResult result = ossClient.putObject(putObjectRequest);
            log.info("文件上传成功: {}, ETag: {}", objectName, result.getETag());
            return objectName;
        } catch (OSSException e) {
            log.error("文件上传失败: {}", e.getMessage(), e);
            throw new Exception("文件上传失败: " + e.getMessage(), e);
        }
    }
    /**
     * 上传文件流
     * 
     * @param inputStream 文件流
     * @param objectName 对象名称
     * @param contentType 内容类型
     * @param contentLength 文件大小
     * @return 文件对象名称
     */
    public String uploadFile(InputStream inputStream, String objectName, String contentType, long contentLength) 
            throws Exception {
        try {
            // 创建上传请求
            PutObjectRequest putObjectRequest = new PutObjectRequest(
                    bucketName,
                    objectName,
                    inputStream
            );
            // 设置文件元数据
            com.aliyun.oss.model.ObjectMetadata metadata = new com.aliyun.oss.model.ObjectMetadata();
            metadata.setContentType(contentType);
            metadata.setContentLength(contentLength);
            putObjectRequest.setMetadata(metadata);
            // 上传文件
            ossClient.putObject(putObjectRequest);
            log.info("文件上传成功: {}", objectName);
            return objectName;
        } catch (OSSException e) {
            log.error("文件上传失败: {}", e.getMessage(), e);
            throw new Exception("文件上传失败: " + e.getMessage(), e);
        }
    }
}
```

### 文件下载服务

创建文件下载服务:

```java
package com.example.demo.service;
import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSException;
import com.aliyun.oss.model.OSSObject;
import com.aliyun.oss.model.ObjectMetadata;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import java.io.InputStream;
/**
 * OSS文件下载服务
 */
@Slf4j
@Service
public class OssDownloadService {
    @Autowired
    private OSS ossClient;
    @Value("${aliyun.oss.bucket-name}")
    private String bucketName;
    /**
     * 下载文件
     * 
     * @param objectName 对象名称
     * @return 文件输入流
     */
    public InputStream downloadFile(String objectName) throws Exception {
        try {
            // 获取对象
            OSSObject ossObject = ossClient.getObject(bucketName, objectName);
            return ossObject.getObjectContent();
        } catch (OSSException e) {
            log.error("文件下载失败: {}", e.getMessage(), e);
            throw new Exception("文件下载失败: " + e.getMessage(), e);
        }
    }
    /**
     * 下载文件并返回ResponseEntity
     * 
     * @param objectName 对象名称
     * @param originalFilename 原始文件名
     * @return ResponseEntity
     */
    public ResponseEntity<Resource> downloadFileAsResponse(String objectName, String originalFilename) 
            throws Exception {
        try {
            // 获取对象
            OSSObject ossObject = ossClient.getObject(bucketName, objectName);
            InputStream inputStream = ossObject.getObjectContent();
            ObjectMetadata metadata = ossObject.getObjectMetadata();
            // 创建Resource
            Resource resource = new InputStreamResource(inputStream);
            // 返回ResponseEntity
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + originalFilename + "\"")
                    .contentType(MediaType.parseMediaType(metadata.getContentType()))
                    .contentLength(metadata.getContentLength())
                    .body(resource);
        } catch (OSSException e) {
            log.error("文件下载失败: {}", e.getMessage(), e);
            throw new Exception("文件下载失败: " + e.getMessage(), e);
        }
    }
    /**
     * 获取文件信息
     * 
     * @param objectName 对象名称
     * @return 文件信息
     */
    public ObjectMetadata getFileInfo(String objectName) throws Exception {
        try {
            return ossClient.getObjectMetadata(bucketName, objectName);
        } catch (OSSException e) {
            log.error("获取文件信息失败: {}", e.getMessage(), e);
            throw new Exception("获取文件信息失败: " + e.getMessage(), e);
        }
    }
}
```

### 文件管理服务

创建文件管理服务,包含删除、列表等功能:

```java
package com.example.demo.service;
import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSException;
import com.aliyun.oss.model.OSSObjectSummary;
import com.aliyun.oss.model.ObjectListing;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
/**
 * OSS文件管理服务
 */
@Slf4j
@Service
public class OssFileService {
    @Autowired
    private OSS ossClient;
    @Value("${aliyun.oss.bucket-name}")
    private String bucketName;
    /**
     * 删除文件
     * 
     * @param objectName 对象名称
     * @return 是否删除成功
     */
    public boolean deleteFile(String objectName) {
        try {
            ossClient.deleteObject(bucketName, objectName);
            log.info("文件删除成功: {}", objectName);
            return true;
        } catch (OSSException e) {
            log.error("文件删除失败: {}", e.getMessage(), e);
            return false;
        }
    }
    /**
     * 列出文件
     * 
     * @param prefix 前缀,用于过滤文件
     * @param maxKeys 最大返回数量
     * @return 文件列表
     */
    public List<String> listFiles(String prefix, int maxKeys) {
        List<String> files = new ArrayList<>();
        try {
            ObjectListing objectListing = ossClient.listObjects(bucketName, prefix);
            List<OSSObjectSummary> objectSummaries = objectListing.getObjectSummaries();
            for (OSSObjectSummary objectSummary : objectSummaries) {
                files.add(objectSummary.getKey());
            }
        } catch (OSSException e) {
            log.error("列出文件失败: {}", e.getMessage(), e);
        }
        return files;
    }
    /**
     * 检查文件是否存在
     * 
     * @param objectName 对象名称
     * @return 是否存在
     */
    public boolean fileExists(String objectName) {
        try {
            return ossClient.doesObjectExist(bucketName, objectName);
        } catch (OSSException e) {
            return false;
        }
    }
    /**
     * 复制文件
     * 
     * @param sourceObjectName 源对象名称
     * @param destObjectName 目标对象名称
     * @return 是否复制成功
     */
    public boolean copyFile(String sourceObjectName, String destObjectName) {
        try {
            ossClient.copyObject(bucketName, sourceObjectName, bucketName, destObjectName);
            log.info("文件复制成功: {} -> {}", sourceObjectName, destObjectName);
            return true;
        } catch (OSSException e) {
            log.error("文件复制失败: {}", e.getMessage(), e);
            return false;
        }
    }
}
```

## 控制器实现

### 文件上传控制器

创建文件上传控制器:

```java
package com.example.demo.controller;
import com.example.demo.service.OssUploadService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
/**
 * 文件上传控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/files")
public class FileUploadController {
    @Autowired
    private OssUploadService ossUploadService;
    /**
     * 上传单个文件
     */
    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadFile(@RequestParam("file") MultipartFile file) {
        Map<String, Object> result = new HashMap<>();
        try {
            // 检查文件是否为空
            if (file.isEmpty()) {
                result.put("success", false);
                result.put("message", "文件不能为空");
                return ResponseEntity.badRequest().body(result);
            }
            // 上传文件
            String objectName = ossUploadService.uploadFile(file);
            result.put("success", true);
            result.put("message", "文件上传成功");
            result.put("objectName", objectName);
            result.put("originalFilename", file.getOriginalFilename());
            result.put("size", file.getSize());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("文件上传失败: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("message", "文件上传失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
        }
    }
    /**
     * 上传多个文件
     */
    @PostMapping("/upload-multiple")
    public ResponseEntity<Map<String, Object>> uploadMultipleFiles(@RequestParam("files") MultipartFile[] files) {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> uploadedFiles = new ArrayList<>();
        int successCount = 0;
        int failCount = 0;
        try {
            for (MultipartFile file : files) {
                Map<String, Object> fileResult = new HashMap<>();
                try {
                    String objectName = ossUploadService.uploadFile(file);
                    fileResult.put("success", true);
                    fileResult.put("objectName", objectName);
                    fileResult.put("originalFilename", file.getOriginalFilename());
                    fileResult.put("size", file.getSize());
                    successCount++;
                } catch (Exception e) {
                    fileResult.put("success", false);
                    fileResult.put("originalFilename", file.getOriginalFilename());
                    fileResult.put("message", e.getMessage());
                    failCount++;
                }
                uploadedFiles.add(fileResult);
            }
            result.put("success", true);
            result.put("message", String.format("上传完成: 成功%d个,失败%d个", successCount, failCount));
            result.put("files", uploadedFiles);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("批量文件上传失败: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("message", "批量文件上传失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
        }
    }
}
```

### 文件下载控制器

创建文件下载控制器:

```java
package com.example.demo.controller;
import com.example.demo.service.OssDownloadService;
import com.example.demo.service.OssFileService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
/**
 * 文件下载控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/files")
public class FileDownloadController {
    @Autowired
    private OssDownloadService ossDownloadService;
    @Autowired
    private OssFileService ossFileService;
    /**
     * 下载文件
     */
    @GetMapping("/download/{objectName}")
    public ResponseEntity<?> downloadFile(
            @PathVariable String objectName,
            @RequestParam(required = false) String filename) {
        try {
            // 检查文件是否存在
            if (!ossFileService.fileExists(objectName)) {
                return ResponseEntity.notFound().build();
            }
            // 如果没有指定文件名,使用对象名称
            if (filename == null || filename.isEmpty()) {
                filename = objectName.substring(objectName.lastIndexOf("/") + 1);
            }
            // 下载文件
            return ossDownloadService.downloadFileAsResponse(objectName, filename);
        } catch (Exception e) {
            log.error("文件下载失败: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    /**
     * 获取文件列表
     */
    @GetMapping("/list")
    public ResponseEntity<Map<String, Object>> listFiles(
            @RequestParam(required = false, defaultValue = "") String prefix,
            @RequestParam(required = false, defaultValue = "100") int maxKeys) {
        Map<String, Object> result = new HashMap<>();
        try {
            List<String> files = ossFileService.listFiles(prefix, maxKeys);
            result.put("success", true);
            result.put("files", files);
            result.put("count", files.size());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("获取文件列表失败: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("message", "获取文件列表失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
        }
    }
    /**
     * 获取文件信息
     */
    @GetMapping("/info/{objectName}")
    public ResponseEntity<Map<String, Object>> getFileInfo(@PathVariable String objectName) {
        Map<String, Object> result = new HashMap<>();
        try {
            com.aliyun.oss.model.ObjectMetadata metadata = ossDownloadService.getFileInfo(objectName);
            result.put("success", true);
            result.put("objectName", objectName);
            result.put("size", metadata.getContentLength());
            result.put("contentType", metadata.getContentType());
            result.put("lastModified", metadata.getLastModified());
            result.put("etag", metadata.getETag());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("获取文件信息失败: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("message", "获取文件信息失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
        }
    }
    /**
     * 删除文件
     */
    @DeleteMapping("/{objectName}")
    public ResponseEntity<Map<String, Object>> deleteFile(@PathVariable String objectName) {
        Map<String, Object> result = new HashMap<>();
        try {
            boolean deleted = ossFileService.deleteFile(objectName);
            if (deleted) {
                result.put("success", true);
                result.put("message", "文件删除成功");
                return ResponseEntity.ok(result);
            } else {
                result.put("success", false);
                result.put("message", "文件删除失败");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
            }
        } catch (Exception e) {
            log.error("文件删除失败: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("message", "文件删除失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
        }
    }
}
```

## 预签名URL

### 生成预签名URL

预签名URL允许临时访问文件,无需认证:

```java
package com.example.demo.service;
import com.aliyun.oss.OSS;
import com.aliyun.oss.HttpMethod;
import com.aliyun.oss.model.GeneratePresignedUrlRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.net.URL;
import java.util.Date;
/**
 * OSS预签名URL服务
 */
@Slf4j
@Service
public class OssPresignedUrlService {
    @Autowired
    private OSS ossClient;
    @Value("${aliyun.oss.bucket-name}")
    private String bucketName;
    @Value("${aliyun.oss.url-expiration:3600}")
    private Long urlExpiration;
    /**
     * 生成预签名下载URL
     * 
     * @param objectName 对象名称
     * @param expiration 过期时间(秒),默认使用配置的过期时间
     * @return 预签名URL
     */
    public String getPresignedDownloadUrl(String objectName, Long expiration) {
        try {
            // 设置过期时间
            Date expirationDate = new Date(System.currentTimeMillis() + 
                    (expiration != null ? expiration : urlExpiration) * 1000);
            // 创建预签名URL请求
            GeneratePresignedUrlRequest request = new GeneratePresignedUrlRequest(
                    bucketName,  // 存储空间名称
                    objectName,  // 对象名称
                    HttpMethod.GET  // HTTP方法
            );
            request.setExpiration(expirationDate);
            // 生成预签名URL
            URL url = ossClient.generatePresignedUrl(request);
            log.info("生成预签名下载URL成功: {}", objectName);
            return url.toString();
        } catch (Exception e) {
            log.error("生成预签名下载URL失败: {}", e.getMessage(), e);
            return null;
        }
    }
    /**
     * 生成预签名下载URL(使用默认过期时间)
     */
    public String getPresignedDownloadUrl(String objectName) {
        return getPresignedDownloadUrl(objectName, null);
    }
    /**
     * 生成预签名上传URL
     * 
     * @param objectName 对象名称
     * @param expiration 过期时间(秒),默认使用配置的过期时间
     * @return 预签名URL
     */
    public String getPresignedUploadUrl(String objectName, Long expiration) {
        try {
            // 设置过期时间
            Date expirationDate = new Date(System.currentTimeMillis() + 
                    (expiration != null ? expiration : urlExpiration) * 1000);
            // 创建预签名URL请求
            GeneratePresignedUrlRequest request = new GeneratePresignedUrlRequest(
                    bucketName,
                    objectName,
                    HttpMethod.PUT
            );
            request.setExpiration(expirationDate);
            // 生成预签名URL
            URL url = ossClient.generatePresignedUrl(request);
            log.info("生成预签名上传URL成功: {}", objectName);
            return url.toString();
        } catch (Exception e) {
            log.error("生成预签名上传URL失败: {}", e.getMessage(), e);
            return null;
        }
    }
    /**
     * 生成预签名上传URL(使用默认过期时间)
     */
    public String getPresignedUploadUrl(String objectName) {
        return getPresignedUploadUrl(objectName, null);
    }
}
```

### 预签名URL控制器

创建预签名URL控制器:

```java
package com.example.demo.controller;
import com.example.demo.service.OssPresignedUrlService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
/**
 * 预签名URL控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/files/presigned")
public class PresignedUrlController {
    @Autowired
    private OssPresignedUrlService presignedUrlService;
    /**
     * 生成预签名下载URL
     */
    @GetMapping("/download/{objectName}")
    public ResponseEntity<Map<String, Object>> getDownloadUrl(
            @PathVariable String objectName,
            @RequestParam(required = false) Long expiry) {
        Map<String, Object> result = new HashMap<>();
        try {
            String url = presignedUrlService.getPresignedDownloadUrl(objectName, expiry);
            if (url != null) {
                result.put("success", true);
                result.put("url", url);
                result.put("objectName", objectName);
                result.put("expiry", expiry != null ? expiry : 3600);
                return ResponseEntity.ok(result);
            } else {
                result.put("success", false);
                result.put("message", "生成预签名下载URL失败");
                return ResponseEntity.internalServerError().body(result);
            }
        } catch (Exception e) {
            log.error("生成预签名下载URL失败: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("message", "生成预签名下载URL失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(result);
        }
    }
    /**
     * 生成预签名上传URL
     */
    @GetMapping("/upload/{objectName}")
    public ResponseEntity<Map<String, Object>> getUploadUrl(
            @PathVariable String objectName,
            @RequestParam(required = false) Long expiry) {
        Map<String, Object> result = new HashMap<>();
        try {
            String url = presignedUrlService.getPresignedUploadUrl(objectName, expiry);
            if (url != null) {
                result.put("success", true);
                result.put("url", url);
                result.put("objectName", objectName);
                result.put("expiry", expiry != null ? expiry : 3600);
                return ResponseEntity.ok(result);
            } else {
                result.put("success", false);
                result.put("message", "生成预签名上传URL失败");
                return ResponseEntity.internalServerError().body(result);
            }
        } catch (Exception e) {
            log.error("生成预签名上传URL失败: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("message", "生成预签名上传URL失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(result);
        }
    }
}
```

## 分片上传

### 分片上传服务

对于大文件,支持分片上传:

```java
package com.example.demo.service;
import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSException;
import com.aliyun.oss.model.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
/**
 * OSS分片上传服务
 */
@Slf4j
@Service
public class OssMultipartUploadService {
    @Autowired
    private OSS ossClient;
    @Value("${aliyun.oss.bucket-name}")
    private String bucketName;
    private static final long PART_SIZE = 5 * 1024 * 1024;  // 5MB每片
    /**
     * 分片上传大文件
     * 
     * @param inputStream 文件流
     * @param objectName 对象名称
     * @param contentType 内容类型
     * @param totalSize 文件总大小
     * @return 上传结果
     */
    public String uploadLargeFile(InputStream inputStream, String objectName, String contentType, long totalSize) 
            throws Exception {
        String uploadId = null;
        List<PartETag> partETags = new ArrayList<>();
        try {
            // 初始化分片上传
            InitiateMultipartUploadRequest initRequest = new InitiateMultipartUploadRequest(
                    bucketName,  // 存储空间名称
                    objectName  // 对象名称
            );
            // 设置文件元数据
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentType(contentType);
            initRequest.setObjectMetadata(metadata);
            // 初始化分片上传
            InitiateMultipartUploadResult initResult = ossClient.initiateMultipartUpload(initRequest);
            uploadId = initResult.getUploadId();
            log.info("初始化分片上传成功, UploadId: {}", uploadId);
            // 计算分片数量
            int partCount = (int) ((totalSize + PART_SIZE - 1) / PART_SIZE);
            // 上传每个分片
            for (int i = 0; i < partCount; i++) {
                long skipBytes = PART_SIZE * i;
                long currentPartSize = (i + 1 == partCount) ? (totalSize - skipBytes) : PART_SIZE;
                // 创建分片上传请求
                UploadPartRequest uploadPartRequest = new UploadPartRequest();
                uploadPartRequest.setBucketName(bucketName);
                uploadPartRequest.setKey(objectName);
                uploadPartRequest.setUploadId(uploadId);
                uploadPartRequest.setInputStream(inputStream);
                uploadPartRequest.setPartSize(currentPartSize);
                uploadPartRequest.setPartNumber(i + 1);
                // 上传分片
                UploadPartResult uploadPartResult = ossClient.uploadPart(uploadPartRequest);
                partETags.add(uploadPartResult.getPartETag());
                log.info("分片{}上传成功, ETag: {}", i + 1, uploadPartResult.getETag());
            }
            // 完成分片上传
            CompleteMultipartUploadRequest completeRequest = new CompleteMultipartUploadRequest(
                    bucketName,
                    objectName,
                    uploadId,
                    partETags
            );
            CompleteMultipartUploadResult completeResult = ossClient.completeMultipartUpload(completeRequest);
            log.info("大文件分片上传成功: {}, ETag: {}", objectName, completeResult.getETag());
            return objectName;
        } catch (OSSException e) {
            // 如果上传失败,取消分片上传
            if (uploadId != null) {
                try {
                    AbortMultipartUploadRequest abortRequest = new AbortMultipartUploadRequest(
                            bucketName,
                            objectName,
                            uploadId
                    );
                    ossClient.abortMultipartUpload(abortRequest);
                    log.info("取消分片上传: {}", uploadId);
                } catch (Exception ex) {
                    log.error("取消分片上传失败: {}", ex.getMessage(), ex);
                }
            }
            log.error("大文件分片上传失败: {}", e.getMessage(), e);
            throw new Exception("大文件分片上传失败: " + e.getMessage(), e);
        }
    }
}
```

## 最佳实践

1. **存储空间命名**: 使用有意义的存储空间名称,遵循命名规范,全局唯一
2. **对象命名**: 使用路径分隔符组织对象,如`images/2024/01/photo.jpg`
3. **错误处理**: 妥善处理OSS异常,提供友好的错误信息
4. **文件大小限制**: 设置合理的文件大小限制,大文件使用分片上传
5. **内容类型**: 正确设置文件的内容类型,方便浏览器识别
6. **预签名URL**: 使用预签名URL提供临时访问,提高安全性
7. **访问控制**: 合理配置存储空间权限,控制访问权限
8. **文件分片**: 大文件使用分片上传,提高上传效率
9. **元数据管理**: 使用元数据存储文件相关信息,方便管理
10. **监控日志**: 记录文件操作日志,方便问题排查

## 常见问题

### 1. OSS连接失败

检查OSS配置是否正确,AccessKey是否有效:

```yaml
aliyun:
  oss:
    endpoint: https://oss-cn-hangzhou.aliyuncs.com  # 确保地址正确
    access-key-id: YOUR_ACCESS_KEY_ID
    access-key-secret: YOUR_ACCESS_KEY_SECRET
```

### 2. 存储空间不存在

在操作文件前,确保存储空间已创建:

```java
if (!ossBucketService.bucketExists(bucketName)) {
    ossBucketService.createBucket(bucketName);
}
```

### 3. 文件上传失败

检查文件大小、内容类型等参数是否正确,网络是否正常。

### 4. 预签名URL无效

检查URL是否过期,对象是否存在,存储空间权限是否正确。

### 5. 权限不足

检查AccessKey权限是否正确,存储空间权限是否允许操作。

### 6. 文件下载失败

检查对象名称是否正确,文件是否存在,存储空间权限是否正确。

### 7. 大文件上传超时

使用分片上传,或者增加超时时间。

### 8. 跨域访问问题

在OSS控制台配置CORS规则,允许前端域名访问。

### 9. 文件元数据丢失

确保在上传文件时正确设置元数据。

### 10. 并发上传问题

OSS客户端是线程安全的,可以并发使用。

## STS临时凭证

### 使用STS临时凭证

生产环境建议使用STS临时凭证,而不是直接使用AccessKey:

```java
package com.example.demo.service;
import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import com.aliyun.oss.common.auth.Credentials;
import com.aliyun.oss.common.auth.DefaultCredentialProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
/**
 * STS临时凭证服务
 * 注意: 需要添加STS SDK依赖
 */
@Slf4j
@Service
public class OssStsService {
    @Value("${aliyun.oss.endpoint}")
    private String endpoint;
    /**
     * 使用STS临时凭证创建OSS客户端
     * 
     * @param accessKeyId 临时AccessKey ID
     * @param accessKeySecret 临时AccessKey Secret
     * @param securityToken 安全令牌
     * @return OSS客户端
     */
    public OSS createOssClientWithSts(String accessKeyId, String accessKeySecret, String securityToken) {
        // 创建临时凭证
        Credentials credentials = new com.aliyun.oss.common.auth.BasicCredentials(
                accessKeyId,
                accessKeySecret,
                securityToken
        );
        // 使用临时凭证创建OSS客户端
        return new OSSClientBuilder().build(
                endpoint,
                new DefaultCredentialProvider(credentials),
                null
        );
    }
}
```

## 生命周期管理

### 配置生命周期规则

OSS支持配置生命周期规则,自动删除过期对象或转换存储类型:

```java
package com.example.demo.service;
import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSException;
import com.aliyun.oss.model.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
/**
 * OSS生命周期管理服务
 */
@Slf4j
@Service
public class OssLifecycleService {
    @Autowired
    private OSS ossClient;
    @Value("${aliyun.oss.bucket-name}")
    private String bucketName;
    /**
     * 设置生命周期规则
     * 自动删除30天前的临时文件
     * 
     * @param prefix 对象前缀
     * @param days 过期天数
     */
    public void setLifecycleRule(String prefix, int days) throws Exception {
        try {
            // 创建生命周期规则
            LifecycleRule rule = new LifecycleRule();
            rule.setId("delete-temp-files");  // 规则ID
            rule.setPrefix(prefix);  // 对象前缀
            rule.setStatus(LifecycleRule.RuleStatus.Enabled);  // 启用规则
            // 设置过期规则
            LifecycleRule.Expiration expiration = new LifecycleRule.Expiration();
            expiration.setDays(days);  // 过期天数
            rule.setExpiration(expiration);
            // 创建生命周期配置
            List<LifecycleRule> rules = new ArrayList<>();
            rules.add(rule);
            SetBucketLifecycleRequest request = new SetBucketLifecycleRequest(bucketName);
            request.setLifecycleRules(rules);
            // 设置生命周期规则
            ossClient.setBucketLifecycle(request);
            log.info("生命周期规则设置成功: prefix={}, days={}", prefix, days);
        } catch (OSSException e) {
            log.error("设置生命周期规则失败: {}", e.getMessage(), e);
            throw new Exception("设置生命周期规则失败: " + e.getMessage(), e);
        }
    }
    /**
     * 获取生命周期规则
     * 
     * @return 生命周期规则列表
     */
    public List<LifecycleRule> getLifecycleRules() throws Exception {
        try {
            List<LifecycleRule> rules = ossClient.getBucketLifecycle(bucketName);
            return rules;
        } catch (OSSException e) {
            log.error("获取生命周期规则失败: {}", e.getMessage(), e);
            throw new Exception("获取生命周期规则失败: " + e.getMessage(), e);
        }
    }
    /**
     * 删除生命周期规则
     */
    public void deleteLifecycleRules() throws Exception {
        try {
            ossClient.deleteBucketLifecycle(bucketName);
            log.info("生命周期规则删除成功");
        } catch (OSSException e) {
            log.error("删除生命周期规则失败: {}", e.getMessage(), e);
            throw new Exception("删除生命周期规则失败: " + e.getMessage(), e);
        }
    }
}
```

## 图片处理

### 生成图片处理URL

OSS支持图片处理功能,可以缩放、裁剪、旋转等:

```java
package com.example.demo.service;
import com.aliyun.oss.OSS;
import com.aliyun.oss.HttpMethod;
import com.aliyun.oss.model.GeneratePresignedUrlRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.net.URL;
import java.util.Date;
/**
 * OSS图片处理服务
 */
@Slf4j
@Service
public class OssImageProcessService {
    @Autowired
    private OSS ossClient;
    @Value("${aliyun.oss.bucket-name}")
    private String bucketName;
    @Value("${aliyun.oss.url-expiration:3600}")
    private Long urlExpiration;
    /**
     * 生成图片处理URL
     * 
     * @param objectName 对象名称
     * @param process 图片处理参数,如"image/resize,w_100,h_100"
     * @return 处理后的图片URL
     */
    public String getImageProcessUrl(String objectName, String process) {
        try {
            // 设置过期时间
            Date expiration = new Date(System.currentTimeMillis() + urlExpiration * 1000);
            // 创建预签名URL请求
            GeneratePresignedUrlRequest request = new GeneratePresignedUrlRequest(
                    bucketName,
                    objectName,
                    HttpMethod.GET
            );
            request.setExpiration(expiration);
            // 添加图片处理参数
            request.addQueryParameter("x-oss-process", process);
            // 生成预签名URL
            URL url = ossClient.generatePresignedUrl(request);
            log.info("生成图片处理URL成功: {}, process={}", objectName, process);
            return url.toString();
        } catch (Exception e) {
            log.error("生成图片处理URL失败: {}", e.getMessage(), e);
            return null;
        }
    }
    /**
     * 缩放图片
     * 
     * @param objectName 对象名称
     * @param width 宽度
     * @param height 高度
     * @return 处理后的图片URL
     */
    public String resizeImage(String objectName, int width, int height) {
        String process = String.format("image/resize,w_%d,h_%d", width, height);
        return getImageProcessUrl(objectName, process);
    }
    /**
     * 裁剪图片
     * 
     * @param objectName 对象名称
     * @param x 起始X坐标
     * @param y 起始Y坐标
     * @param width 宽度
     * @param height 高度
     * @return 处理后的图片URL
     */
    public String cropImage(String objectName, int x, int y, int width, int height) {
        String process = String.format("image/crop,x_%d,y_%d,w_%d,h_%d", x, y, width, height);
        return getImageProcessUrl(objectName, process);
    }
    /**
     * 旋转图片
     * 
     * @param objectName 对象名称
     * @param angle 旋转角度
     * @return 处理后的图片URL
     */
    public String rotateImage(String objectName, int angle) {
        String process = String.format("image/rotate,%d", angle);
        return getImageProcessUrl(objectName, process);
    }
    /**
     * 调整图片质量
     * 
     * @param objectName 对象名称
     * @param quality 质量(1-100)
     * @return 处理后的图片URL
     */
    public String adjustImageQuality(String objectName, int quality) {
        String process = String.format("image/quality,Q_%d", quality);
        return getImageProcessUrl(objectName, process);
    }
}
```

## CDN加速

### 配置CDN加速

结合CDN加速静态资源访问:

```java
package com.example.demo.service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
/**
 * OSS CDN加速服务
 */
@Slf4j
@Service
public class OssCdnService {
    @Value("${aliyun.oss.cdn-domain:}")
    private String cdnDomain;
    @Value("${aliyun.oss.bucket-name}")
    private String bucketName;
    /**
     * 获取CDN加速URL
     * 
     * @param objectName 对象名称
     * @return CDN加速URL
     */
    public String getCdnUrl(String objectName) {
        if (cdnDomain != null && !cdnDomain.isEmpty()) {
            // 使用CDN域名
            return cdnDomain + "/" + objectName;
        } else {
            // 使用OSS域名
            return String.format("https://%s.oss-cn-hangzhou.aliyuncs.com/%s", bucketName, objectName);
        }
    }
    /**
     * 获取带图片处理的CDN URL
     * 
     * @param objectName 对象名称
     * @param process 图片处理参数
     * @return CDN加速URL
     */
    public String getCdnUrlWithProcess(String objectName, String process) {
        String baseUrl = getCdnUrl(objectName);
        return baseUrl + "?x-oss-process=" + process;
    }
}
```

## 错误处理和异常

### OSS异常类型

OSS Java SDK定义了多种异常类型:

1. **OSSException**: OSS操作的基础异常
2. **ClientException**: 客户端异常,如网络问题、参数错误等

### 统一异常处理

创建统一异常处理器:

```java
package com.example.demo.exception;
import com.aliyun.oss.OSSException;
import com.aliyun.oss.ClientException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.util.HashMap;
import java.util.Map;
/**
 * OSS异常处理器
 */
@Slf4j
@RestControllerAdvice
public class OssExceptionHandler {
    /**
     * 处理OSS异常
     */
    @ExceptionHandler(OSSException.class)
    public ResponseEntity<Map<String, Object>> handleOssException(OSSException e) {
        log.error("OSS操作失败: {}", e.getMessage(), e);
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("message", "OSS操作失败: " + e.getMessage());
        result.put("errorCode", e.getErrorCode());
        result.put("requestId", e.getRequestId());
        result.put("hostId", e.getHostId());
        // 根据错误码返回不同的HTTP状态码
        int statusCode = e.getStatusCode();
        return ResponseEntity.status(statusCode).body(result);
    }
    /**
     * 处理客户端异常
     */
    @ExceptionHandler(ClientException.class)
    public ResponseEntity<Map<String, Object>> handleClientException(ClientException e) {
        log.error("OSS客户端异常: {}", e.getMessage(), e);
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("message", "OSS客户端异常: " + e.getMessage());
        result.put("errorCode", e.getErrorCode());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
    }
}
```

## 总结

Spring Boot 4整合阿里云OSS非常方便,只需要添加`aliyun-sdk-oss`依赖就能用;阿里云OSS是一个高性能的对象存储服务,提供海量、安全、低成本、高可靠的云存储;支持文件上传下载、存储空间管理、预签名URL、分片上传、STS临时凭证、生命周期管理、图片处理、CDN加速等高级功能;兄弟们根据实际需求选择合适的配置,就能轻松搞定文件存储了;但是要注意合理配置存储空间权限,控制访问权限,确保数据安全;同时要注意处理大文件上传,使用分片上传提高效率;还要注意错误处理和异常管理,提供友好的错误信息;最后要注意成本控制,合理使用存储类型,降低存储成本;生产环境建议使用STS临时凭证,而不是直接使用AccessKey,提高安全性。
