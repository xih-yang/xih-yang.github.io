# 04、XXL-JOB 源码分析 - 丢失，失败处理机制及扩展报警方式
- 来源：https://ddkk.com/zhuanlan/job/xxljob/2/4.html
- 分类：作业调度
- 分组：XXL-JOB 源码解析
## 一、 丢失任务源码

在前面【执行器注册机制】中我们已经提及AdminBiz与ExecutorBiz的作用，任务的分发运行，取消，上报等也是通过这两个接口来实现。

任务“丢失”的判定如下：

- 打开JobLosedMonitorHelper.getInstance().start()

这里的检测时间时60s一次。

其他代码无歧义，不赘述了。

## 二、 失败任务源码

失败任务线程主要负责两件事，1-重试任务，2-任务报警。

- JobFailMonitorHelper.getInstance().start()

一进来老套路，while循环，`对了，这里的toStop时一个volatile的boolean，默认为false，当spring容器停止，触发DisposableBean时会被变更为true`。

第一步，再`xxl_job_log`表拿1000条为处理的失败日志。

第二步，通过CAS锁住一条日志进行操作。

第三步， 判断是否还有剩余失败重试次数，有则重试，并将次数-1，trigger具体逻辑我们到下一篇【triggerPool】时再聊。

第四步，触发邮件报警，`这里我们稍加改造就可以实现短信/企微等其他报警，具体见下方`。

第五步，CAS失败当前log的锁定状态。

## 三、 扩展报警方式

在失败处理线程中，我们看到了JobAlarmer，我们看一下他的结构。

这里的解耦味道不错。

- JobAlarmer 是警报触发器，负责触发的动作。
- JobAlarm 的实现类是 实际警报处理器，比如此处的EmailJobAlarm实现了邮件的发送。

同理我们也可以增加一些其他方式的报警处理器:

**1、** 需要实现JobAlarm的doAlarm方法即可；

**1、** 如果需要发送地址，比如短信报警，可以复用页面的“报警邮件*”这一项，或者自定义，再增加一个字段，然后在新增的doAlarm里面解析使用即可；
