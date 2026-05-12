# 24、Hadoop 教程 - Yarn的常用命令
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/3/24.html
- 分类：大数据框架
- 分组：教程目录
## 1. 什么是YARN的常用命令

Yarn状态的查询，除了可以在bigdata1:8088页面查看外，还可以通过命令操作。在执行这些命令的前提是需要有程序在YARN上运行，此次演示程序为执行WordCount案例，并用Yarn命令查看任务运行情况。

启动官方WordCount案例如下命令所示：

```java
hadoop jar share/hadoop/mapreduce/hadoop-mapreduce-examples-3.1.3.jar wordcount /input /output
```

## 2. yarn application查看任务

1）列出所有Application：

> yarn application -list

2）根据Application状态过滤：yarn application -list -appStates （所有状态：ALL、NEW、NEW_SAVING、SUBMITTED、ACCEPTED、RUNNING、FINISHED、FAILED、KILLED）

> yarn application -list -appStates FINISHED

3）Kill掉Application：

> yarn application -kill application_1612577921195_0001

## 3. yarn logs查看日志

1）查询Application日志：yarn logs -applicationId

> yarn logs -applicationId application_1612577921195_0001

2）查询Container日志：yarn logs -applicationId  -containerId

> yarn logs -applicationId application_1612577921195_0001 -containerId container_1612577921195_0001_01_000001

## 4. yarn applicationattempt查看尝试运行的任务

1）列出所有Application尝试的列表：yarn applicationattempt -list

> yarn applicationattempt -list application_1612577921195_0001

2）打印ApplicationAttemp状态：yarn applicationattempt -status

> yarn applicationattempt -status appattempt_1612577921195_0001_000001

## 5. yarn container查看容器

1）列出所有Container：yarn container -list

> yarn container -list appattempt_1612577921195_0001_000001

2）打印Container状态： yarn container -status

> yarn container -status container_1612577921195_0001_01_000001

注：只有在任务跑的途中才能看到container的状态

## 6. yarn node查看节点状态

列出所有节点：yarn node -list -all

## 7. yarn rmadmin更新配置

加载队列配置：yarn rmadmin -refreshQueues

## 8. yarn queue查看队列

打印队列信息：yarn queue -status

> yarn queue -status default
