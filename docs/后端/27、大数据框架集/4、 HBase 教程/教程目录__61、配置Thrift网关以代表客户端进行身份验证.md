# 61、配置Thrift网关以代表客户端进行身份验证
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/61.html
- 分类：大数据框架
- 分组：教程目录
## 配置Thrift网关以代表客户端进行身份验证

Thrift Gateway是用于安全操作的客户端配置，它描述了如何使用固定用户向HBase验证Thrift客户端。作为替代，您可以将Thrift网关配置为代表客户端向HBase进行身份验证，并使用代理用户访问HBase。这为Thrift 1在HBASE-11349中实现，并且为Thrift 2在HBASE-11474中实现。

### Thrift框架传输的局限性

如果使用框架传输，那么您目前还不能利用此功能，因为SASL目前不支持Thrift框架传输。

要启用它，请执行以下操作：

**1、** 请确保Thrift以安全模式运行，方法是按照[用于安全操作的客户端配置：ThriftGateway][ThriftGateway]中描述的过程；

**2、** 确保HBase配置为允许代理用户，如REST网关模拟配置中所述；

**3、** 在运行Thrift网关的每个群集节点的hbase-site.xml中，将该hbase.thrift.security.qop属性设置为以下三个值之一：

```java
 *  privacy - 身份验证、完整性和保密性检查。
 *  integrity - 身份验证和完整性检查。
 *  authentication - 仅验证身份验证检查。
```

**4、** 重新启动Thrift网关进程以使更改生效如果一个节点正在运行Thrift，那么该jps命令的输出将列出一个ThriftServer进程要停止节点上的Thrift，请运行该bin/hbase-daemon.shstopthrift命令要在节点上启动Thrift，请运行该bin/hbase-daemon.shstartthrift命令；
