# 03、Hadoop 教程 - Hadoop安装和部署过程中的常见问题
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/3/3.html
- 分类：大数据框架
- 分组：教程目录
## 1. ssh没有配置好

在Hadoop的安装过程中，HDFS的主节点NameNode需要跟子节点通信，需要其他机器的免密登录，Yarn里的ResourcesManage也是同样道理，所以在安装之前需要配置好这些主节点所在机器对其他机器的免密登录（即ssh），具体配置可以参考博主的另一篇博客： [基于Centos7的SSH无密登录配置](https://blog.csdn.net/yang_shibiao/article/details/123804973)

## 2. DataNode和NameNode进程同时只能工作一个

## 3. 执行命令不生效

当粘贴其他一键脚本到服务器上执行时，发现执行保存，或者脚本不生效 ，这可能是脚本中的中英符号的问题。

另外当使用远程工具（比如notepad++）编辑服务器上的脚本时，可能也会出现这样的情况，这是因为在win10上编辑的编码方式和服务器上不同，导致脚本不能成功运行，可以复制脚本，然后通过shell工具（比如xshell），将脚本粘贴到服务器上。

## 4. jps命令问题

大数据组件很多都是基于Java虚拟机运行的，所以可以使用JDK中的jps命令查看机器上哪个组件在运行，但是可能会碰到如下问题：

**问题一**：jps发现进程已经没有，但是重新启动集群，提示进程已经开启

此问题的原因是在Linux的根目录下/tmp目录中存在启动的进程临时文件，将集群相关进程删除掉，再重新启动集群。

**问题二**：jps不生效

此问题的原因是全局变量hadoop java没有生效。解决办法：需要source /etc/profile文件。

## 5. 不能通过浏览器访问服务的web页面

安装组件后，大多数组件可以通过浏览器访问该组件的web页面（比如HDFS的9870和Yarn的8088），但是有时候发现组件正常启动，甚至再服务器上使用 curl 都能返回数据，但就是没办法在浏览器上访问，这是因为我们的/etc/hosts配置文件有问题，需要注释其中的 ::1 配置项，如下所示：

```java
#127.0.0.1   localhost localhost.localdomain localhost4 localhost4.localdomain4
#::1         bigdata1
```
