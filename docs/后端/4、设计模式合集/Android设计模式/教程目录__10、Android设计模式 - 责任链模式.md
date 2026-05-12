# 10、Android设计模式 - 责任链模式
- 来源：https://ddkk.com/zhuanlan/design/android/1/10.html
- 分类：设计模式
- 分组：教程目录
责任链模式是一个行为模式。责任链就是从一个起点发起请求，然后沿着任务链依次传递给每一个节点上的对象，直到有一个节点处理这个请求为止。听着是不是跟Android的事件分发机制很像。

## 定义

使多个对象都有机会处理请求，从而避免了请求的发送者和接受者之间的耦合关系。将这些对象连成一条链，并沿着这条链传递改请求，直到有对象处理它为止

## 使用场景

- 多个对象可以处理统一请求，但具体谁处理在运行时动态决定。
- 在请求的处理者不明确的情况下，向多个对象的一个提交请求。
- 需要动态指定一组对象处理请求。

## UML

### 简单版

- Handler：抽象处理者角色，声明一个处理请求的方法，并保持对下一个处理节点Handler对象的引用。
- ConcreteHandler: 具体的处理者，对请求进行处理，如果不处理就讲请求转发给下一个节点上的处理对象。

模板代码：

抽象处理者：

```java
public abstract class Handler {
    protected Handler successor;
    public abstract void handleRequest(String condition);
}
```

实际处理者

```java
public class ConcreteHandler1 extends Handler {
    @Override
    public void handleRequest(String condition) {
        if ("ConcreteHandler1".equals(condition)){
            System.out.println("ConcreteHandler1 handled");
            return;
        }else {
            successor.handleRequest(condition);
        }
    }
}
```

```java
public class ConcreteHandler2 extends Handler {
    @Override
    public void handleRequest(String condition) {
        if ("ConcreteHandler2".equals(condition)) {
            System.out.println("ConcreteHandler2 handled");
            return;
        } else {
            successor.handleRequest(condition);
        }
    }
}
```

客户端调用,组成一条责任链

```java
public class Client {
    public static void main(String[] args) {
        ConcreteHandler1 concreteHandler1 = new ConcreteHandler1();
        ConcreteHandler2 concreteHandler2 = new ConcreteHandler2();
        concreteHandler1.successor = concreteHandler2;
        concreteHandler2.successor = concreteHandler1;
        concreteHandler1.handleRequest("ConcreteHandler2");
    }
}
```

输出：

### 复杂版

简单版中，传递的都是统一的字符串，处理也比较简单。但是在实际开发中，责任链中的请求处理规则是不尽相同的，这种时候需要对请求进行封装，同时对请求的处理规则也进行一个封装，

类图如下

抽象处理者

```java
public abstract class AbstractHandler {
    protected AbstractHandler nextHandler;
    public final void handleRequest(AbstractRequest request){
        if (request.getRequestLevel()==getHandleLevel()){
            handle(request);
        }else {
            if (nextHandler!=null){
                nextHandler.handleRequest(request);
            }else {
                System.out.println("没有对象能处理这个请求");
            }
        }
    }
    protected abstract int getHandleLevel();
    protected abstract void handle(AbstractRequest request);
}
```

抽象请求者

```java
public abstract class AbstractRequest {
    private Object obj;
    public AbstractRequest(Object obj){
        this.obj=obj;
    }
    public Object getContent(){
        return obj;
    }
    public abstract int getRequestLevel();
}
```

实现的三个请求

```java
public class Request1 extends AbstractRequest {
    public Request1(Object obj) {
        super(obj);
    }
    @Override
    public int getRequestLevel() {
        return 1;
    }
}
```

```java
public class Request2 extends AbstractRequest {
    public Request2(Object obj) {
        super(obj);
    }
    @Override
    public int getRequestLevel() {
        return 2;
    }
}
```

```java
public class Request3 extends AbstractRequest {
    public Request3(Object obj) {
        super(obj);
    }
    @Override
    public int getRequestLevel() {
        return 3;
    }
}
```

三个处理者

```java
public class Handler1 extends AbstractHandler {
    @Override
    protected int getHandleLevel() {
        return 1;
    }
    @Override
    protected void handle(AbstractRequest request) {
        System.out.println("Handler1处理了请求："+request.getRequestLevel());
    }
}
```

```java
public class Handler2 extends AbstractHandler {
    @Override
    protected int getHandleLevel() {
        return 2;
    }
    @Override
    protected void handle(AbstractRequest request) {
        System.out.println("Handler2处理了请求："+request.getRequestLevel());
    }
}
```

```java
public class Handler3 extends AbstractHandler {
    @Override
    protected int getHandleLevel() {
        return 3;
    }
    @Override
    protected void handle(AbstractRequest request) {
        System.out.println("Handler3处理了请求："+request.getRequestLevel());
    }
}
```

客户端调用

```java
public class Client {
    public static void main(String[] args) {
        //构造三个处理对象
        AbstractHandler handler1 = new Handler1();
        AbstractHandler handler2 = new Handler2();
        AbstractHandler handler3 = new Handler3();
        //串成一个责任链
        handler1.nextHandler=handler2;
        handler2.nextHandler=handler3;
        //构造三个请求
        AbstractRequest request1 = new Request1("A");
        AbstractRequest request2 = new Request2("B");
        AbstractRequest request3 = new Request3("C");
        handler1.handleRequest(request1);
        handler1.handleRequest(request2);
        handler1.handleRequest(request3);
    }
}
```

输出

## 简单实现

现实中最适合责任链的应该就是部门领导之间的上报请求了。比如员工要申请一笔资金，会先向组长申请，额度如果在组长的范围内，组长就批了，组长权限不够就向主管申请，主管如果也额度不够就向经理申请。这就形成了个责任链。

组长，主管，经理。每个人都是责任链上的一个节点。一个请求被层层转达，知道被处理或没有一个人能处理。普通员工，就是那个申请的发起者并不需要知道到底最后是谁审批的，他只要拿到钱就行了。这样就造成了请求者和处理者的解耦。

抽象的领导

```java
public abstract class Leader {
    protected Leader nextLeader;
    public final void handleRequest(int money){
        if (money<=getLimit()){
            handle(money);
        }else {
            if (nextLeader!=null){
                nextLeader.handleRequest(money);
            }else {
                System.out.println(money+"没人能批准");
            }
        }
    }
    public abstract int getLimit();
    public abstract void handle(int money);
}
```

三个具体的领导

```java
public class GroupLeader extends Leader {
    @Override
    public int getLimit() {
        return 5000;
    }
    @Override
    public void handle(int money) {
        System.out.println(money+"由组长批准");
    }
}
```

```java
public class Director extends Leader {
    @Override
    public int getLimit() {
        return 10000;
    }
    @Override
    public void handle(int money) {
        System.out.println(money+"由主管批准");
    }
}
```

```java
public class Manager extends Leader {
    @Override
    public int getLimit() {
        return 20000;
    }
    @Override
    public void handle(int money) {
        System.out.println(money+"由经理批准");
    }
}
```

员工申请：

```java
public class A {
    public static void main(String[] args) {
        Leader groupLeader = new GroupLeader();
        Leader director = new Director();
        Leader manager = new Manager();
        groupLeader.nextLeader = director;
        director.nextLeader = manager;
        groupLeader.handleRequest(5000);
        groupLeader.handleRequest(9000);
        groupLeader.handleRequest(12000);
        groupLeader.handleRequest(30000);
    }
}
```

输出:

## 总结

### 优点

- 降低耦合度，便于拓展，提高代码灵活性。
- 责任链对象互相链接，只用想头部发起请求。

### 缺点

- 如果责任链太长，或者每条链判断处理的时间太长会影响性能。特别是递归循环的时候。
- 请求不一定能得到处理，可能会没有对象处理。
