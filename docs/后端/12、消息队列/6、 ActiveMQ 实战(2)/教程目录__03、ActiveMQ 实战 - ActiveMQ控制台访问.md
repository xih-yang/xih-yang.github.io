# 03、ActiveMQ 实战 - ActiveMQ控制台访问
- 来源：https://ddkk.com/zhuanlan/mq/activemq/2/3.html
- 分类：消息队列
- 分组：教程目录
### 前提准备

使用window客户端访问linux服务端之前先确保客户端和服务端之间能正常通信。

**1、** 使用`ifconfig`命令查看linux服务端ip地址，比如我的是：`192.168.64.129`；

**2、** 使用`ipconfig`命令查看window客户端IP地址，比如我的是：`192.168.89.1`；

**3、** 客户端ping服务端；

如果出现丢失 = 0，表示客户端对服务端通信正常。（如果ping不成功，可以关闭linux防火墙或者将客户端ip地址加入白名单，亦可以对外开放访问端口8161，因为ActiveMQ客户端默认访问端口为：`8161`）。

关闭防火墙：`systemctl stop firewalld`

加入白名单：`iptables -I INPUT 3 -s your ip -p tcp --dport 1521 -j ACCEPT`，参考：[https://blog.csdn.net/qq_37837701/article/details/80578807](https://blog.csdn.net/qq_37837701/article/details/80578807)

开放访问端口：`firewall-cmd --add-port=8161/tcp`

开放访问端口后需要重启防火墙，重启命令：`systemctl restart firewalld`

**4、** 服务端ping客户端；

一般情况下，linux都能正常ping window系统，如果不行，可以尝试将window防火墙关闭。

**5、** 修改配置文件；

进入ActiveMQ安装目录下的`conf`文件夹，找到`jetty.xml`

使用文本编辑命令`vim jetty.xml`访问该文件并找到`jettyPort`bean，将`host`属性从原来的`127.0.0.1`改为`0.0.0.0`，修改完成后保存并退出。（port属性为8161，即和前文所说ActiveMQ默认客户端访问端口为8161）

### 客户端访问服务端

假设前提准备阶段都已完成。

**1、** 在windows的浏览器上linux上的ActiveMQ，地址格式：`yourlinuxip:8161`（我的是：192.168.64.129），并输入用户名和密码，默认都为`admin`；

出现这个界面即表示你已经成功访问ActiveMQ服务。

**2、** 点击`ManageActiveMQbroker`；
