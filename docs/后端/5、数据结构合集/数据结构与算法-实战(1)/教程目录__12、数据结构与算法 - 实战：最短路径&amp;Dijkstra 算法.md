# 12、数据结构与算法 - 实战：最短路径&amp;Dijkstra 算法
- 来源：https://ddkk.com/zhuanlan/algorithm/2/12.html
- 分类：数据结构
- 分组：教程目录
> 摘要
>
> 理解 Dijkstra 算法，可以想象将石头依次从桌子上提起来的场景，绷直的边就是最短的路径。比较难理解就是松弛操作，需要多思考一些。看来算法也是源于自然和生活啊（没有根据的猜测）！！！

Dijkstra 是单源最短路径算法，可以用于计算一个顶点到其他所有顶点的最短路径，它有一个局限性，就是不能有负权边。其时间复杂度可以优化到 O(ElogV)，E 是边的数量，V 是顶点的数量。

> Dijkstra 算法是由荷兰科学家 Edsger Wybe Dijkstra 发明，曾在1972年获得图灵奖。

在学习Dijkstra 算法之前，先想象一下这样一个场景，将顶点想象成石头，边想象成连接石头之间的绳子，边的权值对应到绳子的长度，权值越大，绳子越长。

现在将这些用绳子连接的石头放在桌子上，选择其中一个石头，逐渐向上提起来，直到让所有石头都离开桌子。最后绷直的绳子就是这个石头到其他石头的最短路径。

这里有一个特别留意的点，就是后离开的石头都是被先离开的石头拉起来的。如下图所示（红色的线表示没有绷直的线）：

左侧图中，拿石头 A 往上提，一次离开桌子的是，E、C、D、B（E 和 C 是同时起来），所以最短路径上，比如顶点 A 到顶点 B 的路径是 A -> E(或者C) -> D -> B，而不是顶点 A 直接到 B。

**Dijkstra 算法就和提石头的操作非常一致**。在代码实现上，需要添加松弛操作，松弛操作就是更新两个顶点之间的最短路径。通过松弛操作，尝试找出最终的最短路径。

先上代码，通过代码重新来梳理一下 Dijkstra 算法：

```java
Map<V, PathInfo<V, E>> dijkstra(V begin) {
    Vertex<V, E> beginVertex = vertices.get(begin);
    if (beginVertex == null) return null;
    Map<V, PathInfo<V, E>> selectedPaths = new HashMap<>();
    Map<Vertex<V, E>, PathInfo<V, E>> paths = new HashMap<>();
    // 把起点也当作松弛操作的点处理
    paths.put(beginVertex, new PathInfo<>(weightManager.zero()));
    while (!paths.isEmpty()) {
        Map.Entry<Vertex<V, E>, PathInfo<V, E>> minEntry = getMinPath(paths);
        // minEntry 离开桌面
        Vertex<V, E> minVertex = minEntry.getKey();
        PathInfo<V, E> minPath = minEntry.getValue();
        selectedPaths.put(minEntry.getKey().value, minPath);
        paths.remove(minVertex);
        // 对它的 minVertex 的 outEdges 进行松弛操作
        for (Edge<V, E> edge : minVertex.outEdges) {
            // 如果 edge.to 已经离开桌面，就没有必要进行松弛操作 
            if (selectedPaths.containsKey(edge.to.value)) continue;
            relaxForDijkstra(edge, minPath, paths);
        }
    }
    selectedPaths.remove(begin);
    return selectedPaths;
}
```

函数中的前两行代码是获取 `begin` 的顶点，作为开始顶点，并保证 `begin` 顶点不是 null。

接下来创建两个 `HashMap` 类型的容器（可以认为是容器），先将 `begin` 顶点放在 `paths` 中。到这里会看到 `weightManager` 对象，它是处理边权值操作，这里的 `zero()` 表示权值为 0。

遍历`paths` 集合，逐个从中找出最小的路径出来，实现的函数是 `getMinPath` 函数，具体实现如下所示：

```java
Map.Entry<Vertex<V, E>, PathInfo<V, E>> getMinPath(Map<Vertex<V, E>, PathInfo<V, E>> paths) {
    Iterator<Map.Entry<Vertex<V, E>, PathInfo<V, E>>> it = paths.entrySet().iterator();
    Map.Entry<Vertex<V, E>, PathInfo<V, E>> minEntry = it.next();
    while (it.hasNext()) {
        Map.Entry<Vertex<V, E>, PathInfo<V, E>> entry = it.next();
        if (weightManager.compare(entry.getValue().weight, minEntry.getValue().weight) < 0) {
            minEntry = entry;
        }
    }
    return minEntry;
}
```

代码中实现的逻辑大致是这样，首先使用迭代器拿出 `paths` 中的元素，然后遍历元素，找出其中权值最小的元素返回。这里的 `weightManager.compare()` 函数就是比较两个权值的大小。

当拿出最小路径的元素之后，就将其赋值到 `selectedPaths` 集合中，并将该元素从 `paths` 集合中移除。此时也要记录最小权值时的顶点和最小权值的边。

再接下来，就是遍历这个顶点的边，如果边的另外一个顶点已经在 `selectedPaths` 集合中，就不做处理，然后做松弛操作。

**松弛操作**定义的函数是 `relaxForDijkstra`，还是先上代码：

```java
private void relaxForDijkstra(Edge<V, E> edge, PathInfo<V, E> fromPath, Map<Vertex<V, E>, PathInfo<V, E>> paths) {
    // 新的可选择最短路径：beginVertex 到 dege.from 的最短路径 + edge.weight
    E newWeight = weightManager.add(fromPath.weight, edge.weight);
    // 以前的最短路径： beginVertex 到 edge.to 的最短路径
    PathInfo<V, E> oldPath = paths.get(edge.to);
    if (oldPath != null && weightManager.compare(newWeight, oldPath.weight) >= 0) return;
    if (oldPath == null) {
	    oldPath = new PathInfo<>();
		paths.put(edge.to, oldPath);
	} else {
		oldPath.edgeInfos.clear();
	}
	oldPath.weight = newWeight;
	oldPath.edgeInfos.addAll(fromPath.edgeInfos);
	oldPath.edgeInfos.add(edge.info());
}
```

`relaxForDijkstra` 函数中要传入的参数分别是：

- edge：需要进行松弛的边
- fromPath：edge 的 from 的最短路径信息
- paths：存放着其他顶点（没有提起来）的最短路径信息

首先将已经确定的最短路径权值加上要松弛边的权值，作为新的权值。然后从 `paths` 集合中拿到边的另外一个顶点信息，比较这两者的权值大小，如果新的权值比另外一个顶点信息的权值小时，就将另外一个顶点信息更改为新权值的信息。即可以看到 `oldPath` 移除 `edgeInfos` ，然后添加新的权值，边信息等（最后三行代码）。

这个需要想象一下从桌子上提起石头的案例，来理解松弛操作。就是比如你已经有开始顶点到另外一个顶点的边（或者路径），之后发现了一个新的到这个顶点的边（或者逻辑），你就比较这个边（或者路径）的权值，留下权值最小的，即替换处理。

当遍历循环和松弛操作处理完之后，就可以做最后一步了，就是移除开始的顶点，然后返回 `selectedPaths` 集合。

#### 总结

- Dijkstra 算法可以想象为将石头依次从桌子上提起来，绷直的边就是最短路径了；
- 代码实现上要理解松弛操作，就是出现顶点到另外一个边的路径（大于两条），就比较，保留权值最小的边，路径；
- 理解代码时，要时刻想象*将石头依次从桌子上提起来*的场景。
