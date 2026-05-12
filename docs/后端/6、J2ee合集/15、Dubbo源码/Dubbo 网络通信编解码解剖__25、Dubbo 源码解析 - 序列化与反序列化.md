# 25、Dubbo 源码解析 - 序列化与反序列化
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/1/25.html
- 分类：J2EE框架
- 分组：Dubbo 网络通信编解码解剖
> 序列化：把对象转换为字节序列的过程称为对象的序列化。
>
> 反序列化：把字节序列恢复为对象的过程称为对象的反序列化。

Dubbo是 Alibaba 开源的分布式服务框架远程调用框架，现在已捐赠给 [apache](http://dubbo.apache.org/) 软件基本会。因此 dubbo 调用是需要跨 JVM，需要进行网络通信。这就需要使用到序列化与反序列化。在 dubbo 中定义了 ObjectInput、ObjectOutput 与 Serialization 来进行数据的序列化与反序列化。

#### 1、Serialization 定义

下面我们来看一下 Serialization 的接口定义：

```java
@SPI("hessian2")
public interface Serialization {
    byte getContentTypeId();
    String getContentType();
    @Adaptive
    ObjectOutput serialize(URL url, OutputStream output) throws IOException;
    @Adaptive
    ObjectInput deserialize(URL url, InputStream input) throws IOException;
}
```

这个接口里面定义了 4 个方法：

- getContentTypeId：获取序列化 ContextType 的 id。
- getContentType：获取到序列化的 ContentType。
- serialize：创建一个 ObjectOutput (序列化器)，用于把对象转换序列化字节序列.
- deserialize：创建一个 ObjectInput (反序列化器)，用于把字节序列恢复成对象.

#### 2、支持多种序列化

下面是Serialization 的类图：

dubbo 支持多种序列化方式并且序列化是和协议相对应的。比如：dubbo协议的 dubbo， hessian2，java，compactedjava，rmi协议缺省为java，以及http协议的json等。

- dubbo序列化：阿里尚未开发成熟的高效java序列化实现，阿里不建议在生产环境使用它
- hessian2序列化：hessian是一种跨语言的高效二进制序列化方式。但这里实际不是原生的hessian2序列化，而是阿里修改过的hessian lite，它是dubbo RPC默认启用的序列化方式
- json序列化：目前有两种实现，一种是采用的阿里的fastjson库，另一种是采用dubbo中自己实现的简单json库，但其实现都不是特别成熟，而且json这种文本序列化性能一般不如上面两种二进制序列化。
- java序列化：主要是采用JDK自带的Java序列化实现，性能很不理想。

这四种主要序列化方式的性能从上到下依次递减。对于dubbo RPC这种追求高性能的远程调用方式来说，实际上只有1、2两种高效序列化方式比较般配，而第1个 dubbo 序列化由于还不成熟，所以实际只剩下2可用，所以dubbo RPC默认采用 hessian2 序列化。

但hessian 是一个比较老的序列化实现了，而且它是跨语言的，所以不是单独针对java进行优化的。而dubbo RPC实际上完全是一种Java to Java的远程调用，其实没有必要采用跨语言的序列化方式（当然肯定也不排斥跨语言的序列化）。

最近几年，各种新的高效序列化方式层出不穷，不断刷新序列化性能的上限，最典型的包括：

- 专门针对Java语言的：Kryo，FST等等
- 跨语言的：Protostuff，ProtoBuf，Thrift，Avro，MsgPack等等

这些序列化方式的性能多数都显著优于 hessian2 （甚至包括尚未成熟的dubbo序列化）。所以我们可以

为dubbo 引入 Kryo 和 FST 这两种高效 Java 来优化 dubbo 的序列化。

使用Kryo和FST非常简单，只需要在dubbo RPC的XML配置中添加一个属性即可：

```java
<dubbo:protocol name="dubbo" serialization="kryo"/>
```

或者

```java
<dubbo:protocol name="dubbo" serialization="fst"/>
```

#### 3、序列化扩展

可以通过扩展 Serialization、ObjectInput、ObjectOutput 来进行 dubbo 序列化的扩展。

**扩展示例**

> Maven 项目结构：

```java
src
 |-main
    |-java
        |-com
            |-xxx
                |-XxxSerialization.java (实现Serialization接口)
                |-XxxObjectInput.java (实现ObjectInput接口)
                |-XxxObjectOutput.java (实现ObjectOutput接口)
    |-resources
        |-META-INF
            |-dubbo
                |-com.alibaba.dubbo.common.serialize.Serialization (纯文本文件，内容为：xxx=com.xxx.XxxSerialization)
```

> XxxSerialization.java：

```java
package com.xxx;
import com.alibaba.dubbo.common.serialize.Serialization;
import com.alibaba.dubbo.common.serialize.ObjectInput;
import com.alibaba.dubbo.common.serialize.ObjectOutput;
public class XxxSerialization implements Serialization {
    public ObjectOutput serialize(Parameters parameters, OutputStream output) throws IOException {
        return new XxxObjectOutput(output);
    }
    public ObjectInput deserialize(Parameters parameters, InputStream input) throws IOException {
        return new XxxObjectInput(input);
    }
}
```

> META-INF/dubbo/com.alibaba.dubbo.common.serialize.Serialization：

```java
xxx=com.xxx.XxxSerialization
```

并且通过以下配置来使用新的扩展。

```java
<!-- 协议的序列化方式 -->
<dubbo:protocol serialization="xxx" />
<!-- 缺省值设置，当<dubbo:protocol>没有配置serialization时，使用此配置 -->
<dubbo:provider serialization="xxx" />
```

参考资料：

- https://blog.csdn.net/moonpure/article/details/53175519
- http://dubbo.apache.org/books/dubbo-dev-book/impls/serialize.html
