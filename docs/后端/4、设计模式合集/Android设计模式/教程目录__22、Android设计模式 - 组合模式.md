# 22、Android设计模式 - 组合模式
- 来源：https://ddkk.com/zhuanlan/design/android/1/22.html
- 分类：设计模式
- 分组：教程目录
组合模式，也称作部分整体模式。是结构型设计模式之一。组合模式画成图就是数据结构中的树结构，有一个根节点，然后有很多分支。将最顶部的根节点叫做根结构件，将有分支的节点叫做枝干构件，将没有分支的末端节点叫做叶子构件.

## 定义

将对象组合成树形结构以表示“部分-整体”的层次结构，使得用户对单个对象和组合对象的使用具有一致性。

## 使用场景

- 想表示对象的部分-整体层次结构时。
- 希望用户忽略单个对象和组合对象的不同，对对象使用具有统一性时。
- 从一个整体中能够独立出部分模块或功能时。

## UML

### 安全的组合模式

- Component:抽象节点，为组合中的对象声明接口，适当的时候实现所有类的公有接口方法的默认行为。
- Composite：定义所有枝干节点的行为，存储子节点，实现相关操作。
- Leaf：叶子节点，没有子节点，实现相关对象的行为。

看一下这个模式的通用代码

抽象的节点：

```java
public abstract class Component {
    protected String name;
    public Component(String name) {
        this.name = name;
    }
    public abstract void doSonthing();
}
```

枝干节点：

```java
public class Composite extends Component {
    private List<Component> components = new ArrayList<>();
    public Composite(String name) {
        super(name);
    }
    @Override
    public void doSonthing() {
        System.out.println(name);
        if (null!=components){
            for (Component c:components) {
                c.doSonthing();
            }
        }
    }
    public void addChild(Component child){
        components.add(child);
    }
    public void removeChild(Component child){
        components.remove(child);
    }
    public Component getChild(int index){
        return components.get(index);
    }
}
```

叶子节点：

```java
public class Leaf extends Component {
    public Leaf(String name) {
        super(name);
    }
    @Override
    public void doSonthing() {
        System.out.println(name);
    }
}
```

客户端调用：

```java
public class CLient {
    public static void main(String[] args) {
        Composite root = new Composite("root");
        Composite branch1 = new Composite("branch1");
        Composite branch2 = new Composite("branch2");
        Composite branch3 = new Composite("branch3");
        Leaf leaf1 = new Leaf("leaf1");
        Leaf leaf2 = new Leaf("leaf2");
        Leaf leaf3 = new Leaf("leaf3");
        branch1.addChild(leaf1);
        branch3.addChild(leaf2);
        branch3.addChild(leaf3);
        root.addChild(branch1);
        root.addChild(branch2);
        root.addChild(branch3);
        root.doSonthing();
    }
}
```

输出：

我们可以发现在Client使用的时候，根本没用到接口Component。违反了依赖倒置原则。

因为接口中没有定义公共方法，必须使用对应搞得实现节点才能完成相应的操作，叫安全的组合模式。

### 透明的组合模式

所以就有一种透明的组合模式，所有的节点都包含有同样的结构

抽象的节点：

```java
public abstract class Component {
    protected String name;
    public Component(String name) {
        this.name = name;
    }
    public abstract void doSonthing();
    public abstract void addChild(Component child);
    public abstract void removeChild(Component child);
    public abstract Component getChild(int index);
}
```

枝干节点：

```java
public class Composite extends Component {
    private List<Component> components = new ArrayList<>();
    public Composite(String name) {
        super(name);
    }
    @Override
    public void doSonthing() {
        System.out.println(name);
        if (null!=components){
            for (Component c:components) {
                c.doSonthing();
            }
        }
    }
    public void addChild(Component child){
        components.add(child);
    }
    public void removeChild(Component child){
        components.remove(child);
    }
    public Component getChild(int index){
        return components.get(index);
    }
}
```

叶子节点：

```java
public class Leaf extends Component {
    public Leaf(String name) {
        super(name);
    }
    @Override
    public void doSonthing() {
        System.out.println(name);
    }
    @Override
    public void addChild(Component child) {
        throw new UnsupportedOperationException("叶子节点没有子节点");
    }
    @Override
    public void removeChild(Component child) {
        throw new UnsupportedOperationException("叶子节点没有子节点");
    }
    @Override
    public Component getChild(int index) {
        throw new UnsupportedOperationException("叶子节点没有子节点");
    }
}
```

客户端调用：

```java
public class CLient {
    public static void main(String[] args) {
        Component root = new Composite("root");
        Component branch1 = new Composite("branch1");
        Component branch2 = new Composite("branch2");
        Component branch3 = new Composite("branch3");
        Component leaf1 = new Leaf("leaf1");
        Component leaf2 = new Leaf("leaf2");
        Component leaf3 = new Leaf("leaf3");
        branch1.addChild(leaf1);
        branch3.addChild(leaf2);
        branch3.addChild(leaf3);
        root.addChild(branch1);
        root.addChild(branch2);
        root.addChild(branch3);
        root.doSonthing();
    }
}
```

输出：

## 简单实现

以文件夹系统举个例子：

抽象的文件系统：

```java
public abstract class Dir {
    protected List<Dir> dirs = new ArrayList<>();
    private String name;
    public Dir(String name) {
        this.name = name;
    }
    public abstract void addDir(Dir dir);
    public abstract void rmDir(Dir dir);//删除文件或文件夹
    public abstract void clear();//清空所有元素
    public abstract void print();//打印文件夹系统结构
    public abstract List<Dir> getFiles();
    public  String getName(){
        return name;
    }
}
```

文件夹：

```java
public class Folder extends Dir {
    public Folder(String name) {
        super(name);
    }
    @Override
    public void addDir(Dir dir) {
        dirs.add(dir);
    }
    @Override
    public void rmDir(Dir dir) {
        dirs.remove(dir);
    }
    @Override
    public void clear() {
        dirs.clear();
    }
    @Override
    public void print() {
        //利用递归来输出文件夹结构
        System.out.print(getName()+"(");
        Iterator<Dir> i = dirs.iterator();
        while (i.hasNext()){
            Dir dir = i.next();
            dir.print();
            if (i.hasNext()){
                System.out.print(", ");
            }
        }
        System.out.print(")");
    }
    @Override
    public List<Dir> getFiles() {
        return dirs;
    }
}
```

文件：

```java
public class File extends Dir {
    public File(String name) {
        super(name);
    }
    @Override
    public void addDir(Dir dir) {
        throw new UnsupportedOperationException("文件不支持此操作");
    }
    @Override
    public void rmDir(Dir dir) {
        throw new UnsupportedOperationException("文件不支持此操作");
    }
    @Override
    public void clear() {
        throw new UnsupportedOperationException("文件不支持此操作");
    }
    @Override
    public void print() {
        System.out.print(getName());
    }
    @Override
    public List<Dir> getFiles() {
        throw new UnsupportedOperationException("文件不支持此操作");
    }
}
```

客户端调用：

```java
public class Client {
    public static void main(String[] args) {
        //创建根目录 root
        Dir root = new Folder("root");
        //root下有个文件log.txt和三个文件夹 system,user,lib;
        root.addDir(new File("log.txt"));
        Dir system = new Folder("system");
        system.addDir(new File("systemlog.txt"));
        root.addDir(system);
        Dir user = new Folder("user");
        user.addDir(new File("usernamelist.txt"));
        root.addDir(user);
        Dir lib = new Folder("lib");
        lib.addDir(new File("libs.txt"));
        root.addDir(lib);
        root.print();
    }
}
```

输出：

## Android源码中的组合模式

组合模式在Android中太常用了，View和ViewGroup就是一种很标准的组合模式：

在Android的视图树中，容器一定是ViewGroup，只有ViewGroup才能包含其他View和ViewGroup。View是没有容器的。者是一种安全的组合模式。

## 总结

在Android开发中用到组合模式并不很多，组合模式更多的用于界面UI的架构设计上，而这部分让开发者去实现的并不多。

### 优点

- 可以清楚定义分层次的复杂对象，表示全部或部分层次，让高层忽略层次的差异，方便对整个层次结构进行控制。
- 高层模块可以一致的使用一个组合结构或其中的单个对象，不必挂心处理的是单个对象还是整个组合结构，简化了高层模块的代码。
- 增加新的枝干和叶子构件都很方便，无需对现有类进行任何修改，就像增加一个自定义View一样。
- 将对象之间的关系形成树形结构，便于控制。

### 缺点

- 设计变得更加抽象，因此很难限制组合中的组件，因为他们都来自相同的抽象层。所以必须在运行时进行类型检查才能实现。
