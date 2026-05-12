# 13、数据结构与算法 - 实战：最短路径&amp;Bellman-Ford 算法
- 来源：https://ddkk.com/zhuanlan/algorithm/2/13.html
- 分类：数据结构
- 分组：教程目录
> 摘要
>
> Bellman-Ford 算法是求单源最短路径的算法，它的核心就是不断松弛边，使得到达其他顶点成为最短路径。这次终于理解了边的松弛操作的本质了，也是可喜可喜。

Bellman-Ford 算法也是处理单源最短路径。它允许存在负权边，并且也可以检测出是否存在负权环。其算法的本质就是**对所有的边做 V-1 次的松弛操作（V 是顶点的数量）** ，最后得到所有的可能最短路径。其时间复杂度就是 O(VE)，V 是顶点的数量，E 是边的数量。

要理解Bellman-Ford 算法，需要依次理解这两个问题：

**松弛操作做的是什么？**

松弛操作的本质就是获取边的起始顶点的路径权值加上该边的权值，之后和该边的结束顶点的路径权值比较，如果是小于的结果，就替换了结束顶点的路径信息和权值。这就达到最开始顶点到结束顶点的路径信息和权值。

除此之外，松弛操作也在做另外一个任务，就是将边的结束顶点加入到参与比较的集合中，即路径信息集合中没有该顶点的路径信息和权值，就创建一个空的路径信息和权值，添加到集合中，参与下一轮的松弛处理。

**为什么对所有的边做 V-1 次的松弛操作就可以得到最短路径呢？**

这里考虑到了最差的结果，也就是该顶点到另外一个顶点的最短路径就是遍历完所有的路径。而所有路径恰好就是 V-1 条。其中也有可以提前结束循环的方式，有兴趣的同学可以先探索一下。

下面还是先上代码：

```java
private Map<V, PathInfo<V, E>> bellmanFord(V begin) {
     Vertex<V, E> beginVertex = vertices.get(begin);
     if (beginVertex == null) return null;
     Map<V, PathInfo<V, E>> selectedPaths = new HashMap<>();
     // 初始化，第一个顶点的权值为 0
     PathInfo<V, E> beginPath = new PathInfo<>(weightManager.zero());
     selectedPaths.put(begin, beginPath);
     int count = vertices.size() - 1;
     for (int i = 0; i < count; i++) {
        for (Edge<V, E> edge : edges) {
            PathInfo<V, E> fromPath = selectedPaths.get(edge.from.value);
            if (fromPath == null) continue;
            relax(edge, fromPath, selectedPaths);
        }
    }
     // 已经存在最短路径，再次循环，依然还有最小的路径值存在，则认为有负权环
    for (Edge<V, E> edge : edges) {
        PathInfo<V, E> fromPath = selectedPaths.get(edge.from.value);
        if (fromPath == null) continue;
        if (relax(edge, fromPath, selectedPaths)) {
            System.out.println("有负权环");
            return null;
        };
    }
    selectedPaths.remove(begin);
    return selectedPaths;
}
```

`bellmanFord` 函数中，前两行代码就是拿到源顶点。`selectedPaths` 存放到每个顶点的路径信息，包括权值。

根据算法逻辑，编写一个循环 V-1 次的 for 循环，然后在每个循环中遍历图中所有的边（`edges` 存储图中所有的边）。

遍历所有的边的过程中，要保证 `selectedPaths` 中存在边的起始顶点，否则结束本次循环，直观的看出，节省循环次数，更本质的是保证单源性，即每一个需要处理的顶点，它的路径信息中已经包含了最开始的顶点（这点可以细细的捉摸一下）。

然后下面就是对边进行松弛操作，上松弛操作代码：

```java
private boolean relax(Edge<V, E> edge, PathInfo<V, E> fromPath, Map<V, PathInfo<V, E>> paths) {
    // 新的可选择最短路径：beginVertex 到 dege.from 的最短路径 + edge.weight
    E newWeight = weightManager.add(fromPath.weight, edge.weight);
    // 以前的最短路径： beginVertex 到 edge.to 的最短路径
    PathInfo<V, E> oldPath = paths.get(edge.to.value);
    if (oldPath != null && weightManager.compare(newWeight, oldPath.weight) >= 0) return false;
    if (oldPath == null) {
        oldPath = new PathInfo<>();
        paths.put(edge.to.value, oldPath);
    } else {
        oldPath.edgeInfos.clear();
    }
    oldPath.weight = newWeight;
    oldPath.edgeInfos.addAll(fromPath.edgeInfos);
    oldPath.edgeInfos.add(edge.info());
    return true;
}
```

先看`relax` 函数中要传递的参数：

- edge：要做松弛操作的边；
- fromPath：edge 的 from（起始顶点）的路径信息；
- paths：存放其他顶点最短路径的信息，同 selectedPaths 中元素一致。

函数中主要处理的就是 `edge` 的结束顶点的路径信息。并和 `paths` 中相同顶点的路径信息中的权值比较，小于时就替换 `paths` 中的原顶点的路径信息。如果 `paths` 中不存在这个顶点，就创建一个放进去，它的路径信息就是 `edge` 的 from 顶点路径信息加上 `edge` 的路径信息+权值（即等于 `edge` 的结束顶点的路径信息）。

**最后如何判断图中有负权环呢？**

那就是再遍历一遍所有的边，对边做松弛操作，如果发现一个因为权值要更改路径（即修改权值等）就证明该图存在负权环。

**负权环**的本质就是多次求最短路径时，这个环的权值会逐次减少。

另外，简单说一下代码中用到的 `weightManager` 对象，它包含权值相关操作，比如代码中用到的几个：

- zero()： 初始化一个权值为 0 的对象；
- add()： 两个权值相加，类似数字相加；
- compare()： 两个权值比较大小，和系统的比较方式一致。

最后的最后，不要忘记删除 `begin` 顶点，因为求的就是 `begin` 到其他顶点的最短路径，`begin` 到 `begin` 不求也知道怎么回事了。

#### 总结

- Bellman-Ford 算法也是单源最短路径算法，它的本质就是遍历 V-1 次所有的边，通过松弛边操作，最后得到最短路径；
- 边的松弛操作本质上就是求边的结束顶点的路径信息，然后和这个顶点已经存在的比较，保留权值最小的；
- 判断图中是否有负权环，就是在遍历一遍所有的边，对边做松弛操作，有最短路径替换的情况就是存在负权环。
