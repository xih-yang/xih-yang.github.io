# 06、数据结构与算法 - 实战：单向链表 - Java
- 来源：https://ddkk.com/zhuanlan/algorithm/12/6.html
- 分类：数据结构
- 分组：教程目录
## 概念

**逻辑有序**

**内存上节点间无序**

特点

**1、****由节点组成，是逻辑上有序的、内存上无序**；

**2、****每个节点由数据（data）、以及指向下一个节点的指针（next）组成**；

**3、****next=null：说明链表已经遍历完节点**；

**4、****head指针(头节点不存数据)：指向第一个节点的位置**；

## 单链表 - 新元素直接添加到尾部

## 代码实现

**通用的简单单向链表 - 泛型**

```java
class  SingleLinkedList<T> {
	// 头节点
	Node<T> head = new Node<T>(null);
    // 添加元素
	public void add(T a) {
		// 将添加的元素 封装成为 一个新的节点
		Node<T> newNode = new Node<T>(a);
		// 用来存储当前遍历到的节点引用
		Node<T> temp_Node = head;
		while(true) {
			// 如果节点中含有 next=null 说明则是尾节点，停止遍历
			if(temp_Node.next == null) {
				break;
			}
			temp_Node = temp_Node.next;
		}
		// 尾节点的next= 新节点的引用
		temp_Node.next = newNode;
	}
	// 将链表以字符串的形式输出、故重载 toString() 方法
	@Override
	public String toString() {
		// 存储当前遍历到的节点的引用
		Node<T> temp_Node = head;
		// 使用 StringBuilder处理字符串更加的快
		StringBuilder sb = new StringBuilder();
		// 只有到了 尾节点，节点遍历才停止
		while(temp_Node.next != null) {
			temp_Node = temp_Node.next;
			sb.append(temp_Node.data + "\n");
		}
		sb.delete(sb.lastIndexOf("\n"), sb.length());
		return sb.toString();
	}
	// 1. 内部节点类无需显示地定义在列表的外面，单纯私有内部类就可以了
	@SuppressWarnings({
      "unused", "hiding" })
	private class Node<T> {
		T data;    // 存储T类型的真实数据
		Node<T> next;   // 指向下一个节点
		Node(T data) {
			this.data = data;
			next = null;
		}
		@Override
		public String toString() {
			return data.toString();
		}
	}
}
```

## 测试

```java
class Student {
	String name;
	int year;
	public Student(String name, int year) {
		this.name = name;
		this.year = year;
	}
	@Override
	public String toString() {
		return "Student [name=" + name + ", year=" + year + "]";
	}
	@Override  // 方便后面测试
	public int hashCode() {
		return year;
	}
    public boolean equals(Object o) {
		if(! (o instanceof Student) ) {
      return false; }
		if(name.equals( ((Student)o).name )  && year == ((Student)o).year) {
			return true;
		}
		return false;
	}
}
// 测试代码
public static void main(String[] args) {
		Student stu1 = new Student("lrc", 22);
		Student stu2 = new Student("glw", 27);
		Student stu3 = new Student("yxe", 25);
		SingleLinkedList<Student> sll = new SingleLinkedList<Student>();
		sll.add(stu1);
		sll.add(stu2);
		sll.add(stu3);
		System.out.println(sll);
}
```

**运行结果**

## 单链表 - 新元素动态添加到链表

> 按hashCode()的大小动态插入，链表越后面的元素其hashCode()越大

## 代码实现

**在上面的通用简单链表添加一个成员方法**

```java
public void addOrder(T a) {
    // 1. 需要添加的新元素节点
    Node<T> newNode = new Node<T>(a);
    // 2. 找到新元素插入该临时节点的后面
    Node<T> temp_Node = headNode;
    // 3. 遍历链表
    while(temp_Node.next != null) {
        // 如果找到临时节点的后一个节点比新节点大，则直接停止循环
        if(temp_Node.next.data.hashCode() > a.hashCode()) {
            break;
        }
        temp_Node = temp_Node.next;
    }
    // 4. 插入节点步骤
    newNode.next = temp_Node.next;
    temp_Node.next = newNode;
}
```

## 测试代码

```java
public static void main(String[] args) {
    Student stu1 = new Student("lrc", 22);
    Student stu2 = new Student("glw", 27);
    Student stu3 = new Student("yxe", 25);
    SingleLinkedList<Student> sll = new SingleLinkedList<Student>();
    sll.addOrder(stu1);
    sll.addOrder(stu2);
    sll.addOrder(stu3);
    System.out.println(sll);
}
```

**运行结果**

## 单链表 - 链表元素删除

## 代码实现

```java
public boolean delete(T a) {
    Node<T> temp = headNode;
    // 遍历完、或者 找到被删元素的前一个节点则停止遍历
    while(temp.next != null) {
        // 被删元素的前一个节点
        if(temp.next.data.equals(a)) {
            break;
        }
        temp = temp.next;
    }
    // 如果是链表最后一个节点、所以链表没有符合实参的节点
    if(temp.next == null) {
        return false;
    }else {
        // 该为被删的节点
        Node deletingNode = temp.next;
        // 被删节点后面没有元素
        if(deletingNode.next == null) {
            temp.next = null;
        // 被删节点后面有元素
        }else {
            temp.next = deletingNode.next;
        }
        return true;
    }
}
```

## 单链表 - 获取链表有效节点的个数

## 代码实现

```java
// 统计有效节点的个数 --  不算头指针（即头节点）
public int length() {
    Node<T> temp = headNode;
    int length = 0;
    while(temp.next != null) {
        temp = temp.next;
        length++;
    }
    return length;
}
```

## 单链表 - 获取倒数第n个节点的数据

## 代码实现

```java
public T lastElement(int n) {
    if(length() < n) {
        throw new RuntimeException("超出界限，链表无这元素");
    }else {
        // 用来保存查找到的元素
        Node<T> temp2 = null;
        // n有几次，就遍历几次
        for(int i = 0; i < n; i++) {
            // 每遍历一次就从头开始
            Node<T> temp1 = headNode;
            while(temp1.next != temp2) {
                temp1 = temp1.next;
            }
            // 将查找到元素放置在temp2
            temp2 =temp1;
        }
        return temp2.data;
    }
}	
```

## 单链表 - 节点反转

## 代码实现

```java
public void reverse() {
    if(length() == 0) {
        return;
    }else {
        // 创建反转节点链的头指针
        Node<T> reverHead = new Node<T>(null);
        // 遍历从第一个有效节点开始，而不是头指针 ---  这部非常重要
        Node<T> validNode = headNode.next;  
        // 用来存储当前有效节点的下一个节点
        Node<T> next = null;  
        while(validNode != null) {
            // 1. 存储下一个节点的位置信息
            next = validNode.next;
            // 2. 当前节点的next指针指向  reverHead头指针指向的节点
            validNode.next = reverHead.next;
            // 3. reverHead指针指向当前节点
            reverHead.next = validNode;
            // 4. 指向下一个节点
            validNode = next;
        }
        headNode = reverHead;
    }
}
```

## 单链表 - 从尾开始打印节点

## 代码实现1 - 改变链表结构

```java
// 从尾到头打印节点  ---  消耗太多性能，因为改变了两次链表结构
public void reversePrint1() {
    // 1. 先反转链表结构
    reverse();
    // 2.打印
    System.out.println(this);
    // 2.在反转回原来链表结构
    reverse();
}
```

## 代码实现2 – 利用堆栈存储节点

```java
public void reversePrint2() {
  // 1. 存储节点
    Stack<Node<T>> stack = new Stack<Node<T>>();
    // 2. 上一个真实节点的指针
    Node<T> temp = headNode;
    while(true) {
        // 3. 待添加的节点
        Node<T> addingNode = temp.next; 
        // 4. 如果待添加的节点为空，则退出循环
        if(addingNode == null) {
            break;
        }
        // 5. 将待添加的节点 加入堆栈
        stack.push(addingNode);
        // 6. 移动遍历的指针
        temp = addingNode;
    }
    // 7. 利用堆栈先进后出的属性 从尾到头打印节点
    while(!stack.empty()) {
        System.out.println(stack.pop());
    }
}
```

## 单链表 - 合并两个有序的链表

## 代码实现

```java
public void mergeOrder(SingleLinkedList<T> sll) {
    // 注意这里是从头指针开始  -- 进行遍历操作-- 记录当前遍历的位置
    Node<T> Node_link1 = this.headNode;
    // 这里是从第一个有效节点开始-- 进行遍历操作 -- 记录当前遍历的位置
    Node<T> Node_link2 = sll.headNode.next; 
    // 如果实参无有效节点，直接结束方法
    if(Node_link2 == null) {
        return;
    }
    // 表示当前节点的状态值，如果为null，说明已经遍历完毕
    while(Node_link1 != null) {
        // 存储 当前节点的下一个节点位置
        Node<T> next_Node_link1 = Node_link1.next;
        // 如果本地链表已经遍历完毕，则直接将剩下的实参节点拼接即可 - 退出方法
        if(next_Node_link1 == null ) {
            Node_link1.next = Node_link2;
            return;
        }
        // 我们需要找出原链表插入节点的前一个节点
        if(next_Node_link1 != null) {
            // 原果原链表的下一个节点 大于  实参的当前有效节点 ，则直接插入到原链表
            if( Node_link1.next.data.hashCode() > Node_link2.data.hashCode() ) {
                // 存储实参链表的下一个节点
                Node<T> next_Node_link2 = Node_link2.next;
                // 进行实参当前节点在原链表的插入操作
                Node_link2.next = next_Node_link1;
                Node_link1.next = Node_link2;
                // 因为插入了新节点，则原来的新节点下一个元素应指向插入节点
                next_Node_link1 = Node_link2;
                // 转到下一个节点
                Node_link2 = next_Node_link2;
            }
        }
        // 原链表转到下一个节点
        Node_link1 = next_Node_link1;
    }
}
```

## 测试代码

```java
public static void main(String[] args) {
    // 1. 打印有序链表1
    Student stu1 = new Student("lrc", 22);
    Student stu2 = new Student("glw", 27);
    Student stu3 = new Student("yxe", 25);
    SingleLinkedList<Student> sll = new SingleLinkedList<Student>();
    sll.addOrder(stu1);
    sll.addOrder(stu2);
    sll.addOrder(stu3);
    System.out.println(sll);
    System.out.println("\n---------------------------\n");
    // 2. 打印有序链表2
    Student stu4 = new Student("lrc", 21);
    Student stu5 = new Student("glw", 250);
    Student stu6 = new Student("yxe", 28);
    SingleLinkedList<Student> sll2 = new SingleLinkedList<Student>();
    sll2.addOrder(stu4);
    sll2.addOrder(stu5);
    sll2.addOrder(stu6);
    System.out.println(sll2);
    System.out.println("\n---------------------------\n");
    // 3. 将有序链表2 合并到 有序链表1 ，并将其打印
    sll.mergeOrder(sll2);
    System.out.println(sll);
}
```

**运行结果**
