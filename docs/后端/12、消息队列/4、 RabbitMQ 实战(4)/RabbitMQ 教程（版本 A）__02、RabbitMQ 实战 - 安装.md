# 02、RabbitMQ 实战 - 安装
- 来源：https://ddkk.com/zhuanlan/mq/rabbitmq/4/2.html
- 分类：消息队列
- 分组：RabbitMQ 教程（版本 A）
## RabbitMQ服务器如何安装？

RabbitMQ是一个AMQP（Advanced Message Queue，即高级消息队列协议）服务器 。

下载地址： [RabbitMQ下载](https://www.rabbitmq.com/download.html)

安装说明：[各平台下RabbitMQ安装指南](https://www.rabbitmq.com/download.html#installation-guides)

### 1 Windows 下安装RabbitMQ

**1.1 点击 [RabbitMQ下载](https://www.rabbitmq.com/download.html) 我们可以看到这个页面**

**1.2. 这里我们选择图中推荐的 [Windows 安装RabbitMQ 文档](https://www.rabbitmq.com/install-windows.html)**

下载完成后选中*.exe 文件右键管理员身份运行，一般情况下会出现这个

Tips: 这是怎么回事呢?

由于RabbitMQ 是由Erlang语言编写而成，所以一般情况在安装RabbitMQ之前，我们还需要安装Erlang的运行环境，类似java中的JRE或者C#中的 .net framework.

**1.3. 下载安装Erlang**

点击是，会自动打开[Erlang 的官方下载页面](http://www.erlang.org/downloads)

根据自己的电脑选择对应的版本，我的电脑是windows 10 64 位，所以这里选择64 位，如果你的电脑是32 位清选择32 位版本。

这里默认是没有勾选的，我们需要勾选下，然后点击 Next，根据提示安装完成即可。

安装的时候默认我发现已经生成了

Tips: 如果没有请自行添加

将Erlang 添加到Path路径下

```java
%ERLANG_HOME%\bin
```

**1.4. 安装RabbitMQ**

安装完成Erlang 之后，我们再次运行我们的RabbitMQ 安装包

默认的安装路径是C:\Program Files\RabbitMQ Server\rabbitmq_server-3.7.6

**1.5. 配置环境变量**

一般情况下，我们最好配置下环境变量以便于我们今后更好地使用。

```java
RABBITMQ_BASE
```

```java
C:\Program Files\RabbitMQ Server\rabbitmq_server-3.7.6
```

然后我们需要添加到Path变量中

```java
%RABBITMQ_BASE%\sbin
```

**1.6. 重新安装service**

要使环境更改在Windows上生效，必须重新安装该服务。 重启服务是不够的。

这可以使用安装程序或者在具有管理员权限的命令行上完成。

注意：有两个文件**rabbitmq-service.bat** 和 rabbitmq-server.bat 别弄混了，不然执行命令会失败

管理员权限运行cmd 命令行，进入安装文件夹下的sbin目录

这个RabbitMQ service 服务是自动开启的，所以我们需要先停止RabbitMQ服务

```java
rabbitmq-service.bat stop
```

然后移除RabbitMQ服务

```java
rabbitmq-service.bat remove
```

再次安装

```java
rabbitmq-service.bat install
```

总结：关于RabbitMQ Service的用法

**1.7. 检测RabbitMQ 运行状态**

首先打开服务

```java
rabbitmq-service start
```

如果我们想查看RabbitMQ 的运行状态，那么输入下列命令即可

```java
rabbitmqctl status
```

但是当年你输入后可能会看到这样的错误信息

解决方案：

C:\Windows\System32\config\systemprofile\.erlang.cookie

C:\Users\fairy\.erlang.cookie

对比下这两个文件，你会发现里面的值不一样，这就是导致这个错误的原因。

我们只需要将其中一个替换掉，两个保持统一即可，比如将系统下的那个文件替换掉个人用户下的那个文件

再次执行命令

```java
rabbitmqctl status
```

执行成功后可以看到下面的回显：

**1、** 8.安装RabbitMQWeb的管理插件；

执行命令

```java
rabbitmq-plugins enable rabbitmq_management
```

要生效需要重启下RabbitMQ Server

**1.9. 查看当前用户列表**

```java
rabbitmqctl.bat list_users
```

执行成功后可以看到如下回显：

**10.打开RabbitMQ Web 管理界面**

```java
http://127.0.0.1:15672/
```

执行成功后可以看到这个界面

默认端口是15672

账号和密码默认都是guest

登陆后可以看到这样的管理界面

## 11. 添加远程登录用户

登录后

双击进去

设置权限
