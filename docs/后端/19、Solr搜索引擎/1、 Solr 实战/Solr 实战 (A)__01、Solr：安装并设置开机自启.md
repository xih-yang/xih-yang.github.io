# 01、Solr：安装并设置开机自启
- 来源：https://ddkk.com/zhuanlan/search/solr/2/1.html
- 分类：搜索引擎
- 分组：Solr 实战 (A)
## 0. 引言

虽然现在主流的搜索引擎组件已经es主导，但不乏有部分“老”项目依旧在采用solr，当遇到这类项目时，如何快速上手solr组件，以及后续如何拓展深入研究solr的途径成为问题，本期我们的目的就是带大家来快速上手solr，掌握solr的基础使用

## 1. solr简介

solr是基于`Apache Lucene`构建的用于搜索和分析的开源组件，这一点与es一样，作为搜索引擎自然支持分词查询、海量数据查询、高亮显示等

solr是基于java开发的，内嵌了jetty容器，安装简单，同时自带了一个管理端，这一点比es相比不用再额外再安装一个kibana。

solr源码地址：[https://github.com/apache/solr](https://github.com/apache/solr)

solr官网文档：[https://solr.apache.org/guide/solr/latest/index.html](https://solr.apache.org/guide/solr/latest/index.html)

## 2. solr安装

### 2.1 单节点安装

**1、** 因为solr是基于java开发的，所以需要首先在服务器上安装jdk环境，这里我安装的`jdk1.8`；

**2、** 下载solr安装包，下载地址：[https://solr.apache.org/downloads.html](https://solr.apache.org/downloads.html)；

如果下载最新版可以直接在该页面点击下载

如果下载历史版本，可在[Lucene archives for pre-9.0 releases](https://archive.apache.org/dist/lucene/solr/)点击下载

这里我选择`8.2.0`版本下载

**3、** 下载好的安装包上传到linux服务器，或者直接在linux上通过`wget`指令下载；

**4、** 解压安装包；

```bash
## 这里我上传到了/data目录
tar -xvzf /data/solr-8.2.0.tgz
```

**5、** 修改solr启动参数，取消健康检查，否则启动会报警告；

```bash
cd /data/solr-8.2.0/bin
vim solr.in.sh
```

修改内容

```bash
SOLR_ULIMIT_CHECKS=false
```

**6、** 启动solr；

solr不推荐使用root账户启动，这点与es也相同，当然可以直接用`-force`参数，强制启动

```bash
./solr start -force
```

如果需要修改端口，可以通过`-p`参数指定

```bash
./solr start -p 8089 -force
```

启动成功可以看到日志打印

**7、** 因为solr默认端口为8983，于是我们还需要开启端口，如果没有防火墙已经关闭则不用再开启；

```bash
## 开启端口
firewall-cmd --add-port=8983/tcp --permanent
## 重新加载
firewall-cmd --reload
## 查看端口是否开放
firewall-cmd --query-port=8983/tcp
```

**8、** 访问服务器ip:8983，可查看到solr管理界面；

**9、** 至此，单机版solr就安装完成了！；

### 2.2 设置solr开机自启

安装完成后我们还需要将solr设置开机自启，不然方服务器重启后，我们还要手动启动solr，比较麻烦

**1、** 编写启动脚本；

```bash
cd /etc/init.d
vim solr
```

脚本内容：

```bash
##!bin/bash
##chkconfig:2345 55 25
##processname:solr
##description:solr server
prog=/data/solr-8.2.0/bin/solr      
start(){
        $prog start -force
        echo "solr启动"
}
stop(){
        $prog stop -all
        echo "solr关闭"
}
restart(){
        stop
        start
}
case "$1" in        
"start")
        start      
        ;;
"stop")            
        stop
        ;;
"restart")            
        restart
        ;;
*)      
        echo "支持指令：$0 start|stop|restart"
        ;;
esac
```

其中：

> chkconfig:2345 55 25 用于设置开机自启时的运行级别、启动优先级、关闭优先级
>
> processname:solr 设置启动的进程名
>
> description:solr server 服务描述

**2、** 给脚本赋权；

```bash
chmod +x /etc/init.d/solr
```

**3、** 执行脚本，进行验证；

```bash
service solr stop
service solr start
```

这里执行可能会出现错误“找不到java”

这需要配置solr的java路径

```bash
vim /data/solr-8.2.0/bin/solr.in.sh 
```

修改内容：将`SOLR_JAVA_HOME`设置为jdk安装路径

```bash
SOLR_JAVA_HOME="/var/local/zulu8.58.0.13-ca-jdk8.0.312-linux_aarch64"
```

设置成功后执行，可以看到日志打印

**4、** 设置开机自启；

```bash
## 添加开机自启
chkconfig --add solr
## 开启solr启动
chkconfig solr on
```

**5、** 重启服务器，访问solr管理界面，发现能直接访问，说明开机自启成功；
