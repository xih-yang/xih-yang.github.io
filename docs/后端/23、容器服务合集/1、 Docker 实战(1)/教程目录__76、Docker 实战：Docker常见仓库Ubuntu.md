# 76、Docker 实战：Docker常见仓库Ubuntu
- 来源：https://ddkk.com/zhuanlan/container/docker/1/76.html
- 分类：容器服务
- 分组：教程目录
## Ubuntu

### 基本信息

[Ubuntu](https://en.wikipedia.org/wiki/Ubuntu) 是流行的 Linux 发行版，其自带软件版本往往较新一些。 该仓库提供了 Ubuntu从12.04 ~ 14.10 各个版本的镜像。

### 使用方法

默认会启动一个最小化的 Ubuntu 环境。

```sh
$ sudo docker run --name some-ubuntu -i -t ubuntu
root@523c70904d54:/#
```

### Dockerfile

- [12.04 版本][12.04]
- [14.04 版本][14.04]
- [14.10 版本][14.10]
