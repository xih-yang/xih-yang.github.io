# 13、ElasticSearch 实战：Spring Data ElasticSearch 的使用（三）——NativeSearchQuery 高亮查询
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/6/13.html
- 分类：搜索引擎
- 分组：教程目录
在Elasticsearch的实际应用中，经常需要将匹配到的结果字符进行高亮显示，此处采取NativeSearchQuery原生查询的方法，实现查询结果的高亮显示。

```java
 1 /**
 2      * 高亮查询
 3      */
 4     @Test
 5     public void testNativeSearchQuery(){
 6         String fild="content";
 7         NativeSearchQuery nativeSearchQuery=new NativeSearchQueryBuilder()
 8                 .withQuery(QueryBuilders.queryStringQuery("黄").defaultField(fild))
 9                 .withHighlightFields(new HighlightBuilder.Field(fild))
10                 .build();
11         AggregatedPage<Film> list =  elasticsearchTemplate.queryForPage(nativeSearchQuery, Film.class, new SearchResultMapper() {
12            @Override
13            public <T> AggregatedPage<T> mapResults(SearchResponse response, Class<T> clazz, Pageable pageable) {
14                List<Film> films = new ArrayList<>();
15                SearchHits hits = response.getHits();
16                for (SearchHit hit:hits){
17                    if(hits.getHits().length<=0){
18                        return null;
19                    }
20                    Film film=new Film();
21                    String hightLightMessage = hit.getHighlightFields().get(fild).fragments()[0].toString();
22                    film.setId(Long.parseLong(hit.getId()));
23                    film.setTitle(hit.getSource().get("title").toString());
24                    film.setContent(hit.getSource().get("content").toString());
25                    film.setDirector(hit.getSource().get("director").toString());
26                    film.setPrice(hit.getSource().get("price").toString());
27                    film.setDate(hit.getSource().get("date").toString());
28 
29                    try {
30                        String setMethodName = parSetName(fild);
31                        Class<? extends Film> filmClass = film.getClass();
32                        Method setMethod = filmClass.getMethod(setMethodName,String.class);
33                        setMethod.invoke(film,hightLightMessage);
34                    }catch (Exception e){
35                        e.printStackTrace();
36                    }
37                    films.add(film);
38 
39                }
40                if (films.size()>0){
41                    return new AggregatedPageImpl<>((List<T>) films);
42                }
43                return null;
44            }
45        });
46        list.getContent().forEach(film -> System.out.println(film));
47     }
48 
49 
50 
51     public String parSetName(String fieldName){
52         if (null == fieldName || "".equals(fieldName)) {
53             return null;
54         }
55         int startIndex = 0;
56         if (fieldName.charAt(0) == '_')
57             startIndex = 1;
58         return "set" + fieldName.substring(startIndex, startIndex + 1).toUpperCase()
59                 + fieldName.substring(startIndex + 1);
60     }
```

测试结果：
