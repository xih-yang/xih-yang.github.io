# 26、Hadoop 教程 - Hadoop MapReduce工作流
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/2/26.html
- 分类：大数据框架
- 分组：教程目录
## 1. MapReduce工作流

使用 Hadoop 里面的 MapReduce 来处理海量数据是非常简单方便的，但有时候我们的应用程序，往往需要多个 MR 作业，来计算结果，比如说一个最简单的使用 MR 提取海量搜索日志的 TopN 的问题，注意，这里面，其实涉及了两个 MR 作业，第一个是词频统计，第两个是排序求 TopN，这显然是需要两个 MapReduce 作业来完成的。其他的还有，比如一些数据挖掘类的作业，常常需要迭代组合好几个作业才能完成，这类作业类似于 DAG 类的任务，各个作业之间是具有先后，或相互依赖的关系，比如说，这一个作业的输入，依赖上一个作业的输出等等。

在Hadoop 里实际上提供了，`JobControl类，来组合一个具有依赖关系的作业，在新版的API里，又新增了ControlledJob类，细化了任务的分配，通过这两个类，我们就可以轻松的完成类似DAG作业的模式`，这样我们就可以通过一个提交来完成原来需要提交 2 次的任务，大大简化了任务的繁琐度。具有依赖式的作业提交后，hadoop 会根据依赖的关系，先后执行的 job 任务，每个任务的运行都是独立的。

### 1.1 需求

针对 MapReduce reduce join 方式处理订单和商品数据之间的关联，需要进行两步程序处理，首先把两个数据集进行join操作，然后针对join的结果进行排序，保证同一笔订单的商品数据聚集在一起。（具体可见上一篇[《Hadoop生态圈（二十五）- MapReduce Join操作》](/zhuanlan/bigdata/hadoop/2/25.html)）

两个程序带有依赖关系，可以使用工作流进行任务的设定，依赖的绑定，一起提交执行。

### 1.2 代码实现

#### 1.2.1 reduce join、result sort程序

详细可见上一篇[Hadoop 教程 - Hadoop MapReduce Join操作](/zhuanlan/bigdata/hadoop/2/25.html)的 Join 案例，这里不再重复说。

#### 1.2.2 作业流程控制类

该驱动类主要负责建立 reduce join 与 result sort 两个 ControlledJob，最终通过 JobControl 实现。

```java
public class MrJobFlow {
    public static void main(String[] args) throws Exception {
        Configuration conf = new Configuration();
        //第一个作业的配置
        Job job1 = Job.getInstance(conf, ReduceJoinDriver.class.getSimpleName());
        job1.setJarByClass(ReduceJoinDriver.class);
        job1.setMapperClass(ReduceJoinMapper.class);
        job1.setReducerClass(ReduceJoinReducer.class);
        job1.setMapOutputKeyClass(Text.class);
        job1.setMapOutputValueClass(Text.class);
        job1.setOutputKeyClass(Text.class);
        job1.setOutputValueClass(Text.class);
        FileInputFormat.addInputPath(job1, new Path("D:\\datasets\\mr_join\\input"));
        FileOutputFormat.setOutputPath(job1, new Path("D:\\datasets\\mr_join\\rjout"));
        //将普通作业包装成受控作业
        ControlledJob ctrljob1 = new ControlledJob(conf);
        ctrljob1.setJob(job1);
        //第二个作业的配置
        Job job2 = Job.getInstance(conf, ReduceJoinSortApp.class.getSimpleName());
        job2.setJarByClass(ReduceJoinSortApp.class);
        job2.setMapperClass(ReduceJoinSortApp.ReduceJoinMapper.class);
		job2.setReducerClass(ReduceJoinSortApp.ReduceJoinReducer.class);
        job2.setMapOutputKeyClass(Text.class);
        job2.setMapOutputValueClass(Text.class);
        job2.setOutputKeyClass(Text.class);
        job2.setOutputValueClass(NullWritable.class);
        FileInputFormat.addInputPath(job2, new Path("D:\\datasets\\mr_join\\rjout"));
        FileOutputFormat.setOutputPath(job2, new Path("D:\\datasets\\mr_join\\rjresult"));
        //将普通作业包装成受控作业
        ControlledJob ctrljob2 = new ControlledJob(conf);
        ctrljob2.setJob(job2);
        //设置依赖job的依赖关系
        ctrljob2.addDependingJob(ctrljob1);
        // 主控制容器，控制上面的总的两个子作业
        JobControl jobCtrl = new JobControl("myctrl");
        // 添加到总的JobControl里，进行控制
        jobCtrl.addJob(ctrljob1);
        jobCtrl.addJob(ctrljob2);
        // 在线程启动，记住一定要有这个
        Thread t = new Thread(jobCtrl);
        t.start();
        while(true) {
            if (jobCtrl.allFinished()) {
     // 如果作业成功完成，就打印成功作业的信息
                System.out.println(jobCtrl.getSuccessfulJobList());
                jobCtrl.stop();
                break;
            }
        }
    }
}
```

### 1.3 运行结果
