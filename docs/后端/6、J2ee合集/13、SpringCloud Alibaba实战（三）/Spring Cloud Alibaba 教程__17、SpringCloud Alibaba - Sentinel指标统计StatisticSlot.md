# 17、SpringCloud Alibaba - Sentinel指标统计StatisticSlot
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/3/17.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程
## 一、StatisticSlot 流程

**1、StatisticSlot**

StatisticSlot主要用于统计线程数量、请求数量、响应时间、阻塞数量、异常数量。

```java
@SpiOrder(-7000)
public class StatisticSlot extends AbstractLinkedProcessorSlot<DefaultNode> {
    @Override
    public void entry(Context context, ResourceWrapper resourceWrapper, DefaultNode node, int count,
                      boolean prioritized, Object... args) throws Throwable {
        try {
            // Do some checking.
            //先校验其他规则，再进行数据统计
            fireEntry(context, resourceWrapper, node, count, prioritized, args);
            // Request passed, add thread count and pass count.
            //node 和 clusterNode 中访问线程数都加1
            node.increaseThreadNum();
            //node 和 clusterNode 中访问通过数都加1
            //包括 分钟级时间窗口：rollingCounterInMinute, 秒级时间窗口：rollingCounterInSecond
            node.addPassRequest(count);
			//前置资源节点不为空时，增加访问线程数和访问通过数，用于填充上层链路节点的数据
            if (context.getCurEntry().getOriginNode() != null) {
                // Add count for origin node.
                context.getCurEntry().getOriginNode().increaseThreadNum();
                context.getCurEntry().getOriginNode().addPassRequest(count);
            }
			//入栈流量，全局访问线程数、访问通过数都加1
            if (resourceWrapper.getEntryType() == EntryType.IN) {
                // Add count for global inbound entry node for global statistics.
                Constants.ENTRY_NODE.increaseThreadNum();
                Constants.ENTRY_NODE.addPassRequest(count);
            }
            // Handle pass event with registered entry callback handlers.
            // ProcessorSlotEntryCallback 回调
            for (ProcessorSlotEntryCallback<DefaultNode> handler : StatisticSlotCallbackRegistry.getEntryCallbacks()) {
                handler.onPass(context, resourceWrapper, node, count, args);
            }
        } catch (PriorityWaitException ex) {
        	//优先级等待异常，记录统计数据，记录了通过线程数，然后直接放行请求
            node.increaseThreadNum();
            if (context.getCurEntry().getOriginNode() != null) {
                // Add count for origin node.
                context.getCurEntry().getOriginNode().increaseThreadNum();
            }
            if (resourceWrapper.getEntryType() == EntryType.IN) {
                // Add count for global inbound entry node for global statistics.
                Constants.ENTRY_NODE.increaseThreadNum();
            }
            // Handle pass event with registered entry callback handlers.
            for (ProcessorSlotEntryCallback<DefaultNode> handler : StatisticSlotCallbackRegistry.getEntryCallbacks()) {
                handler.onPass(context, resourceWrapper, node, count, args);
            }
        } catch (BlockException e) {
        	//校验不通过异常
            // Blocked, set block exception to current entry.
            //设置异常信息
            context.getCurEntry().setBlockError(e);
            // Add block count.
            //阻塞请求数增加1
            node.increaseBlockQps(count);
            if (context.getCurEntry().getOriginNode() != null) {
                context.getCurEntry().getOriginNode().increaseBlockQps(count);
            }
            if (resourceWrapper.getEntryType() == EntryType.IN) {
                // Add count for global inbound entry node for global statistics.
                Constants.ENTRY_NODE.increaseBlockQps(count);
            }
            // Handle block event with registered entry callback handlers.
            for (ProcessorSlotEntryCallback<DefaultNode> handler : StatisticSlotCallbackRegistry.getEntryCallbacks()) {
                handler.onBlocked(e, context, resourceWrapper, node, count, args);
            }
			//继续抛出异常
            throw e;
        } catch (Throwable e) {
            // Unexpected internal error, set error to current entry.
            //其他异常，设置异常信息
            context.getCurEntry().setError
```
