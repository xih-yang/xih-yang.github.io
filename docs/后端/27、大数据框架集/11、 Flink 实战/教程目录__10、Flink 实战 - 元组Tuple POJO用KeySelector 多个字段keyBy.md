# 10、Flink 实战 - 元组Tuple POJO用KeySelector 多个字段keyBy
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/6/10.html
- 分类：大数据框架
- 分组：教程目录
## 一、元组

假设有个流

```java
DataStream<Tuple2<String, Integer>> wordAndOne = ....
```

### 1. 单个字段keyBy

```java
用字段位置
wordAndOne.keyBy(0)
用字段表达式
wordAndOne.keyBy(v -> v.f0)
```

### 2. 多个字段keyBy

```java
用字段位置
wordAndOne.keyBy(0, 1)
用KeySelector
wordAndOne.keyBy(new KeySelector<Tuple2<String, Integer>, Tuple2<String, Integer>>() {
    @Override
    public Tuple2<String, Integer> getKey(Tuple2<String, Integer> value) throws Exception {
        return Tuple2.of(value.f0, value.f1);
    }
});
```

上述可用lambda简化

```java
wordAndOne.keyBy(
        (KeySelector<Tuple2<String, Integer>, Tuple2<String, Integer>>) value -> 
                Tuple2.of(value.f0, value.f1)
);
```

## 二、POJO

假设有个流

```java
DataStream<PeopleCount> source = ...
```

PeopleCount的类定义是

```java
public class PeopleCount {
    private String province;
    private String city;
    private Integer counts;
    public PeopleCount() {
    }
	省略其他代码。。。
}
```

### 1. 单个字段keyBy

```java
source.keyBy(a -> a.getProvince())
source.keyBy(PeopleCount::getProvince)
```

### 2. 多个字段keyBy

```java
source.keyBy(new KeySelector<PeopleCount, Tuple2<String, String>>() {
    @Override
    public Tuple2<String, String> getKey(PeopleCount value) throws Exception {
        return Tuple2.of(value.getProvince(), value.getCity());
    }
});
```

上述可用lambda简化

```java
map.keyBy(
        (KeySelector<PeopleCount, Tuple2<String, String>>) value -> 
                Tuple2.of(value.getProvince(), value.getCity())
);
```
