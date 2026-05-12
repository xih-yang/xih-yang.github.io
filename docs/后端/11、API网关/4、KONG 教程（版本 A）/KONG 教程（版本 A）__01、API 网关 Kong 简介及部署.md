# 01、API 网关 Kong 简介及部署
- 来源：https://ddkk.com/zhuanlan/gateway/kong/d-1/1.html
- 分类：API网关
- 分组：KONG 教程（版本 A）
最近搭建一个api-gateway服务，随着后端restful api不断增加， 权限控制，安全，负载均衡，请求分发，监控等都成了问题

## 1、为什么使用API-Gateway

1、方便客户端维护-- 每个请求方不用管理多个api url，统一访问api-gateway即可

2、接口重构时调用方不须了解接口本身等拆分和聚合

3、客户端无须关心接口协议

4、统一权限控制、接口请求访问日志统计

5、安全，是保护内部服务而设计的一道屏障

5、**开源**-最大好处

当然也有一个很大的缺点，api-gw很可能成为性能瓶颈，因为所有的请求都经过这里，可以通过横向扩展和限流解决这个问题。

在众多API GATEWAY框架中，Mashape开源的高性能高可用API网关和API服务管理层——[KONG](https://link.jianshu.com?t=https://getkong.org/)（基于NGINX）特点尤为突出，它可以通过插件扩展已有功能，这些插件（使用lua编写）在API请求响应循环的生命周期中被执行。于此同时，KONG本身提供包括HTTP基本认证、密钥认证、CORS、TCP、UDP、文件日志、API请求限流、请求转发及NGINX监控等基本功能。目前，Kong在Mashape管理了超过15,000个API，为200,000开发者提供了每月数十亿的请求支持。

Kong是一款基于Nginx_Lua模块写的高可用，由于Kong是基于Nginx的，所以可以水平扩展多个Kong服务器，通过前置的负载均衡配置把请求均匀地分发到各个Server，来应对大批量的网络请求。

Kong主要有三个组件：

- Kong Server ：基于nginx的服务器，用来接收API请求。
- Cassandra/PostgreSQL ：用来存储操作数据。
- Kong dashboard：官方推荐UI管理工具，当然，也可以使用 restfull 方式 管理admin api

**以下实践环境：**

操作系统：macOS

kong版本：0.13.x

PostgreSQL：10.3

npm版本：5.6.0 , node : 6.0.0+ （用于部署kong-dashboard，也可以通过docker部署）

kong-dashboard：3.3.x

## 2、安装/部署kong

### 2.1、安装postgresql

kong将其所有数据（如API，用户和插件）存储在Cassandra或PostgreSQL中。 属于同一集群的所有Kong节点必须连接到同一个数据库。

database：配置此节点来指定KONG使用哪个数据库（PostgreSQL或Cassandra）作为其数据存储。可选的数据库只有postgres和cassandra，默认为 postgres。

Postgres的设置：

pg_host：Postgres的服务器的主机地址

pg_port：Postgres的服务器的端口

pg_user：Postgres用户名

pg_password：Postgres的用户密码

pg_database：要连接的数据库实例名，必须存在

pg_ssl：是否启用与服务器的SSL连接

pg_ssl_verify：如果启用了pg_ssl，则切换服务器证书验证。请参阅lua_ssl_trusted_certificate设置。

### 2.2、安装postgresql

- 安装

```sh
brew install postgresql 
```

- 查看是否安装成功

```sh
#查看安装路径
MacBook-Pro:~$ which psql
/usr/local/bin/psql
#查看pg 版本
MacBook-Pro:~$ pg_ctl -V
pg_ctl (PostgreSQL) 10.3
```

- 设置配置文件

```sh
vim /usr/local/var/postgres/postgresql.conf
#设置host和port,其他使用默认值
# - Connection Settings -
listen_addresses = 'localhost'          # what IP address(es) to listen on;
                                        # comma-separated list of addresses;
                                        # defaults to 'localhost'; use '*' for all
                                        # (change requires restart)
port = 5432                             # (change requires restart)
max_connections = 100                   # (change requires restart)
#superuser_reserved_connections = 3     # (change requires restart)
```

- 启动pg数据库

```sh
pg_ctl -D /usr/local/var/postgres -l /usr/local/var/postgres/server.log start
```

- 查看数据库访问日志

```sh
cat /usr/local/var/postgres/server.log
```

- 查看数据库运行状态

```sh
pg_ctl -D /usr/local/var/postgres -l /usr/local/var/postgres/server.log status 
```

- 停止数据库服务

```sh
pg_ctl -D /usr/local/var/postgres -l /usr/local/var/postgres/server.log stop -s -m fast
```

- 查看数据库运行进程

```sh
ps -ef |grep postgres 或 ps auxwww | grep postgres 
```

数据库运行正常后，开始创建kong账号和数据库，可以通过pg命令创建db和user，也可以通过psql命令进入数据库后创建

- 命令行创建kong数据库和用户

```sh
#创建数据库用户-kong
createuser kong -P  
#创建数据库/密码-kong/kong
createdb kong -O kong -E UTF8 -e
```

然后就可以通过navicat图形化连接pg数据库kong

- 也可以连接到数据库后创建数据库，但用户要先创建好

```sh
MacBook-Pro:~$ psql -h localhost -p 5432 -U kong -W kong
Password for user kong:
psql (10.3)
Type "help" for help.
kong=> select * from test;
 id | name
----+------
(0 rows)
```

到此，数据库就配置好了，然后安装kong，需要将postgresql的配置加入到kong配置中

**其它**

- 数据导出和导入，和mysql类似

```sh
#远程导出表结构和数据：
pg_dump -h REMOTE_IP kong -U kong -p 5432 -f kong.dump  
#远程导出表结构，不带数据
pg_dump -s -h REMOTE_IP kong -U kong -p 5432 -f kong.dump  
导入本地数据库：
psql -h localhost kong -U kong -p 5432 -f kong.dump 
```

- navicat图形化连接，此时数据表还没有，配置好kong.conf后执行初始化配置后会自动生成相关kong数据表

### 2.3、安装kong

**安装**

Mac版安装参考[官网](https://getkong.org/install/osx/?_ga=2.258828418.92012116.1526625712-1794615016.1525146272)，

- 安装

```sh
$ brew tap kong/kong
$ brew install kong
```

- 数据库准备

按照上述postgresql安装，已经准备好存储，现在需要执行kong migrations来初始化数据库表

```sh
$ kong migrations up
```

这里我没有指定配置文件，使用的都是kong默认的配置，也可以指定自定义配置文件

```sh
#kong.conf的路径，默认是/etc/kong/kong.conf
$ kong migrations up [-c /path/to/kong.conf]
```

也不知道为啥，官网说默认会在/etc/kong/下自动生成配置文件kong.conf，但我本机没有在这个目录生成，在这个目录下/usr/local/opt/kong，anyway,目前还没有影响

执行好后，数据库会生成很多表，这些是默认但kong数据表，后续可以自定义插件，重新migrations，会生成自定义表

最常用的是apis、ratelimiting_metrics表，也有自带的keyauth，oauth认证插件，后续篇章再做演示说明

- 默认kong插件在如下目录，自定义插件后续加在这里

```sh
cd /usr/local/share/lua/5.1/kong/plugins/
```

- 启动kong，这里没有用到nginx-kong.conf

```sh
$ kong start [-c /path/to/kong.conf]
```

- 停止kong

```sh
$ kong stop
Kong stopped
$ kong start
Kong started
$
```

- 使用kong

```sh
curl -i http://localhost:8001/
```

成功启动后访问：http://localhost:8001/ 会出现kong的admin-api json

默认情况下，KONG监听的端口为：

·**8000：此端口是KONG用来监听来自客户端传入的HTTP请求，并将此请求转发到上有服务器；**

·8443：此端口是KONG用来监听来自客户端传入的HTTP请求的。它跟8000端口的功能类似，但是它只是用来监听HTTP请求的，没有转发功能。可以通过修改配置文件来禁止它；

·**8001：[Admin API](https://getkong.org/docs/0.13.x/admin-api/)，通过此端口，管理者可以对KONG的监听服务进行配置；**

·8444：通过此端口，管理者可以对HTTP请求进行监控.

### 2.4、接口接入kong测试

- 原接口

访问上海天气预报的接口 ：https://www.sojson.com/open/api/weather/json.shtml?city=%E4%B8%8A%E6%B5%B7

```sh
$ curl -i -X GET 'https://www.sojson.com/open/api/weather/json.shtml?city=%E4%B8%8A%E6%B5%B7'
HTTP/2 200
server: marco/2.2
date: Tue, 22 May 2018 04:26:20 GMT
content-type: application/json;charset=UTF-8
vary: Accept-Encoding
x-source: C/200
content-disposition: inline;filename=f.txt
cache-control: no-cache, no-store, must-revalidate
pragma: no-cache
expires: Sat, 03 Mar 1990 23:33:33 GMT
accept-ranges: bytes
x-request-id: ff9f2b7ad8dd595cb1690e2c5bab92cd
via: S.mix-sd-dst-036, T.37.-, V.mix-sd-dst-035, T.75.-, M.cun-he-tvs2-074
{"date":"20180522","message":"Success !","status":200,"city":"上海","count":1556,"data":{"shidu":"92%","pm25":22.0,"pm10":42.0,"quality":"优","wendu":"19","ganmao":"各类人群可自由活动","yesterday":{"date":"21日星期一","sunrise":"04:56","high":"高温 22.0℃","low":"低温 19.0℃","sunset":"18:46","aqi":44.0,"fx":"东风","fl":"<3级","type":"小雨","notice":"雨虽小，注意保暖别感冒"},"forecast":[{"date":"22日星期二","sunrise":"04:55","high":"高温 25.0℃","low":"低温 18.0℃","sunset":"18:47","aqi":50.0,"fx":"东南风","fl":"3-4级","type":"中雨","notice":"记得随身携带雨伞哦"},{"date":"23日星期三","sunrise":"04:55","high":"高温 26.0℃","low":"低温 17.0℃","sunset":"18:47","aqi":65.0,"fx":"无持续风向","fl":"3-4级","type":"晴","notice":"愿你拥有比阳光明媚的心情"},{"date":"24日星期四","sunrise":"04:54","high":"高温 26.0℃","low":"低温 20.0℃","sunset":"18:48","aqi":82.0,"fx":"东南风","fl":"<3级","type":"多云","notice":"阴晴之间，谨防紫外线侵扰"},{"date":"25日星期五","sunrise":"04:54","high":"高温 29.0℃","low":"低温 23.0℃","sunset":"18:49","aqi":101.0,"fx":"东南风","fl":"<3级","type":"小雨","notice":"雨虽小，注意保暖别感冒"},{"date":"26日星期六","sunrise":"04:53","high":"高温 28.0℃","low":"低温 22.0℃","sunset":"18:49","aqi":118.0,"fx":"西风","fl":"<3级","type":"小雨","notice":"雨虽小，注意保暖别感冒"}]}}
$
$
```

- 接口注册kong

```sh
curl -i -X POST \
  --url  http://localhost:8001/apis/ \
  --data 'name=weather-api' \
  --data 'hosts=www.sojson.com' \
  --data 'upstream_url=https://www.sojson.com/open/api/weather/json.shtml'
```

name是全局唯一，后续对注册接口的插件修改都可以用到，host放在header里指定，upstream_url是转发的真实的上游接口

注册成功，则pg数据库的apis表会添加一条记录

- 通过kong访问此天气接口

```sh
curl -i -X GET \
  --url http://localhost:8000?city=上海 \
  --header 'Host: www.sojson.com'
```

kong完美的实现了接口转发～

注意注册时，'hosts', 'uris' or 'methods'三个参数至少有一个必须指定

### 2.5、安装kong-dashboard

kong已经提供了非常友好的restful api，但还是看起来不直观，其实如果很闲的话可以自己根据这些kong API写个前端，不然就要使用懒人必备[kong-dashboard](https://github.com/PGBI/kong-dashboard)，搭建起来非常简单.

作为nodejs常用开发者，npm包必不可少，使用npm全局安装kong-dashboard

```sh
# Install Kong Dashboard
npm install -g kong-dashboard
# Start Kong Dashboard
kong-dashboard start --kong-url http://kong:8001
# 使用自定义端口启动kong-dashboard
kong-dashboard start \
  --kong-url http://localhost:8001 \
  --port 8088
```

```sh
$ kong-dashboard start \
>   --kong-url http://localhost:8001 \
>   --port 8088
Connecting to Kong on http://localhost:8001 ...
Connected to Kong on http://localhost:8001.
Kong version is 0.13.1
Starting Kong Dashboard on port 8088
Kong Dashboard has started on port 8088
```

- 启动好后访问 localhost:8088 进入kong-dashboard首页

kong还有一个比较知名的API管理的GUI -[KONGA](https://github.com/pantsel/konga)，下面也来简单部署一下

### 2.6、KONGA -ADMIN API GUI

kongA也是依赖nodejs和npm启动的

```sh
$ git clone https://github.com/pantsel/konga.git
$ cd konga
$ npm install
```

更改数据库配置

```sh
cp /config/local_example.js /config/local.js
#更改数据库连接配置
 connections: {
  host: 'localhost',
  port: 5432,
  schema: false,
  ssl: false,
  adapter: 'postgres',
  user: 'kong',
  password: 'kong',
  database: 'kong',
  identity: 'postgres'
  },
models: {
    connection: process.env.DB_ADAPTER || 'postgres'
}
```

启动

```sh
npm start
```

启动后访问： http://localhost:1338/

konga部署起来比kong-dashboard要复杂～

kong部署和安装到此为止，下面顺便介绍下kong命令行

## 3、KONG CLI

### 3.1、全局参数

即所有命令都可加下面都参数

--help 帮助命令

--v 开启详细信息模式

--vv开启debug模式

### 3.2、命令行

**kong check**

检查kong.conf有效性

```sh
用法: kong check [conf]
[conf] (默认check  /etc/kong.conf or /etc/kong/kong.conf) 
```

**kong prepare**

准备kong的前置文件夹和子文件夹和文件---讲真，我不清楚这个命令的用处，反正我没用到过

```sh
用法: kong prepare [OPTIONS]
此命令可从nginx中启动kong代替kong start
示例： sudo kong prepare -p /usr/local/opt/kong -c /etc/kong/kong.conf && kong migrations up &&  nginx -p /usr/local/opt/kong -c nginx.conf
Options:
 -c,--conf    (optional string) configuration file
 -p,--prefix  (optional string) override prefix directory
 --nginx-conf (optional string) custom Nginx configuration template
```

**kong health**

检查kong 节点健康状况

```sh
Usage: kong health [OPTIONS]
Options:
  -p,--prefix (optional string) prefix at which Kong should be running
```

```sh
$ kong health
nginx.......running
Kong is healthy at /usr/local/opt/kong
```

**kong migrations**

管理kong数据库

```sh
用法: kong migrations COMMAND [OPTIONS]
可用的参数:
  list    #列出迁移的数据列表
  up     #执行所有丢失的迁移到最新版本，初始化即执行这个
  reset  #重置数据库，不可逆，执行完即删除kong数据表，亲测，谨慎操作 (irreversible).
Options:
  -c,--conf (optional string) configuration file
```

**kong quit**

从一个运行到kong节点中退出

```sh
用法: kong quit [OPTIONS]
此命令发送一个SIGQUIT信号给nginx,表示所有到请求都要结束在服务关闭前，如果指定的timeout时间到，则立即强制退出
Options:
  -p,--prefix  (optional string) prefix Kong is running at
  -t,--timeout (default 10) timeout before forced shutdown
```

**kong reload**

**kong restart**

**kong start**

Start Kong (Nginx and other configured services) in the configured

prefix directory.

```sh
用法: kong start [OPTIONS]
示例：kong start -c /etc/kong/kong.conf --nginx-conf=/etc/kong/nginx.conf --vv
Options:
  -c,--conf        (optional string)   kong.conf
  -p,--prefix      (optional string)   kong前置目录
  --nginx-conf     (optional string)  自定义nginx模版
  --run-migrations (optional boolean)  optionally run migrations on the DB
```

**kong stop**

停止kong服务

```sh
Usage: kong stop [OPTIONS]
Stop a running Kong node (Nginx and other configured services) in given
prefix directory.
This command sends a SIGTERM signal to Nginx.
Options:
  -p,--prefix (optional string) prefix Kong is running at
```

**kong version**

查看kong版本

```sh
$ kong version -a
Kong: 0.13.1
ngx_lua: 10011
nginx: 1013006
Lua: LuaJIT 2.1.0-beta3
```

reference:

[https://sdk.cn/news/1596](https://sdk.cn/news/1596)

[http://www.cnblogs.com/SummerinShire/p/6386086.html](http://www.cnblogs.com/SummerinShire/p/6386086.html)

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://www.cnblogs.com/zhoujie/tag/kong/
