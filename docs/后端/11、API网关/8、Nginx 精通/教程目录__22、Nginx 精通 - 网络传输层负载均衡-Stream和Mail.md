# 22、Nginx 精通 - 网络传输层负载均衡-Stream和Mail
- 来源：https://ddkk.com/zhuanlan/server/nginx/4/22.html
- 分类：服务器框架
- 分组：教程目录
前面章节主要讲述Nginx对http协议的支持，这也是Nginx使用最广泛的功能。本节补充讲述Nginx对Stream协议和Mail协议的支持。

## Stream支持

Nginx对传输层协议TCP和UDP提供代理和负载均衡支持，同时具备健康检查、动态配置等能力。

### TCP负载均衡

针对传输层tcp协议的数据包进行代理和负载均衡。

配置代码：

```java
# stream表示针对tcp协议配置，同http同等为止
stream {
    upstream mysql_read {
		#lb_mode：负载均衡方式，默认是轮询。具体见后面对应章节
		[lb_mode]
    	#server参数同http模块
        server read1.example.com:3306 weight=3; 
        server read2.example.com:3306;
        server 192.168.10.10:3306 backup;
    }
    server {
        listen 3306;
        proxy_pass mysql_read;
    }
}
```

这个示例是用nginx做mysql读数据库的负载均衡。

注意：如果采用目录下定义配置文件，不能在conf.d目录下建文件（这个是默认用于http协议的），应该另行创建名为 stream.conf.d 的文件夹具体配置如下：

**1、** 在/etc/nginx/nginx.conf配置文件中：；

```java
stream {
    include /etc/nginx/stream.conf.d/*.conf;
}
```

**2、** 建/etc/nginx/stream.conf.d/mysql_read.conf的文件，包含以下配置：；

```java
    upstream mysql_read {
		#lb_mode：负载均衡方式，默认是轮询。具体见后面对应章节
		[lb_mode]
    	#server参数同http模块
        server read1.example.com:3306 weight=3; 
        server read2.example.com:3306;
        server 192.168.10.10:3306 backup;
    }
    server {
        listen 3306;
        proxy_pass mysql_read;
    }
```

### udp负载均衡

针对传输层udp协议的数据包进行代理和负载均衡。

配置如下：

```java
stream {
    upstream lb_udp {
		#lb_mode：负载均衡方式，默认是轮询。具体见后面对应章节
		[lb_mode]
    	#server参数同http模块
        server udp1.example.com:123 weight=3; 
        server udp2.example.com:123;
        server 192.168.10.10:123 backup;
    }
    server {
        必须加"udp"选项，否则就是默认"tcp"协议
        listen 123 udp;
        proxy_pass lb_udp;
    }
}
```

UDP负载均衡与TCP负载均衡类似，在stream模块中以同样的方式完成大部分配置。

### 健康检查

#### TCP健康检查

NGINX和NGINX Plus可以不断测试TCP上游服务器，避免出现故障的服务器，并将恢复的服务器优雅地添加到负载平衡组中。健康检查有主动和被动两种模式。

**1、** 被动健康检查；

被动健康检查原理就是Nginx在服务器对正常请求回复错误或超时时，停止向其发送TCP数据报一段时间。

```java
upstream stream_backend {
    slow_start慢启动，在Nginx plus中支持
    server backend1.example.com:12345 weight=5  slow_start=30s;
    被动检查参数
    max_fails–NGINX在指定时间内认为服务器不可用的失败尝试次数。
    fail_timeout–指定次数的连接尝试必须失败才能认为服务器不可用的时间。此外，NGINX在标记服务器不可用后，停止服务器不可用时间量，之后再尝试是否可用。如果连接尝试在10秒内超时或至少失败一次，NGINX会将服务器标记为10秒内不可用。
    server backend2.example.com:12345 max_fails=2 fail_timeout=30s;
    server backend3.example.com:12346 max_conns=3;
}
```

**2、** 主动健康检查；

主动健康检查就是Nginx主动发起检查服务器状态请求，根据结果判定是否可用。

```java
stream {
    server {
        listen        12345;
        proxy_pass    stream_backend;
        主动健康检查
        port=number：可指定连接到服务器执行运行状况检查时使用的专有端口。默认情况下，等于服务器端口。
        interval=time：设置两次连续运行状况检查之间的间隔，默认为5秒。
        passes=number：设置特定服务器连续通过健康检查的次数，之后服务器将被视为健康，默认为1。
        fails=number：设置特定服务器连续失败的运行状况检查次数，在此之后该服务器将被视为不正常，默认为1。
        health_check port=12346 interval=10 passes=2 fails=3;
        health_check_timeout 5s;
    }
}
```

指令格式：health_check [parameters];

#### UDP健康检查

Nginx对UDP健康检查也分主动和被动模式。

**1、** 被动健康检查；

被动健康检查原理就是Nginx在服务器对正常请求回复错误或超时时，停止向其发送UDP数据报一段时间。

```java
upstream dns_upstream {
    被动检查参数
    max_fails–NGINX在指定时间内认为服务器不可用的失败尝试次数。
    fail_timeout–指定次数的连接尝试必须失败才能认为服务器不可用的时间。此外，NGINX在标记服务器不可用后，停止服务器不可用时间量，之后再尝试是否可用。如果连接尝试在10秒内超时或至少失败一次，NGINX会将服务器标记为10秒内不可用。
    server 192.168.136.130:53 max_fails=2 fail_timeout=30s;
    server 192.168.136.131:53 max_fails=2 fail_timeout=30s;
}
```

**2、** 主动健康检查；

主动健康检查就是Nginx主动发起检查服务器状态请求，根据结果判定是否可用。

```java
server {
    listen       53 udp;
    proxy_pass   dns_upstream;
    udp 表示是对UDP健康检查
    interval=time：设置两次连续运行状况检查之间的间隔，默认为5秒。
    passes=number：设置特定服务器连续通过健康检查的次数，之后服务器将被视为健康，默认为1。
    fails=number：设置特定服务器连续失败的运行状况检查次数，在此之后该服务器将被视为不正常，默认为1。
    health_check interval=20 passes=2 fails=2;
}
```

### 动态配置服务器

Nginx对Stream服务器具备动态配置能力，操作基本同http协议的动态配置能力。

```java
stream {
    配置stream服务器组
    upstream streamservers{
        zone streamservers 64k;
        server appserv1.example.com:12345 weight=5;
        server appserv2.example.com:12345 fail_timeout=5s;
        server backup1.example.com:12345 backup;
    }
    server {
        代理到服务器
        proxy_pass streamservers;
        ...
    }
}
http {
    在http中配置动态配置服务器能力
    server {
        Location for API requests
        location /api {
            limit_except GET {
                auth_basic "NGINX Plus API";
                auth_basic_user_file conf.d/user.pwd;
            }
            api write=on;
            allow 127.0.0.1;
            deny  all;
        }
    }
}
```

更新命令如下：

```java
# 查看服务器组当前状态--GET
curl 'http://127.0.0.1/api/6/stream/upstreams/streamservers'
# 增加服务器
curl -X POST -d '{ \
   "id":0,
   "server": "10.0.0.1:8089", \
   "weight": 4 \
 }' -s 'http://127.0.0.1/api/6/stream/upstreams/streamservers/servers'
# 删除服务器
curl -X DELETE -s 'http://127.0.0.1/api/6/stream/upstreams/streamservers/servers/0'
# 当会话状态被存储到本地服务器时，要从组中下线或删除服务器,必须要先清空连接和持久会话，即让服务器会话在本地失效。这样可防止系统出现大的抖动
curl -X PATCH -d '{"drain":true}' 'http://127.0.0.1/api/6/stream/upstreams/streamservers/servers/0'
#服务器下线
curl -X PATCH -d '{ "down": true }' -s 'http://127.0.0.1/api/6/stream/upstreams/streamservers/servers/0'
```

其中url格式：http://address/api/{version}/stream/upstreams/{StreamUpstreamName}/servers/[id]

说明从前到后内容：

**1、** address：处理请求的节点的主机名或IP地址（127.0.0.1）；

**2、** api定位（匹配配置中的”location/api“）；

**3、** {version}：api版本（用9）；

**4、****stream**/**upstreams**/{StreamUpstreamName}/**servers**/[id]：服务器组的名称定位，黑色部分是固定的{StreamUpstreamName}就是服务器组名[id]是服务器id，新增不需要；

## Mail协议支持

NGINX可以将IMAP、POP3和SMTP协议代理到邮件服务器。能带来如下好处：

- 轻松扩展邮件服务器的数量
- 根据不同的规则选择邮件服务器，例如，根据客户端的IP地址选择最近的服务器
- 在邮件服务器之间分配负载

### 配置示例

```java
mail {
    邮件服务器：可以是域名或ip地址，多个用" "隔开
    server_name mail.example.com;
	#使用auth_http指令指定HTTP身份验证服务器。身份验证服务器将对电子邮件客户端进行身份验证，选择用于电子邮件处理的邮件服务器，并报告错误
    auth_http   localhost:9000/cgi-bin/nginxauth.cgi;
    指定proxy_pass_error_message从身份验证服务器向用户通知错误。适合于邮箱内存不足情况
    proxy_pass_error_message on;
    ssl/tls方式访问邮件（配置方式同http协议）
    ssl                 on;
    ssl_certificate     /etc/ssl/certs/server.crt;
    ssl_certificate_key /etc/ssl/certs/server.key;
    ssl_protocols       TLSv1 TLSv1.1 TLSv1.2;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 10m;
    处理有邮件发送协议
	server {
		listen    25;
		protocol  smtp;  默认端口25, 587, 465
		# 授权方式
		smtp_auth login plain cram-md5;
	} 
    邮件读取协议
	server {
		listen    110;
		protocol  pop3;  默认端口 110, 995
		# 授权方式
		pop3_auth plain apop cram-md5;
	}
    邮件报文存取协议(用于远程管理邮件)
	server {
		listen   143;  默认端口 143, 993
		protocol imap;
	}
}
```

### 身份验证

auth_http指令用于与身份验证服务器进行通信，验证身份；验证链接支持的正常验证请求和响应，按不同的验证方法分别做示例。

#### plain方式

请求：

```java
GET /auth HTTP/1.0
Host: localhost
Auth-Method: plain plain/apop/cram-md5/external
Auth-User: user
Auth-Pass: password
Auth-Protocol: imap imap/pop3/smtp
Auth-Login-Attempt: 1
Client-IP: 192.0.2.42
Client-Host: client.example.org
```

验证通过响应：

```java
HTTP/1.0 200 OK
Auth-Status: OK
Auth-Server: 198.51.100.1
Auth-Port: 143
```

验证失败响应：

```java
HTTP/1.0 200 OK
Auth-Status: Invalid login or password
Auth-Wait: 3
```

#### APOP / CRAM-MD5方式

```java
请求：
GET /auth HTTP/1.0
Host: localhost
Auth-Method: apop
Auth-User: user
Auth-Salt: <238188073.1163692009@mail.example.com>
Auth-Pass: auth_response
Auth-Protocol: imap
Auth-Login-Attempt: 1
Client-IP: 192.0.2.42
Client-Host: client.example.org
Good response:
验证通过响应：
HTTP/1.0 200 OK
Auth-Status: OK
Auth-Server: 198.51.100.1
Auth-Port: 143
Auth-Pass: plain-text-pass
```

这篇文章如果对您有所帮助或者启发的话，帮忙关注或点赞，有问题请评论，必有所复。您的支持是我写作的最大动力！
