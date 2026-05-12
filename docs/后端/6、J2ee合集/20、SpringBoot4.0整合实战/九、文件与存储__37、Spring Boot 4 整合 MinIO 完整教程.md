# 37、Spring Boot 4 整合 MinIO 完整教程
- 来源：https://ddkk.com/springboot/4-action/37.html
- 分类：Spring Boot 4 整合教程
- 分组：九、文件与存储
- 日期：2025-12-08
存文件的时候最烦的就是用本地磁盘,文件多了管理麻烦,而且单机存储容易丢数据,扩展性也不好;用云存储吧,阿里云OSS、腾讯云COS这些都要钱,而且API还不统一,换一家就得改代码,累死累活还容易出错;后来听说MinIO这玩意儿不错,是一个高性能的对象存储服务,完全兼容Amazon S3 API,可以自己部署,也可以当S3用,功能全、性能好、社区活跃,是业界最流行的开源对象存储解决方案;但是直接用MinIO写,那叫一个复杂,配置服务器、写Java SDK、管理存储桶、处理文件上传下载,一堆配置写得人头疼;后来发现Spring Boot直接把这些都封装好了,用起来贼简单;现在Spring Boot 4出来了,整合MinIO更是方便得不行,MinIO Java SDK自动配置给你整得明明白白,零配置就能用;但是很多兄弟不知道里面的门道,也不知道咋配置MinIO服务器、使用Java SDK、管理存储桶、生成预签名URL这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

其实MinIO在Spring Boot里早就支持了,你只要加个`minio`依赖,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋配置MinIO客户端、上传下载文件、管理存储桶、设置访问策略、生成预签名URL这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

## MinIO基础概念

### MinIO是啥玩意儿

MinIO是一个高性能的对象存储服务,完全兼容Amazon S3 API,适用于构建高可用、高性能的数据存储解决方案;MinIO的核心特性包括:

1. **S3兼容**: 完全兼容Amazon S3 API,可以直接替换S3使用
2. **高性能**: 采用分布式架构,支持高并发访问
3. **高可用**: 支持多节点部署,数据自动冗余
4. **开源免费**: 完全开源,可以免费使用
5. **易于部署**: 单文件部署,配置简单
6. **多语言SDK**: 支持Java、Python、Go、JavaScript等多种语言
7. **Web管理界面**: 提供Web管理界面,方便管理存储桶和对象

### MinIO和传统文件存储的区别

1. **存储方式**: MinIO是对象存储,使用存储桶和对象的概念;传统文件存储是文件系统
2. **访问方式**: MinIO通过HTTP/HTTPS API访问;传统文件存储通过文件系统API访问
3. **扩展性**: MinIO支持分布式部署,易于扩展;传统文件存储扩展困难
4. **数据冗余**: MinIO支持自动数据冗余;传统文件存储需要手动备份
5. **API统一**: MinIO使用S3 API,标准统一;传统文件存储API不统一

### MinIO的核心概念

1. **存储桶(Bucket)**: 类似于文件夹,用于组织对象
2. **对象(Object)**: 存储的实际数据,可以是文件、图片、视频等
3. **端点(Endpoint)**: MinIO服务器的访问地址
4. **访问密钥(Access Key)**: 用于身份验证的密钥ID
5. **秘密密钥(Secret Key)**: 用于身份验证的密钥
6. **预签名URL(Presigned URL)**: 临时访问URL,无需认证即可访问

### MinIO适用场景

1. **文件存储**: 存储用户上传的文件、图片、视频等
2. **数据备份**: 备份数据库、日志文件等
3. **静态资源**: 存储网站的静态资源,如CSS、JS、图片等
4. **大数据存储**: 存储大数据分析的数据文件
5. **容器存储**: 作为Kubernetes的持久化存储

## MinIO服务器安装和配置

### 安装MinIO服务器

**Linux/Mac安装**:

```bash
# 下载MinIO二进制文件
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
# 启动MinIO服务器
./minio server /data/minio
```

**Windows安装**:

```bash
# 下载MinIO Windows版本
# 从 https://dl.min.io/server/minio/release/windows-amd64/minio.exe 下载
# 启动MinIO服务器
minio.exe server D:\data\minio
```

**Docker安装**:

```bash
# 使用Docker运行MinIO
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  --name minio \
  -v /data/minio:/data \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  minio/minio server /data --console-address ":9001"
```

### 配置MinIO服务器

MinIO服务器启动后,默认配置如下:

- **API端口**: 9000
- **控制台端口**: 9001
- **默认用户名**: minioadmin
- **默认密码**: minioadmin

**自定义配置**:

```bash
# 设置环境变量
export MINIO_ROOT_USER=myadmin
export MINIO_ROOT_PASSWORD=mypassword
# 启动MinIO服务器
./minio server /data/minio
```

**使用配置文件**:

创建`/etc/minio/config.json`:

```json
{
  "version": "1",
  "credential": {
    "accessKey": "myadmin",
    "secretKey": "mypassword"
  },
  "region": "us-east-1",
  "browser": "on",
  "logger": {
    "console": {
      "enable": true
    },
    "file": {
      "enable": true,
      "filename": "/var/log/minio/minio.log"
    }
  }
}
```

### 访问MinIO控制台

启动MinIO服务器后,可以通过以下地址访问控制台:

- **控制台地址**: `http://localhost:9001`
- **API地址**: `http://localhost:9000`

使用默认用户名和密码登录后,可以创建存储桶、上传文件、管理访问策略等。

## 项目搭建和依赖配置

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-minio-demo/
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

这是最关键的,依赖配置不对后面全是坑;Spring Boot 4需要Java 17以上,而且MinIO Java SDK最新版本已经支持Spring Boot 4了。

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
    <artifactId>spring-boot-minio-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 MinIO Demo</name>
    <description>Spring Boot 4整合MinIO示例项目</description>
    <properties>
        <java.version>17</java.version>  <!-- Java 17以上 -->
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <!-- MinIO Java SDK版本 -->
        <minio.version>8.5.7</minio.version>
    </properties>
    <dependencies>
        <!-- Spring Boot Web Starter: 包含Spring MVC、Tomcat等 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!-- MinIO Java SDK: MinIO客户端库 -->
        <dependency>
            <groupId>io.minio</groupId>
            <artifactId>minio</artifactId>
            <version>${minio.version}</version>
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
    name: spring-boot-minio-demo  # 应用名称
# MinIO配置
minio:
  endpoint: http://localhost:9000  # MinIO服务器地址
  accessKey: minioadmin  # 访问密钥
  secretKey: minioadmin  # 秘密密钥
  bucketName: my-bucket  # 默认存储桶名称
  secure: false  # 是否使用HTTPS,默认false
  region: us-east-1  # 区域,默认us-east-1
```

## MinIO客户端配置

### 创建MinIO配置类

创建配置类,初始化MinIO客户端:

```java
package com.example.demo.config;
import io.minio.MinioClient;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
/**
 * MinIO配置类
 * 用于配置MinIO客户端
 */
@Configuration
@ConfigurationProperties(prefix = "minio")
@Data
public class MinioConfig {
    private String endpoint;  // MinIO服务器地址
    private String accessKey;  // 访问密钥
    private String secretKey;  // 秘密密钥
    private String bucketName;  // 默认存储桶名称
    private Boolean secure = false;  // 是否使用HTTPS
    private String region = "us-east-1";  // 区域
    /**
     * 创建MinIO客户端Bean
     * MinioClient是线程安全的,可以共享使用
     */
    @Bean
    public MinioClient minioClient() {
        return MinioClient.builder()
                .endpoint(endpoint)  // 设置端点
                .credentials(accessKey, secretKey)  // 设置访问凭证
                .build();
    }
}
```

### 验证MinIO连接

创建服务类,验证MinIO连接:

```java
package com.example.demo.service;
import io.minio.MinioClient;
import io.minio.errors.MinioException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
/**
 * MinIO连接测试服务
 */
@Slf4j
@Service
public class MinioConnectionService {
    @Autowired
    private MinioClient minioClient;
    @Value("${minio.bucketName}")
    private String bucketName;
    /**
     * 测试MinIO连接
     */
    public void testConnection() {
        try {
            // 检查存储桶是否存在
            boolean exists = minioClient.bucketExists(
                    io.minio.BucketExistsArgs.builder()
                            .bucket(bucketName)
                            .build()
            );
            if (exists) {
                log.info("MinIO连接成功,存储桶{}已存在", bucketName);
            } else {
                log.warn("MinIO连接成功,但存储桶{}不存在", bucketName);
            }
        } catch (MinioException | IOException | NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("MinIO连接失败: {}", e.getMessage(), e);
        }
    }
}
```

## 存储桶管理

### 创建存储桶

创建服务类,管理存储桶:

```java
package com.example.demo.service;
import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.RemoveBucketArgs;
import io.minio.errors.MinioException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
/**
 * MinIO存储桶管理服务
 */
@Slf4j
@Service
public class MinioBucketService {
    @Autowired
    private MinioClient minioClient;
    /**
     * 检查存储桶是否存在
     * 
     * @param bucketName 存储桶名称
     * @return 是否存在
     */
    public boolean bucketExists(String bucketName) {
        try {
            return minioClient.bucketExists(
                    BucketExistsArgs.builder()
                            .bucket(bucketName)
                            .build()
            );
        } catch (MinioException | IOException | NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("检查存储桶是否存在失败: {}", e.getMessage(), e);
            return false;
        }
    }
    /**
     * 创建存储桶
     * 
     * @param bucketName 存储桶名称
     * @return 是否创建成功
     */
    public boolean createBucket(String bucketName) {
        try {
            // 检查存储桶是否已存在
            if (bucketExists(bucketName)) {
                log.info("存储桶{}已存在", bucketName);
                return true;
            }
            // 创建存储桶
            minioClient.makeBucket(
                    MakeBucketArgs.builder()
                            .bucket(bucketName)
                            .build()
            );
            log.info("存储桶{}创建成功", bucketName);
            return true;
        } catch (MinioException | IOException | NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("创建存储桶失败: {}", e.getMessage(), e);
            return false;
        }
    }
    /**
     * 删除存储桶
     * 注意: 存储桶必须为空才能删除
     * 
     * @param bucketName 存储桶名称
     * @return 是否删除成功
     */
    public boolean deleteBucket(String bucketName) {
        try {
            // 检查存储桶是否存在
            if (!bucketExists(bucketName)) {
                log.warn("存储桶{}不存在", bucketName);
                return false;
            }
            // 删除存储桶
            minioClient.removeBucket(
                    RemoveBucketArgs.builder()
                            .bucket(bucketName)
                            .build()
            );
            log.info("存储桶{}删除成功", bucketName);
            return true;
        } catch (MinioException | IOException | NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("删除存储桶失败: {}", e.getMessage(), e);
            return false;
        }
    }
    /**
     * 列出所有存储桶
     * 
     * @return 存储桶名称列表
     */
    public java.util.List<String> listBuckets() {
        try {
            return minioClient.listBuckets().stream()
                    .map(io.minio.messages.Bucket::name)
                    .toList();
        } catch (MinioException | IOException | NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("列出存储桶失败: {}", e.getMessage(), e);
            return java.util.Collections.emptyList();
        }
    }
}
```

### 初始化默认存储桶

在应用启动时自动创建默认存储桶:

```java
package com.example.demo.config;
import com.example.demo.service.MinioBucketService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
/**
 * MinIO初始化配置
 * 应用启动时自动创建默认存储桶
 */
@Slf4j
@Component
public class MinioInitializer implements CommandLineRunner {
    @Autowired
    private MinioBucketService minioBucketService;
    @Value("${minio.bucketName}")
    private String bucketName;
    @Override
    public void run(String... args) throws Exception {
        log.info("开始初始化MinIO存储桶...");
        // 创建默认存储桶
        if (minioBucketService.createBucket(bucketName)) {
            log.info("MinIO存储桶{}初始化成功", bucketName);
        } else {
            log.error("MinIO存储桶{}初始化失败", bucketName);
        }
    }
}
```

## 文件上传下载

### 文件上传服务

创建文件上传服务:

```java
package com.example.demo.service;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.errors.MinioException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.io.InputStream;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.UUID;
/**
 * MinIO文件上传服务
 */
@Slf4j
@Service
public class MinioUploadService {
    @Autowired
    private MinioClient minioClient;
    @Value("${minio.bucketName}")
    private String bucketName;
    /**
     * 上传文件
     * 
     * @param file 文件
     * @return 文件对象名称
     */
    public String uploadFile(MultipartFile file) throws MinioException, IOException, NoSuchAlgorithmException, InvalidKeyException {
        // 生成唯一文件名
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String objectName = UUID.randomUUID().toString() + extension;
        // 上传文件
        minioClient.putObject(
                PutObjectArgs.builder()
                        .bucket(bucketName)  // 存储桶名称
                        .object(objectName)  // 对象名称(文件路径)
                        .stream(file.getInputStream(), file.getSize(), -1)  // 文件流,文件大小,-1表示不限制
                        .contentType(file.getContentType())  // 内容类型
                        .build()
        );
        log.info("文件上传成功: {}", objectName);
        return objectName;
    }
    /**
     * 上传文件到指定路径
     * 
     * @param file 文件
     * @param objectName 对象名称(文件路径)
     * @return 文件对象名称
     */
    public String uploadFile(MultipartFile file, String objectName) throws MinioException, IOException, NoSuchAlgorithmException, InvalidKeyException {
        // 上传文件
        minioClient.putObject(
                PutObjectArgs.builder()
                        .bucket(bucketName)
                        .object(objectName)
                        .stream(file.getInputStream(), file.getSize(), -1)
                        .contentType(file.getContentType())
                        .build()
        );
        log.info("文件上传成功: {}", objectName);
        return objectName;
    }
    /**
     * 上传文件流
     * 
     * @param inputStream 文件流
     * @param objectName 对象名称
     * @param contentType 内容类型
     * @param size 文件大小
     * @return 文件对象名称
     */
    public String uploadFile(InputStream inputStream, String objectName, String contentType, long size) 
            throws MinioException, IOException, NoSuchAlgorithmException, InvalidKeyException {
        // 上传文件
        minioClient.putObject(
                PutObjectArgs.builder()
                        .bucket(bucketName)
                        .object(objectName)
                        .stream(inputStream, size, -1)
                        .contentType(contentType)
                        .build()
        );
        log.info("文件上传成功: {}", objectName);
        return objectName;
    }
}
```

### 文件下载服务

创建文件下载服务:

```java
package com.example.demo.service;
import io.minio.GetObjectArgs;
import io.minio.MinioClient;
import io.minio.errors.MinioException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.io.InputStream;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
/**
 * MinIO文件下载服务
 */
@Slf4j
@Service
public class MinioDownloadService {
    @Autowired
    private MinioClient minioClient;
    @Value("${minio.bucketName}")
    private String bucketName;
    /**
     * 下载文件
     * 
     * @param objectName 对象名称
     * @return 文件输入流
     */
    public InputStream downloadFile(String objectName) throws MinioException, IOException, NoSuchAlgorithmException, InvalidKeyException {
        return minioClient.getObject(
                GetObjectArgs.builder()
                        .bucket(bucketName)
                        .object(objectName)
                        .build()
        );
    }
    /**
     * 下载文件并返回ResponseEntity
     * 
     * @param objectName 对象名称
     * @param originalFilename 原始文件名
     * @return ResponseEntity
     */
    public ResponseEntity<Resource> downloadFileAsResponse(String objectName, String originalFilename) 
            throws MinioException, IOException, NoSuchAlgorithmException, InvalidKeyException {
        // 获取文件流
        InputStream inputStream = downloadFile(objectName);
        // 创建Resource
        Resource resource = new InputStreamResource(inputStream);
        // 返回ResponseEntity
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + originalFilename + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }
    /**
     * 获取文件信息
     * 
     * @param objectName 对象名称
     * @return 文件信息
     */
    public io.minio.StatObjectResponse getFileInfo(String objectName) 
            throws MinioException, IOException, NoSuchAlgorithmException, InvalidKeyException {
        return minioClient.statObject(
                io.minio.StatObjectArgs.builder()
                        .bucket(bucketName)
                        .object(objectName)
                        .build()
        );
    }
}
```

### 文件管理服务

创建文件管理服务,包含删除、列表等功能:

```java
package com.example.demo.service;
import io.minio.*;
import io.minio.errors.MinioException;
import io.minio.messages.Item;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.List;
/**
 * MinIO文件管理服务
 */
@Slf4j
@Service
public class MinioFileService {
    @Autowired
    private MinioClient minioClient;
    @Value("${minio.bucketName}")
    private String bucketName;
    /**
     * 删除文件
     * 
     * @param objectName 对象名称
     * @return 是否删除成功
     */
    public boolean deleteFile(String objectName) {
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .build()
            );
            log.info("文件删除成功: {}", objectName);
            return true;
        } catch (MinioException | IOException | NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("文件删除失败: {}", e.getMessage(), e);
            return false;
        }
    }
    /**
     * 列出文件
     * 
     * @param prefix 前缀,用于过滤文件
     * @param recursive 是否递归列出
     * @return 文件列表
     */
    public List<String> listFiles(String prefix, boolean recursive) {
        List<String> files = new ArrayList<>();
        try {
            Iterable<Result<Item>> results = minioClient.listObjects(
                    ListObjectsArgs.builder()
                            .bucket(bucketName)
                            .prefix(prefix)  // 前缀过滤
                            .recursive(recursive)  // 是否递归
                            .build()
            );
            for (Result<Item> result : results) {
                Item item = result.get();
                files.add(item.objectName());
            }
        } catch (MinioException | IOException | NoSuchAlgorithmException | InvalidKeyException e) {
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
            minioClient.statObject(
                    StatObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .build()
            );
            return true;
        } catch (MinioException | IOException | NoSuchAlgorithmException | InvalidKeyException e) {
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
import com.example.demo.service.MinioUploadService;
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
    private MinioUploadService minioUploadService;
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
            String objectName = minioUploadService.uploadFile(file);
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
                    String objectName = minioUploadService.uploadFile(file);
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
import com.example.demo.service.MinioDownloadService;
import com.example.demo.service.MinioFileService;
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
    private MinioDownloadService minioDownloadService;
    @Autowired
    private MinioFileService minioFileService;
    /**
     * 下载文件
     */
    @GetMapping("/download/{objectName}")
    public ResponseEntity<?> downloadFile(
            @PathVariable String objectName,
            @RequestParam(required = false) String filename) {
        try {
            // 检查文件是否存在
            if (!minioFileService.fileExists(objectName)) {
                return ResponseEntity.notFound().build();
            }
            // 如果没有指定文件名,使用对象名称
            if (filename == null || filename.isEmpty()) {
                filename = objectName.substring(objectName.lastIndexOf("/") + 1);
            }
            // 下载文件
            return minioDownloadService.downloadFileAsResponse(objectName, filename);
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
            @RequestParam(required = false, defaultValue = "false") boolean recursive) {
        Map<String, Object> result = new HashMap<>();
        try {
            List<String> files = minioFileService.listFiles(prefix, recursive);
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
            io.minio.StatObjectResponse stat = minioDownloadService.getFileInfo(objectName);
            result.put("success", true);
            result.put("objectName", objectName);
            result.put("size", stat.size());
            result.put("contentType", stat.contentType());
            result.put("lastModified", stat.lastModified());
            result.put("etag", stat.etag());
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
            boolean deleted = minioFileService.deleteFile(objectName);
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
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.http.Method;
import io.minio.errors.MinioException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.concurrent.TimeUnit;
/**
 * MinIO预签名URL服务
 */
@Slf4j
@Service
public class MinioPresignedUrlService {
    @Autowired
    private MinioClient minioClient;
    @Value("${minio.bucketName}")
    private String bucketName;
    /**
     * 生成预签名下载URL
     * 
     * @param objectName 对象名称
     * @param expiry 过期时间(秒),默认7天
     * @return 预签名URL
     */
    public String getPresignedDownloadUrl(String objectName, int expiry) 
            throws MinioException, IOException, NoSuchAlgorithmException, InvalidKeyException {
        return minioClient.getPresignedObjectUrl(
                GetPresignedObjectUrlArgs.builder()
                        .method(Method.GET)  // HTTP方法
                        .bucket(bucketName)
                        .object(objectName)
                        .expiry(expiry, TimeUnit.SECONDS)  // 过期时间
                        .build()
        );
    }
    /**
     * 生成预签名下载URL(默认7天)
     */
    public String getPresignedDownloadUrl(String objectName) 
            throws MinioException, IOException, NoSuchAlgorithmException, InvalidKeyException {
        return getPresignedDownloadUrl(objectName, 7 * 24 * 60 * 60);  // 7天
    }
    /**
     * 生成预签名上传URL
     * 
     * @param objectName 对象名称
     * @param expiry 过期时间(秒),默认1小时
     * @return 预签名URL
     */
    public String getPresignedUploadUrl(String objectName, int expiry) 
            throws MinioException, IOException, NoSuchAlgorithmException, InvalidKeyException {
        return minioClient.getPresignedObjectUrl(
                GetPresignedObjectUrlArgs.builder()
                        .method(Method.PUT)  // HTTP方法
                        .bucket(bucketName)
                        .object(objectName)
                        .expiry(expiry, TimeUnit.SECONDS)  // 过期时间
                        .build()
        );
    }
    /**
     * 生成预签名上传URL(默认1小时)
     */
    public String getPresignedUploadUrl(String objectName) 
            throws MinioException, IOException, NoSuchAlgorithmException, InvalidKeyException {
        return getPresignedUploadUrl(objectName, 60 * 60);  // 1小时
    }
}
```

### 预签名URL控制器

创建预签名URL控制器:

```java
package com.example.demo.controller;
import com.example.demo.service.MinioPresignedUrlService;
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
    private MinioPresignedUrlService presignedUrlService;
    /**
     * 生成预签名下载URL
     */
    @GetMapping("/download/{objectName}")
    public ResponseEntity<Map<String, Object>> getDownloadUrl(
            @PathVariable String objectName,
            @RequestParam(required = false, defaultValue = "604800") int expiry) {  // 默认7天
        Map<String, Object> result = new HashMap<>();
        try {
            String url = presignedUrlService.getPresignedDownloadUrl(objectName, expiry);
            result.put("success", true);
            result.put("url", url);
            result.put("objectName", objectName);
            result.put("expiry", expiry);
            return ResponseEntity.ok(result);
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
            @RequestParam(required = false, defaultValue = "3600") int expiry) {  // 默认1小时
        Map<String, Object> result = new HashMap<>();
        try {
            String url = presignedUrlService.getPresignedUploadUrl(objectName, expiry);
            result.put("success", true);
            result.put("url", url);
            result.put("objectName", objectName);
            result.put("expiry", expiry);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("生成预签名上传URL失败: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("message", "生成预签名上传URL失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(result);
        }
    }
}
```

## 存储桶策略配置

### 设置存储桶策略

配置存储桶的访问策略:

```java
package com.example.demo.service;
import io.minio.MinioClient;
import io.minio.SetBucketPolicyArgs;
import io.minio.errors.MinioException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
/**
 * MinIO存储桶策略服务
 */
@Slf4j
@Service
public class MinioPolicyService {
    @Autowired
    private MinioClient minioClient;
    /**
     * 设置存储桶为公开读取
     * 
     * @param bucketName 存储桶名称
     */
    public void setPublicReadPolicy(String bucketName) 
            throws MinioException, IOException, NoSuchAlgorithmException, InvalidKeyException {
        // 公开读取策略JSON
        String policy = """
            {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Principal": {
                    "AWS": ["*"]
                  },
                  "Action": ["s3:GetObject"],
                  "Resource": ["arn:aws:s3:::%s/*"]
                }
              ]
            }
            """.formatted(bucketName);
        minioClient.setBucketPolicy(
                SetBucketPolicyArgs.builder()
                        .bucket(bucketName)
                        .config(policy)
                        .build()
        );
        log.info("存储桶{}设置为公开读取", bucketName);
    }
    /**
     * 设置存储桶为私有
     * 
     * @param bucketName 存储桶名称
     */
    public void setPrivatePolicy(String bucketName) 
            throws MinioException, IOException, NoSuchAlgorithmException, InvalidKeyException {
        // 私有策略JSON
        String policy = """
            {
              "Version": "2012-10-17",
              "Statement": []
            }
            """;
        minioClient.setBucketPolicy(
                SetBucketPolicyArgs.builder()
                        .bucket(bucketName)
                        .config(policy)
                        .build()
        );
        log.info("存储桶{}设置为私有", bucketName);
    }
    /**
     * 获取存储桶策略
     * 
     * @param bucketName 存储桶名称
     * @return 策略JSON字符串
     */
    public String getBucketPolicy(String bucketName) 
            throws MinioException, IOException, NoSuchAlgorithmException, InvalidKeyException {
        return minioClient.getBucketPolicy(
                io.minio.GetBucketPolicyArgs.builder()
                        .bucket(bucketName)
                        .build()
        );
    }
}
```

## 高级功能

### 文件分片上传

对于大文件,支持分片上传:

```java
package com.example.demo.service;
import io.minio.*;
import io.minio.errors.MinioException;
import io.minio.messages.Part;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.io.InputStream;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.List;
/**
 * MinIO分片上传服务
 */
@Slf4j
@Service
public class MinioMultipartUploadService {
    @Autowired
    private MinioClient minioClient;
    @Value("${minio.bucketName}")
    private String bucketName;
    private static final int PART_SIZE = 5 * 1024 * 1024;  // 5MB每片
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
            throws MinioException, IOException, NoSuchAlgorithmException, InvalidKeyException {
        // 创建分片上传
        String uploadId = minioClient.createMultipartUpload(
                CreateMultipartUploadArgs.builder()
                        .bucket(bucketName)
                        .object(objectName)
                        .contentType(contentType)
                        .build()
        );
        List<Part> parts = new ArrayList<>();
        int partNumber = 1;
        byte[] buffer = new byte[PART_SIZE];
        int bytesRead;
        try {
            // 读取并上传每个分片
            while ((bytesRead = inputStream.read(buffer)) > 0) {
                byte[] partData = new byte[bytesRead];
                System.arraycopy(buffer, 0, partData, 0, bytesRead);
                // 上传分片
                String etag = minioClient.uploadPart(
                        UploadPartArgs.builder()
                                .bucket(bucketName)
                                .object(objectName)
                                .uploadId(uploadId)
                                .partNumber(partNumber)
                                .stream(new java.io.ByteArrayInputStream(partData), partData.length, -1)
                                .build()
                );
                parts.add(new Part(partNumber, etag));
                partNumber++;
            }
            // 完成分片上传
            minioClient.completeMultipartUpload(
                    CompleteMultipartUploadArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .uploadId(uploadId)
                            .parts(parts)
                            .build()
            );
            log.info("大文件分片上传成功: {}", objectName);
            return objectName;
        } catch (Exception e) {
            // 取消分片上传
            try {
                minioClient.abortMultipartUpload(
                        AbortMultipartUploadArgs.builder()
                                .bucket(bucketName)
                                .object(objectName)
                                .uploadId(uploadId)
                                .build()
                );
            } catch (Exception ex) {
                log.error("取消分片上传失败: {}", ex.getMessage(), ex);
            }
            throw e;
        }
    }
}
```

### 文件复制和移动

实现文件复制和移动功能:

```java
package com.example.demo.service;
import io.minio.*;
import io.minio.errors.MinioException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Map;
/**
 * MinIO文件复制和移动服务
 */
@Slf4j
@Service
public class MinioCopyService {
    @Autowired
    private MinioClient minioClient;
    @Value("${minio.bucketName}")
    private String bucketName;
    /**
     * 复制文件
 * 
 * @param sourceBucket 源存储桶
 * @param sourceObject 源对象名称
 * @param destBucket 目标存储桶
 * @param destObject 目标对象名称
 * @return 是否复制成功
 */
public boolean copyFile(String sourceBucket, String sourceObject, String destBucket, String destObject) 
        throws MinioException, IOException, NoSuchAlgorithmException, InvalidKeyException {
    minioClient.copyObject(
            CopyObjectArgs.builder()
                    .bucket(destBucket)
                    .object(destObject)
                    .source(
                            CopySource.builder()
                                    .bucket(sourceBucket)
                                    .object(sourceObject)
                                    .build()
                    )
                    .build()
    );
    log.info("文件复制成功: {} -> {}", sourceObject, destObject);
    return true;
}
/**
 * 移动文件(复制后删除源文件)
 */
public boolean moveFile(String sourceBucket, String sourceObject, String destBucket, String destObject) 
        throws MinioException, IOException, NoSuchAlgorithmException, InvalidKeyException {
    // 复制文件
    if (copyFile(sourceBucket, sourceObject, destBucket, destObject)) {
        // 删除源文件
        minioClient.removeObject(
                RemoveObjectArgs.builder()
                        .bucket(sourceBucket)
                        .object(sourceObject)
                        .build()
        );
        log.info("文件移动成功: {} -> {}", sourceObject, destObject);
        return true;
    }
    return false;
}
```

### 文件元数据管理

管理文件的元数据:

```java
package com.example.demo.service;
import io.minio.*;
import io.minio.errors.MinioException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Map;
/**
 * MinIO文件元数据管理服务
 */
@Slf4j
@Service
public class MinioMetadataService {
    @Autowired
    private MinioClient minioClient;
    @Value("${minio.bucketName}")
    private String bucketName;
    /**
     * 设置文件元数据
     */
    public void setFileMetadata(String objectName, Map<String, String> metadata) 
        throws MinioException, IOException, NoSuchAlgorithmException, InvalidKeyException {
    // 获取当前文件信息
    StatObjectResponse stat = minioClient.statObject(
            StatObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .build()
    );
    // 复制文件并设置新元数据
    minioClient.copyObject(
            CopyObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .source(
                            CopySource.builder()
                                    .bucket(bucketName)
                                    .object(objectName)
                                    .build()
                    )
                    .userMetadata(metadata)  // 设置元数据
                    .contentType(stat.contentType())  // 保持原有内容类型
                    .build()
    );
    log.info("文件元数据设置成功: {}", objectName);
}
/**
 * 获取文件元数据
 */
public Map<String, String> getFileMetadata(String objectName) 
        throws MinioException, IOException, NoSuchAlgorithmException, InvalidKeyException {
    StatObjectResponse stat = minioClient.statObject(
            StatObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .build()
    );
    return stat.userMetadata();
}
```

## 最佳实践

1. **存储桶命名**: 使用有意义的存储桶名称,遵循命名规范
2. **对象命名**: 使用路径分隔符组织对象,如`images/2024/01/photo.jpg`
3. **错误处理**: 妥善处理MinIO异常,提供友好的错误信息
4. **文件大小限制**: 设置合理的文件大小限制,避免上传过大文件
5. **内容类型**: 正确设置文件的内容类型,方便浏览器识别
6. **预签名URL**: 使用预签名URL提供临时访问,提高安全性
7. **存储桶策略**: 合理配置存储桶策略,控制访问权限
8. **文件分片**: 大文件使用分片上传,提高上传效率
9. **元数据管理**: 使用元数据存储文件相关信息,方便管理
10. **监控日志**: 记录文件操作日志,方便问题排查

## 常见问题

### 1. MinIO连接失败

检查MinIO服务器是否启动,端点地址是否正确:

```yaml
minio:
  endpoint: http://localhost:9000  # 确保地址正确
  accessKey: minioadmin
  secretKey: minioadmin
```

### 2. 存储桶不存在

在操作文件前,确保存储桶已创建:

```java
if (!minioBucketService.bucketExists(bucketName)) {
    minioBucketService.createBucket(bucketName);
}
```

### 3. 文件上传失败

检查文件大小、内容类型等参数是否正确。

### 4. 预签名URL无效

检查URL是否过期,对象是否存在。

### 5. 权限不足

检查访问密钥和秘密密钥是否正确,存储桶策略是否允许操作。

### 6. 文件下载失败

检查对象名称是否正确,文件是否存在。

### 7. 大文件上传超时

使用分片上传,或者增加超时时间。

### 8. 存储桶策略不生效

确保策略JSON格式正确,权限配置合理。

### 9. 文件元数据丢失

确保在复制文件时保留原有元数据。

### 10. 并发上传问题

MinIO客户端是线程安全的,可以并发使用。

## 存储桶版本控制

### 启用版本控制

MinIO支持存储桶版本控制,可以保留对象的多个版本:

```java
package com.example.demo.service;
import io.minio.*;
import io.minio.errors.MinioException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.List;
/**
 * MinIO版本控制服务
 */
@Slf4j
@Service
public class MinioVersioningService {
    @Autowired
    private MinioClient minioClient;
    /**
     * 启用存储桶版本控制
     * 
     * @param bucketName 存储桶名称
     */
    public void enableVersioning(String bucketName) 
            throws MinioException, IOException, NoSuchAlgorithmException, InvalidKeyException {
        minioClient.enableVersioning(
                EnableVersioningArgs.builder()
                        .bucket(bucketName)
                        .build()
        );
        log.info("存储桶{}版本控制已启用", bucketName);
    }
    /**
     * 禁用存储桶版本控制
     * 
     * @param bucketName 存储桶名称
     */
    public void disableVersioning(String bucketName) 
            throws MinioException, IOException, NoSuchAlgorithmException, InvalidKeyException {
        minioClient.disableVersioning(
                DisableVersioningArgs.builder()
                        .bucket(bucketName)
                        .build()
        );
        log.info("存储桶{}版本控制已禁用", bucketName);
    }
    /**
     * 检查版本控制是否启用
     * 
     * @param bucketName 存储桶名称
     * @return 是否启用
     */
    public boolean isVersioningEnabled(String bucketName) 
            throws MinioException, IOException, NoSuchAlgorithmException, InvalidKeyException {
        return minioClient.isVersioningEnabled(
                IsVersioningEnabledArgs.builder()
                        .bucket(bucketName)
                        .build()
        );
    }
    /**
     * 列出对象的所有版本
     * 
     * @param bucketName 存储桶名称
     * @param objectName 对象名称
     * @return 版本列表
     */
    public List<io.minio.messages.Version> listObjectVersions(String bucketName, String objectName) 
            throws MinioException, IOException, NoSuchAlgorithmException, InvalidKeyException {
        List<io.minio.messages.Version> versions = new ArrayList<>();
        Iterable<Result<io.minio.messages.Version>> results = minioClient.listObjectVersions(
                ListObjectVersionsArgs.builder()
                        .bucket(bucketName)
                        .prefix(objectName)
                        .build()
        );
        for (Result<io.minio.messages.Version> result : results) {
            versions.add(result.get());
        }
        return versions;
    }
    /**
     * 删除特定版本的对象
     * 
     * @param bucketName 存储桶名称
     * @param objectName 对象名称
     * @param versionId 版本ID
     */
    public void deleteObjectVersion(String bucketName, String objectName, String versionId) 
            throws MinioException, IOException, NoSuchAlgorithmException, InvalidKeyException {
        minioClient.removeObject(
                RemoveObjectArgs.builder()
                        .bucket(bucketName)
                        .object(objectName)
                        .versionId(versionId)
                        .build()
        );
        log.info("对象版本删除成功: {} (版本: {})", objectName, versionId);
    }
}
```

## 生命周期管理

### 配置生命周期规则

MinIO支持配置生命周期规则,自动删除过期对象:

```java
package com.example.demo.service;
import io.minio.*;
import io.minio.errors.MinioException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
/**
 * MinIO生命周期管理服务
 */
@Slf4j
@Service
public class MinioLifecycleService {
    @Autowired
    private MinioClient minioClient;
    /**
     * 设置生命周期规则
     * 自动删除30天前的对象
     * 
     * @param bucketName 存储桶名称
     */
    public void setLifecycleRule(String bucketName) 
            throws MinioException, IOException, NoSuchAlgorithmException, InvalidKeyException {
        // 生命周期规则JSON
        String lifecycleConfig = """
            {
              "Rules": [
                {
                  "ID": "DeleteOldFiles",
                  "Status": "Enabled",
                  "Expiration": {
                    "Days": 30
                  },
                  "Filter": {
                    "Prefix": "temp/"
                  }
                }
              ]
            }
            """;
        minioClient.setBucketLifecycle(
                SetBucketLifecycleArgs.builder()
                        .bucket(bucketName)
                        .config(lifecycleConfig)
                        .build()
        );
        log.info("存储桶{}生命周期规则设置成功", bucketName);
    }
    /**
     * 获取生命周期规则
     * 
     * @param bucketName 存储桶名称
     * @return 生命周期规则JSON
     */
    public String getLifecycleRules(String bucketName) 
            throws MinioException, IOException, NoSuchAlgorithmException, InvalidKeyException {
        return minioClient.getBucketLifecycle(
                GetBucketLifecycleArgs.builder()
                        .bucket(bucketName)
                        .build()
        );
    }
    /**
     * 删除生命周期规则
     * 
     * @param bucketName 存储桶名称
     */
    public void deleteLifecycleRules(String bucketName) 
            throws MinioException, IOException, NoSuchAlgorithmException, InvalidKeyException {
        minioClient.deleteBucketLifecycle(
                DeleteBucketLifecycleArgs.builder()
                        .bucket(bucketName)
                        .build()
        );
        log.info("存储桶{}生命周期规则删除成功", bucketName);
    }
}
```

## 错误处理和异常

### MinIO异常类型

MinIO Java SDK定义了多种异常类型:

1. **MinioException**: MinIO操作的基础异常
2. **ErrorResponseException**: MinIO服务器返回的错误响应
3. **InvalidKeyException**: 无效的访问密钥
4. **NoSuchAlgorithmException**: 不支持的算法

### 统一异常处理

创建统一异常处理器:

```java
package com.example.demo.exception;
import io.minio.ErrorResponseException;
import io.minio.errors.MinioException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.util.HashMap;
import java.util.Map;
/**
 * MinIO异常处理器
 */
@Slf4j
@RestControllerAdvice
public class MinioExceptionHandler {
    /**
     * 处理MinIO异常
     */
    @ExceptionHandler(MinioException.class)
    public ResponseEntity<Map<String, Object>> handleMinioException(MinioException e) {
        log.error("MinIO操作失败: {}", e.getMessage(), e);
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        if (e instanceof ErrorResponseException) {
            ErrorResponseException errorResponse = (ErrorResponseException) e;
            result.put("message", "MinIO操作失败: " + errorResponse.errorResponse().message());
            result.put("code", errorResponse.errorResponse().code());
            result.put("statusCode", errorResponse.errorResponse().statusCode());
            // 根据错误码返回不同的HTTP状态码
            int statusCode = errorResponse.errorResponse().statusCode();
            return ResponseEntity.status(statusCode).body(result);
        } else {
            result.put("message", "MinIO操作失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
        }
    }
    /**
     * 处理文件不存在异常
     */
    @ExceptionHandler(io.minio.errors.ErrorResponseException.class)
    public ResponseEntity<Map<String, Object>> handleFileNotFoundException(
            io.minio.errors.ErrorResponseException e) {
        log.error("文件不存在: {}", e.getMessage(), e);
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("message", "文件不存在");
        result.put("code", e.errorResponse().code());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(result);
    }
}
```

## 实际应用场景

### 图片上传服务

实现图片上传服务,支持图片压缩和缩略图生成:

```java
package com.example.demo.service;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.errors.MinioException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
/**
 * 图片上传服务
 * 支持图片压缩和缩略图生成
 */
@Slf4j
@Service
public class ImageUploadService {
    @Autowired
    private MinioClient minioClient;
    @Value("${minio.bucketName}")
    private String bucketName;
    /**
     * 上传图片并生成缩略图
     * 
     * @param file 图片文件
     * @return 上传结果
     */
    public Map<String, String> uploadImageWithThumbnail(MultipartFile file) 
            throws MinioException, IOException, NoSuchAlgorithmException, InvalidKeyException {
        Map<String, String> result = new HashMap<>();
        // 生成唯一文件名
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String objectName = "images/" + UUID.randomUUID().toString() + extension;
        String thumbnailName = "thumbnails/" + UUID.randomUUID().toString() + extension;
        try {
            // 读取原始图片
            BufferedImage originalImage = ImageIO.read(file.getInputStream());
            // 上传原始图片
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .stream(file.getInputStream(), file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build()
            );
            // 生成缩略图
            BufferedImage thumbnail = createThumbnail(originalImage, 200, 200);
            ByteArrayOutputStream thumbnailStream = new ByteArrayOutputStream();
            ImageIO.write(thumbnail, extension.substring(1), thumbnailStream);
            // 上传缩略图
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(thumbnailName)
                            .stream(new ByteArrayInputStream(thumbnailStream.toByteArray()), 
                                    thumbnailStream.size(), -1)
                            .contentType(file.getContentType())
                            .build()
            );
            result.put("original", objectName);
            result.put("thumbnail", thumbnailName);
            result.put("success", "true");
            log.info("图片上传成功: 原始图片={}, 缩略图={}", objectName, thumbnailName);
        } catch (Exception e) {
            log.error("图片上传失败: {}", e.getMessage(), e);
            throw e;
        }
        return result;
    }
    /**
     * 创建缩略图
     * 
     * @param originalImage 原始图片
     * @param width 缩略图宽度
     * @param height 缩略图高度
     * @return 缩略图
     */
    private BufferedImage createThumbnail(BufferedImage originalImage, int width, int height) {
        // 计算缩放比例
        double scale = Math.min((double) width / originalImage.getWidth(), 
                                (double) height / originalImage.getHeight());
        int scaledWidth = (int) (originalImage.getWidth() * scale);
        int scaledHeight = (int) (originalImage.getHeight() * scale);
        // 创建缩略图
        BufferedImage thumbnail = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = thumbnail.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.drawImage(originalImage, 0, 0, scaledWidth, scaledHeight, null);
        g.dispose();
        return thumbnail;
    }
}
```

### 文件类型验证

添加文件类型验证,确保上传的文件类型符合要求:

```java
package com.example.demo.service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.util.Arrays;
import java.util.List;
/**
 * 文件类型验证服务
 */
@Slf4j
@Service
public class FileTypeValidationService {
    // 允许的图片类型
    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList(
            "image/jpeg", "image/png", "image/gif", "image/webp"
    );
    // 允许的文档类型
    private static final List<String> ALLOWED_DOCUMENT_TYPES = Arrays.asList(
            "application/pdf", "application/msword", 
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    /**
     * 验证文件类型
     * 
     * @param file 文件
     * @param allowedTypes 允许的类型列表
     * @return 是否通过验证
     */
    public boolean validateFileType(MultipartFile file, List<String> allowedTypes) {
        String contentType = file.getContentType();
        if (contentType == null) {
            log.warn("文件类型为空: {}", file.getOriginalFilename());
            return false;
        }
        if (!allowedTypes.contains(contentType)) {
            log.warn("文件类型不允许: {} (允许的类型: {})", contentType, allowedTypes);
            return false;
        }
        return true;
    }
    /**
     * 验证图片类型
     */
    public boolean validateImageType(MultipartFile file) {
        return validateFileType(file, ALLOWED_IMAGE_TYPES);
    }
    /**
     * 验证文档类型
     */
    public boolean validateDocumentType(MultipartFile file) {
        return validateFileType(file, ALLOWED_DOCUMENT_TYPES);
    }
    /**
     * 验证文件大小
     * 
     * @param file 文件
     * @param maxSize 最大大小(字节)
     * @return 是否通过验证
     */
    public boolean validateFileSize(MultipartFile file, long maxSize) {
        if (file.getSize() > maxSize) {
            log.warn("文件大小超过限制: {} (最大: {})", file.getSize(), maxSize);
            return false;
        }
        return true;
    }
}
```

### 文件访问统计

实现文件访问统计功能:

```java
package com.example.demo.service;
import io.minio.MinioClient;
import io.minio.StatObjectArgs;
import io.minio.errors.MinioException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.HashMap;
import java.util.Map;
/**
 * 文件访问统计服务
 */
@Slf4j
@Service
public class FileStatisticsService {
    @Autowired
    private MinioClient minioClient;
    @Value("${minio.bucketName}")
    private String bucketName;
    /**
     * 获取文件统计信息
     * 
     * @param objectName 对象名称
     * @return 统计信息
     */
    public Map<String, Object> getFileStatistics(String objectName) 
            throws MinioException, IOException, NoSuchAlgorithmException, InvalidKeyException {
        Map<String, Object> statistics = new HashMap<>();
        // 获取文件信息
        io.minio.StatObjectResponse stat = minioClient.statObject(
                StatObjectArgs.builder()
                        .bucket(bucketName)
                        .object(objectName)
                        .build()
        );
        statistics.put("objectName", objectName);
        statistics.put("size", stat.size());
        statistics.put("contentType", stat.contentType());
        statistics.put("lastModified", stat.lastModified());
        statistics.put("etag", stat.etag());
        statistics.put("userMetadata", stat.userMetadata());
        return statistics;
    }
}
```

## 性能优化

### 连接池配置

MinIO客户端是线程安全的,可以共享使用,但可以配置连接参数:

```java
@Bean
public MinioClient minioClient() {
    return MinioClient.builder()
            .endpoint(endpoint)
            .credentials(accessKey, secretKey)
            .region(region)  // 设置区域
            .build();
}
```

### 异步上传

对于大文件,可以使用异步上传:

```java
package com.example.demo.service;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.concurrent.CompletableFuture;
/**
 * 异步文件上传服务
 */
@Slf4j
@Service
public class AsyncMinioUploadService {
    @Autowired
    private MinioClient minioClient;
    @Value("${minio.bucketName}")
    private String bucketName;
    /**
     * 异步上传文件
     * 
     * @param file 文件
     * @param objectName 对象名称
     * @return CompletableFuture
     */
    @Async
    public CompletableFuture<String> uploadFileAsync(MultipartFile file, String objectName) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                minioClient.putObject(
                        PutObjectArgs.builder()
                                .bucket(bucketName)
                                .object(objectName)
                                .stream(file.getInputStream(), file.getSize(), -1)
                                .contentType(file.getContentType())
                                .build()
                );
                log.info("异步文件上传成功: {}", objectName);
                return objectName;
            } catch (Exception e) {
                log.error("异步文件上传失败: {}", e.getMessage(), e);
                throw new RuntimeException("文件上传失败", e);
            }
        });
    }
}
```

## 监控和日志

### 集成Actuator监控

可以集成Spring Boot Actuator监控MinIO连接状态:

```java
package com.example.demo.actuator;
import io.minio.MinioClient;
import io.minio.errors.MinioException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
/**
 * MinIO健康检查
 */
@Component
public class MinioHealthIndicator implements HealthIndicator {
    @Autowired
    private MinioClient minioClient;
    @Override
    public Health health() {
        try {
            // 尝试列出存储桶,检查连接
            minioClient.listBuckets();
            return Health.up()
                    .withDetail("status", "MinIO连接正常")
                    .build();
        } catch (MinioException | IOException | NoSuchAlgorithmException | InvalidKeyException e) {
            return Health.down()
                    .withDetail("status", "MinIO连接失败")
                    .withDetail("error", e.getMessage())
                    .build();
        }
    }
}
```

## 总结

Spring Boot 4整合MinIO非常方便,只需要添加`minio`依赖就能用;MinIO是一个高性能的对象存储服务,完全兼容Amazon S3 API;支持文件上传下载、存储桶管理、预签名URL、分片上传、版本控制、生命周期管理等高级功能;兄弟们根据实际需求选择合适的配置,就能轻松搞定文件存储了;但是要注意合理配置存储桶策略,控制访问权限,确保数据安全;同时要注意处理大文件上传,使用分片上传提高效率;还要注意错误处理和异常管理,提供友好的错误信息;最后要注意性能优化,合理使用异步上传和连接池,提高系统性能。
