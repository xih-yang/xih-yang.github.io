# 23、Nginx 精通 - Nginx Plus增强功能之负载均衡
- 来源：https://ddkk.com/zhuanlan/server/nginx/4/23.html
- 分类：服务器框架
- 分组：教程目录
Nginx作为开源版，提供大量的丰富功能，能满足大部分需要。Nginx Plus是Nginx的加强版，是在开源Nginx功能基础上，提供了许多适合生产环境的专业功能，包括高可用性、主动健康检查、DNS 系统发现、会话保持和 RESTful API等，但这些功能基本都需要收费。本文讲述这些增强功能。

## 负载均衡

### 会话访问策略

Nginx plus在负载均衡访问策略中提供了基于会话(Session)的访问策略，通过会话相关性，可保证来自同一客户端的请求传递到一组服务器中的同一服务器。但如果指定的服务器无法处理请求，则会选择新服务器，就好像客户端尚未绑定一样。会话访问策略主要如下三种方式。

功能由模块ngx_http_upstream_module提供。

#### Sticky Cookie

基于Cookie会话访问策略配置示例如下：

```java
upstream backend {
    server backend1.example.com route=a; 
    server backend2.example.com route=b; 
    采用sticky cookie策略，实用详见指令
    sticky cookie  affinity 
        expires=1h
        domain=.example.com 
        httponly
        secure 
        path=/;
}
```

指令：**sticky cookie** name [expires=time] [domain=domain] [httponly] [samesite=strict|lax|none|`$`variable] [secure] [path=path];

使用cookie方法，指定服务器的信息会在nginx生成的HTTP cookie中传递，并基于会话对后续访问进行服务器绑定。

参数如下：

name-cookie的名称，值是IP地址和端口的MD5哈希或UNIX域套接字路径的十六进制表示。但是，如果指定了服务器指令的“route”参数，cookie值将是“route“参数的值

expires：设置浏览器应保留cookie的时间。如果不指定该参数，则会导致cookie在浏览器会话结束时过期。

domain：定义为其设置cookie的域。参数值可以包含变量

httponly：将HttpOnly属性添加到cookie

samesite`：`将`SameSite属性添加到cookie中，可取值：Strict（默认）、Lax、None或变量`

secure ：将secure 属性添加到cookie

path：设置cookie的路径

#### Sticky Learn

基于learn会话访问策略配置示例如下：

```java
upstream backend {
    server backend1.example.com:8080; 
    server backend2.example.com:8081;
    sticky learn
        create=$upstream_cookie_cookiename 
        lookup=$cookie_cookiename 
        zone=client_sessions:2m;
}
```

指令：**sticky learn** create=`$`variable lookup=`$`variable zone=name:size [timeout=time] [header] [sync];

nginx自动分析上游服务器响应，学习在HTTP cookie中传递的服务器会话，并基于学习结果对后续访问进行服务器绑定。

参数如下：

create：在“Set-Cookie”时发送的指定名称的cookie。注：$upstream_cookie_**name** 是个内置变量，"$upstream_cookie_"是固定格式的，表示在响应中设置cookie的名称；”name"是设置的，表示cookie名称。

lookup：在请求中查找指定名称的cookie。注：$cookie_**name** 是个内置变量，"$cookie_"是固定格式的，表示在请求中的cookie名称；”name"是设置的，表示cookie名称。

zone：定义会话保存的缓存。

timeout：指定的时间内未访问的会话将从缓存中删除。默认10分钟。

header：允许在从代理服务器接收到响应头之后立即创建会话。

sync：缓存能够同步。

#### Sticky Route

基于troute会话访问策略配置示例如下：

```java
# 如果cookie有"jsessionid", 如果jsessionid匹配表达式，则$route_cookie=$route；否则$route_cookie为空
map $cookie_jsessionid $route_cookie {
    ~.+\.(?P<route>\w+)$ $route;
}
# 请求uri如果匹配表达式，则$route_uri =$route；否则$route_uri 为空
map $request_uri $route_uri {
    ~jsessionid=.+\.(?P<route>\w+)$ $route;
}
upstream backend {
    server backend1.example.com route=a; 
    server backend2.example.com route=b;
    用第一个不为空的变量进行路由匹配
    sticky route $route_cookie $route_uri;
}
```

指令：**sticky route**`$`variable ...;

当使用路由方法时，Nginx在收到第一个请求时为客户端分配一个路由。来自该客户端的所有后续请求都将在cookie或URI中携带路由信息。将此信息与服务器指令的“route”参数进行比较，以确定请求应代理到的服务器。

参数如下：

$variable：路由方法的参数指定可能包含路由信息的变量。第一个非空变量用于查找匹配的服务器

将流量定向到特定的服务器。sticky route 可将将流量定向到特定的服务器，能够提供更好的控制、实际跟踪能力和粘性。该算法会先根据指定的路线将客户端路由到被代理服务器，随后的请求则会在 cookie 或 URI 中携带路由信息，从而始终一致地将具有此会话标识符的请求传输到与原请

求相同的上游服务器。

### 主动健康检查

Nginx提供被动健康检查，而Nginx Plus提供了主动健康检查。主动健康检查可以对健康检查策略进行配置，包括检查频率、服务器必须通过多少次检查才能被视为健康、失败多少次会被视为 不健康以及预期的结果应该是什么。配置示例如下：

```java
http {
    server {
        ...
        location / {
            proxy_pass http://backend; 
            启动健康检查
            health_check interval=2s fails=2 passes=5 uri=/ match=welcome;
        }
    }
    状态码是 200，内容类型是 "text/html",
    正文包含 "I am ok!" 
    match welcome {
        status 200;
        header Content-Type = text/html; 
        body ~ "I am ok!";
    }
}
```

指令如下：

#### health_check

格式：health_check [parameters];

`interval`=`time：设置两次连续运行状况检查之间的间隔，默认情况下为5秒。`

`jitter`=`time：设置每次健康检查随机延迟的时间，默认情况下没有延迟。`

`fails`=`number：设置特定服务器连续失败的运行状况检查次数，在此之后该服务器将被视为不正常，默认情况下为1。`

`passes`=`number：`设置特定服务器连续通过健康检查的次数，之后服务器将被视为健康，默认情况下为1。

`uri=`*uri*`：定义运行状况检查请求中使用的URI（由服务器提供），默认情况下为“/”。`

`mandatory` [`persistent`]：设置服务器的初始检查状态，直到第一次运行状况检查完成。如果未指定该参数，则服务器最初将被认为是健康的。

`match`=`name：`指定匹配块，用于配置响应应通过的测试（服务器应返回的内容），以便通过运行状况检查。默认情况下，响应的状态代码应为2xx或3xx。

`port`=`number：可指定`连接到服务器执行运行状况检查时使用的专有端口。默认情况下，等于服务器端口。

`type`=`grpc` [`grpc_service`=`name`] [`grpc_status`=`code`]`：`启用对gRPC服务器定期运行状况检查。

`keepalive_time`=`time`：启用用于健康检查连接保活时间，同时也是通过一个保活连接处理请求的时间。默认情况下，健康检查连接不保活。

#### match

格式：match name { ... }

定义用于验证对运行状况检查请求的响应的命名测试数据。

status=`number` ：响应状态值。正常情况下，响应的状态代码应为2xx或3xx。只定义响应码最简单，服务器不需要提供专门的匹配响应代码。

`header Content-Type = text/html;头字段Content-Type，用"text/html"即可。`

body ：正文需包含的内容。

功能由模块ngx_http_upstream_hc_module提供。

### 慢启动

服务器慢启动功能可防止最近新接入或恢复的服务器被连接淹没，这可能会超时并导致服务器再次标记为故障。在NGINX Plus中，慢速启动允许上游服务器在恢复或可用后将其权重从0逐渐恢复到标称值。配置实例如下：

```java
upstream {
    在 20 秒内缓慢增加连接数量
    server server1.example.com slow_start=20s; 
    在 15 秒内缓慢增加连接数量
    server server2.example.com slow_start=15s;
}
```

注意：当均衡策略为hash, ip_hash和random，slow_start不生效。

### DNS解析动态IP

对于在服务器组中用域名标识的server，NGINX Plus可以监控相应DNS记录中IP地址列表的更改，并自动将这些更改应用于服务器组的负载平衡，而无需重新启动。配置示例如下：

```java
http {
    定义DNS解析器
    resolver 10.0.0.1 valid=300s ipv6=off;
    解析超时时间
    resolver_timeout 10s;
    upstream backend {
        least_conn;
        下面配置的域名通过前面定义的resolver进行解析，域名对应ip变化，可自动更新
        server backend1.example.com resolve;
        server backend2.example.com resolve;
    }
    server {
        location / {
            proxy_pass http://backend;
        }
    }
}
```

指令：

格式：resolver address ... [valid=time] [ipv4=on|off] [ipv6=on|off] [status_zone=zone];

配置用于解析server_name中域名的DNS服务器。参数如下：

address：DNS服务器地址，可以指定为域名或IP地址，并带有可选端口。如果未指定端口，则使用端口53。为防止DNS欺骗，建议在安全可靠的本地网络中配置DNS服务器。

valid：重新解析DNS记录的频率。默认情况下，NGINX Plus以记录中time‑to‑live（TTL）指定的频率重新解析DNS记录。

ipv4=on|off] [ipv6=on|off：默认情况下，nginx在解析时会同时查找IPv4和IPv6地址。如果不需要查找IPv4或IPv6地址，则可以指定IPv4=off或IPv6=off参数。

status_zone=zone：收集请求和响应的DNS服务器统计信息保存到zone缓存。

### 动态配置服务器组

使用NGINX Plus，可以在不重新加载服务器和NGINX配置的情况下动态修改服务器组中服务器的配置。这有助于：

- 自动缩放，当需要添加更多服务器时
- 维护，当需要删除服务器、指定备份服务器或暂时关闭服务器时
- 快速设置，当需要更改上游服务器设置时，如服务器重量、活动连接、缓慢启动、故障超时。
- 监视，当使用一个命令获取服务器或服务器组的状态时

配置示例如下：

```java
http {
    upstream appservers {
        服务器组的配置保留在缓存中
        zone appservers 64k;
        server appserv1.example.com      weight=5;
        server appserv2.example.com:8080 fail_timeout=5s;
        server reserve1.example.com:8080 backup;
        server reserve2.example.com:8080 backup;
    }
    server {
        location / {
            proxy_pass http://appservers;
            health_check;
        }
        处理动态配置请求
        location /api {
            GET方法需进行身份认证
            limit_except GET {
                auth_basic "NGINX Plus API";
                auth_basic_user_file conf.d/user.pwd;
            }
            可修改
            api write=on;
            限定只能本机配置
            allow 127.0.0.1;
            deny  all;
        }
    }
}
```

用如下一些命令可动态加减服务器：

```java
# 查看服务器组当前状态--GET
curl 'http://127.0.0.1/api/9/http/upstreams/appservers'
# 增加服务器
curl -X POST -d '{ \
   "id":0,
   "server": "10.0.0.1:8089", \
   "weight": 4, \
   "max_conns": 0, \
   "max_fails": 0, \
   "fail_timeout": "10s", \
   "slow_start": "10s", \
   "backup": true, \
   "down": true \
 }' -s 'http://127.0.0.1/api/9/http/upstreams/appservers/servers'
# 删除服务器
curl -X DELETE -s 'http://127.0.0.1/api/9/http/upstreams/appservers/servers/0'
# 当会话状态被存储到本地服务器时，要从组中下线或删除服务器,必须要先清空连接和持久会话，即让服务器会话在本地失效。这样可防止系统出现大的抖动
curl -X PATCH -d '{"drain":true}' 'http://127.0.0.1/api/9/http/upstreams/appservers/servers/0'
#服务器下线
curl -X PATCH -d '{ "down": true }' -s 'http://127.0.0.1/api/9/http/upstreams/appservers/servers/0'
```

其中url格式：http://address/api/{version}/http/upstreams/{httpUpstreamName}/servers/[id]

说明从前到后内容：

**1、** address：处理请求的节点的主机名或IP地址（127.0.0.1）；

**2、** api定位（匹配配置中的”location/api“）；

**3、** {version}：api版本（用9）；

**4、****http/upstreams**/{httpUpstreamName}/**servers**/[id]：服务器组的名称定位，黑色部分是固定的{httpUpstreamName}就是服务器组名[id]是服务器id，新增不需要；

##

这篇文章如果对您有所帮助或者启发的话，帮忙关注或点赞，有问题请评论，必有所复。您的支持是我写作的最大动力！
