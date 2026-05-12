# 23、Java并发编程：CompletionService
- 来源：https://ddkk.com/zhuanlan/java/concurrency/6/23.html
- 分类：Java并发
- 分组：教程目录
**CompletionService简介**

CompletionService与ExecutorService类似都可以用来执行线程池的任务，ExecutorService继承了Executor接口，而CompletionService则是一个接口，那么为什么CompletionService不直接继承Executor接口呢？主要是Executor的特性决定的，Executor框架不能完全保证任务执行的异步性，那就是如果需要实现任务（task）的异步性，只要为每个task创建一个线程就实现了任务的异步性。代码往往包含`new Thread(task).start()`。这种方式的问题在于，它没有限制可创建线程的数量（在ExecutorService可以限制），不过，这样最大的问题是在高并发的情况下，不断创建线程异步执行任务将会极大**增大线程创建的开销**、**造成极大的资源消耗**和**影响系统的稳定性**。另外，Executor框架还支持同步任务的执行，就是在execute方法中调用提交任务的run()方法就属于同步调用。

一般情况下，如果需要判断任务是否完成，思路是得到Future列表的每个Future，然后反复调用其get方法，并将timeout参数设为0，从而通过轮询的方式判断任务是否完成。为了更精确实现任务的异步执行以及更简便的完成任务的异步执行，可以使用CompletionService。

**CompletionService实现原理**

CompletionService实际上可以看做是Executor和BlockingQueue的结合体。CompletionService在接收到要执行的任务时，通过类似BlockingQueue的put和take获得任务执行的结果。CompletionService的一个实现是ExecutorCompletionService，ExecutorCompletionService把具体的计算任务交给Executor完成。

在实现上，ExecutorCompletionService在构造函数中会创建一个BlockingQueue（使用的基于链表的无界队列LinkedBlockingQueue），该BlockingQueue的作用是保存Executor执行的结果。当计算完成时，调用FutureTask的done方法。当提交一个任务到ExecutorCompletionService时，首先将任务包装成QueueingFuture，它是FutureTask的一个子类，然后改写FutureTask的done方法，之后把Executor执行的计算结果放入BlockingQueue中。QueueingFuture的源码如下：

```java
   private class QueueingFuture extends FutureTask<Void> {
       QueueingFuture(RunnableFuture<V> task) {
           super(task, null);
           this.task = task;
       }
       protected void done() { completionQueue.add(task); }
       private final Future<V> task;
   }
```

从代码可以看到，CompletionService将提交的任务转化为QueueingFuture，并且覆盖了done方法，在done方法中就是将任务加入任务队列中。这点与之前对Executor框架的分析是一致的。

**使用ExecutorService实现任务**

代码模拟了电商中加载商品详情这一操作，因为商品属性的多样性，所以可以将商品的图片显示与商品简介的显示设为两个独立执行的任务。另外，由于商品的图片可能有许多张，所以图片的显示往往比简介显示更慢。这个时候异步执行能够在一定程度上加快执行的速度提高系统的性能。下面的代码演示了这点：

```java
package com.ddkk.patchwork.concurrency.r0410;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.concurrent.*;
/**
 * DDKK.COM 弟弟快看，程序员编程资料站 16-4-10.
 */
public class DisplayProductInfoWithExecutorService {
    //线程池
    private final ExecutorService executorService = Executors.newFixedThreadPool(2);
    //日期格式器
    private final DateFormat format = new SimpleDateFormat("HH:mm:ss");
    // 模拟电商网站商品详情的信息展示
    // 由于可能商品的图片可能会有很多张，所以显示商品的图片往往会有一定的延迟
    // 除了商品的详情外还包括商品简介等信息的展示，由于这里信息主要的是文字为
    // 主，所以能够比图片更快显示出来。下面的代码就以执行这两个任务为主线，完
    // 成这两个任务的执行。由于这两个任务的执行存在较大差距，所以想到的第一个
    // 思路就是异步执行，首先执行图像的下载任务，之后（不会很久）开始执行商品
    // 简介信息的展示，如果网络足够好，图片又不是很大的情况下，可能在开始展示
    // 商品的时候图像就下载完成了，所以自然想到使用Executor和Callable完成异
    // 步任务的执行。
    public void renderProductDetail() {
        final List<ProductInfo>  productInfos = loadProductImages();
        //异步下载图像的任务
        Callable<List<ProductImage>> task = new Callable<List<ProductImage>>() {
            @Override
            public List<ProductImage> call() throws Exception {
                List<ProductImage> imageList = new ArrayList<>();
                for (ProductInfo info : productInfos){
                    imageList.add(info.getImage());
                }
                return imageList;
            }
        };
        //提交给线程池执行
        Future<List<ProductImage>> listFuture = executorService.submit(task);
        //展示商品简介的信息
        renderProductText(productInfos);
        try {
            //显示商品的图片
            List<ProductImage> imageList = listFuture.get();
            renderProductImage(imageList);
        } catch (InterruptedException e) {
            // 如果显示图片发生中断异常则重新设置线程的中断状态
            // 这样做可以让wait中的线程唤醒
            Thread.currentThread().interrupt();
            // 同时取消任务的执行,参数false表示在线程在执行不中断
            listFuture.cancel(true);
        } catch (ExecutionException e) {
            try {
                throw new Throwable(e.getCause());
            } catch (Throwable throwable) {
                throwable.printStackTrace();
            }
        }
    }
    private void renderProductImage(List<ProductImage> imageList ) {
        for (ProductImage image : imageList){
            try {
                TimeUnit.SECONDS.sleep(1);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
        System.out.println(Thread.currentThread().getName() + " display products images! "
            + format.format(new Date()));
    }
    private void renderProductText(List<ProductInfo> productInfos) {
        for (ProductInfo info : productInfos){
            try {
                Thread.sleep(50);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
        System.out.println(Thread.currentThread().getName() + " display products description! "
            + format.format(new Date()));
    }
    private List<ProductInfo> loadProductImages() {
        List<ProductInfo> list = new ArrayList<>();
        try {
            TimeUnit.SECONDS.sleep(5);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        ProductInfo info = new ProductInfo();
        info.setImage(new ProductImage());
        list.add(info);
        System.out.println(Thread.currentThread().getName() + " load products info! "
                + format.format(new Date()));
        return list;
    }
    /**
     * 商品
     */
    private static class ProductInfo{
        private ProductImage image;
        public ProductImage getImage() {
            return image;
        }
        public void setImage(ProductImage image) {
            this.image = image;
        }
    }
    private static class ProductImage{
     }
    public static void main(String[] args){
        DisplayProductInfoWithExecutorService cd = new DisplayProductInfoWithExecutorService();
        cd.renderProductDetail();
        System.exit(0);
    }
}
```

代码的执行结果如下：

在上面的代码中，尝试并行执行商品图像的下载和简介信息的任务的执行，虽然这种方式能够完成任务，但是异构任务的并行对性能的提升还是有限的。考虑一种极端情况，商品图片的下载的速度远远小于简介信息的加载，那么这种情况（通常两者的加载速度的比例会是一个较大的值）下实际上任务的串行的执行效率就差不多了。而且使用了更复杂的代码，得到的提升却如此之小。**只有当量相互独立并且同构的任务可以并发处理时，对系统性能的提升才是巨大的** （因为加载图片和简介执行速度相差太大，所以不是同构的任务）。

**使用CompletionService实现任务**

使用CompletionService的一大改进就是把多个图片的加载分发给多个工作单元进行处理，这样通过分发的方式就缩小了商品图片的加载与简介信息的加载的速度之间的差距，让这些小任务在线程池中执行，这样就大大降低了下载所有图片的时间，所以在这个时候可以认为这两个任务是同构的。使用CompletionService完成最合适不过了。

```java
package com.ddkk.patchwork.concurrency.r0410;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.concurrent.*;
/**
 * DDKK.COM 弟弟快看，程序员编程资料站 16-4-10.
 */
public class DisplayProductInfoWithCompletionService {
    //线程池
    private final ExecutorService executorService;
    //日期格式器
    private final DateFormat format = new SimpleDateFormat("HH:mm:ss");
    public DisplayProductInfoWithCompletionService(ExecutorService executorService) {
        this.executorService = executorService;
    }
    public void renderProductDetail() {
        final List<ProductInfo> productInfos = loadProductInfos();
        CompletionService<ProductImage> completionService = new ExecutorCompletionService<ProductImage>(executorService);
        //为每个图像的下载建立一个工作任务
        for (final ProductInfo info : productInfos) {
            completionService.submit(new Callable<ProductImage>() {
                @Override
                public ProductImage call() throws Exception {
                    return info.getImage();
                }
            });
        }
        //展示商品简介的信息
        renderProductText(productInfos);
        try {
            //显示商品图片
            for (int i = 0, n = productInfos.size(); i < n; i++){
                Future<ProductImage> imageFuture = completionService.take();
                ProductImage image = imageFuture.get();
                renderProductImage(image);
            }
        } catch (InterruptedException e) {
            // 如果显示图片发生中断异常则重新设置线程的中断状态
            // 这样做可以让wait中的线程唤醒
            Thread.currentThread().interrupt();
        } catch (ExecutionException e) {
            try {
                throw new Throwable(e.getCause());
            } catch (Throwable throwable) {
                throwable.printStackTrace();
            }
        }
    }
    private void renderProductImage(ProductImage image) {
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println(Thread.currentThread().getName() + " display products images! "
                + format.format(new Date()));
    }
    private void renderProductText(List<ProductInfo> productInfos) {
        for (ProductInfo info : productInfos) {
            try {
                Thread.sleep(50);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
        System.out.println(Thread.currentThread().getName() + " display products description! "
                + format.format(new Date()));
    }
    private List<ProductInfo> loadProductInfos() {
        List<ProductInfo> list = new ArrayList<>();
        try {
            TimeUnit.SECONDS.sleep(3);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        ProductInfo info = new ProductInfo();
        info.setImage(new ProductImage());
        list.add(info);
        System.out.println(Thread.currentThread().getName() + " load products info! "
                + format.format(new Date()));
        return list;
    }
    /**
     * 商品
     */
    private static class ProductInfo {
        private ProductImage image;
        public ProductImage getImage() {
            return image;
        }
        public void setImage(ProductImage image) {
            this.image = image;
        }
    }
    private static class ProductImage {
    }
    public static void main(String[] args) {
        DisplayProductInfoWithCompletionService cd = new DisplayProductInfoWithCompletionService(Executors.newCachedThreadPool());
        cd.renderProductDetail();
    }
}
```

执行结果与上面的一样。因为多个ExecutorCompletionService可以共享一个Executor，因此可以创建一个特定某个计算的私有的，又能共享公共的Executor的ExecutorCompletionService。

**CompletionService小结**

**1、** 相比ExecutorService，CompletionService可以更精确和简便地完成异步任务的执行；

**2、** CompletionService的一个实现是ExecutorCompletionService，它是Executor和BlockingQueue功能的融合体，Executor完成计算任务，BlockingQueue负责保存异步任务的执行结果；

**3、** 在执行大量相互独立和同构的任务时，可以使用CompletionService；

**4、** CompletionService可以为任务的执行设置时限，主要是通过BlockingQueue的poll(longtime,TimeUnitunit)为任务执行结果的取得限制时间，如果没有完成就取消任务；
