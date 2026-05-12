# 02、Java集合：Iterable、Collection(List、Set、Queue)、AbstractCollection
- 来源：https://ddkk.com/zhuanlan/java/concurrency/3/2.html
- 分类：Java并发
- 分组：教程目录
## Iterable

是Collection(List、Set、Queue)的顶级接口，api释义：实现这个接口允许对象成为 "foreach" 语句的目标。

可用于迭代。之所以List、Set没有直接实现Iterator接口，是由于Iterator的迭代(next及hashNext方法)是基于迭代器的当前位置。若直接实现，则当集合类被当做方法参数传递时，迭代位置不可知，导致next()方法结果不可知。

单独实现则可每次都返回从起始位置开始遍历的迭代器。

List的迭代由AbstractList类实现，Set由具体集合类实现，如HashSet、TreeSet均有,Queue由具体集合类实现，如LinkedBlockingQueue。

```java
public abstract interface Iterable<T> {
    public abstract Iterator<T> iterator();//返回一个在一组 T 类型的元素上进行迭代的迭代器。
}
 
public abstract interface Iterator<E> {
    //是否还有下一个元素
    public abstract boolean hasNext();
   //返回下一个元素
    public abstract E next();
    //移除当前元素
    public abstract void remove();
}
```

### Collection

public abstract interface Collection`` extends Iterable``：Collection 层次结构中的根接口。

Collection 表示一组对象，这些对象也称为 collection 的元素。一些 collection 允许有重复的元素，而另一些则不允许。一些 collection 是有序的，而另一些则是无序的。JDK 不提供此接口的任何直接 实现：它提供更具体的子接口（如 Set 和 List）实现。此接口通常用来传递 collection，并在需要最大普遍性的地方操作这些 collection。

Collections是其帮助类。

## AbstractCollection

此类提供 Collection 接口的骨干实现，以最大限度地减少了实现此接口所需的工作。

要实现一个不可修改的 collection，编程人员只需扩展此类，并提供 iterator 和 size 方法的实现。（iterator 方法返回的迭代器必须实现 hasNext 和 next。）

要实现可修改的 collection，编程人员必须另外重写此类的 add 方法（否则，会抛出 UnsupportedOperationException），iterator 方法返回的迭代器还必须另外实现其 remove 方法。

```java
     public boolean add(E param) {
        throw new UnsupportedOperationException();//不支持的操作，若想修改，子类必须重写
    }
```

抽象类默认实现了以下方法：contains、remove、addAll、removeAll、retainAll、isEmpty、clear、toArray、toString
