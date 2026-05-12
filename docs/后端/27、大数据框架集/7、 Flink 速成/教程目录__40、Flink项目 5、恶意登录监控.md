# 40、Flink项目 5、恶意登录监控
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/2/40.html
- 分类：大数据框架
- 分组：教程目录
## 一、项目概述

**基本需求**

**1、** 用户在短时间内频繁登录失败，有程序恶意攻击的可能；

**2、** 同一用户（可以是不同IP）在2秒内连续两次登录失败，需要报警；

**解决思路**

**1、** 将用户的登录失败行为存入ListState，设定定时器2秒后触发，查看ListState中有几次失败登录；

**2、** 更加精确的检测，可以使用CEP库实现事件流的模式匹配；

## 二、代码

## 2.1 pom文件配置

pom文件配置如下:

```xml
<dependency>
      <groupId>org.apache.flink</groupId>
      <artifactId>flink-java</artifactId>
      <version>1.10.1</version>
      <scope>provided</scope>
    </dependency>
    <dependency>
      <groupId>org.apache.flink</groupId>
      <artifactId>flink-streaming-java_2.11</artifactId>
      <version>1.10.1</version>
      <scope>provided</scope>
    </dependency>
    <dependency>
      <groupId>org.apache.flink</groupId>
      <artifactId>flink-connector-kafka_2.11</artifactId>
      <version>1.10.1</version>
    </dependency>
    <dependency>
      <groupId>org.apache.flink</groupId>
      <artifactId>flink-core</artifactId>
      <version>1.10.1</version>
    </dependency>
    <dependency>
      <groupId>org.apache.flink</groupId>
      <artifactId>flink-clients_2.11</artifactId>
      <version>1.10.1</version>
    </dependency>
    <dependency>
      <groupId>org.apache.flink</groupId>
      <artifactId>flink-connector-redis_2.11</artifactId>
      <version>1.1.5</version>
    </dependency>
    <!-- https://mvnrepository.com/artifact/mysql/mysql-connector-java -->
    <dependency>
      <groupId>mysql</groupId>
      <artifactId>mysql-connector-java</artifactId>
      <version>8.0.19</version>
    </dependency>
    <dependency>
      <groupId>org.apache.flink</groupId>
      <artifactId>flink-statebackend-rocksdb_2.11</artifactId>
      <version>1.10.1</version>
    </dependency>
    <!-- Table API 和 Flink SQL -->
    <dependency>
      <groupId>org.apache.flink</groupId>
      <artifactId>flink-table-planner-blink_2.11</artifactId>
      <version>1.10.1</version>
    </dependency>
    <dependency>
      <groupId>org.apache.flink</groupId>
      <artifactId>flink-table-planner_2.11</artifactId>
      <version>1.10.1</version>
    </dependency>
    <dependency>
      <groupId>org.apache.flink</groupId>
      <artifactId>flink-table-api-java-bridge_2.11</artifactId>
      <version>1.10.1</version>
    </dependency>
    <dependency>
      <groupId>org.apache.flink</groupId>
      <artifactId>flink-streaming-scala_2.11</artifactId>
      <version>1.10.1</version>
    </dependency>
    <dependency>
      <groupId>org.apache.flink</groupId>
      <artifactId>flink-table-common</artifactId>
      <version>1.10.1</version>
    </dependency>
    <dependency>
      <groupId>org.apache.flink</groupId>
      <artifactId>flink-csv</artifactId>
      <version>1.10.1</version>
    </dependency>
    <dependency>
      <groupId>org.apache.flink</groupId>
      <artifactId>flink-cep_2.11</artifactId>
      <version>1.10.1</version>
    </dependency>
```

## 2.2 POJO类

LoginEvent

```java
    private Long userId;
    private String ip;
    private String loginState;
    private Long timestamp;
```

LoginFailWarning

```java
    private Long userId;
    private Long firstFailTime;
    private Long lastFailTime;
    private String warningMsg;
```

## 2.3 恶意登陆监控 - KeyedProcessFunction

**代码:**

```java
package com.zqs.flink.project.loginfail_detect;
/**
 * @remark 登陆失败监控
 */
import com.zqs.flink.project.loginfail_detect.beans.LoginFailWarning;
import com.zqs.flink.project.loginfail_detect.beans.LoginEvent;
import org.apache.flink.api.common.state.ListState;
import org.apache.flink.api.common.state.ListStateDescriptor;
import org.apache.flink.api.common.state.ValueState;
import org.apache.flink.api.common.state.ValueStateDescriptor;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.shaded.guava18.com.google.common.collect.Lists;
import org.apache.flink.streaming.api.TimeCharacteristic;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.KeyedProcessFunction;
import org.apache.flink.streaming.api.functions.timestamps.BoundedOutOfOrdernessTimestampExtractor;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.util.Collector;
import java.net.URL;
import java.util.ArrayList;
import java.util.Iterator;
public class LoginFail {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        env.setStreamTimeCharacteristic(TimeCharacteristic.EventTime);
        // 1. 从文件中读取
        URL resource = LoginFail.class.getResource("/LoginLog.csv");
        DataStream<LoginEvent> loginEventStream= env.readTextFile(resource.getPath())
                .map(line -> {
                    String[] fields = line.split(",");
                    return new LoginEvent(new Long(fields[0]), fields[1], fields[2], new Long(fields[3]));
                })
                .assignTimestampsAndWatermarks(new BoundedOutOfOrdernessTimestampExtractor<LoginEvent>(Time.seconds(3)) {
                    @Override
                    public long extractTimestamp(LoginEvent element) {
                        return element.getTimestamp()*1000L;
                    }
                });
        // 自定义处理函数检测连续登录失败事件
        SingleOutputStreamOperator<LoginFailWarning> warningStream = loginEventStream
                .keyBy(LoginEvent::getUserId)
                .process(new LoginFailDetectWarning(2));
        warningStream.print();
        env.execute("login fail detect job");
    }
    // 实现自定义KeyedProcessFunction
    public static class LoginFailDetectWarning0 extends KeyedProcessFunction<Long, LoginEvent, LoginFailWarning>{
        // 定义属性，最大连续登录失败次数
        private Integer maxFailTimes;
        public LoginFailDetectWarning0(Integer maxFailTimes) {
            this.maxFailTimes = maxFailTimes;
        }
        // 定义状态: 保存2秒内所有登陆失败事件
        ListState<LoginEvent> loginFailEventListState;
        // 定义状态: 保存注册的定时器时间戳
        ValueState<Long> timerTsState;
        @Override
        public void open(Configuration parameters) throws Exception {
            loginFailEventListState = getRuntimeContext().getListState(new ListStateDescriptor<LoginEvent>("login-fail-list", LoginEvent.class));
            timerTsState = getRuntimeContext().getState(new ValueStateDescriptor<Long>("timer-ts", Long.class));
        }
        @Override
        public void processElement(LoginEvent value, Context ctx, Collector<LoginFailWarning> out) throws Exception {
            // 判断当前登陆事件
            if ( "fail".equals(value.getLoginState()) ){
                // 1. 如果是失败事件, 添加到列表状态中
                loginFailEventListState.add(value);
                // 如果没有定时器,注册一个2秒之后的定时器
                if(timerTsState.value() == null ){
                    Long ts = (value.getTimestamp() + 2) * 1000L;
                    ctx.timerService().registerEventTimeTimer(ts);
                    timerTsState.update(ts);
                }
            } else {
                // 2. 如果是登陆成功, 删除定时器，清空状态，重新开始
                if( timerTsState.value() != null )
                    ctx.timerService().deleteEventTimeTimer(timerTsState.value());
                loginFailEventListState.clear();
                timerTsState.clear();
            }
        }
        @Override
        public void onTimer(long timestamp, OnTimerContext ctx, Collector<LoginFailWarning> out) throws Exception {
            // 定时器触发, 说明2秒内没有登陆成功来， 判断ListState中的失败个数
            ArrayList<LoginEvent> loginFailEvents = Lists.newArrayList(loginFailEventListState.get());
            Integer failTimes = loginFailEvents.size();
            if( failTimes >= maxFailTimes ){
                // 如果超出设定的最大失败次数，输出报警
                out.collect( new LoginFailWarning(ctx.getCurrentKey(),
                        loginFailEvents.get(0).getTimestamp(),
                        loginFailEvents.get(failTimes -1).getTimestamp(),
                        "login fail in 2s for " + failTimes + " times"
                        ));
            }
            // 清空状态
            loginFailEventListState.clear();
            timerTsState.clear();
        }
    }
    // 实现自定义KeyedProcessFunction
    public static class LoginFailDetectWarning extends KeyedProcessFunction<Long, LoginEvent, LoginFailWarning>{
        // 定义属性, 最大连续登陆失败次数
        private Integer maxFailTimes;
        public LoginFailDetectWarning(Integer maxFailTimes) {
            this.maxFailTimes = maxFailTimes;
        }
        // 定义状态:  保存2秒内所有的登陆失败事件
        ListState<LoginEvent> loginEventListState;
        @Override
        public void open(Configuration parameters) throws Exception {
            loginEventListState = getRuntimeContext().getListState(new ListStateDescriptor<LoginEvent>("login-fail-list", LoginEvent.class));
        }
        @Override
        public void processElement(LoginEvent value, Context ctx, Collector<LoginFailWarning> out) throws Exception {
            // 判断当前事件登陆状态
            if ( "fail".equals(value.getLoginState()) ){
                // 1. 如果是登陆失败, 获取状态中之前的登陆失败事件， 继续判断是否已有失败事件
                Iterator<LoginEvent> iterator = loginEventListState.get().iterator();
                if( iterator.hasNext() ){
                    // 1.1 如果已经有登陆失败事件, 继续判断是否已有失败事件
                    // 获取已有的登陆失败事件
                    LoginEvent firstFailEvent = iterator.next();
                    if (value.getTimestamp() - firstFailEvent.getTimestamp() <= 2){
                        // 1.1.1 如果2秒之内， 输出报警
                        out.collect( new LoginFailWarning(value.getUserId(), firstFailEvent.getTimestamp(), value.getTimestamp(), "login fail 2 times in 2s"));
                    }
                    // 不管报不报警， 这次都已处理完毕，直接更新状态
                    loginEventListState.clear();
                    loginEventListState.add(value);
                } else {
                    // 1.2 如果没有登陆失败，直接将当前事件存入ListState
                    loginEventListState.add(value);
                }
            } else {
                // 2. 如果是登陆成功，直接清空状态
                loginEventListState.clear();
            }
        }
    }
}
```

## 2.4 恶意登陆监控 - CEP

**代码:**

```java
package com.zqs.flink.project.loginfail_detect;
/**
 * @remark 登陆失败监控 - CEP
 */
import com.zqs.flink.project.loginfail_detect.beans.LoginEvent;
import com.zqs.flink.project.loginfail_detect.beans.LoginFailWarning;
import org.apache.flink.cep.CEP;
import org.apache.flink.cep.PatternSelectFunction;
import org.apache.flink.cep.PatternStream;
import org.apache.flink.cep.pattern.Pattern;
import org.apache.flink.cep.pattern.conditions.SimpleCondition;
import org.apache.flink.streaming.api.TimeCharacteristic;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.timestamps.BoundedOutOfOrdernessTimestampExtractor;
import org.apache.flink.streaming.api.windowing.time.Time;
import sun.rmi.runtime.Log;
import java.net.URL;
import java.util.List;
import java.util.Map;
public class LoginFailWithCep {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        env.setStreamTimeCharacteristic(TimeCharacteristic.EventTime);
        // 1. 从文件中读取数据
        URL resource = LoginFailWithCep.class.getResource("/LoginLog.csv");
        DataStream<LoginEvent> loginEventStream = env.readTextFile(resource.getPath())
                .map(line -> {
                    String[] fields = line.split(",");
                    return new LoginEvent(new Long(fields[0]), fields[1], fields[2], new Long(fields[3]));
                })
                .assignTimestampsAndWatermarks(new BoundedOutOfOrdernessTimestampExtractor<LoginEvent>(Time.seconds(3)) {
                    @Override
                    public long extractTimestamp(LoginEvent element) {
                        return element.getTimestamp() * 1000L;
                    }
                });
        // 1. 定义一个匹配模式
        // firstFail -> secondFail, within 2s
        Pattern<LoginEvent, LoginEvent> loginFailPattern0 = Pattern
                .<LoginEvent>begin("firstFail").where(new SimpleCondition<LoginEvent>() {
                    @Override
                    public boolean filter(LoginEvent value) throws Exception {
                        return "fail".equals(value.getLoginState());
                    }
                })
                .next("secondFail").where(new SimpleCondition<LoginEvent>() {
                    @Override
                    public boolean filter(LoginEvent value) throws Exception {
                        return "fail".equals(value.getLoginState());
                    }
                })
                .next("thirdFail").where(new SimpleCondition<LoginEvent>() {
                    @Override
                    public boolean filter(LoginEvent value) throws Exception {
                        return "fail".equals(value.getLoginState());
                    }
                })
                .within(Time.seconds(3));
        Pattern<LoginEvent, LoginEvent> loginFailPattern = Pattern
                .<LoginEvent>begin("failEvents").where(new SimpleCondition<LoginEvent>() {
                    @Override
                    public boolean filter(LoginEvent value) throws Exception {
                        return "fail".equals(value.getLoginState());
                    }
                }).times(3).consecutive()
                .within(Time.seconds(5));
        // 2. 将匹配模式应用到数据流上，得到一个pattern stream
        PatternStream<LoginEvent> patternStream = CEP.pattern(loginEventStream.keyBy(LoginEvent::getUserId), loginFailPattern);
        // 3. 检出符合匹配条件的复杂事件，进行转换处理，得到报警信息
        SingleOutputStreamOperator<LoginFailWarning> warningStream = patternStream.select(new LoginFailMatchDetectWarning());
        warningStream.print();
        env.execute("login fail detect with cep job");
    }
    // 实现自定义的PatternSelectFunction
    public static class LoginFailMatchDetectWarning implements PatternSelectFunction<LoginEvent, LoginFailWarning>{
        @Override
        public LoginFailWarning select(Map<String, List<LoginEvent>> pattern) throws Exception {
            LoginEvent firstFailEvent = pattern.get("failEvents").get(0);
            LoginEvent lastFailEvent = pattern.get("failEvents").get(pattern.get("failEvents").size() - 1);
            return new LoginFailWarning(firstFailEvent.getUserId(), firstFailEvent.getTimestamp(), lastFailEvent.getTimestamp(), "login fail " + pattern.get("failEvents").size() + " times");
        }
    }
}
```

**测试记录:**
