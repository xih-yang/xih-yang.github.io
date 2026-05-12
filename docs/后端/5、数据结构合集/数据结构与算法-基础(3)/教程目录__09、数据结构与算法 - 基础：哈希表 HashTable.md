# 09、数据结构与算法 - 基础：哈希表 HashTable
- 来源：https://ddkk.com/zhuanlan/algorithm/4/9.html
- 分类：数据结构
- 分组：教程目录
## 1、哈希表（Hash Table）（散列）简介

> 哈希表（Hash table，也叫散列表）是一个数据结构，是根据关键码值（key - value）而直接访问在内存存储位置的数据结构。
>
> 哈希表通过把关键码值映射到表中一个位置来访问记录，以加快查找的速度。
>
> 这个映射函数叫做散列函数，存放记录的数组叫做散列表
>
> 哈希表中元素由哈希函数确定，将数据元素的关键字 key 作为自变量，通过一定的函数关系（哈希函数），计算出的值，即为该元素的存储地址
>
> 哈希表本质上是个数组，区别在于数组中一般存放单一数据，而哈希表中存放键值对

### 1.1哈希函数（散列函数）：

- 散列函数一般指哈希函数，指将哈希表中元素的关键键值 key 映射为元素存储位置的函数。表达式为：Addr = H(key)
- 一般的线性表，树中，记录在结构中的相对位置是随机的，即和记录的关键字之间不存在确定关系，在结构中进行查找记录时需要进行一系列和关键字的比较。需要能直接找到需要的记录，必须在记录的存储位置和它的关键字之间建立对确定的对应关系 f，使每个关键字和结构中唯一的存储位置相对应
- 哈希表通常存放键值对（key - value）数据，一个 key 键值对应一个 value hash 值。这个键值对被称为 Entry

### 1.2 哈希表存储

> 建立哈希表需要解决两个主要的问题：
>
> (1) 构造一个合适的哈希函数，H(key) 值均匀分布在哈希表中
>
> (2) 对冲突的处理，发生冲突寻找下一个可用地址

## 普通存储：

- 哈希表本质是个数组，我们需要将一个 Entry 存放到这个数组中
- 哈希表通过 key 值来通过哈希函数计算得到一个值，用来确定 Entry 要存放在哈希表中的位置，这个值就是数组的确切下标值

## 哈希冲突：

> 如果一个 Entry 的 key 通过哈希函数计算得到值后，数组中下标为该值的位置已被占据，就会发生哈希冲突

**解决办法：**

- 链接法（拉链法）：
- 将具有同一散列地址的记录存储在一条线性链表中
- Java 中的 HashMap 在链表长度大于等于 8 时，链表就会转为树结构，小于 6 的话就会还原为链表，以此解决链表过长导致的性能问题。使用 7 作为差值来避免频繁进行树和链表切换。
- 开放寻址法：
- 如果 H(key) 已经被占用，向后按照一定函数进行探查，知道无冲突出现为止
- 哈希表被占用位置较多时，出现哈希冲突几率变高，有必要进行扩容

### 1.3 哈希表扩容

- 哈希表有负载因子的概念，当已经占用的位置到达总位置的一个百分比，就需要扩容
- HashMap 的负载因子是 0.75 容量达到总容量的 75% 就会进行扩容
- 扩容操作是新创建一个原来 2 倍的数组，原来数组所有 Entry 重新进行哈希函数计算并重新进行存储

### 1.4 哈希表查找

使用哈希函数得到 key 存放位置，拿到 Entry 后再找对应的 key，最后得到需要的结果。

## 2、哈希表代码实现

哈希表我们可以使用 数组 + 链表 或者 数组 + 二叉树 进行实现

### 2.1 哈希表数组加链表实现

## 键值对 Entry

```java
// 表示一个键值对
class Entry {
    public int key;
    public String value;
    public Entry next;
    public Entry(int key, String value){
        super();
        this.key = key;
        this.value = value;
    }
}
```

## 链表 EntryLinkedList

```java
// 链表
class EntryLinkedList {
    // 头指针，表示链表的头结点，指向第一个 Entry
    private Entry head; // 默认为 null
    // 添加时id 是自增的，id 从小到大，直接加入到链表最后
    public void add(Entry entry){
        // 添加第一个 Entry
        if (head == null) {
            head = entry;
            return;
        }
        // 找到链表最后一个节点并添加
        Entry curEntry = head;
        while (true) {
            if (curEntry.next == null) {
                break;
            }
            curEntry = curEntry.next;
        }
        // 将 Entry 添加到链表
        curEntry.next = entry;
    }
    // 遍历
    public void list(int key) {
        if (head == null) {
            System.out.printf("第%d条链表为空！", key);
            return;
        }
        System.out.printf("第%d条链表内元素信息为：");
        Entry curEntry = head;
        while (true) {
            System.out.printf("key = %d value = %s\t", curEntry.key, curEntry.value);
            if (curEntry.next == null) {
                break;
            }
            curEntry = curEntry.next;
        }
    }
    // 根据 key 查找 Entry
    public Entry get(int key) {
        if (head == null) {
            System.out.println("链表为空");
            return null;
        }
        Entry curEntry = head;
        while (true) {
            if (curEntry.key == key) {
      // 找到对应 Entry
                break;
            }
            if (curEntry.next == null) {
                curEntry = null;
                break;
            }
            curEntry = curEntry.next;
        }
        return  curEntry;
    }
}
```

## 哈希表 HashTable

```java
// HashTable
class HashTable {
    private EntryLinkedList[] entryLinkedListArray; // 存放多个链表
    private int size; // 链表数量
    // 构造器，初始化哈希表
    public HashTable(int size) {
        entryLinkedListArray = new EntryLinkedList[size];
        for (int i = 0; i < size; i++) {
            entryLinkedListArray[i] = new EntryLinkedList();
        }
    }
    // 添加 Entry
    public void add(Entry entry){
        // 根据 key 判断应该添加到哪条链表
        int entryLinkedListNo = hasFun(entry.key);
        entryLinkedListArray[entryLinkedListNo].add(entry);
    }
    // 获取对应 key 值的 value
    public void get(int key) {
        // 通过散列函数确定数组下标位置
        int entryLinkedListNo = hasFun(key);
        // 找到对应的 Entry
        Entry entry = entryLinkedListArray[entryLinkedListNo].get(key);
        if (entry != null) {
            System.out.printf("在%d条链表找到 key = %d，value = %s 的 Entry", entryLinkedListNo, key, entry.value);
        } else {
            System.out.printf("在哈希表中未找到 key = %d 的 Entry", key);
        }
    }
    // 遍历
    public void list() {
        for (int i = 0; i < size; i++) {
            entryLinkedListArray[i].list(i);
        }
    }
    // 编写散列函数，简单的对 key 进行取模
    public int hasFun(int key) {
        return key % size;
    }
}
```
