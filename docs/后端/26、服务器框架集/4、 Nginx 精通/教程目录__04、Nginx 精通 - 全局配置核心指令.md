# 04、Nginx 精通 - 全局配置核心指令
- 来源：https://ddkk.com/zhuanlan/server/nginx/4/4.html
- 分类：服务器框架
- 分组：教程目录
核心指令主要在nginx.conf的主上下文和event上下文中使用。

**目录**

user

pid

worker_processes

worker_rlimit_nofile

error_log

events

thread_pool

include

load_module

ssl_engine

env

lock_file

pcre_jit

working_directory

worker_priority

worker_rlimit_core

timer_resolution

worker_shutdown_timeout

## user

格式：user user [group]; 默认是： user nobody nobody;

代表nginx运行身份：用户和所属组

## pid

格式：pid file;默认: logs/nginx.pid;

nginx运行时的pid文件。

## worker_processes

格式：worker_processes number | auto;默认worker_processes 1；

NGINX运行worker数量，一般设置为可用的vCPU(内核数)，auto为自动检测。默认值1

worker_processes auto;

## worker_rlimit_nofile

格式：worker_rlimit_nofile number; worker进程打开最大文件数，受限于系统上可用的文件描述符的数量，不设置即为系统的nofile数量

worker_rlimit_nofile 65536;

## error_log

格式：error_log file [level]; 默认error_log logs/error.log error;

错误日志，level有：debug, info, notice, warn, error, crit, alert, emerg

## events

#连接配置: events模块中包含nginx中所有处理连接的设置

events {

#**worker_connections** number;默认512；worker进程可同时打开的最大连接数。

#注意：这个值包括所有连接（例如，与代理服务器的连接等），而不仅仅是与客户端的连接。

#需满足worker_rlimit_nofile>= worker_connections*worker_process

worker_connections 16384;

#**multi_accept** on|off; 默认off; 如果打开，工作进程将一次接受所有新连接。否则，工作进程将一次接受一个新连接。

multi_accept on;

#**accept_mutex_delay** time;默认500ms；启用accept_tmutex情况下，如果一个工作进程当前正在接受新连接，则工作进程将尝试重新启动接受新连接的最长时间。

accept_mutex_delay 1000ms;

#**worker_aio_requests** number;默认32；将aio与epoll连接处理方法一起使用时，为单个工作进程设置未完成的异步I/O操作的最大数量

#**use** select | poll | epoll | kqueue | /dev/poll | eventport;指定要连接时处理方法。通常不需要显式指定，因为nginx默认使用最有效的方法。

#debug_connection address | CIDR | unix:;为选定的客户端连接启用调试日志。其他连接将使用error_log指令设置的日志记录级别。示例如下：

```java
events {
    debug_connection 127.0.0.1;
    debug_connection localhost;
    debug_connection 192.1.2.0/24;
    debug_connection ::1;
    debug_connection 2001:0db8::/32;
    debug_connection unix:;
    ...
}
```

}

## thread_pool

格式：thread_pool name threads=number [max_queue=number];

默认thread_pool default threads=32 max_queue=65536;

定义线程池的名称和参数，用于多线程非阻塞式读取和发送文件。

threads：定义池中的线程数。

max_queue： 如果池中的所有线程都很忙，则会有一个新任务在队列中等待。该参数限制允许在队列中等待的任务数。默认情况下，队列中最多可以等待65536个任务。当队列溢出时，任务完成时会出现错误。

## include

格式：include file | mask;

将另一个文件或与指定掩码匹配的文件包含到配置中。包含的文件应该包含语法正确的指令和块。该指令可在任意位置使用

include vhosts/*.conf;

## load_module

格式：load_module file;

加载第三方的动态模块（非内置模块），针对自己创建的动态模块或其他第三方模块需要在运行时动态加载到NGINX中

## ssl_engine

格式：ssl_engine device; 由于ssl非常影响CPU性能，如果有SSL加速器硬件，指定硬件设备名称。

## env

格式：env variable[=value];默认env TZ;

正常情况下，nginx会删除从其父进程继承的所有环境变量，env配置变量除外。此指令允许保留一些继承的变量、更改它们的值或创建新的环境变量。如：

env MALLOC_OPTIONS; #继承变量

env PERL5LIB=/data/site/modules; #设置变量

## lock_file

格式：lock_file file;默认: lock_file logs/nginx.lock;

nginx使用锁机制来实现accept_tmutex并串行化对共享内存的访问。在大多数系统上，锁是使用原子操作来实现的，可忽略此指令

## pcre_jit

格式：pcre_jit on | off;默认:pcre_jit off;

启用或禁用对配置解析时（nginx启动阶段）对已知的正则表达式使用“实时编译”（PCRE JIT）。PCRE JIT可以显著加快正则表达式的处理速度。

## working_directory

格式：working_directory directory;

定义工作进程的当前工作目录。它主要用于写入核心文件，在这种情况下，工作进程应该具有对指定目录的写入权限。不配置则为安装目录。

## worker_priority

格式：worker_priority number;默认worker_priority 0;

义工作进程的调度优先级，就像nice命令所做的那样：负数表示优先级更高。允许的范围通常在-20到20之间。

## worker_rlimit_core

格式：worker_rlimit_core size;

更改工作进程的核心文件（RLIMIT_core）的最大大小限制。通常用于在不重新启动主进程的情况下增加限制。

## timer_resolution

格式：timer_resolution interval;

降低工作进程中的计时器解析率，从而减少gettimeofday()系统调用的次数。默认情况下，每次收到内核事件时都会调用gettimeofday()。通过降低解析率，gettimeofday()在每个指定间隔内只调用一次。

timer_resolution 100ms;

## worker_shutdown_timeout

格式：worker_shutdown_timeout time;为正常关闭工作进程配置超时。当时间到期时，nginx会尝试关闭当前打开的所有连接，以便于关闭。
