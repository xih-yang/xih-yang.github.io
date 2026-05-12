# 10、数据结构与算法 - 基础：AVL 树
- 来源：https://ddkk.com/zhuanlan/algorithm/1/10.html
- 分类：数据结构
- 分组：教程目录
**AVL 树** 是最早时期发明的**自平衡二叉搜索树**之一。是依据它的两位发明者的名称命名。

AVL树有一个重要的属性，即**平衡因子**（Balance Factor），**平衡因子 == 某个节点的左右子树高度差**。

AVL树特点总结下来有：

- 每个节点的平衡因子有且仅有 1、0、-1，若超过这三个值的范围，就称其为**失衡**；
- 每个节点左右子树的高度差不会超过 1；
- 搜索、添加、删除的时间复杂度为 O(logn)，n 为 n 个节点。

看上图，右侧图中二叉树就可以称为**AVL 树**。

## 添加后导致失衡

若再添加一个元素 18，导致它的祖先节点失衡（甚至有可能它的所有祖父节点都失衡）。**但是的父节点和非祖先节点不会失衡**。

当添加后导致失衡，就要想办法调整节点，使其再达到平衡状态。前提是，必须要满足二叉搜索树的性质，不能随意调整。这里调整方法就是**旋转节点**。

## 旋转节点

**旋转节点**核心调整祖父节点和父节点的位置，使得其调整后的节点达到平衡，在操作的过程中类似旋转，所以称为旋转节点。

先确定几个节点的简称，方便下面的说明：

- g：祖父节点
- p：父节点
- n：自身节点

### LL - 右旋转（单旋）

**LL**: 平衡因子小于 -1 的节点。该失衡的节点为 g，它的左子树为 p，p 的左子树为 n。因为 g、p 、n 都在左侧，所以称为 **LL**,如下图，当添加元素 1 之后，造成失衡。

当出现**LL** 类型的失衡时，可以通过**右旋转**达到平衡，如下图：

从图中可以看出，相当于将 g、p、n 三个节点向右侧旋转，达到平衡，即：

```java
g.left = p.right
p.right = g
```

若节点发生变化，需要注意节点 `parent` 节点的变化情况，并在更改节点之后，更新 `g` 和 `p` 的高度。

### RR - 左旋转（单旋）

RR的情况和 LL 情况正好相反，所以旋转也是相反的，旋转之后的处理和 LL 是一样的，这个可以在后面的代码中体现处理，所以不再重复去解释这种情况。

### LR - RR 左旋转，LL 右旋转（双旋）

LR: 比如添加元素 4 后失衡，的失衡节点定为 g，它的左子树为 p，p 的右子树为 n。因为 p 在左，n 在右。所以这种情况被称为 LR。

出现LR 情况需要先对 p 节点左旋转处理，使其变成 LL 的情况之后，再对 g 做右旋转，恢复平衡状态。

**注意：图中标识错误，是 p 向左旋转，g 向右旋转**

每当旋转后都要更新其对应节点的高度。

### RL - LL 右旋转，RR 左旋转（双旋）

RL的情况与 LR 的情况也是正好相反的。处理上也是需要反着来就好。旋转后也是一定要更新其对应的节点。

## 实现代码

这里以RR 为例，RR 的情况就需要进行**左旋转**。

```java
void rotateLeft(Node<E> grand) {
	// 创建临时变量 parent 和 child
	Node<E> parent = grand.right;
	Node<E> child = parent.left;
  // 祖父节点的右子节点为父节点的左子节点
	grand.right = child;
  // 父节点的左节点为祖父节点
	parent.left = grand;
  /**
  	旋转之后，更改节点的指向，方法代码看下面
  */
}
```

做完旋转之后，要更改 `g` 和 `child` 节点的 `parent` 指向。

```java
void afterRotate(Node<E> grand, Node<E> parent, Node<E> child) {
  // 调整 grand 的 parent 节点
  if (grand.isLeftChild()) {
    grand.parent.left = parent;
  } else if (grand,isRightChild()) {
    grand.parent.right = parent;
  } else {
    root = parent;
  }
  if (child != null) {
    child.parent = grand;
  }
  parent.parent = grand.parent;
  grand.parent = parent;
  /**
  	调整之后，更新 g 和 p 的高度，方法代码看下面
  */
}
```

这里是在每个 AVL 节点中定义一个 height 属性，来记录当前节点的高度，所以可以在 AVL 节点中实现更新高度的方法。

```java
public void updateHeight() {
  int leftHeight = left == null ? 0 : ((AVLNode<E>)left).height;
  int rightHeight = right == null ? 0 : ((AVLNode<E>)right).height;
  height = 1 + Math.max(leftHeight, rightHeight);
}
```

**当前节点的高度就是它的左右子节点的高度中的最大值**。代码逻辑如上

这时候，就有可能有个问题，怎么保证 AVL 节点中的 height 都是一一对应的呢？这里是在添加方法之后做的处理，核心逻辑就是在每次添加一个节点之后就更新下全部的节点高度就可以，详细的在下面去深究。

**有了上面左旋转的实现，那么右旋转的实现也就能顺利得到，就是和左旋转相反就好**。

```java
private void rotateRight(Node<E> grand) {
  Node<E> parent = grand.left;
  Node<E> child = parent.right;
  grand.left = child;
  parent.right = grand;
  afterRotate(grand, parent, child);
}
```

知道了左右旋转和旋转后更新节点的方法之后，接下来就要来判断失衡的节点，以及失衡的情况是 LL 还是 RR，或者其他。

首先判断失衡的节点，判断一个节点是否平衡，就要看这个节点的平衡因子是否是在 -1 到 1 之间的，即

```java
boolean isBalanced(Node<E> node) {
  return Math.abs(((AVLNode<E>)node).balanceFactor()) <= 1;
}
public int balanceFactor() {
  int leftHeight = left == null ? 0 : ((AVLNode<E>)left).height;
  int rightHeight = right == null ? 0 : ((AVLNode<E>)right).height;
  return leftHeight - rightHeight;
}
```

## 添加节点

当添加一个节点时，因为当前节点是没有左右子节点的，所以要判断的不是当前节点，而是这个节点的父节点祖父节点们是否失衡，这就用到循环遍历

```java
void afterAdd(Node<E> node) {
  while ((node = node.parent) != null) {
    if (isBalanced(node)) {
      // 更新高度
      updateHeight(node);
    }
    else {
      // 恢复平衡
      rebalance(node);
      break;
    }
  }
}
```

看上面代码中，有一个恢复平衡的方法没有说过，在调用这个方法时，就已经确定这个节点是失衡状态，这时要做的就是确定失衡的情况，然后根据不同的情况做相应的旋转处理。

这里要先知道节点的最大高度，就是左右子节点高度中的最大值，即

```java
public Node<E> tallerChild() {
  int leftHeight = left == null ? 0 : ((AVLNode<E>)left).height;
  int rightHeight = right == null ? 0 : ((AVLNode<E>)right).height;
  if (leftHeight > rightHeight) return left;
  if (leftHeight < rightHeight) return right;
  return isLeaf() ? left : right;
}
```

高度大的节点对应到要处理的节点，可看下面代码：

```java
void rebalance(Node<E> grand) {
  Node<E> parent = ((AVLNode<E>)grand).tallerChild();
  Node<E> node = ((AVLNode<E>)parent).tallerChild();
  if (parent.isLeftChild()) {
      // L
    if (node.isLeftChild()) {
      // LL
      rotateRight(grand);
    }
    else {
      // LR
      rotateLeft(parent);
      rotateRight(grand);
    }
  }
  else {
      // R
    if (node.isLeftChild()) {
      // RL
      rotateRight(parent);
      rotateLeft(grand);
    }
    else {
      // RR
      rotateLeft(grand);
    }
  }
}
```

## 删除节点

当删除节点后，也可能导致 AVL 树失衡，有可能是父节点或者祖先节点失衡，通过添加节点的处理失衡逻辑后，可以总结删除节点的失衡处理逻辑，也是先要遍历查找失衡的节点，然后把这个节点的失衡情况搞出来，最后对应情况做旋转处理。

所以删除后的处理就是：

```java
void afterRemove(Node<E> node) {
  while ((node = node.parent) != null) {
    if (isBalanced(node)) {
      // 更新高度
      updateHeight(node);
    }
    else {
      // 恢复平衡
      rebalance(node);
    }
  }
}
```

## 总结

看代码，添加或者删除节点之后都要一一的遍历节点的父节点和祖先节点，没有失衡的更新高度，失衡的就恢复平衡，知道 root 节点，为什么这样？

- 添加节点后，可能会导致所有的祖先节点都失衡
- 删除节点后，可能会导致父节点或祖先接单失衡，恢复平衡后，可能会导致更高层次的祖先节点失衡

所以就需要整体的遍历到 root 节点。单处理一个节点是不够的。

时间复杂度上，搜索是 O(logn)，添加是 O(logn)，只需要 O(1) 次的旋转，删除也是 O(logn)，最多需要 O(logn) 次的旋转。
