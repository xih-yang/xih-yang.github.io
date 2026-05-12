# 22、MyBatis - SQL片段（sql标签）
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/1/22.html
- 分类：ORM框架
- 分组：教程目录
## 一、什么是SQL片段

就是将我们Mapper.xml文件中部分SQL语句拿出来单独用一个sql标签进行标记，这个sql标签就是一个SQL片段。

## 二、为什么要用到SQL片段

这个sql标签可以被引用，这样需要用到这个sql标签中的SQL语句的地方直接引用就可以，如此一来就提高了SQL代码的复用性，而不至于有大片的重复SQL。

## 三、SQL片段的具体使用

```xml
<sql id="select-author-title">
    <if test="author != null">
        and author=#{author}
    </if>
    <if test="title != null">
        and title=#{title}
    </if>
</sql>
<select id="QueryBlogsByIf" resultType="Blog">
    select * from mybaties.blog
    <where>
        <include refid="select-author-title"/>
    </where>
</select>
```

先用sql标签将复用的SQL语句包裹起来，然后在需要的地方用include标签进行引用。

## 四、注意事项

**1、** 最好基于单表来定义SQL标签；

**2、** 不要存在where标签；
