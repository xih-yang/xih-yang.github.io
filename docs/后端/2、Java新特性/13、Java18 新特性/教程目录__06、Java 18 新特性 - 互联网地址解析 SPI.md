# 06、Java 18 新特性 - 互联网地址解析 SPI
- 来源：https://ddkk.com/zhuanlan/java/java18/6.html
- 分类：Java 18 新特性
- 分组：教程目录
对于互联网地址解析 SPI，为主机地址和域名地址解析定义一个 SPI，以便 `java.net.InetAddress` 可以使用平台内置解析器以外的解析器。

```java
InetAddress inetAddress = InetAddress.getByName("www.wdbyte.com");
System.out.println(inetAddress.getHostAddress());
// 输出
// 106.14.229.49
```

默认情况下，InetAddress 使用操作系统的解析器，即它通常查询主机文件和配置的 DNS 服务器。

这种硬接线有一些缺点：

在测试中，不可能将主机名映射到模拟服务器的 URL。
新的主机名查找协议（例如 DNS over QUIC、TLS 或 HTTPS）无法在 Java 中轻松实现。
当前实现导致阻塞操作系统调用。仅此一项就没有吸引力，因为这个调用有时可能需要更长的时间并且无法中断。使用 Project Loom，这甚至会导致操作系统线程在此期间不为其他虚拟线程提供服务。
JEP 418 引入了服务提供者接口 (SPI)，以允许平台的内置默认解析器被其他解析器替换。
