# 05、Tomcat 源码解析 - Catalina类
- 来源：https://ddkk.com/zhuanlan/server/tomcat/2/5.html
- 分类：服务器框架
- 分组：教程目录
上一篇我们已经分析了Digester类，有基础分析Catalina类的代码，所以这篇主要是看下Catalina类，之前我们分析Bootstrap类的时候，知道Bootstrap的类主要是通过CatalinaClassLoader加载Catalina类调用Catalina的load(arguments), start(),stop(),stopServer()，现在我们逐个方法来看。

**1、** load(arguments)方法：看源码load(arguments)最后调用的是load方法；

1.1． load方法：

看load方法之前先对比看server.xml和createStartDigester方法

createStartDigester方法server片段，

```java
long t1=System.currentTimeMillis();
        // Initialize the digester
        Digester digester = new Digester();
        digester.setValidating(false);
        digester.setRulesValidation(true);
        HashMap<Class<?>, List<String>> fakeAttributes = new HashMap<>();
        ArrayList<String> attrs = new ArrayList<>();
        attrs.add("className");
        fakeAttributes.put(Object.class, attrs);
        digester.setFakeAttributes(fakeAttributes);
        digester.setUseContextClassLoader(true);
        // Configure the actions we will be using
        digester.addObjectCreate("Server",
                                 "org.apache.catalina.core.StandardServer",
                                 "className");
        digester.addSetProperties("Server");
        digester.addSetNext("Server",
                            "setServer",
                            "org.apache.catalina.Server");
```

可以看到我们之前分析的Rule，ObjectCreateRule，SetPropertiesRule，SetNextRule，当解析到的时候，会创建StandardServer，Push进Digester【ObjectCreateRule的作用】，设置的attribute到对应的StandardServer的setXXXX例如SetPort【SetPropertiesRule的作用】，会调用Catalina的方法setServer(StandardServer)【SetNextRule的作用】。这个时候Digester的内存结构是如下图

下面看load方法代码片段，最后还是调用server.init。

```java
 。。。。
 //根据System参数java.io.tmpdir判断临时文件夹
         initDirs();
 //
         initNaming();
         //创建startDigester，这个我们后面重点分析
         Digester digester = createStartDigester();
         InputSource inputSource = null;
         InputStream inputStream = null;
         File file = null;
         try {
             try {
 //默认是config/server.xml
                 file = configFile();
                 inputStream = new FileInputStream(file);
                 inputSource = new InputSource(file.toURI().toURL().toString());
             } catch (Exception e) {
                 if (log.isDebugEnabled()) {
                     log.debug(sm.getString("catalina.configFail", file), e);
                 }
             }
             ……………
             try {
                 inputSource.setByteStream(inputStream);
 //将catalina，push进Digester
                 digester.push(this);
 //parse server.xml,解析过程中回调之前我们分析的rule
                 digester.parse(inputSource);
             } catch (SAXParseException spe) {
                 log.warn("Catalina.start using " + getConfigFile() + ": " +
                         spe.getMessage());
                 return;
             } catch (Exception e) {
                 log.warn("Catalina.start using " + getConfigFile() + ": " , e);
                 return;
             }
         } finally {
             if (inputStream != null) {
                 try {
                     inputStream.close();
                 } catch (IOException e) {
                     // Ignore
                 }
             }
         }
 //parse之后catalina已经调用setServer方法创建得到server
         getServer().setCatalina(this);
         getServer().setCatalinaHome(Bootstrap.getCatalinaHomeFile());
         getServer().setCatalinaBase(Bootstrap.getCatalinaBaseFile());
         // Stream redirection
         initStreams();
         // Start the new server
         try {
 //调用server.init方法
             getServer().init();
         } catch (LifecycleException e) {
             ……..
         }
```

**2、** start方法；

```java
………
        try {
//调用Server的start方法
            getServer().start();
        } catch (LifecycleException e) {
            ………
            return;
        }
        long t2 = System.nanoTime();
        if(log.isInfoEnabled()) {
            log.info("Server startup in " + ((t2 - t1) / 1000000) + " ms");
        }
        //注册shutdownhook，jvm退出的时候会回调这个runnable
        if (useShutdownHook) {
            if (shutdownHook == null) {
                shutdownHook = new CatalinaShutdownHook();
            }
            Runtime.getRuntime().addShutdownHook(shutdownHook);
            ……….
        }
        if (await) {
            await();
            stop();
        }
```

**3、** stopServer()方法；

```java
…….
        Server s = getServer();
        if (s == null) {
//cmd 调用shutdown.bat的时候，走这里，当为空将创建StandServer 
            Digester digester = createStopDigester();
            File file = configFile();
            try (FileInputStream fis = new FileInputStream(file)) {
                InputSource is =
                    new InputSource(file.toURI().toURL().toString());
                is.setByteStream(fis);
                digester.push(this);
                digester.parse(is);
            } catch (Exception e) {
                log.error("Catalina.stop: ", e);
                System.exit(1);
            }
        } else {
            //不为空直接调用server stop，作为一个service运行的时候
            try {
                s.stop();
            } catch (LifecycleException e) {
                log.error("Catalina.stop: ", e);
            }
            return;
        }
        s = getServer();
        if (s.getPort()>0) {
//给监听ServerSocket，发送SHUTDOWN信息，关闭Server
            try (Socket socket = new Socket(s.getAddress(), s.getPort());
                    OutputStream stream = socket.getOutputStream()) {
                String shutdown = s.getShutdown();
                for (int i = 0; i < shutdown.length(); i++) {
                    stream.write(shutdown.charAt(i));
                }
                stream.flush();
            } catch (ConnectException ce) {
                log.error(sm.getString("catalina.stopServer.connectException",
                                       s.getAddress(),
                                       String.valueOf(s.getPort())));
                log.error("Catalina.stop: ", ce);
                System.exit(1);
            } catch (IOException e) {
                log.error("Catalina.stop: ", e);
                System.exit(1);
            }
        } else {
            log.error(sm.getString("catalina.stopServer"));
            System.exit(1);
        }
```

**4、** Stop()方法；

```java
…………
        try {
            Server s = getServer();
            LifecycleState state = s.getState();
            if (LifecycleState.STOPPING_PREP.compareTo(state) <= 0
                    && LifecycleState.DESTROYED.compareTo(state) >= 0) {
                //stop已经被调用
            } else {
//调用server stop方法
                s.stop();
                s.destroy();
            }
        } catch (LifecycleException e) {
            log.error("Catalina.stop", e);
        }
```

总结：catalina类中，load方法调用的时候会将server.xml里面的配置信息通过Digester解析成对象，分析到目前为止可以知道的对象是Catalina->Server,start方法调用server.start同时注册shutdownHook，stopServer方法当双击ShutDown.bat来关闭tomcat的时候，将发送SHUTDOWN给正在运行的Server的ServerSocket，当tomcat作为一个service运行的时候，会直接调用Server的stop方法停止tomcat
