# 04、数据结构与算法 - 基础：栈（Stack）
- 来源：https://ddkk.com/zhuanlan/algorithm/1/4.html
- 分类：数据结构
- 分组：教程目录
> 摘要
>
> 前几期探究过动态数组或者链表后，接下来的栈就可以使用线性表的结构再次封装实现。在实现栈 的时候发现，在线性表的基础上，实现起来更简单。
>
> 栈这种数据结构应用到很多场景，比如网页之间的跳转等。

## 栈的定义

**栈**是一种特殊的线性表，只能在**一端**进行操作。栈的主要特点有以下几点：

- 往栈中添加元素的操作，叫作**入栈（push）**
- 从栈中移除元素的操作，叫做**出栈（pop）** ，只能移除栈顶元素
- 栈遵守的是原则是**后进先出（Last In First Out，LIFO）**

## 栈的接口设计

根据栈的特点，可以设计栈的相关接口：

函数
释义

int size();
元素的数量

boolean isEmpty();
是否为空

void push(E element);
入栈

E pop();
出栈

E top();
获取栈顶元素

void clear();
清空

- E 为泛型类型

栈的内部实现可以用**动态数组或者链表**。

## 栈的代码实现

这里是通过动态数组实现**栈**相关。

```java
/**
 * 栈结构
 */
public class Stack<E> {
	private List<E> list = new ArrayList<>();
	/**
	 * 元素数量
	 * @return
	 */
	int size() {
		return list.size();
	}
	/**
	 * 是否是空
	 * @return
	 */
	boolean isEmpty()  {
		return list.isEmpty();
	}
	/**
	 * 入栈 - 给列表添加元素
	 * @param element
	 */
	void push(E element) {
		list.add(element);
	}
	/**
	 * 出栈 - 移除列表中最后一个元素
	 * @return
	 */
	E pop() {
		return list.remove(list.size() -1);
	}
	/**
	 * 获取栈顶元素 - 获取列表最后一个元素
	 * @return
	 */
	E top() {
		return list.get(list.size() -1);
	}
	/**
	 * 	清空
	 */
	void clear() {
		list.clear();
	}
} 
```
