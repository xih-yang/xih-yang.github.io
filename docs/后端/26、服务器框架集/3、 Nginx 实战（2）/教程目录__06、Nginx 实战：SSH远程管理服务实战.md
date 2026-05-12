# 06、Nginx 实战：SSH远程管理服务实战
- 来源：https://ddkk.com/zhuanlan/server/nginx/3/6.html
- 分类：服务器框架
- 分组：教程目录
## 1.SSH基本概述

SSH是一个安全协议，在进行数据传输时，会对数据包进行加密处理，加密后在进行数据传输。确保了数据传输安全。那SSH服务主要功能有哪些呢？

**1、** 提供远程连接服务器的服务、；

**2、** 对传输的数据进行加密；

那么除了SSH协议能提供远程连接服务，Telnet也能提供远程连接服务, 那么分别的区别是什么呢?

ssh服务会对传输数据进行加密, 监听在本地22/tcp端口, ssh服务默认支持root用户登录

telnet服务不对数据进行加密, 监听在本地23/tcp端口, Telnet默认不支持root用户登录

服务连接方式
服务数据传输
服务监听端口
服务登陆用户

ssh
加密
22/tcp
默认支持root用户登陆

telnet
明文
23/tcp
不支持root用户登陆

## 1.1案例: 使用wireshark验证telnet明文传输与ssh加密传输

**1、** 安装telnet服务并运行；

```java
[root@m01 ~]# yum install telnet-server -y
[root@m01 ~]# systemctl start telnet.socket
```

**2、** 使用wireshark检测vmnet8网卡上telnet的流量；

**3、** telnet是无法使用root用户登录Linux系统，需要创建普通用户；

```java
[root@m01 ~]# useradd bgx
[root@m01 ~]# echo "123456"| passwd --stdin bgx
```

**4、** 使用普通用户进行telnet登录；

**5、** 搜索wireshark包含telnet相关的流量；

**6、** 使用wireshark分析ssh流量；

## 2.SSH相关命令

SSH有客户端与服务端，我们将这种模式称为C/S架构，ssh客户端支持Windows、Linux、Mac等平台。

在ssh客户端中包含 ssh|slogin远程登陆、scp远程拷贝、sftp文件传输、ssh-copy-id秘钥分发等应用程序。

**1、** ssh远程登录服务器命令示例；

```java
ssh -p22 root@10.0.0.61
# -p指定连接远程主机端口，默认22端口可省略
# root@remotehost
# "@"前面为用户名，如果用当前用户连接，可以不指定用户
# "@"后面为要连接的服务器的IP
```

**2、** scp复制数据至远程主机命令(全量复制)；

```java
# -P 指定端口，默认22端口可不写
# -r 表示递归拷贝目录
# -p 表示在拷贝文件前后保持文件或目录属性不变
# -l (limit)限制传输使用带宽(默认kb)
#推：将本地/tmp/oldboy推送至远端服务器10.0.0.61的/tmp目录，使用对端的root用户
[root@m01 ~]# scp -P22 -rp /tmp/oldboy oldboy@10.0.0.61:/tmp
#拉：将远程10.0.0.61服务器/tmp/oldboy文件拉取到本地/opt/目录下
[root@m01 ~]# scp -P22 -rp root@10.0.0.61:/tmp/oldboy /opt/
#限速
[root@m01 ~]# scp /opt/1.txt root@172.16.1.31:/tmp
root@172.16.1.31 password: 
test                        100%  656MB  '83.9MB/s'   00:07 
#限速为8096kb，换算为MB，要除以 8096/8=1024KB=1MB
[root@m01 ~]# scp -rp -l 8096  /opt/1.txt root@172.16.1.31:/tmp
root@172.16.1.31s password: 
test                        7%   48MB   '1.0MB/s'   09:45 
```

结论：
**1、** scp通过ssh协议加密方式进行文件或目录拷贝；

**2、** scp连接时的用户作为拷贝文件或目录的权限；

**3、** scp支持数据推送和拉取，每次都是全量拷贝，效率较低；

**3、** Sftp远程数据传输命令；

```java
#默认可以通过sftp命令连接sftp服务
sftp root@10.0.0.61
sftp -oPort=52113 root@10.0.0.61 sftp的特殊端口连接
# sftp使用get下载文件至于本地服务器
sftp> get conf.txt /tmp/
# sftp使用put上传本地服务器文件至远程服务器
sftp> put /root/t1.txt /root/
```

## 3.SSH验证方式

## 3.1.基于账户密码远程登录

知道服务器的IP端口，账号密码，即可通过ssh客户端命令登陆远程主机。

```java
➜  ~ ssh -p22 root@10.0.0.61
root@10.0.0.61 password:
[root@m01 ~]#
```

## 3.2.基于秘钥远程登录

默认情况下，通过ssh客户端命令登陆远程服务器，需要提供远程系统上的帐号与密码，但为了降低密码泄露的机率和提高登陆的方便性，建议使用密钥验证方式。

**1、** 在服务器上生成非对称密钥，使用-t指定密钥类型,使用-C指定用户邮箱；

```java
[root@m01 ~]# ssh-keygen -t rsa -C xuliangwei@qq.com
...
#默认一路回车即可
...
```

**2、** 将A服务器上的公钥推送至B服务器；

```java
#命令示例: ssh-copy-id [-i [identity_file]] [user@]machine
ssh-copy-id命令
-i         指定下发公钥的路径
[user@]    以什么用户身份进行公钥分发（root）,如果不输入，表示以当前系统用户身份分发公钥
machine    下发公钥至那台服务器, 填写远程主机IP地址
#分发秘钥，[将A服务器的公钥写入B服务器~/.ssh/authorized_keys文件中]
[root@m01 ~]# ssh-copy-id -i ~/.ssh/id_rsa.pub root@172.16.1.41
```

**3、** A服务器连接B服务器是无需密码的，如果能直接连接无需密码则表示秘钥已配置成功；

```java
#远程登录对端主机方式
[root@m01 ~]# ssh root@172.16.1.41
[root@nfs ~]#
#不登陆远程主机bash，但可在对端主机执行命令
[root@m01 ~]# ssh root@172.16.1.41 "hostname -i"
172.16.1.41
```

## 4.SSH场景实践

实践场景，用户通过Windows/MAC/Linux客户端连接跳板机免密码登录，跳板机连接后端无外网的Linux主机实现免密登录，架构图如下。

实践多用户登陆一台服务器无密码

实践单用户登陆多台服务器免密码

## 4.1.windows客户端使用Xshell生成秘钥对，并下发公钥至跳板机

**1、** Xshell-->选择工具->新建密钥生成工具；

**2、** 生成公钥对，选择下一步；

**3、** 填写秘钥名称秘钥增加密码则不建议配置；

**4、** Windows会提示密码，继续即可；

**5、** 生成秘钥后，点击Xshell->工具->用户秘钥管理者->选择对应秘钥的属性；

**6、** 选择对应秘钥的公钥，将其复制；

**7、** 将从WIndows下复制好的公钥粘贴至跳板机~/.ssh/authorized_keys中，然后测试；

```java
[root@m01 ~]# cd ; umask 077; mkdir -p .ssh ;cd .ssh
[root@m01 .ssh]# vim authorized_keys 添加windows公钥
```

## 4.2.跳板机下发公钥至后端主机

```java
1) 在跳板机上生成秘钥对
[root@m01 ~]# ssh-keygen -t rsa -C liyang1401190055@163.com
2) 拷贝跳板机上的密钥至后端主机，如果SSH不是使用默认22端口, 使用-p指定对应端口
[root@m01 ~]# ssh-copy-id  -i /root/.ssh/id_rsa.pub "-p22 root@172.16.1.31"
[root@m01 ~]# ssh-copy-id  -i /root/.ssh/id_rsa.pub "-p22 root@172.16.1.41"
3) 在m01管理机上测试是否成功登陆两台服务器
[root@m01 ~]# ssh root@172.16.1.41
[root@nfs01 ~]# exit
[root@m01 ~]# ssh root@172.16.1.31
[root@backup ~]# exit
```

## 4.3.通过跳板机能实现scp拷贝文件免密码

```java
[root@manager ~]# scp manager-web root@172.16.1.31:/tmp
manager-web                 100%    0     0.0KB/s   00:00    
[root@manager ~]# scp manager-web root@172.16.1.41:/tmp
manager-web                 100%    0     0.0KB/s   00:00  
```

## 4.4.SSH安全优化

SSH作为远程连接服务，通常我们需要考虑到该服务的安全，所以需要对该服务进行安全方面的配置。

**1、** 更改远程连接登陆的端口；

**2、** 禁止ROOT管理员直接登录；

**3、** 密码认证方式改为密钥认证；

**4、** 重要服务不使用公网IP地址；

**5、** 使用防火墙限制来源IP地址；

SSH服务登录防护需进行如下配置调整，先对如下参数进行了解

```java
Port 6666                       变更SSH服务远程连接端口
PermitRootLogin         no      禁止root用户直接远程登录
PasswordAuthentication  no      禁止使用密码直接远程登录
UseDNS                  no      禁止ssh进行dns反向解析，影响ssh连接效率参数
GSSAPIAuthentication    no      禁止GSS认证，减少连接时产生的延迟
```

将如下具体配置添加至/etc/ssh/sshd_config文件中，参数需根据实际情况进行调整

```java
###SSH###
#Port 6666
#PasswordAuthentication no
#PermitRootLogin no
GSSAPIAuthentication no
UseDNS no
###END###
```

## 4.5.SSH安全防护

fail2ban可以监控系统日志，并且根据一定规则匹配异常IP后使用Firewalld将其屏蔽，尤其是针对一些爆破/扫描等非常有效。

```java
1.开启Firewalld防火墙
	[root@bgx ~]# systemctl start firewalld
	[root@bgx ~]# systemctl enable firewalld
	[root@bgx ~]# firewall-cmd --state
	running
2.修改firewalld规则，启用Firewalld后会禁止一些服务的传输，但默认会放行常用的22端口 
如果想添加更多，以下是放行SSH端口（22）示例，供参考：
	#放行SSHD服务端口
	[root@bgx ~]# firewall-cmd --permanent --add-service=ssh --add-service=http 
	#重载配置
	[root@bgx ~]# firewall-cmd --reload
	#查看已放行端口
	[root@bgx ~]# firewall-cmd  --list-service
3.安装fail2ban,需要有epel
	[root@bgx ~]# yum install fail2ban fail2ban-firewalld mailx -y
4.配置fail2ban规则.local会覆盖.conf文件
[root@bgx fail2ban]# cat /etc/fail2ban/jail.local
[DEFAULT]
ignoreip = 127.0.0.1/8
bantime  = 86400
findtime = 600
maxretry = 5
banaction = firewallcmd-ipset
action = %(action_mwl)s
[sshd]
enabled = true
filter  = sshd
port    = 22
action = %(action_mwl)s
logpath = /var/log/secure
5.启动服务，并检查状态
[root@bgx ~]# systemctl start fail2ban.service
[root@bgx ~]# fail2ban-client status sshd
6.清除被封掉的IP地址
[root@bgx ~]# fail2ban-client set sshd unbanip 10.0.0.1
```

## 4.6.如果有ssh秘钥无法正常连接的情况,可以尝试使用如下的调试模式.开启ssh debug调试模式。

```java
（1）31服务器上开启临时ssh服务 /usr/sbin/sshd -p 10001 -d
（2）61服务器上访问 ssh -vvv -p 10001 root@10.0.0.31
（3）31服务器上查看debug日志，发现身份验证被拒绝，目录的所有权错误。
	Authentication refused: bad ownership or modes for directory /root
 解决方法：
 出现这个错误，是因为/root目录的权限或者属主属组不对，修改权限或属主属组
```

## 5.ssh密码+ Google Authenticator 实现双向认证

通常我们直接通过ssh输入密码连接服务器，但这样很容易出现暴力破解情况，所以我们可以结合google的动态认证+ssh密码，这样能够大大的提升登陆的安全。

简单来说，就是当用户通过ssh登陆系统时，先输入google的随机验证码，然后在输入服务器的ssh密码

## 5.1.安装依赖包，环境属于centos7，centos6请自行查阅网上资料

```java
[root@bgx ~]# yum -y install wget gcc make pam-devel libpng-devel pam-devel
```

## 5.2.安装Google Authenticator PAM插件安装

```java
[root@bgx ~]# wget https://github.com/google/google-authenticator-libpam/archive/1.04.tar.gz
[root@bgx ~]# tar xf 1.04.tar.gz
[root@bgx ~]# cd google-authenticator-libpam-1.04/
[root@bgx google-authenticator-libpam-1.04]# ./bootstrap.sh
[root@bgx google-authenticator-libpam-1.04]# ./configure
[root@bgx google-authenticator-libpam-1.04]# make && make install
[root@bgx google-authenticator-libpam-1.04]# cp /usr/local/lib/security/pam_google_authenticator.so /lib64/security/
```

## 5.3.初始配置 Google Authenticator

```java
[root@bgx google-authenticator-libpam-1.04]# google-authenticator
```

是否基于时间的认证，为了防止不同跨时区的问题，这里选择n

```java
Do you want authentication tokens to be time-based (y/n) n
```

然后会跳出一个google的二维码

红色框框是: 生成的密钥

绿色框框是: 生成的5个一次性紧急验证码，用于紧急情况下，使用过一次后该验证码即失效了。

是否更新用户的 Google Authenticator 配置文件，选择 y 才能使上面操作对当前 root 用户生效，其实就是在对应用户的 Home 目录下生成了一个 .google_authenticator 文件，如果你想停用这个用户的 Google Authenticator 验证，只需要删除这个用户 Home 目录下的 .google_authenticator 文件就可以了。

```java
Do you want me to update your "/root/.google_authenticator" file? (y/n) y
```

每次生成的认证码是否同时只允许一个人使用？这里选择 y。

```java
Do you want to disallow multiple uses of the same authentication
token? This restricts you to one login about every 30s, but it increases
your chances to notice or even prevent man-in-the-middle attacks (y/n) y
```

每次生成的令牌30s生成一次，最高允许存在误差4分钟。

```java
By default, a new token is generated every 30 seconds by the mobile app.
In order to compensate for possible time-skew between the client and the server,
we allow an extra token before and after the current time. This allows for a
time skew of up to 30 seconds between authentication server and client. If you
experience problems with poor time synchronization, you can increase the window
from its default size of 3 permitted codes (one previous code, the current
code, the next code) to 17 permitted codes (the 8 previous codes, the current
code, and the 8 next codes). This will permit for a time skew of up to 4 minutes
between client and server.
Do you want to do so? (y/n) y
```

## 5.4.SSH调用及客户端配置，添加pam认证，在第一行添加

```java
[root@bgx ~]# vim  /etc/pam.d/sshd 添加如下行
auth       required     pam_google_authenticator.so
```

## 5.5.修改sshd配置，关联google认证

```java
[root@bgx ~]# vim /etc/ssh/sshd_config
ChallengeResponseAuthentication yes    修改为yes
[root@bgx ~]# systemctl restart sshd   重启sshd服务
```

## 5.6.客户端通过ssh连接服务器测试

需要输入动态密码，动态密码通过手机获取如下图所示

## 5.7.查看服务端的安全日志文件，可以看到是先进程google动态密码认证

## 5.8.注意事项:

**1、** 用password+googleauthenticator，如果使用公钥登录的话，会跳过googleauthenticator验证直接登录服务器的；

**2、** 如果是内网测试使用，建议安装googleauthenticator浏览器插件实践如果是公网服务器建议安装手机版的Authenticator；

## 5.9.安装Google authenticator

Andorid版: “自行百度”

iOS版: 下载 “Authenticator”

chrome浏览器有google authenticator的插件
