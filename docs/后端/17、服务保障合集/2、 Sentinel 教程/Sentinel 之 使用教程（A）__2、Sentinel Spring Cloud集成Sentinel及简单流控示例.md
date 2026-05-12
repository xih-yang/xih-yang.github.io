# 2、Sentinel Spring Cloud集成Sentinel及简单流控示例
- 来源：https://ddkk.com/zhuanlan/guarantee/sentinel/2.html
- 分类：服务保障
- 分组：Sentinel 之 使用教程（A）
## 集成

### 1、 创建一个父工程引入相关boot，cloud，alibaba依赖；

```xml
<properties>
    <java.version>1.8</java.version>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
    <!--Spring-->
    <spring.boot.version>2.3.4.RELEASE</spring.boot.version>
    <spring.cloud.version>Hoxton.SR8</spring.cloud.version>
    <spring.platform.version>Cairo-SR8</spring.platform.version>
    <spring.cloud.alibaba.version>2.2.2.RELEASE</spring.cloud.alibaba.version>
</properties>
    <dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-alibaba-dependencies</artifactId>
            <version>${spring.cloud.alibaba.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>${spring.boot.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-dependencies</artifactId>
            <version>${spring.cloud.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

### 2、 子项目添加pom；

```xml
<dependencies>
    <!--启动依赖-->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <!--test包-->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
    <!--sentinel-->
    <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-starter-alibaba-sentinel</artifactId>
    </dependency>
</dependencies>
```

### 3、 创建一个测试类；

### 4、 YML加入sentinel配置；

```sh
server:
  port: 10000
spring:
  application:
    name: pearl-test-sentinel
  cloud:
    sentinel:
      transport:
        port: 8719
        dashboard: localhost:8080
```

### 5、 启动项目，并访问测试接口，之后查看控制台；

## 简单流控规则示例

### 1、 找到测试接口；

### 2、 添加控制规则，此规则表示当前QPS限制为1

![ ][nbsp3]；

### 3、 快速刷新当前页面，发现已被限流；
