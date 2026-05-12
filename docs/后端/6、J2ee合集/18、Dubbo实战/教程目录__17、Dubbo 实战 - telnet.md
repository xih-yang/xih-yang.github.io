# 17、Dubbo 实战 - telnet
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/4/17.html
- 分类：J2EE框架
- 分组：教程目录
telnet的介绍可以参看《java网络编程3》中有一段介绍telnet，我们可以理解为，telnet命令是通过socket协议与服务器端通信。Dubbo提供了telnet命令去查看服务功能。

这里主要介绍一下dubbo实现telnet命令的整体实现：

```java
} else if (message instanceof String) {
    if (isClientSide(channel)) {
        Exception e = new Exception("Dubbo client can not supported string message: " + message + " in channel: " + channel + ", url: " + channel.getUrl());
        logger.error(e.getMessage(), e);
    } else {
        String echo = handler.telnet(channel, (String) message);
        if (echo != null && echo.length() > 0) {
            channel.send(echo);
        }
    }
}
```

当服务器端接收到的消息类型是string的时候回调用到TelnetHandler的telent方法中。

TelnetHanlderAdpter类会从接收的字符串解析出命令，根据dubbo的spi扩展机制获取对应的TelnetHandler实现。

这里我们查看DubboProtocol类中 private ExchangeHandler requestHandler = new ExchangeHandlerAdapter() 的实现，会发现：

```java
/**
 * ExchangeHandlerAdapter
 */
public abstract class ExchangeHandlerAdapter extends TelnetHandlerAdapter implements ExchangeHandler {
    public Object reply(ExchangeChannel channel, Object msg) throws RemotingException {
        return null;
    }
}
```

而TelnetHandlerAdapter类的内容为：

```java
public class TelnetHandlerAdapter extends ChannelHandlerAdapter implements TelnetHandler {
    private final ExtensionLoader<TelnetHandler> extensionLoader = ExtensionLoader.getExtensionLoader(TelnetHandler.class);
    public String telnet(Channel channel, String message) throws RemotingException {
        String prompt = channel.getUrl().getParameterAndDecoded(Constants.PROMPT_KEY, Constants.DEFAULT_PROMPT);
        boolean noprompt = message.contains("--no-prompt");
        message = message.replace("--no-prompt", "");
        StringBuilder buf = new StringBuilder();
        message = message.trim();
        String command;
        if (message.length() > 0) {
            int i = message.indexOf(' ');
            if (i > 0) {
                command = message.substring(0, i).trim();
                message = message.substring(i + 1).trim();
            } else {
                command = message;
                message = "";
            }
        } else {
            command = "";
        }
        if (command.length() > 0) {
            if (extensionLoader.hasExtension(command)) {
                try {
                    String result = extensionLoader.getExtension(command).telnet(channel, message);
                    if (result == null) {
                        return null;
                    }
                    buf.append(result);
                } catch (Throwable t) {
                    buf.append(t.getMessage());
                }
            } else {
                buf.append("Unsupported command: ");
                buf.append(command);
            }
        }
        if (buf.length() > 0) {
            buf.append("\r\n");
        }
        if (prompt != null && prompt.length() > 0 && !noprompt) {
            buf.append(prompt);
        }
        return buf.toString();
    }
}
```

这里我们可以发现 String result = extensionLoader.getExtension(command).telnet(channel, message); ， 这个我们可以理解为，你在telnet输入的每个命令，都由一个类对象来处理。

在com.alibaba.dubbo.remoting.telnet.TelnetHandler多个文件中有如下配置：

```java
clear=com.alibaba.dubbo.remoting.telnet.support.command.ClearTelnetHandler
exit=com.alibaba.dubbo.remoting.telnet.support.command.ExitTelnetHandler
help=com.alibaba.dubbo.remoting.telnet.support.command.HelpTelnetHandler
……
```

对于telnent功能的实现方式跟其他的功能类似，由于每个 TelnetHandler实现太细了，这里对有兴趣的读者自己翻看源码。
