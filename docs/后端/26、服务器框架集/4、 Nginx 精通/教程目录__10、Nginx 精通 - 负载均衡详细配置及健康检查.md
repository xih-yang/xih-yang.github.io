# 10、Nginx 精通 - 负载均衡详细配置及健康检查
- 来源：https://ddkk.com/zhuanlan/server/nginx/4/10.html
- 分类：服务器框架
- 分组：教程目录
负载均衡就是将前端过来的负载分发到两台或多台应用服务器。Nginx支持多种协议的负载均衡，包括http（s）、TCP、UDP（关于TCP、UDP负载均衡另文讲述）等。

**目录**

HTTP负载均衡

负载均衡策略

轮询

least_conn(最少连接)

hash（通用哈希）

ip_hash（IP 哈希）

random（随机）

被动健康检查

指令

upstream

server

zone

state

keepalive

keepalive_requests

keepalive_time

keepalive_timeout

queue

resolver

resolver_timeout

sticky

cookie

route

learn

ntlm

## HTTP负载均衡

针对应用层http协议的访问进行负载均衡。

http负载均衡模块是ngx_http_upstream_module 。

在http模块配置代码：

```java
# 统一定义负载均衡器，也可在Server中定义
upstream lb_srv {
	#lb_mode：负载均衡方式，默认是轮询。具体见后面对应章节
	[lb_mode]
   server配置格式：server host[:port] [weight=number] [max_conns=number] [[max_fails=number] [fail_timeout=time]] [backup] [down] [resolve] [route=string] [slow_start=time] [drain]
    host: 域名或ip
    port：指定端口，默认为80
    weight：权重，默认为1。分配方式：当前代理服务器分配比例=当前服务器权重值/所有服务器权重值之和
    max_conns：代理服务器的同时活动连接的最大数量。默认值为零，表示没有限制。如果启用了空闲保活连接，则到代理服务器的活动连接和空闲连接的总数可能会超过max_conns值
    max_fails：设置在fail_timeout参数设置的持续时间内，不成功通信超过该参数设置的次数，认为服务器在fail_timeout参数设置的一段持续时间内是不可用的。默认情况下，不成功的尝试次数设置为1。零值将禁用尝试计数
    fail_timeout：见max_fails。默认为10秒。
    backup：服务器标记为备份服务器。当主服务器不可用时，它将被传递请求
    down：服务器标记为不可用
    resolve：监控服务器域名对应的IP地址的变化，并自动修改配置，无需重新启动nginx。服务器组必须位于共享内存中。为了使此参数起作用，必须在http块或相应的上游块中指定解析器指令（resolve）。
    route：设置服务器路由名称
    slow_start：当不正常的服务器变得正常时，或者当服务器在被认为不可用的一段时间后变得可用时，服务器将其权重从0恢复到设置值的时间。默认值为0，即禁用慢速启动。
    drain：将服务器置于“draining”模式。该模式下，只有绑定到服务器的请求才会被代理到服务器。
    server 10.10.12.45:80 weight=1;
    server app.example.com:80 weight=2;
    server spare.example.com:80 backup;
}
server {
    location / {
    proxy_pass http://lb_srv;
 }
}
```

**负载均衡如何让来自同一客户端的请求传递到一组服务器中的同一服务器详见本文指令sticky。**

## 负载均衡策略

Nginx的负载均衡策略有如下几种。

### 轮询

轮询是默认的负载均衡方法，它按照上游池中服务器列表的顺序分发请求。当上游服务器的容量变化时，您还可以考虑使用加权轮询。权重的整数值越高，服务器在轮询中的优势就越大。权重背后的算法只是加权平均值的统计概率。该方法不需要指令，默认采用。

示例如下：

```java
upstream backend {
    server srv1.example.com weight=5;
    server srv2.example.com;
    server 127.0.0.1:8080       max_fails=3 fail_timeout=30s;
}
```

轮询方式：每5个请求，5个发给 srv1，1个发给srv2，1个发给127.0.0.1：8080

### least_conn(最少连接)

此方法通过将当前请求代理到打开连接数最少的上游服务器实现负载均衡。与轮询一样，在决定将连接发送到哪台服务器时，最少连接也会考虑权重。

指令格式：least_conn;

### hash（通用哈希）

管理员使用请求或运行时给定的文本、变量或两者的组合定义哈希值。NGINX 能够为当前请求生成哈希值并将其放在上游服务器上，从而在这些服务器之间分发负载。当您希望更好地控制请求的发送位置或确定哪台上游服务器最有可能缓存数据时，此方法就会派上用场。请注意，当从池中添加或删除服务器时，将重新分发哈希请求。可选参数consistent，它能够将重新分发带来的影响最小化。

指令格式：hash `key` [`consistent`];

key是hash运算的hash键值，可以包含文本、变量及其组合。正常情况下，在组中添加或删除服务器，可能会导致将大多数密钥重新映射到不同的服务器，如果指定`consistent参数，则只有少数密钥将被重新映射到不同的服务器。`

### ip_hash（IP 哈希）

此方法仅适用于 HTTP。IP 哈希算法固定使用客户端 IP 地址作为哈希。IP 哈希与通用哈希存在细微的不同，前者使用 IPv4 地址的前三个八进制位或整个 IPv6 地址，而后者使用的是远程变量。当会话状态十分重要，但又无法通过应用的共享内存进行处理时，此方法可确保客户端始终被代理到同一上游服务器（只要服务器可用）。可在server设置weight 参数，该策略会考虑。

指令格式：ip_hash;

### random（随机）

该方法用于指示 NGINX 从组中随机选择一台服务器，同时考虑服务器的权重。

指令格式：random [two [method]];

可选参数 two [method] 指示 NGINX 随机选择两台服务器，然后使用提供的负载均衡方法对两者均匀地分发请求。默认情况下，如果传输的参数只有 two，没有method，则使用 least_conn 方法，它将请求传递给具有最少活动连接数的服务器。least_time方法将请求传递给具有最少平均响应时间和最少活动连接数的服务器。如果指定了least_time=header，则使用接收响应标头的时间。如果指定了least_time=last_byte，则使用接收完整响应的时间。

## 被动健康检查

通过NGINX 健康检查和负载均衡确保只使用健康的上游服务器：

```java
upstream lb_srv{
    max_fails：设置在fail_timeout参数设置的持续时间内，不成功通信超过该参数设置的次数，认为服务器在fail_timeout参数设置的一段持续时间内是不可用的。默认情况下，不成功的尝试次数设置为1。零值将禁用尝试计数
    fail_timeout：见max_fails。默认为10秒。
    server backend1.example.com:1234 max_fails=3 fail_timeout=3s;
    server backend2.example.com:1234 max_fails=3 fail_timeout=3s;
}
```

此配置能够监控定向到上游服务器的客户端请求的响应，从而被动监控上游服务器的健康状况。该示例将 max_fails 指令设置为 3，将 fail_timeout 设置为 3 秒。这些指令参数在 stream 和 HTTP 服务器中的工作原理相同。

更强大的负载均衡功能（如Sticky Cookie、主动健康检查等）在Nginx Plus中提供。

## 指令

### upstream

格式：upstream name { ... }

定义一组服务器，name为服务器组名。服务器可以在不同的端口上侦听。此外，侦听TCP和UNIX域套接字的服务器可以混合使用。

如果请求在与服务器通信的过程中发生错误，则请求将传递给下一台服务器，依此类推，直到尝试所有正常运行的服务器为止。

### server

格式：server address [parameters];

定义服务器的地址和其他参数。地址可以指定为域名或IP地址，带有可选端口，也可以指定为在“UNIX：”前缀后指定的UNIX域套接字路径。如果没有指定端口，则使用端口80。解析为多个IP地址的域名一次定义多个服务器。

parameters参数如下：

`weight=number：设置权重值，默认为1`

`max_conns=number：限制到代理服务器的同时活动连接的最大数量。默认值为0，表示没有限制。如果服务器组不位于共享内存中，则每个工作进程都会受到限制。如果启用了空闲保活连接、多个工作进程和共享内存，则到代理服务器的活动和空闲连接的总数可能会超过max_conns值。`

`max_fails=number：在fail_timeout参数设置的持续时间内应该发生的与服务器通信的不成功尝试的次数，如果超过max_fails，则认为服务器在fail_time参数设置的一段持续时间内不可用。默认为1。零值将禁用失败尝试次数。`

`fail_timeout=time：该时间范围内，验证服务器通信不成功次数是否超过max_fails；如果超过，服务器将在接下来fail_timeout时间范围内被认为不可用。默认10秒。`

`backup：将服务器标记为备份服务器。当所有主服务器不可用时，请求将被传递到backup服务器；只要主服务器有一台可用，请求都不会传递到backup服务器。`

down：该服务器永久停用。

### zone

格式：zone name [size];

定义共享内存区域的名称和大小，用于保持工作进程之间共享的组的配置和运行时状态。多个组可能共享同一区域。

### state

格式：state file;

指定一个文件，用于保存服务器组的状态。

### keepalive

格式：keepalive connections;

设置到代理服务器的空闲连接保活的最大数量，这些连接保留在每个工作进程的缓存中。如果超过这个数字，则关闭最近使用最少的连接。需要特别注意的是，keepalive指令并没有限制nginx工作进程可以打开的与代理服务器的连接总数。

对于http反向代理，最好通过该参数控制，而不是使用客户端的头字段”Connection: Keep-Alive”。示例如下：

```java
upstream http_backend {
    server 127.0.0.1:8080;
    server 192.168.0.10:8080;
    keepalive 16;
}
server {
    ...
    location /http/ {
        proxy_pass http://http_backend;
        设置版本为http1.1，且清空Connection 
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        ...
    }
}
```

### keepalive_requests

格式：keepalive_requests number; 默认：keepalive_requests 1000;

设置可以通过一个保活连接提供服务的最大请求数。在发出最大数量的请求后，连接将关闭。定期关闭连接对于释放每个连接的内存分配是必要的。因此，使用过高的最大请求数可能会导致内存过度使用，因此不建议使用。

### keepalive_time

格式：keepalive_time time; 默认：keepalive_timeout 1h;

限制通过一个保活连接处理请求的最长时间。到达该时间后，连接将在随后的请求处理之后关闭。

### keepalive_timeout

格式：keepalive_timeout timeout; 默认：keepalive_timeout 60s;

设置一个超时，在此期间与代理服务器的空闲保活连接将保持在打开状态。

### queue

格式：queue number [timeout=time];

如果在处理请求时无法立即选择代理服务器，则该请求将被放入队列中。该指令指定队列中可以同时存在的最大请求数。如果队列已满，或者无法在超时参数中指定的时间段内选择要将请求传递到的服务器，则返回502（坏网关）错误给客户端。timeout默认时间60s

### resolver

resolver address ... [valid=time] [ipv4=on|off] [ipv6=on|off] [status_zone=zone];

当配置代理服务器用的是名称，resolver指把名称解析为地址的服务器，例如：

```java
resolver 127.0.0.1:5353;
```

address可以指定为域名或IP地址，并带有可选端口。如果未指定端口，则使用端口53。如果多台resolver，以循环方式查询。

默认情况下，nginx在解析时会同时查找IPv4和IPv6地址。如果不需要查找IPv4或IPv6地址，则可以指定IPv4=off或IPv6=off参数。

默认情况下，nginx缓存结果，有效期为响应的TTL值。valid参数可覆盖它。

可选的status_zone参数可用于收集指定区域中请求和响应的DNS服务器统计信息。

为防止DNS欺骗，建议resolver在安全可靠的本地网络中。

### resolver_timeout

格式：resolver_timeout time; 默认：resolver_timeout 30s;

resolver解析超时时间。

### sticky

启用会话相关性，可让来自同一客户端的请求传递到一组服务器中的同一服务器。

有三种方式：cookie、route、learn

#### cookie

格式：sticky cookie name [expires=time] [domain=domain] [httponly][samesite=strict|lax|none|$variable] [secure] [path=path];

当使用cookie方法时，指定服务器的信息会在nginx生成的HTTP cookie中传递。

```java
upstream backend {
    server backend1.example.com;
    server backend2.example.com;
    sticky cookie srv_id expires=1h domain=.example.com path=/;
}
```

未绑定cookie的客户端请求将传递给由配置的平衡方法选择服务器。使用cookie的请求将被传递到指定的服务器。如果指定的服务器无法处理请求，则会选择新服务器，就好像客户端尚未绑定一样。由于负载平衡方法总是试图考虑已绑定请求的情况下均匀分配负载，因此具有较高活动绑定请求数的服务器获得新的未绑定请求的可能性较小。

参数如下：

name：设置或检查的cookie的名称

expires=time：设置浏览器应保留cookie的时间。如果未指定该参数，则会导致cookie在浏览器会话结束时过期。

domain=domain：定义为其设置cookie的域。参数值可以包含变量。

httponly：将HttpOnly属性添加到cookie中。

samesite=strict|lax|none|$variable：使用以下值之一将SameSite属性添加到cookie中：Strict、Lax、None或某个变量。在后一种情况下，如果变量值为空，则SameSite属性将不会添加到cookie，如果值解析为Strict、La x或None，则会分配相应的值，否则会分配Strict值。

secure：将“secure”属性添加到cookie中。

path=path ：定义设置cookie的path字段值。

如果省略了任何参数，则不会设置相应的cookie字段。

#### route

格式：sticky route $variable ...;

当使用路由方法时，代理服务器在收到第一个请求时为客户端分配一个路由。来自该客户端的所有后续请求都将在cookie或URI中携带路由信息，Nginx将此信息与服务器指令的“route”参数进行比较，以确定请求应代理到的服务器。如果未指定“route”参数，则路由名称将是IP地址和端口的MD5哈希或UNIX域套接字路径的十六进制表示。如果指定的服务器无法处理请求，则通过配置的平衡方法选择新服务器，就好像请求中没有路由信息一样。

路由方法的参数指定可能包含路由信息的变量。第一个非空变量用于查找匹配的服务器。示例如下：

```java
# 根据jsessionid特征定义路由变量
map $cookie_jsessionid $route_cookie {
    ~.+\.(?P<route>\w+)$ $route;
}
# 根据URI特征定义路由变量
map $request_uri $route_uri {
    ~jsessionid=.+\.(?P<route>\w+)$ $route;
}
upstream backend {
    指定路由名
    server backend1.example.com route=a;
    server backend2.example.com route=b;
    路由匹配
    sticky route $route_cookie $route_uri;
}
```

#### learn

格式：sticky learn create=$variable lookup=$variable zone=name:size [timeout=time] [header] [sync];

learn模式下，nginx分析代理服务器响应，学习通常在HTTP cookie中传递的服务器启动的会话。各参数意义：

create：指定如何创建新会话的变量。可以被指定多次，使用第一个非空变量。

lookup：指定如何搜索现有会话的变量。可以被指定多次，使用第一个非空变量。

zone=name:size：定义会话存储共享内存区域的名称和大小。1M字节区域可以在64位平台上存储大约4000个会话。

timeout=time：在超时参数指定的时间内未访问的会话将从区域中删除。默认情况下，超时设置为10分钟。

header：允许在从代理服务器接收到响应头之后立即创建会话。

sync：使共享存储区域能够同步。

示例：

```java
upstream backend {
   server backend1.example.com:8080;
   server backend2.example.com:8081;
   sticky learn create=$upstream_cookie_examplecookie lookup=$cookie_examplecookie zone=client_sessions:1m;
}
```

#### ntlm

格式：ntlm;

允许使用NTLM身份验证代理请求。一旦客户端发送以“Negotiate”或“NTLM”开头的“Authorization”标头字段值的请求，代理服务器连接就会绑定到客户端连接。进一步的客户端请求将通过相同的代理服务器连接进行代理，保留身份验证上下文。

为了使NTLM身份验证工作，需启用代理服务器的保活连接、proxy_http_version指令应设置为“1.1”，并且应清除“Connection”标头字段。

示例如下：

```java
upstream http_backend {
    server 127.0.0.1:8080;
    server 192.168.0.10:8080;
    keepalive 16;
    ntlm;
}
server {
    ...
    location /http/ {
        proxy_pass http://http_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        ...
    }
}
```

这篇文章如果对您有所帮助或者启发的话，帮忙关注或点赞，有问题请评论，必有所复。您的支持是我写作的最大动力！
