# 15、SpringCloud Alibaba Nacos（3）在 nacos-server 里面添加配置
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/48.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
在 nacos-server 里面添加配置

- Nacos-client 会从 Nacos-Server 里面获取配置文件，首先，Nacos-Server 里面需要有配置文件才能获取。
- 新建如下所示的配置信息：

```java
Data ID: nacos-config.properties
Group : DEFAULT_GROUP
配置格式: Properties
配置内容： user.name=nacos-config-properties
		 user.age=90
```

打开 Nacos 的管理页面：

- 现在我们看见，里面还没有任何的配置信息。
- 点击：

- 让我们来新建一个配置项：
- 填写的表单如下：

点击发布，完成配置文件的发表任务：

返回后，配置信息已经发布成功：
