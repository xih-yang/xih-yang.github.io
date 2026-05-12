# 20、SpringCloud Alibaba Nacos（8）获取多个配置
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/53.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
除了通过上面的方式指定一个唯一配置外，我们还可以同时获取多个配置文件的内容

## 1.修改 config-client 里面的配置文件

```bash
server: 
	port: 8070
spring: 
	cloud: 
		nacos: 
			discovery: 
				server-addr: localhost:8848
			config: 
				extension-configs: 多个配置
					- dataId: test-a.yml
					group: DEFAULT_GROUP
					refresh: true
					- dataId: test-b.yml
					group: DEFAULT_GROUP
					refresh: false
					# 指定配置中心的地址和配置中心使用的数据格式
					# server-addr: localhost:8848
					# file-extension: ymlproperties
					# group: GROUP_A 获取 GROUP_A 里面的配置
					# namespace: 8defab18-df88-49e5-b13e-526f89da87ad 命名空间，写 id 的值
					# prefix: ${
     spring.application.name} 前缀，默认为应用的名称，不需要修改
	application: 
		name: config-client
	profiles: 
		active: dev 使用的 dev 环境的配置
```

**说明：**

- spring.cloud.nacos.config.extension-configs[n].dataId，指定多个配置的 dataId，必须包含文件格式，支持 properties、yaml 或 yml；
- spring.cloud.nacos.config.extension-configs[n].group，指定分组；
- spring.cloud.nacos.config.extension-configs[n].refresh，是否支持刷新。
- 上面的配置中，我们分别从 DEFAULT_GROUP 中获取了 config-client-a.yml 和 config-client-b.yml 配置内容，并且 config-client-a.yml 支持刷新，config-client-b.yml 不支持刷新

**注意：**

没有 namespace 的配置，言外之意就是 Nacos 目前还不支持多个配置指定不同的命名空间。

## 2.在 Nacos 里面完成这 2 个配置文件的创建

config-client-a.yml：

点击 + 完成创建：

点击发布。

config-client-b.yml

完成后：

## 3.获取配置信息

重启 config-client，测试即可
