# 07、Android设计模式 - 模板方法模式
- 来源：https://ddkk.com/zhuanlan/design/android/1/7.html
- 分类：设计模式
- 分组：教程目录
模板方法模式，名字就很直接，也很容易理解。什么是模板，模板就是一套固定格式。我们可以想象一个普通员工的一天的上班模板：去公司上班->工作->下班回家。

对于每一个员工来说，这三个步骤的具体内容是不一样的，但是流程都是这样的。

在开发中也会有这种情况，架构师或者高级开发人员写好一些方法流程，规定方法名，方法输出，执行顺序等等，但是方法体是空的，留给初级的开发人员去填写具体的实现功能。

而且这样一套模板用不同的平台语言实现就可以生成不同平台的产品。这些解决方案都可以称为模板方法模式。

## 定义

定义一个操作中算法的框架，而将一些步骤延迟到子类中。模板方法模式使得子类可以不改变一个算法的结构即可重定义该算法的某些特定步骤。

## 使用场景

- 多个逻辑有公有的方法，且逻辑基本相同。
- 重要、复杂的算法，可以把核心算法设计为模板方法，周边的相关细节功能由各个子类实现。
- 重构时经常会用到模板方法，把相同的代码抽取到父类中，然后通过钩子方法约束其行为。

## UML

UML图很简单

- Abstemplate：抽象类，定义了一套算法框架
- ConcreteImplA：具体实现类A
- ConcreteImplB：具体实现类B

## 简单实例

这里以打开计算机的过程为例。虽然计算机有不同的系统和用处，但是计算机的开机过程都是一样的。

启动电源–>检查系统状态–>进入操作系统–>验证身份登录

定义一个抽象的计算机模板

```java
public abstract class AbsComputer {
    protected void powerOn(){
        System.out.println("打开电源");
    }
    protected void checkHardware(){
        System.out.println("检查硬件");
    }
    protected void loadOS(){
        System.out.println("载入操作系统");
    }
    protected void login(){
        System.out.println("用户登录");
    }
    //这里不允许重写，必须按这个顺序来
    public final void startUp(){
        System.out.println("开机 START");
        checkHardware();
        loadOS();
        login();
        System.out.println("开机 END");
    }
}
```

实现一个程序员计算机

```java
public class CoderComputer extends AbsComputer {
    @Override
    protected void login() {
        super.login();
        System.out.println("程序员计算机需要验证用户名和密码");
    }
}
```

实现一个牛逼计算机

```java
public class NBComputer extends AbsComputer {
    @Override
    protected void checkHardware() {
        super.checkHardware();
        System.out.println("牛逼的计算机要验证硬件防火墙");
    }
    @Override
    protected void login() {
        super.login();
        System.out.println("牛逼的计算机要验证指纹");
    }
}
```

使用：

```java
public class Client {
    public static void main(String[] args) {
        CoderComputer coderComputer = new CoderComputer();
        coderComputer.powerOn();
        coderComputer.startUp();
        System.out.println("--------");
        NBComputer nbComputer = new NBComputer();
        nbComputer.powerOn();
        nbComputer.startUp();
    }
}
```

输出:

子类都只能修改部分具体的实现，整体的逻辑流程是不允许修改的。

## Android中的模板方法

常用的AsyncTask的使用方法是这样的：

```java
class MyAsynctask extends AsyncTask{
        @Override
        protected void onPreExecute() {
            super.onPreExecute();
        }
        @Override
        protected Object doInBackground(Object[] params) {
            return null;
        }
        @Override
        protected void onPostExecute(Object o) {
            super.onPostExecute(o);
        }
    }
```

通常要重写者三个方法。AsyncTask的执行过程就是一个逻辑流程，在这个过程中会在适当的时候执行者三个方法，这个过程是固定的。但是子类可以通过重写者三个方法来改变具体的执行内容。

## 总结

模板方法模式就是流程封装，父类提取公用代码，子类实现部分或全部步骤。父类规定了整体流程。

### 优点

- 封装不变部分，扩展可变部分，符合开闭原则。
- 提取公共代码，提高代码复用率，利于维护。

### 缺点

- 用户阅读代码时只看子类会觉得难以理解，因为子类中并不是一个完整的逻辑。
