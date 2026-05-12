# 20、数据结构与算法 - 基础：Trie（前缀树）
- 来源：https://ddkk.com/zhuanlan/algorithm/1/20.html
- 分类：数据结构
- 分组：教程目录
> 摘要
>
> Trie 被称为前缀树，结构类似树，一个节点有多个子节点，那么在搜索路径中就有多条路，也是高效检索的本质。Trie 的检索和字典查找单词的场景非常相似。

**Trie 又被称为前缀树或者字典树**，常用的场景有网址搜索、字典查询等需要高效率的查询情况。可以思考在字典中查找一个单词的过程（比如 trie），咱们会先找到单词的第一个字母，找到后再找第二个字母，直到找到最后一个字母，Tire 的查找过程就是这样。

**Trie 的数据结构，在存储数据的时候（比如 trie），就依次建立了多个索引（字母做索引），通过多个索引获取一个元素，很大的提高了查询效率**。也是有多个索引确定一个元素的逻辑，所以在 Trie 中会需要空间存储索引，这是一种空间换取时间的数据结构逻辑。

**trie 的结构类似一个树**，trie 的结构总结这几点：

**1、** 每个节点都有多个子节点；

**2、** 每个节点都有一个char作为key；

**3、** 元素存放在单词最后一个索引key的节点中；

## 准备

那么根据 trie 中 Node 的结构，可以设计 Node 如下：

```java
private static class Node<V> {
  // 父节点
  Node<V> parent;
  // 子节点，因为是多个，这里使用 key-value 结构，即 HashMap 
  HashMap<Character, Node<V>> children;
  // char 作为 key
  Character character;
  // 存放的元素
  V value;
  // 是否是单词的结尾，如果是 true，那么 value 中存在元素
  boolean word;
  // 构造函数
  public Node(Node<V> parent) {
    super();
    this.parent = parent;
  }
}
```

在Tride 结构中，也需要定义一个根节点，用 `size` 来记录结构中元素的数量：

```java
public class Trie<V> {
	private int size;
	private Node<V> root;
}
```

这里先实现通过一个 key 检索获取 node 的方法，这个方法在后面要实现的代码逻辑中经常使用，这个方法的大致逻辑是**将 key 依次拆分为 char 类型字符，从根节点开始循环找到查询路径是 key 的节点，其中出现的节点或者它的子节点是 null，则认为不存在**：

```java
private Node<V> node(String key) {
  keyCheck(key);
  Node<V> node = root;
  int len = key.length();
  for (int i = 0; i < len; i++) {
    if (node == null || node.children == null || node.children.isEmpty()) return null;
    char c = key.charAt(i);
    node = node.children.get(c);
  }
  return node;
}
```

`keyCheck` 方法是检查 key 是否合法，即 key 不能是 null，也不能是空字符，否则查找就没有意义，这里的处理是直接抛出异常：

```java
private void keyCheck(String key) {
  if (key == null || key.length() == 0) {
    throw new IllegalArgumentException("key must not be empty");
  }
}
```

## 添加元素

下面就是实现 trie 结构中的重要方法，添加 Node（节点，下面都以 Node 表示节点）。添加 Node 的逻辑大致是：

**1、** 首先通过key找到在trie结构中存放元素的位置；

**2、** 在该位置上放置要存放的元素；

代码实现的逻辑上需要对以下情况做出处理：

**1、** key不可以是非法的；

**2、** trie结构是空的，连root都没有，那就需要先创建一个root；

**3、** 向下查找的过程中，如果node的子node是空，就需要创建；

**4、** 如果node中已经存在元素，就覆盖它，并返回覆盖的元素；

**5、** 最后，容易忽略，也是非常重要的点，就是记录元素的size一定要加1；

```java
public V add(String key, V value) {
  keyCheck(key);
  if (root == null) {
    root = new Node<>(null);
  }
  Node<V> node = root;
  int len = key.length();
  for (int i = 0; i < len; i++) {
    char c = key.charAt(i);
    // 子节点和存放子节点的变量是空的，就创建一下，不好理解，需要多过几遍
    boolean emptyChildren = node.children == null;
    Node<V> childNode = emptyChildren ? null : node.children.get(c);
    if (childNode == null) {
      childNode = new Node<>(node);
      childNode.character = c;
      node.children = emptyChildren ? new HashMap<>() : node.children;
      node.children.put(c, childNode);
    }
    node = childNode;
  }
  if (node.word) {
      // 替换
    V oldValue = node.value;
    node.value = value;
    return oldValue;
  }
  node.word = true;
  node.value = value;
  size++;
  return null;
}
```

## 删除元素

trie 结构中删除元素，不能是简单的将存放元素的 node 删除掉，或者将 node 的 value 设置为 null 就可以了。在文章开头提到，trie 是一种**空间换时间**的结构逻辑，那么就要本着节约的原则操作删除，核心逻辑就是**将不需要的索引节点给删除掉**。

如何定义该索引节点是不需要的呢？这里很直接，就是该节点不存放元素，并且也没有子节点，那么这个节点就是不需要的，可以放心的删除。

删除元素的大致逻辑是：

**1、** 先找到元素所在node，如果node存在，就继续走下一步；

**2、** 临时保存value值，然后处理node；

**3、** 最重要的，不要忘记把trie的size减1；

在删除元素的时候，需要特别注意这几点：

**1、** node没有子node的时候，才可以删除node，若存在子node，就需要清理value为null，并设置word为true；

**2、** 删除当前node前，获取到它的父node，删除当前node后，再判断它的父node是否满足第1点，一直循环到出现word为true或者node的子节点不为null；

```java
public V remove(String key) {
  // 找到最后一个节点
  Node<V> node = node(key);
  if (node == null || !node.word) return null;
  size --;
  V oldValue = node.value;
  // 如果还有子节点
  if (node.children != null && !node.children.isEmpty()) {
    node.word = false;
    node.value = null;
    return oldValue;
  }
  // 如果没有子节点
  Node<V> parent = null;
  while ((parent = node.parent) != null) {
    parent.children.remove(node.character);
    if (parent.word || !parent.children.isEmpty()) break;
    node = parent;
  }
  return oldValue;
}
```

## 获取元素

获取元素的时候，也是需要先通过 key 得到 node，判断 node 是否存在 value，存在才能返回：

```java
public V get(String key) {
  Node<V> node = node(key);
  return (node != null && node.word) ? node.value : null;
}
```

## 示例

判断一个字符串的前缀是否存在，在 trie 结构中非常容易实现：

```java
public boolean startsWith(String prefix) {
  return node(prefix) != null;
}
```

## 总结：

- Trie 的数据结构检索效率非常高，和字典中查单词场景非常相似，是空间换时间的结构逻辑；
- 对元素的添加、删除等操作都需要先获取节点，然后做处理，不能忘记对 size 的加减处理；
- word 标识用做判断是否存在元素。
