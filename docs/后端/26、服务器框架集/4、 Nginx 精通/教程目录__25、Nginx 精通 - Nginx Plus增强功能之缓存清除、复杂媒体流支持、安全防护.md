# 25、Nginx 精通 - Nginx Plus增强功能之缓存清除、复杂媒体流支持、安全防护
- 来源：https://ddkk.com/zhuanlan/server/nginx/4/25.html
- 分类：服务器框架
- 分组：教程目录
Nginx Plus在缓存清除、复杂媒体流支持、安全防护也做了增强。

## 缓存清除

NGINX Plus 可手工指定清除缓存项。配置示例如下：

```java
http {
    请求是PURGE缓存清除方法
    map $request_method $purge_method {
        PURGE 1;
        default 0;
    }
    server {
        listen      80;
        server_name www.example.com;
        location / {
            proxy_pass  https://localhost:8002;
            proxy_cache mycache;
            清除缓存
            proxy_cache_purge $purge_method;
        }
    }
}
```

通过命令行发送如下命令：

```java
 curl -XPURGE http://127.0.0.1/main.js
```

上述命令是清除main.js的缓存。允许使用 * 来清除与常见 URI 前缀相匹配的缓存项（注意需要proxy_cache_path 指令中配置purger=on，通配符才起作用）。

## 复杂媒体流

### HLS支持

HLS（HTTP Live Streaming）是处理 MP4 文件中封装的 H.264/AAC 编码内容。利用 NGINX Plus 的 HLS 模块进行实时分段、分包和多路复用，及控制分段缓冲等等。示例如下：

```java
location /hls/ {
    启用hls模式
    hls;
    视频文件位置
    alias /var/www/video;
     将媒体分割成 4 秒长度的片段
    hls_fragment 4s;
    HLS 缓冲区的数量设置为 10，大小为 10MB
    hls_buffers 10 10m; 
    初始MP4 缓冲区大小设置为 1MB
    hls_mp4_buffer_size 1m; 
    MP4 缓冲区最大为 5MB
    hls_mp4_max_buffer_size 5m;
}
```

指令：

hls: 开启hls模式支持

hls_fragment time; 默认5s; 按时间长度对媒体进行分段。

hls_buffers number size;默认hls_buffers 8 2m;指定了缓冲区的数量和大小。允许客户端在缓冲数据达到一定数量（由 hls_mp4_buffer_size 指定）后开始播放媒体文件。

hls_mp4_buffer_size size;默认512k；初始缓冲区大小

hls_mp4_max_buffer_size size;默认10M; 缓冲区的上限

HLS功能由ngx_http_hls_module模块提供。

### HDF支持

HDS（ Adobe HTTP Dynamic Streaming）是Adobe 自适应流媒体的模式，把FLV 文件分段且与元数据分开。Nginx plus中用f4f模式支持HDS，示例如下：

```java
location /video/ {
    alias /var/www/transformed_video; 
    非常简单，就下面两个指令
    开启f4f
    f4f;
    读取元数据.f4x文件的缓存大小
    f4f_buffer_size 512k;
}
```

HDS功能由ngx_http_f4f_module模块提供。

## 安全防护

### DDoS 防护

DDoS（Distributed Denial of Service）分布式拒绝服务，当多台机器一起攻击一个目标，通过大量互联网流量淹没目标或其周围基础设施，从而破坏目标服务器、服务或网络为正常流量提供服务。使用 NGINX Plus可构建集群感知、速率限制和自动拦截列表。示例如下：

```java
# 按请求ip定义限制请求缓存(最多每秒100个请求）  sync是在集群内同步
limit_req_zone $remote_addr zone=per_ip:1M rate=100r/s sync;
# 429响应表示访问过于频繁，但服务器没有屏蔽你的IP，只是限制你访问速度
limit_req_status 429;
## 指令keyval_zone 和 keyval 在Nginx plus中支持
# 设置keyval缓存区，每对keyval有效期为600s
keyval_zone zone=sinbin:1M timeout=600 sync; 
# 用请求ip在缓存区查找，如果找到，则$in_sinbin为$remote_addr；否则，$in_sinbin为0
keyval $remote_addr $in_sinbin zone=sinbin; 
# Cluster-aware "sin bin" with 
# 10-minute TTL
# Populate $in_sinbin with 
# matched client IP addresses
server {
    listen 80;
    location / {
        if ($in_sinbin) {
            限速
            set $limit_rate 50;
        }
        限制请求
        limit_req zone=per_ip; 
        当响应429(超过规定请求数100r/s)做处理
        error_page 429 = @send_to_sinbin; 
        proxy_pass http://my_backend;
    }
    429的响应处理，把IP放入keyval缓存区 
    location @send_to_sinbin {
        把IP放入keyval缓存区
        rewrite ^ /api/3/http/keyvals/sinbin break; 
        proxy_method POST;
        proxy_set_body '{"$remote_addr":"1"}';
        proxy_pass http://127.0.0.1:80;
    }
    location /api/ {
        内部处理，keyval缓存区
        api write=on;
    }
}
```

示例表示：当客户端超过速率限制（每秒发送超过 100 个请求）时，通过调用 NGINX Plus API 将其 IP 地址添加到“ sinbin”缓存中。集群内的 sinbin 是同步的。无论哪个 NGINX Plus 节点接收请求时，只要匹配来自sinbin中客户端的其他请求都会面临非常低的带宽限制。限制带宽比直接拒绝请求更可取，因为它不会向客户端清楚地表明 DDoS 防护已生效。 10 分钟后，客户端ip将自动从sinbin 中移除。

注意：因为用ip作为限制，需保证获得的是客户端真实IP，如何获取真实IP设置见[精通Nginx（19）-更多实用功能：身份认证、流媒体支持、大文件传输、流量镜像、分片、获取客户端真实ip等](https://mp.csdn.net/mp_blog/creation/editor/134424803)

### NGINX App Protect WAF防护

NGINX App Protect WAF（Web Application Firewall）保护应用和 API 免受七层攻击，为web应用程序和API提供了强大的安全性，实现了安全自动化、平台化。其示意图如下：

NGINX App Protect WAF除抵御和减缓常见漏洞、高级威胁和零星攻击，还具有如下特点：

- 在针对基本的 OWASP 十大安全漏洞的安全防护的基础上，额外拥有 7500 多个高级特征库、机器人特征库和威胁情报所提供的安全防护
- 保护组织的 HTTP/S 和 HTTP/2 应用以及 gRPC 双向流媒体等协议
- 借助内置的数据保护（Data Guard）功能屏蔽个人身份信息（PII），包括信用卡和社会安全号码（SSN）
- 在 PCI DSS 要求的基础上，避免更多违反法规的不合规行为
- 借助高置信度的特征库以阻塞模式进行部署，从而实现极低的误报率

配置示意如下：

```java
...
# 动态加入ngx_http_app_protect_module模块
load_module modules/ngx_http_app_protect_module.so;
http {
    开启WAF
    app_protect_enable on;
    防护策略见文件
    app_protect_policy_file "/etc/nginx/AppProtectTransparentPolicy.json"; 
    开启防护日志
    app_protect_security_log_enable on;
    防护日志：第一个参数定义日志如何设置，第二个参数定义日志存储位置
    app_protect_security_log "/etc/nginx/log-default.json" syslog:server=127.0.0.1:515;
    ...
}
```

防护策略文件AppProtectTransparentPolicy.json内容如下：

```java
{
    "policy": {
        "name": "transparent_policy",
        "template": { "name": "POLICY_TEMPLATE_NGINX_BASE" },
        "applicationLanguage": "utf-8",
        策略模式：blocking-阻拦 transparent-只记录，不阻拦
        "enforcementMode": "blocking",
        阻拦规则定义
        "blocking-settings": {
            "violations": [
            {
                "name": "VIOL_JSON_FORMAT",
                "alarm": true,
                "block": true
            },
            {
                "name": "VIOL_PARAMETER_VALUE_METACHAR",
                报警
                "alarm": true,
                不拦截
                "block": false
            }
            ]
        }
    }
}
```

大多数安全规则都是在策略文件中配置完成，根据官方文档，可灵活定义阻截规则。

日志定义文件log-default.json，默认内容如下：

```java
{
    "filter":{
        "request_type":"all"
    },
    "content":{
        "format":"default",
        "max_request_size":"any",
        "max_message_size":"5k"
    } 
}
```

NGINX App Protect WAF功能由ngx_http_app_protect_module模块提供。

这篇文章如果对您有所帮助或者启发的话，帮忙关注或点赞，有问题请评论，必有所复。您的支持是我写作的最大动力！
