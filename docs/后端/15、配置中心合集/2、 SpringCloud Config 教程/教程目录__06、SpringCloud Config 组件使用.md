# 06、SpringCloud Config 组件使用
- 来源：https://ddkk.com/zhuanlan/config/springcloudconfig/6.html
- 分类：配置中心
- 分组：教程目录
config(配置)又称为 统一配置中心顾名思义,就是将配置统一管理,配置统一管理的好处是在日后大规模集群部署服务应用时相同的服务配置一致,日后再修改配置只需要统一修改全部同步,不需要一个一个服务手动维护。

## 1.统一配置中心组件流程图

## Config Server 开发

## 1.引入依赖

`注：引入依赖需要添加consul的依赖，consul的两个依赖都要引入`

```xml
<!--引入统一配置中心-->
<dependency>
  <groupId>org.springframework.cloud</groupId>
  <artifactId>spring-cloud-config-server</artifactId>
</dependency>
```

## 2.开启统一配置中心服务

```java
@SpringBootApplication
@EnableConfigServer
public class Configserver7878Application {
	public static void main(String[] args) {
		SpringApplication.run(Configserver7878Application.class, args);
	}
}
```

## 3.修改配置文件

```sh
server.port=7878
spring.application.name=configserver
spring.cloud.consul.host=localhost
spring.cloud.consul.port=8500
```

## 4.直接启动服务报错

- 没有指定远程仓库的相关配置
-

## 5.创建远程仓库

- github创建一个仓库
-

## 6.复制仓库地址

- https://github.com/chenyn-java/configservers.git
-

## 7.在统一配置中心服务中修改配置文件指向远程仓库地址

```sh
spring.cloud.config.server.git.uri=https://github.com/chenyn-java/configservers.git
#spring.cloud.config.server.git.username=       私有仓库访问用户名
#spring.cloud.config.server.git.password=				私有仓库访问密码
```

## 8.再次启动统一配置中心

## 9.拉取远端配置 [三种方式]

**1、** http://localhost:7878/test-xxxx.properties`*常用*`；

**2、** http://localhost:7878/test-xxxx.json`不太建议用`；

**3、** http://localhost:7878/test-xxxx.yml`*常用*`；

## 10.拉取远端配置规则

- label/name-profiles.yml

label 代表去那个分支获取 默认使用master分支

name 代表读取那个具体的配置文件文件名称

profile 代表读取配置文件环境

## 11.查看拉取配置详细信息

- http://localhost:7878/client/dev [client:代表远端配置名称][dev:代表远程配置的环境]

## 12.指定分支和本地仓库位置

```sh
spring.cloud.config.server.git.basedir=/localresp 		#一定要是一个空目录,在首次会将该目录清空
spring.cloud.config.server.git.default-label=master  指定使用远程仓库中那个分支中内容
```

## Config Client 开发

## 1.项目中引入config client依赖

```xml
<!--引入config client-->
<dependency>
  <groupId>org.springframework.cloud</groupId>
  <artifactId>spring-cloud-starter-config</artifactId>
</dependency>
```

## 2.编写配置文件

```sh
spring.cloud.config.discovery.enabled=true               开启统一配置中心服务
spring.cloud.config.discovery.service-id=configserver    指定统一配置服务中心的服务唯一标识
spring.cloud.config.label=master													#指定从仓库的那个分支拉取配置	
spring.cloud.config.name=client														#指定拉取配置文件的名称
spring.cloud.config.profile=dev														#指定拉取配置文件的环境
```

```sh
# 3.远程仓库创建配置文件
- client.properties										[用来存放公共配置]
	spring.application.name=configclient
	spring.cloud.consul.host=localhost
	spring.cloud.consul.port=8500
- client-dev.properties  							[用来存放研发相关配置][注意:这里端口为例,以后不同配置分别存放]
	server.port=9099
- client-prod.properties							[用来存放生产相关配置]
	server.port=9098
```

## 4.启动客户端服务进行远程配置拉取测试

- 直接启动过程中发现无法启动直接报错

## 报错原因

- 项目中目前使用的是application.properties启动项目,使用这个配置文件在springboot项目启动过程中不会等待远程配置拉取,直接根据配置文件中内容启动,因此当需要注册中心,服务端口等信息时,远程配置还没有拉取到,所以直接报错

## 解决方案

- 应该在项目启动时先等待拉取远程配置,拉取远程配置成功之后再根据远程配置信息启动即可,为了完成上述要求springboot官方提供了一种解决方案,就是在使用统一配置中心时应该将微服务的配置文件名修改为bootstrap.(properties|yml),bootstrap.properties作为配置启动项目时,会优先拉取远程配置,远程配置拉取成功之后根据远程配置启动当前应用。

## 再次启动服务

## 手动配置刷新

## 1.说明

- 在生产环境中,微服务可能非常多,每次修改完远端配置之后,不可能对所有服务进行重新启动,这个时候需要让修改配置的服务能够刷新远端修改之后的配置,从而不要每次重启服务才能生效,进一步提高微服务系统的维护效率。在springcloud中也为我们提供了手动刷新配置和自动刷新配置两种策略,这里我们先试用手动配置文件刷新。

## 2.在config client端加入刷新暴露端点

```java
management.endpoints.web.exposure.include=*           开启所有web端点暴露  [推荐使用这种]
```

## 3.在需要刷新代码的类中加入刷新配置的注解

```java
@RestController
@RefreshScope   //需要刷新的类中添加刷新配置注解
@Slf4j
public class TestController {
    @Value("${name}")
    private String name;
    @GetMapping("/test/test")
    public String test(){
      log.info("当前加载配置文件信息为:[{}]",name);
      return name;
    }
}
```

## 4.在远程配置中加入name并启动测试

## 5.启动之后直接访问

## 6.修改远程配置

## 7.修改之后在访问

- 发现并没有自动刷新配置?
- 必须调用刷新配置接口才能刷新配置

## 8.手动调用刷新配置接口

- curl -X POST http://localhost:9099/actuator/refresh

## 9.在次访问发现配置已经成功刷新

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
