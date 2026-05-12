# 27、Docker 实战：Docker 安装 Redis
- 来源：https://ddkk.com/zhuanlan/container/docker/2/27.html
- 分类：容器服务
- 分组：教程目录
Redis 是当下最流行的 NoSQL key-value 缓存数据库之一，Docker 安装 Redis 的方式有两种

如果你是 Docker 初学者，如果你以后长期使用 Redis ，我们建议你两种方法都试一试，为什么呢？

原因很简单，第一种方法，简单快捷，第二种方法，就是尝试自己编译安装

## 1. docker pull redis

如果想以最简单的方式安装 Redis, 可以直接使用 docker pull redis 命令

流程如下

**1、** 查找DockerHub上的redis镜像；

```sh
[root@ddkk.com ~]# docker search redis
NAME    ...    OFFICIAL  ...
redis   ...    [OK]      ...
```

```sh
列表很多，我们推荐你使用 OFFICIAL = OK 的那条
```

**2、** 拉取官方最新的Redis镜像；

```sh
[root@ddkk.com ~]# docker pull redis
Using default tag: latest
...
```

**3、** 稍等片刻，下载完成后就可以在本地镜像列表里看到redis的镜像了；

```sh
[root@ddkk.com apache]# docker images redis
REPOSITORY  TAG     IMAGE ID      CREATED      SIZE
redis       latest  bfcb1f6df2db  3 weeks ago  106.7 MB
```

## 2. 通过 Dockerfile 文件构建

这种方式复杂一些，但因为是编写脚本，所以我们知道如何去编译安装 Redis

**1、** 创建目录redis,用于存放后面的相关东西；

```sh
[root@ddkk.com ~]# mkdir -p ~/redis/data
```

```sh
<table> 
 <thead> 
  <tr> 
   <th align="left">目录</th> 
   <th align="left">说明</th> 
  </tr> 
 </thead> 
 <tbody> 
  <tr> 
   <td align="left">redis</td> 
   <td align="left">该目录存放 Dockerfile 文件和 db 数据库目录</td> 
  </tr> 
  <tr> 
   <td align="left">data</td> 
   <td align="left">该将映射为 redis 容器配置的 /data 目录,作为 redi s数据持久化的存储目录</td> 
  </tr> 
 </tbody> 
</table>
```

**2、** 进入创建的redis目录，创建文件docker-entrypoint.sh；

```sh
[root@ddkk.com ~]# cd redis
[root@ddkk.com redis] touch docker-entrypoint.sh
[root@ddkk.com redis] chmod +x docker-entrypoint.sh
[root@ddkk.com redis] vi docker-entrypoint.sh
```

```sh
复制粘贴以下内容：
```

```sh
# !/bin/sh
# 注意上一行去掉 # ! 之间的空格
set -e
# first arg is -f or --some-option
# or first arg is something.conf
if [ "${1#-}" != "$1" ] || [ "${1%.conf}" != "$1" ]; then
    set -- redis-server "$@"
fi
# allow the container to be started with --user
if [ "$1" = 'redis-server' -a "$(id -u)" = '0' ]; then
    chown -R redis .
    exec gosu redis "$0" "$@"
fi
exec "$@"
```

**3、** 创建文件Dockerfile；

```sh
[root@ddkk.com redis] vi Dockerfile
```

```sh
然后复制粘贴以下内容
```

```sh
FROM debian:jessie-slim
# 添加组和用户
RUN groupadd -r redis && useradd -r -g redis redis
# grab gosu for easy step-down from root
# https://github.com/tianon/gosu/releases
ENV GOSU_VERSION 1.10
RUN set -ex; \
    \
    fetchDeps='ca-certificates wget'; \
    apt-get update; \
    apt-get install -y --no-install-recommends $fetchDeps; \
    rm -rf /var/lib/apt/lists/*; \
    \
    dpkgArch="$(dpkg --print-architecture | awk -F- '{ print $NF }')"; \
    wget -O /usr/local/bin/gosu "https://github.com/tianon/gosu/releases/download/$GOSU_VERSION/gosu-$dpkgArch"; \
    wget -O /usr/local/bin/gosu.asc "https://github.com/tianon/gosu/releases/download/$GOSU_VERSION/gosu-$dpkgArch.asc"; \
    export GNUPGHOME="$(mktemp -d)"; \
    gpg --keyserver ha.pool.sks-keyservers.net --recv-keys B42F6819007F00F88E364FD4036A9C25BF357DD4; \
    gpg --batch --verify /usr/local/bin/gosu.asc /usr/local/bin/gosu; \
    rm -r "$GNUPGHOME" /usr/local/bin/gosu.asc; \
    chmod +x /usr/local/bin/gosu; \
    gosu nobody true; \
    \
    apt-get purge -y --auto-remove $fetchDeps
ENV REDIS_VERSION 3.2.11
ENV REDIS_DOWNLOAD_URL http://download.redis.io/releases/redis-3.2.11.tar.gz
ENV REDIS_DOWNLOAD_SHA 31ae927cab09f90c9ca5954aab7aeecc3bb4da6087d3d12ba0a929ceb54081b5
# for redis-sentinel see: http://redis.io/topics/sentinel
RUN set -ex; \
    \
    buildDeps=' \
        wget \
        \
        gcc \
        libc6-dev \
        make \
    '; \
    apt-get update; \
    apt-get install -y $buildDeps --no-install-recommends; \
    rm -rf /var/lib/apt/lists/*; \
    \
    wget -O redis.tar.gz "$REDIS_DOWNLOAD_URL"; \
    echo "$REDIS_DOWNLOAD_SHA *redis.tar.gz" | sha256sum -c -; \
    mkdir -p /usr/src/redis; \
    tar -xzf redis.tar.gz -C /usr/src/redis --strip-components=1; \
    rm redis.tar.gz; \
    \
# disable Redis protected mode [1] as it is unnecessary in context of Docker
# (ports are not automatically exposed when running inside Docker, but rather explicitly by specifying -p / -P)
# [1]: https://github.com/antirez/redis/commit/edd4d555df57dc84265fdfb4ef59a4678832f6da
    grep -q '^#define CONFIG_DEFAULT_PROTECTED_MODE 1$' /usr/src/redis/src/server.h; \
    sed -ri 's!^(#define CONFIG_DEFAULT_PROTECTED_MODE) 1$!\1 0!' /usr/src/redis/src/server.h; \
    grep -q '^#define CONFIG_DEFAULT_PROTECTED_MODE 0$' /usr/src/redis/src/server.h; \
# for future reference, we modify this directly in the source instead of just supplying a default configuration flag because apparently "if you specify any argument to redis-server, [it assumes] you are going to specify everything"
# see also https://github.com/docker-library/redis/issues/4#issuecomment-50780840
# (more exactly, this makes sure the default behavior of "save on SIGTERM" stays functional by default)
    \
    make -C /usr/src/redis -j "$(nproc)"; \
    make -C /usr/src/redis install; \
    \
    rm -r /usr/src/redis; \
    \
    apt-get purge -y --auto-remove $buildDeps
RUN mkdir /data && chown redis:redis /data
VOLUME /data
WORKDIR /data
COPY docker-entrypoint.sh /usr/local/bin/
ENTRYPOINT ["docker-entrypoint.sh"]
EXPOSE 6379
CMD ["redis-server"]
```

**4、** 使用dockerbuild命令通过Dockerfile创建一个镜像ms-redis:3.2.11；

```sh
[root@ddkk.com redis]# docker build  -t ms-redis:3.2.11 .
Sending build context to Docker daemon 5.632 kB
....
```

**5、** 创建完成后，就可以在本地的镜像列表里查找到刚刚创建的镜像；

```sh
[root@ddkk.com redis]# docker images ms-redis
REPOSITORY   TAG     IMAGE ID     CREATED       SIZE
ms-redis     3.2.11  4b37d6f6199e 11 days ago   98.94 MB
```

## 运行容器

可以使用 docker run -dit 命令来运行我们刚刚创建的 ms-redis 镜像

```sh
[root@ddkk.com redis]# docker run -p 6379:6379 -v $PWD/data:/data  -d ms-redis:3.2.11 redis-server --appendonly yes
c929419b17cfc433265fcd13fd2e6a56f94521082f5b5641983aad41cdb0f212
```

命令说明

**1、** -p6379:6379；

```sh
将容器的 6379 端口映射到主机的 6379 端口
```

**2、** -v `$` PWD/data:/data；

```sh
将主机中当前目录下的 data 挂载到容器的 /data
```

**3、** redis-server--appendonlyyes；

```sh
在容器执行 redis-server 启动命令，并打开 redis 持久化配置
```

## 查看容器启动情况

使用docker ps -a 看一下刚刚的 ms-redis 启动情况

```sh
[root@ddkk.com redis]# docker ps -a
CONTAINER ID  IMAGE             COMMAND      CREATED   STATUS  PORTS    NAMES
c929419b17cf  ms-redis:3.2.11  "docker-entrypoint.sh"   11 days ago         Up 54 seconds       0.0.0.0:6379->6379/tcp   ecstatic_keller
```

## 查看容器的 IP

可以使用命令 docker inspect 查看容器的 IP

```sh
docker inspect --format '{{ .NetworkSettings.IPAddress }}' <container_id>
```

例如可以使用下面的命令查看刚刚创建的容器的 IP

```sh
[root@ddkk.com mongo]# docker inspect --format '{{ .NetworkSettings.IPAddress }}' c929419b17cf
172、17.0.2
```

## 连接、查看 Redis 容器

可以使用 redis 镜像执行 redis-cli 命令连接到刚启动的容器,主机 IP 为 172.17.0.2

```sh
[root@ddkk.com mongo]# docker run -it ms-redis:3.2.11 redis-cli -h 172.17.0.2
172、17.0.2:6379> info
# Server
redis_version:3.2.11
redis_git_sha1:00000000
redis_git_dirty:0
redis_build_id:9f71ab69a5226d40
redis_mode:standalone
os:Linux 4.4.27-moby x86_64
arch_bits:64
multiplexing_api:epoll
gcc_version:4.9.2
process_id:1
run_id:757444b615f3e9152e42da031b038547b0e38853
tcp_port:6379
uptime_in_seconds:389
uptime_in_days:0
hz:10
lru_clock:16706141
executable:/data/redis-server
config_file:
# Clients
connected_clients:1
client_longest_output_list:0
client_biggest_input_buf:0
blocked_clients:0
# Memory
used_memory:822408
used_memory_human:803.13K
used_memory_rss:4034560
used_memory_rss_human:3.85M
used_memory_peak:822408
used_memory_peak_human:803.13K
total_system_memory:2094944256
total_system_memory_human:1.95G
used_memory_lua:37888
used_memory_lua_human:37.00K
maxmemory:0
maxmemory_human:0B
maxmemory_policy:noeviction
mem_fragmentation_ratio:4.91
mem_allocator:jemalloc-4.0.3
# Persistence
loading:0
rdb_changes_since_last_save:0
rdb_bgsave_in_progress:0
rdb_last_save_time:1526655192
rdb_last_bgsave_status:ok
rdb_last_bgsave_time_sec:-1
rdb_current_bgsave_time_sec:-1
aof_enabled:1
aof_rewrite_in_progress:0
aof_rewrite_scheduled:0
aof_last_rewrite_time_sec:-1
aof_current_rewrite_time_sec:-1
aof_last_bgrewrite_status:ok
aof_last_write_status:ok
aof_current_size:0
aof_base_size:0
aof_pending_rewrite:0
aof_buffer_length:0
aof_rewrite_buffer_length:0
aof_pending_bio_fsync:0
aof_delayed_fsync:0
# Stats
total_connections_received:1
total_commands_processed:1
instantaneous_ops_per_sec:0
total_net_input_bytes:31
total_net_output_bytes:9928
instantaneous_input_kbps:0.00
instantaneous_output_kbps:0.00
rejected_connections:0
sync_full:0
sync_partial_ok:0
sync_partial_err:0
expired_keys:0
evicted_keys:0
keyspace_hits:0
keyspace_misses:0
pubsub_channels:0
pubsub_patterns:0
latest_fork_usec:0
migrate_cached_sockets:0
# Replication
role:master
connected_slaves:0
master_repl_offset:0
repl_backlog_active:0
repl_backlog_size:1048576
repl_backlog_first_byte_offset:0
repl_backlog_histlen:0
# CPU
used_cpu_sys:0.77
used_cpu_user:1.21
used_cpu_sys_children:0.00
used_cpu_user_children:0.00
# Cluster
cluster_enabled:0
# Keyspace
172、17.0.2:6379> 
```
