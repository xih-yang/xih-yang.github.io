# 02、RabbitMQ 实战 - Linux安装RabbitMQ
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/2/2.html
- 分类：消息队列
- 分组：教程目录
注意：由于RabbitMQ是用Erlang语言编写的，所以在安装RabbitMQ的同时也需要安装Erlang

**1、** 下载RabbitMQ安装包；

(1)进入RabbitMQ的官网

[https://www.rabbitmq.com/](https://www.rabbitmq.com/)

(2)进入RabbitMQ的仓库

(3)点击rabbitmq-server链接，跳转RabbitMQ安装包的下载页面

(4)利用搜索找到适合自己Linux系统的RabbitMQ安装包并下载

可以使用uname -a命令查看自己Linux的内核版本，我这里使用的是Centos7，内核是Linux7(Centos8停止维护了，所以本次下载使用Centos7)，所以下载的RabbitMQ的版本是支持Centos7的

**2、** 下载Erlang安装包；

(1)找到适合自己Linux系统和对应的Erlang安装包,需要先进入RabbitMQ的官网，确定RabbitMQ与Erlang版本之间的依赖关系，得知RabbitMQ3.10.0版本支持的Erlang版本为23.2~24.3

[https://www.rabbitmq.com/which-erlang.html](https://www.rabbitmq.com/which-erlang.html)

(2)利用搜索找到适合自己Linux系统和能对应上RabbitMQ3.10.0版本的Erlang安装包并下载

**3、** 把RabbitMQ和Erlang两个安装包上传到Linux服务器上；

**4、** 用命令安装Erlang；

```java
参数解释:
-i 安装
-vh 显示进度
rpm -ivh erlang-23.3.4.11-1.el7.x86_64.rpm
```

效果图：

**5、** 安装RabbitMQ之前需要先安装socat依赖；

```java
yum install -y socat
```

效果图：

**6、** 用命令安装RabbitMQ；

```java
参数解释:
-i 安装
-vh 显示进度
rpm -ivh rabbitmq-server-3.10.0-1.el7.noarch.rpm
```

效果图：

**7、** 设置RabbitMQ开机自启动服务；

```java
chkconfig rabbitmq-server on
```

效果图：

**8、** 启动RabbitMQ服务；

```java
/sbin/service rabbitmq-server start
```

效果图：

**9、** 使用命令查看RabbitMQ服务是否启动成功；

```java
/sbin/service rabbitmq-server status
```

效果图：

**10、** 开启web管理插件，使能使用界面管理RabbitMQ；

```java
rabbitmq-plugins enable rabbitmq_management
```

效果图：

**11、** 访问web界面；

http://服务器ip:15672

例：

**12、** 创建用户；

```java
rabbitmqctl add_user admin 123456
```

效果图：

**13、** 设置用户角色；

```java
rabbitmqctl set_user_tags admin administrator
```

效果图：

**14、** 设置用户权限；

```java
#表示设置用户admin拥有vhost1这个virtual host中所有资源的配置、写、读权限
rabbitmqctl set_permissions -p "/" admin ".*" ".*" ".*"
```

**15、** 查看当RabbitMQ的所有用户和角色；

```java
rabbitmqctl list_users
```

**16、** 使用新增的用户和密码登录；

效果图：

**17、** 页面简介；

(1)可以在页面上加用户

（2）可以在页面上加Virtual Hosts(类似仓库，不同的Virtual Hosts里的交换机和队列都不一样)

其他：

(1)停止RabbitMQ的服务

```java
/sbin/service rabbitmq-server stop
```
