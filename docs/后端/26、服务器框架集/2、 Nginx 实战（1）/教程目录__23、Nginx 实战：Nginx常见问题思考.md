# 23、Nginx 实战：Nginx常见问题思考
- 来源：https://ddkk.com/zhuanlan/server/nginx/2/23.html
- 分类：服务器框架
- 分组：教程目录
## 一、Nginx多server优先级

在开始处理一个http请求时，nginx会取出header头中的Host变量，与nginx.conf中的每个server_name进行匹配，以此决定到底由哪一个server来处理这个请求，但nginx如何配置多个相同的server_name，会导致server_name出现优先级访问冲突。

### 1.准备多个配置文件

```java
[root@web01 /etc/nginx/conf.d]# vim test1.conf
server {
    listen 80;
    server_name localhost test1.com;
    location / {
        root /code/test1;
        index index.html;
    }
}
[root@web01 /etc/nginx/conf.d]# vim test2.conf
server {
    listen 80;
    server_name localhost test2.com;
    location / {
        root /code/test2;
        index index.html;
    }
}
[root@web01 /etc/nginx/conf.d]# vim test3.conf
server {
    listen 80;
    server_name localhost test3.com;
    location / {
        root /code/test3;
        index index.html;
    }
}
[root@web01 conf.d]#
```

### 2.配置多个站点文件

```java
[root@web01 /etc/nginx/conf.d]# mkdir /code/test{1..3}
[root@web01 /etc/nginx/conf.d]# echo test1111111111111 > /code/test1/index.html
[root@web01 /etc/nginx/conf.d]# echo test2222222222222 > /code/test2/index.html
[root@web01 /etc/nginx/conf.d]# echo test3333333333333 > /code/test3/index.html
```

### 3.配置hosts请求页面

```java
10.0.0.7 test1.com test2.com test3.com
#请求域名时，可以请求到域名对应的页面，请求IP时，返回的页面时配置文件中第一个配置的站点
```

### 4.多server优先级总结

```java
#在开始处理一个HTTP请求时，Nginx会读取header（请求头）中的host（域名），与每个server中的server_name进行匹配，来决定用哪一个server标签来完成处理这个请求，有可能一个Host与多个server中的server_name都匹配，这个时候就会根据匹配优先级来选择实际处理的server。优先级匹配结果如下：
1.首先选择所有的字符串完全匹配的server_name。（完全匹配）
2.选择通配符在前面的server_name，如 *.test.com  （blog.test.com）
3.选择通配符在后面的server_name，如 www.test.*  （www.test.com www.test.cn）
4.最后选择使用正则表达式匹配的server_name
5.如果全部都没有匹配到，那么将选择在listen配置项后加入[default_server]的server块
6.如果没写，那么就找到匹配listen端口的第一个Server块的配置文件
```

### 5.多server优先级配置测试

```java
#配置
[root@web01 /etc/nginx/conf.d]# cat server1.conf 
server {
    listen 80;
    server_name localhost linux.test.com;
    location / {
        root /code/server1;
        index index.html;
    }
}
[root@web01 /etc/nginx/conf.d]# cat server2.conf 
server {
    listen 80;
    server_name localhost *.test.com;
    location / {
        root /code/server2;
        index index.html;
    }
}
[root@web01 /etc/nginx/conf.d]# cat server3.conf 
server {
    listen 80;
    server_name localhost linux.test.*;
    location / {
        root /code/server3;
        index index.html;
    }
}
[root@web01 /etc/nginx/conf.d]# cat server4.conf 
server {
    listen 80;
    server_name localhost ~^linux\.(.*)\.com$;
    location / {
        root /code/server4;
        index index.html;
    }
}
[root@web01 /etc/nginx/conf.d]# cat server5.conf 
server {
    listen 80 default_server;
    server_name localhost;
    location / {
        root /code/server5;
        index index.html;
    }
}
#站点文件
[root@web01 /etc/nginx/conf.d]# echo linux.test.com > /code/server1/index.html
[root@web01 /etc/nginx/conf.d]# echo *.test.com > /code/server2/index.html
[root@web01 /etc/nginx/conf.d]# echo linux.test.* > /code/server3/index.html
[root@web01 /etc/nginx/conf.d]# echo '~^linux\.(.*)\.com$' > /code/server4/index.html
[root@web01 /etc/nginx/conf.d]# echo default_server > /code/server5/index.html
```

### 6.测试优先级

```java
#配置hosts
10.0.0.7 linux.test.com
#访问测试
压缩配置，测试
压缩配置，测试
```

## 二、Nginx禁止IP地址访问网站

### 1.禁止IP访问直接返回错误

```java
[root@web01 /etc/nginx/conf.d]# vim a_ip.conf
server {
    listen 80 default_server;
    server_name localhost;
    return 500;
}
```

### 2.引流的方式跳转页面

```java
[root@web01 /etc/nginx/conf.d]# vim a_ip.conf
server {
    listen 80 default_server;
    server_name localhost;
    rewrite (.*) http://www.baidu.com$1;
   return 302 http://www.baidu.com$request_uri;
}
```

### 3.返回指定内容

```java
[root@web01 /etc/nginx/conf.d]# vim a_ip.conf
server {
    listen 80 default_server;
    server_name localhost;
    default_type text/plain;
    return 200 "请请求其他页面...或使用域名请求！";
}
```

## 三、Nginx的include

```java
一台服务器配置多个网站，如果配置都写在nginx.conf主配置文件中，会导致nginx.conf主配置文件变得非常庞大而且可读性非常的差。那么后期的维护就变得麻烦。 
假设现在希望快速的关闭一个站点，该怎么办？ 
1.如果是写在nginx.conf中，则需要手动注释，比较麻烦 
2.如果是include的方式，那么仅需修改配置文件的扩展名，即可完成注释 Include包含的作用是为了简化主配置文件，便于人类可读。
inlcude /etc/nginx/online/*.conf 	#线上使用的配置
mv /etc/nginx/online/test.conf /etc/nginx/offline/ 	#保留配置，不启用（下次使用在移动到online中）
```

## 四、Nginx的root和alias

```java
root与alias路径匹配主要区别在于nginx如何解释location后面的uri，这会使两者分别以不同的方式将请求映射到服务器文件上，alias是一个目录别名的定义，root则是最上层目录的定义。
root的处理结果是：root路径＋location路径
alias的处理结果是：使用alias定义的路径
```

### 1.root配置

```java
[root@web01 /etc/nginx/conf.d]# vim root.conf 
server {
    listen 80;
    server_name linux.root.com;
    location /download {
        root /code;
    }
}
#使用root时，当我请求 http://linux.root.com/download/1.jpg 时，实际上是去找服务器上 /code/download/1.jpg 文件
```

### 2.alias配置

```java
[root@web01 ~]# vim /etc/nginx/conf.d/alias.conf 
server {
    listen 80;
    server_name linux.alias.com;
    location /download {
        alias /code;
    }
}
#使用alias时，当我请求 http://linux.root.com/download/1.jpg 时，实际上是去找服务器上 /code/1.jpg 文件
```

### 3.企业中的配置

```java
server {
    listen 80;
    server_name image.driverzeng.com;
    location / {
        root /code;
    }
    location ~* ^.*\.(png|jpg|gif)$ {
        alias /code/images/;
    }
}
#注意：
URL: http://linux.root.com/download/1.jpg
URI: /download/1.jpg
$request_filename: /code/download/1.jpg
$request_uri: /download/1.jpg
```

## 五、Nginx的try_file路径匹配

```java
nginx的try_file路径匹配，Nginx会按顺序检查文件及目录是否存在（根据 root 和 alias 指令设置的参数构造完整的文件路径），并用找到的第一个文件提供服务。在元素名后面添加斜杠 / 表示这个是目录。如果文件和目录都不存在，Nginx会执行内部重定向，跳转到命令的最后一个 uri 参数定义的 URI 中。
```

### 1.配置try_files

```java
[root@web01 /etc/nginx/conf.d]# vim t_file.conf
server {
    listen 80;
    server_name linux.try.com;
    location / {
        root /code/try;
       index index.html index.htm;
        try_files $uri /404.html;
    }
}
```

### 2.创建站点

```java
[root@web01 ~]# mkdir /code/try
[root@web01 /code/try]# echo try_file_index.html > index.html
[root@web01 /code/try]# echo '404 404 404' > 404.html
```

### 3.访问测试

```java
1.当访问 linux.try.com ，结果返回的是404.html
由于请求的是域名，后面没有URI，所以$uri匹配为空，匹配不到内容则返回404.html
2.当访问 linux.try.com/index.html，返回的结果是 index.html
请求的域名后面URI是/index.html ，所以$uri匹配到 /index.html，返回 /code/try/index.html
```

### 4.修改nginx配置

```java
[root@web01 /etc/nginx/conf.d]# vim t_file.conf
server {
    listen 80;
    server_name linux.try.com;
    location / {
        root /code/try;
       index index.html index.htm;
        try_files $uri $uri/ /404.html;
    }
}
1.当访问 linux.try.com ，结果返回的是index.html
	请求的是域名，后面没有URI，所以$uri匹配为空
	然后 $uri/ 匹配到了 '空'/，相当于请求站点目录，默认返回站点目录下的 index.html
	如果仍然匹配不到内容则返回 404.html
```

### 5.try_files应用

```java
[root@web01 /code/try]# vim /etc/nginx/conf.d/t_file.conf 
server {
    listen 80;
    server_name linux.try.com;
    location / {
        root /code/try;
       index index.html index.htm;
        try_files $uri $uri/ @java;
    }
    location @java {
        proxy_pass http://172.16.1.8:8080;
	}
}
```

## 六、nginx调整上传文件大小

### 1.nginx配置上传文件大小语法

```java
Syntax:  client_max_body_size size;
Default: client_max_body_size 1m;
Context: http, server, location
```

### 2.nginx配置上传文件大小示例

```java
#也可以放入http层，全局生效
server {
    listen 80;
    server_name _;
    client_max_body_size 200m;
}
```

## 七、nginx优雅的显示错误界面

### 1.跳转到网上

```java
#error_page配置的是http这种的网络地址
[root@web01 conf.d]# cat error.conf 
server {
    listen       80;
    server_name  linux.error.com;
    location / {
		root /code/error;
        index index.html;
        error_page 404 http://www.baidu.com;
    }
}
```

### 2.跳转本地文件

```java
[root@web01 /code/error]# vim /etc/nginx/conf.d/error.conf
server {
    listen 80;
    server_name  linux.error.com;
    location / {
        root /code/error;
        index index.html;
        error_page 404 403 /404.jpg;
    }
}
```

### 3.访问PHP的错误页面跳转

```java
[root@web01 /code/error]# vim /etc/nginx/conf.d/error.conf
server {
    listen 80;
    server_name  linux.error.com;
    root /code/error;
    index index.php;
    error_page 404 403 /404.html;
    location ~* \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
        if (!-e $request_filename) {
            rewrite (.*) http://linux.error.com/404.jpg;
        }
    }
}
```
