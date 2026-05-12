# 13、Android设计模式 - 状态模式
- 来源：https://ddkk.com/zhuanlan/design/android/1/13.html
- 分类：设计模式
- 分组：教程目录
状态模式看起来和策略模式很像，但是是两个不一样的设计模式。状态模式是一个类根据内部的状态动态的选择行为。策略模式一般用于算法，通过设置不同的策略类来执行不同的算法。状态模式的一个特点就是行为改变状态，而状态又导致行为的变化。策略模式是可以在运行时外部直接策略的，状态模式一般是不能替换的。

## 定义

允许对象在内部状态发生改变时改变它的行为，对象看起来好像修改了它的类。

## 使用场景

- 一个类的状态决定了他的行为，而且在运行时必须根据当前的状态来改变行为。
- 跟策略模式一样，解决一大堆分支语句的存在。

## UML

- Context:提供供用户调用的方法，内部维护一个State类，定义当前的状态
- State：抽象的状态类，定义了每个状态下应该有的行为。
- ConcreteState:具体的状态类，定义类各自状态下的具体的不同行为。

## 简单示例

例子还举书上的吧，虽然我感觉这个太像策略模式了。

纯粹是个例子，不是模板，因为见过很多写法。

以电视机的状态和遥控器为例。电视机有开和关两种状态，在开的时候可以关机，可以换台。在关的时候只能开机。

定义一个状态接口：定义了开机，关机，换频道

```java
public interface TvState {
    void tvOn(Controller controller);
    void tvOff(Controller controller);
    void nextChinal(Controller controller);
    void lastChinal(Controller controller);
}
```

定义一个遥控器：

```java
public class Controller {
    private TvState state;
    public Controller(TvState state) {
        this.state = state;
    }
    public void setState(TvState state){
        this.state=state;
    }
    public void turnOn(){
        state.tvOn(this);
    }
    public void turnOff(){
        state.tvOff(this);
    }
    public void nextChinal(){
        state.nextChinal(this);
    }
    public void lastChinal(){
        state.lastChinal(this);
    }
}
```

定义两个状态的实现，开机和关机下点不同的按钮有不同的反应：

```java
public class OnState implements TvState {
    @Override
    public void tvOn(Controller controller) {
    }
    @Override
    public void tvOff(Controller controller) {
        System.out.println("关机");
        controller.setState(new OffState());
    }
    @Override
    public void nextChinal(Controller controller) {
        System.out.println("下个频道");
    }
    @Override
    public void lastChinal(Controller controller) {
        System.out.println("上个频道");
    }
}
public class OffState implements TvState {
    @Override
    public void tvOn(Controller controller) {
        System.out.println("开机");
        controller.setState(new OnState());
    }
    @Override
    public void tvOff(Controller controller) {
    }
    @Override
    public void nextChinal(Controller controller) {
    }
    @Override
    public void lastChinal(Controller controller) {
    }
}
```

客户端调用：

```java
public class Mian {
    public static void main(String[] args) {
        Controller controller = new Controller(new OffState());
        System.out.println(1+"点击上一个频道");
        controller.lastChinal();
        System.out.println(2+"点击关机");
        controller.turnOff();
        System.out.println(3+"点击开机");
        controller.turnOn();
        System.out.println(4+"点击下一个频道");
        controller.nextChinal();
        System.out.println(5+"点击开机");
        controller.turnOn();
        System.out.println(6+"点击关机");
        controller.turnOff();
        System.out.println(7+"点击下一个频道");
        controller.nextChinal();
    }
}
```

可以看看输出：

在调用的时候，只设置一个初始值，然后控制器内部会根据状态切换行为，然后又由行为切换状态，在不同的状态下按同样的按钮会有不同的效果。

## 总结

状态模式和策略模式都是为了实现解耦，避免一大堆的if-else的写法，但是状态模式更多的是适合不同状态下，同样的行为有不同的相应。根据实际生活来说，这种模式适合有明显的状态区分的时候。比如电视的开，关就是两种状态。而在策略模式中J举得例子就不适合叫状态了。

### 优点

- 将所有的状态和该状态的行为封装在同一个实现类中，然后有一个共同的接口，代码结构清晰，便于扩展和修改。

### 缺点

- 也是要增加很多类
