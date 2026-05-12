# 15、Android设计模式 - 中介者模式
- 来源：https://ddkk.com/zhuanlan/design/android/1/15.html
- 分类：设计模式
- 分组：教程目录
中介者模式又叫调解者模式或调停者模式，是行为型设计模式之一。

生活中的中介者的作用就是连接两方的一个桥梁，比如房产中介，买房的只需跟中介打交道，然后买房的也跟着中介打交道，

没有中介的时候是这样的：

每个买房的和卖房的都要和很多对方打交道，有了新的买房人，这些卖房的都得知道才能去和他联系。

有了中介者之后：

所有买房的和卖房的都只需要跟中介者一个人打交道，买房的不需要知道卖房的是什么人，有多少卖房的等等。都省事了很多。

## 定义

通过中介者包装一系列对象的交互，使得这些对象不必相互显式引用，从而使它们可以松散耦合。

当某些对象之间的作用发生变化是，不会立即影响其他对象间的作用，保证这些作用协议彼此独立的变化。

中介者模式将多对多的相互作用转化为一堆多的相互作用。

## 使用场景

- 多个对象之间的交互操作很多，每个对象的行为都依赖批次，形成网状的多对多结构，为了防止修改一个对象时要修改很多其他对象，可以用中介者模式。

## UML

- Mediator: 抽象的中介者角色，定义了同事对象到中介者的接口。
- ConcreteMediator：具体的中介者角色，从具体的同事对象接收消息，同时向具体的同事对象发出命令。
- Colleague：抽象同事类角色，定义了中介者对象的接口，只知道中介而不知道其他同事对象。
- ConcreteColleagueA，B：具体的同事类角色，每个具体同事类都知道本身在小范围内的行为，而不知道他在大范围中的行为。

模板代码：

抽象的中介者：

```java
public interface Mediator {
    void change();
}
```

具体的中介者：

```java
public class ConcreteMediator implements Mediator {
    public ConcreteColleagueA concreteColleagueA;
    public ConcreteColleagueB concreteColleagueB;
    public void setConcreteColleagueA(ConcreteColleagueA concreteColleagueA) {
        this.concreteColleagueA = concreteColleagueA;
    }
    public void setConcreteColleagueB(ConcreteColleagueB concreteColleagueB) {
        this.concreteColleagueB = concreteColleagueB;
    }
    @Override
    public void change() {
        concreteColleagueA.action();
        concreteColleagueB.action();
    }
}
```

抽象的同事：

```java
public abstract class Colleague {
    public Mediator mediator;
    public Colleague(Mediator mediator) {
        this.mediator = mediator;
    }
    public abstract void action();
}
```

具体的同事：

```java
public class ConcreteColleagueA extends Colleague {
    public ConcreteColleagueA(Mediator mediator) {
        super(mediator);
    }
    @Override
    public void action() {
        System.out.println("交给中介做A的事情");
    }
}
public class ConcreteColleagueB extends Colleague {
    public ConcreteColleagueB(Mediator mediator) {
        super(mediator);
    }
    @Override
    public void action() {
        System.out.println("交给中介做B的事情");
    }
}
```

## 简单实现

以电脑为例子。CPU，显卡，内存等零件的交互都是通过主板实现的，而且每个零件只需要做好自己的工作，不需要知道其他零件是什么。所以主板可以作为他们的中介者。

抽象的中介者：

```java
public abstract class Mediator {
    public abstract void change(Colleague colleague);
}
```

具体的中介者，主板：

```java
public class MainBoard extends Mediator {
    private CDDevice cdDevice;
    private CPU cpu;
    private GraphicsCard graphicsCard;
    private SoundCard soundCard ;
    @Override
    public void change(Colleague colleague) {
        if (colleague==cdDevice){
            handleCD((CDDevice) colleague);
        }
        if (colleague==cpu){
            handleCPU((CPU) colleague);
        }
    }
    private void handleCD(CDDevice  cdDevice){
        cpu.decodeData(cdDevice.read());
    }
    private void handleCPU(CPU cpu){
        soundCard.playSound(cpu.getDataSound());
        graphicsCard.vidoePlay(cpu.getDataVideo());
    }
    public void setCdDevice(CDDevice cdDevice) {
        this.cdDevice = cdDevice;
    }
    public void setCpu(CPU cpu) {
        this.cpu = cpu;
    }
    public void setGraphicsCard(GraphicsCard graphicsCard) {
        this.graphicsCard = graphicsCard;
    }
    public void setSoundCard(SoundCard soundCard) {
        this.soundCard = soundCard;
    }
}
```

抽象的零件：

```java
public abstract class Colleague {
    public Mediator mediator;
    public Colleague(Mediator mediator) {
        this.mediator = mediator;
    }
}
```

具体的零件：

```java
public class CPU extends Colleague {
    private String dataVideo,dataSound;
    public CPU(Mediator mediator) {
        super(mediator);
    }
    public String getDataVideo(){
        return dataVideo;
    }
    public String getDataSound() {
        return dataSound;
    }
    //解析数据，分割音频和视频
    public void decodeData(String data){
        String[] tmp = data.split("，");
        dataVideo=tmp[0];
        dataSound=tmp[1];
        mediator.change(this);
    }
}
```

```java
public class CDDevice extends Colleague {
    private String data;
    public CDDevice(Mediator mediator) {
        super(mediator);
    }
    public String read(){
        return data;
    }
    public void load(){
        data="视频数据，音频数据";
        mediator.change(this);
    }
}
```

```java
public class GraphicsCard extends Colleague {
    public GraphicsCard(Mediator mediator) {
        super(mediator);
    }
    public void vidoePlay(String data){
        System.out.println("播放视频："+data);
    }
}
```

```java
public class SoundCard extends Colleague {
    public SoundCard(Mediator mediator) {
        super(mediator);
    }
    public void playSound(String data){
        System.out.println("播放音频："+ data);
    }
}
```

## 总结

在面向对象编程中，一个类必然会与其他类产生依赖关系，当依赖关系错综复杂时，可以考虑用中介者模式进行解耦。

### 优点

- 降低类的关系复杂度，将多对多转化成一对多，实现解耦。
- 符合迪米特原则（最少知识原则）

### 缺点

- 中介者要做很多事，会变得庞大且难以维护。
- 如果本来关系并不复杂，那么使用中介者可能会让关系变得更复杂。
