# 11、Nginx 精通 - 缓存详细配置及缓存多种用法
- 来源：https://ddkk.com/zhuanlan/server/nginx/4/11.html
- 分类：服务器框架
- 分组：教程目录
缓存能够存储请求的响应结果，以供未来再次使用，进而加速内容的提供。内容缓存可以缓存完整的响应，减少上游服务器的负载，避免了每次都为相同的请求重新运行计算和查询的麻烦。缓存可以提高性能并减少负载，这意味着可以用更少的资源更快地提供服务。NGINX 允许在NGINX 服务器的任何地方缓存内容。借助 NGINX 缓存，还可以在代理的服务器发生故障时被动地缓存并提供缓存的响应。缓存功能仅在 http 上下文中可用。

缓存由ngx_http_proxy_module模块实现。

**目录**

缓存核心

存哪儿

怎么存

缓存什么

缓存刷新

方式1-过期刷新

方式2-删除缓存文件

方式3-指定更新

最佳方法

更多缓存功能

缓存锁

客户端缓存

绕过缓存

响应缓冲

常见配置问题

缓存不生效（缓存目录下没有生成缓存文件）

调试时，客户端看到结果同预期不一样

如何查看网页是来自缓存

## 缓存核心

无论什么缓存，都需要解决如下几个问题：

**1、** 存哪儿；

**2、** 怎么存(存的结构，存的策略等)；

**3、** 缓存什么；

**4、** 如何刷新；

Nginx缓存示例（详解见后续）：

```java
http{
    ...
    缓存-存哪儿、怎么存(最大20G，3小时有效期，存储结构levels,按key-value存
    proxy_cache_path /home/nginxcache keys_zone=NCache:60m levels=1:2 inactive=3h max_size=20g;
    server {
        listen 80;
        server_name www.example.com;
       使用NCache
        proxy_cache NCache;
        怎么存-缓存键，默认为“$scheme$proxy_host$request_uri”
        proxy_cache_key "$host$request_uri$cookie_JSESSIONID";
        存什么-GET、HEAD方法 （默认即可）
       proxy_cache_methods GET HEAD;
        存什么-对应哪些响应存储、存储时间（必须定义）
        proxy_cache_valid                       200 206 304 301 302 10m;
        proxy_cache_valid                       any 1m;
        缓存更新-proxy_cache_background_update on;允许启动后台子请求以更新过期的缓存项，同时将过期的缓存响应返回到客户端。
        proxy_cache_background_update on;
        location / {
             其它-添加缓存命中状态，$upstream_cache_status  （调试用，非必须）
             add_header Nginx-Cache $upstream_cache_status;
             其它-针对代理服务器源码，忽略no-cache
             proxy_ignore_headers X-Accel-Expires Expires Cache-Control Set-Cookie;
             proxy_pass http://192.168.1.220;
        }
    }
}
```

### 存哪儿

Nginx的缓存数据保存在文件中，首先需定义缓存路径根目录，定义如下：

```java
    格式：proxy_cache_path path [levels=levels] [use_temp_path=on|off] keys_zone=name:size [inactive=time] [max_size=size] [min_free=size] [manager_files=number] [manager_sleep=time] [manager_threshold=time] [loader_files=number] [loader_sleep=time] [loader_threshold=time] [purger=on|off] [purger_files=number] [purger_sleep=time] [purger_threshold=time];
    path ：缓存目录。缓存数据存储在该目录下的文件中，文件名是对缓存密钥应用MD5函数的结果，如：/data/nginx/cache/c/29/b7f54b2df7773722d382f4809d65029c
    levels：定义了缓存的层次结构级别：从1到3，每个级别都接受值1或2。缓存数据目录层次，最多3层，每层目录名长度为1或2
    use_temp_path：是否使用单独的临时目录（缓存的响应首先写入临时文件，然后重命名该文件）。如果on，则使用proxy_temp_path指令定义的临时目录，此时存在copy效率；否则，临时目录就用缓存目录(path)，文件采用改名方式，不存在copy占时。
    keys_zone：定义key共享内存区。所有key和有关数据的信息都存储在共享内存区域中，其名称和大小由keys_zone参数配置。一个兆字节的区域可以存储大约8000个key。
    inactive：在该参数指定的时间内未访问的缓存数据将从缓存中删除。默认10分钟。
    max_size：缓存区最大尺寸。当超过大小或没有足够的可用空间时，它会删除最近使用最少的数据。
    min_free：保留最小可用空间量
    manager_files、manager_threshold和manager_sleep：缓存数据缓存是迭代进行的。在一次迭代中，删除的项不超过manager_files定义数（默认为100个）。一次迭代的持续时间受manager_threshold参数的限制（默认为200毫秒）。在迭代之间，会进行由manager_sleep参数配置的暂停（默认为50毫秒）。
    loader_files、loader_threshold和loader_sleep：将存储在文件系统上的缓存数据加载到缓存区域中，加载也是在迭代中完成的。在一次迭代中，加载项不超过loader_files（默认为100）。此外，一次迭代的持续时间受loader_threshold参数的限制（默认为200毫秒）。在迭代之间，会进行由loader_sleep参数配置的暂停（默认为50毫秒）。
    purger：指示缓存清除程序是否会从磁盘中删除与通配符匹配的缓存项
    purger_files、purger_threshold和purger_sleep：缓存清除程序在一次迭代中，清除项不超过purger_files（默认为10）。此外，一次迭代的持续时间受purger_threshold参数的限制（默认为50毫秒）。在迭代之间，会进行由loader_sleep参数配置的暂停（默认为50毫秒）。
    proxy_cache_path /data/nginx/cache keys_zone=NCache:60m levels=1:2 inactive=3h max_size=20g;
```

其实从参数说明可看出，proxy_cache_path也包含了存储策略。

proxy_cache_path 仅在http上下文中定义。

### 怎么存

实际上Nginx基于（key,value)模式存储，value就是响应内容，保存在文件中；文件具体位置由key来映射。示例如下：

```java
    定义缓存key，默认为“$scheme$proxy_host$request_uri”，可自定义
    proxy_cache_key "$host$request_uri $cookie_JSESSIONID";
    使用几次才进行缓存，默认为1
    proxy_cache_min_uses 1;
```

选择一个好的proxy_cache_key非常重要，其中离不开对应用的了解。对html纯静态内容选择缓存键通常非常简单，只需 URI 便可。但如果是为动态的内容选择缓存键，就要求对用户与应用的交互方式以及用户体验之间的差异程度有着更深刻的认识。

### 缓存什么

缓存内容肯定是Nginx响应前端的信息。使用示例如下：

```java
        proxy_cache 定义当前上下文Key使用哪个缓存共享内存区域（在proxy_cache_path 中定义的）。同一区域可以在多个地方使用。如果是proxy_cache off，禁用从以前的配置级别继承的缓存
        proxy_cache NCache;
        基于URL方法定义哪些URL缓存，默认GET、HEAD方法
       proxy_cache_methods GET HEAD;
        proxy_cache_valid [code ...] time;  基于响应代码设置缓存数据的时间。实际上只有定义proxy_cache_valid，缓存才表示被真正使用
        proxy_cache_valid  200 206 304 301 302 10d;
        proxy_cache_valid  any 1m;
```

**注意：实际上只有定义proxy_cache_valid，缓存才表示被真正使用**

可在http, server, location上下文中使用缓存 。

### 缓存刷新

在代理模式下，Nginx缓存网站的静态内容，减轻源服务器的负载，加快网站的访问速度。然而，当网站内容发生变化时，Nginx并不会立即更新缓存，导致用户看到的是旧的页面内容。Nginx由如下几种解决方式。

#### 方式1-过期刷新

配置Nginx在缓存过期后主动去源服务器请求新的内容。配置如下：

```java
# 缓存更新-proxy_cache_background_update on | off;默认off。on-允许启动后台子请求以更新过期的缓存项，同时将过期的缓存响应返回到客户端。
proxy_cache_background_update on;
```

即使proxy_cache_background_update on，Nginx在缓存过期后也不会主动去源服务器请求新的内容，而是等下次请求访问，才向服务器重新获取需缓存内容并再次缓存。

**该种方式虽然能更新缓存，但是只有等缓存过期才有效。**

#### 方式2-删除缓存文件

暴力删除缓存文件（即proxy_cache_path 定义路径下的文件），即删除了所有的缓存，下次被访问时再缓存。

这种方式虽然非常有效，但只适合应用使用初期。**对于成熟的应用，可能导致前端访问出现比较大的抖动。**

#### 方式3-指定更新

针对更新的URL更新缓存，示例如下：

```java
http{
    ...
    purger=on指示缓存清除程序是否会从磁盘中删除与通配符匹配的缓存项；默认为off。注意：purger_files、purger_threshold和purger_sleep三个参数是否满足要求。
    proxy_cache_path /data/nginx/cache keys_zone=NCache:60m levels=1:2 inactive=3h max_size=20g purger=on;
    请求方法是PURGE，则表示清除缓存
    map $request_method $purge_method {
        PURGE   1;
        default 0;
    }
    server {
        ...
        location / {
            ...
            清除缓存
            proxy_cache_purge $purge_method;
        }    
    }
}
```

然后从过curl发起清除命令（可用*匹配）：

```java
curl -X PURGE http://www.example.com/main.js
curl -X PURGE http://www.example.com/path/b*.css
```

**注意：指令proxy_cache_purge在模块nginx-module-cache-purge中，商业版才支持**。

#### 最佳方法

最佳缓存刷新方法就是不用Nginx缓存刷新，而是在应用开发时解决，可通过前端加版本号工具（如grunt-cachebuster），给页面请求的每个更新过的资源加上新版本号，这样每次更新的文件都没有被缓存过，就不存在缓存刷新问题。

## 更多缓存功能

### 缓存锁

启用缓存锁后，一次只允许一个请求传递给代理服务器，并根据proxy_cache_key指令标识缓存新元素。同一个缓存元素的其他请求将等待响应出现在缓存中，或者等待释放该元素的缓存锁，直到proxy_cache_lock_timeout指令设置的时间为止。

```java
# 开启缓存锁，默认off
proxy_cache_lock on; 
# 缓存锁时间（默认5s）。如果该时间范围内写入未完成，可以再向被代理服务器传递一个请求
proxy_cache_lock_age 10s; 
#  缓存锁超时时间（默认5s），超时后请求将被传递到代理服务器，响应将不会被缓存。
proxy_cache_lock_timeout 3s;
```

### 客户端缓存

对于js库不易变动的内容，可通过在客户端缓存内容来提高性能。

```java
location ~* \.(css|js)$ { 
    expires 1y;
    add_header Cache-Control "public";
}
```

这个location 代码块指定客户端可以缓存 CSS 和 JavaScript 文件的内容。expires指令指示客户端将缓存资源的有效期设置为一年。add_header 指令将 HTTP 响应头Cache-Control 添加到响应中，值为 public，允许沿途的所有缓存服务器缓存资源。如果将值设置为 private，则只允许客户端缓存资源。

###

绕过缓存

应用中有些使用场景不要求缓存请求，NGINX 提供了 proxy_cache_bypass 指令来绕过缓存。

```java
# 格式： proxy_cache_bypass string ...; 如果字符串参数中至少有一个值不为空且不等于“0”，则不从缓存中获取响应
proxy_cache_bypass $http_cache_bypass $cookie_nocache ;
```

该配置意思是如果名为HTTP请求中 $http_cache_bypass 或 $cookie_nocache有值且不是 0，则该请求绕过缓存向代理的服务器发起请求。

另一个指令也可达到这个目的：

```java
# 格式： proxy_no_cache string ...; 如果字符串参数中至少有一个值不为空且不等于“0”，则不缓存
proxy_no_cache $http_cache_bypass $cookie_nocache ;
```

## 响应缓冲

数据缓存通常缓存在文件中。对于一部分响应内容缓存在内存中，直到缓冲区填满为止，可以实现与客户端更高效的通信。 示例如下：

```java
server {
    proxy_buffering 启用响应缓冲，默认是on
    proxy_buffering on; 
    proxy_buffer_size 读取来自代理服务器的响应首包和响应头的缓冲区大小，默认为一个内存页 4K 或 8K
    proxy_buffer_size 8k; 
    proxy_buffers两个参数：缓冲区数量和缓冲区大小。默认情况下，proxy_buffers 指令被设置为 8 个缓冲区，依据平台不同单个缓冲区容量为 4k 或 8k
    proxy_buffers 8 8k; 
    临时文件(保存超出缓存区大小的响应内容)大小，默认1024M
    proxy_max_temp_file_size 1024m;
    限制一次写入临时文件的数据大小。取值：8k|16k
    proxy_temp_file_write_size 16k;
    proxy_busy_buffers_size限定了繁忙缓冲区的大小，繁忙缓冲区可支持在还未完全读取被代理服务响应内容的情况下直接响应客户端。繁忙缓冲区的大小默认为代理缓冲区或正常缓冲区大小的两倍
    proxy_busy_buffers_size 64k;
     ...
}
```

当缓冲被禁用时，nginx会在收到被代理服务器响应时立即同步传递给客户端。当启用缓冲时，nginx会尽快从代理服务器接收响应，并将其保存到proxy_buffer_size（一次可以从服务器接收的最大数据）和proxy_buffer指令设置的缓冲区中。如果整个响应致内存不够，则将其中的一部分保存到磁盘上的临时文件中。写入临时文件由proxy_max_temp_file_size和proxy_temp_file_write_size指令控制。

缓冲能显著提升代理服务性能，具体取决于响应内容的大小。调整缓冲区设置可能会产生不利影响，非必要情况下不要设置过大缓冲区（可通过反复测试确定消息体的平均大小），因为这会占用大量的 NGINX 内存。可以只为已知 会返回大型响应消息体的特定位置设置大型缓冲区，从而优化性能。

## 常见配置问题

### 数据越界

缓存启用后，用不同用户登陆，同一功能查看数据，本该各自看各自的数据，但结果都看到同样的数据。原因想缓存动态数据，但proxy_cache_key设置不当，默认情况proxy_cache_key为“$scheme$proxy_host$request_uri”，这个只适合缓存静态资源。要缓存动态数据，建议采用"$host$request_uri$cookie_JSESSIONID"，用会话id区分。

**缓存不生效（缓存目录下没有生成缓存文件）**

1未配置 proxy_cache_valid指令。解决方式配置即可。

2缓存页面的header包括如下类似信息：

```java
Cache-control：no-cache,no-store
Expires：1980-01-01
```

解决方式：

**2、** 1修改网页源代码，修改Header；

**2、** 2Nginx做如下配置：；

```java
    忽略头信息    
    proxy_ignore_headers X-Accel-Expires Expires Cache-Control Set-Cookie;
```

### 调试时，客户端看到结果同预期不一样

浏览器一般都会缓存html、css、js等文件。如果想查看Nginx缓存效果，调试时每次最好清除浏览器缓存，这点最易忘记。

### 如何查看网页是来自缓存

可增加如下配置：

```java
    添加缓存命中状态，$upstream_cache_status
    add_header Nginx-Cache $upstream_cache_status;
```

浏览器查看网络如下：

这篇文章如果对您有所帮助或者启发的话，帮忙关注或点赞，有问题请评论，必有所复。您的支持是我写作的最大动力！
