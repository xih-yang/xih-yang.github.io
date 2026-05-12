# 18、Android设计模式 - 装饰模式
- 来源：https://ddkk.com/zhuanlan/design/android/1/18.html
- 分类：设计模式
- 分组：教程目录
装饰模式也叫做包装模式，是结构型设计模式之一。目的是为了给一个类或对象增加行为。可以是继承的一种替代。

装饰模式也很好理解，比如一个人，给他装上火箭就能上天了，装上潜水服就能下海了，但本身还是个人，人没有任何变化。

## 定义

动态地给一个对象添加一些额外的职责，就增加对象功能来说，装饰模式比生成子类实现更为灵活。

## 使用场景

- 需要拓展一个类的功能，增加附加职责时。
- 需要动态增加功能，并动态删除功能时。
- 当不能使用继承，但要提供继承的功能时。

## UML

- Component:抽象组件，可以是一个接口或抽象类，是被装饰的原始对象
- ConcreteComponent：组件的具体实现类。是被装饰的具体对象。
- Decorator：抽象的装饰者。职责是装饰被装饰的对象。内部一定有一个对被装饰者的引用。一般情况下也是一个抽象类，根据具体逻辑实现不同的子类。如果逻辑简单可以直接是实现类。
- ConcreteDecoratorA，B：具体的装饰者。

先抽象组件类：

```java
public abstract class Component {
    public abstract void operate();
}
```

组件的一个具体实现类，也就是被装饰者者：

```java
public class ConcreteComponent extends Component {
    @Override
    public void operate() {
        System.out.println("被装饰者的操作");
    }
}
```

抽象的装饰者，持有一个被装饰者的引用：

```java
public abstract class Decorator extends Component {
    private Component component;
    public Decorator(Component component) {
        this.component = component;
    }
    @Override
    public void operate() {
        component.operate();
    }
}
```

具体的两个装饰者，拓展功能：

```java
public class ConcreteDecoratorA extends Decorator {
    public ConcreteDecoratorA(Component component) {
        super(component);
    }
    @Override
    public void operate() {
        operateA();
        super.operate();
        operateB();
    }
    private void operateA(){
        System.out.println("装饰者A在被装饰者的操作之前加些操作");
    }
    private void operateB(){
        System.out.println("装饰者A在被装饰者的操作之前后加些操作");
    }
}
```

```java
public class ConcreteDecoratorB extends Decorator {
    public ConcreteDecoratorB(Component component) {
        super(component);
    }
    @Override
    public void operate() {
        operateA();
        super.operate();
        operateB();
    }
    private void operateA(){
        System.out.println("装饰者B在被装饰者的操作之前加些操作");
    }
    private void operateB(){
        System.out.println("装饰者B在被装饰者的操作之前后加些操作");
    }
}
```

客户端调用：

```java
public class Client {
    public static void main(String[] args) {
        Component component = new ConcreteComponent();
        ConcreteDecoratorA concreteDecoratorA = new ConcreteDecoratorA(component);
        ConcreteDecoratorB concreteDecoratorB = new ConcreteDecoratorB(component);
        concreteDecoratorA.operate();
        concreteDecoratorB.operate();
    }
}
```

输出：

装饰类并没有在原来的类上做审核改动，只是拓展了一些操作。通过不同的包装类就能拓展不同的功能。而传入不同的被包装类，也能拓展不同的具体对象。

## 简单实现

拿一开始说的那个人为例子。人是个抽象的概念。男孩是个具体的人。但是这个人要干不同的事情要穿不一样的衣服，就需要进行不同的包装。

抽象的人:

```java
public abstract class Person {
    public abstract void dress();
}
```

具体的人,也是原始的人，被装饰者：

```java
public class Boy extends Person {
    @Override
    public void dress() {
        System.out.println("穿内衣内裤");
    }
}
```

抽象的装饰者：

```java
public abstract class PersonDecorator {
    Person person;
    public PersonDecorator(Person person) {
        this.person = person;
    }
    public void dress(){
        person.dress();
    }
}
```

工作人装饰者：

```java
public class WorkPersonDecorator extends PersonDecorator {
    public WorkPersonDecorator(Person person) {
        super(person);
    }
    @Override
    public void dress() {
        super.dress();
        dressWork();
    }
    private void dressWork(){
        System.out.println("穿西装领带");
    }
}
```

运动的人装饰者：

```java
public class SportPersonDecorator extends PersonDecorator {
    public SportPersonDecorator(Person person) {
        super(person);
    }
    @Override
    public void dress() {
        super.dress();
        dressSport();
    }
    private void dressSport(){
        System.out.println("穿运动衣");
    }
}
```

客户端调用：

```java
public class Client {
    public static void main(String[] args) {
        Person boy = new Boy();
        System.out.println("包装一个上班人：");
        WorkPersonDecorator workPersonDecorator = new WorkPersonDecorator(boy);
        workPersonDecorator.dress();
        System.out.println("包装一个运动的人：");
        SportPersonDecorator sportPersonDecorator = new SportPersonDecorator(boy);
        sportPersonDecorator.dress();
    }
}
```

输出：

## Android中的装饰者模式

经常使用的Context其实用的就是包装模式：

先看一下他们的继承关系：

Activity的：

然后是service的：

然后是application的:

他们都继承了ContextWrapper类。根据这个名字就觉得这是一个装饰类。装饰类里面会持有一个被装饰者的引用，找一下：

```java
package android.content;
public class ContextWrapper extends Context {
    Context mBase;
    public ContextWrapper(Context base) {
        mBase = base;
    }
    protected void attachBaseContext(Context base) {
        if (mBase != null) {
            throw new IllegalStateException("Base context already set");
        }
        mBase = base;
    }
    @Override
    public AssetManager getAssets() {
        return mBase.getAssets();
    }
    //.......
}
```

看到前面这两行就感觉找对了。有两种方法可以给mBase赋值。而且这个类的一切操作都像getAssets方法一样，调用的是mBase的方法。因此可以知道，传进来的mBase才是真正的执行者。

接下来就找一下具体的被包装类是什么。

在分析Activity的onCreate方法调用时，知道activity的创建是在ActivityThread的performLaunchActivity方法中的，再来看一下：

```java
private Activity performLaunchActivity(ActivityClientRecord r, Intent customIntent) {
        Activity activity = null;
        try {
            //创建Activity
            java.lang.ClassLoader cl = r.packageInfo.getClassLoader();
            activity = mInstrumentation.newActivity(
                    cl, component.getClassName(), r.intent);
            StrictMode.incrementExpectedActivityCount(activity.getClass());
            r.intent.setExtrasClassLoader(cl);
            r.intent.prepareToEnterProcess();
            if (r.state != null) {
                r.state.setClassLoader(cl);
            }
        } 
//......
        try {
            Application app = r.packageInfo.makeApplication(false, mInstrumentation);
            if (activity != null) {
                //创建Activity的Context
                Context appContext = createBaseContextForActivity(r, activity);
                //......
                activity.attach(appContext, this, getInstrumentation(), r.token,
                        r.ident, app, r.intent, r.activityInfo, title, r.parent,
                        r.embeddedID, r.lastNonConfigurationInstances, config,
                        r.referrer, r.voiceInteractor, window);
                //......
            }
            //......
        } 
        return activity;
    }
```

createBaseContextForActivity创建的是具体的Activity的Context，查看源码发现是ContextImpl：

```java
private Context createBaseContextForActivity(ActivityClientRecord r, final Activity activity) {
        //......这里创建的是ContextImpl。
        ContextImpl appContext = ContextImpl.createActivityContext(
                this, r.packageInfo, r.token, displayId, r.overrideConfig);
        appContext.setOuterContext(activity);
        Context baseContext = appContext;
        //......
        return baseContext;
    }
```

在performLaunchActivity通过createBaseContextForActivity拿到一个ContextImpl之后，会调用activity.attach方法,看这个方法：

```java
final void attach(Context context, ActivityThread aThread,
            Instrumentation instr, IBinder token, int ident,
            Application application, Intent intent, ActivityInfo info,
            CharSequence title, Activity parent, String id,
            NonConfigurationInstances lastNonConfigurationInstances,
            Configuration config, String referrer, IVoiceInteractor voiceInteractor,
            Window window) {
        attachBaseContext(context);
        //......
    }
```

都知道传进来的是前面获取的ContextImpl。

然后调用Activity的父类ContextThemeWrapper的attachBaseContext方法：

```java
@Override
    protected void attachBaseContext(Context newBase) {
        super.attachBaseContext(newBase);
    }
```

看他有调用了父类的方法，ContextThemeWrapper的父类就是ContextWrapper了，然后就回到了ContextWrapper。

前面可以看到ContextWrapper刚好就有个attachBaseContext，给mBase赋值，因此可以说，至少在Activity上，ContextWrapper这个装饰类里面引用的具体被装饰类是ContextImpl。其实Application和Service的被装饰者也是ContextImpl。

```java
package android.app;
class ContextImpl extends Context {
    //......
    @Override
    public AssetManager getAssets() {
        return getResources().getAssets();
    }
    //......
}
```

下面就可以画出他们的关系了：

## 总结

装饰模式和前面的代理模式有点类似，容易把装饰模式看成代理模式。装饰模式是继承的一种替代方案，主要为所装饰的对象增强功能，动态的增加方法。而代理模式主要是为了控制对原有对象的访问权限，不对原有对象进行功能增强。

我觉得两者的区别主要是使用目的的区别。

### 优点

- 是继承的一种替代方案，但是比继承要灵活的多，可以在运行时通过传入不同的被装饰器或不同的装饰器来达成不同的行为。
- 增加新的被装饰类和装饰类很方便，而且不用修改原有代码。便于拓展。符合开闭原则。

### 缺点

- 设计模式基本都有这个缺点，就是会生成额外的类，增加系统复杂度。
- 由于装饰可以层层包装，交叉包装，如果包装的很深的话，调试排错会比较麻烦，也不容易理解。
