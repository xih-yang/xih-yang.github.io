# 08、Solr：菜单项目 Documents 使用办法
- 来源：https://ddkk.com/zhuanlan/search/solr/2/22.html
- 分类：搜索引擎
- 分组：Solr 实战 (B)
以 XML 格式举例

## 1.新增/修改

当 id 不存在时新增，当 id 存在修改。

```xml
<doc> 
	<field name="id">8</field> 
	<field name="name">明天更大卖</field> 
	<field name="price">98</field> 
</doc>
```

## 2.删除

### 2.1 根据主键删除

```xml
<delete>
	<id>8</id> 
</delete>
```

### 2.2 根据条件删除

```xml
<delete> 
	<query>*:*</query> 
</delete>
```
