# 39、Spring Boot 4 整合 FTP 完整教程
- 来源：https://ddkk.com/springboot/4-action/39.html
- 分类：Spring Boot 4 整合教程
- 分组：九、文件与存储
- 日期：2025-12-08
传文件的时候最烦的就是用HTTP接口,文件大了容易超时,而且还得写一堆上传下载的接口,累死累活还容易出错;用对象存储吧,OSS、MinIO这些要配置服务器,太麻烦;其实FTP这玩意儿不错,是一个标准的文件传输协议,支持大文件传输、断点续传、目录操作,功能全、可靠性高、兼容性好,是业界最广泛采用的文件传输协议;但是直接用FTP写,那叫一个复杂,配置连接、写Java代码、处理被动模式、管理连接池,一堆配置写得人头疼;后来发现Spring Boot直接把这些都封装好了,用Spring Integration FTP可以自动配置给你整得明明白白,零配置就能用;现在Spring Boot 4出来了,整合FTP更是方便得不行,Spring Integration FTP自动配置给你整得明明白白,零配置就能用;但是很多兄弟不知道里面的门道,也不知道咋配置FTP客户端、使用Spring Integration、处理被动模式、使用FTPS这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

其实FTP在Spring Boot里早就支持了,你只要加个`spring-integration-ftp`依赖,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋配置FTP会话工厂、上传下载文件、使用入站出站适配器、处理文件过滤这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

## FTP基础概念

### FTP是啥玩意儿

FTP(File Transfer Protocol,文件传输协议)是一个标准的网络协议,用于在网络上进行文件传输;FTP的核心特性包括:

1. **标准协议**: 基于TCP/IP协议,广泛支持
2. **双向传输**: 支持文件上传和下载
3. **目录操作**: 支持创建、删除、列出目录等操作
4. **断点续传**: 支持大文件断点续传
5. **被动模式**: 支持被动模式,适合防火墙环境
6. **安全传输**: 支持FTPS(基于SSL/TLS的FTP)和SFTP(基于SSH的FTP)
7. **多客户端**: 支持多种FTP客户端工具

### FTP和HTTP文件传输的区别

1. **协议**: FTP是专门的文件传输协议;HTTP是超文本传输协议
2. **连接**: FTP使用控制连接和数据连接;HTTP只使用一个连接
3. **目录操作**: FTP支持目录操作;HTTP不支持
4. **断点续传**: FTP原生支持断点续传;HTTP需要特殊处理
5. **性能**: FTP在大文件传输时性能更好;HTTP适合小文件
6. **安全性**: FTP默认不加密;HTTP可以配合HTTPS使用

### FTP的核心概念

1. **FTP服务器**: 提供FTP服务的服务器
2. **FTP客户端**: 连接FTP服务器的客户端程序
3. **控制连接**: FTP客户端和服务器之间的命令连接,默认端口21
4. **数据连接**: FTP客户端和服务器之间的数据传输连接
5. **主动模式(PORT模式)**: 服务器主动连接客户端
6. **被动模式(PASV模式)**: 客户端主动连接服务器,适合防火墙环境
7. **FTPS**: 基于SSL/TLS的FTP,提供加密传输
8. **SFTP**: 基于SSH的FTP,提供安全传输

### FTP适用场景

1. **文件传输**: 在服务器之间传输文件
2. **文件备份**: 定期备份文件到FTP服务器
3. **文件同步**: 同步本地和远程文件
4. **批量上传**: 批量上传文件到FTP服务器
5. **文件分发**: 从FTP服务器分发文件到多个客户端

## 项目搭建和依赖配置

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-ftp-demo/
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

这是最关键的,依赖配置不对后面全是坑;Spring Boot 4需要Java 17以上,而且Spring Integration FTP最新版本已经支持Spring Boot 4了。

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
    <artifactId>spring-boot-ftp-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 FTP Demo</name>
    <description>Spring Boot 4整合FTP示例项目</description>
    <properties>
        <java.version>17</java.version>  <!-- Java 17以上 -->
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <!-- Spring Integration版本 -->
        <spring-integration.version>6.4.0</spring-integration.version>
    </properties>
    <dependencies>
        <!-- Spring Boot Web Starter: 包含Spring MVC、Tomcat等 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!-- Spring Integration FTP: FTP集成支持 -->
        <dependency>
            <groupId>org.springframework.integration</groupId>
            <artifactId>spring-integration-ftp</artifactId>
            <version>${spring-integration.version}</version>
        </dependency>
        <!-- Apache Commons Net: FTP客户端库(Spring Integration依赖,但也可以直接使用) -->
        <dependency>
            <groupId>commons-net</groupId>
            <artifactId>commons-net</artifactId>
            <version>3.10.0</version>
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
    name: spring-boot-ftp-demo  # 应用名称
# FTP配置
ftp:
  host: localhost  # FTP服务器地址
  port: 21  # FTP端口,默认21
  username: ftpuser  # FTP用户名
  password: ftppass  # FTP密码
  # 可选配置
  passive-mode: true  # 是否使用被动模式,默认true
  binary-mode: true  # 是否使用二进制模式,默认true
  connect-timeout: 5000  # 连接超时时间(毫秒),默认5000
  data-timeout: 30000  # 数据传输超时时间(毫秒),默认30000
  buffer-size: 8192  # 缓冲区大小(字节),默认8192
  # 本地目录配置
  local-directory: ./ftp-local  # 本地目录
  # 远程目录配置
  remote-directory: /  # 远程目录,默认根目录
```

## FTP会话工厂配置

### 创建FTP会话工厂

创建FTP会话工厂,用于管理FTP连接:

```java
package com.example.demo.config;
import org.apache.commons.net.ftp.FTPFile;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.file.remote.session.CachingSessionFactory;
import org.springframework.integration.file.remote.session.SessionFactory;
import org.springframework.integration.ftp.session.DefaultFtpSessionFactory;
/**
 * FTP配置类
 * 用于配置FTP会话工厂
 */
@Configuration
public class FtpConfig {
    @Value("${ftp.host}")
    private String host;
    @Value("${ftp.port:21}")
    private int port;
    @Value("${ftp.username}")
    private String username;
    @Value("${ftp.password}")
    private String password;
    @Value("${ftp.passive-mode:true}")
    private boolean passiveMode;
    @Value("${ftp.binary-mode:true}")
    private boolean binaryMode;
    @Value("${ftp.connect-timeout:5000}")
    private int connectTimeout;
    @Value("${ftp.data-timeout:30000}")
    private int dataTimeout;
    /**
     * 创建FTP会话工厂Bean
     * 使用缓存会话工厂,提高性能
     */
    @Bean
    public SessionFactory<FTPFile> ftpSessionFactory() {
        DefaultFtpSessionFactory sessionFactory = new DefaultFtpSessionFactory();
        // 设置FTP服务器信息
        sessionFactory.setHost(host);  // FTP服务器地址
        sessionFactory.setPort(port);  // FTP端口
        sessionFactory.setUsername(username);  // FTP用户名
        sessionFactory.setPassword(password);  // FTP密码
        // 设置连接参数
        sessionFactory.setConnectTimeout(connectTimeout);  // 连接超时时间
        sessionFactory.setDataTimeout(dataTimeout);  // 数据传输超时时间
        // 设置传输模式
        if (passiveMode) {
            sessionFactory.setClientMode(org.springframework.integration.ftp.session.FtpSession.ClientMode.PASSIVE);
        } else {
            sessionFactory.setClientMode(org.springframework.integration.ftp.session.FtpSession.ClientMode.ACTIVE);
        }
        // 设置文件类型
        if (binaryMode) {
            sessionFactory.setFileType(org.springframework.integration.ftp.session.FtpSession.FileType.BINARY);
        } else {
            sessionFactory.setFileType(org.springframework.integration.ftp.session.FtpSession.FileType.ASCII);
        }
        // 测试会话
        sessionFactory.setTestSession(true);
        // 使用缓存会话工厂,提高性能
        return new CachingSessionFactory<>(sessionFactory);
    }
}
```

### 验证FTP连接

创建服务类,验证FTP连接:

```java
package com.example.demo.service;
import org.apache.commons.net.ftp.FTPFile;
import org.springframework.integration.file.remote.session.SessionFactory;
import org.springframework.integration.ftp.session.FtpSession;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
/**
 * FTP连接测试服务
 */
@Slf4j
@Service
public class FtpConnectionService {
    @Autowired
    private SessionFactory<FTPFile> ftpSessionFactory;
    /**
     * 测试FTP连接
     */
    public void testConnection() {
        FtpSession session = null;
        try {
            // 获取FTP会话
            session = (FtpSession) ftpSessionFactory.getSession();
            // 测试连接
            boolean connected = session.test();
            if (connected) {
                log.info("FTP连接成功");
                // 获取当前工作目录
                String currentDir = session.pwd();
                log.info("当前工作目录: {}", currentDir);
            } else {
                log.warn("FTP连接失败");
            }
        } catch (Exception e) {
            log.error("FTP连接测试失败: {}", e.getMessage(), e);
        } finally {
            // 关闭会话
            if (session != null) {
                try {
                    session.close();
                } catch (Exception e) {
                    log.error("关闭FTP会话失败: {}", e.getMessage(), e);
                }
            }
        }
    }
}
```

## 文件上传下载

### 文件上传服务

创建文件上传服务:

```java
package com.example.demo.service;
import org.apache.commons.net.ftp.FTPFile;
import org.springframework.integration.file.remote.session.SessionFactory;
import org.springframework.integration.ftp.session.FtpSession;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.InputStream;
import java.util.UUID;
/**
 * FTP文件上传服务
 */
@Slf4j
@Service
public class FtpUploadService {
    @Autowired
    private SessionFactory<FTPFile> ftpSessionFactory;
    @Value("${ftp.remote-directory:/}")
    private String remoteDirectory;
    /**
     * 上传文件
     * 
     * @param file 文件
     * @return 远程文件路径
     */
    public String uploadFile(MultipartFile file) throws Exception {
        // 生成唯一文件名
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String remoteFileName = UUID.randomUUID().toString() + extension;
        // 上传文件
        return uploadFile(file, remoteFileName);
    }
    /**
     * 上传文件到指定路径
     * 
     * @param file 文件
     * @param remoteFileName 远程文件名
     * @return 远程文件路径
     */
    public String uploadFile(MultipartFile file, String remoteFileName) throws Exception {
        FtpSession session = null;
        try {
            // 获取FTP会话
            session = (FtpSession) ftpSessionFactory.getSession();
            // 切换到远程目录
            if (!remoteDirectory.equals("/")) {
                session.mkdir(remoteDirectory);
                session.cd(remoteDirectory);
            }
            // 上传文件
            try (InputStream inputStream = file.getInputStream()) {
                session.write(inputStream, remoteFileName);
            }
            String remoteFilePath = remoteDirectory + "/" + remoteFileName;
            log.info("文件上传成功: {}", remoteFilePath);
            return remoteFilePath;
        } catch (Exception e) {
            log.error("文件上传失败: {}", e.getMessage(), e);
            throw new Exception("文件上传失败: " + e.getMessage(), e);
        } finally {
            // 关闭会话
            if (session != null) {
                try {
                    session.close();
                } catch (Exception e) {
                    log.error("关闭FTP会话失败: {}", e.getMessage(), e);
                }
            }
        }
    }
    /**
     * 上传文件流
     * 
     * @param inputStream 文件流
     * @param remoteFileName 远程文件名
     * @return 远程文件路径
     */
    public String uploadFile(InputStream inputStream, String remoteFileName) throws Exception {
        FtpSession session = null;
        try {
            // 获取FTP会话
            session = (FtpSession) ftpSessionFactory.getSession();
            // 切换到远程目录
            if (!remoteDirectory.equals("/")) {
                session.mkdir(remoteDirectory);
                session.cd(remoteDirectory);
            }
            // 上传文件
            session.write(inputStream, remoteFileName);
            String remoteFilePath = remoteDirectory + "/" + remoteFileName;
            log.info("文件上传成功: {}", remoteFilePath);
            return remoteFilePath;
        } catch (Exception e) {
            log.error("文件上传失败: {}", e.getMessage(), e);
            throw new Exception("文件上传失败: " + e.getMessage(), e);
        } finally {
            // 关闭会话
            if (session != null) {
                try {
                    session.close();
                } catch (Exception e) {
                    log.error("关闭FTP会话失败: {}", e.getMessage(), e);
                }
            }
        }
    }
}
```

### 文件下载服务

创建文件下载服务:

```java
package com.example.demo.service;
import org.apache.commons.net.ftp.FTPFile;
import org.springframework.integration.file.remote.session.SessionFactory;
import org.springframework.integration.ftp.session.FtpSession;
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
 * FTP文件下载服务
 */
@Slf4j
@Service
public class FtpDownloadService {
    @Autowired
    private SessionFactory<FTPFile> ftpSessionFactory;
    @Value("${ftp.remote-directory:/}")
    private String remoteDirectory;
    /**
     * 下载文件
     * 
     * @param remoteFileName 远程文件名
     * @return 文件输入流
     */
    public InputStream downloadFile(String remoteFileName) throws Exception {
        FtpSession session = null;
        try {
            // 获取FTP会话
            session = (FtpSession) ftpSessionFactory.getSession();
            // 切换到远程目录
            if (!remoteDirectory.equals("/")) {
                session.cd(remoteDirectory);
            }
            // 下载文件
            InputStream inputStream = session.readRaw(remoteFileName);
            log.info("文件下载成功: {}", remoteFileName);
            return inputStream;
        } catch (Exception e) {
            log.error("文件下载失败: {}", e.getMessage(), e);
            throw new Exception("文件下载失败: " + e.getMessage(), e);
        } finally {
            // 注意: 这里不能关闭会话,因为输入流还在使用
            // 会话会在输入流关闭时自动关闭
        }
    }
    /**
     * 下载文件并返回ResponseEntity
     * 
     * @param remoteFileName 远程文件名
     * @param originalFilename 原始文件名
     * @return ResponseEntity
     */
    public ResponseEntity<Resource> downloadFileAsResponse(String remoteFileName, String originalFilename) 
            throws Exception {
        try {
            // 下载文件
            InputStream inputStream = downloadFile(remoteFileName);
            // 创建Resource
            Resource resource = new InputStreamResource(inputStream);
            // 返回ResponseEntity
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + originalFilename + "\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(resource);
        } catch (Exception e) {
            log.error("文件下载失败: {}", e.getMessage(), e);
            throw new Exception("文件下载失败: " + e.getMessage(), e);
        }
    }
}
```

### 文件管理服务

创建文件管理服务,包含删除、列表等功能:

```java
package com.example.demo.service;
import org.apache.commons.net.ftp.FTPFile;
import org.springframework.integration.file.remote.session.SessionFactory;
import org.springframework.integration.ftp.session.FtpSession;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
/**
 * FTP文件管理服务
 */
@Slf4j
@Service
public class FtpFileService {
    @Autowired
    private SessionFactory<FTPFile> ftpSessionFactory;
    @Value("${ftp.remote-directory:/}")
    private String remoteDirectory;
    /**
     * 删除文件
     * 
     * @param remoteFileName 远程文件名
     * @return 是否删除成功
     */
    public boolean deleteFile(String remoteFileName) {
        FtpSession session = null;
        try {
            // 获取FTP会话
            session = (FtpSession) ftpSessionFactory.getSession();
            // 切换到远程目录
            if (!remoteDirectory.equals("/")) {
                session.cd(remoteDirectory);
            }
            // 删除文件
            boolean deleted = session.remove(remoteFileName);
            if (deleted) {
                log.info("文件删除成功: {}", remoteFileName);
            } else {
                log.warn("文件删除失败: {}", remoteFileName);
            }
            return deleted;
        } catch (Exception e) {
            log.error("文件删除失败: {}", e.getMessage(), e);
            return false;
        } finally {
            // 关闭会话
            if (session != null) {
                try {
                    session.close();
                } catch (Exception e) {
                    log.error("关闭FTP会话失败: {}", e.getMessage(), e);
                }
            }
        }
    }
    /**
     * 列出文件
     * 
     * @param path 路径,为空则列出当前目录
     * @return 文件列表
     */
    public List<String> listFiles(String path) {
        List<String> files = new ArrayList<>();
        FtpSession session = null;
        try {
            // 获取FTP会话
            session = (FtpSession) ftpSessionFactory.getSession();
            // 切换到指定目录
            String targetPath = path != null && !path.isEmpty() ? path : remoteDirectory;
            if (!targetPath.equals("/")) {
                session.cd(targetPath);
            }
            // 列出文件
            FTPFile[] ftpFiles = session.list("");
            for (FTPFile ftpFile : ftpFiles) {
                if (ftpFile.isFile()) {
                    files.add(ftpFile.getName());
                }
            }
        } catch (Exception e) {
            log.error("列出文件失败: {}", e.getMessage(), e);
        } finally {
            // 关闭会话
            if (session != null) {
                try {
                    session.close();
                } catch (Exception e) {
                    log.error("关闭FTP会话失败: {}", e.getMessage(), e);
                }
            }
        }
        return files;
    }
    /**
     * 检查文件是否存在
     * 
     * @param remoteFileName 远程文件名
     * @return 是否存在
     */
    public boolean fileExists(String remoteFileName) {
        FtpSession session = null;
        try {
            // 获取FTP会话
            session = (FtpSession) ftpSessionFactory.getSession();
            // 切换到远程目录
            if (!remoteDirectory.equals("/")) {
                session.cd(remoteDirectory);
            }
            // 列出文件
            FTPFile[] ftpFiles = session.list("");
            for (FTPFile ftpFile : ftpFiles) {
                if (ftpFile.isFile() && ftpFile.getName().equals(remoteFileName)) {
                    return true;
                }
            }
            return false;
        } catch (Exception e) {
            log.error("检查文件是否存在失败: {}", e.getMessage(), e);
            return false;
        } finally {
            // 关闭会话
            if (session != null) {
                try {
                    session.close();
                } catch (Exception e) {
                    log.error("关闭FTP会话失败: {}", e.getMessage(), e);
                }
            }
        }
    }
    /**
     * 创建目录
     * 
     * @param directoryName 目录名称
     * @return 是否创建成功
     */
    public boolean createDirectory(String directoryName) {
        FtpSession session = null;
        try {
            // 获取FTP会话
            session = (FtpSession) ftpSessionFactory.getSession();
            // 切换到远程目录
            if (!remoteDirectory.equals("/")) {
                session.cd(remoteDirectory);
            }
            // 创建目录
            session.mkdir(directoryName);
            log.info("目录创建成功: {}", directoryName);
            return true;
        } catch (Exception e) {
            log.error("目录创建失败: {}", e.getMessage(), e);
            return false;
        } finally {
            // 关闭会话
            if (session != null) {
                try {
                    session.close();
                } catch (Exception e) {
                    log.error("关闭FTP会话失败: {}", e.getMessage(), e);
                }
            }
        }
    }
    /**
     * 重命名文件
     * 
     * @param oldFileName 旧文件名
     * @param newFileName 新文件名
     * @return 是否重命名成功
     */
    public boolean renameFile(String oldFileName, String newFileName) {
        FtpSession session = null;
        try {
            // 获取FTP会话
            session = (FtpSession) ftpSessionFactory.getSession();
            // 切换到远程目录
            if (!remoteDirectory.equals("/")) {
                session.cd(remoteDirectory);
            }
            // 重命名文件
            session.rename(oldFileName, newFileName);
            log.info("文件重命名成功: {} -> {}", oldFileName, newFileName);
            return true;
        } catch (Exception e) {
            log.error("文件重命名失败: {}", e.getMessage(), e);
            return false;
        } finally {
            // 关闭会话
            if (session != null) {
                try {
                    session.close();
                } catch (Exception e) {
                    log.error("关闭FTP会话失败: {}", e.getMessage(), e);
                }
            }
        }
    }
}
```

## 控制器实现

### 文件上传控制器

创建文件上传控制器:

```java
package com.example.demo.controller;
import com.example.demo.service.FtpUploadService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.HashMap;
import java.util.Map;
/**
 * 文件上传控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/ftp")
public class FtpUploadController {
    @Autowired
    private FtpUploadService ftpUploadService;
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
            String remoteFilePath = ftpUploadService.uploadFile(file);
            result.put("success", true);
            result.put("message", "文件上传成功");
            result.put("remoteFilePath", remoteFilePath);
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
     * 上传文件到指定路径
     */
    @PostMapping("/upload/{remoteFileName}")
    public ResponseEntity<Map<String, Object>> uploadFileToPath(
            @RequestParam("file") MultipartFile file,
            @PathVariable String remoteFileName) {
        Map<String, Object> result = new HashMap<>();
        try {
            // 检查文件是否为空
            if (file.isEmpty()) {
                result.put("success", false);
                result.put("message", "文件不能为空");
                return ResponseEntity.badRequest().body(result);
            }
            // 上传文件
            String remoteFilePath = ftpUploadService.uploadFile(file, remoteFileName);
            result.put("success", true);
            result.put("message", "文件上传成功");
            result.put("remoteFilePath", remoteFilePath);
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
}
```

### 文件下载控制器

创建文件下载控制器:

```java
package com.example.demo.controller;
import com.example.demo.service.FtpDownloadService;
import com.example.demo.service.FtpFileService;
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
@RequestMapping("/api/ftp")
public class FtpDownloadController {
    @Autowired
    private FtpDownloadService ftpDownloadService;
    @Autowired
    private FtpFileService ftpFileService;
    /**
     * 下载文件
     */
    @GetMapping("/download/{remoteFileName}")
    public ResponseEntity<?> downloadFile(
            @PathVariable String remoteFileName,
            @RequestParam(required = false) String filename) {
        try {
            // 检查文件是否存在
            if (!ftpFileService.fileExists(remoteFileName)) {
                return ResponseEntity.notFound().build();
            }
            // 如果没有指定文件名,使用远程文件名
            if (filename == null || filename.isEmpty()) {
                filename = remoteFileName;
            }
            // 下载文件
            return ftpDownloadService.downloadFileAsResponse(remoteFileName, filename);
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
            @RequestParam(required = false) String path) {
        Map<String, Object> result = new HashMap<>();
        try {
            List<String> files = ftpFileService.listFiles(path);
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
     * 删除文件
     */
    @DeleteMapping("/{remoteFileName}")
    public ResponseEntity<Map<String, Object>> deleteFile(@PathVariable String remoteFileName) {
        Map<String, Object> result = new HashMap<>();
        try {
            boolean deleted = ftpFileService.deleteFile(remoteFileName);
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
    /**
     * 创建目录
     */
    @PostMapping("/mkdir/{directoryName}")
    public ResponseEntity<Map<String, Object>> createDirectory(@PathVariable String directoryName) {
        Map<String, Object> result = new HashMap<>();
        try {
            boolean created = ftpFileService.createDirectory(directoryName);
            if (created) {
                result.put("success", true);
                result.put("message", "目录创建成功");
                return ResponseEntity.ok(result);
            } else {
                result.put("success", false);
                result.put("message", "目录创建失败");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
            }
        } catch (Exception e) {
            log.error("目录创建失败: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("message", "目录创建失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
        }
    }
    /**
     * 重命名文件
     */
    @PutMapping("/rename")
    public ResponseEntity<Map<String, Object>> renameFile(
            @RequestParam String oldFileName,
            @RequestParam String newFileName) {
        Map<String, Object> result = new HashMap<>();
        try {
            boolean renamed = ftpFileService.renameFile(oldFileName, newFileName);
            if (renamed) {
                result.put("success", true);
                result.put("message", "文件重命名成功");
                return ResponseEntity.ok(result);
            } else {
                result.put("success", false);
                result.put("message", "文件重命名失败");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
            }
        } catch (Exception e) {
            log.error("文件重命名失败: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("message", "文件重命名失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
        }
    }
}
```

## Spring Integration FTP适配器

### FTP出站适配器

使用Spring Integration FTP出站适配器上传文件:

```java
package com.example.demo.config;
import org.apache.commons.net.ftp.FTPFile;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.channel.DirectChannel;
import org.springframework.integration.file.remote.session.SessionFactory;
import org.springframework.integration.ftp.outbound.FtpMessageHandler;
import org.springframework.integration.ftp.session.FtpSession;
import org.springframework.messaging.MessageHandler;
/**
 * FTP出站适配器配置
 */
@Configuration
public class FtpOutboundAdapterConfig {
    @Bean
    public DirectChannel ftpChannel() {
        return new DirectChannel();
    }
    @Bean
    @ServiceActivator(inputChannel = "ftpChannel")
    public MessageHandler ftpMessageHandler(SessionFactory<FTPFile> ftpSessionFactory) {
        FtpMessageHandler handler = new FtpMessageHandler(ftpSessionFactory);
        handler.setRemoteDirectoryExpressionString("headers['remote-target-dir']");
        handler.setFileNameGenerator(message -> {
            // 从消息头获取文件名
            String filename = (String) message.getHeaders().get("filename");
            return filename != null ? filename : "default.txt";
        });
        return handler;
    }
}
```

### FTP入站适配器

使用Spring Integration FTP入站适配器下载文件:

```java
package com.example.demo.config;
import org.apache.commons.net.ftp.FTPFile;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.annotation.InboundChannelAdapter;
import org.springframework.integration.annotation.Poller;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.core.MessageSource;
import org.springframework.integration.file.filters.AcceptOnceFileListFilter;
import org.springframework.integration.file.remote.session.SessionFactory;
import org.springframework.integration.ftp.filters.FtpSimplePatternFileListFilter;
import org.springframework.integration.ftp.inbound.FtpInboundFileSynchronizer;
import org.springframework.integration.ftp.inbound.FtpInboundFileSynchronizingMessageSource;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageHandler;
import org.springframework.messaging.MessagingException;
import java.io.File;
/**
 * FTP入站适配器配置
 */
@Configuration
public class FtpInboundAdapterConfig {
    @Value("${ftp.local-directory:./ftp-local}")
    private String localDirectory;
    @Value("${ftp.remote-directory:/}")
    private String remoteDirectory;
    @Bean
    public FtpInboundFileSynchronizer ftpInboundFileSynchronizer(SessionFactory<FTPFile> ftpSessionFactory) {
        FtpInboundFileSynchronizer fileSynchronizer = new FtpInboundFileSynchronizer(ftpSessionFactory);
        fileSynchronizer.setDeleteRemoteFiles(false);  // 不删除远程文件
        fileSynchronizer.setRemoteDirectory(remoteDirectory);  // 远程目录
        fileSynchronizer.setFilter(new FtpSimplePatternFileListFilter("*.txt"));  // 只同步.txt文件
        return fileSynchronizer;
    }
    @Bean
    @InboundChannelAdapter(channel = "ftpInboundChannel", poller = @Poller(fixedDelay = "5000"))
    public MessageSource<File> ftpMessageSource(FtpInboundFileSynchronizer ftpInboundFileSynchronizer) {
        FtpInboundFileSynchronizingMessageSource source = 
                new FtpInboundFileSynchronizingMessageSource(ftpInboundFileSynchronizer);
        source.setLocalDirectory(new File(localDirectory));  // 本地目录
        source.setAutoCreateLocalDirectory(true);  // 自动创建本地目录
        source.setLocalFilter(new AcceptOnceFileListFilter<>());  // 只处理一次
        source.setMaxFetchSize(1);  // 每次最多获取1个文件
        return source;
    }
    @Bean
    @ServiceActivator(inputChannel = "ftpInboundChannel")
    public MessageHandler ftpMessageHandler() {
        return new MessageHandler() {
            @Override
            public void handleMessage(Message<?> message) throws MessagingException {
                File file = (File) message.getPayload();
                System.out.println("收到FTP文件: " + file.getName());
                // 处理文件
            }
        };
    }
}
```

## FTPS支持

### 配置FTPS会话工厂

支持FTPS(基于SSL/TLS的FTP):

```java
package com.example.demo.config;
import org.apache.commons.net.ftp.FTPFile;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.file.remote.session.CachingSessionFactory;
import org.springframework.integration.file.remote.session.SessionFactory;
import org.springframework.integration.ftp.session.DefaultFtpsSessionFactory;
/**
 * FTPS配置类
 * 用于配置FTPS会话工厂
 */
@Configuration
public class FtpsConfig {
    @Value("${ftp.host}")
    private String host;
    @Value("${ftp.port:21}")
    private int port;
    @Value("${ftp.username}")
    private String username;
    @Value("${ftp.password}")
    private String password;
    @Value("${ftp.ftps.implicit:false}")
    private boolean implicit;
    @Value("${ftp.ftps.protocol:TLS}")
    private String protocol;
    /**
     * 创建FTPS会话工厂Bean
     */
    @Bean
    public SessionFactory<FTPFile> ftpsSessionFactory() {
        DefaultFtpsSessionFactory sessionFactory = new DefaultFtpsSessionFactory();
        // 设置FTP服务器信息
        sessionFactory.setHost(host);
        sessionFactory.setPort(port);
        sessionFactory.setUsername(username);
        sessionFactory.setPassword(password);
        // 设置FTPS参数
        sessionFactory.setImplicit(implicit);  // 是否使用隐式SSL
        sessionFactory.setProtocol(protocol);  // SSL/TLS协议
        // 设置客户端模式
        sessionFactory.setClientMode(org.springframework.integration.ftp.session.FtpSession.ClientMode.PASSIVE);
        // 设置文件类型
        sessionFactory.setFileType(org.springframework.integration.ftp.session.FtpSession.FileType.BINARY);
        // 测试会话
        sessionFactory.setTestSession(true);
        // 使用缓存会话工厂
        return new CachingSessionFactory<>(sessionFactory);
    }
}
```

## 最佳实践

1. **连接管理**: 使用CachingSessionFactory管理FTP连接,提高性能
2. **被动模式**: 生产环境建议使用被动模式,适合防火墙环境
3. **二进制模式**: 文件传输使用二进制模式,避免数据损坏
4. **错误处理**: 妥善处理FTP异常,提供友好的错误信息
5. **超时设置**: 合理设置连接超时和数据传输超时
6. **文件过滤**: 使用文件过滤器,只处理需要的文件
7. **目录管理**: 合理组织远程目录结构,方便管理
8. **日志记录**: 记录FTP操作日志,方便问题排查
9. **资源释放**: 确保FTP会话正确关闭,避免资源泄漏
10. **安全传输**: 生产环境建议使用FTPS或SFTP,提高安全性

## 常见问题

### 1. FTP连接失败

检查FTP服务器地址、端口、用户名、密码是否正确:

```yaml
ftp:
  host: localhost  # 确保地址正确
  port: 21
  username: ftpuser
  password: ftppass
```

### 2. 被动模式问题

如果连接失败,尝试切换被动模式:

```yaml
ftp:
  passive-mode: true  # 使用被动模式
```

### 3. 文件上传失败

检查远程目录权限,确保有写入权限。

### 4. 文件下载失败

检查远程文件是否存在,路径是否正确。

### 5. 连接超时

增加连接超时时间:

```yaml
ftp:
  connect-timeout: 10000  # 增加到10秒
  data-timeout: 60000  # 增加到60秒
```

### 6. 防火墙问题

使用被动模式,或者配置防火墙允许FTP数据连接。

### 7. 编码问题

确保FTP服务器和客户端使用相同的字符编码。

### 8. 大文件传输

对于大文件,考虑使用断点续传或分片传输。

### 9. 并发连接

FTP服务器可能有并发连接数限制,注意控制并发数。

### 10. 资源泄漏

确保FTP会话正确关闭,使用try-finally或try-with-resources。

## FTP出站网关

### 配置FTP出站网关

FTP出站网关支持多种FTP命令操作:

```java
package com.example.demo.config;
import org.apache.commons.net.ftp.FTPFile;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.file.remote.session.SessionFactory;
import org.springframework.integration.ftp.gateway.FtpOutboundGateway;
import org.springframework.messaging.MessageHandler;
/**
 * FTP出站网关配置
 */
@Configuration
public class FtpOutboundGatewayConfig {
    /**
     * 配置FTP出站网关
     * 支持ls、get、mget、put、mput、rm、mv等命令
     */
    @Bean
    @ServiceActivator(inputChannel = "ftpGatewayChannel")
    public MessageHandler ftpOutboundGateway(SessionFactory<FTPFile> ftpSessionFactory) {
        // 创建FTP出站网关,使用ls命令列出文件
        FtpOutboundGateway gateway = new FtpOutboundGateway(ftpSessionFactory, "ls", "'/remote/path'");
        // 设置输出通道
        gateway.setOutputChannelName("ftpGatewayOutputChannel");
        // 设置选项
        gateway.setOptions("-1");  // 只返回文件名列表
        return gateway;
    }
    /**
     * 配置FTP出站网关用于下载文件
     */
    @Bean
    @ServiceActivator(inputChannel = "ftpGetChannel")
    public MessageHandler ftpGetGateway(SessionFactory<FTPFile> ftpSessionFactory) {
        // 创建FTP出站网关,使用get命令下载文件
        FtpOutboundGateway gateway = new FtpOutboundGateway(ftpSessionFactory, "get", "payload");
        // 设置输出通道
        gateway.setOutputChannelName("ftpGetOutputChannel");
        // 设置本地目录
        gateway.setLocalDirectoryExpressionString("'./ftp-download'");
        return gateway;
    }
    /**
     * 配置FTP出站网关用于批量下载文件
     */
    @Bean
    @ServiceActivator(inputChannel = "ftpMGetChannel")
    public MessageHandler ftpMGetGateway(SessionFactory<FTPFile> ftpSessionFactory) {
        // 创建FTP出站网关,使用mget命令批量下载文件
        FtpOutboundGateway gateway = new FtpOutboundGateway(
                ftpSessionFactory, 
                "mget", 
                "payload"
        );
        // 设置输出通道
        gateway.setOutputChannelName("ftpMGetOutputChannel");
        // 设置选项
        gateway.setOptions("-R");  // 递归下载
        gateway.setOptions("-P");  // 保留时间戳
        // 设置本地目录
        gateway.setLocalDirectoryExpressionString("'./ftp-download'");
        // 设置文件名过滤器
        gateway.setFilter(new org.springframework.integration.ftp.filters.FtpSimplePatternFileListFilter("*.txt"));
        return gateway;
    }
}
```

## FTP流式入站适配器

### 配置流式入站适配器

对于大文件,可以使用流式入站适配器:

```java
package com.example.demo.config;
import org.apache.commons.net.ftp.FTPFile;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.annotation.InboundChannelAdapter;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.core.MessageSource;
import org.springframework.integration.file.filters.AcceptAllFileListFilter;
import org.springframework.integration.file.remote.session.SessionFactory;
import org.springframework.integration.ftp.inbound.FtpStreamingMessageSource;
import org.springframework.integration.ftp.session.FtpRemoteFileTemplate;
import org.springframework.messaging.MessageHandler;
import java.io.InputStream;
/**
 * FTP流式入站适配器配置
 */
@Configuration
public class FtpStreamingInboundAdapterConfig {
    /**
     * 创建FTP远程文件模板
     */
    @Bean
    public FtpRemoteFileTemplate ftpRemoteFileTemplate(SessionFactory<FTPFile> ftpSessionFactory) {
        return new FtpRemoteFileTemplate(ftpSessionFactory);
    }
    /**
     * 配置FTP流式消息源
     */
    @Bean
    @InboundChannelAdapter(channel = "ftpStreamChannel")
    public MessageSource<InputStream> ftpStreamingMessageSource(FtpRemoteFileTemplate ftpRemoteFileTemplate) {
        FtpStreamingMessageSource messageSource = new FtpStreamingMessageSource(ftpRemoteFileTemplate);
        // 设置远程目录
        messageSource.setRemoteDirectory("/remote/path");
        // 设置文件过滤器
        messageSource.setFilter(new AcceptAllFileListFilter<>());
        // 设置最大获取数量
        messageSource.setMaxFetchSize(1);
        return messageSource;
    }
    /**
     * 处理流式消息
     */
    @Bean
    @ServiceActivator(inputChannel = "ftpStreamChannel")
    public MessageHandler ftpStreamHandler() {
        return message -> {
            InputStream inputStream = (InputStream) message.getPayload();
            // 处理输入流
            System.out.println("收到FTP流式文件");
            // 处理完成后关闭流
            try {
                inputStream.close();
            } catch (Exception e) {
                e.printStackTrace();
            }
        };
    }
}
```

## 文件过滤器

### 配置文件过滤器

使用文件过滤器只处理需要的文件:

```java
package com.example.demo.config;
import org.apache.commons.net.ftp.FTPFile;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.file.filters.FileListFilter;
import org.springframework.integration.ftp.filters.FtpRegexPatternFileListFilter;
import org.springframework.integration.ftp.filters.FtpSimplePatternFileListFilter;
/**
 * FTP文件过滤器配置
 */
@Configuration
public class FtpFileFilterConfig {
    /**
     * 简单模式文件过滤器
     * 只匹配.txt文件
     */
    @Bean
    public FileListFilter<FTPFile> txtFileFilter() {
        return new FtpSimplePatternFileListFilter("*.txt");
    }
    /**
     * 正则表达式文件过滤器
     * 匹配所有.txt和.xml文件
     */
    @Bean
    public FileListFilter<FTPFile> regexFileFilter() {
        return new FtpRegexPatternFileListFilter(".*\\.(txt|xml)$");
    }
    /**
     * 组合文件过滤器
     * 只匹配.txt文件,且文件大小大于1KB
     */
    @Bean
    public FileListFilter<FTPFile> compositeFileFilter() {
        FtpSimplePatternFileListFilter patternFilter = new FtpSimplePatternFileListFilter("*.txt");
        // 组合过滤器: 模式匹配且文件大小大于1KB
        return new org.springframework.integration.file.filters.CompositeFileListFilter<>(
                java.util.Arrays.asList(
                        patternFilter,
                        new org.springframework.integration.file.filters.FileSizeFilter(1024, Long.MAX_VALUE)
                )
        );
    }
}
```

## 断点续传

### 实现断点续传

对于大文件,支持断点续传:

```java
package com.example.demo.service;
import org.apache.commons.net.ftp.FTPClient;
import org.apache.commons.net.ftp.FTPFile;
import org.springframework.integration.file.remote.session.SessionFactory;
import org.springframework.integration.ftp.session.FtpSession;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.io.InputStream;
import java.io.RandomAccessFile;
/**
 * FTP断点续传服务
 */
@Slf4j
@Service
public class FtpResumeService {
    @Autowired
    private SessionFactory<FTPFile> ftpSessionFactory;
    /**
     * 断点续传下载文件
     * 
     * @param remoteFileName 远程文件名
     * @param localFilePath 本地文件路径
     * @return 是否下载成功
     */
    public boolean downloadWithResume(String remoteFileName, String localFilePath) throws Exception {
        FtpSession session = null;
        RandomAccessFile localFile = null;
        try {
            // 获取FTP会话
            session = (FtpSession) ftpSessionFactory.getSession();
            // 获取FTP客户端
            FTPClient ftpClient = session.getClientInstance();
            // 检查本地文件是否存在
            long localFileSize = 0;
            java.io.File localFileObj = new java.io.File(localFilePath);
            if (localFileObj.exists()) {
                localFileSize = localFileObj.length();
                log.info("本地文件已存在,大小: {} 字节", localFileSize);
            }
            // 获取远程文件信息
            FTPFile[] remoteFiles = ftpClient.listFiles(remoteFileName);
            if (remoteFiles.length == 0) {
                log.error("远程文件不存在: {}", remoteFileName);
                return false;
            }
            FTPFile remoteFile = remoteFiles[0];
            long remoteFileSize = remoteFile.getSize();
            // 如果本地文件大小等于远程文件大小,说明已经下载完成
            if (localFileSize == remoteFileSize) {
                log.info("文件已下载完成: {}", remoteFileName);
                return true;
            }
            // 打开本地文件,支持追加写入
            localFile = new RandomAccessFile(localFilePath, "rw");
            localFile.seek(localFileSize);
            // 设置FTP客户端支持断点续传
            ftpClient.setRestartOffset(localFileSize);
            // 下载文件
            try (InputStream inputStream = ftpClient.retrieveFileStream(remoteFileName)) {
                if (inputStream == null) {
                    log.error("无法获取文件流: {}", remoteFileName);
                    return false;
                }
                byte[] buffer = new byte[8192];
                int bytesRead;
                long totalBytesRead = 0;
                while ((bytesRead = inputStream.read(buffer)) != -1) {
                    localFile.write(buffer, 0, bytesRead);
                    totalBytesRead += bytesRead;
                }
                log.info("断点续传下载完成: {}, 已下载: {} 字节", remoteFileName, totalBytesRead);
            }
            // 完成文件传输
            boolean completed = ftpClient.completePendingCommand();
            if (!completed) {
                log.error("文件传输未完成: {}", remoteFileName);
                return false;
            }
            return true;
        } catch (Exception e) {
            log.error("断点续传下载失败: {}", e.getMessage(), e);
            throw new Exception("断点续传下载失败: " + e.getMessage(), e);
        } finally {
            // 关闭本地文件
            if (localFile != null) {
                try {
                    localFile.close();
                } catch (Exception e) {
                    log.error("关闭本地文件失败: {}", e.getMessage(), e);
                }
            }
            // 关闭FTP会话
            if (session != null) {
                try {
                    session.close();
                } catch (Exception e) {
                    log.error("关闭FTP会话失败: {}", e.getMessage(), e);
                }
            }
        }
    }
}
```

## 实际应用场景

### 定时同步FTP文件

实现定时从FTP服务器同步文件:

```java
package com.example.demo.service;
import org.apache.commons.net.ftp.FTPFile;
import org.springframework.integration.file.remote.session.SessionFactory;
import org.springframework.integration.ftp.session.FtpSession;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
/**
 * FTP定时同步服务
 */
@Slf4j
@Service
public class FtpSyncService {
    @Autowired
    private SessionFactory<FTPFile> ftpSessionFactory;
    @Value("${ftp.remote-directory:/}")
    private String remoteDirectory;
    @Value("${ftp.local-directory:./ftp-local}")
    private String localDirectory;
    /**
     * 定时同步FTP文件
     * 每5分钟执行一次
     */
    @Scheduled(fixedDelay = 300000)  // 5分钟
    public void syncFiles() {
        log.info("开始同步FTP文件...");
        FtpSession session = null;
        try {
            // 获取FTP会话
            session = (FtpSession) ftpSessionFactory.getSession();
            // 切换到远程目录
            if (!remoteDirectory.equals("/")) {
                session.cd(remoteDirectory);
            }
            // 列出远程文件
            FTPFile[] remoteFiles = session.list("");
            // 确保本地目录存在
            File localDir = new File(localDirectory);
            if (!localDir.exists()) {
                localDir.mkdirs();
            }
            // 同步文件
            for (FTPFile remoteFile : remoteFiles) {
                if (remoteFile.isFile()) {
                    String fileName = remoteFile.getName();
                    File localFile = new File(localDir, fileName);
                    // 如果本地文件不存在或远程文件更新,则下载
                    if (!localFile.exists() || 
                        localFile.lastModified() < remoteFile.getTimestamp().getTimeInMillis()) {
                        log.info("同步文件: {}", fileName);
                        try (InputStream inputStream = session.readRaw(fileName);
                             FileOutputStream outputStream = new FileOutputStream(localFile)) {
                            byte[] buffer = new byte[8192];
                            int bytesRead;
                            while ((bytesRead = inputStream.read(buffer)) != -1) {
                                outputStream.write(buffer, 0, bytesRead);
                            }
                            // 设置本地文件时间戳
                            localFile.setLastModified(remoteFile.getTimestamp().getTimeInMillis());
                            log.info("文件同步成功: {}", fileName);
                        }
                    }
                }
            }
            log.info("FTP文件同步完成");
        } catch (Exception e) {
            log.error("FTP文件同步失败: {}", e.getMessage(), e);
        } finally {
            // 关闭FTP会话
            if (session != null) {
                try {
                    session.close();
                } catch (Exception e) {
                    log.error("关闭FTP会话失败: {}", e.getMessage(), e);
                }
            }
        }
    }
}
```

### 批量上传文件

实现批量上传文件到FTP服务器:

```java
package com.example.demo.service;
import org.apache.commons.net.ftp.FTPFile;
import org.springframework.integration.file.remote.session.SessionFactory;
import org.springframework.integration.ftp.session.FtpSession;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.io.File;
import java.io.FileInputStream;
import java.util.List;
/**
 * FTP批量上传服务
 */
@Slf4j
@Service
public class FtpBatchUploadService {
    @Autowired
    private SessionFactory<FTPFile> ftpSessionFactory;
    @Value("${ftp.remote-directory:/}")
    private String remoteDirectory;
    /**
     * 批量上传文件
     * 
     * @param localFiles 本地文件列表
     * @return 上传成功的文件数量
     */
    public int batchUploadFiles(List<File> localFiles) {
        int successCount = 0;
        FtpSession session = null;
        try {
            // 获取FTP会话
            session = (FtpSession) ftpSessionFactory.getSession();
            // 切换到远程目录
            if (!remoteDirectory.equals("/")) {
                session.mkdir(remoteDirectory);
                session.cd(remoteDirectory);
            }
            // 批量上传文件
            for (File localFile : localFiles) {
                try {
                    if (localFile.exists() && localFile.isFile()) {
                        String remoteFileName = localFile.getName();
                        try (FileInputStream inputStream = new FileInputStream(localFile)) {
                            session.write(inputStream, remoteFileName);
                            successCount++;
                            log.info("文件上传成功: {}", remoteFileName);
                        }
                    }
                } catch (Exception e) {
                    log.error("文件上传失败: {}, 错误: {}", localFile.getName(), e.getMessage(), e);
                }
            }
            log.info("批量上传完成: 成功{}个,失败{}个", successCount, localFiles.size() - successCount);
        } catch (Exception e) {
            log.error("批量上传失败: {}", e.getMessage(), e);
        } finally {
            // 关闭FTP会话
            if (session != null) {
                try {
                    session.close();
                } catch (Exception e) {
                    log.error("关闭FTP会话失败: {}", e.getMessage(), e);
                }
            }
        }
        return successCount;
    }
}
```

## 性能优化

### 连接池配置

优化FTP连接池配置:

```java
@Bean
public SessionFactory<FTPFile> ftpSessionFactory() {
    DefaultFtpSessionFactory sessionFactory = new DefaultFtpSessionFactory();
    // ... 其他配置 ...
    // 使用缓存会话工厂,设置缓存大小
    CachingSessionFactory<FTPFile> cachingSessionFactory = new CachingSessionFactory<>(sessionFactory);
    cachingSessionFactory.setSessionCacheSize(10);  // 缓存10个会话
    cachingSessionFactory.setSessionWaitTimeout(1000);  // 等待会话超时时间(毫秒)
    return cachingSessionFactory;
}
```

### 异步上传

对于大文件,可以使用异步上传:

```java
package com.example.demo.service;
import org.apache.commons.net.ftp.FTPFile;
import org.springframework.integration.file.remote.session.SessionFactory;
import org.springframework.integration.ftp.session.FtpSession;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.util.concurrent.CompletableFuture;
/**
 * 异步FTP上传服务
 */
@Slf4j
@Service
public class AsyncFtpUploadService {
    @Autowired
    private SessionFactory<FTPFile> ftpSessionFactory;
    /**
     * 异步上传文件
     * 
     * @param file 文件
     * @param remoteFileName 远程文件名
     * @return CompletableFuture
     */
    @Async
    public CompletableFuture<String> uploadFileAsync(MultipartFile file, String remoteFileName) {
        return CompletableFuture.supplyAsync(() -> {
            FtpSession session = null;
            try {
                session = (FtpSession) ftpSessionFactory.getSession();
                session.write(file.getInputStream(), remoteFileName);
                log.info("异步文件上传成功: {}", remoteFileName);
                return remoteFileName;
            } catch (Exception e) {
                log.error("异步文件上传失败: {}", e.getMessage(), e);
                throw new RuntimeException("文件上传失败", e);
            } finally {
                if (session != null) {
                    try {
                        session.close();
                    } catch (Exception e) {
                        log.error("关闭FTP会话失败: {}", e.getMessage(), e);
                    }
                }
            }
        });
    }
}
```

## 监控和日志

### 集成Actuator监控

可以集成Spring Boot Actuator监控FTP连接状态:

```java
package com.example.demo.actuator;
import org.apache.commons.net.ftp.FTPFile;
import org.springframework.integration.file.remote.session.SessionFactory;
import org.springframework.integration.ftp.session.FtpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;
/**
 * FTP健康检查
 */
@Component
public class FtpHealthIndicator implements HealthIndicator {
    @Autowired
    private SessionFactory<FTPFile> ftpSessionFactory;
    @Override
    public Health health() {
        FtpSession session = null;
        try {
            // 尝试获取FTP会话,检查连接
            session = (FtpSession) ftpSessionFactory.getSession();
            boolean connected = session.test();
            if (connected) {
                String currentDir = session.pwd();
                return Health.up()
                        .withDetail("status", "FTP连接正常")
                        .withDetail("currentDirectory", currentDir)
                        .build();
            } else {
                return Health.down()
                        .withDetail("status", "FTP连接失败")
                        .build();
            }
        } catch (Exception e) {
            return Health.down()
                    .withDetail("status", "FTP连接失败")
                    .withDetail("error", e.getMessage())
                    .build();
        } finally {
            if (session != null) {
                try {
                    session.close();
                } catch (Exception e) {
                    // 忽略关闭异常
                }
            }
        }
    }
}
```

## 总结

Spring Boot 4整合FTP非常方便,只需要添加`spring-integration-ftp`依赖就能用;FTP是一个标准的文件传输协议,支持大文件传输、断点续传、目录操作;支持文件上传下载、目录管理、文件过滤、FTP出站网关、流式入站适配器、断点续传等高级功能;兄弟们根据实际需求选择合适的配置,就能轻松搞定文件传输了;但是要注意合理配置连接参数,使用被动模式适合防火墙环境;同时要注意错误处理和资源管理,确保FTP会话正确关闭;还要注意安全传输,生产环境建议使用FTPS或SFTP,提高安全性;最后要注意性能优化,使用连接池和缓存会话工厂,提高系统性能;对于大文件传输,可以使用断点续传和异步上传,提高传输效率。
