# 03、Kubernetes - 实战：集群初始化配置
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/9/3.html
- 分类：容器服务
- 分组：教程目录
## 集群准备

生产环境服务器规划：

但是由于资源有限，本次环境只有 8 台 CentOS 7.9 的虚拟机，具体规划如下：

主机
IP
系统
配置
初始化安装服务

ops
192.168.2.40
CentOS 7.9
4C/4G/20G
docker，harbor，coredns（解析宿主机），cfssl

slb-01
192.168.2.11
CentOS 7.9
4C/2G/20G
nginx，keepalived

slb-02
192.168.2.12
CentOS 7.9
4C/2G/20G
nginx，keepalived

master-01
192.168.2.21
CentOS 7.9
4C/3G/20G
containerd，Kubernetes Master 组件

master-02
192.168.2.22
CentOS 7.9
4C/3G/20G
containerd，Kubernetes Master 组件

worker-01
192.168.2.31
CentOS 7.9
4C/4G/20G
containerd，Kubernetes Node 组件

worker-02
192.168.2.32
CentOS 7.9
4C/4G/20G
containerd，Kubernetes Node 组件

worker-03
192.168.2.33
CentOS 7.9
4C/4G/20G
containerd，Kubernetes Node 组件

VIP
192.168.2.100
/
/
keepalived 提供

## 修改主机名

根据主机的用途对主机名进行调整。

执行机器：`所有服务器`

```java
# 设置主机名
hostnamectl set-hostname xxx
# 主机名解析
echo "127.0.0.1 $(hostname)" >> /etc/hosts
```

## 关闭防火墙 / Selinux / Swap

为了避免额外的干扰，需要关闭防火墙，对于公有云，内网端口一般全开放，外网端口通过安全组控制。

执行机器：`所有服务器`

```java
# 关闭防火墙
systemctl stop firewalld
systemctl disable firewalld
# 关闭 Selinux
sed -i "s#^SELINUX=.*#SELINUX=disabled#g" /etc/selinux/config
setenforce 0
# 关闭 swap 分区，Swap 会影响性能
swapoff -a && sysctl -w vm.swappiness=0
sed -ri '/^[^#]*swap/s@^@#@' /etc/fstab
# 创建安装包目录
mkdir /opt/package
```

## YUM 源配置（云服务器不需要）

本地或者自建服务器都需要配置 YUM 源，如果是云服务器由于本身就有对应云的 YUM 源，不需要配置。

执行机器：`所有服务器`

```java
# 备份旧的 yum 源
cd /etc/yum.repos.d/
mkdir backup-$(date +%F)
mv *repo backup-$(date +%F)
# 添加阿里云 yum 源
curl http://mirrors.aliyun.com/repo/Centos-7.repo -o ali.repo
```

## 基础依赖安装

由于服务器最小化安装，需要安装一些常用的依赖和工具，否则后面安装可能会报错。

执行机器：`所有服务器`

```java
# 安装 epel 源
yum -y install epel-release
yum clean all
yum makecache
# 安装常用依赖
yum -y install gcc glibc gcc-c++ make cmake net-tools screen vim lrzsz tree dos2unix lsof \
    tcpdump bash-completion wget ntp setuptool openssl openssl-devel bind-utils traceroute \
    bash-completion bash-completion-extras glib2 glib2-devel unzip bzip2 bzip2-devel libevent libevent-devel \
    ntp expect pcre pcre-devel zlib zlib-devel jq psmisc tcping yum-utils device-mapper-persistent-data \
    lvm2 git device-mapper-persistent-data bridge-utils container-selinux binutils-devel \
    ncurses ncurses-devel elfutils-libelf-devel ack zip unzip socat
# 升级服务器
yum -y update
```

## 配置时间同步（云服务器不需要）

本地或者自建服务器都需要配置时间同步，如果是云服务器由于本身就有对应云的时间同步机制，不需要配置。

执行机器：`所有服务器`

```java
echo "# 互联网时间同步" >> /var/spool/cron/root
echo "*/5 * * * * /usr/sbin/ntpdate time2.aliyun.com >/dev/null 2>&1" >> /var/spool/cron/root
```

## 系统优化

对系统打开文件数进行修改，提升性能。

执行机器：`所有服务器`

```java
cat >> /etc/security/limits.conf << EOF
# 打开文件优化配置
* soft nofile 655360
* hard nofile 655350
* soft nproc 655350
* hard nproc 655350
* soft memlock unlimited
* hard memlock unlimited
EOF
```

## 内核升级

在Kubernetes 的 Github 仓库中：

> https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG/CHANGELOG-1.25.md

有提到关于内核版本的问题：

> Faster mount detection for linux kernel 5.10+ using openat2 speeding up pod churn rates. On Kernel versions less 5.10, it will fallback to using the original way of detecting mount points i.e by parsing /proc/mounts.

这意味着内核 5.10 版本以后会使用 openat2 进行更快的挂载检测，所有可以将内核升级到 5.10 以后，但没必要最新。

这里使用的是 `5.11.16` 版本，更新于 2021 年 4 月。如果想安装其它版本可以去下面网站下载：

> http://193.49.22.109/elrepo/kernel/el7/x86_64/RPMS/

内核升级所需安装包：

安装包
版本号
说明
下载地址

kernel-ml
5.11.16
Linux 内核
点击下载

kernel-ml-devel
5.11.16
Linux 内核
点击下载

升级安装。

执行机器：`所有服务器`

```java
# 下载安装
cd /opt/package
wget http://193.49.22.109/elrepo/kernel/el7/x86_64/RPMS/kernel-ml-5.11.16-1.el7.elrepo.x86_64.rpm
wget http://193.49.22.109/elrepo/kernel/el7/x86_64/RPMS/kernel-ml-devel-5.11.16-1.el7.elrepo.x86_64.rpm
yum localinstall -y kernel-ml*
# 设置内核启动顺序
grub2-set-default  0 && grub2-mkconfig -o /etc/grub2.cfg
# 查看默认内核
grubby --default-kernel
```

## 安装 ipvsadm

节点通信需要用到 LVS，所有需要安装 ipvsadm。

执行机器：`所有服务器`

```java
# 安装 ipvsadm
yum -y install ipvsadm ipset sysstat conntrack libseccomp
# 配置 ipvs 模块（内核 4.19 版本以前使用 nf_conntrack_ipv4，以后使用 nf_conntrack）
modprobe -- ip_vs
modprobe -- ip_vs_rr
modprobe -- ip_vs_wrr
modprobe -- ip_vs_sh
modprobe -- nf_conntrack
cat > /etc/modules-load.d/ipvs.conf << EOF
ip_vs
ip_vs_lc
ip_vs_wlc
ip_vs_rr
ip_vs_wrr
ip_vs_lblc
ip_vs_lblcr
ip_vs_dh
ip_vs_sh
ip_vs_fo
ip_vs_nq
ip_vs_sed
ip_vs_ftp
ip_vs_sh
nf_conntrack
ip_tables
ip_set
xt_set
ipt_set
ipt_rpfilter
ipt_REJECT
ipip
EOF
systemctl enable --now systemd-modules-load
```

## 内核调优

添加内核调优参数，某些参数对 Kubernetes 集群很重要。

执行机器：`所有服务器`

```java
cat >> /etc/sysctl.d/user.conf << EOF
# 内核调优
net.ipv4.ip_forward = 1
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-ip6tables = 1
fs.may_detach_mounts = 1
vm.overcommit_memory=1
vm.panic_on_oom=0
fs.inotify.max_user_watches=89100
fs.file-max=52706963
fs.nr_open=52706963
net.netfilter.nf_conntrack_max=2310720
net.ipv4.tcp_keepalive_time = 600
net.ipv4.tcp_keepalive_probes = 3
net.ipv4.tcp_keepalive_intvl =15
net.ipv4.tcp_max_tw_buckets = 36000
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_max_orphans = 327680
net.ipv4.tcp_orphan_retries = 3
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 16384
net.ipv4.ip_conntrack_max = 65536
net.ipv4.tcp_timestamps = 0
net.core.somaxconn = 16384
EOF
```

完成后就可以重启服务器，虚拟机可以这个时候做个快照：

```java
reboot
```

重启完成查看 ipvs 的配置效果：

```java
lsmod | grep --color=auto -e ip_vs -e nf_conntrack
```

## 安装配置 Containerd

由于Kubernetes 1.24 版本之后移除了 dockershim，所以直接使用 containerd 作为容器运行时。

安装所需安装包：

安装包
版本号
说明
下载地址

nerdctl-full
1.20
nerdctl full 版本，包含 Containerd 等所有
点击下载

执行机器：`所有 Master 和 Worker 节点`

```java
cd /opt/package
# 安装依赖
yum -y install vim lrzsz wget zip unzip tree
# 更新 libseccomp，解决容器启动报错
rpm -e libseccomp-2.3.1-4.el7.x86_64 --nodeps
wget https://vault.centos.org/centos/8/BaseOS/x86_64/os/Packages/libseccomp-2.5.1-1.el8.x86_64.rpm
rpm -ivh libseccomp-2.5.1-1.el8.x86_64.rpm 
# 下载安装包
wget https://github.com/containerd/nerdctl/releases/download/v1.2.0/nerdctl-full-1.2.0-linux-amd64.tar.gz
# 解压安装
tar -C /usr/local -zxf nerdctl-full-1.2.0-linux-amd64.tar.gz
```

配置containerd 模块：

```java
# 配置模块
cat > /etc/modules-load.d/containerd.conf << EOF
overlay
br_netfilter
EOF
# 加载模块
modprobe -- overlay
modprobe -- br_netfilter
```

配置containerd 配置文件：

```java
# 生成默认配置
mkdir -p /etc/containerd
containerd config default | tee /etc/containerd/config.toml
# 将 Cgroup 改为 Systemd
sed -i "s#SystemdCgroup = false#SystemdCgroup = true#g" /etc/containerd/config.toml
# 检查配置
grep "SystemdCgroup" /etc/containerd/config.toml
```

低版本可能没有 SystemdCgroup 配置，可以 vim 搜索 `containerd.runtimes.runc.options` 关键字，然后在下面添加一项：

```java
SystemdCgroup = true
```

修改`sandbox_image` 的 `Pause` 镜像地址，原因是国内没法访问到：

```java
sed -i "s#registry.k8s.io/pause:3.6#registry.cn-hangzhou.aliyuncs.com/google_containers/pause:3.6#g" /etc/containerd/config.toml
```

需要vim 文件去确认一下这个镜像地址是否改对，否则后面集群初始化无法成功。

添加开机启动 containerd：

```java
# 启动并设置开机启动
systemctl daemon-reload
systemctl enable --now containerd
# 查看 Containerd 版本
ctr version
# 查看 nerdctl 版本
nerdctl version
```

配置crictl 客户端连接的运行时位置：

```java
cat > /etc/crictl.yaml << EOF
runtime-endpoint: unix:///run/containerd/containerd.sock
image-endpoint: unix:///run/containerd/containerd.sock
timeout: 10
debug: false
EOF
```

## 安装配置 Nginx

由于集群需要实现高可用功能，所以需要一个统一的 IP 作为入口。

对于本地环境，推荐的方案就是 `Nginx + Keepalived` 的方式提供 `VIP` 实现负载均衡反向代理高可用。网上有部分文章提到使用 Haproxy，个人不是很推荐，出问题排查没有 Nginx 容易。

但是对于云服务器而言，大部分是不支持 Keepalived 的，此时就需要用到公有云自带的负载均衡 SLB，如阿里云的 SLB，CLB，ALB，腾讯云的 ELB 等等。这些服务都有较强的稳定性。

但如果选择阿里云，则需要注意以下问题：

**1、** 阿里云不能使用VIP，要用VIP只能走SLB同时SLB内外网都需要收费；

**2、** 阿里云SLB不支持手动指定IP地址，在生成相关证书时需要注意；

**3、** 反代HTTPS的APIServer只能用SLB的四层反代；

**4、** SLB四层TCP反代不能直接反代到服务提供者上APIServer上因为APIServer也会有请求访问SLB，这样最终请求可能转发到本机，这在阿里云是不被允许的，会导致请求超时或者报错只能先代理到另一个ECS上通过类似Nginx之类的再代理到APIServer即SLB（TCP）-->Nginx（TCP）-->APIServer（HTTPS），注意Nginx和APIServer不能是同一个机器；

Nginx + Keepalive 配置负载均衡高可用所需安装包信息：

安装包
版本号
说明
下载地址

nginx
1.23.0
负载均衡，反向代理，TCP 代理
点击下载

openssl
1.1.1q
依赖
点击下载

pcre
8.45
依赖
点击下载

zlib
1.2.12
依赖
点击下载

echo-nginx-module
master
调试模块
点击下载

ngx-fancyindex
master
下载美化模块
点击下载

ngx_healthcheck_module
master
健康检查模块
点击下载

ngx_http_proxy_connect_module
master
代理模块
点击下载

ngx_http_status_code_counter
master
状态统计模块
点击下载

执行服务器：`slb-01 和 slb-02`

安装Nginx 依赖：

```java
# 依赖安装
yum -y install zip unzip gcc gcc-c++ automake autoconf libtool make glibc gd-devel pcre-devel libmcrypt-devel mhash-devel libxslt-devel libjpeg libjpeg-devel libpng libpng-devel freetype freetype-devel libxml2 libxml2-devel zlib zlib-devel glibc glibc-devel glib2 glib2-devel bzip2 bzip2-devel ncurses ncurses-devel curl curl-devel e2fsprogs e2fsprogs-devel krb5 krb5-devel libidn libidn-devel openssl openssl-devel libevent libevent-devel GeoIP GeoIP-devel GeoIP-data httpd-tools patch
```

将安装包上传到 `/opt/package` 目录然后执行安装：

```java
cd /opt/package
tar -zxf nginx-1.23.0.tar.gz
tar -zxf openssl-1.1.1q.tar.gz
tar -zxf pcre-8.45.tar.gz
tar -zxf zlib-1.2.12.tar.gz
unzip echo-nginx-module-master.zip
unzip ngx_healthcheck_module-master.zip
unzip ngx-fancyindex-master.zip
unzip ngx_http_proxy_connect_module-master.zip
unzip ngx_http_status_code_counter-master.zip
```

优化和打补丁：

```java
cd nginx-1.23.0/
# 打补丁
patch -p1 < ../ngx_healthcheck_module-master/nginx_healthcheck_for_nginx_1.19+.patch
patch -p1 < ../ngx_http_proxy_connect_module-master/patch/proxy_connect_rewrite_102101.patch
# 安全优化，隐藏版本号
sed -i 's#"1.23.0"#"2.2"#g' src/core/nginx.h
sed -i 's#"nginx/"#"apache/"#g' src/core/nginx.h
sed -i 's#"NGINX"#"APACHE"#g' src/core/nginx.h
sed -i 's#"Server: nginx"#"Server: apache"#g' src/http/ngx_http_header_filter_module.c
sed -i '/"<hr><center>" NGINX_VER "<\/center>" CRLF/d' src/http/ngx_http_special_response.c
sed -i '/"<hr><center>" NGINX_VER_BUILD "<\/center>" CRLF/d' src/http/ngx_http_special_response.c
sed -i '/"<hr><center>nginx<\/center>" CRLF/d' src/http/ngx_http_special_response.c
```

编译安装：

```java
# 编译
./configure --prefix=/opt/service/nginx \
--user=root \
--group=root \
--with-http_stub_status_module \
--with-http_gzip_static_module \
--with-http_secure_link_module \
--with-http_flv_module \
--with-http_ssl_module \
--with-http_mp4_module \
--with-stream \
--with-http_realip_module \
--with-http_geoip_module \
--with-http_v2_module \
--with-http_sub_module \
--with-http_image_filter_module \
--with-pcre=/opt/package/pcre-8.45 \
--with-openssl=/opt/package/openssl-1.1.1q \
--with-zlib=/opt/package/zlib-1.2.12 \
--add-module=/opt/package/echo-nginx-module-master \
--add-module=/opt/package/ngx_healthcheck_module-master \
--add-module=/opt/package/ngx_http_proxy_connect_module-master \
--add-module=/opt/package/ngx_http_status_code_counter-master \
--add-module=/opt/package/ngx-fancyindex-master
# 安装
make && make install
```

配置主配置文件：

```java
cat > /opt/service/nginx/conf/nginx.conf << EOF
# Worker运行用户
user  root;
# Worker线程数量，一般等于CPU数
worker_processes  auto;
# 默认错误日志文件
error_log  logs/error.log;
# 默认PID文件位置
pid        logs/nginx.pid;
# Worker打开文件数，影响并发，系统 limit 也会影响
worker_rlimit_nofile 65535;
# 最大并发数：worker_processes * worker_connections，反向代理除以 4
events {
    use epoll;
    worker_connections  65535;
}
# HTTP服务配置字段
http {
    允许的文件类型和默认的打开方式
    include       mime.types;
    default_type  application/octet-stream;
    默认的 access 日志输出格式
    log_format  main    '\$remote_addr \$remote_user [\$time_local] "\$request" '
                        '\$status \$body_bytes_sent "\$http_referer" '
                        '\$http_user_agent \$http_x_forwarded_for \$request_time \$upstream_response_time \$upstream_addr \$upstream_status';
    默认access日志输出位置
    access_log logs/access.log  main;
    配置多个域名的时候需要增大该值
    server_names_hash_bucket_size 128;
    variables_hash_max_size 4096;
    variables_hash_bucket_size 2048;
    这两个值限制header buffer 大小，超出大小报错414（处理request_line）/400（处理request_header）
    client_header_buffer_size 32k;
    large_client_header_buffers 4 32k;
    上传文件大小限制
    client_max_body_size 30m;
    Fastcgi优化配置
    fastcgi_connect_timeout 300;
    fastcgi_send_timeout 300;
    fastcgi_read_timeout 300;
    fastcgi_buffer_size 64k;
    fastcgi_buffers 4 64k;
    fastcgi_busy_buffers_size 128k;
    fastcgi_temp_file_write_size 128k;
    fastcgi_param HTTP_PROXY "";
    隐藏后端服务器的相关参数
    proxy_hide_header X-Powered-By;
    proxy_hide_header X-Forwarded-For;
    proxy_hide_header X-AspNet-Version;
    proxy_hide_header X-AspNetMvc-Version;
    proxy_hide_header Via;
    proxy_hide_header X-Varnish;
    proxy_hide_header Server;
    后端服务器连接的超时时间
    proxy_connect_timeout 30s;
    连接成功后，等候后端服务器响应时间
    proxy_read_timeout 30s;
    后端服务器数据回传时间
    proxy_send_timeout 30s;
    开启压缩
    gzip          on;
    静态资源压缩
    gzip_static   on;
    客户端IE不压缩
    gzip_disable  "MSIE [1-6] .";
    响应头部标识
    gzip_vary     on;
    最小压缩文件大小
    gzip_min_length 1k;
    缓冲区个数和大小
    gzip_buffers    4 16k;
    压缩等级，越高压缩比越高，但是越吃CPU
    gzip_comp_level 5;
    压缩的文件类型
    gzip_types text/plain application/javascript application/x-javascript text/css application/xml text/javascript application/x-httpd-php image/jpeg image/gif image/png application/vnd.ms-fontobject font/ttf font/opentype font/x-woff image/svg+xml;
    针对压缩的协议版本
    gzip_http_version 1.1;
    虚拟主机配置目录
    include vhosts/*.conf;
    防止恶意解析
    server {
        listen 80 default_server;
        server_name _;
        access_log off;
        return 444;
    }
}
# TCP/UDP代理配置段
stream {
    TCP/UDP虚拟主机配置目录
    include tcp/*.conf;
}
EOF
```

创建目录：

```java
mkdir /opt/service/nginx/conf/{tcp,vhosts,certs,template}
```

配置API Server 的 TCP 代理（现在只是测试配置）：

```java
cat > /opt/service/nginx/conf/tcp/k8s-apiserver.conf << EOF
# Kubernetes API Server TCP/UDP 代理
upstream K8S-APISERVER {
    hash \$remote_addr consistent;
    server 192.168.2.21:6443;
    server 192.168.2.22:6443;
    check interval=5000 rise=2 fall=3 timeout=5000 default_down=true type=tcp;
}
server {
    listen 6443;
    proxy_connect_timeout 30s;
    proxy_timeout 300s;
    proxy_pass K8S-APISERVER;
}
EOF
```

配置状态页面：

```java
cat > /opt/service/nginx/conf/vhosts/status.conf << EOF
server {
    listen       2333;
    server_name  localhost;
    access_log  off;
    请求状态统计
    location = /nginx/status {
        stub_status on;
    }
    状态码统计
    location = /nginx/status/count {
        show_status_code_count on;
    }
    负载均衡状态
    location /nginx/upstream/status {
        healthcheck_status;
    }
    location / {
        return 403;
    }
}
EOF
```

启动服务：

```java
# 启动服务
/opt/service/nginx/sbin/nginx -t
/opt/service/nginx/sbin/nginx
# 添加开机启动
cat >> /etc/rc.local << EOF
# Nginx 开机启动
/opt/service/nginx/sbin/nginx &
EOF
# 修改权限
chmod 755 /etc/rc.local
```

请求状态页面：

> http://192.168.2.11:2333/nginx/status

状态码统计页面：

> http://192.168.2.11:2333/nginx/status/count

Upstream 状态页面：

> http://192.168.2.11:2333/nginx/upstream/status

## 安装配置 Keepalived

Nginx 和 Keepalived 是配套使用的，如果有其他负载均衡器就不需要再安装这两个服务。

安装包
版本号
说明
下载地址

keepalived
2.27
提供 VIP
点击下载

将安装包上传到 `/opt/package` 执行安装。

执行服务器：`slb-01 和 slb-02`

```java
# 安装依赖
yum install -y ipvsadm popt popt-devel libnl libnl-devel libnl3-devel libnfnetlink libnfnetlink-devel net-snmp-devel openssl openssl-devel
# 下载安装包
cd /opt/package
tar -zxf keepalived-2.2.7.tar.gz 
# 编译安装
cd keepalived-2.2.7/
./configure --prefix=/opt/service/keepalived
make && make install
```

slb-01 配置 Keepalived（MASTER 节点）：

```java
cat > /opt/service/keepalived/etc/keepalived/keepalived.conf << EOF
! Configuration File for keepalived
#全局配置
global_defs {
   负载均衡标识，在局域网内应该是唯一的。一般为主机名。
   router_id $(hostname)
   script_user root
   enable_script_security
}
vrrp_script check_nginx {
    检测心跳执行的脚本
    script "/opt/service/keepalived/etc/keepalived/nginx_process_check.sh"
    检测脚本执行间隔，单位：秒
    interval 5
    weight 2
}
#定义实例
vrrp_instance VI_1 {
    指定keepalived的角色，MASTER为主，BACKUP为备
    state MASTER
    当前进行vrrp通讯的网络接口卡(当前centos的网卡)
    interface ens33
    指定VRRP实例ID(虚拟路由编号)，范围是0-255，主从要一致
    virtual_router_id 100
    优先级，数值越大，获取处理请求的优先级越高, 优先级高的将成为MASTER。
    priority 101
    指定发送VRRP通告的间隔，默认为1s(vrrp组播周期秒数)
    advert_int 1
    设置验证类型和密码，MASTER和BACKUP必须使用相同的密码才能正常通信
    authentication {
        指定认证方式。PASS简单密码认证(推荐),AH:IPSEC认证(不推荐)。
        auth_type PASS
        指定认证所使用的密码。最多8位。
        auth_pass k8spass
    }
    调用检测脚本
    track_script {
        check_nginx
    }
    定义虚拟ip(VIP)，可多设，每行一个
    virtual_ipaddress {
        192.168.2.100
    }
}
EOF
```

slb-02 配置 Keepalived（BACKUP 节点）：

```java
cat > /opt/service/keepalived/etc/keepalived/keepalived.conf << EOF
! Configuration File for keepalived
#全局配置
global_defs {
   负载均衡标识，在局域网内应该是唯一的。一般为主机名。
   router_id $(hostname)
   script_user root
   enable_script_security
}
vrrp_script check_nginx {
    检测心跳执行的脚本
    script "/opt/service/keepalived/etc/keepalived/nginx_process_check.sh"
    检测脚本执行间隔，单位：秒
    interval 5
    weight 2
}
#定义实例
vrrp_instance VI_1 {
    指定keepalived的角色，MASTER为主，BACKUP为备
    state BACKUP
    当前进行vrrp通讯的网络接口卡(当前centos的网卡)
    interface ens33
    指定VRRP实例ID(虚拟路由编号)，范围是0-255，主从要一致
    virtual_router_id 100
    优先级，数值越大，获取处理请求的优先级越高, 优先级高的将成为MASTER。
    priority 100
    指定发送VRRP通告的间隔，默认为1s(vrrp组播周期秒数)
    advert_int 1
    设置验证类型和密码，MASTER和BACKUP必须使用相同的密码才能正常通信
    authentication {
        指定认证方式。PASS简单密码认证(推荐),AH:IPSEC认证(不推荐)。
        auth_type PASS
        指定认证所使用的密码。最多8位。
        auth_pass k8spass
    }
    调用检测脚本
    track_script {
        check_nginx
    }
    定义虚拟ip(VIP)，可多设，每行一个
    virtual_ipaddress {
        192.168.2.100
    }
}
EOF
```

添加启动文件：

```java
cat > /etc/systemd/system/keepalived.service << EOF
[Unit]
Description=LVS and VRRP High Availability Monitor
After=network-online.target syslog.target 
Wants=network-online.target 
Documentation=man:keepalived(8)
Documentation=man:keepalived.conf(5)
Documentation=man:genhash(1)
Documentation=https://keepalived.org
[Service]
Type=forking
PIDFile=/run/keepalived.pid
KillMode=process
EnvironmentFile=-/opt/service/keepalived/etc/sysconfig/keepalived
ExecStart=/opt/service/keepalived/sbin/keepalived -f /opt/service/keepalived/etc/keepalived/keepalived.conf \$KEEPALIVED_OPTIONS
ExecReload=/bin/kill -HUP \$MAINPID
[Install]
WantedBy=multi-user.target
EOF
```

配置检测脚本：

```java
cat > /opt/service/keepalived/etc/keepalived/nginx_process_check.sh << EOF
#!/bin/bash
# Nginx 进程检测脚本
echo "\$(date) 开始检测 Nginx 状态..." >> /tmp/keepalived.log
err=0
# 三次进程检测
for k in \$(seq 1 3);do
    process_count=\$(ps -ef | grep "nginx: master process" | grep -v "grep" | wc -l)
    if [[ \$process_count == 0 ]]; then
        err=\$(expr \$err + 1)
        sleep 1
        continue
    else
        err=0
        break
    fi
done
# 判断检测结果
if [[ \$err != "0" ]];then
    echo "\$(date) Nginx 进程检测异常，开始停止 Keepalived ..." >> /tmp/keepalived.log
    /usr/bin/systemctl stop keepalived
    exit 1
else
    exit 0
fi
EOF
# 修改权限
chmod +x /opt/service/keepalived/etc/keepalived/nginx_process_check.sh
```

有两个地方需要特别注意：

**1、** 脚本中判断进程是否存活的关键字一定要跟脚本名称区分开，否则可能造成手动执行脚本没问题，但是keepalived一直不停止；

**2、** keepalived对该脚本的权限控制非常严格，权限不对会在日志中提示以下问题，并且不执行脚本：；

> Keepalived_vrrp[11241]: Unsafe permissions found for script 'xxx'.
>
> Keepalived_vrrp[11241]: Disabling track script xxx due to insecure

详细信息可以查看官方 Github 仓库的说明：

> https://github.com/acassen/keepalived/issues/1372

启动服务：

```java
systemctl daemon-reload
systemctl enable --now keepalived
```

此时在slb-01（MASTER 节点） 上面就会有 `192.168.2.100` 这个 VIP，可以通过停止该节点 nginx 看 IP 是否会转移。

到此，系统初始化和基础服务已经配置完成，如果是本地虚拟机的就可以做个快照保存现在的状态了，因为后面会使用不同方式安装 Kubernetes。
