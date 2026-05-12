# 20、disconf-web 为客户端 开放的 Http API
- 来源：https://ddkk.com/zhuanlan/config/disconf/20.html
- 分类：配置中心
- 分组：网络
## 3.1. 前言

- 目标：让开发者具有自定义开发客户端的能力
- 目前已经支持 java

## 3.2. 准备

- 获取配置时是从disconf-web获取
- 得到配置更新时是从ZK上获取，得到通知后，再从disconf-web上获取配置值

### 获取配置接口

以下接口均不需要权限控制，Http-Rest 风格

### /api/config/item

- 描述：获取配置项
- url示例: /api/config/item?app=disconf_demo&env=rd&version=1_0_0_0&key=discountRate
- 请求类型: GET
- 参数

#
name
desc
是否必要

1
app
app值
是

2
version
version值
是

3
env
env值
是

4
key
配置项的key
是

* 返回示例:

{“status”:1,”message”:””,”value”:”0.5”}

- curl 示例

```java
➜  disconf git:(dev) curl 'http://disconf.com/api/config/item?app=disconf_demo&env=rd&version=1_0_0_0&key=discountRate'
{"status":1,"message":"","value":"0.5"}
```

### /api/config/file

- 描述：获取配置文件
- url示例: /api/config/file?app=disconf_demo&env=rd&version=1_0_0_0&key=autoconfig.properties
- 请求类型: GET
- 参数

#
name
desc
是否必要

1
app
app值
是

2
version
version值
是

3
env
env值
是

4
key
配置文件的key
是

* 返回示例: 文件
* curl 示例

```java
➜  disconf git:(dev) curl 'http://disconf.com/api/config/file?app=disconf_demo&env=rd&version=1_0_0_0&key=autoconfig.properties'
auto=bbdxxjdccdcccdxdcdc
xx%
```

### 得到更新通知的接口

客户端程序需要进行订阅ZK结点

在上面的两个示例中，需要分别订阅的结点是：

- /disconf/disconf_demo_1_0_0_0_rd/item/discountRate
- /disconf/disconf_demo_1_0_0_0_rd/file/autoconfig.properties

格式是

- /disconf/{{app_name}}*{{version}}*{{env}}/item/keyname
- /disconf/{{app_name}}*{{version}}*{{env}}/file/keyname

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://disconf.readthedocs.io/zh_CN/latest/index.html
