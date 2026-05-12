# 10、Quartz Cron类型触发器的misfire策略
- 来源：https://ddkk.com/zhuanlan/job/quartz/1/16.html
- 分类：作业调度
- 分组：Quartz 教程（版本 B）
关于misfire策略的设置在[Simple类型触发器的misfire策略](/zhuanlan/job/quartz/b/9/)中已经说明了触发器的misfire策略应该如何设置，本篇介绍一下cron类型的触发器的misfire策略的种类及其处理方式

## cron类型触发器的misfire策略及处理方式

## IgnoreMisfire

该方法设置misfire策略为IgnoreMisfire，其处理方式为misfire了多少次就立即触发多少次，后面按照设定的频率正常触发。

## DoNothing

该方法设置misfire策略为DoNothing。其处理方式为无论misfire多少次都忽略，后面按照设定的频率正常触发。

## FireNow

该方法设置misfire策略为FireOnceNow。其处理方式为无论misfire多少次，立即触发一次，后续按照设定的频率正常触发。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
