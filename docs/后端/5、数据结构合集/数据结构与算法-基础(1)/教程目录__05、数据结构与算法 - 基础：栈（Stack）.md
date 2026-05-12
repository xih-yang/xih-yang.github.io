# 05、数据结构与算法 - 基础：栈（Stack）
- 来源：https://ddkk.com/zhuanlan/algorithm/3/5.html
- 分类：数据结构
- 分组：教程目录
### 1、栈的基本概念

栈（英语：stack）又称为堆栈或堆叠，栈作为一种数据结构，是一种只能在一端进行插入和删除操作的特殊线性表。它按照先进后出的原则存储数据，先进入的数据被压入栈底，最后的数据在栈顶，需要读数据的时候从栈顶开始弹出数据（最后一个数据被第一个读出来）。

栈是允许在同一端进行插入和删除操作的特殊线性表。允许进行插入和删除操作的一端称为栈顶(top)，另一端为栈底(bottom)；栈底固定，而栈顶浮动；栈中元素个数为零时称为空栈。插入一般称为进栈（PUSH），删除则称为退/出栈（POP）。

由于堆叠数据结构只允许在一端进行操作，因而按照后进先出（LIFO, Last In First Out）的原理运作。栈也称为后进先出表。

**java实现栈**

**一、采用数组实现栈**

每次入栈之前先判断栈的容量是否够用，如果不够用就用 `Arrays.copyOf()`进行扩容

```java
import java.util.Arrays;
/**
 * 数组实现栈
 * @param <T>
 */
class Mystack1<T> {
    //实现栈的数组
    private Object[] stack;
    //数组大小
    private int size;
    Mystack1() {
        stack = new Object[10];//初始容量为10
    }
    //判断是否为空
    public boolean isEmpty() {
        return size == 0;
    }
    //返回栈顶元素
    public T peek() {
        T t = null;
        if (size > 0)
            t = (T) stack[size - 1];
        return t;
    }
    public void push(T t) {
        expandCapacity(size + 1);
        stack[size] = t;
        size++;
    }
    //出栈
    public T pop() {
        T t = peek();
        if (size > 0) {
            stack[size - 1] = null;
            size--;
        }
        return t;
    }
    //扩大容量
    public void expandCapacity(int size) {
        int len = stack.length;
        if (size > len) {
            size = size * 3 / 2 + 1;//每次扩大50%
            stack = Arrays.copyOf(stack, size);
        }
    }
}
}
```
