# 13、Java并发编程 - Stream流式计算
- 来源：https://ddkk.com/zhuanlan/java/concurrency/7/13.html
- 分类：Java并发
- 分组：教程目录
## 13、Stream流式计算

使用Stream流式计算，将大大提高效率！

### 13.1. 流的基本概念

#### 13.1.1 什么是流？

**Stream是操作集合的一种计算数据的工具！集合就是数据，Stream是计算集合中的数据的工具**

流是Java8引入的全新概念，它用来处理集合中的数据，暂且可以把它理解为一种高级集合。

集合操作非常麻烦，若要对集合进行筛选、投影，需要写大量的代码，而流是以声明的形式操作集合，它就像SQL语句，我们只需告诉流需要对集合进行什么操作，它就会自动进行操作，并将执行结果交给你，无需我们自己手写代码。

因此，流的集合操作对我们来说是透明的，我们只需向流下达命令，它就会自动把我们想要的结果给我们。由于操作过程完全由Java处理，因此它可以根据当前硬件环境选择最优的方法处理，我们也无需编写复杂又容易出错的多线程代码了。

#### 13.1.2 流的特点

1、只能遍历一次

我们可以把流想象成一条流水线，流水线的源头是我们的数据源(一个集合)，数据源中的元素依次被输送到流水线上，我们可以在流水线上对元素进行各种操作。一旦元素走到了流水线的另一头，那么这些元素就被“消费掉了”，我们无法再对这个流进行操作。当然，我们可以从数据源那里再获得一个新的流重新遍历一遍。

2、采用内部迭代方式

若要对集合进行处理，则需我们手写处理代码，这就叫做外部迭代。而要对流进行处理，我们只需告诉流我们需要什么结果，处理过程由流自行完成，这就称为内部迭代。

#### 13.1.3 流的操作种类

流的操作分为两种，分别为中间操作 和 终端操作。

操作类型
操作方法
说明

中间操作(Intermediate)
map (mapToInt, flatMap 等)、 filter、 distinct、 sorted、 peek、 limit、 skip、 parallel、 sequential、 unordered
当数据源中的数据上了流水线后，这个过程对数据进行的所有操作都称为“中间操作”。
中间操作仍然会返回一个流对象，因此多个中间操作可以串连起来形成一个流水线。

终端操作(Terminal)
forEach、 forEachOrdered、 toArray、 reduce、 collect、 min、 max、 count、 anyMatch、 allMatch、 noneMatch、 findFirst、 findAny、 iterator
当所有的中间操作完成后，若要将数据从流水线上拿下来，则需要执行终端操作。
终端操作将返回一个执行结果，这就是你想要的数据。

短路操作(Short-circuiting)
anyMatch、 allMatch、 noneMatch、 findFirst、 findAny、 limit
从以上两种操作中，还可以总结出短路操作

#### 13.1.4 流的操作过程

> 获取一个数据源（source）→ 数据转换→执行操作获取想要的结果。

**每次转换原有 Stream 对象不改变，返回一个新的 Stream 对象（可以有多次转换），这就允许对其操作可以像链条一样排列，变成一个管道**，如下图所示（图片来源于网络）：

使用流一共需要三步：

1.准备一个数据源

2.执行中间操作：中间操作可以有多个，它们可以串连起来形成流水线。

3.执行终端操作

执行终端操作后本次流结束，你将获得一个执行结果。

### 13.2. 流的使用

#### 13.2.1 获取流

在使用流之前，首先需要拥有一个数据源，并通过StreamAPI提供的一些方法获取该数据源的流对象。数据源可以有多种形式：

（1）集合

这种数据源较为常用，通过stream()方法即可获取流对象：

```java
List<Person> list = new ArrayList<Person>(); 
Stream<Person> stream = list.stream();
Collection.stream();
Collection.parallelStream();
Arrays.stream(T array) or Stream.of()
```

（2）数组

通过Arrays类提供的静态函数stream()获取数组的流对象：

```java
String[] names = {
     "chaimm","peter","john"};
Stream<String> stream = Arrays.stream(names);
```

（3）值

直接将几个值变成流对象：

```java
Stream<String> stream = Stream.of("chaimm","peter","john");
```

（4）文件

```java
try(Stream lines = Files.lines(Paths.get(“文件路径名”),Charset.defaultCharset())){
//可对lines做一些操作
}catch(IOException e){
}
```

PS：Java7简化了IO操作，把打开IO操作放在try后的括号中即可省略关闭IO的代码。

（5）从 BufferedReader

```java
java.io.BufferedReader.lines();
```

（6）静态工厂

```java
java.util.stream.IntStream.range();
java.nio.file.Files.walk();
```

（7）自己构建

```java
java.util.Spliterator;
```

（8）其它

```java
Random.ints();
BitSet.stream();
Pattern.splitAsStream(java.lang.CharSequence);
JarFile.stream();
```

#### 13.2.2 筛选filter

filter函数接收一个Lambda表达式作为参数，该表达式返回boolean，在执行过程中，流将元素逐一输送给filter，并筛选出执行结果为true的元素。

如，筛选出所有学生：

```java
List<Person> result = list.stream()
                    .filter(Person::isStudent)
                    .collect(toList());
```

#### 13.2.3 去重distinct

去掉重复的结果：

**2、** 3去重distinct；

去掉重复的结果：

```java
List<Person> result = list.stream()
                    .distinct()
                    .collect(toList());
```

#### 13.2.4 截取

截取流的前N个元素：

```java
List<Person> result = list.stream()
                    .limit(3)
                    .collect(toList());
```

#### 13.2.5 跳过

跳过流的前n个元素：

```java
List<Person> result = list.stream()
                    .skip(3)
                    .collect(toList());
```

#### 13.2.6 映射

对流中的每个元素执行一个函数，使得元素转换成另一种类型输出。流会将每一个元素输送给map函数，并执行map中的Lambda表达式，最后将执行结果存入一个新的流中。

如，获取每个人的姓名(实则是将Perosn类型转换成String类型)：

```java
List<Person> result = list.stream()
                    .map(Person::getName)
                    .collect(toList());
```

#### 13.2.7 合并多个流

例：列出List中各不相同的单词，List集合如下：

```java
List<String> list = new ArrayList<String>();
list.add("I am a boy");
list.add("I love the girl");
list.add("But the girl loves another girl");
```

思路如下：

首先将list变成流：

```java
list.stream();
```

按空格分词：

```java
list.stream()
            .map(line->line.split(" "));
```

分完词之后，每个元素变成了一个String[]数组。

将每个String[]变成流：

```java
list.stream()
            .map(line->line.split(" "))
            .map(Arrays::stream)
```

此时一个大流里面包含了一个个小流，我们需要将这些小流合并成一个流。

将小流合并成一个大流：用flagmap替换刚才的map

去重

```java
list.stream()
            .map(line->line.split(" "))
            .flagmap(Arrays::stream)
            .distinct()
            .collect(toList());
```

#### 13.2.8 是否匹配任一元素：anyMatch

anyMatch用于判断流中是否存在至少一个元素满足指定的条件，这个判断条件通过Lambda表达式传递给anyMatch，执行结果为boolean类型。

如，判断list中是否有学生：

```java
boolean result = list.stream()
            .anyMatch(Person::isStudent);
```

#### 13.2.9 是否匹配所有元素：allMatch

allMatch用于判断流中的所有元素是否都满足指定条件，这个判断条件通过Lambda表达式传递给anyMatch，执行结果为boolean类型。

如，判断是否所有人都是学生：

```java
boolean result = list.stream()
            .allMatch(Person::isStudent);
```

#### 13.2.10 是否未匹配所有元素：noneMatch

noneMatch与allMatch恰恰相反，它用于判断流中的所有元素是否都不满足指定条件：

```java
boolean result = list.stream()
            .noneMatch(Person::isStudent);
```

#### 13.2.11 获取任一元素findAny

findAny能够从流中随便选一个元素出来，它返回一个Optional类型的元素。

```java
Optional<Person> person = list.stream()
                                    .findAny();
```

#### 13.2.12.Optional介绍

Optional是Java8新加入的一个容器，这个容器只存1个或0个元素，它用于防止出现NullpointException，它提供如下方法：

- isPresent() ：判断容器中是否有值。
- ifPresent(Consume lambda)：容器若不为空则执行括号中的Lambda表达式。
- T get() ：获取容器中的元素，若容器为空则抛出NoSuchElement异常。
- T orElse(T other)：获取容器中的元素，若容器为空则返回括号中的默认值。

获取第一个元素findFirst

```java
Optional<Person> person = list.stream()
                                    .findFirst();
```

#### 13.2.13 归约

归约是将集合中的所有元素经过指定运算，折叠成一个元素输出，如：求最值、平均数等，这些操作都是将一个集合的元素折叠成一个元素输出。

在流中，reduce函数能实现归约。

reduce函数接收两个参数：

- 初始值
- 进行归约操作的Lambda表达式

##### 13.2.13.1 元素求和：自定义Lambda表达式实现求和

例：计算所有人的年龄总和

```java
int age = list.stream().reduce(0, (person1,person2)->person1.getAge()+person2.getAge());
```

reduce的第一个参数表示初试值为0；

reduce的第二个参数为需要进行的归约操作，它接收一个拥有两个参数的Lambda表达式，reduce会把流中的元素两两输给Lambda表达式，最后将计算出累加之和。

##### 13.2.13.2 元素求和：使用Integer.sum函数求和

上面的方法中我们自己定义了Lambda表达式实现求和运算，如果当前流的元素为数值类型，那么可以使用Integer提供了sum函数代替自定义的Lambda表达式，如：

```java
int age = list.stream().reduce(0, Integer::sum);
```

Integer类还提供了min、max等一系列数值操作，当流中元素为数值类型时可以直接使用。

#### 13.2.14 数值流的使用

采用reduce进行数值操作会涉及到基本数值类型和引用数值类型之间的装箱、拆箱操作，因此效率较低。

当流操作为纯数值操作时，使用数值流能获得较高的效率。

##### 13.2.14.1 将普通流转换成数值流

StreamAPI提供了三种数值流：IntStream、DoubleStream、LongStream，也提供了将普通流转换成数值流的三种方法：mapToInt、mapToDouble、mapToLong。

如，将Person中的age转换成数值流：

```java
IntStream stream = list.stream()
                            .mapToInt(Person::getAge);
```

##### 13.2.14.2 数值计算

每种数值流都提供了数值计算函数，如max、min、sum等。

如，找出最大的年龄：

```java
OptionalInt maxAge = list.stream()
                                .mapToInt(Person::getAge)
                                .max();
```

由于数值流可能为空，并且给空的数值流计算最大值是没有意义的，因此max函数返回OptionalInt，它是Optional的一个子类，能够判断流是否为空，并对流为空的情况作相应的处理。

此外，mapToInt、mapToDouble、mapToLong进行数值操作后的max函数返回结果分别为：OptionalInt、OptionalDouble、OptionalLong。

### 13.3. 收集器collect

#### 13.3.1. 收集器简介

收集器用来将经过筛选、映射的流进行最后的整理，可以使得最后的结果以不同的形式展现。

collect方法即为收集器，它接收Collector接口的实现作为具体收集器的收集方法。

Collector接口提供了很多默认实现的方法，我们可以直接使用它们格式化流的结果；也可以自定义Collector接口的实现，从而定制自己的收集器。

这里先介绍Collector常用默认静态方法的使用，自定义收集器会在下一篇博文中介绍。

#### 13.3.2. 收集器的使用

##### 13.3.2.1 归约

流由一个个元素组成，归约就是将一个个元素“折叠”成一个值，如求和、求最值、求平均值都是归约操作。

###### 13.3.2.1.1 计数#

```java
long count = list.stream()
                    .collect(Collectors.counting());
```

也可以不使用收集器的计数函数：

```java
long count = list.stream().count();
```

注意：计数的结果一定是long类型。

###### 13.3.2.1.2 最值#

例：找出所有人中年龄最大的人

```java
Optional<Person> oldPerson = list.stream()
                    .collect(Collectors.maxBy(Comparator.comparingInt(Person::getAge)));
```

计算最值需要使用Collector.maxBy和Collector.minBy，这两个函数需要传入一个比较器Comparator.comparingInt，这个比较器又要接收需要比较的字段。

这个收集器将会返回一个Optional类型的值。

###### 13.3.2.1.3 求和#

例：计算所有人的年龄总和

```java
int summing = list.stream()
                    .collect(Collectors.summingInt(Person::getAge));
```

当然，既然Java8提供了summingInt，那么还提供了summingLong、summingDouble。

###### 13.3.2.1.4 求平均值#

例：计算所有人的年龄平均值

```java
double avg = list.stream()
                    .collect(Collectors.averagingInt(Person::getAge));
```

注意：计算平均值时，不论计算对象是int、long、double，计算结果一定都是double。

###### 13.3.2.1.5 一次性计算所有归约操作#

Collectors.summarizingInt函数能一次性将最值、均值、总和、元素个数全部计算出来，并存储在对象IntSummaryStatisics中。

可以通过该对象的getXXX()函数获取这些值。

###### 13.3.2.1.6 连接字符串#

例：将所有人的名字连接成一个字符串

```java
String names = list.stream()
                        .collect(Collectors.joining());
```

每个字符串默认分隔符为空格，若需要指定分隔符，则在joining中加入参数即可，如下：

```java
String names = list.stream()
                        .collect(Collectors.joining(", "));
```

此时字符串之间的分隔符为逗号。

###### 13.3.2.1.7 一般性的归约操作#

若你需要自定义一个归约操作，那么需要使用Collectors.reducing函数，该函数接收三个参数：

> 第一个参数：为归约的初始值
>
> 第二个参数：为归约操作进行的字段
>
> 第三个参数：为归约操作的过程

例：计算所有人的年龄总和

```java
Optional<Integer> sumAge = list.stream()
                               .collect(Collectors.reducing(0,Person::getAge,(i,j)->i+j));
```

上面例子中，reducing函数一共接收了三个参数：

> 第一个参数：表示归约的初始值。我们需要累加，因此初始值为0；
>
> 第二个参数：表示需要进行归约操作的字段。这里我们对Person对象的age字段进行累加；
>
> 第三个参数：表示归约的过程。这个参数接收一个Lambda表达式，而且这个Lambda表达式一定拥有两个参数，分别表示当前相邻的两个元素。由于我们需要累加，因此我们只需将相邻的两个元素加起来即可。

Collectors.reducing方法还提供了一个单参数的重载形式。

你只需传一个归约的操作过程给该方法即可(即第三个参数)，其他两个参数均使用默认值。

> 第一个参数默认为流的第一个元素；
>
> 第二个参数默认为流的元素 。
>
> 这就意味着，当前流的元素类型为数值类型，并且是你要进行归约的对象。

例：采用单参数的reducing计算所有人的年龄总和

```java
Optional<Integer> sumAge = list.stream()
            .filter(Person::getAge)
            .collect(Collectors.reducing((i,j)->i+j));
```

##### 13.3.2.2 分组groupingby

分组就是将流中的元素按照指定类别进行划分，类似于SQL语句中的GROUPBY。

###### 13.3.2.2.1 一级分组#

例：将所有人分为老年人、中年人、青年人

```java
Map<String,List<Person>> result = list.stream()
                                    .collect(Collectors.groupingby((person)->{
        if(person.getAge()>60)
            return "老年人";
        else if(person.getAge()>40)
            return "中年人";
        else
            return "青年人";
     }));
```

groupingby函数接收一个Lambda表达式，该表达式返回String类型的字符串，groupingby会将当前流中的元素按照Lambda返回的字符串进行分组。

分组结果是一个Map>，Map的键就是组名，Map的值就是该组的Perosn集合。

###### 13.3.2.2.2 多级分组#

多级分组可以支持在完成一次分组后，分别对每个小组再进行分组。

使用具有两个参数的groupingby重载方法即可实现多级分组。

> 第一个参数：一级分组的条件 ；
>
> 第二个参数：一个新的groupingby函数，该函数包含二级分组的条件

例：将所有人分为老年人、中年人、青年人，并且将每个小组再分成：男女两组。

```java
Map<String,Map<String,List<Person>>> result = list.stream()
                                    .collect(Collectors.groupingby((person)->{
        if(person.getAge()>60)
            return "老年人";
        else if(person.getAge()>40)
            return "中年人";
        else
            return "青年人";
       },
      groupingby(Person::getSex)));
```

此时会返回一个非常复杂的结果：Map>>。

###### 13.3.2.2.3 对分组进行统计#

拥有两个参数的groupingby函数不仅仅能够实现多几分组，还能对分组的结果进行统计。

例：统计每一组的人数

```java
Map<String,Long> result = list.stream()
                                    .collect(Collectors.groupingby((person)->{
        if(person.getAge()>60)
            return "老年人";
        else if(person.getAge()>40)
            return "中年人";
        else
            return "青年人";
       },
     counting()));
```

此时会返回一个Map类型的map，该map的键为组名，map的值为该组的元素个数。

将收集器的结果转换成另一种类型

当使用maxBy、minBy统计最值时，结果会封装在Optional中，该类型是为了避免流为空时计算的结果也为空的情况。在单独使用maxBy、minBy函数时确实需要返回Optional类型，这样能确保没有空指针异常。然而当我们使用groupingBy进行分组时，若一个组为空，则该组将不会被添加到Map中，从而Map中的所有值都不会是一个空集合。既然这样，使用maxBy、minBy方法计算每一组的最值时，将结果封装在optional对象中就显得有些多余。

我们可以使用collectingAndThen函数包裹maxBy、minBy，从而将maxBy、minBy返回的Optional对象进行转换。

例：将所有人按性别划分，并计算每组最大的年龄。

```java
Map<String,Integer> map = list.stream()
                            .collect(groupingBy(Person::getSex,
                            collectingAndThen(
                            maxBy(comparingInt(Person::getAge)),
                            Optional::get
                            )));
```

此时返回的是一个Map，String表示每组的组名(男、女)，Integer为每组最大的年龄。

如果不用collectingAndThen包裹maxBy，那么最后返回的结果为Map>。

使用collectingAndThen包裹maxBy后，首先会执行maxBy函数，该函数执行完后便会执行Optional::get，从而将Optional中的元素取出来。

##### 13.3.2.3 分区partitioningBy

1、分区是分组的一种特殊情况，它只能分成true、false两组。

2、分区使用partitioningBy方法，该方法接收一个Lambda表达式，该表达是必须返回boolean类型。

3、partitioningBy方法会将Lambda返回结果为true和false的元素各分成一组。

4、partitioningBy方法返回的结果为Map>。

5、partitioningBy方法和groupingBy方法一样，也可以接收第二个参数，实现二级分区或对分区结果进行统计。

### 13.4. lambda结合Stream实战

**1、** 线程启动；

```java
new Thread( () -> {
      System.out.println("In Java8, Lambda expression rocks !!");
}).start();
```

**2、** 对列表进行迭代；

```java
// 使用 lambda 表达式以及函数操作(functional operation)
list.forEach((obj) -> System.out.println(obj));
// 在 Java 8 中使用双冒号操作符(double colon operator)
list.forEach(System.out::println);
```

**3、** 排序集合；

```java
Comparator<String> sortByName = (String s1, String s2) -> (s1.compareTo(s2));
list.sort(sortByName);
list.forEach(System.out::println);
```

下面通过示范来加深熟悉lambda表达式的理解：测试类开始：

定义两个人的集合：

```java
List<Person> javaProgrammers = new ArrayList<Person>() {
       {
         add(new Person("Elsdon", "Jaycob", "Java programmer", "male", 43, 2000));
         add(new Person("Tamsen", "Brittany", "Java programmer", "female", 23, 1500));
         add(new Person("Floyd", "Donny", "Java programmer", "male", 33, 1800));
         add(new Person("Sindy", "Jonie", "Java programmer", "female", 32, 1600));
         add(new Person("Vere", "Hervey", "Java programmer", "male", 22, 1200));
         add(new Person("Maude", "Jaimie", "Java programmer", "female", 27, 1900));
         add(new Person("Shawn", "Randall", "Java programmer", "male", 30, 2300));
         add(new Person("Jayden", "Corrina", "Java programmer", "female", 35, 1700));
         add(new Person("Palmer", "Dene", "Java programmer", "male", 33, 2000));
         add(new Person("Addison", "Pam", "Java programmer", "female", 34, 1300));
       }
};
List<Person> phpProgrammers = new ArrayList<Person>() {
       {
        add(new Person("Jarrod", "Pace", "PHP programmer", "male", 34, 1550));
        add(new Person("Clarette", "Cicely", "PHP programmer", "female", 23, 1200));
        add(new Person("Victor", "Channing", "PHP programmer", "male", 32, 1600));
        add(new Person("Tori", "Sheryl", "PHP programmer", "female", 21, 1000));
        add(new Person("Osborne", "Shad", "PHP programmer", "male", 32, 1100));
        add(new Person("Rosalind", "Layla", "PHP programmer", "female", 25, 1300));
        add(new Person("Fraser", "Hewie", "PHP programmer", "male", 36, 1100));
        add(new Person("Quinn", "Tamara", "PHP programmer", "female", 21, 1000));
        add(new Person("Alvin", "Lance", "PHP programmer", "male", 38, 1600));
        add(new Person("Evonne", "Shari", "PHP programmer", "female", 40, 1800));
       }
};
```

输出php程序员名称：

```java
/**
*  @description:输出php程序员名称
*  @author DDKK.COM 弟弟快看，程序员编程资料站
*  @date 2023/2/15 20:12
*/
private void printProgramerName(){
    System.out.println("输出php程序员名称");
    phpProgrammers.forEach((f) -> System.out.printf("%s %s; ",f.getFirstName(),f.getLastName()));
}
```

给java程序员加薪(两种方式)：

```java
/**
*  @description:给java程序员加薪(两种方式)：
*  @author DDKK.COM 弟弟快看，程序员编程资料站
*  @date 2023/2/15 20:45
*/
private void addSalary(){
    javaProgrammers.forEach((j) -> System.out.println(j.getLastName() + ":" + j.getSalary()));
    System.out.println("给java程序员加薪 5% :");
    javaProgrammers.forEach(j ->j.setSalary(j.getSalary() * 5/100 + j.getSalary()));
    javaProgrammers.forEach((j) -> System.out.println(j.getLastName() + ":" + j.getSalary()));
    System.out.println("时隔一年，再一次加薪 5% :");
    Consumer<Person> giveRaise = (j) ->j.setSalary(j.getSalary() * 5/100 + j.getSalary());
    javaProgrammers.forEach(giveRaise);
    javaProgrammers.forEach((j) -> System.out.println(j.getLastName() + ":" + j.getSalary()));
}
```

过滤月薪超过1400元的java程序员(两种方式)：

```java
/**
*  @description:按月薪过滤程序员：(两种方式)
*  @author DDKK.COM 弟弟快看，程序员编程资料站
*  @date 2023/2/15 20:58
*/
private void filterSalary(){
    System.out.println("过滤月薪超过1400元的java程序员");
    javaProgrammers.stream()
        .filter(j -> j.getSalary() > 1400)
        .forEach(j -> System.out.println(j.getFirstName() + ":" + j.getSalary()));
    System.out.println("过滤月薪超过1500元的php程序员");
    Predicate<Person> predicate = j -> j.getSalary() > 1500;
    phpProgrammers.stream()
        .filter(predicate)
        .forEach(j -> System.out.println(j.getFirstName() + ":" + j.getSalary()));
}
```

**根据多条件过滤**：

```java
/**
*  @description:根据多条件过滤
*  @author DDKK.COM 弟弟快看，程序员编程资料站
*  @date 2023/2/15 23:36
*/
private void filterMultiCondition(){
    System.out.println("过滤年龄大于24岁且月薪在$1,400以上的女PHP程序员");
    phpProgrammers.stream()
        .filter(j -> j.getAge() > 24 && j.getSalary() > 1400 && j.getGender().equals("female"))
        .forEach(j -> System.out.println(j.getLastName() + "," + j.getAge() + "," + j.getSalary() + "," + j.getGender()));
    System.out.println("过滤年龄大于20岁且月薪在$1,600以上的男JAVA程序员");
    Predicate<Person> predicate = j -> j.getAge() > 20 && j.getSalary() > 1600 && j.getGender().equals("male");
    javaProgrammers.stream()
        .filter(predicate)
        .forEach(j -> System.out.println(j.getLastName() + "," + j.getAge() + "," + j.getSalary() + "," + j.getGender()));
    System.out.println("过滤年龄大于20岁且月薪在$1,200以上的女JAVA程序员");
    Predicate<Person> agePredicate = j -> j.getAge() > 20;
    Predicate<Person> salaryPredicate = j -> j.getSalary() > 1600;
    Predicate<Person> genderPredicate = j -> j.getGender().equals("female");
    javaProgrammers.stream()
        .filter(agePredicate)
        .filter(salaryPredicate)
        .filter(genderPredicate)
        .forEach(j -> System.out.println(j.getLastName() + "," + j.getAge() + "," + j.getSalary() + "," + j.getGender()));
}
```

将java程序员根据工资排序：

```java
/**
 *  @description:根据某个属性进行排序
 *  @author DDKK.COM 弟弟快看，程序员编程资料站
 *  @date 2023/2/15 23:48
 */
private void sort(){
    System.out.println("Java programmers根据 salary 排序:");
    javaProgrammers.stream()
        .sorted((p, p2) -> (p.getSalary() - p2.getSalary()) )
        .forEach((p) -> System.out.printf("%s %s; ", p.getFirstName(), p.getSalary()));
}
```

找出工资最低和最高的java程序员：

```java
/**
 *  @description:找出工资最低和最高的java程序员
 *  @author DDKK.COM 弟弟快看，程序员编程资料站
 *  @date 2023/2/15 23:52
 */
private void findMinAndMax(){
    System.out.println("工资最低的 Java programmer:");
    Person personMin = javaProgrammers
        .stream()
        .min((p1, p2) -> (p1.getSalary() - p2.getSalary()))
        .get();
    System.out.printf("Name: %s; Salary: $%,d.", personMin.getFirstName(), personMin.getSalary());
    System.out.println("工资最高的 Java programmer:");
    Person person = javaProgrammers
        .stream()
        .max((p1, p2) -> (p1.getSalary() - p2.getSalary()))
        .get();
    System.out.printf("Name: %s; Salary: $%,d.", person.getFirstName(), person.getSalary());
}
```

将PHP程序员的姓拼接成字符串：

```java
/**
 *  @description:将PHP程序员的姓拼接成字符串
 *  @author DDKK.COM 弟弟快看，程序员编程资料站
 *  @date 2023/2/15 23:55
 */
private void testMap(){
    System.out.println("将 PHP programmers 的 first name 拼接成字符串:");
    String phpDevelopers = phpProgrammers
        .stream()
        .map(Person::getFirstName)
        .collect(Collectors.joining(" ; "));
    System.out.println(phpDevelopers);
}
```

将java程序员的姓放到set中：

```java
/**
 *  @description:将java程序员的姓放到set中
 *  @author DDKK.COM 弟弟快看，程序员编程资料站
 *  @date 2023/2/15 23:57
 */
private void testMapAndSet(){
    System.out.println("将 Java programmers 的 first name 存放到 Set:");
    Set<String> javaDevFirstName = javaProgrammers
        .stream()
        .map(Person::getFirstName)
        .collect(Collectors.toSet());
}
```

将java程序员的姓放到Treeset中：

```java
/**
 *  @description:将java程序员的姓放到Treeset中
 *  @author DDKK.COM 弟弟快看，程序员编程资料站
 *  @date 2023/2/15 23:58
 */
private void testMapAndTreeSet(){
    System.out.println("将 Java programmers 的 first name 存放到 TreeSet:");
    TreeSet<String> javaDevLastName = javaProgrammers
        .stream()
        .map(Person::getLastName)
        .collect(Collectors.toCollection(TreeSet::new));
}
```

计算所有java程序员的工资 ：

```java
/**
*  @description:计算所有java程序员的工资
*  @author DDKK.COM 弟弟快看，程序员编程资料站
*  @date 2023/2/15 23:59
*/
private void testSum(){
    System.out.println("计算付给 Java programmers 的所有money:");
    int totalSalary = javaProgrammers
        .parallelStream()
        .mapToInt(p -> p.getSalary())
        .sum();
}
```

获得各种汇总数据。

```java
/**
*  @description:获得各种汇总数据
*  @author DDKK.COM 弟弟快看，程序员编程资料站
*  @date 2023/2/16 0:00
*/
private void testSummaryStatistics(){
    // 接下来,我们可以访问这些方法,比如getMax, getMin, getSum或getAverage:
    //计算 count, min, max, sum, and average for numbers
    List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
    IntSummaryStatistics stats = numbers
        .stream()
        .mapToInt((x) -> x)
        .summaryStatistics();
    System.out.println("List中最大的数字 : " + stats.getMax());
    System.out.println("List中最小的数字 : " + stats.getMin());
    System.out.println("所有数字的总和   : " + stats.getSum());
    System.out.println("所有数字的平均值 : " + stats.getAverage());
}
```

计数

```java
/**
*  @description: 计数
*  @author DDKK.COM 弟弟快看，程序员编程资料站
*  @date 2023/2/16 11:17
*/
private void testCollectCount(){
    System.out.println("计算Java 女程序员数");
    long count = javaProgrammers.stream()
        .filter(j -> j.getGender().equals("female"))
        .collect(counting());
    System.out.println("Java 女程序员数=" + count);
}
```

分组

```java
/**
*  @description: 分组
*  @author DDKK.COM 弟弟快看，程序员编程资料站
*  @date 2023/2/16 11:25
*/
private void testGroupingby(){
    System.out.println("对java 程序员按男女分成两组");
    Map<String ,List<Person>> result = javaProgrammers.stream()
        .collect(Collectors.groupingBy((person) -> {
            if(person.getGender().equals("female")) return "女";
            else if(person.getGender().equals("male")) return "男";
            else return "不男不女";
        }));
    result.forEach((k, v) -> {
        System.out.println("小组" + k + "成员有:");
        v.forEach(j -> System.out.println(j.getLastName()));
    });
    System.out.println("对java 程序员按男女分成两组,统计各组人数");
    Map<String ,Long> result2 = javaProgrammers.stream()
        .collect(Collectors.groupingBy((person) -> {
            if(person.getGender().equals("female")) return "女";
            else if(person.getGender().equals("male")) return "男";
            else return "不男不女";
        },counting()));
    result2.forEach((k,v) -> System.out.println("小组" + k + "共有:" + v));
}
```
