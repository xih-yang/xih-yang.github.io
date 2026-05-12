# 14、MyBatis - 注解实现增删改查
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/1/14.html
- 分类：ORM框架
- 分组：教程目录
接上一篇，我们上一篇说到了不配置Mapper.xml文件，直接在接口中使用注解进行映射，这里我们将简单的增删改查全部用注解实现一遍。

## 一、设置自动提交事务

在去实现之前，我们先想一下我们前面实行增删改的事务时，每次都要手动提交事务，那么有没有什么方法可以自动提交呢，答案是有的。

修改我们的工具类MyBatisUtil.class

将getSqlSession()方法修改如下：

```java
public static SqlSession getSqlSession() {
        return sqlSessionFactory.openSession(true);
    }
```

嗯，没错，只是加了一个true，但这就是自动提交事务的开关，默认情况下是关闭的。

## 二、在UserMapper接口中声明相应的方法并作注解

```java
package com.jms.dao;
import com.jms.pojo.User;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;
import java.util.List;
public interface UserMapper {
    @Select("select * from user")
    List<User> getUserList();
    //查
    @Select("select * from user where id=#{id}")
    User getUserByID(int id);
    //增
    @Insert("insert into user values(#{id},#{username},#{password})")
    void insertUser(User user);
    //改
    @Update("update user set username=#{username},password=#{password} where id=#{id}")
    void updateUser(User user);
    //删
    @Delete("delete from user where id=#{id}")
    void deleteUser(int id);
}
```

## 三、junit测试

```java
package com.jms.dao;
import com.jms.pojo.User;
import com.jms.utils.MyBatisUtil;
import org.apache.ibatis.session.SqlSession;
import org.junit.Test;
import java.util.List;
public class UserMapperTest {
    @Test
    public void test() {
        SqlSession sqlSession = MyBatisUtil.getSqlSession();
        UserMapper userMapper = sqlSession.getMapper(UserMapper.class);
        List<User> userList = userMapper.getUserList();
        for (User user : userList) {
            System.out.println(user);
        }
　　　　　sqlSession.close();
    }
    @Test
    public void select() {
        SqlSession sqlSession = MyBatisUtil.getSqlSession();
        UserMapper userMapper = sqlSession.getMapper(UserMapper.class);
        User user = userMapper.getUserByID(10001);
        System.out.println(user);
　　　　　sqlSession.close();
    }
    @Test
    public void insert() {
        SqlSession sqlSession = MyBatisUtil.getSqlSession();
        UserMapper userMapper = sqlSession.getMapper(UserMapper.class);
        userMapper.insertUser(new User(10020, "jms20", "123456"));
　　　　　sqlSession.close();
    }
    @Test
    public void update() {
        SqlSession sqlSession = MyBatisUtil.getSqlSession();
        UserMapper userMapper = sqlSession.getMapper(UserMapper.class);
        userMapper.updateUser(new User(10020, "JMS20", "1111111"));
　　　　　sqlSession.close();
    }
    @Test
    public void delete() {
        SqlSession sqlSession = MyBatisUtil.getSqlSession();
        UserMapper userMapper = sqlSession.getMapper(UserMapper.class);
        userMapper.deleteUser(10020);
　　　　　sqlSession.close();
    }
}
```

首先我们执行查询全部，看一下目前表中的内容：

然后我们执行根据id进行查询：

接下来我们去插入一行新的内容，并查询全部看是否插入成功：

多了一行id为10020的，插入成功。

插入成功后我们执行update测试，并查询：

修改成功。

最后删除我们刚刚插入的那条语句并查询：

回到了最初的状态，删除成功。

以上就是使用注解映射来实现增删改查的简单应用了。
