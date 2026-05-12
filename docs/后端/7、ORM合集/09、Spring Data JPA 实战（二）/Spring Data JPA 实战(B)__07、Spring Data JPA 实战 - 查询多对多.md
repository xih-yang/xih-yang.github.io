# 07、Spring Data JPA 实战 - 查询多对多
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/6/16.html
- 分类：ORM框架
- 分组：Spring Data JPA 实战(B)
### 一、必要的前言

上一篇中我们讲述了一对多与多对一查询，这一篇我们来讲多对多，采用的例子还是权限模型中的用户→角色→权限，而多对多就体现在角色与权限上。

***本片教程继续使用上一篇中写好的小Dome***

### 二、创建一个权限类

```java
package cn.ddkk.springdatajpa.pojo;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import javax.persistence.*;
import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;
/**
 * 权限类
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @Description:cn.ddkk.springdatajpa.pojo
 * @Version:1.0
 */
@Entity
@Table(name="t_jurisdiction")
public class Jurisdiction implements Serializable {
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    @Column(name="jurisdictionId")
    private Integer jurisdictionId;
    @Column(name="jurisdictionName")
    private String jurisdictionName;
    @JsonIgnoreProperties("jurisdiction")
    @ManyToMany(mappedBy="jurisdiction")
	private Set<Role> roles =new HashSet<>();
    public Integer getJurisdictionId() {
        return jurisdictionId;
    }
    public void setJurisdictionId(Integer jurisdictionId) {
        this.jurisdictionId = jurisdictionId;
    }
    public String getJurisdictionName() {
        return jurisdictionName;
    }
    public void setJurisdictionName(String jurisdictionName) {
        this.jurisdictionName = jurisdictionName;
    }
    public Set<Role> getRoles() {
        return roles;
    }
    public void setRoles(Set<Role> roles) {
        this.roles = roles;
    }
}
```

上述代码中所有注解我们上一篇都有讲解，这里就不在重复了。

既然为多对多，那我们的角色表也要添加一个承载权限的容器。

### 三、修改角色类

```java
package cn.ddkk.springdatajpa.pojo;
import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;
import javax.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @Description:cn.ddkk.springdatajpa.pojo
 * @Version:1.0
 */
/**
 * 角色类
 *
 * @author a2417
 *
 */
@Entity
@Table(name="t_role")
public class Role implements Serializable {
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    @Column(name="roleId")
    private Integer roleId;
    @Column(name="roleName")
    private String roleName;
    //fetch:懒加载
    @JsonIgnoreProperties("role")
    @OneToMany(mappedBy="role",fetch=FetchType.EAGER)
    private Set<Users> usersList=new HashSet<>();
	@JsonIgnoreProperties("roles")
    @ManyToMany(cascade=CascadeType.PERSIST)
    //@JoinTable:映射中间表,此注解在于多对多时只要添加到两个Class中的一个就行
    //joinColumns:当前表当中的主键连接中间表的外键,中间表有两个外键
    @JoinTable(name="t_role_jurisdiction",joinColumns=@JoinColumn(name="roleId"),inverseJoinColumns=@JoinColumn(name="jurisdictionId"))
    private Set<Jurisdiction> jurisdiction=new HashSet<>();
	public Set<Jurisdiction> getJurisdiction() {
        return jurisdiction;
    }
    public void setJurisdiction(Set<Jurisdiction> jurisdiction) {
        this.jurisdiction = jurisdiction;
    }
    public Set<Users> getUsersList() {
        return usersList;
    }
    public void setUsersList(Set<Users> usersList) {
        this.usersList = usersList;
    }
    public Integer getRoleId() {
        return roleId;
    }
    public void setRoleId(Integer roleId) {
        this.roleId = roleId;
    }
    public String getRoleName() {
        return roleName;
    }
    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }
}
```

需要说明的是`@JoinTable` 注解，多对多关系的维持需要一张中间表作为承载。

运行程序，我们可以看到数据中除了多了个权限表之外还多了一个名为t_role_jurisdiction的中间表：

看到这里大家就应该知道这对应的方式与关系了。

### 四、修改数据库数据

##### 1.这里我们还是使用系统给我们提供的方法做插入，这样显得直观，我们自己配置一下t_jurisdiction表即可。

##### 2.在controller包中添加RoleController.java

```java
import cn.ddkk.springdatajpa.dao.RoleJpaDao;
import cn.ddkk.springdatajpa.pojo.Jurisdiction;
import cn.ddkk.springdatajpa.pojo.Role;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashSet;
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
        //这里我说明一下，这里我们用到的是修改的能力，因为之前没考虑好，把命名成Insert了
        //抱歉，总之这里是把数据库表t_Role中管理员加上权限。
        return this.roleJpaDao.save(role);
    }
}
```

##### 3.测试

运行程序，浏览器输入

`http://localhost:8080/role/insertRole`

### 五、小结

到这里大家应该也能明白了吧，介于前面篇幅太多，这篇就少写点，弄点精髓的。大家能自己看懂理解举一反三即可。本篇教程只查了角色，权限同理。
