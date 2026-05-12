# 02、Spring Data JPA 实战 - 增删改查
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/6/11.html
- 分类：ORM框架
- 分组：Spring Data JPA 实战(B)
### 一、必要的前言

通过上一篇我们了解了一下SpringDataJpa的基本使用，这一篇我们来讲解一下基本的增删改查，毕竟CURD操作是每个持久层框架必不可少的。

其实SpringDataJpa的增加我们上一篇中已经讲到了，这里就不做累述了，其他的其实与新增类似，已经为我们封装好了如何使用。

***本片教程继续使用上一篇中写好的小Dome***

### 二、先修改一下数据库

在数据库中增加两行内容，方面我们后续的CURD操作

### 三、CURD之修改

修改操作我上一篇教程中提到过，`usersJpaDao.save()`方法兼具修改能力，我们来试一下。

##### 1.修改启动类----添加一个修改接口

```java
@SpringBootApplication
@RestController
public class SpringdatajpaApplication {
    @Autowired
    private UsersJpaDao usersJpaDao;
    public static void main(String[] args) {
        SpringApplication.run(SpringdatajpaApplication.class, args);
    }
    /**
     * 新增
     * @param userName
     * @param userPwd
     * @return
     */
    @GetMapping("/insertUser")
    public Users insertUser(@RequestParam("userName")String userName,@RequestParam("userPwd")String userPwd){
        Users users=new Users();
        users.setUserName(userName);
        users.setUserPwd(userPwd);
        return this.usersJpaDao.save(users);
    }
    /**
     * 修改
     * @param userId
     * @param userName
     * @param userPwd
     * @return
     */
    @GetMapping("/updateUser")
    public Users updateUser(@RequestParam("userId")Integer userId,@RequestParam("userName")String userName,@RequestParam("userPwd")String userPwd){
        Users users=new Users();
        users.setUserName(userName);
        users.setUserPwd(userPwd);
        users.setUserId(userId);
        return this.usersJpaDao.save(users);
    }
}
```

***记住该接口中的对象需要添加一个主键，用于标明修改哪一条数据***

##### 2.测试

启动项目，待启动完成后浏览器输入

`http://localhost:8080/updateUser?userName=zhaoliu&userPwd=666666&userId=1`

出现如上图返回信息后查看数据库

这里张三就改成赵六了。

##### 3.小结

修改和新增都是共用一个方法即可完成，还有很多其他操作，比如

`saveAll（）`插入或修改一组数据其他的大家可以自己去查看API文档即可！

### 四、CURD—删除

删除操作也有很多封装好的方法，包括按主键删除、删除全部、删除一组数据等，我们就以主键删除为例，其他雷同。

##### 1.修改启动类----添加一个删除接口

```java
@SpringBootApplication
@RestController
public class SpringdatajpaApplication {
    @Autowired
    private UsersJpaDao usersJpaDao;
    public static void main(String[] args) {
        SpringApplication.run(SpringdatajpaApplication.class, args);
    }
    /**
     * 新增
     * @param userName
     * @param userPwd
     * @return
     */
    @GetMapping("/insertUser")
    public Users insertUser(@RequestParam("userName")String userName,@RequestParam("userPwd")String userPwd){
        Users users=new Users();
        users.setUserName(userName);
        users.setUserPwd(userPwd);
        return this.usersJpaDao.save(users);
    }
    /**
     * 修改
     * @param userId
     * @param userName
     * @param userPwd
     * @return
     */
    @GetMapping("/updateUser")
    public Users updateUser(@RequestParam("userId")Integer userId,@RequestParam("userName")String userName,@RequestParam("userPwd")String userPwd){
        Users users=new Users();
        users.setUserName(userName);
        users.setUserPwd(userPwd);
        users.setUserId(userId);
        return this.usersJpaDao.save(users);
    }
    /**
     * 删除
     * @param userId
     * @return
     */
    @GetMapping("/deleteUser")
    public String  deleteUser(@RequestParam("userId")Integer userId){
        this.usersJpaDao.deleteById(userId);
        return "删除成功";
    }
}
```

***值得一提的是个方法没有返回值，固需要使用其他手段判断是否删除成功，或者可以自定义一个删除方法，后续教程中会进行说明。***

这里有一地方指定注意 ：usersJpaDao.deleteById() 方法看上去好像是以id字段删除，容易让人感觉成 where id=#{id} ，实则不然，这里指的是按照**主键**删除，任何字段名称都可以。还有，这里的主键类型通过源码可以看到，***是根据你接口中定义的类型而决定的***。

下面两张图为源码中类型的选定：

下图为你创建继承jpaRepository时输入的类型

##### 2.测试

启动项目，浏览器输入：

`http://localhost:8080/deleteUser?userId=3`

查看数据即可发现删除成功

我们的王五就这么没了！

### 五、小结

大家估计想问，查询呢？？？众所周知查询是CURD中最复杂的存在，所以我打算分几张来给大家讲解一下，目的就是为了让大家思路更加清晰，上手更快，还是那句话，如果有不懂的可以留言或者私聊哦。
