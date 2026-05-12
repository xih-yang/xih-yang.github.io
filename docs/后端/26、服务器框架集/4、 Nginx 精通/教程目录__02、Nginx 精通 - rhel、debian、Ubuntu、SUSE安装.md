# 02、Nginx 精通 - rhel、debian、Ubuntu、SUSE安装
- 来源：https://ddkk.com/zhuanlan/server/nginx/4/2.html
- 分类：服务器框架
- 分组：教程目录
本文主要讲述Nginx在Linux下的yum安装方式。

Yum安装一般用root模式。

## 安装方式

在Linux下，Nginx安装有源码编译安装和yum(不同OS可能命令名字不一样)直接安装两种方式。两种方式优缺点如下：

**源码编译安装**

- 优点：灵活性高定制性强，可以根据需要自定义编译选项和功能；可以跨平台使用
- 缺点：安装过程复杂；不能解决软件依赖问题；管理不方便，没有自动升级卸载机制

**YUM 安装**

- 优点：自动解决软件包的依赖关系；管理方便，提供软件包的安装、升级、卸载和搜索等功能
- 缺点：缺少定制化，不能自定义功能；更新滞后，某些发行版的官方仓库可能不及时提供最新版本的软件包

另yum安装不包括下列动态模块：

nginx-module-geoip

nginx-module-image-filter

nginx-module-njs

nginx-module-perl

nginx-module-xslt

如有用到，需在ngixn.conf用load_module导入使用

## yum安装

### RHEL安装

支持版本：RHEL7.4+，8.x，9.x 包括CentOS, Oracle Linux, Rocky Linux, AlmaLinux.

**1、** 安装yum套件工具；

```java
yum install yum-utils
```

**2、** 创建yum库/etc/yum.repos.d/nginx.repo，内容如下：；

```java
[nginx-stable]
name=nginx stable repo
baseurl=http://nginx.org/packages/centos/$releasever/$basearch/
gpgcheck=1
enabled=1
gpgkey=https://nginx.org/keys/nginx_signing.key
module_hotfixes=true
[nginx-mainline]
name=nginx mainline repo
baseurl=http://nginx.org/packages/mainline/centos/$releasever/$basearch/
gpgcheck=1
enabled=0
gpgkey=https://nginx.org/keys/nginx_signing.key
module_hotfixes=true
```

**3、** 安装指令；

```java
yum install nginx
```

默认安装nginx-stable版本，如果要安装nginx-mainline，用下面命令切换后再安装

```java
yum-config-manager --enable nginx-mainline
```

**4、** 启动；

```java
systemctl start nginx
```

**5、** 如果有新版本，用下面命令升级；

```java
yum update nginx
```

### Debian安装

支持版本：Debian11.x，12.x

**1、** 安装环境；

```java
apt install curl gnupg2 ca-certificates lsb-release debian-archive-keyring
```

**2、** 导入一个官方的nginx签名密钥，以便apt可以验证包的真实性获取密钥：；

```java
curl https://nginx.org/keys/nginx_signing.key | gpg --dearmor \
    | sudo tee /usr/share/keyrings/nginx-archive-keyring.gpg >/dev/null
```

**3、** 验证下载的文件是否包含正确的密钥：；

```java
gpg --dry-run --quiet --no-keyring --import --import-options import-show /usr/share/keyrings/nginx-archive-keyring.gpg
```

输出应包含完整指纹573BFD6B3D8FBC641079A6ABABF5BD827BD9BF62，如下所示：

```java
pub   rsa2048 2011-08-19 [SC] [expires: 2024-06-14]
      573BFD6B3D8FBC641079A6ABABF5BD827BD9BF62
uid                      nginx signing key <signing-key@nginx.com>
```

如果指纹不同，请删除该文件。

**4、** 设置apt存储库；

```java
echo "deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] \
http://nginx.org/packages/debian lsb_release -cs nginx" \
    | sudo tee /etc/apt/sources.list.d/nginx.list
```

**5、** 默认安装nginx-stable版本，如果要安装nginx-mainline，用下面命令；

```java
echo "deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] \
http://nginx.org/packages/mainline/debian lsb_release -cs nginx" \
    | sudo tee /etc/apt/sources.list.d/nginx.list
```

**6、** 设置存储库固定，使我们的包比分发提供的包更受欢迎：；

```java
echo -e "Package: *\nPin: origin nginx.org\nPin: release o=nginx\nPin-Priority: 900\n" \
    | sudo tee /etc/apt/preferences.d/99nginx
```

**7、** 安装；

```java
apt update
apt install nginx
```

安装好后自动启动。

### Ubuntu安装

支持版本：Ubuntu20.x, 22.x,23.x

**1、** 安装环境；

```java
apt install curl gnupg2 ca-certificates lsb-release ubuntu-keyring
```

**2、** 导入一个官方的nginx签名密钥，以便apt可以验证包的真实性获取密钥：；

```java
curl https://nginx.org/keys/nginx_signing.key | gpg --dearmor \
    | sudo tee /usr/share/keyrings/nginx-archive-keyring.gpg >/dev/null
```

**3、** 验证下载的文件是否包含正确的密钥：；

```java
gpg --dry-run --quiet --no-keyring --import --import-options import-show /usr/share/keyrings/nginx-archive-keyring.gpg
```

输出应包含完整指纹573BFD6B3D8FBC641079A6ABABF5BD827BD9BF62 ，如下所示：

```java
pub   rsa2048 2011-08-19 [SC] [expires: 2024-06-14]
      573BFD6B3D8FBC641079A6ABABF5BD827BD9BF62
uid                      nginx signing key <signing-key@nginx.com>
```

如果指纹不同，请删除该文件。

**4、** 设置apt存储库；

```java
echo "deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] \
http://nginx.org/packages/ubuntu lsb_release -cs nginx" \
    | sudo tee /etc/apt/sources.list.d/nginx.list
```

**5、** 默认安装nginx-stable版本，如果要安装nginx-mainline，用下面命令；

```java
echo "deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] \
http://nginx.org/packages/mainline/ubuntu lsb_release -cs nginx" \
    | sudo tee /etc/apt/sources.list.d/nginx.list
```

**6、** 设置存储库固定，使我们的包比分发提供的包更受欢迎：；

```java
echo -e "Package: *\nPin: origin nginx.org\nPin: release o=nginx\nPin-Priority: 900\n" \
    | sudo tee /etc/apt/preferences.d/99nginx
```

**7、** 安装；

```java
apt update
apt install nginx
```

**8、** 启动；

```java
service nginx start
```

### SUSE安装

支持版本：SUSE SP5+, 15 SP2+

**1、** 安装环境；

```java
zypper install curl ca-certificates gpg2
```

**2、** 设置apt存储库；

```java
zypper addrepo --gpgcheck --type yum --refresh --check \
    'http://nginx.org/packages/sles/$releasever_major' nginx-stable
```

**3、** 默认安装nginx-stable版本，如果要安装nginx-mainline，用下面命令；

```java
zypper addrepo --gpgcheck --type yum --refresh --check \
    'http://nginx.org/packages/mainline/sles/$releasever_major' nginx-mainline
```

**4、** 导入一个官方的nginx签名密钥，这样zypper/rpm就可以验证包的真实性：；

```java
curl -o /tmp/nginx_signing.key https://nginx.org/keys/nginx_signing.key
```

**5、** 验证下载的文件是否包含正确的密钥：；

```java
gpg --with-fingerprint /tmp/nginx_signing.key
```

输出应包含完整指纹573B FD6B 3D8F BC64 1079 A6AB ABF5 BD82 7BD9 BF62，如下所示：

```java
pub  2048R/7BD9BF62 2011-08-19 [expires: 2024-06-14]
      Key fingerprint = 573B FD6B 3D8F BC64 1079  A6AB ABF5 BD82 7BD9 BF62
uid nginx signing key <signing-key@nginx.com>
```

如果指纹不同，请删除该文件。

**6、** 将密钥导入rpm数据库：；

```java
rpmkeys --import /tmp/nginx_signing.key
```

**7、** 安装；

```java
zypper install nginx
```

**8、** 启动；

```java
/usr/local/nginx/sbin/nginx 启动nginx
/usr/local/nginx/sbin/nginx -c /usr/local/nginx/conf/nginx.conf 配置文件方式启动
```

### 验证命令

yum安装后，自动安装为服务。查看命令如下：

其它命令：

nginx -h 查看帮助

nginx -v

显示NGINX 版本。

nginx -V

显示NGINX 版本、build 信息和配置参数，这些参数显示了 NGINX 二进制文件中内置的模块。

## 源码安装

源码安装相对比较复杂，通常步骤如下：

**1、** 安装支持环境（不同系统及版本要求都不一样）；

**2、** 下载源码并解压；

**3、** 进入源码目录；

**4、** 构建Makefile：./configure[-options]；

**5、** 编译：make；

**6、** 安装：makeinstall；

**7、** 加为服务，并开机自启动；

**8、** 启动验证；

真正要安装请百度相关文章。

源码安装的目的通常是为了定制性，在configure步进行；本文详细./configure的编译选项(加粗表示常用项)：

**–prefix=path**

定义将保存服务器文件的目录。这个目录也将用于configure和nginx.conf配置文件中设置的所有相对路径（到库源的路径除外）。默认情况下，它被设置为/usr/local/nginx目录。

–sbin-path=path

设置nginx可执行文件的名称。此名称仅在安装过程中使用。默认情况下，文件名为prefix/sbin/nginx。

–modules-path=path

定义了nginx动态模块的安装目录。默认情况下，使用 prefix/modules。

–conf-path=path

设置nginx.conf配置文件的名称。如果需要，nginx总是可以通过在命令行参数-c文件中指定一个不同的配置文件来启动。默认情况下，文件名为prefix/conf/nginx.conf。

–error-log-path=path

设置主要错误、警告和诊断文件的名称。安装后，可以使用error_log指令在nginx.conf配置文件中更改文件名。默认情况下，文件名为prefix/logs/error.log。

–pid-path=path

设置nginx.pid文件的名称，该文件将存储主进程的进程ID。安装后，可以使用pid指令在nginx.conf配置文件中更改文件名。默认情况下，文件名为prefix/logs/nginix.pid。

–lock-path=path

为锁定文件的名称设置前缀。安装后，可以使用lock_file指令在nginx.conf配置文件中更改该值。默认情况下，该值为prefix/logs/nginix.lock。

–user=name

设置工作进程将使用其凭据的无特权用户的名称。安装后，可以使用user指令在nginx.conf配置文件中更改名称。默认用户名为nobody。

–group=name

设置工作进程将使用其凭据的组的名称。安装后，可以使用user指令在nginx.conf配置文件中更改名称。默认情况下，组名称设置为无特权用户的名称。

–build=name

设置一个可选的nginx构建名称。

–builddir=path

设置生成目录。

–with-select_module

–without-select_module

启用或禁用构建允许服务器使用select（）方法的模块。如果平台似乎不支持更合适的方法，如kqueue、epoll或/dev/poll，则会自动构建此模块。

–with-poll_module

–without-poll_module

启用或禁用构建允许服务器使用poll（）方法的模块。如果平台似乎不支持更合适的方法，如kqueue、epoll或/dev/poll，则会自动构建此模块。

–with-threads

允许使用线程池。

–with-file-aio

允许在FreeBSD和Linux上使用异步文件I/O（AIO）。

**–with-http_ssl_module**

允许构建一个模块，将HTTPS协议支持添加到HTTP服务器。默认情况下不会生成此模块。构建和运行此模块需要OpenSSL库。

**–with-http_v2_module**

能够构建一个支持HTTP/2的模块。默认情况下不会生成此模块。

**–with-http_v3_module**

能够构建一个支持HTTP/3的模块。默认情况下不会生成此模块。建议使用提供HTTP/3支持的SSL库来构建和运行此模块，如BoringSSL、LibreSSL或QuicTLS。否则，如果使用OpenSSL库，将使用不支持QUIC早期数据的OpenSSL兼容层。

–with-http_realip_module

允许构建ngx_http_realip_module模块，该模块将客户端地址更改为指定标头字段中发送的地址。默认情况下不会生成此模块。

–with-http_addition_module

允许构建ngx_http_adition_module模块，该模块在响应前后添加文本。默认情况下不会生成此模块。

–with-http_xslt_module

–with-http_xslt_module=dynamic

允许构建ngx_http_xslt_module模块，该模块使用一个或多个xslt样式表转换XML响应。默认情况下不会生成此模块。构建和运行此模块需要libxml2和libxslt库。

–with-http_image_filter_module

–with-http_image_filter_module=dynamic

允许构建ngx_http_image_filter_module模块，该模块可将图像转换为JPEG、GIF、PNG和WebP格式。默认情况下不会生成此模块。

–with-http_geoip_module

–with-http_geoip_module=dynamic

允许构建ngx_http_geoip_module模块，该模块根据客户端IP地址和预编译的MaxMind数据库创建变量（客户端ip和地理位置映射）。默认情况下不会生成此模块。

–with-http_sub_module

允许构建ngx_http_sub_module模块，该模块通过用另一个指定字符串替换一个指定的字符串来修改响应。默认情况下不会生成此模块。

–with-http_dav_module

允许构建ngx_http_dav_module模块，该模块通过WebDAV协议提供文件管理自动化。默认情况下不会生成此模块。

–with-http_flv_module

允许构建ngx_http_flv_module模块，该模块为Flash Video（flv）文件提供伪流式服务器端支持。默认情况下不会生成此模块。

–with-http_mp4_module

允许构建ngx_http_mp4_module模块，该模块为mp4文件提供伪流服务器端支持。默认情况下不会生成此模块。

–with-http_gunzip_module

允许为不支持“gzip”编码方法的客户端构建ngx_http_gunzip模块，该模块使用“内容编码：gzip”来解压缩响应。默认情况下不会生成此模块。

–with-http_gzip_static_module

允许构建ngx_http_gzip_static_module模块，该模块允许发送文件扩展名为“.gz”的预压缩文件，而不是常规文件。默认情况下不会生成此模块。

–with-http_auth_request_module

允许构建ngx_http_auth_request_module模块，该模块根据子请求的结果实现客户端授权。默认情况下不会生成此模块。

–with-http_random_index_module

允许构建ngx_http_random_index_module模块，该模块处理以斜杠（“/”）结尾的请求，并在目录中选择一个随机文件作为索引文件。默认情况下不会生成此模块。

–with-http_secure_link_module

允许构建ngx_http_secure_link_module模块。默认情况下不会生成此模块。

–with-http_degradation_module

允许构建ngx_http_degradation_module模块。默认情况下不会生成此模块。

–with-http_slice_module

允许构建ngx_http_slice_module模块，该模块将请求拆分为子请求，每个子请求返回一定范围的响应。该模块提供了更有效的大响应缓存。默认情况下不会生成此模块。

–with-http_stub_status_module

允许构建ngx_http_stub_status_module模块，该模块提供对基本状态信息的访问。默认情况下不会生成此模块。

–without-http_charset_module

禁用构建ngx_http_charset_module模块，该模块将指定的字符集添加到“内容类型”响应标头字段，并可以将数据从一个字符集转换为另一个字符。

–without-http_gzip_module

禁止构建压缩HTTP服务器响应的模块。zlib库是构建和运行此模块所必需的。

–without-http_ssi_module

禁用生成ngx_http_ssi_module模块，该模块在通过它的响应中处理ssi（服务器端包含）命令。

–without-http_userid_module

禁用构建ngx_http_userid_module模块，该模块设置适用于客户端标识的cookie。

–without-http_access_module

禁用构建ngx_http_access_module模块，该模块允许限制对某些客户端地址的访问。

–without-http_auth_basic_module

禁用构建ngx_http_auth_basic_module模块，该模块允许通过使用“http基本身份验证”协议验证用户名和密码来限制对资源的访问。

–without-http_mirror_module

禁用构建ngx_http_mirror_module模块，该模块通过创建后台镜像子请求来实现原始请求的镜像。

–without-http_autoindex_module

禁用生成ngx_http_autoindex_module模块，该模块处理以斜杠（“/”）结尾的请求，并在ngx_http_index_module模件找不到索引文件时生成目录列表。

–without-http_geo_module

禁用构建ngx_http_geo_module模块，该模块根据客户端IP地址创建值变量。

–without-http_map_module

禁用构建ngx_http_map_module模块，该模块创建的变量的值取决于其他变量的值。

–without-http_split_clients_module

禁用构建ngx_http_split_clients_module模块，该模块为A/B测试创建变量。

–without-http_referer_module

禁用生成ngx_http_referer_module模块，该模块可以阻止“referer”标头字段中具有无效值的请求访问站点。

–without-http_rewrite_module

禁止构建允许HTTP服务器重定向请求和更改请求URI的模块。构建和运行此模块需要PCRE库。

–without-http_fastcgi_module

禁用构建将请求传递到fastcgi服务器的ngx_http_fastcgi_module模块。

–without-http_uwsgi_module

禁用构建将请求传递到uwsgi服务器的ngx_http_uwsgi_module模块。

–without-http_scgi_module

禁用生成将请求传递到scgi服务器的ngx_http_scgi_module模块。

–without-http_grpc_module

禁用生成将请求传递到grpc服务器的ngx_http_grpc_module模块。

–without-http_memcached_module

禁用生成从memcached服务器获取响应的ngx_http_memcached_module模块。

–without-http_limit_conn_module

禁用构建ngx_http_limit_conn_module模块，该模块限制每个密钥的连接数，例如，来自单个IP地址的连接数。

–without-http_limit_req_module

禁用构建ngx_http_limit_req_module模块，该模块限制每个密钥的请求处理速率，例如，来自单个IP地址的请求的处理速率。

–without-http_empty_gif_module

禁用生成发出单像素透明GIF的模块。

–without-http_browser_module

禁用生成ngx_http_browser_module模块，该模块创建的变量的值取决于“用户代理”请求标头字段的值。

–without-http_upstream_hash_module

禁止生成实现哈希负载平衡方法的模块。

–without-http_upstream_ip_hash_module

禁用构建实现ip_hash负载平衡方法的模块。

–without-http_upstream_least_conn_module

禁用构建实现最小con负载平衡方法的模块。

–without-http_upstream_random_module

禁用构建实现随机负载平衡方法的模块。

–without-http_upstream_keepalive_module

禁用构建提供到服务器的连接缓存的模块。

–without-http_upstream_zone_module

禁止构建一个模块，该模块可以将上游组的运行时状态存储在共享内存区域中。

–with-http_perl_module

–with-http_perl_module=dynamic

允许构建嵌入式Perl模块。默认情况下不会生成此模块。

–with-perl_modules_path=path

定义了一个保存Perl模块的目录。

–with-perl=path

设置Perl二进制文件的名称。

–http-log-path=path

设置HTTP服务器的主请求日志文件的名称。安装后，可以使用access_log指令在nginx.conf配置文件中更改文件名。默认情况下，文件名为prefix/logs/access.log。

–http-client-body-temp-path=path

定义一个目录，用于存储包含客户端请求体的临时文件。安装后，可以使用client_body_temp_path指令在nginx.conf配置文件中更改目录。默认情况下，目录名为prefix/client_body_temp。

–http-proxy-temp-path=path

定义了一个目录，用于存储具有从代理服务器接收的数据的临时文件。安装后，可以使用proxy_temp_path指令在nginx.conf配置文件中更改目录。默认情况下，目录名为prefix/proxy_temp。

–http-fastcgi-temp-path=path

定义了一个目录，用于存储带有从FastCGI服务器接收的数据的临时文件。安装后，可以使用fastcgi_tmp_path指令在nginx.conf配置文件中更改目录。默认情况下，目录名为prefix/fastcgi_temp。

–http-uwsgi-temp-path=path

定义一个目录，用于存储带有从uwsgi服务器接收的数据的临时文件。安装后，可以使用uwsgi_temp_path指令在nginx.conf配置文件中更改目录。默认情况下，目录名为prefix/uwsgi_temp。

–http-scgi-temp-path=path

定义用于存储具有从SCGI服务器接收的数据的临时文件的目录。安装后，可以使用scgi_temp_path指令在nginx.conf配置文件中更改目录。默认情况下，目录名为prefix/scgi_temp。

–without-http

禁用HTTP服务器。

–without-http-cache

禁用HTTP缓存。

–with-mail

–with-mail=dynamic

启用POP3/IMAP4/SMTP邮件代理服务器。

–with-mail_ssl_module

允许构建一个模块，将SSL/TLS协议支持添加到邮件代理服务器。默认情况下不会生成此模块。构建和运行此模块需要OpenSSL库。

–without-mail_pop3_module

禁用邮件代理服务器中的POP3协议。

–without-mail_imap_module

禁用邮件代理服务器中的IMAP协议。

–without-mail_smtp_module

禁用邮件代理服务器中的SMTP协议。

–with-stream

–with-stream=dynamic

能够构建用于通用TCP/UDP代理和负载平衡的流模块。默认情况下不会生成此模块。

–with-stream_ssl_module

允许构建一个模块，将SSL/TLS协议支持添加到流模块中。默认情况下不会生成此模块。构建和运行此模块需要OpenSSL库。

–with-stream_realip_module

启用构建ngx_stream_realip_module模块，该模块将客户端地址更改为PROXY协议标头中发送的地址。默认情况下不会生成此模块。

–with-stream_geoip_module

–with-stream_geoip_module=dynamic

允许构建ngx_stream_geoip_module模块，该模块根据客户端IP地址和预编译的MaxMind数据库创建变量。默认情况下不会生成此模块。

–with-stream_ssl_preread_module

允许构建ngx_stream_ssl_preread_module模块，该模块允许在不终止ssl/TLS的情况下从ClientHello消息中提取信息。默认情况下不会生成此模块。

–without-stream_limit_conn_module

禁用构建ngx_stream_limit_conn_module模块，该模块限制每个密钥的连接数，例如，来自单个IP地址的连接数。

–without-stream_access_module

禁用构建ngx_stream_access_module模块，该模块允许限制对某些客户端地址的访问。

–without-stream_geo_module

禁用构建ngx_stream_geo_module模块，该模块创建具有取决于客户端IP地址的值的变量。

–without-stream_map_module

禁用构建ngx_stream_map_module模块，该模块创建的变量的值取决于其他变量的值。

–without-stream_split_clients_module

禁用构建ngx_stream_split_clients_module模块，该模块为A/B测试创建变量。

–without-stream_return_module

禁用构建ngx_stream_return_module模块，该模块向客户端发送一些指定值，然后关闭连接。

–without-stream_set_module

禁用构建为变量设置值的ngx_stream_set_module模块。

–without-stream_upstream_hash_module

禁止生成实现哈希负载平衡方法的模块。

-without-stream_upstream_least_conn_module

禁用构建实现最小con负载平衡方法的模块。

–without-stream_upstream_random_module

禁用构建实现随机负载平衡方法的模块。

–without-stream_upstream_zone_module

禁止构建一个模块，该模块可以将上游组的运行时状态存储在共享内存区域中。

–with-google_perftools_module

能够构建ngx_google_perftools_module模块，该模块能够使用谷歌性能工具对nginx工作进程进行分析。该模块是为nginx开发人员准备的，默认情况下不会构建。

–with-cpp_test_module

允许构建ngx_cpp_test_module模块。

–add-module=path

添加外部模块。

–add-dynamic-module=path

外部动态模块路径

–with-compat

实现动态模块兼容性。

–with-cc=path

设置C编译器的名称。

–with-cpp=path

设置C预处理器的名称。

–with-cc-opt=parameters

设置将添加到CFLAGS变量的其他参数。在FreeBSD下使用系统PCRE库时，应指定–withcc opt=“-I/usr/local/include”。如果select（）支持的文件数量需要增加，也可以在此处指定，例如：–with cc opt=“-D FD_SETSIZE=2048”。

–with-ld-opt=parameters

设置链接期间将使用的其他参数。在FreeBSD下使用系统PCRE库时，应指定–with ld opt=“-L/usr/local/lib”。

–with-cpu-opt=cpu

指定CPU构建：pentium、pentiumpro、pentium3、pentium4、athlon、optron、sparc32、sparc64、ppc64。

–with-pcre

–without-pcre

强制使用/禁用PCRE库的使用。

–with-pcre=path

设置到PCRE库的源的路径。需要从PCRE站点下载并提取库分发。其余部分由nginx完成/配置和制作。location指令中的正则表达式支持和ngx_http_rewrite_module模块都需要该库。

–with-pcre-opt=parameters

设置PCRE的其他构建选项。

–with-pcre-jit

构建具有“即时编译”支持的PCRE库（1.1.12，PCRE_jit指令）。

–without-pcre2

禁止使用PCRE2库而不是原始PCRE库（1.21.5）。

–with-zlib=path

设置zlib库的源的路径。库发行版（1.1.3-1.3版）需要从zlib站点下载并提取。其余部分由nginx完成/配置和制作。ngx_http_gzip_module模块需要该库。

–with-zlib-opt=parameters

为zlib设置额外的构建选项。

–with-zlib-asm=cpu

允许使用为指定CPU之一优化的zlib汇编程序源：pentium、pentiumpro。

–with-libatomic

强制使用libatomic_ops库。

–with-libatomic=path

设置指向libatomic_ops库源的路径。

–with-openssl=path

设置OpenSSL库源的路径。

–with-openssl-opt=parameters

为OpenSSL设置其他生成选项。

–with-debug

启用调试日志。
