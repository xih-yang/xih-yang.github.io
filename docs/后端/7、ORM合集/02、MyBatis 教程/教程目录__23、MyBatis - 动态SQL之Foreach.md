# 23、MyBatis - 动态SQL之Foreach
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/1/23.html
- 分类：ORM框架
- 分组：教程目录
前面我们已经学习了动态SQL的if、where、set、choose(when,otherwise)，今天我们来学习剩下的foreach。

什么时候用到foreach呢？比如说我们要查询一个表中id为1，3，4的数据，我们应该写SQL语句为：

```java
select * 
from TABLE
where (id=1 or id=3 or id=4)
```

这时候我们就可以把需要查的这些id的数据存放到一个集合中，通过遍历这个集合来查询到这些数据，这种时候我们就用到foreach了。

下面我们来看foreach的具体使用。

还是先在BlogMapper接口中声明一个方法：

```java
List<Blog> QueryBlogsByForeach(Map<Object, Object> map);
```

然后配置BlogMapper.xml文件：

```xml
<select id="QueryBlogsByForeach" parameterType="map" resultType="Blog">
    select * from mybaties.blog
    <where>
        <foreach collection="authors" item="author" open="(" close=")" separator="or">
            author=#{author}
        </foreach>
    </where>
</select>
```

这里我们来看上面的foreach标签，collection代表着集合的名字；item表示集合元素，名字自定义，但要与下面的#{}中的字段名一致；open和close代表两边的边界；separator代表分割元素的字段。

接下来测试一下：

```java
@Test
public void queryBlogsForEache() {
    SqlSession sqlSession = MyBatisUtil.getSqlSession();
    BlogMapper blogMapper = sqlSession.getMapper(BlogMapper.class);
    ArrayList<String> authors = new ArrayList<>();
    Map<Object, Object> map = new HashMap<>();
    map.put("authors", authors);
    List<Blog> blogList = blogMapper.QueryBlogsByForeach(map);
    for (Blog blog : blogList) {
        System.out.println(blog);
    }
    sqlSession.close();
}
```

看上面的测试，我们是先声明了一个集合，然后将集合存入Map，相应的键就命名“authors”。

测试结果如下：

此时由于集合中没有任何元素，所以查询出来的就是所有的结果。

接下来我们往集合里添加元素。

```java
@Test
public void queryBlogsForEache() {
    SqlSession sqlSession = MyBatisUtil.getSqlSession();
    BlogMapper blogMapper = sqlSession.getMapper(BlogMapper.class);
    ArrayList<String> authors = new ArrayList<>();
    authors.add("jms");
    authors.add("jms1");
    authors.add("jms2");
    Map<Object, Object> map = new HashMap<>();
    map.put("authors", authors);
    List<Blog> blogList = blogMapper.QueryBlogsByForeach(map);
    for (Blog blog : blogList) {
        System.out.println(blog);
    }
    sqlSession.close();
}
```

测试结果如下：

可以看见这次我们查询的是author='jms1' or author='jms2' or author='jms'的结果。
