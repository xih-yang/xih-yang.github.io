# 17、ElasticSearch 实战：ElasticSearch JavaApi 索引操作
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/5/17.html
- 分类：搜索引擎
- 分组：教程目录
## JavaApi 索引操作

与`RESTful api`类似， `java api` 是采用代码的形式操作索引，也有相同的索引`增`、`改`、`查`操作。下面我们对`api` 一一进行测试。

### 创建索引

步骤：

**1、** 创建`HttpHost`对象，该对象主要用于链接`ES`服务器的描述，包含了,`host`,`port`,`schema`；

**2、** 创建`RestClientBuilder`对象，该对象由`RestClient`对象的静态方法`build`创建，需要带入`HttpHost`集群应该还可以带入多个`HttpHost`；

**3、** 创建关键对象`RestHighLevelClient`,该对象才是真正链接`ES`服务发起操作的对象；

**4、** 创建`CreateIndexRequest`对象，该对象是创建索引的请求对象，在`7.8.0`的版本上需要用`org.elasticsearch.client.indices`包下的，另外有一个同名的类，应该是过期了；

**5、** 发起创建请求，`client.indices().create(req,RequestOptions.DEFAULT);`,其中`client`就是`RestHighLevelClient`的实例对象；

**6、** 请求会响应一个`CreateIndexResponse`对象这个时候其实已经完成了创建操作了；

**7、** 最后记得关闭链接,`client.close();`；

代码如下：

```java
package com.maomao.elastic.search.index;
import org.apache.http.HttpHost;
import org.elasticsearch.client.indices.CreateIndexRequest;
import org.elasticsearch.client.indices.CreateIndexResponse;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestClientBuilder;
import org.elasticsearch.client.RestHighLevelClient;
import java.io.IOException;
/**
 * @author mao.kaiyin
 */
public class IndexCreate {
    public static void main(String[] args) throws IOException {
        HttpHost host = new HttpHost("127.0.0.1", 9200, "http");
        RestClientBuilder builder = RestClient.builder(host);
        RestHighLevelClient client = new RestHighLevelClient(builder);
        //创建索引
        CreateIndexRequest req = new CreateIndexRequest("teacher");
        CreateIndexResponse res = client.indices().create(req, RequestOptions.DEFAULT);
        boolean acknowledged = res.isAcknowledged();
        System.out.println("索引操作: " + acknowledged);
        client.close();
    }
}
```

### 查询索引

查询索引的整体步骤其实和创建类似，差异就是第`4`,`5`步。

**1、**`第4步`创建的对象是`org.elasticsearch.client.indices.GetIndexRequest`类的对象.；

**2、**`第5步`不能在是`create`方法了而是`get`方法；

**3、** 最后请求响应的对象也是`GetIndexResponse`对象；

代码如下：

```java
package com.maomao.elastic.search.index;
import org.apache.http.HttpHost;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestClientBuilder;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.client.indices.GetIndexRequest;
import org.elasticsearch.client.indices.GetIndexResponse;
import java.io.IOException;
public class IndexSearch {
    public static void main(String[] args) throws IOException {
        HttpHost host = new HttpHost("127.0.0.1", 9200, "http");
        RestClientBuilder builder = RestClient.builder(host);
        RestHighLevelClient client = new RestHighLevelClient(builder);
        GetIndexRequest query = new GetIndexRequest("teacher");
        GetIndexResponse response = client.indices().get(query, RequestOptions.DEFAULT);
        System.out.println(response.getAliases());
        System.out.println(response.getMappings());
        System.out.println(response.getSettings());
        client.close();
    }
}
```

### 删除索引

与两者类似，差异也是在请求对象不一样，响应对象不一样，调用方法不一样。核心差异也就是第`4`,`5`步。

**1、**`第4步`创建的对象是`org.elasticsearch.client.indices.DeleteIndexRequest`类的对象.；

**2、**`第5步`不能在是`create`方法了而是`get`方法；

**3、** 最后请求响应的对象也是`AcknowledgedResponse`对象，响应`不是DeleteIndexResponse`,那说明应该是后续有一堆的操作响应的内容体是一致的，所以用了一个通用的响应对象`AcknowledgedResponse`；

代码如下：

```java
package com.maomao.elastic.search.index;
import org.apache.http.HttpHost;
import org.elasticsearch.action.admin.indices.delete.DeleteIndexRequest;
import org.elasticsearch.action.support.master.AcknowledgedResponse;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestClientBuilder;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.client.indices.GetIndexRequest;
import org.elasticsearch.client.indices.GetIndexResponse;
import java.io.IOException;
public class IndexDelete {
    public static void main(String[] args) throws IOException {
        HttpHost host = new HttpHost("127.0.0.1", 9200, "http");
        RestClientBuilder builder = RestClient.builder(host);
        RestHighLevelClient client = new RestHighLevelClient(builder);
        DeleteIndexRequest query = new DeleteIndexRequest("teacher");
        AcknowledgedResponse delete = client.indices().delete(query, RequestOptions.DEFAULT);
        System.out.println("删除索引:" + delete.isAcknowledged());
        client.close();
    }
}
```

### 总结

通过上面的操作，可以总结整体操作的内容：

**1、**`javaapi`的操作流程应该大致都是一致的，需要一个核心的对象`RestHighLevelClient`；

**2、** 对索引的操作都是`IndicesClient`,它是可以通过`RestHighLevelClient`对象的`indices()`方法获取到的；

**3、** 请求对象有差异，但都是`XXXIndexRequest`,除了`delete`以外，尽量用包`org.elasticsearch.client.indices`下的；

**4、** 响应的内容与`restfulapi`一致，都是对应内容的数据结构所以要获取什么内容可以从`json`内容中整体查看；
