# 16、ElasticSearch 实战：ElasticSearch JavaApi环境准备
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/5/16.html
- 分类：搜索引擎
- 分组：教程目录
## Java API 环境准备

`ES`本身是由`Java`语言开发的，他也为我们提供了`Java` API调用的接口。这在实践中也是比较常用的。接下来我们用`maven`工程来来管理我们的测试项目。

maven依赖如下：

```java
<properties>
        <maven.compiler.source>8</maven.compiler.source>
        <maven.compiler.target>8</maven.compiler.target>
        <es.version>7.8.0</es.version>
        <log4j.version>2.8.2</log4j.version>
        <jackson.version>2.9.9</jackson.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.elasticsearch</groupId>
            <artifactId>elasticsearch</artifactId>
            <version>${es.version}</version>
        </dependency>
        <!--客户端-->
        <dependency>
            <groupId>org.elasticsearch.client</groupId>
            <artifactId>elasticsearch-rest-high-level-client</artifactId>
            <version>${es.version}</version>
        </dependency>
        <!-- es 依赖的log4j 2.x版本-->
        <dependency>
            <groupId>org.apache.logging.log4j</groupId>
            <artifactId>log4j-api</artifactId>
            <version>${log4j.version}</version>
        </dependency>
        <dependency>
            <groupId>org.apache.logging.log4j</groupId>
            <artifactId>log4j-core</artifactId>
            <version>${log4j.version}</version>
        </dependency>
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
            <version>${jackson.version}</version>
        </dependency>
        <dependency>
            <groupId>junit</groupId>
            <artifactId>junit</artifactId>
            <version>4.13.1</version>
            <scope>test</scope>
        </dependency>
    </dependencies>
```

项目创建成功之后，在编写一个基本的测试类。项目的结构如下图。

编写测试类：

```java
package com.maomao.elastic.search.api;
import org.apache.http.HttpHost;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestClientBuilder;
import org.elasticsearch.client.RestHighLevelClient;
import java.io.IOException;
/**
 * 首先对api的基础内容进行测试
 */
public class APITest {
    public static void main(String[] args) {
        // 1. 创建一个对ES服务链接的描述对象
        HttpHost host = new HttpHost("127.0.0.1", 9200, "http");
        // 2. 创建一个客户端构造器
        RestClientBuilder builder = RestClient.builder(host);
        // 3. 创建ES客户端
        RestHighLevelClient client = new RestHighLevelClient(builder);
        // 4. 关闭客户端, 如果客户端能正常构建则表示服务器链接没问题
        try {
            client.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

`ES`客户端主要的测试客户端就是构建一个`REST`客户端。 目前`7.8`版本的推荐类为:`RestHighLevelClient`。

运行测试如果不报错，则表示项目的环境搭建已经没有问题了。
