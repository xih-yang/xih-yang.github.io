# 05、数据结构和算法 - 实战：Java实现双向链表
- 来源：https://ddkk.com/zhuanlan/algorithm/8/5.html
- 分类：数据结构
- 分组：教程目录
## 1.1 什么是双向链表

双向链表也叫双链表，是链表的一种，它的每个数据结点中都有两个指针，分别指向直接后继和直接前驱。所以，从双向链表中的任意一个结点开始，都可以很方便地访问它的前驱结点和后继结点。一般我们都构造双向循环链表。

**1、** value域–存放结点值的数据域；

**2、** prev域–存放结点的直接**前继的地址**（位置）的指针域（链域）；

**3、** next域–存放结点的直接**后继的地址**（位置）的指针域（链域）；

双向链表是通过上述定义的结点使用 prev 以及 next 域依次串联在一起而形成的。

## 1.2 JAVA实现双向链表

CustomDoublyLinkedList类是一个自定义实现了双向链表。

```java
package com.yuanxw.datastructure.chapter5;
/**
 * 自定义双向链表
 * @param <E>
 */
public class CustomDoublyLinkedList<E> {
    /**
     * Node数据结构
     * Node内部类，外部无法访问
     *
     * @param <E>
     */
    private static class Node<E> {
        // Node节点value值
        private E value;
        // 上一个Node节点
        private Node<E> prev;
        // 下一个Node节点
        private Node<E> next;
    }
    // 头节点元素
    private Node<E> first;
    // 尾节点元素
    private Node<E> last;
    // 自定义LinkedList大小
    private int size;
    /**
     * 添加头节点元素
     *
     * @param element
     * @return
     */
    public boolean addFirst(E element) {
        Node newNode = new Node();
        newNode.value = element;
        newNode.next = first;
        if (isEmpty()) {
            last = newNode;
            first = newNode;
        } else {
            first.prev = newNode;
            newNode.next = first;
        }
        first = newNode;
        size++;
        return true;
    }
    /**
     * 向尾节点添加元素
     * @param element
     * @return
     */
    public boolean addLast(E element) {
        Node newNode = new Node();
        newNode.value = element;
        if (isEmpty()) {
            last = newNode;
            first = newNode;
        } else {
            newNode.prev = last;
            last.next = newNode;
        }
        last = newNode;
        size++;
        return true;
    }
    /**
     * 获得最后一个元素
     * @return
     */
    public E getLast(){
        return last.value;
    }
    /**
     * 获得第一个元素
     * @return
     */
    public E getFirst(){
        return first.value;
    }
    /**
     * 判断是否为空
     *
     * @return
     */
    public boolean isEmpty() {
        return size == 0;
    }
    /**
     * 是否包含指定元素
     * @param element
     * @return
     */
    private boolean contains(E element) {
        Node<E> currentNode = this.first;
        while (currentNode != null){
            if(currentNode.value.equals(element)){
                return true;
            }
            currentNode = currentNode.next;
        }
        return false;
    }
    /**
     * 获得指定元素的下一个元素
     * @param element
     * @return
     */
    private E getNext(E element){
        Node<E> currentNode = this.first;
        while (currentNode != null){
            if(currentNode.value.equals(element) && currentNode.next != null){
                return currentNode.next.value;
            }
            currentNode = currentNode.next;
        }
        return null;
    }
    /**
     * 获得指定元素的上一个元素
     * @param element
     * @return
     */
    private E getPrev(E element){
        Node<E> currentNode = this.first;
        while (currentNode != null){
            if(currentNode.value.equals(element)){
                return currentNode.prev.value;
            }
            currentNode = currentNode.next;
        }
        return null;
    }
    /**
     * 删除指定元素
     * @param element
     * @return
     */
    public boolean remove(E element){
        Node<E> currentNode = this.first;
        boolean flag = false;
        while (currentNode != null){
            if(currentNode.value.equals(element)){
                currentNode.prev.next = currentNode.next;
                currentNode.next.prev = currentNode.prev;
                flag = true;
            }
            currentNode = currentNode.next;
        }
        return flag;
    }
    /**
     * 重写toString方法，方便显示
     *
     * @return
     */
    @Override
    public String toString() {
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
        CustomDoublyLinkedList customDoublyLinkedList = new CustomDoublyLinkedList();
        System.out.println("addLast()添加链表头节点元素【西直门】: " + customDoublyLinkedList.addLast("西直门"));
        System.out.println("addLast()添加链表头节点元素【鼓楼大街】: " + customDoublyLinkedList.addLast("鼓楼大街"));
        System.out.println("addLast()添加链表头节点元素【安定门】: " + customDoublyLinkedList.addLast("安定门"));
        System.out.println("addLast()添加链表头节点元素【东直门】: " + customDoublyLinkedList.addLast("东直门"));
        System.out.println("addLast()添加链表头节点元素【东四十条】: " + customDoublyLinkedList.addLast("东四十条"));
        System.out.println("------------------------------------------------------------------------------------");
        System.out.println("addFirst()添加链表头节点元素【车公庄】: " + customDoublyLinkedList.addFirst("车公庄"));
        System.out.println("addFirst()添加链表头节点元素【阜成门】: " + customDoublyLinkedList.addFirst("阜成门"));
        System.out.println("addFirst()添加链表头节点元素【复兴门】: " + customDoublyLinkedList.addFirst("复兴门"));
        System.out.println("------------------------------------------------------------------------------------");
        System.out.println("getFirst()获得第一个元素: " + customDoublyLinkedList.getFirst());
        System.out.println("getLast()获得第最后一个元素: " + customDoublyLinkedList.getLast());
        System.out.println("------------------------------------------------------------------------------------");
        System.out.println("查看列出customDoublyLinkedList对象所有节点元素：" + customDoublyLinkedList);
        System.out.println("getPrev()指定【阜成门】元素上一个元素: " + customDoublyLinkedList.getPrev("阜成门"));
        System.out.println("getNext()指定【阜成门】元素下一个元素: " + customDoublyLinkedList.getNext("阜成门"));
        System.out.println("------------------------------------------------------------------------------------");
        System.out.println("remove()删除指定元素【东四十条】: " + customDoublyLinkedList.remove("安定门"));
        System.out.println("查看列出customDoublyLinkedList对象所有节点元素：" + customDoublyLinkedList);
        System.out.println("------------------------------------------------------------------------------------");
    }
}
```

执行结果：

```java
addLast()添加链表头节点元素【西直门】: true
addLast()添加链表头节点元素【鼓楼大街】: true
addLast()添加链表头节点元素【安定门】: true
addLast()添加链表头节点元素【东直门】: true
addLast()添加链表头节点元素【东四十条】: true
------------------------------------------------------------------------------------
addFirst()添加链表头节点元素【车公庄】: true
addFirst()添加链表头节点元素【阜成门】: true
addFirst()添加链表头节点元素【复兴门】: true
------------------------------------------------------------------------------------
getFirst()获得第一个元素: 复兴门
getLast()获得第最后一个元素: 东四十条
------------------------------------------------------------------------------------
查看列出customDoublyLinkedList对象所有节点元素：[复兴门,阜成门,车公庄,西直门,鼓楼大街,安定门,东直门,东四十条]
getPrev()指定【阜成门】元素上一个元素: 复兴门
getNext()指定【阜成门】元素下一个元素: 车公庄
------------------------------------------------------------------------------------
remove()删除指定元素【东四十条】: true
查看列出customDoublyLinkedList对象所有节点元素：[复兴门,阜成门,车公庄,西直门,鼓楼大街,东直门,东四十条]
------------------------------------------------------------------------------------
```
