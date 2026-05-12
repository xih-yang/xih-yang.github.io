# 03、kong 命令 route
- 来源：https://ddkk.com/zhuanlan/gateway/kong/d-3/3.html
- 分类：API网关
- 分组：KONG 网关命令 教程
### 介绍

route 是一套匹配客户端请求的规则。每个route都会匹配一个service，每个service可定关联多个route。

可以说service：route=1：n。一对多的关系。每个匹配到route的请求都会代理到对应的service上。

路由可以设定不同的协议，不同的协议配置的属性不一样。官网介绍如下：

- For http, at least one of methods, hosts, headers or paths;
- For https, at least one of methods, hosts, headers, paths or snis;
- For tcp, at least one of sources or destinations;
- For tls, at least one of sources, destinations or snis;
- For grpc, at least one of hosts, headers or paths;
- For grpcs, at least one of hosts, headers, paths or snis.

在kong网关服务中，可以和路由route匹配的有两类：service和plugin

在操作route的命令中也可以依赖这两类进行操作。命令格式和service相似，都是使用restful api风格，区分再不同的http方法。

## 接下来简单介绍

### 1、add routes

post 方法

1、http://127.0.0.1:8001/routes

2、http://127.0.0.1:8001//services/{service name or id}/routes 给指定的service 添加路由

主要参数包括：name ,path(匹配该路由的路径),host(匹配该路由的域名列表),protocols（http、https）,methods,service.id

### 2、list routes ,Retrieve Route

get方法

1、[http://127.0.0.1:8001/routes](http://127.0.0.1:8001/routes) 展示所有routes

2、/services/{service name or id}/routes

/routes/{route name or id}

/services/{service name or id}/routes/{route name or id}

/plugins/{plugin id}/route

以上展示指定的route信息

### 3、update routes 修改

方法：patch

1、/routes/{route name or id}

2、/services/{service name or id}/routes/{route name or id}

/plugins/{plugin id}/route

### 4、create or update routes 存在时更新，不存在时创建

方法：put

1、/routes/{route name or id}

2、/services/{service name or id}/routes/{route name or id}

/plugins/{plugin id}/route

### 5、delete route删除

1、/routes/{route name or id}

2、/services/{service name or id}/routes/{route name or id}

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://www.cnblogs.com/jybky/category/1591749.html
