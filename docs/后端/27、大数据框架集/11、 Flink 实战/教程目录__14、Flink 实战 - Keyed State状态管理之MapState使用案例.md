# 14、Flink 实战 - Keyed State状态管理之MapState使用案例
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/6/14.html
- 分类：大数据框架
- 分组：教程目录
## 一、MapState的方法

MapState的方法和Java的Map的方法极为相似，所以上手相对容易。

常用的有如下：

- get()方法获取值
- put()，putAll()方法更新值
- remove()删除某个key
- contains()判断是否存在某个key
- isEmpty() 判断是否为空

## 二、定义MapStateDescriptor和获取MapState

```java
MapStateDescriptor<String, Integer> diffCountDescriptor = new MapStateDescriptor<String, Integer>(
        "diff-count-map",//state的id
        String.class,//key的类型
        Integer.class);//value的类型
diffCountMap = getRuntimeContext().getMapState(diffCountDescriptor);
```

## 三、统计温度升高/降低超过阈值的次数

程序主题和上一篇博客[Keyed State状态之ValueState](/zhuanlan/bigdata/flink/6/13.html)一样

```java
public static class MyKeyedProcessFunction extends KeyedProcessFunction<String, SensorRecord, Tuple3<String, Integer, Integer>> {
    private int tempDiff;
    public MyKeyedProcessFunction(int tempDiff) {
        this.tempDiff = tempDiff;
    }
    //上次温度
    private transient ValueState<Double> lastTemp;
    //温度升高/降低超过预警值的次数
    private transient MapState<String, Integer> diffCountMap;
    private String upKey = "upKey";
    private String downKey = "downKey";
    @Override
    public void open(Configuration parameters) throws Exception {
        super.open(parameters);
        ValueStateDescriptor<Double> lastTempDescriptor = new ValueStateDescriptor<Double>(
                "last-temp",
                Double.class);
        lastTemp = getRuntimeContext().getState(lastTempDescriptor);
        MapStateDescriptor<String, Integer> diffCountDescriptor = new MapStateDescriptor<String, Integer>(
                "diff-count-map",
                String.class,
                Integer.class);
        diffCountMap = getRuntimeContext().getMapState(diffCountDescriptor);
    }
    @Override
    public void processElement(SensorRecord value, Context ctx, Collector<Tuple3<String, Integer, Integer>> out) throws Exception {
        //第一条数据，需要处理
        if (lastTemp.value() == null) {
            lastTemp.update(Double.MIN_VALUE);
            if (!diffCountMap.contains(upKey)){
                diffCountMap.put(upKey, 0);
            }
            if (!diffCountMap.contains(downKey)){
                diffCountMap.put(downKey, 0);
            }
        }
        else {
            boolean needOut = false;
            //温度升高超过阈值
            if (value.getRecord() - lastTemp.value() > tempDiff){
                diffCountMap.put(upKey, diffCountMap.get(upKey) + 1);
                needOut = true;
            }
            //温度降低超过阈值
            else if (lastTemp.value() - value.getRecord() > tempDiff) {
                diffCountMap.put(downKey, diffCountMap.get(downKey) + 1);
                needOut = true;
            }
            if (needOut && !diffCountMap.isEmpty()){
                out.collect(Tuple3.of(value.getId(), diffCountMap.get(upKey), diffCountMap.get(downKey)));
            }
        }
        if (value.getRecord() != null) {
            lastTemp.update(value.getRecord());
        }
    }
}
```
