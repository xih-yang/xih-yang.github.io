# 13、Nginx 精通 - 数据压缩是显著提升性能最简单方式
- 来源：https://ddkk.com/zhuanlan/server/nginx/4/13.html
- 分类：服务器框架
- 分组：教程目录
压缩数据是一个重要的、潜在的性能加速器。图片（JPEG 和 PNG）、视频 (MPEG-4）和音乐 (MP3) 等文件都有着精心打造和非常高效的压缩标准，其中任何一个标准都可以将文件缩小一个数量级甚至更多。而HTML（包括纯文本和 HTML 标签）、CSS 和代码(如 JavaScript）等文本数据经常在不压缩的情况下进行传输。压缩这些数据可能会对可感知到的 Web 应用性能产生特别明显的影响，尤其是对速度缓慢或移动连接受限的客户端来说。

智能内容压缩通常可以将 HTML、Javascript、CSS 和其他文本内容的带宽需求减少 30% 及以上，并相应地减少加载时间。如果使用 SSL，压缩可以减少必须进行 SSL 编码的数据量，从而抵消压缩数据所需的一些 CPU 时间。

**目录**

压缩原理

使用压缩过程

gzip压缩

压缩实例

指令

gzip

gzip_types

gzip_comp_level

gzip_buffers

gzip_disable

gzip_http_version

gzip_min_length

gzip_proxied

gzip_vary

gunzip压缩

指令

gunzip

gunzip_buffers

gzip_static

压缩实战效果

## 压缩原理

Nginx压缩是基于HTTP协议的压缩技术，它通过在服务器端对网页内容进行压缩，以减少传输的数据量，提高网页加载速度。Nginx压缩主要支持文本内容的压缩，如HTML、CSS、JavaScript等文件。

Nginx压缩主要通过Gzip算法来实现。该算法将文件内容分为多个小块，并对每个块进行压缩。压缩后的数据再进行传输，可以显著减少传输的数据量，提高网页加载速度。同时，浏览器端会进行相应的解压操作，将压缩后的数据还原为原始内容。

gzip所使用的算法是开源、无专利的 LZ77（Lempel-Ziv 1977）算法的变体。该算法寻找输入数据内的重复字符串。二次出现的字符串由一个指向前一字符串的指针（以对的形式 -- 距离和长度）代替。其中，距离限定为 32 KB，长度限定为 258 字节。如果字符串没有在这前 32 KB 内出现，它就会作为文字字节序列发出（这里所说的*字符串* 定义为随意字节序列，并不仅限于可打印的字符）。

## 使用压缩过程

浏览器-服务器压缩工作示例：

过程说明：

**1、** 浏览器发出请求，请求头字段有”Accept-Encoding:gzip,deflate“，表示浏览器可支持压缩数据，压缩算法可支持gzip和deflate两种；

**2、** Nginx接到请求后，根据头字段”Accept-Encoding”，判断是否需要压缩如果可压缩且算法也是Nginx所用的，就对响应（response)数据进行压缩，在返回时添加响应头字段“Content-Encoding:gzip”；否则，不压缩响应数据直接返回，也不添加头字段“Content-Encoding"；

**3、** 浏览器收到响应后，查看是否有头字段“Content-Encoding"，如果有且是支持的压缩算法，就对返回数据解压；否则，直接使用响应数据；

## gzip压缩

gzip是Nginx主要压缩算法，由ngx_http_gzip_module模块实现。

### 压缩实例

下面是一个压缩配置例子：

```java
# 启用gzip压缩
gzip on;  
# 设置gzip压缩的级别  
gzip_comp_level 1;  
# 大于1024字节才压缩
gzip_min_length 1024;
# 设置gzip压缩类型
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;  
# 添加Vary头，告诉缓存服务器不同的浏览器可能会对同一份内容有不同的编码  
gzip_vary on;  
# 设置内存缓冲区大小，指定16个8KB的块作为输入和输出缓冲区  
gzip_buffers 16 8k;  
# 设置HTTP协议版本 
gzip_http_version 1.1;  
# 禁用gzip压缩对于Internet Explorer 6  
gzip_disable "MSIE [1-6]\\.";
```

### 指令

#### gzip

`格式：gzip on|off;`默认：`gzip`off

启用或禁用gzip压缩。此指令需要在http、server或location块中设置。

#### gzip_types

`格式：`gzip_types mime-type ...; 默认：gzip_types text/html;

指定需要进行压缩的文件类型。建议设置包括：`text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;`。

#### gzip_comp_level

`格式：`gzip_comp_level level; 默认：gzip_comp_level 1;

设置gzip压缩级别。这个值可以是1（最快的压缩速度，但可能压缩效果不好）到9（最慢的压缩速度，但会得到最好的压缩效果）。

#### gzip_buffers

格式：gzip_buffers number size; 默认：gzip_buffers 32 4k|16 8k;

设置输入和输出缓冲区的大小。默认值是根据系统自动选择。

#### gzip_disable

格式：gzip_disable regex ...;

对于“User-Agent”头字段与任何指定的正则表达式匹配的请求，禁用响应的gzip封装。如：`"MSIE [1-6]\\."`正则表达式匹配了所有Internet Explorer 1到6的版本。

#### gzip_http_version

格式：gzip_http_version 1.0 | 1.1; 默认：gzip_http_version 1.1;

设置HTTP协议的版本。

#### gzip_min_length

格式：gzip_min_length length; 默认：gzip_min_length 20;

设置将被gzip压缩的响应最小长度，大于这个长度才压缩。长度仅根据“Content-length”响应标头字段确定。

#### gzip_proxied

格式：gzip_proxied off | expired | no-cache | no-store | private | no_last_modified | no_etag | auth | any ...; 默认：gzip_proxied off;

根据请求和响应，启用或禁用代理请求的响应的gzip封装。通过被代理请求是否包括“Via”请求头字段的存在来确定。该指令接受多个参数：

- off：禁用所有代理请求的压缩，忽略其他参数；
- expired：如果响应标头包含一个禁用缓存的值“Expires”字段，则启用压缩；
- no-cache：如果响应标头包含带“Cache-Control”参数的“no-cache”字段，则启用压缩；
- no-store：如果响应标头包含带“Cache-Control”参数的“no-store”字段，则启用压缩；
- private：如果响应标头包含带“Cache Control”参数的“private”字段，则启用压缩；
- no_last_modified ：如果响应标头不包括“no_last_modified ”字段，则启用压缩；
- no_etag：如果响应标头不包括“ETag”字段，则启用压缩；
- auth：如果请求标头包含“auth”字段，则启用压缩；
- any：启用对所有代理请求的压缩。

#### gzip_vary

格式：gzip_vary on | off; 默认：gzip_vary off;

如果指令gzip、gzip_static或gunzip处于活动状态，则启用或禁用插入“Vary:Accept Encoding”响应标头字段。

## gunzip压缩

gunzip是用于对不支持gzip编码方法的客户端解压缩具有”Content-Encoding: gzip“的响应。

gunzip由ngx_http_gunzip_module模块实现。

### 指令

#### gunzip

格式：gunzip on | off; 默认：gunzip off;

该指令用于开启或者关闭gunzip功能。开启时，如果客户端浏览器不支持Gzip处理，Nginx服务器将返回解压后的数据；如果客户端浏览器支持Gzip处理，Nginx服务器会忽略该指令的设置，仍然返回压缩数据。

#### gunzip_buffers

格式：gunzip_buffers number size; 默认：gunzip_buffers 32 4k|16 8k;

设置用于解压响应的缓冲区的数量（number）和大小（size）。通常会自动选。

## gzip_static

gzip_static主要是用于预压缩（在内存中）和预解压缩（在内存中）客户端请求中的gzip内容。

gunzip由ngx_http_gzip_static_module模块实现。

该模块就一个指令：

格式：gzip_static on | off | always; 默认： gzip_static off;

用于开启或者关闭gzip_static模块的。当Nginx开启sendfile以后，在读取磁盘上的静态资源文件的时候，可以不经过用户进程直接将静态文件通过网络设备发送出去，但是Gzip要想对资源压缩，是需要经过用户进程进行操作的。gzip_static指令可以解决这个问题，gzip_static允许发送以“.gz”作为文件扩展名的预压缩文件，以替代发送普通文件

## 压缩实战效果

一个实际运行的网站，压缩配置如下：

```java
   gzip  off;
    gzip on;
    gzip_buffers 32 4K;
    gzip_comp_level 6;
    gzip_min_length 100;
   gzip_types application/javascript text/css text/xml;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_disable "MSIE [1-6]\.";配置禁用gzip条件，支持正则。此处表示ie6及以下不启用gzip（因为ie低版本不支持）
    gzip_vary on;
```

### 测试登陆首页刷新

没压缩前，网络访问截图如下：

相关指标：78 requests、3.5 MB transferred、3.5 MB resources、Finish: 18.54 s、DOMContentLoaded: 11.65 s、Load: 18.37 s

按配置开启压缩后，网络访问截图如下：

相关指标：78 requests、**1.1 MB transferred、3.5 MB resources**、Finish: 7.92 s、DOMContentLoaded: 4.53 s、Load: 7.60 s

对比如下：

78requests个请求，3.5MB资源：

**1、** 压缩传输为1.1MB，压缩到3成，平均压缩率几乎达到70%；

**2、** 响应时间（Finish）从18.54s提高到7.92s，除去压缩花的时间，主要在是缩短了返回数据的传输时间，整体提升了6成响应时间包括如下过程：；

**1、** 浏览器发起请求；

**2、** 网络传输；

**3、** nginx接受请求；

**4、** 转发请求到服务器；

**5、** 网络传输；

**6、** 服务器接受请求-处理；

**7、** 服务器返回结果给nginx；

**8、** 网络传输；

**9、****nginx压缩服务器返回结果，并返回给客户端**；

**10、****网络传输**；

**11、** 浏览器接收响应数据；

时间在第9步增加，第10步缩短，但缩短量远大于增加量。

**3、** 浏览器加载时间从18.37s提升到7.60s，有点不理解，按道理解压缩还需要占时间，而其它展示渲染动作不变，时间应该是增加的；

### 多个页面测试

页面一：

压缩前：60 requests、**1.7 MB transferred**、1.7 MB resources、**Finish: 7.97 s、DOMContentLoaded: 7.28 s、Load: 7.91 s**

压缩后：60 requests、**518 kB transferred**、1.7 MB resources、**Finish: 3.86 s、DOMContentLoaded: 2.92 s、Load: 3.75 s**

页面二：

压缩前：65 requests、**1.7 MB transferred**、1.7 MB resources、**Finish: 8.35 s、DOMContentLoaded: 7.08 s、Load: 8.24 s**

压缩后：65 requests、**529 kB transferred**、1.7 MB resources、**Finish: 4.00 s、DOMContentLoaded: 2.74 s、Load: 3.94 s**

页面三：

压缩前：55 requests、**1.8 MB transferred**、1.8 MB resources、**Finish: 15.72 s、DOMContentLoaded: 15.33 s、Load: 15.72 s**

压缩后：55 requests、**553 kB transferred**、1.8 MB resources、**Finish: 2.81 s、DOMContentLoaded: 2.32 s、Load: 2.87 s**

**综合测试来看，压缩能大幅度提升页面响应速度，包括请求响应时间和页面渲染时间**。

这篇文章如果对您有所帮助或者启发的话，帮忙关注或点赞，有问题请评论，必有所复。您的支持是我写作的最大动力！
