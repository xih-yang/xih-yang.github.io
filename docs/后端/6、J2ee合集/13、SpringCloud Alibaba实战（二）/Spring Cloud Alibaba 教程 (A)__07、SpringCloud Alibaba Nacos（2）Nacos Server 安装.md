# 07、SpringCloud Alibaba Nacos（2）Nacos Server 安装
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/40.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
在使用 Nacos 之前我们首先要获取和安装 Nacos。

## 1.Nacos Server 的下载

因为 SpringCloud Alibaba 2.2.0.RELEASE 内置的 Nacos client 版本为 1.1.4，所以我们使用这个 版本的 Nacos。[Nacos 下载地址](https://github.com/alibaba/nacos/releases)

我们找到 1.1.4 版本后点击：

找到相关系统的压缩包，这里面我使用的是 window 系统，所以我们选择nacos-server-1.1.4.zip 该文件，来点击下载他。

## 2.Nacos Server 目录的说明

将下载的 nacos-server-1.1.4 复制到开发工具的文件夹里面。（没有的朋友可以新建 一个，养成一个良好的习惯）

使用压缩软件解决到当前的文件夹，这里我使用的是 7-zip（其他的压缩软件类似）：

解压完成后，进入 Nacos 目录里面：

- bin：可执行文件夹目录，包含：启动、停止命令等等
- conf：配置文件目录
- target：存放 naocs-server.jar
- LICENSE：授权信息，Nacos 使用 Apache License Version 2.0 授权
- NOTICE：公告信息

## 3.配置 Nacos Server

进入`$`{Nacos}/conf 目录里面，使用文件编辑器打开 application.properties 文件，这里面我使用的是 sublime text：

打开后，如下图所示：

- Nacos 默认使用嵌入式数据库实现数据的存储，并不方便观察数据存储的基本情况，这里面我们修改为使用 Mysql 数据库做数据的存储，方便我们观察数据的结构。
- 在配置文件末尾添加如下配置：

```bash
spring.datasource.platform=mysql
db.num=1
db.url.0=jdbc:mysql://localhost:3306/nacos?characterEncoding=utf8&connectTimeout=1000&socketTimeout=3000&autoReconnect=true
db.user=root
db.password=root
```

**注意：**

- 上面的 url 地址是我的服务器地址，如果你的 mysql 安装在虚拟机或云服务器上面，就填写真实的地址。
- db.user 用户名
- db.password 密码

## 4.Mysql 表的导入

- 提示：Nacos 建议使用 5.7 以上的 Mysql 数据库，版本较低可能存储兼容性问题
- 我使用的 Mysql 数据库版本为 5.7
- 打开`$`{Nacos}/conf/文件夹：

其中 nacos-mysql.sql 就是 nacos 提供给我们的 sql 语句。

新建数据库：

新建 Nacos 的的数据库：

点击确定完成创建。

导入 sql 语句：

选择我们 nacos-mysql.sql 文件：

点击开始，完成导入：

已经成功导入，包含如下的表：

具体表的细节和设计，将在后面进行讲解

## 5.Nacos Server 的启动

- 上面工作都完成后，现在我们来启动一个单机版的 Nacos 服务器
- 进入到`$`{Nacos}/bin 目录里面：

双击 startup.cmd 文件，完成 nacos 的启动。

直到日志出现：

代表我们已经成功的启动了一个 Nacos 单机版的实例。

在浏览器里面输入：http://localhost:8848/nacos ，即可访问启动 Nacos 实例

Nacos 默认用户名和密码都是 nacos

输入正确的用户名和密码提交后，出现 Nacos 的控制台界面

至此，Nacos Server 已经安装成功
