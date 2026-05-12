# 04、FlinkSQL - 特别篇，Influxdb Java客户端访问指标数据
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/3/4.html
- 分类：大数据框架
- 分组：教程目录
## Influxdb Java客户端

Influxdb 的Docker版本目前最高是1.8.3. 官方最高版本是2.0.

> Note: We recommend using the new client libraries on this page to leverage the new read (via Flux) and write APIs and prepare for conversion to InfluxDB 2.0 and InfluxDB Cloud 2.0. For more information, see InfluxDB 2.0 API compatibility endpoints. Client libraries for InfluxDB 1.7 and earlier may continue to work, but are not maintained by InfluxData.

> 官方推荐使用本页新读（Flux）和写API来访问Influx 2.0

查看官方文档发现，客户端有：

[influx-client-java](https://github.com/influxdata/influxdb-client-java)

## 与时俱进

```java
<dependency>
    <groupId>com.influxdb</groupId>
    <artifactId>influxdb-client-java</artifactId>
    <version>1.12.0</version>
</dependency>
```

## 创建连接

```java
 InfluxDBClient influxDBClient = InfluxDBClientFactory.create("http://localhost:8086", token);
        //
        // Create bucket "iot_bucket" with data retention set to 3,600 seconds
        //
        BucketRetentionRules retention = new BucketRetentionRules();
        retention.setEverySeconds(3600);
        Bucket bucket = influxDBClient.getBucketsApi().createBucket("iot-bucket", retention, "12bdc4164c2e8141");
```

## 1.8版本如何访问

> Query data in InfluxDB 1.8.0+ using the InfluxDB 2.0 API and Flux (endpoint should be enabled by flux-enabled option)

虽然InfluxDB 2.0 API兼容 influxdb 1.8.0，但是应该开启 flux

```java
[http]
  enabled = true
  bind-address = ":8086"
  auth-enabled = true
  log-enabled = true
  suppress-write-log = false
  write-tracing = false
  flux-enabled = true //重点在这
```

## Flux 是什么，FluxQL是什么？

> Flux是InfluxQL和其他类似SQL的查询语言的替代品，用于查询和分析数据。Flux使用功能语言模式，使其功能强大，灵活，并能够克服InfluxQL的许多限制。

看样子官方是更加推荐使用 Flux语法

## Flux语法

[开启Flux](https://docs.influxdata.com/influxdb/v1.8/flux/installation/)

例子：（bucket是InfluxDb2.0提出的概念，Influxdb1.x没有）

```java
data = from(bucket: "db/rp")
  |> range(start: -1h)
  |> filter(fn: (r) =>
    r._measurement == "example-measurement" and
    r._field == "example-field"
  )
```

## Flux1.8和2.0

[Key-Concepts](https://docs.influxdata.com/influxdb/v2.0/reference/key-concepts/data-elements/#bucket)

从这篇文章可以看到 2.0 是把Database和RententionPolicies合并为Bucket。因此Flink指标收集的位置是 flink/flink。

另外Organization是什么？

> InfluxDB组织是一组用户的工作空间。所有仪表板，任务，存储桶和用户均属于组织。有关组织的更多信息，请参阅管理组织。
>
> InfluxDb 1.8没有Organization的概念。通过下方的例子，可以看到1.8版本的org=-。

## 访问Influxdb 1.8

```java
public class InfluxDB18Example {
    public static void main(final String[] args) {
        String database = "telegraf";
        String retentionPolicy = "autogen";
        InfluxDBClient client = InfluxDBClientFactory.createV1("http://localhost:8086",
                "username",
                "password".toCharArray(),
                database,
                retentionPolicy);
        System.out.println("*** Write Points ***");
        try (WriteApi writeApi = client.getWriteApi()) {
            Point point = Point.measurement("mem")
                    .addTag("host", "host1")
                    .addField("used_percent", 29.43234543);
            System.out.println(point.toLineProtocol());
            writeApi.writePoint(point);
        }
        System.out.println("*** Query Points ***");
        String query = String.format("from(bucket: \"%s/%s\") |> range(start: -1h)", database, retentionPolicy);
        List<FluxTable> tables = client.getQueryApi().query(query);
        tables.get(0).getRecords()
                .forEach(record -> System.out.println(String.format("%s %s: %s %s",
                        record.getTime(), record.getMeasurement(), record.getField(), record.getValue())));
        client.close();
    }
}
```

## 访问Flink Checkpoint的路径指标数据

```java
  public static List<JobLastCheckpointExternalPath> getCheckPoints(String jobId) {
    InfluxDbConfig config = new InfluxDbConfig();
    config.setHost("http://10.11.159.156:8099");
    config.setDatabase("flink");
    config.setPassword("flink");
    config.setUsername("flink");
    config.setRetentionPolicy("one_hour");
    String database = config.getDatabase();
    String retentionPolicy = config.getRetentionPolicy();
    InfluxDBClient client = InfluxDBClientFactory.createV1(config.getHost(),
        config.getUsername(),
        config.getPassword().toCharArray(),
        database,
        retentionPolicy);
    client.setLogLevel(LogLevel.BASIC);
    QueryApi queryApi = client.getQueryApi();
    String query = String.format("from(bucket: \"%s/%s\") |> range(start: -30m) |> filter(fn: (r) =>\n" +
        "    r._measurement == \"jobmanager_job_lastCheckpointExternalPath\" and\n" +
        "    r.job_id == \"%s\"\n" +
        "  ) |> sort(columns: [\"_time\"], desc: true) |> limit(n:100)", database, retentionPolicy, jobId);
    //
    // Query data
    //
    List<JobLastCheckpointExternalPath> tables = queryApi.query(query, JobLastCheckpointExternalPath.class);
    client.close();
    return tables;
  }
  @Measurement(name = "jobmanager_job_lastCheckpointExternalPath")
  public static
  class JobLastCheckpointExternalPath {
    @Column(timestamp = true)
    Instant time;
    @Column(name = "job_name")
    String jobName;
    @Column(name = "job_id")
    String jobId;
    @Column(name = "value")
    String value;
    @Override
    public String toString() {
      return "JobLastCheckpointExternalPath{" +
          "time=" + time +
          ", jobName='" + jobName + '\'' +
          ", jobId='" + jobId + '\'' +
          ", value='" + value + '\'' +
          '}';
    }
  }
```

## 更新(Flux语法)

```java
fields = ["3361e97159f5d473f273b38a96e7ba06"]  
from(bucket: "flink/one_hour") |> range(start: -1h)
|> filter(fn: (r) => r._measurement == "jobmanager_job_lastCheckpointExternalPath" and contains(value: r.job_id, set: fields) 
and r["_value"] != "n/a"
)
|> keep(columns: ["_time", "_value", "job_id", "job_name"])
|> limit(n:1000)
|> sort(columns: ["_time"], desc: true)
```

> 注意：经过实际使用发现 sort 写在limit 前面会导致实际排序不可靠。（就连官方文档都是sort在limit前面）
>
> sort() and limit()

## SQL的in 查询 对应 contains

```java
contains(value: r.job_id, set: fields) 
```

## SQL的select projection 对应keep

```java
keep(columns: ["_time", "_value", "job_id", "job_name"])
```
