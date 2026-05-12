# 12、Spring Cloud Config 用户认证
- 来源：https://ddkk.com/zhuanlan/config/springcloudconfig/12.html
- 分类：配置中心
- 分组：教程目录
**介绍**

Config Server是允许匿名访问的。为了防止配置内容的外泄，应该保护Config Server的安全。有多种方式可以做到这一点，例如通过物理网络安全，或者Config Server添加用户认证等。

**为Config Server添加基于HTTP Basic的用户认证**

1新建项目microservice-config-server-eureka-authenticating

2为项目添加依赖

```xml
<dependencies>
<dependency>
  <groupId>org.springframework.cloud</groupId>
  <artifactId>spring-cloud-config-server</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.cloud</groupId>
  <artifactId>spring-cloud-starter-eureka</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-security</artifactId>
</dependency>
</dependencies>
```

3在application.yml中添加如下内容：

```sh
server:
  port: 8080
spring:
  application:
    name: microservice-config-server-eureka
  cloud:
    config:
      server:
        git:
          uri:https://git.oschina.net/itmuch/spring-cloud-config-repo# 配置Git仓库的地址
          username:                                                         Git仓库的账号
          password:                                                         Git仓库的密码
eureka:
  client:
    serviceUrl:
      defaultZone:http://localhost:8761/eureka/
security:
  basic:
    enabled: true               开启基于HTTP basic的认证
  user:
    name: user                  配置登录的账号是user
    password: password123       配置登录的密码是password123
```

4启动该服务，并输入 [http://localhost:8080/microservice-foo/dev](http://localhost:8080/microservice-foo/dev)

5输入用户名user和密码password123

**Config Client连接需用户认证的Config Server**

Config Client有两种方式使用需要用户认证的Config Server

1使用curl风格的URL

```sh
spring:
  cloud:
    config:
      uri: http://user:password123@localhost:8080/
```

2指定Config Server的账号和密码

```sh
spring:
  cloud:
    config:
      uri: http://localhost:8080/
      username:user
      password:password123
```

需要注意的是spring.cloud.config.password和spring.cloud.config.username的优先级较高，它们会覆盖URL中包含的账号和密码。

**四Config Client认证Config Server项目实战**

1新建项目microservice-config-client-eureka-authenticating

2bootstrap.yml配置如下

```sh
spring:
  application:
    name: microservice-foo    对应config server所获取的配置文件的{application}
  cloud:
    config:
      username: user
      password: password123
      profile: dev
      label: master
      discovery:
        enabled: true                                  表示使用服务发现的configserver配置，而不是自己配置的Config Server的uri，默认false
        service-id: microservice-config-server-eureka  指定Config Server在服务发现中的serviceId，默认是configserver
eureka:
  client:
    serviceUrl:
      defaultZone:http://localhost:8761/eureka/ 
```

3启动microservice-config-client-eureka-authenticating

4输入 [http://localhost:8081/profile](http://localhost:8081/profile)

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
