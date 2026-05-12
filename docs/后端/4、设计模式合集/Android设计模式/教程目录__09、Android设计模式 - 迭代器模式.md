# 09、Android设计模式 - 迭代器模式
- 来源：https://ddkk.com/zhuanlan/design/android/1/9.html
- 分类：设计模式
- 分组：教程目录
迭代器模式又称游标模式，也是行为型设计模式。源于对容器的访问，主要解决容器的遍历操作。

我们队容器的访问必然会用到遍历。我们可以将遍历的方法封装到容器中，或者不提供遍历方法。如果封装在容器中，容器就承担了过多的功能。如果不提供遍历方法，使用者会自己去实现遍历方法，让容器内部细节暴露无遗。

因此在访问类和容器之间加上了第三者–迭代器。

## 定义

提供一种方法访问一个容器对象中各个元素，而又不暴露该对象的内部细节。

## 使用场景

- 遍历一个容器对象时。

## UML

- Iterator : 迭代器接口，负责定义、访问、遍历元素的接口。
- ConcreteIterator:具体的迭代类，实现迭代器接口，并记录遍历的当前位置。
- Aggregate：容器接口，负责提供创建具体迭代器的接口。
- ConcreteAggregate：具体容器类，和具体迭代器相关联。

## 模板代码

抽象的迭代器

```java
public interface Iterator<T>{
    boolean hasNext();
    T next();
}
```

具体的迭代器

```java
public class ConcreteIterator<T> implements Iterator<T> {
    private  List<T> list = new ArrayList<>();
    private int cursor = 0;
    public ConcreteIterator(List<T> list) {
        this.list = list;
    }
    @Override
    public boolean hasNext() {
        return cursor!=list.size();
    }
    @Override
    public T next() {
        T obj = null;
        if (this.hasNext()){
            obj = list.get(cursor++);
        }
        return obj;
    }
}
```

抽象的容器

```java
public interface Aggregate<T> {
    void add(T obj);
    void remove(T obj);
    Iterator<T> iterator();
}
```

具体的容器

```java
public class ConcreteAggregate<T> implements Aggregate<T> {
    private List<T> list = new ArrayList<>();
    @Override
    public void add(T obj) {
        list.add(obj);
    }
    @Override
    public void remove(T obj) {
        list.remove(obj);
    }
    @Override
    public Iterator<T> iterator() {
        return new ConcreteIterator<>(list);
    }
}
```

客户端调用

```java
public class Client {
    public static void main(String[] args) {
        Aggregate aggregate = new ConcreteAggregate();
        aggregate.add("a");
        aggregate.add("r");
        aggregate.add("f");
        aggregate.add("w");
        aggregate.add("e");
        Iterator iterator = aggregate.iterator();
        while (iterator.hasNext()){
            System.out.println(iterator.next());
        }
    }
}
```

输出

## 简单实现

可以直接用上面的模板代码，集合是泛型，存什么都可以。因为迭代器就是用来遍历的。

## Android中的迭代器模式

其实在上面的例子中用List来存储本来就是不合适的。因为Java本身提供的容器都已经提供了相应的迭代器。所以在开发中，我们基本不需要亲自去实现。

Android中的迭代器例子有一个是SQLite数据库的查询了。

```java
SQLiteDatabase db = SQLiteDatabase.openDatabase(path, null,SQLiteDatabase.OPEN_READWRITE);
Cursor cursor = db.rawQuery("select * from android_basic , 15",null);
```

返回的是一个Cursor对象，这个对象实质是其实就是个迭代器。看看他的用法。

```java
while (cursor.moveToNext()){
    //遍历读取数据
            ......
}
```

## 总结

迭代器就是把容器中遍历对象的功能提取出来，这样既不暴露容器的细节，又可以让外部访问容器内部的内容。

### 优点

- 支持不同的方式去遍历一个容器，也可以有多个遍历，弱化了容器和遍历算法之间的关系。
- 不用用户自己去实现遍历功能，也分离了容器和遍历算法，避免了容器承担过多功能。
- 封装性更好，方便修改遍历算法而不用修改容器。

### 缺点

- 类文件会增加，所以对于简单的遍历来说不是很重要。
