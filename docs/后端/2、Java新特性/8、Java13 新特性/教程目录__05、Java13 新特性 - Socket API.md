# 05、Java13 新特性 - Socket API
- 来源：https://ddkk.com/zhuanlan/java/java13/5.html
- 分类：Java 13 新特性
- 分组：教程目录
Java 13 重新实现了 Java Socket API。旧的 Socket API，如java.net.Socket和java.net.ServerSocket已被替换。

- PlainSocketImpl 不再使用，现在 Socket API 提供程序指向 NioSocketImpl。
- 新的实现利用 java.nio 基础设施来实现更好的并发性和 I/O 控制。
- 新实现向后兼容使用旧实现的代码。
- 新实现现在是 Java 12 的默认实现。
- 可以通过多种方式选择旧实现：
- 将系统属性 jdk.net.usePlainSockteImpl 设置为 true。
- 使用 -Djdk.net.usePlainSocketImpl 选项运行 java。
- 更新 ${java.home}/conf/net.properties 中可用的 JDK 网络配置文件。
- 旧实现和选择旧实现的系统属性将从未来版本中删除。
