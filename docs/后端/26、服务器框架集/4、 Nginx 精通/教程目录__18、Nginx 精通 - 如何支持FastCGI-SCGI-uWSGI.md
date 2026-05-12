# 18、Nginx 精通 - 如何支持FastCGI/SCGI/uWSGI
- 来源：https://ddkk.com/zhuanlan/server/nginx/4/18.html
- 分类：服务器框架
- 分组：教程目录
最初用浏览器浏览的网页只能是静态html页面。随着社会发展，动态获取数据、操作数据需要变得日益强烈，CGI应运而生。CGI（Common Gateway Interface）公共网关接口，是外部扩展应用程序与静态Web服务器交互的一个标准接口。它可以使外部程序处理浏览器送来的表单数据并对此作出响应，响应结果可直接返回给浏览器 。CGI技术示意图如下：

CGI程序可以用任何脚本语言或独立编程语言实现。然而，由于每次请求都需要启动一个新的程序，导致CGI的性能相对较低，扩展性也较差。因此当前很少直接使用CGI，而是发展出更高效相关技术。

**目录**

CGI相关技术

FastCGI

配置示例

常用指令

fastcgi_pass

fastcgi_index

fastcgi_param

SCGI

配置示例

常用指令

scgi_pass

UWSGI

配置示例

常用指令

uwsgi_pass

## CGI相关技术

从性能、扩展性和安全性方面入手，CGI发展出如下几种主要技术：

**1、** FastCGI：快速通用网关接口（FastCommonGatewayInterface），它是早期通用网关接口（CGI）的增强版本FastCGI致力于减少网页服务器与CGI程序之间互动的开销，从而提高服务器的性能，使其可以同时处理更多的网页请求与CGI相比，FastCGI的主要优势在于其性能和扩展性FastCGI典型实现是PHP语言实现的php-fpm，这也是php网站最常使用接口程序；

**2、** SCGI：简单网关接口（SimpleGatewayInterface），它是一种介于web服务器和提供HTTP服务的应用程序之间的接口，能够实现HTTP服务进程的管理，为动态web应用程序提供了一个外部接口SCGI的优势在于其简单性和可扩展性，但与FastCGI相比，SCGI的性能可能稍逊一筹；

**3、** WSGI，全称WebServerGatewayInterface，是为Python语言定义的Web服务器和Web应用程序或框架之间的一种简单而通用的接口它是作为Web服务器与Web应用程序或应用框架之间的一种低级别的接口，以提升可移植Web应用开发的共同点许多框架都自带了WSGIserver，比如Flask、webpy、Django、CherryPy等等；

**4、** uWSGI：uWSGI是一种实现了WSGI协议的Web服务器，它具有高性能和可移植性uWSGI是用C语言编写的，因此其性能相对较高uWSGI可以作为Python定义的web服务器和web框架之间的接口标准；

总的来说，这四种技术的主要区别在于性能、扩展性和安全性。相对于CGI来说，FastCGI、SCGI、WSGI和uWSGI的性能和扩展性较好。其中，uWSGI由于其高性能和可移植性，通常被认为是最优的选择。然而，具体选择哪种技术取决于具体的应用场景和需求。

## FastCGI

FastCgi由ngx_http_fastcgi_module模块实现，只要满足FastCgi的应用服务器均支持。以PHP（最常用的）为例，Nginx-Php工作示意图如下：

### 配置示例

```java
    server{
         listen 8090;
         静态网页
         location / {
             root  /usr/share/nginx/html;
             index   index.html index.php;
         }
         php页面均转给php-fpm
         location ~ \.php$ {
             fastcgi_pass  localhost:9000;
             fastcgi_index index.php;
             $fastcgi_script_name代表请求uri
             fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
             包含fastcgi_params文件，定义了fastcgi_param 
             include       fastcgi_params;
         }
    }
```

### 常用指令

#### fastcgi_pass

格式：fastcgi_pass `address`;

设置FastCGI服务器地址，可以是负载均衡服务器组、域名、ip地址+端口、Unix套接字。

#### fastcgi_index

格式：fastcgi_index `name`;

当URI以"/"结尾，用于指定默认访问文件。如果未设置，则默认为index.php。

#### fastcgi_param

格式：fastcgi_param `parameter``value` ;

设置应传递给FastCGI服务器参数。该值可以包含文本、变量及其组合。当且仅当在当前级别上没有定义fastcgi_param指令时，这些指令才会从以前的配置级别继承。

需要设置的常见参数包括：

- SCRIPT_FILENAME参数在PHP中用于确定脚本名称
- QUERY_STRING参数用于传递请求参数。
- REQUEST_METHOD参数用于传递请求方法，POST必传。
- CONTENT_TYPE参数用于传递内容类型，POST必传。
- CONTENT_LENGTH参数用于传递内容长度，POST必传。

Nginx默认在fastcgi_params文件中定义了常用的要传递的参数，内容如下：

```java
fastcgi_param  QUERY_STRING       $query_string;
fastcgi_param  REQUEST_METHOD     $request_method;
fastcgi_param  CONTENT_TYPE       $content_type;
fastcgi_param  CONTENT_LENGTH     $content_length;
fastcgi_param  SCRIPT_NAME        $fastcgi_script_name;
fastcgi_param  REQUEST_URI        $request_uri;
fastcgi_param  DOCUMENT_URI       $document_uri;
fastcgi_param  DOCUMENT_ROOT      $document_root;
fastcgi_param  SERVER_PROTOCOL    $server_protocol;
fastcgi_param  REQUEST_SCHEME     $scheme;
fastcgi_param  HTTPS              $https if_not_empty;
fastcgi_param  GATEWAY_INTERFACE  CGI/1.1;
fastcgi_param  SERVER_SOFTWARE    nginx/$nginx_version;
fastcgi_param  REMOTE_ADDR        $remote_addr;
fastcgi_param  REMOTE_PORT        $remote_port;
fastcgi_param  SERVER_ADDR        $server_addr;
fastcgi_param  SERVER_PORT        $server_port;
fastcgi_param  SERVER_NAME        $server_name;
# PHP only, required if PHP was built with --enable-force-cgi-redirect
fastcgi_param  REDIRECT_STATUS    200;
```

可根据实际需要再追加。

关于参数，HTTP请求头字段作为默认参数传递给FastCGI服务器。在FastCGI服务器运行的应用程序和脚本中，这些参数通常作为环境变量提供。例如，“User Agent”标头字段作为HTTP_User_Agent参数传递。除了HTTP请求头字段之外，就使用fastcgi_param指令传递任意参数。

其它指令略。

实际上Nginx也可以对FastCGI响应缓冲或对响应缓存，相关指令基本同反向代理对应指令一样，只不过把"proxy_"换成"fascgi_"头，如：fastcgi_buffer_size 就是 proxy_buffer_size

## SCGI

SCgi由ngx_http_scgi_module模块实现，只要满足SCgi的应用服务器均支持。

### 配置示例

```java
location / {
    包含传递参数文件
    include   scgi_params;
    scgi_pass localhost:9000;
}
```

scgi_params是参数文件，默认包含：

```java
scgi_param  REQUEST_METHOD     $request_method;
scgi_param  REQUEST_URI        $request_uri;
scgi_param  QUERY_STRING       $query_string;
scgi_param  CONTENT_TYPE       $content_type;
scgi_param  DOCUMENT_URI       $document_uri;
scgi_param  DOCUMENT_ROOT      $document_root;
scgi_param  SCGI               1;
scgi_param  SERVER_PROTOCOL    $server_protocol;
scgi_param  REQUEST_SCHEME     $scheme;
scgi_param  HTTPS              $https if_not_empty;
scgi_param  REMOTE_ADDR        $remote_addr;
scgi_param  REMOTE_PORT        $remote_port;
scgi_param  SERVER_PORT        $server_port;
scgi_param  SERVER_NAME        $server_name;
```

可按实际需要增加。

### 常用指令

#### scgi_pass

格式：scgi_pass `address`;

设置SCGI服务器地址，可以是负载均衡服务器组、域名、ip地址+端口、Unix套接字。

基本指令同fastcgi，只不过前缀"fastcgi_"换成"scgi_"

## UWSGI

ＵＷSGI由ngx_http_uwsgi_module模块实现，只要满足uwsgi的应用服务器均支持。

### 配置示例

```java
location / {
    包含传递参数文件
    include    uwsgi_params;
    uwsgi_pass localhost:9000;
}
```

uwsgi_params是参数文件，默认包含：

```java
uwsgi_param  QUERY_STRING       $query_string;
uwsgi_param  REQUEST_METHOD     $request_method;
uwsgi_param  CONTENT_TYPE       $content_type;
uwsgi_param  CONTENT_LENGTH     $content_length;
uwsgi_param  REQUEST_URI        $request_uri;
uwsgi_param  PATH_INFO          $document_uri;
uwsgi_param  DOCUMENT_ROOT      $document_root;
uwsgi_param  SERVER_PROTOCOL    $server_protocol;
uwsgi_param  REQUEST_SCHEME     $scheme;
uwsgi_param  HTTPS              $https if_not_empty;
uwsgi_param  REMOTE_ADDR        $remote_addr;
uwsgi_param  REMOTE_PORT        $remote_port;
uwsgi_param  SERVER_PORT        $server_port;
uwsgi_param  SERVER_NAME        $server_name;
```

可按实际需要增加。

### 常用指令

#### uwsgi_pass

格式：uwsgi_pass `address`;

设置uwsgi服务器地址，可以是负载均衡服务器组、域名、ip地址+端口、Unix套接字。

基本指令同fastcgi，只不过前缀"fastcgi_"换成"uwsgi_"

这篇文章如果对您有所帮助或者启发的话，帮忙关注或点赞，有问题请评论，必有所复。您的支持是我写作的最大动力！
