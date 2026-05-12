# 12、Java并发编程 - 四大函数式接口
- 来源：https://ddkk.com/zhuanlan/java/concurrency/7/12.html
- 分类：Java并发
- 分组：教程目录
## 12、四大函数式接口

函数式接口在包java.util.function中，函数式接口在后面章节Stream中将大量使用。

### 12.1. 函数型接口Function：有一个输入，有一个输出

> 函数型接口，有一个输入，有一个输出

源代码如下：

```java
@FunctionalInterface
public interface Function<T, R> {
    /**
     * Applies this function to the given argument.
     *
     * @param t the function argument
     * @return the function result
     */
    R apply(T t);
}
```

示例代码如下：

```java
package com.interview.concurrent.functioninterface;
import java.util.function.Function;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述：有一个输入，有一个输出
 * @date 2023/2/24 11:42
 */
public class FuntionDemo {
    public static void main(String[] args) {
     //函数型接口示例：转换字符串为Integer
        Integer value = convert("28", x -> Integer.parseInt(x));
    }
    /**
     *  @description:3.函数型接口示例：转换字符串为Integer
     *  @author DDKK.COM 弟弟快看，程序员编程资料站
     *  @date 2023/2/14 18:29
     */
    public static Integer convert(String str, Function<String, Integer> function) {
        return function.apply(str);
    }
}
```

### 12.2. 断定型接口Predicate：有一个输入，返回只有布尔值。

> 断定型接口，有一个输入参数，返回只有布尔值。

源代码如下：

```java
@FunctionalInterface
public interface Predicate<T> {
    /**
     * Evaluates this predicate on the given argument.
     *
     * @param t the input argument
     * @return {@code true} if the input argument matches the predicate,
     * otherwise {@code false}
     */
    boolean test(T t);
}
```

示例代码如下：

```java
package com.interview.concurrent.functioninterface;
import java.util.function.Predicate;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述:有一个输入，返回boolean类型
 * @date 2023/2/24 11:43
 */
public class PredicateDemo {
    public static void main(String[] args) {
       //断言型接口示例  :筛选出只有2个字的水果
        List<String> fruit = Arrays.asList("香蕉", "哈密瓜", "榴莲", "火龙果", "水蜜桃");
        List<String> newFruit = predicate(fruit, (f) -> f.length() == 2);
        System.out.println(newFruit);
    }
    /**
     *  @description:4.断言型接口示例  :筛选出只有2个字的水果
     *  @author DDKK.COM 弟弟快看，程序员编程资料站
     *  @date 2023/2/15 17:19
     */
    public static List<String> predicate(List<String> fruit, Predicate<String> predicate){
        List<String> f = new ArrayList<>();
        for (String s : fruit) {
            if(predicate.test(s)){
                f.add(s);
            }
        }
        return f;
    }
}
```

### 12.3. 消费型接口Consumer：有一个输入参数，没有返回值

> 消费型接口，有一个输入参数，没有返回值

源代码如下：

```java
@FunctionalInterface
public interface Consumer<T> {
    /**
     * Performs this operation on the given argument.
     *
     * @param t the input argument
     */
    void accept(T t);
}
```

示例代码如下：

```java
package com.interview.concurrent.functioninterface;
import java.util.function.Consumer;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述：有一个输入，没有输出
 * @date 2023/2/24 11:43
 */
public class ConsumerDemo {
   public static void donation(Integer money, Consumer<Integer> consumer){
       consumer.accept(money);  
   }
   public static void main(String[] args) {
       donation(1000, money -> System.out.println("您一共消费"+money+"元")) ;
   }
}
```

### 12.4. 供给型接口Supplier：没有输入，只有返回参数

> 供给型接口，没有输入参数，只有返回参数

源代码如下：

```java
@FunctionalInterface
public interface Supplier<T> {
    /**
     * Gets a result.
     *
     * @return a result
     */
    T get();
}
```

示例代码如下：

```java
package com.interview.concurrent.functioninterface;
import java.util.function.Supplier;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述：没有输入，只有输出
 * @date 2023/2/24 11:43
 */
public class SupplierDemo {
 	public static List<Integer> supply(Integer num, Supplier<Integer> supplier){
       		List<Integer> resultList = new ArrayList<Integer>()   ;
       		for(int x=0;x<num;x++)  
          		 resultList.add(supplier.get());
      		     return resultList ;
	}
	public static void main(String[] args) {
   		 List<Integer> list = supply(10,() -> (int)(Math.random()*100));
   		 list.forEach(System.out::println);
	}
}
```
