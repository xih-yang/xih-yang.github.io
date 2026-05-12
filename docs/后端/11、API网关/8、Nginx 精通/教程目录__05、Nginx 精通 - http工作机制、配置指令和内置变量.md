# 05、Nginx 精通 - http工作机制、配置指令和内置变量
- 来源：https://ddkk.com/zhuanlan/server/nginx/4/5.html
- 分类：服务器框架
- 分组：教程目录
http服务是Nginx最原始的服务，搞清楚其工作机制非常有利于弄懂nginx是如何工作的。

Nginx核心模块为ngx_http_core_module。

**目录**

http工作机制

配置结构

工作机制

http常用指令

http

server

listen

server_name

location

优先级

"/"的特殊用法

root/alias/index

root

alias

index

default_type

keepalive_requests

keepalive_timeout

send_timeout

client_max_body_size

内置变量

## http工作机制

### 配置结构

下面是http配置三层结构：

```java
http{
    ...
    server{
        ...
        location / {
            ...
        }
    }
}
```

配置关系：http只有一个，一个http包含多个server，一个server包含多个location。

### 工作机制

当Nginx接到http(s)请求后，处理步骤如下：

**1、** 按server进行匹配，匹配规则：根据请求的头字段“Host”来确定请求应该路由到哪个服务器如果它的值与任何server_name都不匹配，或者请求根本不包含这个头字段，那么nginx会将请求路由到这个端口的默认服务器默认服务器是第一个服务器，这是nginx的标准默认行为还可以使用listen指令中的default_server参数显式设置（默认服务器是按端口设置的）；

```java
server {
    listen      80;
    server_name example.com www.example.com;
    ...
    location /hello/ {
        ...
    }
}
server {
    listen      80 default_server;
    server_name example.net www.example.net;
    ...
    location /hello/ {
        ...
    }
}
```

上述配置中默认服务器是第二个；如果没有default_server，则为第一个。

**2、** 确定server后再按location规则匹配定位location；

**3、** 按定位的location中的指令工作；

##

http常用指令

### http

http{ ... } 提供在其中指定HTTP服务相关指令的配置上下文。

### server

server { ... } 提供在其中指定虚拟服务器指令的配置上下文。

### listen

格式：listen address[:port] [default_server] [ssl] [http2 | quic] [proxy_protocol] [setfib=number] [fastopen=number] [backlog=number] [rcvbuf=size] [sndbuf=size] [accept_filter=filter] [deferred] [bind] [ipv6only=on|off] [reuseport] [so_keepalive=on|off|[keepidle]:[keepintvl]:[keepcnt]];

listen port [default_server]...;

listen unix:path ...;

默认：listen *:80 | *:8000;

参数说明：

address[:port]：设置IP的地址和端口，或服务器将在其上接受请求的UNIX域套接字的路径。可以同时指定地址和端口，或者只能指定地址或只能指定端口。地址也可以是主机名。如：

```java
listen 127.0.0.1:8000;
#没指定端口，默认是80
listen 127.0.0.1;
listen 80;
listen *:8000;
listen localhost:8000;
```

default_server ：将使服务器成为匹配address[:port]的默认服务器。

ssl：允许指定此端口上接受的所有连接都应在ssl模式下工作。这允许对同时处理HTTP和HTTPS请求的服务器进行更紧凑的配置。

http2：将端口配置为接受HTTP/2连接。通常情况下，为了实现这一点，还应该指定ssl参数，但nginx也可以配置为接受没有ssl的HTTP/2连接。

quic：将端口配置为接受quic连接。

proxy_protocol：允许指定此端口上接受的所有连接都应使用proxy协议。

setfib=number：设置侦听套接字的相关路由表FIB（SO_SETFIB选项）。这目前只适用于FreeBSD。

fastopen=number :为侦听套接字启用“TCP Fast Open”功能，并限制尚未完成三方握手的连接队列的最大长度。除非服务器能够多次处理接收同一个SYN数据包的数据，否则不要启用此功能。

backlog=number ：在listen()调用中设置backlog参数，该参数限制挂起连接队列的最大长度。默认情况下，在FreeBSD、DragonFly BSD和macOS上，backlog设置为-1，在其他平台上设置为511。

rcvbuf=size：设置侦听套接字的接收缓冲区大小（SO_RCVBUF选项）。

sndbuf=size：设置侦听套接字的发送缓冲区大小（SO_SNDBUF选项）。

accept_filter=filter：为侦听套接字设置accept filter（SO_ACCEPTFILTER选项）的名称，该套接字在将传入连接传递给accept()之前对其进行筛选。这只适用于FreeBSD和NetBSD 5.0+。可能的值是dataready和httpready。

deferred：指示在Linux上使用延迟accept（）（TCP_DEFER_accept套接字选项）。

bind：指示对给定的地址：端口对进行单独的bind()调用。这很有用，因为如果有多个侦听指令具有相同的端口但不同的地址，并且其中一个侦听指令侦听给定端口（*：port）的所有地址，nginx将只bind()到*：port。需要注意的是，在这种情况下，将进行getsockname()系统调用，以确定接受连接的地址。如果使用了setfib、fastopen、backlog、rcvbuf、sndbuf、accept_filter、deferred、ipv6only、reuseport或so-keepalive参数，那么对于给定的地址：端口对，将始终进行单独的bind()调用。

ipv6only=on|off ：确定（通过IPV6_V6ONLY套接字选项）侦听通配符地址[::]的IPV6套接字将只接受IPV6连接还是同时接受IPV6和IPv4连接。默认情况下，此参数处于启用状态。启动时只能设置一次。

reuseport：为每个工作进程创建一个单独的侦听套接字。目前仅适用于Linux 3.9+、DragonFly BSD和FreeBSD 12+（1.15.1）。

so-keepalive=on|off|[keepinidle]：[keepintvl]：[keepcnt]：配置侦听套接字的“TCP保持活动”行为。如果忽略此参数，则操作系统的设置将对套接字有效（默认）。某些操作系统支持使用TCP_KEEPIDLE、TCP_KEPINTVL和TCP_KEPCNT套接字选项在每个套接字的基础上设置TCP保活参数。在这样的系统（目前，Linux 2.4+、NetBSD 5+和FreeBSD 9.0-STABLE）上，可以使用keepindle、keepintvl和keepcnt参数对它们进行配置。

listen参数比较复杂，后续涉及相关功能详细讲述作用。

###

server_name

格式：server_name name ...;

默认：server_name "";

注意：name有如下三种情况

**1、** name是具体服务器名字符串，精确匹配如”example.com“就只匹配”example.com“，多少一个字母都不行；

**2、** name含匹配符"*"（匹配任意字符串），但只能在开头("*.")或末尾((".*"))，其它位置无效如：\*.example.com代表所有二级域名都匹配，但注意不匹配”example.com“；特殊匹配：”.example.com“同时匹配\*.example.com和"example.com"；

**3、** name可以是PCRE正则表达式，必须以“~”开头例如：；

```java
server_name  ~^www\d+\.example\.net$;
```

注意：
**1、** 不要忘记设置开始“^”和结尾“$”锚点它们不是语法上的要求，而是逻辑上的要求；

**2、** 域名"."应该用反斜杠转义；

**3、** {或}是配置特殊字符，如果正则表达式用到，用引号包起来："{"、“}”；

###

location

格式：location [ = | ~ | ~* | ^~ ] uri { ... }

用请求的uri同参数定义的uri匹配，对匹配的uri设置指令。

\=：精确匹配，完全相同

~：区分大小写匹配

~*：不区分大小写的匹配

^~：前缀匹配-表示以某个常规字符串开头，不支持正则表达式

uri：正则表达式。正则表达式中自作向右在"()"匹配的值在location内部指令可通过$1-$9来引用。

####

优先级

当一个server中有多个location，其优先级如下：

=优先级最高。一旦匹配成功，则不再查找其他location的匹配项

^~次优先级，如果有多个location匹配成功的话，不会终止匹配过程，会匹配表达式最长的那个，不再继续匹配其它location。

末优先级：非=和^~。只要有一个正则成功，则使用这个正则的location，不再继续匹配其它location。

####

"/"的特殊用法

```java
    server {
        listen 80 default_server;
        有=，表示后面"/"是个字符串
        location = / {    位置标识：@1
            ...
        }
        location / {        #位置标识：@2
            ...
        }
        location /a/ {      #位置标识：@3
            ...
        }
        location /a/b/ {    #位置标识：@4
            ...
        }
    }
```

**1、** 在@1中有"="，表示后面"/"是个字符串;在@2/3/4中，省略匹配符号（只有"/"可以省略），表示头匹配以"/"开始的字符串；

**2、** 例子中匹配结果：；

http://127.0.0.1 ： 匹配@1

http://127.0.0.1/ ： 匹配@1

http://127.0.0.1/index.html ： 匹配@2

http://127.0.0.1/a ： 匹配@2

http://127.0.0.1/a/ ： 匹配@3

http://127.0.0.1/a/index.html ： 匹配@3

http://127.0.0.1/a/b/index.html ： 匹配@4 #按最长匹配

http://127.0.0.1/d/a/b/index.html ： 匹配@2 #必须是头匹配

### root/alias/index

#### root

格式：root path;默认 root html;

设置请求根目录，在请求前加path。路径值可以包含变量，\$document_root和\$realpath_root除外。文件的路径只需在根指令的值中添加一个URI即可构建。如果必须修改URI，则应使用alias指令。

```java
#请求时“/i/top.gif”，将发送文件/data/w3/i/top.gif。
location /i/ {
    root /data/w3;
}
```

#### alias

格式：alias path; 定义指定位置的替换项。示例如下：

```java
#请求时“/i/top.gif”，将发送文件/data/w3/images/top.gif。
location /i/ {
    alias /data/w3/images/;
}
```

几点说明：

**1、** 路径值可以包含变量，$document_root和$realpath_root除外；

**2、** 如果在用正则表达式定位，正则表达式使用()，别名中可使用相关$1...示例如下：；

```java
#用正则表达式定位，$1代表"/users/"后的匹配内容
location ~ ^/users/(.+\.(?:gif|jpe?g|png))$ {
    alias /data/w3/images/$1;
}
```

**3、** 当位置与指令值的最后一部分匹配时，最好用root指令代替示例如下：；

```java
#最后一部分匹配时
location /images/ {
    alias /data/w3/images/;
}
#root指令代替如下
location /images/ {
    root /data/w3;
}
```

#### index

格式：index `file` ...;

定义将用作索引的文件。文件名可以包含变量。文件按指定的顺序进行检查。列表的最后一个元素可以是具有绝对路径的文件。如：

```java
index index.$geo.html index.0.html /index.html;
```

主要配合root/alias实用，当URI不包括具体文件用索引文件。

该指令由ngx_http_index_module实现。

### default_type

格式：default_type mime-type;

默认：default_type text/plain;

定义响应的默认MIME类型。MIME类型用于指定文件的类型，以浏览器可以正确地解析和显示文件。MIME类型见 /etc/nginx/mime.types，通常使用方式：

```java
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
```

### keepalive_requests

格式：keepalive_requests number; 默认：keepalive_requests 1000; 在1.19之前为100

设置可以通过一个保持活动连接提供服务的最大请求数。在发出最大数量的请求后，连接将关闭。定期关闭连接对于释放每个连接的内存分配是必要的。因此，使用过高的最大请求数可能会导致内存过度使用，因此不建议使用。

### keepalive_timeout

格式：keepalive_timeout timeout [header_timeout]; 默认: keepalive_timeout 75s

第一个参数设置一个超时，在此期间保持活动的客户端连接将在服务器端保持打开。零值将禁用保持活动的客户端连接。可选的第二个参数在“Keep Alive:timeout=time”响应头字段中设置一个值。两个参数可以不同。

### send_timeout

格式：send_timeout time; 默认: send_timeout 60s

设置向客户端传输响应的超时。不是整个响应传输超时时间，而是指在两个连续写入操作之间。如果客户端在此时间内没有接收到任何内容，则连接将关闭。

### client_max_body_size

格式：client_max_body_size size; 默认: client_max_body_size 1m;

设置客户端请求正文允许的最大大小。如果请求中的大小超过配置的值，则向客户端返回413（请求实体太大）错误。0将禁用客户端请求正文大小的检查。

##

内置变量

Http模块内置变量可在配置文件中直接使用。

$is_args：如果请求行有参数，则为“？”，否则为空字符串

$arg_name：请求行中的参数名

$args ： 请求行中的所有参数，同$query_string

$binary_remote_addr：二进制形式的客户端地址，值的长度对于IPv4地址总是4字节，对于IPv6地址总是16字节

$body_bytes_send：发送到客户端的字节数，不包括响应标头；该变量与mod_log_config Apache模块的“%B”参数兼容

$bytes_send：发送到客户端的字节数

$connection：连接序列号

$connection_requests：通过连接发出的当前请求数

$connection_time：连接时间（秒），分辨率为毫秒

$content_length：请求标头字段-Content-Length

$content_type：请求标头字段-Content-Type

$cookie_name：cookie名称

$document_root：当前请求的 root 或 alias指令的值

$uri：请求中的当前URI(不带请求参数)。$uri的值可能会在请求处理过程中发生变化，例如，在执行内部重定向或使用索引文件时。

$document_uri：与$uri相同

$host：按照优先级顺序：请求行中的主机名，或请求头字段中“Host”中的主机名，或与请求行匹配的服务器名

$hostname：主机名

$http_name：任意请求头字段；变量名的最后一部分是字段，字段名转换为小写，用下划线替换短划线

$https：如果连接在SSL模式下运行，则为“on”，否则为空字符串

$limit_rate：设置此变量可以限制响应率；请参阅limit_rate

$msec：当前时间（毫秒）

$nginx_version：nginx版本

$pid：工作进程的PID

$pipe：如果请求是流水线式的，则为“p”，否则为“.”

$proxy_procol_addr：PROXY协议头中的客户端地址。必须通过在侦听指令中设置PROXY_protocol参数来预先启用PROXY协议。

$proxy_procol_port：来自PROXY协议头的客户端端口。必须通过在侦听指令中设置PROXY_protocol参数来预先启用PROXY协议。

$proxy_procol_server_addr：PROXY协议头中的服务器地址。必须通过在侦听指令中设置PROXY_protocol参数来预先启用PROXY协议。

$proxy_procol_server_port:：PROXY协议头的服务器端口。必须通过在侦听指令中设置PROXY_protocol参数来预先启用PROXY协议。

$realpath_root：与当前请求的root或alias指令值相对应的绝对路径名，所有符号链接解析为真实路径

$remote_addr：客户端地址

$remote_port：客户端端口

$remote_user：基本身份验证提供的用户名

$request：完整的原始请求行

$request_body：请求主体。当请求体被读取到内存缓冲区时，变量的值在proxy_pass、fastcgi_pass、uwsgi_pass和scgi_pass指令处理的位置可用。

$request_body_file：请求主体中的临时文件的名称。在处理结束时，需要删除该文件。要始终将请求主体写入文件，只需要启用client_body_in_file_即可。当临时文件的名称在代理请求中或在向FastCGI/uwsgi/SCGI服务器的请求中传递时，应分别通过proxy_pass_request_body off、FastCGI_pass_request_bbody off、uwsgi_pass_rerequest_body ff或SCGI_pass_rerequest_bbody off指令禁用传递请求正文。

$request_completion：如果请求已完成，则为“OK”，否则为空字符串

$request_filename：当前请求的文件路径。基于root或别名指令以及请求URI

$request_id：由16个随机字节生成的唯一请求标识符，十六进制

$request_length：请求长度（包括请求行、标头和请求正文）

$request_method：请求方法，通常为“GET”或“POST”

$request_time：请求处理时间（秒），分辨率为毫秒（1.3.9、1.2.6）；从客户端读取第一个字节后经过的时间

$request_uri：完整的原始请求URI（带参数）

$scheme：请求方案，“http”或“https”

$sent_http_name：任意响应头字段；变量名的最后一部分是字段名，该字段名转换为小写，用下划线替换短划线

$sent_trailer_name：在响应结束时发送的任意字段；变量名的最后一部分是字段名，该字段名转换为小写，用下划线替换短划线

$server_addr：接受请求的服务器的地址。计算此变量的值通常需要一个系统调用。为了避免系统调用，listen 指令必须指定地址并使用bind参数。

$server_name：接受请求的服务器的名称

$server_port：接受请求的服务器的端口

$server_procol：请求协议，通常为“HTTP/1.0”、“HTTP/1.1”、“HTTP/2.0”或“HTTP/3.0”

$status：响应状态。$tcpinfo_rtt、$tcpinfo_rttvar、$tcpinfo_snd_cwnd、$tcpinnfo_rcv_space关于客户端TCP连接的信息；在支持TCP_INFO套接字选项的系统上可用

$time_iso8601：ISO 8601标准格式的当地时间

$time_local：通用日志格式的本地时间

这篇文章如果对您有所帮助或者启发的话，帮忙关注或点赞，有问题请评论，必有所复。您的支持是我写作的最大动力！
