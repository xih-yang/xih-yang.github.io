# 79、Docker 实战：Docker常见仓库MongoDB
- 来源：https://ddkk.com/zhuanlan/container/docker/1/79.html
- 分类：容器服务
- 分组：教程目录
## MongoDB

### 基本信息

[MongoDB](https://en.wikipedia.org/wiki/MongoDB) 是开源的 NoSQL 数据库实现。 该仓库提供了 MongoDB 2.2 ~ 2.7 各个版本的镜像。

### 使用方法

默认会在 27017 端口启动数据库。

```sh
$ sudo docker run --name some-mongo -d mongo
```

使用其他应用连接到容器，可以用

```sh
$ sudo docker run --name some-app --Linksome-mongo:mongo -d application-that-uses-mongo
```

或者通过 mongo

```sh
$ sudo docker run -it --Linksome-mongo:mongo --rm mongo sh -c 'exec mongo "$MONGO_PORT_27017_TCP_ADDR:$MONGO_PORT_27017_TCP_PORT/test"'
```

### Dockerfile

- [2.2 版本][2.2]
- [2.4 版本][2.4]
- [2.6 版本][2.6]
- [2.7 版本][2.7]
