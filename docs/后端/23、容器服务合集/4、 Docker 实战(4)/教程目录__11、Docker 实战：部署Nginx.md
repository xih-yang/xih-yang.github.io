# 11、Docker 实战：部署Nginx
- 来源：https://ddkk.com/zhuanlan/container/docker/4/11.html
- 分类：容器服务
- 分组：教程目录
### step-1 搜索镜像

使用search命令，建议去[dockerhub上搜索](https://hub.docker.com/_/nginx)，可以看到帮助文档

```java
[root@ddkk.com ~]# docker search nginx
NAME DESCRIPTION STARS OFFICIAL AUTOMATED
nginx Official build of Nginx. 15364 [OK]
jwilder/nginx-proxy Automated Nginx reverse proxy for docker con… 2060 [OK]
richarvey/nginx-php-fpm Container running Nginx + PHP-FPM capable of… 816 [OK]
jc21/nginx-proxy-manager Docker container for managing Nginx proxy ho… 236
linuxserver/nginx An Nginx container, brought to you by LinuxS… 152
tiangolo/nginx-rtmp Docker image with Nginx using the nginx-rtmp… 139 [OK]
jlesage/nginx-proxy-manager Docker container for Nginx Proxy Manager 132 [OK]
alfg/nginx-rtmp NGINX, nginx-rtmp-module and FFmpeg from sou… 105 [OK]
jasonrivers/nginx-rtmp Docker images to host RTMP streams using NGI… 92 [OK]
nginxdemos/hello NGINX webserver that serves a simple page co… 71 [OK]
privatebin/nginx-fpm-alpine PrivateBin running on an Nginx, php-fpm & Al… 56 [OK]
nginx/nginx-ingress NGINX and NGINX Plus Ingress Controllers fo… 55
nginxinc/nginx-unprivileged Unprivileged NGINX Dockerfiles 46
staticfloat/nginx-certbot Opinionated setup for automatic TLS certs lo… 24 [OK]
nginx/nginx-prometheus-exporter NGINX Prometheus Exporter for NGINX and NGIN… 19
schmunk42/nginx-redirect A very simple container to redirect HTTP tra… 19 [OK]
nginxproxy/nginx-proxy Automated Nginx reverse proxy for docker con… 18
centos/nginx-112-centos7 Platform for running nginx 1.12 or building … 15
centos/nginx-18-centos7 Platform for running nginx 1.8 or building n… 13
bitwarden/nginx The Bitwarden nginx web server acting as a r… 11
flashspys/nginx-static Super Lightweight Nginx Image 10 [OK]
mailu/nginx Mailu nginx frontend 9 [OK]
sophos/nginx-vts-exporter Simple server that scrapes Nginx vts stats a… 7 [OK]
ansibleplaybookbundle/nginx-apb An APB to deploy NGINX 2 [OK]
wodby/nginx Generic nginx 1 [OK]
```

### step-2 下载镜像

```java
[root@ddkk.com ~]# docker pull nginx
Using default tag: latest
latest: Pulling from library/nginx
e1acddbe380c: Pull complete 
e21006f71c6f: Pull complete 
f3341cc17e58: Pull complete 
2a53fa598ee2: Pull complete 
12455f71a9b5: Pull complete 
b86f2ba62d17: Pull complete 
Digest: sha256:4d4d96ac750af48c6a551d757c1cbfc071692309b491b70b2b8976e102dd3fef
Status: Downloaded newer image for nginx:latest
docker.io/library/nginx:latest
```

### step-3 运行测试

```java
[root@ddkk.com ~]# docker images
REPOSITORY   TAG       IMAGE ID       CREATED        SIZE
nginx        latest    dd34e67e3371   8 days ago     133MB
centos       latest    300e315adb2f   8 months ago   209MB
#-d 后台运行
#--name 给容器命名
#-p 宿主机端口:容器内部端口　　#将容器的端口暴露出来，映射到宿主机的端口上
[root@ddkk.com ~]# docker run -d --name nginx01 -p 3344:80 nginx
e3711d6853698d2028c961cd2b4b2cfc85386ba32ed3a333f2da82dc0de4e0de
[root@ddkk.com ~]# docker ps
CONTAINER ID   IMAGE     COMMAND                  CREATED          STATUS          PORTS                                   NAMES
e3711d685369   nginx     "/docker-entrypoint.…"   11 seconds ago   Up 10 seconds   0.0.0.0:3344->80/tcp, :::3344->80/tcp   nginx01
e88decf20b06   centos    "/bin/bash"              51 minutes ago   Up 49 minutes                                           gallant_chaplygin
[root@ddkk.com ~]# curl localhost:3344
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
    body {
        width: 35em;
        margin: 0 auto;
        font-family: Tahoma, Verdana, Arial, sans-serif;
    }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, the nginx web server is successfully installed and
working. Further configuration is required.</p>
<p>For online documentation and support please refer to
<a href="http://nginx.org/">nginx.org</a>.<br/>
Commercial support is available at
<a href="http://nginx.com/">nginx.com</a>.</p>
<p><em>Thank you for using nginx.</em></p>
</body>
</html>
```

```java
端口暴露逻辑
```

### step-4 进入容器

```java
[root@ddkk.com ~]# docker ps
CONTAINER ID   IMAGE     COMMAND                  CREATED             STATUS             PORTS                                   NAMES
e3711d685369   nginx     "/docker-entrypoint.…"   26 minutes ago      Up 26 minutes      0.0.0.0:3344->80/tcp, :::3344->80/tcp   nginx01
e88decf20b06   centos    "/bin/bash"              About an hour ago   Up About an hour                                           gallant_chaplygin
[root@ddkk.com ~]# docker exec -it nginx01 /bin/bash
root@e3711d685369:/# whereis nginx
nginx: /usr/sbin/nginx /usr/lib/nginx /etc/nginx /usr/share/nginx
root@e3711d685369:/# cd /etc/nginx
root@e3711d685369:/etc/nginx# ls
conf.d    fastcgi_params    mime.types  modules  nginx.conf  scgi_params  uwsgi_params
```
