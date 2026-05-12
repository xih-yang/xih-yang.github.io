# 29、Java并发编程：非阻塞算法（非阻塞并发数据结构、比较交换、乐观锁、共享意向修改、ABA问题、非阻塞算法模板）
- 来源：https://ddkk.com/zhuanlan/java/concurrency/5/29.html
- 分类：Java并发
- 分组：教程目录
并发中所谓的非阻塞算法是允许线程访问共享状态（或以其他方式进行协作或通信）而不会阻塞所涉及线程的算法。 更笼统地说，如果一个线程的挂起不会导致该算法中涉及的其他线程挂起，则该算法称为非阻塞算法。

为了更好地理解阻塞和非阻塞并发算法之间的区别，我将首先说明阻塞算法，接着再说明非阻塞算法。

## 阻塞并发算法

符合下面两条之一的算法称为阻塞并发算法：

- A： 执行线程请求的操作
- B： 阻塞线程，直到可以安全地执行该操作

许多类型的算法和并发数据结构都是阻塞的。例如java.util.concurrent.BlockingQueue接口都是阻塞数据结构。如果线程试图将元素插入到BlockingQueue中，而队列没有空间，则插入线程将被阻塞（挂起），直到BlockingQueue有空间容纳新元素。

此图说明了保护共享数据结构的阻塞算法的行为：

## 非阻塞并发算法

符合下面两条之一的算法称为非阻塞算法：

- A： 执行线程请求的操作
- B： 通知请求线程无法执行该操作

Java也包含一些非阻塞数据结构。AtomicBoolean、AtomicInteger、AtomicLong和AtomicReference都是非阻塞数据结构的示例。

此图说明了保护共享数据结构的非阻塞算法的行为：

## 非阻塞算法与阻塞算法对比

阻塞算法和非阻塞算法的主要区别在于其行为的第二步，如前两部分所述。换言之，区别在于当请求的操作无法执行时，阻塞和非阻塞算法的做法：

阻塞算法阻塞线程，直到请求的操作可以执行为止。非阻塞算法通知请求操作的线程无法执行该操作。

使用阻塞算法，线程可能会被阻塞，直到可以执行请求的操作为止。通常是另一个线程的操作使第一个线程能够执行请求的操作。如果由于某种原因，另一个线程在应用程序中的其他地方挂起（阻塞），因此无法使第一个线程的请求操作可以执行，则第一个线程将保持阻塞状态—或者无限期地阻塞，或者直到另一个线程最终执行必要的操作。

例如，如果一个线程试图在一个满的BlockingQueue中插入一个元素，那么该线程将阻塞，直到另一个线程从BlockingQueue中取出一个元素。如果由于某种原因，本应从BlockingQueue获取元素的线程在应用程序中的其他地方被阻塞（挂起），则尝试插入新元素的线程将保持阻塞状态—或者无限期地阻塞，或者直到线程最终从BlockingQueue中获取到一个元素。

## 非阻塞并发数据结构

在多线程系统中，线程通常通过某种数据结构进行通信。这样的数据结构可以是任何东西，从简单的变量到更高级的数据结构，如队列、表、栈等。为了便于通过多个线程对数据结构进行正确、并发的访问，必须使用某种并发算法来保护数据结构。保护算法使数据结构成为并发数据结构。

如果保护并发数据结构的算法是阻塞的（使用线程挂起），则称为阻塞算法。因此，数据结构被称为一个阻塞的、并发的数据结构。

如果保护并发数据结构的算法是非阻塞的，则称为非阻塞算法。因此，该数据结构被称为非阻塞、并发的数据结构。

每个并发数据结构都是为了支持某种通信方法而设计的。因此，使用哪种并发数据结构取决于通信需求。我将在下面几节讨论一些非阻塞并发数据结构，并解释在什么情况下可以使用它们。通过解释这些非阻塞数据结构的工作方式，可以让你了解如何设计和实现非阻塞数据结构。

## Volatile变量

Java Volatile变量是始终直接从主内存读取的变量。当一个新值被分配给一个Volatile变量时，该值总是立即写入主内存。这保证了volatile变量的最新值对运行在其他cpu上的线程始终可见。其他线程每次都会从主内存读取volatile的值，而不是从线程运行的CPU缓存中读取。

Volatile变量是非阻塞的。将值写入Volatile变量是一个原子操作。它不能被打断。但是，对Volatile变量执行的读-更新-写入序列不是原子的。因此，如果由多个线程执行，此代码仍可能导致竞态条件：

```java
volatile myVar = 0;
...
int temp = myVar;
temp++;
myVar = temp;
```

首先，将Volatile变量myVar的值从主内存读入一个temp 变量。然后temp变量递增1。然后temp变量的值赋值给volatile myVar变量，这意味着它将被写回主内存。

如果两个线程执行此代码，并且两个线程都读取myVar的值，加1并将该值写回主内存，那么将面临这样的风险：没有将myVar变量加2，而是只加1（例如，两个线程都读取值19，增加为20，然后写回20）。

你可能会认为你不会像上面这样编写代码，但实际上，上面的代码相当于如下代码：

```java
myVar++;
```

执行时，myVar的值被读入CPU寄存器或本地CPU缓存中，加1，然后值从CPU寄存器或CPU高速缓存中写回主内存。

### 只有单个写线程的情况

在某些情况下，只有一个线程写入共享变量，而多个线程读取该变量的值。当只有一个线程在更新一个变量时，无论有多少线程正在读取它，都不会发生竞态条件。因此，只要共享变量只有一个线程会写，就可以使用volatile变量。

当多个线程对一个共享变量执行读-更新-写操作序列时，会出现竞态条件。如果只有一个线程执行读更新写操作序列，而所有其他线程只执行读操作，则没有竞态条件。

以下是一个只有单个写入线程的计数器，没有使用同步但仍然是并发的：

```java
public class SingleWriterCounter {
    private volatile long count = 0;
    /**
     * Only one thread may ever call this method,
     * or it will lead to race conditions.
     */
    public void inc() {
        this.count++;
    }
    /**
     * Many reading threads may call this method
     * @return
     */
    public long count() {
        return this.count;
    }
}
```

多个线程可以访问此计数器的同一个实例，只要只有一个线程调用inc（）。我不是说同一时刻一个线程。我的意思是，只有同一个线程才允许调用inc（）。多个线程可以调用count（）。这不会造成任何竞态条件。

下图说明线程将如何访问Volatile count变量：

### 基于Volatile变量的更高级数据结构

可以创建使用Volatile变量组合的数据结构，其中每个Volatile变量只由一个线程写入，并由多个线程读取。每个Volatile变量可以由不同的线程（但只能由一个线程）写入。使用这种数据结构，多个线程可以使用volatile变量以非阻塞的方式相互发送信息。

下面是一个简单的两个写线程计数器类，它展示了该做法：

```java
public class DoubleWriterCounter {
    private volatile long countA = 0;
    private volatile long countB = 0;
    /**
     * Only one (and the same from thereon) thread may ever call this method,
     * or it will lead to race conditions.
     */
    public void incA() { this.countA++;  }
    /**
     * Only one (and the same from thereon) thread may ever call this method,
     * or it will lead to race conditions.
     */
    public void incB() { this.countB++;  }
    /**
     * Many reading threads may call this method
     */
    public long countA() { return this.countA; }
    /**
     * Many reading threads may call this method
     */
    public long countB() { return this.countB; }
}
```

如你所见，DoubleWriterCounter现在包含两个Volatile变量，以及两对增量和读取方法。只有一个线程可以调用incA（），只有一个线程可以调用incB（）。调用incA（）和incB（）的线程可以不同。多个线程调用countA（）和countB（）是允许的。这不会造成竞态条件。

DoubleWriterCounter可用于例如两个线程通信。这两个计数可以是产生的任务和消耗的任务。此图显示了两个线程通过与上述类似的数据结构进行通信：

聪明的读者会发现，可以通过使用两个SingleWriterCounter实例来达到DoubleWriterCounter的效果。如果需要的话，你甚至可以使用更多的线程和SingleWriterCounter实例。

## 使用比较交换的乐观锁

如果确实需要多个线程来写入同一个共享变量，那么Volatile变量是不够的。你需要对变量进行某种独占访问。使用Java中的同步块可以实现独占访问：

```java
public class SynchronizedCounter {
    long count = 0;
    public void inc() {
        synchronized(this) {
            count++;
        }
    }
    public long count() {
        synchronized(this) {
            return this.count;
        }
    }
}
```

注意inc（）和count（）方法都包含一个同步块。这正是我们想要避免的——同步块和wait（）、notify（）调用等。

我们可以使用Java的一个原子变量来代替这两个同步块。在这个例子中是AtomicLong。下面是使用AtomicLong替换该计数器类的方式：

```java
import java.util.concurrent.atomic.AtomicLong;
public class AtomicCounter {
    private AtomicLong count = new AtomicLong(0);
    public void inc() {
        boolean updated = false;
        while(!updated){
            long prevCount = this.count.get();
            updated = this.count.compareAndSet(prevCount, prevCount + 1);
        }
    }
    public long count() {
        return this.count.get();
    }
}
```

这个版本和以前的版本一样是线程安全的。这个版本的有趣之处在于inc（）方法的实现。inc（）方法不再包含同步块。相反，它包含以下行：

```java
boolean updated = false;
while(!updated){
    long prevCount = this.count.get();
    updated = this.count.compareAndSet(prevCount, prevCount + 1);
}
```

这段代码不是原子操作。这意味着，两个不同的线程可以调用inc（）方法并执行long prevCount = this.count.get()语句，因此两者都获得计数器的前一个计数。但是，上面的代码不包含任何竞态条件。

秘密就在while循环中的第二行。compareAndSet（）方法是一个原子操作。它将AtomicLong的内部值与预期值进行比较，如果这两个值相等，则为AtomicLong设置一个新的内部值。compareAndSet（）方法通常由CPU中的比较交换指令直接支持。因此，不需要同步，也不需要线程挂起。这样可以节省线程挂起开销。

假设AtomicLong的内部值是20。然后两个线程读取该值，并尝试调用compareAndSet（20，20+1）。由于compareAndSet（）是一个原子操作，所以线程将按顺序执行此方法（一次执行一个）。

第一个线程将比较预期值20（计数器的前一个值）与AtomicLong的内部值。由于这两个值相等，AtomicLong会将其内部值更新为21（20+1）。updated变量将被设置为true，while循环将停止。

现在第二个线程调用compareAndSet（20，20+1）。由于AtomicLong的内部值不再为20，因此此调用将失败。AtomicLong的内部值不会设置为21。updated变量将被设置为false，线程将在while循环中再旋转一次。这次它将读取值21并尝试将其更新为22。如果在此期间没有其他线程调用inc（），则第二次迭代将成功地将AtomicLong更新为22。

### 为什么称为乐观锁

上一节中展示的代码称为乐观锁。乐观锁不同于传统锁——有时也称为悲观锁。传统锁用同步块或某种锁来阻止对共享内存的访问。同步块或锁可能导致线程挂起。

乐观锁允许所有线程在不阻塞的情况下创建共享内存的副本。然后，线程可以对其副本进行修改，并尝试将修改后的版本写回共享内存中。如果没有其他线程对共享内存进行任何修改，则比较交换操作允许线程将其更改写入共享内存。如果另一个线程已经更改了共享内存，则该线程将必须获得一个新的副本，进行更改并尝试再次将它们写入共享内存。

之所以称之为乐观锁，是因为线程获取它们想要更改的数据的副本并应用它们的更改，乐观的假设没有其他线程同时对共享内存进行更改。当这个乐观的假设成立时，线程则在没有锁定的情况下成功地更新了共享内存。如果这个假设是错误的，虽然这项工作白费了，但是仍然没有应用锁定。

乐观锁在共享内存上的低到中等争用情况下往往效果最好。如果共享内存上的争用非常高，那么线程将浪费大量的CPU周期来复制和修改共享内存，结果却无法将更改写回共享内存。但是，如果共享内存争用的很厉害，那么无论如何都应该考虑重新设计代码以降低争用。

### 乐观锁是非阻塞的

我在这里展示的乐观锁机制是非阻塞的。如果一个线程获得了共享内存的副本，并且在试图修改它时被阻塞（无论出于什么原因），不会阻止其他线程访问共享内存。

在传统的锁/解锁范例中，当一个线程锁定一个锁时，该锁对于所有其他线程都保持锁定，直到拥有该锁的线程再次解锁它为止。如果锁定锁的线程在其他地方被阻塞，那么该锁将在很长一段时间内保持锁定，甚至可以永久锁定。

## 不可交换的数据结构

简单的比较交换乐观锁适用于共享数据结构，其中整个数据结构可以在单个比较交换操作中与新的数据结构交换。不过，用修改过的副本交换整个数据结构并非总是可行的。

假设共享数据结构是一个队列。每个试图从队列中插入或获取元素的线程都必须复制整个队列并对副本进行所需的修改。这可以通过AtomicReference来实现。先复制引用，然后复制并修改队列，并尝试将AtomicReference中指向的引用交换到新创建的队列。

然而，大的数据结构可能需要大量内存和CPU周期才能进行复制。这使应用程序花费更多的内存，并在复制上浪费大量时间。这将影响应用程序的性能，尤其是在数据结构争用激烈的情况下。此外，一个线程复制和修改数据结构所需的时间越长，其他线程修改数据结构的概率就越大。如你所知，如果另一个线程在复制共享数据结构后修改了它，那么所有其他线程都必须重新开始它们的复制修改操作。这将进一步增加对性能和内存消耗的影响。

下一节将阐述一种实现非阻塞数据结构的方法，这种结构可以并发地更新，而不仅仅是复制和修改。

## 共享意向修改（Sharing Intended Modifications）

线程可以共享它对共享数据结构的意向修改，而不是复制和修改整个共享数据结构。一个线程想要修改共享数据结构的过程就变成了：

- 检查另一个线程是否提交了对数据结构的意向修改。
- 如果没有其他线程提交意向修改，则创建一个意向修改（用对象表示），并将该意向修改提交给数据结构（使用比较交换操作）。
- 对共享数据结构进行修改。
- 删除意向修改的引用，以向其他线程发出已执行意向修改的信号。

如你所见，第二步可以阻止其他线程提交修改。因此，第二步实际上相当于共享数据结构的锁。如果一个线程成功地提交了意向修改，那么在执行第一个意向修改之前，其他线程都不能提交意向修改。

如果一个线程提交了一个意向修改，然后在执行其他工作时被阻塞，那么共享数据结构实际上被锁定。共享数据结构不会直接阻止使用该数据结构的其他线程。其他线程可以检测到它们无法提交意向修改并决定执行其他操作。显然，我们需要解决这个问题。

## 可完成的意向修改（Completable Intended Modifications）

为了避免提交的意向修改会锁定共享数据结构，提交的意向修改对象必须包含足够的信息，以便其他线程完成修改。因此，如果提交意向修改的线程无法完成修改，则另一个线程可以代表它完成修改，并保持共享数据结构可供其他线程使用。

下图说明了上述非阻塞算法的蓝图：

修改必须作为一个或多个比较交换操作执行。因此，如果两个线程试图完成意向修改，那么只有一个线程能够执行任何比较交换操作。一旦比较交换操作完成，进一步尝试完成该比较交换操作将失败。

## A-B-A问题

上述算法可能会遇到A-B-A问题。A-B-A问题是指变量从A变为B，然后再变回A的情况。对于另一个线程，也就不可能检测到变量确实发生了更改。

如果线程A检查正在进行的更新，复制数据并被线程调度程序挂起，则线程B可能同时能够访问共享数据结构。如果线程B执行数据结构的完全更新，并删除其意向修改，那么从线程a来看，自它复制数据结构以来没有发生任何修改。但是，修改确实发生了。当线程A继续基于其数据结构的过期副本执行更新时，数据结构中线程B的修改会被撤销。

下图说明了上述情况下的A-B-A问题：

### A-B-A问题的对策

A-B-A问题的一个常见对策是不仅仅交换指向意向修改对象的指针，而是将指针与计数器组合，并使用单个比较交换操作交换指针和计数器。在诸如C和C++这种支持指针的语言中，这是可能的。因此，即使当前修改指针被设置回指向“没有正在进行的修改”，指针+计数器中的计数器部分也将增加，使更新对其他线程可见。

在Java中，不能将引用和计数器合并到一个变量中。作为替代，Java提供了AtomicStampedReference类，该类可以使用比较交换操作以原子方式交换引用和计数器。

## 非阻塞算法模板

下面是一个代码模板，旨在让你了解如何实现非阻塞算法。该模板基于本教程前面给出的描述。

注意：我不是非阻塞算法的专家，所以下面的模板可能有一些错误。不要基于我的模板实现自己的非阻塞算法。该模板只是为了让你了解非阻塞算法的代码是怎样的。如果你想实现自己的非阻塞算法，请首先研究一些实际的、有效的非阻塞算法实现，以了解它们在实践中是如何实现的。

```java
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicStampedReference;
public class NonblockingTemplate {
    public static class IntendedModification {
        public AtomicBoolean completed =
                new AtomicBoolean(false);
    }
    private AtomicStampedReference<IntendedModification>
        ongoingMod =
            new AtomicStampedReference<IntendedModification>(null, 0);
    //declare the state of the data structure here.
    public void modify() {
        while(!attemptModifyASR());
    }
    public boolean attemptModifyASR(){
        boolean modified = false;
        IntendedModification currentlyOngoingMod =
        ongoingMod.getReference();
        int stamp = ongoingMod.getStamp();
        if(currentlyOngoingMod == null){
            //copy data structure state - for use
            //in intended modification
            //prepare intended modification
            IntendedModification newMod =
            new IntendedModification();
            boolean modSubmitted = 
                ongoingMod.compareAndSet(null, newMod, stamp, stamp + 1);
            if(modSubmitted){
                //complete modification via a series of compare-and-swap operations.
                //note: other threads may assist in completing the compare-and-swap
                // operations, so some CAS may fail
                modified = true;
            }
        } else {
            //attempt to complete ongoing modification, so the data structure is freed up
            //to allow access from this thread.
            modified = false;
        }
        return modified;
    }
}
```

## 非阻塞算法很难实现

非阻塞算法很难正确的设计和实现。在尝试实现自己的非阻塞算法之前，请看看是否有人已经为你的需要开发了非阻塞算法。

Java已经提供了一些非阻塞的实现（例如ConcurrentLinkedQueue），并且很可能在未来的Java版本中提供更多的非阻塞算法实现。

除了Java内置的非阻塞数据结构之外，还有一些开源的非阻塞数据结构可以使用。例如，LMAX中断器（类似队列的数据结构）和Cliff Click的非阻塞HashMap。

## 非阻塞算法的好处

与阻塞算法相比，非阻塞算法有几个优点。本节将介绍这些好处。

### 提供选择

非阻塞算法的第一个好处是，当请求的操作无法执行时，线程可以选择做什么。请求线程不是只能被阻塞，而是可以选择要做什么。有时候线程什么也做不了。在这种情况下，它可以选择阻塞或等待自己，从而释放CPU用于其他任务。但至少请求线程有选择。

在单CPU系统上，挂起一个不能执行所需操作的线程，让其他可以执行其工作的线程在CPU上运行是有意义的。但即使在单CPU系统上，阻塞算法也可能导致死锁、饥饿和其他并发问题。

### 没有死锁

非阻塞算法的第二个好处是，一个线程的挂起不会导致其他线程的挂起。这意味着死锁不会发生。两个线程不会因等待彼此释放所需的锁而阻塞。由于线程在无法执行请求的操作时不会被阻塞，因此它们不会因相互等待而阻塞。非阻塞算法可能仍然会导致live lock，其中两个线程不断尝试某些操作，但不断被告知不可行（因为另一个线程的操作）。

### 没有挂起

挂起并重新激活一个线程开销很大。当然，随着操作系统和线程库的效率提高，挂起和重新激活的开销随着时间的推移而下降。然而，线程挂起和重新激活仍然需要付出高昂的代价。

每当一个线程被阻塞时，它就会被挂起，从而导致线程挂起和重新激活的开销。由于非阻塞算法不会挂起线程，所以不会发生这种开销。这意味着cpu可能会花费更多的时间来执行实际的业务逻辑，而不是上下文切换。

在多CPU系统上，阻塞算法可以对系统的整体性能产生更显著的影响。在CPU A上运行的线程在等待CPU B上运行的线程时可能会被阻塞。这会降低应用程序能够实现的并行级别。当然，CPU A可以调度另一个线程来运行，但是挂起和激活线程（上下文切换）的成本很高。需要挂起的线程越少越好。

### 减少线程延迟

本文所说的延迟是指从请求操作可执行到线程实际执行之间的时间。由于在非阻塞算法中线程不会挂起，所以不必支付昂贵的、缓慢的重新激活开销。这意味着当请求的操作可行时，线程可以更快地响应，从而减少响应延迟。

非阻塞算法通常通过忙等待操作来获得较低的延迟。当然，在非阻塞数据结构上具有高线程争用的系统中，cpu可能会在这些忙等待期间消耗大量的周期。这点需铭记在心。如果数据结构具有高线程争用，则非阻塞算法未必是最好的。但是，总有一些方法可以重新设计应用程序以减少线程争用。
