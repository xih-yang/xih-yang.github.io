# 04、FastDFS 教程 - 配置fastdfs-apache-module
- 来源：https://ddkk.com/zhuanlan/filestorage/fastdfs/1/4.html
- 分类：分布式存储
- 分组：教程目录
在前边我们已经配置好了FastDFS的环境，但是此时的FastDFS还不能通过http来访问，以前版本的FastDFS中都是集成了http服务器的功能，所以我看到一些比较早的博客中都是在配置的时候就考虑到了http服务器，我也按照他们的方法配置过，但是错误百出，后来发现我所使用的FastDFS_v4.06是需要单独配置apache服务器的，下面就来说一下我的配置过程。

## 一、环境声明

本人在Windows10 64位系统上使用VirtualBox虚拟了一台Ubuntu 14.04 LTS 64位虚拟机，在前面的博客中已经搭建好了FastDFS。FastDFS安装的版本是FastDFS_v4.06，并且采用的是单节点的安装，虚拟机采用网桥网卡方式，IP地址是211.87.226.134。以下所有的命令均是在root用户下执行。

## 二、安装apache以及相关的软件包

执行以下的命令安装Apache已经相关的软件，切记不能只安装apache2，否则在后边的配置中会出现一些文件找不到的情况。

```java
apt-get install apache2 
apt-get install apache2.2-bin 
apt-get install apache2-utils 
apt-get install apache2-mpm-prefork 
apt-get install libapache2-mod-php5 
apt-get install apache2-prefork-dev
```

## 三、安装配置fastdfs-apache-module

**1、** 执行以下的命令进行下载：；

```java
wget https://fastdfs.googlecode.com/files/fastdfs-apache-module_v1.15.tar.gz
```

**2、** 解压并修改Makefile文件；

```java
tar zxvf fastdfs-apache-module_v1.15.tar.gz
cd fastdfs-apache-module/src
gedit Makefile
```

**3、** 修改以下变量的值，如果你的apache是默认安装的，那么就可以使用以下的目录，如果不是请按照自己的配置进行修改；

```java
APACHE_BASE_PATH=/usr/share/apache2/
APXS=/usr/bin/apxs2
APACHECTL=/usr/bin/apachectl
```

**4、** 安装；

```java
make
make install
```

**5、** 配置Apache2；

创建mod_fastdfs.load文件并添加一部分内容

```java
gedit /etc/apache2/mods-available/mod_fastdfs.load
```

在这个文件中添加如下的内容：

```java
LoadModule fastdfs_module /usr/lib/apache2/modules/mod_fastdfs.so
<Location /M00>
    sethandler  fastdfs
</Location>
```

执行以下命令加载mod_fastdfs.so模块

```java
a2enmod mod_fastdfs
```

修改虚拟主机配置，修改相关变量值，增加alias行配置

```java
gedit /etc/apache2/sites-enabled/000-default
```

在文件中添加以下内容：

```java
DocumentRoot /opt/fdfs/data/
<Directory /opt/fdfs/data/>
alias /group1/M00 /opt/fdfs/data
```

修改mod_fastdfs.conf配置

```java
gedit /etc/fdfs/mod_fastdfs.conf
```

将以下内容根据自己的实际情况进行修改

```java
base_path=/home/xing/fastdfs
tracker_server=211.87.226.134:22122
store_path0=/home/xing/fastdfs
```

重启apache使配置生效

```java
/etc/init.d/apache2 restart
```

## 四、测试

FastDFS安装包中，自带了客户端程序，通过程序可以进行文件上传。在使用这个客户端程序之前，首先需要配置client.conf，然后再进行文件上传及下载。

修改%FastDFS%/conf/client.conf文件,修改如下：

可自定义，但此目录必须存在，用于存放文件上传log

```java
base_path=/home/xing/fastdfs
tracker_server=211.87.226.134.121:22122
```

使用以下的命令上传一个文件

```java
fdfs_test %FastDFS%/conf/client.conf upload test.txt
```

上传成功后会返回下面的信息：

我们在本机的浏览器中输入：[http://211.87.226.134/M00/00/00/01fihlag0FiAGaE5AAAAEv-uAfI775_big.txt](http://211.87.226.134/M00/00/00/01fihlag0FiAGaE5AAAAEv-uAfI775_big.txt)来访问这个文件就会显示出如下的结果，注意这里的地址不是返回的file url，而是ip地址加上remote_filename。

文件的内容就显示出来了，这里还有中文的乱码，在之后我再设置一下。
