# 01、Python 教程 - Python3在rhel7下的安装
- 来源：https://ddkk.com/zhuanlan/other/python/3/1.html
- 分类：Python 进阶探索
- 分组：教程目录
**1下载源码包**

拿到源码包Python-3.6.4.tgz —>去官网下载

**2解压源码包**

tar zxf Python-3.6.4.tgz -C /opt/超级用户执行

**3进入解压目录**

```java
 cd /opt/
 cd Python-3.6.4/
```

**4编译和安装**

```java
 yum install gcc zlib zlib-devel openssl-devel -y		#解决依赖性，安装依赖包
 ./configure --prefix=/usr/local/python3 --with-ssl			# --prefix：安装路径	--with-ssl：添加ssl加密
 make && make install	#安装
```

**5测试**

```java
 cd /usr/local/python3/bin
 ./python3		
```

表示python3成功安装

**6添加pytohn3的命令到环境变量中**

- **临时添加**:

```java
  export PATH="/usr/local/python3/bin/:$PATH"
  python3		#测试
```

- **永久添加**

```java
 echo export PATH="/usr/local/python3/bin/:$PATH" >> ~/.bashrc
  vim ~/.bashrc			#查看文件中是否有Python3的环境变量
  source ~/.bashrc
  python3
```

测试出现以下界面表示环境变量安装成功：
