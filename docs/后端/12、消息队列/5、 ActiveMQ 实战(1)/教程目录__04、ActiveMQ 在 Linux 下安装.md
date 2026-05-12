# 04、ActiveMQ 在 Linux 下安装
- 来源：https://ddkk.com/zhuanlan/mq/activemq/1/4.html
- 分类：消息队列
- 分组：教程目录
## 下载安装包

https://activemq.apache.org/components/classic/download/

## 上传至服务器并解压

```sh
[root@ddkk.com activemq]# tar -zxvf apache-activemq-5.16.5-bin.tar.gz 
```

## 安装jdk

下载jdk安装包并上传至服务器，解压至指定目录

```sh
[root@ddkk.com home]# tar -zxvf jdk-8u321-linux-x64.tar.gz -C /usr/local/
```

### 配置环境变量，并使之生效

```sh
[root@ddkk.com home]# vim /etc/profile
[root@ddkk.com home]# source /etc/profile
```

```sh
export JAVA_HOME=/usr/local/jdk1.8.0_321
export PATH=$PATH:$JAVA_HOME/bin
```

## 修改 ActiveMQ 配置文件

## 服务管理

### 启动ActiveMQ

```sh
./activemq start   # 需在activemq的bin目录执行
```

### 查看状态#

```sh
./activemq status
```

### 重启 ActiveMQ

```sh
./activemq restart  
```

### 停止 ActiveMQ

```sh
./activemq stop
```

## 防火墙开放9761及61616端口

```sh
[root@ddkk.com bin]# firewall-cmd --zone=public --add-port=9761/tcp --permanent
[root@ddkk.com bin]# firewall-cmd --zone=public --add-port=61616/tcp --permanent
[root@ddkk.com bin]# firewall-cmd --reload
```

## 验证

## 更改admin密码及创建用户

```sh
[root@ddkk.com bin]# vim ../conf/jetty-realm.properties
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
