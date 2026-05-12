# 16、RabbitMQ 实战 - 用SpringBoot整合RabbitMQ
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/2/16.html
- 分类：消息队列
- 分组：教程目录
**1、** 新建项目；

**2、** 新建Spring项目![ ][nbsp1]；

**3、** 选择合适的SpringBoot版本，依赖在这里可以先不选，可以在项目生成后在pom.xml文件里批量的导入依赖；

**4、** 设置项目的Maven；

(1)打开设置

(2)在搜索框里输入Maven搜索Maven设置，然后根据自己的实际情况设置Maven的路径、配置文件和仓库

**5、** 打开项目的pom.xml文件，导入与RabbitMQ相关的依赖；

pom.xml的内容如下

```java
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.7.6</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
    <groupId>com.ken</groupId>
    <artifactId>springboot-rqbbitmq</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>springboot-rqbbitmq</name>
    <description>springboot-rqbbitmq</description>
    <properties>
        <java.version>1.8</java.version>
    </properties>
    <dependencies>
        <!--RabbitMQ 依赖-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-amqp</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>com.alibaba</groupId>
            <artifactId>fastjson</artifactId>
            <version>1.2.47</version>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
        </dependency>
        <!--swagger-->
        <dependency>
            <groupId>io.springfox</groupId>
            <artifactId>springfox-swagger2</artifactId>
            <version>2.9.2</version>
        </dependency>
        <dependency>
            <groupId>io.springfox</groupId>
            <artifactId>springfox-swagger-ui</artifactId>
            <version>2.9.2</version>
        </dependency>
        <!--RabbitMQ 测试依赖-->
        <dependency>
            <groupId>org.springframework.amqp</groupId>
            <artifactId>spring-rabbit-test</artifactId>
            <scope>test</scope>
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

**6、** 右击项目，然后找到Maven，点击重新加载项目从而从远程仓库下载依赖包（注：网络不好或Maven的setting.xml配置文件没配置好可能会导致依赖下载失败）；

**7、** 进入项目的配置文件，对RabbitMQ等参数进行配置；

application.properties的内容如下（注：这些配置仅供参考，实际情况视自己而定）

```java
spring.rabbitmq.host=192.168.194.150
spring.rabbitmq.port=5672
spring.rabbitmq.username=admin
spring.rabbitmq.password=123456
```
