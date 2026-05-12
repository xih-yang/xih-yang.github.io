# 05、MyBatis 源码分析 - reflection 包(一)
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/7/5.html
- 分类：ORM框架
- 分组：教程目录
> 这篇文章卡了很久，一直不知道该怎么去写（其实就是懒），因为这个包是一个非常重要的基础包，所以希望能将本文章写的好一点，让大家能更好的理解 Mybatis 的设计思想。
>
> 限于写者的水平问题，所以不一定能正确的理解背后的设计思想，如果有更好的理解，你可以写在评论区，谢谢。

### 阅前思考

包名称为 reflection 那么可以猜测这是一个和反射有关的包。反射是 Java 的一个强大的功能，可以不通过 `new` 的方式生成对象。

### reflection 的使用场景

要知道在调用映射接口文件中方法的时候，如果有返回值的话，那么就需要将数据库中返回的数据转换为指定类型对象，所以这个时候肯定就需要使用到反射。因为**生成目标类型的对象**和**操作对象的属性**都需要使用到反射。

### reflection 包结构分析

> reflection
>
>
>
> factory (生成对象)
>
>
>
> invoker (包装了类中的各个方法，eg. getXXX、setXXX)
>
>
>
> property (对象属性相关工具类)
>
>
>
> wrapper (对象的包装，可以直接操作对象的属性)

可以看到，在 reflection 包下依然分了一些子包。使包结构更加的清晰，在写业务代码的时候我们也应该要注意这些，防止后面交由新人来维护的时候需要花大量的时间来进行功能梳理。

### reflection 包分析

由于reflection 包下分了几个子包，所以根据我们之前的想法，根据外部依赖的程度来决定包的分析顺序。

#### property 子包

> property
>
>
>
> PropertyCopier.java (对象属性复制)
>
>
>
> PropertyNamer.java (属性名称相关操作)
>
>
>
> PropertyTokenizer.java (属性分词器)

由于PropertyCopier 和 PropertyNamer 的方法都很简单，所以就不在这里分析了，我们主要分析 PropertyTokenizer 的功能。

##### PropertyTokenizer 功能详解

该类是用来进行分词的。例如对字符串 ‘users[0].name’ 进行分词。分词后就能得到如下结果。

PropertyTokenizer 实现了 Iterator 接口，所以它是可以进行迭代的，因为 children 也需要进一步的分词。

#### invoker 子包

包结构图如下：

invoker 子包中最重要的类就是 Invoker 类，其他的类都是它的实现类。

```java
public interface Invoker {
  /**
   * 类似通过反射调用方法 method.invoke(Object, Object...)
   * 
   * @param target 要操作的对象
   * @param args 方法的请求参数
   * @return 方法的返回值
   */
  Object invoke(Object target, Object[] args) throws IllegalAccessException, InvocationTargetException;
  Class<?> getType();
}
```

在前面提到了 reflection 包的作用之一就是**操作对象的属性**，而 Invoker 的作用就是将反射的方法进行封装。在 Mybatis，通过反射设置对象属性值首先是调用 get/set 方法，如果属性没有 get/set 方法，才是直接操作 Field 来设置属性值。由于有多种实现方式，所以就将实现方式进行抽象，提取出了公共的 Invoker 接口。

通过浏览 Invoker 实现类的源码，就可以知道，MethodInvoker 就是用来调用 get/setXXX 方法的。GetInvoker 和 SetInvoker 就是当如果一个属性没有 get 方法时或没有 set 方法时，直接通过反射操作其 Field 来实现功能的。

如果只是想实现功能的话，这样其实就够了，但是 Mybatis 是逻辑特别严谨的框架，如果在出现一些特殊的情况时，就希望能将异常提示出来。AmbiguousMethodInvoker 的作用就是如果发现有多个方法都是一个属性的 get/set 方法时，Mybatis 并不能判断使用哪一个方法，所以就将异常信息封装到该类中，在调用的时候才会出触发这个异常信息。至于为什么不是立马抛出提示重复，只能说各有优劣吧。

#### factory 子包

包结构图如下：

由于这个包中只有两个类，并且其中一个还是另一个的实现类，所以只要看了 ObjectFactory 中声明的方法就可以知道这包的具体作用。

```java
public interface ObjectFactory {
  default void setProperties(Properties properties) {
  }
  /**
   * 使用默认的无参构造器构造器创建一个对象
   *
   * @param type 对象所属的 Class
   * @return T 类型的对象
   */
  <T> T create(Class<T> type);
  /**
   * 用指定的类构造器创建一个对象
   *
   * @param type                对象所属的 Class
   * @param constructorArgTypes 构造器的参数类型列表
   * @param constructorArgs     传入构造器的参数列表
   * @return T 类型的对象
   */
  <T> T create(Class<T> type, List<Class<?>> constructorArgTypes, List<Object> constructorArgs);
  /**
   * 传入一个 Class ，判断它是否是一个集合类型
   *
   * @param type 对象所属的 Class
   * @return Class 类型是否一个集合
   */
  <T> boolean isCollection(Class<T> type);
}
```

方法不多，而且从方法名称就可以知道具体的实现是啥，就是将反射生成对象的步骤单独封装为一个工具类。而且既然只有一个默认的实现类，为啥还需要抽象一个接口出来呢？当然是希望能更加的灵活，因为我们可以在生成对象之前有一些特殊的处理。例如：更换生成对象的类型，在生成对象后，可以为对象的属性设置默认值，等等。

#### wrapper 子包

包结构图如下：

通过观察包结构，我们可以知道，整个包的核心是 ObjectWrapper 接口，其他的类要么使它的实现类要么就是它的工厂类。

```java
public interface ObjectWrapper {
  /*
    get/set 方法
  */
  Object get(PropertyTokenizer prop);
  void set(PropertyTokenizer prop, Object value);
  /*
    格式化属性名称
  */
  String findProperty(String name, boolean useCamelCaseMapping);
  /*
    获取所有可以 get 或者 set 的属性名称
  */
  String[] getGetterNames();
  String[] getSetterNames();
  /*
    获取 get 得到的类型或者 set 需要传递的类型
  */
  Class<?> getSetterType(String name);
  Class<?> getGetterType(String name);
  /*
    属性是否可以 get/set
  */
  boolean hasSetter(String name);
  boolean hasGetter(String name);
  /*
    实例化属性
  */
  MetaObject instantiatePropertyValue(String name, PropertyTokenizer prop,
    ObjectFactory objectFactory);
  /*
    Collection 的相关操作
  */
  boolean isCollection();
  void add(Object element);
  <E> void addAll(List<E> element);
}
```

ObjectWrapper 就是对象包装器，将对象的一些可操作的属性直接暴露出来，而不是在需要的时候写反射来操作属性或其他操作（如果是 Collection 或者 Map 则不通过反射）。将操作属性的重复代码给封装起来了，变成了一个更简单易用的接口。

再观察 ObjectWrapper 的实现类，可以发现根据实现类的作用，有 BeanWrapper、CollectionWrapper、MapWrapper。根据不同对象，底层的实现方法也是不同的，并且子类并不会真正的实现所有方法，有些方法是不支持的，例如：CollectionWrapper 是对 Collection 实现类的封装，是没有 get/set 方法的。

由于CollectionWrapper 和 MapWrapper 的实现是比较简单的，所以只需要分析 BeanWrapper 就能明白背后的实现原理。
