# 03、Java 7 新特性 - 异常处理（捕获多个异常） try-with-resources
- 来源：https://ddkk.com/zhuanlan/java/java7/3.html
- 分类：Java 7 新特性
- 分组：教程目录
在异常处理区域有几处改进。Java引入了多个catch功能，以使用单个抓到块捕获多个异常类型。

catch子句能够同一时候捕获多个异常

```java
public void testSequence() {  
    try {  
        Integer.parseInt("Hello");  
    }  
    catch (NumberFormatException | RuntimeException e) {  //使用'|'切割，多个类型，一个对象e  
    }  
}  
```

try-with-resources语句

Java7之前须要在finally中关闭socket、文件、数据库连接等资源；

Java7中在try语句中申请资源，实现资源的自己主动释放（资源类必须实现**java.lang.AutoCloseable接口**，一般的文件、数据库连接等均已实现该接口，close方法将被自己主动调用）。

```java
public void read(String filename) throws IOException {  
     try (BufferedReader reader = new BufferedReader(new FileReader(filename))) {  
         StringBuilder builder = new StringBuilder();  
String line = null;  
while((line=reader.readLine())!=null){  
    builder.append(line);  
    builder.append(String.format("%n"));  
}  
return builder.toString();  
     }   
 }  
```
