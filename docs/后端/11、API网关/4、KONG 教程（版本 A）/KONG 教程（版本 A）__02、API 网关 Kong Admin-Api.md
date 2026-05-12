# 02、API 网关 Kong Admin-Api
- 来源：https://ddkk.com/zhuanlan/gateway/kong/d-1/2.html
- 分类：API网关
- 分组：KONG 教程（版本 A）
部署好kong之后，则需要将我们自己的接口加入到kong中管理，kong提供了比较全面的restful api，每个版本会有所不同，下面的记录基于kong v0.13.x

kong的8001端口是resful admin api，服务、路由、配置都是通过这个端口进行管理，所以部署好之后页面可以直接访问localhost:8001

下面针对每个模块的API进行简介，每个对象模块对应数据库中的一张存储表。

## Information Routes

获取kong节点的通用详细信息

管理API的请求日志路径

```sh
/usr/local/opt/kong/logs
.
├── access.log
├── admin_access.log #admin-api请求日志
└── error.log
```

### 查询节点信息

**Example**

```sh
curl  http://localhost:8001
```

**Endpoint**

```sh
GET /
```

**Response**

```json
{
    "plugins": {
        "enabled_in_cluster": [],
        "available_on_server": {
            "response-transformer": true,
            "correlation-id": true,
            "statsd": true,
            "jwt": true,
            "cors": true,
            "basic-auth": true,
            "key-auth": true,
            "ldap-auth": true,
            "http-log": true,
            "oauth2": true,
            "hmac-auth": true,
            "acl": true,
            "datadog": true,
            "tcp-log": true,
            "ip-restriction": true,
            "request-transformer": true,
            "file-log": true,
            "bot-detection": true,
            "loggly": true,
            "request-size-limiting": true,
            "syslog": true,
            "udp-log": true,
            "response-ratelimiting": true,
            "aws-lambda": true,
            "runscope": true,
            "rate-limiting": true,
            "request-termination": true
        }
    },
    "tagline": "Welcome to kong",
    "configuration": {
        "error_default_type": "text/plain",
        "admin_listen": [
            "0.0.0.0:8001"
        ],
        "proxy_access_log": "logs/access.log",
        "trusted_ips": {},
        "prefix": "/usr/local/opt/kong",
        "nginx_conf": "/usr/local/opt/kong/nginx.conf",
        "cassandra_username": "kong",
        "admin_ssl_cert_csr_default": "/usr/local/opt/kong/ssl/admin-kong-default.csr",
        "dns_resolver": {},
        "pg_user": "kong",
        "mem_cache_size": "128m",
        "server_tokens": true,
        "custom_plugins": {},
        "pg_host": "127.0.0.1",
        "nginx_acc_logs": "/usr/local/opt/kong/logs/access.log",
        "proxy_listen": [
            "0.0.0.0:8000"
        ],
        "client_ssl_cert_default": "/usr/local/opt/kong/ssl/kong-default.crt",
        "ssl_cert_key_default": "/usr/local/opt/kong/ssl/kong-default.key",
        "db_update_frequency": 5,
        "db_update_propagation": 0,
        "nginx_err_logs": "/usr/local/opt/kong/logs/error.log",
        "cassandra_port": 9042,
        "dns_order": [
            "LAST",
            "SRV",
            "A",
            "CNAME"
        ],
        "dns_error_ttl": 1,
        "cassandra_lb_policy": "RoundRobin",
        "nginx_optimizations": true,
        "database": "postgres",
        "pg_database": "kong",
        "nginx_worker_processes": "auto",
        "lua_package_cpath": "",
        "lua_package_path": "./?.lua;./?/init.lua;",
        "nginx_pid": "/usr/local/opt/kong/pids/nginx.pid",
        "upstream_keepalive": 60,
        "admin_access_log": "logs/admin_access.log",
        "client_ssl_cert_csr_default": "/usr/local/opt/kong/ssl/kong-default.csr",
        "proxy_listeners": [{
            "ssl": false,
            "ip": "0.0.0.0",
            "proxy_protocol": false,
            "port": 8000,
            "http2": false,
            "listener": "0.0.0.0:8000"
        }],
        "proxy_ssl_enabled": false,
        "lua_socket_pool_size": 30,
        "plugins": {
            "response-transformer": true,
            "correlation-id": true,
            "statsd": true,
            "jwt": true,
            "cors": true,
            "basic-auth": true,
            "key-auth": true,
            "ldap-auth": true,
            "http-log": true,
            "request-termination": true,
            "hmac-auth": true,
            "rate-limiting": true,
            "datadog": true,
            "tcp-log": true,
            "runscope": true,
            "aws-lambda": true,
            "response-ratelimiting": true,
            "acl": true,
            "loggly": true,
            "syslog": true,
            "request-size-limiting": true,
            "udp-log": true,
            "file-log": true,
            "request-transformer": true,
            "bot-detection": true,
            "ip-restriction": true,
            "oauth2": true
        },
        "lua_ssl_verify_depth": 1,
        "cassandra_consistency": "ONE",
        "client_max_body_size": "0",
        "admin_error_log": "logs/error.log",
        "admin_ssl_cert_default": "/usr/local/opt/kong/ssl/admin-kong-default.crt",
        "dns_not_found_ttl": 30,
        "pg_ssl": false,
        "admin_ssl_enabled": false,
        "cassandra_ssl": false,
        "cassandra_repl_strategy": "SimpleStrategy",
        "latency_tokens": true,
        "dns_stale_ttl": 4,
        "cassandra_repl_factor": 1,
        "cassandra_data_centers": [
            "dc1:2",
            "dc2:3"
        ],
        "kong_env": "/usr/local/opt/kong/.kong_env",
        "cassandra_schema_consensus_timeout": 10000,
        "dns_hostsfile": "/etc/hosts",
        "log_level": "notice",
        "admin_ssl_cert_key_default": "/usr/local/opt/kong/ssl/admin-kong-default.key",
        "real_ip_header": "X-Real-IP",
        "db_cache_ttl": 3600,
        "cassandra_timeout": 5000,
        "cassandra_ssl_verify": false,
        "dns_no_sync": false,
        "cassandra_contact_points": [
            "127.0.0.1"
        ],
        "real_ip_recursive": "off",
        "proxy_error_log": "logs/error.log",
        "client_ssl_cert_key_default": "/usr/local/opt/kong/ssl/kong-default.key",
        "nginx_daemon": "on",
        "anonymous_reports": true,
        "ssl_cipher_suite": "modern",
        "nginx_kong_conf": "/usr/local/opt/kong/nginx-kong.conf",
        "pg_port": 5432,
        "pg_ssl_verify": false,
        "client_body_buffer_size": "8k",
        "nginx_admin_acc_logs": "/usr/local/opt/kong/logs/admin_access.log",
        "ssl_cert_csr_default": "/usr/local/opt/kong/ssl/kong-default.csr",
        "admin_listeners": [{
            "ssl": false,
            "ip": "0.0.0.0",
            "proxy_protocol": false,
            "port": 8001,
            "http2": false,
            "listener": "0.0.0.0:8001"
        }],
        "cassandra_keyspace": "kong",
        "ssl_cert_default": "/usr/local/opt/kong/ssl/kong-default.crt",
        "client_ssl": false,
        "ssl_ciphers": "ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA256"
    },
    "version": "0.13.1",
    "node_id": "e9ca18fb-a82c-4730-83a1-621ceadc3c38",
    "lua_version": "LuaJIT 2.1.0-beta3",
    "prng_seeds": {
        "pid: 752": 149231181689,
        "pid: 751": 159113818774,
        "pid: 750": 702104292191,
        "pid: 753": 191164118531
    },
    "timers": {
        "pending": 5,
        "running": 0
    },
    "hostname": "jeandeMacBook-Pro.local"
}
```

View Code

部分返回字段含义：

node_id : 正在运行的kong节点的uuid，当kong启动时随机生成，每次kong重启时这个uuid都会变

availabel_on_server : kong节点上安装的plugins的名称

enabled_in_cluster : kong节点中启用的插件，即在数据库中生成了对应存储表

### 查询节点状态

**Example**

```sh
curl  http://localhost:8001/status
```

**Endpoint**

```sh
GET /status
```

**Response**

```json
{
    "database": {
        "reachable": true
    },
    "server": {
        "connections_writing": 1,
        "total_requests": 29,
        "connections_handled": 32,
        "connections_accepted": 32,
        "connections_reading": 0,
        "connections_active": 3,
        "connections_waiting": 2
    }
}
```

total_requests : 客户端请求总数

connections_active : 包括等待连接的活动客户端连接的当前数量

connections_accepted : 接受的客户端连接的总数

connections_handled : 处理连接的总数。一般来说，除非达到一定的资源限制，否则参数值与接受值相同

connections_reading : 当前Kong正在读取请求头的连接数

connections_writing : NGINX将响应写入客户端的连接的当前数量

connections_waiting : 等待请求的空闲客户端连接的当前数量

reachable : 反映数据库连接状态的布尔值。注意，此标志不反映数据库本身的健康状况。

## API Object

kong v0.13.x之前的版本是通过这个接口来管理用户接入的API，但是**v0.13.x版本之后，官方不建议使用API来管理用户接口，而是用Service和Route模块来替代**，管理的更精细。

KONG API模块管理的是接入kong的上游API，每个接入的api**必须至少指定hosts/uris/methods**其中一个参数，kong将会代理所有指定upstream url的请求。

### 新增一个接入的API

**Example**

```sh
curl -i -X POST \
  --url  http://localhost:8001/apis/ \
  --data 'name=weather-api' \
  --data 'hosts=www.sojson.com' \
  --data 'uris=/weather' \
  --data 'upstream_url=https://www.sojson.com/open/api/weather/json.shtml'
```

**Endpoint**

```sh
POST  /apis/
```

**Request Body**

属性
约束
描述

name
required
接入的API名称

hosts
semi-optional
逗号分割的接入API的域名列表

uris
semi-optional
逗号分割的接入API的前缀path，即指定uri用户通过kong刚问要加上这个path

methods
semi-optional
逗号分割的接入API的HTTP method，如get /post/ put/delete/..

upstream_url
required
代理的上游API Server

strip_uri
optional,default:true
当匹配到uris前缀时，去掉请求的upstream_url中匹配的uris；即uris是挂载在kong的路径下，不是上游接口的path

preserve_host
optional,default:false
Kong默认将上游请求的Host头设置为从API的upstream_url中提取的主机名，当通过hosts来匹配API时，确保hosts能转发到上游服务

retries
optional,default:5
代理失败时重试的次数

upstream_connect_timeout
optional,default:60000ms
建立与上游连接的超时时间(ms)

upstream_send_timeout
optional,default:60000ms
在发送请求到上游服务的两个连续写入操作之间的超时时间(ms)

upstream_read_timeout
optional,default:60000ms
在发送请求到上游服务的两个连续读取操作之间的超时时间(ms)

https_only
optional,default:false
如果希望仅通过HTTPS转发API（默认8443端口），则启用

http_if_terminated
optional,default:false
仅在https限流时才考虑设置X-Forwarded-Proto头部

**Response**

```sh
HTTP/1.1 201 Created
Date: Sat, 26 May 2018 07:54:34 GMT
Content-Type: application/json; charset=utf-8
Transfer-Encoding: chunked
Connection: keep-alive
Access-Control-Allow-Origin: *
Server: kong/0.13.1
{
    "created_at": 1527350074050,
    "strip_uri": true,
    "id": "c347a69e-d81e-402b-87b0-c8cf25a771e5",
    "hosts": ["www.sojson.com"],
    "name": "weather-api",
    "uris": ["\/weather"],
    "http_if_terminated": false,
    "preserve_host": false,
    "upstream_url": "https://www.sojson.com/open/api/weather/json.shtml",
    "upstream_connect_timeout": 60000,
    "upstream_send_timeout": 60000,
    "upstream_read_timeout": 60000,
    "retries": 5,
    "https_only": false
}
```

上面接口到意思是：这个API注册的名字叫weather-api。它被挂载在网关的`/weather`路径下，上游转发到`http://localhost:8000`去处理，转发的时候把前面的`/weather`前缀给去掉。

注意uris必须加slash /，默认是/ strip_uri到作用也很明显，就是在代理下面划分虚拟路径便于管理

新增好API后则可以通过kong代理来访问代理的服务

```sh
# 原接口
curl https://www.sojson.com/open/api/weather/json.shtml?city=上海
#通过kong代理访问
curl -i -X GET \
   --header 'host:www.sojson.com' \
   --url  http://localhost:8000/weather?city=上海
```

### 根据name或id获取一个API

**Example**

```sh
  curl -i -X GET \
  --url  http://localhost:8001/apis/weather-api 
或
  curl -i -X GET \
  --url  http://localhost:8001/apis/c347a69e-d81e-402b-87b0-c8cf25a771e5
```

**Endpoint**

```sh
GET /apis/{name or id}
```

**Request Params**

属性
约束
描述

name or id
required
接入API到唯一标识符，name或者id

**Response**

```sh
HTTP/1.1 200 OK
Date: Sat, 26 May 2018 08:18:43 GMT
Content-Type: application/json; charset=utf-8
Transfer-Encoding: chunked
Connection: keep-alive
Access-Control-Allow-Origin: *
Server: kong/0.13.1
{
    "created_at": 1527350074050,
    "strip_uri": true,
    "id": "c347a69e-d81e-402b-87b0-c8cf25a771e5",
    "hosts": ["www.sojson.com"],
    "name": "weather-api",
    "uris": ["\/weather"],
    "http_if_terminated": false,
    "preserve_host": false,
    "upstream_url": "https://www.sojson.com/open/api/weather/json.shtml",
    "upstream_connect_timeout": 60000,
    "upstream_send_timeout": 60000,
    "upstream_read_timeout": 60000,
    "retries": 5,
    "https_only": false
}
```

### 查询所有接入到API列表

**Example**

```sh
curl -i -X GET   --url  http://localhost:8001/apis/
```

**Endpoint**

```sh
GET /apis/
```

**Request Querystring**

属性
约束
描述

id
optional
同post描述

name
optional

upstream_url
optional

retries
optional

size
optional
limit，查询的记录条数

offset
optional
cursor位置，用于分页

**Response**

```sh
HTTP/1.1 200 OK
Date: Sat, 26 May 2018 08:25:33 GMT
Content-Type: application/json; charset=utf-8
Transfer-Encoding: chunked
Connection: keep-alive
Access-Control-Allow-Origin: *
Server: kong/0.13.1
{
    "total": 1,
    "data": [{
        "created_at": 1527350717171,
        "strip_uri": true,
        "id": "b93fcbe7-5dba-4888-bf8c-f4c8f798b53a",
        "hosts": ["www.sojson.com"],
        "name": "weather-api",
        "http_if_terminated": false,
        "https_only": false,
        "retries": 5,
        "uris": ["\/weather"],
        "preserve_host": false,
        "upstream_connect_timeout": 60000,
        "upstream_read_timeout": 60000,
        "upstream_send_timeout": 60000,
        "upstream_url": "https://www.sojson.com/open/api/weather/json.shtml"
    }]
}
```

### 根据name或id更新一个API

**Example**

```sh
 curl -i -X PATCH \
  --url  http://localhost:8001/apis/weather-api \
  --data 'name=weather-api-1' \
  --data 'retries=6'
或
  curl -i -X PATCH \
  --url  'http://localhost:8001/apis/b93fcbe7-5dba-4888-bf8c-f4c8f798b53a' \
  --data 'name=weather-api-1' \
  --data 'retries=6'
```

**Endpoint**

```sh
PATCH /apis/{name or id}
```

**Request Param**

同GET /apis/{name or id}

**Request Body**

同POST /apis/

**Response**

同GET /apis/{name or id}，返回的是更新后的数据

### 更新或新增一个API

**Example**

```sh
#更新一个存在的API
curl -i -X PUT \
  --url  http://localhost:8001/apis/ \
  --data 'id=b93fcbe7-5dba-4888-bf8c-f4c8f798b53a' \
  --data 'hosts=www.sojson.com' \
  --data 'uris=/weather' \
  --data 'upstream_url=https://www.sojson.com/open/api/weather/json.shtml'
#更新一个不存在的API
curl -i -X PUT \
  --url  http://localhost:8001/apis/ \
  --data 'name=test' \
  --data 'hosts=www.sojson.com' \
  --data 'uris=/weather' \
  --data 'upstream_url=https://www.sojson.com/open/api/weather/json.shtml'
#新增
  curl -i -X PUT \
  --url  http://localhost:8001/apis/ \
  --data 'hosts=www.sojson.com' \
  --data 'upstream_url=https://www.sojson.com/open/api/weather/json.shtml'
```

PUT接口的含义是：

如果request body中包含已有的API的主键（name or id），则会根据name or id 执行更新操作，同PATCH /apis/{name or id}；

如果指定了name or id但是没有查询到该记录，则返回404 NOT FOUND；

如果没有指定主键，则会新增一个API，同POST /apis/。

**Endpoint**

```sh
PUT /apis/
```

**Request Body**

同POST /apis/

**Response**

```sh
HTTP 201 Created or HTTP 200 OK
返回数据同POST or PATCH reponses
```

### 根据name或id删除一个API

**Example**

```sh
  curl -i -X DELETE \
  --url  http://localhost:8001/apis/weather-api 
或
  curl -i -X DELETE \
  --url  http://localhost:8001/apis/b93fcbe7-5dba-4888-bf8c-f4c8f798b53a
```

**Endpoint**

```sh
DELETE /apis/{name or id}
```

**Request Param**

同GET /apis/{name or id}

**Response**

```sh
HTTP/1.1 204 No Content
Date: Sat, 26 May 2018 08:52:15 GMT
Connection: keep-alive
Access-Control-Allow-Origin: *
Server: kong/0.13.1
```

## Service Object

服务是上游服务中的每一个抽象，服务的主要属性是url，它可以被设置为单个字符串或单独指定它的 protocol、host、port and path。服务与路由相关（一个服务可以关联多个路由），路由是Kong中的入口点，并定义与客户端请求匹配的规则。一旦路由匹配，Kong将请求委托给其关联的服务。

### 新增一个Service

**Example**

```sh
  curl -i -X POST \
  --url  http://localhost:8001/services/ \
  --data 'name=service-stock' \
  --data 'url=http://hq.sinajs.cn'
或
  curl -i -X POST \
  --url  http://localhost:8001/services/ \
  --data 'name=service-stock' \
  --data 'protocal=http' \ 
  --data 'host=hq.sinajs.cn' \
  --data 'port=80'
```

**Endpoint**

```sh
POST /services/
```

**Request Body**

属性
约束
描述

name
optional
服务名称

protocol
required,default:http
用于与上游接口通信的协议。是http或https

host
required
上游服务的host

port
required,default:80
上游服务的端口

path
optional,default:null
请求上游服务器使用的路径，默认为空

retries
optional,default:5
代理失败时重试的次数

connect_timeout
optional,default:60000ms
建立与上游服务器连接的超时时间(ms)

write_timeout
optional,default:60000ms
在向上游服务器发送请求的两个连续写入操作之间的超时时间(ms)

read_timeout
optional,default:60000ms
在向上游服务器发送请求的两个连续读取操作之间的超时时间(ms)

url
shorthand-attribute
一次性设置protocol、host、port和path的缩写。此属性是只读的（管理API不会返回“URL”）

注：可用url来代替同时指定protocal/host/port/path，但url不会出现在返回字段中。

**Response**

```sh
HTTP/1.1 201 Created
Date: Sat, 26 May 2018 16:44:39 GMT
Content-Type: application/json; charset=utf-8
Transfer-Encoding: chunked
Connection: keep-alive
Access-Control-Allow-Origin: *
Server: kong/0.13.1
{
    "host": "hq.sinajs.cn",
    "created_at": 1527324279,
    "connect_timeout": 60000,
    "id": "9ec3c166-f29a-4b04-a33e-c17ac42a3429",
    "protocol": "http",
    "name": "service-stock",
    "read_timeout": 60000,
    "port": 80,
    "path": null,
    "updated_at": 1527324279,
    "retries": 5,
    "write_timeout": 60000
}
```

### 根据name或id查询一个Service

**Example**

```sh
curl -i -X GET \
  --url  http://localhost:8001/services/service-stock 
```

**Endpoint**

```sh
GET /services/{name or id}
```

**Request Param**

属性
约束
描述

name or id
required
服务的唯一标识符

**Response**

```sh
HTTP/1.1 200 OK
Date: Sat, 26 May 2018 16:50:41 GMT
Content-Type: application/json; charset=utf-8
Transfer-Encoding: chunked
Connection: keep-alive
Access-Control-Allow-Origin: *
Server: kong/0.13.1
{
    "host": "hq.sinajs.cn",
    "created_at": 1527324279,
    "connect_timeout": 60000,
    "id": "9ec3c166-f29a-4b04-a33e-c17ac42a3429",
    "protocol": "http",
    "name": "service-stock",
    "read_timeout": 60000,
    "port": 80,
    "path": null,
    "updated_at": 1527324279,
    "retries": 5,
    "write_timeout": 60000
}
```

### 根据route_id获取一个服务

**Example**

```sh
 curl -i -X GET \
  --url  http://localhost:8001/routes/{ROUTE_ID}/service 
```

**Endpoint**

```sh
GET /routes/{route id}/service
```

Request Param

属性
约束
描述

route id
required
属于要检索的服务的路由的唯一标识符

**Response**

同GET/services/{name or id}返回结果

### 查询所有服务列表

**Example**

```sh
curl -i -X GET \
  --url  http://localhost:8001/services/ 
```

**Endpoint**

```sh
GET /services/
```

**Request QueryString**

属性
约束
描述

offset
optional
分页的游标。offset是定义列表中某个位置的对象标识符

size
optional,default :100, max:1000
每页返回的记录数量

**Response**

```sh
HTTP/1.1 200 OK
Date: Sat, 26 May 2018 17:05:39 GMT
Content-Type: application/json; charset=utf-8
Transfer-Encoding: chunked
Connection: keep-alive
Access-Control-Allow-Origin: *
Server: kong/0.13.1
{
    "next": "http://localhost:8001/services?offset=6378122c-a0a1-438d-a5c6-efabae9fb969",
    "data": [{
        "host": "hq.sinajs.cn",
        "created_at": 1527324279,
        "connect_timeout": 60000,
        "id": "9ec3c166-f29a-4b04-a33e-c17ac42a3429",
        "protocol": "http",
        "name": "service-stock",
        "read_timeout": 60000,
        "port": 80,
        "path": null,
        "updated_at": 1527324279,
        "retries": 5,
        "write_timeout": 60000
    }]
}
```

### 根据name或id更新服务

**Example**

```sh
 curl -i -X PATCH \
  --url  http://localhost:8001/services/service-stock \
  --data 'name=service-stock-1' \
  --data 'retries=6'
或
  curl -i -X PATCH \
  --url  'http://localhost:8001/apis/9ec3c166-f29a-4b04-a33e-c17ac42a3429' \
  --data 'name=service-stock-1' \
  --data 'retries=6'
```

**Endpoint**

```sh
PATCH /services/{name or id}
```

**Request Param**

name or id

**Requst Body**

同POST /services/ Request Body

**Response**

同PATCH /apis/{name or id} 返回结构

### 根据route_id更新服务

Endpoint

```sh
PATCH /routes/{route id}/service
```

其它同PATCH /services/{name or id}

### 根据name或id删除服务

**Endpoint**

```sh
DELETE /services/{name or id}
```

## Route Object

路由定义匹配客户端请求的规则，每个路由与服务相关联，并且一个服务可关联多个路由。匹配给定路由的每个请求将被代理到与其关联的服务。路由和服务的组合和分离提供了一种强大的路由机制，通过它可以在Kong定义细粒度的入口点，从而访问基础设施的不同上游服务。

### 新增一个路由

**Example**

```sh
  curl -i -X POST \
  --url  http://localhost:8001/routes/ \
  --data 'protocols[]=http&protocols[]=https' \
  --data 'hosts[]=hq.sinajs.cn' \
  --data 'service.id=9ec3c166-f29a-4b04-a33e-c17ac42a3429'
```

**Endpoint**

```sh
POST /routes/
```

**Request Body**

属性
约束
描述

protocols
required,default:["http", "https"]
此路由应允许的协议列表。 当设置为[ HTTPS ]时，HTTP请求将被请求升级到HTTPS。使用form-encoded，符号是protocols[]=http&protocols[]=https。 使用数组

methods
semi-optional
与此路由匹配的HTTP方法列表。例如["GET", "POST"]。必须设置hosts、paths或methods中的至少一个。使用form-encode，符号是methods[]=GET和methods[]=OPTIONS。使用数组。

hosts
semi-optional
与此路由匹配的域名列表。例如：example.com。使用form-encode，符号是hosts[]= Foo.com和hosts[]= BAR.com。使用数组

paths
semi-optional
与此路由匹配的路径列表。例如：/my-path。使用form-encode，符号是paths[]＝/foo&paths[]＝/bar。使用数组。

strip_path
optional,default:true
当通过路径之一匹配路由时，从上游请求URL中去除匹配的前缀。

preserve_host
optional,default:false
当通过主机域名中的一个匹配路由时，在上游请求报头中使用请求主机头。默认情况下设置为false，上游主机头将设置为服务的主机。

service
required
此路由关联的服务。这是路由代理流量的地方。使用form-encode，符号是service.id=。使用JSON则是"service":{"id":""}

**Response**

```sh
HTTP/1.1 201 Created
Date: Sun, 27 May 2018 07:29:32 GMT
Content-Type: application/json; charset=utf-8
Transfer-Encoding: chunked
Connection: keep-alive
Access-Control-Allow-Origin: *
Server: kong/0.13.1
{
    "created_at": 1527377372,
    "strip_path": true,
    "hosts": ["hq.sinajs.cn"],
    "preserve_host": false,
    "regex_priority": 0,
    "updated_at": 1527377372,
    "paths": null,
    "service": {
        "id": "9ec3c166-f29a-4b04-a33e-c17ac42a3429"
    },
    "methods": null,
    "protocols": ["http", "https"],
    "id": "9e9ff7b8-776f-4e65-ad2b-ed977e3fe4ea"
}
```

**这里添加了一个路由，也关联了服务，则可以通过kong 代理来访问原服务-获取股票信息**

```sh
#原接口
curl http://hq.sinajs.cn/list=sh601006
#通过kong代理访问
curl 127.0.0.1:8000/list=sh601006 --header 'host:hq.sinajs.cn'
```

返回的结果都是

```sh
var hq_str_sh601006="大秦铁路,8.440,8.440,8.380,8.460,8.350,8.390,8.400,29185760,245088749.000,1900,8.390,126300,8.380,72700,8.370,119700,8.360,332000,8.350,116278,8.400,104796,8.410,126800,8.420,128500,8.430,148100,8.440,2018-05-25,15:00:00,00";
```

### 根据route_id查询路由

**Example**

```sh
curl -i -X GET \
  --url  http://localhost:8001/routes/9e9ff7b8-776f-4e65-ad2b-ed977e3fe4ea
```

**Endpoint**

```sh
GET /routes/{id}
```

**Request Param**

属性
约束
描述

id
required
路由的唯一标识符

**Response**

返回同GET /service/{id}返回结构

### 查询所有路由列表

**Example**

```sh
curl -i -X GET   --url  http://localhost:8001/routes/
```

**EndPoint**

```sh
GET /routes
```

**Request QueryString**

属性
约束
描述

offset
optional
用于分页的游标。偏移量是定义列表中某个位置的对象标识符。

size
optional,default: 100, max:1000
每页返回数量的限制

**Response**

```sh
HTTP/1.1 200 OK
Date: Sun, 27 May 2018 07:57:50 GMT
Content-Type: application/json; charset=utf-8
Transfer-Encoding: chunked
Connection: keep-alive
Access-Control-Allow-Origin: *
Server: kong/0.13.1
{
    "next": null,
    "data": [{
        "created_at": 1527378066,
        "strip_path": true,
        "hosts": ["hq.sinajs.cn"],
        "preserve_host": false,
        "regex_priority": 0,
        "updated_at": 1527378066,
        "paths": null,
        "service": {
            "id": "9ec3c166-f29a-4b04-a33e-c17ac42a3429"
        },
        "methods": null,
        "protocols": ["http", "https"],
        "id": "9e9ff7b8-776f-4e65-ad2b-ed977e3fe4ea"
    }]
}
```

### 查询一个服务关联的所有路由

**Example**

```sh
curl -i -X GET \
  --url  http://localhost:8001/services/9ec3c166-f29a-4b04-a33e-c17ac42a3429/routes
```

**Endpoint**

```sh
GET /services/{service name or id}/routes
```

**Request QueryString Param**

属性
约束
描述

service name or id
required
路由关联的服务的唯一ID或name

**Response**

结构同GET /routes

### 根据route_id更新指定路由

**EndPoint**

```sh
PATCH /routes/{id}
```

**Request Param**

同GET /routes/{id}

**Request Body**

同POST /routes

### 根据route_id删除路由

**Endpoint**

```sh
DELETE /routes/{id}
```

其它同前面

## Consumer Object

消费对象表示服务的消费者或用户。可以依赖Kong作为主要数据存储，也可以将用户自己管理的列表映射到该数据库consumer表，以保持Kong与现有主数据存储的一致性。权限控制也会依赖这个表。

### 创建一个消费者

**Example**

```sh
  curl -i -X POST \
  --url  http://localhost:8001/consumers/ \
  --data 'username=zhou' \
  --data 'custom_id=000150' 
```

**Endpoint**

```sh
POST /consumers/
```

**Requst Body**

属性
约束
描述

username
semi-optional
消费者的唯一用户名，和custom_id至少有一个必须指定

custom_id
semi-optional
用户存储的唯一id, 用来和现有数据库中的用户一一映射，若需要权限管理，必须将此字段或用户名与请求一起发送。

**Response**

```sh
HTTP/1.1 201 Created
Date: Sun, 27 May 2018 08:31:20 GMT
Content-Type: application/json; charset=utf-8
Transfer-Encoding: chunked
Connection: keep-alive
Access-Control-Allow-Origin: *
Server: kong/0.13.1
{
    "custom_id": "000150",
    "created_at": 1527409880000,
    "username": "zhou",
    "id": "a1866101-c718-421d-ace3-911042661eca"
}
```

### 查询消费者列表

**Example**

```sh
 curl -i -X GET \
  --url  http://localhost:8001/consumers/zhou
  或
  curl -i -X GET \
  --url  http://localhost:8001/consumers/a1866101-c718-421d-ace3-911042661eca
```

**Endpoint**

```sh
GET /consumers/{username or id}
```

### 查询所有消费者

**Endpoint**

```sh
GET  /consumers/
```

**Request QueryString**

属性
约束
描述

id
optional

custom_id
optional

username
optional

size
optional,default:100
每页返回数量

offset
optional
用于分页的游标。偏移量是定义列表中某个位置的对象标识符

**Response**

```sh
HTTP/1.1 200 OK
Date: Sun, 27 May 2018 08:39:40 GMT
Content-Type: application/json; charset=utf-8
Transfer-Encoding: chunked
Connection: keep-alive
Access-Control-Allow-Origin: *
Server: kong/0.13.1
{
    "total": 1,
    "data": [{
        "custom_id": "000150",
        "created_at": 1527409880000,
        "username": "zhou",
        "id": "a1866101-c718-421d-ace3-911042661eca"
    }]
}
```

### 更新指定消费者

**Endpoint**

```sh
PATCH /consumers/{username or id}
```

**Request Param**

属性
约束
描述

username or id
required

**Request Body**

属性
约束
描述

username
semi-optional
同POST body说明

custome_id
semi-optional

### 更新或创建消费者

**Endpoint**

```sh
PUT /consumers/
```

**Request Body**

同上Request Body

其它说明 同 PUT /services/

**Response**

```sh
HTTP 201 Created or HTTP 200 OK
```

### 删除指定消费者

**Endpoint**

```sh
DELETE /consumers/{username or id}
```

## Plugin Object

插件表示将在HTTP请求/响应生命周期期间执行的插件配置。可以将功能添加到kong后面运行的服务，例如身份验证或速率限制。可以通过访问插件库找到更多关于安装的信息和每个插件所需的值。当向服务添加插件配置时，客户端对该服务所做的每一个请求都将运行添加的插件。如果插件需要针对特定的消费者调整到不同的值，可以通过指定consumer_id值来实现，如：

```json
{
    "id": "4d924084-1adb-40a5-c042-63b19db421d1",
    "service_id": "5fd1z584-1adb-40a5-c042-63b19db49x21",
    "consumer_id": "a3dX2dh2-1adb-40a5-c042-63b19dbx83hF4",
    "name": "rate-limiting",
    "config": {
        "minute": 20,
        "hour": 500
    },
    "enabled": true,
    "created_at": 1422386534
}
```

一个插件对于一个请求只运行一次，但是它将运行的配置取决于它所配置的插件实体。可以为各种实体，实体组合，甚至全局配置插件。例如，当希望以某种方式为大多数请求配置插件，但与已认证的请求行为略有不同时，这很有用。因此，当插件应用于具有不同配置的不同实体时，存在运行插件的优先顺序。经验法则是：一个插件对于配置的实体更具体更详细，其优先级越高。

当多次配置插件时，优先级的完整顺序是：

**1、** 在以下组合上配置插件：aRoute,aService,andaConsumer（消费者意味着请求必须被认证）；

**2、** 在Route和Consumer组合上配置的插件（消费者意味着请求必须被认证）；

**3、** 插件配置在Service和Consumer的组合上（消费者意味着请求必须被认证）；

**4、** 插件配置在Route和Service的组合上；

**5、** 在Consumer上配置的插件（消费者意味着请求必须被认证）；

**6、** 在Route上配置的插件；

**7、** 在Service上配置的插件；

**8、** 插件配置为全局运行；

示例：如果rate-limiting插件应用两次（具有不同的配置）：对于Service（插件配置A）和Consumer（插件配置B），则认证此消费者的请求将运行插件配置B并忽略A.但是，不验证此Consumer的请求将回退运行Plugin config A.请注意，如果禁用了配置B（其启用标志设置为false），则配置A将应用于会以其他方式匹配配置B的请求。

### 新增一个插件

可以通过五种不同的方式添加插件：

- 对于每个Service/Route and Consumer，不要设置consumer_id并同时设置service_id或route_id。
- 对于每个Service/Route和特定的Consumer，只设置consumer_id。
- 针对每个Consumer和特定Service，只设置service_id（警告：一些插件只允许设置他们的route_id）
- 针对每个 Consumer和特定Route，只设置route_id（警告：一些插件只允许设置他们的service_id）
- 针对特定的Service/Route/Consumer，同时设置service_id / route_id和consumer_id。

请注意，并非所有插件都允许指定consumer_id

**Example**

```sh
  curl -i -X POST \
  --url  http://localhost:8001/plugins/ \
  --data 'name=rate-limiting' \
  --data 'config.minute=20&config.hour=500' \
  --data 'consumer_id=a1866101-c718-421d-ace3-911042661eca'
```

**Endpoint**

```sh
POST /plugins/
```

**Request Body**

属性
约束
描述

name
required
将要添加的插件的名称。目前该插件必须分别安装在每个Kong实例中

consumer_id
optional
消费者的唯一标识符，用于在传入请求上覆盖此特定消费者的现有设置

config.{property}
required
插件的配置属性

enabled
requred,default:true
插件是否被启用

**Response**

```sh
HTTP/1.1 201 Created
Date: Sun, 27 May 2018 09:20:37 GMT
Content-Type: application/json; charset=utf-8
Transfer-Encoding: chunked
Connection: keep-alive
Access-Control-Allow-Origin: *
Server: kong/0.13.1
{
    "created_at": 1527412838000,
    "config": {
        "minute": 20,
        "policy": "cluster",
        "redis_timeout": 2000,
        "hide_client_headers": false,
        "hour": 500,
        "limit_by": "consumer",
        "redis_port": 6379,
        "redis_database": 0,
        "fault_tolerant": true
    },
    "id": "d688bd43-e43b-4e24-a0dc-c2d482bc1a01",
    "name": "rate-limiting",
    "enabled": true,
    "consumer_id": "a1866101-c718-421d-ace3-911042661eca"
}
```

### 查询指定插件

**Endpoint**

```sh
GET /plugins/{id}
```

**Request Param**

属性
约束
描述

id
required
插件的唯一标识符

### 查询所有插件列表

**Endpoint**

```sh
GET /plugins/
```

**Request Querystring**

属性
约束
描述

id
optional
同POST Body

name

service_id

route_id

consumer_id

size

offset

### 更新指定插件

**Endpoint**

```sh
PATCH /plugins/{plugin id}
```

**Request Param**

同GET /plugins/{id}

**Request Body**

同POST /plugins/ Request Body

### 更新或创建插件

**Endpoint**

```sh
PUT /plugins/
```

**Request Body**

同POST /plugins/ Request Body

其它说明同 PUT /services

### 删除指定插件

Endpoint

```sh
DELETE  /plugins/{plugin_id}
```

其它同DELETE /services/{service_id}

### 查询kong节点已安装的插件

Example

```sh
curl -i -X GET   --url  http://localhost:8001/plugins/enabled
```

Endpoint

```sh
GET /plugins/enabled
```

Response

```json
{
    "enabled_plugins": [
        "jwt",
        "acl",
        "cors",
        "oauth2",
        "tcp-log",
        "udp-log",
        "file-log",
        "http-log",
        "key-auth",
        "hmac-auth",
        "basic-auth",
        "ip-restriction",
        "request-transformer",
        "response-transformer",
        "request-size-limiting",
        "rate-limiting",
        "response-ratelimiting",
        "aws-lambda",
        "bot-detection",
        "correlation-id",
        "datadog",
        "galileo",
        "ldap-auth",
        "loggly",
        "runscope",
        "statsd",
        "syslog"
    ]
}
```

View Code

### 查询插件schema

检索插件定义的schema，这对了解插件接受哪些字段非常有用，并且可以用于构建Kong插件系统的第三方集成

**Example**

```sh
 curl -i -X GET \
   --url  http://localhost:8001/plugins/schema/key-auth
```

**Endpoint**

```sh
GET /plugins/schema/{plugin name}
```

Response

```json
{
    "no_consumer": true,
    "fields": {
        "key_in_body": {
            "default": false,
            "type": "boolean"
        },
        "key_names": {
            "type": "array",
            "default": "function",
            "func": "function",
            "required": true
        },
        "anonymous": {
            "default": "",
            "func": "function",
            "type": "string"
        },
        "hide_credentials": {
            "default": false,
            "type": "boolean"
        },
        "run_on_preflight": {
            "default": true,
            "type": "boolean"
        }
    }
}
```

## Certificate Object

证书表示SSL证书的公用证书/私钥对，这些对象由Kong用来处理加密请求的SSL / TLS。证书可以(可选的)与SNI对象相关联以将证书/密钥对与一个或多个主机名相关联查询插件配置的schema。这对了解插件接受哪些字段非常有用，并且可以用于构建Kong插件系统的第三方集成。

### 新增证书

**Endpoint**

```sh
POST /certificates/
```

**Request Body**

属性
约束
描述

cert
required

PEM编码的SSL密钥对的公共证书

key
required
SSL密钥对的PEM编码私钥

snis
optional
与此证书关联的一个或多个主机名作为SNI。这是一个糖参数，它将在引擎盖下创建一个SNI对象，并将其与此证书关联方便管理

**Response**

```json
{
    "id": "21b69eab-09d9-40f9-a55e-c4ee47fada68",
    "cert": "-----BEGIN CERTIFICATE-----...",
    "key": "-----BEGIN RSA PRIVATE KEY-----...",
    "snis": [
        "example.com"
    ],
    "created_at": 1485521710265
}
```

### 查询指定证书

**Endpoint**

```sh
GET /certificates/{sni_name or id}
```

**Request Param**

属性
约束
描述

sni or id
required
与此证书关联的唯一标识符或SNI名称

### 查询所有证书列表

**Endpoint**

```sh
GET /certificates/
```

### 更新指定证书

**Endpoint**

```sh
PATCH  /certificates/{sni or id}
```

**Request Param**

同GET /certificates/{sni or id}

**Request Body**

同POST /certificates/

### 更新或创建证书

**Endpoint**

```sh
PUT /certificates/
```

**Request Body**

同POST /certificates/

其它说明同 PUT /servies/

### 删除指定证书

**Endpoint**

```sh
DELETE  /certificates/{sni or id}
```

同其它DELETE 操作说明

## SNI Objects

SNI对象(Server Name Indication)表示主机名与证书的多对一映射。也就是说，证书对象可以有许多与之关联的主机名;当Kong收到SSL请求时，它使用Client Hello中的SNI字段根据与证书关联的SNI查找证书对象。

### 新增SNI

**Endpoit**

```sh
POST /snis/
```

**Request Body**

属性
约束
描述

name
required
与给定证书关联的SNI名称

ssl_certificate_id
required
与SNI主机名关联的证书的id（UUID）

**Response**

```json
{
    "name": "example.com",
    "ssl_certificate_id": "21b69eab-09d9-40f9-a55e-c4ee47fada68",
    "created_at": 1485521710265
}
```

### 查询指定SNI

**Endpoint**

```sh
GET  /snis/{name}
```

**Request Param**

属性
约束
描述

name
required
sni 名称

### 查询所有SNIs

**Endpoint**

```sh
GET  /snis/
```

### 更新指定SNI

**Endpoint**

```sh
PATCH /snis/{name}
```

### 更新或创建SNI

**Endpoint**

```sh
PUT /snis/
```

**Request Body**

同POST /snis/

### 删除指定SNI

**Endpoint**

```sh
DELETE /snis/{name}
```

## Upstream Objects

上游对象表示一个虚拟主机名，可用于负载平衡多个services（targets）上的传入请求。例如，对于主机名为service.v1.xyz的Service对象，上游名为service.v1.xyz。此服务的请求将代理上游定义的目标。

上游还包括一个健康检查器，该检查器能够根据其能力或无法为请求提供服务来启用和禁用target。运行状况检查程序的配置存储在upstream中，并适用于其所有target

### 新增一个上游

**Endpoint**

```sh
POST /upstreams/
```

Request Body

## Target Object

target是具有识别后端服务实例的端口的IP地址/主机名。每个upstream可以有很多target，并且可以动态添加target。即时更改即时生效。由于upstream保留了target更改的历史记录，因此target无法删除或修改。要禁用目标，使用weight=0发布新target,或者使用DELETE便捷方法来完成相同的操作。 当前的目标对象定义是最新的created_at

### 新增一个目标

**Endpoint**

```sh
POST /upstreams/{name or id}/targets
```

**Request Param**

属性
约束
描述

name or id
required
要添加目标的upstream的唯一标识符或名称

**Request Body**

属性
 约束
描述

target
required
目标地址（ip或主机名）和端口。如果省略，则端口默认为8000.如果主机名解析为SRV记录，端口值将被dns记录的值覆盖。

weight
optional,default:100
此目标在上游负载均衡器中的权重（0-1000，默认为100）。如果主机名解析为SRV记录，则权重值将被来自dns记录的值覆盖

**Response**

```json
{
    "id": "4661f55e-95c2-4011-8fd6-c5c56df1c9db",
    "target": "1.2.3.4:80",
    "weight": 15,
    "upstream_id": "ee3310c1-6789-40ac-9386-f79c0cb58432",
    "created_at": 1485523507446
}
```

### 列出当前在上游负载平衡轮上处于活动状态的所有目标

注意：此接口在0.12.0版本中已从更改属于上游的所有目标更改为仅当前激活的目标。返回整个目标历史记录的端点已移至[列出所有目标]（＃list-all-targets）

Endpoint

```sh
GET /upstreams/{name or id}/targets
```

**Request Param**

同上

**Request QueryString**

属性
约束
描述

id
optional

target

weight

size
每页显示数量

offset
用于分页的游标。偏移量是定义列表中某个位置的对象标识符

### 列出上游的所有目标

列出上游的所有目标，可以返回同一目标的多个目标对象，显示特定目标的更改历史记录。具有最新created_at的目标对象是当前定义

注意：此接口只适用于Kong v0.12.0+

**Endpoint**

```sh
GET /upstreams/{name or id}/targets/all/
```

### 删除指定目标

在负载平衡器中禁用目标。在引擎盖下，这个方法为给定的目标定义创建一个新的条目，权重为0

注意：该接口仅适用于Kong v0.10.1+

**Endpoint**

```sh
DELETE /upstreams/{upstream name or id}/targets/{target or id}
```

**Request Param**

属性
约束
描述

upstream name or id
required
上游唯一标识符

target or id
required
目标唯一标识符

### 设置目标为健康

将负载平衡器中目标的当前健康状况设置为整个Kong群集中的“健康”状态。

此接口可用于手动重新启用之前由上游运行状况检查程序禁用的目标，上游只向健康节点转发请求，所以这个调用告诉Kong再次开始使用这个目标。这会重置在Kong节点的所有workers中运行的健康检查器的健康计数器，并且广播全集群消息，以便将“健康”状态传播到整个Kong群集。

**Endpoint**

```sh
POST /upstreams/{upstream name or id}/targets/{target or id}/healthy
```

**Request Param**

同上

**Response**

```sh
HTTP 204 No Content
```

### 设置目标为不健康

将整个Kong群集中负载均衡器中目标的当前运行状况设置为“不健康”。

此接口可用于手动禁用目标并使其停止响应请求。上行仅向健康节点转发请求，因此该呼叫告诉Kong开始在环平衡器算法中跳过此目标。该调用重置在Kong节点的所有工作人员中运行的运行状况检查器的运行状况计数器，并广播全集群消息，以便将“不健康”状态传播到整个Kong群集。

Active health checks继续执行不健康的目标。请注意，如果启用了运行状况检查并且探针检测到目标实际上是健康的，它将自动重新启用它。要从环平衡器中永久移除目标，您应该删除目标。

Endpoint

```sh
POST /upstreams/{upstream name or id}/targets/{target or id}/unhealthy
```

其它同上

reference：

[https://m.aliyun.com/yunqi/articles/63180](https://m.aliyun.com/yunqi/articles/63180)

[https://getkong.org/docs/0.13.x/admin-api/](https://getkong.org/docs/0.13.x/admin-api/)

[https://www.jianshu.com/p/5400bf1aceda](https://www.jianshu.com/p/5400bf1aceda)

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://www.cnblogs.com/zhoujie/tag/kong/
