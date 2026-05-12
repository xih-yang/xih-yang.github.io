# 12、Nginx 精通 - 流量管控之分流、访问控制、限制连接速度、限制连接数量、限制带宽
- 来源：https://ddkk.com/zhuanlan/server/nginx/4/12.html
- 分类：服务器框架
- 分组：教程目录
NGINX 可智能地路由流量，并根据多个属性控制流量，包括：分流；利用客户端的地理位置进行访问控制；通过速率、连接数和带宽限制流量。

**目录**

分流

指令

应用

适用场景

国家/城市位置访问控制

安装环境

加载数据

访问控制

限制连接数

指令

limit_conn_zone

limit_conn

limit_conn_status

limit_conn_dry_run

limit_conn_log_level

案例

调参技巧

限制请求速率

指令

limit_req_zone

limit_req

limit_req_status

limit_req_dry_run

limit_req_log_level

案例

调参技巧

限制带宽

指令

limit_rate

limit_rate_after

案例

配置技巧

## 分流

Nginx可对按比例分割客户端请求到不同的服务器上，即分流。

### 指令

split_clients指令可对来自客户端的请求进行分流。

格式：split_clients string $variable { ... }

为A/B测试创建一个变量，例如：

```java
split_clients "${remote_addr}AAA" $variant {
               0.5%               .one;
               2.0%               .two;
               *                  "";
}
```

对string(例中"${remote_addr}AAA"，参数中添加“AAA”是为了证明这是一个可以包含多个变量的串联字符串。）值使用MurmurHash2进行哈希处理。在给定的示例中，从0到21474835（0.5%）的哈希值对应于$variant变量的值“.one”，从21474836到107374180（2%）的哈希数值对应于值“.tow”，从107374811到4294967295的哈希数值相应于值“”（空字符串）。后面代理或web服务可使用这个变量。

### 应用

为了更好理解实用，完整例子如下：

**1、** web服务；

```java
http {
    split_clients "${remote_addr}" $web_root_dir {
        33.3%    "/var/www/www_a/";
        *        "/var/www/www_b/";
     }
     server {
 l       listen 80 ;
         root $web_root_dir ;
         location / {
             index index.html;
         }
     }
}
```

根据不同的客户端地址，1/3引流到www_a， 2/3引流到www_b。

**2、** 代理服务；

```java
#两个集群
upstream lb_srv1 {
    server 10.10.12.45;
    server 10.10.12.46;
}
upstream lb_srv2 {
    server 211.113.168.10:8080;
    server 211.113.168.11:8080;
}
#按2/8分流
split_clients "${remote_addr}" $lb_srv{
    20%   "lb_srv2";
    *     "lb_srv1";
}
server {
    listen 80;
    server_name .example.com;
    location / {
        proxy_pass http://$lb_srv;
    }
}
```

### 适用场景

分流适用如下场景：

**1、** A/B测试；

**2、** 灰度发布：根据部署，用户可以逐步增加路由到新版本的用户百分比，进而将流量慢慢切换到新版本在推出新版本的代码时，在不同的应用版本之间分割客户端流量非常实用，这可以降低发生错误后带来的；

**3、** 蓝绿部署：在将用户切换到新版本的同时，可以保持旧版本在验证部署期间的可用性；

本功能由ngx_http_split_clients_module模块提供。

## 国家/城市位置访问控制

根据请求路由中客户端的物理位置。

该功能需要安装nginx-module-geoip模块。

### 安装环境

**1、** 安装nginx-module-geoip模块，RHEL/CentOSNGINX开源版为例的安装命令：；

```java
# yum install nginx-module-geoip
```

**2、** 下载GeoIP国家/地区和城市数据库并解压；

```java
# mkdir /etc/nginx/geoip
# cd /etc/nginx/geoip
# wget http://geolite.maxmind.com/download/geoip/database/GeoLiteCountry/GeoIP.dat.gz
# gunzip GeoIP.dat.gz
# wget "http://geolite.maxmind.com/download/geoip/database/GeoLiteCity.dat.gz"
# gunzip GeoLiteCity.dat.gz
```

国外网站无法下载，可在内网找相关数据。

**3、** 加载模块；

在配置文件中增加：

```java
    load_module modules/ngx_http_geoip_module.so;
    load_module modules/ngx_stream_geoip_module.so;
```

用nginx -s reload重加载即可。

### 加载数据

```java
http {
   加载指定用于根据客户端IP地址确定国家的数据库
    geoip_country         GeoIP.dat;
   加载指定用于根据客户端IP地址确定国家、地区和城市的数据库
    geoip_city            GeoLiteCity.dat;
   如果禁用递归搜索，则将使用“X-Forwarded-For”中发送的最后一个地址。如果启用了递归搜索，则将使用“X-Forwarded-For”中发送的最后一个不受信任的地址，而不是与某个受信任地址匹配的原始客户端地址。默认off
    geoip_proxy_recursive on;
}
```

**1、** geoip_country和geoip_city，前者仅针对国家，后者详细到城市因此如果只用到国家级，只geoip_country加载即可两者可使用变量也是不同的；

**2、** geoip_country包括变量:；

- `$`geoip_country_code：两字母组成的国家/地区代码，如：“RU”, “US”
- `$`geoip_country_code3：三字母组成的国家/地区代码，如：“RUS”, “USA”
- `$`geoip_country_name：国家/地区的全名，如：“Russian Federation”, “United States”

**3、** geoip_city包括变量:；

- `$`geoip_city_country_code：两字母组成的国家/地区代码，如：“RU”, “US”
- `$`geoip_city_country_code3：三字母组成的国家/地区代码，如：“RUS”, “USA”
- `$`geoip_city_country_name：国家/地区的全名，如：“Russian Federation”, “United States”
- `$`geoip_city_continent_code：两个字母的大陆代码, 如：“EU”, “NA”.
- `$`geoip_latitude：纬度
- `$`geoip_longitude：精度
- `$`geoip_region：两个符号的国家/地区代码（地区、领土、州、省、联邦土地等），例如“48”、“DC”。
- `$`geoip_region_name：国家地区名称（地区、领土、州、省、联邦土地等），例如“莫斯科市”、“哥伦比亚特区”。
- `$`geoip_city：城市名称，例如“莫斯科”、“华盛顿”。
- `$`geoip_postal_code：邮政编码
- `$`geoip_dma_code：美国的DMA地区代码（也称为“地铁代码”）
- `$`geoap_area_code：电话区号（仅限美国）

### 访问控制

**1、** 限制访问的代码及说明如下：；

```java
http {
    geoip_country         GeoIP.dat;
    根据$geoip_country_code值按{}指定关系设置$country_access，例子是：如果是美国，$country_access为0，否则为1
    map $geoip_country_code $country_access { 
        "US" 0;
        default 1;
    }
    server {
        如果来自美国的访问，屏蔽掉，返回403
        if($country_access = '0') { 
            return 403;
        }
        正常访问处理 
        ...
    }
    ...
}
```

**2、** 最近(距离)访问的代码及说明如下：；

```java
# TCP/UDP
stream {
    geoip_country         GeoIP.dat;
    geoip_city            GeoLiteCity.dat;
    根据请求的大陆代码，访问不同的域名（域名可映射到最近的服务器）
    map $geoip_city_continent_code $nearest_server {
        default        example.com;
        EU          eu.example.com;
        NA          na.example.com;
        AS          as.example.com;
    }
   ...
}
```

## 限制连接数

Nginx可基于key(如IP地址）限制连接数。当然并非所有连接都会被计算在内，只有当服务器正在处理一个请求并且已经读取了整个请求标头时，才会对连接进行计数。

该功能由ngx_http_limit_conn_module模块提供。

### 指令

#### limit_conn_zone

格式：limit_conn_zone key zone=name:size;

设置保存key的共享内存区，key为限制对象名，可以是包含文本、变量及其组合，如请求ip地址，server_name等，如果用变量但值为空的请求不会被计入。示例如下：

```java
limit_conn_zone $binary_remote_addr zone=addr:10m;
```

上例中用客户端IP地址用作key，共享区名为addr，共10M。请注意，此处key使用的不是$remote_addr，而是$binary_remote_addr变量。$remote_addr变量的大小可以在7到15个字节之间变化。存储状态在32位平台上占用32或64字节的内存，在64位平台上总是占用64字节。$binary_remote_addr变量的大小对于IPv4地址始终为4字节，对于IPv6地址始终为16字节。存储状态在32位平台上总是占用32或64字节，在64位平台上则总是占用64字节。一个兆字节区域可以保持大约32000个32字节状态或大约16000个64字节状态。如果共享区存储用尽，服务器将向所有后续请求返回错误。

#### limit_conn

格式：limit_conn zone number;

设置共享内存区域和给定键值允许的最大连接数。当超过此限制时，服务器将在回复请求时返回错误。示例如下：

```java
limit_conn_zone $binary_remote_addr zone=addr:10m;
server {
    location /download/ {
        limit_conn addr 1;
    }
}
```

上例表示：对于/download/的请求连接，每个ip同时最多发起1个。

#### limit_conn_status

格式：limit_conn_status code; 默认：limit_conn_status 503

设置被拒绝请求返回的状态代码。

#### limit_conn_dry_run

格式：limit_conn_dry_run on|off；默认：limit_conn_dry_run off

启用dry_run模式。在这种模式下，不对连接数量限制，但在共享内存区中，过多的连接数量还是照常计算。

#### limit_conn_log_level

格式：limit_conn_log_level info | notice | warn | error; 默认：limit_conn_log_level error;

为服务器限制连接数的情况设置所需的日志记录级别。

### 案例

通常针对客户端ip限制连接数，实际也可以针对服务器限制。示例如下：

```java
# 按客户端ip定义共享区
limit_conn_zone $binary_remote_addr zone=perip:10m;
# 按服务器名定义共享区
limit_conn_zone $server_name zone=perserver:10m;
# 429请求过多错误
limit_conn_status 429;
server {
    限制每隔ip最多10个连接
    limit_conn perip 10;
    限制每个服务器最多500个连接
    limit_conn perserver 500;
    ...
}
```

### 调参技巧

测试限制可能是个很棘手的问题，测试方案通常很难在替代环境中模拟实时流量。在这种情况下，可用指令limit_conn_dry_run on，然后在访问日志中使用变量 $limit_conn_status。$limit_conn_status 变量将请求标记为 PASSED、DELAYED、REJECTED、DELAYED_DRY_RUN 或REJECTED_DRY_RUN。这样就能够分析实时流量日志，并在真正实施限制前根据需要调整限制，从而确保限制配置正确。

## 限制请求速率

Nginx可基于key(如IP地址）限制限制请求处理速率，特别是来自单个IP地址的请求的处理速率。使用“漏桶”方法进行限制

限速模块非常强大，可以防止滥用快速请求，同时仍然为每个人提供优质服务。限制请求速率的原因有很多，安全性就是其中之一。可以通过严格限制登录页面的速率来防御暴力破解攻击。可以对所有请求设置合理的限制，从而防止恶意用户试图对应用拒绝服务或浪费资源的不轨行为。

该模块功能由ngx_http_limit_req_module模块提供。

### 指令

#### limit_req_zone

格式：limit_req_zone key zone=name:size rate=rate [sync];

设置保存key的共享内存区，key为限制对象名，可以是包含文本、变量及其组合，如请求ip地址，server_name等，如果用变量但值为空的请求不会被计入。示例：

```java
limit_req_zone $binary_remote_addr zone=reqzone:10m rate=1r/s;
```

定义基于ip(key=$binary_remote_addr)的10m共享缓存区reqzone，该区域限制请求平均处理率不能超过每秒1个请求。

sync：可实现共享内存区域数据同步，仅用于商业版。

#### limit_req

格式：limit_req zone=name [burst=number] [nodelay | delay=number];

设置共享内存区域和请求的最大突发大小。如果请求速率超过为区域配置的速率，则会延迟对请求的处理，以便以定义的速率处理请求。过多的请求会被延迟，直到它们的数量超过最大突发大小，在这种情况下，请求会因错误而终止。默认情况下，最大突发大小等于零。

zone：请求key存储的共享区域名，在limit_req_zone中定义。

burst：允许客户端发起访问的最大速率。在某些情况下，客户端需要同时发出许多请求，超出了配置的速率，就可以先在一段时间内降低速率，然后再发出更多请求。

nodelay：符合burst配置的数量请求都不延迟处理

delay：超过配置数量的请求被延迟处理的数量。如果为0，表示所有超过配置数量的请求都被延迟处理。

#### limit_req_status

格式：limit_req_status code; 默认：limit_req_status 503

设置被拒绝请求返回的状态代码。

#### limit_req_dry_run

格式：limit_req_dry_run on|off；默认：limit_req_dry_run off

启用dry_run模式。在这种模式下，不对连接速率限制，但在共享内存区中，过多的连接速率还是照常计算。

#### limit_req_log_level

格式：limit_req_log_level info | notice | warn | error; 默认：limit_req_log_level error;

为服务器限制连接速率的情况设置所需的日志记录级别。

### 案例

**1、** 按客户端IP限速示例：；

```java
http {
    limit_req_zone $binary_remote_addr zone=limitbyaddr:10m rate=3r/s;
    limit_req_status 429;
    ...
    server {
        限制速率3r/s。最大可支持一次发送12个请求。
        处理过程：第1秒处理3个请求，延迟9个；第2秒再处理3个请求，剩余6个延迟；以此类推，直到全部处理完（需4秒）。在1-4秒期间，新的请求被拒绝
        limit_req zone=limitbyaddr burst=12 delay=9;
        ...
    }
}
```

**2、** 服务器限速示例：；

```java
limit_req_zone $binary_remote_addr zone=perip:10m rate=1r/s;
limit_req_zone $server_name zone=perserver:10m rate=100r/s;
server {
    客户端限速1r/s，但最大可同时发出5个请求立即处理；处理完毕之前，有新的请求则拒绝
    limit_req zone=perip burst=5 nodelay;
    服务器速率限制为200r/s
    limit_req zone=perserver burst=200;
    ...
}
```

### 调参技巧

测试限制可能是个很棘手的问题，测试方案通常很难在替代环境中模拟实时流量。在这种情况下，可用指令limit_req_dry_run on，然后在访问日志中使用变量 $limit_req_status。$limit_req_status 变量将请求标记为 PASSED、DELAYED、REJECTED、DELAYED_DRY_RUN 或REJECTED_DRY_RUN。这样就能够分析实时流量日志，并在真正实施限制前根据需要调整限制，从而确保限制配置正确。

## 限制带宽

Nginx可针对连接响应带宽限制。

这个是http模块核心服务之一。

### 指令

#### limit_rate

格式：limit_rate rate; 默认：limit_rate 0; （0-代表不限速）

限制向客户端传输响应的速率。速率是以Byte/s为单位指定的。零值禁用速率限制。限制是根据请求设置的，因此，如果客户端同时打开两个连接，则总速率将是指定限制的两倍。

#### limit_rate_after

格式：limit_rate_after *size*; 默认：limit_rate_after 0; （0-代表不限速）

设置限制带宽的初始量，即该初始量之后才对客户端的响应的进一步传输受到速率限制，未达到初始量，不限带宽。

### 案例

限制下载速度案例：

```java
location /download/ { 
    limit_rate_after 10m; 
    limit_rate 1m;
}
```

对于前缀为 *download* 的 URI ，开始10M不限速，10M之后限速为1mByte/s。

### 配置技巧

limit_rate_after、limit_rate 指令几乎可以在任何上下文中进行设置，包括 http、server、location 以及location 代码块内的 if。因此可根据需要灵活配置限速要求，如：

**1、** 针对所有连接限宽，在http上下文中配置即可；

**2、** 针对server限制，在server{}中配置；

**3、** 针对某个连接限速（如案例），通过location匹配限宽配置；

**4、** 达到某个条件才限速，用if判断来配置；

这篇文章如果对您有所帮助或者启发的话，帮忙关注或点赞，有问题请评论，必有所复。您的支持是我写作的最大动力！
