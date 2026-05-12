# 10、Spring Boot 3.x 特性-Profiles&amp;多环境配置
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/9/10.html
- 分类：Spring Boot 3.x 实战
- 分组：教程目录
Spring Profiles 提供一种方法来隔离应用程序配置的各个部分，并使其仅在某些环境中可用。

并且和`application`属性文件一样,Spring Boot也会尝试使用命名约定`application-{profile}`来加载特定配置文件的文件。

例如，如果你的应用程序激活一个名为`prod`的配置文件并使用`YAML`文件，那么`application.yml`和`application-prod.yml`文件将会被加载。

## 一、Profiles激活

### 1.注解激活

任何`@Component`， `@Configuration`或`@ConfigurationProperties`都可以用`@Profile`标记来限制加载。

```java
@Configuration(proxyBeanMethods = false)
@Profile("production")
public class ProductionConfiguration {
    // ...
}
```

如果`@ConfigurationProperties` bean是通过`@ Enableconconfigurationproperties`而不是自动扫描注册的，则需要在具有`@Enableconconfigurationproperties`注解的`@Configuration`类上指定`@Profile`注释。在扫描`@ConfigurationProperties`的情况下，`@Profile`可以在`@ConfigurationProperties`类本身上指定。

### 2.配置属性激活

除了注解激活配置属性,你可以在`application.properties`中使用`spring.profiles.active`配置环境属性激活`profiles`,

```java
spring:
  profiles:
    active: "dev,hsqldb"
```

你也可以在命令行中指定它，使用下面的开关:`--spring.profiles.active=dev,hsqldb`

`spring.profiles.active`和`spring.profiles.default`只能在`non-profile` 文档中使用。这意味着它们不能包含在`spring.config.activate.on-profile`激活的配置文件或`profile`文件中使用。

例如:可以在`application.properties`中使用`spring.profiles.active`属性,但是在`application-dev.properties`中不可以使用,启动时程序会报如下错误:

```java
Property 'spring.profiles.active' imported from location 'class path resource [application-dev.properties]' is invalid in a profile specific resource [origin: class path resource [application-dev.properties] 
```

考虑如下`on-profile`文件:

```java
# 这个文档有效
spring:
  profiles:
    active: "prod"
---
# 无效
spring:
  config:
    activate:
      on-profile: "prod"
  profiles:
    active: "metrics"
```

### 3.添加多个激活的Profiles

`spring.profiles.active`属性规则与其他属性相同的排序规则:最高优先级的`PropertySource`生效。

这意味着可以在`application.properties`中激活`profile`,然后使用命令行开关替换它。

有时，让属性添加到激活`profile`而不是替换它们是很有用的。

`spring.profiles.include`属性可用于在`spring.profiles.active`属性激活的配置文件之上添加激活的配置文件。`SpringApplication`入口点也有一个Java API，用于设置额外的配置文件。参见`SpringApplication`中的`setAdditionalProfiles()`方法。

例如，当运行具有以下属性的应用程序时,`common`和`local` profiles文件都会被激活,

当它使用——`spring.profiles.active`开关:

```java
spring:
  profiles:
    include:
      - "common"
      - "local"
```

> 与spring.profiles.active一样spring.profiles.include只能在non-profile 文档中使用。这意味着它们不能包含在spring.config.activate.on-profile激活的配置文件或profile文件中使用。

### 4.Profiles组

有时候，在应用程序中定义和使用的`profiles`粒度太细，使用起来很麻烦。例如，您可能使用`proddb`和`prodmq profiles` 文件来独立启用数据库和消息传递特性。

为了帮助实现这一点，Spring Boot允许定义`profile`组。配置文件组允许为相关的配置文件组定义一个逻辑名称。

例如，我们可以创建一个由`proddb`和`prodmq profile`组成的`production`组。

```java
spring:
  profiles:
    group:
      production:
      - "proddb"
      - "prodmq"
```

我们的应用程序现在可以使用——`spring.profiles.active =production`一次激活`production`、`proddb`和`prodmq`配置文件。

## 二、多环境配置

通常正常开发过程中会存在多套环境，常见的开发环境（dev）、测试环境（test）、生产环境（prod),这种情况下我们可以新建多个`application.properties(或yml)`：

`spring.profiles.active` 属性可以指定当前设置的环境，以此来选择适合的配置文件,例如当`spring.profiles.active=prd`时,系统将加载`application.properties` 和`application-prod.properties`配置文件。

**在IDEA中可以在运行配置时指定:**

上述方法多环境配置文件力度比较粗,假如每个环境存在多个配置文件 `redis`,`mysql`,`mq`单独拆开。针对这种情况可以使用`Profile Group`:

然后每个配置文件添加一个变量用于测试:

测试代码：

```java
@SpringBootApplication
public class SpringProfilesConfigApplication {
    @Value("${spring.profiles.active}")
    private String env;
    @Value("${pf.mq}")
    private String mq;
    @Value("${pf.redis}")
    private String redis;
    @Value("${pf.mysql}")
    private String mysql;
    public static void main(String[] args) {
        SpringApplication.run(SpringProfilesConfigApplication.class, args);
    }
    @Component
    public class MyApplicationRunner implements ApplicationRunner {
        @Override
        public void run(ApplicationArguments args) throws Exception {
            System.out.printf("当前激活的配置环境是{%s}:mq:%s,mysql:%s,redis:%s", env, mq, mysql, redis);
        }
    }
}
```

当激活`prd`环境时:

## 三、maven多环境打包

`spring.profiles.active` 属性的设置简单的方式`application.properties`指定,但是存在一个问题，单程序打包时不能每次去更改配置这样非常麻烦,那么可以把这个属性值设置成变量,`maven`编译打包时动态传入。比如在`application.properties`文件中配置如下：

```java
spring.profiles.active=@profile.active@
```

**1、** 在pom.xml中添加如下内容,多个环境添加多个`profile`节点即可,但是需要指定一个默认的环境:；

```xml
<profiles>  
    <profile>  
        <id>dev</id>  
        <properties>  
            <!-- 环境标识，与配置文件的名称相对应，标签变量要与profile.active保持一致 ->  
            <profile.active>dev</profile.active>  
        </properties>  
        <activation>  
            <!-- 默认环境 -->  
            <activeByDefault>true</activeByDefault>  
        </activation>  
    </profile>  
    <profile>  
        <id>test</id>  
        <properties>  
            <profile.active>test</profile.active>  
        </properties>  
    </profile>  
    <profile>  
        <id>prod</id>  
        <properties>  
            <profile.active>prod</profile.active>  
        </properties>  
    </profile>  
</profiles>  
```

接下来添加`maven`打包插件

```java
 <build>
        <resources>
            <resource>
                <directory>src/main/resources</directory>
                <filtering>true</filtering>
            </resource>
        </resources>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                <mainClass>com.example.springprofilesconfig.SpringProfilesConfigApplication</mainClass>
                </configuration>
                <executions>
                    <execution>
                        <goals>
                            <!--创建一个自动可执行的jar或war文件 -->
                            <goal>repackage</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
```

添加上面插件后IDEA可以选择对应profile环境

执行`compile`,查看编译打包后的配置文件如下:

`@profile.active@`变量已被替换成对应的`proflie`环境值。

## 总结

本文主要是基于`Profiles`特性来支持多环境配置属性的实现，以及maven多环境打包,其实大多数生产环境配置类文件，一般都使用分布式配置相关的中间件，比如`Nacos`,`Apollo`等等。
