# 19、ElasticSearch 实战：ElasticSearch JavaApi 文档批量操作
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/5/19.html
- 分类：搜索引擎
- 分组：教程目录
## Elasticsearch JavaApi 文档批量操作

在实际的工程项目中，数据批量操作的需求是比较强烈的，所以`ES`的`API`也提供了这样的应用场景。下面将演示如何进行批量的文档增加，文档删除操作。

### 文档批量增加

在`ES`中批量的操需要使用到一个请求对象就是`BulkRequest`，然后将要做的请求集合添加到`BulkRequest`中，最后使用`bulk`方法发送批量请求。 批量添加文档的步骤如下

**1、** 定义要链接主机的信息,这里使用`org.apache.http.HttpHost`对象；

**2、** 构建`RestClientBuilder`,该对象由`RestClient.builder(host);`构建；

**3、** 建立与`ES`服务器链接的客户端对象`RestHighLevelClient`，直接创建即可；

**4、** 创建`org.elasticsearch.action.bulk.BulkRequest`对象，例如对象名叫`bulkRequest`；

**5、** 创建添加文档的`org.elasticsearch.action.index.IndexRequest`对象，并加入到`bulkRequest`；

**6、** 提交请求，批量添加文档`client.bulk(bulkRequest,RequestOptions.DEFAULT);`；

**7、** 最后要关闭client要不然进程会一致挂起；

样例代表如下:

```java
package com.maomao.elastic.search.batch;
import org.apache.http.HttpHost;
import org.elasticsearch.action.bulk.BulkItemResponse;
import org.elasticsearch.action.bulk.BulkRequest;
import org.elasticsearch.action.bulk.BulkResponse;
import org.elasticsearch.action.index.IndexRequest;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestClientBuilder;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.common.xcontent.XContentType;
import java.util.Arrays;
public class DocInsertBatch {
    public static void main(String[] args) throws Exception {
        HttpHost host = new HttpHost("127.0.0.1", 9200, "http");
        RestClientBuilder builder = RestClient.builder(host);
        RestHighLevelClient client = new RestHighLevelClient(builder);
        // 批量操作其实就是把 一堆的request添加到bulkRequest中，所以首先要构建一个bulkRequest
        BulkRequest bulkRequest = new BulkRequest();
        bulkRequest.add(new IndexRequest().index("teacher").id("7002").source(XContentType.JSON, "name", "宋江", "sex", "男", "age", "35", "title", "副教授"));
        bulkRequest.add(new IndexRequest().index("teacher").id("7003").source(XContentType.JSON, "name", "花荣", "sex", "男", "age", "25", "title", "助教"));
        bulkRequest.add(new IndexRequest().index("teacher").id("7004").source(XContentType.JSON, "name", "孙二娘", "sex", "女", "age", "28", "title", "副教授"));
        // 调用方法为bulk
        BulkResponse bulkResponse = client.bulk(bulkRequest, RequestOptions.DEFAULT);
        Arrays.stream(bulkResponse.getItems()).map(BulkItemResponse::getResponse).forEach(System.out::println);
        client.close();
    }
}
```

执行查询操作。

执行完查询操作之后，继续使用`PostMan`进行`restfulapi`进行查询，看是否都被成功添加到`ES`服务器：

从上面可以看出，刚才批量添加的数据已经成功添加到服务器了。

### 批量删除

操作基本与批量添加一致，只需要把刚才`IndexRequest`对象换成`DeleteRequest`就可以了。接下来实验，我们将使用批量删除的方式将刚添加的`7002`、`7003`、`7004`删除掉.

上代码：

```java
package com.maomao.elastic.search.batch;
import org.apache.http.HttpHost;
import org.elasticsearch.action.bulk.BulkItemResponse;
import org.elasticsearch.action.bulk.BulkRequest;
import org.elasticsearch.action.bulk.BulkResponse;
import org.elasticsearch.action.delete.DeleteRequest;
import org.elasticsearch.action.index.IndexRequest;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestClientBuilder;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.common.xcontent.XContentType;
import java.util.Arrays;
public class DocDeleteBatch {
    public static void main(String[] args) throws Exception {
        HttpHost host = new HttpHost("127.0.0.1", 9200, "http");
        RestClientBuilder builder = RestClient.builder(host);
        RestHighLevelClient client = new RestHighLevelClient(builder);
        // 批量操作其实就是把 一堆的request添加到bulkRequest中，所以首先要构建一个bulkRequest
        BulkRequest bulkRequest = new BulkRequest();
        bulkRequest.add(new DeleteRequest().index("teacher").id("7002"));
        bulkRequest.add(new DeleteRequest().index("teacher").id("7003"));
        bulkRequest.add(new DeleteRequest().index("teacher").id("7004"));
        // 调用方法为bulk
        BulkResponse bulkResponse = client.bulk(bulkRequest, RequestOptions.DEFAULT);
        Arrays.stream(bulkResponse.getItems()).map(BulkItemResponse::getResponse).forEach(System.out::println);
        client.close();
    }
}
```

执行操作结果如下:

再继续使用`PostMan`继续查询一下是否服务器上已经被删除了

通过查询，我们发现`hits`字段已经为空了，也就是不在存在数据了，也就是说文档被彻底删除掉了。批量操作成功。
