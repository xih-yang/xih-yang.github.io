# 02、Java11 新特性 - 标准HttpClient
- 来源：https://ddkk.com/zhuanlan/java/java11/2.html
- 分类：Java 11 新特性
- 分组：教程目录
Java 9 中引入了增强的 HttpClient API 作为实验性功能。在 Java 11 中，现在 HttpClient 是一个标准。建议使用 Apache Http Client API 等其他 HTTP Client API 代替。它的功能非常丰富，现在基于 Java 的应用程序可以在不使用任何外部依赖的情况下发出 HTTP 请求。

## Java11 使用 HttpClient 的步骤

以下是使用 HttpClient 的步骤。

- 使用 HttpClient.newBuilder() 实例创建 HttpClient 实例
- 使用 HttpRequest.newBuilder() 实例创建 HttpRequest 实例
- 使用 httpClient.send() 发出请求并获取响应对象。

## Java11 使用 HttpClient的示例

```java
package com.yiidian;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
public class APITester {
   public static void main(String[] args) {
      HttpClient httpClient = HttpClient.newBuilder()
         .version(HttpClient.Version.HTTP_2)
         .connectTimeout(Duration.ofSeconds(10))
         .build(); 
         try {
            HttpRequest request = HttpRequest.newBuilder()
            .GET()
            .uri(URI.create("https://www.yiidian.com"))
            .build();                              
            HttpResponse<String> response = httpClient.send(request,
            HttpResponse.BodyHandlers.ofString()); 
         System.out.println("Status code: " + response.statusCode());                            
         System.out.println("Headers: " + response.headers().allValues("content-type"));
         System.out.println("Body: " + response.body());
      } catch (IOException | InterruptedException e) {
         e.printStackTrace();
      }
   }
}
```

输出结果为：

```java
Status code: 200
Headers: [text/html; charset=ISO-8859-1]
Body: <!doctype html>
...
</html>
```
