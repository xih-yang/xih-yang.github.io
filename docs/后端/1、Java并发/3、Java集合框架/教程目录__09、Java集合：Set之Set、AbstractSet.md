# 09、Java集合：Set之Set、AbstractSet
- 来源：https://ddkk.com/zhuanlan/java/concurrency/3/9.html
- 分类：Java并发
- 分组：教程目录
Set结构图

## Set

> public abstract interface Set extends Collection

- 不包含重复元素的 collection
- 重写了equals和hashCode方法
- 无序

声明方法如下：

```java
'''返回 set 中的元素数（其容量）。'''
public abstract int size();
/*如果 set 不包含元素，则返回 true。*/
public abstract boolean isEmpty();
''' 如果 set 包含指定的元素，则返回 true。'''
public abstract boolean contains(Object paramObject);
/* 返回在此 set 中的元素上进行迭代的迭代器。*/
public abstract Iterator<E> iterator();
/* 返回一个包含 set 中所有元素的数组。*/
public abstract Object[] toArray();
/*  返回一个包含此 set 中所有元素的数组；*/
public abstract <T> T[] toArray(T[] paramArrayOfT);
'''如果 set 中尚未存在指定的元素，则添加此元素。'''
public abstract boolean add(E paramE);
'''如果 set 中存在指定的元素，则将其移除。'''
public abstract boolean remove(Object paramObject);
/* 如果此 set 包含指定 collection 的所有元素，则返回 true。*/
public abstract boolean containsAll(Collection<?> paramCollection);
/* 如果 set 中没有指定 collection 中的所有元素，则将其添加到此 set 中。*/
public abstract boolean addAll(Collection<? extends E> paramCollection);
/* 仅保留 set 中那些包含在指定 collection 中的元素。*/
public abstract boolean retainAll(Collection<?> paramCollection);
/* 移除 set 中那些包含在指定 collection 中的元素。*/ 
public abstract boolean removeAll(Collection<?> paramCollection);
/* 移除此 set 中的所有元素。*/
public abstract void clear();
/* 比较指定对象与此 set 的相等性。*/
public abstract boolean equals(Object paramObject);
/* 返回 set 的哈希码值。*/
public abstract int hashCode();
```

## AbstractSet

> public abstract class AbstractSet extends AbstractCollection implements Set

- 此类并没有重写 AbstractCollection 类中的任何实现
- 仅仅添加Set接口中的 equals 和 hashCode 的实现。

实现方法如下：

> public boolean equals(Object o) ：比较指定对象与此 set 的相等性。

```java
public boolean equals(Object o) {
		if (o == this) {//判断是否是自身
			return true;
		}
		if (!(o instanceof Set))//判断对象类型
			return false;
		Collection c = (Collection) o;
		if (c.size() != size())//比较容量大小
			return false;
		try {
			return containsAll(c);//比较容器中集合元素是否全部相同
		} catch (ClassCastException localClassCastException) {
			return false;
		} catch (NullPointerException localNullPointerException) {
		}
		return false;
	}
```

> public int hashCode() ：返回此 set 的哈希码值。

```java
 public int hashCode() {
        int h = 0;
        Iterator<E> i = iterator();//遍历容器元素
        while (i.hasNext()) {
            E obj = i.next();
            if (obj != null)
                h += obj.hashCode();//对所有元素哈希码值求和
        }
        return h;//此set的哈希码值为容器中全部元素的哈希码值的和
    }
```

> public boolean removeAll(Collection c) ： 从此 set 中移除包含在指定 collection 中的所有元素。

```java
 public boolean removeAll(Collection<?> c) {
        //Objects.requireNonNull(c); jdk1.8中新增非空校验
        boolean modified = false;
		/*下面之所以判断元素数大小，为了遍历的集合是最小的一个优化*/
        if (size() > c.size()) {
            for (Iterator<?> i = c.iterator(); i.hasNext(); )
                modified |= remove(i.next());
        } else {
            for (Iterator<?> i = iterator(); i.hasNext(); ) {
                if (c.contains(i.next())) {
                    i.remove();
                    modified = true;
                }
            }
        }
        return modified;
    }
```
