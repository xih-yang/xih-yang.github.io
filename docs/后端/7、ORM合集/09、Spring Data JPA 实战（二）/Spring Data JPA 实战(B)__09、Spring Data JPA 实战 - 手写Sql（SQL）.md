# 09、Spring Data JPA 实战 - 手写Sql（SQL）
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/6/18.html
- 分类：ORM框架
- 分组：Spring Data JPA 实战(B)
### 一、必要的前言

上一篇中，我们讲述了如何在SpringDataJpa中使用JPQL语句，但是很多时候我们不会去写这些，为了方便，本篇教程来教大家如何直接在@Query注解中写sql语句。

### 二、修改RoleJpaDao.java文件，增加queryByIdUseSql方法。

```java
import cn.ddkk.springdatajpa.pojo.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
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
    @Query(value = "DELETE  FROM Role p WHERE p.roleId= :roleId")
    @Modifying
    void deleteById(@Param("roleId") Integer roleId);
    //执行对应Sql语句
    @Query(value = "select * from t_role where role_id = ?",nativeQuery = true)
    List<Role> queryByIdUseSql(Integer roleId);
}
```

解读：

**1、**`@Query`注解中有一个`nativeQuery`属性，当它为`true`时，则表示直接执行语句不进行转义；

**2、**`where`后面`role_id`列名不可以写为`roleId`；

**3、** 如果使用删除或修改时也需要增加`@Modifying`注解；

### 三、修改RoleController.java，增加selectSqlById接口

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
    @GetMapping("/selectSqlById")
    public List<Role> selectSqlById(@RequestParam("roleId")Integer roleId){
        return this.roleJpaDao.queryByIdUseSql(roleId);
    }
}
```

### 四、测试

运行程序打开浏览器输入：

`http://localhost:8080/role/selectSqlById?roleId=1`

### 五、小结

到此，SpringDataJpa的基本使用就讲完了，还是建议大家多练习一下，估计用着用着就会发现SpringDataJpa是真的好使。

到这里就结束了，俗话说得好，师父领进门，修行在个人。SpringDataJpa中还有很多其他功能，例如审计投影等，大家可以按需去学习。
