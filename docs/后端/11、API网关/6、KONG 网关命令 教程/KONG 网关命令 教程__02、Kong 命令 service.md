# 02、Kong 命令 service
- 来源：https://ddkk.com/zhuanlan/gateway/kong/d-3/2.html
- 分类：API网关
- 分组：KONG 网关命令 教程
## service介绍：

service 是声明了一组name、host、port、protocol等配置的函数。可以绑定route、upstream上下游服务。并且对于route、upstream可以绑定多个。

新增service后，kong会自动分配一个id值，该id为service的唯一标识。可用于后期修改、查看以及绑定route、upstream。

## 命令：

kong网关的命令接口基本符合restful api风格。官网上的addservice、list service只是模块名称，不是命令，不要混淆。

不同的命令主要区分在http的请求方法（get、post、put、patch、delete）。

### 1、addservice（新增服务）；

post 方法，api：[http://127.0.0.1:8001/services](http://127.0.0.1:8001/services)

参数主要放置在requestBody内。

上图是使用postman发起的请求，可以看出使用的是post请求，参数放置在body里。

创建成功后，kong服务会返回此次创建成功的service的name等所有配置属性。同时会发配一个唯一的service.id

这种是直接创建service，然后创建的同时通过配置一些参数设置属性。此外还可以直接针对已存在的certificates直接创建绑定服务

1、post 方法 api:[http://127.0.0.1:8001/certificates /{certificates id}/service](http://127.0.0.1:8001/services)

参数和直接创建service方法一致。其中certificates id就是kong服务分配给certificates 路由的唯一标识id

### 2、查看listservice、retrieveservice（检索服务）--两者功能类似，合并到一起；

1、get方法 api ：http://127.0.0.1:8001/services

展示所有已创建的服务

2、get方法 api:http://127.0.0.1:8001/services/{service id/name}

只展示对应service id/name的服务属性

3、get方法 api:http://127.0.0.1:8001/certificates/{certificates id}/services

展示与指定证书关联绑定的服务

4、get方法 api:http://127.0.0.1:8001/routes/{routes id}/service

检索与指定route id绑定的服务。同样的也可以检索指定plugin 插件（/plugins/{plugin id}/service）的服务

### 3、修改updateservice；

方法patch 。局部更新

1、[http://127.0.0.1:8001/service/{service](http://127.0.0.1:8001/service/{service) id}

针对指定的service id修改属性

2、[http://127.0.0.1:8001/](http://127.0.0.1:8001/certificates/{certificate)certificates/{certificate id}/services/{service name or id}

3、http://127.0.0.1:8001//plugins/{plugin id}/service

修改与指定插件的关联的service。route与此类似。/routes/{route name or id}/service

### 4、替换（createorupdateservice）；

使用的http方法是put，结合put的用法以及api参数，我理解更偏向与对现有服务的整体创建或替换。如果指定id则是替换，没有id则是新建

1、[http://127.0.0.1:8001](http://127.0.0.1:8001/services/{service)[/services/{service](http://127.0.0.1:8001/certificates/%7Bcertificate) name or id}

2、[http://127.0.0.1:8001/certificates/{certificate id}/services/{service name or id}](http://127.0.0.1:8001/certificates/{certificate%20id}/services/{service%20name%20or%20id})

3、[http://127.0.0.1:8001//routes/{route name or id}/service](http://127.0.0.1:8001/certificates/%7Bcertificate%20id%7D/services/%7Bservice%20name%20or%20id%7D)

/plugins/{plugin id}/service

### 5、删除deleteservice；

1、/services/{service name or id}

2、/certificates/{certificate id}/services/{service name or id}

3、/routes/{route name or id}/service

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://www.cnblogs.com/jybky/category/1591749.html
