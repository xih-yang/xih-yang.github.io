# 03、API 网关 Kong Proxy规则
- 来源：https://ddkk.com/zhuanlan/gateway/kong/d-1/3.html
- 分类：API网关
- 分组：KONG 教程（版本 A）
本篇详细记录了Kong的代理功能及其路由功能和内部工作。

Kong公开了几个可以通过两个配置属性进行调整的接口：

proxy_listen，默认8000，它定义Kong将接受来自客户端的公共流量并将其代理到您的上游服务的地址/端口列表。

admin_listen，默认8001，它还定义了一个地址和端口列表，但这些列表应该仅限于管理员访问，因为它们揭示了Kong的配置功能：Admin API

注意：从kong v0.13.0开始，API实体已被弃用。本文档将介绍新的路由和服务实体的代理。

## 一些术语

client：指下游客户向Kong的代理端口发出请求。

upstream service：指自己的API /服务，位于Kong后面，客户请求被转发到该服务。

service：服务实体，顾名思义，是对自己的每个上游服务的抽象。服务的例子可以是数据转换微服务，账单API等。

route：这是指Kong Routes实体。路由是进入Kong的入口点，并为要匹配的请求定义规则，并路由到给定的Service。

plugin：这是指Kong的“插件”，它是在代理生命周期中运行的业务逻辑。可以通过ADMIN API配置插件 - 全局（所有传入流量）或特定的路由和服务。

## 概览

从上层角度看，Kong在其配置的代理端口（默认情况下为8000和8443）上侦听HTTP流量。 Kong会根据你配置的路由评估任何传入的HTTP请求，并尝试找到匹配的路由。如果某个请求符合特定路由的规则，Kong将处理代理请求。由于每条路由都与一个服务链接，因此Kong将运行您在路由及其相关服务上配置的插件，然后向上游代理请求。

您可以通过Kong的Admin API管理routes，路由的hosts，paths和methods属性定义匹配传入HTTP请求的规则。

如果Kong收到无法匹配任何已配置路由的请求（或者没有配置路由），则它将以下列情况作出响应：

```sh
HTTP/1.1 404 Not Found
Content-Type: application/json
Server: kong/<x.x.x>
{
    "message": "no route and no API found with those values"
}
```

注意：这个消息提到了“API”，因为为了向后兼容的原因，Kong 0.13仍然支持API实体（并且如果没有首先匹配任何路由，则尝试匹配针对任何配置的API的请求）。

Kong是一个透明的代理，默认情况下它会将请求转发给上游服务，但HTTP规范要求的各种头文件（例如Connection，Date和其他头文件）除外

关于如何通过配置Route和Service来代理到一个上游服务，参考上一篇[admin-api](https://www.cnblogs.com/zhoujie/p/kong2.html)配置示例说明

## 路由匹配规则

现在看下Kong如何将请求与路由的配置hosts, paths and methods属性（或字段）进行匹配，注意：这三个字段都是可选的，但至少必须指定其中的一个。

匹配一个route的请求：

- 该请求必须包含所有配置的字段
- 请求中字段的值必须至少匹配一个配置的值（虽然字段配置接受一个或多个值，但请求只需要其中一个值被视为匹配）

例子：如下配置的route如何匹配：

```json
{
    "hosts": ["example.com", "foo-service.com"],
    "paths": ["/foo", "/bar"],
    "methods": ["GET"]
}
```

下面是与此路由匹配的一些请求：

```sh
GET /foo HTTP/1.1
Host: example.com
```

```sh
GET /bar HTTP/1.1
Host: foo-service.com
```

```sh
GET /foo/hello/world HTTP/1.1
Host: example.com
```

这三个请求都满足路径定义中设置的所有条件但是，以下请求不符合配置的条件：

```sh
# 未指定paths
GET / HTTP/1.1
Host: example.com
```

```sh
# method不匹配
POST /foo HTTP/1.1
Host: example.com
```

```sh
# request host header不匹配
GET /foo HTTP/1.1
Host: foo.com
```

### 1.请求主机头-Request Host header

根据Host头来路由请求是通过Kong代理流量的最直接的方式，这是HTTP Host头的预期用法。 Kong通过

主机接受多个值，当通过管理API指定时，它们必须以逗号分隔。

主机接受多个值，这在JSON payload中很简单：

```sh
$ curl -i -X POST http://localhost:8001/routes/ \
    -H 'Content-Type: application/json' \
    -d '{"hosts":["example.com", "foo-service.com"]}'
HTTP/1.1 201 Created
...
```

但由于Admin API也支持form-urlencoded content types，所以可以通过[]表示法指定一个数组：

```sh
$ curl -i -X POST http://localhost:8001/routes/ \
    -d 'hosts[]=example.com' \
    -d 'hosts[]=foo-service.com'
HTTP/1.1 201 Created
...
```

为了满足此route的hosts条件，来自客户端的任何传入请求现在必须将其主机头设置为以下之一：

```sh
Host: example.com
或
Host: foo-service.com
```

#### 1.1 使用通配符主机名

为了提供灵活性，Kong允许在hosts字段中指定带有通配符的主机名。通配符主机名允许任何匹配的主机头部满足条件，从而匹配给定的路由。通配符主机名在domain的最左侧或最右侧标签中只能包含一个*

例如：
* .example.com将允许主机值（如a.example.com和x.y.example.com）匹配。

example.*将允许诸如example.com和example.org的主机值匹配。

例如路由中指定如下hosts：

```json
{
    "hosts": ["*.example.com", "service.com"]
}
```

将允许以下请求匹配此route：

```sh
GET / HTTP/1.1
Host: an.example.com
```

```sh
GET / HTTP/1.1
Host: service.com
```

#### 1.2 preserve_host属性

代理时，Kong的默认行为是将上游请求的主机头设置为Service主机中指定的主机名。 preserve_host字段接受一个布尔标志，默认false,指示Kong不这样做。

例如，如果preserve_host属性未更改且route配置如下：

```json
{
    "hosts": ["service.com"],
    "service": {
        "id": "..."
    }
}
```

客户端可能向kong发出的一个请求：

```sh
GET / HTTP/1.1
Host: service.com
```

Kong会从Service's host属性中提取主机头值，并发送以下上游请求：

```sh
GET / HTTP/1.1
Host: <my-service-host.com>
```

但是，通过使用preserve_host = true明确配置路由：

```json
{
    "hosts": ["service.com"],
    "preserve_host": true,
    "service": {
        "id": "..."
    }
}
```

假设来自客户端的相同请求：

```sh
GET / HTTP/1.1
Host: service.com
```

Kong将保留客户端请求的主机，并将发送以下上游请求：

```sh
GET / HTTP/1.1
Host: service.com
```

### 2.请求路径-Request path

路由匹配的另一种方式是通过请求路径，为了满足此路由条件，客户端请求的路径必须以路径属性值之一作为前缀。

例如，使用如下配置的Route：

```json
{
    "paths": ["/service", "/hello/world"]
}
```

下面这些请求将会匹配：

```sh
GET /service HTTP/1.1
Host: example.com
```

```sh
GET /service/resource?param=value HTTP/1.1
Host: example.com
```

```sh
GET /hello/world/resource HTTP/1.1
Host: anything.com
```

对于这些请求中的每一个，Kong都会检测到它们的URL路径前缀有一个路由路径值。默认情况下，Kong会在不改变URL路径的情况下向上游代理请求。

使用路径前缀进行代理时，首先会评估最长的路径。这使您可以定义两条路径：/service 和 /service/resource。

#### 2.1 在path中使用正则表达式

Kong通过PCRE（Perl Compatible Regular Expression）支持路径字段的正则表达式模式匹配。

可以同时将路径作为前缀和正则表达式分配给路由，如下面的路由配置：

```json
{
    "paths": ["/users/\d+/profile", "/following"]
}
```

下面这些请求将会匹配这条路由：

```sh
GET /following HTTP/1.1
Host: ...
```

```sh
GET /users/123/profile HTTP/1.1
Host: ...
```

使用PCRE标志（PCRE_ANCHORED）评估提供的正则表达式，这意味着它们将被限制为匹配路径中的第一个匹配点（根/字符）

#### 2.1.1 评估（匹配）顺序

如前所述，Kong根据长度评估前缀路径：首先评估最长的前缀路径。但是，Kong将根据路由的regex_priority属性评估正则表达式路径。

这意味着考虑以下路线：

```sh
[
    {
        "paths": ["/status/\d+"],
        "regex_priority": 0
    },
    {
        "paths": ["/version/\d+/status/\d+"],
        "regex_priority": 6
    },
    {
        "paths": ["/version"],
        "regex_priority": 3
    },
]
```

在这种情况下，Kong将按照以下顺序针对以下定义的URI评估传入请求：

**1、** /version；

**2、** /version/\d+/status/\d+；

**3、** /status/\d+；

前缀路径总是先评估。

像往常一样，请求必须仍然与路由的主机和方法属性相匹配，并且Kong将遍历您的路由，直到找到与最多规则匹配的路由

#### 2.1.2 捕获组

支持捕获组，并且匹配的组将从路径中提取并可供插件使用。如果我们考虑以下正则表达式：

```sh
/version/(?<version>\d+)/users/(?<user>\S+)
```

请求路径如下：

```sh
/version/1/users/john
```

Kong将认为该请求路径匹配，并且如果总体路由匹配（考虑hosts和methods字段），解压缩的捕获组将可以从ngx.ctx变量的插件中获得:

```sh
local router_matches = ngx.ctx.router_matches
-- router_matches.uri_captures is:
-- { "1", "john", version = "1", user = "john" }
```

#### 2.1.3 转义特殊字符

接下来，值得注意的是，在正则表达式中找到的字符通常是根据RFC 3986的保留字符，因此应该使用percent-encoded。通过管理API配置正则表达式路径时，请确保在必要时对您的payload进行URL编码。例如，使用curl并使用application/x-www-form-urlencoded MIME 类型：

```sh
$ curl -i -X POST http://localhost:8001/routes \
    --data-urlencode 'uris[]=/status/\d+'
HTTP/1.1 201 Created
...
```

注意，curl不会自动对payload进行URL编码，并且请注意--data-urlencode的用法，该操作可防止+字符被URL解码，并将其解释为Kong's Admin API的空间。

#### 2.2 strip_path属性

可能需要指定一个path前缀来匹配Route，但不会将其包含在上游请求中。为此，请通过配置Route来使用strip_path布尔属性，如下所示：

```json
{
    "paths": ["/service"],
    "strip_path": true,
    "service": {
        "id": "..."
    }
}
```

启用此标志将指示Kong在匹配此路由并继续处理代理服务时，不应在上游请求的URL中包含匹配的URL路径部分。

例如，以下客户端对上述路由的请求：

```sh
GET /service/path/to/resource HTTP/1.1
Host: ...
```

将导致Kong发送以下上游请求：

```sh
GET /path/to/resource HTTP/1.1
Host: ...
```

同样，如果在启用strip_path的Route上定义了正则表达式路径，则请求URL匹配序列的全部内容将被删除。

例：

```json
{
    "paths": ["/version/\d+/service"],
    "strip_path": true,
    "service": {
        "id": "..."
    }
}
```

以下HTTP请求与提供的正则表达式路径匹配：

```sh
GET /version/1/service/path/to/resource HTTP/1.1
Host: ...
```

kong将上游代理为：

```sh
GET /path/to/resource HTTP/1.1
Host: ...
```

### 3.请求HTTP方法-Request HTTP method

方法字段允许根据HTTP方法匹配请求。它接受多个值。它的默认值是空（HTTP方法不用于路由）。

下面端路由允许通过GET/HEAD方法进行路由：

```json
{
    "methods": ["GET", "HEAD"],
    "service": {
        "id": "..."
    }
}
```

下面的请求匹配上述路由：

```sh
GET / HTTP/1.1
Host: ...
```

```sh
HEAD /resource HTTP/1.1
Host: ...
```

上述路由不匹配POST和DELETE请求。

在路由上配置插件时，这可以实现更细的粒度。例如，可以设想两个路由指向相同的服务：一个具有无限的未经身份验证的GET请求，另一个只允许经过身份验证和速率限制的POST请求（通过将身份验证和速率限制插件应用于此类请求）。

## 匹配优先级

Route可以根据hosts，paths和methods字段定义匹配规则。为了使Kong将传入请求匹配到Route，必须满足所有现有字段。然而，Kong通过允许两个或多个路由配置包含相同值的字段来允许相当大的灵活性 - 当发生这种情况时，Kong应用优先级规则。

规则是：在评估请求时，Kong将首先尝试将路线与大部分规则进行匹配。

例如，如下两个路由配置：

```json
{
    "hosts": ["example.com"],
    "service": {
        "id": "..."
    }
},
{
    "hosts": ["example.com"],
    "methods": ["POST"],
    "service": {
        "id": "..."
    }
}
```

第二个Route有一个hosts字段和一个methods字段，因此它将首先被Kong评估。通过这样做，避免了第一个路由覆盖掉第二个。

因此，这个请求将匹配第一条路线：

```sh
GET / HTTP/1.1
Host: example.com
```

下面这个匹配第二个路由：

```sh
POST / HTTP/1.1
Host: example.com
```

按照这个逻辑，如果第三个Route要配置一个hosts字段，一个methods字段和一个uris字段，它将首先由Kong评估。

## 代理行为

上面的代理规则详细说明了Kong如何将传入请求转发给您的上游服务。在下面，详细介绍在一个HTTP请求与注册路由匹配的时间与请求的实际转发之间发生的内部事件。

### 1、负载均衡

Kong通过上游服务的实例池分发代理请求来实现负载平衡功能。

更多负载均衡见下篇

### 2、插件执行

Kong可以通过“插件”进行扩展，这些插件将自己hook在代理请求的request/response生命周期中。插件可以在您的环境中执行各种操作或对代理请求进行转换。

插件可以配置为全局运行（适用于所有代理流量）或特定的路由和服务。在这两种情况下，您都必须通过ADMIN API创建插件配置。

一旦route匹配（及其关联的services），Kong将运行与这些实体中的任何一个相关联的插件。配置在route上的插件会先于service上的插件运行。

这些配置的插件将运行他们的访问阶段，见后篇 插件开发指南

### 3、代理与上游超时

一旦Kong执行了所有必要的逻辑（包括插件），就可以将请求转发给您的上游服务。这是通过Nginx的ngx_http_proxy_module完成的。可以通过服务的以下属性为Kong和给定的上游之间的连接配置所需的超时时间：

属性
描述

upstream_connect_timeout
以毫秒为单位定义建立到上游服务的连接的超时时间。默认为60000

upstream_send_timeout
以毫秒为单位定义两次连续写入操作之间的超时，用于向上游服务发送请求。默认为60000

upstream_read_timeout
以毫秒为单位定义两个连续读取操作之间的超时，用于接收来自上游服务的请求。默认为60000

Kong将通过HTTP / 1.1发送请求，并设置以下标题：

属性
描述

Host:
 如前所述

Connection: keep-alive
允许重新使用上游连接

X-Real-IP:
其中$remote_addr是由ngx_http_core_module提供的具有相同名称的变量。请注意，$remote_addr很可能被ngx_http_realip_module覆盖

X-Forwarded-For:
其中是由ngx_http_realip_module提供的$realip_remote_addr的内容附加到具有相同名称的请求标头

X-Forwarded-Proto:
 是客户端使用的协议。在$realip_remote_addr是可信地址之一的情况下，如果提供相同名称的请求头，则会被转发。否则，将使用由ngx_http_core_module提供的$scheme变量的值。

X-Forwarded-Host:
 是客户端发送的主机名。在$realip_remote_addr是可信地址之一的情况下，如果提供相同名称的请求头，则会被转发。否则，将使用由ngx_http_core_module提供的$ host变量的值。

X-Forwarded-Port:
 是接受请求的服务器的端口。在$realip_remote_addr是可信地址之一的情况下，如果提供相同名称的请求头，则会被转发。否则，将使用ngx_http_core_module提供的$ server_port变量的值。

所有其他的请求头文件都是由Kong原封不动地转发。

使用WebSocket协议时会产生一个例外，Kong将设置以下标题以允许升级客户端和上游服务之间的协议：

```sh
Connection: Upgrade
Upgrade: websocket
```

### 4、错误和重试

在代理期间发生错误时，Kong将使用底层的Nginx重试机制将请求传递到下一个上游。

这里有两个可配置的元素：

**1、** 重试次数：这可以使用retries属性为每个服务进行配置，有关详情，请参阅AdminAPI；

**2、** 究竟是什么构成了一个错误：这里Kong使用Nginx默认值，这意味着在建立与服务器的连接，传递请求或读取响应头文件时发生错误或超时；

第二个基于Nginx的[proxy_next_upstream] [proxy_next_upstream]指令。该选项不能直接通过Kong配置，但可以使用自定义Nginx配置添加。详见后续配置参考篇

### 5、响应

Kong从上游服务接收响应，并以流媒体方式将其发送回下游客户端。此时，Kong将执行添加到Route和/或Service中的后续插件，这些插件在header_filter阶段实现挂钩（hook）。

所有已注册插件的header_filter阶段执行完毕后，Kong将添加以下标题，并将全套标题发送给客户端：

- Via：kong/x.x.x，其中x.x.x是正在使用的Kong版本
- X-Kong-Proxy-Latency：``，其中latency表示Kong从客户端收到请求并将请求发送到上游服务之间的时间（以毫秒为单位）。
- X-Kong-Upstream-Latency：``，其中latency是Kong等待上游服务响应的第一个字节的时间（以毫秒为单位）。

一旦头文件被发送到客户端，Kong将开始为执行body_filter hook的Route或Service执行已注册的插件。由于Nginx的流媒体特性，该hook可能会被多次调用。由body_filter hook成功处理的每个上游响应块都会发送回客户端。

## 配置回退路由(fallback route)

作为Kong代理功能所提供的灵活性的一个实际用例和实例，“回退路由”为了避免Kong用HTTP 404响应“no route found”，我们可以捕获请求并将它们代理到一个特殊的上游服务，或者向它应用一个插件（例如，这样一个插件可以用不同的状态码或响应终止请求，而不用代理请求）。

这是一个这样的回退路线的例子：

```json
{
    "paths": ["/"],
    "service": {
        "id": "..."
    }
}
```

对Kong的任何HTTP请求实际上都会匹配这个Route，因为所有的URI都以根字符/作为前缀。正如我们从request path部分了解到的，最长的URL路径首先由Kong评估，因此/ path最终将由Kong最后评估，并有效地提供“fallback”Route，仅作为最后的手段匹配。然后，您可以将流量发送到特殊服务，或者在此路线上应用您希望的任何插件。

## 配置路由的SSL

Kong提供了一种在每个连接的基础上动态提供SSL证书的方法。 SSL证书由core直接处理，并可通过ADMIN API进行配置。通过TLS连接到Kong的客户端必须支持SNI(Server Name Indication)扩展才能使用此功能。

SSL证书由Kong Admin API中的两个资源处理：

- /certificates，存储您的密钥和证书。
- /snis，它将注册证书与服务器名称指示关联起来。

以下是如何在给定route上配置SSL证书：首先，通过Admin API上传您的SSL证书和密钥：

```sh
$ curl -i -X POST http://localhost:8001/certificates \
    -F "cert=@/path/to/cert.pem" \
    -F "key=@/path/to/cert.key" \
    -F "snis=ssl-example.com,other-ssl-example.com"
HTTP/1.1 201 Created
...
```

snis表单参数是一个参数，直接插入SNI并将上传的证书关联到它。

在Kong注册以下route，为了方便起见，我们仅使用主机头将请求匹配到此路由：

```sh
$ curl -i -X POST http://localhost:8001/routes \
    -d 'hosts=ssl-example.com,other-ssl-example.com' \
    -d 'service.id=d54da06c-d69f-4910-8896-915c63c270cd'
HTTP/1.1 201 Created
...
```

现在可以预期Kong将通过HTTPS提供路由：

```sh
$ curl -i https://localhost:8443/ \
  -H "Host: ssl-example.com"
HTTP/1.1 200 OK
...
```

当建立连接并协商SSL握手时，如果客户端将ssl-example.com作为SNI扩展的一部分发送，则Kong将为先前配置的cert.pem证书提供服务。

### 限制客户端协议（HTTP/HTTPS）

routes具有protocols属性来限制他们应该监听的客户端协议。该属性接受一组值，可以是http或https。

无论客户端连接的协议（纯文本还是通过TLS），使用http和https的路由都将接受流量：

```json
{
    "hosts": ["..."],
    "paths": ["..."],
    "methods": ["..."],
    "protocols": ["http", "https"],
    "service": {
        "id": "..."
    }
}
```

不指定https具有相同的效果，路由将接受纯文本和TLS（transport layer security）流量：

```json
{
    "hosts": ["..."],
    "paths": ["..."],
    "methods": ["..."],
    "protocols": ["http"],
    "service": {
        "id": "..."
    }
}
```

但是，只有https的路由才会接受通过TLS的流量。如果先前从可信IP发生SSL终止，它也会接受未加密的流量。如果请求来自trusted_ips中配置的IP之一，并且X-Forwarded-Proto：https头已设置，则SSL终止被认为是有效的：

```json
{
    "hosts": ["..."],
    "paths": ["..."],
    "methods": ["..."],
    "protocols": ["https"],
    "service": {
        "id": "..."
    }
}
```

如果上述路由与请求相匹配，但该请求是纯文本而没有有效的SSL终止，则Kong会回应：

```sh
HTTP/1.1 426 Upgrade Required
Content-Type: application/json; charset=utf-8
Transfer-Encoding: chunked
Connection: Upgrade
Upgrade: TLS/1.2, HTTP/1.1
Server: kong/x.y.z
{"message":"Please use HTTPS protocol"}
```

## 代理WebSocket流量

Kong支持WebSocket流量，这要归功于底层的Nginx实现。当希望通过Kong在客户端和上游服务之间建立WebSocket连接时，必须建立WebSocket握手。这是通过HTTP升级机制完成的。

客户端请求对kong的要求：

```sh
GET / HTTP/1.1
Connection: Upgrade
Host: my-websocket-api.com
Upgrade: WebSocket
```

这使Kong将Connection和Upgrade报头转发给上游服务，而不是由标准HTTP代理的hop-by-hop性质而丢弃它们。WebSocket和TLS

### WebSocket和TLS

Kong将在其各自的http和https端口上接受ws和wss连接。要从客户端强制执行TLS连接，将Route的protocols属性设置为仅https。

当设置服务指向上游WebSocket服务时，应该仔细选择要在Kong和上游之间使用的协议。如果要使用TLS（wss），则必须使用Service协议属性中的https协议和适当的端口（通常为443）来定义上游WebSocket服务。要在没有TLS（ws）的情况下进行连接，则应该在协议中使用http协议和端口（通常为80）。

如果希望Kong终止SSL/TLS，则只能从客户端接受wss，但可以通过纯文本或ws代理上游服务。

参考：

[http://www.cnblogs.com/SummerinShire/p/6628021.html](http://www.cnblogs.com/SummerinShire/p/6628021.html)

现在基本了解了Kong的基本代理机制，从请求如何匹配路由，从路由到其相关服务，以及如何允许使用WebSocket协议或设置动态SSL证书，可以参考[github.com/Mashape/getkong.org](http://github.com/Mashape/getkong.org)上。

下一篇记录kong负载均衡

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://www.cnblogs.com/zhoujie/tag/kong/
