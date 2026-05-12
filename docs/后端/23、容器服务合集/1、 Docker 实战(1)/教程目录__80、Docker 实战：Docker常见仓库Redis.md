# 80、Docker 实战：Docker常见仓库Redis
- 来源：https://ddkk.com/zhuanlan/container/docker/1/80.html
- 分类：容器服务
- 分组：教程目录
## Redis

### 基本信息

[Redis](https://en.wikipedia.org/wiki/Redis) 是开源的内存 Key-Value 数据库实现。 该仓库提供了 Redis 2.6 ~ 2.8.9 各个版本的镜像。

### 使用方法

默认会在 6379 端口启动数据库。

```sh
$ sudo docker run --name some-redis -d redis
```

另外还可以启用 [持久存储](http://redis.io/topics/persistence)。

```sh
$ sudo docker run --name some-redis -d redis redis-server --appendonly yes
```

默认数据存储位置在 VOLUME/data。可以使用 --volumes-from some-volume-container 或 -v /docker/host/dir:/data 将数据存放到本地。

使用其他应用连接到容器，可以用

```sh
$ sudo docker run --name some-app --Linksome-redis:redis -d application-that-uses-redis
```

或者通过 redis-cli

```sh
$ sudo docker run -it --Linksome-redis:redis --rm redis sh -c 'exec redis-cli -h "$REDIS_PORT_6379_TCP_ADDR" -p "$REDIS_PORT_6379_TCP_PORT"'
```

### Dockerfile

- [2.6 版本][2.6]
- [最新 2.8 版本][2.8]
