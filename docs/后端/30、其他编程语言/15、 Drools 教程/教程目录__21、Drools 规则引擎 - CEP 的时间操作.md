# 21、Drools 规则引擎 - CEP 的时间操作
- 来源：https://ddkk.com/zhuanlan/other/drools/1/21.html
- 分类：Drools 教程
- 分组：教程目录
#### 对于事件的时间操作

在流模式中，drools对插入到工作内存的事件支持下面的时间操作。你可以使用操作符去定义你生命在java类或者DRL规则文件中的时间推理行为。当Drools在云模式下运行时，是不支持时间操作的。

- after
- before
- coincides
- during
- includes
- finishes
- finished by
- meets
- met by
- overlaps
- overlapped by
- starts
- started by

##### after

这个操作指定是否当前事件发生在相关事件之后，这个操作可以定义当前事件在相关事件发生之后的多久发生，或者是在某个时间范围内发生。

例如，下面模式匹配$eventA在$eventB结束之后的3分30秒到4分钟之间启动。如果超过这个时间范围，则不会发生模式匹配。

```java
$eventA : EventA(this after[3m30s, 4m] $eventB)
```

可以如下面这样表达：

```java
3m30s <= $eventA.startTimestamp - $eventB.endTimeStamp <= 4m
```

after操作支持2个参数值：

- 如果两个数都被定义，则第一个值代表时间间隔的开始，第二个代表结束。
- 如果只有一个值被定义，代表时间间隔的开始，并且没有结束时间。
- 如果没有值被定义，代表时间间隔从1毫秒开始，并且没有结束时间。

after操作也支持负时间范围：

```java
$eventA : EventA(this after[-3m30s, -2m] $eventB)
```

如果第一个值比第二个值大，Drools会自动将这两个值反过来。例如，下面的两个匹配会被Drools以相同的方式解析。

```java
$eventA : EventA(this after[-3m30s, -2m] $eventB) $eventA : EventA(this after[-2m, -3m30s] $eventB)
```

##### before

这个操作指定当前事件在相关事件发生之前发生。这个操作和after一样也定义了时间和时间范围。

例如，下面的模式匹配，$eventA在$eventB发生之前的3分半和4分钟之间发生。如果不在这个时间范围内，则匹配失败。

```java
$eventA : EventA(this before[3m30s, 4m] $eventB)
```

也可以用下面的方式表达这个操作：

```java
3m30s <= $eventB.startTimestamp - $eventA.endTimeStamp <= 4m
```

before操作支持两个参数：

如果两个值都被定义了，代表时间间隔的开始时间和结束时间。

如果只定义了一个值，代表时间间隔的开始时间，没有结束时间。

如果没有定义值，代表时间间隔的开始时间是1毫秒，没有结束时间。

before操作也支持负时间范围：

```java
$eventA : EventA(this before[-3m30s, -2m] $eventB)
```

如果第一个值大于第二个值，Drools1会自动将两个参数反过来，例如，下面的两种情况，Drools1会用相同的方式解析：

```java
$eventA : EventA(this before[-3m30s, -2m] $eventB) $eventA : EventA(this before[-2m, -3m30s] $eventB)
```

##### coincides

这个操作指定两个事件同时发生，有相同的开始和结束时间。

例如，下面这个形式就是$eventA和$eventB的时间戳相同：

```java
$eventA : EventA(this coincides $eventB)
```

这个操作支持两个参数：

如果只给了1个参数，参数用于设置两个事件的开始和结束时间的阈值。

如果两个参数都给了，第一个用于开始时间的阈值，第二个用于结束时间的阈值。

下面就是用了开始和结束时间阈值的例子：

```java
$eventA : EventA(this coincides[15s, 10s] $eventB)
```

如果满足以下条件，则模式匹配：

```java
abs($eventA.startTimestamp - $eventB.startTimestamp) <= 15s && abs($eventA.endTimestamp - $eventB.endTimestamp) <= 10s
```

> Drools对于coincides操作中不支持负时间间隔，如果你使用了负时间间隔，会产生错误。

##### during

这个操作指定当前事件发生在相关时间开始和结束时间范围之内。当前事件必须在相关事件开始之后才能开始，在相关事件结束之前，必须结束。

例如，下面的模式匹配:

```java
$eventA : EventA(this during $eventB)
```

也可以用下面的操作表达：

```java
$eventB.startTimestamp < $eventA.startTimestamp <= $eventA.endTimestamp < $eventB.endTimestamp
```

during操作支持一个，两个或者四个可选参数：

- 如果只定义了一个参数，这个值就是开始和结束时间的最大间隔。
- 如果定义了两个参数，这两个值是一个阈值，当前时间发生的开始和结束时间和相关事件的开始结束时间相关。例如，如果参数是5和10，则表示，当前事件必须在相关事件启动后的5到10秒之间启动，在相关事件结束前的5到10秒之间结束。
- 如果定义了4个参数，第一个和第二个值是事件开始与结束时间的最小和最大距离，第三个和第四个值是两个事件的结束最小与最大距离。

##### includes

这个操作符是指定相关事件发生是否在当前事件发生的时间内发生。相关事件的开始必须在当前事件开始之后，相关事件结束，必须在当前事件结束之前。（这个操作和during操作正好是反过来的）。

例如，下面的模式匹配，$eventB在$eventA开始后开始，在$eventA结束前结束。

```java
$eventA : EventA(this includes $eventB)
```

也可以用下面的方式表达：

```java
$eventA.startTimestamp < $eventB.startTimestamp <= $eventB.endTimestamp < $eventA.endTimestamp
```

includes操作支持1个，2个和四个可选参数：

- 如果只有一个值被定义，这个值就是两个事件开始时间的最大时间距离，结束时间的最大时间距离。
- 如果定义了两个值，就是两个事件开始时间间隔的时间范围，和结束时间间隔的范围。例如，如果两个参数是5和10，则表示在当前事件开始之后的5到10秒之间，相关事件必须开始，在当前事件结束之前的5到10秒之间，相关事件必须结束。
- 如果定义了四个值，则第一和第二个值代表两个事件开始时间的最小间隔和最大间隔，第三和第四个值代表两个事件结束时间的最小间隔和最大间隔。

##### finishes

此运算符指定当前事件在相关事件之后开始，但两个事件同时结束。

例如，下面的模式匹配，$eventA在$eventB开始之后开始，但是却同时结束：

```java
$eventA : EventA(this finishes $eventB)
```

你也可以像下面这样表达：

```java
$eventB.startTimestamp < $eventA.startTimestamp && $eventA.endTimestamp == $eventB.endTimestamp
```

这个操作只支持一个参数，设置两个事件结束时间允许的最大时间差：

```java
$eventA : EventA(this finishes[5s] $eventB)
```

如果这个条件满足，模式匹配：

```java
$eventB.startTimestamp < $eventA.startTimestamp && abs($eventA.endTimestamp - $eventB.endTimestamp) <= 5s
```

> finished不支持负时间差距，如果你使用负时间间距，Drools会产生错误。

##### finished by

这个操作是相关事件在当前事件开始之后开始，然后一起结束。（这个操作行为是finishes的反过来的操作）

例如，下面的模式匹配就是$eventA开始后$eventB开始，然后一起结束：

```java
$eventA : EventA(this finishedby $eventB)
```

你也可以像下面这样表达

```java
$eventA.startTimestamp < $eventB.startTimestamp && $eventA.endTimestamp == $eventB.endTimestamp
```

这个操作也是只支持一个参数，两个事件结束时间间隔的最大值：

```java
$eventA : EventA(this finishedby[5s] $eventB)
```

如果这个条件满足，这个模式就会匹配：

```java
$eventA.startTimestamp < $eventB.startTimestamp && abs($eventA.endTimestamp - $eventB.endTimestamp) <= 5s
```

> finished不支持负时间差距，如果你使用负时间间距，Drools会产生错误。

##### meets

这个操作是当前事件结束，与此同时，相关事件开始。

例如，下面这个模式匹配，$eventA结束的同时，$eventB开始:

```java
$eventA : EventA(this meets $eventB)
```

你也可以用下面的方式表达该操作：

```java
abs($eventB.startTimestamp - $eventA.endTimestamp) == 0
```

该操作也只有一个可选参数，表示当前事件结束时间和相关事件开始时间中间的最大时间间隔：

```java
$eventA : EventA(this meets[5s] $eventB)
```

如果这些条件满足，则模式匹配：

```java
abs($eventB.startTimestamp - $eventA.endTimestamp) <= 5s
```

> finished不支持负时间差距，如果你使用负时间间距，Drools会产生错误。

##### met by

这个操作是相关事件结束，当前事件开始。（该操作正好与meet相反。）

距离，如果eventB结束的同时evnetA开始，则模式匹配。

```java
$eventA : EventA(this metby $eventB)
```

也可以用下面的表达这个操作：

```java
abs($eventA.startTimestamp - $eventB.endTimestamp) == 0
```

该操作也只有一个可选参数，表示相关事件结束时间和当前事件开始时间中间的最大时间间隔：

```java
$eventA : EventA(this metby[5s] $eventB)
```

如果这些条件满足，则模式匹配：

```java
abs($eventA.startTimestamp - $eventB.endTimestamp) <= 5s
```

> finished不支持负时间差距，如果你使用负时间间距，Drools会产生错误。

##### overlaps

这个操作就是当前事件在相关事件开始之前开始，当前事件的结束在相关事件的开始时间与结束时间之间。

例如，如果eventA在eventB开始之前开始，在eventB开始之后，结束之前，eventA结束，则会匹配：

```java
$eventA : EventA(this overlaps $eventB)
```

该操作支持两个参数：

- 如果只有一个参数，这个值就是相关事件的开始时间与当前事件的结束时间的最大时间差。
- 如果有两个参数，第一个值是相关事件的开始时间与当前事件的结束时间的最小时间差，第二个是相关事件的开始时间与当前事件的结束时间的最大时间差。

##### overlapped by

该操作是相关事件开始在当前事件开始之前，相关事件的结束在当前事件开始和结束之间。（和overlaps正好相反）。

例如，如果eventB在eventA开始之前开始，然后eventB结束当eventA开始，在eventA结束之前，下面的模式匹配：

```java
$eventA : EventA(this overlappedby $eventB)
```

该操作支持两个参数：

- 如果只有一个参数，这个值就是当前事件的开始时间与相关事件的结束时间的最大时间差。
- 如果有两个参数，第一个值是当前事件的开始时间与相关事件的结束时间的最小时间差，第二个是当前事件的开始时间与相关事件的结束时间的最大时间差。

##### starts

这个操作是两个事件同时开始，但是当前事件要在相关事件结束之前结束。

例如，如果eventA和eventB同时开始，eventA先结束，eventB后结束，则下面的模式会被匹配：

```java
$eventA : EventA(this starts $eventB)
```

也可以用下面的方式表达这个操作：

```java
$eventA.startTimestamp == $eventB.startTimestamp && $eventA.endTimestamp < $eventB.endTimestamp
```

starts操作支持一个参数，代表两个事件的开始时间的最大差距：

```java
$eventA : EventA(this starts[5s] $eventB)
```

如果这些条件满足，则模式匹配：

```java
abs($eventA.startTimestamp - $eventB.startTimestamp) <= 5s && $eventA.endTimestamp < $eventB.endTimestamp
```

> finished不支持负时间差距，如果你使用负时间间距，Drools会产生错误。

##### started by

这个操作是两个事件同时开始，但是相关事件在当前事件结束之前结束。（与starts操作行为相反）

例如，如果eventA和eventB同时开始，eventB先结束，eventA后结束，则下面的模式会被匹配：

```java
$eventA : EventA(this startedby $eventB)
```

也可以用下面的方式表达这个操作：

```java
$eventA.startTimestamp == $eventB.startTimestamp && $eventA.endTimestamp > $eventB.endTimestamp
```

该操作操作支持一个参数，代表两个事件的开始时间的最大差距：

```java
$eventA : EventA( this starts[5s] $eventB)
```

如果这些条件满足，则模式匹配：

```java
abs( $eventA.startTimestamp - $eventB.startTimestamp ) <= 5s && $eventA.endTimestamp > $eventB.endTimestamp
```

> finished不支持负时间差距，如果你使用负时间间距，Drools会产生错误。
