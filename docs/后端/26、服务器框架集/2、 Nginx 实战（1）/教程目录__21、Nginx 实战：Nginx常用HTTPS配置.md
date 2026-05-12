# 21、Nginx 实战：Nginx常用HTTPS配置
- 来源：https://ddkk.com/zhuanlan/server/nginx/2/21.html
- 分类：服务器框架
- 分组：教程目录
```java
#1.新建证书存放目录
[root@mjndev conf.d]# mkdir /etc/ssl/private/dm -p
#2.上传证书
[root@mjndev conf.d]# cd /etc/ssl/private/dm
[root@mjndev dm]# rz
[root@mjndev dm]# ll
total 24
-rw-r--r-- 1 root root 23922 Jul  5 10:09 rbcas.com.cn.zip
```

## 二、解压证书

```java
[root@mjndev dm]# unzip rbcas.com.cn.zip
[root@mjndev dm]# ll
total 72
-rw-r--r-- 1 root root  4674 Mar 22 11:25 3972117__rbcas.com.cn_apache.zip
-rw-r--r-- 1 root root  5151 Mar 22 11:25 3972117__rbcas.com.cn_iis.zip
-rw-r--r-- 1 root root  3955 Mar 22 11:25 3972117__rbcas.com.cn_jks.zip
-rw-r--r-- 1 root root  4283 Mar 22 11:25 3972117__rbcas.com.cn_nginx.zip
-rw-r--r-- 1 root root  5151 Mar 22 11:25 3972117__rbcas.com.cn_tomcat.zip
-rw-r--r-- 1 root root 23922 Jul  5 10:09 rbcas.com.cn.zip
```

## 三、Nginx类型证书

### 1.解压Nginx证书

```java
#1.解压nginx类型证书
[root@mjndev dm]# unzip 3972117__rbcas.com.cn_nginx.zip
Archive:  3972117__rbcas.com.cn_nginx.zip
Aliyun Certificate Download
  inflating: 3972117__rbcas.com.cn.pem  
  inflating: 3972117__rbcas.com.cn.key  
#2.查看证书
[root@mjndev dm]# ll
total 72
-rw-r--r-- 1 root root  4283 Mar 22 11:25 3972117__rbcas.com.cn_nginx.zip
-rw-r--r-- 1 root root  1679 Mar 22 11:25 3972117__rbcas.com.cn.key
-rw-r--r-- 1 root root  4103 Mar 22 11:25 3972117__rbcas.com.cn.pem  
```

### 2.配置Nginx前后端不分离

```java
#1.进入nginx配置目录
[root@mjndev dm]# cd /etc/nginx/conf.d/
#2.编写nginx站点文件
[root@mjndev conf.d]# vim dmtest.rbcas.com.cn.conf
upstream dmtest.rbcas.com.cn {
        server localhost:18080;
}
server {
        listen 80;
        server_name dmtest.rbcas.com.cn;
        return 301 https://$http_host$request_uri;
}
server {
        listen 443 ssl;
        server_name dmtest.rbcas.com.cn;
        ssl_certificate      /etc/ssl/private/dm/3972117__rbcas.com.cn.pem;
        ssl_certificate_key  /etc/ssl/private/dm/3972117__rbcas.com.cn.key;
        ssl_session_timeout 5m;
        ssl_protocols TLSV1 TLSv1.1 TLSv1.2;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;
        ssl_prefer_server_ciphers on;
        access_log /data/logs/dmtest.rbcas.com.cn_access.log;
        error_log  /data/logs/dmtest.rbcas.com.cn_error.log;
        location /api {
                proxy_headers_hash_max_size 51200;
                proxy_headers_hash_bucket_size 6400;
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection "upgrade";
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header Host $host;
                proxy_redirect off;
                proxy_pass http://dmtest.rbcas.com.cn;
        }
        location / {
           root /data/webproject/dm/dist;
        }
        location /dm {
           alias /data/webproject/dm/dist;
        }
}
#3.配置站点日志文件
[root@mjndev conf.d]# mkdir /data/logs -p
#4.检查nginx配置
[root@mjndev conf.d]# nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
#5.重载nginx
[root@mjndev conf.d]# nginx -s reload
```

## 四、Tomcat类型证书

### 1.解压Tomcat证书

```java
#1.解压tomcat类型证书
[root@mjndev ~]# cd /etc/ssl/private/dm
[root@mjndev dm]# unzip 3972117__rbcas.com.cn_tomcat.zip
#2.看证书
[root@mjndev dm]# ll
total 80
-rw-r--r-- 1 root root  4834 Mar 22 11:25 3972117__rbcas.com.cn.pfx
-rw-r--r-- 1 root root  5151 Mar 22 11:25 3972117__rbcas.com.cn_tomcat.zip
-rw-r--r-- 1 root root     8 Mar 22 11:25 pfx-password.txt
```

### 2.转化pfx证书

```java
#1.生成证书crt和key
[root@mjndev dm]# openssl pkcs12 -in 3972117__rbcas.com.cn.pfx -clcerts -nokeys -out dmtest.rbcas.com.cn.crt
Enter Import Password: ******			#pfx-password.txt的密码
MAC verified OK
[root@mjndev dm]# openssl pkcs12 -in 3972117__rbcas.com.cn.pfx  -nocerts -nodes -out dmtest.rbcas.com.cn.rsa
Enter Import Password: ******			#pfx-password.txt的密码
MAC verified OK
#2.查看所在目录以生成证书
[root@mjndev dm]# ll
total 80
-rw-r--r-- 1 root root  4834 Mar 22 11:25 3972117__rbcas.com.cn.pfx
-rw-r--r-- 1 root root  5151 Mar 22 11:25 3972117__rbcas.com.cn_tomcat.zip
-rw-r--r-- 1 root root  2744 Jul  5 19:16 dmtest.rbcas.com.cn.crt
-rw-r--r-- 1 root root  1850 Jul  5 19:17 dmtest.rbcas.com.cn.rsa
-rw-r--r-- 1 root root     8 Mar 22 11:25 pfx-password.txt
-rw-r--r-- 1 root root 23922 Jul  5 10:09 rbcas.com.cn.zip
#3.验证证书准确性
[root@mjndev dm]# openssl s_server -www -accept 443 -cert ./dmtest.rbcas.com.cn.crt -key ./dmtest.rbcas.com.cn.rsa 
```

### 3.配置Nginx

```java
[root@mjndev dm]# vim /etc/nginx/conf.d/dmtest.rbcas.com.cn.conf
upstream dmtest.rbcas.com.cn {
        server localhost:18080;
}
server {
        listen 80;
        server_name dmtest.rbcas.com.cn;
        return 301 https://$http_host$request_uri;
}
server {
        listen 443 ssl;
        server_name dmtest.rbcas.com.cn;
        ssl_certificate      /etc/ssl/private/dm/dmtest.rbcas.com.cn.crt;
        ssl_certificate_key  /etc/ssl/private/dm/dmtest.rbcas.com.cn.rsa;
        ssl_session_timeout 5m;
        ssl_protocols TLSV1 TLSv1.1 TLSv1.2;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;
        ssl_prefer_server_ciphers on;
        access_log /data/logs/dmtest.rbcas.com.cn_access.log;
        error_log  /data/logs/dmtest.rbcas.com.cn_error.log;
        location /api {
                proxy_headers_hash_max_size 51200;
                proxy_headers_hash_bucket_size 6400;
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection "upgrade";
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header Host $host;
                proxy_redirect off;
                proxy_pass http://dmtest.rbcas.com.cn;
        }
        location / {
           root /data/webproject/dm/dist;
        }
        location /dm {
           alias /data/webproject/dm/dist;
        }
}
#3.配置站点日志文件
[root@mjndev dm]# mkdir /data/logs -p
#4.检查nginx配置
[root@mjndev dm]# nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
#5.重载nginx
[root@mjndev dm]# nginx -s reload
```

## 五、访问测试

```java
打开浏览器，输入配置nginx时的域名自动跳转到HTTPS，查看证书是否过期即可。 
```
