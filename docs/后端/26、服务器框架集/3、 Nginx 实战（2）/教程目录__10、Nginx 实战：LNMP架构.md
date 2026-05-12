# 10、Nginx 实战：LNMP架构
- 来源：https://ddkk.com/zhuanlan/server/nginx/3/10.html
- 分类：服务器框架
- 分组：教程目录
## 1LNMP架构概述

## 1.1.什么是LNMP

LNMP 是一套技术的组合，L = Linux，N = Nginx，M~ = MySQL，P~ = PHP

## 1.2.LNMP架构是如何工作的

```java
首先Nginx服务是不能处理动态请求，那么当用户发起动态请求时，Nginx又是如何进行处理的。
当用户发起http请求，请求会被Nginx处理，如果是静态资源请求Nginx则直接返回，如果是动态请求的Nginx则通过FastCGI的协议转交给后端的PHP程序处理，具体如下图所示
```

## 1.3.Nginx与快速CGI详细工作流程如下图所示

```java
1.用户通过http协议发起请求，请求会先抵达LNMP架构中的Nginx 
2.Nginx会根据用户的请求进行位置规则匹配
3.Location如果匹配到请求是静态，则由Nginx读取本地直接返回
4.位置如果匹配到请求是动态，则由Nginx将请求转发给fastcgi协议
5.fastgi收到后将请求交给php-fpm管理进程，php-fpm管理进程接收到后会调用warrap工作进程 
6 .warrap进程会调用php程序进行解析，如果只是解析代码，php直接返回
7.如果有查询数据库操作，则由php连接数据库（用户密码IP）发起查询的操作
8.最终数据由mysql-> php- > PHP-fpm-> fastcgi-> nginx-> HTTP->用户
```

## 2LNMP架构环境部署

1）使用官方仓库安装Nginx

```java
[root@nginx ~]# cat /etc/yum.repos.d/nginx.repo 
[nginx]
name=nginx repo
baseurl=http://nginx.org/packages/centos/7/$basearch/
gpgcheck=0
enabled=1
#安装Nginx
[root@nginx ~]# yum install nginx -y
```

2）启动Nginx，并将Nginx加入开机自启

```java
[root@nginx ~]# systemctl start nginx
[root@nginx ~]# systemctl enable nginx
```

3）使用第三方扩展源安装php7.1

```java
[root@nginx ~]# yum remove php-mysql-5.4 php php-fpm php-common
[root@nginx ~]# cat /etc/yum.repos.d/php.repo
[php]
name = php Repository
baseurl = http://us-east.repo.webtatic.com/yum/el7/x86_64/
gpgcheck = 0
[root@nginx ~]# yum -y install php71w php71w-cli php71w-common php71w-devel php71w-embedded php71w-gd php71w-mcrypt php71w-mbstring php71w-pdo php71w-xml php71w-fpm php71w-mysqlnd php71w-opcache php71w-pecl-memcached php71w-pecl-redis php71w-pecl-mongodb
```

3）配置php-fpm用户与Nginx的运行用户保持一致

```java
[root@nginx ~]# sed -i '/^user/c user = www' /etc/php-fpm.d/www.conf 
[root@nginx ~]# sed -i '/^group/c group = www' /etc/php-fpm.d/www.conf
```

4）启动php-fpm，并将其加入开机自启

```java
[root@nginx ~]# systemctl start php-fpm
[root@nginx ~]# systemctl enable php-fpm
```

5）安装Mariadb数据库

```java
[root@nginx ~]# yum install mariadb-server mariadb -y
```

6）启动Mariadb数据库，并加入开机自动

```java
[root@nginx ~]# systemctl start mariadb
[root@nginx ~]# systemctl enable mariadb
```

7）给Mariadb配置登陆密码，并且是新密码进行登录数据库

```java
[root@nginx ~]# mysqladmin password 'Bgx123.com'
[root@nginx ~]# mysql -uroot -pBgx123.com
```

## 3LNMP架构环境配置

在将Nginx与PHP集成过程中，需要先了解Fastcgi代理配置语法

## 3.1.设置的fastcgi服务器的地址，该地址可以指定为域名或IP地址，以及端口

```java
Syntax: fastcgi_pass address;
Default: —
Context: location, if in location
#语法示例
fastcgi_pass localhost:9000;
fastcgi_pass unix:/tmp/fastcgi.socket;
```

## 3.2.设置的fastcgi默认的首页文件，需要结合fastcgi_param一起设置

```java
Syntax: fastcgi_index name;
Default: —
Context: http, server, location
```

## 3.3.通过fastcgi_param设置变量，并将设置的变量传递到后端的FastCGI的服务器

```java
Syntax: fastcgi_param parameter value [if_not_empty];
Default: —
Context: http, server, location
#语法示例
fastcgi_index index.php;
fastcgi_param SCRIPT_FILENAME /code$fastcgi_script_name;
```

## 3.4.通过图形方式展示fastcgi_index与fastcgi_param作用

## 3.5.最终Nginx的连接FASTCGI服务器配置如下（nginx和php集成）

```java
[root@nginx ~]# cat /etc/nginx/conf.d/php.conf 
server {
        server_name php.oldboy.com;
        listen 80;
        root /code;
        index index.php index.html;
        location ~ \.php$ {
            root /code;
            fastcgi_pass   127.0.0.1:9000;
            fastcgi_index  index.php;
            fastcgi_param  SCRIPT_FILENAME  $document_root$fastcgi_script_name;
            include        fastcgi_params;
        }
}
```

## 3.6.在/代码目录下创建info.php的文件，测试能否通过浏览器访问，访问成功如下图

```java
[root@nginx ~]# cat /code/info.php
<?php
        phpinfo();
?>
```

## 3.7在/ code目录下创建mysql.php文件，填入对应的数据库IP，用户名，密码(php连接mysql)

```java
[root@nginx ~]# cat /code/mysql.php
       <?php
        $servername = "localhost";
        $username = "root";
        $password = "123456";
        // 创建连接
        $conn = mysqli_connect($servername, $username, $password);
        // 检测连接
        if (!$conn) {
            die("Connection failed: " . mysqli_connect_error());
        }
        echo "php连接MySQL数据库成功";
       ?>
```

## 3.8最后通过浏览器访问/mysqli.php文件，如成功访问如下图

## 4部署博客产品的WordPress

## 4.1配置Nginx虚拟主机站点，域名为blog.bgx.com

```java
#nginx具体配置信息
[root@nginx ~]# cat /etc/nginx/conf.d/wordpress.conf
server {
    listen 80;
    server_name blog.tuchuang.com;
    root /code/wordpress;
    index index.php index.html;
    location ~ \.php$ {
        fastcgi_pass   127.0.0.1:9000;
        fastcgi_index  index.php;
        fastcgi_param  SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

## 4.2重启nginx服务

```java
[root@nginx ~]# systemctl restart nginx
```

## 4.3获取wordpress产品，解压并部署wordress

```java
[root@nginx ~]# mkdir /code
[root@nginx ~]# cd /code![](https://img2018.cnblogs.com/blog/1488697/201905/1488697-20190528231702326-1090090313.png)
[root@nginx code]# wget https://cn.wordpress.org/wordpress-4.9.4-zh_CN.tar.gz
[root@nginx ~]# tar xf wordpress-4.9.4-zh_CN.tar.gz
[root@nginx ~]# chown -R www.www /code/wordpress/
```

## 4.4由于wordpress产品需要依赖数据库，所以需要手动建立数据库

```java
[root@nginx ~]# mysql -uroot -p123456
mysql> create database wordpress;
mysql> exit
```

## 4.5通过浏览器访问wordpress，并部署该产品(需要做域名解析)

## 5部署知乎产品Wecenter

## 5.1.配置Nginx的虚拟主机站点，域名为zh.tuchuang.com

```java
[root@http-server ~]# cat /etc/nginx/conf.d/zh.conf
server {
    listen 80;
    server_name zh.tuchuang.com;
    root /code/zh;
    index index.php index.html;
    location ~ \.php$ {
        root /code/zh;
        fastcgi_pass   127.0.0.1:9000;
        fastcgi_index  index.php;
        fastcgi_param  SCRIPT_FILENAME  $document_root$fastcgi_script_name;
        include        fastcgi_params;
    }
}
#重启nginx服务
[root@http-server ~]# systemctl restart nginx
```

## 5.2.下载Wecenter产品，部署Wecenter并授权

```java
[root@web02 ~]# wget http://ahdx.down.chinaz.com/201605/WeCenter_v3.2.1.zip
[root@web02 ~]# unzip WeCenter_v3.1.9.zip 
[root@web02 ~]# mv WeCenter_3-2-1/ zh
[root@web02 ~]# chown -R www.www /code/zh/
```

## 5.3.由于wecenter产品需要依赖数据库，所以需要手动建立数据库

```java
[root@http-server ~]# mysql -uroot -pBgx123.com 登陆数据库
MariaDB [(none)]> create database zh;  创建zh数据库
MariaDB [(none)]> exit
```

## 5.4.通过浏览器访问网站

## 6.布置在线教育产品edusoho

## 6.1.配置nginx

```java
[root@web01 code]# cat /etc/nginx/conf.d/edu.oldboy.com.conf 
server {
    listen 80;
    server_name edu.oldboy.com;
    root /code/edusoho/web;
    client_max_body_size 200m;
    location / {
        index app.php;
        try_files $uri @rewriteapp;
    }
    location @rewriteapp {
        rewrite ^(.*)$ /app.php/$1 last;
    }
    location ~ ^/udisk {
        internal;
        root /code/edusoho/app/data/;
    }
    location ~ ^/(app|app_dev)\.php(/|$) {
        fastcgi_pass   127.0.0.1:9000;
        fastcgi_split_path_info ^(.+\.php)(/.*)$;
        include fastcgi_params;
        fastcgi_param  SCRIPT_FILENAME    $document_root$fastcgi_script_name;
        fastcgi_param  HTTPS              off;
        fastcgi_param HTTP_X-Sendfile-Type X-Accel-Redirect;
        fastcgi_param HTTP_X-Accel-Mapping /udisk=/code/edusoho/app/data/udisk;
        fastcgi_buffer_size 128k;
        fastcgi_buffers 8 128k;
    }
    配置设置图片格式文件
    location ~* \.(jpg|jpeg|gif|png|ico|swf)$ {
        过期时间为3年
        expires 3y;
        关闭日志记录
        access_log off;
        关闭gzip压缩，减少CPU消耗，因为图片的压缩率不高。
        gzip off;
    }
    配置css/js文件
    location ~* \.(css|js)$ {
        access_log off;
        expires 3y;
    }
    禁止用户上传目录下所有.php文件的访问，提高安全性
    location ~ ^/files/.*\.(php|php5)$ {
        deny all;
    }
    以下配置允许运行.php的程序，方便于其他第三方系统的集成。
    location ~ \.php$ {
        fastcgi_pass   127.0.0.1:9000;
        fastcgi_split_path_info ^(.+\.php)(/.*)$;
        include fastcgi_params;
        fastcgi_param  SCRIPT_FILENAME    $document_root$fastcgi_script_name;
        fastcgi_param  HTTPS              off;
    }
}
```

## 6.2.下载软件，并且授权

```java
wget http://download.edusoho.com/edusoho-8.2.17.tar.gz
tar xf edusoho-8.2.17.tar.gz
chown -R www.www edusoho
```

## 6.3.调整php的上传大小

```java
[root@web01 ~]# vim /etc/php.ini
post_max_size = 200M
upload_max_filesize = 200M
[root@web01 code]# systemctl restart php-fpm
```

## 7.拆分数据库至至独立服务器

## 7.1.为什么要进行数据库的拆分

由于单台服务器运行LNMP架构会导致网站访问缓慢，当内存被吃满时，很容易导致系统出现OOM故障(实质就是内存不够导致)，从而杀掉占用内存最大的程序(有可能就杀掉数据库，导致数据丢失)，所以需要将web和数据库进行独立部署。

## 7.2.数据库拆分后解决了什么问题

**1、** 缓解web网站的压力；

**2、** 增强数据库读写性能；

**3、** 提高用户访问的速度；

## 7.3.数据库拆分架构演变过程，如下图所示

## 7.4.数据库拆分环境规划

主机名称
应用环境
外网地址
内网地址

WEB01
nginx的PHP +
10.0.0.7
172.16.1.7

DB01
MySQL的

172.16.1.51

## 7.5.数据库拆分架构详细步骤

### 7.5.1.web01网站服务器操作如下

```java
1）备份web01上的数据库，123456是数据库密码
[root@web01 ~]# mysqldump -uroot -p'123456' --all-databases --single-transaction > mysql-all.sql
2）将web01上备份的数据库拷贝贝至db01服务器上
[root@web01 ~]# scp mysql-all.sql  root@172.16.1.51:/tmp
```

### 7.5.2.db01数据库服务器操作如下

```java
1）将web01服务器上推送的数据库备份文件恢复至db01服务器新数据库中
[root@db01 ~]# yum install mariadb mariadb-server -y
[root@db01 ~]# systemctl start mariadb
[root@db01 ~]# systemctl enable mariadb
[root@db01 ~]# mysql -uroot -p'123456' < /tmp/mysql-all.sql 
2）数据库导入完成后，重启数据库，使用新密码进行登录，并检查数据库已被导入成功
[root@db01 ~]# systemctl restart mariadb
[root@db01 ~]# mysql -uroot -p123456.com
mysql> show databases;
3）在新数据库上授权，允许所有网段，通过所有oldboy账户连接并操作该数据库
#授权所有权限   grant all privileges
#授权所有库所有表 *.* （前面的*代表所有库，后面的*代表所有表）
#将授权赋予给哪个用户，这个用户只能通过哪个网段过来(%所有) 'all'@'%'
#授权该用户登录的密码 identified by
mysql> grant all on  *.* to all@'%' identified by '123456';
Query OK, 0 rows affected (0.00 sec)
###客户端测试远程账号是否能连接数据库：
[root@web01 ~]# mysql -h 172.16.1.51 -uoldboy -p123456
注意：客户端必须安装了mysql客户端才能测试。
```

### 7.5.3.web01修改代码连接新数据库环境

```java
1）修改Wordpress产品代码连接数据库的配置文件
[root@web01 ~]# vim /code/wordpress/wp-config.php
# 数据库名称
define('DB_NAME', 'wordpress');
# 数据库用户
define('DB_USER', 'oldboy');
# 数据库密码
define('DB_PASSWORD', '123456');
# 数据库地址
define('DB_HOST', '172.16.1.51');
2）修改wecenter产品代码连接数据库的配置文件
[root@web01 zh]#  grep -iR 123456"|grep -v cache
system/config/database.php:  'password' => '123456',
[root@web01 zh]# vim /code/zh/system/config/database.php
'host' => '172.16.1.51',
'username' => 'oldboy',
'password' => '123456',
'dbname' => 'zh',
3）最后访问网站，成功打开，至此拆分数据库完成
```

## 8.扩展多台相同的web服务器

## 8.1.为什么要扩展多台web节点

单台web服务器能抗住的访问量是有限的，配置多台网服务器能提升更高的访问速度。

## 8.2.扩展多台web解决了什么问题

**1、** 单台web节点如果故障，会导致业务down机；

**2、** 多台web节点能保证业务的持续稳定，扩展性高；

**3、** 多台web节点能有效的提升用户访问网站的速度；

## 8.3.多台web节点技术架构组成，如下图所示

## 8.4.快速扩展一台网络节点环境规划

主机名称
应用环境
外网地址
内网地址

WEB01
nginx的PHP +
10.0.0.7
172.16.1.7

web02
nginx的PHP +
10.0.0.8
172.16.1.8

DB01
MySQL的

172.16.1.51

## 8.5.快速扩展一台web节点详细步骤

通过WEB01现有环境快速的扩展一台web02的服务器，数据库统一使用DB01

```java
1）创建www用户
[root@web02 ~]# groupadd -g666 www
[root@web02 ~]# useradd -u666 -g666 www
2）安装LNP
[root@web02 ~]# scp -rp root@172.16.1.7:/etc/yum.repos.d/* /etc/yum.repos.d/
[root@web02 ~]# yum install nginx -y
[root@web02 ~]# yum -y install php71w php71w-cli php71w-common php71w-devel php71w-embedded php71w-gd php71w-mcrypt php71w-mbstring php71w-pdo php71w-xml php71w-fpm php71w-mysqlnd php71w-opcache php71w-pecl-memcached php71w-pecl-redis php71w-pecl-mongodb
3）将web01的nginx配置文件导入到web02
[root@web02 ~]# scp -rp root@172.16.1.7:/etc/nginx /etc/
4）将web01的php配置文件导入到web02 (/etc/php-fpm.conf /etc/php-fpm.d /etc/php.ini)
[root@web02 ~]# rsync -avz --delete root@172.16.1.7:/etc/php* /etc/  (后面与前面保持一直)
5）将web01的产品代码打包传输到web02服务器上，在web1上进行打包操作
[root@web01 ~]# tar zcf code.tar.gz /code
[root@web01 ~]# scp code.tar.gz root@172.16.1.8:/tmp
#在web02服务器上进行解压
[root@web02 ~]# tar xf /tmp/code.tar.gz -C /
6）最后启动nginx与php-fpm，并加入开机自启
[root@web03 ~]# systemctl start nginx php-fpm 
[root@web03 ~]# systemctl enable nginx php-fpm
```

## 9.拆分静态资源至独立服务器

## 9.1.拆分为什么静态资源至独立存储服务器

当后端的web节点出现多台时，会导致用户上传的图片，视频附件等内容仅上传至一台网络服务器，那么其他的网络服务器则无法访问到该图片。

## 9.2.新增一台nfs存储服务器解决了什么问题

**1、** 保证了多台web节点静态资源一致；

**2、** 有效节省多台web节点的存储空间；

**3、** 统一管理静态资源，便于后期推送至CDN进行静态资源加速；

## 9.3.多台web节点技术架构组成，如下图所示

## 9.4.快速扩展一台网络节点环境规划

主机名称
应用环境
外网地址
内网地址

WEB01
nginx+PHP
10.0.0.7
172.16.1.7

web02
nginx+PHP
10.0.0.8
172.16.1.8

NFS
NFS

172.16.1.31

DB01
MySQL

172.16.1.51

## 9.5.快速扩展一台web节点详细步骤

### 9.5.1.nfs服务端，操作步骤如下

```java
1）安装并配置nfs
[root@nfs ~]# yum install nfs-utils -y
[root@nfs ~]# cat /etc/exports
/data/blog 172.16.1.0/24(rw,sync,all_squash,anonuid=666,anongid=666)
/data/zh 172.16.1.0/24(rw,sync,all_squash,anonuid=666,anongid=666)
2）创建共享目录，并进行授权
[root@nfs01 ~]# mkdir /data/{blog,zh} -p
[root@nfs01 ~]# chown -R www.www /data/
3）启动nfs服务，并加入开机自启
[root@nfs01 ~]# systemctl restart nfs-server
```

### 9.5.2.web01端操作步骤如下

```java
1）web01节点安装nfs，然后使用showmount查看服务端共享的资源
[root@web01 ~]# yum install nfs-utils -y
[root@web01 ~]# showmount -e 172.16.1.31
Export list for 172.16.1.31:
/data/zh   172.16.1.0/24
/data/blog 172.16.1.0/24
2）如何查找Wordpress静态资源存放的位置
浏览器->右键->检查->Network->选择左上角的Select按钮->点击对应的图片，然后能获取到对应的url地址，如下
# http://blog.tuchuang.com/wp-content/uploads/2019/01/121716bnb4pgdj6b6gspjq-1024x576.jpg
3）备份web01服务器上Wordpress的静态资源，因为该服务器上的资源资源最全(意思就是备份一台静态资源最多的服务器)
[root@web01 ~]# cd /code/wordpress/wp-content
[root@web01 wp-content]# scp -rp uploads/* root@172.16.1.31:/data/blog/
4）web01客户端执行挂载操作
[root@web01 wp-content]# mount -t nfs 172.16.1.31:/data/blog /code/wordpress/wp-content/uploads/
5）将挂载信息加入开机自启
[root@web01 wp-content]# tail -1 /etc/fstab 
172.16.1.31:/data/blog  /code/wordpress/wp-content/uploads nfs defaults 0 0
[root@web01 wp-content]# mount -a
```

### 9.5.3.web02端，操作步骤如下

```java
1）web02客户端直接挂载nfs即可
[root@web02 ~]# mount -t nfs 172.16.1.31:/data/blog /code/wordpress/wp-content/uploads/
2）将挂载信息加入开机自启
[root@web02 ~]# tail -1 /etc/fstab 
172.16.1.31:/data/blog  /code/wordpress/wp-content/uploads nfs defaults 0 0
[root@web02 ~]# mount -a
```
