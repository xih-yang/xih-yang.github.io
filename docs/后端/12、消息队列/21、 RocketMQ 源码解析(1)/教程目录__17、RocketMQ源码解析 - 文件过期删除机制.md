# 17、RocketMQ源码解析 - 文件过期删除机制
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/1/17.html
- 分类：消息队列
- 分组：教程目录
由于RocketMQ操作CommitLog、ConsumeQueue文件，都是基于内存映射方法并在启动的时候，会加载commitlog、ConsumeQueue目录下的所有文件，为了避免内存与磁盘的浪费，不可能将消息永久存储在消息服务器上，所以需要一种机制来删除已过期的文件。

RocketMQ顺序写Commitlog、ConsumeQueue文件，所有写操作全部落在最后一个CommitLog或ConsumeQueue文件上，之前的文件在下一个文件创建后，将不会再被更新。

RocketMQ清除过期文件的方法是：如果非当前写文件在一定时间间隔内没有再次被更新，则认为是过期文件，可以被删除，RocketMQ不会管这个这个文件上的消息是否被全部消费。默认每个文件的过期时间为72小时。通过在Broker配置文件中设置fileReservedTime来改变过期时间，单位为小时。接下来详细分析RocketMQ是如何设计与实现上述机制的。

DefaultMessageStore#addScheduleTask:

```java
this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {
    @Override
    public void run() {
        DefaultMessageStore.this.cleanFilesPeriodically();
    }
}, 1000 * 60, this.messageStoreConfig.getCleanResourceInterval(), TimeUnit.MILLISECONDS);
```

RocketMQ 会每隔10s调度一次cleanFilesPeriodically，已检测是否需要清除过期文件。执行频率可以通过设置cleanResourceInterval，默认为10s。

DefaultMessageStore#cleanFilesPeriodically

```java
private void cleanFilesPeriodically() {
    this.cleanCommitLogService.run();
    this.cleanConsumeQueueService.run();
}
```

主要清除CommitLog、ConsumeQueue的过期文件。CommitLog 与 ConsumeQueue 对于过期文件的删除算法、逻辑大同小异，本文将以 CommitLog 过期文件为例来详细分析其实现原理。

DefaultMessageStore `$` CleanCommitLogService#run

```java
public void run() {
    try {
           this.deleteExpiredFiles();
           this.redeleteHangedFile();
     } catch (Throwable e) {
            DefaultMessageStore.log.warn(this.getServiceName() + " service has 
                    exception. ", e);
     }
}
```

整个执行过程分为两个大的步骤，第一个步骤：尝试删除过期文件；第二个步骤：重试删除被hange(由于被其他线程引用在第一阶段未删除的文件)，在这里再重试一次。

DefaultMessageStore `$` CleanCommitLogService#deleteExpiredFiles

```java
long fileReservedTime = DefaultMessageStore.this.getMessageStoreConfig().getFileReservedTime();
int deletePhysicFilesInterval = DefaultMessageStore.this.getMessageStoreConfig().getDeleteCommitLogFilesInterval();
int destroyMapedFileIntervalForcibly = DefaultMessageStore.this.getMessageStoreConfig().getDestroyMapedFileIntervalForcibly();
```

Step1：解释一下这个三个配置属性的含义。

- fileReservedTime：文件保留时间，也就是从最后一次更新时间到现在，如果超过了该时间，则认为是过期文件，可以被删除。
- deletePhysicFilesInterval：删除物理文件的间隔，因为在一次清除过程中，可能需要删除的文件不止一个，该值指定两次删除文件的间隔时间。
- destroyMapedFileIntervalForcibly：在清除过期文件时，如果该文件被其他线程所占用（引用次数大于0，比如读取消息），此时会阻止此次删除任务,同时在第一次试图删除该文件时记录当前时间戳，destroyMapedFileIntervalForcibly表示第一次拒绝删除之后能保留的最大时间，在此时间内，同样可以被拒绝删除，同时会将引用减少1000个，超过该时间间隔后，文件将被强制删除。

DefaultMessageStore `$` CleanCommitLogService#deleteExpiredFiles:

```java
boolean timeup = this.isTimeToDelete();
boolean spacefull = this.isSpaceToDelete();
boolean manualDelete = this.manualDeleteFileSeveralTimes > 0;
if (timeup || spacefull || manualDelete) {
    //继续执行删除逻辑
   return;
} else {
   // 本次删除任务无作为。
}
```

Step2：RocketMQ在如下三种情况任意满足之一的情况下将继续执行删除文件操作。

- 到了删除文件的时间点，RocketMQ通过deleteWhen设置一天的固定时间执行一次删除过期文件操作，默认为凌晨4点。
- 判断磁盘空间是否充足，如果不充足，则返回true，表示应该触发过期文件删除操作。
- 预留，手工触发，可以通过调用excuteDeleteFilesManualy方法手工触发过期文件删除，目前RocketMQ暂未封装手工触发文件删除的命令。

重点分析一下磁盘不足的判断依据。

DefaultMessageStore `$` CleanCommitLogService#isSpaceToDelete

```java
double ratio = DefaultMessageStore.this.getMessageStoreConfig().getDiskMaxUsedSpaceRatio() / 100.0;   // @1
cleanImmediately = false;
{
    String storePathPhysic = DefaultMessageStore.this.getMessageStoreConfig().getStorePathCommitLog();
    double physicRatio = UtilAll.getDiskPartitionSpaceUsedPercent(storePathPhysic);   // @2
    if (physicRatio > diskSpaceWarningLevelRatio) {
       // @3
           boolean diskok = DefaultMessageStore.this.runningFlags.getAndMakeDiskFull();
           if (diskok) {
                 DefaultMessageStore.log.error("physic disk maybe full soon " + physicRatio + ", so mark disk full");
           }
             cleanImmediately = true;
     } else if (physicRatio > diskSpaceCleanForciblyRatio) {
           cleanImmediately = true;
     } else {
            boolean diskok = DefaultMessageStore.this.runningFlags.getAndMakeDiskOK();
            if (!diskok) {
                   DefaultMessageStore.log.info("physic disk space OK " + physicRatio + ", so mark disk ok");
             }
      }
      if (physicRatio < 0 || physicRatio > ratio) {
            DefaultMessageStore.log.info("physic disk maybe full soon, so reclaim space, " + physicRatio);
            return true;
      }
}
```

代码@1：获取maxUsedSpaceRatio，表示commitlog、consumequeue文件所在磁盘分区的最大使用量，如果超过该值，则需要立即清除过期文件。

代码@2：通过File#getTotalSpace()获取commitlog所在磁盘分区总的存储容量，通过File#getFreeSpace()获取commitlog目录所在磁盘文件剩余容量并得出当前该分区的物理磁盘使用率physicRatio 。

代码@3：RocketMQ另外提供了两个与磁盘空间使用率相关的系统级参数：

- -Drocketmq.broker.diskSpaceWarningLevelRatio=0.90：如果磁盘分区使用率超过该阔值，将设置磁盘不可写，此时会拒绝新消息的写入。
- -Drocketmq.broker.diskSpaceCleanForciblyRatio=0.85：如果磁盘分区使用超过该阔值，建议立即执行过期文件清除，但不会拒绝新消息的写入。

判断磁盘是否可用，用当前已使用物理磁盘率maxUsedSpaceRatio、diskSpaceWarningLevelRatio、diskSpaceCleanForciblyRatio，如果当前磁盘使用率达到上述阔值，将返回true表示磁盘已满，需要进行过期文件删除操作。

Step3：然后根据文件的最后一次更新时间与当前时间做比较，判断是否过期，如果已过期，调用MappedFile的destory。

MappedFile#shutdown

```java
public void shutdown(final long intervalForcibly) {
    if (this.available) {
        this.available = false;
        this.firstShutdownTimestamp = System.currentTimeMillis();
        this.release();
    } else if (this.getRefCount() > 0) {
        if ((System.currentTimeMillis() - this.firstShutdownTimestamp) >= intervalForcibly) {
            this.refCount.set(-1000 - this.getRefCount());
            this.release();
        }
    }
}
```

如果available为true，表示第一次执行shutdown方法，首先设置available为false，并记录firstShutdownTimestamp 时间戳，如果当前该文件被其他线程引用，则本次不强制删除，如果没有其他线程在使用该文件，则清除MappedFile相关资源，并最终执行File#delete()方法清除文件。在拒绝被删除保护期内（destroyMapedFileIntervalForcibly）每执行一次清理任务，将引用次数减去1000，引用数小于1后，该文件最终将被删除。

关于ConsumeQueue 的过期文件删除机制与Commitlog文件机制类似，本文就不重复讲解。

本文重点是理解如下参数的含义：fileReservedTime、deletePhysicFilesInterval、destroyMapedFileIntervalForcibly、-Drocketmq.broker.diskSpaceWarningLevelRatio

-Drocketmq.broker.diskSpaceCleanForciblyRatio与获取磁盘分区总容量与剩余容量的方法。
