# 07、Java集合：List之Stack
- 来源：https://ddkk.com/zhuanlan/java/concurrency/3/7.html
- 分类：Java并发
- 分组：教程目录
## 1.Stack

> publicclass Stack extends Vector

- 后进先出（LIFO）的对象堆栈。
- 通过五个操作对类 Vector 进行了扩展 ，允许将向量视为堆栈。
- 首次创建堆栈时，它不包含项。
- Deque 接口及其实现提供了 LIFO 堆栈操作的更完整和更一致的 set，应该优先使用此 set，而非此类。例如： Deque stack = new ArrayDeque();
- Vector的增强类，堆栈顶部对应向量末尾。

> 构造方法

```java
public Stack() { }
```

> boolean empty():测试堆栈是否为空。

```java
public boolean empty() {
	return size() == 0;
}
```

> peek() :查看堆栈顶部的对象，但不从堆栈中移除它。

```java
public synchronized E peek() {
	//获取向量容量大小
	int	len = size();
	if (len == 0)
	    throw new EmptyStackException();
	return elementAt(len - 1);//调用父类Vector的elementAt方法
}
```

注意堆栈顶部的对象的对象索引对应的是向量末尾。

> Epop(): 移除堆栈顶部的对象，并作为此函数的值返回该对象。

```java
public synchronized E pop() {
	E	obj;
	//获取向量大小
	int	len = size();
	//获取堆栈顶部的对象
	obj = peek();
	//调用父类Vector的removeElementAt方法，移除末尾元素
	removeElementAt(len - 1);
	return obj;
}
```

> Epush(E item):把项压入堆栈顶部。

```java
public E push(E item) {
	//调用父类Vector的addElement方法，添加元素至向量末尾
	addElement(item);
	return item;
}
```

> int search(Object o):返回对象在堆栈中的位置，以 1 为基数。

```java
public synchronized int search(Object o) {
	//调用父类Vector的lastIndexOf方法
	//返回此向量中最后一次出现的指定元素的索引，从末尾向前搜索，如果未找到该元素，则返回 -1。
	int i = lastIndexOf(o);
	if (i >= 0) {
	    return size() - i;
	}
	return -1;
}
```
