# 07、数据结构与算法 - 基础：栈 Stack
- 来源：https://ddkk.com/zhuanlan/algorithm/4/7.html
- 分类：数据结构
- 分组：教程目录
## 1、栈简介

**1、** 栈（Stack）是一个先进后出的有序列表；

**2、** 栈是限制线性表中元素的插入和删除只能在线性表的同一端进行的一种特殊线性表允许插入和删除的一端为变化的一端，成为栈顶（Top），另一端为固定的一端，称为栈底（Bottom）；

**3、** 根据栈的定义，最先放入栈的元素在栈底，最后放入的元素在栈顶，删除元素刚好想反，最后放入的元素最先删除，最先放入的元素最后删除；

**4、** 出栈（pop）和入栈（push）；

## 2、应用场景

**1、** 子程序的调用，在跳往子程序前，先将下个指令的地址存入栈中，直到子程序执行完后再将地址取出，回到原来的程序中；

**2、** 处理递归调用：和子程序的调用类似，除了存储下一个指令的地址外，也将参数、区域变量等数据存入堆栈中；

**3、** 表达式的转化（中缀表达式转后缀表达式）与求值；

**4、** 二叉树的遍历；

**5、** 图形的深度优先（depth-first）搜索法；

## 3、栈思路分析

> 使用数组进行模拟
>
> 定义一个 Top 来表示栈顶，初始化为 -1
>
> 有数据入栈时，top++，stack[top] = data
>
> 出栈：int value = stack[top]; top–，return value

## 4、栈 Java 代码实现

### 4.1 数组模拟栈

```java
public class ArrayStackDemo {
    public static void main(String[] args) {
        ArrayStack arrayStack = new ArrayStack(5);
        arrayStack.push(1);
        arrayStack.push(56);
        arrayStack.push(45);
        arrayStack.push(46);
        arrayStack.list();
        arrayStack.pop();
        arrayStack.pop();
        arrayStack.list();
    }
}
class ArrayStack{
    public int maxSize; // 栈的大小
    public int[] stack; // 栈
    public int top = -1; // 栈顶
    // 构造
    public ArrayStack(int maxSize) {
        this.maxSize = maxSize;
        stack = new int[maxSize];
    }
    // 判断栈是否为空
    public boolean isEmpty(){
        return top == -1;
    }
    // 判断栈是否满
    public boolean isFull(){
        return top == maxSize - 1;
    }
    // 入栈 push
    public void push(int value){
        if(isFull()) {
            System.out.println("栈已满，无法进行入栈操作");
            return;
        }
        top ++;
        stack[top] = value;
    }
    // 出栈 pop
    public void pop(){
        if (isEmpty()) {
            throw new RuntimeException("栈内没有数据");
        }
        int value = stack[top];
        top --;
        System.out.printf("数据%d已出栈\n", value);
    }
    // 遍历，从栈顶开始展示数据
    public void list(){
        if (isEmpty()) {
            System.out.println("栈内有没数据");
            return;
        }
        for (int i = top; i >= 0; i--) {
            System.out.printf("stack[%d] = %d\n", i, stack[i]);
        }
    }
}
```

### 4.2 链表模拟栈

```java
public class LinkedListStackDemo {
    public static void main(String[] args) {
        LinkedStack linkedStack = new LinkedStack();
        linkedStack.push(new Node(1));
        linkedStack.push(new Node(2));
        linkedStack.push(new Node(3));
        linkedStack.push(new Node(4));
        linkedStack.push(new Node(5));
        System.out.printf("当前栈的大小为：%d\n", linkedStack.getSize());
        linkedStack.list();
        System.out.println("取出栈顶的数据后：");
        linkedStack.pop();
        linkedStack.list();
    }
}
// 链表实现，单链表从头部插入数据删除数据
class LinkedStack{
    private Node head; // 头结点
    private int size; // 栈的大小
    // 构造
    public void LinkedStack(){
        this.size = -1;
        this.head = null;
    }
    // 是否为空
    public boolean isEmpty(){
        return size < 0;
    }
    // 获取链表长度
    public int getSize(){
        return size;
    }
    // 插入数据
    public void push(Node node){
        if (head == null) {
      // 如果头结点为空，链表没有数据，node 赋值给 head 节点
            head = node;
        } else {
            node.next = head; // 头结点作为插入节点的下一个节点
            head = node; // 插入节点成为头结点
        }
        size ++; // 链表长度增加
    }
    // pop 取出数据
    public Object pop(){
        if (head == null) {
            System.out.println("链表内没有数据");
        }
        if (head.next == null) {
      // 头结点下一个节点是否为空，取出头结点
            head = null; // 将头结点赋值为 null
            size --; // 链表长度 －1
            return head.data;
        } else {
            head = head.next; // 头结点的下一个节点赋值给头节点
            size --; // 链表长度减一
            return head.data;
        }
    }
    // 打印栈内所有数据
    public void list() {
        if (isEmpty()) {
      // 判断是否为空
            System.out.println("栈内没有数据~");
            return;
        }
        Node temp = head;
        while (true) {
      // 循环打印栈
            if (temp == null) {
      // 栈内没有数据
                break;
            }
            System.out.printf("%d\n", temp.data);
            temp = temp.next; // temp 等于下一个节点
        }
    }
}
// 链表节点 Node
class Node{
    public Object data; // 节点数据
    public Node next; // 下一个节点
    public Node(Object data) {
        this.data = data;
    }
}
```
