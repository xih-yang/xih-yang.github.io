# 16、Java JUC源码分析 - 集合-ConcurrentSkipListMap、ConcurrentSkipListSet
- 来源：https://ddkk.com/zhuanlan/java/concurrency/11/16.html
- 分类：Java并发
- 分组：教程目录
NBA这赛季结束，勇士可惜啊，谁能想到没拿到冠军，库昊也没成为真正的老大，lbl一战封神，所有口水留言都变成羡慕嫉妒恨，哎，我库啊，还是还是看书吧。

ConcurrentSkipListMap说实话，之前还真没注意过，还是看JUC才看到，利用skiplist跳表结构来实现一种有序的map，之前看到的map都是无序。在学习前还是要好好了解下什么是skiplist跳表，的确很不错，利用空间换时间，复杂度为logN，跳表的原理参考http://kenby.iteye.com/blog/1187303，讲的不错，一定要多看几遍，理解不了skiplist，看这个类估计也勉强。

ConcurrentSkipListMap的特点：1.线程安全有序map；2.复杂度logN；3.无锁的map，所以并发量应该比之前的map好些，具体没测。

ConcurrentSkipListMap的结构，看个眼熟先：

*

* Head nodes Index nodes

* +-+ right +-+ +-+

* |2|---------------->| |--------------------->| |->null

* +-+ +-+ +-+

* | down | |

* v v v

* +-+ +-+ +-+ +-+ +-+ +-+

* |1|----------->| |->| |------>| |----------->| |------>| |->null

* +-+ +-+ +-+ +-+ +-+ +-+

* v | | | | |

* Nodes next v v v v v

* +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+

* | |->|A|->|B|->|C|->|D|->|E|->|F|->|G|->|H|->|I|->|J|->|K|->null

* +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+ +-+

*

3种节点：Node，Index，HeadIndex，过会再看，还有个东西：

* Notation guide for local variables

* Node: b, n, f for predecessor, node, successor

* Index: q, r, d for index node, right, down.

* t for another index node

* Head: h

* Levels: j

* Keys: k, key

* Values: v, value

* Comparisons: c

这是类中一些变量的说明，因为用的是lock-free list，所以在做各种操作时n多检查，看起来真累。

看下3中节点，Node节点先：

```java
static final class Node<K,V> {
    final K key;
    volatile Object value;
    volatile Node<K,V> next;
    /**
     * 正常节点
     */
    Node(K key, Object value, Node<K,V> next) {
        this.key = key;
        this.value = value;
        this.next = next;
    }
    /**
     * 标记节点，value指向自己.主要是删除一个节点的时候会在该节点后面追加一个标记节点
     */
    Node(Node<K,V> next) {
        this.key = null;
        this.value = this;
        this.next = next;
    }
    /**
     * compareAndSet value field
     */
    boolean casValue(Object cmp, Object val) {
        return UNSAFE.compareAndSwapObject(this, valueOffset, cmp, val);
    }
    /**
     * compareAndSet next field
     */
    boolean casNext(Node<K,V> cmp, Node<K,V> val) {
        return UNSAFE.compareAndSwapObject(this, nextOffset, cmp, val);
    }
    /**
     * 是否标记节点，没看到地方用这个
     */
    boolean isMarker() {
        return value == this;
    }
    /**
     * 最底层有序list的头结点
	 * Object BASE_HEADER = new Object()
     */
    boolean isBaseHeader() {
        return value == BASE_HEADER;
    }
    /**
     * 当前节点的后面追加一个标记节点，删除的时候会把当前节点和标记节点一起删除
     */
    boolean appendMarker(Node<K,V> f) {
        return casNext(f, new Node<K,V>(f));
    }
    /**
     * 是否还记得b,n,f变量，b是当前节点的前驱，n是当前节点，f是后一个节点
	 * 帮助删除方法？就是如果当前节点后面已经有标记节点那就casnext替换删除，如果没有那就追加一个标记节点
     */
    void helpDelete(Node<K,V> b, Node<K,V> f) {
        /*
         * Rechecking links and then doing only one of the
         * help-out stages per call tends to minimize CAS
         * interference among helping threads.
         */
        if (f == next && this == b.next) {
            if (f == null || f.value != f) // 当前节点后面一个节点不是标记，那就追加一个标记
                appendMarker(f);
            else
                b.casNext(this, f.next);
        }
    }
    /**
     * 返回节点的value，如果头结点或标记节点返回null
     */
    V getValidValue() {
        Object v = value;
        if (v == this || v == BASE_HEADER)
            return null;
        return (V)v;
    }
    /**
     * Creates and returns a new SimpleImmutableEntry holding current
     * mapping if this node holds a valid value, else null.
     * @return new entry or null
     */
    AbstractMap.SimpleImmutableEntry<K,V> createSnapshot() {
        V v = getValidValue();
        if (v == null)
            return null;
        return new AbstractMap.SimpleImmutableEntry<K,V>(key, v);
    }
    // UNSAFE的一些，看起来应该不会陌生了
    private static final sun.misc.Unsafe UNSAFE;
    private static final long valueOffset;
    private static final long nextOffset;
    static {
        try {
            UNSAFE = sun.misc.Unsafe.getUnsafe();
            Class k = Node.class;
            valueOffset = UNSAFE.objectFieldOffset
                (k.getDeclaredField("value"));
            nextOffset = UNSAFE.objectFieldOffset
                (k.getDeclaredField("next"));
        } catch (Exception e) {
            throw new Error(e);
        }
    }
}
```

最重要的应该是helpDelete方法吧。javadoc里面有个解释删除一个节点的过程：

* Here's the sequence of events for a deletion of node n with

* predecessor b and successor f, initially:

*

* +------+ +------+ +------+

* ... | b |------>| n |----->| f | ...

* +------+ +------+ +------+

*

* 1. CAS n's value field from non-null to null.

* From this point on, no public operations encountering

* the node consider this mapping to exist. However, other

* ongoing insertions and deletions might still modify

* n's next pointer.

*

* 2. CAS n's next pointer to point to a new marker node.

* From this point on, no other nodes can be appended to n.

* which avoids deletion errors in CAS-based linked lists.

*

* +------+ +------+ +------+ +------+

* ... | b |------>| n |----->|marker|------>| f | ...

* +------+ +------+ +------+ +------+

*

* 3. CAS b's next pointer over both n and its marker.

* From this point on, no new traversals will encounter n,

* and it can eventually be GCed.

* +------+ +------+

* ... | b |----------------------------------->| f | ...

* +------+ +------+

这个应该都能看懂，就是在要删除的节点后面追加一个标记节点，然后删除的时候将当前节点和标记节点一起从list中断开链接，这其中的操作都是cas操作。

看下Index节点，index节点就是skiplist的层次节点，有down，有right，因为持有的节点值不同和处理方式不同，所以跟node不能抽象：

```java
static class Index<K,V> {
    final Node<K,V> node;
    final Index<K,V> down;
    volatile Index<K,V> right;
    /**
     * Creates index node with given values.
     */
    Index(Node<K,V> node, Index<K,V> down, Index<K,V> right) {
        this.node = node;
        this.down = down;
        this.right = right;
    }
    /**
     * compareAndSet right field
     */
    final boolean casRight(Index<K,V> cmp, Index<K,V> val) {
        return UNSAFE.compareAndSwapObject(this, rightOffset, cmp, val);
    }
    /**
     * 节点是否被删除，因为删除一个index的时候会把index持有的node节点的value cas设置成null
     */
    final boolean indexesDeletedNode() {
        return node.value == null;
    }
    /**
     * link一个新的后继index，判断了当前index是否被删除，如果是被删除的index，再link就没有意义了
     */
    final boolean link(Index<K,V> succ, Index<K,V> newSucc) {
        Node<K,V> n = node;
        newSucc.right = succ;
        return n.value != null && casRight(succ, newSucc);
    }
    /**
     * unlink后继index，如果当前是要删除的，就失败
     */
    final boolean unlink(Index<K,V> succ) {
        return !indexesDeletedNode() && casRight(succ, succ.right);
    }
    // Unsafe mechanics
    private static final sun.misc.Unsafe UNSAFE;
    private static final long rightOffset;
    static {
        try {
            UNSAFE = sun.misc.Unsafe.getUnsafe();
            Class k = Index.class;
            rightOffset = UNSAFE.objectFieldOffset
                (k.getDeclaredField("right"));
        } catch (Exception e) {
            throw new Error(e);
        }
    }
}
```

HeadIndex继承Index，比index多了个level，skiplist每层的head：

```java
    static final class HeadIndex<K,V> extends Index<K,V> {
        final int level;
        HeadIndex(Node<K,V> node, Index<K,V> down, Index<K,V> right, int level) {
            super(node, down, right);
            this.level = level;
        }
    }
```

看下最常用的2个构造：

```java
//headIndex的node节点的value
private static final Object BASE_HEADER = new Object();
/**
 * skipList跳表的最上层第一个入口
 */
private transient volatile HeadIndex<K,V> head;
/**
 * 比较器，构造时可以传入，否则为null，使用key默认
 */
private final Comparator<? super K> comparator;
/**
 * 随机数种子
 */
private transient int randomSeed;
//根据构造传入comparator，如果没有，就是用key的默认比较
public ConcurrentSkipListMap() {
    this.comparator = null;
    initialize();
}
public ConcurrentSkipListMap(Comparator<? super K> comparator) {
    this.comparator = comparator;
    initialize();
}
//构造调用初始化
final void initialize() {
    keySet = null;
    entrySet = null;
    values = null;
    descendingMap = null;
    randomSeed = seedGenerator.nextInt() | 0x0100; // ensure nonzero
	//这个最重要，head代表整个skiplist入口，构造的时候，新建第一层，index的down和right都null
    head = new HeadIndex<K,V>(new Node<K,V>(null, BASE_HEADER, null),
                              null, null, 1); 
}
//cas设置head，还是unsafe的底层
private boolean casHead(HeadIndex<K,V> cmp, HeadIndex<K,V> val) {
    return UNSAFE.compareAndSwapObject(this, headOffset, cmp, val);
}
```

ConcurrentSkipListMap是不支持key、value为null的。接下来看几个常用的方法，跟一下流程。

put方法：

```java
public V put(K key, V value) {
    if (value == null)
        throw new NullPointerException();
    return doPut(key, value, false); //这里的是false，容许重复，ConcurrentSkipListSet内部使用ConcurrentSkipListMap保存数据，更新的时候用的是true
}
private V doPut(K kkey, V value, boolean onlyIfAbsent) {
    Comparable<? super K> key = comparable(kkey);
    for (;;) {
        Node<K,V> b = findPredecessor(key); //找到base-level的key节点的前驱node节点，然后顺手删除一些节点
        Node<K,V> n = b.next; //还记得b、n、f的意思，b是前驱节点，n是当前节点，f是后继节点
        for (;;) {
            if (n != null) {
                Node<K,V> f = n.next;
                if (n != b.next)               // skiplistmap是无锁list，所以关键操作都会检查，这里说明存在race，那就break，重新开始
                    break;
                Object v = n.value;
                if (v == null) {               // value为null说明n被删除
                    n.helpDelete(b, f); //n被删除，那就helpdelete，标记-删除，然后重试
                    break;
                }
                if (v == n || b.value == null) // 标记删除，如果n的value跟n一样，那就是标记节点，说明b是被删除的，那就重试
                    break;
                int c = key.compareTo(n.key); //上面检查暂时没问题，那就比较key
                if (c > 0) { 如果要put的key比当前n的大，说明b、n、f需要往后移一个位置，让后重试
                    b = n;
                    n = f;
                    continue;
                }
                if (c == 0) { //key相同
                    if (onlyIfAbsent || n.casValue(v, value)) // 如果入参为true，不容许替换，那就返回，false容许替换，那就替换value值
                        return (V)v;
                    else
                        break; // 替换失败就重试
                }
                // else c < 0; fall through
            }
            Node<K,V> z = new Node<K,V>(kkey, value, n); //这里新建z指向n
            if (!b.casNext(n, z))
                break;         // casnext操作b的next由n指向新插入的z，失败就重试
			//在base-level插入新的node后，skiplist跳表需要将新建的node的随机插入其他层，保证i层存在的话，i-1层肯定存在，都是跳表的东西
            int level = randomLevel(); //随机生成的level
            if (level > 0) //如果level大于0那就插入
                insertIndex(z, level);
            return null;
        }
    }
}
//就是如果你构造提供了比较，那么排序的时候key比较就使用你提供的，没有就使用默认的自然排序
private Comparable<? super K> comparable(Object key)
        throws ClassCastException {
    if (key == null)
        throw new NullPointerException();
    if (comparator != null)
        return new ComparableUsingComparator<K>((K)key, comparator);
    else
        return (Comparable<? super K>)key;
}
/**
 * Compares using comparator or natural ordering. Used when the
 * ComparableUsingComparator approach doesn't apply.
 */
int compare(K k1, K k2) throws ClassCastException {
    Comparator<? super K> cmp = comparator;
    if (cmp != null)
        return cmp.compare(k1, k2);
    else
        return ((Comparable<? super K>)k1).compareTo(k2);
}
//找到base-level的key节点的前驱node节点，然后顺手删除一些节点
//基本上就是从head开始向右找，找到比给定的大的，就从大的index的前驱往下找
private Node<K,V> findPredecessor(Comparable<? super K> key) {
    if (key == null)
        throw new NullPointerException(); // don't postpone errors
    for (;;) {
        Index<K,V> q = head; //从head开始
        Index<K,V> r = q.right; //head的right
        for (;;) {
            if (r != null) { //r不为null就向右找
                Node<K,V> n = r.node;
                K k = n.key;
                if (n.value == null) { //value为null，则表示节点已经删除
                    if (!q.unlink(r)) //节点已经删除，那就从链表中unlink掉
                        break;           // restart 失败就重试
                    r = q.right;         // reread 节点删除后，重置r节点
                    continue;
                }
                if (key.compareTo(k) > 0) { //key大于当前节点的key，就一直往右移动
                    q = r;
                    r = r.right;
                    continue;
                }
            }
            Index<K,V> d = q.down; //上面找到了一个q节点，这个q的right的key比要找的key大，所以往down开始找
            if (d != null) {
                q = d; //这里就相当于往下移动了一层，然后继续for循环找
                r = d.right;
            } else
                return q.node; //如果d为null，说明找到了base-level那一层了，那就返回吧
        }
    }
}
//随机生成的level，0-31
private int randomLevel() {
    int x = randomSeed;
    x ^= x << 13;
    x ^= x >>> 17;
    randomSeed = x ^= x << 5;
    if ((x & 0x80000001) != 0) // &一半的机会返回0
        return 0;
    int level = 1;
    while (((x >>>= 1) & 1) != 0) ++level; //向右移位，在上面一半机会不为0的情况下，&再来一半机会为1，层数越高，机会越小,这样可以保证没那么多数据量还生成n多层
    return level;
}
//在随机生成的level插入index节点
private void insertIndex(Node<K,V> z, int level) {
    HeadIndex<K,V> h = head;
    int max = h.level;
    if (level <= max) { //如果随机生成的level比head的小
        Index<K,V> idx = null;
		//生成一个idx链表，每个down指向下一层的，假如放在3层，那就生成3个index，3层的down指向2层的，2层指向1层，1层的指向null，所有的index的node指向新插入的node
        for (int i = 1; i <= level; ++i) 
            idx = new Index<K,V>(z, idx, null); 
        //将index链表插入skiplist
		addIndex(idx, h, level);
    } else { // Add a new level
        level = max + 1; //如果随机的level大于已经有的跳表层级，那就增加一层
        Index<K,V>[] idxs = (Index<K,V>[])new Index[level+1];
        Index<K,V> idx = null;
        for (int i = 1; i <= level; ++i)
            idxs[i] = idx = new Index<K,V>(z, idx, null); //一个index数组
        HeadIndex<K,V> oldh;
        int k;
        for (;;) {
            oldh = head; //原有的head和层级
            int oldLevel = oldh.level;
            if (level <= oldLevel) { // 这里可能有其他线程已经添加了一层了，所以不需要再新增一层
                k = level;
                break;
            }
			//下面是将新创建一个headIndex，并将down指向原来的headindex，right指向数组对应j的index，层级j
            HeadIndex<K,V> newh = oldh;
            Node<K,V> oldbase = oldh.node;
            for (int j = oldLevel+1; j <= level; ++j)
                newh = new HeadIndex<K,V>(oldbase, newh, idxs[j], j);
            if (casHead(oldh, newh)) { //cas替换跳表的head
                k = oldLevel; 
                break;
            }
        }
        addIndex(idxs[k], oldh, k); //在for循环里面是新增层级的添加index，这里就是其他层级的index添加
    }
}
/**
 * 将indexs插入skiplist
 */
private void addIndex(Index<K,V> idx, HeadIndex<K,V> h, int indexLevel) {
    // Track next level to insert in case of retries
    int insertionLevel = indexLevel;
    Comparable<? super K> key = comparable(idx.node.key);
    if (key == null) throw new NullPointerException();
    // 过程类似findPredecessor
    for (;;) {
        int j = h.level;
        Index<K,V> q = h;
        Index<K,V> r = q.right;
        Index<K,V> t = idx;
        for (;;) {
            if (r != null) { //往右寻找key的位置
                Node<K,V> n = r.node;
                // compare before deletion check avoids needing recheck
                int c = key.compareTo(n.key);
                if (n.value == null) { //n删除，前驱节点断开当前节点n
                    if (!q.unlink(r))
                        break;
                    r = q.right;
                    continue;
                }
                if (c > 0) {
                    q = r;
                    r = r.right;
                    continue;
                }
            }
            if (j == insertionLevel) { //在某层找到了位置，就看下跳表的层级j和待插入的层次是否一样
                // 待插入index是删除的，return
                if (t.indexesDeletedNode()) {
                    findNode(key); // findNode方法会返回key的node，会顺手删除一些节点
                    return;
                }
                if (!q.link(r, t)) //待插入index没被删除，那就把前驱节点的right换成待插入的，失败就重试
                    break; // restart
                if (--insertionLevel == 0) { //待插入的为0了，那就是不需要再插入了
                    // need final deletion check before return
                    if (t.indexesDeletedNode()) //这里最后再检查下待插入index是否删除了
                        findNode(key);
                    return;
                }
            }
            if (--j >= insertionLevel && j < indexLevel)
                t = t.down; //这里就是待插入的index指向down，下次再插入的index就是待插入index下一层了
            q = q.down; //基本就是一层结束，然后down到下一层
            r = q.right;
        }
    }
}
//返回key的node，过程类似findPredecessor
private Node<K,V> findNode(Comparable<? super K> key) {
    for (;;) {
        Node<K,V> b = findPredecessor(key);
        Node<K,V> n = b.next;
        for (;;) {
            if (n == null)
                return null;
            Node<K,V> f = n.next;
            if (n != b.next)                // inconsistent read
                break;
            Object v = n.value;
            if (v == null) {                // n is deleted
                n.helpDelete(b, f);
                break;
            }
            if (v == n || b.value == null)  // b is deleted
                break;
            int c = key.compareTo(n.key);
            if (c == 0)
                return n;
            if (c < 0)
                return null;
            b = n;
            n = f;
        }
    }
}
```

put方法基本就是现在base-level上找到前驱节点，然后插入节点，然后随机生成要插入的层级，如果比当前的小，就直接创建从上到下的index链，分别插入对应层级，如果大于当前，那么当前的就层级加1，然后生成数组，每个元素对应对应层级的链表，新创建一个headIndex，down指向原来的head，right指向数组对应的层级，最后用数组的对应的层级加入跳表对应的层级。代码看不懂，就多看，多想，真没其他好办法。

看下get()方法：

```java
public V get(Object key) {
    return doGet(key);
}
private V doGet(Object okey) {
    Comparable<? super K> key = comparable(okey);
    /*
     * 容许重试
     */
    for (;;) {
        Node<K,V> n = findNode(key); 
        if (n == null)
            return null;
        Object v = n.value;
        if (v != null)
            return (V)v;
    }
}
```

我看的这个jdk版本doGet方法有的不一样，直接使用findNode获得node，没有像参考里面那哥们看的那版把所有find的过程都写在doGet的for()里面。

remove()方法：

```java
public V remove(Object key) {
    return doRemove(key, null);
}
final V doRemove(Object okey, Object value) {
    Comparable<? super K> key = comparable(okey);
    for (;;) {
        Node<K,V> b = findPredecessor(key);
        Node<K,V> n = b.next;
        for (;;) {
            if (n == null)
                return null;
            Node<K,V> f = n.next;
            if (n != b.next)                    // inconsistent read
                break;
            Object v = n.value;
            if (v == null) {                    // n is deleted
                n.helpDelete(b, f);
                break;
            }
            if (v == n || b.value == null)      // b is deleted
                break;
            int c = key.compareTo(n.key);
            if (c < 0)
                return null;
            if (c > 0) {
                b = n;
                n = f;
                continue;
            }
            if (value != null && !value.equals(v))
                return null;
            if (!n.casValue(v, null)) //设置value为null，之前一直看到检测value==null来判断节点是否被删除
                break;
            if (!n.appendMarker(f) || !b.casNext(n, f))
                findNode(key);                  // Retry via findNode
            else {
                findPredecessor(key);           // Clean index
                if (head.right == null)
                    tryReduceLevel(); //right==null时有可能需要减少层级
            }
            return (V)v;
        }
    }
}
//减少层级，就是如果最高的连着3层都没有right都没有链接index，那就尝试cashead减少一层，然后recheck之前的head的right是否null，
//有可能有race导致这会又不会null，那就再casHead设置回来
private void tryReduceLevel() {
    HeadIndex<K,V> h = head;
    HeadIndex<K,V> d;
    HeadIndex<K,V> e;
    if (h.level > 3 &&
        (d = (HeadIndex<K,V>)h.down) != null &&
        (e = (HeadIndex<K,V>)d.down) != null &&
        e.right == null &&
        d.right == null &&
        h.right == null &&
        casHead(h, d) && // try to set
        h.right != null) // recheck
        casHead(d, h);   // try to backout
}
```

最后看下size()，javadoc直接因为是无锁的list， 说结果不一定准，所以这个方法不一定有用，太任性了:

```java
public int size() {
    long count = 0;
    for (Node<K,V> n = findFirst(); n != null; n = n.next) {
        if (n.getValidValue() != null)
            ++count;
    }
    return (count >= Integer.MAX_VALUE) ? Integer.MAX_VALUE : (int) count;
}
Node<K,V> findFirst() {
    for (;;) {
        Node<K,V> b = head.node;
        Node<K,V> n = b.next;
        if (n == null)
            return null;
        if (n.value != null)
            return n; //直接找到第一个value不为null的就return
        n.helpDelete(b, n.next);
    }
}
```

看代码也能看出来，找到第一个value不为null的，然后从这个开始累加，因为free-lock，并发线程多的话，节点变动频繁，悲剧估计会经常发生。

ConcurrentSkipListMap的其他方法不想看了，都差不多。这个类看起来真累，主要是因为是跳表结构的，不太熟悉，而且又用的是lock-free的，所以在做各种操作的时候，总是检查链表的结构啊，节点是否被删除啊这些，没事还帮着清理下删除的node。

ConcurrentSkipListSet初始化的时候持有ConcurrentSkipListMap变量，然后add的时候：

```java
public boolean add(E e) {
	return m.putIfAbsent(e, Boolean.TRUE) == null;
}
```

最后到ConcurrentSkipListMap：

```java
public V putIfAbsent(K key, V value) {
    if (value == null)
        throw new NullPointerException();
    return doPut(key, value, true);
}
```

还记得skiplistmap的put是doput(key,value,false)，最后一个putIfAbsent决定如果key对应的node存在是否还要替换，true不替换，false替换。skiplistset直接返回值。skiplistSet中其他的方法都类似的。
