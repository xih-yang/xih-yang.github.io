# 03、MyBatis - CRUD的操作实现
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/1/3.html
- 分类：ORM框架
- 分组：教程目录
在MyBatis（二）的学习中我们已经实现了第一个MyBatis程序，现在我们要实现增删改查的完整操作，我们应该思考我们需要去修改哪些内容呢？

修改三个内容：Mapper接口、对应Mapper接口的xml配置文件、测试类。

## 一、查询

我们尝试一个根据id查询一个用户的信息。

**1、** 修改UserMapper接口；

在其中添加我们对应的方法：

```java
package com.jms.dao;
import java.util.List;
import com.jms.pojo.User;
public interface UserMapper {//根据id获取User信息
    User getUserbyid(int id);
}
```

**2、** 修改UerMapper.xml配置文件；

在其中添加我们实现接口方法的内容：

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
  PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<!-- 命名空间namespace对应Mapper接口 -->
<mapper namespace="com.jms.dao.UserMapper">
  <select id="getUserbyid" parameterType="int" resultType="com.jms.pojo.User">
      select * from mybaties.user where id=#{id}
  </select>
</mapper>
```

我们这里在对上面几个名称进行回顾：

1、namespace：命名空间，对应的是Mapper接口的全限定命名。

2、id：对应的时Mapper接口中的方法名。

3、parameterType：对应方法中传入的参数类型。

4、resultType：对应的是SQL语句的返回值类型。

**3、** junit测试；

```java
@Test
public void Select() {
    //利用工具类获取SqlSession
    SqlSession sqlSession = MyBatisUtil.getSqlSession();
    UserMapper userMapper = sqlSession.getMapper(UserMapper.class);
    User user = userMapper.getUserbyid(10000);
    System.out.println(user);
    sqlSession.close();
}    
```

测试结果：

## 二、增加

**1、** 修改UserMapper接口；

添加对应的方法：

```java
package com.jms.dao;
import java.util.List;
import com.jms.pojo.User;
public interface UserMapper {
    //增加用户信息
    int addUser(User user);
}
```

**2、** 修改UerMapper.xml配置文件；

在其中添加我们实现接口方法的内容：

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
  PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<!-- 命名空间namespace对应Mapper接口 -->
<mapper namespace="com.jms.dao.UserMapper">
  <!-- id对应接口中的方法 -->
  <insert id="addUser" parameterType="com.jms.pojo.User">
      insert mybaties.user value(#{id},#{username},#{password})
  </insert>
</mapper>
```

其中的#{id}、#{username}、#{password}都是对应着User的私有属性id、usename、password。

**3、** junit测试；

```java
@Test
    public void Insert() {
        //利用工具类获取SqlSession
        SqlSession sqlSession = MyBatisUtil.getSqlSession();
        UserMapper userMapper = sqlSession.getMapper(UserMapper.class);
        userMapper.addUser(new User(10006,"jms6","123456"));
        //提交事务
        sqlSession.commit();
        sqlSession.close();
    }
```

上述代码第8行的提交事务是必须的，否则无法将内容插入的数据库中。

测试结果：

我们可以看到数据成功插入。

## 三、修改

**1、** 修改UserMapper接口；

```java
package com.jms.dao;
import java.util.List;
import com.jms.pojo.User;
public interface UserMapper {
    //修改用户信息
    int UpdateUser(User user);
}
```

**2、** 修改UerMapper.xml配置文件；

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
  PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<!-- 命名空间namespace对应Mapper接口 -->
<mapper namespace="com.jms.dao.UserMapper">
  <!-- id对应接口中的方法 -->
  <update id="UpdateUser" parameterType="com.jms.pojo.User">
      update mybaties.user set username=#{username},password=#{password} where id=#{id}
  </update>
</mapper>
```

**3、** junit测试；

```java
@Test
    public void Update() {
        //利用工具类获取SqlSession
        SqlSession sqlSession = MyBatisUtil.getSqlSession();
        UserMapper userMapper = sqlSession.getMapper(UserMapper.class);
        userMapper.UpdateUser(new User(10006, "jms7", "456123"));
        //提交事务
        sqlSession.commit();
        sqlSession.close();
    }
```

测试结果：

## 四、删除

**1、** 修改UserMapper接口；

```java
package com.jms.dao;
import java.util.List;
import com.jms.pojo.User;
public interface UserMapper {
    //删除用户
    int DeleteUser(int id);
}
```

**2、** 修改UserMapper.xml配置文件；

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
  PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<!-- 命名空间namespace对应Mapper接口 -->
<mapper namespace="com.jms.dao.UserMapper">
  <!-- id对应接口中的方法 -->
  <delete id="DeleteUser" parameterType="int">
      delete from mybaties.user where id=#{id}
  </delete>
</mapper>
```

**3、** junit测试；

```java
@Test
    public void Delete() {
        //利用工具类获取SqlSession
        SqlSession sqlSession = MyBatisUtil.getSqlSession();
        UserMapper userMapper = sqlSession.getMapper(UserMapper.class);
        userMapper.DeleteUser(10006);
        //提交事务
        sqlSession.commit();
        sqlSession.close();
    }
```

测试结果：

## 五、总结

**1、** 注意Mapper.xml文件中各个名称的含义；

**2、** 注意增删改操作需要SqlSession.commit()进行提交事务；
