# 17、SpringCloud Alibaba Nacos（5）获取配置规则
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/50.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
- Namespace：即命名空间。默认的命名空间为 public，我们可以在 Nacos 控制台中新建命名空间；
- dataId：即配置文件名称
- Group：即配置分组，默认为 DEFAULT_GROUP，可以通过 spring.cloud.nacos.config.group 配置。
- 其中：dataId 是最关键的配置字段：格式如下：

```bash
${
     prefix} - ${
     spring.profiles.active} .${
     file-extension}
```

**说明：**

- prefix 默认为 spring.application.name 的值，也可以通过配置项 spring.cloud.nacos.config.prefix 来配置；
- spring.profiles.active 即为当前环境对应的 profile。注意，当 spring.profiles.active 为空时，对应的连接符-也将不存在，dataId 的拼接格式变成`$` {prefix}.`$` {file-extension}；
- file-extension 为配置内容的数据格式，可以通过配置项 spring.cloud.nacos.config.file-extension 来配置
- 这就是上面我们为什么能获得到配置的原因了。
