# 02、Nginx 实战：Nginx基础介绍
- 来源：https://ddkk.com/zhuanlan/server/nginx/2/2.html
- 分类：服务器框架
- 分组：教程目录
## 第一章 Nginx基础介绍

## 一、Nginx概述

Nginx是一个开源且高性能、可靠的Http Web服务、代理服务。它具有有很多非常优越的特性: 单机环境下参考服务器配置。 并发连接数在7000+ -8000左右。 集群模式20000+。

作为 Web 服务器：相比 Apache，Nginx 使用更少的资源，支持更多的并发连接，体现更高的效率，这点使 Nginx 尤其受到虚拟主机提供商的欢迎。能够支持高达 50,000 个并发连接数的响应。

作为负载均衡服务器：Nginx 既可以在内部直接支持 Rails 和 PHP，也可以支持作为 HTTP代理服务器 对外进行服 务。Nginx 用 C 编写, 不论是系统资源开销还是 CPU 使用效率都比 Perlbal 要好的多。

作为邮件代理服务器: Nginx 同时也是一个非常优秀的邮件代理服务器（早开发这个产品的目的之一也是作为邮件 代理服务器），Last.fm 描述了成功并且美妙的使用经验。 Nginx 安装非常的简单，配置文件 非常简洁（还能够支持perl语法），Bugs非常少的服务器: Nginx 启动特别容 易，并且几乎可以做到7*24不间断运行，即使运行数个月也不需要重新启动。你还能够在不间断服务的情况下进行 软件版本的升级。

## 二、Nginx发展背景

NetCraft在2018年发布的web服务器调查报告中，排名前三的依然是Microsfot、Apache和Nginx。其中Nginx每年都在不断递增。

该软件由俄罗斯人Igor Sysoev于2004年首次公开发布。

Nginx凭借其稳定性、低资源消耗、简单配置和丰富的功能，从十多年前名不见经传的Web服务器软件，发展到如今能够跟Apache匹敌的地位。

## 三、Nginx特点

1、高性能高并发

性能高，支持海量并发，当并发特别高的时候，nginx比其他的web服务响应速度快

2、轻量且高扩展性

功能模块多，但仅需要保留必要的模块

需要哪个模块添加哪个模块，可以兼容第三方模块

3、高可靠性

很多web服务跑一段时间后需要重启，nginx不需要

nginx支持宕机时间级别为 9999、99999

4、支持热部署

nginx可以在开机情况下进行升级和重启

5、互联网公司使用nginx

nginx技术成熟，可以做负载，安全，web，缓存

6、nginx支持epool网络模型

1）epool：当用户发起请求，直接对请求的内容进行处理

当用户发起请求，epool模型会直接进行处理，效率高效，并无连接限制。

2）select：当用户发起请求，先遍历扫描数据，然后对请求的内容进行处理

当用户发起一次请求，select模型就会进行一次遍历扫描，从而导致性能低下。

总结：

1、开源: 直接获取源代码

2、高性能: 支持海量并发

3、可靠: 服务稳定

## 四、其他Web服务

```java
#1.apache
Apache是一款非常有名的应用软件。它是世界上使用最广泛的Web服务器应用程序，在商业Web服务器市场中占有超过50％的份额。 Apache是类Unix操作系统中使用最广泛的Web服务器应用程序，但几乎可用于所有平台，如Windows，OS X，OS / 2等.Aracle这个词取自Native的名称 美国部落’阿帕奇’，以其在战争和战略制定方面的技能而闻名。
它是一个基于流程的模块化Web服务器应用程序，它通过每个同时连接创建一个新线程。 它支持许多功能; 其中许多都被编译为单独的模块并扩展其核心功能，并且可以提供从服务器端编程语言支持到身份验证机制的所有功能。 虚拟主机就是这样一种功能，它允许单个Apache Web服务器为许多不同的网站提供服务。
最早使用的web服务，难以掌握，性能不高
#2.nginx
1）Tengine：Tengine是由淘宝网发起的Web服务器项目。它在Nginx的基础上，针对大访问量网站的需求，添加了很多高级功能和特性。Tengine的性能和稳定性已经在大型的网站如淘宝网，天猫商城等得到了很好的检验。它的最终目标是打造一个高效、稳定、安全、易用的Web平台。
其详细的特性可以访问官网：https://tengine.taobao.org/
2）OpenResty：OpenResty 是一个基于 Nginx 与 Lua 的高性能 Web 平台，其内部集成了大量精良的 Lua 库、第三方模块以及大多数的依赖项。用于方便地搭建能够处理超高并发、扩展性极高的动态 Web 应用、Web 服务和动态网关。
OpenResty 通过汇聚各种设计精良的 Nginx 模块（主要由 OpenResty 团队自主开发），从而将 Nginx 有效地变成一个强大的通用 Web 应用平台。这样，Web 开发人员和系统工程师可以使用 Lua 脚本语言调动 Nginx 支持的各种 C 以及 Lua 模块，快速构造出足以胜任 10K 乃至 1000K 以上单机并发连接的高性能 Web 应用系统。
OpenResty 的目标是让你的Web服务直接跑在 Nginx 服务内部，充分利用 Nginx 的非阻塞 I/O 模型，不仅仅对 HTTP 客户端请求,甚至于对远程后端诸如 MySQL、PostgreSQL、Memcached 以及 Redis 等都进行一致的高性能响应。
#3.lighttpd
消耗的内存和cpu较低
#4.IIS
windows的web服务
#5.GWS
Google web server
#6.BWS
baidu web server
```

## 五、Nginx应用场景

```java
Nginx是一个异步框架的Web服务器，可以用作反向代理服务、负载均衡、API服务、静态资源服务和HTTP缓存服务。
```

## 六、Nginx的版本介绍

```java
Nginx目前分为开源版本和商业版本（Nginx Plus）
#1.开源版：nginx.org
#2.商业版：nginx.com
官方文档：https://www.nginx.com/products/nginx/#compare-versions
两个版本区别还是很大的，具体如下：
```

Feature
OSS
Nginx Plus

Load balancer
-
-

HTTP/TCP/UDP support
Y
Y

Layer 7 request routing
Y
Y

Active health checks
N
Y

Session persistence
N
Y

DNS service‑discovery integration
N
Y

Content cache
-
-

Static/Dynamic content caching
Y
Y

Cache‑purging API
N
Y

Web server/Reverse proxy
-
-

Origin server for static content
Y
Y

Reverse proxy: HTTP, FastCGI, memcached, SCGI, uwsgi
Y
Y

HTTP/2 gateway
Y
Y

gRPC proxy
Y
Y

HTTP/2 server push
Y
Y

Security controls
-
-

HTTP Basic Authentication
Y
Y

HTTP authentication subrequests
Y
Y

IP address‑based access control lists
Y
Y

Rate limiting
Y
Y

Dual‑stack RSA/ECC SSL/TLS offload
Y
Y

TLS 1.3 support
Y
Y

JWT authentication
N
Y

OpenID Connect SSO
N
Y

NGINX Web Application Firewall (additional cost)
N
Y

Monitoring
-
-

AppDynamics, Datadog, Dynatrace plug‑ins
Y
Y

Extended status with 90 additional metrics
N
Y

High availability (HA)
-
-

Active‑active and active‑passive modes
N
Y

Configuration synchronization
N
Y

State sharing: Sticky‑Learn session persistence, rate limiting, key‑value stores
N
Y

Programmability
-
-

NGINX JavaScript module
Y
Y

NGINX Plus API for dynamic reconfiguration
N
Y

Key‑value store
N
Y

Dynamic reconfiguration without process reloads
N
Y

Streaming media
-
-

Live streaming: RTMP, HLS, DASH
Y
Y

VOD: Flash (flv), MP4
Y
Y

Adaptive bitrate VOD: HLS, HDS
N
Y

MP4 bandwidth controls
N
Y

Third party ecosystem
-
-

Kubernetes Ingress controller
Y
Y

OpenShift Router
Y
Y

Dynamic modules repository
N
Y

## 七、Nginx的版本策略

```java
在Nginx中，有两个分支，分别为mainline和stable:
Mainline相当于开发分支，更新比较频繁，包含一些新功能或者bug修复，版本号的第二个数字如果是奇数，则是Mainline版本，如1.17.1
Stable分支是稳定版本，除非有重大的bug，否则在它生命周期内不会更新，版本号的第二个数字如果是偶数，就是Stable版本，如：1.16.0
最新版本可访问nginx官网地址：http://nginx.org/en/download.html
```

```java
Nginx官网提供的一幅图来说明版本之间的关系:
```
