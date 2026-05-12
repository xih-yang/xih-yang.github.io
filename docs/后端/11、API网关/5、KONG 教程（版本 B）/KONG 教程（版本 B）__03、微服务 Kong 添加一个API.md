# 03、微服务 Kong 添加一个API
- 来源：https://ddkk.com/zhuanlan/gateway/kong/d-2/3.html
- 分类：API网关
- 分组：KONG 教程（版本 B）
在开始前，请确保您已经安装了KONG服务，并且已经启动了KONG服务。

在本节中，您可以学习到：如何在KONG层添加一个API。这是您使用KONG来管理您的API的第一步。对于此篇教程，我们将使用 http://www.baidu.com 来测试KONG。

KONG在 8001 端口上提供了一个 RESTful 形式的管理API，用于管理您的Kong实例或群集的配置。

## 1、通过管理员添加您的API：

通过以下cURL来添加您的第一个API(http://www.baidu.com)：

```sh
$ curl -i -X POST \
  --url http://localhost:8001/apis/ \
  --data 'name=example-api' \
  --data 'hosts=example.com' \
  --data 'upstream_url=http://www.baidu.com'
```

## 2、确认您的API已经添加到KONG里了：

通过以上的操作，您将会看到以下的返回信息：

```sh
HTTP/1.1 201 Created
Content-Type: application/json
Connection: keep-alive
{
  "created_at": 1488830759000,
  "hosts": [
      "example.com"
  ],
  "http_if_terminated": true,
  "https_only": false,
  "id": "6378122c-a0a1-438d-a5c6-efabae9fb969",
  "name": "example-api",
  "preserve_host": false,
  "retries": 5,
  "strip_uri": true,
  "upstream_connect_timeout": 60000,
  "upstream_read_timeout": 60000,
  "upstream_send_timeout": 60000,
  "upstream_url": "http://httpbin.org"
}
```

现在，KONG里已经添加了您的API并做好了代理的准备。

## 3、通过Kong转发您的请求：

发出以下cURL请求以验证Kong是否将请求正确的转发到了您的API。请注意，默认情况下，Kong是在 8000 端口上处理代理请求的：

```sh
$ curl -i -X GET \
  --url http://localhost:8000/ \
  --header 'Host: example.com'
```

一个成功的相应，意味着KONG已经将（http://localhost:8000）请求转发到了我们在第一步中配置的 `upstream_url 里，并将response转发给我们了。`

`KONG通过上述请求中，定义的URL头来做到这一点：`

- Host: ``

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://www.cnblogs.com/SummerinShire/category/861287.html
