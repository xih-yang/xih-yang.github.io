# 14、Android设计模式 - 访问者模式
- 来源：https://ddkk.com/zhuanlan/design/android/1/14.html
- 分类：设计模式
- 分组：教程目录
访问者模式是一种将数据操作与数据结构分离的设计模式。确实是我目前为止见过的最复杂的了。

访问者模式的思想是：

- 软件系统中拥有一个由许多对象构成的，比较稳定的对象结构。这些对象都拥有一个accept方法来接受访问者的访问。
- 访问者是一个接口，对对象结构中的每一个元素都提供一个visit方法，对不同的访问对象执行不同的visit方法做出不同的处理。
- 在对象结构的一次访问中，遍历整个对象结构，对每一个元素执行accept方法，在每个accept方法中调用访问者的visit方法，从而使访问者可以处理对象结构中的每一个元素。
- 可以针对同一个对象结构，设计不同的访问者类，达到区别对待的目的。

## 定义

封装某些作用于某种数据结构中各元素的操作，它可以在不改变数据结构的前提下定义作用于这些元素的新的操作。

## 使用场景

- 对象结构稳定，但经常需要在此对象结构上定义新的操作。
- 需要对一个对象结构中的元素进行很多不同的操作，为了避免这些操作“污染”这些对象的类，也为了避免在增加新操作时修改这些类。
- 加入在一组对象中存在相似的操作，为了减少代码重复率，将相同的操作封装到访问者中去。

## UML

- Visitor：接口或抽象类，定义了对每一个元素的访问行为，参数就是可访问的元素，方法个数理论上是个元素个数一样的。因此，访问者模式要求被访问的对象结构要稳定，如果经常增删元素，必然会导致频繁修改Visitor接口，就不适合用访问者模式了。
- ConcreteVisitor：具体的访问者，定义具体的对每一个元素的具体访问行为。
- Element：抽象的元素接口或抽象类，定义了一个接待访问者的方法，让每个元素都可以被访问者访问。
- Element，ElementB:具体的元素类，提供接收访问方法的具体实现。这个具体实现通常是调用访问者提供的访问该元素的方法。
- ObjectStructure：定义对象结构，里面维护了一个元素的集合，并且迭代这些元素供访问者访问。

## 简单实现

就举公司的年终考核来说。假设一个公司的基层结构很稳定，就是工程师和经理。那么不同的高层来考核就要访问他们不同的东西。

工程师和经理是被考核者，可以看成被访问者。CEO和CTO是考核者，他们的考核指标不一样，但都是考核工程师的经理，他们可以看做是访问者。

CEO访问工程师和经理，要获取他们的KPI作为考核依据。

CTO访问工程师要获取代码量，访问经理要获取项目个数作为开合依据。

被访问者，员工的基类：

```java
public abstract class Staff {
    public String name;
    public int kpi;
    public Staff(String name) {
        this.name = name;
        kpi = new Random().nextInt(10);
    }
//定义一个抽象的受访问方法
    public abstract void accept(Visitor visitor);
}
```

工程师

```java
public class Engineer extends Staff {
    public Engineer(String name) {
        super(name);
    }
//实现受访问方法，里面调用访问者的访问方法。通传参来确定调用Visitor的哪个方法。
    @Override
    public void accept(Visitor visitor) {
        visitor.visit(this);
    }
    public int getCodeLines(){
        return new Random().nextInt(1000000);
    }
}
```

经理

```java
public class Manager extends Staff {
    public Manager(String name) {
        super(name);
    }
    @Override
    public void accept(Visitor visitor) {
        visitor.visit(this);
    }
    public int getProducts(){
        return new Random().nextInt(10);
    }
}
```

访问者的抽象类,为每一个被访问者都提供可一个访问方法。

```java
public interface Visitor {
    void visit(Engineer engineer);
    void visit(Manager manager);
}
```

CTO,实现每一个访问元素的方法，访问不同的元素进行不同的操作,各取所需

```java
public class CTO implements Visitor {
    @Override
    public void visit(Engineer engineer) {
        System.out.println("我CTO考察工程师"+engineer.name+"的代码量是"+engineer.getCodeLines());
    }
    @Override
    public void visit(Manager manager) {
        System.out.println("我CTO考察经理"+manager.name+"的产品量是"+manager.getProducts());
    }
}
```

CEO，

```java
public class CEO implements Visitor {
    @Override
    public void visit(Engineer engineer) {
        System.out.println("我CEO考察工程师"+engineer.name+"的KPI是"+engineer.kpi);
    }
    @Override
    public void visit(Manager manager) {
        System.out.println("我CEO考察经理"+manager.name+"的KPI是"+manager.kpi);
    }
}
```

生成报表，也就是对象结构。内部遍历调用每一个元素的接受访问方法。

```java
public class Report {
    List<Staff> list = new ArrayList<>();
    public Report() {
        list.add(new Engineer("小王"));
        list.add(new Engineer("大王"));
        list.add(new Engineer("老王"));
        list.add(new Manager("小张"));
        list.add(new Manager("大张"));
        list.add(new Manager("老张"));
    }
    public void showReport(Visitor visitor){
        for (Staff staff:list) {
            staff.accept(visitor);
        }
    }
}
```

客户端调用

```java
public class Client {
    public static void main(String[] args) {
        Report report = new Report();
        report.showReport(new CTO());
        System.out.println("---------");
        report.showReport(new CEO());
    }
}
```

输出：

到这里能感觉到访问者模式最大的好处就是，当被访问者是固定的时候，拓展访问者非常容易。

比如现在有COO还要进行考核，那么只需实现一个COO实现Visitor接口，实现具体的访问方法。然后在`report.showReport(new COO())`，就能拿到他需要的内容了，其他地方都不用修改。

## 总结

访问者模式适合在访问对象稳定的时候使用。

### 优点

- 角色分离，各司其职，符合单一职责原则
- 具有优秀的拓展性
- 使数据结构和作用于结构上的操作解耦，是操作集合可以独立变化。

### 缺点

- 具体元素对访问者公布细节，违反了迪米特原则。
- 具体元素修改的成本太大。
- 违反了依赖倒置原则，为了达到区别对待依赖了具体而不是抽象。
