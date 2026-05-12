# 05、数据结构与算法 - 基础：队列（Qeque）
- 来源：https://ddkk.com/zhuanlan/algorithm/1/5.html
- 分类：数据结构
- 分组：教程目录
## 队列的定义

队列也是一种线性表，只能在**头尾两端**进行操作，主要特点：

- 队尾：只能从**队尾添加**元素，叫做**入队（enQueue）**
- 队头：只能从**队头移除**元素，叫做**出队（deQueue）**
- 先进先出元素，**First In First Out(FIFO)**

## 接口设计

根据**队列的定义**设计接口如下表：

函数
释义

int size()
元素数量

boolean isEmpty()
是否为空

void clear()
清空

void enQueue(E element)
入队

E dequeue()
出队

E front()
获取队列的头元素

- E 是泛型类型

## 实现

看队列，需要操作它的头部和尾部，所以从探究过的**动态数组**、**链表** 中选择时，可以优先选择**双向链表**。

```java
public class Queue<E> {
	private List<E> list = new LinkList<>();
	/**
	 * 元素数量
	 * @return
	 */
	int size() {
		return list.size();
	}
	/**
	 * 是否为空
	 * @return
	 */
	boolean isEmpty() {
		return list.isEmpty();
	}
	/**
	 * 清空
	 */
	void clear() {
		list.clear();
	}
	/**
	 * 入队
	 * @param element
	 */
	void enQueue(E element) {
		list.add(element);
	}
	/**
	 * 出队
	 * @return
	 */
	E deQueue() {
		return list.remove(0);
	}
	/**
	 * 获取队头元素
	 * @return
	 */
	E front() {
		return list.get(0);
	}
}
```

## 双端队列（Deque）

**双端队列**是可以在队列的两头都可以操作入队和出队。所以增加了相关的接口

函数
释义

void enQueueRear(E element)
从队尾入队

E deQueueFront()
从队头出队

void enQueueFront(E element)
从队头出队

E deQueueRear()
从队尾出队

E front()
获取队列的头元素

E rear()
获取队列的尾元素

## 实现

```java
public class Deque<E> {
	private LinkList<E> list = new LinkList<>();
	/**
	 * 元素数量
	 * @return
	 */
	int size() {
		return list.size();
	}
	/**
	 * 是否为空
	 * @return
	 */
	boolean isEmpty() {
		return list.isEmpty();
	}
	/**
	 * 清空
	 */
	void clear() {
		list.clear();
	}
	/**
	 * 从队头入队
	 * @param element
	 */
	void enQueueFront(E element) {
		list.add(0, element);
	}
	/**
	 * 从队尾入队
	 * @param element
	 */
	void enQueueRear(E element) {
		list.add(element);
	}
	/**
	 * 从队头出队
	 */
	E deQueueFront() {
		return list.remove(0);
	}
	/**
	 * 从队尾出队
	 */
	E deQueueRear() {
		return list.remove(list.size() - 1);
	}
	/**
	 * 获取队列的头元素
	 * @return
	 */
	E front() {
		return list.get(0);
	}
	/**
	 * 获取队列的尾元素
	 * @return
	 */
	E rear() {
		return list.get(list.size() -1);
	}
}
```
