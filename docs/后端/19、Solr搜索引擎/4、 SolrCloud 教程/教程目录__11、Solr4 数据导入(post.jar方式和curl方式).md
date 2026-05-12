# 11、Solr4 数据导入(post.jar方式和curl方式)
- 来源：https://ddkk.com/zhuanlan/search/solrcloud/11.html
- 分类：搜索引擎
- 分组：教程目录
```bash
1.使用post.jar方式
```

```bash
java -Durl=http://192.168.137.168:8080/solr/mycore/update -Ddata=files -jar /usr/local/solr-4.10.3/example/exampledocs/post.jar /usr/local/solr-4.10.3/example/multicore/exampledocs/ipod_other.xml
```

**2.使用curl命令方式**

**删除所有数据**

```bash
curl http://192.168.137.168:8080/solr/mycore/update?commit=true -H "Content-Type: text/xml" --data-binary "<delete><query>*:*</query></delete>"
```

**导入XML文档数据**

```bash
curl http://192.168.137.168:8080/solr/mycore/update?commit=true --data-binary @/usr/local/solr-4.10.3/example/multicore/exampledocs/ipod_other.xml -H 'Content-type:text/xml; charset=utf-8'
```

**导入json文档数据**

```bash
curl http://192.168.137.168:8080/solr/mycore/update?commit=true --data-binary @/home/test/books.json -H 'Content-type:application/json; charset=utf-8'
```

**导入csv文档数据**

我们的csv(books.csv)文件的内容如下：

```bash
id,name,price,inStock,author,series_t,sequence_i,genre_s
0553573403,A Game of Thrones,7.99,true,George R.R. Martin,"A Song of Ice and Fire",1,fantasy
0553579908,A Clash of Kings,7.99,true,George R.R. Martin,"A Song of Ice and Fire",2,fantasy
055357342X,A Storm of Swords,7.99,true,George R.R. Martin,"A Song of Ice and Fire",3,fantasy
0553293354,Foundation,7.99,true,Isaac Asimov,Foundation Novels,1,scifi
0812521390,The Black Company,6.99,false,Glen Cook,The Chronicles of The Black Company,1,fantasy
0812550706,Ender's Game,6.99,true,Orson Scott Card,Ender,1,scifi
0441385532,Jhereg,7.95,false,Steven Brust,Vlad Taltos,1,fantasy
0380014300,Nine Princes In Amber,6.99,true,Roger Zelazny,the Chronicles of Amber,1,fantasy
0805080481,The Book of Three,5.99,true,Lloyd Alexander,The Chronicles of Prydain,1,fantasy
080508049X,The Black Cauldron,5.99,true,Lloyd Alexander,The Chronicles of Prydain,2,fantasy
```

为了能够将上面的csv数据正确的导入，我们需要对solrconfig.xml文件进行如下修改：

```xml
<requestHandler name="/update/csv" class="solr.CSVRequestHandler" startup="lazy">
<lst name="defaults">
   <str name="separator">,</str>
   <str name="header">true</str>
   <str name="skip">genre_s</str>
   <str name="encapsulator">"</str>
</lst>
</requestHandler>
```

说明：

startup="lazy"：通过该参数告诉solr在第一次添加时才实例化这个更新处理程序

, : 通过该参数告诉solr 字段之间是通过“,”分隔

true：通过该参数告诉solr在数据项之前含有头信息

genre_s ：通过该参数告诉solr，publish_date 这列数据需要忽略掉

"：通过该参数告诉solr数据项是通过双引号(")进行封装的

设置完毕，重启solr，并提交数据：

```bash
curl http://192.168.137.168:8080/solr/mycore/update?commit=true --data-binary @/home/test/books.csv -H 'Content-type:text/csv; charset=utf-8'
```
