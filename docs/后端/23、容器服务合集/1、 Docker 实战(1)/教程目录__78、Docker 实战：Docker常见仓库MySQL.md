# 78、Docker 实战：Docker常见仓库MySQL
- 来源：https://ddkk.com/zhuanlan/container/docker/1/78.html
- 分类：容器服务
- 分组：教程目录
## MySQL

### 基本信息

[MySQL](https://en.wikipedia.org/wiki/MySQL) 是开源的关系数据库实现。 该仓库提供了 MySQL 各个版本的镜像，包括 5.6 系列、5.7 系列等。

### 使用方法

默认会在 3306 端口启动数据库。

```sh
$ sudo docker run --name some-mysql -e MYSQL_ROOT_PASSWORD=mysecretpassword -d mysql
```

之后就可以使用其它应用来连接到该容器。

```sh
$ sudo docker run --name some-app --Linksome-mysql:mysql -d application-that-uses-mysql
```

或者通过 mysql。

```sh
$ sudo docker run -it --Linksome-mysql:mysql --rm mysql sh -c 'exec mysql -h"$MYSQL_PORT_3306_TCP_ADDR" -P"$MYSQL_PORT_3306_TCP_PORT" -uroot -p"$MYSQL_ENV_MYSQL_ROOT_PASSWORD"'
```

### Dockerfile

- [5.6 版本][5.6]
- [5.7 版本][5.7]
