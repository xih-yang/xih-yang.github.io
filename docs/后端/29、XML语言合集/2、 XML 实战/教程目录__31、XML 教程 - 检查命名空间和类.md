# 31、XML 教程 - 检查命名空间和类
- 来源：https://ddkk.com/zhuanlan/xml/2/31.html
- 分类：XML语言教程
- 分组：教程目录
类`%XML.Namespaces`提供了两个类方法，可用于检查XML命名空间及其包含的类：

### GetNextClass()

```java
classmethod GetNextClass(namespace As %String, 
            class As %String) as %String
```

返回给定`XML`命名空间中给定类之后的下一个类(按字母顺序)。当没有更多的类时，此方法返回`NULL`。

### GetNextNamespace()

```java
classmethod GetNextNamespace(namespace As %String) as %String
```

返回给定命名空间之后的下一个命名空间(按字母顺序)。当没有更多的命名空间时，此方法返回`NULL`。

在这两种情况下，只考虑当前的InterSystems IRIS命名空间。此外，映射的类也会被忽略。

例如，以下方法列出当前InterSystems IRIS命名空间的XML命名空间及其类：

```java
ClassMethod WriteNamespacesAndClasses()
{
  Set ns=""
  Set ns=##class(%XML.Namespaces).GetNextNamespace(ns)
  While ns '=""
  {
    Write !, "The namespace ",ns, " contains these classes:"
    Set cls=""
    Set cls=##class(%XML.Namespaces).GetNextClass(ns,cls)
    While cls '=""
    {
      Write !, "   ",cls
      Set cls=##class(%XML.Namespaces).GetNextClass(ns,cls)
      }
      Set ns=##class(%XML.Namespaces).GetNextNamespace(ns)
      }
}
```

在终端中执行时，此方法会生成如下所示的输出：

```java
 
The namespace http://www.address.org contains these classes:
   ElRef.NS.Address
   GXML.AddressNS
   MyApp4.Obj.Address
   MyAppNS.AddressNS
   Obj.Attr.Address
   Obj.Ns.Address
   Obj.Ns.AddressClass
The namespace http://www.doctor.com contains these classes:
   GXML.DoctorNS
The namespace http://www.one.org contains these classes:
   GXML.AddressNSOne
   GXML.DoctorNSOne
   GXML.PersonNSOne 
...
```
