# 02、SQL Server 基础 - 在与SQL Server建立连接时出现与网络相关的或特定于实例的错误
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/1/2.html
- 分类：缓存数据库
- 分组：教程目录
在SSMS中无法正常登录，提示这样的错误：

还是打开SQL Server配置管理器，查看一下网络配置中的TCP/IP，保证有IP为127.0.0.1(或者自己电脑的ip地址)端口为1433并启用了，保证在IPALL里的TCP端口也是1433：

在SQL Server服务里看一下如果该启动的服务没有启动，按照上一节刚配置完的样子启动一下。(如果刚刚那步做了更改，那么这里的SQL Server(MSSQLSERVER)服务要重新启动一下)

启动好以后是这样的：

这时候再重新打开SSMS，就可以正常登录了：

另外，也可以不使用SQL Server配置管理器，而是在控制面板里直接启动这些服务：
