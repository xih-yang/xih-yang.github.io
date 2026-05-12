# 02、RabbitMQ 安装和使用
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/1/2.html
- 分类：消息队列
- 分组：RabbitMQ 教程（版本 A）
## 1、RabbitMQ安装

### 1.1、下载RabbitMQ安装包和erlang语言环境

### 1.2、上传到linux系统root目录下的/opt目录**

### 1.3、安装erlang语言环境

```java
rpm -ivh erlang-21.3-1.el7.x86_64.rpm
```

### 1.4、安装依赖包(必须联网)

```java
yum install socat -y
```

### 1.5、安装RabbitMQ

```java
rpm -ivh rabbitmq-server-3.8.8-1.el7.noarch.rpm
```

## 2、什么是集合？

### 2.1、添加开机启动RabbitMQ服务

```java
chkconfig rabbitmq-server on
```

### 2.2、启动服务

```java
/sbin/service rabbitmq-server start
```

### 2.3、查看服务状态

```java
/sbin/service rabbitmq-server status
```

### 2.4、停止服务(选择执行)

```java
/sbin/service rabbitmq-server stop
```

### 2.5、开启 web 管理插件

```java
rabbitmq-plugins enable rabbitmq_management
```

用默认账号密码(guest)访问地址 [http://192.168.137.4:15672/](http://192.168.137.4:15672/) 出现权限问题

### 2.6、添加一个新用户

**1、** 创建账号；

```java
rabbitmqctl add_user admin 123
```

**2、** 设置用户角色；

```java
rabbitmqctl set_user_tags admin administrator
```

**3、** 设置用户权限；

```java
rabbitmqctl set_permissions -p "/" admin ".*" ".*" ".*"
#用户 user_admin 具有/vhost1 这个 virtual host 中所有资源的配置、写、读权限
```

**4、** 查看rabbitMQ角色及权限；

```java
rabbitmqctl list_users
```

### 2.7、输入账号：admin和密码123登陆成功**

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
