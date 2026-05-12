# 04、数据结构和算法 - 实战：Java实现环形链表
- 来源：https://ddkk.com/zhuanlan/algorithm/8/4.html
- 分类：数据结构
- 分组：教程目录
## 1.1 约瑟夫问题

约瑟夫问题：公元66年，约瑟夫不情愿地参与领导了犹太同胞反抗罗马统治的起义，后来起义失败，他和一些宁死不降的起义者被困于一个山洞之中。罗马将军韦斯巴芗(Vespasian)派人来劝降，他主张投降，其余的人不答应，并以死相逼。最后，约瑟夫提议，与其死在自己的手上，不如死在彼此的手上。因此他便将游戏规则告知众人：N个人围成一圈，从第一个人开始报数，报到m的人被杀，剩下的人继续从1开始报数，报到m的人继续被杀；如此往复，直到剩下最后一个人。他就是运用这个游戏规则最终活了下来，被后人称为约瑟夫环问题。

图解1：

假设n=6，总共有6个人，k=1,从第一个人开始报数，m=5,每次数五个。

图解2：

第一次报数：从一号开始，数五个数，1->2->3->4->5，数完五个数，五号被杀死，第一次报数后，剩余人数如下。

图解3：

第二次报数： 从被杀死的五号的下一位开始报数，也就是六号，数五个数，6->1->2->3->4，数数完毕，四号被杀死，第二次报数后，剩余人数如下。

图解4：

第三次报数： 从被杀死的四号的下一位开始报数，同样是六号，数五个数，6->1->2->3->6，数数完毕，六号被杀死，第三次报数后，剩余人数如下。

图解5：

第四次报数： 从被杀死的六号的下一位开始报数，也就是一号，数五个数，1->2->3->1->2，数数完毕，二号被杀死，第四次报数后，剩余人数如下。

图解6：

第五次报数： 从被杀死的二号的下一位开始报数，也就是三号，数五个数，3->1->3->1->3，数数完毕，三号被杀死，只剩下一号，最后活下来的是1号。

## 1.2 约瑟夫JAVA实现

现实思路：

**1、** 创建出n个节点的环形链表，即n=5代表生成5个人；

**2、** 需要创建两个变量，分别为first和last分别指向，第一个人和第一个的上一个人在报数前，先让first和last分别移动k-1次；

**3、** 将first指向的人杀死，并打印杀死的人号码当前first==last时，说明游戏结束最后一个人活了下来；

数据结构-代码：

```java
package com.yuanxw.datastructure.chapter4;
/**
 * 环形链表
 */
public class Person {
    // 编号
    private int number;
    // 下一个报数的人
    private Person next;
    public int getNumber() {
        return number;
    }
    public void setNumber(int number) {
        this.number = number;
    }
    public Person getNext() {
        return next;
    }
    public void setNext(Person next) {
        this.next = next;
    }
}
```

环形链表-代码：

```java
package com.yuanxw.datastructure.chapter4;
/**
 * 自定义 环形链表
 */
public class CustomCyclicLinkedList {
    public Person first = null;
    public Person last = null;
    private int size = 0;
    /**
     * 生成人员环形列表
     *
     * @param n
     * @return
     */
    public boolean builder(int n) {
        if (n < 1) {
            throw new RuntimeException("参数n必须大于1。");
        }
        for (int i = 1; i <= n; i++) {
            Person person = new Person();
            person.setNumber(i);
            if (i == 1) {
                first = person;
                first.setNext(first);
                last = first;
            } else {
                last.setNext(person);
                person.setNext(first);
                last = person;
            }
        }
        size = n;
        return true;
    }
    /**
     * @param n 从第n个人开始报数
     * @param m 每次隔几个人
     * @return
     */
    public String kill(int n, int m) {
        StringBuilder builder = new StringBuilder();
        if (first == null) {
            throw new RuntimeException("约瑟夫环中没有人员，杀人结束！");
        }
        if (n <= 0 || n > size) {
            throw new RuntimeException(String.format("报数开始的位置，必须在1-%s之间！", size));
        }
        if (m <= 0 || m > size) {
            throw new RuntimeException(String.format("约瑟夫环隔数，必须在1-%s之间！", size));
        }
        // 设置从位置n做为起点进行：报数
        for (int i = 0; i < n-1; i++) {
            first = first.getNext();
            last = last.getNext();
        }
        while (true){
            // first == last 说明只剩下一个人了
            if(first == last){
                break;
            }
            // 移动到 m-1的位置。自已本身也需要报数。所以m-1
            for (int i = 0; i < m-1; i++) {
                first = first.getNext();
                last = last.getNext();
            }
            builder.append(first.getNumber()).append("->");
            // 直接杀死移动后first位置
            first = first.getNext();
            last.setNext(first);
        }
        return builder.substring(0,builder.length()-2);
    }
    /**
     * 获得 幸存者
     * @return
     */
    public int getSurvivor(){
        return first.getNumber();
    }
    @Override
    public String toString() {
        StringBuilder builder = new StringBuilder();
        Person current = first;
        builder.append("[");
        do {
            builder.append(current.getNumber()).append(",");
            current = current.getNext();
        } while (current != first);
        builder.deleteCharAt(builder.length() - 1);
        builder.append("]");
        return builder.toString();
    }
}
```

测试部分-代码

```java
package com.yuanxw.datastructure.chapter4;
public class JosephusProblem {
    public static void main(String[] args) {
        CustomCyclicLinkedList customCyclicLinkedList = new CustomCyclicLinkedList();
        customCyclicLinkedList.builder(6);
        System.out.println("列出约瑟夫环列表：" + customCyclicLinkedList);
        System.out.println("杀人的顺序：" + customCyclicLinkedList.kill(1,5));
        System.out.println("最后幸存者是：" + customCyclicLinkedList.getSurvivor());
    }
}
```

执行结果：

```java
列出约瑟夫环列表：[1,2,3,4,5,6]
杀人的顺序：5->4->6->2->3
最后幸存者是：1
```
