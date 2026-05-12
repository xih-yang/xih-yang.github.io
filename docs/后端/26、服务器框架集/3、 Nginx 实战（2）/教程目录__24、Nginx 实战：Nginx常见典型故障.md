# 24、Nginx 实战：Nginx常见典型故障
- 来源：https://ddkk.com/zhuanlan/server/nginx/3/24.html
- 分类：服务器框架
- 分组：教程目录
## 1.为什么nginx里面有的是浏览器渲染出的页面，有的时候就变成下载文件？

这个一个取决于服务端nginx，一个取决于你浏览器。在Nginx服务端的配置文件目录下，有一个mime.types 文件，内容如下

```java
types {
    text/html                             html htm shtml;
    text/css                              css;
    text/xml                              xml;
    image/gif                             gif;
    image/jpeg                            jpeg jpg;
    application/javascript                js;
    application/atom+xml                  atom;
    application/rss+xml                   rss;
    text/mathml                           mml;
    text/plain                            txt;
    text/vnd.sun.j2me.app-descriptor      jad;
    text/vnd.wap.wml                      wml;
    text/x-component                      htc;
```

这里，如text/html格式的字符串就是用来说明数据类型的，/前的是主类型，/之后的是该主类型下的子类型。详细的类型定义在RFC2046中。

Nginx通过服务器端文件的后缀名来判断这个文件属于什么类型，再将该数据类型写入HTTP头部的Content-Type字段中，发送给客户端。

比如，当我们打开一个页面，看到一个PNG格式的图片的时候，Nginx是这样发送格式信息的：

服务器上有test.png这个文件，后缀名是png；

根据mime.types，这个文件的数据类型应该是image/png；

将Content-Type的值设置为image/png，然后发送给客户端。

我们在Chrome浏览器中可以看到这个文件返回的头部信息，并对应的宣传出来，如果不能识别则设置为下载文件。

## 2.multi_accept on的作用是什么？能不能通用配置？

这个数值默认就是on建议采用默认设置, multi_accept的作用是告诉nginx收到一个新连接通知后接受尽可能多的连接，多个worker按串行方式来处理连接，也就是一个连接只有一个worker被唤醒，其他的处于休眠状态

设置为off后，多个worker按并行方式来处理连接，也就是一个连接会唤醒所有的worker，直到连接分配完毕，没有取得连接的继续休眠。当你的服务器连接数不多时，开启这个参数会让负载有一定的降低，但是当服务器的吞吐量很大时，为了效率，可以关闭这个参数。

## 3.同一台机器通过进程socket文件快还是通过localhost:9000这个方式快？彼此之间各有什么坑吗？

这两个模式不一样，一般对于程序联系更为紧密的，可以使用进程间共享内存调用，这样效率更高。 Socket方式。

如果，两个进程是松耦合的，那么用接口调用模式更佳。IP:PORT方式

当前，我们对于系统设计讲究松耦合，微服务的模式，所以版本通过api接口模式调用更为广泛应用。

## 4.nginx +tomcat 后台服务响应内容比较大

日志报"an upstream response is buffered to a temporary file"的warn,通常这种情况需要配置网站的 Proxy Buffer相关的参数，但proxy buffer相关的参数，我应该配置多大合理

这个buffer缓冲区设置是根据实际的 Response 大小来定，假设你是这么设置的：

```java
fastcgi_buffers 8 5K; 
fastcgi_buffer_size 5K;
#那么内存的缓存区最大能缓存的大小是 5K * 8 = 40K,如果Nginx代理的后台页面超过这个大小，那就会出现这个错误。
#因为，频繁的写硬盘会影响性能，所以这个参数还是值得适当的根据实际情况优化的
```

## 5.关于try_files，怎么在生产中真正结合缓存，代理用？如下例:

```java
server {
    ...
        location {
            try_files /app/cache/ $uri @fallback; 
            index  index.html;
        }
    ...
}
```

我们可以用后台程序将缓存信息生成到\(document_root/app/cache/目录下，它将检测,\)document_root/app/cache/index.html 和\(document_root\)uri是否有静态缓存生成的文件存在，如果不存在着内部重定向到@fallback(＠表示配置文件中预定义标记点)。

## 6.nginx在配置https时，如何匹配某个URL地址不做https跳转，如下例:

```java
server {
    listen 80;
    server_name xuliangwei.com;
    root /code;
    location / {
       如果url不匹配这个则进行跳转https，匹配则走本地的root查询内容
        if ($request_uri !~ '^/bgx/') {
            return 301 https://$server_name$request_uri;
        }
    }
}
server {
    ....
    listen 443;
    server_name xuliangwei.com;
    ....
}
```

## 7.使用nginx负载均衡时，如何将后端请求超时的服务器流量平滑的切换到另一台上。

如果后台服务连接超时，Nginx是本身是有机制的，如果出现一个节点down掉的时候，Nginx会更据你具体负载均衡的设置，将请求转移到其他的节点上，但是，如果后台服务连接没有down掉，但是返回错误异常码了如:504、502、500,这个时候你需要加一个负载均衡的设置，如下：

proxy_next_upstream http_500 | http_502 | http_503 | http_504 |http_404;

意思是，当其中一台返回错误码404,500...等错误时，可以分配到下一台服务器程序继续处理，提高平台访问成功率。

```java
server {
    listen 80;
    server_name xuliangwei.com;
    location / {
        proxy_pass http://node;
        proxy_next_upstream error timeout http_500 http_502 http_503 http_504;
    }
}
```

## 8.如何使用nginx的proxy_next_upstream将nginx错误页面返回json

需求是除了404 页面，其他的错误页面都要返回 json，而且在外界看来是正常的，所以说白了就是后端服务器返回了我定义的错误状态码，需要在nginx这里做一个转换，转换到 200，用户看到的是200，其实是将错误的状态码定向至200，然后再次调度到/api。

```java
server {
    listen 80;
    server_name www.bgx.com;
    location / {
        proxy_intercept_errors on;                 反向代理默认不支持自定义错误页面，需要增加该参数
        proxy_set_header Host $host;
        proxy_pass http://www_server3_plools;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_next_upstream error timeout http_503 non_idempotent;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
   出现500等错误都返回给用户200状态，并跳转至/api
    error_page 500 502 503 504 =200 /api;
    location = /api{
        default_type application/json;
        return 200 '{"retCode":"1001","retMsg":"invoke failed"}';
    }
```

## 9.负载均衡配置，当挂掉一台服务时，不能流畅地切换

需求：在配置负载均衡时，后端三台web，手动关闭一个web 服务，当轮询到这台关停的时候，总是要卡顿很久？

可以如下这两个参数：

```java
proxy_connect_timeout 600; 1分钟 
proxy_read_timeout 600;    1分钟
```
