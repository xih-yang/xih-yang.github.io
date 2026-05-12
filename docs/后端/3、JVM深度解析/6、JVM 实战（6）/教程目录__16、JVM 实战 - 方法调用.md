# 16、JVM 实战 - 方法调用
- 来源：https://ddkk.com/zhuanlan/java/jvm/6/16.html
- 分类：JVM 实战
- 分组：教程目录
## 前言

Java具备三种特性：封装、继承、多态。

Java文件在编译过程中不会进行传统编译的连接步骤，方法调用的目标方法以符号引用的方式存储在Class文件中，这种多态特性给Java带来了更灵活的扩展能力，但也使得方法调用变得相对复杂，需要在类加载期间，甚至到运行期间才能确定目标方法的直接引用。

## 方法调用

所有方法调用的目标方法在Class文件里面都是常量池中的符号引用。在类加载的解析阶段，如果一个方法在运行之前有确定的调用版本，且在运行期间不变，虚拟机会将其符号引用解析为直接调用。

这种编译期可知，运行期不可变 的方法，主要包括静态方法和私有方法两大类，前者与具体类直接关联，后者在外部不可访问，两者都不能通过继承或别的方式进行重写。

**JVM提供了如下方法调用字节码指令**：

**1、** invokestatic：调用静态方法；

**2、** invokespecial：调用实例构造方法，私有方法和父类方法；

**3、** invokevirtual：调用虚方法；

**4、** invokeinterface：调用接口方法，在运行时再确定一个实现此接口的对象；

**5、** invokedynamic：在运行时动态解析出调用点限定符所引用的方法之后，调用该方法；

通过invokestatic和invokespecial指令调用的方法，可以在解析阶段确定唯一的调用版本，符合这种条件的有静态方法、私有方法、实例构造器和父类方法4种，它们在类加载时会把符号引用解析为该方法的直接引用。

```java
public class InvokestaticTest {
    InvokestaticTest(){
    }
    public static void sayHello() {
        System.out.println("hello");
    }
    public static void main(String args[]) {
        sayHello();
    }
}
```

javap -verbose InvokestaticTest.class

可以发现实例构造器是通过invokespecial指令调用的, sayHello方法是通过invokestatic指令调用的。

通过invokestatic和invokespecial指令调用的方法，可以称为非虚方法，其余情况称为虚方法，不过有一个特例，即被final关键字修饰的方法，虽然使用invokevirtual指令调用，由于它无法被覆盖重写，所以也是一种非虚方法。

非虚方法的调用是一个静态的过程，由于目标方法只有一个确定的版本，所以在类加载的解析阶段就可以把符合引用解析为直接引用，而虚方法的调用是一个分派的过程，有静态也有动态，可分为静态单分派、静态多分派、动态单分派和动态多分派。

## 静态分派

静态分派发生在代码的编译阶段。**针对于方法的重载**

```java
public class StaticDispatch {
    static class Parent{}
    static class Child1 extends Parent{}
    static class Child2 extends Parent{}
    public void sayHello(Parent parent){
        System.out.println("parent sayHello");
    }
    public void sayHello(Child1 child1){
        System.out.println("child1 sayHello");
    }
    public void sayHello(Child2 child2){
        System.out.println("child2 sayHello");
    }
    public static void main(String[] args) {
        Parent parent = new Parent();
        Parent parent1 = new Child1();
        Parent parent2 = new Child2();
        StaticDispatch staticDispatch = new StaticDispatch();
        staticDispatch.sayHello(parent);
        staticDispatch.sayHello(parent1);
        staticDispatch.sayHello(parent2);
        staticDispatch.sayHello((Child2)parent2);
    }
}
```

```java
parent sayHello
parent sayHello
parent sayHello
child2 sayHello
```

javap -verbose StaticDispatch.class

通过字节码指令，可以发现四次hello方法都是通过invokevirtual指令进行调用，而且前三次调用的是参数为Parent类型的sayHello方法，最后一次进行强转后，调用Child2类型的sayHello方法。

再举个例子，代码如下：

```java
public class StaticDispatchTest {
    public void sayHello(short word){
        System.out.println("short" + word);
    }
    public void sayHello(int word){
        System.out.println("int" + word);
    }
    public void sayHello(long word){
        System.out.println("long" + word);
    }
    public void sayHello(String word){
        System.out.println("String" + word);
    }
    public void sayHello(char word){
        System.out.println("char" + word);
    }
    public void sayHello(Character word){
        System.out.println("Character" + word);
    }
    public void sayHello(Object word){
        System.out.println("Object" + word);
    }
    public void sayHello(char ... word){
        System.out.println("char ..." + word);
    }
    public static void main(String[] args) {
        StaticDispatchTest staticDispatch = new StaticDispatchTest();
        staticDispatch.sayHello('a');
    }
}
```

```java
chara
```

优先匹配到char方法，其次是int，long，Character, Objedt, char...

在编译阶段，Java编译器会根据参数的静态类型决定调用哪个重载版本，但在有些情况下，重载的版本不是唯一的，这样只能选择一个“更加合适的版本”进行调用，所以不建议在实际项目中使用这种模糊的方法重载。

## 动态分派

在运行期间根据参数的实际类型确定方法执行版本的过程称为动态分派，**动态分派和多态性中的重写（override）有着紧密的联系**。

由于动态分派是非常频繁的动作，因此在虚拟机的实际实现中，会基于性能的考虑，并不会如此频繁的搜索对应方法，一般会在方法区中建立一个虚方法表，使用虚方法表代替方法查询以提高性能。

虚方法表在类加载的连接阶段进行初始化，存放着各个方法的实际入口地址，如果某个方法在子类中没有被重写，那么子类的虚方法表中该方法的入口地址和父类保持一致。

一个类的方法表包含类的所有方法入口地址，从父类继承的方法放在前面，接下来是接口方法和自定义的方法。如果某个方法在子类中没有被重写，那子类的虚方法表里面的地址入口和父类相同的方法的入口地址一致。如果子类重写了这个方法，子类方法表中的地址将会替换为指向子类实现版本的入口地址。

```java
public class DynamicDispatch {
    static class Parent{
        public void sayHello(){
            System.out.println("Parent");
        }
    }
    static class Child1 extends Parent {
        public void sayHello(){
            System.out.println("Child1");
        }
    }
    static class Child2 extends Parent {
        public void sayHello(){
            System.out.println("Child2");
        }
    }
    public static void main(String[] args) {
        Parent parent = new Parent();
        Parent parent1 = new Child1();
        Parent parent2 = new Child2();
        parent.sayHello();
        parent1.sayHello();
        parent2.sayHello();
    }
}
```

```java
Parent
Child1
Child2
```

javap -verbose DynamicDispatch.class

可以发现，25、29和33的指令完全一样，但最终执行的目标方法却不相同，这得从invokevirtual指令的多态查找说起了，invokevirtual指令在运行时分为以下几个步骤：

**1、** 找到操作数栈的栈顶元素所指向的对象的实际类型，记为C；

**2、** 如果类型C中存在描述符和简单名称都相符的方法，则进行访问权限验证，如果验证通过，则直接返回这个方法的直接引用，否则返回java.lang.IllegalAccessError异常；

**3、** 如果类型C中不存在对应的方法，则按照继承关系，从下往上依次对类型C的各父类进行搜索和验证，进行第2步的操作；

**4、** 如果各个父类也没对应的方法，则抛出异常AbstractMethodError；

## invokevirtual和invokeinterface的区别

虚函数表上的虚方法是按照从父类到子类的顺序排序的，因此对于使用invokevirtual调用的虚函数，JVM完全可以在编译期就确定了虚函数在方法表上的offset，或者在首次调用之后就把这个offset缓存起来，这样就可以快速地从方法表中定位所要调用的方法地址。

然而对于接口类型引用，由于一个接口可以被不同的Class来实现，所以接口方法在不同类的方法表的offset当然就（很可能）不一样了。因此，每次接口方法的调用，JVM都会搜寻一遍虚函数表，效率会比invokevirtual要低。
