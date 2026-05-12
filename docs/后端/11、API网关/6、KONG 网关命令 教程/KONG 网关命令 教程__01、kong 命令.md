# 01、kong 命令
- 来源：https://ddkk.com/zhuanlan/gateway/kong/d-3/1.html
- 分类：API网关
- 分组：KONG 网关命令 教程
上次在虚拟机里安装kong网关后，因为版本（1.4）太高，目前Kong Dashboard无法支持，

后续发现Git上有个开源工具Kong admin ui，下载源码并部署到NGINX。

但是发现使用过程中能够正常添加service服务，但是在添加路由route时始终提示校验不通过的错误。

最后决定使用最原始的官方提供的命令操作（参考地址：[https://docs.konghq.com/1.4.x/admin-api/](https://docs.konghq.com/1.4.x/admin-api/)）

结合postman工具使用，发现操作起来并不复杂。其实就是kong本身提供了一些http请求，通过传输一些参数进行各个模块的配置。

接下来对一些常用命令进行总结。

## KONG 默认监听下面几个端口：

- 8000 这个端口用于监听客户端的 HTTP 请求。后续请求配置好的路由route通过该端口
- 8443 这个端口用于监听客户端的 HTTPS 请求。后续请求配置好的路由route通过该端口
- 8001 用于接收配置 KONG 的 Admin API。管理端通过该端口
- 8444 功能同 8001，只是这个端口接收的是 HTTPS 请求。管理端通过该端口

访问路径：[http://192.168.60.129:8001（服务地址+监听端口）](http://192.168.60.129:8001（服务地址+监听端口）)

## 基础命令

**1、**

路径path:/

描述：返回基本信息。插件、kong节点

**2、**

路径path:/status

描述：返回kong网关服务的运行状态。主要包含三部分:1,kong节点内存信息；2,数据库的联通性（不包含数据库的性能）；3，nginx底层服务的运行信息

因为kong服务是基于nginx部署的，所以可以通过nginx监控工具进一步监控

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://www.cnblogs.com/jybky/category/1591749.html
