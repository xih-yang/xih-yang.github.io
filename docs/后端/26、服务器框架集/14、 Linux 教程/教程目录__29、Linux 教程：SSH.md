# 29、Linux 教程：SSH
- 来源：https://ddkk.com/zhuanlan/server/linux/1/29.html
- 分类：服务器框架
- 分组：教程目录
## SSH

ssh就是Secure Shell的缩写，为建立在应用层和传输层基础上的安全协议。用ssh截获数据包看到的是加密后的数据，不能破解其中内容。

SSH端口号为22，默认为开启状态，相关服务为sshd，如果没装就安装openSSH服务。

服务端主程序：/usr/sbin/sshd，服务器端配置文件/etc/ssh/sshd_config。

客户端主程序：/usr/bin/ssh，客户端配置文件/etc/ssh/ssh_config。

## SSH加密原理

通常对于银行账户或者压缩包加密都是用对称加密算法，即加密和解密用同一个秘钥。而SSH基于非对称加密原理，当客户端要访问服务器时，首先把服务器的公钥下载到客户端，然后发送的信息用公钥加密再传送给服务端，服务端用对应的私钥解密，即使传输过程中数据被截获，没有私钥也无法得到真实数据。

## SSH配置文件

服务器端配置文件/etc/ssh/sshd_config：

Port 22表示ssh端口默认是22，对服务器来说建议修改端口，避免遭受攻击。

ListenAddress表示监听的IP，这个是指接受哪个IP地址发来的数据，默认为0.0.0.0，意思是监听所有IP地址。

Protocol 2表示SSH版本为2。

HostKey为私钥保存位置。

ServerKeyBits为私钥位数。

SyslogFacility AUTH表示日志记录ssh登录情况，过程会被记录在/var/log/secure中。

LogLevel表示日志记录等级。

GSSAPIAuthentication表示GSSAPI认证，建议修改客户端的配置文件，将GSSAPI认证关闭，否则连接时会消耗大量时间去DNS服务器。

PermitRootLogin表示允许root的ssh登录，建议修改这里的配置，改成不允许root的ssh登录，这是因为一旦root的密码丢失会对服务器破坏很大，可以采用公钥登录方式，但是要先拿到公钥。

PubkeyAuthentication表示是否使用公钥验证。

AuthorizedKeysFile表示公钥位置。

PasswordAuthentication是否使用密码登录，拿到公钥后可以把允许密码登录改成no，禁止密码登录，此时就可以使用公钥登录服务器了，密码就不会在传输的过程中丢失。

PermitEmptyPasswords表示是否允许空密码登录。

## SSH命令

通过ssh远程管理：`ssh 用户名@IP`，可以通过这个在一台linux中登录另一台，登录后就和远程工具管理一样了。用exit命令退出。

在远程计算机中下载到当前目录：`scp 用户名@IP:路径 .`

将文件上传到远程计算机：`scp -r 文件路径 用户名@IP:上传到哪个位置`，这两个命令并没有登录到对方的计算机。

用sftp进行文件传输：`sftp 用户名@IP`，进入sftp状态后用ls来查看服务器端数据，用cd来切换服务器端目录，用lls查看本地数据，用lcd来切换本地目录。用`get 要下载的文件名 本地目录`来下载到本地，用put来上传文件到服务器。

## SSH秘钥对登录

为了防止暴力破解密码进行远程登录，需要采用更安全的方式。

秘钥对登录首先需要在本机生成秘钥对，然后将公钥发到服务器的指定目录~/.ssh/authorized_keys，然后登录时用私钥登录即可，公钥保存在哪个家目录下登录后就是哪个用户。

**1、** 生成秘钥对：`ssh-keygen-trsa`，RSA是非对称秘钥算法，还可以用dsa系统会提示key存在/root/.ssh/id_rsa中，然后会设置密码，这里密码设置为空即可，完成后会在/root/.ssh/中会生成id_rsa和id_rsa.pub文件，前者是私钥后者是公钥；

**2、** 将公钥上传到服务器：`scp-r公钥用户名@IP:/root`，如果是其他用户就修改对应家目录上传后将公钥追加到指定文件中：`catid_rsa.pub>>/root/.ssh/authorized_keys`，如果服务器端没有.ssh目录要先新建一个，用重定向的方式主要是考虑到登录地点有多个，这样文件就能保存多个公钥然后修改该文件的读权限，防止有人偷走：`chmod600/root/.ssh/authorized_keys`；

（在产生秘钥对后执行`ssh-copy-id ip或域名`也能将公钥放入对应节点）

**3、** 修改服务器端SSH配置文件：；

RSAAuthentication yes 表示开启RSA验证。

PubkeyAuthentication yes 表示使用公钥验证。

AuthorizedKeysFile .ssh/authorized_keys 指定公钥的保存位置

PasswordAuthentication no 表示禁止密码登录

**4、** 关闭SELinux服务：修改配置文件/etc/selinux/config改为SELINUX=disabled，然后重启系统；

**5、** 服务器端重启服务：`servicesshdrestart`；

此时就可以直接登录ssh无需输入密码了。使用这种方式要注意保护私钥。

如果要用windows远程工具进行秘钥对登录，只需将私钥拷到windows中，登录时登录方式选择publickey，选取私钥文件即可，如果当初没有设置ssh密码就无需输入密码。

## .ssh文件夹下（~/.ssh）的文件功能解释

文件名
功能

known_hosts
记录ssh访问过计算机的公钥(public key)

id_rsa
生成的私钥

id_rsa.pub
生成的公钥

authorized_keys
存放授权过得无密登录服务器公钥
