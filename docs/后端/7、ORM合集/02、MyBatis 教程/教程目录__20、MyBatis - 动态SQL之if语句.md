# 20、MyBatis - 动态SQL之if语句
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/1/20.html
- 分类：ORM框架
- 分组：教程目录
## 一、什么是动态SQL之if语句

if很简单了，就是满足条件就执行，不满足条件不执行。

那么动态SQL中的if语句是怎么样的呢？

首先我们来看一张表blog：

如果我们执行下面的SQL语句：

```java
select * from blog
```

肯定会将所有的数据都查出来。那么我们可以在后面加上where条件进行筛选，那么如果我们想不同的情况下执行不同的where甚至有时候多种情况一起发生怎么办，这时候我们就需要用到if进行判断并进行SQL语句的拼接了，就类似于下面这句SQL：

```java
select * from blog where title="" and author =""
```

但是若果我们把tilte和author都作为if判断中的内容，where后面岂不是什么也没有了，这时候我们就需要这样来写SQL语句：

```java
select * from blog where 1=1 and title="" and author =""
```

明白了动态SQLif的基本原理，我们就去具体的实现。

## 二、动态SQLif语句的实现

这里我会用四种方法来进行实现：

这四个方法的不同都是Mapper接口中的方法不同。

**1、** 函数重载；

BlogMapper接口中的方法有以下几个:

```java
List<Blog> QueryBlogsByIf();
List<Blog> QueryBlogsByIf(@Param("title") String title, @Param("author") String author);
```

BlogMapper.xml:

```xml
<select id="QueryBlogsByIf" resultType="Blog">
    select * from mybaties.blog where 1=1
    <if test="author != null">
        and author=#{author}
    </if>
    <if test="title != null">
        and title=#{title}
    </if>
</select>
```

if标签中的test就是判断语句。

我们进行测试：

```java
@Test
public void queryBlogIf() {
    SqlSession sqlSession = MyBatisUtil.getSqlSession();
    BlogMapper blogMapper = sqlSession.getMapper(BlogMapper.class);
    List<Blog> blogList = blogMapper.QueryBlogsByIf();
    for (Blog blog : blogList) {
        System.out.println(blog);
    }
　　　　 sqlSession.close();
}
```

调用不传任何参数的方法应该是查询所有数据：

没有问题。

接下来我们让auto不为空：

```java
@Test
public void queryBlogIf() {
    SqlSession sqlSession = MyBatisUtil.getSqlSession();
    BlogMapper blogMapper = sqlSession.getMapper(BlogMapper.class);
    List<Blog> blogList = blogMapper.QueryBlogsByIf(null, "jms");
    for (Blog blog : blogList) {
        System.out.println(blog);
    }
　　　　 sqlSession.close();
}
```

结果如下：

没有问题。

接下来我们让auther和title都不为空

```java
@Test
public void queryBlogIf() {
    SqlSession sqlSession = MyBatisUtil.getSqlSession();
    BlogMapper blogMapper = sqlSession.getMapper(BlogMapper.class);
    List<Blog> blogList = blogMapper.QueryBlogsByIf("learn mybatis day 5", "jms");
    for (Blog blog : blogList) {
        System.out.println(blog);
    }
　　　　　sqlSession.close();
}
```

结果如下：

没有问题。

到这里我们可以发现一个问题，我们完全可以不进行函数的重构，就只用一个函数

```java
 List<Blog> QueryBlogsByIf(@Param("title") String title, @Param("author") String author);
```

来进行传参，调用时只需要设定参数是否为null即可。这也就是我们讲的第二个方法，单一函数通过@Param注解传参。

**2、** 单一函数通过@Param注解传参；

这就是对方法1的简化与改进，在此就不多讲述。

**3、** 利用Map传参；

首先在BlogMapper接口中声明方法：

```java
List<Blog> QueryBlogsByIf2(Map<Object, Object> map);
```

在BlogMapper.xml中实现接口的方法：

```xml
<select id="QueryBlogsByIf2" parameterType="map" resultType="Blog">
    select * from mybaties.blog where 1=1
    <if test="author != null">
        and author=#{author}
    </if>
    <if test="title != null">
        and title=#{title}
    </if>
</select>
```

测试：

```java
@Test
public void queryBlogIf2() {
    SqlSession sqlSession = MyBatisUtil.getSqlSession();
    BlogMapper blogMapper = sqlSession.getMapper(BlogMapper.class);
    Map<Object, Object> map = new HashMap<>();
    map.put("title", "learn mybatis day 5");
    map.put("author", "jms");
    List<Blog> blogList = blogMapper.QueryBlogsByIf2(map);
    for (Blog blog : blogList) {
        System.out.println(blog);
    }
　　　　 sqlSession.close();
}
```

测试结果：

没有问题。

**4、** 利用JavaBean；

首先在BlogMapper接口中声明方法：

```java
List<Blog> QueryBlogsByIf3(Blog blog);
```

在BlogMapper.xml中实现接口的方法：

```xml
<select id="QueryBlogsByIf3" parameterType="Blog" resultType="Blog"> select * from mybaties.blog where 1=1 <if test="author != null"> and author=#{author} </if> <if test="title != null"> and title=#{title} </if> </select>
```

测试：

```java
@Test
public void queryBlogIf3() {
    SqlSession sqlSession = MyBatisUtil.getSqlSession();
    BlogMapper blogMapper = sqlSession.getMapper(BlogMapper.class);
    Blog blog = new Blog();
    blog.setTitle("learn mybatis day 5");
    blog.setAuthor("jms");
    List<Blog> blogList = blogMapper.QueryBlogsByIf3(blog);
    for (Blog blog1 : blogList) {
        System.out.println(blog1);
    }
　　　　 sqlSession.close();
}
```

测试结果：

没有问题。

但是始终有一个问题是不合适的，就是我们SQL语句中的where 1=1，这种情况官方给出了一个解决方法，那就是标签。

我们先修改mxl文件中的SQL语句：

```java
select id="QueryBlogsByIf" resultType="Blog">
    select * from mybaties.blog
    <where>
        <if test="author != null">
            and author=#{author}
        </if>
        <if test="title != null">
            and title=#{title}
        </if>
    </where>
</select>
```

同时官方给出了这样一句说明：

**where 元素只会在子元素返回任何内容的情况下才插入 “WHERE” 子句。而且，若子句的开头为 “AND” 或 “OR”，where 元素也会将它们去除。**
