# 18、Hadoop 教程 - MapReduce框架原理之数据清洗（ETL）
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/3/18.html
- 分类：大数据框架
- 分组：教程目录
## 1. 数据清洗（ETL）概述

“ETL，是英文Extract-Transform-Load的缩写，用来描述将数据从来源端经过抽取（Extract）、转换（Transform）、加载（Load）至目的端的过程。ETL一词较常用在数据仓库，但其对象并不限于数据仓库。

在运行核心业务MapReduce程序之前，往往要先对数据进行清洗，清理掉不符合用户要求的数据。清理的过程往往只需要运行Mapper程序，不需要运行Reduce程序。

## 2. 需求

去除日志中字段个数小于等于11的日志。

1）输入数据（web.log）：

```java
194.237.142.21 - - [18/Sep/2013:06:49:18 +0000] "GET /wp-content/uploads/2013/07/rstudio-git3.png HTTP/1.1" 304 0 "-" "Mozilla/4.0 (compatible;)"
183.49.46.228 - - [18/Sep/2013:06:49:23 +0000] "-" 400 0 "-" "-"
163.177.71.12 - - [18/Sep/2013:06:49:33 +0000] "HEAD / HTTP/1.1" 200 20 "-" "DNSPod-Monitor/1.0"
163.177.71.12 - - [18/Sep/2013:06:49:36 +0000] "HEAD / HTTP/1.1" 200 20 "-" "DNSPod-Monitor/1.0"
101.226.68.137 - - [18/Sep/2013:06:49:42 +0000] "HEAD / HTTP/1.1" 200 20 "-" "DNSPod-Monitor/1.0"
101.226.68.137 - - [18/Sep/2013:06:49:45 +0000] "HEAD / HTTP/1.1" 200 20 "-" "DNSPod-Monitor/1.0"
60.208.6.156 - - [18/Sep/2013:06:49:48 +0000] "GET /wp-content/uploads/2013/07/rcassandra.png HTTP/1.0" 200 185524 "http://cos.name/category/software/packages/" "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.66 Safari/537.36"
222.68.172.190 - - [18/Sep/2013:06:49:57 +0000] "GET /images/my.jpg HTTP/1.1" 200 19939 "http://www.angularjs.cn/A00n" "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.66 Safari/537.36"
222.68.172.190 - - [18/Sep/2013:06:50:08 +0000] "-" 400 0 "-" "-"
183.195.232.138 - - [18/Sep/2013:06:50:16 +0000] "HEAD / HTTP/1.1" 200 20 "-" "DNSPod-Monitor/1.0"
183.195.232.138 - - [18/Sep/2013:06:50:16 +0000] "HEAD / HTTP/1.1" 200 20 "-" "DNSPod-Monitor/1.0"
66.249.66.84 - - [18/Sep/2013:06:50:28 +0000] "GET /page/6/ HTTP/1.1" 200 27777 "-" "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
221.130.41.168 - - [18/Sep/2013:06:50:37 +0000] "GET /feed/ HTTP/1.1" 304 0 "-" "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.66 Safari/537.36"
157.55.35.40 - - [18/Sep/2013:06:51:13 +0000] "GET /robots.txt HTTP/1.1" 200 150 "-" "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)"
50.116.27.194 - - [18/Sep/2013:06:51:35 +0000] "POST /wp-cron.php?doing_wp_cron=1379487095.2510800361633300781250 HTTP/1.0" 200 0 "-" "WordPress/3.6; http://blog.fens.me"
58.215.204.118 - - [18/Sep/2013:06:51:35 +0000] "GET /nodejs-socketio-chat/ HTTP/1.1" 200 10818 "http://www.google.com/url?sa=t&rct=j&q=nodejs%20%E5%BC%82%E6%AD%A5%E5%B9%BF%E6%92%AD&source=web&cd=1&cad=rja&ved=0CCgQFjAA&url=%68%74%74%70%3a%2f%2f%62%6c%6f%67%2e%66%65%6e%73%2e%6d%65%2f%6e%6f%64%65%6a%73%2d%73%6f%63%6b%65%74%69%6f%2d%63%68%61%74%2f&ei=rko5UrylAefOiAe7_IGQBw&usg=AFQjCNG6YWoZsJ_bSj8kTnMHcH51hYQkAA&bvm=bv.52288139,d.aGc" "Mozilla/5.0 (Windows NT 5.1; rv:23.0) Gecko/20100101 Firefox/23.0"
58.215.204.118 - - [18/Sep/2013:06:51:36 +0000] "GET /wp-includes/js/jquery/jquery-migrate.min.js?ver=1.2.1 HTTP/1.1" 304 0 "http://blog.fens.me/nodejs-socketio-chat/" "Mozilla/5.0 (Windows NT 5.1; rv:23.0) Gecko/20100101 Firefox/23.0"
58.215.204.118 - - [18/Sep/2013:06:51:35 +0000] "GET /wp-includes/js/jquery/jquery.js?ver=1.10.2 HTTP/1.1" 304 0 "http://blog.fens.me/nodejs-socketio-chat/" "Mozilla/5.0 (Windows NT 5.1; rv:23.0) Gecko/20100101 Firefox/23.0"
58.215.204.118 - - [18/Sep/2013:06:51:36 +0000] "GET /wp-includes/js/comment-reply.min.js?ver=3.6 HTTP/1.1" 304 0 "http://blog.fens.me/nodejs-socketio-chat/" "Mozilla/5.0 (Windows NT 5.1; rv:23.0) Gecko/20100101 Firefox/23.0"
58.215.204.118 - - [18/Sep/2013:06:51:36 +0000] "GET /wp-content/uploads/2013/08/chat.png HTTP/1.1" 200 48968 "http://blog.fens.me/nodejs-socketio-chat/" "Mozilla/5.0 (Windows NT 5.1; rv:23.0) Gecko/20100101 Firefox/23.0"
58.215.204.118 - - [18/Sep/2013:06:51:36 +0000] "GET /wp-content/uploads/2013/08/chat2.png HTTP/1.1" 200 59852 "http://blog.fens.me/nodejs-socketio-chat/" "Mozilla/5.0 (Windows NT 5.1; rv:23.0) Gecko/20100101 Firefox/23.0"
58.215.204.118 - - [18/Sep/2013:06:51:37 +0000] "GET /wp-content/uploads/2013/08/socketio.png HTTP/1.1" 200 80493 "http://blog.fens.me/nodejs-socketio-chat/" "Mozilla/5.0 (Windows NT 5.1; rv:23.0) Gecko/20100101 Firefox/23.0"
58.248.178.212 - - [18/Sep/2013:06:51:37 +0000] "GET /nodejs-grunt-intro/ HTTP/1.1" 200 51770 "http://blog.fens.me/series-nodejs/" "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 5.1; Trident/4.0; .NET CLR 1.1.4322; .NET CLR 2.0.50727; .NET CLR 3.0.04506.30; .NET CLR 3.0.4506.2152; .NET CLR 3.5.30729; MDDR; InfoPath.2; .NET4.0C)"
58.248.178.212 - - [18/Sep/2013:06:51:40 +0000] "GET /wp-includes/js/jquery/jquery-migrate.min.js?ver=1.2.1 HTTP/1.1" 200 7200 "http://blog.fens.me/nodejs-grunt-intro/" "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 5.1; Trident/4.0; .NET CLR 1.1.4322; .NET CLR 2.0.50727; .NET CLR 3.0.04506.30; .NET CLR 3.0.4506.2152; .NET CLR 3.5.30729; MDDR; InfoPath.2; .NET4.0C)"
58.248.178.212 - - [18/Sep/2013:06:51:40 +0000] "GET /wp-includes/js/comment-reply.min.js?ver=3.6 HTTP/1.1" 200 786 "http://blog.fens.me/nodejs-grunt-intro/" "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 5.1; Trident/4.0; .NET CLR 1.1.4322; .NET CLR 2.0.50727; .NET CLR 3.0.04506.30; .NET CLR 3.0.4506.2152; .NET CLR 3.5.30729; MDDR; InfoPath.2; .NET4.0C)"
58.248.178.212 - - [18/Sep/2013:06:51:40 +0000] "GET /wp-includes/js/jquery/jquery.js?ver=1.10.2 HTTP/1.1" 200 45307 "http://blog.fens.me/nodejs-grunt-intro/" "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 5.1; Trident/4.0; .NET CLR 1.1.4322; .NET CLR 2.0.50727; .NET CLR 3.0.04506.30; .NET CLR 3.0.4506.2152; .NET CLR 3.5.30729; MDDR; InfoPath.2; .NET4.0C)"
58.248.178.212 - - [18/Sep/2013:06:51:40 +0000] "GET /wp-includes/js/jquery/jquery.js?ver=1.10.2 HTTP/1.1" 200 93128 "http://blog.fens.me/nodejs-grunt-intro/" "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 5.1; Trident/4.0; .NET CLR 1.1.4322; .NET CLR 2.0.50727; .NET CLR 3.0.04506.30; .NET CLR 3.0.4506.2152; .NET CLR 3.5.30729; MDDR; InfoPath.2; .NET4.0C)"
58.248.178.212 - - [18/Sep/2013:06:51:40 +0000] "GET /wp-includes/js/comment-reply.min.js?ver=3.6 HTTP/1.1" 200 786 "http://blog.fens.me/nodejs-grunt-intro/" "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 5.1; Trident/4.0; .NET CLR 1.1.4322; .NET CLR 2.0.50727; .NET CLR 3.0.04506.30; .NET CLR 3.0.4506.2152; .NET CLR 3.5.30729; MDDR; InfoPath.2; .NET4.0C)"
58.215.204.118 - - [18/Sep/2013:06:51:41 +0000] "-" 400 0 "-" "-"
58.215.204.118 - - [18/Sep/2013:06:51:41 +0000] "-" 400 0 "-" "-"
58.215.204.118 - - [18/Sep/2013:06:51:41 +0000] "-" 400 0 "-" "-"
157.55.35.40 - - [18/Sep/2013:06:51:43 +0000] "GET /rhadoop-java-basic/ HTTP/1.1" 200 26780 "-" "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)"
58.248.178.212 - - [18/Sep/2013:06:51:43 +0000] "GET /wp-includes/js/jquery/jquery-migrate.min.js?ver=1.2.1 HTTP/1.1" 200 7200 "http://blog.fens.me/nodejs-grunt-intro/" "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 5.1; Trident/4.0; .NET CLR 1.1.4322; .NET CLR 2.0.50727; .NET CLR 3.0.04506.30; .NET CLR 3.0.4506.2152; .NET CLR 3.5.30729; MDDR; InfoPath.2; .NET4.0C)"
58.248.178.212 - - [18/Sep/2013:06:51:45 +0000] "GET /wp-content/uploads/2013/08/grunt.png HTTP/1.1" 200 199040 "http://blog.fens.me/nodejs-grunt-intro/" "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 5.1; Trident/4.0; .NET CLR 1.1.4322; .NET CLR 2.0.50727; .NET CLR 3.0.04506.30; .NET CLR 3.0.4506.2152; .NET CLR 3.5.30729; MDDR; InfoPath.2; .NET4.0C)"
58.215.204.118 - - [18/Sep/2013:06:52:26 +0000] "GET /nodejs-async/ HTTP/1.1" 200 12647 "http://blog.fens.me/nodejs-socketio-chat/" "Mozilla/5.0 (Windows NT 5.1; rv:23.0) Gecko/20100101 Firefox/23.0"
58.215.204.118 - - [18/Sep/2013:06:52:27 +0000] "GET /wp-includes/js/jquery/jquery.js?ver=1.10.2 HTTP/1.1" 304 0 "http://blog.fens.me/nodejs-async/" "Mozilla/5.0 (Windows NT 5.1; rv:23.0) Gecko/20100101 Firefox/23.0"
58.215.204.118 - - [18/Sep/2013:06:52:27 +0000] "GET /wp-includes/js/jquery/jquery-migrate.min.js?ver=1.2.1 HTTP/1.1" 304 0 "http://blog.fens.me/nodejs-async/" "Mozilla/5.0 (Windows NT 5.1; rv:23.0) Gecko/20100101 Firefox/23.0"
58.215.204.118 - - [18/Sep/2013:06:52:27 +0000] "GET /wp-includes/js/comment-reply.min.js?ver=3.6 HTTP/1.1" 304 0 "http://blog.fens.me/nodejs-async/" "Mozilla/5.0 (Windows NT 5.1; rv:23.0) Gecko/20100101 Firefox/23.0"
163.177.71.12 - - [18/Sep/2013:06:52:29 +0000] "HEAD / HTTP/1.1" 200 20 "-" "DNSPod-Monitor/1.0"
```

2）期望输出数据

每行字段长度都大于11。

## 3. 需求分析

需要在Map阶段对输入的数据根据规则进行过滤清洗。

## 4. 实现代码

1）编写WebLogMapper类

```java
import java.io.IOException;
import org.apache.hadoop.io.LongWritable;
import org.apache.hadoop.io.NullWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Mapper;
public class WebLogMapper extends Mapper<LongWritable, Text, Text, NullWritable>{
	@Override
	protected void map(LongWritable key, Text value, Context context) throws IOException, InterruptedException {
		// 1 获取1行数据
		String line = value.toString();
		// 2 解析日志
		boolean result = parseLog(line,context);
		// 3 日志不合法退出
		if (!result) {
			return;
		}
		// 4 日志合法就直接写出
		context.write(value, NullWritable.get());
	}
	// 2 封装解析日志的方法
	private boolean parseLog(String line, Context context) {
		// 1 截取
		String[] fields = line.split(" ");
		// 2 日志长度大于11的为合法
		if (fields.length > 11) {
			return true;
		}else {
			return false;
		}
	}
}
```

2）编写WebLogDriver类

```java
import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.NullWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Job;
import org.apache.hadoop.mapreduce.lib.input.FileInputFormat;
import org.apache.hadoop.mapreduce.lib.output.FileOutputFormat;
public class WebLogDriver {
	public static void main(String[] args) throws Exception {
// 输入输出路径需要根据自己电脑上实际的输入输出路径设置
        args = new String[] { "D:/input/inputlog", "D:/output1" };
		// 1 获取job信息
		Configuration conf = new Configuration();
		Job job = Job.getInstance(conf);
		// 2 加载jar包
		job.setJarByClass(LogDriver.class);
		// 3 关联map
		job.setMapperClass(WebLogMapper.class);
		// 4 设置最终输出类型
		job.setOutputKeyClass(Text.class);
		job.setOutputValueClass(NullWritable.class);
		// 设置reducetask个数为0
		job.setNumReduceTasks(0);
		// 5 设置输入和输出路径
		FileInputFormat.setInputPaths(job, new Path(args[0]));
		FileOutputFormat.setOutputPath(job, new Path(args[1]));
		// 6 提交
         boolean b = job.waitForCompletion(true);
         System.exit(b ? 0 : 1);
	}
}
```
