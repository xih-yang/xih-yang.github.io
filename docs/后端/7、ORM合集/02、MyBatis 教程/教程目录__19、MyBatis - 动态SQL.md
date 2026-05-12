# 19、MyBatis - 动态SQL
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/1/19.html
- 分类：ORM框架
- 分组：教程目录
## 一、什么是动态SQL

官方文档给出了这样的说明：

**动态 SQL 是 MyBatis 的强大特性之一。如果你使用过 JDBC 或其它类似的框架，你应该能理解根据不同条件拼接 SQL 语句有多痛苦，例如拼接时要确保不能忘记添加必要的空格，还要注意去掉列表最后一个列名的逗号。利用动态 SQL，可以彻底摆脱这种痛苦。**

**使用动态 SQL 并非一件易事，但借助可用于任何 SQL 映射语句中的强大的动态 SQL 语言，MyBatis 显著地提升了这一特性的易用性。**

**如果你之前用过 JSTL 或任何基于类 XML 语言的文本处理器，你对动态 SQL 元素可能会感觉似曾相识。在 MyBatis 之前的版本中，需要花时间了解大量的元素。借助功能强大的基于 OGNL 的表达式，MyBatis 3 替换了之前的大部分元素，大大精简了元素种类，现在要学习的元素种类比原来的一半还要少。**

**if**

**choose (when, otherwise)**

**trim (where, set)**

**foreach**

总而言之，动态SQL就是根据不同的条件生成不同的SQL。

## 二、动态SQL的使用

**1、** 环境搭建；

1、数据库建立一个blog表

```java
CREATE TABLE blog (
  id VARCHAR(50) NOT NULL COMMENT '博客id',
  title VARCHAR(100) NOT NULL COMMENT '博客标题',
  author VARCHAR(30) NOT NULL COMMENT '博客作者',
  create_time DATETIME NOT NULL COMMENT '创建时间',
  views INT(30) NOT NULL COMMENT '浏览量'
) ENGINE=INNODB DEFAULT CHARSET=utf8
```

2、新建一个子maven模块

3、建立核心配置文件和资源文件

mybatis-config.xml

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
        PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
    <properties resource="db.properties" />
    <settings>
        <setting name="logImpl" value="STDOUT_LOGGING"/>
        <setting name="mapUnderscoreToCamelCase" value="true"/>
    </settings>
    <environments default="development">
        <environment id="development">
            <transactionManager type="JDBC"/>
            <dataSource type="POOLED">
                <property name="driver" value="${driver}"/>
                <property name="url" value="${url}"/>
                <property name="username" value="${username}"/>
                <property name="password" value="${password}"/>
            </dataSource>
        </environment>
    </environments>
</configuration>
```

db.properties

```java
driver=com.mysql.jdbc.Driver
url=jdbc:mysql://localhost:3306/MyBaties?useSSL=true&useUnicode=true&characterEncoding=UTF-8
username=root
password=123456
```

3、建立MyBayisUtil工具类

这个类用用来获取SqlSessio的。

```java
package com.jms.utils;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;
import java.io.IOException;
import java.io.InputStream;
//SqlSessionFactory-->SqlSession
public class MyBatisUtil {
    private static SqlSessionFactory sqlSessionFactory;
    //获取SqlSessionFactory对象
    static {
        try {
            String resource = "mybatis-config.xml";
            InputStream inputStream = Resources.getResourceAsStream(resource);
            sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    //通过SqlSessionFactory获取SqlSession对象，其中包含了面向数据库执行执行SQL命令所需要的方法
    public static SqlSession getSqlSession() {
        return sqlSessionFactory.openSession(true);
    }
}
```

4、建立实体类Blog

```java
package com.jms.pojo;
import java.util.Date;
public class Blog {
    private String id;
    private String title;
    private String author;
    private Date createTime;
    private int views;
    public Blog() {
    }
    public Blog(String id, String title, String author, Date createTime, int views) {
        this.id = id;
        this.title = title;
        this.author = author;
        this.createTime = createTime;
        this.views = views;
    }
    public String getId() {
        return id;
    }
    public void setId(String id) {
        this.id = id;
    }
    public String getTitle() {
        return title;
    }
    public void setTitle(String title) {
        this.title = title;
    }
    public String getAuthor() {
        return author;
    }
    public void setAuthor(String author) {
        this.author = author;
    }
    public Date getCreateTime() {
        return createTime;
    }
    public void setCreateTime(Date createTime) {
        this.createTime = createTime;
    }
    public int getViews() {
        return views;
    }
    public void setViews(int views) {
        this.views = views;
    }
    @Override
    public String toString() {
        return "Blog{" +
                "id='" + id + '\'' +
                ", title='" + title + '\'' +
                ", author='" + author + '\'' +
                ", createTime=" + createTime +
                ", views=" + views +
                '}';
    }
}
```

并且在mybatis-config.xml核心配置文件中设置别名：

```xml
<typeAliases>
   <typeAlias type="com.jms.pojo.Blog" alias="Blog"/>
</typeAliases>
```

5、建立BlogMapper接口和BlogMapper.xml配置文件

并在其中添加一个插入方法用于测试环境搭建是否成功。

BlogMapper接口

```java
package com.jms.dao;
import com.jms.pojo.Blog;
public interface BlogMapper {
    void insertBlog(Blog blog);
}
```

BlogMapper.xml

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.jms.dao.BlogMapper">
    <insert id="insertBlog" parameterType="Blog">
        insert into mybaties.blog
        values (#{id},#{title},#{author},#{createTime},#{views})
    </insert>
</mapper>
```

在核心配置文件mybatis-config.xml中进行mapper映射：

```xml
<mappers>
    <mapper resource="com/jms/dao/BlogMapper.xml"/>
</mappers>
```

6、建立测试类进行测试

```java
import com.jms.dao.BlogMapper;
import com.jms.pojo.Blog;
import com.jms.utils.BuildIdUtil;
import com.jms.utils.MyBatisUtil;
import org.apache.ibatis.session.SqlSession;
import org.junit.Test;
import java.util.Date;
public class MapperTest {
    @Test
    public void insertTest() {
        SqlSession sqlSession = MyBatisUtil.getSqlSession();
        BlogMapper blogMapper = sqlSession.getMapper(BlogMapper.class);
        Blog blog = new Blog(BuildIdUtil.buildID(), "learn mybatis day 1", "jms",
                new Date(), 5000);
        blogMapper.insertBlog(blog);
        blog = new Blog(BuildIdUtil.buildID(), "learn mybatis day 2", "jms",
                new Date(), 9999);
        blogMapper.insertBlog(blog);
        blog = new Blog(BuildIdUtil.buildID(), "learn mybatis day 3", "jms",
                new Date(), 1234);
        blogMapper.insertBlog(blog);
        blog = new Blog(BuildIdUtil.buildID(), "learn mybatis day 4", "jms",
                new Date(), 6753);
        blogMapper.insertBlog(blog);
        blog = new Blog(BuildIdUtil.buildID(), "learn mybatis day 5", "jms",
                new Date(), 454);
        blogMapper.insertBlog(blog);
　　　　 sqlSession.close();
    }
}
```

测试结果如下：

至此环境搭建完毕。

**2、** 标签的使用我们在后续继续学习；
