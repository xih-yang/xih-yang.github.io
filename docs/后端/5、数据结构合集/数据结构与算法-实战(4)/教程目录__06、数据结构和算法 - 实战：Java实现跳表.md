# 06、数据结构和算法 - 实战：Java实现跳表
- 来源：https://ddkk.com/zhuanlan/algorithm/8/6.html
- 分类：数据结构
- 分组：教程目录
## 1.1 什么是跳表（Skip List）

跳表确实是一种性能比较优秀的动态数据结构，跳表(skip list) 对标的是平衡树(AVL Tree)，是一种 插入/删除/搜索 都是 O(log n) 的数据结构。它最大的优势是原理简单、容易实现、方便扩展、效率更高。因此在一些热门的项目里用来替代平衡树，如 redis, leveldb 等。跳表的数据结构模型如图：

前置条件：跳表处理的是有序的链表

这个链表中，如果要搜索一个数，需要从头到尾比较每个元素是否匹配，直到找到匹配的数为止，即时间复杂度是 O(n)。同理，插入一个数并保持链表有序，需要先找到合适的插入位置，再执行插入，总计也是 O(n) 的时间。

添加索引，提高搜索的速度

我们新创建一个链表，它包含的元素为前一个链表的若干元素。这样在搜索一个元素时，我们先在上层链表进行搜索，当元素未找到时再到下层链表中搜索。例如搜索数字120时的路径，Head->60->90->120

先在上层中搜索，到达节点 90 时发现下一个节点为 170，已经大于 120，于是转到下一层搜索，找到的目标数字 120。

多级索引，提高搜索的速度

在三层链表中搜索 250，在最上层搜索时就可以直接跳过 170 之前的所有节点，因此十分高效。

如果有 k 层，我们需要的搜索次数会小于 ⌈n2k⌉+k ，这样当层数 k 增加到 ⌈log2n⌉ 时，搜索的时间复杂度就变成了 logn。其实这背后的原理和二叉搜索树或二分查找很类似，通过索引来跳过大量的节点，从而提高搜索效率。

## 1.2 JAVA实现跳表

CustomLinkedList类是一个自定义实现了单向链表。

```java
package com.yuanxw.datastructure.chapter2;
import java.util.Random;
/**
 * 跳表（Skip List）CustomSkipList
 */
public class CustomSkipList {
    // 头节点
    private Node head;
    // 尾节点
    private Node tail;
    // 大小
    private int size;
    // 层高
    private int hight;
    // 随机数：使用long参数的所有64位作为因子值。
    private static Random random = new Random(System.currentTimeMillis());
    // 构造函数
    public CustomSkipList() {
        // 初化化==>头尾节点
        head = new Node(Integer.MIN_VALUE, NodeTypeEnum.HEAD_NODE);
        tail = new Node(Integer.MAX_VALUE, NodeTypeEnum.TAIL_NODE);
        /**
         * 建立两端关系：
         * head ---> tail
         * head <--- tail
         */
        head.rightNode = tail;
        tail.leftNode = head;
    }
    /**
     * 查询元素
     *
     * @param element
     * @return
     */
    public Node find(Integer element) {
        if (element == null) {
            throw new RuntimeException("要查询的元素值不能为空！");
        }
        Node current = this.head;
        // 只要不满足条件，则一直查找。
        while (true) {
            // 从节点最左侧向右查找
            while (current.rightNode.nodeType != NodeTypeEnum.TAIL_NODE && current.rightNode.value <= element) {
                current = current.rightNode;
            }
            // 从节点下向下查找
            if (current.downNode != null) {
                current = current.downNode;
            } else {
                break;
            }
        }
        // 返回查询结果
        return current;
    }
    /**
     * 添加元素
     *
     * @param element
     * @return
     */
    public boolean add(Integer element) {
        // 获近似值 Node
        Node nearNode = this.find(element);
        // 新建 Node
        Node newNode = new Node(element);
        /**
         * 建立【nearNode】和【newNode】之间的关系：
         * x --> y--> z
         *
         * x ---> y
         * x <--- y
         * y ---> z
         * y <--- z
         */
        newNode.leftNode = nearNode;
        newNode.rightNode = nearNode.rightNode;
        nearNode.rightNode.leftNode = newNode;
        nearNode.rightNode = newNode;
        int currentLevel = 0;
        // 生成的随机数，小于0.3，则创建索引。索引层数 + 1
        while (random.nextDouble() < 0.3) {
            // 当前等级，大于总高，需要进行升级
            if (currentLevel >= hight) {
                Node newHead = new Node(Integer.MIN_VALUE, NodeTypeEnum.HEAD_NODE);
                Node newTail = new Node(Integer.MAX_VALUE, NodeTypeEnum.TAIL_NODE);
                newHead.rightNode = newTail;
                newHead.downNode = head;
                head.upNode = newHead;
                newTail.leftNode = newHead;
                newTail.downNode = tail;
                tail.upNode = newTail;
                head = newHead;
                tail = newTail;
                hight++;
            }
            // 从近似值向左可找，上级索引有空，就可以添加索引
            while ((nearNode != null) && nearNode.upNode == null) {
                nearNode = nearNode.leftNode;
            }
            nearNode = nearNode.upNode;
            // 建立【nearNode】和【upNode】之间上下左右的关系：
            Node upNode = new Node(element);
            upNode.leftNode = nearNode;
            upNode.rightNode = nearNode.rightNode;
            upNode.downNode = newNode;
            nearNode.rightNode.leftNode = upNode;
            nearNode.rightNode = upNode;
            newNode.upNode = upNode;
            // 连续提多层,newNode增赋给upNoe变成上一级的新Node
            currentLevel++;
            newNode = upNode;
        }
        // 元素个数 + 1
        size++;
        return true;
    }
    /**
     * 删除元素
     *
     * @param element
     * @return
     */
    public boolean remove(Integer element) {
        // 获近似值 Node
        Node nearNode = this.find(element);
        if (nearNode.value != element.intValue()) {
            return true;
        }
        while (nearNode != null) {
            // 删除操作
            nearNode.leftNode.rightNode = nearNode.rightNode;
            nearNode.rightNode.leftNode = nearNode.leftNode;
            nearNode.downNode = null;
            // 删除上下两边关系
            Node upNode = nearNode.upNode;
            nearNode.upNode = null;
            nearNode = upNode;
        }
        return true;
    }
    /**
     * 清空元素
     *
     * @return
     */
    public boolean clear() {
        Node current = this.head;
        for (int i = hight; i >= 0; i--) {
            Node rightNode = current;
            while (rightNode != null && rightNode.nodeType != NodeTypeEnum.TAIL_NODE){
                Node nextNode = rightNode.rightNode;
                rightNode.rightNode = null;
                rightNode = nextNode.rightNode;
            }
            current = current.downNode;
        }
        hight = 0;
        return true;
    }
    /**
     * 是否包含
     *
     * @param element
     * @return
     */
    public boolean contains(Integer element) {
        // 返回的近似值是否等于传过来的值。
        Node nearNode = this.find(element);
        return nearNode.value == element.intValue();
    }
    /**
     * 是否为空
     *
     * @return
     */
    public boolean isEmpty() {
        return size == 0;
    }
    /**
     * 打印跳表中的数据
     */
    public void printCustomSkipList() {
        System.out.println("===============================打印跳表数据集==开始=============================");
        Node current = this.head;
        for (int i = hight; i >= 0; i--) {
            System.out.print(String.format("总索引高度为：【%s】当前高度【%s】当前数据：", hight, i));
            Node right = current.rightNode;
            while (right != null && right.nodeType == NodeTypeEnum.DATA_NODE) {
                System.out.print(String.format("-->【%s】", right.value));
                right = right.rightNode;
            }
            System.out.println("");
            current = current.downNode;
        }
        System.out.println("===============================打印跳表数据集==结束=============================");
    }
    /**
     * 获得node中value值
     *
     * @param node
     * @return
     */
    public static Integer getNodeValue(Node node) {
        if (node != null) {
            return node.value;
        }
        return null;
    }
    /**
     * 节点类型
     **/
    private enum NodeTypeEnum {
        // 节点类型：头节点
        HEAD_NODE,
        // 节点类型：数据节点
        DATA_NODE,
        // 节点类型：尾节点
        TAIL_NODE
    }
    /**
     * 定义跳表数据结构
     */
    private class Node {
        // 数据值
        private Integer value;
        // 数据类型
        private NodeTypeEnum nodeType;
        // 上下左右节点
        private Node upNode;
        private Node downNode;
        private Node leftNode;
        private Node rightNode;
        /**
         * 定义构函数
         *
         * @param value
         */
        public Node(Integer value) {
            this(value, NodeTypeEnum.DATA_NODE);
        }
        public Node(Integer value, NodeTypeEnum nodeType) {
            this.value = value;
            this.nodeType = nodeType;
        }
    }
    public static void main(String[] args) {
        CustomSkipList customSkipList = new CustomSkipList();
        System.out.println("跳表中是否为空：" + customSkipList.isEmpty());
        customSkipList.add(196);
        System.out.println("跳表中是否为空：" + customSkipList.isEmpty());
        customSkipList.add(286);
        System.out.println("=================================向跳表中添加随机数===============================");
        for (int i = 0; i < 10; i++) {
            int ram = random.nextInt(5000);
            System.out.println(String.format("向跳表中添加随机数为：【%s】", ram));
            customSkipList.add(ram);
        }
        customSkipList.printCustomSkipList();
        System.out.println("查找是否存在元素【196】：" + customSkipList.contains(196));
        Node findNode = customSkipList.find(286);
        System.out.println(String.format("查找跳表中【286】元素相邻元素：上：【%s】,下：【%s】，左：【%s】,右：【%s】",
                getNodeValue(findNode.upNode),
                getNodeValue(findNode.downNode),
                getNodeValue(findNode.leftNode),
                getNodeValue(findNode.rightNode)));
        System.out.println("remove()方法，删除跳表中【286】元素：" + customSkipList.remove(286));
        customSkipList.printCustomSkipList();
        System.out.println("clear()方法，清空跳表中所有元素：" + customSkipList.clear());
        customSkipList.printCustomSkipList();
    }
}
```

执行结果：

```java
跳表中是否为空：true
跳表中是否为空：false
=================================向跳表中添加随机数===============================
向跳表中添加随机数为：【2857】
向跳表中添加随机数为：【4749】
向跳表中添加随机数为：【1991】
向跳表中添加随机数为：【3266】
向跳表中添加随机数为：【887】
向跳表中添加随机数为：【148】
向跳表中添加随机数为：【2920】
向跳表中添加随机数为：【1649】
向跳表中添加随机数为：【2475】
向跳表中添加随机数为：【4276】
===============================打印跳表数据集==开始=============================
总索引高度为：【2】当前高度【2】当前数据：-->【2475】
总索引高度为：【2】当前高度【1】当前数据：-->【148】-->【2475】-->【3266】-->【4749】
总索引高度为：【2】当前高度【0】当前数据：-->【148】-->【196】-->【286】-->【887】-->【1649】-->【1991】-->【2475】-->【2857】-->【2920】-->【3266】-->【4276】-->【4749】
===============================打印跳表数据集==结束=============================
查找是否存在元素【196】：true
查找跳表中【286】元素相邻元素：上：【null】,下：【null】，左：【196】,右：【887】
remove()方法，删除跳表中【286】元素：true
===============================打印跳表数据集==开始=============================
总索引高度为：【2】当前高度【2】当前数据：-->【2475】
总索引高度为：【2】当前高度【1】当前数据：-->【148】-->【2475】-->【3266】-->【4749】
总索引高度为：【2】当前高度【0】当前数据：-->【148】-->【196】-->【887】-->【1649】-->【1991】-->【2475】-->【2857】-->【2920】-->【3266】-->【4276】-->【4749】
===============================打印跳表数据集==结束=============================
clear()方法，清空跳表中所有元素：true
===============================打印跳表数据集==开始=============================
总索引高度为：【0】当前高度【0】当前数据：
===============================打印跳表数据集==结束=============================
```
