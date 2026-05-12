# 20、Android设计模式 - 外观模式
- 来源：https://ddkk.com/zhuanlan/design/android/1/20.html
- 分类：设计模式
- 分组：教程目录
外观模式猛一听有点蒙逼，但是在开发中我们应该都用过，只是没这个概念罢了。

比如在开发时通常会把图片加载框架和网络框架进行封装，封装到最后只暴露出来一个最上级的类供外部调用，外部调用这一个类提供的方法，然后这个类内部具体调用了什么，用的什么逻辑等等外部都不用管。这样也方便后期随便更换图片加载框架和网络框架，而业务代码不用做任何改动。

这其实就是外观模式的一种实现。

## 定义

要求子系统的外部与其内部的通讯必须通过一个统一的对象进行。提供一个高层次接口，使得子系统更易于使用，

## 使用场景

- 为一个复杂的子系统 提供一个简单的接口。子系统可能因为不断演化而变得越来越复杂，甚至可能被替换，就像上面提到的封装的框架。这种模式能让子系统有更高的独立性，对外隔离了子系统的变化。
- 当需要构建一个层次结构的子系统是，可以用这个模式定义每一层的接口，使各个层次之间的耦合度降低。

## UML

- Facade: 系统对外的统一接口，系统内部系统地工作。
- SubSystemA,B,C,D: 子系统。

比如客户端要用子系统A和B一起来完成一个操作，又要用B和C和D完成一个操作，那么就需要同事依赖着四个类。子系统有了一个门面之后，客户端就可以只依赖这个门面，调用他的方法。这个门面内部会调度各个子系统来完成协调工作。

## 简单实现

这里以一个手机为例。然后再更精简一点。手机可以看成是一个系统的facade，他继承了电话，上网，摄像头功能。当我们需要视频通话时，只需要调用手机的视频通话功能就行，通话结束后直接调用挂机就行。因为手机已经集成了这些功能，手机内部会调用各个系统来完成这个操作。

想象一下如果没有手机的封装，我们视频通话的操作可能就是：打开摄像头–上网–通话。然后挂断就要手动断掉通话，然后手动关掉摄像头。

先看电话功能模块：

```java
public interface Phone {
     void dail();
     void hangup();
}
public class PhoneImpl implements Phone {
    @Override
    public void dail() {
        System.out.println("打电话");
    }
    @Override
    public void hangup() {
        System.out.println("挂断");
    }
}
```

摄像头模块：

```java
public interface Camera {
    void open();
    void takePicture();
    void close();
}
public class CameraImpl implements Camera {
    @Override
    public void open() {
        System.out.println("打开相机");
    }
    @Override
    public void takePicture() {
        System.out.println("开始视频");
    }
    @Override
    public void close() {
        System.out.println("关闭相机");
    }
}
```

然后封装一个门面：

```java
public class MobilePhone {
    private Phone phone = new PhoneImpl();
    private Camera camera = new CameraImpl();
    public void videoChat(){
        camera.open();
        phone.dail();
    }
    public void hangup(){
        phone.hangup();
        camera.close();
    }
}
```

客户端直接调动统一的接口就行了：

```java
public class Client {
    public static void main(String[] args) {
        MobilePhone mobilePhone = new MobilePhone();
        mobilePhone.videoChat();
        System.out.println("----");
        mobilePhone.hangup();
    }
}
```

输出：

## 总结

外观模式的精髓就在于封装。通过封装出一个高层的统一调动接口，为系统提供统一的API，让用户通过一个API就能控制整个系统，减少 用户的使用成本，也提高了系统的灵活性。

### 优点

- 对客户屏蔽了子系统减少了客户端要调用的系统个数，减少了客户对子系统的耦合。
- 客户也可以直接使用子系统，是系统更加灵活。
- 修改子系统不用修改客户端的调用。但是外观类可能要进行对应的修改。

### 缺点

- 所有子系统的功能都通过一个接口来提供，这个接口可能会变得很复杂。
- 修改子系统可能要修改外观类，不太符合开闭原则。
