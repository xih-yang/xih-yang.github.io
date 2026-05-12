# 13、MyBatis - 使用注解开发
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/1/13.html
- 分类：ORM框架
- 分组：教程目录
## 一、什么是使用注解开发

使用注解开发就是无需再配置Mapper.xml文件，直接在接口中利用注解实现SQL语句。

## 二、为什么要使用注解开发

正如官方文档所说：

**使用注解来映射简单语句会使代码显得更加简洁。**

**但对于稍微复杂一点的语句，Java 注解不仅力不从心，还会让你本就复杂的 SQL 语句更加混乱不堪。 因此，如果你需要做一些很复杂的操作，最好用 XML 来映射语句。**

## 三、如何使用注解进行开发

**1、** 删掉原来的UserMapper.xml；

**2、** 修改UserMapper接口；

```java
package com.jms.dao;
import com.jms.pojo.User;
import org.apache.ibatis.annotations.Select;
import java.util.List;
public interface UserMapper {
    @Select("select * from user")
    List<User> getUserList();
}
```

在方法上面的那就是注解。

**3、** 修改核心配置文件mybatis-config.xml中的mapper映射；

```xml
<mappers>
    <mapper class="com.jms.dao.UserMapper"/>
 </mappers>
```

原来是映射xml文件，现在我们修改为映射接口。

**4、** junit测试；

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
}
```

测试结果如下：

测试结果没有问题。

那么问题就来了，我们究竟应该在xml文件中去映射呢还是用注解进行映射呢。上面其实已经说得很明白了，简单的语句用注解映射更加简洁，而复杂的语句则应该用xml文件进行映射。正如官方文档的一句话：**选择何种方式来配置映射，以及认为是否应该要统一映射语句定义的形式，完全取决于你和你的团队。 换句话说，永远不要拘泥于一种方式，你可以很轻松的在基于注解和 XML 的语句映射方式间自由移植和切换。**

技术没有高低好坏之分，有区别的是使用技术的人。
