# 1、Memcached 教程
- 来源：https://ddkk.com/zhuanlan/db/memcached/1.html
- 分类：缓存数据库
- 分组：教程目录
Memcached是一个自由开源的，高性能，分布式内存键值对缓存系统

Memcached 是一种基于内存的key-value存储，用来存储小块的任意数据（字符串、对象），这些数据可以是数据库调用、API调用或者是页面渲染的结果

Memcached 的简洁设计便于快速开发，减轻开发难度，解决了大数据量缓存的很多问题

它的API 通俗易懂，非常容易开发，且兼容大部分流行的开发语言。

简单的说： Memcached 是一个简洁的key-value内存缓存存储系统

### 使用 Memcached 后的架构图

有了Memcached ，我们就可以通过缓存数据库查询结果，减少数据库访问次数，以提高动态Web应用的速度、提高可扩展性

![Memcached 缓存构架] (/static/i/memcached_goujia.jpg)

### Memcached 官网

[http://memcached.org/](http://memcached.org/)

## Memcached 特征

Memcached作为高速运行的分布式缓存服务器，具有以下的特点

- 协议简单，使用文本协议，使用换行符作为命令结束
- 基于 libevent 的事件处理
- 内置内存存储方式
- Memcached 使用客户端哈希的不互相通信的分布式
