# 05、Nginx 基础概念
- 来源：https://ddkk.com/zhuanlan/server/nginx/1/5.html
- 分类：服务器框架
- 分组：教程目录
## Nginx 基础概念

## connection

在Nginx 中 connection 就是对 tcp 连接的封装，其中包括连接的 socket，读事件，写事件。利用 Nginx 封装的 connection，我们可以很方便的使用 Nginx 来处理与连接相关的事情，比如，建立连接，发送与接受数据等。而 Nginx 中的 http 请求的处理就是建立在 connection之上的，所以 Nginx 不仅可以作为一个web服务器，也可以作为邮件服务器。当然，利用 Nginx 提供的 connection，我们可以与任何后端服务打交道。

结合一个 tcp 连接的生命周期，我们看看 Nginx 是如何处理一个连接的。首先，Nginx 在启动时，会解析配置文件，得到需要监听的端口与 ip 地址，然后在 Nginx 的 master 进程里面，先初始化好这个监控的 socket(创建 socket，设置 addrreuse 等选项，绑定到指定的 ip 地址端口，再 listen)，然后再 fork 出多个子进程出来，然后子进程会竞争 accept 新的连接。此时，客户端就可以向 Nginx 发起连接了。当客户端与服务端通过三次握手建立好一个连接后，Nginx 的某一个子进程会 accept 成功，得到这个建立好的连接的 socket，然后创建 Nginx 对连接的封装，即 ngx_connection_t 结构体。接着，设置读写事件处理函数并添加读写事件来与客户端进行数据的交换。最后，Nginx 或客户端来主动关掉连接，到此，一个连接就寿终正寝了。

当然，Nginx 也是可以作为客户端来请求其它 server 的数据的（如 upstream 模块），此时，与其它 server 创建的连接，也封装在 ngx_connection_t 中。作为客户端，Nginx 先获取一个 ngx_connection_t 结构体，然后创建 socket，并设置 socket 的属性（ 比如非阻塞）。然后再通过添加读写事件，调用 connect/read/write 来调用连接，最后关掉连接，并释放 ngx_connection_t。

在Nginx 中，每个进程会有一个连接数的最大上限，这个上限与系统对 fd 的限制不一样。在操作系统中，通过 ulimit -n，我们可以得到一个进程所能够打开的 fd 的最大数，即 nofile，因为每个 socket 连接会占用掉一个 fd，所以这也会限制我们进程的最大连接数，当然也会直接影响到我们程序所能支持的最大并发数，当 fd 用完后，再创建 socket 时，就会失败。Nginx 通过设置 worker_connectons 来设置每个进程支持的最大连接数。如果该值大于 nofile，那么实际的最大连接数是 nofile，Nginx 会有警告。Nginx 在实现时，是通过一个连接池来管理的，每个 worker 进程都有一个独立的连接池，连接池的大小是 worker_connections。这里的连接池里面保存的其实不是真实的连接，它只是一个 worker_connections 大小的一个 ngx_connection_t 结构的数组。并且，Nginx 会通过一个链表 free_connections 来保存所有的空闲 ngx_connection_t，每次获取一个连接时，就从空闲连接链表中获取一个，用完后，再放回空闲连接链表里面。

在这里，很多人会误解 worker_connections 这个参数的意思，认为这个值就是 Nginx 所能建立连接的最大值。其实不然，这个值是表示每个 worker 进程所能建立连接的最大值，所以，一个 Nginx 能建立的最大连接数，应该是worker_connections * worker_processes。当然，这里说的是最大连接数，对于 HTTP 请求本地资源来说，能够支持的最大并发数量是worker_connections * worker_processes，而如果是 HTTP 作为反向代理来说，最大并发数量应该是worker_connections * worker_processes/2。因为作为反向代理服务器，每个并发会建立与客户端的连接和与后端服务的连接，会占用两个连接。

那么，我们前面有说过一个客户端连接过来后，多个空闲的进程，会竞争这个连接，很容易看到，这种竞争会导致不公平，如果某个进程得到 accept 的机会比较多，它的空闲连接很快就用完了，如果不提前做一些控制，当 accept 到一个新的 tcp 连接后，因为无法得到空闲连接，而且无法将此连接转交给其它进程，最终会导致此 tcp 连接得不到处理，就中止掉了。很显然，这是不公平的，有的进程有空余连接，却没有处理机会，有的进程因为没有空余连接，却人为地丢弃连接。那么，如何解决这个问题呢？首先，Nginx 的处理得先打开 accept_mutex 选项，此时，只有获得了 accept_mutex 的进程才会去添加accept事件，也就是说，Nginx会控制进程是否添加 accept 事件。Nginx 使用一个叫 ngx_accept_disabled 的变量来控制是否去竞争 accept_mutex 锁。在第一段代码中，计算 ngx_accept_disabled 的值，这个值是 Nginx 单进程的所有连接总数的八分之一，减去剩下的空闲连接数量，得到的这个 ngx_accept_disabled 有一个规律，当剩余连接数小于总连接数的八分之一时，其值才大于 0，而且剩余的连接数越小，这个值越大。再看第二段代码，当 ngx_accept_disabled 大于 0 时，不会去尝试获取 accept_mutex 锁，并且将 ngx_accept_disabled 减 1，于是，每次执行到此处时，都会去减 1，直到小于 0。不去获取 accept_mutex 锁，就是等于让出获取连接的机会，很显然可以看出，当空余连接越少时，ngx_accept_disable 越大，于是让出的机会就越多，这样其它进程获取锁的机会也就越大。不去 accept，自己的连接就控制下来了，其它进程的连接池就会得到利用，这样，Nginx 就控制了多进程间连接的平衡了。

```java
ngx_accept_disabled = ngx_cycle->connection_n / 8
    - ngx_cycle->free_connection_n;
if (ngx_accept_disabled > 0) {
    ngx_accept_disabled--;
} else {
    if (ngx_trylock_accept_mutex(cycle) == NGX_ERROR) {
        return;
    }
    if (ngx_accept_mutex_held) {
        flags |= NGX_POST_EVENTS;
    } else {
        if (timer == NGX_TIMER_INFINITE
                || timer > ngx_accept_mutex_delay)
        {
            timer = ngx_accept_mutex_delay;
        }
    }
}
```

好了，连接就先介绍到这，本章的目的是介绍基本概念，知道在 Nginx 中连接是个什么东西就行了，而且连接是属于比较高级的用法，在后面的模块开发高级篇会有专门的章节来讲解连接与事件的实现及使用。

## request

这节我们讲 request，在 Nginx 中我们指的是 http 请求，具体到 Nginx 中的数据结构是ngx_http_request_t。ngx_http_request_t 是对一个 http 请求的封装。 我们知道，一个 http 请求，包含请求行、请求头、请求体、响应行、响应头、响应体。

http 请求是典型的请求-响应类型的的网络协议，而 http 是文本协议，所以我们在分析请求行与请求头，以及输出响应行与响应头，往往是一行一行的进行处理。如果我们自己来写一个 http 服务器，通常在一个连接建立好后，客户端会发送请求过来。然后我们读取一行数据，分析出请求行中包含的 method、uri、http_version 信息。然后再一行一行处理请求头，并根据请求 method 与请求头的信息来决定是否有请求体以及请求体的长度，然后再去读取请求体。得到请求后，我们处理请求产生需要输出的数据，然后再生成响应行，响应头以及响应体。在将响应发送给客户端之后，一个完整的请求就处理完了。当然这是最简单的 webserver 的处理方式，其实 Nginx 也是这样做的，只是有一些小小的区别，比如，当请求头读取完成后，就开始进行请求的处理了。Nginx 通过 ngx_http_request_t 来保存解析请求与输出响应相关的数据。

那接下来，简要讲讲 Nginx 是如何处理一个完整的请求的。对于 Nginx 来说，一个请求是从ngx_http_init_request 开始的，在这个函数中，会设置读事件为 ngx_http_process_request_line，也就是说，接下来的网络事件，会由 ngx_http_process_request_line 来执行。从ngx_http_process_request_line 的函数名，我们可以看到，这就是来处理请求行的，正好与之前讲的，处理请求的第一件事就是处理请求行是一致的。通过 ngx_http_read_request_header 来读取请求数据。然后调用 ngx_http_parse_request_line 函数来解析请求行。Nginx 为提高效率，采用状态机来解析请求行，而且在进行 method 的比较时，没有直接使用字符串比较，而是将四个字符转换成一个整型，然后一次比较以减少 cpu 的指令数，这个前面有说过。很多人可能很清楚一个请求行包含请求的方法，uri，版本，却不知道其实在请求行中，也是可以包含有 host 的。比如一个请求 GET [http://www.taobao.com/uri](http://www.taobao.com/uri) HTTP/1.0 这样一个请求行也是合法的，而且 host 是 www.taobao.com，这个时候，Nginx 会忽略请求头中的 host 域，而以请求行中的这个为准来查找虚拟主机。另外，对于对于 http0.9 版来说，是不支持请求头的，所以这里也是要特别的处理。所以，在后面解析请求头时，协议版本都是 1.0 或 1.1。整个请求行解析到的参数，会保存到 ngx_http_request_t 结构当中。

在解析完请求行后，Nginx 会设置读事件的 handler 为 ngx_http_process_request_headers，然后后续的请求就在 ngx_http_process_request_headers 中进行读取与解析。ngx_http_process_request_headers 函数用来读取请求头，跟请求行一样，还是调用 ngx_http_read_request_header 来读取请求头，调用 ngx_http_parse_header_line 来解析一行请求头，解析到的请求头会保存到 ngx_http_request_t 的域 headers_in 中，headers_in 是一个链表结构，保存所有的请求头。而 HTTP 中有些请求是需要特别处理的，这些请求头与请求处理函数存放在一个映射表里面，即 ngx_http_headers_in，在初始化时，会生成一个 hash 表，当每解析到一个请求头后，就会先在这个 hash 表中查找，如果有找到，则调用相应的处理函数来处理这个请求头。比如:Host 头的处理函数是 ngx_http_process_host。

当Nginx 解析到两个回车换行符时，就表示请求头的结束，此时就会调用 ngx_http_process_request 来处理请求了。ngx_http_process_request 会设置当前的连接的读写事件处理函数为 ngx_http_request_handler，然后再调用 ngx_http_handler 来真正开始处理一个完整的http请求。这里可能比较奇怪，读写事件处理函数都是ngx_http_request_handler，其实在这个函数中，会根据当前事件是读事件还是写事件，分别调用 ngx_http_request_t 中的 read_event_handler 或者是 write_event_handler。由于此时，我们的请求头已经读取完成了，之前有说过，Nginx 的做法是先不读取请求 body，所以这里面我们设置 read_event_handler 为 ngx_http_block_reading，即不读取数据了。刚才说到，真正开始处理数据，是在 ngx_http_handler 这个函数里面，这个函数会设置 write_event_handler 为 ngx_http_core_run_phases，并执行 ngx_http_core_run_phases 函数。ngx_http_core_run_phases 这个函数将执行多阶段请求处理，Nginx 将一个 http 请求的处理分为多个阶段，那么这个函数就是执行这些阶段来产生数据。因为 ngx_http_core_run_phases 最后会产生数据，所以我们就很容易理解，为什么设置写事件的处理函数为 ngx_http_core_run_phases 了。在这里，我简要说明了一下函数的调用逻辑，我们需要明白最终是调用 ngx_http_core_run_phases 来处理请求，产生的响应头会放在 ngx_http_request_t 的 headers_out 中，这一部分内容，我会放在请求处理流程里面去讲。Nginx 的各种阶段会对请求进行处理，最后会调用 filter 来过滤数据，对数据进行加工，如 truncked 传输、gzip 压缩等。这里的 filter 包括 header filter 与 body filter，即对响应头或响应体进行处理。filter 是一个链表结构，分别有 header filter 与 body filter，先执行 header filter 中的所有 filter，然后再执行 body filter 中的所有 filter。在 header filter 中的最后一个 filter，即 ngx_http_header_filter，这个 filter 将会遍历所有的响应头，最后需要输出的响应头在一个连续的内存，然后调用 ngx_http_write_filter 进行输出。ngx_http_write_filter 是 body filter 中的最后一个，所以 Nginx 首先的 body 信息，在经过一系列的 body filter 之后，最后也会调用 ngx_http_write_filter 来进行输出(有图来说明)。

这里要注意的是，Nginx 会将整个请求头都放在一个 buffer 里面，这个 buffer 的大小通过配置项 client_header_buffer_size 来设置，如果用户的请求头太大，这个 buffer 装不下，那 Nginx 就会重新分配一个新的更大的 buffer 来装请求头，这个大 buffer 可以通过 large_client_header_buffers 来设置，这个 large_buffer 这一组 buffer，比如配置 48k，就是表示有四个 8k 大小的 buffer 可以用。注意，为了保存请求行或请求头的完整性，一个完整的请求行或请求头，需要放在一个连续的内存里面，所以，一个完整的请求行或请求头，只会保存在一个 buffer 里面。这样，如果请求行大于一个 buffer 的大小，就会返回 414 错误，如果一个请求头大小大于一个 buffer 大小，就会返回 400 错误。在了解了这些参数的值，以及 Nginx 实际的做法之后，在应用场景，我们就需要根据实际的需求来调整这些参数，来优化我们的程序了。

处理流程图：

以上这些，就是 Nginx 中一个 http 请求的生命周期了。我们再看看与请求相关的一些概念吧。

## keepalive

当然，在 Nginx 中，对于 http1.0 与 http1.1 也是支持长连接的。什么是长连接呢？我们知道，http 请求是基于 TCP 协议之上的，那么，当客户端在发起请求前，需要先与服务端建立 TCP 连接，而每一次的 TCP 连接是需要三次握手来确定的，如果客户端与服务端之间网络差一点，这三次交互消费的时间会比较多，而且三次交互也会带来网络流量。当然，当连接断开后，也会有四次的交互，当然对用户体验来说就不重要了。而 http 请求是请求应答式的，如果我们能知道每个请求头与响应体的长度，那么我们是可以在一个连接上面执行多个请求的，这就是所谓的长连接，但前提条件是我们先得确定请求头与响应体的长度。对于请求来说，如果当前请求需要有body，如 POST 请求，那么 Nginx 就需要客户端在请求头中指定 content-length 来表明 body 的大小，否则返回 400 错误。也就是说，请求体的长度是确定的，那么响应体的长度呢？先来看看 http 协议中关于响应 body 长度的确定：

**1、** 对于http1.0协议来说，如果响应头中有content-length头，则以content-length的长度就可以知道body的长度了，客户端在接收body时，就可以依照这个长度来接收数据，接收完后，就表示这个请求完成了而如果没有content-length头，则客户端会一直接收数据，直到服务端主动断开连接，才表示body接收完了；

**2、** 而对于http1.1协议来说，如果响应头中的Transfer-encoding为chunked传输，则表示body是流式输出，body会被分成多个块，每块的开始会标识出当前块的长度，此时，body不需要通过长度来指定如果是非chunked传输，而且有content-length，则按照content-length来接收数据否则，如果是非chunked，并且没有content-length，则客户端接收数据，直到服务端主动断开连接；

从上面，我们可以看到，除了 http1.0 不带 content-length 以及 http1.1 非 chunked 不带 content-length 外，body 的长度是可知的。此时，当服务端在输出完 body 之后，会可以考虑使用长连接。能否使用长连接，也是有条件限制的。如果客户端的请求头中的 connection为close，则表示客户端需要关掉长连接，如果为 keep-alive，则客户端需要打开长连接，如果客户端的请求中没有 connection 这个头，那么根据协议，如果是 http1.0，则默认为 close，如果是 http1.1，则默认为 keep-alive。如果结果为 keepalive，那么，Nginx 在输出完响应体后，会设置当前连接的 keepalive 属性，然后等待客户端下一次请求。当然，Nginx 不可能一直等待下去，如果客户端一直不发数据过来，岂不是一直占用这个连接？所以当 Nginx 设置了 keepalive 等待下一次的请求时，同时也会设置一个最大等待时间，这个时间是通过选项 keepalive_timeout 来配置的，如果配置为 0，则表示关掉 keepalive，此时，http 版本无论是 1.1 还是 1.0，客户端的 connection 不管是 close 还是 keepalive，都会强制为 close。

如果服务端最后的决定是 keepalive 打开，那么在响应的 http 头里面，也会包含有 connection 头域，其值是”Keep-Alive”，否则就是”Close”。如果 connection 值为 close，那么在 Nginx 响应完数据后，会主动关掉连接。所以，对于请求量比较大的 Nginx 来说，关掉 keepalive 最后会产生比较多的 time-wait 状态的 socket。一般来说，当客户端的一次访问，需要多次访问同一个 server 时，打开 keepalive 的优势非常大，比如图片服务器，通常一个网页会包含很多个图片。打开 keepalive 也会大量减少 time-wait 的数量。

## pipe

在http1.1 中，引入了一种新的特性，即 pipeline。那么什么是 pipeline 呢？pipeline 其实就是流水线作业，它可以看作为 keepalive 的一种升华，因为 pipeline 也是基于长连接的，目的就是利用一个连接做多次请求。如果客户端要提交多个请求，对于keepalive来说，那么第二个请求，必须要等到第一个请求的响应接收完全后，才能发起，这和 TCP 的停止等待协议是一样的，得到两个响应的时间至少为2*RTT。而对 pipeline 来说，客户端不必等到第一个请求处理完后，就可以马上发起第二个请求。得到两个响应的时间可能能够达到1*RTT。Nginx 是直接支持 pipeline 的，但是，Nginx 对 pipeline 中的多个请求的处理却不是并行的，依然是一个请求接一个请求的处理，只是在处理第一个请求的时候，客户端就可以发起第二个请求。这样，Nginx 利用 pipeline 减少了处理完一个请求后，等待第二个请求的请求头数据的时间。其实 Nginx 的做法很简单，前面说到，Nginx 在读取数据时，会将读取的数据放到一个 buffer 里面，所以，如果 Nginx 在处理完前一个请求后，如果发现 buffer 里面还有数据，就认为剩下的数据是下一个请求的开始，然后就接下来处理下一个请求，否则就设置 keepalive。

## lingering_close

lingering_close，字面意思就是延迟关闭，也就是说，当 Nginx 要关闭连接时，并非立即关闭连接，而是先关闭 tcp 连接的写，再等待一段时间后再关掉连接的读。为什么要这样呢？我们先来看看这样一个场景。Nginx 在接收客户端的请求时，可能由于客户端或服务端出错了，要立即响应错误信息给客户端，而 Nginx 在响应错误信息后，大分部情况下是需要关闭当前连接。Nginx 执行完 write()系统调用把错误信息发送给客户端，write()系统调用返回成功并不表示数据已经发送到客户端，有可能还在 tcp 连接的 write buffer 里。接着如果直接执行 close()系统调用关闭 tcp 连接，内核会首先检查 tcp 的 read buffer 里有没有客户端发送过来的数据留在内核态没有被用户态进程读取，如果有则发送给客户端 RST 报文来关闭 tcp 连接丢弃 write buffer 里的数据，如果没有则等待 write buffer 里的数据发送完毕，然后再经过正常的 4 次分手报文断开连接。所以,当在某些场景下出现 tcp write buffer 里的数据在 write()系统调用之后到 close()系统调用执行之前没有发送完毕，且 tcp read buffer 里面还有数据没有读，close()系统调用会导致客户端收到 RST 报文且不会拿到服务端发送过来的错误信息数据。那客户端肯定会想，这服务器好霸道，动不动就 reset 我的连接，连个错误信息都没有。

在上面这个场景中，我们可以看到，关键点是服务端给客户端发送了 RST 包，导致自己发送的数据在客户端忽略掉了。所以，解决问题的重点是，让服务端别发 RST 包。再想想，我们发送 RST 是因为我们关掉了连接，关掉连接是因为我们不想再处理此连接了，也不会有任何数据产生了。对于全双工的 TCP 连接来说，我们只需要关掉写就行了，读可以继续进行，我们只需要丢掉读到的任何数据就行了，这样的话，当我们关掉连接后，客户端再发过来的数据，就不会再收到 RST 了。当然最终我们还是需要关掉这个读端的，所以我们会设置一个超时时间，在这个时间过后，就关掉读，客户端再发送数据来就不管了，作为服务端我会认为，都这么长时间了，发给你的错误信息也应该读到了，再慢就不关我事了，要怪就怪你 RP 不好了。当然，正常的客户端，在读取到数据后，会关掉连接，此时服务端就会在超时时间内关掉读端。这些正是 lingering_close 所做的事情。协议栈提供 SO_LINGER 这个选项，它的一种配置情况就是来处理 lingering_close 的情况的，不过 Nginx 是自己实现的 lingering_close。lingering_close 存在的意义就是来读取剩下的客户端发来的数据，所以 Nginx 会有一个读超时时间，通过 lingering_timeout 选项来设置，如果在 lingering_timeout 时间内还没有收到数据，则直接关掉连接。Nginx 还支持设置一个总的读取时间，通过 lingering_time 来设置，这个时间也就是 Nginx 在关闭写之后，保留 socket 的时间，客户端需要在这个时间内发送完所有的数据，否则 Nginx 在这个时间过后，会直接关掉连接。当然，Nginx 是支持配置是否打开 lingering_close 选项的，通过 lingering_close 选项来配置。

那么，我们在实际应用中，是否应该打开 lingering_close 呢？这个就没有固定的推荐值了，如 Maxim Dounin所说，lingering_close 的主要作用是保持更好的客户端兼容性，但是却需要消耗更多的额外资源（比如连接会一直占着）。

这节，我们介绍了 Nginx 中，连接与请求的基本概念，下节，我们讲基本的数据结构。
