# 09、Spring Data JPA 实战 - 对象导航查询
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/6/9.html
- 分类：ORM框架
- 分组：Spring Data JPA 实战(A)
## 对象导航查询

对象图导航检索方式是根据已经加载的对象，导航到他的关联对象。它利用类与类之间的关系来检索对象。例如：我们通过ID查询方式查出一个客户，可以调用Customer类中的getLinkMans()方法来获取该客户的所有联系人。对象导航查询的使用要求是：两个对象之间必须存在关联关系。

### 延迟加载的方式

```java
/**
* 测试对象导航查询,使用延迟加载方式
*/
@Test
@Transactional(rollbackFor = Exception.class)
public void testObjectQuery(){
    //查询id为1的客户
    Customer customer=this.customerRepository.getOne(31L);
    //对象导航查询，此客户的所有联系人
    Set<LinkMan> linkMans = customer.getLinkMans();
    linkMans.forEach(value-> System.out.println(value));
}
```

**输出**

```java
LinkMan{
     lkmId=4, lkmName='小李', lkmGender='null', lkmPhone='null', lkmMobile='null', lkmEmail='null', lkmPosition='null', lkmMemo='null'}
```

### 立即加载的方式

```java
/**
     * 测试对象导航查询,使用立即加载方式
     */
@Test
@Transactional(rollbackFor = Exception.class)
public void testObjectQueryByFindOne(){
    //查询id为1的客户
    Optional<Customer> oCustomer = this.customerRepository.findOne((root, query, criteriaBuilder) -> {
        //获取比较属性
        Path<Object> custId = root.get("custId");
        //构建查询条件
        Predicate predicate = criteriaBuilder.equal(custId, 31L);
        return predicate;
    });
    Customer customer = oCustomer.get();
    //对象导航查询，此客户的所有联系人
    Set<LinkMan> linkMans = customer.getLinkMans();
    linkMans.forEach(value-> System.out.println(value));
}
```

配置关联对象的加载方式，默认是`LAZY`

**输出**

```java
LinkMan{
     lkmId=4, lkmName='小李', lkmGender='null', lkmPhone='null', lkmMobile='null', lkmEmail='null', lkmPosition='null', lkmMemo='null'}
```

FetchType有两个实例对象`LAZY`和`EAGER`

### 从多的一方查询

```java
/**
 * 测试对象导航查询,使用延迟加载方式,从多的一方查询
 */
@Test
@Transactional(rollbackFor = Exception.class)
public void testObjectQueryByGetOne2(){
    //查询id为1的联系人
    LinkMan linkman = this.linkManRepository.getOne(4L);
    //对象导航查询，此联系人的客户
    Customer customer = linkman.getCustomer();
    System.out.println(customer);
}
```

**输出**

```java
Customer{
 custId=31, custName='百度', custSource='null', custIndustry='null', custLevel='null', custAddress='null', custPhone='null', linkMans=[LinkMan{
 lkmId=4, lkmName='小李', lkmGender='null', lkmPhone='null', lkmMobile='null', lkmEmail='null', lkmPosition='null', lkmMemo='null'}]}
```
