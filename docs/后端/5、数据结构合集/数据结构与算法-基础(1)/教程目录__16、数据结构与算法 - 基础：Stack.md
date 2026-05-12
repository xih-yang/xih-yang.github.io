# 16、数据结构与算法 - 基础：Stack
- 来源：https://ddkk.com/zhuanlan/algorithm/3/16.html
- 分类：数据结构
- 分组：教程目录
**1、简介**

Stack 是先进后出的栈结构，其并不直接实现具体的逻辑，而是通过继承 Vector 类，调用 Vector 类的方法实现。

```java
public class Stack<E> extends Vector<E>
```

## 2、核心方法

Stack 类代码非常简单，其有 3 个核心方法：push、pop、peek。

### 2.1、push

```java
public E push(E item) {
    addElement(item);
    return item;
}
```

可以看到 push 方法直接调用 Vector 的 addElement 方法将元素插入数组尾部。

### 2.2、pop

```java
public synchronized E pop() {
    E       obj;
    int     len = size();
    obj = peek();
    removeElementAt(len - 1);
    return obj;
}
```

pop方法调用 Vector 的 removeElementAt 方法，删除了一个元素。要注意的是，其删除的是数组最后一个元素，而不是第一个元素。

### 2.3、peek

```java
public synchronized E peek() {
    int     len = size();
    if (len == 0)
        throw new EmptyStackException();
    return elementAt(len - 1);
}
```

peek 方法直接返回列表最后一个元素。

## 3、总结

Stack 方法代码真的是非常简单，其利用 Vector 实现了一个线程安全的栈结构。总的来说，其有以下特点:

- 底层采用 Vector 实现，因此其也是采用数组实现，也是线程安全的。
- 先进后出的栈结构
