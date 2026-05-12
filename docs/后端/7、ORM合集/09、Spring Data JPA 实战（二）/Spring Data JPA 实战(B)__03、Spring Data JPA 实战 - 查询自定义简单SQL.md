# 03、Spring Data JPA 实战 - 查询自定义简单SQL
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/6/12.html
- 分类：ORM框架
- 分组：Spring Data JPA 实战(B)
### 一、必要的前言

在上一篇中我们讲到了CURD操作中的修改，新增，删除。这三个都是相对简单的操作，很方便也很快捷，今天就来讲一下相对而言比较复杂的查询操作，因为查询涉及众多，我们先从最基础的开始。

***本片教程继续使用上一篇中写好的小Dome***

### 二、JPA提供的查询接口（主键查询，查询全部，查询一组）

##### 1.浅谈API查询

- jpa提供的基础查询接口名称基本上都是由find字段开头

- 这些接口通过名称与参数即可分清到底是做什么的，这里就为一些理解能力稍稍逊色的同学来一个示例吧！

##### 2.主键查询

我们来创建一个`controller`层，添加一个`SelectController`，根请求路径`/select`

添加内容

```java
/**
 * 各种查询
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @Date:2022/1/30
 * @Description:cn.ddkk.springdatajpa.controller
 * @Version:1.0
 */
@RestController
@RequestMapping("/select")
public class SelectController {
    @Autowired
    private UsersJpaDao usersJpaDao;
    /**
     * 主键查询
     * @return
     */
    @GetMapping("/selectUserId")
    public Users selectUserId(@RequestParam("userId")Integer userId){
        Optional<Users> users=this.usersJpaDao.findById(userId);
        return users.get();
    }
}
```

注意`usersJpaDao.findById()` 该方法返回值是一个`Optional<>`对象，这是一个对象容器，可以判断该对象是否存在（`.isPresent()`），也可以返回该对象（`.get()`），*Optional<>对象不可以用于对象之间的比较*！！

##### 3.测试

打开浏览器，输入：

`http://localhost:8080/select/selectUserId?userId=2`

出现如下图所示即为成功

### 三、自定义简单SQL–多条件查询

通过上面的描述，大家应该会问，如果我想实现一个*通过账号密码查询*所有信息，API接口里并没有相关的方法，这个怎么办呢，这里就用到了自定义抽象方法了。

##### 1.修改UsersJpaDao

在我们`UsersJpaDao`接口中添加一个方法

```java
public interface UsersJpaDao extends JpaSpecificationExecutor<Users>, JpaRepository<Users, Integer> {
    //findBy(关键字)+属性名称(属性名称)+查询条件(首字母大写)
    Users findByUserNameAndUserPwd(String userName,String userPwd);
}
```

大家可能不太明白这里这个抽象方法是怎么回事，我给大家解释一下。

- 系统运行后，jpa会将这个抽象方法的名称按照严格的驼峰命名法去拆解，findByUserNameAndUserPwd拆解完成后就是 where userName=#{} and userPwd=#{}。从这里可以看到，这其实就是sql语句的“驼峰式写法”
- 这里有一个很严格的规定，首先是必须使用驼峰命名法，其次所需要判断的参数需要按照顺序与后面参数中的顺序对应。比如UserNameAndUserPwd对应的就是（userName，UserPwd）
- 抽象方法名称findByUserNameAndUserPwd中的And也是同sql语句中的and相同，用以连接，表示（且），还有其他很多如判断（Equals）、或（Or）等，下图是我从网络上找到的，分享一下

说到这里大家多多少少应该能明白是怎么回事了吧，说白了就是换了种形式，自己写个sql实现。如果还不明白就接着往下看吧，相信后面会让你明白的。

##### 2.修改SelectController

调用我们写的方法即可

```java
/**
 * 各种查询
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @Date:2022/1/30
 * @Description:cn.ddkk.springdatajpa.controller
 * @Version:1.0
 */
@RestController
@RequestMapping("/select")
public class SelectController {
    @Autowired
    private UsersJpaDao usersJpaDao;
    /**
     * 主键查询
     * @return
     */
    @GetMapping("/selectUserId")
    public Users selectUserId(@RequestParam("userId")Integer userId){
        Optional<Users> users=this.usersJpaDao.findById(userId);
        return users.get();
    }
    /**
     * 自定义sql查询
     * @return
     */
    @GetMapping("/selectUserNameAndUserPwd")
    public Users selectUserNameAndUserPwd(@RequestParam("userName")String userName,@RequestParam("userPwd")String userPwd){
        Users users=this.usersJpaDao.findByUserNameAndUserPwd(userName,userPwd);
        return users;
    }
}
```

##### 3.测试

启动项目，浏览器输入：

`http://localhost:8080/select/selectUserNameAndUserPwd?userName=lisi&userPwd=456789`

出现如下图所示即可

### 四、自定义简单SQL–模糊查询

这里可能`陈独秀`同学又要发言了，SQL基本查询中还有许多简单的查询，如模糊查询，这些要怎么实现呢？下面就带你来体验一下。

##### 1.修改UsersJpaDao接口

```java
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @Date:2022/1/28
 * @Description:cn.ddkk.springdatajpa.dao
 * @Version:1.0
 */
public interface UsersJpaDao extends JpaSpecificationExecutor<Users>, JpaRepository<Users, Integer> {
    //findBy(关键字)+属性名称(属性名称)+查询条件(首字母大写)
    //通过账号密码查询
    Users findByUserNameAndUserPwd(String userName,String userPwd);
    //通过账号模糊查询
    List<Users> findByUserNameLike(String userName);
}
```

经过上面的描述，到了这里大家应该能看明白吧，跟正常SQL语句没啥区别。

##### 2.修改SelectController

```java
/**
 * 各种查询
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @Date:2022/1/30
 * @Description:cn.ddkk.springdatajpa.controller
 * @Version:1.0
 */
@RestController
@RequestMapping("/select")
public class SelectController {
    @Autowired
    private UsersJpaDao usersJpaDao;
    /**
     * 主键查询
     * @return
     */
    @GetMapping("/selectUserId")
    public Users selectUserId(@RequestParam("userId")Integer userId){
        Optional<Users> users=this.usersJpaDao.findById(userId);
        return users.get();
    }
    /**
     * 自定义sql查询
     * 通过账号密码查询
     * @return
     */
    @GetMapping("/selectUserNameAndUserPwd")
    public Users selectUserNameAndUserPwd(@RequestParam("userName")String userName,@RequestParam("userPwd")String userPwd){
        Users users=this.usersJpaDao.findByUserNameAndUserPwd(userName,userPwd);
        return users;
    }
    /**
     * 自定义sql查询
     * 通过账号模糊查询
     * @return
     */
    @GetMapping("/selectUserNameLike")
    public List<Users> selectUserNameLike(@RequestParam("userName")String userName){
        List<Users> list=this.usersJpaDao.findByUserNameLike("%"+userName+"%");
        return list;
    }
}
```

这里可以看到`usersJpaDao.findByUserNameLike("%"+userName+"%")`中我们是给关键字`userName`两边添加`%`的，这里写法也是与SQL语句中一致的，不加的话就跟正常的查询没有什么区别了，如果大家觉得每次添加这个很麻烦可以封装一下或者做个方法切面也可以。

##### 3.测试

这里我们先看一下数据库吧

这里可以看到两条数据的账户中都有“i”这个字符，那就使用它吧。

启动项目打开浏览器输入：

`http://localhost:8080/select/selectUserNameLike?userName=i`

出现如下图所示即为成功

### 五、小结

相信现在大家应该能感受到SpringDataJpa带来的方便了，随便定义这么一个接口，基本什么都没有写，可以完成一系列操作，如果还是没感觉，等后面看看你就知道了，任何复杂的操作在SpringDataJpa中都是寥寥无几的一两行代码即可解决的。
