# 16、Java并发编程：死锁（DeadLock，线程死锁，数据库死锁）
- 来源：https://ddkk.com/zhuanlan/java/concurrency/5/16.html
- 分类：Java并发
- 分组：教程目录
## 线程死锁

死锁是指两个或多个线程被阻塞，等待获得死锁中其他一些线程所持有的锁。当多个线程同时需要相同的锁，但以不同的顺序获取它们时，可能会发生死锁。

例如，如果线程1锁定A并试图锁定B，而线程2已经锁定B并试图锁定A，则会出现死锁。线程1永远得不到B，线程2永远得不到A。此外，他们都不会知道。他们将永远被阻塞在他们各自的对象上，A和B。这种情况就是死锁。

这种情况如下所示：

```java
Thread 1  locks A, waits for B
Thread 2  locks B, waits for A
```

下面的示例是在不同实例中调用同步方法的TreeNode类：

```java
public class TreeNode {
  TreeNode parent   = null;  
  List     children = new ArrayList();
  public synchronized void addChild(TreeNode child){
    if(!this.children.contains(child)) {
      this.children.add(child);
      child.setParentOnly(this);
    }
  }
  public synchronized void addChildOnly(TreeNode child){
    if(!this.children.contains(child){
      this.children.add(child);
    }
  }
  public synchronized void setParent(TreeNode parent){
    this.parent = parent;
    parent.addChildOnly(this);
  }
  public synchronized void setParentOnly(TreeNode parent){
    this.parent = parent;
  }
}
```

如果线程（1）调用parent.addChild(child)方法，另一个线程（2）同时调用child.setParent(parent)方法，在同一parent实例和child实例上，可能会发生死锁。可以用下面的伪代码说明这一点：

```java
Thread 1: parent.addChild(child); //locks parent
          --> child.setParentOnly(parent);
Thread 2: child.setParent(parent); //locks child
          --> parent.addChildOnly()
```

首先，线程1调用parent.addChild(child)。由于addChild（）是同步的，因此线程1实际上锁定了parent对象，使其他线程无法访问。

然后，线程2调用child.setParent(parent)。由于setParent（）是同步的，因此线程2实际上锁定了child对象，使其他线程无法访问。

现在child对象和parent对象都被两个不同的线程锁定了。接下来，线程1试图调用child.setParentOnly() 方法，但child对象被线程2锁定，因此该方法就阻塞了。线程2也尝试调用parent.addChildOnly()，但parent对象被线程1锁定，导致线程2在该方法上阻塞。现在，两个线程都被阻塞，等待获得另一个线程持有的锁。

注意：两个线程必须同时调用parent.addChild(child)和child.setParent(parent)，就像上面描述的那样，在相同的parent实例和child实例上，才发生死锁。上面的代码可能会在很长一段时间内执行正常，直到突然死锁。

线程真的需要“在同一时刻”锁定。例如，如果线程1比线程2提前一点，从而锁定了A和B，那么线程2在尝试锁定B时将被阻塞。也就不会发生死锁。由于线程调度通常是不可预测的，因此无法预测何时发生死锁。只能知道死锁“会”发生。

## 更复杂的死锁

死锁还可以包含两个以上的线程。这使得它更难被发现。下面是四个线程死锁的示例：

```java
线程 1  锁定 A, 等待 B
线程 2  锁定 B, 等待 C
线程 3  锁定 C, 等待 D
线程 4  锁定 D, 等待 A
```

线程1等待线程2，线程2等待线程3，线程3等待线程4，线程4等待线程1.

## 数据库死锁

发生死锁的一种更复杂的情况是数据库业务。一笔数据库业务可能包含许多SQL更新请求。当一笔数据库业务更新记录时，该记录将被锁定，使其他数据库业务无法更新，直到第一笔业务完成。因此，同一业务中的各个更新请求可能会锁定数据库中的某些记录。

例如：

```java
Transaction 1, request 1, locks record 1 for update
Transaction 2, request 1, locks record 2 for update
Transaction 1, request 2, tries to lock record 2 for update.
Transaction 2, request 2, tries to lock record 1 for update.
```

由于锁是在不同的请求中获取的，并且无法全部知道业务所需的所有锁，因此很难检测或防止数据库业务中出现死锁。
