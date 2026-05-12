# 03、Nginx 精通 - 配置结构简述
- 来源：https://ddkk.com/zhuanlan/server/nginx/4/3.html
- 分类：服务器框架
- 分组：教程目录
本文主要讲述Nginx配置文件结构及调试技巧

使用nginx版本为1.24.0。

**目录**

Nginx目录

nginx.conf内容结构

配置片段化

配置调试技巧

## Nginx目录

Nginx编译安装目录如下：

安装指定目录为"/usr/local"。配置目录为/usr/local/nginx/conf。

目录说明：

conf：存放配置文件目录

html：默认作为web服务器的根目录

logs：默认日志目录

xxx_temp：默认的临时文件目录

如果是yum安装，目录如下：

/etc/nginx/：默认配置文件目录

/usr/sbin/：执行文件目录

/var/log/nginx：默认日志目录

配置文件说明：

/etc/nginx/nginx.conf：是 NGINX 服务使用的默认配置入口点。主要配置 worker 进程、调优、日志记录、动态模块的加载以及对其他 NGINX 配置文件的引用。

/etc/nginx/conf.d/：包含http模块用到的 HTTP 服务器配置文件，以 .conf 结尾。

/var/log/nginx/：是 NGINX 的默认日志位置。

## nginx.conf内容结构

下图是nginx安装后的nginx.conf初始化内容及结构说明：

说明：
**1、** nginx配置文件中每个配置都是一个指令指令分为简单指令和块指令一个简单指令由名称和参数组成，用空格分隔，并以分号（；）结尾块指令的结构与简单指令相同，但它不是以分号结尾，而是以一组由大括号（{和}）包围的附加指令结尾如果一个块指令可以在大括号中包含其他指令，那么它被称为上下文（例如：events、http、server和location）；

**2、** 在任何上下文之外放置在配置文件中的指令都被认为是在主上下文中events和http指令位于主上下文中，server位于http中，location位于server中；

**3、** 上下文划分层级：主上下文-http-server-location下级上下文可继承上级上下文中定义的指令，如果相同指令在下级上下文重新定义了，以下级为准举例error_log参数（可在所有级定义）：；

a.在主上下文定义，表示全nginx错误日志共用一个error.log文件；

b.可再在http主上下文中定义，表示http的错误日志共用一个error.log文件；如果http上下文没有定义error_log，则用主上下文定义的error.log文件

c.再在server主上下文中定义，表示该server的错误日志单独用这个error.log文件；如果server块没有定义error_log，则用http主上下文定义的error.log文件

**4、** 部分指令可在任何上下文中配置，有的只能在特定上下文配置如果指令配置位置有错，nginx-t|T可检测，直接运行也会报错；

5、 #符号后的其余部分被视为注释。

下面是一个配置示例：

```java
pid logs/nginx.pid;
worker_processes auto;
worker_rlimit_nofile 65536;
error_log  logs/error.log;
events {
    worker_connections 16384;
}
http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    access_log  /var/log/nginx/access.log  main;
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';
    server {
         listen         80;
         server_name     _;
         access_log      /var/log/nginx/access.log;
         server_name_in_redirect  off;
         location / {
                  root  /usr/share/nginx/html;
                  index index.html;
         }
    }
    # conf.d下通常是更多server的定义
    include /etc/nginx/conf.d/*.conf;
}
```

##

配置片段化

用include 语句组织配置-include读入的文件内容就如直接在nginx.conf定义的片段被单独抽出来作为一个文件，include就是复原位置而已。应用场景：

**1、** http模块中”include/etc/nginx/conf.d/*.conf;“意思就是把每个server单独用一个文件配置，然后用include语句读入；

**2、** 对于需重复定义的配置片段，单独抽出来作为一个文件，在使用的地方用include语句读入即可；

这种方式组织配置是最佳实践，可使配置简洁、易扩展。

## 配置调试技巧

**1、** 检查配置语法；

nginx -t

测试NGINX 配置。

nginx -T

测试NGINX 配置并将验证后的配置打印到屏幕上。此命令在寻求支持时很有用。

**2、** 快速加载新配置；

nginx -s reload

在保证不丢包的情况下重新加载配置。适合在线调整配置参数。

**3、** 验证是否匹配正确，方法如下：；

**3、** 1、在配置文件中，在要验证匹配地方，匹配后用return指令输出结果举例如下：；

```java
 测试
    server {
        listen 8080 default_server;
        表示当前服务器匹配了来自8080的请求
        return 900;
    }
    server {
        listen 80 default_server;
        location / {
           表示当前location匹配规则生效
            return 901;
        }
        location = / {
           表示当前location匹配规则生效
            return 902;
        }
    }
```

注：return返回是三位数字。

**3、** 2、运行nginx-sreload加载最新配置；

**3、** 3、用curl命令测试，如：；

注意：调试完要去掉return配置

**3、** 4、如果方法要用于测试服务器名匹配，可利用hosts文件把域名映射到127.0.0.1，然后用3.1-3.3步调试最后调试完别忘了在hosts中删除映射关系；

该方法非常实用。
