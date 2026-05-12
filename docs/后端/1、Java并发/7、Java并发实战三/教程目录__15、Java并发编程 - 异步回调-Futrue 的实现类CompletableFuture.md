# 15、Java并发编程 - 异步回调:Futrue 的实现类CompletableFuture
- 来源：https://ddkk.com/zhuanlan/java/concurrency/7/15.html
- 分类：Java并发
- 分组：教程目录
## 15、异步回调:Futrue 的实现类CompletableFuture

Futrue 设计初衷： 对将来会发生的结果进行建模~

程序的性能要高，要异步处理！同步并阻塞！

A线程做完了返回一个结果告诉main我做完了！

Futrue就相当于ajax。

> 实例：CompletableFuture无返回结果情况测试

```java
package com.interview.concurrent.completablefuture;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述
 * CompletableFuture 异步回调, 对将来的结果进行结果，ajax就是一种异步回调！
 * @date 2023/2/24 21:32
 */
public class CompletableFutureDemo {
    public static void main(String[] args) throws Exception {
        // 多线程也可以异步回调
        voidCompletableFuture();
    }
    /**
     *  @description: CompletableFuture 的 runAsync方法，没有返回结果,任务执行完了就完毕了
     *  适用场景：插入数据，修改数据
     *  @author DDKK.COM 弟弟快看，程序员编程资料站
     *  @date 2023/2/24 21:59
     */
    public static void voidCompletableFuture() throws ExecutionException, InterruptedException {
        CompletableFuture<Void> voidFuture = CompletableFuture.runAsync(() -> {
            System.out.println(Thread.currentThread().getName() + ":没有返回结果");
        });
        System.out.println(voidFuture.get()); //null
    }
}
```

运行结果如下：

> 实例：CompletableFuture有返回结果情况测试

程序正常运行情况

```java
package com.interview.concurrent.completablefuture;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述
 * CompletableFuture 异步回调, 对将来的结果进行结果，ajax就是一种异步回调！
 * @date 2023/2/24 21:32
 */
public class CompletableFutureDemo {
    public static void main(String[] args) throws Exception {
        // 多线程也可以异步回调
       returnCompletableFuture();
    }
    /**
     *  @description:有返回结果 ,功能像ajax。 成功或者失败！
     *  适用场景：
     *  可异步执行的任务，并且这个任务要求有返回结果！
     *  @author DDKK.COM 弟弟快看，程序员编程资料站
     *  @date 2023/2/24 22:01
     */
    public static void returnCompletableFuture() throws ExecutionException, InterruptedException {
        CompletableFuture<Integer> integerCompletableFuture = CompletableFuture.supplyAsync(() -> {
            System.out.println(Thread.currentThread().getName() + "有返回结果");
            Integer result = 1024;
            return result;
        });
        System.out.println(integerCompletableFuture.whenComplete((ok, error) -> {
            System.out.println("===ok===" + ok); // 正常结果
            System.out.println("===error===" + error); // 错误结果
        }).exceptionally(e -> {
     // 异常！
            System.out.println("getMessage=>" + e.getMessage());
            return 555; // 异常返回结果
        }).get());
    }
}
```

程序运行结果如下：

设置程序异常情况：

```java
package com.interview.concurrent.completablefuture;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
/**
* @author DDKK.COM 弟弟快看，程序员编程资料站
* @description 描述
* CompletableFuture 异步回调, 对将来的结果进行结果，ajax就是一种异步回调！
* @date 2023/2/24 21:32
*/
public class CompletableFutureDemo {
   public static void main(String[] args) throws Exception {
       // 多线程也可以异步回调
      returnCompletableFuture();
   }
   /**
    *  @description:有返回结果 ,功能像ajax。 成功或者失败！
    *  适用场景：
    *  可异步执行的任务，并且这个任务要求有返回结果！
    *  @author DDKK.COM 弟弟快看，程序员编程资料站
    *  @date 2023/2/24 22:01
    */
   public static void returnCompletableFuture() throws ExecutionException, InterruptedException {
       CompletableFuture<Integer> integerCompletableFuture = CompletableFuture.supplyAsync(() -> {
           System.out.println(Thread.currentThread().getName() + "有返回结果");
           int i = 10/0; //设置一个异常
           Integer result = 1024;
           return result;
       });
       System.out.println(integerCompletableFuture.whenComplete((ok, error) -> {
           System.out.println("===ok===" + ok); // 正常结果
           System.out.println("===error===" + error); // 错误结果
       }).exceptionally(e -> {
     // 异常！
           System.out.println("getMessage=>" + e.getMessage());
           return 555; // 异常返回结果
       }).get());
   }
}
```

程序运行结果如下：
