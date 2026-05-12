# 09、MyBatis - 结果集映射ResultMap
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/1/9.html
- 分类：ORM框架
- 分组：教程目录
## 一、什么是结果集映射

这里我们直接看MyBatis官方文档给出的内容：

### 结果映射

**resultMap 元素是 MyBatis 中最重要最强大的元素。它可以让你从 90% 的 JDBC ResultSets 数据提取代码中解放出来，并在一些情形下允许你进行一些 JDBC 不支持的操作。实际上，在为一些比如连接的复杂语句编写映射代码的时候，一份 resultMap 能够代替实现同等功能的数千行代码。ResultMap 的设计思想是，对简单的语句做到零配置，对于复杂一点的语句，只需要描述语句之间的关系就行了。**

## 二、为什么需要结果集映射

解决属性名和字段名不一致的问题。

我们来看下面一个例子：

首先我们看数据库表中的列名：

然后我们将User.class的password属性改为pwd属性，对应的get、set方法也要改。

下面是其它的配置：

UserMapper接口

```java
package com.jms.dao;
import com.jms.pojo.User;
public interface UserMapper {
    //根据id获取User信息
    User getUserbyid(int id);
}
```

UserMapper.xml

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<!-- 命名空间namespace对应Mapper接口 -->
<mapper namespace="com.jms.dao.UserMapper">
<!-- id对应接口中的方法 -->
    <select id="getUserbyid" parameterType="_int" resultType="User">
        select * from mybaties.user where id=#{id}
    </select>
</mapper>
```

测试类

```java
package com.jms.dao;
import com.jms.pojo.User;
import com.jms.utils.MyBatisUtil;
import org.apache.ibatis.session.SqlSession;
import org.junit.Test;public class UserMapperTest {
    @Test
    public void test() {
        //利用工具类获取SqlSession
        SqlSession sqlSession = MyBatisUtil.getSqlSession();
        //利用SqlSession获取UserMapper接口
        UserMapper userMapper = sqlSession.getMapper(UserMapper.class);
        //调用方法
        User user = userMapper.getUserbyid(10001);
        System.out.println(user);
        sqlSession.close();
    }
}
```

测试结果如下：

pwd的返回值是null。

为什么会出现这种问题呢，很明显，这与我们属性名的修改有关。而且经过我的测试，准确的说是与set方法有关。

那么怎么解决这个问题呢？

**1、** 最简单的就是字段对应；

让数据库的列名与实体类的属性名相同，这也是前面一直做的。

**2、** 在SQL语句中起别名；

首先我们来看上面的UserMapper.xml中的SQL语句：

select * from mybaties.user where id=#{id}

它的另一种种写法应该是：

select id,username,password from mybaties.user where id=#{id}

我们password起一个别名为pwd：

select id,username,password as pwd from mybaties.user where id=#{id}

现在我们将SQL语句修改为以上这句再来测试：

成功得到结果。

**3、** 第三种方法就是进行结果映射，我们在下面进行详细的介绍；

## 三、怎样进行结果集映射

我们直接上一段代码：

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<!-- 命名空间namespace对应Mapper接口 -->
<mapper namespace="com.jms.dao.UserMapper">
<resultMap id="UserMap" type="User">
        <!--column对应数据库表的列名,property对应实体类属性-->
        <result column="id" property="id"/>
        <result column="username" property="username"/>
        <result column="password" property="pwd"/>
    </resultMap>
    <!-- id对应接口中的方法-->
    <select id="getUserbyid" parameterType="_int" resultMap="UserMap">
        select * from mybaties.user where id=#{id}
    </select>
</mapper>
```

可以看见在SQL语句原来的resultType变成了resultMap，并且多了一个id为UserMap的标签。SQL中的resultMap对应的就是resultMap标签的id，而resultMap标签中的type对应的就是需要映射的实体类，其中的内容则被result标签包括着，column对应数据库表的列名，prooerty对应实体类的属性。

我们进行测试试一下：

嗯，问题解决。

问题虽然得到了解决，但是很明显上面我们id和username其实是不需要映射的，那么可不可以不对他们进行映射呢。

我们可以直接去测试，但我们首先抱着问题去看官方给出的文档内容：

**之前你已经见过简单映射语句的示例，它们没有显式指定 resultMap。比如：**

```xml
<select id="selectUsers" resultType="map">
  select id, username, hashedPassword
  from some_table
  where id ={id}
</select>
```

**上述语句只是简单地将所有的列映射到 HashMap 的键上，这由 resultType 属性指定。虽然在大部分情况下都够用，但是 HashMap 并不是一个很好的领域模型。你的程序更可能会使用 JavaBean 或 POJO（Plain Old Java Objects，普通老式 Java 对象）作为领域模型。MyBatis 对两者都提供了支持。**

很明显，这就是我们前面用过的一个map的拓展，继续往下看。

```java
package com.someapp.model;
public class User {
  private int id;
  private String username;
  private String hashedPassword;
  public int getId() {
    return id;
  }
  public void setId(int id) {
    this.id = id;
  }
  public String getUsername() {
    return username;
  }
  public void setUsername(String username) {
    this.username = username;
  }
  public String getHashedPassword() {
    return hashedPassword;
  }
  public void setHashedPassword(String hashedPassword) {
    this.hashedPassword = hashedPassword;
  }
}
```

**基于 JavaBean 的规范，上面这个类有 3 个属性：id，username 和 hashedPassword。这些属性会对应到 select 语句中的列名。**

**这样的一个 JavaBean 可以被映射到 ResultSet，就像映射到 HashMap 一样简单。**

```xml
<select id="selectUsers" resultType="com.someapp.model.User">
  select id, username, hashedPassword
  from some_table
  where id ={id}
</select>
```

这就是我们一直在用的javabean了，我们注意到其中一句话，他说没有指定显性的resultMap映射，意思也就是说有着隐性的resultMap映射，那么隐性的映射是怎样的呢，正如上面所说，属性会对应到select语句中的列名。对应不上的时候才需要显性的resultMap映射。

也就是说，resultMap映射其实是本来就存在的，它把列名和属性能对应的已经映射好了，我们只需要在显性映射中写出不能对应的即可。

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<!-- 命名空间namespace对应Mapper接口 -->
<mapper namespace="com.jms.dao.UserMapper">
    <resultMap id="UserMap" type="User">
        <!--column对应数据库表的列名,property对应实体类属性-->
        <result column="password" property="pwd"/>
    </resultMap>
    <!-- id对应接口中的方法-->
    <select id="getUserbyid" parameterType="_int" resultMap="UserMap">
        select * from mybaties.user where id=#{id}
    </select>
</mapper>
```

只留下为未对应的，进行测试：

测试结果没有问题。

但这只是简单的映射，后面会有更加复杂的情况，那个留在日后再进行深入学习。

在此再借用文档中的一句话进行结尾：

**如果这个世界总是这么简单就好了。**
