# 02、ActiveMQ 实战 - ActiveMQ下载和安装（Linux版）
- 来源：https://ddkk.com/zhuanlan/mq/activemq/2/2.html
- 分类：消息队列
- 分组：教程目录
### 环境准备

**1、** Linux系统；

**2、** JDK环境；

**3、** ActiveMQ安装包（Linux）；

ActiveMQ官网下载地址：[http://activemq.apache.org/](http://activemq.apache.org/)

### 安装

**1、** 将下载好的安装包解压到linux目录，比如我的是ActiveMQ版本是`5.16.0`，解压的到`/opt`，解压命令：`tar-zxvfapache-activemq-5.16.0-bin.tar.gz`；

**2、** 进入解压路劲的`bin`文件夹，使用`./activemqstart`命令启动ActiveMQ；

**3、** 查看ActiveMQ是否成功启动；

`ps -ef|grep activemq|grep -v grep` （根据名称查看）

启动进程编号为：`4173`，|grep -v grep为了过滤其他冗余的打印信息

`netstat -anp|grep 61616`（根据启动端口查看）

ActiveMQ默认启动端口为`61616`，启动进程编号4173和上一步相呼应。

`lsof -i:61616`

**4、** 使用`./activemqstop`关闭ActiveMQ；

关闭之后用命令查看无信息打印表示成功关闭。

**5、** 使用`./activemqrestart`重启ActiveMQ；

**6、**`./activemqstart>目标文件`带日志的启动方式；

此时ActiveMQ启动日志信息不再控制台打印，而是持久化到了指定的日志文件。使用`cat /log/activemq.log` 查看日志信息。

使用此方式，重启和停止命令同样可以把日志信息持久化到指定的日志文件。

**7、** 指定配置文件方式启动；

ActiveMQ默认使用安装路径下的`conf/activemq.xml`启动服务，也可以像Redis一样，可以使用指定路径下的配置文件启动服务。

命令格式：`./activemq start xbean:file:/配置文件路径`
