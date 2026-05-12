# 68、HBase访问控制标签（ACL）
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/68.html
- 分类：大数据框架
- 分组：教程目录
## HBase访问控制标签（ACL）

HBase中的ACL基于用户的成员身份或组中的排除，以及给定组访问给定资源的权限。ACL是作为一个称为AccessController的协处理器实现的。

HBase不维护私有组映射，但依赖于Hadoop组映射器，它映射目录中的实体（LDAP或Active Directory）和HBase用户。任何支持的Hadoop组映射器都将起作用。然后，针对资源（全局，名称空间，表格，单元或端点）授予用户特定的权限（读取，写入，执行，创建，管理）。

启用Kerberos和访问控制后，客户端对HBase的访问将得到验证，并且用户数据是专用的，除非明确授予访问权限。

与关系数据库相比，HBase具有更简单的安全模型，特别是在客户端操作方面。例如，插入（新记录）和更新（现有记录）之间没有区别，两者都将折叠为已放置。

### 了解访问级别

HBase访问级别是相互独立授予的，并允许在给定范围内进行不同类型的操作。

- 读取（R） – 可以读取给定范围的数据。
- 写入（W） – 可以在给定范围写入数据。
- 执行（X） – 可以在给定范围内执行协处理器端点。
- 创建（C） – 可以在给定范围内创建表或删除表（甚至不创建它们）。
- 管理员（A） – 可以执行群集操作，例如在给定的范围内平衡群集或分配区域。

可能的范围是：

- 超级用户（Superuser）：Superuser可以执行HBase中可用的任何操作，以访问任何资源。在你的集群上运行HBase的用户就是superuser，就像所有指定给HMaster中的hbase-site.xml的hbase.superuser配置属性。
- 全局（Global）：在全局范围授予的权限允许管理员对集群的所有表进行操作。
- 命名空间（Namespace）：在命名空间范围授予的权限适用于给定名称空间内的所有表。
- 表（Table）：在表范围授予的权限适用于给定表中的数据或元数据。
- ColumnFamily：在ColumnFamily范围内授予的权限适用于该ColumnFamily内的单元格。
- 单元格（Cell）：在单元格范围内授予的权限适用于该确切的单元格坐标（键，值，时间戳）（key, value, timestamp）。这允许政策与数据一起发展。

要更改特定单元格上的ACL，请使用新ACL写入更新后的单元格，以获得原始坐标的精确坐标。

如果您有多版本架构并且想要更新所有可见版本的ACL，则需要为所有可见版本编写新的单元格。该应用程序可以完全控制政策演变。

唯一的例外上述规则append和increment处理。追加和增量可以在操作中携带ACL。如果操作中包含一个，那么它将应用于appendor和increment的结果。否则，保存您正在追加或增加的现有单元的ACL。

访问级别和作用域的组合创建了可授予用户的可能访问级别的矩阵。在生产环境中，根据执行特定工作所需的内容来考虑访问级别很有用。以下列表描述了一些常见类型的HBase用户的适当访问级别。重要的是不要授予比给定用户执行其所需任务所需的更多访问权限。

- 超级用户（Superusers）：在生产系统中，只有HBase用户应具有超级用户访问权限。在开发环境中，管理员可能需要超级用户访问才能快速控制和管理群集。但是，这种类型的管理员通常应该是全局管理员而不是超级用户。
- 全局管理员（Global Admins）：全局管理员可以执行任务并访问HBase中的每个表。在典型的生产环境中，管理员不应具有对表内数据的读取或写入权限。
- 具有管理员权限的全局管理员可以在群集上执行群集范围的操作，例如平衡、分配或取消分配区域或调用明确的主要压缩。这是一个操作角色。
- 具有管理员权限的全局管理员可以创建或删除HBase中的任何表。这更像是一个DBA类型的角色。在生产环境中，不同的用户可能只有一个管理员权限和创建权限。

> 在当前的实现中，具有Admin权限的全局管理员可以在桌上授予自己Read和Write权限并获得对该表的数据的访问权限。出于这个原因，只向实际需要的受信任用户授予全局管理员权限。另请注意，具有Create权限的全局管理员可以在ACL表上执行Put操作，模拟授予或吊销并绕过对全局管理权限的授权检查。由于这些问题，请谨慎授予全局管理员特权。

- 命名空间管理员（Namespace Admins）：具有Create权限的命名空间管理员可以在该命名空间内创建或删除表，并获取和恢复快照。具有Admin权限的名称空间管理员可以对该名称空间内的表执行操作，例如拆分或主要压缩。
- 表管理员（Table Admins）：表管理员只能在该表上执行管理操作。具有Create权限的表管理员可以从该表创建快照或从快照中恢复该表。具有Admin权限的表管理员可以在该表上执行操作：例如拆分或主要压缩。
- 用户（Users）：用户可以读取或写入数据，或两者兼有。如果授予Executable权限，用户还可以执行协处理器端点。

**访问级别的实际示例**

级别
范围
权限
描述

高级管理员

Global

访问，创建

 管理群集并允许访问初级管理员。

初级管理员

Global

创建

创建表并允许访问表管理员。

表管理员

Table

访问

从操作的角度维护一个表格。

数据分析师

Table

读

从HBase数据创建报告。

Web应用程序

Table

读，写

将数据放入HBase并使用HBase数据执行操作。

### 实现细节

单元级ACL使用标签（tag）实现（请参阅[HBase：标签](https://www.w3cschool.cn/hbase_doc/hbase_doc-8svg2oys.html)）。为了使用单元级别的ACL，您必须使用HFile v3和HBase 0.98或更高版本。

**1、** 由HBase创建的文件由运行HBase进程的操作系统用户拥有要与HBase文件交互，您应该使用API或批量加载功能；

**2、** HBase不在HBase内部建立“roles”相反，组名可以被授予权限这允许通过组成员身份对角色进行外部建模通过Hadoop组映射服务在HBase外部创建和操作组；

### 服务器端配置

**1、** 请先参考[基本的服务器端配置](https://www.w3cschool.cn/hbase_doc/hbase_doc-ybm52ove.html)中的步骤；

**2、** 通过在hbase-site.xml中设置以下属性来安装和配置AccessController协处理器这些属性包含一个类的列表；

如果您使用AccessController以及VisibilityController，则AccessController必须首先位于列表中，因为在这两个组件都处于活动状态时，VisibilityController会将其系统表上的访问控制委派给AccessController。有关将两者一起使用的示例，请参阅安全性配置示例。

```java
    <property>
      <name>hbase.security.authorization</name>
      <value>true</value>
    </property>
    <property>
      <name>hbase.coprocessor.region.classes</name>
      <value>org.apache.hadoop.hbase.security.access.AccessController, org.apache.hadoop.hbase.security.token.TokenProvider</value>
    </property>
    <property>
      <name>hbase.coprocessor.master.classes</name>
      <value>org.apache.hadoop.hbase.security.access.AccessController</value>
    </property>
    <property>
      <name>hbase.coprocessor.regionserver.classes</name>
      <value>org.apache.hadoop.hbase.security.access.AccessController</value>
    </property>
    <property>
      <name>hbase.security.exec.permission.checks</name>
      <value>true</value> 
    </property>
```

```java
或者，您可以通过将hbase.rpc.protection设置为privacy来启用传输安全性。这需要HBase 0.98.4或更高版本。
```

**3、** 在Hadoopnamenode的core-site.xml中设置Hadoop组映射器这是一个Hadoop文件，不是HBase文件根据您的网站需求进行定制以下是一个例子：

```java
    <property>
      <name>hadoop.security.group.mapping</name>
      <value>org.apache.hadoop.security.LdapGroupsMapping</value>
    </property>
    <property>
      <name>hadoop.security.group.mapping.ldap.url</name>
      <value>ldap://server</value>
    </property>
    <property>
      <name>hadoop.security.group.mapping.ldap.bind.user</name>
      <value>Administrator@example-ad.local</value>
    </property>
    <property>
      <name>hadoop.security.group.mapping.ldap.bind.password</name>
      <value>****</value>
    </property>
    <property>
      <name>hadoop.security.group.mapping.ldap.base</name>
      <value>dc=example-ad,dc=local</value>
    </property>
    <property>
      <name>hadoop.security.group.mapping.ldap.search.filter.user</name>
      <value>(&(objectClass=user)(sAMAccountName={0}))</value>
    </property>
    <property>
      <name>hadoop.security.group.mapping.ldap.search.filter.group</name>
      <value>(objectClass=group)</value>
    </property>
    <property>
      <name>hadoop.security.group.mapping.ldap.search.attr.member</name>
      <value>member</value>
    </property>
    <property>
      <name>hadoop.security.group.mapping.ldap.search.attr.group.name</name>
      <value>cn</value>
    </property>
```

**4、** 或者，启用早期的评估策略在HBase0.98.0之前，如果用户没有被授予访问列族或至少一个列限定符的权限，则会引发AccessDeniedExceptionHBase0.98.0删除了这个异常，以便允许单元级别的异常授予要恢复HBase0.98.0-0.98.6中的旧行为，请在hbase-site.xml中将hbase.security.access.early_out设置为true在HBase0.98.6中，默认返回true；

**5、** 分发您的配置并重新启动群集以使更改生效；

**6、** 要测试您的配置，请以给定用户身份登录HBaseShell，并使用该whoami命令报告您的用户所属的组在此示例中，用户被报告为该services组的成员；

```java
    hbase> whoami
    service (auth:KERBEROS)
        groups: services
```

### Administration

管理任务可以从HBase Shell或通过API执行。

**1、** 用户和组管理，在您的目录中，用户和组在HBase的外部维护；

**2、** 授予对名称空间，表格，列族或单元格的访问权限；

授权语句有几种不同类型的语法。第一个也是最熟悉的是，表和列族是可选的：

```java
    grant 'user', 'RWXCA', 'TABLE', 'CF', 'CQ'
```

```java
组和用户以相同的方式被授予访问权限，但组前缀有一个@符号。以相同的方式，表和名称空间以相同的方式指定，但名称空间前缀有一个@符号。  
也可以在单个语句中针对同一资源授予多个权限，如本例中所示。第一个子语句将用户映射到ACL，第二个子语句指定资源。  
HBase Shell支持在单元级授予和撤销访问权限用于测试和验证支持，不应将其用于生产使用，因为它不会将权限应用于尚不存在的单元。应用单元级别权限的正确方法是在存储值时在应用程序代码中执行此操作。  
ACL粒度和评估顺序ACL，从最小粒度到最细粒度进行评估，当达到授予权限的ACL时，评估将停止。这意味着单元ACL不会以较小的粒度覆盖ACL。  
**示例-HBase Shell** 
 *  Global：
```

```java
        hbase> grant '@admins', 'RWXCA'
```

```java
 *  Namespace：
```

```java
        hbase> grant'service'，'RWXCA'，'@ test-NS'
```

```java
 *  Table：
```

```java
        hbase> grant 'service', 'RWXCA', 'user'
```

```java
 *  Column Family：
```

```java
        hbase> grant '@developers', 'RW', 'user', 'i'
```

```java
 *  Column Qualifier：
```

```java
        hbase> grant 'service, 'RW', 'user', 'i', 'foo'
```

```java
 *  Cell：授予单元ACL的语法使用以下语法：
```

```java
        grant <table>, \
          { '<user-or-group>' => \
            '<permissions>', ... }, \
          { <scanner-specification> }
```

```java
 *  <user-or-group>是用户名或组名，前缀@为组的情况。
 *  <permissions>是一个包含任何或所有“RWXCA”的字符串，但只有R和W在单元范围内有意义。
 *  <scanner-specification>是'scan'shell命令使用的扫描器（scan）规范语法和约定。有关扫描仪规格的一些示例，请发出以下HBase Shell命令。
```

```java
        hbase> help "scan"
```

```java
    如果您需要启用单元格acl，则hbase-site.xml中的hfile.format.version选项应该大于或等于3，并且hbase.security.access.early\_out选项应设置为false。此示例授予'testuser'用户读取的访问权限以及对'developers'组进行读/写访问，'pii'列中与过滤器匹配的单元格。
```

```java
        hbase> grant 'user', \
          { '@developers' => 'RW', 'testuser' => 'R' }, \ 
          { COLUMNS => 'pii', FILTER => "(PrefixFilter ('test'))" }
```

```java
    shell将运行具有给定条件的扫描器，用新的ACL重写找到的单元格，并将其存储回其确切的坐标。
**示例-API：以下示例显示如何在表级别授予访问权限**
```

```java
    public static void grantOnTable(final HBaseTestingUtility util, final String user,
        final TableName table, final byte[] family, final byte[] qualifier,
        final Permission.Action... actions) throws Exception {
      SecureTestUtil.updateACLs(util, new Callable<Void>() {
        @Override
        public Void call() throws Exception {
          try (Connection connection = ConnectionFactory.createConnection(util.getConfiguration());
               Table acl = connection.getTable(AccessControlLists.ACL_TABLE_NAME)) {
            BlockingRpcChannel service = acl.coprocessorService(HConstants.EMPTY_START_ROW);
            AccessControlService.BlockingInterface protocol =
              AccessControlService.newBlockingStub(service);
            AccessControlUtil.grant(null, protocol, user, table, family, qualifier, false, actions);
          }
          return null;
        }
      });
    }
```

```java
要在单元级别授予权限，可以使用以下Mutation.setACL方法：
```

```java
    Mutation.setACL(String user, Permission perms)
    Mutation.setACL(Map<String, Permission> perms)
```

```java
具体而言，此示例向名为user1的用户提供对特定Put操作中所包含的任何单元格的读取权限：
```

```java
    put.setACL(“user1”, new Permission(Permission.Action.READ))
```

**3、** 从名称空间，表，列系列或单元中撤消访问控制；

revoke命令和API是授权命令API的双胞胎，他们的语法是完全一样的。唯一的例外是您无法撤销单元级别的权限。您只能撤销先前已授予的访问权限，并且revoke语句与显式拒绝资源不同。

HBase Shell支持授予和撤销访问权限用于测试和验证支持，不应将其用于生产使用，因为它不会将权限应用于尚不存在的单元。应用单元级权限的正确方法是在存储值时在应用程序代码中执行此操作。

示例：撤销对表的访问

```java
    public static void revokeFromTable(final HBaseTestingUtility util, final String user,
        final TableName table, final byte[] family, final byte[] qualifier,
        final Permission.Action... actions) throws Exception {
      SecureTestUtil.updateACLs(util, new Callable<Void>() {
        @Override
        public Void call() throws Exception {
          Configuration conf = HBaseConfiguration.create();
          Connection connection = ConnectionFactory.createConnection(conf);
          Table acl = connection.getTable(util.getConfiguration(), AccessControlLists.ACL_TABLE_NAME);
          try {
            BlockingRpcChannel service = acl.coprocessorService(HConstants.EMPTY_START_ROW);
            AccessControlService.BlockingInterface protocol =
                AccessControlService.newBlockingStub(service);
            ProtobufUtil.revoke(protocol, user, table, family, qualifier, actions);
          } finally {
            acl.close();
          }
          return null;
        }
      });
    }
```

**4、** 显示用户的有效权限；

HBase Shell

```java
    hbase> user_permission 'user'
    hbase> user_permission '.*'
    hbase> user_permission JAVA_REGEX
```

**示例-API**

```java
public static void verifyAllowed(User user, AccessTestAction action, int count) throws Exception {
  try {
    Object obj = user.runAs(action);
    if (obj != null && obj instanceof List<?>) {
      List<?> results = (List<?>) obj;
      if (results != null && results.isEmpty()) {
        fail("Empty non null results from action for user '"  user.getShortName()  "'");
      }
      assertEquals(count, results.size());
    }
  } catch (AccessDeniedException ade) {
    fail("Expected action to pass for user '"  user.getShortName()  "' but was denied");
  }
}
```
