# 06、Java 7 新特性 - SR292与InvokeDynamic
- 来源：https://ddkk.com/zhuanlan/java/java7/6.html
- 分类：Java 7 新特性
- 分组：教程目录
JSR292: Supporting Dynamically Typed Languages on the JavaTM Platform，支持在JVM上运行动态类型语言。在字节码层面支持了InvokeDynamic。

-方法句柄MethodHandle

```java
public class ThreadPoolManager {
    private final ScheduledExecutorService stpe = Executors
            .newScheduledThreadPool(2);
    private final BlockingQueue<WorkUnit<String>> lbq;
    public ThreadPoolManager(BlockingQueue<WorkUnit<String>> lbq_) {
        lbq = lbq_;
    }
    public ScheduledFuture<?> run(QueueReaderTask msgReader) {
        msgReader.setQueue(lbq);
        return stpe.scheduleAtFixedRate(msgReader, 10, 10, TimeUnit.MILLISECONDS);
    }
    private void cancel(final ScheduledFuture<?> hndl) {
        stpe.schedule(new Runnable() {
            public void run() {
                hndl.cancel(true);
            }
        }, 10, TimeUnit.MILLISECONDS);
    }
    /**
     * 使用传统的反射api
     */
    public Method makeReflective() {
        Method meth = null;
        try {
            Class<?>[] argTypes = new Class[]{ScheduledFuture.class};
            meth = ThreadPoolManager.class.getDeclaredMethod("cancel", argTypes);
            meth.setAccessible(true);
        } catch (IllegalArgumentException | NoSuchMethodException
                | SecurityException e) {
            e.printStackTrace();
        }
        return meth;
    }
    /**
     * 使用代理类
     * @return
     */
    public CancelProxy makeProxy() {
        return new CancelProxy();
    }
    /**
     * 使用Java7的新api，MethodHandle
     * invoke virtual 动态绑定后调用 obj.xxx
     * invoke special 静态绑定后调用 super.xxx
     * @return
     */
    public MethodHandle makeMh() {
        MethodHandle mh;
        MethodType desc = MethodType.methodType(void.class, ScheduledFuture.class);
        try {
            mh = MethodHandles.lookup().findVirtual(ThreadPoolManager.class,
                    "cancel", desc);
        } catch (NoSuchMethodException | IllegalAccessException e) {
            throw (AssertionError) new AssertionError().initCause(e);
        }
        return mh;
    }
    public static class CancelProxy {
        private CancelProxy() {
        }
        public void invoke(ThreadPoolManager mae_, ScheduledFuture<?> hndl_) {
            mae_.cancel(hndl_);
        }
    }
}
```

- 调用invoke

```java
public class ThreadPoolMain {
    /**
     * 如果被继承，还能在静态上下文寻找正确的class
     */
    private static final Logger logger = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());
    private ThreadPoolManager manager;
    public static void main(String[] args) {
        ThreadPoolMain main = new ThreadPoolMain();
        main.run();
    }
    private void cancelUsingReflection(ScheduledFuture<?> hndl) {
        Method meth = manager.makeReflective();
        try {
            System.out.println("With Reflection");
            meth.invoke(hndl);
        } catch (IllegalAccessException | IllegalArgumentException
                | InvocationTargetException e) {
            e.printStackTrace();
        }
    }
    private void cancelUsingProxy(ScheduledFuture<?> hndl) {
        CancelProxy proxy = manager.makeProxy();
        System.out.println("With Proxy");
        proxy.invoke(manager, hndl);
    }
    private void cancelUsingMH(ScheduledFuture<?> hndl) {
        MethodHandle mh = manager.makeMh();
        try {
            System.out.println("With Method Handle");
            mh.invokeExact(manager, hndl);
        } catch (Throwable e) {
            e.printStackTrace();
        }
    }
    private void run() {
        BlockingQueue<WorkUnit<String>> lbq = new LinkedBlockingQueue<>();
        manager = new ThreadPoolManager(lbq);
        final QueueReaderTask msgReader = new QueueReaderTask(100) {
            @Override
            public void doAction(String msg_) {
                if (msg_ != null)
                    System.out.println("Msg recvd: " + msg_);
            }
        };
        ScheduledFuture<?> hndl = manager.run(msgReader);
        cancelUsingMH(hndl);
        // cancelUsingProxy(hndl);
        // cancelUsingReflection(hndl);
    }
}
```
