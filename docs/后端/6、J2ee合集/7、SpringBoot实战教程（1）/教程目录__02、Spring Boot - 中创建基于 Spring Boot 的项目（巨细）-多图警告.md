# 02、Spring Boot - 中创建基于 Spring Boot 的项目（巨细）-多图警告
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/4/2.html
- 分类：J2EE框架
- 分组：教程目录
## 1.通过官网创建项目

[Spring Boot 官方网站](https://spring.io/projects/spring-boot)

在进入官网的最下方有

点击进入

会有个压缩包让你下载

打开IDEA

先解压文件，再找到文件位置

选择Maven

确认信息

确认第二弹

选择JDK目录

确认项目名

最终结果

## 2.通过 IDEA 的脚手架工具创建

创建项目

选择JDK版本

确认项目信息

选择为web项目

确认项目信息与位置

最终结果

## 3.通过 IDEA 的 Maven 项目创建

创建项目

确认JDK版本

确认项目坐标

确认项目名以及位置

修改pom.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.dqcgm</groupId>
    <artifactId>springboot3</artifactId>
    <version>1.0-SNAPSHOT</version>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.3.1.RELEASE</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
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

最终结果
