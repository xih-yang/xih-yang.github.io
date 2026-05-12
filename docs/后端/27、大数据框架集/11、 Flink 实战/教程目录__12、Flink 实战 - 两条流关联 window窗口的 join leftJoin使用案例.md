# 12、Flink 实战 - 两条流关联 window窗口的 join leftJoin使用案例
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/6/12.html
- 分类：大数据框架
- 分组：教程目录
## 一、温度数据和实体类

### 1. 温度数据

第一个是id，第二个温度，第三个是事件事件

```java
1,20.5,2021-01-29 16:00:00
1,21.5,2021-01-29 16:00:10
1,22.5,2021-01-29 16:00:20
1,24.5,2021-01-29 16:00:30
1,23.5,2021-01-29 16:00:40
1,22.5,2021-01-29 16:00:50
1,41.5,2021-01-29 16:01:00
```

### 2. 实体类

```java
public class SensorRecord {
    private String id;
    private Double record;
    private LocalDateTime time;
	//省略其它
}
```

### 3. 将字符串映射成SensorRecord对象

```java
public class SensorRecordUtils {
    /**
     * 将字符串映射成SensorRecord对象
     */
    public static class BeanMap implements MapFunction<String, SensorRecord> {
        @Override
        public SensorRecord map(String s) throws Exception {
            if (StringUtils.isNotBlank(s)) {
                String[] split = s.split(",");
                if (split != null && split.length == 3) {
                    return new SensorRecord(
                            split[0],
                            Double.valueOf(split[1]),
                            LocalDateTime.parse(split[2], FormatterConstant.commonDtf));
                }
            }
            return null;
        }
    }
}
```

## 二、window join

### 1. 获取2条数据流

```java
public class Test11_WindowJoin {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
		//左流
        DataStreamSource<String> leftSource = env.socketTextStream(BaseConstant.URL, 9901);
        //右流
		DataStreamSource<String> rightSource = env.socketTextStream(BaseConstant.URL, 9902);
		//设置事件事件字段和水位线
        WatermarkStrategy<SensorRecord> strategy = WatermarkStrategy.<SensorRecord>forBoundedOutOfOrderness(Duration.ofSeconds(1))
                .withTimestampAssigner(new SerializableTimestampAssigner<SensorRecord>() {
                    @Override
                    public long extractTimestamp(SensorRecord element, long recordTimestamp) {
                        return element.getTimeEpochMilli();
                    }
                });
        DataStream<SensorRecord> leftStream = leftSource
                .map(new SensorRecordUtils.BeanMap())
                .filter(a -> a != null)
                .assignTimestampsAndWatermarks(strategy);
        DataStream<SensorRecord> rightStream = rightSource
                .map(new SensorRecordUtils.BeanMap())
                .filter(a -> a != null)
                .assignTimestampsAndWatermarks(strategy);
     }
}
```

### 2. join的代码

```java
DataStream<SensorRecordJoin> result = leftStream
        .join(rightStream)
        .where(new MyKeySelector())
        .equalTo(new MyKeySelector())
        .window(TumblingEventTimeWindows.of(Time.seconds(30)))
        .apply(new MyJoinFunction());
```

### 3. KeySelector

```java
    public static class MyKeySelector implements KeySelector<SensorRecord, String> {
        @Override
        public String getKey(SensorRecord value) throws Exception {
            return value.getId();
        }
    }
```

### 4. 设置join后的结果对象

```java
public static class MyJoinFunction implements JoinFunction<SensorRecord, SensorRecord, SensorRecordJoin> {
    @Override
    public SensorRecordJoin join(SensorRecord first, SensorRecord second) throws Exception {
       return new SensorRecordJoin(first, second);
    }
}
```

## 三、window left join

### 1. left join主体代码

```java
DataStream<SensorRecordJoin> result = leftStream.coGroup(rightStream)
         .where(new MyKeySelector())
         .equalTo(new MyKeySelector())
         .window(TumblingEventTimeWindows.of(Time.seconds(30)))
         .apply(new MyCoGroupFunction() {
         });
```

### 2. MyCoGroupFunction

```java
public static class MyCoGroupFunction implements CoGroupFunction<SensorRecord, SensorRecord, SensorRecordJoin> {
       //窗口满足条件就会调用
       @Override
       public void coGroup(Iterable<SensorRecord> first, Iterable<SensorRecord> second, Collector<SensorRecordJoin> out) throws Exception {
           //当两个流窗口满足触发条件，就会调用coGroup方法
           boolean joined = false;
           for (SensorRecord firstLevel : first) {
               for (SensorRecord sensorRecord : second) {
                   joined = true;
                   out.collect(new SensorRecordJoin(firstLevel, sensorRecord));
               }
           }
           if (!joined) {
               for (SensorRecord firstLevel : first) {
                   out.collect(new SensorRecordJoin(firstLevel, new SensorRecord()));
               }
           }
       }
}
```
