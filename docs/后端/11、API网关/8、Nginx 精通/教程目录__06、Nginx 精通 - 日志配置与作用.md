# 06、Nginx 精通 - 日志配置与作用
- 来源：https://ddkk.com/zhuanlan/server/nginx/4/6.html
- 分类：服务器框架
- 分组：教程目录
利用日志查找配置问题或应用故障是常用手段。使用 NGINX 可有效控制对应用有意义的日志信息。NGINX 允许您根据不同的上下文将日志以不同的格式拆分到不同的文件中，并更改错误日志的日志级别，以更深入地了解当前状况。

**目录**

Syslog日志

访问日志-access_log

重写日志-rewrite_log

错误日志-error_log

附：access_log日志格式变量

## Syslog日志

NGINX 支持对接 Syslog，天生就具备了将日志以流的形式输出给集中式日志服务器的能力。Syslog是一种基于UDP或TCP/IP的RFC协议，用于在计算机系统和网络中传输日志消息。它由三个主要组件组成：日志源（日志产生的设备或应用程序）、Syslog代理（接收和处理日志消息的服务器）以及Syslog收集器（存储和管理日志消息的系统）。

在Nginx中，日志输出到Syslog，Syslog参数配置如下：

Syslog:server=address[,parameter=value]

Syslog:server：标识-表示日志输出传到Syslog统一收集器。

address：Syslog服务器地址。如果服务器地址不设置端口号，默认为 UDP 514。

parameter=value：参数值对，通常有facility、severity、tag 和 nohostname 等可选标记。facility 选项是指日志消息的 facility值，取 Syslog RFC 标准定义的 23 个值之一；默认值为 local7。tag 选项表示消息的标记，默认值为 nginx。severity 选项默认为 info，表示所发送消息的日志级别。nohostname 标记禁止将 hostname 字段添加到 syslog 消息头中，不取值。

## 访问日志-access_log

```java
#访问日志输出，格式：access_log file [formatname [buffer=size [flush=time]]];
# file：日志文件，可以是普通文件或syslog
# formatname ：日志格式名（用log_format定义的）
# buffer：设置内存缓存区大小
# flush：保存在缓存区中的最长时间
# gzip：压缩等级
# 不记录日志：access_log off;
access_log  /var/log/nginx/access.log  main;
#日志格式定义，格式：log_format formatname [escape=default|json|none] string …; 
# string中内置变量见后附
log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';
#  对于每一条日志记录，都将是先打开文件，再写入日志，然后关闭。用open_log_file_cache设置日志文件缓存。
# 格式：open_log_file_cache max=N [inactive=time] [min_uses=N] [valid=time]; 默认是open_log_file_cache  off；
# max:设置缓存中的最大文件描述符数量，如果缓存被占满，采用LRU算法将描述符关闭。
# inactive:设置存活时间，默认是10s
# min_uses:设置在inactive时间段内，日志文件最少使用多少次后，该日志文件描述符记入缓存中，默认是1次
# valid:设置检查频率，默认60s
open_log_file_cache max=1000 inactive=30s valid=3m min_uses=10;
```

访问日志由ngx_http_log_module模块负责。

访问日志可在任意层级定义。

## 重写日志-rewrite_log

用来记录重写日志的。对于调试重写规则建议开启。

```java
# 开启重写日志，默认关闭off。启用时将在error log中记录notice级别的重写日志。
rewrite_log on;
```

rewrite_log由ngx_http_rewrite_module模块提供的。

## 错误日志-error_log

记录错误日志。

```java
#错误日志：error_log file [level]; 默认是：error_log logs/error.log error
# file：日志文件，可以是普通文件、标准错误输出stderr、Syslog
# level：日志级别，严重程度从低到高的顺序是 debug（调试）、info（信息）、notice（注意）、warn（警告）、error（错误）、crit（严重）、alert（警报）和 emerg（紧急）。默认值：error
error_log  logs/error.log;
```

## 附：access_log日志格式变量

log_format中可使用于string的变量如下：

args : 请求中的参数值

query_string : 同 变量args

arg_NAME : GET请求中NAME的值

is_args : 如果请求中有参数，值为"?“，否则为空字符串

uri: 请求中的当前URI(不带请求参数，参数位于变量args)，可以不同于浏览器传递的变量request_uri的值，它可以通过内部重定向，或者使用index指令进行修改，变量uri不包含主机名，如”/foo/bar.html"。

document_uri : 同 变量uri

document_root : 当前请求的文档根目录或别名

host : 优先级：HTTP请求行的主机名>“HOST"请求头字段>符合请求的服务器名.请求中的主机头字段，如果请求中的主机头不可用，则为服务器处理请求的服务器名称

hostname : 主机名

https : 如果开启了SSL安全模式，值为"on”，否则为空字符串。

binary_remote_addr : 客户端地址的二进制形式，固定长度为4个字节

body_bytes_sent : 传输给客户端的字节数，响应头不计算在内；这个变量和Apache的mod_log_config模块中的"%B"参数保持兼容

bytes_sent : 传输给客户端的字节数

connection : TCP连接的序列号

connection_requests : TCP连接当前的请求数量

content_length : “Content-Length” 请求头字段

content_type : “Content-Type” 请求头字段

cookie_name : cookie名称

limit_rate : 用于设置响应的速度限制

msec : 当前的Unix时间戳

nginx_version : nginx版本

pid: 工作进程的PID

pipe : 如果请求来自管道通信，值为"p"，否则为"."

proxy_protocol_addr : 获取代理访问服务器的客户端地址，如果是直接访问，该值为空字符串

realpath_root : 当前请求的文档根目录或别名的真实路径，会将所有符号连接转换为真实路径

remote_addr : 客户端地址

remote_port : 客户端端口

remote_user : 用于HTTP基础认证服务的用户名

request : 代表客户端的请求地址

request_body : 客户端的请求主体：此变量可在location中使用，将请求主体通过proxy_pass，fastcgi_pass，uwsgi_pass和scgi_pass传递给下一级的代理服务器

request_body_file : 将客户端请求主体保存在临时文件中。文件处理结束后，此文件需删除。如果需要之一开启此功能，需要设置client_body_in_file_only。如果将次文件传 递给后端的代理服务器，需要禁用request body，即设置proxy_pass_request_body off，fastcgi_pass_request_body off，uwsgi_pass_request_body off，or scgi_pass_request_body off

request_completion : 如果请求成功，值为"OK"，如果请求未完成或者请求不是一个范围请求的最后一部分，则为空

request_filename : 当前连接请求的文件路径，由root或alias指令与URI请求生成

request_length : 请求的长度 (包括请求的地址，http请求头和请求主体)

request_method : HTTP请求方法，通常为"GET"或"POST"

request_time : 处理客户端请求使用的时间,单位为秒，精度毫秒； 从读入客户端的第一个字节开始，直到把最后一个字符发送给客户端后进行日志写入为止。

request_uri : 这个变量等于包含一些客户端请求参数的原始URI，它无法修改，请查看变量uri更改或重写URI，不包含主机名，例如：“/cnphp/test.php?arg=freemouse”

scheme : 请求使用的Web协议，“http” 或 “https”

server_addr : 服务器端地址，需要注意的是：为了避免访问linux系统内核，应将ip地址提前设置在配置文件中

server_name : 服务器名

server_port : 服务器端口

server_protocol : 服务器的HTTP版本，通常为 “HTTP/1.0” 或 “HTTP/1.1”

status : HTTP响应代码

time_iso8601 : 服务器时间的ISO 8610格式

time_local : 服务器时间（LOG Format 格式）

cookie_NAME : 客户端请求Header头中的cookie变量，前缀"变量cookie_"加上cookie名称的变量，该变量的值即为cookie名称的值

http_NAME : 匹配任意请求头字段；变量名中的后半部分NAME可以替换成任意请求头字段，如在配置文件中需要获取http请求头：“Accept-Language”，变量http_accept_language即可

http_cookie

http_host : 请求地址，即浏览器中你输入的地址（IP或域名）

http_referer : url跳转来源,用来记录从那个页面链接访问过来的

http_user_agent : 用户终端浏览器等信息

http_x_forwarded_for : 正如上面所述，当你使用了代理时，web服务器就不知道你的真实IP了，为了避免这个情况，代理服务器通常会增加一个叫做x_forwarded_for的头信息，把连接它的客户端IP（即你的上网机器IP）加到这个头信息里，这样就能保证网站的web服务器能获取到真实IP

sent_http_NAME : 变量中的后半部分NAME可以替换成任意响应头字段，如需要设置响应头Content-length，变量sent_http_content_length即可
