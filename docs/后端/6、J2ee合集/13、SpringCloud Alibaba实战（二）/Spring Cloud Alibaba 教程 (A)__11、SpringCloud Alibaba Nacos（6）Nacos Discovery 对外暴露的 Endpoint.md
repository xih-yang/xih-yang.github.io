# 11、SpringCloud Alibaba Nacos（6）Nacos Discovery 对外暴露的 Endpoint
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/44.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
- Nacos Discovery 内部提供了一个 Endpoint, 对应的 endpoint id 为 nacos-discovery。我们通过该 Endpoint，能获取到：
- 当前服务有哪些服务订阅者 ；
- 当前应用 Nacos 的基础配置信息 ；

## 1.给项目添加依赖

- 假设我们想看服务提供者（provider）有那些订阅者，以及 Nacos 的基础配置信息。
- 我们就需要给 provider 项目的 pom.xml 文件里面添加：

```xml
<dependencies> 
	<dependency> 
		<groupId>org.springframework.boot</groupId> 
		<artifactId>spring-boot-starter-actuator</artifactId> 
	</dependency> 
</dependencies>
```

## 2.修改配置文件

- Endpoint 本身对外界隐藏显示，我们需要在配置里面开启对 Endponit 的显示支持
- 修改 application.yml 配置文件，在里面添加如下的配置：

```bash
management:
	endpoints:
		web:
			exposure:
				include: "*"
```

**说明：**

exposure.include：对外界保留那些 Endpoint，若是所有则使用*

## 3.查询效果

重启项目，浏览器访问：

http://localhost:8081/actuator/nacos-discovery

效果为：
