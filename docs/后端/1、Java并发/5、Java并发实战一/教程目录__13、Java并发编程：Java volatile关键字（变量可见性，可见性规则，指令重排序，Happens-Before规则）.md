# 13、Java并发编程：Java volatile关键字（变量可见性，可见性规则，指令重排序，Happens-Before规则）
- 来源：https://ddkk.com/zhuanlan/java/concurrency/5/13.html
- 分类：Java并发
- 分组：教程目录
Java volatile关键字用于将Java变量标记为“存储在主内存中”。更确切地说，这意味着：volatile变量每次都将从计算机的主存储器读取，而不是CPU缓存中；volatile变量每次都将写入主存储器，而不仅仅是CPU缓存。

实际上，从Java5开始，volatile关键字保证的不仅仅是volatile变量从主内存读取和写入。我将在下面的章节中解释这一点。

## 变量可见性问题

Java volatile关键字保证了跨线程变量更改的可见性。这听起来可能有点抽象，所以让我详细说明一下。

在多线程应用程序中，线程对非易失性变量进行操作，出于性能原因，每个线程都可以在处理变量时将变量从主内存复制到CPU缓存中。如果计算机包含多个CPU，则每个线程可能在不同的CPU上运行。这意味着，每个线程可以将变量复制到不同CPU的CPU缓存中。下面举例说明：

对于非易失性变量，无法保证Java虚拟机（JVM）何时将数据从主内存读取到CPU缓存，何时将数据从CPU缓存写入主内存。这可能会导致一些问题，我将在下面的章节中解释。

假设两个或多个线程访问一个共享对象，该对象包含了一个counter变量声明如下：

```java
public class SharedObject {
    public int counter = 0;
}
```

想象一下，只有线程1递增counter变量，但线程1和线程2都可能不时地读取counter变量。

如果计数器变量未声明为volatile，则无法保证counter变量的值何时从CPU缓存写入主内存。这意味着，CPU缓存中的counter变量值可能与主内存中的不同。这种情况如下所示：

线程没有看到一个变量的最新值，因为它还没有被另一个线程写回主内存，这个问题被称为“可见性”问题。一个线程的更新对其他线程不可见。

## Java volatile可见性规则

Java volatile关键字旨在解决变量可见性问题。通过声明counter变量volatile，所有对counter变量的写入都将立即写回主内存。此外，counter变量的所有读取都将直接从主内存中读取。

volatile声明的counter变量像下面这样：

```java
public class SharedObject {
    public volatile int counter = 0;
}
```

因此，声明变量volatile可以保证该变量的写入对其他线程的可见性。

在上面给出的场景中，一个线程（T1）修改counter，另一个线程（T2）读取counter（但从不修改），声明counter变量volatile足以保证counter变量的写入对T2可见。

但是，如果T1和T2都在递增counter变量，那么声明counter变量为volatile是不够的。接下来再讨论。

### volatile可见性完整规则

实际上，Java volatile的可见性规则超出了volatile变量本身。可见性规则如下：

- 如果线程A写入volatile变量，而线程B随后读取相同的volatile变量，那么线程A在写入volatile变量之前可见的所有变量，在线程B读取volatile变量之后也将可见。
- 如果线程A读取volatile变量，那么线程A在读取volatile变量时可见的所有变量也将从主内存中重新读取。

让我用一个代码示例来说明这一点：

```java
public class MyClass {
    private int years;
    private int months
    private volatile int days;
    public void update(int years, int months, int days){
        this.years  = years;
        this.months = months;
        this.days   = days;
    }
}
```

udpate（）方法写入三个变量，其中只有days是volatile。

volatile可见性完整规则意味着，当days写入一个值时，线程可见的所有变量也将写入主内存。这意味着，当days写入一个值时，years和months的值也被写入主内存。

你可以这样做来读取years，months，days 的值:

```java
public class MyClass {
    private int years;
    private int months
    private volatile int days;
    public int totalDays() {
        int total = this.days;
        total += months * 30;
        total += years * 365;
        return total;
    }
    public void update(int years, int months, int days){
        this.years  = years;
        this.months = months;
        this.days   = days;
    }
}
```

注意totalDays（）方法首先将days的值读入total变量。当读取days的值时，months和years的值也会读入主存储器。因此，按上述读取顺序，可以确保读到days、months和years的最新值。

## 指令重排序带来的难题

出于性能原因，只要指令的语义保持不变，Java虚拟机和CPU就可以对程序中的指令重新排序。例如，看看以下指令：

```java
int a = 1;
int b = 2;
a++;
b++;
```

这些指令可以重新排序为以下顺序，而不会丧失程序的语义：

```java
int a = 1;
a++;
int b = 2;
b++;
```

然而，当其中一个变量是volatile变量时，指令重新排序是一个难题。让我们看看本篇前面示例中的MyClass类：

```java
public class MyClass {
    private int years;
    private int months
    private volatile int days;
    public void update(int years, int months, int days){
        this.years  = years;
        this.months = months;
        this.days   = days;
    }
}
```

update（）方法将值写入days后，新写入的years和months值也将写入主内存。但是，如果Java虚拟机重新排列了指令呢？比如像这样：

```java
public void update(int years, int months, int days){
    this.days   = days;
    this.months = months;
    this.years  = years;
}
```

当days变量被修改时，months和years的值仍会写入主内存，但这次是在新值写入months和years之前发生的。因此，其他线程无法正确地看到新值。重新排序的指令的语义发生了变化。

我们将在下一节中看到，Java有一个方案可以解决这个问题。

## Java volatile的Happens-Before规则

为了解决指令重新排序的难题，除了可见性规则之外，Java volatile关键字还提供“happens before”规则。“happens before”规则确保了：

- 如果读/写最初发生在对volatile变量的写入之前，则不能将对其他变量的读/写重新排序为在对volatile变量的写入之后发生。
- 在写入volatile变量之前的读/写操作保证在写入volatile变量之前发生。请注意，仍然有可能出现这种情况，例如，volatile的写操作之后的其他变量的读/写，重排序为在volatile的写操作之前。反之则不行。允许从后到前，但不允许从前到后。
- 如果对其他变量的读取/写入最初发生在读取volatile变量之后，则不能将该读取和写入重新排序为在读取volatile变量之前发生。注意，在volatile变量的读取之前发生的其他变量的读取可能会被重新排序为在volatile变量的读取之后发生。反之则不行。允许从前到后，但不允许从后到前。

（
**译者注：**

作者对H-B规则描述的虽然正确，但不够清晰。H-B规则是为了解决指令重排序与可见性规则的冲突。所以，将H-B规则和可见性规则对照起来，就很容易理解了。

首先，可见性规则解决了缓存一致性问题。解决方法可理解为“**两个刷新**”：

写volatile时将所有可见变量从缓存刷新到内存，简记为“**写刷新**”；

读volatile时将所有可见变量从内存刷新到缓存，简记为“**读刷新**”。

通过“两个刷新”，保证了在读/写volatile时，变量在内存和缓存中是一致。

但是，由于指令重排序的存在，刷新的动作会导致语义变化。例如对于写刷新，代码预期的是变量修改后刷新到内存，结果由于指令重排序变成了刷新到内存后再修改变量。错的很离谱。

于是，H-B规则对指令重排作了限制，本质上可以理解为，指令重排不能影响刷新的结果。

建议不必记具体规则，但应理解为什么要这么做。

）

上述的happens-before规则确保了volatile关键字的可见性规则能够生效。

## volatile不是万金油

即使volatile关键字保证所有volatile变量的读取都直接从内存中读取，并且所有volatile变量的写入都直接写入内存，但在某些情况下，仅声明变量为volatile仍然是不够的。

在前面阐述的只有线程1写入共享counter变量的情况下，声明counter变量为volatile足以确保线程2始终看到最新的写入值。

事实上，如果写入变量的新值不依赖于它的前值，甚至可以有多个线程写入共享的volatile变量，并且主内存中存储的值仍然是正确的。换句话说，如果一个线程向共享的volatile变量写入一个值，它不需要首先读取它的值来计算它的下一个值。

只要线程需要首先读取volatile变量的值，并基于该值生成新值赋给共享的volatile变量，volatile变量就不再足以保证正确的可见性。读取volatile变量和写入新值之间的短暂时间间隔，造成了一个竞态条件，多个线程可能读取volatile变量的同一个值，为该变量生成一个新值，并且在将该值写入主内存时覆盖彼此的值。

多个线程递增同一个计数器的情况正是这样一种情况，即volatile变量不够用了。以下各节将更详细地解释这个案例。

假设线程1将一个值为0的共享counter变量读入其CPU缓存，将其递增为1，但没有将更改后的值写回主内存。然后，线程2可以将相同的counter变量从主内存（变量值仍然为0）读取到自己的CPU缓存中。然后线程2也可以将counter增加到1，并且也没有将其写回主内存。这种情况如下图所示：

线程1和线程2现在几乎不同步。共享counter变量的实际值应该是2，但每个线程的CPU缓存中该变量的值是1，在主内存中该值仍然为0。真是一团糟！即使线程最终将共享counter变量的值写回主内存，该值也会出错。

## volatile在什么时候有用

如前所述，如果两个线程都在读写一个共享变量，那么使用volatile关键字是不够的。在这种情况下，需要使用synchronized来保证变量的读写是原子的。读取或写入volatile变量不会阻塞线程的读取或写入。为此，必须在临界区周围使用synchronized关键字。

作为同步块的替代，还可以使用java.util.concurrent包中的原子数据类型。例如，AtomicLong或AtomicReference或其他类型。

如果只有一个线程读取和写入volatile变量的值，而其他线程只读取该变量，那么可以保证读取线程看到volatile变量写入的最新值。如果不标记变量为volatile，就无法保证这一点。

volatile关键字可以保证在32位和64个变量上有效。

## volatile的性能斟酌

读写volatile变量会导致变量从内存读写。从内存读写比访问CPU缓存的开销更大。访问volatile变量还会阻止指令重新排序，这是一种正常的性能增强技术。因此，只有在真正需要保证变量可见性时，才应该使用volatile变量。
