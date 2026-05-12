# 04、微服务 Kong 添加插件
- 来源：https://ddkk.com/zhuanlan/gateway/kong/d-2/4.html
- 分类：API网关
- 分组：KONG 教程（版本 B）
在本节中，您将学习到，如何配置使用KONG的插件来管理您的API。KONG的核心原则之一就是通过插件来实现API的扩展。插件可以使您更为简单的扩展和管理您的API。

在以下的步骤中，您将通过配置key-auth插件为您的API添加一个认证的功能。在添加此插件之前，您的所有API都被将代理到上游头。添加并配置此插件后，只有具有正确API密钥的请求会被代理 - 所有其他请求将被KONG拒绝，从而保护您的上游服务免受未经授权的使用，从而实现权限认证功能。

## 1、为您的API配置 key-auth 插件：

通过以下命令，为之前添加的API新增认证功能：

```sh
$ curl -i -X POST \
  --url http://localhost:8001/apis/example-api/plugins/ \
  --data 'name=key-auth'
```

NOTE：该插件还接受一个 config.key_names 参数，默认为[apikey]。它表示在一次请求中，应该包含API密钥[apikey]和参数列表，apikey可以放在header中，也可以直接当作一个请求参数来使用。

## 2、确认插件已经正确的配置好了：

使用以下命令来验证：

```sh
$ curl -i -X GET \
  --url http://localhost:8000/ \
  --header 'Host: example.com'
```

由于请求中没有指定apikey，所以返回的结果应该是403 Forbidden：

```sh
HTTP/1.1 403 Forbidden
...
{
  "message": "Your authentication credentials are invalid"
}
```

正确的请求应该是这样的：

```sh
$ curl -i -X GET \
  --url http://localhost:8000/ \
  --header 'Host: example.com'
  --header 'apikey=xxx'
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://www.cnblogs.com/SummerinShire/category/861287.html
