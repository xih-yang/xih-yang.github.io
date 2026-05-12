# 04、Java 7 新特性 - 增强泛型推断
- 来源：https://ddkk.com/zhuanlan/java/java7/4.html
- 分类：Java 7 新特性
- 分组：教程目录
在这个特性出现之前，有关泛型变量的声明略显重复，示例如下：

```java
Map<String, ArrayList<String>> wanger = new HashMap<String, ArrayList<String>>();
```

这样的代码简直太长了，很多重复的字符，难道编译器不能推断出泛型的类型信息吗？Java 7 实现了这个心愿。

```java
Map<String, List<String>> wanger = new HashMap<>();
List<String> chenmo = new ArrayList<>();
wanger.put("chenmo", chenmo);
```

这个看似简单的特性省去了不少敲击键盘的次数。
