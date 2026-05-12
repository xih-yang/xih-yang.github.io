# 17、Java并发编程 - JUC同步器工具（CyclicBarrier、Exchanger、Phaser）
- 来源：https://ddkk.com/zhuanlan/java/concurrency/8/17.html
- 分类：Java并发
- 分组：教程目录
## 一、CyclicBarrier 篱栅

## 1.1 API介绍

> 官方案例略

> isBroken：判断是否有线程等待的过程中是否被中断了，如果有就等不到每个线程都到达Barrier点

CountDownLatch是一个倒数计数器，在计数器不为0时，所有调用await的线程都会等待，当计数器降为0，线程才会继续执行，且计数器一旦变为0，就不能再重置了。

CyclicBarrier可以认为是一个栅栏，栅栏的作用是什么？就是阻挡前行。

CyclicBarrier是一个可以循环使用的栅栏，它做的事情就是：让线程到达栅栏时被阻塞(调用await方法)，直到到达栅栏的线程数满足指定数量要求时，栅栏才会打开放行，被栅栏拦截的线程才可以执行。

当多个线程都达到了指定点后，才能继续往下继续执行。这就有点像报数的感觉，假设6个线程就相当于6个运动员，到赛道起点时会报数进行统计，如果刚好是6的话，这一波就凑齐了，才能往下执行。这里的6个线程，也就是计数器的初始值6，是通过CyclicBarrier的构造方法传入的。

CyclicBarrier的主要方法：

- **await() throws InterruptedException, BrokenBarrierException** 等到所有的线程都到达指定的临界点；
- **await(long timeout, TimeUnit unit) throws InterruptedException, BrokenBarrierException, TimeoutException** 与上面的await方法功能基本一致，只不过这里有超时限制，阻塞等待直至到达超时时间为止；
- **int getNumberWaiting()** 获取当前有多少个线程阻塞等待在临界点上；
- **boolean isBroken()** 用于查询阻塞等待的线程是否被中断
- **void reset()** 将屏障重置为初始状态。如果当前有线程正在临界点等待的话，将抛出BrokenBarrierException。

另外需要注意的是，CyclicBarrier提供了这样的构造方法：

```java
public CyclicBarrier(int parties, Runnable barrierAction)
```

可以用来，当指定的线程都到达了指定的临界点的时，接下来执行的操作可以由barrierAction传入即可。

## 1.2 案例演示

6个运动员准备跑步比赛，运动员在赛跑需要在起点做好准备，当裁判发现所有运动员准备完毕后，就举起发令枪，比赛开始。这里的起跑线就是屏障，是临界点，而这6个运动员就类比成线程的话，就是这6个线程都必须到达指定点了，意味着凑齐了一波，然后才能继续执行，否则每个线程都得阻塞等待，直至凑齐一波即可。

```java
public class CyclicBarrierTest {
    public static void main(String[] args) {
        int N = 6;  // 运动员数
        CyclicBarrier cb = new CyclicBarrier(N, new Runnable() {
            @Override
            public void run() {
                System.out.println("所有运动员已准备完毕，发令枪：跑！");
            }
        });
        for (int i = 0; i < N; i++) {
            Thread t = new Thread(new PrepareWork(cb), "运动员[" + i + "]");
            t.start();
        }
    }
    private static class PrepareWork implements Runnable {
        private CyclicBarrier cb;
        PrepareWork(CyclicBarrier cb) {
            this.cb = cb;
        }
        @Override
        public void run() {
            try {
                Thread.sleep(500);
                System.out.println(Thread.currentThread().getName() + ": 准备完成");
                cb.await();          // 在栅栏等待
                System.out.println(Thread.currentThread().getName() + ": GO");
            } catch (InterruptedException e) {
                e.printStackTrace();
            } catch (BrokenBarrierException e) {
                e.printStackTrace();
            }
        }
    }
}
```

从输出结果可以看出，当6个运动员（线程）都到达了指定的临界点（barrier）时候，才能继续往下执行，否则，则会阻塞等待在调用 await() 处。

## 1.3 CyclicBarrier对异常的处理

线程在阻塞过程中，可能被中断，那么既然CyclicBarrier放行的条件是等待的线程数达到指定数目，万一线程被中断导致最终的等待线程数达不到栅栏的要求怎么办？

```java
public int await() throws InterruptedException, BrokenBarrierException {
	//...
}
```

可以看到，这个方法除了抛出InterruptedException异常外，还会抛出`BrokenBarrierException` 。

BrokenBarrierException表示当前的CyclicBarrier已经损坏了，等不到所有线程都到达栅栏了，所以已经在等待的线程也没必要再等了，可以散伙了。

出现以下几种情况之一时，当前等待线程会抛出BrokenBarrierException异常：

- 其它某个正在await等待的线程被中断了；
- 其它某个正在await等待的线程超时了；
- 某个线程重置了CyclicBarrier；

另外，只要正在Barrier上等待的任一线程抛出了异常，那么Barrier就会认为肯定是凑不齐所有线程了，就会将栅栏置为损坏（Broken）状态，并传播BrokenBarrierException给其它所有正在等待（await）的线程。

异常情况模拟：

```java
public class CyclicBarrierTest2 {
    public static void main(String[] args) throws InterruptedException {
        int N = 6;  // 运动员数
        CyclicBarrier cb = new CyclicBarrier(N, new Runnable() {
            @Override
            public void run() {
                System.out.println("所有运动员已准备完毕，发令枪：跑！");
            }
        });
        List<Thread> list = new ArrayList<>();
        for (int i = 0; i < N; i++) {
            Thread t = new Thread(new PrepareWork(cb), "运动员[" + i + "]");
            list.add(t);
            t.start();
            if (i == 3) {
                t.interrupt();  // 运动员[3]置中断标志位
            }
        }
        Thread.sleep(2000);
        System.out.println("Barrier是否损坏：" + cb.isBroken());
    }
    private static class PrepareWork implements Runnable {
        private CyclicBarrier cb;
        PrepareWork(CyclicBarrier cb) {
            this.cb = cb;
        }
        @Override
        public void run() {
            try {
                System.out.println(Thread.currentThread().getName() + ": 准备完成");
                cb.await();
            } catch (InterruptedException e) {
                System.out.println(Thread.currentThread().getName() + ": 被中断");
            } catch (BrokenBarrierException e) {
                System.out.println(Thread.currentThread().getName() + ": 抛出BrokenBarrierException");
            }
        }
    }
}
```

## 1.4 CountDownLatch与CyclicBarrier的比较

CountDownLatch与CyclicBarrier都是用于控制并发的工具类，都可以理解成维护的就是一个计数器，但是这两者还是各有不同侧重点的：

- CountDownLatch一般用于某个线程A等待若干个其他线程执行完任务之后，它才执行；而CyclicBarrier一般用于一组线程互相等待至某个状态，然后这一组线程再同时执行；CountDownLatch强调一个线程等多个线程完成某件事情。CyclicBarrier是多个线程互等，等大家都完成，再携手共进。
- 调用CountDownLatch的countDown方法后，当前线程并不会阻塞，会继续往下执行；而调用CyclicBarrier的await方法，会阻塞当前线程，直到CyclicBarrier指定的线程全部都到达了指定点的时候，才能继续往下执行；
- CountDownLatch方法比较少，操作比较简单，而CyclicBarrier提供的方法更多，比如能够通过getNumberWaiting()，isBroken()这些方法获取当前多个线程的状态，并且CyclicBarrier的构造方法可以传入barrierAction，指定当所有线程都到达时执行的业务功能；
- CountDownLatch是不能复用的，而CyclicLatch是可以复用的。

## 二、Exchanger 交换器

## 2.1 API介绍

Exchanger可以用来在两个线程之间交换持有的对象。当Exchanger在一个线程中调用exchange方法之后，会等待另外的线程调用同样的exchange方法，两个线程都调用exchange方法之后，传入的参数就会交换。

**两个主要方法**

- public V exchange(V x) throws InterruptedException

当这个方法被调用的时候，当前线程将会等待直到其他的线程调用同样的方法。当其他的线程调用exchange之后，当前线程将会继续执行。

在等待过程中，如果有其他的线程interrupt当前线程，则会抛出InterruptedException。

- public V exchange(V x, long timeout, TimeUnit unit) throws InterruptedException, TimeoutException

多了一个timeout时间。如果在timeout时间之内没有其他线程调用exchange方法，抛出TimeoutException。

## 2.2 案例演示

我们先定义一个带交换的类：

然后定义两个Runnable，在run方法中调用exchange方法

```java
public class ExchangerTest {
    public static void main(String[] args) {
        Exchanger<CustBook> exchanger = new Exchanger<>();
        // Starting two threads
        new Thread(new ExchangerOne(exchanger)).start();
        new Thread(new ExchangerTwo(exchanger)).start();
    }
}
class CustBook {
    private String name;
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
}
class ExchangerOne implements Runnable{
    Exchanger<CustBook> ex;
    ExchangerOne(Exchanger<CustBook> ex){
        this.ex=ex;
    }
    @Override
    public void run() {
        CustBook custBook= new CustBook();
        custBook.setName("book one");
        try {
            CustBook exhangeCustBook=ex.exchange(custBook);
            System.out.println("ExchangerOne: "+exhangeCustBook.getName());
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
class ExchangerTwo implements Runnable{
    Exchanger<CustBook> ex;
    ExchangerTwo(Exchanger<CustBook> ex){
        this.ex=ex;
    }
    @Override
    public void run() {
        CustBook custBook= new CustBook();
        custBook.setName("book two");
        try {
            CustBook exhangeCustBook=ex.exchange(custBook);
            System.out.println("ExchangerTwo: "+exhangeCustBook.getName());
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
```

## 三、Phaser 相位器

## 3.1 API介绍

Phaser是一个同步工具类，适用于一些需要分阶段的任务的处理。它的功能与 CyclicBarrier和CountDownLatch类似，类似于一个多阶段的栅栏，并且功能更强大，我们来比较下这三者的功能：

同步工具类
功能

CountDownLatch
倒数计数器，初始时设定计数器值，线程可以在计数器上等待，当计数器值归0后，所有等待的线程继续执行

CyclicBarrier
循环栅栏，初始时设定参与线程数，当线程到达栅栏后，会等待其它线程的到达，当到达栅栏的总数满足指定数后，所有等待的线程继续执行

Phaser
多阶段栅栏，可以在初始时设定参与线程数，也可以中途注册/注销参与者，当到达的参与者数量满足栅栏设定的数量后，会进行阶段升级（advance）

> CyclicBarrier是一个循环栅栏，每次拦截数量已经在构造的时候确定了
>
> 而Phaser是多阶段栅栏，每一个阶段的拦截等待数量可以动态修改

登记。与其他障碍的情况不同，在phaser上同步注册的各方的数目可能随时间而变化。任务可以在任何时候注册(使用register()、bulkRegister(int)方法，或建立初始参与方数量的构造函数形式)，也可以在任何到达时撤销注册(使用arriveandderregister())。与大多数基本同步结构一样，注册和注销只影响内部计数;它们不建立任何进一步的内部簿记，因此任务不能查询它们是否已注册。(然而，您可以通过子类化这个类来引入这样的簿记。)

同步。就像CyclicBarrier一样，Phaser可以被反复等待。方法arriveAndAwaitAdvance()的作用类似于CyclicBarrier.await。Phaser的每一阶段具有相关联的相位数。相位数从零开始，当所有各方到达phaser时向前推进，在达到Integer.MAX_VALUE后绕到零。相位数的使用使独立控制的行动到达phaser然后等待其他人，通过两种方法，可以调用任何注册方:

到达。`方法arrive()和arriveandderregister()记录到达。这些方法不会阻塞，而是返回一个相关联的到达阶段号`;也就是说，到达所应用的phaser的相位数。当给定阶段的最后一方到达时，将执行一个可选操作并推进阶段。这些操作由触发相位推进的一方执行，并通过覆盖方法onAdvance(int, int)进行安排，该方法也控制终止。覆盖这个方法与为CyclicBarrier提供barrier操作类似，但比它更灵活。（类似监听器，异步的方式）

等待。方法awaitAdvance(int)需要一个参数来指示到达阶段号，当phaser前进到(或已经在)一个不同的阶段时返回。与使用CyclicBarrier的类似结构不同，`方法awaitAdvance即使正在等待的线程被中断，也会继续等待。`也有可中断和超时版本，但是在任务以可中断或超时等待时遇到的异常不会改变phaser的状态。如果有必要，您可以在这些异常的处理程序中执行任何相关的恢复，通常是在调用forceterminate之后。Phasers也可以被在ForkJoinPool中执行的任务使用，这将确保当其他任务阻塞等待一个阶段前进时，有足够的并行性来执行任务。

终止。phaser可以进入终止状态，该状态可以使用istterminate()方法进行检查。在终止时，所有同步方法立即返回，而不等待推进，这由一个负返回值表示。同样，在终止时尝试注册也没有效果。当调用onAdvance返回true时触发终止。如果撤销注册导致已注册方的数量变为零，则默认实现返回true。如下所示，当相位器控制动作迭代次数固定，它通常是方便的覆盖这个方法导致终止，当当前相位数达到一个阈值。方法forceterminate()也可用于突然释放等待的线程并允许它们终止。

分层。Phasers可以分层(即树形结构)以减少争用。具有大量参与方的Phasers，可以建立一组子相位器共享一个共同的父级，否则将经历沉重的同步争用成本。这可能会大大增加吞吐量，尽管它会带来更大的per-operation开销。

在分层的phasers树中，注册和注销的孩子相位器与他们的父母自动管理。当子相位器的注册方数变为非零时(正如在phaser (phaser,int)构造函数、register()或bulkRegister(int)中所建立的那样)，子相位器就向它的父节点注册。每当调用arriveandderregister()后注册的参与方的数量变为零时，子phaser就会从它的父进程中取消注册。

监控。虽然同步方法只能由注册方调用，但phaser的当前状态可以由任何调用方监视。在任何给定时刻，总共有getRegisteredParties()缔约方，其中getArrivedParties()已经到达当前阶段(getPhase())。当其余的(getUnarrivedParties())方到达时，该阶段继续进行。这些方法返回的值可能反映瞬时状态，因此通常对同步控制没有用处。方法toString()以方便非正式监视的形式返回这些状态查询的快照。

## 3.2 相关概念：

**phase(阶段)**

Phaser也有栅栏，在Phaser中，栅栏的名称叫做phase(阶段)，在任意时间点，Phaser只处于某一个phase(阶段)，初始阶段为0，最大达到Integerr.MAX_VALUE，然后再次归零。当所有parties参与者都到达后，phase值会递增。

**parties(参与者)**

Phaser既可以在初始构造时指定参与者的数量，也可以中途通过register、bulkRegister、arriveAndDeregister等方法注册/注销参与者。

**arrive(到达) / advance(进阶)**

Phaser注册完parties（参与者）之后，参与者的初始状态是unarrived的，当参与者到达（arrive）当前阶段（phase）后，状态就会变成arrived。当阶段的到达参与者数满足条件后（注册的数量等于到达的数量），阶段就会发生进阶（advance）——也就是phase值+1。

**Termination（终止）**

代表当前Phaser对象达到终止状态。

**Tiering（分层）**

Phaser支持分层（Tiering） —— 一种树形结构，通过构造函数可以指定当前待构造的Phaser对象的父结点。之所以引入Tiering，是因为当一个Phaser有大量参与者（parties）的时候，内部的同步操作会使性能急剧下降，而分层可以降低竞争，从而减小因同步导致的额外开销。

在一个分层Phasers的树结构中，注册和撤销子Phaser或父Phaser是自动被管理的。当一个Phaser参与者（parties）数量变成0时，如果有该Phaser有父结点，就会将它从父结点中溢移除。

## 3.3 核心方法

**arriveAndDeregister()** 该方法立即返回下一阶段的序号，并且其它线程需要等待的个数减一， 取消自己的注册、把当前线程从之后需要等待的成员中移除。 如果该Phaser是另外一个Phaser的子Phaser（层次化Phaser）， 并且该操作导致当前Phaser的成员数为0，则该操作也会将当前Phaser从其父Phaser中移除。

**arrive()** 某个参与者完成任务后调用，该方法不作任何等待，直接返回下一阶段的序号。

**awaitAdvance(int phase)** 该方法等待某一阶段执行完毕。

如果当前阶段不等于指定的阶段或者该Phaser已经被终止，则立即返回。

该阶段数一般由arrive()方法或者arriveAndDeregister()方法返回。

返回下一阶段的序号，或者返回参数指定的值（如果该参数为负数），或者直接返回当前阶段序号（如果当前Phaser已经被终止）。

**awaitAdvanceInterruptibly(int phase)** 效果与awaitAdvance(int phase)相当，唯一的不同在于若该线程在该方法等待时被中断，则该方法抛出InterruptedException。

**awaitAdvanceInterruptibly(int phase, long timeout, TimeUnit unit)** 效果与awaitAdvanceInterruptibly(int phase)相当，区别在于如果超时则抛出TimeoutException。

**bulkRegister(int parties)** 动态调整注册任务parties的数量。如果当前phaser已经被终止，则该方法无效，并返回负数。

如果调用该方法时，onAdvance方法正在执行，则该方法等待其执行完毕。

如果该Phaser有父Phaser则指定的party数大于0，且之前该Phaser的party数为0，那么该Phaser会被注册到其父Phaser中。

**forceTermination()** 强制让该Phaser进入终止状态。

已经注册的party数不受影响。如果该Phaser有子Phaser，则其所有的子Phaser均进入终止状态。

如果该Phaser已经处于终止状态，该方法调用不造成任何影响。

## 3.4 案例演示

例子：3个线程，4个阶段，每个阶段都并发处理

```java
public class PhaserTest {
    public static void main(String[] args) {
        int parties = 3;
        int phases = 4;
        final Phaser phaser = new Phaser(parties) {
            @Override
            //每个阶段结束时
            protected boolean onAdvance(int phase, int registeredParties) {
                System.out.println("====== Phase : " + phase + "  end ======");
                return registeredParties == 0;
            }
        };
        for (int i = 0; i < parties; i++) {
            int threadId = i;
            Thread thread = new Thread(() -> {
                for (int phase = 0; phase < phases; phase++) {
                    if (phase == 0) {
                        System.out.println(String.format("第一阶段操作  Thread %s, phase %s", threadId, phase));
                    }
                    if (phase == 1) {
                        System.out.println(String.format("第二阶段操作  Thread %s, phase %s", threadId, phase));
                    }
                    if (phase == 2) {
                        System.out.println(String.format("第三阶段操作  Thread %s, phase %s", threadId, phase));
                    }
                    if (phase == 3) {
                        System.out.println(String.format("第四阶段操作  Thread %s, phase %s", threadId, phase));
                    }
                    /**
                     * arriveAndAwaitAdvance() 当前线程当前阶段执行完毕，等待其它线程完成当前阶段。
                     * 如果当前线程是该阶段最后一个未到达的，则该方法直接返回下一个阶段的序号（阶段序号从0开始），
                     * 同时其它线程的该方法也返回下一个阶段的序号。
                     **/
                    int nextPhaser = phaser.arriveAndAwaitAdvance();
                }
            });
            thread.start();
        }
    }
}
```
