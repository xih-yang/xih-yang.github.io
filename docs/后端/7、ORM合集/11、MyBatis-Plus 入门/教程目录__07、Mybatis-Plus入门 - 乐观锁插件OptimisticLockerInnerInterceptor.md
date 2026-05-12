# 07、Mybatis-Plus入门 - 乐观锁插件OptimisticLockerInnerInterceptor
- 来源：https://ddkk.com/zhuanlan/orm/mybatisplus/5/7.html
- 分类：ORM框架
- 分组：教程目录
### 乐观锁

**并发控制**：在计算机科学，特别是程序设计、操作系统、多重处理和数据库等领域，并发控制是确保及时纠正由并发操作导致的错误的一种机制。并发控制的基本单位是事务。数据库管理系统（DBMS）中的并发控制的任务是确保在多个事务同时存取数据库中同一数据时不破坏事务的隔离性和统一性以及数据库的统一性。

**乐观锁(Optimistic Locking)**：乐观锁假设数据一般情况下不会造成冲突，所以在数据进行提交更新的时候，才会正式对数据的冲突与否进行检测，如果发现冲突了，则返回给用户错误的信息，让用户决定如何去做。乐观锁适用于读操作多的场景，这样可以提高程序的吞吐量。

**乐观锁插件机制**：Plus是在数据表中加上一个数据版本号 version 字段，表示数据被修改的次数。当数据被修改时，version 值会+1。当事务A要更新数据值时，在读取数据的同时也会读取 version 值，在提交更新时，会校验刚才读取到的 version 值与当前数据库中的 version 值相等。

```java
@SuppressWarnings({
     "unchecked"})
public class OptimisticLockerInnerInterceptor implements InnerInterceptor {
    private static final String PARAM_UPDATE_METHOD_NAME = "update";
    /**
     *
     * @param executor  Executor(可能是代理对象)
     * @param ms        MappedStatement
     * @param parameter parameter
     * @throws SQLException
     */
    @Override
    public void beforeUpdate(Executor executor, MappedStatement ms, Object parameter) throws SQLException {
        if (SqlCommandType.UPDATE != ms.getSqlCommandType()) {
            return;
        }
        if (parameter instanceof Map) {
            Map<String, Object> map = (Map<String, Object>) parameter;
            doOptimisticLocker(map, ms.getId());
        }
    }
    /**
     *
     * @param map
     * @param msId
     */
    protected void doOptimisticLocker(Map<String, Object> map, String msId) {
        //updateById(et), update(et, wrapper);
        Object et = map.getOrDefault(Constants.ENTITY, null);
        if (et != null) {
            // entity
            String methodName = msId.substring(msId.lastIndexOf(StringPool.DOT) + 1);
            TableInfo tableInfo = TableInfoHelper.getTableInfo(et.getClass());
            if (tableInfo == null || !tableInfo.isWithVersion()) {
                return;
            }
            try {
                TableFieldInfo fieldInfo = tableInfo.getVersionFieldInfo();
                Field versionField = fieldInfo.getField();
                // 旧的 version 值
                Object originalVersionVal = versionField.get(et);
                if (originalVersionVal == null) {
                    return;
                }
                String versionColumn = fieldInfo.getColumn();
                // 新的 version 值
                Object updatedVersionVal = this.getUpdatedVersionVal(fieldInfo.getPropertyType(), originalVersionVal);
                if (PARAM_UPDATE_METHOD_NAME.equals(methodName)) {
                    AbstractWrapper<?, ?, ?> aw = (AbstractWrapper<?, ?, ?>) map.getOrDefault(Constants.WRAPPER, null);
                    if (aw == null) {
                        UpdateWrapper<?> uw = new UpdateWrapper<>();
                        uw.eq(versionColumn, originalVersionVal);
                        map.put(Constants.WRAPPER, uw);
                    } else {
                        aw.apply(versionColumn + " = {0}", originalVersionVal);
                    }
                } else {
                    map.put(Constants.MP_OPTLOCK_VERSION_ORIGINAL, originalVersionVal);
                }
                versionField.set(et, updatedVersionVal);
            } catch (IllegalAccessException e) {
                throw ExceptionUtils.mpe(e);
            }
        }
    }
    /**
     * This method provides the control for version value.<BR>
     * Returned value type must be the same as original one.
     *
     * @param originalVersionVal ignore
     * @return updated version val
     */
    protected Object getUpdatedVersionVal(Class<?> clazz, Object originalVersionVal) {
        if (long.class.equals(clazz) || Long.class.equals(clazz)) {
            return ((long) originalVersionVal) + 1;
        } else if (int.class.equals(clazz) || Integer.class.equals(clazz)) {
            return ((int) originalVersionVal) + 1;
        } else if (Date.class.equals(clazz)) {
            return new Date();
        } else if (Timestamp.class.equals(clazz)) {
            return new Timestamp(System.currentTimeMillis());
        } else if (LocalDateTime.class.equals(clazz)) {
            return LocalDateTime.now();
        }
        //not supported type, return original val.
        return originalVersionVal;
    }
}
```

### 测试案例

**1、** 表添加version列，并设置默认值为1；

**2、** 实体类添加version字段，并添加@Version注解；

```java
@Data
@EqualsAndHashCode(callSuper = false)
public class OrderTbl implements Serializable {
    private static final long serialVersionUID = 1L;
    @TableId(value = "id", type = IdType.AUTO)
    private Integer id;
    private String userId;
    private String commodityCode;
    private Integer count;
    private Integer money;
    private Integer deptId;
    private String tenantId;
    @Version
    private Long version;
}
```

**1、** 配置类添加乐观锁插件；

```java
        // 添加乐观锁插件
        interceptor.addInnerInterceptor(new OptimisticLockerInnerInterceptor());
```

**1、** 正常测试，更新数据时会校验版本号，新旧版本号一致时，表示当前数据未被其他事务更新过，更新通过，版本号自动+1；

```java
@SpringBootTest
public class MybatisPlusTest {
    @Autowired
    OrderTblMapper orderTblMapper;
    @Test
    public void updateLockTest(){
        // 查询一条记录
        OrderTbl orderTbl1 = orderTblMapper.selectById(4896);
        orderTbl1.setMoney(100);
        // 更新
        int i = orderTblMapper.updateById(orderTbl1);
        System.err.println(i);
    }
}
```

**1、** 模拟并发，开启DUG模式，首先查询出这条数据，版本号为2，断点暂停程序执行然后手动修改此条数据的版本为4放行程序，此时更新会校验版本号，但是版本号已经被修改，更新语句执行了，但是返回0，表示此次更新未生效，乐观锁功能验证成功；
