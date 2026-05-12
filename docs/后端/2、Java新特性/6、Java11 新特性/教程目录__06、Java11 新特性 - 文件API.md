# 06、Java11 新特性 - 文件API
- 来源：https://ddkk.com/zhuanlan/java/java11/6.html
- 分类：Java 11 新特性
- 分组：教程目录
Java 11 通过提供新的重载方法而无需编写大量样板代码，引入了一种读取和写入文件的简单方法。

## Java11 文件API 的示例

ApiTester.java

```java
import java.io.File;
import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
public class APITester {
   public static void main(String[] args) {		
      try {
         Path tempFilePath = Files.writeString(
            Path.of(File.createTempFile("tempFile", ".tmp").toURI()),
            "Welcome to yiidian.com", 
            Charset.defaultCharset(), StandardOpenOption.WRITE);
         String fileContent = Files.readString(tempFilePath);
         System.out.println(fileContent);
      } catch (IOException e) {
         e.printStackTrace();
      }
   }
}
```

输出结果为

```java
Welcome to yiidian.com
```
