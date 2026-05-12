# 17、Angular 4 教程 - 编译优化与nginx压缩
- 来源：https://ddkk.com/zhuanlan/qianduan/angular/1/17.html
- 分类：前端框架
- 分组：教程目录
angular使用缺省的方式进行ng build往往会生成一个几M字节的vendor.bundle.js文件，使用–prod的选项进行编译可以有效降低size，如果还不能满足要求的话可以考虑结合nginx进行压缩已达到目的。

## 两种编译：AOT vs JIT

缩写
全称
说明
特点

AOT
Ahead Of Time Compilation
预编译
编译器仅仅使用一组库在构建期间运行一次

JIT
Just in Time compiler
即时编译器
在每个用户的每次运行期间都要用不同的库运行一次

## Why AOT

使用AOT有如下好处：

**渲染得更快**

**需要的异步请求更少**

**需要下载的Angular框架体积更小**

**提早检测模板错误**

**更安全，降低注入攻击的机会**

## 使用方法

prod选项和aot选项，在目前的版本中，ng build –prod或者ng build –prod –aot基本上都能较为显著的降低生成的vendor.bundle.js等文件的尺寸，按照官方的说明据说可以将其从几M字节降到几百K字节大小。但在实际中，似乎有的时候很难达到这一目标，根据情况将5M的vendor.bundle.js降到2.5M左右的程度还是没有问题的，具体使用的命令如下：

> ng build –prod –aot

## nginx压缩

如果单独–prod –aot的选项无法达到预期目的，可以考虑结合nginx的gzip选项进行设定，以保证速度。

### 作用范围

在nginx的设定文件中，gzip一般可以在如下几种区域内进行设定

**http**

**server**

**location**

### 常用参数设定

项目
取值
说明

gzip
on
off

gzip_comp_level
1-9
压缩级别(级别越高,压缩率越高)

gzip_disable
正则匹配串
不进行gzip的URI

gzip_min_length
最小长度
低于此值得文件不进行压缩

gzip_types
text/plain application/xml等
压缩对象文件类型

gzip_vary
on
off

#### 压缩对象的常见类型：

**text/plain**

**application/x-javascript**

**application/javascript**

**text/css**

**application/xml**

**text/javascript**

**application/x-httpd-php**

**image/jpeg**

**image/gif**

**image/png**

### 示例

以下为server中设定gzip的一个实例

```java
server {
    listen       80;
    server_name  localhost;
    gzip on;
    gzip_min_length 50k;
    gzip_buffers 4 16k;
    gzip_comp_level 5;    gzip_types application/javascript;
    gzip_vary off;
    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
    }
```

### 确认gzip是否开启

上述示例用来说明大于50k的javascript文件才会进行压缩，使用如下curl命令则可以确认是否真正开启。

```java
[root@devops ~]# curl -I -H "Accept-Encoding: gzip" "http://192.168.163.153:32032/vendor.bundle.js"
HTTP/1.1 200 OK
Server: nginx/1.13.5
Date: Mon, 11 Dec 2017 13:35:07 GMT
Content-Type: application/javascript
Last-Modified: Sun, 10 Dec 2017 12:31:28 GMT
Connection: keep-alive
ETag: W/"5a2d2920-56efa5"
Content-Encoding: gzip
[root@devops ~]# 
```

当然也可以通过使用诸如Chrome的F12的功能进行确认。

### gzip_comp_level

通过设定gzip_comp_level，可以有效地降低vendor.bundle.js的大小，在实际的试验中将其设定为2就得到过5倍压缩比的案例，实际在使用的过程中可以根据自己的需要进行调节。

## 参考文件

[https://www.angular.cn/guide/aot-compiler](https://www.angular.cn/guide/aot-compiler)

[http://nginx.org/en/docs/http/ngx_http_gzip_module.html#gzip](http://nginx.org/en/docs/http/ngx_http_gzip_module.html#gzip)
