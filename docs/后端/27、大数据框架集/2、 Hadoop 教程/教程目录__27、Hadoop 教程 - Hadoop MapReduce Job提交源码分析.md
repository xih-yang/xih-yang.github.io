# 27、Hadoop 教程 - Hadoop MapReduce Job提交源码分析
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/2/27.html
- 分类：大数据框架
- 分组：教程目录
## 1. Debug环境准备

### 1.1 Debug代码：MR经典入门案例WordCount

#### 1.1.1 Mapper类

```java
public class WordCountMapper extends Mapper<LongWritable, Text,Text,LongWritable> {
    @Override
    protected void map(LongWritable key, Text value, Context context) throws IOException, InterruptedException {
        String[] words = value.toString().split("\\s+");
        for (String word : words) {
            context.write(new Text(word),new LongWritable(1));
        }
    }
}
```

#### 1.1.2 Reducer类

```java
public class WordCountReducer extends Reducer<Text, LongWritable,Text,LongWritable> {
    @Override
    protected void reduce(Text key, Iterable<LongWritable> values, Context context) throws IOException, InterruptedException {
        long count = 0;
        for (LongWritable value : values) {
            count +=value.get();
        }
        context.write(key,new LongWritable(count));
    }
}
```

#### 1.1.3 程序运行的主类

```java
public class WordCountDriver extends Configured implements Tool {
    @Override
    public int run(String[] args) throws Exception {
        // 创建作业实例
        Job job = Job.getInstance(getConf(), WordCountDriver.class.getSimpleName());
        // 设置作业驱动类
        job.setJarByClass(this.getClass());
        // 设置作业mapper reducer类
        job.setMapperClass(WordCountMapper.class);
        job.setReducerClass(WordCountReducer.class);
        // 设置作业mapper阶段输出key value数据类型
        job.setMapOutputKeyClass(Text.class);
        job.setMapOutputValueClass(LongWritable.class);
        //设置作业reducer阶段输出key value数据类型 也就是程序最终输出数据类型
        job.setOutputKeyClass(Text.class);
        job.setOutputValueClass(LongWritable.class);
        // 配置作业的输入数据路径
		FileInputFormat.addInputPath(job, new Path(args[0]));
        // 配置作业的输出数据路径
        FileOutputFormat.setOutputPath(job, new Path(args[1]));
        //判断输出路径是否存在 如果存在删除
        FileSystem fs = FileSystem.get(getConf());
        if(fs.exists(new Path(args[1]))){
            fs.delete(new Path(args[1]),true);
        }
        // 提交作业并等待执行完成
        return job.waitForCompletion(true) ? 0 : 1;
    }
    public static void main(String[] args) throws Exception {
        //配置文件对象
        Configuration conf = new Configuration();
        //使用工具类ToolRunner提交程序
        int status = ToolRunner.run(conf, new WordCountDriver(), args);
        //退出客户端程序 客户端退出状态码和MapReduce程序执行结果绑定
        System.exit(status);
    }
}
```

## 2. MapReduce Job提交源码追踪

Debug 功能的使用方法可参考：[《IntelliJ IDEA Debug工具的使用》](https://blog.csdn.net/weixin_44758876/article/details/122797866)

### 2.1 MapReduce程序入口方法

作为使用 java 语言编写的 MapReduce 程序，其入口方法为 main 方法。在 main 方法中，使用了 ToolRunner 启动运行了 MapReduce`客户端主类，其逻辑实现定义在run方法中`。

```java
@Override
public int run(String[] args) throws Exception {
    // 创建作业实例
    Job job = Job.getInstance(getConf(), WordCountDriver.class.getSimpleName());
    // 设置作业驱动类
    job.setJarByClass(this.getClass());
    // 设置作业mapper reducer类
    job.setMapperClass(WordCountMapper.class);
    job.setReducerClass(WordCountReducer.class);
    // 设置作业mapper阶段输出key value数据类型
    job.setMapOutputKeyClass(Text.class);
    job.setMapOutputValueClass(LongWritable.class);
    //设置作业reducer阶段输出key value数据类型 也就是程序最终输出数据类型
    job.setOutputKeyClass(Text.class);
    job.setOutputValueClass(LongWritable.class);
    // 配置作业的输入数据路径
    FileInputFormat.addInputPath(job, new Path(args[0]));
    // 配置作业的输出数据路径
    FileOutputFormat.setOutputPath(job, new Path(args[1]));
    //判断输出路径是否存在 如果存在删除
    FileSystem fs = FileSystem.get(getConf());
    if(fs.exists(new Path(args[1]))){
        fs.delete(new Path(args[1]),true);
    }
    // 提交作业并等待执行完成
    return job.waitForCompletion(true) ? 0 : 1;
}
```

### 2.2 job.waitForCompletion

客户端的最后执行了`Job.waitForCompletion()`方法，从名字上可以看出该方法的功能是等待 MR 程序执行完毕。进入该方法内部：

在判断状态 state 可以提交 Job 后，执行`submit()`方法。`monitorAndPrintJob()`方法会不断的刷新获取 job 运行的进度信息，并打印。boolean 参数 verbose 为 true 表明要打印运行进度，为 false 就只是等待 job 运行结束，不打印运行日志。

```java
public boolean waitForCompletion(boolean verbose) throws IOException, InterruptedException,ClassNotFoundException {
	//当job状态为define时
	if (state == JobState.DEFINE) {
		submit();//aw:提交job
	}
	if (verbose) {
     //verbose值由用户指定  boolean类型
		//aw:随着进度和任务的进行，实时监视作业和打印状态
		monitorAndPrintJob();
	} else {
		// get the completion poll interval from the client.
		// 从客户端根据轮询间隔（默认5000 ms） 拉取完成状态信息
		int completionPollIntervalMillis = 
			Job.getCompletionPollInterval(cluster.getConf());
		while (!isComplete()) {
			try {
				Thread.sleep(completionPollIntervalMillis);
			} catch (InterruptedException ie) {
			}
		}
	}
	return isSuccessful();//检查作业是否成功完成。返回true表示成功。
}
```

### 2.3 job.submit

```java
public void submit() throws IOException, InterruptedException, ClassNotFoundException {
	//再次检查确保作业状态为define
	ensureState(JobState.DEFINE);
	//设置使用新api
	setUseNewAPI();
	//跟程序运行环境建立连接
	connect();
	//获取job提交器 根据运行环境分为local提交器、yarn提交器
	final JobSubmitter submitter = getJobSubmitter(cluster.getFileSystem(), cluster.getClient());
	status = ugi.doAs(new PrivilegedExceptionAction<JobStatus>() {
		public JobStatus run() throws IOException, InterruptedException, ClassNotFoundException {
			return submitter.submitJobInternal(Job.this, cluster);//todo 提交job
		}
	});
	//客户端提交job成功，状态更新为running
	state = JobState.RUNNING;
	LOG.info("The url to track the job: " + getTrackingURL());
}
```

#### 2.3.1 connect

MapReduce 作业提交时，`连接集群是通过Job的connect()方法实现的`，它实际上是`构造集群Cluster实例cluster`。`Cluster为连接MapReduce集群的一种工具，提供了一种获取MapReduce集群信息的方法`。

在Cluster 内部，有一个与集群进行通信的客户端通信协议 ClientProtocol 实例 client，它由 ClientProtocolProvider 的静态 create() 方法构造，而 Hadoop2.x 中提供了两种模式的 ClientProtocol，分别为 Yarn 模式的 YARNRunner 和 Local 模式的 LocalJobRunner，Cluster 实际上是由它们负责与集群进行通信的，而 Yarn 模式下，ClientProtocol 实例 YARNRunner 对象内部有一个 ResourceManager 代理 ResourceMgrDelegate 实例 resMgrDelegate，Yarn 模式下整个 MapReduce 客户端就是由它负责与 Yarn 集群进行通信，完成诸如作业提交、作业状态查询等过程，通过它获取集群的信息。

```java
private synchronized void connect() throws IOException, InterruptedException, ClassNotFoundException {
    if (cluster == null) {
     //若cluster空，则构造Cluster实例
        cluster = ugi.doAs(new PrivilegedExceptionAction<Cluster>() {
            public Cluster run() throws IOException, InterruptedException, ClassNotFoundException {
	            return new Cluster(getConfiguration());
            }
        });
    }
}
```

##### 2.3.1.1 Cluster

Cluster 类中最重要的两个成员变量是`客户端通信协议提供者ClientProtocolProvider、客户端通信协议ClientProtocol，实例叫做client`，而后者是依托前者的 create() 方法生成的。

在ClientProtocol 中，定义了很多方法，客户端可以使用这些方法进行 job 的提交、杀死、或是获取一些程序状态信息。

在Cluster 的构造方法中，完成了初始化的动作。

##### 2.3.1.2 initialize

在Cluster 类的构造方法中，调用了 initialize 初始化方法。依次取出每个 ClientProtocolProvider，通过其 create() 方法构造 ClientProtocol 实例。如果配置文件没有配置 YARN 信息，则构建 LocalRunner，MR 任务本地运行，如果配置文件有配置 YARN 信息，则构建 YarnRunner，MR 任务在 YARN 集群上运行。

#### 2.3.2 ClientProtocolProvider

上面 create() 方法时提到了两种 ClientProtocolProvider 实现类。

MapReduce 中，ClientProtocolProvider 抽象类的实现共有 YarnClientProtocolProvider、LocalClientProtocolProvider 两种，前者为 Yarn 模式，而后者为 Local 模式。

Cluster 中客户端通信协议 ClientProtocol 实例，要么是 Yarn 模式下的`YARNRunner`，要么就是 Local 模式下的`LocalJobRunner`。

##### 2.3.2.1 LocalClientProtocolProvider

##### 2.3.2.2 YarnClientProtocolProvider

YARNRunner 中最重要的一个变量就是 ResourceManager 的代理 ResourceMgrDelegate 类型的`resMgrDelegate`实例。

Yarn 模式下整个 MapReduce 客户端就是由它负责与 Yarn 集群进行通信，完成诸如作业提交、作业状态查询等过程，通过它获取集群的信息，其内部有一个实例`YarnClient`，负责与 Yarn 进行通信，还有 ApplicationId、ApplicationSubmissionContext 等与特定应用程序相关的成员变量。

#### 2.3.3 submitJobInternal

在submit 方法的最后，调用了提交器`submitter.submitJobInternal方法进行任务的提交`。它是提交Job的内部方法，实现了提交 Job 的所有业务逻辑。

JobSubmitter 的类一共有四个类成员变量，分别为：

**1、** 文件系统FileSystem实例jtFs：用于操作作业运行需要的各种文件等；

**2、** 客户端通信协议ClientProtocol实例submitClient：用于与集群交互，完成作业提交、作业状态查询等；

**3、** 提交作业的主机名submitHostName；

**4、** 提交作业的主机地址submitHostAddress；

下面就是提交任务的核心代码：

```java
JobStatus submitJobInternal(Job job, Cluster cluster) throws ClassNotFoundException, InterruptedException, IOException {
	//validate the jobs output specs 检查作业的输出规范的有效性
	//aw:比如检查输出路径是否配置并且是否存在。正确情况是已经配置且不存在
	checkSpecs(job);
	Configuration conf = job.getConfiguration();
	addMRFrameworkToDistributedCache(conf);
	//aw:获取作业准备区路径，用于作业及相关资源的提交存放,比如：jar、切片信息、配置信息等
	//默认是/tmp/hadoop-yarn/staging/提交作业用户名/.staging
	Path jobStagingArea = JobSubmissionFiles.getStagingDir(cluster, conf);
	//configure the command line options correctly on the submitting dfs
	InetAddress ip = InetAddress.getLocalHost();
	if (ip != null) {
     //记录提交作业的主机IP、主机名
		submitHostAddress = ip.getHostAddress();
		submitHostName = ip.getHostName();
		conf.set(MRJobConfig.JOB_SUBMITHOST,submitHostName);
		conf.set(MRJobConfig.JOB_SUBMITHOSTADDR,submitHostAddress);
	}
	//aw: 与运行集群通信，将获取的jobID设置入job
	JobID jobId = submitClient.getNewJobID();
	job.setJobID(jobId);
	//创建最终作业准备区路径,jobStagingArea后接/jobID
	Path submitJobDir = new Path(jobStagingArea, jobId.toString());
	JobStatus status = null;
	try {
     //设置一些作业参数
		conf.set(MRJobConfig.USER_NAME, UserGroupInformation.getCurrentUser().getShortUserName());
		conf.set("hadoop.http.filter.initializers", "org.apache.hadoop.yarn.server.webproxy.amfilter.AmFilterInitializer");
		conf.set(MRJobConfig.MAPREDUCE_JOB_DIR, submitJobDir.toString());
		LOG.debug("Configuring job " + jobId + " with " + submitJobDir + " as the submit dir");
		// get delegation token for the dir 获得路径的授权令牌
		TokenCache.obtainTokensForNamenodes(job.getCredentials(), new Path[] {
      submitJobDir }, conf);
		populateTokenCache(conf, job.getCredentials());
		// generate a secret to authenticate shuffle transfers
		if (TokenCache.getShuffleSecretKey(job.getCredentials()) == null) {
			KeyGenerator keyGen;
			try {
				keyGen = KeyGenerator.getInstance(SHUFFLE_KEYGEN_ALGORITHM);
				keyGen.init(SHUFFLE_KEY_LENGTH);
			} catch (NoSuchAlgorithmException e) {
				throw new IOException("Error generating shuffle secret key", e);
			}
			SecretKey shuffleKey = keyGen.generateKey();
			TokenCache.setShuffleSecretKey(shuffleKey.getEncoded(), job.getCredentials());
		}
		if (CryptoUtils.isEncryptedSpillEnabled(conf)) {
			conf.setInt(MRJobConfig.MR_AM_MAX_ATTEMPTS, 1);
			LOG.warn("Max job attempts set to 1 since encrypted intermediate" + "data spill is enabled");
		}
		//aw:拷贝作业相关的资源文件到submitJobDir作业准备区，比如：-libjars，-files，-archives
		copyAndConfigureFiles(job, submitJobDir);
		//创建文件job.xml 用于保存作业的配置信息
		Path submitJobFile = JobSubmissionFiles.getJobConfPath(submitJobDir);
		// Create the splits for the job todo
		LOG.debug("Creating splits at " + jtFs.makeQualified(submitJobDir));
		//aw：生成本次作业的输入切片信息，并把切片信息写入作业准备区submitJobDir
		int maps = writeSplits(job, submitJobDir);
		conf.setInt(MRJobConfig.NUM_MAPS, maps);
		LOG.info("number of splits:" + maps);
		int maxMaps = conf.getInt(MRJobConfig.JOB_MAX_MAP, MRJobConfig.DEFAULT_JOB_MAX_MAP);
		if (maxMaps >= 0 && maxMaps < maps) {
			throw new IllegalArgumentException("The number of map tasks " + maps + " exceeded limit " + maxMaps);
		}
		// write "queue admins of the queue to which job is being submitted"
		// to job file.队列信息
		String queue = conf.get(MRJobConfig.QUEUE_NAME, JobConf.DEFAULT_QUEUE_NAME);
		AccessControlList acl = submitClient.getQueueAdmins(queue);
		conf.set(toFullPropertyName(queue, QueueACL.ADMINISTER_JOBS.getAclName()), acl.getAclString());
		// removing jobtoken referrals before copying the jobconf to HDFS
		// as the tasks don't need this setting, actually they may break
		// because of it if present as the referral will point to a
		// different job.
		TokenCache.cleanUpTokenReferral(conf);
		if (conf.getBoolean(
			MRJobConfig.JOB_TOKEN_TRACKING_IDS_ENABLED,
			MRJobConfig.DEFAULT_JOB_TOKEN_TRACKING_IDS_ENABLED)) {
			// Add HDFS tracking ids
			ArrayList<String> trackingIds = new ArrayList<String>();
			for (Token<? extends TokenIdentifier> t : job.getCredentials().getAllTokens()) {
			  trackingIds.add(t.decodeIdentifier().getTrackingId());
			}
			conf.setStrings(MRJobConfig.JOB_TOKEN_TRACKING_IDS, trackingIds.toArray(new String[trackingIds.size()]));
		}
		// Set reservation info if it exists
		ReservationId reservationId = job.getReservationId();
		if (reservationId != null) {
			conf.set(MRJobConfig.RESERVATION_ID, reservationId.toString());
		}
		// 把作业配置信息写入作业准备区的job.xml文件中
		writeConf(conf, submitJobFile);
		//
		// Now, actually submit the job (using the submit name)
		//
		printTokens(jobId, job.getCredentials());
		//aw:到这里，终于进行真正的作用提交了
		status = submitClient.submitJob(jobId, submitJobDir.toString(), job.getCredentials());
		if (status != null) {
			return status;
		} else {
			throw new IOException("Could not launch job");
		}
	} finally {
		if (status == null) {
			LOG.info("Cleaning up the staging area " + submitJobDir);
			if (jtFs != null && submitJobDir != null)
				jtFs.delete(submitJobDir, true);
		}
	}
}
```
