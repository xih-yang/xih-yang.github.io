# 03、Java12 新特性 - File的mismatch方法
- 来源：https://ddkk.com/zhuanlan/java/java12/3.html
- 分类：Java 12 新特性
- 分组：教程目录
Java 12 引入了一种使用以下语法比较两个文件的简单方法 -

```java
public static long mismatch(Path path1, Path path2) throws IOException
```

- 如果没有不匹配，则返回 1L，否则返回第一个不匹配的位置。
- 如果文件大小不匹配或字节内容不匹配，则会考虑不匹配。

## Java12 File的mismatch方法示例

ApiTester.java

```java
package com.yiidian;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
public class APITester {
   public static void main(String[] args) throws IOException {
      Path path1 = Files.createTempFile("file1", ".txt");
      Path path2 = Files.createTempFile("file2", ".txt");
      Files.writeString(path1, "tutorialspoint");
      Files.writeString(path2, "tutorialspoint");
      long mismatch = Files.mismatch(path1, path2);
      if(mismatch > 1L) {
         System.out.println("Mismatch occurred in file1 and file2 at : " + mismatch);
      }else {
         System.out.println("Files matched");
      }
      System.out.println();
      Path path3 = Files.createTempFile("file3", ".txt");
      Files.writeString(path3, "tutorialspoint Java 12");
      mismatch = Files.mismatch(path1, path3);
      if(mismatch > 1L) {
         System.out.println("Mismatch occurred in file1 and file3 at : " + mismatch);
      }else {
         System.out.println("Files matched");
      }
      path1.toFile().deleteOnExit();
      path2.toFile().deleteOnExit();
      path3.toFile().deleteOnExit();
   }
}
```

输出结果为

```java
Files matched
Mismatch occurred in file1 and file3 at : 14
```
