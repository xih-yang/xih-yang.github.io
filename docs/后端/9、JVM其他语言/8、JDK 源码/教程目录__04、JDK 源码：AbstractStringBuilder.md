# 04、JDK 源码：AbstractStringBuilder
- 来源：https://ddkk.com/zhuanlan/java/jvm/12/4.html
- 分类：JDK 源码
- 分组：教程目录
## 一、AbstractStringBuilder简介

AbstractStringBuilder是StringBuffer和StringBuilder的抽象父类，它的类定义如下：

```java
abstract class AbstractStringBuilder implements Appendable, CharSequence 
```

三个属性：

```java
char[] value;
int count;
private static final int MAX_ARRAY_SIZE = Integer.MAX_VALUE - 8;
```

两个方法length()和capacity()是不同的，需要注意下：

```java
//当前已存在字符的长度
@Override
public int length() {
    return count;
}
//当前的容量
public int capacity() {
    return value.length;
}
```

## 二、AbstractStringBuilder的扩容操作

```java
//1.判断入参minimumCapacity是否有效，即是否大于0，大于0执行ensureCapacityInternal方法，小于等于0则忽略。
public void ensureCapacity(int minimumCapacity) {
    if (minimumCapacity > 0)//进行内部确认
        ensureCapacityInternal(minimumCapacity);
}
//判断入参容量值是否比原容量大，如果大于原容量，执行扩容操作,实际上就是创建一个新容量的数组，
//然后再将原数组中的内容拷贝到新数组中，如果小于或等于原容量则忽略。
private void ensureCapacityInternal(int minimumCapacity) {
    if (minimumCapacity - value.length > 0) {
        value = Arrays.copyOf(value,
                newCapacity(minimumCapacity));
    }
}
//计算新数组的容量大小，新容量取原容量的2倍加2和入参minCapacity中较大者。然后再进行一些范围        校验。
//新容量必需在int所支持的范围内，之所以有<=0判断是因为，在执行 (value.length << 1) + 2操作后，
//可能会出现int溢出的情况。如果溢出或是大于所支持的最大容量(MAX_ARRAY_SIZE为int所支持的
//最大值减8)，则进行hugeCapacity计算，否则取newCapacity
private int newCapacity(int minCapacity) {
    // overflow-conscious code
    int newCapacity = (value.length << 1) + 2;
    if (newCapacity - minCapacity < 0) {
        newCapacity = minCapacity;
    }
    return (newCapacity <= 0 || MAX_ARRAY_SIZE - newCapacity < 0)
        ? hugeCapacity(minCapacity)
        : newCapacity;
}
//这一步先进行范围检查，必须在int所支持的最大范围内。然后在minCapacity与MAX_ARRAY_SIZE
//之间取较大者，此方法取的范围是Integer.MAX_VALUE - 8到Integer.MAX_VALUE之间的范围。
private int hugeCapacity(int minCapacity) {
    if (Integer.MAX_VALUE - minCapacity < 0) { // overflow
        throw new OutOfMemoryError();
    }
    return (minCapacity > MAX_ARRAY_SIZE)
        ? minCapacity : MAX_ARRAY_SIZE;
}
```

扩容总结：

**1、** 通过value=Arrays.copyOf(value,newCapacity(minimumCapacity));进行扩容；

**2、** 新容量取minCapacity，原容量乘以2再加上2中较大的，但不能大于int所支持的最大范围；

**3、** 在实际环境中在容量远没达到MAX_ARRAY_SIZE的时候就报OutOfMemoryError异常了，其实就是在复制的时候创建了数组char[]copy=newchar[newLength];这里支持不了那么大的内存消耗，可以通过-Xms256M-Xmx768M设置最大内存；

## 三、其他重要方法

**1、** append()：用于从尾部追加；

**2、** insert()：从指定位置添加；

**3、** delete(intstart,intend)：删除字符序列指定区间的内容；

**4、** reverse()：反转字符串；

**5、** reverseAllValidSurrogatePairs()：反转UTF-16字符；
