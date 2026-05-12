# 06、Solr：分词 Analysis
- 来源：https://ddkk.com/zhuanlan/search/solr/2/20.html
- 分类：搜索引擎
- 分组：Solr 实战 (B)
在 Solr 可视化管理界面中，Core 的管理菜单项中都会有 Analysis。表示根据 Scheme.xml(managed-schema)中配置要求进行解析。

对英文解析就比较简单了，只要按照空格把英文语句拆分成英文单词即可

但是如果条件是中文时，把一句话按照字进行拆分就不是很合理了。正确的方式是按照合理的词组进行拆分。

## 1.中文分词器安装及配置步骤

上传 ik-analyzer.jar 到 webapps 中

去 -[传送门](https://search.maven.org/search?q=com.github.magese)- 下载对应版本的 ik-analyzer。可以在"软件/Analyzer"中直接获取。

### 1.1 上传 jar 到指定目录

上传 ik-analyzer-8.2.0.jar 到

/usr/local/solr/server/solr-webapp/webapp/WEB-INF/lib 目录中

### 1.2 修改配置文件

修改/usr/local/solr/server/solr/testcore/conf/managed-schema

#vim /usr/local/solr/server/solr/testcore/conf/managed-schema

添加下面内容。

排版：Esc 退出编辑状态下：gg=G

```xml
<field name="myfield" type="text_ik" indexed="true" stored="true" />
<fieldType name="text_ik" class="solr.TextField">
	<analyzer type="index">
		<tokenizer class="org.wltea.analyzer.lucene.IKTokenizerFactory" useSmart="false" conf="ik.conf"/>
		<filter class="solr.LowerCaseFilterFactory"/>
	</analyzer>
	<analyzer type="query">
		<tokenizer class="org.wltea.analyzer.lucene.IKTokenizerFactory" useSmart="true" conf="ik.conf"/>
		<filter class="solr.LowerCaseFilterFactory"/>
	</analyzer>
</fieldType>
```

### 1.3 重启

```bash
# cd /usr/local/solr/bin 
# ./solr stop -all 
# ./solr start -force
```

### 1.4 验证

可以在可视化管理界面中找到 myfield 属性进行验证。

## 2.managed-schema 配置说明

### 2.1

表示定义一个属性类型。在 Solr 中属性类型都是自定义的。在上面配置中 name="text_ik"为自定义类型。当某个属性取值为 text_ik 时 IK Analyzer 才能生效。

### 2.2

表示向 Document 中添加一个属性。

**常用属性：**

- name: 属性名
- type:属性类型。所有类型都是 solr 使用``配置的
- indexed: 是否建立索引
- stored: solr 是否把该属性值响应给搜索用户。
- required：该属性是否是必须的。默认 id 是必须的。
- multiValued：如果为 true，表示该属性为复合属性，此属性中包含了多个其他的属性。常用在多个列作为搜索条件时，把这些列定义定义成一个新的复合属性，通过搜索一个复合属性就可以实现搜索多个列。当设置为 true 时与``结合使用

### 2.3

唯一主键，Solr 中默认定义 id 属性为唯一主键。ID 的值是不允许重复的。

### 2.4

名称中允许*进行通配。代表满足特定名称要求的一组属性。
