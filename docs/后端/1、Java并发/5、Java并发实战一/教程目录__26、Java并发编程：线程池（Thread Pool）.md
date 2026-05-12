# 26、Java并发编程：线程池（Thread Pool）
- 来源：https://ddkk.com/zhuanlan/java/concurrency/5/26.html
- 分类：Java并发
- 分组：教程目录
当需要限制应用程序中同时运行的线程数时，线程池很有用。 启动新线程会带来性能开销，并且每个线程还为其栈等分配了一些内存。

与其为每个并发执行的任务启动新线程，不如将任务传递给线程池。 一旦池中有任何空闲线程，就会将任务分配给其中一个并执行。 内部实现为将任务插入到阻塞队列中，线程池中的线程从该队列中取出。 当一个新任务插入到队列后，其中一个空闲线程将它从队列中出队并执行它。 线程池中的其余空闲线程将被阻塞，等待任务出队。

线程池通常用于多线程服务器中。 通过网络到达服务器的每个连接都被包装为一个任务，并传递给线程池。 线程池中的线程将同时处理连接请求。 后续的教程将详细介绍有关在Java中实现多线程服务器的信息。

Java 5在java.util.concurrent包中带有内置的线程池，因此不必实现自己的线程池。 你可以在java.util.concurrent.ExecutorService的文章中阅读有关此内容的更多信息。 不管怎样，了解线程池的实现还是很有用的。

下面是一个简单的线程池实现。 请注意，此实现使用了我自己的BlockingQueue类，如Blocking Queues教程中所述。 在实际实现时，你可能会改用Java的某个内置阻塞队列。

```java
public class ThreadPool {
    private BlockingQueue taskQueue = null;
    private List<PoolThread> threads = new ArrayList<PoolThread>();
    private boolean isStopped = false;
    public ThreadPool(int noOfThreads, int maxNoOfTasks){
        taskQueue = new BlockingQueue(maxNoOfTasks);
        for(int i=0; i<noOfThreads; i++){
            threads.add(new PoolThread(taskQueue));
        }
        for(PoolThread thread : threads){
            thread.start();
        }
    }
    public synchronized void  execute(Runnable task) throws Exception{
        if(this.isStopped) throw
            new IllegalStateException("ThreadPool is stopped");
        this.taskQueue.enqueue(task);
    }
    public synchronized void stop(){
        this.isStopped = true;
        for(PoolThread thread : threads){
           thread.doStop();
        }
    }
}
```

```java
public class PoolThread extends Thread {
    private BlockingQueue taskQueue = null;
    private boolean       isStopped = false;
    public PoolThread(BlockingQueue queue){
        taskQueue = queue;
    }
    public void run(){
        while(!isStopped()){
            try{
                Runnable runnable = (Runnable) taskQueue.dequeue();
                runnable.run();
            } catch(Exception e){
                //log or otherwise report exception,
                //but keep pool thread alive.
            }
        }
    }
    public synchronized void doStop(){
        isStopped = true;
        this.interrupt(); //break pool thread out of dequeue() call.
    }
    public synchronized boolean isStopped(){
        return isStopped;
    }
}
```

线程池实现由两部分组成。 ThreadPool类是线程池的公共接口，而PoolThread类是实现执行任务的线程的类。

要执行任务，需调用ThreadPool.execute（Runnable r）方法并以一个Runnable实现作为参数。 Runnable在内部进入阻塞队列，等待被出队。

Runnable将由空闲的PoolThread出队并执行。 可以在PoolThread.run（）方法中看到这一点。 执行后，PoolThread循环并尝试再次使任务出队，直到停止。

要停止ThreadPool，需调用ThreadPool.stop（）方法。stop的调用被内部记录在isStopped成员变量中。 然后，在每个线程上调用doStop（）来停止线程池中的每个线程。 注意，如果在调用stop（）之后调用execute（），则execute（）方法将抛出IllegalStateException。

完成当前执行的任务后，线程将停止。 注意PoolThread.doStop（）中调用了this.interrupt（）。 这样可以确保在taskQueue.dequeue（）内阻塞在wait（）中的线程跳出wait（），并在dequeue（）方法中抛出InterruptedException并退出。 此异常将在PoolThread.run（）方法中被捕获并上报，然后检查isStopped变量。 由于isStopped现在为true，因此PoolThread.run（）将退出并且线程死亡。
