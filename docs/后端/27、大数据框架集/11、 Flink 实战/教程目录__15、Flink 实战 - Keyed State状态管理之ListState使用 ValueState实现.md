# 15、Flink 实战 - Keyed State状态管理之ListState使用 ValueState实现
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/6/15.html
- 分类：大数据框架
- 分组：教程目录
## 一、ListState的方法

- get()方法获取值
- add(IN value)，addAll(List values)方法更新值
- update(List values) 用新List 替换 原来的List
- clear() 清空List，List还存在，但是没有元素

## 二、代码案例

### 1. 需求

记录每个人的历史操作信息，例如输入

```java
1,login
1,buy something
1,logout
2,login
2,click book
1,login
```

要输出

```java
(1,[login])
(1,[login, buy something])
(1,[login, buy something, logout])
(2,[login])
(2,[login, click book])
(1,[login, buy something, logout, login])
```

### 2. 主体

```java
public class Test03_ListState {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        DataStreamSource<String> source = env.socketTextStream(BaseConstant.URL, BaseConstant.PORT);
        SingleOutputStreamOperator<Tuple2<String, String>> dataStream = source
                .map(new MapFunction<String, Tuple2<String, String>>() {
                    @Override
                    public Tuple2<String, String> map(String value) throws Exception {
                        String[] split = value.split(",");
                        if (split != null && split.length == 2) {
                            return Tuple2.of(split[0], split[1]);
                        }
                        return null;
                    }
                });
        dataStream
                .keyBy(t -> t.f0)
                .process(new MyKeyedProcessFunction())
                .print();
        env.execute();
    }
}
```

### 3. 处理方法

```java
public static class MyKeyedProcessFunction extends KeyedProcessFunction<String, Tuple2<String, String>, Tuple2<String, List<String>>> {
    //之前的操作记录
    private transient ListState<String> listState;
    @Override
    public void open(Configuration parameters) throws Exception {
        super.open(parameters);
        ListStateDescriptor<String> recentOperatorsDescriptor = new ListStateDescriptor<String>(
                "recent-operator",
                String.class);
        listState = getRuntimeContext().getListState(recentOperatorsDescriptor);
    }
    @Override
    public void processElement(Tuple2<String, String> value, Context ctx, Collector<Tuple2<String, List<String>>> out) throws Exception {
        String action = value.f1;
        listState.add(action);
        Iterable<String> iterable = listState.get();
        ArrayList<String> events = new ArrayList<>();
        for (String actionName : iterable) {
            events.add(actionName);
        }
        out.collect(Tuple2.of(value.f0, events));
        listState.update(events);
    }
}
```

### 4. 运行结果

### 5. 用ValueState实现ListState

用ValueState实现ListState可以实现ListState，只要ValueState里装的是List

```java
public static class MyKeyedProcessFunction extends KeyedProcessFunction<String, Tuple2<String, String>, Tuple2<String, List<String>>> {
    //之前的操作记录
    private transient ValueState<List<String>> listState;
    @Override
    public void open(Configuration parameters) throws Exception {
        super.open(parameters);
        ValueStateDescriptor<List<String>> recentOperatorsDescriptor = new ValueStateDescriptor<List<String>>(
                "recent-operator",
                TypeInformation.of(new TypeHint<List<String>>(){
     }));
        listState = getRuntimeContext().getState(recentOperatorsDescriptor);
    }
    @Override
    public void processElement(Tuple2<String, String> value, Context ctx, Collector<Tuple2<String, List<String>>> out) throws Exception {
        String action = value.f1;
        List<String> lst = listState.value();
        if (lst == null){
            lst = new ArrayList<>();
        }
        lst.add(action);
        listState.update(lst);
        out.collect(Tuple2.of(value.f0, listState.value()));
    }
}
```
