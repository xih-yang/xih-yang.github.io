# 56、为Web UI使用安全HTTP（HTTPS）
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/56.html
- 分类：大数据框架
- 分组：教程目录
## 为Web UI使用安全HTTP（HTTPS）

默认的HBase 安装为主服务器和区域服务器的 Web UI 使用不安全的 HTTP 连接。要启用安全的 HTTP（HTTPS）连接，请在 hbase-site.xml 中设置 hbase.ssl.enabled 为 true。这不会更改 Web UI 使用的端口。要更改给定 HBase 组件的 Web UI 的端口，请在 hbase-site.xml 中配置该端口的设置。这些设置包括：

- hbase.master.info.port
- hbase.regionserver.info.port

如果启用 HTTPS，则客户端应该避免使用非安全的 HTTP 连接。

如果您启用了安全的 HTTP，则客户端应该使用 https:// URL 连接到 HBase。使用 http:// URL 的客户端将收到 200个 HTTP 响应，但不会接收任何数据。日志记录如下异常:

```java
javax.net.ssl.SSLException: Unrecognized SSL message, plaintext connection?
```

这是因为同一个端口用于 HTTP 和 HTTPS。

HBase 使用 Jetty 作为 Web UI。如果不修改 [Jetty](https://baike.baidu.com/item/jetty/370234?fr=aladdin) 本身，就不可能将 Jetty 配置为将一个端口重定向到同一主机上的另一个端口。如果您知道如何解决这个问题，而无需打开另一个 HTTPS 端口，则可以使用补丁程序。
