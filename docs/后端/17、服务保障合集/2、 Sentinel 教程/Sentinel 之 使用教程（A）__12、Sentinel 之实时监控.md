# 12、Sentinel 之实时监控
- 来源：https://ddkk.com/zhuanlan/guarantee/sentinel/12.html
- 分类：服务保障
- 分组：Sentinel 之 使用教程（A）
## 实时监控

Sentinel 提供对所有资源的实时监控，我们可以通过控制台查看。

可以很清楚的看到当前QPS流量趋势。

## 监控API

### 簇点监控

获取簇点列表 API: **GET /clusterNode**

当应用启动之后，可以运行下列命令，获得当前所有簇点（ClusterNode）的列表（JSON 格式）：

```bash
# 客户端IP+与控制台通信端口
http://localhost:8719/clusterNode
```

返回数组Json

结果字段说明：

```bash
[
 {
     "averageRt":0.0, //平均响应时间
 "blockRequest":0, //每分钟拦截的请求个数
 "blockedQps":0.0, //每秒拦截个数
 "curThreadNum":0, //并发个数
 "passQps":1.0, // 每秒成功通过请求
 "passReqQps":1.0, //每秒到来的请求
 "resourceName":"/registry/machine", 资源名称
 "timeStamp":1529905824134, //时间戳
 "totalQps":1.0, // 每分钟请求数
 "totalRequest":193}, 
  ....
]
```

/clusterNode是由FetchSimpleClusterNodeCommandHandler来处理的。

```java
@CommandMapping(
    name = "clusterNode",
    desc = "get all clusterNode VO, use type=notZero to ignore those nodes with totalRequest <=0"
)
public class FetchSimpleClusterNodeCommandHandler implements CommandHandler<String> {
    public FetchSimpleClusterNodeCommandHandler() {
    }
    public CommandResponse<String> handle(CommandRequest request) {
        String type = request.getParam("type");
        List<NodeVo> list = new ArrayList();
        Map<ResourceWrapper, ClusterNode> map = ClusterBuilderSlot.getClusterNodeMap();
        if (map == null) {
            return CommandResponse.ofSuccess(JSONArray.toJSONString(list));
        } else {
            Iterator var5 = map.entrySet().iterator();
            while(var5.hasNext()) {
                Entry<ResourceWrapper, ClusterNode> entry = (Entry)var5.next();
                if ("notZero".equalsIgnoreCase(type)) {
                    if (((ClusterNode)entry.getValue()).totalRequest() > 0L) {
                        list.add(NodeVo.fromClusterNode((ResourceWrapper)entry.getKey(), (ClusterNode)entry.getValue()));
                    }
                } else {
                    list.add(NodeVo.fromClusterNode((ResourceWrapper)entry.getKey(), (ClusterNode)entry.getValue()));
                }
            }
            return CommandResponse.ofSuccess(JSONArray.toJSONString(list));
        }
    }
}
```

### 查询某个簇点的详细信息

可以用下面命令模糊查询该簇点的具体信息，其中 id 对应 resource name，支持模糊查询：

```bash
http://localhost:8719/cnode?id=xxxx
```

结果示例：

```bash
idx               id               thread    pass      blocked   success    total    aRt   1m-pass   1m-block   1m-all   exeption   
6   /app/aliswitch2/machines.json     0         0         0         0          0        0     0         0          0        0          
7   /app/sentinel-admin/machines.json 0         1         0         1          1        6     0         0          0        0          
8   /identity/machine.json            0         0         0         0          0        0     0         0          0        0          
9   /registry/machine                 0         2         0         2          2        1     192       0          192      0          
10  /app/views/machine.html           0         1         0         1          1        2     0         0          0        0   
```

### 簇点调用者统计信息

可以用下列命令查询该簇点的调用者统计信息：

```java
http://localhost:8719/origin?id=xxxx
```

结果示例：

```bash
id: nodeA
idx origin  threadNum passedQps blockedQps totalQps aRt   1m-passed 1m-blocked 1m-total 
1   caller1 0         0         0          0        0     0         0          0        
2   caller2 0         0         0          0        0     0         0          0    
```

其中的origin 由 ContextUtil.enter(resourceName，origin) 方法中的 origin 指定。

### 链路监控

我们可以通过以下api来查询链路入口的链路树形结构：

```bash
http://localhost:8719/tree 
```

```bash
EntranceNode: machine-root(t:0 pq:1 bq:0 tq:1 rt:0 prq:1 1mp:0 1mb:0 1mt:0)
-EntranceNode1: Entrance1(t:0 pq:1 bq:0 tq:1 rt:0 prq:1 1mp:0 1mb:0 1mt:0)
--nodeA(t:0 pq:1 bq:0 tq:1 rt:0 prq:1 1mp:0 1mb:0 1mt:0)
-EntranceNode2: Entrance1(t:0 pq:1 bq:0 tq:1 rt:0 prq:1 1mp:0 1mb:0 1mt:0)
--nodeA(t:0 pq:1 bq:0 tq:1 rt:0 prq:1 1mp:0 1mb:0 1mt:0)
t:threadNum  pq:passQps  bq:blockedQps  tq:totalQps  rt:averageRt  prq: passRequestQps 1mp:1m-passed 1mb:1m-blocked 1mt:1m-total
```

## 历史资源数据

### 资源的秒级日志

所有资源的秒级监控日志（metric 日志）在 h o m e / l o g s / c s p / {home}/logs/csp/ home/logs/csp/{appName}-metrics.log.${date}.xx。

例如，该日志的名字可能为 my-service-metrics.log.2018-06-22.1。日志示例：

```bash
1529573107000|2018-06-21 17:25:07|sayHello(java.lang.String,long)|10|3601|10|0|2|0|0|1
```

格式说明：

```bash
index	例子	说明
1	1529573107000	时间戳
2	2018-06-21 17:25:07	日期
3	sayHello(java.lang.String,long)	资源名称
4	10	每秒通过的资源请求个数 (pass QPS)
5	3601	每秒资源被拦截的个数 (block QPS)
6	10	每秒完成调用的资源个数 (complete QPS)，包括正常结束和异常结束的情况
7	0	每秒资源的异常个数 (error QPS)
8	2	资源平均响应时间（ms）
9	0	该秒占用未来请求的数目（since 1.5.0）
10	0	预留用
11	1	资源分类（since 1.7.0）
```

### 被拦截的秒级日志

同样的，每秒的拦截日志（block 日志）也会出现在 /logs/csp/sentinel-block.log 文件下。如果没有发生拦截，则该日志不会出现。

```java
2014-06-20 16:35:10|1|sayHello(java.lang.String,long),FlowException,default,origin|61,0
2014-06-20 16:35:11|1|sayHello(java.lang.String,long),FlowException,default,origin|1,0
```

```bash
index	例子	说明
1	2014-06-20 16:35:10	时间戳
2	1	该秒发生的第一个资源
3	sayHello(java.lang.String,long)	资源名称
4	XXXException	拦截的原因, 通常 FlowException 代表是被限流规则拦截，DegradeException 则表示被降级，SystemBlockException 则表示被系统保护拦截
5	default	生效规则的调用来源（参数限流中代表生效的参数）
6	origin	被拦截资源的调用者，可以为空
7	61,0	61 被拦截的数量，0 无意义可忽略
```

### 实时查询

相关API: **GET /metric**

```bash
http://localhost:8719/metric?identity=XXX&startTime=XXXX&endTime=XXXX&maxLines=XXXX
```

需指定以下 URL 参数：

```bash
identity：资源名称
startTime：开始时间（时间戳）
endTime：结束时间
maxLines：监控数据最大行数
```

返回和metric 日志 格式一样的内容。例如：

```bash
1529998904000|2018-06-26 15:41:44|abc|100|0|0|0|0
1529998905000|2018-06-26 15:41:45|abc|4|5579|104|0|728
1529998906000|2018-06-26 15:41:46|abc|0|15698|0|0|0
1529998907000|2018-06-26 15:41:47|abc|0|19262|0|0|0
1529998908000|2018-06-26 15:41:48|abc|0|19502|0|0|0
1529998909000|2018-06-26 15:41:49|abc|0|18386|0|0|0
1529998910000|2018-06-26 15:41:50|abc|0|19189|0|0|0
1529998911000|2018-06-26 15:41:51|abc|0|16543|0|0|0
1529998912000|2018-06-26 15:41:52|abc|0|18471|0|0|0
1529998913000|2018-06-26 15:41:53|abc|0|19405|0|0|0
```
