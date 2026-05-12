# 6、Hystrix 请求合并
- 来源：https://ddkk.com/zhuanlan/guarantee/hystrix/13.html
- 分类：服务保障
- 分组：Hystrix 之 使用教程（B）
hystrix支持N个请求自动合并为一个请求，这个功能在有网络交互的场景下尤其有用，比如每个请求都要网络访问远程资源，如果把请求合并为一个，将使多次网络交互变成一次，极大节省开销。重要一点，两个请求能自动合并的前提是两者足够“近”，即两者启动执行的间隔时长要足够小，默认为10ms，即超过10ms将不自动合并。

请求合并使多个请求可以批量化成单个HystrixCommand实例执行。

合并器可以使用批量大小和自批次创建以来的经过时间作为执行批处理的触发器。

Hystrix支持2种请求折叠方式：请求范围和全局范围。这是在collapser构造中配置的，默认为请求范围。

一个请求范围的collapser收集每个HystrixRequestContext的一个批次，而一个全局范围的collapser收集一个批次跨多个HystrixRequestContexts。因此，如果您的下游依赖关系在单个命令调用中无法处理多个HystrixRequestContexts，则请求范围的折叠是正确的选择。

## 1、测试代码如下：

```java
/**
 * hystrix支持N个请求自动合并为一个请求，这个功能在有网络交互的场景下尤其有用
 * 比如每个请求都要网络访问远程资源，如果把请求合并为一个，将使多次网络交互变成一次，极大节省开销
 * 重要一点，两个请求能自动合并的前提是两者足够“近”，即两者启动执行的间隔时长要足够小，默认为10ms，即超过10ms将不自动合并
 * @author liucongcong 2017年10月17日
 *
 */
public class HystrixCollapser extends com.netflix.hystrix.HystrixCollapser<List<String>, String, Integer>{
	private final Integer key;
    public HystrixCollapser(Integer key) {
        this.key = key;
    }
    @Override
    public Integer getRequestArgument() {
        return key;
    }
    @Override
    protected HystrixCommand<List<String>> createCommand(final Collection<CollapsedRequest<String, Integer>> requests) {
    	return new BatchCommand(requests);
    }
    @Override
    protected void mapResponseToRequests(List<String> batchResponse, Collection<CollapsedRequest<String, Integer>> requests) {
        int count = 0;
        for (CollapsedRequest<String, Integer> request : requests) {
            request.setResponse(batchResponse.get(count++));
        }
    }
    private static final class BatchCommand extends HystrixCommand<List<String>> {
        private final Collection<CollapsedRequest<String, Integer>> requests;
        private BatchCommand(Collection<CollapsedRequest<String, Integer>> requests) {
                super(Setter.withGroupKey(HystrixCommandGroupKey.Factory.asKey("ExampleGroup"))
                    .andCommandKey(HystrixCommandKey.Factory.asKey("GetValueForKey")));
            this.requests = requests;
        }
        @Override
        protected List<String> run() {
            ArrayList<String> response = new ArrayList<String>();
            for (CollapsedRequest<String, Integer> request : requests) {
                // 批量收到的每个参数的响应
                response.add("collapser: " + request.getArgument());
            }
            return response;
        }
    }
}
```

```java
public class TestCollapser {
	@Test
	public void testCollapser() throws Exception {
	    HystrixRequestContext context = HystrixRequestContext.initializeContext();
	    try {
	        Future<String> f1 = new HystrixCollapser(1).queue();
	        //Thread.sleep(100);
	        Future<String> f2 = new HystrixCollapser(2).queue();
	        Future<String> f3 = new HystrixCollapser(3).queue();
	        Future<String> f4 = new HystrixCollapser(4).queue();
	        assertEquals("collapser: 1", f1.get());
	        assertEquals("collapser: 2", f2.get());
	        assertEquals("collapser: 3", f3.get());
	        assertEquals("collapser: 4", f4.get());
	        // 当前的请求数        自动合并请求 总共发送一次请求 
	        assertEquals(1, HystrixRequestLog.getCurrentRequest().getExecutedCommands().size());
	        HystrixCommand<?> command = HystrixRequestLog.getCurrentRequest().getExecutedCommands().toArray(new HystrixCommand<?>[1])[0];
	        // assert the command is the one we're expecting
	        assertEquals("GetValueForKey", command.getCommandKey().name());
	        // confirm that it was a COLLAPSED command execution
	        assertTrue(command.getExecutionEvents().contains(HystrixEventType.COLLAPSED));
	        // and that it was successful
	        assertTrue(command.getExecutionEvents().contains(HystrixEventType.SUCCESS));
	    } finally {
	        context.shutdown();
	    }
	}
}
```
