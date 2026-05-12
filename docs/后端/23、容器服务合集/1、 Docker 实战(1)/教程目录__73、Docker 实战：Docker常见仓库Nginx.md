# 73、Docker 实战：Docker常见仓库Nginx
- 来源：https://ddkk.com/zhuanlan/container/docker/1/73.html
- 分类：容器服务
- 分组：教程目录
## Nginx

### 基本信息

[Nginx](https://en.wikipedia.org/wiki/Nginx) 是开源的高效的 Web 服务器实现，支持 HTTP、HTTPS、SMTP、POP3、IMAP 等协议。 该仓库提供了 Nginx 1.0 ~ 1.7 各个版本的镜像。

### 使用方法

下面的命令将作为一个静态页面服务器启动。

```sh
$ sudo docker run --name some-nginx -v /some/content:/usr/share/nginx/html:ro -d nginx
```

用户也可以不使用这种映射方式，通过利用 Dockerfile 来直接将静态页面内容放到镜像中，内容为

```sh
FROM nginx
COPY static-html-directory /usr/share/nginx/html
```

之后生成新的镜像，并启动一个容器。

```sh
$ sudo docker build -t some-content-nginx .
$ sudo docker run --name some-nginx -d some-content-nginx
```

开放端口，并映射到本地的 8080 端口。

```sh
sudo docker run --name some-nginx -d -p 8080:80 some-content-nginx
```

Nginx的默认配置文件路径为 /etc/nginx/nginx.conf，可以通过映射它来使用本地的配置文件，例如

```sh
docker run --name some-nginx -v /some/nginx.conf:/etc/nginx/nginx.conf:ro -d nginx
```

使用配置文件时，为了在容器中正常运行，需要保持 daemon off;。

### Dockerfile

- [1 ~ 1.7 版本][1 _ 1.7]
