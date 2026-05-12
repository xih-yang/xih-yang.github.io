# 04、Nginx 实战：Centos7下Nginx版本升级
- 来源：https://ddkk.com/zhuanlan/server/nginx/2/4.html
- 分类：服务器框架
- 分组：教程目录
## 一、下载新版本的包

```java
[root@web03 ~]# wget http://nginx.org/download/nginx-1.19.2.tar.gz
```

## 二、解压安装包

```java
[root@web03 ~]# tar xf nginx-1.19.2.tar.gz
```

## 三、生成编译安装

```java
[root@web03 ~]# cd nginx-1.19.2/
[root@web03 nginx-1.19.2]# ./configure --prefix=/usr/local/nginx-1.19.2 --user=www --group=www --with-http_addition_module --with-http_auth_request_module --without-http_gzip_module
[root@web03 nginx-1.19.2]# make && make install
```

## 四、替换配置文件

```java
[root@web03 /usr/local]# cp nginx-1.18.0/conf/nginx.conf nginx-1.19.2/conf/
[root@web03 /usr/local]# cp nginx-1.18.0/conf.d/* nginx-1.19.2/conf.d/
```

## 五、修改软连接

```java
[root@web03 /usr/local]# rm -rf /usr/local/nginx
[root@web03 /usr/local]# ln -s /usr/local/nginx-1.19.2 /usr/local/nginx
```

## 六、重启nginx

```java
[root@web03 /usr/local]# systemctl restart nginx
```
