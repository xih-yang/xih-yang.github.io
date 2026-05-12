# 23、Android设计模式 - 享元模式
- 来源：https://ddkk.com/zhuanlan/design/android/1/23.html
- 分类：设计模式
- 分组：教程目录
享元模式是对象池的一种实现。类似于线程池，线程池可以避免不停的创建和销毁多个对象，消耗性能。享元模式也是为了减少内存的使用，避免出现大量重复的创建销毁对象的场景。

享元模式用在一批相同或相似的对象上，这些对象有可以共享的内部状态和各自不同的外部状态。

享元模式中会有一个工厂，工厂维护着一个容器，容器以键值对的方式存储，键是对象的内部状态，也就是共享的部分，值就是对象本身。

客户端从这个工厂获取对象，如果容器中存在这个对象就直接返回，不存在再创建新的对象并存入容器，避免了大量重复创建对象。

## 定义

使用共享对象有效的支持大量的细粒度对象的复用。

## 使用场景

- 系统存在大量相似或相同的对象。
- 这些对象有较接近的外部状态。
- 需要缓冲池时。

## UML

- Flyweight:享元对象抽象类或接口。
- ConcreteFlyweight：具体的享元对象
- FlyweightFactory：享元工厂，管理对象池和创建享元对象。

## 简单实现

以查询火车票价为例。假如每张车票信息都是一个对象，当有很多人在查询一个车票信息时，系统就会重复创建这个车票信息返回给每个人，这样会不停的创建和销毁对象，引发频繁的GC，影响效率。

车票是有限的，结构是一样的，内容是相似的，这里简化一下，假设车票上只有始发地，到达地，座位类型，票价四个内容。所以，如果缓存下来车票的话，就不管有多少人查询，都不会频繁的创建销毁对象了。

把始发地和到达地看做是内部可以共享的状态，当做缓存的键，整个车票对象为值。

抽象的车票，提供一个方法展示车票信息，传入信息是要查询的座位类型：

```java
public interface Ticket {
    void showInfo(String type);
}
```

具体的车票，这里每次查询的事随机生成票价：

```java
public class ConcreteTicket implements Ticket {
    private String from;
    private String to;
    private int price;
    private String type;
    public ConcreteTicket(String from, String to) {
        this.from = from;
        this.to = to;
    }
    @Override
    public void showInfo(String type) {
        price = new Random().nextInt(500);
        this.type=type;
        System.out.println("从"+from+"到"+to+"的"+this.type+"票价是"+price);
    }
}
```

车票工厂：

```java
public class TicketFactory {
    private static Map<String,Ticket> tickets = new HashMap<>();
    public static Ticket getTicket(String from,String to){
        String key = from+to;
        if (tickets.containsKey(key)){
            System.out.println("从缓存中获取");
            return tickets.get(key);
        }else {
            System.out.println("新建对象");
            Ticket ticket = new ConcreteTicket(from,to);
            tickets.put(key,ticket);
            return ticket;
        }
    }
}
```

客户端调用：

```java
public class Client {
    public static void main(String[] args) {
        TicketFactory.getTicket("A","B").showInfo("硬座");
        TicketFactory.getTicket("A","B").showInfo("硬卧");
        TicketFactory.getTicket("C","B").showInfo("硬卧");
    }
}
```

输出：

## 总结

享元模式的核心就在享元工厂，因为享元对象有可共享的内部状态部分和不可共享的外部状态部分，因此，内部可共享的就交给工厂去维护处理了，而外部可变的就可以交给客户端去实现。

### 优点

- 大大减少系统创建的对象，降低内存总对象的数量，降低程序占用的内存，增强系统的性能。

### 缺点

- 将对象分为内部状态和外部状态两部分，导致系统变复杂，逻辑也更复杂。
- 将享元对象的状态外部化，而读取外部状态使得运行时间稍微变长。
