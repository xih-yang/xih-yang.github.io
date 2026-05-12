# 03、Java 18 新特性 - Javadoc 中支持代码片段
- 来源：https://ddkk.com/zhuanlan/java/java18/3.html
- 分类：Java 18 新特性
- 分组：教程目录
在Java 18 之前，已经支持在 Javadoc 中引入代码片段，这样可以在某些场景下更好的展示描述信息，但是之前的支持功能有限，比如我想高亮代码片段中的某一段代码是无能为力的。现在 Java 18 优化了这个问题，增加了 `@snippet` 来引入更高级的代码片段。

在Java 18 之前，使用 `{@code ...}` 来引入代码片段。

```java
 /**
  * 时间工具类
  * Java 18 之前引入代码片段：
  * <pre>{@code
  *     public static String timeStamp() {
  *        long time = System.currentTimeMillis();
  *         return String.valueOf(time / 1000);
  *     }
  * }</pre>
  *
  */
```

生成Javadoc 之后，效果如下：

#### 3.1、高亮代码片段

从Java 18 开始，可以使用 `@snippet` 来生成注释，且可以高亮某个代码片段。

```java
/**
 * 在 Java 18 之后可以使用新的方式
 * 下面的代码演示如何使用 {@code Optional.isPresent}:
 * {@snippet :
 * if (v.isPresent()) {
 *     System.out.println("v: " + v.get());
 * }
 * }
 *
 * 高亮显示 println
 *
 * {@snippet :
 * class HelloWorld {
 *     public static void main(String... args) {
 *         System.out.println("Hello World!");      // @highlight substring="println"
 *     }
 * }
 * }
 *
 */
```

效果如下，更直观，效果更好。

#### 3.2、正则高亮代码片段

甚至可以使用正则来高亮某一段中的某些关键词：

```java
/** 
  * 正则高亮：![在这里插入图片描述](https://img-blog.csdnimg.cn/ae58ca6d07a542e98479b660d284b991.png#pic_center)
  * {@snippet :
  *   public static void main(String... args) {
  *       for (var arg : args) {                 // @highlight region regex = "\barg\b"
  *           if (!arg.isBlank()) {
  *               System.out.println(arg);
  *           }
  *       }                                      // @end
  *   }
  *   }
  */
```

生成的Javadoc 效果如下:

#### 3.3、替换代码片段

可以使用正则表达式来替换某一段代码。

```java
 /** 
   * 正则替换：
   * {@snippet :
   * class HelloWorld {
   *     public static void main(String... args) {
   *         System.out.println("Hello World!");  // @replace regex='".*"' replacement="..."
   *     }
   * }
   * }
   */
```

这段注释会生成如下 Javadoc 效果。

```java
class HelloWorld {
    public static void main(String... args) {
        System.out.println(...);
    }
}
```

#### 3.4、附：Javadoc 生成方式

```java
# 使用 javadoc 命令生成 Javadoc 文档
➜  bin ./javadoc -public -sourcepath ./src -subpackages com -encoding utf-8 -charset utf-8 -d ./javadocout
# 使用 Java 18 的 jwebserver 把生成的 Javadoc 发布测试
➜  bin ./jwebserver -d /Users/darcy/develop/javadocout
```

访问测试：
