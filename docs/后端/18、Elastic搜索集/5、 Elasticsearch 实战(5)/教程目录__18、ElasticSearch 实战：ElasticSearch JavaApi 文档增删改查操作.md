# 18、ElasticSearch 实战：ElasticSearch JavaApi 文档增删改查操作
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/5/18.html
- 分类：搜索引擎
- 分组：教程目录
## JavaApi 文档增删改查操作

索引创建成功之后就可以进行文档的操作了，下面一次对文档进行增删改查了。

### 新增文档

新增文档操作的步骤如下：

**1、** 定义要链接主机的信息,这里使用`org.apache.http.HttpHost`对象；

**2、** 构建`RestClientBuilder`,该对象由`RestClient.builder(host);`构建；

**3、** 建立与`ES`服务器链接的客户端对象`RestHighLevelClient`，直接创建即可；

**4、** 构建创建文档的请求对象，需要注意的是虽然是创建文档，但是依然用的是`IndexRequest对象``org.elasticsearch.action.index.IndexRequest`；

**5、** 填充相应的请求数据；

- 设置将文档加到哪个`index`下，`indexRequest.index("teacher");`.
- 如果要自定义稳定id，需要设置`IndexRequest`的id属性,`indexRequest.id("7001");`
- 后续我们将要添加的文档弄成`JSON`格式。然后加入到`indexRequest`中，调用方法`source（）`，这时候也需要设置文档提交使用的格式：`.source(json, XContentType.JSON);`.

**6、** 提交请求，添加文档`client.index(indexRequest,RequestOptions.DEFAULT);`

**7、** 最后要关闭client要不然进程会一致挂起；

介绍完流程之后，看编写的代码如下：

```java
package com.maomao.elastic.search.doc;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.maomao.elastic.search.entry.Teacher;
import org.apache.http.HttpHost;
import org.elasticsearch.action.index.IndexRequest;
import org.elasticsearch.action.index.IndexResponse;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestClientBuilder;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.common.xcontent.XContentType;
/**
 * 文档创建
 */
public class DocCreate {
    public static void main(String[] args) throws Exception {
        HttpHost host = new HttpHost("127.0.0.1", 9200, "http");
        RestClientBuilder builder = RestClient.builder(host);
        RestHighLevelClient client = new RestHighLevelClient(builder);
        // 构建创建文档的请求对象
        IndexRequest indexRequest = new IndexRequest();
        indexRequest.index("teacher");
        indexRequest.id("7001");
        Teacher teacher = new Teacher();
        teacher.setAge(23);
        teacher.setName("高俅");
        teacher.setTitle("教授");
        teacher.setSex("男");
        ObjectMapper mapper = new ObjectMapper();
        indexRequest.source(mapper.writeValueAsString(teacher), XContentType.JSON);
        // 发送创建文档请求
        IndexResponse response = client.index(indexRequest, RequestOptions.DEFAULT);
        System.out.println(response.getResult());
        client.close();
    }
}
```

执行之后返回`response`的类型为`org.elasticsearch.action.index.IndexResponse`，`result`值为`CREATED`。从结果上看是成功的，我们是用`POSTMan`。查看服务器，确认是否真实创建文档成功。

从查询的结果可以确认文档确实已经添加成功。

### 文档修改

操作`ES`的`java api` 从步骤上类似， 文档的修改操作差异也体现在文档请求对象的不同，以及请求对象不同上。所以主要的差异在`4`、`5`、`6` 三个步骤上。

**1、**`4`步中创建的对象不一样,对象为`org.elasticsearch.action.update.UpdateRequest`；

**2、**`5`步中填充的数据不一样，但是我们都要设置`index`和`id`；

**3、**`UpdateRequest`,对象是对局部修改的操作请求对象，他提供了一个`doc()`方法填充修改内容，第一个参数为执行提交数据类型，例如：`XContentType.JSON`后面就是要修改内容的键值对,所以`doc`方法就是`奇数`个.`1+2n`的个数例如本例子我们将`7001`的性别从`男`改为`女``updateRequest.doc(XContentType.JSON,"sex","女");`；

带入如下：

```java
package com.maomao.elastic.search.doc;
import org.apache.http.HttpHost;
import org.elasticsearch.action.update.UpdateRequest;
import org.elasticsearch.action.update.UpdateResponse;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestClientBuilder;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.common.xcontent.XContentType;
/**
 * 局部文档更新
 */
public class DocPartUpdate {
    public static void main(String[] args) throws Exception {
        HttpHost host = new HttpHost("127.0.0.1", 9200, "http");
        RestClientBuilder builder = RestClient.builder(host);
        RestHighLevelClient client = new RestHighLevelClient(builder);
        // 构建修改文档的请求对象
        UpdateRequest updateRequest = new UpdateRequest();
        updateRequest.index("teacher").id("7001");
        updateRequest.doc(XContentType.JSON, "sex", "女");
        // 发送创建文档请求
        UpdateResponse response = client.update(updateRequest, RequestOptions.DEFAULT);
        System.out.println(response.getResult());
        client.close();
    }
}
```

运行代码得到结果`UpdateResponse`， 得到结果`UPDATED`。

再使用`Postman`进行查询，验证是否有真正修改掉。

从上的结果可以看出修改已经成功。

### 文档查询

查询指定按照定位来讲，只要有了`index`和`id`就能精确定位出文档了。步骤上也类似，仅`4`、`5`、`6` 三个步骤上存在差异。

**1、**`4`步构建的对象为，`org.elasticsearch.action.get.GetRequest`类的对象，；

**2、**`5`步指定`index`和`id`即可`getRequest.index("teacher").id("7001");`；

**3、** 发送查询文档请求，`client.get(getRequest,RequestOptions.DEFAULT);`得到响应对象`GetResponseresponse`.；

**4、** 得到的响应内容`response`的方法`getSource()`可以得到响应文档内容；

代码如下:

```java
package com.maomao.elastic.search.doc;
import org.apache.http.HttpHost;
import org.elasticsearch.action.get.GetRequest;
import org.elasticsearch.action.get.GetResponse;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestClientBuilder;
import org.elasticsearch.client.RestHighLevelClient;
import java.io.IOException;
/**
 * 文档查询
 */
public class DocGet {
    public static void main(String[] args) throws IOException {
        HttpHost host = new HttpHost("127.0.0.1", 9200, "http");
        RestClientBuilder builder = RestClient.builder(host);
        RestHighLevelClient client = new RestHighLevelClient(builder);
        // 构建请求文档的请求对象
        GetRequest getRequest = new GetRequest();
        getRequest.index("teacher").id("7001");
        // 发送查询文档请求
        GetResponse response = client.get(getRequest, RequestOptions.DEFAULT);
        System.out.println(response.getSource());
        client.close();
    }
}
```

执行结果：

### 文档删除

文档删除和查询类似，都需得定位到文档内容先,即必须指定`index`和`id`。步骤差异仅`4`、`5`、`6` 三个步骤上。

**1、**`4`步构建的对象是`DeleteRequest`；

**2、**`5`步只需要指定`index`和`ID``delete.index("teacher").id("7001");`.；

**3、** 发送删除请求执行`delete（）`方法.`client.delete(delete,RequestOptions.DEFAULT);`.；

代码：

```java
package com.maomao.elastic.search.doc;
import org.apache.http.HttpHost;
import org.elasticsearch.action.delete.DeleteRequest;
import org.elasticsearch.action.delete.DeleteResponse;
import org.elasticsearch.action.get.GetRequest;
import org.elasticsearch.action.get.GetResponse;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestClientBuilder;
import org.elasticsearch.client.RestHighLevelClient;
import java.io.IOException;
/**
 * 文档删除
 */
public class DocDelete {
    public static void main(String[] args) throws IOException {
        HttpHost host = new HttpHost("127.0.0.1", 9200, "http");
        RestClientBuilder builder = RestClient.builder(host);
        RestHighLevelClient client = new RestHighLevelClient(builder);
        // 构建删除文档的请求对象
        DeleteRequest delete = new DeleteRequest();
        delete.index("teacher").id("7001");
        // 发送删除文档请求
        DeleteResponse response = client.delete(delete, RequestOptions.DEFAULT);
        System.out.println(response.getResult());
        client.close();
    }
}
```

执行结果得到响应结果`DeleteResponse response`,调用`getResult()`方法可以获取到执行结果的描述`DELETED`。

通过`PostMan`查询文档结果。

从结果上看，已经不能找到响应的文档内容了。
