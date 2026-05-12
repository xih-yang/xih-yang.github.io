# 19、Nginx 精通 - 更多实用功能：身份认证、流媒体支持、大文件传输、流量镜像、分片、获取客户端真实ip等
- 来源：https://ddkk.com/zhuanlan/server/nginx/4/19.html
- 分类：服务器框架
- 分组：教程目录
Nginx具有很多强大功能，专栏前面讲述的主要是常用功能。本文主要讲述常用之外的其它实用功能，如身份认证、流媒体支持、大文件传输等。为充分利用Nginx，对这些技术都又必要了解。

**目录**

身份认证

基本身份验证

创建身份验证文件

配置身份验证

测试

身份验证子请求

流媒体支持

实时流媒体

渐进式下载和伪流技

MP4配置

flv配置

图片处理

大文件支持

响应正文前后增加内容

从memcached获取响应

流量镜像

配置示例

阻塞处理

扩展处理

应用场景

获取客户端真实IP

单级部署

多级部署

proxy1配置

proxy2配置

负载均衡器配置

分片

响应内容替换

## 身份认证

Nginx能够对客户端进行身份验证。使用 NGINX 对客户端请求进行身份验证可以减轻服务器的工作负载，并能够阻止未经身份验证的请求到达应用服务器。NGINX 开源版模块包括基本身份验证和身份验证子请求。

### 基本身份验证

基本身份验证来保护整个 NGINX 主机的上下文、特定的虚拟服务器甚至只是特定的 location 代码块。基本身份验证不会取代 Web 应用的用户身份验证，但可以保护私人信息的安全。

该功能由ngx_http_auth_basic_module模块提供。

#### 创建身份验证文件

首先创建身份验证文件，格式如下：

```java
# 格式：身份名:密码[:注释]  注释可选。每一行代表一个身份
# name:password:comment 
idcode1:JJGeHm5C4c85I:这是测试，密码abc#111
# 测试密码abc#112
idcode2:cppBHPWd4gtmQ
```

其中密码是用如下命令命令加密的：

```java
openssl passwd abc#111
```

Nginx支持几种密码生成方式，如用Apache的htpasswd 命令生成密码，也支持 openssl 和 htpasswd 使用 apr1 算法生成密码，还可以是轻型目录访问协议（ LDAP）和 Dovecot 使用的 Salted SHA-1 格式。

#### 配置身份验证

密码文件在conf.d/user.pwd，配置如下：

```java
location / {
    auth_basic 指令表示Nginx启动基本身份验证，带一个字符串参数(可任意）
    auth_basic "Private web by auth"; 
    auth_basic_user_file 指令指定文件位置，可相对于Nginx工作目录，也可用绝对路径，保证Nginx可读即可
    auth_basic_user_file conf.d/user.pwd;
}
```

auth_basic值显示在响应头(没有正确授权)，如下图：

#### 测试

用curl测试如下（密码不对会显示401错误）：

用浏览器测试，会弹出如下要求登陆的界面：

### 身份验证子请求

身份验证子请求的意思是Nginx验证身份由第三方提供的子请求进行，Nginx再根据子请求的结果实现对客户端授权。如果子请求返回2xx响应代码，则允许访问。如果返回401或403，则使用相应的错误代码拒绝访问。子请求返回的任何其他响应代码都被视为错误。

该功能由ngx_http_auth_request_module模块提供。如果编译版，应该使用--with-http_auth_request_module编译。

配置如下：

```java
# 需身份验证的访问
location /private/ {
    auth_request指令带一个URI参数，必须是本地内部位置
    auth_request /auth;
    在授权请求完成后，将请求变量设置为给定值。该值可能包含来自授权请求的变量
    auth_request_set $auth_status $upstream_status;
}
# 授权子请求
location = /auth {
    由第三方提供授权连接
    proxy_pass http://auth-server;
    默认是将原始请求（包括正文和请求头）传递到身份验证服务器。为提升效率，可通过proxy_pass_request_body off取消正文传递，同时把头字段Content-Length设置为空
    proxy_pass_request_body off;
    proxy_set_header Content-Length "";
    proxy_set_header X-Original-URI $request_uri;
}
```

授权子请求通过后，继续请求的正常处理。

## 流媒体支持

### 实时流媒体

NGINX为MP4和MOV媒体文件提供http实时流媒体（hls）服务器端支持。此类文件通常具有.mp4、.m4v、.m4a、.mov或.qt文件扩展名。该模块支持H.264视频编解码器、AAC和MP3音频编解码器。

该功能由ngx_http_hls_module模块提供。

配置示例：

```java
location /hls/ {
    开启实时流媒体
    hls;
    定义不使用“len”参数请求的播放URI的默认片段长度。
    hls_fragment            5s;
    设置用于读取和写入数据帧的缓冲区的数量和大小。
    hls_buffers             10 10m;
    设置用于处理MP4和MOV文件的缓冲区的初始大小
    hls_mp4_buffer_size     1m;
    设置用于处理MP4和MOV文件的缓冲区最大值
    hls_mp4_max_buffer_size 5m;
    root /var/video/;
}
```

访问URI可接受以下参数：

- start：以秒为单位定义播放开始位置。
- end：以秒为单位定义播放结束位置。
- offset：将初始播放位置移动到以秒为单位的时间偏移。正值设置播放开头的时间偏移。负值设置播放中最后一个片段末尾的时间偏移。
- len：定义了以秒为单位的片段长度。

访问示例：

```java
http://hls.example.com/test.mp4.m3u8?offset=1.000&start=1.000&end=2.200
```

### 渐进式下载和伪流技

NGINX为的流视频或音频文件提供渐进式下载和伪流技术支持。

**渐进式下载**是介于下载本地播放与实时流媒体之间的一种播放方式，下载本地播放必须将文件全部下载完成后才能下载，而渐进式下载不必等到全部下载完成后再播放，它可以一边下载一边播放，完成播放内容之后，整个文件会保存在计算机上。从播放的效果和用户体验上看，渐进式下载和实时流媒体是一样的，不同的是渐进式下载本地保留文件的副本。

**伪流技术**是一种媒体文件处理协议。客户端播放器可在URL上携带start时间的参数发送HTTP请求到服务端，服务端的脚本处理视频流并且给予回复，保证提供的视频流起始位置与START 时间参数所对应。

#### MP4配置

Nginx为mp4提供渐进式下载和伪流服务器端支持。mp4文件通常具有.mp4、.m4v或.m4a文件扩展名。

该功能由ngx_http_mp4_module模块提供。

配置示例：

```java
# /video/下的都是mp4文件
location /video/ {
    开启mp4伪流技术
    mp4;
    设置用于处理MP4文件的缓冲区的初始大小
    mp4_buffer_size       1m;
    处理MP4文件的缓冲区的最大大小
    mp4_max_buffer_size   5m;
    限制向客户端传输响应的速率。该速率基于所服务的MP4文件的平均比特率而受到限制。要计算速率，请将比特率乘以指定的因子。特殊值“on”对应于系数1.1。特殊值“off”禁用速率限制。限制是根据请求设置的，因此，如果客户端同时打开两个连接，则总速率将是指定限制的两倍。
    mp4_limit_rate        on;
    设置媒体数据的初始量（以播放时间为单位测量），在此之后，对客户端的响应的进一步传输将受到速率限制
    mp4_limit_rate_after  30s;
}
```

注意：mp4_limit_rate和mp4_limit_rate_after两个指令商业版才支持。

测试命令：

```java
# 参数：start-播放开始  end-播放截至时间 
http://www.example.com/test.mp4?start=5
http://www.example.com/test.mp4?start=5&end=10
```

#### flv配置

flv（FLASH VIDEO）文件配置更简单，如下：

```java
# 所有.flv结尾的文件
location ~ \.flv$ {
    只有这个指令，开启流支持
    flv;
}
```

测试同MP4一样。

该功能由ngx_http_flv_module模块提供。

## 图片处理

Nginx可对JPEG、GIF、PNG和WebP格式图像在返回前进行一定处理。

该功能由ngx_http_image_filter_module模块提供。

配置示例：

```java
location /img/ {
    proxy_pass   http://backend;
    图像处理缓存大小，默认1M
    image_filter_buffer 5m;
    重设尺寸
    image_filter resize 150 100;
    旋转90度
    image_filter rotate 90;
}
```

关键指令：

image_filter off; 关闭图像处理

image_filter test; 确保响应是JPEG、GIF、PNG或WebP格式的图像。否则，将返回415（不支持的媒体类型）错误。

image_filter size; 以JSON格式输出关于图像的信息，例如：{ "img" : { "width": 100, "height": 100, "type": "gif" } }

image_filter rotate 90 | 180 | 270; 将图像逆时针旋转指定的度数。

image_filter resize width height; 按比例将图像缩小到指定的大小。若要只缩减一个维度，可以将另一个维度指定为“-”。与旋转参数一起使用时，旋转发生在还原之后。

image_filter crop width height; 从较大的一侧按比例将图像缩小，并从另一侧裁剪多余的边缘。要仅缩小一个维度，可以将另一个维度指定为“-”。当与rotate参数一起使用时，旋转会在缩小之前发生。

## 大文件支持

当业务应用需要传输大文件时，Nginx需要调整如下参数支持：

```java
# 设置客户端请求正文允许的最大大小，默认1m。如果请求中的大小超过配置的值，则向客户端返回413（请求实体太大）错误
client_max_body_size 30m;
### 下面这些关联参数通常不用定义
# 定义读取客户端请求正文的超时(默认60s)。超时仅针对两个连续读取操作之间的一段时间设置，而不针对整个请求体的传输设置。如果客户端在此时间内没有发送任何内容，则该请求以408（请求超时）错误终止。
client_body_timeout 60s;
# 定义读取客户端请求标头的超时(默认60s)。如果客户端在此时间内没有发送整个报头，则该请求以408（请求超时）错误终止。
client_header_timeout 60s;
# 确定nginx是否应将整个客户端请求体保存在单个缓冲区中。如果配置指令有使用$request_body变量时使用该指令，以节省所涉及的复制操作的数量。
client_body_in_single_buffer on;
# 设置将请求传输到代理服务器的超时(默认60s)。超时仅在两个连续写入操作之间设置，不用于传输整个请求。如果代理服务器在此时间内没有接收到任何内容，则连接将关闭。
proxy_read_timeout 60s;
# 定义从代理服务器读取响应的超时(默认60s)。超时仅在两个连续读取操作之间设置，不用于传输整个响应。如果代理服务器在此时间内没有传输任何内容，则连接将关闭。
proxy_send_timeout 60s;
```

## 响应正文前后增加内容

在响应正文前后添加文本。

```java
location / {
    在响应正文前添加 file-包含添加内容的文件
    add_before_body /file;
    在响应正文后添加 file-包含添加内容的文件
    add_after_body  /file;
    添加内容类型 默认为"text/html"，"*"表示任何MIME type
    addition_types mime-type
}
```

由ngx_http_adition_module模块实现。

## 从memcached获取响应

应用服务器可把响应写入到memcached，Nginx可直接从memcached获取响应返回给客户端。

该功能由ngx_http_memcached_module模块提供。

配置示例如下：

```java
server {
    location / {
        uri+参数作为memcached的key
        set            $memcached_key "$uri?$args";
        memcached_pass服务器，可以是服务器组、域名、ip+端口或unix套接字
        memcached_pass host:11211;
        找不到缓存，定向真正应用服务器
        error_page     404 502 504 = @fallback;
    }
    找不到缓存，定向真正应用服务器
    location @fallback {
        proxy_pass     http://backend;
    }
}
```

注意：写入到 memcached工作是应用服务器完成的。即应用服务器处理访问时，在返回之前需写入到memcached，以便Nginx下次直接获取。

## 流量镜像

流量镜像 (Traffic Mirroring)，也称为流量影子 (Traffic Shadowing)，是一种强大的、无风险的测试应用版本的方法，它将实时流量的副本发送给被镜像的服务。采用这种方法，可以搭建一个与原环境类似的环境以进行验收测试，从而提前发现问题。由于镜像流量存在于主服务关键请求路径之外，终端用户在测试全过程不会受到影响。

Nginx通过创建后台镜像子请求来实现原始请求的镜像，并忽略对镜像子请求的响应。处理过程：当请求到达 Nginx 时，如果 Nginx 开启了流量镜像功能，就会将请求复制一份，并根据 mirror location 中的配置来处理这份复制的请求。

该功能由ngx_http_memcached_module模块提供。

### 配置示例

```java
location / {
    把访问请求镜像一份到/mirror。可以镜像到多份，多个配置即可
    mirror /mirror;
    不镜像正文(默认为on)
    mirror_request_body off;
    把访问请求的代理到应用服务器处理
    proxy_pass http://backend;
}
# 镜像服务处理
location = /mirror {
    指定此location只能被“内部的”请求调用，外部调用请求会返回”Not found” (404)
    internal;
    把镜像的请求代理到镜像的应用服务器
    proxy_pass http://mirror_backend$request_uri;
    mirror_request_body 为off，必须设置下面三项 
    proxy_pass_request_body off;
    proxy_set_header Content-Length "";
    proxy_set_header X-Original-URI $request_uri;
}
```

### 阻塞处理

Nginx在镜像时，直到镜像处理返回才进行下一步源站处理，因此可能会阻塞请求处理过程。建议采用”超时“处理方式如下：

```java
    location = /mirror {
        internal;
        proxy_pass http://mirror_backend$request_uri;
        采用超时就返回
        proxy_connect_timeout 50ms;
        proxy_read_timeout 50ms;
    }
```

### 扩展处理

更多用法见示例：

```java
server { 
    ...
    只镜像部分流量
    split_clients $remote_addr $mirror_backend {
        50% mirror_backend; 
        *   "";
    }
    ...
    镜像站点配置   
    location /mirror{    
        只处理GET请求   
        if($request_method != GET) {  
            return 403;
        } 
        internal; 内部配置    
        非选中镜像流量直接返回
        if ($mirror_backend = "") {
             return 400;
        } 
        镜像访问日志 
        access_log /usr/local/nginx/logs/mirror-access.log main;  
        proxy_pass http://$mirror_backend$request_uri;
    }
}
```

split_clients用法详见：[精通Nginx（12）-流量管控](/zhuanlan/server/nginx/4/12.html)

### 应用场景

流量镜像可用于以下几个场景：

- 通过预生产环境测试来观察新系统对生产环境流量的处理能力
- 复制请求日志以进行安全分析
- 复制请求用于数据科学研究

将生产环境的流量拷贝到预上线环境或测试环境的好处：

- 可以验证功能是否正常，以及服务的性能；
- 用真实有效的流量请求去验证，又不用造数据，不影响线上正常访问；
- 这跟灰度发布还不太一样，镜像流量不会影响真实流量；
- 可以用来排查线上问题；
- 假如服务做了重构，这也是一种重构测试方式；

## 获取客户端真实IP

互联网业务运营时，常会基于客户端IP维度进行，Nginx可以设置如何获取客户端真实IP。哟获取真实ip，需先对http协议中关于IP的头字段由了解。http协议中用来表示客户端地址的请求头字段有如下三个：

- remote_addr：客户端连接的地址，不存在代理就表示客户端的地址，存在代理就表示最后一个代理服务器的地址。 remote_addr无法伪造，因为建立 TCP 连接需要三次握手，如果伪造了源 IP，无法建立 TCP 连接，更不会有后面的 HTTP 请求。缺点是只能是上一级的IP。
- X-Forwarded-For(简称XFF)：记录访问路径。每经过一个代理，就会追加代理ip。格式：client, proxy1, proxy2...。X-Forwarded-For可以被伪造。客户端伪造示例如下：

```java
curl http://127.0.0.1 -H "X-Forwarded-For: 10.10.1.13"
```

- X-Real-IP：通常被 HTTP 代理用来表示与它产生 TCP 连接的设备 IP，这个设备可能是其他代理，也可能是真正的请求端。需要注意的是，X-Real-Ip 目前并不属于任何标准。X-Real-IP可以像XFF一样伪造。目前基本不使用这个头字段了。

**如上所述，不同部署方案获取真实IP是不同的。**

### 单级部署

部署示意图如下：

由于系统部署不涉及多级部署，通过`remote_addr即可获取真实ip。Nginx作为负载均衡器，日志格式如下即可获取：`

```java
    $remote_addr 即真实ip
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      'ua:"$http_user_agent" xff:"$http_x_forwarded_for"';
```

### 多级部署

`部署逻辑图如下：`

其中proxy1、proxy2、负载均衡服务器均用Nginx实现，获取真实ip在负载均衡服务器上进行。

#### proxy1配置

```java
    location / {
        代理到proxy2
        proxy_pass  http://211.149.21.99;
        proxy_set_header    Host    $http_host;
        必须配置X-Forwarded-For
        如果客户端请求头存在“X-Forwarded-For”，在后面附加$remote_addr变量，用逗号分隔。否则，则$proxy_add_X_Forwarded_For变量等于$remote_addr变量。
        proxy_set_header    X-Forwarded-For $proxy_add_x_forwarded_for;
    }
```

$remote_addr不能设置，系统在建立连接时自动获取。因此第一级X-Forwarded-For配置最重要，这里才能真正记录下真实ip，并向后传递 。

#### proxy2配置

```java
location / {
            代理到负载均衡器
            proxy_pass  http://211.149.21.100;
            proxy_set_header    Host    $http_host;
            配置X-Forwarded-For，非必须，为了形成完整访问链才配置
            proxy_set_header    X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

#### 负载均衡器配置

配置实例如下：

```java
http{ 
   ...
   $remote_addr为真实ip
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      'ua:"$http_user_agent" xff:"$http_x_forwarded_for"';
    server{
        ...
        $remote_addr获取真实ip规则
        设置可信ip，如果XFF含如下地址，均认为是代理ip
        set_real_ip_from  211.149.21.98;
        set_real_ip_from  211.149.21.99;
        从哪个头字段获取真实ip。该指令默认值是 X-Real-IP，不过现在主流的都是通过 X-Forwarded-For 字段来获取客户端真实 IP。也可以自定义一个新的字段
        real_ip_header    X-Forwarded-For;
        off(默认)-会将 real_ip_header 指定的HTTP头中的最后一个IP作为真实IP
        on - 会将 real_ip_header 指定的HTTP头中的最后一个不是信任IP当成真实IP
        real_ip_recursive on;
        location /{
            负载均衡到应用服务器
            proxy_pass  http://upstream_app;
            传给应用服务器请求头（按需配置）
            proxy_set_header    Host    $http_host;
            proxy_set_header    X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
}
```

该功能由ngx_http_realip_module模块提供。

## 分片

对于请求结果响应体较大的情况，Nginx支持把较大响应分片(拆分为更小的子请求)传输给客户端。

```java
location / {
    设置切片的大小。0值禁用将响应拆分为切片。请注意，值过低可能会导致内存过度使用，并打开大量文件。
    slice             1m;
    启用按片缓存，效率更高
    proxy_cache       cache;
   $slice_range变量应作为range请求头字段传递给代理服务器。如果启用了缓存，则应将$slice_range添加到缓存key中，并且应启用具有206状态代码的响应的缓存。
    proxy_cache_key   $uri$is_args$args$slice_range;
    proxy_set_header  Range $slice_range;
    proxy_cache_valid 200 206 1h;
    proxy_pass        http://localhost:8000;
}
```

该功能由ngx_http_slice_module模块提供。

## 响应内容替换

Nginx可针对响应中字符串进行替换。示例如下：

```java
location / {
    sub_filter string replacement;响应中的string替换为replacement
    sub_filter '<a href="http://127.0.0.1:8080/'  '<a href="https://$host/';
    sub_filter '<img src="http://127.0.0.1:8080/' '<img src="https://$host/';
    每个字符串替换一次（on-默认）还是重复(replacement还包括可替换内容)
    sub_filter_once on;
    哪种类型响应替换，默认为text/html；"*"表示任意类型
    sub_filter_types *；
}
```

该功能由ngx_http_sub_module模块提供。

这篇文章如果对您有所帮助或者启发的话，帮忙关注或点赞，有问题请评论，必有所复。您的支持是我写作的最大动力！
