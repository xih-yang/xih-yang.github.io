# 02、数据结构和算法 - 实战：Java实现单向链表
- 来源：https://ddkk.com/zhuanlan/algorithm/8/2.html
- 分类：数据结构
- 分组：教程目录
## 1.1 什么是单向链表

单向链表（单链表）是链表的一种，其特点是链表的链接方向是单向的，对链表的访问要通过顺序读取从头部开始；链表是使用指针进行构造的列表；又称为结点列表，因为链表是由一个个结点组装起来的；其中每个结点都有指针成员变量指向列表中的下一个结点；

链表是由结点构成，head指针指向第一个成为表头结点，而终止于最后一个指向NULL的指针。

**1、** Data域–存放结点值的数据域；

**2、** Next域–存放结点的直接后继的地址（位置）的指针域（链域）；

链表通过每个结点的链域将线性表的n个结点按其逻辑顺序链接在一起的，每个结点只有一个链域的链表称为单链表（Single Linked List）。

## 1.2 JAVA实现单向链表

CustomLinkedList类是一个自定义实现了单向链表。

```java
package com.yuanxw.datastructure.chapter2;
/**
 * 自定义单向链表CustomLinkedList
 */
public class CustomLinkedList<E> {
    // 第一个节点元素
    private Node first;
    // 自定义LinkedList大小
    private int size;
    public CustomLinkedList() {
    }
    public CustomLinkedList(E element) {
        this.addFirst(element);
    }
    public CustomLinkedList(E ...element) {
        this.of(element);
    }
    /**
     * 单向链表Node结构
     *
     * @param <E>
     */
    private class Node<E> {
        // Node节点value值
        private E value;
        // 下一个Node节点
        private Node<E> next;
    }
    /**
     * 是否是空
     *
     * @return
     */
    private boolean isEmpty() {
        return size == 0;
    }
    /**
     * 添加元素
     *
     * @param element
     * @return
     */
    public boolean addFirst(E element) {
        final Node<E> newNode = new Node<>();
        newNode.value = element;
        newNode.next = first;
        this.first = newNode;
        this.size++;
        return true;
    }
    /**
     * 添加多个元素
     *
     * @param elements
     * @return
     */
    private boolean of(E... elements) {
        if (elements.length > 0) {
            for (E element : elements) {
                addFirst(element);
            }
        }
        return true;
    }
    /**
     * 删除元素
     *
     * @return
     */
    private boolean removeFirst() {
        return this.remove((E) this.first.value);
    }
    /**
     * 删除指定元素
     *
     * @return
     */
    private boolean remove(E element) {
        // 当前节点元素为初始值为：第一个元素
        Node currentNode = this.first;
        // 上一级元素Node节点
        Node previousNode = null;
        while (currentNode != null) {
            if (currentNode.value.equals(element)) {
                /**
                 * 如果指定元素出现在第一个位置，将下一个元素赋值到第一个位置。
                 * 否则将当前上一级元素Node节点的，下一个元素指向当前元素的下一个元素，跳过当前删除元素。
                 */
                if (previousNode == null) {
                    this.first = currentNode.next;
                } else {
                    previousNode.next = currentNode.next;
                }
                size--;
                return true;
            }
            previousNode = currentNode;
            currentNode = currentNode.next;
        }
        return false;
    }
    /**
     * 判断是否包含
     *
     * @return
     */
    private boolean contains(E element) {
        Node<E> currentNode = this.first;
        while (currentNode != null) {
            if (currentNode.value.equals(element)) {
                return true;
            }
            currentNode = currentNode.next;
        }
        return false;
    }
    /**
     * 获得第一个元素
      * @return
     */
    private E getFirst(){
        return (E) this.first.value;
    }
    /**
     * 获得最后一个元素
     * @return
     */
    private E getLast(){
        E element = null;
        Node<E> currentNode = this.first;
        while (currentNode != null) {
            element = currentNode.value;
            currentNode = currentNode.next;
        }
        return element;
    }
    private void clear(){
        Node<E> currentNode = this.first;
        while (currentNode != null) {
            Node<E> nextNode = currentNode.next;
            currentNode.value = null;
            currentNode.next = null;
            currentNode = nextNode;
        }
        this.first = null;
        this.size = 0;
    }
    /**
     * 元素反转
     *
     * @return
     */
    public CustomLinkedList reverse() {
        Node<E> currentNode = this.first;
        Node<E> prevNode = new Node<E>();
        while (currentNode != null) {
            // 临时变量，保存currentNode的下一个节点
            Node<E> nextNode = currentNode.next;
            // currentNode的下一个节点，放到reverseNode放置到最前端
            currentNode.next = prevNode.next;
            // 将prevNode节点与之前的节点相连接
            prevNode.next = currentNode;
            // 节点后移
            currentNode = nextNode;
        }
        CustomLinkedList customLinkedList = new CustomLinkedList();
        customLinkedList.first = prevNode.next;
        customLinkedList.size = this.size;
        return customLinkedList;
    }
    /**
     * 重写toString方法，方便显示
     *
     * @return
     */
    @Override
    public String toString(){
        StringBuffer buffer = new StringBuffer();
        if (this.isEmpty()) {
            buffer.append("[]");
            return buffer.toString();
        }
        buffer.append("[");
        Node<E> currentNode = this.first;
        while (currentNode != null) {
            buffer.append(currentNode.value).append(",");
            currentNode = currentNode.next;
        }
        buffer.deleteCharAt(buffer.length() - 1);
        buffer.append("]");
        return buffer.toString();
    }
    public static void main(String[] args) {
        CustomLinkedList customLinkedList = new CustomLinkedList();
        customLinkedList.of("Kafka","Cassandra","Redis");
        customLinkedList.addFirst("HBase");
        customLinkedList.addFirst("Neo4j");
        System.out.println("统计自定义链表customLinkedList对象节点元素个数："+customLinkedList.size);
        System.out.println("列出customLinkedList对象所有节点元素：" + customLinkedList);
        System.out.println("------------------------------------------------------------------------------------");
        System.out.println("获得第一个元素: " + customLinkedList.getFirst());
        System.out.println("获得第最后一个元素: " + customLinkedList.getLast());
        System.out.println("判断列表是否包含HBase这个元素:" + customLinkedList.contains("HBase"));
        System.out.println("------------------------------------------------------------------------------------");
        System.out.println("删除第一个元素Neo4j: " + customLinkedList.removeFirst());
        System.out.println("查看列出customLinkedList对象所有节点元素：" + customLinkedList);
        System.out.println("------------------------------------------------------------------------------------");
        System.out.println("删除指定元素Cassandra: " + customLinkedList.remove("Cassandra"));
        System.out.println("查看列出customLinkedList对象所有节点元素：" + customLinkedList);
        System.out.println("------------------------------------------------------------------------------------");
        CustomLinkedList reverseCustomLinkedList = customLinkedList.reverse();
        System.out.println("查看翻转后列出reverseCustomLinkedList对象所有节点元素：" + reverseCustomLinkedList);
        System.out.println("------------------------------------------------------------------------------------");
        customLinkedList.clear();
        System.out.println("清空customLinkedList对象所有节点元素：" + customLinkedList);
        System.out.println("-------------------------------遍历操作----------------------------------------------");
        long start = System.currentTimeMillis();
        for (int i = 0; i < 100000; i++) {
            customLinkedList.addFirst(i);
        }
        long end = System.currentTimeMillis();
        System.out.println("customLinkedList对象，添加元素，调用addFirst()方法，耗时：" + (end - start) + " 毫秒。");
        start = System.currentTimeMillis();
        for (int i = 0; i < customLinkedList.size; i++) {
            customLinkedList.removeFirst();
        }
        end = System.currentTimeMillis();
        System.out.println("customLinkedList对象，添加元素，调用removeFirst()方法，耗时：" + (end - start) + " 毫秒。");
    }
}
```

执行结果：

```java
统计自定义链表customLinkedList对象节点元素个数：5
列出customLinkedList对象所有节点元素：[Neo4j,HBase,Redis,Cassandra,Kafka]
------------------------------------------------------------------------------------
获得第一个元素: Neo4j
获得第最后一个元素: Kafka
判断列表是否包含HBase这个元素:true
------------------------------------------------------------------------------------
删除第一个元素Neo4j: true
查看列出customLinkedList对象所有节点元素：[HBase,Redis,Cassandra,Kafka]
------------------------------------------------------------------------------------
删除指定元素Cassandra: true
查看列出customLinkedList对象所有节点元素：[HBase,Redis,Kafka]
------------------------------------------------------------------------------------
查看翻转后列出reverseCustomLinkedList对象所有节点元素：[Kafka,Redis,HBase]
------------------------------------------------------------------------------------
清空customLinkedList对象所有节点元素：[]
-------------------------------遍历操作----------------------------------------------
customLinkedList对象，添加元素，调用addFirst()方法，耗时：7 毫秒。
customLinkedList对象，添加元素，调用removeFirst()方法，耗时：9 毫秒。
```
