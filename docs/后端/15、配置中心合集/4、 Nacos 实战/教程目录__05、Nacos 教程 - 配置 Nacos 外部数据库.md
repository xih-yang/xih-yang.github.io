# 05、Nacos 教程 - 配置 Nacos 外部数据库
- 来源：https://ddkk.com/zhuanlan/registered/nacos/1/5.html
- 分类：注册中心
- 分组：教程目录
## 外部数据库支持

单机模式下Nacos默认使用嵌入式数据库来实现数据的存储，若想要使用外部mysql存储nacos数据，需要进行一下步骤:

**1、** 安装数据库，版本要求5.6.5+,mysql8以下；

**2、** 初始化mysql数据库，新建数据库nacos_config,数据库初始化文件${nacoshome}/conf/nacos-mysql.sql；

**1、** 修改${nacoshome}/conf/application.properties文件，增加支持mysql数据源配置(目前只支持mysql),添加mysql数据源的url,用户名和密码；

**1、** 重启nacos；

## 多数据源的配置

给nacos配置多个数据源

```java
spring.datasource.platform=mysql
### Count of DB:
# db.num=1
db.num=2
### Connect URL of DB:
# db.url.0=jdbc:mysql://127.0.0.1:3306/nacos?characterEncoding=utf8&connectTimeout=1000&socketTimeout=3000&autoReconnect=true&useUnicode=true&useSSL=false&serverTimezone=UTC
# db.user.0=nacos
# db.password.0=nacos
#数据源1
db.url.0=jdbc:mysql://127.0.0.1:3306/nacos?characterEncoding=utf8&connectTimeout=1000&socketTimeout=3000&autoReconnect=true&useUnicode=true&useSSL=false&serverTimezone=UTC
db.user.0=root
db.password.0=123456
#数据源2
db.url.1=jdbc:mysql://127.0.0.1:3306/nacos?characterEncoding=utf8&connectTimeout=1000&socketTimeout=3000&autoReconnect=true&useUnicode=true&useSSL=false&serverTimezone=UTC
db.user.1=root
db.password.1=123456
```
