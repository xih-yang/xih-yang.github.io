# 03、Dubbo 源码解析 - 动态编译
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/1/3.html
- 分类：J2EE框架
- 分组：Dubbo 内核解剖
我们运行的Java代码，一般都是编译之后的字节码。Dubbo为了实现基于SPI思想的扩展特性，可以灵活的添加额外的功能。对于SPI接口需要能够动态生成，这样就需要在运行的时候去编译加载这个设配类的代码。下面我们就是来了解下Dubbo的动态编译。

我们首先来看一下Compile的类图。

Compile接口定义：

```java
@SPI("javassist")
public interface Compiler {
	/**
	 * Compile java source code.
	 * 
	 * @param code Java source code
	 * @param classLoader TODO
	 * @return Compiled class
	 */
	Class<?> compile(String code, ClassLoader classLoader);
}
```

- @SPI(“javassist”)：表示如果没有配置，dubbo默认选用javassist编译源代码
- 接口方法compile第一个入参code，就是java的源代码
- 接口方法compile第二个入参classLoader，按理是类加载器用来加载编译后的字节码，其实没用到，都是根据当前线程或者调用方的classLoader加载的

在上面一个章节 – [2.dubbo内核SPI实现](/zhuanlan/j2ee/dubbo/1/2.html)。我们说过对于dubbo SPI通过@SPI注解与@Adaptive实现,它有两种实现方式。

- @Adaptive注解在标注@SPI接口的方法上，扩展类就是通过Compile字节码技术动态编译。

编译后的代码模板如下所示。

```java
package <扩展点接口所在包>;
public class <扩展点接口名>$Adpative implements <扩展点接口> {
    public <有@Adaptive注解的接口方法>(<方法参数>) {
        if(是否有URL类型方法参数?) 使用该URL参数
        else if(是否有方法类型上有URL属性) 使用该URL属性
        <else 在加载扩展点生成自适应扩展点类时抛异常，即加载扩展点失败！>
        if(获取的URL == null) {
            throw new IllegalArgumentException("url == null");
        }
              根据@Adaptive注解上声明的Key的顺序，从URL获致Value，作为实际扩展点名。
               如URL没有Value，则使用缺省扩展点实现。如没有扩展点， throw new IllegalStateException("Fail to get extension");
               在扩展点实现调用该方法，并返回结果。
    }
    public <有@Adaptive注解的接口方法>(<方法参数>) {
        throw new UnsupportedOperationException("is not adaptive method!");
    }
}
```

例如com.alibaba.dubbo.rpc.Protocol接口的动态编译的扩展类Protocol$Adpative为：

```java
package com.alibaba.dubbo.rpc;
import com.alibaba.dubbo.common.extension.ExtensionLoader;
public class Protocol$Adpative implements Protocol {
    public void destroy() {
        throw new UnsupportedOperationException("method public abstract void com.alibaba.dubbo.rpc.Protocol.destroy() of interface com.alibaba.dubbo.rpc.Protocol is not adaptive method!");
    }
    public int getDefaultPort() {
        throw new UnsupportedOperationException("method public abstract int com.alibaba.dubbo.rpc.Protocol.getDefaultPort() of interface com.alibaba.dubbo.rpc.Protocol is not adaptive method!");
    }
    public com.alibaba.dubbo.rpc.Exporter export(Invoker invoker) throws RpcException {
        if (invoker == null) throw new IllegalArgumentException("com.alibaba.dubbo.rpc.Invoker argument == null");
        if (invoker.getUrl() == null)
            throw new IllegalArgumentException("com.alibaba.dubbo.rpc.Invoker argument getUrl() == null");
        com.alibaba.dubbo.common.URL url = invoker.getUrl();
        String extName = (url.getProtocol() == null ? "dubbo" : url.getProtocol());
        if (extName == null)
            throw new IllegalStateException("Fail to get extension(com.alibaba.dubbo.rpc.Protocol) name from url(" + url.toString() + ") use keys([protocol])");
        Protocol extension = ExtensionLoader.getExtensionLoader(Protocol.class).getExtension(extName);
        return extension.export(invoker);
    }
    public com.alibaba.dubbo.rpc.Invoker refer(java.lang.Class arg0, com.alibaba.dubbo.common.URL arg1) throws RpcException {
        if (arg1 == null) throw new IllegalArgumentException("url == null");
        com.alibaba.dubbo.common.URL url = arg1;
        String extName = (url.getProtocol() == null ? "dubbo" : url.getProtocol());
        if (extName == null)
            throw new IllegalStateException("Fail to get extension(com.alibaba.dubbo.rpc.Protocol) name from url(" + url.toString() + ") use keys([protocol])");
        com.alibaba.dubbo.rpc.Protocol extension = (com.alibaba.dubbo.rpc.Protocol) ExtensionLoader.getExtensionLoader(com.alibaba.dubbo.rpc.Protocol.class).getExtension(extName);
        return extension.refer(arg0, arg1);
    }
}
```

- @Adaptive注解在标注@SPI接口的实现类上，扩展类就是这个类。

例如这里的Compile的SPI扩展就是AdaptiveCompiler这个类。

```java
@Adaptive
public class AdaptiveCompiler implements Compiler {
    private static volatile String DEFAULT_COMPILER;
    public static void setDefaultCompiler(String compiler) {
        DEFAULT_COMPILER = compiler;
    }
    public Class<?> compile(String code, ClassLoader classLoader) {
        Compiler compiler;
        ExtensionLoader<Compiler> loader = ExtensionLoader.getExtensionLoader(Compiler.class);
        String name = DEFAULT_COMPILER; // copy reference
        if (name != null && name.length() > 0) {
            compiler = loader.getExtension(name);
        } else {
            compiler = loader.getDefaultExtension();
        }
        return compiler.compile(code, classLoader);
    }
}
```

AdaptiveCompiler是Compiler的设配类，它的作用是Compiler策略的选择，根据条件选择使用何种编译策略来编译动态生成SPI扩展 ，默认为javassist.

AbstractCompiler是一个抽象类，它通过正则表达式获取到对象的包名以及Class名称。这样就可以获取对象的全类名(包名+Class名称)。通过反射`Class.forName()`来判断当前ClassLoader是否有这个类，如果有就返回，如果没有就通过JdkCompiler或者JavassistCompiler通过传入的code编译这个类。

[Java字节码框架 – Javassist](http://blog.csdn.net/u012410733/article/details/77787194) – javassist的编译简单代码示例。

[dubbo-adpative](https://github.com/carl-zhao/dubbo-adpative) – dubbo spi adpative动态编译代码github地址
