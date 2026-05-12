# 12、Flink 中的时间和窗口之窗口
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/1/12.html
- 分类：大数据框架
- 分组：教程目录
## 窗口

我们已经了解了Flink中事件时间和水位线的概念，那它们有什么具体应用呢？当然是做基于时间的处理计算了。其中最常见的场景，就是窗口聚合计算。

之前我们已经了解了Flink中基本的聚合操作。在流处理中，我们往往需要面对的是连续不断、无休无止的无界流，不可能等到所有所有数据都到齐了才开始处理。所以聚合计算其实只能针对当前已有的数据——之后再有数据到来，就需要继续叠加、再次输出结果。这样似乎很“实时”，但现实中大量数据一般会同时到来，需要并行处理，这样频繁地更新结果就会给系统带来很大负担了。

更加高效的做法是，把无界流进行切分，每一段数据分别进行聚合，结果只输出一次。这就相当于将无界流的聚合转化为了有界数据集的聚合，这就是所谓的“窗口”（Window）聚合操作。窗口聚合其实是对实时性和处理效率的一个权衡。在实际应用中，我们往往更关心一段时间内数据的统计结果，比如在过去的1分钟内有多少用户点击了网页。在这种情况下，我们就可以定义一个窗口，收集最近一分钟内的所有用户点击数据，然后进行聚合统计，最终输出一个结果就可以了。

在Flink 中，提供了非常丰富的窗口操作，下面就做介绍。

## 一、窗口的概念

Flink是一种流式计算引擎，主要是来处理无界数据流的，数据源源不断、无穷无尽。想要更加方便高效地处理无界流，一种方式就是将无限数据切割成有限的“数据块”进行处理，这就是所谓的“窗口”（Window）。

在Flink中,窗口就是用来处理无界流的核心。我们很容易把窗口想象成一个固定位置的“框”，数据源源不断地流过来，到某个时间点窗口该关闭了，就停止收集数据、触发计算并输出结果。例如，我们定义一个时间窗口，每10秒统计一次数据，那么就相当于把窗口放在那里，从0秒开始收集数据；到10秒时，处理当前窗口内所有数据，输出一个结果，然后清空窗口继续收集数据；到20秒时，再对窗口内所有数据进行计算处理，输出结果；依次类推，如图所示。

这里注意为了明确数据划分到哪一个窗口，定义窗口都是包含起始时间、不包含结束时间的，用数学符号表示就是一个左闭右开的区间，例如0~10秒的窗口可以表示为[0,10),这里单位为秒。

对于处理时间下的窗口而言，这样理解似乎没什么问题。因为窗口的关闭是基于系统时间的，赶不上这班车的数据，就只能坐下一班车了——正如上图中，010秒的窗口关闭后，可能还有时间戳为9的数据会来，它就只能进入1020秒的窗口了。这样会造成窗口处理结果的不准确。

然而如果我们采用事件时间语义，就会有些费解了。由于有乱序数据，我们需要设置一个延迟时间来等所有数据到齐。比如上面的例子中，我们可以设置延迟时间为2秒，如图所示，这样0~10秒的窗口会在时间戳为12的数据到来之后，才真正关闭计算输出结果，这样就可以正常包含迟到的9秒数据了。

但是这样一来，0~10秒的窗口不光包含了迟到的9秒数据，连11秒和12秒的数据也包含进去了。我们为了正确处理迟到数据，结果把早到的数据划分到了错误的窗口——最终结果都是错误的。

所以在Flink中，窗口其实并不是一个“框”，流进来的数据被框住了就只能进这一个窗口。相比之下，我们应该把窗口理解成一个“桶”，如图所示。在Flink中，窗口可以把流切割成有限大小的多个“存储桶”（bucket)；每个数据都会分发到对应的桶中，当到达窗口结束时间时，就对每个桶中收集的数据进行计算处理。

可以梳理一下事件时间语义下，之前例子中窗口的处理过程：

1、第一个数据时间戳为2，判断之后创建第一个窗口[0,10），并将2秒数据保存进去；

2、后续数据依次到来，时间戳均在[0,10）范围内，所以全部保存进第一个窗口；

3、11秒数据到来，判断它不属于[0,10）窗口，所以创建第二个窗口[10,20），并将11秒的数据保存进去。由于水位线设置延迟时间为2秒，所以现在的时钟是9秒，第一个窗口也没有到关闭时间；

4、之后又有9秒数据到来，同样进入[0,10）窗口中；

5、12秒数据到来，判断属于[10,20）窗口，保存进去。这时产生的水位线推进到了10秒，所以[0,10）窗口应该关闭了。第一个窗口收集到了所有的7个数据，进行处理计算后输出结果，并将窗口关闭销毁；

6、同样的，之后的数据依次进入第二个窗口，遇到20秒的数据时会创建第三个窗口[20,30）并将数据保存进去；遇到22秒数据时，水位线达到了20秒，第二个窗口触发计算，输出结果并关闭。

这里需要注意的是，**Flink中窗口并不是静态准备好的，而是动态创建**——当有落在这个窗口区间范围的数据达到时，才创建对应的窗口。另外，这里我们认为到达窗口结束时间时，窗口就触发计算并关闭，事实上“触发计算”和“窗口关闭”两个行为也可以分开，这部分内容会在后面详述。

## 二、窗口的分类

在上一节举的例子，其实是最为简单的一种时间窗口。在Flink中，窗口的应用非常灵活，我们可以使用各种不同类型的窗口来实现需求。接下来就从不同的角度，对Flink中内置的窗口做一个分类说明。

### 1.按照驱动类型分类

窗口本身是截取有界数据的一种方式，所以窗口一个非常重要的信息其实就是“怎样截取数据”。换句话说，就是以什么标准来开始和结束数据的截取，我们把它叫作窗口的“驱动类型”。

我们最容易想到的就是按照时间段去截取数据，这种窗口就叫作“时间窗口”（TimeWindow）。这在实际应用中最常见，之前所举的例子也都是时间窗口。除了由时间驱动之外，窗口其实也可以由数据驱动，也就是说按照固定的个数，来截取一段数据集，这种窗口叫作“计数窗口”（CountWindow），如图所示。

**1、时间窗口（Time Window）**

时间窗口以时间点来定义窗口的开始（start）和结束（end），所以截取出的就是某一时间段的数据。到达结束时间时，窗口不再收集数据，触发计算输出结果，并将窗口关闭销毁。所以可以说基本思路就是“定点发车”。

用结束时间减去开始时间，得到这段时间的长度，就是窗口的大小（windowsize）。这里的时间可以是不同的语义，所以我们可以定义处理时间窗口和事件时间窗口。

时间可以是不同的语义，所以我们可以定义处理时间窗口和事件时间窗口。Flink中有一个专门的类来表示时间窗口，名称就叫作TimeWindow。这个类只有两个私有属性：start和end，表示窗口的开始和结束的时间戳，单位为毫秒。

```java
private final long start;
private final long end;
```

我们可以调用公有的getStart()和getEnd()方法直接获取这两个时间戳。另外，TimeWindow还提供了一个maxTimestamp()方法，用来获取窗口中能够包含数据的最大时间戳

```java
public long maxTimestamp() {
 return end - 1;
}
```

很明显，窗口中的数据，最大允许的时间戳就是end-1，这也就代表了我们定义的窗口时间范围都是左闭右开的区间[start，end)。

或许有较真的读者会问，为什么不把窗口区间定义成左开右闭、包含上结束时间呢？这样maxTimestamp跟end一致，不就可以省去一个方法的定义吗？

maxTimestamp跟end一致，不就可以省去一个方法的定义吗？这主要是为了方便判断窗口什么时候关闭。对于事件时间语义，窗口的关闭需要水位线推进到窗口的结束时间；而我们知道，水位线Watermark(t)代表的含义是“时间戳小于等于t的数据都已到齐，不会再来了”。为了简化分析，我们先不考虑乱序流设置的延迟时间。那么当新到一个时间戳为t的数据时，当前水位线的时间推进到了t–1（还记得乱序流里生成水位线的减一操作吗？）。所以当时间戳为end的数据到来时，水位线推进到了end-1；如果我们把窗口定义为不包含end，那么当前的水位线刚好就是maxTimestamp，表示窗口能够包含的数据都已经到齐，我们就可以直接关闭窗口了。所以有了这样的定义，我们就不需要再去考虑那烦人的“减一”了，直接看到时间戳为end的数据，就关闭对应的窗口。如果为乱序流设置了水位线延迟时间delay，也只需要等到时间戳为end+delay的数据，就可以关窗了。

**2、计数窗口（Count Window）**

计数窗口基于元素的个数来截取数据，到达固定的个数时就触发计算并关闭窗口。这相当于座位有限、“人满就发车”，是否发车与时间无关。每个窗口截取数据的个数，就是窗口的大小。

计数窗口相比时间窗口就更加简单，我们只需指定窗口大小，就可以把数据分配到对应的窗口中了。在Flink内部也并没有对应的类来表示计数窗口，底层是通过“全局窗口”（GlobalWindow）来实现的。关于全局窗口，稍后讲解。

## 2.按照窗口分配数据的规则分类

时间窗口和计数窗口，只是对窗口的一个大致划分；在具体应用时，还需要定义更加精细的规则，来控制数据应该划分到哪个窗口中去。不同的分配数据的方式，就可以有不同的功能应用。

根据分配数据的规则，窗口的具体实现可以分为4类：**滚动窗口（TumblingWindow）、滑动窗口（SlidingWindow）、会话窗口（SessionWindow）** ，以及**全局窗口（GlobalWindow）** 。下面来做具体介绍。

### 1、滚动窗口（Tumbling Windows）

滚动窗口有固定的大小，是一种对数据进行“均匀切片”的划分方式。窗口之间没有重叠，也不会有间隔，是“首尾相接”的状态。如果我们把多个窗口的创建，看作一个窗口的运动，那就好像它在不停地向前“翻滚”一样。这是最简单的窗口形式，之前所举的例子都是滚动窗口。也正是因为滚动窗口是“无缝衔接”，所以每个数据都会被分配到一个窗口，而且只会属于一个窗口。

滚动窗口可以基于时间定义，也可以基于数据个数定义；需要的参数只有一个，就是窗口的大小（window size）。比如我们可以定义一个长度为1小时的滚动时间窗口，那么每个小时就会进行一次统计；或者定义一个长度为10的滚动计数窗口，就会每10个数进行一次统计。

如图所示，小圆点表示流中的数据，我们对数据按照userId做了分区。当固定了窗口大小之后，所有分区的窗口划分都是一致的；窗口没有重叠，每个数据只属于一个窗口。

滚动窗口应用非常广泛，它可以对每个时间段做聚合统计，很多BI分析指标都可以用它来实现。

### 2、滑动窗口（Sliding Windows）

与滚动窗口类似，滑动窗口的大小也是固定的。区别在于，窗口之间并不是首尾相接的，而是可以“错开”一定的位置。如果看作一个窗口的运动，那么就像是向前小步“滑动”一样。

既然是向前滑动，那么每一步滑多远，就也是可以控制的。所以定义滑动窗口的参数有两个：除去窗口大小（window size）之外，还有一个“滑动步长”（window slide），它其实就代表了窗口计算的频率。滑动的距离代表了下个窗口开始的时间间隔，而窗口大小是固定的，所以也就是两个窗口结束时间的间隔；窗口在结束时间触发计算输出结果，那么滑动步长就代表了计算频率。例如，我们定义一个长度为1小时、滑动步长为5分钟的滑动窗口，那么就会统计1小时内的数据，每5分钟统计一次。同样，滑动窗口可以基于时间定义，也可以基于数据个数定义。

我们可以看到，当滑动步长小于窗口大小时，滑动窗口就会出现重叠，这时数据也可能会被同时分配到多个窗口中。而具体的个数，就由窗口大小和滑动步长的比值（size/slide）来决定。如图所示，滑动步长刚好是窗口大小的一半，那么每个数据都会被分配到2个窗口里。比如我们定义的窗口长度为1小时、滑动步长为30分钟，那么对于8点55分的数据，应该同时属于[8点,9点)和[8点半,9点半)两个窗口；而对于8点10分的数据，则同时属于[8点,9点)和[7点半,8点半)两个窗口。

所以，滑动窗口其实是固定大小窗口的更广义的一种形式；换句话说，滚动窗口也可以看作是一种特殊的滑动窗口——窗口大小等于滑动步长（size=slide）。当然，我们也可以定义滑动步长大于窗口大小，这样的话就会出现窗口不重叠、但会有间隔的情况；这时有些数据不属于任何一个窗口，就会出现遗漏统计。所以一般情况下，我们会让滑动步长小于窗口大小，并尽量设置为整数倍的关系。

在一些场景中，可能需要统计最近一段时间内的指标，而结果的输出频率要求又很高，甚至要求实时更新，比如股票价格的24小时涨跌幅统计，或者基于一段时间内行为检测的异常报警。这时滑动窗口无疑就是很好的实现方式。

### 3、会话窗口（Session Windows）

会话窗口顾名思义，是基于“会话”（session）来来对数据进行分组的。这里的会话类似Web应用中session的概念，不过并不表示两端的通讯过程，而是借用会话超时失效的机制来描述窗口。简单来说，**就是数据来了之后就开启一个会话窗口，如果接下来还有数据陆续到来，那么就一直保持会话；如果一段时间一直没收到数据，那就认为会话超时失效，窗口自动关闭**。这就好像我们打电话一样，如果时不时总能说点什么，那说明还没聊完；如果陷入了尴尬的沉默，半天都没话说，那自然就可以挂电话了。

与滑动窗口和滚动窗口不同，会话窗口只能基于时间来定义，而没有“会话计数窗口”的概念。这很好理解，“会话”终止的标志就是“隔一段时间没有数据来”，如果不依赖时间而改成个数，就成了“隔几个数据没有数据来”，这完全是自相矛盾的说法。

而同样是基于这个判断标准，这“一段时间”到底是多少就很重要了，必须明确指定。对于会话窗口而言，最重要的参数就是这段时间的长度（size），它表示会话的超时时间，也就是两个会话窗口之间的最小距离。如果相邻两个数据到来的时间间隔（Gap）小于指定的大小（size），那说明还在保持会话，它们就属于同一个窗口；如果gap大于size，那么新来的数据就应该属于新的会话窗口，而前一个窗口就应该关闭了。在具体实现上，我们可以设置静态固定的大小（size），也可以通过一个自定义的提取器（gap extractor）动态提取最小间隔gap的值。

考虑到事件时间语义下的乱序流，这里又会有一些麻烦。相邻两个数据的时间间隔gap大于指定的size，我们认为它们属于两个会话窗口，前一个窗口就关闭；可在数据乱序的情况下，可能会有迟到数据，它的时间戳刚好是在之前的两个数据之间的。这样一来，之前我们判断的间隔中就不是“一直没有数据”，而缩小后的间隔有可能会比size还要小——这代表三个数据本来应该属于同一个会话窗口。

所以在Flink底层，对会话窗口的处理会比较特殊：每来一个新的数据，都会创建一个新的会话窗口；然后判断已有窗口之间的距离，如果小于给定的size，就对它们进行合并（merge）操作。在Window算子中，对会话窗口会有单独的处理逻辑。

我们可以看到，与前两种窗口不同，会话窗口的长度不固定，起始和结束时间也是不确定的，各个分区之间窗口没有任何关联。如图所示，会话窗口之间一定是不会重叠的，而且会留有至少为size的间隔（sessiongap）。

在一些类似保持会话的场景下，往往可以使用会话窗口来进行数据的处理统计。

### 4、全局窗口（Global Windows）

还有一类比较通用的窗口，就是“全局窗口”。这种窗口全局有效，会把相同key的所有数据都分配到同一个窗口中；说直白一点，就跟没分窗口一样。无界流的数据永无止尽，所以这种窗口也没有结束的时候，默认是不会做触发计算的。如果希望它能对数据进行计算处理，还需要自定义“触发器”（Trigger）。关于触发器，会在后面进行学习；

如图所示，可以看到，全局窗口没有结束的时间点，所以一般在希望做更加灵活的窗口处理时自定义使用。Flink中的计数窗口（Count Window），底层就是用全局窗口实现的。

## 三、窗口API概览

已经了解了Flink中窗口的概念和分类，接下来我们就要看看在代码中怎样使用了。这一小节先对WindowAPI有一个整体认识，了解一下基本的调用方法。

### 1.按键分区（Keyed）和非按键分区（Non-Keyed）

在定义窗口操作之前，首先需要确定，到底是基于按键分区（Keyed）的数据流KeyedStream来开窗，还是直接在没有按键分区的DataStream上开窗。也就是说，在调用窗口算子之前，是否有keyBy操作。

1、按键分区窗口（Keyed Windows）

经过按键分区keyBy操作后，数据流会按照key被分为多条逻辑流（logicalstreams），这就是KeyedStream。基于KeyedStream进行窗口操作时,窗口计算会在多个并行子任务上同时执行。相同key的数据会被发送到同一个并行子任务，而窗口操作会基于每个key进行单独的处理。所以可以认为，每个key上都定义了一组窗口，各自独立地进行统计计算。

在代码实现上，我们**需要先对DataStream调用.keyBy()进行按键分区，然后再调用.window()定义窗口**。

```java
stream.keyBy(...)
 .window(...)
```

2、非按键分区（Non-Keyed Windows）

如果没有进行keyBy，那么原始的DataStream就不会分成多条逻辑流。这时窗口逻辑只能在一个任务（task）上执行，就相当于并行度变成了1。所以在实际应用中一般不推荐使用这种方式。

在代码中，直接基于DataStream调用.windowAll()定义窗口。

```java
stream.windowAll(...)
```

这里需要注意的是，对于非按键分区的窗口操作，手动调大窗口算子的并行度也是无效的，windowAll本身就是一个非并行的操作。

### 2. 代码中窗口API的调用

有了前置的基础，接下来我们就可以真正在代码中实现一个窗口操作了。简单来说，窗口操作主要有两个部分：**窗口分配器（WindowAssigners）** 和**窗口函数（WindowFunctions）** 。

```java
stream.keyBy(<keyselector>)
 .window(<windowassigner>)
 .aggregate(<windowfunction>)
```

其中.window()方法需要传入一个窗口分配器，它指明了窗口的类型；而后面的.aggregate()方法传入一个窗口函数作为参数，它用来定义窗口具体的处理逻辑。窗口分配器有各种形式，而窗口函数的调用方法也不只.aggregate()一种，接下来就详细展开讲解。

而窗口函数的调用方法也不只.aggregate()一种，我们接下来就详细展开讲解。另外，在实际应用中，一般都需要并行执行任务，非按键分区很少用到，所以我们之后都以按键分区窗口为例；如果想要实现非按键分区窗口，只要前面不做keyBy，后面调用.window()时直接换成.windowAll()就可以了。

## 四、窗口分配器(WindowAssigners)

定义窗口分配器（WindowAssigners）是构建窗口算子的第一步，它的作用就是定义数据应该被“分配”到哪个窗口。窗口分配数据的规则，其实就对应着不同的窗口类型。所以可以说，窗口分配器其实就是在指定窗口的类型。

窗口分配器最通用的定义方式，就是调用.window()方法。这个方法需要传入一个WindowAssigner作为参数，返回WindowedStream。如果是非按键分区窗口，那么直接调用.windowAll()方法，同样传入一个WindowAssigner，返回的是AllWindowedStream。

窗口按照驱动类型可以分成时间窗口和计数窗口，而按照具体的分配规则，又有滚动窗口、滑动窗口、会话窗口、全局窗口四种。除去需要自定义的全局窗口外，其他常用的类型Flink中都给出了内置的分配器实现，我们可以方便地调用实现各种需求。

### 1.时间窗口

时间窗口是最常用的窗口类型，又可以细分为滚动、滑动和会话三种。

在较早的版本中，可以直接调用.timeWindow()来定义时间窗口；这种方式非常简洁，但使用事件时间语义时需要另外声明，程序员往往因为忘记这点而导致运行结果错误。所以在1.12版本之后，这种方式已经被弃用了，标准的声明方式就是直接调用.window()，在里面传入对应时间语义下的窗口分配器。这样一来，我们不需要专门定义时间语义，默认就是事件时间；如果想用处理时间，那么在这里传入处理时间的窗口分配器就可以了。

下面我们列出了每种情况的代码实现。

1、滚动处理时间窗口

窗口分配器由类 TumblingProcessingTimeWindows 提供，需要调用它的静态方法.of()

```java
stream.keyBy(...)
.window(TumblingProcessingTimeWindows.of(Time.seconds(5)))
.aggregate(...)
```

这里.of()方法需要传入一个Time类型的参数size，表示滚动窗口的大小，我们这里创建了一个长度为5秒的滚动窗口。

另外，.of()还有一个重载方法，可以传入两个Time类型的参数：size和offset。第一个参数当然还是窗口大小，第二个参数则表示窗口起始点的偏移量。这里需要多做一些解释：对于之前的定义，滚动窗口其实只有一个size是不能唯一确定的。比如定义1天的滚动窗口，从每天的0点开始计时是可以的，统计的就是一个自然日的所有数据；而如果从每天的凌晨2点开始计时其实也完全没问题，只不过统计的数据变成了每天2点到第二天2点。这个起始点的选取，其实对窗口本身的类型没有影响；而为了方便应用，默认的起始点时间戳是窗口大小的整倍数。也就是说，如果我们定义1天的窗口，默认就从0点开始；如果定义1小时的窗口，默认就从整点开始。而如果我们非要不从这个默认值开始，那就可以通过设置偏移量offset来调整。

这里读者可能会觉得奇怪：这个功能好像没什么用，非要弄个偏移量不是给自己找别扭吗？这其实是有实际用途的。我们知道，不同国家分布在不同的时区。标准时间戳其实就是1970年1月1日0时0分0秒0毫秒开始计算的一个毫秒数，而这个时间是以UTC时间，也就是0时区（伦敦时间）为标准的。我们所在的时区是东八区，也就是UTC+8，跟UTC有8小时的时差。我们定义1天滚动窗口时，如果用默认的起始点，那么得到就是伦敦时间每天0点开启窗口，这时是北京时间早上8点。那怎样得到北京时间每天0点开启的滚动窗口呢？只要设置-8小时的偏移量就可以了：

```java
.window(TumblingProcessingTimeWindows.of(Time.days(1), Time.hours(-8)))
```

2、滑动处理时间窗口

窗口分配器由类SlidingProcessingTimeWindows 提供，同样需要调用它的静态方法.of()。

```java
stream.keyBy(...)
.window(SlidingProcessingTimeWindows.of(Time.seconds(10), Time.seconds(5)))
.aggregate(...)
```

里.of()方法需要传入两个Time类型的参数：size和slide，前者表示滑动窗口的大小，后者表示滑动窗口的滑动步长。我们这里创建了一个长度为10秒、滑动步长为5秒的滑动窗口。

滑动窗口同样可以追加第三个参数，用于指定窗口起始点的偏移量，用法与滚动窗口完全一致。

3、处理时间会话窗口

窗口分配器由类 ProcessingTimeSessionWindows 提供，需要调用它的静态方法.withGap() 或者.withDynamicGap()。

```java
stream.keyBy(...)
    .window(ProcessingTimeSessionWindows.withGap(Time.seconds(10)))
.aggregate(...)
```

这里.withGap()方法需要传入一个Time类型的参数size，表示会话的超时时间，也就是最小间隔sessiongap。我们这里创建了静态会话超时时间为10秒的会话窗口。

```java
.window(ProcessingTimeSessionWindows.withDynamicGap(new
SessionWindowTimeGapExtractor<Tuple2<String, Long>>() {
 @Override
 public long extract(Tuple2<String, Long> element) {
// 提取 session gap 值返回, 单位毫秒
 return element.f0.length() * 1000;
 }
})
```

这里.withDynamicGap()方法需要传入一个SessionWindowTimeGapExtractor作为参数，用来定义sessiongap的动态提取逻辑。在这里，我们提取了数据元素的第一个字段，用它的长度乘以1000作为会话超时的间隔。

4、滚动事件时间窗口

窗口分配器由类 TumblingEventTimeWindows 提供，用法与滚动处理事件窗口完全一致。

```java
stream.keyBy(...)
.window(TumblingEventTimeWindows.of(Time.seconds(5)))
.aggregate(...)
```

这里.of()方法也可以传入第二个参数 offset，用于设置窗口起始点的偏移量。

5、滑动事件时间窗口

窗口分配器由类 SlidingEventTimeWindows 提供，用法与滑动处理事件窗口完全一致。

```java
stream.keyBy(...)
.window(SlidingEventTimeWindows.of(Time.seconds(10), Time.seconds(5)))
.aggregate(...)
```

6、事件时间会话窗口

窗口分配器由类 EventTimeSessionWindows 提供，用法与处理事件会话窗口完全一致。

```java
stream.keyBy(...)
.window(EventTimeSessionWindows.withGap(Time.seconds(10)))
.aggregate(...)
```

### 2.计数窗口

计数窗口概念非常简单，本身底层是基于全局窗口（GlobalWindow）实现的。Flink为我们提供了非常方便的接口：直接调用.countWindow()方法。根据分配规则的不同，又可以分为滚动计数窗口和滑动计数窗口两类，下面我们就来看它们的具体实现。

1、滚动计数窗口

滚动计数窗口只需要传入一个长整型的参数 size，表示窗口的大小。

```java
stream.keyBy(...)
.countWindow(10)
```

定义了一个长度为10的滚动计数窗口，当窗口中元素数量达到10的时候，就会触发计算执行并关闭窗口。

2、滑动计数窗口

与滚动计数窗口类似，不过需要在.countWindow()调用时传入两个参数：size 和 slide，前 者表示窗口大小，后者表示滑动步长。

```java
stream.keyBy(...)
.countWindow(10，3)
```

定义了一个长度为10、滑动步长为3的滑动计数窗口。每个窗口统计10个数据，每隔3个数据就统计输出一次结果。

### 3.全局窗口

全局窗口是计数窗口的底层实现，一般在需要自定义窗口时使用。它的定义同样是直接调用.window()，分配器由GlobalWindows类提供。

```java
stream.keyBy(...)
.window(GlobalWindows.create());
```

需要注意使用全局窗口，必须自行定义触发器才能实现窗口计算，否则起不到任何作用。

## 五、窗口函数（WindowFunction）

定义了窗口分配器，我们只是知道了数据属于哪个窗口，可以将数据收集起来了；至于收集起来到底要做什么，其实还完全没有头绪。所以在窗口分配器之后，必须再接上一个定义窗口如何进行计算的操作，这就是所谓的“窗口函数”（windowfunctions）。

经窗口分配器处理之后，数据可以分配到对应的窗口中，而数据流经过转换得到的数据类型是WindowedStream。这个类型并不是DataStream，所以并不能直接进行其他转换，而必须进一步调用窗口函数，对收集到的数据进行处理计算之后，才能最终再次得到DataStream，如图所示。

窗口函数定义了要对窗口中收集的数据做的计算操作，根据处理的方式可以分为两类：**增量聚合函数和全窗口函数**。

### 1. 增量聚合函数（incremental aggregation functions）

窗口将数据收集起来，最基本的处理操作当然就是进行聚合。窗口对无限流的切分，可以看作得到了一个有界数据集。如果等到所有数据都收集齐，在窗口到了结束时间要输出结果的一瞬间再去进行聚合，显然就不够高效了——这相当于真的在用批处理的思路来做实时流处理。

为了提高实时性，可以再次将流处理的思路发扬光大：就像DataStream的简单聚合一样，每来一条数据就立即进行计算，中间只要保持一个简单的聚合状态就可以了；区别只是在于不立即输出结果，而是要等到窗口结束时间。等到窗口到了结束时间需要输出计算结果的时候，我们只需要拿出之前聚合的状态直接输出，这无疑就大大提高了程序运行的效率和实时性。

典型的增量聚合函数有两个：ReduceFunction和AggregateFunction。

1、归约函数（ReduceFunction）

最基本的聚合方式就是归约（reduce）。我们在基本转换的聚合算子中介绍过reduce的用法，窗口的归约聚合也非常类似，就是将窗口中收集到的数据两两进行归约。当我们进行流处理时，就是要保存一个状态；每来一个新的数据，就和之前的聚合状态做归约，这样就实现了增量式的聚合。

窗口函数中也提供了ReduceFunction：只要基于WindowedStream调用.reduce()方法，然后传入ReduceFunction作为参数，就可以指定以归约两个元素的方式去对窗口中数据进行聚合了。这里的ReduceFunction其实与简单聚合时用到的ReduceFunction是同一个函数类接口，所以使用方式也是完全一样的。

我们回忆一下，ReduceFunction中需要重写一个reduce方法，它的两个参数代表输入的两个元素，而归约最终输出结果的数据类型，与输入的数据类型必须保持一致。也就是说，**中间聚合的状态和输出的结果，都和输入的数据类型是一样的**。

下面是使用ReduceFunction进行增量聚合的代码示例。

【示例代码】

```java
package com.kunan.StreamAPI.Window;
import com.kunan.StreamAPI.Source.ClickSource;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.api.common.eventtime.SerializableTimestampAssigner;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.functions.MapFunction;
import org.apache.flink.api.common.functions.ReduceFunction;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.windowing.assigners.TumblingEventTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.elasticsearch.common.recycler.Recycler;
import java.time.Duration;
public class WindowTest {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        env.getConfig().setAutoWatermarkInterval(100);
        //从元素中读取数据
        SingleOutputStreamOperator<Event> stream = env.addSource(new ClickSource())
                //乱序流的watermark生成
                .assignTimestampsAndWatermarks(WatermarkStrategy.<Event>forBoundedOutOfOrderness(Duration.ZERO)
                        .withTimestampAssigner(new SerializableTimestampAssigner<Event>() {
                            @Override
                            public long extractTimestamp(Event element, long recordTimestamp) {
                                return element.timestamp;
                            }
                        }));
        stream.map(new MapFunction<Event, Tuple2<String,Long>>() {
            @Override
            public Tuple2<String, Long> map(Event value) throws Exception {
                //将数据转换成二元组，方便计算
                return Tuple2.of(value.user,1L);
            }
        })
                .keyBy(date -> date.f0)
             //   .countWindow(10,2) //滑动计数窗口
               // .window(EventTimeSessionWindows.withGap(Time.seconds(2))) //事件时间会话窗口
              //  .window(SlidingEventTimeWindows.of(Time.hours(1),Time.minutes(5)))//滑动事件时间窗口
                .window(TumblingEventTimeWindows.of(Time.seconds(10)))   //滚动事件时间窗口
                .reduce(new ReduceFunction<Tuple2<String, Long>>() {
                    @Override
                    public Tuple2<String, Long> reduce(Tuple2<String, Long> value1, Tuple2<String, Long> value2) throws Exception {
                        //定义累加规则，窗口闭合时，向下游发送累加结果
                        return Tuple2.of(value1.f0,value1.f1+value2.f1);
                    }
                }).print();
        env.execute();
    }
}
```

代码中我们对每个用户的行为数据进行了开窗统计。与wordcount逻辑类似，首先将数据转换成(user,count)的二元组形式（类型为Tuple2），每条数据对应的初始count值都是1；然后按照用户id分组，在处理时间下开滚动窗口，统计每5秒内的用户行为数量。对于窗口的计算，我们用ReduceFunction对count值做了增量聚合：窗口中会将当前的总count值保存成一个归约状态，每来一条数据，就会调用内部的reduce方法，将新数据中的count值叠加到状态上，并得到新的状态保存起来。等到了5秒窗口的结束时间，就把归约好的状态直接输出。

**这里需要注意，经过窗口聚合转换输出的数据，数据类型依然是二元组Tuple2**。

2、聚合函数（AggregateFunction）

ReduceFunction可以解决大多数归约聚合的问题，但是这个接口有一个限制，就是聚合状态的类型、输出结果的类型都必须和输入数据类型一样。这就迫使我们必须在聚合前，先将数据转换（map）成预期结果类型；而在有些情况下，还需要对状态进行进一步处理才能得到输出结果，这时它们的类型可能不同，使用ReduceFunction就会非常麻烦。

例如，如果我们希望计算一组数据的平均值，应该怎样做聚合呢？很明显，这时我们需要计算两个状态量：数据的总和（sum），以及数据的个数（count），而最终输出结果是两者的商（sum/count）。如果用ReduceFunction，那么我们应该先把数据转换成二元组(sum,count)的形式，然后进行归约聚合，最后再将元组的两个元素相除转换得到最后的平均值。本来应该只是一个任务，可我们却需要map-reduce-map三步操作，这显然不够高效。

于是可以想到，如果取消类型一致的限制，让输入数据、中间状态、输出结果三者类型都可以不同，不就可以一步直接搞定了吗？

Flink的WindowAPI中的aggregate就提供了这样的操作。直接基于WindowedStream调用.aggregate()方法，就可以定义更加灵活的窗口聚合操作。这个方法需要传入一个AggregateFunction的实现类作为参数。AggregateFunction在源码中的定义如下：

```java
public interface AggregateFunction<IN, ACC, OUT> extends Function, Serializable
{
 ACC createAccumulator();
 ACC add(IN value, ACC accumulator);
 OUT getResult(ACC accumulator);
  ACC merge(ACC a, ACC b);
}
```

AggregateFunction可以看作是ReduceFunction的通用版本，这里有三种类型：输入类型（IN）、累加器类型（ACC）和输出类型（OUT）。输入类型IN就是输入流中元素的数据类型；累加器类型ACC则是我们进行聚合的中间状态类型；而输出类型当然就是最终计算结果的类型了。

接口中有四个方法：

- createAccumulator()：创建一个累加器，这就是为聚合创建了一个初始状态，每个聚合任务只会调用一次。
- add()：将输入的元素添加到累加器中。这就是基于聚合状态，对新来的数据进行进一步聚合的过程。方法传入两个参数：当前新到的数据value，和当前的累加器accumulator；返回一个新的累加器值，也就是对聚合状态进行更新。每条数据到来之后都会调用这个方法。
- getResult()：从累加器中提取聚合的输出结果。也就是说，我们可以定义多个状态，然后再基于这些聚合的状态计算出一个结果进行输出。比如之前我们提到的计算平均值，就可以把sum和count作为状态放入累加器，而在调用这个方法时相除得到最终结果。这个方法只在窗口要输出结果时调用。
- merge()：合并两个累加器，并将合并后的状态作为一个累加器返回。这个方法只在需要合并窗口的场景下才会被调用；最常见的合并窗口（MergingWindow）的场景就是会话窗口（SessionWindows）。

所以可以看到，AggregateFunction的工作原理是：首先调用createAccumulator()为任务初始化一个状态(累加器)；而后每来一个数据就调用一次add()方法，对数据进行聚合，得到的结果保存在状态中；等到了窗口需要输出时，再调用getResult()方法得到计算结果。很明显，与ReduceFunction相同，AggregateFunction也是增量式的聚合；而由于输入、中间状态、输出的类型可以不同，使得应用更加灵活方便。

下面是一个具体例子。在电商网站中，PV（页面浏览量）和UV（独立访客数）是非常重要的两个流量指标。一般来说，PV统计的是所有的点击量；而对用户id进行去重之后，得到的就是UV。所以有时我们会用PV/UV这个比值，来表示“人均重复访问量”，也就是平均每个用户会访问多少次页面，这在一定程度上代表了用户的粘度。

【实现代码】

```java
package com.kunan.StreamAPI.Window;
import com.kunan.StreamAPI.Source.ClickSource;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.api.common.eventtime.SerializableTimestampAssigner;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.functions.AggregateFunction;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.windowing.assigners.SlidingEventTimeWindows;
import org.apache.flink.streaming.api.windowing.assigners.TumblingEventTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;
import java.time.Duration;
import java.util.HashSet;
//开窗统计pv和uv，两者相除得到平均用户活跃度
public class WindowAggregateTest_PVUV {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        env.getConfig().setAutoWatermarkInterval(100);
        //从元素中读取数据
        SingleOutputStreamOperator<Event> stream = env.addSource(new ClickSource())
                //乱序流的watermark生成
                .assignTimestampsAndWatermarks(WatermarkStrategy.<Event>forBoundedOutOfOrderness(Duration.ZERO)
                        .withTimestampAssigner(new SerializableTimestampAssigner<Event>() {
                            @Override
                            public long extractTimestamp(Event element, long recordTimestamp) {
                                return element.timestamp;
                            }
                        }));
        stream.print("data");
        //所有数据放在一起统计
        stream.keyBy(data -> true)
                        .window(SlidingEventTimeWindows.of(Time.seconds(10),Time.seconds(2)))
                                .aggregate(new AvgPV())
                .print();
        env.execute();
    }
    //自定义一个AggregateFunction 用Long保存PV个数 用HashSet做uv去重
    public static class AvgPV implements AggregateFunction<Event, Tuple2<Long,HashSet<String>>,Double>{
        @Override
        public Tuple2<Long, HashSet<String>> createAccumulator() {
            //创建累加器
            return Tuple2.of(0L,new HashSet<>());
        }
        @Override
        public Tuple2<Long, HashSet<String>> add(Event value, Tuple2<Long, HashSet<String>> accumulator) {
            //每来一条数据，pv个数+1 ，将User放入HashSet当中
            //属于本窗口的数据来一条累加一次，并返回累加器
            accumulator.f1.add(value.user);
            return Tuple2.of(accumulator.f0 + 1,accumulator.f1);
        }
        @Override
        public Double getResult(Tuple2<Long, HashSet<String>> accumulator) {
            //窗口触发时，输出pv和uv的值 增量聚合结束，将计算结果发送到下游
            return (double) accumulator.f0 / accumulator.f1.size();
        }
        @Override
        public Tuple2<Long, HashSet<String>> merge(Tuple2<Long, HashSet<String>> a, Tuple2<Long, HashSet<String>> b) {
            return null;
        }
    }
}
```

代码中我们创建了事件时间滑动窗口，统计10秒钟的“人均PV”，每2秒统计一次。由于聚合的状态还需要做处理计算，因此窗口聚合时使用了更加灵活的AggregateFunction。为了统计UV，我们用一个HashSet保存所有出现过的用户id，实现自动去重；而PV的统计则类似一个计数器，每来一个数据加一就可以了。所以这里的状态，定义为包含一个HashSet和一个count值的二元组（Tuple2,Long>），每来一条数据，就将user存入HashSet，同时count加1。这里的count就是PV，而HashSet中元素的个数（size）就是UV；所以最终窗口的输出结果，就是它们的比值。

这里没有涉及会话窗口，所以merge()方法可以不做任何操作。

另外，Flink也为窗口的聚合提供了一系列预定义的简单聚合方法，可以直接基于WindowedStream调用。主要包括.sum()|max()|maxBy()|min()|minBy()，与KeyedStream的简单聚合非常相似。它们的底层，其实都是通过AggregateFunction来实现的。

通过ReduceFunction和AggregateFunction我们可以发现，增量聚合函数其实就是在用流处理的思路来处理有界数据集，核心是保持一个聚合状态，当数据到来时不停地更新状态。这就是Flink所谓的**有状态的流处理**，通过这种方式可以极大地提高程序运行的效率，所以在实际应用中最为常见。

### 2. 全窗口函数（full window functions）

窗口操作中的另一大类就是全窗口函数。与增量聚合函数不同，**全窗口函数需要先收集窗口中的数据，并在内部缓存起来，等到窗口要输出结果的时候再取出数据进行计算**。

很明显，这就是典型的批处理思路了——先攒数据，等一批都到齐了再正式启动处理流程。这样做毫无疑问是低效的：因为窗口全部的计算任务都积压在了要输出结果的那一瞬间，而在之前收集数据的漫长过程中却无所事事。这就好比平时不用功，到考试之前通宵抱佛脚，肯定不如把工夫花在日常积累上。

那为什么还需要有全窗口函数呢？这是因为有些场景下，我们要做的计算必须基于全部的数据才有效，这时做增量聚合就没什么意义了；另外，输出的结果有可能要包含上下文中的一些信息（比如窗口的起始时间），这是增量聚合函数做不到的。所以，我们还需要有更丰富的窗口计算方式，这就可以用全窗口函数来实现。

在Flink中，全窗口函数也有两种：WindowFunction和ProcessWindowFunction。

1、窗口函数（WindowFunction）

WindowFunction字面上就是“窗口函数”，它其实是老版本的通用窗口函数接口。我们可以基于WindowedStream调用.apply()方法，传入一个WindowFunction的实现类。

```java
stream
 .keyBy(<key selector>)
 .window(<window assigner>)
 .apply(new MyWindowFunction());
```

这个类中可以获取到包含窗口所有数据的可迭代集合（Iterable），还可以拿到窗口 （Window）本身的信息。WindowFunction 接口在源码中实现如下：

```java
public interface WindowFunction<IN, OUT, KEY, W extends Window> extends Function,
Serializable {
void apply(KEY key, W window, Iterable<IN> input, Collector<OUT> out) throws
Exception;
}
```

当窗口到达结束时间需要触发计算时，就会调用这里的apply方法。我们可以从input集合中取出窗口收集的数据，结合key和window信息，通过收集器（Collector）输出结果。这里Collector的用法，与FlatMapFunction中相同。

不过我们也看到了，**WindowFunction能提供的上下文信息较少，也没有更高级的功能。事实上，它的作用可以被ProcessWindowFunction全覆盖，所以之后可能会逐渐弃用。一般在实际应用，直接使用ProcessWindowFunction就可以了**。

2、**处理窗口函数（ProcessWindowFunction）**

ProcessWindowFunction是WindowAPI中最底层的通用窗口函数接口。之所以说它“最底层”，是因为除了可以拿到窗口中的所有数据之外，ProcessWindowFunction还可以获取到一个“上下文对象”（Context）。这个上下文对象非常强大，不仅能够获取窗口信息，还可以访问当前的时间和状态信息。这里的时间就包括了处理时间（processingtime）和事件时间水位线（eventtimewatermark）。这就使得ProcessWindowFunction更加灵活、功能更加丰富。事实上，ProcessWindowFunction是Flink底层API——处理函数（processfunction）中的一员，关于处理函数会在后续学习；

当然，这些好处是以牺牲性能和资源为代价的。作为一个全窗口函数，ProcessWindowFunction同样需要将所有数据缓存下来、等到窗口触发计算时才使用。它其实就是一个增强版的WindowFunction。

具体使用跟WindowFunction非常类似，我们可以基于WindowedStream调用.process()方法，传入一个ProcessWindowFunction的实现类。下面是一个电商网站统计每小时UV的例子：

【实现代码】

```java
package com.kunan.StreamAPI.Window;
import com.kunan.StreamAPI.Source.ClickSource;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.api.common.eventtime.SerializableTimestampAssigner;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.windowing.ProcessWindowFunction;
import org.apache.flink.streaming.api.windowing.assigners.TumblingEventTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.streaming.api.windowing.windows.TimeWindow;
import org.apache.flink.util.Collector;
import java.sql.Timestamp;
import java.time.Duration;
import java.util.HashSet;
public class WindowProcessTest {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        env.getConfig().setAutoWatermarkInterval(100);
        //从元素中读取数据
        SingleOutputStreamOperator<Event> stream = env.addSource(new ClickSource())
                //乱序流的watermark生成
                .assignTimestampsAndWatermarks(WatermarkStrategy.<Event>forBoundedOutOfOrderness(Duration.ZERO)
                        .withTimestampAssigner(new SerializableTimestampAssigner<Event>() {
                            @Override
                            public long extractTimestamp(Event element, long recordTimestamp) {
                                return element.timestamp;
                            }
                        }));
        stream.print("Input_data");
        //使用ProcessWindowFunction计算UV
        stream.keyBy(data -> true)
                        .window(TumblingEventTimeWindows.of(Time.seconds(10)))
                                .process(new UvCountByWindow())
                                        .print();
        env.execute();
    }
    //实现自定义的ProcessWindowFunction，输出一条统计信息
    public static class UvCountByWindow extends ProcessWindowFunction<Event,String,Boolean, TimeWindow>{
        public UvCountByWindow() {
            super();
        }
        @Override
        public void clear(ProcessWindowFunction<Event, String, Boolean, TimeWindow>.Context context) throws Exception {
            super.clear(context);
        }
        @Override
        public void process(Boolean aBoolean, ProcessWindowFunction<Event, String, Boolean, TimeWindow>.Context context, Iterable<Event> elements, Collector<String> out) throws Exception {
            //用一个HashSet保存User
            HashSet<String> userSet = new HashSet<>();
            //从elements中遍历数据，放到set中去重
            for(Event event:elements){
                userSet.add(event.user);
            }
            Integer uv = userSet.size();
            //结合窗口信息
            Long start = context.window().getStart();
            Long end = context.window().getEnd();
            //输出
            out.collect("窗口 "+ new Timestamp(start) + " ~ " + new Timestamp(end)
            + " UV值为：" + uv);
        }
    }
}
```

这里我们使用的是事件时间语义。定义10秒钟的滚动事件窗口后，直接使用ProcessWindowFunction来定义处理的逻辑。我们可以创建一个HashSet，将窗口所有数据的userId写入实现去重，最终得到HashSet的元素个数就是UV值。

当然，这里我们并没有用到上下文中其他信息，所以其实没有必要使用ProcessWindowFunction。全窗口函数因为运行效率较低，很少直接单独使用，往往会和增量聚合函数结合在一起，共同实现窗口的处理计算。

### 3.增量聚合和全窗口函数的结合使用

已经了解了WindowAPI中两类窗口函数的用法，下面我们先来做个简单的总结。

增量聚合函数处理计算会更高效。

举一个最简单的例子，对一组数据求和。大量的数据连续不断到来，全窗口函数只是把它们收集缓存起来，并没有处理；到了窗口要关闭、输出结果的时候，再遍历所有数据依次叠加，得到最终结果。而如果我们采用增量聚合的方式，那么只需要保存一个当前和的状态，每个数据到来时就会做一次加法，更新状态；到了要输出结果的时候，只要将当前状态直接拿出来就可以了。增量聚合相当于把计算量“均摊”到了窗口收集数据的过程中，自然就会比全窗口聚合更加高效、输出更加实时。

而全窗口函数的优势在于提供了更多的信息，可以认为是更加“通用”的窗口操作。它只负责收集数据、提供上下文相关信息，把所有的原材料都准备好，至于拿来做什么我们完全可以任意发挥。这就使得窗口计算更加灵活，功能更加强大。

所以在实际应用中，我们往往希望兼具这两者的优点，把它们结合在一起使用。Flink的WindowAPI就给我们实现了这样的用法。

我们之前在调用WindowedStream的.reduce()和.aggregate()方法时，只是简单地直接传入了一个ReduceFunction或AggregateFunction进行增量聚合。除此之外，其实还可以传入第二个参数：一个全窗口函数，可以是WindowFunction或者ProcessWindowFunction。

```java
// ReduceFunction 与 WindowFunction 结合
public <R> SingleOutputStreamOperator<R> reduce(
 ReduceFunction<T> reduceFunction, WindowFunction<T, R, K, W> function)
// ReduceFunction 与 ProcessWindowFunction 结合
public <R> SingleOutputStreamOperator<R> reduce(
 ReduceFunction<T> reduceFunction, ProcessWindowFunction<T, R, K, W>
function)
// AggregateFunction 与 WindowFunction 结合
public <ACC, V, R> SingleOutputStreamOperator<R> aggregate(AggregateFunction<T, ACC, V> aggFunction, WindowFunction<V, R, K, W>
windowFunction)
// AggregateFunction 与 ProcessWindowFunction 结合
public <ACC, V, R> SingleOutputStreamOperator<R> aggregate(
 AggregateFunction<T, ACC, V> aggFunction,
 ProcessWindowFunction<V, R, K, W> windowFunction)
```

这样调用的处理机制是：基于第一个参数（增量聚合函数）来处理窗口数据，每来一个数据就做一次聚合；等到窗口需要触发计算时，则调用第二个参数（全窗口函数）的处理逻辑输出结果。需要注意的是，这里的全窗口函数就不再缓存所有数据了，而是直接将增量聚合函数的结果拿来当作了Iterable类型的输入。一般情况下，这时的可迭代集合中就只有一个元素了。

下面我们举一个具体的实例来说明。在网站的各种统计指标中，一个很重要的统计指标就是热门的链接；想要得到热门的url，前提是得到每个链接的“热门度”。一般情况下，可以用url的浏览量（点击量）表示热门度。我们这里统计10秒钟的url浏览量，每5秒钟更新一次；另外为了更加清晰地展示，还应该把窗口的起始结束时间一起输出。我们可以定义滑动窗口，并结合增量聚合函数和全窗口函数来得到统计结果。

【实现代码】

```java
package com.kunan.StreamAPI.Window;
import com.kunan.StreamAPI.Source.ClickSource;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.api.common.eventtime.SerializableTimestampAssigner;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.functions.AggregateFunction;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.windowing.ProcessWindowFunction;
import org.apache.flink.streaming.api.windowing.assigners.TumblingEventTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.streaming.api.windowing.windows.TimeWindow;
import org.apache.flink.util.Collector;
import java.time.Duration;
public class UrlCountViewExample {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        env.getConfig().setAutoWatermarkInterval(100);
        SingleOutputStreamOperator<Event> stream = env.addSource(new ClickSource()).
                //乱序流watermark生成
                        assignTimestampsAndWatermarks(WatermarkStrategy.<Event>forBoundedOutOfOrderness(Duration.ZERO)
                        .withTimestampAssigner(new SerializableTimestampAssigner<Event>() {
                            @Override
                            public long extractTimestamp(Event element, long recordTimestamp) {
                                return element.timestamp;
                            }
                        }));
        stream.print("Input");
       //统计每个URl的访问量
       stream.keyBy(data -> data.url)
                       .window(TumblingEventTimeWindows.of(Time.seconds(10)))
               //同时传入增量聚合函数和全窗口函数
                       .aggregate(new UrlViewCountAgg(),new UrlViewCountResult())
                               .print();
        env.execute();
    }
    //增量聚合来一条数据就+1
    public static class UrlViewCountAgg implements AggregateFunction<Event,Long,Long>{
        @Override
        public Long createAccumulator() {
            return 0L;
        }
        @Override
        public Long add(Event value, Long accumulator) {
            return accumulator + 1;
        }
        @Override
        public Long getResult(Long accumulator) {
            return accumulator;
        }
        @Override
        public Long merge(Long a, Long b) {
            return null;
        }
    }
    //包装窗口信息，输出
    public static class UrlViewCountResult extends ProcessWindowFunction<Long,UrlViewCount,String, TimeWindow>{
        public UrlViewCountResult() {
            super();
        }
        @Override
        public void clear(ProcessWindowFunction<Long, UrlViewCount, String, TimeWindow>.Context context) throws Exception {
            super.clear(context);
        }
        @Override
        public void process(String url, ProcessWindowFunction<Long, UrlViewCount, String, TimeWindow>.Context context, Iterable<Long> elements, Collector<UrlViewCount> out) throws Exception {
            // 结合窗口信息，包装输出内容
            Long start = context.window().getStart();
            Long end = context.window().getEnd();
            Long count = elements.iterator().next();
            // 迭代器中只有一个元素，就是增量聚合函数的计算结果
            out.collect(new UrlViewCount(url,count,start,end));
        }
    }
}
```

这里我们为了方便处理，单独定义了一个 POJO 类 UrlViewCount 来表示聚合输出结果的 数据类型，包含了 url、浏览量以及窗口的起始结束时间。

```java
package com.kunan.StreamAPI.Window;
import java.sql.Timestamp;
public class UrlViewCount {
    public String url;
    public Long count;
    public Long windowStart;
    public Long windowEnd;
    public UrlViewCount() {
    }
    public UrlViewCount(String url, Long count, Long windowStart, Long windowEnd) {
        this.url = url;
        this.count = count;
        this.windowStart = windowStart;
        this.windowEnd = windowEnd;
    }
    @Override
    public String toString() {
        return "UrlViewCount{" +
                "url='" + url + '\'' +
                ", count=" + count +
                ", windowStart=" + new Timestamp(windowStart) +
                ", windowEnd=" + new Timestamp(windowEnd) +
                '}';
    }
}
```

代码中用一个AggregateFunction来实现增量聚合，每来一个数据就计数加一；得到的结果交给ProcessWindowFunction，结合窗口信息包装成我们想要的UrlViewCount，最终输出统计结果。

注：ProcessWindowFunction是处理函数中的一种，后面会详细讲解。这里只用它来将增量聚合函数的输出结果包裹一层窗口信息。

窗口处理的主体还是增量聚合，而引入全窗口函数又可以获取到更多的信息包装输出，这样的结合兼具了两种窗口函数的优势，在保证处理性能和实时性的同时支持了更加丰富的应用场景。

## 六、测试水位线和窗口的使用

之前讲过，当水位线到达窗口结束时间时，窗口就会闭合不再接收迟到的数据，因为根据水位线的定义，所有小于等于水位线的数据都已经到达，所以显然Flink会认为窗口中的数据都到达了（尽管可能存在迟到数据，也就是时间戳小于当前水位线的数据）。我们可以在之前生成水位线代码WatermarkTest的基础上，增加窗口应用做一下测试：

【示例代码】

```java
package com.kunan.StreamAPI.Watermark;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.api.common.eventtime.SerializableTimestampAssigner;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.functions.MapFunction;;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.windowing.ProcessWindowFunction;
import org.apache.flink.streaming.api.windowing.assigners.TumblingEventTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.streaming.api.windowing.windows.TimeWindow;
import org.apache.flink.util.Collector;
import java.time.Duration;
public class WaterMark_Window {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env =
                StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        // 将数据源改为 socket 文本流，并转换成 Event 类型
        env.socketTextStream("localhost", 7777)
                .map(new MapFunction<String, Event>() {
                    @Override
                    public Event map(String value) throws Exception {
                        String[] fields = value.split(",");
                        return new Event(fields[0].trim(), fields[1].trim(),
                                Long.valueOf(fields[2].trim()));
                    }
                })
                // 插入水位线的逻辑
                .assignTimestampsAndWatermarks(
                        // 针对乱序流插入水位线，延迟时间设置为 5s
                        WatermarkStrategy.<Event>forBoundedOutOfOrderness(Duration.ofSeconds(5))
                                .withTimestampAssigner(new
                                                               SerializableTimestampAssigner<Event>() {
                                                                   // 抽取时间戳的逻辑
                                                                   @Override
                                                                   public long extractTimestamp(Event element, long
                                                                           recordTimestamp) {
                                                                       return element.timestamp;
                                                                   }
                                                               })
                )
                // 根据 user 分组，开窗统计
                .keyBy(data -> data.user)
                .window(TumblingEventTimeWindows.of(Time.seconds(10)))
                .process(new WatermarkTestResult())
                .print();
        env.execute();
    }
    // 自定义处理窗口函数，输出当前的水位线和窗口信息
    public static class WatermarkTestResult extends ProcessWindowFunction<Event,
            String, String, TimeWindow>{
        @Override
        public void process(String s, Context context, Iterable<Event> elements,
                            Collector<String> out) throws Exception {
            Long start = context.window().getStart();
            Long end = context.window().getEnd();
            Long currentWatermark = context.currentWatermark();
            Long count = elements.spliterator().getExactSizeIfKnown();
            out.collect("窗口" + start + " ~ " + end + "中共有" + count + "个元素， 窗口闭合计算时，水位线处于：" + currentWatermark);
        }
    }
}
```

这里设置的最大延迟时间是 5 秒，所以当在终端启动 nc 程序，也就是 nc –lk 7777 然后输入如下数据时：

```java
Alice, ./home, 1000
Alice, ./cart, 2000
Alice, ./prod?id=100, 10000
Alice, ./prod?id=200, 8000
Alice, ./prod?id=300, 15000
```

会看到如下结果：

```java
窗口 0 ~ 10000 中共有 3 个元素，窗口闭合计算时，水位线处于：9999
```

我们就会发现，当最后输入[Alice,./prod?id=300,15000]时，流中会周期性地（默认200毫秒）插入一个时间戳为15000L–5*1000L–1L=9999毫秒的水位线，已经到达了窗口[0,10000)的结束时间，所以会触发窗口的闭合计算。而后面再输入一条[Alice,./prod?id=200,9000]时，将不会有任何结果；因为这是一条迟到数据，它所属于的窗口已经触发计算然后销毁了（窗口默认被销毁），所以无法再进入到窗口中，自然也就无法更新计算结果了。窗口中的迟到数据默认会被丢弃，这会导致计算结果不够准确。Flink提供了有效处理迟到数据的手段，会在后面详细介绍。

## 七、其他的API

对于一个窗口算子而言，窗口分配器和窗口函数是必不可少的。除此之外，Flink还提供了其他一些可选的API，可以更加灵活地控制窗口行为。

### 1.触发器（Trigger）

触发器主要是用来控制窗口什么时候触发计算。所谓的“触发计算”，本质上就是执行窗口函数，所以可以认为是计算得到结果并输出的过程。

基于WindowedStream调用.trigger()方法，就可以传入一个自定义的窗口触发器（Trigger）

```java
stream.keyBy(...)
 .window(...)
 .trigger(new MyTrigger())
```

Trigger是窗口算子的内部属性，每个窗口分配器（WindowAssigner）都会对应一个默认的触发器；对于Flink内置的窗口类型，它们的触发器都已经做了实现。例如，所有事件时间窗口，默认的触发器都是EventTimeTrigger；类似还有ProcessingTimeTrigger和CountTrigger。所以一般情况下是不需要自定义触发器的，不过我们依然有必要了解它的原理。

Trigger是一个抽象类，自定义时必须实现下面四个抽象方法：

- onElement()：窗口中每到来一个元素，都会调用这个方法。
- onEventTime()：当注册的事件时间定时器触发时，将调用这个方法。
- onProcessingTime()：当注册的处理时间定时器触发时，将调用这个方法。
- clear()：当窗口关闭销毁时，调用这个方法。一般用来清除自定义的状态。

可以看到，除了clear()比较像生命周期方法，其他三个方法其实都是对某种事件的响应。onElement()是对流中数据元素到来的响应；而另两个则是对时间的响应。这几个方法的参数中都有一个“触发器上下文”（TriggerContext）对象，可以用来注册定时器回调（callback）。这里提到的“定时器”（Timer），其实就是我们设定的一个“闹钟”，代表未来某个时间点会执行的事件；当时间进展到设定的值时，就会执行定义好的操作。很明显，对于时间窗口（TimeWindow）而言，就应该是在窗口的结束时间设定了一个定时器，这样到时间就可以触发窗口的计算输出了。关于定时器的内容，我们在后面讲解处理函数（processfunction）时还会提到。

上面的前三个方法可以响应事件，那它们又是怎样跟窗口操作联系起来的呢？这就需要了解一下它们的返回值。这三个方法返回类型都是TriggerResult，这是一个枚举类型（enum），其中定义了对窗口进行操作的四种类型。

- CONTINUE（继续）：什么都不做
- FIRE（触发）：触发计算，输出结果
- PURGE（清除）：清空窗口中的所有数据，销毁窗口
- FIRE_AND_PURGE（触发并清除）：触发计算输出结果，并清除窗口

可以看到，Trigger除了可以控制触发计算，还可以定义窗口什么时候关闭（销毁）。上面的四种类型，其实也就是这两个操作交叉配对产生的结果。一般我们会认为，到了窗口的结束时间，那么就会触发计算输出结果，然后关闭窗口——似乎这两个操作应该是同时发生的；但TriggerResult的定义告诉我们，两者可以分开。稍后我们就会看到它们分开操作的场景。

下面我们举一个例子。在日常业务场景中，我们经常会开比较大的窗口来计算每个窗口的pv或者uv等数据。但窗口开的太大，会使我们看到计算结果的时间间隔变长。所以我们可以使用触发器，来隔一段时间触发一次窗口计算。我们在代码中计算了每个url在10秒滚动窗口的pv指标，然后设置了触发器，每隔1秒钟触发一次窗口的计算。

【示例代码】

```java
package com.kunan.StreamAPI.Window;
import com.kunan.StreamAPI.Source.ClickSource;
import com.kunan.StreamAPI.Source.Event;
import com.kunan.StreamAPI.Window.UrlViewCount;
import org.apache.flink.api.common.eventtime.SerializableTimestampAssigner;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.state.ValueState;
import org.apache.flink.api.common.state.ValueStateDescriptor;
import org.apache.flink.api.common.typeinfo.Types;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import
        org.apache.flink.streaming.api.functions.windowing.ProcessWindowFunction;
import
        org.apache.flink.streaming.api.windowing.assigners.TumblingEventTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.streaming.api.windowing.triggers.Trigger;
import org.apache.flink.streaming.api.windowing.triggers.TriggerResult;
import org.apache.flink.streaming.api.windowing.windows.TimeWindow;
import org.apache.flink.util.Collector;
public class TriggerExample {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env =
                StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        env
                .addSource(new ClickSource())
                .assignTimestampsAndWatermarks(
                        WatermarkStrategy.<Event>forMonotonousTimestamps()
                                .withTimestampAssigner(new
                                                               SerializableTimestampAssigner<Event>() {
                                                                   @Override
                                                                   public long extractTimestamp(Event event, long l) {
                                                                       return event.timestamp;
                                                                   }
                                                               })
                )
                .keyBy(r -> r.url)
                .window(TumblingEventTimeWindows.of(Time.seconds(10)))
                .trigger(new MyTrigger())
                .process(new WindowResult())
                .print();
        env.execute();
    }
    public static class WindowResult extends ProcessWindowFunction<Event,
            UrlViewCount, String, TimeWindow> {
        @Override
        public void process(String s, Context context, Iterable<Event> iterable,
                            Collector<UrlViewCount> collector) throws Exception {
            collector.collect(
                    new UrlViewCount(
                            s,
                            // 获取迭代器中的元素个数
                            iterable.spliterator().getExactSizeIfKnown(),
                            context.window().getStart(),
                            context.window().getEnd()
                    )
            );
        }
    }public static class MyTrigger extends Trigger<Event, TimeWindow> {
        @Override
        public TriggerResult onElement(Event event, long l, TimeWindow timeWindow,
                                       TriggerContext triggerContext) throws Exception {
            ValueState<Boolean> isFirstEvent =
                    triggerContext.getPartitionedState(
                            new ValueStateDescriptor<Boolean>("first-event",
                                    Types.BOOLEAN)
                    );
            if (isFirstEvent.value() == null) {
                for (long i = timeWindow.getStart(); i < timeWindow.getEnd(); i =
                        i + 1000L) {
                    triggerContext.registerEventTimeTimer(i);
                }
                isFirstEvent.update(true);
            }
            return TriggerResult.CONTINUE;
        }
        @Override
        public TriggerResult onEventTime(long l, TimeWindow timeWindow,
                                         TriggerContext triggerContext) throws Exception {
            return TriggerResult.FIRE;
        }
        @Override
        public TriggerResult onProcessingTime(long l, TimeWindow timeWindow,
                                              TriggerContext triggerContext) throws Exception {
            return TriggerResult.CONTINUE;
        }
        @Override
        public void clear(TimeWindow timeWindow, TriggerContext triggerContext)
                throws Exception {
            ValueState<Boolean> isFirstEvent =
                    triggerContext.getPartitionedState(
                            new ValueStateDescriptor<Boolean>("first-event",
                                    Types.BOOLEAN)
                    );
            isFirstEvent.clear();
        }
    }
}
```

### 2.移除器（Evictor）

移除器主要用来定义移除某些数据的逻辑。基于WindowedStream调用.evictor()方法，就可以传入一个自定义的移除器（Evictor）。Evictor是一个接口，不同的窗口类型都有各自预实现的移除器。

```java
stream.keyBy(...)
 .window(...)
 .evictor(new MyEvictor())
```

Evictor接口定义了两个方法：

- evictBefore()：定义执行窗口函数之前的移除数据操作
- evictAfter()：定义执行窗口函数之后的以处数据操作默认情况下，预实现的移除器都是在执行窗口函数（windowfucntions）之前移除数据的。

### 3.允许延迟（Allowed Lateness）

在事件时间语义下，窗口中可能会出现数据迟到的情况。这是因为在乱序流中，水位线（watermark）并不一定能保证时间戳更早的所有数据不会再来。当水位线已经到达窗口结束时间时，窗口会触发计算并输出结果，这时一般也就要销毁窗口了；如果窗口关闭之后，又有本属于窗口内的数据姗姗来迟，默认情况下就会被丢弃。这也很好理解：窗口触发计算就像发车，如果要赶的车已经开走了，又不能坐其他的车（保证分配窗口的正确性），那就只好放弃坐班车了。

不过在多数情况下，直接丢弃数据也会导致统计结果不准确，我们还是希望该上车的人都能上来。为了解决迟到数据的问题，Flink提供了一个特殊的接口，可以为窗口算子设置一个“允许的最大延迟”（AllowedLateness）。也就是说，我们可以设定允许延迟一段时间，在这段时间内，窗口不会销毁，继续到来的数据依然可以进入窗口中并触发计算。直到水位线推进到了窗口结束时间+延迟时间，才真正将窗口的内容清空，正式关闭窗口。

基于WindowedStream调用.allowedLateness()方法，传入一个Time类型的延迟时间，就可以表示允许这段时间内的延迟数据。

```java
stream.keyBy(...)
 .window(TumblingEventTimeWindows.of(Time.hours(1)))
 .allowedLateness(Time.minutes(1))
```

比如上面的代码中，我们定义了 1 小时的滚动窗口，并设置了允许 1 分钟的延迟数据。也 就是说，在不考虑水位线延迟的情况下，对于 8 点~9 点的窗口，本来应该是水位线到达 9 点 整就触发计算并关闭窗口；现在允许延迟 1 分钟，那么 9 点整就只是触发一次计算并输出结果， 并不会关窗。后续到达的数据，只要属于 8 点~9 点窗口，依然可以在之前统计的基础上继续 叠加，并且再次输出一个更新后的结果。直到水位线到达了 9 点零 1 分，这时就真正清空状态、关闭窗口，之后再来的迟到数据就会被丢弃了。

从这里我们就可以看到，窗口的触发计算（Fire）和清除（Purge）操作确实可以分开。不 过在默认情况下，允许的延迟是 0，这样一旦水位线到达了窗口结束时间就会触发计算并清除 窗口，两个操作看起来就是同时发生了。当窗口被清除（关闭）之后，再来的数据就会被丢弃。

### 4.将迟到的数据放入侧输出流

我们自然会想到，即使可以设置窗口的延迟时间，终归还是有限的，后续的数据还是会被丢弃。如果不想丢弃任何一个数据，又该怎么做呢？

Flink还提供了另外一种方式处理迟到数据。我们可以将未收入窗口的迟到数据，放入“侧输出流”（sideoutput）进行另外的处理。所谓的侧输出流，相当于是数据流的一个“分支”，这个流中单独放置那些错过了该上的车、本该被丢弃的数据。

基于WindowedStream调用.sideOutputLateData()方法，就可以实现这个功能。方法需要传入一个“输出标签”（OutputTag），用来标记分支的迟到数据流。因为保存的就是流中的原始数据，所以OutputTag的类型与流中数据类型相同。

```java
DataStream<Event> stream = env.addSource(...);
OutputTag<Event> outputTag = new OutputTag<Event>("late") {};
stream.keyBy(...)
 .window(TumblingEventTimeWindows.of(Time.hours(1)))
.sideOutputLateData(outputTag)
```

将迟到数据放入侧输出流之后，还应该可以将它提取出来。基于窗口处理完成之后的DataStream，调用.getSideOutput()方法，传入对应的输出标签，就可以获取到迟到数据所在的流了。

```java
SingleOutputStreamOperator<AggResult> winAggStream = stream.keyBy(...)
 .window(TumblingEventTimeWindows.of(Time.hours(1)))
.sideOutputLateData(outputTag)
.aggregate(new MyAggregateFunction())
DataStream<Event> lateStream = winAggStream.getSideOutput(outputTag);
```

这里注意，getSideOutput()是SingleOutputStreamOperator的方法，获取到的侧输出流数据类型应该和OutputTag指定的类型一致，与窗口聚合之后流中的数据类型可以不同。

八、窗口的生命周期

熟悉了窗口API的使用，再回头梳理一下窗口本身的生命周期，这也是对窗口所有操作的一个总结。

### 1.窗口的创建

窗口的类型和基本信息由窗口分配器（windowassigners）指定，但窗口不会预先创建好，而是由数据驱动创建。当第一个应该属于这个窗口的数据元素到达时，就会创建对应的窗口。

### 2.窗口计算的触发

除了窗口分配器，每个窗口还会有自己的窗口函数（windowfunctions）和触发器（trigger）。窗口函数可以分为增量聚合函数和全窗口函数，主要定义了窗口中计算的逻辑；而触发器则是指定调用窗口函数的条件。

对于不同的窗口类型，触发计算的条件也会不同。例如，一个滚动事件时间窗口，应该在水位线到达窗口结束时间的时候触发计算，属于“定点发车”；而一个计数窗口，会在窗口中元素数量达到定义大小时触发计算，属于“人满就发车”。所以Flink预定义的窗口类型都有对应内置的触发器。

对于事件时间窗口而言，除去到达结束时间的“定点发车”，还有另一种情形。当我们设置了允许延迟，那么如果水位线超过了窗口结束时间、但还没有到达设定的最大延迟时间，这期间内到达的迟到数据也会触发窗口计算。这类似于没有准时赶上班车的人又追上了车，这时车要再次停靠、开门，将新的数据整合统计进来。

### 3.窗口的销毁

一般情况下，当时间达到了结束点，就会直接触发计算输出结果、进而清除状态销毁窗口。这时窗口的销毁可以认为和触发计算是同一时刻。这里需要注意，Flink中只对时间窗口（TimeWindow）有销毁机制；由于计数窗口（CountWindow）是基于全局窗口（GlobalWindw）实现的，而全局窗口不会清除状态，所以就不会被销毁。

在特殊的场景下，窗口的销毁和触发计算会有所不同。事件时间语义下，如果设置了允许延迟，那么在水位线到达窗口结束时间时，仍然不会销毁窗口；窗口真正被完全删除的时间点，是窗口的结束时间加上用户指定的允许延迟时间。

### 4.窗口API调用总结

WindowAPI首先按照时候按键分区分成两类。keyBy之后的KeyedStream，可以调用.window()方法声明按键分区窗口（KeyedWindows）；而如果不做keyBy，DataStream也可以直接调用.windowAll()声明非按键分区窗口。之后的方法调用就完全一样了。

接下来首先是通过.window().windowAll()方法定义窗口分配器，得到WindowedStream；然后通过各种转换方法（reduce/aggregate/apply/process）给出窗口函数(ReduceFunction/AggregateFunction/ProcessWindowFunction)，定义窗口的具体计算处理逻辑，转换之后重新得到DataStream。这两者必不可少，是窗口算子（WindowOperator）最重要的组成部分。

此外，在这两者之间，还可以基于WindowedStream调用.trigger()自定义触发器、调用.evictor()定义移除器、调用.allowedLateness()指定允许延迟时间、调用.sideOutputLateData()将迟到数据写入侧输出流，这些都是可选的API，一般不需要实现。而如果定义了侧输出流，可以基于窗口聚合之后的DataStream调用.getSideOutput()获取侧输出流。

## 九、迟到数据的处理

有了事件时间、水位线和窗口的相关知识，现在就可以系统性地讨论一下怎样处理迟到数据了。我们知道，所谓的“迟到数据”（latedata），是指某个水位线之后到来的数据，它的时间戳其实是在水位线之前的。所以只有在事件时间语义下，讨论迟到数据的处理才是有意义的。

事件时间里用来表示时钟进展的就是水位线（watermark）。对于乱序流，水位线本身就可以设置一个延迟时间；而做窗口计算时，我们又可以设置窗口的允许延迟时间；另外窗口还有将迟到数据输出到测输出流的用法。所有的这些方法，它们之间有什么关系，又该怎样合理利用呢？下面进行学习。

### 1.设置水位线延迟时间

水位线是事件时间的进展，它是我们整个应用的全局逻辑时钟。水位线生成之后，会随着数据在任务间流动，从而给每个任务指明当前的事件时间。所以从这个意义上讲，水位线是一个覆盖万物的存在，它并不只针对事件时间窗口有效。

之前我们讲到触发器时曾提到过“定时器”，时间窗口的操作底层就是靠定时器来控制触发的。既然是底层机制，定时器自然就不可能是窗口的专利了；事实上它是Flink底层API——处理函数（processfunction）的重要部分。

所以水位线其实是所有事件时间定时器触发的判断标准。那么水位线的延迟，当然也就是全局时钟的滞后，相当于是上帝拨动了琴弦，所有人的表都变慢了。

既然水位线这么重要，那一般情况就不应该把它的延迟设置得太大，否则流处理的实时性就会大大降低。因为水位线的延迟主要是用来对付分布式网络传输导致的数据乱序，而网络传输的乱序程度一般并不会很大，大多集中在几毫秒至几百毫秒。所以实际应用中，我们往往会给水位线设置一个“能够处理大多数乱序数据的小延迟”，视需求一般设在毫秒~秒级。当我们设置了水位线延迟时间后，所有定时器就都会按照延迟后的水位线来触发。如果一个数据所包含的时间戳，小于当前的水位线，那么它就是所谓的“迟到数据”。

### 2.允许窗口处理迟到数据

水位线延迟设置的比较小，那之后如果仍有数据迟到该怎么办？对于窗口计算而言，如果水位线已经到了窗口结束时间，默认窗口就会关闭，那么之后再来的数据就要被丢弃了。

自然想到，Flink的窗口也是可以设置延迟时间，允许继续处理迟到数据的。

这种情况下，由于大部分乱序数据已经被水位线的延迟等到了，所以往往迟到的数据不会太多。这样，我们会在水位线到达窗口结束时间时，先快速地输出一个近似正确的计算结果；然后保持窗口继续等到延迟数据，每来一条数据，窗口就会再次计算，并将更新后的结果输出。这样就可以逐步修正计算结果，最终得到准确的统计值了。

样就可以逐步修正计算结果，最终得到准确的统计值了。类比班车的例子，我们可以这样理解：大多数人是在发车时刻前后到达的，所以我们只要把表调慢，稍微等一会儿，绝大部分人就都上车了，这个把表调慢的时间就是水位线的延迟；到点之后，班车就准时出发了，不过可能还有该来的人没赶上。于是我们就先慢慢往前开，这段时间内，如果迟到的人抓点紧还是可以追上的；如果有人追上来了，就停车开门让他上来，然后车继续向前开。当然我们的车不能一直慢慢开，需要有一个时间限制，这就是窗口的允许延迟时间。一旦超过了这个时间，班车就不再停留，开上高速疾驰而去了。

所以我们将水位线的延迟和窗口的允许延迟数据结合起来，最后的效果就是先快速实时地输出一个近似的结果，而后再不断调整，最终得到正确的计算结果。回想流处理的发展过程，这不就是著名的Lambda架构吗？原先需要两套独立的系统来同时保证实时性和结果的最终正确性，如今Flink一套系统就全部搞定了。

### 3.将迟到数据放入窗口侧输出流

即使我们有了前面的双重保证，可窗口不能一直等下去，最后总要真正关闭。窗口一旦关闭，后续的数据就都要被丢弃了。那如果真的还有漏网之鱼又该怎么办呢？

那就要用到最后一招了：用窗口的侧输出流来收集关窗以后的迟到数据。这种方式是最后“兜底”的方法，只能保证数据不丢失；因为窗口已经真正关闭，所以是无法基于之前窗口的结果直接做更新的。我们只能将之前的窗口计算结果保存下来，然后获取侧输出流中的迟到数据，判断数据所属的窗口，手动对结果进行合并更新。尽管有些烦琐，实时性也不够强，但能够保证最终结果一定是正确的。

如果还用赶班车来类比，那就是车已经上高速开走了，这班车是肯定赶不上了。不过我们还留下了行进路线和联系方式，迟到的人如果想办法辗转到了目的地，还是可以和大部队会合的。最终，所有该到的人都会在目的地出现。

所以总结起来，Flink处理迟到数据，对于结果的正确性有三重保障：水位线的延迟，窗口允许迟到数据，以及将迟到数据放入窗口侧输出流。可以回忆一下之前统计每个url浏览次数的代码UrlViewCountExample，稍作改进，增加处理迟到数据的功能。

【实现代码】

```java
package com.kunan.StreamAPI.Window;
import com.kunan.StreamAPI.Source.ClickSource;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.api.common.eventtime.SerializableTimestampAssigner;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.functions.MapFunction;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.windowing.assigners.TumblingEventTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.util.OutputTag;
import java.time.Duration;
public class LateDataTest {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        env.getConfig().setAutoWatermarkInterval(100);
        // 将数据源改为 socket 文本流，并转换成 Event类型
        SingleOutputStreamOperator<Event> stream = env.socketTextStream("hadoop102", 7777)
                .map(new MapFunction<String, Event>() {
                    @Override
                    public Event map(String value) throws Exception {
                        String[] split = value.split(",");
                        return new Event(split[0].trim(), split[1].trim(), Long.valueOf(split[2].trim()));
                    }
                });
        //// 方式一、针对乱序流插入水位线，延迟时间设置为2s
        SingleOutputStreamOperator<Event> streams = stream.assignTimestampsAndWatermarks(WatermarkStrategy.<Event>forBoundedOutOfOrderness(Duration.ofSeconds(2))
                .withTimestampAssigner(new SerializableTimestampAssigner<Event>() {
                    @Override
                    public long extractTimestamp(Event element, long recordTimestamp) {
                        return element.timestamp;
                    }
                }));
        streams.print("输入数据:");
        //定义一个输出标签
        OutputTag<Event> late = new OutputTag<Event>("late"){};
        SingleOutputStreamOperator<UrlViewCount> result = streams.keyBy(data -> data.url)
                .window(TumblingEventTimeWindows.of(Time.seconds(10)))
                //方式二：允许窗口处理迟到数据，设置 1 分钟的等待时间
                .allowedLateness(Time.minutes(1))
                .sideOutputLateData(late)
                .aggregate(new UrlCountViewExample.UrlViewCountAgg(), new UrlCountViewExample.UrlViewCountResult());
        result.print("输出数据：");
        //方式三：将最后的迟到数据输出到侧输出流
        result.getSideOutput(late).print("侧输出流：");
        env.execute();
    }
}
```

先启动nc –lk 7777，然后依次输入以下数据：

```java
Alice, ./home, 1000
Alice, ./home, 2000
Alice, ./home, 10000
Alice, ./home, 9000
Alice, ./cart, 12000
```

来分析一下程序的运行过程。当输入数据[Alice,./home,10000]时，时间戳为10000，由于设置了2秒钟的水位线延迟时间，所以此时水位线到达了8秒（事实上是7999毫秒，这里不再追究减1的细节），并没有触发[0,10s)窗口的计算；所以接下来时间戳为9000的数据到来，同样可以直接进入窗口做增量聚合。当时间戳为12000的数据到来时（无所谓url是什么，所有数据都可以推动水位线前进），水位线到达了12000–2*1000=10000，所以触发了[0,10s)窗口的计算，第一次输出了窗口统计结果，如下所示：

```java
输出数据：> UrlViewCount{url='./home', count=3, windowStart=1970-01-01 08:00:00.0, windowEnd=1970-01-01 08:00:10.0}
```

这里count值为3，就包括了之前输入的时间戳为1000、2000、9000的三条数据。

不过窗口触发计算之后并没有关闭销毁，而是继续等待迟到数据。之后时间戳为15000的数据继续推进水位线，此时时钟已经进展到了13000ms；此时再来一条时间戳为9000的数据，我们会发现立即输出了一条统计结果：

输入：

```java
Alice, ./prod?id=100, 15000
Alice, ./home, 9000
```

输出：

```java
输出数据：> UrlViewCount{url='./home', count=4, windowStart=1970-01-01 08:00:00.0, windowEnd=1970-01-01 08:00:10.0}
```

很明显，这仍然是[0,10s)的窗口，在之前计数值3的基础上继续叠加，更新统计结果为4。所以允许窗口处理迟到数据之后，相当于窗口有了一段等待时间，在这期间所有的迟到数据都会立即触发窗口计算，更新之前的结果。

因此，之后时间戳为8000的数据到来，同样会立即输出：

输入：

```java
Alice, ./home, 8000
```

输出：

```java
输出数据：> UrlViewCount{url='./home', count=5, windowStart=1970-01-01 08:00:00.0, windowEnd=1970-01-01 08:00:10.0}
```

我们设置窗口等待的时间为1分钟，所以当时间推进到10000+60*1000=70000时，窗口就会真正被销毁。此前的所有迟到数据可以直接更新窗口的计算结果，而之后的迟到数据已经无法整合进窗口，就只能用侧输出流来捕获了。需要注意的是，这里的“时间”依然是由水位线来指示的，所以时间戳为70000的数据到来，并不会触发窗口的销毁；当时间戳为72000的数据到来，水位线推进到了72000–2*1000=70000，此时窗口真正销毁关闭，之后再来的迟到数据就会输出到侧输出流了：

输入：

```java
Alice, ./prod?id=200, 70000
Alice, ./home, 8000
Alice, ./prod?id=300, 72000
Alice, ./home, 8000
```

输出：

```java
侧输出流：> Event{user='Alice', url='./home', timestamp=1970-01-01 08:00:08.0}
```

## 十、总结

在流处理中，由于对实时性的要求非常高，同时又要求能够保证窗口操作结果的正确，所以必须引入水位线来描述事件时间。而窗口正是时间相关的最佳应用场景，所以Flink为我们提供了丰富的窗口类型和处理操作；与此同时，在实际应用中很难对乱序流给出一个最佳延迟时间，单独依赖水位线去保证结果正确性是不够的，所以需要结合窗口（Window）处理迟到数据的相关API。本章详细了解了Flink中时间语义和水位线的概念、窗口API的用法以及处理迟到数据的相关知识，这些内容对于实时流处理来说非常重要。

Flink的时间语义和窗口，主要就是为了处理大规模的乱序数据流时，同时保证低延迟、高吞吐和结果的正确性。这部分设计基本上是对谷歌（Google）著名论文《数据流模型：一种在大规模、无界、无序数据处理中平衡正确性、延迟和性能的实用方法》（TheDataflowModel:APracticalApproachtoBalancingCorrectness,Latency,andCostinMassive-Scale,Unbounded,Out-of-OrderDataProcessing）的具体实现，有兴趣可以读一下原始论文，会对流处理有更加深刻的理解。
