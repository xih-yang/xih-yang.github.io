# 03、ElasticSearch 实战：安装Elasticsearch、kibana
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/3/3.html
- 分类：搜索引擎
- 分组：教程目录
下面关于es的工具我都是在centos7上安装的，不知道怎么搭虚拟机的也没关系，看一下我这篇文章就会了，很简单：[Windows下傻瓜Vagrant+VirtualBox快速创建centos7虚拟机](https://www.cnblogs.com/bailiyuchuyuan/articles/13280220.html)

演示所需安装包：

**1、** jdk-8u251-linux-x64.tar.gz；

**2、** elasticsearch-5.2.0.tar.gz；

**3、** kibana-5.2.0-linux-x86_64.tar.gz；

我这边提供了一份，自行下载：链接：[https://pan.baidu.com/s/1O1kHY3QV3iXF5sgm4xAZpw](https://pan.baidu.com/s/1O1kHY3QV3iXF5sgm4xAZpw) 提取码：0avf

先永久关闭机器的防火墙

#systemctl stop firewalld

#systemctl disable firewalld

### 1、安装jdk8

把jdk-8u251-linux-x64.tar.gz上传到/usr/local目录

#cd /usr/local/

解压

#tar -zxvf jdk-8u251-linux-x64.tar.gz

配置jdk环境变量

#vi /etc/profile

在最后面加上这段配置

```java
export JAVA_HOME=/usr/local/jdk1.8.0_251
export CLASSPATH=$:CLASSPATH:$JAVA_HOME/lib/
export PATH=$PATH:$JAVA_HOME/bin
```

保存退出

让配置立即生效

#source /etc/profile

检查否是配置成功

#java -version

### 2、安装Elasticsearch-5.2.0

把elasticsearch-5.2.0.tar.gz上传到/usr/local目录

解压

#tar -zxvf elasticsearch-5.2.0.tar.gz

这里要注意一下，es规定root用户不能启动es，所以要建另一个用户来启动es

创建用户名为es的用户

#useradd es

设置es用户的密码

#passwd es

将/usr/local/elasticsearch-5.2.0 的拥有者设置为 es

#chown -R es:es /usr/local/elasticsearch-5.2.0

创建es 的 data 和 logs 目录

#mkdir -p /data/elasticsearch/data /data/elasticsearch/logs

#chown -R es:es /data/elasticsearch

修改配置文件：

#vi elasticsearch-5.1.2/config/elasticsearch.yml

参数值修改成：

```java
path.data: /data/elasticsearch/data
path.logs: /data/elasticsearch/logs
#192.168.0.201是这台机器的ip
network.host: 192.168.0.201
```

保存退出

修改es默认分配的jvm空间大小

`vi/usr/local/elasticsearch-5.2.0/config/jvm.options`

```java
-Xms2g
-Xmx2g
修改为
-Xms512m
-Xmx512m
```

切换用户

#su es

启动es

#/usr/local/elasticsearch-5.2.0/bin/elasticsearch -d

查看es是否启动成功

#ps aux |grep elasticsearch

由于我是没有启动成功的，查看日志

#tail -n 300 /data/elasticsearch/logs/elasticsearch.log

处理报错

切换成root用户

#su root

#vi /etc/security/limits.conf

在最后加上这两行配置

```java
es hard nofile 65536
es soft nofile 65536
```

#vi /etc/sysctl.conf

在最后加上这行配置

```java
vm.max_map_count=262144
```

切换成es用户

#su es

重新启动es

浏览器打开http://192.168.0.201:9200可以看到es已经开启成功

### 3、安装kibana

把kibana-5.2.0-linux-x86_64.tar上传到/usr/local目录

切换成root用户

#su root

解压

#tar -zxvf kibana-5.2.0-linux-x86_64.tar.gz

修改kibana配置：

#vi /usr/local/kibana-5.2.0-linux-x86_64/conf/kibana.yml

把默认配置改成

```java
server.host: "0.0.0.0"
elasticsearch.url: "http://192.168.0.201:9200"
```

启动kibana

#/usr/local/kibana-5.2.0-linux-x86_64/bin/kibana

浏览器打开http://192.168.0.201:5601，大功告成

在Dev Tools页面就可以输入es命令进行调试啦。下一篇开始使用kibana进行命令讲解~
