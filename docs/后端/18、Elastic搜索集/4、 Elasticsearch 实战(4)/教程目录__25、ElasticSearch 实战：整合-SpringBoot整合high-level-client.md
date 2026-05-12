# 25、ElasticSearch 实战：整合-SpringBoot整合high-level-client
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/4/25.html
- 分类：搜索引擎
- 分组：教程目录
> 接第24节

### 2、配置

1）、**配置**

在`PafcmallElasticsearchConfig` 配置类中添加如下配置：

```java
    public static final RequestOptions COMMON_OPTIONS;
    static {
        RequestOptions.Builder builder = RequestOptions.DEFAULT.toBuilder();
		// 这里先注释掉，目前没有用到，后边用到了再解释
//        builder.addHeader("Authorization", "Bearer " + TOKEN);
//        builder.setHttpAsyncResponseConsumerFactory(
//                new HttpAsyncResponseConsumerFactory
//                        .HeapBufferedResponseConsumerFactory(30 * 1024 * 1024 * 1024));
        COMMON_OPTIONS = builder.build();
    }
```

2）、**测试**

在`PafcmallSearchApplicationTests` 测试类中添加如下代码：

```java
    /**
     * 测试存储数据到es
     * 更新也是可以的
     */
    @Test
    void indexData() throws IOException {
        // 准备数据
        IndexRequest indexRequest = new IndexRequest("users");//索引名
        indexRequest.id("1");//数据id
        // 第一种方式
//        indexRequest.source("userName", "zhangsan", "age", 18, "gender", "男");
        // 第二种方式（推荐使用）
        User user = new User();
        user.setUserName("zhangsan");
        user.setAge(18);
        user.setGender("男");
        String jsonString = JSON.toJSONString(user);
        indexRequest.source(jsonString,XContentType.JSON); //要保存的内容
        // 执行操作
        IndexResponse index = client.index(indexRequest, PafcmallElasticsearchConfig.COMMON_OPTIONS);
        // 提取有用的数据相应
        System.out.println(index);
    }
    @Data
    class User{
        private String userName;
        private Integer age;
        private String gender;
    }
```

执行测试后可以看到创建索引成功：

在kibana 中查询一下：

更过配置信息请参考 [java-rest-high-getting-started-request-options](https://www.elastic.co/guide/en/elasticsearch/client/java-rest/current/java-rest-high-getting-started-request-options.html) 和 [java-rest-low-usage-request-options](https://www.elastic.co/guide/en/elasticsearch/client/java-rest/current/java-rest-low-usage-requests.html#java-rest-low-usage-request-options)
