# 21、MyBatis - 动态SQL的常用标签
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/1/21.html
- 分类：ORM框架
- 分组：教程目录
在上一篇if中我们已经把if和where标签进行了学习，现在我们学习一些剩下的标签。

## 一、set标签

首先看官方文档给出的说明：

**用于动态更新语句的类似解决方案叫做 set。set 元素可以用于动态包含需要更新的列，忽略其它不更新的列。**

**set 元素会动态地在行首插入 SET 关键字，并会删掉额外的逗号（这些逗号是在使用条件语句给列赋值时引入的）。**

我们不难明白set标签是用在update语句用代替原来的set字段，接下来我们看一下set标签的具体应用。

**1、** 在BlogMapper接口中声明方法；

```java
void UpdateBySet(Map<Object, Object> map);
```

我这里是通过map传递参数，其他传参方式也都可以。

**2、** 配置BlogMapper.xml文件；

```xml
<update id="UpdateBySet" parameterType="map">
update mybaties.blog
    <set>
    <if test="id != null">id=#{id},</if>
    <if test="author != null">author=#{author},</if>
    <if test="views != null">views=#{views},</if>
    </set>
where title=#{title}
</update>
```

可以看到，这是一个动态更新的模式，会根据if语句判断哪些更新哪些不更新。

但我们可以发现一个问题，如果我们没有任何一个if语句成立，SQL语句就会有问题，所以我们要尽力避免这样的事情发生。

**3、** 测试；

首先测试，只修改部分内容

```java
@Test
public void updateBySet() {
    SqlSession sqlSession = MyBatisUtil.getSqlSession();
    BlogMapper blogMapper = sqlSession.getMapper(BlogMapper.class);
    Map<Object, Object> map = new HashMap<>();
    map.put("title", "learn mybatis day 5");
    map.put("id", "sadafssdf42");
    blogMapper.UpdateBySet(map);
}
```

测试结果：

更新成功。

再测试更新所有内容

```java
@Test
public void updateBySet() {
    SqlSession sqlSession = MyBatisUtil.getSqlSession();
    BlogMapper blogMapper = sqlSession.getMapper(BlogMapper.class);
    Map<Object, Object> map = new HashMap<>();
    map.put("title", "learn mybatis day 5");
    map.put("id", "asdfgh456123");
    map.put("author", "jms101");
    map.put("views", 99999);
    blogMapper.UpdateBySet(map);
}
```

结果如下：

## 二、choose (when, otherwise)标签

官方文档说明：**有时候，我们不想使用所有的条件，而只是想从多个条件中选择一个使用。针对这种情况，MyBatis 提供了 choose 元素，它有点像 Java 中的 switch 语句。**

我们看一下这个标签的具体应用

**1、** 在BlogMapper接口中声明方法；

```java
List<Blog> QueryBlogsByChoose(Map<Object, Object> map);
```

**2、** 在BlogMapper.xml中配置；

```xml
<select id="QueryBlogsByChoose" parameterType="map" resultType="Blog">
    select * from mybaties.blog
    <where>
        <choose>
            <when test="title != null">
                title=#{title}
            </when>
            <when test="author != null">
                 author=#{author}
            </when>
            <otherwise>
                views>#{views}
            </otherwise>
        </choose>
    </where>
</select>
```

choose与java的switch语句类似，但又不完全相同，它是先依次判断when标签里面的语句是否符合，符合就执行SQL并且不会继续往下执行其他when或otherwise标签，所以在前面的when标签具有更高的优先级，当所有when标签都不符合时，才会执行otherwise中的SQL。

**3、** 测试；

1、我们先测试所有when都不符合的情况：

```java
@Test
public void queryBlogsChoose() {
    SqlSession sqlSession = MyBatisUtil.getSqlSession();
    BlogMapper blogMapper = sqlSession.getMapper(BlogMapper.class);
    Map<Object, Object> map = new HashMap<>();
    map.put("views", 0);
    List<Blog> blogList = blogMapper.QueryBlogsByChoose(map);
    for (Blog blog : blogList) {
        System.out.println(blog);
    }
}
```

测试结果：

执行了otherwise中的SQL。

2、测试满足第二个when的情况

```java
@Test
public void queryBlogsChoose() {
    SqlSession sqlSession = MyBatisUtil.getSqlSession();
    BlogMapper blogMapper = sqlSession.getMapper(BlogMapper.class);
    Map<Object, Object> map = new HashMap<>();
    map.put("views", 0);
    map.put("author", "jms");
    List<Blog> blogList = blogMapper.QueryBlogsByChoose(map);
    for (Blog blog : blogList) {
        System.out.println(blog);
    }
}
```

测试结果：

执行的是第二个when标签中的SQL语句，没有问题。

3、测试所有when标签都满足的情况

```java
@Test
public void queryBlogsChoose() {
    SqlSession sqlSession = MyBatisUtil.getSqlSession();
    BlogMapper blogMapper = sqlSession.getMapper(BlogMapper.class);
    Map<Object, Object> map = new HashMap<>();
    map.put("views", 0);
    map.put("author", "jms");
    map.put("title", "learn mybatis day 5");
    List<Blog> blogList = blogMapper.QueryBlogsByChoose(map);
    for (Blog blog : blogList) {
        System.out.println(blog);
    }
}
```

测试结果：

执行的是第一个when标签中的内容。

如此一来，结论很明确了。when标签越往前优先级越高，执行一个后就不会再执行其他的。

（本文仅作个人学习记录用。如有纰漏敬请指正）
