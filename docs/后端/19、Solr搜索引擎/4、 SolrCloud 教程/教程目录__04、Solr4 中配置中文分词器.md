# 04、Solr4 中配置中文分词器
- 来源：https://ddkk.com/zhuanlan/search/solrcloud/4.html
- 分类：搜索引擎
- 分组：教程目录
**1、** 下载IKAnalyzer2012FF_hf1.zip并上传到/home/test；

**2、** 按照如下命令安装；

> cd /home/test
>
> unzip IK\ Analyzer\ 2012FF_hf1.zip -d IK
>
> cd /home/test/IK
>
> cp IKAnalyzer2012FF_u1.jar /home/tomcat6/webapps/solr/WEB-INF/lib/
>
> cp IKAnalyzer.cfg.xml stopword.dic /home/tomcat6/webapps/solr/WEB-INF/classes/
>
> vim /home/solrhome/collection1/conf/schema.xml

```xml
<fieldType name="text_ik" class="solr.TextField">
<analyzer type="index" class="org.wltea.analyzer.lucene.IKAnalyzer" isMaxWordLength="false"/>
<analyzer type="query" class="org.wltea.analyzer.lucene.IKAnalyzer" isMaxWordLength="true"/>
</fieldType>
```

**3、** 重启tomcat即可；

配置中文分词器前

配置中文分词器后

**4、** 扩展自己的词库；

vim/home/tomcat6/webapps/solr/WEB-INF/classes/IKAnalyzer.cfg.xml

添加ext.dic文件，在里面添加内容(必须为Encode in UTF-8 without BOM)

重启tomcat
