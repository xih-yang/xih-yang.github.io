# 14、SpringBoot 源码分析 - 自定义starter
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/14.html
- 分类：J2EE框架
- 分组：教程目录
## 自定义starter

### pom.xml

创建一个新的`springboot`工程pom文件如下：

```java
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.2.6.RELEASE</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
    <groupId>com.ww</groupId>
    <artifactId>myfirst-spring-boot-starter</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <description>Demo project for Spring Boot</description>
    <properties>
        <java.version>1.8</java.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-configuration-processor</artifactId>
            <optional>true</optional>
        </dependency>
    </dependencies>
</project>
```

### ControllerProperties属性类

`ConfigurationProperties`注解可以在配置文件中配置了，前缀就是`mycp`。

```java
@ConfigurationProperties(prefix = "mycp")
public class ControllerProperties {
    @Value("hello")
    private String msg;
    public String getMsg() {
        return msg;
    }
    public void setMsg(String msg) {
        this.msg = msg;
    }
}
```

### StarterAutoConfiguration自动装配类

```java
@Configuration
@EnableConfigurationProperties(ControllerProperties.class)
public class StarterAutoConfiguration {
    @Bean
    public StarterController starterController(ControllerProperties controllerProperties) {
        return new StarterController(controllerProperties.getMsg());
    }
}
```

### StarterController控制器，测试用

```java
public class StarterController {
    private String msg;
    public StarterController(String msg){
        this.msg=msg;
    }
    public void hello() {
        System.out.println(msg);
    }
}
```

### 添加spring.factories

内容为自动装配类全限定名。

```java
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
com.ww.starter.StarterAutoConfiguration
```

## 安装到本地仓库

可以用`maven`的`install`。

## 测试

在其他项目中引入：

```java
 <dependency>
            <groupId>com.ww</groupId>
            <artifactId>myfirst-spring-boot-starter</artifactId>
            <version>0.0.1-SNAPSHOT</version>
 </dependency>
```

运行：

输出了默认值：

我们在配置文件修改试试：

至此我们自定义了一个starter，其实步骤也很简单，定义自动配置类，创建`spring.factories`并配置进去，创建属性配置类，添加相应的注解，打包发布，其他项目可以引用。

当然这个是最简单的实践，实际项目和业务肯定还要复杂，懂原理了就不是什么难题了。

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
