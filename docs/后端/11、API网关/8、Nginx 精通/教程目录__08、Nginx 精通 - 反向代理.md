# 08、Nginx 精通 - 反向代理
- 来源：https://ddkk.com/zhuanlan/server/nginx/4/8.html
- 分类：服务器框架
- 分组：教程目录
**目录**

什么是反向代理

Nginx反向代理

配置指令

proxy_pass

proxy_set_header

proxy_connect_timeout

proxy_read_timeout

proxy_send_timeout

proxy_set_body

proxy_pass_request_body

proxy_pass_request_headers

内置变量

## 什么是反向代理

```plaintext
反向代理(Proxy)指用代理服务器接受外部的连接请求，然后将请求转发给真实提供服务的服务器，并将从服务器上得到的结果返回给请求连接的客户端。示意图如下：
```

反向代理好处如下：

- 保护目标服务器的资源安全：反向代理可以隐藏目标服务器的真实 IP 地址和端口，防止恶意用户直接攻击目标服务器。只有反向代理服务器对外可见，从而保护了目标服务器的资源安全。
- 节省有限的 IP 地址资源：由于公网 IPv4 地址资源有限，通过使用反向代理，可以将多个后端服务器（用内网ip地址即可）隐藏在同一个公网 IP地址后面。这样，可以节省 IP 地址资源并最大限度地提供服务。
- 可提供更好的服务体验：反代理服务器本身可提供非常多的附加功能，改善系统的整体服务体验，并节省系统建设成本，如高并发、缓存加速、安全保护等都可由代理服务器提供，而不是应用本身来考虑。
- 系统易扩展、易维护：反代理服务器后的真实服务器，可按需扩展；可按维护计划灵活维护，不影响外部使用体验。

## Nginx反向代理

```plaintext
Nginx初衷是解决C10K问题，因此天然就是反向代理服务器，在此基础上Nginx才可以实现负载均衡、缓存加速、SSL 终端、安全过滤等更多功能。  
反向代理功能由ngx\_http\_proxy\_module模块提供。  
反向代理例子如下：
```

```java
location / {
    指向被代理服务器
    proxy_pass       http://localhost:8000;
    设置转发请求头
    proxy_set_header Host      $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

```plaintext
反向代理配置相对简单，只需熟练掌握相关指令即可。
```

## 配置指令

### proxy_pass

proxy_pass设置被代理服务器的协议和地址，以及位置应映射到的可选URI，例如：

```java
proxy_pass http://localhost:8000/uri/;
```

各部分拆开说明如下：

**1、** 协议可以指定“http”或“https”；

**2、** 地址可以指定为域名+可选端口如果一个域名解析为多个地址，则所有地址都将以循环方式使用；

**3、** 地址可以指定为IP地址+可选端口；

**4、** 地址可以指定为服务器组（负载均衡组名）；

**5、** uri各种情况：；

**5、** 1没有URI，则在处理原始请求时，请求URI将以客户端发送的相同形式传递给服务器，或者在处理更改后的URI时，传递完整的规范化请求URI，例如：；

```java
# ”/some/path/“及之后部分完整附加在被代理服务器地址后，如http://127.0.0.1/some/path/...
location /some/path/ {
    proxy_pass http://127.0.0.1;
}
```

**5、** 2如果URI不为空，那么请求传递到服务器时，规范化请求URI中与位置匹配的部分将被指令中指定的URI替换，例如：；

```java
# 请求中的”/name/“被”/remote/“替换
location /name/ {
    proxy_pass http://127.0.0.1/remote/;
}
```

**5、** 3、其它情况；

**5、** 3.1使用正则表达式指定位置时，可以在命名位置内指定位置该种情况下，应该在没有URI的情况下指定proxy_pass；

**5、** 3.2当使用[rewrite](https://blog.csdn.net/davidwkx/article/details/134086617)指令在代理位置内更改URI时，将使用相同的配置来处理请求（break）：；

```java
location /name/ {
    rewrite    /name/([^/]+) /users?name=$1 break;
    在这种情况下，将忽略指令中指定的URI，并将更改后的完整请求URI传递给服务器
    proxy_pass http://127.0.0.1;
}
```

**5、** 3.3在proxy_pass中使用变量，如果在指令中指定了URI，则会按原样将其传递给服务器，从而替换原始请求URI如：；

```java
location /name/ {
    proxy_pass http://127.0.0.1$request_uri;
}
```

### proxy_set_header

格式：proxy_set_header field value;

proxy_set_header 允许在传递给被代理服务器的请求头中重新定义或附加字段。该值可以包含文本、变量及其组合。当且仅当在当前级别上没有定义proxy_set_header指令时，这些指令才会从以前的配置级别继承。默认情况下，只有两个字段被重新定义：

```java
proxy_set_header Host       $proxy_host;
proxy_set_header Connection close;
```

一些注意情况：

**1、** 如果value用内置变量，但客户端请求头中不存在此字段，则不会传递任何内容；

**2、** 如果头字段的值为空字符串，则此字段将不会传递给代理服务器如：；

```java
proxy_set_header Accept-Encoding "";
```

**3、** 如果启用了缓存，则原始请求中的头字段“IfModifiedSince”、“IfUnmodifiedSince”，“IfNoneMatch”、“IfMatch”，“Range”和“IfRange”不会传递给代理服务器；

### proxy_connect_timeout

proxy_connect_timeout time;默认60s-定义与代理服务器建立连接的超时。需要注意的是，此超时通常不能超过75秒。

### proxy_read_timeout

proxy_read_timeout time;默认60s-定义从被代理服务器读取响应的超时时间。超时仅在两个连续读取操作之间设置，不用于传输整个响应。如果被代理服务器在此时间内没有传输任何内容，则连接将关闭。

### proxy_send_timeout

proxy_send_timeout time;默认60s-设置将请求传输到被代理服务器的超时时间。超时仅在两个连续写入操作之间设置，不用于传输整个请求。如果代理服务器在此时间内没有接收到任何内容，则连接将关闭。

### proxy_set_body

proxy_set_body value; 允许重新定义传递给代理服务器的请求正文。该值可以包含文本、变量及其组合。

### proxy_pass_request_body

proxy_pass_request_body on | off;默认on;指示原始请求正文是否传递给代理服务器。

### proxy_pass_request_headers

proxy_pass_request_headers on | off;默认on;指示原始请求头字段是否传递给代理服务器。

## 内置变量

$proxy_host：代表proxy_pass指令中指定的被代理服务器的名称和端口；

$proxy_port：代表proxy_pass指令中指定的代理服务器的端口，或协议的默认端口；

$proxy_add_x_forwardd_for：“X-Forwarded-For”客户端请求标头字段，后面附加$remote_addr变量，用逗号分隔。如果客户端请求标头中不存在“X-Forwarded-For”字段，则$proxy_add_X_Forwarded_For变量等于$remote_addr变量。
