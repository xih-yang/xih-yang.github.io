# 07、API 网关 Kong 配置说明
- 来源：https://ddkk.com/zhuanlan/gateway/kong/d-1/7.html
- 分类：API网关
- 分组：KONG 教程（版本 A）
这一部分应该在最开始介绍，但是我觉得在对kong有一定了解后再回头看下配置，会理解的更深刻。接下来对这个配置文件里的参数做个详细的解释便于更好的使用或优化kong网关。

## 1、配置加载

Kong提供了一个默认的配置文件，如果通过其中一个官方软件包安装了Kong，那么它可以在/etc/kong/kong.conf.default找到。要开始配置Kong，你可以复制这个文件：

```sh
$ cp /etc/kong/kong.conf.default /etc/kong/kong.conf
```

如果您的配置中的所有值都被注释掉，Kong将以默认设置运行。开始时，Kong查找可能包含配置文件的几个默认位置：

```sh
/etc/kong/kong.conf
/etc/kong.conf
```

可以通过在命令行中使用-c / --conf参数指定配置文件的自定义路径来覆盖此行为：

```sh
$ kong start --conf /path/to/kong.conf
```

配置格式非常简单：只需取消注释任何属性（注释由＃字符定义）并将其修改为自己需要的值。为方便起见，布尔值可以指定为on/off或true/false

## 2、验证配置

可以使用check命令验证设置的完整性：

```sh
$ kong check <path/to/kong.conf>
configuration at <path/to/kong.conf> is valid
```

该命令将考虑您当前设置的环境变量，并且在您的设置无效的情况下会出错。此外，还可以在debug模式下使用CLI来更深入地了解Kong正在启动的属性：

```sh
$ kong start -c <kong.conf> --vv
2016/08/11 14:53:36 [verbose] no config file found at /etc/kong.conf
2016/08/11 14:53:36 [verbose] no config file found at /etc/kong/kong.conf
2016/08/11 14:53:36 [debug] admin_listen = "0.0.0.0:8001"
2016/08/11 14:53:36 [debug] database = "postgres"
2016/08/11 14:53:36 [debug] log_level = "notice"
[...]
```

## 3、环境变量

当从配置文件中加载属性时，Kong也会查找同名的环境变量，这允许你通过环境变量完全配置Kong，例如，这对于基于容器的基础架构非常方便。

所有以KONG_为前缀的环境变量，大写并且与设置同名，将覆盖原配置。

```sh
例如： log_level = debug # in kong.conf
可以重写为： $ export KONG_LOG_LEVEL=error
```

## 4、自定义Nginx配置&嵌入Kong配置

调整Nginx配置是设置Kong实例的重要组成部分，它允许您优化其基础架构的性能，或者将Kong嵌入到已经运行的OpenResty实例中。

### 4.1、自定义Nginx配置

Kong可以使用--nginx-conf参数执行启动、重新加载、重新启动的操作，该参数必须指定Nginx配置模板。此模板使用[Penlight引擎](http://stevedonovan.github.io/Penlight/api/libraries/pl.template.html)，它使用指定的Kong配置进行编译，并在启动Nginx之前，将其转储到您的Kong前缀目录中。

默认的模板文件为：[https://github.com/Mashape/kong/tree/master/kong/templates](https://github.com/Mashape/kong/tree/master/kong/templates)。它分为两个Nginx配置文件：nginx.lua和nginx_kong.lua。nginx_kong.lua包含了KONG启动时的所有配置，nginx.lua则包含了nginx_kong.lua在内的所有配置。在启动Nginx之前，请将这两个文件复制到kong的根目录下，类似与这样：

```sh
/usr/local/kong
├── nginx-kong.conf
├── nginx.conf
```

如果你希望在Nginx的配置中包含其他的服务器模块，或者你必须调整Kong未公开的全局设置，可参考以下代码：

```sh
# ---------------------
# custom_nginx.template
# ---------------------
worker_processes ${{NGINX_WORKER_PROCESSES}}; # can be set by kong.conf
daemon ${{NGINX_DAEMON}};                     # can be set by kong.conf
pid pids/nginx.pid;                      # this setting is mandatory
error_log logs/error.log ${{LOG_LEVEL}}; # can be set by kong.conf
events {
    use epoll; # custom setting
    multi_accept on;
}
http {
    # include default Kong Nginx config
    include 'nginx-kong.conf';
    # custom server
    server {
        listen 8888;
        server_name custom_server;
        location / {
          ... # etc
        }
    }
}
```

然后可以使用下面的命令来启动Kong:

```sh
$ kong start -c kong.conf --nginx-conf custom_nginx.template
```

如果你希望自定义Kong Nginx子配置文件，最终添加其他Lua处理程序或自定义lua_ *指令，则可以在此custom_nginx.template示例文件中内嵌nginx_kong.lua配置：

```sh
# ---------------------
# custom_nginx.template
# ---------------------
worker_processes ${{NGINX_WORKER_PROCESSES}}; # can be set by kong.conf
daemon ${{NGINX_DAEMON}};                     # can be set by kong.conf
pid pids/nginx.pid;                      # this setting is mandatory
error_log logs/error.log ${{LOG_LEVEL}}; # can be set by kong.conf
events {}
http {
  resolver ${{DNS_RESOLVER}} ipv6=off;
  charset UTF-8;
  error_log logs/error.log ${{LOG_LEVEL}};
  access_log logs/access.log;
  ... # etc
}
```

### 4.2、在OpenResty中嵌入Kong

如果你运行自己的OpenResty服务器，还可以通过使用include指令（类似上一节例子）添加Kong Nginx的子配置文件来轻松嵌入Kong。如果你有一个有效的、只包含Kong特定配置的、top-level的NGINX配置：

```sh
# my_nginx.conf
http {
    include 'nginx-kong.conf';
}
```

你可以如下启动你的实例：

```sh
$ nginx -p /usr/local/openresty -c my_nginx.conf
```

Kong将在该实例中运行（如在nginx-kong.conf中配置一样）。

### 4.3、为Kong提供WEB和API

API提供者的一个常见用例是让Kong通过代理端口 - 服务器端口80或443服务于网站和API。例如，https://my-api.com（网站）和https://my-api.com/api/v1（API）。

为了实现这一点，我们不能简单地声明一个新的虚拟服务器模块，就像我们在前一节中所做的那样。一个好的解决方案是使用一个自定义的Nginx配置模板，该模板内联nginx_kong.lua，并添加一个新的位置块，用于服务该网站以及Kong代理位置块：

```sh
# ---------------------
# custom_nginx.template
# ---------------------
worker_processes ${{NGINX_WORKER_PROCESSES}}; # can be set by kong.conf
daemon ${{NGINX_DAEMON}};                     # can be set by kong.conf
pid pids/nginx.pid;                      # this setting is mandatory
error_log logs/error.log ${{LOG_LEVEL}}; # can be set by kong.conf
events {}
http {
  # here, we inline the contents of nginx_kong.lua
  charset UTF-8;
  # any contents until Kong's Proxy server block
  ...
  # Kong's Proxy server block
  server {
    server_name kong;
    # any contents until the location / block
    ...
    # here, we declare our custom location serving our website
    # (or API portal) which we can optimize for serving static assets
    location / {
      root /var/www/my-api.com;
      index index.htm index.html;
      ...
    }
    # Kong's Proxy location / has been changed to /api/v1
    location /api/v1 {
      set $upstream_host nil;
      set $upstream_scheme nil;
      set $upstream_uri nil;
      # Any remaining configuration for the Proxy location
      ...
    }
  }
  # Kong's Admin server block goes below
}
```

View Code

## 5、属性配置

### 5.1、通用部分

**prefix (默认 /usr/local/kong）**

工作目录。相当于Nginx的前缀路径，包含临时文件和日志。每个Kong流程都必须有一个单独的工作目录。

**log_level (默认 notice)**

Nginx服务器的日志级别。日志可以在 /logs/error.log找到

有关可接受值的列表，请参阅[http://nginx.org/en/docs/ngx_core_module.html- error_log](http://nginx.org/en/docs/ngx_core_module.html#error_log)。

**proxy_access_log (默认 logs/access.log)**

代理端口请求访问日志的路径。将此值设置为off以禁用日志记录代理请求。如果这个值是一个相对路径，它将被放置在prefix位置下。

**proxy_error_log (默认 logs/error.log)**

代理端口请求错误日志的路径。这些日志的粒度由log_level指令进行调整

**admin_access_log (默认 logs/admin_access.log)**

管理API请求访问日志的路径。将此值设置为off以禁用记录管理API请求。如果这个值是一个相对路径，它将被放置在prefix位置下。

**admin_error_log (默认 logs/error.log)**

管理API请求错误日志的路径。这些日志的粒度由log_level指令进行调整。

**custom_plugins (默认None，举例：my-plugin,hello-world,custom-rate-limiting)**

应加载此节点的逗号分隔的其他插件列表。使用此属性加载未与Kong捆绑的自定义插件。插件将从kong.plugins.{name}.*命名空间中加载

**anonymous_reports (默认 on)**

发送匿名使用数据（如错误堆栈跟踪）以帮助改进Kong。

#### 2.nginx部分

**proxy_listen (默认 0.0.0.0:8000, 0.0.0.0:8443 ssl 示例：0.0.0.0:80, 0.0.0.0:81 http2, 0.0.0.0:443 ssl, 0.0.0.0:444 http2 ssl)**

代理服务器应该侦听的地址和端口的逗号分隔列表。代理服务器是Kong的公共入口点，它将消费者的流量代理到后端服务。该值接受IPv4，IPv6和主机名。

可以为每一对指定一些后缀：

- ssl将要求通过特定address/port进行的所有连接都是在启用TLS的情况下进行的。
- http2将允许客户端打开到Kong代理服务器的HTTP/2连接。
- 最后，proxy_protocol将启用对给定address/port使用PROXY协议。

该节点的代理端口，启用可以配置连接到同一数据库的节点集群的“control-plane”模式（无流量代理功能）。

请参阅[http://nginx.org/en/docs/http/ngx_http_core_module.html- listen](http://nginx.org/en/docs/http/ngx_http_core_module.html#listen)以获取有关此和其他* _listen值的可接受格式的说明。

**admin_listen (默认 127.0.0.1:8001, 127.0.0.1:8444 ssl 示例 127.0.0.1:8444 http2 ssl)**

管理界面应该监听的地址和端口的逗号分隔列表。 Admin界面是允许您配置和管理Kong的API。只有Kong管理员才能访问此界面。该值接受IPv4，IPv6和主机名。可以为每一对指定一些后缀：

- ssl将要求通过特定地址/端口进行的所有连接都是在启用TLS的情况下进行的。
- http2将允许客户端打开到Kong代理服务器的HTTP / 2连接。
- 最后，proxy_protocol将启用对给定地址/端口使用PROXY协议。

可以将此值设置为off，从而禁用此节点的Admin界面，启用“data-plane”模式（无配置功能）从数据库中提取其配置更改。

**nginx_user (默认 nobody nobody 示例 nginx www)**

定义工作进程使用的用户和组凭据。如果省略组，则使用名称等于用户名的组。

**nginx_worker_processes (默认 auto)**

确定Nginx产生的工作进程的数量。请参阅[http://nginx.org/en/docs/ngx_core_module.html- worker_processes](http://nginx.org/en/docs/ngx_core_module.html#worker_processes)了解该指令的详细用法以及可接受值的说明。

**nginx_daemon (默认 on)**

确定Nginx是作为后台进程运行还是作为前台进程运行。主要用于开发或在Docker环境中运行Kong时使用。请参阅[http://nginx.org/en/docs/ngx_core_module.html- daemon](http://nginx.org/en/docs/ngx_core_module.html#daemon)。

**mem_cache_size ( 默认128M)**

数据库实体的内存缓存大小。接受的单位是k和m，最小推荐值为几MB。

**ssl_cipher_suite （默认 modern）**

定义Nginx提供的TLS密码。接受的值是modern, intermediate, old或 custom。有关每个密码套件的详细说明，请参阅[https://wiki.mozilla.org/Security/Server_Side_TLS](https://wiki.mozilla.org/Security/Server_Side_TLS)。

**ssl_ciphers (默认 None)**

定义由Nginx提供的TLS密码的自定义列表。该列表必须符合由openssl ciphers定义的模式。如果ssl_cipher_suite不是custom的，则该值将被忽略。

**ssl_cert (默认 None)**

启用了SSL的proxy_listen值的SSL证书(certificate)的绝对路径。

**ssl_cert_key (默认 None)**

启用了SSL的proxy_listen值的SSL密钥(key)的绝对路径。

**client_ssl (默认 off)**

确定Nginx在代理请求时是否应发送客户端SSL证书。

**client_ssl_cert (默认 None)**

如果启用client_ssl，则为proxy_ssl_certificate指令的客户端SSL证书的绝对路径。请注意，此值静态定义在节点上，并且当前不能基于每个API进行配置。

**client_ssl_cert_key (默认None)**

如果启用client_ssl，则为proxy_ssl_certificate_key地址的客户端SSL密钥的绝对路径。请注意，此值在节点上静态定义，并且当前无法在每个API基础上配置。

**admin_ssl_cert (默认 None)**

启用了SSL的admin_listen值的SSL证书的绝对路径。

**admin_ssl_cert_key (默认 None)**

启用了SSL的admin_listen值的SSL密钥的绝对路径。

**upstream_keepalive (默认60)**

设置保留在每个辅助进程缓存中的上游服务器的最大空闲保活连接数。当这个数字被超过时，最近最少使用的连接被关闭。

**server_tokens (默认 on)**

启用或禁用在错误页面和Server或Via（如果请求被代理）响应头(response header)字段中发出Kong版本。

**latency_tokens (默认 on)**

启用或禁用在X-Kong-Proxy-Latency和X-Kong-Upstream-Latency响应头域中发布Kong延迟信息。

**trusted_ips (默认 None)**

定义已知可发送正确的X-Forwarded-*标头的可信IP地址块。来自可信IP的请求使得Kong向上游转发他们的X-Forwarded- *报头。不可信的请求使得Kong插入它自己的X-Forwarded- *标头。

该属性还可以在Nginx配置中设置set_real_ip_from指令。它接受相同类型的值（CIDR块），但是作为逗号分隔的列表。

要信任所有/\IP，请将此值设置为0.0.0.0/0,::/0。

如果指定了特殊值unix：，则所有UNIX域套接字都将被信任。

有关set_real_ip_from指令的更多详细信息，请参阅[Nginx文档](http://nginx.org/en/docs/http/ngx_http_realip_module.html#set_real_ip_from)。

**real_ip_header (默认 X-Real-IP)**

定义其值将用于替换客户端地址的请求标头字段。该值在Nginx配置中设置相同名称的[ngx_http_realip_module](http://nginx.org/en/docs/http/ngx_http_realip_module.html)指令。

如果此值接收proxy_protocol，则proxy_protocol参数将被附加到Nginx模板的listen指令。

有关此指令的说明，请参阅[Nginx文档](http://nginx.org/en/docs/http/ngx_http_realip_module.html#real_ip_header)。

real_ip_recursive (默认 off)

该值在Nginx配置中设置相同名称的[ngx_http_realip_module](http://nginx.org/en/docs/http/ngx_http_realip_module.html)指令。

有关此指令的说明，请参阅[Nginx文档](http://nginx.org/en/docs/http/ngx_http_realip_module.html#real_ip_recursive)。

**client_max_body_size (默认 0)**

定义由Kong代理的请求允许的最大请求主体大小，在Content-Length请求头中指定。如果请求超过这个限制，Kong将回复413（请求实体太大）。将此值设置为0将禁用检查请求主体大小。

注意：请参阅[Nginx文档](http://nginx.org/en/docs/http/ngx_http_core_module.html#client_max_body_size)以获取有关此参数的进一步说明。数字值可以用k或m作为后缀，以千字节或兆字节为单位表示限制。

**client_body_buffer_size (默认 8k)**

定义读取请求主体的缓冲区大小。如果客户端请求主体大于此值，则主体将被缓冲到磁盘。请注意，当主体缓存到磁盘时访问或操作请求主体的Kong插件可能无法工作，因此建议将此值设置为尽可能高（例如，将其设置为与client_max_body_size一样高以强制请求主体保留在内存中）。请注意，高并发环境将需要大量的内存分配来处理许多并发的大型请求体。

注意：请参阅[Nginx文档](http://nginx.org/en/docs/http/ngx_http_core_module.html#client_body_buffer_size)以获取有关此参数的进一步说明。数字值可以用k或m作为后缀，以千字节或兆字节为单位表示限制。

**error_default_type (默认 text/plain)**

在请求Accept头部缺失并且Nginx正在为请求返回错误时使用的默认的MIME类型。接受的值是text / plain，text / html，application / json和application / xml。

#### 3.数据存储部分

Kong将把所有的数据（如API，消费者和插件）存储在Cassandra或PostgreSQL中。

属于同一集群的所有Kong节点必须将自己连接到同一个数据库。

```sh
从Kong v0.12.0开始：
PostgreSQL 9.4支持应被视为弃用。建议升级到9.5+
Cassandra 2.1支持应该被视为弃用。建议升级到2.2+
```

确定Kong节点将使用哪个PostgreSQL或Cassandra作为其数据存储。可接受的值是postgres和cassandra。

默认：postgres

**Postgres 设置**

名称
描述

pg_host
Postgres的服务器的主机地址

pg_port
Postgres的服务器的端口

pg_user
Postgres用户名

pg_password
Postgres的用户密码

pg_database
要连接的数据库实例名，必须存在

pg_ssl
是否启用与服务器的SSL连接

pg_ssl_verify
如果启用了pg_ssl，则切换服务器证书验证。请参阅lua_ssl_trusted_certificate设置

**Cassandra设置**

名称
描述

cassandra_contact_points
集群名称列表，以逗号分隔

cassandra_port
节点正在监听的端口

cassandra_keyspace
在群集中使用的密钥空间，如果不存在将被自动创建

cassandra_consistency
设置读写操作的一致性

cassandra_timeout
读写操作的超时设定，单位为毫秒ms

cassandra_ssl
配置启用SSL连接

cassandra_ssl_verify
如果启用cassandra_ssl，则切换服务器证书验证。请参阅lua_ssl_trusted_certificate设置

cassandra_username
使用PasswordAuthenticator方案时的用户名

cassandra_password
使用PasswordAuthenticator方案时的用户密码

cassandra_consistency
读/写Cassandra群集时使用的一致性设置

cassandra_lb_policy
在Cassandra群集中分发查询时使用的负载均衡策略。接受的值是RoundRobin和DCAwareRoundRobin。当且仅当您使用多数据中心集群时方可配置，此时，请同时配置cassandra_local_datacenter选项

cassandra_local_datacenter
当使用DCAwareRoundRobin策略时，必须在KONG节点中指定本地集群的名称

cassandra_repl_strategy
如果是首次创建密钥空间，请指定复制策略

cassandra_repl_factor
指定SimpleStrategy的复制条件

cassandra_data_centers
指定NetworkTopologyStrategy的数据中心

cassandra_schema_consensus_timeout
定义Cassandra节点之间每个模式共识等待期的超时（以毫秒为单位）。该值仅在迁移过程中使用。

#### 4.数据缓存部分

为了避免与数据存储区进行不必要的通信，Kong将实体（例如API，消费者，证书等）缓存一段可配置的时间。如果实体更新，它也处理失效。

本节允许配置Kong关于缓存这些配置实体的行为。

**db_update_frequency (默认 5s )**

用数据存储检查更新实体的频率（以秒为单位）。当节点通过管理API创建，更新或删除实体时，其他节点需要等待下一轮（由该值配置）最终清除旧缓存实体并开始使用新实例。

**db_update_propagation (默认 0s)**

用于将数据存储中的实体传播到其他数据中心的副本节点(replica nodes)的时间（以秒为单位）。在分布式环境（如多数据中心Cassandra群集）中，此值应为Cassandra将行传播(propagate)到其他数据中心所花费的最大秒数。设置后，该属性将增加Kong传播实体更改所花费的时间。单数据中心设置或PostgreSQL服务器应该不会出现这种延迟，并且该值可以安全地设置为0。

**db_cache_ttl (默认3600s,即1h)**

当由此节点缓存时，实体从数据存储区生存的时间（以秒为单位）。根据此设置，数据库未命中（无实体）也被缓存。如果设置为0，则此类缓存的实体/未命中将永不过期。

#### 5.DNS解析部分

Kong会将主机名解析为SRV或A记录（按此顺序，CNAME记录将在过程中解除引用）。如果一个名称被解析为SRV记录，它也将通过从DNS服务器接收的port字段内容覆盖任何给定的端口号。

DNS选项SEARCH和NDOTS（来自/etc/resolv.conf文件）将用于将短名称扩展为完全合格的名称。所以它会首先尝试整个SEARCH列表中的SRV类型，如果失败，它会尝试SEARCH A记录列表等。

在ttl的持续时间内，内部DNS解析器将负载均衡其通过DNS记录中的条目获得的每个请求。对于SRV记录，权重(weight)字段将被遵守，但它只会使用记录中最低优先级(lowest priority)的字段条目。

**dns_resolver (默认 None)**

由逗号分隔的服务器名称列表，每个条目的格式为 ipv4 [：port]。如果未指定，将使用本地 resolv.conf 文件中的服务器名称。如果省略，则默认端口号为53。

**dns_hostsfile (默认 /etc/hosts)**

hosts文件。该文件在启动时被读取一次，其在内存中是静态的。如果要修改此文件，必须重新加载服务。

**dns_order (默认 LAST,SRV,A,CNAME )**

解析不同记录类型的顺序。 LAST类型表示上次成功查找的类型（用于指定的名称）。格式是一个（不区分大小写）逗号分隔的列表。

**dns_stale_ttl (默认 4s)**

以秒为单位定义记录在超过TTL时将保留在缓存中的时间。这个值将在后台获取新的DNS记录时使用。陈旧的数据将在记录到期时使用，直到刷新查询完成或经过了dns_stale_ttl秒数。

**dns_not_found_ttl (默认 30s)**

TTL在几秒钟内为空DNS响应和“（3）name error”响应。

**dns_error_ttl (默认 1s)**

错误响应的TTL。

**dns_no_sync (默认 off)**

如果启用，则在缓存未命中时，每个请求都会触发其自己的dns查询。禁用时，对同一name/type的多个请求将同步到单个查询。

#### 6.开发&杂项

从lua-nginx模块继承的其他设置允许更多的灵活性和高级用法。

有关更多信息，请参阅lua-nginx-module文档：https：//github.com/openresty/lua-nginx-module。

**lua_ssl_trusted_certificate (默认 None)**

PEM格式的Lua cosockets的证书颁发机构文件的绝对路径。当启用pg_ssl_verify或cassandra_ssl_verify时，此证书将用于验证Kong的数据库连接。参见[文档](https://github.com/openresty/lua-nginx-module#lua_ssl_trusted_certificate)

**lua_ssl_verify_depth (默认 1)**

设置由lua_ssl_trusted_certificate设置的Lua套接字使用的服务器证书链中的验证深度。

这包括为Kong的数据库连接配置的证书。 参见[文档](https://github.com/openresty/lua-nginx-module#lua_ssl_verify_depth)

**lua_package_path （默认 None）**

设置Lua模块搜索路径（LUA_PATH）。在开发或使用未存储在默认搜索路径中的自定义插件时非常有用。参见 文档

**lua_package_cpath （默认 None）**

设置Lua C模块搜索路径（LUA_CPATH）参见[文档](https://github.com/openresty/lua-nginx-module#lua_package_cpath)

**lua_socket_pool_size (默认 30)**

指定与每个远程服务器关联的每个Cosocket连接池的大小限制。参见[文档](https://github.com/openresty/lua-nginx-module#lua_socket_pool_size)

累死宝宝了，终于结束了～

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://www.cnblogs.com/zhoujie/tag/kong/
