# 07、Tomcat8 源码解析 - 日志器
- 来源：https://ddkk.com/zhuanlan/server/tomcat/1/7.html
- 分类：服务器框架
- 分组：教程目录
Tomcat源码版本：apache-tomcat-8.5.54-src

JDK源码版本：jdk1.8.0_171

**1、** juli包；

1、Tomcat日志包：org.apache.juli。默认情况下，Tomcat使用自身的juli作为Tomcat内部的日志处理系统,而juli默认使用JDK提供的日志java.util.logging.

java.util.logging的一个特点就是根据classloader进行区分打印日志，不同的web应用使用不同的webappclassloader，因此不同应用的日志就可以区分开来。

2、三个参数

java.util.logging.manager：LogManager作为全局日志管理器负责维护日志配置和日志继承结构，LogManager通过“java.util.logging.manager”系统参数指定，程序可以通过LogManager.getLogManager()方法得到这个全局日志管理器。

java.util.logging.config.class 为自定义配置类，负责完成配置信息的初始化

java.util.logging.config.file 用于指定自定义配置文件，默认情况下LogManager的配置文件为%JAVA_HOME%/jre/lib/logging.properties，而tomcat一般放在%TOMCAT_HOME%/conf/logging.properties

3、配置举例

```java
-Djava.util.logging.manager=org.apache.juli.ClassLoaderLogManager
-Djava.util.logging.config.file=E:/workspace/mot/tomcat8.5/conf/logging.properties
```

然后启动Tomcat，断点看下执行过程：

```java
org.apache.catalina.startup.Bootstrap
-->private static final Log log = LogFactory.getLog(Bootstrap.class);
-->private static final LogFactory singleton = new LogFactory();
---->org.apache.juli.logging.LogFactory::getLog
------>org.apache.juli.logging.LogFactory::getInstance
-------->org.apache.juli.logging.DirectJDKLog::getInstance
---------->java.util.logging.Logger::getLogger(最终调用JDK中的日志器)
---------->java.util.logging.Logger::demandLogger
------------>java.util.logging.LogManager::getLogManager 得到这个全局日志管理器
------------>java.util.logging.LogManager::ensureLogManagerInitialized
------------>java.util.logging.LogManager::readPrimordialConfiguration
-------------->org.apache.juli.ClassLoaderLogManager::readConfiguration //读取配置
```

java.util.logging.LogManager源码：

```java
public class LogManager {
    // The global LogManager object
    private static final LogManager manager;    
    ......
    static {
        manager = AccessController.doPrivileged(new PrivilegedAction<LogManager>() {
            @Override
            public LogManager run() {
                LogManager mgr = null;
                String cname = null;
                try {//静态初始化加载
                    cname = System.getProperty("java.util.logging.manager");
                    if (cname != null) {
                        try {
                            Class<?> clz = ClassLoader.getSystemClassLoader().loadClass(cname);
                            mgr = (LogManager) clz.newInstance();
                        } catch (ClassNotFoundException ex) {
                            Class<?> clz = Thread.currentThread().getContextClassLoader().loadClass(cname);
                            mgr = (LogManager) clz.newInstance();
                        }
                    }
                } catch (Exception ex) {
                    System.err.println("Could not load Logmanager \"" + cname + "\"");
                    ex.printStackTrace();
                }
                if (mgr == null) {
                    mgr = new LogManager();
                }
                return mgr;
            }
        });
    }
    ......
    public static LogManager getLogManager() {
        if (manager != null) {
            manager.ensureLogManagerInitialized();
        }
        return manager;
    }
    final void ensureLogManagerInitialized() {
        final LogManager owner = this;
        if (initializationDone || owner != manager) {
            return;
        }
        synchronized(this) {
            ......try {
                AccessController.doPrivileged(new PrivilegedAction<Object>() {
                    @Override
                    public Object run() {
                        assert rootLogger == null;
                        assert initializedCalled && !initializationDone;
                        // Read configuration.
                        owner.readPrimordialConfiguration();
                        owner.rootLogger = owner.new RootLogger();
                        owner.addLogger(owner.rootLogger);
                        if (!owner.rootLogger.isLevelInitialized()) {
                            owner.rootLogger.setLevel(defaultLevel);
                        }
                        @SuppressWarnings("deprecation")
                        final Logger global = Logger.global;
                        owner.addLogger(global);
                        return null;
                    }
                });
            } finally {
                initializationDone = true;
            }
        }
    }
    private void readPrimordialConfiguration() {
        if (!readPrimordialConfiguration) {
            synchronized (this) {
                if (!readPrimordialConfiguration) {
                    if (System.out == null) {
                        return;
                    }
                    readPrimordialConfiguration = true;
                    try {
                        AccessController.doPrivileged(new PrivilegedExceptionAction<Void>() {
                                @Override
                                public Void run() throws Exception {
                                    readConfiguration();
                                    sun.util.logging.PlatformLogger.redirectPlatformLoggers();
                                    return null;
                                }
                            });
                    } catch (Exception ex) {
                        assert false : "Exception raised while reading logging configuration: " + ex;
                    }
                }
            }
        }
    }
    //如果不配置java.util.logging.manager  会读取默认%JAVA_HOME%/jre/lib/logging.properties
    public void readConfiguration() throws IOException, SecurityException {
        checkPermission();
        // if a configuration class is specified, load it and use it.
        String cname = System.getProperty("java.util.logging.config.class");
        if (cname != null) {
            try {
                // Instantiate the named class.  It is its constructor's
                // responsibility to initialize the logging configuration, by
                // calling readConfiguration(InputStream) with a suitable stream.
                try {
                    Class<?> clz = ClassLoader.getSystemClassLoader().loadClass(cname);
                    clz.newInstance();
                    return;
                } catch (ClassNotFoundException ex) {
                    Class<?> clz = Thread.currentThread().getContextClassLoader().loadClass(cname);
                    clz.newInstance();
                    return;
                }
            } catch (Exception ex) {
                System.err.println("Logging configuration class \"" + cname + "\" failed");
                System.err.println("" + ex);
                // keep going and useful config file.
            }
        }
        String fname = System.getProperty("java.util.logging.config.file");
        if (fname == null) {
            fname = System.getProperty("java.home");
            if (fname == null) {
                throw new Error("Can't find java.home ??");
            }
            File f = new File(fname, "lib");
            f = new File(f, "logging.properties");
            fname = f.getCanonicalPath();
        }
        try (final InputStream in = new FileInputStream(fname)) {
            final BufferedInputStream bin = new BufferedInputStream(in);
            readConfiguration(bin);
        }
    }
    ......
}
```

org.apache.juli.ClassLoaderLogManager.java源码：

```java
public class ClassLoaderLogManager extends LogManager {
    @Override
    public void readConfiguration()
        throws IOException, SecurityException {
        checkAccess();
        readConfiguration(Thread.currentThread().getContextClassLoader());
    }
    protected synchronized void readConfiguration(ClassLoader classLoader)
        throws IOException {
        InputStream is = null;
        try {
            if (classLoader instanceof WebappProperties) {
                if (((WebappProperties) classLoader).hasLoggingConfig()) {
                    is = classLoader.getResourceAsStream("logging.properties");
                }
            } else if (classLoader instanceof URLClassLoader) {
                URL logConfig = ((URLClassLoader)classLoader).findResource("logging.properties");
                if(null != logConfig) {
                    if(Boolean.getBoolean(DEBUG_PROPERTY))
                        System.err.println(getClass().getName()
                                           + ".readConfiguration(): "
                                           + "Found logging.properties at "
                                           + logConfig);
                    is = classLoader.getResourceAsStream("logging.properties");
                } else {
                    if(Boolean.getBoolean(DEBUG_PROPERTY))
                        System.err.println(getClass().getName()
                                           + ".readConfiguration(): "
                                           + "Found no logging.properties");
                }
            }
        } catch (AccessControlException ace) {
            ClassLoaderLogInfo info = classLoaderLoggers.get(ClassLoader.getSystemClassLoader());
            if (info != null) {
                Logger log = info.loggers.get("");
                if (log != null) {
                    Permission perm = ace.getPermission();
                    if (perm instanceof FilePermission && perm.getActions().equals("read")) {
                        log.warning("Reading " + perm.getName() + " is not permitted. See \"per context logging\" in the default catalina.policy file.");
                    }
                    else {
                        log.warning("Reading logging.properties is not permitted in some context. See \"per context logging\" in the default catalina.policy file.");
                        log.warning("Original error was: " + ace.getMessage());
                    }
                }
            }
        }
        ......
        if (is != null) {
            readConfiguration(is, classLoader);
        }
        try {
            addingLocalRootLogger.set(Boolean.TRUE);
            addLogger(localRootLogger);
        } finally {
            addingLocalRootLogger.set(Boolean.FALSE);
        }
    }
    protected synchronized void readConfiguration(InputStream is, ClassLoader classLoader)
        throws IOException {
        ClassLoaderLogInfo info = classLoaderLoggers.get(classLoader);
        try {
            info.props.load(is);
        } catch (IOException e) {
        } finally {
            try {
                is.close();
            } catch (IOException ioe) {
            }
        }
        String rootHandlers = info.props.getProperty(".handlers");
        String handlers = info.props.getProperty("handlers");
        Logger localRootLogger = info.rootNode.logger;
        if (handlers != null) {
            StringTokenizer tok = new StringTokenizer(handlers, ",");
            while (tok.hasMoreTokens()) {
                String handlerName = (tok.nextToken().trim());
                String handlerClassName = handlerName;
                String prefix = "";
                if (handlerClassName.length() <= 0) {
                    continue;
                }
                if (Character.isDigit(handlerClassName.charAt(0))) {
                    int pos = handlerClassName.indexOf('.');
                    if (pos >= 0) {
                        prefix = handlerClassName.substring(0, pos + 1);//1catalina.
                        handlerClassName = handlerClassName.substring(pos + 1);//org.apache.juli.AsyncFileHandler
                    }
                }
                try {
                    this.prefix.set(prefix);
                    Handler handler = (Handler) classLoader.loadClass(handlerClassName).getConstructor().newInstance();//org.apache.juli.AsyncFileHandler java.util.logging.ConsoleHandler
                    this.prefix.set(null);
                    info.handlers.put(handlerName, handler);//1catalina.org.apache.juli.AsyncFileHandler=org.apache.juli.AsyncFileHandler
                    if (rootHandlers == null) {
                        localRootLogger.addHandler(handler);
                    }
                } catch (Exception e) {
                    System.err.println("Handler error");
                    e.printStackTrace();
                }
            }
        }
    }
    @Override
    public synchronized boolean addLogger(final Logger logger) {
        final String loggerName = logger.getName();
        ClassLoader classLoader = Thread.currentThread().getContextClassLoader();
        ClassLoaderLogInfo info = getClassLoaderInfo(classLoader);
        if (info.loggers.containsKey(loggerName)) {
            return false;
        }
        info.loggers.put(loggerName, logger);
        // Apply initial level for new logger
        final String levelString = getProperty(loggerName + ".level");
        if (levelString != null) {
            try {
                AccessController.doPrivileged(new PrivilegedAction<Void>() {
                    @Override
                    public Void run() {
                        logger.setLevel(Level.parse(levelString.trim()));
                        return null;
                    }
                });
            } catch (IllegalArgumentException e) {
                // Leave level set to null
            }
        }
        int dotIndex = loggerName.lastIndexOf('.');
        if (dotIndex >= 0) {
            final String parentName = loggerName.substring(0, dotIndex);
            Logger.getLogger(parentName);
        }
        // Find associated node
        LogNode node = info.rootNode.findNode(loggerName);
        node.logger = logger;
        // Set parent logger
        Logger parentLogger = node.findParentLogger();
        if (parentLogger != null) {
            doSetParentLogger(logger, parentLogger);
        }
        // Tell children we are their new parent
        node.setParentLogger(logger);
        // Add associated handlers, if any are defined using the .handlers property.
        // In this case, handlers of the parent logger(s) will not be used
        String handlers = getProperty(loggerName + ".handlers");
        if (handlers != null) {
            logger.setUseParentHandlers(false);
            StringTokenizer tok = new StringTokenizer(handlers, ",");
            while (tok.hasMoreTokens()) {
                String handlerName = (tok.nextToken().trim());
                Handler handler = null;
                ClassLoader current = classLoader;
                while (current != null) {
                    info = classLoaderLoggers.get(current);
                    if (info != null) {
                        handler = info.handlers.get(handlerName);
                        if (handler != null) {
                            break;
                        }
                    }
                    current = current.getParent();
                }
                if (handler != null) {
                    logger.addHandler(handler);
                }
            }
        }
        String useParentHandlersString = getProperty(loggerName + ".useParentHandlers");
        if (Boolean.parseBoolean(useParentHandlersString)) {
            logger.setUseParentHandlers(true);
        }
        return true;
    }
    ......
}
```

java.util.logging.ConsoleHandler:

```java
public class ConsoleHandler extends StreamHandler {
    ......
    //Handler构造函数设置输出流
    public ConsoleHandler() {
        sealed = false;
        configure();
        setOutputStream(System.err);//设置System.err作为默认输出
        sealed = true;
    }
    @Override
    public void publish(LogRecord record) {
        super.publish(record);
        flush();
    }
    ......
}
```

java.util.logging.StreamHandler源码：

```java
public class StreamHandler extends Handler {
    ......
    protected synchronized void setOutputStream(OutputStream out) throws SecurityException {
        if (out == null) {
            throw new NullPointerException();
        }
        flushAndClose();
        output = out;
        doneHeader = false;
        String encoding = getEncoding();
        if (encoding == null) {
            writer = new OutputStreamWriter(output);
        } else {
            try {
                writer = new OutputStreamWriter(output, encoding);
            } catch (UnsupportedEncodingException ex) {
                // This shouldn't happen.  The setEncoding method
                // should have validated that the encoding is OK.
                throw new Error("Unexpected exception " + ex);
            }
        }
    }
    @Override
    public synchronized void publish(LogRecord record) {
        if (!isLoggable(record)) {
            return;
        }
        String msg;
        try {
            msg = getFormatter().format(record);
        } catch (Exception ex) {
            // We don't want to throw an exception here, but we
            // report the exception to any registered ErrorManager.
            reportError(null, ex, ErrorManager.FORMAT_FAILURE);
            return;
        }
        try {
            if (!doneHeader) {
                writer.write(getFormatter().getHead(this));
                doneHeader = true;
            }
            writer.write(msg);
        } catch (Exception ex) {
            // We don't want to throw an exception here, but we
            // report the exception to any registered ErrorManager.
            reportError(null, ex, ErrorManager.WRITE_FAILURE);
        }
    }
    ......
}
```

**2、** JDKLogging；

关键组件：

1、LogManager：整个JVM内部所有logger的管理，logger的生成、获取等操作都依赖于它，也包括配置文件的读取。LogManager$LoggerContext中会有一个private final Hashtable namedLoggers = new Hashtable<>();用于存储目前所有的logger，如果需要获取logger的时候，Hashtable已经有存在logger的话就直接返回Hashtable中的，如果hashtable中没有logger，则新建一个同时放入Hashtable进行保存。

2、Handler：用来控制日志输出的，比如JDK自带的ConsoleHanlder把输出流重定向到System.err输出，每次调用Logger的方法进行输出时都会调用Handler的publish方法，每个logger有多个handler。我们可以利用handler来把日志输入到不同的地方(比如文件系统或者是远程Socket连接).

3、Formatter：日志在真正输出前需要进行一定的格式话：比如是否输出时间？时间格式？是否输入线程名？是否使用国际化信息等都依赖于Formatter。

4、Log Level：logging为什么能帮助我们适应从开发调试到部署上线等不同阶段对日志输出粒度的不同需求。JDK Log级别从高到低为OFF(231-1)—>SEVERE(1000)—>WARNING(900)—>INFO(800)—>CONFIG(700)—>FINE(500)—>FINER(400)—>FINEST(300)—>ALL(-231)，每个级别分别对应一个数字，输出日志时级别的比较就依赖于数字大小的比较。但是需要注意的是：不仅是logger具有级别，handler也是有级别，也就是说如果某个logger级别是FINE，客户希望输入FINE级别的日志，如果此时logger对应的handler级别为INFO，那么FINE级别日志仍然是不能输出的。

对应关系：

1、LogManager与logger是1对多关系，整个JVM运行时只有一个LogManager，且所有的logger均在LogManager中;

2、logger与handler是多对多关系，logger在进行日志输出的时候会调用所有的hanlder进行日志的处理;

3、handler与formatter是一对一关系，一个handler有一个formatter进行日志的格式化处理;

4、很明显：logger与level是一对一关系，hanlder与level也是一对一关系;

配置举例：

```java
#用逗号隔开的Handler类名，用于根Logger
handlers = 1catalina.org.apache.juli.AsyncFileHandler, 2localhost.org.apache.juli.AsyncFileHandler, 3manager.org.apache.juli.AsyncFileHandler, 4host-manager.org.apache.juli.AsyncFileHandler, java.util.logging.ConsoleHandler
#用逗号隔开的Handler类名，用于特定的Logger；
.handlers = 1catalina.org.apache.juli.AsyncFileHandler, java.util.logging.ConsoleHandler
#日志级别
1catalina.org.apache.juli.AsyncFileHandler.level = FINE
#日志目录
1catalina.org.apache.juli.AsyncFileHandler.directory = ${catalina.base}/logs
#日志文件前缀 catalina引擎的日志文件，文件名:catalina.日期.log
1catalina.org.apache.juli.AsyncFileHandler.prefix = catalina.
#日志字符集
1catalina.org.apache.juli.AsyncFileHandler.encoding = UTF-8
#Tomcat下内部代码丢出的日志，文件名localhost.日期.log（jsp页面内部错误的异常，org.apache.jasper.runtime.HttpJspBase.service类丢出的，日志信息就在该文件！） 
2localhost.org.apache.juli.AsyncFileHandler.level = FINE
2localhost.org.apache.juli.AsyncFileHandler.directory = ${catalina.base}/logs
2localhost.org.apache.juli.AsyncFileHandler.prefix = localhost.
2localhost.org.apache.juli.AsyncFileHandler.encoding = UTF-8
#Tomcat下默认manager应用日志，文件名manager.日期.log
3manager.org.apache.juli.AsyncFileHandler.level = FINE
3manager.org.apache.juli.AsyncFileHandler.directory = ${catalina.base}/logs
3manager.org.apache.juli.AsyncFileHandler.prefix = manager.
3manager.org.apache.juli.AsyncFileHandler.encoding = UTF-8
4host-manager.org.apache.juli.AsyncFileHandler.level = FINE
4host-manager.org.apache.juli.AsyncFileHandler.directory = ${catalina.base}/logs
4host-manager.org.apache.juli.AsyncFileHandler.prefix = host-manager.
4host-manager.org.apache.juli.AsyncFileHandler.encoding = UTF-8
#控制台输出的日志，Linux下默认重定向到catalina.out 
java.util.logging.ConsoleHandler.level = FINE
java.util.logging.ConsoleHandler.formatter = org.apache.juli.OneLineFormatter
java.util.logging.ConsoleHandler.encoding = UTF-8
org.apache.catalina.core.ContainerBase.[Catalina].[localhost].level = INFO
org.apache.catalina.core.ContainerBase.[Catalina].[localhost].handlers = 2localhost.org.apache.juli.AsyncFileHandler
org.apache.catalina.core.ContainerBase.[Catalina].[localhost].[/manager].level = INFO
org.apache.catalina.core.ContainerBase.[Catalina].[localhost].[/manager].handlers = 3manager.org.apache.juli.AsyncFileHandler
org.apache.catalina.core.ContainerBase.[Catalina].[localhost].[/host-manager].level = INFO
org.apache.catalina.core.ContainerBase.[Catalina].[localhost].[/host-manager].handlers = 4host-manager.org.apache.juli.AsyncFileHandler
```

org.apache.juli.OneLineFormatter核心方法format格式化输出字符串：

```java
public class OneLineFormatter extends Formatter {
    ......    
    @Override
    public String format(LogRecord record) {
        StringBuilder sb = new StringBuilder();
        // Timestamp
        addTimestamp(sb, record.getMillis());
        // Severity
        sb.append(' ');
        sb.append(record.getLevel().getLocalizedName());
        // Thread
        sb.append(' ');
        sb.append('[');
        if (Thread.currentThread() instanceof AsyncFileHandler.LoggerThread) {
            // If using the async handler can't get the thread name from the
            // current thread.
            sb.append(getThreadName(record.getThreadID()));
        } else {
            sb.append(Thread.currentThread().getName());
        }
        sb.append(']');
        // Source
        sb.append(' ');
        sb.append(record.getSourceClassName());
        sb.append('.');
        sb.append(record.getSourceMethodName());
        // Message
        sb.append(' ');
        sb.append(formatMessage(record));
        // New line for next record
        sb.append(System.lineSeparator());
        // Stack trace
        if (record.getThrown() != null) {
            StringWriter sw = new StringWriter();
            PrintWriter pw = new IndentingPrintWriter(sw);
            record.getThrown().printStackTrace(pw);
            pw.close();
            sb.append(sw.getBuffer());
        }
        return sb.toString();
    }
    ....
}
```

测试：

```java
-Dorg.apache.juli.ClassLoaderLogManager.debug=true
```

```java
import java.util.logging.Logger;
public final class Bootstrap {
     private static final Log log = LogFactory.getLog(Bootstrap.class);
     public static void main(String args[]) {
           log.info("123");
        ....
    }
    ....
}
```

执行流程：

```java
org.apache.catalina.startup.Bootstrap.main(String[]) line: 465    
-->org.apache.juli.logging.DirectJDKLog.info(Object) line: 116    
-->org.apache.juli.logging.DirectJDKLog.info(Object) line: 116    
-->org.apache.juli.logging.DirectJDKLog.log(Level, String, Throwable) line: 173
---->java.util.logging.Logger.logp(Level, String, String, String) line: 931
---->java.util.logging.Logger.doLog(LogRecord) line: 765    
---->java.util.logging.Logger.log(LogRecord) line: 738    
------>java.util.logging.ConsoleHandler.publish(LogRecord) line: 116 //org.apache.catalina.startup.Bootstrap默认走 roothandler 
------>java.util.logging.StreamHandler.publish(LogRecord) line: 206
```

打印：

26-Apr-2020 12:56:14.207 信息 [main] org.apache.catalina.startup.Bootstrap.main 123

**3、** 引入异步打印文件器；

配置：

```java
-Dorg.apache.juli.ClassLoaderLogManager.debug=true
-Djava.util.logging.manager=org.apache.juli.ClassLoaderLogManager
-Djava.util.logging.config.file=E:/workspace/mot/tomcat8.5/conf/logging.properties
```

logging.properties:

```java
#用逗号隔开的Handler类名，用于根Logger
handlers = 1catalina.org.apache.juli.AsyncFileHandler, 2localhost.org.apache.juli.AsyncFileHandler, 3manager.org.apache.juli.AsyncFileHandler, 4host-manager.org.apache.juli.AsyncFileHandler, java.util.logging.ConsoleHandler
#用逗号隔开的Handler类名，用于特定的Logger；
.handlers = 1catalina.org.apache.juli.AsyncFileHandler, java.util.logging.ConsoleHandler
#日志级别
1catalina.org.apache.juli.AsyncFileHandler.level = FINE
#日志目录
1catalina.org.apache.juli.AsyncFileHandler.directory = ${catalina.base}/logs
#日志文件前缀 catalina引擎的日志文件，文件名:catalina.日期.log
1catalina.org.apache.juli.AsyncFileHandler.prefix = catalina.
#日志字符集
1catalina.org.apache.juli.AsyncFileHandler.encoding = UTF-8
#控制台输出的日志，Linux下默认重定向到catalina.out 
java.util.logging.ConsoleHandler.level = FINE
java.util.logging.ConsoleHandler.formatter = org.apache.juli.OneLineFormatter
java.util.logging.ConsoleHandler.encoding = UTF-8
#自定义org.apache.catalina.startup包的输入日志级别为INFO
org.apache.catalina.startup.level = INFO
```

异步打印文件器AsyncFileHandler：

```java
package org.apache.juli;
import java.util.concurrent.LinkedBlockingDeque;
import java.util.concurrent.TimeUnit;
import java.util.logging.LogRecord;
public class AsyncFileHandler extends FileHandler {
    public static final int OVERFLOW_DROP_LAST    = 1;
    public static final int OVERFLOW_DROP_FIRST   = 2;
    public static final int OVERFLOW_DROP_FLUSH   = 3;
    public static final int OVERFLOW_DROP_CURRENT = 4;
    public static final int DEFAULT_OVERFLOW_DROP_TYPE = 1;
    public static final int DEFAULT_MAX_RECORDS        = 10000;
    public static final int DEFAULT_LOGGER_SLEEP_TIME  = 1000;
    public static final int OVERFLOW_DROP_TYPE = Integer.parseInt(
            System.getProperty("org.apache.juli.AsyncOverflowDropType",
                               Integer.toString(DEFAULT_OVERFLOW_DROP_TYPE)));
    public static final int MAX_RECORDS = Integer.parseInt(
            System.getProperty("org.apache.juli.AsyncMaxRecordCount",
                               Integer.toString(DEFAULT_MAX_RECORDS)));
    public static final int LOGGER_SLEEP_TIME = Integer.parseInt(
            System.getProperty("org.apache.juli.AsyncLoggerPollInterval",
                               Integer.toString(DEFAULT_LOGGER_SLEEP_TIME)));
    protected static final LinkedBlockingDeque<LogEntry> queue =
            new LinkedBlockingDeque<>(MAX_RECORDS);
    //异步打印线程启动
    protected static final LoggerThread logger = new LoggerThread();
    static {
        logger.start();
    }
    protected volatile boolean closed = false;
    public AsyncFileHandler() {
        this(null, null, null, DEFAULT_MAX_DAYS);
    }
    public AsyncFileHandler(String directory, String prefix, String suffix) {
        this(directory, prefix, suffix, DEFAULT_MAX_DAYS);
    }
    public AsyncFileHandler(String directory, String prefix, String suffix, int maxDays) {
        super(directory, prefix, suffix, maxDays);
        open();
    }
    @Override
    public void close() {
        if (closed) {
            return;
        }
        closed = true;
        super.close();
    }
    @Override
    protected void open() {
        if (!closed) {
            return;
        }
        closed = false;
        super.open();
    }
    @Override
    public void publish(LogRecord record) {
        if (!isLoggable(record)) {
            return;
        }
        record.getSourceMethodName();
        LogEntry entry = new LogEntry(record, this);
        boolean added = false;
        try {
            while (!added && !queue.offer(entry)) {
                switch (OVERFLOW_DROP_TYPE) {
                    case OVERFLOW_DROP_LAST: {
                        queue.pollLast();
                        break;
                    }
                    case OVERFLOW_DROP_FIRST: {
                        //remove the first element in the queue
                        queue.pollFirst();
                        break;
                    }
                    case OVERFLOW_DROP_FLUSH: {
                        added = queue.offer(entry, 1000, TimeUnit.MILLISECONDS);
                        break;
                    }
                    case OVERFLOW_DROP_CURRENT: {
                        added = true;
                        break;
                    }
                }//switch
            }//while
        } catch (InterruptedException x) {
        }
    }
    //调用父类FileHandler的pulish
    protected void publishInternal(LogRecord record) {
        super.publish(record);
    }
    protected static class LoggerThread extends Thread {
        public LoggerThread() {
            this.setDaemon(true);
            this.setName("AsyncFileHandlerWriter-" + System.identityHashCode(this));
        }
        @Override
        public void run() {
            while (true) {
                try {
                    LogEntry entry = queue.poll(LOGGER_SLEEP_TIME, TimeUnit.MILLISECONDS);//poll取出来
                    if (entry != null) {
                        entry.flush();//打印
                    }
                } catch (InterruptedException x) {
                } catch (Exception x) {
                    x.printStackTrace();
                }
            }
        }
    }
    protected static class LogEntry {
        private final LogRecord record;
        private final AsyncFileHandler handler;
        public LogEntry(LogRecord record, AsyncFileHandler handler) {
            super();
            this.record = record;
            this.handler = handler;
        }
        public boolean flush() {
            if (handler.closed) {
                return false;
            } else {
                handler.publishInternal(record);
                return true;
            }
        }
    }
}
```

org.apache.juli.FileHandler核心方法publish：

```java
public class FileHandler extends Handler {
    .....
    @Override
    public void publish(LogRecord record) {
        if (!isLoggable(record)) {
            return;
        }
        // Construct the timestamp we will use, if requested
        Timestamp ts = new Timestamp(System.currentTimeMillis());
        String tsDate = ts.toString().substring(0, 10);
        writerLock.readLock().lock();//使用读写锁控制
        try {
            // If the date has changed, switch log files
            if (rotatable && !date.equals(tsDate)) {
                // Upgrade to writeLock before we switch
                writerLock.readLock().unlock();
                writerLock.writeLock().lock();
                try {
                    // Make sure another thread hasn't already done this
                    if (!date.equals(tsDate)) {
                        closeWriter();
                        date = tsDate;
                        openWriter();
                        clean();
                    }
                } finally {
                    // Downgrade to read-lock. This ensures the writer remains valid
                    // until the log message is written
                    writerLock.readLock().lock();
                    writerLock.writeLock().unlock();
                }
            }
            String result = null;
            try {
                result = getFormatter().format(record);
            } catch (Exception e) {
                reportError(null, e, ErrorManager.FORMAT_FAILURE);
                return;
            }
            try {
                if (writer != null) {
                    writer.write(result);
                    if (bufferSize < 0) {
                        writer.flush();
                    }
                } else {
                    reportError("FileHandler is closed or not yet initialized, unable to log ["
                            + result + "]", null, ErrorManager.WRITE_FAILURE);
                }
            } catch (Exception e) {
                reportError(null, e, ErrorManager.WRITE_FAILURE);
            }
        } finally {
            writerLock.readLock().unlock();
        }
    }
        protected void openWriter() {
        // Create the directory if necessary
        File dir = new File(directory);
        if (!dir.mkdirs() && !dir.isDirectory()) {
            reportError("Unable to create [" + dir + "]", null, ErrorManager.OPEN_FAILURE);
            writer = null;
            return;
        }
        // Open the current log file
        writerLock.writeLock().lock();
        FileOutputStream fos = null;
        OutputStream os = null;
        try {
            File pathname = new File(dir.getAbsoluteFile(), prefix
                    + (rotatable ? date : "") + suffix);
            File parent = pathname.getParentFile();
            if (!parent.mkdirs() && !parent.isDirectory()) {
                reportError("Unable to create [" + parent + "]", null, ErrorManager.OPEN_FAILURE);
                writer = null;
                return;
            }
            String encoding = getEncoding();
            fos = new FileOutputStream(pathname, true);
            os = bufferSize > 0 ? new BufferedOutputStream(fos, bufferSize) : fos;
            writer = new PrintWriter(
                    (encoding != null) ? new OutputStreamWriter(os, encoding)
                                       : new OutputStreamWriter(os), false);
            writer.write(getFormatter().getHead(this));
        } catch (Exception e) {
            reportError(null, e, ErrorManager.OPEN_FAILURE);
            writer = null;
            if (fos != null) {
                try {
                    fos.close();
                } catch (IOException e1) {
                    // Ignore
                }
            }
            if (os != null) {
                try {
                    os.close();
                } catch (IOException e1) {
                    // Ignore
                }
            }
        } finally {
            writerLock.writeLock().unlock();
        }
    }
    ......
}
```

输出到打印文件：E:\workspace\mot\tomcat8.5\${catalina.base}\logs\catalina.2020-04-26.log

```java
26-Apr-2020 14:43:47.928 信息 [main] org.apache.catalina.startup.Bootstrap.main 123
```
