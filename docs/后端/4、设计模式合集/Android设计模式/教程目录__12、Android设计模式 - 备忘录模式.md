# 12、Android设计模式 - 备忘录模式
- 来源：https://ddkk.com/zhuanlan/design/android/1/12.html
- 分类：设计模式
- 分组：教程目录
备用录模式是一种行为型设计模式，用于保存对象当前的状态，以便之后可以再次恢复到此状态。

备忘录模式要保证保存的对象状态不能被对象从外部访问，保护好被保存的这些对象状态的完整性以及内部实现不向外部暴露。

## 定义

在不破坏封装性的前提下，捕获一个对象的内部状态，并在该对象之外保存这个状态，这样以后就可将该对象恢复到原先保存的状态。

## 使用场景

- 需要保存一个对象在某个适合的全部或部分状态时。
- 一个对象不希望外部直接访问其内部状态时。

## UML

- Originator：负责创建一个备忘录，可以记录，恢复自身内部的状态。同时可以决定哪些状态需要备忘。
- Memoto：备忘录角色，用于存储Originator的内部状态，并且可以防止Originator之外的对象访问Memoto。
- Caretaker：负责存储备忘录，不能对备忘录的内容进行操作和访问，只能讲备忘录传递给其他对象。

看这个解释可能有点晕，直接看一下实例就很清晰了。

## 简单实现

最容易理解的就是子啊游戏中的存档了。一般在打boss之前，都会存个档，以便于之后直接开始打boss。这个存档就包含了我们当前的状态，被boss打死后，下次读取存档就会回到这个状态，方便挑战boss。

首先是一个玩家类，包含各种玩法以及玩家自身状态。然后提供了保存生成当前状态的封装类和从保存的装套中恢复的方法。

```java
public class Player {
    private int lv = 1;
    private int hp = 100;
    private int mp = 50;
    public void play(){
        lv++;
        hp+=100;
        mp+=50;
        System.out.println("升级了，当前级别"+lv+" hp:"+hp+" mp:"+mp);
    }
    public void attackBoss(){
        hp-=80;
        mp-=40;
        System.out.println("打boss之后，当前级别"+lv+" hp:"+hp+" mp:"+mp);
    }
    public Memoto createMemoto(){
        Memoto memoto = new Memoto();
        memoto.lv = lv;
        memoto.hp = hp;
        memoto.mp = mp;
        return memoto;
    }
    public void restore(Memoto memoto){
        lv = memoto.lv;
        hp = memoto.hp;
        mp = memoto.mp;
        System.out.println("回档了，当前级别"+lv+" hp:"+hp+" mp:"+mp);
    }
    @Override
    public String toString() {
        return   "当前状态：级别"+lv+" hp:"+hp+" mp:"+mp;
    }
}
```

然后是备忘录对象，存储玩家状态

```java
public class Memoto {
    public int lv;
    public int hp;
    public int mp;
}
```

最后是备忘录操作者者，用来存储和返回备忘录对象

```java
public class Caretaker {
    private Memoto memoto;
    public void save(Memoto memoto){
        this.memoto=memoto;
    }
    public Memoto load(){
        return memoto;
    }
}
```

客户端调用：

```java
public class Client {
    public static void main(String[] args) {
        Player player = new Player();
        player.toString();
        player.play();
        player.toString();
        System.out.println("存档");
        Caretaker caretaker = new Caretaker();
        caretaker.save(player.createMemoto());
        player.attackBoss();
        player.toString();
        player.restore(caretaker.load());
        player.toString();
    }
}
```

输出：

打完boss后，红和蓝都不满了，想重新回到打boss之前的状态就直接恢复之前备份的状态就行了。

当然，真实的游戏中你的游戏进度也会保存在存档中，恢复了状态肯定也要重新打boss了。

## Android中的备忘录模式

在Activity中有这两个方法：

```java
    @Override
    public void onSaveInstanceState(Bundle outState, PersistableBundle outPersistentState) {
        super.onSaveInstanceState(outState, outPersistentState);
    }
    @Override
    protected void onRestoreInstanceState(Bundle savedInstanceState) {
        super.onRestoreInstanceState(savedInstanceState);
    }
```

我们在用他们的时候目的就是为了保存Activity当前的状态，所以这个就是个备忘录模式。当然，操作者，备份和恢复过程等，已经被系统帮忙做了一部分。

## 总结

### 优点

- 提供了一种备份恢复机制，使用户能方便的回到某个时刻的状态。
- 保存的状态是保存在发起人之外的类的，实现了对保存的状态的封装。发起人就不需要对备份进行管理了。

### 缺点

- 每一次保存都会消耗一定的内存。当保存的状态非常多的时候，会非常消耗资源。
