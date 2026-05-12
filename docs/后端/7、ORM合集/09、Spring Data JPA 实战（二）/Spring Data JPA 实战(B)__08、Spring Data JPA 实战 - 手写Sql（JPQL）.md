# 08、Spring Data JPA 实战 - 手写Sql（JPQL）
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/6/17.html
- 分类：ORM框架
- 分组：Spring Data JPA 实战(B)
### 一、必要的前言

本篇我们讲述使用SpringDataJpa进行手写Sql。其实我并不建议大家手写sql，那就感觉体现不出SpringDataJpa的高大上了，但是某些情况下也确实需要，所以还是说一下吧。

本章先讲述如何在SpringDataJpa中使用JPQL，所谓JPQL，就像之前使用hibernate中的HQL一样。使用JPQL时参数传递有两种方式，我分别演示。

***本片教程继续使用上一篇中写好的小Dome***

### 二、修改RoleJpaDao.java文件

```java
import cn.ddkk.springdatajpa.pojo.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @Description:cn.ddkk.springdatajpa.dao
 * @Version:1.0
 */
public interface RoleJpaDao extends JpaSpecificationExecutor<Role>, JpaRepository<Role, Integer> {
    //方式一：按位置摆放参数
    @Query(value = "SELECT p FROM Role p WHERE p.roleId= ?1")
    List<Role> queryByIdUseHql01(Integer roleId);
	//方式二：按名称录入参数
    @Query(value = "SELECT p FROM Role p WHERE p.roleId= :roleId")
    List<Role> queryByIdUseHql02(@Param("roleId") Integer roleId);
}
```

我们新增一个`queryByIdUseHql01`方法这里有三点需要注意：

**1、**`value`中写入JPOL，学过Hibernate的同学应该知道，hibernate中有一个hql，可以自动翻译成对应数据库的sql，JPQL也是如此，它是一个可移植的面向对象的语言具体的可以百度或者查询一下官方文档，这里就先不做太多说明了；

**2、** 语句中`Role`是类的名称，并不是数据库中的表名；

**3、** 语句中`?1`代表的是下方抽象方法中第1个参数`?2`代表第二个，以此类推；

我们新增一个`queryByIdUseHql02`方法需要注意：

**1、** 语句中`:`后面引用参数名称与`@Param`注解中参数名称对应；

### 三、修改RoleController.java文件，增加一个查询的方法selectHqlById（）

```java
package cn.ddkk.springdatajpa.controller;
import cn.ddkk.springdatajpa.dao.RoleJpaDao;
import cn.ddkk.springdatajpa.pojo.Jurisdiction;
import cn.ddkk.springdatajpa.pojo.Role;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @Description:cn.ddkk.springdatajpa.controller
 * @Version:1.0
 */
@RestController
@RequestMapping("/role")
public class RoleController {
    @Autowired
    private RoleJpaDao roleJpaDao;
    @GetMapping("/insertRole")
    public Role insertRole(){
        //先将数据库中第二条管理员拿出来
        Role role=new Role();
        role.setRoleName("管理员");
        role.setRoleId(2);
        //将数据库中踢人及禁言功能给予管理员角色
        Jurisdiction jurisdiction1=new Jurisdiction();
        jurisdiction1.setJurisdictionId(1);
        jurisdiction1.setJurisdictionName("踢人");
        Jurisdiction jurisdiction2=new Jurisdiction();
        jurisdiction2.setJurisdictionId(4);
        jurisdiction2.setJurisdictionName("禁言");
        Set<Jurisdiction> set=new HashSet<>();
        set.add(jurisdiction1);
        set.add(jurisdiction2);
        //添加入角色
        role.setJurisdiction(set);
        //这里我说明一下，这里我们用到的是修改的能力，因为之前没考虑好，把类命名成Insert了
        //抱歉，总之这里是把数据库表t_Role中管理员加上权限。
        return this.roleJpaDao.save(role);
    }
    @GetMapping("/selectHqlById")
    public List<Role> selectHqlById(@RequestParam("roleId")Integer roleId){
        return this.roleJpaDao.queryByIdUseHql01(roleId);
    }
}
```

### 四、测试

运行项目，浏览器输入：

`http://localhost:8080/role/selectHqlById?roleId=1`

### 五、第二种参数录入演示，将RoleController.java文件中方法selectHqlById（）修改一下

```java
@GetMapping("/selectHqlById")
    public List<Role> selectHqlById(@RequestParam("roleId")Integer roleId){
    	//使用02方法
        return this.roleJpaDao.queryByIdUseHql02(roleId);
    }
```

### 六、测试

运行项目，浏览器输入：

`http://localhost:8080/role/selectHqlById?roleId=1`

显示与上面相同。

### 七，修改与删除

使用JQPL时有几个需要注意的地方：

**1、** 在`@Query`注解中编写JPQL实现DELETE和UODATE操作的时候必须加`@Modifying`注解，以通知Springdata这是一个DELETE或UPDATE操作；

**2、** UPDATE或DELETE操作需要使用事务，此时需要定义Service层，在Service层的方法上添加事务操作；

**3、** 注意JPQL不支持INSERT操作；

**4、** sql语句与JPQL都适用；

下面我们来演示一下删除的吧

### 八，删除

##### 1. 修改数据库表t_role

##### 2. 修改RoleJpaDao.java文件

```java
import cn.ddkk.springdatajpa.pojo.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @Description:cn.ddkk.springdatajpa.dao
 * @Version:1.0
 */
public interface RoleJpaDao extends JpaSpecificationExecutor<Role>, JpaRepository<Role, Integer> {
    //方式一：按位置录入参数
    @Query(value = "SELECT p FROM Role p WHERE p.roleId= ?1")
    List<Role> queryByIdUseHql01(Integer roleId);
    //方式二：按名称录入参数
    @Query(value = "SELECT p FROM Role p WHERE p.roleId= :roleId")
    List<Role> queryByIdUseHql02(@Param("roleId") Integer roleId);
    //删除
    @Query(value = "DELETE FROM Role p where p.roleId=:roleId")
    @Modifying
    void deleteById(@Param("roleId") Integer roleId);
}
```

##### 3.修改RoleController.java文件

```java
package cn.ddkk.springdatajpa.controller;
import cn.ddkk.springdatajpa.dao.RoleJpaDao;
import cn.ddkk.springdatajpa.pojo.Jurisdiction;
import cn.ddkk.springdatajpa.pojo.Role;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @Description:cn.ddkk.springdatajpa.controller
 * @Version:1.0
 */
@RestController
@RequestMapping("/role")
public class RoleController {
    @Autowired
    private RoleJpaDao roleJpaDao;
    @GetMapping("/insertRole")
    public Role insertRole(){
        //先将数据库中第二条管理员拿出来
        Role role=new Role();
        role.setRoleName("管理员");
        role.setRoleId(2);
        //将数据库中踢人及禁言功能给予管理员角色
        Jurisdiction jurisdiction1=new Jurisdiction();
        jurisdiction1.setJurisdictionId(1);
        jurisdiction1.setJurisdictionName("踢人");
        Jurisdiction jurisdiction2=new Jurisdiction();
        jurisdiction2.setJurisdictionId(4);
        jurisdiction2.setJurisdictionName("禁言");
        Set<Jurisdiction> set=new HashSet<>();
        set.add(jurisdiction1);
        set.add(jurisdiction2);
        //添加入角色
        role.setJurisdiction(set);
        //这里我说明一下，这里我们用到的是修改的能力，因为之前没考虑好，把类命名成Insert了
        //抱歉，总之这里是把数据库表t_Role中管理员加上权限。
        return this.roleJpaDao.save(role);
    }
    @GetMapping("/selectHqlById")
    public List<Role> selectHqlById(@RequestParam("roleId")Integer roleId){
        return this.roleJpaDao.queryByIdUseHql02(roleId);
    }
    @GetMapping("/deleteHqlById")
    public String deleteHqlById(@RequestParam("roleId")Integer roleId){
        this.roleJpaDao.deleteById(roleId);
        return "删除成功";
    }
}
```

##### 4. 测试

运行程序，浏览器输入：

`http://localhost:8080/role/deleteHqlById?roleId=4`

### 九、小结

关于JPQL的讲解暂且就到这里了，如果大家想深入了解可以自行学习一下，或者亲自试一试，这些其实凭着感觉也能写个差不多，我就是这样的。
