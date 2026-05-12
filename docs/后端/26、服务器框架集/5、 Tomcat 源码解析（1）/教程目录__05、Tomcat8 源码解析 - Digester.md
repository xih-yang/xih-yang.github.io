# 05、Tomcat8 源码解析 - Digester
- 来源：https://ddkk.com/zhuanlan/server/tomcat/1/5.html
- 分类：服务器框架
- 分组：教程目录
Tomcat源码版本：apache-tomcat-8.5.54-src

JDK源码版本：jdk1.8.0_171

org.apache.tomcat.util.digester.Digester用于解析server.xml，通过它可以很方便的从xml文件生成java对象。

**1、** Java解析XML文件主要有两个方式；

1、预加载DOM树,代表是java官方的JDOM解析和社区的DOM4J解析，DOM4J更好用；

2、事件机制的SAX,代表就是SAXReader，该方法思路是一行一行的读取XML文件，没遇到一个节点，就看看有没有监听该事件的监听器，如果有就触发；

Digester底层采用SAX(Simple API for XML)解析XML文件，所以对象转换由"事件"驱动，在遍历每个节点时，检查是否有匹配模式，如果有，则执行规则定义的操作，比如创建特定的Java对象，或调用特定对象的方法等。此处的XML元素根据匹配模式(matching pattern)识别，而相关操作由规则(rule)定义。

**2、** tomcat使用digester解析server.xml代码流程；

Catalina.java::load()

```java
//用digester解析server.xml文件，把配置文件中的配置解析成java对象
//1.准备好用来解析server.xml文件需要用的digester。
Digester digester = createStartDigester();
//2.server.xml文件作为一个输入流传入
File file = configFile();
InputStream inputStream = new FileInputStream(file);
//3.使用inputStream构造一个sax的inputSource
InputSource inputSource = new InputSource(file.toURI().toURL().toString());
inputSource.setByteStream(inputStream);
//4.把当前类压入到digester的栈顶，用来作为digester解析出来的对象的一种引用
digester.push(this);
//5.调用digester的parse()方法进行解析。
digester.parse(inputSource);
```

**3、** 设置规则-createStartDigester()方法；

```java
protected Digester createStartDigester() {
        long t1=System.currentTimeMillis();
        // 实例化一个Digester对象
        Digester digester = new Digester();
        // 设置为false表示解析xml时不需要进行DTD的规则校验  
        digester.setValidating(false);
        // 是否进行节点设置规则校验,如果xml中相应节点没有设置解析规则会在控制台显示提示信息  
        digester.setRulesValidation(true);
        // 将xml节点中的className作为假属性，不必调用默认的setter方法（一般的节点属性在解析时将会以属性值作为入参调用该节点相应对象的setter方法，而className属性的作用是提示解析器用该属性的值来实例化对象）
        Map<Class<?>, List<String>> fakeAttributes = new HashMap<>();
        List<String> objectAttrs = new ArrayList<>();
        objectAttrs.add("className");
        fakeAttributes.put(Object.class, objectAttrs);
        // Ignore attribute added by Eclipse for its internal tracking
        List<String> contextAttrs = new ArrayList<>();
        contextAttrs.add("source");
        fakeAttributes.put(StandardContext.class, contextAttrs);
        digester.setFakeAttributes(fakeAttributes);
        digester.setUseContextClassLoader(true);
        // addObjectCreate方法的意思是碰到xml文件中的Server节点则创建一个StandardServer对象 
        digester.addObjectCreate("Server","org.apache.catalina.core.StandardServer","className");
        // 根据Server节点中的属性信息调用相应属性的setter方法，还会调用setPort、setShutdown方法，入参分别是8005、SHUTDOWN  
        digester.addSetProperties("Server");
        // 将Server节点对应的对象作为入参调用栈顶对象的setServer方法，这里的栈顶对象即下面的digester.push方法所设置的当前类的对象this，就是说调用MyDigester类的setMyServer方法
        digester.addSetNext("Server","setServer","org.apache.catalina.Server");
        // 碰到xml的Server节点下的Listener节点时取className属性的值作为实例化类实例化一个对象 
        //GlobalNamingResources 全局J2EE企业命名上下文
        digester.addObjectCreate("Server/GlobalNamingResources","org.apache.catalina.deploy.NamingResourcesImpl");
        digester.addSetProperties("Server/GlobalNamingResources");
        digester.addSetNext("Server/GlobalNamingResources","setGlobalNamingResources","org.apache.catalina.deploy.NamingResourcesImpl");
        //Server/Listener 按照className配置来创建  生命周期监听器
        //第二个参数 MUST be specified in the element
        digester.addObjectCreate("Server/Listener",null,"className");
        digester.addSetProperties("Server/Listener");
        digester.addSetNext("Server/Listener","addLifecycleListener","org.apache.catalina.LifecycleListener");
        //StandardService
        digester.addObjectCreate("Server/Service","org.apache.catalina.core.StandardService","className");
        digester.addSetProperties("Server/Service");
        digester.addSetNext("Server/Service","addService","org.apache.catalina.Service");
        //Service/Listener 按照className配置来创建
        digester.addObjectCreate("Server/Service/Listener",null, "className");
        digester.addSetProperties("Server/Service/Listener");
        digester.addSetNext("Server/Service/Listener","addLifecycleListener","org.apache.catalina.LifecycleListener");
        //StandardThreadExecutor
        digester.addObjectCreate("Server/Service/Executor","org.apache.catalina.core.StandardThreadExecutor","className");
        digester.addSetProperties("Server/Service/Executor");
        digester.addSetNext("Server/Service/Executor","addExecutor","org.apache.catalina.Executor");
        //Connector
        digester.addRule("Server/Service/Connector",new ConnectorCreateRule());
        digester.addRule("Server/Service/Connector",new SetAllPropertiesRule(new String[]{"executor", "sslImplementationName"}));
        digester.addSetNext("Server/Service/Connector","addConnector","org.apache.catalina.connector.Connector");
        //SSLHostConfig
        digester.addObjectCreate("Server/Service/Connector/SSLHostConfig","org.apache.tomcat.util.net.SSLHostConfig");
        digester.addSetProperties("Server/Service/Connector/SSLHostConfig");
        digester.addSetNext("Server/Service/Connector/SSLHostConfig","addSslHostConfig","org.apache.tomcat.util.net.SSLHostConfig");
        //Certificate
        digester.addRule("Server/Service/Connector/SSLHostConfig/Certificate",new CertificateCreateRule());
        digester.addRule("Server/Service/Connector/SSLHostConfig/Certificate",new SetAllPropertiesRule(new String[]{"type"}));
        digester.addSetNext("Server/Service/Connector/SSLHostConfig/Certificate","addCertificate","org.apache.tomcat.util.net.SSLHostConfigCertificate");
        //OpenSSLConf
        digester.addObjectCreate("Server/Service/Connector/SSLHostConfig/OpenSSLConf","org.apache.tomcat.util.net.openssl.OpenSSLConf");
        digester.addSetProperties("Server/Service/Connector/SSLHostConfig/OpenSSLConf");
        digester.addSetNext("Server/Service/Connector/SSLHostConfig/OpenSSLConf","setOpenSslConf","org.apache.tomcat.util.net.openssl.OpenSSLConf");
        //OpenSSLConfCmd
        digester.addObjectCreate("Server/Service/Connector/SSLHostConfig/OpenSSLConf/OpenSSLConfCmd","org.apache.tomcat.util.net.openssl.OpenSSLConfCmd");
        digester.addSetProperties("Server/Service/Connector/SSLHostConfig/OpenSSLConf/OpenSSLConfCmd");
        digester.addSetNext("Server/Service/Connector/SSLHostConfig/OpenSSLConf/OpenSSLConfCmd","addCmd","org.apache.tomcat.util.net.openssl.OpenSSLConfCmd");
        //Server/Service/Connector/Listener
        digester.addObjectCreate("Server/Service/Connector/Listener",null,"className");
        digester.addSetProperties("Server/Service/Connector/Listener");
        digester.addSetNext("Server/Service/Connector/Listener","addLifecycleListener","org.apache.catalina.LifecycleListener");
        //UpgradeProtocol 升级协议
        digester.addObjectCreate("Server/Service/Connector/UpgradeProtocol",null,"className");
        digester.addSetProperties("Server/Service/Connector/UpgradeProtocol");
        digester.addSetNext("Server/Service/Connector/UpgradeProtocol","addUpgradeProtocol","org.apache.coyote.UpgradeProtocol");
        // Add RuleSets for nested elements
        digester.addRuleSet(new NamingRuleSet("Server/GlobalNamingResources/"));
        digester.addRuleSet(new EngineRuleSet("Server/Service/"));
        digester.addRuleSet(new HostRuleSet("Server/Service/Engine/"));
        digester.addRuleSet(new ContextRuleSet("Server/Service/Engine/Host/"));
        addClusterRuleSet(digester, "Server/Service/Engine/Host/Cluster/");
        digester.addRuleSet(new NamingRuleSet("Server/Service/Engine/Host/Context/"));
        // When the 'engine' is found, set the parentClassLoader.
        digester.addRule("Server/Service/Engine",new SetParentClassLoaderRule(parentClassLoader));
        addClusterRuleSet(digester, "Server/Service/Engine/Cluster/");
        long t2=System.currentTimeMillis();
        if (log.isDebugEnabled()) {
            log.debug("Digester for server.xml created " + ( t2-t1 ));
        }
        return digester;
    }
```

**4、** 解析动作-parse；

```java
org.apache.tomcat.util.Digester::parse(inputSource);
com.sun.org.apache.xerces.internal.jaxp.SAXParserImpl$JAXPSAXParser::parse
com.sun.org.apache.xerces.internal.parsers.AbstractSAXParser::parse
com.sun.org.apache.xerces.internal.parsers.XMLParser::parse
com.sun.org.apache.xerces.internal.parsers.XIncludeAwareParserConfiguration::parse
com.sun.org.apache.xerces.internal.parsers.XML11Configuration::parse
com.sun.org.apache.xerces.internal.impl.XMLVersionDetector::startDocumentParsing  //设置属性编码
org.apache.tomcat.util.Digester::startDocument
com.sun.org.apache.xerces.internal.impl.XMLDocumentFragmentScannerImpl::scanDocument //解析整个文档
com.sun.org.apache.xerces.internal.impl.XMLDocumentFragmentScannerImpl::next
com.sun.org.apache.xerces.internal.impl.XMLDocumentScannerImpl$ContentDriver::scanRootElementHook
com.sun.org.apache.xerces.internal.impl.XMLDocumentScannerImpl::scanStartElement
com.sun.org.apache.xerces.internal.impl.dtd.XMLDTDValidator::startElement
com.sun.org.apache.xerces.internal.parsersAbstractSAXParser::startElement
org.apache.tomcat.util.Digester::startElement
```

开始调用startElement对元素开始解析,先拼接模式然后获取其对应的规则,遍历所有规则,调用其对应规则实例的begin方法,这要求所有规则实现抽象类Rule，规则的添加在上文解析过程中。
