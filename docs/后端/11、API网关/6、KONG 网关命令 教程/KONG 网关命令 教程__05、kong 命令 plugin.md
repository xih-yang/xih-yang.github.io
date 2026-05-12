# 05、kong 命令 plugin
- 来源：https://ddkk.com/zhuanlan/gateway/kong/d-3/5.html
- 分类：API网关
- 分组：KONG 网关命令 教程
## 介绍

plugin 插件 是运用在kong网关各模块的功能。在http请求或响应过程中执行的插件；

可以实现认证、负载、加密等功能。

kong官网提供了一些插件：https://docs.konghq.com/hub/

也可以自行开发一些插件使用。

这些插件可以配置到route、service上，也可以指定consumer使用。

## 主要参数：

route /service / consumer 可以通过id 或name 绑定

config ：指的是在添加插件时，插件本身带的一些属性。具体属性配置可参考：https://docs.konghq.com/hub/

protocols：触发插件的请求协议

enabled：是否开启插件，默认true开启

配置多个插件后者多个模块配置插件时注意插件的触发优先级

命令：

### 1、addplugin；

post 方法

api:/plugins /routes/{route id}/plugins /services/{service id}/plugins /consumers/{consumer id}/plugins

### 2、listplugin；

get方法

api: /plugins /routes/{route id}/plugins /services/{service id}/plugins /consumers/{consumer id}/plugins

### 3、retrieveplugin；

get方法

api: /plugins/{plugin id} /routes/{route name or id}/plugins/{plugin id} /services/{service name or id}/plugins/{plugin id} /consumers/{consumer username or id}/plugins/{plugin id}

retrieve enabled plugins: /plugins/enabled 检索已启用的plugin

retrieve plugins schema:/plugins/schema/{plugin name} 检索插件结构

### 4、updateplugin；

patch方法

api:/plugins/{plugin id} /routes/{route name or id}/plugins/{plugin id} /services/{service name or id}/plugins/{plugin id} /consumers/{consumer username or id}/plugins/{plugin id}

### 5、createorupdateplugin；

put方法

api:/plugins/{plugin id} /routes/{route name or id}/plugins/{plugin id} /services/{service name or id}/plugins/{plugin id} /consumers/{consumer username or id}/plugins/{plugin id}

### 6、deleteplugin；

delete 方法

api:/plugins/{plugin id} /plugins/{plugin id} /services/{service name or id}/plugins/{plugin id} /consumers/{consumer username or id}/plugins/{plugin id}

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://www.cnblogs.com/jybky/category/1591749.html
