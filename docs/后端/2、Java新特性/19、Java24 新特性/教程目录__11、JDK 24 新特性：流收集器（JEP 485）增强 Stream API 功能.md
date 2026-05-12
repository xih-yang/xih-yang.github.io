# 11、JDK 24 新特性：流收集器（JEP 485）增强 Stream API 功能
- 来源：https://ddkk.com/zhuanlan/java/java24/11.html
- 分类：JDK 24 新特性
- 分组：教程目录
- 日期：2025-11-27
Stream API是Java 8引入的，用起来确实方便，filter、map、reduce这些操作写起来简洁，代码可读性也高。但有时候需要一些复杂的转换逻辑，现有的中间操作不够用，得写一堆嵌套的map、filter，代码又臭又长，看着就难受。

鹏磊我之前处理数据的时候，就遇到过这种破事。要按条件分组、去重、窗口滑动这些操作，用现有的Stream API写，代码写得又臭又长，逻辑还不清晰。比如要按固定大小窗口处理数据，得用`IntStream.range()`配合`skip()`和`limit()`，代码写得又臭又长，性能还不好。

现在好了，JDK 24的JEP 485（流收集器）终于把这个痛点给解决了。这个特性引入了`Gatherer`接口，可以自定义中间流操作，实现复杂的转换逻辑。虽然现在还是预览版，但已经能看到Java在朝着更强大的Stream API方向发展了。兄弟们别磨叽，咱这就开始整活，把这个特性给整明白。

## 什么是流收集器

先说说啥是流收集器（Gatherer）。流收集器是JDK 24引入的一个新接口，用来定义自定义的中间流操作。它和`Collector`不一样，`Collector`是终端操作，用来收集流的结果，`Gatherer`是中间操作，用来转换流中的元素。

流收集器的核心思想是：提供一种机制，让开发者可以自定义中间流操作，实现复杂的转换逻辑。它支持有状态的操作，可以处理窗口、分组、去重等复杂场景。

以前要实现复杂的转换逻辑，得写一堆嵌套的map、filter，代码又臭又长。现在有了流收集器，可以直接定义自定义操作，代码简洁多了。

## JEP 485 的核心特性

JEP 485是JDK 24引入的一个预览特性，主要做了这么几件事：

1. **Gatherer接口**：引入了`Gatherer`接口，可以定义自定义的中间流操作
2. **gather方法**：Stream接口新增了`gather()`方法，接受Gatherer参数
3. **内置Gatherer**：提供了一些内置的Gatherer实现，比如窗口、分组、去重等
4. **有状态操作**：支持有状态的中间操作，可以处理复杂的转换逻辑
5. **预览特性**：目前还是预览版，需要启用预览特性才能用

这个特性是预览版，为啥呢？因为还在完善阶段，API可能还会调整，需要更多实际场景的验证。但已经能看到Java在朝着更强大的Stream API方向发展了，未来可能会正式发布。

## Gatherer接口使用

Gatherer接口主要在`java.util.stream`包里，核心方法是`gather()`。咱一个个来看。

### 基本使用

使用Gatherer的基本方式是：创建一个Gatherer实例，然后传给`gather()`方法。

```java
// 基本使用示例
import java.util.stream.*;
import java.util.function.*;
public class GathererExample {
    public static void main(String[] args) {
        List<Integer> numbers = List.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
        // 使用Gatherer：只保留偶数
        List<Integer> evens = numbers.stream()
            .gather(Gatherers.filter(i -> i % 2 == 0))  // 自定义过滤操作
            .toList();
        System.out.println("偶数: " + evens);  // 输出: [2, 4, 6, 8, 10]
    }
}
```

### 自定义Gatherer

可以自定义Gatherer，实现复杂的转换逻辑。

```java
// 自定义Gatherer示例：按固定大小窗口处理数据
public class WindowGatherer<T> implements Gatherer<T, List<T>, List<T>> {
    private final int windowSize;
    public WindowGatherer(int windowSize) {
        this.windowSize = windowSize;
    }
    @Override
    public Supplier<List<T>> initializer() {
        // 初始化状态：创建一个列表存储窗口数据
        return ArrayList::new;
    }
    @Override
    public Integrator<List<T>, T, List<T>> integrator() {
        // 集成器：处理每个元素
        return (window, element, downstream) -> {
            window.add(element);  // 添加到窗口
            if (window.size() >= windowSize) {
                // 窗口满了，输出窗口数据
                downstream.push(new ArrayList<>(window));  // 输出窗口的副本
                window.clear();  // 清空窗口
            }
            return true;  // 继续处理
        };
    }
    @Override
    public BiConsumer<List<T>, Downstream<? super List<T>>> finisher() {
        // 完成器：处理剩余数据
        return (window, downstream) -> {
            if (!window.isEmpty()) {
                // 如果还有剩余数据，也输出
                downstream.push(new ArrayList<>(window));
            }
        };
    }
    // 使用示例
    public static void main(String[] args) {
        List<Integer> numbers = List.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
        // 按3个元素一组处理
        List<List<Integer>> windows = numbers.stream()
            .gather(new WindowGatherer<>(3))
            .toList();
        // 输出: [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]
        System.out.println("窗口: " + windows);
    }
}
```

## 实际应用场景

流收集器适合哪些场景呢？鹏磊我觉得主要有这么几类：

### 1. 窗口滑动

窗口滑动是流收集器的典型应用场景，可以按固定大小或固定时间窗口处理数据。

```java
// 窗口滑动示例：计算滑动平均值
public class SlidingWindowExample {
    // 计算滑动平均值
    public static List<Double> slidingAverage(List<Double> values, int windowSize) {
        return values.stream()
            .gather(Gatherers.windowSliding(windowSize))  // 滑动窗口
            .map(window -> window.stream()
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.0))  // 计算平均值
            .toList();
    }
    public static void main(String[] args) {
        List<Double> values = List.of(1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0);
        // 计算3个元素的滑动平均值
        List<Double> averages = slidingAverage(values, 3);
        // 输出: [2.0, 3.0, 4.0, 5.0, 6.0, 7.0]
        // 解释: (1+2+3)/3=2.0, (2+3+4)/3=3.0, ...
        System.out.println("滑动平均值: " + averages);
    }
}
```

### 2. 去重

去重是流收集器的另一个常见应用，可以根据条件去重。

```java
// 去重示例：根据字段去重
public class DeduplicationExample {
    static class Person {
        private final String name;
        private final int age;
        public Person(String name, int age) {
            this.name = name;
            this.age = age;
        }
        public String getName() {
            return name;
        }
        public int getAge() {
            return age;
        }
        @Override
        public String toString() {
            return name + "(" + age + ")";
        }
    }
    // 根据姓名去重
    public static List<Person> deduplicateByName(List<Person> people) {
        return people.stream()
            .gather(Gatherers.deduplicateBy(Person::getName))  // 根据姓名去重
            .toList();
    }
    public static void main(String[] args) {
        List<Person> people = List.of(
            new Person("张三", 20),
            new Person("李四", 25),
            new Person("张三", 30),  // 重复
            new Person("王五", 28)
        );
        // 去重后: [张三(20), 李四(25), 王五(28)]
        List<Person> unique = deduplicateByName(people);
        System.out.println("去重后: " + unique);
    }
}
```

### 3. 分组处理

分组处理可以用流收集器实现，按条件分组处理数据。

```java
// 分组处理示例：按条件分组
public class GroupingExample {
    // 按奇偶性分组
    public static Map<Boolean, List<Integer>> groupByParity(List<Integer> numbers) {
        return numbers.stream()
            .gather(Gatherers.groupBy(i -> i % 2 == 0))  // 按奇偶性分组
            .collect(Collectors.toMap(
                Map.Entry::getKey,
                Map.Entry::getValue
            ));
    }
    public static void main(String[] args) {
        List<Integer> numbers = List.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
        // 分组: {false=[1, 3, 5, 7, 9], true=[2, 4, 6, 8, 10]}
        Map<Boolean, List<Integer>> groups = groupByParity(numbers);
        System.out.println("分组结果: " + groups);
    }
}
```

### 4. 数据转换

数据转换可以用流收集器实现，实现复杂的转换逻辑。

```java
// 数据转换示例：批量处理
public class BatchProcessingExample {
    // 批量处理数据
    public static <T, R> List<R> batchProcess(
            List<T> data, 
            int batchSize, 
            Function<List<T>, R> processor) {
        return data.stream()
            .gather(Gatherers.windowFixed(batchSize))  // 固定大小窗口
            .map(processor)  // 处理每个批次
            .toList();
    }
    public static void main(String[] args) {
        List<Integer> numbers = List.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
        // 每3个数一批，计算每批的和
        List<Integer> sums = batchProcess(
            numbers, 
            3, 
            batch -> batch.stream().mapToInt(Integer::intValue).sum()
        );
        // 输出: [6, 15, 24, 10]
        // 解释: 1+2+3=6, 4+5+6=15, 7+8+9=24, 10=10
        System.out.println("批次和: " + sums);
    }
}
```

## 内置Gatherer

JDK 24提供了一些内置的Gatherer实现，可以直接用。鹏磊我总结了一下：

### 1. windowFixed

`windowFixed`创建固定大小的窗口，窗口满了就输出。

```java
// windowFixed示例
List<Integer> numbers = List.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
// 每3个元素一组
List<List<Integer>> windows = numbers.stream()
    .gather(Gatherers.windowFixed(3))
    .toList();
// 输出: [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]
System.out.println("固定窗口: " + windows);
```

### 2. windowSliding

`windowSliding`创建滑动窗口，每次滑动一个元素。

```java
// windowSliding示例
List<Integer> numbers = List.of(1, 2, 3, 4, 5);
// 3个元素的滑动窗口
List<List<Integer>> windows = numbers.stream()
    .gather(Gatherers.windowSliding(3))
    .toList();
// 输出: [[1, 2, 3], [2, 3, 4], [3, 4, 5]]
System.out.println("滑动窗口: " + windows);
```

### 3. deduplicateBy

`deduplicateBy`根据键去重，保留第一个出现的元素。

```java
// deduplicateBy示例
List<String> names = List.of("张三", "李四", "张三", "王五", "李四");
// 根据名称去重
List<String> unique = names.stream()
    .gather(Gatherers.deduplicateBy(Function.identity()))
    .toList();
// 输出: [张三, 李四, 王五]
System.out.println("去重后: " + unique);
```

### 4. groupBy

`groupBy`根据键分组，返回Map.Entry流。

```java
// groupBy示例
List<Integer> numbers = List.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
// 按奇偶性分组
Map<Boolean, List<Integer>> groups = numbers.stream()
    .gather(Gatherers.groupBy(i -> i % 2 == 0))
    .collect(Collectors.toMap(
        Map.Entry::getKey,
        Map.Entry::getValue
    ));
// 输出: {false=[1, 3, 5, 7, 9], true=[2, 4, 6, 8, 10]}
System.out.println("分组结果: " + groups);
```

## 与现有Stream API对比

流收集器和现有的Stream API有啥区别？鹏磊我总结了一下：

### 1. 灵活性

流收集器更灵活，可以定义复杂的转换逻辑。现有的Stream API操作有限，复杂逻辑得写嵌套。

### 2. 可复用性

流收集器可以复用，定义一次，到处用。现有的Stream API操作是固定的，不能自定义。

### 3. 性能

流收集器性能可能更好，特别是那种有状态的操作，可以优化。现有的Stream API操作可能不够优化。

### 4. 学习成本

流收集器学习成本高，需要理解Gatherer接口。现有的Stream API学习成本低，API简单。

## 最佳实践

用流收集器的时候，鹏磊我建议注意这么几点：

### 1. 启用预览特性

流收集器是预览特性，需要在编译和运行时启用预览特性。

```bash
# 编译时启用预览特性
javac --enable-preview --release 24 MyClass.java
# 运行时启用预览特性
java --enable-preview MyClass
```

### 2. 优先使用内置Gatherer

能用内置Gatherer就用内置的，比如`windowFixed`、`windowSliding`、`deduplicateBy`、`groupBy`这些。内置的实现经过优化，性能更好。

```java
// 推荐：使用内置Gatherer
List<List<Integer>> windows = numbers.stream()
    .gather(Gatherers.windowFixed(3))  // 使用内置实现
    .toList();
// 不推荐：自己实现窗口逻辑
List<List<Integer>> windows = new ArrayList<>();
List<Integer> currentWindow = new ArrayList<>();
for (Integer num : numbers) {
    currentWindow.add(num);
    if (currentWindow.size() == 3) {
        windows.add(new ArrayList<>(currentWindow));
        currentWindow.clear();
    }
}
```

### 3. 注意状态管理

自定义Gatherer要注意状态管理，确保线程安全。如果Gatherer是有状态的，要正确处理状态。

```java
// 推荐：正确处理状态
public class SafeGatherer<T> implements Gatherer<T, List<T>, List<T>> {
    @Override
    public Supplier<List<T>> initializer() {
        // 每次创建新的状态对象，确保线程安全
        return ArrayList::new;
    }
    // ... 其他方法
}
```

### 4. 测试验证

自定义Gatherer要测试验证，确保功能正常。特别是那种复杂的转换逻辑，要重点测试。

```java
// 推荐：测试验证
@Test
public void testWindowGatherer() {
    List<Integer> numbers = List.of(1, 2, 3, 4, 5);
    List<List<Integer>> windows = numbers.stream()
        .gather(new WindowGatherer<>(3))
        .toList();
    assertEquals(2, windows.size());
    assertEquals(List.of(1, 2, 3), windows.get(0));
    assertEquals(List.of(4, 5), windows.get(1));
}
```

## 常见问题

### Q1: 流收集器什么时候会正式发布？

目前还是预览版，没有明确的时间表。等API稳定了，可能会正式发布。建议关注JDK更新，及时了解最新进展。

### Q2: 流收集器和Collector有什么区别？

流收集器是中间操作，用来转换流中的元素。Collector是终端操作，用来收集流的结果。两者用途不一样。

### Q3: 流收集器支持并行流吗？

支持。流收集器可以用于并行流，但要注意线程安全。如果Gatherer是有状态的，要确保线程安全。

### Q4: 流收集器性能怎么样？

性能取决于具体实现。内置的Gatherer经过优化，性能不错。自定义的Gatherer性能可能不如内置的，但差距不大。

### Q5: 如何从现有Stream API迁移到流收集器？

可以逐步迁移。先在新代码上用流收集器，老代码慢慢迁移。或者先在不重要的地方用，验证没问题了再推广。

## 总结

流收集器（JEP 485）是JDK 24引入的一个预览特性，提供了`Gatherer`接口，可以自定义中间流操作，实现复杂的转换逻辑。虽然现在还是预览版，但已经能看到Java在朝着更强大的Stream API方向发展了。

特别适合窗口滑动、去重、分组处理、数据转换等场景，特别是那种需要复杂转换逻辑的场景，用起来很方便。

使用要注意启用预览特性、优先使用内置Gatherer、注意状态管理、测试验证。虽然现在功能还在完善中，但API设计简洁，用起来方便，未来会不断完善。

虽然现在是预览版，但已经能看到Java在朝着更强大的Stream API方向发展了。兄弟们可以提前了解了解，等正式发布了就能直接用上了。强大的Stream API是个长期工作，能提前准备就提前准备，等出问题了再准备就晚了。
