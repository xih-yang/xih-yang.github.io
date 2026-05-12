# 15、ElasticSearch 实战：Linux下设置 elasticsearch-head 开机自启
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/6/15.html
- 分类：搜索引擎
- 分组：教程目录
## 一、创建脚本文件

在/etc/init.d 目录下，创建脚本文件 elasticsearch-head

```java
#  cd /etc/init.d/
#  vim elasticsearch-head
```

将以下内容写入文件中（其中nodejs安装路径、elasticsearch-head安装路径根据实际情况进行修改）

```java
#!/bin/sh
#chkconfig: 2345 80 05
#description elasticsearch-head
# nodejs 安装路径
export NODE_PATH=/usr/local/node-v12
export PATH=$PATH:$NODE_PATH/bin
# elasticsearch-head 的路径
cd /usr/local/elasticsearch-head
nohup npm run start >/usr/local/elasticsearch-head/nohup.out 2>&1 &
```

保存退出

## 二、设置开机启动

在/etc/init.d 目录下赋予新创建的elasticsearch-head文件执行权限

```java
#  chmod +x elasticsearch-head
```

添加到开机启动任务

```java
#  chkconfig --add elasticsearch-head
```

```java
#  systemctl enable elasticsearch-head
#  systemctl start elasticsearch-head
```

重启机器，检测elasticsearch-head是否自启

```java
#  systemctl status elasticsearch-head
```

服务正常起来，检查服务能否访问

在浏览器访问，http://192.168.56.12:9100 （elasticsearch-head部署IP）

服务访问正常。

至此，Linux环境下设置elasticsearch-head开机自启完成。
