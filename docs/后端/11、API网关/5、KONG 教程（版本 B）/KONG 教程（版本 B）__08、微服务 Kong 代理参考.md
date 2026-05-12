# 08、微服务 Kong 代理参考
- 来源：https://ddkk.com/zhuanlan/gateway/kong/d-2/8.html
- 分类：API网关
- 分组：KONG 教程（版本 B）
Kong侦听四个端口的请求，默认情况是：

8000：此端口是Kong用来监听来自客户端的HTTP请求的，并将此请求转发到您的上游服务。这也是本教程中最主要用到的端口。

8443：此端口是Kong监听HTTP的请求的端口。该端口具有与8000端口类似的行为，但是它只监听HTTPS的请求，并不会产生转发行为。可以通过配置文件来禁用此端口。

8001：用于管理员对KONG进行配置的端口。

8444：用于管理员监听HTTPS请求的端口。

在本文中，我们将介绍Kong的路由功能，并详细说明8000端口上的客户端请求如何根据请求头、URI或HTTP被代理到配置中的上游服务。

## 1、基础术语

API：指Kong的API实例。您可以通过管理员身份配置您的API。

Plugin：他指的是Kong的“插件”，它们是在代理生命周期中运行的业务逻辑。可以通过管理员身份进行全局配置，也可针对每个API进行分别配置。

Client：指向Kong的代理端口发出请求的下游客户，即第三方客户端。

Upstream service：指的是位于Kong后面的您自己的API服务，客户端请求被转发的最终目的地。nginx中的上游服务器。

## 2、概述

从整体上来看，Kong侦听其配置的代理端口上的HTTP请求（默认为8000），并识别正在请求的是哪个上游服务，然后运行在该API上的配置插件（如果没有则不执行），并将上游的HTTP请求转发到您自己的API服务。

当客户端向代理端口发出请求时，Kong将根据API在KONG里的配置情况，来决定将请求传入到哪个上游服务中。 您可以在KONG里对每个API添加许多属性，但是有三个是必须要配置的，他们是hosts、uris和methods。如果KONG无法确定API请求的上游服务地址，则会返回一下内容：

```sh
HTTP/1.1 404 Not Found
Content-Type: application/json
Server: kong/<x.x.x>
{
    "message": "no API found with those values"
}
```

## 3、回忆下：如何向KONG添加一个API

在之前的[添加一个API](http://www.cnblogs.com/SummerinShire/p/6623802.html)的指南中，有学习过如何使用8001端口，在KONG服务中添加一个API的操作：

```sh
$ curl -i -X POST http://localhost:8001/apis/ \
    -d 'name=my-api' \
    -d 'upstream_url=http://my-api.com' \
    -d 'hosts=example.com' \
    -d 'uris=/my-api' \
    -d 'methods=GET,HEAD'
HTTP/1.1 201 Created
...
```

该代码表示用户成功在Kong里注册一个名为“my-api”的API，可通过访问“http://example.com”发送请求。它还指定了一些HTTP请求的属性，但请注意，这里有且只有一个HOST，URIS和METHODS属性。当完成此配置后，以后所有的符合此host、uris和methods的请求，都将由KONG来代理过滤转发。Kong是一个透明的代理，它会将请求转发给您的上游服务，除了添加诸如Connection之类的各种标题。

## 4、转发功能

现在我们来讨论一下，一个HTTP请求是如何与API配置属性（如host、uris、methods）相匹配的。需要注意的是，这三个字段（h、u、m）都是可选的，但至少要有一个被指定。对于客户端请求与API的匹配：

- 请求必须包含所有已配置的字段
- 请求中的字段值必须与至少一个已配置的值相匹配（尽管字段配置接受一个或多个值，请求只需要考虑匹配其中之一）

让我们来看几个例子。请看如下一个API配置：

```sh
{
    "name": "my-api",
    "upstream_url": "http://my-api.com",
    "hosts": ["example.com", "service.com"],
    "uris": ["/foo", "/bar"],
    "methods": ["GET"]
}
```

## 5、与该API相匹配的一些请求可能是：

```sh
GET /foo HTTP/1.1
Host: example.com
GET /bar HTTP/1.1
Host: service.com
GET /foo/hello/world HTTP/1.1
Host: example.com
```

以上的三个请求都满足API定义中设置的条件。但是，以下的几个请求则与配置的条件不匹配：

```sh
GET / HTTP/1.1
Host: example.com
POST /foo HTTP/1.1
Host: example.com
GET /foo HTTP/1.1
Host: foo.com
```

以上的三个请求只满足两个配置条件。第一个请求的URI不匹配，第二个请求的HTTP方法不匹配，第三个请求的Host头不匹配。

现在我们了解了hosts、uris、methods是如何一起工作的。下面我们来逐个了解他们是如何单独工作的。

### 1、请求的HOST头：

基于HOST头发送请求，是通过KONG发送请求的最直接的一种方式，这也是HOST头的基本用法之一。KONG使通过HOST访问API实体的流程更加简便快捷。HOSTS 接受多种参数，当使用管理员API进行请求时，需要将每个参数间用逗号分隔开来配置：

```sh
$ curl -i -X POST http://localhost:8001/apis/ \
    -d 'name=my-api' \
    -d 'upstream_url=http://test-api.com' \
    -d 'hosts=test-api.com,demo.com,service.com'
HTTP/1.1 201 Created
...
```

此时，客户端可使用 hosts=test-api.com, demo.com, service.com 中的任意一个HOST头对 my-api 进行访问，但不能缺省HOST的值。

### 1.1、使用通配符查找主机名

为了使代理更灵活，KONG允许使用通配符来配置HOSTS。通配符允许任何满足条件的HOST头对API实体进行访问。在配置通配符时，只允许在HOST的最左或最右配置一个星号（*），例如：

```sh
*.example.com ：允许类似于 a.example.com 或 a.b.example.com 等形式的HOST头访问。
example.*　：允许类似于 example.a 或 example.b.cn 等形式的HOST头访问。
```

一个完整的例子：

```sh
{
    "name": "test-api",
    "upstream_url": "http://test-api.com",
    "hosts": ["*.example.com", "service.com"]
}
```

匹配的HOST头请求类似于一下几种，但不限于一下的例子中的形式：

```sh
GET / HTTP/1.1
Host: an.example.com
GET / HTTP/1.1
Host: service.com
```

### 1.2、preserve_host属性

当启用代理时，KONG默认将API的 upstream_url 的值配置为上游服务主机的 host 。preserve_host提供一个boolean值，对KONG的这个行为进行限制。例如，当使用preserve_host的默认值进行配置时，API的配置信息大致为：

```sh
{
    "name": "my-api",
    "upstream_url": "http://my-api.com",
    "hosts": ["service.com"],
}
```

此时，客户端发送的请求信息格式大致为：

```sh
GET / HTTP/1.1
Host: service.com
```

KONG会从API的upstream_url中提取HOST值，在做代理时，会向上游服务发送类似的请求：

```sh
GET / HTTP/1.1
Host: my-api.com
```

然而，当管理员在配置API时，明确指定了preserver_host=true时：

```sh
{
    "name": "my-api",
    "upstream_url": "http://my-api.com",
    "hosts": ["service.com"],
    "preserve_host": true
}
```

并假设客户端发送了相同的请求：

```sh
GET / HTTP/1.1
Host: service.com
```

KONG将会保留客户端发送来的HOST值，在做代理时，会向上游服务发送以下的请求：

```sh
GET / HTTP/1.1
Host: service.com
```

### 2、请求URI

KONG将请求转发给上游服务的另一种方式，是通过配置uris属性来指定请求的URI值。uris可以配置多个值，此时客户端在进行请求时，必须选择uris中的一个值作为请求的前缀。

例如，如果API的配置为：

```sh
{
    "name": "my-api",
    "upstream_url": "http://my-api.com",
    "uris": ["/service", "/hello/world"]
}
```

以下的几种请求方式都可以对此API进行访问：

```sh
GET /service HTTP/1.1
Host: my-api.com
GET /service/resource?param=value HTTP/1.1
Host: my-api.com
GET /hello/world/resource HTTP/1.1
Host: anything.com
```

以上几种方式在进行请求时，KONG侦测到他们的前缀与API的uris属性值是匹配的，所以这些请求是可用的。

当uris属性配置好后，在进行请求时，KONG首先会取最长的uris值对URI进行匹配筛选，如果未匹配，然后才会取次长度的uris值进行匹配，依次类推，直到匹配成功为止或拒绝访问。譬如上面的例子里，在发送请求时，KONG首先会取 `/hello/world` 与请求uri进行匹配，如果未成功，才会继续取 `/service` 继续匹配工作。

### 2.1、strip_uri属性

在配置API的uris时，如果你希望隐藏上游服务的真实uri，并以另外的一种URI提供给客户端时，通过简单的配置API的strip_uri属性就可以实现。例如：

```sh
{
    "name": "my-api",
    "upstream_url": "http://my-api.com",
    "uris": ["/service"],
    "strip_uri": true
}
```

启用strip_uri属性来指示Kong在代理此API时，在上游请求的URI中不应包含匹配的URI前缀。针对上面的API配置，当客户端发送请求时

```sh
GET /service/path/to/resource HTTP/1.1
Host:
```

KONG代理到上游服务的真实uri为（此时的uri不包含uris中配置的内容）

```sh
GET /path/to/resource HTTP/1.1
Host: my-api.com
```

### 3、HTTP请求方法

从KONG 0.10版本开始，可以通过配置API的methods属性来指定客户端的请求。默认情况下，无论HTTP请求方式如何，Kong都会将请求将其代理到API的。但是，当配置methods属性后，只有HTTP请求方式匹配时才会被KONG代理。methods属性可以配置多个值：

```sh
{
    "name": "api-1",
    "upstream_url": "http://my-api.com",
    "methods": ["GET", "HEAD"]
}
```

以下的两种HTTP请求方式都可以被代理

```sh
GET / HTTP/1.1
Host:
HEAD /resource HTTP/1.1
Host:
```

但是不会匹配POST或DELETE等其他的请求方式。配置此属性，可以更细粒度的管理你的API。

## 代理的优先级

一个API可以通过配置hosts、uris和methods属性定义匹配规则。对于Kong来说，只有当所有的字段都匹配时，才会进行转发。然而，KONG允许两个或更多的API拥有相同的配置。此时，就涉及到请求的优先级问题了。

匹配优先级原则是：在评估请求时，Kong会首先与匹配规则最多的API进行匹配（when evaluating a request, Kong will first try to match the APIs with the most rules.）。例如有两个API的配置如下

```sh
{
    "name": "api-1",
    "upstream_url": "http://my-api.com",
    "hosts": ["example.com"]
},
{
    "name": "api-2",
    "upstream_url": "http://my-api-2.com",
    "hosts": ["example.com"],
    "methods": ["POST"]
}
```

api-2比api-1多了一个methods配置，所以KONG会最先将请求与api-2进行匹配。通过此配置，我们就能避免在请求api-2时，错误的转发到api-1。

此时，这个请求会被转发到api-1：

```sh
GET / HTTP/1.1
Host: example.com
```

而这个请求，会被转发到api-2：

```sh
POST / HTTP/1.1
Host: example.com
```

以此类推，如果一个api同时配置了hosts、methods、uris，则这个API会最先与请求进行匹配，他的优先级会是三个中最高的。

**代理行为**

上述内容详细讲述了KONG将请求代理到上游服务的代理规则。下面我们将详细说明，在KONG将请求转发到上游服务的这段时间内实际发生的一些事。

### 1、负载平衡

从KONG 1.10 版本开始，Kong继承实现了负载平衡的功能，可以将转发的请求分发到多个上游服务实例。在 Kong 0.10之前，一般情况下，Kong会将代理的请求转发到指定的upstream_url上，如果想实现服务的负载平衡，需要额外的工具来完成。您可以通过查阅负载平衡相关资料，找到更多有关向API添加负载平衡的信息。

### 2、插件扩展

使用者可以通过plugins来自定义扩展插件，并将插件应用到request/response的生命周期中。插件可以在您的生产环境中对代理行为进行多种操作。通过对插件进行配置，可以将插件应进行全局应用或针对个别API应用。如果对给定的某个或某些API应用了一个插件或多个插件，则在代理请求到上游服务前，会首先执行API的匹配，匹配成功后再执行定义的插件，当插件执行完后，如果满足天剑，才会将请求最终代理到上游服务中去。这里包含了插件的访问时段的概念，具体参考插件开发配置相关资料。

### 3、代理或请求超时

当KONG将所有的代理逻辑，包括API验证和插件等，都处理完后，才会将请求代理到上游服务。这些是通过Nginx的代理模块来实现的。从KONG 0.10开始，可以通过配置以下三个API属性来定义连接超时时间：

upstream_connect_timeout: 定义同上游服务建立连接的超时时间，单位是毫秒，默认值为60000.

upstream_send_timeout: 定义两个连续向上游服务发送的写入操作的超时时间，单位是毫秒，默认值为60000.

upstream_read_timeout: 定义两个连续向上游服务发送读取操作的超时时间，单位是毫秒，默认值为60000.

在使用HTTP/1.1时，KONG会默认添加以下请求头信息：

HOST：``

Connection：keep-alive : 允许重复使用上游连接

`X-REAL-IP:`: 参见 nginx_http_proxy_module.

`X-Forwarded-Proto:`: protocol是客户端使用的协议名

其他的请求头都按默认配置添加。

当使用WebSocket时，会有例外发生。如果发生，KONG允许通过以下请求头对协议进行升级：

Connection：Upgrade

Upgrade：WebSocket

### 4. Response

Kong接收上游服务的响应，并以流式方式将其发回下游客户端。此时，Kong将执行添加到该特定API的后续插件，并且这些插件继承了header_filter子句。当所有继承了header_filter的插件执行完后，以下的几种头信息将返回给客户端：

Via：kong/x.x.x KONG的版本信息，x.x.x是他的版本号。

`Kong-Proxy-Latency：`，其中 latency 表示Kong接收来自客户端的请求并将请求发送到上游服务所消耗的时间值（毫秒）。

`Kong-Upstream-Latency：`，其中 latency 表示Kong等待上游服务响应的第一个字节所消耗的时间数（毫秒）。

当headers发送到客户端后，Kong将执行此API上已注册的、继承了body_filter的插件。body_filter将上游返回的数据成功处理后，然后再发送给客户端。

## 配置一个fallback API

****默认情况下，当向KONG发送请求时，如果请求失败，KONG会返回 HTTP 404，“API not found” 等信息。为了避免这种情况的发生，我们可以通过配置 fallback API 实现自定义 “异常\错误” 信息。

下面是一个例子：

```sh
{
    "name": "root-fallback",
    "upstream_url": "http://www.error.page",
    "uris": ["/"]
}
```

观察此配置中的“uris”，会发现，此处配置“/”可以适配所有的请求，根据uris的匹配规则，每个请求都会首先匹配最长的uri，依次递减。所以当所有的uri都不匹配时，请求会自动转发到这里配置的上有服务中去，因此而实现了自定义 “异常\错误” 信息。

## 配置API的SSL

Kong提供了一种在每个连接的基础上动态提供SSL证书的方法。从0.10版本开始，SSL插件已被删除，SSL证书由内核直接处理，并可通过Admin API进行配置。你的客户端HTTP库必须支持SNI（[Server Name Indication](https://en.wikipedia.org/wiki/Server_Name_Indication)）扩展以确保SSL可用。

SSL证书由Kong Admin API的两个资源处理：

- /certificates存储您的密钥和证书。
- /snis将注册的证书与服务器名称指示相关联。

以下是为给定的API配置SSL证书的方法：

首先，通过Admin API上传SSL证书和密钥：

```sh
$ curl -i -X POST http://localhost:8001/certificates \
    -F "cert=@/path/to/cert.pem" \
    -F "key=@/path/to/cert.key" \
    -F "snis=ssl-example.com,other-ssl-example.com"
HTTP/1.1 201 Created
...
```

snis是加密参数，直接插入SNI并将上传的证书与之相关联。

您现在必须在Kong内注册以下API。为方便起见，我们将使用Host头将请求转发到此API：

```sh
$ curl -i -X POST http://localhost:8001/apis \
    -d "name=ssl-api" \
    -d "upstream_url=http://my-api.com" \
    -d "hosts=ssl-example.com,other-ssl-example.com"
HTTP/1.1 201 Created
...
```

好了，现在你可以向KONG发送HTTPs请求了：

```sh
$ curl -i https://localhost:8443/ \
  -H "Host: ssl-example.com"
HTTP/1.1 200 OK
...
```

### 1、https_only参数：

如果你希望仅通过HTTPS提供API，可以通过启用其https_only属性来实现：

```sh
$ curl -i -X POST http://localhost:8001/apis \
    -d "name=ssl-only-api" \
    -d "upstream_url=http://example.com" \
    -d "hosts=my-api.com" \
    -d "https_only=true"
HTTP/1.1 201 Created
...
```

这样配置后，KONG将拒绝代理非HTTPS的请求。如果此时使用HTTP请求来访问这个API，KONG会提示用户需要将客户端升级到HTTPS：

```sh
$ curl -i http://localhost:8000 \
    -H "Host: my-api.com"
HTTP/1.1 426
Content-Type: application/json; charset=utf-8
Transfer-Encoding: chunked
Connection: Upgrade
Upgrade: TLS/1.2, HTTP/1.1
Server: kong/x.x.x
{"message":"Please use HTTPS protocol"}
```

### 2、http_if_terminated参数：

当API被锁定在HTTPS请求时，如果你想在请求头信息中添加X-Forwarded-Proto，只要为API配置http_if_terminated属性即可：

```sh
$ curl -i -X PATCH http://localhost:8001/apis/ssl-only-api \
    -d "http_if_terminated=true"
HTTP/1.1 200 OK
...
```

并且我们使用X-Forwarded-Proto（假设它来自可信任的客户端）发出请求：

```sh
$ curl -i http://localhost:8000 \
    -H "Host: my-api.com" \
    -H "X-Forwarded-Proto: https"
HTTP/1.1 200 OK
...
```

Kong现在代理了这个请求，因为它假定你的体系结构的先前组件已经实现了SSL。

## 代理WebSocket

由于KONG的底层实现了Nginx，所以他也支持WebSocket。如果你希望在客户端和KONG之间建议一个WebSocket连接，那么你必须首先建立一个WebSocket握手。这个通过HTTP Upgrade机制完成。这个可以通过客户端对KONG进行操作，例如：

```sh
GET / HTTP/1.1
Connection: Upgrade
Host: my-websocket-api.com
Upgrade: WebSocket
```

此时，KONG会将Connection和Upgrade两个请求头转发到上游服务中去。

## 小结

通过本指南，希望你了解了Kong的底层代理相关的知识，从API的uris匹配，到如何使用WebSocket协议、为API配置SSL。如果想了解更多的相关知识，请参考Nginx的负载平衡相关内容。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://www.cnblogs.com/SummerinShire/category/861287.html
