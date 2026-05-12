# 11、Solr：Spring Data for Apache Solr
- 来源：https://ddkk.com/zhuanlan/search/solr/2/25.html
- 分类：搜索引擎
- 分组：Solr 实战 (B)
## 1.Spring Data 简介

Spring Data 是 Spring 的顶级项目。里面包含了 N 多个二级子项目，每个子项目对应一种技术或工具。其目的为了让数据访问更加简单，更加方便的和 Spring 进行整合

Spring Data 项目如果单独使用是还需要配置 XML 配置文件的，当和 Spring Boot 整合后使用起来非常方便。spring-boot-starter-data-xx 就是对应的启动器

## 2.实现步骤

### 2.1 添加依赖

```xml
<dependencies>
	<dependency>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starter-web</artifactId>
	</dependency>
	<dependency>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starter-test</artifactId>
	</dependency>
	<dependency>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starter-data-solr</artifactId>
	</dependency>
</dependencies>
```

### 2.2 编写配置文件

```bash
spring:
	data:
		solr:
			host: http://192.168.9.132:8080/solr
			# zk-host: 192.168.9.132:2181,192.168.9.132:2182,192.168.9.132:2183
			core:collection1
```

### 2.3 编写测试类

```java
@RunWith(SpringJUnit4ClassRunner.class)
@SpringBootTest(classes = MyApplication.class)
public class MyTest {
	@Autowired
	private SolrTemplate solrTemplate;
	public void testInsert(){
		SolrInputDocument doc = new SolrInputDocument();
		doc.setField("id","002");
		doc.setField("item_title","这是一个手机3");
		UpdateResponse ur = solrTemplate.saveBean("collection1", doc);
		if(ur.getStatus()==0){
			System.out.println("成功");
		}else{
			System.out.println("失败");
		}
		solrTemplate.commit("collection1");
	}
	public void testDelete(){
		UpdateResponse ur = solrTemplate.deleteByIds("collection1", "change.me");
		if(ur.getStatus()==0){
			System.out.println("成功");
		}else{
			System.out.println("失败");
		}
		solrTemplate.commit("collection1");
	}
	public void query(){
		SimpleQuery query = new SimpleQuery();
		Criteria c = new Criteria("item_keywords");
		c.is("手机");
		query.addCriteria(c);
		query.setOffset(1L);
		query.setRows(1);
		ScoredPage<DemoPojo> sp = solrTemplate.queryForPage("collection1", query, DemoPojo.class);
		System.out.println(sp.getContent());
	}
	@Test
	public void queryHL(){
		List<DemoPojo> listResult = new ArrayList<>();
		SimpleHighlightQuery query = new SimpleHighlightQuery();
		//设置查询条件
		Criteria c = new Criteria("item_keywords");
		c.is("手机");
		query.addCriteria(c);
		//分页
		query.setOffset(0L);
		query.setRows(10);
		//排序
		Sort sort = new Sort(Sort.Direction.DESC,"id");
		query.addSort(sort);
		//高亮设置
		HighlightOptions hlo = new HighlightOptions();
		hlo.addField("item_title item_sell_point");
		hlo.setSimplePrefix("<span style='color:red;'>");
		hlo.setSimplePostfix("</span>");
		query.setHighlightOptions(hlo);
		HighlightPage<DemoPojo> hl = solrTemplate.queryForHighlightPage("collection1", query, DemoPojo.class);
		// System.out.println(hl.getContent());
		List<HighlightEntry<DemoPojo>> highlighted = hl.getHighlighted();
		for(HighlightEntry<DemoPojo> hle : highlighted){
			List<HighlightEntry.Highlight> list = hle.getHighlights();
			DemoPojo dp = hle.getEntity();
			for (HighlightEntry.Highlight h : list){
     //一个对象里面可能多个属性是高亮属性
				if(h.getField().getName().equals("item_title")){
					dp.setItem_title( h.getSnipplets().get(0));
				}
			}
			listResult.add(dp);
		}
		System.out.println(listResult);
	}
}
```
