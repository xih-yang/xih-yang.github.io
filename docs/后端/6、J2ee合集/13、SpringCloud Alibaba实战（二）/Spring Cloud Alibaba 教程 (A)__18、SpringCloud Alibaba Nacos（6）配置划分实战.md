# 18、SpringCloud Alibaba Nacos（6）配置划分实战
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/51.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
- Nacos 配置中心的 namespace、dataId 和 group 可以方便灵活地划分配置。比如，我们现在有一个项目需要开发，项目名称为 dqcgm，项目开发人员分为两个组：GROUP_A 和 GROUP_B，项目分为三个环境：开发环境 dev、测试环境 test 和生产环境 prod。
- dqcgm->GRUOR_A->dev

## 1.在 Nacos 控制台中新建一个名称为 dqcgm的命名空间

- 点击新建命令空间：
- 填写以下的内容：

- 点击确定，完成创建
- 完成后，如图所示 ：

新建完成后：我们看见它自动帮我们生产了一个 ID:

8defab18-df88-49e5-b13e-526f89da87ad

记录该 ID 值。

## 2.在 Nacos 新建配置

切换完成后，点击 +：

填写以上的信息。点击发布：

完成后：

已经完成创建

## 3.获取配置文件

修改 config-client 里的 bootstrap.yml 文件：

```bash
server: 
	port: 8070
spring: 
	cloud: 
		nacos: 
			discovery: 
				server-addr: localhost:8848
			config: 指定配置中心的地址和配置中心使用的数据格式
				server-addr: localhost:8848
				file-extension: ymlproperties
				group: GROUP_A 获取 GROUP_A 里面的配置
				namespace: 8defab18-df88-49e5-b13e-526f89da87ad 命名空间，写 id 的值
				# prefix: ${
     spring.application.name} 前缀，默认为应用的名称，不需要修改
	application: 
		name: config-client
	profiles: 
		active: dev 使用的 dev 环境的配置
```

## 4.重启 config-client 测试

浏览器访问：

http://localhost:8070/user/info

得到：

配置信息已经获取成功
