# 06、XXL-JOB 调度中心/执行器 RESTful API
- 来源：https://ddkk.com/zhuanlan/job/xxljob/1/6.html
- 分类：作业调度
- 分组：教程目录
XXL-JOB 目标是一种跨平台、跨语言的任务调度规范和协议。

针对Java应用，可以直接通过官方提供的调度中心与执行器，方便快速的接入和使用调度中心，可以参考上文 “快速入门” 章节。

针对非Java应用，可借助 XXL-JOB 的标准 RESTful API 方便的实现多语言支持。

- 调度中心 RESTful API：
- 说明：调度中心提供给执行器使用的API；不局限于官方执行器使用，第三方可使用该API来实现执行器；
- API列表：执行器注册、任务结果回调等；
- 执行器 RESTful API ：
- 说明：执行器提供给调度中心使用的API；官方执行器默认已实现，第三方执行器需要实现并对接提供给调度中心；
- API列表：任务触发、任务终止、任务日志查询……等；

此处RESTful API 主要用于非Java语言定制个性化执行器使用，实现跨语言。除此之外，如果有需要通过API操作调度中心，可以个性化扩展 “调度中心 RESTful API” 并使用。

## 6.1 调度中心 RESTful API

API服务位置：com.xxl.job.core.biz.AdminBiz （ com.xxl.job.admin.controller.JobApiController ）

API服务请求参考代码：com.xxl.job.adminbiz.AdminBizTest

### a、任务回调

```sh
说明：执行器执行完任务后，回调任务结果时使用 
------ 
地址格式：{调度中心根地址}/api/callback 
Header： 
 XXL-JOB-ACCESS-TOKEN : {请求令牌} 
请求数据格式如下，放置在 RequestBody 中，JSON格式： 
 [{ 
     "logId":1,              // 本次调度日志ID 
     "logDateTim":0,         // 本次调度日志时间 
     "handleCode":200,       // 200 表示任务执行正常，500表示失败 
     "handleMsg": null 
     } 
 }] 
响应数据格式： 
 { 
   "code": 200,      // 200 表示正常、其他失败 
   "msg": null      // 错误提示消息 
 } 
```

### b、执行器注册

```sh
说明：执行器注册时使用，调度中心会实时感知注册成功的执行器并发起任务调度 ------ 
地址格式：{调度中心根地址}/api/registry 
Header： 
 XXL-JOB-ACCESS-TOKEN : {请求令牌} 
请求数据格式如下，放置在 RequestBody 中，JSON格式： 
 { 
     "registryGroup":"EXECUTOR",                     // 固定值 
     "registryKey":"xxl-job-executor-example",       // 执行器AppName 
     "registryValue":"http://127.0.0.1:9999/"        // 执行器地址，内置服务跟地址 
 } 
响应数据格式： 
 { 
   "code": 200,      // 200 表示正常、其他失败 
   "msg": null      // 错误提示消息 
 } 
```

### c、执行器注册摘除

```sh
说明：执行器注册摘除时使用，注册摘除后的执行器不参与任务调度与执行 
------ 
地址格式：{调度中心根地址}/api/registryRemove 
Header： 
 XXL-JOB-ACCESS-TOKEN : {请求令牌} 
请求数据格式如下，放置在 RequestBody 中，JSON格式： 
 { 
     "registryGroup":"EXECUTOR",                     // 固定值 
     "registryKey":"xxl-job-executor-example",       // 执行器AppName 
     "registryValue":"http://127.0.0.1:9999/"        // 执行器地址，内置服务跟地址 
 } 
响应数据格式： 
 { 
   "code": 200,      // 200 表示正常、其他失败 
   "msg": null      // 错误提示消息 
 } 
```

## 6.2 执行器 RESTful API

API服务位置：com.xxl.job.core.biz.ExecutorBiz

API服务请求参考代码：com.xxl.job.executorbiz.ExecutorBizTest

### a、心跳检测

```sh
说明：调度中心检测执行器是否在线时使用 
------ 
地址格式：{执行器内嵌服务根地址}/beat 
Header： 
 XXL-JOB-ACCESS-TOKEN : {请求令牌} 
请求数据格式如下，放置在 RequestBody 中，JSON格式： 
响应数据格式： 
 { 
   "code": 200,      // 200 表示正常、其他失败 
   "msg": null       // 错误提示消息 
 } 
```

### b、忙碌检测

```sh
说明：调度中心检测指定执行器上指定任务是否忙碌（运行中）时使用 
------ 
地址格式：{执行器内嵌服务根地址}/idleBeat 
Header： 
 XXL-JOB-ACCESS-TOKEN : {请求令牌} 
请求数据格式如下，放置在 RequestBody 中，JSON格式： 
 { 
     "jobId":1       // 任务ID 
 } 
响应数据格式： 
 { 
   "code": 200,      // 200 表示正常、其他失败 
   "msg": null       // 错误提示消息 
 } 
```

### c、触发任务

```sh
说明：触发任务执行 
------ 
地址格式：{执行器内嵌服务根地址}/run 
Header： 
 XXL-JOB-ACCESS-TOKEN : {请求令牌} 
请求数据格式如下，放置在 RequestBody 中，JSON格式： 
 { 
     "jobId":1,                                  // 任务ID 
     "executorHandler":"demoJobHandler",         // 任务标识 
     "executorParams":"demoJobHandler",          // 任务参数 
     "executorBlockStrategy":"COVER_EARLY",      // 任务阻塞策略，可选值参考 com.xxl.job.core.enums.ExecutorBlockStrategyEnum 
     "executorTimeout":0,                        // 任务超时时间，单位秒，大于零时生效 
     "logId":1,                                  // 本次调度日志ID 
     "logDateTime":1586629003729,                // 本次调度日志时间 
     "glueType":"BEAN",                          // 任务模式，可选值参考 com.xxl.job.core.glue.GlueTypeEnum 
     "glueSource":"xxx",                         // GLUE脚本代码 
     "glueUpdatetime":1586629003727,             // GLUE脚本更新时间，用于判定脚本是否变更以及是否需要刷新 
     "broadcastIndex":0,                         // 分片参数：当前分片 
     "broadcastTotal":0                          // 分片参数：总分片 
 } 
响应数据格式： 
 { 
   "code": 200,      // 200 表示正常、其他失败 
   "msg": null       // 错误提示消息 
 } 
```

### f、终止任务

```sh
说明：终止任务 
------ 
地址格式：{执行器内嵌服务根地址}/kill 
Header： 
 XXL-JOB-ACCESS-TOKEN : {请求令牌} 
请求数据格式如下，放置在 RequestBody 中，JSON格式： 
 { 
     "jobId":1       // 任务ID 
 } 
 响应数据格式： 
     { 
       "code": 200,      // 200 表示正常、其他失败 
       "msg": null       // 错误提示消息 
     } 
```

### d、查看执行日志

```sh
说明：终止任务，滚动方式加载 
------ 
地址格式：{执行器内嵌服务根地址}/log 
Header： 
 XXL-JOB-ACCESS-TOKEN : {请求令牌} 
请求数据格式如下，放置在 RequestBody 中，JSON格式： 
 { 
     "logDateTim":0,     // 本次调度日志时间 
     "logId":0,          // 本次调度日志ID 
     "fromLineNum":0     // 日志开始行号，滚动加载日志 
 } 
响应数据格式： 
 { 
     "code":200,         // 200 表示正常、其他失败 
     "msg": null         // 错误提示消息 
     "content":{ 
         "fromLineNum":0,        // 本次请求，日志开始行数 
         "toLineNum":100,        // 本次请求，日志结束行号 
         "logContent":"xxx",     // 本次请求日志内容 
         "isEnd":true            // 日志是否全部加载完 
     } 
 } 
```
