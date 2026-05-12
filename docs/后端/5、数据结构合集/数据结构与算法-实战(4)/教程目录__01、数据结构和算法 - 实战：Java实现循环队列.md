# 01、数据结构和算法 - 实战：Java实现循环队列
- 来源：https://ddkk.com/zhuanlan/algorithm/8/1.html
- 分类：数据结构
- 分组：教程目录
## 1.1 什么是循环队列

循环队列：具有队头指针（front）和队尾指针（rear），指示队列元素所在的位置，避免删除元素时移动大量元素。队列也是一种线性表，只不过它是操作受限的线性表，只能在两端操作，先进先出（First In First Out，FIFO）。

### 循环队列特性：

- 只能队尾插入元素、在队头删除元素。
- 先进先出（First In First Out）的线性表，先进入的元素出队，后进入的元素才能出队。

### 优点：

- 相比普通的队列，元素出队时无需移动大量元素，只需移动头指针。
- 适合处理用户排队等待的情况。

### 时间复杂度:

- 读取时的时间复杂度为O(1)。
- 插入、删除时的时间复杂度为O(1)。

## 1.2 图解循环队列

**1、** 顺序队列：

队列的顺序存储形式，可以用一个一维数组存储数据元素，用两个整型变量记录队头和队尾元素的下标。

顺序存储方式：

**2、****队列的入队和出队情况**：；

假设现在顺序队列Q分配了6个空间，然后进行入队出队操作，过程如图所示：

2.1 开始时为空队，front=rear，如图所示：

2.2 元素a1进队，放入尾指针rear（整型下标）的位置，rear后移一位，如图所示：

2.3 元素a3，a4，a5分别按顺序进队，尾指针rear依次后移，如图所示：

2.4 元素a1出队，头指针front（整型下标）后移一位，如图所示：

2.5 元素a2出队，头指针front（整型下标）后移一位，如图所示：

2.6 元素a6进队，放入尾指针rear（整型下标）的位置，rear后移一位，如图所示：

元素a7进队，此时尾指针rear已经超过了数组的下标，无法再存储进队，但是我们发现前面明明有2个空间，却出现了队满的情况，这种情况称为"假溢出"。

2.7 上面第【2.6】步元素a6进队之后，尾指针rear要后移一个位置，此时已经超过了数组的下标，即rear + 1 = maxSize（最大空间数6），那么如果前面有空闲，rear可以转向前面0的位置，如图所示：

2.8 然后元素a7进队，放入尾指针rear（整型下标）的位置，rear后移一位，如图所示：

2.9 元素a8进队，放入尾指针rear（整型下标）的位置，rear后移一位，如图所示：

2.10 队满临界条件判断，如图所示：

这时候虽然队列空间存满了，但是出现了一个大问题，队满时front = rear，这和队空的条件一模一样，无法区分队空还是队满，如何解决呢？有两种办法：一是设置一个标志，标记队空和队满；另一种办法是浪费一个空间，当尾指针rear的下一个位置front是时，就认为是队满。如图所示：

上述到达尾部又向前存储的队列称为循环队列，为了避免"假溢出"，我们通常采用循环队列。

循环队列无论入队还是出队，队尾、队头加1后都要取模运算，例如入队后队尾后移一位：rear = ( rear + 1) % maxSize。

2.10 **为什么要对maxSize取余**

主要是为了处理临界状态，即rear向后移动一个位置rear+1后，很有可能超出了数组的下标，这时它的下一个位置其实是0，如果将一维数组画成环形图，如图所示：

上图中最大空间maxSize，当rear=maxSize-1时，(rear + 1) % maxSize = 0，而且 front =0 ，正好满足队满的条件：(rear+1) % maxSize = front，此时为队满。

因此无论是front还是rear向后移动一个位置时，都要加1与最大空间maxSize取模运算，处理临界问题。

**1、****总结**；

如下表格中，记录循环队列状态和说明：

状态
说明

队空
front=rear; // rear和front指向同一个位置

队满
(rear + 1) % maxSize = front; // rear向后移一位正好是front

入队
[rear] = x; // 将元素放入rear所指空间，rear =(rear+1) % maxSize; //rear向后移一位

出队
element = data[front]; //用变量记录data[front]所指元素，front = (front + 1) % maxSize // front向后移一位

**1、****循环队列中存了元素个数**；

因为队列是循环的，所以存在两种情况：

4.1 rear>= front，这种情况队列中元素个数为：rear - front=4-1=3。如下图所示：

4.2 rear= front：元素个数为rear-front；
- rear<front：元素个数为rear-front+ maxSize；
- 4.4 采用取模的方法把两种情况统一为一个语句：

**队列中元素个数：(rear - front + maxSize)% maxSize**

当rear-front为负数时，加上maxSize再取余正好是元素个数，如(-2+6)%6=4；当rear-front为正数时，加上maxSize超过了最大空间数，取余后正好是元素个数，如(3+6)%6=3。

## 1.3 Java实现循环队列

CustomCyclicArrayQueue类是一个自定义实现了循环队列。

```java
package com.yuanxw.datastructure.chapter1;
import java.util.NoSuchElementException;
/**
 * 自定义实现循环队列
 */
public class CustomCyclicArrayQueue {
    public static void main(String[] args) {
        CyclicArrayQueue arrayQueue = new CyclicArrayQueue<>(3);
        System.out.println("获得arrayQueue元素列表：" + arrayQueue);
        System.out.println("arrayQueue.add()，添加【Java】元素，执行返回结果：" + arrayQueue.add("Java"));
        System.out.println("arrayQueue.add()添加【C】元素，执行返回结果：" + arrayQueue.add("C"));
        System.out.println("arrayQueue.add()添加【Python】元素，执行返回结果：" + arrayQueue.add("Python"));
        /**
         * 添加第4个元素时：arrayQueue.add("C++");
          执行结果：
            Exception in thread "main" java.lang.IllegalStateException: Queue full
          	at com.yuanxw.datastructure.chapter1.CustomArrayQueue$ArrayQueue.add(CustomArrayQueue.java:88)
          	at com.yuanxw.datastructure.chapter1.CustomArrayQueue.main(CustomArrayQueue.java:17)
         */
        System.out.println(arrayQueue);
        System.out.println("获得arrayQueue队列个数："+arrayQueue.size());
        System.out.println("获得arrayQueue队列中的第一个元素："+arrayQueue.peek());
        System.out.println("获得arrayQueue队列中的第一个元素："+arrayQueue.peek());
        System.out.println(arrayQueue);
        System.out.println("当前arrayQueue对象中take()数据值为：" + arrayQueue.take());
        System.out.println(arrayQueue);
        System.out.println("当前arrayQueue对象中take()数据值为：" + arrayQueue.take());
        System.out.println(arrayQueue);
        System.out.println("当前arrayQueue对象中take()数据值为：" + arrayQueue.take());
        System.out.println(arrayQueue);
        /**
         * 当队列中的元素为空时，调用 arrayQueue.take()方法，抛出异常。
         * Exception in thread "main" java.util.NoSuchElementException
         * 	at com.yuanxw.datastructure.chapter1.CustomCyclicArrayQueue$CyclicArrayQueue.take(CustomCyclicArrayQueue.java:146)
         * 	at com.yuanxw.datastructure.chapter1.CustomCyclicArrayQueue.main(CustomCyclicArrayQueue.java:36)
         */
        // System.out.println("当前arrayQueue对象中take()数据值为：" + arrayQueue.take());
        System.out.println("arrayQueue.add()，添加【C++】元素，执行返回结果：" + arrayQueue.add("C++"));
        System.out.println("arrayQueue.add()添加【JavaScript】元素，执行返回结果：" + arrayQueue.add("JavaScript"));
        System.out.println("arrayQueue.add()添加【C#】元素，执行返回结果：" + arrayQueue.add("C#"));
        System.out.println(arrayQueue);
    }
    static class CyclicArrayQueue<E> {
        // 队列头部，指向队列头的第一个位置。默认值为：0
        private int front;
        // 队列尾，指向队列尾的位置。默认值为：0
        private int rear;
        // 数据
        private E[] data;
        // 容量
        private int maxSize;
        /**
         * 构造函数
         * @param capacity
         */
        public CyclicArrayQueue(int capacity) {
            this.front = 0;
            this.rear = 0;
            // 预留一个判断是否队满。
            this.maxSize = capacity + 1;
            this.data = (E[])new Object[maxSize];
        }
        /**
         * 判断是否已经满
         * @return
         */
        public boolean isFull(){
            return (rear  + 1) % maxSize == front;
        }
        /**
         * 是否为空
         * @return
         */
        public boolean isEmpty(){
            return rear == front;
        }
        /**
         * 获取大小
         * @return
         */
        public int size(){
            return (rear - front + maxSize) % maxSize;
        }
        /**
         * 添加元素
         * @param element
         * @return
         */
        public boolean add(E element){
            if(element == null){
                throw new NullPointerException("can not add element be null");
            }
            // 队列已经满
            if(isFull()){
                throw new IllegalStateException("Queue full");
            }
            data[rear] = element;
            rear = (rear + 1) % maxSize;
            return true;
        }
        /**
         * 返回队列中的第一个元素
         * @return
         */
        public E get(){
            if(isEmpty()){
                throw new NoSuchElementException();
            }
            E element = data[front];
            front = (front + 1) % maxSize ;
            return element;
        }
        /**
         * 返回队列中的第一个元素
         * @return
         */
        public E peek(){
            if(isEmpty()){
                throw new NoSuchElementException();
            }
            return data[front];
        }
        /**
         * 删除此队列的头并返回
         * @return
         */
        public E take(){
            if(isEmpty()){
                throw new NoSuchElementException();
            }
            E takeValue = data[front];
            front = (front + 1) % maxSize ;
            return takeValue;
        }
        @Override
        public String toString() {
            StringBuffer buffer = new StringBuffer();
            if(isEmpty()){
                return buffer.append("[]").toString();
            }
            buffer.append("[");
            for (int i = front; i < front + size(); i++) {
                buffer.append(data[i%maxSize]).append(",");
            }
            // 删除最后一个逗号
            buffer.deleteCharAt(buffer.length()-1);
            buffer.append("]");
            return buffer.toString();
        }
    }
}
```

执行结果：

```java
获得arrayQueue元素列表：[]
arrayQueue.add()，添加【Java】元素，执行返回结果：true
arrayQueue.add()添加【C】元素，执行返回结果：true
arrayQueue.add()添加【Python】元素，执行返回结果：true
[Java,C,Python]
获得arrayQueue队列个数：3
获得arrayQueue队列中的第一个元素：Java
获得arrayQueue队列中的第一个元素：Java
[Java,C,Python]
当前arrayQueue对象中take()数据值为：Java
[C,Python]
当前arrayQueue对象中take()数据值为：C
[Python]
当前arrayQueue对象中take()数据值为：Python
[]
arrayQueue.add()，添加【C++】元素，执行返回结果：true
arrayQueue.add()添加【JavaScript】元素，执行返回结果：true
arrayQueue.add()添加【C#】元素，执行返回结果：true
[C++,JavaScript,C#]
```

–
