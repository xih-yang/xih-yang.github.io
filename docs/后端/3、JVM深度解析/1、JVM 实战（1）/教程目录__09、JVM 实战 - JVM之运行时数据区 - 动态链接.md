# 09、JVM 实战 - JVM之运行时数据区 - 动态链接
- 来源：https://ddkk.com/zhuanlan/java/jvm/1/9.html
- 分类：JVM 实战
- 分组：教程目录
### 一、动态链接

Class文件中存在一个常量池表（Constant Pool Table），存了编译之后各种字面量和符号引用，其中，方法之间的调用也被表示成符号引用，这种符号引用类加载或者程序执行期间转为直接引用，程序执行期间方法调用从符号引用转为直接引用就是动态链接(Dynamic Linking)。为了支持动态连接实现，每一个栈帧中都有一个指向运行时常量池中该栈帧所属方法的引用。所以要想理解动态链接，就首先了解虚拟机中是如何进行方法调用。

### 二、方法调用

```java
public class StaticResolutionDemo {
    public static void sayHello() {
        System.out.println("hell0, world!");
    }
    public static void main(String[] args) {
        sayHello();
    }
}
```

字节码代码：

```java
0 invokestatic5 <vmstack/StaticResolutionDemo.sayHello>
3 return
```

**这里的方法调用并不等同于方法中的代码被执行，而是当一个方法调用另一个方法时，虚拟机是如何确定目标方法的版本（即调用那一个方法）** 。如上字节码代码，Class文件中的方法调用都是符号引用，而不是方法在实际运行时的内存布局中的入口地址（直接引用）。**所以需要将符号引用转换为直接引用，对于编译期间就确定目标方法版本的方法调用，这部分会在类加载的解析阶段完成转换，与之相反的另一部分程序运行期间才能确定目标方法版本完成转换，前者称为静态解析（解析调用），后者就被称为动态链接（分派调用）。**

#### 1、方法调用的字节码指令

不同类型方法调用时对应的字节码指令不同，虚拟机中有5种支持方法调用的字节码指令：

- invokestatic: 调用静态方法
- invokespecial：调用实例构造方法``、私有方法和父类中的方法
- invokevirtual：调用所有虚方法
- invokeinterface：调用接口方法，会在运行时确定一个实现改接口的对象
- invokedynamic：先在运行时动态解析出调用点限定符所引用的方法，然后再执行该方法。前面4条调用指令，分派逻辑都固化在Java虚拟机内部，而invokedynamic指令的分派逻辑是由用户设定的引导方法来决定的。

**字节码中的方法调用指令就是以常量池中指向方法的符号引用作为参数，**这一点在前面的字节码代码中可以看到invokestatic指令后面跟着符号引用的常量。

#### 2、解析调用

对于invokestatic和invokespecial指令调用的方法，在编译期间就可以确定被调用目标方法的版本，并且在运行期间也不会改变，因为静态方法和私有方法，前者跟类型绑定，后者不能被外部访问，他们都不能因为继承或者重写而出现其他方法版本，而实例构造方法和父类方法确定之后的版本也不会在运行期间发生改变。另外，还有final修饰的方法，因为无法被继承覆盖，所以也会在编译期间确定调用版本，即使他被invokevirtual指令调用。**所以静态解析的方法有静态方法、私有方法、实例构造方法、父类方法和final修饰的方法五种，这五种方法会在类加载的解析阶段会由符号引用转为该方法的直接引用，上述方法也被称非虚方法，与之对应的是虚方法。**

#### 3、分派调用

解析调用是针对编译期间确定调用版本的方法，像实现Java语言多态特性的方法重载和方法重写就会存在多个方法版本，为了筛选目标方法的调用版本，就出现了分派调用方式，分派调用不仅含有静态，也含有动态。

- 3.1 静态分派

```java
public class DispatchDemo {
    static abstract class Human {
    }
    static class Man extends Human {
    }
    static class Woman extends Human {
    }
    public void sayHello(Human human) {
        System.out.println("Hello, human");
    }
    public void sayHello(Man man) {
        System.out.println("Hello, man");
    }
    public void sayHello(Woman man) {
        System.out.println("Hello, woman");
    }
    public static void main(String[] args) {
        Human man = new Man();
        DispatchDemo dd = new DispatchDemo();
        dd.sayHello(man);
    }
}    
```

执行结果：

```java
Hello, human
```

首先看如上代码是一个方法重载的实现，根据Java基础，方法重载是根据参数类型和参数数量确定调用的方法版本，再看执行结果，无论是new的实例时Man还是Woman，结果都是human版本方法的，这里方法调用版本是根据传入Human类型确定了方法版本，而Human我们可以称为静态类型，而Man和Woman可以称为实际类型，静态类型是在编译期间可知，而实际类型只能在运行期间确定，上述代码中，虽然有多个sayHello方法，**但是在编译期间编译器依据静态类型就确定了sayHello方法的调用版本，像这种依赖静态类型进行确定方法调用版本的分派称为静态分派**，典型应用代表是方法重载。静态分派在编译期间就确定了目标方法版本，和之前解析调用相似，所以也有的书会将静态分派归到解析调用中。

**注意：分派调用和解析调用并不是二选一，像静态方法也可以有重载版本，选择方法的调用版本也是通过静态分派，所以两者只是不同层次上确定调用目标方法的方式，而不是排他关系。**

- 3.2 动态分派

```java
public class DynamicDispatchDemo {
    public static void main(String[] args) {
        Human man = new Man();
        Human woman = new Woman();
        man.sayHello();
        woman.sayHello();
    }
}
abstract class Human {
    void sayHello() {};
}
class Man extends Human {
    @Override
    public void sayHello() {
        System.out.println("Hello, Man");
    }
}
class Woman extends Human {
    @Override
    public void sayHello() {
        System.out.println("Hello, Woman");
    }
}
```

执行结果：

```java
Hello, Man
Hello, Woman
```

字节码：

```java
 0 new2 <vmstack/Man>
 3 dup
 4 invokespecial3 <vmstack/Man.<init>>
 7 astore_1
 8 new4 <vmstack/Woman>
11 dup
12 invokespecial5 <vmstack/Woman.<init>>
15 astore_2
16 aload_1
17 invokevirtual6 <vmstack/Human.sayHello>
20 aload_2
21 invokevirtual6 <vmstack/Human.sayHello>
24 return
```

方法重载对应静态分派，方法重写对应动态分派，动态分派是在运行期间根据实际类型确定方法调用的版本，如上代码，是一段方法重写的代码以及执行结果和字节码代码，显然，由执行结果可知，这里选择方法版本不再根据静态类型Human，而是以实际类型Man和Woman为准，再看字节码，invokevirtual指令后面符号引用都指向Human的sayHello，所以该指令在运行期间对方法版本进行了重新选择，下面是具体过程：

**1、会找操作数栈栈顶元素对象的实际类型，比如man.sayHello()代码中man对象的实际类型Man（类型信息存在运行时常量池中，每个对象都有一个指向运行时常量池中所属类型的引用）；**

**2、根据实际类型的信息，匹配描述符号和简单名称（指void和sayHello）都相同的方法，再进行访问权限校验(指public)，如果通过权限校验则会返回方法的直接引用(完成符号引用到直接引用的转换)，结束查找，否则，抛出异常java.lang.IllegalAccessError。**

**3、如果根据匹配描述符号和简单名称没有查找到方法，会根据继承关系向上在父类中查找。**

**4、如果父类依然没有，则抛出java.lang.AbstractMethodError。**

3.3 虚方法表

在面向对象的编程中，动态分派使用频繁，每次动态分派的过程中，都要重新在类的元数据中搜索合适的目标的话就可能影响到执行效率，为此，虚拟机在类的方法区建立了一个虚方法表来实现使用索引表来代替查找。每个类都有一个自己的虚方法表，存放的是方法的实际入口地址（就是方法的直接引用）。虚方法表会在类加载的链接阶段创建并开始初始化，类的变量值初始完成之后，虚方法表也会初始完成。

**虚方法表中存放着各个方法的实际入口地址，如果某个方法在子类没有被重写，那么该方法在子类和父类的虚方法表中的实际入口地址是一样的，都指向父类的入口，如果重写了，子类虚方法表的地址就会被替换为重写的方法入口地址，**如上图，Son类重写了Father的全部方法，所以Son类的方法表没有指向Father的类型数据(方法的直接引用存于方法去类型数据下)，而Son和Father都没有重写Object的方法，所以虚方法表中没有重写的方法都指向了Object的类型数据。
