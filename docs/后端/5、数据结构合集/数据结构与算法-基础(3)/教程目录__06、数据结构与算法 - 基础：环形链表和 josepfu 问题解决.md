# 06、数据结构与算法 - 基础：环形链表和 josepfu 问题解决
- 来源：https://ddkk.com/zhuanlan/algorithm/4/6.html
- 分类：数据结构
- 分组：教程目录
## 构建环形链表思路

- 创建第一个节点，first 指向该节点，并形成环装
- 每创建一个新的节点，将该节点加入到已有的环形链表中

## 遍历环形链表

- 先让一个辅助指针指向 first 节点
- 然后通过一个 while 循环遍历该环形链表知道 辅助指针的 next 下一个节点 == first 结束

## Josepfu 问题

> josepfu 问题为：设编号为 1,2,……n 个人围坐一圈，约定编号为 k（1  使用一个不带头结点的循环链表来处理，首先构成一个有 n 个节点的单循环链表，然后由 k 节点起从 1 开始计数，计数到 m 时，对应节点从链表中删除，然后再从被删除节点的下一个节点又从 1 开始计数，知道所有节点都从链表中删除为止

- 创建一个辅助指针 helper，指向环形链表的最后的节点，每次报数前 让 first 和 helper 移动k 开始节点 - 1 次
- 报数时，让 first 和 helper 节点 同时移动 m 计数次数 - 1 次
- 将 first 指向的节点出列，first = first.next helper = helper.next原来 first 节点失去引用回收

## josepfu 问题代码实现

```java
package com.sqdkk.linkedList;
public class Josepfu {
    public static void main(String[] args) {
        // 构建环形链表
        CircleSingleLinked circleSingleLinked = new CircleSingleLinked();
        circleSingleLinked.addNode(20);
        //        circleSingleLinked.list();
        System.out.println("开始出列");
        circleSingleLinked.countNode(1, 5, 5);
    }
}
// 创建环形单向链表
class CircleSingleLinked {
    private Node first; // 创建一个 first 节点
    // 添加节点，构建环形链表
    public void addNode(int nums) {
        if (nums < 1) {
      // 判断节点数量，链表是否为空
            System.out.println("number 的值应该大于 1");
            return;
        }
        Node curNode = null; // 辅助指针，帮助构建环形链表
        for (int i = 1; i <= nums; i++) {
            Node node = new Node(i); // 根据编号创建节点
            if (i == 1) {
      // 如果是第一个节点
                first = node; // 设置第一个节点
                first.setNext(first); // 形成环形链表
                curNode = first; // 当前 curNode 指向 first 节点
            } else {
                curNode.setNext(node); // 最后一个节点的下一个节点指向 node
                node.setNext(first); // node 的下一个节点指向 first 形成环状
                curNode = node; // curNode 指向 node 最后一个节点
            }
        }
    }
    // 遍历当前环形链表
    public void list(){
        if (first == null) {
            System.out.println("链表为空");
            return;
        }
        Node curNode = first;
        while (true) {
            System.out.printf("Node 节点编号为 %d\n", curNode.getNo());
            if (curNode.getNext() == first) {
      // 当前节点的 next 后一个节点为第一个节点的话
                break;
            }
            curNode = curNode.getNext(); // 当前节点指针后移
        }
    }
    /**
     *
     * josepfu 问题为：
     * 设编号为 1,2,……n 个人围坐一圈
     * 约定编号为 k（1 <= k <= n）的人从 1 开始报数，数到 m 的人出列
     * 下一位又从 1 开始报数，数到 m 的人又出列，直到所有的人都出列为止
     *
     * 根据输入计算出列顺序
     *
     * @param startNo   开始节点位置
     * @param countNum  表示数几下
     * @param nums      标识开始时有多少节点
     */
    public void countNode(int startNo, int countNum, int nums) {
        // 参数校验
        if (first == null) {
      // 判断链表是否为空
            System.out.println("链表为空");
            return;
        }
        if (startNo < 1 || startNo > nums) {
      // 开始位置要大于 1，并且开始位置要小于节点的总数量
            System.out.println("参数错误，请注意开始位置与节点总数量");
            return;
        }
        Node helper = first; // 创建辅助指针，帮助完成出列
        while (true) {
            // 如果 helper 下一个节点指向 first 节点，为最后一个节点
            if (helper.getNext() == first) {
                break;
            }
            helper = helper.getNext();
        }
        // 报数前，先让 first 和 helper 移动 startNo - 1 次
        for (int i = 0; i < startNo - 1; i++) {
            first = first.getNext();
            helper = helper.getNext();
        }
        // 报数时，first 和 helper 指针同时移动 countNum - 1 次，然后出列
        while (true) {
            if (helper == first) {
      // 圈中只有一个节点，退出循环
                break;
            }
            for (int i = 0; i < countNum - 1; i++) {
                first = first.getNext();
                helper = helper.getNext();
            }
            System.out.printf("节点 %d 出列\n", first.getNo());
            // first 节点指向的节点出列
            first = first.getNext();
            helper.setNext(first);
        }
        System.out.printf("最后留在圈中的节点为：%d\n", first.getNo());
    }
}
// 创建一个 Node 节点
class Node{
    private int no; // 编号
    private Node next; // 下一个节点
    public Node(int no) {
        this.no = no;
    }
    public int getNo() {
        return no;
    }
    public void setNo(int no) {
        this.no = no;
    }
    public Node getNext() {
        return next;
    }
    public void setNext(Node next) {
        this.next = next;
    }
}
```
