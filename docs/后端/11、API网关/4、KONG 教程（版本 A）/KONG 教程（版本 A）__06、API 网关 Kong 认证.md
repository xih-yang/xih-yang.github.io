# 06、API 网关 Kong 认证
- 来源：https://ddkk.com/zhuanlan/gateway/kong/d-1/6.html
- 分类：API网关
- 分组：KONG 教程（版本 A）
到上游服务（API或微服务）的流量通常由各种Kong认证插件的应用程序和配置来控制。由于Kong的服务实体(Service Entity)代表自己的上游服务的1对1映射，最简单的方案是在选择的服务上配置认证插件。

## 1、通用认证

最常见的情况是需要身份验证，并且不允许访问任何未经身份验证的请求。要实现这一点，可以使用任何身份验证插件。这些插件的通用方案/流程如下所示：

**1、** 向一个API或全局添加AUTH插件（无法将其应用于Consumer）；

**2、** 创建一个Consumer实体；

**3、** 为Consumer提供特定验证插件方案的身份验证凭据；

**4、** 现在，每当有请求进入时，Kong将检查提供的凭证（取决于auth类型），如果请求无法验证，它将阻止该请求，或者在header中添加使用者和凭证详细信息并转发请求；

上面的通用流程并不总是适用的，例如，当使用外部认证（如LDAP）时，则不会识别Consumer，只有凭证将被添加到转发的标头(forwarded headers)中。

在每个[插件的文档](https://konghq.com/plugins/)中都可以找到身份验证方法的特定元素和示例

## 2、Consumers

最简单的理解和配置consumer的方式是将其于用户进行一一映射,然而，对于这个并不重要。consumer的核心原则是你可以为其添加插件，从而自定义请求行为。所以你可能有移动APP，并为每个应用程序或其版本定义一个消费者。或者每个平台都有一个消费者，例如Android消费者，iOS消费者等。

这对Kong来说是一个不透明的概念，因此他们被称为“消费者”而不是“用户”。

## 3、匿名访问

在Kong 0.10.x版本之前，你可以将指定的API配置为仅允许经过身份验证的访问（通过插件来实现）或只允许匿名访问。也就是说，一个指定的API，不允许对于某些consumer实行身份验证，而对于另外的consumer实行匿名访问。

在0.10.x版本以后，这些限制取消了。Kong可以配置给定的服务(Service)以允许通过身份验证和匿名访问，你可以使用此配置为低速率限制的匿名用户授予访问权限，并向具有较高速率限制的已认证用户授予访问权限。

要这样配置服务，您首先应用所选的身份验证插件，然后创建一个新的Consumer来表示匿名用户，然后配置您的身份验证插件以允许匿名访问。

这里是一个例子，假设你已经配置了一个名为example-service的Service和相应的Route：

### 3.1、创建示例Service和Route

发出以下CURL请求来创建指向mockbin.org的example-service，它将响应请求：

```sh
$ curl -i -X POST \
  --url http://localhost:8001/services/ \
  --data 'name=example-service' \
  --data 'url=http://mockbin.org/request'
```

向服务添加一条路由：

```sh
$ curl -i -X POST \
  --url http://localhost:8001/services/example-service/routes \
  --data 'paths[]=/auth-sample'
```

urlhttp://localhost:8000/auth-sample 现在会回应正在请求的内容

### 3.2、为服务配置key-auth插件

执行以下curl请求来向服务添加一个插件：

```sh
$ curl -i -X POST \
  --url http://localhost:8001/services/example-service/plugins/ \
  --data 'name=key-auth'
```

记住创建的插件id ，步骤5会用到。

### 3.3、验证key-auth插件是否配置正确

发出下面curl请求验证key-auth插件是否正确配置在服务上：

```sh
$ curl -i -X GET \
  --url http://localhost:8000/auth-sample
```

由于未在header或parameter指定所需的apikey，并且尚未启用匿名访问，所以响应应为403 Forbidden：

```sh
HTTP/1.1 403 Forbidden
...
{
  "message": "No API key found in headers or querystring"
}
```

### 3.4、创建匿名consumer

由Kong代理的每个请求都必须与消费者关联。现在您将创建一个名为anonymous_users的消费者（Kong将在代理匿名访问时使用），方法是发出以下请求：

```sh
$ curl -i -X POST \
  --url http://localhost:8001/consumers/ \
  --data "username=anonymous_users"
```

你将会看到类似下面的Response:

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

记住这个Consumer id, 后面的步骤将会用到。

### 3.5、启用匿名访问

现在将重新配置key-auth插件以允许通过发出以下请求来进行匿名访问（将步骤2和4中的uuid值替换为以下示例uuids）

```sh
$ curl -i -X PATCH \
  --url http://localhost:8001/plugins/<your-plugin-id> \
  --data "config.anonymous=<your-consumer-id>"
```

`config.anonymous = `参数表示本服务上的key-auth插件允许匿名访问，并将此访问与我们在上一步中收到的Consumer id相关联。在此步骤中提供有效且预先存在的Consumer id - 在配置匿名访问时，不会对consumer的id进行检验，如果配置了一个不存在的或错误的consumer id，则会导致配置错误插件不能正常运行。

### 3.6、验证匿名访问

通过发出以下请求确认您的服务现在允许匿名访问：

```sh
$ curl -i -X GET \
  --url http://localhost:8000/auth-sample
```

这与步骤＃3中做出的请求相同，但是这次请求应该成功，因为在步骤＃5中启用了匿名访问。

Response 大致包含这些字段：

```json
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

请求返回成功，但是是匿名访问。

## 4、多重验证

Kong支持给定服务的多个身份验证插件，允许不同的客户端使用不同的身份验证方法访问给定的服务或路由。

在评估多个身份验证凭证时，可以将auth插件的行为设置为执行逻辑AND或逻辑OR。该行为的关键是配置config.anonymous属性。

- config.anonymous默认未设置，如果此属性未设置（空），则验证插件将始终执行验证，如果未验证，则返回40x响应。当多个auth插件被调用时，这会导致逻辑AND。
- config.anonymous 设置为有效的consumer ID。在这种情况下，auth插件只有在尚未认证的情况下才会执行身份验证。当身份验证失败时，它不会返回40x响应，而是将匿名consumer设置为consumer。当调用多个验证插件时，会使用OR+匿名。

note1：所有的或任何一个验证插件都可配置为可使匿名访问的。但是，如果要混合使用验证插件，则对于匿名访问的配置就需要进行甄选，否则会出现混乱。

note2：如果使用AND逻辑，则最后一个执行的验证插件将是把验证信息传递给上游服务的那个。当使用OR逻辑时，传递给上游服务验证信息的那个插件，将会是第一个成功验证consumer的那个插件，或者是最后一个配置了匿名访问权限的那个插件。

note3：当以AND方式使用OAuth2插件时，用于请求token等的OAuth2端点也需要其他配置的auth插件进行身份验证。

注意：

当在给定服务上以OR方式启用多个身份验证插件并且希望匿名访问被禁止时，则应该在匿名消费者上配置[request-termination插件](https://getkong.org/plugins/request-termination/)，不然会允许未经授权的请求。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://www.cnblogs.com/zhoujie/tag/kong/
