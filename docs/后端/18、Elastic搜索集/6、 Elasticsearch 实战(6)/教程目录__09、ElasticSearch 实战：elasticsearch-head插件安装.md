# 09、ElasticSearch 实战：elasticsearch-head插件安装
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/6/9.html
- 分类：搜索引擎
- 分组：教程目录
安装node

安装elasticsearch-head需要node.js的支持。

下载最新的node.js，下载地址：[https://nodejs.org/en/download/](https://nodejs.org/en/download/)

将下载后的安装包放在/opt目录下

解压

# tar –xvf node-v10.14.0-linux-x64.tar.xz

配置环境变量

打开/etc/profile

# vi /etc/profile

在最后追加以下内容

```java
export NODE_HOME=/opt/node-v10.14.0-linux-x64
export PATH=$NODE_HOME/bin:$PATH
```

保存退出，重启机器

测试是否配置成功

# node –v

安装elasticsearch-head插件

下载（git方式）

下载地址：[https://github.com/mobz/elasticsearch-head](https://github.com/mobz/elasticsearch-head)

安装git：# yum install git

下载：# git clone [https://github.com/mobz/elasticsearch-head.git](https://github.com/mobz/elasticsearch-head.git)

进入elasticsearch-head目录下，执行命令

# npm install

# npm run start

**配置elasticsearch,允许head**插件访问

进入elasticsearch config目录 打开 elasticsearch.yml

最后加上

```java
http.cors.enabled: true
http.cors.allow-origin: "*"
```

**测试**

打开外部浏览器访问[http://192.168.56.41:9100](http://192.168.56.41:9100)
