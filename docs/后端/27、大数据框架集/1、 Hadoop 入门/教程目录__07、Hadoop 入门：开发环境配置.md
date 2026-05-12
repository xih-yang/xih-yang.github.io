# 07、Hadoop 入门：开发环境配置
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/1/7.html
- 分类：大数据框架
- 分组：教程目录
## 前言

安装路径中不要包含中文、空格

## 修改host文件

- windows

`C:\windows\System32\drivers\etc\hosts`
- Mac os

`/etc/hosts`

*添加以下内容*

```java
# 三台虚拟机的ip以及映射
192.168.77.110  node001.sjj.com  node001
192.168.77.120  node002.sjj.com  node002
192.168.77.130  node003.sjj.com  node003
```

## 配置JAVA环境

*略……*

*注意安装的路径不要有中文名、空格*

*如果是Mac本和Linux一样可以参考：*[为三台CentOS7配置Java](/zhuanlan/bigdata/hadoop/1/2.html)中的配置java环境

## 配置hadoop环境

- **Mac不需要配置**
- **Windows涉及了跨平台所以需要配置**

**1、** 找到我们在Linux中安装hadoop集群所用到的tar.gz包hadoop-3.2.2.tar.gz，将它解压到一个没有中文和空格的目录；

*例如解压后为* C:\hadoop-3.2.2
**2、** 将有为Windows修改过的hadoop包中的bin文件夹中所有文件替换上面解压后的bin目录中；

[github上相关资源](https://github.com/cdarlint/winutils)
**3、** 配置hadoop环境；

```java
# 新增变量名
HADOOP_HOME
C:\hadoop3.2.2
# 添加PATH
%HADOOP_HOME%\bin
%HADOOP_HOME%\sbin
```

**1、** 将hadoop.dll拷贝到C:\Windows\System32；

**2、** 将虚拟机中的5个配置文件core.site.xml、hdfs.site.xml、mapred-site.xml、yarn-site.xml、workers替换C:\hadoop-3.2.2\etc\hadoop中的文件；

**3、** 修改core.site.cmd、hdfs.site.cmd、mapred-site.cmd、yarn-site.cmd文件为windows编码；

**4、** cmd运行hadoop；

## 配置Maven环境

*略……*

*注意安装的路径不要有中文名、空格*

*网络上有更详细的安装教程*

**镜像加速**

```java
<mirror>
  <id>aliyunmaven</id>
  <mirrorOf>*</mirrorOf>
  <name>阿里云公共仓库</name>
  <url>https://maven.aliyun.com/repository/public</url>
</mirror>
```
