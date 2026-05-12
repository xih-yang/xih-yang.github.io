# 13、Spring Boot - 中热部署
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/4/13.html
- 分类：J2EE框架
- 分组：教程目录
## 1.通过 DevTools 工具实现热部署

### 1.修改 POM 文件，添加 DevTools 依赖

```xml
<dependency> 
	<groupId>org.springframework.boot</groupId> 
	<artifactId>spring-boot-devtools</artifactId> 
	<optional>true</optional> 
</dependency>
```

### 2.配置 Idea

#### 1.设置自动编译

#### 2.设置 Idea 的 Registry

通过快捷键打开该设置项：Ctrl+Shift+Alt+/

勾选 complier.automake.allow.when.app.running
