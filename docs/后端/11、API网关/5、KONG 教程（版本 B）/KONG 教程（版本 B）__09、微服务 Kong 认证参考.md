# 09、微服务 Kong 认证参考
- 来源：https://ddkk.com/zhuanlan/gateway/kong/d-2/9.html
- 分类：API网关
- 分组：KONG 教程（版本 B）
客户端访问上游API服务，通常由Kong的认证插件及其配置参数来控制。

## 1、通用认证

一般情况下，上游API服务都需要客户端有身份认证，且不允许错误的认证或无认证的请求通过。认证插件可以实现这一需求。这些插件的通用方案/流程如下：

**1、** 向一个API或全局添加AUTH插件（此插件不作用于consumers）；

**2、** 常见一个consumer对象；

**3、** 为consumer提供指定的验证插件方案的身份验证凭据；

**4、** 现在，只要有请求进入Kong，都将检查其提供的身份验证凭据（取决于auth类型），如果该请求无法被验证或者验证失败，则请求会被锁定，不执行向上有服务转发的操作。

但是，上述的一般流程并不是总是有效的。譬如，当使用了外部验证方案（比如LDAP）时，KONG就不会（不需要）对consumer进行身份验证。

## 2、Consumers

最简单的理解和配置consumer的方式是，将其于用户进行一一映射，即一个consumer代表一个用户（或应用）。但是对于KONG而言，这些都无所谓。consumer的核心原则是你可以为其添加插件，从而自定义他的请求行为。所以，或许你会有一个手机APP应用，并为他的每个版本都定义一个consumer，又或者你又一个应用或几个应用，并为这些应用定义统一个consumer，这些都无所谓。这是一个模糊的概念，他叫做consumer，而不是user！万万要区分开来，且不可混淆。

## 3、匿名访问

在Kong 0.10.x版本之前，你可以将指定的API配置为仅允许经过身份验证的访问（通过插件来实现）或只允许匿名访问。也就是说，一个指定的API，不允许对于某些consumer实行身份验证，而对于另外的consumer实行匿名访问。

在0.10.x版本以后，这些限制取消了--同一个API可以同时实现验证和匿名两种访问方式。你可以使用他的这种特性，为一个API提供两种服务方式：以较低的速率提供匿名访问权限，以较高的速率实现验证访问权限。为指定API提供一个用户试用体验。

要配置这样的API，您首先应用所选的认证插件，然后创建一个新的consumer来表示匿名用户，然后配置你的身份验证插件以允许匿名访问。这里有一个示例，它假设您已经配置了一个名为example-api的API：

### 1、创建example-api：

```sh
$ curl -i -X POST \
  --url http://localhost:8001/apis/ \
  --data 'name=example-api' \
  --data 'uris=/auth-sample' \
  --data 'upstream_url=http://mockbin.org/request' 
```

此时，无论什么样的请求，http://localhost:8000/auth-sample 都会有输出信息。

### 2、配置 key-auth 插件：

```sh
$ curl -i -X POST \
  --url http://localhost:8001/apis/example-api/plugins/ \
  --data 'name=key-auth'
```

### 3、验证 key-auth 插件是否正确配置：

```sh
$ curl -i -X GET \
  --url http://localhost:8000/auth-example
```

此时，由于你并未在请求参数或请求头里使用apikey，所以这个请求会报403错误：

```sh
HTTP/1.1 403 Forbidden
...
{
  "message": "No API key found in headers or querystring"
}
```

### 4、创建一个匿名consumer：

每一次的KONG的代理请求，都会有一个对应的consumer对象。这里创建一个anonymous_consumer来测试API的匿名请求：

```sh
$ curl -i -X POST \
  --url http://localhost:8001/consumers/ \
  --data "username=anonymous_users"
```

你会得到以下的返回信息：

```sh
HTTP/1.1 201 Created
Content-Type: application/json
Connection: keep-alive
{
  "username": "anonymous_users",
  "created_at": 1428555626000,
  "id": "bbdf1c48-19dc-4ab7-cae0-ff4f59d87dc9"
}
```

### 5、开启API的匿名请求：

您现在将重新配置密钥验证插件，以允许匿名访问:

```sh
$ curl -i -X PATCH \
  --url http://localhost:8001/apis/example-api/plugins/4a223b63-c44a-40e5-9102-b23335f594ca \
  --data "config.anonymous=bbdf1c48-19dc-4ab7-cae0-ff4f59d87dc9"
```

这里的两个uuid，分别是第2步和第4步中产生的uuid。具体请参考两步操作中返回参数id。

`config.anonymous = `参数表示该API上的密钥验证插件允许匿名访问，并将此访问与上一步中收到的consumer的ID相关联。在此步骤中，您需要提供有效的consumerID - 当进行匿名配置时，不会对consumer的id进行检验，如果配置了一个不存在的或错误的consumerid，则会导致插件不能正常运行。

### 6、验证匿名访问：

```sh
$ curl -i -X GET \
  --url http://localhost:8000/auth-sample
```

这个访问请求和第三步中的一样，然而，此时的访问是通过的，只因为你在第五步中配置了匿名访问。返回内容大致是：

```sh
{
  ...
  "headers": {
    ...
    "x-consumer-id": "713c592c-38b8-4f5b-976f-1bd2b8069494",
    "x-consumer-username": "anonymous_users",
    "x-anonymous-consumer": "true",
    ...
  },
  ...
}
```

这显示，请求通过了，并且是以匿名的方式。

## 4、多重验证

Kong 0.10.x扩展了为给定API应用多个验证插件的能力，并允许不同的客户端使用不同的身份验证方法来访问给定的API服务。在评估多个身份验证凭据时，可以将验证插件的行为设置为逻辑AND或逻辑OR。该行为的关键是配置config.anonymous属性。

- config.anonymous 默认为未设置。如果此属性未设置（空），则auth插件将始终执行身份验证，并返回40x响应（如果未验证）。当调用多个验证插件时，会导致逻辑AND。
- config.anonymous 设置为有效的consumer ID。在这种情况下，auth插件只有在尚未认证的情况下才会执行身份验证。当身份验证失败时，它不会返回40x响应，而是将匿名consumer设置为consumer。当调用多个验证插件时，会使用OR+匿名。

备注1：所有的或任何一个验证插件都可配置为可使匿名访问的。但是，如果要混合使用验证插件，则对于匿名访问的配置就需要进行甄选，否则会出现混乱。

备注2：如果使用AND逻辑，则最后一个执行的验证插件将是把验证信息传递给上游服务的那个。当使用OR逻辑时，传递给上游服务验证信息的那个插件，将会是第一个成功验证consumer的那个插件，或者是最后一个配置了匿名访问权限的那个插件。

ps：如果对API使用多个验证插件，且插件间的逻辑配置为OR的话，最好不要为每个插件开启匿名访问，这样才能保证最终能成功请求的consumer是预期的那个。否则会有不可预期的结果出现。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://www.cnblogs.com/SummerinShire/category/861287.html
