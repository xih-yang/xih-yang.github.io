# 05、微服务 Kong 添加一个用户(Consumer)
- 来源：https://ddkk.com/zhuanlan/gateway/kong/d-2/5.html
- 分类：API网关
- 分组：KONG 教程（版本 B）
在本节中，我们将学习如何添加一个用户(consumer)到KONG实例中。用户是与使用您的API的个人相关联，可用于跟踪，访问管理等。

NOTE：本节假设您已经正确启用了密钥验证插件。如果没有，请参考之前的步骤进行正确配置。

## 1、创建一个用户：

通过以下命令，来创建一个模拟用户Jason：

```sh
$ curl -i -X POST \
  --url http://localhost:8001/consumers/ \
  --data "username=Jason"
```

您应该看到类似于下面的回复：

```sh
HTTP/1.1 201 Created
Content-Type: application/json
Connection: keep-alive
{
  "username": "Jason",
  "created_at": 1428555626000,
  "id": "bbdf1c48-19dc-4ab7-cae0-ff4f59d87dc9"
}
```

此时，已经完成了创建用户的操作了。

NOTE：如果想要将用户和已有的其他数据库中的用户进行关联，可通过添加｀custom_id｀参数来实现，其值可以是现存用户的id。

## 2、为此用户添加一个[apikey]认证：

现在，我们可以通过发出以下请求为我们刚刚创建的用户Jason创建一个密钥：

```sh
$ curl -i -X POST \
  --url http://localhost:8001/consumers/Jason/key-auth/ \
  --data 'key=ENTER_KEY_HERE'
```

## 3、验证您的用户的apikey是否有效：

我们现在可以发出以下请求，来验证用户Jason的apikey是否有效：

```sh
$ curl -i -X GET \
  --url http://localhost:8000 \
  --header "Host: example.com" \
  --header "apikey: ENTER_KEY_HERE"
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://www.cnblogs.com/SummerinShire/category/861287.html
