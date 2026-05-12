# 15、Nginx 精通 - 快速解决CORS问题
- 来源：https://ddkk.com/zhuanlan/server/nginx/4/15.html
- 分类：服务器框架
- 分组：教程目录
CORS是一个W3C标准，全称是跨域资源共享（Cross-Origin Resource Sharing）。它允许浏览器向跨源服务器，发出XML HttpRequest（XHR） 或Fetch API跨域 HTTP 请求，从而克服了同源使用的限制。

CORS 需要浏览器和服务器同时支持。目前，所有浏览器都支持该功能，整个 CORS 通信过程，浏览器自动完成，不需要用户参与。CORS 对开发者透明，CORS 通信与同源的 AJAX 通信没有差别，代码完全一样。浏览器一旦发现 AJAX 请求跨源，就会自动添加一些附件的头信息，有时还会多处一次附件的请求，但用户不会有感觉。

**目录**

CORS机制

同源策略

CORS请求分类

简单请求CORS处理

非简单请求CORS处理

CORS相关头字段

Nginx的CORS配置

## CORS机制

### 同源策略

同源策略是一个重要的web安全策略，它用于限制一个源的资源如何能与另一个源的资源进行交互。它能帮助阻隔恶意文档，减少可能被攻击的媒介。

同源指两个 URL 的协议（Protocol）、主机（Host）、端口（Port）都相同，否则是不同源的。例如：

```java
# 下面两个同源
http://www.example.com/a
http://www.example.com/b
# 同上不同源情况
# 协议不同
https://www.example.com/a
# 域名不同
http://trial.example.com/a
# 端口不同
http://www.example.com:8080/a
```

不同源的请求就需要CORS支持。

### CORS请求分类

浏览器将 CORS 请求分成两类：简单请求和非简单请求。

简单请求是http请求同时满足以下条件的http请求：

**1、** 请求方法是以下三种之一：HEAD、GET、POST；

**2、** HTTP的头信息不超出以下几种字段：Accept、Accept-Language、Content-Language、Content-Type、DPR、Downlink、Save-Data、Viewport-Width、Width；

**3、** Content-Type的值仅限于三种之一：text/plain、multipart/form-data、application/x-www-form-urlencoded；

不是简单请求，就只能是 非简单请求

### 简单请求CORS处理

简单请求跨域处理过程：

**1、** 浏览器直接发出CORS请求在头信息之中，增加一个`Origin`字段，用来说明本次请求来自哪个源（协议+主机+端口）；

**2、** 服务器接收到请求，查看`Origin`指定的源，如果在许可范围内，服务器会返回一个正确的HTTP响应，在响应头加入`Access-Control-Allow-Origin字段`否则，服务器会返回HTTP响应则不包含`Access-Control-Allow-Origin字段`；

**3、** 浏览器收到响应头，判断响应头是否包含`Access-Control-Allow-Origin字段，包含且值正确，那就正常处理，否则就抛出CORS错误`；

### 非简单请求CORS处理

非简单请求的 CORS 请求，相对于简单请求，会在正式通信之前，增加一次 HTTP 查询请求，即**预检请求**（preflight）：浏览器先询问服务器，当前网页所在的域名是否在服务器的许可名单之中，以及可以使用哪些 HTTP 方法和头信息字段。只有得到肯定答复，浏览器才会发出正式的 XMLHttpRequest 请求，否则就报错。

“预检请求”用的请求方法是 `OPTIONS`，表示这个请求是用来询问的。头信息包括如下变量：

- Origin：必须字段。来说明本次请求来自哪个源（协议 + 主机 + 端口）
- **Access-Control-Request-Method：**必须字段，用来列出浏览器的 CORS 请求会用到哪些 HTTP 方法。
- **Access-Control-Request-Headers：**可选字段（内容是逗号分隔的字符串），指定浏览器 CORS 请求会额外发送的头信息字段。
- **Access-Control-Max-Age：**预检请求结果缓存有效期。有效期内，CORS请求不需再发预检请求，直接使用缓存数据。如果不缓存，则每次都会发送预检请求。

服务器收到“预检请求”以后，检查了 Origin、Access-Control-Request-Method 和 Access-Control-Request-Headers 字段以后，确认允许跨域请求，就可以做出回应。如果服务器否定了“预检请求”，会返回一个正常的 HTTP 回应，但是没有任何的 CORS 相关的头信息字段。这是，浏览器就认定，服务器不同意预检请求，因此触发一个错误。

### CORS相关头字段

**Access-Control-Allow-Origin ：**支持CORS的必须字段。值要么是请求时 `Origin` 字段的值，要么是一个 `*`，表示接受任意的源（域名）的请求。

**Access-Control-Allow-Credentials：**可选字段。值为布尔值，表示是否允许请求发送 Cookie。默认情况下，Cookie 不包括在 CORS 请求之中。设为 `true`，即表示服务器明确许可，Cookie 可以包含在请求中，一起发给服务器。如果发送Cookie真正起作用，还需满足：

**1、** 必须在客户端请求中打开`withCredentials`属性：xhr.withCredentials=true否则，即使服务器同意发送Cookie，浏览器也不会发送；

**2、**`Access-Control-Allow-Origin`就不能设为`*，`必须指定明确的、与请求网页一致的域名同时，Cookie依然遵循同源策略，只有用服务器域名设置的Cookie才会上传，其他域名的Cookie并不会上传，且（跨源）原网页代码中的`document.cookie`也无法读取服务器域名下的Cookie；

**Access-Control-Allow-Headers：**前端向后端传递数据时，除默认请求头字段外，可通过该字段给出的字段来传递。默认包含请求头字段有：Accept, Accept-Language, Content-Language, Content-Type（只接受：application/x-www-form-urlencoded、multipart/form-data 或 text/plain 这三种 MIME 类型。）

**Access-Control-Expose-Headers：**可选字段。CORS 请求时，后端向前端传递数据时（`getResponseHeader()` 方法只能获取），除默认响应头字段外，可通过该头字段给出的字段来传递。默认包含响应头字段有：： `Cache-Control`、`Content-Language`、`Content-Type`、`Expires`、`Last-Modified`、`Pragma`。字段值可以配置为通配符“*”（不包括Authorization），但请求不能携带凭据（请求没有Cookie或认证信息），否则，就成了普通字符“*”。

## Nginx的CORS配置

Nginx支持跨域请求配置，示例配置如下：

```java
# cors请求方法分组，结果记录到$cors_method
map $request_method $cors_method {
    GET 1;
    POST 1;
    OPTIONS 11;  预检请求方法
    default 0; 非前面三种请求方法，不做处理
}
server {
    location / {
        简单请求
        if ($cors_method = '1') {
            add_header 'Access-Control-Allow-Origin'  '*.example.com';
            add_header 'Access-Control-Allow-Methods' 'GET,POST,OPTIONS';
            add_header 'Access-Control-Allow-Credentials' 'true';
            add_header 'Access-Control-Allow-Headers''token,Authorization,DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type';
            add_header 'Access-Control-Expose-Headers' 'Authorization, Refresh-Token';
        }
        复杂请求-预检请求处理
        if ($cors_method = '11') {
            add_header 'Access-Control-Allow-Origin'  '*.example.com';
            add_header 'Access-Control-Allow-Methods' 'GET,POST,OPTIONS,PUT';
            add_header 'Access-Control-Allow-Credentials' 'true';
            add_header 'Access-Control-Allow-Headers''token,Authorization,DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type';
            add_header 'Access-Control-Expose-Headers' 'Authorization, Refresh-Token';
            缓存1天
            add_header 'Access-Control-Max-Age' 86400;
            状态码204表示请求已经执行成功，但没有内容。浏览器不会刷新页面，也不会导向别的页面。
            return 204;
        }
    }
    ...
}
```

实际配置不需要按示例进行，只要按需处理即可。

如果涉及多出处配置CORS，则配置单独成文件，在使用位置直接include进来。这样配置更简洁。

这篇文章如果对您有所帮助或者启发的话，帮忙关注或点赞，有问题请评论，必有所复。您的支持是我写作的最大动力！
