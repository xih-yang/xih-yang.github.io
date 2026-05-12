# 47、MongoDB 管理工具: Rockmongo
- 来源：https://ddkk.com/zhuanlan/db/mongodb/47.html
- 分类：缓存数据库
- 分组：教程目录
通过Rockmongo 我们可以管理 MongoDB 服务，数据库，集合，文档，索引等等

Rockmongo 提供了非常人性化的操作，类似 phpMyAdmin（ PHP开发的 MySql 管理工具）

Rockmongo 下载地址： [http://rockmongo.com/downloads](http://rockmongo.com/downloads)

## Rockmongo 主要特征

- 使用宽松的 [New BSD License](http://www.opensource.org/licenses/bsd-license.php) 协议
- 速度快，安装简单
- 支持多语言（目前提供中文、英文、日文、巴西葡萄牙语、法语、德语、俄语、意大利语）
- 系统
- 可以配置多个主机，每个主机可以有多个管理员
- 需要管理员密码才能登入操作，确保数据库的安全性
- 服务器
- 服务器信息 (WEB服务器, PHP, PHP.ini相关指令 …)
- 状态
- 数据库信息
- 数据库
- 查询，创建和删除
- 执行命令和Javascript代码
- 统计信息
- 集合（相当于表）
- 强大的查询工具
- 读数据，写数据，更改数据，复制数据，删除数据
- 查询、创建和删除索引
- 清空数据
- 批量删除和更改数据
- 统计信息
- GridFS
- 查看分块
- 下载文件

## 安装

### 安装需求

**1、** 一个能运行PHP的Web服务器，比如ApacheHttpd,Nginx；

**2、** PHP需要PHPv5.1.6或更高版本，需要支持SESSION为了能连接MongoDB，需要安装[php_mongo](http://www.php.net/manual/en/mongo.installation.php)扩展；

### 快速安装

**1、**[下载安装包](http://rockmongo.com/downloads)；

**2、** 解压到网站目录下；

**3、** 用编辑器打开**config.php**，修改host,port,admins等参数；

**4、** 在浏览器中访问**index.php**，例如http://localhost/rockmongo/index.php；

**5、** 使用用户名和密码登录，默认为“admin”和“admin”；

**6、** 开始玩转MongoDB；

### 参考文档

**1、**[http://rockmongo.com/wiki/introduction?lang=zh_cn](http://rockmongo.com/wiki/introduction?lang=zh_cn)；
