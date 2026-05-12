# 21、client配置
- 来源：https://ddkk.com/zhuanlan/config/disconf/21.html
- 分类：配置中心
- 分组：配置项
## 1.1. Disconf-Client

### 配置文件 disconf.properties 说明

所有配置均可以通过 命令行 `-Dname=value` 参数传入。

配置项
说明
是否必填
默认值

disconf.conf_server_host
配置服务器的 HOST,用逗号分隔 ，示例：127.0.0.1:8000,127.0.0.1:8000
是
必填

disconf.app
APP 请采用 产品线_服务名 格式
否
优先读取命令行参数，然后再读取此文件的值

disconf.version
版本号, 请采用 X_X_X_X 格式
否
默认为 DEFAULT_VERSION。优先读取命令行参数，然后再读取此文件的值，最后才读取默认值。

disconf.enable.remote.conf
是否使用远程配置文件，true(默认)会从远程获取配置， false则直接获取本地配置
否
false

disconf.env
环境
否
默认为 DEFAULT_ENV。优先读取命令行参数，然后再读取此文件的值，最后才读取默认值

disconf.ignore
忽略的分布式配置，用空格分隔
否
空

disconf.debug
调试模式。调试模式下，ZK超时或断开连接后不会重新连接（常用于client单步debug）。非调试模式下，ZK超时或断开连接会自动重新连接。
否
false

disconf.conf_server_url_retry_times
获取远程配置 重试次数，默认是3次
否
3

disconf.conf_server_url_retry_sleep_seconds
获取远程配置 重试时休眠时间，默认是5秒
否
5

disconf.user_define_download_dir
用户定义的下载文件夹, 远程文件下载后会放在这里。注意，此文件夹必须有有权限，否则无法下载到这里
否
./disconf/download

disconf.enable_local_download_dir_in_class_path
下载的文件会被迁移到classpath根路径下，强烈建议将此选项置为 true(默认是true)
否
true

### 自定义 disconf.properties 文件的路径

一般情况下，disconf.properties 应该放在应用程序的根目录下，如果想自定义路径可以使用：

```java
-Ddisconf.conf=/tmp/disconf.properties
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://disconf.readthedocs.io/zh_CN/latest/index.html
