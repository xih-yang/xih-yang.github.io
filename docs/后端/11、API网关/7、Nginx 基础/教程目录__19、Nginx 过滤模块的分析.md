# 19、Nginx 过滤模块的分析
- 来源：https://ddkk.com/zhuanlan/server/nginx/1/19.html
- 分类：服务器框架
- 分组：教程目录
## 过滤模块的分析

## 相关结构体

ngx_chain_t 结构非常简单，是一个单向链表：

```java
typedef struct ngx_chain_s ngx_chain_t;
struct ngx_chain_s {
    ngx_buf_t    *buf;
    ngx_chain_t  *next;
};
```

在过滤模块中，所有输出的内容都是通过一条单向链表所组成。这种单向链表的设计，正好应和了 Nginx 流式的输出模式。每次 Nginx 都是读到一部分的内容，就放到链表，然后输出出去。这种设计的好处是简单，非阻塞，但是相应的问题就是跨链表的内容操作非常麻烦，如果需要跨链表，很多时候都只能缓存链表的内容。

单链表负载的就是 ngx_buf_t，这个结构体使用非常广泛，先让我们看下该结构体的代码：

```java
struct ngx_buf_s {
    u_char          *pos;       /* 当前buffer真实内容的起始位置 */
    u_char          *last;      /* 当前buffer真实内容的结束位置 */
    off_t            file_pos;  /* 在文件中真实内容的起始位置   */
    off_t            file_last; /* 在文件中真实内容的结束位置   */
    u_char          *start;    /* buffer内存的开始分配的位置 */
    u_char          *end;      /* buffer内存的结束分配的位置 */
    ngx_buf_tag_t    tag;      /* buffer属于哪个模块的标志 */
    ngx_file_t      *file;     /* buffer所引用的文件 */
    /* 用来引用替换过后的buffer，以便当所有buffer输出以后，
     * 这个影子buffer可以被释放。
     */
    ngx_buf_t       *shadow; 
    /* the buf's content could be changed */
    unsigned         temporary:1;
    /*
     * the buf's content is in a memory cache or in a read only memory
     * and must not be changed
     */
    unsigned         memory:1;
    /* the buf's content is mmap()ed and must not be changed */
    unsigned         mmap:1;
    unsigned         recycled:1; /* 内存可以被输出并回收 */
    unsigned         in_file:1;  /* buffer的内容在文件中 */
    /* 马上全部输出buffer的内容, gzip模块里面用得比较多 */
    unsigned         flush:1;
    /* 基本上是一段输出链的最后一个buffer带的标志，标示可以输出，
     * 有些零长度的buffer也可以置该标志
     */
    unsigned         sync:1;
    /* 所有请求里面最后一块buffer，包含子请求 */
    unsigned         last_buf:1;
    /* 当前请求输出链的最后一块buffer         */
    unsigned         last_in_chain:1;
    /* shadow链里面的最后buffer，可以释放buffer了 */
    unsigned         last_shadow:1;
    /* 是否是暂存文件 */
    unsigned         temp_file:1;
    /* 统计用，表示使用次数 */
    /* STUB */ int   num;
};
```

一般buffer 结构体可以表示一块内存，内存的起始和结束地址分别用 start 和 end 表示，pos 和 last 表示实际的内容。如果内容已经处理过了，pos 的位置就可以往后移动。如果读取到新的内容，last 的位置就会往后移动。所以 buffer 可以在多次调用过程中使用。如果 last 等于 end，就说明这块内存已经用完了。如果 pos 等于 last，说明内存已经处理完了。下面是一个简单的示意图，说明 buffer 中指针的用法：

## 响应头过滤函数

响应头过滤函数主要的用处就是处理 HTTP 响应的头，可以根据实际情况对于响应头进行修改或者添加删除。响应头过滤函数先于响应体过滤函数，而且只调用一次，所以一般可作过滤模块的初始化工作。

响应头过滤函数的入口只有一个：

```java
ngx_int_t
ngx_http_send_header(ngx_http_request_t *r)
{
    ...
    return ngx_http_top_header_filter(r);
}
```

该函数向客户端发送回复的时候调用，然后按前一节所述的执行顺序。该函数的返回值一般是 NGX_OK，NGX_ERROR 和 NGX_AGAIN，分别表示处理成功，失败和未完成。

你可以把 HTTP 响应头的存储方式想象成一个 hash 表，在 Nginx 内部可以很方便地查找和修改各个响应头部，ngx_http_header_filter_module 过滤模块把所有的 HTTP 头组合成一个完整的 buffer，最终 ngx_http_write_filter_module 过滤模块把 buffer 输出。

按照前一节过滤模块的顺序，依次讲解如下：

filter module
description

ngx_http_not_modified_filter_module
默认打开，如果请求的 if-modified-since 等于回复的 last-modified 间值，说明回复没有变化，清空所有回复的内容，返回 304。

ngx_http_range_body_filter_module
默认打开，只是响应体过滤函数，支持 range 功能，如果请求包含range请求，那就只发送range请求的一段内容。

ngx_http_copy_filter_module
始终打开，只是响应体过滤函数， 主要工作是把文件中内容读到内存中，以便进行处理。

ngx_http_headers_filter_module
始终打开，可以设置 expire 和 Cache-control 头，可以添加任意名称的头

ngx_http_userid_filter_module
默认关闭，可以添加统计用的识别用户的 cookie。

ngx_http_charset_filter_module
默认关闭，可以添加 charset，也可以将内容从一种字符集转换到另外一种字符集，不支持多字节字符集。

ngx_http_ssi_filter_module
默认关闭，过滤 SSI 请求，可以发起子请求，去获取include进来的文件

ngx_http_postpone_filter_module
始终打开，用来将子请求和主请求的输出链合并

ngx_http_gzip_filter_module
默认关闭，支持流式的压缩内容

ngx_http_range_header_filter_module
默认打开，只是响应头过滤函数，用来解析range头，并产生range响应的头。

ngx_http_chunked_filter_module
默认打开，对于 HTTP/1.1 和缺少 content-length 的回复自动打开。

ngx_http_header_filter_module
始终打开，用来将所有 header 组成一个完整的 HTTP 头。

ngx_http_write_filter_module
始终打开，将输出链拷贝到 r->out中，然后输出内容。

## 响应体过滤函数

响应体过滤函数是过滤响应主体的函数。ngx_http_top_body_filter 这个函数每个请求可能会被执行多次，它的入口函数是 ngx_http_output_filter，比如：

```java
ngx_int_t
ngx_http_output_filter(ngx_http_request_t *r, ngx_chain_t *in)
{
    ngx_int_t          rc;
    ngx_connection_t  *c;
    c = r->connection;
    rc = ngx_http_top_body_filter(r, in);
    if (rc == NGX_ERROR) {
        /* NGX_ERROR may be returned by any filter */
        c->error = 1;
    }
    return rc;
}
```

ngx_http_output_filter 可以被一般的静态处理模块调用，也有可能是在 upstream 模块里面被调用，对于整个请求的处理阶段来说，他们处于的用处都是一样的，就是把响应内容过滤，然后发给客户端。

具体模块的响应体过滤函数的格式类似这样：

```java
static int 
ngx_http_example_body_filter(ngx_http_request_t *r, ngx_chain_t *in)
{
    ...
    return ngx_http_next_body_filter(r, in);
}
```

该函数的返回值一般是 NGX_OK，NGX_ERROR 和 NGX_AGAIN，分别表示处理成功，失败和未完成。

## 主要功能介绍

响应的主体内容就存于单链表 in，链表一般不会太长，有时 in 参数可能为 NULL。in中存有buf结构体中，对于静态文件，这个buf大小默认是 32K；对于反向代理的应用，这个buf可能是4k或者8k。为了保持内存的低消耗，Nginx一般不会分配过大的内存，处理的原则是收到一定的数据，就发送出去。一个简单的例子，可以看看Nginx的chunked_filter模块，在没有 content-length 的情况下，chunk 模块可以流式（stream）的加上长度，方便浏览器接收和显示内容。

在响应体过滤模块中，尤其要注意的是 buf 的标志位，完整描述可以在“相关结构体”这个节中看到。如果 buf 中包含 last 标志，说明是最后一块 buf，可以直接输出并结束请求了。如果有 flush 标志，说明这块 buf 需要马上输出，不能缓存。如果整块 buffer 经过处理完以后，没有数据了，你可以把 buffer 的 sync 标志置上，表示只是同步的用处。

当所有的过滤模块都处理完毕时，在最后的 write_fitler 模块中，Nginx 会将 in 输出链拷贝到 r->out 输出链的末尾，然后调用 sendfile 或者 writev 接口输出。由于 Nginx 是非阻塞的 socket 接口，写操作并不一定会成功，可能会有部分数据还残存在 r->out。在下次的调用中，Nginx 会继续尝试发送，直至成功。

## 发出子请求

Nginx 过滤模块一大特色就是可以发出子请求，也就是在过滤响应内容的时候，你可以发送新的请求，Nginx 会根据你调用的先后顺序，将多个回复的内容拼接成正常的响应主体。一个简单的例子可以参考 addition 模块。

Nginx 是如何保证父请求和子请求的顺序呢？当 Nginx 发出子请求时，就会调用 ngx_http_subrequest 函数，将子请求插入父请求的 r->postponed 链表中。子请求会在主请求执行完毕时获得依次调用。子请求同样会有一个请求所有的生存期和处理过程，也会进入过滤模块流程。

关键点是在 postpone_filter 模块中，它会拼接主请求和子请求的响应内容。r->postponed 按次序保存有父请求和子请求，它是一个链表，如果前面一个请求未完成，那后一个请求内容就不会输出。当前一个请求完成时并输出时，后一个请求才可输出，当所有的子请求都完成时，所有的响应内容也就输出完毕了。

## 一些优化措施

Nginx 过滤模块涉及到的结构体，主要就是 chain 和 buf，非常简单。在日常的过滤模块中，这两类结构使用非常频繁，Nginx采用类似 freelist 重复利用的原则，将使用完毕的 chain 或者 buf 结构体，放置到一个固定的空闲链表里，以待下次使用。

比如，在通用内存池结构体中，pool->chain 变量里面就保存着释放的 chain。而一般的 buf 结构体，没有模块间公用的空闲链表池，都是保存在各模块的缓存空闲链表池里面。对于 buf 结构体，还有一种 busy 链表，表示该链表中的 buf 都处于输出状态，如果 buf 输出完毕，这些 buf 就可以释放并重复利用了。

功能
函数名

chain 分配
ngx_alloc_chain_link

chain 释放
ngx_free_chain

buf 分配
ngx_chain_get_free_buf

buf 释放
ngx_chain_update_chains

## 过滤内容的缓存

由于Nginx 设计流式的输出结构，当我们需要对响应内容作全文过滤的时候，必须缓存部分的 buf 内容。该类过滤模块往往比较复杂，比如 sub，ssi，gzip 等模块。这类模块的设计非常灵活，我简单讲一下设计原则：

**1、** 输入链in需要拷贝操作，经过缓存的过滤模块，输入输出链往往已经完全不一样了，所以需要拷贝，通过ngx_chain_add_copy函数完成；

**2、** 一般有自己的free和busy缓存链表池，可以提高buf分配效率；

**3、** 如果需要分配大块内容，一般分配固定大小的内存卡，并设置recycled标志，表示可以重复利用；

**4、** 原有的输入buf被替换缓存时，必须将其buf->pos设为buf->last，表明原有的buf已经被输出完毕或者在新建立的buf，将buf->shadow指向旧的buf，以便输出完毕时及时释放旧的buf；
