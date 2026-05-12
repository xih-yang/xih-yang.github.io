# 18、RocketMQ 实战 - 消息过滤
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/6/18.html
- 分类：消息队列
- 分组：教程目录
消息过滤的含义指的是将符合条件的消息投递给消费者，而不是将匹配到的消息过滤掉。

Apache RocketMQ 的消息过滤功能通过生产者和消费者对消息的属性、标签进行定义，并在 Apache RocketMQ 服务端根据过滤条件进行筛选匹配，将符合条件的消息投递给消费者进行消费。

Apache RocketMQ 支持Tag标签过滤和SQL属性过滤，这两种过滤方式对比如下：

对比项
Tag标签过滤
SQL属性过滤

过滤目标
消息的Tag标签。
消息的属性，包括用户自定义属性以及系统属性（Tag是一种系统属性）。

过滤能力
精准匹配。
SQL语法匹配。

适用场景
简单过滤场景、计算逻辑简单轻量。
复杂过滤场景、计算逻辑较复杂。

### Tag标签过滤

Tag标签过滤是生产者在发送时设置tag标签，消费者订阅时配置想要的tag。Tag标签过滤为精准字符串匹配，过滤规则设置格式如下：

- 单Tag匹配：过滤表达式为目标Tag。表示只有消息标签为指定目标Tag的消息符合匹配条件，会被发送给消费者。
- 多Tag匹配：多个Tag之间为或的关系，不同Tag间使用两个竖线（||）隔开。例如，Tag1||Tag2||Tag3，表示标签为Tag1或Tag2或Tag3的消息都满足匹配条件，都会被发送给消费者进行消费。
- 全部匹配：使用星号（*）作为全匹配表达式。表示主题下的所有消息都将被发送给消费者进行消费。

发送消息时设置tag：

```java
private final static String[] tags = {"tagA","tagB","tagC"};
 Message message = provider.newMessageBuilder()
                .setTopic("testTopic")
                // 设置消息索引键，可根据关键字精确查找某条消息。
                .setKeys("messageKey")
                // 设置消息Tag，用于消费端根据指定Tag过滤消息。
                .setTag(tags[i % tags.length])
                // 消息体。
                .setBody(("messageBody" + LocalDate.now().format(formatter) +"，下标：" + i).getBytes())
                .build();
```

订阅时配置1个tag：

```java
 String tag = "tagA";
 FilterExpression filterExpression = new FilterExpression(tag, FilterExpressionType.TAG);
 pushConsumer.subscribe(topic, filterExpression);
```

发送10条消息，查看消费者：

只有下标为0，3，6，9的消息才会被消费。

订阅时配置多个tag：

```java
   String tag = "tagA||tagB";
   FilterExpression filterExpression = new FilterExpression(tag, FilterExpressionType.TAG);
   pushConsumer.subscribe(topic, filterExpression);
```

订阅时匹配所有的消息：

```java
 String tag = "*";
 FilterExpression filterExpression = new FilterExpression(tag, FilterExpressionType.TAG);
 pushConsumer.subscribe(topic, filterExpression);
```

### SQL属性过滤

SQL属性过滤是 Apache RocketMQ 提供的高级消息过滤方式，通过生产者为消息设置的属性（Key）及属性值（Value）进行匹配。生产者在发送消息时可设置多个属性，消费者订阅时可设置SQL语法的过滤表达式过滤多个属性。SQL属性过滤使用SQL92语法作为过滤规则表达式，语法规范如下：

语法
说明
示例

IS NULL
判断属性不存在。
a IS NULL ：属性a不存在。

IS NOT NULL
判断属性存在。
a IS NOT NULL：属性a存在。

> >=  100：属性a存在且属性a的值大于100。 a IS NOT NULL AND a > 'abc'：错误示例，abc为字符串，不能用于比较大小。

BETWEEN xxx AND xxx
用于比较数字，不能用于比较字符串，否则消费者客户端启动时会报错。等价于>= xxx AND  xxx，表示属性值在两个值的区间之外。
a IS NOT NULL AND (a NOT BETWEEN 10 AND 100)：属性a存在且属性a的值小于10或大于100。

IN (xxx, xxx)
表示属性的值在某个集合内。集合的元素只能是字符串。
a IS NOT NULL AND (a IN ('abc', 'def'))：属性a存在且属性a的值为abc或def。

= <>
等于和不等于。可用于比较数字和字符串。
a IS NOT NULL AND (a = 'abc' OR a<>'def')：属性a存在且属性a的值为abc或a的值不为def。

AND OR
逻辑与、逻辑或。可用于组合任意简单的逻辑判断，需要将每个逻辑判断内容放入括号内。
a IS NOT NULL AND (a > 100) OR (b IS NULL)：属性a存在且属性a的值大于100或属性b不存在。

由于SQL属性过滤是生产者定义消息属性，消费者设置SQL过滤条件，因此过滤条件的计算结果具有不确定性，服务端的处理方式如下：

- 异常情况处理：如果过滤条件的表达式计算抛异常，消息默认被过滤，不会被投递给消费者。例如比较数字和非数字类型的值。
- 空值情况处理：如果过滤条件的表达式计算值为null或不是布尔类型（true和false），则消息默认被过滤，不会被投递给消费者。例如发送消息时未定义某个属性，在订阅时过滤条件中直接使用该属性，则过滤条件的表达式计算结果为null。
- 数值类型不符处理：如果消息自定义属性为浮点型，但过滤条件中使用整数进行判断，则消息默认被过滤，不会被投递给消费者。

发送消息时，设置属性：

```java
private final static String[] regions = {"北京","上海","四川","广东"};
 Message message = provider.newMessageBuilder()
                .setTopic("testTopic")
                // 设置消息索引键，可根据关键字精确查找某条消息。
                .setKeys("messageKey")
                // 设置消息Tag，用于消费端根据指定Tag过滤消息。
                .setTag(tags[i % tags.length])
                // 消息体。
                .setBody(("messageBody" + LocalDate.now().format(formatter) +"，下标：" + i).getBytes())
                .addProperty("region",regions[i % regions.length])
                .build();
```

订阅时，匹配一个条件：

```java
        String tag = "region is not null";
        FilterExpression filterExpression = new FilterExpression(tag, FilterExpressionType.SQL92);
         pushConsumer.subscribe(topic, filterExpression);
```

发现可以消费所有的消息。

订阅时，匹配多个条件：

```java
 String tag = "region is not null and region='北京'";
 FilterExpression filterExpression = new FilterExpression(tag, FilterExpressionType.SQL92);
   pushConsumer.subscribe(topic, filterExpression);
```

只有下标为0，4，8的消息才会被消费。

订阅时，不过滤消息：

```java
String tag = "true";
FilterExpression filterExpression = new FilterExpression(tag, FilterExpressionType.SQL92);
pushConsumer.subscribe(topic, filterExpression);
```
