# 05、Java并发编程：集合的线程安全
- 来源：https://ddkk.com/zhuanlan/java/concurrency/4/25.html
- 分类：Java并发
- 分组：Java 并发基础 (B)
## 5.1 List集合线程不安全

创建10个线程对同一个List集合进行修改：

```java
/**
 * List集合线程不安全的例子
 */
public class ThreadDemo4 {
    public static void main(String[] args) {
        //创建ArrayList集合
        List<String> list = new ArrayList<>();
        //创建线程对list进行修改
        for(int i = 0; i < 10; i++) {
            new Thread(()->{
                //往集合中添加元素
                list.add(UUID.randomUUID().toString().substring(0, 8));
                //获取集合中的元素
                System.out.println(list);
            }, String.valueOf(i)).start();
        }
    }
}
```

发现报错：ConcurrentModificationException

错误原因：**访问的同时又在进行修改**。

#### 解决方案1：Vector

将arrayList替换为Vector

```java
//创建集合
List<String> list = new Vector<>();
```

因为Vector中的方法都加了`synchronized`关键字，例如：

```java
public synchronized boolean add(E e) {
    modCount++;
    ensureCapacityHelper(elementCount + 1);
    elementData[elementCount++] = e;
    return true;
}
```

#### 解决方案2：Collection.synchronizedList()

利用Collection的静态方法`synchronizedList`：

```java
List<String> list = Collections.synchronizedList(new ArrayList());
```

#### 解决方案3 ：CopyOnWriteArrayList

写时复制技术：当有元素要往列表中添加元素时，会先复制一份原列表，添加好元素后，将原引用指向新的列表。

因为是复制一份进行写操作的，所以同时有其他线程要读时，依然可以对原数组进行读操作。缺点就是：可能读的不是最新的元素。

源码：

```java
public boolean add(E e) {
    final ReentrantLock lock = this.lock;
    lock.lock();
    try {
        Object[] elements = getArray();
        int len = elements.length;
        Object[] newElements = Arrays.copyOf(elements, len + 1);
        newElements[len] = e;
        setArray(newElements);
        return true;
    } finally {
        lock.unlock();
    }
}
```

既照顾了并发读，也实现了独立写。

适合读多写少的应用场景。

## 5.2 HashSet集合线程不安全

演示10个线程对同一个hashSet进行读写操作。

```java
package lock;
import java.util.HashSet;
import java.util.UUID;
public class ThreadDemo5 {
    public static void main(String[] args) {
        HashSet<String> set = new HashSet<>();
        for(int i = 0; i < 10; i++) {
            new Thread(()->{
                set.add(UUID.randomUUID().toString().substring(0, 8));
                System.out.println(set);
            }, "thread"+i).start();
        }
    }
}
```

不出所料，果然报错了：

### 解决方案：CopyOnWriteArraySet()

## 5.3 HashMap线程不安全

代码演示：

```java
package lock;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
public class ThreadDemo6 {
    public static void main(String[] args) {
        Map<String, Integer> hashMap = new HashMap<>();
        for(int i = 0; i < 10; i++) {
            int finalI = i;
            new Thread(()->{
                hashMap.put(UUID.randomUUID().toString().substring(0, 8), finalI);
                System.out.println(hashMap);
            }).start();
        }
    }
}
```

还是出现问题咯：

#### 解决方案：ConcurrentHashMap()
