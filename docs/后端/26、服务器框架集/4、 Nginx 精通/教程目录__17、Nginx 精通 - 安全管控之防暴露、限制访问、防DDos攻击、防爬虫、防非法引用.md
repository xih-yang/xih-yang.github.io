# 17、Nginx 精通 - 安全管控之防暴露、限制访问、防DDos攻击、防爬虫、防非法引用
- 来源：https://ddkk.com/zhuanlan/server/nginx/4/17.html
- 分类：服务器框架
- 分组：教程目录
安全是每个系统都需要考虑的关键因素，Nginx在这方面提供了丰富的功能，使我们可以就实际情形做很精细调整。这些功能包括防信息暴露、客户端访问限制、通讯加密、防DDos攻击、防爬虫、防非法引用及防非法域名请求等。

**目录**

防信息暴露

关闭版本号

关闭目录列表

客户端访问限制

限制客户端地址访问

国家或城市位置限制访

禁止不安全的HTTP方法

HTTPS加密

防DDos攻击

防非法域名指向

防爬虫

利用请求头变量防爬虫

使用Robots.txt文件防爬虫

最佳实践

限制系统访问权限

定期巡检

备份数据

检查日志文件

问题排查

安装最新版本

## 防信息暴露

### 关闭版本号

Nginx默认会在HTTP的响应头中包含服务器版本号信息，攻击者可以利用此信息进行攻击和细节披露。可关闭版本号的显示，指令如下：

```java
server_tokens off;
```

### 关闭目录列表

如果Nginx的目录没有默认的index文件，会自动展示目录下的文件列表，这可能会暴露敏感信息。可以通过禁止自动目录列表的方式来阻止此行为。

示例代码：

```java
location / {
    autoindex off ;
}
```

## 客户端访问限制

Nginx可以对客户端进行访问限制。

### 限制客户端地址访问

直接通过allow或deny限制某些客户端地址的访问。指令如下：

allow address | CIDR | unix: | all;

deny address | CIDR | unix: | all;

允许或不允许客户端访问。

参数：address：直接IP地址形式；CIDR：无类别域间路由；unix: unix套接字；all-所有

示例：

```java
location / {
    将按顺序检查规则，直到找到第一个匹配项
    单独ip 192.168.1.1可访问
    deny  192.168.1.1;
    CIDR: 192.168.1.1-192.168.1.255（掩码：255.255.255.0）可访问
    allow 192.168.1.0/24;
    CIDR: 10.1.1.1-10.1.255.255（掩码：255.255.0.0）可访问 (注意不包括10.1.0.x)
    allow 10.1.1.0/16;
    IPv6网络2001:0db8:：/32进行访问
    allow 2001:0db8::/32;
    符合上述之外的不可访问
    deny  all;
}
```

### 国家或城市位置限制访

可以通过国家或城市位置限制访问，详见精通[Nginx（12）-流量管控](/zhuanlan/server/nginx/4/12.html)

### 禁止不安全的HTTP方法

默认情况下，Nginx支持多种HTTP方法，包括`GET`, `HEAD`, `POST`, `PUT`, `DELETE`, `MKCOL`, `COPY`, `MOVE`, `OPTIONS`, `PROPFIND`, `PROPPATCH`, `LOCK`, `UNLOCK`, 或者 `PATCH`等。然而，某些HTTP方法可能存在安全风险，常见有：

- PUT：向指定的目录上传附加文件；该方法特别危险：如果能够上传Web根目录中的任意文件，就可以在服务器上创建新脚本，从而完全控制应用程序，甚至是Web服务器本身。如果PUT方法存在且被激活
- DELETE：删除指定的资源
- COPY：将指定的资源复制到Destination消息头指定的位置
- MOVE：将指定的资源移动到Destination消息头指定的位置
- SEARCH：在一个目录路径中搜索资源
- PROPFIND：获取与指定资源有关的信息，如作者、大小与内容类型
- TRACE：在响应中返回服务器收到的原始请求。可以使用这种方法避开阻止跨站点脚本的防御
- OPTIONS：方法列出某个特定目录允许的HTTP方法

限制指令如下：

格式：limit_except method ... { ... }

限制除所列之外的HTTP方法。

例如：

```java
# 限制除GET（自动可用HEAD）、POST以外方法访问
limit_except GET POST {
    deny  all;
}
```

## HTTPS加密

使用SSL/TLS 证书可以为网站提供加密的通信，防止中间人攻击。此外，使用证书还可以提高网站的可信度，增加用户对网站的信任。如何配置见[精通Nginx（13）-支持https](/zhuanlan/server/nginx/4/14.html)

## 防DDos攻击

DDoS攻击是一种网络攻击，使服务器受到大量请求使其无法正常工作。Nginx可以通过限制客户端访问速率等方式来防止DDoS攻击。Nginx可对所有请求设置合理的限制，包括限制速率或链接数，从而防止恶意用户试图对您的应用拒绝服务或浪费资源的不轨行为。如何配置见[精通Nginx（12）-流量管控](/zhuanlan/server/nginx/4/12.html)

## 防非法引用

防止非允许网站直接通过`使用自己网站的内容。Nginx通过请求标头字段中"referer"值来确定是否允许访问。当然，使用者可适当构建请求"Referer"字段值来绕过该设置非常容易，因此该模块的目的不是彻底阻止此类请求，而是阻止常规浏览器发送的大量请求。还应该考虑到，即使对于有效的请求，常规浏览器也可能不会发送“Referer”字段。`

配置示例：

```java
# 通常外部引用的都是静态资源，因此对静态资源配置即可 
location ~ .*\.(html|htm|gif|jpg|jpeg|bmp|png|ico|txt|js|css){  
    允许访问的定义
    valid_referers none blocked server_names *.example.com example.*  www.example.org/galleries/ ~\.example-bk\.;
    if ($invalid_referer) {  
        可直接返回403。也可以配置成一张警告盗取的图片
        return   403;  
    }  
    ...      
}  
```

关键指令格式如下：

格式：valid_referers none | blocked | server_names | string ...;

指定将把$invalid_Referer变量设置为空字符串的“Referer”请求标头字段值。否则，$invalid_Referer变量将设置为“1”。搜索匹配项不区分大小写。

- none：表示接受没有Referer字段的HTTP请求访问。
- blocked：表示允许http://或https//以外的请求访问。
- server_names：Referer包含任意一个server_name都允许访问。
- string：如果时任意字符串-定义了服务器名称和可选的URI前缀。服务器名称的开头或结尾可以有一个“*”。如果是正则表达式，第一个符号应该是“~”。需注意的是，匹配是与“http://”或“https://”之后的文本匹配。

本功能由`ngx_http_referer_module模块提供。`

## 防非法域名指向

为了防止非法域名指向我们的服务器，按如下配置：

```java
server {
   80为默认服务器，所有有效域名都应该有对应server{...}匹配，其它均认为不合法，返回一个特殊的nginx的非标准代码444来关闭连接
    listen      80 default;
    return      444;
}
```

## 防爬虫

### 利用请求头变量防爬虫

```java
# 检查HTTP请求头部中是否包含bot、crawl或spider等字眼，包含则返回403错误码，拒绝该请求
if ($http_user_agent ~* "bot|crawl|spider"){
    return 403;
}
# HTTP请求头部中是否包含来自百度、谷歌或必应等搜索引擎的Referer，如果包含则返回403错误码，拒绝该请求
if ($http_referer ~* (baidu|google|bing)){
    return 403;
}
#检查HTTP请求头部中是否包含名为crawlercookie的Cookie，如果包含则返回403错误码，拒绝该请求。
if ($http_cookie ~* "crawlercookie"){
    return 403;
}
```

### 使用Robots.txt文件防爬虫

Robots.txt是一种文本文件，用于告诉搜索引擎哪些页面可以被抓取，哪些页面不能被抓取。我们可以在Nginx配置文件中增加以下代码：

```java
#将请求/robots.txt的页面指向/var/www/目录下的robots.txt文件，从而实现屏蔽搜索引擎爬虫的目的。
location /robots.txt {
    alias /var/www/robots.txt;
}
```

## 最佳实践

除了Nginx本身针对安全的配置，部署、运维本身也要做好安全工作。

### 限制系统访问权限

**1、** Nginx用非root账户运行；

**2、** 确保Nginx只能访问其需要的文件和目录这可以通过设置文件和目录的访问权限来实现；

### 定期巡检

定期对服务器进行安全扫描，及时发现Nginx漏洞、应用程序漏洞等，及时进行修复。

### 备份数据

定期备份 Nginx 的配置文件和日志文件，以防止数据丢失或损坏。可用版本控制工具（如 Git）来管理配置文件。

### 检查日志文件

通过分析 Nginx 的日志文件可以检测异常流量、错误请求和其他攻击尝试。可以使用工具如 Logwatch 来监视和分析 Nginx 日志文件。

### 问题排查

当发现异常行为时，需要进行错误排查。可以使用工具如 Nmap 或 Wireshark 来扫描主机和网络流量，查找潜在的安全漏洞。

还可以通过分析 Nginx 的日志文件可以检测异常流量、错误请求和其他攻击尝试。可以使用工具如 Logwatch 来监视和分析 Nginx 日志文件。

### 安装最新版本

定期更新 Nginx 的版本，以修复已知的安全漏洞。漏洞可能会影响整个 Web 应用程序，因此及时更新可以确保 Nginx 始终处于最新版本，从而减少受到攻击的风险。

这篇文章如果对您有所帮助或者启发的话，帮忙关注或点赞，有问题请评论，必有所复。您的支持是我写作的最大动力！
