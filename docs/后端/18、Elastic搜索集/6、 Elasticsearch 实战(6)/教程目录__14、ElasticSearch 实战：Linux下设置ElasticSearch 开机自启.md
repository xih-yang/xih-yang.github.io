# 14、ElasticSearch 实战：Linux下设置ElasticSearch 开机自启
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/6/14.html
- 分类：搜索引擎
- 分组：教程目录
## 一、创建脚本文件

在/etc/init.d 目录下，创建脚本文件 elasticsearch

```java
#  cd /etc/init.d/
#  vim elasticsearch
```

将以下内容写入文件中（其中JDK安装路径、elasticsearch安装路径及用于启动的elasticsearch的用户根据实际情况进行修改）

```java
#!/bin/sh
#chkconfig: 2345 80 05
#description: elasticsearch
export JAVA_HOME=/usr/local/java/jdk1.8.0_171
export JAVA_BIN=/usr/local/java/jdk1.8.0_171/bin
export PATH=$PATH:$JAVA_HOME/bin
export CLASSPATH=.:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar
export JAVA_HOME JAVA_BIN PATH CLASSPATH
case "$1" in
start)
    su -  es<<!
    cd /usr/local/elasticsearch-6.8.1
    ./bin/elasticsearch -d
!
    echo "elasticsearch startup"
    ;;  
stop)
    es_pid=ps aux|grep elasticsearch | grep -v 'grep elasticsearch' | awk '{print $2}'
    kill -9 $es_pid
    echo "elasticsearch stopped"
    ;;  
restart)
    es_pid=ps aux|grep elasticsearch | grep -v 'grep elasticsearch' | awk '{print $2}'
    kill -9 $es_pid
    echo "elasticsearch stopped"
    su - es<<!
    cd /usr/local/elasticsearch-6.8.1
    ./bin/elasticsearch -d
!
    echo "elasticsearch startup"
    ;;  
*)
    echo "start|stop|restart"
    ;;  
esac
exit $?
```

保存退出

## 二、设置开机自启

在/etc/init.d 目录下赋予新创建的elasticsearch文件执行权限

```java
#  chmod +x elasticsearch
```

添加到开机启动任务

```java
#  chkconfig --add elasticsearch
```

重启机器，检测elasticsearch是否自启

```java
#  ps -ef|grep elasticsearch
```

elasticsearch进程已经起来

检测elasticsearch服务是否正常

```java
#  curl http://192.168.56.13:9200
```

服务正常，至此Linux下设置Elasticsearch开机自启完成！
