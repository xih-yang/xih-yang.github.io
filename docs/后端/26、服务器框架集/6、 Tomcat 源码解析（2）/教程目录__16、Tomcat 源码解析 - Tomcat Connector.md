# 16、Tomcat 源码解析 - Tomcat Connector
- 来源：https://ddkk.com/zhuanlan/server/tomcat/2/16.html
- 分类：服务器框架
- 分组：教程目录
这篇分析Connector组件，之前第八篇分析StandardService中涉及到Connector，

分析Service的时候，知道StartInternal里面会调用connectors的每个connector的start方法，一个service可以有多个connector，可以从catalina类的digester里面可以看到addConnector的地方，下面是代码片段：

```java
protected Digester createStartDigester() {
      digester.addRule("Server/Service/Connector",
                         new ConnectorCreateRule());
        digester.addRule("Server/Service/Connector", new SetAllPropertiesRule(
                new String[]{"executor", "sslImplementationName", "protocol"}));
        digester.addSetNext("Server/Service/Connector",
                            "addConnector",
                            "org.apache.catalina.connector.Connector");
}
```

前面分析Service的Digester的时候，知道ConnectorCreateRule规则，解析到Connector标签的时候，读取Connector的executor标签属性，从service中获得Executor，读取Connector的protocol标签属性，protocol作为构造方法参数创建Connector，给connector的protocol设置executor，**这里也是可以调优的地方。**

前面分析rule的时候知道，SetNextRule会调用digester的service. addConnector,下面是StandardService.addConnector代码片段

```java
public void addConnector(Connector connector) {
        synchronized (connectorsLock) {
            connector.setService(this);
            Connector results[] = new Connector[connectors.length + 1];
            System.arraycopy(connectors, 0, results, 0, connectors.length);
            results[connectors.length] = connector;
            connectors = results;
            if (getState().isAvailable()) {
                try {
                    connector.start();
                } catch (LifecycleException e) {
                    log.error(sm.getString(
                            "standardService.connector.startFailed",
                            connector), e);
                }
            }
            // Report this property change to interested listeners
            support.firePropertyChange("connector", null, connector);
        }
}
```

下面分析创建Connector对象链的，跟之前一样，看Catalian的createStartDigester里面关于Connector的rule配置片段

```java
protected Digester createStartDigester() {
    ……………………..
//解析到Connector标签的时候，读取Connector的executor标签属性，从service
中获得Executor，读取Connector的protocol标签属性，protocol作为构造方法参数创建Connector，给connector的protocol设置executor，这里也是可以调优的地方
    digester.addRule("Server/Service/Connector",
                         new ConnectorCreateRule());
//设置Connector标签的属性给Connector对象，除了executor、sslImplementationName和protocol
        digester.addRule("Server/Service/Connector", new SetAllPropertiesRule(
                new String[]{"executor", "sslImplementationName", "protocol"}));
//调用service的addConnector传入上面rule创建的Connector
        digester.addSetNext("Server/Service/Connector",
                            "addConnector",
                            "org.apache.catalina.connector.Connector");
//解析到xx/xx/ Connector/SSLHostConfig标签的时候，创建对象SSLHostConfig，push进digester
        digester.addObjectCreate("Server/Service/Connector/SSLHostConfig",
                                "org.apache.tomcat.util.net.SSLHostConfig");
//解析到xx/xx/ Connector/SSLHostConfig标签的时候，设置标签的属性给ObjectCreateRule创建的SSLHostConfig
        digester.addSetProperties("Server/Service/Connector/SSLHostConfig");
//同上解析到SSLHostConfig的时候，调用Connector的方法addSslHostConfig，传入SSLHostConfig
        digester.addSetNext("Server/Service/Connector/SSLHostConfig",
                "addSslHostConfig",
                "org.apache.tomcat.util.net.SSLHostConfig");
//解析到xx/xx/ Connector/SSLHostConfig/ Certificate标签的时候，执行CertificateCreateRule，CertificateCreateRule规则是读取Certificate标签的type属性，new SSLHostConfigCertificate(sslHostConfig, type)，push进digester
        digester.addRule("Server/Service/Connector/SSLHostConfig/Certificate",
                         new CertificateCreateRule());
//同上，设置Certificate标签属性给对象SSLHostConfigCertificate，除了type属性
        digester.addRule("Server/Service/Connector/SSLHostConfig/Certificate",
                         new SetAllPropertiesRule(new String[]{"type"}));
//同上，解析到Certificate标签的，调用SSLHostConfig的addCertificate方法，传入SSLHostConfigCertificate
digester.addSetNext("Server/Service/Connector/SSLHostConfig/Certificate",
                            "addCertificate",
                            "org.apache.tomcat.util.net.SSLHostConfigCertificate");
//解析到xx/xx/ Connector/Listener的时候，创建Listener，className属性必须指定
        digester.addObjectCreate("Server/Service/Connector/Listener",
                                 null, // MUST be specified in the element
                                 "className");
//同上，解析Listener标签的时候，设置Listener标签属性给创建的Listener对象
        digester.addSetProperties("Server/Service/Connector/Listener");
//同上，解析Listener标签的时候，调用Connector的addLifecycleListener方法，传入ObjectCreateRule 创建的对象
        digester.addSetNext("Server/Service/Connector/Listener",
                            "addLifecycleListener",
                            "org.apache.catalina.LifecycleListener");
//解析到xx/xx/ Connector/UpgradeProtocol，创建className指定的对象，className必须指定
        digester.addObjectCreate("Server/Service/Connector/UpgradeProtocol",
                                  null, // MUST be specified in the element
                                  "className");
//同上，解析到UpgradeProtocol标签的时候，设置UpgradeProtocol标签属性给上面rule创建的对象
        digester.addSetProperties("Server/Service/Connector/ UpgradeProtocol ");
//同上，解析到UpgradeProtocol标签的时候，调用Connector的addUpgradeProtocol，传入上面rule创建的对象
        digester.addSetNext("Server/Service/Connector/UpgradeProtocol",
                            "addUpgradeProtocol",
                            "org.apache.coyote.UpgradeProtocol");
………………………
}
```

现在看下Connector类，public class Connector extends LifecycleMBeanBase这是Connector类的签名，可以看出他也是LifeCycle继承链下的组件，这个主要是看Internal系列的方法，先看下类的构造方法

```java
public Connector() {
       //默认是org.apache.coyote.http11.Http11NioProtocol
 this("org.apache.coyote.http11.Http11NioProtocol");
    }
public Connector(String protocol) {
        boolean aprConnector = AprLifecycleListener.isAprAvailable() &&
                AprLifecycleListener.getUseAprConnector();
// ConnectorCreateRule解析，调用构造方法，传入Connector的protocol标签属性值
     if ("HTTP/1.1".equals(protocol) || protocol == null) {
            if (aprConnector) {
                protocolHandlerClassName = "org.apache.coyote.http11.Http11AprProtocol";
            } else {
                protocolHandlerClassName = "org.apache.coyote.http11.Http11NioProtocol";
            }
        } else if ("AJP/1.3".equals(protocol)) {
            if (aprConnector) {
                protocolHandlerClassName = "org.apache.coyote.ajp.AjpAprProtocol";
            } else {
                protocolHandlerClassName = "org.apache.coyote.ajp.AjpNioProtocol";
            }
        } else {
            protocolHandlerClassName = protocol;
        }
        ProtocolHandler p = null;
        try {
//反射实例化ProtocolHandler之前指定的protocolHandlerClassName，ProtocolHandler实例
            Class<?> clazz = Class.forName(protocolHandlerClassName);
            p = (ProtocolHandler) clazz.newInstance();
        } catch (Exception e) {
            log.error(sm.getString(
                    "coyoteConnector.protocolHandlerInstantiationFailed"), e);
        } finally {
            this.protocolHandler = p;
        }
…………………….
}
```

現在看下Internal方法，initInternal、startInternal、stopInternal和destroyInternal方法

initInternal 方法

```java
protected void initInternal() throws LifecycleException {
        super.initInternal();
        if (protocolHandler == null) {
            throw new LifecycleException(
                    sm.getString("coyoteConnector.protocolHandlerInstantiationFailed"));
        }
        // 实例化CoyoteAdapter对象，当前Connector作为参数，CoyoteAdapter这个类很重要，后面单独篇分析
        adapter = new CoyoteAdapter(this);
//设置Adapter给protocolHandler
        protocolHandler.setAdapter(adapter);
        if (null == parseBodyMethodsSet) {
            setParseBodyMethods(getParseBodyMethods());
        }
//如果protocolHandler要求Apr但是Apr不可用话报错
        if(protocolHandler.isAprRequired() && !AprLifecycleListener.isAprAvailable()) {
            throw new LifecycleException(sm.getString("coyoteConnector.protocolHandlerNoApr",
                    getProtocolHandlerClassName()));
        }
//如果Apr可以用并且getUseOpenSSL为true并且protocolHandler是AbstractHttp11JsseProtocol，设置handler的SslImplementationName，参数是OpenSSLImplementation类名
        if (AprLifecycleListener.isAprAvailable() && AprLifecycleListener.getUseOpenSSL() &&
                protocolHandler instanceof AbstractHttp11JsseProtocol) {
            AbstractHttp11JsseProtocol<?> jsseProtocolHandler =
                    (AbstractHttp11JsseProtocol<?>) protocolHandler;
            if (jsseProtocolHandler.isSSLEnabled() &&
                    jsseProtocolHandler.getSslImplementationName() == null) {
                // OpenSSL is compatible with the JSSE configuration, so use it if APR is available
                jsseProtocolHandler.setSslImplementationName(OpenSSLImplementation.class.getName());
            }
        }
        try {
//调用handler的init
            protocolHandler.init();
        } catch (Exception e) {
            throw new LifecycleException(
                    sm.getString("coyoteConnector.protocolHandlerInitializationFailed"), e);
        }
}
```

其中startInternal、stopInternal和destroyInternal 方法就是protocolHandler对象对应的start、stop和destroy方法的调用

上面CoyoteAdapter类和handler与Connector的对象关系如下图
